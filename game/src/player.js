import * as ThreeLib from 'three';
const THREE = (ThreeLib && typeof ThreeLib.Scene === 'function') ? ThreeLib : (typeof globalThis !== 'undefined' && globalThis.THREE ? globalThis.THREE : (() => { throw new Error('Three.js is not available: the vendored module has no Scene export and no global THREE object exists on the page.'); })());
import { CONFIG } from './config.js';
import { nearestCar, drivePlayerCar } from './vehicles.js';
import { reloadWeapon } from './combat.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

function pickPoint(state, names, fallback) {
  const points = state.city?.points || state.city || {};
  for (const name of names) {
    const p = points[name];
    if (p && typeof p.x === 'number' && typeof p.z === 'number') {
      return { x: p.x, y: typeof p.y === 'number' ? p.y : 0, z: p.z };
    }
    if (Array.isArray(p) && p.length >= 2) return { x: p[0], y: 0, z: p[1] };
  }
  return fallback;
}

function smoothMaterial(color, rough, metal) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough === undefined ? 0.75 : rough,
    metalness: metal === undefined ? 0.05 : metal,
  });
}

function limb(radius, length, color) {
  const mesh = new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, 6, 12),
    smoothMaterial(color, 0.8, 0),
  );
  mesh.castShadow = true;
  return mesh;
}

export function buildHumanoidMesh(options) {
  const opts = options || {};
  const skin = opts.skin === undefined ? 0xd9a066 : opts.skin;
  const shirt = opts.shirt === undefined ? 0x2f5fd0 : opts.shirt;
  const pants = opts.pants === undefined ? 0x23283a : opts.pants;
  const hat = opts.hat === undefined ? 0x1a1d24 : opts.hat;
  const group = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.34, 0.62, 6, 14),
    smoothMaterial(shirt, 0.85, 0),
  );
  torso.position.y = 1.08;
  torso.scale.set(1.15, 1, 0.82);
  torso.castShadow = true;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 16),
    smoothMaterial(skin, 0.65, 0),
  );
  head.position.y = 1.78;
  head.castShadow = true;
  group.add(head);

  if (opts.hat !== null) {
    const capTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.27, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      smoothMaterial(hat, 0.9, 0),
    );
    capTop.position.y = 1.82;
    capTop.castShadow = true;
    group.add(capTop);
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.27, 0.27, 0.03, 20, 1, false, -0.6, 1.2),
      smoothMaterial(hat, 0.9, 0),
    );
    brim.position.set(0, 1.9, 0.22);
    brim.rotation.x = 0.12;
    group.add(brim);
  }

  const armL = limb(0.09, 0.5, shirt);
  armL.position.set(-0.46, 1.12, 0);
  group.add(armL);
  const armR = limb(0.09, 0.5, shirt);
  armR.position.set(0.46, 1.12, 0);
  group.add(armR);
  const handL = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    smoothMaterial(skin, 0.65, 0),
  );
  handL.position.set(-0.46, 0.72, 0);
  group.add(handL);
  const handR = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 12, 10),
    smoothMaterial(skin, 0.65, 0),
  );
  handR.position.set(0.46, 0.72, 0);
  group.add(handR);

  const legL = limb(0.11, 0.55, pants);
  legL.position.set(-0.17, 0.48, 0);
  group.add(legL);
  const legR = limb(0.11, 0.55, pants);
  legR.position.set(0.17, 0.48, 0);
  group.add(legR);

  group.userData.limbs = { armL, armR, legL, legR, head };
  return group;
}

export function createPlayer(state) {
  const walkSpeed = pickNumber(
    [CONFIG?.player?.walkSpeed, CONFIG?.walkSpeed, CONFIG?.playerWalkSpeed],
    4.2,
  );
  const runSpeed = pickNumber(
    [CONFIG?.player?.runSpeed, CONFIG?.runSpeed, CONFIG?.playerRunSpeed],
    7.6,
  );
  const start = pickPoint(state, ['playerStart', 'start', 'spawn'], { x: 0, y: 0, z: 0 });

  const group = buildHumanoidMesh({ shirt: 0x2f5fd0, pants: 0x23283a, hat: 0x1a1d24 });
  group.position.set(start.x, start.y, start.z);
  state.scene.add(group);

  const player = {
    group,
    position: group.position,
    heading: 0,
    speedKmh: 0,
    hp: 100,
    armor: 0,
    weaponIndex: 0,
    car: null,
    walkSpeed,
    runSpeed,
    velocity: new THREE.Vector3(),
    walkPhase: 0,
    sprinting: false,
    moving: false,
    dead: false,
    respawnTimer: 0,
    hurtTimer: 0,
    lastDamageAt: -999,
    aimYaw: 0,
  };
  state.player = player;
  return player;
}

