/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { SCRAPBOOK_THEMES } from '../../utils/stickerThemes';

// ── Dark/Light color helpers ────────────────────────────────────────────────
const DM = {
  paper: '#2A221C',
  border: '#4A3A2A',
  accent: '#6A5A4A',
  text: '#A09070',
  green: '#3A5A3A',
  gold: '#8A7A3A',
  red: '#8A4040',
  white: '#C8B8A0',
  cream: '#3A3028',
  stampFill: '#3A3028',
  stampStroke: '#5A4A3A',
  stampText: '#8A7A6A',
  mountain: '#5A4A3A',
  sun: '#8A7A3A',
  daisyCenter: '#8A7A3A',
  daisyStroke: '#5A4A3A',
  daisyPetal: '#3A3028',
  starFill: '#6A5A3A',
  starStroke: '#4A3A2A',
  ticketBg: '#3A3028',
  ticketStroke: '#5A4A3A',
  ticketText: '#8A7A6A',
  gridLine: '#5A4A3A',
  gridText: '#6A5A3A',
};

const LM = {
  paper: '#FAF6EC',
  border: '#D2C6A3',
  accent: '#8B7355',
  text: '#4E3B24',
  green: '#2D5A27',
  gold: '#D97706',
  red: '#F43F5E',
  white: '#FFFFFF',
  cream: '#FFFDF9',
  stampFill: '#FAF6EC',
  stampStroke: '#D2C6A3',
  stampText: '#4E3B24',
  mountain: '#8B7355',
  sun: '#D97706',
  daisyCenter: '#D97706',
  daisyStroke: '#8B7355',
  daisyPetal: '#FFFDF9',
  starFill: '#D4AF37',
  starStroke: '#8B7355',
  ticketBg: '#FFFDF5',
  ticketStroke: '#8B7355',
  ticketText: '#8B7355',
  gridLine: '#8B7355',
  gridText: '#2D5A27',
};

// Dark mode aware SVG sticker components
interface StickerProps {
  className?: string;
  darkMode?: boolean;
}

// STICKER 1: Striped Washi Tape with torn serrated edges
const StripedWashiTape = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M5 2 L 8 4 L 6 8 L 9 12 L 6 16 L 8 20 L 5 24 L 8 28 L 6 32 L 9 36 L 5 38 L 115 38 L 112 34 L 114 30 L 111 26 L 114 22 L 111 18 L 114 14 L 111 10 L 113 6 L 111 2 Z"
        fill={C.paper}
        stroke={C.border}
        strokeWidth="1"
        fillOpacity="0.85"
      />
      <path d="M15 2 L25 38 M35 2 L45 38 M55 2 L65 38 M75 2 L85 38 M95 2 L105 38" stroke={C.green} strokeWidth="4" strokeOpacity="0.2" strokeLinecap="round" />
      <path d="M20 2 L30 38 M40 2 L50 38 M60 2 L70 38 M80 2 L90 38 M100 2 L110 38" stroke={C.gold} strokeWidth="2" strokeOpacity="0.15" strokeLinecap="round" />
    </svg>
  );
};

// STICKER 2: Ginkgo Leaf Sticker (Organic botanical press)
const GinkgoLeafSticker = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="25" cy="25" r="23" fill={C.paper} fillOpacity="0.6" stroke={C.border} strokeWidth="1" strokeDasharray="2 2" />
      <path
        d="M25 42 C24 35 23 28 25 25 C18 24 10 18 8 13 C12 11 18 13 22 17 C23 15 23 9 25 5 C27 9 27 15 28 17 C32 13 38 11 42 13 C40 18 32 24 25 25"
        stroke={C.accent}
        fill={C.green}
        fillOpacity="0.5"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// STICKER 3: Vintage Post Stamp (classic perforated edges)
