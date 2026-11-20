// radio.js — 3 stasiun radio prosedural: loop synth orisinal WebAudio,
// nama stasiun dan judul lagu tampil di HUD.
import { RADIO_STATIONS } from "./config.js";

const SCALES = [
  [220, 261.6, 329.6, 392, 440, 523.3],
  [196, 246.9, 293.7, 349.2, 392, 493.9],
  [174.6, 220, 261.6, 311.1, 349.2, 440],
];
const PATTERNS = [
  [0, 2, 4, 3, 5, 4, 2, 1],
  [0, 0, 3, 2, 4, 4, 1, 2],
  [5, 4, 2, 3, 1, 2, 0, 2],
];

export class Radio {
  constructor(audio) {
    this.audio = audio;
    this.station = 0;
    this.track = 0;
    this.step = 0;
    this.timer = 0;
    this.playing = false;
  }
  get info() {
    const s = RADIO_STATIONS[this.station];
    return { station: s.name, genre: s.genre, track: s.tracks[this.track % s.tracks.length] };
  }
  next() {
    this.station = (this.station + 1) % RADIO_STATIONS.length;
    this.track++;
    return this.info;
  }
  update(dt) {
    if (!this.audio.ctx || !this.playing) return;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = 0.24;
    const scale = SCALES[this.station];
    const pat = PATTERNS[this.station];
    const note = scale[pat[this.step % pat.length] % scale.length];
    this.audio.blip(note, 0.22, this.station === 1 ? "square" : "triangle", 0.045);
    if (this.step % 4 === 0) this.audio.blip(note / 2, 0.4, "sine", 0.06);
    this.step++;
    if (this.step % 32 === 0) this.track++;
  }
}
