// Wanted 0-5 + AI polisi (jalan kaki + mobil patroli + roadblock).
// Setiap unit yang spawn dapat nama tetap dari daftar (bergilir) supaya
// panel HUD bisa menampilkan "ELANG-11 · RAMMING · 84 m".
import { COP_CAR_COUNTS, COP_COUNTS, WANTED_DECAY_SECONDS, COP_CAR_NAMES, COP_FOOT_NAMES } from './config.js';
import { makeVehicle, damagePlayer } from './vehicles.js';
import { updateHelicopter } from './helicopter.js';

function nextCopName(G, list) {
  G.copNameSeq = (G.copNameSeq || 0) + 1;
  return list[(G.copNameSeq - 1) % list.length];
}

export function addWanted(G, n) {
  const before = G.wanted;
  G.wanted = Math.max(0, Math.min(5, G.wanted + n));
  G.hiddenTimer = 0;
  if (G.wanted > before && G.audio) G.audio.wantedUp();
}

export function updatePolice(G, dt) {
  updateHelicopter(G, dt);

  // Wanted turun perlahan saat tidak ada polisi yang melihat pemain.
  if (G.wanted > 0) {
    let seen = false;
    for (const c of G.cops) {
      if (Math.hypot(c.x - G.player.x, c.z - G.player.z) < 35) { seen = true; break; }
    }
    for (const v of G.vehicles) {
      if (v.type === 'police' && Math.hypot(v.x - G.player.x, v.z - G.player.z) < 40) { seen = true; break; }
    }
    if (G.heli) seen = true;
    if (!seen) {
      G.hiddenTimer += dt;
      if (G.hiddenTimer >= WANTED_DECAY_SECONDS[G.wanted]) {
        const was = G.wanted;
        G.wanted -= 1;
        G.hiddenTimer = 0;
        G.events.push('wantedDown');
        if (G.wanted === 0 && was >= 3) {
          // Lolos dari kejaran besar: +50 Rep.
          G.rep = (G.rep || 0) + 50;
          G.stats.escapes = (G.stats.escapes || 0) + 1;
          G.cashFloaters.push({ x: G.player.x, z: G.player.z, text: 'LOLOS! +50 REP', life: 1.5 });
        }
      }
    } else {
      G.hiddenTimer = 0;
    }
  }

  // Spawn polisi sesuai bintang.
  const wantFoot = COP_COUNTS[G.wanted];
  const wantCars = COP_CAR_COUNTS[G.wanted];
  let foot = 0;
  let cars = 0;
  for (const c of G.cops) if (!c.dead) foot += 1;
  for (const v of G.vehicles) if (v.type === 'police' && !v.dead) cars += 1;
  for (let i = foot; i < wantFoot; i += 1) spawnCop(G);
  for (let i = cars; i < wantCars; i += 1) spawnCopCar(G);

  // Polisi jalan kaki: kejar, tangkap saat sangat dekat, tembak dari jauh.
  for (const c of G.cops) {
    if (c.dead) continue;
    const dx = G.player.x - c.x;
    const dz = G.player.z - c.z;
    const d = Math.hypot(dx, dz);
    c.dist = Math.round(d);
    c.status = d < 3 ? 'PENANGKAPAN' : (d < 35 ? 'PENGEJARAN' : 'MENCARI');
    const sp = 4.5 + G.wanted * 0.4;
    if (d > 0.6) {
      c.angle = Math.atan2(dx, dz);
      c.x += Math.sin(c.angle) * sp * dt;
      c.z += Math.cos(c.angle) * sp * dt;
    }
    if (d < 1.8) {
      if (G.player.onFoot) {
        G.events.push('busted');
      } else {
        c.attackTimer -= dt;
        if (c.attackTimer <= 0) {
          c.attackTimer = 1.2;
          damagePlayer(G, 6);
        }
      }
    }
    // Polisi menembak saat wanted >= 3 dan jarak menengah.
    if (G.wanted >= 3 && d > 10 && d < 35) {
      c.shootTimer -= dt;
      if (c.shootTimer <= 0) {
        c.shootTimer = 1.4 + G.rng.range(0, 0.8);
        G.bullets.push({
          x: c.x, z: c.z, angle: Math.atan2(dx, dz) + G.rng.range(-0.12, 0.12),
          speed: 70, damage: 7, life: 1.2, from: 'cop',
        });
        if (G.audio) G.audio.shoot();
      }
    }
  }

  // Mobil polisi: kejar + tabrak pemain.
  for (const v of G.vehicles) {
    if (v.type !== 'police' || v.dead) continue;
    const dx = G.player.x - v.x;
    const dz = G.player.z - v.z;
    const d = Math.hypot(dx, dz);
    v.dist = Math.round(d);
    v.status = v.roadblockCar ? 'ROADBLOCK' : (d < 10 && Math.abs(v.speed) > 10 ? 'RAMMING' : (d < 55 ? 'PURSUIT' : 'MENCARI'));
    const want = Math.atan2(dx, dz);
    let da = want - v.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    v.angle += Math.max(-2.6 * dt, Math.min(2.6 * dt, da));
    const target = d > 5 ? v.top : 8;
    v.speed += Math.sign(target - v.speed) * 16 * dt;
    v.x += Math.sin(v.angle) * v.speed * dt;
    v.z += Math.cos(v.angle) * v.speed * dt;
    // Tabrak pemain.
    if (d < 3.4 && Math.abs(v.speed) > 7) {
      if (G.player.vehicle && G.player.vehicle !== v) {
        G.player.vehicle.health -= 6;
        v.speed *= 0.5;
        G.shake = Math.max(G.shake, 5);
        if (G.audio) G.audio.crash();
      } else if (G.player.onFoot) {
        damagePlayer(G, 14);
        v.speed *= 0.4;
      }
    }
    if (d > 130) v.dead = true;
  }
  for (let i = G.cops.length - 1; i >= 0; i -= 1) {
    if (G.cops[i].dead) G.cops.splice(i, 1);
  }

  // Sirene saat ada polisi dekat.
  let near = false;
  for (const v of G.vehicles) {
    if (v.type === 'police' && Math.hypot(v.x - G.player.x, v.z - G.player.z) < 55) near = true;
  }
  if (G.audio) G.audio.siren(near && G.wanted > 0);

  // Roadblock di bintang 4-5: dua mobil patroli melintang di depan pemain.
  if (G.wanted >= 4 && !G.roadblock && G.rng.chance(dt * 0.15)) {
    const fx = Math.sin(G.player.angle);
    const fz = Math.cos(G.player.angle);
    G.roadblock = { x: G.player.x + fx * 40, z: G.player.z + fz * 40, timer: 25 };
    for (let i = 0; i < 2; i += 1) {
      const v = makeVehicle(G.rng, 'police', G.roadblock.x + (i === 0 ? -4 : 4), G.roadblock.z, Math.PI / 2);
      v.parked = true;
      v.roadblockCar = true;
      v.name = nextCopName(G, COP_CAR_NAMES);
      v.status = 'ROADBLOCK';
      v.dist = 400;
      G.vehicles.push(v);
    }
  }
  if (G.roadblock) {
    G.roadblock.timer -= dt;
    if (G.roadblock.timer <= 0) G.roadblock = null;
  }
}

function spawnCop(G) {
  const a = G.rng.range(0, Math.PI * 2);
  const r = G.rng.range(30, 45);
  G.cops.push({
    x: G.player.x + Math.sin(a) * r, z: G.player.z + Math.cos(a) * r,
    angle: 0, dead: false, attackTimer: 0, shootTimer: G.rng.range(0.5, 1.5),
    health: 40, name: nextCopName(G, COP_FOOT_NAMES), status: 'PENGEJARAN', dist: 40,
  });
}

function spawnCopCar(G) {
  const a = G.rng.range(0, Math.PI * 2);
  const r = G.rng.range(35, 50);
  const v = makeVehicle(G.rng, 'police', G.player.x + Math.sin(a) * r, G.player.z + Math.cos(a) * r, 0);
  v.ai = null;
  v.name = nextCopName(G, COP_CAR_NAMES);
  v.status = 'PURSUIT';
  v.dist = 45;
  G.vehicles.push(v);
}
