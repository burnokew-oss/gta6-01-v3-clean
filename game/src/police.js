// police.js — AI polisi Teluk Cerah: patroli mengejar dengan formasi
// mengapit kiri-kanan pemain, roadblock di wanted tinggi, tingkat wanted
// 0-5 bintang, dan teks dispatch radio untuk HUD.
import { makeCar, updateLightbar } from "./vehicles.js";
import { POLICE_PLATES } from "./config.js";

export class Police {
  constructor(scene) {
    this.scene = scene;
    this.units = [];
    this.wanted = 0;
    this.heat = 0;
    this.dispatchLog = [];
    this.blockers = [];
  }
  setWanted(level, reason) {
    const next = Math.max(0, Math.min(5, level));
    if (next !== this.wanted) {
      this.wanted = next;
      if (next > 0) this.pushDispatch("Dispatch: wanted " + next + " bintang — " + (reason || "tersangka terlihat di avenue utama"));
      this.syncUnits();
    }
  }
  addHeat(amount) {
    this.heat += amount;
    if (this.heat > 30 && this.wanted < 5) { this.setWanted(this.wanted + 1, "kejahatan berlanjut"); this.heat = 0; }
  }
  coolDown(dt) {
    this.heat = Math.max(0, this.heat - dt * 2);
  }
  pushDispatch(text) {
    this.dispatchLog.unshift(text);
    if (this.dispatchLog.length > 4) this.dispatchLog.pop();
  }
  syncUnits() {
    const need = this.wanted === 0 ? 0 : this.wanted + 1;
    while (this.units.length < need) {
      const idx = this.units.length;
      const car = makeCar({ color: 0xf1f5f9, plate: POLICE_PLATES[idx % POLICE_PLATES.length], police: true, unit: idx + 7 });
      car.position.set(-30 - idx * 8, 0, idx % 2 ? 14 : -14);
      this.scene.add(car);
      this.units.push({ car, speed: 0, angle: Math.PI, flank: idx % 2 ? 1 : -1, idx });
      this.pushDispatch("Unit " + String(idx + 7).padStart(2, "0") + " meluncur, pelat " + POLICE_PLATES[idx % POLICE_PLATES.length]);
    }
    while (this.units.length > need) {
      const u = this.units.pop();
      this.scene.remove(u.car);
    }
    if (this.wanted >= 4 && this.blockers.length === 0) this.makeRoadblock();
    if (this.wanted < 4) { for (const b of this.blockers) this.scene.remove(b); this.blockers = []; }
  }
  makeRoadblock() {
    for (let i = 0; i < 2; i++) {
      const car = makeCar({ color: 0xf1f5f9, plate: POLICE_PLATES[(i + 2) % POLICE_PLATES.length], police: true, unit: i + 21 });
      car.position.set(52, 0, i === 0 ? -3.4 : 3.4);
      car.rotation.y = Math.PI / 2 + (i ? 0.22 : -0.22);
      this.scene.add(car);
      this.blockers.push(car);
    }
    this.pushDispatch("Roadblock didirikan di avenue timur, semua unit siaga");
  }
  placeFlanking(heroPos, heroAngle) {
    // Penempatan deterministik untuk adegan chase: dua unit PENUH mengapit.
    this.syncUnits();
    const fx = Math.cos(heroAngle), fz = -Math.sin(heroAngle);
    const rx = -fz, rz = fx;
    this.units.slice(0, 2).forEach((u, i) => {
      const side = i === 0 ? -1 : 1;
      u.car.position.set(
        heroPos.x - fx * 4.6 + rx * side * 5.6,
        0,
        heroPos.z - fz * 4.6 + rz * side * 5.6
      );
      u.car.rotation.y = heroAngle;
      u.speed = 24;
    });
  }
  update(dt, t, target, targetSpeed) {
    for (const u of this.units) {
      const fx = Math.cos(target.angle || 0), fz = -Math.sin(target.angle || 0);
      const goalX = target.x - fx * 5 + (-fz) * u.flank * 5.4;
      const goalZ = target.z - fz * 5 + fx * u.flank * 5.4;
      const dx = goalX - u.car.position.x, dz = goalZ - u.car.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      const want = Math.atan2(-dz, dx);
      let diff = want - u.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      u.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, diff));
      const top = 30 + this.wanted * 3.4;
      u.speed += ((dist > 4 ? top : targetSpeed) - u.speed) * Math.min(1, dt * 1.4);
      u.car.position.x += Math.cos(u.angle) * u.speed * dt;
      u.car.position.z += -Math.sin(u.angle) * u.speed * dt;
      u.car.rotation.y = u.angle;
      for (const w of u.car.userData.wheels) w.rotation.z -= u.speed * dt * 2.2;
      updateLightbar(u.car, t);
    }
    for (const b of this.blockers) updateLightbar(b, t + 1);
  }
}
