# Product Requirements Document (PRD) & UX Architecture
## Project: Private Couple Space — The Digital Home for Two

This document establishes the product definition, design language, system architecture, database schema, audio pipeline, and implementation roadmap for **Private Couple Space** — a premium, private digital sanctuary for a single couple.

> **Latest milestone:** Phase 8 — Birthday Experience (22-scene interactive celebration suite). See §7.

---

### 1. Product Requirements Document (PRD)

#### 1.1 Core Value Proposition
A private, non-social-media digital sanctuary for a single couple. It combines the utility of collaborative planning with emotional triggers (daily prompts, letters, shared memories, synced date-night roulette picks, real-time interactive games, and a handcrafted birthday celebration suite).

The visual language is intentionally **handmade** — treehouse, scrapbook, cozy, romantic, warm — never "social media". Every surface is designed for **two people**, not thousands.

#### 1.2 Persona Profiles & User Dynamics
*   **User A — Ger (☕, designer-engineer)**: Manages the codebase, curates the birthday content (photos, captions, letter lines), tunes the audio bus, ships every animation.
*   **User B — Nicola (🌸, the celebrant)**: Lives the experience. Posts letters, opens the gift, reacts to scrapbook moments. Minimal voice-input expectations.
*   **Couple dynamic**: Long-distance. The app must read as a **reunion artifact** at every encounter — every scroll, every tap, every notification should feel like receiving a postcard.

#### 1.3 Key Features List

##### Section 1 — Home Dashboard ("The Foyer")
- Core days-together counter + custom countdowns
- Current couple weather + daily forecast notification
- Daily quote generator + mood status selector (emoji grid + custom status)
- Music player (Spotify-style vinyl + remote sync + tab-aware seek)
- Activity log + presence heart-beat (15s interval)
- Special-date banner (anniversary / birthday auto-confetti)
- **🎁 Floating "Open Birthday Gift" trigger** (bottom-left, ribbon sticker style)
- View-transition dark-mode toggle with circle reveal

##### Section 2 — Memories ("Our Archive")
- **Couple Photobooth** — Life4Cuts style. Custom layouts (2-cut, 4-cut, 6-cut, film strip, polaroid). Filters (vintage, Kodak, disposable) + custom doodles + stickers. Auto-save to Memories Timeline.
- **Couple Journal** — Shared dairy timeline. Title, date, location, weather, mood, photo, tags, comments.
- **Memory Timeline** — Interactive milestone chronological log with reactions and comments.

##### Section 3 — Together ("The Heartbeat")
- **Live Letters** — Markdown rich envelopes. Schedule release date, send sealed, react with custom emojis, watch envelope-open animation.
- **Time Capsules** — Future-dated messages. Persisted in `rooms/timeCapsules`.
- **Live Status** — Real-time activity ("Studying", "Sleeping", "Gaming", "Coding") with cross-tab sync via Firestore.
- **Watch Together** — Simulated synchronized YouTube player (Play / Pause / Seek) + live emoji reaction bubbles. Cross-tab presence-aware (auto-pauses local Spotify when partner presses play).
- **Listen Together** — Animated Spotify-style player with vinyl rotation + progress sync + remote seek via `musicSeekTo` / `musicRemoteSeek` events.

##### Section 4 — Play ("Game Attic")
- **Mini Games** — Tic Tac Toe, Connect Four, Would You Rather, Truth or Dare, Spin the Wheel. Multiplayer via profile swap, scoreboard + fluid mechanics.
- **Sketch Canvas** — Real-time shared HTML5 canvas with brush size, color picker, shapes, text, undo/redo, and live partner cursors.

##### Section 5 — Date Night ("Date Night")
- **Date Night Roulette** — Shared random pick for LDR couples. FNV-1a lock-step sync (no third-party RNG). Frame-by-frame reel animation is **deterministic** derivated from `startedAt`.
- **Four Categories**: 🎬 Movie (10 picks), 💬 Deep Talk (10 prompts), 📖 Bedtime Chapter (10 cozy retro-chapters), 👨‍🍳 Cook Together (10 same-recipe-different-kitchen recipes).
- **24h Pick Durability** — Last pick locks for 24h, then slot reopens for the next night.

