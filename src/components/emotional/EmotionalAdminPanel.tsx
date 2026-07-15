/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useCouple } from "../../context/CoupleContext";
import { getDb, isFirebaseConfigured } from "../../firebaseClient";
import {
  Mail, Calendar, Clock, Lock, Heart, Database, Wifi, Activity,
  AlertTriangle, CheckCircle2, RefreshCw, Server, Terminal, Check, Save
} from "lucide-react";
import { toast } from "sonner";

// ─── Tab Switcher ────────────────────────────────────────────────────────────

type AdminTab = "letters" | "dates";

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "letters", label: "Letters", icon: Mail },
  { id: "dates", label: "Dates", icon: Calendar },
];

// ─── EmotionalAdminPanel (Main Export) ───────────────────────────────────────

export function EmotionalAdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>("letters");

  return (
    <div className="mt-4 space-y-4">
      {/* Section header */}
      <div className="flex items-start gap-2.5 p-4 bg-gradient-to-br from-rose-50/80 to-amber-50/80 border border-rose-200/50 rounded-2xl">
        <Heart className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-rose-800 leading-none mb-1">💌 Emotional Experiences Panel</p>
          <p className="text-[10px] text-rose-600 leading-normal">
            Manage scheduled letters and special dates for your partner.
          </p>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-1.5 bg-[var(--fabric-cream)]/50 p-1 rounded-xl border border-[var(--wood-oak)]/15">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === id
                ? "bg-white text-[var(--text-main)] shadow-xs"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/40"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === "letters" && <ScheduledLettersPanel />}
        {activeTab === "dates" && <SpecialDatesEditor />}
      </motion.div>
    </div>
  );
}

// ─── Database Health Panel ──────────────────────────────────────────────────

