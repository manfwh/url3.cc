import type { EventHandler, EventHandlerRequest } from 'h3'
import { serverSupabaseClient } from '#supabase/server'
import { useRuntimeConfig } from '#imports'
import { isAllowlistedAdmin, parseAdminAllowlist, type AdminIdentity } from './admin-access'

function configuredValue (...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

export function readAdminAllowlist () {
  const config = useRuntimeConfig()
  return parseAdminAllowlist(
    configuredValue(process.env.ADMIN_EMAILS, process.env.NUXT_ADMIN_EMAILS, config.adminEmails),
    configuredValue(process.env.ADMIN_USER_IDS, process.env.NUXT_ADMIN_USER_IDS, config.adminUserIds)
  )
}

function unauthorized () {
  return createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: { code: 'unauthorized' }
  })
}

function forbidden () {
  return createError({
    statusCode: 403,
    statusMessage: 'Forbidden',
    data: { code: 'forbidden' }
  })
}

export const defineAdminHandler = <T extends EventHandlerRequest, Result> (
  handler: EventHandler<T, Result>
): EventHandler<T, Result> =>
    defineEventHandler<T>(async (event) => {
      const supabase = await serverSupabaseClient(event)
      let user: AdminIdentity | null = null
      try {
        const result = await supabase.auth.getUser()
        if (result.error || !result.data.user) {
          throw unauthorized()
        }
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session
        if (!session || session.user.id !== result.data.user.id) {
          throw unauthorized()
        }
        user = {
          id: result.data.user.id,
          email: result.data.user.email ?? null
        }
      } catch (error) {
        if (error && typeof error === 'object' && 'statusCode' in error) {
          throw error
        }
        throw unauthorized()
      }

      if (!user || !isAllowlistedAdmin(user, readAdminAllowlist())) {
        throw forbidden()
      }

      event.context.adminUser = user
      return handler(event)
    })
