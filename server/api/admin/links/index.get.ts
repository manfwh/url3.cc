import { getQuery } from 'h3'
import { defineAdminHandler } from '~~/server/utils/admin-handler'
import { listGuestLinks } from '~~/server/utils/guest-link-admin'
import { GUEST_LINK_PAGE_SIZE, guestLinkPage, guestLinkSearch } from '~~/server/utils/guest-link'

export default defineAdminHandler(async (event) => {
  const query = getQuery(event)
  return listGuestLinks(
    event,
    guestLinkPage(query.page),
    GUEST_LINK_PAGE_SIZE,
    guestLinkSearch(query.q)
  )
})
