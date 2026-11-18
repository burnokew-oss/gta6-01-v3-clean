// Boot + loop Teluk Cerah 3D. Game state (G) dibuat di sini dan dibagikan
// ke semua modul; stepGame() adalah satu-satunya jalan memajukan simulasi,
// dipakai loop nyata maupun scene screenshot deterministik.
//
// ?seed=N mengganti seed kota. ?shot=1|2|3|4 men-stage scene lalu melukisnya
// dan menyetel window.__shotReady untuk screenshot.
import { STEP, MISSION_DEFS, SHELL_COUNT } from './config.js';
import { createRandom } from './random.js';
import { createInput, ACTION_CONFIRM, ACTION_PAUSE, ACTION_RELOAD, ACTION_MUTE, ACTION_MAP, ACTION_TAXI, ACTION_RAMPAGE } from './input.js';
import { createCity, createShells } from './city.js';
import { createPlayer, updatePlayer } from './player.js';
import { spawnTraffic, spawnParked, spawnLoanerCar, updateVehicles } from './vehicles.js';
import { spawnPeds, updatePeds } from './pedestrians.js';
import { updatePolice } from './police.js';
import { fireWeapon, reloadWeapon, updateCombat } from './combat.js';
import { createMissionState, startMission, updateMissions, onMissionEvent, startTaxi, startRampage } from './missions.js';
import { updateShops, buyShopItem } from './shops.js';
import { createRenderer } from './render.js';
import { createHud, SCREEN_TITLE, SCREEN_PLAY, SCREEN_PAUSED, SCREEN_OVER, SCREEN_MAP } from './hud.js';
import { createAudio } from './audio.js';
import { readSave, writeSave } from './save.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const hud = createHud();
const audio = createAudio();

const G = {
  seed, rng: createRandom(seed), city: null,
  time: 0, clock: 8 * 60, day: 1,
  player: null, vehicles: [], peds: [], cops: [], enemies: [],
  bullets: [], particles: [], cashFloaters: [],
  wanted: 0, hiddenTimer: 0, roadblock: null,
  heli: null, shop: null, nosBoost: false, radioToast: null, saveNow: false,
  coverStrip: null, muzzleFlash: 0,
  rain: false,
  rep: 0, copNameSeq: 0, playSeconds: 0,
  stats: { missionsDone: 0, takedowns: 0, carsStolen: 0, escapes: 0, shells: 0 },
  shells: [],
  mission: createMissionState(), missionDefs: MISSION_DEFS,
  viewW: window.innerWidth, viewH: window.innerHeight,
  shake: 0, flashRed: 0, shotsFiredTimer: 0,
  events: [], screen: SCREEN_TITLE,
  titleSave: null, titleFixed: false, overTitle: '', overText: '',
  aimPoint: null,
  input, audio,
};

function resetWorld() {
  G.rng = createRandom(G.seed);
  G.city = createCity(G.rng);
  G.time = 0;
  G.clock = 8 * 60;
  G.day = 1;
  G.player = createPlayer(-88, 46); // rumah Raka, Marina barat
  G.vehicles = [];
  G.peds = [];
  G.cops = [];
  G.enemies = [];
  G.bullets = [];
  G.particles = [];
  G.cashFloaters = [];
  G.wanted = 0;
  G.hiddenTimer = 0;
  G.roadblock = null;
  G.heli = null;
  G.shop = null;
  G.nosBoost = false;
  G.radioToast = null;
  G.saveNow = false;
  G.coverStrip = null;
  G.muzzleFlash = 0;
  G.rain = false;
  G.mission = createMissionState();
  G.shake = 0;
  G.flashRed = 0;
  G.shotsFiredTimer = 0;
  G.events = [];
  G.rep = 0;
  G.copNameSeq = 0;
  G.playSeconds = 0;
  G.stats = { missionsDone: 0, takedowns: 0, carsStolen: 0, escapes: 0, shells: 0 };
  G.shells = createShells(G.rng);
  G.titleSave = readSave(0);
  G.overTitle = '';
  G.overText = '';
  spawnLoanerCar(G);
  spawnTraffic(G, 12);
  spawnParked(G, 10);
  spawnPeds(G, 36);
}
G.resetWorld = resetWorld;

function snapshot() {
  const p = G.player;
  return {
    cash: p.cash, health: p.health, armor: p.armor,
    x: p.x, z: p.z, weapon: p.weapon,
    ammo: p.ammo, ammoInMag: p.ammoInMag,
    missionIndex: G.mission.index, missionStarted: G.mission.started,
    wanted: G.wanted, clock: G.clock, day: G.day,
    rep: G.rep, shells: G.stats.shells, upgrades: p.upgrades,
    playSeconds: G.playSeconds, stats: G.stats,
  };
}

