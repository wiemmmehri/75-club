"use client";
/**
 * Every sound of the app is synthesized live with the Web Audio API:
 * no audio files to host, instant, tiny. Crystal chimes, bubbly pops, sparkly chords.
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;

const KEY = "club75-sound";
export const isMuted = () => typeof window !== "undefined" && localStorage.getItem(KEY) === "off";
export const setMuted = (m: boolean) => localStorage.setItem(KEY, m ? "off" : "on");

function ac() {
  if (typeof window === "undefined" || isMuted()) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    // tiny shimmering echo
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.16;
    const fb = ctx.createGain();
    fb.gain.value = 0.22;
    const wet = ctx.createGain();
    wet.gain.value = 0.25;
    master.connect(ctx.destination);
    master.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, at = 0, dur = 0.6, type: OscillatorType = "sine", vol = 0.25, glideTo?: number) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur * 0.8);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** Bell-like: fundamental + inharmonic partials */
function bell(freq: number, at = 0, vol = 0.22, dur = 1.1) {
  tone(freq, at, dur, "sine", vol);
  tone(freq * 2.01, at, dur * 0.6, "sine", vol * 0.35);
  tone(freq * 3.98, at, dur * 0.35, "sine", vol * 0.12);
}

function noise(at = 0, dur = 0.5, from = 400, to = 4000, vol = 0.12) {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, t);
  f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

const NOTE: Record<string, number> = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5, G6: 1568, C7: 2093 };
const CAT_NOTES = { sport: NOTE.C6, diet: NOTE.E6, quran: NOTE.G6, selfcare: NOTE.B5 * 2 } as const;

export const sfx = {
  tap: () => tone(1400, 0, 0.06, "sine", 0.08),
  pop: () => { tone(520, 0, 0.12, "sine", 0.22, 1200); tone(1800, 0.03, 0.08, "triangle", 0.05); },
  check: (cat: keyof typeof CAT_NOTES) => { const f = CAT_NOTES[cat]; bell(f, 0, 0.2); bell(f * 1.5, 0.07, 0.1, 0.8); },
  uncheck: () => tone(660, 0, 0.18, "sine", 0.12, 330),
  complete: () => {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7].forEach((f, i) => bell(f, i * 0.07, 0.16, 1.4));
    noise(0.1, 1.2, 3000, 9000, 0.05);
  },
  whoosh: () => noise(0, 0.6, 300, 5000, 0.1),
  tick: () => tone(2200, 0, 0.03, "square", 0.04),
  win: () => { [NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => bell(f, i * 0.12, 0.2, 1.2)); },
  send: () => { tone(700, 0, 0.18, "sine", 0.15, 1600); },
  sos: () => { [0, 0.18, 0.36].forEach((t) => tone(880, t, 0.12, "triangle", 0.12)); },
  splash: () => {
    noise(0, 1.4, 200, 6000, 0.08);
    [NOTE.C5, NOTE.G5, NOTE.D6, NOTE.E6, NOTE.G6].forEach((f, i) => bell(f, 0.25 + i * 0.12, 0.14, 1.6));
  },
  fanfare: () => {
    [[NOTE.C5, NOTE.E5, NOTE.G5], [NOTE.D5, NOTE.G5, NOTE.B5], [NOTE.E5, NOTE.G5, NOTE.C6]].forEach((ch, i) =>
      ch.forEach((f) => bell(f * 2, i * 0.28, 0.1, 1.5)));
  },
};
