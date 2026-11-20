// Teluk Cerah — renderer and atmosphere: real shadow mapping with soft
// edges, a saturated golden-hour sky, warm distance fog, ACES filmic tone
// mapping, and a procedural sunset environment map so PBR materials pick
// up the sky's colours and vehicles sit inside the world.

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe99a5c, 150, 780);

  const camera = new THREE.PerspectiveCamera(58, 16 / 10, 0.1, 1600);
  camera.position.set(0, 3, 10);

  // ---- sky dome: layered gradient, teal zenith to peach horizon ----
  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 64; skyCanvas.height = 512;
  const sg = skyCanvas.getContext("2d");
  const grad = sg.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, "#17456e");
  grad.addColorStop(0.34, "#2f6ea6");
  grad.addColorStop(0.55, "#5f9ec4");
  grad.addColorStop(0.72, "#f2c078");
  grad.addColorStop(0.86, "#ff9e57");
  grad.addColorStop(1.0, "#ff8a4a");
  sg.fillStyle = grad; sg.fillRect(0, 0, 64, 512);
  const skyTex = new THREE.CanvasTexture(skyCanvas);
  skyTex.encoding = THREE.sRGBEncoding;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(1100, 32, 20),
    new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  // ---- sun + soft shadows, one consistent direction everywhere ----
  const sunDir = new THREE.Vector3(0.55, 0.33, 0.30).normalize();
  const sun = new THREE.DirectionalLight(0xffd9a3, 1.32);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  sun.shadow.camera.left = -95; sun.shadow.camera.right = 95;
  sun.shadow.camera.top = 95; sun.shadow.camera.bottom = -95;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 420;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xa8cdea, 0x9a6136, 0.55);
  scene.add(hemi);
  const bounce = new THREE.DirectionalLight(0xff9e57, 0.28);
  bounce.position.set(120, 30, -160);
  scene.add(bounce);

  // ---- environment reflections baked from the same sunset ----
  const envMap = buildSunsetEnvMap(renderer);
  scene.environment = envMap;

  // sun glow billboard
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = glowCanvas.height = 128;
  const gg = glowCanvas.getContext("2d");
  const rg = gg.createRadialGradient(64, 64, 2, 64, 64, 64);
  rg.addColorStop(0, "rgba(255,244,214,1)");
  rg.addColorStop(0.25, "rgba(255,205,130,0.75)");
  rg.addColorStop(1, "rgba(255,160,80,0)");
  gg.fillStyle = rg; gg.fillRect(0, 0, 128, 128);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, fog: false, depthWrite: false, transparent: true }));
  sunSprite.scale.set(340, 340, 1);
  sunSprite.position.copy(sunDir).multiplyScalar(980);
  scene.add(sunSprite);

  // thin drifting clouds: soft white ellipses on transparent planes
  const clouds = new THREE.Group();
  const cloudTex = makeCloudTexture();
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(150 + (i % 4) * 60, 26 + (i % 3) * 10),
      new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.5, depthWrite: false, fog: false })
    );
    m.position.set(-700 + i * 105, 150 + (i % 5) * 26, -320 + (i % 4) * 130);
    m.rotation.x = -0.12;
    clouds.add(m);
  }
  scene.add(clouds);

  function followShadow(target) {
    sun.position.copy(target).addScaledVector(sunDir, 190);
    sun.target.position.copy(target);
  }

  function update(dt, t) {
    clouds.children.forEach((c, i) => {
      c.position.x += dt * (1.1 + (i % 3) * 0.4);
      if (c.position.x > 820) c.position.x = -820;
    });
    sky.position.copy(camera.position);
    sunSprite.position.copy(camera.position).addScaledVector(sunDir, 980);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return { renderer, scene, camera, sun, sunDir, envMap, followShadow, update, resize };
}

function buildSunsetEnvMap(renderer) {
  const faces = [];
  for (let f = 0; f < 6; f++) {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 128);
    if (f === 4) { grad.addColorStop(0, "#2c5f8f"); grad.addColorStop(1, "#7fb0c9"); }
    else if (f === 5) { grad.addColorStop(0, "#5a3a26"); grad.addColorStop(1, "#33241a"); }
    else {
      grad.addColorStop(0, "#2c5f8f"); grad.addColorStop(0.52, "#8fb8cf");
      grad.addColorStop(0.72, "#ffc078"); grad.addColorStop(1, "#7a4a30");
    }
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    if (f === 0) { // sun blob on the +x face
      const rg = g.createRadialGradient(88, 66, 2, 88, 66, 46);
      rg.addColorStop(0, "rgba(255,246,220,1)"); rg.addColorStop(1, "rgba(255,170,90,0)");
      g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    }
    g.fillStyle = "rgba(40,32,30,0.55)";
    for (let i = 0; i < 7; i++) g.fillRect((i * 37 + f * 11) % 128, 96, 12, 32);
    faces.push(c);
  }
  const tex = new THREE.CubeTexture(faces);
  tex.encoding = THREE.sRGBEncoding;
  tex.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  // PMREM needs its own renderer target; fall back to the raw cube texture
  // (still a valid envMap for standard/physical materials) if it fails.
  try {
    const rt = pmrem.fromCubemap(tex);
    pmrem.dispose();
    return rt.texture;
  } catch {
    return tex;
  }
}

function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d");
  for (let i = 0; i < 26; i++) {
    const x = 20 + Math.random() * 216, y = 22 + Math.random() * 22, r = 12 + Math.random() * 22;
    const rg = g.createRadialGradient(x, y, 1, x, y, r);
    rg.addColorStop(0, "rgba(255,250,244,0.55)");
    rg.addColorStop(1, "rgba(255,250,244,0)");
    g.fillStyle = rg;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}