function applySnapshot(s) {
  const p = G.player;
  p.cash = s.cash;
  p.health = s.health;
  p.armor = s.armor;
  p.x = s.x;
  p.z = s.z;
  p.weapon = s.weapon || 'fist';
  p.ammo = s.ammo || p.ammo;
  p.ammoInMag = s.ammoInMag || p.ammoInMag;
  G.wanted = s.wanted || 0;
  G.clock = s.clock || 8 * 60;
  G.day = s.day || 1;
  G.rep = s.rep || 0;
  G.playSeconds = s.playSeconds || 0;
  if (s.stats) G.stats = { ...G.stats, ...s.stats };
  if (s.upgrades) {
    p.upgrades = s.upgrades;
    p.engineLevel = s.upgrades.engine ? 1 : 0;
    p.nosMax = s.upgrades.nitro ? 200 : 100;
  }
  if (s.missionIndex >= 0 && s.missionIndex < MISSION_DEFS.length) {
    startMission(G, s.missionIndex);
    if (!s.missionStarted) G.mission.started = false;
  }
}

function drainEvents() {
  while (G.events.length) {
    const ev = G.events.shift();
    onMissionEvent(G, ev);
    if (ev === 'wasted') {
      G.screen = SCREEN_OVER;
      G.overTitle = 'WASTED';
      G.overText = 'Dirawat di rumah sakit — uang dipotong 10%.';
    }
    if (ev === 'busted') {
      G.screen = SCREEN_OVER;
      G.overTitle = 'BUSTED';
      G.overText = 'Ditahan polisi — denda dibayar.';
    }
  }
}

function stepGame(dt) {
  G.time += dt;
  G.clock += dt * 3; // 1 hari game = 8 menit nyata
  if (G.clock >= 1440) { G.clock -= 1440; G.day += 1; }
  const { actions, digit } = input.takeActions();

  if (G.screen === SCREEN_TITLE) {
    updateVehicles(G, dt);
    updatePeds(G, dt);
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      audio.startMusic();
      G.screen = SCREEN_PLAY;
      announce('Teluk Cerah. Temui Bu Sari — tekan Enter untuk mulai misi pertama.');
    }
    return;
  }
  if (G.screen === SCREEN_OVER) {
    if (actions & ACTION_CONFIRM) {
      G.screen = SCREEN_PLAY;
      G.mission.dialog = null;
    }
    return;
  }
  if (G.screen === SCREEN_PAUSED) {
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) G.screen = SCREEN_PLAY;
    return;
  }
  if (G.screen === SCREEN_MAP) {
    // Peta: dunia beku; M / Esc / Enter kembali main.
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM | ACTION_MAP)) G.screen = SCREEN_PLAY;
    return;
  }

  // --- layar play ---
  G.playSeconds += dt;
  if (actions & ACTION_PAUSE) { G.screen = SCREEN_PAUSED; announce('Paused.'); return; }
  if (actions & ACTION_MUTE) audio.setMuted(!audio.isMuted());
  if (actions & ACTION_MAP) { G.screen = SCREEN_MAP; announce('Peta Teluk Cerah.'); return; }
  // R: reload saat jalan kaki, ganti stasiun radio saat nyetir.
  if (actions & ACTION_RELOAD) {
    if (G.player.onFoot) reloadWeapon(G);
    else {
      const name = audio.cycleStation();
      G.radioToast = { text: name, timer: 2.5 };
    }
  }
  if (G.radioToast) {
    G.radioToast.timer -= dt;
    if (G.radioToast.timer <= 0) G.radioToast = null;
  }

  // Taksi (T) / Rampage (G) — sekali tekan.
  if (actions & ACTION_TAXI) startTaxi(G);
  if (actions & ACTION_RAMPAGE) startRampage(G);

  // Enter: dialog dulu, lalu mulai misi berikutnya.
  const m = G.mission;
  if (actions & ACTION_CONFIRM) {
    if (m.dialog && m.dialog.shown < m.dialog.text.length) {
      m.dialog.shown = m.dialog.text.length;
    } else if (m.dialog) {
      m.dialog = null;
    } else if (!m.started && m.index >= 0) {
      startMission(G, m.index);
    }
  }

  // Tombol angka: beli di toko, atau ganti senjata.
  if (digit >= 1 && digit <= 5) {
    if (G.shop) buyShopItem(G, digit - 1);
    else if (digit === 1) G.player.weapon = 'fist';
    else if (digit === 2 && (G.player.ammo.pistol + G.player.ammoInMag.pistol) > 0) G.player.weapon = 'pistol';
    else if (digit === 3 && (G.player.ammo.shotgun + G.player.ammoInMag.shotgun) > 0) G.player.weapon = 'shotgun';
  }

  // Tembak (klik kiri tahan).
  if (G.player.onFoot && input.mouse.down) fireWeapon(G);

  updatePlayer(G, dt, input, actions);
  updateVehicles(G, dt);
  updatePeds(G, dt);
  updatePolice(G, dt);
  updateCombat(G, dt);
  updateMissions(G, dt);
  updateShops(G);
  drainEvents();
  // Safehouse: beli "sembuh + save" menulis slot 1.
  if (G.saveNow) {
    G.saveNow = false;
    writeSave(0, snapshot());
    G.titleSave = readSave(0);
    announce('Disimpan di safehouse (slot 1).');
  }

  // Taksi: jemput lalu antar.
  if (m.taxi) {
    const t = m.taxi;
    if (t.state === 'pickup' && Math.hypot(G.player.x - t.px, G.player.z - t.pz) < 5) {
      t.state = 'dropoff';
      const a = G.rng.range(0, Math.PI * 2);
      t.dx = Math.max(-110, Math.min(110, G.player.x + Math.sin(a) * 70));
      t.dz = Math.max(-110, Math.min(110, G.player.z + Math.cos(a) * 70));
      t.fare = 60 + G.rng.int(0, 80);
      m.objective = `Taksi: antar penumpang (bayaran $${t.fare})`;
    } else if (t.state === 'dropoff' && Math.hypot(G.player.x - t.dx, G.player.z - t.dz) < 6) {
      G.player.cash += t.fare;
      m.banner = `TAKSI SELESAI  +$${t.fare}`;
      m.bannerTimer = 0;
      m.taxi = null;
      m.objective = m.started ? MISSION_DEFS[m.index].steps[m.step].text : 'Tekan Enter untuk misi berikutnya';
    }
  }

  if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 30);
  if (G.flashRed > 0) G.flashRed = Math.max(0, G.flashRed - dt * 1.5);
  for (let i = G.cashFloaters.length - 1; i >= 0; i -= 1) {
    G.cashFloaters[i].life -= dt;
    if (G.cashFloaters[i].life <= 0) G.cashFloaters.splice(i, 1);
  }
}
G.stepGame = stepGame;
G.startMission = (i) => startMission(G, i); // hook playtest: mulai misi ke-i tanpa main manual

