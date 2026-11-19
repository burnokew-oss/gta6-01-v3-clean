// combat.js — Baku tembak Teluk Cerah: musuh geng berfigur manusia
// (bukan kapsul), senjata terbaca di tangan, kilatan moncong, partikel,
// health bar di atas musuh, dan guncangan layar saat menembak.
// Revisi 2: shotgun menembak 5 peluru menyebar, musuh bergerak menyamping
// sambil menembak, musuh yang tumbang jatuh rebah dulu sebelum hilang.
// Semua bentuk dibuat prosedural; tidak ada aset luar.

let combatCache = null;

function glowTexture(color) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Figur musuh geng: tubuh berproporsi wajar, wajah, baju pink,
// bandana merah, senjata di tangan, penanda merah melayang di atas kepala.
function buildGangFigure() {
  const fig = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc98f5f, roughness: 0.65 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe86a9a, roughness: 0.85 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.9 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.9 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.16, 0.56, 12), shirt);
  torso.position.y = 1.19;
  torso.castShadow = true;
  fig.add(torso);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), shirt);
  shoulders.scale.set(1.35, 0.55, 0.85);
  shoulders.position.y = 1.44;
  fig.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skin);
  neck.position.y = 1.53;
  fig.add(neck);
  const head = new THREE.Group();
  head.position.y = 1.68;
  fig.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 14), skin);
  skull.scale.set(0.92, 1.05, 0.96);
  skull.castShadow = true;
  head.add(skull);
  const hairCap = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 10), hair);
  hairCap.scale.set(0.95, 0.8, 0.98);
  hairCap.position.set(0, 0.05, 0.025);
  head.add(hairCap);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.03, 8, 18), new THREE.MeshStandardMaterial({ color: 0xd21f2e, roughness: 0.8 }));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.06;
  head.add(band);
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x1a1210, roughness: 0.4 });
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 6), eyeMat);
    eye.position.set(s * 0.06, 0.02, -0.148);
    head.add(eye);
  }
  const grin = new THREE.Mesh(
    new THREE.TorusGeometry(0.04, 0.008, 6, 12, Math.PI * 0.8),
    new THREE.MeshStandardMaterial({ color: 0x5a2a20, roughness: 0.7 })
  );
  grin.position.set(0, -0.075, -0.145);
  grin.rotation.z = Math.PI + Math.PI * 0.1;
  grin.rotation.x = 0.15;
  head.add(grin);
  const pivots = { head, torso };
  function buildArm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.26, 1.44, 0);
    fig.add(shoulder);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8), shirt);
    upper.position.y = -0.15;
    shoulder.add(upper);
    const elbow = new THREE.Group();
    elbow.position.y = -0.3;
    shoulder.add(elbow);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.042, 0.28, 8), skin);
    fore.position.y = -0.14;
    elbow.add(fore);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.058, 8, 6), skin);
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
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.42, 8), pants);
    thigh.position.y = -0.21;
    hip.add(thigh);
    const knee = new THREE.Group();
    knee.position.y = -0.42;
    hip.add(knee);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.4, 8), pants);
    shin.position.y = -0.2;
    knee.add(shin);
    const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: 0.5 }));
    shoe.scale.set(1, 0.55, 1.7);
    shoe.position.set(0, -0.42, -0.04);
    knee.add(shoe);
    return { hip, knee, shoe };
  }
  pivots.legL = buildLeg(-1);
  pivots.legR = buildLeg(1);
  const gun = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.35, metalness: 0.8 });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.28, 8), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0, -0.11);
  gun.add(barrel);
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.038, 0.15, 8), metal);
  grip.rotation.x = 0.35;
  grip.position.set(0, -0.07, 0.03);
  gun.add(grip);
  gun.position.set(0, -0.33, -0.05);
  pivots.armR.hand.add(gun);
  pivots.gun = gun;
  const marker = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.22),
    new THREE.MeshStandardMaterial({ color: 0xd21f2e, emissive: 0xff2233, emissiveIntensity: 1.4, roughness: 0.4 })
  );
  marker.position.y = 2.25;
  fig.add(marker);
  pivots.marker = marker;
  const barBg = new THREE.Mesh(
    new THREE.PlaneGeometry(0.9, 0.1),
    new THREE.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.85, depthWrite: false })
  );
  barBg.position.y = 2.02;
  fig.add(barBg);
  const barFg = new THREE.Mesh(
    new THREE.PlaneGeometry(0.86, 0.07),
    new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.95, depthWrite: false })
  );
  barFg.position.set(0, 2.02, 0.005);
  fig.add(barFg);
  pivots.barFg = barFg;
  pivots.barBg = barBg;
  fig.userData.pivots = pivots;
  return { group: fig, pivots };
}

