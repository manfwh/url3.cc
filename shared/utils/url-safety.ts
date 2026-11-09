export type UrlSafetyReason =
  | 'invalid'
  | 'scheme'
  | 'ip'
  | 'localhost'
  | 'private'
  | 'blacklist'

export type UrlSafetyResult =
  | { ok: true, url: URL, domain: string }
  | { ok: false, reason: UrlSafetyReason }

const BLACKLIST = [
  'pornhub.com',
  'xvideos.com',
  'xhamster.com',
  'xnxx.com',
  'redtube.com'
]

const MAX_URL_LENGTH = 2048

export function checkUrlSafety (input: unknown): UrlSafetyResult {
  if (typeof input !== 'string') {
    return { ok: false, reason: 'invalid' }
  }
  const raw = input.trim()
  if (!raw || raw.length > MAX_URL_LENGTH || /\s/.test(raw)) {
    return { ok: false, reason: 'invalid' }
  }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return { ok: false, reason: 'invalid' }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'scheme' }
  }

  let hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1)
  }
  if (!hostname || hostname.includes('%')) {
    return { ok: false, reason: 'invalid' }
  }

  if (isLocalhostName(hostname)) {
    return { ok: false, reason: 'localhost' }
  }

  const ipReason = classifyIp(hostname)
  if (ipReason) {
    return { ok: false, reason: ipReason }
  }

  if (isBlacklisted(hostname)) {
    return { ok: false, reason: 'blacklist' }
  }

  return { ok: true, url, domain: hostname }
}

function isLocalhostName (hostname: string) {
  return hostname === 'localhost' ||
    hostname === 'localhost.localdomain' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
}

function isBlacklisted (hostname: string) {
  return BLACKLIST.some(domain => hostname === domain || hostname.endsWith(`.${domain}`))
}

function classifyIp (hostname: string): 'ip' | 'localhost' | 'private' | null {
  const dotted = parseDottedIpv4(hostname)
  if (dotted) {
    return classifyV4(dotted)
  }

  if (/^\d+$/.test(hostname)) {
    return classifyInteger(Number(hostname))
  }

  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    return classifyInteger(Number(hostname))
  }

  if (hostname.includes(':')) {
    return classifyV6(hostname)
  }

  return null
}

function parseDottedIpv4 (hostname: string): number[] | null {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    return null
  }
  const parts = hostname.split('.').map(parseOctet)
  if (parts.some(part => part === null)) {
    return [256]
  }
  return parts as number[]
}

function parseOctet (part: string): number | null {
  if (!/^\d+$/.test(part)) {
    return null
  }
  if (part.length > 1 && part.startsWith('0')) {
    if (!/^[0-7]+$/.test(part)) {
      return Number(part)
    }
    return Number.parseInt(part, 8)
  }
  return Number(part)
}

function classifyInteger (value: number): 'ip' | 'localhost' | 'private' {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0xFFFFFFFF) {
    return 'ip'
  }
  return classifyV4([
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255
  ])
}

function classifyV4 (parts: number[]): 'ip' | 'localhost' | 'private' {
  if (parts.length !== 4 || parts.some(part => part > 255)) {
    return 'ip'
  }
  const [a, b] = parts
  if (a === 127) {
    return 'localhost'
  }
  if (
    a === 0 ||
    a === 10 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255)
  ) {
    return 'private'
  }
  return 'ip'
}

function classifyV6 (hostname: string): 'ip' | 'localhost' | 'private' {
  const host = hostname.toLowerCase()
  const mapped = host.match(/(?:^|:)ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i)
  if (mapped) {
    const v4 = parseDottedIpv4(mapped[1])
    return v4 ? classifyV4(v4) : 'ip'
  }
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') {
    return 'localhost'
  }
  if (host === '::' || host === '0:0:0:0:0:0:0:0') {
    return 'private'
  }
  if (/^fe[89ab]/.test(host) || /^f[cd][0-9a-f]{0,2}:/.test(host)) {
    return 'private'
  }
  return 'ip'
}
