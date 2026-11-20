// Teluk Cerah — vehicles. Every car is built from a smooth extruded side
// profile (no boxes-for-bodies), with physically based clearcoat paint,
// gradient glass, panel seams, mirrors, handles, detailed lenses, radial
// tyres and spoked rims. Police patrol cars get exactly the same body
// detail as the hero car — two-tone service livery, readable door text,
// unique service plates and a segmented lightbar on top.

import { HERO_PLATE, POLICE_PLATE_PREFIX } from "./config.js";

const PROFILES = {
  sedan: {
    body: [[-2.32, 0.30], [-2.38, 0.60], [-2.20, 0.85], [-1.55, 0.94], [0.95, 0.97], [1.85, 0.88], [2.28, 0.64], [2.37, 0.36], [2.30, 0.27], [-2.28, 0.27]],
    cabin: [[-1.58, 0.90], [-1.08, 1.37], [0.12, 1.44], [0.92, 1.03], [1.04, 0.90]],
    width: 1.68, cabinWidth: 1.46, wheelX: 1.45, roofX: -0.48, roofLen: 1.30,
  },
  hatch: {
    body: [[-2.05, 0.30], [-2.12, 0.62], [-2.02, 0.92], [-1.30, 0.97], [0.90, 0.99], [1.80, 0.88], [2.16, 0.62], [2.22, 0.36], [2.14, 0.27], [-2.00, 0.27]],
    cabin: [[-1.85, 0.92], [-1.55, 1.40], [0.05, 1.46], [0.88, 1.02], [1.00, 0.92]],
    width: 1.64, cabinWidth: 1.42, wheelX: 1.28, roofX: -0.72, roofLen: 1.55,
  },
  pickup: {
    body: [[-2.35, 0.32], [-2.38, 0.72], [-2.30, 0.95], [-0.30, 0.95], [0.90, 0.97], [1.85, 0.90], [2.30, 0.66], [2.38, 0.38], [2.30, 0.29], [-2.28, 0.29]],
    cabin: [[-0.35, 0.92], [-0.15, 1.42], [0.55, 1.46], [0.95, 1.02], [1.02, 0.92]],
    width: 1.74, cabinWidth: 1.50, wheelX: 1.50, roofX: 0.20, roofLen: 0.78,
  },
  van: {
    body: [[-2.30, 0.30], [-2.36, 0.70], [-2.28, 1.30], [-2.05, 1.52], [1.30, 1.52], [2.05, 1.10], [2.34, 0.62], [2.36, 0.36], [2.28, 0.27], [-2.26, 0.27]],
    cabin: [[-2.02, 1.10], [1.28, 1.10], [1.55, 1.50], [-1.85, 1.50]],
    width: 1.80, cabinWidth: 1.60, wheelX: 1.45, roofX: -0.30, roofLen: 3.10,
  },
};

function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.anisotropy = 4;
  return tex;
}

const flakeRoughness = canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = "#5a5a5a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const v = 60 + Math.floor(Math.random() * 60);
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
  }
});
flakeRoughness.wrapS = flakeRoughness.wrapT = THREE.RepeatWrapping;

const stripeTexture = canvasTexture(256, 32, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.85)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
});

const rimTexture = canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = "#202226"; g.beginPath(); g.arc(64, 64, 63, 0, 7); g.fill();
  g.strokeStyle = "#c9ccd4"; g.lineWidth = 7;
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.beginPath(); g.moveTo(64, 64);
    g.lineTo(64 + Math.cos(a) * 52, 64 + Math.sin(a) * 52); g.stroke();
  }
  g.fillStyle = "#e8eaf0"; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.stroke;
  g.fillStyle = "#9aa0ac"; g.beginPath(); g.arc(64, 64, 13, 0, 7); g.fill();
});

const lensTexture = canvasTexture(128, 32, (g, w, h) => {
  g.fillStyle = "#f4f6ff"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#b9c6de";
  for (let x = 6; x < w; x += 14) g.fillRect(x, 3, 5, h - 6);
  g.fillStyle = "rgba(255,220,150,0.65)"; g.fillRect(0, h - 8, w, 5);
});

const puffTexture = canvasTexture(64, 64, (g) => {
  const rg = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  rg.addColorStop(0, "rgba(216,196,170,0.5)");
  rg.addColorStop(1, "rgba(216,196,170,0)");
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
});

function plateTexture(text, bg, fg, header) {
  return canvasTexture(256, 64, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = fg; g.textAlign = "center";
    if (header) { g.font = "bold 15px Arial"; g.fillText(header, w / 2, 19); }
    g.font = "bold 34px Arial";
    g.fillText(text, w / 2, header ? 52 : 44);
  });
}

