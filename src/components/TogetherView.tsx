/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";

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
  } = useCouple();

  const [activeTab, setActiveTab] = useState<"letters" | "watch" | "status">("letters");

  // --- LIVE STATUS CONTROLLER ---
  const activeProfile = currentUser === "user_a" ? userA : userB;
  const partnerProfile = currentUser === "user_a" ? userB : userA;

  const [customStatusInput, setCustomStatusInput] = useState("");

  const statusPresets = [
    { value: "Online 🟢", emoji: "🟢" },
    { value: "Sipping hand-drip coffee ☕", emoji: "☕" },
    { value: "Coding cute features 💻", emoji: "💻" },
    { value: "Taking a warm nap 💤", emoji: "💤" },
    { value: "Studying hard 📚", emoji: "📚" },
    { value: "Gaming on Nintendo 🎮", emoji: "🎮" },
    { value: "Driving under stars 🚗", emoji: "🚗" },
    { value: "Listening to Ghibli 🎵", emoji: "🎵" },
  ];

  const handleUpdateStatus = (statusStr: string) => {
    updateProfile(currentUser, { status: statusStr });
    awardXp(10, "broadcasting status change");
  };

  // --- LIVE LETTERS STATE ---
  const [lTitle, setLTitle] = useState("");
  const [lContent, setLContent] = useState("");
  const [lSchedule, setLSchedule] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [openedLetterId, setOpenedLetterId] = useState<string | null>(null);

  const handleComposeLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lTitle || !lContent) return;

    sendLetter({
      recipientId: currentUser === "user_a" ? "user_b" : "user_a",
      title: lTitle,
      content: lContent,
      scheduledFor: lSchedule ? new Date(lSchedule).toISOString() : undefined,
    });

    setLTitle("");
    setLContent("");
    setLSchedule("");
    setIsComposing(false);
  };

  // --- WATCH TOGETHER STATE ---
  const [activeVideo, setActiveVideo] = useState(watchOptions[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(35); // simulated percent
  const [chatInput, setChatInput] = useState("");
  const [chatLogs, setChatLogs] = useState<{ id: string; user: string; text: string }[]>([]);
  const [reactions, setReactions] = useState<{ id: number; emoji: string; left: number }[]>([]);

  // Simulated progress timer
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && activeTab === "watch") {
      interval = setInterval(() => {
        setProgress((p) => (p >= 100 ? 0 : p + 0.1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeTab]);

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      id: Date.now().toString() + "-" + Math.floor(Math.random() * 1000000),
      user: activeProfile.name,
      text: chatInput,
    };
    setChatLogs((prev) => [...prev, newMsg]);
    setChatInput("");
    awardXp(5, "chatting in Watch Together");
  };

  const triggerReactionBubble = (emoji: string) => {
    setReactions((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        emoji,
        left: Math.random() * 80 + 10, // random start horizontal
      },
    ]);
    awardXp(2, "reacting dynamically");
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
                className={`flex items-center gap-1.5 pb-3 text-xs font-bold transition-all relative ${
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">Private Live Letters cabinet</h3>
                <p className="text-[10px] text-[var(--text-muted)]">Read and compose cute sealed letters.</p>
              </div>
              <button
                onClick={() => {
                  setIsComposing(!isComposing);
                  setOpenedLetterId(null);
                }}
                className="py-2 px-4 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1 shadow hover:opacity-90 transition-all"
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
                className="glass-panel p-6 rounded-2xl space-y-4 max-w-xl mx-auto border-dashed border-[var(--primary)]/30"
              >
                <div className="flex items-center gap-1 text-xs font-bold text-[var(--primary)] uppercase tracking-wide">
                  <Sparkles className="w-4.5 h-4.5 fill-current animate-float" />
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
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[var(--primary)]"
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
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent focus:border-[var(--primary)]"
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
                      className="w-full bg-black/5 text-xs px-3 py-2 rounded-lg outline-none border border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 transition-all active:scale-[0.99]"
                >
                  <Send className="w-3.5 h-3.5" /> Seal & Send Letter
                </button>
              </motion.form>
            )}

            {/* LETTERS CABINET GRID & ACTIVE DETAIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
                            openLetter(letItem.id);
                          }
                        }}
                        className={`p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between border ${
                          openedLetterId === letItem.id
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-[var(--border-color)] bg-white/60 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isLocked ? "bg-gray-100 text-gray-400" : "bg-[var(--primary)]/10 text-[var(--primary)] animate-float"}`}>
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
                            <span className="text-[8px] px-1.5 py-0.5 bg-[var(--primary)]/5 text-[var(--primary)] font-bold uppercase rounded font-mono border border-[var(--primary)]/10">
                              Locked
                            </span>
                          ) : letItem.isOpened ? (
                            <span className="text-[8px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 font-bold uppercase rounded border border-emerald-500/20">
                              Read
                            </span>
                          ) : (
                            <span className="text-[8px] px-1.5 py-0.5 bg-[var(--primary)]/15 text-[var(--primary)] font-bold uppercase rounded animate-pulse border border-[var(--primary)]/20">
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
                  <div className="p-12 text-center bg-white/40 border border-white rounded-2xl flex flex-col items-center">
                    <Mail className="w-8 h-8 text-rose-300 mb-2 animate-float" />
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
                        className="bg-white rounded-2xl shadow-xl border border-[var(--border-color)] overflow-hidden relative"
                      >
                        {/* Physical envelope top fold design mockup */}
                        <div className="h-6 bg-[var(--primary)]/10 relative overflow-hidden flex items-center justify-center">
                          <div className="absolute top-0 w-full h-full bg-gradient-to-b from-[var(--primary)]/20 to-transparent" />
                          <div className="w-4 h-4 bg-[var(--primary)] rounded-full border border-white/80 absolute -bottom-2 shadow-inner" />
                        </div>

                        <div className="p-8 space-y-4 font-serif">
                          <h3 className="text-lg font-bold text-gray-800 leading-tight">
                            {activeLetter.title}
                          </h3>

                          <div className="text-xs text-gray-400 font-sans flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                            <span>From: {(activeLetter.senderId === "user_a" ? userA : userB).name}</span>
                            <span>{new Date(activeLetter.createdAt).toLocaleDateString()}</span>
                          </div>

                          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic">
                            {activeLetter.content}
                          </p>

                          {/* Quick Emoji Reaction cabinet on letter */}
                          <div className="pt-6 border-t border-[var(--border-color)] flex items-center justify-between gap-2 font-sans">
                            <span className="text-[10px] text-gray-400">React back:</span>
                            <div className="flex gap-1.5">
                              {["💖", "✨", "☕", "😭", "🌸"].map((emoji) => {
                                const activeReactions = activeLetter.reactions || [];
                                const isAdded = activeReactions.includes(emoji);
                                return (
                                  <button
                                    key={emoji}
                                    onClick={() => reactToLetter(activeLetter.id, emoji)}
                                    className={`p-1.5 rounded-full text-sm transition-all ${
                                      isAdded ? "bg-[var(--primary)]/20 scale-110 shadow-sm" : "hover:bg-black/5"
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
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Status Broadcaster Panel */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
                Update My Bubble Status
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Broadcast what you are actively doing so your partner can see it in real-time.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customStatusInput}
                    onChange={(e) => setCustomStatusInput(e.target.value)}
                    placeholder="Type custom status... e.g. Reading manga 📖"
                    className="flex-1 bg-black/5 text-xs rounded-lg px-3 outline-none border border-transparent focus:border-[var(--primary)]"
                  />
                  <button
                    onClick={() => {
                      if (customStatusInput) {
                        handleUpdateStatus(customStatusInput);
                        setCustomStatusInput("");
                      }
                    }}
                    className="text-xs font-bold bg-black text-white px-4 py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                  >
                    Broadcast
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {statusPresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handleUpdateStatus(preset.value)}
                      className="py-2.5 px-3 border border-gray-200 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-xl text-left text-xs transition-all flex items-center gap-2"
                    >
                      <span className="text-base">{preset.emoji}</span>
                      <span className="truncate text-[var(--text-main)] font-semibold">{preset.value.replace(preset.emoji, "").trim()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Display statuses */}
            <div className="space-y-6 flex flex-col justify-between">
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] border-b pb-1">
                  Active Bubble Connection Status
                </h3>

                <div className="space-y-5 py-2">
                  {/* Active User */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={activeProfile.avatar}
                        alt="My Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">{activeProfile.name} (You)</p>
                        <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Active Connection
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-black/5 px-2.5 py-1 rounded-full text-gray-700">
                      {activeProfile.status}
                    </span>
                  </div>

                  {/* Partner User */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={partnerProfile.avatar}
                        alt="Partner Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-400"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">{partnerProfile.name}</p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                          Synced & Online
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold bg-[var(--primary)]/10 px-2.5 py-1 rounded-full text-[var(--primary)] border border-[var(--primary)]/20">
                      {partnerProfile.status}
                    </span>
                  </div>
                </div>
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Movie Player Stream */}
            <div className="lg:col-span-8 space-y-4">
              <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-2xl flex flex-col justify-between">
                {/* Simulated Stream Banner Header */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white text-[9px] font-bold tracking-widest uppercase rounded">
                    LIVE TOGETHER
                  </span>
                  <span className="text-white text-xs bg-black/60 backdrop-blur px-2 py-0.5 rounded font-medium">
                    {activeVideo.title}
                  </span>
                </div>

                {/* Floating Emoji Particles Layer */}
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                  {reactions.map((react) => (
                    <motion.span
                      key={react.id}
                      style={{ left: `${react.left}%` }}
                      initial={{ y: "100%", opacity: 1, scale: 0.8 }}
                      animate={{ y: "-10%", opacity: 0, scale: 1.5 }}
                      transition={{ duration: 3, ease: "easeOut" }}
                      className="absolute text-3xl bottom-0"
                    >
                      {react.emoji}
                    </motion.span>
                  ))}
                </div>

                {/* Simulated screen background walkthrough */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center">
                  <div className="text-center space-y-3 z-10">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto hover:scale-110 active:scale-95 cursor-pointer transition-all border border-white/20">
                      {isPlaying ? (
                        <Pause onClick={() => setIsPlaying(false)} className="w-8 h-8 text-white fill-current ml-0" />
                      ) : (
                        <Play onClick={() => setIsPlaying(true)} className="w-8 h-8 text-white fill-current ml-1" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono tracking-wide">
                      {isPlaying ? "Streaming video frame synchronized..." : `Playback paused by ${userA.name}`}
                    </p>
                  </div>

                  {/* Immersive walk visualization behind */}
                  <img
                    src="https://images.unsplash.com/photo-1514306191717-452ec28c7814?q=80&w=800&auto=format&fit=crop"
                    alt="Cinema"
                    className="absolute inset-0 w-full h-full object-cover opacity-15 blur-[2px]"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Synced Control Bar */}
                <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/60 backdrop-blur px-4 py-2.5 rounded-xl flex items-center justify-between text-white gap-4 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsPlaying(!isPlaying)}>
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <span className="text-[10px]">14:20 / 45:30</span>
                  </div>

                  {/* Sync progress slider */}
                  <div className="flex-1 h-1.5 bg-white/20 rounded-full relative overflow-hidden cursor-pointer">
                    <div
                      className="h-full bg-[var(--primary)] rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <span className="text-[10px]">Volume Sync</span>
                  </div>
                </div>
              </div>

              {/* Theater list */}
              <div className="grid grid-cols-3 gap-3">
                {watchOptions.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => {
                      setActiveVideo(video);
                      setProgress(15);
                      awardXp(10, `changing active video to ${video.title}`);
                    }}
                    className={`p-2.5 rounded-xl border text-left text-[11px] transition-all truncate ${
                      activeVideo.id === video.id
                        ? "border-[var(--primary)] bg-[var(--primary)]/5 font-bold"
                        : "border-gray-200 bg-white/40 hover:bg-white"
                    }`}
                  >
                    <p className="font-semibold text-[var(--text-main)] truncate">{video.title}</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Duration: {video.duration}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Chat & Reaction Panel */}
            <div className="lg:col-span-4 flex flex-col justify-between glass-panel rounded-2xl p-4 h-[380px] overflow-hidden">
              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] border-b pb-2 flex items-center gap-1.5 flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-rose-500" />
                    Live Room Chat
                  </h4>

                  {/* Scrollable logs */}
                  <div className="space-y-2 mt-3 flex-1 overflow-y-auto text-xs pr-1">
                    {chatLogs.map((log) => (
                      <div key={log.id} className="leading-relaxed">
                        <span className="font-bold text-gray-800">{log.user}:</span>{" "}
                        <span className="text-gray-600">{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic reaction bubble triggering tray */}
                <div className="space-y-2 flex-shrink-0">
                  <div className="flex justify-between items-center bg-black/5 p-1 rounded-lg">
                    {["💖", "🌸", "☕", "🍿", "😭", "😮"].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => triggerReactionBubble(emoji)}
                        className="text-lg hover:scale-125 active:scale-95 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Chat input box */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                      placeholder="Comment synchronously..."
                      className="flex-1 bg-black/5 text-xs rounded-lg px-3 outline-none"
                    />
                    <button
                      onClick={sendChatMessage}
                      className="p-2 rounded-lg bg-black text-white hover:opacity-90 active:scale-95 transition-all"
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
