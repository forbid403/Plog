# Plog Screen Specification (v4.2)

| Item | Details |
| --- | --- |
| Project | Plog |
| Service | An app for recording plogging (picking up litter while running or walking) and visualising and sharing the impact |
| Scope | Whole app: onboarding, Home, Plog session, Litter log, Impact card, session detail, My tab |
| Status | v4.2 — all screens included, platform confirmed. 1 on hold · 1 to confirm (Part H) |
| QA | Separate document **Plog QA Checklist** (as of v4.1; later spec changes are not reflected) |

> Labels: **[Confirmed]** product decision or confirmed in design · **[Proposed]** suggested implementation detail · **[Recommended]** recommendation made at the product owner's request (to confirm) · **[TBD-xx]** decision needed (Part H)

## Change log

| Version | Changes |
| --- | --- |
| v1 | Initial draft based on a single Your Impact screen |
| v2 | Split into My tab (summary + Recent Plogs feed) and Your Impact detail; added year selector and total distance |
| v3 | Applied My tab product decisions (conversion basis, search and sort, bag icons, title rules, chart, streaks and badges, etc.) |
| v3.1 | Full-screen map and `+N` display confirmed. QA checklist moved to a separate document |
| v4.0 | Renamed to Plog. Added onboarding, Home, Plog session, Litter log, Impact card, session detail. My tab section numbers prefixed with `G` |
| v4.1 | Applied decisions: sign-up with nickname + profile image (A4), route data review, filter chips and route guide mode (B5, C7), no auto-pause, minimum session, heart rate and calories out of MVP, no litter → empty Impact card, log/edit litter later (D8), public web page, no session deletion |
| v4.2 | Platform confirmed: Expo (React Native) app + public card web page. Added tech stack (0.5), permission implementation (0.4), background recording notes (C3.1), and implementation details for account (A4), photos (D5), and sharing (E4) |

## Contents

- Part 0. App structure, common rules, and tech stack
- Part A. Onboarding
- Part B. Home
- Part C. Plog session
- Part D. Litter log
- Part E. Impact card
- Part F. Session detail
- Part G. My tab (My, Your Impact, full-screen map)
- Part H. Open decisions and placeholder data fixes

---

## Part 0. App structure and common rules

### 0.1 Navigation

```
First launch  Onboarding → profile setup (nickname, image) → Home
Bottom tabs   Home | Plog | My
Plogging      Plog tab (idle) → recording ⇄ paused → finish sheet
              → Finish & Log litter → Litter log → Impact card → Done
              → I didn't collect any → Impact card (litter left empty)
              → Discard → idle
Routes        Home route card → route guide idle screen → Start (C7)
History       My → session card → session detail → share → Impact card
Edit litter   Session detail → Log / Edit litter → Litter log (D8)
```

### 0.2 Common display rules

| Item | Rule |
| --- | --- |
| Units | km, L, m, °C, bpm, kcal (metric, Australian market) |
| Distance | 1 decimal place in lists and detail (7.6 km); 2 decimal places while recording, in the finish sheet and on the Impact card (4.00) [Confirmed, per design] |
| Time | `mm:ss`, `h:mm:ss` if 1 hour or more |
| Pace | `m′ss″` per km |
| Date | Lists `DD/MM/YY`; Impact card `D Mon YYYY` (26 Aug 2026) |
| Time zone | Session dates and weekdays use the session's stored time zone |
| Litter amount | 1 decimal place, omitted for whole numbers (G3.2) |

### 0.3 Tab bar visibility

| Screen | Tab bar |
| --- | --- |
| Home, My, Your Impact, session detail, Plog idle screen | Shown (Plog idle is [Recommended], C2) |
| Onboarding, profile setup, Plog recording and finish sheet, Litter log, Impact card | Hidden |

### 0.4 Permissions

| Permission | Used for | When to request [Proposed] |
| --- | --- | --- |
| Location (while in use) | Home weather, Plog session | Right after onboarding |
| Location (background) | Recording with screen off | On first session Start |
| Camera and photo library | Litter log photo | On tapping the photo area |
| Save to photos | Impact card Download | On tapping Download |
| Health data | Heart rate and calories | Out of MVP [Confirmed] |

> Permissions are requested via `expo-location` (foreground and background), `expo-image-picker`, and `expo-media-library`. Background location requires iOS `UIBackgroundModes: location` and an Android foreground service in the app config (app.json), plus permission usage descriptions for store review (A3).

### 0.5 Platform and tech stack

| Area | Choice | Status |
| --- | --- | --- |
| App | Expo (React Native + TypeScript), iOS and Android | [Confirmed] |
| Public card page | Web (e.g. Next.js) | Web [Confirmed], framework [Proposed] |
| Backend | Supabase (database, anonymous sign-in, photo storage) | [Proposed] |
| Shared code | Types, formatting functions (G3.2), and title generation (G4.4) in a package shared by app and web | [Proposed] |
| Build and release | EAS Build (TestFlight, Play internal testing), EAS Update (instant JS updates) | [Proposed] |
| Testing | Jest (logic), Maestro (E2E), development build (background GPS) | [Proposed] |

**Key libraries** [Proposed]

