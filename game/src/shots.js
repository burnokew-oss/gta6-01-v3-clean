// shots.js — staging deterministik empat screenshot Teluk Cerah (seed 1).
// Builder sistem, rebuild #3. Nama shot: chase, shootout, map, title.
// Modul ini hanya menata state bersama + HUD + kamera; ia tidak menggambar
// dunia sendiri. Semua nilai (uang, jam, wanted, dialog) mengikuti
// spesifikasi prosa bagian 2 secara harfiah.

import * as ThreeLib from 'three';
const THREE = (ThreeLib && typeof ThreeLib.Vector3 === 'function')
  ? ThreeLib
  : (typeof globalThis !== 'undefined' && globalThis.THREE ? globalThis.THREE : ThreeLib);
import { showDialog, showBanner, showMap, showTitle, hideTitle } from './hud.js';
import { startMission } from './missions.js';
import { spawnCar } from './vehicles.js';
import { spawnEnemies } from './combat.js';

const SHOT_NAMES = ['chase', 'shootout', 'map', 'title'];
const FIXED_SEED = 1;

function setClock(state, hour, minute, day) {
  if (state.clock) {
    state.clock.hour = hour;
    state.clock.minute = minute;
    state.clock.day = day;
  } else {
    state.hour = hour;
    state.minute = minute;
    state.day = day;
  }
}

function setCash(state, amount) {
  if (typeof state.cash === 'number') state.cash = amount;
  else if (typeof state.money === 'number') state.money = amount;
  else state.cash = amount;
}

function placePlayer(state, x, z, heading) {
  if (!state.player) state.player = {};
  const player = state.player;
  if (!player.position && !player.pos) player.position = { x: 0, y: 0, z: 0 };
  const pos = player.position || player.pos;
  pos.x = x;
  pos.z = z;
  if (typeof pos.y === 'number') pos.y = 0;
  if (typeof player.heading === 'number') player.heading = heading;
  if (typeof player.rotation === 'number') player.rotation = heading;
}

function putPlayerInCar(state, car) {
  if (!state.player) state.player = {};
  state.player.car = car;
  state.player.vehicle = car;
  state.player.inCar = true;
  state.player.speedKmh = car.speedKmh || 0;
  state.player.speed = car.speedKmh || 0;
}

function putPlayerOnFoot(state) {
  if (!state.player) state.player = {};
  state.player.car = null;
  state.player.vehicle = null;
  state.player.inCar = false;
  state.player.speedKmh = 0;
  state.player.speed = 0;
}

function setPoliceUnits(state, units) {
  if (!state.police) state.police = {};
  if (Array.isArray(state.police)) {
    state.police.length = 0;
    for (const unit of units) state.police.push(unit);
  } else {
    state.police.units = units;
    state.police.count = units.length;
    state.police.nearby = units.length > 0;
  }
}

function setHelicopter(state, x, y, z, mode) {
  if (!state.helicopter) state.helicopter = {};
  const heli = state.helicopter;
  if (!heli.position) heli.position = { x: 0, y: 0, z: 0 };
  heli.position.x = x;
  heli.position.y = y;
  heli.position.z = z;
  heli.mode = mode;
  if (!heli.target) heli.target = { x: 0, y: 0, z: 0 };
}

function aimCamera(state, cameraPos, lookAt) {
  state.shotCamera = { position: cameraPos.slice(), lookAt: lookAt.slice() };
  state.cameraMode = 'shot';
  const world = state.world;
  const camera = world && world.camera ? world.camera : null;
  if (camera && camera.position && typeof camera.position.set === 'function') {
    camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
    if (typeof camera.lookAt === 'function') camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
  }
}

