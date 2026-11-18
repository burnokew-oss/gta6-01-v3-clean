// Teluk Cerah — pembuatan dunia tiga dimensi.
// Menyiapkan scene, kamera, renderer, dan lampu; menggambar satu frame;
// menyesuaikan ukuran saat jendela berubah.

import * as ThreeModule from 'three';
import { CONFIG } from './config.js';

const THREE = (ThreeModule && ThreeModule.Scene)
  ? ThreeModule
  : globalThis.THREE;
if (!THREE || !THREE.Scene) {
  throw new Error('three.js belum termuat: periksa game/vendor/three.min.js');
}

const NIGHT = {
  sky: new THREE.Color(CONFIG.colors.skyNight),
  fog: new THREE.Color(CONFIG.colors.fogNight),
  hemiSky: new THREE.Color(0x2a3a5f),
  hemiGround: new THREE.Color(0x0a0c12),
  hemiIntensity: 0.58,
  moonColor: new THREE.Color(0x8fb0ff),
  moonIntensity: 0.5,
};

const DAY = {
  sky: new THREE.Color(CONFIG.colors.skyDay),
  fog: new THREE.Color(CONFIG.colors.fogDay),
  hemiSky: new THREE.Color(0xbfd9ff),
  hemiGround: new THREE.Color(0x5a5a48),
  hemiIntensity: 1.0,
  moonColor: new THREE.Color(0xfff2d0),
  moonIntensity: 1.1,
};

function mixColor(target, a, b, t) {
  target.copy(a).lerp(b, t);
}

export function createWorld() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.colors.skyNight);
  scene.fog = new THREE.FogExp2(CONFIG.colors.fogNight, 0.0032);

  const camera = new THREE.PerspectiveCamera(
    CONFIG.camera.fov,
    window.innerWidth / Math.max(1, window.innerHeight),
    CONFIG.camera.near,
    CONFIG.camera.far,
  );
  camera.position.set(188, 4, -140);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('SRGBColorSpace' in THREE) renderer.outputColorSpace = THREE.SRGBColorSpace;
  if ('ACESFilmicToneMapping' in THREE) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  }
  const host = document.getElementById('game-container') || document.body;
  const canvas = renderer.domElement;
  canvas.id = 'game-canvas';
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.zIndex = '0';
  host.appendChild(canvas);

  // Lampu: langit malam yang redup + bulan sebagai sumber bayangan.
  const hemi = new THREE.HemisphereLight(NIGHT.hemiSky, NIGHT.hemiGround, NIGHT.hemiIntensity);
  scene.add(hemi);

  const moon = new THREE.DirectionalLight(NIGHT.moonColor, NIGHT.moonIntensity);
  moon.position.set(120, 220, -80);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -130;
  moon.shadow.camera.right = 130;
  moon.shadow.camera.top = 130;
  moon.shadow.camera.bottom = -130;
  moon.shadow.camera.near = 20;
  moon.shadow.camera.far = 600;
  moon.shadow.bias = -0.0004;
  scene.add(moon);
  scene.add(moon.target);

  const ambient = new THREE.AmbientLight(0x223044, 0.35);
  scene.add(ambient);

  // Cahaya isi hangat yang mengikuti pemain supaya area sekitarnya selalu
  // terbaca di malam hari, tanpa perlu puluhan lampu titik.
  const followLight = new THREE.PointLight(0xffc98a, 0.35, 42, 1.4);
  followLight.position.set(0, 10, 0);
  scene.add(followLight);

  // Bintang-bintang redup di langit malam.
  const starCount = 420;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const e = Math.random() * Math.PI * 0.42 + 0.08;
    const r = 850;
    starPos[i * 3] = Math.cos(a) * Math.cos(e) * r;
    starPos[i * 3 + 1] = Math.sin(e) * r;
    starPos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({ color: 0xcdd8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.75, fog: false });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Bulan purnama: piringan terang + halo tipis.
  const moonDisc = new THREE.Mesh(
    new THREE.CircleGeometry(26, 32),
    new THREE.MeshBasicMaterial({ color: 0xe8eefc, fog: false }),
  );
  moonDisc.position.set(-260, 300, -620);
  moonDisc.lookAt(0, 0, 0);
  scene.add(moonDisc);
  const moonHalo = new THREE.Mesh(
    new THREE.CircleGeometry(44, 32),
    new THREE.MeshBasicMaterial({ color: 0x8fa8d8, transparent: true, opacity: 0.16, fog: false }),
  );
  moonHalo.position.set(-260, 300, -625);
  moonHalo.lookAt(0, 0, 0);
  scene.add(moonHalo);

  // Hujan ringan: segmen garis jatuh di dalam kotak yang mengikuti kamera.
  const dropCount = CONFIG.weather.rainDrops;
  const rainPos = new Float32Array(dropCount * 2 * 3);
  const drops = [];
  for (let i = 0; i < dropCount; i++) {
    drops.push({
      x: (Math.random() - 0.5) * CONFIG.weather.rainArea,
      y: Math.random() * CONFIG.weather.rainHeight,
      z: (Math.random() - 0.5) * CONFIG.weather.rainArea,
      speed: 26 + Math.random() * 10,
      len: 0.9 + Math.random() * 0.7,
    });
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0x9db8d8, transparent: true, opacity: 0.26 });
  const rain = new THREE.LineSegments(rainGeo, rainMat);
  rain.frustumCulled = false;
  scene.add(rain);

  return {
    scene,
    camera,
    renderer,
    lights: { hemi, moon, ambient, followLight },
    stars,
    moonDisc,
    moonHalo,
    rain: { mesh: rain, geo: rainGeo, pos: rainPos, drops },
    focus: new THREE.Vector3(0, 1.5, 0),
    camPos: new THREE.Vector3(188, 4, -140),
    elapsed: 0,
  };
}

