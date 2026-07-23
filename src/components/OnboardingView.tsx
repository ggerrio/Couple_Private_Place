import React, { useState, useEffect } from "react";
import { useCouple, DEFAULT_AVATAR_A, DEFAULT_AVATAR_B } from "../context/CoupleContext";
import { initialUserA, initialUserB } from "../context/defaults";
import { getDb } from "../firebaseClient";
import { Heart, Sparkles, LogOut, CheckCircle, ShieldAlert, User, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { ScrapbookPage, WashiTapeDivider, StickerButton } from "./scrapbook";
import { isDemoMode } from "../utils/demoMode";

export default function OnboardingView() {
  const { logout, claimProfileSlot } = useCouple();
  const [selectedSlot, setSelectedSlot] = useState<"user_a" | "user_b" | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const demoMode = isDemoMode();

  const [slotsStatus, setSlotsStatus] = useState<{
    user_a: { claimed: boolean; name: string; avatarUrl?: string };
    user_b: { claimed: boolean; name: string; avatarUrl?: string };
  }>({
    user_a: { claimed: false, name: "Partner A" },
    user_b: { claimed: false, name: "Partner B" },
  });

  useEffect(() => {
    // Demo mode: skip Firestore listener — show both slots as available
    if (demoMode) {
      setSlotsStatus({
        user_a: { claimed: false, name: initialUserA.name + " (Demo)" },
        user_b: { claimed: false, name: initialUserB.name + " (Demo)" },
      });
      return;
    }

    let unsubscribe: (() => void) | null = null;
    (async () => {
      const db = await getDb();
      if (!db) return;
      const { collection, onSnapshot } = await import("firebase/firestore");
      unsubscribe = onSnapshot(collection(db, "profiles"), (snapshot) => {
        const profilesList: any[] = [];
        snapshot.forEach((doc) => {
          profilesList.push({ id: doc.id, ...doc.data() });
        });

        const slotA = profilesList.find((p) => p.id === "user_a");
        const slotB = profilesList.find((p) => p.id === "user_b");

        setSlotsStatus({
          user_a: {
            claimed: !!slotA?.auth_id,
            name: slotA?.name || "Partner A",
            avatarUrl: slotA?.avatar_url || slotA?.avatar,
          },
          user_b: {
            claimed: !!slotB?.auth_id,
            name: slotB?.name || "Partner B",
            avatarUrl: slotB?.avatar_url || slotB?.avatar,
          },
        });
      }, (err) => {
        console.error("Error listening to slots:", err);
        toast.error("Failed to sync profile slots.");
      });
    })();

    return () => { if (unsubscribe) unsubscribe(); };
  }, [demoMode]);

  const handleClaim = async () => {
    if (!selectedSlot) return;
    setLoading(true);
    setErrorMsg("");

    try {
      await claimProfileSlot(selectedSlot);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to claim slot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Warm treehouse light */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse"
        style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 10%, transparent)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse-slow"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg relative z-10"
      >
        <ScrapbookPage>
          {/* Demo mode badge */}
          {demoMode && (
            <div className="flex justify-center mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-400/40 text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-300">
                <FlaskConical className="w-2.5 h-2.5" />
                Demo
              </span>
            </div>
          )}

          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border animate-float mb-2"
              style={{
                backgroundColor: 'var(--wood-walnut)',
                borderColor: 'var(--wood-oak)'
              }}
            >
              <Heart className="w-6 h-6 fill-current animate-heartbeat" style={{ color: 'var(--color-secondary)' }} />
            </div>
            <h2 className="text-2xl font-bold font-display tracking-wide text-[var(--text-main)] flex items-center gap-1.5 justify-center">
              <span>Claim Your Spot</span>
              <Sparkles className="w-5 h-5" style={{ color: 'var(--wood-pine)' }} />
            </h2>
            <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed mx-auto font-medium font-sans">
              {demoMode
                ? "You're in demo mode! Pick a side to explore the Treehouse with sample data."
                : "You've climbed the rope ladder! Now choose which side of the treehouse is yours."}
            </p>
          </div>

          <WashiTapeDivider color="moss" label="Choose" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Partner A */}
            <button
              type="button"
              disabled={slotsStatus.user_a.claimed && !demoMode}
              aria-label={`Select ${slotsStatus.user_a.name}'s slot (Slot A)`}
              aria-pressed={selectedSlot === "user_a"}
              onClick={() => {
                if (!slotsStatus.user_a.claimed || demoMode) {
                  setSelectedSlot("user_a");
                  setErrorMsg("");
                }
              }}
              className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                slotsStatus.user_a.claimed && !demoMode
                  ? "opacity-50 cursor-not-allowed"
                  : selectedSlot === "user_a"
                  ? "scale-[1.02]"
                  : "hover:scale-[1.01] cursor-pointer"
              }`}
              style={{
                backgroundColor: selectedSlot === "user_a" ? 'var(--color-muted)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: selectedSlot === "user_a" ? 'var(--wood-walnut)' : (slotsStatus.user_a.claimed && !demoMode ? 'var(--border-color)' : 'var(--wood-oak)'),
                boxShadow: selectedSlot === "user_a" ? '0 4px 20px rgba(92, 58, 30, 0.15)' : 'none'
              }}
            >
              {slotsStatus.user_a.claimed && slotsStatus.user_a.avatarUrl && !demoMode ? (
                <img loading="lazy"
                  src={slotsStatus.user_a.avatarUrl}
                  alt={slotsStatus.user_a.name}
                  className="w-20 h-20 rounded-full object-cover shadow-md"
                  style={{ border: '2px solid var(--wood-oak)' }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: 'var(--color-muted)', border: '2px solid var(--wood-oak)' }}
                >
                  <User className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <span className="text-sm font-black mt-3" style={{ color: 'var(--text-main)' }}>
                {slotsStatus.user_a.name}
              </span>
              <div className="flex items-center gap-1.5 mt-1 justify-center">
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Slot A</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--wood-walnut) 10%, transparent)', color: 'var(--wood-walnut)' }}
                >
                  {demoMode ? "♂️" : "Pria ♂️"}
                </span>
              </div>

              {slotsStatus.user_a.claimed && !demoMode ? (
                <span className="mt-3.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(168, 50, 68, 0.08)', color: 'var(--color-destructive)' }}
                >
                  <ShieldAlert className="w-3 h-3" /> Occupied
                </span>
              ) : selectedSlot === "user_a" ? (
                <span className="mt-3.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(91, 140, 90, 0.12)', color: 'var(--foliage-forest)' }}
                >
                  <CheckCircle className="w-3 h-3" /> Selected
                </span>
              ) : (
                <span className="mt-3.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 12%, transparent)', color: 'var(--wood-walnut)' }}
                >
                  {demoMode ? "Pick me!" : "Available"}
                </span>
              )}
            </button>

            {/* Partner B */}
            <button
              type="button"
              disabled={slotsStatus.user_b.claimed && !demoMode}
              aria-label={`Select ${slotsStatus.user_b.name}'s slot (Slot B)`}
              aria-pressed={selectedSlot === "user_b"}
              onClick={() => {
                if (!slotsStatus.user_b.claimed || demoMode) {
                  setSelectedSlot("user_b");
                  setErrorMsg("");
                }
              }}
              className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
                slotsStatus.user_b.claimed && !demoMode
                  ? "opacity-50 cursor-not-allowed"
                  : selectedSlot === "user_b"
                  ? "scale-[1.02]"
                  : "hover:scale-[1.01] cursor-pointer"
              }`}
              style={{
                backgroundColor: selectedSlot === "user_b" ? 'var(--color-muted)' : 'rgba(255, 255, 255, 0.5)',
                borderColor: selectedSlot === "user_b" ? 'var(--wood-walnut)' : (slotsStatus.user_b.claimed && !demoMode ? 'var(--border-color)' : 'var(--wood-oak)'),
                boxShadow: selectedSlot === "user_b" ? '0 4px 20px rgba(92, 58, 30, 0.15)' : 'none'
              }}
            >
              {slotsStatus.user_b.claimed && slotsStatus.user_b.avatarUrl && !demoMode ? (
                <img loading="lazy"
                  src={slotsStatus.user_b.avatarUrl}
                  alt={slotsStatus.user_b.name}
                  className="w-20 h-20 rounded-full object-cover shadow-md"
                  style={{ border: '2px solid var(--wood-oak)' }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: 'var(--color-muted)', border: '2px solid var(--wood-oak)' }}
                >
                  <User className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                </div>
              )}
              <span className="text-sm font-black mt-3" style={{ color: 'var(--text-main)' }}>
                {slotsStatus.user_b.name}
              </span>
              <div className="flex items-center gap-1.5 mt-1 justify-center">
                <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>Slot B</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', color: 'var(--color-primary)' }}
                >
                  {demoMode ? "♀️" : "Wanita ♀️"}
                </span>
              </div>

              {slotsStatus.user_b.claimed && !demoMode ? (
                <span className="mt-3.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(168, 50, 68, 0.08)', color: 'var(--color-destructive)' }}
                >
                  <ShieldAlert className="w-3 h-3" /> Occupied
                </span>
              ) : selectedSlot === "user_b" ? (
                <span className="mt-3.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1"
                  style={{ backgroundColor: 'rgba(91, 140, 90, 0.12)', color: 'var(--foliage-forest)' }}
                >
                  <CheckCircle className="w-3 h-3" /> Selected
                </span>
              ) : (
                <span className="mt-3.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--wood-oak) 12%, transparent)', color: 'var(--wood-walnut)' }}
                >
                  {demoMode ? "Pick me!" : "Available"}
                </span>
              )}
            </button>
          </div>

          {errorMsg && (
            <p role="alert" className="text-xs font-semibold p-2.5 rounded-xl"
              style={{ backgroundColor: 'rgba(168, 50, 68, 0.08)', border: '1px solid rgba(168, 50, 68, 0.2)', color: 'var(--color-destructive)' }}
            >
              ⚠️ {errorMsg}
            </p>
          )}

          <div className="space-y-3.5 pt-2">
            <StickerButton
              type="button"
              onClick={handleClaim}
              disabled={!selectedSlot || loading}
              color={demoMode ? "gold" : "gold"}
              size="lg"
              className="w-full"
              aria-label={!selectedSlot ? "Select a slot first" : `Enter treehouse as ${selectedSlot === "user_a" ? slotsStatus.user_a.name : slotsStatus.user_b.name}`}
            >
              {loading ? (
                "Climbing in..."
              ) : !selectedSlot ? (
                demoMode ? "Tap a slot above" : "Select Your Spot Above"
              ) : (
                `Enter as ${selectedSlot === "user_a" ? slotsStatus.user_a.name : slotsStatus.user_b.name}`
              )}
            </StickerButton>

            <StickerButton
              type="button"
              onClick={logout}
              color="coral"
              size="sm"
              className="w-full"
              icon={<LogOut className="w-3.5 h-3.5" />}
              aria-label={demoMode ? "Exit demo mode" : "Switch to a different Google account"}
            >
              {demoMode ? "Exit Demo" : "Switch Account"}
            </StickerButton>
          </div>
        </ScrapbookPage>
      </motion.div>
    </div>
  );
}
