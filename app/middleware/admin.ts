import { localizedPath } from '~/utils/safe-redirect'

function isLoginPath (path: string) {
  return /(?:^|\/)login\/?$/.test(path)
}

function statusOf (error: unknown) {
  if (!error || typeof error !== 'object') { return 403 }
  const value = error as { statusCode?: number, status?: number }
  return value.statusCode || value.status || 403
}

export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()

  if (!user.value && !isLoginPath(to.path)) {
    return navigateTo({
      path: localizedPath(to.path, '/login'),
      query: { redirect: to.fullPath }
    })
  }

  const requestFetch = useRequestFetch()
  try {
    await requestFetch('/api/admin/session')
  } catch (error) {
    const status = statusOf(error)
    if (status === 401) {
      return navigateTo({
        path: localizedPath(to.path, '/login'),
        query: { redirect: to.fullPath }
      })
    }
    if (status !== 403) { throw error }
    return abortNavigation(createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      fatal: true
    }))
  }
})