export function damagePlayer(state, amount) {
  const player = state.player;
  if (!player || player.dead || amount <= 0) return;
  let remaining = amount;
  if (player.armor > 0) {
    const absorbed = Math.min(player.armor, remaining);
    player.armor -= absorbed;
    remaining -= absorbed;
  }
  player.hp -= remaining;
  player.hurtTimer = 0.55;
  player.lastDamageAt = state.time || 0;
  if (player.hp <= 0) {
    player.hp = 0;
    wastePlayer(state);
  }
}

export function wastePlayer(state) {
  const player = state.player;
  if (!player || player.dead) return;
  player.dead = true;
  player.deathCause = 'wasted';
  player.respawnTimer = 2.2;
  if (player.car) {
    player.car.driver = 'none';
    player.car = null;
  }
  const cut = Math.floor((state.cash || 0) * 0.1);
  state.cash = Math.max(0, (state.cash || 0) - cut);
  state.ui?.banner?.('WASTED');
  state.audioApi?.play?.('mission');
  state.stats = state.stats || {};
  state.stats.wasted = (state.stats.wasted || 0) + 1;
}

export function bustPlayer(state) {
  const player = state.player;
  if (!player || player.dead) return;
  player.dead = true;
  player.deathCause = 'busted';
  player.respawnTimer = 2.2;
  if (player.car) {
    player.car.driver = 'none';
    player.car = null;
  }
  const fine = Math.min(250, state.cash || 0);
  state.cash = Math.max(0, (state.cash || 0) - fine);
  if (state.wanted > 0) {
    state.wanted = 0;
    state.police?.clearUnits?.();
  }
  state.ui?.banner?.('BUSTED');
  state.audioApi?.play?.('mission');
  state.stats = state.stats || {};
  state.stats.busted = (state.stats.busted || 0) + 1;
}

function respawnPlayer(state) {
  const player = state.player;
  const hospital = pickPoint(state, ['hospital', 'clinic'], { x: 0, y: 0, z: 0 });
  const station = pickPoint(state, ['policeStation', 'station'], hospital);
  const spot = player.deathCause === 'busted' ? station : hospital;
  player.deathCause = null;
  player.position.set(spot.x, spot.y, spot.z);
  player.velocity.set(0, 0, 0);
  player.hp = 100;
  player.armor = 0;
  player.dead = false;
  player.heading = 0;
  state.ui?.banner?.('Kamu kembali ke jalanan Teluk Cerah');
}

function tryEnterCar(state, steal) {
  const player = state.player;
  const car = nearestCar(state, player.position, 4.5);
  if (!car) return false;
  if (car.driver === 'player') return false;
  if (car.driver === 'ai' && !steal) return false;
  if (steal) {
    car.driver = 'none';
    state.policeApi?.addHeat?.(state, 1);
    state.stats = state.stats || {};
    state.stats.carsStolen = (state.stats.carsStolen || 0) + 1;
    state.ui?.banner?.('Mobil dicuri!');
  } else if (car.plate === 'TC · RAKA') {
    state.ui?.banner?.('Mobilmu, Raka.');
  }
  car.driver = 'player';
  player.car = car;
  player.group.visible = false;
  state.audioApi?.play?.('pickup');
  return true;
}

export function exitCar(state) {
  const player = state.player;
  const car = player.car;
  if (!car) return;
  if (car.exploded) {
    player.car = null;
    player.group.visible = true;
    return;
  }
  car.driver = 'none';
  player.car = null;
  const side = new THREE.Vector3(Math.cos(car.heading + Math.PI / 2), 0, -Math.sin(car.heading + Math.PI / 2));
  player.position.copy(car.position).addScaledVector(side, 2.2);
  player.position.y = 0;
  player.heading = car.heading;
  player.group.visible = true;
  player.group.position.copy(player.position);
}

