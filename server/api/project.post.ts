import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { Database } from '~/types/type'

export default defineEventHandler(async (event) => {
  const { name, slug } = await readBody(event) as { slug?: string, name?: string }
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  console.log('user', user)

  const supabase = await serverSupabaseServiceRole<Database>(event)
  const { status } = await supabase.from('projects').insert({
    name,
    slug,
    owner_id: user.id
  })
  setResponseStatus(event, status)
})