function playerObj(state) {
  return state.player || state.pemain || null;
}

function sceneOf(state) {
  const world = state.world || state.scene || null;
  return world?.scene || world || null;
}

export function createCombat(state) {
  const scene = sceneOf(state);
  const combat = {
    enemies: [],
    list: [],
    firing: false,
    muzzle: 0,
    cooldown: 0,
    reloadTimer: 0,
    kills: 0,
    total: 6,
    flash: null,
    particles: [],
    // Daftar senjata untuk toko (shops.js): slot, nama, isi, cadangan.
    weapons: [
      { slot: 1, name: 'Pistol', ammo: 12, reserve: 12 },
      { slot: 2, name: 'Shotgun', ammo: 0, reserve: 0 },
    ],
  };
  const flashTex = glowTexture('rgba(255,220,120,1)');
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({
    map: flashTex, transparent: true, opacity: 0, depthWrite: false,
  }));
  flash.scale.set(1.6, 1.6, 1);
  if (scene && scene.add) scene.add(flash);
  combat.flash = flash;
  const flashLight = new THREE.PointLight(0xffc46a, 0, 14, 1.6);
  if (scene && scene.add) scene.add(flashLight);
  combat.flashLight = flashLight;
  combatCache = combat;
  state.combat = combat;
  return combat;
}

function spawnEnemy(state, x, z, isBoss) {
  const scene = sceneOf(state);
  const built = buildGangFigure();
  built.group.position.set(x, 0, z);
  built.group.scale.setScalar(isBoss ? 1.14 : 1);
  if (scene && scene.add) scene.add(built.group);
  const enemy = {
    group: built.group,
    mesh: built.group,
    position: built.group.position,
    health: isBoss ? 220 : 100,
    maxHealth: isBoss ? 220 : 100,
    boss: !!isBoss,
    alive: true,
    dying: 0,
    heading: 0,
    speed: 2.4 + Math.random(),
    shootTimer: 1 + Math.random() * 2,
    strafeDir: Math.random() < 0.5 ? -1 : 1,
    strafeTimer: 1.5 + Math.random() * 2,
    walkPhase: Math.random() * 6.28,
    pivots: built.pivots,
  };
  return enemy;
}

function ensureEnemiesInternal(state) {
  const combat = state.combat || combatCache;
  if (!combat) return;
  if (combat.enemies.length > 0) return;
  const p = playerObj(state);
  const px = p?.position?.x || 0;
  const pz = p?.position?.z || 0;
  const spots = [
    [px - 6, pz - 14, true],
    [px + 7, pz - 11, false],
    [px - 11, pz - 8, false],
    [px + 11, pz - 16, false],
    [px + 2, pz - 19, false],
  ];
  for (const [x, z, boss] of spots) {
    combat.enemies.push(spawnEnemy(state, x, z, boss));
  }
  combat.list = combat.enemies;
  combat.total = combat.enemies.length;
}

function burstParticles(state, pos, colorHex, n) {
  const combat = state.combat || combatCache;
  const scene = sceneOf(state);
  if (!combat || !scene) return;
  const tex = glowTexture(colorHex);
  for (let i = 0; i < n; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0.95, depthWrite: false,
    }));
    const s = 0.2 + Math.random() * 0.35;
    sp.scale.set(s, s, 1);
    sp.position.set(pos.x + (Math.random() - 0.5) * 0.4, pos.y + Math.random() * 0.5, pos.z + (Math.random() - 0.5) * 0.4);
    sp.userData.vx = (Math.random() - 0.5) * 3;
    sp.userData.vy = 1 + Math.random() * 2.5;
    sp.userData.vz = (Math.random() - 0.5) * 3;
    sp.userData.life = 0.5 + Math.random() * 0.3;
    scene.add(sp);
    combat.particles.push(sp);
  }
}

