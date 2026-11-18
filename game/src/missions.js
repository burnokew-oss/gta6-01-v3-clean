// missions.js — cerita dan objektif Teluk Cerah (builder sistem, rebuild #3).
// Sepuluh misi cerita dengan pemberi Bu Sari. Modul ini tidak mengenal dunia
// 3D secara langsung: ia hanya membaca posisi pemain dari state bersama dan
// memakai HUD + audio lewat impor lokal. Semua angka hadiah mengikuti
// spesifikasi prosa; semua nama dan dialog orisinal.

import { showDialog, showBanner } from './hud.js';
import { playSound } from './audio.js';

export const MISSIONS = [
  {
    number: 1,
    name: 'Pulang Kampung',
    reward: 150,
    rep: 60,
    giver: 'Bu Sari',
    intro: [
      'Raka, akhirnya pulang juga. Tiga tahun merantau, kota ini tetap sama: ramai, panas, dan penuh peluang.',
      'Mobil pinjaman sudah menunggu di depan warung kopi. Ambil, lalu temui aku di titik temu. Jangan bikin ribut dulu.',
    ],
    stages: [
      { objective: 'Ambil mobil pinjaman di depan warung kopi', point: 'warung-kopi', x: -36, z: 28 },
      { objective: 'Temui Bu Sari di titik temu Kota Tua', point: 'titik-temu', x: -18, z: 6 },
    ],
  },
  {
    number: 2,
    name: 'Titipan',
    reward: 300,
    rep: 90,
    giver: 'Bu Sari',
    intro: [
      'Ada paket di gudang Pelabuhan. Ambil, bawa ke Marina, jangan dibuka.',
      'Polisi lagi rajin patroli malam ini. Kalau mereka mengejar, jangan berhenti — kabur sampai bintangmu hilang.',
    ],
    stages: [
      { objective: 'Ambil paket di gudang Pelabuhan', point: 'gudang-pelabuhan', x: 52, z: 128 },
      { objective: 'Antar paket ke dermaga Marina', point: 'dermaga-marina', x: -128, z: 34 },
      { objective: 'Lepas dari kejaran polisi (wanted 0)', point: 'bebas', x: -128, z: 34, requireWantedZero: true },
    ],
  },
  {
    number: 3,
    name: 'Utang Lama',
    reward: 450,
    rep: 120,
    giver: 'Bu Sari',
    intro: [
      'Tiga penagih utang lama masih gentayangan di Kota Tua. Mereka tidak mau bicara baik-baik.',
      'Datangi mereka satu per satu. Tinju dulu, pistol kalau perlu. Aku sudah siapkan pistol di laci warung.',
    ],
    stages: [
      { objective: 'Hadapi penagih pertama di gang Kota Tua', point: 'penagih-1', x: -52, z: -8, enemies: 1 },
      { objective: 'Hadapi penagih kedua di pasar lama', point: 'penagih-2', x: -30, z: -34, enemies: 1 },
      { objective: 'Hadapi penagih terakhir di depan balai kota', point: 'penagih-3', x: -8, z: -52, enemies: 1 },
    ],
  },
  {
    number: 4,
    name: 'Balapan Liar',
    reward: 600,
    rep: 150,
    giver: 'Nadia',
    intro: [
      'Nadia menantangmu balapan liar keliling CBD. Delapan checkpoint, tiga pembalap, satu pemenang.',
      'Mobil sport merahmu sudah disiapkan Dimas. Jangan rem di tikungan — gas terus, potong jalur kalau perlu.',
    ],
    stages: [
      { objective: 'Balapan liar: lewati 8 checkpoint keliling CBD', point: 'garis-start', x: 64, z: 18, checkpoints: 8 },
    ],
  },
  {
    number: 5,
    name: 'Rampok Toko',
    reward: 900,
    rep: 150,
    giver: 'Bu Sari',
    intro: [
      'Toko perhiasan di CBD tutup tengah malam. Masuk, ambil isinya, keluar cepat.',
      'Alarm pasti bunyi dan polisi datang berbondong-bondong. Setelah dapat uangnya, kabur ke safehouse Perumahan.',
    ],
    stages: [
      { objective: 'Masuk ke toko perhiasan CBD dan ambil uangnya', point: 'toko-perhiasan', x: 88, z: -14, heat: 4 },
      { objective: 'Kabur ke safehouse Perumahan (wanted 4)', point: 'safehouse', x: -24, z: -128 },
    ],
  },
  {
    number: 6,
    name: 'Puncak',
    reward: 1500,
    rep: 220,
    giver: 'Bu Sari',
    intro: [
      'Geng Pelabuhan sudah terlalu lama menguasai dermaga. Malam ini kita akhiri.',
      'Baku tembak di gudang: habisi mereka semua, lalu kabur sebelum polisi menutup jalan. Sinta sudah mematikan kamera gudang.',
    ],
    stages: [
      { objective: 'Serbu gudang Pelabuhan dan habisi geng rival', point: 'gudang-pelabuhan', x: 52, z: 128, enemies: 6 },
      { objective: 'Kabur dari gudang sebelum polisi menutup jalan', point: 'jalan-pelabuhan', x: 30, z: 96 },
    ],
  },
  {
    number: 7,
    name: 'Kurir Malam',
    reward: 700,
    rep: 140,
    giver: 'Sinta',
    intro: [
      'Sinta butuh kurir malam ini: tiga paket, tiga titik, tanpa jejak.',
      'Antar semuanya sebelum jam tiga pagi. Polisi tidak boleh melihatmu berhenti lama-lama di satu tempat.',
    ],
    stages: [
      { objective: 'Antar paket pertama ke Marina', point: 'kurir-1', x: -118, z: 62 },
      { objective: 'Antar paket kedua ke Kota Tua', point: 'kurir-2', x: -44, z: -44 },
      { objective: 'Antar paket terakhir ke CBD', point: 'kurir-3', x: 96, z: 30 },
    ],
  },
  {
    number: 8,
    name: 'Bayangan',
    reward: 800,
    rep: 160,
    giver: 'Sinta',
    intro: [
      'Seseorang membuntuti Bu Sari sejak kemarin. Ikuti bayangan itu tanpa ketahuan.',
      'Jangan terlalu dekat, jangan sampai hilang. Kalau dia masuk ke gang Pelabuhan, itu sarang mereka.',
    ],
    stages: [
      { objective: 'Ikuti bayangan itu dari Kota Tua', point: 'bayangan-1', x: -20, z: -18 },
      { objective: 'Terus ikuti sampai gang Pelabuhan', point: 'bayangan-2', x: 44, z: 104 },
    ],
  },
  {
    number: 9,
    name: 'Heist Pelabuhan',
    reward: 1200,
    rep: 200,
    giver: 'Bu Sari',
    intro: [
      'Kontainer terakhir bulan ini berisi uang geng yang belum dicuci. Kita ambil sebelum mereka memindahkannya.',
      'Bimo sudah di dalam sebagai penjaga. Masuk lewat pintu belakang, ambil kontainer, keluar lewat dermaga.',
    ],
    stages: [
      { objective: 'Masuk lewat pintu belakang gudang kontainer', point: 'heist-pintu', x: 66, z: 118 },
      { objective: 'Buka kontainer dan ambil uangnya', point: 'heist-kontainer', x: 78, z: 132, enemies: 3 },
      { objective: 'Kabur lewat dermaga ke titik temu', point: 'heist-kabur', x: 24, z: 140 },
    ],
  },
  {
    number: 10,
    name: 'Raja Teluk',
    reward: 2000,
    rep: 300,
    giver: 'Bu Sari',
    intro: [
      'Ini puncaknya, Raka. Bos geng dan pengawalnya berkumpul di gudang. Habisi mereka, lalu pergi dari pelabuhan — Teluk Cerah jadi milikmu.',
      'Lima pengawal, satu bos. Jangan beri mereka waktu bernapas. Setelah ini, tidak ada lagi yang berani mengganggumu.',
    ],
    stages: [
      { objective: 'Habisi bos geng dan 5 pengawalnya', point: 'gudang-pelabuhan', x: 52, z: 128, enemies: 6 },
      { objective: 'Tinggalkan pelabuhan sebagai Raja Teluk', point: 'jalan-pelabuhan', x: 30, z: 96 },
    ],
  },
];

