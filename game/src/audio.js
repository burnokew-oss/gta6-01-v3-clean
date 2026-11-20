// Audio sintesis WebAudio tanpa file: mesin, sirene, tembakan, jingle, ambient.
export function createAudio(state) {
  return { ctx: null, master: null, muted: false, engineOsc: null, engineGain: null, sirenOsc: null, sirenGain: null, ambientAt: 0 };
}

function ensureCtx(state) {
  const a = state.audioState;
  if (!a.ctx) {
    try {
      a.ctx = new (window.AudioContext || window.webkitAudioContext)();
      a.master = a.ctx.createGain(); a.master.gain.value = a.muted ? 0 : 0.5;
      a.master.connect(a.ctx.destination);
    } catch { return null; }
  }
  if (a.ctx.state === "suspended") a.ctx.resume();
  return a.ctx;
}

export function setMuted(state, muted) {
  state.audioState.muted = muted;
  state.muted = muted;
  if (state.audioState.master) state.audioState.master.gain.value = muted ? 0 : 0.5;
}

function blip(state, freq, dur, type = "sine", vol = 0.2, slide = 0) {
  const ctx = ensureCtx(state); if (!ctx) return;
  const a = state.audioState;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(a.master); o.start(); o.stop(ctx.currentTime + dur);
}

function noiseBurst(state, dur, vol, freq) {
  const ctx = ensureCtx(state); if (!ctx) return;
  const a = state.audioState;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = freq;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(a.master); src.start();
}

export function playSound(state, name) {
  if (state.audioState.muted) return;
  if (!state.audioReady) return;
  if (name === "gunshot") noiseBurst(state, 0.16, 0.5, 1800);
  else if (name === "punch") noiseBurst(state, 0.09, 0.35, 500);
  else if (name === "pickup") { blip(state, 880, 0.09, "sine", 0.18); setTimeout(() => blip(state, 1320, 0.12, "sine", 0.15), 70); }
  else if (name === "mission") { blip(state, 523, 0.14, "triangle", 0.2); setTimeout(() => blip(state, 659, 0.14, "triangle", 0.2), 120); setTimeout(() => blip(state, 784, 0.22, "triangle", 0.22), 240); }
  else if (name === "radio") blip(state, 660, 0.08, "square", 0.08);
}

export function updateAudio(state, dt) {
  const a = state.audioState;
  if (!a.ctx || a.muted) return;
  const ctx = a.ctx;
  // Mesin mengikuti kecepatan mobil pemain.
  const speed = state.player.car ? Math.abs(state.player.car.speed) : 0;
  if (state.player.car && state.audioReady) {
    if (!a.engineOsc) {
      a.engineOsc = ctx.createOscillator(); a.engineGain = ctx.createGain();
      a.engineOsc.type = "sawtooth"; a.engineGain.gain.value = 0.05;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
      a.engineOsc.connect(f); f.connect(a.engineGain); a.engineGain.connect(a.master);
      a.engineOsc.start();
    }
    a.engineOsc.frequency.value = 55 + speed * 3.4;
  } else if (a.engineOsc) {
    try { a.engineOsc.stop(); } catch { /* sudah berhenti */ }
    a.engineOsc = null;
  }
  // Sirene dua nada saat polisi dekat.
  const nearPolice = state.wanted > 0 && state.policeUnits.some((u) => u.active && u.distance < 45);
  if (nearPolice && state.audioReady) {
    if (!a.sirenOsc) {
      a.sirenOsc = ctx.createOscillator(); a.sirenGain = ctx.createGain();
      a.sirenOsc.type = "triangle"; a.sirenGain.gain.value = 0.035;
      a.sirenOsc.connect(a.sirenGain); a.sirenGain.connect(a.master); a.sirenOsc.start();
    }
    a.sirenOsc.frequency.value = Math.floor(performance.now() / 420) % 2 ? 660 : 880;
  } else if (a.sirenOsc) {
    try { a.sirenOsc.stop(); } catch { /* sudah berhenti */ }
    a.sirenOsc = null;
  }
  // Musik ambient: bassline minor pelan.
  a.ambientAt -= dt;
  if (a.ambientAt <= 0 && state.audioReady && !state.player.car) {
    a.ambientAt = 0.5;
    const notes = [110, 110, 130.8, 98];
    blip(state, notes[Math.floor(performance.now() / 500) % 4], 0.4, "sine", 0.05);
  }
}
