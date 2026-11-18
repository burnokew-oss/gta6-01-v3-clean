import * as ThreeLib from 'three';
const THREE = (ThreeLib && typeof ThreeLib.Scene === 'function') ? ThreeLib : (typeof globalThis !== 'undefined' && globalThis.THREE ? globalThis.THREE : (() => { throw new Error('Three.js is not available: the vendored module has no Scene export and no global THREE object exists on the page.'); })());
import { CONFIG } from './config.js';
import { buildHumanoidMesh, damagePlayer } from './player.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

const WEAPON_DEFS = [
  { name: 'Tinju', short: 'TINJU', range: 2.4, damage: 18, cooldown: 0.45, magSize: Infinity, auto: false },
  { name: 'Pistol', short: 'PISTOL', range: 60, damage: 26, cooldown: 0.22, magSize: 12, auto: false },
  { name: 'Shotgun', short: 'SHOTGUN', range: 26, damage: 9, cooldown: 0.85, magSize: 6, auto: false, pellets: 6 },
];

export function createCombat(state) {
  const combat = {
    weapons: WEAPON_DEFS.map((def, i) => ({
      name: def.name,
      short: def.short,
      range: def.range,
      damage: def.damage,
      cooldown: def.cooldown,
      magSize: def.magSize,
      pellets: def.pellets || 1,
      ammo: i === 1 ? 12 : 0,
      reserve: i === 1 ? 48 : 0,
      unlocked: i < 2,
    })),
    enemies: [],
    tracers: [],
    particles: [],
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    reloadTimer: 0,
    cooldown: 0,
    muzzleTimer: 0,
    shotgunUnlocked: false,
    killsThisMission: 0,
  };
  Object.defineProperties(combat, {
    pistolAmmo: {
      get() { return combat.weapons[1].ammo; },
      set(v) { combat.weapons[1].ammo = v; },
      enumerable: true, configurable: true,
    },
    pistolReserve: {
      get() { return combat.weapons[1].reserve; },
      set(v) { combat.weapons[1].reserve = v; },
      enumerable: true, configurable: true,
    },
    shotgunAmmo: {
      get() { return combat.weapons[2].ammo; },
      set(v) { combat.weapons[2].ammo = v; },
      enumerable: true, configurable: true,
    },
    shotgunReserve: {
      get() { return combat.weapons[2].reserve; },
      set(v) { combat.weapons[2].reserve = v; },
      enumerable: true, configurable: true,
    },
    selected: {
      get() { return state.player ? state.player.weaponIndex : 0; },
      set(v) { if (state.player) state.player.weaponIndex = v; },
      enumerable: true, configurable: true,
    },
  });
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  flash.visible = false;
  state.scene.add(flash);
  combat.muzzleFlash = flash;

  state.combat = combat;
  state.combatApi = {
    fireWeapon: (st) => fireWeapon(st),
    switchWeapon: (st, slot) => switchWeapon(st, slot),
    reloadWeapon: (st) => reloadWeapon(st),
    addShake: (st, amount) => addShake(st, amount),
    spawnEnemies: (st, count, center, kind) => spawnEnemies(st, count, center, kind),
  };
  return combat;
}

export function addShake(state, amount) {
  if (!state.combat) return;
  state.combat.shake = Math.min(1, state.combat.shake + amount);
}

export function switchWeapon(state, slot) {
  const combat = state.combat;
  const player = state.player;
  if (!combat || !player) return;
  if (slot < 0 || slot >= combat.weapons.length) return;
  const weapon = combat.weapons[slot];
  if (slot === 2 && !weapon.unlocked && !combat.shotgunUnlocked) return;
  player.weaponIndex = slot;
  combat.reloadTimer = 0;
  state.audioApi?.play?.('pickup');
}

export function reloadWeapon(state) {
  const combat = state.combat;
  const player = state.player;
  if (!combat || !player) return;
  const weapon = combat.weapons[player.weaponIndex];
  if (!weapon || weapon.magSize === Infinity) return;
  if (combat.reloadTimer > 0) return;
  if (weapon.ammo >= weapon.magSize || weapon.reserve <= 0) return;
  combat.reloadTimer = weapon.name === 'Shotgun' ? 1.6 : 1.1;
  state.audioApi?.play?.('pickup');
}

