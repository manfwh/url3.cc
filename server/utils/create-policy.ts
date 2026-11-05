import type { H3Event } from 'h3'
import { checkUrlSafety } from '~/utils/url-safety'
import { ratelimit } from '~/server/utils/upstash'

type LimitResult = {
  success: boolean
  pending?: Promise<unknown>
}

export function assertLocalDestination (url: string) {
  const result = checkUrlSafety(url)
  if (!result.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsafe URL',
      data: {
        code: 'unsafe_url',
        reason: result.reason
      }
    })
  }
  return result.url.toString()
}

export async function enforceCreateRateLimit (event: H3Event, role: 'guest' | 'user', userId?: string | null) {
  if (role === 'user') {
    if (!userId) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized', data: { code: 'unauthorized' } })
    }
    const allowed = await consumeLimit(`user:${userId}:day`, 30, '1 d')
    if (!allowed) { throw rateLimitError('30/day') }
    return
  }

  const ip = getRequestIP(event) || 'unknown'
  const hour = await limitOnce(`guest:${ip}:hour`, 3, '1 h')
  const day = await limitOnce(`guest:${ip}:day`, 10, '1 d')
  if (!hour) { throw rateLimitError('3/hour') }
  if (!day) { throw rateLimitError('10/day') }
}

export async function enforceReportRateLimit (event: H3Event) {
  const ip = getRequestIP(event) || 'unknown'
  const allowed = await consumeLimit(`report:${ip}:hour`, 5, '1 h')
  if (!allowed) { throw rateLimitError('5/hour') }
}

function rateLimitError (limit: '3/hour' | '10/day' | '30/day' | '5/hour') {
  return createError({
    statusCode: 429,
    statusMessage: 'Too Many Requests',
    data: {
      code: 'rate_limited',
      limit
    }
  })
}

async function consumeLimit (
  id: string,
  requests: number,
  window: '1 h' | '1 d'
) {
  return limitOnce(id, requests, window)
}

async function limitOnce (
  id: string,
  requests: number,
  window: '1 h' | '1 d'
) {
  const result = await ratelimit(requests, window).limit(id) as LimitResult
  if (result.pending) { await result.pending }
  return result.success
}