function updateOnFoot(state, dt) {
  const player = state.player;
  const input = state.input;
  const keys = input?.keys || {};

  let forward = 0;
  let strafe = 0;
  if (keys.KeyW || keys.ArrowUp) forward += 1;
  if (keys.KeyS || keys.ArrowDown) forward -= 1;
  if (keys.KeyA || keys.ArrowLeft) strafe -= 1;
  if (keys.KeyD || keys.ArrowRight) strafe += 1;

  const mouseDx = input?.mouse?.dx || 0;
  if (mouseDx) state.cameraYaw = (state.cameraYaw || 0) - mouseDx * 0.0032;

  player.sprinting = Boolean(keys.ShiftLeft || keys.ShiftRight) && forward > 0;
  const topSpeed = player.sprinting ? player.runSpeed : player.walkSpeed;
  const yaw = state.cameraYaw || 0;
  const sin = Math.sin(yaw);
  const cos = Math.cos(yaw);
  const dirX = -sin * forward + cos * strafe;
  const dirZ = -cos * forward - sin * strafe;
  const len = Math.hypot(dirX, dirZ);
  player.moving = len > 0.01;
  if (player.moving) {
    const nx = dirX / len;
    const nz = dirZ / len;
    player.velocity.x = nx * topSpeed;
    player.velocity.z = nz * topSpeed;
    player.speedKmh = topSpeed * 3.6;
    player.heading = Math.atan2(nx, nz);
    player.walkPhase += dt * topSpeed * 1.6;
  } else {
    player.velocity.x = 0;
    player.velocity.z = 0;
    player.speedKmh = 0;
  }

  player.position.x += player.velocity.x * dt;
  player.position.z += player.velocity.z * dt;
  const half = (state.worldSize || 320) / 2 - 4;
  player.position.x = Math.max(-half, Math.min(half, player.position.x));
  player.position.z = Math.max(-half, Math.min(half, player.position.z));
  player.position.y = 0;
  player.group.rotation.y = player.heading;

  const limbs = player.group.userData.limbs;
  if (limbs) {
    const swing = player.moving ? Math.sin(player.walkPhase) * (player.sprinting ? 0.85 : 0.6) : 0;
    limbs.legL.rotation.x = swing;
    limbs.legR.rotation.x = -swing;
    limbs.armL.rotation.x = -swing * 0.8;
    limbs.armR.rotation.x = swing * 0.8;
  }

  if (input?.takePressed?.('KeyE')) tryEnterCar(state, false);
  if (input?.takePressed?.('KeyF')) tryEnterCar(state, true);
  if (input?.takePressed?.('KeyR')) reloadWeapon(state);
  if (input?.mouse?.pressed) {
    state.combatApi?.fireWeapon?.(state);
  }

  collectShells(state);
}

function collectShells(state) {
  const spots = state.shellSpots;
  if (!Array.isArray(spots) || spots.length === 0) return;
  const player = state.player;
  for (const spot of spots) {
    if (spot.taken) continue;
    const dx = spot.x - player.position.x;
    const dz = spot.z - player.position.z;
    if (dx * dx + dz * dz < 4.2) {
      spot.taken = true;
      if (spot.mesh) spot.mesh.visible = false;
      state.shells = (state.shells || 0) + 1;
      state.audioApi?.play?.('pickup');
      state.ui?.banner?.('Kerang Teluk ditemukan! ' + state.shells + '/24');
    }
  }
}

export function updatePlayer(state, dt) {
  const player = state.player;
  if (!player) return;
  if (state.paused || state.titleOpen || state.mapOpen || state.dialogOpen) {
    player.speedKmh = 0;
    return;
  }
  if (player.dead) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) respawnPlayer(state);
    return;
  }
  if (player.hurtTimer > 0) player.hurtTimer -= dt;

  if (player.car) {
    drivePlayerCar(state, dt);
    if (state.input?.takePressed?.('KeyE')) exitCar(state);
    if (state.input?.takePressed?.('KeyR')) {
      state.radioApi?.nextStation?.(state);
    }
    return;
  }
  updateOnFoot(state, dt);
}