function announce(message) {
  status.textContent = message;
}

function drawFrame() {
  G.viewW = window.innerWidth;
  G.viewH = window.innerHeight;
  renderer.draw(G);
  hud.update(G);
}

function runShot(name) {
  stageShot(name, G);
  renderer.snapCamera();
  let painted = 0;
  function paint() {
    drawFrame();
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let accumulator = 0;
  let last = performance.now();
  let fpsFrames = 0;
  let fpsStart = performance.now();
  window.__fps = 0;
  // L: load save dari title. S/Q di pause.
  window.addEventListener('keydown', (e) => {
    if (G.screen === SCREEN_TITLE && e.code === 'KeyL') {
      const s = readSave(0);
      if (s) {
        applySnapshot(s);
        G.screen = SCREEN_PLAY;
        announce('Save dimuat. Lanjutkan!');
      }
    }
    if (G.screen === SCREEN_PAUSED && e.code === 'KeyS') {
      const ok = writeSave(0, snapshot());
      G.titleSave = readSave(0);
      announce(ok ? 'Disimpan ke slot 1.' : 'Gagal menyimpan.');
    }
    if (G.screen === SCREEN_PAUSED && e.code === 'KeyQ') {
      G.screen = SCREEN_TITLE;
      resetWorld();
      renderer.snapCamera();
    }
  });

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    while (accumulator >= STEP) {
      stepGame(STEP);
      accumulator -= STEP;
    }
    drawFrame();
    fpsFrames += 1;
    if (now - fpsStart >= 3000) {
      window.__fps = Math.round((fpsFrames / (now - fpsStart)) * 1000);
      fpsFrames = 0;
      fpsStart = now;
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && G.screen === SCREEN_PLAY) G.screen = SCREEN_PAUSED;
  });

  announce('Teluk Cerah. Tekan Enter untuk mulai.');
  requestAnimationFrame(frame);
}

resetWorld();
window.__game = G;
window.__renderer = renderer; // hook debug: inspeksi scene
window.__shotReady = false;

if (!renderer.webglOK) {
  document.getElementById('fallback').classList.remove('hidden');
  document.getElementById('hud').classList.add('hidden');
} else if (shot) {
  runShot(shot);
} else {
  runGame();
}
