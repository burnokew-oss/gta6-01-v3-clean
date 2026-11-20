// Staging deterministik empat screenshot: chase, shootout, map, title (seed 1).
import "three";
const THREE = window.THREE;
import { createCar } from "./vehicles.js";
import { spawnEnemy } from "./combat.js";
import { setWanted } from "./police.js";
import { showDialog, showMap } from "./hud.js";
import { switchWeapon } from "./combat.js";

function hideTitle() { document.getElementById("title-overlay").style.display = "none"; }
function showTitle() { document.getElementById("title-overlay").style.display = "flex"; }

function placeCam(state, x, y, z, lx, ly, lz) {
  state.world.camera.position.set(x, y, z);
  state.world.camera.lookAt(lx, ly, lz);
  state.camLocked = true;
}

export function stageShot(state, name) {
  state.staged = name;
  state.audioReady = false;
  const scene = state.world.scene;
  if (name === "chase") {
    hideTitle(); showMap(state, false);
    document.getElementById("feature-strip").style.display = "none";
    state.world.camera.fov = 66; state.world.camera.updateProjectionMatrix();
    state.cash = 48275; state.player.health = 88; state.player.armor = 0;
    state.day = 3; state.clockMin = 18 * 60 + 40; state.shells = 9; state.missionsDone = 4;
    state.rep = 980; state.shotSpeed = 172;
    setWanted(state, 4);
    state.missionState.current = 4; state.missionState.stage = 1; state.missionState.active = true;
    const hero = createCar(state, "sport", 0xd92632, 0, 14, Math.PI, null);
    hero.speed = 30; hero.health = 88; hero.nos = 0.72;
    state.cars.push(hero);
    state.player.car = hero; state.player.mesh.visible = false;
    state.player.pos.copy(hero.pos);
    state.shotAnchor = new THREE.Vector3(0, 0, 8);
    const copL = createCar(state, "polisi", 0xf2f3f5, -4.3, 12.6, Math.PI, null);
    const copR = createCar(state, "polisi", 0xf2f3f5, 4.4, 13.3, Math.PI, null);
    state.cars.push(copL, copR);
    state.policeUnits[0].car.mesh.visible = false;
    state.policeUnits[1].car.mesh.visible = false;
    state.policeUnits[0].active = true; state.policeUnits[0].distance = 6; state.policeUnits[0].status = "pursuit";
    state.policeUnits[1].active = true; state.policeUnits[1].distance = 5; state.policeUnits[1].status = "pursuit";
    state.policeUnits[2].active = true; state.policeUnits[2].distance = 21; state.policeUnits[2].status = "spotlight";
    state.policeUnits[0].lightbar = copL.mesh.userData.lightbar;
    state.policeUnits[1].lightbar = copR.mesh.userData.lightbar;
    state.extraLightbars = [copL.mesh.userData.lightbar, copR.mesh.userData.lightbar];
    // Lalu lintas di depan + coretan pantulan hero/polisi.
    const ahead1 = createCar(state, "sedan", 0x3a6ea8, -3.8, -26, Math.PI, null);
    const ahead2 = createCar(state, "taksi", 0xf2b821, 4.2, -44, Math.PI, null);
    state.cars.push(ahead1, ahead2);
    const streakMat = (color, op) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false });
    const mkStreak = (x, z, w, l, color, op) => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(w, l), streakMat(color, op));
      s.rotation.x = -Math.PI / 2; s.position.set(x, 0.05, z); scene.add(s);
    };
    mkStreak(0, 20, 2.6, 13, 0xd92632, 0.4);
    mkStreak(-4.3, 19.5, 1.5, 8, 0xff2438, 0.4);
    mkStreak(4.4, 20.5, 1.5, 8, 0x2a7bff, 0.4);
    mkStreak(-8, -6, 1.3, 15, 0x2affc4, 0.3);
    mkStreak(8.4, -14, 1.3, 15, 0xff5fa8, 0.3);
    state.banner = "HELIKOPTER POLISI DI ATAS";
    state.hudState.bannerUntil = performance.now() + 999999;
    showDialog(state, "Dimas", "Lepas helikopter dulu, baru ke garasi. Jangan berhenti!");
    state.hudState.dialogUntil = performance.now() + 999999;
    state.heli.mesh.visible = true;
    state.heli.pos.set(6.5, 16.5, -15);
    placeCam(state, 0, 1.95, 20.4, 0, 1.35, -22);
  } else if (name === "shootout") {
    hideTitle(); showMap(state, false);
    document.getElementById("feature-strip").style.display = "none";
    state.cash = 18325; state.player.health = 84; state.player.armor = 0;
    state.day = 1; state.clockMin = 19 * 60 + 36; state.shells = 0; state.missionsDone = 9;
    state.rep = 1900; state.shotKills = "1/6 dikalahkan";
    setWanted(state, 3);
    state.missionState.current = 9; state.missionState.stage = 0; state.missionState.active = true;
    state.player.pos.set(0, 0, 112);
    state.player.heading = Math.PI;
    state.player.mesh.position.copy(state.player.pos);
    state.player.mesh.rotation.y = Math.PI;
    switchWeapon(state, 2);
    state.combat.weapons[1].ammo = 5;
    state.shotAnchor = new THREE.Vector3(0, 0, 104);
    const spots = [[-6.5, 104, 0xe84393], [5.5, 103, 0xff5fa8], [0.5, 101, 0xd92632], [-3.4, 100, 0xb03a8a], [4.2, 99, 0xe86a17]];
    spots.forEach(([x, z, shirt], i) => {
      const e = spawnEnemy(state, x, z, { shirt, boss: i === 2, health: 60 });
      e.mesh.rotation.y = 0;
    });
    const cop = createCar(state, "polisi", 0xf2f3f5, -10.5, 103, Math.PI / 2 + 0.25, null);
    state.cars.push(cop);
    state.extraLightbars = [cop.mesh.userData.lightbar];
    state.policeUnits[0].active = true; state.policeUnits[0].distance = 17; state.policeUnits[0].status = "roadblock";
    state.policeUnits[1].active = true; state.policeUnits[1].distance = 50; state.policeUnits[1].status = "roadblock";
    state.banner = "MISI 10 — RAJA TELUK";
    state.hudState.bannerUntil = performance.now() + 999999;
    showDialog(state, "Bu Sari", "Puncak cerita di gudang pelabuhan. Habisi mereka, Raka!");
    state.hudState.dialogUntil = performance.now() + 999999;
    state.heli.mesh.visible = true;
    state.heli.pos.set(-12, 23, 84);
    placeCam(state, 0, 2.35, 117.8, 0, 1.5, 98);
  } else if (name === "map") {
    hideTitle();
    document.getElementById("objective-line").style.display = "none";
    state.cash = 48250; state.player.health = 100; state.missionsDone = 8;
    state.shells = 9; state.day = 3; state.rep = 2450; state.completionPct = 67;
    state.takedowns = 61; state.carsStolen = 38; state.escapes = 13;
    state.playSeconds = 3 * 3600 + 47 * 60;
    state.missionState.current = 8; state.missionState.active = true; state.missionState.stage = 0;
    state.player.pos.set(30, 0, -10);
    placeCam(state, 30, 26, 26, 30, 0, -12);
    showMap(state, true);
  } else if (name === "title") {
    showTitle(); showMap(state, false);
    document.getElementById("objective-line").style.display = "none";
    state.player.mesh.visible = false;
    for (const ped of state.peds) {
      if (ped.pos.distanceTo(new THREE.Vector3(0, 0, 15)) < 34) ped.mesh.visible = false;
    }
    state.cash = 14830; state.day = 3; state.clockMin = 18 * 60 + 30;
    state.shells = 7; state.missionsDone = 6; state.rep = 1240;
    const hero = createCar(state, "sport", 0xd92632, 0, 2, Math.PI, null);
    state.cars.push(hero);
    state.player.pos.set(0, 0, 14);
    state.shotAnchor = new THREE.Vector3(0, 0, 4);
    placeCam(state, 0, 2.4, 15.5, 0, 1.6, -26);
  }
}

export function applyShotFromAddress(state) {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get("shot");
  if (shot && ["chase", "shootout", "map", "title"].includes(shot)) {
    stageShot(state, shot);
    return shot;
  }
  document.getElementById("title-overlay").style.display = "flex";
  state.staged = null;
  return null;
}
