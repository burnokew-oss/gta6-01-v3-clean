// player.js — karakter Raka: mode jalan kaki dan mengemudi, kamera orang
// ketiga rendah-dekat saat chase, fisika mobil arkade.
import { makePerson, poseWalk, poseStand } from "./pedestrians.js";
import { Rng } from "./random.js";

export class Player {
  constructor(scene) {
    const rng = new Rng(11);
    this.mesh = makePerson(rng, { shirt: 0xd21f2e, sleeve: 0xb8151f, pants: 0x1e3a5c, cap: 0x14161a, skin: 0xc98d5e, hair: 0x14100c });
    this.mesh.position.set(6, 0, 26);
    scene.add(this.mesh);
    this.pos = this.mesh.position;
    this.yaw = Math.PI;
    this.walkPhase = 0;
    this.speed = 0;
    this.driving = null; // referensi mobil {mesh, spec, state}
    this.hp = 100; this.armor = 0;
    this.money = 250; this.rep = 0;
    this.camYaw = Math.PI;
  }
  enterCar(car) {
    this.driving = car;
    this.mesh.visible = false;
  }
  exitCar() {
    if (!this.driving) return;
    const m = this.driving.mesh;
    this.pos.set(m.position.x + 2.6, 0, m.position.z);
    this.driving = null;
    this.mesh.visible = true;
  }
  update(dt, input, city) {
    if (this.driving) { this.updateDrive(dt, input); return; }
    const ax = input.axis();
    const moving = ax.x !== 0 || ax.y !== 0;
    if (moving) {
      const fwd = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw));
      const right = new THREE.Vector3(-Math.cos(this.camYaw), 0, Math.sin(this.camYaw));
      const move = fwd.multiplyScalar(-ax.y).addScaledVector(right, ax.x).normalize();
      const targetYaw = Math.atan2(move.x, move.z);
      let dy = targetYaw - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this.yaw += dy * Math.min(1, dt * 12);
      const run = input.down("ShiftLeft", "ShiftRight") ? 7.4 : 4.4;
      this.pos.addScaledVector(move, run * dt);
      this.walkPhase += dt * run * 1.9;
      poseWalk(this.mesh, this.walkPhase, 1);
      this.speed = run;
    } else {
      poseStand(this.mesh);
      this.speed = 0;
    }
    city.collide(this.pos, 0.5);
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.yaw;
  }
  updateDrive(dt, input) {
    const car = this.driving;
    const st = car.state;
    const fwdIn = (input.down("KeyW", "ArrowUp") ? 1 : 0) - (input.down("KeyS", "ArrowDown") ? 1 : 0);
    const steer = (input.down("KeyA", "ArrowLeft") ? 1 : 0) - (input.down("KeyD", "ArrowRight") ? 1 : 0);
    const boost = input.down("ShiftLeft", "ShiftRight") && car.upgrades?.nos ? 1.7 : 1;
    st.speed = THREE.MathUtils.clamp(
      st.speed + fwdIn * car.spec.accel * boost * dt - st.speed * 0.55 * dt,
      -car.spec.topSpeed * 0.4, car.spec.topSpeed * boost);
    if (input.down("Space")) st.speed -= st.speed * 3 * dt;
    st.yaw += steer * dt * 1.7 * Math.sign(st.speed) * Math.min(1, Math.abs(st.speed) / 9);
    const fwd = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw));
    car.mesh.position.addScaledVector(fwd, st.speed * dt);
    car.mesh.rotation.y = st.yaw - Math.PI / 2;
    for (const w of car.mesh.userData.wheels) w.rotation.z -= st.speed * dt / 0.42;
    this.pos.copy(car.mesh.position);
    this.speed = Math.abs(st.speed);
    this.yaw = st.yaw;
    this.walkPhase = 0;
  }
  updateCamera(camera, dt, lowClose = false) {
    if (this.driving) {
      const st = this.driving.state;
      const back = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw)).multiplyScalar(-8.2);
      const want = this.pos.clone().add(back).add(new THREE.Vector3(0, lowClose ? 2.1 : 2.9, 0));
      camera.position.lerp(want, Math.min(1, dt * 7));
      const ahead = this.pos.clone().add(new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw)).multiplyScalar(9));
      ahead.y = 1.2;
      camera.lookAt(ahead);
      this.camYaw = st.yaw + Math.PI;
    } else {
      const back = new THREE.Vector3(Math.sin(this.camYaw), 0, Math.cos(this.camYaw)).multiplyScalar(-6.4);
      const want = this.pos.clone().add(back).add(new THREE.Vector3(0, 3.1, 0));
      camera.position.lerp(want, Math.min(1, dt * 8));
      const look = this.pos.clone(); look.y = 1.5;
      camera.lookAt(look);
    }
  }
  setChaseCamera(camera) { // kamera rendah-dekat deterministik untuk shot chase
    const st = this.driving.state;
    const back = new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw)).multiplyScalar(-9.6);
    camera.position.copy(this.pos).add(back).add(new THREE.Vector3(1.1, 2.35, 0));
    const ahead = this.pos.clone().add(new THREE.Vector3(Math.sin(st.yaw), 0, Math.cos(st.yaw)).multiplyScalar(10));
    ahead.y = 1.1;
    camera.lookAt(ahead);
  }
}
