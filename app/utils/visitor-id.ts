import { normalizeVisitorId, VISITOR_ID_COOKIE, VISITOR_ID_STORAGE } from '#shared/utils/visitor-id'

const MAX_AGE_SECONDS = 60 * 60 * 24 * 400

function readCookie (name: string) {
  const prefix = `${name}=`
  const parts = document.cookie ? document.cookie.split('; ') : []
  for (const part of parts) {
    if (!part.startsWith(prefix)) { continue }
    const raw = part.slice(prefix.length)
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }
  return null
}

export function readOrCreateVisitorId () {
  if (!import.meta.client) { return '' }
  const existing = normalizeVisitorId(readCookie(VISITOR_ID_COOKIE))
    || normalizeVisitorId(window.localStorage.getItem(VISITOR_ID_STORAGE))
  const id = existing || crypto.randomUUID()
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${VISITOR_ID_COOKIE}=${encodeURIComponent(id)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`
  try {
    window.localStorage.setItem(VISITOR_ID_STORAGE, id)
  } catch {
    // Private mode can block storage. The cookie still carries the id.
  }
  return id
}
