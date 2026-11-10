import { NON_DEFAULT_LOCALES } from './safe-redirect'

export const SITE_ORIGIN = 'https://app.url3.cc'

const PRIVATE_ROOTS = ['dashboard', 'admin', 'auth', 'confirm', 'login', 'test', 'protecded']

export function normalizePath (path: string) {
  const withoutHash = path.split('#')[0] || '/'
  const withoutQuery = withoutHash.split('?')[0] || '/'
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.replace(/\/+$/, '') || '/'
  }
  return withoutQuery || '/'
}

export function absoluteUrl (path: string) {
  return new URL(normalizePath(path), SITE_ORIGIN).href
}

export function isLocalizedHome (path: string) {
  const bare = normalizePath(path)
  if (bare === '/') { return true }
  return (NON_DEFAULT_LOCALES as readonly string[]).includes(bare.slice(1))
}

export function isPrivatePath (path: string) {
  const segments = normalizePath(path).split('/').filter(Boolean)
  if (segments.length === 0) { return false }
  const [first, second] = segments
  if (first && (NON_DEFAULT_LOCALES as readonly string[]).includes(first)) {
    return Boolean(second && PRIVATE_ROOTS.includes(second))
  }
  return Boolean(first && PRIVATE_ROOTS.includes(first))
}
