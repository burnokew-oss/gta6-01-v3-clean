// Save/load tiga slot di localStorage browser.
import { setWanted } from "./police.js";

const PREFIX = "teluk-cerah-save-";

export function saveGame(state, slot) {
  const data = {
    cash: state.cash, rep: state.rep, missionsDone: state.missionsDone,
    shells: state.shells, shellGot: state.shellGot, day: state.day,
    clockMin: state.clockMin, wanted: state.wanted,
    pos: { x: state.player.pos.x, z: state.player.pos.z },
    health: state.player.health, takedowns: state.takedowns,
    carsStolen: state.carsStolen, escapes: state.escapes, playSeconds: state.playSeconds,
    savedAt: Date.now(),
  };
  try { localStorage.setItem(PREFIX + slot, JSON.stringify(data)); return true; } catch { return false; }
}

export function loadGame(state, slot) {
  let raw = null;
  try { raw = localStorage.getItem(PREFIX + slot); } catch { return false; }
  if (!raw) return false;
  try {
    const d = JSON.parse(raw);
    state.cash = d.cash; state.rep = d.rep; state.missionsDone = d.missionsDone || 0;
    state.shells = d.shells || 0; state.shellGot = d.shellGot || state.shellGot;
    state.day = d.day || 1; state.clockMin = d.clockMin ?? 1080;
    state.player.pos.set(d.pos.x, 0, d.pos.z);
    state.player.health = d.health ?? 100;
    state.takedowns = d.takedowns || 0; state.carsStolen = d.carsStolen || 0;
    state.escapes = d.escapes || 0; state.playSeconds = d.playSeconds || 0;
    setWanted(state, d.wanted || 0);
    return true;
  } catch { return false; }
}

export function listSaves() {
  const out = [];
  for (let slot = 1; slot <= 3; slot++) {
    let raw = null;
    try { raw = localStorage.getItem(PREFIX + slot); } catch { raw = null; }
    if (!raw) { out.push({ slot, empty: true }); continue; }
    try {
      const d = JSON.parse(raw);
      out.push({ slot, empty: false, cash: d.cash, missionsDone: d.missionsDone, day: d.day, savedAt: d.savedAt });
    } catch { out.push({ slot, empty: true }); }
  }
  return out;
}
