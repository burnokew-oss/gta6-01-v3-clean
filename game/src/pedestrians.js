import 'three';
const THREE = window.THREE;
import { netOf } from './vehicles.js';

const SHIRTS = [0xd84a7a, 0x3a6ad8, 0x2f9e44, 0xe8a33a, 0x8a5ad8, 0xd8d8d8, 0xff6a5e, 0x4fd8c8];
const PANTS = [0x22242c, 0x3a4a6a, 0x5a3a2a, 0x2a2a2a];
const SKINS = [0xc98a5e, 0xe8b88a, 0x8a5a3a, 0xd8a070];
const HAIRS = [0x141414, 0x3a2a1a, 0x6a6a6a, 0x8a4a2a];

function limbMaterial(color) {
  return new THREE.MeshLambertMaterial({ color });
}

export function buildPersonFigure(opts) {
  const o = opts || {};
  const shirt = o.shirt !== undefined ? o.shirt : SHIRTS[Math.floor(Math.random() * SHIRTS.length)];
  const pants = o.pants !== undefined ? o.pants : PANTS[Math.floor(Math.random() * PANTS.length)];
  const skin = o.skin !== undefined ? o.skin : SKINS[Math.floor(Math.random() * SKINS.length)];
  const hair = o.hair !== undefined ? o.hair : HAIRS[Math.floor(Math.random() * HAIRS.length)];
  const scale = o.scale || 1;
  const group = new THREE.Group();

  const shirtMat = limbMaterial(shirt);
  const pantsMat = limbMaterial(pants);
  const skinMat = limbMaterial(skin);
  const hairMat = limbMaterial(hair);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 0.34), shirtMat);
  torso.position.y = 1.18;
  group.add(torso);
  const jacket = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.2, 0.38), limbMaterial(o.jacket !== undefined ? o.jacket : shirt));
  jacket.position.y = 1.44;
  group.add(jacket);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 10), skinMat);
  head.position.y = 1.78;
  group.add(head);
  const hairTop = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 8), hairMat);
  hairTop.scale.set(1, 0.6, 1);
  hairTop.position.y = 1.92;
  group.add(hairTop);
  if (o.hat === 'bandana') {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.54), limbMaterial(o.hatColor || 0xd83a3a));
    band.position.y = 1.92;
    group.add(band);
  } else if (o.hat === 'cap') {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 12), limbMaterial(o.hatColor || 0x2f9e44));
    cap.position.y = 1.96;
    group.add(cap);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.24), limbMaterial(o.hatColor || 0x2f9e44));
    brim.position.set(0, 1.93, 0.3);
    group.add(brim);
  } else if (o.hat === 'hijab') {
    const hijab = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), limbMaterial(o.hatColor || 0xd84a7a));
    hijab.scale.set(1, 1.05, 1);
    hijab.position.y = 1.8;
    group.add(hijab);
  }
  const armL = new THREE.Group();
  armL.position.set(-0.38, 1.5, 0);
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.66, 0.18), shirtMat);
  armLMesh.position.y = -0.33;
  armL.add(armLMesh);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), skinMat);
  handL.position.y = -0.68;
  armL.add(handL);
  group.add(armL);
  const armR = new THREE.Group();
  armR.position.set(0.38, 1.5, 0);
  const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.66, 0.18), shirtMat);
  armRMesh.position.y = -0.33;
  armR.add(armRMesh);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), skinMat);
  handR.position.y = -0.68;
  armR.add(handR);
  group.add(armR);
  const legL = new THREE.Group();
  legL.position.set(-0.16, 0.82, 0);
  const legLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.78, 0.22), pantsMat);
  legLMesh.position.y = -0.39;
  legL.add(legLMesh);
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.36), limbMaterial(0x111111));
  shoeL.position.set(0, -0.78, 0.05);
  legL.add(shoeL);
  group.add(legL);
  const legR = new THREE.Group();
  legR.position.set(0.16, 0.82, 0);
  const legRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.78, 0.22), pantsMat);
  legRMesh.position.y = -0.39;
  legR.add(legRMesh);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.36), limbMaterial(0x111111));
  shoeR.position.set(0, -0.78, 0.05);
  legR.add(shoeR);
  group.add(legR);
  if (o.gun) {
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.42), limbMaterial(0x111111));
    gun.position.set(0, -0.72, 0.2);
    armR.add(gun);
  }
  group.scale.setScalar(scale);
  const parts = { armL, armR, legL, legR, head, torso };
  return { group, parts };
}

