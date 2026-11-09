import { createError, type H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/type'
import { redis } from './upstash'
import type { ModerationDeps, ModerationLink } from './link-moderation'

const LINK_COLUMNS = 'key,url,type,is_guest,expires_at,banned_at,image,password,ios,android,ios_image,android_image'

function failed (scope: string, code: string | undefined, statusMessage: string) {
  console.error(scope, code || 'error')
  throw createError({ statusCode: 500, statusMessage })
}

export async function moderationDeps (event: H3Event): Promise<ModerationDeps> {
  const supabase = await serverSupabaseServiceRole<Database>(event)
  return {
    async load (key) {
      const { data, error } = await supabase
        .from('links')
        .select(LINK_COLUMNS)
        .eq('key', key)
        .maybeSingle()
      if (error) {
        failed('admin link load failed', error.code, 'Could not load link')
      }
      return data as ModerationLink | null
    },
    get: key => redis.get(key),
    ttl: async (key) => {
      const ttl = await redis.ttl(key)
      return typeof ttl === 'number' ? ttl : -2
    },
    set: (key, value, options) => options ? redis.set(key, value, options) : redis.set(key, value),
    async del (...keys) {
      for (const key of keys) {
        await redis.del(key)
      }
    },
    async setBannedAt (key, bannedAt) {
      const { error } = await supabase
        .from('links')
        .update({ banned_at: bannedAt })
        .eq('key', key)
      if (error) {
        failed('admin link ban update failed', error.code, 'Could not update link')
      }
    },
    async remove (key) {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('key', key)
      if (error) {
        failed('admin link delete failed', error.code, 'Could not delete link')
      }
    }
  }
}
