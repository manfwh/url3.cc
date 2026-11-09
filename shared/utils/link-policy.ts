export const DAY_SECONDS = 60 * 60 * 24
export const GUEST_TTL_SECONDS = 7 * DAY_SECONDS
export const USER_DEFAULT_DAYS = 30
export const USER_MIN_DAYS = 1
export const USER_MAX_DAYS = 90

export function resolveExpiry (input: unknown, role: 'guest' | 'user'): { ok: true, seconds: number } | { ok: false } {
  if (role === 'guest') {
    if (input === undefined || input === null || input === '') {
      return { ok: true, seconds: GUEST_TTL_SECONDS }
    }
    return { ok: false }
  }

  if (input === undefined || input === null || input === '') {
    return { ok: true, seconds: USER_DEFAULT_DAYS * DAY_SECONDS }
  }

  const seconds = typeof input === 'number'
    ? input
    : typeof input === 'string' && input.trim() !== ''
      ? Number(input)
      : Number.NaN

  if (!Number.isInteger(seconds) || seconds <= 0 || seconds % DAY_SECONDS !== 0) {
    return { ok: false }
  }

  const days = seconds / DAY_SECONDS
  if (days < USER_MIN_DAYS || days > USER_MAX_DAYS) {
    return { ok: false }
  }
  return { ok: true, seconds }
}
