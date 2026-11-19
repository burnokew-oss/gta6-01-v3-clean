// player.js — Raka: figur manusia berproporsi wajar dengan kepala,
// wajah, torso, lengan dan kaki berartikulasi, berjalan, berlari,
// membidik, mengemudi, masuk dan mencuri mobil.
// Revisi 2: mobil meluncur pelan tanpa gas (kecepatan staging bertahan
// untuk screenshot), arah hadap mengikuti mobil saat dikendarai, dan
// kondisi mobil dibaca dari mobilnya sendiri.
// Semua bentuk dibuat prosedural; tidak ada aset luar.

function shirtTexture(base, fold) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = fold;
    const x = Math.random() * 128;
    ctx.fillRect(x, 0, 3 + Math.random() * 5, 128);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Figur manusia lengkap. Menghadap -Z saat rotasi 0.
export function buildPersonFigure(opts = {}) {
  const skin = opts.skin || 0xe8b98a;
  const shirtCol = opts.shirt || '#3a9a4a';
  const pantsCol = opts.pants || '#23262e';
  const hairCol = opts.hair || 0x241a12;
  const capCol = opts.cap || null;
  const scale = opts.scale || 1;
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.65 });
  const shirtMat = new THREE.MeshStandardMaterial({
    map: shirtTexture(shirtCol, '#000000'), roughness: 0.85,
  });
  const pantsMat = new THREE.MeshStandardMaterial({ color: pantsCol, roughness: 0.9 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairCol, roughness: 0.9 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1c1c20, roughness: 0.55 });

  const fig = new THREE.Group();
  const pivots = {};

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.155, 0.56, 14), shirtMat);
  torso.position.y = 1.19;
  torso.castShadow = true;
  fig.add(torso);
  pivots.torso = torso;
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), shirtMat);
  shoulders.scale.set(1.35, 0.55, 0.85);
  shoulders.position.y = 1.44;
  fig.add(shoulders);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 8, 16), shirtMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.48;
  fig.add(collar);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10), skinMat);
  neck.position.y = 1.53;
  fig.add(neck);
  const head = new THREE.Group();
  head.position.y = 1.68;
  fig.add(head);
  pivots.head = head;
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 16), skinMat);
  skull.scale.set(0.92, 1.05, 0.96);
  skull.castShadow = true;
  head.add(skull);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), hairMat);
  hair.scale.set(0.95, 0.85, 0.98);
  hair.position.set(0, 0.045, 0.03);
  head.add(hair);
  if (capCol) {
    const capMat = new THREE.MeshStandardMaterial({ color: capCol, roughness: 0.8 });
    const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.175, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    capTop.scale.set(0.95, 0.75, 0.98);
    capTop.position.y = 0.03;
    head.add(capTop);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16), capMat);
    brim.scale.set(1, 1, 1.25);
    brim.position.set(0, 0.06, -0.1);
    head.add(brim);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.4 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 6), eyeMat);
    eye.position.set(s * 0.06, 0.02, -0.148);
    head.add(eye);
    const brow = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), hairMat);
    brow.scale.set(1.4, 0.45, 0.5);
    brow.position.set(s * 0.06, 0.075, -0.148);
    head.add(brow);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), skinMat);
  nose.scale.set(0.8, 1.2, 0.8);
  nose.position.set(0, -0.02, -0.16);
  head.add(nose);
  const smile = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI * 0.85),
    new THREE.MeshStandardMaterial({ color: 0x7a4a30, roughness: 0.7 })
  );
  smile.position.set(0, -0.075, -0.145);
  smile.rotation.z = Math.PI + Math.PI * 0.075;
  smile.rotation.x = 0.15;
  head.add(smile);

  function buildArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.26, 1.44, 0);
    fig.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 10), shirtMat);
    upper.position.y = -0.15;
    upper.castShadow = true;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.28, 10), skinMat);
    fore.position.y = -0.14;
    fore.castShadow = true;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), skinMat);
    hand.scale.set(0.85, 1.15, 0.95);
    hand.position.y = -0.31;
    elbow.add(hand);
    return { shoulder, elbow, hand };
  }
  pivots.armL = buildArm(-1);
  pivots.armR = buildArm(1);

  function buildLeg(side) {
    const hip = new THREE.Group();
    hip.position.set(side * 0.1, 0.92, 0);
    fig.add(hip);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.42, 10), pantsMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.4, 10), pantsMat);
    shin.position.y = -0.2;
    shin.castShadow = true;
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), shoeMat);
    shoe.scale.set(1, 0.55, 1.7);
    shoe.position.set(0, -0.42, -0.04);
    knee.add(shoe);
    return { hip, knee, shoe };
  }
  pivots.legL = buildLeg(-1);
  pivots.legR = buildLeg(1);

  const gun = new THREE.Group();
  const gunMetal = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.35, metalness: 0.8 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.3, 8), gunMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0, -0.12);
  gun.add(barrel);
  const slide = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.16, 8), gunMetal);
  slide.rotation.x = Math.PI / 2;
  slide.position.set(0, 0.02, -0.05);
  gun.add(slide);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.16, 8), gunMetal);
  grip.rotation.x = 0.35;
  grip.position.set(0, -0.08, 0.03);
  gun.add(grip);
  gun.position.set(0, -0.33, -0.05);
  gun.visible = false;
  pivots.armR.hand.add(gun);
  pivots.gun = gun;

  fig.scale.setScalar(scale);
  fig.userData.pivots = pivots;
  return { group: fig, pivots };
}

