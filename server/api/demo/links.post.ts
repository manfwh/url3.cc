import { serverSupabaseUser } from '#supabase/server'
import { resolveExpiry } from '#shared/utils/link-policy'
import { enforceCreateRateLimit, requireLocalDestinations, requireSafeBrowsing } from '~~/server/utils/create-policy'
import { setRandomKey } from '~~/server/utils/upstash'

// Guest create has no captcha in v1. Abuse control is the IP limit (3/hour and 10/day),
// a local URL check, then Safe Browsing. The API key stays on the server.
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

  const local = requireLocalDestinations({ url: body?.url })
  if (!local.url) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsafe URL',
      data: { code: 'unsafe_url', reason: 'invalid' }
    })
  }
  const destination = local.url

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
  await requireSafeBrowsing(local)

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
