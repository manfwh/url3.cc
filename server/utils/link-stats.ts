import type { IntervalProps } from '../../lib/stats'

/**
 * Click points written by the redirect Worker (binding CLICK_EVENTS,
 * dataset click_events). Counts use SUM(_sample_interval). index1 is the
 * sampling key and may be truncated to 96 bytes. blob20 keeps the full link
 * key, and reads filter on blob20 so the key match stays exact. Tinybird
 * history is not imported.
 */
export const CLICK_EVENTS_SCHEMA = {
  binding: 'CLICK_EVENTS',
  dataset: 'click_events',
  indexes: {
    index1: 'key'
  },
  fullKey: 'blob20',
  blobs: {
    blob1: 'country',
    blob2: 'city',
    blob3: 'region',
    blob4: 'latitude',
    blob5: 'longitude',
    blob6: 'ua',
    blob7: 'browser',
    blob8: 'browser_version',
    blob9: 'engine',
    blob10: 'engine_version',
    blob11: 'os',
    blob12: 'os_version',
    blob13: 'device',
    blob14: 'device_vendor',
    blob15: 'device_model',
    blob16: 'cpu_architecture',
    blob17: 'bot',
    blob18: 'referer',
    blob19: 'referer_url',
    blob20: 'key'
  }
} as const

export const LINK_STATS_ENDPOINTS = [
  'clicks',
  'timeserirs',
  'country',
  'city',
  'device',
  'browser',
  'os',
  'referer'
] as const

export type LinkStatsEndpoint = typeof LINK_STATS_ENDPOINTS[number]

export type LinkStatsGranularity = 'minute' | 'hour' | 'day' | 'month'

export type TimeseriesStat = { start: string, clicks: number }
export type CountryStat = { country: string, clicks: number }
export type CityStat = { city: string, country: string, clicks: number }
export type DeviceStat = { device: string, clicks: number }
export type BrowserStat = { browser: string, clicks: number }
export type OsStat = { os: string, clicks: number }
export type RefererStat = { referer: string, clicks: number }

export type LinkStatsByEndpoint = {
  clicks: number
  timeserirs: TimeseriesStat[]
  country: CountryStat[]
  city: CityStat[]
  device: DeviceStat[]
  browser: BrowserStat[]
  os: OsStat[]
  referer: RefererStat[]
}

export type LinkStatsResult = LinkStatsByEndpoint[LinkStatsEndpoint]

export type LinkStatsWindow = {
  start: Date
  end: Date
  granularity: LinkStatsGranularity
}

const ALL_START = new Date('2022-09-22T00:00:00.000Z')
const DAY_MS = 24 * 60 * 60 * 1000

const INTERVAL_MS: Record<Exclude<IntervalProps, 'all'>, number> = {
  '1h': 60 * 60 * 1000,
  '24h': DAY_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
  '90d': 90 * DAY_MS
}

const GRANULARITY: Record<IntervalProps, LinkStatsGranularity> = {
  '1h': 'minute',
  '24h': 'hour',
  '7d': 'day',
  '30d': 'day',
  '90d': 'month',
  all: 'month'
}

const BUCKET_SQL: Record<LinkStatsGranularity, string> = {
  minute: 'toStartOfMinute(timestamp)',
  hour: 'toStartOfHour(timestamp)',
  day: 'toStartOfDay(timestamp)',
  month: 'toStartOfMonth(timestamp)'
}

const DIMENSION_ENDPOINTS: Record<Exclude<LinkStatsEndpoint, 'clicks' | 'timeserirs'>, readonly string[]> = {
  country: ['country'],
  city: ['city', 'country'],
  device: ['device'],
  browser: ['browser'],
  os: ['os'],
  referer: ['referer']
}

const DATASET_NAME = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/
const ACCOUNT_ID = /^[a-f0-9]{32}$/i
const MAX_BUCKETS = 2000
const BREAKDOWN_LIMIT = 1000

export class LinkStatsError extends Error {
  statusCode: number

  constructor (statusCode: number, message: string) {
    super(message)
    this.name = 'LinkStatsError'
    this.statusCode = statusCode
  }
}

export function linkStatsWindow (interval: IntervalProps, now: Date): LinkStatsWindow {
  const end = new Date(now.getTime())
  if (interval === 'all') {
    return { start: new Date(ALL_START.getTime()), end, granularity: GRANULARITY.all }
  }
  return {
    start: new Date(end.getTime() - INTERVAL_MS[interval]),
    end,
    granularity: GRANULARITY[interval]
  }
}

