// combat.js — senjata tinju/pistol/shotgun, musuh dengan health bar,
// muzzle flash, hit feedback, pose tempur jongkok di balik penutup.
import { WEAPONS } from "./config.js";
import { Rng } from "./random.js";
import { makePerson, poseCrouchAim } from "./pedestrians.js";

export class Combat {
  constructor(scene, audio) {
    this.scene = scene;
    this.audio = audio;
    this.weaponIdx = 1;
    this.ammo = { pistol: 60, shotgun: 18 };
    this.cooldown = 0;
    this.enemies = [];
    this.flashT = 0;
    this.flash = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0 }));
    scene.add(this.flash);
    this.tracerMat = new THREE.LineBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0 });
    this.tracer = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), this.tracerMat);
    scene.add(this.tracer);
    this.onKill = null;
    this.onCrime = null;
  }
  get weapon() { return WEAPONS[this.weaponIdx]; }
  spawnEnemy(x, z, hp = 60) {
    const rng = new Rng(x * 31 + z * 17 + 500);
    const mesh = makePerson(rng, { pants: 0x14161a });
    mesh.position.set(x, 0, z);
    poseCrouchAim(mesh);
    // senjata di tangan kanan
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.5), new THREE.MeshPhongMaterial({ color: 0x14161a }));
    gun.position.set(0.1, -0.62, 0.28);
    mesh.userData.parts.arms.R.el.add(gun);
    this.scene.add(mesh);
    // health bar billboard: latar gelap + isi hijau→merah
    const barBg = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.19), new THREE.MeshBasicMaterial({ color: 0x101216, depthTest: false }));
    const barFg = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.12), new THREE.MeshBasicMaterial({ color: 0x53e04f, depthTest: false }));
    barBg.position.set(x, 2.15, z); barFg.position.set(x, 2.15, z + 0.01);
    this.scene.add(barBg, barFg);
    const e = { mesh, hp, maxHp: hp, barBg, barFg, alive: true, fireT: rng.float(0.5, 2) };
    this.enemies.push(e);
    return e;
  }
  clearEnemies() {
    for (const e of this.enemies) { this.scene.remove(e.mesh, e.barBg, e.barFg); }
    this.enemies = [];
  }
  tryFire(dt, input, fromPos, aimYaw, camera) {
    this.cooldown -= dt;
    this.flashT -= dt;
    this.flash.material.opacity = Math.max(0, this.flashT * 6);
    this.tracerMat.opacity = Math.max(0, this.flashT * 3);
    const w = this.weapon;
    if (w.id !== "fist" && input.justPressed("Digit1", "Digit2", "Digit3")) { /* ditangani switchWeapon */ }
    if (!input.mouseDown || this.cooldown > 0) return null;
    if (w.id !== "fist" && this.ammo[w.id] <= 0) return null;
    this.cooldown = w.rate;
    if (w.id !== "fist") this.ammo[w.id]--;
    this.audio?.gunshot(w.id === "shotgun");
    // arah hadap pemain: vektor (sin yaw, 0, cos yaw)
    const dir = new THREE.Vector3(Math.sin(aimYaw), 0, Math.cos(aimYaw)).normalize();
    const origin = fromPos.clone(); origin.y = 1.45;
    this.flash.position.copy(origin).addScaledVector(dir, 0.7);
    this.flashT = 0.14;
    let best = null, bestDist = w.range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const to = e.mesh.position.clone().sub(fromPos); to.y = 0;
      const d = to.length();
      if (d > bestDist) continue;
      const dot = to.normalize().dot(dir);
      if (dot > 0.86) { best = e; bestDist = d; }
    }
    const end = origin.clone().addScaledVector(dir, best ? bestDist : w.range * 0.7);
    end.y = 1.3;
    this.tracer.geometry.setFromPoints([origin.clone().addScaledVector(dir, 0.7), end]);
    if (best) {
      best.hp -= w.damage;
      best.mesh.position.addScaledVector(dir, 0.24); // hit feedback: terdorong
      if (best.hp <= 0 && best.alive) {
        best.alive = false;
        best.mesh.rotation.x = -Math.PI / 2;
        best.mesh.position.y = 0.25;
        best.barBg.visible = best.barFg.visible = false;
        this.onKill?.(best);
      }
      this.onCrime?.(6);
      return best;
    }
    return null;
  }
  switchWeapon(input) {
    if (input.justPressed("Digit1")) this.weaponIdx = 0;
    if (input.justPressed("Digit2")) this.weaponIdx = 1;
    if (input.justPressed("Digit3")) this.weaponIdx = 2;
  }
  update(dt, playerPos, camera, onPlayerHit) {
    for (const e of this.enemies) {
      e.barBg.lookAt(camera.position);
      e.barFg.lookAt(camera.position);
      if (!e.alive) continue;
      const ratio = Math.max(0, e.hp / e.maxHp);
      e.barFg.scale.x = Math.max(0.001, ratio);
      e.barFg.material.color.setHSL(ratio * 0.33, 0.85, 0.5);
      e.mesh.lookAt(playerPos.x, 0, playerPos.z);
      e.fireT -= dt;
      const d = e.mesh.position.distanceTo(playerPos);
      if (e.fireT <= 0 && d < 42) {
        e.fireT = 1.1 + Math.random() * 0.9;
        this.audio?.gunshot(false);
        if (Math.random() < 0.4) onPlayerHit?.(5);
      }
    }
  }
  setShootoutPose() {
    for (const e of this.enemies) poseCrouchAim(e.mesh);
  }
}
