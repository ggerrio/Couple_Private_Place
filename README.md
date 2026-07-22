# 🌸 Private Couple Space

> A premium digital sanctuary for two — built so every tap feels like receiving a postcard from the person you love.

A private, non-social-media web app for a long-distance couple (Ger ☕ and Nicola 🌸). It blends collaborative planning (days-together counters, countdowns, shared playlists, real-time status) with emotional artifacts (live letters, time capsules, synced date-night roulette, hand-crafted scrapbook celebration).

The design language is **treehouse, scrapbook, cozy, romantic, warm** — never "social media". Every animation is intentional.

---

## ✨ Highlights

- 🎁 **Birthday Experience** — a 22-scene interactive postcard celebration suite for Nicola. Hand-built per slide (no two scenes alike), 16 unique photo variants, audio-reactive decoration, full keyboard a11y.
- 🎲 **Date Night Roulette** — FNV-1a lock-step sync. Both clients spin simultaneously and land on the **same pick** without exchanging messages. 24h pick durability.
- ✉️ **Live Letters + Time Capsules** — Markdown rich envelopes with seal-open animations, future-dated reveals.
- 🎬 **Watch Together + Listen Together** — Simulated synchronized YouTube player + Spotify-style visual player with cross-tab presence-aware pause.
- 🎮 **Sketch Canvas + Mini-games** — HTML5 real-time shared doodle + Tic Tac Toe / Truth or Dare / Spin-the-Wheel.
- 📸 **Couple Photobooth** — Life4Cuts style with filters, doodles, stickers, polaroid layouts.

---

## 🧱 Tech Stack

- **Framework**: React 19 + Vite 6 + TypeScript 5.8
- **Styling**: TailwindCSS v4 + Framer Motion (motion/react) + shadcn-style primitives
- **State**: Context (modular: `useAuthState`, `useContentState`, `useEngagementState`, `useProfileState`, `useSettingsState`)
- **Storage**: Firebase (Auth + Firestore + Realtime Database) via lazy-loaded SDK
- **Testing**: Vitest + @testing-library/react + @axe-core/playwright + jsdom
- **Audio**: Pure Web Audio API (leapfrog crossfade loop, no `<audio loop>`)
- **Iconography**: lucide-react + ~30 inline SVG decorations built specifically for the scrapbook aesthetic
- **Smooth scroll**: Lenis

---

## 🚀 Quickstart

```bash
# 1. Install dependencies (use bun or npm — bun is faster)
bun install      # or: npm install

# 2a. Run the full experience (production-style, real Firebase)
npm run dev       # http://localhost:3000

# 2b. OR run against Firebase emulator + dev-mode anon login
npm run emulator:start        # in another shell — auth+firestore+database emulator
npm run dev:test              # VITE_USE_FIREBASE_EMULATOR=true on :5173

# 3. Build for production
npm run build
npm run preview
```

### 🎁 Sandbox shortcut (no auth, no emulator)

Skip the login screen entirely — open the **Birthday Experience** directly:

```
http://localhost:5173/?sandbox              → default recipientName (Nicola)
http://localhost:5173/?sandbox=AnyName     → override recipientName end-to-end
http://localhost:5173/?latencyOverlay=1    → opt-in dev HUD for Firestore write latency
```

`?sandbox` is gated by `import.meta.env.DEV` so **production builds tree-shake the entire sandbox branch away** — no runtime cost, no security risk.

---

## 🧪 Testing

| | |
|---|---|
| `npm test` | Vitest unit tests (5 suites — bgmController, vinylRotation, audioAmplitude, sceneJump, birthdayScenes) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright e2e (brain / music / sketch / watch specs) |
| `npm run test:e2e:headed` / `debug` / `ui` | step-through variants |
| `npm run lint` | `tsc --noEmit` |

For a11y sweep on the birthday experience, run the **decoupled** a11y spec (uses the sandbox URL — no Firebase emulator needed):

```
npm run dev
npx playwright test e2e/a11y.spec.ts
```

---

## 🗂 Project Structure

