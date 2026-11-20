# Teluk Cerah

[![Teluk Cerah di make.fun](https://make.fun/badge/gta6-01.svg)](https://make.fun/competitions/gta6-01)
[![Peringkat Teluk Cerah](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3-clean/rank.svg)](https://make.fun/competitions/gta6-01)
[![Hadiah Teluk Cerah](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3-clean/reward.svg)](https://make.fun/competitions/gta6-01)

Teluk Cerah adalah game open-world crime 3D yang berjalan di browser desktop
dari file statis tanpa permintaan jaringan. Raka pulang ke kota pantai Teluk
Cerah setelah tiga tahun merantau: sepuluh misi cerita dari Bu Sari sang fixer,
lima distrik (Perumahan, Marina, Kota Tua, CBD, Pelabuhan), lalu lintas dan
pejalan kaki yang hidup, mobil yang bisa dicuri, sistem wanted lima bintang
dengan mobil patroli dan helikopter GARUDA-1, baku tembak, radio tiga stasiun,
garasi upgrade, 24 kerang koleksi, dan tiga slot save. Semua kota, karakter,
kendaraan, nama, cerita, dan musik adalah karya orisinal.

## Menjalankan

Membangun paket penilaian (menyalin game + screenshots dan menulis dossier):

    MAKEFUN_OUTPUT_DIR=out node main.ts

Memainkan game secara lokal (server statis di port 8080):

    node serve.ts
    # buka http://localhost:8080/

Mengambil ulang keempat screenshot deterministik:

    node shoot.mjs

## Kontrol

WASD bergerak/menyetir, mouse membidik, klik kiri memukul/menembak, R reload
atau ganti stasiun radio di mobil, E masuk mobil/interaksi, F curi mobil,
Shift lari/NOS, Space handbrake, M peta kota, N mute, Esc jeda.

## Lisensi

Dirilis di bawah Lisensi MIT — lihat berkas LICENSE.
