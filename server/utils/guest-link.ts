import type { Database } from '../../shared/types/type'
import { normalizeVisitorId } from '../../shared/utils/visitor-id'

export const GUEST_LINK_PAGE_SIZE = 20

type GuestLinkInsert = Database['public']['Tables']['links']['Insert']

export function omitGuestAdminFields<T extends object> (body: T) {
  const copy = { ...body } as Record<string, unknown>
  delete copy.is_guest
  delete copy.visitor_id
  delete copy.visitor_ip
  delete copy.expires_at
  delete copy.last_visited_at
  delete copy.banned_at
  return copy as Omit<T, 'is_guest' | 'visitor_id' | 'visitor_ip' | 'expires_at' | 'last_visited_at' | 'banned_at'>
}

export function visitorIdFromRequest (bodyValue: unknown, cookieValue: unknown) {
  return normalizeVisitorId(bodyValue) || normalizeVisitorId(cookieValue)
}

export function guestVisitorIp (ip: string | null | undefined) {
  if (!ip) { return null }
  const value = ip.trim()
  if (!value || value === 'unknown' || value.length > 64) { return null }
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code <= 32 || code === 127) { return null }
  }
  return value
}

export function guestLinkInsert (input: {
  key: string
  url: string
  expiresAt: string | null
  visitorId: string | null
  visitorIp: string | null
}): GuestLinkInsert {
  return {
    key: input.key,
    url: input.url,
    type: 'url',
    user_id: null,
    is_guest: true,
    expires_at: input.expiresAt,
    visitor_id: input.visitorId,
    visitor_ip: guestVisitorIp(input.visitorIp),
    clicks: 0
  }
}

export type GuestLinkWriteResult = {
  error: { code?: string } | null
}

export async function recordGuestLink (
  insert: (row: GuestLinkInsert) => PromiseLike<GuestLinkWriteResult>,
  row: GuestLinkInsert
) {
  try {
    const { error } = await insert(row)
    if (error) {
      console.error('guest link dual-write failed', error.code || 'error')
    }
  } catch (error) {
    console.error('guest link dual-write failed', error instanceof Error ? error.name : 'error')
  }
}

export function guestLinkSearch (value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') { return '' }
  return raw.trim().replace(/[%_*,()\\'"]/g, '').replace(/\s+/g, ' ').slice(0, 120)
}

export type GuestLinkStatus = 'all' | 'active' | 'banned' | 'expired'

export function guestLinkStatus (value: unknown): GuestLinkStatus {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'active' || raw === 'banned' || raw === 'expired') { return raw }
  return 'all'
}

export function guestLinkPage (value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  const page = typeof raw === 'number' ? raw : Number(raw)
  if (!Number.isInteger(page) || page < 1) { return 1 }
  return Math.min(page, 10_000)
}

export function isGuestLinkExpired (expiresAt: string | null, now = Date.now()) {
  if (!expiresAt) { return false }
  const time = Date.parse(expiresAt)
  if (Number.isNaN(time)) { return false }
  return time <= now
}

export function resolveGuestClicks (analyticsTotal: number | null, stored: number | null) {
  if (typeof analyticsTotal === 'number' && Number.isFinite(analyticsTotal)) {
    return Math.max(0, Math.round(analyticsTotal))
  }
  if (typeof stored === 'number' && Number.isFinite(stored) && stored > 0) {
    return Math.round(stored)
  }
  return 0
}

export function assertGuestLinkKey (value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !raw.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
  let key = raw.trim()
  try {
    key = decodeURIComponent(key)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
  if (!/^[0-9A-Za-z_-]{1,64}$/.test(key)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
  return key
}
