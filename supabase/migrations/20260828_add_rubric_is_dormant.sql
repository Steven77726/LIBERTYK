-- Add is_dormant column to rubrics for temporary inactive / "Bientôt disponible" state
-- Safe, additive and idempotent: preserves all existing rubrics, subrubrics, establishments and data.

alter table public.rubrics
  add column if not exists is_dormant boolean not null default false;

comment on column public.rubrics.is_dormant is 'When true, the rubric remains visible on Liberty K but its public access is temporarily disabled (Bientôt disponible).';
