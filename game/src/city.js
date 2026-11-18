// Generasi kota Teluk Cerah 3D: grid jalan, blok bangunan per distrik,
// palem, lampu jalan, kontainer pelabuhan, dan kerang kolektibel.
//
// Semua deterministik dari seed yang sama. Bangunan disimpan sebagai
// balok berpusat (x, z, w, d, h) — format yang dipakai renderer
// (InstancedMesh) dan tabrakan di bidang XZ. Detail pembulat dan neon
// ditambahkan renderer di atas data ini, jadi bentuk di layar tidak
// lagi terbaca sebagai balok polos.
import { CITY_HALF, ROAD_LINES, ROAD_WIDTH, districtAt } from './config.js';

export { districtAt };

export function isOnRoad(x, z) {
  const half = ROAD_WIDTH / 2;
  for (const line of ROAD_LINES) {
    if (Math.abs(x - line) <= half) return true;
    if (Math.abs(z - line) <= half) return true;
  }
  return false;
}

// Titik jalan terdekat dari (x, z): dipakai respawn traffic.
export function nearestRoadPoint(x, z) {
  let bx = x; let bz = z; let best = Infinity;
  for (const line of ROAD_LINES) {
    const dx = Math.abs(x - line);
    if (dx < best) { best = dx; bx = line; bz = z; }
    const dz = Math.abs(z - line);
    if (dz < best) { best = dz; bx = x; bz = line; }
  }
  return { x: bx, z: bz };
}

const PALETTE_OLD = [0x8a6a52, 0x7a5f4a, 0x6a5a48];
const PALETTE_CBD = [0x3a4a66, 0x32405c, 0x46587a];
const PALETTE_HOUSE = [0x8a5f4e, 0x7a5346, 0x96685a];
const PALETTE_PORT = [0x5f5648, 0x524a3e];
const PALETTE_MARINA = [0x9a7f5e, 0x8a6f52];

function styleFor(rng, district) {
  if (district === 'CBD') {
    const tall = rng.chance(0.5);
    return { color: rng.pick(PALETTE_CBD), tall };
  }
  if (district === 'Perumahan') return { color: rng.pick(PALETTE_HOUSE), tall: false };
  if (district === 'Pelabuhan') return { color: rng.pick(PALETTE_PORT), tall: false };
  if (district === 'Marina') return { color: rng.pick(PALETTE_MARINA), tall: false };
  return { color: rng.pick(PALETTE_OLD), tall: false };
}

