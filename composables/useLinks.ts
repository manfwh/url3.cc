function useLinks () {
  const supabase = useSupabaseClient()
  return useAsyncData('links', async () => await supabase.from('links').select('*'))
}
