// shops.js — toko senjata, garasi, safehouse, rumah sakit, dan kantor polisi.
// Builder sistem, rebuild #3. Semua harga mengikuti spesifikasi prosa.
// Modul ini membangun panel tokonya sendiri di DOM (id shop-panel) dan
// membaca posisi pemain dari state bersama. Tidak ada permintaan jaringan.

import { showBanner } from './hud.js';
import { playSound } from './audio.js';

const SHOP_DEFS = [
  {
    id: 'senjata-cbd',
    kind: 'weapon',
    name: 'Toko Senjata CBD',
    district: 'CBD',
    x: 92,
    z: -6,
    blurb: 'Amunisi, armor, dan senjata. Bayar tunai, tanpa pertanyaan.',
    stock: [
      { id: 'ammo-pistol', name: 'Amunisi Pistol (24)', price: 60, apply: 'ammo-pistol' },
      { id: 'ammo-shotgun', name: 'Amunisi Shotgun (8)', price: 120, apply: 'ammo-shotgun' },
      { id: 'armor', name: 'Rompi Anti Peluru (+50 armor)', price: 250, apply: 'armor' },
      { id: 'shotgun', name: 'Shotgun Pantai (senjata baru)', price: 900, apply: 'shotgun' },
    ],
  },
  {
    id: 'senjata-pelabuhan',
    kind: 'weapon',
    name: 'Toko Senjata Pelabuhan',
    district: 'Pelabuhan',
    x: 44,
    z: 112,
    blurb: 'Stok pelabuhan: murah, tapi jangan tanya asalnya.',
    stock: [
      { id: 'ammo-pistol', name: 'Amunisi Pistol (24)', price: 55, apply: 'ammo-pistol' },
      { id: 'ammo-shotgun', name: 'Amunisi Shotgun (8)', price: 110, apply: 'ammo-shotgun' },
      { id: 'armor', name: 'Rompi Anti Peluru (+50 armor)', price: 230, apply: 'armor' },
    ],
  },
  {
    id: 'garasi-dimas',
    kind: 'garage',
    name: 'Garasi Dimas',
    district: 'Kota Tua',
    x: -14,
    z: -22,
    blurb: 'Dimas yang pegang. Cat, NOS, dan perbaikan — semua bisa.',
    stock: [
      { id: 'repair', name: 'Perbaiki mobil (kondisi 100%)', price: 150, apply: 'repair' },
      { id: 'nos', name: 'Isi ulang NOS penuh', price: 200, apply: 'nos' },
      { id: 'paint-red', name: 'Cat ulang: Merah Teluk', price: 300, apply: 'paint-red' },
      { id: 'paint-blue', name: 'Cat ulang: Biru Marina', price: 300, apply: 'paint-blue' },
      { id: 'paint-black', name: 'Cat ulang: Hitam Malam', price: 300, apply: 'paint-black' },
      { id: 'armor-car', name: 'Pelat baja mobil (+kondisi)', price: 500, apply: 'armor-car' },
    ],
  },
  {
    id: 'safehouse-perumahan',
    kind: 'safehouse',
    name: 'Safehouse Perumahan',
    district: 'Perumahan',
    x: -24,
    z: -128,
    blurb: 'Rumah aman Raka. Tidur memulihkan health dan menyimpan game.',
    stock: [
      { id: 'sleep', name: 'Tidur semalam (pulih + simpan)', price: 0, apply: 'sleep' },
      { id: 'heal', name: 'Istirahat sebentar (+50 health)', price: 40, apply: 'heal' },
    ],
  },
  {
    id: 'rumah-sakit',
    kind: 'hospital',
    name: 'Rumah Sakit Teluk',
    district: 'Marina',
    x: -108,
    z: 8,
    blurb: 'Wasted? Bangun di sini. Perawatan penuh, harga bersahabat.',
    stock: [
      { id: 'heal-full', name: 'Perawatan penuh (health 100)', price: 100, apply: 'heal-full' },
    ],
  },
  {
    id: 'kantor-polisi',
    kind: 'police',
    name: 'Kantor Polisi Teluk',
    district: 'CBD',
    x: 108,
    z: 44,
    blurb: 'Busted? Urus denda di sini. Jangan macam-macam di dalam.',
    stock: [
      { id: 'fine', name: 'Bayar denda (hapus wanted)', price: 200, apply: 'fine' },
    ],
  },
];

const NEAR_DISTANCE = 12;
const INTERACT_KEY = 'KeyE';

