// city.js — Kota Teluk Cerah: jalan bertekstur, trotoar, gedung berfasad,
// palem rimbun, rambu neon orisinal, mercusuar, Tugu Kerang, Pasar Malam,
// skyline berlapis, dan jaringan jalan yang dipakai semua sistem.
// Revisi 2: aspal lebih gelap supaya pantulan neon terbaca, semua
// tekstur memakai RNG seed yang sama (deterministik), neon lebih kuat.
// Semua permukaan dilukis prosedural di kanvas; tidak ada aset luar.

const COL_X = [-140, -84, -28, 28, 84, 140];
const ROW_Z = [-112, -56, 0, 56, 112];
const ROAD_X = [-168, -112, -56, 0, 56, 112, 168];
const ROAD_Z = [-140, -84, -28, 28, 84, 140];
const ROAD_W = 13;
const BLOCK = 43;

// RNG untuk tekstur: diisi dari rng seed di buildCity supaya kota
// yang sama selalu tampil sama.
let texRand = Math.random;

function makeRand(rng) {
  const has = rng && typeof rng.next === 'function';
  const next = () => (has ? rng.next() : Math.random());
  const range = (a, b) => {
    if (rng && typeof rng.range === 'function') return rng.range(a, b);
    return a + next() * (b - a);
  };
  const pick = (arr) => arr[Math.floor(next() * arr.length)];
  return { next, range, pick };
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function speckle(ctx, w, h, n, cols, aMin, aMax) {
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = aMin + texRand() * (aMax - aMin);
    ctx.fillStyle = cols[Math.floor(texRand() * cols.length)];
    const s = 1 + texRand() * 2.4;
    ctx.fillRect(texRand() * w, texRand() * h, s, s);
  }
  ctx.globalAlpha = 1;
}

// ---- tekstur jalan: aspal berbutir gelap, marka, zebra, genangan neon ----
function asphaltTexture(len, vertical, streakCols) {
  const w = 256;
  const h = 512;
  return canvasTex(w, h, (ctx) => {
    ctx.fillStyle = '#2e2b33';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#35313a';
    ctx.fillRect(0, 0, w, h * 0.5);
    speckle(ctx, w, h, 2600, ['#453f4c', '#241f28', '#4a4450', '#2a262e'], 0.1, 0.32);
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#1b161e';
      ctx.beginPath();
      ctx.ellipse(texRand() * w, texRand() * h, 20 + texRand() * 42, 12 + texRand() * 26, texRand(), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // coretan neon memanjang seperti cermin basah
    for (const col of streakCols) {
      const x = 24 + texRand() * (w - 48);
      const sw = 5 + texRand() * 12;
      const g = ctx.createLinearGradient(x, 0, x + sw, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, sw, h);
    }
    ctx.globalAlpha = 1;
    // genangan yang menangkap cahaya
    for (let i = 0; i < 5; i++) {
      const x = 30 + texRand() * (w - 60);
      const y = texRand() * h;
      const g = ctx.createRadialGradient(x, y, 2, x, y, 26 + texRand() * 22);
      g.addColorStop(0, 'rgba(255,170,120,0.55)');
      g.addColorStop(0.5, 'rgba(120,180,255,0.25)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, 30, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // garis tepi
    ctx.fillStyle = 'rgba(235,225,200,0.85)';
    ctx.fillRect(6, 0, 3, h);
    ctx.fillRect(w - 9, 0, 3, h);
    // garis tengah putus-putus
    ctx.fillStyle = 'rgba(250,220,120,0.9)';
    for (let y = 8; y < h; y += 64) ctx.fillRect(w / 2 - 3, y, 6, 34);
    // zebra di kedua ujung
    ctx.fillStyle = 'rgba(245,245,240,0.92)';
    for (let i = 0; i < 7; i++) {
      const x = 14 + i * 32;
      ctx.fillRect(x, 10, 18, 26);
      ctx.fillRect(x, h - 36, 18, 26);
    }
  });
}

function sidewalkTexture() {
  return canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#9a8d7c';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 1400, ['#b0a28e', '#7d7263', '#c4b49c'], 0.1, 0.28);
    ctx.strokeStyle = 'rgba(60,50,40,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * 64); ctx.lineTo(w, i * 64); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i * 64, 0); ctx.lineTo(i * 64, h); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(52,44,36,0.8)';
    ctx.fillRect(0, 0, w, 10);
    ctx.fillRect(0, h - 10, w, 10);
  });
}

function groundTexture() {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#7d6f5e';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 3200, ['#8d7d68', '#6b5d4c', '#9a8871', '#5d5044'], 0.1, 0.3);
  });
}

