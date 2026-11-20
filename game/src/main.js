// Teluk Cerah — bootstrap: builds the world, wires every system
// together, runs the game loop with a clamped delta, and handles the
// title / pause / map flow plus the screenshot scenes.

import { createStage } from "./render.js";
import { createCity } from "./city.js";
import { createCrowd } from "./pedestrians.js";
import { createPlayer } from "./player.js";
import { createPolice } from "./police.js";
import { createCombat } from "./combat.js";
import { createMissions } from "./missions.js";
import { createShops } from "./shops.js";
import { createHud } from "./hud.js";
import { createInput } from "./input.js";
import { createAudio } from "./audio.js";
import { createRadio } from "./radio.js";
import { saveGame, loadGame, slotSummary } from "./save.js";
import { trafficVehicle, updateVehicleVisual } from "./vehicles.js";
import { makeRng, WORLD_SEED } from "./random.js";
import { CITY, VEHICLE_TYPES } from "./config.js";
import { setupShot } from "./shots.js";

const errors = [];
window.addEventListener("error", (e) => errors.push(String(e.message || e.error)));
window.__tcErrors = errors;

const params = new URLSearchParams(location.search);
const shotName = params.get("shot");

const rng = makeRng(WORLD_SEED);
const stage = createStage(document.getElementById("game-canvas"));
const { scene, camera } = stage;

const S = {
  money: 750, rep: 0, hp: 100, armor: 0, wanted: 0,
  timeMin: 17 * 60 + 40, day: 0, outfit: "Kemeja Putih + Jaket Merah",
  upgrades: { engine: 0, nos: false },
};
const DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU"];

const audio = createAudio();
const hud = createHud();
const input = createInput();
const city = createCity(scene, rng, stage.envMap);
const crowd = createCrowd(THREE, scene, rng, CITY);
const player = createPlayer(scene, rng, stage.envMap, city.colliders);
const radio = createRadio(() => {});
const police = createPolice(scene, stage.envMap, rng, (line) => hud.dispatch(line));
const combat = createCombat(scene, rng, audio, {
  onPlayerHit: (dmg) => {
    if (S.armor > 0) { const absorbed = Math.min(S.armor, dmg * 0.7); S.armor -= absorbed; S.hp -= dmg - absorbed; }
    else S.hp -= dmg;
  },
  onHit: () => audio.hit(),
  onKill: () => { S.rep += 1; },
  onShot: () => { if (police.wanted < 1) police.crime(1); },
});
const shops = createShops(S, { player, hud, combat, audio });

