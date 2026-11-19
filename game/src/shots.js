import 'three';
const THREE = window.THREE;
import { showDialog, showBanner, showMap, hideTitle, showTitle } from './hud.js';
import { ensureTraffic } from './vehicles.js';
import { ensurePedestrians } from './pedestrians.js';
import { ensurePolice } from './police.js';
import { ensureEnemies } from './combat.js';
import { ensureHelicopter } from './helicopter.js';

// Arah hadap dalam radian. Timur berarti melaju ke +x, selatan
// berarti berjalan ke +z, barat berarti melaju ke -x.
const EAST = -Math.PI / 2;
const SOUTH = Math.PI;
const NORTH = 0;
const WEST = Math.PI / 2;

// Avenue CBD tempat kejar-kejaran dan tembak-menembak: jalan
// timur-barat di z = 84, trotoar di z = 75 dan z = 93. Monumen
// kerang raksasa berdiri di x = -28 — hero mulai DI TIMUR monumen
// supaya kamera tidak menabrak cangkangnya.
const AVENUE_Z = 84;
const WALK_NORTH = 75.4;
const WALK_SOUTH = 92.6;
const SHELL_X = -28;
// Putaran 4: hero chase melaju di lajur selatan (z = 87), bukan di
// tengah jalan — batang palem di tepi utara yang tadinya menutupi
// mobil polisi kiri bergeser ke tepi kiri frame, polisi jadi bersih.
const CHASE_Z = 87;

// Tanda neon buatan sendiri: kanvas digradasi, huruf menyala,
// pijar radial di belakangnya. Dipakai untuk papan di avenue dan
// gudang, supaya frame chase dan shootout punya neon yang terbaca.
function glowBoard(scene, main, sub, fg, bg, w, h, x, y, z, ry) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, bg);
  grad.addColorStop(1, '#1a1024');
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg;
  g.lineWidth = 5;
  g.strokeRect(8, 8, 496, 112);
  g.shadowColor = fg;
  g.shadowBlur = 24;
  g.fillStyle = fg;
  g.font = 'bold 54px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(main, 256, sub ? 52 : 66);
  if (sub) {
    g.shadowBlur = 10;
    g.font = 'bold 26px Arial, sans-serif';
    g.fillStyle = '#ffffff';
    g.fillText(sub, 256, 98);
  }
  g.shadowBlur = 0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: tex })
  );
  board.position.set(x, y, z);
  board.rotation.y = ry;
  scene.add(board);
  const halo = document.createElement('canvas');
  halo.width = 64;
  halo.height = 64;
  const hg = halo.getContext('2d');
  const rg = hg.createRadialGradient(32, 32, 2, 32, 32, 32);
  rg.addColorStop(0, fg);
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  hg.fillStyle = rg;
  hg.fillRect(0, 0, 64, 64);
  const haloTex = new THREE.CanvasTexture(halo);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: haloTex, transparent: true, opacity: 0.45, depthWrite: false,
  }));
  sprite.scale.set(w * 1.6, h * 2.6, 1);
  sprite.position.set(x, y, z);
  scene.add(sprite);
  if (!scene.userData.telukAnim) scene.userData.telukAnim = [];
  scene.userData.telukAnim.push({ mat: sprite.material, phase: Math.random() * 6.28, base: 0.45, kind: 'glow' });
  return board;
}

// Tiang penyangga papan neon supaya tidak melayang.
function addPole(scene, x, z, top) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, top, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.8 })
  );
  pole.position.set(x, top / 2, z);
  scene.add(pole);
  return pole;
}

// Mobil sport pertama di lalu lintas dijadikan mobil hero: cat pink
// khas Teluk Cerah dan pelat belakang bertuliskan TC RAKA.
function pickHero(state) {
  ensureTraffic(state, 14);
  const cars = state.cars || [];
  let hero = null;
  for (const car of cars) {
    if (car.kind === 'sport') { hero = car; break; }
  }
  if (!hero && cars.length > 0) hero = cars[0];
  if (!hero) return null;
  hero.kind = 'sport';
  const paint = hero.group && hero.group.userData ? hero.group.userData.paint : null;
  if (paint && paint.color) paint.color.setHex(0xef6ea6);
  if (typeof hero.maxSpeed === 'number') hero.maxSpeed = 30;
  if (!hero.group.userData.plateR6) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const g = c.getContext('2d');
    g.fillStyle = '#f4f4f4';
    g.fillRect(0, 0, 256, 64);
    g.strokeStyle = '#222222';
    g.lineWidth = 5;
    g.strokeRect(3, 3, 250, 58);
    g.fillStyle = '#16224a';
    g.font = 'bold 36px Arial';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('TC RAKA', 128, 34);
    const tex = new THREE.CanvasTexture(c);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.24),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    plate.position.set(0, 0.52, 2.47);
    hero.group.add(plate);
    hero.group.userData.plateR6 = plate;
  }
  return hero;
}

