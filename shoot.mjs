// Teluk Cerah — screenshot tool: serves the game, opens each scene from
// shots.json in headless Chrome at 1280x800, waits for the scene to be
// live, and saves real JPEG renders into screenshots/.
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const PORT = 8137;

async function loadPuppeteer() {
  try { return (await import("puppeteer")).default; } catch {}
  const { createRequire } = await import("node:module");
  const toolDirs = [
    join(rootDir, "..", "..", "tools", "cdp"),
    join(process.env.HOME || "", "workspace", "tools", "cdp"),
  ];
  for (const dir of toolDirs) {
    try {
      const req = createRequire(join(dir, "package.json"));
      const pup = req("puppeteer");
      if (pup && pup.launch) return pup;
    } catch {}
  }
  throw new Error("puppeteer not found");
}

const server = spawn(process.execPath, [join(rootDir, "serve.ts")], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: "pipe",
});
await new Promise((r) => setTimeout(r, 900));

let failed = false;
try {
  const puppeteer = await loadPuppeteer();
  const shots = JSON.parse(readFileSync(join(rootDir, "shots.json"), "utf8"));
  for (const shot of shots) {
    // a fresh browser per shot: a long software-GL session can destabilise
    // the renderer, and one bad scene must not lose the others
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--window-size=1280,800"],
    });
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      const pageErrors = [];
      page.on("pageerror", (e) => pageErrors.push(String(e)));
      page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("Failed to load resource")) pageErrors.push(m.text()); });
      await page.goto(`http://localhost:${PORT}/?shot=${shot.scene}`, { waitUntil: "load", timeout: 60000 });
      await page.waitForFunction("window.__tcReady === true", { timeout: 150000 });
      await new Promise((r) => setTimeout(r, 500));
      const out = join(rootDir, "screenshots", shot.file);
      await page.screenshot({ path: out, type: "jpeg", quality: 80 });
      console.log(`shot ${shot.name} -> ${out}${pageErrors.length ? " PAGEERRORS: " + pageErrors.join(" | ") : ""}`);
      if (pageErrors.length) failed = true;
    } catch (err) {
      failed = true;
      console.log(`shot ${shot.name} FAILED: ${String(err).slice(0, 300)}`);
    } finally {
      await browser.close().catch(() => {});
    }
  }
} finally {
  server.kill();
}
process.exit(failed ? 2 : 0);
