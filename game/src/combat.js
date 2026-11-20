// Teluk Cerah — combat: fists, a pistol and a shotgun with real ammo
// counts, muzzle flash, hit feedback, and enemies who advance, take
// cover behind their stance, shoot back and show health bars.

import { buildPerson } from "./pedestrians.js";

export const WEAPONS = [
  { id: "fist", name: "TINJU", damage: 22, cooldown: 0.38, range: 2.1, spread: 0, auto: false },
  { id: "pistol", name: "PISTOL", damage: 34, cooldown: 0.24, range: 46, spread: 0.012, auto: false, mag: 12 },
  { id: "shotgun", name: "SHOTGUN", damage: 15, pellets: 6, cooldown: 0.85, range: 26, spread: 0.06, auto: false, mag: 6 },
];

export function createCombat(scene, rng, audio, hooks) {
  const flashTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(32, 32, 2, 32, 32, 31);
    rg.addColorStop(0, "rgba(255,250,220,1)");
    rg.addColorStop(0.35, "rgba(255,190,80,0.85)");
    rg.addColorStop(1, "rgba(255,120,40,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  const CB = {
    enemies: [],
    weaponIdx: 1,
    ammo: { pistol: { mag: 12, reserve: 60 }, shotgun: { mag: 6, reserve: 18 } },
    owned: { fist: true, pistol: true, shotgun: false },
    cooldown: 0, flashT: 0, shotFireEnemy: -1,
    get weapon() { return WEAPONS[CB.weaponIdx]; },
    switchWeapon(i) {
      if (CB.owned[WEAPONS[i].id]) { CB.weaponIdx = i; hooks.onWeapon?.(); }
    },
    reload() {
      const w = CB.weapon, a = CB.ammo[w.id];
      if (!a || a.mag >= w.mag || a.reserve <= 0) return;
      const take = Math.min(w.mag - a.mag, a.reserve);
      a.mag += take; a.reserve -= take;
      if (audio) audio.reload();
    },
  };

  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, transparent: true, opacity: 0, depthWrite: false }));
  flash.scale.set(0.85, 0.85, 1);
  scene.add(flash);
  const flashLight = new THREE.PointLight(0xffc46a, 0, 13);
  scene.add(flashLight);

  function healthBar() {
    const g = new THREE.Group();
    const bg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.19),
      new THREE.MeshBasicMaterial({ color: 0x14060a, transparent: true, opacity: 0.78, depthTest: false, side: THREE.DoubleSide }));
    const fg = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.12),
      new THREE.MeshBasicMaterial({ color: 0xe83a30, depthTest: false, side: THREE.DoubleSide }));
    fg.position.z = 0.002;
    g.add(bg, fg);
    g.renderOrder = 20;
    return { g, fg };
  }

  CB.spawnEnemies = (cx, cz, count, opts = {}) => {
    CB.clearEnemies();
    for (let i = 0; i < count; i++) {
      const person = buildPerson(rng, { shirt: rng.pick([0x37474f, 0x4a2f18, 0x24303c, 0x5a2a2a]), cap: 0xb8352a });
      let x, z;
      if (opts.line) { // a firing line facing the player, for set-piece fights
        x = cx + (i - (count - 1) / 2) * 2.7;
        z = cz + (i % 2) * 1.3;
      } else {
        const ang = (i / count) * Math.PI * 1.2 - 0.6;
        const dist = opts.dist ?? rng.range(10, 15);
        x = cx + Math.sin(ang) * dist;
        z = cz + Math.cos(ang) * dist * 0.6;
      }
      person.group.position.set(x, 0, z);
      scene.add(person.group);
      const bar = healthBar();
      bar.g.position.y = 2.05;
      person.group.add(bar.g);
      const hpFrac = opts.hpFracs ? opts.hpFracs[i % opts.hpFracs.length] : 1;
      const e = {
        person, bar, x, z, hp: 100 * hpFrac, maxHp: 100, dead: false,
        phase: rng.range(0, 6), fireTimer: rng.range(1.2, 3.2), flashT: 0,
        muzzle: new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, transparent: true, opacity: 0, depthWrite: false })),
      };
      e.muzzle.scale.set(0.55, 0.55, 1);
      e.muzzle.position.set(0, 1.42, 0.5);
      person.group.add(e.muzzle);
      CB.enemies.push(e);
    }
    return CB.enemies;
  };

  CB.clearEnemies = () => {
    for (const e of CB.enemies) scene.remove(e.person.group);
    CB.enemies = [];
  };
  CB.aliveCount = () => CB.enemies.filter((e) => !e.dead).length;

  CB.tryShoot = (dt, player, camera) => {
    CB.cooldown -= dt;
    const w = CB.weapon;
    if (player.mode !== "foot") return;
    if (w.id === "fist") {
      player.aimPose = 0;
      if (CB.inputFiring && CB.cooldown <= 0) {
        CB.cooldown = w.cooldown;
        if (audio) audio.hit();
        for (const e of CB.enemies) {
          if (e.dead) continue;
          const d = Math.hypot(e.x - player.x, e.z - player.z);
          if (d < w.range) {
            e.hp -= w.damage; e.flashT = 0.12;
            hooks.onHit?.(e);
            if (e.hp <= 0) { e.dead = true; e.person.group.rotation.x = -Math.PI / 2; e.person.group.position.y = 0.12; e.bar.g.visible = false; hooks.onKill?.(e); }
          }
        }
      }
      return;
    }
    // face the camera direction while armed on foot
    player.aimPose = 0.9;
    if (!CB.inputFiring || CB.cooldown > 0) return;
    const a = CB.ammo[w.id];
    if (!a || a.mag <= 0) { CB.reload(); CB.cooldown = 0.3; return; }
    CB.cooldown = w.cooldown;
    a.mag -= 1;
    if (audio) audio.shot(w.id);
    hooks.onShot?.();
    // muzzle flash at the player's gun hand
    const fp = new THREE.Vector3(player.x, 1.42, player.z)
      .add(new THREE.Vector3(Math.sin(player.camYaw), 0, Math.cos(player.camYaw)).multiplyScalar(0.55));
    flash.position.copy(fp);
    flash.material.opacity = 0.95;
    flashLight.position.copy(fp);
    flashLight.intensity = 2.6;
    CB.flashT = 0.05;
    // hitscan along the camera's forward line
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone();
    let best = null, bestScore = 0.94;
    for (const e of CB.enemies) {
      if (e.dead) continue;
      const to = new THREE.Vector3(e.x - origin.x, 1.25 - origin.y, e.z - origin.z);
      const dist = to.length();
      if (dist > w.range) continue;
      const score = to.normalize().dot(dir);
      if (score > bestScore) { bestScore = score; best = e; }
    }
    if (best) {
      const pellets = w.pellets || 1;
      let dmg = 0;
      for (let p = 0; p < pellets; p++) if (rng.next() > w.spread * 6) dmg += w.damage;
      best.hp -= dmg;
      best.flashT = 0.12;
      hooks.onHit?.(best);
      if (best.hp <= 0 && !best.dead) {
        best.dead = true;
        best.person.group.rotation.x = -Math.PI / 2;
        best.person.group.position.y = 0.12;
        best.bar.g.visible = false;
        hooks.onKill?.(best);
      }
    }
  };

  CB.update = (dt, t, player, camera) => {
    if (CB.flashT > 0) {
      CB.flashT -= dt;
      if (CB.flashT <= 0) { flash.material.opacity = 0; flashLight.intensity = 0; }
    }
    for (const e of CB.enemies) {
      if (e.dead) continue;
      const dx = player.x - e.x, dz = player.z - e.z;
      const dist = Math.hypot(dx, dz);
      const heading = Math.atan2(dx, dz);
      e.person.group.rotation.y = heading;
      if (dist > 9.5) { // advance on the player
        e.x += Math.sin(heading) * dt * 1.9;
        e.z += Math.cos(heading) * dt * 1.9;
        e.phase += dt * 8;
      } else {
        e.phase += dt * 2.2; // strafing shuffle in stance
        e.x += Math.sin(heading + Math.PI / 2) * Math.sin(t * 0.9 + e.phase) * dt * 0.7;
      }
      e.person.group.position.set(e.x, 0, e.z);
      e.person.setPose(e.phase, 0.92);
      e.bar.g.rotation.y = -heading; // counter the parent yaw so the bar faces the player
      e.bar.fg.scale.x = Math.max(0.001, e.hp / e.maxHp);
      e.bar.fg.position.x = -(1 - e.hp / e.maxHp) * 0.61;
      e.bar.fg.material.color.setHex(e.hp > 45 ? 0xe83a30 : 0xff7a2e);
      if (e.flashT > 0) {
        e.flashT -= dt;
        e.person.hips.children.forEach((ch) => { if (ch.material) ch.material.emissive = new THREE.Color(0x661111); });
        if (e.flashT <= 0) e.person.hips.children.forEach((ch) => { if (ch.material) ch.material.emissive = new THREE.Color(0x000000); });
      }
      // return fire
      e.fireTimer -= dt;
      const forced = CB.shotFireEnemy >= 0 && CB.enemies.indexOf(e) === CB.shotFireEnemy;
      if ((e.fireTimer <= 0 || forced) && dist < 30) {
        e.fireTimer = rng.range(1.6, 3.4);
        e.muzzle.material.opacity = 0.9;
        setTimeout(() => { e.muzzle.material.opacity = 0; }, 60);
        if (audio && !forced) audio.shot("pistol", 0.4);
        if (rng.next() < 0.55) hooks.onPlayerHit?.(rng.int(4, 9));
      }
    }
  };

  return CB;
}