##### Section 6 — Birthday Experience (Phase 8, latest) ✨
Hand-built celebration suite for Nicola. See §7 for full spec.

##### Section 7 — Settings & Workshop ("Workshop")
- Instant theme switching (Minimal White, Korean Cafe, Sakura, Studio Ghibli, Pixel Retro, Night, Coffee, Pastel, Valentine, Christmas).
- Profile name inputs, database reset, dev sandbox URL helper.

> **Retired features** (Phase 6 cleanup): Virtual Garden (XP/level/plantType system), daily missions, stats dashboard charts, DreamBoard bucket-list widget, Interactive Terrarium. Only `gardenPlant` + `waterLevel` fields remain in `useEngagementState.ts` for cosmetic flair.

---

### 2. Information Architecture & Navigation

The application uses an **Apple-inspired Floating Dock** of six `treehouse rooms`. Each room has a name, subtitle, and tone-cued icon. Active tab uses `layoutId="activeDockBubble"` for a smooth shared-layout animation.

```
                                  [ OUR LITTLE UNIVERSE ]
+-----------------------------------------------------------------------------------------+
|               [G&N_logo]   Our Little Universe        [Ger ☕] ♥ [Nicola 🌸]            |
|                                            A private place where our memories live     |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
|  THE FOYER       OUR ARCHIVE     THE HEARTBEAT    GAME ATTIC      DATE NIGHT   WORKSHOP|
|  (Home)          (Memories)      (Together)       (Play)          (Adventure)  (Settings)|
|  - Days          - Photobooth    - Live Letters   - Games         - Roulette   - Themes  |
|  - Countdowns    - Journal       - Time Capsules  - Canvas        - 4 buckets  - DB reset|
|  - Quote         - Timeline      - Status         - Spin Wheel    - 24h lock   - Sandbox|
|  - Music         - Birthday Gift - Watch/Listen   - Quiz          - Lock-step  - Profile|
|  - 🎁 Present    - 16 postcards  - Spotify sync                                          |
+-----------------------------------------------------------------------------------------+
|                       [   FLOATING DOCK NAVIGATION   ]                                   |
|                       [Home] [Memories] [Together] [Play] [Date Night] [Settings]        |
|                       ↳ keyboard: Arrow keys cycle rooms, Escape closes surprises         |
+--------+-------------------------------------------------------------------------+-------+
| 🎁 Open Birthday Gift                                                          | 🌓 Dark |
| (bottom-left, ribbon sticker)                                                  | (br-ctr)|
+--------------------------------------------------------------------------------+--------+
```

**Keyboard Navigation:** Arrow Left/Right cycles dock tabs (skips inputs/textareas/selects). Escape closes the active surprise overlay or birthday experience.

---

### 3. User Flow

```
1. Visit App -> 2. Auth (Firebase) -> 3. Onboarding -> 4. Land on Home ("The Foyer")
   |
   +--> [Home]   Read weather, change mood, listen to Spotify collaboratively
   |            -> Tap 🎁 Open Birthday Gift to start the celebration suite
   |
   +--> [Memories]  Photobooth -> Save 4-cut to timeline
   |                 Journal (write + tag + mood)
   |                 Memory Timeline (react + comment)
   |
   +--> [Together]  Write Live Letter -> Schedule seal opening -> Switch profile -> Open inbox
   |                 Watch Together -> One partner hits Play, both screens mirror
   |                 Listen Together -> Pause / scrub / see partner's Spotify in real-time
   |
   +--> [Play]  Play Tic Tac Toe -> Switch profile to take partner's turn
   |           Draw on Sketch Canvas
   |
   +--> [Date Night]  Spin Tonight! -> Both clients see the same FNV-1a-derived pick
   |                  (Movie / Deep Talk / Bedtime Chapter / Cook Together) for 24h
   |
   +--> [Birthday Experience]  Click 🎁 "Open Birthday Gift"
                              -> 22 scenes unfold (cake -> hero -> scrapbook ->
                                 16 postcards -> map -> seal -> ending)
                              -> Replay anytime via "Send it again" button
```

