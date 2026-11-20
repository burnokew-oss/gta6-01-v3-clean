// Kendaraan berbentuk sungguhan: bodi extrude melengkung, glasshouse, roda berjari-jari.
// Konvensi: depan mobil menghadap +Z lokal; heading memakai atan2(x, z).
import "three";
const THREE = window.THREE;
import { CONFIG } from "./config.js";
import { makeRng } from "./random.js";

function bodyGeometry(len, wid, hei, sporty) {
  const s = new THREE.Shape();
  const hl = len / 2;
  s.moveTo(-hl, 0.12);
  s.quadraticCurveTo(-hl - 0.06, hei * 0.55, -hl + 0.25, hei * 0.78);
  s.quadraticCurveTo(-hl + len * 0.3, hei, -len * (sporty ? 0.05 : 0.12), hei);
  s.quadraticCurveTo(len * 0.32, hei * 0.97, hl - 0.3, hei * 0.8);
  s.quadraticCurveTo(hl + 0.05, hei * 0.5, hl, 0.14);
  s.quadraticCurveTo(0, -0.04, -hl, 0.12);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: wid, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.09, bevelSegments: 3, steps: 1,
  });
  geo.translate(0, 0, -wid / 2);
  geo.rotateY(-Math.PI / 2);
  return geo;
}

function wheelMesh(radius) {
  const grp = new THREE.Group();
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.92 });
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.24, 20), tireMat);
  tire.rotation.z = Math.PI / 2; grp.add(tire);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 0.26, 12),
    new THREE.MeshStandardMaterial({ color: 0xc9ccd4, roughness: 0.3, metalness: 0.85 }));
  rim.rotation.z = Math.PI / 2; grp.add(rim);
  const spokeMat = new THREE.MeshStandardMaterial({ color: 0x8f959f, roughness: 0.35, metalness: 0.8 });
  for (let i = 0; i < 5; i++) {
    const sp = new THREE.Mesh(new THREE.BoxGeometry(0.27, radius * 1.04, 0.07), spokeMat);
    sp.rotation.x = (i / 5) * Math.PI; grp.add(sp);
  }
  const spin = new THREE.Group(); spin.add(grp); spin.userData.inner = grp;
  return spin;
}

const glassMat = new THREE.MeshPhysicalMaterial({
  color: 0x1a2438, roughness: 0.06, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.08,
  transparent: true, opacity: 0.92,
});

function plateTexture() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 34;
  const g = c.getContext("2d");
  g.fillStyle = "#f4f4ee"; g.fillRect(0, 0, 128, 34);
  g.fillStyle = "#182038"; g.font = "bold 20px monospace"; g.textAlign = "center";
  g.fillText("TC RAKA", 64, 24);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let sharedPlateTex = null;

