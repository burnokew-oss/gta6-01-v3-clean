// Teluk Cerah — pengambil screenshot deterministik.
// Menjalankan server statis di port 8080, mengunjungi empat alamat staging
// dari shots.json, lalu menangkap tiap adegan sebagai JPEG 1280x800 ke
// folder screenshots/. Memakai puppeteer dari folder tools lokal.
//
// Pemakaian:  node shoot.mjs [nama-shot ...]
// Tanpa argumen, semua shot di shots.json diambil. Dengan argumen, hanya
// shot yang namanya disebut yang diambil (misalnya: node shoot.mjs chase).
//
// Selain ukuran file dan page error, script ini juga memeriksa staging tiap
// shot lewat overlay yang terlihat: shot chase dan shootout harus sudah
// masuk gameplay (layar judul tersembunyi), shot map harus menampilkan
// peta layar penuh, dan shot title harus menampilkan layar judul. Terakhir,
// script menolak hasil bila dua screenshot isinya sama persis — itu tanda
// staging tidak jalan dan semua shot hanya menampilkan satu layar yang sama.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));
const shotDir = path.join(repoRoot, "screenshots");
const PORT = 8080;
const VIEW_WIDTH = 1280;
const VIEW_HEIGHT = 800;
const MAX_SHOT_BYTES = 262144;
const SETTLE_MS = 7000;
const QUALITIES = [82, 72, 62, 52];

const needFromTools = createRequire("/home/hatch/workspace/tools/cdp/node_modules/puppeteer/package.json");
const puppeteer = needFromTools("puppeteer");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function serverResponds() {
  try {
    const res = await fetch(`http://localhost:${PORT}/`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await serverResponds()) {
      return true;
    }
    await sleep(500);
  }
  return false;
}

// Membaca lebar dan tinggi dari header JPEG (marker SOF), tanpa library.
function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }
    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + segmentLength;
  }
  return null;
}

async function overlayState(page, id) {
  return await page.evaluate((wanted) => {
    const el = document.getElementById(wanted);
    if (!el) return "tidak-ada";
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (style.display === "none" || style.visibility === "hidden") return "tersembunyi";
    if (rect.width === 0 && rect.height === 0) return "nol-ukuran";
    return "terlihat";
  }, id);
}

async function hudText(page, id) {
  return await page.evaluate((wanted) => {
    const el = document.getElementById(wanted);
    return el ? (el.textContent || "").trim().replace(/\s+/g, " ") : "";
  }, id);
}

// Overlay yang diharapkan terlihat untuk tiap nama shot.
function expectedOverlays(shotName) {
  if (shotName === "map") {
    return { "title-overlay": "tersembunyi", "map-overlay": "terlihat" };
  }
  if (shotName === "title") {
    return { "title-overlay": "terlihat", "map-overlay": "tersembunyi" };
  }
  return { "title-overlay": "tersembunyi", "map-overlay": "tersembunyi" };
}