function seatDriver(state, car, x, z, heading, speed) {
  const player = state.player;
  if (!player || !car) return;
  if (player.car && player.car !== car && player.car.driver === player) player.car.driver = null;
  car.driver = player;
  player.car = car;
  player.onFoot = false;
  player.group.visible = false;
  car.heading = heading;
  car.angle = heading;
  car.group.rotation.y = heading;
  car.group.position.set(x, 0, z);
  player.group.position.copy(car.group.position);
  player.heading = heading;
  player.speed = speed || 0;
  car.speed = speed || 0;
}

function standPlayer(state, x, z, heading) {
  const player = state.player;
  if (!player) return;
  if (player.car) {
    player.car.driver = null;
    player.car = null;
  }
  player.onFoot = true;
  player.group.visible = true;
  player.group.position.set(x, 0, z);
  player.heading = heading;
  player.group.rotation.y = heading;
  player.speed = 0;
  player.speedKmh = 0;
}

// Ruas jalan timur-barat di avenue dan ruas utara-selatan di x yang
// diminta, dicari dari jaringan kota.
function avenueSeg(state) {
  const segs = (state.city && state.city.segments) || [];
  for (const s of segs) {
    if (s.alongX && Math.abs((s.a ? s.a.z : 0) - AVENUE_Z) < 1) return s;
  }
  return null;
}
function crossSeg(state, x) {
  const segs = (state.city && state.city.segments) || [];
  for (const s of segs) {
    if (!s.alongX && Math.abs((s.a ? s.a.x : 0) - x) < 1) return s;
  }
  return null;
}
// Avenue jauh di utara (z = -140, Perumahan): tempat memarkir lalu
// lintas yang tidak boleh masuk frame shootout.
function farNorthSeg(state) {
  const segs = (state.city && state.city.segments) || [];
  for (const s of segs) {
    if (s.alongX && Math.abs((s.a ? s.a.z : 0) + 140) < 1) return s;
  }
  return null;
}

// Lalu lintas di depan hero, di jalurnya sendiri supaya tetap
// terlihat saat gambar diambil: tiga mobil di avenue dan satu mobil
// menyeberang di persimpangan x = 56, sudah dekat dengan avenue.
function arrangeTraffic(state) {
  const cars = state.cars || [];
  const hero = state.player ? state.player.car : null;
  const ave = avenueSeg(state);
  const cross = crossSeg(state, 56);
  const spots = [60, 90, 120];
  let placed = 0;
  for (const car of cars) {
    if (car === hero) continue;
    if (placed < spots.length && ave) {
      car.seg = ave;
      car.prog = (spots[placed] + 168) / 336;
      car.speed = 14 + placed * 2;
      car.parked = false;
      placed++;
      continue;
    }
    if (placed === spots.length && cross) {
      car.seg = cross;
      car.prog = (60 + 140) / 280;
      car.speed = 12;
      car.parked = false;
      placed++;
    }
  }
}

// Dua mobil polisi mengapit hero di kiri-kanan, sedikit di depan
// hidung mobil, dengan jarak lateral 4,2 supaya keduanya masuk
// penuh di dalam frame. Unit ketiga diparkir jauh di belakang
// supaya tidak masuk frame dari bawah.
function arrangeChasePolice(state, heroX, heroZ, heading) {
  const force = ensurePolice(state);
  const units = (force && force.units) || [];
  state.police = units;
  const slots = [
    { x: heroX + 5, z: heroZ - 4.2 },
    { x: heroX + 3, z: heroZ + 4.2 },
  ];
  units.forEach((u, i) => {
    if (!u.group) return;
    if (i < 2) {
      const s = slots[i];
      u.group.position.set(s.x, 0, s.z);
      u.heading = heading;
      u.group.rotation.y = heading;
      u.speed = 27;
      u.status = 'pursuit';
      u.distance = 5 + i * 3;
    } else {
      u.group.position.set(heroX - 70, 0, heroZ);
      u.heading = heading;
      u.group.rotation.y = heading;
      u.speed = 25;
      u.status = 'pursuit';
      u.distance = 70;
    }
  });
  return units;
}

