// city.js — pembangkit kota prosedural Teluk Cerah: grid jalan organik di
// garis pantai, gedung bertekstur kaya dengan fasad bervariasi arah cahaya,
// palem melengkung, papan neon + refleksi geometris di jalan basah, properti
// jarak menengah padat, dan landmark unik.
import { WORLD, DISTRICTS, SHOP_SIGNS } from "./config.js";
import { Rng } from "./random.js";
import { makeCanvas } from "./render.js";

const PALETTE = ["#e8542f", "#f2a03d", "#d63c52", "#2f8f83", "#e8c832", "#c65b8f", "#3f7fbf", "#ef7d3c", "#8a5fc0", "#d94f30"];
const NEON = ["#ff3860", "#00e5ff", "#ffe93d", "#7cff4f", "#ff9f1c", "#f15bb5"];

export function facadeTexture(rng, base, floors, shop) {
  return makeCanvas(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // variasi tona per lantai
    for (let f = 0; f < floors; f++) {
      g.fillStyle = `rgba(${rng.int(0, 40)},${rng.int(0, 25)},${rng.int(0, 30)},${rng.float(0.04, 0.16)})`;
      g.fillRect(0, (h / floors) * f, w, h / floors);
      g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(0, (h / floors) * f, w, 2);
    }
    // noda cuaca di dekat dasar
    for (let i = 0; i < 22; i++) {
      g.fillStyle = `rgba(30,25,20,${rng.float(0.05, 0.2)})`;
      g.fillRect(rng.float(0, w), h - rng.float(4, 42), rng.float(3, 16), rng.float(4, 40));
    }
    const cols = 5, rows = floors;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const wx = 14 + x * 47, wy = 12 + y * (shop ? 30 : 34), ww = 30, wh = 20;
      g.fillStyle = "rgba(20,16,12,0.85)"; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6); // bingkai nyata
      const kind = rng.next();
      if (kind < 0.38) { // menyala hangat
        const gr = g.createLinearGradient(wx, wy, wx, wy + wh);
        gr.addColorStop(0, "#ffe9a8"); gr.addColorStop(1, "#ff9d3c");
        g.fillStyle = gr;
      } else if (kind < 0.72) { // memantulkan langit
        const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh);
        gr.addColorStop(0, "#bfefff"); gr.addColorStop(0.5, "#4fa8c9"); gr.addColorStop(1, "#ffb37a");
        g.fillStyle = gr;
      } else { g.fillStyle = "#1d2733"; }
      g.fillRect(wx, wy, ww, wh);
      g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      if (rng.chance(0.3)) { g.fillStyle = "#39424c"; g.fillRect(wx + 4, wy + wh + 5, 14, 9); } // unit AC
      if (rng.chance(0.22)) { // balkon berailing
        g.strokeStyle = "rgba(15,12,10,0.9)"; g.lineWidth = 2;
        g.strokeRect(wx - 4, wy + wh + 2, ww + 8, 9);
        for (let b = 0; b < 5; b++) { g.beginPath(); g.moveTo(wx - 2 + b * 9, wy + wh + 2); g.lineTo(wx - 2 + b * 9, wy + wh + 11); g.stroke(); }
      }
    }
    if (shop) { // etalase lantai dasar + kanopi
      g.fillStyle = "#14100d"; g.fillRect(0, h - 52, w, 52);
      const gr = g.createLinearGradient(0, h - 52, w, h);
      gr.addColorStop(0, "rgba(190,240,255,0.85)"); gr.addColorStop(0.5, "rgba(70,130,160,0.55)"); gr.addColorStop(1, "rgba(255,170,90,0.7)");
      g.fillStyle = gr; g.fillRect(8, h - 46, w - 90, 38);
      g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 3;
      g.beginPath(); g.moveTo(16, h - 10); g.lineTo(70, h - 44); g.stroke(); // silau diagonal
      g.fillStyle = shop.color; g.fillRect(0, h - 66, w, 15);
      g.fillStyle = "#fffbe8"; g.font = "bold 12px sans-serif"; g.textAlign = "center";
      g.fillText(shop.name.toUpperCase(), w / 2, h - 55);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(0, h - 52, w, 4);
    }
  });
}

