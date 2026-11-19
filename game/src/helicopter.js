// helicopter.js — GARUDA-1: helikopter polisi dengan bodi membulat
// terang, kaca kokpit mengkilap, ekor bersirip, rotor utama berputar,
// rotor ekor, lampu navigasi, dan sorot lampu yang terarah ke jalan.
// Revisi 2: bodi lebih terang supaya terbaca di langit senja, langsung
// menempel di atas pemain saat staging, genangan sorot lebih kecil.
// Semua bentuk dibuat prosedural; tidak ada aset luar.

let heliCache = null;

function glowTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildHeliMesh() {
  const heli = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({
    color: 0x9ab0c4, metalness: 0.45, roughness: 0.35, envMapIntensity: 1.4,
  });
  const navyMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a6e, metalness: 0.4, roughness: 0.4, envMapIntensity: 1.1,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x18222e, metalness: 0.9, roughness: 0.06, envMapIntensity: 2.6,
  });

  // bodi utama: ellipsoid membulat terang
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 18), paint);
  body.scale.set(1.05, 0.95, 1.7);
  body.castShadow = true;
  heli.add(body);
  // garis navy di sisi + tulisan GARUDA-1
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.62, 1.62, 0.34, 24, 1, true), navyMat);
  stripe.rotation.x = Math.PI / 2;
  stripe.scale.set(1.02, 1, 0.92);
  stripe.position.y = -0.12;
  heli.add(stripe);
  // kaca kokpit: kubah depan yang mengkilap
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14), glass);
  canopy.scale.set(0.95, 0.72, 0.9);
  canopy.position.set(0, 0.28, -1.35);
  heli.add(canopy);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), paint);
  nose.scale.set(1, 0.7, 1.1);
  nose.position.set(0, -0.75, -1.5);
  heli.add(nose);
  const sensor = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.7 })
  );
  sensor.position.set(0, -1.05, -1.2);
  heli.add(sensor);

  // ekor memanjang dengan sirip tegak dan sirip bawah
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.62, 3.4, 10), paint);
  tail.rotation.x = Math.PI / 2 - 0.12;
  tail.position.set(0, 0.35, 3.1);
  tail.castShadow = true;
  heli.add(tail);
  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.quadraticCurveTo(0.5, 0.7, 0.9, 1.5);
  finShape.lineTo(0.35, 1.5);
  finShape.quadraticCurveTo(0.1, 0.8, -0.15, 0.1);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1 });
  const fin = new THREE.Mesh(finGeo, navyMat);
  fin.position.set(-0.06, 0.5, 4.4);
  heli.add(fin);
  const stabShape = new THREE.Shape();
  stabShape.moveTo(-0.9, 0);
  stabShape.lineTo(0.9, 0);
  stabShape.lineTo(0.55, 0.28);
  stabShape.lineTo(-0.55, 0.28);
  stabShape.closePath();
  const stab = new THREE.Mesh(
    new THREE.ExtrudeGeometry(stabShape, { depth: 0.08, bevelEnabled: false }),
    paint
  );
  stab.rotation.x = -Math.PI / 2;
  stab.position.set(0, 0.62, 3.9);
  heli.add(stab);

  // rotor ekor kecil
  const tailRotor = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.1, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.5 })
    );
    blade.position.y = 0.55;
    const holder = new THREE.Group();
    holder.rotation.z = (i / 3) * Math.PI * 2;
    holder.add(blade);
    tailRotor.add(holder);
  }
  tailRotor.rotation.y = Math.PI / 2;
  tailRotor.position.set(0.42, 0.62, 4.75);
  heli.add(tailRotor);

  // tiang + rotor utama dengan bilah melengkung
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.6 })
  );
  mast.position.y = 1.55;
  heli.add(mast);
  const rotor = new THREE.Group();
  rotor.position.y = 1.95;
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: 0.45, metalness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, -0.14);
    bladeShape.quadraticCurveTo(2.6, -0.2, 4.4, -0.1);
    bladeShape.quadraticCurveTo(4.5, 0, 4.4, 0.1);
    bladeShape.quadraticCurveTo(2.6, 0.2, 0, 0.14);
    bladeShape.closePath();
    const blade = new THREE.Mesh(
      new THREE.ExtrudeGeometry(bladeShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }),
      bladeMat
    );
    blade.rotation.x = -Math.PI / 2;
    blade.rotation.z = 0.04;
    const holder = new THREE.Group();
    holder.rotation.y = (i / 4) * Math.PI * 2;
    holder.add(blade);
    rotor.add(holder);
  }
  const blurDisc = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 40),
    new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
  );
  blurDisc.rotation.x = -Math.PI / 2;
  blurDisc.position.y = 0.02;
  rotor.add(blurDisc);
  heli.add(rotor);

  // skid pendaratan melengkung
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.6 });
  for (const s of [-1, 1]) {
    const skid = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.06, 8, 24, Math.PI * 0.85), skidMat);
    skid.rotation.y = Math.PI / 2;
    skid.rotation.z = Math.PI * 0.08;
    skid.position.set(s * 0.95, -1.35, 0.2);
    skid.scale.set(1, 0.5, 1);
    heli.add(skid);
    for (const zz of [-0.9, 0.9]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), skidMat);
      strut.position.set(s * 0.95, -1.05, zz);
      heli.add(strut);
    }
  }

  // lampu navigasi: merah kiri, hijau kanan, putih ekor
  const navRed = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x881111, emissive: 0xff2222, emissiveIntensity: 2.5 })
  );
  navRed.position.set(-1.7, 0, 0.4);
  heli.add(navRed);
  const navGreen = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0x118811, emissive: 0x22ff66, emissiveIntensity: 2.5 })
  );
  navGreen.position.set(1.7, 0, 0.4);
  heli.add(navGreen);
  const navWhite = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xdddddd, emissive: 0xffffff, emissiveIntensity: 2 })
  );
  navWhite.position.set(0, 0.6, 4.85);
  heli.add(navWhite);
  // lampu sorot bawah (strobe putih) yang berkedip pelan
  const strobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 })
  );
  strobe.position.set(0, -1.15, -0.4);
  heli.add(strobe);

  // sorot lampu: kerucut lembut + lampu sorot nyata + genangan terang
  const spotMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c8, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(5.5, 26, 24, 1, true), spotMat);
  cone.position.set(0, -14.2, -1);
  cone.rotation.x = 0.06;
  heli.add(cone);
  const poolTex = glowTexture('rgba(255,240,190,0.95)');
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(4.0, 28),
    new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, opacity: 0.15, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, -26.5, -3.5);
  heli.add(pool);
  const spot = new THREE.SpotLight(0xffeebb, 280, 60, 0.42, 0.55, 1.2);
  spot.position.set(0, -1.2, -1);
  const spotTarget = new THREE.Object3D();
  spotTarget.position.set(0, -27, -3.5);
  heli.add(spotTarget);
  spot.target = spotTarget;
  heli.add(spot);

  heli.userData.rotor = rotor;
  heli.userData.tailRotor = tailRotor;
  heli.userData.cone = cone;
  heli.userData.pool = pool;
  heli.userData.spot = spot;
  heli.userData.strobe = strobe;
  return heli;
}

