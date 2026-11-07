import { createError, getRouterParams, type H3Event } from 'h3'
import { enforcePublicClickRateLimit, type RateLimitOptions } from './create-policy'
import { LinkStatsError, queryLinkStats } from './link-stats'

/**
 * Guest home cards can read one number: the lifetime click total for a key.
 * Country, city, device, browser, OS, referer, and timeseries stay on
 * defineLinkStatsRoute, which requires a signed-in session.
 */
export const PUBLIC_CLICK_TOTAL = {
  endpoint: 'clicks',
  interval: 'all'
} as const

export type PublicClickTotal = {
  clicks: number
}

type AnalyticsConfig = Parameters<typeof queryLinkStats>[1]

export async function publicClickTotal (
  event: H3Event,
  options: RateLimitOptions & { analytics?: AnalyticsConfig } = {}
): Promise<PublicClickTotal> {
  await enforcePublicClickRateLimit(event, options)
  const key = readPublicLinkKey(event)
  try {
    const total = await queryLinkStats({
      endpoint: PUBLIC_CLICK_TOTAL.endpoint,
      key,
      interval: PUBLIC_CLICK_TOTAL.interval
    }, options.analytics ?? await configuredAnalytics())
    return { clicks: asPublicTotal(total) }
  } catch (error) {
    if (error instanceof LinkStatsError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message
      })
    }
    throw error
  }
}

async function configuredAnalytics () {
  const { readAnalyticsEngineConfig } = await import('./analytics-engine-config')
  return readAnalyticsEngineConfig()
}

function readPublicLinkKey (event: H3Event) {
  const raw = getRouterParams(event).key
  if (typeof raw !== 'string' || !raw.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
  try {
    return decodeURIComponent(raw)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
}

function asPublicTotal (value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0
  }
  return Math.round(value)
}
