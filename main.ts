// Teluk Cerah — program entri.
// Menyalin folder game dan screenshots ke folder output, lalu menulis
// dossier.json di sana memakai helper buildDossier dari library game
// yang di-vendor. Hanya memakai standard library Node 22.
//
// Pemakaian:  MAKEFUN_OUTPUT_DIR=out node main.ts
// Tanpa variabel lingkungan, output ditulis ke /output (folder output
// sistem). Program menolak entri yang melanggar batas dengan pesan jelas
// dan berhenti dengan kode keluar 1. Program ini deterministik: dua
// jalan dengan masukan yang sama menulis byte yang sama.
import { buildDossier } from "./vendor/makefun-game.ts";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const TEXT_CAP_BYTES = 163840;
const MIN_SHOT_COUNT = 3;
const MAX_SHOT_COUNT = 4;
const MAX_SHOT_BYTES = 262144;
const MAX_GAME_ENTRIES = 993;
const MAX_GAME_BYTES = 50331648;
const MAX_GAME_PATH_BYTES = 1000;
const MAX_INDEX_BYTES = 1048576;
const MAX_DOSSIER_BYTES = 1572864;
const DOSSIER_KEYS = ["cover", "images", "schema", "text"];

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function byteLength(text: string): number {
  return Buffer.byteLength(text, "utf8");
}

interface WalkedEntry {
  relative: string;
  absolute: string;
  isDirectory: boolean;
  bytes: number;
}

function walkTree(rootDir: string): WalkedEntry[] {
  const found: WalkedEntry[] = [];
  const visit = (dir: string): void => {
    const names = fs.readdirSync(dir).sort();
    for (const name of names) {
      const absolute = path.join(dir, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        fail(`tautan simbolik tidak diizinkan: ${toPosix(path.relative(repoRoot, absolute))}`);
      }
      const relative = toPosix(path.relative(rootDir, absolute));
      if (stat.isDirectory()) {
        found.push({ relative, absolute, isDirectory: true, bytes: 0 });
        visit(absolute);
      } else if (stat.isFile()) {
        found.push({ relative, absolute, isDirectory: false, bytes: stat.size });
      } else {
        fail(`jenis file tidak biasa di ${toPosix(path.relative(repoRoot, absolute))}`);
      }
    }
  };
  visit(rootDir);
  return found;
}

function copyTree(entries: WalkedEntry[], targetRoot: string): void {
  for (const entry of entries) {
    const target = path.join(targetRoot, entry.relative);
    if (entry.isDirectory) {
      fs.mkdirSync(target, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(entry.absolute, target);
    }
  }
}

function checkGameFolder(gameDir: string): WalkedEntry[] {
  if (!fs.existsSync(gameDir) || !fs.statSync(gameDir).isDirectory()) {
    fail(`folder game tidak ditemukan di ${gameDir}`);
  }
  const entries = walkTree(gameDir);
  if (entries.length > MAX_GAME_ENTRIES) {
    fail(`game/ berisi ${entries.length} file dan folder, melebihi batas ${MAX_GAME_ENTRIES}`);
  }
  let total = 0;
  let indexSeen = false;
  for (const entry of entries) {
    if (byteLength(entry.relative) > MAX_GAME_PATH_BYTES) {
      fail(`path game terlalu panjang (${byteLength(entry.relative)} byte): ${entry.relative}`);
    }
    if (!entry.isDirectory) {
      total += entry.bytes;
      if (entry.relative === "index.html") {
        indexSeen = true;
        if (entry.bytes > MAX_INDEX_BYTES) {
          fail(`game/index.html ${entry.bytes} byte, melebihi batas ${MAX_INDEX_BYTES}`);
        }
      }
    }
  }
  if (!indexSeen) {
    fail("game/index.html tidak ditemukan");
  }
  if (total > MAX_GAME_BYTES) {
    fail(`game/ berisi ${total} byte, melebihi batas ${MAX_GAME_BYTES}`);
  }
  return entries;
}

function checkShotFolder(shotDir: string): WalkedEntry[] {
  if (!fs.existsSync(shotDir) || !fs.statSync(shotDir).isDirectory()) {
    fail(`folder screenshots tidak ditemukan di ${shotDir}`);
  }
  const files = walkTree(shotDir).filter((entry) => !entry.isDirectory);
  const visible = files.filter((entry) => !path.basename(entry.relative).startsWith("."));
  if (visible.length < MIN_SHOT_COUNT || visible.length > MAX_SHOT_COUNT) {
    fail(`screenshots/ berisi ${visible.length} gambar, harus ${MIN_SHOT_COUNT} sampai ${MAX_SHOT_COUNT}`);
  }
  for (const entry of visible) {
    const lower = entry.relative.toLowerCase();
    if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png")) {
      fail(`screenshot bukan JPEG atau PNG: ${entry.relative}`);
    }
    if (entry.bytes > MAX_SHOT_BYTES) {
      fail(`screenshot ${entry.relative} ${entry.bytes} byte, melebihi batas ${MAX_SHOT_BYTES}`);
    }
  }
  const planPath = path.join(repoRoot, "shots.json");
  if (fs.existsSync(planPath)) {
    const plan = JSON.parse(fs.readFileSync(planPath, "utf8")) as { shots?: Array<{ file?: string }> };
    const planned = (plan.shots ?? []).map((shot) => shot.file).filter((name): name is string => typeof name === "string");
    const present = new Set(visible.map((entry) => entry.relative));
    for (const name of planned) {
      if (!present.has(name)) {
        fail(`shots.json menyebut ${name}, tetapi file itu tidak ada di screenshots/`);
      }
    }
  }
  return visible;
}