**Dev Test Path:** `/?sandbox=Nicola` (or `/?sandbox=AnyName`) opens the Birthday Experience directly, bypassing auth + CoupleProvider. Rendered outside the normal app tree; tree-shaken from production builds.

---

### 4. Database & Storage Schema (LocalStorage + Firestore)

#### 4.1 `profiles` (slot-managed via partner-email config)
- `id`: `"user_a"` | `"user_b"`
- `name`: `string`
- `avatar`: `string`
- `mood`: `string` (happy / cozy / sleepy / studying / ...)
- `status`: `string` (free text — "Drinking Coffee", "Coding", ...)
- `xp`: `number`
- `level`: `number`
- `lastActive`: `number` (epoch ms — drives heart-beat presence detection with 45s online window)

#### 4.2 `memories`
- `id`, `type` (`"photobooth"` | `"milestone"` | `"birthday_card"`), `title`, `description`, `imageUrl`, `date` (ISO), `creatorId`, `reactions` (`{ [emoji]: count }`), `comments` (`Comment[]`)

#### 4.3 `journals`
- `id`, `title`, `description`, `date`, `location`, `weather`, `mood`, `imageUrl`, `tags[]`

#### 4.4 `letters`
- `id`, `senderId`, `recipientId`, `title`, `content` (markdown), `scheduledFor` (ISO), `isOpened`, `reactions[]`, `createdAt`

#### 4.5 `timeCapsules`
- `id`, `senderId`, `openDate`, `message`, `isOpened`, `createdAt`
- Lives at `rooms/timeCapsules` (singleton — the future-dated reveal)

#### 4.6 `rooms/date_night_roulette` (singleton)
- `spinId` (UUID; FNV-1a lock-step seed), `spunBy`, `selectedCategory`, `startedAt`, `expiresAt` (epoch ms; 24h after `startedAt`)

#### 4.7 `rooms/watch_room` (sync state)
- `videoId`, `isPlaying`, `currentTimeMs`, `partnerAction` — drives Watch Together's simulated YouTube iframe

#### 4.8 `settings/shared_song` (music sync)
- `videoId`, `progress_ms`, `synced_at`, `_clientTabId`, `_clientWriteTs`
- Tab-stamp pattern with `latencyTracker.tabWriteTs("music:shared_song")` for cross-tab write→display measurement

#### 4.9 `birthdayVault` (FUTURE — Phase 9)
- Per-year archived birthday experience snapshots (`{ year, scenes, recipientName, completedAt }`)

> *Note:* the `garden` collection (`xp`, `level`, `plantType`, `waterLevel`, `lastInteracted`) was retired alongside the XP/missions system in favor of the Date Night Roulette feature (Phase 6). The `gardenPlant` + `waterLevel` state in `useEngagementState.ts` remain purely for visual flair on the Home Dashboard.

---

### 5. UI Component Hierarchy