function hitEnemyInCone(state, fx, fz, spread, damage) {
  const combat = state.combat || combatCache;
  const player = playerObj(state);
  if (!combat || !player) return null;
  const pp = player.position;
  let hit = null;
  let bestScore = 1e9;
  for (const e of combat.enemies) {
    if (!e.alive) continue;
    const dx = e.position.x - pp.x;
    const dz = e.position.z - pp.z;
    const d = Math.hypot(dx, dz);
    if (d > 26) continue;
    const dot = (dx * fx + dz * fz) / (d || 1);
    if (dot < 0.92 - spread) continue;
    const score = d + (1 - dot) * 8;
    if (score < bestScore) {
      bestScore = score;
      hit = e;
    }
  }
  if (hit) {
    hit.health -= damage;
    burstParticles(state, { x: hit.position.x, y: 1.4, z: hit.position.z }, 'rgba(255,70,70,1)', 8);
    if (hit.health <= 0) killEnemy(state, hit);
  }
  return hit;
}

function killEnemy(state, enemy) {
  const combat = state.combat || combatCache;
  if (!enemy.alive) return;
  enemy.alive = false;
  enemy.dying = 0.9;
  if (combat) combat.kills += 1;
  state.takedowns = (state.takedowns || 0) + 1;
  burstParticles(state, { x: enemy.position.x, y: 1.2, z: enemy.position.z }, 'rgba(255,80,80,1)', 14);
}

// Amunisi pemain SELALU bentuk objek { pistol, shotgun } (sesuai HUD
// dan staging). Bila masih array (save lama), normalisasi ke objek.
function ammoKey(slot) {
  return slot === 2 ? 'shotgun' : 'pistol';
}
function normalizeAmmo(player) {
  if (!player) return;
  if (Array.isArray(player.ammo)) {
    player.ammo = { pistol: player.ammo[1] ?? 12, shotgun: player.ammo[2] ?? 0 };
  }
  if (!player.ammo || typeof player.ammo !== 'object') {
    player.ammo = { pistol: 12, shotgun: 0 };
  }
  if (Array.isArray(player.reserveAmmo)) {
    player.reserveAmmo = { pistol: player.reserveAmmo[1] ?? 12, shotgun: player.reserveAmmo[2] ?? 0 };
  }
  if (!player.reserveAmmo || typeof player.reserveAmmo !== 'object') {
    player.reserveAmmo = { pistol: 12, shotgun: 0 };
  }
}
function syncWeapons(state) {
  const combat = state.combat || combatCache;
  const player = playerObj(state);
  if (!combat || !player || !Array.isArray(combat.weapons)) return;
  normalizeAmmo(player);
  for (const w of combat.weapons) {
    const key = ammoKey(w.slot);
    w.ammo = player.ammo[key] ?? 0;
    w.reserve = player.reserveAmmo[key] ?? 0;
  }
}

