// vehicles.js — kendaraan Teluk Cerah: mobil sport, sedan, taksi, truk,
// dan van dengan bodi membulat, kaca mengkilap, lampu menyala, dan roda
// berpelek. Lalu lintas mengikuti jaringan jalan dan selalu ramai di
// sekitar kamera.
// Revisi 2: tiap mobil membawa kondisi (untuk HUD), cat lebih glossy,
// diffuser belakang, dan tidak ada mesh tersembunyi.
// Semua bentuk dibuat prosedural; tidak ada aset luar.

let trafficCache = [];

function rimTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8ccd4';
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2e35';
  ctx.beginPath();
  ctx.arc(64, 64, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8a909a';
  ctx.lineWidth = 12;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 28, 64 + Math.sin(a) * 28);
    ctx.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8ecf2';
  ctx.beginPath();
  ctx.arc(64, 64, 10, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function plateTexture(text) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2f2ea';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 4;
  ctx.strokeRect(3, 3, 250, 58);
  ctx.fillStyle = '#16233a';
  ctx.font = 'bold 38px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// profil samping mobil: kap melengkung, atap membulat, bagasi landai.
function sideProfile(kind) {
  const s = new THREE.Shape();
  if (kind === 'sport') {
    s.moveTo(-2.35, 0.32);
    s.quadraticCurveTo(-2.35, 0.62, -1.9, 0.66);
    s.quadraticCurveTo(-1.15, 0.72, -0.55, 0.78);
    s.quadraticCurveTo(-0.15, 1.08, 0.35, 1.1);
    s.quadraticCurveTo(0.95, 1.08, 1.35, 0.82);
    s.quadraticCurveTo(1.95, 0.74, 2.3, 0.66);
    s.quadraticCurveTo(2.42, 0.5, 2.35, 0.32);
    s.quadraticCurveTo(1.2, 0.18, 0, 0.2);
    s.quadraticCurveTo(-1.2, 0.18, -2.35, 0.32);
  } else if (kind === 'truck') {
    s.moveTo(-2.6, 0.3);
    s.lineTo(-2.6, 1.5);
    s.quadraticCurveTo(-2.6, 1.75, -2.3, 1.75);
    s.lineTo(-0.7, 1.75);
    s.lineTo(-0.7, 0.9);
    s.lineTo(2.6, 0.9);
    s.lineTo(2.6, 0.3);
    s.quadraticCurveTo(0, 0.18, -2.6, 0.3);
  } else if (kind === 'van') {
    s.moveTo(-2.4, 0.3);
    s.quadraticCurveTo(-2.4, 1.5, -1.9, 1.62);
    s.quadraticCurveTo(-0.6, 1.78, 0.8, 1.72);
    s.quadraticCurveTo(2.2, 1.66, 2.4, 1.1);
    s.quadraticCurveTo(2.45, 0.5, 2.3, 0.3);
    s.quadraticCurveTo(0, 0.18, -2.4, 0.3);
  } else {
    s.moveTo(-2.3, 0.32);
    s.quadraticCurveTo(-2.3, 0.6, -1.85, 0.64);
    s.quadraticCurveTo(-1.0, 0.7, -0.5, 0.76);
    s.quadraticCurveTo(-0.1, 1.06, 0.4, 1.06);
    s.quadraticCurveTo(0.95, 1.04, 1.3, 0.78);
    s.quadraticCurveTo(1.95, 0.7, 2.3, 0.62);
    s.quadraticCurveTo(2.42, 0.48, 2.32, 0.32);
    s.quadraticCurveTo(1.1, 0.18, 0, 0.2);
    s.quadraticCurveTo(-1.2, 0.18, -2.3, 0.32);
  }
  return s;
}

function paintMaterial(color, rough = 0.22) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.68,
    roughness: rough,
    envMapIntensity: 1.9,
  });
}

function glassMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x141a22,
    metalness: 0.9,
    roughness: 0.07,
    envMapIntensity: 2.6,
  });
}

function glowSprite(color, scale) {
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
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, opacity: 0.85, depthWrite: false,
  }));
  sp.scale.set(scale, scale, 1);
  return sp;
}

