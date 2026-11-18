// Radio Teluk Cerah: 3 stasiun, masing-masing pola nada + gelombang
// sendiri dan satu lagu yang sedang diputar (judul + artis).
// Pola nada dipakai audio.js (WebAudio synth, tanpa file audio);
// nama + lagu dipakai HUD. Stasiun diganti tombol R saat nyetir.
export const RADIO_STATIONS = [
  { name: 'Pantai FM', wave: 'triangle', stepMs: 240, vol: 0.10, notes: [55, 0, 55, 65.4, 0, 55, 82.4, 0, 73.4, 65.4, 55, 0], track: { title: 'Senja di Teluk', artist: 'Lagu Raya' } },
  { name: 'Teluk Rock', wave: 'sawtooth', stepMs: 140, vol: 0.07, notes: [110, 110, 131, 110, 98, 110, 147, 131, 110, 98, 110, 164.8], track: { title: 'Aspal Panas', artist: 'Bara Selatan' } },
  { name: 'Dangdut Teluk', wave: 'square', stepMs: 180, vol: 0.06, notes: [220, 262, 294, 330, 294, 262, 220, 196, 220, 262, 330, 392], track: { title: 'Goyang Pelabuhan', artist: 'Siti Pelita' } },
];

export function stationAt(index) {
  return RADIO_STATIONS[((index % RADIO_STATIONS.length) + RADIO_STATIONS.length) % RADIO_STATIONS.length];
}

export function nextStationIndex(index) {
  return (index + 1) % RADIO_STATIONS.length;
}

// Satu baris untuk HUD: "Pantai FM — "Senja di Teluk" · Lagu Raya".
export function stationLine(index) {
  const st = stationAt(index);
  return `${st.name} — "${st.track.title}" · ${st.track.artist}`;
}
