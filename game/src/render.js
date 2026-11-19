import 'three';
const THREE = window.THREE;
import { ensureCityMeshes } from './city.js';

const GOLD_TOP = '#2e3a7a';
const GOLD_MID = '#e0705c';
const GOLD_LOW = '#ff8a3a';
const DUSK_TOP = '#232a55';
const DUSK_MID = '#b06a8e';
const DUSK_LOW = '#ff9e66';

function skyTexture(top, mid, low) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 512;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, top);
  grad.addColorStop(0.45, mid);
  grad.addColorStop(0.72, low);
  grad.addColorStop(1, '#ffb36b');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 512);
  return new THREE.CanvasTexture(c);
}

function makeRain() {
  const count = 460;
  const pos = new Float32Array(count * 6);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 90;
    const y = Math.random() * 34;
    const z = (Math.random() - 0.5) * 90;
    pos[i * 6] = x;
    pos[i * 6 + 1] = y;
    pos[i * 6 + 2] = z;
    pos[i * 6 + 3] = x + 0.4;
    pos[i * 6 + 4] = y - 1.8;
    pos[i * 6 + 5] = z;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xd8e8ff, transparent: true, opacity: 0.55 });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  return lines;
}

function makeSplashes(scene) {
  const group = new THREE.Group();
  const items = [];
  const geo = new THREE.RingGeometry(0.12, 0.2, 20);
  for (let i = 0; i < 46; i++) {
    const m = new THREE.MeshBasicMaterial({ color: 0xdfeeff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(geo, m);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set((Math.random() - 0.5) * 160, 0.06, 96 + (Math.random() - 0.5) * 26);
    ring.userData.phase = Math.random();
    group.add(ring);
    items.push(ring);
  }
  scene.add(group);
  return items;
}

function makeClouds(scene, tex) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, depthWrite: false });
  for (let i = 0; i < 9; i++) {
    const w = 90 + Math.random() * 130;
    const h = 16 + Math.random() * 14;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    plane.position.set(-500 + Math.random() * 1000, 150 + Math.random() * 70, -260 + Math.random() * 420);
    plane.userData.speed = 0.6 + Math.random() * 1.1;
    group.add(plane);
  }
  scene.add(group);
  return group;
}

function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 256, 64);
  for (let i = 0; i < 14; i++) {
    const x = 20 + Math.random() * 216;
    const y = 22 + Math.random() * 22;
    const r = 12 + Math.random() * 20;
    const grad = g.createRadialGradient(x, y, 2, x, y, r);
    grad.addColorStop(0, 'rgba(255,235,220,0.85)');
    grad.addColorStop(1, 'rgba(255,235,220,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

function makeBirds(scene) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2a2438 });
  for (let i = 0; i < 6; i++) {
    const bird = new THREE.Group();
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.3), mat);
    w1.rotation.z = 0.5;
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.3), mat);
    w2.rotation.z = -0.5;
    bird.add(w1);
    bird.add(w2);
    bird.position.set(-260 + i * 90, 95 + Math.random() * 45, -120 + Math.random() * 220);
    bird.userData.speed = 5 + Math.random() * 4;
    bird.userData.phase = Math.random() * 6;
    group.add(bird);
  }
  scene.add(group);
  return group;
}

