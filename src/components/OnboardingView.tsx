import React, { useState, useEffect } from "react";
import { useCouple, DEFAULT_AVATAR_A, DEFAULT_AVATAR_B } from "../context/CoupleContext";
import { db } from "../firebaseClient";
import { collection, onSnapshot } from "firebase/firestore";
import { Heart, Sparkles, LogOut, CheckCircle, ShieldAlert, User } from "lucide-react";
import { motion } from "motion/react";

export default function OnboardingView() {
  const { logout, claimProfileSlot } = useCouple();
  const [selectedSlot, setSelectedSlot] = useState<"user_a" | "user_b" | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Real-time slot status from database
  const [slotsStatus, setSlotsStatus] = useState<{
    user_a: { claimed: boolean; name: string; avatarUrl?: string };
    user_b: { claimed: boolean; name: string; avatarUrl?: string };
  }>({
    user_a: { claimed: false, name: "Partner A" },
    user_b: { claimed: false, name: "Partner B" },
  });

  useEffect(() => {
    // Subscribe to profile changes to keep slot occupancy real-time using Firestore
    const unsubscribe = onSnapshot(collection(db, "profiles"), (snapshot) => {
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
    });

    return () => unsubscribe();
  }, []);

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
      className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-app)] px-4 py-12 relative overflow-hidden"
      style={{ background: "var(--bg-gradient)", backgroundAttachment: "fixed" }}
    >
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-rose-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl animate-pulse-slow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg p-8 glass-panel rounded-[32px] border border-white/80 shadow-2xl relative z-10 text-center space-y-8"
      >
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg border border-white/20 animate-float mb-2">
            <Heart className="w-6 h-6 fill-current animate-heartbeat text-rose-100" />
          </div>
          <h2 className="text-2xl font-black font-display uppercase tracking-widest text-[var(--text-main)] flex items-center gap-1.5 justify-center">
            <span>Claim Your Slot</span>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
          </h2>
          <p className="text-xs text-[var(--text-muted)] max-w-sm leading-relaxed mx-auto font-medium">
            You have successfully logged into the sanctuary. Please select which partner identity slot you are claiming.
          </p>
        </div>

        {/* Slot Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Partner A */}
          <button
            type="button"
            disabled={slotsStatus.user_a.claimed}
            onClick={() => {
              if (!slotsStatus.user_a.claimed) {
                setSelectedSlot("user_a");
                setErrorMsg("");
              }
            }}
            className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
              slotsStatus.user_a.claimed
                ? "border-gray-200/50 bg-gray-100/10 opacity-50 cursor-not-allowed"
                : selectedSlot === "user_a"
                ? "border-blue-400 bg-white/70 shadow-lg ring-2 ring-blue-300 scale-[1.02]"
                : "border-white/40 bg-white/30 hover:bg-white/40 hover:scale-[1.01] cursor-pointer"
            }`}
          >
            {slotsStatus.user_a.claimed && slotsStatus.user_a.avatarUrl ? (
              <img
                src={slotsStatus.user_a.avatarUrl}
                alt={slotsStatus.user_a.name}
                className="w-20 h-20 rounded-full object-cover border border-blue-200 dark:border-blue-900 shadow-md bg-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20 text-blue-400 dark:text-blue-300 flex items-center justify-center shadow-inner">
                <User className="w-10 h-10" />
              </div>
            )}
            <span className="text-sm font-black mt-3 text-gray-800">
              {slotsStatus.user_a.name}
            </span>
            <div className="flex items-center gap-1.5 mt-1 justify-center">
              <span className="text-[10px] text-gray-400 font-mono">Slot A</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 flex items-center gap-0.5">
                Pria ♂️
              </span>
            </div>

            {/* Badges */}
            {slotsStatus.user_a.claimed ? (
              <span className="mt-3.5 text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Occupied
              </span>
            ) : selectedSlot === "user_a" ? (
              <span className="mt-3.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Selected
              </span>
            ) : (
              <span className="mt-3.5 text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">
                Available
              </span>
            )}
          </button>

          {/* Partner B */}
          <button
            type="button"
            disabled={slotsStatus.user_b.claimed}
            onClick={() => {
              if (!slotsStatus.user_b.claimed) {
                setSelectedSlot("user_b");
                setErrorMsg("");
              }
            }}
            className={`p-5 rounded-2xl border transition-all flex flex-col items-center text-center relative ${
              slotsStatus.user_b.claimed
                ? "border-gray-200/50 bg-gray-100/10 opacity-50 cursor-not-allowed"
                : selectedSlot === "user_b"
                ? "border-pink-400 bg-white/70 shadow-lg ring-2 ring-pink-300 scale-[1.02]"
                : "border-white/40 bg-white/30 hover:bg-white/40 hover:scale-[1.01] cursor-pointer"
            }`}
          >
            {slotsStatus.user_b.claimed && slotsStatus.user_b.avatarUrl ? (
              <img
                src={slotsStatus.user_b.avatarUrl}
                alt={slotsStatus.user_b.name}
                className="w-20 h-20 rounded-full object-cover border border-pink-200 dark:border-pink-900 shadow-md bg-white"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border border-pink-200 dark:border-pink-900 bg-pink-50 dark:bg-pink-950/20 text-pink-400 dark:text-pink-300 flex items-center justify-center shadow-inner">
                <User className="w-10 h-10" />
              </div>
            )}
            <span className="text-sm font-black mt-3 text-gray-800">
              {slotsStatus.user_b.name}
            </span>
            <div className="flex items-center gap-1.5 mt-1 justify-center">
              <span className="text-[10px] text-gray-400 font-mono">Slot B</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 border border-pink-100 flex items-center gap-0.5">
                Wanita ♀️
              </span>
            </div>

            {/* Badges */}
            {slotsStatus.user_b.claimed ? (
              <span className="mt-3.5 text-[9px] font-bold uppercase tracking-wider text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Occupied
              </span>
            ) : selectedSlot === "user_b" ? (
              <span className="mt-3.5 text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Selected
              </span>
            ) : (
              <span className="mt-3.5 text-[9px] font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2.5 py-1 rounded-full">
                Available
              </span>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-500 font-semibold bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
            ⚠️ {errorMsg}
          </p>
        )}

        <div className="space-y-3.5 pt-2">
          <button
            type="button"
            onClick={handleClaim}
            disabled={!selectedSlot || loading}
            className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-200 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 animate-pulse"
                : !selectedSlot
                ? "bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-400 dark:text-zinc-500"
                : selectedSlot === "user_a"
                ? "bg-blue-500 hover:bg-blue-600 text-white border border-blue-600"
                : "bg-rose-500 hover:bg-rose-600 text-white border border-rose-600"
            }`}
          >
            {loading ? (
              "Claiming..."
            ) : !selectedSlot ? (
              "Select Your Partner Slot Above"
            ) : (
              `Confirm & Enter as ${selectedSlot === "user_a" ? slotsStatus.user_a.name : slotsStatus.user_b.name} 💖`
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 bg-transparent text-gray-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-white/50"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
