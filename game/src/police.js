// Polisi Teluk Cerah: unit bernama, mobil patroli mengejar, roadblock, wanted.
import "three";
const THREE = window.THREE;
import { createCar } from "./vehicles.js";
import { buildHuman, animateWalk } from "./player.js";

const UNIT_DEFS = [
  { name: "CENDRAWASIH-07", kind: "car", status: "pursuit" },
  { name: "JALAK-42", kind: "car", status: "pursuit" },
  { name: "BANGAU-18", kind: "car", status: "ramming" },
  { name: "MERAK-05", kind: "foot", status: "pursuit" },
  { name: "ELANG-11", kind: "foot", status: "pursuit" },
];

export function setWanted(state, level) {
  state.wanted = Math.max(0, Math.min(5, Math.round(level)));
  state.heatTimer = 0;
}

export function addHeat(state, amount) {
  state.heat = (state.heat || 0) + amount;
  if (state.heat >= 100 && state.wanted < 5) { state.heat = 0; setWanted(state, state.wanted + 1); }
}

export function createPolice(state) {
  const units = UNIT_DEFS.map((def, i) => {
    const unit = { ...def, distance: 999, active: false };
    if (def.kind === "car") {
      const car = createCar(state, "polisi", 0xf2f3f5, 30 + i * 14, 60 + i * 10, Math.PI, null);
      car.driver = true;
      unit.car = car;
      unit.lightbar = car.mesh.userData.lightbar;
      unit.pos = car.pos;
    } else {
      const mesh = buildHuman({ shirt: 0x274b8f, pants: 0x1d2434, hat: 0x16264a, skin: 0xa96b42 });
      mesh.position.set(20 + i * 6, 0.2, 50);
      mesh.visible = false;
      state.world.scene.add(mesh);
      unit.mesh = mesh; unit.pos = mesh.position; unit.phase = 0;
    }
    return unit;
  });
  return units;
}

export function updatePolice(state, dt) {
  if (state.staged) return;
  const seen = state.wanted > 0;
  if (state.wanted > 0) {
    let anyNear = false;
    for (const u of state.policeUnits) if (u.active && u.distance < 42) anyNear = true;
    if (!anyNear && !state.staged) {
      state.heatTimer += dt;
      if (state.heatTimer > 7) { setWanted(state, state.wanted - 1); state.heatTimer = 0; }
    } else state.heatTimer = 0;
  }
  const activeCount = [0, 1, 2, 3, 4, 5][state.wanted] || 0;
  state.policeUnits.forEach((u, idx) => {
    u.active = seen && idx < activeCount;
    const target = state.player.pos;
    if (u.car) {
      u.car.mesh.visible = true;
      if (!u.active || state.staged) { u.distance = u.car.pos.distanceTo(target); return; }
      const dx = target.x - u.car.pos.x, dz = target.z - u.car.pos.z;
      const dist = Math.hypot(dx, dz);
      u.distance = Math.round(dist);
      const want = Math.atan2(dx, dz);
      let diff = want - u.car.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      u.car.heading += THREE.MathUtils.clamp(diff, -2.4 * dt, 2.4 * dt);
      const sp = dist > 7 ? Math.min(40, 15 + dist * 0.85) : 4;
      u.car.speed += (sp - u.car.speed) * Math.min(1, dt * 1.7);
      u.car.pos.x += Math.sin(u.car.heading) * u.car.speed * dt;
      u.car.pos.z += Math.cos(u.car.heading) * u.car.speed * dt;
      u.car.mesh.position.copy(u.car.pos);
      u.car.mesh.rotation.y = u.car.heading;
      u.status = dist < 10 ? "ramming" : "pursuit";
    } else if (u.mesh) {
      u.mesh.visible = u.active && !state.staged;
      if (!u.active) { u.distance = 999; return; }
      const dx = target.x - u.pos.x, dz = target.z - u.pos.z;
      const dist = Math.hypot(dx, dz);
      u.distance = Math.round(dist);
      if (dist > 1.4) {
        u.pos.x += (dx / dist) * 5.6 * dt;
        u.pos.z += (dz / dist) * 5.6 * dt;
        u.mesh.rotation.y = Math.atan2(dx, dz);
        u.phase += dt * 11;
        animateWalk(u.mesh, u.phase, 1);
      }
      if (dist < 1.5 && !state.player.car) {
        state.bustedTimer = (state.bustedTimer || 0) + dt;
        if (state.bustedTimer > 1.1) {
          state.bustedTimer = 0;
          state.cash = Math.max(0, state.cash - 150);
          setWanted(state, 0);
          state.player.pos.set(120, 0, 54);
          state.banner = "BUSTED — denda $150";
          state.bannerAt = performance.now();
        }
      }
    }
  });
}
