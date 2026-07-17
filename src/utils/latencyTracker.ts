/**
 * latencyTracker.ts — Opt-in `?latencyOverlay=1` instrumentation bus.
 *
 * Architecture:
 *   - Singleton module (not React Context) so updates bypass React render cycles
 *     and any component can subscribe from anywhere.
 *   - Per-ListenerId ring buffer capped at 100 samples (drop-oldest on overflow).
 *   - Subscribe pattern: callback fires on every `record(id, sample)`. Subscribers
 *     should use `useSyncExternalStore` so the React tree re-reads the buffer.
 *   - Per-tab identity written to sessionStorage; lets a listener identify writes
 *     originating from ITS OWN tab vs the partner's tab vs a stale pre-reload write.
 *
 * How to use:
 *   // On the WRITE side, stamp the doc payload:
 *   await setDoc(docRef, { ...data, _clientWriteTs: Date.now(),
 *                                     _clientListenerId: "music:shared_song",
 *                                     _clientTabId: latencyTracker.getTabId() },
 *               { merge: true });
 *
 *   // On the LISTENER side, after snapshot callback fires:
 *   latencyTracker.record("music:shared_song", {
 *     ts: Date.now(),
 *     deltaMs: hasLocalStamp ? Date.now() - data._clientWriteTs : null,
 *     partnerWrite: !hasLocalStamp,
 *     stale: hasLocalStamp && data._clientTabId !== latencyTracker.getTabId(),
 *   });
 */

export type ListenerId =
  | "music:shared_song"
  | "heartbeat:watch_room"
  | "studio:sketch_room"
  | "studio:sketch_cursors";

export const LISTENER_LABELS: Record<ListenerId, { title: string; corner: Corner }> = {
  "music:shared_song": { title: "Music · shared_song", corner: "top-left" },
  "heartbeat:watch_room": { title: "Heartbeat · watch_room", corner: "top-right" },
  "studio:sketch_room": { title: "Game Attic · sketch_room", corner: "bottom-left" },
  "studio:sketch_cursors": { title: "Game Attic · cursor sync", corner: "bottom-right" },
};

export type LatencySample = {
  /** ms since epoch when the listener fired (post-snapshot, pre-React commit) */
  ts: number;
  /** null = partner write or stale; number = end-to-end delta in ms */
  deltaMs: number | null;
  /** true = the snapshot arrived due to partner/server write, no local ts to compare */
  partnerWrite: boolean;
  /** true = local ts existed but tabId mismatch (cross-tab or pre-reload) */
  stale: boolean;
};

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const BUFFER_CAPACITY = 100;

type SubId = ListenerId;

// ── Buffered storage + subscriber fanout ───────────────────────────────────
const buffers = new Map<SubId, LatencySample[]>();
const subs = new Map<SubId, Set<() => void>>();

function buf(id: SubId): LatencySample[] {
  let b = buffers.get(id);
  if (!b) {
    b = EMPTY;
    buffers.set(id, b);
  }
  return b;
}

const EMPTY: LatencySample[] = [];

export function record(id: SubId, sample: LatencySample): void {
  const b = buf(id);
  // If buffer was EMPTY placeholder, swap in a fresh mutable array first
  const live = b === EMPTY ? [] : b;
  if (b === EMPTY) buffers.set(id, live);
  live.push(sample);
  if (live.length > BUFFER_CAPACITY) live.shift();
  const set = subs.get(id);
  if (set) for (const cb of set) cb();
}

export function getBufferSnapshot(id: SubId): readonly LatencySample[] {
  return buf(id);
}

export function subscribe(id: SubId, cb: () => void): () => void {
  let set = subs.get(id);
  if (!set) {
    set = new Set();
    subs.set(id, set);
  }
  set.add(cb);
  return () => {
    set.delete(cb);
  };
}

// Convenience aggregate — used by the overlay badge for at-a-glance.
export function aggregate(samples: readonly LatencySample[]) {
  const local = samples.filter((s) => s.deltaMs != null && !s.stale);
  if (local.length === 0) {
    return { count: 0, last: null, p50: null, p95: null, max: null };
  }
  const sorted = local.map((s) => s.deltaMs!).sort((a, b) => a - b);
  const last = sorted[sorted.length - 1];
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
  const max = sorted[sorted.length - 1];
  return { count: local.length, last, p50, p95, max };
}

// ── Per-tab id (module-level cached, NOT sessionStorage) ─────────────────────
//
// Why not sessionStorage? sessionStorage is shared between same-origin tabs in
// the same window. If the user has two tabs of the app open to verify the
// overlay, both tabs would read the SAME tabId, and writes from tab-A would be
// misclassified as "own" by tab-B's listener — breaking the round-trip delta.
//
// A module-level cache guarantees a fresh id per tab (one module load per tab
// origin), and reload simply re-evaluates the module → new id (acceptable; old
// listen snapshots will time out via the stale-sweep / partnerWrite fallback).
let cachedTabId: string | null = null;
function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTabId(): string {
  if (cachedTabId) return cachedTabId;
  cachedTabId = genId();
  return cachedTabId;
}

/**
 * Test/dev only — force a fresh tab id on module reload so the round-trip
 * measurement starts clean. Not exported in any UI; used by the e2e suite.
 */
export function _resetTabIdForTests(): void {
  cachedTabId = null;
}

/** True when the URL param `?latencyOverlay=1` is present.
 *  Always read at render time (not cached) so the overlay is reactive with React Router. */
export function isLatencyOverlayEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("latencyOverlay") === "1";
}

/**
 * Helper returning the three fields to merge into a doc payload so the
 * matching listener can identify and timestamp this write.
 *
 *   await setDoc(docRef, { ...data, ...tabWriteTs("heartbeat:watch_room") }, { merge: true });
 */
export function tabWriteTs(listenerId: ListenerId): {
  _clientWriteTs: number;
  _clientTabId: string;
  _clientListenerId: ListenerId;
} {
  return {
    _clientWriteTs: Date.now(),
    _clientTabId: getTabId(),
    _clientListenerId: listenerId,
  };
}
