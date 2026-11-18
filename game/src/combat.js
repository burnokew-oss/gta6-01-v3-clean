// Combat: senjata pemain (tinju/pistol/shotgun), peluru + tracer,
// musuh geng, partikel (darah, asap, api), dan damage.
//
// Peluru bergerak di bidang XZ; renderer menggambarnya sebagai garis
// tracer yang memudar. Musuh geng mengejar dan menembak pemain.
import { WEAPONS } from './config.js';

export function makeEnemy(rng, x, z, hp) {
  return {
    x, z, angle: rng.range(0, Math.PI * 2), health: hp || 60,
    dead: false, shootTimer: rng.range(0.5, 1.5), speed: 4,
    color: 0x7a2e8a, kind: 'rival',
  };
}

export function spawnEnemies(G, x, z, count, hp) {
  for (let i = 0; i < count; i += 1) {
    G.enemies.push(makeEnemy(G.rng, x + G.rng.range(-7, 7), z + G.rng.range(-7, 7), hp));
  }
}

export function fireWeapon(G) {
  const p = G.player;
  const w = WEAPONS[p.weapon];
  if (!w || p.fireTimer > 0 || p.reloadTimer > 0) return;
  if (p.weapon === 'fist') {
    p.fireTimer = w.rate;
    if (G.audio) G.audio.punch();
    // Tinju: kena musuh/pejalan/polisi dalam jangkauan depan.
    const hx = p.x + Math.sin(p.aimAngle) * 2;
    const hz = p.z + Math.cos(p.aimAngle) * 2;
    let hit = false;
    for (const e of G.enemies) {
      if (!e.dead && Math.hypot(e.x - hx, e.z - hz) < 2) { hurtEnemy(G, e, w.damage); hit = true; }
    }
    for (const c of G.cops) {
      if (!c.dead && Math.hypot(c.x - hx, c.z - hz) < 2) {
        c.health -= w.damage;
        hit = true;
        if (c.health <= 0) { c.dead = true; G.events.push('copKilled'); }
      }
    }
    for (const ped of G.peds) {
      if (!ped.dead && Math.hypot(ped.x - hx, ped.z - hz) < 2) { ped.dead = true; G.events.push('pedKilled'); hit = true; }
    }
    if (hit) G.events.push('hitLanded');
    return;
  }
  if (p.ammoInMag[p.weapon] <= 0) {
    reloadWeapon(G);
    return;
  }
  p.fireTimer = w.rate;
  p.ammoInMag[p.weapon] -= 1;
  G.shotsFiredTimer = 1.5;
  G.muzzleFlash = 0.07; // renderer: cahaya + sprite kuning di ujung laras
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i += 1) {
    const spread = G.rng.range(-1, 1) * (w.spread || 0.05);
    G.bullets.push({
      x: p.x + Math.sin(p.aimAngle) * 1.2, z: p.z + Math.cos(p.aimAngle) * 1.2,
      angle: p.aimAngle + spread, speed: w.speed, damage: w.damage,
      life: w.range / w.speed, from: 'player',
    });
  }
  if (G.audio) G.audio.shoot();
}

export function reloadWeapon(G) {
  const p = G.player;
  const w = WEAPONS[p.weapon];
  if (!w || !w.reload || p.reloadTimer > 0) return;
  const reserve = p.ammo[p.weapon] || 0;
  if (reserve <= 0 || p.ammoInMag[p.weapon] >= w.ammo) return;
  p.reloadTimer = w.reload;
  p.reloadPending = p.weapon;
}

