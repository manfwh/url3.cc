export const VISITOR_ID_COOKIE = 'url3_visitor_id'
export const VISITOR_ID_STORAGE = 'url3_visitor_id'

// RFC 4122 UUID, versions 1–8. crypto.randomUUID() is version 4.
const VISITOR_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeVisitorId (value: unknown): string | null {
  if (typeof value !== 'string') { return null }
  const id = value.trim().toLowerCase()
  if (!VISITOR_ID_RE.test(id)) { return null }
  return id
}