function policeDoorTexture(unitLabel) {
  return canvasTexture(512, 176, (g, w, h) => {
    g.fillStyle = "#16283f"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#e8b13c"; g.fillRect(0, 18, w, 10);
    g.fillStyle = "#f2f4f6"; g.fillRect(0, h - 26, w, 8);
    g.fillStyle = "#ffffff"; g.textAlign = "center";
    g.font = "bold 64px Arial"; g.fillText("PATROLI", w / 2, 92);
    g.font = "bold 21px Arial"; g.fillStyle = "#cfe0f2";
    g.fillText("SATLANTAS TELUK CERAH", w / 2, 126);
    g.font = "bold 19px Arial"; g.fillStyle = "#e8b13c";
    g.fillText(unitLabel, w / 2, 156);
    g.beginPath(); g.arc(42, 60, 24, 0, 7);
    g.fillStyle = "#e8b13c"; g.fill();
    g.fillStyle = "#16283f"; g.font = "bold 22px Arial"; g.fillText("★", 42, 68);
  });
}

function extrudeProfile(points, depth, bevel) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i][0], points[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9,
    bevelSegments: 3, steps: 1, curveSegments: 6,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

function paintMaterial(color, envMap) {
  return new THREE.MeshPhysicalMaterial({
    color, metalness: 0.55, roughness: 0.62, roughnessMap: flakeRoughness,
    clearcoat: 1.0, clearcoatRoughness: 0.14, envMap, envMapIntensity: 1.15,
  });
}

function glassMaterial(envMap) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x1c2a38, metalness: 0.2, roughness: 0.08, envMap, envMapIntensity: 1.6,
    transparent: true, opacity: 0.92,
  });
}