| Feature | Library | Spec |
| --- | --- | --- |
| Location recording (foreground and background) | `expo-location`, `expo-task-manager` | C3 |
| Local storage while recording | `expo-sqlite` | C3.1 |
| Map and route line | `react-native-maps` | B5, C, F2, G4.5 |
| Photo capture, selection, resizing | `expo-image-picker`, `expo-image-manipulator` | A4, D5 |
| Card image generation | `react-native-view-shot` | E4 |
| Sharing (Instagram Story, WhatsApp, Telegram) | `react-native-share` | E4 |
| Save to photo library | `expo-media-library` | E4 |
| Token storage | `expo-secure-store` | A4 |

**Prerequisites**

- Apple Developer Program and Google Play Console accounts (tester distribution and release)
- Google Maps API key for Android
- Meta (Facebook) app ID (Instagram Stories sharing)
- Background location usage justification (store review)

---

## Part A. Onboarding

### A1. Structure

Two full-screen slides. Background photo with a dark overlay, green `Plog` logo at top left, page indicator at the top.

| Slide | Title | Body | Button |
| --- | --- | --- | --- |
| 1 | Run. Pick up litter. Repeat. | Plogging is picking up litter while you run, jog, or walk. | `Continue` (translucent) → slide 2 |
| 2 | See your impact. | Every litre you collect adds up to something you can picture. | `Get Started` (green) → permission primer → profile setup (A4) → Home |

### A2. Behaviour

- Swipe left/right also navigates [Proposed]
- No Skip button [Confirmed, per design]
- Shown once on first launch. Completion stored on device (shown again after reinstall)
- The indicator shows the current slide as a longer bar

### A3. Location permission [Proposed]

- After `Get Started`, show a short primer explaining why location is needed, then the system prompt
- If denied, still go to Home. The weather card is replaced by a permission prompt card; ask again when entering the Plog tab

### A4. Profile setup (sign-up) [Confirmed]

The MVP **signs users up with only a nickname and profile image**. Full sign-up and sign-in come in v2. There is no design for this screen, so the layout below is proposed.

| Element | Spec |
| --- | --- |
| Title | `Set up your profile` [Proposed] |
| Profile image | Circular; tap for `Take photo` / `Choose from library`. Optional; default avatar if none |
| Nickname | Required, 2–20 characters, trimmed. Duplicates allowed [Proposed] (not used as a login identifier) |
| `Continue` | Enabled when the nickname is valid → sign up → Home |
| Used in | Home and My header avatars, public card web page (E4) |
| Error | On failure, show a message, keep input, allow retry |

Account handling [Proposed]

- Issue a user ID and token via Supabase anonymous sign-in; store nickname and image in a profile table. Keep the token in `expo-secure-store`
- With no sign-in, changing devices or deleting the app loses access to past sessions → in v2, link email or social sign-in to the anonymous account to keep existing history
- Editing nickname or image is out of MVP scope (avatar has no tap action, G2)

API: `POST /users` (multipart) `{ "nickname": "plogger", "avatar": "(file, optional)" }` → `{ "userId": "u_1", "token": "..." }`

---

## Part B. Home

### B1. Structure

1. Header: `Home` title, avatar (no tap action, same as G2)
2. Section Dashboard: weather card and streak card (2 columns), This Week card
3. Section Recommended Routes: filter chips + horizontally scrolling cards
4. Bottom tab bar (`Home` active)

### B2. Weather card

| Element | Example | Data |
| --- | --- | --- |
| Area name | Surry Hills | Reverse-geocoded suburb of current location |
| Temperature | 12°C | Current temperature, integer |
| Weather icon | Umbrella | Current conditions |
| Precipitation | 3mm | Expected rainfall over the next 3 hours [Recommended] |

- Refresh: on entering Home, 30-minute cache [Proposed]
- Why 3 hours: the card helps users decide whether to head out now, so near-term rain is more useful than a daily total. Show `0mm` when none
- No location permission: `Turn on location to see local weather` + link to settings
- Error: `Weather unavailable`

### B3. Streak card

| Element | Example | Data |
| --- | --- | --- |
| Label | Streaks | Static |
| Value | 5 days | `currentStreak`; `1 day` when 1 |
| Icon | Flame | Coloured when streak ≥ 1, grey when 0 [Proposed] |

Streak calculation follows G5.4 (resets after a missed day; stays active until midnight when today has no session yet).

### B4. This Week card

- Week starts Monday, current 7 days, device time zone

| State | Condition | Appearance |
| --- | --- | --- |
| `plogged` | At least one session | Light green fill + green border + shoe icon |
| `missed` | Before today, no session | Grey fill, no date number |
| `today` | Today, no session | Dark border + date number |
| `future` | After today | Light border + light date number |

[Proposed] Highlight the `today` border in brand green.

### B5. Recommended Routes

| Element | Example | Data |
| --- | --- | --- |
| Map thumbnail | Red route | Static route image |
| Name | Centennial to Maroubra Loop | Up to 2 lines, truncated with ellipsis |
| Distance | 10 km | 1 decimal place, omitted for whole numbers |
| Elevation | 67m | Total elevation gain |

- Filter chips [Confirmed]: `All` (default [Proposed]) · `Turnaround` · `One way`. Below the section title, single select
  - Turnaround: courses that return to the start (loops, out-and-back)
  - One way: courses with different start and end points
  - If the selected type has no routes, show `No routes nearby` [Proposed]