function resolveStart(state) {
  const net = state.roads || state.network || state.city || null;
  const p = net?.playerStart || net?.startPoint || net?.spawnPoint || net?.points?.playerStart || null;
  if (p && typeof p.x === 'number') return { x: p.x, z: p.z || 0 };
  return { x: 28, z: 46 };
}

function keyDown(input, ...names) {
  if (!input || !input.keys) return false;
  for (const n of names) if (input.keys[n]) return true;
  return false;
}

function pressedOnce(input, ...names) {
  if (!input) return false;
  if (typeof input.takePressed === 'function') {
    for (const n of names) {
      try {
        if (input.takePressed(n)) return true;
      } catch (e) { /* lanjut */ }
    }
    return false;
  }
  if (!input.keys) return false;
  if (!input._prevKeys) input._prevKeys = {};
  for (const n of names) {
    const now = !!input.keys[n];
    const was = !!input._prevKeys[n];
    input._prevKeys[n] = now;
    if (now && !was) return true;
  }
  return false;
}

export function createPlayer(state) {
  const world = state.world || state.scene || null;
  const scene = world?.scene || world;
  const built = buildPersonFigure({ shirt: '#3a9a4a', pants: '#23262e', cap: 0x1c1c20 });
  const group = built.group;
  const start = resolveStart(state);
  group.position.set(start.x, 0, start.z);
  group.rotation.y = Math.PI;
  if (scene && scene.add) scene.add(group);
  const player = {
    group,
    mesh: group,
    position: group.position,
    heading: Math.PI,
    angle: Math.PI,
    speed: 0,
    velocity: { x: 0, z: 0 },
    health: 100,
    hp: 100,
    armor: 0,
    weaponIndex: 0,
    weapon: 0,
    // Amunisi bentuk objek { pistol, shotgun } — sesuai yang dibaca HUD
    // dan dipakai staging; jangan array.
    ammo: { pistol: 12, shotgun: 0 },
    reserveAmmo: { pistol: 12, shotgun: 0 },
    speedKmh: 0,
    car: null,
    vehicle: null,
    currentCar: null,
    nos: 100,
    walkPhase: 0,
    moving: false,
    running: false,
    pivots: built.pivots,
    money: state.cash || 0,
  };
  // main memanggil createPlayer(state) tanpa memakai nilai balik,
  // jadi pemain harus didaftarkan ke state di sini.
  state.player = player;
  state.pemain = player;
  return player;
}

function nearestCarHere(state, point, maxDist) {
  const traffic = state.cars || state.traffic || state.vehicles || [];
  const police = state.police || state.polisi || [];
  const units = Array.isArray(police) ? police : (police.units || police.cars || []);
  const cars = traffic.concat(units);
  let best = null;
  let bestD = maxDist;
  for (const car of cars) {
    if (!car || !car.position) continue;
    const d = Math.hypot(car.position.x - point.x, car.position.z - point.z);
    if (d < bestD) {
      bestD = d;
      best = car;
    }
  }
  return best;
}

