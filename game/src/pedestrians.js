// Teluk Cerah — people with full anatomy: shaped heads with hair, layered
// clothing on the torso, elbows on the arms, knees on the legs, a readable
// stride and a soft contact shadow under every figure.

const SKIN = [0xc98d64, 0xa06844, 0x8a5636, 0xe0aa7c, 0x6e4526];
const SHIRTS = [0xd8542e, 0x2e7ab8, 0xe8b13c, 0x3fa76a, 0xd8d3c8, 0x8a4a9e, 0xe2703a, 0x3fa7a0];
const PANTS = [0x2c3440, 0x4a3a28, 0x5a6270, 0x24303c, 0x6e2430, 0x37474f];
const HAIR = [0x14100c, 0x2c1c10, 0x4a2f18, 0x0c0c0e, 0x6e4526];

function capsule(r, len, color, rough = 0.85) {
  const m = new THREE.Mesh(
    new THREE.CapsuleGeometry(r, len, 3, 10),
    new THREE.MeshStandardMaterial({ color, roughness: rough })
  );
  m.castShadow = true;
  return m;
}

export function buildPerson(rng, opts = {}) {
  const g = new THREE.Group();
  const skin = opts.skin ?? rng.pick(SKIN);
  const shirt = opts.shirt ?? rng.pick(SHIRTS);
  const pants = opts.pants ?? rng.pick(PANTS);
  const hair = opts.hair ?? rng.pick(HAIR);

  const hips = new THREE.Group(); hips.position.y = 0.98; g.add(hips);
  const pelvis = capsule(0.16, 0.10, pants); pelvis.rotation.z = Math.PI / 2; pelvis.scale.set(1, 0.8, 0.8);
  hips.add(pelvis);
  const torso = capsule(0.168, 0.36, shirt); torso.position.y = 0.36; torso.scale.set(1.10, 1, 0.74);
  hips.add(torso);
  if (opts.jacket !== undefined) { // open jacket layer over the shirt
    const j = capsule(0.182, 0.34, opts.jacket); j.position.y = 0.36; j.scale.set(1.14, 1, 0.82);
    hips.add(j);
  }
  const neck = capsule(0.05, 0.05, skin); neck.position.y = 0.66; hips.add(neck);
  const headG = new THREE.Group(); headG.position.y = 0.78; hips.add(headG);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 14),
    new THREE.MeshStandardMaterial({ color: skin, roughness: 0.65 }));
  head.scale.set(0.92, 1.08, 0.98); head.castShadow = true;
  headG.add(head);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    new THREE.MeshStandardMaterial({ color: hair, roughness: 0.95 }));
  hairCap.position.y = 0.018; hairCap.scale.set(0.95, 1.05, 1.0);
  headG.add(hairCap);
  if (opts.cap) {
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.122, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.42),
      new THREE.MeshStandardMaterial({ color: opts.cap, roughness: 0.8 }));
    capTop.position.y = 0.03; headG.add(capTop);
    const brim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.12),
      new THREE.MeshStandardMaterial({ color: opts.cap, roughness: 0.8 }));
    brim.position.set(0, 0.055, 0.13); headG.add(brim);
  }

  function limb(x, y, r, upperLen, lowerLen, upperColor, lowerColor) {
    const pivot = new THREE.Group(); pivot.position.set(x, y, 0);
    const upper = capsule(r, upperLen, upperColor); upper.position.y = -upperLen / 2 - r * 0.4;
    pivot.add(upper);
    const joint = new THREE.Group(); joint.position.y = -upperLen - r * 0.6;
    const lower = capsule(r * 0.88, lowerLen, lowerColor); lower.position.y = -lowerLen / 2 - r * 0.3;
    joint.add(lower);
    pivot.add(joint);
    return { pivot, joint };
  }
  const armL = limb(-0.26, 0.55, 0.05, 0.26, 0.24, shirt, skin);
  const armR = limb(0.26, 0.55, 0.05, 0.26, 0.24, shirt, skin);
  hips.add(armL.pivot, armR.pivot);
  const legL = limb(-0.10, 0.02, 0.065, 0.34, 0.34, pants, pants);
  const legR = limb(0.10, 0.02, 0.065, 0.34, 0.34, pants, pants);
  g.add(legL.pivot, legR.pivot);
  legL.pivot.position.y = 0.98; legR.pivot.position.y = 0.98;
  for (const leg of [legL, legR]) { // shoe
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.05, 0.20),
      new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.7 }));
    shoe.position.set(0, -0.78, 0.045);
    leg.joint.add(shoe);
  }
  // soft contact shadow
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.30, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02;
  g.add(shadow);

  const person = {
    group: g, hips, headG, armL, armR, legL, legR,
    phase: rng.range(0, Math.PI * 2),
    setPose(walkPhase, aimPose = 0) {
      const s = Math.sin(walkPhase), c = Math.cos(walkPhase);
      legL.pivot.rotation.x = s * 0.62; legR.pivot.rotation.x = -s * 0.62;
      legL.joint.rotation.x = Math.max(0, -c) * 0.85 + 0.06;
      legR.joint.rotation.x = Math.max(0, c) * 0.85 + 0.06;
      if (aimPose > 0) { // both arms raised toward a target, combat stance
        armR.pivot.rotation.x = -1.45 * aimPose; armR.joint.rotation.x = -0.12;
        armL.pivot.rotation.x = -1.32 * aimPose; armL.joint.rotation.x = -0.3;
        armL.pivot.rotation.z = 0.25;
      } else {
        armL.pivot.rotation.x = -s * 0.5; armR.pivot.rotation.x = s * 0.5;
        armL.joint.rotation.x = -0.25 - Math.max(0, s) * 0.3;
        armR.joint.rotation.x = -0.25 - Math.max(0, -s) * 0.3;
        armL.pivot.rotation.z = 0.08; armR.pivot.rotation.z = -0.08;
      }
      hips.position.y = 0.98 + Math.abs(Math.cos(walkPhase)) * 0.035;
      hips.rotation.z = s * 0.03;
    },
  };
  return person;
}

