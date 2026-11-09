import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/type'
import { readAnalyticsEngineConfig } from './analytics-engine-config'
import { LinkStatsError, queryLinkStats } from './link-stats'
import {
  isGuestLinkExpired,
  resolveGuestClicks,
  type GuestLinkStatus
} from './guest-link'

const GUEST_LINK_COLUMNS = 'key,url,created_at,expires_at,last_visited_at,clicks,visitor_id,visitor_ip,banned_at'

export type GuestLinkRecord = {
  key: string
  url: string | null
  created_at: string
  expires_at: string | null
  last_visited_at: string | null
  clicks: number | null
  visitor_id: string | null
  visitor_ip: string | null
  banned_at: string | null
}

export function toAdminGuestLink (row: GuestLinkRecord, clicks: number, now = Date.now()) {
  return {
    key: row.key,
    url: row.url,
    created_at: row.created_at,
    expires_at: row.expires_at,
    last_visited_at: row.last_visited_at,
    clicks,
    expired: isGuestLinkExpired(row.expires_at, now),
    banned: !!row.banned_at,
    banned_at: row.banned_at,
    visitor_id: row.visitor_id,
    visitor_ip: row.visitor_ip
  }
}

export async function guestClickTotal (key: string, stored: number | null) {
  const config = readAnalyticsEngineConfig()
  if (!config.accountId || !config.apiToken) {
    return resolveGuestClicks(null, stored)
  }
  try {
    const total = await queryLinkStats({
      endpoint: 'clicks',
      key,
      interval: 'all'
    }, config)
    return resolveGuestClicks(typeof total === 'number' ? total : null, stored)
  } catch (error) {
    const status = error instanceof LinkStatsError ? error.statusCode : 'error'
    console.error('guest click total failed', status)
    return resolveGuestClicks(null, stored)
  }
}

async function guestLinks (event: H3Event) {
  return serverSupabaseServiceRole<Database>(event)
}

export async function listGuestLinks (
  event: H3Event,
  page: number,
  pageSize: number,
  search: string,
  status: GuestLinkStatus = 'all'
) {
  const supabase = await guestLinks(event)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  let request = supabase
    .from('links')
    .select(GUEST_LINK_COLUMNS, { count: 'exact' })
    .eq('is_guest', true)
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()
  if (status === 'banned') {
    request = request.not('banned_at', 'is', null)
  } else if (status === 'expired') {
    request = request.is('banned_at', null).lte('expires_at', now)
  } else if (status === 'active') {
    request = request.is('banned_at', null).or(`expires_at.is.null,expires_at.gt."${now}"`)
  }

  if (search) {
    const pattern = `%${search}%`
    request = request.or(`key.ilike."${pattern}",url.ilike."${pattern}"`)
  }

  const { data, error, count } = await request.range(from, to)
  if (error) {
    console.error('admin guest list failed', error.code)
    throw createError({ statusCode: 500, statusMessage: 'Could not list guest links' })
  }

  const rows = (data ?? []) as GuestLinkRecord[]
  const links = await Promise.all(rows.map(async (row) => {
    const clicks = await guestClickTotal(row.key, row.clicks)
    return toAdminGuestLink(row, clicks)
  }))

  return {
    links,
    page,
    pageSize,
    total: count ?? 0,
    query: search
  }
}

export async function loadGuestLink (event: H3Event, key: string) {
  const supabase = await guestLinks(event)
  const { data, error } = await supabase
    .from('links')
    .select(GUEST_LINK_COLUMNS)
    .eq('key', key)
    .eq('is_guest', true)
    .maybeSingle()

  if (error) {
    console.error('admin guest link failed', error.code)
    throw createError({ statusCode: 500, statusMessage: 'Could not load guest link' })
  }
  return data as GuestLinkRecord | null
}
