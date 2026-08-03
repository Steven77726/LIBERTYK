alter table public.establishments
  add column if not exists field_visibility jsonb not null default '{
    "phone": true,
    "whatsapp": true,
    "email": true,
    "website": true,
    "reservation": true,
    "instagram": true,
    "address": true,
    "opening_hours": true,
    "tags": true,
    "gallery": true,
    "price": true,
    "map": true,
    "reviews": true,
    "certification": true,
    "delivery": true,
    "takeaway": true,
    "terrace": true
  }'::jsonb;

update public.establishments
set field_visibility = coalesce(field_visibility, '{}'::jsonb) || '{
  "phone": true,
  "whatsapp": true,
  "email": true,
  "website": true,
  "reservation": true,
  "instagram": true,
  "address": true,
  "opening_hours": true,
  "tags": true,
  "gallery": true,
  "price": true,
  "map": true,
  "reviews": true,
  "certification": true,
  "delivery": true,
  "takeaway": true,
  "terrace": true
}'::jsonb
where field_visibility is null
  or not (field_visibility ? 'phone')
  or not (field_visibility ? 'opening_hours')
  or not (field_visibility ? 'tags')
  or not (field_visibility ? 'gallery');

create index if not exists idx_establishments_customer_searches
  on public.establishments using gin (customer_searches);

create index if not exists idx_establishments_visible_tags
  on public.establishments using gin (visible_tags);

create index if not exists idx_establishments_field_visibility
  on public.establishments using gin (field_visibility);

create index if not exists idx_photos_establishment_order
  on public.photos (entity_type, entity_id, display_order);
