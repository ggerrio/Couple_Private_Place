/**
 * AudioContextStub.ts — hand-rolled Web Audio shim for vitest under jsdom.
 *
 * JSDOM has no AudioContext; standardized-audio-context-mock would pull in
 * a large dependency tree for a tiny surface area. We're verifying
 * bgmController's setVolume (cancel-then-ramp pattern + clamp + dual-gain
 * parallelism + reduced-motion gate) — a focused subset of the Web
 * Audio API:
 *
 *   • ctx.currentTime (number, settable)
 *   • ctx.createGain() → MockGain with .gain (MockAudioParam)
 *   • ctx.createBufferSource()
 *   • ctx.createAnalyser()
 *   • ctx.decodeAudioData() (synchronous in stub)
 *   • ctx.suspend() / ctx.resume() / ctx.close()
 *   • GainParam cancelScheduledValues / setValueAtTime / linearRampToValueAtTime
 *   • Analyser.getByteFrequencyData
 *   • BufferSource start / stop / connect
 *
 * Each MockAudioParam records its method-call history so tests can
 * assert: cancel → set → linearRamp ordering, both gain nodes in
 * parallel, clamp behavior, and pause/resume side-effects.
 */

class MockAudioParam {
  private _value = 0;
  /** Method-call history with timestamps. Use in tests via `.history`. */
  history: Array<{ method: string; time: number; value: number }> = [];

  get value(): number {
    return this._value;
  }
  set value(v: number) {
    this._value = v;
    this.history.push({ method: "set-property", time: -1, value: v });
  }

  cancelScheduledValues(time: number): void {
    this.history.push({ method: "cancelScheduledValues", time, value: 0 });
  }
  setValueAtTime(value: number, time: number): void {
    this.history.push({ method: "setValueAtTime", time, value });
    this._value = value;
  }
  linearRampToValueAtTime(value: number, time: number): void {
    this.history.push({ method: "linearRampToValueAtTime", time, value });
    this._value = value;
  }
}

class MockGain {
  gain = new MockAudioParam();
  connect<T>(target: T): T {
    return target;
  }
  disconnect(): void {}
}

class MockBufferSource {
  buffer: AudioBuffer | null = null;
  loop = false;
  startedAt = -1;
  connect<T>(target: T): T {
    return target;
  }
  start(when = 0): void {
    this.startedAt = when;
  }
  stop(): void {}
  disconnect(): void {}
  addEventListener(): void {}
}

class MockAnalyser {
  fftSize = 256;
  smoothingTimeConstant = 0.7;
  frequencyBinCount = 128;
  connect<T>(target: T): T {
    return target;
  }
  disconnect(): void {}
  getByteFrequencyData(arr: Uint8Array): void {
    for (let i = 0; i < arr.length; i++) arr[i] = 128;
  }
}

class MockAudioBuffer {
  duration = 30;
  sampleRate = 44100;
  numberOfChannels = 2;
  length = 44100;
}

export class MockAudioContext {
  state: "running" | "suspended" | "closed" = "running";
  currentTime = 0;
  destination = {};
  gains: MockGain[] = [];
  buffers: MockBufferSource[] = [];
  analysers: MockAnalyser[] = [];

  createGain(): MockGain {
    const g = new MockGain();
    this.gains.push(g);
    return g;
  }
  createBufferSource(): MockBufferSource {
    const b = new MockBufferSource();
    this.buffers.push(b);
    return b;
  }
  createAnalyser(): MockAnalyser {
    const a = new MockAnalyser();
    this.analysers.push(a);
    return a;
  }
  async decodeAudioData(_buf: ArrayBuffer): Promise<AudioBuffer> {
    return new MockAudioBuffer() as unknown as AudioBuffer;
  }
  async close(): Promise<void> {
    this.state = "closed";
  }
  async resume(): Promise<void> {
    this.state = "running";
  }
  async suspend(): Promise<void> {
    this.state = "suspended";
  }
}

/**
 * Install the stub globally. Tests import it via `globalThis.__MockAudioContext`
 * (or via the explicit exports below) to assert against recorded history.
 */
export function installAudioContextStub(): void {
  (globalThis as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
    MockAudioContext;
  (
    globalThis as unknown as { webkitAudioContext: typeof MockAudioContext }
  ).webkitAudioContext = MockAudioContext;
}

/**
 * The most recently constructed MockAudioContext (set by arm).
 * Tests use this to introspect the post-arm audio graph.
 */
let lastContext: MockAudioContext | null = null;

// Patch the constructor to record each instance.
const OriginalContext = MockAudioContext;
class TrackedAudioContext extends OriginalContext {
  constructor() {
    super();
    lastContext = this;
  }
}

// Re-install with the tracked subclass.
export function installTrackedAudioContextStub(): void {
  (globalThis as unknown as { AudioContext: typeof TrackedAudioContext }).AudioContext =
    TrackedAudioContext;
  (
    globalThis as unknown as { webkitAudioContext: typeof TrackedAudioContext }
  ).webkitAudioContext = TrackedAudioContext;
}

export const __resetLastContext = (): void => {
  lastContext = null;
};
export const __getLastContext = (): MockAudioContext | null => lastContext;

export { MockGain, MockAudioParam, MockBufferSource, MockAnalyser };
