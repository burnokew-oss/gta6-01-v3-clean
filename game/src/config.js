// config.js — konstanta dunia Teluk Cerah: kota, distrik, misi, toko,
// kendaraan, radio. Semua nama orisinal.
export const WORLD = {
  seed: 20261120,
  citySize: 460,          // meter, square play area
  blockSize: 46,          // grid pitch of streets
  roadWidth: 13,
  seaLevel: 0,
  shoreZ: 150,            // z beyond this is beach then sea
};

export const DISTRICTS = [
  { name: "Dermaga Pagi", x: 0, z: 120, color: "#ffb340" },
  { name: "Pasar Ikan", x: -120, z: 90, color: "#ff7a59" },
  { name: "Bukit Melati", x: -130, z: -110, color: "#7ee08a" },
  { name: "Pusat Cerah", x: 0, z: 0, color: "#ffd94d" },
  { name: "Taman Palma", x: 120, z: -40, color: "#5ad1c8" },
  { name: "Pelabuhan Timur", x: 150, z: 110, color: "#6ab0ff" },
];

export const SHOP_SIGNS = [
  "Warung Senja", "Bengkel Pelita", "Toko Roti Matahari", "Laundry Cerah",
  "Kedai Kopi Dermaga", "Pasar Ikan Pagi", "Toko Bunga Melati", "Foto Cerah Kilat",
  "Apotek Sehat Selalu", "Barber Bang Jali", "Sate Padang Ombak", "Es Teh Segar",
];

export const MISSIONS = [
  { id: "m1", title: "Pulang ke Teluk", giver: "Bibi Ratna", reward: 150, rep: 2, text: "Ambil mobil pinjaman di garasi Bibi Ratna dan antar ke Warung Senja." },
  { id: "m2", title: "Roti untuk Pasar", giver: "Pak Darma", reward: 220, rep: 3, text: "Curi van roti yang terparkir di Toko Roti Matahari, antar ke Pasar Ikan." },
  { id: "m3", title: "Kejar Pencuri Perahu", giver: "Sersan Laksmi", reward: 350, rep: 4, text: "Kejar dan hentikan pencuri yang kabur ke arah pelabuhan." },
  { id: "m4", title: "Toko Emas Kala Senja", giver: "Orang Asing", reward: 500, rep: 5, text: "Rampok toko emas di Pusat Cerah lalu kabur dari polisi." },
  { id: "m5", title: "Paket untuk Kapten", giver: "Kapten Bram", reward: 420, rep: 4, text: "Antar paket tertutup ke dermaga sebelum waktu habis." },
  { id: "m6", title: "Balapan Jalan Palma", giver: "Dito", reward: 600, rep: 6, text: "Menangkan balapan jalanan melewati 6 gerbang di Taman Palma." },
  { id: "m7", title: "Gudang Senyap", giver: "Bibi Ratna", reward: 750, rep: 7, text: "Masuki gudang pelabuhan dan kalahkan penjaga di baku tembak." },
  { id: "m8", title: "Uang Kaget", giver: "Pak Darma", reward: 900, rep: 8, text: "Ambil koper uang di menara jam dan antar ke Bukit Melati." },
  { id: "m9", title: "Malam di Atas Kota", giver: "Dito", reward: 1100, rep: 9, text: "Lompat dari atap ke atap dan capai mercusuar sebelum fajar." },
  { id: "m10", title: "Teluk Terakhir", giver: "Kapten Bram", reward: 2000, rep: 15, text: "Pertarungan penutup di Pelabuhan Timur. Rebut kapal dan berlayar." },
];

export const VEHICLES = [
  { name: "Kijang Bayu", topSpeed: 38, accel: 14, price: 0, color: 0xb8b0a4 },
  { name: "Cerah Sportiva", topSpeed: 55, accel: 22, price: 1200, color: 0xd21f2e },
  { name: "Ombak Pickup", topSpeed: 42, accel: 15, price: 500, color: 0x2e7fc2 },
  { name: "Palma Roadster", topSpeed: 62, accel: 26, price: 2600, color: 0xff8a1e },
  { name: "Van Roti Darma", topSpeed: 34, accel: 11, price: 300, color: 0xf2ead8 },
];

export const RADIO_STATIONS = [
  { name: "Gelombang 98.2", genre: "Synth Senja", tracks: ["Mentari di Teluk", "Asap Kopi Pagi", "Jalan Palma"] },
  { name: "Ombak FM 104.7", genre: "Dangdut Elektronik", tracks: ["Goyang Dermaga", "Ikan Bakar Cinta", "Perahu Pulang"] },
  { name: "Cerah Klasik 89.1", genre: "Keroncong Modern", tracks: ["Melati Putih", "Kala Senja Turun", "Teluk Cerah Abadi"] },
];

export const WEAPONS = [
  { id: "fist", name: "Tinju", damage: 8, rate: 0.35, ammo: Infinity, range: 2.2 },
  { id: "pistol", name: "Pistol P9", damage: 22, rate: 0.28, ammo: 60, range: 60 },
  { id: "shotgun", name: "Shotgun Laras", damage: 55, rate: 0.9, ammo: 18, range: 26 },
];

export const GARAGE_UPGRADES = [
  { id: "engine", name: "Mesin Turbo Senja", price: 800, desc: "+20% kecepatan puncak" },
  { id: "nos", name: "NOS Ombak Biru", price: 650, desc: "Semburan nitro dengan tombol Shift" },
  { id: "armor", name: "Bodi Baja Ringan", price: 700, desc: "+50 armor kendaraan" },
  { id: "paint", name: "Cat Merah Glossy Pekat", price: 250, desc: "Warna hero pekat mengkilap" },
];
