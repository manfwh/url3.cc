import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { readPublicClickTotal } from './public-clicks.ts'

describe('readPublicClickTotal', () => {
  it('reads only the numeric total', () => {
    assert.equal(readPublicClickTotal({ clicks: 15 }), 15)
    assert.equal(readPublicClickTotal({ clicks: 15.4 }), 15)
    assert.equal(readPublicClickTotal({
      clicks: 15,
      country: 'US',
      city: 'Paris',
      device: 'Mobile',
      browser: 'Chrome',
      os: 'iOS',
      referer: 'https://secret.example',
      start: '2026-11-07T00:00:00.000Z'
    }), 15)
  })

  it('does not treat a breakdown or timeseries payload as a total', () => {
    assert.equal(readPublicClickTotal({ country: 'US', clicks: '15' }), 0)
    assert.equal(readPublicClickTotal({ timeserirs: [{ start: '2026-11-07T00:00:00.000Z', clicks: 4 }] }), 0)
    assert.equal(readPublicClickTotal([{ clicks: 9, device: 'Desktop' }]), 0)
    assert.equal(readPublicClickTotal({ clicks: 0 }), 0)
    assert.equal(readPublicClickTotal({ clicks: null }), 0)
    assert.equal(readPublicClickTotal(null), 0)
    assert.equal(readPublicClickTotal(15), 0)
  })
})
