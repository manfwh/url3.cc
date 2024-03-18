import { jwtDecode } from 'jwt-decode'
type User = {
  name: string
  email?: string;
  avatar: string
  role?: 'admin'
}
export const useUserStore = defineStore('userStore', () => {
  const user = ref<User>()
  const supabase = useSupabaseClient()
  const getUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const jwt = jwtDecode(session.access_token)
      user.value = {
        name: session.user.user_metadata.name,
        email: session.user.email,
        avatar: session.user.user_metadata.avatar_url,
        // @ts-ignore
        role: jwt.user_role
      }
    }
  }
  const signOut = () => {
    return supabase.auth.signOut()
  }

  return {
    user,
    getUser,
    signOut
  }
})
