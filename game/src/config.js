// Teluk Cerah 3D — semua angka dunia, kendaraan, senjata, dan cerita.
//
// Satu tempat untuk semua konstanta yang dipakai lebih dari satu modul:
// ukuran kota, letak jalan, nama distrik, lokasi misi, harga, dan tier.
// Koordinat dunia 3D: x ke timur, z ke selatan, y ke atas. Kota selebar
// 240 unit, jalan grid tiap 44 unit. Utara = z negatif (Perumahan),
// selatan = z positif (Pelabuhan), barat = x negatif (Marina/pantai).

export const STEP = 1 / 60;
export const CITY_HALF = 120;
export const ROAD_LINES = [-120, -76, -32, 12, 56, 100];
export const ROAD_WIDTH = 11;
export const LANE_OFFSET = 2.75;

// Batas distrik: Marina di barat, CBD di timur, Perumahan di utara,
// Pelabuhan di selatan, Kota Tua di tengah.
export function districtAt(x, z) {
  if (z > 56) return 'Pelabuhan';
  if (z < -76) return 'Perumahan';
  if (x < -76) return 'Marina';
  if (x > 12) return 'CBD';
  return 'Kota Tua';
}
export const DISTRICTS = [
  { name: 'Marina', x: -98, z: 0 },
  { name: 'Kota Tua', x: -32, z: 12 },
  { name: 'CBD', x: 56, z: 12 },
  { name: 'Perumahan', x: 12, z: -98 },
  { name: 'Pelabuhan', x: 34, z: 88 },
];

// Titik-titik cerita. Semuanya duduk di dekat jalan supaya mobil dan
// pejalan kaki bisa sampai tanpa menabrak gedung.
export const LOCATIONS = {
  marinaWarung: { x: -88, z: 56 }, // warung Bu Sari, Marina
  marinaMeet: { x: -88, z: -76 }, // titik temu utara Marina
  portWarehouse: { x: 78, z: 88 }, // gudang pelabuhan
  oldTownSquare: { x: -10, z: -10 }, // alun-alun Kota Tua
  cbdShop: { x: 78, z: 12 }, // toko kelontong CBD
  eastSafehouse: { x: 88, z: -76 }, // safehouse Perumahan
  cbdPlaza: { x: 34, z: -10 }, // plaza CBD
  northGate: { x: -54, z: -100 }, // gerbang utara
  portGate: { x: 12, z: 88 }, // gerbang pelabuhan
  marinaBeach: { x: -108, z: 12 }, // pantai Marina
  hospital: { x: -10, z: 100 }, // rumah sakit selatan
  policeStation: { x: -10, z: -100 }, // kantor polisi utara
};
export const GOTO_RADIUS = 9;
export const SAFEHOUSE_RADIUS = 11;

// Kendaraan: nama, warna, akselerasi (unit/dtk^2), top speed (unit/dtk),
// belok, panjang/lebar. 1 unit/dtk tampil sebagai 8 km/j di speedometer.
export const VEHICLE_TYPES = {
  sedan: { name: 'Sedan', color: 0x4a7fb5, accel: 14, top: 17, turn: 2.6, len: 4.4, wid: 2.0 },
  taxi: { name: 'Taksi', color: 0xf2c200, accel: 13, top: 16, turn: 2.6, len: 4.4, wid: 2.0 },
  truck: { name: 'Truk', color: 0x8a6d3b, accel: 8, top: 11, turn: 1.9, len: 6.2, wid: 2.6 },
  sport: { name: 'Sport', color: 0xc22e2e, accel: 20, top: 23, turn: 3.1, len: 4.6, wid: 2.0 },
  van: { name: 'Van', color: 0x5b8a72, accel: 10, top: 14, turn: 2.2, len: 5.2, wid: 2.4 },
  police: { name: 'Patroli', color: 0xd9d9de, accel: 17, top: 20, turn: 3.0, len: 4.6, wid: 2.0 },
};
export const KMH_PER_UNIT = 8;

// Senjata jalan kaki: jangkauan (unit), damage, jeda antar tembakan,
// peluru per magazen, waktu reload, kecepatan proyektil.
export const WEAPONS = {
  fist: { name: 'Tinju', range: 2.2, damage: 12, rate: 0.38, ammo: Infinity, auto: false },
  pistol: { name: 'Pistol', range: 42, damage: 22, rate: 0.22, ammo: 12, reload: 1.1, speed: 90 },
  shotgun: { name: 'Shotgun', range: 26, damage: 14, rate: 0.8, ammo: 6, reload: 1.6, speed: 70, pellets: 6, spread: 0.32 },
};

