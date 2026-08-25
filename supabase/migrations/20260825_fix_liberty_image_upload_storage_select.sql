-- Allow authenticated Liberty admins to read objects in the liberty-images bucket.
-- Supabase Storage upsert flows require INSERT + SELECT + UPDATE.
-- Existing INSERT/UPDATE/DELETE admin policies are preserved.

drop policy if exists "Admins read images for upload upsert" on storage.objects;

create policy "Admins read images for upload upsert"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'liberty-images'
  and private.is_admin()
);