- Sort: nearest start point first, up to 10 [Proposed]
- Card tap: start a Plog on that route (C7) [Confirmed]
- Hide the section with no location permission [Proposed]

#### B5.1 Data source review

| Candidate | Verdict | Reason |
| --- | --- | --- |
| Strava API | ❌ Not usable | Under the terms revised in November 2024, a user's Strava data may only be shown to that user, and other users' data may not be shown even if public on Strava. Apps that compete with or replicate Strava are also prohibited → cannot be used to recommend routes to other users |
| OpenRouteService | ✅ Recommended | Open-source routing API built on OpenStreetMap. Supports walking profiles and round trips of a given length → suited to generating Turnaround routes. The free key has a daily request limit |
| OpenStreetMap (Overpass API) | ✅ Supplementary | Query named walking and hiking routes mapped in OSM (route=foot / hiking) → real, well-known courses including One way |
| Komoot, AllTrails | ❌ | No public API |

[Recommended] The team pre-generates and reviews Sydney routes with OpenRouteService and OSM, **stores them in our own database**, and the app calls only our API. This makes quality control easier than live generation and avoids external rate limits. Using OSM data requires the `© OpenStreetMap contributors` attribution on maps.

### B6. API [Proposed]

`GET /home?lat=-33.88&lng=151.21&routeType=all` (`all` | `turnaround` | `one_way`)

```json
{
  "weather": { "suburb": "Surry Hills", "tempC": 12, "condition": "rain", "precipitationMm": 3 },
  "currentStreak": 5,
  "week": [ { "date": "2026-09-14", "status": "plogged" } ],
  "routes": [
    { "id": "r_1", "name": "Crestwood", "type": "turnaround", "distanceKm": 9.3, "elevationGainM": 12, "thumbnailUrl": "https://..." }
  ]
}
```

---

## Part C. Plog session

### C1. State flow

```
idle ──Start──▶ recording ──Pause──▶ paused (finish sheet shown)
                    ▲                    │
                    └──────Resume────────┤
                                         ├─ Finish & Log litter ─▶ save session ─▶ Litter log
                                         └─ Discard ─▶ confirm ─▶ delete ─▶ idle
```

### C2. Idle

| Element | Spec |
| --- | --- |
| Map | Full screen, blue dot for current location, nearby POIs |
| Start button | Round green button, bottom centre |
| Top-left button | [Recommended] Replace ⌄ with a **re-centre on my location** button, shown only after the user pans the map |
| Tab bar | [Recommended] Shown on the idle screen (Plog is a tab, so users should be able to switch tabs). Hidden after Start |
| Follow location | Map follows current location; stops following when the user pans [Proposed] |
| Waiting for GPS | Start disabled with `Finding GPS…` until accuracy is acceptable [Proposed] |
| No permission | Location permission message + button to settings |

### C3. Recording

| Element | Spec |
| --- | --- |
| Status pill | Top centre. `session on track` (GPS OK) [Confirmed] / `Weak GPS signal` [Proposed] |
| Route | Drawn live as a line |
| Time | Bottom left, elapsed time excluding pauses |
| Pause button | Round yellow button, bottom centre |
| Distance | Bottom right, km with 2 decimal places |
| Background | Keeps recording with screen off or app in background (C3.1) [Confirmed] |
| Lock screen | Android: foreground service notification while recording (required). iOS: location-in-use indicator in the status bar. Live time/distance updates in the notification and iOS Live Activities need extra native work, so they are out of MVP [Proposed] |
| Recovery | Points are saved to an on-device database immediately, so the in-progress session resumes on relaunch even if the app is killed [Proposed] |
| Auto-pause | None [Confirmed]. Plogging involves frequent stops to pick up litter; running-style auto-pause would constantly interrupt recording and drop pickup time. Manual pause only |

#### C3.1 Implementation notes (Expo) [Proposed]

- `startLocationUpdatesAsync` options: `accuracy: BestForNavigation`, `distanceInterval: 5` (m), `activityType: Fitness`, iOS `showsBackgroundLocationIndicator: true`, Android foreground service notification `Plog is recording your session`
- The background task runs separately from the UI, so write incoming points straight to `expo-sqlite` and have the screen read from the database (also enables recovery if the app is killed)
- Mark points received while paused as `paused` and exclude them from calculations (C5)
- Call `stopLocationUpdatesAsync` on finish or Discard (battery)
- Background location doesn't work in Expo Go; test with a development build
- Route testing: iOS Simulator location simulation (e.g. City Run), GPX playback in the Android emulator
- Maps: Apple Maps on iOS, Google Maps on Android

### C4. Pause and finish sheet

Tapping pause stops recording and opens a bottom sheet.

| Element | Spec |
| --- | --- |
| Title | `Finished your plog session?` |
| Summary | Time · distance (km, 2 decimals) · elevation gain (m) |
| `Resume` | Close sheet and resume recording |
| `Finish & Log litter →` | Save session, then go to Litter log |
| `Discard this session` | Red text. Confirmation dialog (`Discard this session? This can't be undone.`), then delete → idle |
| Drag sheet down | Same as Resume [Proposed] |
| Minimum session | Under 1 minute **or** under 0.1 km cannot be saved [Confirmed]. Show `This session is too short to save.` with `Resume` / `Discard` instead of `Finish` |

