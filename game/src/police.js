import { CONFIG } from './config.js';
import { buildHumanoidMesh } from './player.js';
import { spawnCar, roadList, damageCar } from './vehicles.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

const OFFICER_NAMES = [
  'CENDRAWASIH-07', 'JALAK-42', 'BANGAU-18', 'KAKATUA-31',
  'GARUDA-02', 'ELANG-15', 'MERAK-09', 'KUNTUL-23', 'RAJAWALI-55',
];
const FOOT_WANTED = [0, 2, 2, 3, 3, 4];
const CAR_WANTED = [0, 0, 1, 2, 3, 4];

let nameCursor = 0;
function nextOfficerName(used) {
  for (let i = 0; i < OFFICER_NAMES.length * 2; i++) {
    const name = OFFICER_NAMES[nameCursor % OFFICER_NAMES.length];
    nameCursor++;
    if (!used.has(name)) return name;
  }
  return 'POLISI-' + (100 + Math.floor(Math.random() * 800));
}

export function createPolice(state) {
  const police = {
    units: [],
    foot: [],
    cars: [],
    roadblocks: [],
    count: 0,
    nearby: 9999,
    hideTimer: 0,
    sirenTimer: 0,
    lastWanted: 0,
    clearUnits: () => clearPoliceUnits(state),
  };
  state.police = police;
  state.policeApi = {
    setWanted: (st, level) => setWanted(st, level),
    addHeat: (st, amount) => addHeat(st, amount),
  };
  return police;
}

export function setWanted(state, level) {
  const clamped = Math.max(0, Math.min(5, Math.round(level)));
  const before = state.wanted || 0;
  state.wanted = clamped;
  if (clamped > before) {
    state.police.hideTimer = 0;
    if (clamped >= 3) {
      state.ui?.banner?.('Polisi Teluk Cerah — KODE ' + clamped);
    }
  }
  if (clamped === 0) {
    state.police.hideTimer = 0;
  }
  return clamped;
}

export function addHeat(state, amount) {
  const next = Math.max(0, Math.min(5, (state.wanted || 0) + amount));
  if (next > (state.wanted || 0)) {
    state.wanted = next;
    state.police.hideTimer = 0;
  }
  return state.wanted;
}

function clearPoliceUnits(state) {
  const police = state.police;
  if (!police) return;
  for (const unit of police.foot) {
    state.scene.remove(unit.group);
  }
  for (const car of police.cars) {
    state.scene.remove(car.group);
    const idx = (state.cars || []).indexOf(car);
    if (idx >= 0) state.cars.splice(idx, 1);
  }
  for (const car of police.roadblocks) {
    state.scene.remove(car.group);
    const idx = (state.cars || []).indexOf(car);
    if (idx >= 0) state.cars.splice(idx, 1);
  }
  police.foot = [];
  police.cars = [];
  police.roadblocks = [];
  police.units = police.units.filter((u) => u.type === 'heli');
}

function spawnFootOfficer(state) {
  const player = state.player;
  const used = new Set((state.police?.units || []).map((u) => u.name));
  const angle = Math.random() * Math.PI * 2;
  const dist = 34 + Math.random() * 30;
  const x = player.position.x + Math.cos(angle) * dist;
  const z = player.position.z + Math.sin(angle) * dist;
  const group = buildHumanoidMesh({
    skin: 0xc98d5f, shirt: 0x1d3a6e, pants: 0x16233a, hat: 0x12203a,
  });
  group.position.set(x, 0, z);
  state.scene.add(group);
  const officer = {
    group,
    position: group.position,
    heading: 0,
    speed: 0,
    runSpeed: 6.4,
    walkPhase: Math.random() * 6,
    name: nextOfficerName(used),
    type: 'foot',
    status: 'PENGEJARAN',
    distance: dist,
    stuckTimer: 0,
  };
  state.police.foot.push(officer);
  return officer;
}

function spawnPoliceCar(state) {
  const player = state.player;
  const used = new Set((state.police?.units || []).map((u) => u.name));
  const angle = Math.random() * Math.PI * 2;
  const dist = 46 + Math.random() * 26;
  const x = player.position.x + Math.cos(angle) * dist;
  const z = player.position.z + Math.sin(angle) * dist;
  const car = spawnCar(state, 'police', x, z, Math.atan2(player.position.x - x, player.position.z - z), 'ai');
  car.police = true;
  car.siren = true;
  car.targetSpeed = 26 + (state.wanted || 1) * 2;
  car.name = nextOfficerName(used);
  state.cars.push(car);
  state.police.cars.push(car);
  return car;
}