function ensureShops(state) {
  if (!state.shops) {
    state.shops = {
      list: SHOP_DEFS.map((def) => ({ ...def, stock: def.stock.map((item) => ({ ...item })) })),
      near: null,
      open: null,
      ownedShotgun: false,
    };
  }
  return state.shops;
}

function playerPosition(state) {
  const player = state.player;
  if (!player) return null;
  const pos = player.position || player.pos;
  if (!pos) return null;
  if (typeof pos.x === 'number' && typeof pos.z === 'number') return { x: pos.x, z: pos.z };
  return null;
}

function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

function cashOf(state) {
  if (typeof state.cash === 'number') return state.cash;
  if (typeof state.money === 'number') return state.money;
  return 0;
}

function setCash(state, value) {
  if (typeof state.cash === 'number') state.cash = value;
  else if (typeof state.money === 'number') state.money = value;
  else state.cash = value;
}

function shopPanelElement() {
  let panel = document.getElementById('shop-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'shop-panel';
    panel.style.cssText = [
      'position:fixed', 'left:50%', 'top:50%', 'transform:translate(-50%,-50%)',
      'width:460px', 'max-width:92vw', 'z-index:60',
      'background:rgba(8,14,24,0.94)', 'border:1px solid #3fd2ff',
      'border-radius:10px', 'padding:18px 20px', 'color:#eaf6ff',
      'font-family:Arial,Helvetica,sans-serif', 'display:none',
      'box-shadow:0 12px 40px rgba(0,0,0,0.6)',
    ].join(';');
    document.body.appendChild(panel);
  }
  return panel;
}

function closeShopPanel(state) {
  const shops = ensureShops(state);
  shops.open = null;
  const panel = document.getElementById('shop-panel');
  if (panel) panel.style.display = 'none';
}

function applyPurchase(state, shop, item) {
  const shops = ensureShops(state);
  const player = state.player || {};
  const combat = state.combat || {};
  const car = player.car || player.vehicle || null;
  switch (item.apply) {
    case 'ammo-pistol':
      combat.pistolAmmo = (combat.pistolAmmo || 0) + 24;
      combat.pistolReserve = (combat.pistolReserve || 0) + 24;
      break;
    case 'ammo-shotgun':
      combat.shotgunAmmo = (combat.shotgunAmmo || 0) + 8;
      combat.shotgunReserve = (combat.shotgunReserve || 0) + 8;
      break;
    case 'armor':
      player.armor = Math.min(100, (player.armor || 0) + 50);
      break;
    case 'shotgun':
      combat.shotgunUnlocked = true;
      shops.ownedShotgun = true;
      if (Array.isArray(combat.weapons)) {
        const exists = combat.weapons.some((w) => w && w.slot === 3);
        if (!exists) combat.weapons.push({ slot: 3, name: 'Shotgun', ammo: 0, reserve: 0 });
      }
      break;
    case 'repair':
      if (car) car.condition = 100;
      if (state.player) state.player.carCondition = 100;
      break;
    case 'nos':
      if (car) car.nos = 100;
      if (state.player) state.player.nos = 100;
      break;
    case 'paint-red':
    case 'paint-blue':
    case 'paint-black': {
      const color = item.apply === 'paint-red' ? 'red' : item.apply === 'paint-blue' ? 'blue' : 'black';
      if (car) car.color = color;
      if (state.player) state.player.carColor = color;
      break;
    }
    case 'armor-car':
      if (car) car.condition = Math.min(100, (car.condition || 80) + 25);
      break;
    case 'sleep': {
      player.hp = 100;
      player.health = 100;
      if (state.clock) state.clock.hour = 8;
      if (typeof state.wanted === 'number') state.wanted = 0;
      break;
    }
    case 'heal':
      player.hp = Math.min(100, (player.hp || player.health || 50) + 50);
      player.health = player.hp;
      break;
    case 'heal-full':
      player.hp = 100;
      player.health = 100;
      break;
    case 'fine':
      if (typeof state.wanted === 'number') state.wanted = 0;
      break;
    default:
      break;
  }
  if (state.stats) {
    state.stats.spent = (state.stats.spent || 0) + item.price;
  }
}