function stageChase(state) {
  state.phase = 'playing';
  state.seed = FIXED_SEED;
  state.rain = true;
  state.weather = 'rain';
  setCash(state, 48275);
  setClock(state, 22, 57, 3);
  state.wanted = 4;
  state.shells = 9;
  state.playTime = 3 * 60 + 47;
  if (!state.reputation) state.reputation = {};
  state.reputation.points = 1960;
  state.reputation.tier = 'Raja Jalanan';
  state.reputation.level = 4;
  if (!state.stats) state.stats = {};
  state.stats.carsStolen = 38;
  state.stats.takedowns = 61;
  state.stats.escapes = 13;
  if (!state.player) state.player = {};
  state.player.hp = 88;
  state.player.health = 88;
  state.player.armor = 0;
  state.player.weaponIndex = 1;
  if (!state.combat) state.combat = {};
  state.combat.pistolAmmo = 12;
  state.combat.pistolReserve = 12;
  state.combat.shotgunAmmo = 0;
  state.combat.shotgunReserve = 0;
  state.combat.selected = 1;
  state.combat.weapons = [
    { slot: 1, name: 'Tinju', ammo: null, reserve: null },
    { slot: 2, name: 'Pistol', ammo: 12, reserve: 12 },
    { slot: 3, name: 'SG', ammo: 0, reserve: 0 },
  ];
  const sportCar = spawnCar(state, 'sport', 92, 18, Math.PI, 'player');
  if (sportCar.color !== 0xd21f2b) {
    sportCar.group.traverse((child) => {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const mat of mats) {
        if (mat && mat.color && mat.color.getHex && mat.color.getHex() === sportCar.color) {
          mat.color.setHex(0xd21f2b);
        }
      }
    });
    sportCar.color = 0xd21f2b;
  }
  sportCar.condition = 88;
  sportCar.nos = 82;
  sportCar.speedKmh = 172;
  if (Array.isArray(state.cars)) state.cars.push(sportCar);
  putPlayerInCar(state, sportCar);
  placePlayer(state, 92, 18, Math.PI);
  if (state.player.group) state.player.group.visible = false;
  state.missionTarget = { x: -24, z: -128 };
  state.objective = 'Kabur ke safehouse Perumahan (wanted 4)';
  if (state.missions) {
    state.missions.current = 5;
    state.missions.stage = 1;
    state.missions.done = [1, 2, 3, 4];
    state.missions.dialogOpen = false;
  }
  const chasePoliceSpots = [
    { x: 87, z: 23 },
    { x: 97, z: 25.5 },
    { x: 88, z: 26.5 },
  ];
  if (Array.isArray(state.cars)) {
    for (const spot of chasePoliceSpots) {
      state.cars.push(spawnCar(state, 'police', spot.x, spot.z, Math.PI, 'ai'));
    }
  }
  setPoliceUnits(state, [
    { name: 'GARUDA-1', type: 'heli', status: 'SPOTLIGHT', distance: 11, position: { x: 100, y: 18, z: 2 } },
    { name: 'CENDRAWASIH-07', type: 'car', status: 'PURSUIT', distance: 6, position: { x: 87, y: 0, z: 23 } },
    { name: 'JALAK-42', type: 'car', status: 'RAMMING', distance: 8, position: { x: 97, y: 0, z: 25.5 } },
    { name: 'BANGAU-18', type: 'car', status: 'PURSUIT', distance: 9, position: { x: 88, y: 0, z: 26.5 } },
    { name: 'KAKATUA-31', type: 'car', status: 'PURSUIT', distance: 15, position: { x: 96, y: 0, z: 33 } },
    { name: 'GARUDA-02', type: 'car', status: 'PENGEJARAN', distance: 19, position: { x: 88, y: 0, z: 37 } },
    { name: 'MERAK-09', type: 'car', status: 'PURSUIT', distance: 24, position: { x: 95, y: 0, z: 42 } },
    { name: 'ELANG-22', type: 'foot', status: 'PURSUIT', distance: 3, position: { x: 88, y: 0, z: 20 } },
    { name: 'RAJAWALI-05', type: 'foot', status: 'PURSUIT', distance: 4, position: { x: 96, y: 0, z: 21 } },
  ]);
  setHelicopter(state, 100, 18, 2, 'spotlight');
  if (state.helicopter) {
    state.helicopter.target = { x: 92, y: 0, z: 10 };
    const cone = state.helicopter.cone;
    if (cone && cone.position) {
      const coneHeight = (cone.geometry && cone.geometry.parameters && cone.geometry.parameters.height) || 60;
      const heliTop = { x: 100, y: 18, z: 2 };
      const coneBase = { x: 92, y: 0, z: 10 };
      const axisLen = Math.hypot(heliTop.x - coneBase.x, heliTop.y - coneBase.y, heliTop.z - coneBase.z);
      const axis = new THREE.Vector3(
        (heliTop.x - coneBase.x) / axisLen,
        (heliTop.y - coneBase.y) / axisLen,
        (heliTop.z - coneBase.z) / axisLen,
      );
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis);
      cone.position.set((heliTop.x + coneBase.x) / 2, (heliTop.y + coneBase.y) / 2, (heliTop.z + coneBase.z) / 2);
      cone.scale.set(0.6, axisLen / coneHeight, 0.6);
      cone.visible = true;
    }
    const pool = state.helicopter.pool;
    if (pool && pool.position) {
      pool.position.set(92, 0.1, 10);
      pool.scale.set(0.6, 0.6, 1);
      pool.visible = true;
    }
    const spot = state.helicopter.spot;
    if (spot && spot.position) {
      spot.position.set(100, 18, 2);
      if (spot.target && spot.target.position) spot.target.position.set(92, 0, 10);
    }
  }
  if (state.radio) {
    state.radio.index = 0;
    state.radio.trackIndex = 0;
    state.radio.trackTime = 96;
    state.radio.playing = true;
  }
  if (state.audio) {
    state.audio.radioStation = 'pantai';
    state.audio.radioTrack = 'Senja di Teluk';
  }
  showBanner(state, 'HELIKOPTER POLISI DI ATAS!');
  showDialog(state, 'Dimas', 'Lepas helikopter itu dulu sebelum ke garasi! Ganti mobil, ganti warna, apa saja! (Enter — lanjut)');
  aimCamera(state, [92, 8, 38], [92, 2, -12]);
}

