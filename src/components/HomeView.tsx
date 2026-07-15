/**
 * HomeView.tsx — The Foyer
 * Orchestrates the opening spread of the digital scrapbook.
 * Each section is wrapped in ScrapbookPage with WashiTapeDivider between them.
 */

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useCouple } from "../context/CoupleContext";
import { WelcomeHero, MemorySpotlight } from "./home/WelcomeHero";
import { WeatherSection } from "./home/WeatherSection";
import { AnniversaryCountdown } from "./home/AnniversaryCountdown";
import { MilestonesSection, DailyQuote } from "./home/MilestonesSection";
import { LoveWheel } from "./home/LoveWheel";
import { DailyVibeVinyl } from "./home/DailyVibeVinyl";
import { StickyNotes } from "./home/StickyNotes";
import { MusicPlayer } from "./home/MusicPlayer";
import PlaylistBuilder from "./home/PlaylistBuilder";
import { ScrapbookPage, WashiTapeDivider } from "./scrapbook";
import { MemoryToday, SpecialDateBanner, GratitudePrompt } from "./emotional";

const dailyMessages = [
  "Welcome back to our little bubble.",
  "I'm so happy you're here today.",
  "Our little corner of the world is waiting for us.",
  "Every day feels a little brighter with you here.",
  "Another beautiful day begins with us together.",
  "Our story quietly grows with every new day.",
  "This little space always feels like home.",
  "Every moment we save becomes another treasured memory.",
  "The best part of today is sharing it with you.",
  "No matter where we are, this place always brings us together.",
  "Another page of our story is ready to be written.",
  "Some memories are small, but they mean everything.",
  "This little bubble holds all the moments we never want to lose.",
  "Love lives in the little things we do together.",
  "Every visit adds another warm memory to our collection.",
  "A quiet place, a warm heart, and the two of us.",
  "Nothing feels more comforting than being here with you.",
  "The sweetest memories always begin with ordinary days.",
  "Our happiest moments are the ones we create together.",
  "Home has never been a place. It has always been you.",
  "Another day to smile, laugh, and make new memories together.",
  "Thank you for making every day feel a little more special.",
  "Every photo, every letter, every memory tells our story.",
  "This is where our favorite memories come to stay.",
  "Even the simplest moments become unforgettable with you.",
  "Here's to another beautiful day in our little world.",
  "Every heartbeat of this place is filled with our memories.",
  "No distance can make this place feel any less like home.",
  "The little things we share become the memories we treasure.",
  "Today is another chance to make something worth remembering.",
];

const HomeView = React.memo(function HomeView() {
  const { currentUser, userA, userB, anniversaryDate } = useCouple();

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const daysCount = useMemo(() => {
    if (!anniversaryDate) return 0;
    const start = new Date(anniversaryDate);
    const today = new Date();
    return Math.ceil(Math.abs(today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }, [anniversaryDate]);

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const message = dailyMessages[dayOfYear % dailyMessages.length];

  return (
    <div id="home-view-container" className="space-y-6 md:space-y-8">
      {/* ── Emotional experiences — cascading entrance ── */}
      <SpecialDateBanner />
      <MemoryToday />

      {/* SECTION 1: ARRIVAL — Welcome cover page + Spotlight Memory */}
      <ScrapbookPage className="max-w-none">
        <div className="space-y-6 md:space-y-8">
          <WelcomeHero
            activeProfile={activeProfile}
            partnerProfile={partnerProfile}
            daysCount={daysCount}
            anniversaryDate={anniversaryDate}
            message={message}
          />
          <div className="border-t border-[var(--border-color)]/60 w-full" />
          <MemorySpotlight />
        </div>
      </ScrapbookPage>

      <WashiTapeDivider color="gold" label="Our World" />

      {/* SECTION 2: OUR WORLD — Weather + Mood */}
      <ScrapbookPage className="max-w-none content-visibility-auto">
        <WeatherSection />
      </ScrapbookPage>

      <WashiTapeDivider color="moss" label="Our Story" />

      {/* SECTION 3: OUR STORY — Gratitude & Quote / Countdown & Milestones */}
      <div className="space-y-6">
        {/* Row 1: Daily Gratitude & Daily Love Quote side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-visibility-auto--lg">
          <GratitudePrompt />
          <ScrapbookPage>
            <DailyQuote />
          </ScrapbookPage>
        </div>

        <WashiTapeDivider color="rose" label="Anniversary" />

        {/* Row 2: Countdown & Milestones side-by-side with LoveWheel integrated */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch content-visibility-auto--lg">
          {/* Column 1: Anniversary Countdown + Love Wheel stacked */}
          <div className="flex flex-col gap-6">
            <ScrapbookPage className="bg-gradient-to-br from-rose-50/20 to-amber-50/20 dark:from-rose-950/5 dark:to-amber-950/5">
              <AnniversaryCountdown />
            </ScrapbookPage>
            <ScrapbookPage className="flex-1 flex flex-col justify-center">
              <LoveWheel compact={true} />
            </ScrapbookPage>
          </div>

          {/* Column 2: Milestones Section stretching to match height */}
          <ScrapbookPage className="h-full flex flex-col">
            <MilestonesSection />
          </ScrapbookPage>
        </div>
      </div>

      <WashiTapeDivider color="coral" label="Vibes" />

      {/* SECTION 4: NEST — Streak + Notes */}
      <ScrapbookPage className="max-w-none content-visibility-auto">
        <DailyVibeVinyl />
      </ScrapbookPage>

      <ScrapbookPage className="max-w-none content-visibility-auto--sm">
        <StickyNotes />
      </ScrapbookPage>

      <WashiTapeDivider color="lavender" label="Listening Our Kind Of Melody" />

      {/* SECTION 5: LISTENING TREEHOUSE — Music Player */}
      <ScrapbookPage className="max-w-none content-visibility-auto--lg">
        <MusicPlayer />
      </ScrapbookPage>

      <WashiTapeDivider color="gold" label="Shared Queue" />

      <ScrapbookPage className="max-w-none content-visibility-auto">
        <PlaylistBuilder />
      </ScrapbookPage>
    </div>
  );
});

export default HomeView;
