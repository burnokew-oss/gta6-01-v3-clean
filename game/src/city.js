// city.js — pembangkit kota prosedural Teluk Cerah: grid jalan organik di
// garis pantai, gedung berfasad bervariasi (balkon, kanopi, etalase menyala,
// atap beragam), palem melengkung, lampu jalan, landmark, dan pantulan neon
// yang ter-smear di aspal basah.
import { WORLD, DISTRICTS, SHOP_SIGNS, PALETTE } from "./config.js";
import { mulberry32, rngRange, rngInt, rngPick, rngChance } from "./random.js";

const THREE = () => window.THREE;

export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const T = THREE();
  const tex = new T.CanvasTexture(c);
  tex.encoding = T.sRGBEncoding;
  return tex;
}

export function streakTexture(hexColor) {
  return canvasTexture(64, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, hexColor); grad.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.85; g.fillStyle = grad;
    for (let x = 4; x < w - 4; x += 5) {
      const ww = 2 + Math.random() * 2.4;
      g.globalAlpha = 0.25 + Math.random() * 0.55;
      g.fillRect(x, 0, ww, h * (0.55 + Math.random() * 0.45));
    }
    g.globalAlpha = 0.5;
    for (let i = 0; i < 40; i++) g.fillRect(Math.random() * w, Math.random() * h, 3, 2);
  });
}

function asphaltTexture(rng) {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = "#22252b"; g.fillRect(0, 0, w, h);
    for (let o = 0; o < 5200; o++) {
      const v = rngInt(rng, 28, 86);
      g.fillStyle = "rgba(" + v + "," + (v + 4) + "," + (v + 10) + "," + rngRange(rng, 0.25, 0.8) + ")";
      g.fillRect(rng() * w, rng() * h, rngRange(rng, 1, 3.4), rngRange(rng, 1, 3.4));
    }
    for (let p = 0; p < 7; p++) {
      g.fillStyle = "rgba(12,13,16," + rngRange(rng, 0.12, 0.3) + ")";
      g.fillRect(rng() * w, rng() * h, rngRange(rng, 30, 120), rngRange(rng, 20, 70));
    }
    g.strokeStyle = "rgba(10,10,12,0.5)"; g.lineWidth = 1.4;
    for (let cr = 0; cr < 9; cr++) {
      g.beginPath(); let x = rng() * w, y = rng() * h; g.moveTo(x, y);
      for (let s = 0; s < 5; s++) { x += rngRange(rng, -26, 26); y += rngRange(rng, -8, 30); g.lineTo(x, y); }
      g.stroke();
    }
    for (let pu = 0; pu < 6; pu++) {
      const x = rng() * w, y = rng() * h, r = rngRange(rng, 22, 58);
      const rg = g.createRadialGradient(x, y, 2, x, y, r);
      rg.addColorStop(0, "rgba(165,205,230,0.5)"); rg.addColorStop(1, "rgba(165,205,230,0)");
      g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, r, r * 0.5, 0, 0, 7); g.fill();
    }
    // Marka menyatu di tekstur: garis tepi putih + garis tengah kuning putus.
    g.fillStyle = "rgba(248,250,252,0.85)";
    g.fillRect(0, 10, w, 6); g.fillRect(0, h - 16, w, 6);
    g.fillStyle = "#ffd23e";
    g.fillRect(30, h / 2 - 5, 170, 10); g.fillRect(310, h / 2 - 5, 170, 10);
  });
}

const FACADE_BASES = ["#f7e8d4", "#f3f0e6", "#f9dcc4", "#dff0ee", "#f6cfc0", "#eef3d8", "#fdeeda", "#e3ecf7", "#f9e2e0", "#d9efe8"];
const SIGN_COLORS = ["#ff5d8f", "#22d3ee", "#fbbf24", "#4ade80", "#fb923c", "#c084fc", "#38bdf8"];

