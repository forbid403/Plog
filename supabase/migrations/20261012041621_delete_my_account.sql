-- Account deletion (Apple 5.1.1(v) / Google Play both require it for an app
-- that creates accounts). Deletes the caller's own row from auth.users,
-- which cascades to profiles -> sessions -> user_badges (all `on delete
-- cascade`, see 20261001053338_initial_schema.sql). Storage files are
-- NOT handled here — storage.objects rows are just metadata, actually
-- removing the underlying files needs the Storage API, not SQL, so the
-- client (src/api/auth.ts deleteAccount) removes those first via
-- supabase.storage.from(bucket).remove(), then calls this.
--
-- SECURITY DEFINER so it can delete from auth.users (normally restricted
-- to the supabase_auth_admin role) while still only ever deleting the
-- CALLING user's own row — auth.uid() is read inside the function body,
-- never passed in as an argument, so there's no way to pass someone
-- else's id.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'delete_my_account() requires an authenticated caller';
  end if;

  delete from auth.users where id = auth.uid();
end;
$$;

-- Only signed-in users can call it; anon callers have no auth.uid() anyway
-- (the function itself would raise), but revoking anon/public execute is
-- the standard extra layer of defense for a security-definer function.
revoke execute on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;

-- The original storage_buckets migration never added a delete policy for
-- any of the three buckets (only select/insert/update) — confirmed
-- directly this silently blocked deleteAccount()'s own file cleanup via
-- RLS, even for a file's own owner. Same owner-path-prefix check as the
-- existing insert/update policies.
create policy "avatars are owner-deletable"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "session photos are owner-deletable"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'session-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "impact cards are owner-deletable"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'impact-cards' and (storage.foldername(name))[1] = auth.uid()::text);
