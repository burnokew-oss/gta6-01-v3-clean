// shops.js — garasi (upgrade mesin, NOS, cat), toko senjata, toko pakaian,
// warung makan pemulih HP. Titik toko di dunia + logika beli.
import { GARAGE_UPGRADES } from "./config.js";

export const SHOP_POINTS = [
  { id: "garage", name: "Garasi Bengkel Pelita", x: -52, z: 52, color: "#ffb340" },
  { id: "weapons", name: "Toko Senjata Ombak", x: 52, z: -52, color: "#ff5964" },
  { id: "clothes", name: "Butik Melati", x: -46, z: -58, color: "#f15bb5" },
  { id: "food", name: "Warung Senja", x: 58, z: 46, color: "#7cff4f" },
];

export class Shops {
  constructor() {
    this.owned = new Set();
    this.near = null;
  }
  update(playerPos) {
    this.near = null;
    for (const s of SHOP_POINTS) {
      if (Math.hypot(playerPos.x - s.x, playerPos.z - s.z) < 5) this.near = s;
    }
    return this.near;
  }
  menuFor(shop, player, combat) {
    if (!shop) return [];
    if (shop.id === "garage") {
      return GARAGE_UPGRADES.filter((u) => !this.owned.has(u.id)).map((u) => ({
        label: `${u.name} — $${u.price}`,
        desc: u.desc,
        buy: () => {
          if (player.money < u.price) return "Uang tidak cukup.";
          player.money -= u.price; this.owned.add(u.id);
          return `${u.name} terpasang!`;
        },
      }));
    }
    if (shop.id === "weapons") {
      return [
        { label: "Amunisi Pistol +30 — $60", desc: "Isi ulang pistol P9", buy: () => { if (player.money < 60) return "Uang tidak cukup."; player.money -= 60; combat.ammo.pistol += 30; return "Amunisi bertambah."; } },
        { label: "Amunisi Shotgun +8 — $90", desc: "Isi ulang shotgun laras", buy: () => { if (player.money < 90) return "Uang tidak cukup."; player.money -= 90; combat.ammo.shotgun += 8; return "Amunisi bertambah."; } },
        { label: "Armor Badan — $150", desc: "+50 armor", buy: () => { if (player.money < 150) return "Uang tidak cukup."; player.money -= 150; player.armor = Math.min(100, player.armor + 50); return "Armor terpasang."; } },
      ];
    }
    if (shop.id === "food") {
      return [
        { label: "Nasi Ikan Bakar — $25", desc: "Pulihkan 40 HP", buy: () => { if (player.money < 25) return "Uang tidak cukup."; player.money -= 25; player.hp = Math.min(100, player.hp + 40); return "Segar kembali!"; } },
        { label: "Es Teh Segar — $8", desc: "Pulihkan 12 HP", buy: () => { if (player.money < 8) return "Uang tidak cukup."; player.money -= 8; player.hp = Math.min(100, player.hp + 12); return "Dingin dan manis."; } },
      ];
    }
    return [
      { label: "Kemeja Pantai Cerah — $120", desc: "Gaya baru Raka", buy: () => { if (player.money < 120) return "Uang tidak cukup."; player.money -= 120; player.rep += 1; return "Tampilan baru! Reputasi +1."; } },
    ];
  }
}