function daylightFactor(hour) {
  // 0 di tengah malam, 1 di tengah hari; transisi halus saat fajar/senja.
  const h = ((hour % 24) + 24) % 24;
  if (h >= 6 && h <= 18) {
    const t = (h - 6) / 12;
    return Math.sin(t * Math.PI);
  }
  if (h > 18 && h < 20) return 1 - (h - 18) / 2;
  if (h >= 4 && h < 6) return (h - 4) / 2;
  return 0;
}

function applyTimeOfDay(world, state) {
  const hour = state && state.clock && typeof state.clock.hour === 'number'
    ? state.clock.hour
    : CONFIG.time.startHour;
  const day = daylightFactor(hour);
  const { scene, lights } = world;
  mixColor(scene.background, NIGHT.sky, DAY.sky, day);
  mixColor(scene.fog.color, NIGHT.fog, DAY.fog, day);
  mixColor(lights.hemi.color, NIGHT.hemiSky, DAY.hemiSky, day);
  mixColor(lights.hemi.groundColor, NIGHT.hemiGround, DAY.hemiGround, day);
  lights.hemi.intensity = NIGHT.hemiIntensity + (DAY.hemiIntensity - NIGHT.hemiIntensity) * day;
  mixColor(lights.moon.color, NIGHT.moonColor, DAY.moonColor, day);
  lights.moon.intensity = NIGHT.moonIntensity + (DAY.moonIntensity - NIGHT.moonIntensity) * day;
  lights.ambient.intensity = 0.35 + 0.25 * day;
  world.stars.material.opacity = 0.75 * (1 - day);
  world.stars.visible = day < 0.85;
  world.moonDisc.material.opacity = 1;
  world.moonDisc.visible = day < 0.9;
  world.moonHalo.visible = day < 0.9;
  return day;
}

