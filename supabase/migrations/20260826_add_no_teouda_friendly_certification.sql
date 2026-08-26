do $$
declare
  existing_id uuid;
begin
  select id
    into existing_id
  from public.certifications
  where slug in ('no-teouda-friendly', 'no-theouda-friendly')
     or lower(coalesce(label, name, '')) in (
       'no theouda/friendly',
       'no teouda/friendly',
       'no theouda / friendly',
       'no teouda / friendly'
     )
  order by
    case when slug = 'no-teouda-friendly' then 0 else 1 end,
    display_order nulls last,
    created_at
  limit 1;

  if existing_id is null then
    insert into public.certifications (label, name, slug, display_order, status, is_deleted, deleted_at)
    values ('No Teouda / Friendly', 'No Teouda / Friendly', 'no-teouda-friendly', 5, 'published', false, null);
  else
    update public.certifications
    set
      label = 'No Teouda / Friendly',
      name = 'No Teouda / Friendly',
      slug = 'no-teouda-friendly',
      status = 'published',
      is_deleted = false,
      deleted_at = null,
      updated_at = now()
    where id = existing_id;
  end if;
end $$;