function resolveOutputDir(): string {
  const raw = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  const resolved = path.isAbsolute(raw) ? path.resolve(raw) : path.resolve(repoRoot, raw);
  if (resolved === repoRoot) {
    fail("folder output tidak boleh sama dengan root repository");
  }
  if (resolved === path.parse(resolved).root) {
    fail("folder output tidak boleh menjadi root sistem file");
  }
  const gameDir = path.join(repoRoot, "game");
  const shotDir = path.join(repoRoot, "screenshots");
  if (resolved === gameDir || resolved === shotDir || resolved.startsWith(gameDir + path.sep) || resolved.startsWith(shotDir + path.sep)) {
    fail("folder output tidak boleh berada di dalam game/ atau screenshots/");
  }
  return resolved;
}

function verifyDossier(dossierPath: string, expectedBytes: Uint8Array, shotCount: number): number {
  const written = fs.readFileSync(dossierPath);
  if (!written.equals(Buffer.from(expectedBytes))) {
    fail("dossier.json yang tertulis tidak sama dengan hasil buildDossier");
  }
  if (written.length > MAX_DOSSIER_BYTES) {
    fail(`dossier.json ${written.length} byte, melebihi batas ${MAX_DOSSIER_BYTES}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(written.toString("utf8"));
  } catch {
    fail("dossier.json bukan JSON yang valid");
  }
  if (typeof parsed !== "object" || parsed === null) {
    fail("dossier.json tidak berisi objek");
  }
  const record = parsed as Record<string, unknown>;
  for (const key of DOSSIER_KEYS) {
    if (!(key in record)) {
      fail(`dossier.json kehilangan kunci ${key}`);
    }
  }
  if (!Array.isArray(record.images) || record.images.length !== shotCount) {
    fail(`dossier.json memuat ${Array.isArray(record.images) ? record.images.length : 0} gambar, diharapkan ${shotCount}`);
  }
  if (typeof record.text !== "string" || record.text.length === 0) {
    fail("dossier.json tidak memuat teks sumber game");
  }
  return written.length;
}

async function main(): Promise<void> {
  const outDir = resolveOutputDir();
  const gameDir = path.join(repoRoot, "game");
  const shotDir = path.join(repoRoot, "screenshots");

  const gameEntries = checkGameFolder(gameDir);
  const shotEntries = checkShotFolder(shotDir);
  const gameFileCount = gameEntries.filter((entry) => !entry.isDirectory).length;
  const gameBytes = gameEntries.reduce((sum, entry) => sum + entry.bytes, 0);

  if (fs.existsSync(outDir)) {
    for (const name of fs.readdirSync(outDir)) {
      fs.rmSync(path.join(outDir, name), { recursive: true, force: true });
    }
  }
  fs.mkdirSync(path.join(outDir, "game"), { recursive: true });
  fs.mkdirSync(path.join(outDir, "screenshots"), { recursive: true });
  copyTree(gameEntries, path.join(outDir, "game"));
  copyTree(shotEntries, path.join(outDir, "screenshots"));

  const copiedGame = walkTree(path.join(outDir, "game"));
  const copiedShots = walkTree(path.join(outDir, "screenshots")).filter((entry) => !entry.isDirectory);
  if (copiedGame.length !== gameEntries.length || copiedShots.length !== shotEntries.length) {
    fail("salinan di folder output tidak lengkap, dibatalkan");
  }
  for (const shot of shotEntries) {
    const copied = copiedShots.find((entry) => entry.relative === shot.relative);
    if (!copied || copied.bytes !== shot.bytes) {
      fail(`salinan screenshot ${shot.relative} tidak sama ukurannya dengan sumber`);
    }
  }

  const dossierBytes = await buildDossier(outDir, {
    text_max_bytes: TEXT_CAP_BYTES,
    game_max_files: MAX_GAME_ENTRIES,
    game_max_bytes: MAX_GAME_BYTES,
    game_path_max_bytes: MAX_GAME_PATH_BYTES,
  });
  const dossierPath = path.join(outDir, "dossier.json");
  fs.writeFileSync(dossierPath, dossierBytes);
  const dossierSize = verifyDossier(dossierPath, dossierBytes, shotEntries.length);
  const digest = createHash("sha256").update(dossierBytes).digest("hex");
  console.log(`main.ts: output ditulis ke ${outDir}`);
  console.log(`main.ts: game ${gameFileCount} file, ${gameBytes} byte; screenshots ${shotEntries.length} file (${shotEntries.map((entry) => entry.relative).join(", ")})`);
  console.log(`main.ts: dossier.json ${dossierSize} byte, sha256 ${digest}`);
}

await main();
