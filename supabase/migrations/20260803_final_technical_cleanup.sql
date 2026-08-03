-- Audit Fix 6D — Final technical cleanup before SEO.
-- Keep production behavior unchanged while reducing confirmed technical debt.

-- 1. Exact duplicate index cleanup.
-- establishments_searches_gin_idx already covers the same customer_searches GIN expression.
drop index if exists public.idx_establishments_customer_searches;

-- 2. Missing useful FK / production query indexes.
create index if not exists analytics_events_user_id_idx on public.analytics_events (user_id);
create index if not exists audit_log_actor_id_idx on public.audit_log (actor_id);
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists banners_deleted_by_idx on public.banners (deleted_by);
create index if not exists banners_professional_id_idx on public.banners (professional_id);
create index if not exists banners_public_display_idx on public.banners (status, position, display_order);
create index if not exists notifications_created_by_idx on public.notifications (created_by);
create index if not exists notifications_professional_id_idx on public.notifications (professional_id);
create index if not exists notifications_status_schedule_idx on public.notifications (status, scheduled_for desc);
create index if not exists reservations_user_id_idx on public.reservations (user_id);
create index if not exists seo_analysis_history_actor_id_idx on public.seo_analysis_history (actor_id);
create index if not exists visible_tags_deleted_by_idx on public.visible_tags (deleted_by);
create index if not exists visible_tags_public_order_idx on public.visible_tags (status, display_order);

-- 3. RLS optimization: explicit roles and initplan-friendly function/user lookups.
-- Rubrics.
drop policy if exists "Admins read all rubrics" on public.rubrics;
drop policy if exists "Admins insert rubrics" on public.rubrics;
drop policy if exists "Admins update rubrics" on public.rubrics;
drop policy if exists "Admins delete rubrics" on public.rubrics;
drop policy if exists "Published rubrics are public" on public.rubrics;
create policy "Admins read all rubrics" on public.rubrics
  for select to authenticated using ((select public.is_admin()));
create policy "Admins insert rubrics" on public.rubrics
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update rubrics" on public.rubrics
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete rubrics" on public.rubrics
  for delete to authenticated using ((select public.is_admin()));
create policy "Published rubrics are public" on public.rubrics
  for select to anon, authenticated
  using ((status = 'published'::publish_status) and (show_on_home = true) and (deleted_at is null));

-- Subrubrics.
drop policy if exists "Admins read all subrubrics" on public.subrubrics;
drop policy if exists "Admins insert subrubrics" on public.subrubrics;
drop policy if exists "Admins update subrubrics" on public.subrubrics;
drop policy if exists "Admins delete subrubrics" on public.subrubrics;
drop policy if exists "Public read published visible subrubrics" on public.subrubrics;
create policy "Admins read all subrubrics" on public.subrubrics
  for select to authenticated using ((select public.is_admin()));
create policy "Admins insert subrubrics" on public.subrubrics
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update subrubrics" on public.subrubrics
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete subrubrics" on public.subrubrics
  for delete to authenticated using ((select public.is_admin()));
create policy "Public read published visible subrubrics" on public.subrubrics
  for select to anon, authenticated
  using ((status = 'published'::publish_status) and (show_publicly = true) and (deleted_at is null));

-- Establishments.
drop policy if exists "Admins read all establishments" on public.establishments;
drop policy if exists "Admins insert establishments" on public.establishments;
drop policy if exists "Admins update establishments" on public.establishments;
drop policy if exists "Admins delete establishments" on public.establishments;
drop policy if exists "Public read published visible establishments" on public.establishments;
create policy "Admins read all establishments" on public.establishments
  for select to authenticated using ((select public.is_admin()));
create policy "Admins insert establishments" on public.establishments
  for insert to authenticated with check ((select public.is_admin()));
create policy "Admins update establishments" on public.establishments
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins delete establishments" on public.establishments
  for delete to authenticated using ((select public.is_admin()));
create policy "Public read published visible establishments" on public.establishments
  for select to anon, authenticated
  using ((status = 'published'::publish_status) and (is_visible = true) and (deleted_at is null));

-- Profiles.
drop policy if exists "Profiles are insertable by owner" on public.profiles;
drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
drop policy if exists "Profiles are updatable by owner or admin" on public.profiles;
create policy "Profiles are insertable by owner" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "Profiles are readable by owner or admin" on public.profiles
  for select to authenticated using ((id = (select auth.uid())) or (select public.is_admin()));
create policy "Profiles are updatable by owner or admin" on public.profiles
  for update to authenticated using ((id = (select auth.uid())) or (select public.is_admin()))
  with check ((id = (select auth.uid())) or (select public.is_admin()));

-- Favorites / likes legacy tables kept behavior-compatible.
drop policy if exists "Users manage own favorites" on public.favorites;
create policy "Users manage own favorites" on public.favorites
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "Users manage own likes" on public.likes;
create policy "Users manage own likes" on public.likes
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Reservations.
drop policy if exists "Users create reservations" on public.reservations;
drop policy if exists "Users read own reservations" on public.reservations;
create policy "Users create reservations" on public.reservations
  for insert to anon, authenticated with check (((select auth.uid()) is null) or (user_id = (select auth.uid())));
create policy "Users read own reservations" on public.reservations
  for select to authenticated using ((user_id = (select auth.uid())) or (select public.is_admin()) or public.is_professional_for(establishment_id));

-- Reviews.
drop policy if exists "Published reviews are public" on public.reviews;
drop policy if exists "Users create own reviews" on public.reviews;
drop policy if exists "Users update own reviews" on public.reviews;
create policy "Published reviews are public" on public.reviews
  for select to anon, authenticated using ((status = 'published'::publish_status) or (user_id = (select auth.uid())) or (select public.is_admin()));
create policy "Users create own reviews" on public.reviews
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users update own reviews" on public.reviews
  for update to authenticated using ((user_id = (select auth.uid())) or (select public.is_admin()))
  with check ((user_id = (select auth.uid())) or (select public.is_admin()));

-- Visible tags.
drop policy if exists "Admins manage visible tags" on public.visible_tags;
drop policy if exists "Published visible tags are public" on public.visible_tags;
create policy "Admins manage visible tags" on public.visible_tags
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Published visible tags are public" on public.visible_tags
  for select to anon, authenticated using ((status = 'published'::publish_status) or (select public.is_admin()));
