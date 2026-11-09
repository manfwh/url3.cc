import { publicClickTotal } from '~~/server/utils/public-click-total'

// Unauthenticated lifetime click total. Timeseries and dimension stats stay on
// the authenticated /api/links/:key/stats/* routes.
export default defineEventHandler((event) => {
  setResponseHeader(event, 'cache-control', 'no-store')
  return publicClickTotal(event)
})
