# Realtime Sync — Playwright E2E Suite

This directory contains the automated version of the **manual 4-surface stress-test table** for the couples LDR app. Each suite covers `Brain/DreamBoard`, `Music`, `Watch`, `Sketch` realtime sync.

## Architecture

```
                     ┌──────────────────────────────────┐
                     │ Playwright (chromium, fullyParallel: false) │
                     │   ├─ adminContext + adminPage  │ ← signs in as admin@test.local
                     │   └─ userContext + userPage    │ ← signs in as partner@test.local
                     └────────────┬─────────────────────┘
                                  │ spawns / drives
                                  ▼
       ┌───────────────────────────┴───────────────────────────────┐
       │ Vite (port 5173) — connects to emulators via       │
       │ VITE_USE_FIREBASE_EMULATOR=true              │
       │       │                                 │
       │       ├─ http://127.0.0.1:9099 — Auth Emulator      │
       │       ├─ http://127.0.0.1:8080 — Firestore Emulator │
       │       └─ http://127.0.0.1:9000 — Realtime DB Emulator│
       └────────────────────────────────────────────────────────┘
                                  ▲
                                  │ Admin SDK (firebase-admin) for test setup
                                  │
       ┌──────────────────────────┴───────────────────────────────┐
       │  /e2e/fixtures.ts — beforeAll: seedAll()             │
       │                   afterEach: cleanupVolatileState()    │
       │  /e2e/setup-firestore-data.ts — admin_config + profiles │
       └────────────────────────────────────────────────────────┘
```

## Auth strategy

Test users live in the Auth Emulator (any credentials work locally).

| Identity | Email | Maps to |
|----------|-------|---------|
| `test-admin-uid` | `admin@test.local` | `user_a` slot (== admin_email) |
| `test-partner-uid` | `partner@test.local` | `user_b` slot (≠ admin_email) |

`firestore.rules` `getAdminEmail()` reads `settings/admin_config.admin_email`. The seed step writes `admin_email: "admin@test.local"` so admin@test.local → `user_a` and partner@test.local → `user_b`.

## One-time local setup

```bash
# 1. Install deps
npm install

# 2. Install Playwright browser
npx playwright install chromium

# 3. Install firebase-tools (for emulator) — already in devDeps
#    Verify by running:
npx firebase --version
```

## Running tests locally

```bash
# Terminal A: start the Firebase emulators (auth + firestore + database)
npm run emulator:start

# Wait until you see "All emulators ready!" in the output.

# Terminal B: run the Playwright suite
npm run test:e2e            # headless
npm run test:e2e:ui         # interactive UI mode (recommended)
npm run test:e2e:headed     # headed chromium to watch browser actions
```

The `webServer` hook in `playwright.config.ts` auto-starts `vite dev:test` (with `VITE_USE_FIREBASE_EMULATOR=true`) once the emulators are healthy. No need to start Vite manually.

## Test files (1 spec file per surface)

| File | Coverage |
|------|----------|
| `e2e/brain.spec.ts` | DateNight sync, dream add/complete/delete (manual rows 1.1–1.4) |
| `e2e/music.spec.ts` | Play/pause, drag seek, drag throttle (1 PATCH), volume, playlist add (2.1–2.5) |
| `e2e/watch.spec.ts` | Video load, playback drift, chat single/concurrent/burst (3.1–3.3) |
| `e2e/sketch.spec.ts` | Stroke sync, concurrent draw, sustained cursor throttle, undo, clear (4.1–4.5) |

## Latency acceptance thresholds

Encoded as `expect.poll` timeouts in each spec:

| Surface | Threshold |
|---------|-----------|
| DateNight sync | ≤ 2s |
| Dream add/complete/delete | ≤ 1.0–1.5s |
| Music play/pause | ≤ 1s |
| Music drag seek | ≤ 2s |
| Music drag throttle | 1 PATCH per drag-end (counted) |
| Watch video load | ≤ 3s |
| Chat single send | ≤ 1s |
| Sketch stroke | ≤ 2s |
| Sketch cursor | ~600 PATCHes / 30s sustained |
| Sketch clear | ≤ 2s |

## CI integration

`.github/workflows/realtime-sync.yml` runs on every PR to `main`:
1. Ubuntu latest + Node 20 + Java 11
2. `npm ci` (deterministic install)
3. `npx playwright install --with-deps chromium`
4. Start Firebase emulators in background (PID-tracked)
5. `npx playwright test` (webServer hook auto-starts Vite)
6. On failure: upload HTML report + emulator log artifacts (10-day retention)

Total CI budget: **~15 min**. Serial execution (workers: 1) because emulator state is global.

## Debugging failures

```bash
# Open HTML report (auto-generated on test)
npm run test:e2e:report

# Re-run only failing tests with trace playback
npx playwright test --debug

# Investigate a single scenario
npx playwright test -g "4.2.c" --headed
```

Look for these in trace:
- **Network panel:** `firestore.googleapis.com` PATCH/POST frequency (helps confirm throttle test 2.2.c / 4.2.c).
- **Console:** any `[mood_history listener]`, `[sketch cursor write]`, etc. errors.
- **Test ID matches:** Components are queried by `data-testid="..."`. If a test selects nothing, the component might be missing a test-id — add one in the source.

## Adding new tests

1. Write `test.describe` block in the relevant `*.spec.ts` file.
2. Use the shared helpers:
   - `signPageInAs(page, "admin")` / `"partner"` for auth (already wired in fixtures)
   - `waitForSync(page, pred, { timeoutMs })` for polling
   - `measureLatency(actor, action, partner, assertion, { timeoutMs })` for round-trip timing
3. Use `expect.poll(...)` for any cross-context state assertion — never `waitForTimeout` alone.
4. Add the latency budget to the table in this README.

## When tests are flaky

- Increase `expect.poll` timeout, never `waitForTimeout`.
- Add `await userPage.waitForTimeout(initial_warmup_ms)` after navigation if you added a new route.
- For canvas/sketch tests, prefer asserting `Firestore doc state` over `canvas pixel` content (canvas is hardware-specific).
