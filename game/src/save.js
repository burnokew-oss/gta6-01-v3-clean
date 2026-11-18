// Save/load localStorage, 3 slot. Hanya data progres, bukan seluruh dunia.
//
// Format di disk: localStorage[SAVE_KEY] = JSON array 3 elemen, tiap
// elemen null atau objek progres + `savedAt` (string ISO). Slot kosong
// = null. Apa pun yang rusak dianggap "belum ada save" supaya game
// tidak pernah crash saat load.
import { SAVE_KEY } from './config.js';

export const SLOT_COUNT = 3;

function emptySlots() {
  return Array.from({ length: SLOT_COUNT }, () => null);
}

function parseSaves(raw) {
  if (!raw) return emptySlots();
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : emptySlots();
  } catch {
    return emptySlots();
  }
}

export function loadSaves() {
  try {
    return parseSaves(window.localStorage.getItem(SAVE_KEY));
  } catch {
    return emptySlots();
  }
}

export function writeSave(slot, data) {
  const saves = loadSaves();
  saves[slot] = { ...data, savedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    return true;
  } catch {
    return false;
  }
}

export function readSave(slot) {
  return loadSaves()[slot] || null;
}
