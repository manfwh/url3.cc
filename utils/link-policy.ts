export const EXPIRY = {
  day: 60 * 60 * 24,
  week: 60 * 60 * 24 * 7,
  month: 60 * 60 * 24 * 30,
  quarter: 60 * 60 * 24 * 90,
  year: 60 * 60 * 24 * 365,
  never: 0
} as const

export const GUEST_EXPIRY_VALUES = [EXPIRY.day, EXPIRY.week] as const
export const USER_EXPIRY_VALUES = [
  EXPIRY.day,
  EXPIRY.week,
  EXPIRY.month,
  EXPIRY.quarter,
  EXPIRY.year,
  EXPIRY.never
] as const

export function resolveExpiry (input: unknown, role: 'guest' | 'user'): { ok: true, seconds: number } | { ok: false } {
  const fallback = role === 'guest' ? EXPIRY.week : EXPIRY.never
  if (input === undefined || input === null || input === '') {
    return { ok: true, seconds: fallback }
  }

  const seconds = typeof input === 'number'
    ? input
    : typeof input === 'string' && input.trim() !== ''
      ? Number(input)
      : Number.NaN

  if (!Number.isInteger(seconds)) {
    return { ok: false }
  }

  const allowed = role === 'guest' ? GUEST_EXPIRY_VALUES : USER_EXPIRY_VALUES
  if (!(allowed as readonly number[]).includes(seconds)) {
    return { ok: false }
  }
  return { ok: true, seconds }
}
