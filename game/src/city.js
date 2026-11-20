// Teluk Cerah — the procedural coastal city: an organic grid of streets
// following the shoreline, richly textured facades with a readable light
// direction, named shopfronts, a market, a pier, landmarks, and a dense
// layer of street furniture so mid-distance never looks flat or pale.
// Wet asphalt carries geometric reflections of signs and lamps.

import { CITY, SHOP_NAMES, SHOPS } from "./config.js";

function ctex(w, h, draw, srgb = true) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = 4;
  return t;
}

const FACADE_BASES = ["#dec9a0", "#d9a066", "#b8574a", "#7fa3b8", "#c3cfd2", "#c98d5a", "#a8b89a", "#d4748a", "#8a97a8", "#e0bd62"];

function facadeTexture(rng, base, floors, shopName) {
  return ctex(256, 384, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const shopH = shopName ? 74 : 0;
    const bodyH = h - shopH;
    for (let f = 0; f < floors; f++) { // per-floor tonal banding
      g.fillStyle = `rgba(${rng.int(0, 40)},${rng.int(0, 26)},${rng.int(0, 10)},${rng.range(0.02, 0.10)})`;
      g.fillRect(0, (bodyH / floors) * f, w, bodyH / floors);
    }
    // weather staining near the ground and under the parapet
    const stain = g.createLinearGradient(0, bodyH - 60, 0, bodyH);
    stain.addColorStop(0, "rgba(70,50,30,0)"); stain.addColorStop(1, "rgba(70,50,30,0.35)");
    g.fillStyle = stain; g.fillRect(0, bodyH - 60, w, 60);
    g.fillStyle = "rgba(255,255,255,0.20)"; g.fillRect(0, 0, w, 5);
    const cols = 4, rows = floors;
    const cw = w / cols, ch = bodyH / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw + cw * 0.24, y = r * ch + ch * 0.20, ww = cw * 0.52, hh = ch * 0.56;
        g.fillStyle = "#3a3f46"; g.fillRect(x - 3, y - 3, ww + 6, hh + 6); // frame
        if (rng.chance(0.34)) { // warm lit window
          const lg = g.createLinearGradient(0, y, 0, y + hh);
          lg.addColorStop(0, "#ffe6a3"); lg.addColorStop(1, "#f2a94e");
          g.fillStyle = lg;
        } else { // sky-reflecting glass with a diagonal glare
          const lg = g.createLinearGradient(0, y, 0, y + hh);
          lg.addColorStop(0, "#bfe0f2"); lg.addColorStop(0.6, "#6f96b4"); lg.addColorStop(1, "#466a86");
          g.fillStyle = lg;
        }
        g.fillRect(x, y, ww, hh);
        g.fillStyle = "rgba(255,255,255,0.5)";
        g.beginPath(); g.moveTo(x + 3, y + hh); g.lineTo(x + ww * 0.45, y); g.lineTo(x + ww * 0.7, y); g.lineTo(x + ww * 0.28, y + hh); g.fill();
        if (rng.chance(0.4)) { // AC unit under some windows
          g.fillStyle = "#c9cdd2"; g.fillRect(x + ww * 0.2, y + hh + 4, ww * 0.6, 9);
          g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(x + ww * 0.2, y + hh + 10, ww * 0.6, 3);
        }
        if (rng.chance(0.3)) { // balcony rail hint
          g.strokeStyle = "rgba(40,44,50,0.65)"; g.lineWidth = 2;
          for (let b = 0; b < 4; b++) { g.beginPath(); g.moveTo(x - 4 + b * 5, y + hh + 2); g.lineTo(x - 4 + b * 5, y + hh + 14); g.stroke(); }
        }
      }
    }
    if (shopName) {
      const sy = bodyH;
      g.fillStyle = "#20242a"; g.fillRect(0, sy, w, 30); // sign band
      g.fillStyle = "#ffd76a"; g.font = "bold 19px Arial"; g.textAlign = "center";
      g.fillText(shopName.toUpperCase(), w / 2, sy + 21);
      // storefront glass with diagonal glare
      const lg = g.createLinearGradient(0, sy + 30, 0, h);
      lg.addColorStop(0, "#7fb6c9"); lg.addColorStop(1, "#2c4a5a");
      g.fillStyle = lg; g.fillRect(6, sy + 34, w - 12, h - sy - 38);
      g.fillStyle = "rgba(255,240,200,0.5)"; g.fillRect(20, sy + 38, 60, h - sy - 46);
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.beginPath(); g.moveTo(30, h); g.lineTo(110, sy + 34); g.lineTo(140, sy + 34); g.lineTo(60, h); g.fill();
    }
  });
}

