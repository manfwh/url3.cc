import {
  S3Client,
  DeleteObjectCommand
} from '@aws-sdk/client-s3'
import { serverSupabaseClient } from '#supabase/server'
import { Database } from '~/types/type'
import { redis } from '~/server/utils/upstash'

export default defineAuthHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, message: 'key is required' })
  }
  const link = await supabase.from('links').select().eq('key', key).eq('user_id', event.context.session.user.id).single()
  if (!link.data) {
    throw createError({ statusCode: 404, message: 'link not found' })
  }
  await redis.del(`short-link:${key}`)

  const { status, error } = await supabase.from('links').delete().eq('key', key)
  if (error) {
    console.log('error', error)
    throw createError({ statusCode: status, statusMessage: error.message })
  } else {
    const commands = []
    if (link.data.image) {
      commands.push(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: link.data.image
      }))
    }
    if (link.data.android_image) {
      commands.push(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: link.data.android_image
      }))
    }
    if (link.data.ios_image) {
      commands.push(new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: link.data.ios_image
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
      try {
        await Promise.all(commands.map(command => S3.send(command)))
      } catch (error) {
        console.warn('Delete Link Image Error:', error)
      }
    }
    sendNoContent(event)
  }
})
