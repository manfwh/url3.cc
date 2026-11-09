import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { resolveExpiry } from '#shared/utils/link-policy'
import { VISITOR_ID_COOKIE } from '#shared/utils/visitor-id'
import type { Database } from '#shared/types/type'
import { clientRequestIp, enforceCreateRateLimit, requireLocalDestinations, requireSafeBrowsing } from '~~/server/utils/create-policy'
import { guestLinkInsert, recordGuestLink, visitorIdFromRequest } from '~~/server/utils/guest-link'
import { setRandomKey } from '~~/server/utils/upstash'

// Guest create has no captcha in v1. Abuse control is the IP limit (3/hour and 10/day),
// a local URL check, then Safe Browsing. The API key stays on the server.
export default defineEventHandler(async (event) => {
  const body = await readBody(event) as { url?: unknown, type?: unknown, expiresIn?: unknown, visitorId?: unknown }
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

  const expiresAt = expiry.seconds > 0 ? new Date(Date.now() + expiry.seconds * 1000).toISOString() : null
  if (role === 'guest') {
    // Redis is the redirect source of truth. The Supabase row is for /admin only.
    try {
      const supabase = await serverSupabaseServiceRole<Database>(event)
      await recordGuestLink(
        row => supabase.from('links').insert(row),
        guestLinkInsert({
          key,
          url: destination,
          expiresAt,
          visitorId: visitorIdFromRequest(body.visitorId, getCookie(event, VISITOR_ID_COOKIE)),
          visitorIp: clientRequestIp(event)
        })
      )
    } catch (error) {
      console.error('guest link dual-write failed', error instanceof Error ? error.name : 'error')
    }
  }

  setResponseStatus(event, 201)
  return {
    key,
    url: destination,
    expiresIn: expiry.seconds,
    expiresAt
  }
})
