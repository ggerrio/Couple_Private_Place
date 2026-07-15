/**
 * ConfettiEffect.tsx — Lightweight confetti celebration
 * Triggers on anniversary, birthday, and special occasions.
 * Fires DOM-based particles (no canvas dependency).
 */

import React, { useEffect, useRef, useCallback, useState } from "react";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  scale: number;
  emoji: string;
  delay: number;
}

const CONFETTI_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff8fab", "#c084fc", "#fb923c"];
const CONFETTI_EMOJIS = ["🎉", "🎊", "💖", "✨", "🌸", "🌟", "🥳", "🎀", "💕", "❤️"];

interface ConfettiEffectProps {
  /** Trigger confetti when this becomes true */
  active: boolean;
  /** Number of particles (default 40) */
  count?: number;
  /** Duration in ms (default 4000) */
  duration?: number;
}

export function ConfettiEffect({ active, count = 40, duration = 4000 }: ConfettiEffectProps) {
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fire = useCallback(() => {
    const newParticles: ConfettiParticle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 1.0,
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
        delay: Math.random() * 0.3,
      });
    }
    setParticles(newParticles);

    // Clear after animation
    setTimeout(() => setParticles([]), duration);

    // Fire bursts over time
    let burstCount = 0;
    intervalRef.current = setInterval(() => {
      burstCount++;
      if (burstCount >= 3) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      const burst: ConfettiParticle[] = [];
      for (let i = 0; i < Math.floor(count / 3); i++) {
        burst.push({
          id: Date.now() + i + burstCount * 1000,
          x: Math.random() * 100,
          y: -5 - Math.random() * 10,
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          rotation: Math.random() * 360,
          scale: 0.4 + Math.random() * 0.8,
          emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
          delay: Math.random() * 0.3,
        });
      }
      setParticles((prev) => [...prev, ...burst]);
    }, 800);
  }, [count, duration]);

  useEffect(() => {
    if (active) {
      fire();
      // Prevent re-fire on same active (cleanup handled)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, fire]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            color: p.color,
            fontSize: `${16 + Math.random() * 18}px`,
            transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}

/**
 * useConfetti — Hook to trigger confetti on special dates
 * Returns { fireConfetti, isTodayAnniversary, isTodayBirthday }
 */
export function useConfetti(anniversaryDate: string, birthdayA: string, birthdayB: string) {
  const [hasFiredToday, setHasFiredToday] = useState(false);

  const today = new Date();
  const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

  const isTodayAnniversary = (() => {
    if (!anniversaryDate) return false;
    const d = new Date(anniversaryDate);
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  })();

  const isTodayBirthdayA = birthdayA === todayStr;
  const isTodayBirthdayB = birthdayB === todayStr;

  const fireConfetti = useCallback(() => {
    if (hasFiredToday) return;
    setHasFiredToday(true);
    // Return a ref to trigger ConfettiEffect
  }, [hasFiredToday]);

  return {
    fireConfetti,
    isTodayAnniversary,
    isTodayBirthday: isTodayBirthdayA || isTodayBirthdayB,
    hasFiredToday,
    setHasFiredToday,
  };
}
