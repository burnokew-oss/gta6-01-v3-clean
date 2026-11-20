// Teluk Cerah — screenshot scenes. Each scene arranges the live game
// into a deterministic, already-in-motion moment: the chase is mid-
// manoeuvre with a real speed on the dial, the shootout is mid-fight
// with ammunition already spent and enemy health already down.

import { CITY } from "./config.js";

export function setupShot(name, ctx) {
  const { S, player, police, combat, hud, missions, camera } = ctx;
  S.money = 12450; S.rep = 132; S.hp = 86; S.armor = 40;

  if (name === "chase") {
    // clear ambient traffic out of the chase corridor so the formation reads
    for (const c of ctx.traffic || []) {
      if (Math.abs(c.z - CITY.coastRoadZ) < 9 && c.x > -110 && c.x < 60) c.x += 190;
    }
    player.placeCar(-36, CITY.coastRoadZ - 3.4, Math.PI / 2);
    player.enterCar();
    player.driveOverride = { speed: 23.6, heading: Math.PI / 2, steer: 0.14 };
    player.camBackBonus = 3.4;
    police.setWanted(4, true);
    police.shotFormation = true;
    police.heli.follow = { x: 13, y: 10.5, z: -7 };
    ctx.shotView = {
      missionTitle: "MISI 6 — PAKET TENGAH MALAM",
      objective: "Antar paket ke Kawasan Kaca — jangan sampai tertangkap",
    };
    missions.setShotMarker(150, -30);
    hud.dispatch("Unit 07, kendaraan merah melaju ke timur di jalan pesisir.");
    hud.dispatch("Semua unit: apit dari dua sisi, helikopter sudah di atas.");
    S.hp = 82; S.armor = 35;
  }

  if (name === "shootout") {
    // on the avenue in front of the market stalls: open sight-lines,
    // enemies in a firing line on the far sidewalk, fight already joined
    player.teleport(-58, 88.5, Math.PI);
    player.camYaw = Math.PI; player.camPitch = 0.10;
    player.aimPose = 0.92;
    combat.weaponIdx = 1;
    combat.ammo.pistol.mag = 7; combat.ammo.pistol.reserve = 41;
    combat.spawnEnemies(-58, 82.3, 6, { line: true, hpFracs: [0.45, 0.7, 0.3, 0.85, 0.55, 0.62] });
    combat.shotFireEnemy = 0;
    police.setWanted(2, true);
    ctx.shotView = {
      missionTitle: "MISI 4 — WARUNG YANG DIPERAS",
      objective: "Usir para pemeras — baku tembak sedang berlangsung",
    };
    missions.setShotMarker(-58, 80);
    hud.dispatch("Laporan warga: baku tembak di kawasan Pasar Pagi.");
    S.hp = 68; S.armor = 25;
  }

  if (name === "map") {
    player.placeCar(24, CITY.coastRoadZ - 3.4, Math.PI / 2);
    player.enterCar();
    player.driveOverride = { speed: 9, heading: Math.PI / 2, steer: 0 };
    police.setWanted(1, true);
    ctx.shotView = {
      missionTitle: "MISI 3 — MOBIL OM BRAM",
      objective: "Bawa mobil ke Bengkel Pelita",
    };
    missions.setShotMarker(-52, 44);
    hud.showMap(true);
  }

  if (name === "title") {
    // hero car parked at an angle on the promenade, Raka beside it,
    // the bay and the skyline behind — the title screen sits over this
    player.placeCar(30, CITY.coastRoadZ + 6.5, Math.PI / 2 + 0.5);
    player.teleport(26.8, CITY.coastRoadZ + 4.2, -2.2);
    camera.position.set(19.5, 2.0, CITY.coastRoadZ + 13.5);
    camera.lookAt(29, 1.1, CITY.coastRoadZ + 5.5);
    ctx.fixedCamera = true;
  }
}