function placeRoadblock(state) {
  const player = state.player;
  const roads = roadList(state);
  const car = player.car;
  const ahead = car
    ? { x: car.position.x + Math.sin(car.heading) * 55, z: car.position.z + Math.cos(car.heading) * 55, heading: car.heading }
    : { x: player.position.x + Math.sin(player.heading) * 45, z: player.position.z + Math.cos(player.heading) * 45, heading: player.heading };
  const block = [];
  for (const side of [-1, 1]) {
    const px = ahead.x + Math.cos(ahead.heading) * 3.4 * side;
    const pz = ahead.z - Math.sin(ahead.heading) * 3.4 * side;
    const unit = spawnCar(state, 'police', px, pz, ahead.heading + Math.PI / 2, 'none');
    unit.police = true;
    unit.siren = true;
    unit.roadblock = true;
    state.cars.push(unit);
    state.police.roadblocks.push(unit);
    block.push(unit);
  }
  state.ui?.banner?.('Roadblock di depan! Cari jalan lain.');
  return block;
}

function updateFootOfficer(state, officer, dt) {
  const player = state.player;
  const dx = player.position.x - officer.position.x;
  const dz = player.position.z - officer.position.z;
  const d = Math.hypot(dx, dz);
  officer.distance = d;
  const wantHeading = Math.atan2(dx, dz);
  let diff = wantHeading - officer.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  officer.heading += diff * Math.min(1, dt * 6);

  const playerSpeed = player.car
    ? Math.abs(player.car.speed)
    : Math.abs(player.speedKmh || 0) / 3.6;
  let runSpeed = officer.runSpeed;
  if (playerSpeed > 8) runSpeed = officer.runSpeed * 0.75;
  officer.speed = runSpeed;
  officer.position.x += Math.sin(officer.heading) * runSpeed * dt;
  officer.position.z += Math.cos(officer.heading) * runSpeed * dt;
  officer.group.rotation.y = officer.heading;
  officer.walkPhase += dt * runSpeed * 3.2;
  const limbs = officer.group.userData.limbs;
  if (limbs) {
    const swing = Math.sin(officer.walkPhase) * 0.8;
    limbs.legL.rotation.x = swing;
    limbs.legR.rotation.x = -swing;
    limbs.armL.rotation.x = -swing * 0.7;
    limbs.armR.rotation.x = swing * 0.7;
  }
  officer.status = d < 12 ? 'PENANGKAPAN' : 'PENGEJARAN';

  if (d < 1.7 && !player.dead) {
    if (player.car && Math.abs(player.car.speed) > 6) {
      officer.position.x -= Math.sin(officer.heading) * 2.5;
      officer.position.z -= Math.cos(officer.heading) * 2.5;
      state.playerApi?.damagePlayer?.(state, 8);
      return;
    }
    state.playerApi?.bustPlayer?.(state);
  }
}

function updatePoliceCar(state, car, dt) {
  const player = state.player;
  const dx = player.position.x - car.position.x;
  const dz = player.position.z - car.position.z;
  const d = Math.hypot(dx, dz);
  const target = player.car || player;
  const targetSpeedMs = target === player
    ? (player.speedKmh || 0) / 3.6
    : (target.speed || 0);
  const tx = target.position.x + Math.sin(target.heading || 0) * targetSpeedMs * 0.35;
  const tz = target.position.z + Math.cos(target.heading || 0) * targetSpeedMs * 0.35;
  const wantHeading = Math.atan2(tx - car.position.x, tz - car.position.z);
  let diff = wantHeading - car.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  car.heading += diff * Math.min(1, dt * 2.4);
  const wanted = state.wanted || 1;
  const cruise = 24 + wanted * 3;
  const nearPlayer = d < 10;
  const wantSpeed = nearPlayer ? cruise * 1.15 : cruise;
  car.speed += Math.sign(wantSpeed - car.speed) * Math.min(Math.abs(wantSpeed - car.speed), car.accel * dt);
  car.position.x += Math.sin(car.heading) * car.speed * dt;
  car.position.z += Math.cos(car.heading) * car.speed * dt;
  car.group.rotation.y = car.heading;

  if (d < 5.5) {
    const playerCar = player.car;
    if (playerCar && Math.abs(car.speed) > 4) {
      car.speed *= 0.55;
      playerCar.speed *= 0.7;
      damageCar(state, playerCar, Math.abs(car.speed) * 1.2);
      damageCar(state, car, 4);
      state.combatApi?.addShake?.(state, 0.35);
      state.audioApi?.play?.('punch');
    }
  }
  car.status = d < 8 ? 'RAMMING' : 'PURSUIT';
  car.distance = d;
}

