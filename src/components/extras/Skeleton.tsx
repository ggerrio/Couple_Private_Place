// ─── Skeleton — Animated loading placeholders ──────────────────────────
// Enhanced with shimmer effect + shape-aware variants
// Use these to bridge async data-fetching states smoothly.

import React from "react";
import { cn } from "../../lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton. Default: "100%" */
  width?: string | number;
  /** Height of the skeleton. Default: "1rem" */
  height?: string | number;
  /** Border radius. Default: "8px" */
  rounded?: string;
  /** Show shimmer overlay. Default: true */
  shimmer?: boolean;
}

export function Skeleton({
  width,
  height,
  rounded,
  shimmer = true,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-lg", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width || "100%",
        height: typeof height === "number" ? `${height}px` : height || "1rem",
        borderRadius: rounded || "8px",
      }}
      {...props}
    >
      {/* Base pulse layer */}
      <div className="absolute inset-0 skeleton-shimmer" />
      {/* Shimmer overlay */}
      {shimmer && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      )}
    </div>
  );
}

// ─── Skeleton Card — full card placeholder ─────────────────────────────

export function SkeletonCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("relative bg-[var(--card-bg-solid)] border-2 border-[var(--text-main)] rounded-2xl p-6 shadow-[6px_6px_0_0_var(--text-main)] space-y-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <Skeleton width={40} height={40} rounded="50%" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} width="60%" />
          <Skeleton height={10} width="40%" />
        </div>
      </div>
      <Skeleton height={180} rounded="12px" />
      <div className="space-y-2">
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="50%" />
        <Skeleton height={12} width="65%" />
      </div>
      <div className="flex items-center gap-2 pt-2">
        <Skeleton height={32} width={80} rounded="20px" />
        <Skeleton height={32} width={120} rounded="20px" />
      </div>
    </div>
  );
}

// ─── Skeleton Image — rectangular image placeholder ───────────────────

export function SkeletonImage({
  aspectRatio = "4/3",
  className,
}: {
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio }}
    >
      <div className="absolute inset-0 skeleton-shimmer" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_linear_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>
    </div>
  );
}

// ─── Skeleton Button — button-shaped placeholder ─────────────────────

export function SkeletonButton({
  width = 120,
  height = 44,
  className,
}: {
  width?: number | string;
  height?: number;
  className?: string;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      rounded="12px"
      className={className}
    />
  );
}

// ─── Skeleton Avatar Circle ───────────────────────────────────────────

export function SkeletonAvatar({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <Skeleton width={size} height={size} rounded="50%" className={className} />;
}

// ─── Skeleton Circular — generic circle placeholder ───────────────────

export function SkeletonCircular({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return <Skeleton width={size} height={size} rounded="50%" className={className} />;
}

// ─── Skeleton Text Lines ──────────────────────────────────────────────

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = useStableWidths(lines);
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={widths[i]}
          rounded="6px"
        />
      ))}
    </div>
  );
}

// Stable widths hook — prevents hydration mismatch from Math.random()
function useStableWidths(count: number): string[] {
  return React.useMemo(() => {
    const seeds = [78, 62, 85, 45, 70, 55, 90, 50, 75, 60];
    return Array.from({ length: count }, (_, i) => `${seeds[i % seeds.length]}%`);
  }, [count]);
}
