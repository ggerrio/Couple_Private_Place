/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface WashiTapeProps {
  pattern: 'striped' | 'grid' | 'botanical' | 'plaid' | 'stars' | 'lace';
  color: string;
  className?: string;
  width?: string;
  height?: string;
  darkMode?: boolean;
}

export default function WashiTape({
  pattern,
  color,
  className = '',
  width = 'w-24',
  height = 'h-6',
  darkMode = false,
}: WashiTapeProps) {
  // Dark mode color palette — warm dark paper tones instead of light cream
  const DM = {
    paper: '#2A221C',
    paperBorder: '#4A3A2A',
    accent: '#8A7A5A',
    text: '#A09070',
    lines: '#6A5A4A',
  };
  const LM = {
    paper: '#FFFBEB',
    paperBorder: '#D2C6A3',
    accent: '#D97706',
    text: '#2D5A27',
    lines: '#8B7355',
  };
  const C = darkMode ? DM : LM;
  const shadow = darkMode ? 'drop-shadow-[1px_2px_1px_rgba(0,0,0,0.25)]' : 'drop-shadow-[1px_2px_1px_rgba(0,0,0,0.08)]';
  const shadowLace = darkMode ? 'drop-shadow-[1px_2px_1px_rgba(0,0,0,0.25)]' : 'drop-shadow-[1px_2px_1px_rgba(0,0,0,0.06)]';

  // Render a beautifully crafted SVG Washi tape based on pattern and color
  switch (pattern) {
    case 'striped':
      return (
        <svg
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${width} ${height} ${className} ${shadow}`}
        >
          {/* Main tape background */}
          <path
            d="M2 3 L 5 1 L 3 6 L 6 10 L 3 14 L 6 18 L 2 21 L 98 21 L 95 18 L 97 14 L 94 10 L 97 6 L 94 1 L 98 3 Z"
            fill={C.paper}
            fillOpacity="0.8"
            stroke={`${color}20`}
            strokeWidth="0.5"
          />
          {/* Translucent diagonal stripes */}
          <g stroke={color} strokeWidth="2.5" strokeOpacity="0.25" strokeLinecap="round">
            <line x1="10" y1="2" x2="22" y2="20" />
            <line x1="25" y1="2" x2="37" y2="20" />
            <line x1="40" y1="2" x2="52" y2="20" />
            <line x1="55" y1="2" x2="67" y2="20" />
            <line x1="70" y1="2" x2="82" y2="20" />
            <line x1="85" y1="2" x2="97" y2="20" />
          </g>
          {/* Subtle accent stripe */}
          <g stroke={C.accent} strokeWidth="1" strokeOpacity="0.15" strokeLinecap="round">
            <line x1="15" y1="2" x2="27" y2="20" />
            <line x1="30" y1="2" x2="42" y2="20" />
            <line x1="45" y1="2" x2="57" y2="20" />
            <line x1="60" y1="2" x2="72" y2="20" />
            <line x1="75" y1="2" x2="87" y2="20" />
          </g>
        </svg>
      );

    case 'grid':
      return (
        <svg
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${width} ${height} ${className} ${shadow}`}
        >
          {/* Torn edges base */}
          <path
            d="M3 2 L 6 5 L 4 9 L 7 12 L 3 16 L 6 19 L 3 22 L 97 22 L 94 19 L 96 16 L 93 12 L 96 9 L 93 5 L 97 2 Z"
            fill={darkMode ? '#2A2520' : '#FAF5FF'}
            fillOpacity="0.85"
            stroke={`${color}20`}
            strokeWidth="0.5"
          />
          {/* Grid lines */}
          <path d="M10 2 V22 M20 2 V22 M30 2 V22 M40 2 V22 M50 2 V22 M60 2 V22 M70 2 V22 M80 2 V22 M90 2 V22" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" />
          <path d="M3 6 H97 M3 11 H97 M3 16 H97" stroke={color} strokeWidth="0.5" strokeOpacity="0.15" />
        </svg>
      );

    case 'botanical':
      return (
        <svg
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${width} ${height} ${className} ${shadow}`}
        >
          <path
            d="M2 3 L 5 1 L 3 6 L 6 10 L 3 14 L 6 18 L 2 21 L 98 21 L 95 18 L 97 14 L 94 10 L 97 6 L 94 1 L 98 3 Z"
            fill={darkMode ? '#1E2418' : '#F4F7F4'}
            fillOpacity="0.85"
            stroke={`${color}20`}
            strokeWidth="0.5"
          />
          {/* Botanical leaf prints */}
          <g stroke={color} strokeWidth="1.2" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Leaf 1 */}
            <path d="M15 12 Q 22 10, 25 14" fill="none" />
            <path d="M25 14 C 23 11, 20 11, 18 12 C 20 14, 23 14, 25 14" fill={`${color}22`} />
            {/* Leaf 2 */}
            <path d="M45 12 Q 52 14, 55 10" fill="none" />
            <path d="M55 10 C 53 12, 50 12, 48 11 C 50 9, 53 9, 55 10" fill={`${color}22`} />
            {/* Leaf 3 */}
            <path d="M75 12 Q 82 10, 85 14" fill="none" />
            <path d="M85 14 C 83 11, 80 11, 78 12 C 80 14, 83 14, 85 14" fill={`${color}22`} />
          </g>
          {/* Subtle natural dots */}
          <g fill={color} opacity="0.3">
            <circle cx="33" cy="8" r="0.8" />
            <circle cx="37" cy="14" r="0.6" />
            <circle cx="63" cy="15" r="0.8" />
            <circle cx="67" cy="8" r="0.6" />
          </g>
        </svg>
      );

    case 'plaid':
      return (
        <svg
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${width} ${height} ${className} ${shadow}`}
        >
          <path
            d="M2 2 L 5 4 L 3 8 L 6 11 L 3 15 L 6 18 L 2 22 L 98 22 L 95 18 L 97 15 L 94 11 L 97 8 L 94 4 L 98 2 Z"
            fill={darkMode ? '#2A1C1C' : '#FFF1F1'}
            fillOpacity="0.85"
            stroke={`${color}20`}
            strokeWidth="0.5"
          />
          {/* Tartan/Plaid stripes */}
          <g fill={color} opacity="0.15">
            <rect x="0" y="4" width="100" height="4" />
            <rect x="0" y="14" width="100" height="4" />
            <rect x="15" y="0" width="8" height="24" />
            <rect x="50" y="0" width="8" height="24" />
            <rect x="80" y="0" width="8" height="24" />
          </g>
          {/* Fine lines */}
          <g stroke={C.accent} strokeWidth="0.5" strokeOpacity="0.3">
            <line x1="0" y1="10" x2="100" y2="10" />
            <line x1="28" y1="0" x2="28" y2="24" />
            <line x1="63" y1="0" x2="63" y2="24" />
          </g>
          <g stroke={color} strokeWidth="0.5" strokeOpacity="0.3">
            <line x1="0" y1="18" x2="100" y2="18" />
            <line x1="43" y1="0" x2="43" y2="24" />
            <line x1="93" y1="0" x2="93" y2="24" />
          </g>
        </svg>
      );

    case 'stars':
      return (
        <svg
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${width} ${height} ${className} ${shadow}`}
        >
          <path
            d="M3 2 L 6 4 L 4 8 L 7 11 L 4 15 L 7 18 L 3 22 L 97 22 L 94 18 L 96 15 L 93 11 L 96 8 L 94 4 L 97 2 Z"
            fill="#1E2030"
            fillOpacity="0.9"
            stroke={`${color}30`}
            strokeWidth="0.5"
          />
          {/* Sparkles or tiny stars */}
          <g fill={color} opacity="0.8">
            {/* Sparkle 1 */}
            <path d="M15 12 L17 10 L15 8 L13 10 Z" />
            {/* Sparkle 2 */}
            <path d="M45 14 L46 12 L45 10 L44 12 Z" />
            {/* Sparkle 3 */}
            <path d="M75 11 L77 9 L75 7 L73 9 Z" />
            {/* Tiny stars */}
            <circle cx="28" cy="7" r="0.6" fill={darkMode ? '#C8B8F0' : '#FFFFFF'} />
            <circle cx="32" cy="15" r="0.8" fill={darkMode ? '#C8B8F0' : '#FFFFFF'} />
            <circle cx="60" cy="14" r="0.7" fill={darkMode ? '#C8B8F0' : '#FFFFFF'} />
            <circle cx="64" cy="6" r="0.5" fill={darkMode ? '#C8B8F0' : '#FFFFFF'} />
            <circle cx="88" cy="15" r="0.6" fill={darkMode ? '#C8B8F0' : '#FFFFFF'} />
          </g>
          {/* Soft constellation link lines */}
          <path d="M28 7 L32 15" stroke={darkMode ? '#6A5ACD' : '#FFFFFF'} strokeWidth="0.3" strokeOpacity="0.2" />
          <path d="M60 14 L64 6" stroke={darkMode ? '#6A5ACD' : '#FFFFFF'} strokeWidth="0.3" strokeOpacity="0.2" />
        </svg>
      );

    case 'lace':
      return (
        <svg
          viewBox="0 0 100 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${width} ${height} ${className} ${shadowLace}`}
        >
          {/* Main transparent white lace ribbon with scalloped edges */}
          <path
            d="M2 4
               H 98
               Q 99 7 98 10 Q 99 13 98 16 Q 99 19 98 22
               H 2
               Q 1 19 2 16 Q 1 13 2 10 Q 1 7 2 4 Z"
            fill={darkMode ? '#3A2A2A' : '#FFFFFF'}
            fillOpacity="0.9"
            stroke={darkMode ? '#8A5A5A' : '#F4D3D9'}
            strokeWidth="0.5"
          />
          {/* Scalloped dot patterns */}
          <g fill={darkMode ? '#8A5A5A' : '#F3A3B1'} opacity="0.3" strokeWidth="0">
            {Array.from({ length: 15 }).map((_, i) => (
              <circle key={i} cx={5 + i * 6.4} cy="6" r="1.2" />
            ))}
            {Array.from({ length: 15 }).map((_, i) => (
              <circle key={i} cx={5 + i * 6.4} cy="18" r="1.2" />
            ))}
          </g>
          {/* Soft central embroidery line */}
          <line x1="4" y1="12" x2="96" y2="12" stroke={darkMode ? '#8A5A5A' : '#F3A3B1'} strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.4" />
        </svg>
      );

    default:
      return null;
  }
}
