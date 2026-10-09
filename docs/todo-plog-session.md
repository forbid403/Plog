# TODO — Plog session (Parts C, D, E, F)

Owner: Plog session flow (idle → recording → finish → litter log → impact
card → session detail). Home + My tab are owned separately.

Spec source: `docs/spec.md` Parts C/D/E/F. Section numbers below (`C2`, `D4`,
…) refer to it — re-read the relevant section before building that item,
it has details not repeated here.

Suggested build order: state machine → idle → recording → finish sheet →
litter log → impact card → session detail (matches the C1 user flow).
Session detail is reached from the My feed, so it's only really testable
once My exists, but the screen itself doesn't depend on it.

## State machine (C1)

- [x] `usePlogSession` hook/store driving `idle | recording | paused` —
      idle/recording/paused screens all read from this one place so
      background-kill recovery doesn't desync them
      (`src/hooks/usePlogSession.ts`, persisted via `expo-sqlite`
      — `src/lib/plogSessionDb.ts` + time math in
      `src/lib/plogSessionTime.ts`, unit tested). Scope note: this only
      covers status/timing: GPS points (C3.1) and the server save (C6)
      are separate, not done yet.

## C2. Idle screen — done (`app/(tabs)/plog.tsx`)

- [x] Full-screen map, blue dot for current location (`showsUserLocation`).
      Nearby POIs are Apple/Google Maps' own default — not disabled, nothing
      extra to build
- [x] Start button (round, green) — `ButtonRound variant="fill"`. On press:
      `usePlogSession().start()` — no navigation, this screen's own UI
      switches to the recording layout once `status !== 'idle'` (see the
      architecture note below)
- [x] Top-left re-centre button, shown only after panning — new
      `LocateIcon` (generic crosshair, **not from Figma** — no node was
      given for this button)
- [x] Map follows current location until the user pans [Proposed]
- [x] `Start` disabled + `Finding GPS…` until accuracy ≤20m — **our own
      threshold**, spec doesn't give a number
- [x] No-permission state: message (copy **not in spec, flagged** in code
      comment, not final) + `Open Settings` button
- [x] Tab bar shown — automatic, idle screen lives in `app/(tabs)/` same as
      Home/My

Known gap: no Figma was fetched for this screen's exact layout, so the
Start button's position (clearing the floating tab bar) is a reasonable
guess, not pixel-matched — revisit once/if a Figma node exists for it.

**Architecture note (superseding the original plan below):** idle and
recording turned out to belong in **one screen**, not two routes. An
earlier version pushed to a separate `/plog-session` route on Start, which
hit a whole class of navigation/hydration-race bugs (double-tap making
duplicate `plog_sessions` rows, a race where the new screen's status read
'idle' before its DB hydration finished and bounced straight back — looked
exactly like "Start does nothing", found by checking the DB directly since
it happened faster than a screenshot could catch). Switching to one screen
that branches on `usePlogSession().status` removed the bug class entirely
— see git history (search "hydration race", "duplicate plog_sessions") for
the full debugging trail. Tab bar hiding (spec 0.3) now comes from
`app/(tabs)/_layout.tsx`'s tab bar reading that same status, not from
leaving the route group.

## C3. Recording screen — done, merged into `app/(tabs)/plog.tsx`

- [x] Status pill, top centre: `Session on track` / `Weak GPS signal` —
      threshold reused from C5's own 30m low-accuracy cutoff (C3 itself
      doesn't give a number)
- [x] Live route line drawn as points come in — `react-native-maps`
      `Polyline`, fed from `plog_points` (not a local subscription — see C3.1).
      Split at pauses (`splitActiveSegments`): nothing is drawn for a
      paused period, not even a straight line from pause to resume
- [x] Elapsed time + distance (2 decimals) — `src/lib/format.ts`
      (`formatDuration`/`formatDistanceKm`, spec 0.2, unit tested), laid
      out either side of the Pause button rather than strictly
      bottom-left/bottom-right corners (no Figma reference for this
      screen either)
- [x] Pause button (round, yellow) — extended `ButtonRound` with a `tone`
      prop (`'primary' | 'secondary'`; Figma's component only defines
      green). `tone="secondary"` for this one
- [x] `src/lib/plogSessionDistance.ts` (+test): the distance slice of C5
      only (haversine sum, excludes >30m-accuracy and paused points, unit
      tested). Rest of C5 now built too — see C5 below

### C3.1 Background location — done

