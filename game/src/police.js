// Polisi Teluk Cerah: mobil patroli putih bergaris biru dengan palang
// lampu merah-biru yang berkedip dan memantul di aspal basah, petugas
// jalan kaki berfigur manusia, roadblock, dan level wanted 0–5 dengan
// unit bernama.
// Revisi ronde 6 (putaran 3): slot formasi dipersempit — lateral
// 4,2 meter dan sedikit lebih ke depan (5/3) — supaya kedua mobil
// pengapit masuk penuh di dalam frame kamera rendah-dekat, bukan
// terpotong tepi. Formasi tetap menyamakan laju hero dulu sebelum
// mengoreksi posisi ke slotnya. Semua bentuk prosedural.

let policeCache = null;
let blinkPhase = 0;

const UNIT_NAMES = [
  { name: 'CENDRAWASIH-07', kind: 'car' },
  { name: 'JALAK-42', kind: 'car' },
  { name: 'BANGAU-18', kind: 'car' },
  { name: 'GARUDA-1', kind: 'heli' },
  { name: 'MERAK-23', kind: 'car' },
  { name: 'ELANG-09', kind: 'car' },
  { name: 'KUNTUL-31', kind: 'foot' },
  { name: 'BEO-55', kind: 'foot' },
  { name: 'NURI-12', kind: 'foot' },
];

