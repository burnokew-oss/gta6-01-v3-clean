// main.js — bootstrap Teluk Cerah: merangkai semua modul, loop game dengan
// delta waktu ter-clamp (tidak pernah negatif, maksimal 0.05 detik),
// resize, pause, mode adegan screenshot.
import { WORLD, VEHICLES } from "./config.js";
import { Render } from "./render.js";
import { City } from "./city.js";
import { Input } from "./input.js";
import { makeCar, Traffic } from "./vehicles.js";
import { Pedestrians } from "./pedestrians.js";
import { Police } from "./police.js";
import { Helicopter } from "./helicopter.js";
import { Player } from "./player.js";
import { Combat } from "./combat.js";
import { Missions } from "./missions.js";
import { Shops } from "./shops.js";
import { Radio } from "./radio.js";
import { AudioFx } from "./audio.js";
import { Hud } from "./hud.js";
import { saveGame, loadGame, slotSummary, collectState, applyState } from "./save.js";
import { shotName, setupShot } from "./shots.js";

const canvas = document.getElementById("game");
const render = new Render(canvas);
const scene = render.scene;
const camera = render.camera;
const city = new City(scene, WORLD.seed);
const input = new Input(canvas);
const audio = new AudioFx();
const player = new Player(scene);
const traffic = new Traffic(scene, city, 10);
const pedestrians = new Pedestrians(scene, WORLD.seed, 26);
const police = new Police(scene);
const helicopter = new Helicopter(scene);
const combat = new Combat(scene, audio);
const missions = new Missions(scene);
const shops = new Shops();
const radio = new Radio(audio);
const hud = new Hud();

function driveable(mesh, specIdx, yaw = 0) {
  return {
    mesh, spec: VEHICLES[specIdx],
    state: { yaw, speed: 0 },
    get upgrades() { return { nos: shops.owned.has("nos") }; },
  };
}
const heroCar = driveable(makeCar({ color: 0xd21f2e, hero: true, plate: "TC 777 RA" }), 1, Math.PI);
heroCar.mesh.position.set(4.5, 0, 30);
scene.add(heroCar.mesh);
const parkedCars = [heroCar];
const extraSpecs = [[2, -30, 80], [0, 40, -70], [4, -90, 30], [3, 90, -100]];
for (const [spec, x, z] of extraSpecs) {
  const c = driveable(makeCar({ color: VEHICLES[spec].color }), spec, 0.4);
  c.mesh.position.set(x, 0, z);
  c.mesh.rotation.y = -Math.PI / 2 + 0.4;
  scene.add(c.mesh);
  parkedCars.push(c);
}

const game = {
  render, city, player, traffic, pedestrians, police, helicopter, combat,
  missions, shops, radio, hud, heroCar, camera,
  clockMin: 17 * 60 + 20, day: 1,
  state: "title", shotFixed: false,
};
combat.onCrime = (n) => police.addHeat(n);
combat.onKill = () => { player.money += 40; audio.coin(); hud.notify("Musuh tumbang +$40"); };

// potret karakter Raka di layar judul (ilustrasi canvas orisinal)
(function portrait() {
  const c = document.getElementById("portrait");
  if (!c) return;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 340);
  grad.addColorStop(0, "#ff8c42"); grad.addColorStop(0.6, "#ff3860"); grad.addColorStop(1, "#5b2a86");
  g.fillStyle = grad; g.fillRect(0, 0, 340, 340);
  g.fillStyle = "#ffe93d"; g.beginPath(); g.arc(272, 66, 30, 0, 7); g.fill();
  g.fillStyle = "#123a5c"; g.fillRect(0, 268, 340, 72);
  g.fillStyle = "#1b5a8a";
  for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(40 + i * 90, 292 + (i % 2) * 18, 52, 10, 0, 0, 7); g.fill(); }
  g.fillStyle = "#d21f2e"; g.fillRect(96, 238, 148, 102); // baju merah
  g.fillStyle = "#b8151f"; g.fillRect(96, 238, 148, 20);
  g.fillStyle = "#c98d5e"; g.fillRect(152, 208, 36, 40); // leher
  g.beginPath(); g.arc(170, 158, 62, 0, 7); g.fill(); // wajah
  g.fillStyle = "#14100c"; g.beginPath(); g.arc(170, 140, 64, Math.PI, Math.PI * 2); g.fill(); // rambut
  g.fillRect(104, 128, 132, 16);
  g.fillStyle = "#14161a"; g.fillRect(104, 108, 132, 24); // topi
  g.fillRect(88, 128, 164, 10);
  g.fillStyle = "#1c1c20";
  g.beginPath(); g.arc(146, 160, 6, 0, 7); g.arc(194, 160, 6, 0, 7); g.fill();
  g.strokeStyle = "#8a5a34"; g.lineWidth = 5;
  g.beginPath(); g.arc(170, 178, 22, 0.3, Math.PI - 0.3); g.stroke();
})();

