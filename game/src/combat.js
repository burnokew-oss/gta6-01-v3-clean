// Combat: tinju, pistol, shotgun; musuh geng berpenanda, kilatan moncong, partikel.
import "three";
const THREE = window.THREE;
import { buildHuman, poseAim, animateWalk } from "./player.js";
import { addHeat } from "./police.js";
import { playSound } from "./audio.js";

export const WEAPONS = [
  { name: "Tinju", slot: 1, damage: 12, range: 2.1, rate: 0.34, ammo: Infinity, mag: Infinity },
  { name: "Pistol", slot: 2, damage: 26, range: 42, rate: 0.24, ammo: 12, mag: 12 },
  { name: "Shotgun", slot: 3, damage: 55, range: 20, rate: 0.85, ammo: 0, mag: 6 },
];

export function buildGun(color = 0x22242c) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.34), mat); barrel.position.z = 0.14; g.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.07), mat); grip.position.set(0, -0.08, -0.03); grip.rotation.x = 0.3; g.add(grip);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.2), mat); g.add(body);
  return g;
}

export function createCombat(state) {
  const flash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0 }));
  flash.scale.set(1, 0.7, 1.6);
  state.world.scene.add(flash);
  const playerGun = buildGun();
  playerGun.position.set(0.3, 1.28, 0.25);
  state.player.mesh.add(playerGun);
  return {
    weapons: WEAPONS.map((w) => ({ ...w, reserve: w.slot === 2 ? 48 : 0 })),
    cooldown: 0, reloading: 0, flash, playerGun, enemies: [], particles: [],
    lastShotAt: 0, kills: 0, shake: 0,
  };
}

export function spawnEnemy(state, x, z, opts = {}) {
  const mesh = buildHuman({
    shirt: opts.shirt ?? 0xe84393, pants: opts.pants ?? 0x33222e,
    skin: opts.skin ?? 0xa96b42, hair: 0x14100c, hat: opts.hat ?? null,
  });
  mesh.position.set(x, 0.2, z);
  state.world.scene.add(mesh);
  const gun = buildGun(0x3a3f4a); gun.position.set(0.3, 1.28, 0.25); mesh.add(gun);
  poseAim(mesh, true); mesh.userData.aiming = true;
  const marker = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 4),
    new THREE.MeshBasicMaterial({ color: 0xff2a3c }));
  marker.rotation.x = Math.PI; marker.position.y = 2.15; mesh.add(marker);
  const barBg = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.11), new THREE.MeshBasicMaterial({ color: 0x1c0f14, side: THREE.DoubleSide }));
  barBg.position.y = 1.98; mesh.add(barBg);
  const barFg = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.07), new THREE.MeshBasicMaterial({ color: 0x3ce06a, side: THREE.DoubleSide }));
  barFg.position.set(0, 1.98, 0.005); mesh.add(barFg);
  const enemy = {
    mesh, pos: mesh.position, health: opts.health ?? 60, maxHealth: opts.health ?? 60,
    alive: true, phase: Math.random() * 6, barFg, marker, boss: !!opts.boss, fireTimer: Math.random() * 2,
  };
  state.combat.enemies.push(enemy);
  return enemy;
}

export function switchWeapon(state, slot) {
  const idx = slot - 1;
  if (idx >= 0 && idx < state.combat.weapons.length) {
    state.player.weaponIndex = idx;
    state.combat.playerGun.visible = idx > 0;
    poseAim(state.player.mesh, idx > 0);
    state.player.mesh.userData.aiming = idx > 0;
  }
}

function burst(state, at, color, n, spread = 1.6, up = 2.2) {
  const mat = new THREE.MeshBasicMaterial({ color });
  for (let i = 0; i < n; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 5), mat);
    p.position.copy(at);
    state.world.scene.add(p);
    state.combat.particles.push({
      mesh: p, life: 0.55,
      vx: (Math.random() - 0.5) * spread, vy: Math.random() * up, vz: (Math.random() - 0.5) * spread,
    });
  }
}

