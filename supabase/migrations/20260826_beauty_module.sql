create extension if not exists pgcrypto;

create table if not exists public.beauty_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null default '',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists beauty_categories_slug_unique_idx
  on public.beauty_categories(slug);

create table if not exists public.beauty_services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.beauty_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null default '',
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists beauty_services_category_slug_unique_idx
  on public.beauty_services(category_id, slug);

create index if not exists beauty_services_category_id_idx
  on public.beauty_services(category_id);

create table if not exists public.professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.establishments(id) on delete cascade,
  service_id uuid not null references public.beauty_services(id) on delete cascade,
  price numeric(10,2),
  price_from boolean not null default false,
  duration_minutes integer,
  at_home boolean not null default false,
  on_site boolean not null default true,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists professional_services_professional_service_unique_idx
  on public.professional_services(professional_id, service_id);

create index if not exists professional_services_professional_id_idx
  on public.professional_services(professional_id);

create index if not exists professional_services_service_id_idx
  on public.professional_services(service_id);

create index if not exists professional_services_active_order_idx
  on public.professional_services(active, display_order);

alter table public.beauty_categories enable row level security;
alter table public.beauty_services enable row level security;
alter table public.professional_services enable row level security;

drop policy if exists "Public read active beauty categories" on public.beauty_categories;
drop policy if exists "Admins manage beauty categories" on public.beauty_categories;
drop policy if exists "Public read active beauty services" on public.beauty_services;
drop policy if exists "Admins manage beauty services" on public.beauty_services;
drop policy if exists "Public read active professional services" on public.professional_services;
drop policy if exists "Admins manage professional services" on public.professional_services;

create policy "Public read active beauty categories"
on public.beauty_categories
for select
to anon, authenticated
using (active = true);

create policy "Admins manage beauty categories"
on public.beauty_categories
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Public read active beauty services"
on public.beauty_services
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1
    from public.beauty_categories c
    where c.id = beauty_services.category_id
      and c.active = true
  )
);

create policy "Admins manage beauty services"
on public.beauty_services
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "Public read active professional services"
on public.professional_services
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1
    from public.establishments e
    where e.id = professional_services.professional_id
      and e.status = 'published'
      and e.is_visible = true
      and e.deleted_at is null
  )
  and exists (
    select 1
    from public.beauty_services s
    join public.beauty_categories c on c.id = s.category_id
    where s.id = professional_services.service_id
      and s.active = true
      and c.active = true
  )
);

create policy "Admins manage professional services"
on public.professional_services
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

grant select on public.beauty_categories to anon, authenticated;
grant select on public.beauty_services to anon, authenticated;
grant select on public.professional_services to anon, authenticated;
grant insert, update, delete on public.beauty_categories to authenticated;
grant insert, update, delete on public.beauty_services to authenticated;
grant insert, update, delete on public.professional_services to authenticated;

insert into public.beauty_categories (name, slug, description, display_order, active)
values
  ('Maquillage', 'maquillage', 'Make-up soirée, mariée et événements.', 1, true),
  ('Coiffure', 'coiffure', 'Brushing, coupe, coiffure événementielle.', 2, true),
  ('Lissage', 'lissage', 'Lissages et soins capillaires.', 3, true),
  ('Massage', 'massage', 'Massages relaxants, drainants et bien-être.', 4, true),
  ('Onglerie', 'onglerie', 'Manucure, gel, semi-permanent et nail art.', 5, true),
  ('Cils & Sourcils', 'cils-sourcils', 'Extensions, rehaussement et restructuration.', 6, true),
  ('Épilation', 'epilation', 'Épilation visage et corps.', 7, true),
  ('Soins du visage', 'soins-du-visage', 'Nettoyages, hydratation et soins visage.', 8, true),
  ('Soins du corps', 'soins-du-corps', 'Soins corps et rituels beauté.', 9, true)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();

with category_data as (
  select id, slug from public.beauty_categories
)
insert into public.beauty_services (category_id, name, slug, description, display_order, active)
select category_data.id, seed.name, seed.slug, seed.description, seed.display_order, true
from (
  values
    ('coiffure', 'Brushing', 'brushing', 'Brushing professionnel.', 1),
    ('coiffure', 'Coupe', 'coupe', 'Coupe femme.', 2),
    ('coiffure', 'Coiffure mariage', 'coiffure-mariage', 'Coiffure pour mariage et événement.', 3),
    ('maquillage', 'Maquillage soirée', 'maquillage-soiree', 'Maquillage pour soirée.', 1),
    ('maquillage', 'Maquillage mariée', 'maquillage-mariee', 'Maquillage de mariée.', 2),
    ('lissage', 'Lissage brésilien', 'lissage-bresilien', 'Lissage et soin capillaire.', 1),
    ('massage', 'Massage relaxant', 'massage-relaxant', 'Massage détente.', 1),
    ('massage', 'Massage drainant', 'massage-drainant', 'Massage drainant.', 2),
    ('onglerie', 'Manucure', 'manucure', 'Soin des ongles.', 1),
    ('onglerie', 'Semi-permanent', 'semi-permanent', 'Pose semi-permanent.', 2),
    ('cils-sourcils', 'Rehaussement de cils', 'rehaussement-cils', 'Rehaussement de cils.', 1),
    ('cils-sourcils', 'Sourcils', 'sourcils', 'Soin et restructuration sourcils.', 2),
    ('epilation', 'Épilation visage', 'epilation-visage', 'Épilation du visage.', 1),
    ('soins-du-visage', 'Soin hydratant', 'soin-hydratant', 'Soin hydratant du visage.', 1),
    ('soins-du-corps', 'Soin corps', 'soin-corps', 'Soin du corps.', 1)
) as seed(category_slug, name, slug, description, display_order)
join category_data on category_data.slug = seed.category_slug
on conflict (category_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  active = excluded.active,
  updated_at = now();
