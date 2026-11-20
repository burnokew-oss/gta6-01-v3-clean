// main.js — bootstrap Teluk Cerah: merangkai semua modul, loop game
// dengan delta waktu yang di-clamp (tidak pernah negatif, maksimal
// 0.05 detik), resize, pause, peta, save, dan mode adegan screenshot.
import { createRenderer, createScene, updateSkyLife } from "./render.js";
import { buildCity, updateCityLife } from "./city.js";
import { makeCar, randomTrafficPlate, updateLightbar } from "./vehicles.js";
import { spawnCrowd, updateCrowd } from "./pedestrians.js";
import { Player } from "./player.js";
import { Police } from "./police.js";
import { makeHelicopter, updateHelicopter } from "./helicopter.js";
import { Combat } from "./combat.js";
import { Missions } from "./missions.js";
import { Shops } from "./shops.js";
import { Radio } from "./radio.js";
import { AudioEngine } from "./audio.js";
import { Hud } from "./hud.js";
import { Input } from "./input.js";
import { saveToSlot, loadFromSlot, slotSummary } from "./save.js";
import { readShotMode, setupShot } from "./shots.js";
import { WORLD } from "./config.js";
import { mulberry32 } from "./random.js";

const canvas = document.getElementById("game-canvas");
const renderer = createRenderer(canvas);
const skyParts = createScene();
const scene = skyParts.scene;
const camera = new window.THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(-12, 3, 10);

const city = buildCity();
scene.add(city.group);

const player = new Player(scene);
const police = new Police(scene);
const combat = new Combat(scene);
const missions = new Missions(scene, player, police);
const shops = new Shops(player, combat);
const audio = new AudioEngine();
const radio = new Radio(audio);
const hud = new Hud();
const input = new Input();
const heli = makeHelicopter();
heli.position.set(20, 18, 20);
scene.add(heli);
const crowd = spawnCrowd(scene, 26);

// Lalu lintas bergerak di jalan lain kota.
const traffic = [];
{
  const rng = mulberry32(4242);
  const colors = [0x3b82f6, 0xf59e0b, 0x10b981, 0xe2e8f0, 0x8b5cf6, 0xec4899];
  for (let i = 0; i < 8; i++) {
    const car = makeCar({ color: colors[i % colors.length], plate: randomTrafficPlate(), pickup: i % 3 === 0 });
    const laneZ = [-34, 34, -68, 68][i % 4];
    car.position.set(-100 + i * 26, 0, laneZ + (i % 2 ? 2.8 : -2.8));
    car.rotation.y = i % 2 ? Math.PI : 0;
    scene.add(car);
    traffic.push(car);
  }
}

const state = { player, police, combat, missions, shops, radio, heli, traffic, camera, city, input, renderer, scene };
window.__teluk = state;

let paused = false;
let mapOpen = false;
let hour = WORLD.startHour;
let elapsed = 0;
const shot = readShotMode();
let frozenT = -1;
if (shot) {
  frozenT = setupShot(shot, state);
  if (shot === "map") drawBigMap();
  if (shot === "chase") {
    // Pejalan kaki di trotoar depan etalase untuk adegan chase.
    crowd.forEach((p, i) => {
      if (i < 7) { p.position.set(-4 + i * 5.5, 0, i % 2 ? -8.4 : 8.4); p.rotation.y = Math.PI / 2; }
    });
  }
}

const titleEl = document.getElementById("title-screen");
const pauseEl = document.getElementById("pause-menu");
const mapEl = document.getElementById("map-overlay");
document.getElementById("btn-start").addEventListener("click", () => {
  titleEl.style.display = "none";
  document.getElementById("hud").style.display = "block";
  audio.ensure(); radio.start();
});
document.getElementById("btn-resume").addEventListener("click", () => { paused = false; pauseEl.style.display = "none"; });
for (let s = 0; s < 3; s++) {
  document.getElementById("btn-save-" + s).addEventListener("click", () => { saveToSlot(s, state); hud.setNotice(slotSummary(s) + " — tersimpan"); });
  document.getElementById("btn-load-" + s).addEventListener("click", () => { hud.setNotice(loadFromSlot(s, state) ? slotSummary(s) + " — dimuat" : "Slot kosong"); });
}
if (!shot) { titleEl.style.display = "flex"; document.getElementById("hud").style.display = "none"; }

