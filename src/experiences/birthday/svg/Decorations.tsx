/**
 * Decorations.tsx
 *
 * Inline SVG decoration library used across every birthday scene.
 * Rendered as React components for color-tree-shaking and Tailwind
 * class compatibility. All SVGs are CC0 or hand-drawn originals — no
 * external assets are downloaded.
 *
 * Convention: each component takes a `className` so the parent can
 * tint / size / position it freely. All decorative components have
 * `pointer-events: none` baked into their root so they never block
 * scene click handlers (Finish button, taps to advance, etc.).
 *
 * ── POSTCARD SUITE ADDITIONS ─────
 * Added for the Vintage Postcard direction (long-distance metaphor):
 * VintageStamp, PostmarkReal, AddressLines, CoffeeStain, CreaseMark,
 * PostcardEdges, Envelope.
 */

import React from "react";
import { motion } from "motion/react";

const POINTER_NONE_CLASS = "pointer-events-none";

export const POSTCARD_INK = "#5b3a32";
export const POSTCARD_PAPER = "#F4E8D2";
export const POSTCARD_DEEP = "#3a2511";

// ── Sparkle (4-point) ────────────────────────────────────────────────
export function Sparkle({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M12 0L13.5 9 24 12 13.5 15 12 24 10.5 15 0 12 10.5 9z"
        fill="currentColor"
      />
    </svg>
  );
}

// ── Eight-point sparkle (big) ────────────────────────────────────────
export function SparkleLarge({
  className,
  size = 64,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M32 0L36 24 60 28 36 32 32 64 28 32 4 28 28 24z"
        fill="currentColor"
      />
      <circle cx="32" cy="32" r="2.5" fill="currentColor" />
    </svg>
  );
}

