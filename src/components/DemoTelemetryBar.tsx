import React, { useEffect, useState } from "react";
import { isDemoMode, disableDemoMode } from "../utils/demoMode";
import { telemetrySimulator, TelemetryLog } from "../utils/telemetrySimulator";
import { Activity, Heart, RefreshCw, Zap, ShieldCheck } from "lucide-react";

export const DemoTelemetryBar: React.FC = () => {
  const [active, setActive] = useState(false);
  const [currentLog, setCurrentLog] = useState<TelemetryLog | null>(null);
  const [ping, setPing] = useState(14);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isDemoMode()) return;
    setActive(true);
    telemetrySimulator.start();

    const logs = telemetrySimulator.getLogs();
    if (logs.length > 0) setCurrentLog(logs[0]);
    setPing(telemetrySimulator.getPing());

    const unsubscribe = telemetrySimulator.subscribe((log, newPing) => {
      setCurrentLog(log);
      setPing(newPing);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!active) return null;

  const handleTriggerLove = () => {
    telemetrySimulator.triggerManualEvent("love");
  };

  const handleTriggerMood = () => {
    telemetrySimulator.triggerManualEvent("mood");
  };

  const handleSync = () => {
    telemetrySimulator.triggerManualEvent("sync");
  };

  const handleResetData = () => {
    if (window.confirm("Reset all local demo data back to default initial state?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-b border-pink-500/30 text-white text-xs py-1.5 px-3 sm:px-6 sticky top-0 z-[9999] shadow-lg transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Telemetry indicator */}
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-bold tracking-wider text-pink-400 bg-pink-950/60 border border-pink-500/40 px-2 py-0.5 rounded-full uppercase text-[10px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Simulated Telemetry
          </span>

          {/* Ping badge */}
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded font-mono text-[11px]">
            <Zap className="w-3 h-3 text-amber-400" />
            {ping}ms
          </span>

          {/* Latest log ticker */}
          {currentLog && (
            <div className="hidden md:flex items-center gap-1.5 text-slate-300 truncate max-w-xs lg:max-w-md">
              <Activity className="w-3 h-3 text-pink-400 shrink-0" />
              <span className="text-slate-400 text-[11px] font-mono">[{currentLog.timestamp}]</span>
              <span className="truncate text-slate-200">{currentLog.message}</span>
            </div>
          )}
        </div>

        {/* Right: Simulation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Privacy isolation badge */}
          <span className="hidden xl:inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Isolated Demo (Zero Private DB)
          </span>

          {/* Interactive buttons */}
          <button
            onClick={handleTriggerLove}
            title="Simulate partner sending a love pulse"
            className="flex items-center gap-1 bg-pink-600/80 hover:bg-pink-600 text-white px-2 py-1 rounded transition-colors text-[11px] font-medium"
          >
            <Heart className="w-3 h-3 fill-current text-white" />
            <span className="hidden sm:inline">Sim Partner Love</span>
          </button>

          <button
            onClick={handleTriggerMood}
            title="Cycle simulated partner mood & activity"
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition-colors text-[11px]"
          >
            <RefreshCw className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Cycle Mood</span>
          </button>

          <button
            onClick={handleResetData}
            title="Reset demo data"
            className="bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 px-2 py-1 rounded transition-colors text-[11px]"
          >
            Reset Demo
          </button>
        </div>
      </div>
    </div>
  );
};
