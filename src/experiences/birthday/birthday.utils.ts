/**
 * birthday.utils.ts
 *
 * Pure helpers used by BirthdayTrigger and PresentationEngine. Kept tiny
 * and dependency-free so they can be unit-tested in isolation if needed.
 *
 * Persistence convention:
 *   localStorage key shape:   birthday_surprise_<YYYY-MM-DD>_fired
 *   - Scoped by ISO date so the flag auto-resets on the next day.
 *   - This mirrors the existing pattern from useConfetti() in
 *     components/emotional/ConfettiEffect.tsx (`hasFiredToday`).
 */

const STORAGE_PREFIX = "birthday_surprise_";
const STORAGE_SUFFIX = "_fired";

/** Returns true if today (local time) matches the given MM-DD birthday string. */
export function isBirthdayToday(birthdayMmDd: string, now: Date = new Date()): boolean {
  if (!birthdayMmDd || typeof birthdayMmDd !== "string") return false;
  const [mm, dd] = birthdayMmDd.split("-").map((s) => parseInt(s, 10));
  if (Number.isNaN(mm) || Number.isNaN(dd)) return false;
  return now.getMonth() + 1 === mm && now.getDate() === dd;
}

/** ISO date string for the supplied Date (defaults to now). */
function isoDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Build the localStorage key for "hasFired on this date". */
export function firedStorageKey(now: Date = new Date()): string {
  return `${STORAGE_PREFIX}${isoDate(now)}${STORAGE_SUFFIX}`;
}

/** True if the auto-launch for this date has already fired in this browser. */
export function hasFiredToday(now: Date = new Date()): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(firedStorageKey(now)) === "1";
  } catch {
    return false;
  }
}

/** Mark this date as already-fired so the surprise doesn't auto-launch twice. */
export function markFiredToday(now: Date = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(firedStorageKey(now), "1");
  } catch {
    /* storage might be full / disabled — silently skip */
  }
}

/** Manually clear the flag (useful for testing / a "re-watch" reset). */
export function clearFiredToday(now: Date = new Date()): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(firedStorageKey(now));
  } catch {
    /* noop */
  }
}

/**
 * Synthesizes a realistic wind/blowing sound effect for blowing out candles
 * using the Web Audio API (white noise buffer and lowpass filter sweep).
 * Requires no external audio assets.
 */
export function playSyntheticBlowSound(isFinal: boolean = false): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 1. Generate White Noise Buffer
    const duration = isFinal ? 1.4 : 0.8;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // 2. Nodes Setup
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";

    const gainNode = ctx.createGain();

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 3. Automation Ramps
    const now = ctx.currentTime;

    // Filter frequency sweep: starts high (representing initial blowing force)
    // and sweeps down exponentially as the breath decays
    const startFreq = isFinal ? 1800 : 1500;
    const endFreq = isFinal ? 100 : 140;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration - 0.2);

    // Resonance peak on blowout impact
    filter.Q.setValueAtTime(1.5, now);
    filter.Q.linearRampToValueAtTime(4.5, now + 0.2);
    filter.Q.linearRampToValueAtTime(1.0, now + duration - 0.2);

    // Volume gain envelope: rapid fade-in, hold, exponential fade-out
    const peakGain = isFinal ? 0.45 : 0.3;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Start & Stop
    noiseSource.start(now);
    noiseSource.stop(now + duration);

    // Clean up AudioContext context to prevent resource leaks
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, (duration + 0.3) * 1000);
  } catch (e) {
    console.warn("Failed to play synthetic blow sound:", e);
  }
}

/**
 * Synthesizes a realistic soft paper page turn / rustle sound effect
 * using Web Audio API filtered noise.
 */
export function playPageTurnSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const duration = 0.35;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    setTimeout(() => ctx.close().catch(() => {}), 500);
  } catch {
    /* silent fallback if audio blocked */
  }
}

/**
 * Synthesizes a soft paper envelope slide / unlatch sound effect.
 */
export function playEnvelopeSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const duration = 0.45;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);

    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start(now);
    noiseSource.stop(now + duration);

    setTimeout(() => ctx.close().catch(() => {}), 600);
  } catch {
    /* silent fallback */
  }
}

/**
 * Synthesizes a deep tactile wax seal press / thud sound effect.
 */
export function playSealPressSound(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);

    setTimeout(() => ctx.close().catch(() => {}), 400);
  } catch {
    /* silent fallback */
  }
}
