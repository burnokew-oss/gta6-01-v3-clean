import * as ThreeLib from 'three';
const THREE = (ThreeLib && typeof ThreeLib.Scene === 'function') ? ThreeLib : (typeof globalThis !== 'undefined' && globalThis.THREE ? globalThis.THREE : (() => { throw new Error('Three.js is not available: the vendored module has no Scene export and no global THREE object exists on the page.'); })());
import { CONFIG } from './config.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

export function roadList(state) {
  const net = state.city || {};
  const raw = net.roads || net.segments || net.streets || [];
  const out = [];
  for (const r of raw) {
    const a = r.start || r.a || r.from || r.p0;
    const b = r.end || r.b || r.to || r.p1;
    if (!a || !b) continue;
    const ax = a.x !== undefined ? a.x : a[0];
    const az = a.z !== undefined ? a.z : a[1];
    const bx = b.x !== undefined ? b.x : b[0];
    const bz = b.z !== undefined ? b.z : b[1];
    if (typeof ax !== 'number' || typeof az !== 'number') continue;
    if (typeof bx !== 'number' || typeof bz !== 'number') continue;
    out.push({ ax, az, bx, bz });
  }
  if (out.length === 0) {
    const half = (state.worldSize || 320) / 2;
    const step = 64;
    for (let x = -half + step; x < half; x += step) {
      out.push({ ax: x, az: -half, bx: x, bz: half });
    }
    for (let z = -half + step; z < half; z += step) {
      out.push({ ax: -half, az: z, bx: half, bz: z });
    }
  }
  return out;
}

function roadPoint(road, t) {
  return {
    x: road.ax + (road.bx - road.ax) * t,
    z: road.az + (road.bz - road.az) * t,
  };
}

function roadLength(road) {
  return Math.hypot(road.bx - road.ax, road.bz - road.az);
}

function roadHeading(road) {
  return Math.atan2(road.bx - road.ax, road.bz - road.az);
}

const CAR_TYPES = {
  sedan: { maxSpeed: 26, accel: 11, turn: 2.1, length: 4.4, width: 1.9, colors: [0x8a97a8, 0x5a6b7d, 0xb8b0a0, 0x3d4a5c] },
  taxi: { maxSpeed: 24, accel: 10, turn: 2.2, length: 4.4, width: 1.9, colors: [0xf5c518, 0xf5c518, 0xe8b400] },
  truck: { maxSpeed: 18, accel: 6, turn: 1.4, length: 7.2, width: 2.4, colors: [0x7a4a2a, 0x4a6b8a, 0x8a8a7a] },
  sport: { maxSpeed: 46, accel: 17, turn: 2.6, length: 4.3, width: 2.0, colors: [0xd21f2b, 0xd21f2b, 0x1f6fd2, 0xe8e8e8] },
  van: { maxSpeed: 21, accel: 8, turn: 1.8, length: 5.2, width: 2.1, colors: [0x9aa5b1, 0x6b7a6b, 0xb0a090] },
  police: { maxSpeed: 34, accel: 14, turn: 2.4, length: 4.6, width: 2.0, colors: [0xf2f4f6] },
};

function plateTexture(text) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f4f6f8';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#22303c';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, 250, 58);
    ctx.fillStyle = '#16222e';
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 34);
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 4;
    return tex;
  } catch (err) {
    return null;
  }
}

function roundedBody(color, length, width, height) {
  const geo = new THREE.CapsuleGeometry(width / 2, length - width, 6, 16);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, roughness: 0.28, metalness: 0.65,
  }));
  mesh.rotation.x = Math.PI / 2;
  mesh.scale.set(1, 1, height / width);
  mesh.castShadow = true;
  return mesh;
}

function makeWheel(radius, width) {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 20),
    new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9, metalness: 0.1 }),
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  group.add(tire);
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, width + 0.02, 16),
    new THREE.MeshStandardMaterial({ color: 0xc8ccd2, roughness: 0.3, metalness: 0.85 }),
  );
  hub.rotation.z = Math.PI / 2;
  group.add(hub);
  return group;
}

