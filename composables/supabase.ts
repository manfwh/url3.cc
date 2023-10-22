import type { Database } from '~/types/type'

export const useSupabase = () => {
  return useSupabaseClient<Database>()
}
