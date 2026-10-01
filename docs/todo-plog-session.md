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

- [ ] `usePlogSession` (or similar) hook/store driving `idle | recording |
      paused` — idle/recording/paused screens all read from this one place
      so background-kill recovery doesn't desync them

## C2. Idle screen

- [ ] Full-screen map, blue dot for current location, nearby POIs
- [ ] Start button (round, green) — `ButtonRound variant="fill"`
- [ ] Top-left: re-centre-on-location button, shown only after the user
      pans the map [Recommended]
- [ ] Map follows current location until the user pans [Proposed]
- [ ] `Start` disabled + `Finding GPS…` until accuracy is acceptable
      [Proposed]
- [ ] No-permission state: message + button to Settings
- [ ] Tab bar shown here (Plog is a tab) [Recommended]

## C3. Recording screen

- [ ] Status pill, top centre: `session on track` / `Weak GPS signal`
      [Proposed]
- [ ] Live route line drawn as points come in
- [ ] Elapsed time (bottom left, excludes pauses), distance (bottom right,
      2 decimals)
- [ ] Pause button (round, yellow) — `ButtonRound variant="fill"`
- [ ] Background location (C3.1):
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
