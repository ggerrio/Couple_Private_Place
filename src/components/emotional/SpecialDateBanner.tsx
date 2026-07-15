/**
 * SpecialDateBanner.tsx — Anniversary & Birthday celebration banners
 * Shows a special banner with decorations when today is anniversary or birthday.
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { Cake, Heart, Gift, Sparkles } from "lucide-react";

export function SpecialDateBanner() {
  const { anniversaryDate, birthdayA, birthdayB, userA, userB } = useCouple();
  const [dismissed, setDismissed] = useState(false);

  const today = new Date();
  const todayStr = `${today.getMonth() + 1}-${today.getDate()}`;

  const isAnniversary = (() => {
    if (!anniversaryDate) return false;
    const d = new Date(anniversaryDate);
    return !isNaN(d.getTime()) && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  })();

  const isBirthdayA = birthdayA === todayStr;
  const isBirthdayB = birthdayB === todayStr;
  const yearsTogether = isAnniversary && anniversaryDate
    ? today.getFullYear() - new Date(anniversaryDate).getFullYear()
    : 0;

  // Reset dismiss state when date changes
  useEffect(() => {
    setDismissed(false);
  }, [todayStr]);

  if (dismissed) return null;

  // Priority: Anniversary > Birthday
  if (isAnniversary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border-2 border-rose-300/50 bg-gradient-to-br from-rose-100 via-pink-50 to-rose-100 p-5 sm:p-6 mb-4 text-center"
      >
        {/* Decorative corner hearts */}
        <span className="absolute top-2 left-3 text-xl opacity-30 animate-float" aria-hidden="true">💖</span>
        <span className="absolute top-2 right-3 text-xl opacity-30 animate-float" style={{ animationDelay: "0.5s" }} aria-hidden="true">💖</span>
        <span className="absolute bottom-2 left-3 text-xl opacity-30 animate-float" style={{ animationDelay: "1s" }} aria-hidden="true">💖</span>
        <span className="absolute bottom-2 right-3 text-xl opacity-30 animate-float" style={{ animationDelay: "1.5s" }} aria-hidden="true">💖</span>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 rounded-full border border-rose-200/50 mb-3 shadow-xs">
            <Heart className="w-4 h-4 text-rose-500 fill-current animate-heartbeat" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
              Happy Anniversary! 🎉
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-800">
            {yearsTogether > 0
              ? `Celebrating ${yearsTogether} wonderful year${yearsTogether > 1 ? "s" : ""} together!`
              : "Celebrating our first year together!"}
          </h3>
          <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            {yearsTogether >= 5
              ? "Half a decade of love, laughter, and countless memories. Here's to many more! 🥂"
              : yearsTogether >= 3
              ? "Three years of growing together. Every moment has been a treasure. 💕"
              : "Every day with you is a gift. Happy anniversary, my love! 💝"}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="mt-3 text-[10px] font-bold text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            Dismiss 💕
          </button>
        </div>
      </motion.div>
    );
  }

  if (isBirthdayA || isBirthdayB) {
    const birthdayPerson = isBirthdayA ? userA.name.split(" ")[0] : userB.name.split(" ")[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border-2 border-amber-300/50 bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 p-5 sm:p-6 mb-4 text-center"
      >
        {/* Decorative elements */}
        <span className="absolute -top-4 -left-4 text-4xl opacity-20" aria-hidden="true">🎂</span>
        <span className="absolute -bottom-4 -right-4 text-4xl opacity-20" aria-hidden="true">🎁</span>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 rounded-full border border-amber-200/50 mb-3 shadow-xs">
            <Cake className="w-4 h-4 text-amber-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700">
              Happy Birthday! 🎉
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-800">
            Happy Birthday, {birthdayPerson}! 🎂
          </h3>
          <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
            Wishing the most wonderful person in my universe the happiest birthday ever!
            Here's to another year of beautiful memories together. 🎈✨
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-lg">
            <span>🎈</span> <span>🎉</span> <span>🎁</span> <span>🎊</span> <span>🎈</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="mt-2 text-[10px] font-bold text-amber-500 hover:text-amber-700 transition-colors cursor-pointer"
          >
            Thank you! 🎉
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}