export function updatePlayer(state, dt) {
  const player = state.player || state.pemain;
  if (!player || !player.group) return;
  // Mobil yang dikendarai pemain adalah mobil hero: cat pink khas
  // Teluk Cerah, sekali saja saat pertama kali dikendarai.
  const pc = player.car || player.vehicle || player.currentCar || null;
  if (pc && !pc._heroPainted) {
    const grp = pc.group || pc.mesh || pc;
    const paint = grp?.userData?.paint || pc.paint || null;
    if (paint && paint.color && typeof paint.color.set === 'function') {
      paint.color.set(0xef6ea6);
      pc._heroPainted = true;
    }
  }
  const input = state.input || null;
  const step = Math.min(dt, 0.05);
  const pivots = player.pivots || player.group.userData.pivots || null;

  if (input && input.mouse) {
    const m = input.mouse;
    if (typeof m.dx === 'number' && m.dx !== 0) {
      player.heading -= m.dx * 0.0032;
      m.dx = 0;
    } else if (typeof m.movementX === 'number' && m.movementX !== 0) {
      player.heading -= m.movementX * 0.0032;
      m.movementX = 0;
    }
  }
  if (keyDown(input, 'ArrowLeft')) player.heading += 2.4 * step;
  if (keyDown(input, 'ArrowRight')) player.heading -= 2.4 * step;
  player.angle = player.heading;

  const wantEnter = pressedOnce(input, 'KeyE', 'e', 'E');
  const wantSteal = pressedOnce(input, 'KeyF', 'f', 'F');

  if (player.car) {
    // ---- mengemudi ----
    const car = player.car;
    // adopsi kecepatan mobil bila staging yang mengaturnya
    if ((!player.speed || player.speed === 0) && car.speed > 1) player.speed = car.speed;
    // arah hadap mengikuti mobil bila tidak sedang menyetir
    const fwd = keyDown(input, 'KeyW', 'w', 'W', 'ArrowUp');
    const back = keyDown(input, 'KeyS', 's', 'S', 'ArrowDown');
    const left = keyDown(input, 'KeyA', 'a', 'A');
    const right = keyDown(input, 'KeyD', 'd', 'D');
    const brake = keyDown(input, 'Space', ' ');
    const boost = keyDown(input, 'ShiftLeft', 'ShiftRight', 'Shift');
    if (!left && !right && typeof car.heading === 'number') {
      player.heading = car.heading;
      player.angle = player.heading;
    }
    const maxSpeed = car.kind === 'sport' ? 40 : car.kind === 'truck' ? 24 : car.kind === 'taxi' ? 30 : 28;
    const top = boost && player.nos > 0 ? maxSpeed * 1.45 : maxSpeed;
    if (boost && player.nos > 0 && fwd) player.nos = Math.max(0, player.nos - 26 * step);
    else player.nos = Math.min(100, player.nos + 4 * step);
    if (fwd) player.speed += 16 * step;
    else if (back) player.speed -= player.speed > 0.5 ? 22 * step : 9 * step;
    else player.speed *= Math.exp(-step * 0.12);
    if (brake) player.speed *= Math.exp(-step * 4.5);
    player.speed = Math.max(-9, Math.min(top, player.speed));
    const steer = (left ? 1 : 0) - (right ? 1 : 0);
    const steerAuthority = Math.min(1, Math.abs(player.speed) / 8);
    if (steer !== 0) {
      player.heading += steer * 1.9 * steerAuthority * step * (player.speed >= 0 ? 1 : -1);
      player.angle = player.heading;
    }
    const fx = -Math.sin(player.heading);
    const fz = -Math.cos(player.heading);
    car.position.x += fx * player.speed * step;
    car.position.z += fz * player.speed * step;
    car.heading = player.heading;
    car.angle = player.heading;
    car.speed = player.speed;
    car.velocity.x = fx * player.speed;
    car.velocity.z = fz * player.speed;
    car.group.rotation.y = player.heading;
    player.position.set(car.position.x, 0, car.position.z);
    player.velocity.x = fx * player.speed;
    player.velocity.z = fz * player.speed;
    state.speed = player.speed;
    state.speedKmh = Math.abs(player.speed) * 3.6;
    player.speedKmh = state.speedKmh;
    state.nos = player.nos;
    state.condition = typeof car.condition === 'number' ? car.condition : 100;
    if (car.wheels) {
      const spin = (player.speed * step) / 0.38;
      for (const w of car.wheels) w.rotation.x += spin;
    }
    if (wantEnter) {
      player.position.set(car.position.x + 2.2, 0, car.position.z + 1.5);
      player.group.position.copy(player.position);
      player.group.visible = true;
      player.car = null;
      player.vehicle = null;
      player.currentCar = null;
      player.speed = 0;
      player.velocity.x = 0;
      player.velocity.z = 0;
    }
    return;
  }

  // ---- jalan kaki ----
  const fwd = keyDown(input, 'KeyW', 'w', 'W', 'ArrowUp');
  const back = keyDown(input, 'KeyS', 's', 'S', 'ArrowDown');
  const left = keyDown(input, 'KeyA', 'a', 'A');
  const right = keyDown(input, 'KeyD', 'd', 'D');
  const run = keyDown(input, 'ShiftLeft', 'ShiftRight', 'Shift');
  let mx = (right ? 1 : 0) - (left ? 1 : 0);
  let mz = (fwd ? 1 : 0) - (back ? 1 : 0);
  player.moving = mx !== 0 || mz !== 0;
  player.running = player.moving && run;
  const targetSpeed = player.moving ? (run ? 7.6 : 4.2) : 0;
  player.speed += (targetSpeed - player.speed) * Math.min(1, step * 8);
  if (player.moving) {
    const len = Math.hypot(mx, mz) || 1;
    mx /= len;
    mz /= len;
    const fx = -Math.sin(player.heading);
    const fz = -Math.cos(player.heading);
    const rx = -fz;
    const rz = fx;
    const vx = (fx * mz + rx * mx) * player.speed;
    const vz = (fz * mz + rz * mx) * player.speed;
    player.position.x += vx * step;
    player.position.z += vz * step;
    player.velocity.x = vx;
    player.velocity.z = vz;
    if (player.weaponIndex === 0) {
      const moveHeading = Math.atan2(-vx, -vz);
      let diff = moveHeading - player.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      player.heading += diff * Math.min(1, step * 10);
      player.angle = player.heading;
    }
  } else {
    player.velocity.x = 0;
    player.velocity.z = 0;
  }
  player.group.position.copy(player.position);
  player.group.rotation.y = player.heading;
  player.health = player.health ?? 100;
  player.hp = player.health;
  player.speedKmh = Math.abs(player.speed) * 3.6;
  state.speedKmh = player.speedKmh;

  if (wantEnter || wantSteal) {
    const car = nearestCarHere(state, player.position, 5.5);
    if (car) {
      player.car = car;
      player.vehicle = car;
      player.currentCar = car;
      car.driver = player;
      player.group.visible = false;
      player.heading = car.heading || player.heading;
      player.angle = player.heading;
      player.speed = 0;
      if (wantSteal && typeof state.wanted === 'number') {
        state.wanted = Math.min(5, state.wanted + 1);
      }
    }
  }

  // ---- animasi figur ----
  if (pivots) {
    const aiming = player.weaponIndex > 0;
    if (pivots.gun) pivots.gun.visible = aiming;
    if (player.moving) {
      player.walkPhase += player.speed * step * 1.9;
      const ph = player.walkPhase;
      const amp = player.running ? 0.85 : 0.55;
      pivots.legL.hip.rotation.x = Math.sin(ph) * amp;
      pivots.legR.hip.rotation.x = -Math.sin(ph) * amp;
      pivots.legL.knee.rotation.x = Math.max(0, -Math.sin(ph - 0.6)) * amp * 1.1;
      pivots.legR.knee.rotation.x = Math.max(0, Math.sin(ph - 0.6)) * amp * 1.1;
      pivots.armL.shoulder.rotation.x = -Math.sin(ph) * amp * 0.7;
      pivots.armR.shoulder.rotation.x = Math.sin(ph) * amp * 0.7;
      pivots.armL.elbow.rotation.x = -0.25;
      pivots.armR.elbow.rotation.x = -0.25;
      pivots.torso.rotation.x = player.running ? 0.14 : 0.05;
      player.group.position.y = Math.abs(Math.sin(ph)) * 0.045;
    } else if (aiming) {
      pivots.armR.shoulder.rotation.x = -Math.PI / 2 + 0.12;
      pivots.armR.shoulder.rotation.z = -0.12;
      pivots.armR.elbow.rotation.x = -0.08;
      pivots.armL.shoulder.rotation.x = -Math.PI / 2 + 0.35;
      pivots.armL.shoulder.rotation.z = 0.5;
      pivots.armL.elbow.rotation.x = -0.9;
      pivots.legL.hip.rotation.x = -0.18;
      pivots.legR.hip.rotation.x = 0.22;
      pivots.legL.knee.rotation.x = 0.2;
      pivots.legR.knee.rotation.x = 0.12;
      pivots.torso.rotation.x = 0.06;
      player.group.position.y = 0;
    } else {
      const t = performance.now() * 0.001;
      pivots.legL.hip.rotation.x = 0;
      pivots.legR.hip.rotation.x = 0.05;
      pivots.legL.knee.rotation.x = 0;
      pivots.legR.knee.rotation.x = 0.06;
      pivots.armL.shoulder.rotation.x = Math.sin(t * 1.1) * 0.03;
      pivots.armR.shoulder.rotation.x = -Math.sin(t * 1.1) * 0.03;
      pivots.armL.elbow.rotation.x = -0.12;
      pivots.armR.elbow.rotation.x = -0.12;
      pivots.torso.rotation.x = 0;
      pivots.torso.rotation.z = 0.02;
      player.group.position.y = 0;
    }
    pivots.head.rotation.y = aiming ? 0 : Math.sin(performance.now() * 0.0004) * 0.08;
  }
}

