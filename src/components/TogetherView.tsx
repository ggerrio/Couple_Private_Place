/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useCouple } from "../context/CoupleContext";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  Send,
  Eye,
  Smile,
  Tv,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  RefreshCw,
  Heart,
  Lock,
  Music,
  Maximize2,
  ChevronRight,
  Sparkles,
  Camera,
  Radio,
  Film,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { db } from "../firebaseClient";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";

// Pre-seeded watch together YouTube options
const watchOptions = [
  { id: "L0MK7qz13bU", title: "Lo-Fi Ghibli Coffee Shop Music ☕", duration: "1:20:00" },
  { id: "2g811Eo7K8U", title: "Seoul Soft Rainy Walk Night Tour 🌧️", duration: "45:30" },
  { id: "q76bMs-NwRk", title: "Romantic Acoustic Covers Playlist 🎸", duration: "2:10:00" },
];

export default function TogetherView() {
  const {
    currentUser,
    userA,
    userB,
    updateProfile,
    letters,
    sendLetter,
    openLetter,
    reactToLetter,
    awardXp,
    session,
  } = useCouple();

  const [activeTab, setActiveTab] = useState<"letters" | "watch" | "status">("letters");

  // --- LIVE STATUS CONTROLLER ---
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const [customStatusInput, setCustomStatusInput] = useState("");

  const STATUS_PRESETS = [
    { emoji: "📚", label: "Studying" },
    { emoji: "💻", label: "Coding" },
    { emoji: "☕", label: "Drinking Coffee" },
    { emoji: "😴", label: "Sleeping" },
    { emoji: "🎮", label: "Gaming" },
    { emoji: "🎵", label: "Listening to Music" },
    { emoji: "🍳", label: "Cooking" },
    { emoji: "📱", label: "On Phone" },
    { emoji: "🏃", label: "Working Out" },
    { emoji: "🌸", label: "Relaxing" },
    { emoji: "✈️", label: "Traveling" },
    { emoji: "💖", label: "Thinking of You" },
  ];

  // Write only on explicit click - never via useEffect watching profile state
  const handleUpdateStatusPreset = useCallback((preset: typeof STATUS_PRESETS[0]) => {
    updateProfile(currentUser, { status: `${preset.emoji} ${preset.label}` });
    awardXp(10, "broadcasting status change");
  }, [currentUser, updateProfile, awardXp]);

  const handleUpdateStatusCustom = useCallback(() => {
    if (!customStatusInput.trim()) return;
    updateProfile(currentUser, { status: customStatusInput.trim() });
    setCustomStatusInput("");
    awardXp(10, "broadcasting custom status");
  }, [customStatusInput, currentUser, updateProfile, awardXp]);

  // --- LIVE LETTERS STATE ---
  const [lTitle, setLTitle] = useState("");
  const [lContent, setLContent] = useState("");
  const [lSchedule, setLSchedule] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null);

  const handleComposeLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lTitle.trim() || !lContent.trim()) return;
    if (lSchedule && new Date(lSchedule) <= new Date()) {
      alert("Scheduled date must be in the future.");
      return;
    }

    sendLetter({
      recipientId: currentUser === "user_a" ? "user_b" : "user_a",
      title: lTitle.trim(),
      content: lContent.trim(),
      scheduledFor: lSchedule ? new Date(lSchedule).toISOString() : undefined,
    });

    setLTitle("");
    setLContent("");
    setLSchedule("");
    setIsComposing(false);
  };

  // --- WATCH TOGETHER STATE (Firestore Synced / Falling back to BroadcastChannel) ---
  const [room, setRoom] = useState<{
    videoId: string;
    isPlaying: boolean;
    chatMessages: { id: string; userId: string; text: string; ts: number }[];
  }>({ videoId: "L0MK7qz13bU", isPlaying: false, chatMessages: [] });
  const [videoInput, setVideoInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [particles, setParticles] = useState<{ id: string; emoji: string; x: number; y: number }[]>([]);
  const [iframeKey, setIframeKey] = useState(0);
  const [theaterSize, setTheaterSize] = useState<"compact" | "medium" | "expanded">("medium");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const EMOJI_BURSTS = ["💖", "😂", "🔥", "✨", "🥹", "👏"];

  // Listen to Firestore watch room doc with 24-hour message cleanup
  useEffect(() => {
    if (!session) return;
    const docRef = doc(db, "rooms", "watch_room");
    const unsub = onSnapshot(docRef, async (d: any) => {
      if (d.exists() && d.data()) {
        const data = d.data();
        const now = Date.now();
        const cutoff = now - 24 * 60 * 60 * 1000;
        const rawMsgs = data.chatMessages || [];
        const validMsgs = rawMsgs.filter((m: any) => m.ts && m.ts >= cutoff);

        // Background cleanup in Firestore if there are expired messages
        if (validMsgs.length < rawMsgs.length) {
          try {
            await setDoc(docRef, { chatMessages: validMsgs }, { merge: true });
          } catch (err) {
            console.error("Failed to clean up expired chat messages:", err);
          }
        }

        setRoom({
          videoId: data.videoId ?? "",
          isPlaying: !!data.isPlaying,
          chatMessages: validMsgs,
        });
      }
    });
    return () => unsub();
  }, [session]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room.chatMessages?.length]);

  const extractVideoId = (url: string): string => {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    return match ? match[1] : url.trim();
  };

  const setVideo = useCallback(async () => {
    const id = extractVideoId(videoInput);
    if (!id) return;
    const docRef = doc(db, "rooms", "watch_room");
    await setDoc(docRef, { videoId: id, isPlaying: false, chatMessages: room.chatMessages || [] }, { merge: true });
    setVideoInput("");
    awardXp(15, "loading sync theater video");
  }, [videoInput, room.chatMessages, awardXp]);

  const loadPresetVideo = useCallback(async (videoId: string) => {
    const docRef = doc(db, "rooms", "watch_room");
    await setDoc(docRef, { videoId, isPlaying: false, chatMessages: room.chatMessages || [] }, { merge: true });
    awardXp(10, "sharing cozy cinema track");
  }, [room.chatMessages, awardXp]);

  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const msg = { id: `${Date.now()}-${Math.random()}`, userId: currentUser, text: chatInput.trim(), ts: Date.now() };
    const docRef = doc(db, "rooms", "watch_room");
    await setDoc(docRef, {
      videoId: room.videoId || "",
      isPlaying: room.isPlaying,
      chatMessages: [...(room.chatMessages || []).slice(-49), msg],
    }, { merge: true });
    setChatInput("");
    awardXp(5, "chatting in Watch Together");
  }, [chatInput, room, currentUser, awardXp]);

  const burstEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setParticles((prev) => [...prev, { id, emoji, x: Math.random() * 80 + 10, y: Math.random() * 60 + 20 }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 2000);
    awardXp(2, "sending emoji reaction");
  };

  return (
    <div className="space-y-6" id="together-hub-container">
      {/* 3-Tab Header Switcher */}
      <div className="flex justify-center border-b border-[var(--border-color)] pb-1">
        <div className="flex gap-6">
          {[
            { value: "letters", label: "Envelope Letters", icon: Mail },
            { value: "status", label: "Activity Status", icon: Eye },
            { value: "watch", label: "Theater Sync", icon: Tv },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isSel = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value as any);
                  setOpenedLetterId(null);
                }}
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative cursor-pointer ${
                  isSel ? "text-[var(--primary)]" : "text-gray-400 hover:text-gray-700"
                }`}
              >
                <IconComp className="w-4 h-4" />
                {tab.label}
                {isSel && (
                  <motion.div
                    layoutId="activeTogetherSubtab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: LIVE LETTERS */}
        {activeTab === "letters" && (
          <motion.div
            key="letters"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header control */}
            <div className="flex items-center justify-between text-left">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Private Live Letters cabinet</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Read and compose cute sealed letters.</p>
              </div>
              <button
                onClick={() => {
                  setIsComposing(!isComposing);
                  setOpenedLetterId(null);
                }}
                className="py-2 px-4 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1 shadow hover:opacity-90 transition-all cursor-pointer"
              >
                {isComposing ? "Close Cabinet" : "Write a Letter ✉️"}
              </button>
            </div>

            {/* LETTER COMPOSE FORM */}
            {isComposing && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleComposeLetter}
                className="bg-white/45 border border-dashed border-rose-300 p-8 rounded-[32px] space-y-4 max-w-xl mx-auto shadow-sm backdrop-blur-md text-left"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-rose-500 uppercase tracking-wide">
                  <Sparkles className="w-4.5 h-4.5 fill-current animate-pulse" />
                  Compose Sealed Message
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                      Letter Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={lTitle}
                      onChange={(e) => setLTitle(e.target.value)}
                      placeholder="e.g. My heart when you are holding my hand..."
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[var(--primary)] text-gray-800 font-serif font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                      Message Content (Supports Markdown)
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={lContent}
                      onChange={(e) => setLContent(e.target.value)}
                      placeholder="Dearest partner,\n\nWrite something warm and cozy..."
                      className="w-full text-xs px-4 py-3 border border-gray-150 rounded-2xl outline-none resize-none font-serif leading-relaxed text-gray-800 focus:border-[var(--primary)] transition-all"
                      style={{ 
                        backgroundColor: "#fcfaf2", 
                        backgroundImage: "linear-gradient(rgba(0,0,0,0) 95%, #e8dfcc 5%)", 
                        backgroundSize: "100% 24px", 
                        lineHeight: "24px" 
                      }} 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">
                      Lock Until Specific Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={lSchedule}
                      onChange={(e) => setLSchedule(e.target.value)}
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent text-gray-850 cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Seal & Send Letter
                </button>
              </motion.form>
            )}

            {/* LETTERS CABINET GRID & ACTIVE DETAIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-left">
              {/* Left Column: Envelope Cabinet List */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b pb-1">
                  Sealed Envelopes Box
                </h4>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {letters.map((letItem) => {
                    const isSender = letItem.senderId === currentUser;
                    const isLocked = letItem.scheduledFor && new Date(letItem.scheduledFor) > new Date();

                    return (
                      <motion.div
                        key={letItem.id}
                        onClick={() => {
                          if (isLocked) {
                            alert("This envelope is magically sealed until the countdown date! ⏳🔒");
                          } else {
                            setOpenedLetterId(letItem.id);
                            if (!letItem.isOpened && letItem.recipientId === currentUser) {
                              openLetter(letItem.id);
                            }
                          }
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between border group ${
                          openedLetterId === letItem.id
                            ? "border-[var(--primary)] bg-rose-50/40"
                            : "border-[var(--border-color)] bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 ${isLocked ? "bg-gray-100 text-gray-400" : "bg-rose-100 text-rose-500"}`}>
                            {isLocked ? <Lock className="w-4.5 h-4.5" /> : <Mail className="w-4.5 h-4.5 fill-current" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[var(--text-main)] truncate max-w-[150px]">
                              {letItem.title}
                            </p>
                            <p className="text-[9px] text-[var(--text-muted)] font-mono uppercase">
                              {isSender ? "Sent to partner" : "From partner"} •{" "}
                              {new Date(letItem.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Status tag */}
                        <div className="text-right">
                          {isLocked ? (
                            <span className="text-[8px] px-1.5 py-0.5 bg-amber-50 text-amber-700 font-bold uppercase rounded font-mono">
                              Locked
                            </span>
                          ) : letItem.isOpened ? (
                            <span className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-700 font-bold uppercase rounded">
                              Read
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 bg-rose-100 text-rose-700 font-bold uppercase rounded animate-pulse">
                              Sealed
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Beautiful wax seal crack & Letter open display */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b pb-1">
                  Active Reading Stand
                </h4>

                {openedLetterId === null ? (
                  <div className="p-12 text-center bg-white/40 border border-white rounded-2xl flex flex-col items-center group">
                    <Mail className="w-8 h-8 text-rose-300 mb-2 transition-transform duration-500 group-hover:scale-110" />
                    <p className="text-xs font-semibold text-[var(--text-main)]">No letter opened</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Select an envelope from the cabinet</p>
                  </div>
                ) : (
                  (() => {
                    const activeLetter = letters.find((l) => l.id === openedLetterId);
                    if (!activeLetter) return null;

                    return (
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden relative text-left"
                      >
                        {/* Physical envelope top fold design mockup */}
                        <div className="h-6 bg-rose-100/50 relative overflow-hidden flex items-center justify-center">
                          <div className="absolute top-0 w-full h-full bg-gradient-to-b from-rose-200/40 to-transparent" />
                          <div className="w-4 h-4 bg-rose-300 rounded-full border border-white/80 absolute -bottom-2 shadow-inner" />
                        </div>

                        <div className="p-8 space-y-4 font-serif">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-800 leading-tight">
                              {activeLetter.title}
                            </h3>
                            <button
                              onClick={() => setOpenedLetterId(null)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer rounded-full hover:bg-gray-50"
                              title="Close Letter"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-xs text-gray-400 font-sans flex items-center justify-between pb-3 border-b border-rose-100">
                            <span>From: {activeLetter.senderId === "user_a" ? `${userA.name.split(" ")[0]} 🌸` : `${userB.name.split(" ")[0]} ☕`}</span>
                            <span>{new Date(activeLetter.createdAt).toLocaleDateString()}</span>
                          </div>

                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {activeLetter.content}
                          </p>

                          {/* Quick Emoji Reaction cabinet on letter */}
                          <div className="pt-6 border-t border-rose-100 flex items-center justify-between gap-2 font-sans">
                            <span className="text-[10px] text-gray-400">React back:</span>
                            <div className="flex gap-1.5">
                              {["💖", "✨", "☕", "😭", "🌸"].map((emoji) => {
                                const activeReactions = activeLetter.reactions || [];
                                const isAdded = activeReactions.includes(emoji);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => reactToLetter(activeLetter.id, emoji)}
                                    className={`p-1.5 rounded-full text-sm transition-all cursor-pointer ${
                                      isAdded ? "bg-rose-100 scale-110 shadow-sm" : "hover:bg-black/5"
                                    }`}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: LIVE STATUS */}
        {activeTab === "status" && (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-xl mx-auto space-y-6 text-left"
          >
            <div className="bg-white/45 border border-neutral-200/40 p-6 md:p-8 rounded-[32px] space-y-6 shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md">
              <h3 className="text-sm font-bold text-[var(--text-main)]">Live Activity Status</h3>

              {/* Partner comparison */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { profile: activeProfile, label: "You" },
                  { profile: partnerProfile, label: "Partner" },
                ].map(({ profile, label }) => (
                  <div key={profile.id} className="bg-white/30 border border-white/50 rounded-2xl p-4 text-center shadow-xs">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-white/80"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-xs font-bold text-[var(--text-main)]">{label}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{profile.name.split(" ")[0]}</p>
                    <p className="text-xs text-[var(--primary)] mt-2 font-semibold leading-tight min-h-[1.5rem] flex items-center justify-center">
                      {profile.status || "🌸 Floating in space"}
                    </p>
                  </div>
                ))}
              </div>

              {/* Presets */}
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Set your status</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {STATUS_PRESETS.map((preset) => {
                    const isSelected = activeProfile.status === `${preset.emoji} ${preset.label}`;
                    return (
                      <button
                        key={preset.label}
                        id={`status-preset-${preset.label.replace(/\s/g, "-").toLowerCase()}`}
                        onClick={() => handleUpdateStatusPreset(preset)}
                        className={`p-2.5 rounded-xl text-center border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex flex-col items-center justify-center ${
                          isSelected
                            ? "bg-[var(--primary)] text-white border-transparent font-bold shadow-xs"
                            : "bg-white/30 border-white/50 hover:bg-white/50 text-[var(--text-main)]"
                        }`}
                      >
                        <span className="text-xl block">{preset.emoji}</span>
                        <span className="text-[9px] font-semibold block mt-0.5 truncate w-full">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom */}
              <div className="flex gap-2">
                <input
                  value={customStatusInput}
                  onChange={(e) => setCustomStatusInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateStatusCustom()}
                  placeholder="Set a custom status..."
                  maxLength={60}
                  className="flex-1 text-xs px-3 py-2 bg-white/30 border border-white/50 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] transition-colors text-gray-850 font-semibold"
                />
                <button
                  id="custom-status-set-btn"
                  onClick={handleUpdateStatusCustom}
                  className="px-3.5 py-2 bg-rose-500 text-white rounded-xl hover:opacity-90 cursor-pointer shadow-xs transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-rose-50 text-rose-800 text-[10px] rounded-xl flex items-center gap-2 border border-rose-200">
              <div className="p-1.5 bg-rose-100 rounded-full animate-pulse">✨</div>
              <div>
                <span className="font-bold">Realtime status synchronization:</span> Your active connection status updates immediately across all shared bubbles and instances in real-time.
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: WATCH TOGETHER */}
        {activeTab === "watch" && (
          <motion.div
            key="watch"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left"
          >
            {/* Left Movie Player Stream */}
            <div
              className={`${
                theaterSize === "compact"
                  ? "lg:col-span-5"
                  : theaterSize === "expanded"
                  ? "lg:col-span-9"
                  : "lg:col-span-8"
              } space-y-4 transition-all duration-300`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                <div className="flex items-center gap-1.5">
                  <Film className="text-rose-500 w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                    Co-Watching Theater
                  </span>
                </div>
                {/* Dynamically adjust theater size buttons */}
                <div className="flex items-center gap-1 bg-black/5 p-1 rounded-xl text-[10px] font-bold">
                  <span className="text-gray-400 px-1.5 select-none">Screen Size:</span>
                  {(["compact", "medium", "expanded"] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setTheaterSize(sz)}
                      className={`px-2.5 py-0.5 rounded-lg capitalize transition-all duration-200 cursor-pointer ${
                        theaterSize === sz
                          ? "bg-rose-500 text-white shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                {/* Main Easel Casing */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-[14px] border-neutral-800 bg-neutral-900 p-1" style={{ paddingBottom: "56.25%", height: 0 }}>
                  {room.videoId ? (
                    <iframe
                      key={iframeKey}
                      src={`https://www.youtube.com/embed/${room.videoId}?autoplay=0&rel=0`}
                      title="Watch Together"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0 rounded-xl"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-neutral-500 border border-white/15">
                        <Tv className="w-8 h-8 stroke-1" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold">Private Movie Theater Screen</p>
                        <p className="text-neutral-500 text-xs mt-1 max-w-sm">
                          Enter a YouTube URL below to load your favorite stream or video synchronized!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Floating particles inside the frame */}
                  {particles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 1, scale: 0.5, y: 0 }}
                      animate={{ opacity: 0, y: -100, scale: 1.6 }}
                      transition={{ duration: 2.2, ease: "easeOut" }}
                      className="absolute text-3xl pointer-events-none z-30"
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    >
                      {p.emoji}
                    </motion.div>
                  ))}
                </div>

                {/* Wood Easel Legs */}
                <div className="flex justify-between px-16 -mt-1.5 relative z-0">
                  <div className="w-4 h-8 bg-neutral-800 rounded-b shadow-md transform rotate-12" />
                  <div className="w-4 h-10 bg-neutral-700 rounded-b shadow-md -mt-1" />
                  <div className="w-4 h-8 bg-neutral-800 rounded-b shadow-md transform -rotate-12" />
                </div>
              </div>

              {/* Theater Control Panel & Inputs */}
              <div className="bg-white/40 border border-neutral-200/40 p-5 rounded-[24px] shadow-xs">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    placeholder="Paste YouTube Video URL or ID..."
                    className="flex-1 bg-black/5 text-xs rounded-lg px-3 outline-none border border-transparent focus:border-[var(--primary)] text-gray-800 font-semibold"
                    onKeyDown={(e) => e.key === "Enter" && setVideo()}
                  />
                  <button
                    onClick={setVideo}
                    className="text-xs font-bold bg-black text-white px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Load Video
                  </button>
                  <button
                    onClick={() => setIframeKey((k) => k + 1)}
                    title="Force refresh screen sync"
                    className="p-2 border border-gray-200 hover:border-[var(--primary)] bg-white/80 rounded-lg transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={async () => {
                      const docRef = doc(db, "rooms", "watch_room");
                      await setDoc(docRef, { videoId: "", isPlaying: false, chatMessages: room.chatMessages || [] }, { merge: true });
                    }}
                    title="Clear Screen"
                    className="p-2 border border-rose-200 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
                

              </div>
            </div>

            {/* Right Chat & Reaction Panel */}
            <div
              className={`${
                theaterSize === "compact"
                  ? "lg:col-span-7"
                  : theaterSize === "expanded"
                  ? "lg:col-span-3"
                  : "lg:col-span-4"
              } flex flex-col justify-between bg-white/45 border border-neutral-200/40 rounded-[28px] p-5 h-[480px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-300`}
            >
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] border-b pb-2 flex items-center gap-1.5 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-rose-500 animate-pulse" />
                    Live Room Chat
                  </h4>

                  {/* Scrollable logs */}
                  <div className="space-y-3 mt-3 flex-1 overflow-y-auto text-xs pr-1 scrollbar-thin scrollbar-thumb-black/5">
                    {room.chatMessages && room.chatMessages.length > 0 ? (
                      room.chatMessages.map((msg) => {
                        const profile = msg.userId === "user_a" ? userA : userB;
                        const isMe = msg.userId === currentUser;
                        return (
                          <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                            <img
                              src={profile.avatar}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0 border border-white shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex flex-col max-w-[75%]">
                              <span className="text-[9px] text-gray-400 px-1 mb-0.5 self-start">
                                {profile.name}
                              </span>
                              <div
                                className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words ${
                                  isMe
                                    ? "bg-[var(--primary)] text-white rounded-br-md font-medium"
                                    : "bg-white text-[var(--text-main)] border border-neutral-200/40 rounded-bl-md"
                                }`}
                              >
                                {msg.text}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[var(--text-muted)] space-y-1">
                        <Smile className="w-8 h-8 text-neutral-300 stroke-1" />
                        <p className="text-xs">No chatter yet in this private room.</p>
                        <p className="text-[10px]">Type below to sync thoughts in real-time!</p>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                </div>

                {/* Reaction tray & chat input */}
                <div className="space-y-2 flex-shrink-0">
                  <div className="flex justify-between items-center bg-black/5 p-1 rounded-lg">
                    {EMOJI_BURSTS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => burstEmoji(emoji)}
                        className="text-lg hover:scale-135 active:scale-90 transition-all cursor-pointer animate-pulse"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      placeholder="Comment synchronously..."
                      className="flex-1 bg-black/5 text-xs rounded-lg px-3 outline-none border border-transparent focus:border-[var(--primary)] text-gray-800 font-semibold"
                    />
                    <button
                      onClick={sendChat}
                      className="p-2 rounded-lg bg-black text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