export function buildLinkStatsQuery (input: {
  endpoint: LinkStatsEndpoint
  key: string
  dataset: string
  window: LinkStatsWindow
}): string {
  const dataset = assertDataset(input.dataset)
  const keyLiteral = sqlString(assertKey(input.key))
  const fullKey = CLICK_EVENTS_SCHEMA.fullKey
  const where = [
    `(${fullKey} = ${keyLiteral} OR (${fullKey} = '' AND index1 = ${keyLiteral}))`,
    `timestamp >= ${sqlDateTime(input.window.start)}`,
    `timestamp < ${sqlDateTime(new Date(input.window.end.getTime() + 1000))}`
  ]

  if (input.endpoint === 'clicks') {
    return selectStatement([
      'SELECT SUM(_sample_interval) AS clicks',
      `FROM ${dataset}`,
      `WHERE ${where.join(' AND ')}`
    ])
  }

  if (input.endpoint === 'timeserirs') {
    const bucket = BUCKET_SQL[input.window.granularity]
    return selectStatement([
      `SELECT ${bucket} AS start, SUM(_sample_interval) AS clicks`,
      `FROM ${dataset}`,
      `WHERE ${where.join(' AND ')}`,
      `GROUP BY ${bucket}`,
      `ORDER BY ${bucket} ASC`,
      `LIMIT ${MAX_BUCKETS}`
    ])
  }

  const dimensions = DIMENSION_ENDPOINTS[input.endpoint]
  const selects = dimensions.map(dimension => `${blobColumn(dimension)} AS ${dimension}`)
  const groups = dimensions.map(dimension => blobColumn(dimension))
  const primary = groups[0]
  if (!primary) {
    throw new LinkStatsError(500, 'Analytics dimension is not mapped')
  }
  where.push(`${primary} != ''`)
  return selectStatement([
    `SELECT ${selects.join(', ')}, SUM(_sample_interval) AS clicks`,
    `FROM ${dataset}`,
    `WHERE ${where.join(' AND ')}`,
    `GROUP BY ${groups.join(', ')}`,
    'ORDER BY clicks DESC',
    `LIMIT ${BREAKDOWN_LIMIT}`
  ])
}

export function mapLinkStatsRows <E extends LinkStatsEndpoint> (
  endpoint: E,
  rows: Record<string, unknown>[],
  window: LinkStatsWindow
): LinkStatsByEndpoint[E] {
  if (endpoint === 'clicks') {
    return asCount(rows[0]?.clicks) as LinkStatsByEndpoint[E]
  }
  if (endpoint === 'timeserirs') {
    return fillTimeseries(rows, window) as LinkStatsByEndpoint[E]
  }

  const mapped = rows.flatMap((row) => {
    const clicks = asCount(row.clicks)
    if (clicks <= 0) { return [] }
    if (endpoint === 'country') {
      const country = countryCode(text(row.country))
      return country ? [{ country, clicks }] : []
    }
    if (endpoint === 'city') {
      const city = text(row.city)
      const country = countryCode(text(row.country))
      return city ? [{ city, country, clicks }] : []
    }
    const label = text(row[endpoint])
    if (!label) { return [] }
    return [{ [endpoint]: label, clicks }]
  })
  mapped.sort((a, b) => b.clicks - a.clicks)
  return mapped as LinkStatsByEndpoint[E]
}

export async function queryLinkStats <E extends string> (
  input: { endpoint: E, key: string, interval?: unknown },
  config: {
    accountId: string
    apiToken: string
    dataset?: string
    fetchImpl?: typeof fetch
    now?: Date
  }
): Promise<E extends LinkStatsEndpoint ? LinkStatsByEndpoint[E] : never> {
  const endpoint = assertEndpoint(input.endpoint)
  const interval = assertInterval(input.interval)
  const dataset = assertDataset(config.dataset || CLICK_EVENTS_SCHEMA.dataset)
  const accountId = assertAccountId(config.accountId)
  const apiToken = assertToken(config.apiToken)
  const now = config.now ?? new Date()
  const window = linkStatsWindow(interval, now)
  const sql = buildLinkStatsQuery({
    endpoint,
    key: input.key,
    dataset,
    window
  })
  const rows = await executeAnalyticsSql({
    accountId,
    apiToken,
    sql,
    fetchImpl: config.fetchImpl
  })
  return mapLinkStatsRows(endpoint, rows, window) as E extends LinkStatsEndpoint ? LinkStatsByEndpoint[E] : never
}

function selectStatement (lines: string[]) {
  return `${lines.join('\n')}\nFORMAT JSON`
}

function assertEndpoint (value: string): LinkStatsEndpoint {
  if ((LINK_STATS_ENDPOINTS as readonly string[]).includes(value)) {
    return value as LinkStatsEndpoint
  }
  throw new LinkStatsError(404, 'Unknown stats endpoint')
}

function assertInterval (value: unknown): IntervalProps {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw == null || raw === '') { return 'all' }
  if (typeof raw === 'string' && raw in GRANULARITY) { return raw as IntervalProps }
  throw new LinkStatsError(400, 'Invalid interval')
}

function hasControlCharacter (value: string) {
  for (const char of value) {
    if (char === '\\' || char.charCodeAt(0) <= 31) { return true }
  }
  return false
}

