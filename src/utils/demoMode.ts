/**
 * demoMode.ts — Centralized demo mode detection.
 *
 * Demo mode activates via three mechanisms (checked in order):
 *   1. `VITE_DEMO_MODE=true` environment variable (build/deploy-time)
 *   2. `?demo=1` URL query parameter (quick visitor test)
 *   3. `localStorage.demo_mode = 'true'` (set by "Try Demo Mode" button)
 *
 * In demo mode:
 *   - Firebase is never initialized (Auth + Firestore are fully bypassed)
 *   - A mock session is created so the main UI renders immediately
 *   - All data comes from `defaults.ts` + localStorage (no external DB)
 *   - A floating "🔬 DEMO MODE" badge is shown in the UI
 *   - Write operations silently persist only to localStorage
 */

/** Check whether the app should run in demo mode. */
export function isDemoMode(): boolean {
  // 1. Build-time env var (set in .env or Vite build)
  if (import.meta.env.VITE_DEMO_MODE === "true") return true;

  // 2. Runtime URL parameter (?demo=1)
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("demo") === "1") return true;
    } catch {
      // URL parsing may fail in some SSR-like edge cases — safe to ignore
    }
  }

  // 3. Runtime localStorage flag (set when user clicks "Try Demo Mode")
  if (typeof window !== "undefined") {
    try {
      if (localStorage.getItem("demo_mode") === "true") return true;
    } catch {
      // localStorage may be unavailable (incognito, restricted storage)
    }
  }

  // 4. Auto-fallback for public live demo deployments (e.g. Vercel)
  // If no Firebase API key is set, automatically activate isolated Demo Mode
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return true;
  }

  return false;
}

/** Enable demo mode and reload the page so the app picks it up. */
export function enableDemoMode(): void {
  // Prevent infinite reload: if already in demo mode (e.g. via env var),
  // don't reload — the app is already running with demo data.
  if (isDemoMode()) return;
  try {
    localStorage.setItem("demo_mode", "true");
  } catch {
    // localStorage may be unavailable — still try to set via URL param
  }
  window.location.reload();
}

/** Disable demo mode and reload to return to normal flow. */
export function disableDemoMode(): void {
  try {
    localStorage.removeItem("demo_mode");
  } catch {
    // ignore
  }
  window.location.reload();
}

/**
 * Mock session returned when the app runs in demo mode.
 * This satisfies the `session` check in App.tsx (`if (!session) return <LoginView />`)
 * so the full app UI renders seamlessly.
 */
export const DEMO_MOCK_SESSION = {
  uid: "demo-explorer-001",
  email: "demo@treehouse.demo",
  displayName: "Demo Explorer",
  photoURL: null,
  // Real Firebase User objects have many more fields — these are all we need.
} as any;
