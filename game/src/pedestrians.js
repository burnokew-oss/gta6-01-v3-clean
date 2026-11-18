import * as ThreeLib from 'three';
const THREE = (ThreeLib && typeof ThreeLib.Scene === 'function') ? ThreeLib : (typeof globalThis !== 'undefined' && globalThis.THREE ? globalThis.THREE : (() => { throw new Error('Three.js is not available: the vendored module has no Scene export and no global THREE object exists on the page.'); })());
import { CONFIG } from './config.js';
import { buildHumanoidMesh } from './player.js';
import { roadList } from './vehicles.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

const SHIRT_COLORS = [
  0xe8e4d8, 0x7fb069, 0xd96a8b, 0x4a90d9, 0xe0a458, 0x8e6cc8,
  0x3fa7a0, 0xc94f4f, 0x9b8de0, 0x5c7a5c, 0xd9c25a, 0x6b8cae,
];
const SKIN_TONES = [0xd9a066, 0xb97a4e, 0x8a5a34, 0xe8b98a, 0x6e4423];
const PANTS_COLORS = [0x23283a, 0x4a3a2a, 0x3a4a5c, 0x5c5c5c, 0x2a2a2a];

function randomSidewalkSpot(state, near, radius) {
  const roads = roadList(state);
  for (let tries = 0; tries < 12; tries++) {
    const road = roads[Math.floor(Math.random() * roads.length)];
    const t = Math.random();
    const x = road.ax + (road.bx - road.ax) * t;
    const z = road.az + (road.bz - road.az) * t;
    const dx = x - near.x;
    const dz = z - near.z;
    const d = Math.hypot(dx, dz);
    if (d < radius * 0.4 || d > radius) continue;
    const heading = Math.atan2(road.bx - road.ax, road.bz - road.az);
    const side = Math.random() < 0.5 ? 1 : -1;
    const off = 5.6 + Math.random() * 1.4;
    return {
      x: x + Math.cos(heading) * off * side,
      z: z - Math.sin(heading) * off * side,
      heading: heading + (Math.random() < 0.5 ? 0 : Math.PI),
    };
  }
  const angle = Math.random() * Math.PI * 2;
  const r = radius * (0.4 + Math.random() * 0.5);
  return { x: near.x + Math.cos(angle) * r, z: near.z + Math.sin(angle) * r, heading: angle };
}

function spawnPed(state, near, radius) {
  const spot = randomSidewalkSpot(state, near, radius);
  const shirt = SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)];
  const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
  const pants = PANTS_COLORS[Math.floor(Math.random() * PANTS_COLORS.length)];
  const useHat = Math.random() < 0.35;
  const group = buildHumanoidMesh({
    skin,
    shirt,
    pants,
    hat: useHat ? 0x2a2d34 : null,
  });
  const scale = 0.92 + Math.random() * 0.16;
  group.scale.setScalar(scale);
  group.position.set(spot.x, 0, spot.z);
  group.rotation.y = spot.heading;
  state.scene.add(group);
  const ped = {
    group,
    position: group.position,
    heading: spot.heading,
    speed: 0.9 + Math.random() * 0.9,
    walkSpeed: 0.9 + Math.random() * 0.9,
    state: 'walk',
    targetX: spot.x,
    targetZ: spot.z,
    walkPhase: Math.random() * Math.PI * 2,
    waitTimer: 0,
    fleeTimer: 0,
    panic: 0,
    health: 100,
    civilian: true,
  };
  return ped;
}

export function createPedestrians(state, count) {
  const total = count || pickNumber([CONFIG?.pedestrians?.count, CONFIG?.pedCount], 40);
  const near = state.player?.position || { x: 0, z: 0 };
  const peds = [];
  for (let i = 0; i < total; i++) {
    peds.push(spawnPed(state, near, 120));
  }
  state.peds = peds;
  state.pedsApi = {
    scarePeds: (st, x, z, radius) => scarePeds(st, x, z, radius),
  };
  return peds;
}

export function scarePeds(state, x, z, radius) {
  const peds = state.peds || [];
  for (const ped of peds) {
    const dx = ped.position.x - x;
    const dz = ped.position.z - z;
    const d = Math.hypot(dx, dz);
    if (d < radius) {
      ped.state = 'flee';
      ped.fleeTimer = 2.5 + Math.random() * 2;
      ped.panic = 1;
      const away = Math.atan2(dx, dz);
      ped.heading = away;
    }
  }
}

function pickNewTarget(state, ped) {
  const roads = roadList(state);
  const road = roads[Math.floor(Math.random() * roads.length)];
  const t = Math.random();
  const x = road.ax + (road.bx - road.ax) * t;
  const z = road.az + (road.bz - road.az) * t;
  const heading = Math.atan2(road.bx - road.ax, road.bz - road.az);
  const side = Math.random() < 0.5 ? 1 : -1;
  const off = 5.6 + Math.random() * 1.4;
  ped.targetX = x + Math.cos(heading) * off * side;
  ped.targetZ = z - Math.sin(heading) * off * side;
}

