// Teluk Cerah — entrypoint harness for the make.fun gta6-01 bounty.
// Copies game/ and screenshots/ into the output directory and writes the
// dossier the grader expects, using the kit's own library so the bytes
// match what the gate rebuilds on its side.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier, DOSSIER_MAX_BYTES, DOSSIER_MAX_IMAGES } from "./vendor/makefun-game.ts";

const rootDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Start from an empty output so stale files can never leak into a run.
// (The output directory itself is the grader's mount point: clear its
// children, never the directory itself.)
mkdirSync(outDir, { recursive: true });
for (const child of ["game", "screenshots", "dossier.json"]) {
  rmSync(join(outDir, child), { recursive: true, force: true });
}

cpSync(join(rootDir, "game"), join(outDir, "game"), { recursive: true });
cpSync(join(rootDir, "screenshots"), join(outDir, "screenshots"), { recursive: true });

const dossier = buildDossier(rootDir, {
  text_max_bytes: 163_840,
  max_bytes: DOSSIER_MAX_BYTES,
  max_images: DOSSIER_MAX_IMAGES,
});
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log(`teluk-cerah: wrote game/, screenshots/ and dossier.json (${dossier.length} bytes) to ${outDir}`);