function roofTexture(rng) {
  return makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = "#4a3f38"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${rng.float(0.05, 0.25)})`; g.fillRect(rng.float(0, w), rng.float(0, h), 3, 3); }
    g.strokeStyle = "rgba(255,220,170,0.25)"; g.strokeRect(6, 6, w - 12, h - 12);
  });
}

export function signTexture(text, color) {
  return makeCanvas(256, 64, (g, w, h) => {
    g.fillStyle = "#120d18"; g.fillRect(0, 0, w, h);
    g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
    g.shadowColor = color; g.shadowBlur = 16;
    g.fillStyle = color; g.font = "bold 25px sans-serif"; g.textAlign = "center";
    g.fillText(text.toUpperCase(), w / 2, h / 2 + 9);
    g.shadowBlur = 0;
  });
}

export function billboardTexture(rng) {
  return makeCanvas(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#ff8c42"); gr.addColorStop(0.6, "#ff3860"); gr.addColorStop(1, "#5b2a86");
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffe93d"; g.beginPath(); g.arc(w * 0.78, 62, 34, 0, 7); g.fill();
    g.fillStyle = "#123a5c";
    for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(w / 2, h - 26 - i * 9, w / 2, 16, 0, 0, 7); g.fill(); g.fillStyle = i % 2 ? "#1b5a8a" : "#123a5c"; }
    g.fillStyle = "#ffffff"; g.font = "bold 54px sans-serif"; g.textAlign = "center";
    g.shadowColor = "#000"; g.shadowBlur = 8;
    g.fillText("TELUK CERAH", w / 2, 96);
    g.font = "bold 25px sans-serif"; g.fillText("KOTA MATAHARI TERBIT", w / 2, 134);
    g.shadowBlur = 0;
  });
}

class City {
  constructor(scene, seed) {
    this.rng = new Rng(seed);
    this.group = new THREE.Group();
    this.colliders = [];
    this.neonSigns = [];
    this.puddles = [];
    scene.add(this.group);
    this.buildGround();
    this.buildRoads();
    this.buildBlocks();
    this.buildShore();
    this.buildLandmarks();
    this.buildProps();
  }
  addBox(x, z, w, d, collider = true) { if (collider) this.colliders.push({ x, z, hw: w / 2, hd: d / 2 }); }

  buildGround() {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(900, 900),
      new THREE.MeshPhongMaterial({ color: 0x3d4742 }));
    g.rotation.x = -Math.PI / 2; g.position.y = -0.08; g.receiveShadow = true;
    this.group.add(g);
  }

  roadTexture(horizontal = false) {
    const rng = this.rng;
    const tex = makeCanvas(256, 256, (g, w, h) => {
      g.fillStyle = "#22252b"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${rng.int(120, 200)},${rng.int(120, 180)},${rng.int(110, 160)},${rng.float(0.03, 0.1)})`; g.fillRect(rng.float(0, w), rng.float(0, h), 2, 2); }
      for (let i = 0; i < 14; i++) { // bercak basah gelap mengkilap
        const bx = rng.float(0, w), by = rng.float(0, h);
        const gr = g.createRadialGradient(bx, by, 2, bx, by, rng.float(18, 46));
        gr.addColorStop(0, "rgba(140,190,220,0.20)"); gr.addColorStop(1, "rgba(140,190,220,0)");
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
      }
      g.save();
      if (horizontal) { g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); g.translate(-w / 2, -h / 2); }
      g.fillStyle = "#f7f3e8"; g.fillRect(6, 0, 5, h); g.fillRect(w - 11, 0, 5, h); // garis tepi
      g.fillStyle = "#ffd94d"; // marka tengah putus-putus
      for (let y = 0; y < h; y += 42) g.fillRect(w / 2 - 3, y, 6, 24);
      g.restore();
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  buildRoads() {
    const { blockSize, roadWidth, citySize } = WORLD;
    const texV = this.roadTexture(false); texV.repeat.set(1, 34);
    const texH = this.roadTexture(true); texH.repeat.set(34, 1);
    const matV = new THREE.MeshPhongMaterial({ map: texV, color: 0x8b939c, shininess: 90, specular: 0x8899aa });
    const matH = new THREE.MeshPhongMaterial({ map: texH, color: 0x8b939c, shininess: 90, specular: 0x8899aa });
    const half = citySize / 2;
    for (let c = -half; c <= half; c += blockSize) {
      for (const vertical of [true, false]) {
        const len = citySize + roadWidth;
        const geo = new THREE.PlaneGeometry(vertical ? roadWidth : len, vertical ? len : roadWidth);
        const m = new THREE.Mesh(geo, vertical ? matV : matH);
        m.rotation.x = -Math.PI / 2;
        m.position.set(vertical ? c : 0, 0.0, vertical ? 0 : c);
        if (c > WORLD.shoreZ - blockSize && !vertical) continue;
        m.receiveShadow = true;
        this.group.add(m);
      }
    }
    // trotoar terang di sepanjang jalan utama tengah
    const swMat = new THREE.MeshPhongMaterial({ color: 0x9a8f80 });
    for (const off of [-9.5, 9.5]) {
      const sw = new THREE.Mesh(new THREE.BoxGeometry(3, 0.22, citySize), swMat);
      sw.position.set(off, 0.11, 0); sw.receiveShadow = true; this.group.add(sw);
      const sw2 = new THREE.Mesh(new THREE.BoxGeometry(citySize, 0.22, 3), swMat);
      sw2.position.set(0, 0.11, off); sw2.receiveShadow = true; this.group.add(sw2);
    }
  }

  buildBlocks() {
    const rng = this.rng;
    const { blockSize, citySize } = WORLD;
    const half = citySize / 2;
    const roofTex = roofTexture(rng);
    let shopIdx = 0;
    for (let gx = -half + blockSize / 2; gx < half; gx += blockSize) {
      for (let gz = -half + blockSize / 2; gz < half; gz += blockSize) {
        if (gz > WORLD.shoreZ - 10) continue;
        if (Math.abs(gx) < 20 || Math.abs(gz) < 20) continue; // koridor jalan utama
        const n = rng.int(1, 2);
        for (let i = 0; i < n; i++) {
          const bw = rng.float(15, 26), bd = rng.float(15, 26);
          const floors = rng.int(2, 7);
          const bh = floors * 3.4 + rng.float(0, 3);
          const x = gx + rng.float(-8, 8), z = gz + rng.float(-8, 8);
          const base = rng.pick(PALETTE);
          const isShop = rng.chance(0.45);
          const shop = isShop ? { name: SHOP_SIGNS[shopIdx++ % SHOP_SIGNS.length], color: rng.pick(NEON) } : null;
          const texSun = facadeTexture(rng, base, floors, shop);
          const texShade = facadeTexture(rng, base, floors, shop);
          const matSun = new THREE.MeshPhongMaterial({ map: texSun, color: 0xffe2bb, shininess: 18, specular: 0x554433 });
          const matShade = new THREE.MeshPhongMaterial({ map: texShade, color: 0x9fb4cc, shininess: 18, specular: 0x334455 });
          const matRoof = new THREE.MeshPhongMaterial({ map: roofTex });
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd),
            [matSun, matShade, matRoof, matRoof, matSun, matShade]);
          mesh.position.set(x, bh / 2, z);
          mesh.rotation.y = rng.pick([0, 0, 0, Math.PI / 2]);
          mesh.castShadow = true; mesh.receiveShadow = true;
          this.group.add(mesh);
          this.addBox(x, z, bw + 1, bd + 1);
          // detail atap: unit AC + tangki air
          const ac = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 1.6), new THREE.MeshPhongMaterial({ color: 0x707880 }));
          ac.position.set(x + rng.float(-bw / 4, bw / 4), bh + 0.55, z + rng.float(-bd / 4, bd / 4));
          ac.castShadow = true; this.group.add(ac);
          if (rng.chance(0.4)) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.6, 10), new THREE.MeshPhongMaterial({ color: 0xb8572e, shininess: 40 }));
            tank.position.set(x - bw / 4, bh + 1.3, z - bd / 4); tank.castShadow = true; this.group.add(tank);
          }
          if (shop) this.addNeonSign(x, z, bw, bd, bh, shop);
          if (rng.chance(0.55)) this.addPalm(x + bw / 2 + 3.4, z + rng.float(-bd / 2, bd / 2));
          if (rng.chance(0.4)) this.addStreetlight(x - bw / 2 - 3, z + bd / 2 + 3);
        }
      }
    }
  }

  addNeonSign(x, z, bw, bd, bh, shop) {
    const rng = this.rng;
    const tex = signTexture(shop.name, shop.color);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.8),
      new THREE.MeshBasicMaterial({ map: tex, transparent: false }));
    const side = rng.pick([0, 1, 2, 3]);
    const offs = [[0, -bd / 2 - 0.4, Math.PI], [0, bd / 2 + 0.4, 0], [-bw / 2 - 0.4, 0, -Math.PI / 2], [bw / 2 + 0.4, 0, Math.PI / 2]];
    const [ox, oz, ry] = offs[side];
    sign.position.set(x + ox, Math.min(bh - 1.4, 5.6), z + oz);
    sign.rotation.y = ry;
    this.group.add(sign);
    this.neonSigns.push({ mesh: sign, color: shop.color, phase: rng.float(0, 6) });
    // REFLEKSI GEOMETRIS: salinan terbalik papan di jalan basah, ditarik
    // vertikal, digelapkan, tepinya dipecah garis riak.
    const rTex = makeCanvas(256, 128, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.save(); g.translate(0, h); g.scale(1, -1);
      g.globalAlpha = 0.85; g.drawImage(tex.image, 0, 0, w, 42); g.restore();
      g.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 26; i++) g.fillRect(0, rng.float(0, h), w, rng.float(1, 3));
      g.globalCompositeOperation = "source-over";
    });
    const refl = new THREE.Mesh(new THREE.PlaneGeometry(11, 9),
      new THREE.MeshBasicMaterial({ map: rTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    refl.rotation.x = -Math.PI / 2;
    refl.rotation.z = ry + Math.PI;
    const dist = 5.5;
    refl.position.set(x + ox + Math.sin(ry) * dist, 0.06, z + oz + Math.cos(ry) * dist);
    this.group.add(refl);
  }

  addPalm(x, z) {
    const rng = this.rng;
    const palm = new THREE.Group();
    const trunkMat = new THREE.MeshPhongMaterial({ color: 0x8a6a44 });
    let px = 0, pz = 0;
    for (let s = 0; s < 5; s++) { // batang melengkung bert segmen
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.34 - s * 0.03, 0.38 - s * 0.03, 1.5, 7), trunkMat);
      px += 0.16; seg.position.set(px, 0.7 + s * 1.35, pz);
      seg.rotation.z = -0.12; seg.castShadow = true; palm.add(seg);
    }
    const leafTex = makeCanvas(128, 64, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = "#2e9e4f"; g.lineWidth = 5;
      g.beginPath(); g.moveTo(2, h / 2); g.quadraticCurveTo(w / 2, h / 2 - 16, w - 2, h / 2 + 20); g.stroke();
      g.lineWidth = 2.4; g.strokeStyle = "#37b85c";
      for (let i = 0; i < 13; i++) { const t = i / 13; g.beginPath(); g.moveTo(6 + t * (w - 12), h / 2 + t * 16); g.lineTo(6 + t * (w - 12) + 5, h / 2 + t * 16 + 20); g.stroke(); }
    });
    for (let i = 0; i < 9; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.0),
        new THREE.MeshBasicMaterial({ map: leafTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.3 }));
      const a = (i / 9) * Math.PI * 2;
      leaf.position.set(px + Math.cos(a) * 1.6, 7.6, pz + Math.sin(a) * 1.6);
      leaf.rotation.set(0.7, -a, 0, "YXZ");
      palm.add(leaf);
    }
    const nut = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), new THREE.MeshPhongMaterial({ color: 0x6b4a26 }));
    nut.position.set(px, 7.1, pz); palm.add(nut);
    palm.position.set(x, 0, z);
    palm.rotation.y = rng.float(0, 6.28);
    const s = rng.float(0.85, 1.25); palm.scale.setScalar(s);
    this.group.add(palm);
  }

  addStreetlight(x, z) {
    const grp = new THREE.Group();
    const poleMat = new THREE.MeshPhongMaterial({ color: 0x2c3138 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.4, 8), poleMat);
    pole.position.y = 3.2; pole.castShadow = true; grp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.14, 0.14), poleMat);
    arm.position.set(0.8, 6.3, 0); grp.add(arm);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
    head.position.set(1.6, 6.2, 0); grp.add(head);
    // streak pantulan lampu di aspal basah
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 7),
      new THREE.MeshBasicMaterial({ color: 0xffc37a, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false }));
    streak.rotation.x = -Math.PI / 2; streak.position.set(1.6, 0.05, 0);
    grp.add(streak);
    grp.position.set(x, 0, z);
    grp.rotation.y = this.rng.float(0, 6.28);
    this.group.add(grp);
  }

  buildShore() {
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(900, 90), new THREE.MeshPhongMaterial({ color: 0xe8c98a }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(0, -0.02, WORLD.shoreZ + 55); sand.receiveShadow = true;
    this.group.add(sand);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 260),
      new THREE.MeshPhongMaterial({ color: 0x1177aa, shininess: 160, specular: 0xbfe8ff }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(0, -0.25, WORLD.shoreZ + 200);
    this.group.add(sea);
    // dermaga kayu + perahu sederhana
    const wood = new THREE.MeshPhongMaterial({ color: 0x7a5a38 });
    for (const dx of [-90, -30, 40, 110]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 42), wood);
      pier.position.set(dx, 0.25, WORLD.shoreZ + 26); pier.castShadow = true; this.group.add(pier);
      const boat = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.1, 8), new THREE.MeshPhongMaterial({ color: this.rng.pick([0xd23c2e, 0x2e7fc2, 0xf2f2f2]), shininess: 60 }));
      hull.position.y = 0.4; boat.add(hull);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 2.4), new THREE.MeshPhongMaterial({ color: 0xffffff }));
      cabin.position.set(0, 1.4, -0.6); boat.add(cabin);
      boat.position.set(dx + 6, 0.1, WORLD.shoreZ + 40);
      boat.rotation.y = this.rng.float(-0.3, 0.3);
      this.group.add(boat);
    }
    for (let i = 0; i < 16; i++) this.addPalm(this.rng.float(-210, 210), WORLD.shoreZ + this.rng.float(2, 16));
  }

  buildLandmarks() {
    const rng = this.rng;
    // mercusuar bergaris di ujung dermaga
    const lh = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(2.6 - i * 0.22, 2.8 - i * 0.22, 3.4, 14),
        new THREE.MeshPhongMaterial({ color: i % 2 ? 0xf4f0e6 : 0xd23c2e, shininess: 40 }));
      seg.position.y = 1.7 + i * 3.4; seg.castShadow = true; lh.add(seg);
    }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }));
    lamp.position.y = 22.6; lh.add(lamp);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.8, 12), new THREE.MeshPhongMaterial({ color: 0x27313a }));
    cap.position.y = 24.2; lh.add(cap);
    lh.position.set(168, 0, WORLD.shoreZ + 8);
    this.group.add(lh); this.addBox(168, WORLD.shoreZ + 8, 7, 7);
    // menara jam di pusat
    const tower = new THREE.Group();
    const tBody = new THREE.Mesh(new THREE.BoxGeometry(7, 26, 7), new THREE.MeshPhongMaterial({ color: 0xe8b34b, shininess: 30 }));
    tBody.position.y = 13; tBody.castShadow = true; tower.add(tBody);
    const clockTex = makeCanvas(128, 128, (g, w, h) => {
      g.fillStyle = "#fff8e2"; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill();
      g.strokeStyle = "#22252b"; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 56, 0, 7); g.stroke();
      g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 26); g.moveTo(64, 64); g.lineTo(92, 76); g.stroke();
    });
    for (const ry of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 5.4), new THREE.MeshBasicMaterial({ map: clockTex }));
      face.position.set(Math.sin(ry) * 3.56, 21.5, Math.cos(ry) * 3.56); face.rotation.y = ry; tower.add(face);
    }
    const tRoof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 4, 4), new THREE.MeshPhongMaterial({ color: 0x8a3324 }));
    tRoof.position.y = 28; tRoof.rotation.y = Math.PI / 4; tower.add(tRoof);
    tower.position.set(30, 0, -30); this.group.add(tower); this.addBox(30, -30, 8, 8);
    // pasar ikan: aula atap gelombang
    const hall = new THREE.Group();
    const hBase = new THREE.Mesh(new THREE.BoxGeometry(34, 5, 20), new THREE.MeshPhongMaterial({ color: 0xf2ead8 }));
    hBase.position.y = 2.5; hBase.castShadow = true; hall.add(hBase);
    for (let i = 0; i < 5; i++) {
      const arc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 20, 12, 1, false, 0, Math.PI),
        new THREE.MeshPhongMaterial({ color: 0x2f8f83, side: THREE.DoubleSide, shininess: 50 }));
      arc.rotation.z = Math.PI / 2; arc.rotation.y = Math.PI / 2;
      arc.position.set(-13.6 + i * 6.8, 5, 0); hall.add(arc);
    }
    const hSign = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.4), new THREE.MeshBasicMaterial({ map: signTexture("Pasar Ikan Pagi", "#00e5ff") }));
    hSign.position.set(0, 6.4, 10.2); hall.add(hSign);
    hall.position.set(-120, 0, 92); this.group.add(hall); this.addBox(-120, 92, 35, 21);
    // jembatan pelabuhan
    const bridge = new THREE.Group();
    const deck = new THREE.Mesh(new THREE.BoxGeometry(70, 1.2, 8), new THREE.MeshPhongMaterial({ color: 0x5a6672 }));
    deck.position.y = 7; bridge.add(deck);
    for (const px of [-24, 24]) {
      const py = new THREE.Mesh(new THREE.BoxGeometry(2.4, 14, 2.4), new THREE.MeshPhongMaterial({ color: 0x39424c }));
      py.position.set(px, 7, 0); bridge.add(py);
      const top = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 2), new THREE.MeshPhongMaterial({ color: 0x39424c }));
      top.position.set(px, 17, 0); bridge.add(top);
    }
    bridge.position.set(120, 0, WORLD.shoreZ + 30); bridge.rotation.y = 0.5;
    this.group.add(bridge);
    // taman kota: rumput + bangku
    const park = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), new THREE.MeshPhongMaterial({ color: 0x3f9e4d }));
    park.rotation.x = -Math.PI / 2; park.position.set(120, 0.03, -42); park.receiveShadow = true; this.group.add(park);
    for (let i = 0; i < 5; i++) this.addPalm(120 + rng.float(-14, 14), -42 + rng.float(-14, 14));
    // papan iklan besar
    const bb = new THREE.Group();
    const bbFace = new THREE.Mesh(new THREE.PlaneGeometry(17, 8.5), new THREE.MeshBasicMaterial({ map: billboardTexture(rng) }));
    bbFace.position.y = 10; bb.add(bbFace);
    const bbBack = new THREE.Mesh(new THREE.BoxGeometry(17.4, 8.9, 0.4), new THREE.MeshPhongMaterial({ color: 0x2c3138 }));
    bbBack.position.set(0, 10, -0.25); bb.add(bbBack);
    for (const px of [-6, 6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 6, 8), new THREE.MeshPhongMaterial({ color: 0x2c3138 })); p.position.set(px, 3, 0); bb.add(p); }
    bb.position.set(-32, 0, -64); bb.rotation.y = 0.6; this.group.add(bb);
  }

  buildProps() {
    const rng = this.rng;
    const canopyCols = ["#ff3860", "#ffb340", "#2f8f83", "#ffe93d", "#3f7fbf"];
    // kios & tenda pasar berwarna (jarak menengah)
    for (let i = 0; i < 14; i++) {
      const stall = new THREE.Group();
      const box = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 2.2), new THREE.MeshPhongMaterial({ color: 0x8a6a44 }));
      box.position.y = 0.8; box.castShadow = true; stall.add(box);
      const canTex = makeCanvas(64, 64, (g, w, h) => {
        for (let s = 0; s < 6; s++) { g.fillStyle = s % 2 ? "#ffffff" : rng.pick(canopyCols); g.fillRect((w / 6) * s, 0, w / 6, h); }
      });
      const can = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 3), new THREE.MeshPhongMaterial({ map: canTex }));
      can.position.y = 2.5; can.rotation.z = 0.1; stall.add(can);
      for (const [px, pz] of [[-1.8, -1.2], [1.8, -1.2], [-1.8, 1.2], [1.8, 1.2]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), new THREE.MeshPhongMaterial({ color: 0x444444 }));
        leg.position.set(px, 1.2, pz); stall.add(leg);
      }
      // dagangan berwarna di atas kios
      for (let f = 0; f < 6; f++) {
        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshPhongMaterial({ color: rng.pick([0xff8a1e, 0xd21f2e, 0x7ee08a, 0xffe93d]) }));
        fruit.position.set(rng.float(-1.3, 1.3), 1.75, rng.float(-0.7, 0.7)); stall.add(fruit);
      }
      const nearMarket = i < 8;
      stall.position.set(nearMarket ? -120 + rng.float(-26, 26) : rng.float(-180, 180), 0, nearMarket ? 92 + rng.float(14, 22) : rng.float(-160, 130));
      stall.rotation.y = rng.float(0, 6.28);
      this.group.add(stall);
    }
    // peti & drum dermaga, tumpukan ban bengkel, pagar konstruksi, gerobak
    const crateMat = new THREE.MeshPhongMaterial({ color: 0xa8793f });
    for (let i = 0; i < 26; i++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(rng.float(1, 1.8), rng.float(1, 1.8), rng.float(1, 1.8)), crateMat);
      crate.position.set(rng.float(90, 200), 0.6, WORLD.shoreZ + rng.float(-6, 14));
      crate.rotation.y = rng.float(0, 3); crate.castShadow = true; this.group.add(crate);
    }
    for (let i = 0; i < 12; i++) {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.3, 10),
        new THREE.MeshPhongMaterial({ color: rng.pick([0x2e7fc2, 0xd23c2e, 0x707880]), shininess: 60 }));
      drum.position.set(rng.float(90, 200), 0.65, WORLD.shoreZ + rng.float(-6, 12)); drum.castShadow = true; this.group.add(drum);
    }
    for (let i = 0; i < 5; i++) { // tumpukan ban
      const stack = new THREE.Group();
      for (let t = 0; t < 3; t++) {
        const tire = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.22, 8, 16), new THREE.MeshPhongMaterial({ color: 0x17181c }));
        tire.rotation.x = Math.PI / 2; tire.position.y = 0.25 + t * 0.42; stack.add(tire);
      }
      stack.position.set(-52 + i * 2.2, 0, 58); this.group.add(stack);
    }
    for (let i = 0; i < 7; i++) { // pagar konstruksi oranye
      const fence = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 0.12),
        new THREE.MeshPhongMaterial({ color: 0xff7a1e }));
      fence.position.set(60 + i * 4.1, 0.8, -96); fence.castShadow = true; this.group.add(fence);
    }
    // spanduk antar tiang
    const bannerTex = makeCanvas(256, 48, (g, w, h) => {
      g.fillStyle = "#ffe93d"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#d21f2e"; g.font = "bold 24px sans-serif"; g.textAlign = "center";
      g.fillText("FESTIVAL TELUK CERAH", w / 2, 32);
    });
    for (const [bx, bz, ry] of [[0, 100, 0], [-46, -92, Math.PI / 2], [46, -46, 0]]) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(15, 2.8), new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide }));
      b.position.set(bx, 7.4, bz); b.rotation.y = ry; this.group.add(b);
    }
    // genangan memantulkan langit — lebih tajam dari aspal basah
    for (let i = 0; i < 18; i++) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(rng.float(1.6, 3.6), 18),
        new THREE.MeshPhongMaterial({ color: 0x9fd4e8, shininess: 200, specular: 0xffffff, transparent: true, opacity: 0.55 }));
      p.rotation.x = -Math.PI / 2;
      p.scale.y = 0.55;
      p.position.set(rng.float(-200, 200), 0.045, rng.float(-200, 140));
      this.group.add(p); this.puddles.push(p);
    }
  }

  update(t) {
    for (const s of this.neonSigns) {
      const flicker = 0.82 + 0.18 * Math.sin(t * 2.1 + s.phase) * Math.sin(t * 0.7 + s.phase * 2);
      s.mesh.material.opacity = 1;
      s.mesh.scale.setScalar(0.995 + flicker * 0.005);
      s.mesh.material.color.setScalar(0.75 + flicker * 0.35);
    }
  }
  collide(pos, radius) {
    for (const c of this.colliders) {
      const dx = pos.x - c.x, dz = pos.z - c.z;
      const px = c.hw + radius - Math.abs(dx), pz = c.hd + radius - Math.abs(dz);
      if (px > 0 && pz > 0) {
        if (px < pz) pos.x += (dx > 0 ? px : -px); else pos.z += (dz > 0 ? pz : -pz);
      }
    }
    const lim = WORLD.citySize / 2 + 6;
    pos.x = Math.max(-lim, Math.min(lim, pos.x));
    pos.z = Math.max(-lim, Math.min(WORLD.shoreZ + 20, pos.z));
  }
}
export { City };