export function buildCarMesh(type, colorHex) {
  const g = new THREE.Group();
  const dims = { sedan: [4.4, 1.85, 0.62], taksi: [4.4, 1.85, 0.62], sport: [4.6, 1.95, 0.52], van: [4.8, 1.95, 0.95], truk: [5.6, 2.1, 0.9], polisi: [4.5, 1.9, 0.6] }[type] || [4.4, 1.85, 0.62];
  const [len, wid, bodyH] = dims;
  const paint = new THREE.MeshPhysicalMaterial({
    color: colorHex, roughness: 0.22, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.12,
  });
  const body = new THREE.Mesh(bodyGeometry(len, wid - 0.18, bodyH, type === "sport"), paint);
  body.position.y = 0.32; body.castShadow = true; g.add(body);

  const cabinLen = type === "van" || type === "truk" ? len * 0.42 : len * 0.46;
  const cabin = new THREE.Mesh(bodyGeometry(cabinLen, wid - 0.42, type === "van" ? 0.62 : 0.44, false), glassMat);
  cabin.position.set(0, 0.32 + bodyH - 0.06, type === "truk" ? len * 0.22 : len * 0.04);
  cabin.castShadow = true; g.add(cabin);

  const hlStrip = new THREE.Mesh(new THREE.BoxGeometry(wid + 0.02, 0.035, len * 0.8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.26 }));
  hlStrip.position.y = 0.32 + bodyH * 0.82; g.add(hlStrip);

  const wheelR = type === "truk" ? 0.46 : 0.36;
  const wheels = [];
  for (const [wx, wz] of [[wid / 2 - 0.05, len * 0.32], [-wid / 2 + 0.05, len * 0.32], [wid / 2 - 0.05, -len * 0.32], [-wid / 2 + 0.05, -len * 0.32]]) {
    const w = wheelMesh(wheelR); w.position.set(wx, wheelR, wz); g.add(w); wheels.push(w);
  }
  g.userData.wheels = wheels;

  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a3c });
  for (const sx of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), headMat);
    h.scale.set(0.8, 0.6, 1.4); h.position.set(sx * wid * 0.3, 0.62, len / 2 + 0.03); g.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.09, 0.05), tailMat);
    t.position.set(sx * wid * 0.28, 0.68, -len / 2 - 0.04); g.add(t);
  }
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.6, metalness: 0.3 });
  const bf = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.1, 0.16, 0.18), bumperMat); bf.position.set(0, 0.3, len / 2 + 0.02); g.add(bf);
  const bb = bf.clone(); bb.position.z = -len / 2 - 0.02; g.add(bb);
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.16, 10),
    new THREE.MeshStandardMaterial({ color: 0xb9bec8, metalness: 0.9, roughness: 0.25 }));
  exhaust.rotation.x = Math.PI / 2; exhaust.position.set(wid * 0.3, 0.22, -len / 2 - 0.1); g.add(exhaust);
  if (!sharedPlateTex) sharedPlateTex = plateTexture();
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.14), new THREE.MeshBasicMaterial({ map: sharedPlateTex }));
  plate.position.set(0, 0.52, -len / 2 - 0.12); plate.rotation.y = Math.PI; g.add(plate);

  if (type === "sport") {
    const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x1c1e24, roughness: 0.35, metalness: 0.5 });
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(wid * 0.82, 0.05, 0.3), spoilerMat);
    spoiler.position.set(0, 1.06, -len / 2 + 0.18); spoiler.rotation.x = -0.1; g.add(spoiler);
    for (const sx of [-1, 1]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), spoilerMat);
      post.position.set(sx * wid * 0.32, 0.94, -len / 2 + 0.18); g.add(post);
    }
  }
  if (type === "polisi") {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(wid + 0.06, 0.2, len * 0.86),
      new THREE.MeshStandardMaterial({ color: 0x2456c8, roughness: 0.4 }));
    stripe.position.y = 0.52; g.add(stripe);
    const bar = new THREE.Group(); bar.position.y = 0.32 + bodyH + 0.44; g.add(bar);
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, 0.3), bumperMat); bar.add(base);
    const red = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.11, 0.24), new THREE.MeshBasicMaterial({ color: 0xff2438 }));
    red.position.x = -0.3; bar.add(red);
    const blue = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.11, 0.24), new THREE.MeshBasicMaterial({ color: 0x2a7bff }));
    blue.position.x = 0.3; bar.add(blue);
    g.userData.lightbar = { red, blue };
  }
  if (type === "taksi") {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.5), new THREE.MeshBasicMaterial({ color: 0xffe98a }));
    sign.position.set(0, 0.32 + bodyH + 0.52, 0); g.add(sign);
  }
  if (type === "truk") {
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(wid - 0.06, 1.35, len * 0.52),
      new THREE.MeshStandardMaterial({ color: 0xd8dce2, roughness: 0.55 }));
    cargo.position.set(0, 1.15, -len * 0.2); cargo.castShadow = true; g.add(cargo);
  }
  return g;
}

export function createCar(state, type, colorHex, x, z, heading, lane) {
  const mesh = buildCarMesh(type, colorHex);
  mesh.position.set(x, 0, z); mesh.rotation.y = heading;
  state.world.scene.add(mesh);
  return {
    mesh, type, spec: CONFIG.carTypes[type], pos: mesh.position, heading,
    speed: 0, lane: lane || null, health: 100, parked: false, driver: true, color: colorHex, nos: 1,
  };
}

