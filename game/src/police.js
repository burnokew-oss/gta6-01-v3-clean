// police.js — AI polisi: patroli mengejar dengan formasi mengapit,
// roadblock di wanted tinggi, tingkat wanted 0–5 bintang, dispatch radio.
import { makeCar, policePlate } from "./vehicles.js";

const DISPATCH = [
  "Unit {u} merespons ke posisi terakhir tersangka.",
  "Semua unit: tersangka terlihat di {d}. Kejar dan hentikan.",
  "Dispatch: kendaraan merah glossy melaju ke arah dermaga.",
  "Unit {u}: formasi apit kiri-kanan, jangan sampai lolos.",
  "Helikopter Teluk-1 sudah di udara, sorot tetap di tersangka.",
  "Wanted naik. Roadblock disiapkan di jalan utama.",
];

export class Police {
  constructor(scene) {
    this.units = [];
    this.wanted = 0;
    this.heat = 0;
    this.dispatchLog = [];
    this.dispatchTimer = 0;
    for (let i = 0; i < 4; i++) {
      const mesh = makeCar({ color: 0xf2f2f2, police: true, plate: policePlate(i + 1) });
      mesh.position.set(60 + i * 20, 0, 160 + i * 14);
      mesh.visible = false;
      scene.add(mesh);
      this.units.push({ mesh, speed: 0, slot: i, roadblock: false });
    }
    this.blinkT = 0;
  }
  addHeat(amount, district = "Pusat Cerah") {
    this.heat = Math.min(100, this.heat + amount);
    const stars = Math.min(5, Math.floor(this.heat / 18) + (this.heat > 4 ? 1 : 0));
    if (stars > this.wanted) {
      this.wanted = stars;
      this.say(DISPATCH[Math.min(DISPATCH.length - 1, stars + 1)]
        .replace("{u}", String(2 + stars)).replace("{d}", district));
    }
  }
  cool(dt) {
    this.heat = Math.max(0, this.heat - dt * 1.1);
    this.wanted = Math.min(5, Math.floor(this.heat / 18) + (this.heat > 4 ? 1 : 0));
  }
  say(text) {
    this.dispatchLog.unshift(text);
    if (this.dispatchLog.length > 3) this.dispatchLog.pop();
  }
  activeCount() { return this.wanted <= 0 ? 0 : Math.min(4, this.wanted + 1); }
  update(dt, t, targetPos, targetSpeed = 0) {
    this.blinkT = t;
    const n = this.activeCount();
    this.units.forEach((u, i) => {
      const active = i < n;
      u.mesh.visible = active;
      if (!active) return;
      // slot formasi: apit kiri, apit kanan, belakang, roadblock depan
      const back = new THREE.Vector3(0, 0, 1);
      let goal;
      if (this.wanted >= 4 && i === 3) {
        const ahead = targetPos.clone(); ahead.z -= 26; ahead.x += 4;
        goal = ahead; u.roadblock = true;
      } else {
        const side = i === 0 ? -4.6 : i === 1 ? 4.6 : 0;
        goal = targetPos.clone(); goal.x += side; goal.z += i === 2 ? 8.5 : 1.5;
        u.roadblock = false;
      }
      const to = goal.clone().sub(u.mesh.position); to.y = 0;
      const dist = to.length();
      const wantYaw = Math.atan2(to.x, to.z) - Math.PI / 2;
      let dy = wantYaw - u.mesh.rotation.y;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      u.mesh.rotation.y += THREE.MathUtils.clamp(dy, -2.4 * dt, 2.4 * dt);
      const topSpeed = u.roadblock && dist < 3 ? 0 : 26 + this.wanted * 2.2;
      u.speed = THREE.MathUtils.clamp(dist * 1.4, 0, topSpeed);
      const fwd = new THREE.Vector3(1, 0, 0).applyEuler(u.mesh.rotation);
      u.mesh.position.addScaledVector(fwd, u.speed * dt);
      for (const w of u.mesh.userData.wheels) w.rotation.z -= u.speed * dt / 0.42;
      // lightbar berkedip bergantian merah-biru
      const mats = u.mesh.userData.lightbarMats;
      if (mats) mats.forEach((m, j) => {
        const on = Math.sin(t * 10 + (j % 2) * Math.PI) > -0.2;
        m.color.setHex(!on ? 0x330a10 : (j % 2 ? 0x2255ff : 0xff2233));
      });
      void back;
    });
    this.dispatchTimer -= dt;
    if (this.wanted > 0 && this.dispatchTimer <= 0) {
      this.dispatchTimer = 9;
      this.say(DISPATCH[Math.floor(Math.random() * 3)].replace("{u}", String(1 + Math.floor(Math.random() * 6))).replace("{d}", "Pusat Cerah"));
    }
  }
  setChasePose(heroPos, heroYaw) {
    // dua patroli PENUH mengapit hero kiri-kanan, satu di belakang
    this.wanted = 4; this.heat = 76;
    const right = new THREE.Vector3(Math.cos(heroYaw), 0, -Math.sin(heroYaw));
    const fwd = new THREE.Vector3(Math.sin(heroYaw), 0, Math.cos(heroYaw));
    const carYaw = heroYaw - Math.PI / 2; // sumbu +x mobil sejajar arah hero
    const poses = [
      { off: right.clone().multiplyScalar(-5.2).addScaledVector(fwd, 0.6), yaw: carYaw },
      { off: right.clone().multiplyScalar(5.2).addScaledVector(fwd, 0.2), yaw: carYaw + 0.06 },
      { off: fwd.clone().multiplyScalar(-10.5), yaw: carYaw },
      { off: fwd.clone().multiplyScalar(-20).addScaledVector(right, -3), yaw: carYaw },
    ];
    this.units.forEach((u, i) => {
      u.mesh.visible = true;
      u.mesh.position.copy(heroPos).add(poses[i].off);
      u.mesh.position.y = 0;
      u.mesh.rotation.y = poses[i].yaw;
      const mats = u.mesh.userData.lightbarMats;
      if (mats) mats.forEach((m, j) => m.color.setHex(j % 2 ? 0x2255ff : 0xff2233));
    });
    this.dispatchLog = [
      "Unit 5: formasi apit kiri-kanan, tersangka terjepit.",
      "Helikopter Teluk-1 di udara, sorot mengunci kendaraan merah.",
      "Dispatch: wanted 4 bintang, semua unit ke jalan utama.",
    ];
  }
}
