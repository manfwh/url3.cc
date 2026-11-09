import { createError } from 'h3'
import { isGuestLinkExpired } from './guest-link'

// Redis contract for the redirect Worker (url3.cc-service):
//
// Key: short-link:${key}
// Value: the existing JSON object, plus banned=true while the link is banned.
// TTL is preserved. Original url/type/is_demo and any other fields stay put.
//
// The Worker returns HTTP 410 Gone when banned === true. That is the same
// response a successful report should produce. A missing banned field, or
// banned: false, is not banned. Do not key 410 off the link-report:${key}
// list; that list is only the report audit log. Unban deletes the banned
// field and must restore the redirect when expires_at is still in the future.

export const SHORT_LINK_REDIS_PREFIX = 'short-link:'
export const LINK_REPORT_REDIS_PREFIX = 'link-report:'

export type ModerationLink = {
  key: string
  url: string | null
  type: string | null
  is_guest: boolean
  expires_at: string | null
  banned_at: string | null
  image?: string | null
  password?: string | null
  ios?: string | null
  android?: string | null
  ios_image?: string | null
  android_image?: string | null
}

export type RedisWrite =
  | { op: 'set', key: string, value: Record<string, unknown>, ex?: number }
  | { op: 'del', keys: string[] }
  | { op: 'none' }

export type ModerationDeps = {
  load: (key: string) => Promise<ModerationLink | null>
  get: (redisKey: string) => Promise<unknown>
  ttl: (redisKey: string) => Promise<number>
  set: (redisKey: string, value: Record<string, unknown>, options?: { ex: number }) => Promise<unknown>
  del: (...redisKeys: string[]) => Promise<unknown>
  setBannedAt: (key: string, bannedAt: string | null) => Promise<void>
  remove: (key: string) => Promise<void>
  now?: () => Date
}

export function shortLinkRedisKey (key: string) {
  return `${SHORT_LINK_REDIS_PREFIX}${key}`
}

export function linkReportRedisKey (key: string) {
  return `${LINK_REPORT_REDIS_PREFIX}${key}`
}

export function moderationWriteDecision (input: {
  isAdmin: boolean
  link: { is_guest: boolean } | null
}) {
  if (!input.isAdmin) {
    return { allowed: false as const, statusCode: 403 as const }
  }
  if (!input.link) {
    return { allowed: false as const, statusCode: 404 as const }
  }
  return { allowed: true as const, statusCode: 200 as const, guestOnly: false as const }
}

export function asRedisRecord (value: unknown): Record<string, unknown> | null {
  if (!value) { return null }
  if (typeof value === 'string') {
    try {
      return asRedisRecord(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Record<string, unknown>) }
  }
  return null
}

export function withBannedFlag (record: Record<string, unknown>, banned: boolean) {
  if (banned) {
    return { ...record, banned: true }
  }
  const next = { ...record }
  delete next.banned
  return next
}

export function redisRecordFromRow (row: ModerationLink): Record<string, unknown> {
  const record: Record<string, unknown> = {
    type: row.type || 'url'
  }
  if (row.url) {
    record.url = row.is_guest ? row.url : encodeURIComponent(row.url)
  }
  if (row.is_guest) {
    record.is_demo = true
    return record
  }
  if (row.image) { record.image = row.image }
  record.password = !!row.password
  if (row.ios) { record.ios = row.ios }
  if (row.android) { record.android = row.android }
  if (row.ios_image) { record.ios_image = row.ios_image }
  if (row.android_image) { record.android_image = row.android_image }
  return record
}

function secondsUntil (expiresAt: string | null, now: number) {
  if (!expiresAt) { return undefined }
  const time = Date.parse(expiresAt)
  if (Number.isNaN(time)) { return undefined }
  return Math.floor((time - now) / 1000)
}

function ttlOption (ttlSeconds: number) {
  return ttlSeconds > 0 ? ttlSeconds : undefined
}

export function planBanWrite (input: {
  key: string
  link: ModerationLink | null
  existing: unknown
  ttlSeconds: number
  now?: number
}): RedisWrite {
  const now = input.now ?? Date.now()
  const record = asRedisRecord(input.existing)
  if (!record) {
    if (!input.link || isGuestLinkExpired(input.link.expires_at, now)) {
      return { op: 'none' }
    }
    const ex = secondsUntil(input.link.expires_at, now)
    if (ex !== undefined && ex <= 0) {
      return { op: 'none' }
    }
    return {
      op: 'set',
      key: shortLinkRedisKey(input.key),
      value: withBannedFlag(redisRecordFromRow(input.link), true),
      ...(ex && ex > 0 ? { ex } : {})
    }
  }
  return {
    op: 'set',
    key: shortLinkRedisKey(input.key),
    value: withBannedFlag(record, true),
    ...(ttlOption(input.ttlSeconds) ? { ex: ttlOption(input.ttlSeconds) } : {})
  }
}

