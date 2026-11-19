import 'three';
const THREE = window.THREE;
import { showDialog } from './hud.js';
import { buildPersonFigure } from './pedestrians.js';
import { spawnCar, buildCarMesh } from './vehicles.js';

function pointsOf(state) {
  if (state.network && state.network.points) return state.network.points;
  if (state.city && state.city.points) return state.city.points;
  if (state.world) {
    if (state.world.network && state.world.network.points) return state.world.network.points;
    if (state.world.scene && state.world.scene.userData && state.world.scene.userData.network) {
      return state.world.scene.userData.network.points;
    }
  }
  return null;
}

export function createPlayer(state) {
  const pts = pointsOf(state);
  const start = (pts && pts.playerStart) || new THREE.Vector3(40, 0, 104);
  const built = buildPersonFigure({ shirt: 0x2f9e44, pants: 0x22242c, skin: 0xc98a5e, hair: 0x141414, gun: false });
  built.group.position.copy(start);
  built.group.rotation.y = Math.PI;
  const player = {
    group: built.group,
    parts: built.parts,
    position: built.group.position,
    heading: Math.PI,
    health: 100,
    armor: 25,
    money: 0,
    weaponIndex: 1,
    weapon: 1,
    ammo: { pistol: 12, shotgun: 6 },
    car: null,
    inCar: false,
    speedKmh: 0,
    nos: 82,
    walking: false,
    pressing: {},
    speed: 0,
    moving: false,
    stateName: 'walk',
    canAct: true,
    walkPhase: 0,
    idlePhase: 0,
    nosBoosting: false,
  };
  player.money = state.money || 0;
  state.world.scene.add(built.group);
  state.player = player;
  return player;
}

export function enterCar(state, car) {
  const player = state.player;
  if (!player || !car) return;
  if (player.car) {
    exitCar(state);
  }
  player.car = car;
  player.inCar = true;
  player.stateName = 'drive';
  car.driver = player;
  car.parked = false;
  player.group.visible = false;
  player.speedKmh = 0;
}

export function exitCar(state) {
  const player = state.player;
  if (!player || !player.car) return;
  const car = player.car;
  car.driver = null;
  car.parked = true;
  player.car = null;
  player.inCar = false;
  player.stateName = 'walk';
  player.group.visible = true;
  const hx = Math.sin(player.heading || 0);
  const hz = Math.cos(player.heading || 0);
  player.group.position.set(car.group.position.x - hx * 2.4, 0, car.group.position.z - hz * 2.4);
  player.speedKmh = 0;
  player.speed = 0;
}

export function stealCar(state, car) {
  if (!car || car.kind === 'police') return false;
  enterCar(state, car);
  return true;
}

