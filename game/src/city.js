// Teluk Cerah — pembangunan kota prosedural.
// Membangun jalan, gedung, lampu, pohon palem, rambu neon, dan properti ke
// dalam scene, lalu mengembalikan jaringan jalan untuk dipakai AI lalu lintas.

import * as ThreeModule from 'three';
import { CONFIG } from './config.js';

// Library tiga dimensi dimuat lewat import map sebagai "three". Berkas vendor
// adalah build klasik, jadi namespace modulnya kosong dan library menempel
// di global; bila suatu saat diganti build modul, namespace-nya yang dipakai.
const THREE = (ThreeModule && ThreeModule.Scene)
  ? ThreeModule
  : globalThis.THREE;
if (!THREE || !THREE.Scene) {
  throw new Error('three.js belum termuat: periksa game/vendor/three.min.js');
}

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

function makeCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

function toTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Tekstur fasad: dinding gelap dengan jendela yang sebagian menyala hangat
// atau dingin, sebagian gelap. Satu tekstur dipakai ramai-ramai per tipe.
function facadeTexture(rng, base, cols, rows) {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  // Noda halus supaya dinding tidak rata sempurna.
  for (let i = 0; i < 260; i++) {
    ctx.fillStyle = rng.chance(0.5)
      ? 'rgba(255,255,255,0.03)'
      : 'rgba(0,0,0,0.06)';
    ctx.fillRect(rng.range(0, 256), rng.range(0, 256), rng.range(2, 9), rng.range(2, 9));
  }
  const cellW = 256 / cols;
  const cellH = 256 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const roll = rng.next();
      const x = c * cellW + cellW * 0.22;
      const y = r * cellH + cellH * 0.22;
      const w = cellW * 0.56;
      const h = cellH * 0.56;
      if (roll < 0.52) {
        ctx.fillStyle = rng.pick(['#ffd9a0', '#ffbf6e', '#bfe0ff', '#fff2c8', '#ffc98a']);
        ctx.fillRect(x, y, w, h);
      } else if (roll < 0.66) {
        ctx.fillStyle = 'rgba(255,214,150,0.28)';
        ctx.fillRect(x, y, w, h);
      } else {
        ctx.fillStyle = 'rgba(8,10,16,0.85)';
        ctx.fillRect(x, y, w, h);
      }
    }
  }
  // Lantai dasar lebih gelap, seperti etalase dan pintu masuk.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(0, 256 - cellH, 256, cellH);
  return toTexture(canvas);
}

function awningTexture() {
  const { canvas, ctx } = makeCanvas(256, 64);
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d23b3b' : '#f2ead8';
    ctx.fillRect(i * 32, 0, 32, 64);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, 52, 256, 12);
  return toTexture(canvas);
}

function neonTexture(text, color) {
  const { canvas, ctx } = makeCanvas(512, 160);
  ctx.clearRect(0, 0, 512, 160);
  // Kecilkan ukuran huruf sampai seluruh teks muat di dalam kanvas dengan
  // ruang sisa untuk glow, supaya tidak ada huruf yang terpotong di tepi.
  let glyph = 96;
  ctx.font = 'bold ' + glyph + 'px Arial, sans-serif';
  while (glyph > 20 && ctx.measureText(text).width > 452) {
    glyph -= 4;
    ctx.font = 'bold ' + glyph + 'px Arial, sans-serif';
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 34;
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 82);
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 256, 82);
  return toTexture(canvas);
}

// Merenggangkan UV kotak satuan supaya jendela pada tekstur fasad tetap
// berukuran wajar berapa pun tinggi gedungnya.
function scaleBoxUVs(geo, w, h, d, uUnit, vUnit) {
  const uv = geo.attributes.uv;
  const faces = [
    [d / uUnit, h / vUnit], // +x
    [d / uUnit, h / vUnit], // -x
    [w / uUnit, d / uUnit], // +y
    [w / uUnit, d / uUnit], // -y
    [w / uUnit, h / vUnit], // +z
    [w / uUnit, h / vUnit], // -z
  ];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, uv.getX(i) * faces[f][0], uv.getY(i) * faces[f][1]);
    }
  }
  uv.needsUpdate = true;
  return geo;
}

