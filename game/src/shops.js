// Teluk Cerah — shops: the garage fits engine and NOS upgrades and new
// paint, the gun shop sells the shotgun and ammunition, the boutique
// changes Raka's outfit, and the food stall restores health.

import { SHOPS } from "./config.js";

const PAINTS = [0xc22418, 0x2e6da8, 0xe0a32e, 0x3f7a4e, 0x8a4a9e, 0x24303c, 0xe8e4da];
const PAINT_NAMES = ["Merah Senja", "Biru Teluk", "Kuning Pasar", "Hijau Karang", "Ungu Malam", "Hitam Dermaga", "Putih Pasir"];
const OUTFITS = [
  { name: "Kemeja Putih + Jaket Merah", jacket: 0xb8352a },
  { name: "Kaos Biru Laut", jacket: 0x2e6da8 },
  { name: "Kemeja Batik Pesisir", jacket: 0x7a4a28 },
  { name: "Jaket Kulit Hitam", jacket: 0x1c1c20 },
];

export function createShops(S, deps) {
  const { player, hud, combat, audio } = deps;
  const panel = document.getElementById("shop-panel");
  const titleEl = document.getElementById("shop-title");
  const itemsEl = document.getElementById("shop-items");
  let open = null, paintIdx = 0, outfitIdx = 0;

  function close() { open = null; panel.style.display = "none"; }
  function buy(label, price, fn) {
    const btn = document.createElement("button");
    btn.className = "shop-item";
    btn.textContent = `${label} — $${price}`;
    btn.onclick = () => {
      if (S.money < price) { hud.notify("Uang tidak cukup."); return; }
      S.money -= price;
      fn();
      audio?.coin();
      render();
    };
    return btn;
  }
  function free(label, fn) {
    const btn = document.createElement("button");
    btn.className = "shop-item";
    btn.textContent = label;
    btn.onclick = () => { fn(); render(); };
    return btn;
  }
  function render() {
    if (!open) return;
    titleEl.textContent = open.name;
    itemsEl.innerHTML = "";
    if (open.kind === "garage") {
      itemsEl.append(
        buy(`Upgrade Mesin (level ${S.upgrades.engine})`, 800, () => {
          S.upgrades.engine += 1; player.topSpeed += 3.2; player.accelPower += 1.6;
          hud.notify("Mesin ditingkatkan!");
        }),
        buy(S.upgrades.nos ? "NOS Terpasang ✓" : "Pasang NOS (Shift)", 1200, () => {
          S.upgrades.nos = true; player.nosUnlocked = true; hud.notify("NOS terpasang. Tahan Shift!");
        }),
        free(`Ganti Cat: ${PAINT_NAMES[paintIdx]} →`, () => {
          paintIdx = (paintIdx + 1) % PAINTS.length;
          player.car.paintMat.color.setHex(PAINTS[paintIdx]);
        }),
      );
    } else if (open.kind === "guns") {
      itemsEl.append(
        buy(combat.owned.shotgun ? "Shotgun Dimiliki ✓" : "Beli Shotgun", 1500, () => {
          combat.owned.shotgun = true; combat.switchWeapon(2); hud.notify("Shotgun dibeli!");
        }),
        buy("Amunisi Pistol +48", 120, () => { combat.ammo.pistol.reserve += 48; }),
        buy("Amunisi Shotgun +18", 160, () => { combat.ammo.shotgun.reserve += 18; }),
        buy("Rompi Armor Penuh", 500, () => { S.armor = 100; hud.notify("Armor penuh."); }),
      );
    } else if (open.kind === "clothes") {
      itemsEl.append(free(`Pakaian: ${OUTFITS[outfitIdx].name} →`, () => {
        outfitIdx = (outfitIdx + 1) % OUTFITS.length;
        S.outfit = OUTFITS[outfitIdx].name;
        player.figure.group.traverse((o) => {
          if (o.isMesh && o.material && o.material.color && o.geometry && o.geometry.type === "CapsuleGeometry" && o.scale.x >= 1.13) {
            o.material = o.material.clone();
            o.material.color.setHex(OUTFITS[outfitIdx].jacket);
          }
        });
      }));
    } else if (open.kind === "food") {
      itemsEl.append(
        buy("Nasi Campur Teluk (HP +45)", 60, () => { S.hp = Math.min(100, S.hp + 45); hud.notify("Perut kenyang, tenaga pulih."); }),
        buy("Es Kelapa Muda (HP +15)", 20, () => { S.hp = Math.min(100, S.hp + 15); }),
        buy("Kopi Tubruk (HP +25)", 35, () => { S.hp = Math.min(100, S.hp + 25); }),
      );
    }
    const exit = document.createElement("button");
    exit.className = "shop-item shop-exit";
    exit.textContent = "Keluar (E)";
    exit.onclick = close;
    itemsEl.append(exit);
    panel.style.display = "block";
  }
  function openShop(shop) { open = shop; render(); }

  return {
    get isOpen() { return !!open; },
    close,
    update(input) {
      if (open) {
        if (input.hit("KeyE") || input.hit("Escape")) close();
        return;
      }
      if (player.mode !== "foot" || !input.hit("KeyE")) return;
      for (const s of SHOPS) {
        if (Math.hypot(player.x - s.x, player.z - s.z) < 4.5) { openShop(s); return; }
      }
    },
    nearestHint() {
      if (player.mode !== "foot") return "";
      for (const s of SHOPS) {
        if (Math.hypot(player.x - s.x, player.z - s.z) < 4.5) return `Tekan E — ${s.name}`;
      }
      return "";
    },
  };
}
