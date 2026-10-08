# TODO — Onboarding (Part A)

Owner: first-launch flow (slides → permission primer → profile setup →
Home). Discovered as a hard blocker 2026-10-08: `createSession` (C6) needs
a signed-in user, and nothing in the app has ever called `signUp()`
(`src/api/auth.ts`, already built) — there is currently no path to a
signed-in state at all, so every screen past C4's "Finish & Log litter"
fails with "No signed-in user".

Spec source: `docs/spec.md` Part A.

## A1-A2. Slides

- [ ] Two full-screen slides, background photo + dark overlay, green
      `Plog` logo top-left, page indicator top (longer bar = current slide)
- [ ] Slide 1: `Run. Pick up litter. Repeat.` / body copy / `Continue`
      (translucent) → slide 2
- [ ] Slide 2: `See your impact.` / body copy / `Get Started` (green) →
      A3 → A4 → Home
- [ ] Swipe left/right also navigates [Proposed]
- [ ] No Skip button [Confirmed, per design]
- [ ] Shown once on first launch only — completion flag stored on-device
      (not account-level; reinstall shows it again)

## A3. Location permission primer [Proposed]

- [ ] Short primer screen explaining why location is needed, then the
      system permission prompt
- [ ] Denied → still go to Home (weather card replaced by a permission
      prompt card; re-asked when entering the Plog tab — check B2's actual
      behavior here once Home exists)

## A4. Profile setup (sign-up) [Confirmed]

No Figma design for this screen — layout is [Proposed], spec gives the
elements only.

- [ ] Title `Set up your profile` [Proposed]
- [ ] Profile image: circular, tap → `Take photo` / `Choose from library`
      (same picker pattern as Litter log's photo area). Optional, default
      avatar if none
- [ ] Nickname: required, 2-20 chars, trimmed. Duplicates allowed
      [Proposed] — not a login identifier
- [ ] `Continue`: enabled once nickname is valid → calls
      `signUp(nickname, avatarUri?)` (already built, `src/api/auth.ts`) →
      Home
- [ ] Error: on failure, show a message, keep input, allow retry (don't
      clear the form)
- [ ] Avatar used in: Home/My header avatars, public card web page (E4) —
      not editable later (out of MVP scope, per spec)

### Account handling (already built, `src/api/auth.ts`)

- [x] `signUp()`: anonymous sign-in (`supabase.auth.signInAnonymously()`)
      if no session, then inserts the `profiles` row. Token persisted via
      `expo-secure-store` (supabase-js's own session storage, wired in
      `src/api/supabase.ts`)
- [x] `getMyProfile()`, `signOut()` also already exist, unused until
      something calls them (My tab, presumably)

## Routing

- [ ] Nothing gates entry into `(tabs)` on sign-up completion yet —
      `app/_layout.tsx` has no onboarding route at all. Needs: an
      onboarding route (outside the `(tabs)` group, matches spec 0.3's
      "Onboarding, profile setup... Hidden" tab bar rule), an on-device
      "has completed onboarding" flag (AsyncStorage/SecureStore — distinct
      from the auth session itself, since A2 says it's shown again after
      reinstall regardless of account state), and a root redirect: no
      flag → onboarding; flag but no session → shouldn't normally happen
      post-A4, but worth a fallback

## Why this matters now

Every screen built so far that writes to Supabase (`createSession`,
`updateLitter`) assumes `supabase.auth.getSession()` already has a user.
Until this part exists, testing C6/D7/E requires a manual workaround (see
git history / ask in-session) — not a substitute for building this for
real.
