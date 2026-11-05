import { nanoid } from '~/server/utils'
import { enforceReportRateLimit } from '~/server/utils/create-policy'
import { findShortLink, isAcceptableKey } from '~/server/utils/short-link'
import { redis } from '~/server/utils/upstash'

const REASONS = ['phishing', 'malware', 'spam', 'other'] as const

export default defineEventHandler(async (event) => {
  const key = getRouterParam(event, 'key') || ''
  if (!isAcceptableKey(key)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', data: { code: 'not_found' } })
  }

  const body = await readBody(event) as { reason?: unknown, details?: unknown }
  const reason = body?.reason
  if (typeof reason !== 'string' || !REASONS.includes(reason as typeof REASONS[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid report',
      data: { code: 'invalid_report' }
    })
  }
  const details = typeof body?.details === 'string' ? body.details.trim().slice(0, 500) : ''

  await enforceReportRateLimit(event)

  const link = await findShortLink(event, key)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found', data: { code: 'not_found' } })
  }

  const id = nanoid()
  const report = {
    id,
    key,
    reason,
    details,
    createdAt: new Date().toISOString()
  }
  await redis.rpush(`link-report:${key}`, JSON.stringify(report))

  setResponseStatus(event, 201)
  return { ok: true, id }
})
