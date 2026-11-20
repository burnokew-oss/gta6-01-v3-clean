// shops.js — garasi (upgrade mesin, NOS, cat), toko senjata, toko pakaian,
// warung makan pemulih HP. Interaksi dengan tombol E di dekat toko.
import { SHOPS } from "./config.js";

export class Shops {
  constructor(player, combat) {
    this.list = SHOPS;
    this.player = player;
    this.combat = combat;
    this.clothesIdx = 0;
    this.paintIdx = 0;
    this.notice = "";
  }
  nearest() {
    let best = null, bestD = 9;
    for (const s of this.list) {
      const d = Math.hypot(this.player.x - s.x, this.player.z - s.z);
      if (d < bestD) { best = s; bestD = d; }
    }
    return best;
  }
  interact() {
    const s = this.nearest();
    if (!s) return null;
    const p = this.player;
    if (s.kind === "garage") {
      if (p.engineLevel < 3 && p.money >= 300) { p.money -= 300; p.engineLevel += 1; this.notice = "Mesin naik ke level " + p.engineLevel; }
      else if (p.nosLevel < 3 && p.money >= 200) { p.money -= 200; p.nosLevel += 1; p.nos = 100; this.notice = "NOS ditingkatkan ke level " + p.nosLevel; }
      else this.notice = "Garasi Pelita: upgrade penuh atau uang kurang";
    } else if (s.kind === "weapon") {
      if (p.money >= 120) { p.money -= 120; this.combat.ammo.pistol += 24; this.combat.ammo.shotgun += 8; this.notice = "Amunisi pistol +24, shotgun +8"; }
      else this.notice = "Toko Senjata Arus: uang kurang untuk amunisi";
    } else if (s.kind === "clothes") {
      this.clothesIdx = (this.clothesIdx + 1) % 4;
      this.notice = "Butik Melati: gaya pakaian diganti (" + (this.clothesIdx + 1) + "/4)";
    } else if (s.kind === "food") {
      if (p.money >= 25) { p.money -= 25; p.hp = Math.min(100, p.hp + 40); this.notice = "Warung Senja: HP +40, perut kenyang"; }
      else this.notice = "Warung Senja: uang kurang untuk makan";
    }
    return s;
  }
}
