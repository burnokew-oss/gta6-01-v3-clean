// Teluk Cerah — the retail-style HUD: money, health and armour, weapon
// and ammunition, wanted stars, clock, the active mission, a police
// dispatch feed, radio info, a driving speedometer with a NOS gauge, and
// a live minimap — plus dialogue, notifications and the full city map.

import { CITY, DISTRICTS, SHOPS } from "./config.js";

export function createHud() {
  const el = (id) => document.getElementById(id);
  const moneyEl = el("money"), repEl = el("rep"), clockEl = el("clock");
  const starsEl = el("stars"), dispatchEl = el("dispatch");
  const missionEl = el("mission-title"), objectiveEl = el("objective");
  const hpEl = el("hp-fill"), armorEl = el("armor-fill");
  const weaponEl = el("weapon-name"), ammoEl = el("ammo");
  const speedWrap = el("speedo"), speedEl = el("speed-num"), nosEl = el("nos-fill");
  const radioEl = el("radio-info"), hintEl = el("hint");
  const dialogueEl = el("dialogue"), dialogueName = el("dialogue-name"), dialogueText = el("dialogue-text");
  const notifyEl = el("notify");
  const minimap = el("minimap").getContext("2d");
  const mapOverlay = el("map-overlay"), bigmap = el("bigmap").getContext("2d");
  let dialogueUntil = 0, notifyUntil = 0, mapTick = 0;
  const dispatchLines = [];

  function worldToMap(x, z, w, h) {
    return [
      ((x - CITY.minX) / (CITY.maxX - CITY.minX)) * w,
      ((z - CITY.minZ) / (CITY.seaZ + 26 - CITY.minZ)) * h,
    ];
  }
  function drawRoads(g, w, h) {
    g.strokeStyle = "rgba(240,238,230,0.75)"; g.lineWidth = Math.max(2, w / 130);
    for (const x of CITY.streetsX) {
      const [mx] = worldToMap(x, 0, w, h);
      g.beginPath(); g.moveTo(mx, 0); g.lineTo(mx, worldToMap(0, CITY.coastRoadZ, w, h)[1]); g.stroke();
    }
    for (const z of [...CITY.avenuesZ, CITY.coastRoadZ]) {
      const [, my] = worldToMap(0, z, w, h);
      g.beginPath(); g.moveTo(0, my); g.lineTo(w, my); g.stroke();
    }
  }
  function drawMinimap(entities) {
    const w = 196, h = 196;
    minimap.fillStyle = "#3d5a43"; minimap.fillRect(0, 0, w, h);
    const [, seaY] = worldToMap(0, CITY.beachZ, w, h);
    minimap.fillStyle = "#c9a86a"; minimap.fillRect(0, seaY, w, h - seaY);
    const [, waterY] = worldToMap(0, CITY.seaZ, w, h);
    minimap.fillStyle = "#2e7d99"; minimap.fillRect(0, waterY, w, h - waterY);
    drawRoads(minimap, w, h);
    for (const s of SHOPS) {
      const [x, y] = worldToMap(s.x, s.z, w, h);
      minimap.fillStyle = s.color; minimap.fillRect(x - 3, y - 3, 6, 6);
    }
    if (entities.mission) {
      const [x, y] = worldToMap(entities.mission.x, entities.mission.z, w, h);
      minimap.fillStyle = "#ffc93c";
      minimap.beginPath(); minimap.arc(x, y, 5, 0, 7); minimap.fill();
      minimap.strokeStyle = "#7a5200"; minimap.stroke();
    }
    for (const u of entities.police || []) {
      if (!u.active) continue;
      const [x, y] = worldToMap(u.x, u.z, w, h);
      minimap.fillStyle = "#3a7bff";
      minimap.beginPath(); minimap.arc(x, y, 3.4, 0, 7); minimap.fill();
    }
    for (const c of entities.traffic || []) {
      const [x, y] = worldToMap(c.x, c.z, w, h);
      minimap.fillStyle = "rgba(240,240,240,0.8)";
      minimap.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
    }
    const [px, py] = worldToMap(entities.player.x, entities.player.z, w, h);
    minimap.save();
    minimap.translate(px, py);
    minimap.rotate(Math.PI - entities.player.heading);
    minimap.fillStyle = "#ffffff";
    minimap.beginPath();
    minimap.moveTo(0, -7); minimap.lineTo(4.6, 5); minimap.lineTo(0, 2.4); minimap.lineTo(-4.6, 5);
    minimap.closePath(); minimap.fill();
    minimap.restore();
  }

  const hud = {
    showDialogue(name, text, secs = 5) {
      dialogueName.textContent = name;
      dialogueText.textContent = text;
      dialogueEl.style.display = "block";
      dialogueUntil = performance.now() + secs * 1000;
    },
    notify(text) {
      notifyEl.textContent = text;
      notifyEl.style.display = "block";
      notifyUntil = performance.now() + 4200;
    },
    dispatch(text) {
      dispatchLines.unshift(`▸ ${text}`);
      if (dispatchLines.length > 3) dispatchLines.pop();
      dispatchEl.innerHTML = dispatchLines.join("<br>");
    },
    showMap(open) { mapOverlay.style.display = open ? "flex" : "none"; },
    get mapOpen() { return mapOverlay.style.display === "flex"; },
    drawBigMap(entities) {
      const w = 920, h = 600;
      const g = bigmap;
      g.fillStyle = "#46685a"; g.fillRect(0, 0, w, h);
      const [, seaY] = worldToMap(0, CITY.beachZ, w, h);
      g.fillStyle = "#d9b878"; g.fillRect(0, seaY, w, h - seaY);
      const [, waterY] = worldToMap(0, CITY.seaZ, w, h);
      g.fillStyle = "#2e7d99"; g.fillRect(0, waterY, w, h - waterY);
      for (const d of DISTRICTS) {
        const [x, y] = worldToMap(d.x, d.z, w, h);
        g.fillStyle = d.color + "55"; g.fillRect(x - 56, y - 34, 112, 68);
        g.fillStyle = "#ffffff"; g.font = "bold 15px Arial"; g.textAlign = "center";
        g.fillText(d.name.toUpperCase(), x, y + 5);
      }
      drawRoads(g, w, h);
      g.font = "bold 13px Arial";
      for (const s of SHOPS) {
        const [x, y] = worldToMap(s.x, s.z, w, h);
        g.fillStyle = s.color; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill();
        g.fillStyle = "#fff"; g.fillText("✚", x, y + 5);
        g.fillStyle = "#16202a"; g.fillText(s.name, x, y + 24);
      }
      if (entities.mission) {
        const [x, y] = worldToMap(entities.mission.x, entities.mission.z, w, h);
        g.fillStyle = "#ffc93c"; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill();
        g.fillStyle = "#5a3c00"; g.font = "bold 15px Arial"; g.fillText("◆", x, y + 5);
      }
      for (const u of entities.police || []) {
        if (!u.active) continue;
        const [x, y] = worldToMap(u.x, u.z, w, h);
        g.fillStyle = "#3a7bff"; g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill();
      }
      const [px, py] = worldToMap(entities.player.x, entities.player.z, w, h);
      g.fillStyle = "#ffffff"; g.strokeStyle = "#16202a"; g.lineWidth = 2;
      g.beginPath(); g.arc(px, py, 8, 0, 7); g.fill(); g.stroke();
      g.fillStyle = "#16202a"; g.font = "bold 12px Arial"; g.fillText("RAKA", px, py + 4);
      g.fillStyle = "#ffd76a"; g.font = "bold 17px Arial"; g.textAlign = "left";
      g.fillText("LAUT TELUK CERAH", 24, h - 18);
    },
    update(S, view) {
      moneyEl.textContent = `$${S.money.toLocaleString("id-ID")}`;
      repEl.textContent = `REP ${S.rep}`;
      clockEl.textContent = view.clock;
      starsEl.textContent = "★".repeat(S.wanted) + "☆".repeat(5 - S.wanted);
      starsEl.style.color = S.wanted > 0 ? "#ffc93c" : "rgba(255,255,255,0.35)";
      missionEl.textContent = view.missionTitle || "";
      objectiveEl.textContent = view.objective || "";
      hpEl.style.width = `${Math.max(0, S.hp)}%`;
      hpEl.style.background = S.hp > 30 ? "#57c84a" : "#e83a30";
      armorEl.style.width = `${Math.max(0, S.armor)}%`;
      weaponEl.textContent = view.weaponName;
      ammoEl.textContent = view.ammoText;
      radioEl.innerHTML = view.radioText;
      hintEl.textContent = view.hint || "";
      speedWrap.style.display = view.driving ? "block" : "none";
      if (view.driving) {
        speedEl.textContent = String(Math.round(view.speedKmh));
        nosEl.style.width = `${Math.round((view.nos || 0) * 100)}%`;
      }
      const now = performance.now();
      if (dialogueUntil && now > dialogueUntil) { dialogueEl.style.display = "none"; dialogueUntil = 0; }
      if (notifyUntil && now > notifyUntil) { notifyEl.style.display = "none"; notifyUntil = 0; }
      drawMinimap(view.entities);
      if (hud.mapOpen && (mapTick++ % 5 === 0)) hud.drawBigMap(view.entities);
    },
  };
  return hud;
}
