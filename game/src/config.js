// Teluk Cerah — world constants: city layout, districts, missions, shops,
// vehicle types and radio stations. Everything named here is original.

export const CITY = {
  minX: -246, maxX: 246, minZ: -186, maxZ: 150,
  beachZ: 150, seaZ: 176,
  streetsX: [-210, -150, -90, -30, 30, 90, 150, 210],
  avenuesZ: [-150, -90, -30, 30, 90],
  coastRoadZ: 128,
  roadW: 16, coastRoadW: 15,
};

export const DISTRICTS = [
  { name: "Dermaga Lama", x: 150, z: 96, color: "#e2703a" },
  { name: "Pasar Pagi", x: -60, z: 60, color: "#e8b13c" },
  { name: "Kampung Nelayan", x: -168, z: 96, color: "#3fa7a0" },
  { name: "Bukit Menara", x: -150, z: -120, color: "#7d9b4e" },
  { name: "Pusat Kota", x: 0, z: -30, color: "#c6504e" },
  { name: "Kawasan Kaca", x: 150, z: -120, color: "#5b83c4" },
  { name: "Taman Teluk", x: 30, z: -120, color: "#58a05c" },
  { name: "Gudang Selatan", x: 90, z: 60, color: "#9a6a44" },
];

export const SHOP_NAMES = [
  "Warung Senja", "Bengkel Pelita", "Toko Roti Matahari", "Laundry Cerah",
  "Kedai Kopi Dermaga", "Pasar Ikan Pagi", "Butik Ombak", "Toko Senjata Baruna",
  "Apotek Sehat Selalu", "Foto Kilat Bahari", "Toko Buku Karang", "Sate Padang Teluk",
  "Es Teh Melati", "Bengkel Motor Jaya", "Toko Emas Samudra", "Rias Wajah Ayu",
  "Toko Plastik Berkah", "Depot Air Biru", "Kios Pulsa Cepat", "Roti Bakar Malam",
];

export const SHOPS = [
  { id: "garage", kind: "garage", name: "Bengkel Pelita", x: -52, z: 44, color: "#e2703a" },
  { id: "guns", kind: "guns", name: "Toko Senjata Baruna", x: 68, z: -16, color: "#5b83c4" },
  { id: "clothes", kind: "clothes", name: "Butik Ombak", x: -16, z: -76, color: "#c65b9e" },
  { id: "food", kind: "food", name: "Warung Senja", x: 44, z: 104, color: "#e8b13c" },
];

export const VEHICLE_TYPES = [
  { name: "Kijang Kota", kind: "hatch", colors: [0xb8452e, 0x2e6da8, 0xd8d3c8, 0x3f7a4e, 0xe0a32e] },
  { name: "Sedan Arus", kind: "sedan", colors: [0x8a8f96, 0x24303c, 0x6e2430, 0xd8d3c8, 0x2e4a6b] },
  { name: "Pikap Muatan", kind: "pickup", colors: [0xc7c2b4, 0x7a4a28, 0x44586a, 0x9c3226] },
  { name: "Van Wisata", kind: "van", colors: [0xe8e4da, 0x3fa7a0, 0xe2703a, 0x5b83c4] },
];

export const RADIO_STATIONS = [
  { name: "GELOMBANG FM", freq: "98.1", tracks: ["Senja di Dermaga — Larasati Band", "Jalan Pulang — Trio Karang", "Bintang Teluk — Dewa Malam"] },
  { name: "OMBAC DANGDUT", freq: "101.4", tracks: ["Goyang Pesisir — Sari Melati", "Kopi Tubruk — Bang Udin", "Rindu Kampung — Grup Selancar"] },
  { name: "KARANG ROCK", freq: "105.9", tracks: ["Mesin Panas — Bara Api", "Aspal Basah — Roda Liar", "Sirene Jauh — Kapal Pecah"] },
];