function makeWheel(rimTex, radius, width) {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 20),
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 })
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  wheel.add(tire);
  const rimMat = new THREE.MeshStandardMaterial({ map: rimTex, metalness: 0.7, roughness: 0.3 });
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.62, 20), rimMat);
    cap.position.x = side * (width / 2 + 0.01);
    cap.rotation.y = side * Math.PI / 2;
    wheel.add(cap);
  }
  return wheel;
}

// Membangun satu mobil lengkap. Depan mobil menghadap -Z saat rotasi 0.
export function buildCarMesh(kind, colorHex, opts = {}) {
  const car = new THREE.Group();
  const paint = paintMaterial(colorHex, kind === 'truck' ? 0.5 : 0.22);
  const glass = glassMaterial();
  const width = kind === 'truck' ? 2.3 : kind === 'van' ? 2.05 : 1.95;
  const profile = sideProfile(kind);
  const bodyGeo = new THREE.ExtrudeGeometry(profile, {
    depth: width - 0.5,
    bevelEnabled: true,
    bevelThickness: 0.22,
    bevelSize: 0.22,
    bevelSegments: 3,
    steps: 1,
  });
  bodyGeo.translate(0, 0, -(width - 0.5) / 2);
  bodyGeo.rotateY(-Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, paint);
  body.castShadow = true;
  body.receiveShadow = true;
  car.add(body);

  // kaca kabin: kubah gelap mengkilap yang mengikuti lekuk atap
  if (kind !== 'truck') {
    const cabin = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), glass);
    const cl = kind === 'sport' ? 1.55 : 1.35;
    cabin.scale.set(0.82, 0.52, cl);
    cabin.position.set(0, kind === 'sport' ? 0.92 : 0.95, 0.15);
    car.add(cabin);
    const shield = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), glass);
    shield.scale.set(0.8, 0.3, 0.5);
    shield.position.set(0, 0.98, -1.05);
    car.add(shield);
  } else {
    const cabGlass = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.7, 0.1),
      glass
    );
    cabGlass.position.set(0, 1.35, -1.72);
    cabGlass.rotation.x = -0.12;
    car.add(cabGlass);
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.5, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x5a5148, roughness: 0.8, metalness: 0.3 })
    );
    bed.position.set(0, 1.05, 1.2);
    car.add(bed);
  }

  // lampu belakang: pita merah menyala memanjang
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0x8a0f14, emissive: 0xff1a22, emissiveIntensity: 1.8, roughness: 0.3,
  });
  const tailBar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, width * 0.72, 10), tailMat);
  tailBar.rotation.z = Math.PI / 2;
  tailBar.position.set(0, 0.62, kind === 'sport' ? 2.32 : 2.28);
  car.add(tailBar);
  for (const s of [-1, 1]) {
    const glow = glowSprite('rgba(255,40,50,0.9)', 1.1);
    glow.position.set(s * width * 0.32, 0.62, 2.42);
    car.add(glow);
  }
  // diffuser belakang + knalpot
  const diffuser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, width * 0.7, 10),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.6 })
  );
  diffuser.rotation.z = Math.PI / 2;
  diffuser.position.set(0, 0.3, 2.3);
  car.add(diffuser);
  for (const s of [-1, 1]) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.22, 10),
      new THREE.MeshStandardMaterial({ color: 0xb8bec8, metalness: 0.9, roughness: 0.25 })
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(s * 0.55, 0.3, 2.38);
    car.add(pipe);
  }
  // lampu depan hangat
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c0, emissive: 0xffe9a0, emissiveIntensity: 2.2, roughness: 0.2,
  });
  for (const s of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), headMat);
    head.scale.set(1.4, 0.7, 0.7);
    head.position.set(s * 0.62, 0.6, -2.32);
    car.add(head);
    const glow = glowSprite('rgba(255,230,160,0.8)', 1.3);
    glow.position.set(s * 0.62, 0.6, -2.45);
    car.add(glow);
  }

  // spoiler melengkung untuk sport
  if (kind === 'sport') {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-0.55, 0);
    wingShape.quadraticCurveTo(0, 0.16, 0.55, 0);
    wingShape.lineTo(0.45, -0.12);
    wingShape.quadraticCurveTo(0, -0.02, -0.45, -0.12);
    wingShape.closePath();
    const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: width * 0.85, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2,
    });
    wingGeo.translate(0, 0, -(width * 0.85) / 2);
    wingGeo.rotateY(Math.PI / 2);
    const wing = new THREE.Mesh(wingGeo, paint);
    wing.position.set(0, 1.02, 2.28);
    wing.rotation.x = -0.1;
    wing.castShadow = true;
    car.add(wing);
    for (const s of [-1, 1]) {
      const strut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.5, metalness: 0.6 })
      );
      strut.position.set(s * 0.6, 0.88, 2.28);
      car.add(strut);
    }
  }

  // plat nomor
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.18),
    new THREE.MeshStandardMaterial({ map: plateTexture(opts.plate || 'TC 4821'), roughness: 0.4 })
  );
  plate.position.set(0, 0.42, 2.44);
  car.add(plate);

  // roda dengan pelek
  const rimTex = rimTexture();
  const radius = kind === 'truck' ? 0.48 : 0.38;
  const wHalf = width / 2;
  const wheels = [];
  const wheelPos = [
    [-wHalf - 0.02, 0.42, -1.55],
    [wHalf + 0.02, 0.42, -1.55],
    [-wHalf - 0.02, 0.42, 1.55],
    [wHalf + 0.02, 0.42, 1.55],
  ];
  for (const [x, y, z] of wheelPos) {
    const wheel = makeWheel(rimTex, radius, 0.3);
    wheel.position.set(x, y, z);
    car.add(wheel);
    wheels.push(wheel);
  }

  car.userData.wheels = wheels;
  car.userData.kind = kind;
  car.userData.paint = paint;
  car.userData.condition = typeof opts.condition === 'number' ? opts.condition : 100;
  return car;
}

