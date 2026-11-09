import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { localizedPath, safeInternalPath } from './safe-redirect.ts'

describe('localizedPath', () => {
  it('prefixes non-default locales and leaves English unprefixed', () => {
    assert.equal(localizedPath('/zh/dashboard', '/login'), '/zh/login')
    assert.equal(localizedPath('/dashboard', '/login'), '/login')
    assert.equal(localizedPath('/ja', '/'), '/ja/')
  })
})

describe('safeInternalPath', () => {
  it('keeps same-site paths, including locale prefixes and query strings', () => {
    assert.equal(safeInternalPath('/dashboard'), '/dashboard')
    assert.equal(safeInternalPath('/zh/dashboard?page=2'), '/zh/dashboard?page=2')
    assert.equal(safeInternalPath(['/links/abc']), '/links/abc')
  })

  it('rejects external and protocol-relative redirects', () => {
    assert.equal(safeInternalPath('https://evil.example'), null)
    assert.equal(safeInternalPath('//evil.example'), null)
    assert.equal(safeInternalPath('/\\evil.example'), null)
    assert.equal(safeInternalPath('javascript:alert(1)'), null)
    assert.equal(safeInternalPath(''), null)
    assert.equal(safeInternalPath(null), null)
  })
})
