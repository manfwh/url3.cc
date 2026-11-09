import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  executeLinkBan,
  executeLinkDelete,
  executeLinkUnban,
  executeReportBan,
  moderationWriteDecision,
  planBanWrite,
  planUnbanWrite,
  type ModerationDeps,
  type ModerationLink
} from './link-moderation'

const NOW = new Date('2026-11-09T00:00:00.000Z')
const FUTURE = '2026-11-16T00:00:00.000Z'
const PAST = '2026-11-01T00:00:00.000Z'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')

function guestLink (patch: Partial<ModerationLink> = {}): ModerationLink {
  return {
    key: 'guestKey',
    url: 'https://example.com/docs',
    type: 'url',
    is_guest: true,
    expires_at: FUTURE,
    banned_at: null,
    ...patch
  }
}

function userLink (patch: Partial<ModerationLink> = {}): ModerationLink {
  return {
    key: 'userKey',
    url: 'https://example.com/a b',
    type: 'url',
    is_guest: false,
    expires_at: null,
    banned_at: null,
    password: null,
    ...patch
  }
}

function memory (input: {
  link: ModerationLink | null
  existing?: unknown
  ttl?: number
}) {
  const sets: Array<{ key: string, value: Record<string, unknown>, ex?: number }> = []
  const dels: string[][] = []
  const bans: Array<string | null> = []
  const removed: string[] = []
  const order: string[] = []
  const deps: ModerationDeps = {
    async load () {
      order.push('load')
      return input.link
    },
    async get () {
      order.push('get')
      return input.existing ?? null
    },
    async ttl () {
      order.push('ttl')
      return input.ttl ?? -2
    },
    async set (key, value, options) {
      order.push('set')
      sets.push({ key, value, ...(options?.ex ? { ex: options.ex } : {}) })
      return 'OK'
    },
    async del (...keys) {
      order.push('del')
      dels.push(keys)
      return keys.length
    },
    async setBannedAt (_key, bannedAt) {
      order.push('setBannedAt')
      bans.push(bannedAt)
    },
    async remove (key) {
      order.push('remove')
      removed.push(key)
    },
    now: () => NOW
  }
  return { deps, sets, dels, bans, removed, order }
}

describe('moderation write policy', () => {
  it('allows an admin to write any link key and rejects everyone else', () => {
    assert.deepEqual(moderationWriteDecision({ isAdmin: false, link: { is_guest: true } }), {
      allowed: false,
      statusCode: 403
    })
    assert.deepEqual(moderationWriteDecision({ isAdmin: true, link: null }), {
      allowed: false,
      statusCode: 404
    })
    assert.equal(moderationWriteDecision({ isAdmin: true, link: { is_guest: true } }).guestOnly, false)
    assert.equal(moderationWriteDecision({ isAdmin: true, link: { is_guest: false } }).allowed, true)
  })

  it('gates the write routes with the admin handler and does not filter is_guest', () => {
    const files = [
      'server/api/admin/links/[key].delete.ts',
      'server/api/admin/links/[key]/ban.post.ts',
      'server/api/admin/links/[key]/unban.post.ts'
    ]
    for (const file of files) {
      const source = readFileSync(join(ROOT, file), 'utf8')
      assert.match(source, /defineAdminHandler/)
      assert.match(source, /assertGuestLinkKey/)
      assert.equal(source.includes('is_guest'), false)
    }
    const report = readFileSync(join(ROOT, 'server/api/links/[key]/report.post.ts'), 'utf8')
    assert.match(report, /executeReportBan/)
  })
})

describe('redis ban contract', () => {
  const existing = {
    url: 'https://example.com/docs',
    type: 'url',
    is_demo: true
  }

  it('sets banned true, keeps the original payload, and keeps the redis ttl', () => {
    const write = planBanWrite({
      key: 'guestKey',
      link: guestLink(),
      existing,
      ttlSeconds: 42,
      now: NOW.getTime()
    })
    assert.deepEqual(write, {
      op: 'set',
      key: 'short-link:guestKey',
      value: { ...existing, banned: true },
      ex: 42
    })
  })

  it('keeps a signed-in link payload, including an encoded url', () => {
    const stored = {
      url: encodeURIComponent('https://example.com/a b'),
      type: 'url',
      password: false
    }
    const write = planBanWrite({
      key: 'userKey',
      link: userLink(),
      existing: stored,
      ttlSeconds: -1,
      now: NOW.getTime()
    })
    assert.deepEqual(write, {
      op: 'set',
      key: 'short-link:userKey',
      value: { ...stored, banned: true }
    })
  })

  it('does not recreate a redis key that is already expired', () => {
    const write = planBanWrite({
      key: 'guestKey',
      link: guestLink({ expires_at: PAST }),
      existing: null,
      ttlSeconds: -2,
      now: NOW.getTime()
    })
    assert.deepEqual(write, { op: 'none' })
  })
})

describe('redis unban contract', () => {
  it('clears banned and keeps the ttl when the link is still live', () => {
    const write = planUnbanWrite({
      key: 'guestKey',
      link: guestLink({ banned_at: NOW.toISOString() }),
      existing: {
        url: 'https://example.com/docs',
        type: 'url',
        is_demo: true,
        banned: true
      },
      ttlSeconds: 42,
      now: NOW.getTime()
    })
    assert.deepEqual(write, {
      op: 'set',
      key: 'short-link:guestKey',
      value: {
        url: 'https://example.com/docs',
        type: 'url',
        is_demo: true
      },
      ex: 42
    })
  })

  it('deletes the redis key when expires_at has passed', () => {
    const write = planUnbanWrite({
      key: 'guestKey',
      link: guestLink({ expires_at: PAST, banned_at: NOW.toISOString() }),
      existing: { url: 'https://example.com/docs', banned: true },
      ttlSeconds: 42,
      now: NOW.getTime()
    })
    assert.deepEqual(write, { op: 'del', keys: ['short-link:guestKey'] })
  })
})