const TRAFFIC_COLORS = {
  sedan: [0x3a6ac2, 0xc23a3a, 0x3a3a44, 0xd8d8d8, 0x2a8a5a],
  taxi: [0xf2c200],
  truck: [0x8a6a3a, 0x5a7a8a, 0x7a5a5a],
  van: [0xd8d8d8, 0x4a6a8a, 0x8a8a7a],
  sport: [0xff4fa3, 0xff2a3a, 0x2a9aff, 0xffd23e],
};

function resolveNetwork(state) {
  const net = state.roads || state.network || state.city || state.world?.roads || state.world?.city || null;
  if (!net) return null;
  const segs = net.segments || net.roads || (Array.isArray(net) ? net : null);
  if (!segs || !segs.length) return null;
  return segs.map((s) => {
    const a = s.a || s.start || s.from;
    const b = s.b || s.end || s.to;
    if (!a || !b) return null;
    return { a, b };
  }).filter(Boolean);
}

function segmentDirection(seg) {
  const dx = seg.b.x - seg.a.x;
  const dz = seg.b.z - seg.a.z;
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len, len };
}

export function createTraffic(state, count) {
  const world = state.world || state.scene || null;
  const scene = world?.scene || world;
  const segs = resolveNetwork(state) || [];
  const cars = [];
  const kinds = ['sedan', 'sedan', 'taxi', 'van', 'sport', 'truck'];
  const n = count || 14;
  for (let i = 0; i < n; i++) {
    const kind = kinds[i % kinds.length];
    const cols = TRAFFIC_COLORS[kind];
    const color = cols[Math.floor(Math.random() * cols.length)];
    const mesh = buildCarMesh(kind, color, { plate: 'TC ' + (1000 + Math.floor(Math.random() * 9000)) });
    let seg = segs.length ? segs[Math.floor(Math.random() * segs.length)] : null;
    let prog = Math.random();
    let x = 0;
    let z = 0;
    let heading = 0;
    if (seg) {
      const d = segmentDirection(seg);
      x = seg.a.x + d.x * prog * d.len;
      z = seg.a.z + d.z * prog * d.len;
      heading = Math.atan2(-d.x, -d.z);
    } else {
      x = (Math.random() - 0.5) * 220;
      z = (Math.random() - 0.5) * 220;
      heading = Math.random() * Math.PI * 2;
    }
    mesh.position.set(x, 0, z);
    mesh.rotation.y = heading;
    if (scene && scene.add) scene.add(mesh);
    const car = {
      group: mesh,
      mesh,
      position: mesh.position,
      heading,
      angle: heading,
      speed: 6 + Math.random() * 7,
      velocity: { x: 0, z: 0 },
      type: kind,
      kind,
      color,
      condition: 100,
      health: 100,
      seg,
      prog,
      wheels: mesh.userData.wheels,
    };
    cars.push(car);
  }
  trafficCache = cars;
  return cars;
}