export function buildCarMesh(type, color, plate) {
  const spec = CAR_TYPES[type] || CAR_TYPES.sedan;
  const group = new THREE.Group();
  const len = spec.length;
  const wid = spec.width;

  const body = roundedBody(color, len, wid, 0.72);
  body.position.y = 0.62;
  group.add(body);

  const cabin = roundedBody(0x1c2733, len * 0.48, wid * 0.86, 0.62);
  cabin.position.set(0, 1.02, -len * 0.04);
  cabin.scale.set(1, 1, 0.9);
  const cabinMat = cabin.material;
  cabinMat.roughness = 0.12;
  cabinMat.metalness = 0.4;
  group.add(cabin);

  const hoodLine = new THREE.Mesh(
    new THREE.BoxGeometry(wid * 0.7, 0.05, len * 0.22),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.6 }),
  );
  hoodLine.position.set(0, 0.94, len * 0.3);
  group.add(hoodLine);

  const wheelY = 0.36;
  const wheelX = wid / 2 - 0.06;
  const wheelZ = len * 0.32;
  const wheelR = type === 'truck' ? 0.46 : 0.36;
  for (const [x, z] of [[-wheelX, wheelZ], [wheelX, wheelZ], [-wheelX, -wheelZ], [wheelX, -wheelZ]]) {
    const wheel = makeWheel(wheelR, 0.28);
    wheel.position.set(x, wheelY, z);
    group.add(wheel);
  }

  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfff6c8, emissive: 0xffedb0, emissiveIntensity: 1.6, roughness: 0.3,
  });
  for (const x of [-wid * 0.32, wid * 0.32]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), lightMat);
    lamp.position.set(x, 0.66, len / 2 - 0.05);
    lamp.scale.set(1.4, 0.8, 0.6);
    group.add(lamp);
  }
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xaa1010, emissive: 0xd21f2b, emissiveIntensity: 1.2, roughness: 0.3,
  });
  for (const x of [-wid * 0.32, wid * 0.32]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.06), tailMat);
    lamp.position.set(x, 0.7, -len / 2 + 0.02);
    group.add(lamp);
  }

  if (type === 'sport') {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.94, 0.06, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.35, metalness: 0.6 }),
    );
    wing.position.set(0, 1.06, -len / 2 + 0.28);
    wing.castShadow = true;
    group.add(wing);
    for (const x of [-wid * 0.32, wid * 0.32]) {
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.22, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.4, metalness: 0.5 }),
      );
      strut.position.set(x, 0.92, -len / 2 + 0.28);
      group.add(strut);
    }
  }

  if (type === 'police') {
    const barBase = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.6, 0.09, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.4, metalness: 0.4 }),
    );
    barBase.position.set(0, 1.38, -len * 0.04);
    group.add(barBase);
    const red = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.28, 0.12, 0.26),
      new THREE.MeshStandardMaterial({ color: 0xd21f2b, emissive: 0xff2222, emissiveIntensity: 2.2 }),
    );
    red.position.set(-wid * 0.15, 1.44, -len * 0.04);
    red.name = 'sirenRed';
    group.add(red);
    const blue = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.28, 0.12, 0.26),
      new THREE.MeshStandardMaterial({ color: 0x2244ff, emissive: 0x3355ff, emissiveIntensity: 2.2 }),
    );
    blue.position.set(wid * 0.15, 1.44, -len * 0.04);
    blue.name = 'sirenBlue';
    group.add(blue);
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(wid * 0.98, 0.16, len * 0.7),
      new THREE.MeshStandardMaterial({ color: 0x16222e, roughness: 0.5, metalness: 0.3 }),
    );
    stripe.position.set(0, 0.62, 0);
    group.add(stripe);
  }

  if (type === 'taxi') {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.16, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xffe27a, emissiveIntensity: 0.9 }),
    );
    sign.position.set(0, 1.42, -len * 0.04);
    group.add(sign);
  }

  if (plate) {
    const tex = plateTexture(plate);
    const mat = tex
      ? new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.1 })
      : new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.5 });
    const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.24, 0.04), mat);
    plateMesh.position.set(0, 0.52, -len / 2 - 0.03);
    group.add(plateMesh);
  }

  const smoke = new THREE.Mesh(
    new THREE.SphereGeometry(0.7, 10, 8),
    new THREE.MeshStandardMaterial({
      color: 0x555a60, roughness: 1, transparent: true, opacity: 0,
    }),
  );
  smoke.position.set(0, 1.1, len * 0.28);
  smoke.name = 'smoke';
  group.add(smoke);

  group.userData.spec = spec;
  return group;
}