function setShotNumbers(state, o) {
  state.money = o.money;
  state.wanted = o.wanted;
  state.hour = o.hour;
  state.day = o.day;
  state.missionNum = o.mission;
  state.shells = o.shells;
  if (state.player) {
    if (typeof o.health === 'number') state.player.health = o.health;
    if (typeof o.armor === 'number') state.player.armor = o.armor;
    if (typeof o.weapon === 'number') {
      state.player.weaponIndex = o.weapon;
      state.player.weapon = o.weapon;
    }
    if (state.player.ammo) {
      if (typeof o.pistol === 'number') state.player.ammo.pistol = o.pistol;
      if (typeof o.shotgun === 'number') state.player.ammo.shotgun = o.shotgun;
    }
    if (typeof o.nos === 'number') state.player.nos = o.nos;
  }
  if (o.hero) o.hero.condition = o.condition !== undefined ? o.condition : 88;
  state.hudOverride = {
    mission: { title: o.missionTitle, next: o.missionNext, reward: o.missionReward },
    objective: o.objective,
    radio: { station: 'Pantai FM', song: '"Senja di Teluk" · Lagu Raya' },
  };
}

function stageChase(state) {
  ensureTraffic(state, 14);
  ensurePedestrians(state, 36);
  const hero = pickHero(state);
  // Mulai di timur monumen kerang (x = -28) supaya kamera rendah
  // tidak menabrak cangkang raksasa itu; lajur selatan (z = 87)
  // supaya batang palem utara tidak menutupi polisi kiri.
  const heroX = 0;
  if (hero) {
    hero.parked = false;
    seatDriver(state, hero, heroX, CHASE_Z, EAST, 27.7);
  }
  arrangeChasePolice(state, heroX, CHASE_Z, EAST);
  arrangeTraffic(state);
  const peds = state.pedestrians || [];
  const pedSpots = [
    [10, WALK_NORTH, EAST], [30, WALK_SOUTH, WEST], [55, WALK_NORTH, EAST],
    [80, WALK_SOUTH, WEST], [105, WALK_NORTH, EAST], [130, WALK_SOUTH, WEST],
    [20, WALK_SOUTH, WEST], [140, WALK_NORTH, EAST],
  ];
  peds.forEach((p, i) => {
    const s = pedSpots[i % pedSpots.length];
    p.group.position.set(s[0], 0, s[1]);
    p.heading = s[2];
    p.group.rotation.y = s[2];
    p.mode = 'walk';
  });
  const heli = ensureHelicopter(state);
  if (heli) {
    state.helicopter = heli;
    heli.group.position.set(heroX + 40, 20, CHASE_Z - 5);
  }
  const scene = state.scene || (state.world && state.world.scene) || null;
  if (scene) {
    glowBoard(scene, 'TELUK CERAH', 'PASAR MALAM · PANTAI · KOPI', '#ff4fa3', '#3a1030', 24, 6, 75, 13, AVENUE_Z, -Math.PI / 2);
    addPole(scene, 75, 76.5, 10);
    addPole(scene, 75, 91.5, 10);
    glowBoard(scene, 'WARUNG SENJA', '', '#ffb02e', '#3a1c2e', 8, 2, 55, 5, 93.5, Math.PI);
    addPole(scene, 55, 93.5, 4);
    glowBoard(scene, 'KOPI TELUK', '', '#7dffc8', '#12303a', 8, 2, 80, 5, 74.5, 0);
    addPole(scene, 80, 74.5, 4);
  }
  setShotNumbers(state, {
    money: 48275, wanted: 4, hour: 18.67, day: 3, mission: 5, shells: 9,
    health: 88, armor: 0, weapon: 1, pistol: 12, shotgun: 0, nos: 82,
    hero, condition: 88,
    missionTitle: 'M5 — "Rampok Toko" TAHAP 2/2',
    missionNext: 'NEXT: Kabur ke safehouse Perumahan (wanted 4)',
    missionReward: 'Hadiah $900 · +150 REP',
    objective: 'Kabur ke safehouse Perumahan (wanted 4)',
  });
  showBanner(state, 'HELIKOPTER POLISI DI ATAS');
  showDialog(state, 'Dimas', 'Lepas helikopter itu dulu sebelum ke garasi! Ganti mobil, ganti warna, apa saja!');
}

