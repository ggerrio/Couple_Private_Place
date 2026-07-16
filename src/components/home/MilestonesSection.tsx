import React, { useState, useEffect, useMemo } from "react";
import { useCouple } from "../../context/CoupleContext";
import { OptimizedImage } from "../common/OptimizedImage";
import { motion } from "motion/react";
import { Calendar, Gift, Edit2, Sparkles, RefreshCw, Heart } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysUntilBirthday(birthdayStr: string): number | null {
  if (!birthdayStr) return null;
  const parts = birthdayStr.split("-");
  if (parts.length < 2) return null;
  let month = 0, day = 0;
  if (parts[0].length === 4) { month = parseInt(parts[1], 10) - 1; day = parseInt(parts[2], 10); }
  else { month = parseInt(parts[0], 10) - 1; day = parseInt(parts[1], 10); }
  if (isNaN(month) || isNaN(day)) return null;
  const today = new Date();
  const currentYear = today.getFullYear();
  let nextBday = new Date(currentYear, month, day);
  today.setHours(0, 0, 0, 0);
  nextBday.setHours(0, 0, 0, 0);
  if (nextBday.getTime() < today.getTime()) nextBday.setFullYear(currentYear + 1);
  const diffTime = nextBday.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatBirthdayDisplay(birthdayStr: string): string {
  if (!birthdayStr) return "Not set";
  const parts = birthdayStr.split("-");
  if (parts.length < 2) return "Not set";
  let month = 0, day = 0;
  if (parts[0].length === 4) { month = parseInt(parts[1], 10) - 1; day = parseInt(parts[2], 10); }
  else { month = parseInt(parts[0], 10) - 1; day = parseInt(parts[1], 10); }
  if (isNaN(month) || isNaN(day)) return "Not set";
  return new Date(2000, month, day).toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function formatAnniversaryDisplay(dateStr: string): string {
  if (!dateStr) return "October 15";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "October 15";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

// ─── MilestonesSection ────────────────────────────────────────────────────────

export function MilestonesSection() {
  const { anniversaryDate, birthdayA, birthdayB, userA, userB, updateCoupleSettings,
    cloudinaryCloudName, cloudinaryUploadPreset }: any = useCouple();

  const [showMilestoneEdit, setShowMilestoneEdit] = useState(false);
  const [editAnniv, setEditAnniv] = useState(anniversaryDate);
  const [editBdayA, setEditBdayA] = useState(birthdayA);
  const [editBdayB, setEditBdayB] = useState(birthdayB);

  useEffect(() => {
    setEditAnniv(anniversaryDate);
    setEditBdayA(birthdayA);
    setEditBdayB(birthdayB);
  }, [anniversaryDate, birthdayA, birthdayB]);

  const nextMilestoneDate = useMemo(() => {
    if (!anniversaryDate) return "";
    const anniv = new Date(anniversaryDate);
    if (isNaN(anniv.getTime())) return "";
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextAnniv = new Date(anniv);
    nextAnniv.setFullYear(currentYear);
    if (today > nextAnniv) nextAnniv.setFullYear(currentYear + 1);
    return nextAnniv.toISOString().split("T")[0];
  }, [anniversaryDate]);

  const [daysCount, setDaysCount] = useState(0);
  const [nextAnniversaryDays, setNextAnniversaryDays] = useState(0);
  const [nextMilestoneDays, setNextMilestoneDays] = useState(0);
  const [birthdayDays, setBirthdayDays] = useState({ userA: 0, userB: 0 });

  useEffect(() => {
    if (!anniversaryDate) return;
    const start = new Date(anniversaryDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysCount(diffDays);

    const currentYear = today.getFullYear();
    const nextAnniv = new Date(anniversaryDate);
    if (!isNaN(nextAnniv.getTime())) {
      nextAnniv.setFullYear(currentYear);
      if (today > nextAnniv) nextAnniv.setFullYear(currentYear + 1);
      const annivDiff = nextAnniv.getTime() - today.getTime();
      setNextAnniversaryDays(Math.max(0, Math.ceil(annivDiff / (1000 * 60 * 60 * 24))));
    }

    if (nextMilestoneDate) {
      const targetMilestone = new Date(nextMilestoneDate);
      const dTarget = new Date(targetMilestone.getFullYear(), targetMilestone.getMonth(), targetMilestone.getDate());
      const dToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const milestoneDiff = dTarget.getTime() - dToday.getTime();
      setNextMilestoneDays(Math.max(0, Math.ceil(milestoneDiff / (1000 * 60 * 60 * 24))));
    }

    setBirthdayDays({
      userA: daysUntilBirthday(birthdayA) ?? 0,
      userB: daysUntilBirthday(birthdayB) ?? 0,
    });
  }, [anniversaryDate, nextMilestoneDate, birthdayA, birthdayB]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.05 }}
      id="milestone-special-days-card"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border-color)] pb-3.5 gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--text-main)] font-display flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[var(--primary)]" /> Our Milestones & Special Days
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">Celebrate and manage our custom milestone dates.</p>
          </div>
          <button
            type="button"
            onClick={() => { triggerHaptic("light"); setShowMilestoneEdit(true); }}
            className="px-3.5 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Tinker Dates</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-[var(--border-color)]">
          {/* Left: Anniversary + Next Milestone */}
          <div className="space-y-5">
            <div>
              <h4 className="text-sm md:text-base font-bold text-[var(--text-main)] font-serif flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[var(--primary)]" /> Our Milestones
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Every day together is a milestone worth celebrating.</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-[var(--border-color)]">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">Anniversary</p>
                  <p className="text-xs md:text-sm text-[var(--text-main)] font-bold">{formatAnniversaryDisplay(anniversaryDate)}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-[var(--primary)] font-display">{nextAnniversaryDays}</span>
                  <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-[var(--border-color)]">
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider font-bold">Our Next Anniversary</p>
                  <p className="text-xs md:text-sm text-[var(--text-main)] font-bold">
                    {nextMilestoneDate ? new Date(nextMilestoneDate).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : "Not set"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-amber-600 font-display">{nextMilestoneDays}</span>
                  <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Birthdays */}
          <div className="space-y-5 pt-4 md:pt-0 md:pl-8">
            <div>
              <h4 className="text-sm md:text-base font-bold text-[var(--text-main)] font-serif flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" /> Birthdays
              </h4>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">Counting down to celebration days!</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center gap-2.5">
                  <OptimizedImage src={userA.avatar} alt={userA.name} className="w-8 h-8 rounded-full border border-[var(--border-color)] object-cover" referrerPolicy="no-referrer" loading="lazy" resizeWidth={64} resizeHeight={64} />
                  <div>
                    <p className="text-xs md:text-sm font-bold text-[var(--text-main)] truncate max-w-[100px]">{userA.name.split(" ")[0]}</p>
                    <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">{formatBirthdayDisplay(birthdayA)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-pink-600 font-display">{birthdayDays.userA}</span>
                  <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/40 p-3 rounded-xl border border-[var(--border-color)]">
                <div className="flex items-center gap-2.5">
                  <OptimizedImage src={userB.avatar} alt={userB.name} className="w-8 h-8 rounded-full border border-[var(--border-color)] object-cover" referrerPolicy="no-referrer" loading="lazy" resizeWidth={64} resizeHeight={64} />
                  <div>
                    <p className="text-xs md:text-sm font-bold text-[var(--text-main)] truncate max-w-[100px]">{userB.name.split(" ")[0]}</p>
                    <p className="text-xs md:text-sm text-[var(--text-muted)] mt-0.5">{formatBirthdayDisplay(birthdayB)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg md:text-xl lg:text-2xl font-extrabold text-blue-600 font-display">{birthdayDays.userB}</span>
                  <span className="text-xs md:text-sm text-[var(--text-muted)] block mt-0.5">days left</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Edit Dialog */}
        {showMilestoneEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMilestoneEdit(false)} />
            <div className="bg-[var(--fabric-cream)] rounded-2xl p-6 w-full max-w-md z-10 space-y-4 border border-[var(--wood-oak)]/20 shadow-2xl">
              <h4 className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider">Edit Milestone & Birthdays</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Anniversary Date</label>
                  <input type="date" value={editAnniv} onChange={(e) => setEditAnniv(e.target.value)}
                    className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg border border-transparent outline-none focus:border-[var(--primary)] text-gray-800" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{userA.name.split(" ")[0]}'s Birthday</label>
                    <input type="date" value={editBdayA} onChange={(e) => setEditBdayA(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg border border-transparent outline-none focus:border-[var(--primary)] text-gray-800" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">{userB.name.split(" ")[0]}'s Birthday</label>
                    <input type="date" value={editBdayB} onChange={(e) => setEditBdayB(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg border border-transparent outline-none focus:border-[var(--primary)] text-gray-800" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowMilestoneEdit(false)}
                  className="flex-1 py-2 bg-black/5 text-[var(--text-muted)] text-xs font-bold rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button onClick={async () => {
                  triggerHaptic("success");
                  await updateCoupleSettings(editAnniv, editBdayA, editBdayB, cloudinaryCloudName, cloudinaryUploadPreset);
                  setShowMilestoneEdit(false);
                }}
                  className="flex-1 py-2 bg-[var(--primary)] text-white text-xs font-bold rounded-xl cursor-pointer">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── DailyQuote ───────────────────────────────────────────────────────────────

const curatedPool = [
  { content: "In all the world, there is no heart for me like yours...", author: "Maya Angelou" },
  { content: "I would rather share one fleeting lifetime of mortal days with you...", author: "J.R.R. Tolkien" },
  { content: "If I know what love is... it is entirely because of you.", author: "Hermann Hesse" },
  { content: "My heart is, and always will be, yours.", author: "Jane Austen" },
  { content: "Grow old along with me! The best is yet to be.", author: "Robert Browning" },
  { content: "You are my heart, my life, my one and only thought.", author: "Arthur Conan Doyle" },
  { content: "I love you not only for what you are, but for what I am when I am with you.", author: "Roy Croft" },
  { content: "Whatever our souls are made of, his and mine are the same.", author: "Emily Brontë" },
  { content: "Doubt thou the stars are fire... But never doubt that I love.", author: "William Shakespeare" },
  { content: "To love or have loved, that is enough.", author: "Victor Hugo" },
];

export function DailyQuote() {
  const { } = useCouple();
  const [fetchedQuote, setFetchedQuote] = useState<{ content: string; author: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchRomanticQuote = async (force = false) => {
    setQuoteLoading(true);
    try {
      const cachedTime = localStorage.getItem("romantic_daily_quote_time");
      const now = Date.now();
      if (!force && cachedTime && fetchedQuote && (now - parseInt(cachedTime, 10)) < 24 * 60 * 60 * 1000) {
        setQuoteLoading(false); return;
      }
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000);
      const res = await fetch("https://api.quotable.io/random?tags=love", { signal: controller.signal });
      clearTimeout(id);
      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          const newQuote = { content: data.content, author: data.author || "Unknown" };
          setFetchedQuote(newQuote);
          localStorage.setItem("romantic_daily_quote", JSON.stringify(newQuote));
          localStorage.setItem("romantic_daily_quote_time", now.toString());
          setQuoteLoading(false); return;
        }
      }
      throw new Error("Failed");
    } catch {
      const chosen = curatedPool[Math.floor(Math.random() * curatedPool.length)];
      setFetchedQuote(chosen);
      localStorage.setItem("romantic_daily_quote", JSON.stringify(chosen));
      localStorage.setItem("romantic_daily_quote_time", Date.now().toString());
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("romantic_daily_quote");
      if (cached) setFetchedQuote(JSON.parse(cached));
    } catch {}
    fetchRomanticQuote();
  }, []);

  const changeQuote = () => {
    fetchRomanticQuote(true);

  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.1 }}
      className="relative overflow-hidden h-full flex flex-col"
      id="quote-card"
    >
      <div className="flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs md:text-sm font-extrabold text-[var(--primary)] tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-current text-[var(--primary)]" />
              Daily Love Quote
            </h4>
            <button
              type="button"
              onClick={() => { triggerHaptic("light"); changeQuote(); }}
              title="Draw a new quote"
              className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
          <div className="text-sm md:text-base font-serif italic text-[var(--text-main)] leading-relaxed relative z-10 py-1.5 font-medium">
            {quoteLoading ? (
              <span className="flex items-center gap-1.5 text-[var(--text-muted)] animate-pulse font-sans text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--primary)]" /> Fetching romantic whisper...
              </span>
            ) : fetchedQuote ? (
              <>
                "{fetchedQuote.content}"
                {fetchedQuote.author && (
                  <span className="block text-right text-xs text-[var(--text-muted)] font-mono not-italic mt-2">
                    — {fetchedQuote.author}
                  </span>
                )}
              </>
            ) : (
              `"In your smile, I see something more beautiful than the stars."`
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] relative z-10 font-mono">
          <span>Stable for 24 hours</span>
          <span>Next update in {Math.max(1, Math.round((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1).getTime() - Date.now()) / (1000 * 60 * 60)))}h</span>
        </div>
      </div>
      <Heart className="w-20 h-20 text-[var(--primary)]/5 absolute -right-6 -bottom-6 -rotate-12 pointer-events-none" />
    </motion.div>
  );
}
