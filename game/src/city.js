// Kota Teluk Cerah: jalan basah bercermin, fasad bertekstur, palem melengkung, landmark pantai.
import "three";
const THREE = window.THREE;
import { CONFIG } from "./config.js";

const facadeCache = new Map();
function facadeTexture(rng, base, accent, floors, cols, shopName, neonColor) {
  const cacheKey = `${base}|${floors}|${cols}|${shopName || ""}`;
  if (facadeCache.has(cacheKey)) return facadeCache.get(cacheKey);
  const made = buildFacade(rng, base, accent, floors, cols, shopName, neonColor);
  facadeCache.set(cacheKey, made);
  return made;
}
function buildFacade(rng, base, accent, floors, cols, shopName, neonColor) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = base; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(${rng.int(0, 40)},${rng.int(0, 30)},${rng.int(0, 30)},0.08)`;
    g.fillRect(rng.range(0, 256), rng.range(0, 512), rng.range(1, 4), rng.range(1, 4));
  }
  const fh = 512 / (floors + 1), cw = 256 / cols;
  for (let f = 0; f < floors; f++) {
    const y = 14 + f * fh;
    g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(0, y + fh - 7, 256, 3);
    for (let col = 0; col < cols; col++) {
      const x = 10 + col * cw;
      const lit = rng.chance(0.52);
      g.fillStyle = "#2b2f3a"; g.fillRect(x - 2, y - 2, cw - 14, fh - 16);
      if (lit) {
        const warm = rng.chance(0.75);
        g.fillStyle = warm ? `rgb(255,${rng.int(185, 220)},${rng.int(110, 150)})` : "#bcd8ff";
        g.fillRect(x, y, cw - 18, fh - 20);
        if (rng.chance(0.5)) { g.fillStyle = "rgba(70,50,40,0.55)"; g.fillRect(x, y, (cw - 18) / 2, fh - 20); }
        if (rng.chance(0.35)) { g.fillStyle = "rgba(255,255,255,0.5)"; g.fillRect(x, y + (fh - 20) / 2, cw - 18, 2); }
      } else {
        g.fillStyle = `rgb(${rng.int(38, 60)},${rng.int(48, 70)},${rng.int(66, 92)})`;
        g.fillRect(x, y, cw - 18, fh - 20);
        g.fillStyle = "rgba(255,255,255,0.16)"; g.fillRect(x + 2, y + 2, (cw - 22) / 2, (fh - 24) / 2);
      }
      if (rng.chance(0.3)) {
        g.strokeStyle = "rgba(20,20,26,0.65)"; g.lineWidth = 2;
        g.strokeRect(x - 4, y + fh - 22, cw - 10, 9);
        g.beginPath(); g.moveTo(x - 4, y + fh - 13); g.lineTo(x + cw - 14, y + fh - 13); g.stroke();
      }
    }
  }
  const gy = 512 - fh;
  g.fillStyle = "rgba(16,14,22,0.88)"; g.fillRect(0, gy, 256, fh);
  g.fillStyle = "rgba(255,196,110,0.9)"; g.fillRect(6, gy + 8, 244, fh - 16);
  g.fillStyle = "#241a10";
  for (let col = 0; col < cols; col++) { const x = 12 + col * cw; g.fillRect(x, gy + 12, cw - 20, fh - 24); }
  if (shopName) {
    g.fillStyle = neonColor; g.font = "bold 25px sans-serif"; g.textAlign = "center";
    g.shadowColor = neonColor; g.shadowBlur = 13;
    g.fillText(shopName, 128, gy - 8);
    g.shadowBlur = 0;
  }
  g.fillStyle = accent; g.fillRect(0, 0, 256, 5);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function asphaltTexture(rng) {
  const c = document.createElement("canvas"); c.width = 256; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#33343e"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5200; i++) {
    const v = rng.int(38, 86);
    g.fillStyle = `rgba(${v},${v},${v + 8},${rng.range(0.25, 0.6)})`;
    g.fillRect(rng.range(0, 256), rng.range(0, 256), rng.range(1, 2.4), rng.range(1, 2.4));
  }
  for (let i = 0; i < 12; i++) {
    g.fillStyle = "rgba(18,18,24,0.16)";
    g.beginPath(); g.ellipse(rng.range(0, 256), rng.range(0, 256), rng.range(14, 44), rng.range(8, 22), rng.range(0, 3), 0, 7); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function signTexture(text, fg, bg) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(7, 7, 498, 114);
  g.fillStyle = fg; g.font = "bold 56px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = fg; g.shadowBlur = 16;
  g.fillText(text, 256, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makePalm(rng, h = 6.4) {
  const g = new THREE.Group();
  const lean = rng.range(0.06, 0.2) * (rng.chance(0.5) ? 1 : -1);
  const pts = [];
  for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(new THREE.Vector3(lean * t * t * h * 0.4, t * h, 0)); }
  const trunkGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 7, 0.17, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8a6844, roughness: 0.95 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat); trunk.castShadow = true; g.add(trunk);
  for (let r = 0; r < 6; r++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.022, 5, 10), new THREE.MeshStandardMaterial({ color: 0x6e5232, roughness: 1 }));
    const t = 0.2 + r * 0.13;
    ring.position.set(lean * t * t * h * 0.4, t * h, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
  }
  const top = pts[5];
  const leafMats = [0x2e8b4a, 0x37a355, 0x27803e].map((col) => new THREE.MeshStandardMaterial({ color: col, roughness: 0.85, side: THREE.DoubleSide }));
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 2 + rng.range(-0.2, 0.2);
    const leafPts = [];
    for (let j = 0; j <= 4; j++) {
      const t = j / 4;
      leafPts.push(new THREE.Vector3(Math.cos(ang) * t * 2.3, 0.55 * Math.sin(t * Math.PI * 0.72) - t * t * 1.15, Math.sin(ang) * t * 2.3));
    }
    const leaf = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(leafPts), 5, 0.075, 5), leafMats[i % 3]);
    leaf.position.copy(top); leaf.scale.y = 1; leaf.castShadow = true; g.add(leaf);
    const blade = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 5), leafMats[(i + 1) % 3]);
    blade.scale.set(1.15, 0.05, 0.3);
    const mid = leafPts[2];
    blade.position.set(top.x + mid.x, top.y + mid.y, top.z + mid.z);
    blade.rotation.y = -ang; blade.rotation.z = -0.35; g.add(blade);
  }
  const nutMat = new THREE.MeshStandardMaterial({ color: 0x6e5232, roughness: 0.9 });
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 8), nutMat);
    nut.position.set(top.x + rng.range(-0.16, 0.16), top.y - 0.14, top.z + rng.range(-0.16, 0.16)); g.add(nut);
  }
  return g;
}

const neonPalette = ["#2affc4", "#ff5fa8", "#ffb02a", "#39c2ff", "#ff7847", "#b78bff"];

export function buildCity(scene, rng) {
  const roads = [];
  const blocks = [];
  const W = CONFIG.worldSize / 2;

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.worldSize + 160, CONFIG.worldSize + 160),
    new THREE.MeshStandardMaterial({ color: 0x494f40, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.06; ground.receiveShadow = true; scene.add(ground);

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, CONFIG.worldSize + 160),
    new THREE.MeshStandardMaterial({ color: 0x1d5f8a, roughness: 0.12, metalness: 0.65 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(-W - 130, -0.04, 0); scene.add(sea);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(26, CONFIG.worldSize + 160),
    new THREE.MeshStandardMaterial({ color: 0xd9b77c, roughness: 1 }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(-W - 4, -0.02, 0); scene.add(sand);

  const asphaltTex = asphaltTexture(rng);
  const roadMat = new THREE.MeshStandardMaterial({ map: asphaltTex, color: 0x9aa0b4, roughness: 0.34, metalness: 0.5 });
  const walkMat = new THREE.MeshStandardMaterial({ color: 0x6f6656, roughness: 0.95 });
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xf5e9b8 });
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xe8e4da });
  const crossMat = new THREE.MeshBasicMaterial({ color: 0xdcd8ce });

  function streak(x, z, lenS, colorHex, vertical, opacity = 0.32) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(vertical ? 1.15 : lenS, vertical ? lenS : 1.15),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.045, z); scene.add(m);
    return m;
  }

  for (const ax of CONFIG.avenueXs) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.roadWidth, CONFIG.worldSize), roadMat.clone());
    road.material.map = asphaltTex.clone(); road.material.map.repeat.set(1, 26); road.material.map.needsUpdate = true;
    road.rotation.x = -Math.PI / 2; road.position.set(ax, 0.01, 0); road.receiveShadow = true; scene.add(road);
    roads.push({ x1: ax, z1: -W, x2: ax, z2: W, vertical: true });
    for (const sx of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.sidewalkWidth, 0.22, CONFIG.worldSize), walkMat);
      walk.position.set(ax + sx * (CONFIG.roadWidth / 2 + CONFIG.sidewalkWidth / 2), 0.11, 0);
      walk.receiveShadow = true; scene.add(walk);
      const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.28, CONFIG.worldSize), edgeMat);
      edge.rotation.x = -Math.PI / 2; edge.position.set(ax + sx * (CONFIG.roadWidth / 2 - 0.4), 0.03, 0); scene.add(edge);
    }
    for (let z = -W + 8; z < W - 6; z += 9) {
      if (CONFIG.streetZs.some((sz) => Math.abs(sz - z) < 9)) continue;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 3.6), dashMat);
      dash.rotation.x = -Math.PI / 2; dash.position.set(ax, 0.03, z); scene.add(dash);
    }
    for (const sz of CONFIG.streetZs) {
      for (let i = -3; i <= 3; i++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 3.6), crossMat);
        stripe.rotation.x = -Math.PI / 2; stripe.position.set(ax + i * 1.7, 0.028, sz); scene.add(stripe);
      }
    }
  }
  for (const sz of CONFIG.streetZs) {
    const road = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.worldSize, CONFIG.roadWidth), roadMat.clone());
    road.material.map = asphaltTex.clone(); road.material.map.repeat.set(26, 1); road.material.map.needsUpdate = true;
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0.008, sz); road.receiveShadow = true; scene.add(road);
    roads.push({ x1: -W, z1: sz, x2: W, z2: sz, vertical: false });
    for (const sx of [-1, 1]) {
      const walk = new THREE.Mesh(new THREE.BoxGeometry(CONFIG.worldSize, 0.22, CONFIG.sidewalkWidth), walkMat);
      walk.position.set(0, 0.11, sz + sx * (CONFIG.roadWidth / 2 + CONFIG.sidewalkWidth / 2)); scene.add(walk);
    }
  }

  // Genangan berkilau + coretan pantulan lampu jalan di tiap avenue.
  const puddleMat = new THREE.MeshStandardMaterial({ color: 0x8fa8cc, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.55 });
  for (const ax of CONFIG.avenueXs) {
    for (let i = 0; i < 7; i++) {
      const pud = new THREE.Mesh(new THREE.CircleGeometry(rng.range(1.1, 2.3), 18), puddleMat);
      pud.rotation.x = -Math.PI / 2;
      pud.position.set(ax + rng.range(-5.4, 5.4), 0.035, rng.range(-W + 14, W - 14));
      pud.scale.y = 0.55; scene.add(pud);
    }
    for (let z = -W + 20; z < W; z += 28) streak(ax + rng.range(-4, 4), z, rng.range(5, 9), 0xffc98a, true, 0.1);
  }

  const districtOf = (x, z) => {
    let best = CONFIG.districts[0], bd = 1e9;
    for (const d of CONFIG.districts) { const dd = (d.cx - x) ** 2 + (d.cz - z) ** 2; if (dd < bd) { bd = dd; best = d; } }
    return best;
  };

  const palettes = {
    CBD: ["#7a6a58", "#5d6f9a", "#8a5f6e", "#6e7a5a", "#94765a"],
    "Kota Tua": ["#9a7a52", "#8a6248", "#a8875e", "#7d6a8a"],
    Perumahan: ["#b09a78", "#9ab08a", "#c2a888", "#8aa2b0"],
    Marina: ["#7fa8b8", "#a8c2b0", "#c2b090"],
    Pelabuhan: ["#8a8578", "#75808a", "#9a8a72"],
  };
  let shopIdx = 0;
  const signMeshes = [];
  for (let bx = 0; bx < 4; bx++) {
    for (let bz = 0; bz < 4; bz++) {
      const cx = (CONFIG.avenueXs[bx] + CONFIG.avenueXs[bx + 1]) / 2;
      const cz = (CONFIG.streetZs[bz] + CONFIG.streetZs[bz + 1]) / 2;
      const dist = districtOf(cx, cz);
      blocks.push({ cx, cz, district: dist.name });
      const n = rng.int(2, 3);
      for (let i = 0; i < n; i++) {
        const bw = rng.range(17, 26), bd2 = rng.range(17, 26);
        const tall = dist.name === "CBD" ? rng.range(20, 44) : rng.range(6, 17);
        const floors = Math.max(2, Math.round(tall / 3.1));
        const base = rng.pick(palettes[dist.name] || palettes["Kota Tua"]);
        const shop = rng.chance(0.72) ? CONFIG.shopNames[shopIdx++ % CONFIG.shopNames.length] : null;
        const neon = neonPalette[shopIdx % neonPalette.length];
        const texFront = facadeTexture(rng, base, "#3a3f4e", floors, 4, shop, neon);
        const texSide = facadeTexture(rng, base, "#3a3f4e", floors, 4, null, neon);
        const matF = new THREE.MeshStandardMaterial({ map: texFront, roughness: 0.82 });
        const matS = new THREE.MeshStandardMaterial({ map: texSide, roughness: 0.82 });
        const roofMat = new THREE.MeshStandardMaterial({ color: dist.roof, roughness: 1 });
        const b = new THREE.Mesh(new THREE.BoxGeometry(bw, tall, bd2), [matS, matS, roofMat, roofMat, matF, matS]);
        const ox = (i % 2 === 0 ? -1 : 1) * (n > 1 ? 11 : 0), oz = (i > 0 ? 1 : -1) * (n > 2 ? 11 : 0);
        b.position.set(cx + ox + rng.range(-2, 2), tall / 2, cz + oz + rng.range(-2, 2));
        b.castShadow = true; b.receiveShadow = true; scene.add(b);
        // Peralatan atap yang terbaca.
        const ac = new THREE.Mesh(new THREE.BoxGeometry(rng.range(1.6, 3), 0.9, rng.range(1.6, 2.6)), roofMat);
        ac.position.set(b.position.x + rng.range(-5, 5), tall + 0.45, b.position.z + rng.range(-5, 5)); scene.add(ac);
        if (rng.chance(0.5)) {
          const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.7, 10), new THREE.MeshStandardMaterial({ color: 0x9aa2ac, roughness: 0.5, metalness: 0.5 }));
          tank.position.set(b.position.x + rng.range(-6, 6), tall + 0.85, b.position.z + rng.range(-6, 6)); scene.add(tank);
        }
        if (rng.chance(0.45)) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, rng.range(2.5, 5), 5), new THREE.MeshStandardMaterial({ color: 0x444a55 }));
          ant.position.set(b.position.x + rng.range(-6, 6), tall + 1.6, b.position.z); scene.add(ant);
        }
        // Undakan menara jauh untuk CBD.
        if (dist.name === "CBD" && rng.chance(0.6)) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.55, tall * 0.35, bd2 * 0.55),
            new THREE.MeshStandardMaterial({ map: texSide, roughness: 0.85 }));
          step.position.set(b.position.x, tall + tall * 0.17, b.position.z); step.castShadow = true; scene.add(step);
        }
        // Coretan pantulan neon toko ke aspal di depan fasad.
        if (shop) {
          streak(b.position.x, b.position.z + bd2 / 2 + 6.5, rng.range(6, 10), new THREE.Color(neon).getHex(), true, 0.3);
          signMeshes.push({ name: shop, x: b.position.x, z: b.position.z });
        }
      }
    }
  }

  // Rambu neon besar Pasar Malam + papan kota.
  const bigSign = new THREE.Mesh(new THREE.PlaneGeometry(21, 5.2), new THREE.MeshBasicMaterial({ map: signTexture("TELUK CERAH", "#ff5fa8", "#1c1030"), side: THREE.DoubleSide }));
  bigSign.position.set(0, 8.6, -52); scene.add(bigSign);
  const bigSign2 = new THREE.Mesh(new THREE.PlaneGeometry(15, 3.6), new THREE.MeshBasicMaterial({ map: signTexture("PASAR MALAM", "#2affc4", "#0d241c"), side: THREE.DoubleSide }));
  bigSign2.position.set(13.5, 5.2, 92); bigSign2.rotation.y = -0.35; scene.add(bigSign2);
  for (const sx of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 8.6, 8), new THREE.MeshStandardMaterial({ color: 0x3c414c }));
    post.position.set(sx * 10, 4.3, -52); scene.add(post);
  }

  // Palem di sepanjang avenue + lampu jalan.
  const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  for (const ax of CONFIG.avenueXs) {
    for (let z = -W + 16; z < W; z += 31) {
      for (const sx of [-1, 1]) {
        if (rng.chance(0.62)) { const palm = makePalm(rng, rng.range(5.4, 7.6)); palm.position.set(ax + sx * 10.6, 0.2, z + rng.range(-3, 3)); scene.add(palm); }
        if (rng.chance(0.8)) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 5.6, 7), new THREE.MeshStandardMaterial({ color: 0x3c414c, roughness: 0.6, metalness: 0.5 }));
          pole.position.set(ax + sx * 8.6, 2.8, z + 8); scene.add(pole);
          const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), lampGlowMat);
          bulb.position.set(ax + sx * 8.6, 5.7, z + 8); scene.add(bulb);
        }
      }
    }
  }

  // Landmark: mercusuar Marina, Tugu Kerang, perahu, kontainer pelabuhan.
  const lh = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(1.5 - i * 0.14, 1.65 - i * 0.14, 2.4, 14),
      new THREE.MeshStandardMaterial({ color: i % 2 ? 0xd92632 : 0xf2ede2, roughness: 0.6 }));
    seg.position.y = 1.2 + i * 2.4; lh.add(seg);
  }
  const lhLamp = new THREE.Mesh(new THREE.SphereGeometry(0.85, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe98a }));
  lhLamp.position.y = 13.2; lh.add(lhLamp);
  lh.position.set(-196, 0, -60); scene.add(lh);

  const shell = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0xf2c98a, roughness: 0.35, metalness: 0.35 });
  for (let i = 0; i < 7; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.22, 8, 18, Math.PI), shellMat);
    rib.rotation.z = (i / 6 - 0.5) * 1.5; rib.position.y = 1.2; shell.add(rib);
  }
  const shellBase = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.6, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x8a7a5f, roughness: 0.9 }));
  shellBase.position.y = 0.6; shell.add(shellBase);
  shell.position.set(-52, 0, -120); scene.add(shell);

  const boatMat = new THREE.MeshStandardMaterial({ color: 0xd8dce2, roughness: 0.4 });
  for (let i = 0; i < 4; i++) {
    const boat = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: [0xd92632, 0x2a7bff, 0xf2b821, 0x37a355][i], roughness: 0.45 }));
    hull.scale.set(1.1, 0.55, 3.1); boat.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.4, 6), boatMat);
    mast.position.y = 2.2; boat.add(mast);
    boat.position.set(-222 + i * 3, 0.3, -90 + i * 42); scene.add(boat);
  }
  const contColors = [0xc8543a, 0x3a6ea8, 0x4a8a5a, 0xb8892a, 0x7a5a9a];
  for (let i = 0; i < 14; i++) {
    const cont = new THREE.Mesh(new THREE.BoxGeometry(6.2, 2.6, 2.5),
      new THREE.MeshStandardMaterial({ color: contColors[i % 5], roughness: 0.7 }));
    cont.position.set(-40 + (i % 7) * 13, 1.3 + Math.floor(i / 7) * 2.6, 196);
    cont.castShadow = true; scene.add(cont);
  }
  // Gudang pelabuhan dengan papan nama.
  const warehouse = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 16),
    new THREE.MeshStandardMaterial({ map: facadeTexture(rng, "#8a7a62", "#3a3f4e", 2, 6, "GUDANG KERANG", "#39c2ff"), roughness: 0.85 }));
  warehouse.position.set(52, 4, 108); warehouse.castShadow = true; scene.add(warehouse);

  // Kerang koleksi: 24 titik tersebar.
  const shellPts = [];
  const shellMat2 = new THREE.MeshStandardMaterial({ color: 0xffe9b8, roughness: 0.3, metalness: 0.4, emissive: 0x664411 });
  for (let i = 0; i < CONFIG.shellTotal; i++) {
    const x = rng.range(-190, 190), z = rng.range(-190, 190);
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), shellMat2);
    s.scale.set(1, 0.6, 1); s.position.set(x, 0.7, z); scene.add(s);
    shellPts.push(new THREE.Vector3(x, 0.7, z));
  }

  return {
    roads, blocks, shellPts, signMeshes,
    pois: {
      playerStart: new THREE.Vector3(4, 0, 30),
      safehouse: new THREE.Vector3(-84, 0, -150),
      hospital: new THREE.Vector3(-160, 0, 60),
      policeStation: new THREE.Vector3(120, 0, 60),
      gunShop: new THREE.Vector3(84, 0, 84),
      garage: new THREE.Vector3(-84, 0, -60),
      harbor: new THREE.Vector3(40, 0, 168),
    },
  };
}
