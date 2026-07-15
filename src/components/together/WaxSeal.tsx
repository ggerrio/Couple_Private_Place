import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { triggerHaptic } from "../../lib/haptics";

interface WaxSealProps {
  status: "sealed" | "melting" | "melted";
  onMelt: () => void;
  darkMode?: boolean;
}

export const WaxSeal: React.FC<WaxSealProps> = ({ status, onMelt, darkMode = false }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number; scale: number }[]>([]);

  // Generate crackle particles during melting
  useEffect(() => {
    if (status === "melting") {
      const interval = setInterval(() => {
        setParticles((prev) => [
          ...prev.slice(-15), // limit count
          {
            id: Math.random(),
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 40,
            delay: Math.random() * 0.2,
            scale: 0.5 + Math.random() * 0.8,
          },
        ]);
      }, 120);

      return () => clearInterval(interval);
    } else {
      setParticles([]);
    }
  }, [status]);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center select-none" id="wax-seal-wrapper">
      {/* SVG Warp Filter for Organic Organic Melting Effect */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <filter id="wax-melt-filter">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <AnimatePresence mode="popLayout">
        {status === "sealed" && (
          <motion.button
            key="sealed-seal"
            id="wax-seal-button"
            onClick={() => {
              triggerHaptic("heavy");
              onMelt();
            }}
            whileHover={{ scale: 1.06, rotate: 1 }}
            whileTap={{ scale: 0.94 }}
            className="w-32 h-32 rounded-full relative focus:outline-none flex items-center justify-center cursor-pointer"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Outer wax overflow rim */}
            <div className="absolute inset-0 rounded-full bg-red-700/90 dark:bg-red-800/95 shadow-[0_6px_20px_rgba(153,27,27,0.45),_inset_0_4px_10px_rgba(255,255,255,0.25)] border-2 border-red-800/60 flex items-center justify-center transform scale-105" />

            {/* Middle decorative concentric wax ring */}
            <div className="absolute inset-2.5 rounded-full bg-red-800/95 dark:bg-red-900 border border-red-600/40 shadow-inner flex items-center justify-center">
              {/* Inner stamp surface */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-b from-red-600 via-red-700 to-red-800/90 border border-red-500/20 shadow-[0_2px_4px_rgba(0,0,0,0.3),_inset_0_2px_6px_rgba(255,255,255,0.15)] flex flex-col items-center justify-center">
                
                {/* Vintage Crest Motif inside stamp */}
                <div className="absolute inset-1.5 rounded-full border border-dashed border-red-500/25 flex items-center justify-center">
                  <span className="text-4xl filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] transform -translate-y-0.5 animate-pulse">❤️</span>
                </div>

                {/* Microscopic text around outer crest rim */}
                <span className="absolute text-[6px] font-sans font-bold tracking-widest text-red-300/40 uppercase rotate-0 bottom-2.5">
                  SEALED LOVE
                </span>
              </div>
            </div>

            {/* Highlight/glowing ring effect on hover */}
            <div className="absolute inset-0 rounded-full bg-amber-400/0 hover:bg-amber-400/5 border-2 border-transparent hover:border-amber-400/30 transition-all duration-300 rounded-full" />
          </motion.button>
        )}

        {status === "melting" && (
          <motion.div
            key="melting-seal"
            id="wax-seal-melting-wrapper"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.08, 1.15, 0.5] }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className="w-32 h-32 relative flex items-center justify-center"
          >
            {/* The main melting pool with SVG noise distortion filter */}
            <div 
              className="absolute inset-0 rounded-full bg-red-600 dark:bg-red-700 shadow-[inset_0_4px_12px_rgba(0,0,0,0.4)] border border-red-500 animate-pulse"
              style={{ filter: "url(#wax-melt-filter)" }}
            />

            {/* Melting Center Glow */}
            <div className="absolute inset-4 rounded-full bg-radial-gradient from-amber-400/40 via-red-600/60 to-red-800/80 blur-xs" />

            {/* Golden hot wax center core */}
            <motion.div 
              animate={{ scale: [1, 1.3, 1.6, 2], opacity: [0.8, 1, 0.9, 0] }}
              transition={{ duration: 1.8, ease: "linear" }}
              className="absolute w-12 h-12 rounded-full bg-gradient-to-r from-amber-300 via-orange-500 to-red-600 mix-blend-screen blur-xs"
            />

            {/* Drips sliding downwards */}
            <motion.div
              animate={{ y: [0, 24, 48], opacity: [1, 0.9, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-4 h-12 bg-red-700 rounded-b-full shadow-md"
              style={{ top: "40%", filter: "url(#wax-melt-filter)" }}
            />
            <motion.div
              animate={{ y: [0, 16, 32], opacity: [1, 0.8, 0] }}
              transition={{ duration: 0.9, delay: 0.3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-2.5 h-8 bg-red-600 rounded-b-full shadow-sm left-[35%]"
              style={{ top: "45%", filter: "url(#wax-melt-filter)" }}
            />
            <motion.div
              animate={{ y: [0, 20, 40], opacity: [1, 0.8, 0] }}
              transition={{ duration: 1.1, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-3 h-10 bg-red-800 rounded-b-full shadow-sm right-[32%]"
              style={{ top: "42%", filter: "url(#wax-melt-filter)" }}
            />

            {/* Crackling Sparkle/Heat Particles */}
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: p.x, y: p.y + 10, opacity: 1, scale: p.scale }}
                animate={{ 
                  y: p.y - 60, 
                  x: p.x + (Math.random() - 0.5) * 30, 
                  opacity: 0,
                  rotate: 360,
                  scale: 0 
                }}
                transition={{ duration: 1.2, delay: p.delay, ease: "easeOut" }}
                className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-r from-amber-300 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              />
            ))}

            {/* Falling wax droplets */}
            <motion.div
              animate={{ y: [0, 40, 80], scale: [1, 0.8, 0], opacity: [1, 0.9, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeIn" }}
              className="absolute w-2 h-2 rounded-full bg-red-500 shadow-inner"
              style={{ top: "60%", left: "48%" }}
            />

            {/* Steam/Smoke indicators */}
            <motion.div
              animate={{ y: [0, -35], opacity: [0, 0.35, 0], scale: [0.8, 1.4, 0.5] }}
              transition={{ duration: 1.4, repeat: Infinity }}
              className="absolute w-8 h-8 rounded-full bg-white/20 dark:bg-white/10 blur-md pointer-events-none"
              style={{ top: "-10%" }}
            />

            {/* Disintegrated central logo */}
            <span className="text-3xl z-30 animate-pulse filter blur-xs select-none">🕯️</span>
          </motion.div>
        )}

        {status === "melted" && (
          <motion.div
            key="melted-seal"
            id="wax-seal-melted-wrapper"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: [1.2, 1], rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center justify-center space-y-2"
          >
            {/* Liquid wax residue splatters */}
            <div className="absolute w-36 h-36 rounded-full bg-red-800/10 dark:bg-red-900/15 filter blur-md transform scale-110 pointer-events-none" />
            
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="text-5xl filter drop-shadow-[0_4px_10px_rgba(16,185,129,0.4)] z-30 select-none"
            >
              📬
            </motion.div>

            <span className="text-[9px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 dark:bg-emerald-400/5 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Seal Melted!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