async function captureShot(browser, shot) {
  const page = await browser.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => {
    pageErrors.push(String(error && error.message ? error.message : error));
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  try {
    await page.setViewport({ width: VIEW_WIDTH, height: VIEW_HEIGHT });
    const address = `http://localhost:${PORT}${shot.url}`;
    await page.goto(address, { waitUntil: "load", timeout: 60000 });
    await sleep(SETTLE_MS);
    const titleState = await overlayState(page, "title-overlay");
    const mapState = await overlayState(page, "map-overlay");
    const cash = await hudText(page, "cash-value");
    const clock = await hudText(page, "clock-readout");
    const mission = await hudText(page, "mission-box");
    const target = path.join(shotDir, shot.file);
    let usedQuality = QUALITIES[0];
    let size = 0;
    for (const quality of QUALITIES) {
      usedQuality = quality;
      await page.screenshot({ path: target, type: "jpeg", quality });
      size = fs.statSync(target).size;
      if (size <= MAX_SHOT_BYTES) {
        break;
      }
    }
    const buffer = fs.readFileSync(target);
    const dimensions = jpegDimensions(buffer);
    const digest = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    return {
      file: shot.file,
      shot: shot.shot,
      bytes: size,
      quality: usedQuality,
      width: dimensions ? dimensions.width : 0,
      height: dimensions ? dimensions.height : 0,
      digest,
      titleOverlay: titleState,
      mapOverlay: mapState,
      cash,
      clock,
      mission,
      pageErrors,
      consoleErrors,
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const wantedNames = process.argv.slice(2);
  const planPath = path.join(repoRoot, "shots.json");
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  let shots = plan.shots;
  if (!Array.isArray(shots) || shots.length < 3 || shots.length > 4) {
    throw new Error(`shots.json harus memuat 3 sampai 4 shot, ditemukan ${Array.isArray(shots) ? shots.length : 0}`);
  }
  if (wantedNames.length > 0) {
    shots = shots.filter((shot) => wantedNames.includes(shot.shot));
    if (shots.length === 0) {
      throw new Error(`tidak ada shot bernama ${wantedNames.join(", ")} di shots.json`);
    }
  }
  fs.mkdirSync(shotDir, { recursive: true });

  let serverProcess = null;
  if (await serverResponds()) {
    console.log(`shoot.mjs: server port ${PORT} sudah jalan, dipakai bersama`);
  } else {
    serverProcess = spawn("node", ["serve.ts", String(PORT)], {
      cwd: repoRoot,
      stdio: "ignore",
      detached: false,
    });
    const ready = await waitForServer(30000);
    if (!ready) {
      if (serverProcess) serverProcess.kill();
      throw new Error(`server statis tidak menjawab di port ${PORT} setelah 30 detik`);
    }
    console.log(`shoot.mjs: server statis jalan di http://localhost:${PORT}/`);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: VIEW_WIDTH, height: VIEW_HEIGHT },
  });
  const results = [];
  let failed = false;
  try {
    for (const shot of shots) {
      const result = await captureShot(browser, shot);
      results.push(result);
      console.log(
        `shoot.mjs: ${result.file} ${result.width}x${result.height} ${result.bytes} byte sha256:${result.digest} (kualitas ${result.quality}, page error ${result.pageErrors.length}, console error ${result.consoleErrors.length})`
      );
      console.log(
        `shoot.mjs: ${result.file} overlay judul=${result.titleOverlay} peta=${result.mapOverlay} | uang=${result.cash} | jam=${result.clock} | misi=${result.mission}`
      );
      const expected = expectedOverlays(result.shot);
      if (result.titleOverlay !== expected["title-overlay"]) {
        failed = true;
        console.error(
          `shoot.mjs: STAGING MELESET di ${result.file}: overlay judul ${result.titleOverlay}, diharapkan ${expected["title-overlay"]}`
        );
      }
      if (result.mapOverlay !== expected["map-overlay"]) {
        failed = true;
        console.error(
          `shoot.mjs: STAGING MELESET di ${result.file}: overlay peta ${result.mapOverlay}, diharapkan ${expected["map-overlay"]}`
        );
      }
      if (result.pageErrors.length > 0) {
        failed = true;
        for (const message of result.pageErrors) {
          console.error(`shoot.mjs: page error di ${result.file}: ${message}`);
        }
      }
      if (result.bytes > MAX_SHOT_BYTES) {
        failed = true;
        console.error(`shoot.mjs: ${result.file} masih ${result.bytes} byte setelah semua kualitas, melebihi batas ${MAX_SHOT_BYTES}`);
      }
      if (result.width !== VIEW_WIDTH || result.height !== VIEW_HEIGHT) {
        failed = true;
        console.error(`shoot.mjs: ${result.file} berdimensi ${result.width}x${result.height}, diharapkan ${VIEW_WIDTH}x${VIEW_HEIGHT}`);
      }
      for (const message of result.consoleErrors) {
        console.error(`shoot.mjs: console error di ${result.file}: ${message}`);
      }
    }
    const seenDigests = new Map();
    for (const result of results) {
      if (seenDigests.has(result.digest)) {
        failed = true;
        console.error(
          `shoot.mjs: DUPLIKAT — ${result.file} isinya sama persis dengan ${seenDigests.get(result.digest)} (sha256:${result.digest}); staging kemungkinan tidak jalan`
        );
      } else {
        seenDigests.set(result.digest, result.file);
      }
    }
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
  if (failed) {
    console.error("shoot.mjs: GAGAL — lihat baris di atas");
    process.exit(1);
  }
  console.log(`shoot.mjs: selesai, ${results.length} screenshot tersimpan di ${shotDir}`);
}

await main();
