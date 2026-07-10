-- Liberty / Application Web Casher — Supabase progressive migration schema
-- À exécuter dans Supabase SQL Editor.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('admin', 'professional', 'user');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.publish_status as enum ('published', 'draft', 'hidden');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sponsorship_level as enum ('standard', 'sponsored', 'partner', 'liberty_favorite');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.notification_status as enum ('draft', 'scheduled', 'sent', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role public.user_role not null default 'user',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rubrics (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  image_url text,
  image_alt text,
  show_on_home boolean not null default true,
  search_keywords text[] not null default '{}',
  display_order int not null default 0,
  status public.publish_status not null default 'draft',
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subrubrics (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  rubric_id uuid not null references public.rubrics(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  image_url text,
  image_alt text,
  icon text,
  search_keywords text[] not null default '{}',
  display_order int not null default 0,
  status public.publish_status not null default 'draft',
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (rubric_id, slug)
);

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  rubric_id uuid references public.rubrics(id) on delete set null,
  subrubric_id uuid references public.subrubrics(id) on delete set null,
  slug text unique not null,
  name text not null,
  short_description text,
  description text,
  address text,
  city text,
  arrondissement text,
  postal_code text,
  email text,
  phone text,
  whatsapp text,
  instagram text,
  website text,
  hours jsonb not null default '{}'::jsonb,
  amenities jsonb not null default '{}'::jsonb,
  services jsonb not null default '{}'::jsonb,
  certification text,
  kosher_type text,
  average_price text,
  latitude numeric,
  longitude numeric,
  customer_searches text[] not null default '{}',
  visible_tags text[] not null default '{}',
  status public.publish_status not null default 'draft',
  sponsorship public.sponsorship_level not null default 'standard',
  sponsor_priority int not null default 0,
  sponsor_starts_at timestamptz,
  sponsor_ends_at timestamptz,
  sponsor_placement text,
  sponsor_notes text,
  reservation_enabled boolean not null default false,
  reservation_target text,
  display_order int not null default 0,
  owner_id uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  url text not null,
  storage_path text,
  alt text,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.visible_tags (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  label text not null,
  icon text,
  display_order int not null default 0,
  status public.publish_status not null default 'published',
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(),
  label text unique not null,
  display_order int not null default 0,
  status public.publish_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_id text not null,
  label text,
  rating numeric,
  text text not null,
  status public.publish_status not null default 'published',
  created_at timestamptz not null default now(),
  unique (user_id, entity_id)
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_id text not null,
  label text,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_id)
);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  entity_id text not null,
  label text,
  created_at timestamptz not null default now(),
  primary key (user_id, entity_id)
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  internal_name text,
  title text not null,
  subtitle text,
  image_url text,
  image_alt text,
  button_label text,
  internal_link text,
  linked_entity_type text,
  linked_entity_id text,
  banner_type text not null,
  position text not null,
  placement_target text,
  starts_at timestamptz,
  ends_at timestamptz,
  sponsored boolean not null default false,
  professional_id uuid references public.profiles(id) on delete set null,
  display_order int not null default 0,
  status public.publish_status not null default 'draft',
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_type text not null,
  title text not null,
  linked_entity_type text,
  linked_entity_id text,
  display_order int not null default 0,
  locked boolean not null default false,
  status public.publish_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  image_url text,
  button_label text,
  link text,
  scheduled_for timestamptz,
  target_type text not null default 'all',
  target_value text,
  professional_id uuid references public.profiles(id) on delete set null,
  campaign_id text,
  requires_consent boolean not null default true,
  status public.notification_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  status public.publish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_id text,
  label text,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.trash_items (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  label text not null,
  payload jsonb not null default '{}'::jsonb,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  label text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  query text not null,
  detected_category text,
  detected_location text,
  result_count int not null default 0,
  clicked_entity_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete set null,
  first_name text,
  last_name text,
  phone text,
  email text,
  guests int,
  reservation_date date,
  reservation_time time,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_professional_for(establishment uuid)
returns boolean
language sql
stable
as $$
  select exists(select 1 from public.establishments where id = establishment and owner_id = auth.uid())
  or public.is_admin();
$$;

alter table public.profiles enable row level security;
alter table public.rubrics enable row level security;
alter table public.subrubrics enable row level security;
alter table public.establishments enable row level security;
alter table public.photos enable row level security;
alter table public.visible_tags enable row level security;
alter table public.certifications enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.likes enable row level security;
alter table public.banners enable row level security;
alter table public.notifications enable row level security;
alter table public.professionals enable row level security;
alter table public.page_sections enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.analytics_events enable row level security;
alter table public.trash_items enable row level security;
alter table public.audit_log enable row level security;
alter table public.searches enable row level security;
alter table public.reservations enable row level security;
alter table public.app_settings enable row level security;

create policy "Profiles are readable by owner or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "Profiles are updatable by owner or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());

create policy "Published rubrics are public" on public.rubrics for select using (status = 'published' or public.is_admin());
create policy "Admins manage rubrics" on public.rubrics for all using (public.is_admin()) with check (public.is_admin());
create policy "Published subrubrics are public" on public.subrubrics for select using (status = 'published' or public.is_admin());
create policy "Admins manage subrubrics" on public.subrubrics for all using (public.is_admin()) with check (public.is_admin());

create policy "Published establishments are public" on public.establishments for select using (status = 'published' or public.is_admin() or owner_id = auth.uid());
create policy "Admins manage establishments" on public.establishments for all using (public.is_admin()) with check (public.is_admin());
create policy "Professionals update own establishments" on public.establishments for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "Photos are public" on public.photos for select using (true);
create policy "Admins manage photos" on public.photos for all using (public.is_admin()) with check (public.is_admin());
create policy "Published visible tags are public" on public.visible_tags for select using (status = 'published' or public.is_admin());
create policy "Admins manage visible tags" on public.visible_tags for all using (public.is_admin()) with check (public.is_admin());
create policy "Published certifications are public" on public.certifications for select using (status = 'published' or public.is_admin());
create policy "Admins manage certifications" on public.certifications for all using (public.is_admin()) with check (public.is_admin());

create policy "Users manage own favorites" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own likes" on public.likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Published reviews are public" on public.reviews for select using (status = 'published' or user_id = auth.uid() or public.is_admin());
create policy "Users create own reviews" on public.reviews for insert with check (user_id = auth.uid());
create policy "Users update own reviews" on public.reviews for update using (user_id = auth.uid() or public.is_admin());

create policy "Published banners are public" on public.banners for select using (status = 'published' or public.is_admin());
create policy "Admins manage banners" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "Published page sections are public" on public.page_sections for select using (status = 'published' or public.is_admin());
create policy "Admins manage page sections" on public.page_sections for all using (public.is_admin()) with check (public.is_admin());
create policy "Published notifications are readable" on public.notifications for select using (status = 'sent' or public.is_admin());
create policy "Admins manage notifications" on public.notifications for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage professionals" on public.professionals for all using (public.is_admin()) with check (public.is_admin());
create policy "Professionals read own profile" on public.professionals for select using (user_id = auth.uid() or public.is_admin());

create policy "Users read own deliveries" on public.notification_deliveries for select using (user_id = auth.uid() or public.is_admin());
create policy "Admins manage deliveries" on public.notification_deliveries for all using (public.is_admin()) with check (public.is_admin());

create policy "Analytics insert allowed" on public.analytics_events for insert with check (true);
create policy "Admins read analytics" on public.analytics_events for select using (public.is_admin());
create policy "Admins manage trash" on public.trash_items for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins read audit log" on public.audit_log for select using (public.is_admin());
create policy "Admins write audit log" on public.audit_log for insert with check (public.is_admin());
create policy "Search insert allowed" on public.searches for insert with check (true);
create policy "Admins read searches" on public.searches for select using (public.is_admin());

create policy "Users create reservations" on public.reservations for insert with check (auth.uid() is null or user_id = auth.uid());
create policy "Users read own reservations" on public.reservations for select using (user_id = auth.uid() or public.is_admin() or public.is_professional_for(establishment_id));
create policy "Admins manage settings" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

create index if not exists analytics_events_type_created_idx on public.analytics_events(event_type, created_at desc);
create index if not exists analytics_events_entity_idx on public.analytics_events(entity_id, created_at desc);
create index if not exists searches_query_created_idx on public.searches(query, created_at desc);
create index if not exists establishments_status_order_idx on public.establishments(status, display_order);
create index if not exists establishments_searches_gin_idx on public.establishments using gin(customer_searches);

insert into public.certifications (label, display_order, status)
values
  ('Beth Din de Paris', 1, 'published'),
  ('Badatz', 2, 'published'),
  ('Loubavitch', 3, 'published'),
  ('Rottenberg', 4, 'published')
on conflict (label) do nothing;

insert into storage.buckets (id, name, public)
values ('liberty-images', 'liberty-images', true)
on conflict (id) do nothing;

create policy "Public image reads" on storage.objects for select using (bucket_id = 'liberty-images');
create policy "Admins upload images" on storage.objects for insert with check (bucket_id = 'liberty-images' and public.is_admin());
create policy "Admins update images" on storage.objects for update using (bucket_id = 'liberty-images' and public.is_admin());
create policy "Admins delete images" on storage.objects for delete using (bucket_id = 'liberty-images' and public.is_admin());
