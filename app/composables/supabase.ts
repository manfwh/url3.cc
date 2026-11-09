import type { Database } from '#shared/types/type'

export const useSupabase = () => {
  return useSupabaseClient<Database>()
}