export function fireWeapon(state) {
  const combat = state.combat || combatCache;
  const player = playerObj(state);
  if (!combat || !player || combat.cooldown > 0) return false;
  normalizeAmmo(player);
  const slot = player.weaponIndex || 0;
  if (slot === 0) {
    combat.cooldown = 0.45;
    combat.firing = true;
    combat.muzzle = 0.12;
    const pp = player.position;
    ensureEnemiesInternal(state);
    for (const e of combat.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.position.x - pp.x, e.position.z - pp.z);
      if (d < 2.4) {
        e.health -= 34;
        burstParticles(state, { x: e.position.x, y: 1.3, z: e.position.z }, 'rgba(255,80,80,1)', 6);
        if (e.health <= 0) killEnemy(state, e);
      }
    }
    return true;
  }
  if (!player.ammo || (player.ammo[ammoKey(slot)] || 0) <= 0) {
    combat.cooldown = 0.3;
    return false;
  }
  player.ammo[ammoKey(slot)] -= 1;
  syncWeapons(state);
  combat.cooldown = slot === 2 ? 0.9 : 0.28;
  combat.firing = true;
  combat.muzzle = 0.14;
  state.shake = Math.min(0.5, (state.shake || 0) + (slot === 2 ? 0.35 : 0.16));
  const pp = player.position;
  const fx = -Math.sin(player.heading);
  const fz = -Math.cos(player.heading);
  const tip = { x: pp.x + fx * 1.1, y: 1.35, z: pp.z + fz * 1.1 };
  if (combat.flash) {
    combat.flash.position.set(tip.x, tip.y, tip.z);
    combat.flash.material.opacity = 1;
    combat.flash.scale.set(slot === 2 ? 2.6 : 1.8, slot === 2 ? 2.6 : 1.8, 1);
  }
  if (combat.flashLight) {
    combat.flashLight.position.set(tip.x, tip.y, tip.z);
    combat.flashLight.intensity = slot === 2 ? 90 : 60;
  }
  burstParticles(state, tip, 'rgba(255,200,90,1)', slot === 2 ? 8 : 4);
  ensureEnemiesInternal(state);
  if (slot === 2) {
    // shotgun: 5 peluru menyebar
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 0.24;
      const c = Math.cos(spread);
      const s = Math.sin(spread);
      const sfx = fx * c - fz * s;
      const sfz = fx * s + fz * c;
      hitEnemyInCone(state, sfx, sfz, 0.06, 16);
    }
  } else {
    hitEnemyInCone(state, fx, fz, 0, 34);
  }
  return true;
}

export function switchWeapon(state, slot) {
  const player = playerObj(state);
  if (!player) return;
  const s = Math.max(0, Math.min(2, Math.round(slot)));
  player.weaponIndex = s;
  player.weapon = s;
}

