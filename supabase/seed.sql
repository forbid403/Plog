-- Badge catalog (spec G5.4). Run automatically by `supabase start` / `db reset`.
insert into public.badges (id, type, label, threshold) values
  ('streak_5', 'streak', '5-day streak', 5),
  ('streak_10', 'streak', '10-day streak', 10),
  ('streak_15', 'streak', '15-day streak', 15),
  ('streak_20', 'streak', '20-day streak', 20),
  ('distance_1', 'distance', '1 km', 1),
  ('distance_5', 'distance', '5 km', 5),
  ('distance_10', 'distance', '10 km', 10),
  ('distance_15', 'distance', '15 km', 15);
