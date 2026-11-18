// Toko + safehouse + garage Teluk Cerah. Semua transaksi pakai cash
// pemain yang sudah ada; panel harga muncul saat pemain mendekat,
// beli pakai tombol 1-5.
import { LOCATIONS, GARAGE_UPGRADES, REP_TIERS, repTier } from './config.js';

// Definisi toko: lokasi (x, z), radius interaksi, dan daftar barang.
// apply(G) mengembalikan true bila pembelian berhasil (efek memang bisa
// diterapkan), false bila tidak.
export const SHOP_DEFS = [
  {
    id: 'gun', name: 'Toko Senjata "Siaga"', icon: '$', ...LOCATIONS.cbdShop, r: 9,
    hint: 'Dekat toko senjata — tekan 1/2/3 untuk beli',
    items: [
      { label: 'Ammo Pistol x24', price: 40, apply(G) { G.player.ammo.pistol += 24; return true; } },
      { label: 'Shotgun + ammo x12', price: 120, apply(G) { G.player.ammo.shotgun += 12; G.player.ammoInMag.shotgun = Math.max(G.player.ammoInMag.shotgun, 6); return true; } },
      { label: 'Armor 50', price: 80, apply(G) { if (G.player.armor >= 100) return false; G.player.armor = Math.min(100, G.player.armor + 50); return true; } },
    ],
  },
  {
    id: 'safehouse', name: 'Safehouse Perumahan', icon: 'H', ...LOCATIONS.eastSafehouse, r: 10,
    hint: 'Dekat safehouse — tekan 1 untuk sembuh + save, 2 untuk istirahat',
    items: [
      { label: 'Sembuh penuh + save', price: 50, apply(G) { G.player.health = 100; G.player.armor = Math.max(G.player.armor, 25); G.saveNow = true; return true; } },
      { label: 'Istirahat 6 jam (+25 HP)', price: 0, apply(G) { G.player.health = Math.min(100, G.player.health + 25); G.clock = (G.clock + 360) % 1440; return true; } },
    ],
  },
  {
    id: 'garage', name: 'Garage "Bengkel Dimas"', icon: 'G', ...LOCATIONS.portGate, r: 10,
    hint: 'Dekat garage (di mobil) — tekan 1-5 untuk beli upgrade',
    items: [
      { label: 'Repair mobil penuh', price: 60, apply(G) { const v = G.player.vehicle; if (!v) return false; v.health = 100; v.smoking = false; return true; } },
      { label: 'Repaint — warna baru + hapus wanted', price: 100, apply(G) { const v = G.player.vehicle; if (!v) return false; v.color = G.rng.pick([0xc22e2e, 0x2e8a5b, 0x8a5ec2, 0xe8a020, 0x4a7fb5, 0xe5534b]); G.wanted = 0; G.heli = null; return true; } },
      { label: `Mesin Balap — ${GARAGE_UPGRADES.engine.desc}`, price: GARAGE_UPGRADES.engine.price, repTier: GARAGE_UPGRADES.engine.repTier, apply(G) { if (G.player.upgrades.engine) return false; G.player.upgrades.engine = true; G.player.engineLevel = 1; return true; } },
      { label: `Pelat Baja — ${GARAGE_UPGRADES.armor.desc}`, price: GARAGE_UPGRADES.armor.price, repTier: GARAGE_UPGRADES.armor.repTier, apply(G) { if (G.player.upgrades.armor) return false; G.player.upgrades.armor = true; G.player.armor = 100; return true; } },
      { label: `Nitro Ganda — ${GARAGE_UPGRADES.nitro.desc}`, price: GARAGE_UPGRADES.nitro.price, repTier: GARAGE_UPGRADES.nitro.repTier, apply(G) { if (G.player.upgrades.nitro) return false; G.player.upgrades.nitro = true; G.player.nosMax = 200; G.player.nos = 200; return true; } },
    ],
  },
];

// Cari toko terdekat dalam radius; garage hanya aktif saat pemain di mobil.
export function updateShops(G) {
  const p = G.player;
  G.shop = null;
  for (const s of SHOP_DEFS) {
    if (s.id === 'garage' && p.onFoot) continue;
    if (Math.hypot(p.x - s.x, p.z - s.z) < s.r) {
      G.shop = s;
      return;
    }
  }
}

export function buyShopItem(G, index) {
  const shop = G.shop;
  if (!shop || !shop.items[index]) return false;
  const item = shop.items[index];
  if (item.repTier !== undefined && repTier(G.rep || 0).index < item.repTier) {
    G.mission.banner = `Butuh REP tier ${item.repTier + 1} (${REP_TIERS[item.repTier].name}) untuk ${item.label}`;
    G.mission.bannerTimer = 0;
    return false;
  }
  if (G.player.cash < item.price) {
    G.mission.banner = `Uang tidak cukup — ${item.label} butuh $${item.price}`;
    G.mission.bannerTimer = 0;
    return false;
  }
  const ok = item.apply(G);
  if (!ok) {
    G.mission.banner = 'Tidak bisa dibeli sekarang';
    G.mission.bannerTimer = 0;
    return false;
  }
  G.player.cash -= item.price;
  G.cashFloaters.push({ x: G.player.x, z: G.player.z, text: `-$${item.price}`, life: 1.2 });
  G.mission.banner = `Dibeli: ${item.label}  -$${item.price}`;
  G.mission.bannerTimer = 0;
  if (G.audio) G.audio.pickup();
  return true;
}