export function fireWeapon(state) {
  const c = state.combat;
  if (c.cooldown > 0 || c.reloading > 0 || state.player.car) return;
  const w = c.weapons[state.player.weaponIndex];
  if (w.ammo <= 0) { playSound(state, "pickup"); return; }
  c.cooldown = w.rate;
  c.lastShotAt = performance.now();
  if (w.ammo !== Infinity) w.ammo -= 1;
  playSound(state, state.player.weaponIndex === 0 ? "punch" : "gunshot");
  const origin = state.player.pos.clone(); origin.y = 1.3;
  const fx = Math.sin(state.player.heading), fz = Math.cos(state.player.heading);
  if (state.player.weaponIndex > 0) {
    c.flash.position.copy(origin).add(new THREE.Vector3(fx * 0.6, 0.05, fz * 0.6));
    c.flash.material.opacity = 0.95;
    c.shake = Math.min(0.35, c.shake + 0.12);
    state.world.scene.attach(c.flash);
  }
  let best = null, bestD = w.range;
  const candidates = [...c.enemies.filter((e) => e.alive), ...state.peds.filter((p) => p.alive).map((p) => ({ pos: p.pos, health: p.health, ped: p }))];
  for (const e of candidates) {
    const dx = e.pos.x - origin.x, dz = e.pos.z - origin.z;
    const dist = Math.hypot(dx, dz);
    if (dist > w.range) continue;
    const dot = (dx * fx + dz * fz) / (dist || 1);
    if (state.player.weaponIndex === 0 ? dist < w.range : dot > 0.86) {
      if (dist < bestD) { bestD = dist; best = e; }
    }
  }
  if (best) {
    best.health -= w.damage;
    burst(state, new THREE.Vector3(best.pos.x, 1.2, best.pos.z), 0xc22e3a, 7);
    if (best.barFg) best.barFg.scale.x = Math.max(0.02, best.health / best.maxHealth);
    if (best.health <= 0) {
      if (best.ped) { best.ped.alive = false; best.ped.mesh.rotation.x = -Math.PI / 2; best.ped.mesh.position.y = 0.3; addHeat(state, 60); }
      else { best.alive = false; best.mesh.rotation.x = -Math.PI / 2; best.mesh.position.y = 0.3; c.kills += 1; state.takedowns += 1; addHeat(state, 40); }
    } else if (best.ped) addHeat(state, 25);
  }
  if (state.player.weaponIndex > 0) addHeat(state, 18);
}

export function startReload(state) {
  const c = state.combat;
  const w = c.weapons[state.player.weaponIndex];
  if (w.mag === Infinity || c.reloading > 0 || w.ammo >= w.mag) return;
  if (state.player.weaponIndex === 2 && w.reserve <= 0 && state.missionsDone >= 5) { w.reserve = 24; }
  if (w.reserve <= 0) return;
  c.reloading = 0.9;
}

export function updateCombat(state, dt) {
  const c = state.combat;
  c.cooldown = Math.max(0, c.cooldown - dt);
  if (c.reloading > 0) {
    c.reloading -= dt;
    if (c.reloading <= 0) {
      const w = c.weapons[state.player.weaponIndex];
      const need = w.mag - w.ammo, take = Math.min(need, w.reserve);
      w.ammo += take; w.reserve -= take;
    }
  }
  if (c.flash.material.opacity > 0) c.flash.material.opacity = Math.max(0, c.flash.material.opacity - dt * 9);
  c.shake = Math.max(0, c.shake - dt * 1.8);
  const input = state.input;
  if (!state.staged && !state.paused) {
    if (input.takePressed("Digit1")) switchWeapon(state, 1);
    if (input.takePressed("Digit2")) switchWeapon(state, 2);
    if (input.takePressed("Digit3")) switchWeapon(state, 3);
    if (input.mouse.down || input.keys["KeyJ"]) fireWeapon(state);
    if (input.takePressed("KeyR") && !state.player.car) startReload(state);
  }
  for (const e of c.enemies) {
    if (!e.alive) continue;
    e.marker.rotation.y += dt * 3;
    const dx = state.player.pos.x - e.pos.x, dz = state.player.pos.z - e.pos.z;
    const dist = Math.hypot(dx, dz);
    e.mesh.rotation.y = Math.atan2(dx, dz);
    e.fireTimer -= dt;
    if (e.fireTimer <= 0 && dist < 30 && !state.staged) {
      e.fireTimer = 1.4 + Math.random() * 1.4;
      if (Math.random() < 0.55) {
        state.player.health -= e.boss ? 7 : 4;
        state.damageFlashAt = performance.now();
        playSound(state, "gunshot");
        if (state.player.health <= 0 && !state.player.dead) killPlayer(state);
      }
    }
    if (dist > 9 && !state.staged) {
      e.pos.x += (dx / dist) * 1.7 * dt; e.pos.z += (dz / dist) * 1.7 * dt;
      e.phase += dt * 6; animateWalk(e.mesh, e.phase, 0.7);
    }
  }
  for (let i = c.particles.length - 1; i >= 0; i--) {
    const p = c.particles[i];
    p.life -= dt;
    p.mesh.position.x += p.vx * dt; p.mesh.position.y += p.vy * dt; p.mesh.position.z += p.vz * dt;
    p.vy -= 5 * dt;
    if (p.life <= 0) { state.world.scene.remove(p.mesh); c.particles.splice(i, 1); }
  }
}

export function killPlayer(state) {
  state.player.dead = true;
  state.cash = Math.floor(state.cash * 0.9);
  state.player.health = 100;
  state.player.pos.set(-160, 0, 54);
  if (state.player.car) { state.player.car = null; state.player.mesh.visible = true; }
  setTimeout(() => { state.player.dead = false; }, 400);
  state.banner = "WASTED — respawn di rumah sakit";
  state.bannerAt = performance.now();
}
