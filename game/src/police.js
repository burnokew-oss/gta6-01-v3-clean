import 'three';
const THREE = window.THREE;
import { buildCarMesh } from './vehicles.js';

const UNIT_NAMES = [
  { name: 'GARUDA-1', kind: 'heli', status: 'SOROT' },
  { name: 'CENDRAWASIH-07', kind: 'car', status: 'MENGEJAR' },
  { name: 'JALAK-42', kind: 'car', status: 'MENABRAK' },
  { name: 'BANGAU-18', kind: 'car', status: 'MENGEJAR' },
  { name: 'KAKATUA-31', kind: 'car', status: 'MENGEJAR' },
  { name: 'GARUDA-02', kind: 'car', status: 'PENGEJARAN' },
  { name: 'ELANG-09', kind: 'foot', status: 'PENGEJARAN' },
  { name: 'MERAK-12', kind: 'foot', status: 'PENGEJARAN' },
  { name: 'CENDRAWASIH-21', kind: 'foot', status: 'PENGEJARAN' },
];

function wantedOf(state) {
  return state.wanted || 0;
}

function playerPos(state) {
  if (state.player && state.player.group) return state.player.group.position;
  if (state.player && state.player.position) return state.player.position;
  return new THREE.Vector3(40, 0, 100);
}

export function createPolice(state) {
  const scene = state.world.scene;
  const units = [];
  const cars = [];
  const home = playerPos(state);
  for (let i = 0; i < UNIT_NAMES.length; i++) {
    const def = UNIT_NAMES[i];
    const unit = {
      name: def.name,
      kind: def.kind,
      status: def.status,
      distance: 6 + i * 4,
      car: null,
      group: null,
      position: new THREE.Vector3(home.x + 20 + i * 8, 0, home.z + 10),
      speed: 0,
      heading: 0,
      flashPhase: i * 0.5,
      slot: i,
    };
    if (def.kind === 'car') {
      const built = buildCarMesh('police', 0xf2f2f2, {});
      const car = {
        group: built.group,
        kind: 'police',
        speed: 0,
        maxSpeed: 24,
        heading: 0,
        angle: 0,
        health: 100,
        condition: 95,
        driver: null,
        parked: false,
        wheels: built.wheels,
        paintMat: built.paintMat,
        barL: built.barL,
        barR: built.barR,
        poolL: built.poolL,
        poolR: built.poolR,
        position: built.group.position,
      };
      car.group.position.set(home.x + 24 + i * 9, 0, home.z + (i % 2 === 0 ? 6 : -6));
      car.heading = -Math.PI / 2;
      car.group.rotation.y = car.heading;
      scene.add(car.group);
      unit.car = car;
      unit.group = car.group;
      unit.position = car.group.position;
      cars.push(car);
    }
    units.push(unit);
  }
  state.police = units;
  state.policeCars = cars;
  return units;
}

function flashBars(unit, t) {
  if (!unit.car) return;
  const phase = Math.floor(t * 3.2 + unit.flashPhase) % 2;
  const car = unit.car;
  if (car.barL && car.barL.material) {
    car.barL.material.color.setHex(phase === 0 ? 0xff2233 : 0x881122);
  }
  if (car.barR && car.barR.material) {
    car.barR.material.color.setHex(phase === 0 ? 0x112266 : 0x2266ff);
  }
  if (car.poolL) car.poolL.material.opacity = phase === 0 ? 0.55 : 0.05;
  if (car.poolR) car.poolR.material.opacity = phase === 0 ? 0.05 : 0.55;
}

export function updatePolice(state, dt) {
  const units = state.police || [];
  if (units.length === 0) return;
  const t = (state.world && state.world.elapsed !== undefined ? state.world.elapsed : performance.now() / 1000);
  const wanted = wantedOf(state);
  const pp = playerPos(state);
  const hero = state.player && state.player.car ? state.player.car : null;
  const shot = state.shotName || '';

  for (const unit of units) {
    if (unit.kind === 'heli') {
      unit.distance = 11;
      continue;
    }
    if (!unit.car) {
      const dx = pp.x - unit.position.x;
      const dz = pp.z - unit.position.z;
      const d = Math.hypot(dx, dz) || 1;
      unit.distance = Math.round(d);
      if (wanted > 0 && d > 1.4 && shot !== 'shootout') {
        const sp = 5.5 * (1 + wanted * 0.12);
        unit.position.x += (dx / d) * sp * dt;
        unit.position.z += (dz / d) * sp * dt;
      }
      continue;
    }
    const car = unit.car;
    flashBars(unit, t);
    if (shot === 'shootout') {
      car.speed = 0;
    } else if (shot === 'chase' && hero) {
      const slot = unit.slot || 0;
      const hx = hero.group.position.x;
      const hz = hero.group.position.z;
      const hh = hero.heading || 0;
      const fx = Math.sin(hh);
      const fz = Math.cos(hh);
      let tx = hx;
      let tz = hz;
      if (slot === 1) {
        tx = hx + fx * 2 + fz * 4.5;
        tz = hz + fz * 2 - fx * 4.5;
      } else if (slot === 2) {
        tx = hx + fx * 2 - fz * 4.5;
        tz = hz + fz * 2 + fx * 4.5;
      } else if (slot === 3) {
        tx = hx + fx * 25;
        tz = hz + fz * 25;
      } else {
        const d = 12 + slot * 5;
        tx = hx - fx * d;
        tz = hz - fz * d;
      }
      car.group.position.x += (tx - car.group.position.x) * Math.min(1, dt * 3);
      car.group.position.z += (tz - car.group.position.z) * Math.min(1, dt * 3);
      if (shot === 'chase') {
        car.group.position.x = tx;
        car.group.position.z = tz;
      }
      car.heading = hh;
      car.group.rotation.y = hh;
      car.speed = hero.speed || 0;
    } else if (wanted > 0) {
      const dx = pp.x - car.group.position.x;
      const dz = pp.z - car.group.position.z;
      const d = Math.hypot(dx, dz) || 1;
      const want = Math.atan2(dx, dz);
      let diff = want - car.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      car.heading += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff * 2.2));
      car.angle = car.heading;
      car.group.rotation.y = car.heading;
      const sp = Math.min(car.maxSpeed, 10 + wanted * 3.2);
      car.speed += (sp - car.speed) * Math.min(1, dt * 1.5);
      car.group.position.x += Math.sin(car.heading) * car.speed * dt;
      car.group.position.z += Math.cos(car.heading) * car.speed * dt;
      for (const w of car.wheels || []) w.rotation.x += (car.speed * dt) / 0.4;
    } else {
      car.speed = Math.max(0, car.speed - 10 * dt);
    }
    const pdx = pp.x - car.group.position.x;
    const pdz = pp.z - car.group.position.z;
    unit.distance = Math.round(Math.hypot(pdx, pdz));
    if (wanted >= 4 && unit.name === 'JALAK-42') unit.status = 'MENABRAK';
  }
  units.sort((a, b) => a.distance - b.distance);
}

export function setWanted(state, level) {
  state.wanted = Math.max(0, Math.min(5, level || 0));
}

export function addHeat(state, amount) {
  state.wanted = Math.max(0, Math.min(5, (state.wanted || 0) + (amount || 1)));
}
