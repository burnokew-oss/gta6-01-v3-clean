// vehicles.js — mobil pemain & lalu lintas: bodi melengkung halus dengan
// gradien vertikal, pita highlight clearcoat, kaca gradien langit + silau
// diagonal, sambungan panel, spion, gagang pintu, lengkung roda gelap, ban
// radial dan pelek jari-jari banyak. Pelat unik tiap mobil.
import { Rng } from "./random.js";
import { makeCanvas } from "./render.js";

const rng = new Rng(4242);
const LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ";

export function randomPlate(r) {
  return `TC ${r.int(100, 999)} ${r.pick(LETTERS.split(""))}${r.pick(LETTERS.split(""))}`;
}
export function policePlate(unit) { return `DINAS ${1400 + unit * 17}-${unit}`; }

function plateTexture(text) {
  return makeCanvas(128, 32, (g, w, h) => {
    g.fillStyle = "#f6f3ea"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#1c2733"; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2);
    g.fillStyle = "#141c26"; g.font = "bold 17px monospace"; g.textAlign = "center";
    g.fillText(text, w / 2, 22);
  });
}

function wheelTexture() {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = "#101114"; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
    g.strokeStyle = "#26282e"; g.lineWidth = 3; // tapak radial
    for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283; g.beginPath(); g.moveTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44); g.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); g.stroke(); }
    g.fillStyle = "#c8ccd4"; g.beginPath(); g.arc(64, 64, 40, 0, 7); g.fill();
    g.fillStyle = "#7d838e"; // pelek jari-jari banyak
    for (let i = 0; i < 10; i++) { const a = (i / 10) * 6.283; g.save(); g.translate(64, 64); g.rotate(a); g.fillRect(-3, -38, 6, 34); g.restore(); }
    g.fillStyle = "#3c4149"; g.beginPath(); g.arc(64, 64, 11, 0, 7); g.fill();
  });
}
const WHEEL_TEX = () => wheelTexture();

function sideTexture(colorHex, opts = {}) {
  const col = "#" + colorHex.toString(16).padStart(6, "0");
  return makeCanvas(512, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h); // gradien vertikal bodi
    grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.18, col);
    grad.addColorStop(0.55, col); grad.addColorStop(1, "#00000055");
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.fillStyle = grad; g.globalAlpha = 0.35; g.fillRect(0, 0, w, h); g.globalAlpha = 1;
    g.fillStyle = "rgba(255,255,255,0.75)"; g.fillRect(0, 34, w, 7); // pita highlight clearcoat
    g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, h - 16, w, 16); // skirt gelap
    // kaca: gradien langit + garis silau diagonal
    const glass = g.createLinearGradient(60, 8, 300, 60);
    glass.addColorStop(0, "#cfeeff"); glass.addColorStop(0.45, "#39657f"); glass.addColorStop(1, "#18242f");
    g.fillStyle = glass; g.fillRect(120, 6, 260, 34);
    g.strokeStyle = "rgba(255,255,255,0.85)"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(150, 38); g.lineTo(215, 8); g.stroke();
    g.strokeStyle = "rgba(10,10,12,0.55)"; g.lineWidth = 2; // sambungan panel & pintu
    g.strokeRect(150, 44, 96, 62); g.strokeRect(258, 44, 96, 62);
    g.fillStyle = "rgba(15,15,18,0.8)"; // gagang pintu
    g.fillRect(222, 56, 20, 5); g.fillRect(330, 56, 20, 5);
    // lengkung roda gelap
    g.fillStyle = "#0b0b0d";
    for (const cx of [86, 424]) { g.beginPath(); g.arc(cx, h - 8, 34, Math.PI, 0); g.fill(); }
    if (opts.police) {
      g.fillStyle = "#1c4f9e"; g.fillRect(0, 62, w, 20);
      g.fillStyle = "#ffffff"; g.font = "bold 21px sans-serif"; g.textAlign = "center";
      g.fillText("P A T R O L I", w / 2, 106);
      g.fillStyle = "#d21f2e"; g.fillRect(0, 58, w, 4);
    }
    if (opts.taxi) { g.fillStyle = "#141414"; g.font = "bold 20px sans-serif"; g.textAlign = "center"; g.fillText("TAKSI CERAH", w / 2, 104); }
  });
}

