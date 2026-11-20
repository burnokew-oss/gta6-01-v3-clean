// render.js — renderer Three.js: langit gradien terang, matahari senja
// keemasan, kabut hangat tipis, bayangan lembut, cahaya selalu terang.
export function createRenderer(canvas) {
  const THREE = window.THREE;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  return renderer;
}

export function createScene() {
  const THREE = window.THREE;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xf6d9b8, 120, 340);
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 16; skyCanvas.height = 256;
  const g = skyCanvas.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#3d9be9"); grad.addColorStop(0.45, "#8fd8ff");
  grad.addColorStop(0.72, "#cfeeff"); grad.addColorStop(0.88, "#ffd9a0");
  grad.addColorStop(1, "#ffb877");
  g.fillStyle = grad; g.fillRect(0, 0, 16, 256);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(420, 24, 14),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);
  const sun = new THREE.DirectionalLight(0xffe3a3, 1.55);
  sun.position.set(-70, 95, 55);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -90; sun.shadow.camera.right = 90;
  sun.shadow.camera.top = 90; sun.shadow.camera.bottom = -90;
  sun.shadow.camera.far = 320;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xbfe6ff, 0xffe0b3, 0.85));
  const fill = new THREE.DirectionalLight(0xffc98a, 0.35);
  fill.position.set(60, 40, -70);
  scene.add(fill);
  // Awan tipis bergerak + burung jauh: hidup, bukan diorama beku.
  const clouds = new THREE.Group();
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.72, fog: false });
  for (let i = 0; i < 9; i++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(9 + (i % 3) * 4, 10, 6), cloudMat);
    c.scale.set(2.6, 0.42, 1);
    c.position.set(-190 + i * 46, 74 + (i % 4) * 9, -120 + (i % 5) * 52);
    clouds.add(c);
  }
  scene.add(clouds);
  const birds = new THREE.Group();
  const birdMat = new THREE.MeshBasicMaterial({ color: 0x334155, fog: false });
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Group();
    const w1 = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), birdMat);
    const w2 = w1.clone();
    w1.rotation.z = 0.5; w2.rotation.z = -0.5;
    w1.position.x = -1.2; w2.position.x = 1.2;
    b.add(w1, w2);
    b.position.set(-80 + i * 22, 52 + (i % 3) * 5, -60 + i * 9);
    birds.add(b);
  }
  scene.add(birds);
  return { scene, sky, clouds, birds, sun };
}

export function updateSkyLife(parts, t) {
  parts.clouds.children.forEach((c, i) => { c.position.x += Math.sin(t * 0.05 + i) * 0.006 + 0.014; if (c.position.x > 230) c.position.x = -230; });
  parts.birds.children.forEach((b, i) => {
    b.position.x += 0.09 + i * 0.004;
    b.position.y += Math.sin(t * 2 + i * 1.7) * 0.02;
    b.children[0].rotation.z = 0.5 + Math.sin(t * 6 + i) * 0.35;
    b.children[1].rotation.z = -0.5 - Math.sin(t * 6 + i) * 0.35;
    if (b.position.x > 240) b.position.x = -240;
  });
}
