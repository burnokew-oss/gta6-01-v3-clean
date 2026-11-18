// radio.js — tiga stasiun radio orisinal Teluk Cerah (builder sistem, rebuild #3).
// Stasiun dan lagu semuanya karangan sendiri. Modul ini mengatur stasiun aktif,
// lagu yang sedang diputar, dan pergantian stasiun (tombol R saat di mobil).
// Musiknya sendiri disintesis oleh modul audio; di sini hanya jadwal lagunya.

import { playSound } from './audio.js';

const STATIONS = [
  {
    id: 'pantai',
    name: 'Pantai FM',
    genre: 'Lagu Raya',
    tracks: [
      { title: 'Senja di Teluk', artist: 'Lagu Raya', length: 214 },
      { title: 'Ombak Pulang', artist: 'Lagu Raya', length: 188 },
      { title: 'Lampu Dermaga', artist: 'Lagu Raya', length: 203 },
    ],
  },
  {
    id: 'neon',
    name: 'Neon Malam FM',
    genre: 'Synthwave Teluk',
    tracks: [
      { title: 'Jalan Basah', artist: 'Kilau Kota', length: 196 },
      { title: 'Lampu Kota Tua', artist: 'Kilau Kota', length: 221 },
      { title: 'Kecepatan 172', artist: 'Kilau Kota', length: 178 },
    ],
  },
  {
    id: 'suara',
    name: 'Suara Teluk FM',
    genre: 'Dangdut Pantai',
    tracks: [
      { title: 'Goyang Perahu', artist: 'Nelayan Band', length: 205 },
      { title: 'Pasar Malam', artist: 'Nelayan Band', length: 192 },
      { title: 'Raka Pulang', artist: 'Nelayan Band', length: 216 },
    ],
  },
];

function ensureRadio(state) {
  if (!state.radio) {
    state.radio = {
      stations: STATIONS.map((station) => ({
        ...station,
        tracks: station.tracks.map((track) => ({ ...track })),
      })),
      index: 0,
      trackIndex: 0,
      trackTime: 0,
      playing: false,
    };
  }
  return state.radio;
}

function currentStation(radio) {
  return radio.stations[radio.index] || radio.stations[0];
}

function currentTrack(radio) {
  const station = currentStation(radio);
  return station.tracks[radio.trackIndex] || station.tracks[0];
}

function startMusic(state, radio) {
  const station = currentStation(radio);
  const track = currentTrack(radio);
  if (state.audio) {
    state.audio.radioStation = station.id;
    state.audio.radioTrack = track.title;
  }
  radio.playing = true;
  playSound(state, 'radio');
}

function stopMusic(state) {
  if (state.audio) {
    state.audio.radioStation = null;
    state.audio.radioTrack = null;
  }
}

export function createRadio(state) {
  const radio = ensureRadio(state);
  radio.index = 0;
  radio.trackIndex = 0;
  radio.trackTime = 0;
  radio.playing = false;
  return radio;
}

export function nextStation(state) {
  const radio = ensureRadio(state);
  radio.index = (radio.index + 1) % radio.stations.length;
  radio.trackIndex = 0;
  radio.trackTime = 0;
  stopMusic(state);
  startMusic(state, radio);
  return currentStation(radio);
}

export function updateRadio(state, dt) {
  const radio = ensureRadio(state);
  const player = state.player || {};
  const inCar = Boolean(player.car || player.vehicle || player.inCar);
  if (state.paused || state.mapOpen) return;
  if (state.input && typeof state.input.takePressed === 'function') {
    if (inCar && state.input.takePressed('KeyR')) {
      nextStation(state);
      return;
    }
  }
  if (inCar && !radio.playing) {
    startMusic(state, radio);
  }
  if (!inCar && radio.playing) {
    stopMusic(state);
    radio.playing = false;
  }
  if (!radio.playing) return;
  radio.trackTime += dt;
  const track = currentTrack(radio);
  if (radio.trackTime >= track.length) {
    radio.trackTime = 0;
    radio.trackIndex = (radio.trackIndex + 1) % currentStation(radio).tracks.length;
    startMusic(state, radio);
  }
}

export function radioLine(state) {
  const radio = ensureRadio(state);
  const station = currentStation(radio);
  const track = currentTrack(radio);
  const base = station.name + ' — "' + track.title + '" · ' + track.artist;
  if (!radio.playing) return base + ' · (radio mati)';
  return base;
}

export function radioState(state) {
  const radio = ensureRadio(state);
  return {
    station: currentStation(radio).name,
    track: currentTrack(radio).title,
    artist: currentTrack(radio).artist,
    playing: radio.playing,
  };
}
