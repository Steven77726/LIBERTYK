insert into public.visible_tags (external_id, label, icon, display_order, status)
values
  ('terrasse', 'Terrasse', '', 1, 'published'),
  ('ouvert', 'Ouvert', '', 2, 'published'),
  ('reservation', 'Réservation', '', 3, 'published'),
  ('livraison', 'Livraison', '', 4, 'published'),
  ('a-emporter', 'À emporter', '', 5, 'published'),
  ('bassari', 'Bassari', '', 6, 'published'),
  ('halavi', 'Halavi', '', 7, 'published'),
  ('parve', 'Parvé', '', 8, 'published'),
  ('beth-din-de-paris', 'Beth Din de Paris', '', 9, 'published'),
  ('badatz', 'Badatz', '', 10, 'published'),
  ('loubavitch', 'Loubavitch', '', 11, 'published'),
  ('rottenberg', 'Rottenberg', '', 12, 'published'),
  ('sponsorise', 'Sponsorisé', '', 13, 'published')
on conflict (external_id) do update
set label = excluded.label,
    icon = excluded.icon,
    display_order = excluded.display_order,
    status = excluded.status,
    deleted_at = null,
    updated_at = now();