### C5. Calculation rules [Proposed]

| Metric | Calculation |
| --- | --- |
| Distance | Sum of distances between consecutive GPS points, excluding low-accuracy points (error > 30m) and paused periods |
| Time | Elapsed time excluding manual pauses only (includes stops to pick up litter) |
| Avg. pace | Time ÷ distance |
| Elevation gain | Sum of positive altitude changes; changes under 3m ignored as noise |
| Place name | Reverse geocode the start point → `Around {place}` |
| Title | G4.4 rules |
| Heart rate, calories | Out of MVP [Confirmed] |

### C6. Session save API [Proposed]

Record locally and upload once on `Finish`.

`POST /sessions`

```json
{
  "startedAt": "2026-08-26T02:10:00Z",
  "endedAt": "2026-08-26T02:52:00Z",
  "timezone": "Australia/Sydney",
  "durationSec": 2400,
  "distanceKm": 4.0,
  "elevationGainM": 234,
  "route": [ { "lat": -33.8832, "lng": 151.2005, "alt": 21.0, "t": "2026-08-26T02:10:00Z" } ]
}
```

Response: `{ "id": "s_456", "title": "Wednesday Afternoon Run", "placeName": "Around UTS" }`

- On network failure, keep locally and retry; don't block Litter log [Proposed]

### C7. Route guide mode [Confirmed]

Tapping a recommended route card opens the idle screen with that route shown.

| Element | Spec |
| --- | --- |
| Idle screen | Route as a grey line with a start marker (plus an end marker for One way). Bottom panel with route name, distance, type, `Start`, and `✕` to clear the route [Proposed] |
| Distance to start | If more than 200m from the start, show `You're {n} km from the start`. Start still allowed [Proposed] |
| Recording | Actual path (colour) drawn over the planned route (grey) |
| Off route | Status pill `Off route` when more than 50m from the route [Proposed]. Turn-by-turn voice guidance out of MVP [Proposed] |
| Saving | Store `routeId` on the session. Title, stats and minimum session rules are the same as normal sessions |

API: `GET /routes/{id}` → route coordinates, type, distance, elevation gain

---

## Part D. Litter log

### D1. Structure

1. Header: back, `Litter Log`
2. Question 1: `How much did you collect?` / helper `A rough guess is perfectly fine — no counting required.`
3. Bag illustration (reflects fill level), small label `Every piece counts`
4. Stepper: `−` level label `+`
5. Quick pick chips: `A few` `1/4` `1/2` `3/4` `Full bag`
6. Question 2: `What's the size of the bag?` chips: `5L` `10L` `15L` `20L` `25L`
7. Photo: `Great to see your impact!` photo area
8. `Submit` (green), `I didn't collect any this time` (outlined)

### D2. Fill levels

The stepper and quick pick chips share one value (choosing a chip updates the stepper label; moving the stepper selects the matching chip).

| Level | Stepper label | Chip | Ratio |
| --- | --- | --- | --- |
| 1 | A handful of litter | A few | 0.1 [TBD-D1] |
| 2 | A quarter of a bag | 1/4 | 0.25 |
| 3 | Half a bag | 1/2 | 0.5 |
| 4 | Three quarters of a bag | 3/4 | 0.75 |
| 5 | A full bag | Full bag | 1.0 |
| 6+ | 1¼ bags, 1½ bags … | (no chip selected) | +0.25 each step — **on hold** |

- Default: level 1 [Proposed]
- `−` disabled at level 1; `+` disabled at Full bag (until the on-hold decision)
- The `A few` ratio and input above one bag are **on hold** (H1-1 D1). Until decided, implement levels 1–5 only; implement the `+N` logic in G4.3 ahead of time
- Illustration: fills from the bottom by ratio; at 1 or more, a full bag + `×N` [Proposed]

### D3. Bag size

- Choose one of 5 / 10 / 15 / 20 / 25L
- Default: last used size; 15L on first use [Proposed]

### D4. Litter calculation [Confirmed]

```
liters = round(ratio × bagSizeLiters, 1)     // 1/2 × 15L = 7.5 L
```

### D5. Photo

- Optional [Proposed]
- Tap area → `Take photo` / `Choose from library`
- One photo; preview after attaching, with replace and remove
- Resize to 2048px on the long edge before upload [Proposed]
- Implementation: `expo-image-picker` (capture, selection), `expo-image-manipulator` (resizing)

### D6. Button behaviour

| Button | Behaviour |
| --- | --- |
| `Submit` | Always enabled (defaults exist). Saves litter and photo → Impact card |
| `I didn't collect any this time` | Saves `liters: 0` → Impact card with litter left empty (E2) [Confirmed] |
| Back | Confirmation dialog `Leave without logging litter? You can add it later.` → leaving saves 0 L and goes Home; cancel keeps input |

### D7. API [Proposed]

`PUT /sessions/{id}/litter` (multipart)

```json
{ "fillRatio": 0.5, "bagSizeLiters": 15, "photo": "(file)" }
```

Response: `{ "liters": 7.5, "impactCardUrl": "https://...", "newBadges": ["streak_5"] }`