function updateRain(world, state, dt) {
  const { mesh, geo, pos, drops } = world.rain;
  const intensity = state && state.weather && typeof state.weather.rainIntensity === 'number'
    ? state.weather.rainIntensity
    : CONFIG.weather.rainIntensity;
  mesh.visible = intensity > 0.02;
  if (!mesh.visible) return;
  mesh.material.opacity = 0.1 + 0.2 * intensity;
  const cx = world.focus.x;
  const cz = world.focus.z;
  const area = CONFIG.weather.rainArea;
  const height = CONFIG.weather.rainHeight;
  for (let i = 0; i < drops.length; i++) {
    const d = drops[i];
    d.y -= d.speed * dt;
    if (d.y < 0) {
      d.y = height;
      d.x = (Math.random() - 0.5) * area;
      d.z = (Math.random() - 0.5) * area;
    }
    const wx = cx + d.x;
    const wz = cz + d.z;
    pos[i * 6] = wx;
    pos[i * 6 + 1] = d.y + d.len;
    pos[i * 6 + 2] = wz;
    pos[i * 6 + 3] = wx;
    pos[i * 6 + 4] = d.y;
    pos[i * 6 + 5] = wz;
  }
  geo.attributes.position.needsUpdate = true;
}

function readHeading(entity) {
  if (!entity) return 0;
  if (typeof entity.heading === 'number') return entity.heading;
  if (entity.group && typeof entity.group.rotation === 'object') return entity.group.rotation.y || 0;
  if (typeof entity.rotationY === 'number') return entity.rotationY;
  return 0;
}

function readPosition(entity, out) {
  if (!entity) return false;
  const p = entity.position || entity.pos || null;
  if (!p) return false;
  out.set(p.x || 0, p.y || 0, p.z || 0);
  return true;
}

