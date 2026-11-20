// vehicles.js — mobil pemain, polisi, dan lalu lintas: bodi extrude
// melengkung dengan gradien vertikal, pita highlight clearcoat, kaca gradien
// langit + silau diagonal, panel, spion, gagang pintu, lengkung roda, ban
// radial dan pelek jari-jari, pelat unik tiap mobil, lightbar polisi nyata.
import { canvasTexture, streakTexture } from "./city.js";
import { mulberry32, rngInt, rngPick } from "./random.js";
import { TRAFFIC_PLATE_LETTERS } from "./config.js";

const T = () => window.THREE;

export function plateTexture(text, service) {
  return canvasTexture(160, 44, (g, w, h) => {
    g.fillStyle = service ? "#1d4ed8" : "#f8fafc"; g.fillRect(0, 0, w, h);
    g.strokeStyle = service ? "#f8fafc" : "#111827"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = service ? "#ffffff" : "#111827";
    g.font = "bold " + (text.length > 10 ? 19 : 24) + "px monospace";
    g.textAlign = "center"; g.fillText(text, w / 2, 31);
  });
}

function bodyTexture(hex) {
  const c = new window.THREE.Color(hex);
  const top = "#" + c.clone().multiplyScalar(1.25).getHexString();
  const mid = "#" + c.getHexString();
  const low = "#" + c.clone().multiplyScalar(0.55).getHexString();
  return canvasTexture(32, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, top); grad.addColorStop(0.45, mid); grad.addColorStop(1, low);
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
}

function glassTexture() {
  return canvasTexture(64, 64, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#bfe6ff"); grad.addColorStop(0.5, "#3a6ea8"); grad.addColorStop(1, "#16283e");
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.65)";
    g.beginPath(); g.moveTo(6, 64); g.lineTo(34, 0); g.lineTo(46, 0); g.lineTo(18, 64); g.fill();
  });
}

function carProfileGeometry(length, height) {
  const T3 = T();
  const s = new T3.Shape();
  const L = length / 2, H = height;
  s.moveTo(-L, 0.25);
  s.quadraticCurveTo(-L - 0.05, 0.75, -L + 0.55, 0.85);
  s.quadraticCurveTo(-L + 1.15, 0.95, -L + 1.5, H * 0.98);
  s.quadraticCurveTo(-L + 2.1, H * 1.28, -L + 3.1, H * 1.3);
  s.quadraticCurveTo(0.4, H * 1.32, L - 1.7, H * 1.05);
  s.quadraticCurveTo(L - 0.7, H * 0.98, L - 0.25, 0.82);
  s.quadraticCurveTo(L + 0.05, 0.6, L, 0.3);
  s.lineTo(-L, 0.25);
  const geo = new T3.ExtrudeGeometry(s, { depth: 1.66, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.13, bevelSegments: 3, steps: 1 });
  geo.translate(0, 0, -0.83);
  return geo;
}

function makeWheel() {
  const T3 = T();
  const wheel = new T3.Group();
  const capTex = canvasTexture(64, 64, (g) => {
    g.fillStyle = "#14161a"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#c7ced6"; g.beginPath(); g.arc(32, 32, 17, 0, 7); g.fill();
    g.strokeStyle = "#39404a"; g.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      g.beginPath(); g.moveTo(32, 32); g.lineTo(32 + Math.cos(a) * 16, 32 + Math.sin(a) * 16); g.stroke();
      g.beginPath(); g.moveTo(32 + Math.cos(a + 0.4) * 24, 32 + Math.sin(a + 0.4) * 24);
      g.lineTo(32 + Math.cos(a + 0.9) * 30, 32 + Math.sin(a + 0.9) * 30); g.stroke();
    }
    g.fillStyle = "#6b7280"; g.beginPath(); g.arc(32, 32, 5, 0, 7); g.fill();
  });
  const sideMat = new T3.MeshStandardMaterial({ color: 0x14161a, roughness: 0.92 });
  const capMat = new T3.MeshStandardMaterial({ map: capTex, roughness: 0.5, metalness: 0.4 });
  const tire = new T3.Mesh(new T3.CylinderGeometry(0.42, 0.42, 0.3, 18), [sideMat, capMat, capMat]);
  tire.rotation.x = Math.PI / 2;
  wheel.add(tire);
  wheel.userData.spin = (v) => { wheel.rotation.z -= v; };
  return wheel;
}

