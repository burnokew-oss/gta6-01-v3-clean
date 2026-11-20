// shoot.mjs — pengambil screenshot Teluk Cerah: menyalakan server lokal,
// membuka game di Chrome headless 1280x800 lewat CDP, memicu tiap adegan
// dari shots.json, menyimpan JPG ke screenshots/, melaporkan page error.
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const PORT = 8123;
const CDP_PORT = 9333;
const CHROME = process.env.CHROME_BIN || "/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome";
const shots = JSON.parse(readFileSync(join(root, "shots.json"), "utf8"));

const server = spawn("node", [join(root, "serve.ts")], {
  env: { ...process.env, PORT: String(PORT) }, stdio: "ignore",
});
const chrome = spawn(CHROME, [
  "--headless=new", "--disable-gpu-sandbox", "--no-sandbox", "--enable-unsafe-swiftshader", "--use-angle=swiftshader",
  "--remote-debugging-port=" + CDP_PORT,
  "--window-size=1280,800", "--hide-scrollbars", "--force-device-scale-factor=1",
  "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, timeout, label) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(250);
  }
  throw new Error("timeout: " + label);
}

let msgId = 0;
const pending = new Map();
let ws;
function send(method, params = {}) {
  const id = ++msgId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const pageErrors = [];
async function main() {
  const target = await waitFor(async () => {
    const res = await fetch("http://127.0.0.1:" + CDP_PORT + "/json/new?about:blank", { method: "PUT" });
    if (!res.ok) return null;
    return res.json();
  }, 20000, "chrome cdp");
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message)); else p.resolve(msg.result);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      pageErrors.push("exception: " + (msg.params.exceptionDetails.text || ""));
    }
    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      pageErrors.push("console: " + msg.params.args.map((a) => a.value || a.description || "").join(" "));
    }
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
      pageErrors.push("log: " + msg.params.entry.text);
    }
  });
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });

  for (const shot of shots) {
    const url = "http://127.0.0.1:" + PORT + "/?shot=" + shot.name;
    await send("Page.navigate", { url });
    await waitFor(async () => {
      const r = await send("Runtime.evaluate", { expression: "window.__telukReady === true", returnByValue: true });
      return r.result && r.result.value;
    }, 30000, "ready " + shot.name);
    await sleep(1600);
    const shotRes = await send("Page.captureScreenshot", { format: "jpeg", quality: 84, fromSurface: true });
    const file = join(root, "screenshots", shot.file);
    writeFileSync(file, Buffer.from(shotRes.data, "base64"));
    console.log("shot", shot.file, "ok");
  }
  console.log("PAGE_ERRORS:", pageErrors.length ? pageErrors.join(" | ") : "none");
}

main()
  .then(() => { chrome.kill(); server.kill(); process.exit(pageErrors.length ? 2 : 0); })
  .catch((e) => { console.error("shoot gagal:", e.message); chrome.kill(); server.kill(); process.exit(1); });
