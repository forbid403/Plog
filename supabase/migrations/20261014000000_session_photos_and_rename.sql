-- ---------------------------------------------------------------------------
-- Session detail edits (Figma: Plog Design, node 681:2562 "My page - Plog Detail")
-- ---------------------------------------------------------------------------
-- Product decision 2026-10-14: the full Figma session detail is built, which
-- goes beyond spec v4.2 in three ways — please update the spec:
--   * title is user-editable (spec G4.4 said auto-generated only). The
--     sessions_set_title trigger is BEFORE INSERT only, so a rename sticks.
--     The existing "owner-updatable" policy already allows it.
--   * sessions can be deleted (spec F5 said not provided). The existing
--     "owner-deletable" policy already allows it.
--   * several photos per session (spec D5/F4 had one). Added below.
--
-- photo_urls holds every photo in display order. photo_url stays as the
-- main photo (= photo_urls[1]) so the Impact card and the litter log keep
-- working unchanged; the app writes both together.

alter table public.sessions
  add column photo_urls text[] not null default '{}';

update public.sessions
  set photo_urls = array[photo_url]
  where photo_url is not null;
