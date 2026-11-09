import { getRouterParam } from 'h3'
import { defineAdminHandler } from '~~/server/utils/admin-handler'
import { guestClickTotal, loadGuestLink, toAdminGuestLink } from '~~/server/utils/guest-link-admin'
import { assertGuestLinkKey } from '~~/server/utils/guest-link'

export default defineAdminHandler(async (event) => {
  const key = assertGuestLinkKey(getRouterParam(event, 'key'))
  const row = await loadGuestLink(event, key)
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }
  const clicks = await guestClickTotal(row.key, row.clicks)
  return toAdminGuestLink(row, clicks)
})
