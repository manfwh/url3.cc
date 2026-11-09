import { defineAdminHandler } from '~~/server/utils/admin-handler'

export default defineAdminHandler(() => {
  return { admin: true }
})
