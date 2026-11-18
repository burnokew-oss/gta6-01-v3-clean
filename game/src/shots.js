// Scene deterministik di balik ?shot=1|2|3|4 — chase MALAM NEON + HUJAN,
// shootout, peta, title. Tiap scene memainkan aturan sungguhan maju
// beberapa detik dari seed tetap, jadi frame yang tertangkap adalah
// tampilan game yang sebenarnya, bukan mockup.
import { STEP } from './config.js';
import { makeVehicle, spawnParked, spawnTraffic } from './vehicles.js';
import { spawnPeds } from './pedestrians.js';
import { addWanted } from './police.js';
import { startMission } from './missions.js';
import { writeSave } from './save.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_MAP } from './hud.js';

function simulate(G, seconds, drive, nos) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (drive) G.input.keys.up = true;
    if (nos) G.input.keys.run = true;
    G.stepGame(STEP);
    if (drive) G.input.keys.up = false;
    if (nos) G.input.keys.run = false;
  }
}

// Profil progres "save jauh" untuk shot chase/peta: uang besar, Rep
// tier 4, statistik hidup — seperti rank atas yang memotret dari save
// lanjutan.
function stageProgress(G) {
  G.player.cash = 48250;
  G.rep = 1960;
  G.stats = { missionsDone: 8, takedowns: 61, carsStolen: 38, escapes: 13, shells: 9 };
  G.playSeconds = 3 * 3600 + 47 * 60;
  G.day = 3;
}

function placeCopCar(G, dx, dz, angle, name, status) {
  const v = makeVehicle(G.rng, 'police', G.player.x + dx, G.player.z + dz, angle);
  v.ai = null;
  v.name = name;
  v.status = status;
  v.dist = Math.round(Math.hypot(dx, dz));
  v.speed = 14;
  G.vehicles.push(v);
  return v;
}

