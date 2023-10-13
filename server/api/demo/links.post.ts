import { serverSupabaseClient } from '#supabase/server'
import { Database } from '~/types/type'

import { isValidUrl } from '~/server/utils'
import { ratelimit, setRandomKey } from '~/server/utils/upstash'

export default defineEventHandler(async (event) => {
  const { url } = await readValidatedBody(event, (body: any) => {
    if (!body.url || !isValidUrl(body.url)) {
    // return createError({ statusCode: 400, statusMessage: 'Invalid URL' })
      throw new Error('Invalid URL')
    }
    return body
  }) as { url: string; slug?: string }

  const ip = getRequestIP(event) || '63.141.57.109'
  const { success } = await ratelimit(5, '1 m').limit(ip)
  if (!success) {
    throw createError({ statusCode: 429 })
  }
  const { response, key } = await setRandomKey(url)
  if (response === 'OK') {
    return {
      key, url
    }
  } else {
    throw createError({ statusCode: 500, data: 'Failed to create link' })
  }
})