```
src/
├── App.tsx                          (routing, dock, theme wrapper, sandbox gate, view-transition dark mode)
├── main.tsx                         (Vite entry)
├── firebaseClient.ts                (lazy SDK loader)
├── components/
│   ├── HomeView.tsx                 (Foyer: weather, music, countdowns, birthday trigger card)
│   ├── MemoriesView.tsx             (Archive: photobooth, journal, timeline)
│   ├── TogetherView.tsx             (Heartbeat: letters, watch, listen, status)
│   ├── PlayView.tsx                 (Game Attic: mini-games + sketch canvas)
│   ├── AdventureView.tsx            (Date Night: roulette)
│   ├── SettingsView.tsx             (Workshop: themes + dev)
│   ├── LoginView / OnboardingView   (auth flow)
│   ├── home/                        (Daily Vibe Vinyl, Weather, Music Player)
│   ├── memories/                    (Photobooth, Scrapbook Canvas, Story Section)
│   ├── together/                    (LettersPanel, StatusPanel, WatchPanel)
│   ├── emotional/                   (Confetti, WeatherBadge, TimeGreeting, GratitudePrompt)
│   ├── scrapbook/                   (OpenBookSpread, PolaroidFrame, ScrapbookStickers)
│   ├── game/                        (SketchCanvas, SpinDare, TicTacToe, WouldYouRather)
│   ├── ui/                          (shadcn primitives: button, popover, calendar, sonner)
│   ├── common/                      (ErrorBoundary, OptimizedImage, LazyImage)
│   ├── admin/                       (AdminCrudConsole — dev-only)
│   └── dev/                         (LatencyOverlay — opt-in via ?latencyOverlay=1)
├── context/
│   ├── CoupleContext.tsx            (split into 5 sub-hooks: useAuthState, useContentState,
│   │                                 useEngagementState, useProfileState, useSettingsState)
│   └── defaults.ts
├── experiences/                     (NEW — Phase 8 modular suite architecture)
│   ├── core/                        (reusable presentation engines for future celebrations)
│   │   ├── PresentationEngine.tsx   (auto-advance, replay, jumpTo, scene routing)
│   │   ├── ExperienceOverlay.tsx    (focus-trap modal, Escape handler, body scroll-lock)
│   │   ├── ExperienceNavigation.tsx (floating prev/skip/next buttons)
│   │   ├── ExperienceProgress.tsx   (heart-glyph progress bar, top-center)
│   │   ├── ExperienceMusic.tsx      (headless component wiring bgmController)
│   │   ├── SceneTransition.tsx      (5 variants: fade, slide, cinematic, paper, flip)
│   │   ├── bgmController.ts         (Web Audio leapfrog crossfade; 4s inaudible loop)
│   │   ├── audioAmplitude.ts        (singleton bus → useAudioAmplitude hook, 80ms throttle)
│   │   ├── vinylRotation.ts         (singleton bus → useVinylRotation, 64ms throttle,
│   │   │                             33⅓ RPM = 200°/sec)
│   │   ├── sceneJump.ts             (pure resolveJumpTo helper for engine + tests)
│   │   └── __tests__/               (5 Vitest suites — 28 tests, audio stub nm-via-stub)
│   └── birthday/                    (the Nicola celebration suite)
│       ├── BirthdayExperience.tsx   (orchestrator: SCENE_COMPONENT_MAP, replay key-remount)
│       ├── BirthdayTrigger.tsx      (useBirthdayTrigger hook + BirthdayReplayButton CTA)
│       ├── SandboxPage.tsx          (DEV-only login-free birthday experience)
│       ├── birthday.types.ts        (22-scene id types, 16-variant postcard types)
│       ├── birthday.data.ts         (BIRTHDAY_CONTENT, BIRTHDAY_PHOTO_VARIANTS,
│       │                             BIRTHDAY_SCENES, BIRTHDAY_CITY_PIN_POSITIONS,
│       │                             BIRTHDAY_PHOTO_CAPTIONS, BIRTHDAY_BGM_SRC)
│       ├── birthday.constants.ts    (BIRTHDAY_BADGE, openingLine, letterSignOff,
│       │                             endingBadge, cityFooter, memoryFooter,
│       │                             CELEBRATION_ACCENT)
│       ├── birthday.utils.ts        (isBirthdayToday, hasFiredToday, markFiredToday)
│       ├── scenes/                  (8 unique scene archetypes)
│       │   ├── GiftOpeningScene.tsx (alias CakeCuttingScene — 3-tap cake + 16 candles)
│       │   ├── IntroScene.tsx       (Postcard delivery, NICOLA char-by-char reveal)
│       │   ├── ScrapbookScene.tsx   (Long handwritten letter on two-column postcard)
│       │   ├── PhotoSlide.tsx       (Single template × 16 postcard variants)
│       │   ├── CityMapScene.tsx     (16 heart-pins, fantasy-atlas SVG, jumpTo reverse-nav)
│       │   ├── ClosingSealScene.tsx (Wax seal drop beat + auto-advance)
│       │   └── EndingScene.tsx      (Final postcard + Replay (Send it again) + Finish)
│       ├── svg/Decorations.tsx      (30+ inline SVG motifs — washi, wax, stamp,
│       │                             balloons, petals, postmarks, sparkles, cake)
│       └── __tests__/               (birthdayScenes shape invariant: 22 scenes,
│                                      16 photos, 16 city pins)
├── hooks/                          (useCamera, useTimeOfDay)
├── lib/                            (haptics, utils)
└── utils/                          (gameUtils, latencyTracker, stickerThemes, weather)
```

