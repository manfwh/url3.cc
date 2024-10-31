import { jwtDecode } from 'jwt-decode'
import type { EventHandler, EventHandlerRequest } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export const defineAuthHandler = <T extends EventHandlerRequest, D> (
  handler: EventHandler<T, D>
): EventHandler<T, D> =>
    defineEventHandler<T>(async (event) => {
      const supabase = await serverSupabaseClient(event)
      try {
        const session = await supabase.auth.getSession()
        event.context.session = session.data.session
        if (session.data) {
          if (session.data.session?.access_token) {
            const decoded = jwtDecode(session.data.session?.access_token)
            // @ts-ignore
            event.context.session.user_role = decoded.user_role
          }
          return handler(event)
        } else {
          throw createError({ statusCode: 401, message: 'Unauthorized' })
        }
      } catch (error) {
        throw createError({ statusCode: 500, message: 'Internal Server Error' })
      }
    })
