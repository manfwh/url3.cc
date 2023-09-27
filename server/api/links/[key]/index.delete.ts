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
  const res = await redis.del(`short-link:${key}`)
  console.log('res', res)

  const { status, error } = await supabase.from('links').delete().eq('key', key)
  if (error) {
    console.log('error', error)
    throw createError({ statusCode: status, statusMessage: error.message })
  } else {
    sendNoContent(event)
  }
})
