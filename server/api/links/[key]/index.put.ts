import { defineAuthHandler } from '~/server/utils/handler'
import { serverSupabaseClient } from '#supabase/server'
import { Database, Tables } from '~/types/type'

type RequestBody = Exclude<Tables<'links'>, 'id' | 'user_id'> & {slug?: string}
export default defineAuthHandler(async (event) => {
  const params = getRouterParams(event)
  const body = await readBody<RequestBody>(event)
  const supabase = await serverSupabaseClient<Database>(event)
  const { id, ...updateBody } = body
  const { status, error, data } = await supabase.from('links').update(updateBody).eq('id', id).select()
  if (error) {
    console.log('update link error', error)
    throw createError({ statusCode: 400, data: 'Update Error' })
  }
  try {
    console.log('updateBody', updateBody)
    const response = await redis.set(`short-link:${updateBody.key}`, {
      url: encodeURIComponent(updateBody.url!),
      password: !!body.password,
      ...(updateBody.ios && { ios: updateBody.ios }),
      ...(updateBody.android && { android: updateBody.android })
    }, {
      xx: true
    })
    if (response !== 'OK') {
      console.log('response', response)
      // await supabase.from('links').delete().eq('key', updateBody.key)
      throw createError({ statusCode: 400, data: 'Update Error' })
    }

    sendNoContent(event)
  } catch (error) {
    console.log('update error', error)
    throw createError({ status, statusMessage: 'Update error' })
  }
})