export function buildVehicle(envMap, opts) {
  const kind = opts.kind || "sedan";
  const prof = PROFILES[kind] || PROFILES.sedan;
  const group = new THREE.Group();
  const paint = paintMaterial(opts.color, envMap);
  const darkTrim = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.6, metalness: 0.3 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dce4, roughness: 0.22, metalness: 1.0, envMap, envMapIntensity: 1.4 });

  const body = new THREE.Mesh(extrudeProfile(prof.body, prof.width - 0.14, 0.07), paint);
  body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // cabin glass with sky gradient + a body-colour roof and dark pillars
  const cabin = new THREE.Mesh(extrudeProfile(prof.cabin, prof.cabinWidth - 0.1, 0.05), glassMaterial(envMap));
  cabin.castShadow = true;
  group.add(cabin);
  const interior = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.42, prof.cabinWidth - 0.34),
    new THREE.MeshStandardMaterial({ color: 0x0c0e12, roughness: 0.95 }));
  interior.position.set(-0.25, 1.06, 0);
  group.add(interior);
  const roofY = kind === "van" ? 1.56 : 1.47;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(prof.roofLen, 0.055, prof.cabinWidth - 0.16), paint);
  roof.position.set(prof.roofX, roofY, 0); roof.castShadow = true;
  group.add(roof);
  for (const sx of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.5, 0.05), darkTrim);
    pillar.position.set(-0.18, 1.2, sx * (prof.cabinWidth / 2 - 0.02));
    group.add(pillar);
    // diagonal sun glare streak on the glass
    const glare = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.13),
      new THREE.MeshBasicMaterial({ map: stripeTexture, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    glare.position.set(0.35, 1.22, sx * (prof.cabinWidth / 2 + 0.035));
    glare.rotation.z = -0.5; glare.rotation.y = sx > 0 ? 0 : Math.PI;
    group.add(glare);
    // clearcoat highlight ribbon flowing along the body side
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.15),
      new THREE.MeshBasicMaterial({ map: stripeTexture, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false }));
    ribbon.position.set(-0.1, 0.82, sx * (prof.width / 2 + 0.045));
    if (sx < 0) ribbon.rotation.y = Math.PI;
    group.add(ribbon);
    // panel seams: two door shut-lines and a rocker line per side
    for (const seamX of [-0.62, 0.52]) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.52, 0.012),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.8 }));
      seam.position.set(seamX, 0.60, sx * (prof.width / 2 + 0.048));
      group.add(seam);
    }
    const rocker = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.03, 0.012), darkTrim);
    rocker.position.set(-0.05, 0.36, sx * (prof.width / 2 + 0.048));
    group.add(rocker);
    // door handles and mirrors
    for (const hx of [-0.38, 0.38]) {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.035, 0.03), chrome);
      handle.position.set(hx, 0.88, sx * (prof.width / 2 + 0.05));
      group.add(handle);
    }
    const mirror = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.14), darkTrim);
    stem.position.z = sx * 0.07;
    const shell = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.13, 0.17), paint);
    shell.position.set(0, 0.03, sx * 0.16);
    mirror.add(stem, shell);
    mirror.position.set(0.82, 1.08, sx * (prof.width / 2 + 0.02));
    group.add(mirror);
    // dark wheel-arch backing
    for (const wx of [-prof.wheelX, prof.wheelX]) {
      const arch = new THREE.Mesh(new THREE.CircleGeometry(0.43, 20),
        new THREE.MeshStandardMaterial({ color: 0x08080a, roughness: 1 }));
      arch.position.set(wx, 0.36, sx * (prof.width / 2 + 0.028));
      if (sx < 0) arch.rotation.y = Math.PI;
      group.add(arch);
    }
  }

  // bumpers, grille, lenses
  const bumperF = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, prof.width + 0.06), paint);
  bumperF.position.set(2.30, 0.33, 0); group.add(bumperF);
  const bumperR = bumperF.clone(); bumperR.position.x = -2.30; group.add(bumperR);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.92), chrome);
  grille.position.set(2.44, 0.60, 0); group.add(grille);
  const lensMat = new THREE.MeshStandardMaterial({ map: lensTexture, emissive: 0xfff0c8, emissiveIntensity: 0.5, roughness: 0.3 });
  for (const sz of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.13, 0.44), lensMat);
    lens.position.set(2.43, 0.72, sz * 0.56);
    group.add(lens);
  }
  const brakeMat = new THREE.MeshStandardMaterial({ color: 0x7a0f14, emissive: 0xd21f26, emissiveIntensity: 0.7, roughness: 0.35 });
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, prof.width - 0.2), brakeMat);
  tail.position.set(-2.44, 0.78, 0); group.add(tail);
  for (const ex of [-0.5]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 10), chrome);
    pipe.rotation.z = Math.PI / 2; pipe.position.set(-2.44, 0.22, ex);
    group.add(pipe);
  }
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.07, 0.05), paint);
  fin.position.set(-1.15, roofY + 0.05, 0); group.add(fin);

  // licence plates, front and rear
  const plateTex = opts.plateTex;
  if (plateTex) {
    const pMat = new THREE.MeshBasicMaterial({ map: plateTex });
    const rear = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.16), pMat);
    rear.position.set(-2.47, 0.52, 0); rear.rotation.y = Math.PI;
    group.add(rear);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.16), pMat);
    front.position.set(2.47, 0.48, 0);
    group.add(front);
  }

  // wheels: pivot (steer) -> spin group -> tyre + rim faces
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x131417, roughness: 0.92 });
  const rimMat = new THREE.MeshStandardMaterial({ map: rimTexture, roughness: 0.3, metalness: 0.8, envMap, envMapIntensity: 1.1 });
  const wheels = [];
  for (const [wx, wz, front] of [[prof.wheelX, 0.84, 1], [prof.wheelX, -0.84, 1], [-prof.wheelX, 0.84, 0], [-prof.wheelX, -0.84, 0]]) {
    const pivot = new THREE.Group();
    pivot.position.set(wx, 0.34, wz);
    const spin = new THREE.Group();
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.25, 26), tyreMat);
    tyre.rotation.x = Math.PI / 2; tyre.castShadow = true;
    spin.add(tyre);
    for (const fz of [-1, 1]) {
      const rim = new THREE.Mesh(new THREE.CircleGeometry(0.215, 20), rimMat);
      rim.position.z = fz * 0.128;
      if (fz < 0) rim.rotation.y = Math.PI;
      spin.add(rim);
    }
    pivot.add(spin);
    group.add(pivot);
    wheels.push({ pivot, spin, front: !!front });
  }

  // dust / spray puffs behind the rear wheels, woken by speed
  const puffs = [];
  for (const pz of [-0.7, 0.7]) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTexture, transparent: true, opacity: 0, depthWrite: false }));
    s.position.set(-2.6, 0.3, pz); s.scale.set(1.2, 0.8, 1);
    group.add(s); puffs.push(s);
  }

  const v = { group, wheels, brakeMat, puffs, speed: 0, steer: 0, lightMats: null, paintMat: paint };
  if (opts.police) addPoliceKit(v, envMap, opts);
  group.traverse((o) => { if (o.isMesh) o.matrixAutoUpdate = true; });
  return v;
}

