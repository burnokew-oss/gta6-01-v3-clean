// Kendaraan: fisika arcade, traffic AI yang mengikuti graf jalan,
// spawn/despawn di sekitar pemain, damage + ledakan.
//
// Traffic melaju di lajur kanan jalan (offset 2,75 dari garis tengah),
// belok acak di persimpangan. Mobil pemain dan mobil polisi tidak
// memakai AI jalan — mereka dikemudikan modul lain.
import { VEHICLE_TYPES, CITY_HALF, LANE_OFFSET, ROAD_LINES } from './config.js';
import { nearestRoadPoint } from './city.js';

let nextId = 1;

export function makeVehicle(rng, type, x, z, angle) {
  const t = VEHICLE_TYPES[type];
  return {
    id: nextId += 1, type, color: t.color,
    x, z, angle: angle ?? 0, speed: 0,
    len: t.len, wid: t.wid, accel: t.accel, top: t.top, turn: t.turn,
    health: 100, smoking: false, driver: null, parked: false,
    ai: null, // {road:'v'|'h', line, dir}
    dead: false, flash: 0, name: null, status: null, dist: 0,
    nearMissed: false,
  };
}

export function spawnTraffic(G, count) {
  const lines = ROAD_LINES;
  for (let i = 0; i < count; i += 1) {
    const vertical = G.rng.chance(0.5);
    const line = G.rng.pick(lines);
    const along = G.rng.range(-100, 100);
    const dir = G.rng.chance(0.5) ? 1 : -1;
    const lane = dir * LANE_OFFSET;
    const x = vertical ? line + lane : along;
    const z = vertical ? along : line + lane;
    const type = G.rng.pick(['sedan', 'sedan', 'taxi', 'truck', 'van', 'sport']);
    // Arah hadap: jalan vertikal = utara/selatan (angle 0/PI), horizontal = timur/barat.
    const angle = vertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    const v = makeVehicle(G.rng, type, x, z, angle);
    v.ai = { road: vertical ? 'v' : 'h', line, dir };
    v.speed = G.rng.range(7, 12);
    G.vehicles.push(v);
  }
}

export function spawnParked(G, count) {
  const lines = ROAD_LINES;
  for (let i = 0; i < count; i += 1) {
    const vertical = G.rng.chance(0.5);
    const line = G.rng.pick(lines);
    const along = G.rng.range(-100, 100);
    const side = G.rng.chance(0.5) ? 1 : -1;
    const x = vertical ? line + side * 4.5 : along;
    const z = vertical ? along : line + side * 4.5;
    const type = G.rng.pick(['sedan', 'sedan', 'taxi', 'van', 'sport']);
    const v = makeVehicle(G.rng, type, x, z, vertical ? (side > 0 ? 0 : Math.PI) : Math.PI / 2);
    v.parked = true;
    v.driver = null;
    G.vehicles.push(v);
  }
}

// Mobil pinjaman Misi 1: sedan biru di parkiran dekat rumah (Marina barat).
export function spawnLoanerCar(G) {
  const v = makeVehicle(G.rng, 'sedan', -88, 40, Math.PI / 2);
  v.color = 0x2e6fb5;
  v.parked = true;
  v.loaner = true;
  G.vehicles.push(v);
  return v;
}

function turnToward(v, want, dt, rate) {
  let d = want - v.angle;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  v.angle += Math.max(-rate * dt, Math.min(rate * dt, d));
}