export function updateCombat(G, dt) {
  const p = G.player;
  if (p.reloadPending && p.reloadTimer <= 0) {
    const w = WEAPONS[p.reloadPending];
    const need = w.ammo - p.ammoInMag[p.reloadPending];
    const take = Math.min(need, p.ammo[p.reloadPending]);
    p.ammoInMag[p.reloadPending] += take;
    p.ammo[p.reloadPending] -= take;
    p.reloadPending = null;
  }
  if (G.shotsFiredTimer > 0) G.shotsFiredTimer -= dt;
  if (G.muzzleFlash > 0) G.muzzleFlash -= dt;

  // Peluru.
  for (let i = G.bullets.length - 1; i >= 0; i -= 1) {
    const b = G.bullets[i];
    b.px = b.x;
    b.pz = b.z;
    b.x += Math.sin(b.angle) * b.speed * dt;
    b.z += Math.cos(b.angle) * b.speed * dt;
    b.life -= dt;
    let dead = b.life <= 0;
    if (!dead) {
      if (b.from === 'player') {
        for (const e of G.enemies) {
          if (!e.dead && Math.hypot(e.x - b.x, e.z - b.z) < 1.2) { hurtEnemy(G, e, b.damage); dead = true; break; }
        }
        if (!dead) {
          for (const c of G.cops) {
            if (!c.dead && Math.hypot(c.x - b.x, c.z - b.z) < 1.2) {
              c.health -= b.damage;
              dead = true;
              if (c.health <= 0) { c.dead = true; G.events.push('copKilled'); }
              break;
            }
          }
        }
        if (!dead) {
          for (const ped of G.peds) {
            if (!ped.dead && Math.hypot(ped.x - b.x, ped.z - b.z) < 1) {
              ped.dead = true;
              dead = true;
              G.events.push('pedKilled');
              break;
            }
          }
        }
      } else if (Math.hypot(G.player.x - b.x, G.player.z - b.z) < 1) {
        damagePlayer(G, b.damage);
        dead = true;
      }
    }
    if (dead) {
      G.particles.push({ x: b.x, z: b.z, vx: 0, vz: 0, life: 0.15, max: 0.15, size: 0.4, color: 0xffdd55, kind: 'spark' });
      G.bullets.splice(i, 1);
    }
  }

  // Musuh geng: kejar pemain dan menembak.
  for (const e of G.enemies) {
    if (e.dead) continue;
    const dx = G.player.x - e.x;
    const dz = G.player.z - e.z;
    const d = Math.hypot(dx, dz);
    e.angle = Math.atan2(dx, dz);
    if (d > 12) {
      e.x += Math.sin(e.angle) * e.speed * dt;
      e.z += Math.cos(e.angle) * e.speed * dt;
    } else if (d > 5) {
      e.x += Math.sin(e.angle) * e.speed * 0.4 * dt;
      e.z += Math.cos(e.angle) * e.speed * 0.4 * dt;
    }
    if (d < 35) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = 1.3 + G.rng.range(0, 0.9);
        G.bullets.push({
          x: e.x, z: e.z, angle: e.angle + G.rng.range(-0.1, 0.1),
          speed: 65, damage: 8, life: 1.2, from: 'enemy',
        });
        if (G.audio) G.audio.shoot();
      }
    }
  }
  for (let i = G.enemies.length - 1; i >= 0; i -= 1) {
    if (G.enemies[i].dead) G.enemies.splice(i, 1);
  }

  // Partikel.
  for (let i = G.particles.length - 1; i >= 0; i -= 1) {
    const pt = G.particles[i];
    pt.life -= dt;
    pt.x += pt.vx * dt;
    pt.z += pt.vz * dt;
    pt.vx *= 0.98;
    pt.vz *= 0.98;
    if (pt.life <= 0) G.particles.splice(i, 1);
  }
}

function hurtEnemy(G, e, dmg) {
  e.health -= dmg;
  for (let i = 0; i < 6; i += 1) {
    G.particles.push({
      x: e.x, z: e.z, vx: G.rng.range(-4, 4), vz: G.rng.range(-4, 4),
      life: 0.4, max: 0.4, size: 0.4, color: 0xc22e2e, kind: 'blood',
    });
  }
  if (e.health <= 0) {
    e.dead = true;
    G.events.push('enemyKilled');
    G.cashFloaters.push({ x: e.x, z: e.z, text: '+$25', life: 1 });
    G.player.cash += 25;
  }
}

export function damagePlayer(G, amount) {
  if (G.player.invuln > 0) return;
  let left = amount;
  if (G.player.armor > 0) {
    const absorbed = Math.min(G.player.armor, left);
    G.player.armor -= absorbed;
    left -= absorbed;
  }
  G.player.health -= left;
  G.player.invuln = 0.5;
  G.flashRed = Math.max(G.flashRed, 0.35);
  G.shake = Math.max(G.shake, 5);
  if (G.player.health <= 0) {
    G.player.health = 0;
    G.events.push('wasted');
  }
}
