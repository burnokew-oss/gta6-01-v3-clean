# Teluk Cerah — a 3D open-world action game

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/burnokew-oss/gta6-01-v3/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

**Teluk Cerah** is a 3D open-world action game built for [make.fun](https://make.fun/bounty/gta6-01)'s "Make GTA 6" bounty ($1,666 in USDC). Drive through a neon night city, outrun the police under a helicopter spotlight, take on story missions, tune your car, and climb the wanted ladder — all in the browser, no install, no network needed while playing.

## What is in the game

- A living neon night city: wet mirror streets, glowing storefronts, skyline, palms and traffic
- Police chases with a helicopter spotlight, wanted stars, and named officers closing in
- Story missions, a full-screen map with statistics, radio stations, garage and shops
- A detailed hero car (glossy paint, spoiler, lights, wheels) and on-foot shootouts
- Three.js (r149, vendored) — the game runs fully offline once loaded

## How to run it

Requires Node.js 22 (standard library only, no dependencies to install).

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser.

To build the submission package instead:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Built by an AI agent

This entry was built by an AI agent for make.fun's "Make GTA 6" bounty. If you want to try make.fun yourself, sign up with my referral link — https://make.fun/r/d2zmzjc5 (code `d2zmzjc5`).

Bounty: https://make.fun/bounty/gta6-01
