# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**Plog** — a plogging app (picking up litter while running or walking). Users record a session with GPS, log how much litter they collected, and share an impact card. Market: Australia (metric units, `DD/MM/YY` dates, English UI).

The full screen specification lives in `docs/spec.md` (English). **The spec is the source of truth for product behaviour.** Section numbers below (`G3.2`, `C5`, …) refer to it. If the code and the spec disagree, say so rather than silently following either one.

## Stack

- **App:** Expo (React Native) + TypeScript, iOS and Android
- **Navigation:** Expo Router (file-based, `app/`). Tab bar visibility (0.3) is handled by which route group a screen lives in — `app/(tabs)/` gets the floating `BottomNavigation`; push screens that must hide it (Plog recording, Litter log, Impact card, …) outside that group.
- **Maps:** `react-native-maps`
- **Location:** `expo-location` + `expo-task-manager` (background), points buffered in `expo-sqlite`
- **Media:** `expo-image-picker`, `expo-image-manipulator`, `expo-media-library`, `react-native-view-shot`
- **Sharing:** `react-native-share`
- **Auth/storage:** Supabase (anonymous sign-in), token in `expo-secure-store`
- **Public card page:** separate web app (Next.js), shares types and formatters with the app

## Commands

```bash
npm start              # Expo dev server
npm run ios            # dev build, iOS
npm run android        # dev build, Android
npm test               # Jest
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
```

Background location does **not** work in Expo Go — use a development build.

## Domain rules that must not drift

These are decided and appear in several screens. Implement them once in `src/lib/` and import everywhere; never re-derive them inline.

```ts
BOTTLE_VOLUME_L = 0.5    // 500ml bottle
BIN_VOLUME_L    = 240    // Australian 240L bin
bottles = Math.floor(liters / BOTTLE_VOLUME_L)
bins    = liters / BIN_VOLUME_L          // < 1 → percentage, e.g. "16% of a bin"
liters  = round(fillRatio * bagSizeLiters, 1)
```

- **Formatting (G0.2, G3.2):** litres 1 decimal, dropped when whole (`15 L`, `37.5 L`); distance 1 decimal in lists and detail, 2 while recording and on cards (`4.00`); time `mm:ss` / `h:mm:ss`; pace `m′ss″`; singular/plural (`1 bin`, `1 day`).
- **Time zone:** session dates, weekdays and streak days use the session's stored `timezone`, never the device's.
- **Session title (G4.4):** auto-generated `{Weekday} {Morning|Afternoon|Evening|Late Night} Run`, generated server-side once, not user-editable.
- **Streaks (G5.4):** a missed day resets to 0; today stays alive until midnight; earned badges are permanent. Distance badges use cumulative distance.
- **No auto-pause (C3):** users stop constantly to pick up litter. Time excludes manual pauses only.
- **Minimum session (C4):** under 1 minute or under 0.1 km cannot be saved.
- **0 L sessions are real sessions:** they appear in the feed, get an Impact card with the litter value left empty, and can be shared.

## Design tokens

`design-tokens/tokens.json` is the design system — synced from Figma via Tokens Studio (DTCG format). **It is the only source of colour, spacing, shadow and typography values.** No exceptions:

- Never hard-code a hex colour, px/dp spacing number, font size, weight, or shadow in component code. If a value isn't in `design-tokens/tokens.json`, it doesn't exist yet — flag it and ask, don't invent or approximate one.
- `src/theme/tokens.ts` is **generated** from `design-tokens/tokens.json` by `design-tokens/build-theme.py` (stdlib only, no deps) — same names, same values, no drift. **Never hand-edit `src/theme/tokens.ts`.** Edit `tokens.json` (re-export from Tokens Studio) and rerun `python3 design-tokens/build-theme.py` in the same change; import from it via `src/theme` (barrel export) in components.
- Token groups: `Color.*` (GreyScale, Pink, Purple, Blue, Green, Yellow, Orange, Red, Opacity, Base, Brand.Primary/Secondary), `Number Scale.2's.*` (spacing/sizing, 2–999), `Shadow_Strong/Emphasize/Normal`, and typography composites (`Headline`, `Caption`, `Titles.*`, `Body.*`, `Label.*`) which already bundle font family/weight/size/line-height — use the composite (`typography.titles.large`, etc.), don't reassemble it from primitives. `shadows.*` gives raw Figma layers (`x`/`y`/`blur`/`spread`/`color`); RN only renders one shadow layer natively, so a shadow-wrapper component will need to pick/approximate — that's implementation work, not a token concern.

