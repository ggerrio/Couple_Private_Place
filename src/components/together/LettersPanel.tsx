/**
 * LettersPanel.tsx — Letters & Time Capsules tab
 * Scrapbook redesign: removed tree-card/tree-panel, uses StickerButton + EmptyJournalPage
 */
import React, { useState, useCallback } from "react";
import { useCouple } from "../../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail, Send, Heart, Lock, Sparkles, X, Clock, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "../extras/SectionHeader";
import { triggerHaptic } from "../../lib/haptics";
import { StickerButton, EmptyJournalPage, WashiTapeDivider } from "../scrapbook";
import { WaxSeal } from "./WaxSeal";

export default function LettersPanel() {
  const {
    currentUser, userA, userB, letters, sendLetter, openLetter,
    reactToLetter, timeCapsules, addTimeCapsule, openTimeCapsule,
    anniversaryDate, darkMode
  } = useCouple() as any;

  const [lettersMode, setLettersMode] = useState<"letters" | "capsules">("letters");
  const [lTitle, setLTitle] = useState("");
  const [lContent, setLContent] = useState("");
  const [lSchedule, setLSchedule] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [capsuleMessage, setCapsuleMessage] = useState("");
  const [capsuleOpenDate, setCapsuleOpenDate] = useState("");
  const [capsuleError, setCapsuleError] = useState("");
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [waxSealCapsuleId, setWaxSealCapsuleId] = useState<string | null>(null);
  const [waxSealStatus, setWaxSealStatus] = useState<"sealed" | "melting" | "melted">("sealed");

  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const handleComposeLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lTitle.trim() || !lContent.trim()) return;
    if (lSchedule && new Date(lSchedule) <= new Date()) {
      toast.error("Scheduled date must be in the future.");
      return;
    }
    setIsSending(true);
    triggerHaptic("success");
    setTimeout(async () => {
      try {
        await sendLetter({
          recipientId: currentUser === "user_a" ? "user_b" : "user_a",
          title: lTitle.trim(),
          content: lContent.trim(),
          scheduledFor: lSchedule ? new Date(lSchedule).toISOString() : undefined,
        });
        setLTitle(""); setLContent(""); setLSchedule("");
        setIsComposing(false); setIsSending(false);
        toast.success("Letter sent! ✈️", { description: "Your message is flying to your partner." });
      } catch (err) {
        console.error(err);
        setIsSending(false);
        toast.error("Failed to send letter.");
      }
    }, 1500);
  };

  const handleCreateCapsule = (e: React.FormEvent) => {
    e.preventDefault();
    setCapsuleError("");
    if (!capsuleMessage.trim()) { setCapsuleError("Message is required."); return; }
    if (!capsuleOpenDate) { setCapsuleError("Open date is required."); return; }
    if (new Date(capsuleOpenDate) <= new Date()) { setCapsuleError("Open date must be in the future."); return; }
    addTimeCapsule({ message: capsuleMessage.trim(), openDate: new Date(capsuleOpenDate).toISOString() });
    setCapsuleMessage(""); setCapsuleOpenDate(""); setShowCapsuleForm(false);
    triggerHaptic("success");
    toast.success("Time capsule sealed! ⏳", { description: "Your future selves will thank you." });
  };

  const canOpenCapsule = (capsule: typeof timeCapsules[0]) => {
    if (capsule.isOpened) return false;
    return new Date(capsule.openDate) <= new Date();
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        chapter="The Heartbeat"
        title={lettersMode === "letters" ? "Private Letters Cabinet" : "Locked Time Capsules"}
        subtitle={lettersMode === "letters" ? "Read and compose cute sealed letters." : "Seal memories for your future selves."}
        action={
          lettersMode === "letters" ? (
            <StickerButton size="sm" color="primary" icon={<Sparkles className="w-3.5 h-3.5" />}
              onClick={() => { setIsComposing(!isComposing); setOpenedLetterId(null); triggerHaptic("light"); }}>
              {isComposing ? "Close Cabinet" : "Write a Letter ✉️"}
            </StickerButton>
          ) : (
            <StickerButton size="sm" color="gold" icon={<Lock className="w-3.5 h-3.5" />}
              onClick={() => { setShowCapsuleForm(!showCapsuleForm); triggerHaptic("light"); }}>
              {showCapsuleForm ? "Close Form" : "Seal Capsule ⏳"}
            </StickerButton>
          )
        }
      />

      {/* Pill Switcher */}
      <div className="flex justify-center">
        <div className="bg-[var(--fabric-cream)]/50 p-1 rounded-xl flex gap-1 text-[10px] font-bold border border-[var(--wood-oak)]/15">
          <button onClick={() => { setLettersMode("letters"); setOpenedLetterId(null); triggerHaptic("light"); }}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${lettersMode === "letters" ? "bg-white text-[var(--text-main)] shadow-xs font-bold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
            ✉️ Letters Cabinet
          </button>
          <button onClick={() => { setLettersMode("capsules"); setOpenedLetterId(null); triggerHaptic("light"); }}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${lettersMode === "capsules" ? "bg-white text-[var(--text-main)] shadow-xs font-bold" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}>
            ⏳ Time Capsules
          </button>
        </div>
      </div>

      <WashiTapeDivider color="gold" label={lettersMode === "letters" ? "Compose" : "Seal"} />

      {/* ─── LETTER COMPOSE ─── */}
      {lettersMode === "letters" && isComposing && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleComposeLetter}
          className="p-6 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm border border-[var(--wood-oak)]/15"
          style={{ backgroundColor: "var(--fabric-cream)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")" }}
        >
          <div className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] uppercase tracking-wide">
            <Sparkles className="w-4.5 h-4.5 fill-current animate-pulse" /> Compose Sealed Message
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Letter Subject</label>
              <input type="text" required value={lTitle} onChange={(e) => setLTitle(e.target.value)}
                placeholder="e.g. My heart when you are holding my hand..."
                className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg border border-transparent focus:border-[var(--primary)] text-gray-800 font-serif font-bold" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Message Content</label>
              <textarea required rows={5} value={lContent} onChange={(e) => setLContent(e.target.value)}
                placeholder="Dearest partner,\n\nWrite something warm and cozy..."
                className="w-full text-xs px-4 py-3 border border-[var(--wood-oak)]/20 rounded-2xl outline-none resize-none font-serif leading-relaxed text-[var(--text-main)] focus:border-[var(--primary)] transition-all"
                style={{ backgroundColor: "var(--fabric-cream)", backgroundImage: "linear-gradient(rgba(0,0,0,0) 95%, #e8dfcc 5%)", backgroundSize: "100% 24px", lineHeight: "24px" }} />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Lock Until Specific Date (Optional)</label>
              <input type="date" value={lSchedule} onChange={(e) => setLSchedule(e.target.value)}
                className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg border border-transparent text-[var(--text-main)] cursor-pointer" />
            </div>
          </div>
          <StickerButton type="submit" color="primary" className="w-full" icon={<Send className="w-3.5 h-3.5" />}>
            {isSending ? "Sealing & Flying..." : "Seal & Send Letter"}
          </StickerButton>
        </motion.form>
      )}

      {/* ─── TIME CAPSULE FORM ─── */}
      {lettersMode === "capsules" && showCapsuleForm && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleCreateCapsule}
          className="p-6 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm border border-[var(--wood-oak)]/15"
          style={{ backgroundColor: "var(--fabric-cream)", backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")" }}
        >
          <div className="flex items-center gap-1 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Lock className="w-4.5 h-4.5 text-slate-800 animate-pulse" /> Seal a New Time Capsule
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Capsule Message</label>
              <textarea required rows={4} value={capsuleMessage} onChange={(e) => setCapsuleMessage(e.target.value)}
                placeholder="Write a message to your future selves..."
                className="w-full text-xs px-4 py-3 border border-[var(--wood-oak)]/20 rounded-2xl outline-none resize-none font-serif leading-relaxed text-[var(--text-main)] focus:border-[var(--primary)] transition-all bg-[var(--fabric-cream)]" />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block mb-1">Reveal date</label>
              <input type="datetime-local" required value={capsuleOpenDate} onChange={(e) => setCapsuleOpenDate(e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                className="w-full text-xs px-3.5 py-3 border border-[var(--wood-oak)]/20 rounded-2xl outline-none focus:border-[var(--primary)] bg-[var(--fabric-cream)] text-[var(--text-main)] transition-colors cursor-pointer" />
              <div className="flex flex-wrap gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    const date = new Date();
                    date.setDate(date.getDate() + 7);
                    setCapsuleOpenDate(date.toISOString().slice(0, 16));
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 rounded-lg transition-all cursor-pointer border border-amber-500/10"
                >
                  🗓️ 1 Week Preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    const date = new Date();
                    date.setMonth(date.getMonth() + 1);
                    setCapsuleOpenDate(date.toISOString().slice(0, 16));
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 rounded-lg transition-all cursor-pointer border border-amber-500/10"
                >
                  📅 1 Month Preset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    const annDateStr = anniversaryDate || "2024-10-25";
                    const ann = new Date(annDateStr);
                    const today = new Date();
                    ann.setFullYear(today.getFullYear());
                    if (ann <= today) {
                      ann.setFullYear(today.getFullYear() + 1);
                    }
                    setCapsuleOpenDate(ann.toISOString().slice(0, 16));
                  }}
                  className="px-2.5 py-1 text-[10px] font-bold bg-pink-500/10 hover:bg-pink-500/20 text-pink-700 dark:text-pink-300 rounded-lg transition-all cursor-pointer border border-pink-500/10"
                >
                  💖 Anniversary Preset
                </button>
              </div>
            </div>
            {capsuleError && <p className="text-xs text-red-500 font-bold">{capsuleError}</p>}
          </div>
          <StickerButton type="submit" color="gold" className="w-full" icon={<Lock className="w-3.5 h-3.5" />}>
            Seal Time Capsule
          </StickerButton>
        </motion.form>
      )}

      <WashiTapeDivider color="coral" label={lettersMode === "letters" ? "Letters" : "Capsules"} />

      {/* ─── LETTERS LIST ─── */}
      {lettersMode === "letters" && (
        <div className="p-6 md:p-8 space-y-4 max-w-3xl mx-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b pb-2 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[var(--primary)]" /> Sealed Envelopes Box ({letters.length})
          </h4>
          {letters.length === 0 ? (
            <EmptyJournalPage icon="💌" message="Your envelopes cabinet is empty" subtitle="Write a sweet letter above to surprise your partner!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-1">
              {letters.map((letItem) => {
                const isSender = letItem.senderId === currentUser;
                const isLocked = letItem.scheduledFor && new Date(letItem.scheduledFor) > new Date();
                return (
                  <motion.div key={letItem.id} 
                    whileHover={{ scale: 1.04, y: -4, rotate: isSender ? 1 : -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (isLocked) {
                        toast.error("🔒 This envelope is magically sealed until the countdown date!");
                      } else {
                        setOpenedLetterId(letItem.id);
                        if (!letItem.isOpened && letItem.recipientId === currentUser) openLetter(letItem.id);
                        triggerHaptic("success");
                      }
                    }}
                    className="relative aspect-[3/2] rounded-xl border border-[#E8DDD0] dark:border-white/5 bg-gradient-to-br from-[#FFFDF9] to-[#F3E2C3] dark:from-[#252542] dark:to-[#1A1A2E] shadow-sm hover:shadow-md cursor-pointer overflow-hidden p-4 flex flex-col justify-between text-left group"
                  >
                    {/* Envelope Flap */}
                    <div 
                      className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-[#f2dac2]/60 to-[#e4bc9a]/60 dark:from-[#2d2d4f]/60 dark:to-[#1c1c30]/60 border-b border-amber-900/5 pointer-events-none z-10 transition-transform duration-300 origin-top group-hover:scale-y-105"
                      style={{ clipPath: "polygon(0 0, 100% 0, 50% 90%)" }}
                    />

                    {/* Wax Seal with heart emoji */}
                    <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E8B4B8] dark:bg-rose-900/90 shadow-[0_2px_5px_rgba(45,42,38,0.25)] flex items-center justify-center text-xs text-white select-none z-20 transition-transform duration-300 group-hover:scale-110">
                      ❤️
                    </div>

                    <div className="relative z-10 flex flex-col h-full justify-between pt-12">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#2D2A26] dark:text-[#F5F0EB] truncate pr-1 font-sans">{letItem.title}</p>
                        <p className="text-[9px] text-[#8B7355] dark:text-[#B8B0A4] font-mono uppercase mt-0.5">
                          {isSender ? "Sent" : "Received"} • {new Date(letItem.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-amber-900/10 dark:border-white/5">
                        <span className="text-[9px] font-mono font-bold text-[#8B7355] dark:text-[#B8B0A4]">
                          TO: {isSender ? "PARTNER" : "ME"}
                        </span>
                        <div>
                          {isLocked ? (
                            <span className="text-[8px] px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold uppercase rounded font-mono">Locked</span>
                          ) : letItem.isOpened ? (
                            <span className="text-[8px] px-1.5 py-0.5 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-bold uppercase rounded">Opened</span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold uppercase rounded animate-pulse">Sealed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TIME CAPSULES ─── */}
      {lettersMode === "capsules" && (
        <div className="p-6 md:p-8 space-y-4 max-w-3xl mx-auto">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b pb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[var(--primary)]" /> Sealed Time Capsules ({timeCapsules.length})
          </h4>
          {timeCapsules.length === 0 ? (
            <EmptyJournalPage icon="⏳" message="No time capsules sealed yet" subtitle="Seal a message for your future selves above!" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-h-[500px] overflow-y-auto pr-1">
              {timeCapsules.map((capsule) => {
                const creator = capsule.senderId === "user_a" ? userA : userB;
                const unlockable = canOpenCapsule(capsule);
                const locked = !capsule.isOpened && !unlockable;
                const daysLeft = Math.ceil((new Date(capsule.openDate).getTime() - Date.now()) / 86400000);
                return (
                  <motion.div 
                    key={capsule.id}
                    whileHover={{ scale: 1.05, y: -4 }}
                    className="relative w-full aspect-[3/4] p-4 flex flex-col justify-between items-center text-center transition-all duration-300 group select-none cursor-pointer"
                  >
                    {/* The Wood Lid */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-gradient-to-r from-amber-800 to-amber-900 rounded-[3px] border border-amber-950 shadow-md z-10" />

                    {/* Glass Jar Body */}
                    <div className="absolute inset-x-2 bottom-2 top-5 rounded-b-[32px] rounded-t-[16px] border-2 border-white/60 dark:border-white/15 bg-gradient-to-b from-white/30 to-white/5 dark:from-white/10 dark:to-white/0 shadow-[0_8px_20px_rgba(45,42,38,0.08),_inset_0_4px_12px_rgba(255,255,255,0.4)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.4),_inset_0_4px_12px_rgba(255,255,255,0.05)] z-0 pointer-events-none" />

                    {/* Gloss Reflection Highlights */}
                    <div className="absolute left-4 bottom-6 top-8 w-1 bg-white/40 dark:bg-white/10 rounded-full z-10 pointer-events-none" />
                    <div className="absolute right-4 bottom-6 top-8 w-0.5 bg-white/20 dark:bg-white/5 rounded-full z-10 pointer-events-none" />

                    {/* Capsule content (slightly visible) */}
                    <div className="relative z-10 flex flex-col items-center justify-center h-full pt-6 px-4 w-full">
                      <div className="mb-3">
                        {capsule.isOpened ? (
                          <span className="text-3xl animate-bounce">📬</span>
                        ) : locked ? (
                          <div className="w-10 h-10 rounded-full bg-amber-900/10 dark:bg-white/10 flex items-center justify-center text-slate-500">
                            <Lock className="w-4 h-4" />
                          </div>
                        ) : (
                          <span className="text-3xl animate-pulse">🔓</span>
                        )}
                      </div>

                      <div className="opacity-75 text-xs text-[#2D2A26] dark:text-[#F5F0EB] max-h-20 overflow-hidden text-ellipsis mb-2">
                        {capsule.isOpened ? (
                          <p className="font-handwrite text-lg leading-tight text-[#8B7355] dark:text-[#B8B0A4]">{capsule.message}</p>
                        ) : locked ? (
                          <div className="space-y-1">
                            <p className="font-sans font-bold text-[9px] uppercase tracking-wider text-[#8B7355] dark:text-[#B8B0A4]">Sealed Message</p>
                            <p className="font-mono text-[8px] text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full w-fit mx-auto">
                              {daysLeft} d remaining
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-amber-700 font-bold">Ready to reveal!</p>
                        )}
                      </div>

                      {/* Open capsule button */}
                      {!capsule.isOpened && !locked && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setWaxSealCapsuleId(capsule.id);
                            setWaxSealStatus("sealed");
                            triggerHaptic("medium");
                          }}
                          className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold rounded-full shadow-xs cursor-pointer animate-pulse z-20"
                        >
                          Unlock!
                        </button>
                      )}
                    </div>

                    <div className="relative z-10 pb-4 text-[8px] font-mono text-[#8B7355] dark:text-[#B8B0A4] uppercase tracking-wider">
                      Sealed: {new Date(capsule.createdAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── LETTER OVERLAY MODAL ─── */}
      <AnimatePresence>
        {openedLetterId && (() => {
          const activeLetter = letters.find((l) => l.id === openedLetterId);
          if (!activeLetter) return null;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label={`Letter: ${activeLetter.title}`}
              onKeyDown={(e) => {
                // Close on Escape
                if (e.key === 'Escape') {
                  setOpenedLetterId(null);
                }
                // Trap Tab focus within the modal
                if (e.key === 'Tab') {
                  const modal = e.currentTarget;
                  const focusable = modal.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                  );
                  if (focusable.length === 0) {
                    e.preventDefault();
                    return;
                  }
                  const first = focusable[0];
                  const last = focusable[focusable.length - 1];
                  if (e.shiftKey) {
                    if (document.activeElement === first) {
                      e.preventDefault();
                      last.focus();
                    }
                  } else {
                    if (document.activeElement === last) {
                      e.preventDefault();
                      first.focus();
                    }
                  }
                }
              }}
            >
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setOpenedLetterId(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                role="document"
                tabIndex={-1}
                className="bg-[var(--fabric-cream)] rounded-3xl border-2 border-[var(--wood-oak)]/50 shadow-2xl w-full max-w-xl z-10 overflow-hidden relative flex flex-col max-h-[85vh] text-left"
              >
                <div className="h-10 bg-[var(--wood-oak)]/25 relative overflow-hidden flex items-center justify-center border-b border-[var(--wood-oak)]/10">
                  <div className="absolute top-0 w-full h-full bg-gradient-to-b from-[var(--wood-oak)]/30 to-transparent" />
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.25, type: "spring" }}
                    className="w-7 h-7 bg-red-700 rounded-full border border-white/85 flex items-center justify-center shadow-md absolute -bottom-3.5 cursor-pointer z-20"
                    onClick={() => setOpenedLetterId(null)}>
                    <Heart className="w-3.5 h-3.5 fill-current text-red-100 animate-pulse" />
                  </motion.div>
                </div>
                <div className="p-8 pb-3 border-b border-[var(--wood-oak)]/10 flex justify-between items-center pr-12 pt-8 flex-shrink-0">
                  <h3 className="text-base font-serif font-bold text-[var(--text-main)]">{activeLetter.title}</h3>
                  <button onClick={() => setOpenedLetterId(null)} className="p-1.5 hover:bg-black/5 rounded-full text-gray-500 hover:text-gray-800 transition-colors cursor-pointer absolute top-4 right-4">
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-4">
                  <div className="text-xs text-[var(--text-muted)] font-mono flex items-center justify-between pb-3 border-b border-[var(--wood-oak)]/10">
                    <span>From: {activeLetter.senderId === "user_a" ? `${userA.name.split(" ")[0]} 🌸` : `${userB.name.split(" ")[0]} ☕`}</span>
                    <span>{new Date(activeLetter.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-[var(--text-main)] leading-relaxed whitespace-pre-wrap font-serif">{activeLetter.content}</p>
                  <div className="pt-6 border-t border-[var(--wood-oak)]/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">React back:</span>
                    <div className="flex gap-1.5">
                      {["💖", "✨", "☕", "😭", "🌸"].map((emoji) => {
                        const activeReactions = activeLetter.reactions || [];
                        const isAdded = activeReactions.includes(emoji);
                        return (
                          <button key={emoji} onClick={() => reactToLetter(activeLetter.id, emoji)}
                            className={`p-2 rounded-full text-base transition-all hover:scale-125 active:scale-95 cursor-pointer ${isAdded ? "bg-[var(--primary)]/10 scale-110 shadow-sm" : "hover:bg-black/5"}`}>
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Paper Airplane Animation */}
      <AnimatePresence>
        {isSending && (
          <motion.div initial={{ x: -100, y: 150, rotate: -45, scale: 0.8, opacity: 0 }}
            animate={{ x: [-100, 20, 200, 400], y: [150, 40, -100, -250], rotate: [-45, -35, -25, -15], scale: [0.8, 1.1, 0.9, 0.6], opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }} transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <div className="relative bg-[var(--fabric-cream)]/90 border-2 border-[var(--wood-oak)]/50 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
              <Send className="w-10 h-10 text-[var(--primary)] transform rotate-45 animate-pulse" />
              <span className="text-[10px] font-bold text-[var(--text-main)] mt-2.5 font-mono uppercase tracking-wider">Sending paper airplane... ✈️</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Wax Seal Modal */}
      <AnimatePresence>
        {waxSealCapsuleId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => {
              if (waxSealStatus === "sealed") {
                setWaxSealCapsuleId(null);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="time-capsule-container bg-amber-50 dark:bg-zinc-900 border-4 border-amber-900/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative text-center flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Wooden Accent Seal Tag */}
              <div className="absolute -top-4 bg-amber-800 text-amber-50 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
                Time Capsule Unsealing
              </div>

              {/* Envelope Container */}
              <div className="w-full bg-[#FCF8F2] dark:bg-zinc-800 border border-amber-900/10 rounded-2xl p-6 shadow-inner mt-4 relative overflow-hidden flex flex-col items-center min-h-[300px] justify-between">
                {/* Vintage Letter Flaps */}
                <div className="absolute top-0 inset-x-0 h-1/2 bg-[#F7F1E5] dark:bg-zinc-700 rounded-t-2xl shadow-xs border-b border-amber-900/5 origin-top transform" style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }} />

                <div className="pt-20 pb-4 z-10 space-y-2">
                  <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider font-sans">
                    {waxSealStatus === "sealed" && "A Sealed Memory Awaits"}
                    {waxSealStatus === "melting" && "Breaking the Seal..."}
                    {waxSealStatus === "melted" && "Revealed!"}
                  </h3>
                  <p className="text-xs text-amber-800/70 dark:text-amber-300/70 max-w-xs mx-auto">
                    {waxSealStatus === "sealed" && "Tap the classic red wax seal to melt the wax and reveal your sealed time capsule."}
                    {waxSealStatus === "melting" && "Feel the warmth... The letters of the past are flowing back into the present."}
                    {waxSealStatus === "melted" && "The message is now unlocked and preserved in your collection."}
                  </p>
                </div>

                {/* The Interactive Wax Seal */}
                <div className="relative z-20 my-2 flex items-center justify-center">
                  <WaxSeal
                    status={waxSealStatus}
                    onMelt={async () => {
                      setWaxSealStatus("melting");
                      triggerHaptic("heavy");
                      // Sequence of haptics for melting feeling
                      const interval = setInterval(() => {
                        triggerHaptic("medium");
                      }, 250);
                      setTimeout(() => {
                        clearInterval(interval);
                        setWaxSealStatus("melted");
                        triggerHaptic("success");
                        openTimeCapsule(waxSealCapsuleId);
                        toast.success("The seal has melted! Message unlocked 📬");
                        setTimeout(() => {
                          setWaxSealCapsuleId(null);
                        }, 1200);
                      }, 1800);
                    }}
                    darkMode={darkMode}
                  />
                </div>

                <div className="z-10 pb-2">
                  <button
                    onClick={() => setWaxSealCapsuleId(null)}
                    disabled={waxSealStatus === "melting"}
                    className="text-xs font-semibold text-amber-900/60 dark:text-amber-100/60 hover:text-amber-900 transition-colors disabled:opacity-30 cursor-pointer"
                  >
                    Cancel / Keep Sealed
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