function radialTex(color) {
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

function rimFace() {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.arc(48, 48, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2e35';
  ctx.beginPath();
  ctx.arc(48, 48, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a909a';
  ctx.lineWidth = 9;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(48 + Math.cos(a) * 20, 48 + Math.sin(a) * 20);
    ctx.lineTo(48 + Math.cos(a) * 43, 48 + Math.sin(a) * 43);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Mobil polisi: bodi putih membulat, garis biru, kaca mengkilap,
// palang lampu merah-biru menyala. Depan menghadap -Z saat rotasi 0.
function buildPatrolCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({
    color: 0xf2f4f6, metalness: 0.55, roughness: 0.28, envMapIntensity: 1.6,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x141a22, metalness: 0.9, roughness: 0.08, envMapIntensity: 2.4,
  });
  const profile = new THREE.Shape();
  profile.moveTo(-2.3, 0.32);
  profile.quadraticCurveTo(-2.3, 0.6, -1.85, 0.64);
  profile.quadraticCurveTo(-1.0, 0.7, -0.5, 0.76);
  profile.quadraticCurveTo(-0.1, 1.06, 0.4, 1.06);
  profile.quadraticCurveTo(0.95, 1.04, 1.3, 0.78);
  profile.quadraticCurveTo(1.95, 0.7, 2.3, 0.62);
  profile.quadraticCurveTo(2.42, 0.48, 2.32, 0.32);
  profile.quadraticCurveTo(1.1, 0.18, 0, 0.2);
  profile.quadraticCurveTo(-1.2, 0.18, -2.3, 0.32);
  const bodyGeo = new THREE.ExtrudeGeometry(profile, {
    depth: 1.45, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.22, bevelSegments: 3, steps: 1,
  });
  bodyGeo.translate(0, 0, -0.725);
  bodyGeo.rotateY(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, paint);
  body.castShadow = true;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), glass);
  cabin.scale.set(0.82, 0.52, 1.35);
  cabin.position.set(0, 0.95, 0.15);
  car.add(cabin);
  // Garis biru di sisi mengikuti lekuk bodi.
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1c4fd6, roughness: 0.4, metalness: 0.3 });
  for (const s of [-1, 1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 3.4), stripeMat);
    stripe.position.set(s * 0.99, 0.55, 0.05);
    car.add(stripe);
    const thin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 3.4), stripeMat);
    thin.position.set(s * 0.99, 0.85, 0.05);
    car.add(thin);
  }
  // Palang lampu: alas + dua kubah menyala + pijar.
  const barBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 1.15, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.6 })
  );
  barBase.rotation.z = Math.PI / 2;
  barBase.scale.set(1, 1, 0.55);
  barBase.position.set(0, 1.18, 0.15);
  car.add(barBase);
  const redMat = new THREE.MeshStandardMaterial({ color: 0x881111, emissive: 0xff1a22, emissiveIntensity: 3 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x111188, emissive: 0x2244ff, emissiveIntensity: 3 });
  const redDome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), redMat);
  redDome.scale.set(1.6, 0.85, 0.9);
  redDome.position.set(-0.3, 1.3, 0.15);
  car.add(redDome);
  const blueDome = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), blueMat);
  blueDome.scale.set(1.6, 0.85, 0.9);
  blueDome.position.set(0.3, 1.3, 0.15);
  car.add(blueDome);
  const redGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTex('rgba(255,40,50,0.95)'), transparent: true, opacity: 0.9, depthWrite: false,
  }));
  redGlow.scale.set(2.2, 2.2, 1);
  redGlow.position.set(-0.3, 1.35, 0.15);
  car.add(redGlow);
  const blueGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTex('rgba(60,110,255,0.95)'), transparent: true, opacity: 0.9, depthWrite: false,
  }));
  blueGlow.scale.set(2.2, 2.2, 1);
  blueGlow.position.set(0.3, 1.35, 0.15);
  car.add(blueGlow);
  // Pijar di aspal basah di bawah palang lampu.
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(2.4, 20),
    new THREE.MeshBasicMaterial({ map: radialTex('rgba(120,90,255,0.8)'), transparent: true, opacity: 0.4, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.06, 0.15);
  car.add(pool);
  const headMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffe9a0, emissiveIntensity: 2 });
  for (const s of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), headMat);
    head.scale.set(1.4, 0.7, 0.7);
    head.position.set(s * 0.6, 0.6, -2.3);
    car.add(head);
  }
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x8a0f14, emissive: 0xff1a22, emissiveIntensity: 1.6 });
  const tailBar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.3, 8), tailMat);
  tailBar.rotation.z = Math.PI / 2;
  tailBar.position.set(0, 0.62, 2.3);
  car.add(tailBar);
  const rimTex = rimFace();
  const wheels = [];
  for (const wp of [[-1.0, -1.5], [1.0, -1.5], [-1.0, 1.5], [1.0, 1.5]]) {
    const wheel = new THREE.Group();
    const tire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.3, 18),
      new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 })
    );
    tire.rotation.z = Math.PI / 2;
    wheel.add(tire);
    const rimMat = new THREE.MeshStandardMaterial({ map: rimTex, metalness: 0.7, roughness: 0.3 });
    for (const s of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CircleGeometry(0.23, 16), rimMat);
      cap.position.x = s * 0.16;
      cap.rotation.y = s * Math.PI / 2;
      wheel.add(cap);
    }
    wheel.position.set(wp[0], 0.42, wp[1]);
    car.add(wheel);
    wheels.push(wheel);
  }
  car.userData.wheels = wheels;
  car.userData.redGlow = redGlow;
  car.userData.blueGlow = blueGlow;
  car.userData.redDome = redDome;
  car.userData.blueDome = blueDome;
  car.userData.pool = pool;
  return car;
}

