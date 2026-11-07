import { createError, getQuery, getRouterParams, type H3Event } from 'h3'
import { defineAuthHandler } from './handler'
import { readAnalyticsEngineConfig } from './analytics-engine-config'
import {
  LinkStatsError,
  queryLinkStats,
  type LinkStatsEndpoint
} from './link-stats'

export function defineLinkStatsRoute <E extends LinkStatsEndpoint> (endpoint: E) {
  return defineAuthHandler(async (event) => {
    const { interval } = getQuery(event)
    try {
      return await queryLinkStats({
        endpoint,
        key: readLinkKey(event),
        interval
      }, readAnalyticsEngineConfig())
    } catch (error) {
      if (error instanceof LinkStatsError) {
        throw createError({
          statusCode: error.statusCode,
          statusMessage: error.message
        })
      }
      throw error
    }
  })
}

function readLinkKey (event: H3Event) {
  const key = getRouterParams(event).key
  if (!key) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid stats request' })
  }
  try {
    return decodeURIComponent(key)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid key' })
  }
}