function addPoliceKit(v, envMap, opts) {
  const group = v.group;
  const unitLabel = `UNIT ${opts.unit}`;
  const doorTex = policeDoorTexture(unitLabel);
  const doorMat = new THREE.MeshPhysicalMaterial({
    map: doorTex, metalness: 0.4, roughness: 0.4, clearcoat: 0.9,
    clearcoatRoughness: 0.2, envMap, envMapIntensity: 1.0,
  });
  for (const sx of [-1, 1]) {
    const door = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.56), doorMat);
    door.position.set(-0.05, 0.63, sx * 0.905);
    if (sx < 0) door.rotation.y = Math.PI;
    group.add(door);
    // navy fender band tying the livery together
    const band = new THREE.Mesh(new THREE.BoxGeometry(4.35, 0.07, 0.015),
      new THREE.MeshStandardMaterial({ color: 0x16283f, roughness: 0.45, metalness: 0.3 }));
    band.position.set(0, 0.40, sx * 0.905);
    group.add(band);
  }
  // push bar on the nose
  const barMat = new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.5, metalness: 0.6 });
  const push = new THREE.Group();
  for (const pz of [-0.55, 0.55]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.42, 0.07), barMat);
    post.position.set(0, 0, pz); push.add(post);
  }
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 1.25), barMat);
  cross.position.y = 0.12; push.add(cross);
  const cross2 = cross.clone(); cross2.position.y = -0.12; push.add(cross2);
  push.position.set(2.52, 0.48, 0);
  group.add(push);
  // segmented lightbar: red / clear / blue sections in a dark housing
  const lightbar = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 1.24),
    new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.4, metalness: 0.4 }));
  lightbar.add(housing);
  const redMat = new THREE.MeshStandardMaterial({ color: 0x55060a, emissive: 0xff1a22, emissiveIntensity: 0.4 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x061a55, emissive: 0x2255ff, emissiveIntensity: 0.4 });
  const clearMat = new THREE.MeshStandardMaterial({ color: 0xd8dce2, emissive: 0xffffff, emissiveIntensity: 0.15 });
  const segMats = [redMat, redMat, clearMat, blueMat, blueMat];
  segMats.forEach((m, i) => {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.21), m);
    seg.position.set(0, 0.075, -0.48 + i * 0.24);
    lightbar.add(seg);
  });
  lightbar.position.set(-0.48, 1.53, 0);
  group.add(lightbar);
  v.lightMats = { red: redMat, blue: blueMat };
  // A-pillar spot lamp
  const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10),
    new THREE.MeshStandardMaterial({ color: 0x22242a, roughness: 0.4, metalness: 0.6 }));
  spot.rotation.z = 1.1; spot.position.set(0.88, 1.14, 0.82);
  group.add(spot);
}

export function heroVehicle(envMap) {
  return buildVehicle(envMap, {
    kind: "sedan", color: 0xc22418,
    plateTex: plateTexture(HERO_PLATE, "#f4f2ec", "#1a1c22", null),
  });
}

export function policeVehicle(envMap, unit, plateNo) {
  return buildVehicle(envMap, {
    kind: "sedan", color: 0xf2f3f5, police: true, unit,
    plateTex: plateTexture(`${POLICE_PLATE_PREFIX} ${unit}-${plateNo}`, "#16283f", "#ffffff", "DINAS KEPOLISIAN"),
  });
}

export function trafficVehicle(envMap, rng, type) {
  const color = rng.pick(type.colors);
  const plate = `${rng.pick(["TC", "BL", "KT", "DR"])} ${rng.int(1000, 9899)} ${rng.pick(["A", "B", "K", "M", "S"])}`;
  return buildVehicle(envMap, {
    kind: type.kind, color,
    plateTex: plateTexture(plate, "#f4f2ec", "#1a1c22", null),
  });
}

// Per-frame visual update: wheel spin and steer, body roll and pitch,
// brake-light flare, police lightbar strobe, dust puffs at speed.
export function updateVehicleVisual(v, dt, t) {
  const spinDelta = (v.speed * dt) / 0.34;
  for (const w of v.wheels) {
    w.spin.rotation.z -= spinDelta;
    if (w.front) w.pivot.rotation.y = v.steer * 0.9;
  }
  v.group.rotation.z = THREE.MathUtils.clamp(-v.steer * v.speed * 0.0035, -0.05, 0.05);
  v.group.rotation.x = THREE.MathUtils.clamp((v.accel || 0) * 0.0016, -0.03, 0.03);
  if (v.brakeMat) v.brakeMat.emissiveIntensity = v.braking ? 2.4 : 0.7;
  if (v.lightMats) {
    const phase = Math.floor(t * 5.2) % 2;
    v.lightMats.red.emissiveIntensity = phase === 0 ? 3.2 : 0.25;
    v.lightMats.blue.emissiveIntensity = phase === 1 ? 3.2 : 0.25;
  }
  const puffOn = Math.abs(v.speed) > 9;
  v.puffs.forEach((p, i) => {
    const target = puffOn ? 0.11 + 0.05 * Math.sin(t * 9 + i * 2.4) : 0;
    p.material.opacity += (target - p.material.opacity) * Math.min(1, dt * 6);
    const s = 1.1 + 0.5 * (0.5 + 0.5 * Math.sin(t * 7 + i * 1.7));
    p.scale.set(s, s * 0.62, 1);
  });
}
