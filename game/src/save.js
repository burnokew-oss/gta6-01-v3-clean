// save.js — simpan/muat 3 slot di localStorage: uang, reputasi, misi
// selesai, upgrade, dan posisi pemain.
const KEY = "teluk-cerah-save-";

export function saveToSlot(slot, state) {
  try {
    const data = {
      money: state.player.money, rep: state.player.rep,
      hp: state.player.hp, armor: state.player.armor,
      missionIdx: state.missions.idx, missionDone: state.missions.done,
      engineLevel: state.player.engineLevel, nosLevel: state.player.nosLevel,
      x: state.player.carX, z: state.player.carZ, angle: state.player.carAngle,
      ammoPistol: state.combat.ammo.pistol, ammoShotgun: state.combat.ammo.shotgun,
      savedAt: "Teluk Cerah ronde 8",
    };
    localStorage.setItem(KEY + slot, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function loadFromSlot(slot, state) {
  try {
    const raw = localStorage.getItem(KEY + slot);
    if (!raw) return false;
    const d = JSON.parse(raw);
    state.player.money = d.money; state.player.rep = d.rep;
    state.player.hp = d.hp; state.player.armor = d.armor;
    state.missions.idx = d.missionIdx; state.missions.done = d.missionDone;
    state.player.engineLevel = d.engineLevel; state.player.nosLevel = d.nosLevel;
    state.combat.ammo.pistol = d.ammoPistol; state.combat.ammo.shotgun = d.ammoShotgun;
    state.player.placeHero(d.x, d.z, d.angle);
    state.missions.placeMarker();
    return true;
  } catch { return false; }
}

export function slotSummary(slot) {
  try {
    const raw = localStorage.getItem(KEY + slot);
    if (!raw) return "Slot " + (slot + 1) + ": kosong";
    const d = JSON.parse(raw);
    return "Slot " + (slot + 1) + ": Rp" + d.money + " • misi " + d.missionDone + "/10";
  } catch { return "Slot " + (slot + 1) + ": rusak"; }
}
