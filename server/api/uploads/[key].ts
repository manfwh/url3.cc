import {
  S3Client,
  PutObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export default defineEventHandler(async (event) => {
  let key = getRouterParam(event, 'key')
  const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CF_ACCOUNT_ID!}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    }
  })
  key = `assets/_nocheck_${key}`
  const url = await getSignedUrl(S3, new PutObjectCommand({
    Bucket: 'url3-cc',
    Key: key
  }), { expiresIn: 3600 })
  return {
    url,
    key
  }
})