export const MISSIONS = [
  { title: "Pulang ke Teluk", giver: "Bibi Ratna", reward: 400, rep: 5,
    intro: "Raka, kau sudah sampai. Ambil mobil tua pamanmu di dermaga, lalu temui aku di warung.",
    stages: [
      { type: "goto", x: 196, z: 118, text: "Pergi ke dermaga lama" },
      { type: "goto", x: 44, z: 100, text: "Temui Bibi Ratna di Warung Senja" } ] },
  { title: "Kotak untuk Pak Harun", giver: "Pak Harun", reward: 650, rep: 6,
    intro: "Ada kotak ikan yang harus sampai ke pasar sebelum bau. Jangan sampai rusak, Nak.",
    stages: [
      { type: "goto", x: -60, z: 66, text: "Ambil kotak di Pasar Pagi" },
      { type: "goto", x: 150, z: 100, text: "Antar kotak ke Dermaga Lama" } ] },
  { title: "Mobil Om Bram", giver: "Om Bram", reward: 900, rep: 8,
    intro: "Mobilku dicuri anak-anak gudang. Ambil kembali, jangan banyak tanya.",
    stages: [
      { type: "goto", x: 96, z: 66, text: "Masuk kawasan Gudang Selatan" },
      { type: "combat", x: 96, z: 60, count: 3, text: "Kalahkan penjaga gudang" },
      { type: "goto", x: -52, z: 48, text: "Bawa mobil ke Bengkel Pelita" } ] },
  { title: "Warung yang Diperas", giver: "Bibi Ratna", reward: 1100, rep: 10,
    intro: "Preman pasar memeras warungku tiap minggu. Malam ini mereka datang lagi.",
    stages: [
      { type: "goto", x: 44, z: 100, text: "Jaga Warung Senja" },
      { type: "combat", x: 44, z: 96, count: 4, text: "Usir para pemeras" } ] },
  { title: "Balapan Jalan Arus", giver: "Sinta", reward: 1500, rep: 12,
    intro: "Anak Jalan Arus menantangmu. Tiga titik, satu putaran, jangan kalah di kota sendiri.",
    stages: [
      { type: "race", points: [[150, 30], [150, -90], [-150, -90], [-150, 30]], text: "Menangkan balapan jalanan" } ] },
  { title: "Paket Tengah Malam", giver: "Pak Harun", reward: 1700, rep: 12,
    intro: "Paket ini tidak boleh dibuka dan tidak boleh terlambat. Polisi sedang rajin malam ini.",
    stages: [
      { type: "goto", x: -168, z: 100, text: "Ambil paket di Kampung Nelayan" },
      { type: "goto", x: 210, z: -30, text: "Antar paket ke Kawasan Kaca", wanted: 2 } ] },
  { title: "Utang Bengkel", giver: "Mekanik Dedi", reward: 2000, rep: 14,
    intro: "Renternir menagih ke bengkel dengan cara kasar. Dedi tidak bisa melawan sendiri.",
    stages: [
      { type: "goto", x: -52, z: 48, text: "Pergi ke Bengkel Pelita" },
      { type: "combat", x: -52, z: 44, count: 5, text: "Kalahkan orang-orang renternir" } ] },
  { title: "Kejar Kurir Liar", giver: "Sinta", reward: 2400, rep: 16,
    intro: "Kurir liar itu membawa kabur uang setoran balapan. Kejar, jangan biarkan keluar kota.",
    stages: [
      { type: "chase", x: 90, z: 30, text: "Kejar dan hentikan kurir liar" },
      { type: "goto", x: 30, z: 34, text: "Kembali ke Jalan Arus" } ] },
  { title: "Gudang Terakhir", giver: "Om Bram", reward: 3000, rep: 20,
    intro: "Semua benang kusut kota ini bermuara di satu gudang. Selesaikan malam ini.",
    stages: [
      { type: "goto", x: 96, z: 66, text: "Menyusup ke Gudang Selatan" },
      { type: "combat", x: 96, z: 60, count: 6, text: "Kalahkan gembong gudang dan anak buahnya" } ] },
  { title: "Fajar di Pelabuhan", giver: "Bibi Ratna", reward: 5000, rep: 30,
    intro: "Kapal terakhir berangkat saat fajar. Antarkan aku, dan kota ini jadi milikmu, Raka.",
    stages: [
      { type: "goto", x: 44, z: 100, text: "Jemput Bibi Ratna" },
      { type: "goto", x: 210, z: 118, text: "Capai pelabuhan sebelum fajar", wanted: 3 } ] },
];

export const DISPATCH_LINES = [
  "Unit 07, tersangka terlihat di kawasan dermaga.",
  "Semua unit, kendaraan merah melaju ke arah timur.",
  "Unit 12 bergerak mengapit dari jalan pesisir.",
  "Helikopter udara satu sudah di atas lokasi.",
  "Tersangka bersenjata, jaga jarak dan tunggu aba-aba.",
  "Blokade disiapkan di perempatan Jalan Arus.",
  "Unit 03 melaporkan tersangka masuk Pusat Kota.",
  "Perhatian: warga diminta menjauh dari lokasi kejar.",
];

export const HERO_PLATE = "TC 2407 R";
export const POLICE_PLATE_PREFIX = "DIN";
