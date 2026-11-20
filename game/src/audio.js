// audio.js — efek suara prosedural WebAudio: mesin, klakson, tembakan,
// sirene, langkah, dan koin. Konteks dibuat lazily pada interaksi pertama.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
  }
  ensure() {
    if (this.ctx) { if (this.ctx.state === "suspended") this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }
  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.08, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }
  shot(kind) {
    if (!this.ctx) return;
    if (kind === "shotgun") { this.tone(120, 0.22, "sawtooth", 0.16); this.tone(60, 0.3, "square", 0.12, 0.02); }
    else if (kind === "pistol") { this.tone(220, 0.1, "sawtooth", 0.12); }
    else this.tone(300, 0.06, "square", 0.06);
  }
  horn() { this.tone(370, 0.25, "square", 0.07); this.tone(466, 0.25, "square", 0.06); }
  coin() { this.tone(880, 0.09, "sine", 0.09); this.tone(1320, 0.16, "sine", 0.09, 0.08); }
  step() { this.tone(90, 0.05, "sine", 0.03); }
  siren(t) {
    if (!this.ctx) return;
    if (Math.floor(t * 2) % 2 === 0) this.tone(660, 0.12, "triangle", 0.015);
  }
  engine(speedRatio) {
    if (!this.ctx) return;
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineOsc.type = "sawtooth";
      this.engineGain.gain.value = 0.0;
      this.engineOsc.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);
      this.engineOsc.start();
    }
    this.engineOsc.frequency.value = 55 + Math.abs(speedRatio) * 130;
    this.engineGain.gain.value = 0.012 + Math.abs(speedRatio) * 0.02;
  }
}
