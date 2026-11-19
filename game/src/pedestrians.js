// pedestrians.js — pejalan kaki Teluk Cerah: figur manusia berproporsi
// wajar dengan wajah, pakaian beragam, berjalan santai di trotoar,
// menyeberang di zebra, dan lari menjauh dari tembakan atau mobil ngebut.
// Revisi 2: pejalan kadang menyeberang di zebra, kecepatan dan tinggi
// lebih bervariasi, kepala menoleh saat berjalan.
// Semua bentuk dibuat prosedural; tidak ada aset luar.

let pedCache = [];

function clothTexture(base) {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 96, 96);
  for (let i = 0; i < 10; i++) {
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#000000';
    ctx.fillRect(Math.random() * 96, 0, 2 + Math.random() * 4, 96);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Figur manusia lengkap (versi pejalan kaki). Menghadap -Z saat rotasi 0.
function buildWalkerFigure(opts = {}) {
  const skin = opts.skin || 0xd9a06f;
  const shirtCol = opts.shirt || '#c2a23a';
  const pantsCol = opts.pants || '#2e3440';
  const hairCol = opts.hair || 0x2a1a12;
  const hat = opts.hat || null;
  const scale = opts.scale || 1;
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({ map: clothTexture(shirtCol), roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsCol, roughness: 0.9 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairCol, roughness: 0.9 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.55 });

  const fig = new THREE.Group();
  const pivots = {};
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.54, 12), shirtMat);
  torso.position.y = 1.18;
  torso.castShadow = true;
  fig.add(torso);
  pivots.torso = torso;
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), shirtMat);
  shoulders.scale.set(1.3, 0.55, 0.85);
  shoulders.position.y = 1.42;
  fig.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.09, 8), skinMat);
  neck.position.y = 1.51;
  fig.add(neck);
  const head = new THREE.Group();
  head.position.y = 1.66;
  fig.add(head);
  pivots.head = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 14), skinMat);
  skull.scale.set(0.92, 1.05, 0.96);
  skull.castShadow = true;
  head.add(skull);
  if (hat === 'cap') {
    const capMat = new THREE.MeshStandardMaterial({ color: opts.hatColor || 0x2a4a8a, roughness: 0.8 });
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    capTop.scale.set(0.95, 0.7, 0.98);
    capTop.position.y = 0.03;
    head.add(capTop);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.018, 14), capMat);
    brim.scale.set(1, 1, 1.3);
    brim.position.set(0, 0.06, -0.09);
    head.add(brim);
  } else if (hat === 'wide') {
    const hatMat = new THREE.MeshStandardMaterial({ color: 0xd8c48a, roughness: 0.9 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
    dome.position.y = 0.05;
    head.add(dome);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.02, 16), hatMat);
    rim.position.y = 0.05;
    head.add(rim);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.165, 14, 10), hairMat);
    hair.scale.set(0.95, 0.8, 0.98);
    hair.position.set(0, 0.05, 0.025);
    head.add(hair);
    if (opts.longHair) {
      const back = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), hairMat);
      back.scale.set(0.8, 1.1, 0.5);
      back.position.set(0, -0.08, 0.12);
      head.add(back);
    }
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.4 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), eyeMat);
    eye.position.set(s * 0.058, 0.02, -0.142);
    head.add(eye);
  }
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.038, 0.007, 6, 12, Math.PI * 0.85),
    new THREE.MeshStandardMaterial({ color: 0x7a4a30, roughness: 0.7 })
  );
  smile.position.set(0, -0.07, -0.14);
  smile.rotation.z = Math.PI + Math.PI * 0.075;
  smile.rotation.x = 0.15;
  head.add(smile);

  function buildArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.25, 1.42, 0);
    fig.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.047, 0.29, 8), shirtMat);
    upper.position.y = -0.145;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.29;
    shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.27, 8), skinMat);
    fore.position.y = -0.135;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), skinMat);
    hand.scale.set(0.85, 1.15, 0.95);
    hand.position.y = -0.3;
    elbow.add(hand);
    return { shoulder, elbow, hand };
  }
  pivots.armL = buildArm(-1);
  pivots.armR = buildArm(1);

  function buildLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.095, 0.9, 0);
    fig.add(hip);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.057, 0.4, 8), pantsMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.4;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.047, 0.38, 8), pantsMat);
    shin.position.y = -0.19;
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), shoeMat);
    shoe.scale.set(1, 0.55, 1.7);
    shoe.position.set(0, -0.4, -0.04);
    knee.add(shoe);
    return { hip, knee, shoe };
  }
  pivots.legL = buildLeg(-1);
  pivots.legR = buildLeg(1);

  if (opts.bag) {
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshStandardMaterial({ color: opts.bag, roughness: 0.8 }));
    bag.scale.set(1, 1.2, 0.45);
    bag.position.set(-0.3, 0.95, 0.1);
    fig.add(bag);
  }

  fig.scale.setScalar(scale);
  fig.userData.pivots = pivots;
  return { group: fig, pivots };
}

