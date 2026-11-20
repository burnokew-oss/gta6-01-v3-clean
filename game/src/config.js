// config.js — konstanta dunia Teluk Cerah: kota, distrik, misi, toko,
// kendaraan, radio, dan pelat nomor orisinal untuk tiap peran kendaraan.
export const WORLD = {
  seed: 240208,
  blockSize: 34,
  roadWidth: 11,
  gridHalf: 3,
  seaZ: 128,
  dayLength: 240,
  startHour: 17.4,
};

export const DISTRICTS = [
  { name: "Dermaga Timur", x: 68, z: 96, color: "#2dd4bf" },
  { name: "Pasar Ikan Pagi", x: 30, z: 62, color: "#fbbf24" },
  { name: "Pantai Melati", x: -52, z: 96, color: "#38bdf8" },
  { name: "Kota Lama", x: -62, z: 10, color: "#fb923c" },
  { name: "Taman Cerah", x: 0, z: 0, color: "#4ade80" },
  { name: "Bukit Pandang", x: -70, z: -72, color: "#c084fc" },
  { name: "Pelabuhan Utara", x: 62, z: -78, color: "#f472b6" },
];

export const SHOP_SIGNS = [
  "Warung Senja", "Bengkel Pelita", "Toko Roti Matahari", "Laundry Cerah",
  "Kedai Kopi Dermaga", "Pasar Ikan Pagi", "Toko Bunga Melati",
  "Warung Nasi Bu Tini", "Bengkel Arus", "Toko Kaca Pandang",
  "Kedai Es Kelapa", "Penjahit Rapi", "Toko Buku Ombak", "Salon Ayu",
];

export const SHOPS = [
  { id: "garasi", name: "Garasi Pelita", kind: "garage", x: 17, z: 40, color: "#f97316" },
  { id: "senjata", name: "Toko Senjata Arus", kind: "weapon", x: -51, z: -28, color: "#ef4444" },
  { id: "pakaian", name: "Butik Melati", kind: "clothes", x: 44, z: -45, color: "#a855f7" },
  { id: "warung", name: "Warung Senja", kind: "food", x: -20, z: 74, color: "#22c55e" },
];

export const VEHICLES = [
  { id: "hero", name: "Kijang Merah Raka", color: 0xd92323, plate: "TC 2402 RA", topSpeed: 46, accel: 22 },
  { id: "sedan", name: "Sedan Arus", color: 0x3b82f6, plate: "", topSpeed: 36, accel: 16 },
  { id: "pickup", name: "Pickup Ombak", color: 0xf59e0b, plate: "", topSpeed: 32, accel: 14 },
  { id: "hatch", name: "Hatch Pasir", color: 0x10b981, plate: "", topSpeed: 34, accel: 15 },
  { id: "van", name: "Van Kargo Dermaga", color: 0xe2e8f0, plate: "", topSpeed: 28, accel: 12 },
];

export const POLICE_PLATES = ["DINAS VII-1107", "DINAS VII-2214", "DINAS VII-3319", "DINAS VII-4426"];
export const TRAFFIC_PLATE_LETTERS = ["AB", "CD", "EF", "GH", "JK", "LM", "NP", "QR"];

export const RADIO_STATIONS = [
  { id: "ombak", name: "Radio Ombak 91.2", tracks: ["Senja di Dermaga", "Arus Balik", "Lampu Pelabuhan"] },
  { id: "melati", name: "Melati FM 98.7", tracks: ["Bunga di Aspal", "Kopi Pagi Raka", "Jalan Pulang"] },
  { id: "pandang", name: "Pandang Wave 104.3", tracks: ["Bukit Senja", "Neon di Genangan", "Kejar Terakhir"] },
];

export const MISSIONS = [
  { title: "Pulang ke Teluk Cerah", giver: "Bu Tini", goal: "Ambil mobil merahmu di dermaga", reward: 150, rep: 5, dialog: "Raka! Mobil lamamu masih di dermaga. Ambil, lalu kita bicara bisnis." },
  { title: "Paket untuk Pak Haji", giver: "Pak Haji Umar", goal: "Antar paket ke Pasar Ikan Pagi", reward: 220, rep: 6, dialog: "Paket ini harus sampai sebelum pasar tutup. Jangan sampai basah." },
  { title: "Mobil Pinjaman", giver: "Dedi Bengkel", goal: "Curi sedan biru di Kota Lama dan bawa ke Garasi Pelita", reward: 300, rep: 8, dialog: "Ada sedan biru nganggur di Kota Lama. Pinjam dulu, cat ulang belakangan." },
  { title: "Kas Warung Senja", giver: "Sari", goal: "Rampok kasir Warung Senja lalu kabur dari polisi", reward: 420, rep: 10, dialog: "Warung itu menunggak setoran. Ambil kasnya, jangan lukai siapa pun." },
  { title: "Kejar Pencuri Perahu", giver: "Bu Tini", goal: "Kejar dan hentikan mobil pencuri di jembatan pelabuhan", reward: 520, rep: 12, dialog: "Pencuri itu kabur ke jembatan! Jangan biarkan dia menyeberang." },
  { title: "Baku Tembak di Gudang", giver: "Pak Haji Umar", goal: "Habisi 5 penjaga gudang di Pelabuhan Utara", reward: 700, rep: 15, dialog: "Gudangku diambil alih. Bersihkan, tapi hati-hati, mereka bersenjata." },
  { title: "Balapan Jalan Melati", giver: "Reno", goal: "Menangi balapan jalanan menyusuri Pantai Melati", reward: 650, rep: 14, dialog: "Tiga putaran pesisir. Yang kalah traktir kopi sebulan." },
  { title: "Antar Dokter Lala", giver: "Sari", goal: "Antar Dokter Lala ke klinik sebelum waktu habis", reward: 580, rep: 12, dialog: "Ada warga terluka di Bukit Pandang. Jemput Dokter Lala sekarang." },
  { title: "Roadblock di Bukit", giver: "Dedi Bengkel", goal: "Lolos dari roadblock polisi di Bukit Pandang", reward: 800, rep: 18, dialog: "Polisi menutup bukit malam ini. Cari celah, jangan berhenti." },
  { title: "Malam Terakhir di Pelabuhan", giver: "Bu Tini", goal: "Ambil koper di pelabuhan dan antar ke mercusuar", reward: 1200, rep: 25, dialog: "Satu pekerjaan terakhir, Raka. Koper di pelabuhan, antar ke mercusuar." },
];

export const WEAPONS = [
  { id: "tinju", name: "Tinju", damage: 12, ammo: -1, rate: 0.34, range: 2.4 },
  { id: "pistol", name: "Pistol", damage: 26, ammo: 48, rate: 0.26, range: 42 },
  { id: "shotgun", name: "Shotgun", damage: 55, ammo: 18, rate: 0.85, range: 26 },
];

export const PALETTE = {
  sky: 0x8fd8ff, sun: 0xffe3a3, fog: 0xf6d9b8, sea: 0x1e9bb8,
  sand: 0xf2ddae, grass: 0x69b96a, asphalt: 0x2e3138, sidewalk: 0xb9b3a4,
};
