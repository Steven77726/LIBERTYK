alter table public.establishments
  add column if not exists country text,
  add column if not exists district text,
  add column if not exists reservation_url text,
  add column if not exists is_visible boolean not null default true;

update public.establishments
set district = coalesce(district, arrondissement)
where district is null;

update public.establishments
set reservation_url = coalesce(reservation_url, reservation_target)
where reservation_url is null;

update public.establishments
set country = coalesce(country, 'France')
where country is null;

create unique index if not exists establishments_external_id_key
  on public.establishments (external_id);

create index if not exists idx_establishments_rubric_subrubric_order
  on public.establishments (rubric_id, subrubric_id, display_order);

create index if not exists idx_establishments_public_visibility
  on public.establishments (status, is_visible, deleted_at);

alter table public.establishments enable row level security;

drop policy if exists "Admins manage establishments" on public.establishments;
drop policy if exists "Professionals update own establishments" on public.establishments;
drop policy if exists "Published establishments are public" on public.establishments;
drop policy if exists "Public read published visible establishments" on public.establishments;
drop policy if exists "Admins read all establishments" on public.establishments;
drop policy if exists "Admins insert establishments" on public.establishments;
drop policy if exists "Admins update establishments" on public.establishments;
drop policy if exists "Admins delete establishments" on public.establishments;

create policy "Public read published visible establishments"
on public.establishments
for select
to anon, authenticated
using (
  status = 'published'
  and is_visible = true
  and deleted_at is null
);

create policy "Admins read all establishments"
on public.establishments
for select
to authenticated
using (public.is_admin());

create policy "Admins insert establishments"
on public.establishments
for insert
to authenticated
with check (public.is_admin());

create policy "Admins update establishments"
on public.establishments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins delete establishments"
on public.establishments
for delete
to authenticated
using (public.is_admin());