const SKINS = [0xe8b98a, 0xd9a06f, 0xc98f5f, 0xf0c49a, 0xa8763e, 0x8a5a30];
const SHIRTS = ['#c2a23a', '#3a7ac2', '#c25a7a', '#4a9a5a', '#e07b39', '#7a5ac2', '#d8d8d8', '#2a9a8a'];
const PANTS = ['#2e3440', '#3a2a20', '#4a4a52', '#22303a', '#5a3a2a'];
const HATS = [null, null, null, 'cap', 'wide'];

function resolveNetwork(state) {
  const net = state.roads || state.network || state.city || null;
  if (!net) return null;
  const segs = net.segments || net.roads || (Array.isArray(net) ? net : null);
  return segs && segs.length ? segs : null;
}

function playerPos(state) {
  const p = state.player || state.pemain;
  if (!p) return null;
  const holder = p.car || p.vehicle || p.currentCar || p;
  return holder.position || holder.group?.position || null;
}

export function createPedestrians(state, count) {
  const world = state.world || state.scene || null;
  const scene = world?.scene || world;
  const segs = resolveNetwork(state) || [];
  const peds = [];
  const n = count || 40;
  for (let i = 0; i < n; i++) {
    const built = buildWalkerFigure({
      skin: SKINS[i % SKINS.length],
      shirt: SHIRTS[(i * 3 + 1) % SHIRTS.length],
      pants: PANTS[i % PANTS.length],
      hat: HATS[i % HATS.length],
      hatColor: [0x2a4a8a, 0xc23a3a, 0x2a6a3a][i % 3],
      longHair: i % 4 === 1,
      bag: i % 5 === 2 ? 0x8a5a2a : null,
      scale: 0.88 + (i % 7) * 0.035,
    });
    const group = built.group;
    let x = (Math.random() - 0.5) * 240;
    let z = (Math.random() - 0.5) * 220;
    let heading = Math.random() * Math.PI * 2;
    if (segs.length) {
      const seg = segs[Math.floor(Math.random() * segs.length)];
      const a = seg.a || seg.start || seg.from;
      const b = seg.b || seg.end || seg.to;
      if (a && b) {
        const t = Math.random();
        const mx = a.x + (b.x - a.x) * t;
        const mz = a.z + (b.z - a.z) * t;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const len = Math.hypot(dx, dz) || 1;
        const side = Math.random() < 0.5 ? -1 : 1;
        x = mx + (-dz / len) * side * 8.6;
        z = mz + (dx / len) * side * 8.6;
        heading = Math.atan2(-dx / len, -dz / len) + (side < 0 ? Math.PI : 0);
      }
    }
    group.position.set(x, 0, z);
    group.rotation.y = heading;
    if (scene && scene.add) scene.add(group);
    peds.push({
      group,
      mesh: group,
      position: group.position,
      heading,
      angle: heading,
      speed: 0.7 + Math.random() * 1.1,
      walkPhase: Math.random() * 6.28,
      fleeing: false,
      crossing: false,
      crossTimer: 4 + Math.random() * 10,
      pivots: built.pivots,
    });
  }
  pedCache = peds;
  return peds;
}

