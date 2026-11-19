import 'three';
const THREE = window.THREE;
import { showDialog } from './hud.js';

function starFlashGeometry() {
  const tips = 4;
  const outer = 0.95;
  const inner = 0.26;
  const positions = [];
  const center = [0, 0, 0];
  const ring = [];
  for (let i = 0; i < tips * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (tips * 2)) * Math.PI * 2 + Math.PI / 4;
    ring.push([Math.cos(a) * r, Math.sin(a) * r, 0]);
  }
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    positions.push(center[0], center[1], center[2], a[0], a[1], a[2], b[0], b[1], b[2]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}
import { buildPersonFigure } from './pedestrians.js';

const ENEMY_SPOTS = [
  { x: 20, z: 300 }, { x: 10, z: 296 }, { x: 0, z: 303 },
  { x: -10, z: 297 }, { x: -20, z: 301 },
];

function makeMarker() {
  const geo = new THREE.ConeGeometry(0.28, 0.7, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xff2233 });
  const m = new THREE.Mesh(geo, mat);
  m.rotation.x = Math.PI;
  return m;
}

function makeHealthBar() {
  const g = new THREE.Group();
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.14), new THREE.MeshBasicMaterial({ color: 0x222222 }));
  const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.1), new THREE.MeshBasicMaterial({ color: 0xff4040 }));
  fg.position.z = 0.01;
  g.add(bg);
  g.add(fg);
  g.userData.fg = fg;
  return g;
}

export function createCombat(state) {
  const scene = state.world.scene;
  const enemies = [];
  for (let i = 0; i < 5; i++) {
    const spot = ENEMY_SPOTS[i];
    const built = buildPersonFigure({
      shirt: 0xd84a7a, pants: 0x2a2a2a, skin: 0xc98a5e, hair: 0x141414, hat: 'bandana', hatColor: 0xd83a3a, gun: true, scale: 1.02,
    });
    built.group.position.set(spot.x, 0, spot.z);
    built.group.rotation.y = Math.PI;
    const marker = makeMarker();
    marker.position.y = 2.35;
    built.group.add(marker);
    const bar = makeHealthBar();
    bar.position.y = 2.1;
    built.group.add(bar);
    scene.add(built.group);
    enemies.push({
      group: built.group,
      parts: built.parts,
      position: built.group.position,
      heading: Math.PI,
      health: 100,
      maxHealth: 100,
      weapon: 'pistol',
      alive: true,
      marker,
      bar,
      fireTimer: 1 + i * 0.7,
      walkPhase: i,
    });
  }
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffe9a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const   flash = new THREE.Mesh(    starFlashGeometry(), flashMat);
  flash.visible = false;
  scene.add(flash);
  const flashLight = new THREE.PointLight(0xffc37a, 0, 18);
  scene.add(flashLight);
  const combat = {
    enemies,
    flash,
    flashMat,
    flashLight,
    flashTimer: 0,
    particles: [],
    shake: 0,
    triggerFire: false,
    triggerPunch: false,
    reloadRequest: false,
    firing: false,
    defeated: 1,
    demoFire: false,
    elapsed: 0,
  };
  state.combat = combat;
  return combat;
}

function spawnBurst(state, origin, dir, colorHex, count) {
  const combat = state.combat;
  const scene = state.world.scene;
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: colorHex, transparent: true })
    );
    m.position.copy(origin);
    scene.add(m);
    combat.particles.push({
      mesh: m,
      vx: dir.x * (4 + Math.random() * 5) + (Math.random() - 0.5) * 3,
      vy: 1 + Math.random() * 3,
      vz: dir.z * (4 + Math.random() * 5) + (Math.random() - 0.5) * 3,
      life: 0.5 + Math.random() * 0.4,
    });
  }
}

function aimDirOf(state) {
  const player = state.player;
  if (!player) return new THREE.Vector3(0, 0, -1);
  return new THREE.Vector3(Math.sin(player.heading || 0), 0, Math.cos(player.heading || 0));
}

function firePlayerWeapon(state) {
  const combat = state.combat;
  const player = state.player;
  if (!player) return;
  const slot = player.weaponIndex || 0;
  if (slot === 1) {
    if ((player.ammo.pistol || 0) <= 0) return;
    player.ammo.pistol -= 1;
  } else if (slot === 2) {
    if ((player.ammo.shotgun || 0) <= 0) return;
    player.ammo.shotgun -= 1;
  }
  const dir = aimDirOf(state);
  const origin = player.group.position.clone();
  origin.y = 1.35;
  origin.x += dir.x * 0.8;
  origin.z += dir.z * 0.8;
  combat.flash.position.copy(origin);
  combat.flash.position.x += dir.x * 0.5;
  combat.flash.position.z += dir.z * 0.5;
  combat.flash.visible = true;
  combat.flashTimer = 0.14;
  combat.flashLight.position.copy(origin);
  combat.flashLight.intensity = 60;
  spawnBurst(state, origin, dir, 0xffe9a0, 7);
  combat.shake = Math.max(combat.shake, 0.35);
  combat.firing = true;
  let best = null;
  let bestD = 30;
  for (const e of combat.enemies) {
    if (!e.alive) continue;
    const dx = e.group.position.x - origin.x;
    const dz = e.group.position.z - origin.z;
    const d = Math.hypot(dx, dz);
    const dot = (dx * dir.x + dz * dir.z) / (d || 1);
    if (d < bestD && dot > 0.75) {
      bestD = d;
      best = e;
    }
  }
  if (best) {
    best.health -= slot === 2 ? 45 : 25;
    const hitAt = best.group.position.clone();
    hitAt.y = 1.3;
    spawnBurst(state, hitAt, dir, 0xd83a3a, 8);
    if (best.health <= 0) {
      best.alive = false;
      best.group.rotation.x = -Math.PI / 2;
      best.group.position.y = 0.4;
      best.marker.visible = false;
      combat.defeated = Math.min(6, combat.defeated + 1);
    }
  }
}