function stageShootout(state) {
  state.phase = 'playing';
  state.seed = FIXED_SEED;
  state.rain = true;
  state.weather = 'rain';
  setCash(state, 18325);
  setClock(state, 21, 46, 1);
  state.wanted = 3;
  state.shells = 0;
  state.playTime = 47;
  if (!state.reputation) state.reputation = {};
  state.reputation.points = 120;
  state.reputation.tier = 'Anak Baru';
  state.reputation.level = 1;
  if (!state.stats) state.stats = {};
  state.stats.carsStolen = 4;
  state.stats.takedowns = 1;
  state.stats.escapes = 0;
  if (!state.player) state.player = {};
  state.player.hp = 84;
  state.player.health = 84;
  state.player.armor = 0;
  state.player.weaponIndex = 1;
  if (!state.combat) state.combat = {};
  state.combat.pistolAmmo = 5;
  state.combat.pistolReserve = 48;
  state.combat.shotgunAmmo = 0;
  state.combat.shotgunReserve = 0;
  state.combat.selected = 1;
  state.combat.killsThisMission = 1;
  state.combat.weapons = [
    { slot: 1, name: 'Tinju', ammo: null, reserve: null },
    { slot: 2, name: 'Pistol', ammo: 5, reserve: 48 },
    { slot: 3, name: 'SG', ammo: 0, reserve: 0 },
  ];
  putPlayerOnFoot(state);
  placePlayer(state, 46, 118, Math.PI);
  state.missionTarget = { x: 52, z: 128 };
  state.objective = 'Habisi bos geng dan 5 pengawalnya — 1/6 dikalahkan';
  if (state.missions) {
    state.missions.current = 10;
    state.missions.stage = 0;
    state.missions.done = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    state.missions.dialogOpen = false;
  }
  if (!state.combat.enemies) state.combat.enemies = [];
  const gangSpots = [
    { x: 44, z: 138 },
    { x: 52, z: 140 },
    { x: 60, z: 138 },
    { x: 48, z: 146 },
    { x: 56, z: 146 },
  ];
  state.combat.enemies = state.combat.enemies.filter((foe) => foe && foe.group);
  while (state.combat.enemies.length < 5) {
    const at = gangSpots[state.combat.enemies.length];
    spawnEnemies(state, 1, { x: at.x, z: at.z }, 'gang');
  }
  for (let i = 0; i < 5; i++) {
    const spot = gangSpots[i];
    const foe = state.combat.enemies[i];
    foe.group.position.set(spot.x, 0, spot.z);
    foe.heading = Math.atan2(46 - spot.x, 118 - spot.z);
    foe.health = 100;
    foe.maxHealth = 100;
    foe.dead = false;
    foe.fallTimer = 0;
    foe.group.visible = true;
  }
  if (state.combat.enemies[0]) {
    state.combat.enemies[0].kind = 'boss';
    state.combat.enemies[0].boss = true;
  }
  setPoliceUnits(state, [
    { name: 'GARUDA-1', type: 'heli', status: 'SPOTLIGHT', distance: 14, position: { x: 46, y: 42, z: 100 } },
    { name: 'KAKATUA-31', type: 'car', status: 'PURSUIT', distance: 30, position: { x: 30, y: 0, z: 122 } },
    { name: 'CENDRAWASIH-07', type: 'car', status: 'PURSUIT', distance: 21, position: { x: 60, y: 0, z: 124 } },
    { name: 'GARUDA-02', type: 'car', status: 'PENGEJARAN', distance: 24, position: { x: 36, y: 0, z: 130 } },
    { name: 'MERAK-09', type: 'foot', status: 'PURSUIT', distance: 33, position: { x: 42, y: 0, z: 112 } },
  ]);
  setHelicopter(state, 46, 42, 100, 'spotlight');
  if (state.helicopter) {
    state.helicopter.target = { x: 46, y: 0, z: 118 };
  }
  if (state.radio) {
    state.radio.index = 0;
    state.radio.trackIndex = 0;
    state.radio.trackTime = 40;
    state.radio.playing = true;
  }
  if (state.audio) {
    state.audio.radioStation = 'pantai';
    state.audio.radioTrack = 'Senja di Teluk';
  }
  showBanner(state, 'M10 — Raja Teluk');
  showDialog(state, 'Bu Sari', 'Ini puncaknya, Raka. Bos geng dan pengawalnya berkumpul di gudang. Habisi mereka, lalu pergi dari pelabuhan — Teluk Cerah jadi milikmu. (Enter — lanjut)');
  aimCamera(state, [46, 3.4, 110], [50, 1.6, 138]);
}