---

### 6. Audio Architecture (NEW — Phase 8)

The BGM story is real Web Audio engineering, not `<audio loop>` (which clicks at the loop boundary).

**`bgmController.ts`** — P3 leapfrog crossfade loop:
- On arm (first user gesture): `fetch(src) -> arrayBuffer -> decodeAudioData -> 1 AudioBuffer`
- 2 `GainNode`s + 2 `AudioBufferSourceNode`s cycle in leapfrog with 4s crossfade window
- Loop boundary is **inaudible**. Effectively infinite playback.

**Per-scene volume config:** `BIRTHDAY_SCENES[id].bgmVolume` in [0..1]. `bgmController.setVolume(value)` clamps + cancels scheduled ramps + ramps **both** gains in parallel (verified by Vitest `bgmController.test.ts`).

**`audioAmplitude.ts`** — singleton bus:
- bgmController publishes mean byte-frequency / 255 every rAF
- Throttle 80ms + delta gate 0.005 → ~12.5fps subject re-renders
- `useAudioAmplitude()` returns value, returns `0` when `prefers-reduced-motion`

**`vinylRotation.ts`** — singleton bus:
- bgmController publishes `cumulativeTime * 200` (33⅓ RPM = 200°/sec) gated by `isPlayingRef.current`
- 64ms throttle (~16fps, matches VinylDisc CSS transition window)
- Disc naturally freezes when BGM paused, resumes from current angle on resume
- `getCurrentRotation()` for test introspection

**Per-scene audio hooks:** Scenes use `useAudioAmplitude()` to pulse BGM-reactive decoration (cake hint copy in GiftOpeningScene, IntroScene skip button, ScrapbookScene hint, ClosingSealScene wax seal, EndingScene petals, etc.). `useVinylRotation()` drives a VinylDisc in GiftOpeningScene's corner.

---

### 7. Birthday Experience (NEW — Phase 8) ✨

**Concept:** Hand-crafted scrapbook celebration, NOT a slideshow. User clicks `Open Birthday Gift` and enters a fullscreen interactive presentation. Built to feel like entering a hand-made vintage-postcard exhibition, not "a birthday modal". Built for years — `experiences/core/` is reusable for future celebrations (anniversaries, milestones), `experiences/birthday/` is one instance of that core.

**Trigger:**
- 🎁 `BirthdayReplayButton` (bottom-left of Foyer, ribbon sticker style) → opens `useBirthdayTrigger().open`
- Optional auto-fire on Nicola's birthday via `autoFireOnBirthday: true` (with localStorage-flag dedupe)
- Dev-only sandbox `?sandbox=Nicola` (or `?sandbox=AnyName`) bypasses auth + opens directly

**22-Scene Arc** (`BIRTHDAY_SCENES` order = 1..22):
1. `gift-open` — **Cake cutting celebration.** 3 taps dim candles (1.0→0.7→0.35→0 with puff-jitter). Confetti burst + auto-advance on 3rd tap.
2. `hero` — Cinematic NICOLA reveal. Char-by-char type-in animation over an arriving postcard. Auto-advances after 7s with skip button.
3. `scrapbook` — Long handwritten letter on two-column postcard (left = letter, right = stamp + address + postmark). Tap anywhere to advance.
4-10. `photo-1..7` — Postcard FRONT/BACK variants (pattern: F-F-B-F-B-F-F). Mid-journey through Indonesia. Per-photo variants are independent (`captionRotation`, `kenBurns`, `hueTint`, `borderStyle`, `ephemera`, `decoration`, `aspect`).
11. `map` — Atlas of memories. 16 heart-pins on fantasy-atlas SVG (hand-curated `BIRTHDAY_CITY_PIN_POSITIONS`). Tap any pin → reverse-nav to that postcard. Auto-advances after 8s.
12-20. `photo-8..16` — Continuation through Manila → Singapore → KL → Bangkok → Tokyo → Osaka → Kyoto → Jakarta finale. Pattern: F-B-F-F-B-B-F-F-B-F.
21. `seal-close` — Wax seal drops from top, "For Nicola" h2 fades, "sealed with love — today and always ✿". Auto-advance 4s.
22. `ending` — Final postcard with `endingMessage` + recipient name with heart outlines + drifting petals. Two buttons: **"Send it again"** (replay — remount engine via `replayCount` state bump) and **"Finish"** (close).