function muzzleWorldPos(state) {
  const player = state.player;
  const forward = new THREE.Vector3(Math.sin(player.heading), 0, Math.cos(player.heading));
  const pos = player.position.clone().addScaledVector(forward, 0.7);
  pos.y = 1.35;
  if (player.car) {
    const car = player.car;
    pos.copy(car.position).addScaledVector(new THREE.Vector3(Math.sin(car.heading), 0, Math.cos(car.heading)), 2.4);
    pos.y = 1.1;
  }
  return pos;
}

function showMuzzle(state) {
  const combat = state.combat;
  const flash = combat.muzzleFlash;
  flash.position.copy(muzzleWorldPos(state));
  flash.visible = true;
  flash.material.opacity = 0.95;
  flash.scale.setScalar(1 + Math.random() * 0.5);
  combat.muzzleTimer = 0.06;
}

function spawnTracer(state, from, to) {
  const geo = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 0xffe9a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending,
  }));
  state.scene.add(line);
  state.combat.tracers.push({ line, life: 0.12, maxLife: 0.12 });
}

function spawnParticles(state, pos, count, color, speed, up) {
  const combat = state.combat;
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 + Math.random() * 0.06, 6, 5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }),
    );
    mesh.position.copy(pos);
    state.scene.add(mesh);
    const angle = Math.random() * Math.PI * 2;
    const spread = (Math.random() - 0.5) * speed;
    combat.particles.push({
      mesh,
      vx: Math.cos(angle) * speed * (0.4 + Math.random() * 0.6),
      vy: (up || 2.5) * (0.5 + Math.random()),
      vz: Math.sin(angle) * speed * (0.4 + Math.random() * 0.6) + spread,
      life: 0.5 + Math.random() * 0.4,
      maxLife: 0.9,
    });
  }
  if (combat.particles.length > 240) {
    const extra = combat.particles.splice(0, combat.particles.length - 240);
    for (const p of extra) state.scene.remove(p.mesh);
  }
}

function angleToTarget(state, targetPos) {
  const player = state.player;
  const dx = targetPos.x - player.position.x;
  const dz = targetPos.z - player.position.z;
  const want = Math.atan2(dx, dz);
  let diff = want - player.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return { diff, dist: Math.hypot(dx, dz) };
}

function hurtPed(state, ped, damage) {
  ped.health -= damage;
  spawnParticles(state, new THREE.Vector3(ped.position.x, 1.2, ped.position.z), 8, 0xc02020, 2.2, 2);
  if (ped.health <= 0 && ped.group.visible) {
    ped.group.visible = false;
    state.policeApi?.addHeat?.(state, 1);
    state.stats = state.stats || {};
    state.stats.takedowns = (state.stats.takedowns || 0) + 1;
    state.combat.killsThisMission = (state.combat.killsThisMission || 0) + 1;
    state.pedsApi?.scarePeds?.(state, ped.position.x, ped.position.z, 24);
  }
}

function hurtEnemy(state, enemy, damage) {
  if (!enemy || !enemy.group || !enemy.position) return;
  enemy.health -= damage;
  spawnParticles(state, new THREE.Vector3(enemy.position.x, 1.3, enemy.position.z), 8, 0xc02020, 2.2, 2);
  if (enemy.health <= 0 && !enemy.dead) {
    enemy.dead = true;
    enemy.fallTimer = 1.6;
    enemy.group.rotation.x = -Math.PI / 2;
    enemy.group.position.y = 0.35;
    state.stats = state.stats || {};
    state.stats.takedowns = (state.stats.takedowns || 0) + 1;
    state.combat.killsThisMission = (state.combat.killsThisMission || 0) + 1;
    const pistol = state.combat.weapons[1];
    if (pistol && enemy.kind === 'gang') pistol.reserve += 6;
    state.audioApi?.play?.('pickup');
  }
}

