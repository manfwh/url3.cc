import { serverSupabaseUser } from '#supabase/server'
import { resolveExpiry } from '~/utils/link-policy'
import { assertLocalDestination, assertRemoteDestination, enforceCreateRateLimit } from '~/server/utils/create-policy'
import { setRandomKey } from '~/server/utils/upstash'

// Guest create has no captcha in v1. Abuse control is the IP limit (3/hour and 10/day) plus URL safety.
export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { url?: unknown, type?: unknown, expiresIn?: unknown }
  const type = body?.type || 'url'
  if (type !== 'url') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported type',
      data: { code: 'unsupported_type' }
    })
  }

  const url = typeof body?.url === 'string' ? body.url.trim() : ''
  const destination = assertLocalDestination(url)

  let userId: string | null = null
  try {
    const user = await serverSupabaseUser(event)
    userId = user?.id ?? null
  } catch {
    userId = null
  }
  const role = userId ? 'user' : 'guest'
  const expiry = resolveExpiry(body?.expiresIn, role)
  if (!expiry.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid expiry',
      data: { code: 'invalid_expiry' }
    })
  }

  await enforceCreateRateLimit(event, role, userId)
  await assertRemoteDestination(destination)

  const { response, key } = await setRandomKey({
    type: 'url',
    url: destination
  }, expiry.seconds)
  if (response !== 'OK') {
    throw createError({ statusCode: 500, statusMessage: 'Create Error', data: { code: 'create_failed' } })
  }

  setResponseStatus(event, 201)
  return {
    key,
    url: destination,
    expiresIn: expiry.seconds,
    expiresAt: expiry.seconds > 0 ? new Date(Date.now() + expiry.seconds * 1000).toISOString() : null
  }
})
