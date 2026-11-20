// Program entri Teluk Cerah: validasi, salin game + screenshots, tulis dossier.
import { createHash } from "node:crypto";
import {
  cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync,
  rmSync, statSync, writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const rootDir = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};
const INDEX_MAX = 1048576;
const DOSSIER_MAX = 1572864;

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function walk(dir: string, base: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (entry.isSymbolicLink()) fail(`tautan simbolik tidak diizinkan di game: ${rel}`);
    if (entry.isDirectory()) walk(full, base, acc);
    else if (entry.isFile()) acc.push(rel);
    else fail(`entri tidak dikenal di game: ${rel}`);
  }
  return acc;
}

function imageKind(path: string): string | null {
  const bytes = readFileSync(path);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  return null;
}

const gameDir = join(rootDir, "game");
const shotsDir = join(rootDir, "screenshots");
if (!existsSync(gameDir) || !statSync(gameDir).isDirectory()) fail("folder game tidak ada");

const gameFiles = walk(gameDir, gameDir, []).sort();
if (gameFiles.length > CAPS.game_max_files) fail(`game berisi ${gameFiles.length} entri, melebihi ${CAPS.game_max_files}`);
let gameBytes = 0;
for (const rel of gameFiles) {
  if (Buffer.byteLength(rel, "utf8") > CAPS.game_path_max_bytes) fail(`path game terlalu panjang: ${rel}`);
  gameBytes += statSync(join(gameDir, rel)).size;
}
if (gameBytes > CAPS.game_max_bytes) fail(`total game ${gameBytes} byte melebihi ${CAPS.game_max_bytes}`);

const indexPath = join(gameDir, "index.html");
if (!existsSync(indexPath)) fail("game/index.html tidak ada");
if (statSync(indexPath).size > INDEX_MAX) fail(`game/index.html melebihi ${INDEX_MAX} byte`);

if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) fail("folder screenshots tidak ada");
const shotFiles = readdirSync(shotsDir).filter((name) => {
  const full = join(shotsDir, name);
  return lstatSync(full).isFile() && !lstatSync(full).isSymbolicLink();
}).sort();
if (shotFiles.length < 3 || shotFiles.length > 4) fail(`screenshots harus berisi 3-4 gambar, ditemukan ${shotFiles.length}`);
for (const name of shotFiles) {
  const full = join(shotsDir, name);
  if (!imageKind(full)) fail(`screenshot bukan JPEG/PNG: ${name}`);
  if (statSync(full).size > CAPS.screenshots.max_bytes) fail(`screenshot melebihi ${CAPS.screenshots.max_bytes} byte: ${name}`);
}

const shotsJsonPath = join(rootDir, "shots.json");
if (existsSync(shotsJsonPath)) {
  const declared = JSON.parse(readFileSync(shotsJsonPath, "utf8"));
  for (const entry of declared.shots || []) {
    if (!shotFiles.includes(entry.file)) fail(`shots.json menyebut file yang tidak ada: ${entry.file}`);
  }
}

const rootResolved = resolve(rootDir);
const fsRoot = resolve(sep);
if (outDir === rootResolved) fail("folder output tidak boleh sama dengan root repo");
if (outDir === fsRoot) fail("folder output tidak boleh root sistem file");
if (outDir.startsWith(gameDir + sep) || outDir.startsWith(shotsDir + sep)) {
  fail("folder output tidak boleh berada di dalam game/ atau screenshots/");
}

mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(gameDir, join(outDir, "game"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

const copiedGame = walk(join(outDir, "game"), join(outDir, "game"), []).sort();
if (copiedGame.length !== gameFiles.length) fail("salinan game tidak lengkap");
const copiedShots = readdirSync(join(outDir, "screenshots")).sort();
for (const name of shotFiles) {
  const a = statSync(join(shotsDir, name)).size;
  const b = statSync(join(outDir, "screenshots", name)).size;
  if (a !== b) fail(`ukuran salinan screenshot berbeda: ${name}`);
}

const dossierBytes = buildDossier(outDir, CAPS);
const dossierPath = join(outDir, "dossier.json");
writeFileSync(dossierPath, dossierBytes);

const written = readFileSync(dossierPath);
if (!written.equals(Buffer.from(dossierBytes))) fail("dossier tertulis tidak sama dengan hasil buildDossier");
if (written.length > DOSSIER_MAX) fail(`dossier melebihi ${DOSSIER_MAX} byte`);
let parsed: Record<string, unknown>;
try { parsed = JSON.parse(written.toString("utf8")); } catch { fail("dossier bukan JSON valid"); }
for (const key of ["cover", "images", "schema", "text"]) {
  if (!(key in parsed)) fail(`dossier tidak memuat kunci ${key}`);
}
if (!Array.isArray(parsed.images) || parsed.images.length !== shotFiles.length) {
  fail("jumlah images pada dossier tidak sama dengan jumlah screenshot");
}
if (typeof parsed.text !== "string" || parsed.text.length === 0) fail("text dossier kosong");

const sha = createHash("sha256").update(written).digest("hex");
console.log(`Output: ${outDir}`);
console.log(`Game: ${gameFiles.length} file, ${gameBytes} byte`);
console.log(`Screenshots: ${shotFiles.join(", ")}`);
console.log(`Dossier: ${written.length} byte, sha256 ${sha}`);