export function fireWeapon(state) {
  if (!state.combat) return;
  state.combat.triggerFire = true;
}

export function switchWeapon(state, slot) {
  if (!state.player) return;
  state.player.weaponIndex = slot;
  state.player.weapon = slot;
}

export function updateCombat(state, dt) {
  const combat = state.combat;
  if (!combat) return;
  combat.elapsed += dt;
  const player = state.player;
  const shot = state.shotName || '';

  if (combat.triggerFire) {
    combat.triggerFire = false;
    firePlayerWeapon(state);
  }
  if (combat.triggerPunch) {
    combat.triggerPunch = false;
    combat.shake = Math.max(combat.shake, 0.2);
    if (player) {
      const dir = aimDirOf(state);
      const origin = player.group.position.clone();
      origin.y = 1.2;
      spawnBurst(state, origin, dir, 0xffffff, 4);
    }
  }
  if (combat.reloadRequest) {
    combat.reloadRequest = false;
    if (player) {
      player.ammo.pistol = 12;
      player.ammo.shotgun = 6;
    }
  }
  if (combat.demoFire || shot === 'shootout') {
    if (state.shotName === 'shootout' && !state._dimasDialogShown) {
      showDialog(state, 'Dimas', 'Bosnya di ujung jalan. Habisi dia, Raka!');
      state._dimasDialogShown = true;
    }
    if (combat.flashTimer <= 0.35 && player && player.group) {
      const dir = aimDirOf(state);
      const origin = player.group.position.clone();
      origin.y = 1.35;
      origin.x += dir.x * 0.9;
      origin.z += dir.z * 0.9;
      combat.flash.position.copy(origin);
      combat.flash.visible = true;
      combat.flashLight.position.copy(origin);
      combat.flashLight.intensity = 40;
      combat.flashTimer = 0.22;
    }
  }
  if (combat.flashTimer > 0) {
    combat.flashTimer -= dt;
    combat.flashMat.opacity = 0.6 + Math.random() * 0.4;
    combat.flash.rotation.z += dt * 9;
    if (state.world && state.world.camera) {
      combat.flash.lookAt(state.world.camera.position);
    }
    if (combat.flashTimer <= 0) {
      combat.flash.visible = false;
      combat.flashLight.intensity = 0;
      combat.firing = false;
    }
  }
  for (let i = combat.particles.length - 1; i >= 0; i--) {
    const p = combat.particles[i];
    p.life -= dt;
    p.vy -= 9 * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    p.mesh.material.opacity = Math.max(0, p.life * 2);
    if (p.life <= 0 || p.mesh.position.y < 0) {
      state.world.scene.remove(p.mesh);
      combat.particles.splice(i, 1);
    }
  }
  for (const e of combat.enemies) {
    if (!e.alive) continue;
    if (e.bar) {
      e.bar.userData.fg.scale.x = Math.max(0.02, e.health / e.maxHealth);
      e.bar.userData.fg.position.x = -(1 - e.health / e.maxHealth) * 0.53;
    }
    if (e.marker) {
      e.marker.position.y = 2.35 + Math.sin(combat.elapsed * 3 + e.walkPhase) * 0.08;
    }
    if (player && player.group && shot === 'shootout') {
      e.heading = Math.atan2(
        player.group.position.x - e.group.position.x,
        player.group.position.z - e.group.position.z
      );
      e.group.rotation.y = e.heading;
      e.parts.armR.rotation.x = -1.15;
      e.walkPhase += dt * 2;
      e.parts.legL.rotation.x = Math.sin(e.walkPhase) * 0.25;
      e.parts.legR.rotation.x = -Math.sin(e.walkPhase) * 0.25;
    } else if (player && player.group) {
      const dx = player.group.position.x - e.group.position.x;
      const dz = player.group.position.z - e.group.position.z;
      const d = Math.hypot(dx, dz);
      if (d < 26) {
        e.heading = Math.atan2(dx, dz);
        e.group.rotation.y = e.heading;
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && d < 20) {
          e.fireTimer = 1.4 + Math.random();
          const from = e.group.position.clone();
          from.y = 1.35;
          spawnBurst(state, from, new THREE.Vector3(dx / (d || 1), 0, dz / (d || 1)), 0xffe9a0, 5);
          if (Math.random() < 0.5) {
            player.health = Math.max(0, (player.health || 100) - 4);
          }
        }
      }
    }
    if (e.bar && state.world && state.world.camera) e.bar.lookAt(state.world.camera.position);
  }
  if (combat.shake > 0) {
    combat.shake = Math.max(0, combat.shake - dt * 1.4);
    if (state.world && state.world.camera) {
      state.world.camera.position.x += (Math.random() - 0.5) * combat.shake * 0.5;
      state.world.camera.position.y += (Math.random() - 0.5) * combat.shake * 0.4;
    }
  }
}
