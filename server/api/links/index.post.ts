import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'
import { Database, Tables } from '~/types/type'

import { isValidUrl } from '~/server/utils'
import { redis } from '~/server/utils/upstash'
import { defineAuthHandler } from '~/server/utils/handler'

type RequestBody = Exclude<Tables<'links'>, 'id' | 'user_id'> & {slug?: string}
export default defineAuthHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  // supabase.from('links').update('clicks',)
  const { url, slug, ...body } = await readValidatedBody(event, (body: any) => {
    if (body.type === 'url' && (!body.url || !isValidUrl(body.url))) {
      throw new Error('Invalid URL')
    }
    if (body.type === 'image' && !body.image) {
      throw new Error('Missing image')
    }
    // if (!body.key) {
    //   throw new Error('Missing key')
    // }
    if (body.key && body.key.includes('/')) {
      throw new Error('Invalid key')
    }
    // 去掉前后斜杠
    // const key = body.key.replace(/^\/+|\/+$/g, '')
    // if (key.length === 0) {
    //   throw new Error('Invalid key')
    // }
    return body
  }) as RequestBody

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
    const { status, error } = await supabase.from('links').insert({
      ...body,
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
        throw createError({ statusCode: 400, data: 'Create Error' })
      }

      setResponseStatus(event, status)
    } catch (error) {

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
        user_id: user.id,
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