export function facadeTexture(rng, shopName) {
  const base = rngPick(rng, FACADE_BASES);
  const floors = rngInt(rng, 3, 6);
  const accent = rngPick(rng, ["#0f766e", "#c2410c", "#0369a1", "#a16207", "#be5a38"]);
  return canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const fh = h / (floors + 1);
    for (let f = 0; f < floors; f++) {
      const y = f * fh + 6;
      g.fillStyle = "rgba(90,70,50,0.20)"; g.fillRect(0, y + fh - 4, w, 2.4);
      for (let col = 0; col < 4; col++) {
        const x = 18 + col * 58, ww = 34, hh = fh - 18;
        const lit = rngChance(rng, 0.42);
        g.fillStyle = lit ? "#ffd97a" : "#a8cbe0";
        g.fillRect(x, y, ww, hh);
        g.fillStyle = "rgba(255,255,255,0.5)";
        g.beginPath(); g.moveTo(x, y + hh); g.lineTo(x + ww * 0.55, y); g.lineTo(x + ww * 0.8, y); g.lineTo(x + ww * 0.25, y + hh); g.fill();
        g.strokeStyle = "rgba(70,55,40,0.55)"; g.lineWidth = 2; g.strokeRect(x, y, ww, hh);
        if (f > 0 && rngChance(rng, 0.5)) {
          g.fillStyle = "rgba(60,50,44,0.85)"; g.fillRect(x - 5, y + hh + 2, ww + 10, 3.4);
          g.strokeStyle = "rgba(40,36,32,0.9)"; g.lineWidth = 1.2;
          for (let b = 0; b < 6; b++) { g.beginPath(); g.moveTo(x - 4 + b * 9, y + hh - 6); g.lineTo(x - 4 + b * 9, y + hh + 2); g.stroke(); }
        }
      }
    }
    const gy = floors * fh + 4;
    if (shopName) {
      g.fillStyle = "#20303c"; g.fillRect(0, gy, w, h - gy);
      g.fillStyle = "#9fd4e8"; g.fillRect(14, gy + 26, 104, h - gy - 34);
      g.fillStyle = "#ffe9b0"; g.fillRect(134, gy + 26, 108, h - gy - 34);
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.beginPath(); g.moveTo(14, gy + 58); g.lineTo(70, gy + 26); g.lineTo(92, gy + 26); g.lineTo(36, gy + 58); g.fill();
      g.fillStyle = accent; g.fillRect(0, gy, w, 22);
      g.fillStyle = "#ffffff"; g.font = "bold 14px sans-serif"; g.textAlign = "center";
      g.fillText(shopName.toUpperCase(), w / 2, gy + 16);
    } else {
      g.fillStyle = accent; g.fillRect(0, gy, w, 8);
      g.fillStyle = "#334155"; g.fillRect(104, gy + 14, 48, h - gy - 14);
      g.fillStyle = "#9fd4e8"; g.fillRect(24, gy + 16, 56, 30); g.fillRect(176, gy + 16, 56, 30);
    }
  });
}

export function makePalm(rng, scale) {
  const T = THREE();
  const palm = new T.Group();
  const trunkMat = new T.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.9 });
  let x = 0, y = 0; const lean = rngRange(rng, 0.5, 1.1);
  for (let s = 0; s < 4; s++) {
    const seg = new T.Mesh(new T.CylinderGeometry(0.16 - s * 0.014, 0.2 - s * 0.014, 1.3, 7), trunkMat);
    x += lean * 0.16; y += 1.24;
    seg.position.set(x, y, 0); seg.rotation.z = -lean * 0.16;
    palm.add(seg);
  }
  const frondMat = new T.MeshStandardMaterial({ color: 0x2e9e4f, roughness: 0.8, side: T.DoubleSide });
  for (let f = 0; f < 8; f++) {
    const geo = new T.PlaneGeometry(0.55, 3.1, 1, 5);
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) { const yy = pos.getY(v); pos.setZ(v, -Math.pow((yy + 1.55) / 3.1, 2) * 1.5); }
    geo.computeVertexNormals();
    const frond = new T.Mesh(geo, frondMat);
    frond.position.set(x, y + 0.95, 0);
    frond.rotation.set(0, (f / 8) * Math.PI * 2, 0);
    frond.translateY(1.2); frond.rotateX(-1.15 - rng() * 0.3);
    palm.add(frond);
  }
  const nut = new T.Mesh(new T.SphereGeometry(0.24, 8, 6), new T.MeshStandardMaterial({ color: 0x6b4f2a }));
  nut.position.set(x, y + 0.72, 0); palm.add(nut);
  palm.scale.setScalar(scale || 1);
  return palm;
}

