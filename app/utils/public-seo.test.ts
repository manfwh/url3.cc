import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { absoluteUrl, isLocalizedHome, isPrivatePath, normalizePath } from './public-seo.ts'

describe('normalizePath', () => {
  it('drops query, hash, and trailing slashes', () => {
    assert.equal(normalizePath('/zh/?q=1#faq'), '/zh')
    assert.equal(normalizePath('/'), '/')
    assert.equal(normalizePath(''), '/')
  })
})

describe('absoluteUrl', () => {
  it('builds a self URL on the public origin', () => {
    assert.equal(absoluteUrl('/'), 'https://app.url3.cc/')
    assert.equal(absoluteUrl('/zh'), 'https://app.url3.cc/zh')
    assert.equal(absoluteUrl('/changelog'), 'https://app.url3.cc/changelog')
  })
})

describe('isLocalizedHome', () => {
  it('matches only the unprefixed English home and prefixed locale homes', () => {
    assert.equal(isLocalizedHome('/'), true)
    assert.equal(isLocalizedHome('/de'), true)
    assert.equal(isLocalizedHome('/zh/'), true)
    assert.equal(isLocalizedHome('/en'), false)
    assert.equal(isLocalizedHome('/zh/login'), false)
    assert.equal(isLocalizedHome('/changelog'), false)
  })
})

describe('isPrivatePath', () => {
  it('matches private and short-link utility routes in every locale', () => {
    assert.equal(isPrivatePath('/login'), true)
    assert.equal(isPrivatePath('/zh/login'), true)
    assert.equal(isPrivatePath('/dashboard/links/abc'), true)
    assert.equal(isPrivatePath('/ja/admin'), true)
    assert.equal(isPrivatePath('/auth/verify-request'), true)
    assert.equal(isPrivatePath('/confirm'), true)
    assert.equal(isPrivatePath('/test'), true)
    assert.equal(isPrivatePath('/protecded/abc'), true)
    assert.equal(isPrivatePath('/de/protecded/abc'), true)
    assert.equal(isPrivatePath('/'), false)
    assert.equal(isPrivatePath('/fr'), false)
    assert.equal(isPrivatePath('/changelog'), false)
    assert.equal(isPrivatePath('/testing'), false)
  })
})