// traffic: two-way flow on the avenues, the coast road and the streets
const traffic = [];
{
  const trng = makeRng(WORLD_SEED + 7);
  const lanes = [];
  for (const z of [...CITY.avenuesZ, CITY.coastRoadZ]) {
    lanes.push({ axis: "x", at: z - 3.6, dir: 1, from: CITY.minX, to: CITY.maxX });
    lanes.push({ axis: "x", at: z + 3.6, dir: -1, from: CITY.maxX, to: CITY.minX });
  }
  for (const x of [CITY.streetsX[1], CITY.streetsX[3], CITY.streetsX[5], CITY.streetsX[6]]) {
    lanes.push({ axis: "z", at: x - 3.6, dir: 1, from: CITY.minZ, to: CITY.coastRoadZ });
    lanes.push({ axis: "z", at: x + 3.6, dir: -1, from: CITY.coastRoadZ, to: CITY.minZ });
  }
  for (let i = 0; i < 16; i++) {
    const lane = lanes[i % lanes.length];
    const type = VEHICLE_TYPES[i % VEHICLE_TYPES.length];
    const v = trafficVehicle(stage.envMap, trng, type);
    scene.add(v.group);
    const u = trng.range(0.08, 0.92);
    const pos = lane.from + (lane.to - lane.from) * u;
    traffic.push({
      v, lane, x: lane.axis === "x" ? pos : lane.at, z: lane.axis === "x" ? lane.at : pos,
      speed: trng.range(8, 13.5), heading: lane.axis === "x" ? (lane.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (lane.dir > 0 ? 0 : Math.PI),
    });
  }
}
function updateTraffic(dt, t) {
  for (const c of traffic) {
    const d = c.speed * c.lane.dir * dt;
    if (c.lane.axis === "x") {
      c.x += d;
      if (c.x > CITY.maxX + 12) c.x = CITY.minX - 12;
      if (c.x < CITY.minX - 12) c.x = CITY.maxX + 12;
    } else {
      c.z += d;
      if (c.z > CITY.coastRoadZ + 12) c.z = CITY.minZ - 12;
      if (c.z < CITY.minZ - 12) c.z = CITY.coastRoadZ + 12;
    }
    c.v.group.position.set(c.x, 0, c.z);
    c.v.group.rotation.y = c.heading - Math.PI / 2;
    c.v.speed = c.speed; c.v.steer = 0;
    updateVehicleVisual(c.v, dt, t);
  }
}

// courier for the chase mission: flees along the coast road and avenues
function makeCourier(x, z) {
  const v = trafficVehicle(stage.envMap, makeRng(WORLD_SEED + 99), VEHICLE_TYPES[1]);
  scene.add(v.group);
  const c = {
    x, z, heading: Math.PI / 2, speed: 15, group: v.group,
    update(dt, pl) {
      const away = Math.atan2(c.x - pl.x, c.z - pl.z);
      let target = away;
      if (c.x > CITY.maxX - 30) target = Math.PI; // turn back west... via -z? keep on roads:
      if (c.x > CITY.maxX - 30) target = -Math.PI / 2;
      if (c.x < CITY.minX + 30) target = Math.PI / 2;
      let dh = target - c.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      c.heading += THREE.MathUtils.clamp(dh, -1.4 * dt, 1.4 * dt);
      c.x += Math.sin(c.heading) * c.speed * dt;
      c.z += Math.cos(c.heading) * c.speed * dt;
      c.z = THREE.MathUtils.clamp(c.z, CITY.minZ + 10, CITY.coastRoadZ + 4);
      v.group.position.set(c.x, 0, c.z);
      v.group.rotation.y = c.heading - Math.PI / 2;
      v.speed = c.speed;
      updateVehicleVisual(v, dt, performance.now() / 1000);
    },
  };
  return c;
}

const missions = createMissions(scene, S, { hud, combat, police, player, audio, makeCourier });

// save / load slot rows in the pause menu
{
  const wrap = document.getElementById("save-slots");
  for (let slot = 1; slot <= 3; slot++) {
    const row = document.createElement("div");
    row.className = "slot-row";
    const info = document.createElement("div");
    info.className = "slot-info";
    info.textContent = `Slot ${slot}: ${slotSummary(slot)}`;
    const saveBtn = document.createElement("button");
    saveBtn.className = "menu-btn"; saveBtn.textContent = "SIMPAN";
    saveBtn.addEventListener("click", () => {
      saveGame(slot, {
        money: S.money, rep: S.rep, missionIndex: missions.index,
        upgrades: S.upgrades, hp: S.hp, armor: S.armor, x: player.x, z: player.z,
      });
      info.textContent = `Slot ${slot}: ${slotSummary(slot)}`;
      hud.notify(`Progres disimpan di slot ${slot}.`);
    });
    const loadBtn = document.createElement("button");
    loadBtn.className = "menu-btn"; loadBtn.textContent = "MUAT";
    loadBtn.addEventListener("click", () => {
      const d = loadGame(slot);
      if (!d) { hud.notify("Slot itu masih kosong."); return; }
      S.money = d.money; S.rep = d.rep; S.upgrades = d.upgrades || S.upgrades;
      S.hp = d.hp ?? 100; S.armor = d.armor ?? 0;
      player.nosUnlocked = !!S.upgrades.nos;
      player.teleport(d.x ?? 8, d.z ?? 44, 0);
      if (!missions.done) missions.start(Math.min(9, d.missionIndex ?? 0));
      hud.notify(`Slot ${slot} dimuat.`);
    });
    row.append(info, saveBtn, loadBtn);
    wrap.append(row);
  }
}

// ---------- title portrait: original painted artwork of Raka ----------
(function drawPortrait() {
  const cv = document.getElementById("portrait");
  const g = cv.getContext("2d");
  const sky = g.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, "#2e6da8"); sky.addColorStop(0.55, "#f2a95c"); sky.addColorStop(1, "#e2703a");
  g.fillStyle = sky; g.fillRect(0, 0, 336, 420);
  g.fillStyle = "#ffd76a"; g.beginPath(); g.arc(268, 84, 34, 0, 7); g.fill();
  g.fillStyle = "rgba(255,240,210,0.5)"; g.beginPath(); g.arc(268, 84, 52, 0, 7); g.fill();
  g.fillStyle = "#31435c";
  for (const [x, h] of [[8, 120], [44, 170], [86, 100], [238, 140], [286, 190], [316, 120]]) {
    g.fillRect(x, 300 - h, 30, h + 130);
    g.fillStyle = "#ffd98a";
    for (let wy = 300 - h + 12; wy < 290; wy += 16) for (let wx = x + 5; wx < x + 24; wx += 9) if ((wx * wy) % 3) g.fillRect(wx, wy, 4, 6);
    g.fillStyle = "#31435c";
  }
  g.fillStyle = "#1d6f7d"; g.fillRect(0, 300, 336, 120);
  g.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 22; i++) g.fillRect((i * 53) % 330, 312 + (i * 29) % 90, 22, 2.4);
  // Raka: shoulders, open red jacket, white shirt, calm face
  g.fillStyle = "#8a5636"; g.fillRect(146, 176, 44, 40); // neck
  g.fillStyle = "#b8352a"; // jacket
  g.beginPath(); g.moveTo(60, 420); g.quadraticCurveTo(70, 250, 128, 214); g.lineTo(150, 420); g.fill();
  g.beginPath(); g.moveTo(276, 420); g.quadraticCurveTo(266, 250, 208, 214); g.lineTo(186, 420); g.fill();
  g.fillStyle = "#f0ead8"; // shirt
  g.beginPath(); g.moveTo(140, 216); g.lineTo(196, 216); g.lineTo(186, 420); g.lineTo(150, 420); g.fill();
  g.fillStyle = "#a06844"; // face
  g.beginPath(); g.ellipse(168, 128, 52, 64, 0, 0, 7); g.fill();
  g.fillStyle = "#14100c"; // hair
  g.beginPath(); g.ellipse(168, 82, 54, 30, 0, Math.PI, 0); g.fill();
  g.fillRect(114, 78, 108, 16);
  g.fillStyle = "#14100c"; // brows + eyes
  g.fillRect(130, 122, 26, 6); g.fillRect(180, 122, 26, 6);
  g.fillRect(138, 134, 12, 6); g.fillRect(186, 134, 12, 6);
  g.fillStyle = "rgba(90,40,20,0.6)"; g.fillRect(150, 176, 36, 5); // mouth
  g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(163, 140, 7, 26); // nose shade
  g.fillStyle = "#e8b13c"; g.fillRect(158, 226, 20, 8); // necklace hint
})();