export function makeCar({ color = 0xd21f2e, police = false, taxi = false, plate = null, hero = false } = {}) {
  const grp = new THREE.Group();
  const tex = sideTexture(color, { police, taxi });
  const bodyMat = new THREE.MeshPhongMaterial({ map: tex, shininess: hero ? 120 : 70, specular: 0xdddddd });
  const paintMat = new THREE.MeshPhongMaterial({ color, shininess: hero ? 120 : 70, specular: 0xcccccc });
  const lower = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.95, 1.95), bodyMat);
  lower.position.y = 0.72; lower.castShadow = true; grp.add(lower);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 1.8), paintMat); // hidung melandai
  nose.position.set(2.45, 0.6, 0); nose.rotation.z = -0.16; nose.castShadow = true; grp.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.72, 1.58), paintMat);
  cabin.position.set(-0.25, 1.44, 0); cabin.castShadow = true; grp.add(cabin);
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x22384a, shininess: 160, specular: 0xbfe8ff });
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 1.55), glassMat);
  shield.position.set(0.98, 1.48, 0); shield.rotation.z = -0.5; grp.add(shield);
  const rearGlass = shield.clone(); rearGlass.position.x = -1.48; rearGlass.rotation.z = 0.5; grp.add(rearGlass);
  // spion
  for (const s of [-1, 1]) {
    const mir = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.3), paintMat);
    mir.position.set(0.95, 1.42, s * 1.05); grp.add(mir);
  }
  // lampu depan & belakang
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4 });
  for (const s of [-1, 1]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.44), headMat);
    hl.position.set(2.72, 0.68, s * 0.6); grp.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    tl.position.set(-2.22, 0.82, s * 0.58); grp.add(tl);
  }
  // roda
  const wheelTex = WHEEL_TEX();
  const wheelMat = new THREE.MeshPhongMaterial({ map: wheelTex });
  const wheels = [];
  for (const [wx, wz] of [[1.55, 0.95], [1.55, -0.95], [-1.5, 0.95], [-1.5, -0.95]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 18), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.42, wz);
    wheel.castShadow = true;
    grp.add(wheel); wheels.push(wheel);
  }
  // pelat belakang + depan
  const plateTex = plateTexture(plate ?? randomPlate(rng));
  for (const [px, ry] of [[-2.24, -Math.PI / 2], [2.78, Math.PI / 2]]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.24), new THREE.MeshBasicMaterial({ map: plateTex }));
    p.position.set(px, 0.72, 0); p.rotation.y = ry; grp.add(p);
  }
  let lightbar = null, lbMats = null;
  if (police) {
    lightbar = new THREE.Group();
    lbMats = [];
    for (let i = 0; i < 6; i++) {
      const segMat = new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2255ff : 0xff2233 });
      const seg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.3), segMat);
      seg.position.set(0, 0, -0.75 + i * 0.3);
      lightbar.add(seg); lbMats.push(segMat);
    }
    const lbBase = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 1.7), new THREE.MeshPhongMaterial({ color: 0x14161a }));
    lightbar.add(lbBase);
    lightbar.position.set(-0.25, 2.0, 0);
    grp.add(lightbar);
  }
  grp.userData.wheels = wheels;
  grp.userData.lightbarMats = lbMats;
  return grp;
}

export class Traffic {
  constructor(scene, city, count = 10) {
    this.cars = [];
    const colors = [0x2e7fc2, 0xf2f2f2, 0xff8a1e, 0x37b85c, 0xe8c832, 0x8a5fc0, 0xb8b0a4];
    for (let i = 0; i < count; i++) {
      const taxi = i === 3;
      const mesh = makeCar({ color: taxi ? 0xffd21e : colors[i % colors.length], taxi });
      const vertical = i % 2 === 0;
      const lane = (Math.floor(rng.float(-4, 5)) * 46) + (vertical ? 3.2 : -3.2);
      const along = rng.float(-200, 200);
      mesh.position.set(vertical ? lane : along, 0, vertical ? along : lane);
      mesh.rotation.y = vertical ? (i % 4 === 0 ? 0 : Math.PI) : (i % 4 === 1 ? Math.PI / 2 : -Math.PI / 2);
      scene.add(mesh);
      this.cars.push({ mesh, speed: rng.float(7, 12), dir: new THREE.Vector3().setFromMatrixColumn(mesh.matrix, 0), vertical, spin: 0 });
      mesh.updateMatrix();
      this.cars[i].dir = new THREE.Vector3(1, 0, 0).applyEuler(mesh.rotation);
    }
  }
  update(dt, t) {
    for (const c of this.cars) {
      c.mesh.position.addScaledVector(c.dir, c.speed * dt);
      if (Math.abs(c.mesh.position.x) > 225 || Math.abs(c.mesh.position.z) > 225) {
        c.mesh.position.copy(c.dir).multiplyScalar(-215);
        c.mesh.position.y = 0;
      }
      for (const w of c.mesh.userData.wheels) w.rotation.z -= c.speed * dt / 0.42;
    }
  }
  setFrozen(t) { // pose deterministik untuk screenshot
    for (let i = 0; i < this.cars.length; i++) {
      const c = this.cars[i];
      const vertical = i % 2 === 0;
      const lane = (Math.floor(((i * 37) % 9) - 4) * 46) + 3.2;
      const along = -60 + i * 14;
      c.mesh.position.set(vertical ? lane : along + 130, 0, vertical ? along - 40 : lane - 46);
    }
  }
}
