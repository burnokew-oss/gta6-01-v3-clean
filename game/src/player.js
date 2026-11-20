// player.js — Raka: karakter jalan kaki beranatomi penuh dan mode
// mengemudi mobil hero, kamera orang ketiga rendah-dekat saat chase.
import { makeCar } from "./vehicles.js";
import { makePerson, animatePerson } from "./pedestrians.js";
import { mulberry32 } from "./random.js";
import { VEHICLES } from "./config.js";

export class Player {
  constructor(scene) {
    const rng = mulberry32(777);
    this.avatar = makePerson(rng, { shirt: 0xd92323, pants: 0x1e3a5f, skin: 0xc98a5a });
    this.avatar.scale.setScalar(1.06);
    scene.add(this.avatar);
    const heroSpec = VEHICLES[0];
    this.car = makeCar({ color: heroSpec.color, plate: heroSpec.plate });
    scene.add(this.car);
    this.mode = "drive";
    this.x = 0; this.z = 0; this.angle = 0;
    this.speed = 0;
    this.carX = -6; this.carZ = 0; this.carAngle = 0; this.carSpeed = 0;
    this.hp = 100; this.armor = 50;
    this.money = 850; this.rep = 12;
    this.nos = 100; this.nosLevel = 0; this.engineLevel = 0;
    this.placeHero(0, 0, 0);
  }
  placeHero(x, z, angle) {
    this.carX = x; this.carZ = z; this.carAngle = angle; this.carSpeed = 0;
    this.x = x; this.z = z; this.angle = angle;
    this.syncMeshes(0);
  }
  enterExit() {
    if (this.mode === "drive") {
      this.mode = "foot";
      this.x = this.carX + Math.cos(this.carAngle + Math.PI / 2) * 2.2;
      this.z = this.carZ - Math.sin(this.carAngle + Math.PI / 2) * 2.2;
      this.avatar.visible = true;
    } else {
      const d = Math.hypot(this.x - this.carX, this.z - this.carZ);
      if (d < 4.5) { this.mode = "drive"; this.avatar.visible = false; }
    }
  }
  update(dt, input, t) {
    if (this.mode === "drive") {
      const accel = 22 + this.engineLevel * 3;
      const top = 46 + this.engineLevel * 4;
      if (input.forward) this.carSpeed += accel * dt;
      else if (input.back) this.carSpeed -= (this.carSpeed > 0.5 ? 30 : 10) * dt;
      else this.carSpeed -= this.carSpeed * 0.7 * dt;
      let boost = 1;
      if (input.sprint && this.nos > 0 && this.carSpeed > 4) { boost = 1.45; this.nos = Math.max(0, this.nos - dt * 32); }
      else this.nos = Math.min(100, this.nos + dt * 5);
      this.carSpeed = Math.max(-12, Math.min(top * boost, this.carSpeed));
      const steer = (input.left ? 1 : 0) - (input.right ? 1 : 0);
      if (Math.abs(this.carSpeed) > 0.4) this.carAngle += steer * dt * 1.55 * Math.sign(this.carSpeed) * Math.min(1, Math.abs(this.carSpeed) / 12);
      this.carX += Math.cos(this.carAngle) * this.carSpeed * dt;
      this.carZ += -Math.sin(this.carAngle) * this.carSpeed * dt;
      this.carX = Math.max(-124, Math.min(124, this.carX));
      this.carZ = Math.max(-124, Math.min(126, this.carZ));
      this.x = this.carX; this.z = this.carZ; this.angle = this.carAngle;
      this.speed = this.carSpeed;
    } else {
      const sp = input.sprint ? 8.5 : 4.6;
      let mx = 0, mz = 0;
      if (input.forward) mz -= 1;
      if (input.back) mz += 1;
      if (input.left) mx -= 1;
      if (input.right) mx += 1;
      const len = Math.hypot(mx, mz) || 1;
      if (mx || mz) {
        this.x += (mx / len) * sp * dt;
        this.z += (mz / len) * sp * dt;
        this.angle = Math.atan2(-(mz / len), mx / len);
        this.speed = sp;
      } else this.speed = 0;
      this.x = Math.max(-124, Math.min(124, this.x));
      this.z = Math.max(-124, Math.min(126, this.z));
    }
    this.syncMeshes(t);
  }
  syncMeshes(t) {
    this.car.position.set(this.carX, 0, this.carZ);
    this.car.rotation.y = this.carAngle;
    for (const w of this.car.userData.wheels) w.rotation.z -= this.carSpeed * 0.03;
    if (this.mode === "drive") {
      this.avatar.visible = false;
    } else {
      this.avatar.visible = true;
      this.avatar.position.set(this.x, 0, this.z);
      this.avatar.rotation.y = this.angle + Math.PI / 2;
      animatePerson(this.avatar, t, this.speed > 0 ? 1 : 0);
    }
  }
  camera(camera) {
    if (this.mode === "drive") {
      // Rendah-dekat: hero besar memenuhi bawah frame, jalan terbentang.
      const back = 8.2, up = 2.45;
      const fx = Math.cos(this.carAngle), fz = -Math.sin(this.carAngle);
      camera.position.set(this.carX - fx * back, up, this.carZ - fz * back);
      camera.lookAt(this.carX + fx * 9, 1.15, this.carZ + fz * 9);
    } else {
      camera.position.set(this.x - Math.cos(this.angle) * 7.5, 3.1, this.z + Math.sin(this.angle) * 7.5);
      camera.lookAt(this.x + Math.cos(this.angle) * 6, 1.4, this.z - Math.sin(this.angle) * 6);
    }
  }
}