const asphaltTex = ctex(256, 256, (g, w, h) => {
  g.fillStyle = "#2a2a2e"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5200; i++) {
    const v = 30 + Math.floor(Math.random() * 34);
    g.fillStyle = `rgb(${v},${v},${v + 4})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
  }
  g.fillStyle = "rgba(0,0,0,0.20)";
  g.fillRect(0, 100, w, 10); g.fillRect(0, 190, w, 7); // worn patches / seams
  g.fillStyle = "rgba(255,255,255,0.10)"; g.fillRect(0, 0, 5, h); g.fillRect(w - 5, 0, 5, h);
});
asphaltTex.wrapS = asphaltTex.wrapT = THREE.RepeatWrapping;

const dashTex = ctex(32, 128, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.fillStyle = "rgba(245,240,225,0.92)"; g.fillRect(10, 8, 12, 62);
});
dashTex.wrapS = dashTex.wrapT = THREE.RepeatWrapping;

const sidewalkTex = ctex(128, 128, (g, w, h) => {
  g.fillStyle = "#9a938a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const v = 130 + Math.floor(Math.random() * 40);
    g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
  g.strokeStyle = "rgba(60,55,50,0.5)"; g.lineWidth = 2;
  g.strokeRect(1, 1, w - 2, h - 2);
});
sidewalkTex.wrapS = sidewalkTex.wrapT = THREE.RepeatWrapping;

const streakTex = ctex(64, 256, (g, w, h) => {
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.7, "rgba(255,255,255,0.28)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.beginPath(); g.moveTo(14, 0); g.lineTo(50, 0); g.lineTo(40, h); g.lineTo(24, h); g.fill();
  for (let i = 0; i < 26; i++) { // ripple breaks in the reflection
    g.clearRect(0, Math.random() * h, w, 2);
  }
});

const frondTex = ctex(128, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = "#2e6b34"; g.lineWidth = 5;
  g.beginPath(); g.moveTo(64, 0); g.quadraticCurveTo(58, 128, 64, 256); g.stroke();
  g.lineWidth = 3.4; g.strokeStyle = "#3d8a44";
  for (let i = 0; i < 22; i++) {
    const y = 14 + i * 11, len = 52 - Math.abs(i - 11) * 2.4;
    g.beginPath(); g.moveTo(62, y); g.quadraticCurveTo(30, y + 12, 62 - len, y + 30); g.stroke();
    g.beginPath(); g.moveTo(66, y); g.quadraticCurveTo(98, y + 12, 66 + len, y + 30); g.stroke();
  }
});

const sandTex = ctex(256, 256, (g, w, h) => {
  g.fillStyle = "#dbb26e"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const v = 200 + Math.floor(Math.random() * 45);
    g.fillStyle = `rgb(${v},${v - 30},${v - 90})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
});
sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;