export function buildCity() {
  const T = THREE();
  const rng = mulberry32(WORLD.seed);
  const group = new T.Group();
  const signs = [];
  const animated = [];
  const size = WORLD.blockSize, half = WORLD.gridHalf;

  const ground = new T.Mesh(new T.PlaneGeometry(560, 560), new T.MeshStandardMaterial({ color: PALETTE.grass, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.08; ground.receiveShadow = true;
  group.add(ground);
  const sand = new T.Mesh(new T.PlaneGeometry(560, 42), new T.MeshStandardMaterial({ color: PALETTE.sand, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, -0.04, 136); group.add(sand);
  const sea = new T.Mesh(new T.PlaneGeometry(560, 150), new T.MeshPhongMaterial({ color: PALETTE.sea, shininess: 120, specular: 0xbfeaff }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.02, 232); group.add(sea);

  const asphalt = asphaltTexture(rng);
  asphalt.wrapS = asphalt.wrapT = T.RepeatWrapping;
  asphalt.repeat.set(9, 1);
  const roadMat = new T.MeshStandardMaterial({ map: asphalt, roughness: 0.58, metalness: 0.05 });
  const sideMat = new T.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 0.95 });
  const extent = size * (half + 0.5);
  for (let i = -half; i <= half; i++) {
    for (const alongX of [true, false]) {
      const road = new T.Mesh(new T.PlaneGeometry(extent * 2, WORLD.roadWidth), roadMat);
      road.rotation.x = -Math.PI / 2;
      if (!alongX) road.rotation.z = Math.PI / 2;
      road.position.set(alongX ? 0 : i * size, 0, alongX ? i * size : 0);
      road.receiveShadow = true;
      group.add(road);
      const sw1 = new T.Mesh(new T.PlaneGeometry(extent * 2, 2.4), sideMat);
      sw1.rotation.x = -Math.PI / 2; if (!alongX) sw1.rotation.z = Math.PI / 2;
      sw1.position.set(alongX ? 0 : i * size - 6.7, 0.015, alongX ? i * size - 6.7 : 0);
      group.add(sw1);
      const sw2 = sw1.clone();
      sw2.position.set(alongX ? 0 : i * size + 6.7, 0.015, alongX ? i * size + 6.7 : 0);
      group.add(sw2);
    }
  }
  // Marka: garis tengah kuning putus-putus + tepi putih + zebra cross.
  const whiteMat = new T.MeshBasicMaterial({ color: 0xf8fafc });
  for (let i = -half; i <= half; i++) {
    for (const s of [-1, 1]) {
      const edge = new T.Mesh(new T.PlaneGeometry(extent * 2, 0.3), whiteMat);
      edge.rotation.x = -Math.PI / 2; edge.position.set(0, 0.028, i * size + s * 5.1); group.add(edge);
      const edgeV = edge.clone(); edgeV.rotation.z = Math.PI / 2; edgeV.position.set(i * size + s * 5.1, 0.028, 0); group.add(edgeV);
    }
    for (let j = -half; j <= half; j++) {
      if (i !== 0 && j !== 0) continue;
      for (let sIdx = 0; sIdx < 5; sIdx++) {
        const stripe = new T.Mesh(new T.PlaneGeometry(0.85, 3.6), whiteMat);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(i * size - 3.4 + sIdx * 1.7, 0.032, j * size - 7.6);
        group.add(stripe);
      }
    }
  }
  // Genangan ekstra memantul di jalan utama (avenue z=0) untuk shot chase.
  const puddleMat = new T.MeshPhongMaterial({ color: 0xaadcf2, shininess: 140, specular: 0xffffff, transparent: true, opacity: 0.42 });
  for (let p = 0; p < 16; p++) {
    const pud = new T.Mesh(new T.CircleGeometry(rngRange(rng, 1.6, 3.6), 18), puddleMat);
    pud.rotation.x = -Math.PI / 2;
    pud.position.set(rngRange(rng, -90, 90), 0.035, rngRange(rng, -4.5, 4.5));
    pud.scale.y = 0.45;
    group.add(pud);
  }

  // Gedung di tiap blok, menghadap jalan terdekat.
  let shopIdx = 0;
  const roofFlat = new T.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.95 });
  const roofTerra = new T.MeshStandardMaterial({ color: 0xbe5a38, roughness: 0.9 });
  for (let bx = -half; bx <= half; bx++) {
    for (let bz = -half; bz <= half; bz++) {
      if (bx === 0 && bz === 0) continue;
      const cx = bx * size + size / 2 - (bx >= 0 ? 0 : 0);
      const cz = bz * size + size / 2;
      const px = bx * size + (bx < 0 ? -size / 2 : size / 2);
      const pz = bz * size + (bz < 0 ? -size / 2 : size / 2);
      const isShop = rngChance(rng, 0.55);
      const shopName = isShop ? SHOP_SIGNS[shopIdx++ % SHOP_SIGNS.length] : null;
      const wdt = rngRange(rng, 13, 19), dep = rngRange(rng, 12, 18), hgt = rngRange(rng, 9, 34);
      const tex = facadeTexture(rng, shopName);
      const faceMat = new T.MeshStandardMaterial({ map: tex, roughness: 0.72 });
      const low = hgt < 15;
      const roofMat = low ? roofTerra : roofFlat;
      const b = new T.Mesh(new T.BoxGeometry(wdt, hgt, dep), [faceMat, faceMat, roofMat, roofMat, faceMat, faceMat]);
      b.position.set(px, hgt / 2, pz);
      b.castShadow = true; b.receiveShadow = true;
      group.add(b);
      if (low) {
        const roof = new T.Mesh(new T.ConeGeometry(wdt * 0.72, 3.2, 4), roofTerra);
        roof.position.set(px, hgt + 1.6, pz); roof.rotation.y = Math.PI / 4; roof.scale.z = dep / wdt;
        group.add(roof);
      } else {
        for (let a = 0; a < rngInt(rng, 1, 3); a++) {
          const ac = new T.Mesh(new T.BoxGeometry(1.7, 0.9, 1.3), roofFlat);
          ac.position.set(px + rngRange(rng, -wdt / 3, wdt / 3), hgt + 0.45, pz + rngRange(rng, -dep / 3, dep / 3));
          group.add(ac);
        }
        if (rngChance(rng, 0.3)) {
          const tower = new T.Mesh(new T.CylinderGeometry(1.6, 1.9, 5, 10), faceMat);
          tower.position.set(px + wdt / 2 - 1.4, hgt + 2.5, pz + dep / 2 - 1.4);
          group.add(tower);
        }
      }
      // Kanopi + balkon 3D di sisi yang menghadap avenue horizontal.
      const canopyMat = new T.MeshStandardMaterial({ color: rngPick(rng, [0x0f766e, 0xc2410c, 0x0369a1, 0xbe5a38]), roughness: 0.7 });
      for (const s of [-1, 1]) {
        const canopy = new T.Mesh(new T.BoxGeometry(wdt * 0.92, 0.28, 2.4), canopyMat);
        canopy.position.set(px, 3.1, pz + s * (dep / 2 + 1.1));
        group.add(canopy);
        const floorsB = Math.floor(hgt / 4);
        for (let f = 1; f < floorsB; f++) {
          if (!rngChance(rng, 0.42)) continue;
          const bal = new T.Mesh(new T.BoxGeometry(3.4, 0.18, 1.1), new T.MeshStandardMaterial({ color: 0x475569, roughness: 0.6, metalness: 0.4 }));
          bal.position.set(px + rngRange(rng, -wdt / 4, wdt / 4), f * 4 + 1.2, pz + s * (dep / 2 + 0.5));
          group.add(bal);
        }
      }
      if (shopName) {
        const color = SIGN_COLORS[shopIdx % SIGN_COLORS.length];
        const signTex = canvasTexture(256, 48, (g, w, h) => {
          g.fillStyle = "#101820"; g.fillRect(0, 0, w, h);
          g.fillStyle = color; g.font = "bold 25px sans-serif"; g.textAlign = "center";
          g.fillText(shopName.toUpperCase(), w / 2, 34);
        });
        const signMat = new T.MeshBasicMaterial({ map: signTex });
        const sign = new T.Mesh(new T.PlaneGeometry(9.5, 1.8), signMat);
        sign.position.set(px, 4.6, pz - dep / 2 - 0.25);
        sign.rotation.y = Math.PI;
        group.add(sign);
        signs.push({ mat: signMat, phase: rng() * 6.28, color });
        // Pantulan neon ter-smear di aspal depan toko.
        const streak = new T.Mesh(
          new T.PlaneGeometry(7.5, 13),
          new T.MeshBasicMaterial({ map: streakTexture(color), transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false })
        );
        streak.rotation.x = -Math.PI / 2; streak.rotation.z = Math.PI;
        streak.position.set(px, 0.045, pz - dep / 2 - 7.5);
        group.add(streak);
        animated.push({ mat: streak.material, phase: rng() * 6.28, base: 0.5 });
      }
    }
  }

  // Lampu jalan + pantulannya di avenue dan jalan lain.
  const lampGlowTex = canvasTexture(64, 64, (g, w, h) => {
    const rg = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    rg.addColorStop(0, "rgba(255,225,160,1)"); rg.addColorStop(1, "rgba(255,225,160,0)");
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
  });
  const poleMat = new T.MeshStandardMaterial({ color: 0x3f4750, roughness: 0.5, metalness: 0.6 });
  for (let lx = -102; lx <= 102; lx += 24) {
    for (const s of [-1, 1]) {
      const lamp = new T.Group();
      const pole = new T.Mesh(new T.CylinderGeometry(0.09, 0.13, 5.6, 7), poleMat);
      pole.position.y = 2.8; lamp.add(pole);
      const arm = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 1.8, 6), poleMat);
      arm.rotation.z = Math.PI / 2 - 0.25; arm.position.set(-s * 0.8, 5.5, 0); lamp.add(arm);
      const head = new T.Mesh(new T.SphereGeometry(0.3, 10, 8), new T.MeshBasicMaterial({ color: 0xffe9b0 }));
      head.position.set(-s * 1.6, 5.7, 0); lamp.add(head);
      const glow = new T.Sprite(new T.SpriteMaterial({ map: lampGlowTex, transparent: true, opacity: 0.85, depthWrite: false }));
      glow.scale.setScalar(3.4); glow.position.copy(head.position); lamp.add(glow);
      lamp.position.set(lx, 0, s * 6.4);
      group.add(lamp);
      const streak = new T.Mesh(new T.PlaneGeometry(2.2, 11),
        new T.MeshBasicMaterial({ map: streakTexture("#ffca7a"), transparent: true, opacity: 0.4, blending: T.AdditiveBlending, depthWrite: false }));
      streak.rotation.x = -Math.PI / 2;
      streak.position.set(lx - s * 0 + (s > 0 ? -1.6 : 1.6) * 0, 0.042, s * 2.5);
      streak.position.x = lx + (s > 0 ? 1.6 : -1.6) * 0 + (s === 1 ? -1.6 : 1.6);
      group.add(streak);
    }
  }

  // Palem di trotoar avenue utama + pantai.
  for (let px2 = -110; px2 <= 110; px2 += 19) {
    for (const s of [-1, 1]) {
      if (rngChance(rng, 0.3)) continue;
      const palm = makePalm(rng, rngRange(rng, 0.85, 1.2));
      palm.position.set(px2 + rngRange(rng, -2, 2), 0, s * 8.6);
      palm.rotation.y = rng() * 6.28;
      group.add(palm);
    }
  }
  for (let px2 = -120; px2 <= 120; px2 += 17) {
    const palm = makePalm(rng, rngRange(rng, 1, 1.45));
    palm.position.set(px2, 0, 122 + rngRange(rng, 0, 7));
    group.add(palm);
  }

  buildLandmarks(group, rng);
  return { group, signs, animated, districts: DISTRICTS };
}

