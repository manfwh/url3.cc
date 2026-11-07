import { defineLinkStatsRoute } from '~/server/utils/link-stats-route'

// Signed-in totals for every interval. Lifetime totals for the home card are
// served by /api/public/links/:key/clicks, which cannot read other stats.
export default defineLinkStatsRoute('clicks')
