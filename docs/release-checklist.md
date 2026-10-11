# Release checklist — App Store / Google Play

Written 2026-10-11 from the repo's state at the time. Re-check the "Blockers
found in this repo" table before relying on it — items may have been fixed.

## Blockers found in this repo

| # | Issue | Evidence |
|---|---|---|
| 1 | **App icon is the Expo default** | `assets/icon.png` is the Expo template image; Android adaptive icon background `#E6F4FE` is the template default too |
| 2 | **No account deletion** | Accounts are created (anonymous sign-in + profile), so Apple (5.1.1(v)) and Google both require in-app account deletion. Not in the spec either |
| 3 | **No Android Google Maps key** | Wired (2026-10-11): `app.config.ts` reads `GOOGLE_MAPS_ANDROID_API_KEY` — the key itself still needs issuing and setting in `.env` / EAS env vars |
| 4 | ~~No Android package name~~ | Fixed: `com.soniabbb.plog` (hyphens aren't allowed; iOS stays `com.sonia-bbb.plog`) |
| 5 | **EAS config** | `eas.json` added; still need `eas init` (Expo login, writes the project ID) |
| 6 | **Backend is local-only** | Supabase points at `127.0.0.1`; no hosted project linked |
| 7 | ~~iPad support on~~ | Fixed: `supportsTablet: false` |
| 8 | ~~Photo location leak risk~~ | Fixed: every upload (litter photo, avatar) is re-encoded first (`src/lib/photo-upload.ts`), which strips EXIF |
| 9 | **Android never run** | Open in `docs/todo-plog-session.md` (C3.1); background location not tested on a real device either |
| 10 | **Unfinished features** | Copy Link and Instagram Story are hidden on the Impact card share sheet. Still open: Session detail (F), save-failure retry |

## 1. Accounts and prerequisites

- [ ] Apple Developer Program (US$99/yr)
- [ ] Google Play Console (US$25 one-off)
- [ ] ⚠️ New **personal** Play accounts must run a **closed test with 12+ testers for 14 days** before production — start this early
- [ ] Google Maps API key for Android (restrict to package name + SHA-1)
- [ ] Meta App ID (if keeping Instagram Story sharing)
- [ ] Privacy policy URL and Support URL (both stores require them)

## 2. Backend (Supabase)

- [ ] Create hosted project → `supabase link` → `supabase db push` (migrations)
- [ ] Production `EXPO_PUBLIC_SUPABASE_URL` / anon key as EAS environment variables
- [ ] Re-verify RLS on the production DB (no cross-user read/write)
- [ ] Anonymous sign-in abuse protection (Supabase CAPTCHA / rate limits)
- [ ] Account deletion: DB rows + storage files + auth user (blocker #2)
- [x] Strip EXIF before upload — always re-encode the photo (blocker #8)

## 3. App config (`app.json` / EAS)

- [x] Write `eas.json` (development / preview / production profiles)
- [ ] `eas init` (needs Expo login)
- [x] Set `android.package` — can't change after release
- [x] `ios.config.usesNonExemptEncryption: false` (skips export compliance question)
- [x] Versioning: EAS `autoIncrement` for build number / versionCode
- [ ] Replace icon, adaptive icon and splash with real designs (blocker #1)
- [x] Decide `supportsTablet` (blocker #7) — `false`
- [x] Permission strings: camera / photo library set via the `expo-image-picker` plugin; microphone permission disabled (unused)
- [ ] Android photo permissions: check whether `expo-media-library` adds `READ_MEDIA_IMAGES`. Play policy can reject it if photo access isn't core — block it with `blockedPermissions` if unneeded
- [ ] Confirm the build meets Play's required targetSdk (API level)

## 4. Background location (biggest review risk)

- [ ] **Google**: in-app Prominent Disclosure screen before requesting background location; location permissions declaration form in Play Console (needs a demo **video link**); foreground service type (location) declaration
- [ ] **Apple**: review notes explaining why the route must keep recording with the screen off, and how to test it; request "Always" only when needed (spec 0.4: on first Start)
- [ ] Test background-permission-denied behaviour on a real device (open in todo)

## 5. Feature completeness and QA

- [ ] Lock MVP scope: finish or hide unfinished features (blocker #10) — Copy Link / Instagram Story hidden
- [ ] Real devices (1+ iOS, 1+ Android): record → pause → finish → Litter log → Impact card → share; force-quit recovery; offline behaviour
- [ ] First full Android run (blocker #9)
- [ ] Boundary cases: minimum session, 0 L session, permission denied (CLAUDE.md testing list)
- [ ] Decide on crash reporting (e.g. Sentry) — optional, useful after first release
- [ ] Clean up dev `console.log` / `console.error` and debug copy

## 6. App Store Connect

- [ ] Create app record (bundle ID, category Health & Fitness)
- [ ] **App Privacy labels**: precise location, photos, user content, user ID, nickname
- [ ] Age rating questionnaire
- [ ] Screenshots: 6.9" iPhone required (+ iPad if supported)
- [ ] Description, keywords, promotional text, Support URL, Privacy policy URL
- [ ] Review notes: anonymous sign-in, so no demo account needed; how to test background location
- [ ] TestFlight internal → external (needs beta review) → submit

## 7. Google Play Console

- [ ] Create app, use Play App Signing (EAS manages the upload key)
- [ ] **Data safety form**: location, photos, user ID — plus a data deletion URL
- [ ] Content rating questionnaire, target audience, ads declaration
- [ ] Location / foreground service permission declarations (section 4)
- [ ] Store listing: 512px icon, 1024×500 feature graphic, phone screenshots
- [ ] Internal testing → closed testing (12 testers / 14 days) → production
- [ ] Release countries: decide whether to start with Australia only

## 8. After release

- [ ] EAS Update for JS-only fixes (spec 0.5 [Proposed])
- [ ] Monitor crashes and reviews

## Suggested order

1. Sign up for both stores and start the 14-day closed test clock — it's the longest lead time
2. Fix blockers #1–6 and #8
3. Android real-device testing
4. Store listings
5. Background location video + declarations
