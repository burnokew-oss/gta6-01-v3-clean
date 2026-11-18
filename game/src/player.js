// Pemain: jalan kaki (WASD + lari, bidik ke kursor) dan mengemudi
// (gas/rem/setir + handbrake + NOS). Masuk mobil (E), curi mobil (F),
// keluar mobil (E lagi).
//
// Arah hadap memakai konvensi yang sama dengan mobil: vektor maju
// (sin(angle), cos(angle)) di bidang XZ, dan rotation.y mesh = angle.
import { NOS_MAX, NOS_DRAIN_PER_SEC, NOS_REFILL_PER_SEC, NOS_TOP_MULT, NOS_ACCEL_MULT } from './config.js';
import { collideBuildings, clampToCity } from './city.js';
import { damagePlayer, nearestVehicle } from './vehicles.js';

export function createPlayer(x, z) {
  return {
    x, z, angle: Math.PI, speed: 0,
    onFoot: true, vehicle: null,
    health: 100, armor: 0,
    weapon: 'fist',
    ammo: { pistol: 12, shotgun: 0 },
    ammoInMag: { pistol: 12, shotgun: 0 },
    reloadTimer: 0, fireTimer: 0,
    invuln: 0, cash: 100,
    aimAngle: Math.PI, moving: false,
    nos: NOS_MAX, nosMax: NOS_MAX,
    engineLevel: 0,
    upgrades: {},
  };
}

