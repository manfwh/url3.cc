# Supabase

Project: **shortLink** (`ytvauorrjbktlnagxbkr`).

The live database was already patched through the Supabase Dashboard and MCP. `migrations/` records that SQL in the repo. It is history only and was not re-applied from this change.

## Remaining follow-ups

- Upgrade Postgres.
- Enable leaked-password protection in Auth settings.
- `users.emial` length quirk: the column name is `emial`, and the signup trigger stores an email only when `char_length(email) < 20`. Longer addresses are written as null.
