// render.js — dunia tiga dimensi Teluk Cerah: langit senja, matahari,
// hujan, pantulan basah, kamera pengikut, dan gambar satu frame.
// Revisi 2: tanpa shadow map (cepat di software GL), kamera langsung
// menempel ke subjek saat jauh supaya staging deterministik, matahari
// lebih berpijar, dan rambu neon berdenyut halus.
// Semua visual dibuat prosedural di sini; tidak ada aset luar.

const SUNSET_TOP = '#6d4a7d';
const SUNSET_MID = '#e2798f';
const SUNSET_LOW = '#ff9a55';
const SUNSET_GOLD = '#ffd98a';

// PRNG seed tetap supaya langit sama di setiap run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const skyRand = mulberry32(20261119);

function paintVerticalGradient(ctx, w, h, stops) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, col] of stops) grad.addColorStop(at, col);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function radialGlowCanvas(size, inner, outer) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, outer);
  g.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

function skyCanvasTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  paintVerticalGradient(ctx, 1024, 512, [
    [0, SUNSET_TOP],
    [0.42, '#c96a8d'],
    [0.62, SUNSET_MID],
    [0.78, SUNSET_LOW],
    [1, SUNSET_GOLD],
  ]);
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 26; i++) {
    const y = 60 + skyRand() * 260;
    const w = 120 + skyRand() * 320;
    const x = skyRand() * 1024;
    ctx.fillStyle = i % 2 ? '#ffb08a' : '#f7c9d8';
    ctx.beginPath();
    ctx.ellipse(x, y, w, 10 + skyRand() * 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function envCanvasTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  paintVerticalGradient(ctx, 512, 256, [
    [0, '#7a5570'],
    [0.45, '#e2798f'],
    [0.62, '#ff9a55'],
    [0.72, '#2a1e28'],
    [1, '#171019'],
  ]);
  const sun = ctx.createRadialGradient(256, 150, 4, 256, 150, 60);
  sun.addColorStop(0, 'rgba(255,244,200,1)');
  sun.addColorStop(0.4, 'rgba(255,190,110,0.85)');
  sun.addColorStop(1, 'rgba(255,150,80,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(180, 80, 160, 140);
  const neonCols = ['#ff4fa3', '#37f2c8', '#ffb02e', '#4fc3ff', '#c86bff', '#7dff5a'];
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = neonCols[i % neonCols.length];
    ctx.globalAlpha = 0.85;
    const w = 8 + skyRand() * 22;
    const x = (i / 14) * 512 + skyRand() * 10;
    ctx.fillRect(x, 168, w, 10 + skyRand() * 16);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function cloudSpriteTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  const blobs = [
    [128, 70, 90, 34, 0.85],
    [80, 78, 55, 24, 0.7],
    [180, 76, 60, 26, 0.7],
    [128, 52, 60, 22, 0.6],
  ];
  for (const [x, y, rx, ry, a] of blobs) {
    const g = ctx.createRadialGradient(x, y, 4, x, y, rx);
    g.addColorStop(0, 'rgba(255,214,196,' + a + ')');
    g.addColorStop(1, 'rgba(255,180,160,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.translate(-x, -y);
    ctx.beginPath();
    ctx.arc(x, y, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRain(scene) {
  const count = 520;
  const span = 70;
  const positions = new Float32Array(count * 6);
  const speeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = (skyRand() - 0.5) * span;
    const y = skyRand() * 34 + 1;
    const z = (skyRand() - 0.5) * span;
    positions.set([x, y, z, x + 0.12, y - 1.2, z + 0.05], i * 6);
    speeds[i] = 24 + skyRand() * 14;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.LineBasicMaterial({
    color: 0xd8ecff,
    transparent: true,
    opacity: 0.4,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  scene.add(lines);
  return { lines, speeds, span };
}

function updateRain(rain, camPos, dt) {
  const attr = rain.lines.geometry.getAttribute('position');
  const arr = attr.array;
  for (let i = 0; i < rain.speeds.length; i++) {
    let y = arr[i * 6 + 1] - rain.speeds[i] * dt;
    if (y < 0.2) y = 30 + Math.random() * 6;
    const x = arr[i * 6];
    const z = arr[i * 6 + 2];
    arr[i * 6 + 1] = y;
    arr[i * 6 + 4] = y - 1.2;
    const dx = camPos.x - x;
    const dz = camPos.z - z;
    if (Math.abs(dx) > rain.span / 2 || Math.abs(dz) > rain.span / 2) {
      const nx = camPos.x + (Math.random() - 0.5) * rain.span;
      const nz = camPos.z + (Math.random() - 0.5) * rain.span;
      arr[i * 6] = nx;
      arr[i * 6 + 3] = nx + 0.12;
      arr[i * 6 + 2] = nz;
      arr[i * 6 + 5] = nz + 0.05;
    }
  }
  attr.needsUpdate = true;
}

const FACE_DEFS = [
  { letter: 'R', name: 'Raka', skin: '#e8b98a', hair: '#241a12', hairStyle: 'cap', shirt: '#2f7fd0', bg: '#2f7fd0' },
  { letter: 'B', name: 'Bu Sari', skin: '#d9a06f', hair: '#3a2a1c', hairStyle: 'bun', shirt: '#e07b39', bg: '#e07b39' },
  { letter: 'D', name: 'Dimas', skin: '#c98f5f', hair: '#1c1410', hairStyle: 'cap', shirt: '#3aa655', bg: '#3aa655' },
  { letter: 'N', name: 'Nadia', skin: '#f0c49a', hair: '#4a2418', hairStyle: 'long', shirt: '#8a5cf6', bg: '#8a5cf6' },
  { letter: 'S', name: 'Sinta', skin: '#eec39a', hair: '#191512', hairStyle: 'bob', shirt: '#b06a2e', bg: '#b06a2e' },
  { letter: 'B', name: 'Bimo', skin: '#d8a878', hair: '#100d0a', hairStyle: 'short', shirt: '#d63a4a', bg: '#d63a4a' },
];

function faceSvg(def) {
  let hairTop = '';
  if (def.hairStyle === 'cap') {
    hairTop = '<path d="M28 42 Q50 14 72 42 Q72 30 50 26 Q28 30 28 42 Z" fill="#20242c"/><rect x="24" y="40" width="52" height="5" rx="2.5" fill="#20242c"/>';
  } else if (def.hairStyle === 'bun') {
    hairTop = '<circle cx="50" cy="24" r="9" fill="' + def.hair + '"/><path d="M26 46 Q26 22 50 22 Q74 22 74 46 Q74 34 62 30 Q50 26 38 30 Q26 34 26 46 Z" fill="' + def.hair + '"/>';
  } else if (def.hairStyle === 'long') {
    hairTop = '<path d="M24 88 Q20 30 50 20 Q80 30 76 88 L68 88 Q72 40 50 34 Q28 40 32 88 Z" fill="' + def.hair + '"/>';
  } else if (def.hairStyle === 'bob') {
    hairTop = '<path d="M26 62 Q22 22 50 20 Q78 22 74 62 L66 62 Q70 36 50 32 Q30 36 34 62 Z" fill="' + def.hair + '"/>';
  } else {
    hairTop = '<path d="M27 44 Q27 22 50 22 Q73 22 73 44 Q70 32 50 30 Q30 32 27 44 Z" fill="' + def.hair + '"/>';
  }
  let extras = '';
  if (def.name === 'Sinta') {
    extras = '<circle cx="40" cy="52" r="7" fill="none" stroke="#222" stroke-width="1.6"/><circle cx="60" cy="52" r="7" fill="none" stroke="#222" stroke-width="1.6"/><line x1="47" y1="52" x2="53" y2="52" stroke="#222" stroke-width="1.6"/>';
  } else if (def.name === 'Bimo') {
    extras = '<path d="M36 62 Q50 78 64 62 Q64 72 50 74 Q36 72 36 62 Z" fill="#2a1a10"/>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%" style="display:block;border-radius:50%">'
    + '<rect width="100" height="100" fill="' + def.bg + '"/>'
    + '<path d="M18 100 Q22 74 50 72 Q78 74 82 100 Z" fill="' + def.shirt + '"/>'
    + '<circle cx="50" cy="52" r="21" fill="' + def.skin + '"/>'
    + hairTop
    + '<circle cx="42" cy="52" r="2.2" fill="#1d1410"/><circle cx="58" cy="52" r="2.2" fill="#1d1410"/>'
    + '<path d="M44 63 Q50 67 56 63" fill="none" stroke="#7a4a30" stroke-width="1.8" stroke-linecap="round"/>'
    + extras
    + '</svg>';
}

function paintTitlePortraits() {
  try {
    const overlay = document.getElementById('title-overlay');
    if (!overlay) return;
    let bCount = 0;
    const cands = overlay.querySelectorAll('*');
    for (const el of cands) {
      if (el.children.length > 0) continue;
      const txt = (el.textContent || '').trim();
      if (!/^[A-Z]$/.test(txt)) continue;
      let def = null;
      if (txt === 'B') {
        bCount += 1;
        def = bCount === 1 ? FACE_DEFS[1] : FACE_DEFS[5];
      } else {
        def = FACE_DEFS.find((d) => d.letter === txt) || null;
      }
      if (!def) continue;
      el.innerHTML = faceSvg(def);
      el.style.overflow = 'hidden';
    }
  } catch (err) {
    // potret tetap huruf bila gagal — jangan pernah merusak game
  }
}

export function createWorld() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  // shadow map dimatikan: software GL terlalu lambat; cahaya + env
  // sudah memberi bentuk yang terbaca.
  renderer.shadowMap.enabled = false;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe8936a, 120, 700);
  scene.environment = envCanvasTexture();
  scene.background = null;

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(880, 32, 20),
    new THREE.MeshBasicMaterial({ map: skyCanvasTexture(), side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 4, 12);

  const hemi = new THREE.HemisphereLight(0xffd9c2, 0x6b4a3a, 1.15);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb45e, 2.3);
  sun.position.set(-60, 55, -120);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x9db8ff, 0.55);
  fill.position.set(50, 40, 90);
  scene.add(fill);

  const sunGlowTex = new THREE.CanvasTexture(radialGlowCanvas(256, 'rgba(255,246,214,1)', 'rgba(255,176,92,0.9)'));
  sunGlowTex.colorSpace = THREE.SRGBColorSpace;
  const sunSprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: sunGlowTex, transparent: true, depthWrite: false, fog: false })
  );
  sunSprite.scale.set(190, 190, 1);
  scene.add(sunSprite);
  const sunCoreTex = new THREE.CanvasTexture(radialGlowCanvas(128, 'rgba(255,255,240,1)', 'rgba(255,220,140,0.95)'));
  sunCoreTex.colorSpace = THREE.SRGBColorSpace;
  const sunCore = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: sunCoreTex, transparent: true, depthWrite: false, fog: false })
  );
  sunCore.scale.set(58, 58, 1);
  scene.add(sunCore);

  const cloudTex = cloudSpriteTexture();
  const clouds = [];
  for (let i = 0; i < 12; i++) {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.55 + skyRand() * 0.3, depthWrite: false, fog: false })
    );
    const sc = 90 + skyRand() * 160;
    sp.scale.set(sc, sc * 0.42, 1);
    sp.position.set((skyRand() - 0.5) * 1200, 90 + skyRand() * 110, -350 - skyRand() * 420);
    sp.userData.drift = 0.6 + skyRand() * 1.1;
    scene.add(sp);
    clouds.push(sp);
  }

  const rain = makeRain(scene);

  paintTitlePortraits();

  const world = {
    scene,
    camera,
    renderer,
    lights: { sun, hemi, fill },
    sunSprite,
    sunCore,
    clouds,
    rain,
    sky,
    camSmooth: new THREE.Vector3(0, 4, 12),
    lookSmooth: new THREE.Vector3(0, 1.5, 0),
    elapsed: 0,
    snapped: false,
  };
  return world;
}