// Petugas jalan kaki: seragam biru gelap, topi, lencana.
function buildOfficer() {
  const fig = new THREE.Group();
  const navy = new THREE.MeshStandardMaterial({ color: 0x1e3a6e, roughness: 0.85 });
  const darkPants = new THREE.MeshStandardMaterial({ color: 0x1a2432, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a06f, roughness: 0.65 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.56, 12), navy);
  torso.position.y = 1.19;
  torso.castShadow = true;
  fig.add(torso);
  const badge = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 12),
    new THREE.MeshStandardMaterial({ color: 0xffd23e, metalness: 0.9, roughness: 0.25 })
  );
  badge.position.set(-0.09, 1.32, -0.2);
  badge.rotation.y = Math.PI;
  fig.add(badge);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 }));
  belt.position.y = 0.94;
  fig.add(belt);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skin);
  neck.position.y = 1.53;
  fig.add(neck);
  const head = new THREE.Group();
  head.position.y = 1.68;
  fig.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), skin);
  skull.scale.set(0.92, 1.05, 0.96);
  head.add(skull);
  const capMat = new THREE.MeshStandardMaterial({ color: 0x14264a, roughness: 0.8 });
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.175, 0.09, 14), capMat);
  capTop.position.y = 0.1;
  head.add(capTop);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 14), capMat);
  brim.scale.set(1, 1, 1.25);
  brim.position.set(0, 0.06, -0.1);
  head.add(brim);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.4 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), eyeMat);
    eye.position.set(s * 0.058, 0.02, -0.145);
    head.add(eye);
  }
  const pivots = { head, torso };
  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.26, 1.44, 0);
    fig.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8), navy);
    upper.position.y = -0.15;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.28, 8), skin);
    fore.position.y = -0.14;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), skin);
    hand.position.y = -0.31;
    elbow.add(hand);
    return { shoulder, elbow, hand };
  }
  pivots.armL = arm(-1);
  pivots.armR = arm(1);
  function leg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, 0.92, 0);
    fig.add(hip);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.42, 8), darkPants);
    thigh.position.y = -0.21;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.4, 8), darkPants);
    shin.position.y = -0.2;
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }));
    shoe.scale.set(1, 0.55, 1.7);
    shoe.position.set(0, -0.42, -0.04);
    knee.add(shoe);
    return { hip, knee, shoe };
  }
  pivots.legL = leg(-1);
  pivots.legR = leg(1);
  fig.userData.pivots = pivots;
  return { group: fig, pivots };
}

function holderPos(state) {
  const p = state.player || state.pemain;
  if (!p) return null;
  const holder = p.car || p.vehicle || p.currentCar || p;
  return holder.position || holder.group?.position || null;
}

function holderHeading(state) {
  const p = state.player || state.pemain;
  if (!p) return 0;
  const holder = p.car || p.vehicle || p.currentCar || p;
  return holder.heading ?? holder.angle ?? 0;
}

// Slot formasi: sejajar hidung hero, satu di kiri dan satu di kanan.
// long diukur ke depan dari pusat pemain, lat ke kanan pemain.
// Putaran 3: lateral 4,2 meter (dari 5,2) dan long 5/3 (dari 4/2)
// supaya kedua mobil masuk penuh di dalam frame kamera rendah-dekat.
function formationSlot(pp, heading, idx) {
  const fx = -Math.sin(heading);
  const fz = -Math.cos(heading);
  const rx = -fz;
  const rz = fx;
  const long = idx === 0 ? 5 : 3;
  const lat = idx === 0 ? -4.2 : 4.2;
  return { x: pp.x + fx * long + rx * lat, z: pp.z + fz * long + rz * lat };
}

function resolveUnits(state) {
  const stored = state.police;
  if (Array.isArray(stored) && stored.length) return stored;
  if (stored && Array.isArray(stored.units) && stored.units.length) return stored.units;
  if (policeCache && policeCache.units) return policeCache.units;
  return [];
}

export function createPolice(state) {
  const world = state.world || state.scene || null;
  const scene = world?.scene || world;
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  const units = [];
  const pp = holderPos(state) || { x: 28, z: 46 };
  const carCount = Math.min(3 + wanted, 6);
  for (let i = 0; i < carCount; i++) {
    const def = UNIT_NAMES[i % UNIT_NAMES.length];
    const mesh = buildPatrolCar();
    const ang = (i / carCount) * Math.PI * 2;
    const dist = 10 + i * 5;
    mesh.position.set(pp.x + Math.sin(ang) * dist, 0, pp.z + Math.cos(ang) * dist);
    mesh.rotation.y = ang;
    if (scene && scene.add) scene.add(mesh);
    units.push({
      name: def.name,
      type: 'car',
      kind: 'car',
      status: 'pursuit',
      distance: Math.round(dist),
      group: mesh,
      mesh,
      position: mesh.position,
      heading: ang,
      speed: 0,
      phase: Math.random() * 6.28,
    });
  }
  const footCount = wanted >= 2 ? 2 : 0;
  for (let i = 0; i < footCount; i++) {
    const def = UNIT_NAMES[6 + i];
    const built = buildOfficer();
    const ang = Math.random() * Math.PI * 2;
    built.group.position.set(pp.x + Math.sin(ang) * 8, 0, pp.z + Math.cos(ang) * 8);
    if (scene && scene.add) scene.add(built.group);
    units.push({
      name: def.name,
      type: 'foot',
      kind: 'foot',
      status: 'pursuit',
      distance: 8,
      group: built.group,
      mesh: built.group,
      position: built.group.position,
      heading: ang,
      speed: 0,
      phase: Math.random() * 6.28,
      pivots: built.pivots,
    });
  }
  const police = {
    units,
    list: units,
    wanted,
    level: wanted,
    blinkPhase: 0,
  };
  policeCache = police;
  return police;
}

