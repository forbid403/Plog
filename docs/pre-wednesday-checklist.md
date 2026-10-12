# Pre-purchase checklist — before buying Apple/Google dev accounts

Written 2026-10-12. Goal: buy Apple Developer Program + Google Play Console
on **Wednesday (2026-10-14)** and be able to move straight into submission —
everything that doesn't require those paid accounts should already be done
by then.

Full post-purchase steps live in `docs/release-checklist.md` — this file is
just the "what can happen before the money moves" subset, reordered by
urgency.

⚠️ **Reality check**: Google Play requires a new personal account to run a
**closed test with 12+ testers for 14 consecutive days** before production
release. Starting that Wednesday means the earliest possible production
release is **2026-10-28**. Buy the Play Console account Wednesday regardless
— the clock only starts once it exists, so delaying the purchase delays
everything after it.

## Code work (no account needed)

- [ ] Account deletion (DB rows + storage files + auth user) — **blocker**,
      Apple 5.1.1(v) and Google both require it for an app with accounts;
      not in the spec yet, needs designing from scratch
- [ ] Background location: in-app Prominent Disclosure screen before the
      permission prompt (Google review requirement)
- [ ] Confirm `android.targetSdkVersion` meets Play's current minimum
- [ ] Verify Impact card Download works on Android 13+ with the scoped-down
      `expo-media-library` permissions (`granularPermissions: []`)
- [ ] Remove dev `console.log`/`console.error` and placeholder debug copy
- [ ] Lock MVP scope — confirm Copy Link / Instagram Story stay hidden on
      the Impact card share sheet (already done) rather than half-finished

## Design assets (no account needed)

- [ ] Real app icon + Android adaptive icon + splash screen (currently the
      Expo template defaults)
- [ ] Store screenshots — 6.9" iPhone size, Android phone size (can shoot
      now, upload later once the store listings exist)
- [ ] Play feature graphic (1024×500) + 512px icon

## Free external services (separate from the paid store accounts)

- [ ] Google Maps API key for Android — issued via **Google Cloud
      Console**, free, unrelated to the $25 Play Console fee; restrict to
      the package name + release SHA-1 once issued
- [ ] Meta App ID — only if keeping Instagram Story sharing; free Facebook
      Developer account

## Content/copy (no account needed)

- [ ] Privacy policy page (free host — Notion, GitHub Pages, etc.)
- [ ] Support URL / page
- [ ] Draft App Store / Play review notes: anonymous sign-in means no demo
      account needed; explain why background location recording is needed
      and how to test it
- [ ] Draft store listing copy: description, keywords, promotional text

## Testing (no account needed)

- [ ] Full real-device run, 1+ iOS + 1+ Android: record → pause → finish →
      Litter log → Impact card → share
- [ ] First real Android run — only tested in the iOS Simulator so far
- [ ] Force-quit mid-recording → confirm the session recovers on relaunch
- [ ] Offline behavior (session save failure path)
- [ ] Boundary cases: minimum session (<1 min / <0.1 km), 0 L session,
      location permission denied

## Can go ahead and build now (Android only)

- [ ] `eas build` for Android **can** be signed and built without a Play
      Console account — EAS manages its own keystore. Get this built and
      sitting ready so Wednesday is just "create app → upload" instead of
      "create app → wait for a build"
- [ ] iOS production builds are blocked until Wednesday — code signing
      needs an active Apple Developer membership, EAS build will fail
      without it

---

## Blocked until the accounts exist (Wednesday)

- [ ] Apple Developer Program enrollment ($99/yr)
- [ ] Google Play Console enrollment ($25 one-off) — **do this first**,
      starts the 14-day closed-test clock
- [ ] App Store Connect: create the app record
- [ ] Google Play: create the app, start closed testing
- [ ] iOS production build signing (needs Apple cert/profile)
- [ ] App Privacy labels (App Store) / Data safety form (Play) — filled out
      inside each console, can't be prepared outside it
- [ ] Content rating questionnaire, age rating
- [ ] Upload store listings (screenshots, descriptions — content from above
      is ready, just needs the listing to exist first)
- [ ] Location permission declarations + demo video upload (Play Console)