**Architecture (scalable for future celebrations):**
- `src/experiences/core/*` — reusable presentation engines, agnostic to which celebration they're rendering.
- `src/experiences/birthday/*` — the Nicola suite. Plugs into the core engines via `BirthdayExperience.tsx` (SCENE_COMPONENT_MAP + per-scene meta injection for the 16 PhotoSlide variants).
- Future anniversary suite would live at `src/experiences/anniversary/*` and reuse the same core.

**Personalization:**
- `BIRTHDAY_CONTENT` — recipientName, heroSubtitle, heroText, letterLines (5 lines in Indonesian), scrapbookQuote, endingMessage.
- `BIRTHDAY_PHOTO_VARIANTS[16]` — per-slide postcard config (city, date, rotation, decoration, caption, kenBurns, hueTint, border, aspect).
- `BIRTHDAY_PHOTO_CAPTIONS` — 16 handwritten memory notes, one per photo, anchored to that postcard's city.
- `BIRTHDAY_CITY_PIN_POSITIONS[16]` — hand-curated `{x, y}` pin positions on the 800×500 atlas SVG.
- Sandbox override: `?sandbox=<name>` swaps recipientName end-to-end (UI chrome + dialog aria-label + letter + ending).

**Design Language (celebration-locked, not letter-y):**
- Palette: warm cream paper (`#fbf3df → #f0e0bf → #e8d4a6`) + deep brown ink (`#5b3a32`, `#3a2511`).
- Celebration accent `#c1476b` (CELEBRATION_ACCENT) injected as `var(--cel-accent)`.
- Celebration tokens: pink `#F8C8DC`, mint `#A8E6CF`, yellow `#FFE066`, gold `#FFC857`, lavender `#C5B7DA`, coral `#FF8DA1`.
- Typography: `font-serif` (Playfair), `font-handwrite`, `font-mono`, bold uppercase ribbons with tracking `[0.4em..0.5em]`.
- Motif library: washi tapes (5 colors × 2 patterns), wax seals, vintage stamps (5 motifs × 4 inks), postmarks with `<textPath>` city+date arcs, paperclips, safety pins, hanging threads, coffee stains (4 rotation variants), petals, sparkles, balloons, confetti.

**Centralized Constants** (`birthday.constants.ts`):
- `BIRTHDAY_BADGE.UPPER` (`🎂 HAPPY BIRTHDAY! 🎂`)
- `BIRTHDAY_BADGE.TITLE` (`🎂 Happy Birthday! 🎂`)
- `CELEBRATION_ACCENT` (`#c1476b`) — injected as CSS custom property `--cel-accent` on `ExperienceOverlay`
- `openingLine(name)` → `"Today we celebrate you, Nicola ✿"` (was the condolence-letter `"Dearest Nicola — every mile between us is a postcard waiting to be sent."`)
- `letterSignOff(name)` → `"— Make a wish, Nicola! 🎂"` (was `"— Yours, always. ✦"`)
- `endingBadge(name)` → `"🎂 HAPPY BIRTHDAY NICOLA! 🎂"`
- `cityFooter(city)` / `memoryFooter(dateStamp)` — return empty string for absent input so callers don't pre-filter

**Accessibility:**
- `role="region"` + `aria-label` on every scene
- `role="button"` + `tabIndex` + Enter/Space on every tappable element (cake, photo slides, map pins, replay, finish)
- `Escape` closes the experience (ExperienceOverlay handler)
- `prefers-reduced-motion` collapses to 0.18s opacity-fade across all engines
- Photo `<motion.img alt={caption}>` — alt text resolves to BIRTHDAY_PHOTO_CAPTIONS for screen-readers
- Body scroll-lock (`document.body.style.overflow = "hidden"`) while open
- `e2e/a11y.spec.ts` exercises gift-open / hero / scrapbook / photo-1 + reduced-motion variant

