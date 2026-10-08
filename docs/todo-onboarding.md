# TODO — Onboarding (Part A) — done except editable-later / Android

Owner: first-launch flow (slides → profile setup → Home). Discovered as a
hard blocker 2026-10-08: `createSession` (C6) needs a signed-in user, and
nothing in the app had ever called `signUp()` (`src/api/auth.ts`, already
built) — there was no path to a signed-in state at all, so every screen
past C4's "Finish & Log litter" failed with "No signed-in user".

Spec source: `docs/spec.md` Part A — but the real design (Figma, Plog
Design node 685:2741/685:2750/685:2772, given directly 2026-10-08)
overrides spec text where they differ, same as every other screen in this
app. Two real differences:

- **No A3 (location permission primer)** — confirmed directly there isn't
  one in the design. Location permission is requested wherever it's
  actually needed instead (already built: `useCurrentLocation`, used by
  the Plog idle screen).
- **A "Skip it for now" link exists** on profile setup that spec's A4
  table doesn't mention — followed the design (see A4 below).

## A1-A2. Slides — done (`app/onboarding.tsx`)

Figma: node 685:2741 ("Onboarding - 3") / 685:2750 ("Onboarding - 4").

- [x] Two full-screen slides, background photo (downloaded from Figma,
      resized/recompressed — `assets/onboarding/slide{1,2}.jpg`) + dark
      overlay, green `Plog` logo top-left (Afacad font, see below), 3-dot
      indicator (the 3rd dot represents the sign-up step, which isn't
      part of this screen's own swipeable pager — confirmed directly)
- [x] Slide 1: `Run. Pick up litter. Repeat.` / body copy / `Continue`
      (glass/translucent) → slide 2
- [x] Slide 2: `See your impact.` / body copy / `Get Started` (green) →
      `/onboarding-profile`
- [x] Swipe left/right also navigates — horizontal paging `ScrollView`
- [x] No Skip button on the slides themselves [Confirmed, per design]
- [x] Shown once on first launch only — `src/lib/onboardingStorage.ts`,
      flag in `expo-secure-store` (device-level, not account-level, so a
      reinstall shows it again even if Supabase session data somehow
      persisted)
- [x] Afacad font (logo + large titles — Figma uses this instead of SF
      Pro for display type here) — `@expo-google-fonts/afacad` +
      `expo-font`, loaded in `app/_layout.tsx` with the splash screen
      held (`expo-splash-screen`) until ready, so onboarding never
      flashes a fallback system font

## A4. Profile setup (sign-up) — done (`app/onboarding-profile.tsx`)

Figma: node 685:2772 ("Sign-up") — title is literally `Set your profile`
(not spec's proposed `Set up your profile`), save button is `Save` (not
`Continue`).

- [x] Title `Set your profile`, Avatar (reused `size="large"` component,
      92px in Figma vs the component's existing 80px — minor pre-existing
      inconsistency, not chased), tap → `Take photo` / `Choose from
      library` (same picker pattern as Litter log's photo area)
- [x] Nickname: required, 2-20 chars, trimmed. Duplicates allowed
      [Proposed] — not a login identifier. Input shows "Nickname" as a
      placeholder only (no separate label, no required asterisk — matches
      the design, not spec's text description)
- [x] `Save`: enabled once nickname is valid → `signUp(nickname,
      avatarUri?)` → marks onboarding complete → Home
- [x] `Skip it for now`: **not in spec**, but in the design — signs up
      with a generated nickname (`Plogger####`) and no avatar instead of
      literally skipping sign-up (a `sessions` row always needs a
      `profiles` row via FK, so *some* account has to exist)
- [x] Error: on failure, Alert + keep input, allow retry
- [ ] Avatar used in Home/My header avatars, public card web page (E4) —
      not editable later (out of MVP scope, per spec) — not verified yet,
      those screens don't exist

### Account handling (`src/api/auth.ts`, already built before this)

- [x] `signUp()`: anonymous sign-in + `profiles` row insert, token via
      `expo-secure-store`
- [x] `getMyProfile()`, `signOut()` exist, unused until something calls
      them (My tab, presumably)

## Routing — done

- [x] `app/(tabs)/index.tsx` (Home) checks `hasCompletedOnboarding()` on
      mount and `router.replace('/onboarding')` if not done. Home is this
      app's actual entry point (no separate root index route — `(tabs)`
      is a group, its own `index.tsx` already resolves to `/`), so gating
      lives there rather than in a new top-level route
- [ ] Home briefly mounts (renders `null`) before the redirect fires —
      acceptable flash for now, not a real splash-screen-driven gate

## Bug found and fixed along the way

`Button`'s and `ButtonRound`'s `variant="glass"` rendered an **empty**
pill/circle — no text/icon — caught via screenshot on the slide's
Continue button. Root cause: `BlurView` and the `Pressable` inside it
were both `flex:1` with nothing else establishing a size, so the Text
content had no resolvable box. Fixed in both components: the Pressable
now gets the real size directly (`sizeStyle`/`containerStyle`), BlurView
is an absolutely-filled backdrop layer instead of a flex ancestor — same
shape `BottomNavigation`'s (already working) glass bar uses. This also
silently fixes Impact card's "Done" button, which had the identical bug
and had never been visually verified.

## Why this mattered

Every screen built so far that writes to Supabase (`createSession`,
`updateLitter`) assumes `supabase.auth.getSession()` already has a user.
Before this, testing C6/D7/E required a manual workaround — now the real
flow produces one.
