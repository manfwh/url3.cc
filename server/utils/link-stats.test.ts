import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  CLICK_EVENTS_SCHEMA,
  LinkStatsError,
  buildLinkStatsQuery,
  linkStatsWindow,
  mapLinkStatsRows,
  queryLinkStats
} from './link-stats'

const NOW = new Date('2026-11-07T01:12:00.000Z')
const ACCOUNT_ID = '0123456789abcdef0123456789abcdef'
const TOKEN = 'analytics-engine-test-token'

function queryFor (endpoint: Parameters<typeof buildLinkStatsQuery>[0]['endpoint'], interval: Parameters<typeof linkStatsWindow>[0] = '24h') {
  const window = linkStatsWindow(interval, NOW)
  return {
    window,
    sql: buildLinkStatsQuery({
      endpoint,
      key: 'abc123',
      dataset: CLICK_EVENTS_SCHEMA.dataset,
      window
    })
  }
}

describe('link stats intervals', () => {
  it('keeps the existing durations and granularities', () => {
    const cases = [
      ['1h', '2026-11-07T00:12:00.000Z', 'minute'],
      ['24h', '2026-11-06T01:12:00.000Z', 'hour'],
      ['7d', '2026-10-31T01:12:00.000Z', 'day'],
      ['30d', '2026-10-08T01:12:00.000Z', 'day'],
      ['90d', '2026-08-09T01:12:00.000Z', 'month'],
      ['all', '2022-09-22T00:00:00.000Z', 'month']
    ] as const

    for (const [interval, start, granularity] of cases) {
      const window = linkStatsWindow(interval, NOW)
      assert.equal(window.start.toISOString(), start)
      assert.equal(window.end.toISOString(), NOW.toISOString())
      assert.equal(window.granularity, granularity)
    }
  })
})