function playerPos(state) {
  const p = state.player || state.pemain;
  if (!p) return null;
  const holder = p.car || p.vehicle || p.currentCar || p;
  return holder.position || holder.group?.position || null;
}

export function createHelicopter(state) {
  const world = state.world || state.scene || null;
  const scene = world?.scene || world;
  const mesh = buildHeliMesh();
  mesh.position.set(0, 26, -30);
  if (scene && scene.add) scene.add(mesh);
  const heli = {
    group: mesh,
    mesh,
    position: mesh.position,
    target: new THREE.Vector3(0, 0, 0),
    spotlightTarget: new THREE.Vector3(0, 0, 0),
    mode: 'patrol',
    rotorSpeed: 22,
  };
  heliCache = heli;
  return heli;
}

export function updateHelicopter(state, dt) {
  const heli = state.helicopter || state.heli || heliCache;
  if (!heli || !heli.group) return;
  const step = Math.min(dt, 0.05);
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  const pp = playerPos(state);
  const t = performance.now() * 0.001;

  if (heli.group.userData.rotor) heli.group.userData.rotor.rotation.y += heli.rotorSpeed * step;
  if (heli.group.userData.tailRotor) heli.group.userData.tailRotor.rotation.z += heli.rotorSpeed * 3.1 * step;
  if (heli.group.userData.strobe) {
    heli.group.userData.strobe.material.emissiveIntensity = (Math.sin(t * 5) > 0.6) ? 4 : 0.4;
  }

  if (wanted >= 3 && pp) {
    const hoverH = 24 + Math.sin(t * 0.7) * 1.5;
    const tx = pp.x + Math.sin(t * 0.4) * 6;
    const tz = pp.z - 14 + Math.cos(t * 0.33) * 5;
    const far = Math.hypot(tx - heli.group.position.x, tz - heli.group.position.z);
    if (far > 80 || Math.abs(hoverH - heli.group.position.y) > 20) {
      // menempel langsung saat staging / teleport jauh
      heli.group.position.set(tx, hoverH, tz);
    } else {
      heli.group.position.x += (tx - heli.group.position.x) * Math.min(1, step * 0.8);
      heli.group.position.z += (tz - heli.group.position.z) * Math.min(1, step * 0.8);
      heli.group.position.y += (hoverH - heli.group.position.y) * Math.min(1, step * 1.2);
    }
    heli.target.set(pp.x, 0, pp.z);
    heli.spotlightTarget.set(pp.x, 0, pp.z);
    heli.mode = 'pursuit';
    const cone = heli.group.userData.cone;
    const pool = heli.group.userData.pool;
    if (cone) {
      const dx = pp.x - heli.group.position.x;
      const dz = pp.z - heli.group.position.z;
      cone.rotation.z = -dx * 0.012;
      cone.rotation.x = 0.06 + dz * 0.006;
      cone.material.opacity = 0.12 + Math.sin(t * 2.2) * 0.03;
    }
    if (pool) {
      pool.position.x = pp.x - heli.group.position.x;
      pool.position.z = pp.z - heli.group.position.z;
      pool.position.y = -heli.group.position.y + 0.15;
      pool.material.opacity = 0.15;
    }
    heli.group.rotation.y = Math.atan2(pp.x - heli.group.position.x, pp.z - heli.group.position.z) + Math.PI;
  } else {
    heli.group.position.x += Math.sin(t * 0.11) * step * 4;
    heli.group.position.z += Math.cos(t * 0.09) * step * 4;
    heli.group.position.y += (30 - heli.group.position.y) * Math.min(1, step * 0.5);
    heli.mode = 'patrol';
    if (heli.group.userData.cone) heli.group.userData.cone.material.opacity = 0.05;
    if (heli.group.userData.pool) heli.group.userData.pool.material.opacity = 0.12;
  }
  heli.group.rotation.z = Math.sin(t * 0.9) * 0.03;
  heli.group.rotation.x = Math.cos(t * 0.7) * 0.02;
}

// Memastikan helikopter ada (dipakai staging/shot).
export function ensureHelicopter(state) {
  const existing = state.helicopter || state.heli || heliCache;
  if (existing && existing.group) return existing;
  const made = createHelicopter(state);
  state.helicopter = made;
  return made;
}