export function spawnCar(state, type, x, z, heading, driver) {
  const spec = CAR_TYPES[type] || CAR_TYPES.sedan;
  const palette = spec.colors;
  const color = palette[Math.floor(Math.random() * palette.length)];
  const plate = type === 'sport' && driver === 'player' ? 'TC · RAKA' : null;
  const group = buildCarMesh(type, color, plate);
  group.position.set(x, 0, z);
  group.rotation.y = heading;
  state.scene.add(group);
  const car = {
    group,
    type,
    color,
    position: group.position,
    heading,
    speed: 0,
    maxSpeed: spec.maxSpeed,
    accel: spec.accel,
    turnRate: spec.turn,
    length: spec.length,
    width: spec.width,
    condition: 100,
    driver: driver || 'ai',
    parked: driver === 'none',
    roadIndex: -1,
    roadT: 0,
    laneOffset: 2.1,
    targetSpeed: spec.maxSpeed * (0.55 + Math.random() * 0.25),
    siren: false,
    nos: 100,
    steering: 0,
    smokeTimer: 0,
    blockedTimer: 0,
    overtakeTimer: 0,
    exploded: false,
    plate,
    aiWait: 0,
  };
  return car;
}

function nearestRoadIndex(state, x, z) {
  const roads = roadList(state);
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    const dx = r.bx - r.ax;
    const dz = r.bz - r.az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - r.ax) * dx + (z - r.az) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = r.ax + dx * t;
    const pz = r.az + dz * t;
    const d = (x - px) * (x - px) + (z - pz) * (z - pz);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { index: best, dist: Math.sqrt(bestD) };
}

export function createTraffic(state, count) {
  const total = count || pickNumber([CONFIG?.traffic?.count, CONFIG?.trafficCount], 16);
  const cars = [];
  const roads = roadList(state);
  const playerPos = state.player?.position || { x: 0, z: 0 };
  const types = ['sedan', 'sedan', 'taxi', 'sport', 'van', 'truck', 'sedan'];

  for (let i = 0; i < total; i++) {
    const road = roads[Math.floor(Math.random() * roads.length)];
    const t = Math.random();
    const p = roadPoint(road, t);
    const heading = roadHeading(road) + (Math.random() < 0.5 ? 0 : Math.PI);
    const type = types[Math.floor(Math.random() * types.length)];
    const car = spawnCar(state, type, p.x, p.z, heading, 'ai');
    car.roadIndex = roads.indexOf(road);
    car.roadT = t;
    car.laneOffset = 2.1;
    cars.push(car);
  }

  const parkedCount = 6;
  for (let i = 0; i < parkedCount; i++) {
    const road = roads[Math.floor(Math.random() * roads.length)];
    const t = Math.random();
    const p = roadPoint(road, t);
    const heading = roadHeading(road);
    const type = types[Math.floor(Math.random() * types.length)];
    const car = spawnCar(state, type, p.x + 5.4, p.z, heading, 'none');
    car.roadIndex = roads.indexOf(road);
    car.roadT = t;
    cars.push(car);
  }

  const playerCar = spawnCar(state, 'sport', playerPos.x + 6, playerPos.z + 4, Math.PI / 2, 'none');
  playerCar.plate = 'TC · RAKA';
  cars.push(playerCar);
  state.playerCar = playerCar;

  state.cars = cars;
  return cars;
}

