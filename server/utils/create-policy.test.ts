import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { createError, getRequestIP, type H3Event } from 'h3'

Object.assign(globalThis, { createError })

const { enforceCreateRateLimit, enforcePublicClickRateLimit, enforceReportRateLimit } = await import('./create-policy')

type LimitWindow = '1 m' | '1 h' | '1 d'

type LimitError = {
  statusCode?: number
  statusMessage?: string
  message?: string
  data?: { code?: string, limit?: string }
  toJSON?: () => unknown
}

function guestEvent (forwardedFor?: string, remoteAddress = '127.0.0.1'): H3Event {
  const headers: Record<string, string> = {}
  if (forwardedFor !== undefined) {
    headers['x-forwarded-for'] = forwardedFor
  }
  return {
    context: {},
    node: {
      req: {
        headers,
        socket: { remoteAddress }
      }
    }
  } as unknown as H3Event
}

function memoryLimits () {
  const counts = new Map<string, number>()
  const calls: Array<{ id: string, requests: number, window: LimitWindow }> = []
  const consume = (id: string, requests: number, window: LimitWindow) => {
    calls.push({ id, requests, window })
    const used = (counts.get(id) ?? 0) + 1
    counts.set(id, used)
    return Promise.resolve(used <= requests)
  }
  return { counts, calls, consume }
}

function visibleError (err: LimitError) {
  return JSON.stringify({
    message: err.message,
    statusMessage: err.statusMessage,
    data: err.data,
    json: typeof err.toJSON === 'function' ? err.toJSON() : undefined
  })
}

async function assertRateLimited (
  run: () => Promise<unknown>,
  limit: '3/hour' | '10/day' | '30/day' | '5/hour' | '30/minute' | '240/hour',
  hidden: string[]
) {
  await assert.rejects(run, (err: unknown) => {
    const error = err as LimitError
    assert.equal(error.statusCode, 429)
    assert.equal(error.statusMessage, 'Too Many Requests')
    assert.deepEqual(error.data, { code: 'rate_limited', limit })
    const visible = visibleError(error)
    for (const address of hidden) {
      assert.equal(visible.includes(address), false)
    }
    return true
  })
}

describe('getRequestIP on this h3 version', () => {
  it('reads x-forwarded-for only when xForwardedFor is set', () => {
    const event = guestEvent('203.0.113.10, 127.0.0.1')
    assert.equal(getRequestIP(event), '127.0.0.1')
    assert.equal(getRequestIP(event, { xForwardedFor: true }), '203.0.113.10')
  })
})

