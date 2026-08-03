-- Audit Fix 6A — Secure legacy public tables.
-- These tables are no longer production V1 sources of truth.
-- Preserve all existing data, keep the tables available for admin-only inspection,
-- and block anonymous / non-admin access through RLS.

alter table if exists public.rubriques enable row level security;
alter table if exists public.sous_rubriques enable row level security;
alter table if exists public.fiches enable row level security;
alter table if exists public.fiche_tags enable row level security;
alter table if exists public.fiche_certifications enable row level security;
alter table if exists public.fiche_recherches_clients enable row level security;
alter table if exists public.tags enable row level security;

grant select, insert, update, delete on public.rubriques to authenticated;
grant select, insert, update, delete on public.sous_rubriques to authenticated;
grant select, insert, update, delete on public.fiches to authenticated;
grant select, insert, update, delete on public.fiche_tags to authenticated;
grant select, insert, update, delete on public.fiche_certifications to authenticated;
grant select, insert, update, delete on public.fiche_recherches_clients to authenticated;
grant select, insert, update, delete on public.tags to authenticated;

drop policy if exists "Legacy admin manage rubriques" on public.rubriques;
create policy "Legacy admin manage rubriques"
  on public.rubriques
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Legacy admin manage sous rubriques" on public.sous_rubriques;
create policy "Legacy admin manage sous rubriques"
  on public.sous_rubriques
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Legacy admin manage fiches" on public.fiches;
create policy "Legacy admin manage fiches"
  on public.fiches
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Legacy admin manage fiche tags" on public.fiche_tags;
create policy "Legacy admin manage fiche tags"
  on public.fiche_tags
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Legacy admin manage fiche certifications" on public.fiche_certifications;
create policy "Legacy admin manage fiche certifications"
  on public.fiche_certifications
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Legacy admin manage fiche recherches clients" on public.fiche_recherches_clients;
create policy "Legacy admin manage fiche recherches clients"
  on public.fiche_recherches_clients
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "Legacy admin manage tags" on public.tags;
create policy "Legacy admin manage tags"
  on public.tags
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