const $ = (id) => document.getElementById(id);
const titleScreen = $("title-screen"), pauseMenu = $("pause-menu"),
  shopMenu = $("shop-menu"), howMenu = $("how-menu"), mapOverlay = $("map-overlay");

const hudChrome = ["hud-left", "hud-right", "minimap-wrap", "hud-speed", "crosshair", "hud-prompt"];
function setState(s) {
  game.state = s;
  for (const id of hudChrome) { const n = $(id); if (n) n.style.display = (s === "title" || s === "map") ? "none" : ""; }
  titleScreen.style.display = s === "title" ? "flex" : "none";
  pauseMenu.classList.toggle("open", s === "pause");
  mapOverlay.classList.toggle("open", s === "map");
  if (s === "map") hud.drawFullMap(game);
  if (s === "pause") {
    $("pause-stats").textContent = `Uang $${player.money} · Reputasi ${player.rep} · Misi selesai ${missions.done}/10 · Hari ${game.day}`;
    for (let i = 0; i < 3; i++) $("save-info-" + i).textContent = slotSummary(i);
  }
}
function startPlay() {
  audio.ensure();
  radio.playing = true;
  setState("play");
  if (!missions.active && missions.current) {
    const started = missions.start();
    if (started) hud.dialog(started.dialog[0], started.dialog[1]);
  }
}
$("btn-play").addEventListener("click", startPlay);
$("btn-how").addEventListener("click", () => howMenu.classList.add("open"));
$("btn-how-close").addEventListener("click", () => howMenu.classList.remove("open"));
$("btn-load").addEventListener("click", () => { const d = loadGame(0); if (d) { applyState(game, d); startPlay(); } else hud.notify("Slot 1 kosong"); });
$("btn-resume").addEventListener("click", () => setState("play"));
$("btn-quit-title").addEventListener("click", () => setState("title"));
$("btn-shop-close").addEventListener("click", () => { shopMenu.classList.remove("open"); setState("play"); });
for (let i = 0; i < 3; i++) {
  $("btn-save" + i).addEventListener("click", () => { saveGame(i, collectState(game)); hud.notify("Tersimpan di slot " + (i + 1)); setState("pause"); });
  $("btn-load" + i).addEventListener("click", () => { const d = loadGame(i); if (d) { applyState(game, d); setState("play"); } });
}

function openShop(shop) {
  const items = shops.menuFor(shop, player, combat);
  $("shop-title").textContent = shop.name + ` — $${player.money}`;
  const box = $("shop-items");
  box.innerHTML = "";
  if (!items.length) box.innerHTML = "<p>Semua upgrade sudah terpasang.</p>";
  for (const item of items) {
    const b = document.createElement("button");
    b.className = "mbtn";
    b.innerHTML = `${item.label}<small>${item.desc}</small>`;
    b.addEventListener("click", () => { hud.notify(item.buy()); $("shop-title").textContent = shop.name + ` — $${player.money}`; });
    box.appendChild(b);
  }
  shopMenu.classList.add("open");
  setState("shop");
}