- [x] `src/lib/backgroundLocationTask.ts`: `TaskManager.defineTask` at
      module scope (side-effect-imported from `app/_layout.tsx` so it's
      always registered at launch) + `startBackgroundLocationTracking()` /
      `stopBackgroundLocationTracking()`. `startLocationUpdatesAsync` with
      `BestForNavigation`, `distanceInterval: 5`, `activityType: Fitness`,
      `showsBackgroundLocationIndicator: true`, foreground service
      (`Plog is recording your session`)
- [x] Task writes straight to `plog_points` via a **fresh** `expo-sqlite`
      connection (`openDatabaseAsync`, not `useSQLiteContext` — the task
      runs outside the React tree, possibly in a headless JS context).
      `app/(tabs)/plog.tsx` only reads (polls every 2s)
- [x] Points marked `is_paused` by reading the *live* `plog_sessions.status`
      row inside the task — single source of truth, not a copy the task
      carries in memory — then excluded from `computeDistanceKm` (C5)
- [x] `usePlogSession.start()` requests background permission + starts the
      task; `finish()`/`discard()` stop it. `pause()`/`resume()`
      deliberately don't touch the task — it keeps running, points just
      get the `is_paused` flag
- [x] `app.json`: `isIosBackgroundLocationEnabled` /
      `isAndroidBackgroundLocationEnabled` / `isAndroidForegroundServiceEnabled`
      + `locationAlwaysAndWhenInUsePermission`, `expo-task-manager` plugin added
- [x] **Verified on a real dev build** (`npx expo run:ios`, simulator):
      the task fires and writes real points (lat/lng/accuracy/timestamp)
      to `plog_points`, confirmed by reading the SQLite file directly, not
      just by screenshot — a foreground UI bug (see architecture note
      above) made the recording screen unreachable at the time, but the
      background task itself was recording correctly underneath the whole
      time regardless
- [x] `kCLErrorDomain Code=0` (`kCLErrorLocationUnknown`) downgraded from
      `console.error` to `console.warn` — Apple docs call it often-transient
      (e.g. simulator with no simulated location set yet), not fatal
- [x] Backgrounding the app (Cmd+Shift+H) mid-recording — confirmed on the
      iOS Simulator dev build: `plog_points` kept growing every ~2s while
      backgrounded (79→107 over ~60s), fresh timestamps, `is_paused=0`.
      Checked by polling the SQLite file directly, not by screenshot (can't
      screenshot a backgrounded app anyway)
  - [ ] Still not done: Android (foreground service), and a real device —
        simulator-only so far
  - [ ] Route testing: iOS Simulator location simulation (City Run) / GPX
        playback in Android emulator
- [ ] If background permission is denied, `start()` logs a warning and
      proceeds foreground-only (not blocking) — not verified this
      degrades gracefully rather than just silently losing points once
      backgrounded; check this on a real device too

## C4. Pause / finish sheet

**Superseded by the node 117:518 Figma redesign** (see C2/C3's architecture
note and the git history around "TrackingBottomSheet"): there's no separate
modal finish sheet. Pausing turns the persistent recording sheet yellow and
swaps its action button(s) to Resume, and Finish lives right there (in the
sheet's Expanded state) rather than behind a dedicated "Finished your plog
session?" dialog — the `BottomSheet` component was not reused, the
redesign's sheet isn't dismissible/modal.

- [x] Pause/Resume + Finish buttons in the sheet's Expanded state
      (`app/(tabs)/plog.tsx`, both Default and Paused modes)
- [x] Minimum session gate (<1 min or <0.1 km): Finish shows `This session
      is too short to save.` via `Alert.alert` with Resume/Discard instead
      of saving (`MIN_SESSION_SEC`/`MIN_SESSION_KM`, `confirmFinish`)
- [x] Discard: same confirmation copy as spec (`Discard this session? This
      can't be undone.`), wired to the top-left back button — **not** a
      separate "Discard this session" text action, since the redesign
      doesn't have the old modal's layout to put one in. Confirmed with
      the user directly that the back button should be this
- [x] Drag sheet down = collapse (not Resume — confirmed with the user the
      drag gesture is purely the Collapse/Expand toggle, not tied to
      Resume)
- [x] `Finish & Log litter` → `usePlogSession().finish()` → C6's
      `createSession` → Litter log (`/litter-log?sessionId=…`)

## C5. Calculation lib

`src/lib/` — pure functions, unit test boundaries (0, exactly-at-minimum,
noise thresholds):

- [x] Distance: sum consecutive GPS points, excluding points with error
      >30m and paused periods (`plogSessionDistance.ts`; that exclusion
      rule is exported as `isUsablePoint` and shared by elevation). A pause
      breaks the route: nothing is measured across it (fixed 2026-10-09 —
      movement during a pause used to count as a straight line). Same for
      elevation
- [x] Time: elapsed excluding manual pauses only (`plogSessionTime.ts`)
- [x] Avg pace: time ÷ distance — `computeAvgPaceSecPerKm` (null at 0 km)
      + `formatPace` (`m′ss″`, `format.ts`)
- [x] Elevation gain: sum of positive altitude changes, <3m ignored as
      noise (`plogSessionElevation.ts`). Measured against the last
      *accepted* altitude, so a slow 1m-per-point climb still counts once
      it reaches 3m
- [x] Wired into the recording screen's expanded sheet (elev. gain, avg
      pace). Pace before any distance shows `0′00″` — **spec doesn't
      define this**, our own placeholder
