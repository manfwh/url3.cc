type ErrorPayload = {
  code?: string
  reason?: string
  limit?: string
}

const UNSAFE_REASONS = new Set([
  'invalid',
  'scheme',
  'ip',
  'localhost',
  'private',
  'blacklist',
  'safe_browsing'
])

export function linkErrorI18nKey (err: unknown): string {
  const payload = readPayload(err)
  const status = readStatus(err)

  if (payload.code === 'rate_limited' || status === 429) {
    if (payload.limit === '5/hour') { return 'security.rate_limited_report' }
    return 'security.rate_limited'
  }

  if (payload.code === 'safe_browsing' || payload.reason === 'safe_browsing') {
    return 'security.unsafe_safe_browsing'
  }

  if (payload.code === 'unsafe_url') {
    if (payload.reason && UNSAFE_REASONS.has(payload.reason)) {
      return `security.unsafe_${payload.reason}`
    }
    return 'security.unsafe_invalid'
  }

  if (payload.code === 'invalid_expiry') { return 'security.invalid_expiry' }
  if (payload.code === 'unauthorized' || status === 401) { return 'security.unauthorized' }
  if (payload.code === 'unsupported_type') { return 'security.unsupported_type' }
  if (payload.code === 'not_found' || status === 404) { return 'security.not_found' }
  if (payload.code === 'invalid_report') { return 'security.invalid_report' }
  return 'security.create_failed'
}

function readStatus (err: unknown): number | undefined {
  if (!err || typeof err !== 'object') { return undefined }
  const value = err as {
    statusCode?: number
    status?: number
    data?: { statusCode?: number }
  }
  return value.statusCode || value.status || value.data?.statusCode
}

function readPayload (err: unknown): ErrorPayload {
  if (!err || typeof err !== 'object') { return {} }
  const data = (err as { data?: unknown }).data
  if (!data || typeof data !== 'object') { return {} }
  if (typeof (data as ErrorPayload).code === 'string') {
    return data as ErrorPayload
  }
  const nested = (data as { data?: unknown }).data
  if (nested && typeof nested === 'object' && typeof (nested as ErrorPayload).code === 'string') {
    return nested as ErrorPayload
  }
  return {}
}
