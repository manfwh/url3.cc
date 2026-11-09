import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { normalizeVisitorId } from './visitor-id'

describe('normalizeVisitorId', () => {
  it('accepts a random UUID and stores it lowercase', () => {
    assert.equal(
      normalizeVisitorId(' 3F2504E0-4F89-41D3-9A0C-0305E82C3301 '),
      '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
    )
  })

  it('rejects missing, blank, and non-UUID values', () => {
    assert.equal(normalizeVisitorId(undefined), null)
    assert.equal(normalizeVisitorId(''), null)
    assert.equal(normalizeVisitorId('not-a-uuid'), null)
    assert.equal(normalizeVisitorId('3f2504e04f8941d39a0c0305e82c3301'), null)
  })
})