function fireMelee(state) {
  const player = state.player;
  const combat = state.combat;
  combat.cooldown = WEAPON_DEFS[0].cooldown;
  showMuzzle(state);
  state.audioApi?.play?.('punch');
  addShake(state, 0.12);
  let hitAnything = false;

  for (const enemy of combat.enemies) {
    if (enemy.dead) continue;
    const { diff, dist } = angleToTarget(state, enemy.position);
    if (dist < WEAPON_DEFS[0].range && Math.abs(diff) < 1.1) {
      hurtEnemy(state, enemy, WEAPON_DEFS[0].damage);
      hitAnything = true;
    }
  }
  for (const ped of state.peds || []) {
    if (ped.health <= 0) continue;
    const { diff, dist } = angleToTarget(state, ped.position);
    if (dist < WEAPON_DEFS[0].range && Math.abs(diff) < 1.1) {
      hurtPed(state, ped, WEAPON_DEFS[0].damage);
      hitAnything = true;
    }
  }
  for (const officer of state.police?.foot || []) {
    const { diff, dist } = angleToTarget(state, officer.position);
    if (dist < WEAPON_DEFS[0].range && Math.abs(diff) < 1.1) {
      state.policeApi?.addHeat?.(state, 1);
      officer.position.x += Math.sin(player.heading) * 1.5;
      officer.position.z += Math.cos(player.heading) * 1.5;
      hitAnything = true;
    }
  }
  if (hitAnything) {
    state.pedsApi?.scarePeds?.(state, player.position.x, player.position.z, 18);
  }
}

function fireGun(state, weapon, def) {
  const player = state.player;
  const combat = state.combat;
  if (weapon.ammo <= 0) {
    state.audioApi?.play?.('pickup');
    if (weapon.reserve > 0) reloadWeapon(state);
    return;
  }
  weapon.ammo -= 1;
  combat.cooldown = def.cooldown;
  showMuzzle(state);
  state.audioApi?.play?.('gunshot');
  addShake(state, def.name === 'Shotgun' ? 0.3 : 0.14);
  const from = muzzleWorldPos(state);
  const aimHeading = player.heading + (Math.random() - 0.5) * 0.03;
  const far = from.clone().add(new THREE.Vector3(Math.sin(aimHeading), 0, Math.cos(aimHeading)).multiplyScalar(def.range));
  let endPoint = far;

  let best = null;
  let bestScore = Infinity;
  const consider = (pos, dist, diff) => {
    if (dist > def.range || Math.abs(diff) > 0.35) return;
    const score = dist + Math.abs(diff) * 30;
    if (score < bestScore) {
      bestScore = score;
      best = pos;
    }
  };
  for (const enemy of combat.enemies) {
    if (enemy.dead) continue;
    const { diff, dist } = angleToTarget(state, enemy.position);
    consider({ kind: 'enemy', ref: enemy, pos: enemy.position }, dist, diff);
  }
  for (const ped of state.peds || []) {
    if (ped.health <= 0) continue;
    const { diff, dist } = angleToTarget(state, ped.position);
    consider({ kind: 'ped', ref: ped, pos: ped.position }, dist, diff);
  }
  for (const officer of state.police?.foot || []) {
    const { diff, dist } = angleToTarget(state, officer.position);
    consider({ kind: 'officer', ref: officer, pos: officer.position }, dist, diff);
  }

  if (best) {
    endPoint = new THREE.Vector3(best.pos.x, 1.3, best.pos.z);
    const hitDamage = def.damage * (def.pellets || 1) * (def.name === 'Shotgun' ? 0.6 : 1);
    if (best.kind === 'enemy') hurtEnemy(state, best.ref, hitDamage);
    else if (best.kind === 'ped') hurtPed(state, best.ref, hitDamage);
    else if (best.kind === 'officer') {
      state.policeApi?.addHeat?.(state, 2);
      state.stats = state.stats || {};
      state.stats.takedowns = (state.stats.takedowns || 0) + 1;
      spawnParticles(state, endPoint, 10, 0xc02020, 2.4, 2);
      const idx = state.police.foot.indexOf(best.ref);
      if (idx >= 0) {
        state.scene.remove(best.ref.group);
        state.police.foot.splice(idx, 1);
      }
    }
    spawnParticles(state, endPoint, 5, 0x888888, 1.4, 1.2);
  }
  spawnTracer(state, from, endPoint);
  state.pedsApi?.scarePeds?.(state, player.position.x, player.position.z, 30);
}

