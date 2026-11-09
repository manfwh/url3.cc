-- Guest-link admin visibility.
-- Not applied to production by this change. Run it in the Supabase SQL editor
-- or with the Supabase CLI before deploying the Nuxt admin list.
--
-- Guest creates are inserted with the service role (RLS bypass). Anon has no
-- table grant. Authenticated policies stay owner-scoped and exclude is_guest
-- rows, which always have user_id null.

alter table public.links
  add column if not exists is_guest boolean not null default false,
  add column if not exists expires_at timestamptz,
  add column if not exists last_visited_at timestamptz,
  add column if not exists visitor_id text,
  add column if not exists visitor_ip text;

alter table public.links drop constraint if exists links_guest_owner_check;
alter table public.links
  add constraint links_guest_owner_check
  check (is_guest = false or user_id is null);

create index if not exists links_guest_created_at_idx
  on public.links (created_at desc)
  where is_guest;

comment on column public.links.is_guest is 'True for links created without an account. Written by the service role.';
comment on column public.links.expires_at is 'Absolute expiry matching the Redis TTL. Null means no expiry.';
comment on column public.links.last_visited_at is 'Optional last redirect time. The Worker may fill this later; Nuxt does not update it on the hot path.';
comment on column public.links.visitor_id is 'Random UUID from the guest client. Not a device fingerprint.';
comment on column public.links.visitor_ip is 'Client IP at guest create time. Admin API only.';

revoke all on table public.links from anon;

drop policy if exists "Enable read access for all users" on public.links;
create policy "Enable read access for all users"
  on public.links for select to authenticated
  using (auth.uid() = user_id and is_guest = false);

drop policy if exists "Enable insert for authenticated users only" on public.links;
create policy "Enable insert for authenticated users only"
  on public.links for insert to authenticated
  with check (
    auth.uid() = user_id
    and is_guest = false
    and visitor_id is null
    and visitor_ip is null
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
  );

drop policy if exists "Enable delete for users based on user_id" on public.links;
create policy "Enable delete for users based on user_id"
  on public.links for delete to authenticated
  using (auth.uid() = user_id and is_guest = false);
