export const NON_DEFAULT_LOCALES = ['zh', 'ja', 'ko', 'id', 'vi', 'th', 'es', 'pt', 'fr', 'ru', 'it', 'de']

export function localizedPath (currentPath: string, path: string) {
  const match = currentPath.match(/^\/([a-z]{2})(?=\/|$)/)
  const prefix = match && NON_DEFAULT_LOCALES.includes(match[1]) ? `/${match[1]}` : ''
  return `${prefix}${path}`
}

export function safeInternalPath (value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') { return null }
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > 512) { return null }

  let path = trimmed
  try {
    path = decodeURIComponent(trimmed)
  } catch {
    return null
  }

  if (!path.startsWith('/') || path.startsWith('//')) { return null }
  if (path.includes('\\') || path.includes('://') || path.includes('@')) { return null }
  for (let index = 0; index < path.length; index++) {
    const code = path.charCodeAt(index)
    if (code <= 31 || code === 127) { return null }
  }
  return path
}
