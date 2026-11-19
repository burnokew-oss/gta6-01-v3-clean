import 'three';
const THREE = window.THREE;
import { showDialog, showBanner, showMap, hideTitle, showTitle } from './hud.js';
import { ensureTraffic } from './vehicles.js';
import { ensurePedestrians } from './pedestrians.js';

const WEST = -Math.PI / 2;

function heroSportCar(state) {
  ensureTraffic(state, 14);
  const cars = state.cars || [];
  let hero = null;
  for (const c of cars) {
    if (c.kind === 'sport') { hero = c; break; }
  }
  if (!hero && cars.length > 0) hero = cars[0];
  if (!hero) return null;
  hero.kind = 'sport';
  if (hero.paintMat) hero.paintMat.color.setHex(0xd81f2a);
  if (hero.maxSpeed !== undefined) hero.maxSpeed = 30;
  if (!hero.group.userData.plate) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f4f4';
    g.fillRect(0, 0, 256, 64);
    g.strokeStyle = '#222222';
    g.lineWidth = 5;
    g.strokeRect(3, 3, 250, 58);
    g.fillStyle = '#16224a';
    g.font = 'bold 36px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('TC RAKA', 128, 34);
    const tex = new THREE.CanvasTexture(c);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.24), new THREE.MeshBasicMaterial({ map: tex }));
    plate.position.set(0, 0.52, -2.39);
    plate.rotation.y = Math.PI;
    hero.group.add(plate);
    hero.group.userData.plate = plate;
  }
  return hero;
}

function placePlayerInCar(state, car, x, z, heading) {
  const player = state.player;
  if (!player || !car) return;
  if (player.car && player.car !== car && player.car.driver === player) player.car.driver = null;
  car.driver = player;
  player.car = car;
  player.onFoot = false;
  player.group.visible = false;
  car.heading = heading;
  car.angle = heading;
  car.group.rotation.y = heading;
  car.group.position.set(x, 0, z);
  player.group.position.copy(car.group.position);
  player.heading = heading;
  player.speed = car.speed || 0;
}

function placePlayerOnFoot(state, x, z, heading) {
  const player = state.player;
  if (!player) return;
  if (player.car) {
    player.car.driver = null;
    player.car = null;
  }
  player.onFoot = true;
  player.group.visible = true;
  player.group.position.set(x, 0, z);
  player.heading = heading;
  player.group.rotation.y = heading;
  player.speed = 0;
  player.speedKmh = 0;
}

function stageChase(state) {
  ensureTraffic(state, 14);
  ensurePedestrians(state, 36);
  const hero = heroSportCar(state);
  if (hero) {
    hero.parked = false;
    hero.speed = 27.7;
    placePlayerInCar(state, hero, 40, 100, WEST);
  }
  const units = state.police || [];
  const spots = [
    [36.6, 104.6], [36.6, 95.4], [20, 97], [58, 103.5], [72, 96.5], [88, 103],
  ];
  let si = 0;
  for (const u of units) {
    if (u.car && si < spots.length) {
      const s = spots[si];
      si++;
      u.car.group.position.set(s[0], 0, s[1]);
      u.car.heading = WEST;
      u.car.group.rotation.y = WEST;
      u.car.speed = 24;
      u.distance = 5 + si * 4;
    }
  }
  const traffic = state.cars || [];
  const ahead = [[10, 96.5], [-16, 103.5], [-46, 96.5], [74, 103.5], [-78, 103.5]];
  let ti = 0;
  for (const car of traffic) {
    if (car === hero) continue;
    if (ti >= ahead.length) break;
    const s = ahead[ti];
    ti++;
    car.parked = false;
    car.group.position.set(s[0], 0, s[1]);
    car.heading = WEST;
    car.group.rotation.y = WEST;
    car.speed = 13 + ti * 1.5;
    car.segT = 0.5;
  }
  const peds = state.pedestrians || [];
  const pedSpots = [
    [60, 111, 1.57], [30, 89, -1.57], [-10, 111, 1.57], [-40, 89, -1.57],
    [80, 89, -1.57], [-70, 111, 1.57], [100, 111, 1.57], [-100, 89, -1.57],
  ];
  peds.forEach((p, i) => {
    const s = pedSpots[i % pedSpots.length];
    p.group.position.set(s[0], 0, s[1]);
    p.heading = s[2];
    p.group.rotation.y = s[2];
    p.mode = 'walk';
  });
  if (state.helicopter) {
    state.helicopter.group.position.set(34, 27, 112);
  }
  state.money = 48275;
  state.wanted = 4;
  state.hour = 18.67;
  state.day = 3;
  state.missionNum = 5;
  state.shells = 9;
  if (state.player) {
    state.player.health = 88;
    state.player.armor = 0;
    state.player.weaponIndex = 1;
    state.player.weapon = 1;
    if (state.player.ammo) { state.player.ammo.pistol = 12; state.player.ammo.shotgun = 0; }
    state.player.nos = 82;
  }
  if (hero) hero.condition = 88;
  state.hudOverride = {
    mission: {
      title: 'M5 \u2014 "Rampok Toko" TAHAP 2/2',
      next: 'NEXT: Kabur ke safehouse Perumahan (wanted 4)',
      reward: 'Hadiah $900 \u00b7 +150 REP',
    },
    objective: 'Kabur ke safehouse Perumahan (wanted 4)',
    radio: { station: 'Pantai FM', song: '"Senja di Teluk" \u00b7 Lagu Raya' },
  };
  showBanner(state, 'HELIKOPTER POLISI DI ATAS');
  showDialog(state, 'Dimas', 'Lepas helikopter itu dulu sebelum ke garasi! Ganti mobil, ganti warna, apa saja!');
}

