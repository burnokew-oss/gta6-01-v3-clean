# Teluk Cerah

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3-clean/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3-clean/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Game crime open-world 3D yang berjalan di browser desktop dari file statis,
tanpa unduhan dan tanpa koneksi internet saat dimainkan. Kamu pulang ke kota
pantai Teluk Cerah setelah tiga tahun merantau, dan kota itu langsung
menarikmu kembali ke jalanan: sepuluh misi cerita, kejar-kejaran polisi,
helikopter di atas kepala, dan radio yang tidak pernah diam. Semua nama,
karakter, tempat, dan cerita di game ini orisinal — bukan dari game mana pun.

## Fitur

- Kota pantai 3D dengan lima distrik: Perumahan, Marina, Kota Tua, CBD, dan Pelabuhan
- Jalan kaki dan menyetir, dengan lalu lintas, pejalan kaki, dan mobil yang bisa dicuri
- Wanted level 0–5, polisi jalan kaki dan mobil patroli, roadblock, dan helikopter GARUDA-1
- Sepuluh misi cerita bersama Bu Sari, ditambah kerja taksi, rampage, dan 24 kerang Teluk
- Combat jarak dekat, pistol, dan shotgun, lengkap dengan efek tembakan dan damage
- HUD lengkap: uang, health, armor, senjata, bintang wanted, jam, minimap, dan speedometer
- Tiga stasiun radio orisinal, termasuk Pantai FM
- Siklus siang dan malam, hujan, dan jalan basah yang memantulkan neon
- Garasi dengan upgrade, toko senjata, safehouse, dan tiga slot save

## Cara bermain

Mulai game baru dari layar judul, lalu ikuti marker kuning menuju Bu Sari.
Selesaikan misi satu demi satu untuk membuka misi berikutnya dan menaikkan
reputasi. Uang hasil misi bisa dipakai untuk senjata dan upgrade mobil di
garasi. Kumpulkan kerang Teluk yang tersebar di seluruh kota. Kalau bintang
wanted naik, sembunyilah sampai polisi kehilangan jejakmu — atau kabur
sekencang mungkin.

## Screenshot

Empat adegan di folder `screenshots/` adalah render asli dari game ini,
diambil dengan seed tetap sehingga hasilnya sama setiap kali:

1. **Kejar-kejaran** — mobil sport merah dikejar polisi dan helikopter di CBD.
2. **Baku tembak** — Raka menghadapi geng di depan rambu PASAR MALAM.
3. **Peta** — peta layar penuh dengan misi, statistik, dan legenda.
4. **Layar judul** — enam karakter dan panel cara bermain.

## Kontrol

| Tombol | Fungsi |
| --- | --- |
| WASD | Jalan / menyetir |
| Mouse | Membidik, klik kiri menyerang |
| Shift | Lari / NOS saat menyetir |
| E | Masuk mobil, interaksi, lanjut dialog |
| F | Curi mobil terdekat |
| R | Reload / ganti stasiun radio di mobil |
| Space | Handbrake |
| M | Peta kota |
| N | Mute |
| Esc | Pause |

## Menjalankan lokal

Butuh Node.js 22 atau yang lebih baru, dan Chrome desktop untuk bermain.

```sh
node serve.ts
```

Lalu buka `http://localhost:8080` di Chrome desktop. Untuk membangun paket
entri, jalankan `MAKEFUN_OUTPUT_DIR=out node main.ts`. Untuk mengambil ulang
keempat screenshot, jalankan `node shoot.mjs`.

## Lisensi

MIT — lihat file `LICENSE`.
