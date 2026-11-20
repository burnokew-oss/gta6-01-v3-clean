// save.js — simpan/muat 3 slot di localStorage: uang, reputasi, misi
// selesai, upgrade, posisi.
const KEY = (i) => `teluk-cerah-save-${i}`;

export function saveGame(slot, data) {
  try {
    localStorage.setItem(KEY(slot), JSON.stringify({ ...data, savedAt: new Date().toISOString() }));
    return true;
  } catch { return false; }
}
export function loadGame(slot) {
  try {
    const raw = localStorage.getItem(KEY(slot));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function slotSummary(slot) {
  const d = loadGame(slot);
  if (!d) return `Slot ${slot + 1}: kosong`;
  return `Slot ${slot + 1}: $${d.money} · ${d.missionsDone} misi · rep ${d.rep}`;
}
export function collectState(game) {
  return {
    money: game.player.money,
    rep: game.player.rep,
    hp: game.player.hp,
    missionsDone: game.missions.done,
    missionIndex: game.missions.index,
    upgrades: [...game.shops.owned],
    ammo: { ...game.combat.ammo },
    pos: { x: game.player.pos.x, z: game.player.pos.z },
  };
}
export function applyState(game, d) {
  if (!d) return;
  game.player.money = d.money ?? game.player.money;
  game.player.rep = d.rep ?? 0;
  game.player.hp = d.hp ?? 100;
  game.missions.done = d.missionsDone ?? 0;
  game.missions.index = d.missionIndex ?? 0;
  game.shops.owned = new Set(d.upgrades ?? []);
  Object.assign(game.combat.ammo, d.ammo ?? {});
  if (d.pos) game.player.pos.set(d.pos.x, 0, d.pos.z);
}