function drawBigMap() {
  const mc = document.getElementById("bigmap");
  if (!mc) return;
  const g = mc.getContext("2d");
  const W = mc.width, H = mc.height, C = W / 2, scale = W / 300;
  g.fillStyle = "#69b96a"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#1e9bb8"; g.fillRect(0, H * 0.86, W, H * 0.14);
  g.fillStyle = "#f2ddae"; g.fillRect(0, H * 0.8, W, H * 0.06);
  g.strokeStyle = "#2c2f36"; g.lineWidth = 13;
  for (let i = -3; i <= 3; i++) {
    g.beginPath(); g.moveTo(0, H / 2 + i * 34 * scale); g.lineTo(W, H / 2 + i * 34 * scale); g.stroke();
    g.beginPath(); g.moveTo(C + i * 34 * scale, 0); g.lineTo(C + i * 34 * scale, H); g.stroke();
  }
  g.strokeStyle = "#ffd23e"; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
  g.fillStyle = "#ffffff"; g.font = "bold 17px sans-serif"; g.textAlign = "center";
  for (const d of state.city.districts) {
    g.fillStyle = d.color;
    g.beginPath(); g.arc(C + d.x * scale, H / 2 + d.z * scale, 9, 0, 7); g.fill();
    g.fillStyle = "#10222e";
    g.fillText(d.name, C + d.x * scale, H / 2 + d.z * scale - 14);
  }
  for (const s of shops.list) {
    g.fillStyle = s.color; g.fillRect(C + s.x * scale - 6, H / 2 + s.z * scale - 6, 12, 12);
    g.fillStyle = "#10222e"; g.font = "bold 12px sans-serif";
    g.fillText(s.name, C + s.x * scale, H / 2 + s.z * scale + 22);
  }
  const tgt = missions.target();
  g.fillStyle = "#ffd23e"; g.font = "bold 30px sans-serif";
  g.fillText("★", C + tgt.x * scale, H / 2 + tgt.z * scale + 10);
  g.fillStyle = "#ffffff"; g.font = "bold 15px sans-serif";
  g.beginPath(); g.arc(C + player.x * scale, H / 2 + player.z * scale, 7, 0, 7); g.fill();
  g.strokeStyle = "#111827"; g.lineWidth = 2; g.stroke();
  for (const u of police.units) {
    g.fillStyle = "#2563eb";
    g.beginPath(); g.arc(C + u.car.position.x * scale, H / 2 + u.car.position.z * scale, 6, 0, 7); g.fill();
  }
}

let last = performance.now();
let sirenT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.max(0, Math.min(0.05, dt));
  if (paused) { renderer.render(scene, camera); return; }
  const t = frozenT >= 0 ? frozenT : (elapsed += dt);
  if (frozenT < 0) {
    // Dunia hidup hanya saat bukan adegan beku.
    player.update(dt, input, t);
    hour += dt * (24 / WORLD.dayLength) * 0.14;
    if (hour >= 24) hour -= 24;
    traffic.forEach((car, i) => {
      const dir = i % 2 ? -1 : 1;
      car.position.x += dir * (7 + (i % 3) * 2) * dt;
      if (car.position.x > 128) car.position.x = -128;
      if (car.position.x < -128) car.position.x = 128;
      for (const w of car.userData.wheels) w.rotation.z -= dir * 8 * dt;
    });
    updateCrowd(crowd, dt, t);
    police.update(dt, t, { x: player.x, z: player.z, angle: player.angle }, Math.abs(player.speed));
    police.coolDown(dt);
    if (police.wanted >= 3) updateHelicopter(heli, { x: player.x, z: player.z }, t, dt);
    else { heli.position.y += (30 - heli.position.y) * dt; heli.userData.rotor.rotation.y = t * 14; }
    missions.update(dt, combat);
    combat.update(dt, t);
    if (input.tapped("KeyE")) {
      audio.ensure();
      if (!shops.interact()) player.enterExit();
      if (shops.notice) { hud.setNotice(shops.notice); shops.notice = ""; }
    }
    if (input.tapped("Digit1")) combat.switchWeapon(0);
    if (input.tapped("Digit2")) combat.switchWeapon(1);
    if (input.tapped("Digit3")) combat.switchWeapon(2);
    if (input.tapped("KeyR")) { radio.next(); hud.setNotice("Radio: " + radio.station.name); }
    if (input.tapped("KeyH")) audio.horn();
    if (input.firing && player.mode === "foot") {
      audio.ensure();
      combat.tryShoot({ x: player.x, z: player.z }, player.angle, (ev, w) => {
        if (ev === "shot") audio.shot(w.id);
        if (ev === "down") { player.money += 40; hud.setNotice("Musuh tumbang +Rp40"); police.addHeat(6); }
        if (ev === "hit") police.addHeat(2);
      });
    }
    if (missions.notice) { hud.setNotice(missions.notice); audio.coin(); missions.notice = ""; }
    if (input.tapped("KeyM")) {
      mapOpen = !mapOpen;
      mapEl.style.display = mapOpen ? "flex" : "none";
      if (mapOpen) drawBigMap();
    }
    if (input.tapped("KeyP", "Escape")) { paused = true; pauseEl.style.display = "flex"; }
    radio.update(dt);
    audio.engine(player.mode === "drive" ? player.speed / 46 : 0);
    sirenT += dt;
    if (police.wanted > 0 && sirenT > 0.6) { sirenT = 0; audio.siren(t); }
    if (player.mode === "drive" && !shot) player.camera(camera);
    hud.update(dt, state, hour);
  } else {
    hud.update(0, state, hour);
  }
  updateCityLife(city, t);
  updateSkyLife(skyParts, t);
  for (const u of police.units) updateLightbar(u.car, t);
  if (frozenT >= 0 && shot === "chase") { camera.position.set(-15.2, 2.7, 0); camera.lookAt(7, 1.05, 0); }
  input.endFrame();
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
window.__telukReady = true;
