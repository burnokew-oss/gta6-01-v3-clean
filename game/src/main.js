import * as THREE from 'three';
import { CONFIG } from './config.js';
import { makeRng } from './random.js';
import { buildCity } from './city.js';
import { createWorld, drawWorld, resizeWorld } from './render.js';
import { createInput } from './input.js';
import { createPlayer, updatePlayer, damagePlayer, bustPlayer, wastePlayer } from './player.js';
import { createTraffic, updateTraffic } from './vehicles.js';
import { createPedestrians, updatePedestrians } from './pedestrians.js';
import { createPolice, updatePolice } from './police.js';
import { createHelicopter, updateHelicopter } from './helicopter.js';
import { createCombat, updateCombat, switchWeapon } from './combat.js';
import { createMissions, updateMissions } from './missions.js';
import { createShops, updateShops } from './shops.js';
import { createRadio, updateRadio, nextStation } from './radio.js';
import { createAudio, playSound, setMuted } from './audio.js';
import { loadGame } from './save.js';
import { createHud, updateHud, showDialog, showBanner, showMap, hideTitle } from './hud.js';
import { applyShotFromAddress } from './shots.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

function readSeed() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('seed');
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) ? parsed : 1;
  } catch (err) {
    return 1;
  }
}

function updateCamera(state, dt) {
  const world = state.world;
  const player = state.player;
  if (!world || !world.camera || !player) return;
  const camera = world.camera;
  if (state.cameraMode === 'shot' || state.shotCamera) return;
  if (state.titleOpen) {
    const angle = (state.time || 0) * 0.05;
    const orbit = Math.min(1, dt * 1.2);
    camera.position.x += (Math.cos(angle) * 55 - camera.position.x) * orbit;
    camera.position.y += (24 - camera.position.y) * orbit;
    camera.position.z += (Math.sin(angle) * 55 - camera.position.z) * orbit;
    camera.lookAt(0, 4, 0);
    return;
  }
  const inCar = Boolean(player.car);
  const heading = inCar ? player.car.heading : (state.cameraYaw || 0);
  const backX = Math.sin(heading);
  const backZ = Math.cos(heading);
  const dist = inCar ? 13.5 : 10.5;
  const height = inCar ? 5.6 : 6.4;
  const target = player.position;
  const wantX = target.x + backX * dist;
  const wantY = height;
  const wantZ = target.z + backZ * dist;
  const smooth = Math.min(1, dt * (inCar ? 5 : 7));
  camera.position.x += (wantX - camera.position.x) * smooth;
  camera.position.y += (wantY - camera.position.y) * smooth;
  camera.position.z += (wantZ - camera.position.z) * smooth;
  const lookX = target.x - backX * 3.5;
  const lookY = 1.6;
  const lookZ = target.z - backZ * 3.5;
  const shake = state.combat?.shake || 0;
  const shakeX = (state.combat?.shakeX || 0) * shake;
  const shakeY = (state.combat?.shakeY || 0) * shake;
  camera.lookAt(lookX + shakeX, lookY + shakeY, lookZ);
}

export function boot() {
  const world = createWorld();
  const input = createInput(document);
  const rng = makeRng(readSeed());
  const city = buildCity(world.scene, rng);

  const state = {
    world,
    scene: world.scene,
    camera: world.camera,
    renderer: world.renderer,
    input,
    rng,
    city,
    config: CONFIG,
    worldSize: pickNumber([CONFIG?.worldSize, CONFIG?.world?.size, city?.size], 320),
    player: null,
    cars: [],
    peds: [],
    police: null,
    helicopter: null,
    combat: null,
    missions: null,
    shops: null,
    radio: null,
    audio: null,
    hud: null,
    clock: { hour: 20, minute: 0, day: 1 },
    cash: 500,
    reputation: { points: 0, tier: 1, level: 1 },
    wanted: 0,
    shells: 0,
    muted: false,
    paused: false,
    mapOpen: false,
    titleOpen: true,
    titleContinue: null,
    dialogOpen: false,
    phase: 'title',
    cameraYaw: Math.PI,
    cameraMode: 'follow',
    shotCamera: false,
    time: 0,
    playTime: 0,
    effects: [],
    shellSpots: [],
    stats: { carsStolen: 0, takedowns: 0, escapes: 0, wasted: 0, busted: 0 },
    ui: {},
    audioApi: {},
    playerApi: {},
    policeApi: {},
    combatApi: {},
    radioApi: {},
    pedsApi: {},
  };

  state.ui = {
    banner: (text) => showBanner(state, text),
    dialog: (name, text) => showDialog(state, name, text),
    map: (open) => showMap(state, open),
  };
  state.audioApi = {
    play: (name) => playSound(state, name),
    setMuted: (muted) => setMuted(state, muted),
  };
  state.playerApi = { damagePlayer, bustPlayer, wastePlayer };
  state.radioApi = { nextStation: (st) => nextStation(st) };

  createAudio(state);
  createPlayer(state);
  createTraffic(state, pickNumber([CONFIG?.traffic?.count, CONFIG?.trafficCount], 16));
  createPedestrians(state, pickNumber([CONFIG?.pedestrians?.count, CONFIG?.pedCount], 40));
  createPolice(state);
  createHelicopter(state);
  createCombat(state);
  createMissions(state);
  createShops(state);
  createRadio(state);
  createHud(state);

  state.cameraYaw = (state.player?.heading || 0) + Math.PI;

  applyShotFromAddress(state);

  try {
    window.__tc = state;
  } catch (err) {
    /* debug handle unavailable */
  }

  window.addEventListener('resize', () => resizeWorld(world));
  window.addEventListener('blur', () => {
    if (!state.titleOpen && !state.mapOpen) state.paused = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !state.titleOpen && !state.mapOpen) state.paused = true;
  });

  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const rawDt = (now - last) / 1000;
    last = now;
    const dt = Math.max(0.001, Math.min(0.05, rawDt));
    if (!state.paused) {
      state.time += dt;
      state.playTime += dt;
      state.clock.minute += dt * (2 / 3);
      if (state.clock.minute >= 60) {
        state.clock.minute -= 60;
        state.clock.hour += 1;
      }
      if (state.clock.hour >= 24) {
        state.clock.hour -= 24;
        state.clock.day += 1;
      }
    }
    state.phase = state.titleOpen
      ? 'title'
      : state.mapOpen
        ? 'map'
        : state.paused
          ? 'paused'
          : 'playing';

    if (state.titleOpen) {
      if (input.takePressed('Enter')) {
        state.titleOpen = false;
        hideTitle(state);
        if (state.ui && typeof state.ui.banner === 'function') {
          state.ui.banner('Selamat datang di Teluk Cerah, Raka.');
        }
      } else if (input.takePressed('KeyL')) {
        state.titleOpen = false;
        hideTitle(state);
        loadGame(state, 1);
      }
    } else {
      if (input.takePressed('Escape')) {
        if (state.mapOpen) {
          state.mapOpen = false;
          showMap(state, false);
        } else if (state.dialogOpen) {
          state.dialogOpen = false;
        } else {
          state.paused = !state.paused;
        }
      }
      if (input.takePressed('KeyM')) {
        state.mapOpen = !state.mapOpen;
        showMap(state, state.mapOpen);
      }
      if (input.takePressed('KeyN')) {
        state.muted = !state.muted;
        setMuted(state, state.muted);
      }
      if (input.takePressed('Digit1')) switchWeapon(state, 0);
      if (input.takePressed('Digit2')) switchWeapon(state, 1);
      if (input.takePressed('Digit3')) switchWeapon(state, 2);
    }

    if (!state.paused && !state.titleOpen) {
      updatePlayer(state, dt);
      updateTraffic(state, dt);
      updatePedestrians(state, dt);
      updatePolice(state, dt);
      updateHelicopter(state, dt);
      updateCombat(state, dt);
      updateMissions(state, dt);
      updateShops(state, dt);
      updateRadio(state, dt);
    }
    updateHud(state, dt);
    updateCamera(state, dt);
    drawWorld(world, state);

    if (input.mouse) {
      input.mouse.dx = 0;
      input.mouse.dy = 0;
    }
  }
  requestAnimationFrame(frame);
  return state;
}

try {
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
} catch (err) {
  /* boot errors surface through the page console */
}