function randomSidewalkSpot(net) {
  if (!net || !net.segments || net.segments.length === 0) return null;
  const seg = net.segments[Math.floor(Math.random() * net.segments.length)];
  const t = Math.random();
  const x = seg.a.x + (seg.b.x - seg.a.x) * t;
  const z = seg.a.z + (seg.b.z - seg.a.z) * t;
  const dx = seg.b.x - seg.a.x;
  const dz = seg.b.z - seg.a.z;
  const len = Math.hypot(dx, dz) || 1;
  const side = Math.random() < 0.5 ? 1 : -1;
  return {
    x: x - (dz / len) * 8.5 * side,
    z: z + (dx / len) * 8.5 * side,
    heading: Math.atan2(dx, dz) + (side > 0 ? 0 : Math.PI),
    seg,
    t,
    dir: side > 0 ? 1 : -1,
  };
}

export function createPedestrians(state) {
  const net = netOf(state);
  if (!net) {
    state._pedsPending = true;
    return [];
  }
  state._pedsPending = false;
  const scene = state.world.scene;
  const peds = [];
  const avenueSpots = [
    { x: 110, z: 108.5, heading: -Math.PI / 2 },
    { x: 85, z: 91.5, heading: Math.PI / 2 },
    { x: 55, z: 108.5, heading: -Math.PI / 2 },
    { x: 15, z: 91.5, heading: Math.PI / 2 },
    { x: -25, z: 108.5, heading: -Math.PI / 2 },
    { x: -55, z: 91.5, heading: Math.PI / 2 },
  ];
  const total = 26;
  for (let i = 0; i < total; i++) {
    let spot = null;
    let avenue = false;
    if (i < avenueSpots.length) {
      spot = avenueSpots[i];
      avenue = true;
    } else {
      spot = randomSidewalkSpot(net);
      if (!spot) break;
    }
    const hatRoll = Math.random();
    const hat = hatRoll < 0.18 ? 'cap' : hatRoll < 0.3 ? 'hijab' : null;
    const built = buildPersonFigure({ hat, hatColor: SHIRTS[Math.floor(Math.random() * SHIRTS.length)] });
    built.group.position.set(spot.x, 0, spot.z);
    built.group.rotation.y = spot.heading;
    scene.add(built.group);
    peds.push({
      group: built.group,
      parts: built.parts,
      position: built.group.position,
      heading: spot.heading,
      speed: 1.1 + Math.random() * 1.2,
      walkPhase: Math.random() * 6,
      seg: avenue ? null : spot.seg,
      t: avenue ? 0 : spot.t,
      dir: avenue ? (spot.heading === -Math.PI / 2 ? 1 : -1) : spot.dir,
      avenue,
      laneZ: avenue ? spot.z : 0,
    });
  }
  state.pedestrians = peds;
  return peds;
}

export function ensurePedestrians(state) {
  if (state._pedsPending && netOf(state)) {
    return createPedestrians(state);
  }
  return state.pedestrians || [];
}

export function updatePedestrians(state, dt) {
  const peds = state.pedestrians || [];
  const net = netOf(state);
  for (const p of peds) {
    p.walkPhase += dt * 6;
    const swing = Math.sin(p.walkPhase) * 0.55;
    p.parts.legL.rotation.x = swing;
    p.parts.legR.rotation.x = -swing;
    p.parts.armL.rotation.x = -swing * 0.7;
    p.parts.armR.rotation.x = swing * 0.7;
    if (p.avenue) {
      p.group.position.x += (p.dir > 0 ? -1 : 1) * p.speed * dt;
      if (p.group.position.x < -140) p.group.position.x = 140;
      if (p.group.position.x > 140) p.group.position.x = -140;
      p.group.position.z = p.laneZ;
      continue;
    }
    if (!p.seg || !net) continue;
    const seg = p.seg;
    const dx = seg.b.x - seg.a.x;
    const dz = seg.b.z - seg.a.z;
    const len = Math.hypot(dx, dz) || 1;
    p.t += (p.speed * p.dir * dt) / len;
    if (p.t > 1 || p.t < 0) {
      const next = randomSidewalkSpot(net);
      if (next) {
        p.seg = next.seg;
        p.t = next.t;
        p.dir = next.dir;
        p.heading = next.heading;
        p.group.rotation.y = p.heading;
      } else {
        p.t = Math.max(0, Math.min(1, p.t));
      }
      continue;
    }
    const sdx = seg.b.x - seg.a.x;
    const sdz = seg.b.z - seg.a.z;
    const slen = Math.hypot(sdx, sdz) || 1;
    const side = p.dir > 0 ? 1 : -1;
    p.group.position.set(
      seg.a.x + (sdx * p.t) - (sdz / slen) * 8.5 * side,
      0,
      seg.a.z + (sdz * p.t) + (sdx / slen) * 8.5 * side
    );
    p.heading = Math.atan2(sdx * p.dir, sdz * p.dir);
    p.group.rotation.y = p.heading;
  }
}
