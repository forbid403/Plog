-- Storage buckets for user-uploaded images (A4 avatar, D5 litter photo) and
-- server-generated images (E impact card). All three are public-read because
-- their content is meant to be shared/displayed outside auth (impact cards
-- especially — E4, the public card web page) — writes are restricted to the
-- owning user via the object path convention `{user_id}/...`.

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('session-photos', 'session-photos', true),
  ('impact-cards', 'impact-cards', true);

create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars are owner-writable"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars are owner-updatable"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "session photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'session-photos');

create policy "session photos are owner-writable"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'session-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "impact cards are publicly readable"
  on storage.objects for select
  using (bucket_id = 'impact-cards');

create policy "impact cards are owner-writable"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'impact-cards' and (storage.foldername(name))[1] = auth.uid()::text);

-- Upload convention: path = `{user_id}/{filename}`, enforced by the policies
-- above via storage.foldername(name)[1].
