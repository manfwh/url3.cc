import { localizedPath, safeInternalPath } from '~/utils/safe-redirect'

function isLoginPath (path: string) {
  return /(?:^|\/)login\/?$/.test(path)
}

export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  if (!user.value && !isLoginPath(to.path)) {
    return navigateTo({
      path: localizedPath(to.path, '/login'),
      query: { redirect: to.fullPath }
    })
  }

  if (user.value && isLoginPath(to.path)) {
    return navigateTo(safeInternalPath(to.query.redirect) || localizedPath(to.path, '/'))
  }
})
