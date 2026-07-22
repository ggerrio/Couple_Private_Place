/**
 * ScrapbookConfetti.tsx
 *
 * Confetti effect with a scrapbook palette (cream, cocoa, sage,
 * dusty rose, blush, gold) tuned to match the birthday experience's
 * warm treehouse aesthetic. Distinct from the global ConfettiEffect
 * (which uses the project's birthday/anniversary rainbow palette)
 * so other modules stay untouched.
 *
 * Triggered on the final photo slide AND at the end of the ending
 * scene for a layered double-burst finale.
 */

import React, { useEffect, useRef, useState } from "react";

interface ScrapConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  emoji: string;
  delay: number;
  driftX: number;
}

const SCRAP_COLORS = [
  "#f7e8c5", // warm cream
  "#e8b4b8", // dusty rose
  "#b7c9a8", // sage
  "#d4a574", // tan
  "#c5b7da", // lavender
  "#e5c66b", // soft gold
  "#c08a8a", // muted crimson
];

const SCRAP_EMOJIS = ["✦", "❀", "♡", "✿", "❋", "✾", "·"];

interface ScrapbookConfettiProps {
  active: boolean;
  count?: number;
  duration?: number;
}

export function ScrapbookConfetti({
  active,
  count = 60,
  duration = 5000,
}: ScrapbookConfettiProps) {
  const [particles, setParticles] = useState<ScrapConfettiParticle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fire = () => {
    const burst: ScrapConfettiParticle[] = [];
    for (let i = 0; i < count; i++) {
      burst.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: SCRAP_COLORS[Math.floor(Math.random() * SCRAP_COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.55 + Math.random() * 0.85,
        emoji: SCRAP_EMOJIS[Math.floor(Math.random() * SCRAP_EMOJIS.length)],
        delay: Math.random() * 0.4,
        driftX: (Math.random() - 0.5) * 30,
      });
    }
    setParticles(burst);

    setTimeout(() => setParticles([]), duration);

    let burstCount = 0;
    intervalRef.current = setInterval(() => {
      burstCount++;
      if (burstCount >= 2) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const second: ScrapConfettiParticle[] = [];
      for (let i = 0; i < Math.floor(count / 2); i++) {
        second.push({
          id: Date.now() + i + burstCount * 1000,
          x: Math.random() * 100,
          y: -8 - Math.random() * 15,
          color: SCRAP_COLORS[Math.floor(Math.random() * SCRAP_COLORS.length)],
          rotation: Math.random() * 360,
          scale: 0.45 + Math.random() * 0.7,
          emoji: SCRAP_EMOJIS[Math.floor(Math.random() * SCRAP_EMOJIS.length)],
          delay: Math.random() * 0.4,
          driftX: (Math.random() - 0.5) * 30,
        });
      }
      setParticles((prev) => [...prev, ...second]);
    }, 700);
  };

  useEffect(() => {
    if (active) {
      fire();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            color: p.color,
            fontSize: `${14 + Math.random() * 18}px`,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${3 + Math.random() * 3}s`,
            ["--drift-x" as string]: `${p.driftX}vw`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