export function createWorld() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas || undefined, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if ('toneMapping' in renderer && THREE.ACESFilmicToneMapping !== undefined) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
  }
  if (!canvas) {
    const holder = document.getElementById('game-container') || document.body;
    holder.appendChild(renderer.domElement);
  }
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdd8855, 160, 700);
  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 2200);
  camera.position.set(60, 6, 120);

  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x4a3a30, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb36b, 1.2);
  sun.position.set(-160, 70, 90);
  scene.add(sun);
  const amb = new THREE.AmbientLight(0xffe2c4, 0.25);
  scene.add(amb);
  const fill = new THREE.DirectionalLight(0x9fb4ff, 0.7);
  fill.position.set(120, 80, -140);
  scene.add(fill);

  const goldenTex = skyTexture(GOLD_TOP, GOLD_MID, GOLD_LOW);
  const duskTex = skyTexture(DUSK_TOP, DUSK_MID, DUSK_LOW);
  const domeGeo = new THREE.SphereGeometry(980, 24, 16);
  const goldenDome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ map: goldenTex, side: THREE.BackSide, fog: false }));
  const duskDome = new THREE.Mesh(domeGeo, new THREE.MeshBasicMaterial({ map: duskTex, side: THREE.BackSide, fog: false }));
  duskDome.visible = false;
  scene.add(goldenDome);
  scene.add(duskDome);

  const sunDisc = new THREE.Mesh(
    new THREE.CircleGeometry(45, 32),
    new THREE.MeshBasicMaterial({ color: 0xffc93a, transparent: true, opacity: 0.95, fog: false })
  );
  sunDisc.position.set(-640, 40, 100);
  sunDisc.lookAt(camera.position);
  scene.add(sunDisc);
  const sunHalo = new THREE.Mesh(
    new THREE.CircleGeometry(120, 32),
    new THREE.MeshBasicMaterial({ color: 0xffc37a, transparent: true, opacity: 0.22, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  sunHalo.position.set(-645, 40, 100);
  sunHalo.lookAt(camera.position);
  scene.add(sunHalo);

  const clouds = makeClouds(scene, cloudTexture());
  const birds = makeBirds(scene);
  const rain = makeRain();
  scene.add(rain);
  const splashes = makeSplashes(scene);

  const world = {
    scene, camera, renderer,
    lights: { hemi, sun, amb, fill },
    goldenDome, duskDome, sunDisc, sunHalo, clouds, birds, rain, splashes,
    elapsed: 0, lastNow: performance.now(), rainSeed: [],
  };
  const posAttr = rain.geometry.getAttribute('position');
  for (let i = 0; i < 460; i++) {
    world.rainSeed.push({ x: posAttr.getX(i * 2), y: posAttr.getY(i * 2), z: posAttr.getZ(i * 2) });
  }
  return world;
}

function shotOf(state) {
  return (state && state.shotName) || '';
}

function heroCarOf(state) {
  if (state && state.player && state.player.car) return state.player.car;
  return null;
}

function updateCamera(world, state, dt) {
  const camera = world.camera;
  const shot = shotOf(state);
  const player = state && state.player;
  const car = heroCarOf(state);
  const t = world.elapsed;
  if (shot === 'map') {
    camera.position.set(0, 420, 320);
    camera.lookAt(0, 0, 0);
    if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); }
    return;
  }
  if (shot === 'title') {
    const px = 96 + Math.sin(t * 0.05) * 5;
    camera.position.set(px, 6.5, 116);
    camera.lookAt(15, 2.5, 98);
    if (camera.fov !== 58) { camera.fov = 58; camera.updateProjectionMatrix(); }
    return;
  }
  if (car && car.group) {
    const gp = car.group.position;
    const h = car.heading || 0;
    const fx = Math.sin(h);
    const fz = Math.cos(h);
    const back = shot === 'chase' ? 5.0 : 7.4;
    const height = shot === 'chase' ? 2.4 : 3.5;
    const tx = gp.x - fx * back;
    const tz = gp.z - fz * back;
    if (shot === 'chase') {
      camera.position.set(tx, height, tz);
    } else {
      camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 7);
      camera.position.y += (height - camera.position.y) * Math.min(1, dt * 7);
      camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 7);
    }
    camera.lookAt(gp.x + fx * 9, shot === 'chase' ? 2.2 : 1.05, gp.z + fz * 9);
    const wantFov = shot === 'chase' ? 64 : 58;
    if (camera.fov !== wantFov) { camera.fov = wantFov; camera.updateProjectionMatrix(); }
    return;
  }
  if (player && player.group) {
    const gp = player.group.position;
    const h = player.heading || 0;
    const fx = Math.sin(h);
    const fz = Math.cos(h);
    const back = shot === 'shootout' ? 6.5 : 5.0;
    const height = shot === 'shootout' ? 3.4 : 3.0;
    camera.position.set(gp.x - fx * back, height, gp.z - fz * back);
    camera.lookAt(gp.x + fx * 7, 1.5, gp.z + fz * 7);
    if (camera.fov !== 58) { camera.fov = 58; camera.updateProjectionMatrix(); }
    return;
  }
  camera.position.set(60, 8, 130);
  camera.lookAt(0, 2, 100);
}