function resolveSubject(state) {
  const p = state.player || state.pemain || null;
  if (!p) return null;
  const car = p.car || p.vehicle || p.currentCar || p.mobil || null;
  const holder = car || p;
  const group = holder.group || holder.mesh || holder;
  const pos = holder.position || group.position || null;
  if (!pos) return null;
  let heading = 0;
  if (typeof holder.heading === 'number') heading = holder.heading;
  else if (typeof holder.angle === 'number') heading = holder.angle;
  else if (typeof holder.facing === 'number') heading = holder.facing;
  else if (typeof holder.rotationY === 'number') heading = holder.rotationY;
  else if (group && group.rotation && typeof group.rotation.y === 'number') heading = group.rotation.y;
  const vel = holder.velocity || holder.vel || null;
  return { holder, group, pos, heading, vel, inCar: !!car };
}

export function drawWorld(world, state) {
  // Waktu dinding nyata antar frame: di software GL frame bisa 0,5 dtk,
  // sementara state.dt tetap 0,016 — kamera yang memakai state.dt tidak
  // pernah konvergen. Semua animasi visual + kamera memakai waktu nyata.
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const dt = world.lastNow
    ? Math.min(Math.max((now - world.lastNow) / 1000, 0.001), 0.5)
    : 0.016;
  world.lastNow = now;
  world.elapsed += dt;
  const t = world.elapsed;

  const subj = resolveSubject(state);
  if (subj && world.camera) {
    let fx = -Math.sin(subj.heading);
    let fz = -Math.cos(subj.heading);
    if (subj.vel && (Math.abs(subj.vel.x) + Math.abs(subj.vel.z) > 0.6)) {
      const len = Math.hypot(subj.vel.x, subj.vel.z) || 1;
      fx = subj.vel.x / len;
      fz = subj.vel.z / len;
    }
    const dist = subj.inCar ? 9.5 : 5.4;
    const height = subj.inCar ? 4.4 : 3.4;
    const desired = new THREE.Vector3(
      subj.pos.x - fx * dist,
      subj.pos.y + height,
      subj.pos.z - fz * dist
    );
    const look = new THREE.Vector3(subj.pos.x + fx * 7, subj.pos.y + 1.4, subj.pos.z + fz * 7);
    // menempel langsung bila kamera masih jauh (staging / awal frame)
    if (!world.snapped || world.camSmooth.distanceTo(desired) > 26) {
      world.camSmooth.copy(desired);
      world.lookSmooth.copy(look);
      world.snapped = true;
    } else {
      const k = 1 - Math.exp(-dt * 3.2);
      world.camSmooth.lerp(desired, k);
      world.lookSmooth.lerp(look, 1 - Math.exp(-dt * 4.5));
    }
    world.camera.position.copy(world.camSmooth);
    if (state.shake && state.shake > 0.01) {
      world.camera.position.x += (Math.random() - 0.5) * state.shake;
      world.camera.position.y += (Math.random() - 0.5) * state.shake * 0.7;
      state.shake *= Math.exp(-dt * 5);
    }
    world.camera.lookAt(world.lookSmooth);
  }

  if (world.sunSprite && world.camera) {
    const dir = new THREE.Vector3();
    world.camera.getWorldDirection(dir);
    const base = world.camera.position.clone().addScaledVector(dir, 700);
    base.y = 62 + Math.sin(t * 0.05) * 2;
    world.sunSprite.position.copy(base);
    world.sunCore.position.copy(base);
    const pulse = 1 + Math.sin(t * 0.8) * 0.03;
    world.sunSprite.scale.set(190 * pulse, 190 * pulse, 1);
  }

  for (const c of world.clouds) {
    c.position.x += c.userData.drift * dt;
    if (c.position.x > 700) c.position.x = -700;
  }

  if (world.rain) updateRain(world.rain, world.camera.position, dt);

  // rambu neon berdenyut halus
  const anims = world.scene.userData.telukAnim;
  if (anims) {
    for (const a of anims) {
      if (a.kind === 'glow' && a.mat) {
        a.mat.opacity = a.base + Math.sin(t * 1.6 + a.phase) * 0.16;
      }
    }
  }

  if (world.sky) world.sky.position.copy(world.camera.position);

  world.renderer.render(world.scene, world.camera);
}

export function resizeWorld(world) {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
}