- If `newBadges` is present, show a badge-earned notice on the Impact card [Proposed]

### D8. Log or edit later [Confirmed]

| Item | Spec |
| --- | --- |
| Entry | `Log litter` (0 L) / `Edit litter` (logged) on session detail (F4); back from Impact card (E3) |
| Screen | Same Litter log screen, prefilled with existing values and photo. Title `Edit litter` [Proposed] |
| Save | Overwrites via the same API. Totals, chart, equivalents and bag icons update immediately |
| No-litter button | Shown as `Clear litter` in edit mode; resets to 0 L [Proposed] |
| Badges | Badges are based on streaks and distance, so editing litter has no effect |
| Time limit | None [Proposed] |

---

## Part E. Impact card

### E1. Structure

1. Dark green background
2. Header: back, `Impact card`, `Done` button
3. Card (E2)
4. Note: `You can find this card later in your plog history`
5. White bottom sheet: `Share to` buttons (E4)

### E2. Card content

| Element | Example | Data |
| --- | --- | --- |
| Date | 26 Aug 2026 | `startedAt`, `D Mon YYYY` |
| Text | You collected | Static |
| Litter amount | 7.5 L | `liters` |
| Text | Litter off the street | Static |
| Route map + photo | Photo overlapping the map | Map only, larger, if no photo [Proposed] |
| Place name | Around UTS | `placeName` |
| Metrics | 0:40 · 4.00 km · 234 m | Time · distance (2 decimals) · elevation gain |

- 0 L sessions also get an Impact card [Confirmed]. Same layout with the litter value left empty (`– L`). No photo, so map only. Shareable

### E3. Entry points and buttons

| Entry point | Back | Done |
| --- | --- | --- |
| Right after Litter log submit (including no litter) | Back to Litter log to edit, input kept [Confirmed]; resubmitting updates the card | Go to Home [Proposed] |
| Share button on session detail or My feed | Previous screen | Closes to previous screen |

### E4. Sharing

| Button | Behaviour |
| --- | --- |
| Instagram Story | Pass the card image to the Stories share screen via `react-native-share` (requires a Meta app ID). Hide if Instagram isn't installed [Proposed] |
| WhatsApp | Share card image + short text via `react-native-share`; fall back to the system share sheet if not installed [Proposed] |
| Telegram | Same as WhatsApp |
| Copy Link | Copy public card web page link + `Link copied` toast [Confirmed] |
| Download | Save to photo library via `expo-media-library` + `Saved to Photos` toast |

- Share image: capture the card component with `react-native-view-shot` at 1080 × 1920 (Stories ratio). Upload it and reuse it as the OG image for the public web page [Proposed]
- Share text example: `I picked up 7.5 L of litter with Plog 🌿` [Proposed]
- Public web page [Proposed]: `https://{domain}/c/{cardId}`. Read-only card page viewable without sign-in, including nickname and profile image. Set an OG image (the card image) for link previews. For privacy, mask about 200m around the start and end points on the map

---

## Part F. Session detail

### F1. Structure

1. Header: back, session title, share icon (→ Impact card, E3)
2. Route map
3. Metrics grid (2 columns × 2 rows)
4. Litter photo
5. Litter amount + `Log litter` / `Edit litter`
6. Bottom tab bar (`My` active)

Entry: tapping a session card in the My feed (G4.2).

### F2. Route map

- Route line + start and end markers, zoomed to fit the whole route
- Tap to open full-screen map (G4.5)

### F3. Metrics grid

| Position | Label | Example | Data |
| --- | --- | --- | --- |
| Row 1 | Distance | 7.6 km | `distanceKm` |
| Row 1 | Time | 10:04 | `durationSec` |
| Row 2 | Avg. pace | 6′02″ | `avgPaceSecPerKm` |
| Row 2 | Elev. gain | 20 m | `elevationGainM` |

- Heart rate and calories are out of MVP [Confirmed] → remove those cells from the design and lay out as 2 columns × 2 rows [Proposed]
- Use `Elev. gain` to match the finish sheet and Impact card [Proposed]

### F4. Photo and litter amount

- Hide the photo area if there is no photo
- Litter: `3.2L` + `Plogged` label (apply G3.2 → `3.2 L`)
- 0 L session: `0 L` + `Log litter` button / logged session: `Edit litter` text button → Litter log edit mode (D8) [Confirmed]

### F5. Delete session

Not provided [Confirmed]. Only `Discard` before saving (C4).

### F6. API [Proposed]

`GET /sessions/{id}` — G7.2 session item + `elevationGainM`, `routeId`
Route coordinates via `GET /sessions/{id}/route` (G7.3)

---

## Part G. My tab

Entry: bottom tab `My`. Where users review and share their cumulative impact and all plogging sessions. (Confirmed in v3.1; section numbers are now prefixed with `G`.)

### G1. Screen structure

#### ① My (tab root)

1. Header: `My` title (left), profile avatar (right)
2. Section: Your Impact — summary card
3. Section: Recent Plogs — search, sort, session feed (the only entry point to the full session list)
4. Bottom tab bar (fixed)

#### ② Your Impact (detail)

1. Header: back button, `Your Impact` title
2. Year selector
3. Stats card: litter collected + equivalents + monthly chart + plogging days + total distance
4. Section: Badges
5. Bottom tab bar (fixed)

