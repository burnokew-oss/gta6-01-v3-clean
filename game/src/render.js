// Dunia tiga dimensi: renderer, langit senja hidup, hujan, dan lampu kota.
import "three";
const THREE = window.THREE;

function skyTexture() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 512;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#3d4a8a"); grad.addColorStop(0.34, "#8a5f9e");
  grad.addColorStop(0.58, "#e88bb0"); grad.addColorStop(0.78, "#ffb37a");
  grad.addColorStop(1, "#ffd9a0");
  g.fillStyle = grad; g.fillRect(0, 0, 64, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createWorld() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.15));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.getElementById("game-root").appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xe8a58e, 90, 340);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(0, 4, 12);

  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x4a5a8a, 1.05);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffb36b, 2.1);
  sun.position.set(-60, 42, -120);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
  sun.shadow.camera.far = 320;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x8fb4ff, 0.5);
  fill.position.set(50, 30, 80); scene.add(fill);
  scene.add(new THREE.AmbientLight(0xffe2c4, 0.35));

  // Matahari rendah berpijar + halo lembut di cakrawala.
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffdf9e, fog: false }));
  sunBall.position.set(-95, 26, -330); scene.add(sunBall);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(17, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xffb37a, transparent: true, opacity: 0.3, fog: false }));
  halo.position.copy(sunBall.position); scene.add(halo);

  // Awan tipis bergerak pelan.
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffc9b8, transparent: true, opacity: 0.34, fog: false });
  for (let i = 0; i < 14; i++) {
    const cl = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), cloudMat);
    cl.scale.set(10 + (i % 5) * 4, 1.05, 3.4);
    cl.position.set(-260 + i * 42, 62 + (i % 3) * 9, -190 - (i % 4) * 35);
    clouds.add(cl);
  }
  scene.add(clouds);

  // Hujan: titik-titik jatuh yang terbaca di udara.
  const rainCount = 900;
  const rainPos = new Float32Array(rainCount * 3);
  for (let i = 0; i < rainCount; i++) {
    rainPos[i * 3] = (Math.random() - 0.5) * 130;
    rainPos[i * 3 + 1] = Math.random() * 42;
    rainPos[i * 3 + 2] = (Math.random() - 0.5) * 130;
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({
    color: 0xcfe4ff, size: 0.28, transparent: true, opacity: 0.22, sizeAttenuation: true,
  }));
  scene.add(rain);

  // Burung senja kecil melintas.
  const birds = new THREE.Group();
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x3a3450 });
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    const w1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 4), birdMat); w1.scale.set(1.8, 0.16, 0.5); w1.position.x = -0.8;
    const w2 = w1.clone(); w2.position.x = 0.8;
    b.add(w1, w2); b.position.set(-60 + i * 17, 34 + (i % 3) * 3, -120 - i * 6);
    birds.add(b);
  }
  scene.add(birds);

  return { scene, camera, renderer, sun, hemi, clouds, rain, birds, t: 0 };
}

export function drawWorld(world, state) {
  world.t += state ? 0.016 : 0.016;
  const cam = world.camera;
  world.clouds.children.forEach((c, i) => { c.position.x += 0.008 + i * 0.0006; if (c.position.x > 300) c.position.x = -300; });
  world.birds.children.forEach((b, i) => {
    b.position.x += 0.11 + i * 0.008;
    b.children[0].rotation.z = Math.sin(world.t * 9 + i) * 0.45;
    b.children[1].rotation.z = -Math.sin(world.t * 9 + i) * 0.45;
    if (b.position.x > 240) b.position.x = -240;
  });
  const rp = world.rain.geometry.attributes.position;
  for (let i = 0; i < rp.count; i++) {
    let y = rp.getY(i) - 0.85;
    if (y < 0) y = 42;
    rp.setY(i, y);
    rp.setX(i, cam.position.x + ((rp.getX(i) - cam.position.x + 65 + 130) % 130) - 65);
    rp.setZ(i, cam.position.z + ((rp.getZ(i) - cam.position.z + 65 + 130) % 130) - 65);
  }
  rp.needsUpdate = true;
  world.renderer.render(world.scene, world.camera);
}

export function resizeWorld(world) {
  world.camera.aspect = window.innerWidth / window.innerHeight;
  world.camera.updateProjectionMatrix();
  world.renderer.setSize(window.innerWidth, window.innerHeight);
}
