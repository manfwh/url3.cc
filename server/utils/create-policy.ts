import { createError, getRequestIP, type H3Event } from 'h3'
import { checkUrlSafety } from '../../shared/utils/url-safety'
import {
  destinationRejection,
  normalizeDestinationFields,
  screenDestinationFields,
  type DestinationFields,
  type NormalizedDestinations
} from './safe-browsing'

type LimitResult = {
  success: boolean
  pending?: Promise<unknown>
}

type LimitWindow = '1 m' | '1 h' | '1 d'

type LimitConsume = (
  id: string,
  requests: number,
  window: LimitWindow
) => Promise<boolean>

export type RateLimitOptions = {
  consume?: LimitConsume
}

type ClientError = {
  statusCode: number
  statusMessage: string
  data?: unknown
}

function throwClientError (input: ClientError): never {
  throw createError(input)
}

export function assertLocalDestination (url: string) {
  const result = checkUrlSafety(url)
  if (!result.ok) {
    throwClientError(destinationRejection(result.reason))
  }
  return result.url.toString()
}

export function requireLocalDestinations (fields: DestinationFields) {
  const local = normalizeDestinationFields(fields)
  if (!local.ok) {
    throwClientError(destinationRejection(local.reason))
  }
  return local
}

export async function requireSafeBrowsing (fields: NormalizedDestinations) {
  const screened = await screenDestinationFields(fields)
  if (!screened.ok) {
    throwClientError(destinationRejection(screened.reason))
  }
  return screened
}

// h3 1.11 returns the socket peer unless xForwardedFor is set. On Vercel that
// peer is the local proxy (127.0.0.1). Vercel overwrites x-forwarded-for with
// the connecting client, so the first entry is a per-client rate-limit key.
function requestIp (event: H3Event) {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

export async function enforceCreateRateLimit (
  event: H3Event,
  role: 'guest' | 'user',
  userId?: string | null,
  options: RateLimitOptions = {}
) {
  const consume = options.consume ?? limitOnce
  if (role === 'user') {
    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized', data: { code: 'unauthorized' } })
    }
    const allowed = await consume(`user:${userId}:day`, 30, '1 d')
    if (!allowed) { throw rateLimitError('30/day') }
    return
  }

  const ip = requestIp(event)
  const hour = await consume(`guest:${ip}:hour`, 3, '1 h')
  const day = await consume(`guest:${ip}:day`, 10, '1 d')
  if (!hour) { throw rateLimitError('3/hour') }
  if (!day) { throw rateLimitError('10/day') }
}

export async function enforceReportRateLimit (event: H3Event, options: RateLimitOptions = {}) {
  const consume = options.consume ?? limitOnce
  const ip = requestIp(event)
  const allowed = await consume(`report:${ip}:hour`, 5, '1 h')
  if (!allowed) { throw rateLimitError('5/hour') }
}

// The home card refreshes a lifetime total about every 20s while the tab is
// visible. 30/minute stops a tight loop; 240/hour covers that refresh for one
// client and caps key guessing against Analytics Engine. Same forwarded IP as
// guest creates.
export async function enforcePublicClickRateLimit (event: H3Event, options: RateLimitOptions = {}) {
  const consume = options.consume ?? limitOnce
  const ip = requestIp(event)
  const minute = await consume(`public-clicks:${ip}:minute`, 30, '1 m')
  if (!minute) { throw rateLimitError('30/minute') }
  const hour = await consume(`public-clicks:${ip}:hour`, 240, '1 h')
  if (!hour) { throw rateLimitError('240/hour') }
}

function rateLimitError (limit: '3/hour' | '10/day' | '30/day' | '5/hour' | '30/minute' | '240/hour') {
  return createError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    data: {
      code: 'rate_limited',
      limit
    }
  })
}

async function limitOnce (
  id: string,
  requests: number,
  window: LimitWindow
) {
  const { ratelimit } = await import('./upstash')
  const result = await ratelimit(requests, window).limit(id) as LimitResult
  if (result.pending) { await result.pending }
  return result.success
}
