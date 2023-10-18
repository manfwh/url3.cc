import {
  S3Client,
  CopyObjectCommand
} from '@aws-sdk/client-s3'

import { isValidUrl } from '~/server/utils'
import { ratelimit, setRandomKey } from '~/server/utils/upstash'

export default defineEventHandler(async (event) => {
  const { url, ...body } = await readValidatedBody(event, (body: any) => {
    if (body.type === 'image') {
      if (!body.image) {
        throw new Error('Miss Image')
      }
    } else if (!body.url || !isValidUrl(body.url)) {
      // return createError({ statusCode: 400, statusMessage: 'Invalid URL' })
      throw new Error('Invalid URL')
    }
    return body
  }) as { url: string; slug?: string, type?: string, image?: string }

  const ip = getRequestIP(event) || '63.141.57.109'
  const { success } = await ratelimit(5, '1 m').limit(ip)
  if (!success) {
    throw createError({ statusCode: 429 })
  }
  if (body.type === 'image' && body.image) {
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CF_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
      }
    })
    const destKey = body.image.replace('_nocheck_', '')
    const commands = []
    const copyImagecommand = new CopyObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      CopySource: process.env.S3_BUCKET_NAME! + '/' + body.image,
      Key: destKey
    })
    commands.push(copyImagecommand)
    await Promise.all(commands.map(command => S3.send(command)))
    body.image = destKey
  }
  const { response, key } = await setRandomKey({
    type: body.type || 'link',
    url,
    image: body.image
  })
  if (response === 'OK') {
    return {
      key, url
    }
  } else {
    throw createError({ statusCode: 500, data: 'Failed to create link' })
  }
})