export function stageShot(name, G) {
  document.body.classList.add('shot-mode');
  G.resetWorld();
  G.clock = 10 * 60;
  G.day = 1;
  if (name === '1') {
    // CHASE (hero shot): MALAM NEON + HUJAN 22:47, wanted 4, heli +
    // spotlight, polisi bernama dekat, M5 tahap kabur, dialog Dimas,
    // NOS, speedometer 172 km/j. Kamera chase rendah + dekat: hampir
    // setinggi atap mobil, hero ~35-40% lebar frame di tengah.
    G.clock = 22 * 60 + 47;
    G.rain = true;
    stageProgress(G);
    G.stats.missionsDone = 4;
    const car = makeVehicle(G.rng, 'sport', 84, 12, -Math.PI / 2);
    car.color = 0xd42a2a;
    G.vehicles.push(car);
    G.player.vehicle = car;
    G.player.onFoot = false;
    car.driver = G.player;
    G.player.x = car.x;
    G.player.z = car.z;
    G.player.angle = car.angle;
    spawnTraffic(G, 8);
    spawnParked(G, 6);
    spawnPeds(G, 20);
    G.screen = SCREEN_PLAY;
    G.coverStrip = '10 STORY MISSIONS · HELICOPTER CHASES · POLICE RESPONSE · RADIO 3 STATIONS · GARAGE UPGRADES · 3 SAVE SLOTS · 24 SHELLS';
    startMission(G, 4);
    simulate(G, 0.8, false);
    car.x = 60;
    car.z = 12;
    car.angle = -Math.PI / 2;
    car.speed = 20;
    G.player.x = car.x;
    G.player.z = car.z;
    G.player.angle = car.angle;
    G.mission.dialog = {
      speaker: 'Dimas',
      text: 'Lepas helikopter itu dulu sebelum ke garasi! Ganti mobil, ganti warna, apa saja!',
      shown: 0,
    };
    G.mission.dialog.shown = G.mission.dialog.text.length;
    simulate(G, 2.6, true, true);
    G.peds = G.peds.filter((ped) => Math.hypot(ped.x - G.player.x, ped.z - G.player.z) > 8);
    const copSpots = [[-14, -6], [-18, 6], [-8, -7], [-24, -3]];
    G.cops.forEach((c, i) => {
      const spot = copSpots[i % copSpots.length];
      c.x = G.player.x + spot[0];
      c.z = G.player.z + spot[1];
      c.dist = Math.round(Math.hypot(spot[0], spot[1]));
    });
    G.wanted = 4;
    G.cops.splice(4);
    car.speed = 21.5; // 172 km/j di speedometer
    if (G.heli) {
      // Heli di depan-atas dalam frame: bodi + kerucut sorot tajam
      // terlihat tanpa menutupi mobil hero.
      G.heli.x = G.player.x - 16;
      G.heli.z = G.player.z + 1;
      G.heli.y = 10;
    }
    for (const v of G.vehicles) {
      if (v.type === 'police') v.dead = true;
    }
    G.vehicles = G.vehicles.filter((v) => !v.dead);
    G.vehicles = G.vehicles.filter((v) => v === car || v.type === 'police' || Math.hypot(v.x - car.x, v.z - car.z) > 12);
    // Polisi DEKAT di depan kanan-kiri hero (8-14 unit): bar lampu
    // besar terbaca, bukan kotak putih jauh.
    placeCopCar(G, -9.5, 3.2, -Math.PI / 2, 'CENDRAWASIH-07', 'PURSUIT');
    placeCopCar(G, -11.5, -3.4, -Math.PI / 2, 'JALAK-42', 'RAMMING');
    placeCopCar(G, -16, 0.8, -Math.PI / 2, 'BANGAU-18', 'PURSUIT');
    placeCopCar(G, -9, -4.4, -Math.PI / 2, 'ELANG-11', 'PURSUIT');
    const dlg = document.getElementById('dialog');
    if (dlg) dlg.style.bottom = '10px';
    // Kamera chase ronde 3: lebih rendah + rapat — hampir setinggi
    // atap, hero ~35-40% lebar frame di tengah, jalan lurus ke titik
    // hilang, neon di kedua sisi.
    G.shotCam = {
      px: car.x + 6.4, py: 2.25, pz: car.z + 0.9,
      lx: car.x - 11, ly: 0.9, lz: car.z - 0.6,
    };
    return { screen: SCREEN_PLAY };
  }
  if (name === '2') {
    // SHOOTOUT: M10 MALAM NEON + HUJAN di gudang pelabuhan — jalan
    // basah memantulkan neon, musuh bertanda merah, helikopter +
    // tembakan.
    G.clock = 21 * 60 + 42;
    G.rain = true;
    G.player.x = 78;
    G.player.z = 100;
    G.player.weapon = 'pistol';
    G.player.ammoInMag.pistol = 12;
    G.player.ammo.pistol = 48;
    G.player.cash = 18300;
    G.rep = 1200;
    spawnPeds(G, 24);
    spawnParked(G, 4);
    startMission(G, 9);
    G.mission.dialog.shown = G.mission.dialog.text.length;
    addWanted(G, 3);
    G.screen = SCREEN_PLAY;
    G.enemies.forEach((en, i) => {
      en.x = G.player.x - 6 - i * 4;
      en.z = G.player.z + (i % 2) * 3 - 1;
    });
    const e = G.enemies[0];
    if (e) G.aimOverride = { x: e.x, z: e.z };
    G.input.mouse.down = true;
    simulate(G, 1.5, false);
    G.input.mouse.down = false;
    G.enemies.forEach((en, i) => {
      en.x = G.player.x - 5 - i * 2.2;
      en.z = G.player.z - 3.5 + (i % 2) * 2;
    });
    const e0 = G.enemies[0];
    if (e0) {
      G.aimOverride = { x: e0.x, z: e0.z };
      G.player.aimAngle = Math.atan2(e0.x - G.player.x, e0.z - G.player.z);
      G.player.angle = G.player.aimAngle;
    }
    const a = G.player.angle;
    const fx = Math.sin(a);
    const fz = Math.cos(a);
    const rx = -Math.cos(a);
    const rz = Math.sin(a);
    // Kamera on-foot ronde 3: lebih dekat + rendah — pemain besar
    // kiri-tengah (~35% tinggi frame), musuh di kanan.
    G.shotCam = {
      px: G.player.x - fx * 4.4 + rx * 2.0,
      py: 2.1,
      pz: G.player.z - fz * 4.4 + rz * 2.0,
      lx: G.player.x + fx * 8 + rx * 2.4,
      ly: 0.6,
      lz: G.player.z + fz * 8 + rz * 2.4,
    };
    // Flash + tracer PERSISTEN sampai __shotReady: mode ?shot= tidak
    // menjalankan stepGame lagi, jadi nilai ini tidak decay sebelum
    // frame tertangkap.
    G.muzzleFlash = 5;
    if (e0) {
      const mx = G.player.x + fx * 1.4;
      const mz = G.player.z + fz * 1.4;
      G.bullets.push({ x: e0.x, z: e0.z, px: mx, pz: mz, angle: a, speed: 0, life: 99, from: 'player' });
      G.flashTarget = { x: e0.x, z: e0.z };
    }
    if (G.heli) {
      G.heli.x = G.player.x - 12;
      G.heli.z = G.player.z - 8;
      G.heli.y = 12;
    }
    return { screen: SCREEN_PLAY };
  }
  if (name === '3') {
    // MAP: peta kota + daftar misi DONE/ACTIVE/LOCKED + statistik +
    // legenda, palet malam neon.
    G.clock = 22 * 60 + 47;
    stageProgress(G);
    G.mission.index = 8;
    G.mission.started = true;
    G.mission.step = 0;
    G.mission.objective = 'Habisi 5 penjaga brankas pelabuhan';
    G.player.x = 0;
    G.player.z = 0;
    G.shells.forEach((s, i) => { s.taken = i < 9; });
    G.screen = SCREEN_MAP;
    return { screen: SCREEN_MAP };
  }
  // '4': TITLE — kota MALAM NEON + HUJAN di belakang logo: mobil hero
  // + Raka di tengah orbit, logo gradasi + kru + Continue.
  G.clock = 21 * 60;
  G.rain = true;
  G.titleFixed = true;
  const hero = makeVehicle(G.rng, 'sport', 8, 24, -Math.PI / 2);
  hero.color = 0xd42a2a;
  G.vehicles.push(hero);
  G.player.x = 7.5;
  G.player.z = 25.5;
  G.player.angle = 0.2;
  G.player.onFoot = true;
  writeSave(0, {
    cash: 14830, health: 82, armor: 64, x: 0, z: 0,
    weapon: 'pistol', ammo: { pistol: 48, shotgun: 12 }, ammoInMag: { pistol: 12, shotgun: 6 },
    missionIndex: 6, missionStarted: false, wanted: 0,
    clock: 16 * 60 + 29, day: 3, rep: 1092, shells: 7,
    upgrades: {}, playSeconds: 2 * 3600 + 31 * 60,
    stats: { missionsDone: 6, takedowns: 34, carsStolen: 21, escapes: 6, shells: 7 },
  });
  G.titleSave = {
    cash: 14830, missionIndex: 6, day: 3, rep: 1092, shells: 7,
  };
  simulate(G, 4, false);
  G.screen = SCREEN_TITLE;
  return { screen: SCREEN_TITLE };
}