- [x] Title generation (G4.4) — server-side trigger, see C6. Place name
      (reverse geocode) is still a Backend gap

## C6. Session save

- [x] `src/api/sessions.ts`: `createSession(payload)` — called from
      `app/(tabs)/plog.tsx`'s `handleGuardFinish` (the guard sheet's
      "Finish & Log litter" button), right after `usePlogSession().finish()`.
      Litter fields (D2-D5) are left null — `updateLitter` fills them in
      from the Litter log screen. On success, `plog_points` for that
      session are deleted (only on success — see below)
- [x] `title` (G4.4) generated server-side: new migration
      (`supabase/migrations/20261008003725_session_title_trigger.sql`), a
      `BEFORE INSERT` trigger that overwrites whatever `title` the client
      sent (client doesn't send one) using `started_at`/`timezone`.
      Verified against the local Supabase instance: all four time-of-day
      buckets, and a full createSession→updateLitter round-trip (RLS,
      trigger, and the update both confirmed working)
- [ ] On network failure: keep locally, retry, don't block Litter log
      [Proposed] — **not built**. `createSession` failing shows an Alert
      and does NOT delete `plog_points` (so the route data isn't lost),
      but there's no retry UI yet to act on that — a real gap, flagged in
      `handleGuardFinish`'s catch block, not silently patched over
- [ ] `getSession(id)`, `getSessionRoute(id)` — not needed yet (F isn't
      built)

## C7. Route guide mode — later

- [ ] Depends on Home's route cards (B5) existing first. Grey route line +
      markers, `You're {n} km from the start`, `Off route` status pill,
      actual path drawn over planned route, `routeId` stored on session

---

## D. Litter log — done except D8 (edit mode)

`app/litter-log.tsx`. Built against Figma (Plog Design, node 681:1945)
rather than spec D1 where they differ — bag size first, no quick-pick
chips, stepper starts at `None` (decided 2026-10-08) instead of spec's
levels starting at 1.

- [x] Header: back + `Litter Log` — `TopBar depth={2}`
- [x] Stepper (`None` through `A full bag`), bag illustration fills from
      the bottom by ratio — no separate quick-pick chips (Figma deviation
      above)
- [x] Bag size chips (`5L`/`10L`/`15L`/`20L`/`25L`) — `Chip`. "Add other
      size" chip is Figma-only, **not wired** (no spec'd input/limits)
- [x] Photo area: `expo-image-picker` + `expo-image-manipulator` (resize
      to 2048px long edge), preview with remove
- [x] `Submit` / `I didn't collect any this time`, both disabled while a
      save is in flight (`saving` state)
- [x] Back button → confirm dialog → `Leave` saves liters:0 (explicit
      zero, same as "I didn't collect any" — claude.md: "0 L sessions are
      real sessions", not left null) and goes Home
- [x] `src/lib/litter.ts`: `computeLiters` + `FILL_LEVELS`/`BAG_SIZES_L`,
      unit tested
- [x] Levels 0–5 only (0=`None` added per the Figma deviation above,
      1-5 map to spec's levels); 6+ still on hold (H1-1 D1)
- [x] `src/api/sessions.ts`: `updateLitter(sessionId, payload)` — updates
      the row `createSession` (C6) already made, uploads the photo (if
      any) to `session-photos` first. Verified end-to-end against the
      local Supabase instance
- [ ] `+N` bag icon display logic (G4.3) — `computeBagIconFills` exists in
      `litter.ts` but isn't used anywhere yet (no screen shows the icon
      row — that's G2/My tab, not this screen)
- [ ] D8 (edit mode, `mode: 'create' | 'edit'`): **not built** — no entry
      point exists yet either (Session detail / F isn't built)
- [x] After a save (Submit / "I didn't collect any") → Impact card
      (`/impact-card?sessionId=…`)
- [x] 10px gaps from Figma (chip row, stepper, buttons) use `spacing.s`
      (8) — decided 2026-10-09: no new token needed

## E. Impact card — done except Copy Link and the session-detail entry point

`app/impact-card.tsx`. Built against Figma (Plog Design, node 681:1985).
Reached only from Litter log right now (pushed, not replaced, so Back pops
to Litter log with its input intact — E3's "Back to Litter log to edit").

- [x] Header: back (glass circle), `Impact card`, `Done` (glass pill,
      reuses `Button variant="glass"`) — dark green background. The exact
      bg color (`rgba(4,59,20,0.81)`) isn't a design token — flattened to
      an opaque hex, flagged in a code comment like the existing
      BottomNavigation shadow gap
- [x] Card: date (`formatImpactCardDate`, new in `format.ts`), `You
      collected`, litter amount (`formatLiters`, new in `format.ts`, `– L`
      when `liters` is null), route map (`react-native-maps`, non-interactive,
      bounds fit to the route) + photo overlapping it, metrics row
      (time/distance/elevation, same style as C4's guard sheet)
- [ ] Place name: **not shown** — `placeName` is always null (reverse
      geocoding isn't built, Backend gaps), the location line is omitted
      rather than faked
- [ ] "Map only, larger, if no photo" [Proposed] — not implemented, the
      map frame is the same size either way
- [x] 0 L sessions get a card too — `liters: 0` isn't null (D7 always
      saves an explicit number), so this shows `0 L`, not `– L`.
      `– L` only happens if `updateLitter` was somehow never called —
      defensive, not a reachable path in the current flow
- [x] Capture: `react-native-view-shot`, captures the card specifically
      (not the whole screen) per spec — **not** resized to exactly
      1080×1920 (Stories ratio), captures at native resolution instead,
      flagged as a simplification in a code comment
- [x] Share sheet (`BottomSheet`, `showHandle={false}`, opened on mount —
      spec shows it as part of the screen's default layout, not a toggle):
  - [x] WhatsApp / Telegram: `Share.shareSingle` (direct target, no extra
        config), falls back to the generic `Share.open()` system sheet on
        failure (e.g. app not installed — always true on the Simulator)
  - [x] Instagram Story: **skips** the dedicated `INSTAGRAM_STORIES`
        target entirely (its typings require a Meta App ID we don't have
        — spec 0.5's own flagged prerequisite) and goes straight to the
        generic share sheet
  - [ ] Copy Link: **not wired** — no public card URL exists yet (E4's own
        note: ship client-side share first). Button shows "Not available
        yet" instead of a broken/fake link
  - [x] Download: `expo-media-library`, requests write-only permission
        (`requestPermissionsAsync(true)`), `Saved to Photos` alert.
        Required adding the `expo-media-library` config plugin to
        `app.json` (`savePhotosPermission`) and a full native rebuild
        (`npx expo prebuild` + `npx expo run:ios`) — a Metro JS reload
        alone wouldn't have picked up the new iOS permission string
  - [ ] "Hide button if Instagram isn't installed" [Proposed] — not
        implemented, all three social buttons always show
- [x] `Done` → Home (`router.replace('/')`) — doesn't clear Plog/Litter
      log from the stack beneath, same simplification Litter log's own
      navigation already makes
- [ ] Session detail / My feed share entry point — not reachable yet,
      F (session detail) isn't built
- [ ] **Not built, deferred**: public card web page
      (`https://{domain}/c/{cardId}`) and server-side `impactCardUrl`
      generation

## F. Session detail

- [ ] Header: back, session title, share icon → Impact card (E3) —
      **`TopBar depth={2}`**, share icon via **`CircleIconButton`** +
      a new share icon component (not built yet)
- [ ] Route map: line + start/end markers, zoomed to fit; tap → full
      screen map (G4.5 — check if My tab already built this, don't
      duplicate)
- [ ] Metrics grid, 2×2: distance, time / avg pace, elevation gain (no
      heart rate/calories — out of MVP)
- [ ] Photo (hidden if none) + litter amount; `Log litter` (0L) /
      `Edit litter` (logged) → Litter log edit mode (D8)
- [ ] No delete — only Discard pre-save (C4) exists
- [ ] `src/api/sessions.ts`: `getSession(id)`, `getSessionRoute(id)`

---

## Backend gaps (not built — flag here if blocked on one)

From `claude.md` "Backend" section, still [Proposed]/not implemented:

- Reverse geocoding → `sessions.place_name`
- Route thumbnail generation → `sessions.route_thumbnail_url`
- Impact card image generation server-side → `sessions.impact_card_url`
- Badge award computation (streak/distance → `user_badges`, D7's
  `newBadges`)
- Hosted Supabase project link (currently local-dev only)

Decide DB function vs. Edge Function per item when you get there — don't
default to Edge Functions for everything (see claude.md).