export function nearestCar(state, point, maxDist) {
  const cars = state.cars || [];
  let best = null;
  let bestD = maxDist * maxDist;
  for (const car of cars) {
    if (car.exploded) continue;
    const dx = car.position.x - point.x;
    const dz = car.position.z - point.z;
    const d = dx * dx + dz * dz;
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

function pickNextRoad(state, road, endX, endZ) {
  const roads = roadList(state);
  const options = [];
  for (let i = 0; i < roads.length; i++) {
    const r = roads[i];
    if (i === road) continue;
    const dStart = Math.hypot(r.ax - endX, r.az - endZ);
    const dEnd = Math.hypot(r.bx - endX, r.bz - endZ);
    if (dStart < 1.5 || dEnd < 1.5) options.push(i);
  }
  if (options.length === 0) return road;
  return options[Math.floor(Math.random() * options.length)];
}

function carAhead(state, car, lookAhead) {
  const cars = state.cars || [];
  const fx = Math.sin(car.heading);
  const fz = Math.cos(car.heading);
  let nearest = null;
  let nearestD = lookAhead;
  for (const other of cars) {
    if (other === car || other.exploded) continue;
    const dx = other.position.x - car.position.x;
    const dz = other.position.z - car.position.z;
    const along = dx * fx + dz * fz;
    if (along < 0 || along > lookAhead) continue;
    const side = Math.abs(dx * fz - dz * fx);
    if (side < 2.6 && along < nearestD) {
      nearestD = along;
      nearest = other;
    }
  }
  return nearest;
}

function updateAiCar(state, car, dt) {
  const roads = roadList(state);
  if (car.roadIndex < 0 || car.roadIndex >= roads.length) {
    const found = nearestRoadIndex(state, car.position.x, car.position.z);
    car.roadIndex = found.index;
    car.roadT = 0.5;
  }
  const road = roads[car.roadIndex];
  const len = roadLength(road) || 1;
  const dir = Math.sign(Math.cos(car.heading - roadHeading(road))) || 1;
  const step = (car.speed * dt) / len;
  car.roadT += dir * step;

  const blocker = carAhead(state, car, 11);
  if (blocker) {
    car.blockedTimer += dt;
    if (car.blockedTimer > 3 && car.overtakeTimer <= 0) {
      car.overtakeTimer = 4;
      car.laneOffset = -Math.abs(car.laneOffset);
    }
  } else {
    car.blockedTimer = 0;
  }
  if (car.overtakeTimer > 0) {
    car.overtakeTimer -= dt;
    if (car.overtakeTimer <= 0) car.laneOffset = Math.abs(car.laneOffset);
  }
  const want = blocker ? Math.max(0, blocker.speed * 0.7) : car.targetSpeed;
  const accelRate = want > car.speed ? car.accel * 0.45 : car.accel * 1.4;
  car.speed += Math.sign(want - car.speed) * Math.min(Math.abs(want - car.speed), accelRate * dt);

  if (car.roadT >= 1 || car.roadT <= 0) {
    const endX = car.roadT >= 1 ? road.bx : road.ax;
    const endZ = car.roadT >= 1 ? road.bz : road.az;
    const next = pickNextRoad(state, car.roadIndex, endX, endZ);
    car.roadIndex = next;
    car.roadT = car.roadT >= 1 ? 0 : 1;
  }

  const target = roadPoint(roads[car.roadIndex], car.roadT);
  const heading = roadHeading(roads[car.roadIndex]);
  const driveHeading = dir > 0 ? heading : heading + Math.PI;
  const laneSide = dir > 0 ? 1 : -1;
  const offX = Math.cos(driveHeading) * car.laneOffset * laneSide;
  const offZ = -Math.sin(driveHeading) * car.laneOffset * laneSide;
  const tx = target.x + offX;
  const tz = target.z + offZ;
  car.position.x += (tx - car.position.x) * Math.min(1, dt * 3);
  car.position.z += (tz - car.position.z) * Math.min(1, dt * 3);

  let diff = driveHeading - car.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.heading += diff * Math.min(1, dt * 4);
  car.group.rotation.y = car.heading;
}

export function damageCar(state, car, amount) {
  if (car.exploded) return;
  car.condition -= amount;
  if (car.condition <= 0) {
    car.condition = 0;
    explodeCar(state, car);
  }
}

export function explodeCar(state, car) {
  if (car.exploded) return;
  car.exploded = true;
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 14, 12),
    new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.95 }),
  );
  flash.position.copy(car.position);
  flash.position.y = 1.2;
  state.scene.add(flash);
  state.effects = state.effects || [];
  state.effects.push({ mesh: flash, life: 0.5, maxLife: 0.5, kind: 'flash' });
  car.group.visible = false;
  state.audioApi?.play?.('gunshot');
  state.combatApi?.addShake?.(state, 0.7);

  const player = state.player;
  if (player) {
    const d = Math.hypot(player.position.x - car.position.x, player.position.z - car.position.z);
    if (d < 7 && player.car !== car) {
      state.playerApi?.damagePlayer?.(state, 30);
    }
    if (player.car === car) {
      player.car = null;
      player.group.visible = true;
      player.position.copy(car.position);
      player.position.x += 3;
      state.playerApi?.damagePlayer?.(state, 35);
    }
  }
  for (const other of state.cars || []) {
    if (other === car || other.exploded) continue;
    const d = Math.hypot(other.position.x - car.position.x, other.position.z - car.position.z);
    if (d < 6) damageCar(state, other, 45);
  }
  state.pedsApi?.scarePeds?.(state, car.position.x, car.position.z, 26);
}

