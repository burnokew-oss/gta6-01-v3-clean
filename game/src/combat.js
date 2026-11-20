// combat.js — senjata tinju/pistol/shotgun, musuh dengan health bar,
// muzzle flash, dan hit feedback. Tembakan selalu mengurangi amunisi.
import { makePerson } from "./pedestrians.js";
import { mulberry32 } from "./random.js";
import { WEAPONS } from "./config.js";
import { canvasTexture } from "./city.js";

export class Combat {
  constructor(scene) {
    this.scene = scene;
    this.weaponIdx = 1;
    this.ammo = { pistol: WEAPONS[1].ammo, shotgun: WEAPONS[2].ammo };
    this.cooldown = 0;
    this.enemies = [];
    this.flashT = 0;
    const T3 = window.THREE;
    this.flash = new T3.Sprite(new T3.SpriteMaterial({
      map: canvasTexture(64, 64, (g) => {
        const rg = g.createRadialGradient(32, 32, 2, 32, 32, 30);
        rg.addColorStop(0, "rgba(255,240,180,1)"); rg.addColorStop(0.4, "rgba(255,160,40,0.85)");
        rg.addColorStop(1, "rgba(255,120,20,0)");
        g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
      }),
      transparent: true, depthWrite: false,
    }));
    this.flash.scale.setScalar(1.6);
    this.flash.visible = false;
    scene.add(this.flash);
    this.rng = mulberry32(31337);
  }
  get weapon() { return WEAPONS[this.weaponIdx]; }
  switchWeapon(idx) { if (idx >= 0 && idx < WEAPONS.length) this.weaponIdx = idx; }
  spawnEnemies(cx, cz, count, spread) {
    this.clearEnemies();
    for (let i = 0; i < count; i++) {
      const mesh = makePerson(this.rng, { shirt: 0x111827, pants: 0x111827, skin: 0xd9a066 });
      const ang = -0.85 + (i / Math.max(1, count - 1)) * 1.7;
      const dist = 9 + (i % 3) * 2.6;
      mesh.position.set(cx + Math.cos(ang) * dist, 0, cz + Math.sin(ang) * dist);
      mesh.rotation.y = Math.atan2(cx - mesh.position.x, cz - mesh.position.z) + Math.PI / 2;
      this.scene.add(mesh);
      const barBg = new window.THREE.Sprite(new window.THREE.SpriteMaterial({ color: 0x111111, depthWrite: false }));
      barBg.scale.set(1.5, 0.2, 1); barBg.position.set(mesh.position.x, 2.25, mesh.position.z);
      this.scene.add(barBg);
      const bar = new window.THREE.Sprite(new window.THREE.SpriteMaterial({ color: 0xef4444, depthWrite: false }));
      bar.scale.set(1.4, 0.13, 1); bar.position.copy(barBg.position);
      this.scene.add(bar);
      this.enemies.push({ mesh, bar, barBg, hp: 100, hitT: 0, alive: true });
    }
  }
  clearEnemies() {
    for (const e of this.enemies) { this.scene.remove(e.mesh); this.scene.remove(e.bar); this.scene.remove(e.barBg); }
    this.enemies = [];
  }
  tryShoot(origin, angle, onEvent) {
    const w = this.weapon;
    if (this.cooldown > 0) return false;
    if (w.ammo > 0) {
      const key = w.id;
      if (this.ammo[key] <= 0) { onEvent && onEvent("empty", w); return false; }
      this.ammo[key] -= 1;
    }
    this.cooldown = w.rate;
    this.flashT = 0.07;
    const fx = origin.x + Math.cos(angle) * 1.1, fz = origin.z - Math.sin(angle) * 1.1;
    this.flash.position.set(fx, 1.35, fz);
    this.flash.visible = true;
    let best = null, bestD = w.range;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = e.mesh.position.x - origin.x, dz = e.mesh.position.z - origin.z;
      const d = Math.hypot(dx, dz);
      const dirA = Math.atan2(-dz, dx);
      let diff = Math.abs(dirA - angle);
      while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
      if (d < bestD && diff < 0.3) { best = e; bestD = d; }
    }
    if (best) {
      best.hp -= w.damage;
      best.hitT = 0.18;
      best.bar.scale.x = Math.max(0.02, 1.4 * (best.hp / 100));
      best.bar.material.color.setHex(best.hp > 45 ? 0xef4444 : 0xf97316);
      if (best.hp <= 0) {
        best.alive = false;
        best.mesh.rotation.z = Math.PI / 2;
        best.mesh.position.y = 0.25;
        best.bar.visible = false; best.barBg.visible = false;
        onEvent && onEvent("down", best);
      } else onEvent && onEvent("hit", best);
    }
    onEvent && onEvent("shot", w);
    return true;
  }
  update(dt, t) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flashT -= dt;
    if (this.flashT <= 0) this.flash.visible = false;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.hitT = Math.max(0, e.hitT - dt);
      const s = e.hitT > 0 ? 1.12 : 1;
      e.mesh.scale.setScalar(s);
    }
  }
  aliveCount() { return this.enemies.filter((e) => e.alive).length; }
}