export function drawWorld(world, state) {
  // Terima tiga bentuk pemanggilan: (world, state), (null, state), dan
  // (state) saja — bila argumen pertama ternyata keadaan bersama (punya
  // field world tapi bukan renderer), pakai dunia dari dalamnya.
  if (state === undefined && world && world.world) {
    state = world;
    world = world.world;
  }
  // Dunia boleh datang dari argumen pertama, atau dari keadaan bersama
  // (state.world) bila pemanggil hanya meneruskan state.
  world = world || (state && state.world) || null;
  if (!world || !world.renderer) return;
  let dt = state && typeof state.dt === 'number' ? Math.min(state.dt, 0.05) : 0.016;
  if (!Number.isFinite(dt) || dt <= 0) dt = 0.016;
  world.elapsed += dt;
  applyTimeOfDay(world, state);

  const cam = world.camera;
  const mode = state && state.mode ? state.mode : 'play';
  // Mode shot: staging shot sudah memosisikan kamera lewat world.camera dan
  // menandai state.shotCamera / state.cameraMode = 'shot'. Jangan pernah
  // menimpa kamera di mode ini; cukup arahkan cahaya mengikuti kameranya.
  const shotActive = !!state && (state.shotCamera === true || state.cameraMode === 'shot');
  const tmp = new THREE.Vector3();

  if (shotActive) {
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    world.focus.copy(cam.position).addScaledVector(dir, 26);
    world.focus.y = Math.max(1.2, world.focus.y);
  } else if (mode === 'map') {
    // Peta layar penuh: kamera tegak lurus dari atas pusat kota.
    world.focus.set(0, 0, 0);
    cam.position.set(0, 430, 0.5);
    cam.lookAt(0, 0, 0);
    cam.up.set(0, 0, -1);
  } else if (mode === 'title' || !state || !state.player) {
    // Layar judul: dolly pelan menyusuri avenue CBD di ketinggian jalan.
    const dolly = CONFIG.titleDolly;
    const span = dolly.zMax - dolly.zMin;
    const z = dolly.zMin + ((world.elapsed * dolly.speed) % span + span) % span;
    world.focus.set(dolly.avenueX, 2.2, z + 26);
    tmp.set(dolly.avenueX + Math.sin(world.elapsed * 0.12) * 3, dolly.height, z);
    world.camPos.lerp(tmp, 1 - Math.exp(-dt * 2));
    cam.position.copy(world.camPos);
    cam.lookAt(world.focus);
    cam.up.set(0, 1, 0);
  } else {
    // Bermain: kamera mengikuti dari belakang pemain atau mobilnya.
    const player = state.player;
    const vehicle = player.car || null;
    const subject = vehicle || player;
    if (readPosition(subject, tmp)) {
      world.focus.copy(tmp);
      world.focus.y += 1.4;
    }
    const heading = readHeading(vehicle || player);
    // Arah hadap mengikuti konvensi three.js: depan objek adalah -Z lokal.
    const fx = -Math.sin(heading);
    const fz = -Math.cos(heading);
    const dist = vehicle ? CONFIG.camera.chaseDistance : CONFIG.camera.onFootDistance;
    const height = vehicle ? CONFIG.camera.chaseHeight : CONFIG.camera.onFootHeight;
    tmp.set(
      world.focus.x - fx * dist,
      world.focus.y + height,
      world.focus.z - fz * dist,
    );
    const blend = 1 - Math.exp(-dt * CONFIG.camera.smooth);
    world.camPos.lerp(tmp, blend);
    cam.position.copy(world.camPos);
    const look = new THREE.Vector3(
      world.focus.x + fx * CONFIG.camera.lookAhead,
      world.focus.y + 0.6,
      world.focus.z + fz * CONFIG.camera.lookAhead,
    );
    cam.lookAt(look);
    cam.up.set(0, 1, 0);
    // FOV melebar sedikit saat mobil melaju kencang.
    const speed = vehicle && typeof vehicle.speed === 'number' ? vehicle.speed : 0;
    const targetFov = CONFIG.camera.fov + Math.min(9, Math.max(0, speed - 60) * 0.09);
    if (Math.abs(cam.fov - targetFov) > 0.05) {
      cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 3);
      cam.updateProjectionMatrix();
    }
  }

  // Guncangan layar saat combat (state.shake 0..1 dari modul combat).
  if (state && state.shake > 0.01) {
    cam.position.x += (Math.random() - 0.5) * state.shake * 0.5;
    cam.position.y += (Math.random() - 0.5) * state.shake * 0.35;
  }

  // Bayangan bulan mengikuti titik fokus supaya tetap tajam di sekitar pemain.
  world.lights.moon.position.set(world.focus.x + 120, 220, world.focus.z - 80);
  world.lights.moon.target.position.copy(world.focus);
  world.lights.moon.target.updateMatrixWorld();
  // Cahaya isi menempel di kamera (bukan di titik fokus) supaya tidak ada
  // genangan terang yang mengambang di tengah jalan di depan kamera.
  world.lights.followLight.position.set(cam.position.x, cam.position.y + 6, cam.position.z);

  // Pengaman: bila posisi kamera pernah menjadi NaN (misalnya dt rusak dari
  // pemanggil), kembalikan ke titik pandang avenue yang aman daripada
  // menampilkan layar hitam tanpa error.
  if (!Number.isFinite(cam.position.x) || !Number.isFinite(cam.position.y) || !Number.isFinite(cam.position.z)) {
    cam.position.set(CONFIG.titleDolly.avenueX, CONFIG.titleDolly.height, CONFIG.titleDolly.zMin);
    world.camPos.copy(cam.position);
  }

  updateRain(world, state, dt);
  world.renderer.render(world.scene, cam);
}

export function resizeWorld(world) {
  if (world && !world.renderer && world.world) world = world.world;
  if (!world || !world.renderer || !world.camera) return;
  const w = window.innerWidth;
  const h = Math.max(1, window.innerHeight);
  world.camera.aspect = w / h;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(w, h);
}