function updatePedWalk(state, ped, dt) {
  const dx = ped.targetX - ped.position.x;
  const dz = ped.targetZ - ped.position.z;
  const d = Math.hypot(dx, dz);
  if (d < 1.2) {
    if (ped.waitTimer > 0) {
      ped.waitTimer -= dt;
      ped.speed = 0;
      return;
    }
    if (Math.random() < 0.12) {
      ped.waitTimer = 1 + Math.random() * 3;
      return;
    }
    pickNewTarget(state, ped);
    return;
  }
  const wantHeading = Math.atan2(dx, dz);
  let diff = wantHeading - ped.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  ped.heading += diff * Math.min(1, dt * 5);
  ped.speed = ped.walkSpeed;
  ped.position.x += Math.sin(ped.heading) * ped.speed * dt;
  ped.position.z += Math.cos(ped.heading) * ped.speed * dt;
  ped.walkPhase += dt * ped.speed * 3.4;
}

function updatePedFlee(state, ped, dt) {
  ped.fleeTimer -= dt;
  if (ped.fleeTimer <= 0) {
    ped.state = 'walk';
    ped.panic = 0;
    pickNewTarget(state, ped);
    return;
  }
  const runSpeed = 5.2;
  ped.speed = runSpeed;
  ped.position.x += Math.sin(ped.heading) * runSpeed * dt;
  ped.position.z += Math.cos(ped.heading) * runSpeed * dt;
  ped.walkPhase += dt * runSpeed * 3.4;
  const player = state.player;
  if (player) {
    const dx = player.position.x - ped.position.x;
    const dz = player.position.z - ped.position.z;
    if (dx * dx + dz * dz < 9) {
      ped.heading = Math.atan2(-dx, -dz);
    }
  }
}

export function updatePedestrians(state, dt) {
  const peds = state.peds || [];
  const player = state.player;
  const near = player?.position || { x: 0, z: 0 };

  for (const ped of peds) {
    if (ped.health <= 0) continue;
    if (ped.state === 'flee') {
      updatePedFlee(state, ped, dt);
    } else {
      updatePedWalk(state, ped, dt);
    }
    ped.group.rotation.y = ped.heading;
    const limbs = ped.group.userData.limbs;
    if (limbs) {
      const swing = ped.speed > 0.1 ? Math.sin(ped.walkPhase) * (ped.state === 'flee' ? 0.95 : 0.55) : 0;
      limbs.legL.rotation.x = swing;
      limbs.legR.rotation.x = -swing;
      limbs.armL.rotation.x = -swing * 0.8;
      limbs.armR.rotation.x = swing * 0.8;
    }
  }

  const cars = state.cars || [];
  for (const ped of peds) {
    if (ped.state === 'flee' || ped.health <= 0) continue;
    for (const car of cars) {
      if (car.exploded) continue;
      const dx = ped.position.x - car.position.x;
      const dz = ped.position.z - car.position.z;
      const d2 = dx * dx + dz * dz;
      const fast = Math.abs(car.speed) > 9;
      if (d2 < 30 && (fast || car.driver === 'player')) {
        const along = dx * Math.sin(car.heading) + dz * Math.cos(car.heading);
        if (along > -2 && along < 12) {
          ped.state = 'flee';
          ped.fleeTimer = 2 + Math.random() * 2;
          ped.heading = Math.atan2(dx, dz);
          break;
        }
      }
    }
  }

  if (player && player.car) {
    for (const ped of peds) {
      if (ped.health <= 0) continue;
      const car = player.car;
      const dx = ped.position.x - car.position.x;
      const dz = ped.position.z - car.position.z;
      if (dx * dx + dz * dz < 4.2 && Math.abs(car.speed) > 4) {
        ped.health = 0;
        ped.group.visible = false;
        state.policeApi?.addHeat?.(state, 1);
        state.stats = state.stats || {};
        state.stats.takedowns = (state.stats.takedowns || 0) + 1;
        state.combatApi?.addShake?.(state, 0.4);
        scarePeds(state, ped.position.x, ped.position.z, 20);
      }
    }
  }

  for (const ped of peds) {
    const d = Math.hypot(ped.position.x - near.x, ped.position.z - near.z);
    if (d > 170 && ped.health > 0) {
      const spot = randomSidewalkSpot(state, near, 120);
      ped.position.set(spot.x, 0, spot.z);
      ped.heading = spot.heading;
      ped.group.rotation.y = spot.heading;
      ped.state = 'walk';
      ped.fleeTimer = 0;
      ped.panic = 0;
      pickNewTarget(state, ped);
    }
  }
}