// ---------- flow: title, pause, map ----------
let state = shotName ? "play" : "title";
let paused = false;
const titleEl = document.getElementById("title-screen");
const hudEl = document.getElementById("hud");
const pauseEl = document.getElementById("pause-menu");
const wastedEl = document.getElementById("wasted");
const crosshairEl = document.getElementById("crosshair");

let started = false;
function startGame(withStory) {
  titleEl.style.display = "none";
  hudEl.style.display = "block";
  state = "play";
  audio.unlock(); radio.start();
  if (!started) { // bring the hero car to Raka's spawn for the first drive
    started = true;
    player.placeCar(20, 40, Math.PI / 2);
    player.teleport(8, 44, Math.PI / 2);
  }
  if (withStory && !missions.active && !missions.done) missions.start(S.missionIndex || 0);
}
document.getElementById("btn-start").addEventListener("click", () => startGame(true));
document.getElementById("btn-free").addEventListener("click", () => startGame(false));
document.getElementById("btn-how").addEventListener("click", () => {
  const p = document.getElementById("how-panel");
  p.style.display = p.style.display === "block" ? "none" : "block";
});
document.getElementById("btn-resume").addEventListener("click", () => { paused = false; pauseEl.style.display = "none"; });
document.getElementById("btn-quit-title").addEventListener("click", () => {
  paused = false; pauseEl.style.display = "none";
  state = "title"; titleEl.style.display = "flex"; hudEl.style.display = "none";
});
if (!shotName) titleEl.style.display = "flex";

const shotCtx = { S, player, police, combat, hud, missions, camera, traffic, shotView: null, fixedCamera: false };
if (shotName) {
  if (shotName === "title") {
    state = "title";
    titleEl.style.display = "flex";
    hudEl.style.display = "none";
  } else {
    hudEl.style.display = "block";
  }
  setupShot(shotName, shotCtx);
  S.wanted = police.wanted;
}

// title backdrop camera: slow orbit around the parked hero car
let titleAngle = 0.6;
function titleCamera(dt) {
  if (shotCtx.fixedCamera) return;
  titleAngle += dt * 0.05;
  const cx = 30 + Math.cos(titleAngle) * 10.5;
  const cz = CITY.coastRoadZ + 6 + Math.sin(titleAngle) * 10.5;
  camera.position.lerp(new THREE.Vector3(cx, 2.1, cz), Math.min(1, dt * 2));
  camera.lookAt(30, 1.0, CITY.coastRoadZ + 6);
  player.figure.group.rotation.y = -2.2 + Math.sin(titleAngle * 0.7) * 0.1;
}
if (!shotName) { // the live title scene behind the menu
  player.placeCar(30, CITY.coastRoadZ + 6.5, Math.PI / 2 + 0.5);
  player.teleport(26.8, CITY.coastRoadZ + 4.2, -2.2);
}

function respawn() {
  S.hp = 100; S.armor = 0;
  S.money = Math.max(0, S.money - 200);
  police.reset(); S.wanted = 0;
  if (player.mode === "car") player.exitCar();
  player.teleport(44, 96, 0);
  wastedEl.style.display = "none";
  hud.notify("Kau terbangun di depan Warung Senja. -$200 untuk biaya berobat.");
}