export function buildCity(scene, rng) {
  const W = CONFIG.world;
  const halfW = W.width / 2;
  const halfD = W.depth / 2;

  // Garis tengah jalan dan titik tengah blok.
  const roadX = [];
  for (let i = 0; i <= W.cols; i++) roadX.push(-halfW + W.roadWidth / 2 + i * (W.blockSize + W.roadWidth));
  const roadZ = [];
  for (let j = 0; j <= W.rows; j++) roadZ.push(-halfD + W.roadWidth / 2 + j * (W.blockSize + W.roadWidth));
  const blockCX = [];
  for (let i = 0; i < W.cols; i++) blockCX.push(-halfW + W.roadWidth + W.blockSize / 2 + i * (W.blockSize + W.roadWidth));
  const blockCZ = [];
  for (let j = 0; j < W.rows; j++) blockCZ.push(-halfD + W.roadWidth + W.blockSize / 2 + j * (W.blockSize + W.roadWidth));

  function districtAt(col, row) {
    if (row === W.rows - 1) return 'Pelabuhan';
    if (col <= 1) return 'Marina';
    if (row === 0) return 'Perumahan';
    if (col <= 3) return 'Kota Tua';
    return 'CBD';
  }
  function districtDef(name) {
    return CONFIG.districts.find((d) => d.name === name);
  }

  // ---- Tekstur dan material bersama --------------------------------------
  const texAwning = awningTexture();

  // Satu set fasad: material + ukuran tile tekstur (meter) supaya jendela
  // tetap berukuran wajar berapa pun tinggi gedungnya.
  function facadeSet(base, cols, rows) {
    const tex = facadeTexture(rng, base, cols, rows);
    return {
      material: new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.6,
        roughness: 0.88,
        metalness: 0.05,
      }),
      u: cols * 3,
      v: rows * 3,
    };
  }
  const facTower = facadeSet('#2b3247', 8, 14);
  const facMid = facadeSet('#33291d', 7, 8);
  const facHouse = facadeSet('#2c231c', 5, 3);
  const facDepot = facadeSet('#2e2e26', 8, 3);
  const matRoofDark = new THREE.MeshStandardMaterial({ color: 0x232c3d, roughness: 0.9 });
  const matRoad = new THREE.MeshStandardMaterial({ color: CONFIG.colors.road, roughness: 0.3, metalness: 0.5 });
  const matSidewalk = new THREE.MeshStandardMaterial({ color: 0x20242e, roughness: 0.92 });
  const matGround = new THREE.MeshStandardMaterial({ color: CONFIG.colors.ground, roughness: 1 });
  const matWater = new THREE.MeshStandardMaterial({ color: CONFIG.colors.water, roughness: 0.16, metalness: 0.65 });
  const matSand = new THREE.MeshStandardMaterial({ color: CONFIG.colors.sand, roughness: 1 });
  const matDash = new THREE.MeshBasicMaterial({ color: CONFIG.colors.roadLine });
  const matZebra = new THREE.MeshBasicMaterial({ color: 0xcfd4dd, transparent: true, opacity: 0.5 });

  const dummy = new THREE.Object3D();

  // ---- Tanah dasar, laut, dan pasir --------------------------------------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1100, 900), matGround);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  ground.receiveShadow = true;
  scene.add(ground);

  const sea = new THREE.Mesh(new THREE.PlaneGeometry(220, 700), matWater);
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(-halfW - 118, CONFIG.world.seaLevel, 0);
  scene.add(sea);

  const sand = new THREE.Mesh(new THREE.PlaneGeometry(26, W.depth + 40), matSand);
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(-halfW - 8, -0.05, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  // ---- Jalan ---------------------------------------------------------------
  const roads = [];
  for (let i = 0; i <= W.cols; i++) {
    const x = roadX[i];
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(W.roadWidth, W.depth), matRoad);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(x, 0.01, 0);
    strip.receiveShadow = true;
    scene.add(strip);
    const avenue = i === 4 || i === 5;
    for (let j = 0; j < W.rows; j++) {
      roads.push({ start: { x, z: roadZ[j] }, end: { x, z: roadZ[j + 1] }, axis: 'z', avenue });
    }
  }
  for (let j = 0; j <= W.rows; j++) {
    const z = roadZ[j];
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(W.width, W.roadWidth), matRoad);
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.015, z);
    strip.receiveShadow = true;
    scene.add(strip);
    const avenue = j === 2 || j === 3;
    for (let i = 0; i < W.cols; i++) {
      roads.push({ start: { x: roadX[i], z }, end: { x: roadX[i + 1], z }, axis: 'x', avenue });
    }
  }

  // Marka garis putus-putus di tengah jalan (satu instanced mesh).
  const dashGeo = new THREE.PlaneGeometry(0.35, 3.2);
  dashGeo.rotateX(-Math.PI / 2);
  const dashSpots = [];
  for (let i = 0; i <= W.cols; i++) {
    for (let z = -halfD + 10; z < halfD - 6; z += 9) dashSpots.push([roadX[i], z, 0]);
  }
  for (let j = 0; j <= W.rows; j++) {
    for (let x = -halfW + 10; x < halfW - 6; x += 9) dashSpots.push([x, roadZ[j], Math.PI / 2]);
  }
  const dashes = new THREE.InstancedMesh(dashGeo, matDash, dashSpots.length);
  dashSpots.forEach(([x, z, rot], idx) => {
    dummy.position.set(x, 0.03, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    dashes.setMatrixAt(idx, dummy.matrix);
  });
  dashes.instanceMatrix.needsUpdate = true;
  scene.add(dashes);

  // Zebra cross di setiap persimpangan (satu instanced mesh).
  const stripeGeo = new THREE.PlaneGeometry(3.4, 0.85);
  stripeGeo.rotateX(-Math.PI / 2);
  const stripeSpots = [];
  for (let i = 0; i <= W.cols; i++) {
    for (let j = 0; j <= W.rows; j++) {
      for (let k = -4; k <= 4; k++) {
        stripeSpots.push([roadX[i] + k * 1.7, roadZ[j] - W.roadWidth / 2 + 2.2, 0]);
        stripeSpots.push([roadX[i] - W.roadWidth / 2 + 2.2, roadZ[j] + k * 1.7, Math.PI / 2]);
      }
    }
  }
  const stripes = new THREE.InstancedMesh(stripeGeo, matZebra, stripeSpots.length);
  stripeSpots.forEach(([x, z, rot], idx) => {
    dummy.position.set(x, 0.025, z);
    dummy.rotation.set(0, rot, 0);
    dummy.updateMatrix();
    stripes.setMatrixAt(idx, dummy.matrix);
  });
  stripes.instanceMatrix.needsUpdate = true;
  scene.add(stripes);

  // ---- Blok, trotoar, dan gedung ------------------------------------------
  const blocks = [];
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const neonSigns = [];

  function addBuilding(cx, cz, w, h, d, fac, def, kind) {
    const geo = scaleBoxUVs(unitBox.clone(), w, h, d, fac.u, fac.v);
    const mesh = new THREE.Mesh(geo, fac.material);
    mesh.scale.set(w, h, d);
    mesh.position.set(cx, h / 2, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    if (kind === 'tower') {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 1.4, d * 0.55), matRoofDark);
      cap.position.set(cx, h + 0.7, cz);
      scene.add(cap);
      const mast = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 7, 6),
        new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6, metalness: 0.7 }),
      );
      mast.position.set(cx + w * 0.2, h + 4.5, cz);
      scene.add(mast);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0xff3b30 }),
      );
      tip.position.set(cx + w * 0.2, h + 8.2, cz);
      scene.add(tip);
    } else if (kind === 'house') {
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(Math.max(w, d) * 0.72, 3.2, 4),
        new THREE.MeshStandardMaterial({ color: def.roofColor, roughness: 0.9 }),
      );
      roof.position.set(cx, h + 1.6, cz);
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      scene.add(roof);
    } else {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.5, d + 0.8), matRoofDark);
      slab.position.set(cx, h + 0.25, cz);
      scene.add(slab);
    }
    return mesh;
  }

  function addAwning(cx, cz, w, faceAngle) {
    const awn = new THREE.Mesh(
      new THREE.PlaneGeometry(w, 2.6),
      new THREE.MeshStandardMaterial({ map: texAwning, roughness: 0.9, side: THREE.DoubleSide }),
    );
    awn.position.set(cx, 3.4, cz);
    awn.rotation.set(-0.5, faceAngle, 0);
    scene.add(awn);
  }

  function addNeon(text, color, w, h, x, y, z, faceAngle, roadXat, roadZat, alongX) {
    const tex = neonTexture(text, color);
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      // Satu sisi saja: dari belakang gedung, teks tidak boleh tampak
      // terbalik (cermin) — rambu hanya terbaca dari jalan di depannya.
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    sign.position.set(x, y, z);
    sign.rotation.y = faceAngle;
    scene.add(sign);
    const back = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.6, h + 0.6),
      new THREE.MeshBasicMaterial({ color: 0x0a0a12 }),
    );
    back.position.set(x, y, z);
    back.rotation.y = faceAngle;
    back.translateZ(-0.12);
    scene.add(back);
    // Coretan pantulan neon di jalan basah, memanjang sejajar jalan.
    const streakLen = 24 + rng.range(0, 14);
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(alongX ? streakLen : 1.7, alongX ? 1.7 : streakLen),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.26,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    streak.rotation.x = -Math.PI / 2;
    streak.position.set(roadXat, 0.04, roadZat);
    scene.add(streak);
    neonSigns.push({ text, color, x, z });
  }

  const signPool = {
    CBD: [
      ['SALON', '#39ff88'], ['HOTEL CERAH', '#5a8cff'], ['KOPI TELUK', '#ff9a3c'],
      ['LAUNDRY', '#c77dff'], ['BAR PANTAI', '#37e6ff'],
    ],
    'Kota Tua': [
      ['WARUNG SENJA', '#ff4fa3'], ['NASI GORENG', '#ffe14d'], ['BENGKEL', '#37e6ff'],
      ['TOKO SENJA', '#ff9a3c'],
    ],
    Marina: [['BAR PANTAI', '#37e6ff'], ['ES KELAPA', '#ffe14d'], ['KOPI TELUK', '#ff9a3c']],
    Perumahan: [['WARUNG SENJA', '#ff4fa3'], ['LAUNDRY', '#c77dff']],
    Pelabuhan: [['PASAR MALAM', '#39ff88'], ['PIZZA', '#ff5a4d'], ['BENGKEL', '#37e6ff']],
  };

  for (let col = 0; col < W.cols; col++) {
    for (let row = 0; row < W.rows; row++) {
      const cx = blockCX[col];
      const cz = blockCZ[row];
      const district = districtAt(col, row);
      const def = districtDef(district);
      blocks.push({ col, row, cx, cz, w: W.blockSize, d: W.blockSize, district, x0: cx - 40, z0: cz - 40, x1: cx + 40, z1: cz + 40 });

      const walk = new THREE.Mesh(new THREE.BoxGeometry(W.blockSize + 4, 0.24, W.blockSize + 4), matSidewalk);
      walk.position.set(cx, 0.12, cz);
      walk.receiveShadow = true;
      scene.add(walk);

      if (district === 'CBD') {
        const count = 2;
        for (let b = 0; b < count; b++) {
          const bx = cx + (b === 0 ? -17 : 17) + rng.range(-3, 3);
          const bz = cz + rng.range(-14, 14);
          const bw = rng.range(20, 26);
          const bd = rng.range(20, 26);
          const bh = rng.range(def.heightMin, def.heightMax);
          addBuilding(bx, bz, bw, bh, bd, facTower, def, 'tower');
          if (rng.chance(0.75)) {
            const [text, color] = rng.pick(signPool.CBD);
            const face = rng.chance(0.5) ? 0 : Math.PI;
            const sx = bx;
            const sz = bz + (face === 0 ? bd / 2 + 0.4 : -bd / 2 - 0.4);
            addNeon(text, color, rng.range(12, 18), rng.range(3.2, 4.4), sx, rng.range(9, 15), sz, face, sx, face === 0 ? cz + 48 : cz - 48, true);
          }
        }
      } else if (district === 'Kota Tua') {
        const count = 3;
        for (let b = 0; b < count; b++) {
          const bx = cx + (b - 1) * 24 + rng.range(-3, 3);
          const bz = cz + rng.range(-16, 16);
          const bw = rng.range(15, 19);
          const bd = rng.range(15, 19);
          const bh = rng.range(def.heightMin, def.heightMax);
          addBuilding(bx, bz, bw, bh, bd, facMid, def, 'flat');
          if (rng.chance(0.5)) addAwning(bx, bz + bd / 2 + 1.2, bw * 0.8, 0);
          if (rng.chance(0.6)) {
            const [text, color] = rng.pick(signPool['Kota Tua']);
            addNeon(text, color, rng.range(10, 14), 3.2, bx, rng.range(7, 10), bz + bd / 2 + 0.4, 0, bx, cz + 48, true);
          }
        }
      } else if (district === 'Perumahan') {
        const count = 4;
        let southHouse = null;
        for (let b = 0; b < count; b++) {
          const bx = cx + (b % 2 === 0 ? -18 : 18) + rng.range(-3, 3);
          const bz = cz + (b < 2 ? -16 : 16) + rng.range(-3, 3);
          const bw = rng.range(10, 13);
          const bd = rng.range(10, 13);
          const bh = rng.range(def.heightMin, def.heightMax);
          addBuilding(bx, bz, bw, bh, bd, facHouse, def, 'house');
          if (b >= 2 && (!southHouse || bz > southHouse.bz)) southHouse = { bx, bz, bd };
        }
        if (southHouse && rng.chance(0.7)) {
          const [text, color] = rng.pick(signPool.Perumahan);
          addNeon(text, color, 10, 2.8, southHouse.bx, 6.5, southHouse.bz + southHouse.bd / 2 + 0.4, 0, southHouse.bx, cz + 48, true);
        }
      } else if (district === 'Marina') {
        let southShop = null;
        for (let b = 0; b < 2; b++) {
          const bx = cx + (b === 0 ? -14 : 16);
          const bz = cz + rng.range(-12, 12);
          const bw = rng.range(14, 18);
          const bh = rng.range(def.heightMin, def.heightMax);
          const bd = rng.range(14, 18);
          addBuilding(bx, bz, bw, bh, bd, facMid, def, 'flat');
          if (!southShop || bz > southShop.bz) southShop = { bx, bz, bd };
        }
        if (southShop && rng.chance(0.6)) {
          const [text, color] = rng.pick(signPool.Marina);
          addNeon(text, color, rng.range(11, 15), 3.4, southShop.bx, rng.range(7, 10), southShop.bz + southShop.bd / 2 + 0.4, 0, southShop.bx, cz + 48, true);
        }
      } else {
        // Pelabuhan: gudang besar + tumpukan kontainer.
        const bx = cx + rng.range(-8, 8);
        const bz = cz + rng.range(-10, 10);
        const bw = rng.range(30, 38);
        const bh = rng.range(def.heightMin, def.heightMax);
        const bd = rng.range(20, 26);
        addBuilding(bx, bz, bw, bh, bd, facDepot, def, 'flat');
        const faceZ = bz + bd / 2 + 0.4;
        if (col === 3 && row === 4) {
          // Rambu besar PASAR MALAM untuk adegan baku tembak, menempel di
          // fasad selatan gudang menghadap jalan raya selatan.
          addNeon('PASAR MALAM', '#39ff88', 26, 7, bx, 13, faceZ, 0, bx, cz + 48, true);
          addAwning(bx, faceZ + 1.2, 24, 0);
          // Papan kedua khusus adegan baku tembak: berdiri di tepi kanan
          // jalan shootout (sisi minus-x), menghadap kamera, supaya terbaca
          // jelas di sisi kanan frame. Papan lama di fasad gudang dibiarkan.
          // Posisi digeser mendekati sumbu pandang kamera agar seluruh teks
          // muat di dalam frame (di x 32 teksnya terpotong tepi kanan).
          addNeon('PASAR MALAM', '#39ff88', 13.5, 3.9, 38, 7, 140, 2.88, 40, 130, false);
          addAwning(38, 140, 12, 2.88);
          // Dua tiang penopang di ujung bawah papan supaya papan tidak
          // mengambang; posisinya mengikuti arah hadap papan.
          const postMat = new THREE.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.9 });
          for (const [px, pz] of [[31.5, 138.3], [44.5, 141.7]]) {
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.2, 0.5), postMat);
            post.position.set(px, 2.6, pz);
            scene.add(post);
          }
        } else if (rng.chance(0.6)) {
          const [text, color] = rng.pick(signPool.Pelabuhan);
          addNeon(text, color, rng.range(11, 15), 3.4, bx, rng.range(7, 10), faceZ, 0, bx, cz + 48, true);
        }
      }
    }
  }

  // Coretan neon tambahan di jalan basah sepanjang avenue CBD.
  const streakColors = [CONFIG.colors.neonGreen, CONFIG.colors.neonPink, CONFIG.colors.neonOrange, CONFIG.colors.neonCyan];
  for (let s = 0; s < 12; s++) {
    const color = streakColors[s % streakColors.length];
    const alongX = rng.chance(0.5);
    const streak = new THREE.Mesh(
      new THREE.PlaneGeometry(alongX ? rng.range(18, 34) : 1.6, alongX ? 1.6 : rng.range(18, 34)),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16 + rng.range(0, 0.14), blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    streak.rotation.x = -Math.PI / 2;
    const rx = rng.pick([roadX[4], roadX[5], roadX[3]]);
    streak.position.set(rx + rng.range(-4, 4), 0.035, rng.range(-halfD + 20, halfD - 20));
    scene.add(streak);
  }

  // ---- Pohon palem (instanced: batang + pelepah) ---------------------------
  const palmSpots = [];
  for (let i = 0; i <= W.cols; i++) {
    for (let z = -halfD + 24; z < halfD - 12; z += 48) {
      if (rng.chance(0.75)) palmSpots.push([roadX[i] + (rng.chance(0.5) ? 10.5 : -10.5), z + rng.range(-6, 6)]);
    }
  }
  for (let j = 0; j <= W.rows; j++) {
    for (let x = -halfW + 24; x < halfW - 12; x += 56) {
      if (rng.chance(0.55)) palmSpots.push([x + rng.range(-6, 6), roadZ[j] + (rng.chance(0.5) ? 10.5 : -10.5)]);
    }
  }
  const trunkGeo = new THREE.CylinderGeometry(0.16, 0.3, 7.5, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.palmTrunk, roughness: 0.95 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, palmSpots.length);
  const frondGeo = new THREE.ConeGeometry(0.6, 3.6, 4);
  frondGeo.scale(1, 1, 0.2);
  const frondMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.palmLeaf, roughness: 0.9 });
  const fronds = new THREE.InstancedMesh(frondGeo, frondMat, palmSpots.length * 7);
  palmSpots.forEach(([x, z], idx) => {
    const lean = rng.range(-0.07, 0.07);
    dummy.position.set(x, 3.75, z);
    dummy.rotation.set(lean, rng.range(0, Math.PI * 2), lean * 0.6);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunks.setMatrixAt(idx, dummy.matrix);
    const crownY = 7.4;
    for (let f = 0; f < 7; f++) {
      const around = (f / 7) * Math.PI * 2 + rng.range(-0.2, 0.2);
      const tilt = rng.range(0.9, 1.25);
      dummy.position.set(x + Math.cos(around) * 1.1, crownY + 0.4, z + Math.sin(around) * 1.1);
      dummy.rotation.set(0, 0, 0);
      dummy.rotateY(-around + Math.PI / 2);
      dummy.rotateX(tilt);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      fronds.setMatrixAt(idx * 7 + f, dummy.matrix);
    }
  });
  trunks.instanceMatrix.needsUpdate = true;
  fronds.instanceMatrix.needsUpdate = true;
  trunks.castShadow = true;
  scene.add(trunks);
  scene.add(fronds);

  // ---- Lampu jalan (instanced) + beberapa cahaya nyata ---------------------
  const lampSpots = [];
  for (let i = 0; i <= W.cols; i++) {
    for (let j = 0; j <= W.rows; j++) {
      if ((i + j) % 2 === 0) lampSpots.push([roadX[i] + 9.5, roadZ[j] + 9.5]);
    }
  }
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 6.4, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c313c, roughness: 0.6, metalness: 0.7 });
  const poles = new THREE.InstancedMesh(poleGeo, poleMat, lampSpots.length);
  const headGeo = new THREE.SphereGeometry(0.3, 8, 6);
  const headMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.lampWarm });
  const heads = new THREE.InstancedMesh(headGeo, headMat, lampSpots.length);
  lampSpots.forEach(([x, z], idx) => {
    dummy.position.set(x, 3.2, z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    poles.setMatrixAt(idx, dummy.matrix);
    dummy.position.set(x - 0.7, 6.5, z);
    dummy.updateMatrix();
    heads.setMatrixAt(idx, dummy.matrix);
  });
  poles.instanceMatrix.needsUpdate = true;
  heads.instanceMatrix.needsUpdate = true;
  scene.add(poles);
  scene.add(heads);

  const glowSpots = [
    [188, -48, 0xffb46b],
    [188, 48, 0xff9a3c],
    [-52, -144, 0xffd9a0],
    [140, 0, 0x39ff88],
    [-58, 162, 0x39ff88],
    [92, -144, 0xff4fa3],
  ];
  for (const [x, z, color] of glowSpots) {
    const lamp = new THREE.PointLight(color, 1.6, 55, 1.6);
    lamp.position.set(x, 7, z);
    scene.add(lamp);
  }

  // ---- Kontainer pelabuhan (instanced, warna-warni) ------------------------
  const boxGeo = new THREE.BoxGeometry(6.2, 2.7, 2.7);
  const boxMat = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.25 });
  const containerSpots = [];
  for (let col = 0; col < W.cols; col++) {
    for (let row = 0; row < W.rows; row++) {
      if (districtAt(col, row) !== 'Pelabuhan') continue;
      const cx = blockCX[col];
      const cz = blockCZ[row];
      const stacks = 3 + Math.floor(rng.next() * 3);
      for (let s = 0; s < stacks; s++) {
        const sx = cx + rng.range(-26, 26);
        const sz = cz + rng.range(-26, 26);
        const levels = 1 + Math.floor(rng.next() * 2);
        for (let l = 0; l < levels; l++) {
          containerSpots.push([sx, 1.35 + l * 2.7, sz, rng.chance(0.5) ? 0 : Math.PI / 2]);
        }
      }
    }
  }
  const containers = new THREE.InstancedMesh(boxGeo, boxMat, containerSpots.length);
  const palette = CONFIG.colors.container.map((c) => new THREE.Color(c));
  containerSpots.forEach(([x, y, z, rot], idx) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    containers.setMatrixAt(idx, dummy.matrix);
    containers.setColorAt(idx, palette[idx % palette.length]);
  });
  containers.instanceMatrix.needsUpdate = true;
  if (containers.instanceColor) containers.instanceColor.needsUpdate = true;
  containers.castShadow = true;
  containers.receiveShadow = true;
  scene.add(containers);

  // ---- Hydrant dan pepohonan taman -----------------------------------------
  const hydrantGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.9, 8);
  const hydrantMat = new THREE.MeshStandardMaterial({ color: 0xb8302a, roughness: 0.7 });
  const hydrantSpots = [];
  for (let i = 0; i < 18; i++) {
    hydrantSpots.push([rng.pick(roadX) + 10.5, rng.range(-halfD + 20, halfD - 20)]);
  }
  const hydrants = new THREE.InstancedMesh(hydrantGeo, hydrantMat, hydrantSpots.length);
  hydrantSpots.forEach(([x, z], idx) => {
    dummy.position.set(x, 0.45, z);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    hydrants.setMatrixAt(idx, dummy.matrix);
  });
  hydrants.instanceMatrix.needsUpdate = true;
  scene.add(hydrants);

  const treeGeo = new THREE.ConeGeometry(2.2, 5.5, 7);
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x2a6e44, roughness: 0.95 });
  const treeSpots = [];
  for (let i = 0; i < 26; i++) {
    const col = Math.floor(rng.next() * W.cols);
    const row = Math.floor(rng.next() * W.rows);
    if (districtAt(col, row) === 'CBD') continue;
    treeSpots.push([blockCX[col] + rng.range(-30, 30), blockCZ[row] + rng.range(-30, 30)]);
  }
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, treeSpots.length);
  treeSpots.forEach(([x, z], idx) => {
    dummy.position.set(x, 2.75, z);
    dummy.rotation.set(0, rng.range(0, Math.PI * 2), 0);
    dummy.updateMatrix();
    trees.setMatrixAt(idx, dummy.matrix);
  });
  trees.instanceMatrix.needsUpdate = true;
  trees.castShadow = true;
  scene.add(trees);

  // ---- Titik-titik penting ---------------------------------------------------
  // Nama Indonesia dan Inggris disediakan berdampingan supaya modul misi
  // bisa memakai titik bernama yang mana pun; koordinat fallback tetap ada
  // di daftar mission bila sebuah nama belum dikenal.
  const safehouse = { x: 44, z: -192, label: 'Safehouse Perumahan' };
  const warehouse = { x: 140, z: 192, label: 'Gudang Pelabuhan' };
  const coffeeShop = { x: -52, z: 48, label: 'Warung Kopi Teluk' };
  const weaponShop = { x: 140, z: 0, label: 'Toko Senjata' };
  const garage = { x: -52, z: 0, label: 'Garasi Dimas' };
  const hospital = { x: -148, z: -96, label: 'Rumah Sakit' };
  const policeStation = { x: 236, z: -96, label: 'Kantor Polisi' };
  const points = {
    playerStart: { x: -52, z: -138, heading: Math.PI },
    safehouse,
    warehouse,
    portWarehouse: warehouse,
    gudang: warehouse,
    gudangPelabuhan: warehouse,
    coffeeShop,
    warungKopi: coffeeShop,
    shop: weaponShop,
    weaponShop,
    tokoSenjata: weaponShop,
    garage,
    garasi: garage,
    hospital,
    rumahSakit: hospital,
    policeStation,
    kantorPolisi: policeStation,
    beach: { x: -296, z: 0 },
    port: { x: 44, z: 192 },
    taxiStand: { x: 44, z: 6 },
    mission: [
      { x: 44, z: -192, label: 'M1 Pulang Kampung' },
      { x: -52, z: 192, label: 'M2 Titipan' },
      { x: -148, z: 0, label: 'M3 Utang Lama' },
      { x: 188, z: -144, label: 'M4 Balapan Liar' },
      { x: 140, z: 0, label: 'M5 Rampok Toko' },
      { x: 140, z: 192, label: 'M6 Puncak' },
      { x: -244, z: -96, label: 'M7 Kurir Malam' },
      { x: 44, z: 96, label: 'M8 Bayangan' },
      { x: -148, z: 192, label: 'M9 Heist Pelabuhan' },
      { x: 236, z: 192, label: 'M10 Raja Teluk' },
    ],
  };

  return { roads, blocks, points, roadX, roadZ, blockCX, blockCZ, neonSigns };
}
