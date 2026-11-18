// Teluk Cerah — konfigurasi dunia dan gameplay.
// Satu objek CONFIG memuat semua angka, nama, dan warna yang dipakai modul lain,
// supaya tidak ada angka ajaib yang tersebar di dalam kode game.

export const CONFIG = {
  gameTitle: 'TELUK CERAH',
  gameSubtitle: 'OPEN-WORLD CRIME 3D',
  seed: 1,

  // ---- Dunia ---------------------------------------------------------------
  world: {
    width: 600, // meter, sumbu x (barat - timur)
    depth: 500, // meter, sumbu z (utara - selatan)
    blockSize: 80, // sisi satu blok kota
    roadWidth: 16, // lebar jalan
    cols: 6, // kolom blok, dipetakan ke huruf A-F di peta
    rows: 5, // baris blok, dipetakan ke angka 1-5 di peta
    groundY: 0,
    seaLevel: -0.4,
  },

  // ---- Distrik -------------------------------------------------------------
  districts: [
    {
      name: 'Perumahan',
      short: 'PERUMAHAN',
      buildingColor: 0x8a7f74,
      roofColor: 0x9c4a3c,
      windowTint: 0xffd9a0,
      heightMin: 6,
      heightMax: 10,
      houses: true,
    },
    {
      name: 'Marina',
      short: 'MARINA',
      buildingColor: 0x7d94a8,
      roofColor: 0x5d7d8c,
      windowTint: 0xbfe8ff,
      heightMin: 8,
      heightMax: 16,
      houses: false,
    },
    {
      name: 'Kota Tua',
      short: 'KOTA TUA',
      buildingColor: 0x9c8a6a,
      roofColor: 0x6e4a3a,
      windowTint: 0xffc98a,
      heightMin: 12,
      heightMax: 26,
      houses: false,
    },
    {
      name: 'CBD',
      short: 'CBD',
      buildingColor: 0x3d4a63,
      roofColor: 0x232c3d,
      windowTint: 0x9fd8ff,
      heightMin: 42,
      heightMax: 92,
      houses: false,
    },
    {
      name: 'Pelabuhan',
      short: 'PELABUHAN',
      buildingColor: 0x6a6a62,
      roofColor: 0x4a4a44,
      windowTint: 0xffe2a8,
      heightMin: 10,
      heightMax: 17,
      houses: false,
    },
  ],

  // ---- Warna suasana -------------------------------------------------------
  colors: {
    skyNight: 0x070a13,
    skyDay: 0x9fc3e8,
    skyDusk: 0x2c2a4a,
    fogNight: 0x0a0e1a,
    fogDay: 0xa8c4de,
    ground: 0x0d0f14,
    road: 0x171a21,
    roadLine: 0xd8c86a,
    sidewalk: 0x2a2e38,
    curb: 0x3a3f4c,
    water: 0x0d3247,
    sand: 0x8a7a5c,
    lampWarm: 0xffb46b,
    neonGreen: 0x39ff88,
    neonPink: 0xff4fa3,
    neonOrange: 0xff9a3c,
    neonCyan: 0x37e6ff,
    neonYellow: 0xffe14d,
    neonBlue: 0x5a8cff,
    palmTrunk: 0x6e5238,
    palmLeaf: 0x2e7d4f,
    container: [0xb8452c, 0x2c6eb8, 0x3c8a4a, 0xc2a13c, 0x8a3c6e],
  },

  // ---- Pemain --------------------------------------------------------------
  player: {
    walkSpeed: 4.4,
    runSpeed: 8.6,
    turnSpeed: 9.0,
    maxHealth: 100,
    maxArmor: 100,
    height: 1.8,
    radius: 0.45,
  },

  // ---- Kendaraan (6 tipe) --------------------------------------------------
  vehicles: {
    sedan: { label: 'Sedan', maxSpeed: 132, accel: 16, brake: 30, steer: 1.9, color: 0x7a8a99, price: 0 },
    taxi: { label: 'Taksi', maxSpeed: 126, accel: 15, brake: 30, steer: 1.9, color: 0xf2c200, price: 0 },
    truck: { label: 'Truk', maxSpeed: 96, accel: 9, brake: 22, steer: 1.3, color: 0x4a6a8a, price: 0 },
    sport: { label: 'Sport', maxSpeed: 178, accel: 26, brake: 34, steer: 2.4, color: 0xd21f2c, price: 0 },
    van: { label: 'Van', maxSpeed: 112, accel: 12, brake: 26, steer: 1.6, color: 0x8a7a5c, price: 0 },
    police: { label: 'Polisi', maxSpeed: 152, accel: 22, brake: 34, steer: 2.2, color: 0x1a2a44, price: 0 },
  },
  trafficCount: 22,
  pedestrianCount: 40,
  carConditionMax: 100,

  // ---- Senjata -------------------------------------------------------------
  weapons: [
    { slot: 1, name: 'Tinju', key: 'tinju', damage: 12, range: 2.2, rate: 0.45, mag: 0, reserve: 0, auto: false },
    { slot: 2, name: 'Pistol', key: 'pistol', damage: 22, range: 46, rate: 0.22, mag: 12, reserve: 60, auto: false },
    { slot: 3, name: 'Shotgun', key: 'shotgun', damage: 16, range: 20, rate: 0.85, mag: 6, reserve: 24, auto: false, pellets: 6 },
  ],

  // ---- Wanted --------------------------------------------------------------
  wanted: {
    maxStars: 5,
    decaySecondsPerStar: 14,
    heatStealCar: 1,
    heatPunch: 1,
    heatShoot: 1,
    heatKillPed: 1,
    heatKillCop: 2,
    heliAtStars: 4,
    roadblockAtStars: 4,
  },

  // ---- Misi cerita (10) ----------------------------------------------------
  missions: [
    { name: 'Pulang Kampung', reward: 150, giver: 'Bu Sari' },
    { name: 'Titipan', reward: 300, giver: 'Bu Sari' },
    { name: 'Utang Lama', reward: 450, giver: 'Bu Sari' },
    { name: 'Balapan Liar', reward: 600, giver: 'Bu Sari' },
    { name: 'Rampok Toko', reward: 900, giver: 'Bu Sari' },
    { name: 'Puncak', reward: 1500, giver: 'Bu Sari' },
    { name: 'Kurir Malam', reward: 700, giver: 'Bu Sari' },
    { name: 'Bayangan', reward: 800, giver: 'Bu Sari' },
    { name: 'Heist Pelabuhan', reward: 1200, giver: 'Bu Sari' },
    { name: 'Raja Teluk', reward: 2000, giver: 'Bu Sari' },
  ],

  // ---- Karakter ------------------------------------------------------------
  characters: [
    { name: 'Raka', role: 'Protagonis', color: '#3b82f6', initial: 'R' },
    { name: 'Bu Sari', role: 'Fixer', color: '#f59e0b', initial: 'B' },
    { name: 'Dimas', role: 'Mekanik', color: '#22c55e', initial: 'D' },
    { name: 'Nadia', role: 'Pembalap', color: '#a855f7', initial: 'N' },
    { name: 'Sinta', role: 'Peretas', color: '#92400e', initial: 'S' },
    { name: 'Bimo', role: 'Penjaga', color: '#ef4444', initial: 'B' },
  ],

  // ---- Polisi --------------------------------------------------------------
  police: {
    heliName: 'GARUDA-1',
    unitNames: ['CENDRAWASIH-07', 'JALAK-42', 'BANGAU-18', 'KAKATUA-31', 'GARUDA-02'],
    statuses: ['PURSUIT', 'RAMMING', 'SPOTLIGHT', 'PENGEJARAN'],
  },

  // ---- Radio (3 stasiun, semua lagu orisinal) -------------------------------
  radio: [
    {
      name: 'Pantai FM',
      songs: ['Senja di Teluk', 'Ombak Rindu', 'Lampu Kota'],
    },
    {
      name: 'Teluk Rock',
      songs: ['Aspal Panas', 'Mesin Malam', 'Gas Terus'],
    },
    {
      name: 'Dangdut Pantai',
      songs: ['Goyang Ombak', 'Rindu Pelabuhan', 'Sawah dan Laut'],
    },
  ],

  // ---- Ekonomi -------------------------------------------------------------
  prices: {
    pistolAmmo: 40,
    shotgunShells: 60,
    armorVest: 150,
    repair: 120,
    repaint: 200,
    nosRefill: 80,
  },
  shellsTotal: 24,
  taxiFare: 60,
  rampageDuration: 60,

  // ---- Reputasi ------------------------------------------------------------
  repLevels: [
    { level: 1, name: 'Pemula', need: 0 },
    { level: 2, name: 'Anak Jalanan', need: 300 },
    { level: 3, name: 'Pembalap Teluk', need: 800 },
    { level: 4, name: 'Raja Jalanan', need: 1600 },
    { level: 5, name: 'Legenda Teluk', need: 2600 },
  ],

  // ---- Kamera --------------------------------------------------------------
  camera: {
    fov: 62,
    near: 0.1,
    far: 1400,
    onFootDistance: 7.0,
    onFootHeight: 3.4,
    chaseDistance: 10.5,
    chaseHeight: 4.6,
    lookAhead: 7,
    smooth: 5.0,
  },

  // Dolly sinematik di layar judul: menyusuri avenue CBD dari utara ke
  // selatan, berulang, supaya latar judul selalu menampilkan gedung tinggi,
  // palem, dan neon — bukan Perumahan yang rendah.
  titleDolly: {
    avenueX: 188,
    zMin: -120,
    zMax: 140,
    speed: 3.2,
    height: 4.4,
  },

  // ---- Waktu ---------------------------------------------------------------
  time: {
    startHour: 21,
    dayLengthSeconds: 480,
    nightStart: 19,
    nightEnd: 6,
  },

  // ---- Hujan & cuaca -------------------------------------------------------
  weather: {
    rainDrops: 900,
    rainIntensity: 0.55,
    rainArea: 70,
    rainHeight: 42,
  },

  // ---- Tombol --------------------------------------------------------------
  keys: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    sprint: 'ShiftLeft',
    sprintAlt: 'ShiftRight',
    interact: 'KeyE',
    steal: 'KeyF',
    reload: 'KeyR',
    handbrake: 'Space',
    pause: 'Escape',
    map: 'KeyM',
    mute: 'KeyN',
    enter: 'Enter',
    continue: 'KeyL',
    radioNext: 'KeyR',
  },

  // ---- Save ----------------------------------------------------------------
  saveKeyPrefix: 'teluk-cerah-save-',
  saveSlots: 3,
};
