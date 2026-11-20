// Teluk Cerah — procedural WebAudio sound: engine, siren, gunshots,
// footsteps, horns and reward chimes. Everything is synthesised, nothing
// is loaded, and every call is safe before the first user gesture.

export function createAudio() {
  let ctx = null, engineOsc = null, engineGain = null, sirenOsc = null, sirenGain = null, stepAt = 0;
  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume().catch(() => {}); return ctx; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { ctx = null; }
    return ctx;
  }
  function env(gain, t0, a, peak, d) {
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + a);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + a + d);
  }
  const A = {
    unlock() { ensure(); },
    engine(level, on) {
      const c = ensure(); if (!c) return;
      if (!engineOsc) {
        engineOsc = c.createOscillator(); engineOsc.type = "sawtooth";
        const filt = c.createBiquadFilter(); filt.type = "lowpass"; filt.frequency.value = 420;
        engineGain = c.createGain(); engineGain.gain.value = 0;
        engineOsc.connect(filt).connect(engineGain).connect(c.destination);
        engineOsc.start();
      }
      engineOsc.frequency.setTargetAtTime(52 + level * 165, c.currentTime, 0.08);
      engineGain.gain.setTargetAtTime(on ? 0.05 : 0.028, c.currentTime, 0.1);
    },
    siren(on) {
      const c = ensure(); if (!c) return;
      if (on && !sirenOsc) {
        sirenOsc = c.createOscillator(); sirenOsc.type = "triangle";
        sirenGain = c.createGain(); sirenGain.gain.value = 0.016;
        const lfo = c.createOscillator(); lfo.frequency.value = 0.55;
        const lfoGain = c.createGain(); lfoGain.gain.value = 130;
        lfo.connect(lfoGain).connect(sirenOsc.frequency);
        sirenOsc.frequency.value = 760;
        sirenOsc.connect(sirenGain).connect(c.destination);
        sirenOsc.start(); lfo.start();
        sirenOsc._lfo = lfo;
      } else if (!on && sirenOsc) {
        try { sirenOsc.stop(); sirenOsc._lfo?.stop(); } catch {}
        sirenOsc = null;
      }
    },
    shot(kind, vol = 1) {
      const c = ensure(); if (!c) return;
      const t0 = c.currentTime;
      const len = kind === "shotgun" ? 0.30 : 0.14;
      const buffer = c.createBuffer(1, c.sampleRate * len, c.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
      const src = c.createBufferSource(); src.buffer = buffer;
      const filt = c.createBiquadFilter(); filt.type = "lowpass";
      filt.frequency.value = kind === "shotgun" ? 900 : 2400;
      const g = c.createGain(); env(g, t0, 0.004, 0.22 * vol, len);
      src.connect(filt).connect(g).connect(c.destination);
      src.start();
    },
    reload() {
      const c = ensure(); if (!c) return;
      const o = c.createOscillator(); o.type = "square"; o.frequency.value = 220;
      const g = c.createGain(); env(g, c.currentTime, 0.005, 0.05, 0.09);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.12);
    },
    horn() {
      const c = ensure(); if (!c) return;
      for (const f of [370, 466]) {
        const o = c.createOscillator(); o.type = "square"; o.frequency.value = f;
        const g = c.createGain(); env(g, c.currentTime, 0.01, 0.035, 0.32);
        o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.36);
      }
    },
    step() {
      const c = ensure(); if (!c) return;
      const now = performance.now();
      if (now - stepAt < 300) return;
      stepAt = now;
      const o = c.createOscillator(); o.type = "sine"; o.frequency.value = 82;
      const g = c.createGain(); env(g, c.currentTime, 0.004, 0.05, 0.07);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.1);
    },
    coin() {
      const c = ensure(); if (!c) return;
      [880, 1318].forEach((f, i) => {
        const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f;
        const g = c.createGain(); env(g, c.currentTime + i * 0.07, 0.006, 0.06, 0.16);
        o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.3 + i * 0.07);
      });
    },
    hit() {
      const c = ensure(); if (!c) return;
      const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = 160;
      const g = c.createGain(); env(g, c.currentTime, 0.004, 0.08, 0.08);
      o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.12);
    },
  };
  return A;
}