---

### 8. Development Sandbox (NEW — Phase 8)

The Sandbox URL bypass lets test engineers + the developer open the Birthday Experience **without** standing up the Firebase emulator stack.

- **`http://localhost:5173/?sandbox`** — auto-opens the experience with default content.
- **`http://localhost:5173/?sandbox=Name`** — auto-opens with `<Name>` swapped in for `recipientName` end-to-end.
- **`http://localhost:5173/?latencyOverlay=1`** — opt-in dev HUD for `latencyTracker` writes.

**Production safety:**
- Both `SandboxPage` lazy import + App.tsx sandbox branch are gated by `import.meta.env.DEV`. Production build emits no sandbox code (tree-shaken by Vite/Rollup).
- Sandbox renders OUTSIDE the `CoupleProvider` tree → production auth flow (LoginView, OnboardingView, Firebase auth) is never touched.

---

### 9. Testing & Quality Assurance (NEW)

**Unit tests** (`vitest`):
- 5 suites, **28 tests** in `src/experiences/core/__tests__/` + `src/experiences/birthday/__tests__/`
- `bgmController.test.ts` (6) — clamp, cancel-then-ramp ordering per gain, dual-gain parallelism, no-op when no arm, no-op when disabled, no-arm branch
- `vinylRotation.test.ts` (4) — subscribe-seeds, publish, wrap values via `getCurrentRotation()`, same-value broadcast dedup
- `audioAmplitude.test.ts` (4) — subscribe-seeds, publish, delta gate ≤0.005, hook finite
- `sceneJump.test.ts` (5) — forward direction, backward, unknown-id null, same-index, pin → photo-1 reverse-nav
- `birthdayScenes.test.ts` (7) — length === 22, map at index 10, lead-in/closing order, orders 1..22 sequential, 16 unique photos sequentially, `BIRTHDAY_CITY_PIN_POSITIONS` = 16 within 0..100
- Hand-rolled `MockAudioContext` stub at `src/test-utils/stubs/AudioContextStub.ts` (records `{method, time, value}` history, installs matchMedia + rAF polyfills)
- Config: `vitest.config.ts` (jsdom env, globals, alias `@`), `vitest.setup.ts`

**A11y e2e** (`@axe-core/playwright`):
- `e2e/a11y.spec.ts` — decoupled from Firebase fixtures. Walks gift-open / hero / scrapbook / photo-1 with axe scans asserting NO critical/serious violations + reduced-motion variant via `browser.newContext({reducedMotion: "reduce"})`.

**E2E suites** (`playwright`):
- `e2e/brain.spec.ts`, `music.spec.ts`, `sketch.spec.ts`, `watch.spec.ts` — use the Firebase emulator via `VITE_USE_FIREBASE_EMULATOR=true` + `npm run dev:test`.

**Commands:**
| | |
|---|---|
| `npm test` | Vitest unit tests |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright e2e |
| `npm run test:e2e:headed` / `test:e2e:debug` / `test:e2e:ui` | variants |
| `npm run emulator:start` | firebase emulators (auth + firestore + database) |
| `npm run emulator:exec` | emulators + one-shot exec |
| `npm run lint` | `tsc --noEmit` |
| `npm run clean` | `rm -rf dist server.js` |

---

### 10. Implementation Roadmap