// Wanted: detik sembunyi per bintang, jumlah polisi jalan kaki/mobil.
export const WANTED_DECAY_SECONDS = [0, 25, 40, 60, 90, 120];
export const COP_COUNTS = [0, 1, 2, 3, 4, 6];
export const COP_CAR_COUNTS = [0, 0, 1, 2, 2, 3];

// Sepuluh misi cerita. Harga dan pemberi sama seperti yang sudah
// disegel di v2 — yang berubah hanya dunianya, bukan ceritanya.
export const MISSION_DEFS = [
  {
    id: 1, title: 'M1 — Pulang Kampung', giver: 'Bu Sari',
    intro: 'Raka, akhirnya pulang juga. Mobil pinjaman ada di parkiran dekat rumah. Ambil, lalu temui aku di warung ujung Marina.',
    steps: [
      { type: 'enterCar', text: 'Naik ke mobil pinjaman di parkiran' },
      { type: 'goto', ...LOCATIONS.marinaWarung, r: GOTO_RADIUS, text: 'Temui Bu Sari di warung Marina' },
    ],
    reward: 150,
  },
  {
    id: 2, title: 'M2 — Titipan', giver: 'Bu Sari',
    intro: 'Ada paket di gudang pelabuhan. Ambil cepat, jangan sampai polisi curiga. Kalau ketahuan, lari!',
    steps: [
      { type: 'goto', ...LOCATIONS.portWarehouse, r: GOTO_RADIUS, text: 'Ambil paket di gudang pelabuhan' },
      { type: 'escape', wanted: 2, seconds: 20, text: 'Kabur dari polisi selama 20 detik' },
    ],
    reward: 300,
  },
  {
    id: 3, title: 'M3 — Utang Lama', giver: 'Bu Sari',
    intro: 'Tiga penagih utang nongkrong di Kota Tua. Beri mereka pelajaran — tinju atau pistol, terserah kamu.',
    steps: [
      { type: 'kill', count: 3, ...LOCATIONS.oldTownSquare, text: 'Hadapi 3 penagih di Kota Tua' },
      { type: 'goto', ...LOCATIONS.marinaWarung, r: GOTO_RADIUS, text: 'Kembali ke warung Bu Sari' },
    ],
    reward: 450,
  },
  {
    id: 4, title: 'M4 — Balapan Liar', giver: 'Raka',
    intro: 'Balapan liar di jalan lingkar. Delapan checkpoint, tiga pembalap. Jangan kalah, Raka.',
    steps: [
      { type: 'race', checkpoints: 8, text: 'Lewati 8 checkpoint sebelum lawan' },
    ],
    reward: 600,
  },
  {
    id: 5, title: 'M5 — Rampok Toko', giver: 'Bu Sari',
    intro: 'Toko kelontong di CBD menyimpan uang tunai. Ambil, lalu kabur ke safehouse sebelum polisi mengepung.',
    steps: [
      { type: 'goto', ...LOCATIONS.cbdShop, r: GOTO_RADIUS, text: 'Ambil uang di toko CBD' },
      { type: 'goto', ...LOCATIONS.eastSafehouse, r: SAFEHOUSE_RADIUS, wanted: 4, text: 'Kabur ke safehouse Perumahan (wanted 4!)' },
    ],
    reward: 900,
  },
  {
    id: 6, title: 'M6 — Puncak', giver: 'Bu Sari',
    intro: 'Geng rival berkumpul di gudang pelabuhan. Habisi mereka semua, lalu pergi sebelum polisi datang.',
    steps: [
      { type: 'kill', count: 6, ...LOCATIONS.portWarehouse, text: 'Habisi 6 anggota geng rival' },
      { type: 'goto', ...LOCATIONS.marinaMeet, r: SAFEHOUSE_RADIUS, text: 'Kabur ke titik temu Marina' },
    ],
    reward: 1500,
  },
  {
    id: 7, title: 'M7 — Kurir Malam', giver: 'Bu Sari',
    intro: 'Paket ini harus sampai ke tiga titik sebelum tengah malam: plaza CBD, gerbang utara, lalu pantai Marina. Jangan berhenti, jangan ditangkap.',
    steps: [
      { type: 'route', points: [LOCATIONS.cbdPlaza, LOCATIONS.northGate, LOCATIONS.marinaBeach], r: GOTO_RADIUS, text: 'Antar paket ke 3 titik (sisa: %n)' },
    ],
    reward: 700,
  },
  {
    id: 8, title: 'M8 — Bayangan', giver: 'Dimas',
    intro: 'Ada mobil sport merah keliling kota — itu kurir geng rival. Ikuti dari dekat tanpa ketahuan, sampai aku tahu ke mana dia pergi.',
    steps: [
      { type: 'tail', ...LOCATIONS.cbdPlaza, seconds: 12, radius: 23, text: 'Ikuti mobil merah dari dekat (jangan sampai hilang)' },
    ],
    reward: 800,
  },
  {
    id: 9, title: 'M9 — Heist Pelabuhan', giver: 'Bu Sari',
    intro: 'Brankas pelabuhan penuh malam ini. Bersihkan penjaganya, ambil isinya, lalu kabur ke safehouse — polisi pasti mengepung.',
    steps: [
      { type: 'kill', count: 5, ...LOCATIONS.portWarehouse, text: 'Habisi 5 penjaga brankas pelabuhan' },
      { type: 'goto', ...LOCATIONS.eastSafehouse, r: SAFEHOUSE_RADIUS, wanted: 4, text: 'Kabur ke safehouse Perumahan (wanted 4!)' },
    ],
    reward: 1200,
  },
  {
    id: 10, title: 'M10 — Raja Teluk', giver: 'Bu Sari',
    intro: 'Ini puncaknya, Raka. Bos geng dan pengawalnya berkumpul di gudang. Habisi mereka, lalu pergi dari pelabuhan — Teluk Cerah jadi milikmu.',
    steps: [
      { type: 'kill', count: 6, ...LOCATIONS.portWarehouse, text: 'Habisi bos geng dan 5 pengawalnya' },
      { type: 'goto', ...LOCATIONS.eastSafehouse, r: SAFEHOUSE_RADIUS, wanted: 3, text: 'Kabur ke safehouse — jangan tertangkap!' },
    ],
    reward: 2000,
  },
];