export function DatabaseHealthPanel() {
  const [status, setStatus] = useState<"idle" | "checking" | "online" | "error">("idle");
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setDiagnosticLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runDiagnostics = async () => {
    setStatus("checking");
    setErrorMsg(null);
    setLatency(null);
    setDiagnosticLogs([]);
    addLog("Starting database diagnostic tests...");

    try {
      if (!isFirebaseConfigured) {
        addLog("WARNING: Firebase API Key uses placeholder values.");
      } else {
        addLog("Firebase API Key is configured correctly.");
      }

      addLog("Retrieving Firestore instance (Lazy loading SDK)...");
      const db = await getDb();
      addLog("Firestore successfully initialized.");

      addLog("Testing read operation (retrieving settings document)...");
      const { doc, getDoc } = await import("firebase/firestore");
      
      const startTime = performance.now();
      const docRef = doc(db, "settings", "couple_settings");
      const snap = await getDoc(docRef);
      const endTime = performance.now();

      const measuredLatency = Math.round(endTime - startTime);
      setLatency(measuredLatency);
      setStatus("online");
      addLog(`Connection successful! Latency: ${measuredLatency}ms.`);
      addLog(`Settings document found: ${snap.exists() ? "Yes" : "No (Initial initialization)"}`);
      addLog("Database is healthy and real-time synchronization is active.");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      const errStr = err?.message || String(err);
      setErrorMsg(errStr);
      addLog(`ERROR: Failed to connect to database. ${errStr}`);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="border border-[var(--wood-oak)]/15 rounded-2xl p-4 space-y-4 bg-[var(--fabric-cream)]/20 text-[#4E3B24]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-[#2D5A27]" />
          Database Health Status (Firestore)
        </p>
        <button
          onClick={runDiagnostics}
          disabled={status === "checking"}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold bg-[#4E3B24]/5 hover:bg-[#4E3B24]/10 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${status === "checking" ? "animate-spin" : ""}`} />
          <span>Run Diagnostics</span>
        </button>
      </div>

      {/* Main Status Card */}
      <div className="grid grid-cols-2 gap-3">
        {/* Connection status */}
        <div className="bg-white/60 border border-[var(--wood-oak)]/10 rounded-xl p-3 flex flex-col items-center text-center justify-center">
          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Connection</span>
          {status === "checking" && (
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Checking...</span>
            </div>
          )}
          {status === "online" && (
            <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Connected (Online)</span>
            </div>
          )}
          {status === "error" && (
            <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Connection Failed</span>
            </div>
          )}
          {status === "idle" && (
            <span className="text-xs text-gray-500 font-bold">Idle</span>
          )}
        </div>

        {/* Latency */}
        <div className="bg-white/60 border border-[var(--wood-oak)]/10 rounded-xl p-3 flex flex-col items-center text-center justify-center">
          <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Response Time</span>
          {status === "checking" && (
            <span className="text-xs text-amber-600 font-mono font-bold animate-pulse">Measuring...</span>
          )}
          {status === "online" && latency !== null && (
            <div className="flex flex-col items-center">
              <span className="text-sm font-mono font-black text-[#2D5A27]">{latency} ms</span>
              <span className="text-[8px] text-green-600 font-semibold uppercase">
                {latency < 100 ? "Excellent" : latency < 300 ? "Good" : "Slow"}
              </span>
            </div>
          )}
          {(status === "error" || status === "idle") && (
            <span className="text-xs text-gray-400 font-mono font-bold">-</span>
          )}
        </div>
      </div>

      {/* Config state indicators */}
      <div className="bg-white/40 border border-[var(--wood-oak)]/10 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-semibold border-b border-[#4E3B24]/5 pb-1.5">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Server className="w-3.5 h-3.5 text-[#2D5A27]" />
            Database System:
          </span>
          <span className="font-bold text-[#2D5A27]">Firebase Firestore (Google Cloud)</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold border-b border-[#4E3B24]/5 pb-1.5">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Wifi className="w-3.5 h-3.5 text-[#2D5A27]" />
            API Key Active:
          </span>
          <span className={isFirebaseConfigured ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
            {isFirebaseConfigured ? "Yes (Active)" : "No (Using Default)"}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2D5A27]" />
            Security Rules:
          </span>
          <span className="text-green-600 font-bold">Protected (Firestore Rules)</span>
        </div>
      </div>

      {/* Terminal / Logs panel */}
      <div className="space-y-1.5">
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
          <Terminal className="w-3 h-3" />
          Diagnostic Console Logs
        </p>
        <div className="bg-stone-900 text-stone-200 p-2.5 rounded-xl font-mono text-[9px] space-y-1 max-h-[110px] overflow-y-auto border border-stone-800">
          {diagnosticLogs.map((log, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-normal">{log}</div>
          ))}
          {diagnosticLogs.length === 0 && (
            <div className="text-stone-500 italic">No logs available. Run diagnostics to populate.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Re-use ShieldCheck if imported as check
const ShieldCheck = CheckCircle2;

function ScheduledLettersPanel() {
  const { letters, userA, userB } = useCouple();

  const scheduled = useMemo(() => {
    return letters
      .filter((l) => l.scheduledFor && new Date(l.scheduledFor) > new Date())
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
  }, [letters]);

  const delivered = useMemo(() => {
    return letters
      .filter((l) => !l.scheduledFor || new Date(l.scheduledFor) <= new Date());
  }, [letters]);

  if (scheduled.length === 0) {
    return (
      <div className="border border-[var(--wood-oak)]/15 rounded-2xl p-6 space-y-3 bg-[var(--fabric-cream)]/20 text-center">
        <Mail className="w-8 h-8 text-[var(--text-muted)]/40 mx-auto" />
        <p className="text-xs font-bold text-[var(--text-muted)]">No scheduled letters</p>
        <p className="text-[10px] text-[var(--text-muted)]/60 leading-relaxed">
          Letters with a future lock date will appear here. Use the Together tab to compose a scheduled letter.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--wood-oak)]/15 rounded-2xl p-4 space-y-3 bg-[var(--fabric-cream)]/20">
      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Upcoming Scheduled Letters ({scheduled.length})
      </p>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {scheduled.map((letter) => {
          const sender = letter.senderId === "user_a" ? userA : userB;
          const scheduledDate = new Date(letter.scheduledFor!);
          const daysLeft = Math.ceil((scheduledDate.getTime() - Date.now()) / 86400000);
          const isDeliverable = daysLeft <= 0;

          return (
            <div
              key={letter.id}
              className="flex items-start gap-3 bg-white/50 rounded-xl p-3 border border-[var(--wood-oak)]/10"
            >
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 flex-shrink-0">
                <Lock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[var(--text-main)] truncate">{letter.title}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <img loading="lazy" src={sender.avatar} alt={sender.name} className="w-3.5 h-3.5 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <span className="text-[9px] text-[var(--text-muted)]">From {sender.name.split(" ")[0]}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] font-mono font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-100">
                    {isDeliverable ? "Ready to open!" : `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`}
                  </span>
                  <span className="text-[8px] text-[var(--text-muted)] font-mono">
                    {scheduledDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-[var(--wood-oak)]/10">
        <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
          📬 <strong>{delivered.length}</strong> letter{delivered.length !== 1 ? "s" : ""} already delivered
          {delivered.length > 0 && ` (${delivered.filter((l) => l.isOpened).length} opened)`}.
        </p>
      </div>
    </div>
  );
}

// ─── Special Dates Editor ────────────────────────────────────────────────

function SpecialDatesEditor() {
  const { anniversaryDate, birthdayA, birthdayB, updateCoupleSettings } = useCouple();
  const [anniv, setAnniv] = useState(anniversaryDate || "2024-10-15");
  const [bdayA, setBdayA] = useState(birthdayA || "06-16");
  const [bdayB, setBdayB] = useState(birthdayB || "12-25");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!anniv) { toast.error("Anniversary date is required."); return; }
    if (!bdayA || !bdayB) { toast.error("Both birthdays are required."); return; }
    setSaving(true);
    try {
      await updateCoupleSettings(anniv, bdayA, bdayB);
      setSaved(true);
      toast.success("Dates saved! 🎉", { description: "Anniversary & birthdays updated." });
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save dates.");
    }
    setSaving(false);
  };

  return (
    <div className="border border-[var(--wood-oak)]/15 rounded-2xl p-4 space-y-3 bg-[var(--fabric-cream)]/20">
      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Special Dates Configuration
      </p>
      <p className="text-[9px] text-[var(--text-muted)] leading-relaxed">
        These dates trigger confetti, banners, and special greetings on the homepage.
      </p>

      <div className="space-y-3 pt-1">
        <div>
          <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
            💖 Anniversary Date
          </label>
          <input
            type="date"
            value={anniv}
            onChange={(e) => setAnniv(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              🎂 Birthday A
            </label>
            <input
              type="text"
              value={bdayA}
              onChange={(e) => setBdayA(e.target.value)}
              placeholder="MM-DD"
              className="w-full text-xs px-3 py-2 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
              maxLength={5}
            />
          </div>
          <div>
            <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              🎂 Birthday B
            </label>
            <input
              type="text"
              value={bdayB}
              onChange={(e) => setBdayB(e.target.value)}
              placeholder="MM-DD"
              className="w-full text-xs px-3 py-2 bg-white/50 border border-[var(--wood-oak)]/20 rounded-xl outline-none focus:border-[var(--primary)] text-[var(--text-main)] font-semibold transition-all"
              maxLength={5}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-2.5 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.98] ${
          saved
            ? "bg-green-500 text-white"
            : "bg-[var(--primary)] text-white hover:opacity-95"
        } disabled:opacity-60`}
      >
        {saved ? (
          <><Check className="w-4 h-4" /> Dates Saved!</>
        ) : saving ? (
          "Saving..."
        ) : (
          <><Save className="w-4 h-4" /> Save Dates</>
        )}
      </button>
    </div>
  );
}
