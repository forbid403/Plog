-- ---------------------------------------------------------------------------
-- sessions.title generation (G4.4): "{Weekday} {Time of day} Run", computed
-- server-side from started_at/timezone and stored once (it's a search
-- target) — never client-supplied, never user-editable. A BEFORE INSERT
-- trigger overwrites whatever (if anything) the client sent, so createSession
-- (src/api/sessions.ts) can simply omit the column.
-- ---------------------------------------------------------------------------

create or replace function public.generate_session_title(started_at timestamptz, tz text)
returns text
language plpgsql
stable
as $$
declare
  local_ts timestamp;
  weekday text;
  hour_of_day int;
  time_of_day text;
begin
  local_ts := started_at at time zone tz;
  weekday := trim(to_char(local_ts, 'Day'));
  hour_of_day := extract(hour from local_ts);

  -- G4.4's ranges, [Proposed]: 05:00-11:59 Morning, 12:00-16:59 Afternoon,
  -- 17:00-20:59 Evening, 21:00-04:59 Late Night.
  time_of_day := case
    when hour_of_day between 5 and 11 then 'Morning'
    when hour_of_day between 12 and 16 then 'Afternoon'
    when hour_of_day between 17 and 20 then 'Evening'
    else 'Late Night'
  end;

  return weekday || ' ' || time_of_day || ' Run';
end;
$$;

create or replace function public.set_session_title()
returns trigger
language plpgsql
as $$
begin
  new.title := public.generate_session_title(new.started_at, new.timezone);
  return new;
end;
$$;

create trigger sessions_set_title
  before insert on public.sessions
  for each row execute function public.set_session_title();