export function updatePedestrians(state, dt) {
  const peds = state.pedestrians || state.peds || pedCache;
  if (!peds || !peds.length) return;
  const step = Math.min(dt, 0.05);
  const pp = playerPos(state);
  const shooting = state.combat?.firing || state.combat?.muzzle || false;
  const segs = resolveNetwork(state) || [];
  for (const ped of peds) {
    if (!ped.group) continue;
    let flee = false;
    if (shooting && pp) {
      const d = Math.hypot(ped.position.x - pp.x, ped.position.z - pp.z);
      if (d < 26) flee = true;
    }
    if (pp && state.player?.car && state.player.speed > 12) {
      const d = Math.hypot(ped.position.x - pp.x, ped.position.z - pp.z);
      if (d < 9) flee = true;
    }
    ped.fleeing = flee;
    const speed = flee ? 6.5 : ped.speed;
    if (pp) {
      const d = Math.hypot(ped.position.x - pp.x, ped.position.z - pp.z);
      if (d > 120) {
        ped.position.set(pp.x + (Math.random() - 0.5) * 90, 0, pp.z + (Math.random() - 0.5) * 90);
        if (segs.length) {
          const seg = segs[Math.floor(Math.random() * segs.length)];
          const a = seg.a || seg.start || seg.from;
          const b = seg.b || seg.end || seg.to;
          if (a && b) {
            const dx = b.x - a.x;
            const dz = b.z - a.z;
            const len = Math.hypot(dx, dz) || 1;
            ped.heading = Math.atan2(-dx / len, -dz / len);
          }
        }
        ped.crossing = false;
      }
    }
    if (flee && pp) {
      const dx = ped.position.x - pp.x;
      const dz = ped.position.z - pp.z;
      const len = Math.hypot(dx, dz) || 1;
      ped.heading = Math.atan2(-dx / len, -dz / len);
    } else {
      // kadang menyeberang di zebra: belok tegak lurus lalu kembali
      ped.crossTimer -= step;
      if (ped.crossTimer <= 0) {
        if (!ped.crossing && Math.random() < 0.5) {
          ped.crossing = true;
          ped.crossTimer = 3 + Math.random() * 2;
          ped.heading += Math.PI / 2;
        } else if (ped.crossing) {
          ped.crossing = false;
          ped.crossTimer = 6 + Math.random() * 10;
          ped.heading -= Math.PI / 2;
        } else {
          ped.crossTimer = 5 + Math.random() * 8;
          ped.heading += (Math.random() - 0.5) * 1.0;
        }
      }
    }
    ped.position.x += -Math.sin(ped.heading) * speed * step;
    ped.position.z += -Math.cos(ped.heading) * speed * step;
    ped.group.rotation.y = ped.heading;
    ped.angle = ped.heading;
    ped.walkPhase += speed * step * (flee ? 2.6 : 2.1);
    const ph = ped.walkPhase;
    const amp = flee ? 0.9 : 0.5;
    const pv = ped.pivots;
    if (pv) {
      pv.legL.hip.rotation.x = Math.sin(ph) * amp;
      pv.legR.hip.rotation.x = -Math.sin(ph) * amp;
      pv.legL.knee.rotation.x = Math.max(0, -Math.sin(ph - 0.6)) * amp;
      pv.legR.knee.rotation.x = Math.max(0, Math.sin(ph - 0.6)) * amp;
      if (flee) {
        pv.armL.shoulder.rotation.x = -2.4 + Math.sin(ph) * 0.3;
        pv.armR.shoulder.rotation.x = -2.4 - Math.sin(ph) * 0.3;
        pv.armL.elbow.rotation.x = -0.7;
        pv.armR.elbow.rotation.x = -0.7;
      } else {
        pv.armL.shoulder.rotation.x = -Math.sin(ph) * amp * 0.6;
        pv.armR.shoulder.rotation.x = Math.sin(ph) * amp * 0.6;
        pv.armL.elbow.rotation.x = -0.15;
        pv.armR.elbow.rotation.x = -0.15;
      }
      pv.torso.rotation.x = flee ? 0.16 : 0.03;
      ped.group.position.y = Math.abs(Math.sin(ph)) * 0.03;
      pv.head.rotation.y = Math.sin(performance.now() * 0.0006 + ped.walkPhase) * 0.2;
    }
  }
}

// Memastikan pejalan kaki ada (dipakai staging/shot): bila belum ada,
// bangkitkan di sekitar pemain; bila sudah ada, kembalikan apa adanya.
export function ensurePedestrians(state, count) {
  const existing = state.pedestrians || state.peds || pedCache;
  if (existing && existing.length) {
    state.pedestrians = existing;
    return existing;
  }
  const made = createPedestrians(state, count || 40);
  state.pedestrians = made;
  state.peds = made;
  return made;
}
