// Teluk Cerah — save games: three localStorage slots holding money,
// reputation, story progress, garage upgrades and the player's position.

const KEY = (slot) => `telukcerah-save-${slot}`;

export function saveGame(slot, data) {
  try {
    localStorage.setItem(KEY(slot), JSON.stringify({ ...data, savedAt: Date.now() }));
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
  if (!d) return "Kosong";
  return `$${d.money} · Misi ${Math.min(10, (d.missionIndex ?? 0) + 1)}/10 · Rep ${d.rep}`;
}