function buildLandmarks(group, rng) {
  const T = THREE();
  // Mercusuar bergaris di ujung dermaga timur.
  const light = new T.Group();
  const stripeMats = [new T.MeshStandardMaterial({ color: 0xf8fafc }), new T.MeshStandardMaterial({ color: 0xdc2626 })];
  for (let s = 0; s < 5; s++) {
    const seg = new T.Mesh(new T.CylinderGeometry(2.5 - s * 0.28, 2.8 - s * 0.28, 3.4, 14), stripeMats[s % 2]);
    seg.position.y = 1.7 + s * 3.4; seg.castShadow = true; light.add(seg);
  }
  const lampRoom = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, 2.2, 10), new T.MeshBasicMaterial({ color: 0xffe9a0 }));
  lampRoom.position.y = 19.4; light.add(lampRoom);
  const cap = new T.Mesh(new T.ConeGeometry(2.3, 1.8, 10), new T.MeshStandardMaterial({ color: 0x334155 }));
  cap.position.y = 21.4; light.add(cap);
  light.position.set(112, 0, 118);
  group.add(light);
  // Menara jam di taman pusat.
  const towerMat = new T.MeshStandardMaterial({ color: 0xf3e5cf, roughness: 0.8 });
  const tower = new T.Mesh(new T.BoxGeometry(5, 21, 5), towerMat);
  tower.position.set(10, 10.5, 10); tower.castShadow = true; group.add(tower);
  const clockTex = canvasTexture(96, 96, (g) => {
    g.fillStyle = "#fffbe8"; g.beginPath(); g.arc(48, 48, 44, 0, 7); g.fill();
    g.strokeStyle = "#334155"; g.lineWidth = 5; g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(48, 48); g.lineTo(48, 22); g.moveTo(48, 48); g.lineTo(66, 56); g.stroke();
  });
  for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const face = new T.Mesh(new T.PlaneGeometry(3.6, 3.6), new T.MeshBasicMaterial({ map: clockTex }));
    face.position.set(10 + Math.sin(ry) * 2.55, 17.6, 10 + Math.cos(ry) * 2.55);
    face.rotation.y = ry; group.add(face);
  }
  const towerRoof = new T.Mesh(new T.ConeGeometry(4.4, 3.4, 4), new T.MeshStandardMaterial({ color: 0xbe5a38 }));
  towerRoof.position.set(10, 22.7, 10); towerRoof.rotation.y = Math.PI / 4; group.add(towerRoof);
  // Jembatan pelabuhan di timur: dek melengkung + tiang + kabel.
  const bridgeMat = new T.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5, metalness: 0.3 });
  for (let s = 0; s <= 10; s++) {
    const segB = new T.Mesh(new T.BoxGeometry(4.4, 0.7, 9), bridgeMat);
    segB.position.set(124, 2.4 + Math.sin((s / 10) * Math.PI) * 3.4, 40 + s * 5.4);
    group.add(segB);
  }
  // Kios pasar ikan: kotak + atap garis-garis warna.
  for (let k = 0; k < 6; k++) {
    const stall = new T.Group();
    const box = new T.Mesh(new T.BoxGeometry(4.6, 2.2, 3.4), new T.MeshStandardMaterial({ color: 0xfef3c7 }));
    box.position.y = 1.1; stall.add(box);
    const awnTex = canvasTexture(64, 64, (g, w, h) => {
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f8fafc" : (k % 2 ? "#0ea5e9" : "#ef4444"); g.fillRect(i * 8, 0, 8, h); }
    });
    const awn = new T.Mesh(new T.BoxGeometry(5.4, 0.18, 4.4), new T.MeshStandardMaterial({ map: awnTex }));
    awn.position.y = 2.6; awn.rotation.z = 0.12; stall.add(awn);
    stall.position.set(24 + k * 6.4, 0, 76);
    group.add(stall);
  }
  // Air mancur taman.
  const basin = new T.Mesh(new T.CylinderGeometry(4.4, 4.8, 0.9, 20), new T.MeshStandardMaterial({ color: 0x94a3b8 }));
  basin.position.set(23, 0.45, 23); group.add(basin);
  const water = new T.Mesh(new T.CylinderGeometry(4, 4, 0.3, 20), new T.MeshPhongMaterial({ color: 0x38bdf8, shininess: 120 }));
  water.position.set(23, 0.95, 23); group.add(water);
  const jet = new T.Mesh(new T.CylinderGeometry(0.16, 0.5, 2.6, 8), new T.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.8 }));
  jet.position.set(23, 2.2, 23); group.add(jet);
}

export function updateCityLife(city, t) {
  for (const s of city.signs) s.mat.opacity = 1;
  for (const s of city.signs) { /* kedip halus tidak serentak via skala kecerahan warna */ }
  city.signs.forEach((s, i) => {
    const flick = 0.86 + 0.14 * Math.sin(t * 2.2 + s.phase) * Math.sin(t * 0.7 + i);
    s.mat.color.setScalar(flick);
  });
  city.animated.forEach((a) => { a.mat.opacity = a.base * (0.8 + 0.25 * Math.sin(t * 1.8 + a.phase)); });
}