describe('enforceCreateRateLimit guests', () => {
  it('keeps different forwarded clients on separate keys and enforces 3 per hour', async () => {
    const limits = memoryLimits()
    const options = { consume: limits.consume }
    const hidden = ['203.0.113.10', '198.51.100.20', '127.0.0.1']
    const clientA = guestEvent('203.0.113.10, 127.0.0.1')
    const clientB = guestEvent('  198.51.100.20 , 10.0.0.4')

    for (let i = 0; i < 3; i++) {
      await enforceCreateRateLimit(clientA, 'guest', null, options)
      await enforceCreateRateLimit(clientB, 'guest', null, options)
    }

    assert.deepEqual(limits.calls.slice(0, 4), [
      { id: 'guest:203.0.113.10:hour', requests: 3, window: '1 h' },
      { id: 'guest:203.0.113.10:day', requests: 10, window: '1 d' },
      { id: 'guest:198.51.100.20:hour', requests: 3, window: '1 h' },
      { id: 'guest:198.51.100.20:day', requests: 10, window: '1 d' }
    ])
    assert.equal(limits.calls.some(call => call.id.includes('127.0.0.1')), false)
    assert.equal(limits.calls.some(call => call.id.includes('10.0.0.4')), false)

    await assertRateLimited(
      () => enforceCreateRateLimit(clientA, 'guest', 'user_a', options),
      '3/hour',
      hidden
    )
    await assertRateLimited(
      () => enforceCreateRateLimit(guestEvent('198.51.100.20'), 'guest', null, options),
      '3/hour',
      hidden
    )
    await enforceCreateRateLimit(guestEvent('2001:db8::10'), 'guest', null, options)
    assert.equal(limits.calls.some(call => call.id === 'guest:2001:db8::10:hour'), true)
    assert.equal(limits.counts.get('guest:203.0.113.10:hour'), 4)
    assert.equal(limits.counts.get('guest:198.51.100.20:hour'), 4)
    assert.equal(limits.counts.get('guest:2001:db8::10:hour'), 1)
  })

  it('still enforces 10 guest creates per day after the hour window clears', async () => {
    const limits = memoryLimits()
    const options = { consume: limits.consume }
    const ip = '203.0.113.10'
    const event = guestEvent(ip)
    let blockedDay = false

    for (let attempt = 0; attempt < 40 && !blockedDay; attempt++) {
      try {
        await enforceCreateRateLimit(event, 'guest', null, options)
      } catch (err) {
        const limit = (err as LimitError).data?.limit
        if (limit === '10/day') {
          blockedDay = true
          const visible = visibleError(err as LimitError)
          assert.equal(visible.includes(ip), false)
          break
        }
        assert.equal(limit, '3/hour')
        limits.counts.delete(`guest:${ip}:hour`)
      }
    }

    assert.equal(blockedDay, true)
    assert.ok((limits.counts.get(`guest:${ip}:day`) ?? 0) >= 11)
    await enforceCreateRateLimit(guestEvent('198.51.100.20'), 'guest', null, options)
    assert.equal(limits.counts.get('guest:198.51.100.20:day'), 1)
  })

  it('shares the socket address only when no forwarded client is present, and the cap still applies', async () => {
    const limits = memoryLimits()
    const options = { consume: limits.consume }

    for (let i = 0; i < 3; i++) {
      await enforceCreateRateLimit(guestEvent(undefined, '127.0.0.1'), 'guest', null, options)
    }
    await assertRateLimited(
      () => enforceCreateRateLimit(guestEvent(''), 'guest', null, options),
      '3/hour',
      ['127.0.0.1']
    )
    await enforceCreateRateLimit(guestEvent('203.0.113.10'), 'guest', null, options)
    assert.equal(limits.counts.get('guest:127.0.0.1:hour'), 4)
    assert.equal(limits.counts.get('guest:203.0.113.10:hour'), 1)
  })
})

describe('enforceReportRateLimit', () => {
  it('limits each forwarded client to 5 reports per hour', async () => {
    const limits = memoryLimits()
    const options = { consume: limits.consume }
    const hidden = ['203.0.113.10', '198.51.100.20']

    for (let i = 0; i < 5; i++) {
      await enforceReportRateLimit(guestEvent('203.0.113.10'), options)
    }
    await assertRateLimited(
      () => enforceReportRateLimit(guestEvent('203.0.113.10, 127.0.0.1'), options),
      '5/hour',
      hidden
    )
    await enforceReportRateLimit(guestEvent('198.51.100.20'), options)

    assert.deepEqual(limits.calls[0], {
      id: 'report:203.0.113.10:hour',
      requests: 5,
      window: '1 h'
    })
    assert.equal(limits.counts.get('report:203.0.113.10:hour'), 6)
    assert.equal(limits.counts.get('report:198.51.100.20:hour'), 1)
    assert.equal(limits.calls.some(call => call.id.startsWith('guest:')), false)
  })
})

