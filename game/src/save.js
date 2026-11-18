// save.js — simpan dan muat Teluk Cerah, tiga slot localStorage.
// Builder sistem, rebuild #3. Kunci penyimpanan diawali judul game huruf
// kecil dengan strip, lalu kata save, lalu nomor slot. Slot menyimpan uang,
// progres misi, posisi pemain, wanted, jam dan hari, mobil terakhir, kerang,
// reputasi, dan waktu main. Semua pemanggilan localStorage dibungkus guard.

const KEY_PREFIX = 'teluk-cerah-save-';
const SLOT_COUNT = 3;

function keyForSlot(slot) {
  return KEY_PREFIX + slot;
}

function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch (err) {
    return null;
  }
}

function playerPosition(state) {
  const player = state.player;
  if (!player) return { x: 0, z: 0 };
  const pos = player.position || player.pos;
  if (!pos) return { x: 0, z: 0 };
  return { x: pos.x || 0, y: pos.y || 0, z: pos.z || 0 };
}

function playerHeading(state) {
  const player = state.player;
  if (!player) return 0;
  if (typeof player.heading === 'number') return player.heading;
  if (typeof player.rotation === 'number') return player.rotation;
  return 0;
}

function carSummary(state) {
  const player = state.player || {};
  const car = player.car || player.vehicle || null;
  if (!car) return null;
  return {
    type: car.type || 'sedan',
    color: car.color || 'red',
    condition: typeof car.condition === 'number' ? car.condition : 100,
    nos: typeof car.nos === 'number' ? car.nos : 100,
  };
}

function clockOf(state) {
  if (state.clock && typeof state.clock.hour === 'number') {
    return { hour: state.clock.hour, minute: state.clock.minute || 0, day: state.clock.day || 1 };
  }
  return {
    hour: typeof state.hour === 'number' ? state.hour : 21,
    minute: typeof state.minute === 'number' ? state.minute : 0,
    day: typeof state.day === 'number' ? state.day : 1,
  };
}

export function saveGame(state, slot) {
  const storage = safeStorage();
  if (!storage) return false;
  const number = Number(slot);
  if (!Number.isInteger(number) || number < 1 || number > SLOT_COUNT) return false;
  const missions = state.missions || {};
  const payload = {
    version: 1,
    savedAt: Date.now(),
    cash: typeof state.cash === 'number' ? state.cash : typeof state.money === 'number' ? state.money : 0,
    missions: {
      current: missions.current || 0,
      stage: missions.stage || 0,
      done: Array.isArray(missions.done) ? missions.done.slice() : [],
    },
    position: playerPosition(state),
    heading: playerHeading(state),
    wanted: typeof state.wanted === 'number' ? state.wanted : 0,
    clock: clockOf(state),
    car: carSummary(state),
    shells: typeof state.shells === 'number' ? state.shells : 0,
    shellsTotal: 24,
    reputation: state.reputation
      ? { points: state.reputation.points || 0, tier: state.reputation.tier || 'Anak Baru', level: state.reputation.level || 1 }
      : { points: 0, tier: 'Anak Baru', level: 1 },
    playTime: typeof state.playTime === 'number' ? state.playTime : 0,
    stats: state.stats ? { ...state.stats } : {},
  };
  try {
    storage.setItem(keyForSlot(number), JSON.stringify(payload));
    return true;
  } catch (err) {
    return false;
  }
}

export function loadGame(state, slot) {
  const storage = safeStorage();
  if (!storage) return false;
  const number = Number(slot);
  if (!Number.isInteger(number) || number < 1 || number > SLOT_COUNT) return false;
  let raw = null;
  try {
    raw = storage.getItem(keyForSlot(number));
  } catch (err) {
    return false;
  }
  if (!raw) return false;
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return false;
  }
  if (!data || typeof data !== 'object') return false;
  if (typeof data.cash === 'number') {
    if (typeof state.cash === 'number') state.cash = data.cash;
    else if (typeof state.money === 'number') state.money = data.cash;
    else state.cash = data.cash;
  }
  if (data.missions) {
    state.missions = state.missions || {};
    state.missions.current = data.missions.current || 0;
    state.missions.stage = data.missions.stage || 0;
    state.missions.done = Array.isArray(data.missions.done) ? data.missions.done.slice() : [];
    state.missions.dialogOpen = false;
    state.missions.dialogQueue = [];
    state.missions.dialogIndex = 0;
  }
  if (data.position && state.player) {
    const pos = state.player.position || state.player.pos;
    if (pos) {
      pos.x = data.position.x || 0;
      if (typeof data.position.y === 'number') pos.y = data.position.y;
      pos.z = data.position.z || 0;
    }
    if (typeof data.heading === 'number') {
      if (typeof state.player.heading === 'number') state.player.heading = data.heading;
      if (typeof state.player.rotation === 'number') state.player.rotation = data.heading;
    }
  }
  if (typeof data.wanted === 'number') state.wanted = data.wanted;
  if (data.clock) {
    if (state.clock) {
      state.clock.hour = data.clock.hour;
      state.clock.minute = data.clock.minute;
      state.clock.day = data.clock.day;
    } else {
      state.hour = data.clock.hour;
      state.minute = data.clock.minute;
      state.day = data.clock.day;
    }
  }
  if (typeof data.shells === 'number') state.shells = data.shells;
  if (data.reputation) state.reputation = { ...data.reputation };
  if (typeof data.playTime === 'number') state.playTime = data.playTime;
  if (data.stats) state.stats = { ...state.stats, ...data.stats };
  state.loadedCar = data.car || null;
  return true;
}

export function listSaves() {
  const storage = safeStorage();
  const summaries = [];
  for (let slot = 1; slot <= SLOT_COUNT; slot += 1) {
    let raw = null;
    try {
      raw = storage ? storage.getItem(keyForSlot(slot)) : null;
    } catch (err) {
      raw = null;
    }
    if (!raw) {
      summaries.push({ slot, exists: false });
      continue;
    }
    try {
      const data = JSON.parse(raw);
      summaries.push({
        slot,
        exists: true,
        cash: data.cash || 0,
        mission: data.missions && data.missions.current ? data.missions.current : (data.missions && data.missions.done ? data.missions.done.length : 0),
        missionsDone: data.missions && Array.isArray(data.missions.done) ? data.missions.done.length : 0,
        day: data.clock ? data.clock.day : 1,
        hour: data.clock ? data.clock.hour : 0,
        minute: data.clock ? data.clock.minute : 0,
        shells: data.shells || 0,
        repTier: data.reputation ? data.reputation.tier || 'Anak Baru' : 'Anak Baru',
        repLevel: data.reputation ? data.reputation.level || 1 : 1,
        savedAt: data.savedAt || 0,
      });
    } catch (err) {
      summaries.push({ slot, exists: false, corrupt: true });
    }
  }
  return summaries;
}

export function saveSlotCount() {
  return SLOT_COUNT;
}

export function describeSave(summary) {
  if (!summary || !summary.exists) return 'Slot ' + (summary ? summary.slot : '?') + ' — kosong';
  return (
    'Slot ' + summary.slot + ' — $' + (summary.cash || 0).toLocaleString('en-US') +
    ' · Misi ' + (summary.missionsDone || 0) + '/10 · Hari ' + (summary.day || 1) +
    ' · REP ' + (summary.repLevel || 1) + ' ' + (summary.repTier || 'Anak Baru') +
    ' · Kerang ' + (summary.shells || 0) + '/24'
  );
}