export function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function updatePlayer(G, dt, input, actions) {
  const p = G.player;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.fireTimer > 0) p.fireTimer -= dt;
  if (p.reloadTimer > 0) p.reloadTimer -= dt;

  // Bidik: kursor layar -> titik di tanah (dihitung renderer, disimpan
  // di G.aimPoint). Pemain jalan kaki selalu menghadap titik bidik.
  // G.aimOverride (dipakai scene screenshot) menang atas kursor.
  if (p.onFoot && G.aimOverride) {
    p.aimAngle = Math.atan2(G.aimOverride.x - p.x, G.aimOverride.z - p.z);
    p.angle = p.aimAngle;
  } else if (p.onFoot && G.aimPoint) {
    p.aimAngle = Math.atan2(G.aimPoint.x - p.x, G.aimPoint.z - p.z);
    p.angle = p.aimAngle;
  }

  if (p.onFoot) {
    G.nosBoost = false;
    const ax = input.axisX();
    const ay = input.axisY(); // -1 = W (maju), +1 = S (mundur)
    const run = input.keys.run ? 1.7 : 1;
    const speed = 6.5 * run;
    p.moving = ax !== 0 || ay !== 0;
    if (p.moving) {
      // Gerak relatif terhadap arah hadap: W maju ke titik bidik,
      // A/D geser kiri-kanan, S mundur.
      const fx = Math.sin(p.angle);
      const fz = Math.cos(p.angle);
      const rx = Math.cos(p.angle);
      const rz = -Math.sin(p.angle);
      const len = Math.hypot(ax, ay) || 1;
      const mx = (fx * -ay + rx * ax) / len;
      const mz = (fz * -ay + rz * ax) / len;
      p.x += mx * speed * dt;
      p.z += mz * speed * dt;
    }
    const clamped = clampToCity(p.x, p.z, 4);
    p.x = clamped.x;
    p.z = clamped.z;
    const fixed = collideBuildings(G.city, p.x, p.z, 0.9);
    p.x = fixed.x;
    p.z = fixed.z;

    if (actions & 4) { // E: masuk mobil terdekat
      const v = nearestVehicle(G, p.x, p.z, 5, true);
      if (v) enterVehicle(G, v, false);
    }
    if (actions & 8) { // F: curi mobil (sopir dipaksa keluar)
      const v = nearestVehicle(G, p.x, p.z, 5, true);
      if (v) enterVehicle(G, v, true);
    }
  } else if (p.vehicle) {
    const v = p.vehicle;
    // NOS: Shift saat nyetir = boost, tangki terkuras; kalau tidak
    // dipakai, tangki terisi pelan.
    const wantNos = input.keys.run && p.nos > 0 && Math.abs(v.speed) > 4;
    G.nosBoost = !!wantNos;
    if (wantNos) {
      p.nos = Math.max(0, p.nos - NOS_DRAIN_PER_SEC * dt);
      if (G.rng.chance(dt * 30)) {
        G.particles.push({
          x: v.x - Math.sin(v.angle) * v.len / 2, z: v.z - Math.cos(v.angle) * v.len / 2,
          vx: -Math.sin(v.angle) * 8, vz: -Math.cos(v.angle) * 8,
          life: 0.3, max: 0.3, size: 0.7,
          color: G.rng.pick([0xff8c1a, 0xffd23f, 0x7fb5ff]), kind: 'fire',
        });
      }
    } else {
      p.nos = Math.min(p.nosMax || NOS_MAX, p.nos + NOS_REFILL_PER_SEC * dt);
    }
    const topEff = v.top * (wantNos ? NOS_TOP_MULT : 1) * (1 + 0.15 * (p.engineLevel || 0));
    const accelEff = v.accel * (wantNos ? NOS_ACCEL_MULT : 1);
    const throttle = -input.axisY(); // W = gas
    const steer = input.axisX();
    if (throttle > 0) v.speed += accelEff * dt;
    else if (throttle < 0) v.speed -= accelEff * 1.4 * dt;
    else v.speed -= Math.sign(v.speed) * 3 * dt;
    if (Math.abs(v.speed) < 0.3 && throttle === 0) v.speed = 0;
    if (input.keys.brake) {
      v.speed *= Math.max(0, 1 - 3 * dt);
      if (Math.abs(v.speed) > 6 && G.rng.chance(dt * 20)) {
        G.particles.push({ x: v.x, z: v.z, vx: 0, vz: 0, life: 0.4, max: 0.4, size: 0.6, color: 0x888888, kind: 'smoke' });
      }
    }
    v.speed = Math.max(-topEff * 0.45, Math.min(topEff, v.speed));
    const turnRate = v.turn * Math.min(1, Math.abs(v.speed) / 8 + 0.25) * Math.sign(v.speed || 1);
    v.angle += steer * turnRate * dt;
    v.x += Math.sin(v.angle) * v.speed * dt;
    v.z += Math.cos(v.angle) * v.speed * dt;
    const clamped = clampToCity(v.x, v.z, 4);
    v.x = clamped.x;
    v.z = clamped.z;
    const fixed = collideBuildings(G.city, v.x, v.z, v.len / 2 - 0.4);
    if (fixed.x !== v.x || fixed.z !== v.z) {
      if (Math.abs(v.speed) > 10) {
        v.health -= 8;
        if (G.audio) G.audio.crash();
        G.shake = Math.max(G.shake, 6);
      }
      v.speed *= 0.4;
      v.x = fixed.x;
      v.z = fixed.z;
    }
    p.x = v.x;
    p.z = v.z;
    p.angle = v.angle;
    if (G.audio) G.audio.engine(true, Math.abs(v.speed) / v.top);
    if (actions & 4) exitVehicle(G); // E keluar mobil
    // Tabrak pejalan kaki: wanted naik.
    for (const ped of G.peds) {
      if (ped.dead) continue;
      if (Math.hypot(ped.x - v.x, ped.z - v.z) < 2.6 && Math.abs(v.speed) > 5) {
        ped.dead = true;
        ped.fleeing = false;
        G.events.push('pedKilled');
        G.cashFloaters.push({ x: ped.x, z: ped.z, text: '!', life: 0.8 });
      }
    }
  }
  if (p.onFoot && G.audio) G.audio.engine(false, 0);

  // Pungut Kerang Teluk (kolektibel 24x) saat lewat dekat.
  if (G.shells) {
    for (const s of G.shells) {
      if (!s.taken && Math.hypot(p.x - s.x, p.z - s.z) < 2.2) {
        s.taken = true;
        G.stats.shells = (G.stats.shells || 0) + 1;
        G.player.cash += 10;
        G.cashFloaters.push({ x: s.x, z: s.z, text: 'KERANG +$10', life: 1.2 });
        if (G.audio) G.audio.pickup();
      }
    }
  }
}

export function enterVehicle(G, v, steal) {
  const p = G.player;
  if (v.driver && v.driver !== p) {
    // Sopir lama dipaksa keluar (hanya saat curi).
    const d = v.driver;
    d.x = v.x + Math.cos(v.angle) * 3;
    d.z = v.z - Math.sin(v.angle) * 3;
    d.fleeing = true;
    v.driver = null;
  }
  if (v.ai) { v.ai = null; v.parked = false; }
  v.driver = p;
  p.vehicle = v;
  p.onFoot = false;
  p.x = v.x;
  p.z = v.z;
  if (steal) {
    G.events.push('stoleCar');
    if (G.audio) G.audio.wantedUp();
  }
}

export function exitVehicle(G) {
  const p = G.player;
  const v = p.vehicle;
  if (!v) return;
  v.driver = null;
  v.speed *= 0.3;
  p.vehicle = null;
  p.onFoot = true;
  p.x = v.x + Math.cos(v.angle) * 2.5;
  p.z = v.z - Math.sin(v.angle) * 2.5;
  p.angle = v.angle;
  if (G.audio) G.audio.engine(false, 0);
}

export { damagePlayer };