// ---- fasad gedung: jendela berbingkai, variasi nyala/gelap/tirai ----
function facadeTexture(base, trim, litRatio, floors, cols) {
  return canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 900, ['rgba(255,255,255,0.06)', 'rgba(0,0,0,0.10)'], 0.05, 0.16);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let f = 0; f <= floors; f++) ctx.fillRect(0, (f * h) / floors, w, 3);
    const cw = w / cols;
    const ch = h / floors;
    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + cw * 0.18;
        const y = f * ch + ch * 0.2;
        const ww = cw * 0.64;
        const wh = ch * 0.58;
        const r = texRand();
        let fill = '#20242e';
        if (r < litRatio) fill = texRand() < 0.6 ? '#ffd98a' : '#ffb46a';
        else if (r < litRatio + 0.16) fill = '#7fa8c9';
        ctx.fillStyle = trim;
        ctx.fillRect(x - 3, y - 3, ww + 6, wh + 6);
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, ww, wh);
        if (r >= litRatio && r < litRatio + 0.16) {
          ctx.fillStyle = 'rgba(240,220,190,0.75)';
          ctx.fillRect(x, y, ww, wh * 0.45);
        }
        if (r < litRatio) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.fillRect(x, y, ww, 3);
        }
      }
    }
  });
}

function shopSignTexture(text, fg, bg) {
  return canvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    ctx.font = 'bold 52px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = fg;
    ctx.shadowBlur = 22;
    ctx.fillStyle = fg;
    ctx.fillText(text, w / 2, h / 2 + 2);
    ctx.shadowBlur = 0;
  });
}

function barkTexture() {
  return canvasTex(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#6e5138';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 14) {
      ctx.fillStyle = 'rgba(40,26,14,0.55)';
      ctx.fillRect(0, y, w, 5);
      ctx.fillStyle = 'rgba(160,120,80,0.35)';
      ctx.fillRect(0, y + 5, w, 3);
    }
    speckle(ctx, w, h, 300, ['#8a6a48', '#4a3520'], 0.15, 0.4);
  });
}

function frondTexture() {
  return canvasTex(128, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2f7a3d');
    g.addColorStop(0.5, '#3f9a4a');
    g.addColorStop(1, '#67b95a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(20,60,25,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.strokeStyle = 'rgba(140,220,120,0.35)';
    ctx.lineWidth = 2;
    for (let y = 10; y < h; y += 16) {
      ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(6, y + 12); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w / 2, y); ctx.lineTo(w - 6, y + 12); ctx.stroke();
    }
  });
}

const SHOP_NAMES = [
  { text: 'WARUNG SENJA', fg: '#ffb02e', bg: '#3a1c2e' },
  { text: 'KOPI TELUK', fg: '#7dffc8', bg: '#12303a' },
  { text: 'SATE TELUK', fg: '#ff7a5a', bg: '#2e1a12' },
  { text: 'BAKSO TELUK', fg: '#ffe066', bg: '#1c2a4a' },
  { text: 'ES KELAPA', fg: '#7de3ff', bg: '#0f2a22' },
  { text: 'PASAR MALAM', fg: '#7dff5a', bg: '#14250f' },
  { text: 'IKAN BAKAR', fg: '#ffa3d1', bg: '#33142a' },
  { text: 'GORENGAN 88', fg: '#ffd23e', bg: '#2a1a08' },
];

function buildPalm(rand, barkTex, frondTex, frondGeo) {
  const palm = new THREE.Group();
  const h = rand.range(6, 10.5);
  const lean = rand.range(-0.1, 0.1);
  const trunkMat = new THREE.MeshStandardMaterial({ map: barkTex, roughness: 0.95 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.3, h, 7), trunkMat);
  trunk.position.y = h / 2;
  trunk.rotation.z = lean;
  trunk.castShadow = true;
  palm.add(trunk);
  const topX = -Math.sin(lean) * h;
  const topY = h * Math.cos(lean);
  const frondMat = new THREE.MeshStandardMaterial({
    map: frondTex, side: THREE.DoubleSide, roughness: 0.85,
  });
  const n = 9 + Math.floor(rand.next() * 4);
  for (let i = 0; i < n; i++) {
    const frond = new THREE.Mesh(frondGeo, frondMat);
    const ang = (i / n) * Math.PI * 2 + rand.range(-0.2, 0.2);
    const droop = rand.range(0.55, 1.05);
    frond.position.set(topX, topY, 0);
    frond.rotation.order = 'YXZ';
    frond.rotation.y = ang;
    frond.rotation.x = -droop;
    frond.castShadow = true;
    palm.add(frond);
  }
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x6b4a26, roughness: 0.9 })
    );
    nut.position.set(topX + rand.range(-0.3, 0.3), topY - 0.25, rand.range(-0.3, 0.3));
    palm.add(nut);
  }
  return palm;
}