const ARRIVE_DISTANCE = 9;
const DIALOG_ADVANCE_KEY = 'Enter';

function ensureMissions(state) {
  if (!state.missions) {
    state.missions = {
      current: 0,
      stage: 0,
      done: [],
      dialogQueue: [],
      dialogIndex: 0,
      dialogOpen: false,
      bannerUntil: 0,
      killsThisStage: 0,
      checkpointsHit: 0,
      startedAt: 0,
    };
  }
  return state.missions;
}

function missionByNumber(number) {
  return MISSIONS.find((entry) => entry.number === number) || null;
}

function currentMission(state) {
  const ms = ensureMissions(state);
  if (!ms.current) return null;
  return missionByNumber(ms.current);
}

function currentStage(state) {
  const mission = currentMission(state);
  if (!mission) return null;
  return mission.stages[ensureMissions(state).stage] || null;
}

function resolvePoint(state, stage) {
  if (!stage) return null;
  const named = state.city && state.city.points ? state.city.points[stage.point] : null;
  if (named && typeof named.x === 'number' && typeof named.z === 'number') {
    return { x: named.x, z: named.z };
  }
  if (typeof stage.x === 'number' && typeof stage.z === 'number') {
    return { x: stage.x, z: stage.z };
  }
  return null;
}

function playerPosition(state) {
  const player = state.player;
  if (!player) return null;
  const pos = player.position || player.pos;
  if (!pos) return null;
  if (typeof pos.x === 'number' && typeof pos.z === 'number') return { x: pos.x, z: pos.z };
  return null;
}