function stageShootout(state) {
  ensureTraffic(state, 14);
  ensurePedestrians(state, 36);
  // Raka di avenue menghadap timur; musuh di jalan di depannya,
  // kios Pasar Malam dan rambu hijaunya di kanan, mobil polisi di
  // kiri, monumen kerang jauh di tengah jalan sebagai latar.
  // (Jangan menghadap selatan: monumen kerang di (-28, 84) menutup
  // seluruh frame dari arah itu.)
  const px = -70;
  const pz = AVENUE_Z;
  standPlayer(state, px, pz, EAST);
  const foes = ensureEnemies(state);
  const foeSpots = [
    [-56, 81], [-48, 86], [-40, 82], [-34, 87], [-60, 87],
  ];
  foes.forEach((e, i) => {
    const s = foeSpots[i % foeSpots.length];
    e.group.position.set(s[0], 0, s[1]);
    e.heading = WEST;
    e.group.rotation.y = WEST;
    e.group.rotation.x = 0;
    e.alive = true;
    e.health = e.boss ? 220 : 100;
    if (e.marker) e.marker.visible = true;
    if (e.pivots && e.pivots.marker) e.pivots.marker.visible = true;
  });
  if (state.combat) {
    state.combat.demoFire = true;
    state.combat.defeated = 1;
  }
  // Mobil polisi diparkir sebagai roadblock supaya tidak mengejar dan
  // menabrak pemain selama gambar diambil: satu di tepi kiri frame,
  // satu jauh di depan kiri, satu di belakang kamera.
  const force = ensurePolice(state);
  const units = (force && force.units) || [];
  state.police = units;
  const copSpots = [
    { x: -55, z: 76, h: EAST },
    { x: -20, z: 78, h: EAST },
    { x: -95, z: 84, h: EAST },
  ];
  units.forEach((u, i) => {
    if (!u.group) return;
    const s = copSpots[i % copSpots.length];
    u.group.position.set(s.x, 0, s.z);
    u.heading = s.h;
    u.group.rotation.y = s.h;
    u.speed = 0;
    u.status = 'roadblock';
    u.distance = 15 + i * 20;
  });
  // Dua mobil parkir sebagai penutup di tepi jalan; SEMUA mobil lalu
  // lintas lain dipindah ke avenue jauh di utara (z = -140) supaya
  // tidak ada mobil acak yang lewat tepat di belakang pemain saat
  // gambar diambil.
  const cars = state.cars || [];
  const hero = state.player ? state.player.car : null;
  const parked = [
    { x: -40, z: 90, h: EAST },
    { x: -15, z: 78, h: WEST },
  ];
  const far = farNorthSeg(state);
  let pi = 0;
  let fi = 0;
  for (const car of cars) {
    if (car === hero) continue;
    if (pi < parked.length) {
      const s = parked[pi];
      pi++;
      car.seg = null;
      car.speed = 0;
      car.parked = true;
      car.group.position.set(s.x, 0, s.z);
      car.heading = s.h;
      car.group.rotation.y = s.h;
      continue;
    }
    if (far) {
      car.seg = far;
      car.prog = 0.1 + (fi % 8) * 0.1;
      car.speed = 10 + (fi % 3) * 2;
      car.parked = false;
      fi++;
    }
  }
  const peds = state.pedestrians || [];
  const pedSpots = [
    [-65, 75.4, EAST], [-50, 92.6, WEST], [-35, 75.4, EAST],
    [-20, 92.6, WEST], [-60, 92.6, EAST], [-10, 75.4, WEST],
  ];
  peds.forEach((p, i) => {
    const s = pedSpots[i % pedSpots.length];
    p.group.position.set(s[0], 0, s[1]);
    p.heading = s[2];
    p.group.rotation.y = s[2];
    p.mode = 'walk';
  });
  const heli = ensureHelicopter(state);
  if (heli) {
    state.helicopter = heli;
    heli.group.position.set(px + 40, 20, pz - 5);
  }
  const scene = state.scene || (state.world && state.world.scene) || null;
  if (scene) {
    glowBoard(scene, 'GUDANG KERANG', 'PELABUHAN TELUK CERAH', '#7de3ff', '#0f2a22', 11, 2.6, -28, 6, 103.8, Math.PI);
  }
  setShotNumbers(state, {
    money: 18325, wanted: 3, hour: 19.6, day: 1, mission: 10, shells: 0,
    health: 84, armor: 0, weapon: 1, pistol: 5, shotgun: 0,
    hero: null,
    missionTitle: 'M10 — "Raja Teluk" TAHAP 1/2',
    missionNext: 'NEXT: Habisi bos geng dan 5 pengawalnya',
    missionReward: 'Hadiah $2000 · +300 REP',
    objective: 'Habisi bos geng dan 5 pengawalnya — 1/6 dikalahkan',
  });
  showBanner(state, 'MISI 10 — RAJA TELUK');
  showDialog(state, 'Bu Sari', 'Ini puncaknya, Raka. Bos geng dan pengawalnya berkumpul di gudang. Habisi mereka, lalu pergi dari pelabuhan — Teluk Cerah jadi milikmu.');
}