// Rep: +150 per misi, +10 per takedown, +50 per lolos kejaran.
export const REP_TIERS = [
  { name: 'Anak Baru', need: 0 },
  { name: 'Pengemudi Dikenal', need: 300 },
  { name: 'Pembalap Teluk', need: 800 },
  { name: 'Raja Jalanan', need: 1500 },
  { name: 'Legenda Teluk', need: 2600 },
];
export function repTier(rep) {
  let tier = 0;
  for (let i = 0; i < REP_TIERS.length; i += 1) {
    if (rep >= REP_TIERS[i].need) tier = i;
  }
  return { index: tier, name: REP_TIERS[tier].name, next: REP_TIERS[tier + 1] || null };
}

// Nama unit polisi — burung Indonesia, supaya daftar unit di HUD
// terbaca sebagai kesatuan yang punya identitas sendiri.
export const COP_CAR_NAMES = ['ELANG-11', 'MERAK-23', 'BANGAU-18', 'KAKATUA-31', 'CENDRAWASIH-07', 'JALAK-42'];
export const COP_FOOT_NAMES = ['GARUDA-02', 'MERPATI-15', 'PERKUTUT-09', 'KENARI-27', 'BONDOL-33', 'CIBLEK-51'];
export const HELI_NAME = 'GARUDA-1';
export const HELI_MIN_WANTED = 3;

export const SHELL_COUNT = 24;
export const WEEKDAYS = ['Jum', 'Sab', 'Min', 'Sen', 'Sel', 'Rab', 'Kam'];

// Garage: upgrade ber-harga dengan gerbang tier Rep.
export const GARAGE_UPGRADES = {
  engine: { label: 'Mesin Balap', price: 5000, repTier: 3, desc: '+15% top speed (permanen)' },
  armor: { label: 'Pelat Baja', price: 1800, repTier: 1, desc: 'Armor penuh + tahan benturan' },
  nitro: { label: 'Nitro Ganda', price: 3000, repTier: 2, desc: 'Tangki NOS 2x lipat' },
};

// NOS: boost saat nyetir (Shift). Tangki dalam persen.
export const NOS_MAX = 100;
export const NOS_DRAIN_PER_SEC = 30;
export const NOS_REFILL_PER_SEC = 9;
export const NOS_TOP_MULT = 1.45;
export const NOS_ACCEL_MULT = 1.8;

export const SAVE_KEY = 'teluk-cerah-save';
export const BEST_KEY = 'teluk-cerah-best';
