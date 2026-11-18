// Pejalan kaki: jalan di trotoar (pinggir jalan), lari menjauh dari
// tembakan, ledakan, atau mobil ngebut. Jumlah aktif dijaga ~36 di
// sekitar pemain — yang jauh dihapus, yang baru spawn di dekat pemain.
import { CITY_HALF, ROAD_LINES } from './config.js';

const SHIRTS = [0xd94f4f, 0x4f7fd9, 0x4fd97a, 0xd9c84f, 0x9b4fd9, 0xe8e8e8, 0x333333, 0xe08a3c];

export function makePed(rng, x, z) {
  return {
    x, z, angle: rng.range(0, Math.PI * 2),
    speed: rng.range(1.8, 3), color: rng.pick(SHIRTS),
    dead: false, fleeing: false, fleeTimer: 0,
    targetAngle: rng.range(0, Math.PI * 2), retarget: rng.range(1, 4),
  };
}

export function spawnPeds(G, count) {
  const lines = ROAD_LINES;
  for (let i = 0; i < count; i += 1) {
    const vertical = G.rng.chance(0.5);
    const line = G.rng.pick(lines);
    const along = G.rng.range(-100, 100);
    const side = G.rng.chance(0.5) ? 1 : -1;
    const x = vertical ? line + side * 7.5 : along;
    const z = vertical ? along : line + side * 7.5;
    G.peds.push(makePed(G.rng, x, z));
  }
}

export function updatePeds(G, dt) {
  const px = G.player.x;
  const pz = G.player.z;
  for (const ped of G.peds) {
    if (ped.dead) continue;
    // Lari dari tembakan di dekat pemain atau mobil ngebut yang mendekat.
    let threat = null;
    if (G.shotsFiredTimer > 0) threat = { x: px, z: pz };
    for (const v of G.vehicles) {
      if (!v.dead && Math.abs(v.speed) > 10 && Math.hypot(v.x - ped.x, v.z - ped.z) < 14) {
        threat = { x: v.x, z: v.z };
        break;
      }
    }
    if (threat) {
      ped.fleeing = true;
      ped.fleeTimer = 2.5;
      ped.targetAngle = Math.atan2(ped.x - threat.x, ped.z - threat.z);
    }
    if (ped.fleeTimer > 0) {
      ped.fleeTimer -= dt;
      if (ped.fleeTimer <= 0) ped.fleeing = false;
    }
    ped.retarget -= dt;
    if (ped.retarget <= 0) {
      ped.retarget = G.rng.range(2, 6);
      // Tetap di trotoar: arah sejajar jalan terdekat.
      const lines = ROAD_LINES;
      let best = lines[0];
      let bestD = Infinity;
      for (const l of lines) {
        const d = Math.min(Math.abs(ped.x - l), Math.abs(ped.z - l));
        if (d < bestD) { bestD = d; best = l; }
      }
      const vertical = Math.abs(ped.x - best) <= Math.abs(ped.z - best);
      const dir = G.rng.chance(0.5) ? 1 : -1;
      ped.targetAngle = vertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
    const sp = ped.fleeing ? ped.speed * 2.6 : ped.speed;
    let da = ped.targetAngle - ped.angle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    ped.angle += Math.max(-3 * dt, Math.min(3 * dt, da));
    ped.x += Math.sin(ped.angle) * sp * dt;
    ped.z += Math.cos(ped.angle) * sp * dt;
    ped.x = Math.max(-CITY_HALF + 2, Math.min(CITY_HALF - 2, ped.x));
    ped.z = Math.max(-CITY_HALF + 2, Math.min(CITY_HALF - 2, ped.z));
  }
  // Bersihkan yang mati/jauh, isi ulang di sekitar pemain.
  for (let i = G.peds.length - 1; i >= 0; i -= 1) {
    const ped = G.peds[i];
    if (ped.dead) { G.peds.splice(i, 1); continue; }
    if (Math.hypot(ped.x - px, ped.z - pz) > 110) G.peds.splice(i, 1);
  }
  while (G.peds.length < 36) {
    const a = G.rng.range(0, Math.PI * 2);
    const r = G.rng.range(40, 70);
    const x = Math.max(-CITY_HALF + 4, Math.min(CITY_HALF - 4, px + Math.sin(a) * r));
    const z = Math.max(-CITY_HALF + 4, Math.min(CITY_HALF - 4, pz + Math.cos(a) * r));
    G.peds.push(makePed(G.rng, x, z));
  }
}