function renderShopPanel(state, shop) {
  const panel = shopPanelElement();
  const cash = cashOf(state);
  const rows = shop.stock.map((item, index) => {
    const locked = item.apply === 'shotgun' && ensureShops(state).ownedShotgun;
    const label = locked ? item.name + ' — SUDAH DIBELI' : item.name + ' — $' + item.price;
    return (
      '<button data-shop-item="' + index + '" ' +
      'style="display:block;width:100%;text-align:left;margin:6px 0;padding:9px 12px;' +
      'background:' + (locked ? '#22303a' : '#12344a') + ';color:#eaf6ff;border:1px solid #2b7ea6;' +
      'border-radius:6px;cursor:pointer;font-size:15px;"' +
      (locked ? ' disabled' : '') + '>' + label + '</button>'
    );
  }).join('');
  panel.innerHTML =
    '<div style="font-size:20px;font-weight:bold;color:#ffd23f;">' + shop.name + '</div>' +
    '<div style="color:#9fc6d8;font-size:13px;margin:4px 0 10px;">' + shop.blurb + ' · ' + shop.district + '</div>' +
    '<div style="color:#7dff9a;font-size:14px;margin-bottom:6px;">Uangmu: $' + cash.toLocaleString('en-US') + '</div>' +
    rows +
    '<div style="margin-top:12px;color:#9fc6d8;font-size:13px;">Tekan E atau Esc untuk menutup · Klik item untuk membeli</div>';
  panel.style.display = 'block';
  panel.querySelectorAll('[data-shop-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.getAttribute('data-shop-item'));
      buyItem(state, shop, shop.stock[index]);
    });
  });
}

function buyItem(state, shop, item) {
  if (!item) return;
  const shops = ensureShops(state);
  if (item.apply === 'shotgun' && shops.ownedShotgun) return;
  const cash = cashOf(state);
  if (cash < item.price) {
    showBanner(state, 'UANG TIDAK CUKUP — ' + item.name);
    playSound(state, 'punch');
    return;
  }
  setCash(state, cash - item.price);
  applyPurchase(state, shop, item);
  playSound(state, 'pickup');
  showBanner(state, 'DIBELI — ' + item.name);
  renderShopPanel(state, shop);
}

function shopHintElement() {
  let hint = document.getElementById('shop-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'shop-hint';
    hint.style.cssText = [
      'position:fixed', 'left:50%', 'bottom:130px', 'transform:translateX(-50%)',
      'z-index:45', 'background:rgba(0,0,0,0.65)', 'color:#ffd23f',
      'font-size:14px', 'font-family:Arial,Helvetica,sans-serif',
      'padding:7px 16px', 'border-radius:16px', 'display:none',
      'border:1px solid rgba(255,210,63,0.5)', 'white-space:nowrap',
    ].join(';');
    document.body.appendChild(hint);
  }
  return hint;
}

function updateShopHint(state) {
  const shops = ensureShops(state);
  const hint = shopHintElement();
  const dialogOpen = Boolean(state.missions && state.missions.dialogOpen);
  if (shops.near && !shops.open && !dialogOpen) {
    hint.textContent = 'E — Masuk ' + shops.near.name;
    hint.style.display = 'block';
  } else {
    hint.style.display = 'none';
  }
}

export function createShops(state) {
  const shops = ensureShops(state);
  shops.near = null;
  shops.open = null;
  if (state.city && state.city.points) {
    for (const shop of shops.list) {
      const point = state.city.points[shop.id] || state.city.points[shop.name];
      if (point && typeof point.x === 'number' && typeof point.z === 'number') {
        shop.x = point.x;
        shop.z = point.z;
      }
    }
  }
  return shops;
}

export function updateShops(state, dt) {
  const shops = ensureShops(state);
  const pos = playerPosition(state);
  if (!pos) return;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const shop of shops.list) {
    const d = distance2D(pos, { x: shop.x, z: shop.z });
    if (d < nearestDistance) {
      nearestDistance = d;
      nearest = shop;
    }
  }
  shops.near = nearestDistance <= NEAR_DISTANCE ? nearest : null;
  if (shops.open && (!shops.near || shops.near.id !== shops.open.id)) {
    closeShopPanel(state);
  }
  updateShopHint(state);
  if (state.input && typeof state.input.takePressed === 'function') {
    if (state.input.takePressed(INTERACT_KEY)) {
      if (shops.open) {
        closeShopPanel(state);
      } else if (shops.near && !(state.missions && state.missions.dialogOpen)) {
        shops.open = shops.near;
        renderShopPanel(state, shops.near);
        playSound(state, 'pickup');
      }
    }
    if (shops.open && state.input.takePressed('Escape')) {
      closeShopPanel(state);
    }
  }
}

export function nearestShop(state) {
  return ensureShops(state).near;
}

export function shopList(state) {
  return ensureShops(state).list;
}