const VintageStamp = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 60 70" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M 5 5
           Q 7.5 5 10 5 Q 12.5 5 15 5 Q 17.5 5 20 5 Q 22.5 5 25 5 Q 27.5 5 30 5 Q 32.5 5 35 5 Q 37.5 5 40 5 Q 42.5 5 45 5 Q 47.5 5 50 5 L 55 5
           V 10 Q 55 12.5 55 15 Q 55 17.5 55 20 Q 55 22.5 55 25 Q 55 27.5 55 30 Q 55 32.5 55 35 Q 55 37.5 55 40 Q 55 42.5 55 45 Q 55 47.5 55 50 Q 55 52.5 55 55 Q 55 57.5 55 60 L 55 65
           H 50 Q 47.5 65 45 65 Q 42.5 65 40 65 Q 37.5 65 35 65 Q 32.5 65 30 65 Q 27.5 65 25 65 Q 22.5 65 20 65 Q 17.5 65 15 65 Q 12.5 65 10 65 L 5 65
           V 60 Q 5 57.5 5 55 Q 5 52.5 5 50 Q 5 47.5 5 45 Q 5 42.5 5 40 Q 5 37.5 5 35 Q 5 32.5 5 30 Q 5 27.5 5 25 Q 5 22.5 5 20 Q 5 17.5 5 15 Q 5 12.5 5 10 Z"
        fill={C.stampFill}
        stroke={C.stampStroke}
        strokeWidth="1.2"
      />
      <rect x="8" y="8" width="44" height="54" fill={C.green} fillOpacity="0.08" stroke={C.stampText} strokeWidth="0.8" strokeDasharray="1 2" rx="1" />
      {/* Mini hand-sketched mountain and cloud */}
      <path d="M15 48 L25 35 L32 42 L40 32 L45 48 Z" fill={C.mountain} fillOpacity="0.4" stroke={C.mountain} strokeWidth="1" />
      <circle cx="22" cy="22" r="4" fill={C.sun} fillOpacity="0.6" />
      <path d="M28 20 C32 20 34 23 38 23" stroke={C.mountain} strokeWidth="1" strokeLinecap="round" />
      {/* Wavy Postmark line */}
      <path d="M6 25 Q 20 18, 40 30 T 54 25" stroke={C.stampText} strokeWidth="1" strokeOpacity="0.3" />
      <text x="14" y="58" fill={C.stampText} fontSize="5" fontFamily="monospace" fontWeight="bold" opacity="0.6">AETHER AIRMAIL</text>
    </svg>
  );
};

// STICKER 4: Weather Ticket Stub
const TicketStub = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 80 45" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M 5 5
           H 75
           A 4 4 0 0 1 75 13
           V 15
           A 5 5 0 0 0 75 25
           V 32
           A 4 4 0 0 1 75 40
           H 5
           A 4 4 0 0 1 5 32
           V 25
           A 5 5 0 0 0 5 15
           V 13
           A 4 4 0 0 1 5 5
           Z"
        fill={C.ticketBg}
        stroke={C.ticketStroke}
        strokeWidth="1"
      />
      <line x1="22" y1="5" x2="22" y2="40" stroke={C.ticketStroke} strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <text x="13" y="30" fill={C.ticketStroke} fontSize="7" fontFamily="monospace" fontWeight="bold" transform="rotate(-90 13 30)">N°77</text>
      <text x="28" y="18" fill={C.green} fontSize="8" fontFamily="sans-serif" fontWeight="black">COZY CABIN</text>
      <text x="28" y="28" fill={C.ticketText} fontSize="6" fontFamily="sans-serif">WEATHER REPORT</text>
      <text x="28" y="37" fill={C.gold} fontSize="5" fontFamily="monospace" fontWeight="bold">★ ONE FINE DAY ★</text>
    </svg>
  );
};

// STICKER 5: Folk Art Gold Star
const FolkArtStar = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M20 2 L24 15 L38 15 L27 23 L31 36 L20 28 L9 36 L13 23 L2 15 L16 15 Z"
        fill={C.starFill}
        stroke={C.starStroke}
        strokeWidth="1.2"
        fillOpacity="0.9"
      />
      <circle cx="20" cy="20" r="3.5" fill={C.paper} stroke={C.starStroke} strokeWidth="1" />
    </svg>
  );
};

// STICKER 6: Pressed Daisy Flower with clear tape crossover
const PressedDaisy = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8 8 L42 42" stroke={C.white} strokeWidth="10" strokeOpacity="0.4" strokeLinecap="square" />
      <circle cx="25" cy="25" r="4.5" fill={C.daisyCenter} stroke={C.daisyStroke} strokeWidth="1" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <g key={i} transform={`rotate(${angle} 25 25)`}>
          <path
            d="M25 20 C23 13 24 7 25 7 C26 7 27 13 25 20"
            fill={C.daisyPetal}
            stroke={C.daisyStroke}
            strokeWidth="0.8"
            fillOpacity="0.9"
          />
        </g>
      ))}
    </svg>
  );
};

