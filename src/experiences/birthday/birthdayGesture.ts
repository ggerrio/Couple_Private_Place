/**
 * birthdayGesture.ts
 *
 * Bridges the user-gesture window from the "Open Birthday Gift"
 * button click (BirthdayTrigger) to the AudioContext mount inside
 * bgmController.ts.
 *
 * Why this module exists
 * ─────────────────────
 * Browser autoplay policies block `new AudioContext()` and
 * `decodeAudioData()` outside a user-gesture. The bgmController
 * hook lives inside <ExperienceMusic>, which mounts only AFTER
 * the BirthdayTrigger click has already propagated — by the time
 * the hook runs, the original click event has finished, so any
 * AudioContext it creates is suspended forever until the user
 * gestures again (e.g., taps the cake).
 *
 * The bug we're fixing: when the user taps "Open Birthday Gift",
 * the BirthdayReplayButton onClick handler runs SYNCHRONOUSLY
 * inside the click event. We use that window to:
 *   1. create an AudioContext,
 *   2. call .resume() on it (synchronously, still inside the
 *      user-gesture tree), and
 *   3. park it in a module-level slot.
 *
 * When <ExperienceMusic> mounts moments later, its bgmController
 * calls `consumePreArmedCtx()` and reuses the parked context —
 * the Web Audio fetch+decode+leapfrog pipeline proceeds normally
 * because ctx.resume() was already authorized by the original
 * click.
 *
 * Module-level slot is intentionally simple — single concert day
 * for one recipient, a leftover AudioContext from a previous
 * unlock event would just be reused (no audio interference).
 */

let _preArmedCtx: AudioContext | null = null;

/**
 * Create + resume an AudioContext inside the current call frame.
 * Safe to call outside user-gesture (browser will block resume),
 * but ideally called from a click/keydown handler for clean auth.
 * Idempotent: returns the existing parked ctx if already armed.
 */
export function preArmAudio(): AudioContext | null {
  if (_preArmedCtx) return _preArmedCtx;
  const W = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = W.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  try {
    _preArmedCtx = new Ctor();
    void _preArmedCtx.resume().catch(() => {
      /* autoplay-blocked → consumer will retry via gesture listener */
    });
  } catch {
    return null;
  }
  return _preArmedCtx;
}

/**
 * Consumer-side: pulls the parked ctx (clears it) so bgmController
 * can use it as its primary AudioContext. Returns `null` if no
 * parked ctx exists (the bridge was never activated because
 * the user opened the birthday card without the trigger button —
 * e.g., via `?sandbox=` URL or auto-fire-on-birthday path).
 */
export function consumePreArmedCtx(): AudioContext | null {
  const c = _preArmedCtx;
  _preArmedCtx = null;
  return c;
}
