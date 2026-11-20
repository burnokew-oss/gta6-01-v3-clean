// Teluk Cerah — entrypoint harness make.fun.
// Copies game/ and screenshots/ from the repository into the output
// directory, then writes dossier.json with the kit's buildDossier so the
// grader's rebuild compares byte for byte. Deterministic: two runs over
// the same repository produce identical bytes.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

mkdirSync(outputDir, { recursive: true });
rmSync(join(outputDir, "game"), { recursive: true, force: true });
rmSync(join(outputDir, "screenshots"), { recursive: true, force: true });
cpSync(join(repoRoot, "game"), join(outputDir, "game"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outputDir, "screenshots"), { recursive: true });

const caps = {
  text_max_bytes: 163_840,
  max_bytes: 1_572_864,
  screenshots: { max: 4, max_bytes: 262_144 },
};
const dossier = buildDossier(outputDir, caps);
writeFileSync(join(outputDir, "dossier.json"), dossier);
console.log("dossier written:", dossier.length, "bytes");