export function buildHeroFigure(rng) {
  return buildPerson(rng, {
    skin: 0xa06844, shirt: 0xf0ead8, jacket: 0xb8352a, pants: 0x24303c, hair: 0x14100c,
  });
}

// A crowd that walks rectangular loops around blocks on the sidewalks,
// crossing streets at corners, so the city never feels staged or empty.
export function createCrowd(THREEref, scene, rng, city) {
  const walkers = [];
  const loops = [];
  for (let i = 0; i < city.streetsX.length - 1; i++) {
    for (let j = 0; j < city.avenuesZ.length - 1; j++) {
      const x0 = city.streetsX[i] + city.roadW / 2 + 2.2, x1 = city.streetsX[i + 1] - city.roadW / 2 - 2.2;
      const z0 = city.avenuesZ[j] + city.roadW / 2 + 2.2, z1 = city.avenuesZ[j + 1] - city.roadW / 2 - 2.2;
      loops.push([[x0, z0], [x1, z0], [x1, z1], [x0, z1]]);
    }
  }
  const COUNT = 30;
  for (let i = 0; i < COUNT; i++) {
    const person = buildPerson(rng, {});
    const loop = loops[i % loops.length];
    const seg = rng.int(0, 3);
    const w = {
      person, loop, seg, u: rng.next(), speed: rng.range(1.0, 1.7),
      x: 0, z: 0, heading: 0, phase: rng.range(0, 6),
    };
    walkers.push(w);
    scene.add(person.group);
  }
  function segLen(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function update(dt) {
    for (const w of walkers) {
      const a = w.loop[w.seg], b = w.loop[(w.seg + 1) % 4];
      const len = segLen(a, b);
      w.u += (w.speed * dt) / len;
      if (w.u >= 1) { w.u = 0; w.seg = (w.seg + 1) % 4; }
      const na = w.loop[w.seg], nb = w.loop[(w.seg + 1) % 4];
      w.x = na[0] + (nb[0] - na[0]) * w.u;
      w.z = na[1] + (nb[1] - na[1]) * w.u;
      w.heading = Math.atan2(nb[0] - na[0], nb[1] - na[1]);
      w.phase += dt * w.speed * 4.4;
      w.person.group.position.set(w.x, 0, w.z);
      w.person.group.rotation.y = w.heading;
      w.person.setPose(w.phase, 0);
    }
  }
  return { walkers, update };
}
