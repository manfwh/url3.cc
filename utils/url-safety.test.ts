import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { linkErrorI18nKey } from './link-api-error.ts'
import { EXPIRY, resolveExpiry } from './link-policy.ts'
import { checkUrlSafety } from './url-safety.ts'

describe('checkUrlSafety', () => {
  it('accepts public http and https URLs', () => {
    assert.equal(checkUrlSafety('https://example.com/path?q=1').ok, true)
    assert.equal(checkUrlSafety('http://example.com').ok, true)
  })

  it('rejects non-http schemes, IP literals, localhost, and private networks', () => {
    assert.deepEqual(checkUrlSafety('javascript:alert(1)'), { ok: false, reason: 'scheme' })
    assert.deepEqual(checkUrlSafety('ftp://example.com'), { ok: false, reason: 'scheme' })
    assert.deepEqual(checkUrlSafety('https://8.8.8.8/path'), { ok: false, reason: 'ip' })
    assert.deepEqual(checkUrlSafety('https://[2001:4860:4860::8888]/'), { ok: false, reason: 'ip' })
    assert.deepEqual(checkUrlSafety('http://127.0.0.1'), { ok: false, reason: 'localhost' })
    assert.deepEqual(checkUrlSafety('http://[::1]/admin'), { ok: false, reason: 'localhost' })
    assert.deepEqual(checkUrlSafety('http://localhost:3000'), { ok: false, reason: 'localhost' })
    assert.deepEqual(checkUrlSafety('http://app.local'), { ok: false, reason: 'localhost' })
    assert.deepEqual(checkUrlSafety('http://10.1.2.3'), { ok: false, reason: 'private' })
    assert.deepEqual(checkUrlSafety('http://192.168.0.8'), { ok: false, reason: 'private' })
    assert.deepEqual(checkUrlSafety('http://172.16.5.5'), { ok: false, reason: 'private' })
    assert.deepEqual(checkUrlSafety('http://169.254.169.254'), { ok: false, reason: 'private' })
    assert.deepEqual(checkUrlSafety('http://2130706433'), { ok: false, reason: 'localhost' })
    assert.deepEqual(checkUrlSafety('http://0177.0.0.1'), { ok: false, reason: 'localhost' })
    assert.deepEqual(checkUrlSafety('not a url'), { ok: false, reason: 'invalid' })
  })

  it('rejects blacklisted domains and their subdomains', () => {
    assert.deepEqual(checkUrlSafety('https://pornhub.com/video'), { ok: false, reason: 'blacklist' })
    assert.deepEqual(checkUrlSafety('https://www.xnxx.com/'), { ok: false, reason: 'blacklist' })
  })
})

describe('resolveExpiry', () => {
  it('defaults guests to 7 days and rejects longer values', () => {
    assert.deepEqual(resolveExpiry(undefined, 'guest'), { ok: true, seconds: EXPIRY.week })
    assert.deepEqual(resolveExpiry(EXPIRY.day, 'guest'), { ok: true, seconds: EXPIRY.day })
    assert.deepEqual(resolveExpiry(EXPIRY.month, 'guest'), { ok: false })
    assert.deepEqual(resolveExpiry(EXPIRY.never, 'guest'), { ok: false })
  })

  it('lets signed-in users keep a link longer or with no expiry', () => {
    assert.deepEqual(resolveExpiry(undefined, 'user'), { ok: true, seconds: EXPIRY.never })
    assert.deepEqual(resolveExpiry(String(EXPIRY.year), 'user'), { ok: true, seconds: EXPIRY.year })
    assert.deepEqual(resolveExpiry('0', 'user'), { ok: true, seconds: 0 })
  })
})

describe('linkErrorI18nKey', () => {
  it('maps nested rate-limit and safety payloads', () => {
    assert.equal(linkErrorI18nKey({
      statusCode: 429,
      data: { data: { code: 'rate_limited', limit: '3/hour' } }
    }), 'security.rate_limited_guest_hour')
    assert.equal(linkErrorI18nKey({
      data: { code: 'unsafe_url', reason: 'private' }
    }), 'security.unsafe_private')
    assert.equal(linkErrorI18nKey({
      data: { code: 'unsafe_url', reason: 'safe_browsing' }
    }), 'security.unsafe_safe_browsing')
  })
})
