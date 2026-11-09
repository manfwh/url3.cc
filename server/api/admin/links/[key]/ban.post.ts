import { getRouterParam } from 'h3'
import { defineAdminHandler } from '~~/server/utils/admin-handler'
import { assertGuestLinkKey } from '~~/server/utils/guest-link'
import { executeLinkBan } from '~~/server/utils/link-moderation'
import { moderationDeps } from '~~/server/utils/link-moderation-store'

export default defineAdminHandler(async (event) => {
  const key = assertGuestLinkKey(getRouterParam(event, 'key'))
  return executeLinkBan(await moderationDeps(event), key)
})
