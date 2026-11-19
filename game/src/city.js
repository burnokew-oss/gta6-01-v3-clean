import 'three';
const THREE = window.THREE;

const ROAD_XS = [-400, -300, -200, -100, 0, 100, 200, 300, 400];
const ROAD_ZS = [-400, -300, -200, -100, 0, 100, 200, 300, 400];
const BLOCK_CENTERS = [-350, -250, -150, -50, 50, 150, 250, 350];
const PALETTE = ['#b85a3a', '#a03a3a', '#c88a2a', '#4a6a9a', '#2a7a6a', '#7a3a6a', '#c96a4a', '#8a5a9a', '#3a8a5a', '#d85a2a'];
const SKYLINE_COLORS = ['#3a3a55', '#55455a', '#2e3a5a', '#4a3a4a'];

function facadeTexture(base, litRatio) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(0,0,0,0.12)';
  g.fillRect(0, 0, 8, 256);
  g.fillRect(120, 0, 8, 256);
  g.fillStyle = 'rgba(255,255,255,0.10)';
  g.fillRect(0, 0, 128, 10);
  for (let r = 0; r < 8; r++) {
    for (let col = 0; col < 4; col++) {
      const lit = Math.random() < litRatio;
      g.fillStyle = lit ? '#ffd76a' : '#2a3248';
      g.fillRect(10 + col * 30, 14 + r * 30, 18, 16);
      if (lit) {
        g.fillStyle = 'rgba(255,215,106,0.25)';
        g.fillRect(8 + col * 30, 12 + r * 30, 22, 20);
      }
    }
  }
  return new THREE.CanvasTexture(c);
}

function signTexture(text, bg, fg) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, 512, 160);
  g.strokeStyle = fg;
  g.lineWidth = 6;
  g.strokeRect(8, 8, 496, 144);
  g.fillStyle = fg;
  g.font = 'bold 62px Arial';
  const tw = g.measureText(text).width;
  if (tw > 480) g.font = 'bold ' + Math.max(24, Math.floor(62 * 480 / tw)) + 'px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 256, 82);
  return new THREE.CanvasTexture(c);
}

