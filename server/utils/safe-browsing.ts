import { checkUrlSafety, type UrlSafetyReason } from '../../shared/utils/url-safety'

export type DestinationFields = {
  url?: unknown
  ios?: unknown
  android?: unknown
}

export type NormalizedDestinations = {
  ok: true
  url?: string
  ios?: string
  android?: string
}

export type DestinationBlockReason = UrlSafetyReason | 'safe_browsing' | 'unavailable'

export type ScreenedDestinations =
  | NormalizedDestinations
  | { ok: false, reason: DestinationBlockReason }

type LookupOptions = {
  apiKey?: string
  fetchImpl?: typeof fetch
  endpoint?: string
  timeoutMs?: number
}

const SAFE_BROWSING_ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find'
const DESTINATION_FIELDS = ['url', 'ios', 'android'] as const

const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION'
]

export function normalizeDestinationFields (fields: DestinationFields): NormalizedDestinations | { ok: false, reason: UrlSafetyReason } {
  const normalized: { url?: string, ios?: string, android?: string } = {}
  for (const field of DESTINATION_FIELDS) {
    const value = fields[field]
    if (typeof value !== 'string' || !value.trim()) { continue }
    const safety = checkUrlSafety(value)
    if (!safety.ok) { return safety }
    normalized[field] = safety.url.toString()
  }
  return { ok: true, ...normalized }
}

export function destinationUrls (fields: NormalizedDestinations) {
  return DESTINATION_FIELDS.flatMap((field) => {
    const value = fields[field]
    return value ? [value] : []
  })
}

export function destinationRejection (reason: DestinationBlockReason) {
  if (reason === 'unavailable') {
    return {
      statusCode: 503,
      statusMessage: 'Safe Browsing unavailable',
      data: { code: 'safe_browsing_unavailable' }
    }
  }
  return {
    statusCode: 400,
    statusMessage: 'Unsafe URL',
    data: { code: 'unsafe_url', reason }
  }
}

export async function lookupSafeBrowsing (urls: string[], options: LookupOptions = {}) {
  const unique = [...new Set(urls.map(url => url.trim()).filter(Boolean))]
  if (unique.length === 0) { return { ok: true as const } }

  const apiKey = resolveApiKey(options)
  if (!apiKey) { return { ok: false as const, reason: 'unavailable' as const } }

  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const endpoint = options.endpoint ?? SAFE_BROWSING_ENDPOINT
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      redirect: 'error',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        client: {
          clientId: 'url3.cc',
          clientVersion: '1.0.0'
        },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: unique.map(url => ({ url }))
        }
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 5000)
    })
    if (!response.ok) { return { ok: false as const, reason: 'unavailable' as const } }
    const payload = await response.json() as { matches?: unknown }
    if (Array.isArray(payload?.matches) && payload.matches.length > 0) {
      return { ok: false as const, reason: 'safe_browsing' as const }
    }
    return { ok: true as const }
  } catch {
    return { ok: false as const, reason: 'unavailable' as const }
  }
}

export async function screenDestinationFields (fields: DestinationFields, options: LookupOptions = {}): Promise<ScreenedDestinations> {
  const local = normalizeDestinationFields(fields)
  if (!local.ok) { return local }
  const urls = destinationUrls(local)
  if (urls.length === 0) { return local }
  const remote = await lookupSafeBrowsing(urls, options)
  if (!remote.ok) { return remote }
  return local
}

function resolveApiKey (options: LookupOptions) {
  if (Object.prototype.hasOwnProperty.call(options, 'apiKey')) {
    return (options.apiKey || '').trim()
  }
  return readSafeBrowsingApiKey()
}

function readSafeBrowsingApiKey () {
  const env = process.env
  const fromEnv = (env['SAFE_BROWSING_API_KEY'] || env['NUXT_SAFE_BROWSING_API_KEY'] || '').trim()
  if (fromEnv) { return fromEnv }
  try {
    const value = useRuntimeConfig().safeBrowsingApiKey
    return typeof value === 'string' ? value.trim() : ''
  } catch {
    return ''
  }
}
