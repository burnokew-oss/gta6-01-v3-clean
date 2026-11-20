// Radio tiga stasiun orisinal; berganti lagu seiring waktu, tombol R di mobil mengganti stasiun.
import { CONFIG } from "./config.js";
import { playSound } from "./audio.js";

export function createRadio(state) {
  return { station: 0, songIndex: 0, songTimer: 0, playing: true };
}

export function currentStation(state) {
  return CONFIG.radioStations[state.radioState.station];
}

export function currentSong(state) {
  const st = currentStation(state);
  return st.songs[state.radioState.songIndex % st.songs.length];
}

export function nextStation(state) {
  const r = state.radioState;
  r.station = (r.station + 1) % CONFIG.radioStations.length;
  r.songIndex = 0; r.songTimer = 0;
  playSound(state, "radio");
}

export function updateRadio(state, dt) {
  const r = state.radioState;
  if (!state.player.car) return;
  r.songTimer += dt;
  if (r.songTimer > 30) {
    r.songTimer = 0;
    const st = currentStation(state);
    r.songIndex = (r.songIndex + 1) % st.songs.length;
  }
}
