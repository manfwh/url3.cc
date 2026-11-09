-- Ban marker for short links.
-- Not applied to production by this change. Run it in the Supabase SQL editor
-- or with the Supabase CLI before deploying admin ban/unban/delete.
--
-- Redis remains the redirect source of truth. When banned_at is set, the
-- matching short-link:${key} value also has banned=true and the Worker
-- returns HTTP 410. Null means not banned. Admin writes use the service role.
-- Owner policies cannot set the column, and a banned owner row cannot be
-- updated until an admin clears it.

alter table public.links
  add column if not exists banned_at timestamptz;

comment on column public.links.banned_at is
  'When set, the link is banned. short-link:${key} has banned=true and the Worker returns 410. Null means not banned. Service role only.';

create index if not exists links_guest_banned_created_idx
  on public.links (created_at desc)
  where is_guest and banned_at is not null;

drop policy if exists "Enable insert for authenticated users only" on public.links;
create policy "Enable insert for authenticated users only"
  on public.links for insert to authenticated
  with check (
    auth.uid() = user_id
    and is_guest = false
    and visitor_id is null
    and visitor_ip is null
    and banned_at is null
  );

drop policy if exists "Enable update for users based on user_id" on public.links;
create policy "Enable update for users based on user_id"
  on public.links for update to authenticated
  using (auth.uid() = user_id and is_guest = false)
  with check (
    auth.uid() = user_id
    and is_guest = false
    and visitor_id is null
    and visitor_ip is null
    and banned_at is null
  );

-- Owner policies already reject a non-null banned_at. This trigger also
-- rejects clearing the column, which a WITH CHECK of "is null" would allow.
-- The function lives outside the exposed API schema. The Data API switches
-- to service_role for the service key. Dashboard SQL runs as postgres or
-- supabase_admin.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.protect_links_banned_at()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if new.banned_at is distinct from old.banned_at
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    raise exception 'banned_at is restricted';
  end if;
  return new;
end;
$function$;

revoke all on function private.protect_links_banned_at() from public;
grant execute on function private.protect_links_banned_at() to authenticated, service_role;

drop trigger if exists links_protect_banned_at on public.links;
create trigger links_protect_banned_at
  before update on public.links
  for each row
  execute function private.protect_links_banned_at();