describe('analytics engine query mapping', () => {
  it('counts clicks for one link with sampling weights', () => {
    const { window, sql } = queryFor('clicks', 'all')
    const start = Math.floor(window.start.getTime() / 1000)
    assert.match(sql, /SELECT SUM\(_sample_interval\) AS clicks/)
    assert.match(sql, /FROM `url3-cc`/)
    assert.match(sql, /blob20 = 'abc123'/)
    assert.match(sql, /blob20 = '' AND index1 = 'abc123'/)
    assert.equal(sql.includes('link_clicks'), false)
    assert.match(sql, new RegExp(`timestamp >= toDateTime\\(${start}\\)`))
    assert.doesNotMatch(sql, /GROUP BY/)
    assert.match(sql, /FORMAT JSON$/)
    assert.equal(sql.includes(TOKEN), false)
  })

  it('buckets the timeseries at the interval granularity', () => {
    const minute = queryFor('timeserirs', '1h').sql
    const hour = queryFor('timeserirs', '24h').sql
    const day = queryFor('timeserirs', '7d').sql
    const month = queryFor('timeserirs', '90d').sql
    assert.match(minute, /toStartOfMinute\(timestamp\) AS start/)
    assert.match(hour, /toStartOfHour\(timestamp\) AS start/)
    assert.match(day, /toStartOfDay\(timestamp\) AS start/)
    assert.match(month, /toStartOfMonth\(timestamp\) AS start/)
    assert.match(hour, /SUM\(_sample_interval\) AS clicks/)
    assert.match(hour, /ORDER BY toStartOfHour\(timestamp\) ASC/)
  })

  it('groups each chart dimension by the worker blob contract', () => {
    const expected = [
      ['country', 'blob1 AS country', 'GROUP BY blob1'],
      ['city', 'blob2 AS city, blob1 AS country', 'GROUP BY blob2, blob1'],
      ['browser', 'blob7 AS browser', 'GROUP BY blob7'],
      ['os', 'blob11 AS os', 'GROUP BY blob11'],
      ['device', 'blob13 AS device', 'GROUP BY blob13'],
      ['referer', 'blob18 AS referer', 'GROUP BY blob18']
    ] as const

    for (const [endpoint, select, group] of expected) {
      const sql = queryFor(endpoint).sql
      assert.match(sql, new RegExp(select.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      assert.match(sql, new RegExp(group.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
      assert.match(sql, /ORDER BY clicks DESC/)
    }
    assert.equal(CLICK_EVENTS_SCHEMA.binding, 'CLICK_EVENTS')
    assert.equal(CLICK_EVENTS_SCHEMA.dataset, 'url3-cc')
    assert.equal(CLICK_EVENTS_SCHEMA.fullKey, 'blob20')
    assert.equal(CLICK_EVENTS_SCHEMA.blobs.blob7, 'browser')
    assert.equal(CLICK_EVENTS_SCHEMA.blobs.blob11, 'os')
    assert.equal(CLICK_EVENTS_SCHEMA.blobs.blob13, 'device')
    assert.equal(CLICK_EVENTS_SCHEMA.blobs.blob17, 'bot')
    assert.equal(CLICK_EVENTS_SCHEMA.blobs.blob18, 'referer')
    assert.equal(CLICK_EVENTS_SCHEMA.blobs.blob20, 'key')
  })

  it('quotes link keys and rejects dataset names that are not identifiers', () => {
    const sql = buildLinkStatsQuery({
      endpoint: 'clicks',
      key: "o'brien",
      dataset: 'url3-cc',
      window: linkStatsWindow('1h', NOW)
    })
    assert.match(sql, /FROM `url3-cc`/)
    assert.match(sql, /blob20 = 'o''brien'/)
    assert.match(sql, /index1 = 'o''brien'/)
    assert.equal(sql.split('FORMAT JSON').length, 2)

    assert.throws(
      () => buildLinkStatsQuery({
        endpoint: 'clicks',
        key: 'abc',
        dataset: 'url3-cc`;drop',
        window: linkStatsWindow('1h', NOW)
      }),
      (error: unknown) => error instanceof LinkStatsError && error.statusCode === 500
    )
    assert.throws(
      () => buildLinkStatsQuery({
        endpoint: 'device',
        key: 'bad\nkey',
        dataset: 'url3-cc',
        window: linkStatsWindow('1h', NOW)
      }),
      (error: unknown) => error instanceof LinkStatsError && error.statusCode === 400
    )
  })
})

describe('analytics engine response shapes', () => {
  it('returns a numeric click total, including zero', () => {
    const window = linkStatsWindow('all', NOW)
    assert.equal(mapLinkStatsRows('clicks', [{ clicks: '15' }], window), 15)
    assert.equal(mapLinkStatsRows('clicks', [{ clicks: null }], window), 0)
    assert.equal(mapLinkStatsRows('clicks', [], window), 0)
  })

  it('fills missing timeseries buckets and keeps start plus clicks', () => {
    const window = linkStatsWindow('1h', new Date('2026-11-07T01:00:00.000Z'))
    const rows = mapLinkStatsRows('timeserirs', [
      { start: '2026-11-07 00:30:00', clicks: '4' }
    ], window)
    assert.equal(Array.isArray(rows), true)
    if (!Array.isArray(rows)) { return }
    assert.equal(rows.length, 61)
    assert.deepEqual(rows[0], { start: '2026-11-07T00:00:00.000Z', clicks: 0 })
    assert.deepEqual(rows[30], { start: '2026-11-07T00:30:00.000Z', clicks: 4 })
    assert.deepEqual(rows.at(-1), { start: '2026-11-07T01:00:00.000Z', clicks: 0 })
  })

  it('maps chart rows to the fields the Vue components read', () => {
    const window = linkStatsWindow('7d', NOW)
    assert.deepEqual(
      mapLinkStatsRows('country', [
        { country: 'us', clicks: 2, index1: 'secret' },
        { country: '', clicks: 9 },
        { country: 'CA', clicks: 5 }
      ], window),
      [
        { country: 'CA', clicks: 5 },
        { country: 'US', clicks: 2 }
      ]
    )
    assert.deepEqual(
      mapLinkStatsRows('device', [{ device: 'Desktop', clicks: 3 }], window),
      [{ device: 'Desktop', clicks: 3 }]
    )
    assert.deepEqual(
      mapLinkStatsRows('browser', [{ browser: 'Chrome', clicks: 8 }], window),
      [{ browser: 'Chrome', clicks: 8 }]
    )
    assert.deepEqual(
      mapLinkStatsRows('os', [{ os: 'Windows', clicks: 1 }], window),
      [{ os: 'Windows', clicks: 1 }]
    )
    assert.deepEqual(
      mapLinkStatsRows('city', [{ city: 'Paris', country: 'fr', clicks: 4 }], window),
      [{ city: 'Paris', country: 'FR', clicks: 4 }]
    )
    assert.deepEqual(
      mapLinkStatsRows('referer', [{ referer: 'example.com', clicks: 6 }], window),
      [{ referer: 'example.com', clicks: 6 }]
    )
  })
})

describe('analytics engine sql request', () => {
  it('posts the query with the server token and returns chart rows', async () => {
    const calls: { url: string, init: RequestInit }[] = []
    const fetchImpl: typeof fetch = (url, init) => {
      calls.push({ url: String(url), init: init ?? {} })
      return Promise.resolve(new Response(JSON.stringify({
        data: [{ device: 'Mobile', clicks: 2 }]
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
    }

    const result = await queryLinkStats({
      endpoint: 'device',
      key: 'abc123',
      interval: '7d'
    }, {
      accountId: ACCOUNT_ID,
      apiToken: TOKEN,
      dataset: 'url3-cc',
      fetchImpl,
      now: NOW
    })

    assert.deepEqual(result, [{ device: 'Mobile', clicks: 2 }])
    assert.equal(calls.length, 1)
    assert.equal(
      calls[0].url,
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql`
    )
    const headers = new Headers(calls[0].init.headers)
    assert.equal(headers.get('authorization'), `Bearer ${TOKEN}`)
    assert.equal(calls[0].init.method, 'POST')
    assert.equal(String(calls[0].init.body).includes(TOKEN), false)
    assert.match(String(calls[0].init.body), /blob13 AS device/)
    assert.match(String(calls[0].init.body), /blob20 = 'abc123'/)
    assert.equal(JSON.stringify(result).includes(TOKEN), false)
  })

  it('does not return upstream errors or call the api for a bad endpoint', async () => {
    let called = false
    const fetchImpl: typeof fetch = () => {
      called = true
      return Promise.resolve(new Response(JSON.stringify({ error: TOKEN }), { status: 400 }))
    }

    await assert.rejects(
      () => queryLinkStats({
        endpoint: 'not-a-pipe',
        key: 'abc123',
        interval: '1h'
      }, {
        accountId: ACCOUNT_ID,
        apiToken: TOKEN,
        fetchImpl,
        now: NOW
      }),
      (error: unknown) => {
        assert.equal(error instanceof LinkStatsError, true)
        if (!(error instanceof LinkStatsError)) { return false }
        assert.equal(error.statusCode, 404)
        assert.equal(error.message.includes(TOKEN), false)
        return true
      }
    )
    assert.equal(called, false)

    await assert.rejects(
      () => queryLinkStats({
        endpoint: 'clicks',
        key: 'abc123',
        interval: 'nope'
      }, {
        accountId: ACCOUNT_ID,
        apiToken: TOKEN,
        fetchImpl,
        now: NOW
      }),
      (error: unknown) => error instanceof LinkStatsError && error.statusCode === 400
    )
    await assert.rejects(
      () => queryLinkStats({
        endpoint: 'clicks',
        key: 'abc123',
        interval: 'all'
      }, {
        accountId: 'not-an-account',
        apiToken: TOKEN,
        fetchImpl,
        now: NOW
      }),
      (error: unknown) => error instanceof LinkStatsError &&
        error.statusCode === 500 &&
        !String(error.message).includes(TOKEN)
    )
    assert.equal(called, false)

    await assert.rejects(
      () => queryLinkStats({
        endpoint: 'clicks',
        key: 'abc123',
        interval: '1h'
      }, {
        accountId: ACCOUNT_ID,
        apiToken: TOKEN,
        fetchImpl,
        now: NOW
      }),
      (error: unknown) => error instanceof LinkStatsError &&
        error.statusCode === 502 &&
        error.message === 'Analytics query failed' &&
        !error.message.includes(TOKEN)
    )
  })
})
