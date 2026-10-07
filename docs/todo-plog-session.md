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
      `usePlogSession().start()` then navigates to `/plog-session`
      (placeholder stub for C3, see below)
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

`app/plog-session.tsx` is a **temporary stub** destination (outside
`(tabs)` so the tab bar hides, per spec 0.3) — just proves navigation +
the state machine work, with a Discard button to get back out. Gets
replaced by the real C3 screen below.

## C3. Recording screen — UI done (`app/plog-session.tsx`), foreground-only

- [x] Status pill, top centre: `Session on track` / `Weak GPS signal` —
      threshold reused from C5's own 30m low-accuracy cutoff (C3 itself
      doesn't give a number)
- [x] Live route line drawn as points come in — `react-native-maps`
      `Polyline`
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
      tested) — pace/elevation/place name/title still not built
- [ ] Background location (C3.1) — **not done, current points are
      foreground-only via `watchPositionAsync` in the screen itself, not
      `useCurrentLocation`** (that hook's single-`location` value isn't
      right for accumulating a route — see the screen's own subscription).
      So right now: recording does NOT survive backgrounding or an app
      kill, only status/timing does (that part's in expo-sqlite already).
  - [ ] `expo-location.startLocationUpdatesAsync` — `BestForNavigation`,
        `distanceInterval: 5`, `activityType: Fitness`
  - [ ] iOS `showsBackgroundLocationIndicator: true`; Android foreground
        service notification (`Plog is recording your session`) — and
        the matching `NSLocationAlwaysAndWhenInUseUsageDescription` /
        Android background permission in `app.json` (deliberately left
        out until this lands, see C2's commit)
  - [ ] Background task writes points straight to `expo-sqlite`; the
        screen only *reads* from the DB (enables kill-and-resume recovery)
  - [ ] Mark points received while paused as `paused`, excluded from C5
        calculations
  - [ ] `stopLocationUpdatesAsync` on finish or Discard
  - [ ] ⚠️ Background location doesn't work in Expo Go — needs a dev build
        (`npx expo run:ios` / EAS dev build) to test
  - [ ] Route testing: iOS Simulator location simulation (City Run) / GPX
        playback in Android emulator
  - [ ] `expo-location.startLocationUpdatesAsync` — `BestForNavigation`,
        `distanceInterval: 5`, `activityType: Fitness`
  - [ ] iOS `showsBackgroundLocationIndicator: true`; Android foreground
        service notification (`Plog is recording your session`)
  - [ ] Background task writes points straight to `expo-sqlite`; the
        screen only *reads* from the DB (enables kill-and-resume recovery)
  - [ ] Mark points received while paused as `paused`, excluded from C5
        calculations
  - [ ] `stopLocationUpdatesAsync` on finish or Discard
  - [ ] ⚠️ Background location doesn't work in Expo Go — needs a dev build
        (`npx expo run:ios` / EAS dev build) to test
  - [ ] Route testing: iOS Simulator location simulation (City Run) / GPX
        playback in Android emulator

## C4. Pause / finish sheet

- [ ] Reuse **`BottomSheet`** (already built)
- [ ] `Finished your plog session?` + time/distance/elevation summary
- [ ] `Resume` (and drag-down = same as Resume [Proposed])
- [ ] `Finish & Log litter →` — save session (C6), go to Litter log
- [ ] `Discard this session` (red text) → confirm dialog → delete → idle
- [ ] Minimum session: <1 min or <0.1 km can't be saved — show "too
      short" message with `Resume`/`Discard` instead of `Finish`

## C5. Calculation lib

`src/lib/` — pure functions, unit test boundaries (0, exactly-at-minimum,
noise thresholds):

- [ ] Distance: sum consecutive GPS points, excluding points with error
      >30m and paused periods
- [ ] Time: elapsed excluding manual pauses only
- [ ] Avg pace: time ÷ distance
- [ ] Elevation gain: sum of positive altitude changes, <3m ignored as
      noise
- [ ] Title generation (G4.4 — shared rule, check if Home side already
      built this before duplicating)

## C6. Session save

- [ ] `src/api/sessions.ts`: `createSession(payload)` — insert into the
      `sessions` table (schema already matches this payload shape, see
      `supabase/migrations/`)
- [ ] On network failure: keep locally, retry, don't block Litter log
      [Proposed]

## C7. Route guide mode — later

- [ ] Depends on Home's route cards (B5) existing first. Grey route line +
      markers, `You're {n} km from the start`, `Off route` status pill,
      actual path drawn over planned route, `routeId` stored on session

---

## D. Litter log

- [ ] Header: back + `Litter Log` — **`TopBar depth={2}`**
- [ ] Q1 + stepper + quick-pick chips (`A few`/`1/4`/`1/2`/`3/4`/`Full
      bag`), stepper and chips share one value — **`Chip`** (`selected`
      toggle)
- [ ] Bag illustration, fills from bottom by ratio
- [ ] Q2 + bag size chips (`5L`/`10L`/`15L`/`20L`/`25L`) — **`Chip`**
- [ ] Photo area: `expo-image-picker` (capture/select) +
      `expo-image-manipulator` (resize to 2048px long edge), preview with
      replace/remove
- [ ] `Submit` (**`Button variant="fill"`**) / `I didn't collect any this
      time` (**`Button variant="outlined"`**)
- [ ] Back button → confirm dialog (`Leave without logging litter?`) →
      leaving saves 0 L and goes Home
- [ ] `src/lib/litter.ts`: `liters = round(ratio × bagSizeLiters, 1)` —
      pure function, unit tested
- [ ] Levels 1–5 only for now (level 1 `A few`=0.1, 6+ is **on hold**,
      H1-1 D1) — implement the `+N` display logic (G4.3) ahead of time
      even though it's unused until 6+ is decided
- [ ] `src/api/sessions.ts`: `updateLitter(sessionId, {...})` —
      `fillRatio`/`bagSizeLiters`/photo upload (`session-photos` bucket) →
      updates `sessions` row
- [ ] Build as one screen with `mode: 'create' | 'edit'` (D8) rather than
      two — same layout, edit just prefills + relabels (`Edit litter` /
      `Clear litter`)

## E. Impact card

- [ ] Header: back, `Impact card`, `Done` — dark green background
- [ ] Card: date, `You collected`, litter amount (or `– L` if 0L/unset),
      route map + photo (photo overlapping map; map only + larger if no
      photo), place name, metrics (time · distance · elevation)
- [ ] 0 L sessions still get a shareable card (litter value empty, no
      photo)
- [ ] Capture card as image: `react-native-view-shot`, 1080×1920
- [ ] Share sheet (white bottom sheet, reuse **`BottomSheet`**):
  - [ ] Instagram Story via `react-native-share` — ⚠️ needs a Meta App ID
        (spec 0.5 prerequisite — confirm this exists before building).
        Hide button if Instagram isn't installed
  - [ ] WhatsApp / Telegram via `react-native-share`, system share sheet
        fallback if not installed
  - [ ] Copy Link → clipboard + `Link copied` toast
  - [ ] Download → `expo-media-library` save + `Saved to Photos` toast
- [ ] Entry from Litter log submit: `Done` → Home. Entry from session
      detail/My feed share: `Done` → closes to previous screen
- [ ] **Not built yet, defer**: public card web page
      (`https://{domain}/c/{cardId}`) and server-side `impactCardUrl`
      generation — ship client-side share first (captured image), wire
      the public URL later

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
