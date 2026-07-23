/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import WashiTape from "./WashiTape";
import VintageStickersDecoration from "./VintageStickers";
import { getWeatherCondition } from "../../utils/weather";

export interface ForecastItem {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

export interface HourlyItem {
  time: string; // e.g. "900", "1200", "1500"
  temp: number;
  weatherCode: number;
}

interface ForecastNotificationProps {
  dailyForecast: ForecastItem[] | null;
  hourlyForecast: HourlyItem[] | null;
  isVisible: boolean;
  onClose: () => void;
  onSwitchToGreeting?: () => void;
  hasGreeting?: boolean;
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

function formatTimeLabel(timeStr: string): string {
  const num = parseInt(timeStr);
  if (isNaN(num)) return timeStr;
  const hours = Math.floor(num / 100);
  const mins = num % 100;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export default function ForecastNotification({
  dailyForecast,
  hourlyForecast,
  isVisible,
  onClose,
  onSwitchToGreeting,
  hasGreeting = false,
}: ForecastNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-dismiss after 15 seconds regardless of expand/collapse state
  React.useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, 15000);
    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  // Hand-drawn weather SVGs for forecast items
  const renderWeatherIcon = (code: number, sizeClass = "w-8 h-8") => {
    const category = getWeatherCategory(code);
    switch (category) {
      case 'sunny':
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClass} select-none`} xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="22" fill="#FEF08A" stroke="#EAB308" strokeWidth="3" />
            <g stroke="#EAB308" strokeWidth="4" strokeLinecap="round">
              <line x1="50" y1="12" x2="50" y2="20" />
              <line x1="50" y1="80" x2="50" y2="88" />
              <line x1="12" y1="50" x2="20" y2="50" />
              <line x1="80" y1="50" x2="88" y2="50" />
            </g>
            <circle cx="44" cy="46" r="2" fill="#1C1917" />
            <circle cx="56" cy="46" r="2" fill="#1C1917" />
            <path d="M45 54 Q 50 58, 55 54" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'rainy':
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClass} select-none`} xmlns="http://www.w3.org/2000/svg">
            <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M40 64 L38 72 M52 65 L50 73 M64 64 L62 72" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
      case 'stormy':
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClass} select-none`} xmlns="http://www.w3.org/2000/svg">
            <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#F1F5F9" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M48 55 L40 68 L48 68 L44 80" stroke="#EAB308" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="#FEF08A" />
          </svg>
        );
      case 'foggy':
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClass} select-none`} xmlns="http://www.w3.org/2000/svg">
            <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#F1F5F9" stroke="#64748B" strokeWidth="2" strokeLinejoin="round" />
            <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round">
              <line x1="25" y1="66" x2="75" y2="66" />
              <line x1="35" y1="72" x2="65" y2="72" />
            </g>
          </svg>
        );
      case 'cloudy':
      default:
        return (
          <svg viewBox="0 0 100 100" className={`${sizeClass} select-none`} xmlns="http://www.w3.org/2000/svg">
            <path d="M25 58 C20 58, 16 53, 16 47 C16 40, 22 36, 28 36 C30 25, 40 18, 52 18 C64 18, 73 27, 75 38 C82 38, 88 43, 88 50 C88 57, 82 58, 78 58 Z" fill="#F8FAFC" stroke="#475569" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="44" cy="44" r="2" fill="#1C1917" />
            <circle cx="58" cy="44" r="2" fill="#1C1917" />
            <path d="M46 51 Q 51 55, 56 51" fill="none" stroke="#1C1917" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  if (!isVisible || !dailyForecast) return null;

  // Use up to 3 days for the forecast cards
  const threeDayForecast = dailyForecast.slice(0, 3);

  return (
    <AnimatePresence>
      <motion.div
        id="forecast-notification-scrapbook"
        initial={{ opacity: 0, y: -30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95, transition: { duration: 0.25 } }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="fixed z-40 overflow-visible max-h-[85vh] max-sm:bottom-20 max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:top-auto sm:bottom-6 sm:right-20 sm:w-full sm:max-w-[360px]"
      >
        {/* Washi Tape Accent */}
        <div className="absolute -top-3.5 right-12 z-20 rotate-[3deg]">
          <WashiTape pattern="botanical" color="#2D5A27" width="w-24" height="h-6" />
        </div>

        {/* Paper Container with Warm Scrapbook style */}
        <div 
          className="relative overflow-visible bg-[#FDFBF7] dark:bg-[#1E1E38] p-5 shadow-[0_8px_30px_rgb(78,59,36,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-[16px] border-2 border-[#4E3B24]/15 dark:border-white/10 text-[#4E3B24] dark:text-[#FAF6F0] font-sans"
        >
          {/* Optional Tab Switcher when both notifications exist */}
          {hasGreeting && onSwitchToGreeting && (
            <div className="flex items-center gap-1 mb-3 bg-[#4E3B24]/10 dark:bg-white/10 p-1 rounded-lg text-xs font-bold font-serif select-none">
              <button
                type="button"
                onClick={onSwitchToGreeting}
                className="flex-1 py-1 px-2.5 rounded-md text-[#4E3B24]/60 dark:text-white/60 hover:text-[#4E3B24] dark:hover:text-white transition-colors text-center"
              >
                ☀️ Greeting
              </button>
              <button
                type="button"
                className="flex-1 py-1 px-2.5 rounded-md bg-[#FAF8F5] dark:bg-[#1E1E38] text-[#4E3B24] dark:text-[#FAF6F0] shadow-sm text-center"
              >
                📅 3-Day Forecast
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between border-b border-dashed border-[#4E3B24]/15 dark:border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold font-serif text-[#2D5A27] dark:text-[#6EE7B7]">
              <Calendar className="w-4 h-4" />
              <span>3-Day Forecast</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-[#4E3B24]/5 dark:hover:bg-white/5 text-[#4E3B24]/60 dark:text-white/40 hover:text-[#4E3B24] dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Days Staggered cards */}
          <div className="grid grid-cols-3 gap-2">
            {threeDayForecast.map((item, idx) => {
              const dateObj = new Date(item.date);
              const dayLabel = idx === 0 
                ? "Today" 
                : dateObj.toLocaleDateString("en-US", { weekday: "short" });
              
              const cond = getWeatherCondition(item.weatherCode);

              return (
                <motion.div
                  key={item.date}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 150 }}
                  className="flex flex-col items-center bg-[#FEFDFB] dark:bg-[#1A1A2E] border border-[#4E3B24]/10 dark:border-white/10 rounded-xl p-2.5 text-center shadow-sm hover:-translate-y-0.5 transition-transform"
                >
                  <span className="text-[10px] font-bold text-[#4E3B24]/60 dark:text-white/50 uppercase">{dayLabel}</span>
                  <div className="my-1.5 flex items-center justify-center">
                    {renderWeatherIcon(item.weatherCode, "w-10 h-10")}
                  </div>
                  <span className="text-[10px] font-bold text-[#2D5A27] dark:text-[#6EE7B7] truncate w-full" title={cond.textId}>
                    {cond.textId.split(" / ")[0] || cond.textId}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1 font-mono text-xs font-bold">
                    <span className="text-[#e11d48] dark:text-[#FB7185]">{Math.round(item.tempMax)}°</span>
                    <span className="text-[#4E3B24]/30 dark:text-white/20">/</span>
                    <span className="text-[#0284C7] dark:text-[#38BDF8]">{Math.round(item.tempMin)}°</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Expand/Collapse Trigger */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3.5 w-full flex items-center justify-center gap-1 text-[10px] font-bold text-[#2D5A27] dark:text-[#6EE7B7] py-1 bg-[#4E3B24]/5 dark:bg-white/5 hover:bg-[#4E3B24]/10 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isExpanded ? "Hide Hourly Forecast" : "View Hourly Forecast"}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Hourly strip with horizontal scroll */}
          <AnimatePresence initial={false}>
            {isExpanded && hourlyForecast && hourlyForecast.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-dashed border-[#4E3B24]/15 dark:border-white/10 pt-3"
              >
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#4E3B24]/20 select-none">
                  {hourlyForecast.map((hour, idx) => (
                    <div 
                      key={idx} 
                      className="flex-shrink-0 flex flex-col items-center bg-[#FEFDFB] dark:bg-[#1A1A2E] border border-[#4E3B24]/10 dark:border-white/10 rounded-lg p-2 min-w-[55px] text-center"
                    >
                      <span className="text-[9px] font-bold text-[#4E3B24]/50 dark:text-white/40">{formatTimeLabel(hour.time)}</span>
                      <div className="my-1">
                        {renderWeatherIcon(hour.weatherCode, "w-6 h-6")}
                      </div>
                      <span className="font-mono text-[10px] font-black text-[#4E3B24] dark:text-[#FAF6F0]">{Math.round(hour.temp)}°C</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stickers decoration */}
        <VintageStickersDecoration 
          seed={`forecast-3day-hourly`} 
          corners={['top-left', 'bottom-right']} 
        />
      </motion.div>
    </AnimatePresence>
  );
}