### CSS (public card page / any web surface)

`design-tokens/tokens.css` is generated from `tokens.json` by `design-tokens/build-css.py` (stdlib only, no deps). **It is a build artifact — never hand-edit it**; edit `tokens.json` (re-export from Tokens Studio) and rerun `python3 design-tokens/build-css.py`.

- Colours, spacing, and shadows are CSS custom properties on `:root` — e.g. `var(--color-brand-primary-500)`, `var(--spacing-m)`, `box-shadow: var(--shadow-normal)`.
- Typography composites are utility classes, not vars — e.g. `.text-headline`, `.text-titles-large`, `.text-body-base-bold`, `.text-label-default`. Apply the class rather than assembling `font-*` properties by hand.
- The Next.js public card page imports `design-tokens/tokens.css` once (e.g. in its root layout/`globals.css` via `@import`) — don't copy values into component-level CSS.

## Conventions

- TypeScript strict; no `any` in committed code.
- Files: components `PascalCase.tsx`, hooks `useThing.ts`, utilities `kebab-case.ts`.
- Keep formatters, conversions and calculations in `src/lib/`, pure and unit-tested. UI components render values, they don't compute them.
- API calls go through `src/api/`; no `fetch` inside components.
- Reuse the tokens in `src/theme/` rather than hard-coding colours or spacing — see **Design tokens** above for where those values come from.
- User-facing copy is English, taken verbatim from the spec (`Finding GPS…`, `This session is too short to save.`, …). Don't invent alternative wording — if a string is missing from the spec, flag it.

## Testing

- Unit-test everything in `src/lib/`, especially boundaries: 0 L, `<1%` bins, 0.99 → 1.0 km badge, 1:00 / 0.10 km minimum session, midnight and week boundaries.
- E2E flows with Maestro under `e2e/`.
- For GPS work: iOS Simulator location simulation (City Run) or GPX playback in the Android emulator — don't require a real walk to verify.

## Scope: do what was asked, nothing more

**Do exactly the task given. No over-engineering, no under-engineering.**

- Implement the requested change and stop. Don't refactor neighbouring code, rename things, reorganise folders, add comments to untouched code, or "improve" anything that wasn't part of the task.
- No speculative generality: no abstractions, config options, feature flags, hooks or wrapper layers for a second use case that doesn't exist yet. Two call sites are not a framework.
- No unrequested extras: no extra screens, animations, error-boundary layers, caching, analytics, or dependencies that the task didn't call for.
- Under-engineering is equally wrong: don't skip the error and empty states, boundary cases, time-zone handling, or loading states that the spec defines for the thing you are building. "It works on the happy path" is not done.
- Match the existing patterns in the codebase rather than introducing a new one for the same problem.
- If the task seems to need work beyond its scope (a missing helper, a spec conflict, a real bug next door), say so and ask — don't silently expand the change.
- When finished, report what changed and what you deliberately left alone.

## Working style here

- Read the relevant spec section before implementing a screen; quote the section number in the PR description.
- Ask before deciding anything the spec marks **[TBD]** or **on hold** — currently: the `A few` ratio and input above one bag (D1).
- Items marked **[제안] / [Proposed]** are implementation suggestions, not commitments: follow them by default, but raise it if the code makes a better option obvious.
- Prefer small, reviewable changes: one screen or one lib module at a time.
- Don't add dependencies for things Expo already covers, and don't upgrade the Expo SDK as a side effect of another task.

### Known token gap

`BottomNavigation`'s Figma `Glass_Button` effect has a drop-shadow (`0px 0px 10px 0px #0000001a`) that isn't in `design-tokens/tokens.json` — none of `Shadow_Strong/Emphasize/Normal` match it. `src/components/BottomNavigation.tsx` currently approximates it with `shadows.normal[1]` (product decision, 2026-09-28). If this shadow gets added to Figma/Tokens Studio as its own token, re-export `tokens.json`, regenerate, and switch `BottomNavigation` to the real token.