export function createCity(rng) {
  const buildings = [];
  const palms = [];
  const lamps = [];
  const lines = ROAD_LINES;

  // Tiap blok di antara dua jalan diisi 1-3 bangunan + 2-5 palem.
  for (let i = 0; i < lines.length - 1; i += 1) {
    for (let j = 0; j < lines.length - 1; j += 1) {
      const x0 = lines[i] + ROAD_WIDTH / 2 + 4;
      const z0 = lines[j] + ROAD_WIDTH / 2 + 4;
      const x1 = lines[i + 1] - ROAD_WIDTH / 2 - 4;
      const z1 = lines[j + 1] - ROAD_WIDTH / 2 - 4;
      const district = districtAt((x0 + x1) / 2, (z0 + z1) / 2);
      const n = rng.int(1, 3);
      for (let k = 0; k < n; k += 1) {
        const w = rng.range(8, 16);
        const d = rng.range(8, 14);
        const bx = rng.range(x0 + w / 2, Math.max(x0 + w / 2 + 1, x1 - w / 2));
        const bz = rng.range(z0 + d / 2, Math.max(z0 + d / 2 + 1, z1 - d / 2));
        const { color, tall } = styleFor(rng, district);
        const h = tall ? rng.range(22, 48) : rng.range(6, 14);
        buildings.push({ x: bx, z: bz, w, d, h, color, tall, district });
      }
      const nPalms = rng.int(2, 5);
      for (let k = 0; k < nPalms; k += 1) {
        palms.push({ x: rng.range(x0, x1), z: rng.range(z0, z1), h: rng.range(5, 9) });
      }
    }
  }

  // Lampu jalan di tiap persimpangan + deret lampu di koridor chase
  // (z=12) dan pelabuhan (z=100) supaya kolam cahaya rapat di frame.
  for (const lx of lines) {
    for (const lz of lines) {
      lamps.push({ x: lx + ROAD_WIDTH / 2 + 1, z: lz + ROAD_WIDTH / 2 + 1 });
    }
  }
  for (let x = -100; x <= 110; x += 22) {
    lamps.push({ x, z: 12 - ROAD_WIDTH / 2 - 1 });
    lamps.push({ x: x + 11, z: 100 + ROAD_WIDTH / 2 + 1 });
  }

  // Kontainer pelabuhan (selatan) — dijaga dari jalan supaya tidak
  // menutup jalur lalu lintas.
  const containers = [];
  const containerColors = [0xc25e3a, 0x3a7d5e, 0x7a5ea8, 0xb8a03a];
  function onRoadCoord(v) {
    for (const line of lines) {
      if (Math.abs(v - line) < 9) return true;
    }
    return false;
  }
  for (let i = 0; i < 40; i += 1) {
    let cx = rng.range(-100, 110);
    let cz = rng.range(64, 112);
    let guard = 0;
    while ((onRoadCoord(cx) || onRoadCoord(cz)) && guard < 20) {
      cx = rng.range(-100, 110);
      cz = rng.range(64, 112);
      guard += 1;
    }
    containers.push({
      x: cx,
      z: cz,
      w: rng.range(6, 10),
      d: 3,
      h: rng.range(2.4, 3.2),
      color: rng.pick(containerColors),
    });
  }

  return { lines, buildings, palms, lamps, containers };
}

// Kerang Teluk: 24 titik di pinggir jalan, dipungut dengan lewat dekat.
export function createShells(rng) {
  const shells = [];
  for (let i = 0; i < 24; i += 1) {
    const line = rng.pick(ROAD_LINES);
    const along = rng.range(-110, 110);
    const side = rng.chance(0.5) ? 1 : -1;
    const vertical = rng.chance(0.5);
    shells.push({
      x: vertical ? line + side * (ROAD_WIDTH / 2 + 2) : along,
      z: vertical ? along : line + side * (ROAD_WIDTH / 2 + 2),
      taken: false,
    });
  }
  return shells;
}

// Dorong lingkaran (x, z, r) keluar dari bangunan; kembalikan posisi baru.
export function collideBuildings(city, x, z, r) {
  for (const b of city.buildings) {
    const nx = Math.max(b.x - b.w / 2, Math.min(x, b.x + b.w / 2));
    const nz = Math.max(b.z - b.d / 2, Math.min(z, b.z + b.d / 2));
    const dx = x - nx;
    const dz = z - nz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r && d2 > 0.001) {
      const d = Math.sqrt(d2);
      x = nx + (dx / d) * r;
      z = nz + (dz / d) * r;
    } else if (d2 <= 0.001) {
      const left = x - (b.x - b.w / 2);
      const right = (b.x + b.w / 2) - x;
      const front = z - (b.z - b.d / 2);
      const back = (b.z + b.d / 2) - z;
      const m = Math.min(left, right, front, back);
      if (m === left) x = b.x - b.w / 2 - r;
      else if (m === right) x = b.x + b.w / 2 + r;
      else if (m === front) z = b.z - b.d / 2 - r;
      else z = b.z + b.d / 2 + r;
    }
  }
  return { x, z };
}

export function clampToCity(x, z, margin) {
  return {
    x: Math.max(-CITY_HALF + margin, Math.min(CITY_HALF - margin, x)),
    z: Math.max(-CITY_HALF + margin, Math.min(CITY_HALF - margin, z)),
  };
}
