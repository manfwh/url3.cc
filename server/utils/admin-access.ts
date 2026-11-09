export type AdminIdentity = {
  id?: string | null
  email?: string | null
}

export type AdminAllowlist = {
  emails: Set<string>
  ids: Set<string>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function splitList (value: string | undefined) {
  if (!value) { return [] }
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

export function parseAdminAllowlist (emails?: string, userIds?: string): AdminAllowlist {
  return {
    emails: new Set(splitList(emails).map(email => email.toLowerCase())),
    ids: new Set(splitList(userIds).map(id => id.toLowerCase()).filter(id => UUID_RE.test(id)))
  }
}

export function isAllowlistedAdmin (user: AdminIdentity, allowlist: AdminAllowlist) {
  const email = user.email?.trim().toLowerCase()
  if (email && allowlist.emails.has(email)) { return true }
  const id = user.id?.trim().toLowerCase()
  if (id && allowlist.ids.has(id)) { return true }
  return false
}