export function updateCombat(state, dt) {
  const combat = state.combat || combatCache;
  const player = playerObj(state);
  if (!combat || !player) return;
  const step = Math.min(dt, 0.05);
  const input = state.input || null;
  combat.cooldown = Math.max(0, (combat.cooldown || 0) - step);
  combat.muzzle = Math.max(0, (combat.muzzle || 0) - step);
  if (combat.flash) combat.flash.material.opacity = combat.muzzle > 0 ? 1 : 0;
  if (combat.flashLight) combat.flashLight.intensity = combat.muzzle > 0 ? 50 : 0;
  combat.firing = false;

  if (input && typeof input.takePressed === 'function') {
    try {
      if (input.takePressed('Digit1')) switchWeapon(state, 0);
      else if (input.takePressed('Digit2')) switchWeapon(state, 1);
      else if (input.takePressed('Digit3')) switchWeapon(state, 2);
    } catch (e) { /* abaikan */ }
  }
  if (input && typeof input.takePressed === 'function') {
    try {
      if (input.takePressed('KeyR')) {
        const slot = player.weaponIndex || 0;
        if (slot > 0 && player.ammo && player.reserveAmmo) {
          normalizeAmmo(player);
          const key = ammoKey(slot);
          const mag = slot === 1 ? 12 : 6;
          const need = mag - (player.ammo[key] || 0);
          const take = Math.min(need, player.reserveAmmo[key] || 0);
          player.ammo[key] = (player.ammo[key] || 0) + take;
          player.reserveAmmo[key] = (player.reserveAmmo[key] || 0) - take;
          syncWeapons(state);
        }
      }
    } catch (e) { /* abaikan */ }
  }
  const mouseDown = input?.mouse?.down || input?.mouse?.pressed || input?.mouse?.button === 0;
  if (mouseDown && !player.car) {
    fireWeapon(state);
  }

  for (let i = combat.particles.length - 1; i >= 0; i--) {
    const sp = combat.particles[i];
    sp.userData.life -= step;
    if (sp.userData.life <= 0) {
      sp.parent?.remove(sp);
      combat.particles.splice(i, 1);
      continue;
    }
    sp.position.x += sp.userData.vx * step;
    sp.position.y += sp.userData.vy * step;
    sp.position.z += sp.userData.vz * step;
    sp.userData.vy -= 6 * step;
    sp.material.opacity = Math.min(1, sp.userData.life * 2.4);
  }

  const inFight = (state.missionIndex || state.mission || 0) >= 9 || (state.wanted || 0) >= 2 || state.shot === 'shootout';
  if (inFight) ensureEnemiesInternal(state);
  for (const e of combat.enemies) {
    // musuh tumbang: rebah ke samping lalu hilang
    if (!e.alive) {
      if (e.dying > 0) {
        e.dying -= step;
        e.group.rotation.z = Math.min(Math.PI / 2, e.group.rotation.z + step * 2.4);
        e.group.position.y = Math.max(-0.4, e.group.position.y - step * 0.5);
        if (e.dying <= 0) e.group.visible = false;
      }
      continue;
    }
    const pp = player.position;
    const dx = pp.x - e.position.x;
    const dz = pp.z - e.position.z;
    const dist = Math.hypot(dx, dz) || 1;
    const targetHeading = Math.atan2(-dx / dist, -dz / dist);
    let diff = targetHeading - e.heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    e.heading += diff * Math.min(1, step * 3);
    e.group.rotation.y = e.heading;
    let moving = false;
    if (dist > 9) {
      e.position.x += -Math.sin(e.heading) * e.speed * step;
      e.position.z += -Math.cos(e.heading) * e.speed * step;
      moving = true;
    } else {
      // strafe menyamping sambil membidik
      e.strafeTimer -= step;
      if (e.strafeTimer <= 0) {
        e.strafeDir *= -1;
        e.strafeTimer = 1.2 + Math.random() * 1.6;
      }
      const sx = Math.cos(e.heading) * e.strafeDir;
      const sz = -Math.sin(e.heading) * e.strafeDir;
      e.position.x += sx * 1.6 * step;
      e.position.z += sz * 1.6 * step;
      moving = true;
    }
    e.shootTimer -= step;
    if (e.shootTimer <= 0 && dist < 20 && !player.car) {
      e.shootTimer = 2.2 + Math.random() * 2;
      const tip = { x: e.position.x - Math.sin(e.heading) * 0.8, y: 1.35, z: e.position.z - Math.cos(e.heading) * 0.8 };
      burstParticles(state, tip, 'rgba(255,200,90,1)', 3);
      if (Math.random() < 0.4) {
        player.health = Math.max(0, (player.health || 100) - 6);
        player.hp = player.health;
        state.shake = Math.min(0.5, (state.shake || 0) + 0.2);
      }
    }
    const pv = e.pivots;
    if (pv) {
      if (moving) {
        e.walkPhase += e.speed * step * 2;
        const ph = e.walkPhase;
        pv.legL.hip.rotation.x = Math.sin(ph) * 0.55;
        pv.legR.hip.rotation.x = -Math.sin(ph) * 0.55;
        pv.legL.knee.rotation.x = Math.max(0, -Math.sin(ph - 0.6)) * 0.6;
        pv.legR.knee.rotation.x = Math.max(0, Math.sin(ph - 0.6)) * 0.6;
        pv.armL.shoulder.rotation.x = -Math.sin(ph) * 0.4;
        pv.armR.shoulder.rotation.x = -Math.PI / 2 + 0.15;
        pv.armR.elbow.rotation.x = -0.1;
      } else {
        pv.armR.shoulder.rotation.x = -Math.PI / 2 + 0.12;
        pv.armR.shoulder.rotation.z = -0.12;
        pv.armR.elbow.rotation.x = -0.08;
        pv.armL.shoulder.rotation.x = -Math.PI / 2 + 0.35;
        pv.armL.shoulder.rotation.z = 0.5;
        pv.armL.elbow.rotation.x = -0.9;
        pv.legL.hip.rotation.x = -0.15;
        pv.legR.hip.rotation.x = 0.2;
      }
      pv.marker.position.y = 2.25 + Math.sin(performance.now() * 0.003 + e.walkPhase) * 0.08;
      pv.marker.rotation.y += step * 2;
      const ratio = Math.max(0, e.health / e.maxHealth);
      pv.barFg.scale.x = ratio;
      pv.barFg.position.x = -(1 - ratio) * 0.43;
    }
    if (e.health <= 0 && e.alive) killEnemy(state, e);
  }
}

// Memastikan musuh baku tembak ada (dipakai staging/shot).
export function ensureEnemies(state) {
  const combat = state.combat || combatCache;
  if (combat && combat.enemies && combat.enemies.length) return combat.enemies;
  ensureEnemiesInternal(state);
  return (state.combat || combatCache)?.enemies || [];
}