// Memastikan pemain ada (dipakai staging/shot).
export function ensurePlayer(state) {
  const existing = state.player || state.pemain || null;
  if (existing && existing.group) return existing;
  const made = createPlayer(state);
  state.player = made;
  return made;
}

// Ditangkap polisi: denda, wanted hilang, respawn di kantor polisi.
export function bustPlayer(state) {
  const player = state.player || state.pemain || null;
  if (!player) return;
  const fine = Math.min(500, Math.round((state.cash || 0) * 0.1));
  state.cash = Math.max(0, (state.cash || 0) - fine);
  state.wanted = 0;
  player.health = 100;
  player.hp = 100;
  player.armor = 0;
  const net = state.roads || state.network || state.city || null;
  const st = net?.points?.policeStation || net?.policeStation || null;
  const x = st && typeof st.x === 'number' ? st.x : 84;
  const z = st && typeof st.z === 'number' ? st.z : 56;
  if (player.car) {
    player.car = null;
    player.vehicle = null;
    player.currentCar = null;
    player.group.visible = true;
  }
  player.position.set(x, 0, z);
  player.group.position.copy(player.position);
  player.speed = 0;
  player.velocity.x = 0;
  player.velocity.z = 0;
  if (state.hud && typeof state.hud.showBanner === 'function') {
    try { state.hud.showBanner(state, 'BUSTED — denda $' + fine); } catch (e) { /* abaikan */ }
  }
}

