import { getQuery, getRouterParam } from 'h3'
import { defineAdminHandler } from '~~/server/utils/admin-handler'
import { readAnalyticsEngineConfig } from '~~/server/utils/analytics-engine-config'
import { loadGuestLink } from '~~/server/utils/guest-link-admin'
import { assertGuestLinkKey } from '~~/server/utils/guest-link'
import { LinkStatsError, queryLinkStats } from '~~/server/utils/link-stats'

export default defineAdminHandler(async (event) => {
  const key = assertGuestLinkKey(getRouterParam(event, 'key'))
  const endpoint = getRouterParam(event, 'endpoint')
  if (!endpoint) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid stats request' })
  }
  const row = await loadGuestLink(event, key)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const { interval } = getQuery(event)
  try {
    return await queryLinkStats({
      endpoint,
      key: row.key,
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