export default defineNuxtRouteMiddleware((to, form) => {
  const user = useSupabaseUser()
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login?redirect=' + encodeURIComponent(to.path))
  }
  if (user.value && to.path === '/login') {
    return navigateTo('/')
  }
})