export function setWanted(state, level) {
  const clamped = Math.max(0, Math.min(5, Math.round(level)));
  state.wanted = clamped;
  if (policeCache) {
    policeCache.wanted = clamped;
    policeCache.level = clamped;
  }
  return clamped;
}

export function addHeat(state, amount) {
  const cur = typeof state.wanted === 'number' ? state.wanted : 0;
  return setWanted(state, cur + (amount || 1));
}

export function updatePolice(state, dt) {
  const units = resolveUnits(state);
  if (!units.length) return;
  const step = Math.min(dt, 0.05);
  const pp = holderPos(state);
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  if (policeCache) {
    policeCache.wanted = wanted;
    policeCache.level = wanted;
  }
  const t = performance.now() * 0.001;
  blinkPhase += step * 6;
  if (policeCache) policeCache.blinkPhase = blinkPhase;
  const blinkOn = Math.sin(blinkPhase) > 0;
  const pHeading = holderHeading(state);
  const pfx = -Math.sin(pHeading);
  const pfz = -Math.cos(pHeading);
  const player = state.player || state.pemain || null;
  const inCar = !!(player && (player.car || player.vehicle || player.currentCar));
  const pace = Math.abs((player && player.speed) || 0);
  // Formasi kejar-kejaran: hanya saat pemain ngebut di mobil dengan
  // wanted tinggi. Dua mobil pertama menahan posisi mengapit hero;
  // unit yang masih jauh langsung ditempatkan ke slotnya.
  const forming = wanted >= 3 && pp && inCar && pace > 12;
  const carUnits = units.filter((u) => (u.type === 'car' || u.kind === 'car') && u.group);
  if (forming) {
    carUnits.forEach((u, idx) => {
      if (idx >= 2) return;
      if (u.status === 'roadblock') return;
      const slot = formationSlot(pp, pHeading, idx);
      const d = Math.hypot(u.position.x - pp.x, u.position.z - pp.z);
      if (d > 45) {
        u.position.set(slot.x, 0, slot.z);
        u.heading = pHeading;
        u.group.rotation.y = pHeading;
      }
      u.status = 'pursuit';
      u.distance = Math.round(Math.hypot(slot.x - pp.x, slot.z - pp.z));
    });
    if (wanted >= 4 && carUnits.length >= 4) {
      const rb = carUnits[3];
      const d = Math.hypot(rb.position.x - pp.x, rb.position.z - pp.z);
      if (d < 20 || d > 90) {
        rb.position.set(pp.x + pfx * 34, 0, pp.z + pfz * 34);
        rb.heading = pHeading + Math.PI / 2;
        rb.group.rotation.y = rb.heading;
        rb.status = 'roadblock';
      }
    }
  }

  for (let idx = 0; idx < units.length; idx++) {
    const unit = units[idx];
    if (!unit.group) continue;
    const ud = unit.group.userData;
    if (ud.redGlow) ud.redGlow.material.opacity = blinkOn ? 0.95 : 0.15;
    if (ud.blueGlow) ud.blueGlow.material.opacity = blinkOn ? 0.15 : 0.95;
    if (ud.redDome) ud.redDome.material.emissiveIntensity = blinkOn ? 3.2 : 0.4;
    if (ud.blueDome) ud.blueDome.material.emissiveIntensity = blinkOn ? 0.4 : 3.2;
    if (ud.pool) {
      ud.pool.material.opacity = 0.3 + Math.sin(blinkPhase) * 0.12;
      ud.pool.material.color.setHex(blinkOn ? 0xff3344 : 0x3355ff);
    }
    if (!pp) continue;
    const dx = pp.x - unit.position.x;
    const dz = pp.z - unit.position.z;
    const dist = Math.hypot(dx, dz) || 1;
    unit.distance = Math.round(dist);
    if (wanted <= 0) {
      unit.status = 'patrol';
      continue;
    }
    if (unit.type === 'car' || unit.kind === 'car') {
      if (unit.status === 'roadblock') {
        unit.speed = 0;
        continue;
      }
      // Dua unit formasi: samakan dulu lajunya dengan hero (supaya
      // tidak tertinggal ke arah kamera), baru koreksi pelan ke slot.
      const carIdx = carUnits.indexOf(unit);
      if (forming && carIdx >= 0 && carIdx < 2) {
        const slot = formationSlot(pp, pHeading, carIdx);
        unit.position.x += pfx * pace * step;
        unit.position.z += pfz * pace * step;
        const ease = Math.min(1, step * 5);
        unit.position.x += (slot.x - unit.position.x) * ease;
        unit.position.z += (slot.z - unit.position.z) * ease;
        unit.heading = pHeading;
        unit.group.rotation.y = pHeading;
        unit.speed = pace;
        unit.status = 'pursuit';
        if (unit.group.userData.wheels) {
          const spin = (pace * step) / 0.38;
          for (const w of unit.group.userData.wheels) w.rotation.x += spin;
        }
        continue;
      }
      const chaseSpeed = Math.min(30, 13 + wanted * 3.2);
      const targetHeading = Math.atan2(-dx / dist, -dz / dist);
      let diff = targetHeading - unit.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      unit.heading += diff * Math.min(1, step * 2.2);
      const speed = dist > 7 ? chaseSpeed : chaseSpeed * 0.25;
      unit.speed = speed;
      unit.position.x += -Math.sin(unit.heading) * speed * step;
      unit.position.z += -Math.cos(unit.heading) * speed * step;
      unit.group.rotation.y = unit.heading;
      unit.status = dist < 12 ? 'ramming' : 'pursuit';
      if (unit.group.userData.wheels) {
        const spin = (speed * step) / 0.38;
        for (const w of unit.group.userData.wheels) w.rotation.x += spin;
      }
    } else {
      const runSpeed = 5.2;
      const targetHeading = Math.atan2(-dx / dist, -dz / dist);
      unit.heading = targetHeading;
      if (dist > 1.6) {
        unit.position.x += -Math.sin(unit.heading) * runSpeed * step;
        unit.position.z += -Math.cos(unit.heading) * runSpeed * step;
      }
      unit.group.rotation.y = unit.heading;
      unit.status = dist <= 1.6 ? 'arrest' : 'pursuit';
      const pv = unit.pivots;
      if (pv) {
        unit.phase = (unit.phase || 0) + runSpeed * step * 2.2;
        const ph = unit.phase;
        pv.legL.hip.rotation.x = Math.sin(ph) * 0.8;
        pv.legR.hip.rotation.x = -Math.sin(ph) * 0.8;
        pv.legL.knee.rotation.x = Math.max(0, -Math.sin(ph - 0.6)) * 0.9;
        pv.legR.knee.rotation.x = Math.max(0, Math.sin(ph - 0.6)) * 0.9;
        pv.armL.shoulder.rotation.x = -Math.sin(ph) * 0.6;
        pv.armR.shoulder.rotation.x = Math.sin(ph) * 0.6;
      }
    }
  }
  state.siren = wanted > 0;
}

// Memastikan unit polisi ada (dipakai staging/shot).
export function ensurePolice(state) {
  const existing = state.police && state.police.units ? state.police : policeCache;
  if (existing && existing.units && existing.units.length) return existing;
  const made = createPolice(state);
  return made;
}
