import { jwtDecode } from 'jwt-decode'
import type { EventHandler, EventHandlerRequest } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export const defineAuthHandler = <T extends EventHandlerRequest, D> (
  handler: EventHandler<T, D>
): EventHandler<T, D> =>
    defineEventHandler<T>(async (event) => {
      const supabase = await serverSupabaseClient(event)
      let userData: { user: { id: string } | null } = { user: null }
      let userError: { message?: string } | null = null
      try {
        const result = await supabase.auth.getUser()
        userData = result.data
        userError = result.error
      } catch (error) {
        userError = error instanceof Error ? error : { message: 'Unauthorized' }
      }
      if (userError || !userData.user) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          data: { code: 'unauthorized' }
        })
      }

      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session || session.user.id !== userData.user.id) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
          data: { code: 'unauthorized' }
        })
      }

      event.context.session = session
      try {
        const decoded = jwtDecode<{ user_role?: string }>(session.access_token)
        // @ts-ignore custom access-token claim used for admin short keys
        event.context.session.user_role = decoded.user_role
      } catch {
        // A verified session without the custom claim is still signed in.
      }

      return handler(event)
    })
