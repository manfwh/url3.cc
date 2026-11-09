import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isAllowlistedAdmin, parseAdminAllowlist } from './admin-access'

describe('parseAdminAllowlist', () => {
  it('trims, lowercases, and drops blank entries', () => {
    const allowlist = parseAdminAllowlist(' Admin@Example.com, ,ops@url3.cc ', ' ABC, 3F2504E0-4F89-41D3-9A0C-0305E82C3301 ')
    assert.deepEqual([...allowlist.emails], ['admin@example.com', 'ops@url3.cc'])
    assert.deepEqual([...allowlist.ids], ['3f2504e0-4f89-41d3-9a0c-0305e82c3301'])
  })

  it('is empty when the env values are missing', () => {
    const allowlist = parseAdminAllowlist(undefined, '')
    assert.equal(allowlist.emails.size, 0)
    assert.equal(allowlist.ids.size, 0)
  })
})

describe('isAllowlistedAdmin', () => {
  const allowlist = parseAdminAllowlist(
    'admin@example.com',
    '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
  )

  it('matches email or user id', () => {
    assert.equal(isAllowlistedAdmin({ email: 'Admin@Example.com', id: 'other' }, allowlist), true)
    assert.equal(isAllowlistedAdmin({
      id: '3F2504E0-4F89-41D3-9A0C-0305E82C3301'
    }, allowlist), true)
  })

  it('rejects everyone when the allowlist is empty', () => {
    const empty = parseAdminAllowlist()
    assert.equal(isAllowlistedAdmin({ email: 'admin@example.com' }, empty), false)
    assert.equal(isAllowlistedAdmin({ email: 'guest@example.com', id: '11111111-1111-4111-8111-111111111111' }, allowlist), false)
  })
})
