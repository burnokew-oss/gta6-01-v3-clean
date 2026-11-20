// radio.js — 3 stasiun radio prosedural: loop synth orisinal WebAudio,
// nama stasiun dan judul lagu tampil di HUD, ganti stasiun dengan R.
import { RADIO_STATIONS } from "./config.js";

const SCALES = [
  [220, 261.6, 329.6, 392, 329.6, 261.6],
  [196, 246.9, 293.7, 392, 293.7, 246.9],
  [174.6, 220, 261.6, 349.2, 261.6, 220],
];

export class Radio {
  constructor(audio) {
    this.stations = RADIO_STATIONS;
    this.idx = 0;
    this.trackIdx = 0;
    this.audio = audio;
    this.step = 0;
    this.timer = 0;
    this.playing = false;
  }
  get station() { return this.stations[this.idx]; }
  get track() { return this.station.tracks[this.trackIdx % this.station.tracks.length]; }
  next() {
    this.idx = (this.idx + 1) % this.stations.length;
    this.trackIdx = 0; this.step = 0;
  }
  start() { this.playing = true; }
  update(dt) {
    if (!this.playing || !this.audio.ctx) return;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.24;
      const scale = SCALES[this.idx];
      const note = scale[this.step % scale.length];
      this.audio.tone(note, 0.2, "triangle", 0.05);
      if (this.step % 4 === 0) this.audio.tone(note / 2, 0.4, "sine", 0.07);
      this.step += 1;
      if (this.step % 24 === 0) this.trackIdx += 1;
    }
  }
}