export function makeCar({ color, plate, police = false, unit = 0, pickup = false }) {
  const T3 = T();
  const car = new T3.Group();
  const length = pickup ? 5.4 : 4.9, height = pickup ? 1.05 : 0.92;
  const bodyMat = new T3.MeshPhongMaterial({ map: bodyTexture(color), shininess: 95, specular: 0x99ccee });
  const body = new T3.Mesh(carProfileGeometry(length, height), bodyMat);
  body.position.y = 0.32; body.castShadow = true;
  car.add(body);
  // Pita highlight clearcoat di sisi bodi.
  for (const s of [-1, 1]) {
    const strip = new T3.Mesh(new T3.PlaneGeometry(length * 0.72, 0.13),
      new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.34 }));
    strip.position.set(-0.1, 1.06, s * 0.99); if (s < 0) strip.rotation.y = Math.PI;
    car.add(strip);
    const panel = new T3.Mesh(new T3.PlaneGeometry(length * 0.8, 0.035),
      new T3.MeshBasicMaterial({ color: 0x10131a, transparent: true, opacity: 0.5 }));
    panel.position.set(0, 0.62, s * 0.995); if (s < 0) panel.rotation.y = Math.PI;
    car.add(panel);
    for (const dx of [-0.7, 0.85]) {
      const handle = new T3.Mesh(new T3.BoxGeometry(0.42, 0.06, 0.05), new T3.MeshStandardMaterial({ color: 0x22262c, metalness: 0.6, roughness: 0.4 }));
      handle.position.set(dx, 1.12, s * 1.0); car.add(handle);
    }
    const mirror = new T3.Mesh(new T3.BoxGeometry(0.1, 0.16, 0.3), bodyMat);
    mirror.position.set(1.28, 1.32, s * 1.06); car.add(mirror);
  }
  // Kaca kabin gradien langit.
  const glass = new T3.Mesh(new T3.BoxGeometry(2.15, 0.5, 1.6),
    new T3.MeshPhongMaterial({ map: glassTexture(), shininess: 130, specular: 0xffffff }));
  glass.position.set(-0.15, 1.42, 0);
  glass.geometry.translate(0, 0, 0);
  car.add(glass);
  const roof = new T3.Mesh(new T3.BoxGeometry(1.9, 0.09, 1.5), bodyMat);
  roof.position.set(-0.15, 1.7, 0); car.add(roof);
  // Spoiler belakang, bumper gelap, dan knalpot krom: siluet mobil sungguhan.
  const spoiler = new T3.Mesh(new T3.BoxGeometry(0.16, 0.07, 1.66), new T3.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.35, metalness: 0.4 }));
  spoiler.position.set(-length / 2 + 0.18, 1.32, 0); car.add(spoiler);
  for (const s of [-1, 1]) {
    const leg = new T3.Mesh(new T3.BoxGeometry(0.07, 0.3, 0.07), spoiler.material);
    leg.position.set(-length / 2 + 0.18, 1.14, s * 0.66); car.add(leg);
    const exhaust = new T3.Mesh(new T3.CylinderGeometry(0.075, 0.075, 0.24, 8), new T3.MeshStandardMaterial({ color: 0xd7dde3, metalness: 0.9, roughness: 0.25 }));
    exhaust.rotation.z = Math.PI / 2; exhaust.position.set(-length / 2 - 0.16, 0.34, s * 0.52); car.add(exhaust);
  }
  const bumper = new T3.Mesh(new T3.BoxGeometry(0.24, 0.3, 1.8), new T3.MeshStandardMaterial({ color: 0x171a1f, roughness: 0.6 }));
  bumper.position.set(-length / 2 - 0.05, 0.42, 0); car.add(bumper);
  const bumperF = bumper.clone(); bumperF.position.x = length / 2 + 0.05; car.add(bumperF);
  // Lengkung roda gelap + roda.
  const wheels = [];
  const archMat = new T3.MeshBasicMaterial({ color: 0x0b0d10 });
  for (const [wx, wz] of [[-1.62, -0.88], [1.62, -0.88], [-1.62, 0.88], [1.62, 0.88]]) {
    const arch = new T3.Mesh(new T3.CircleGeometry(0.52, 14, 0, Math.PI), archMat);
    arch.position.set(wx, 0.62, wz + (wz > 0 ? 0.1 : -0.1));
    if (wz < 0) arch.rotation.y = Math.PI;
    car.add(arch);
    const wheel = makeWheel();
    wheel.position.set(wx, 0.42, wz);
    car.add(wheel); wheels.push(wheel);
  }
  // Lampu depan + flare, lampu belakang merah menyala.
  const flareTex = canvasTexture(64, 64, (g) => {
    const rg = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    rg.addColorStop(0, "rgba(255,250,220,1)"); rg.addColorStop(1, "rgba(255,250,220,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  });
  for (const s of [-1, 1]) {
    const hl = new T3.Mesh(new T3.SphereGeometry(0.13, 8, 8), new T3.MeshBasicMaterial({ color: 0xfff6cf }));
    hl.position.set(length / 2 + 0.1, 0.82, s * 0.58); car.add(hl);
    const flare = new T3.Sprite(new T3.SpriteMaterial({ map: flareTex, transparent: true, opacity: 0.9, depthWrite: false }));
    flare.scale.setScalar(1.15); flare.position.copy(hl.position); car.add(flare);
    const tl = new T3.Mesh(new T3.BoxGeometry(0.07, 0.14, 0.5), new T3.MeshBasicMaterial({ color: 0xff2222 }));
    tl.position.set(-length / 2 - 0.12, 0.88, s * 0.55); car.add(tl);
  }
  // Pelat unik: depan dan belakang.
  const plateMat = new T3.MeshBasicMaterial({ map: plateTexture(plate, police) });
  const plateRear = new T3.Mesh(new T3.PlaneGeometry(1.05, 0.29), plateMat);
  plateRear.position.set(-length / 2 - 0.2, 0.62, 0); plateRear.rotation.y = -Math.PI / 2;
  car.add(plateRear);
  const plateFront = new T3.Mesh(new T3.PlaneGeometry(1.05, 0.29), plateMat);
  plateFront.position.set(length / 2 + 0.2, 0.62, 0); plateFront.rotation.y = Math.PI / 2;
  car.add(plateFront);
  // Pantulan lampu belakang: streak merah ber-noise di aspal belakang mobil
  // (bukan bidang merah polos — teksturnya bergaris dan memudar).
  const tailStreak = new T3.Mesh(new T3.PlaneGeometry(1.7, 6.4),
    new T3.MeshBasicMaterial({ map: streakTexture("#ff2a22"), transparent: true, opacity: 0.5, blending: T3.AdditiveBlending, depthWrite: false }));
  tailStreak.rotation.x = -Math.PI / 2; tailStreak.rotation.z = Math.PI / 2;
  tailStreak.position.set(-length / 2 - 3.4, 0.05, 0);
  car.add(tailStreak);
  const headStreak = new T3.Mesh(new T3.PlaneGeometry(1.6, 5),
    new T3.MeshBasicMaterial({ map: streakTexture("#ffe9a8"), transparent: true, opacity: 0.32, blending: T3.AdditiveBlending, depthWrite: false }));
  headStreak.rotation.x = -Math.PI / 2; headStreak.rotation.z = -Math.PI / 2;
  headStreak.position.set(length / 2 + 2.8, 0.05, 0);
  car.add(headStreak);

  let lightbar = null;
  if (police) {
    const band = new T3.Mesh(new T3.BoxGeometry(3.6, 0.34, 1.86), new T3.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 }));
    band.position.set(0.1, 0.95, 0); car.add(band);
    const doorTex = canvasTexture(256, 128, (g, w, h) => {
      g.fillStyle = "#f8fafc"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#1d4ed8"; g.fillRect(0, 12, w, 26);
      g.fillStyle = "#111827"; g.font = "bold 34px sans-serif"; g.textAlign = "center";
      g.fillText("POLISI", w / 2, 82);
      g.fillStyle = "#1d4ed8"; g.font = "bold 20px sans-serif";
      g.fillText("PATROLI • UNIT " + String(unit).padStart(2, "0"), w / 2, 112);
    });
    for (const s of [-1, 1]) {
      const door = new T3.Mesh(new T3.PlaneGeometry(2.5, 1.25), new T3.MeshBasicMaterial({ map: doorTex }));
      door.position.set(0.05, 0.92, s * 1.0); if (s < 0) door.rotation.y = Math.PI;
      car.add(door);
    }
    const barBase = new T3.Mesh(new T3.BoxGeometry(0.5, 0.16, 1.7), new T3.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4 }));
    barBase.position.set(-0.1, 1.86, 0); car.add(barBase);
    const redSeg = new T3.Mesh(new T3.BoxGeometry(0.42, 0.2, 0.78), new T3.MeshBasicMaterial({ color: 0xff2222 }));
    redSeg.position.set(-0.1, 1.9, -0.42); car.add(redSeg);
    const blueSeg = new T3.Mesh(new T3.BoxGeometry(0.42, 0.2, 0.78), new T3.MeshBasicMaterial({ color: 0x2255ff }));
    blueSeg.position.set(-0.1, 1.9, 0.42); car.add(blueSeg);
    lightbar = { redSeg, blueSeg, phase: unit * 1.7 };
  }
  car.userData.wheels = wheels;
  car.userData.lightbar = lightbar;
  car.userData.plate = plate;
  car.userData.length = length;
  return car;
}

export function trafficPlate(rng) {
  const letters = rngPick(rng, TRAFFIC_PLATE_LETTERS) + rngPick(rng, TRAFFIC_PLATE_LETTERS);
  return "TC " + rngInt(rng, 1000, 9899) + " " + letters;
}

export function updateLightbar(car, t) {
  const lb = car.userData.lightbar;
  if (!lb) return;
  const on = Math.sin(t * 9 + lb.phase) > 0;
  lb.redSeg.material.color.setHex(on ? 0xff2222 : 0x571111);
  lb.blueSeg.material.color.setHex(on ? 0x113377 : 0x3377ff);
}

const trafficRng = mulberry32(99173);
export function randomTrafficPlate() { return trafficPlate(trafficRng); }
