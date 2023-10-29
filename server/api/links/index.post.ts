import {
  S3Client,
  CopyObjectCommand
} from '@aws-sdk/client-s3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import type { Database, Tables } from '~/types/type'

import { validateRequest, isBlackDomain } from '~/server/utils/link'
import { redis } from '~/server/utils/upstash'
import { defineAuthHandler } from '~/server/utils/handler'

type RequestBody = Exclude<Tables<'links'>, 'id' | 'user_id'> & {slug?: string}
export default defineAuthHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  const { url, slug, ...body } = await readValidatedBody(event, validateRequest) as RequestBody

  if (url && isBlackDomain(url)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }
  // no project
  if (!slug) {
    const key = body.key || await getRandomKey(supabase)

    // 检查key是否存在

    const link = await supabase.from('links').select('id').eq('key', key).single()

    if (link.data) {
      throw createError({ statusCode: 400, data: 'Invalid key' })
    }
    // 检查project是否是自己的
    if (body.project_id) {
      const project = await supabase.from('projects').select('id').eq('owner_id', event.context.session.user.id).eq('id', body.project_id).single()
      if (project.error) {
        throw createError({ statusCode: 400, data: 'Invalid project_id' })
      }
    }
    // 删除图片前缀_nocjeck_
    await copyImage(body)
    const { status, error } = await supabase.from('links').insert({
      ...body,
      ...(url && { url }),
      key,
      user_id: event.context.session.user.id
    })
    if (error) {
      console.log('create link error', error)
      throw createError({ statusCode: 400, data: 'Create Error' })
    }
    try {
      const response = await redis.set(`short-link:${key}`, {
        type: body.type || 'url',
        ...(url && { url: encodeURIComponent(url!) }),
        ...(body.image && { image: body.image }),
        password: !!body.password,
        ...(body.ios && { ios: body.ios }),
        ...(body.android && { android: body.android }),
        ...(body.ios_image && { ios_image: body.ios_image }),
        ...(body.android_image && { android_image: body.android_image })
      }, {
        nx: true
      })
      if (response !== 'OK') {
        await supabase.from('links').delete().eq('key', key)
        throw createError({ statusCode: 500, data: 'Create Error' })
      }

      setResponseStatus(event, status)
    } catch (error) {
      throw createError({ statusCode: 500, data: 'Create Error' })
    }
  } else {
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, data: 'Unauthorized' })
    }
    const { data: project } = await supabase.from('projects').select('*').eq('slug', slug).limit(1).maybeSingle()

    if (!project) {
      throw createError({ statusCode: 404, data: 'Project not found' })
    }
    if (project?.owner_id !== user.id) {
      throw createError({ statusCode: 403, data: 'Unauthorized' })
    }
    const key = await getRandomKey(supabase)
    const [res] = await Promise.all([
      supabase.from('links').insert({
        project_id: project.id,
        url,
        // user_id: user.id,
        key
      }),
      redis.set(`short-link:${key}`, {
        url
      }, {
        nx: true
      })
    ])
    return res
  }
})

async function copyImage (body: Partial<RequestBody>) {
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
    if (body.android_image) {
      const copyAndroidImagecommand = new CopyObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        CopySource: process.env.S3_BUCKET_NAME! + '/' + body.android_image,
        Key: destKey
      })
      commands.push(copyAndroidImagecommand)
    }
    if (body.ios_image) {
      const copyIosImagecommand = new CopyObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        CopySource: process.env.S3_BUCKET_NAME! + '/' + body.ios_image,
        Key: destKey
      })
      commands.push(copyIosImagecommand)
    }
    await Promise.all(commands.map(command => S3.send(command)))
    body.image = destKey
  }
}
