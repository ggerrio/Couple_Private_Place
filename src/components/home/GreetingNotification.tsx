/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, ChevronUp, MapPin } from "lucide-react";
import WashiTape from "./WashiTape";
import VintageStickersDecoration from "./VintageStickers";
import { useCouple } from "../../context/CoupleContext";

interface GreetingNotificationProps {
  weatherCode: number;
  city: string;
  temp: number;
  isVisible: boolean;
  onClose: () => void;
  onSwitchToForecast?: () => void;
  hasForecast?: boolean;
}

function getWeatherCategory(code: number): 'sunny' | 'rainy' | 'stormy' | 'foggy' | 'cloudy' {
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code === 45 || code === 48) return 'foggy';
  if (code >= 51 && code <= 65) return 'rainy';
  if (code >= 71 && code <= 75) return 'cloudy';
  if (code >= 80 && code <= 82) return 'rainy';
  if (code >= 95 && code <= 99) return 'stormy';
  if (code >= 176 && code <= 395) return 'rainy';
  return 'cloudy';
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hours = new Date().getHours();
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 21) return 'evening';
  return 'night';
}

export default function GreetingNotification({ 
  weatherCode, 
  city, 
  temp, 
  isVisible, 
  onClose,
  onSwitchToForecast,
  hasForecast = false,
}: GreetingNotificationProps) {
  const { currentUser, userA, userB } = useCouple();
  const [isExpanded, setIsExpanded] = useState(false);

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const userName = activeProfile.name.split(" ")[0];

  const timeOfDay = getTimeOfDay();
  const weatherCategory = getWeatherCategory(weatherCode);

  useEffect(() => {
    if (isVisible && !isExpanded) {
      const timer = setTimeout(() => {
        onClose();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isExpanded, onClose]);

  // Generate contextual content
  const greetingData = React.useMemo(() => {
    const isWeekend = [0, 6].includes(new Date().getDay());
    let title = "Hello";
    let subtext = "Have a wonderful day!";

    if (timeOfDay === 'morning') {
      title = "Good Morning";
      if (weatherCategory === 'sunny') {
        subtext = isWeekend
          ? "Perfect day for a date! Enjoy this beautiful weekend morning together. ☀️"
          : "A bright and cheerful morning! Have a great start to your day, my love. 💛";
      } else if (weatherCategory === 'rainy' || weatherCategory === 'stormy') {
        subtext = "A cool, rainy morning. Warm yourself up before starting your day! ☕";
      } else {
        subtext = "A cool and peaceful morning. May your day be filled with blessings and smiles!";
      }
    } else if (timeOfDay === 'afternoon') {
      title = "Good Afternoon";
      if (weatherCategory === 'sunny') {
        subtext = "The sun is very hot this afternoon! Don't forget to drink enough water, sweetie. 🥤";
      } else if (weatherCategory === 'rainy') {
        subtext = "Raindrops accompany your afternoon. Keep your spirits high for the rest of the day! 🌧️";
      } else {
        subtext = "A shady and comfortable afternoon. Complete your tasks slowly and steadily.";
      }
    } else if (timeOfDay === 'evening') {
      title = "Good Evening";
      if (weatherCategory === 'sunny') {
        subtext = "A gorgeous twilight. Time to unwind after a hard day's work. 🌇";
      } else if (weatherCategory === 'rainy' || weatherCategory === 'stormy') {
        subtext = "A serene evening with the sound of trickling rain. Stay warm and enjoy your relaxation.";
      } else {
        subtext = "A calm evening transitioning to night. Thank you for holding on and doing your best today!";
      }
    } else {
      title = "Good Night";
      if (weatherCategory === 'stormy') {
        subtext = "A stormy night outside, but we are always warm in our little universe together. ⛈️";
      } else {
        subtext = "The stars accompany your rest. Sleep tight and sweet dreams! 🌙";
      }
    }

    return { title, subtext };
  }, [timeOfDay, weatherCategory]);

  // Hand-drawn weather SVGs
  const renderWeatherIcon = () => {
    const floatAnim = {
      animate: { y: [0, -4, 0] },
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" as const }
    };

    switch (weatherCategory) {
      case 'sunny':
        return (
          <motion.div {...floatAnim} className="w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="22" fill="#FEF08A" stroke="#EAB308" strokeWidth="3" />
              {/* rays */}
              <g stroke="#EAB308" strokeWidth="4" strokeLinecap="round">
                <line x1="50" y1="12" x2="50" y2="20" />
                <line x1="50" y1="80" x2="50" y2="88" />
                <line x1="12" y1="50" x2="20" y2="50" />
                <line x1="80" y1="50" x2="88" y2="50" />
                <line x1="23" y1="23" x2="29" y2="29" />
                <line x1="71" y1="71" x2="77" y2="77" />
                <line x1="23" y1="77" x2="29" y2="71" />
                <line x1="71" y1="23" x2="77" y2="29" />
              </g>
              {/* cute happy face */}
              <circle cx="42" cy="46" r="2.5" fill="#1C1917" />
              <circle cx="58" cy="46" r="2.5" fill="#1C1917" />
              <path d="M43 56 Q 50 62, 57 56" fill="none" stroke="#1C1917" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="37" cy="51" r="3" fill="#F87171" opacity="0.6" />
              <circle cx="63" cy="51" r="3" fill="#F87171" opacity="0.6" />
            </svg>
          </motion.div>
        );
      case 'rainy':
        return (
          <motion.div {...floatAnim} className="w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="3" strokeLinejoin="round" />
              {/* Raindrops */}
              <path d="M35 68 L32 76 M52 70 L49 78 M69 68 L66 76" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
              {/* cute happy face */}
              <circle cx="44" cy="44" r="2.2" fill="#1C1917" />
              <circle cx="58" cy="44" r="2.2" fill="#1C1917" />
              <path d="M46 51 Q 51 55, 56 51" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        );
      case 'stormy':
        return (
          <motion.div {...floatAnim} className="w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#F1F5F9" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
              {/* Lightning */}
              <path d="M48 55 L38 72 L48 72 L42 88" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="#FEF08A" />
              {/* cute worry face */}
              <circle cx="44" cy="44" r="2.2" fill="#1C1917" />
              <circle cx="58" cy="44" r="2.2" fill="#1C1917" />
              <path d="M47 52 Q 51 49, 55 52" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        );
      case 'foggy':
        return (
          <motion.div {...floatAnim} className="w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="2.5" strokeLinejoin="round" />
              {/* Fog lines */}
              <g stroke="#94A3B8" strokeWidth="3.5" strokeLinecap="round">
                <line x1="20" y1="68" x2="80" y2="68" />
                <line x1="30" y1="76" x2="70" y2="76" />
              </g>
              {/* cute face */}
              <circle cx="44" cy="44" r="2.2" fill="#1C1917" />
              <circle cx="58" cy="44" r="2.2" fill="#1C1917" />
              <path d="M46 50 H56" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        );
      case 'cloudy':
      default:
        return (
          <motion.div {...floatAnim} className="w-14 h-14 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="34" cy="38" r="14" fill="#FEF08A" stroke="#EAB308" strokeWidth="2.5" />
              <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#F8FAFC" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />
              {/* cute face */}
              <circle cx="44" cy="44" r="2.2" fill="#1C1917" />
              <circle cx="58" cy="44" r="2.2" fill="#1C1917" />
              <path d="M46 51 Q 51 56, 56 51" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </motion.div>
        );
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="greeting-notification-scrapbook"
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.25 } }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="fixed z-40 overflow-visible max-h-[85vh] max-sm:top-16 max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:bottom-auto sm:bottom-6 sm:left-6 sm:w-full sm:max-w-[340px]"
      >
        {/* Washi Tape Accent */}
        <div className="absolute -top-3.5 left-12 z-20 rotate-[-4deg]">
          <WashiTape pattern="striped" color="#B45309" width="w-24" height="h-6" />
        </div>

        {/* Paper Container with Warm Scrapbook style */}
        <div 
          className="relative overflow-visible bg-[#FDFBF7] dark:bg-[#1E1E38] p-5 shadow-[0_8px_30px_rgb(78,59,36,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-[16px] border-2 border-[#4E3B24]/15 dark:border-white/10 text-[#4E3B24] dark:text-[#FAF6F0] font-sans"
        >
          {/* Optional Tab Switcher when both notifications exist */}
          {hasForecast && onSwitchToForecast && (
            <div className="flex items-center gap-1 mb-3 bg-[#4E3B24]/10 dark:bg-white/10 p-1 rounded-lg text-xs font-bold font-serif select-none">
              <button
                type="button"
                className="flex-1 py-1 px-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#1E1E38] text-[#4E3B24] dark:text-[#FAF6F0] shadow-sm text-center"
              >
                ☀️ Greeting
              </button>
              <button
                type="button"
                onClick={onSwitchToForecast}
                className="flex-1 py-1 px-2.5 rounded-md text-[#4E3B24]/60 dark:text-white/60 hover:text-[#4E3B24] dark:hover:text-white transition-colors text-center"
              >
                📅 3-Day Forecast
              </button>
            </div>
          )}

          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-3.5 right-3.5 p-1 rounded-full hover:bg-[#4E3B24]/5 dark:hover:bg-white/5 text-[#4E3B24]/60 dark:text-white/40 hover:text-[#4E3B24] dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Core Layout */}
          <div className="flex gap-3.5 items-start">
            {/* Float Weather Icon */}
            <div className="flex-shrink-0">
              {renderWeatherIcon()}
            </div>

            {/* Typography Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-[#bc6c25] dark:text-[#FBBF24]">
                <MapPin className="w-3 h-3" />
                <span>{city} • {temp}°C</span>
              </div>

              <h4 className="mt-1 font-serif text-lg font-bold leading-tight">
                {greetingData.title}, {userName}!
              </h4>

              {/* Collapsible Subtext — always show on desktop, expand-toggle on mobile */}
              <AnimatePresence initial={false}>
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`mt-2 text-xs font-serif italic leading-relaxed text-[#4E3B24]/80 dark:text-white/70 overflow-hidden ${isExpanded ? '' : 'sm:block hidden'}`}
                >
                  {greetingData.subtext}
                </motion.p>
              </AnimatePresence>

              {/* Mobile-only toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#bc6c25] dark:text-[#FBBF24] hover:underline sm:hidden"
              >
                {isExpanded ? (
                  <>
                    <span>Hide message</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Show warm message</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Vintage Sticker Placement */}
        <VintageStickersDecoration 
          seed={`greeting-${timeOfDay}-${weatherCategory}`} 
          corners={['top-right', 'bottom-left']} 
        />
      </motion.div>
    </AnimatePresence>
  );
}
