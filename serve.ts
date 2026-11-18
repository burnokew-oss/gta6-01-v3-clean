// Teluk Cerah — server statis kecil untuk pengujian lokal.
// Melayani folder game/ di localhost, port 8080 secara default atau port
// yang diminta lewat argumen baris perintah pertama. Hanya standard library.
//
// Pemakaian:  node serve.ts [port]
// Permintaan yang gagal (path di luar game, file tidak ada) dicatat ke
// stderr supaya mudah dilacak saat playtest; permintaan yang berhasil
// tidak dicatat.
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const gameRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "game");

const mimeByExtension: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".wasm": "application/wasm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".txt": "text/plain; charset=utf-8",
};

function mimeFor(filePath: string): string {
  return mimeByExtension[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function resolveInsideRoot(requestPath: string): string | null {
  let cleaned = requestPath;
  if (cleaned === "/" || cleaned === "") {
    cleaned = "/index.html";
  }
  const target = path.resolve(gameRoot, `.${cleaned}`);
  if (target !== gameRoot && !target.startsWith(gameRoot + path.sep)) {
    return null;
  }
  return target;
}

const requestedPort = Number(process.argv[2] ?? 8080);
const port = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65536 ? requestedPort : 8080;

const server = http.createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { "content-type": "text/plain; charset=utf-8" });
    response.end("method tidak diizinkan\n");
    return;
  }
  let pathname = "/";
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    console.error(`serve.ts: 400 alamat tidak valid`);
    response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    response.end("alamat tidak valid\n");
    return;
  }
  // Game tidak memakai favicon: jawab kosong supaya console browser bersih.
  if (pathname === "/favicon.ico") {
    response.writeHead(204);
    response.end();
    return;
  }
  const target = resolveInsideRoot(pathname);
  if (target === null) {
    console.error(`serve.ts: 403 path di luar folder game: ${pathname}`);
    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("path di luar folder game\n");
    return;
  }
  let filePath = target;
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    const fileStat = fs.statSync(filePath);
    if (!fileStat.isFile()) {
      throw new Error("bukan file");
    }
    response.writeHead(200, {
      "content-type": mimeFor(filePath),
      "content-length": fileStat.size,
      "cache-control": "no-cache",
    });
    if (request.method === "GET") {
      fs.createReadStream(filePath).pipe(response);
    } else {
      response.end();
    }
  } catch {
    console.error(`serve.ts: 404 tidak ditemukan: ${pathname}`);
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("tidak ditemukan\n");
  }
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`serve.ts: port ${port} sudah dipakai proses lain`);
  } else {
    console.error(`serve.ts: ${error.message}`);
  }
  process.exit(1);
});

function shutdown(signal: string): void {
  server.close(() => {
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

server.listen(port, "127.0.0.1", () => {
  console.log(`Teluk Cerah: http://localhost:${port}/`);
});