export function createTraffic(state, count) {
  const rng = makeRng(77);
  const cars = [];
  const types = ["sedan", "sedan", "taksi", "van", "sport", "truk"];
  for (let i = 0; i < count; i++) {
    const vertical = i % 2 === 0;
    const axis = vertical ? CONFIG.avenueXs[i % CONFIG.avenueXs.length] : CONFIG.streetZs[i % CONFIG.streetZs.length];
    const along = rng.range(-190, 190);
    const dir = i % 4 < 2 ? 1 : -1;
    const laneOff = 3.6 * dir;
    const x = vertical ? axis + laneOff : along;
    const z = vertical ? along : axis - laneOff;
    const heading = vertical ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    const type = types[i % types.length];
    const car = createCar(state, type, rng.pick(CONFIG.carTypes[type].colors), x, z, heading, { vertical, axis, dir });
    car.speed = rng.range(9, 15);
    cars.push(car);
  }
  // Mobil parkir yang bisa dicuri di dekat titik mulai.
  const parked = createCar(state, "sport", 0xe84393, 7.5, 22, Math.PI, null);
  parked.parked = true; parked.driver = false; cars.push(parked);
  const parked2 = createCar(state, "sedan", 0x3a6ea8, -6, 44, 0, null);
  parked2.parked = true; parked2.driver = false; cars.push(parked2);
  return cars;
}

export function updateTraffic(state, dt) {
  const t = performance.now() / 1000;
  for (const car of state.cars) {
    if (car === state.player.car || car.parked || !car.lane) continue;
    const d = car.lane.dir;
    if (car.lane.vertical) car.pos.z += d * car.speed * dt;
    else car.pos.x += d * car.speed * dt;
    if (car.pos.x > 215) car.pos.x = -215; if (car.pos.x < -215) car.pos.x = 215;
    if (car.pos.z > 215) car.pos.z = -215; if (car.pos.z < -215) car.pos.z = 215;
    for (const w of car.mesh.userData.wheels || []) w.rotation.x -= car.speed * dt * 2.4;
    car.mesh.position.copy(car.pos);
  }
  for (const u of state.policeUnits || []) {
    if (u.lightbar) {
      const phase = Math.floor(t * 5) % 2 === 0;
      u.lightbar.red.material.color.setHex(phase ? 0xff2438 : 0x5c101c);
      u.lightbar.blue.material.color.setHex(phase ? 0x0f2f66 : 0x2a7bff);
    }
  }
}

export function nearestCar(state, point, maxDist) {
  let best = null, bestD = maxDist;
  const all = [...state.cars, ...(state.policeUnits || []).filter((u) => u.car).map((u) => u.car)];
  for (const car of all) {
    const d = car.pos.distanceTo(point);
    if (d < bestD) { bestD = d; best = car; }
  }
  return best;
}

export function driveCar(state, car, dt) {
  const k = state.input.keys;
  const spec = car.spec;
  const fwd = (k["KeyW"] ? 1 : 0) - (k["KeyS"] ? 1 : 0);
  const steer = (k["KeyA"] ? 1 : 0) - (k["KeyD"] ? 1 : 0);
  const hand = k["Space"];
  if (fwd > 0) car.speed = Math.min(car.speed + spec.accel * dt, spec.topSpeed);
  else if (fwd < 0) car.speed = Math.max(car.speed - spec.accel * 1.4 * dt, -11);
  else car.speed -= car.speed * Math.min(1, (hand ? 2.6 : 0.55) * dt);
  if ((k["ShiftLeft"] || k["ShiftRight"]) && car.nos > 0 && fwd > 0) {
    car.speed = Math.min(car.speed + 16 * dt, spec.topSpeed * 1.35);
    car.nos = Math.max(0, car.nos - dt * 0.4);
  } else car.nos = Math.min(1, car.nos + dt * 0.07);
  if (Math.abs(car.speed) > 0.4) {
    car.heading += steer * spec.grip * 0.32 * dt * Math.sign(car.speed) * Math.min(1, Math.abs(car.speed) / 12);
  }
  car.pos.x += Math.sin(car.heading) * car.speed * dt;
  car.pos.z += Math.cos(car.heading) * car.speed * dt;
  car.pos.x = THREE.MathUtils.clamp(car.pos.x, -208, 208);
  car.pos.z = THREE.MathUtils.clamp(car.pos.z, -208, 208);
  car.mesh.position.copy(car.pos);
  car.mesh.rotation.y = car.heading;
  car.mesh.rotation.z = -steer * Math.min(0.05, Math.abs(car.speed) * 0.0016);
  for (const w of car.mesh.userData.wheels || []) w.rotation.x -= car.speed * dt * 2.6;
  state.player.pos.copy(car.pos);
  return Math.abs(car.speed) * 3.6;
}
