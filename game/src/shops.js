// Toko senjata, garasi upgrade, safehouse, rumah sakit, kantor polisi.
import "three";
const THREE = window.THREE;
import { showDialog, showBanner } from "./hud.js";
import { playSound } from "./audio.js";

export function createShops(state) {
  const spots = [
    { kind: "gun", name: "Toko Senjata Berkah", at: state.city.pois.gunShop, color: 0xff7847 },
    { kind: "garage", name: "Garasi Bimo", at: state.city.pois.garage, color: 0x39c2ff },
    { kind: "safehouse", name: "Safehouse Perumahan", at: state.city.pois.safehouse, color: 0x3ce06a },
    { kind: "hospital", name: "Rumah Sakit Teluk", at: state.city.pois.hospital, color: 0xff5f7a },
    { kind: "police", name: "Kantor Polisi", at: state.city.pois.policeStation, color: 0x7ab8ff },
  ];
  for (const s of spots) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.13, 8, 22),
      new THREE.MeshBasicMaterial({ color: s.color }));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(s.at.x, 0.25, s.at.z);
    state.world.scene.add(ring);
    s.ring = ring;
  }
  return { spots, near: null, armorLevel: 0, engineLevel: 0, dialogCd: 0 };
}

export function updateShops(state, dt) {
  const sh = state.shopState;
  sh.dialogCd = Math.max(0, sh.dialogCd - dt);
  sh.near = null;
  for (const s of sh.spots) {
    s.ring.rotation.z += dt * 0.8;
    if (state.player.pos.distanceTo(s.at) < 4.2) sh.near = s;
  }
  if (!sh.near || state.staged) return;
  if (sh.dialogCd <= 0) {
    sh.dialogCd = 4;
    if (sh.near.kind === "gun") showDialog(state, "Penjaga Toko", "Pistol $250, shotgun $600, amunisi selalu ada. Tekan E untuk membeli pistol.");
    else if (sh.near.kind === "garage") showDialog(state, "Bimo", "Upgrade mesin $400, armor bodi $350. Tekan E untuk upgrade mesin mobilmu.");
    else if (sh.near.kind === "safehouse") showDialog(state, "Safehouse", "Tempat aman. Tekan E untuk menyimpan permainan.");
    else if (sh.near.kind === "hospital") showDialog(state, "Perawat", "Tekan E untuk memulihkan health ($50).");
    else showDialog(state, "Petugas", "Kantor Polisi Teluk Cerah. Jaga sikapmu di kota ini.");
  }
  if (!state.input.takePressed("KeyE")) return;
  const kind = sh.near.kind;
  if (kind === "gun") {
    const w = state.combat.weapons[1];
    if (state.cash >= 250) { state.cash -= 250; w.reserve += 36; w.ammo = w.mag; showBanner(state, "Pistol + amunisi dibeli — $250"); playSound(state, "pickup"); }
    else showBanner(state, "Uang tidak cukup");
  } else if (kind === "garage" && state.player.car) {
    if (state.cash >= 400) { state.cash -= 400; state.player.car.health = 100; state.player.car.spec = { ...state.player.car.spec, topSpeed: state.player.car.spec.topSpeed + 3 }; showBanner(state, "Mesin di-upgrade + kondisi pulih — $400"); playSound(state, "mission"); }
    else showBanner(state, "Uang tidak cukup");
  } else if (kind === "safehouse") {
    import("./save.js").then((m) => { if (m.saveGame(state, 1)) showBanner(state, "Permainan disimpan (slot 1)"); });
  } else if (kind === "hospital") {
    if (state.cash >= 50 && state.player.health < 100) { state.cash -= 50; state.player.health = 100; showBanner(state, "Health pulih — $50"); playSound(state, "pickup"); }
  }
}
