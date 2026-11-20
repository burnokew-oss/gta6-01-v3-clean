# gta6-01-v3-clean

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3-clean/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3-clean/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Teluk Cerah** is an original open-world crime game that runs in the browser. You play Raka, a drifter who returns to the sun-soaked coastal city of Teluk Cerah and works his way up through ten story missions — stealing cars, shaking down racketeers, street races, a midnight courier run and a final showdown at the harbour. Between missions the city is yours: drive the coast road at sunset, browse the garage, gun shop, boutique and food stall, chase a five-star wanted level with patrol cars and a police helicopter on your tail, and save your progress in three slots.

Built with vanilla JavaScript and a vendored Three.js: real shadow mapping, physically based clearcoat car paint, sunset environment reflections, geometric wet-street reflections, a fully modelled patrol fleet with unique service plates, articulated pedestrians, procedural radio stations and synthesised sound — no build step, no network, everything is a static file under `game/`.

**How to play** — WASD move/drive, drag mouse for the camera, E enter cars and use shops, left click shoots, 1/2/3 switch weapons, R reloads (or changes radio in a car), Shift runs / fires NOS, M opens the city map, Esc pauses and saves.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. To rebuild the submission output, run `node main.ts` with `MAKEFUN_OUTPUT_DIR` set; to retake the screenshots, run `node shoot.mjs`.

---

Entered on [make.fun](https://make.fun/?ref=burnokew-oss&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards
