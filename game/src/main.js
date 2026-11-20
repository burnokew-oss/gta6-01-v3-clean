// Boot Teluk Cerah: rakit semua sistem, jalankan loop frame.
import "three";
const THREE = window.THREE;
import { CONFIG } from "./config.js";
import { makeRng } from "./random.js";
import { createWorld, drawWorld, resizeWorld } from "./render.js";
import { createInput } from "./input.js";
import { buildCity } from "./city.js";
import { createPlayer, updatePlayer } from "./player.js";
import { createTraffic, updateTraffic, nearestCar, driveCar } from "./vehicles.js";
import { createPedestrians, updatePedestrians } from "./pedestrians.js";
import { createPolice, updatePolice, setWanted, addHeat } from "./police.js";
import { createHelicopter, updateHelicopter } from "./helicopter.js";
import { createCombat, updateCombat, switchWeapon } from "./combat.js";
import { createMissions, updateMissions, startMission } from "./missions.js";
import { createShops, updateShops } from "./shops.js";
import { createRadio, updateRadio, nextStation } from "./radio.js";
import { createAudio, setMuted, updateAudio } from "./audio.js";
import { saveGame, loadGame } from "./save.js";
import { createHud, updateHud, showMap, showDialog, showBanner } from "./hud.js";
import { applyShotFromAddress } from "./shots.js";

export function boot() {
  const world = createWorld();
  const input = createInput(document);
  const rng = makeRng(1);
  const state = {
    world, input, rng,
    cash: CONFIG.startCash, rep: 0, wanted: 0, heat: 0, heatTimer: 0,
    day: 1, clockMin: 18 * 60 + 30, shells: 0, shellGot: new Array(CONFIG.shellTotal).fill(false),
    missionsDone: 0, takedowns: 0, carsStolen: 0, escapes: 0, playSeconds: 0,
    muted: false, paused: false, staged: null, camLocked: false, camYaw: Math.PI,
    dialog: null, banner: null, bannerAt: 0, damageFlashAt: 0, audioReady: false,
    shotAnchor: null, shotSpeed: 172, shotKills: null, extraLightbars: null, bustedTimer: 0,
  };
  state.city = buildCity(world.scene, rng);
  state.player = createPlayer(state);
  state.cars = createTraffic(state, 16);
  state.peds = createPedestrians(state, 40);
  state.policeUnits = createPolice(state);
  state.heli = createHelicopter(state);
  state.combat = createCombat(state);
  state.missionState = createMissions(state);
  state.shopState = createShops(state);
  state.radioState = createRadio(state);
  state.audioState = createAudio(state);
  state.hudState = createHud(state);
  switchWeapon(state, 1);
  state.combat.playerGun.visible = false;

  window.__telukState = state;
  const shotName = applyShotFromAddress(state);
  if (!shotName) {
    document.getElementById("enter-hint").style.display = "block";
  }

  const unlock = () => { state.audioReady = true; };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("resize", () => resizeWorld(world));

  const titleEl = document.getElementById("title-overlay");
  let last = performance.now();
  let wasWanted = 0;

  function enterNearestCar(steal) {
    const car = nearestCar(state, state.player.pos, steal ? 4.4 : 3.6);
    if (!car) return;
    if (steal && car.driver) { state.carsStolen += 1; addHeat(state, 35); }
    if (car.type === "polisi") addHeat(state, 30);
    state.player.car = car;
    car.parked = false; car.lane = null;
    state.player.mesh.visible = false;
    showBanner(state, steal ? "Mobil dicuri!" : `Naik ${car.spec.label}`);
  }
  function exitCar() {
    const car = state.player.car;
    state.player.car = null;
    state.player.mesh.visible = true;
    state.player.pos.set(car.pos.x + 2.2, 0, car.pos.z);
    state.player.mesh.position.copy(state.player.pos);
    if (Math.abs(car.speed) < 1) car.parked = true;
  }

  function frame() {
    requestAnimationFrame(frame);
    const nowMs = performance.now();
    const dt = Math.max(0, Math.min(0.05, (nowMs - last) / 1000 || 0.016));
    last = nowMs;
    const now = nowMs;
    if (state.paused) { drawWorld(world, state); return; }
    state.playSeconds += dt;
    if (!state.staged) state.clockMin += dt * 0.6;
    if (state.clockMin >= 1440) { state.clockMin -= 1440; state.day += 1; }
    if (wasWanted > 0 && state.wanted === 0) state.escapes += 1;
    wasWanted = state.wanted;

    // Masukan global.
    if (input.takePressed("Escape")) {
      if (state.hudState.mapOpen) showMap(state, false);
      else if (!state.staged) {
        state.paused = true;
        document.getElementById("pause-overlay").style.display = "flex";
      }
    }
    if (input.takePressed("KeyM") && !state.staged) showMap(state, !state.hudState.mapOpen);
    if (input.takePressed("KeyN")) setMuted(state, !state.muted);
    if (state.paused) {
      if (input.takePressed("KeyQ")) {
        state.paused = false;
        document.getElementById("pause-overlay").style.display = "none";
      }
      if (input.takePressed("Digit1")) { saveGame(state, 1); showBanner(state, "Disimpan di slot 1"); }
      if (input.takePressed("Digit2")) { if (loadGame(state, 1)) showBanner(state, "Save slot 1 dimuat"); }
      drawWorld(world, state);
      updateHud(state, dt);
      return;
    }
    if (!state.staged && titleEl.style.display !== "none" && (input.keys["Enter"] || input.takePressed("KeyL"))) {
      if (input.takePressed("KeyL")) loadGame(state, 1);
      titleEl.style.display = "none";
      if (!state.missionState.active && state.missionsDone === 0) startMission(state, 1);
    }

    if (!state.staged) {
      if (state.player.car) {
        driveCar(state, state.player.car, dt);
        if (input.takePressed("KeyE") || input.takePressed("KeyF")) exitCar();
        if (input.takePressed("KeyR")) nextStation(state);
      } else {
        updatePlayer(state, dt);
        if (input.takePressed("KeyE")) {
          if (state.shopState.near) { /* toko menangani E sendiri */ }
          else enterNearestCar(false);
        }
        if (input.takePressed("KeyF")) enterNearestCar(true);
      }
    }

    updateTraffic(state, dt);
    updatePedestrians(state, dt);
    updatePolice(state, dt);
    updateHelicopter(state, dt);
    updateCombat(state, dt);
    updateMissions(state, dt);
    updateShops(state, dt);
    updateRadio(state, dt);
    updateAudio(state, dt);

    // Kamera.
    const cam = world.camera;
    if (!state.camLocked) {
      if (state.player.car) {
        const car = state.player.car;
        const back = 8.6 + Math.abs(car.speed) * 0.05;
        const tx = car.pos.x - Math.sin(car.heading) * back;
        const tz = car.pos.z - Math.cos(car.heading) * back;
        cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 5);
        cam.position.z += (tz - cam.position.z) * Math.min(1, dt * 5);
        cam.position.y += (3.1 - cam.position.y) * Math.min(1, dt * 5);
        cam.lookAt(car.pos.x + Math.sin(car.heading) * 6, 1.2, car.pos.z + Math.cos(car.heading) * 6);
      } else {
        const p = state.player;
        const tx = p.pos.x - Math.sin(p.heading) * 7.6;
        const tz = p.pos.z - Math.cos(p.heading) * 7.6;
        cam.position.x += (tx - cam.position.x) * Math.min(1, dt * 6);
        cam.position.z += (tz - cam.position.z) * Math.min(1, dt * 6);
        cam.position.y += (3.4 - cam.position.y) * Math.min(1, dt * 6);
        cam.lookAt(p.pos.x + Math.sin(p.heading) * 5, 1.3, p.pos.z + Math.cos(p.heading) * 5);
      }
      if (state.combat.shake > 0) {
        cam.position.x += (Math.random() - 0.5) * state.combat.shake * 0.3;
        cam.position.y += (Math.random() - 0.5) * state.combat.shake * 0.3;
      }
    }
    // Kedip lightbar mobil staging.
    if (state.extraLightbars) {
      const phase = Math.floor(now / 180) % 2 === 0;
      for (const lb of state.extraLightbars) {
        lb.red.material.color.setHex(phase ? 0xff2438 : 0x5c101c);
        lb.blue.material.color.setHex(phase ? 0x0f2f66 : 0x2a7bff);
      }
    }
    // Kedip neon: denyut halus pada sorot heli.
    updateHud(state, dt);
    drawWorld(world, state);
  }
  requestAnimationFrame(frame);
  return state;
}

boot();