> The Previous Plogs screen (list grouped by month) is **removed** [Confirmed]. Do not implement its button or route.

---

### G2. My — Header

| Element | Spec |
| --- | --- |
| Title | `My`, left-aligned |
| Avatar | Circular profile image, default image if none. **No tap action at this stage** [Confirmed] |
| Back button | None (tab root) [Confirmed] |

---

### G3. My — Your Impact summary card

| Element | Example | Data |
| --- | --- | --- |
| Label | Total Plogged | Static text |
| Main value | 37.5 L | `liters` (all time) |
| Equivalent 1 | 🗑 16% of a bin | Calculated (G3.1) |
| Equivalent 2 | 🍾 75 bottles | Calculated (G3.1) |
| Tap action | Whole card | Navigate to Your Impact detail |

[Proposed] Add a `›` icon at the top right of the card to signal that it is tappable.

#### G3.1 Conversion rules [Confirmed]

```
BOTTLE_VOLUME_L = 0.5     // 500ml plastic bottle
BIN_VOLUME_L    = 240     // Australian standard 240L wheelie bin

bottles = floor(liters / BOTTLE_VOLUME_L)
bins    = liters / BIN_VOLUME_L
```

- 240L is the standard wheelie bin size used by most Australian councils, and public-area bins are commonly 120–240L, so 240L is used as the reference.
- Keep constants in **configuration** rather than hardcoding (to support other countries later).

#### G3.2 Display rules [Confirmed]

| Condition | Format | Example |
| --- | --- | --- |
| Litter amount | 1 decimal place, omitted for whole numbers | 37.5 L, 15 L |
| bins < 1 | Percentage, rounded to integer | 16% of a bin |
| bins < 1 and rounds to 0% | Less than 1% | <1% of a bin |
| bins ≥ 1 | 1 decimal place | 2.3 bins |
| Thousands | Separator | 4,200 bottles |
| Singular/plural | Singular when 1 | 1 bottle, 1 bin |

- Check: 37.5 L → 75 bottles; 37.5 ÷ 240 = 15.6% → **16% of a bin**
- `9 Bins` and `4200 bottles` in the design are placeholder values and must be replaced
- The My summary card (all time) and Your Impact detail (selected year) **share the same formatting function**

---

### G4. My — Recent Plogs

#### G4.1 Search and sort [Confirmed]

| Element | Spec |
| --- | --- |
| Search field | Placeholder `Search sessions` |
| Search scope | Session title + place name (partial match, case-insensitive) |
| Search behaviour | [Proposed] 300ms debounce after input |
| Sort button | Tap to toggle `Most recent` (default) ↔ `Oldest` |
| Sort state | [Proposed] Show current sort name next to the button or as a toast |

#### G4.2 Session card

| Element | Example | Data |
| --- | --- | --- |
| Main photo | Litter photo | `photoUrl` |
| Route thumbnail | Map at bottom right of photo | `routeThumbnailUrl` |
| Expand icon | ↗↙ on thumbnail | Tap opens full-screen map (G4.5) [Confirmed] |
| Title | Saturday Afternoon Run | `title` (G4.4) |
| Date | 24/01/26 | `startedAt`, `DD/MM/YY`, in the session's time zone |
| Bag icons | 5 icons, filled | G4.3 |
| Litter amount | 22.5 L | `liters` |
| Distance | 7.6 km | `distanceKm`, 1 decimal place |
| Time | 10:04 | `durationSec` → `mm:ss`, `h:mm:ss` if 1 hour or more |
| Avg. pace | 6′02″ | `avgPaceSecPerKm` |
| Share button | Bottom right | Share screen for this session's Impact card |
| Card tap | Whole card | Session detail screen |

**Sessions without a photo** [Proposed]: Show the route map in the photo area at full size and hide the thumbnail.

**Sessions with no litter collected** [Confirmed]: Shown in the feed. All 5 bag icons empty, amount `0 L`. An Impact card exists, so the share button is shown (changed in v4.1, E2).

#### G4.3 Bag icon rules [Confirmed]

Icons are filled based on the **bag size (bagSizeLiters)** the user selected in the Litter log for that session.

```
filled = liters / bagSizeLiters          // 22.5 / 15 = 1.5

for i in 0..4:
  fill_i = clamp(filled - i, 0, 1)       // 1 = full, 0.5 = half, 0 = empty
```