export function drivePlayerCar(state, dt) {
  const player = state.player;
  if (!player) return;
  const car = player.car;
  if (!car || !car.position || !car.group) return;
  const input = state.input;
  const keys = input?.keys || {};
  const forward = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  const steerInput = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  const handbrake = Boolean(keys.Space);
  const wantNos = Boolean(keys.ShiftLeft || keys.ShiftRight) && forward > 0 && car.nos > 0;

  let top = car.maxSpeed;
  if (wantNos) {
    top = car.maxSpeed * 1.35;
    car.nos = Math.max(0, car.nos - dt * 34);
  } else {
    car.nos = Math.min(100, car.nos + dt * 4);
  }

  if (forward > 0) {
    car.speed += car.accel * dt * (car.speed < 0 ? 2.4 : 1);
  } else if (forward < 0) {
    if (car.speed > 0.5) car.speed -= car.accel * 1.8 * dt;
    else car.speed -= car.accel * 0.6 * dt;
  } else {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 6 * dt);
  }
  if (handbrake) {
    car.speed -= Math.sign(car.speed) * Math.min(Math.abs(car.speed), 22 * dt);
  }
  car.speed = Math.max(-car.maxSpeed * 0.35, Math.min(top, car.speed));

  const speedFactor = Math.min(1, Math.abs(car.speed) / 12);
  const steerTarget = steerInput * car.turnRate * speedFactor * (car.speed < 0 ? -1 : 1);
  car.steering += (steerTarget - car.steering) * Math.min(1, dt * 7);
  const drift = handbrake ? 1.7 : 1;
  car.heading += car.steering * dt * drift * (Math.abs(car.speed) > 0.3 ? 1 : 0);

  const fx = Math.sin(car.heading);
  const fz = Math.cos(car.heading);
  car.position.x += fx * car.speed * dt;
  car.position.z += fz * car.speed * dt;
  const half = (state.worldSize || 320) / 2 - 3;
  car.position.x = Math.max(-half, Math.min(half, car.position.x));
  car.position.z = Math.max(-half, Math.min(half, car.position.z));
  const hitBound = car.position.x <= -half + 0.01 || car.position.x >= half - 0.01
    || car.position.z <= -half + 0.01 || car.position.z >= half - 0.01;
  if (hitBound && Math.abs(car.speed) > 8) {
    damageCar(state, car, Math.abs(car.speed) * 0.9);
    car.speed *= -0.3;
    state.combatApi?.addShake?.(state, 0.4);
    state.audioApi?.play?.('punch');
  }
  car.group.rotation.y = car.heading;
  car.group.position.y = 0;

  const blocker = carAhead(state, car, 5.5);
  if (blocker && Math.abs(car.speed) > 3) {
    const impact = Math.abs(car.speed);
    car.speed *= -0.25;
    blocker.speed = Math.max(blocker.speed, impact * 0.4);
    damageCar(state, car, impact * 1.1);
    damageCar(state, blocker, impact * 0.8);
    state.combatApi?.addShake?.(state, Math.min(0.5, impact * 0.02));
    state.audioApi?.play?.('punch');
  }
  if (player.position && typeof player.position.copy === 'function') {
    player.position.copy(car.position);
  } else if (player.position && car.position) {
    player.position.x = car.position.x;
    player.position.z = car.position.z;
  }
  player.speedKmh = Math.abs(car.speed) * 3.6;
  player.heading = car.heading;
  state.cameraYaw = car.heading + Math.PI;
  updateCarSmoke(state, car, dt);
}

