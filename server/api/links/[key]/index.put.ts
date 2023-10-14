import {
  S3Client,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { defineAuthHandler } from '~/server/utils/handler'
import { serverSupabaseClient } from '#supabase/server'
import { Database, Tables } from '~/types/type'
import { validateRequest } from '~/server/utils/link'

type RequestBody = Exclude<Tables<'links'>, 'user_id'> & {slug?: string}
export default defineAuthHandler(async (event) => {
  // const params = getRouterParams(event)
  const body = await readValidatedBody(event, validateRequest) as RequestBody
  const supabase = await serverSupabaseClient<Database>(event)
  const { id, ...updateBody } = body
  const { data: link, error: selectErr, status: selectStatus } = await supabase.from('links').select().eq('id', id).single()
  if (selectErr) {
    throw createError({ statusCode: selectStatus, data: 'Error' })
  }
  await deleteImage(link, body)

  const { status, error } = await supabase.from('links').update(updateBody).eq('id', id).select()
  if (error) {
    throw createError({ statusCode: 400, data: 'Update Error' })
  }
  try {
    const response = await redis.set(`short-link:${updateBody.key}`, {
      type: body.type || 'url',
      ...(updateBody.url && { url: encodeURIComponent(updateBody.url!) }),
      ...(body.image && { image: body.image }),
      password: !!body.password,
      ...(body.ios && { ios: body.ios }),
      ...(body.android && { android: body.android }),
      ...(body.ios_image && { ios_image: body.ios_image }),
      ...(body.android_image && { android_image: body.android_image })
    }, {
      xx: true
    })
    if (response !== 'OK') {
      // await supabase.from('links').delete().eq('key', updateBody.key)
      throw createError({ statusCode: 400, data: 'Update Error' })
    }

    sendNoContent(event)
  } catch (error) {
    console.log('update error', error)
    throw createError({ status, statusMessage: 'Update error' })
  }
})

async function deleteImage (link: Tables<'links'>, updateBody: RequestBody) {
  const commands = []

  // Delete Image
  if (link.type === 'image' && updateBody.type === 'url') {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: link.image!
    })
    commands.push(command)
    if (link.android_image) {
      const deleteAndroidImage = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: link.android_image
      })
      commands.push(deleteAndroidImage)
    }
    if (link.ios_image) {
      const deleteIosImage = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: link.ios_image
      })
      commands.push(deleteIosImage)
    }
  }
  if (updateBody.image && link.image && updateBody.image !== link.image) {
    commands.push(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: link.image
    }))
  }
  if (updateBody.android_image && link.android_image && updateBody.android_image !== link.android_image) {
    commands.push(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: link.android_image
    }))
  }
  if (updateBody.ios_image && link.ios_image && updateBody.ios_image !== link.ios_image) {
    commands.push(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: link.ios_image
    }))
  }
  if (commands.length > 0) {
    const S3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.CF_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
      }
    })
    await Promise.all(commands.map(command => S3.send(command)))
  }
}
