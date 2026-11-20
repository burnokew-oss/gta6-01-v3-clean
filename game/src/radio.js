// Teluk Cerah — three original procedural radio stations. A tiny step
// sequencer plays a synth loop per station (coastal pop, dangdut bounce,
// garage rock) while the HUD shows the station and the current track.

import { RADIO_STATIONS } from "./config.js";

const SCALES = {
  pop: [0, 2, 4, 7, 9, 12, 11, 9],
  dangdut: [0, 3, 5, 7, 10, 7, 5, 3],
  rock: [0, 0, 7, 0, 10, 0, 7, 5],
};
const BASES = [220, 196, 164.8];
const WAVES = ["triangle", "square", "sawtooth"];

export function createRadio(onTrack) {
  let ctx = null, master = null, timer = null, step = 0;
  const R = {
    index: 0, playing: false, trackIdx: 0, trackTimer: 0,
    get station() { return RADIO_STATIONS[R.index]; },
    get track() { return R.station.tracks[R.trackIdx % R.station.tracks.length]; },
    cycle() {
      R.index = (R.index + 1) % RADIO_STATIONS.length;
      R.trackIdx = 0; R.trackTimer = 0;
      onTrack?.();
      if (R.playing) { stopLoop(); startLoop(); }
    },
    start() {
      if (R.playing) return;
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.045;
        master.connect(ctx.destination);
        R.playing = true;
        startLoop();
      } catch { /* radio stays silent without audio */ }
    },
    update(dt) {
      R.trackTimer += dt;
      if (R.trackTimer > 26) {
        R.trackTimer = 0;
        R.trackIdx = (R.trackIdx + 1) % R.station.tracks.length;
        onTrack?.();
      }
    },
  };
  function note(freq, t, dur, type, vol) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function startLoop() {
    const scale = [SCALES.pop, SCALES.dangdut, SCALES.rock][R.index];
    const base = BASES[R.index], wave = WAVES[R.index];
    const stepDur = R.index === 1 ? 0.21 : 0.24;
    timer = setInterval(() => {
      if (!ctx) return;
      const t = ctx.currentTime + 0.05;
      const semi = scale[step % scale.length];
      const freq = base * Math.pow(2, semi / 12);
      note(freq, t, stepDur * 1.8, wave, 0.5);
      if (step % 2 === 0) note(base / 2, t, stepDur * 1.6, "sine", 0.8);
      if (R.index === 2 && step % 4 === 2) note(base * 2, t, 0.08, "square", 0.2);
      step += 1;
    }, stepDur * 1000);
  }
  function stopLoop() { if (timer) clearInterval(timer); timer = null; }
  return R;
}
