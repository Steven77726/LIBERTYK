create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint user_favorites_user_establishment_unique unique (user_id, establishment_id)
);

create index if not exists user_favorites_user_id_idx on public.user_favorites(user_id);
create index if not exists user_favorites_establishment_id_idx on public.user_favorites(establishment_id);

alter table public.user_favorites enable row level security;

drop policy if exists "Users read own user favorites" on public.user_favorites;
create policy "Users read own user favorites"
  on public.user_favorites
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create own user favorites" on public.user_favorites;
create policy "Users create own user favorites"
  on public.user_favorites
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own user favorites" on public.user_favorites;
create policy "Users delete own user favorites"
  on public.user_favorites
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.user_favorites to authenticated;
grant select on public.establishments to authenticated, anon;