const seaTex = ctex(256, 256, (g, w, h) => {
  g.fillStyle = "#16677c"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(190,235,240,${0.05 + Math.random() * 0.13})`;
    g.lineWidth = 1.4;
    const y = Math.random() * h, x = Math.random() * w, len = 14 + Math.random() * 40;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + 2); g.stroke();
  }
});
seaTex.wrapS = seaTex.wrapT = THREE.RepeatWrapping;

function reflectionStreak(color, len, width, opacity) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len),
    new THREE.MeshBasicMaterial({ map: streakTex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.06;
  return m;
}

export function createCity(scene, rng, envMap) {
  const group = new THREE.Group();
  scene.add(group);
  const colliders = [];
  const animated = { neon: [], sea: null, foam: null, beam: null, flickerPhase: [] };

  const std = (color, rough = 0.9, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });

  // ---------- ground, beach, sea ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 420), std(0x5c4c38, 1));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.06, -10);
  ground.receiveShadow = true;
  group.add(ground);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(560, 34),
    new THREE.MeshStandardMaterial({ map: sandTex, roughness: 1 }));
  sand.material.map.repeat.set(18, 1.4);
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.0, CITY.beachZ + 13);
  sand.receiveShadow = true;
  group.add(sand);
  const seaMat = new THREE.MeshStandardMaterial({
    map: seaTex, roughness: 0.22, metalness: 0.05, envMap, envMapIntensity: 0.6,
  });
  seaMat.map.repeat.set(22, 6);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 190), seaMat);
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.25, CITY.seaZ + 92);
  group.add(sea);
  animated.sea = seaMat;
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(560, 2.6),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2; foam.position.set(0, 0.03, CITY.seaZ - 1);
  group.add(foam);
  animated.foam = foam;

  // ---------- roads, dashes, sidewalks ----------
  const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, roughness: 0.42, metalness: 0.08, envMap, envMapIntensity: 0.8 });
  const dashMat = new THREE.MeshBasicMaterial({ map: dashTex, transparent: true, depthWrite: false });
  const walkMat = new THREE.MeshStandardMaterial({ map: sidewalkTex, roughness: 0.95 });
  function road(cx, cz, wdt, len, alongX) {
    const t = asphaltTex.clone(); t.needsUpdate = true;
    t.repeat.set(alongX ? len / 16 : wdt / 16, alongX ? wdt / 16 : len / 16);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : wdt, alongX ? wdt : len),
      new THREE.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.08, envMap, envMapIntensity: 0.55 }));
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.02, cz);
    m.receiveShadow = true;
    group.add(m);
    const dt2 = dashTex.clone(); dt2.needsUpdate = true;
    dt2.repeat.set(1, len / 9);
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(alongX ? len : 0.5, alongX ? 0.5 : len),
      new THREE.MeshBasicMaterial({ map: dt2, transparent: true, depthWrite: false }));
    dash.rotation.x = -Math.PI / 2;
    if (!alongX) dash.rotation.z = Math.PI / 2;
    dash.position.set(cx, 0.045, cz);
    group.add(dash);
    for (const s of [-1, 1]) {
      const wt = sidewalkTex.clone(); wt.needsUpdate = true;
      wt.repeat.set(alongX ? len / 2.4 : 1, alongX ? 1 : len / 2.4);
      const walk = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : 2.4, 0.14, alongX ? 2.4 : len),
        new THREE.MeshStandardMaterial({ map: wt, roughness: 0.95, color: 0xb8b0a2 }));
      walk.position.set(alongX ? cx : cx + s * (wdt / 2 + 1.2), 0.07, alongX ? cz + s * (wdt / 2 + 1.2) : cz);
      walk.receiveShadow = true;
      group.add(walk);
    }
  }
  for (const x of CITY.streetsX) road(x, (CITY.minZ + CITY.coastRoadZ) / 2, CITY.roadW, CITY.coastRoadZ - CITY.minZ, false);
  for (const z of CITY.avenuesZ) road(0, z, CITY.roadW, CITY.maxX - CITY.minX, true);
  road(0, CITY.coastRoadZ, CITY.coastRoadW, CITY.maxX - CITY.minX, true);

  // ---------- lamps with wet-road reflections ----------
  const poleMat = std(0x2c3036, 0.5, { metalness: 0.6 });
  const lampGlowMat = new THREE.MeshStandardMaterial({ color: 0xffedb8, emissive: 0xffc46a, emissiveIntensity: 2.2 });
  function lamp(x, z, rotY) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.10, 5.4, 8), poleMat);
    pole.position.y = 2.7; pole.castShadow = true; g.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.08), poleMat);
    arm.position.set(0.7, 5.35, 0); g.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.22), lampGlowMat);
    head.position.set(1.35, 5.3, 0); g.add(head);
    g.position.set(x, 0, z); g.rotation.y = rotY;
    group.add(g);
    const streak = reflectionStreak(0xffbe78, 4.6, 0.85, 0.12);
    streak.position.set(x + Math.cos(rotY) * 1.4, 0.06, z - Math.sin(rotY) * 1.4);
    group.add(streak);
  }
  for (const z of [...CITY.avenuesZ, CITY.coastRoadZ]) {
    for (let x = CITY.minX + 16; x < CITY.maxX; x += 49) {
      lamp(x, z - CITY.roadW / 2 - 1.1, 0);
      lamp(x + 24, z + CITY.roadW / 2 + 1.1, Math.PI);
    }
  }
  for (const x of CITY.streetsX) {
    for (let z = CITY.minZ + 26; z < CITY.coastRoadZ - 10; z += 66) lamp(x - CITY.roadW / 2 - 1.1, z, -Math.PI / 2);
  }

  // ---------- buildings ----------
  const facadeCache = new Map();
  function facade(base, floors, shopName) {
    const key = `${base}|${floors}|${shopName || ""}`;
    if (!facadeCache.has(key)) facadeCache.set(key, facadeTexture(rng, base, floors, shopName));
    return facadeCache.get(key);
  }
  const roofMat = std(0x4c423a, 1);
  let shopIdx = 0;
  function building(x, z, wdt, dep, floors, shopName) {
    const hgt = floors * 3.1 + 1.2;
    const base = rng.pick(FACADE_BASES);
    const texF = facade(base, floors, shopName);
    const sideMat = new THREE.MeshStandardMaterial({ map: texF, roughness: 0.85, envMap, envMapIntensity: 0.35 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(wdt, hgt, dep),
      [sideMat, sideMat, roofMat, roofMat, sideMat, sideMat]);
    mesh.position.set(x, hgt / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh);
    const parapet = new THREE.Mesh(new THREE.BoxGeometry(wdt + 0.3, 0.5, dep + 0.3), std(new THREE.Color(base).multiplyScalar(0.82).getHex(), 0.9));
    parapet.position.set(x, hgt + 0.2, z); parapet.castShadow = true;
    group.add(parapet);
    if (rng.chance(0.6)) { // rooftop AC boxes and a water tank silhouette
      const ac = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.0), std(0xb9bdc2, 0.7, { metalness: 0.4 }));
      ac.position.set(x + rng.range(-wdt / 4, wdt / 4), hgt + 0.6, z + rng.range(-dep / 4, dep / 4));
      ac.castShadow = true; group.add(ac);
    }
    if (shopName) { // awning + neon glow + its reflection on the wet street
      const awn = new THREE.Mesh(new THREE.BoxGeometry(wdt * 0.8, 0.08, 1.6),
        std(rng.pick([0xc23b2e, 0x2e7ab8, 0xe8b13c, 0x3fa76a]), 0.8));
      awn.position.set(x, 3.1, z + dep / 2 + 0.7); awn.rotation.x = 0.35;
      awn.castShadow = true; group.add(awn);
      const neonColor = rng.pick([0xff5a3c, 0xffb03a, 0x3ad2ff, 0xff5ad2, 0x7dff5a]);
      const neonMat = new THREE.MeshStandardMaterial({ color: 0x181818, emissive: neonColor, emissiveIntensity: 2.4 });
      const neon = new THREE.Mesh(new THREE.BoxGeometry(wdt * 0.7, 0.28, 0.1), neonMat);
      neon.position.set(x, 3.75, z + dep / 2 + 0.12);
      group.add(neon);
      animated.neon.push(neonMat);
      animated.flickerPhase.push(rng.range(0, 20));
      const streak = reflectionStreak(neonColor, 5.5, 2.0, 0.22);
      streak.position.set(x, 0.06, z + dep / 2 + 3.4);
      group.add(streak);
    }
    colliders.push({ minX: x - wdt / 2 - 0.4, maxX: x + wdt / 2 + 0.4, minZ: z - dep / 2 - 0.4, maxZ: z + dep / 2 + 0.4 });
    return mesh;
  }

  const rowBounds = [];
  for (let i = 0; i < CITY.streetsX.length - 1; i++) {
    for (let j = 0; j < CITY.avenuesZ.length - 1; j++) {
      rowBounds.push([CITY.streetsX[i], CITY.streetsX[i + 1], CITY.avenuesZ[j], CITY.avenuesZ[j + 1]]);
    }
    rowBounds.push([CITY.streetsX[i], CITY.streetsX[i + 1], CITY.avenuesZ[CITY.avenuesZ.length - 1], CITY.coastRoadZ - 10]);
  }
  for (const [x0, x1, z0, z1] of rowBounds) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const bw = x1 - x0 - CITY.roadW - 7, bd = z1 - z0 - CITY.roadW - 7;
    if (cx > 0 && cx < 70 && cz < -80 && cz > -170) { // Taman Teluk park block
      const lawn = new THREE.Mesh(new THREE.PlaneGeometry(bw, bd), std(0x4e7d3a, 1));
      lawn.rotation.x = -Math.PI / 2; lawn.position.set(cx, 0.04, cz); lawn.receiveShadow = true;
      group.add(lawn);
      continue;
    }
    const tall = cz < -60 ? rng.int(6, 13) : rng.int(3, 7);
    const shopHere = rng.chance(0.5) ? SHOP_NAMES[shopIdx++ % SHOP_NAMES.length] : null;
    building(cx - bw / 4, cz, bw / 2 - 1.5, bd, tall, shopHere);
    building(cx + bw / 4, cz - bd / 6, bw / 2 - 1.5, bd * 0.62, Math.max(2, tall - rng.int(1, 4)), rng.chance(0.35) ? SHOP_NAMES[shopIdx++ % SHOP_NAMES.length] : null);
    if (rng.chance(0.7)) building(cx + bw / 5, cz + bd / 3.4, bw * 0.42, bd * 0.3, rng.int(2, 5), null);
  }
  // the four playable shops get landmark buildings at their corners
  for (const s of SHOPS) {
    const b = building(s.x, s.z - 8, 17, 12, 4, s.name);
    b.position.z = s.z - 8;
  }

  buildPalmsAndProps(group, rng, std, animated, reflectionStreak);
  buildLandmarks(group, rng, std, animated);
  buildBackdrop(group, rng, envMap);

  return {
    group, colliders,
    update(t, dt) {
      animated.sea.map.offset.x = (t * 0.008) % 1;
      animated.sea.map.offset.y = Math.sin(t * 0.4) * 0.01;
      animated.foam.material.opacity = 0.26 + 0.12 * Math.sin(t * 0.9);
      animated.neon.forEach((m, i) => {
        const p = animated.flickerPhase[i];
        m.emissiveIntensity = 2.3 + Math.sin(t * 2.1 + p) * 0.25 + (Math.sin(t * 13 + p * 3) > 0.96 ? -1.4 : 0);
      });
      if (animated.beam) animated.beam.rotation.y = t * 0.45;
    },
  };
}

function buildPalmsAndProps(group, rng, std, animated, reflectionStreak) {
  const trunkMat = std(0x7a5a3c, 1);
  const frondMat = new THREE.MeshStandardMaterial({
    map: frondTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.9,
  });
  function palm(x, z, s = 1) {
    const g = new THREE.Group();
    let px = 0, pz = 0;
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.13 - i * 0.012, 0.16 - i * 0.012, 1.4, 7), trunkMat);
      px += Math.sin(i * 0.35) * 0.16; pz += i * 0.03;
      seg.position.set(px, 0.65 + i * 1.3, pz);
      seg.rotation.z = -0.10 - i * 0.03;
      seg.castShadow = true;
      g.add(seg);
    }
    const topX = px + 0.3, topY = 5.6;
    for (let i = 0; i < 6; i++) {
      const f = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 2.6), frondMat);
      const a = (i / 7) * Math.PI * 2;
      f.position.set(topX + Math.cos(a) * 0.85, topY + 0.28, Math.sin(a) * 0.85);
      f.rotation.set(0.9, a, 0, "YXZ");
      f.castShadow = true;
      g.add(f);
    }
    for (let i = 0; i < 2; i++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), std(0x5a4632, 1));
      nut.position.set(topX + rng.range(-0.2, 0.2), topY - 0.12, rng.range(-0.2, 0.2));
      g.add(nut);
    }
    g.position.set(x, 0, z); g.scale.setScalar(s);
    g.rotation.y = rng.range(0, 6.28);
    group.add(g);
  }
  for (let x = CITY.minX + 8; x < CITY.maxX; x += 18) { // the coastal promenade
    palm(x, CITY.coastRoadZ + 10.5, rng.range(0.9, 1.2));
    if (rng.chance(0.5)) palm(x + 6, CITY.beachZ + rng.range(4, 16), rng.range(0.8, 1.1));
  }
  for (const [x, z] of [[30, -120], [48, -104], [12, -136], [-60, 44], [96, 44], [-168, 60], [150, -60], [-30, 100]]) {
    palm(x + rng.range(-3, 3), z + rng.range(-3, 3), rng.range(0.85, 1.1));
  }

  // planters, benches, bus shelter along the promenade
  for (let x = -220; x < 230; x += 28) {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 0.9), std(0xb8574a, 0.9));
    planter.position.set(x, 0.28, CITY.coastRoadZ + 9.2); planter.castShadow = true;
    group.add(planter);
    const bush = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), std(0x3d7a34, 1));
    bush.position.set(x, 0.75, CITY.coastRoadZ + 9.2); bush.scale.y = 0.7; bush.castShadow = true;
    group.add(bush);
  }
  const shelter = new THREE.Group();
  const sRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 1.6), std(0x2e4a5a, 0.6, { metalness: 0.4 }));
  sRoof.position.y = 2.4; shelter.add(sRoof);
  const sGlass = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.9, 0.05),
    new THREE.MeshPhysicalMaterial({ color: 0x9fc8de, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.4 }));
  sGlass.position.set(0, 1.25, -0.7); shelter.add(sGlass);
  const sBench = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.08, 0.5), std(0x8a6a44, 0.9));
  sBench.position.set(0, 0.62, -0.4); shelter.add(sBench);
  shelter.position.set(-96, 0, CITY.coastRoadZ + 9.4);
  group.add(shelter);

  // market stalls with coloured canopies near Pasar Pagi
  const canopyCols = [0xc23b2e, 0xe8b13c, 0x2e7ab8, 0x3fa76a, 0xd4748a];
  for (let i = 0; i < 6; i++) {
    const st = new THREE.Group();
    const can = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 2.6), std(canopyCols[i % 5], 0.85));
    can.position.y = 2.3; can.rotation.x = 0.1; can.castShadow = true; st.add(can);
    for (const [px, pz] of [[-1.5, -1.1], [1.5, -1.1], [-1.5, 1.1], [1.5, 1.1]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), std(0x5a4632, 1));
      post.position.set(px, 1.15, pz); st.add(post);
    }
    for (let cix = 0; cix < 3; cix++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.62), std(rng.pick([0xc98d5a, 0x7a9a4e, 0xb8574a]), 1));
      crate.position.set(-1 + cix * 1.0, 0.55, rng.range(-0.5, 0.5)); crate.castShadow = true;
      st.add(crate);
    }
    const table = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 1.8), std(0x8a6a44, 1));
    table.position.y = 0.32; st.add(table);
    st.position.set(-84 + i * 7.5, 0, 78 + (i % 2) * 6);
    st.rotation.y = rng.range(-0.2, 0.2);
    group.add(st);
  }
  // food cart with an umbrella on the promenade
  const cart = new THREE.Group();
  const cartBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.0, 1.0), std(0xe8e0cc, 0.7));
  cartBody.position.y = 0.85; cartBody.castShadow = true; cart.add(cartBody);
  for (const wx of [-0.7, 0.7]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 12), std(0x1c1c20, 0.8));
    wheel.rotation.x = Math.PI / 2; wheel.position.set(wx, 0.3, 0.55); cart.add(wheel);
  }
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 10), std(0xc23b2e, 0.85));
  umb.position.y = 2.6; cart.add(umb);
  const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), std(0x5a4632, 1));
  umbPole.position.y = 1.9; cart.add(umbPole);
  cart.position.set(58, 0, CITY.coastRoadZ + 9.6);
  group.add(cart);

  // parked motorcycles: little detailed silhouettes by the shops
  for (let i = 0; i < 10; i++) {
    const moto = new THREE.Group();
    const bodyM = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.34, 0.3), std(rng.pick([0xc23b2e, 0x2c3440, 0x2e7ab8, 0xe8b13c]), 0.5, { metalness: 0.4 }));
    bodyM.position.y = 0.5; bodyM.castShadow = true; moto.add(bodyM);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.26), std(0x14161a, 0.9));
    seat.position.set(-0.2, 0.72, 0); moto.add(seat);
    for (const wx of [-0.62, 0.62]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 12), std(0x131417, 0.9));
      w.rotation.x = Math.PI / 2; w.position.set(wx, 0.26, 0); moto.add(w);
    }
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.44), std(0x2c3036, 0.5, { metalness: 0.6 }));
    bar.position.set(0.6, 0.85, 0); moto.add(bar);
    moto.position.set(-44 + i * 11 + rng.range(-2, 2), 0, 38.6);
    moto.rotation.y = Math.PI / 2 + rng.range(-0.15, 0.15);
    group.add(moto);
  }
  // crates, barrels and tyre stacks: harbour and garage clutter
  const clutter = (x, z, kind) => {
    if (kind === 0) for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), std(rng.pick([0x8a6a44, 0x6e5136, 0x4e6a7a]), 1));
      c.position.set(x + (i % 2) * 1.0, 0.45 + Math.floor(i / 2) * 0.92, z + rng.range(-0.3, 0.3));
      c.castShadow = true; group.add(c);
    } else if (kind === 1) for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.95, 12), std(rng.pick([0x2e6da8, 0xb8452e, 0x3f7a4e]), 0.6, { metalness: 0.3 }));
      b.position.set(x + i * 0.8, 0.48, z); b.castShadow = true; group.add(b);
    } else for (let i = 0; i < 3; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.13, 8, 18), std(0x131417, 0.95));
      t.rotation.x = Math.PI / 2; t.position.set(x, 0.14 + i * 0.26, z); t.castShadow = true; group.add(t);
    }
  };
  clutter(196, 106, 0); clutter(188, 112, 1); clutter(-58, 40, 2); clutter(102, 52, 0); clutter(-160, 88, 1); clutter(70, -22, 2);
  // construction barriers closing one lane in Pusat Kota
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.5, 0.08),
      new THREE.MeshStandardMaterial({ map: ctex(128, 32, (g, w, h) => {
        for (let s = 0; s < 6; s++) { g.fillStyle = s % 2 ? "#e8e4da" : "#e2703a"; g.save(); g.translate(s * 22, 0); g.transform(1, 0, -0.5, 1, 0, 0); g.fillRect(0, 0, 22, h); g.restore(); }
      }), roughness: 0.8 }));
    panel.position.y = 0.65; panel.castShadow = true; bar.add(panel);
    for (const lx of [-0.8, 0.8]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.4), std(0x3a3f46, 0.8));
      leg.position.set(lx, 0.25, 0); bar.add(leg);
    }
    bar.position.set(-14 + i * 0.4, 0, -38 + i * 2.2);
    bar.rotation.y = Math.PI / 2;
    group.add(bar);
  }
  // laundry lines strung across an alley in Kampung Nelayan
  for (let i = 0; i < 3; i++) {
    const y = 3.4 + i * 0.5, z = -128 + i * 3;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 9, 4), std(0x333333, 1));
    line.rotation.z = Math.PI / 2; line.position.set(-168, y, z); group.add(line);
    for (let cix = 0; cix < 4; cix++) {
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1),
        new THREE.MeshStandardMaterial({ color: rng.pick([0xe2703a, 0x3fa7a0, 0xe8e0cc, 0xd4748a]), roughness: 1, side: THREE.DoubleSide }));
      cloth.position.set(-171.5 + cix * 2.1, y - 0.6, z);
      group.add(cloth);
    }
  }
  // pennant banners across the coast road
  for (const bx of [-120, 0, 120]) {
    const cols = [0xe2703a, 0xe8b13c, 0x3fa7a0, 0xd4748a, 0x5b83c4];
    for (let i = 0; i < 11; i++) {
      const tri = new THREE.Mesh(new THREE.CircleGeometry(0.42, 3),
        new THREE.MeshStandardMaterial({ color: cols[i % 5], roughness: 0.9, side: THREE.DoubleSide }));
      tri.position.set(bx - 7 + i * 1.4, 6.1 - Math.sin((i / 10) * Math.PI) * 0.7, CITY.coastRoadZ);
      tri.rotation.z = Math.PI;
      group.add(tri);
    }
  }
}

function buildLandmarks(group, rng, std, animated) {
  // lighthouse at the east end of the beach
  const lh = new THREE.Group();
  const stripeTex = ctex(128, 256, (g, w, h) => {
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? "#e8e4da" : "#c23b2e"; g.fillRect(0, (h / 6) * i, w, h / 6); }
  });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.1, 13, 16),
    new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.8 }));
  tower.position.y = 6.5; tower.castShadow = true; lh.add(tower);
  const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 10),
    new THREE.MeshStandardMaterial({ color: 0xffedb8, emissive: 0xffc46a, emissiveIntensity: 1.6, roughness: 0.3 }));
  lampRoom.position.y = 13.8; lh.add(lampRoom);
  const capTop = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.2, 10), std(0x24303c, 0.7));
  capTop.position.y = 15.2; lh.add(capTop);
  const beam = new THREE.Mesh(new THREE.ConeGeometry(3.2, 26, 16, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffeec2, transparent: true, opacity: 0.10, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  beam.rotation.z = Math.PI / 2; beam.position.set(13, 13.8, 0);
  const beamPivot = new THREE.Group(); beamPivot.add(beam); beamPivot.position.set(232, 0, 168);
  lh.position.set(232, 0, 168);
  group.add(lh); group.add(beamPivot);
  animated.beam = beamPivot;

  // clock tower in Pusat Kota
  const ct = new THREE.Group();
  const ctBody = new THREE.Mesh(new THREE.BoxGeometry(5, 21, 5), std(0xd9c9a3, 0.9));
  ctBody.position.y = 10.5; ctBody.castShadow = true; ct.add(ctBody);
  const clockTex = ctex(128, 128, (g) => {
    g.fillStyle = "#f4efdd"; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
    g.strokeStyle = "#24303c"; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.stroke();
    g.beginPath(); g.moveTo(64, 64); g.lineTo(92, 76); g.stroke();
    g.fillStyle = "#24303c";
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(60 + Math.cos(a) * 46, 60 + Math.sin(a) * 46, 7, 7); }
  });
  for (const rz of [0, Math.PI]) {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.MeshBasicMaterial({ map: clockTex }));
    face.position.set(0, 17.5, rz === 0 ? 2.53 : -2.53); face.rotation.y = rz;
    ct.add(face);
  }
  const ctRoof = new THREE.Mesh(new THREE.ConeGeometry(4.1, 3.4, 4), std(0x8a4a34, 0.9));
  ctRoof.position.y = 22.7; ctRoof.rotation.y = Math.PI / 4; ct.add(ctRoof);
  ct.position.set(-14, 0, -52);
  group.add(ct);

  // wooden pier with small boats
  const pier = new THREE.Group();
  const deckMat = std(0x8a6a44, 1);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 44), deckMat);
  deck.position.set(0, 0.55, 22); deck.castShadow = true; pier.add(deck);
  for (let i = 0; i < 8; i++) for (const px of [-3, 3]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 7), std(0x5a4632, 1));
    post.position.set(px, -0.2, 4 + i * 5.4); pier.add(post);
  }
  pier.position.set(198, 0, CITY.seaZ - 4);
  group.add(pier);
  for (let i = 0; i < 4; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.45, 4.6, 8, 1), std(rng.pick([0xc23b2e, 0x2e7ab8, 0xe8b13c, 0x3fa76a]), 0.7));
    hull.rotation.z = Math.PI / 2; hull.scale.set(1, 1, 0.62); hull.position.y = 0.25; boat.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.0, 6), std(0x5a4632, 1));
    mast.position.y = 1.9; boat.add(mast);
    boat.position.set(188 + i * 8, 0, CITY.seaZ + 6 + (i % 2) * 7);
    boat.rotation.y = rng.range(-0.4, 0.4);
    group.add(boat);
  }
  // beach umbrellas
  for (let i = 0; i < 7; i++) {
    const u = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 6), std(0xe8e4da, 0.8));
    pole.position.y = 1.0; u.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.45, 9), std(rng.pick([0xe2703a, 0x3fa7a0, 0xe8b13c, 0xd4748a]), 0.9));
    top.position.y = 2.05; top.castShadow = true; u.add(top);
    u.position.set(-180 + i * 52 + rng.range(-6, 6), 0, CITY.beachZ + rng.range(5, 15));
    group.add(u);
  }
  // big original billboard over the coast road
  const bbTex = ctex(512, 192, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#ff9e57"); grad.addColorStop(1, "#c23b6e");
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff7e0"; g.beginPath(); g.arc(430, 52, 30, 0, 7); g.fill();
    g.fillStyle = "#ffffff"; g.font = "bold 54px Arial"; g.textAlign = "left";
    g.fillText("KELAPA MUDA", 26, 74);
    g.fillText("SEGAR TELUK", 26, 134);
    g.font = "bold 24px Arial"; g.fillStyle = "#ffe9b8";
    g.fillText("DINGIN • MANIS • ASLI PESISIR", 26, 168);
    g.fillStyle = "#2e7a4e"; g.beginPath(); g.arc(420, 130, 34, 0, 7); g.fill();
    g.fillStyle = "#7a4a28"; g.fillRect(414, 84, 12, 26);
  });
  const bb = new THREE.Group();
  const bbPanel = new THREE.Mesh(new THREE.BoxGeometry(13, 4.9, 0.3),
    [std(0x24303c, 0.7), std(0x24303c, 0.7), std(0x24303c, 0.7), std(0x24303c, 0.7),
     new THREE.MeshStandardMaterial({ map: bbTex, roughness: 0.6, emissive: 0xffffff, emissiveMap: bbTex, emissiveIntensity: 0.35 }),
     std(0x24303c, 0.7)]);
  bbPanel.position.y = 8.6; bbPanel.castShadow = true; bb.add(bbPanel);
  for (const px of [-5, 5]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 6.4, 8), std(0x3a3f46, 0.6, { metalness: 0.5 }));
    post.position.set(px, 3.2, 0); bb.add(post);
  }
  bb.position.set(64, 0, CITY.coastRoadZ - 10.5);
  bb.rotation.y = Math.PI;
  group.add(bb);
  const bbStreak = reflectionStreak(0xff7a5c, 8, 5.5, 0.22);
  bbStreak.position.set(64, 0.06, CITY.coastRoadZ - 4);
  group.add(bbStreak);
}

function buildBackdrop(group, rng, envMap) {
  // layered coastal skyline: saturated silhouettes with lit windows,
  // kept colourful by only a whisper of warm fog
  const towerTex = ctex(128, 256, (g, w, h) => {
    g.fillStyle = "#31435c"; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 8; y += 13) for (let x = 8; x < w - 8; x += 13) {
      g.fillStyle = Math.random() < 0.42 ? "#ffd98a" : "#5f7d99";
      g.fillRect(x, y, 7, 8);
    }
  });
  const towerMat = new THREE.MeshStandardMaterial({ map: towerTex, roughness: 0.8, envMap, envMapIntensity: 0.4 });
  for (let x = -320; x <= 320; x += 34) {
    const hgt = 38 + rng.range(0, 55);
    const t = new THREE.Mesh(new THREE.BoxGeometry(rng.range(17, 26), hgt, 18), towerMat);
    t.position.set(x + rng.range(-5, 5), hgt / 2, -228 + rng.range(-8, 8));
    group.add(t);
  }
  for (const sx of [-1, 1]) for (let z = -190; z <= 60; z += 40) {
    const hgt = 26 + rng.range(0, 36);
    const t = new THREE.Mesh(new THREE.BoxGeometry(18, hgt, rng.range(16, 24)), towerMat);
    t.position.set(sx * 300, hgt / 2, z);
    group.add(t);
  }
  // harbour bridge silhouette across the bay to the east
  const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x3a4a63, roughness: 0.8 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(150, 2.2, 7), bridgeMat);
  deck.position.set(330, 15, 235); deck.rotation.y = 0.5;
  group.add(deck);
  for (const bx of [-42, 42]) {
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(3, 34, 3), bridgeMat);
    pylon.position.set(330 + bx * Math.cos(0.5), 17, 235 - bx * Math.sin(0.5));
    group.add(pylon);
  }
}
