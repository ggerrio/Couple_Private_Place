/**
 * telemetrySimulator.ts — Live Partner Activity & Telemetry Simulator for Demo Mode.
 *
 * In live demo mode, this simulator simulates realistic real-time telemetry:
 *   - Partner mood & status updates
 *   - Heartbeat latency & simulated ping (e.g., "12ms • Live RTDB Sync")
 *   - Partner activity stream events (e.g., "Alex updated mood to Cozy ☕", "Alex sent a virtual hug ❤️")
 *   - Interactive demo triggers for visitors testing the live showcase
 */

export interface TelemetryLog {
  id: string;
  timestamp: string;
  type: "status" | "mood" | "interaction" | "system";
  message: string;
}

type TelemetryListener = (log: TelemetryLog, ping: number) => void;
type PartnerUpdateListener = (partnerData: Partial<{ mood: string; moodNote: string; status: string }>) => void;

class TelemetrySimulatorEngine {
  private listeners: Set<TelemetryListener> = new Set();
  private partnerListeners: Set<PartnerUpdateListener> = new Set();
  private timer: number | null = null;
  private logs: TelemetryLog[] = [];
  private currentPing: number = 14;

  private partnerSimulations = [
    { mood: "cozy", moodNote: "Listening to lo-fi beats 🎧", status: "Listening to BGM" },
    { mood: "happy", moodNote: "Sunlight is beautiful today! ☀️", status: "Chilling in garden" },
    { mood: "loved", moodNote: "Thinking of you ❤️", status: "Sending virtual hugs" },
    { mood: "excited", moodNote: "Planning our next date night 🍿", status: "Browsing date ideas" },
    { mood: "sleepy", moodNote: "Winding down with tea 🍵", status: "Reading a book" },
  ];

  private simulationIndex = 0;

  constructor() {
    this.addLog("system", "Live Telemetry Simulator initialized in isolated Demo Mode");
  }

  public start() {
    if (this.timer) return;

    // Simulate periodic partner updates & telemetry pings every 12 seconds
    this.timer = window.setInterval(() => {
      // Fluctuate ping between 10ms - 28ms for realistic telemetry visual
      this.currentPing = Math.floor(10 + Math.random() * 18);

      // 40% chance to cycle partner activity
      if (Math.random() < 0.5) {
        this.simulationIndex = (this.simulationIndex + 1) % this.partnerSimulations.length;
        const current = this.partnerSimulations[this.simulationIndex];

        const logMsg = `Partner updated mood to "${current.mood.toUpperCase()}" (${current.status})`;
        const newLog = this.addLog("mood", logMsg);

        // Notify partner listeners
        this.partnerListeners.forEach((fn) => fn(current));
        this.listeners.forEach((fn) => fn(newLog, this.currentPing));
      } else {
        // Heartbeat log
        this.listeners.forEach((fn) => fn(this.logs[0], this.currentPing));
      }
    }, 12000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public subscribe(fn: TelemetryListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public subscribePartner(fn: PartnerUpdateListener) {
    this.partnerListeners.add(fn);
    return () => this.partnerListeners.delete(fn);
  }

  public triggerManualEvent(type: "love" | "mood" | "sync") {
    this.currentPing = Math.floor(8 + Math.random() * 10);
    if (type === "love") {
      const log = this.addLog("interaction", "Partner sent a instant heart pulse ❤️");
      this.partnerListeners.forEach((fn) => fn({ mood: "loved", moodNote: "Sent a quick heart!", status: "In love ❤️" }));
      this.listeners.forEach((fn) => fn(log, this.currentPing));
    } else if (type === "mood") {
      this.simulationIndex = (this.simulationIndex + 1) % this.partnerSimulations.length;
      const current = this.partnerSimulations[this.simulationIndex];
      const log = this.addLog("mood", `Partner status changed to: ${current.status}`);
      this.partnerListeners.forEach((fn) => fn(current));
      this.listeners.forEach((fn) => fn(log, this.currentPing));
    } else {
      const log = this.addLog("system", "Manual telemetry sync triggered • Local state verified");
      this.listeners.forEach((fn) => fn(log, this.currentPing));
    }
  }

  private addLog(type: TelemetryLog["type"], message: string): TelemetryLog {
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const log: TelemetryLog = {
      id: Math.random().toString(36).slice(2),
      timestamp: timeStr,
      type,
      message,
    };
    this.logs.unshift(log);
    if (this.logs.length > 20) this.logs.pop();
    return log;
  }

  public getLogs(): TelemetryLog[] {
    return [...this.logs];
  }

  public getPing(): number {
    return this.currentPing;
  }
}

export const telemetrySimulator = new TelemetrySimulatorEngine();
