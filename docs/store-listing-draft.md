# Store listing copy — draft

Written 2026-10-12. Pulls tone/voice from the onboarding slides
(`app/onboarding.tsx`) and spec Part 0/E. Flag anything that needs
legal/marketing review before submitting — this is a first draft, not final
copy.

## App name

**Plog** (both stores, same as the bundle display name)

## Subtitle / short description

- **App Store subtitle** (30 char limit): `Run. Pick up litter. Repeat.`
  (28 chars — reuses the onboarding slide 1 title verbatim)
- **Play short description** (80 char limit): `Plogging made simple — run, collect litter, and track your impact.` (69 chars)

## Promotional text (App Store only, 170 char limit, editable without a new build)

> Every run is a chance to clean up your neighbourhood. Record your route,
> log what you collected, and watch your impact add up — one plog at a time.

(159 chars)

## Full description

```
Plogging is picking up litter while you run, jog, or walk — and Plog makes
it effortless to track.

RECORD YOUR ROUTE
Start a session and Plog tracks your run in the background, even with your
screen off. Pause anytime you stop to pick something up — plogging means
frequent stops, so Plog never auto-pauses on you.

LOG YOUR IMPACT
After each session, log how much litter you collected — a quick size +
fullness estimate, no counting required. Add a photo if you want to show
off your haul.

SHARE YOUR IMPACT CARD
Every session becomes a shareable Impact card: your route, your litres
collected, your time and distance. Share it to Instagram, WhatsApp, or
Telegram, or save it to your photos.

BUILD A STREAK
Keep plogging day after day and watch your streak grow on your Home
screen — miss a day and it resets, so every plog counts.

Plog is built for anyone who wants their regular run, jog, or walk to leave
the world a little cleaner.
```

## Keywords (App Store, 100 char limit, comma-separated, no spaces after commas)

```
plogging,litter,running,jogging,walking,cleanup,fitness,environment,eco,route tracking
```

(Rough count ~88 chars — trim if App Store Connect flags it over. Research
actual keyword competition/volume before finalizing; this is a plausible
first pass, not keyword-research-backed.)

## Category

- **App Store**: Health & Fitness (primary); consider Lifestyle as secondary
- **Play**: Health & Fitness

## Support URL / Privacy policy URL

Not drafted here — these need real hosted pages (see
`docs/pre-wednesday-checklist.md`), not just copy.

## Review notes (both stores)

```
Plog uses anonymous sign-in — there is no email/password account, so no
demo login is needed. Tapping "Skip it for now" on the profile setup
screen also works without entering a nickname.

To test the core flow: open the Plog tab, tap Start, walk around (or use
simulated location), tap the bottom sheet handle to expand/collapse it,
tap Pause/Resume, then "Finish & Log litter" to see the litter-logging and
Impact card screens.

Location: the app requests only "while in use" location permission, never
"Always"/background location. Recording continues with the screen off via
[iOS: a background mode / Android: a foreground service with a persistent
notification] while an explicitly user-started session is in progress —
this does not involve passive background tracking outside an active
session.
```

## What's NOT ready for submission yet (don't list these as working features)

(Updated 2026-10-15 — Home, My tab, Your Impact and Session detail have
since been built; only these two remain genuinely unbuilt/hidden.)

- Public card web page / Copy Link sharing — not built (E4, deferred),
  hidden on the Impact card share sheet
- Instagram Story direct share — hidden on the share sheet (no Meta App
  ID configured), falls back to the generic share sheet only if re-enabled

Everything else in the description above is now shippable: recording,
litter logging, Impact card sharing (system share sheet / WhatsApp /
Telegram), Home with streak + weekly strip, My tab with session history
and Your Impact, session detail. Streaks are now live on Home (current
streak, flame icon colour reflects alive/at-0) and can be mentioned as a
feature.
