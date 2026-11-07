export function readPublicClickTotal (payload: unknown) {
  if (!payload || typeof payload !== 'object') { return 0 }
  const value = (payload as { clicks?: unknown }).clicks
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) { return 0 }
  return Math.round(value)
}