export function fireWeapon(state) {
  const combat = state.combat;
  const player = state.player;
  if (!combat || !player || player.dead) return;
  if (combat.cooldown > 0 || combat.reloadTimer > 0) return;
  if (state.paused || state.titleOpen || state.mapOpen || state.dialogOpen) return;
  const weapon = combat.weapons[player.weaponIndex];
  const def = WEAPON_DEFS[player.weaponIndex];
  if (!weapon || !def) return;
  if (player.weaponIndex === 0) fireMelee(state);
  else fireGun(state, weapon, def);
}

export function spawnEnemies(state, count, center, kind) {
  const combat = state.combat;
  const spawned = [];
  const cx = center?.x ?? (state.player?.position.x || 0);
  const cz = center?.z ?? (state.player?.position.z || 0);
  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 9 + Math.random() * 9;
    const x = cx + Math.cos(angle) * radius;
    const z = cz + Math.sin(angle) * radius;
    const isGang = kind !== 'police';
    const group = buildHumanoidMesh({
      skin: 0xc98d5f,
      shirt: isGang ? 0xe85a9b : 0x1d3a6e,
      pants: 0x23283a,
      hat: isGang ? null : 0x12203a,
    });
    group.position.set(x, 0, z);
    state.scene.add(group);

    const barBg = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.1, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x222222 }),
    );
    barBg.position.set(0, 2.25, 0);
    group.add(barBg);
    const barFg = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.07, 0.03),
      new THREE.MeshBasicMaterial({ color: 0xe02020 }),
    );
    barFg.position.set(0, 2.25, 0.01);
    group.add(barFg);

    let marker = null;
    if (isGang) {
      marker = new THREE.Mesh(
        new THREE.ConeGeometry(0.3, 0.55, 4),
        new THREE.MeshBasicMaterial({ color: 0xff2020 }),
      );
      marker.rotation.x = Math.PI;
      marker.position.set(0, 2.75, 0);
      group.add(marker);
    }

    const enemy = {
      group,
      position: group.position,
      heading: Math.atan2(cx - x, cz - z),
      speed: 0,
      health: 100,
      maxHealth: 100,
      kind: isGang ? 'gang' : 'police',
      shootTimer: 1 + Math.random() * 1.5,
      barFg,
      marker,
      dead: false,
      fallTimer: 0,
      walkPhase: Math.random() * 6,
    };
    combat.enemies.push(enemy);
    spawned.push(enemy);
  }
  return spawned;
}

