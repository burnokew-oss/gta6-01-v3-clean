// audio.js — efek suara prosedural WebAudio: mesin, klakson, tembakan,
// sirene, langkah, koin. Konteks dibuat setelah gestur pengguna pertama.
export class AudioFx {
  constructor() {
    this.ctx = null;
    this.engineOsc = null; this.engineGain = null;
    this.sirenOsc = null; this.sirenGain = null;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.ctx.destination);
      const o = this.ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 60;
      o.connect(g); o.start();
      this.engineOsc = o; this.engineGain = g;
      const sg = this.ctx.createGain(); sg.gain.value = 0; sg.connect(this.ctx.destination);
      const so = this.ctx.createOscillator(); so.type = "triangle"; so.frequency.value = 700;
      so.connect(sg); so.start();
      this.sirenOsc = so; this.sirenGain = sg;
    } catch { this.ctx = null; }
  }
  setEngine(speedRatio, driving) {
    if (!this.ctx) return;
    this.engineGain.gain.value = driving ? 0.05 + speedRatio * 0.05 : 0;
    this.engineOsc.frequency.value = 55 + speedRatio * 165;
  }
  setSiren(on, t) {
    if (!this.ctx) return;
    this.sirenGain.gain.value = on ? 0.018 : 0;
    if (on) this.sirenOsc.frequency.value = 700 + Math.sin(t * 6) * 180;
  }
  blip(freq, dur, type = "square", vol = 0.12) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  }
  gunshot(big = false) {
    if (!this.ctx) return;
    const len = big ? 0.28 : 0.14;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = big ? 900 : 1800;
    const g = this.ctx.createGain(); g.gain.value = big ? 0.5 : 0.32;
    src.connect(f); f.connect(g); g.connect(this.ctx.destination);
    src.start();
  }
  horn() { this.blip(370, 0.35, "square", 0.1); setTimeout(() => this.blip(370, 0.3, "square", 0.08), 30); }
  step() { this.blip(90 + Math.random() * 30, 0.05, "sine", 0.05); }
  coin() { this.blip(990, 0.09, "square", 0.1); setTimeout(() => this.blip(1320, 0.16, "square", 0.1), 70); }
}
