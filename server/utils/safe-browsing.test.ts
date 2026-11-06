import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  destinationRejection,
  lookupSafeBrowsing,
  screenDestinationFields
} from './safe-browsing.ts'

const API_KEY = 'test-safe-browsing-key'
const ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find'

type Captured = {
  url: string
  init: RequestInit
}

function jsonResponse (body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })
}

function captureFetch (response: Response | Error) {
  const calls: Captured[] = []
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init: init ?? {} })
    if (response instanceof Error) { throw response }
    return response
  }
  return { calls, fetchImpl }
}

describe('screenDestinationFields', () => {
  it('rejects local threats before calling Safe Browsing', async () => {
    const { calls, fetchImpl } = captureFetch(jsonResponse({}))
    const cases = [
      ['http://127.0.0.1/admin', 'localhost'],
      ['http://10.1.2.3/secret', 'private'],
      ['javascript:alert(1)', 'scheme'],
      ['https://pornhub.com/video', 'blacklist']
    ] as const

    for (const [url, reason] of cases) {
      const result = await screenDestinationFields({ url }, { apiKey: API_KEY, fetchImpl })
      assert.deepEqual(result, { ok: false, reason })
    }
    assert.equal(calls.length, 0)
  })

  it('checks every public destination and keeps the canonical URL', async () => {
    const { calls, fetchImpl } = captureFetch(jsonResponse({}))
    const result = await screenDestinationFields({
      url: 'https://example.com/docs',
      ios: 'https://apps.example.com/ios',
      android: '  '
    }, { apiKey: API_KEY, fetchImpl, endpoint: ENDPOINT })

    assert.equal(result.ok, true)
    if (!result.ok) { return }
    assert.equal(result.url, 'https://example.com/docs')
    assert.equal(result.ios, 'https://apps.example.com/ios')
    assert.equal(result.android, undefined)
    assert.equal(calls.length, 1)
    assert.equal(calls[0].url, ENDPOINT)
    assert.equal(calls[0].url.includes(API_KEY), false)

    const headers = new Headers(calls[0].init.headers)
    assert.equal(headers.get('x-goog-api-key'), API_KEY)
    const body = JSON.parse(String(calls[0].init.body))
    assert.deepEqual(body.threatInfo.threatEntries, [
      { url: 'https://example.com/docs' },
      { url: 'https://apps.example.com/ios' }
    ])
    assert.equal(JSON.stringify(result).includes(API_KEY), false)
  })

  it('blocks a Safe Browsing match without returning the upstream payload or key', async () => {
    const { fetchImpl } = captureFetch(jsonResponse({
      matches: [{ threatType: 'SOCIAL_ENGINEERING', threat: { url: 'https://evil.example' } }]
    }))
    const result = await screenDestinationFields(
      { url: 'https://evil.example/phish' },
      { apiKey: API_KEY, fetchImpl }
    )
    assert.deepEqual(result, { ok: false, reason: 'safe_browsing' })
    assert.equal(JSON.stringify(result).includes(API_KEY), false)
    assert.equal(JSON.stringify(result).includes('SOCIAL_ENGINEERING'), false)
  })

  it('does not call Safe Browsing when there is no destination URL', async () => {
    const { calls, fetchImpl } = captureFetch(jsonResponse({}))
    const result = await screenDestinationFields({ url: '  ' }, { apiKey: API_KEY, fetchImpl })
    assert.deepEqual(result, { ok: true })
    assert.equal(calls.length, 0)
  })
})

describe('lookupSafeBrowsing', () => {
  it('fails closed when the API key is missing and does not reveal it', async () => {
    const previous = process.env.SAFE_BROWSING_API_KEY
    const previousNuxt = process.env.NUXT_SAFE_BROWSING_API_KEY
    delete process.env.SAFE_BROWSING_API_KEY
    delete process.env.NUXT_SAFE_BROWSING_API_KEY
    const { calls, fetchImpl } = captureFetch(jsonResponse({}))
    try {
      const missingOption = await lookupSafeBrowsing(['https://example.com'], { apiKey: '', fetchImpl })
      const missingEnv = await lookupSafeBrowsing(['https://example.com'], { fetchImpl })
      assert.deepEqual(missingOption, { ok: false, reason: 'unavailable' })
      assert.deepEqual(missingEnv, { ok: false, reason: 'unavailable' })
      assert.equal(calls.length, 0)
      assert.equal(JSON.stringify(missingEnv).includes('key'), false)
    } finally {
      if (previous === undefined) { delete process.env.SAFE_BROWSING_API_KEY } else { process.env.SAFE_BROWSING_API_KEY = previous }
      if (previousNuxt === undefined) { delete process.env.NUXT_SAFE_BROWSING_API_KEY } else { process.env.NUXT_SAFE_BROWSING_API_KEY = previousNuxt }
    }
  })

  it('reads the server env key and sends it only as a request header', async () => {
    const previous = process.env.SAFE_BROWSING_API_KEY
    process.env.SAFE_BROWSING_API_KEY = API_KEY
    const { calls, fetchImpl } = captureFetch(jsonResponse({}))
    try {
      const result = await lookupSafeBrowsing(['https://example.com'], { fetchImpl, endpoint: ENDPOINT })
      assert.deepEqual(result, { ok: true })
      assert.equal(calls.length, 1)
      assert.equal(new Headers(calls[0].init.headers).get('x-goog-api-key'), API_KEY)
      assert.equal(calls[0].url.includes(API_KEY), false)
      assert.equal(calls[0].url.startsWith('https://safebrowsing.googleapis.com/'), true)
    } finally {
      if (previous === undefined) { delete process.env.SAFE_BROWSING_API_KEY } else { process.env.SAFE_BROWSING_API_KEY = previous }
    }
  })

  it('fails closed on HTTP and network errors without echoing the key', async () => {
    const leaked = new Error(`lookup failed for ${ENDPOINT}?key=${API_KEY}`)
    const http = captureFetch(jsonResponse({ error: { key: API_KEY } }, 403))
    const network = captureFetch(leaked)
    const httpResult = await lookupSafeBrowsing(['https://example.com'], { apiKey: API_KEY, fetchImpl: http.fetchImpl })
    const networkResult = await lookupSafeBrowsing(['https://example.com'], { apiKey: API_KEY, fetchImpl: network.fetchImpl })
    assert.deepEqual(httpResult, { ok: false, reason: 'unavailable' })
    assert.deepEqual(networkResult, { ok: false, reason: 'unavailable' })
    assert.equal(JSON.stringify(httpResult).includes(API_KEY), false)
    assert.equal(JSON.stringify(networkResult).includes(API_KEY), false)
  })
})

describe('destinationRejection', () => {
  it('maps Safe Browsing failures to client-safe errors', () => {
    assert.deepEqual(destinationRejection('safe_browsing'), {
      statusCode: 400,
      statusMessage: 'Unsafe URL',
      data: { code: 'unsafe_url', reason: 'safe_browsing' }
    })
    assert.deepEqual(destinationRejection('unavailable'), {
      statusCode: 503,
      statusMessage: 'Safe Browsing unavailable',
      data: { code: 'safe_browsing_unavailable' }
    })
    assert.deepEqual(destinationRejection('private'), {
      statusCode: 400,
      statusMessage: 'Unsafe URL',
      data: { code: 'unsafe_url', reason: 'private' }
    })
  })
})
