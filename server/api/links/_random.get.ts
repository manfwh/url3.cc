import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/type'
export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient<Database>(event)
  return getRandomKey(supabase)
})