describe('enforcePublicClickRateLimit', () => {
  it('limits each forwarded client to 30 public totals per minute', async () => {
    const limits = memoryLimits()
    const options = { consume: limits.consume }
    const hidden = ['203.0.113.10', '198.51.100.20', '127.0.0.1', '10.0.0.4']
    const clientA = guestEvent('203.0.113.10, 127.0.0.1')
    const clientB = guestEvent('  198.51.100.20 , 10.0.0.4')

    for (let i = 0; i < 30; i++) {
      await enforcePublicClickRateLimit(clientA, options)
      await enforcePublicClickRateLimit(clientB, options)
    }

    assert.deepEqual(limits.calls.slice(0, 4), [
      { id: 'public-clicks:203.0.113.10:minute', requests: 30, window: '1 m' },
      { id: 'public-clicks:203.0.113.10:hour', requests: 240, window: '1 h' },
      { id: 'public-clicks:198.51.100.20:minute', requests: 30, window: '1 m' },
      { id: 'public-clicks:198.51.100.20:hour', requests: 240, window: '1 h' }
    ])
    assert.equal(limits.calls.some(call => call.id.includes('127.0.0.1')), false)
    assert.equal(limits.calls.some(call => call.id.includes('10.0.0.4')), false)
    assert.equal(limits.calls.some(call => call.id.startsWith('guest:')), false)
    assert.equal(limits.calls.some(call => call.id.startsWith('report:')), false)

    await assertRateLimited(
      () => enforcePublicClickRateLimit(clientA, options),
      '30/minute',
      hidden
    )
    assert.equal(limits.counts.get('public-clicks:203.0.113.10:minute'), 31)
    assert.equal(limits.counts.get('public-clicks:203.0.113.10:hour'), 30)
    await enforcePublicClickRateLimit(guestEvent('2001:db8::10'), options)
    assert.equal(limits.counts.get('public-clicks:2001:db8::10:minute'), 1)
    assert.equal(limits.counts.get('public-clicks:198.51.100.20:minute'), 30)
  })

  it('still enforces 240 public totals per hour when the minute window is open', async () => {
    const hourCounts = new Map<string, number>()
    const consume = (id: string, requests: number) => {
      if (id.endsWith(':minute')) { return Promise.resolve(true) }
      const used = (hourCounts.get(id) ?? 0) + 1
      hourCounts.set(id, used)
      return Promise.resolve(used <= requests)
    }
    const options = { consume }
    const event = guestEvent('203.0.113.10, 127.0.0.1')

    for (let i = 0; i < 240; i++) {
      await enforcePublicClickRateLimit(event, options)
    }

    await assertRateLimited(
      () => enforcePublicClickRateLimit(event, options),
      '240/hour',
      ['203.0.113.10', '127.0.0.1']
    )
    await enforcePublicClickRateLimit(guestEvent('198.51.100.20'), options)
    assert.equal(hourCounts.get('public-clicks:203.0.113.10:hour'), 241)
    assert.equal(hourCounts.get('public-clicks:198.51.100.20:hour'), 1)
  })
})

describe('enforceCreateRateLimit signed-in users', () => {
  it('keeps the per-user daily cap and ignores the client address', async () => {
    const limits = memoryLimits()
    const options = { consume: limits.consume }
    const addresses = ['203.0.113.10', '198.51.100.20', '127.0.0.1']

    for (let i = 0; i < 30; i++) {
      const event = guestEvent(i % 2 === 0 ? '203.0.113.10' : '198.51.100.20')
      await enforceCreateRateLimit(event, 'user', 'user_a', options)
    }

    assert.equal(limits.calls.length, 30)
    assert.equal(limits.calls.every(call => call.id === 'user:user_a:day' && call.requests === 30 && call.window === '1 d'), true)
    await assertRateLimited(
      () => enforceCreateRateLimit(guestEvent('203.0.113.44'), 'user', 'user_a', options),
      '30/day',
      addresses
    )
    await enforceCreateRateLimit(guestEvent('203.0.113.10'), 'user', 'user_b', options)
    assert.equal(limits.counts.get('user:user_a:day'), 31)
    assert.equal(limits.counts.get('user:user_b:day'), 1)
  })

  it('rejects a signed-in call without a user id before consuming a limit', async () => {
    const limits = memoryLimits()
    await assert.rejects(
      () => enforceCreateRateLimit(guestEvent('203.0.113.10'), 'user', null, { consume: limits.consume }),
      (err: unknown) => {
        const error = err as LimitError
        assert.equal(error.statusCode, 401)
        assert.deepEqual(error.data, { code: 'unauthorized' })
        assert.equal(visibleError(error).includes('203.0.113.10'), false)
        return true
      }
    )
    assert.equal(limits.calls.length, 0)
  })
})
