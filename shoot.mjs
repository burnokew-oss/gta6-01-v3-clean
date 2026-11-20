// Pengambil screenshot deterministik Teluk Cerah (1280x800, JPEG <= 256 KiB).
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const rootDir = dirname(fileURLToPath(import.meta.url));
const gameDir = join(rootDir, "game");
const shotsDir = join(rootDir, "screenshots");
const PORT = 8080;
const MAX_BYTES = 262144;

const require = createRequire(join(process.env.HOME || "/home/hatch", "workspace/tools/cdp/package.json"));
const puppeteer = require("puppeteer");

const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".wasm": "application/wasm", ".txt": "text/plain; charset=utf-8",
};

function serveStatic() {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      try {
        const url = new URL(req.url || "/", "http://localhost");
        let rel = decodeURIComponent(url.pathname);
        if (rel.endsWith("/")) rel += "index.html";
        const target = normalize(join(gameDir, rel));
        if (!target.startsWith(gameDir + sep) && target !== gameDir) { res.writeHead(403); res.end(); return; }
        if (!existsSync(target)) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { "Content-Type": MIME[extname(target).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
        res.end(readFileSync(target));
      } catch { res.writeHead(500); res.end(); }
    });
    server.listen(PORT, "127.0.0.1", () => resolvePromise(server));
  });
}

const declared = JSON.parse(readFileSync(join(rootDir, "shots.json"), "utf8"));
const only = process.argv[2];
const wanted = declared.shots.filter((s) => !only || s.shot === only);
if (wanted.length === 0) { console.error(`shoot: shot tidak dikenal: ${only}`); process.exit(1); }

const server = await serveStatic();
let browser = null;
const failures = [];
try {
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader"] });
  mkdirSync(shotsDir, { recursive: true });
  const hashes = new Map();
  for (const shot of wanted) {
    const page = await browser.newPage();
    page.setDefaultTimeout(180000);
    await page.setViewport({ width: 1280, height: 800 });
    const problems = [];
    page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
    page.on("console", (msg) => { if (msg.type() === "error") problems.push(`console: ${msg.text()}`); });
    page.on("requestfailed", (req) => problems.push(`requestfailed: ${req.url()}`));
    await page.goto(`http://127.0.0.1:${PORT}${shot.url}`, { waitUntil: "load", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 7000));
    const overlay = await page.evaluate(() => ({
      title: getComputedStyle(document.getElementById("title-overlay")).display,
      map: getComputedStyle(document.getElementById("map-overlay")).display,
    }));
    if ((shot.shot === "chase" || shot.shot === "shootout") && overlay.title !== "none") problems.push(`staging ${shot.shot}: layar judul masih terlihat`);
    if (shot.shot === "map" && overlay.map === "none") problems.push("staging map: peta layar penuh tidak tampil");
    if (shot.shot === "title" && overlay.title === "none") problems.push("staging title: layar judul tidak tampil");
    if (problems.length) { failures.push(`${shot.shot}: ${problems.join(" | ")}`); await page.close(); continue; }
    let saved = null;
    for (const quality of [82, 72, 62, 52]) {
      const buf = await page.screenshot({ type: "jpeg", quality });
      if (buf.length <= MAX_BYTES) { saved = buf; break; }
      saved = buf;
    }
    if (!saved || saved.length > MAX_BYTES) {
      failures.push(`${shot.shot}: JPEG tetap melebihi ${MAX_BYTES} byte (${saved ? saved.length : 0})`);
      await page.close(); continue;
    }
    const digest = createHash("sha256").update(saved).digest("hex");
    for (const [other, otherDigest] of hashes) {
      if (otherDigest === digest) failures.push(`${shot.shot}: isi sama persis dengan ${other}`);
    }
    hashes.set(shot.shot, digest);
    const target = join(shotsDir, shot.file);
    writeFileSync(target, saved);
    console.log(`shoot: ${shot.file} ${saved.length} byte sha256 ${digest}`);
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.close();
}
if (failures.length) {
  console.error(`shoot: GAGAL — ${failures.join(" ; ")}`);
  process.exit(1);
}
console.log("shoot: selesai tanpa error");
