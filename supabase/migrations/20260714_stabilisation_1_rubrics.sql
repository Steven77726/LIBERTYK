-- Stabilisation 1 — Rubriques Liberty
-- À exécuter dans Supabase SQL Editor.
-- Idempotent : peut être relancé sans supprimer de données.

do $$ begin
  alter type public.publish_status add value if not exists 'trashed';
exception when duplicate_object then null;
end $$;

alter table public.rubrics
  add column if not exists external_id text,
  add column if not exists slug text,
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists icon text,
  add column if not exists image_url text,
  add column if not exists image_alt text,
  add column if not exists show_on_home boolean not null default true,
  add column if not exists search_keywords text[] not null default '{}',
  add column if not exists display_order int not null default 0,
  add column if not exists display_format text not null default 'Carré standard',
  add column if not exists desktop_columns int not null default 3,
  add column if not exists tablet_columns int not null default 2,
  add column if not exists mobile_columns int not null default 1,
  add column if not exists status public.publish_status not null default 'draft',
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists rubrics_external_id_unique_idx
  on public.rubrics(external_id)
  where external_id is not null;

create unique index if not exists rubrics_slug_unique_idx
  on public.rubrics(slug)
  where slug is not null;

create index if not exists rubrics_public_home_idx
  on public.rubrics(status, show_on_home, display_order)
  where deleted_at is null;

alter table public.rubrics enable row level security;

drop policy if exists "Published rubrics are public" on public.rubrics;
drop policy if exists "Admins manage rubrics" on public.rubrics;
drop policy if exists "Admins read all rubrics" on public.rubrics;
drop policy if exists "Admins insert rubrics" on public.rubrics;
drop policy if exists "Admins update rubrics" on public.rubrics;
drop policy if exists "Admins delete rubrics" on public.rubrics;

create policy "Published rubrics are public" on public.rubrics
  for select
  using (status = 'published' and show_on_home = true and deleted_at is null);

create policy "Admins read all rubrics" on public.rubrics
  for select
  using (public.is_admin());

create policy "Admins insert rubrics" on public.rubrics
  for insert
  with check (public.is_admin());

create policy "Admins update rubrics" on public.rubrics
  for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete rubrics" on public.rubrics
  for delete
  using (public.is_admin());