function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function addCash(state, amount) {
  if (typeof state.cash === 'number') state.cash += amount;
  else if (typeof state.money === 'number') state.money += amount;
  else state.cash = amount;
}

function addRep(state, amount) {
  if (!state.reputation || typeof state.reputation.points !== 'number') {
    state.reputation = state.reputation || {};
    state.reputation.points = state.reputation.points || 0;
  }
  state.reputation.points += amount;
  const tiers = [
    { at: 0, name: 'Anak Baru' },
    { at: 200, name: 'Pembalap Teluk' },
    { at: 600, name: 'Raja Jalanan' },
    { at: 1200, name: 'Legenda Teluk' },
    { at: 2000, name: 'Raja Teluk' },
  ];
  let tier = tiers[0];
  for (const candidate of tiers) {
    if (state.reputation.points >= candidate.at) tier = candidate;
  }
  state.reputation.tier = tier.name;
  state.reputation.level = tiers.indexOf(tier) + 1;
}

function openIntroDialog(state, mission) {
  const ms = ensureMissions(state);
  ms.dialogQueue = mission.intro.slice();
  ms.dialogIndex = 0;
  ms.dialogOpen = true;
  showDialog(state, mission.giver, mission.intro[0]);
  playSound(state, 'mission');
}

export function createMissions(state) {
  const ms = ensureMissions(state);
  ms.current = 0;
  ms.stage = 0;
  ms.done = [];
  ms.dialogQueue = [];
  ms.dialogIndex = 0;
  ms.dialogOpen = false;
  ms.killsThisStage = 0;
  ms.checkpointsHit = 0;
  ms.startedAt = 0;
  ms.pendingNext = 0;
  // Daftarkan daftar misi + fungsi objektif ke state bersama agar modul HUD
  // bisa membaca nama, hadiah, dan tahap tanpa impor balik.
  state.missionsList = MISSIONS;
  state.objectiveText = missionObjectiveText;
  if (!state.stats) state.stats = {};
  if (typeof state.stats.missionsDone !== 'number') state.stats.missionsDone = 0;
  return ms;
}

export function startMission(state, number) {
  const ms = ensureMissions(state);
  const mission = missionByNumber(number);
  if (!mission) return false;
  if (ms.done.includes(number)) return false;
  if (ms.current === number) return false;
  ms.current = number;
  ms.stage = 0;
  ms.killsThisStage = 0;
  ms.checkpointsHit = 0;
  ms.startedAt = state.playTime || 0;
  if (state.combat) state.combat.missionEnemies = 0;
  openIntroDialog(state, mission);
  showBanner(state, 'M' + number + ' — ' + mission.name);
  return true;
}

function advanceDialog(state) {
  const ms = ensureMissions(state);
  if (!ms.dialogOpen) return;
  ms.dialogIndex += 1;
  if (ms.dialogIndex < ms.dialogQueue.length) {
    const mission = currentMission(state);
    showDialog(state, mission ? mission.giver : 'Bu Sari', ms.dialogQueue[ms.dialogIndex]);
  } else {
    ms.dialogOpen = false;
    showDialog(state, '', '');
  }
}