function assertKey (value: string) {
  const key = value.trim()
  if (!key || key.length > 256 || hasControlCharacter(key)) {
    throw new LinkStatsError(400, 'Invalid key')
  }
  return key
}

export function assertDataset (value: string) {
  const dataset = value.trim()
  if (!DATASET_NAME.test(dataset)) {
    throw new LinkStatsError(500, 'Analytics dataset name is invalid')
  }
  return dataset
}

function assertAccountId (value: string) {
  const accountId = value.trim()
  if (!ACCOUNT_ID.test(accountId)) {
    throw new LinkStatsError(500, 'Analytics is not configured')
  }
  return accountId
}

function assertToken (value: string) {
  const token = value.trim()
  if (!token) {
    throw new LinkStatsError(500, 'Analytics is not configured')
  }
  return token
}

function sqlString (value: string) {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlDateTime (date: Date) {
  return `toDateTime(${Math.floor(date.getTime() / 1000)})`
}

function blobColumn (dimension: string) {
  const entry = Object.entries(CLICK_EVENTS_SCHEMA.blobs).find(([, name]) => name === dimension)
  if (!entry) {
    throw new LinkStatsError(500, 'Analytics dimension is not mapped')
  }
  return entry[0]
}

type AnalyticsPayload = {
  data?: unknown
  error?: unknown
  errors?: unknown
  success?: boolean
}

async function executeAnalyticsSql (input: {
  accountId: string
  apiToken: string
  sql: string
  fetchImpl?: typeof fetch
}): Promise<Record<string, unknown>[]> {
  const fetchImpl = input.fetchImpl ?? fetch
  const url = `https://api.cloudflare.com/client/v4/accounts/${input.accountId}/analytics_engine/sql`
  let response: Response
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      redirect: 'error',
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
      headers: {
        authorization: `Bearer ${input.apiToken}`,
        'content-type': 'text/plain; charset=utf-8'
      },
      body: input.sql
    })
  } catch (error) {
    console.log('analytics engine sql request failed', error instanceof Error ? error.name : 'error')
    throw new LinkStatsError(502, 'Analytics query failed')
  }

  if (!response.ok) {
    console.log('analytics engine sql failed', response.status)
    throw new LinkStatsError(502, 'Analytics query failed')
  }

  let payload: AnalyticsPayload
  try {
    payload = await response.json() as AnalyticsPayload
  } catch {
    throw new LinkStatsError(502, 'Analytics query failed')
  }

  if (payload.success === false || payload.error || hasErrors(payload.errors) || !Array.isArray(payload.data)) {
    console.log('analytics engine sql returned an unusable payload')
    throw new LinkStatsError(502, 'Analytics query failed')
  }

  return payload.data.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
}

function hasErrors (value: unknown) {
  return Array.isArray(value) && value.length > 0
}

function fillTimeseries (rows: Record<string, unknown>[], window: LinkStatsWindow): TimeseriesStat[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const parsed = parseTimestamp(row.start)
    if (!parsed) { continue }
    const key = startOfBucket(parsed, window.granularity).toISOString()
    counts.set(key, (counts.get(key) ?? 0) + asCount(row.clicks))
  }

  const points: TimeseriesStat[] = []
  let cursor = startOfBucket(window.start, window.granularity)
  const end = startOfBucket(window.end, window.granularity)
  while (cursor.getTime() <= end.getTime() && points.length < MAX_BUCKETS) {
    const start = cursor.toISOString()
    points.push({ start, clicks: counts.get(start) ?? 0 })
    cursor = nextBucket(cursor, window.granularity)
  }
  return points
}

function startOfBucket (date: Date, granularity: LinkStatsGranularity) {
  const bucket = new Date(date.getTime())
  bucket.setUTCSeconds(0, 0)
  if (granularity === 'minute') { return bucket }
  bucket.setUTCMinutes(0)
  if (granularity === 'hour') { return bucket }
  bucket.setUTCHours(0)
  if (granularity === 'day') { return bucket }
  bucket.setUTCDate(1)
  return bucket
}

function nextBucket (date: Date, granularity: LinkStatsGranularity) {
  const next = new Date(date.getTime())
  if (granularity === 'minute') {
    next.setUTCMinutes(next.getUTCMinutes() + 1)
  } else if (granularity === 'hour') {
    next.setUTCHours(next.getUTCHours() + 1)
  } else if (granularity === 'day') {
    next.setUTCDate(next.getUTCDate() + 1)
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1)
  }
  return next
}

function parseTimestamp (value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value > 1e12 ? value : value * 1000)
  }
  if (typeof value !== 'string' || !value.trim()) { return null }
  const textValue = value.trim()
  const sql = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?/.exec(textValue)
  if (sql) {
    return new Date(`${sql[1]}T${sql[2]}${sql[3] ?? ''}Z`)
  }
  const parsed = new Date(textValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function asCount (value: unknown) {
  const count = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(count) || count <= 0) { return 0 }
  return Math.round(count)
}

function text (value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function countryCode (value: string) {
  return /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : value
}