function playerPosition(state) {
  const p = state.player || state.pemain;
  if (!p) return null;
  const holder = p.car || p.vehicle || p.currentCar || p;
  const pos = holder.position || holder.group?.position || null;
  return pos;
}

function nearSegment(segs, point, exclude) {
  let best = null;
  let bestD = 1e9;
  for (const s of segs) {
    if (s === exclude) continue;
    const mx = (s.a.x + s.b.x) / 2;
    const mz = (s.a.z + s.b.z) / 2;
    const d = Math.hypot(mx - point.x, mz - point.z);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function updateTraffic(state, dt) {
  const cars = state.cars || state.traffic || state.vehicles || trafficCache;
  if (!cars || !cars.length) return;
  const segs = resolveNetwork(state) || [];
  const pp = playerPosition(state);
  const step = Math.min(dt, 0.05);
  const p = state.player || state.pemain || null;
  const playerCar = p ? (p.car || p.vehicle || p.currentCar || null) : null;
  const playerGroup = playerCar ? (playerCar.group || playerCar.mesh || playerCar) : null;
  for (const car of cars) {
    if (!car.group) continue;
    // Mobil yang dikendarai pemain dikendalikan updatePlayer, bukan
    // lalu lintas: jangan dipindah, diputar, atau di-teleport.
    if (playerCar && (car === playerCar || car.group === playerGroup)) continue;
    if (pp && segs.length) {
      const d = Math.hypot(car.position.x - pp.x, car.position.z - pp.z);
      if (d > 130) {
        const near = nearSegment(segs, pp, car.seg);
        if (near) {
          car.seg = near;
          car.prog = 0;
          car.position.set(near.a.x, 0, near.a.z);
        }
      }
    }
    if (car.seg) {
      const d = segmentDirection(car.seg);
      car.prog += (car.speed * step) / d.len;
      if (car.prog >= 1) {
        let next = null;
        if (segs.length) {
          const ends = segs.filter((s) => Math.hypot(s.a.x - car.seg.b.x, s.a.z - car.seg.b.z) < 3);
          if (ends.length) next = ends[Math.floor(Math.random() * ends.length)];
          else next = segs[Math.floor(Math.random() * segs.length)];
        }
        car.seg = next;
        car.prog = 0;
        if (next) {
          car.position.set(next.a.x, 0, next.a.z);
        }
      } else {
        const nx = car.seg.a.x + d.x * car.prog * d.len;
        const nz = car.seg.a.z + d.z * car.prog * d.len;
        const targetHeading = Math.atan2(-d.x, -d.z);
        let diff = targetHeading - car.heading;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        car.heading += diff * Math.min(1, step * 4);
        car.angle = car.heading;
        car.position.set(nx, 0, nz);
        car.velocity.x = d.x * car.speed;
        car.velocity.z = d.z * car.speed;
      }
    } else {
      car.heading += Math.sin(performance.now() * 0.0001 + car.speed) * step * 0.1;
      car.position.x += -Math.sin(car.heading) * car.speed * step;
      car.position.z += -Math.cos(car.heading) * car.speed * step;
      car.velocity.x = -Math.sin(car.heading) * car.speed;
      car.velocity.z = -Math.cos(car.heading) * car.speed;
    }
    car.group.rotation.y = car.heading;
    if (car.wheels) {
      const spin = (car.speed * step) / 0.38;
      for (const w of car.wheels) w.rotation.x += spin;
    }
  }
}

export function nearestCar(state, point, maxDist) {
  const cars = state.cars || state.traffic || state.vehicles || trafficCache;
  if (!cars || !cars.length || !point) return null;
  let best = null;
  let bestD = maxDist || 6;
  for (const car of cars) {
    if (!car.position) continue;
    const d = Math.hypot(car.position.x - point.x, car.position.z - point.z);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

// Memastikan lalu lintas ada (dipakai staging/shot): bila belum ada,
// bangkitkan; bila sudah ada, kembalikan apa adanya.
export function ensureTraffic(state, count) {
  const existing = state.cars || state.traffic || state.vehicles || trafficCache;
  if (existing && existing.length) {
    state.cars = existing;
    state.traffic = existing;
    return existing;
  }
  const made = createTraffic(state, count || 14);
  state.cars = made;
  state.traffic = made;
  return made;
}
