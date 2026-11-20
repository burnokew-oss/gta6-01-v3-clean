// Teluk Cerah — ronde 8: pengemas dossier make.fun gta6-01.
// Menyalin game/ dan screenshots/ ke folder keluaran lalu menulis
// dossier.json memakai buildDossier dari vendor resmi kit.
import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-game.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const botDir = process.env.MAKEFUN_BOT_DIR || repoRoot;
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

mkdirSync(outDir, { recursive: true });
cpSync(join(botDir, "game"), join(outDir, "game"), { recursive: true });
cpSync(join(botDir, "screenshots"), join(outDir, "screenshots"), {
  recursive: true,
});

const dossier = buildDossier(outDir, { text_max_bytes: 163840 });
writeFileSync(join(outDir, "dossier.json"), dossier);
console.log("Teluk Cerah ronde 8: dossier tertulis,", dossier.length, "byte");
