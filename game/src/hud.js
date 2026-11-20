// HUD: uang, health, senjata, wanted, misi, polisi, minimap, dialog, banner, peta.
import { MISSIONS, REP_TIERS, currentObjective } from "./missions.js";
import { currentStation, currentSong } from "./radio.js";
import { listSaves } from "./save.js";
import { CONFIG } from "./config.js";

const el = (id) => document.getElementById(id);

export function repTier(state) {
  const thresholds = [0, 300, 700, 1200, 1800, 2400];
  let idx = 0;
  for (let i = 0; i < thresholds.length; i++) if (state.rep >= thresholds[i]) idx = i;
  return { idx, name: REP_TIERS[idx] };
}

export function createHud(state) {
  return { mapOpen: false, dialogUntil: 0, bannerUntil: 0, minimapCtx: el("minimap").getContext("2d") };
}

export function showDialog(state, speaker, text) {
  state.dialog = { speaker, text };
  state.hudState.dialogUntil = performance.now() + 6000;
}

export function showBanner(state, text) {
  state.banner = text;
  state.hudState.bannerUntil = performance.now() + 3400;
}

export function showMap(state, open) {
  state.hudState.mapOpen = open;
  el("map-overlay").style.display = open ? "block" : "none";
  if (open) renderMapPanel(state);
}

