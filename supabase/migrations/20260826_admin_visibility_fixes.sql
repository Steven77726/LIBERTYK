-- Corrections de visibilité Admin du 26 août 2026.
-- Idempotent, non destructif : aucune suppression, aucune troncature.

update public.subrubrics
set
  slug = 'kinor-traiteur',
  status = 'published',
  show_publicly = true,
  deleted_at = null,
  updated_at = now()
where lower(name) = 'kinor traiteur';

insert into public.subrubrics (
  external_id,
  rubric_id,
  slug,
  name,
  description,
  icon,
  image_url,
  image_alt,
  display_order,
  display_format,
  desktop_columns,
  tablet_columns,
  mobile_columns,
  status,
  show_publicly,
  deleted_at,
  created_at,
  updated_at
)
select
  'mariage-kinor-decoration',
  r.id,
  'kinor-decoration',
  'Kinor décoration',
  'Décoration et scénographie pour mariage et événements.',
  'Décoration',
  '/images/mariage/kinor-decor.jpg',
  'Kinor décoration',
  coalesce((select max(display_order) + 1 from public.subrubrics where rubric_id = r.id), 1),
  'Carré standard',
  3,
  2,
  1,
  'published',
  true,
  null,
  now(),
  now()
from public.rubrics r
where r.slug = 'mariage' or r.external_id = 'mariage'
on conflict (external_id) do update
set
  rubric_id = excluded.rubric_id,
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  status = 'published',
  show_publicly = true,
  deleted_at = null,
  updated_at = now();

update public.establishments
set
  status = 'published',
  is_visible = true,
  deleted_at = null,
  updated_at = now()
where lower(name) = 'azamra';