function completeStage(state) {
  const ms = ensureMissions(state);
  const mission = currentMission(state);
  if (!mission) return;
  ms.stage += 1;
  ms.killsThisStage = 0;
  ms.checkpointsHit = 0;
  if (ms.stage >= mission.stages.length) {
    completeMission(state, mission);
  } else {
    playSound(state, 'pickup');
  }
}

function completeMission(state, mission) {
  const ms = ensureMissions(state);
  ms.done.push(mission.number);
  ms.current = 0;
  ms.stage = 0;
  addCash(state, mission.reward);
  addRep(state, mission.rep);
  if (state.stats) {
    state.stats.missionsDone = (state.stats.missionsDone || 0) + 1;
    state.stats.cashEarned = (state.stats.cashEarned || 0) + mission.reward;
  }
  showBanner(state, 'MISI SELESAI — ' + mission.name + ' +$' + mission.reward);
  playSound(state, 'mission');
  if (mission.number === 3 && state.player) {
    if (state.combat) state.combat.shotgunUnlocked = true;
  }
  const next = missionByNumber(mission.number + 1);
  if (next && !ms.done.includes(next.number)) {
    ms.pendingNext = next.number;
  }
}

export function updateMissions(state, dt) {
  const ms = ensureMissions(state);
  if (state.paused || state.mapOpen) return;
  if (state.input && typeof state.input.takePressed === 'function') {
    if (ms.dialogOpen && state.input.takePressed(DIALOG_ADVANCE_KEY)) {
      advanceDialog(state);
    }
  }
  if (ms.pendingNext && !ms.dialogOpen && !ms.current) {
    const nextNumber = ms.pendingNext;
    ms.pendingNext = 0;
    startMission(state, nextNumber);
    return;
  }
  const mission = currentMission(state);
  if (!mission) return;
  const stage = currentStage(state);
  if (!stage) return;
  if (ms.dialogOpen) return;

  if (stage.enemies && stage.enemies > 0) {
    const kills = state.combat ? state.combat.killsThisMission || 0 : ms.killsThisStage;
    const needed = stage.enemies;
    if (kills >= needed) {
      if (state.combat) state.combat.killsThisMission = 0;
      completeStage(state);
      return;
    }
    const pos = playerPosition(state);
    const target = resolvePoint(state, stage);
    if (pos && target && distance2D(pos, target) <= ARRIVE_DISTANCE + 14) {
      if (state.combat && typeof state.combat.missionEnemies === 'number' && state.combat.missionEnemies === 0) {
        state.combat.missionEnemies = needed;
        state.combat.missionSpawnAt = target;
      }
    }
    return;
  }

  if (stage.checkpoints && stage.checkpoints > 0) {
    const hit = ms.checkpointsHit || 0;
    if (hit >= stage.checkpoints) {
      completeStage(state);
    }
    return;
  }

  if (stage.requireWantedZero) {
    const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
    if (wanted === 0) completeStage(state);
    return;
  }

  const pos = playerPosition(state);
  const target = resolvePoint(state, stage);
  if (!pos || !target) return;
  if (distance2D(pos, target) <= ARRIVE_DISTANCE) {
    if (typeof stage.heat === 'number' && stage.heat > 0) {
      if (state.police && typeof state.police.setWanted === 'function') {
        state.police.setWanted(state, stage.heat);
      } else if (typeof state.wanted === 'number') {
        state.wanted = Math.max(state.wanted, stage.heat);
      }
    }
    completeStage(state);
  }
}

export function missionObjectiveText(state) {
  const mission = currentMission(state);
  if (!mission) return 'Bebas — jelajahi Teluk Cerah, cari kerang, atau mulai misi berikutnya.';
  const ms = ensureMissions(state);
  const stage = mission.stages[ms.stage];
  if (!stage) return mission.name;
  let extra = '';
  if (stage.enemies) {
    const kills = state.combat ? state.combat.killsThisMission || 0 : 0;
    extra = ' — ' + kills + '/' + stage.enemies + ' dikalahkan';
  }
  if (stage.checkpoints) {
    extra = ' — ' + (ms.checkpointsHit || 0) + '/' + stage.checkpoints + ' checkpoint';
  }
  return stage.objective + extra;
}

export function missionProgress(state) {
  const ms = ensureMissions(state);
  return {
    current: ms.current,
    stage: ms.stage,
    done: ms.done.slice(),
    total: MISSIONS.length,
  };
}
