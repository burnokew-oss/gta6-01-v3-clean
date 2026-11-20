// Pejalan kaki beranatomi penuh yang berjalan di trotoar dan menyeberang di zebra.
import "three";
const THREE = window.THREE;
import { CONFIG } from "./config.js";
import { buildHuman, animateWalk } from "./player.js";
import { makeRng } from "./random.js";

const shirtColors = [0xd96a4a, 0x4a9ad9, 0x7ac74f, 0xf2d13c, 0xb78bff, 0xff8fb3, 0x5fc9b8, 0xe8e2d4];
const pantsColors = [0x2c3242, 0x5a4632, 0x3a4a6a, 0x6a6a72, 0x243028];

export function createPedestrians(state, count) {
  const rng = makeRng(1234);
  const peds = [];
  for (let i = 0; i < count; i++) {
    const vertical = i % 2 === 0;
    const axis = vertical ? CONFIG.avenueXs[i % CONFIG.avenueXs.length] : CONFIG.streetZs[i % CONFIG.streetZs.length];
    const side = i % 4 < 2 ? 1 : -1;
    const along = rng.range(-195, 195);
    const x = vertical ? axis + side * 10.4 : along;
    const z = vertical ? along : axis + side * 10.4;
    const mesh = buildHuman({
      shirt: shirtColors[i % shirtColors.length],
      pants: pantsColors[i % pantsColors.length],
      skin: [0xc98d64, 0xa96b42, 0x8a5433, 0xe0aa7e][i % 4],
      hair: [0x241a12, 0x3a2a18, 0x14100c, 0x5a4028][i % 4],
      hat: i % 5 === 0 ? 0xd92632 : null,
    });
    mesh.position.set(x, 0.2, z);
    state.world.scene.add(mesh);
    peds.push({
      mesh, pos: mesh.position, vertical, axis, side,
      dir: i % 3 === 0 ? -1 : 1, speed: rng.range(1.1, 2.1),
      phase: rng.range(0, 6), flee: 0, alive: true, health: 40,
    });
  }
  return peds;
}

export function updatePedestrians(state, dt) {
  if (state.staged === "title") return;
  const danger = state.combat && state.combat.lastShotAt && (performance.now() - state.combat.lastShotAt < 2600);
  for (const ped of state.peds) {
    if (!ped.alive) continue;
    const toPlayer = ped.pos.distanceTo(state.player.pos);
    if ((danger && toPlayer < 26) || (state.player.car && Math.abs(state.player.car.speed) > 16 && toPlayer < 9)) ped.flee = 1.6;
    if (ped.flee > 0) ped.flee -= dt;
    const sp = ped.flee > 0 ? ped.speed * 3.1 : ped.speed;
    const step = ped.dir * sp * dt;
    if (ped.vertical) ped.pos.z += step; else ped.pos.x += step;
    if (ped.pos.x > 205) { ped.pos.x = 205; ped.dir = -1; }
    if (ped.pos.x < -205) { ped.pos.x = -205; ped.dir = 1; }
    if (ped.pos.z > 205) { ped.pos.z = 205; ped.dir = -1; }
    if (ped.pos.z < -205) { ped.pos.z = -205; ped.dir = 1; }
    const heading = ped.vertical ? (ped.dir > 0 ? 0 : Math.PI) : (ped.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    ped.mesh.rotation.y = heading;
    ped.phase += dt * sp * 3.6;
    animateWalk(ped.mesh, ped.phase, 1);
    // Jaga jarak dari kamera: yang terlalu jauh dipindah mendekat.
    if (toPlayer > 130) {
      ped.pos.x = state.player.pos.x + (ped.vertical ? ped.side * 10.4 - 0 : (Math.random() - 0.5) * 60);
      ped.pos.z = state.player.pos.z + (ped.vertical ? (Math.random() - 0.5) * 60 : ped.side * 10.4);
      ped.pos.x = THREE.MathUtils.clamp(ped.pos.x, -200, 200);
      ped.pos.z = THREE.MathUtils.clamp(ped.pos.z, -200, 200);
    }
  }
}
