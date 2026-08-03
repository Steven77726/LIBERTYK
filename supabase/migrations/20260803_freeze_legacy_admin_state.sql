-- Audit Fix 6C — Freeze legacy admin_state content source.
-- Preserve the old payload for emergency inspection without keeping it as a production source.

insert into public.app_settings (key, value, updated_at)
select
  'admin_state_backup_20260803_6c',
  value,
  now()
from public.app_settings
where key = 'admin_state'
on conflict (key) do nothing;

insert into public.app_settings (key, value, updated_at)
values (
  'admin_state_frozen',
  jsonb_build_object(
    'frozen_at', now(),
    'reason', 'Legacy admin_state is no longer an active Liberty content source. Rubrics, subrubrics and establishments use dedicated Supabase tables.'
  ),
  now()
)
on conflict (key) do update
set
  value = excluded.value,
  updated_at = excluded.updated_at;
