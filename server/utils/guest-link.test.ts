import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createError } from 'h3'
import {
  assertGuestLinkKey,
  guestLinkInsert,
  guestLinkPage,
  guestLinkSearch,
  guestLinkStatus,
  guestVisitorIp,
  isGuestLinkExpired,
  omitGuestAdminFields,
  recordGuestLink,
  resolveGuestClicks,
  visitorIdFromRequest
} from './guest-link'

Object.assign(globalThis, { createError })

const VISITOR = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'

describe('guestLinkInsert', () => {
  it('writes a guest row with no owner and the redis expiry', () => {
    const row = guestLinkInsert({
      key: 'Ab12Cd3',
      url: 'https://example.com/docs',
      expiresAt: '2026-11-16T00:00:00.000Z',
      visitorId: VISITOR,
      visitorIp: '203.0.113.10'
    })
    assert.equal(row.is_guest, true)
    assert.equal(row.user_id, null)
    assert.equal(row.type, 'url')
    assert.equal(row.expires_at, '2026-11-16T00:00:00.000Z')
    assert.equal(row.visitor_id, VISITOR)
    assert.equal(row.visitor_ip, '203.0.113.10')
    assert.equal(row.clicks, 0)
    assert.equal(row.banned_at, undefined)
  })

  it('drops an invalid visitor id and an unknown address', () => {
    const row = guestLinkInsert({
      key: 'Ab12Cd3',
      url: 'https://example.com',
      expiresAt: null,
      visitorId: visitorIdFromRequest('fingerprint', VISITOR),
      visitorIp: guestVisitorIp('unknown')
    })
    assert.equal(row.visitor_id, VISITOR)
    assert.equal(row.visitor_ip, null)
  })
})

describe('visitorIdFromRequest', () => {
  it('prefers a valid body id and falls back to the cookie', () => {
    const cookie = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
    assert.equal(visitorIdFromRequest(VISITOR, cookie), VISITOR)
    assert.equal(visitorIdFromRequest('nope', cookie), cookie)
    assert.equal(visitorIdFromRequest(null, 'nope'), null)
  })
})

describe('guest link list helpers', () => {
  it('sanitizes search text and pages', () => {
    assert.equal(guestLinkSearch(' hello, (world) '), 'hello world')
    assert.equal(guestLinkSearch(undefined), '')
    assert.equal(guestLinkPage('2'), 2)
    assert.equal(guestLinkPage('0'), 1)
    assert.equal(guestLinkPage('nope'), 1)
    assert.equal(guestLinkStatus('banned'), 'banned')
    assert.equal(guestLinkStatus('nope'), 'all')
    assert.equal(guestLinkStatus(['expired']), 'expired')
  })

  it('marks a link expired only after expires_at', () => {
    const now = Date.parse('2026-11-09T00:00:00.000Z')
    assert.equal(isGuestLinkExpired('2026-11-08T00:00:00.000Z', now), true)
    assert.equal(isGuestLinkExpired('2026-11-10T00:00:00.000Z', now), false)
    assert.equal(isGuestLinkExpired(null, now), false)
  })

  it('prefers an analytics total, including zero, over the stored counter', () => {
    assert.equal(resolveGuestClicks(4, 1), 4)
    assert.equal(resolveGuestClicks(0, 9), 0)
    assert.equal(resolveGuestClicks(null, 9), 9)
    assert.equal(resolveGuestClicks(null, null), 0)
  })
})

describe('recordGuestLink', () => {
  it('swallows an insert failure', async () => {
    const errors: unknown[] = []
    const original = console.error
    console.error = (...args: unknown[]) => { errors.push(args) }
    try {
      await recordGuestLink(async () => {
        throw new Error('supabase down')
      }, guestLinkInsert({
        key: 'Ab12Cd3',
        url: 'https://example.com',
        expiresAt: null,
        visitorId: null,
        visitorIp: null
      }))
      await recordGuestLink(async () => ({ error: { code: '23505' } }), guestLinkInsert({
        key: 'Ab12Cd3',
        url: 'https://example.com',
        expiresAt: null,
        visitorId: null,
        visitorIp: null
      }))
    } finally {
      console.error = original
    }
    assert.equal(errors.length, 2)
    assert.equal(JSON.stringify(errors).includes('https://example.com'), false)
  })
})

describe('omitGuestAdminFields', () => {
  it('removes guest columns from a signed-in write', () => {
    const body = omitGuestAdminFields({
      key: 'abc',
      url: 'https://example.com',
      is_guest: true,
      visitor_id: VISITOR,
      visitor_ip: '203.0.113.10',
      expires_at: '2026-11-16T00:00:00.000Z',
      last_visited_at: '2026-11-09T00:00:00.000Z',
      banned_at: '2026-11-09T00:00:00.000Z'
    })
    assert.deepEqual(body, { key: 'abc', url: 'https://example.com' })
  })
})

describe('assertGuestLinkKey', () => {
  it('accepts a short key and rejects path characters', () => {
    assert.equal(assertGuestLinkKey('Ab12Cd3'), 'Ab12Cd3')
    assert.throws(() => assertGuestLinkKey('../admin'), (error: unknown) => {
      assert.equal((error as { statusCode?: number }).statusCode, 400)
      return true
    })
  })
})