// Mati (wasted): potongan uang 10%, respawn di rumah sakit.
export function wastePlayer(state) {
  const player = state.player || state.pemain || null;
  if (!player) return;
  const cut = Math.round((state.cash || 0) * 0.1);
  state.cash = Math.max(0, (state.cash || 0) - cut);
  state.wanted = 0;
  player.health = 100;
  player.hp = 100;
  player.armor = 0;
  const net = state.roads || state.network || state.city || null;
  const hs = net?.points?.hospital || net?.hospital || null;
  const x = hs && typeof hs.x === 'number' ? hs.x : -28;
  const z = hs && typeof hs.z === 'number' ? hs.z : -48;
  if (player.car) {
    player.car = null;
    player.vehicle = null;
    player.currentCar = null;
    player.group.visible = true;
  }
  player.position.set(x, 0, z);
  player.group.position.copy(player.position);
  player.speed = 0;
  player.velocity.x = 0;
  player.velocity.z = 0;
  if (state.hud && typeof state.hud.showBanner === 'function') {
    try { state.hud.showBanner(state, 'WASTED — kehilangan $' + cut); } catch (e) { /* abaikan */ }
  }
}

// Menerima damage: armor menyerap dulu, lalu health; mati bila habis.
export function damagePlayer(state, amount) {
  const player = state.player || state.pemain || null;
  if (!player) return 0;
  let dmg = Math.max(0, amount || 0);
  if (player.armor > 0) {
    const absorbed = Math.min(player.armor, dmg);
    player.armor -= absorbed;
    dmg -= absorbed;
  }
  player.health = Math.max(0, (player.health ?? 100) - dmg);
  player.hp = player.health;
  state.shake = Math.min(0.6, (state.shake || 0) + 0.25);
  if (player.health <= 0) wastePlayer(state);
  return player.health;
}

// Memulihkan health / armor (pickup, rumah sakit).
export function healPlayer(state, amount) {
  const player = state.player || state.pemain || null;
  if (!player) return;
  player.health = Math.min(100, (player.health ?? 100) + (amount || 25));
  player.hp = player.health;
}

export function addArmor(state, amount) {
  const player = state.player || state.pemain || null;
  if (!player) return;
  player.armor = Math.min(100, (player.armor || 0) + (amount || 50));
}