export function updatePolice(state, dt) {
  const police = state.police;
  const player = state.player;
  if (!police || !player) return;
  const wanted = state.wanted || 0;

  const wantFoot = FOOT_WANTED[wanted] || 0;
  const wantCars = CAR_WANTED[wanted] || 0;

  while (police.foot.length < wantFoot && !player.dead) spawnFootOfficer(state);
  while (police.foot.length > wantFoot) {
    const gone = police.foot.pop();
    state.scene.remove(gone.group);
  }
  while (police.cars.length < wantCars && !player.dead) spawnPoliceCar(state);
  while (police.cars.length > wantCars) {
    const gone = police.cars.pop();
    state.scene.remove(gone.group);
    const idx = (state.cars || []).indexOf(gone);
    if (idx >= 0) state.cars.splice(idx, 1);
  }

  const wantBlock = wanted >= 4;
  if (wantBlock && police.roadblocks.length === 0 && !player.dead) {
    placeRoadblock(state);
  }
  if (!wantBlock && police.roadblocks.length > 0) {
    for (const car of police.roadblocks) {
      state.scene.remove(car.group);
      const idx = (state.cars || []).indexOf(car);
      if (idx >= 0) state.cars.splice(idx, 1);
    }
    police.roadblocks = [];
  }

  for (const officer of police.foot) updateFootOfficer(state, officer, dt);
  for (const car of police.cars) updatePoliceCar(state, car, dt);

  let nearest = Infinity;
  const units = [];
  for (const officer of police.foot) {
    nearest = Math.min(nearest, officer.distance);
    units.push({
      name: officer.name, type: 'foot', status: officer.status,
      distance: Math.round(officer.distance),
    });
  }
  for (const car of police.cars) {
    nearest = Math.min(nearest, car.distance || Infinity);
    units.push({
      name: car.name || 'POLISI', type: 'car', status: car.status || 'PURSUIT',
      distance: Math.round(car.distance || 0),
    });
  }
  if (state.helicopter && state.helicopter.mode !== 'idle' && state.helicopter.mode !== 'hidden') {
    const hd = Math.hypot(
      state.helicopter.position.x - player.position.x,
      state.helicopter.position.z - player.position.z,
    );
    nearest = Math.min(nearest, hd);
    units.push({
      name: 'GARUDA-1', type: 'heli', status: 'SPOTLIGHT',
      distance: Math.round(hd),
    });
  }
  units.sort((a, b) => a.distance - b.distance);
  police.units = units;
  police.count = units.length;
  police.nearby = units.length > 0 ? units[0].distance : 9999;

  if (wanted > 0 && !player.dead) {
    const heliWatching = state.helicopter && state.helicopter.mode === 'spotlight';
    if (nearest > 55 && !heliWatching) {
      police.hideTimer += dt;
      const perStar = pickNumber([CONFIG?.police?.hideSecondsPerStar, 8], 8);
      if (police.hideTimer >= perStar) {
        police.hideTimer = 0;
        setWanted(state, wanted - 1);
        state.stats = state.stats || {};
        if ((state.wanted || 0) === 0) {
          state.stats.escapes = (state.stats.escapes || 0) + 1;
          state.ui?.banner?.('Kamu lolos dari kejaran polisi.');
        }
      }
    } else {
      police.hideTimer = 0;
    }
  } else {
    police.hideTimer = 0;
  }

  if (wanted > 0 && police.cars.length > 0 && nearest < 70) {
    police.sirenTimer -= dt;
    if (police.sirenTimer <= 0) {
      police.sirenTimer = 2.6;
      state.audioApi?.play?.('siren');
    }
  }
}
