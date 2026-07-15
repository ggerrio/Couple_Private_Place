import React from "react";
import { cn } from "@/src/lib/utils";

interface SectionHeaderProps {
  chapter: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  chapter,
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Scrapbook chapter badge — carved wood label */}
      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-[0.15em]"
        style={{
          color: "var(--wood-walnut)",
          backgroundColor: "color-mix(in srgb, var(--wood-oak) 18%, var(--fabric-cream) 92%)",
          border: "1px solid color-mix(in srgb, var(--wood-oak) 25%, transparent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <span style={{ color: "var(--metal-brass)", opacity: 0.6 }}>•</span>
        {chapter}
        <span style={{ color: "var(--metal-brass)", opacity: 0.6 }}>•</span>
      </div>
      {title && (
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-main)] font-serif italic">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
}
