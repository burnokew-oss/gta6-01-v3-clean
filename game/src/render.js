// render.js — renderer Three.js: langit gradien senja jenuh, matahari
// hangat, kabut tipis, bayangan lembut, grading jenuh dengan gelap sejati
// dan terang sejati di tiap frame. Siklus cahaya selalu terang.
import { Rng } from "./random.js";

export function makeCanvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function skyTexture() {
  return makeCanvas(64, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, "#0d5f73");
    grad.addColorStop(0.35, "#1b93a8");
    grad.addColorStop(0.62, "#f7b733");
    grad.addColorStop(0.8, "#ff8c42");
    grad.addColorStop(1.0, "#ff6b4a");
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

export class Render {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    this.renderer.setSize(innerWidth, innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xf6b183, 130, 430);
    this.camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
    this.camera.position.set(0, 3, 12);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(820, 24, 16),
      new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false })
    );
    this.scene.add(sky);

    this.sun = new THREE.DirectionalLight(0xffd9a3, 2.6);
    this.sun.position.set(120, 150, -60);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.left = -150; this.sun.shadow.camera.right = 150;
    this.sun.shadow.camera.top = 150; this.sun.shadow.camera.bottom = -150;
    this.sun.shadow.camera.far = 500;
    this.sun.shadow.bias = -0.0006;
    this.scene.add(this.sun, this.sun.target);
    this.scene.add(new THREE.HemisphereLight(0xffe3b8, 0x2e4453, 0.95));
    this.scene.add(new THREE.AmbientLight(0xffc9a0, 0.35));

    // Awan tipis bergerak perlahan.
    this.clouds = new THREE.Group();
    const rng = new Rng(777);
    const cloudTex = makeCanvas(256, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) {
        const x = rng.float(30, w - 30), y = rng.float(35, h - 35), r = rng.float(16, 44);
        const rg = g.createRadialGradient(x, y, 2, x, y, r);
        rg.addColorStop(0, "rgba(255,244,230,0.55)");
        rg.addColorStop(1, "rgba(255,244,230,0)");
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
      }
    });
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(rng.float(120, 220), rng.float(36, 60)),
        new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, depthWrite: false, fog: false, opacity: 0.85 })
      );
      m.position.set(rng.float(-380, 380), rng.float(95, 150), rng.float(-380, 380));
      m.rotation.x = -Math.PI / 2 + 0.25;
      this.clouds.add(m);
    }
    this.scene.add(this.clouds);
  }
  update(t) {
    this.clouds.children.forEach((c, i) => {
      c.position.x += Math.sin(t * 0.01 + i) * 0.004 + 0.012;
      if (c.position.x > 420) c.position.x = -420;
    });
  }
  render() { this.renderer.render(this.scene, this.camera); }
  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
}
