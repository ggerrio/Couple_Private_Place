/**
 * LatencyOverlay.tsx — Floating corner badges for ?latencyOverlay=1.
 *
 * Renders one badge per instrumented ListenerId in its pinned corner.
 * Each badge subscribes via useSyncExternalStore so updates bypass React render.
 *
 * AESTHETIC:
 *   - Glassy bg-white/85 backdrop blur, rounded-2xl, monospace numbers.
 *   - One row per percentile + last, plus a count of partner/stale drops.
 *   - 4 corner slots are dead simple; only render the badges for listeners that
 *     have actually emitted at least 1 sample so empty slots don't clutter.
 */

import { useSyncExternalStore, useMemo } from "react";
import {
  LISTENER_LABELS,
  type Corner,
  type ListenerId,
  type LatencySample,
  aggregate,
  getBufferSnapshot,
  subscribe,
} from "../../utils/latencyTracker";

const CORNER_CLASS: Record<Corner, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
};

function useSamples(id: ListenerId): readonly LatencySample[] {
  return useSyncExternalStore(
    (cb) => subscribe(id, cb),
    () => getBufferSnapshot(id),
    () => getBufferSnapshot(id),
  );
}

function fmtMs(v: number | null): string {
  if (v == null) return "—";
  if (v < 1000) return `${v.toFixed(0)}ms`;
  return `${(v / 1000).toFixed(2)}s`;
}

function colorFor(v: number | null): string {
  if (v == null) return "text-slate-400";
  if (v < 400) return "text-emerald-600";
  if (v < 1200) return "text-amber-600";
  return "text-rose-600";
}

function CornerBadge({ id }: { id: ListenerId }) {
  const samples = useSamples(id);
  const { title, corner } = LISTENER_LABELS[id];
  const agg = useMemo(() => aggregate(samples), [samples]);
  const partnerCount = samples.filter((s) => s.partnerWrite).length;
  const staleCount = samples.filter((s) => s.stale).length;
  const recent = useMemo(
    () =>
      [...samples].slice(-5).reverse().map((s) => ({
        delta: s.deltaMs,
        partner: s.partnerWrite,
        stale: s.stale,
      })),
    [samples],
  );

  if (samples.length === 0) {
    // Render a tiny "armed & waiting" badge so users know the overlay is alive.
    return (
      <div
        className={`fixed z-[1000] ${CORNER_CLASS[corner]} pointer-events-none select-none`}
        data-listener-id={id}
        data-listener-corner={corner}
      >
        <div className="bg-white/85 backdrop-blur-sm border border-slate-200/70 rounded-full px-3 py-1 text-[10px] font-mono text-slate-500 shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
          {title} · awaiting echo
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed z-[1000] ${CORNER_CLASS[corner]} pointer-events-none select-none`}
      data-listener-id={id}
      data-listener-corner={corner}
    >
      <div className="bg-white/85 backdrop-blur-sm border border-slate-200/70 rounded-2xl px-3 py-2 shadow-md font-mono text-[10px] leading-tight min-w-[180px] max-w-[240px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <span className="font-bold text-slate-700 truncate" title={title}>
            {title}
          </span>
          <span className="text-[9px] text-slate-400 tabular-nums">
            n={agg.count}
          </span>
        </div>

        {/* Percentile grid */}
        <div className="grid grid-cols-4 gap-x-2 mb-1.5">
          <Stat label="last" v={agg.last} />
          <Stat label="p50" v={agg.p50} />
          <Stat label="p95" v={agg.p95} />
          <Stat label="max" v={agg.max} />
        </div>

        {/* Drop counters + recent deltas */}
        <div className="flex flex-wrap gap-1.5 text-[9px] mb-1">
          {partnerCount > 0 && (
            <span className="bg-sky-100 text-sky-700 rounded-full px-1.5">
              partner×{partnerCount}
            </span>
          )}
          {staleCount > 0 && (
            <span className="bg-orange-100 text-orange-700 rounded-full px-1.5">
              stale×{staleCount}
            </span>
          )}
        </div>

        <div className="space-y-0.5">
          {recent.map((r, i) => {
            const color =
              r.partner || r.stale
                ? r.stale
                  ? "text-orange-500"
                  : "text-sky-500"
                : colorFor(r.delta);
            const label = r.partner ? "↘" : r.stale ? "✗" : "↻";
            return (
              <div key={i} className="flex justify-between text-[9px] tabular-nums">
                <span className="text-slate-400 mr-2">{label}</span>
                <span className={`flex-1 text-right ${color}`}>
                  {fmtMs(r.delta)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number | null }) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className={`tabular-nums ${colorFor(v)} font-semibold`}>
        {fmtMs(v)}
      </span>
    </div>
  );
}

/**
 * Public entrypoint — App.tsx mounts this once when ?latencyOverlay=1.
 * Renders all 4 corner badges; badges self-suppress when their ListenerId has
 * not yet emitted any sample.
 */
export function LatencyOverlay() {
  const listenerIds = Object.keys(LISTENER_LABELS) as ListenerId[];
  return (
    <>
      {listenerIds.map((id) => (
        <CornerBadge key={id} id={id} />
      ))}
    </>
  );
}
