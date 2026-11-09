import type { H3Event } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import type { Database } from '#shared/types/type'
import { redis } from '~~/server/utils/upstash'

export type StoredLink = {
  type: string
  url?: string
  image?: string
  password: boolean
}

const KEY_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function isAcceptableKey (key: string) {
  return KEY_PATTERN.test(key)
}

export async function findShortLink (event: H3Event, key: string): Promise<StoredLink | null> {
  if (!isAcceptableKey(key)) { return null }

  try {
    const record = asRecord(await redis.get(`short-link:${key}`))
    if (record) { return normalizeRecord(record) }
  } catch (error) {
    console.log('short link redis read failed', error)
  }

  try {
    const supabase = await serverSupabaseClient<Database>(event)
    const { data } = await supabase
      .from('links')
      .select('key, url, type, image, password')
      .eq('key', key)
      .maybeSingle()
    if (!data) { return null }
    return {
      type: data.type || 'url',
      url: data.url || undefined,
      image: data.image || undefined,
      password: !!data.password
    }
  } catch (error) {
    console.log('short link supabase read failed', error)
    return null
  }
}

export function readStoredUrl (value: unknown) {
  if (typeof value !== 'string' || !value) { return undefined }
  if (value.startsWith('http://') || value.startsWith('https://')) { return value }
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) { return decoded }
  } catch {
    return value
  }
  return value
}

function normalizeRecord (record: Record<string, unknown>): StoredLink {
  return {
    type: typeof record.type === 'string' ? record.type : 'url',
    url: readStoredUrl(record.url),
    image: typeof record.image === 'string' ? record.image : undefined,
    password: record.password === true || (typeof record.password === 'string' && record.password.length > 0)
  }
}

function asRecord (value: unknown): Record<string, unknown> | null {
  if (!value) { return null }
  if (typeof value === 'string') {
    try {
      return asRecord(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (typeof value === 'object') { return value as Record<string, unknown> }
  return null
}