function stageMap(state) {
  setShotNumbers(state, {
    money: 48250, wanted: 4, hour: 18.67, day: 3, mission: 9, shells: 9,
    hero: null,
    missionTitle: 'M9 — "Heist Pelabuhan" TAHAP 1/2',
    missionNext: 'NEXT: Kumpulkan tim di gudang pelabuhan',
    missionReward: 'Hadiah $1200 · +200 REP',
    objective: 'Kumpulkan tim di gudang pelabuhan',
  });
  const force = ensurePolice(state);
  if (force && force.units) state.police = force.units;
  showMap(state, true);
}

function stageTitle(state) {
  ensureTraffic(state, 14);
  ensurePedestrians(state, 36);
  const hero = pickHero(state);
  if (hero) {
    hero.parked = true;
    hero.speed = 0;
    hero.group.position.set(30, 0, AVENUE_Z);
    hero.heading = EAST;
    hero.group.rotation.y = EAST;
  }
  // Pemain disembunyikan: kamera judul mengikuti posisinya, tapi
  // figurnya tidak boleh berdiri di tengah menu.
  standPlayer(state, 10, AVENUE_Z, EAST);
  if (state.player) state.player.group.visible = false;
  const peds = state.pedestrians || [];
  const pedSpots = [
    [-10, WALK_NORTH, EAST], [0, WALK_SOUTH, WEST], [20, WALK_NORTH, EAST],
    [40, WALK_SOUTH, WEST], [55, WALK_NORTH, EAST], [70, WALK_SOUTH, WEST],
  ];
  peds.forEach((p, i) => {
    const s = pedSpots[i % pedSpots.length];
    p.group.position.set(s[0], 0, s[1]);
    p.heading = s[2];
    p.group.rotation.y = s[2];
    p.mode = 'walk';
  });
  const force = ensurePolice(state);
  const units = (force && force.units) || [];
  state.police = units;
  units.forEach((u, i) => {
    if (!u.group) return;
    u.group.position.set(-60 - i * 20, 0, 120 + i * 10);
    u.speed = 0;
    u.status = 'roadblock';
    u.distance = 78 + i * 14;
  });
  const heli = ensureHelicopter(state);
  if (heli) {
    state.helicopter = heli;
    heli.group.visible = false;
    if (heli.pool) heli.pool.visible = false;
    if (heli.cone) heli.cone.visible = false;
  }
  setShotNumbers(state, {
    money: 14830, wanted: 0, hour: 18.5, day: 3, mission: 7, shells: 7,
    hero: null,
    missionTitle: 'M7 — "Kurir Malam" TAHAP 1/2',
    missionNext: 'NEXT: Antar paket ke dermaga',
    missionReward: 'Hadiah $700 · +120 REP',
    objective: 'Antar paket ke dermaga',
  });
  showTitle(state);
  showMap(state, false);
}

export function stageShot(state, name) {
  state.shotName = name;
  state.shotApplied = true;
  const force = ensurePolice(state);
  if (force && force.units) state.police = force.units;
  if (name === 'title') {
    stageTitle(state);
    return;
  }
  hideTitle(state);
  showMap(state, false);
  if (name === 'chase') stageChase(state);
  else if (name === 'shootout') stageShootout(state);
  else if (name === 'map') stageMap(state);
  else stageTitle(state);
}

export function applyShotFromAddress(state) {
  if (state.shotApplied) return;
  let name = 'title';
  try {
    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot === 'chase' || shot === 'shootout' || shot === 'map' || shot === 'title') name = shot;
  } catch (err) {
    name = 'title';
  }
  stageShot(state, name);
}
