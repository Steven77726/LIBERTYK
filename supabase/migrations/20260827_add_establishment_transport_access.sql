-- Add structured transport fields for Liberty establishments.
-- Safe, additive and idempotent: preserves all existing establishments and data.

alter table public.establishments
  add column if not exists nearest_metro_name text,
  add column if not exists nearest_metro_line text;

comment on column public.establishments.nearest_metro_name is 'Closest metro station name displayed on public establishment cards when provided.';
comment on column public.establishments.nearest_metro_line is 'Closest metro line identifier. UI maps the line to its official color centrally.';
