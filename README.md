# Teluk Cerah

[![Kompetisi make.fun gta6-01](https://img.shields.io/badge/make.fun-gta6--01%20Make%20GTA%206-6c3df4)](https://make.fun/c/gta6-01)
[![Peringkat berbayar](https://img.shields.io/badge/rank-top%20100%20berbayar-f59e0b)](https://make.fun/c/gta6-01)
[![Total hadiah](https://img.shields.io/badge/reward-%241%2C666%20USDC-16a34a)](https://make.fun/c/gta6-01)

**Teluk Cerah** adalah game open-world crime 3D orisinal yang berjalan di
browser. Kamu berperan sebagai **Raka**, perantau yang pulang ke kota pesisir
tropis Teluk Cerah: curi mobil, rampok toko, kabur dari kejaran polisi darat
dan helikopter, selesaikan 10 misi cerita, beli upgrade, dan simpan progresmu.

## Cara main

```bash
node serve.ts
# buka http://localhost:8080
```

- **WASD / panah** — berjalan atau mengemudi
- **E** — masuk / keluar mobil, interaksi toko dan misi
- **Mouse + klik / F** — membidik dan menembak
- **1 / 2 / 3** — ganti senjata (tinju, pistol, shotgun)
- **Shift** — NOS saat mengemudi, lari saat jalan kaki
- **M** — peta kota, **P / Esc** — pause, **R** — ganti stasiun radio

## Fitur

- Kota pesisir prosedural: 7 distrik, dermaga, pantai, mercusuar, pasar ikan,
  jembatan pelabuhan, menara jam, dan taman kota.
- Fasad gedung bervariasi: balkon ber-railing, kanopi, etalase toko menyala
  dengan nama orisinal, atap datar ber-AC dan atap miring terracotta.
- Jalan basah seperti cermin: pantulan neon, lampu jalan, lampu mobil, dan
  sorot helikopter ter-smear di aspal bertekstur dengan genangan.
- Polisi dengan pelat dinas berbeda tiap unit, lightbar merah-biru bergantian,
  formasi mengapit, roadblock, dan helikopter bersorot di wanted tinggi.
- 10 misi cerita berurutan, 4 toko (garasi, senjata, pakaian, warung makan),
  3 stasiun radio synth prosedural, efek suara WebAudio, dan 3 slot save.
- HUD padat: uang, HP, armor, senjata dan amunisi, bintang wanted, jam, misi
  aktif, dispatch polisi, info radio, speedometer + NOS, dan minimap hidup.

## Struktur

- `main.ts` — pengemas dossier make.fun (byte-identik di dua run).
- `game/index.html` — halaman game, HUD, layar judul, pause, dan peta.
- `game/src/` — modul game: config, random, input, render, city, vehicles,
  pedestrians, police, helicopter, player, combat, missions, shops, radio,
  audio, hud, save, shots, main.
- `game/vendor/three.min.js` — Three.js vendored (minified).
- `shoot.mjs` + `shots.json` — pengambil 4 screenshot 1280x800.