function buildLeafTree(rand) {
  const tree = new THREE.Group();
  const h = rand.range(3.5, 6);
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.26, h, 7),
    new THREE.MeshStandardMaterial({ color: 0x5d4630, roughness: 0.95 })
  );
  trunk.position.y = h / 2;
  trunk.castShadow = true;
  tree.add(trunk);
  const greens = [0x3d8a44, 0x4da34f, 0x2f7a3a, 0x69b45a];
  const blobs = 3 + Math.floor(rand.next() * 3);
  for (let i = 0; i < blobs; i++) {
    const r = rand.range(1.1, 2.1);
    const geo = new THREE.IcosahedronGeometry(r, 1);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const s = 0.88 + rand.next() * 0.24;
      pos.setXYZ(v, pos.getX(v) * s, pos.getY(v) * s * 0.82, pos.getZ(v) * s);
    }
    geo.computeVertexNormals();
    const blob = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: greens[i % greens.length], roughness: 0.9, flatShading: true,
    }));
    blob.position.set(rand.range(-1.1, 1.1), h + rand.range(-0.2, 1.4), rand.range(-1.1, 1.1));
    blob.castShadow = true;
    tree.add(blob);
  }
  return tree;
}

function neonSign(scene, text, fg, bg, w, h, x, y, z, ry) {
  const tex = shopSignTexture(text, fg, bg);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: false });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  sign.position.set(x, y, z);
  sign.rotation.y = ry;
  scene.add(sign);
  const glowTex = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, fg);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return c;
  })());
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, transparent: true, opacity: 0.5, depthWrite: false,
  }));
  glow.scale.set(w * 1.7, h * 2.4, 1);
  glow.position.set(x, y, z);
  scene.add(glow);
  if (!scene.userData.telukAnim) scene.userData.telukAnim = [];
  scene.userData.telukAnim.push({ mat: glow.material, phase: Math.random() * 6.28, base: 0.5, kind: 'glow' });
  return sign;
}

function buildShopRow(scene, rand, x, z, ry) {
  const row = new THREE.Group();
  row.position.set(x, 0, z);
  row.rotation.y = ry;
  const shop = SHOP_NAMES[Math.floor(rand.next() * SHOP_NAMES.length)];
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(10, 3.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.7 })
  );
  front.position.y = 1.7;
  row.add(front);
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 2.2),
    new THREE.MeshStandardMaterial({
      color: 0xffc46a, emissive: 0xff9a3c, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.4,
    })
  );
  glass.position.set(0, 1.6, 0.28);
  row.add(glass);
  const awn = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 0.18, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xd94a4a, roughness: 0.8 })
  );
  awn.position.set(0, 3.5, 0.7);
  awn.rotation.x = 0.25;
  row.add(awn);
  scene.add(row);
  neonSign(scene, shop.text, shop.fg, shop.bg, 7.5, 1.9, x, 4.6, z, ry);
  return row;
}

