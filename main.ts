// Teluk Cerah 3D — entrypoint penyerahan gta6-01 (Node 22, stdlib saja).
// Ronde 3 v3-3d (18 Nov 2026): jalan cermin neon, mobil glossy berdetail,
// fasad toko hidup, skyline + spotlight tajam, HUD ramping mode shot.
//
// Tugas file ini hanya satu: memeriksa paket entri sudah lengkap dan
// sesuai batas, lalu menyalin game/ + screenshots/ ke direktori output
// dan menulis dossier.json lewat library make.fun yang sudah di-vendor.
//
// Game-nya sendiri statis dan offline: game/index.html + modul ES di
// game/src/ + Three.js r149 di game/vendor/, tanpa satu pun request
// jaringan saat dimainkan.
//
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(here, 'game');
const shotsDir = join(here, 'screenshots');
const GAME_MAX_FILES = 993;
const GAME_MAX_BYTES = 50331648;
const INDEX_MAX_BYTES = 1048576;
const SHOT_MAX_BYTES = 262144;

function fail(message) {
  throw new Error(message);
}

// Pemeriksaan 1: entrypoint game ada, di bawah 1 MiB, dan benar-benar
// memuat judul + modul utama Teluk Cerah (bukan file kosong/placeholder).
const indexPath = join(gameDir, 'index.html');
if (!existsSync(indexPath)) fail('game/index.html tidak ditemukan — entri belum lengkap');
const indexBytes = statSync(indexPath).size;
if (indexBytes > INDEX_MAX_BYTES) fail(`game/index.html ${indexBytes} byte — melebihi 1 MiB`);
const indexText = readFileSync(indexPath, 'utf8');
for (const needle of ['TELUK CERAH', './src/main.js', './vendor/three.min.js']) {
  if (!indexText.includes(needle)) fail(`game/index.html tidak memuat ${needle} — entrypoint tidak lengkap`);
}

// Pemeriksaan 2: Three.js r149 ter-vendor dan berukuran wajar (game
// tidak boleh memuat library apa pun dari jaringan).
const threePath = join(gameDir, 'vendor', 'three.min.js');
if (!existsSync(threePath)) fail('game/vendor/three.min.js tidak ditemukan — unduh Three.js r149 dulu');
const threeBytes = statSync(threePath).size;
if (threeBytes < 50000) fail(`game/vendor/three.min.js hanya ${threeBytes} byte — file Three.js tampak tidak lengkap`);

// Pemeriksaan 3: tepat 4 screenshot JPG, masing-masing <= 256 KiB dan
// benar-benar diawali magic byte JPEG (FF D8), bukan file teks.
if (!existsSync(shotsDir)) fail('screenshots/ tidak ditemukan');
const shots = readdirSync(shotsDir).filter((f) => f.toLowerCase().endsWith('.jpg')).sort();
if (shots.length !== 4) fail(`butuh tepat 4 screenshot JPG, ketemu ${shots.length}: ${shots.join(', ')}`);
for (const shot of shots) {
  const full = join(shotsDir, shot);
  const size = statSync(full).size;
  if (size > SHOT_MAX_BYTES) fail(`screenshot ${shot} ${size} byte — melebihi 256 KiB`);
  if (size < 10000) fail(`screenshot ${shot} hanya ${size} byte — tampak kosong/rusak`);
  const head = readFileSync(full).subarray(0, 2);
  if (head[0] !== 0xff || head[1] !== 0xd8) fail(`screenshot ${shot} bukan file JPEG yang sah`);
}

// Pemeriksaan 4: modul inti game ada semua (render, kota, HUD, shot).
for (const mod of ['render.js', 'city.js', 'hud.js', 'shots.js', 'vehicles.js', 'police.js', 'helicopter.js', 'main.js']) {
  if (!existsSync(join(gameDir, 'src', mod))) fail(`game/src/${mod} tidak ditemukan — modul inti hilang`);
}

// Pemeriksaan 5: game/ di bawah batas file (993) dan byte (48 MiB).
function measure(dir) {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = measure(full);
      files += sub.files;
      bytes += sub.bytes;
    } else {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}
const gameSize = measure(gameDir);
if (gameSize.files > GAME_MAX_FILES) fail(`game/ berisi ${gameSize.files} file — melebihi 993`);
if (gameSize.bytes > GAME_MAX_BYTES) fail(`game/ berisi ${gameSize.bytes} byte — melebihi 48 MiB`);

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// Batas-batas dari reference/gate.json: hanya text_max_bytes yang
// membentuk byte dossier; sisanya menolak entri yang scorer akan tolak
// (lebih dari 4 screenshot atau satu di atas 256 KiB; lebih dari 993
// file di game/ atau 48 MiB total, atau path di bawah game/ lebih dari
// 1000 byte).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`Teluk Cerah diserahkan: game/ ${gameSize.files} file ${gameSize.bytes} byte, 4 screenshot, index.html ${indexBytes} byte, Three.js ${threeBytes} byte.`);