function animateSky(world, state, dt) {
  const t = world.elapsed;
  const shot = shotOf(state);
  const dusk = shot === 'shootout';
  world.goldenDome.visible = !dusk;
  world.duskDome.visible = dusk;
  if (dusk) {
    world.scene.fog.color.setHex(0x9a7bb8);
    world.scene.fog.near = 80;
    world.scene.fog.far = 560;
    world.lights.sun.intensity = 1.0;
    world.lights.sun.color.setHex(0xff9e7a);
    world.lights.hemi.intensity = 0.7;
    world.lights.hemi.color.setHex(0xc9a0d8);
    world.lights.amb.intensity = 0.4;
    world.sunDisc.material.opacity = 0.55;
    world.sunHalo.material.opacity = 0.15;
  } else {
    world.scene.fog.color.setHex(0xdd8855);
    world.scene.fog.near = 160;
    world.scene.fog.far = 700;
    world.lights.sun.intensity = 1.2;
    world.lights.sun.color.setHex(0xffb36b);
    world.lights.hemi.intensity = 0.55;
    world.lights.hemi.color.setHex(0xffd9b0);
    world.lights.amb.intensity = 0.25;
    world.sunDisc.material.opacity = 0.95;
    world.sunHalo.material.opacity = 0.22;
  }
  for (const cloud of world.clouds.children) {
    cloud.position.x += cloud.userData.speed * dt;
    if (cloud.position.x > 620) cloud.position.x = -620;
  }
  for (const bird of world.birds.children) {
    bird.position.x += bird.userData.speed * dt;
    bird.position.y += Math.sin(t * 1.4 + bird.userData.phase) * dt * 1.5;
    if (bird.position.x > 420) bird.position.x = -420;
    bird.rotation.y = -Math.PI / 2;
  }
  const rain = world.rain;
  const attr = rain.geometry.getAttribute('position');
  const cam = world.camera.position;
  for (let i = 0; i < world.rainSeed.length; i++) {
    const s = world.rainSeed[i];
    s.y -= 30 * dt;
    if (s.y < 0) {
      s.y = 30 + Math.random() * 4;
      s.x = cam.x + (Math.random() - 0.5) * 90;
      s.z = cam.z + (Math.random() - 0.5) * 90;
    }
    attr.setXYZ(i * 2, s.x, s.y, s.z);
    attr.setXYZ(i * 2 + 1, s.x + 0.4, s.y - 1.8, s.z);
  }
  attr.needsUpdate = true;
  const roadZ = shot === 'shootout' ? 300 : 100;
  for (const ring of world.splashes) {
    if (Math.abs(ring.position.x - cam.x) > 70) {
      ring.position.x = cam.x + (Math.random() - 0.5) * 130;
      ring.position.z = roadZ + (Math.random() - 0.5) * 24;
    }
    ring.userData.phase += dt * 0.55;
    if (ring.userData.phase > 1) ring.userData.phase = 0;
    const p = ring.userData.phase;
    const sc = 0.4 + p * 1.6;
    ring.scale.set(sc, sc, sc);
    ring.material.opacity = (1 - p) * 0.45;
  }
  const anim = world.scene.userData.cityAnim;
  if (anim) {
    for (const item of anim.neon || []) {
      const pulse = 0.82 + 0.18 * Math.sin(t * 1.4 + item.phase);
      if (item.glow) item.glow.material.opacity = 0.28 * pulse;
    }
    for (const palm of anim.palms || []) {
      palm.rotation.z = Math.sin(t * 0.9 + palm.userData.phase) * 0.05;
      palm.rotation.x = Math.cos(t * 0.7 + palm.userData.phase) * 0.03;
    }
    for (const puff of anim.steam || []) {
      puff.userData.phase += dt * 0.25;
      if (puff.userData.phase > 1) puff.userData.phase = 0;
      const p = puff.userData.phase;
      puff.position.y = puff.userData.baseY + p * 7;
      puff.scale.setScalar(0.8 + p * 1.8);
      puff.material.opacity = (1 - p) * 0.4;
    }
  }
}

export function drawWorld(world, state) {
  const now = performance.now();
  let dt = (now - world.lastNow) / 1000;
  world.lastNow = now;
  if (!(dt > 0) || dt > 0.1) dt = 0.016;
  world.elapsed += dt;
  ensureCityMeshes(state, world.scene);
  if (world.renderer.domElement.width !== window.innerWidth || world.renderer.domElement.height !== window.innerHeight) {
    resizeWorld(world);
  }
  updateCamera(world, state, dt);
  animateSky(world, state, dt);
  world.renderer.render(world.scene, world.camera);
}

export function resizeWorld(world) {
  world.renderer.setSize(window.innerWidth, window.innerHeight);
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
}