function updateEnemy(state, enemy, dt) {
  if (!enemy || !enemy.group || !enemy.position) return;
  const player = state.player;
  if (!player || !player.position) return;
  if (enemy.dead) {
    enemy.fallTimer -= dt;
    if (enemy.fallTimer <= 0) {
      enemy.group.visible = false;
    }
    return;
  }
  const dx = player.position.x - enemy.position.x;
  const dz = player.position.z - enemy.position.z;
  const d = Math.hypot(dx, dz);
  const wantHeading = Math.atan2(dx, dz);
  let diff = wantHeading - enemy.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  enemy.heading += diff * Math.min(1, dt * 5);
  enemy.group.rotation.y = enemy.heading;

  if (d > 16) {
    enemy.speed = 4.6;
    enemy.position.x += Math.sin(enemy.heading) * enemy.speed * dt;
    enemy.position.z += Math.cos(enemy.heading) * enemy.speed * dt;
    enemy.walkPhase += dt * enemy.speed * 3.2;
  } else {
    enemy.speed = 0;
    enemy.shootTimer -= dt;
    if (enemy.shootTimer <= 0 && !player.dead) {
      enemy.shootTimer = 1.4 + Math.random() * 1.2;
      const hitChance = Math.max(0.25, 0.75 - d * 0.015);
      const from = enemy.position.clone();
      from.y = 1.35;
      const to = player.position.clone();
      to.y = 1.2;
      spawnTracer(state, from, to);
      state.audioApi?.play?.('gunshot');
      if (Math.random() < hitChance) {
        damagePlayer(state, 7 + Math.random() * 6);
        spawnParticles(state, to, 5, 0xc02020, 1.8, 1.5);
      }
      const flash = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      flash.position.copy(from);
      state.scene.add(flash);
      state.combat.particles.push({ mesh: flash, vx: 0, vy: 0, vz: 0, life: 0.07, maxLife: 0.07 });
    }
  }

  const limbs = enemy.group.userData.limbs;
  if (limbs) {
    const swing = enemy.speed > 0.1 ? Math.sin(enemy.walkPhase) * 0.6 : 0;
    limbs.legL.rotation.x = swing;
    limbs.legR.rotation.x = -swing;
    limbs.armL.rotation.x = -swing * 0.7;
    limbs.armR.rotation.x = swing * 0.7;
  }
  if (enemy.marker) {
    enemy.marker.position.y = 2.75 + Math.sin((state.time || 0) * 3 + enemy.walkPhase) * 0.08;
  }
  const frac = Math.max(0, enemy.health / enemy.maxHealth);
  if (enemy.barFg) {
    enemy.barFg.scale.x = Math.max(0.02, frac);
    enemy.barFg.position.x = -(1 - frac) * 0.43;
  }
}

export function updateCombat(state, dt) {
  const combat = state.combat;
  const player = state.player;
  if (!combat || !player) return;

  if (combat.cooldown > 0) combat.cooldown -= dt;
  if (combat.muzzleTimer > 0) {
    combat.muzzleTimer -= dt;
    if (combat.muzzleTimer <= 0) {
      combat.muzzleFlash.visible = false;
      combat.muzzleFlash.material.opacity = 0;
    }
  }
  if (combat.reloadTimer > 0) {
    combat.reloadTimer -= dt;
    if (combat.reloadTimer <= 0) {
      const weapon = combat.weapons[player.weaponIndex];
      if (weapon && weapon.magSize !== Infinity) {
        const need = weapon.magSize - weapon.ammo;
        const take = Math.min(need, weapon.reserve);
        weapon.ammo += take;
        weapon.reserve -= take;
      }
    }
  }
  if (combat.shake > 0) {
    combat.shake = Math.max(0, combat.shake - dt * 2.2);
    combat.shakeX = (Math.random() - 0.5) * combat.shake * 0.5;
    combat.shakeY = (Math.random() - 0.5) * combat.shake * 0.35;
  } else {
    combat.shakeX = 0;
    combat.shakeY = 0;
  }

  for (const enemy of combat.enemies) updateEnemy(state, enemy, dt);

  for (let i = combat.tracers.length - 1; i >= 0; i--) {
    const tracer = combat.tracers[i];
    tracer.life -= dt;
    if (tracer.life <= 0) {
      state.scene.remove(tracer.line);
      tracer.line.geometry.dispose();
      combat.tracers.splice(i, 1);
    } else {
      tracer.line.material.opacity = tracer.life / tracer.maxLife;
    }
  }

  for (let i = combat.particles.length - 1; i >= 0; i--) {
    const p = combat.particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      state.scene.remove(p.mesh);
      combat.particles.splice(i, 1);
      continue;
    }
    p.vy -= 9.8 * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    if (p.mesh.position.y < 0.05) {
      p.mesh.position.y = 0.05;
      p.vy = 0;
    }
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
  }

  combat.enemies = combat.enemies.filter((e) => (e.group && e.group.visible) || e.fallTimer > 0);
}