function roadTexture(horizontal) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#363b46';
  g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = Math.random() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)';
    g.fillRect(Math.random() * 64, Math.random() * 256, 2, 2);
  }
  g.fillStyle = '#e8e8e8';
  if (horizontal) {
    g.fillRect(0, 4, 64, 2);
    g.fillRect(0, 58, 64, 2);
    g.fillStyle = '#ffd76a';
    for (let y = 8; y < 256; y += 32) g.fillRect(28, y, 8, 16);
  } else {
    g.fillRect(4, 0, 2, 256);
    g.fillRect(58, 0, 2, 256);
    g.fillStyle = '#ffd76a';
    for (let x = 8; x < 64; x += 32) g.fillRect(x, 28, 16, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function steamTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function resolveScene(state) {
  if (!state) return null;
  if (state.world && state.world.scene) return state.world.scene;
  if (state.scene) return state.scene;
  if (state.render && state.render.scene) return state.render.scene;
  if (state.game && state.game.scene) return state.game.scene;
  return null;
}

function buildCityMeshes(scene) {
  if (!scene || scene.userData.cityBuilt) return;
  scene.userData.cityBuilt = true;
  const neon = [];
  const palms = [];
  const steam = [];

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1000),
    new THREE.MeshLambertMaterial({ color: 0x5a4f45 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, 0);
  scene.add(ground);

  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 1000),
    new THREE.MeshLambertMaterial({ color: 0xe8cf9a })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-480, 0.01, 0);
  scene.add(sand);

  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 1000),
    new THREE.MeshStandardMaterial({ color: 0x14506e, roughness: 0.2, metalness: 0.6 })
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-620, 0.03, 0);
  scene.add(sea);

  const roadTexV = roadTexture(false);
  roadTexV.repeat.set(1, 7);
  const roadTexH = roadTexture(true);
  roadTexH.repeat.set(7, 1);
  const roadMatV = new THREE.MeshStandardMaterial({ map: roadTexV, roughness: 0.45, metalness: 0.3 });
  const roadMatH = new THREE.MeshStandardMaterial({ map: roadTexH, roughness: 0.45, metalness: 0.3 });
  for (const x of ROAD_XS) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(14, 900), roadMatV);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.05, 0);
    scene.add(strip);
  }
  for (const z of ROAD_ZS) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(900, 14), roadMatH);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.06, z);
    scene.add(strip);
  }

  const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
  for (const b of BLOCK_CENTERS.flatMap((cx) => BLOCK_CENTERS.map((cz) => ({ cx, cz })))) {
    const district = b.cz < -200 ? 'Perumahan' : b.cz > 200 ? 'Pelabuhan' : b.cx < -250 ? 'Marina' : b.cx > 0 ? 'CBD' : 'Kota Tua';
    const tall = district === 'CBD' ? 26 + Math.random() * 34 : district === 'Pelabuhan' ? 10 + Math.random() * 12 : 12 + Math.random() * 16;
    const w = 42 + Math.random() * 18;
    const d = 34 + Math.random() * 14;
    const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const tex = facadeTexture(color, district === 'CBD' ? 0.55 : 0.4);
    const mat = new THREE.MeshLambertMaterial({ map: tex });
    const mesh = new THREE.Mesh(buildingGeo, mat);
    mesh.scale.set(w, tall, d);
    mesh.position.set(b.cx, tall / 2, b.cz);
    scene.add(mesh);
    if (Math.random() < 0.45) {
      const w2 = 20 + Math.random() * 10;
      const d2 = 16 + Math.random() * 8;
      const h2 = 7 + Math.random() * 6;
      const color2 = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const mat2 = new THREE.MeshLambertMaterial({ map: facadeTexture(color2, 0.35) });
      const m2 = new THREE.Mesh(buildingGeo, mat2);
      m2.scale.set(w2, h2, d2);
      m2.position.set(b.cx + (w / 2 - w2 / 2) * (Math.random() < 0.5 ? -1 : 1), h2 / 2, b.cz + (d / 2 - d2 / 2) * (Math.random() < 0.5 ? -1 : 1));
      scene.add(m2);
    }
    if (Math.random() < 0.3) {
      const ac = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 3), new THREE.MeshLambertMaterial({ color: 0x8a8a8a }));
      ac.position.set(b.cx + w * 0.2, tall + 1, b.cz);
      scene.add(ac);
    }
  }

  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.2;
    const r = 520 + Math.random() * 160;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const h = 60 + Math.random() * 80;
    const w = 40 + Math.random() * 30;
    const color = SKYLINE_COLORS[i % SKYLINE_COLORS.length];
    const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshLambertMaterial({ color }));
    tower.position.set(x, h / 2, z);
    scene.add(tower);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffd76a });
    for (let k = 0; k < 5; k++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), winMat);
      win.position.set(x + (Math.random() - 0.5) * (w - 8), 10 + Math.random() * (h - 20), z + w / 2 + 0.1);
      win.lookAt(0, win.position.y, 0);
      scene.add(win);
    }
  }

  function addBillboard(text, bg, fg, x, z, faceSouth) {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 8), poleMat);
    p1.position.set(-8, 6, 0);
    group.add(p1);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 12, 8), poleMat);
    p2.position.set(8, 6, 0);
    group.add(p2);
    const tex = signTexture(text, bg, fg);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(24, 7.5), new THREE.MeshBasicMaterial({ map: tex }));
    panel.position.set(0, 14, 0);
    group.add(panel);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 9.5),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(bg), transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.set(0, 14, -0.3);
    group.add(glow);
    neon.push({ glow, phase: Math.random() * 6 });
    group.position.set(x, 0, z);
    if (!faceSouth) group.rotation.y = Math.PI;
    scene.add(group);
    return group;
  }
  addBillboard('TELUK CERAH', '#7a1e4a', '#ffd76a', -60, 64, true);
  addBillboard('KOPI TELUK', '#0e4a5a', '#7dffd8', 10, 136, false);
  addBillboard('FESTIVAL LAYANG-LAYANG', '#4a2a7a', '#ff9ec8', 80, 64, true);
  addBillboard('SALON CANTIK', '#a32a6e', '#ffe14d', -120, 136, false);

  const WARUNGS = [
    ['WARUNG SENJA', '#8a4a1e', '#ffe14d', -20, 91.5, 0],
    ['SATE TELUK', '#5a1e1e', '#ff9a5e', 60, 91.5, 0],
    ['LAUNDRY KILAT', '#1e4a6e', '#8ad8ff', -100, 91.5, 0],
    ['TOKO SENJA', '#2a5a2a', '#b8ffb8', 110, 91.5, 0],
    ['BAKSO TELUK', '#6e1e4a', '#ffb8d8', 30, 108.5, Math.PI],
    ['ES KELAPA', '#1e6e5a', '#c8ffe8', -40, 108.5, Math.PI],
    ['KOPI TELUK', '#4a2a1e', '#ffd8a0', 90, 108.5, Math.PI],
  ];
  for (const w of WARUNGS) {
    const tex = signTexture(w[0], w[1], w[2]);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.8), new THREE.MeshBasicMaterial({ map: tex }));
    sign.position.set(w[3], 3.6, w[4]);
    sign.rotation.y = w[5];
    scene.add(sign);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 3.8),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(w[2]), transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    glow.position.set(w[3], 3.6, w[4] + (w[5] === 0 ? -0.2 : 0.2));
    glow.rotation.y = w[5];
    scene.add(glow);
    neon.push({ glow, phase: Math.random() * 6 });
  }

  const MURAL_COLORS = ['#ff4fa3', '#4fd8ff', '#ffd76a', '#7dff9a'];
  for (let i = 0; i < 3; i++) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = MURAL_COLORS[i];
    g.fillRect(0, 0, 256, 128);
    g.fillStyle = MURAL_COLORS[(i + 1) % 4];
    g.beginPath();
    g.arc(70, 64, 44, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = MURAL_COLORS[(i + 2) % 4];
    g.fillRect(140, 20, 90, 88);
    g.fillStyle = '#ffffff';
    g.font = 'bold 26px Arial';
    g.textAlign = 'center';
    g.fillText(i === 0 ? 'TELUK' : i === 1 ? 'KERANG' : 'SENJA', 185, 68);
    const tex = new THREE.CanvasTexture(c);
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(18, 9), new THREE.MeshBasicMaterial({ map: tex }));
    const spots = [[-140, 88, 0], [140, 112, Math.PI], [-220, 112, Math.PI]];
    mural.position.set(spots[i][0], 5, spots[i][1]);
    mural.rotation.y = spots[i][2];
    scene.add(mural);
  }

  const palmTrunkMat = new THREE.MeshLambertMaterial({ color: 0x6a4a2a });
  const palmLeafMat = new THREE.MeshLambertMaterial({ color: 0x2f9e44, side: THREE.DoubleSide });
  function addPalm(x, z) {
    const group = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7, 8), palmTrunkMat);
    trunk.position.y = 3.5;
    group.add(trunk);
    for (let k = 0; k < 5; k++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.4), palmLeafMat);
      const a = (k / 5) * Math.PI * 2;
      leaf.position.set(Math.cos(a) * 1.8, 7.2, Math.sin(a) * 1.8);
      leaf.rotation.set(0.5, -a + Math.PI / 2, 0.6);
      group.add(leaf);
    }
    group.position.set(x, 0, z);
    group.userData.phase = Math.random() * 6;
    scene.add(group);
    palms.push(group);
    return group;
  }
  for (const rx of ROAD_XS) {
    for (let z = -400; z <= 400; z += 120) {
      if (Math.abs(rx) > 420) continue;
      if (Math.abs(z - 100) < 30 && rx >= 20 && rx <= 80) continue;
      const pzA = z + 20;
      const pzB = z - 20;
      if (pzA % 100 !== 0) addPalm(rx + 9.5, pzA);
      if (pzB % 100 !== 0) addPalm(rx - 9.5, pzB);
    }
  }
  for (let x = -120; x <= 120; x += 40) {
    if (x >= 20 && x <= 80) continue;
    addPalm(x, 88);
    addPalm(x + 20, 112);
  }

  const lampPoleMat = new THREE.MeshLambertMaterial({ color: 0x22242c });
  const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xffe9b0 });
  for (const rz of ROAD_ZS) {
    for (let x = -420; x <= 420; x += 100) {
      if (rz === 100 && x >= 30 && x <= 50) continue;
      const group = new THREE.Group();
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 7, 8), lampPoleMat);
      pole.position.y = 3.5;
      group.add(pole);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), lampHeadMat);
      head.position.y = 7.2;
      group.add(head);
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(4, 16),
        new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.y = 0.08;
      group.add(pool);
      group.position.set(x, 0, rz + 9.5);
      scene.add(group);
    }
  }

  const puddleMat = new THREE.MeshStandardMaterial({ color: 0x2a3a55, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.85 });
  const puddleSpots = [[-70, 97], [-30, 103], [0, 96], [25, 103], [55, 97], [85, 103], [-100, 102], [110, 98], [-45, 297], [15, 303]];
  for (const p of puddleSpots) {
    const pud = new THREE.Mesh(new THREE.CircleGeometry(2 + Math.random() * 2.5, 18), puddleMat);
    pud.rotation.x = -Math.PI / 2;
    pud.position.set(p[0], 0.07, p[1]);
    scene.add(pud);
  }

  const STREAK_COLORS = [0xff4fa3, 0x4fd8ff, 0xffc37a, 0x7dff9a];
  for (let i = 0; i < 8; i++) {
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(12 + Math.random() * 8, 0.7),
      new THREE.MeshBasicMaterial({ color: STREAK_COLORS[i % 4], transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(-80 + i * 26, 0.05, 100 + (i % 2 === 0 ? 2.5 : -2.5));
    scene.add(streak);
  }

  const steamTex = steamTexture();
  const ventMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
  const steamSpots = [[-60, 92], [20, 108], [100, 92], [-140, 108], [60, 308], [-20, 292]];
  for (const s of steamSpots) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 8), ventMat);
    vent.position.set(s[0], 0.4, s[1]);
    scene.add(vent);
    const puff = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, opacity: 0.3, depthWrite: false })
    );
    puff.position.set(s[0], 1.5, s[1]);
    puff.userData.baseY = 1.5;
    puff.userData.phase = Math.random();
    scene.add(puff);
    steam.push(puff);
  }

  const shellMat = new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: 0.25, metalness: 0.9 });
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 2.5, 12), new THREE.MeshLambertMaterial({ color: 0x8a7a6a }));
  pedestal.position.set(-60, 1.25, 92);
  scene.add(pedestal);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 12), shellMat);
  shell.scale.set(1, 0.55, 1.3);
  shell.position.set(-60, 3.6, 92);
  scene.add(shell);
  const shellGlow = new THREE.Mesh(
    new THREE.CircleGeometry(5, 20),
    new THREE.MeshBasicMaterial({ color: 0xffd76a, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  shellGlow.rotation.x = -Math.PI / 2;
  shellGlow.position.set(-60, 0.08, 92);
  scene.add(shellGlow);
  neon.push({ glow: shellGlow, phase: 1.2 });

  const lightMat = new THREE.MeshLambertMaterial({ color: 0xf2f2f2 });
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0xc23a3a });
  for (let i = 0; i < 5; i++) {
    const y = 2 + i * 3;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.6 - i * 0.12, 1.8 - i * 0.12, 3, 12), i % 2 === 0 ? lightMat : stripeMat);
    seg.position.set(-520, y, 150);
    scene.add(seg);
  }
  const lampRoom = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe9b0 }));
  lampRoom.position.set(-520, 17.5, 150);
  scene.add(lampRoom);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(6, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(-490, 17, 150);
  scene.add(beam);

  const boatColors = [0xc23a3a, 0xe8a33a, 0x2f9e8a, 0xf2f2f2, 0x3a6ad8];
  for (let i = 0; i < 5; i++) {
    const group = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(7, 1.2, 2.4), new THREE.MeshLambertMaterial({ color: boatColors[i] }));
    hull.position.y = 0.6;
    group.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 6), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
    mast.position.y = 3;
    group.add(mast);
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4), new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    sail.position.set(0.4, 3.4, 0);
    group.add(sail);
    group.position.set(-560 - i * 14, 0.1, -120 + i * 70);
    group.rotation.y = Math.random() * 0.6 - 0.3;
    scene.add(group);
  }

  const umbrellaColors = [0xff4fa3, 0x4fd8ff, 0xffd76a, 0x7dff9a, 0xff6a5e, 0xc9a0ff];
  for (let i = 0; i < 6; i++) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 6), new THREE.MeshLambertMaterial({ color: 0x6a4a2a }));
    pole.position.y = 1.5;
    group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 10), new THREE.MeshLambertMaterial({ color: umbrellaColors[i] }));
    top.position.y = 3.4;
    group.add(top);
    group.position.set(-478, 0, -150 + i * 60);
    scene.add(group);
  }

  const stallColors = [0xff4fa3, 0x4fd8ff, 0xffd76a, 0x7dff9a];
  for (let i = 0; i < 4; i++) {
    const x = 20 + i * 14;
    const stall = new THREE.Group();
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 3), new THREE.MeshLambertMaterial({ color: 0x8a5a3a }));
    counter.position.y = 0.6;
    stall.add(counter);
    const awn = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.2, 3.4), new THREE.MeshLambertMaterial({ color: stallColors[i] }));
    awn.position.y = 2.6;
    awn.rotation.x = 0.15;
    stall.add(awn);
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    pole1.position.set(-2.4, 1.3, 1.4);
    stall.add(pole1);
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 6), new THREE.MeshLambertMaterial({ color: 0x333333 }));
    pole2.position.set(2.4, 1.3, 1.4);
    stall.add(pole2);
    stall.position.set(x, 0, 318);
    scene.add(stall);
  }

  scene.userData.cityAnim = { neon, palms, steam };
}