1.  **Phase 1** — Base Architecture. Tailwind config, Google Fonts imports, TypeScript types, the `CoupleContext` provider.
2.  **Phase 2** — Home Dashboard with beautiful micro-interactions + multi-profile simulation.
3.  **Phase 3** — Life4Cuts Photobooth, Shared Journal, Interactive Memories Timeline.
4.  **Phase 4** — Live Letters + Status Sync + Watch Together + Listen Together simulators.
5.  **Phase 5** — Mini Games + infinite collaborative Drawing Canvas.
6.  **Phase 6** — Date Night Roulette (FNV-1a lock-step sync, 4 category chips, decaying slot-machine reel, 24h pick durability, idle-state pedagogy).
7.  **Phase 7** — Floating Dock redesign (6 rooms, role tablist, view-transition dark mode, mood picker popover, music remote-seek cross-tab sync). Sandbox URL helper.
8.  **Phase 8** — **Birthday Experience** (current). 22-scene suite. Audio architecture (leapfrog crossfade loop, audioAmplitude + vinylRotation buses). Celebration copy centralized in `birthday.constants.ts` (no drift). Sandbox dev bypass. Vitest unit suite. A11y e2e.
    - **Retired:** (none for now — candidate for future trim: `useConfetti`, `WeatherBadge`, `ForecastNotification`, complex `PhotoCollageScene`).
    - **Survives:** existing dock + date-night roulette + memories flows.
9.  **Phase 9 (planned)** — Annual Replay Vault (Phase 8 leave-behind). Persist last completed run keyed by year. "Memory Vault" entry on Foyer. Save-as-PDF poster artifact. Haptic feedback integration. Sound-effect layer on cake blow-out.

---

## Appendix A — Key Architectural Decisions

- **Lazy-loading**: Every view (`HomeView`, `MemoriesView`, `TogetherView`, `PlayView`, `AdventureView`, `SettingsView`) is React.lazy-loaded. `BirthdayExperienceLazy` and `SandboxPageLazy` keep birthday chunk out of prod initial bundle.
- **Code-splitting**: `CoupleContext` is split into 5 separate sub-hooks (`useAuthState`, `useContentState`, `useEngagementState`, `useProfileState`, `useSettingsState`) so unrelated state reads don't trigger global re-renders.
- **Slot-managed access control**: Partner email is config-driven via Firestore rules. Admin can rotate slots without code changes.
- **Error boundaries**: Every view wrapped in `ErrorBoundary` so a single broken view doesn't kill the whole app.
- **View Transitions**: Dark-mode toggle uses the CSS View Transitions API for a circle-blur reveal. Falls back to instant toggle on unsupported browsers.
- **Lenis smooth scroll**: Globally initialized in App.tsx for buttery-scroll on long memories/timeline pages. Auto-cleaned on unmount.
- **Haptics**: `lib/haptics.ts` exposes `triggerHaptic("light"|"medium"|"success")` on tappable moments. Silently no-op when `navigator.vibrate` is absent.
- **Augmented backgrounds**: Solid gradients in CSS + paper-grain SVG `<feTurbulence>` noise for premium tactile feel (used in scrapbook pages + birthday postcard overlays).
- **Latency sidecar**: `utils/latencyTracker.ts` records write→display latency for `settings/shared_song` writes without coupling the tracker into `CoupleContext`. Opt-in via `?latencyOverlay=1`.

## Appendix B — Design Tokens

- **Paper**: `#fbf3df` / `#f0e0bf` / `#e8d4a6` (used in birthday suite).
- **Ink**: `#5b3a32` (mid), `#3a2511` (deep), `#7d5a36` (sub-accent).
- **Celebration accent**: `#c1476b` (HDR ribbon), pale pair `#F8C8DC` (balloon/petal fill).
- **Tunable theme tokens** (settings-driven): `var(--bg-gradient)`, `var(--bg-texture)`, `var(--fabric-cream)`, `var(--wood-oak)`, `var(--wood-walnut)`, `var(--primary)`, `var(--text-main)`, `var(--text-muted)`.

## Appendix C — Glossary

- **FNV-1a lock-step** — A non-cryptographic 32-bit hash used to derive both clients' roulette pick from a shared `spinId`. Pair of clients never needs to communicate mid-spin; result is reproducible.
- **Leapfrog crossfade** — Two BGM players take turns leading, with a 4s overlap window where one fades out as the other fades in. Loop boundary inaudible.
- **`replayCount` state bump** — React `key` reset trick: bumping a state counter and using it as `<PresentationEngine key={replayCount}>` remounts the entire experience from index 0 with cleanly-reset timers + BGM.
