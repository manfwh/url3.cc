import { localizedPath } from '~/utils/safe-redirect'

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()
  if (user.value) {
    return navigateTo(localizedPath(to.path, '/'))
  }
})
