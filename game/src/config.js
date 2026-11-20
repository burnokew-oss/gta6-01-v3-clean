// Konfigurasi pusat Teluk Cerah — semua angka dan nama tinggal di sini.
export const CONFIG = {
  worldSize: 420,
  avenueXs: [-168, -84, 0, 84, 168],
  streetZs: [-168, -84, 0, 84, 168],
  roadWidth: 15,
  sidewalkWidth: 3.4,
  districts: [
    { name: "Perumahan", cx: 0, cz: -150, color: 0x8a6f4d, roof: 0x6e4a3a },
    { name: "Marina", cx: -150, cz: 0, color: 0x4d7a8a, roof: 0x3a5e6e },
    { name: "Kota Tua", cx: -84, cz: 84, color: 0x9a7a52, roof: 0x74563c },
    { name: "CBD", cx: 92, cz: -20, color: 0x5d6f9a, roof: 0x44557c },
    { name: "Pelabuhan", cx: 40, cz: 160, color: 0x707a6a, roof: 0x55604e },
  ],
  playerSpeed: 7.2,
  playerRunSpeed: 11.5,
  carTypes: {
    sedan: { label: "Sedan", topSpeed: 34, accel: 13, grip: 3.2, colors: [0xb8bcc4, 0x3a6ea8, 0x707880, 0x8a2f35] },
    taksi: { label: "Taksi", topSpeed: 32, accel: 12, grip: 3.2, colors: [0xf2b821] },
    truk: { label: "Truk Pelabuhan", topSpeed: 24, accel: 8, grip: 2.4, colors: [0x7a8894, 0x9aa4ac] },
    sport: { label: "Sport", topSpeed: 52, accel: 21, grip: 4.1, colors: [0xe84393, 0xd92632, 0xe86a17] },
    van: { label: "Van", topSpeed: 27, accel: 9.5, grip: 2.7, colors: [0xd8d4c8, 0x5f7a6a] },
    polisi: { label: "Patroli", topSpeed: 44, accel: 17, grip: 3.8, colors: [0xf2f3f5] },
  },
  radioStations: [
    { name: "Pantai FM", freq: "98.1", songs: ["Senja di Teluk", "Lagu Raya", "Ombak Pulang"] },
    { name: "Ombak FM", freq: "101.4", songs: ["Riak Malam", "Dara Pesisir", "Pasang Surut"] },
    { name: "Ceria FM", freq: "95.7", songs: ["Pulang Senja", "Kopi Pagi", "Jalan Kenanga"] },
  ],
  shopNames: ["WARUNG SENJA", "KOPI TELUK", "SATE TELUK", "BAKSO TELUK", "ES KELAPA MUDA", "TOKO BERKAH", "LAUNDRY CERAH", "BENGKEL JAYA", "HOTEL TELUK", "TOKO ROTI LESTARI", "WARTEG BAHARI", "APOTEK SEHAT"],
  shellTotal: 24,
  startCash: 1250,
  keys: { forward: "KeyW", back: "KeyS", left: "KeyA", right: "KeyD" },
};