export function updateVehicles(G, dt) {
  const px = G.player.x;
  const pz = G.player.z;
  for (const v of G.vehicles) {
    if (v.dead) continue;
    if (v.flash > 0) v.flash -= dt;
    if (v.ai) {
      // Traffic AI: kejar kecepatan jelajah, belok acak di persimpangan.
      const cruise = 9;
      v.speed += Math.sign(cruise - v.speed) * 6 * dt;
      const lines = ROAD_LINES;
      const along = v.ai.road === 'v' ? v.z : v.x;
      let nearestCross = lines[0];
      let nearestD = Infinity;
      for (const l of lines) {
        const d = Math.abs(along - l);
        if (d < nearestD) { nearestD = d; nearestCross = l; }
      }
      if (nearestD < 1.2 && G.rng.chance(dt * 0.5)) {
        // Belok: ganti jalan di persimpangan ini.
        if (v.ai.road === 'v') {
          v.ai = { road: 'h', line: nearestCross, dir: G.rng.chance(0.5) ? 1 : -1 };
          v.z = nearestCross + v.ai.dir * LANE_OFFSET;
        } else {
          v.ai = { road: 'v', line: nearestCross, dir: G.rng.chance(0.5) ? 1 : -1 };
          v.x = nearestCross + v.ai.dir * LANE_OFFSET;
        }
      }
      const wantAngle = v.ai.road === 'v'
        ? (v.ai.dir > 0 ? 0 : Math.PI)
        : (v.ai.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      turnToward(v, wantAngle, dt, 2.2);
      // Jaga lajur: tarik pelan ke garis lajur.
      if (v.ai.road === 'v') v.x += (v.ai.line + v.ai.dir * LANE_OFFSET - v.x) * Math.min(1, dt * 1.5);
      else v.z += (v.ai.line + v.ai.dir * LANE_OFFSET - v.z) * Math.min(1, dt * 1.5);
      v.x += Math.sin(v.angle) * v.speed * dt;
      v.z += Math.cos(v.angle) * v.speed * dt;
    }
    // Asap saat rusak parah.
    if (v.health < 40 && !v.smoking) v.smoking = true;
    if (v.smoking && G.rng.chance(dt * 8)) {
      G.particles.push({ x: v.x, z: v.z, vx: 0, vz: 0, life: 0.7, max: 0.7, size: 0.8, color: 0x888888, kind: 'smoke' });
    }
    if (v.health <= 0 && !v.dead) {
      v.dead = true;
      explodeVehicle(G, v);
    }
  }
  // Despawn traffic jauh dari pemain, respawn dekat.
  for (let i = G.vehicles.length - 1; i >= 0; i -= 1) {
    const v = G.vehicles[i];
    if (v.dead) { G.vehicles.splice(i, 1); continue; }
    if (v.ai) {
      const d = Math.hypot(v.x - px, v.z - pz);
      if (d > 110) {
        const p = nearestRoadPoint(px + G.rng.range(-60, 60), pz + G.rng.range(-60, 60));
        v.x = p.x;
        v.z = p.z;
      }
    }
  }
  // Tabrakan antar mobil (dorong sederhana).
  for (let i = 0; i < G.vehicles.length; i += 1) {
    for (let j = i + 1; j < G.vehicles.length; j += 1) {
      const a = G.vehicles[i];
      const b = G.vehicles[j];
      if (a.dead || b.dead) continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const min = (a.len + b.len) / 2 - 0.8;
      if (d > 0.01 && d < min) {
        const push = (min - d) / 2;
        const nx = dx / d;
        const nz = dz / d;
        a.x -= nx * push; a.z -= nz * push;
        b.x += nx * push; b.z += nz * push;
        a.speed *= 0.7; b.speed *= 0.7;
        if (Math.abs(a.speed) > 8 || Math.abs(b.speed) > 8) {
          a.health -= 4; b.health -= 4;
          if (G.audio) G.audio.crash();
        }
      }
    }
  }
  // Near miss: ngebut melewati traffic sangat dekat = +$25 (sekali per mobil).
  const pv = G.player.vehicle;
  if (pv && !G.player.onFoot && Math.abs(pv.speed) > 12) {
    for (const v of G.vehicles) {
      if (!v.ai || v.dead || v.nearMissed) continue;
      const d = Math.hypot(v.x - pv.x, v.z - pv.z);
      if (d < 5.2 && d > 3) {
        v.nearMissed = true;
        G.player.cash += 25;
        G.cashFloaters.push({ x: pv.x, z: pv.z, text: 'NEAR MISS +$25', life: 1.2 });
        if (G.audio) G.audio.pickup();
      }
    }
  }
}

export function explodeVehicle(G, v) {
  for (let i = 0; i < 26; i += 1) {
    G.particles.push({
      x: v.x, z: v.z,
      vx: G.rng.range(-8, 8), vz: G.rng.range(-8, 8),
      life: G.rng.range(0.4, 1), max: 1, size: G.rng.range(0.4, 1.2),
      color: G.rng.pick([0xff8c1a, 0xffd23f, 0xe5534b, 0x888888]), kind: 'fire',
    });
  }
  G.shake = Math.max(G.shake, 14);
  if (G.audio) G.audio.explosion();
  const d = Math.hypot(G.player.x - v.x, G.player.z - v.z);
  if (d < 12 && G.player.vehicle !== v) damagePlayer(G, Math.round(40 - d / 3));
  if (G.player.vehicle === v) {
    G.player.vehicle = null;
    G.player.onFoot = true;
    damagePlayer(G, 30);
  }
}

export function damagePlayer(G, amount) {
  if (G.player.invuln > 0) return;
  let left = amount;
  if (G.player.armor > 0) {
    const absorbed = Math.min(G.player.armor, left);
    G.player.armor -= absorbed;
    left -= absorbed;
  }
  G.player.health -= left;
  G.player.invuln = 0.5;
  G.flashRed = Math.max(G.flashRed, 0.35);
  if (G.player.health <= 0) {
    G.player.health = 0;
    G.events.push('wasted');
  }
}

export function nearestVehicle(G, x, z, maxDist, includeParked) {
  let best = null;
  let bestD = maxDist;
  for (const v of G.vehicles) {
    if (v.dead) continue;
    if (v.parked && !includeParked) continue;
    const d = Math.hypot(v.x - x, v.z - z);
    if (d < bestD) { bestD = d; best = v; }
  }
  return best;
}
