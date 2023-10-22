import { customAlphabet } from 'nanoid'
import { type H3Event, type EventHandlerRequest } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/type'

export const isValidUrl = (url: string) => {
  try {
    // eslint-disable-next-line no-new
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

export const nanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  7
) // 7-character random string

export const parse = (event: H3Event<EventHandlerRequest>) => {
  const domain = getRequestHost(event)
  const url = getRequestURL(event)
  const path = url.pathname

  const query = getQuery(event)
  const searchParams = new URLSearchParams(query as {}).toString()
  const fullPath = `${path}${
    searchParams.length > 0 ? `?${searchParams}` : ''
  }`
  const key = decodeURIComponent(path.split('/')[1])
  const fullKey = decodeURIComponent(path.slice(1))
  return {
    domain,
    path,
    fullPath,
    key,
    fullKey

  }
}

export const getFinalUrl = (target: string, event: H3Event<EventHandlerRequest>) => {
  const query = getQuery(event)
  const searchParams = new URLSearchParams(query as {}).toString()
  const targetUrl = new URL(decodeURIComponent(target))
  for (const [key, value] of searchParams) {
    targetUrl.searchParams.set(key, value)
  }
  const finalUrl = targetUrl.toString()

  return finalUrl
}

export const HOME_HOSTNAMES = new Set([
  'home.localhost:3000',
  'localhost'
])
export const isHomeHostname = (domain: string) => {
  return HOME_HOSTNAMES.has(domain)
}

export const APP_HOSTNAMES = new Set([
  'localhost:3000',
  'localhost'
])

export async function getRandomKey (supabase: Awaited<ReturnType<typeof serverSupabaseClient<Database>>>, domain?: string): Promise<string> {
  /* recursively get random key till it gets one that's available */
  const key = nanoid()
  const response = await supabase.from('links').select('*').eq('key', key).limit(1).maybeSingle()

  if (response.data) {
    // by the off chance that key already exists
    return getRandomKey(supabase, domain)
  } else {
    return key
  }
}
