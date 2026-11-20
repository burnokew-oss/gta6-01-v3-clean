// Figur manusia beranatomi penuh + pemain Raka.
import "three";
const THREE = window.THREE;
import { CONFIG } from "./config.js";

const skinTones = [0xc98d64, 0xa96b42, 0x8a5433, 0xe0aa7e];

export function buildHuman(opts = {}) {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: opts.skin ?? skinTones[0], roughness: 0.72 });
  const shirt = new THREE.MeshStandardMaterial({ color: opts.shirt ?? 0x2f6fd0, roughness: 0.85 });
  const pants = new THREE.MeshStandardMaterial({ color: opts.pants ?? 0x2c3242, roughness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x22242c, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: opts.hair ?? 0x241a12, roughness: 0.95 });

  const hips = new THREE.Group(); hips.position.y = 0.98; g.add(hips);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.21, 0.34, 6, 12), shirt);
  torso.position.y = 0.34; torso.scale.set(1.12, 1, 0.78); torso.castShadow = true; hips.add(torso);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.235, 0.07, 12), dark);
  belt.position.y = 0.08; belt.scale.z = 0.8; hips.add(belt);

  const headG = new THREE.Group(); headG.position.y = 0.78; hips.add(headG);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), skin); neck.position.y = -0.05; headG.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.155, 18, 14), skin);
  head.scale.set(0.92, 1.08, 0.98); head.castShadow = true; headG.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
  hair.position.y = 0.025; hair.scale.set(0.95, 1.05, 1); headG.add(hair);
  if (opts.hat) {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.025, 16), dark); brim.position.y = 0.1; headG.add(brim);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.145, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: opts.hat, roughness: 0.8 }));
    top.position.y = 0.1; headG.add(top);
  }
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c1410 });
  for (const sx of [-0.055, 0.055]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), eyeMat);
    eye.position.set(sx, 0.01, 0.145); headG.add(eye);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), skin);
  nose.position.set(0, -0.03, 0.152); nose.scale.set(0.8, 1.2, 0.8); headG.add(nose);

  function arm(side) {
    const sh = new THREE.Group(); sh.position.set(0.27 * side, 0.58, 0); hips.add(sh);
    const up = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.2, 4, 8), shirt); up.position.y = -0.15; up.castShadow = true; sh.add(up);
    const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
    const fo = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.18, 4, 8), skin); fo.position.y = -0.14; el.add(fo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), skin); hand.position.y = -0.3; hand.scale.set(0.8, 1.15, 0.9); el.add(hand);
    sh.rotation.z = side * 0.14;
    return { sh, el };
  }
  function leg(side) {
    const hip = new THREE.Group(); hip.position.set(0.1 * side, 0, 0); hips.add(hip);
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.085, 0.24, 4, 8), pants); th.position.y = -0.22; th.castShadow = true; hip.add(th);
    const kn = new THREE.Group(); kn.position.y = -0.44; hip.add(kn);
    const sh2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.24, 4, 8), pants); sh2.position.y = -0.2; kn.add(sh2);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), dark);
    shoe.position.set(0, -0.42, 0.045); shoe.scale.set(0.85, 0.5, 1.7); kn.add(shoe);
    return { hip, kn };
  }
  const armL = arm(-1), armR = arm(1), legL = leg(-1), legR = leg(1);
  g.userData.parts = { hips, headG, armL, armR, legL, legR };
  return g;
}

export function poseAim(human, on) {
  const p = human.userData.parts;
  if (on) {
    p.armR.sh.rotation.x = -1.35; p.armR.sh.rotation.z = -0.1; p.armR.el.rotation.x = -0.15;
    p.armL.sh.rotation.x = -1.2; p.armL.sh.rotation.z = 0.5; p.armL.el.rotation.x = -0.5;
  } else {
    p.armR.sh.rotation.x = 0; p.armL.sh.rotation.x = 0; p.armL.sh.rotation.z = 0.14; p.armL.el.rotation.x = 0;
  }
}

export function animateWalk(human, phase, amount) {
  const p = human.userData.parts;
  p.legL.hip.rotation.x = Math.sin(phase) * 0.62 * amount;
  p.legR.hip.rotation.x = -Math.sin(phase) * 0.62 * amount;
  p.legL.kn.rotation.x = Math.max(0, -Math.sin(phase)) * 0.7 * amount;
  p.legR.kn.rotation.x = Math.max(0, Math.sin(phase)) * 0.7 * amount;
  if (!human.userData.aiming) {
    p.armL.sh.rotation.x = -Math.sin(phase) * 0.5 * amount;
    p.armR.sh.rotation.x = Math.sin(phase) * 0.5 * amount;
  }
  p.hips.position.y = 0.98 + Math.abs(Math.sin(phase)) * 0.045 * amount;
}

export function createPlayer(state) {
  const mesh = buildHuman({ shirt: 0x2f6fd0, pants: 0x232838, hat: 0x1f2733, skin: skinTones[0] });
  mesh.position.set(4, 0, 30);
  state.world.scene.add(mesh);
  return {
    mesh, pos: mesh.position, heading: Math.PI, speed: 0, walkPhase: 0,
    health: 100, armor: 0, weaponIndex: 0, car: null, dead: false,
  };
}

export function updatePlayer(state, dt) {
  const p = state.player;
  if (p.car || state.staged) return;
  const k = state.input.keys;
  let mx = 0, mz = 0;
  if (k[CONFIG.keys.forward]) mz -= 1;
  if (k[CONFIG.keys.back]) mz += 1;
  if (k[CONFIG.keys.left]) mx -= 1;
  if (k[CONFIG.keys.right]) mx += 1;
  const moving = (mx !== 0 || mz !== 0);
  const run = k["ShiftLeft"] || k["ShiftRight"];
  const sp = run ? CONFIG.playerRunSpeed : CONFIG.playerSpeed;
  if (moving) {
    const len = Math.hypot(mx, mz); mx /= len; mz /= len;
    const camYaw = state.camYaw || 0;
    const sin = Math.sin(camYaw), cos = Math.cos(camYaw);
    const wx = mx * cos - mz * sin, wz = mx * sin + mz * cos;
    p.pos.x = THREE.MathUtils.clamp(p.pos.x + wx * sp * dt, -205, 205);
    p.pos.z = THREE.MathUtils.clamp(p.pos.z + wz * sp * dt, -205, 205);
    p.heading = Math.atan2(wx, wz);
    p.walkPhase += dt * (run ? 13 : 9.5);
    p.speed = sp;
  } else p.speed = 0;
  p.mesh.position.copy(p.pos);
  p.mesh.rotation.y = p.heading;
  animateWalk(p.mesh, p.walkPhase, moving ? 1 : 0);
  state.camYaw = p.heading + Math.PI;
}