let frames = 0, last = performance.now(), bustShown = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(Math.max(dt, 0), 0.05); // clamped, never negative, never huge
  const t = now / 1000;
  frames++;

  if (state === "title") {
    titleCamera(dt);
    city.update(t, dt); crowd.update(dt); updateTraffic(dt, t);
    stage.followShadow(player.figure.group.position);
    stage.update(dt, t);
    stage.renderer.render(scene, camera);
    if (shotName && frames > 10 && !window.__tcReady) window.__tcReady = true;
    return;
  }
  if (paused) { stage.renderer.render(scene, camera); return; }

  // ---- live game ----
  if (input.hit("Escape")) {
    if (hud.mapOpen) hud.showMap(false);
    else if (shops.isOpen) shops.close();
    else { paused = true; pauseEl.style.display = "flex"; }
  }
  if (input.hit("KeyM")) hud.showMap(!hud.mapOpen);
  if (player.mode === "car") { if (input.hit("KeyE")) player.exitCar(); }
  else if (player.nearCar() && !shops.isOpen) { if (input.hit("KeyE")) player.enterCar(); }
  if (input.hit("Digit1")) combat.switchWeapon(0);
  if (input.hit("Digit2")) combat.switchWeapon(1);
  if (input.hit("Digit3")) combat.switchWeapon(2);
  if (input.hit("KeyR")) { if (player.mode === "car") radio.cycle(); else combat.reload(); }
  if (input.hit("KeyH")) audio.horn();

  S.timeMin += dt * 1.0;
  if (S.timeMin >= 1440) { S.timeMin -= 1440; S.day = (S.day + 1) % 7; }

  const frozen = shops.isOpen; // the world keeps living behind the map
  if (!frozen) {
    player.update(dt, input, camera, audio);
    combat.inputFiring = input.firing;
    combat.tryShoot(dt, player, camera);
    combat.update(dt, t, player, camera);
    police.update(dt, t, player, audio);
    missions.update(dt, t);
    crowd.update(dt);
    updateTraffic(dt, t);
    radio.update(dt);
  }
  shops.update(input);
  city.update(t, dt);
  stage.followShadow(new THREE.Vector3(player.x, 0, player.z));
  stage.update(dt, t);
  S.wanted = police.wanted;

  if (S.hp <= 0 && !bustShown) { bustShown = 1; wastedEl.style.display = "flex"; setTimeout(respawn, 2400); }
  if (police.bustTimer > 2.5 && !bustShown) {
    bustShown = 1; wastedEl.style.display = "flex";
    wastedEl.querySelector("span").textContent = "TERTANGKAP";
    setTimeout(() => { bustShown = 0; police.bustTimer = 0; respawn(); }, 2400);
  }
  if (bustShown && S.hp > 0) bustShown = 0;

  const w = combat.weapon;
  const ammoText = w.id === "fist" ? "—" : `${combat.ammo[w.id].mag} / ${combat.ammo[w.id].reserve}`;
  const hh = String(Math.floor(S.timeMin / 60)).padStart(2, "0");
  const mm = String(Math.floor(S.timeMin % 60)).padStart(2, "0");
  const view = shotCtx.shotView || {};
  hud.update(S, {
    clock: `${DAYS[S.day]} ${hh}:${mm}`,
    missionTitle: view.missionTitle || (missions.active ? `MISI ${missions.index + 1} — ${missions.current.title}` : (missions.done ? "CERITA SELESAI" : "KELILING KOTA")),
    objective: view.objective || missions.objectiveText() || shops.nearestHint() || (player.mode === "foot" && player.nearCar() ? "Tekan E untuk masuk mobil" : ""),
    weaponName: w.name, ammoText,
    driving: player.mode === "car",
    speedKmh: player.speedKmh, nos: player.nos,
    radioText: `📻 <b>${radio.station.name} ${radio.station.freq}</b> ♪ ${radio.track}`,
    hint: player.mode === "car" ? "" : (shops.nearestHint() || ""),
    entities: {
      player: { x: player.x, z: player.z, heading: player.heading },
      police: police.units, traffic,
      mission: missions.markerPos(),
    },
  });
  crosshairEl.style.display = player.mode === "foot" && combat.weapon.id !== "fist" ? "block" : "none";

  stage.renderer.render(scene, camera);
  input.endFrame();
  if (shotName && frames > 10 && !window.__tcReady) window.__tcReady = true;
}
requestAnimationFrame(loop);

window.__tc = {
  get state() { return state; },
  get speedKmh() { return player.speedKmh; },
  get mode() { return player.mode; },
  get ammo() { const w = combat.weapon; return w.id === "fist" ? null : combat.ammo[w.id].mag; },
  get errors() { return errors; },
  player, combat, police, S,
};