// STICKER 7: Grid Washi Tape Piece (vintage notebook style)
const GridWashiTape = ({ className, darkMode }: StickerProps) => {
  const C = darkMode ? DM : LM;
  return (
    <svg viewBox="0 0 100 35" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M3 2 L 6 5 L 4 9 L 7 13 L 4 17 L 7 21 L 4 25 L 7 29 L 3 33 L 97 33 L 94 29 L 96 25 L 93 21 L 96 17 L 93 13 L 95 9 L 92 5 L 95 2 Z"
        fill={C.paper}
        stroke={C.border}
        strokeWidth="0.8"
        fillOpacity="0.9"
      />
      {/* Notebook Grid lines */}
      <path d="M10 2 V33 M20 2 V33 M30 2 V33 M40 2 V33 M50 2 V33 M60 2 V33 M70 2 V33 M80 2 V33 M90 2 V33" stroke={C.gridLine} strokeWidth="0.5" strokeOpacity="0.15" />
      <path d="M3 8 H97 M3 15 H97 M3 22 H97 M3 29 H97" stroke={C.gridLine} strokeWidth="0.5" strokeOpacity="0.15" />
      {/* Cute cursive handwritten text "atmos" */}
      <text x="32" y="21" fill={C.gridText} fontSize="10" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" opacity="0.65">atmos</text>
    </svg>
  );
};

const STICKERS_POOL = [
  { id: 'washi-stripe', Component: StripedWashiTape, width: 'w-24', height: 'h-8' },
  { id: 'ginkgo', Component: GinkgoLeafSticker, width: 'w-11', height: 'h-11' },
  { id: 'stamp', Component: VintageStamp, width: 'w-12', height: 'h-14' },
  { id: 'ticket', Component: TicketStub, width: 'w-16', height: 'h-10' },
  { id: 'star', Component: FolkArtStar, width: 'w-10', height: 'h-10' },
  { id: 'daisy', Component: PressedDaisy, width: 'w-12', height: 'h-12' },
  { id: 'washi-grid', Component: GridWashiTape, width: 'w-22', height: 'h-8' },
];

export interface VintageStickersDecorationProps {
  seed: string;
  className?: string;
  corners?: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>;
  themeId?: string;
  darkMode?: boolean;
}

export default function VintageStickersDecoration({
  seed,
  className = '',
  corners = ['top-left', 'top-right'],
  themeId,
  darkMode = false,
}: VintageStickersDecorationProps) {
  // Stable pseudo-random selection based on seed so they don't change on state recalculations
  const selectedStickers = useMemo(() => {
    // Basic hash helper
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Determine stickers pool to use based on theme
    let pool = [...STICKERS_POOL];
    if (themeId) {
      const activeTheme = SCRAPBOOK_THEMES.find(t => t.id === themeId);
      if (activeTheme && activeTheme.stickersPriority) {
        // Sort priority stickers to the front or build a specialized pool
        const priority = activeTheme.stickersPriority;
        const priorityItems = STICKERS_POOL.filter(item => priority.includes(item.id));
        const otherItems = STICKERS_POOL.filter(item => !priority.includes(item.id));
        pool = [...priorityItems, ...otherItems];
      }
    }

    return corners.map((corner, index) => {
      // Pick a sticker from pool
      const stickerIdx = Math.abs((hash + index * 17)) % pool.length;
      const sticker = pool[stickerIdx];

      // Give it a random gentle rotation and slight offset for scrapbooking charm
      const rotation = ((hash + index * 29) % 30) - 15; // -15deg to 15deg
      const offsetX = ((hash + index * 41) % 12) - 6; // -6px to 6px
      const offsetY = ((hash + index * 53) % 12) - 6; // -6px to 6px

      return {
        corner,
        sticker,
        rotation,
        offsetX,
        offsetY
      };
    });
  }, [seed, corners, themeId]);

  const getCornerPositionClasses = (corner: string) => {
    switch (corner) {
      case 'top-left':
        return 'absolute top-0 left-0 -translate-x-1/3 -translate-y-1/3';
      case 'top-right':
        return 'absolute top-0 right-0 translate-x-1/3 -translate-y-1/3';
      case 'bottom-left':
        return 'absolute bottom-0 left-0 -translate-x-1/3 translate-y-1/3';
      case 'bottom-right':
        return 'absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3';
      default:
        return 'absolute top-0 left-0';
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none z-30 ${className}`}>
      {selectedStickers.map(({ corner, sticker, rotation, offsetX, offsetY }, index) => {
        const { Component, width, height } = sticker;

        return (
          <motion.div
            key={`${corner}-${index}`}
            className={`${getCornerPositionClasses(corner)} ${width} ${height} select-none drop-shadow-md pointer-events-auto cursor-help`}
            style={{
              rotate: `${rotation}deg`,
              x: offsetX,
              y: offsetY
            }}
            whileHover={{
              scale: 1.1,
              rotate: rotation + (rotation > 0 ? 5 : -5),
              transition: { type: 'spring', stiffness: 350, damping: 10 }
            }}
          >
            <Component className="w-full h-full" darkMode={darkMode} />
          </motion.div>
        );
      })}
    </div>
  );
}
