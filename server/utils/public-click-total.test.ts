import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createError, getQuery, type H3Event } from 'h3'
import {
  CLICK_EVENTS_SCHEMA,
  LINK_STATS_ENDPOINTS,
  buildLinkStatsQuery,
  linkStatsWindow
} from './link-stats'
import { PUBLIC_CLICK_TOTAL, publicClickTotal } from './public-click-total'

Object.assign(globalThis, { createError })

const NOW = new Date('2026-11-07T01:12:00.000Z')
const ACCOUNT_ID = '0123456789abcdef0123456789abcdef'
const TOKEN = 'analytics-engine-test-token'
const SECRET_FIELDS = ['US', 'Paris', 'Mobile', 'Chrome', 'iOS', 'https://secret.example', TOKEN]

function publicEvent (key?: string, forwardedFor = '203.0.113.10'): H3Event {
  const path = `/api/public/links/${encodeURIComponent(key ?? '')}/clicks?interval=24h&endpoint=country&browser=Chrome&referer=https%3A%2F%2Fsecret.example`
  return {
    path,
    context: { params: key === undefined ? {} : { key } },
    node: {
      req: {
        url: path,
        headers: { 'x-forwarded-for': forwardedFor },
        socket: { remoteAddress: '127.0.0.1' }
      }
    }
  } as unknown as H3Event
}

function allow () {
  return Promise.resolve(true)
}

function analytics (fetchImpl: typeof fetch) {
  return {
    consume: allow,
    analytics: {
      accountId: ACCOUNT_ID,
      apiToken: TOKEN,
      dataset: CLICK_EVENTS_SCHEMA.dataset,
      fetchImpl,
      now: NOW
    }
  }
}