function stageShootout(state) {
  ensureTraffic(state, 14);
  ensurePedestrians(state, 36);
  placePlayerOnFoot(state, 44, 330, Math.PI);
  const enemies = (state.combat && state.combat.enemies) || [];
  const spots = [[28, 300], [38, 296], [48, 302], [56, 297], [44, 290]];
  enemies.forEach((e, i) => {
    const s = spots[i % spots.length];
    e.group.position.set(s[0], 0, s[1]);
    e.heading = 0;
    e.group.rotation.y = 0;
    e.group.rotation.x = 0;
    e.alive = true;
    e.health = 100;
    if (e.marker) e.marker.visible = true;
  });
  if (state.combat) {
    state.combat.demoFire = true;
    state.combat.defeated = 1;
  }
  const units = state.police || [];
  let placed = false;
  for (const u of units) {
    if (u.car && !placed) {
      u.car.group.position.set(14, 0, 316);
      u.car.heading = Math.PI / 2;
      u.car.group.rotation.y = Math.PI / 2;
      u.car.speed = 0;
      placed = true;
    }
  }
  const traffic = state.cars || [];
  traffic.forEach((car, i) => {
    if (i === 0) { car.group.position.set(70, 0, 312); car.heading = Math.PI / 2; car.group.rotation.y = Math.PI / 2; car.parked = true; }
    if (i === 1) { car.group.position.set(-30, 0, 330); car.heading = -Math.PI / 2; car.group.rotation.y = -Math.PI / 2; car.parked = true; }
  });
  state.money = 18325;
  state.wanted = 3;
  state.hour = 19.6;
  state.day = 1;
  state.missionNum = 10;
  state.shells = 0;
  if (state.player) {
    state.player.health = 84;
    state.player.armor = 0;
    state.player.weaponIndex = 1;
    state.player.weapon = 1;
    if (state.player.ammo) { state.player.ammo.pistol = 5; state.player.ammo.shotgun = 0; }
  }
  state.hudOverride = {
    mission: {
      title: 'M10 \u2014 "Raja Teluk" TAHAP 1/2',
      next: 'NEXT: Habisi bos geng dan 5 pengawalnya',
      reward: 'Hadiah $2000 \u00b7 +300 REP',
    },
    objective: 'Habisi bos geng dan 5 pengawalnya \u2014 1/6 dikalahkan',
    radio: { station: 'Pantai FM', song: '"Senja di Teluk" \u00b7 Lagu Raya' },
  };
  showBanner(state, 'MISI 10 \u2014 RAJA TELUK');
  showDialog(state, 'Bu Sari', 'Ini puncaknya, Raka. Bos geng dan pengawalnya berkumpul di gudang. Habisi mereka, lalu pergi dari pelabuhan \u2014 Teluk Cerah jadi milikmu.');
}

function stageMap(state) {
  state.money = 48250;
  state.hour = 18.67;
  state.day = 3;
  state.missionNum = 9;
  state.shells = 9;
  state.hudOverride = {
    mission: {
      title: 'M9 \u2014 "Heist Pelabuhan" TAHAP 1/2',
      next: 'NEXT: Kumpulkan tim di gudang pelabuhan',
      reward: 'Hadiah $1200 \u00b7 +200 REP',
    },
    objective: 'Kumpulkan tim di gudang pelabuhan',
    radio: { station: 'Pantai FM', song: '"Senja di Teluk" \u00b7 Lagu Raya' },
  };
  showMap(state, true);
}

function stageTitle(state) {
  ensureTraffic(state, 14);
  const hero = heroSportCar(state);
  if (hero) {
    hero.parked = true;
    hero.speed = 0;
    hero.group.position.set(30, 0, 100);
    hero.heading = WEST;
    hero.group.rotation.y = WEST;
  }
  placePlayerOnFoot(state, 150, 190, WEST);
  const peds = state.pedestrians || [];
  peds.forEach((p, i) => {
    p.group.position.set(140 + (i % 6) * 8, 0, 220 + Math.floor(i / 6) * 10);
    p.mode = 'walk';
  });
  const units = state.police || [];
  for (const u of units) {
    if (u.car) {
      u.car.group.position.set(220, 0, 160 + Math.random() * 40);
      u.car.speed = 0;
    }
  }
  if (state.helicopter) {
    state.helicopter.group.visible = false;
    state.helicopter.pool.visible = false;
    state.helicopter.cone.visible = false;
  }
  state.money = 14830;
  state.hour = 18.5;
  state.day = 3;
  state.missionNum = 7;
  state.shells = 7;
  state.hudOverride = {
    mission: {
      title: 'M7 \u2014 "Kurir Malam" TAHAP 1/2',
      next: 'NEXT: Antar paket ke dermaga',
      reward: 'Hadiah $700 \u00b7 +120 REP',
    },
    objective: 'Antar paket ke dermaga',
    radio: { station: 'Pantai FM', song: '"Senja di Teluk" \u00b7 Lagu Raya' },
  };
  showTitle(state);
  showMap(state, false);
}

export function stageShot(state, name) {
  state.shotName = name;
  state.shotApplied = true;
  if (name === 'title') {
    stageTitle(state);
    return;
  }
  hideTitle(state);
  showMap(state, false);
  if (name === 'chase') stageChase(state);
  else if (name === 'shootout') stageShootout(state);
  else if (name === 'map') stageMap(state);
  else stageTitle(state);
}

export function applyShotFromAddress(state) {
  if (state.shotApplied) return;
  let name = 'title';
  try {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot === 'chase' || shot === 'shootout' || shot === 'map' || shot === 'title') name = shot;
  } catch (err) {
    name = 'title';
  }
  stageShot(state, name);
}