export function ensureCityMeshes(state, sceneOverride) {
  const scene = sceneOverride || resolveScene(state);
  if (!scene) return;
  if (state && state.network) scene.userData.network = state.network;
  buildCityMeshes(scene);
}

export function buildCity(state) {
  const segments = [];
  for (const x of ROAD_XS) segments.push({ a: { x, z: -450 }, b: { x, z: 450 } });
  for (const z of ROAD_ZS) segments.push({ a: { x: -450, z }, b: { x: 450, z } });
  const blocks = [];
  for (const cx of BLOCK_CENTERS) {
    for (const cz of BLOCK_CENTERS) blocks.push({ cx, cz });
  }
  const points = {
    playerStart: new THREE.Vector3(40, 0, 104),
    safehouse: new THREE.Vector3(-50, 0, -320),
    garage: new THREE.Vector3(150, 0, 60),
    hospital: new THREE.Vector3(250, 0, -150),
    policeStation: new THREE.Vector3(200, 0, 150),
    market: new THREE.Vector3(40, 0, 320),
    monument: new THREE.Vector3(-60, 0, 92),
    missionPoints: [
      new THREE.Vector3(40, 0, 104),
      new THREE.Vector3(150, 0, 60),
      new THREE.Vector3(-150, 0, 260),
      new THREE.Vector3(200, 0, 150),
      new THREE.Vector3(40, 0, 320),
      new THREE.Vector3(0, 0, -320),
      new THREE.Vector3(-330, 0, 60),
      new THREE.Vector3(-150, 0, -150),
      new THREE.Vector3(-80, 0, 330),
      new THREE.Vector3(40, 0, 300),
    ],
  };
  const network = {
    segments,
    blocks,
    points,
    pointAt(x, z) {
      for (const rx of ROAD_XS) {
        if (Math.abs(x - rx) < 7) return { x: rx, z };
      }
      for (const rz of ROAD_ZS) {
        if (Math.abs(z - rz) < 7) return { x, z: rz };
      }
      return null;
    },
  };
  const city = { segments, blocks, points };
  state.city = city;
  state.network = network;
  const scene = resolveScene(state);
  if (scene) {
    scene.userData.network = network;
    buildCityMeshes(scene);
  } else {
    state._cityPending = true;
  }
  return city;
}

export const createCity = buildCity;

export function updateCity() {
}