```
src/
├── App.tsx                 routing, dock, theme, view-transition dark mode, sandbox gate
├── experiences/            modular celebration suite architecture
│   ├── core/               reusable presentation engines
│   │   ├── PresentationEngine.tsx
│   │   ├── ExperienceOverlay.tsx
│   │   ├── ExperienceNavigation.tsx
│   │   ├── ExperienceProgress.tsx
│   │   ├── ExperienceMusic.tsx
│   │   ├── SceneTransition.tsx
│   │   ├── bgmController.ts         leapfrog crossfade
│   │   ├── audioAmplitude.ts        → useAudioAmplitude
│   │   ├── vinylRotation.ts         → useVinylRotation
│   │   └── sceneJump.ts             pure resolveJumpTo helper
│   └── birthday/           Nicola's celebration suite (the highlight feature)
│       ├── BirthdayExperience.tsx
│       ├── BirthdayTrigger.tsx
│       ├── SandboxPage.tsx
│       ├── birthday.types.ts
│       ├── birthday.data.ts         BIRTHDAY_CONTENT, BIRTHDAY_SCENES, photo variants
│       ├── birthday.constants.ts    BIRTHDAY_BADGE, CELEBRATION_ACCENT, helpers
│       ├── birthday.utils.ts
│       ├── scenes/                  8 unique archetypes (one template × 16 photos)
│       └── svg/Decorations.tsx      ~30 inline decorative SVGs
├── components/             view components per treehouse room
│   ├── HomeView / MemoriesView / TogetherView / PlayView / AdventureView / SettingsView
│   ├── home/ memories/ together/ emotional/ scrapbook/ game/ admin/ dev/ ui/ common/
├── context/CoupleContext.tsx        split into 5 sub-hooks
├── hooks/ lib/ utils/               haptics, latencyTracker, weather, stickerThemes
└── firebaseClient.ts                lazy SDK loader
```

---

## 🎁 Birthday Experience (the highlight feature)

> Open the app → click 🎁 **"Open Birthday Gift"** at the bottom-left → enter a 22-scene interactive celebration:

1. **Cake cutting** (3 breaths → candles out → confetti burst)
2. **NICOLA reveal** (postcard delivery, character-by-character)
3. **Long handwritten letter** (Indonesian scrapbook-style, two-column postcard)
4-10. **7 unique postcards** (Jakarta → Bandung → Yogyakarta → Bali → Semarang → Malang → Bogor)
11. **Atlas of memories** (16 heart-pins, reverse-navigable)
12-20. **9 more postcards** (Surabaya → Manila → Singapore → KL → Bangkok → Tokyo → Osaka → Kyoto → Jakarta finale)
21. **Wax seal close**
22. **Final postcard + Replay / Finish**

All `🎂 HAPPY BIRTHDAY! 🎂` badges flow from `BIRTHDAY_BADGE` constants in `birthday.constants.ts` — no drift across scenes. The letter sign-off (`— Make a wish, Nicola! 🎂`) and opening line (`Today we celebrate you, Nicola ✿`) read as celebration, not condolence.

To customize for another celebrant, just edit `BIRTHDAY_CONTENT.recipientName` (or use `?sandbox=AnyName` for one-off testing).

---

## 🔧 Development Notes

- **Lazy-loading**: every view is React.lazy-loaded. Birthday and Sandbox chunks stay out of the prod initial bundle.
- **Code-splitting**: `CoupleContext` is split into 5 sub-hooks — unrelated state reads don't trigger global re-renders.
- **Audio**: bgmController uses real Web Audio API with a leapfrog crossfade between two `AudioBufferSourceNode`s (4s overlap window) — the loop boundary is genuinely inaudible.
- **Per-scene volumes**: `BIRTHDAY_SCENES[id].bgmVolume` maps each scene to its own target gain (cake 0.35 → letter 0.65 → postcards 0.72 → ending 0.5).
- **Audio-reactive decoration**: `useAudioAmplitude()` and `useVinylRotation()` are singleton buses — scenes subscribe once, never poll.
- **Replay model**: bumping a `replayCount` state and using it as `<PresentationEngine key={replayCount}>` remounts the entire experience from index 0 — BGM restarts, gift-open replays, all timers reset.
- **Haptics**: tap-tactile confirmation via `lib/haptics.ts` (calls `navigator.vibrate(...)` on tappable moments; silently no-op when API absent).
- **View Transitions**: dark-mode toggle uses the CSS View Transitions API for a circle-blur reveal. Graceful fallback on unsupported browsers.

---

## 📦 Scripts

```jsonc
{
  "dev":                 "vite --port=3000 --host=0.0.0.0",
  "dev:test":            "cross-env VITE_USE_FIREBASE_EMULATOR=true vite --port=5173",
  "build":               "vite build",
  "preview":             "vite preview",
  "lint":                "tsc --noEmit",
  "clean":               "rm -rf dist server.js",
  "test":                "vitest run",
  "test:watch":          "vitest",
  "test:e2e":            "playwright test",
  "emulator:start":      "firebase emulators:start --only auth,firestore,database --project demo-couple-test",
  "emulator:exec":       "firebase emulators:exec --only auth,firestore,database --project demo-couple-test 'echo Emulator ready'"
}
```

---

## 📖 Documentation

- **[PRD.md](./PRD.md)** — full product requirements + architecture (the "deep dive"). Phase 8 is the latest milestone.
- **[README.md](./README.md)** — you are here 🌸 (the "what + how to run" page).
- **[.github/workflows/](./.github/workflows/)** — realtime-sync CI workflow.

---

## 🪪 License & Credits

Private project. All photos, letters, and personalizations belong to Ger + Nicola.

Built with React 19, Vite, TailwindCSS v4, motion/react, Firebase, Web Audio API, and a lot of late-night care.
