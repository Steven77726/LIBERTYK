alter table public.subrubrics
  add column if not exists show_publicly boolean not null default true,
  add column if not exists display_format text not null default 'Carré standard',
  add column if not exists desktop_columns integer not null default 3,
  add column if not exists tablet_columns integer not null default 2,
  add column if not exists mobile_columns integer not null default 1;

create index if not exists idx_subrubrics_rubric_order on public.subrubrics(rubric_id, display_order);
create unique index if not exists subrubrics_external_id_key on public.subrubrics(external_id);
create unique index if not exists subrubrics_external_id_unique on public.subrubrics(external_id) where external_id is not null;
create unique index if not exists subrubrics_rubric_slug_unique on public.subrubrics(rubric_id, slug) where deleted_at is null;

alter table public.subrubrics enable row level security;

drop policy if exists "Published subrubrics are public" on public.subrubrics;
drop policy if exists "Admins manage subrubrics" on public.subrubrics;
drop policy if exists "Public read published visible subrubrics" on public.subrubrics;
drop policy if exists "Admins read all subrubrics" on public.subrubrics;
drop policy if exists "Admins insert subrubrics" on public.subrubrics;
drop policy if exists "Admins update subrubrics" on public.subrubrics;
drop policy if exists "Admins delete subrubrics" on public.subrubrics;

create policy "Public read published visible subrubrics"
  on public.subrubrics
  for select
  to anon, authenticated
  using (status = 'published'::publish_status and show_publicly = true and deleted_at is null);

create policy "Admins read all subrubrics"
  on public.subrubrics
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins insert subrubrics"
  on public.subrubrics
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins update subrubrics"
  on public.subrubrics
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete subrubrics"
  on public.subrubrics
  for delete
  to authenticated
  using (public.is_admin());