function stageMap(state) {
  state.phase = 'map';
  state.seed = FIXED_SEED;
  setCash(state, 48250);
  setClock(state, 22, 57, 3);
  state.wanted = 0;
  state.shells = 9;
  state.playTime = 3 * 60 + 47;
  if (!state.reputation) state.reputation = {};
  state.reputation.points = 1960;
  state.reputation.tier = 'Raja Jalanan';
  state.reputation.level = 4;
  if (!state.stats) state.stats = {};
  state.stats.carsStolen = 38;
  state.stats.takedowns = 61;
  state.stats.escapes = 13;
  if (state.missions) {
    state.missions.current = 9;
    state.missions.stage = 0;
    state.missions.done = [1, 2, 3, 4, 5, 6, 7, 8];
    state.missions.dialogOpen = false;
  }
  placePlayer(state, 40, 30, 0);
  state.missionTarget = { x: 78, z: 132 };
  state.objective = 'Heist Pelabuhan — masuk lewat pintu belakang gudang kontainer';
  showMap(state, true);
}

function stageTitle(state) {
  state.phase = 'title';
  state.seed = FIXED_SEED;
  setCash(state, 14830);
  setClock(state, 20, 15, 3);
  state.wanted = 0;
  state.shells = 7;
  state.playTime = 2 * 60 + 40;
  // Kotak LANJUTKAN di layar judul memakai ringkasan staging ini, bukan
  // localStorage, agar shot selalu menampilkan nilai spesifikasi.
  state.titleContinue = { mission: 7, cash: 14830, day: 3, rep: 'Pembalap Teluk', repLevel: 3, shells: 7 };
  if (!state.reputation) state.reputation = {};
  state.reputation.points = 640;
  state.reputation.tier = 'Pembalap Teluk';
  state.reputation.level = 3;
  if (!state.stats) state.stats = {};
  state.stats.carsStolen = 21;
  state.stats.takedowns = 34;
  state.stats.escapes = 7;
  if (state.missions) {
    state.missions.current = 7;
    state.missions.stage = 0;
    state.missions.done = [1, 2, 3, 4, 5, 6];
    state.missions.dialogOpen = false;
  }
  placePlayer(state, 20, 40, Math.PI);
  state.missionTarget = null;
  showTitle(state);
  aimCamera(state, [20, 4, 56], [20, 2, 20]);
}

export function stageShot(state, name) {
  const shot = (name || 'title').toLowerCase();
  if (!SHOT_NAMES.includes(shot)) return false;
  state.shot = shot;
  if (shot !== 'title') state.titleContinue = null;
  showMap(state, false);
  hideTitle(state);
  if (shot === 'chase') stageChase(state);
  else if (shot === 'shootout') stageShootout(state);
  else if (shot === 'map') stageMap(state);
  else stageTitle(state);
  return true;
}

export function applyShotFromAddress(state) {
  let shot = null;
  try {
    const params = new URLSearchParams(window.location.search);
    shot = params.get('shot');
  } catch (err) {
    shot = null;
  }
  if (!shot) {
    try {
      const match = window.location.hash.match(/shot=([a-z]+)/);
      if (match) shot = match[1];
    } catch (err) { /* abaikan */ }
  }
  if (shot && SHOT_NAMES.includes(shot.toLowerCase())) {
    return stageShot(state, shot.toLowerCase());
  }
  return stageShot(state, 'title');
}

export function shotNames() {
  return SHOT_NAMES.slice();
}
