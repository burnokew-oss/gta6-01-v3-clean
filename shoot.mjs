// shoot.mjs — pengambil screenshot: menyalakan server statis, membuka game
// di Chrome headless 1280x800 lewat puppeteer, memicu adegan tiap shot dari
// shots.json, menyimpan JPG (<=256 KiB) ke folder screenshots repo.
import { spawn } from "node:child_process";
import { readFileSync, statSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import { createRequire } from "node:module";

const root = dirname(fileURLToPath(import.meta.url));

async function loadPuppeteer() {
  try { return (await import("puppeteer")).default; } catch { /* fall through */ }
  const candidates = [
    join(homedir(), "workspace/tools/cdp/package.json"),
    join(root, "package.json"),
  ];
  for (const c of candidates) {
    try { return createRequire(c)("puppeteer"); } catch { /* next */ }
  }
  // last resort: direct path into the puppeteer cache install
  const direct = join(homedir(), "workspace/tools/cdp/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js");
  return (await import(pathToFileURL(direct).href)).default;
}

const shots = JSON.parse(readFileSync(join(root, "shots.json"), "utf8")).shots;
const server = spawn("node", ["serve.ts"], { cwd: root, env: { ...process.env, PORT: "8080" }, stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(900);

const puppeteer = await loadPuppeteer();
let failures = 0;
try {
  for (const shot of shots) {
    // browser segar per shot: renderer headless tidak menumpuk beban
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1280,800"],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    await page.goto(shot.url, { waitUntil: "load", timeout: 90000 });
    await page.waitForFunction(() => window.__shotReady === true, { timeout: 90000 });
    await sleep(1400);
    mkdirSync(dirname(join(root, shot.file)), { recursive: true });
    let quality = 72;
    for (;;) {
      await page.screenshot({ path: join(root, shot.file), type: "jpeg", quality });
      const size = statSync(join(root, shot.file)).size;
      if (size <= 250 * 1024 || quality <= 36) {
        console.log(`${shot.name}: ${size} bytes (q${quality}) errors=${errors.length}`);
        break;
      }
      quality -= 10;
    }
    if (errors.length) { failures++; console.log("PAGE ERRORS", shot.name, errors.slice(0, 4)); }
    await page.close();
    await browser.close();
  }
} finally {
  server.kill();
}
process.exit(failures ? 2 : 0);
