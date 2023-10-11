export default defineNuxtRouteMiddleware((to, form) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