function updateCarSmoke(state, car, dt) {
  const smoke = car.group.getObjectByName('smoke');
  if (!smoke) return;
  if (car.condition < 45 && !car.exploded) {
    car.smokeTimer += dt;
    const puff = 0.25 + 0.55 * Math.abs(Math.sin(car.smokeTimer * 5));
    smoke.material.opacity = Math.min(0.75, puff);
    const s = 0.8 + 0.5 * Math.abs(Math.sin(car.smokeTimer * 3));
    smoke.scale.set(s, s, s);
    smoke.position.y = 1.1 + 0.3 * Math.sin(car.smokeTimer * 6);
  } else {
    smoke.material.opacity = 0;
  }
}

function updateSirenLights(car, time) {
  const red = car.group.getObjectByName('sirenRed');
  const blue = car.group.getObjectByName('sirenBlue');
  if (!red || !blue) return;
  const phase = Math.floor(time * 6) % 2 === 0;
  red.material.emissiveIntensity = phase ? 3.2 : 0.25;
  blue.material.emissiveIntensity = phase ? 0.25 : 3.2;
}

export function updateTraffic(state, dt) {
  const cars = state.cars || [];
  const playerPos = state.player?.position || { x: 0, z: 0 };
  const time = state.time || 0;

  for (const car of cars) {
    if (car.exploded) continue;
    if (car.police) {
      updateCarSmoke(state, car, dt);
      if (car.siren) updateSirenLights(car, time);
      continue;
    }
    if (car.driver === 'player') {
      updateCarSmoke(state, car, dt);
      if (car.siren) updateSirenLights(car, time);
      continue;
    }
    if (car.driver === 'ai') {
      const dist = Math.hypot(car.position.x - playerPos.x, car.position.z - playerPos.z);
      if (dist > 300) {
        const roads = roadList(state);
        const road = roads[Math.floor(Math.random() * roads.length)];
        const t = Math.random();
        const p = roadPoint(road, t);
        car.position.set(p.x, 0, p.z);
        car.roadIndex = roads.indexOf(road);
        car.roadT = t;
        car.heading = roadHeading(road);
        car.speed = car.targetSpeed * 0.5;
      }
      updateAiCar(state, car, dt);
      if (car.siren) updateSirenLights(car, time);
      updateCarSmoke(state, car, dt);
    }
  }

  for (let i = 0; i < cars.length; i++) {
    const a = cars[i];
    if (a.exploded || a.driver === 'player') continue;
    for (let j = i + 1; j < cars.length; j++) {
      const b = cars[j];
      if (b.exploded) continue;
      const dx = b.position.x - a.position.x;
      const dz = b.position.z - a.position.z;
      const d = Math.hypot(dx, dz);
      const minD = (a.length + b.length) / 2 - 1.2;
      if (d > 0.01 && d < minD) {
        const push = (minD - d) / 2;
        const nx = dx / d;
        const nz = dz / d;
        if (a.driver === 'ai') {
          a.position.x -= nx * push;
          a.position.z -= nz * push;
        }
        if (b.driver === 'ai') {
          b.position.x += nx * push;
          b.position.z += nz * push;
        }
      }
    }
  }
}
