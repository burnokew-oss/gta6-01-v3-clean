// Helikopter polisi "GARUDA-1": muncul di wanted >= 3, terbang
// mengikuti pemain dari atas-depan, menyorot dengan spotlight, dan
// bikin kamera sedikit bergetar saat dekat. Hilang saat wanted turun
// di bawah 3.
//
// Ronde 2: titik hover lebih dekat (10 unit di depan pemain, bukan 14)
// supaya bodi heli + kerucut sorot terbaca besar di frame chase.
import { HELI_MIN_WANTED, HELI_NAME } from './config.js';

export function updateHelicopter(G, dt) {
  if (G.wanted >= HELI_MIN_WANTED) {
    if (!G.heli) {
      const a = G.rng.range(0, Math.PI * 2);
      G.heli = {
        x: G.player.x + Math.sin(a) * 45,
        z: G.player.z + Math.cos(a) * 45,
        y: 14,
        angle: 0, rotor: 0,
        name: HELI_NAME, status: 'SPOTLIGHT',
      };
      if (G.audio) G.audio.rotor(true);
    }
    const h = G.heli;
    h.rotor += dt * 28;
    const tx = G.player.x + Math.sin(G.player.angle) * 10;
    const tz = G.player.z + Math.cos(G.player.angle) * 10;
    const dx = tx - h.x;
    const dz = tz - h.z;
    const d = Math.hypot(dx, dz);
    const sp = Math.min(22, 8 + d * 0.6);
    if (d > 0.8) {
      h.x += (dx / d) * sp * dt;
      h.z += (dz / d) * sp * dt;
    }
    h.y += (14 - h.y) * Math.min(1, dt * 2);
    h.angle = Math.atan2(G.player.x - h.x, G.player.z - h.z);
    if (d < 30) G.shake = Math.max(G.shake, 2.5);
  } else if (G.heli) {
    G.heli = null;
    if (G.audio) G.audio.rotor(false);
  }
}