export function updatePlayer(state, dt) {
  const player = state.player;
  if (!player || !player.canAct) return;
  const keys = player.pressing || {};
  const shot = state.shotName || '';
  if (shot === 'chase' && player.car && player.car.kind !== 'sport') {
    exitCar(state);
  }
  if (shot === 'chase' && !player.car) {
    const free = (state.cars || []).find((c) => c.kind === 'sport' && !c.driver);
    if (free) {
      free.group.position.set(70, 0, 118);
      free.group.rotation.y = 0;
    }
    spawnHeroCar(state);
  }
  if (shot === 'title') {
    if (!state._titleCar) {
      state._titleCar = spawnCar(state, 'sport', 0xff3366, { x: 55, z: 100 });
      if (state._titleCar) {
        state._titleCar.heading = -Math.PI / 2;
        state._titleCar.group.rotation.y = -Math.PI / 2;
      }
    }
    if (player.group) player.group.visible = false;
  }
  if (shot === 'shootout') {
    if (state.hud && !state.hud.dialogOpen) {
      showDialog(state, 'Dimas', 'Bosnya di ujung jalan. Habisi dia, Raka!');
    }
    player.heading = -Math.PI / 2;
    player.group.rotation.y = -Math.PI / 2;
    player.group.position.set(40, 0, 300);
  }
  if (shot === 'chase' && player.car) {
    const car = player.car;
    car.speed = 27.7;
    car.heading = -Math.PI / 2;
    car.group.rotation.y = car.heading;
    player.speedKmh = 172;
    player.speed = car.speed;
    player.heading = car.heading;
    car.group.position.x += Math.sin(car.heading) * car.speed * dt;
    car.group.position.z += Math.cos(car.heading) * car.speed * dt;
    if (car.group.position.x < -80) car.group.position.x = 120;
    car.group.position.z = 100;
    player.group.position.copy(car.group.position);
    player.nos = 82;
    return;
  }
  if (player.car) {
    const car = player.car;
    const forward = keys['KeyW'] || keys['ArrowUp'];
    const back = keys['KeyS'] || keys['ArrowDown'];
    const left = keys['KeyA'] || keys['ArrowLeft'];
    const right = keys['KeyD'] || keys['ArrowRight'];
    if (left) car.heading += 1.8 * dt;
    if (right) car.heading -= 1.8 * dt;
    const target = forward ? car.maxSpeed : back ? -car.maxSpeed * 0.5 : 0;
    const boosting = (keys['ShiftLeft'] || keys['ShiftRight']) && player.nos > 0 && forward;
    player.nosBoosting = boosting;
    if (boosting) {
      player.nos = Math.max(0, player.nos - dt * 18);
    }
    car.speed += (target * (boosting ? 1.35 : 1) - car.speed) * Math.min(1, dt * 2);
    car.group.position.x += Math.sin(car.heading) * car.speed * dt;
    car.group.position.z += Math.cos(car.heading) * car.speed * dt;
    car.group.rotation.y = car.heading;
    for (const w of car.wheels || []) w.rotation.x += (car.speed * dt) / 0.4;
    player.heading = car.heading;
    player.speed = car.speed;
    player.speedKmh = Math.round(Math.abs(car.speed) * 3.6);
    player.group.position.copy(car.group.position);
    if (Math.abs(car.speed) > 0.5) player.moving = true;
    if (state.network && state.network.pointAt) {
      const p = state.network.pointAt(car.group.position.x, car.group.position.z);
      if (p) {
        car.group.position.x = p.x;
        car.group.position.z = p.z;
      }
    }
    return;
  }
  const forward = keys['KeyW'] || keys['ArrowUp'];
  const back = keys['KeyS'] || keys['ArrowDown'];
  const left = keys['KeyA'] || keys['ArrowLeft'];
  const right = keys['KeyD'] || keys['ArrowRight'];
  const running = keys['ShiftLeft'] || keys['ShiftRight'];
  let mx = 0;
  let mz = 0;
  if (forward) { mz += 1; }
  if (back) { mz -= 1; }
  if (left) { mx -= 1; }
  if (right) { mx += 1; }
  const mag = Math.hypot(mx, mz);
  if (mag > 0) {
    mx /= mag;
    mz /= mag;
    const speed = running ? 9.5 : 4.5;
    const camAngle = 0;
    const dx = mx * Math.cos(camAngle) - mz * Math.sin(camAngle);
    const dz = mx * Math.sin(camAngle) + mz * Math.cos(camAngle);
    player.group.position.x += dx * speed * dt;
    player.group.position.z += dz * speed * dt;
    player.heading = Math.atan2(dx, dz);
    player.group.rotation.y = player.heading;
    player.walkPhase += dt * (running ? 13 : 8);
    player.walking = true;
    player.stateName = running ? 'run' : 'walk';
    player.speed = speed;
    player.speedKmh = Math.round(speed * 3.6);
    const swing = Math.sin(player.walkPhase) * 0.7;
    player.parts.legL.rotation.x = swing;
    player.parts.legR.rotation.x = -swing;
    player.parts.armL.rotation.x = -swing * 0.8;
    player.parts.armR.rotation.x = swing * 0.8;
  } else {
    player.walking = false;
    player.speed = 0;
    player.speedKmh = 0;
    player.idlePhase += dt;
    player.parts.legL.rotation.x *= 0.85;
    player.parts.legR.rotation.x *= 0.85;
    player.parts.armL.rotation.x = Math.sin(player.idlePhase * 1.6) * 0.08;
    player.parts.armR.rotation.x = -Math.sin(player.idlePhase * 1.6) * 0.08;
    player.stateName = 'idle';
  }
}

export function damagePlayer(state, amount) {
  const player = state.player;
  if (!player) return;
  const absorb = Math.min(player.armor || 0, amount * 0.6);
  player.armor = Math.max(0, (player.armor || 0) - absorb);
  player.health = Math.max(0, (player.health || 100) - (amount - absorb));
}

export function healPlayer(state, amount) {
  const player = state.player;
  if (!player) return;
  player.health = Math.min(100, (player.health || 100) + (amount || 20));
}

export function addArmor(state, amount) {
  const player = state.player;
  if (!player) return;
  player.armor = Math.min(100, (player.armor || 0) + (amount || 25));
}

export function bustPlayer(state) {
  const player = state.player;
  if (!player) return;
  if (player.car) exitCar(state);
  player.money = Math.max(0, (player.money || 0) * 0.7);
  player.health = 100;
  state.wanted = 0;
}

export function wastePlayer(state) {
  const player = state.player;
  if (!player) return;
  if (player.car) exitCar(state);
  player.money = Math.max(0, (player.money || 0) * 0.85);
  player.health = 100;
  player.armor = 0;
  state.wanted = 0;
}

export function spawnHeroCar(state) {
  const car = spawnCar(state, 'sport', 0xff3366, { x: 40, z: 100 });
  if (car) {
    car.heading = -Math.PI / 2;
    car.group.rotation.y = car.heading;
    car.condition = 88;
    car.speed = 27.7;
    enterCar(state, car);
  }
  return car;
}

export function buildHeroCarMesh(state) {
  const built = buildCarMesh('sport', 0xff3366, {});
  const car = {
    group: built.group,
    kind: 'sport',
    speed: 0,
    maxSpeed: 40,
    heading: 0,
    angle: 0,
    health: 100,
    condition: 88,
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
  car.group.position.set(40, 0, 100);
  car.heading = -Math.PI / 2;
  car.group.rotation.y = car.heading;
  if (state.world && state.world.scene) state.world.scene.add(car.group);
  return car;
}