- Partial fill is shown in the darker colour from the bottom of the icon up, by the fill ratio
- Always show the litter amount next to the icons (bag size varies by session, so icons alone can't be compared)
- When `filled > 5` [Confirmed]: fill all 5 icons and show `+N` text to the right of the last icon
  - `N = ceil(filled - 5)` [Proposed] — a partial bag counts as one (e.g. 90L with a 15L bag → 6 bags → `+1`; 97.5L → 6.5 bags → `+2`)
  - No `+N` when `filled` is exactly 5

#### G4.4 Title generation rules [Confirmed]

Auto-generated, **not editable by the user at this stage**. Format: `{Weekday} {Time of day} Run`

| Session start time (local) | Time of day |
| --- | --- |
| 05:00–11:59 | Morning |
| 12:00–16:59 | Afternoon |
| 17:00–20:59 | Evening |
| 21:00–04:59 | Late Night |

- Weekday and time of day use the session's stored `timezone`
- Time ranges are [Proposed] and can be adjusted
- The title is generated once by the server when the session is created and stored (it is a search target)
- Fix placeholder data in the design: 24/01/26 is a Saturday and 21/01/26 is a Wednesday

#### G4.5 Full-screen map [Confirmed]

| Item | Spec |
| --- | --- |
| Entry | Tap the route thumbnail (or ↗↙ icon) on a session card |
| Content | Session GPS route line + start/end markers, auto-zoomed to fit the whole route |
| Controls | Pinch to zoom, drag to pan |
| Close | Close (✕) button at top left, [Proposed] swipe down |
| Info | [Proposed] Session title, distance, and time summary at the bottom |
| Transition | [Proposed] Expand animation from the thumbnail |
| Data | Unlike the static list thumbnail, full route coordinates are needed → separate `GET /sessions/{id}/route` call |
| Loading/error | Show the thumbnail image dimmed while coordinates load; on failure show an error message + `Retry` |

#### G4.6 List loading

- Infinite scroll, 20 items per page [Proposed]
- With Previous Plogs removed, this feed serves as the full session history [Confirmed]

---

### G5. Your Impact (detail)

#### G5.1 Header and year selector

| Element | Spec |
| --- | --- |
| Back button | Return to My |
| Year selector | `2026 ⌄`, lists years with sessions plus the current year. Defaults to current year |
| On year change | All values in the card update |
| Badges | Independent of year, based on all time |

#### G5.2 Stats card

| Element | Example | Data (selected year) |
| --- | --- | --- |
| Label | Collected | Static |
| Main value | 37.5 L | `liters` |
| Sub-label | of litter | Static |
| Equivalents | 16% of a bin / 75 plastic bottles | G3.1–G3.2 |
| Monthly chart | G5.3 | `monthly[]` |
| Plogging days | Plogged 13 days | `ploggingDays` — number of dates in the year with at least one session [Confirmed] |
| Total distance | 45.2 km | `distanceKm` |

[Proposed] Change `Runned` → `Distance` and `Kilometers` → `km`.

#### G5.3 Monthly chart [Confirmed]

| Item | Spec |
| --- | --- |
| Type | Line chart with point markers, brand green |
| Metric | Litter collected per month (L) |
| Range | January–December of the selected year, **fixed at 12 months** |
| Past months with no data | 0 |
| Future months (current year) | [Proposed] Show X-axis labels only, no line or points |
| Y-axis | Right side, from 0 in 5 intervals; max is the data max rounded up to a clean number. If all 0, use 0–10 |
| X-axis labels | 12 labels are tight, so [Proposed] single letters `J F M A M J J A S O N D` |
| Interaction | [Proposed] Tap a point to show tooltip `May · 12.5 L` |

⚠️ Fix placeholder data so that the sum of monthly values equals the yearly total (currently monthly max is 100 vs a yearly total of 37.5 L).

#### G5.4 Badges [Confirmed]

| ID | Display name | Condition |
| --- | --- | --- |
| `streak_5` / `10` / `15` / `20` | 5 / 10 / 15 / 20-day streak | Reach N consecutive plogging days |
| `distance_1` / `5` / `10` / `15` | 1 / 5 / 10 / 15 km | Reach N km total distance (all time) |

**Streak rules**

- A day = local date in the session's time zone; the day counts if it has at least one session
- Missing a single day resets the current streak to 0
- If the streak was unbroken through yesterday, it stays active today until midnight even with no session yet
- [Proposed] Sessions with 0 L collected still count toward the streak (rewards participation itself)

**Badge retention rules**

- Once earned, a badge is **kept permanently** (not revoked if the streak resets; there is no session deletion, F5)
- Award checks run on the server when a session is saved, recording `achievedAt`

**Display**

- Earned: green icon + light green border + dark label / Not earned: grey
- [Proposed] `5 Streaks` → `5-day streak`; locked label contrast at WCAG AA or higher
- [Proposed] Tap to open a bottom sheet: condition, earned date or progress (`3 / 5 days`, `0.8 / 1 km`)
- ⚠️ Fix placeholder data: with 45.2 km total, all four distance badges should be earned

---

### G6. Bottom tab bar

| Tab | Destination |
| --- | --- |
| Home | Home |
| Plog | Start plogging |
| My | My (active: green + background pill) |

The tab bar is also shown on Your Impact detail, with `My` kept active.

---

### G7. Data / API [Proposed]

#### G7.1 Stats

`GET /users/me/impact?year=2026` (omit year for all time; `monthly` is then omitted)

```json
{
  "period": "2026",
  "liters": 37.5,
  "ploggingDays": 13,
  "distanceKm": 45.2,
  "currentStreak": 2,
  "monthly": [
    { "month": "2026-01", "liters": 37.5 },
    { "month": "2026-02", "liters": 0 }
  ],
  "availableYears": [2026],
  "badges": [
    {
      "id": "distance_1",
      "type": "distance",
      "label": "1 km",
      "threshold": 1,
      "progress": 45.2,
      "achieved": true,
      "achievedAt": "2026-01-21T20:12:00Z"
    }
  ]
}
```

- `monthly` always returns 12 items (0 for empty months)

#### G7.2 Session list

`GET /users/me/sessions?query=&sort=recent|oldest&cursor=&limit=20`

```json
{
  "items": [
    {
      "id": "s_123",
      "title": "Saturday Afternoon Run",
      "placeName": "Around UTS",
      "startedAt": "2026-01-24T04:30:00Z",
      "timezone": "Australia/Sydney",
      "distanceKm": 7.6,
      "durationSec": 604,
      "avgPaceSecPerKm": 362,
      "liters": 22.5,
      "bagSizeLiters": 15,
      "photoUrl": "https://...",
      "routeThumbnailUrl": "https://...",
      "impactCardUrl": "https://..."
    }
  ],
  "nextCursor": "..."
}
```

- `query` searches `title` and `placeName`
- `placeName` is generated by reverse geocoding when the session is saved, and stored
- Sessions with no litter: `liters: 0`, `bagSizeLiters: null`, `photoUrl: null`, `impactCardUrl` present
- Route thumbnails are generated server-side as static images

#### G7.3 Session route

`GET /sessions/{id}/route`

```json
{
  "points": [
    { "lat": -33.8832, "lng": 151.2005, "t": "2026-01-24T04:30:00Z" }
  ],
  "start": { "lat": -33.8832, "lng": 151.2005 },
  "end": { "lat": -33.8841, "lng": 151.2019 }
}
```

---

### G8. Screen states

| State | My | Your Impact |
| --- | --- | --- |
| Loading | Skeletons for summary card + feed | Skeletons for card, chart, badges |
| No sessions | Values at 0; guidance text + `Start plogging` button in place of the feed | Values at 0, all months 0 |
| No search results | `No sessions found` | — |
| No sessions in selected year | — | Values at 0, all months 0 |
| Error | Error message + `Retry` | Same |
| Refresh | Pull to refresh [Proposed] | Same |

---

### G9. Decisions (My tab)

#### Decided

| Item | Decision |
| --- | --- |
| Avatar action | Not implemented at this stage |
| Conversion basis | 500ml plastic bottle / 240L bin |
| Less than one bin | Percentage |
| Search scope | Title + place name |
| Sort | Most recent / Oldest |
| Sessions with no litter | Shown in feed |
| Bag icon basis | Per-session bag size |
| Session title | Auto-generated, not editable |
| Previous Plogs | Removed |
| Plogged N days | Cumulative days in the year |
| Chart range | Fixed 12 months |
| Streak | Resets after a missed day; badges kept permanently |
| Distance badges | Cumulative distance |
| Route thumbnail expand | Full-screen map |
| More than 5 bags | 5 full icons + `+N` |

#### Open items

None (My tab). Items marked **[Proposed]** will be implemented as proposed unless there are objections.

---

## Part H. Open decisions and placeholder data fixes

### H1. Decisions (v4.1)

| # | Item | Decision |
| --- | --- | --- |
| A1 | Account | Sign up with nickname + profile image; full sign-up/sign-in in v2 |
| B1 | Precipitation | Expected rainfall over the next 3 hours (recommendation) |
| B2 | Route data | Strava not allowed by its terms. Own database built from OpenRouteService and OSM (B5.1). Turnaround / One way chip filters |
| B3 | Route card tap | Start a Plog on that route (C7) |
| C1 | Plog idle screen | Tab bar shown; top-left is a re-centre button (recommendation) |
| C2 | Auto-pause | None, manual only |
| C3 | Minimum session | Under 1 minute or 0.1 km cannot be saved |
| C4 | Heart rate, calories | Out of MVP |
| D2 | After no litter | Go to Impact card with litter left empty |
| D3 | Log or edit later | Allowed (D8) |
| E1 | Back from Impact card | Allowed to edit in Litter log |
| E2 | Public link | Web page provided |
| F1 | Intermediate map markers | Mock image; ignore |
| F2 | Session deletion | Not provided |
| W1 | Platform | Expo (React Native) app + public card web page (0.5) |

### H1-1. Open items

| # | Question | Status |
| --- | --- | --- |
| D1 | `A few` ratio and input above one bag | On hold (levels 1–5 only) |
| R1 | B1 and C1 use the recommended approach. OK to confirm as is? | To confirm |

### H2. Placeholder data fixes

| Screen | Current | Issue | Fix |
| --- | --- | --- | --- |
| Finish sheet, Impact card | 0:40, 4.00 km | 4 km in 40 seconds is impossible | e.g. 40:00, 4.00 km |
| Session detail | 3.2L Plogged | Not achievable with bag size × level (D2) | e.g. 2.5 L (¼ × 10L) |
| My summary, detail | 9 Bins, 4200 bottles | Doesn't match 37.5 L | 16% of a bin, 75 bottles |
| Your Impact chart | Monthly max 100 | Exceeds yearly total of 37.5 L | Monthly sum = 37.5 |
| Your Impact badges | All distance badges locked | 45.2 km total should earn all | 4 distance badges earned |
| My feed | Friday / Monday | 24/01/26 is a Saturday; 21/01/26 is a Wednesday | Fix titles or dates |
| Session detail, feed | Several sessions at 7.6 km, 10:04 | Doesn't match 6′02″ pace (7.6 km in 10:04 ≈ 1′19″) | Consistent distance, time and pace |
