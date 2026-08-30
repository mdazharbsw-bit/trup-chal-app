/** Tiny Web Audio SFX. Unlock from the first pointer/key gesture. */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: "interactive" });
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

export function bindAudioUnlock(): () => void {
  const on = () => unlockAudio();
  window.addEventListener("pointerdown", on);
  window.addEventListener("keydown", on);
  const vis = () => {
    if (document.visibilityState === "visible") unlockAudio();
  };
  document.addEventListener("visibilitychange", vis);
  return () => {
    window.removeEventListener("pointerdown", on);
    window.removeEventListener("keydown", on);
    document.removeEventListener("visibilitychange", vis);
  };
}

function beep(freq: number, dur: number, type: OscillatorType, gain = 0.12, slide = 0) {
  if (!unlocked) return;
  const c = getCtx();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + dur);
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(master);
  osc.start();
  osc.stop(c.currentTime + dur + 0.02);
  osc.onended = () => {
    osc.disconnect();
    g.disconnect();
  };
}

export const sfx = {
  deal: () => beep(420 + Math.random() * 40, 0.06, "triangle", 0.06),
  play: () => beep(220 + Math.random() * 30, 0.09, "sine", 0.1, -80),
  trick: () => beep(380, 0.16, "triangle", 0.1, 120),
  win: () => {
    beep(523, 0.18, "sine", 0.1);
    setTimeout(() => beep(659, 0.22, "sine", 0.1), 90);
    setTimeout(() => beep(784, 0.28, "sine", 0.12), 180);
  },
  kot: () => {
    beep(392, 0.2, "triangle", 0.12);
    setTimeout(() => beep(523, 0.22, "triangle", 0.12), 110);
    setTimeout(() => beep(659, 0.28, "sine", 0.14), 220);
    setTimeout(() => beep(784, 0.4, "sine", 0.14), 340);
  },
  illegal: () => beep(140, 0.12, "square", 0.05, -40),
  tap: () => beep(640, 0.04, "sine", 0.04),
};