// ── Heart outline ────────────────────────────────────────────────────
export function HeartOutline({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Paperclip ────────────────────────────────────────────────────────
export function PaperClip({
  className,
  size = 28,
  tint = "warm",
}: {
  className?: string;
  size?: number;
  tint?: "warm" | "cool";
}) {
  const stroke = tint === "warm" ? "#8a6a44" : "#6b7a86";
  return (
    <svg
      viewBox="0 0 24 48"
      width={size * 0.5}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M14 4C8.5 4 4 8.5 4 14v18c0 4.4 3.6 8 8 8s8-3.6 8-8V12c0-2.2-1.8-4-4-4s-4 1.8-4 4v16c0 1.1.9 2 2 2s2-.9 2-2V14"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Safety pin (brass, vintage) ──────────────────────────────────────
export function SafetyPin({
  className,
  size = 36,
  tint = "brass",
}: {
  className?: string;
  size?: number;
  tint?: "brass" | "silver" | "rose-gold";
}) {
  const stroke =
    tint === "silver"
      ? "#9aa4ad"
      : tint === "rose-gold"
        ? "#b87560"
        : "#a37a3a";
  return (
    <svg
      viewBox="0 0 32 56"
      width={size * 0.55}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <circle
        cx="16"
        cy="6"
        r="3"
        fill="none"
        stroke={stroke}
        strokeWidth="1.4"
      />
      <path
        d="M16 9 C16 16 22 22 22 30 L22 50 C22 52 21 53 19 53 C17 53 16 52 16 50 L16 30"
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 8 L14 8"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Wax seal (initial inside a circular wax blob) ────────────────────
export function WaxSeal({
  className,
  initial = "N",
  size = 56,
  color = "crimson",
  pressDelay = 0,
}: {
  className?: string;
  initial?: string;
  size?: number;
  color?: "crimson" | "forest" | "burgundy";
  pressDelay?: number;
}) {
  const fill =
    color === "forest"
      ? "#3b5d3a"
      : color === "burgundy"
        ? "#6b1a1a"
        : "#7c2b22";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <defs>
        <radialGradient id={`wax-shade-${initial}-${color}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#e3a89a" stopOpacity="0.65" />
          <stop offset="60%" stopColor={fill} />
          <stop offset="100%" stopColor="#3a1410" />
        </radialGradient>
      </defs>
      <path
        d="M32 4 L42 8 L52 6 L58 16 L60 26 L56 36 L60 44 L50 54 L40 58 L30 60 L20 56 L10 50 L6 40 L4 30 L8 20 L14 10 Z"
        fill={`url(#wax-shade-${initial}-${color})`}
      />
      <motion.circle
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: pressDelay, duration: 0.2 }}
        cx="32"
        cy="32"
        r="20"
        fill="none"
        stroke="#3a1410"
        strokeWidth="0.8"
      />
      <motion.text
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.85, scale: 1 }}
        transition={{ delay: pressDelay, duration: 0.2, ease: "easeOut" }}
        x="32"
        y="40"
        fontSize="22"
        textAnchor="middle"
        fill="#3a1410"
        fontFamily="serif"
        fontStyle="italic"
        fontWeight="700"
      >
        {initial}
      </motion.text>
    </svg>
  );
}

// ── Hanging thread (line that ascends to off-canvas) ─────────────────
export function HangingThread({
  className,
  fromX = "50%",
  length = 240,
}: {
  className?: string;
  fromX?: string;
  length?: number;
}) {
  return (
    <span
      aria-hidden
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      style={{
        position: "absolute",
        top: 0,
        left: fromX,
        width: 1,
        height: length,
        background:
          "linear-gradient(180deg, rgba(120,80,30,0.55) 0%, rgba(120,80,30,0.30) 100%)",
        transform: "translateX(-50%)",
      }}
    />
  );
}

// ── Torn paper edge wrapper ──────────────────────────────────────────
export function TornEdge({
  className,
  position = "bottom",
}: {
  className?: string;
  position?: "bottom" | "top" | "both";
}) {
  return (
    <span
      aria-hidden
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      style={{
        position: "absolute",
        [position === "bottom" || position === "both" ? "bottom" : "top"]: -2,
        left: 0,
        right: 0,
        height: 8,
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(120,80,30,0.20) 4%, transparent 8%, transparent 12%, rgba(120,80,30,0.20) 18%, transparent 24%, transparent 30%, rgba(120,80,30,0.20) 40%, transparent 50%, rgba(120,80,30,0.20) 60%, transparent 70%, transparent 80%, rgba(120,80,30,0.20) 88%, transparent 96%)",
      }}
    />
  );
}

// ── Washi tape ──────────────────────────────────────────────────────
export function WashiTape({
  className,
  color = "rose",
  width = 96,
  height = 28,
  rotate = 0,
  pattern = "dots",
}: {
  className?: string;
  color?: "rose" | "sage" | "tan" | "lavender" | "gold";
  width?: number;
  height?: number;
  rotate?: number;
  pattern?: "dots" | "stripes" | "none";
}) {
  const fills: Record<string, string> = {
    rose: "#E8B4B8",
    sage: "#B7C9A8",
    tan: "#D4A574",
    lavender: "#C5B7DA",
    gold: "#E5C66B",
  };
  return (
    <svg
      viewBox="0 0 100 30"
      width={width}
      height={height}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <defs>
        <clipPath id="torn">
          <path d="M2 6 L8 0 L92 3 L97 0 L100 14 L96 28 L100 30 L88 26 L8 30 L0 28 L4 16 L0 12 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#torn)">
        <rect width="100" height="30" fill={fills[color]} />
        {pattern === "dots" && (
          <g opacity="0.55">
            {[10, 25, 40, 55, 70, 85].map((cx) => (
              <circle key={cx} cx={cx} cy={15} r="1.6" fill="white" />
            ))}
          </g>
        )}
        {pattern === "stripes" && (
          <g opacity="0.5" stroke="white" strokeWidth="1.2">
            {[0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96].map((x) => (
              <line key={x} x1={x} y1="0" x2={x - 30} y2="30" />
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}

// ── Polaroid corner overlays ─────────────────────────────────────────
export function PolaroidCorners({
  show = true,
  tint = "warm",
}: {
  show?: boolean;
  tint?: "warm" | "cool";
}) {
  if (!show) return null;
  const bg = tint === "warm" ? "#1c1612" : "#1a1f24";
  return (
    <div
      aria-hidden
      className={`absolute inset-0 ${POINTER_NONE_CLASS} z-30`}
    >
      {[
        "top-0 left-0 [clip-path:polygon(0_0,100%_0,0_100%)]",
        "top-0 right-0 [clip-path:polygon(0_0,100%_0,100%_100%)]",
        "bottom-0 left-0 [clip-path:polygon(0_0,0_100%,100%_100%)]",
        "bottom-0 right-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]",
      ].map((cls, i) => (
        <span
          key={i}
          className={`absolute w-7 h-7 ${cls}`}
          style={{
            background: `linear-gradient(180deg, ${bg}, ${bg}cc)`,
            boxShadow: "inset 0 0 6px rgba(255,210,160,0.18)",
          }}
        />
      ))}
    </div>
  );
}

// ── Botanical sprig ──────────────────────────────────────────────────
export function Botany({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="64"
      height="64"
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      aria-hidden
    >
      <g
        fill="none"
        stroke="#687f5c"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 60 C32 50 30 40 32 28 C34 16 36 8 32 4" />
        <path d="M32 50 C26 48 22 46 20 42" />
        <path d="M32 40 C38 38 42 36 44 32" />
        <path d="M32 30 C26 28 22 26 20 22" />
        <path d="M32 20 C38 18 42 16 44 12" />
        {[50, 40, 30, 20].map((y) => (
          <ellipse
            key={y}
            cx={y % 20 === 0 ? 22 : 44}
            cy={y}
            rx="5"
            ry="2.5"
            fill="#a3c388"
            opacity="0.85"
            transform={`rotate(${y % 20 === 0 ? -20 : 20} ${y % 20 === 0 ? 22 : 44} ${y})`}
          />
        ))}
      </g>
    </svg>
  );
}

// ── Petal ────────────────────────────────────────────────────────────
export function Petal({
  className,
  color = "#F4C4D6",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width="28"
      height="28"
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M16 0 C20 8 24 16 16 32 C8 16 12 8 16 0z"
        fill={color}
        opacity="0.85"
      />
      <path d="M16 8 L16 32" stroke="#8b5a78" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ── Postmark (legacy circle, kept for backward compat) ──────────────
export function Postmark({
  className,
  text = "FOR YOU",
}: {
  className?: string;
  text?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width="92"
      height="92"
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <circle cx="60" cy="60" r="50" fill="none" stroke="#a13b30" strokeWidth="2.2" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#a13b30" strokeWidth="0.8" />
      <text
        x="60"
        y="58"
        fontSize="11"
        textAnchor="middle"
        fill="#a13b30"
        fontFamily="serif"
        letterSpacing="2"
        fontWeight="700"
      >
        {text}
      </text>
      <text
        x="60"
        y="74"
        fontSize="7"
        textAnchor="middle"
        fill="#a13b30"
        letterSpacing="1"
      >
        EST · BIRTHDAY
      </text>
    </svg>
  );
}

// ── Star ─────────────────────────────────────────────────────────────
export function Star({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <path
        d="M12 1.5l3.1 6.4 7 .9-5 5 1.2 7L12 17.6 5.7 20.8 6.9 14 1.8 8.8l7-.9z"
        fill="currentColor"
      />
    </svg>
  );
}

// ── Floating embers ─────────────────────────────────────────────────
export function FloatingEmbers({
  className,
  count = 14,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <div
      className={`${POINTER_NONE_CLASS} ${className ?? "absolute inset-0"}`}
      aria-hidden
    >
      <style>{`
        @keyframes floatDrift {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--drift-x), var(--drift-y)) rotate(var(--drift-r)) scale(1.15);
            opacity: 0;
          }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => {
        // Deterministic pseudo-random values based on index
        const left = `${10 + (i * 37) % 80}%`;
        const top = `${20 + (i * 29) % 70}%`;
        const delay = (i * 0.7) % 4;
        const dur = 6 + (i * 1.3) % 6;
        
        // Drift offsets
        const driftX = `${-45 + (i * 23) % 90}px`;
        const driftY = `${-140 - (i * 17) % 90}px`;
        const driftR = `${120 + (i * 61) % 240}deg`;

        // Particle type: 0 = petal (cherry blossom), 1 = sparkle, 2 = ember
        const type = i % 3;

        return (
          <span
            key={i}
            className="absolute inline-block pointer-events-none"
            style={{
              left,
              top,
              animation: `floatDrift ${dur}s linear ${delay}s infinite`,
              // Cast as any to satisfy React CSS properties type checker
              ...{
                "--drift-x": driftX,
                "--drift-y": driftY,
                "--drift-r": driftR,
              } as any,
            }}
          >
            {type === 0 ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="#FFD1DC" className="opacity-75 drop-shadow-[0_2px_4px_rgba(255,182,193,0.4)]">
                <path d="M12 21c-2-2.5-5-4-5-7a5 5 0 0 1 10 0c0 3-3 4.5-5 7z" />
              </svg>
            ) : type === 1 ? (
              <svg viewBox="0 0 24 24" width="10" height="10" fill="#FFD700" className="opacity-70">
                <path d="M12 2L13.5 10.5L22 12L13.5 13.5L12 22L10.5 13.5L2 12L10.5 10.5Z" />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-200/70" />
            )}
          </span>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// ── POSTCARD SUITE: New components below ────────────────────────────
// ════════════════════════════════════════════════════════════════════

// ── Vintage stamp (postage with scalloped perforated edges) ────────
export function VintageStamp({
  className,
  size = 96,
  motif = "rose",
  color = "muted-red",
  value = "RP · 50",
}: {
  className?: string;
  size?: number;
  motif?: "rose" | "heart" | "star" | "fern" | "letter";
  color?: "muted-red" | "sage" | "indigo" | "ochre";
  value?: string;
}) {
  const inkMap: Record<string, string> = {
    "muted-red": "#a13b30",
    sage: "#5a7050",
    indigo: "#3b4868",
    ochre: "#a06e1e",
  };
  const fill = inkMap[color];
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      {/* Scalloped perforated outer edge */}
      <g fill={fill}>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <circle
              key={i}
              cx="48"
              cy="2"
              r="3.4"
              transform={`rotate(${angle} 48 48)`}
              opacity="0.95"
            />
          );
        })}
      </g>
      {/* Inner stamp rectangle */}
      <rect x="8" y="8" width="80" height="80" fill={POSTCARD_PAPER} />
      {/* Inner cream border */}
      <rect
        x="11"
        y="11"
        width="74"
        height="74"
        fill="none"
        stroke={fill}
        strokeWidth="0.6"
      />
      {/* Motif */}
      {motif === "rose" && (
        <g transform="translate(48 38)">
          <circle r="9" fill="none" stroke={fill} strokeWidth="0.8" />
          <path
            d="M0 -12 C 4 -6, 4 6, 0 12 C -4 6, -4 -6, 0 -12 Z"
            fill={fill}
            opacity="0.85"
          />
        </g>
      )}
      {motif === "heart" && (
        <path
          d="M48 50 C 42 44, 38 36, 42 32 C 46 28, 48 32, 48 32 C 48 32, 50 28, 54 32 C 58 36, 54 44, 48 50 Z"
          fill={fill}
          opacity="0.85"
        />
      )}
      {motif === "star" && (
        <path
          d="M48 28 L52 38 L62 38 L54 45 L57 55 L48 49 L39 55 L42 45 L34 38 L44 38 Z"
          fill={fill}
          opacity="0.85"
        />
      )}
      {motif === "fern" && (
        <g
          fill="none"
          stroke={fill}
          strokeWidth="1.2"
          transform="translate(48 36)"
        >
          <path d="M0 -12 C 0 0, 0 12, 0 12" />
          <path d="M0 -8 C -3 -6, -5 -4, -6 -2" />
          <path d="M0 -4 C -3 -2, -4 0, -4 2" />
          <path d="M0 0 C -3 2, -4 4, -4 6" />
          <path d="M0 4 C -3 6, -3 8, -2 10" />
          <path d="M0 -8 C 3 -6, 5 -4, 6 -2" />
          <path d="M0 -4 C 3 -2, 4 0, 4 2" />
          <path d="M0 0 C 3 2, 4 4, 4 6" />
          <path d="M0 4 C 3 6, 3 8, 2 10" />
        </g>
      )}
      {motif === "letter" && (
        <text
          x="48"
          y="48"
          fontSize="22"
          fontWeight="700"
          fontFamily="serif"
          fontStyle="italic"
          textAnchor="middle"
          fill={fill}
        >
          {value.split("·")[0].trim() || "N"}
        </text>
      )}
      {/* Value text */}
      <text
        x="48"
        y="78"
        fontSize="7"
        textAnchor="middle"
        fill={fill}
        fontFamily="serif"
        letterSpacing="1.8"
        fontWeight="700"
      >
        {value}
      </text>
      {/* Subtle paper texture noise overlay */}
      <rect
        x="8"
        y="8"
        width="80"
        height="80"
        fill="url(#stamp-noise)"
        opacity="0.10"
      />
      <defs>
        <filter id="stamp-noise">
          <feTurbulence
            baseFrequency="0.85"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix
            values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.5 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

// ── PostmarkReal — circular ink postmark with city + date arcs ──────
export function PostmarkReal({
  className,
  size = 110,
  city = "JAKARTA",
  date = "27 · VII",
  rotate = -8,
  ink = POSTCARD_INK,
}: {
  className?: string;
  size?: number;
  city?: string;
  date?: string;
  rotate?: number;
  ink?: string;
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <defs>
        <path
          id="pm-top-arc"
          d="M 18 60 A 42 42 0 0 1 102 60"
        />
        <path
          id="pm-bottom-arc"
          d="M 18 60 A 42 42 0 0 0 102 60"
        />
      </defs>
      {/* Outer + inner rings — softer faded postmark feel for vintage authenticity */}
      <circle cx="60" cy="60" r="44" fill="none" stroke={ink} strokeOpacity="0.62" strokeWidth="1.8" />
      <circle cx="60" cy="60" r="38" fill="none" stroke={ink} strokeOpacity="0.45" strokeWidth="0.6" />
      <text
        fontSize="9"
        letterSpacing="2.6"
        fontFamily="serif"
        fontWeight="700"
        fill={ink}
      >
        <textPath href="#pm-top-arc" startOffset="50%" textAnchor="middle">
          {city.toUpperCase()}
        </textPath>
      </text>
      <text
        fontSize="9"
        letterSpacing="2.4"
        fontFamily="serif"
        fontWeight="700"
        fill={ink}
      >
        <textPath href="#pm-bottom-arc" startOffset="50%" textAnchor="middle">
          · {date} ·
        </textPath>
      </text>
      {/* Central mono stamp body */}
      <text
        x="60"
        y="58"
        fontSize="11"
        textAnchor="middle"
        fill={ink}
        fontFamily="serif"
        letterSpacing="1.2"
        fontWeight="700"
      >
        POSTED
      </text>
      <text
        x="60"
        y="71"
        fontSize="6.5"
        textAnchor="middle"
        fill={ink}
        letterSpacing="1.4"
      >
        — BIRTHDAY —
      </text>
      {/* Smudge — random ink blobs */}
      <circle cx="34" cy="40" r="2.6" fill={ink} opacity="0.18" />
      <circle cx="88" cy="92" r="3.2" fill={ink} opacity="0.14" />
    </svg>
  );
}

// ── AddressLines — 3 dashed horizontal lines for postcard-back address ──
export function AddressLines({
  className,
  count = 3,
  ink = POSTCARD_INK,
}: {
  className?: string;
  count?: number;
  ink?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      {Array.from({ length: count }).map((_, i) => (
        <line
          key={i}
          x1="4"
          y1={14 + i * 26}
          x2="196"
          y2={14 + i * 26}
          stroke={ink}
          strokeWidth="1.4"
          strokeDasharray="7 4"
          opacity="0.78"
        />
      ))}
    </svg>
  );
}

// ── CoffeeStain — soft sepia blob ──────────────────────────────────
export function CoffeeStain({
  className,
  size = 120,
  position = 0,
}: {
  className?: string;
  size?: number;
  position?: 0 | 1 | 2 | 3; // 4 preset angles for variation
}) {
  const transforms = [
    "rotate(0deg)",
    "rotate(40deg)",
    "rotate(-25deg)",
    "rotate(75deg)",
  ];
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
      style={{
        transform: transforms[position] ?? "rotate(15deg)",
        opacity: 0.55,
      }}
    >
      <defs>
        <radialGradient id={`coffee-grad-${position}`} cx="42%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#a07650" stopOpacity="0" />
          <stop offset="60%" stopColor="#7d5a36" stopOpacity="0.20" />
          <stop offset="90%" stopColor="#5b3a32" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#5b3a32" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="36" fill={`url(#coffee-grad-${position})`} />
      {/* Outer rim for "stain" character */}
      <circle
        cx="40"
        cy="40"
        r="34"
        fill="none"
        stroke="#5b3a32"
        strokeOpacity="0.12"
        strokeWidth="0.8"
      />
      {/* Tiny secondary droplet */}
      <circle
        cx="60"
        cy="58"
        r="2"
        fill="#5b3a32"
        fillOpacity="0.35"
      />
    </svg>
  );
}

// ── CreaseMark — diagonal fold line with subtle 3D feel ────────────
export function CreaseMark({
  className,
  position = "horizontal",
  ink = POSTCARD_INK,
}: {
  className?: string;
  position?: "horizontal" | "vertical" | "diagonal";
  ink?: string;
}) {
  const paths = {
    horizontal: "M 0 50 L 100 50",
    vertical: "M 50 0 L 50 100",
    diagonal: "M 0 100 L 100 0",
  };
  return (
    <svg
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <line
        x1="0"
        y1="50"
        x2="100"
        y2="50"
        stroke={ink}
        strokeWidth="0.6"
        opacity="0.20"
      />
      <line
        x1="0"
        y1="51"
        x2="100"
        y2="51"
        stroke={ink}
        strokeWidth="0.4"
        opacity="0.10"
      />
    </svg>
  );
}

// ── PostcardEdges — aged paper wrapper with rounded corner + texture ──
export function PostcardEdges({
  className,
  rotation = 0,
  size = "w-[88vw] max-w-[640px]",
}: {
  className?: string;
  rotation?: number;
  size?: string;
}) {
  return (
    <div
      aria-hidden
      className={`${POINTER_NONE_CLASS} ${className ?? ""} ${size}`}
      style={{
        position: "relative",
        transform: `rotate(${rotation}deg)`,
        background:
          "linear-gradient(135deg, #f7ecd5 0%, #f0e0bf 60%, #e8d4a6 100%)",
        borderRadius: 4,
        boxShadow:
          "0 26px 50px rgba(120,80,40,0.18), 0 4px 10px rgba(120,80,40,0.10), inset 0 0 50px rgba(170,130,80,0.10)",
      }}
    >
      {/* Paper-grain noise overlay */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[4px] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper-grain-postcard'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='4' result='noise' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0.45 0 0 0 0 0.35 0 0 0 0 0.22 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23paper-grain-postcard)'/%3E%3C/svg%3E\")",
          opacity: 0.30,
          pointerEvents: "none",
        }}
      />
      {/* Faint edge wear (slight vignette) */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-[4px]"
        style={{
          boxShadow: "inset 0 0 60px rgba(120,80,40,0.10)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

// ── Envelope — full envelope with body + flap (open by default) ───
export function Envelope({
  className,
  size = 280,
  flapOpen = false,
  ink = POSTCARD_INK,
}: {
  className?: string;
  size?: number;
  flapOpen?: boolean;
  ink?: string;
}) {
  const W = 200;
  const H = 140;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={size}
      height={(size * H) / W}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <defs>
        <linearGradient id="env-paper" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7ecd5" />
          <stop offset="100%" stopColor="#ead7a6" />
        </linearGradient>
        <filter id="env-noise">
          <feTurbulence baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0.3 0" />
        </filter>
      </defs>
      {/* Envelope body */}
      <rect
        x="2"
        y={flapOpen ? 16 : 2}
        width={W - 4}
        height={H - 6}
        fill="url(#env-paper)"
        stroke={ink}
        strokeOpacity="0.4"
        strokeWidth="0.6"
        rx="2"
      />
      {/* Inside crease (V-fold bottom) */}
      <path
        d={`M 2 ${flapOpen ? H - 6 : H - 6} L ${W / 2} ${flapOpen ? H / 2 + 14 : H / 2 + 14} L ${W - 2} ${H - 6}`}
        fill="none"
        stroke={ink}
        strokeOpacity="0.18"
        strokeWidth="0.6"
      />
      {/* Front flap V shape (lower triangle) */}
      <path
        d={`M 2 ${H - 6} L ${W / 2} ${H / 2 + 14} L ${W - 2} ${H - 6}`}
        fill="#e8d4a6"
      />
      {/* Top flap — open or closed */}
      <path
        d={
          flapOpen
            ? `M 2 14 L ${W / 2} ${-10} L ${W - 2} 14 Z`
            : `M 2 2 L ${W / 2} ${H / 2 - 30} L ${W - 2} 2 Z`
        }
        fill={flapOpen ? "none" : "#d8c390"}
        stroke={ink}
        strokeOpacity="0.45"
        strokeWidth="0.6"
      />
      {/* Inside contents peeking (postcard hint) when open */}
      {flapOpen && (
        <>
          <rect
            x="22"
            y="36"
            width={W - 44}
            height={H - 56}
            fill="#fbf3df"
            stroke={ink}
            strokeOpacity="0.18"
            strokeWidth="0.5"
          />
          <line x1="40" y1="56" x2={W - 40} y2="56" stroke={ink} strokeOpacity="0.18" />
          <line x1="40" y1="76" x2={W - 40} y2="76" stroke={ink} strokeOpacity="0.18" />
          <line x1="40" y1="96" x2={W - 40} y2="96" stroke={ink} strokeOpacity="0.18" />
        </>
      )}
      {/* Subtle paper noise */}
      <rect x="2" y="2" width={W - 4} height={H - 6} fill="url(#env-noise)" opacity="0.18" />
      {/* Wax seal center (only when closed) */}
      {!flapOpen && (
        <g transform={`translate(${W / 2} ${H / 2 - 6})`}>
          <path
            d="M-12 0 C -10 -8, -6 -10, 0 -10 C 6 -10, 10 -8, 12 0 C 12 6, 4 10, 0 10 C -4 10, -12 6, -12 0 Z"
            fill="#7c2b22"
          />
          <text
            x="0"
            y="3"
            fontSize="8"
            fontWeight="700"
            fontFamily="serif"
            fontStyle="italic"
            textAnchor="middle"
            fill="#fbf3df"
          >
            N
          </text>
        </g>
      )}
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════════
// ── CELEBRATION SUITE: birthday-themed components below ──────────
// ════════════════════════════════════════════════════════════════════

// Celebration palette tokens. Kept warm/cream tones for text
// continuity, plus brighter accents for ornaments + bunting.
export const CELEBRATION_PINK = "#F8C8DC";
export const CELEBRATION_MINT = "#A8E6CF";
export const CELEBRATION_YELLOW = "#FFE066";
export const CELEBRATION_GOLD = "#FFC857";
export const CELEBRATION_LAVENDER = "#C5B7DA";
export const CELEBRATION_CORAL = "#FF8DA1";

// ── CelebrationSparkle — bigger, multi-colored glint star ─────────
export function CelebrationSparkle({
  className,
  size = 36,
  color = "#FFC857",
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      {/* Four-point glint */}
      <path
        d="M32 0 L36 22 L60 24 L36 32 L32 64 L28 32 L4 24 L28 22 Z"
        fill={color}
        opacity="0.95"
      />
      {/* Center dot */}
      <circle cx="32" cy="32" r="3" fill={color} />
      {/* Outer halo */}
      <circle
        cx="32"
        cy="32"
        r="14"
        fill="none"
        stroke={color}
        strokeOpacity="0.45"
        strokeWidth="1"
      />
    </svg>
  );
}

// ── BirthdayBalloon — round balloon with string, color variants ──
export function BirthdayBalloon({
  className,
  size = 64,
  color = "pink",
  stringLength = 90,
}: {
  className?: string;
  size?: number;
  color?: "pink" | "mint" | "yellow" | "lavender" | "coral" | "gold";
  stringLength?: number;
}) {
  const colorMap: Record<string, string> = {
    pink: "#F8C8DC",
    mint: "#A8E6CF",
    yellow: "#FFE066",
    lavender: "#C5B7DA",
    coral: "#FF8DA1",
    gold: "#FFC857",
  };
  const fill = colorMap[color];
  return (
    <svg
      viewBox={`0 0 ${size} ${size + stringLength}`}
      width={size}
      height={size + stringLength}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      {/* Balloon body */}
      <ellipse
        cx={size / 2}
        cy={size / 2}
        rx={size * 0.34}
        ry={size * 0.40}
        fill={fill}
      />
      {/* Highlight on balloon */}
      <ellipse
        cx={size * 0.38}
        cy={size * 0.40}
        rx={size * 0.10}
        ry={size * 0.14}
        fill="white"
        opacity="0.50"
      />
      {/* Knot */}
      <polygon
        points={`${size / 2 - 4},${size * 0.92} ${size / 2 + 4},${size * 0.92} ${size / 2},${size * 0.97}`}
        fill={fill}
      />
      {/* String */}
      <line
        x1={size / 2}
        y1={size * 0.97}
        x2={size / 2 + 4}
        y2={size + stringLength}
        stroke="#5C3A1E"
        strokeOpacity="0.40"
        strokeWidth="1"
      />
    </svg>
  );
}

// ── Streamer — spiral party ribbon ────────────────────────────────
export function Streamer({
  className,
  color = "#FF8DA1",
  width = 70,
  rotate = 12,
}: {
  className?: string;
  color?: string;
  width?: number;
  rotate?: number;
}) {
  return (
    <svg
      viewBox="0 0 60 220"
      width={width * 0.4}
      height={width * 1.6}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path
        d="M30 0 C 10 35, 50 60, 30 100 C 10 140, 50 170, 30 210"
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── ConfettiScatter — multi-color scattered confetti pieces ─────────
export function ConfettiScatter({
  className,
  count = 32,
  seed = 1,
}: {
  className?: string;
  count?: number;
  seed?: number;
}) {
  // deterministic-ish spread so SSR + client render the same
  const palette = [
    CELEBRATION_PINK,
    CELEBRATION_MINT,
    CELEBRATION_YELLOW,
    CELEBRATION_GOLD,
    CELEBRATION_CORAL,
    CELEBRATION_LAVENDER,
  ];
  const pieces = Array.from({ length: count }).map((_, i) => {
    const h = ((i * 73 + seed * 17) % 100);
    const v = ((i * 41 + seed * 23) % 100);
    const r = ((i * 31 + seed) % 360);
    const sz = 8 + ((i + seed) % 6);
    const color = palette[(i + seed) % palette.length];
    const shape = i % 3; // 0=rect, 1=circle, 2=tri
    return { i, h, v, r, sz, color, shape };
  });
  return (
    <div
      className={`${POINTER_NONE_CLASS} ${className ?? "absolute inset-0"}`}
      aria-hidden
    >
      {pieces.map(({ h, v, r, sz, color, shape, i }) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: `${h}%`,
            top: `${v}%`,
            width: sz,
            height: sz,
            background: shape === 0 ? color : "transparent",
            borderRadius: shape === 1 ? "50%" : shape === 2 ? "0%" : 0,
            borderTop: shape === 2 ? `${sz}px solid ${color}` : "none",
            borderRight: shape === 2
              ? `${sz / 2}px solid transparent`
              : "none",
            borderLeft: shape === 2
              ? `${sz / 2}px solid transparent`
              : "none",
            transform: `rotate(${r}deg)`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

// ── CakeWithCandles — celebration cake with N candles, blowable ───
// Updated (Feb 2026) to take a continuous `litLevel` (0..1) instead
// of a binary `candlesLit`. Each tap to blow drops the master
// brightness; per-candle phase offset gives natural flicker variation;
// the glow halo + flame fade together so the candles visibly dim
// (previously they snapped straight to off). When `litLevel < 0.05`,
// a small smoke wisp appears above each extinguished wick with a
// staggered delay so the candles don't all rise in unison.
export function CakeWithCandles({
  className,
  width = 360,
  litLevel = 1,
  candleCount = 16,
  candleColors = [
    "#FF8DA1",
    "#FFE066",
    "#A8E6CF",
    "#C5B7DA",
    "#FFC857",
  ],
  cakeMessage,
}: {
  className?: string;
  width?: number;
  /**
   * Master candle brightness, 0..1.
   *   1.0  — fully lit
   *   0.7  — first blow (mild dim, flicker)
   *   0.35 — second blow (heavily dim)
   *   0.0  — extinguished (smoke wisps visible)
   * Caller is responsible for tweening between these plateaus.
   */
  litLevel?: number;
  candleCount?: number;
  candleColors?: string[];
  cakeMessage?: string;
}) {
  const W = width;
  const H = width * 0.72;
  const count = Math.max(candleCount, 1);
  const candleSpacing = (W * 0.6) / count;
  const candleStart = W * 0.2 + candleSpacing / 2;
  // Per-candle phase so each flame reads slightly different and the
  // candles dim in a natural, layered way rather than snap together.
  // Range: -0.06..+0.06 keeps brightness in [0..1] after clamp.
  const phaseFor = (i: number): number => {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const frac = seed - Math.floor(seed); // 0..1
    return (frac - 0.5) * 0.12;
  };
  const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
  // Glow drops faster than flame so the warm halo fades
  // *before* the flame itself, matching a real puff-out feel.
  const glowScale = Math.pow(litLevel, 1.6);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      aria-hidden
    >
      <defs>
        {/* Cake layer fill — pink frosting */}
        <linearGradient id="cake-frosting" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8C8DC" />
          <stop offset="100%" stopColor="#E6A3BC" />
        </linearGradient>
        {/* Cake sponge fill */}
        <linearGradient id="cake-sponge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F5DEB3" />
          <stop offset="100%" stopColor="#D4A574" />
        </linearGradient>
        {/* Candle flame */}
        <radialGradient id="flame" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FFF3A6" />
          <stop offset="50%" stopColor="#FFC857" />
          <stop offset="100%" stopColor="#FF8DA1" stopOpacity="0" />
        </radialGradient>
        {/* Smoke wisp gradient — fades upward */}
        <linearGradient id="smoke-wisp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c6a5e" stopOpacity="0.0" />
          <stop offset="40%" stopColor="#7c6a5e" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#7c6a5e" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Cake stand shadow */}
      <ellipse
        cx={W / 2}
        cy={H * 0.98}
        rx={W * 0.42}
        ry={H * 0.04}
        fill="#5C3A1E"
        opacity="0.18"
      />

      {/* Top layer — frosting */}
      <rect
        x={W * 0.12}
        y={H * 0.40}
        width={W * 0.76}
        height={H * 0.18}
        rx="6"
        fill="url(#cake-frosting)"
        stroke="#7c2b22"
        strokeOpacity="0.25"
        strokeWidth="0.8"
      />
      {/* Bottom layer — sponge */}
      <rect
        x={W * 0.18}
        y={H * 0.58}
        width={W * 0.64}
        height={H * 0.30}
        rx="6"
        fill="url(#cake-sponge)"
        stroke="#7c2b22"
        strokeOpacity="0.25"
        strokeWidth="0.8"
      />
      {/* Drip detail on top layer */}
      {Array.from({ length: 7 }).map((_, i) => (
        <ellipse
          key={i}
          cx={W * (0.16 + i * 0.11)}
          cy={H * 0.43}
          rx={W * 0.025}
          ry={H * 0.045}
          fill="url(#cake-frosting)"
        />
      ))}

      {/* Cake topper message (text on cake) */}
      {cakeMessage && (
        <text
          x={W / 2}
          y={H * 0.55}
          fontSize={H * 0.10}
          fontWeight="700"
          fontFamily="serif"
          fontStyle="italic"
          textAnchor="middle"
          fill="#5C3A1E"
        >
          {cakeMessage}
        </text>
      )}

      {/* Candles — every candle drawn; flame + halo opacity drives off
          master litLevel + per-candle phase. Smoke wisp renders only
          when the dim phase has dropped below the extinguish threshold. */}
      {Array.from({ length: count }).map((_, i) => {
        const x = candleStart + i * candleSpacing;
        const candleHeight = H * 0.16;
        const candleTopY = H * 0.40 - candleHeight;
        // Force flame OFF at the extinguish threshold so candles whose
        // phase offset lands positive don't keep a faint 6 % flame.
        const flameOp =
          litLevel < 0.05 ? 0 : clamp01(litLevel + phaseFor(i));
        const haloOp =
          litLevel < 0.05 ? 0 : clamp01(glowScale + phaseFor(i) * 0.6);
        const extinguished = litLevel < 0.05;
        const candleColor = candleColors[i % candleColors.length];
        // Stagger smoke so wisps don't rise in lock-step.
        const smokeDelay = (i % 5) * 0.06;
        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={x}
              y1={candleTopY + 2}
              x2={x}
              y2={candleTopY - 4}
              stroke="#5C3A1E"
              strokeWidth="1.2"
              opacity={flameOp < 0.4 ? 0.5 : 1}
            />
            {/* Flame — opacity drives off litLevel */}
            <ellipse
              cx={x}
              cy={candleTopY - 8}
              rx={3}
              ry={6}
              fill="url(#flame)"
              opacity={flameOp}
              style={{ transition: "opacity 0.35s ease-out" }}
            />
            {/* Glow halo — drops faster than flame */}
            <circle
              cx={x}
              cy={candleTopY - 8}
              r={6}
              fill="#FFC857"
              opacity={haloOp * 0.3}
              style={{ transition: "opacity 0.35s ease-out" }}
            />
            {/* Candle body */}
            <rect
              x={x - 4}
              y={candleTopY}
              width="8"
              height={candleHeight}
              rx="1.5"
              fill={candleColor}
              stroke="#5C3A1E"
              strokeOpacity="0.30"
              strokeWidth="0.5"
            />
            {/* Candle stripe */}
            <line
              x1={x - 4}
              y1={candleTopY + candleHeight * 0.5}
              x2={x + 4}
              y2={candleTopY + candleHeight * 0.5}
              stroke="#FFFFFF"
              strokeOpacity="0.55"
              strokeWidth="1"
            />
            {/* Smoke wisp — only rendered below extinguish threshold */}
            {extinguished && (
              <path
                d={`M ${x} ${candleTopY - 6}
                    Q ${x - 3} ${candleTopY - 22} ${x} ${candleTopY - 32}
                    Q ${x + 4} ${candleTopY - 44} ${x - 1} ${candleTopY - 56}`}
                fill="none"
                stroke="url(#smoke-wisp)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  animation: `cakeSmoke 1.6s ease-out ${smokeDelay}s forwards`,
                  opacity: 0,
                }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Vinyl disc (rotating record — small accent in scrapbook / hero) ─
export function VinylDisc({
  className,
  size = 80,
  rotation = 0,
}: {
  className?: string;
  size?: number;
  /** Rotation in degrees. Parent updates each frame to sync with BGM cumulative time. */
  rotation?: number;
}) {
  return (
    <span
      aria-hidden
      className={`${POINTER_NONE_CLASS} ${className ?? ""}`}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        transform: `rotate(${rotation}deg)`,
        transition: "transform 60ms linear",
        filter: "drop-shadow(0 4px 8px rgba(58,37,17,0.30))",
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id="vinyl-shade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3a2511" />
            <stop offset="42%" stopColor="#1a0e07" />
            <stop offset="100%" stopColor="#0a0604" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#vinyl-shade)" />
        {[40, 35, 30, 25, 20].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="#000"
            strokeOpacity="0.35"
            strokeWidth="0.4"
          />
        ))}
        <circle cx="50" cy="50" r="14" fill="#c1476b" />
        <circle cx="50" cy="50" r="11" fill="#7c2b22" />
        <circle cx="50" cy="50" r="2" fill="#fff" />
      </svg>
    </span>
  );
}
