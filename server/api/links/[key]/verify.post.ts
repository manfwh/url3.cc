import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/type'

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key')
  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'key is required' })
  }
  const password = (await readBody(event)).password
  const supabase = serverSupabaseServiceRole<Database>(event)
  const link = await supabase.from('links').select('url, password').eq('key', key).limit(1).maybeSingle() as any
  const validPassword = link.data && link.data.password === password
  return {
    verify: validPassword,
    url: validPassword && link.data.url
  }
})
