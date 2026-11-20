// Server statis lokal untuk memainkan Teluk Cerah dari folder game/.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const gameDir = resolve(join(rootDir, "game"));
const port = Number(process.argv[2] || 8080);

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    const target = normalize(join(gameDir, rel));
    if (target !== gameDir && !target.startsWith(gameDir + sep)) {
      console.error(`serve: path keluar dari game ditolak: ${req.url}`);
      res.writeHead(403); res.end("Forbidden"); return;
    }
    if (!existsSync(target) || !statSync(target).isFile()) {
      console.error(`serve: tidak ditemukan: ${req.url}`);
      res.writeHead(404); res.end("Not found"); return;
    }
    const type = MIME[extname(target).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(readFileSync(target));
  } catch (err) {
    console.error(`serve: gagal melayani ${req.url}: ${String(err)}`);
    res.writeHead(500); res.end("Error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Teluk Cerah dilayani di http://localhost:${port}/`);
});