export function buildCity(scene, rng) {
  const rand = makeRand(rng);
  texRand = rand.next;
  const group = new THREE.Group();
  group.name = 'teluk-cerah-city';
  scene.add(group);
  if (!scene.userData.telukAnim) scene.userData.telukAnim = [];

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(560, 560),
    new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, 0);
  ground.receiveShadow = true;
  group.add(ground);

  // laut + pasir di barat (Marina)
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 560),
    new THREE.MeshStandardMaterial({ color: 0x2e7f9e, roughness: 0.15, metalness: 0.55 })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-232, 0.02, 0);
  group.add(sea);
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 560),
    new THREE.MeshStandardMaterial({ color: 0xe0c48f, roughness: 0.95 })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-176, 0.02, 0);
  sand.receiveShadow = true;
  group.add(sand);

  // ---- jalan + trotoar ----
  const streakSets = [
    ['rgba(255,79,163,0.85)', 'rgba(55,242,200,0.7)', 'rgba(255,176,46,0.7)'],
    ['rgba(79,195,255,0.8)', 'rgba(255,79,163,0.7)', 'rgba(255,210,62,0.6)'],
    ['rgba(125,255,90,0.7)', 'rgba(255,122,90,0.7)', 'rgba(79,195,255,0.7)'],
  ];
  const roadTexA = asphaltTexture(56, true, streakSets[0]);
  const roadTexB = asphaltTexture(56, true, streakSets[1]);
  const roadTexC = asphaltTexture(56, true, streakSets[2]);
  const roadMats = [roadTexA, roadTexB, roadTexC].map((t) => new THREE.MeshStandardMaterial({
    map: t, roughness: 0.32, metalness: 0.28, envMapIntensity: 1.3,
  }));
  const walkTex = sidewalkTexture();
  const walkMat = new THREE.MeshStandardMaterial({ map: walkTex, roughness: 0.85 });

  const segments = [];
  function addRoad(cx, cz, len, alongX) {
    const mat = roadMats[Math.floor(rand.next() * roadMats.length)];
    const road = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : ROAD_W, alongX ? ROAD_W : len), mat);
    road.rotation.x = -Math.PI / 2;
    if (!alongX) road.rotation.z = Math.PI / 2;
    road.position.set(cx, 0.03, cz);
    road.receiveShadow = true;
    group.add(road);
    for (const side of [-1, 1]) {
      const walk = new THREE.Mesh(
        new THREE.PlaneGeometry(alongX ? len : 4.4, alongX ? 4.4 : len), walkMat
      );
      walk.rotation.x = -Math.PI / 2;
      if (!alongX) walk.rotation.z = Math.PI / 2;
      walk.position.set(
        alongX ? cx : cx + side * (ROAD_W / 2 + 2.2),
        0.1,
        alongX ? cz + side * (ROAD_W / 2 + 2.2) : cz
      );
      walk.receiveShadow = true;
      group.add(walk);
    }
    const a = new THREE.Vector3(alongX ? cx - len / 2 : cx, 0, alongX ? cz : cz - len / 2);
    const b = new THREE.Vector3(alongX ? cx + len / 2 : cx, 0, alongX ? cz : cz + len / 2);
    const seg = { a, b, start: a, end: b, from: a, to: b, alongX, length: len };
    segments.push(seg);
    return seg;
  }
  for (const z of ROAD_Z) addRoad(0, z, 336, true);
  for (const x of ROAD_X) addRoad(x, 0, 280, false);

  // ---- gedung per blok ----
  const districtOf = (col, row) => {
    if (row === 0) return 'Perumahan';
    if (row === 4) return 'Pelabuhan';
    if (col <= 1 && row >= 2) return 'Marina';
    if (col <= 2 && row !== 1) return 'Kota Tua';
    if (row === 1 && col <= 2) return 'Kota Tua';
    return 'CBD';
  };
  const blocks = [];
  const palette = {
    CBD: [
      { base: '#5a4a7a', trim: '#2e2440', lit: 0.55 },
      { base: '#7a5a3a', trim: '#3a2a18', lit: 0.5 },
      { base: '#3a6a7a', trim: '#1e3640', lit: 0.6 },
      { base: '#8a4a5a', trim: '#40222a', lit: 0.5 },
    ],
    'Kota Tua': [
      { base: '#a8763e', trim: '#5a3a1c', lit: 0.45 },
      { base: '#b98a5a', trim: '#6a4a28', lit: 0.4 },
      { base: '#8a6a4a', trim: '#4a3622', lit: 0.42 },
    ],
    Perumahan: [
      { base: '#c98a6a', trim: '#7a4a32', lit: 0.5 },
      { base: '#d8b078', trim: '#8a6a3e', lit: 0.5 },
      { base: '#b0785a', trim: '#6a4230', lit: 0.48 },
    ],
    Marina: [
      { base: '#e8d8b0', trim: '#8a7a52', lit: 0.5 },
      { base: '#f0e0c0', trim: '#9a8a62', lit: 0.52 },
    ],
    Pelabuhan: [
      { base: '#6a5a4a', trim: '#3a3026', lit: 0.3 },
      { base: '#7a6a52', trim: '#443a2a', lit: 0.28 },
    ],
  };
  const roofGearMat = new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.9 });
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x9a8a72, roughness: 0.8 });

  function buildTower(bx, bz, district, tall) {
    const pal = palette[district][Math.floor(rand.next() * palette[district].length)];
    const floors = tall ? 9 + Math.floor(rand.next() * 8) : 3 + Math.floor(rand.next() * 4);
    const cols = 4 + Math.floor(rand.next() * 3);
    const w = rand.range(13, 19);
    const d = rand.range(13, 19);
    const h = floors * 3.1;
    const tex = facadeTexture(pal.base, pal.trim, pal.lit, floors, cols);
    const mats = [
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ color: pal.trim, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ color: pal.trim, roughness: 0.9 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }),
    ];
    const tower = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    tower.add(body);
    if (tall && rand.next() < 0.7) {
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.62, h * 0.22, d * 0.62),
        new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 })
      );
      top.position.y = h + h * 0.11;
      top.castShadow = true;
      tower.add(top);
    }
    const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), roofGearMat);
    ac.position.set(-w * 0.25, h + 0.45, -d * 0.2);
    tower.add(ac);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.6, 10), tankMat);
    tank.position.set(w * 0.28, h + 0.8, d * 0.22);
    tower.add(tank);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 4.5, 6), roofGearMat);
    ant.position.set(w * 0.3, h + 2.2, -d * 0.28);
    tower.add(ant);
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xff4a3c, emissive: 0xff2a1a, emissiveIntensity: 1.6 })
    );
    tip.position.set(w * 0.3, h + 4.5, -d * 0.28);
    tower.add(tip);
    if (district !== 'Pelabuhan' && rand.next() < 0.6) {
      for (let f = 1; f < floors; f += 2) {
        const balc = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.5, 0.18, 1.1),
          new THREE.MeshStandardMaterial({ color: pal.trim, roughness: 0.85 })
        );
        balc.position.set(0, f * 3.1, d / 2 + 0.5);
        tower.add(balc);
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(w * 0.5, 0.7, 0.08),
          new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6, metalness: 0.5 })
        );
        rail.position.set(0, f * 3.1 + 0.45, d / 2 + 1.0);
        tower.add(rail);
      }
    }
    tower.position.set(bx, 0, bz);
    tower.rotation.y = (rand.next() < 0.5 ? 0 : Math.PI / 2) + rand.range(-0.03, 0.03);
    group.add(tower);
    return { x: bx, z: bz, h, w, d, district };
  }

  const built = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      const bx = COL_X[col];
      const bz = ROW_Z[row];
      const district = districtOf(col, row);
      blocks.push({ x: bx, z: bz, cx: bx, cz: bz, w: BLOCK, d: BLOCK, size: BLOCK, district, name: district, col, row });
      if (district === 'Pelabuhan') {
        const wh = new THREE.Mesh(
          new THREE.BoxGeometry(26, 8, 16),
          new THREE.MeshStandardMaterial({ map: facadeTexture('#6a5a4a', '#3a3026', 0.25, 2, 6), roughness: 0.85 })
        );
        wh.position.set(bx, 4, bz);
        wh.castShadow = true;
        group.add(wh);
        const contCols = [0xc25a3a, 0x3a7ac2, 0x7ac23a, 0xc2a23a];
        for (let i = 0; i < 4; i++) {
          const cont = new THREE.Mesh(
            new THREE.BoxGeometry(7, 2.6, 2.6),
            new THREE.MeshStandardMaterial({ color: contCols[(col + i) % 4], roughness: 0.7, metalness: 0.3 })
          );
          cont.position.set(bx - 12 + i * 8, 1.3 + (i % 2) * 2.6, bz + 14);
          cont.castShadow = true;
          group.add(cont);
        }
        continue;
      }
      if (district === 'Perumahan' || district === 'Marina') {
        for (let i = 0; i < 2; i++) {
          const hx = bx + (i === 0 ? -9 : 9);
          const hz = bz + (i === 0 ? 6 : -7);
          const house = buildTower(hx, hz, district, false);
          built.push(house);
          const roof = new THREE.Mesh(
            new THREE.ConeGeometry(11, 3.4, 4),
            new THREE.MeshStandardMaterial({ color: 0x8a4a32, roughness: 0.9, flatShading: true })
          );
          roof.position.set(hx, house.h + 1.7, hz);
          roof.rotation.y = Math.PI / 4;
          group.add(roof);
        }
      } else {
        const tower = buildTower(bx + rand.range(-4, 4), bz + rand.range(-4, 4), district, district === 'CBD');
        built.push(tower);
        if (rand.next() < 0.55) {
          const second = buildTower(bx + rand.range(-14, 14), bz + rand.range(-14, 14), district, false);
          built.push(second);
        }
      }
    }
  }

  // ---- deretan toko + rambu neon di avenue CBD ----
  const shopSpots = [
    { x: 19.5, z: -40, ry: Math.PI / 2 },
    { x: 19.5, z: 12, ry: Math.PI / 2 },
    { x: 36.5, z: -14, ry: -Math.PI / 2 },
    { x: 36.5, z: 44, ry: -Math.PI / 2 },
    { x: -8, z: -19.5, ry: 0 },
    { x: -8, z: 30, ry: 0 },
  ];
  for (const s of shopSpots) buildShopRow(scene, rand, s.x, s.z, s.ry);
  const billTex = canvasTex(512, 256, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#ff4fa3');
    g.addColorStop(0.5, '#ff9a55');
    g.addColorStop(1, '#7a5cff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.font = 'bold 64px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#ff2a7a';
    ctx.shadowBlur = 18;
    ctx.fillText('TELUK CERAH', w / 2, 108);
    ctx.font = 'bold 34px Arial, sans-serif';
    ctx.fillText('PASAR MALAM • PANTAI • KOPI', w / 2, 178);
  });
  const bill = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 13),
    new THREE.MeshBasicMaterial({ map: billTex })
  );
  bill.position.set(20, 16, -84);
  bill.rotation.y = Math.PI / 2;
  group.add(bill);
  const billPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.7, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.8 })
  );
  billPole.position.set(20, 5, -84);
  group.add(billPole);

  // ---- palem + pohon di tepi jalan ----
  const barkTex = barkTexture();
  const frondTex = frondTexture();
  const frondGeo = new THREE.PlaneGeometry(0.85, 3.0, 1, 6);
  {
    const pos = frondGeo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const y = pos.getY(v);
      const t = (y + 1.5) / 3.0;
      pos.setX(v, pos.getX(v) * (1 - t * 0.55));
      pos.setZ(v, -Math.pow(t, 2) * 1.5);
    }
    frondGeo.computeVertexNormals();
  }
  const palmSpots = [];
  for (const x of [-10.5, 10.5, 45.5, 66.5]) {
    for (let z = -130; z <= 130; z += 26) {
      if (Math.abs(z) < 8) continue;
      palmSpots.push([x + rand.range(-1, 1), z + rand.range(-4, 4)]);
    }
  }
  for (const z of [-30, 30, 90]) {
    for (let x = -150; x <= 150; x += 30) {
      if (Math.abs(x) < 20) continue;
      palmSpots.push([x + rand.range(-3, 3), z + rand.range(-1.5, 1.5)]);
    }
  }
  for (const [px, pz] of palmSpots) {
    if (rand.next() < 0.18) continue;
    const palm = buildPalm(rand, barkTex, frondTex, frondGeo);
    palm.position.set(px, 0, pz);
    palm.rotation.y = rand.next() * Math.PI * 2;
    group.add(palm);
  }
  for (let i = 0; i < 16; i++) {
    const tree = buildLeafTree(rand);
    tree.position.set(rand.range(-160, 160), 0, rand.range(-130, 130));
    group.add(tree);
  }

  // ---- lampu jalan ----
  const lampGlowTex = new THREE.CanvasTexture((() => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,220,150,0.95)');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return c;
  })());
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.6, metalness: 0.6 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffc46a, emissiveIntensity: 2.2 });
  for (let z = -126; z <= 126; z += 28) {
    for (const x of [-10.5, 66.5]) {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.4, 8), lampMat);
      pole.position.y = 3.2;
      lamp.add(pole);
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), lampMat);
      arm.rotation.z = Math.PI / 2;
      arm.position.set(x < 0 ? 0.8 : -0.8, 6.3, 0);
      lamp.add(arm);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), bulbMat);
      bulb.position.set(x < 0 ? 1.55 : -1.55, 6.25, 0);
      lamp.add(bulb);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lampGlowTex, transparent: true, opacity: 0.55, depthWrite: false,
      }));
      glow.scale.set(4.5, 4.5, 1);
      glow.position.copy(bulb.position);
      lamp.add(glow);
      lamp.position.set(x, 0, z);
      group.add(lamp);
    }
  }

  // ---- hydrant ----
  const hydMat = new THREE.MeshStandardMaterial({ color: 0xc22a22, roughness: 0.6 });
  for (let i = 0; i < 10; i++) {
    const hyd = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.7, 8), hydMat);
    body.position.y = 0.35;
    hyd.add(body);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), hydMat);
    cap.position.y = 0.72;
    hyd.add(cap);
    hyd.position.set(rand.range(-150, 150), 0, (rand.next() < 0.5 ? -1 : 1) * rand.range(9, 11) + Math.floor(rand.range(-2, 3)) * 56);
    group.add(hyd);
  }

  // ---- mercusuar di ujung barat ----
  const lightHouse = new THREE.Group();
  const lhBody = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 3.4, 22, 14),
    new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.7 })
  );
  lhBody.position.y = 11;
  lhBody.castShadow = true;
  lightHouse.add(lhBody);
  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.CylinderGeometry(2.55 - i * 0.28, 2.75 - i * 0.28, 2.2, 14),
      new THREE.MeshStandardMaterial({ color: 0xd94a3a, roughness: 0.7 })
    );
    stripe.position.y = 5 + i * 6.5;
    lightHouse.add(stripe);
  }
  const lhTop = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 2.4, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5, metalness: 0.4 })
  );
  lhTop.position.y = 23;
  lightHouse.add(lhTop);
  const lhLamp = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffdf6a, emissiveIntensity: 3 })
  );
  lhLamp.position.y = 24.6;
  lightHouse.add(lhLamp);
  const lhGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: lampGlowTex, transparent: true, opacity: 0.8, depthWrite: false,
  }));
  lhGlow.scale.set(14, 14, 1);
  lhGlow.position.y = 24.6;
  lightHouse.add(lhGlow);
  lightHouse.position.set(-186, 0, -60);
  group.add(lightHouse);

  // ---- Tugu Kerang di plaza tengah ----
  const plaza = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9.6, 0.5, 24),
    new THREE.MeshStandardMaterial({ color: 0xb0a48c, roughness: 0.85 })
  );
  plaza.position.set(-28, 0.25, 84);
  plaza.receiveShadow = true;
  group.add(plaza);
  const ped = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.8, 3, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a7a62, roughness: 0.8 })
  );
  ped.position.set(-28, 1.9, 84);
  group.add(ped);
  const shell = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xf2c9d8, roughness: 0.35, metalness: 0.15, envMapIntensity: 1.4,
  });
  const shellBody = new THREE.Mesh(new THREE.SphereGeometry(2.6, 20, 14), shellMat);
  shellBody.scale.set(1, 0.55, 1.25);
  shell.add(shellBody);
  for (let i = 0; i < 5; i++) {
    const ridge = new THREE.Mesh(
      new THREE.TorusGeometry(1.1 + i * 0.42, 0.09, 8, 24, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xe89ab0, roughness: 0.4 })
    );
    ridge.rotation.x = -Math.PI / 2;
    ridge.rotation.z = Math.PI / 2;
    ridge.position.y = 0.4 + i * 0.1;
    ridge.scale.set(1, 1.25, 0.6);
    shell.add(ridge);
  }
  shell.position.set(-28, 4.4, 84);
  shell.rotation.x = -0.5;
  group.add(shell);

  // ---- perahu di laut ----
  function buildBoat(col) {
    const boat = new THREE.Group();
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-3.4, 0);
    hullShape.quadraticCurveTo(-2.6, -1.2, 0, -1.3);
    hullShape.quadraticCurveTo(2.6, -1.2, 3.4, 0);
    hullShape.lineTo(2.6, 0.7);
    hullShape.lineTo(-2.6, 0.7);
    hullShape.closePath();
    const hull = new THREE.Mesh(
      new THREE.ExtrudeGeometry(hullShape, { depth: 1.8, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15 }),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, envMapIntensity: 0.9 })
    );
    hull.rotation.y = Math.PI / 2;
    hull.position.z = -0.9;
    boat.add(hull);
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 4.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 })
    );
    mast.position.y = 2.6;
    boat.add(mast);
    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 0);
    sailShape.lineTo(0, 4);
    sailShape.lineTo(2.4, 0.4);
    sailShape.closePath();
    const sail = new THREE.Mesh(
      new THREE.ShapeGeometry(sailShape),
      new THREE.MeshStandardMaterial({ color: 0xfff2d8, side: THREE.DoubleSide, roughness: 0.8 })
    );
    sail.position.set(0.1, 0.6, 0);
    boat.add(sail);
    return boat;
  }
  const boatCols = [0xff7a5a, 0x4fc3ff, 0xffd23e];
  for (let i = 0; i < 3; i++) {
    const boat = buildBoat(boatCols[i]);
    boat.position.set(-215 - i * 18, 0.1, -20 + i * 42);
    boat.rotation.y = rand.next() * Math.PI;
    group.add(boat);
  }

  // ---- Pasar Malam: deretan kios beratap garis ----
  const stallCols = [0xd94a4a, 0x2a9a5a, 0x3a7ac2, 0xe08a2a];
  for (let i = 0; i < 5; i++) {
    const stall = new THREE.Group();
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 1.1, 2),
      new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.85 })
    );
    counter.position.y = 0.55;
    stall.add(counter);
    const awnTex = canvasTex(128, 64, (ctx, w, h) => {
      for (let s = 0; s < 8; s++) {
        ctx.fillStyle = s % 2 ? '#f2ead8' : stallCols[i % 4];
        ctx.fillRect((s * w) / 8, 0, w / 8, h);
      }
    });
    const awn = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.12, 2.6),
      new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.8 })
    );
    awn.position.set(0, 2.4, 0.2);
    awn.rotation.x = 0.18;
    stall.add(awn);
    for (const px of [-1.4, 1.4]) {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 })
      );
      pole.position.set(px, 1.2, 0.9);
      stall.add(pole);
    }
    const lamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xffe9a8, emissive: 0xffc46a, emissiveIntensity: 2 })
    );
    lamp.position.set(0, 2.2, 0.4);
    stall.add(lamp);
    stall.position.set(-56 + i * 7.5, 0, 100);
    stall.rotation.y = 0.12 * (i % 2 ? 1 : -1);
    group.add(stall);
  }
  neonSign(scene, 'PASAR MALAM', '#7dff5a', '#14250f', 12, 3, -38, 7.5, 96, 0);

  // ---- skyline berlapis di kejauhan ----
  const skyTex = canvasTex(256, 512, (ctx, w, h) => {
    ctx.fillStyle = '#4a3550';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 320; i++) {
      ctx.fillStyle = texRand() < 0.6 ? 'rgba(255,205,130,0.9)' : 'rgba(255,150,90,0.8)';
      ctx.fillRect(8 + texRand() * (w - 16), 20 + texRand() * (h - 40), 3, 4);
    }
  });
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, fog: true });
  for (let i = 0; i < 26; i++) {
    const ang = (i / 26) * Math.PI * 2 + rand.range(-0.08, 0.08);
    const r = rand.range(330, 430);
    const hh = rand.range(28, 95);
    const ww = rand.range(16, 34);
    const sil = new THREE.Mesh(new THREE.BoxGeometry(ww, hh, ww), skyMat);
    sil.position.set(Math.cos(ang) * r, hh / 2 - 2, Math.sin(ang) * r);
    group.add(sil);
  }

  // ---- burung di langit ----
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x2a1e28, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i++) {
    const bird = new THREE.Group();
    for (const s of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.32), birdMat);
      wing.position.x = s * 0.55;
      wing.rotation.z = s * 0.5;
      wing.rotation.y = s * 0.25;
      bird.add(wing);
    }
    bird.position.set(rand.range(-120, 120), rand.range(48, 85), rand.range(-160, -40));
    bird.rotation.y = rand.next() * Math.PI * 2;
    group.add(bird);
  }

  // ---- genangan reflektif di jalan ----
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x8a6a72, roughness: 0.06, metalness: 0.85, envMapIntensity: 2.2,
  });
  for (let i = 0; i < 14; i++) {
    const pud = new THREE.Mesh(new THREE.CircleGeometry(rand.range(1.2, 2.6), 20), puddleMat);
    pud.rotation.x = -Math.PI / 2;
    pud.position.set(rand.range(-160, 160), 0.045, rand.range(-130, 130));
    pud.scale.y = rand.range(0.5, 0.8);
    group.add(pud);
  }

  // ---- titik penting + jaringan jalan ----
  const v3 = (x, z) => new THREE.Vector3(x, 0, z);
  const playerStart = v3(28, 46);
  const net = {
    segments,
    roads: segments,
    blocks,
    districts: blocks.map((b) => b.district),
    districtOf,
    playerStart,
    startPoint: playerStart,
    spawnPoint: playerStart,
    start: playerStart,
    safehouse: v3(0, -104),
    safehouses: [v3(0, -104)],
    shops: [v3(-84, 104), v3(28, -20), v3(84, 56)],
    shopPoints: [v3(-84, 104), v3(28, -20), v3(84, 56)],
    weaponShop: v3(-84, 104),
    garage: v3(84, 0),
    hospital: v3(-28, -48),
    policeStation: v3(84, 56),
    missionPoints: [
      v3(28, -40), v3(-84, 104), v3(-56, -56), v3(84, 0),
      v3(28, 100), v3(-140, 56), v3(0, -104), v3(56, 56),
      v3(-28, 104), v3(140, -56),
    ],
    points: {
      playerStart, safehouse: v3(0, -104), weaponShop: v3(-84, 104),
      garage: v3(84, 0), hospital: v3(-28, -48), policeStation: v3(84, 56),
      lighthouse: v3(-186, -60), tuguKerang: v3(-28, 84), pasarMalam: v3(-38, 100),
    },
    landmarks: {
      lighthouse: v3(-186, -60), tuguKerang: v3(-28, 84), pasarMalam: v3(-38, 100),
      billboard: v3(20, -84), beach: v3(-176, 0),
    },
    bounds: { minX: -180, maxX: 180, minZ: -150, maxZ: 150 },
    size: 360,
    worldSize: 360,
  };
  return net;
}