describe('public click total', () => {
  it('returns the lifetime total and drops every other analytics column', async () => {
    const event = publicEvent('abc123')
    assert.equal(getQuery(event).interval, '24h')
    assert.equal(getQuery(event).endpoint, 'country')
    assert.equal(String(getQuery(event).referer).includes('secret.example'), true)

    const calls: { url: string, init: RequestInit }[] = []
    const result = await publicClickTotal(event, analytics((url, init) => {
      calls.push({ url: String(url), init: init ?? {} })
      return Promise.resolve(new Response(JSON.stringify({
        data: [{
          clicks: '15',
          country: 'US',
          city: 'Paris',
          device: 'Mobile',
          browser: 'Chrome',
          os: 'iOS',
          referer: 'https://secret.example',
          start: '2026-11-07 00:00:00'
        }]
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
    }))

    assert.deepEqual(result, { clicks: 15 })
    assert.deepEqual(Object.keys(result), ['clicks'])
    const visible = JSON.stringify(result)
    for (const secret of SECRET_FIELDS) {
      assert.equal(visible.includes(secret), false)
    }
    assert.equal(calls.length, 1)
    assert.equal(calls[0].init.method, 'POST')
    const sql = String(calls[0].init.body)
    assert.equal(sql, buildLinkStatsQuery({
      endpoint: 'clicks',
      key: 'abc123',
      dataset: CLICK_EVENTS_SCHEMA.dataset,
      window: linkStatsWindow('all', NOW)
    }))
    assert.match(sql, /SELECT SUM\(_sample_interval\) AS clicks/)
    assert.doesNotMatch(sql, /GROUP BY|toStartOf/)
    assert.doesNotMatch(sql, /\bblob1\b|\bblob2\b|\bblob7\b|\bblob11\b|\bblob13\b|\bblob18\b/)
    assert.doesNotMatch(sql, /\bAS country\b|\bAS city\b|\bAS device\b|\bAS browser\b|\bAS os\b|\bAS referer\b|\bAS start\b/)
    assert.equal(sql.includes('24h'), false)
    assert.equal(sql.includes(TOKEN), false)
    const headers = new Headers(calls[0].init.headers)
    assert.equal(headers.get('authorization'), `Bearer ${TOKEN}`)
  })

  it('uses the decoded key and still ignores a requested interval', async () => {
    let sql = ''
    const result = await publicClickTotal(publicEvent('o%27brien'), analytics((_url, init) => {
      sql = String(init?.body ?? '')
      return Promise.resolve(new Response(JSON.stringify({ data: [{ clicks: 2 }] }), { status: 200 }))
    }))
    assert.deepEqual(result, { clicks: 2 })
    assert.equal(sql, buildLinkStatsQuery({
      endpoint: 'clicks',
      key: "o'brien",
      dataset: CLICK_EVENTS_SCHEMA.dataset,
      window: linkStatsWindow('all', NOW)
    }))
  })

  it('returns zero for an empty or non-numeric count without echoing the row', async () => {
    const payloads = [
      [],
      [{ clicks: null, country: 'US' }],
      [{ clicks: { country: 'US', device: 'Mobile' }, referer: 'https://secret.example' }],
      [{ start: '2026-11-07 00:00:00', clicks: 4, country: 'US' }, { clicks: 9, device: 'Desktop' }]
    ]
    for (const data of payloads) {
      const result = await publicClickTotal(publicEvent('abc123'), analytics(() => {
        return Promise.resolve(new Response(JSON.stringify({ data }), { status: 200 }))
      }))
      if (Array.isArray(data) && data[0] && typeof data[0].clicks === 'number') {
        assert.deepEqual(result, { clicks: data[0].clicks })
      } else {
        assert.deepEqual(result, { clicks: 0 })
      }
      const visible = JSON.stringify(result)
      assert.equal(visible.includes('US'), false)
      assert.equal(visible.includes('secret.example'), false)
      assert.equal(visible.includes('Desktop'), false)
      assert.equal(Array.isArray(result), false)
    }
  })

  it('rejects a missing or unsafe key before calling analytics', async () => {
    const cases = [undefined, '', '   ', '%', `bad\nkey-SECRET`, 'x'.repeat(257)]
    for (const key of cases) {
      let called = false
      await assert.rejects(
        () => publicClickTotal(publicEvent(key), analytics(() => {
          called = true
          return Promise.resolve(new Response('{}', { status: 200 }))
        })),
        (error: unknown) => {
          const err = error as { statusCode?: number, statusMessage?: string, message?: string }
          assert.equal(err.statusCode, 400)
          assert.equal(err.statusMessage, 'Invalid key')
          const visible = JSON.stringify({ message: err.message, statusMessage: err.statusMessage })
          assert.equal(visible.includes('SECRET'), false)
          assert.equal(visible.includes(TOKEN), false)
          return true
        }
      )
      assert.equal(called, false)
    }
  })

  it('does not query analytics when the caller is rate limited', async () => {
    let called = false
    await assert.rejects(
      () => publicClickTotal(publicEvent('abc123', '203.0.113.10'), {
        consume: async () => false,
        analytics: {
          accountId: ACCOUNT_ID,
          apiToken: TOKEN,
          fetchImpl: () => {
            called = true
            return Promise.resolve(new Response(JSON.stringify({ data: [{ clicks: 9, country: 'US' }] }), { status: 200 }))
          },
          now: NOW
        }
      }),
      (error: unknown) => {
        const err = error as { statusCode?: number, statusMessage?: string, data?: { code?: string, limit?: string } }
        assert.equal(err.statusCode, 429)
        assert.equal(err.statusMessage, 'Too Many Requests')
        assert.deepEqual(err.data, { code: 'rate_limited', limit: '30/minute' })
        const visible = JSON.stringify(err)
        assert.equal(visible.includes('203.0.113.10'), false)
        assert.equal(visible.includes('US'), false)
        assert.equal(visible.includes(TOKEN), false)
        return true
      }
    )
    assert.equal(called, false)
  })

  it('hides upstream analytics failures', async () => {
    let called = false
    await assert.rejects(
      () => publicClickTotal(publicEvent('abc123'), analytics(() => {
        called = true
        return Promise.resolve(new Response(JSON.stringify({
          error: TOKEN,
          data: [{ country: 'US', referer: 'https://secret.example' }]
        }), { status: 400 }))
      })),
      (error: unknown) => {
        const err = error as { statusCode?: number, statusMessage?: string, message?: string }
        assert.equal(err.statusCode, 502)
        assert.equal(err.statusMessage, 'Analytics query failed')
        const visible = JSON.stringify(err)
        for (const secret of SECRET_FIELDS) {
          assert.equal(visible.includes(secret), false)
        }
        return true
      }
    )
    assert.equal(called, true)
  })
})

describe('detail stats stay authenticated', () => {
  it('only the public total calls analytics without auth, and only for lifetime clicks', () => {
    assert.deepEqual(PUBLIC_CLICK_TOTAL, { endpoint: 'clicks', interval: 'all' })
    for (const endpoint of LINK_STATS_ENDPOINTS) {
      if (endpoint === 'clicks') { continue }
      assert.notEqual(PUBLIC_CLICK_TOTAL.endpoint, endpoint)
    }

    const serverRoot = fileURLToPath(new URL('..', import.meta.url))
    const callers = walk(serverRoot).filter((file) => {
      return readFileSync(file, 'utf8').includes('queryLinkStats')
    })
    assert.deepEqual(callers.map(file => file.slice(serverRoot.length + 1)).sort(), [
      'api/admin/links/[key]/stats/[endpoint].get.ts',
      'utils/guest-link-admin.ts',
      'utils/link-stats-route.ts',
      'utils/link-stats.ts',
      'utils/public-click-total.ts'
    ])

    const apiRoot = fileURLToPath(new URL('../api', import.meta.url))
    const statsCallers = walk(apiRoot).filter((file) => {
      const source = readFileSync(file, 'utf8')
      return source.includes('queryLinkStats') || source.includes('guest-link-admin')
    })
    assert.deepEqual(statsCallers.map(file => file.slice(apiRoot.length + 1)).sort(), [
      'admin/links/[key].get.ts',
      'admin/links/[key]/stats/[endpoint].get.ts',
      'admin/links/index.get.ts'
    ])
    for (const file of statsCallers) {
      const source = readFileSync(file, 'utf8')
      assert.match(source, /defineAdminHandler/)
      assert.doesNotMatch(source, /defineEventHandler|publicClickTotal/)
    }
    const adminHandler = readFileSync(fileURLToPath(new URL('./admin-handler.ts', import.meta.url)), 'utf8')
    assert.match(adminHandler, /statusCode:\s*401/)
    assert.match(adminHandler, /statusCode:\s*403/)
    assert.match(adminHandler, /isAllowlistedAdmin/)

    const publicSource = readFileSync(fileURLToPath(new URL('./public-click-total.ts', import.meta.url)), 'utf8')
    assert.match(publicSource, /endpoint:\s*PUBLIC_CLICK_TOTAL\.endpoint/)
    assert.match(publicSource, /interval:\s*PUBLIC_CLICK_TOTAL\.interval/)
    assert.doesNotMatch(publicSource, /getQuery/)

    const helper = readFileSync(fileURLToPath(new URL('./link-stats-route.ts', import.meta.url)), 'utf8')
    assert.match(helper, /defineAuthHandler/)
    assert.doesNotMatch(helper, /defineEventHandler/)

    const auth = readFileSync(fileURLToPath(new URL('./handler.ts', import.meta.url)), 'utf8')
    assert.match(auth, /statusCode:\s*401/)

    const statsDir = fileURLToPath(new URL('../api/links/[key]/stats/', import.meta.url))
    const statsFiles = readdirSync(statsDir).filter(name => name.endsWith('.ts')).sort()
    assert.deepEqual(statsFiles, [
      '[endpoint].get.ts',
      ...[...LINK_STATS_ENDPOINTS].map(endpoint => `${endpoint}.get.ts`).sort()
    ])
    for (const name of statsFiles) {
      const source = readFileSync(`${statsDir}/${name}`, 'utf8')
      if (name === '[endpoint].get.ts') {
        assert.match(source, /defineAuthHandler/)
      } else {
        assert.match(source, /defineLinkStatsRoute\(/)
      }
      assert.equal(source.includes('publicClickTotal'), false)
      assert.equal(source.includes('defineEventHandler'), false)
    }

    const route = readFileSync(fileURLToPath(new URL('../api/public/links/[key]/clicks.get.ts', import.meta.url)), 'utf8')
    assert.match(route, /publicClickTotal\(event\)/)
    assert.match(route, /no-store/)
    assert.doesNotMatch(route, /defineAuthHandler|defineLinkStatsRoute|getQuery|queryLinkStats/)
  })
})

function walk (dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') { continue }
    const path = `${dir}/${entry}`
    if (statSync(path).isDirectory()) {
      files.push(...walk(path))
      continue
    }
    if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(path)
    }
  }
  return files
}