function fmtClock(mins) {
  const h = Math.floor(mins / 60) % 24, m = Math.floor(mins % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function districtAt(pos) {
  let best = CONFIG.districts[0], bd = 1e9;
  for (const d of CONFIG.districts) { const dd = (d.cx - pos.x) ** 2 + (d.cz - pos.z) ** 2; if (dd < bd) { bd = dd; best = d; } }
  return best.name;
}

function drawMapGrid(state) {
  const grid = el("map-grid");
  const X = (wx) => 30 + ((wx + 210) / 420) * 600;
  const Y = (wz) => 30 + ((wz + 210) / 420) * 460;
  let s = `<svg width="660" height="520" viewBox="0 0 660 520">`;
  s += `<rect x="0" y="0" width="26" height="520" fill="#1d5f8a"/>`;
  s += `<rect x="26" y="0" width="10" height="520" fill="#d9b77c"/>`;
  for (const b of state.city.blocks) {
    s += `<rect x="${X(b.cx - 34)}" y="${Y(b.cz - 34)}" width="97" height="78" fill="#12283e" stroke="#1d4258" stroke-width="1"/>`;
    s += `<rect x="${X(b.cx - 20)}" y="${Y(b.cz - 20)}" width="26" height="18" fill="#1a3a52"/>`;
    s += `<rect x="${X(b.cx + 4)}" y="${Y(b.cz + 6)}" width="20" height="14" fill="#1a3a52"/>`;
  }
  for (const ax of CONFIG.avenueXs) s += `<line x1="${X(ax)}" y1="30" x2="${X(ax)}" y2="490" stroke="#39c2ff" stroke-width="4" opacity="0.75"/>`;
  for (const sz of CONFIG.streetZs) s += `<line x1="30" y1="${Y(sz)}" x2="630" y2="${Y(sz)}" stroke="#39c2ff" stroke-width="4" opacity="0.75"/>`;
  for (let i = 0; i <= 6; i++) {
    const gx = 30 + i * 100;
    s += `<line x1="${gx}" y1="30" x2="${gx}" y2="490" stroke="#274b66" stroke-width="1"/>`;
    if (i < 6) s += `<text x="${gx + 50}" y="20" fill="#8fb4cc" font-size="13" text-anchor="middle">${"ABCDEF"[i]}</text>`;
  }
  for (let i = 0; i <= 5; i++) {
    const gy = 30 + i * 92;
    s += `<line x1="30" y1="${gy}" x2="630" y2="${gy}" stroke="#274b66" stroke-width="1"/>`;
    if (i < 5) s += `<text x="14" y="${gy + 50}" fill="#8fb4cc" font-size="13" text-anchor="middle">${i + 1}</text>`;
  }
  for (const d of CONFIG.districts) {
    s += `<text x="${X(d.cx)}" y="${Y(d.cz)}" fill="#e8f2fa" font-size="17" font-weight="700" text-anchor="middle">${d.name}</text>`;
  }
  const route = [[4, 30], [-150, -40], [-84, 60], [52, 108], [-84, -150]];
  s += `<polyline points="${route.map(([x, z]) => `${X(x)},${Y(z)}`).join(" ")}" fill="none" stroke="#ffd23c" stroke-width="2.5" stroke-dasharray="7 4"/>`;
  for (const [x, z] of route) s += `<circle cx="${X(x)}" cy="${Y(z)}" r="4" fill="#ffd23c"/>`;
  const pois = [
    [state.city.pois.safehouse, "H", "#3ce06a"], [state.city.pois.gunShop, "$", "#ff7847"],
    [state.city.pois.garage, "G", "#39c2ff"], [state.city.pois.hospital, "+", "#ff5f7a"],
    [state.city.pois.policeStation, "P", "#7ab8ff"],
  ];
  for (const [p, ch, col] of pois) s += `<text x="${X(p.x)}" y="${Y(p.z)}" fill="${col}" font-size="15" font-weight="700" text-anchor="middle">${ch}</text>`;
  const px = X(state.player.pos.x), py = Y(state.player.pos.z);
  s += `<polygon points="${px},${py - 9} ${px + 6},${py + 6} ${px - 6},${py + 6}" fill="#ffffff" stroke="#ff5fa8" stroke-width="1.5"/>`;
  s += `</svg>`;
  grid.innerHTML = s;
}

export function renderMapPanel(state) {
  drawMapGrid(state);
  const list = el("map-missions");
  list.innerHTML = MISSIONS.map((mm, i) => {
    const st = i < state.missionsDone ? "DONE" : (state.missionState.active && state.missionState.current === i ? "ACTIVE" : (i === state.missionsDone ? "ACTIVE" : "LOCKED"));
    const mark = st === "DONE" ? "✓" : (st === "ACTIVE" ? "►" : "○");
    return `<div class="map-mrow"><span>${mark} M${i + 1} — ${mm.name} — $${mm.reward}</span><b class="${st.toLowerCase()}">${st}</b></div>`;
  }).join("");
  const tier = repTier(state);
  const pct = state.completionPct ?? Math.round((state.missionsDone / 10) * 67 + (state.shells / 24) * 33 * 0.5);
  const play = `${Math.floor(state.playSeconds / 3600)}j ${String(Math.floor((state.playSeconds % 3600) / 60)).padStart(2, "0")}m`;
  el("map-stats").innerHTML =
    `Uang: $${state.cash.toLocaleString("en-US")} · REP ${tier.idx + 1} ${tier.name} (${state.rep}/2600)<br>` +
    `Selesai: ${pct}% · Misi ${state.missionsDone}/10 · Waktu main ${play}<br>` +
    `Kerang Teluk: ${state.shells}/24 · Mobil dicuri: ${state.carsStolen} · Takedown: ${state.takedowns}<br>` +
    `Lolos kejaran: ${state.escapes} · Hari ${state.day}`;
}

function drawMinimap(state) {
  const ctx = state.hudState.minimapCtx;
  const S = 148, c = S / 2, scale = S / 460;
  ctx.clearRect(0, 0, S, S);
  ctx.fillStyle = "#0d1a2e"; ctx.fillRect(0, 0, S, S);
  ctx.strokeStyle = "rgba(70,180,220,0.5)"; ctx.lineWidth = 1;
  for (const ax of CONFIG.avenueXs) { ctx.beginPath(); ctx.moveTo(c + ax * scale, 0); ctx.lineTo(c + ax * scale, S); ctx.stroke(); }
  for (const sz of CONFIG.streetZs) { ctx.beginPath(); ctx.moveTo(0, c + sz * scale); ctx.lineTo(S, c + sz * scale); ctx.stroke(); }
  ctx.fillStyle = "#1d5f8a"; ctx.fillRect(0, 0, 12, S);
  const dot = (x, z, color, r = 2.4) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(c + x * scale, c + z * scale, r, 0, 7); ctx.fill(); };
  for (const car of state.cars) dot(car.pos.x, car.pos.z, "#cfd6de", 1.6);
  for (const u of state.policeUnits) if (u.active) dot(u.pos.x, u.pos.z, Math.floor(performance.now() / 400) % 2 ? "#ff4a5a" : "#4a8aff", 2.6);
  if (state.missionState.active) {
    const st = MISSIONS[state.missionState.current].stages[state.missionState.stage];
    dot(st.at[0], st.at[1], "#ffd23c", 3.4);
  }
  const p = state.player.pos;
  ctx.save();
  ctx.translate(c + p.x * scale, c + p.z * scale);
  ctx.rotate(state.player.car ? state.player.car.heading : state.player.heading);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4, 5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function updateHud(state, dt) {
  const now = performance.now();
  el("cash-value").textContent = `$${state.cash.toLocaleString("en-US")}`;
  const hp = Math.max(0, Math.round(state.player.health));
  el("hp-bar").style.width = `${hp}%`;
  el("hp-text").textContent = String(hp);
  el("armor-bar").style.width = `${Math.round(state.player.armor)}%`;
  el("armor-text").textContent = String(Math.round(state.player.armor));
  const weapons = state.combat.weapons.map((w, i) => {
    const ammo = w.ammo === Infinity ? "∞" : `${w.ammo}/${w.mag}`;
    const label = `${w.slot} ${w.name} ${i === 0 ? "" : ammo}`;
    return i === state.player.weaponIndex ? `<b>[${label}]</b>` : label;
  }).join(" · ");
  el("weapon-list").innerHTML = weapons;
  const stars = "★".repeat(state.wanted) + "☆".repeat(5 - state.wanted);
  el("wanted-stars").innerHTML = `<span class="stars">${stars}</span><br>WANTED ${state.wanted}/5 · ${state.wanted ? "TERLIHAT" : "AMAN"}`;
  const missionNo = state.missionState.active ? state.missionState.current + 1 : Math.min(10, state.missionsDone + 1);
  el("clock-readout").textContent = `${fmtClock(state.clockMin)} · Hari ${state.day} · M${missionNo}/10 · Kerang ${state.shells}/24`;
  const st = currentStation(state);
  el("radio-readout").innerHTML = state.player.car
    ? `📻 ${st.name} · "${currentSong(state)}" · Lagu Raya`
    : `📻 ${st.name} · "${currentSong(state)}"`;
  // Kotak misi.
  const m = state.missionState;
  if (m.active) {
    const def = MISSIONS[m.current];
    el("mission-box").innerHTML =
      `<div class="mb-title">M${m.current + 1} — "${def.name}" TAHAP ${m.stage + 1}/${def.stages.length}</div>` +
      `<div>NEXT: ${def.stages[m.stage].text}</div>` +
      `<div class="mb-reward">Hadiah $${def.reward} · +${def.rep} REP</div>`;
    el("mission-box").style.display = "block";
  } else el("mission-box").style.display = "none";
  // Kotak polisi: dua unit teratas + hitungan sisanya.
  const units = state.policeUnits.filter((u) => u.active);
  if (units.length) {
    const rows = units.slice(0, 2).map((u) => `<div>${u.name} ${u.status} ${Math.round(u.distance)} m</div>`).join("");
    const more = units.length - 2 + (state.wanted >= 3 ? 1 : 0);
    el("police-box").innerHTML = `<div class="pb-title">POLISI TELUK CERAH — KODE ${state.wanted}</div>${rows}${more > 0 ? `<div>+${more} unit lain</div>` : ""}`;
    el("police-box").style.display = "block";
  } else el("police-box").style.display = "none";
  el("objective-line").textContent = currentObjective(state) + (m.active && state.shotKills ? ` — ${state.shotKills}` : "");
  // Dialog + banner.
  if (state.dialog && now < state.hudState.dialogUntil) {
    el("dialog-box").innerHTML = `<b>${state.dialog.speaker}:</b> ${state.dialog.text}`;
    el("dialog-box").style.display = "block";
  } else el("dialog-box").style.display = "none";
  if (state.banner && now < state.hudState.bannerUntil) {
    el("banner").textContent = state.banner;
    el("banner").style.display = "block";
  } else el("banner").style.display = "none";
  // Kendaraan.
  const inCar = !!state.player.car;
  el("car-cluster").style.display = inCar || state.staged === "chase" ? "block" : "none";
  if (inCar || state.staged === "chase") {
    const kmh = state.staged === "chase" ? state.shotSpeed : Math.round(Math.abs(state.player.car ? state.player.car.speed : 0) * 3.6);
    el("speed-readout").innerHTML = `${kmh}<small> KM/H</small>`;
    el("nos-bar").style.width = `${Math.round((state.player.car ? state.player.car.nos : 0.72) * 100)}%`;
    el("condition-readout").textContent = `Kondisi ${Math.round(state.player.car ? state.player.car.health : 88)}%`;
  }
  el("district-label").textContent = districtAt(state.player.pos);
  el("crosshair").style.display = !inCar && state.player.weaponIndex > 0 ? "block" : "none";
  drawMinimap(state);
  // Daftar save di pause.
  if (state.paused) {
    el("save-slots").innerHTML = listSaves().map((s) => s.empty
      ? `<div>Slot ${s.slot} — kosong</div>`
      : `<div>Slot ${s.slot} — $${s.cash.toLocaleString("en-US")} · Misi ${s.missionsDone}/10 · Hari ${s.day}</div>`).join("");
  }
}
