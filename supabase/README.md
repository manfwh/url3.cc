# Supabase

Project: **shortLink** (`ytvauorrjbktlnagxbkr`).

The live database was already patched through the Supabase Dashboard and MCP. `migrations/20261105120304_fix_rls_policies_and_security_definer.sql` records that SQL in the repo. It is history only and was not re-applied from this change.

`migrations/20261109120000_guest_link_admin.sql` is new and still needs to be applied before `/admin` can list guest links. Run it in the Supabase SQL editor or with the Supabase CLI against project `ytvauorrjbktlnagxbkr`. It adds `is_guest`, `expires_at`, `last_visited_at`, `visitor_id`, and `visitor_ip` on `public.links`, and keeps guest rows out of the authenticated owner policies.

`migrations/20261109143000_link_banned_at.sql` adds nullable `banned_at` and blocks owner inserts/updates from setting it. Apply it after the guest-link migration and before deploying admin ban, unban, or delete. Service-role writes are the only path that sets the column.

## Remaining follow-ups

- Upgrade Postgres.
- Enable leaked-password protection in Auth settings.
- `users.emial` length quirk: the column name is `emial`, and the signup trigger stores an email only when `char_length(email) < 20`. Longer addresses are written as null.
