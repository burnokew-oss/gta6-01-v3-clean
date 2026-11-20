// pedestrians.js — pejalan kaki beranatomi penuh: kepala berambut, torso
// berlapis pakaian, lengan bersiku, kaki berlutut, pose langkah terbaca,
// bayangan kontak. Juga dipakai untuk pemain dan musuh.
import { Rng } from "./random.js";

const SKIN = [0xf2c79b, 0xc98d5e, 0x8a5a34, 0x6e4226];
const SHIRT = [0xd21f2e, 0x2e7fc2, 0x37b85c, 0xffe93d, 0xff8a1e, 0xf15bb5, 0xf2f2f2, 0x2f8f83];
const PANTS = [0x27313a, 0x3b4a63, 0x6e5636, 0x1e3a5c, 0x555f4a];
const HAIR = [0x14100c, 0x2e1c10, 0x4a2f18, 0x777777];

function limb(w, len, mat) {
  const pivot = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, w), mat);
  m.position.y = -len / 2; m.castShadow = true;
  pivot.add(m);
  return pivot;
}

export function makePerson(rng, opts = {}) {
  const skin = new THREE.MeshPhongMaterial({ color: opts.skin ?? rng.pick(SKIN) });
  const shirt = new THREE.MeshPhongMaterial({ color: opts.shirt ?? rng.pick(SHIRT) });
  const shirt2 = new THREE.MeshPhongMaterial({ color: opts.sleeve ?? opts.shirt ?? rng.pick(SHIRT) });
  const pants = new THREE.MeshPhongMaterial({ color: opts.pants ?? rng.pick(PANTS) });
  const hairMat = new THREE.MeshPhongMaterial({ color: opts.hair ?? rng.pick(HAIR) });
  const shoe = new THREE.MeshPhongMaterial({ color: 0x1c1c20 });
  const g = new THREE.Group();

  const hips = new THREE.Group(); hips.position.y = 0.98; g.add(hips);
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.22), pants);
  pelvis.castShadow = true; hips.add(pelvis);
  const torso = new THREE.Group(); torso.position.y = 0.08; hips.add(torso);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.56, 0.26), shirt); // torso berbahu
  chest.position.y = 0.32; chest.castShadow = true; torso.add(chest);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.28), shirt2);
  collar.position.y = 0.58; torso.add(collar);
  const headG = new THREE.Group(); headG.position.y = 0.68; torso.add(headG);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 12, 10), skin);
  head.position.y = 0.14; head.scale.y = 1.15; head.castShadow = true; headG.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.163, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
  hair.position.y = 0.165; hair.scale.y = 1.12; headG.add(hair);
  if (opts.cap) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.175, 0.07, 12), new THREE.MeshPhongMaterial({ color: opts.cap }));
    cap.position.y = 0.27; headG.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.16), cap.material);
    brim.position.set(0, 0.24, 0.2); headG.add(brim);
  }
  const arms = {}, legs = {};
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.28, 0.52, 0); torso.add(sh);
    const upper = limb(0.11, 0.34, shirt2); sh.add(upper);
    const el = new THREE.Group(); el.position.y = -0.34; upper.add(el);
    const fore = limb(0.095, 0.32, skin); el.add(fore);
    arms[s < 0 ? "L" : "R"] = { sh, el };
    const hip = new THREE.Group(); hip.position.set(s * 0.11, -0.04, 0); hips.add(hip);
    const thigh = limb(0.15, 0.46, pants); hip.add(thigh);
    const knee = new THREE.Group(); knee.position.y = -0.46; thigh.add(knee);
    const shin = limb(0.12, 0.44, pants); knee.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.07, 0.26), shoe);
    foot.position.set(0, -0.44, 0.05); shin.add(foot);
    legs[s < 0 ? "L" : "R"] = { hip, knee };
  }
  // bayangan kontak
  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; g.add(blob);
  g.userData.parts = { hips, torso, headG, arms, legs };
  return g;
}

export function poseWalk(person, phase, amp = 1) {
  const p = person.userData.parts;
  const s = Math.sin(phase);
  p.legs.L.hip.rotation.x = s * 0.62 * amp;
  p.legs.R.hip.rotation.x = -s * 0.62 * amp;
  p.legs.L.knee.rotation.x = Math.max(0, -Math.cos(phase)) * 0.7 * amp + 0.05;
  p.legs.R.knee.rotation.x = Math.max(0, Math.cos(phase)) * 0.7 * amp + 0.05;
  p.arms.L.sh.rotation.x = -s * 0.5 * amp;
  p.arms.R.sh.rotation.x = s * 0.5 * amp;
  p.arms.L.el.rotation.x = -0.25 - Math.max(0, s) * 0.3;
  p.arms.R.el.rotation.x = -0.25 - Math.max(0, -s) * 0.3;
  p.hips.position.y = 0.98 + Math.abs(Math.cos(phase)) * 0.045;
  p.torso.rotation.z = s * 0.04;
}

export function poseCrouchAim(person) { // pose tempur: jongkok, senjata terangkat
  const p = person.userData.parts;
  p.hips.position.y = 0.66;
  p.legs.L.hip.rotation.x = -1.5; p.legs.L.knee.rotation.x = 2.0;
  p.legs.R.hip.rotation.x = -0.5; p.legs.R.knee.rotation.x = 1.15;
  p.torso.rotation.x = 0.24;
  p.arms.R.sh.rotation.x = -1.45; p.arms.R.el.rotation.x = -0.12;
  p.arms.L.sh.rotation.x = -1.2; p.arms.L.el.rotation.x = -0.55;
  p.headG.rotation.x = 0.1;
}

export function poseStand(person) {
  const p = person.userData.parts;
  p.hips.position.y = 0.98;
  for (const l of [p.legs.L, p.legs.R]) { l.hip.rotation.x = 0; l.knee.rotation.x = 0.03; }
  for (const a of [p.arms.L, p.arms.R]) { a.sh.rotation.x = 0; a.el.rotation.x = -0.12; }
  p.torso.rotation.x = 0;
}

export class Pedestrians {
  constructor(scene, seed, count = 26) {
    this.rng = new Rng(seed + 99);
    this.list = [];
    const spots = [];
    for (let i = 0; i < count; i++) {
      const person = makePerson(this.rng);
      const onMain = i < 12;
      const x = onMain ? this.rng.pick([-8.6, 8.6]) : Math.round(this.rng.float(-4, 4)) * 46 + this.rng.pick([-8.6, 8.6]);
      const z = this.rng.float(-190, 130);
      person.position.set(x, 0, onMain ? z : Math.round(this.rng.float(-4, 3)) * 46 + this.rng.float(-16, 16));
      person.rotation.y = this.rng.chance(0.5) ? 0 : Math.PI;
      scene.add(person);
      const dir = new THREE.Vector3(0, 0, person.rotation.y === 0 ? 1 : -1);
      this.list.push({ mesh: person, dir, speed: this.rng.float(1.1, 1.9), phase: this.rng.float(0, 6.28), crossing: false });
      spots.push(person.position);
    }
  }
  update(dt, t) {
    for (const p of this.list) {
      p.phase += dt * p.speed * 3.4;
      p.mesh.position.addScaledVector(p.dir, p.speed * dt);
      if (Math.abs(p.mesh.position.z) > 205 || Math.abs(p.mesh.position.x) > 205) {
        p.dir.multiplyScalar(-1);
        p.mesh.rotation.y += Math.PI;
      }
      poseWalk(p.mesh, p.phase);
    }
  }
  setFrozen(t) { for (const p of this.list) poseWalk(p.mesh, p.phase + 0.9); }
}