function nearestCar() {
  let best = null, bd = 5;
  for (const c of parkedCars) {
    const d = c.mesh.position.distanceTo(player.pos);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

function interact() {
  if (player.driving) return;
  const shop = shops.near;
  if (shop) { openShop(shop); return; }
  if (!missions.active && missions.current) {
    const spot = missions.targetPos();
    if (Math.hypot(player.pos.x - spot.x, player.pos.z - spot.z) < 6) {
      const started = missions.start();
      if (started) hud.dialog(started.dialog[0], started.dialog[1]);
      return;
    }
  }
  const car = nearestCar();
  if (car) {
    player.enterCar(car);
    police.addHeat(2);
    hud.notify("Mengemudi: " + car.spec.name);
  }
}

// adegan screenshot atau mulai normal
const shot = shotName();
if (shot) {
  game.shotFixed = true;
  const s = setupShot(game, shot);
  setState(s === "map" ? "map" : s === "title" ? "title" : "play");
  if (shot === "chase" || shot === "shootout") { titleScreen.style.display = "none"; game.state = "play"; }
} else {
  setState("title");
}

let last = performance.now();
let elapsed = 0;
function loop(now) {
  requestAnimationFrame(loop);
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.max(0, Math.min(0.05, dt)); // clamp: tidak negatif, maks 0.05
  const t = game.shotFixed ? 2.35 : (elapsed += dt);

  if (game.state === "play" && !game.shotFixed) {
    game.clockMin += dt * 2;
    if (game.clockMin > 19 * 60) { game.clockMin = 6 * 60 + 30; game.day++; }
    if (input.justPressed("Escape", "KeyP")) setState("pause");
    else if (input.justPressed("KeyM")) setState("map");
    else if (input.justPressed("KeyE")) interact();
    else if (input.justPressed("KeyF") && player.driving) player.exitCar();
    else if (input.justPressed("KeyR")) { const ri = radio.next(); hud.notify(`Radio: ${ri.station} — "${ri.track}"`); }
    else if (input.justPressed("KeyH")) audio.horn();
    combat.switchWeapon(input);
    player.camYaw -= (input.mouseDown && input.down("KeyQ") ? 1 : 0); // cadangan putar kamera
    player.update(dt, input, city);
    player.updateCamera(camera, dt, police.wanted >= 3);
    traffic.update(dt, t);
    pedestrians.update(dt, t);
    shops.update(player.pos);
    const target = player.driving ? player.pos : player.pos;
    police.update(dt, t, target, player.speed);
    if (police.wanted >= 2) police.cool(dt * 0.4);
    helicopter.active = police.wanted >= 3;
    helicopter.update(dt, t, target, police.wanted >= 4);
    combat.tryFire(dt, input, player.pos, player.yaw, camera);
    combat.update(dt, player.pos, camera, (dmg) => {
      if (player.armor > 0) { player.armor = Math.max(0, player.armor - dmg); } else player.hp -= dmg;
    });
    const ev = missions.update(dt, t, player.pos, player);
    if (ev?.objective) hud.notify("Objektif: " + ev.objective);
    if (ev?.completed) {
      audio.coin();
      hud.notify(`Misi selesai: ${ev.completed.mission.title} +$${ev.completed.reward} · Rep +${ev.completed.rep}`, 5000);
      if (missions.current) { const s = missions.start(); if (s) hud.dialog(s.dialog[0], s.dialog[1]); }
    }
    if (player.hp <= 0) {
      player.hp = 100; player.money = Math.max(0, player.money - 100);
      police.heat = 0; police.wanted = 0;
      if (player.driving) player.exitCar();
      player.pos.set(30, 0, -60);
      hud.notify("Raka pingsan dan terbangun di klinik. -$100");
    }
    audio.setEngine(Math.abs(player.speed) / 60, !!player.driving);
    audio.setSiren(police.wanted > 0, t);
    radio.update(dt);
    hud.update(dt, game);
  } else if (game.shotFixed) {
    if (shot === "map") hud.drawFullMap(game);
    else if (shot !== "title") hud.update(0, game);
  } else if (game.state === "map") {
    if (input.justPressed("KeyM", "Escape")) setState("play");
    hud.drawFullMap(game);
  } else if (game.state === "pause") {
    if (input.justPressed("Escape", "KeyP")) setState("play");
  } else if (game.state === "title") {
    if (input.justPressed("Enter")) startPlay();
    // kamera judul perlahan mengorbit pemandangan kota
    if (!game.shotFixed) {
      camera.position.set(Math.sin(t * 0.05) * 30, 9, 60 + Math.cos(t * 0.05) * 8);
      camera.lookAt(0, 2, 10);
      traffic.update(dt, t);
      pedestrians.update(dt, t);
    }
  }
  city.update(t);
  render.update(t);
  render.render();
  input.endFrame();
  window.__shotReady = true;
}
requestAnimationFrame(loop);
addEventListener("resize", () => render.resize());
addEventListener("pointerdown", () => audio.ensure(), { once: true });