export function planUnbanWrite (input: {
  key: string
  link: ModerationLink
  existing: unknown
  ttlSeconds: number
  now?: number
}): RedisWrite {
  const now = input.now ?? Date.now()
  if (isGuestLinkExpired(input.link.expires_at, now)) {
    return { op: 'del', keys: [shortLinkRedisKey(input.key)] }
  }
  const record = asRedisRecord(input.existing)
  if (!record) {
    const ex = secondsUntil(input.link.expires_at, now)
    if (ex !== undefined && ex <= 0) {
      return { op: 'del', keys: [shortLinkRedisKey(input.key)] }
    }
    return {
      op: 'set',
      key: shortLinkRedisKey(input.key),
      value: redisRecordFromRow(input.link),
      ...(ex && ex > 0 ? { ex } : {})
    }
  }
  return {
    op: 'set',
    key: shortLinkRedisKey(input.key),
    value: withBannedFlag(record, false),
    ...(ttlOption(input.ttlSeconds) ? { ex: ttlOption(input.ttlSeconds) } : {})
  }
}

export async function applyRedisWrite (
  write: RedisWrite,
  io: Pick<ModerationDeps, 'set' | 'del'>
) {
  if (write.op === 'none') { return }
  if (write.op === 'del') {
    if (write.keys.length > 0) {
      await io.del(...write.keys)
    }
    return
  }
  if (write.ex && write.ex > 0) {
    await io.set(write.key, write.value, { ex: write.ex })
    return
  }
  await io.set(write.key, write.value)
}

function clock (deps: ModerationDeps) {
  return (deps.now ?? (() => new Date()))()
}

export async function executeLinkDelete (deps: ModerationDeps, key: string) {
  const link = await deps.load(key)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  await applyRedisWrite({
    op: 'del',
    keys: [shortLinkRedisKey(key), linkReportRedisKey(key)]
  }, deps)
  await deps.remove(key)
  return { key, deleted: true as const }
}

export async function executeLinkBan (deps: ModerationDeps, key: string) {
  const link = await deps.load(key)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  const now = clock(deps)
  const redisKey = shortLinkRedisKey(key)
  const existing = await deps.get(redisKey)
  const ttlSeconds = await deps.ttl(redisKey)
  const write = planBanWrite({
    key,
    link,
    existing,
    ttlSeconds,
    now: now.getTime()
  })
  await applyRedisWrite(write, deps)
  const bannedAt = link.banned_at ?? now.toISOString()
  if (!link.banned_at) {
    await deps.setBannedAt(key, bannedAt)
  }
  return { key, banned: true as const, banned_at: bannedAt, redirect: 'blocked' as const }
}

export async function executeLinkUnban (deps: ModerationDeps, key: string) {
  const link = await deps.load(key)
  if (!link) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  const now = clock(deps)
  const redisKey = shortLinkRedisKey(key)
  const existing = isGuestLinkExpired(link.expires_at, now.getTime()) ? null : await deps.get(redisKey)
  const ttlSeconds = existing ? await deps.ttl(redisKey) : -2
  const write = planUnbanWrite({
    key,
    link,
    existing,
    ttlSeconds,
    now: now.getTime()
  })
  await applyRedisWrite(write, deps)
  if (link.banned_at) {
    await deps.setBannedAt(key, null)
  }
  return {
    key,
    banned: false as const,
    banned_at: null,
    redirect: isGuestLinkExpired(link.expires_at, now.getTime()) ? 'expired' as const : 'restored' as const
  }
}

export async function executeReportBan (deps: ModerationDeps, key: string) {
  const link = await deps.load(key)
  const now = clock(deps)
  const redisKey = shortLinkRedisKey(key)
  const existing = await deps.get(redisKey)
  const ttlSeconds = await deps.ttl(redisKey)
  const write = planBanWrite({
    key,
    link,
    existing,
    ttlSeconds,
    now: now.getTime()
  })
  await applyRedisWrite(write, deps)
  const bannedAt = link?.banned_at ?? now.toISOString()
  if (link && !link.banned_at) {
    await deps.setBannedAt(key, bannedAt)
  }
  return {
    banned: write.op === 'set' || !!link,
    banned_at: write.op === 'set' || link ? bannedAt : null
  }
}