describe('execute link moderation', () => {
  it('bans a signed-in link and records banned_at', async () => {
    const stored = memory({
      link: userLink(),
      existing: { url: encodeURIComponent('https://example.com/a b'), type: 'url', password: false },
      ttl: 15
    })
    const result = await executeLinkBan(stored.deps, 'userKey')
    assert.equal(result.banned, true)
    assert.equal(result.banned_at, NOW.toISOString())
    assert.equal(stored.sets[0]?.value.banned, true)
    assert.equal(stored.sets[0]?.value.url, encodeURIComponent('https://example.com/a b'))
    assert.deepEqual(stored.bans, [NOW.toISOString()])
    assert.ok(stored.order.indexOf('set') < stored.order.indexOf('setBannedAt'))
  })

  it('does not move banned_at when the row is already banned', async () => {
    const stored = memory({
      link: guestLink({ banned_at: '2026-11-08T00:00:00.000Z' }),
      existing: { url: 'https://example.com/docs', type: 'url', is_demo: true, banned: true },
      ttl: 10
    })
    const result = await executeLinkBan(stored.deps, 'guestKey')
    assert.equal(result.banned_at, '2026-11-08T00:00:00.000Z')
    assert.deepEqual(stored.bans, [])
  })

  it('marks an expired missing key banned in the database only', async () => {
    const stored = memory({
      link: guestLink({ expires_at: PAST }),
      ttl: -2
    })
    const result = await executeLinkBan(stored.deps, 'guestKey')
    assert.equal(result.banned, true)
    assert.deepEqual(stored.sets, [])
    assert.deepEqual(stored.bans, [NOW.toISOString()])
  })

  it('unbans a live link back to a redirect', async () => {
    const stored = memory({
      link: guestLink({ banned_at: PAST }),
      existing: { url: 'https://example.com/docs', type: 'url', is_demo: true, banned: true },
      ttl: 42
    })
    const result = await executeLinkUnban(stored.deps, 'guestKey')
    assert.equal(result.redirect, 'restored')
    assert.equal(result.banned, false)
    assert.equal(stored.sets[0]?.value.banned, undefined)
    assert.equal(stored.sets[0]?.ex, 42)
    assert.deepEqual(stored.bans, [null])
  })

  it('leaves an expired link dead on unban', async () => {
    const stored = memory({
      link: guestLink({ expires_at: PAST, banned_at: PAST }),
      existing: { url: 'https://example.com/docs', banned: true },
      ttl: 42
    })
    const result = await executeLinkUnban(stored.deps, 'guestKey')
    assert.equal(result.redirect, 'expired')
    assert.deepEqual(stored.sets, [])
    assert.deepEqual(stored.dels, [['short-link:guestKey']])
    assert.deepEqual(stored.bans, [null])
  })

  it('hard-deletes redis and the row for a signed-in link', async () => {
    const stored = memory({ link: userLink(), existing: { url: 'https://example.com/a%20b' } })
    const result = await executeLinkDelete(stored.deps, 'userKey')
    assert.deepEqual(result, { key: 'userKey', deleted: true })
    assert.deepEqual(stored.dels, [['short-link:userKey', 'link-report:userKey']])
    assert.deepEqual(stored.removed, ['userKey'])
    assert.deepEqual(stored.order, ['load', 'del', 'remove'])
  })

  it('returns not found when the key has no row', async () => {
    const stored = memory({ link: null })
    await assert.rejects(executeLinkDelete(stored.deps, 'missing'), (error: unknown) => {
      assert.equal((error as { statusCode?: number }).statusCode, 404)
      return true
    })
    assert.deepEqual(stored.dels, [])
    await assert.rejects(executeLinkBan(stored.deps, 'missing'), (error: unknown) => {
      assert.equal((error as { statusCode?: number }).statusCode, 404)
      return true
    })
  })
})

describe('report ban convergence', () => {
  it('uses the same banned redis shape as an admin ban', async () => {
    const existing = { url: 'https://example.com/docs', type: 'url', is_demo: true }
    const reported = memory({ link: guestLink(), existing, ttl: 42 })
    const banned = memory({ link: guestLink(), existing, ttl: 42 })
    await executeReportBan(reported.deps, 'guestKey')
    await executeLinkBan(banned.deps, 'guestKey')
    assert.deepEqual(reported.sets, banned.sets)
    assert.deepEqual(reported.bans, [NOW.toISOString()])
  })

  it('bans a redis-only link without requiring a database row', async () => {
    const stored = memory({
      link: null,
      existing: { url: 'https://example.com/old', type: 'url', is_demo: true },
      ttl: 9
    })
    const result = await executeReportBan(stored.deps, 'oldKey')
    assert.equal(result.banned, true)
    assert.deepEqual(stored.sets[0]?.value, {
      url: 'https://example.com/old',
      type: 'url',
      is_demo: true,
      banned: true
    })
    assert.equal(stored.sets[0]?.ex, 9)
    assert.deepEqual(stored.bans, [])
  })

  it('does not rewrite banned_at for a second report', async () => {
    const stored = memory({
      link: guestLink({ banned_at: '2026-11-08T00:00:00.000Z' }),
      existing: { url: 'https://example.com/docs', type: 'url', banned: true },
      ttl: 9
    })
    const result = await executeReportBan(stored.deps, 'guestKey')
    assert.equal(result.banned_at, '2026-11-08T00:00:00.000Z')
    assert.deepEqual(stored.bans, [])
  })
})
