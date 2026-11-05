-- url3 / shortLink security hardening
-- Already applied on production project ytvauorrjbktlnagxbkr

-- 1) Fix broken signup trigger (profiles -> users)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.users (id, name, emial, image)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 19),
    case
      when new.email is null then null
      when char_length(new.email) < 20 then new.email
      else null
    end,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

revoke all on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 2) Safe click counters
drop function if exists public.update_clicks(text);
create function public.update_clicks(key text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.links
  set clicks = coalesce(clicks, 0) + 1
  where public.links.key = update_clicks.key;
end;
$function$;

drop function if exists public.update_link_clicks(text);
create function public.update_link_clicks(key text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.links
  set clicks = coalesce(clicks, 0) + 1
  where public.links.key = update_link_clicks.key;
end;
$function$;

revoke all on function public.update_clicks(text) from public;
revoke all on function public.update_link_clicks(text) from public;
grant execute on function public.update_clicks(text) to anon, authenticated, service_role;
grant execute on function public.update_link_clicks(text) to anon, authenticated, service_role;

-- 3) Lock down authorize RPC
revoke all on function public.authorize(public.app_permission, uuid) from public;
revoke execute on function public.authorize(public.app_permission, uuid) from anon;
grant execute on function public.authorize(public.app_permission, uuid) to authenticated, service_role;

alter function public.add_planet(text) set search_path to 'public';
alter function public.custom_access_token_hook(jsonb) set search_path to 'public';

-- 4) Tighten table grants
do $$
declare
  t text;
begin
  foreach t in array array[
    'links','assets','projects','project_users','projects_teams',
    'teams','users','users_teams','role_permissions','user_roles'
  ]
  loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
  end loop;
end $$;

grant select, insert, update, delete on table public.links to authenticated;
grant select, insert, update, delete on table public.assets to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.project_users to authenticated;
grant select, insert, update, delete on table public.projects_teams to authenticated;
grant select, insert, update, delete on table public.teams to authenticated;
grant select, update on table public.users to authenticated;
grant select, insert, update, delete on table public.users_teams to authenticated;
grant select on table public.role_permissions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- 5) RLS policies for previously policy-less tables
drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
  on public.users for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Team members can read teams" on public.teams;
create policy "Team members can read teams"
  on public.teams for select to authenticated
  using (
    exists (
      select 1 from public.users_teams ut
      where ut.team_id = teams.id and ut.user_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can create teams" on public.teams;
create policy "Authenticated can create teams"
  on public.teams for insert to authenticated
  with check (true);

drop policy if exists "Team members can update teams" on public.teams;
create policy "Team members can update teams"
  on public.teams for update to authenticated
  using (
    exists (
      select 1 from public.users_teams ut
      where ut.team_id = teams.id and ut.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.users_teams ut
      where ut.team_id = teams.id and ut.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read own team memberships" on public.users_teams;
create policy "Users can read own team memberships"
  on public.users_teams for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can join teams as self" on public.users_teams;
create policy "Users can join teams as self"
  on public.users_teams for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can leave own team memberships" on public.users_teams;
create policy "Users can leave own team memberships"
  on public.users_teams for delete to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can read own project memberships" on public.project_users;
create policy "Users can read own project memberships"
  on public.project_users for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_users.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own project memberships" on public.project_users;
create policy "Users can insert own project memberships"
  on public.project_users for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_users.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners can update project memberships" on public.project_users;
create policy "Owners can update project memberships"
  on public.project_users for update to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_users.project_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_users.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners or self can delete project memberships" on public.project_users;
create policy "Owners or self can delete project memberships"
  on public.project_users for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.projects p
      where p.id = project_users.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Project owners can read project teams" on public.projects_teams;
create policy "Project owners can read project teams"
  on public.projects_teams for select to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = projects_teams.project_id and p.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.users_teams ut
      where ut.team_id = projects_teams.team_id and ut.user_id = auth.uid()
    )
  );

drop policy if exists "Project owners can manage project teams" on public.projects_teams;
create policy "Project owners can manage project teams"
  on public.projects_teams for insert to authenticated
  with check (
    exists (
      select 1 from public.projects p
      where p.id = projects_teams.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Project owners can delete project teams" on public.projects_teams;
create policy "Project owners can delete project teams"
  on public.projects_teams for delete to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = projects_teams.project_id and p.owner_id = auth.uid()
    )
  );

drop policy if exists "Authenticated can read role permissions" on public.role_permissions;
create policy "Authenticated can read role permissions"
  on public.role_permissions for select to authenticated
  using (true);

-- 6) Harden existing policies
drop policy if exists "Enable delete for users based on user_id" on public.links;
create policy "Enable delete for users based on user_id"
  on public.links for delete to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Enable delete for users based on user_id" on public.assets;
create policy "Enable delete for users based on user_id"
  on public.assets for delete to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Enable update for project owners" on public.projects;
create policy "Enable update for project owners"
  on public.projects for update to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Enable delete for project owners" on public.projects;
create policy "Enable delete for project owners"
  on public.projects for delete to authenticated
  using (auth.uid() = owner_id);

-- 7) Normalize empty passwords; fix inverted check
update public.links set password = null where password = '';
alter table public.links drop constraint if exists links_password_check;
alter table public.links
  add constraint links_password_check
  check (password is null or char_length(password) >= 4);

-- 8) Storage scoped to owner
drop policy if exists "select file 11hj63a_0" on storage.objects;
drop policy if exists "upload file 11hj63a_0" on storage.objects;
drop policy if exists "shortlink select own" on storage.objects;
drop policy if exists "shortlink insert own" on storage.objects;
drop policy if exists "shortlink update own" on storage.objects;
drop policy if exists "shortlink delete own" on storage.objects;

create policy "shortlink select own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'shortLink'
    and (
      owner_id = auth.uid()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "shortlink insert own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'shortLink'
    and (
      owner_id = auth.uid()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "shortlink update own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'shortLink'
    and (
      owner_id = auth.uid()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'shortLink'
    and (
      owner_id = auth.uid()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

create policy "shortlink delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'shortLink'
    and (
      owner_id = auth.uid()::text
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );
