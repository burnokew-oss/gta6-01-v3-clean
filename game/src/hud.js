// hud.js — seluruh HUD Teluk Cerah: uang, health, armor, senjata, wanted,
// jam, radio, minimap, dialog, banner, objektif, kecepatan, NOS, kondisi,
// strip fitur, pause, save slots, peta layar penuh, dan layar judul.
// Builder sistem, rebuild #3. Elemen dikenali lewat id dari spesifikasi;
// elemen yang belum ada di halaman dibuat di sini dengan gaya inline.

import { listSaves } from './save.js';
import { radioLine } from './radio.js';

const FEATURE_TEXT = '10 STORY MISSIONS · HELICOPTER CHASES · POLICE RESPONSE · RADIO 3 STATIONS · GARAGE UPGRADES · 3 SAVE SLOTS · 24 SHELLS';

const HUD_STYLES = {
  'cash-value': 'position:fixed;left:14px;top:10px;z-index:40;color:#7dff9a;font-size:26px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;text-shadow:0 2px 6px rgba(0,0,0,0.8);',
  'hp-bar': 'position:fixed;left:14px;top:44px;z-index:40;width:170px;height:10px;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.35);border-radius:5px;overflow:hidden;',
  'hp-text': 'position:fixed;left:190px;top:42px;z-index:40;color:#fff;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.8);',
  'armor-bar': 'position:fixed;left:14px;top:60px;z-index:40;width:170px;height:8px;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.35);border-radius:4px;overflow:hidden;',
  'weapon-list': 'position:fixed;left:14px;top:76px;z-index:40;color:#eaf6ff;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.8);',
  'mission-box': 'position:fixed;left:14px;top:104px;z-index:40;width:250px;background:rgba(8,14,24,0.78);border:1px solid #ffd23f;border-radius:8px;padding:10px 12px;color:#ffe9a8;font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.45;',
  'police-box': 'position:fixed;left:14px;top:230px;z-index:40;width:250px;background:rgba(8,14,24,0.78);border:1px solid #3f7dff;border-radius:8px;padding:10px 12px;color:#cfe4ff;font-size:13px;font-family:Arial,Helvetica,sans-serif;line-height:1.45;',
  'wanted-stars': 'position:fixed;right:14px;top:10px;z-index:40;color:#ffd23f;font-size:22px;letter-spacing:2px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 2px 6px rgba(0,0,0,0.8);text-align:right;',
  'clock-readout': 'position:fixed;right:14px;top:64px;z-index:40;color:#fff;font-size:14px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.8);text-align:right;line-height:1.5;',
  'radio-readout': 'position:fixed;right:14px;top:108px;z-index:40;color:#7dff9a;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.8);text-align:right;line-height:1.4;',
  'minimap': 'position:fixed;left:14px;bottom:14px;z-index:40;width:150px;height:150px;border-radius:50%;border:2px solid rgba(255,255,255,0.65);background:rgba(5,10,18,0.85);',
  'dialog-box': 'position:fixed;left:50%;bottom:86px;transform:translateX(-50%);z-index:50;width:520px;max-width:92vw;background:rgba(8,14,24,0.92);border:1px solid #ffd23f;border-radius:10px;padding:12px 16px;color:#fff;font-size:15px;font-family:Arial,Helvetica,sans-serif;line-height:1.5;display:none;',
  'objective-line': 'position:fixed;left:50%;bottom:44px;transform:translateX(-50%);z-index:40;background:rgba(0,0,0,0.6);color:#fff;font-size:14px;font-family:Arial,Helvetica,sans-serif;padding:7px 16px;border-radius:16px;white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis;',
  'banner': 'position:fixed;left:50%;top:52px;transform:translateX(-50%);z-index:55;background:rgba(120,10,20,0.92);color:#ffd9d9;font-size:17px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;padding:8px 20px;border-radius:6px;display:none;letter-spacing:1px;',
  'speed-readout': 'position:fixed;right:16px;bottom:16px;z-index:40;color:#fff;font-size:42px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;text-shadow:0 2px 8px rgba(0,0,0,0.85);text-align:right;line-height:1;',
  'nos-bar': 'position:fixed;right:16px;bottom:76px;z-index:40;width:150px;height:10px;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.35);border-radius:5px;overflow:hidden;',
  'condition-readout': 'position:fixed;right:16px;bottom:92px;z-index:40;color:#7dff9a;font-size:13px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 1px 4px rgba(0,0,0,0.8);text-align:right;',
  'feature-strip': 'position:fixed;left:50%;top:8px;transform:translateX(-50%);z-index:39;color:#7dff9a;font-size:12px;font-family:Arial,Helvetica,sans-serif;letter-spacing:1px;text-shadow:0 1px 4px rgba(0,0,0,0.9);white-space:nowrap;',
  'crosshair': 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:35;color:#fff;font-size:26px;font-family:Arial,Helvetica,sans-serif;text-shadow:0 0 6px rgba(0,0,0,0.9);display:none;pointer-events:none;',
};

const SPEAKER_COLORS = {
  'Bu Sari': '#ff9f2e',
  Dimas: '#2eff8a',
  Nadia: '#c07dff',
  Sinta: '#ffb347',
  Bimo: '#ff5b5b',
  Raka: '#3fd2ff',
};

const PORTRAITS = [
  { name: 'Raka', role: 'Protagonis', initial: 'R', color: '#3f7dff' },
  { name: 'Bu Sari', role: 'Fixer', initial: 'B', color: '#ff9f2e' },
  { name: 'Dimas', role: 'Mekanik', initial: 'D', color: '#2eff8a' },
  { name: 'Nadia', role: 'Pembalap', initial: 'N', color: '#c07dff' },
  { name: 'Sinta', role: 'Peretas', initial: 'S', color: '#ffb347' },
  { name: 'Bimo', role: 'Penjaga', initial: 'B', color: '#ff5b5b' },
];

function ensureHudState(state) {
  if (!state.hud) {
    state.hud = {
      elements: {},
      cache: {},
      bannerTimer: null,
      mapOpen: false,
      titleSignature: '',
      mapSignature: '',
    };
  }
  return state.hud;
}

function getOrCreateElement(hud, id) {
  if (hud.elements[id]) return hud.elements[id];
  let el = document.getElementById(id);
  if (!el) {
    if (id === 'minimap') {
      el = document.createElement('canvas');
      el.width = 300;
      el.height = 300;
    } else {
      el = document.createElement('div');
    }
    el.id = id;
    if (HUD_STYLES[id]) el.style.cssText = HUD_STYLES[id];
    document.body.appendChild(el);
  }
  hud.elements[id] = el;
  return el;
}

function setText(hud, id, text) {
  const el = getOrCreateElement(hud, id);
  if (hud.cache[id] !== text) {
    hud.cache[id] = text;
    el.textContent = text;
  }
}

function setHtml(hud, id, html) {
  const el = getOrCreateElement(hud, id);
  if (hud.cache[id] !== html) {
    hud.cache[id] = html;
    el.innerHTML = html;
  }
}

function cashOf(state) {
  if (typeof state.cash === 'number') return state.cash;
  if (typeof state.money === 'number') return state.money;
  return 0;
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

function playerPosition(state) {
  const player = state.player;
  if (!player) return { x: 0, z: 0 };
  const pos = player.position || player.pos;
  if (!pos) return { x: 0, z: 0 };
  return { x: pos.x || 0, z: pos.z || 0 };
}

function districtAt(state, pos) {
  if (state.city && typeof state.city.districtAt === 'function') {
    try {
      const name = state.city.districtAt(pos.x, pos.z);
      if (name) return name;
    } catch (err) { /* abaikan */ }
  }
  if (pos.z > 96) return 'Pelabuhan';
  if (pos.z < -96) return 'Perumahan';
  if (pos.x < -80) return 'Marina';
  if (pos.x > 40) return 'CBD';
  return 'Kota Tua';
}

function weaponsOf(state) {
  const combat = state.combat || {};
  const player = state.player || {};
  if (Array.isArray(combat.weapons) && combat.weapons.length) return combat.weapons;
  if (Array.isArray(player.weapons) && player.weapons.length) return player.weapons;
  return [
    { slot: 1, name: 'Tinju', ammo: null, reserve: null },
    { slot: 2, name: 'Pistol', ammo: combat.pistolAmmo ?? 12, reserve: combat.pistolReserve ?? 12 },
    { slot: 3, name: 'SG', ammo: combat.shotgunAmmo ?? 0, reserve: combat.shotgunReserve ?? 0 },
  ];
}

function policeUnitsOf(state) {
  const police = state.police;
  if (!police) return [];
  if (Array.isArray(police)) return police;
  if (Array.isArray(police.units)) return police.units;
  return [];
}

function formatClock(clock) {
  const hh = String(Math.floor(clock.hour)).padStart(2, '0');
  const mm = String(Math.floor(clock.minute)).padStart(2, '0');
  return hh + ':' + mm;
}

function formatPlayTime(minutes) {
  const total = Math.max(0, Math.floor(minutes || 0));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours + 'j ' + mins + 'm';
}

function missionBoxHtml(state) {
  const missions = state.missions || {};
  const current = missions.current || 0;
  if (!current) {
    return '<b style="color:#ffd23f;">BEBAS</b><br>Jelajahi Teluk Cerah — cari kerang, curi mobil, atau mulai misi berikutnya dari Bu Sari.';
  }
  const list = state.missionsList || null;
  let mission = null;
  if (Array.isArray(list)) mission = list.find((m) => m.number === current) || null;
  const stageIndex = missions.stage || 0;
  const stageCount = mission && mission.stages ? mission.stages.length : 2;
  const reward = mission ? mission.reward : 0;
  const rep = mission ? mission.rep || 0 : 0;
  const name = mission ? mission.name : 'Misi ' + current;
  const stage = mission && mission.stages ? mission.stages[stageIndex] : null;
  const next = stage ? stage.objective : '';
  return (
    '<b style="color:#ffd23f;">M' + current + ' — "' + name + '" TAHAP ' + (stageIndex + 1) + '/' + stageCount + '</b><br>' +
    'NEXT: ' + next + '<br>' +
    '<span style="color:#7dff9a;">Hadiah $' + reward + ' · +' + rep + ' REP</span>'
  );
}

function policeBoxHtml(state) {
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  const units = policeUnitsOf(state);
  if (wanted === 0 && units.length === 0) {
    return '<b style="color:#7dff9a;">POLISI TELUK CERAH — TENANG</b><br>Tidak ada pengejaran. Jaga sikapmu, Raka.';
  }
  const shown = units.slice(0, 4);
  const rows = shown.map((unit) => {
    const distance = typeof unit.distance === 'number' ? Math.round(unit.distance) + ' m' : '—';
    const status = (unit.status || 'PURSUIT').toUpperCase();
    return '<div style="display:flex;justify-content:space-between;gap:8px;"><span style="white-space:nowrap;"><span style="color:#ffd23f;">' + (unit.name || 'UNIT') + '</span> &nbsp; ' + status + '</span><span style="white-space:nowrap;flex-shrink:0;">' + distance + '</span></div>';
  }).join('');
  const extra = units.length > 4 ? '<br>+' + (units.length - 4) + ' unit lain' : '';
  return '<b style="color:#cfe4ff;">POLISI TELUK CERAH — KODE ' + wanted + '</b><br>' + rows + extra;
}

function drawMinimap(state) {
  const hud = ensureHudState(state);
  const canvas = getOrCreateElement(hud, 'minimap');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  const center = size / 2;
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(center, center, center - 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#0a1420';
  ctx.fillRect(0, 0, size, size);
  const range = 320;
  const toMap = (x, z) => ({ x: center + (x / range) * size, y: center + (z / range) * size });
  ctx.strokeStyle = 'rgba(90,160,200,0.5)';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    const a = toMap(i * 64, -160);
    const b = toMap(i * 64, 160);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const c = toMap(-160, i * 64);
    const d = toMap(160, i * 64);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(63,210,255,0.85)';
  ctx.lineWidth = 5;
  ctx.strokeRect(14, 14, size - 28, size - 28);
  const pos = playerPosition(state);
  const shells = state.shellPositions || [];
  ctx.fillStyle = '#ffd23f';
  for (const shell of shells.slice(0, 24)) {
    const p = toMap(shell.x, shell.z);
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  const cars = Array.isArray(state.cars) ? state.cars : [];
  for (const car of cars.slice(0, 30)) {
    const cpos = car.position || car.pos;
    if (!cpos) continue;
    const p = toMap(cpos.x, cpos.z);
    ctx.fillStyle = car.type === 'police' ? '#3f7dff' : '#e8e8e8';
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  const units = policeUnitsOf(state);
  for (const unit of units) {
    if (!unit.position) continue;
    const p = toMap(unit.position.x, unit.position.z);
    ctx.fillStyle = '#ff5b5b';
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  const missions = state.missions || {};
  if (missions.current) {
    const target = state.missionTarget;
    if (target && typeof target.x === 'number') {
      const p = toMap(target.x, target.z);
      const pulse = 5 + Math.sin((state.playTime || 0) * 4) * 1.5;
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2); ctx.fill();
    }
  }
  const player = state.player || {};
  const heading = player.heading || player.rotation || 0;
  const pp = toMap(pos.x, pos.z);
  ctx.save();
  ctx.translate(pp.x, pp.y);
  ctx.rotate(-heading);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6, 7);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,80,80,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(pp.x, pp.y, 16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  const district = districtAt(state, pos);
  ctx.fillText(district, center, size - 10);
  setText(hud, 'minimap-label', district);
}

function renderTitleOverlay(state) {
  const hud = ensureHudState(state);
  const overlay = getOrCreateElement(hud, 'title-overlay');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:9vh;background:linear-gradient(rgba(4,8,16,0.55),rgba(4,8,16,0.78));color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:auto;';
  const saves = listSaves();
  const first = saves.find((s) => s.exists);
  const staged = state.titleContinue || null;
  let continueBox = '';
  if (staged) {
    continueBox =
      '<div style="border:1px solid #2eff8a;border-radius:8px;padding:12px 26px;margin:18px 0 6px;color:#7dff9a;font-size:17px;background:rgba(0,40,20,0.45);text-align:center;">' +
      'LANJUTKAN — Misi ' + staged.mission + '/10 · $' + staged.cash.toLocaleString('en-US') +
      ' · Hari ' + staged.day + ' · REP ' + staged.repLevel + ' ' + staged.rep +
      ' · Kerang ' + staged.shells + '/24</div>';
  } else if (first) {
    continueBox =
      '<div style="border:1px solid #2eff8a;border-radius:8px;padding:12px 26px;margin:18px 0 6px;color:#7dff9a;font-size:17px;background:rgba(0,40,20,0.45);text-align:center;">' +
      'LANJUTKAN — Misi ' + (first.missionsDone + 1) + '/10 · $' + first.cash.toLocaleString('en-US') +
      ' · Hari ' + first.day + ' · REP ' + first.repLevel + ' ' + first.repTier + ' · Kerang ' + first.shells + '/24</div>';
  } else {
    continueBox =
      '<div style="border:1px solid #2eff8a;border-radius:8px;padding:12px 26px;margin:18px 0 6px;color:#7dff9a;font-size:17px;background:rgba(0,40,20,0.45);text-align:center;">' +
      'LANJUTKAN — Belum ada save · mulai game baru dulu, Raka.</div>';
  }
  const portraits = PORTRAITS.map((p) => (
    '<div style="text-align:center;width:104px;">' +
    '<div style="width:76px;height:76px;border-radius:50%;background:' + p.color + ';border:3px solid #fff;margin:0 auto;' +
    'display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:bold;color:#fff;">' + p.initial + '</div>' +
    '<div style="margin-top:6px;font-size:16px;">' + p.name + '</div>' +
    '<div style="color:#bcd6e6;font-size:13px;">' + p.role + '</div></div>'
  )).join('');
  const controls = [
    ['WASD', 'Walk / drive'],
    ['Mouse', 'Aim · Click to shoot'],
    ['Shift', 'Sprint / NOS'],
    ['F', 'Enter / steal vehicle'],
    ['E', 'Interact · next'],
    ['R', 'Reload · radio (di mobil)'],
    ['M', 'City map'],
    ['Esc', 'Pause'],
  ].map(([key, desc]) => (
    '<div style="display:flex;gap:14px;padding:3px 0;"><span style="color:#ffd23f;width:52px;font-weight:bold;">' + key + '</span><span>' + desc + '</span></div>'
  )).join('');
  overlay.innerHTML =
    '<div style="font-size:84px;font-weight:900;letter-spacing:4px;line-height:1;background:linear-gradient(90deg,#ff7a18,#ff2e88,#3f7dff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 4px 30px rgba(0,0,0,0.4);">TELUK CERAH</div>' +
    '<div style="margin-top:8px;font-size:19px;letter-spacing:3px;color:#fff;">OPEN-WORLD CRIME 3D · 10 MISI · HELIKOPTER · RADIO · GARAGE</div>' +
    '<div style="margin-top:6px;font-size:16px;color:#ffd23f;font-style:italic;">Tiga tahun merantau, Raka pulang ke Teluk Cerah.</div>' +
    '<div style="display:flex;gap:18px;margin-top:26px;">' + portraits + '</div>' +
    '<div style="display:flex;gap:26px;align-items:flex-start;margin-top:8px;">' +
    '<div>' + continueBox +
    '<div style="text-align:center;margin-top:14px;font-size:19px;color:#7dff9a;">ENTER — New Game</div>' +
    '<div style="text-align:center;margin-top:6px;font-size:19px;color:#7dff9a;">L — Lanjutkan save</div>' +
    '<div style="text-align:center;margin-top:18px;color:#cfe4ff;font-size:14px;line-height:1.6;">WASD gerak · E masuk mobil · F curi · Klik tembak · R reload / radio · Shift NOS · M peta · N mute<br>Semua nama, kota, dan cerita orisinal. Bukan GTA.</div>' +
    '</div>' +
    '<div style="border:1px solid #3fd2ff;border-radius:10px;padding:14px 18px;background:rgba(8,14,24,0.72);width:250px;">' +
    '<div style="color:#3fd2ff;font-size:17px;font-weight:bold;letter-spacing:2px;margin-bottom:8px;">HOW TO PLAY</div>' + controls + '</div>' +
    '</div>';
  hud.titleSignature = JSON.stringify({ saves: listSaves(), staged: state.titleContinue || null });
}

function renderMapOverlay(state) {
  const hud = ensureHudState(state);
  const overlay = getOrCreateElement(hud, 'map-overlay');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:65;display:flex;flex-direction:column;background:rgba(4,8,16,0.88);color:#fff;font-family:Arial,Helvetica,sans-serif;padding:22px 30px;overflow:auto;';
  const missions = state.missions || {};
  const doneList = Array.isArray(missions.done) ? missions.done : [];
  const list = state.missionsList || [];
  const missionRows = [];
  for (let n = 1; n <= 10; n++) {
    const entry = list.find((m) => m.number === n) || { name: 'Misi ' + n, reward: 0 };
    let status = 'LOCKED';
    let color = '#8fa8b8';
    if (doneList.includes(n)) { status = 'DONE'; color = '#7dff9a'; }
    else if (missions.current === n) { status = 'ACTIVE'; color = '#ffd23f'; }
    else if (n === doneList.length + 1) { status = 'ACTIVE'; color = '#ffd23f'; }
    const giver = n === 4 ? 'Nadia' : n === 7 || n === 8 ? 'Sinta' : 'Bu Sari';
    missionRows.push(
      '<div style="display:flex;justify-content:space-between;padding:3px 0;color:' + color + ';">' +
      '<span><b>' + (doneList.includes(n) ? '✓' : missions.current === n ? '▶' : '○') + '</b> M' + n + ' — ' + entry.name + ' — $' + entry.reward + '</span>' +
      '<span style="font-weight:bold;">' + status + '</span></div>'
    );
  }
  const stats = state.stats || {};
  const rep = state.reputation || { points: 0, tier: 'Anak Baru', level: 1 };
  const clock = clockOf(state);
  const missionsDone = doneList.length;
  // Penyelesaian menggabungkan misi (70%) dan kerang (30%): 8/10 misi dan
  // 9/24 kerang menghasilkan 67%, sesuai spesifikasi shot peta.
  const completion = Math.round((0.7 * (missionsDone / 10) + 0.3 * ((state.shells || 0) / 24)) * 100);
  const legend = [
    ['●', 'Misi / objektif', '#ffd23f', 'H', 'Safehouse', '#7dff9a'],
    ['$', 'Toko senjata', '#7dff9a', 'G', 'Garage', '#7dff9a'],
    ['●', 'Kerang Teluk', '#ffd23f', '+', 'Rumah sakit', '#ff8a8a'],
    ['P', 'Kantor polisi', '#3f7dff', '●', 'Musuh', '#ff5b5b'],
    ['▲', 'Kamu', '#ffffff', '●', 'Helikopter', '#ff9f2e'],
    ['T', 'Taksi (T)', '#ffd23f', '—', 'Jalan raya', '#9fc6d8'],
  ].map(([a, b, c, d, e, f]) => (
    '<div style="display:flex;justify-content:space-between;padding:2px 0;">' +
    '<span><span style="color:' + c + ';font-weight:bold;">' + a + '</span> ' + b + '</span>' +
    '<span><span style="color:' + f + ';font-weight:bold;">' + d + '</span> ' + e + '</span></div>'
  )).join('');
  overlay.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
    '<div><div style="font-size:34px;font-weight:900;color:#ffd23f;letter-spacing:2px;">PETA TELUK CERAH</div>' +
    '<div style="color:#9fc6d8;font-size:14px;margin-top:2px;">M / Esc — tutup peta</div></div>' +
    '<div style="text-align:right;"><div style="font-size:20px;font-weight:bold;color:#ffd23f;">MISI CERITA</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:28px;margin-top:14px;">' +
    '<div style="flex:1;"><canvas id="map-canvas" width="620" height="620" style="width:100%;max-width:620px;border:2px solid #3fd2ff;border-radius:6px;background:#081120;"></canvas></div>' +
    '<div style="width:430px;flex-shrink:0;">' +
    '<div style="font-size:15px;line-height:1.7;">' + missionRows.join('') + '</div>' +
    '<div style="font-size:20px;font-weight:bold;color:#ffd23f;margin-top:14px;">STATISTIK</div>' +
    '<div style="font-size:15px;line-height:1.7;">' +
    'Uang: $' + cashOf(state).toLocaleString('en-US') + ' · REP ' + (rep.level || 1) + ' ' + (rep.tier || 'Anak Baru') + ' (' + (rep.points || 0) + '/2600)<br>' +
    'Selesai: ' + completion + '% · Misi ' + missionsDone + '/10 · Waktu main ' + formatPlayTime(state.playTime || 0) + '<br>' +
    'Kerang Teluk: ' + (state.shells || 0) + '/24 · Mobil dicuri: ' + (stats.carsStolen || 0) + '<br>' +
    'Takedown: ' + (stats.takedowns || 0) + ' · Lolos kejaran: ' + (stats.escapes || 0) + ' · Hari ' + clock.day +
    '</div>' +
    '<div style="font-size:20px;font-weight:bold;color:#ffd23f;margin-top:14px;">LEGENDA</div>' +
    '<div style="font-size:14px;line-height:1.5;">' + legend + '</div>' +
    '</div></div>' +
    '<div style="margin-top:16px;color:#7dff9a;font-size:13px;letter-spacing:1px;">' + FEATURE_TEXT + '</div>';
  drawMapCanvas(state);
  hud.mapSignature = JSON.stringify({ cash: cashOf(state), done: doneList, current: missions.current, shells: state.shells });
}

function drawMapCanvas(state) {
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const size = canvas.width;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = '#081120';
  ctx.fillRect(0, 0, size, size);
  const cols = 6;
  const rows = 5;
  const cellW = size / cols;
  const cellH = size / rows;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) ctx.fillRect(c * cellW + 3, r * cellH + 3, cellW - 6, cellH - 6);
    }
  }
  ctx.strokeStyle = '#19c8e8';
  ctx.lineWidth = 3;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, size); ctx.stroke();
  }
  for (let r = 0; r <= rows; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(size, r * cellH); ctx.stroke();
  }
  ctx.fillStyle = '#9fc6d8';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  for (let c = 0; c < cols; c++) {
    ctx.fillText(String.fromCharCode(65 + c), c * cellW + cellW / 2, 20);
  }
  for (let r = 0; r < rows; r++) {
    ctx.fillText(String(r + 1), 14, r * cellH + cellH / 2 + 6);
  }
  const labels = [
    { text: 'Perumahan', x: 2.5, y: 0.6, color: '#7dff9a' },
    { text: 'Marina', x: 0.6, y: 2.4, color: '#ffd23f' },
    { text: 'Kota Tua', x: 2.0, y: 2.7, color: '#ff9f2e' },
    { text: 'CBD', x: 4.4, y: 2.4, color: '#3fd2ff' },
    { text: 'Pelabuhan', x: 2.6, y: 4.5, color: '#ff5b8a' },
  ];
  ctx.font = 'bold 22px Arial';
  for (const label of labels) {
    ctx.fillStyle = label.color;
    ctx.fillText(label.text, label.x * cellW, label.y * cellH);
  }
  const toMap = (x, z) => ({ x: size / 2 + (x / 320) * size, y: size / 2 + (z / 320) * size });
  const shells = state.shellPositions || [];
  ctx.fillStyle = '#ffd23f';
  for (const shell of shells.slice(0, 24)) {
    const p = toMap(shell.x, shell.z);
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  const target = state.missionTarget;
  const pos = playerPosition(state);
  if (target && typeof target.x === 'number') {
    const from = toMap(pos.x, pos.z);
    const to = toMap(target.x, target.z);
    const mid = { x: to.x, y: from.y };
    ctx.strokeStyle = '#ffd23f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(mid.x, mid.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.arc(to.x, to.y, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(mid.x, mid.y, 5, 0, Math.PI * 2); ctx.fill();
  }
  const pp = toMap(pos.x, pos.z);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(pp.x, pp.y - 12);
  ctx.lineTo(pp.x + 10, pp.y + 9);
  ctx.lineTo(pp.x - 10, pp.y + 9);
  ctx.closePath();
  ctx.fill();
}

function renderPauseOverlay(state) {
  const hud = ensureHudState(state);
  const overlay = getOrCreateElement(hud, 'pause-overlay');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:68;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(4,8,16,0.82);color:#fff;font-family:Arial,Helvetica,sans-serif;';
  const saves = listSaves();
  const slots = saves.map((s) => {
    const label = s.exists
      ? 'Slot ' + s.slot + ' — $' + s.cash.toLocaleString('en-US') + ' · Misi ' + (s.missionsDone || 0) + '/10 · Hari ' + s.day
      : 'Slot ' + s.slot + ' — kosong';
    return '<div style="padding:6px 0;color:#cfe4ff;">' + label + '</div>';
  }).join('');
  overlay.innerHTML =
    '<div style="font-size:44px;font-weight:900;letter-spacing:4px;">JEDA</div>' +
    '<div style="margin-top:10px;font-size:17px;color:#cfe4ff;line-height:2;text-align:center;">Esc — Lanjutkan<br>1 / 2 / 3 — Simpan ke slot<br>L — Muat save<br>Q — Kembali ke layar judul</div>' +
    '<div id="save-slots" style="margin-top:18px;border:1px solid #3fd2ff;border-radius:8px;padding:12px 20px;background:rgba(8,14,24,0.7);">' + slots + '</div>';
  const slotsEl = document.getElementById('save-slots');
  if (slotsEl) hud.elements['save-slots'] = slotsEl;
}

export function createHud(state) {
  const hud = ensureHudState(state);
  const ids = [
    'cash-value', 'hp-bar', 'hp-text', 'armor-bar', 'weapon-list', 'mission-box',
    'police-box', 'wanted-stars', 'clock-readout', 'radio-readout', 'minimap',
    'dialog-box', 'objective-line', 'banner', 'map-overlay', 'title-overlay',
    'speed-readout', 'nos-bar', 'condition-readout', 'feature-strip',
    'pause-overlay', 'crosshair',
  ];
  for (const id of ids) getOrCreateElement(hud, id);
  const feature = getOrCreateElement(hud, 'feature-strip');
  feature.textContent = FEATURE_TEXT;
  const crosshair = getOrCreateElement(hud, 'crosshair');
  crosshair.textContent = '+';
  const mapOverlay = getOrCreateElement(hud, 'map-overlay');
  mapOverlay.style.display = 'none';
  const titleOverlay = getOrCreateElement(hud, 'title-overlay');
  titleOverlay.style.display = 'none';
  const pauseOverlay = getOrCreateElement(hud, 'pause-overlay');
  pauseOverlay.style.display = 'none';
  renderPauseOverlay(state);
  return hud;
}

export function showDialog(state, speaker, text) {
  const hud = ensureHudState(state);
  const box = getOrCreateElement(hud, 'dialog-box');
  if (!text) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }
  const color = SPEAKER_COLORS[speaker] || '#3fd2ff';
  const initial = speaker ? speaker.charAt(0) : '?';
  box.innerHTML =
    '<div style="display:flex;gap:12px;align-items:flex-start;">' +
    '<div style="width:44px;height:44px;min-width:44px;border-radius:50%;background:' + color + ';border:2px solid #fff;' +
    'display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:bold;color:#fff;">' + initial + '</div>' +
    '<div><div style="color:' + color + ';font-weight:bold;">' + speaker + ':</div>' +
    '<div>' + text + '</div>' +
    '<div style="color:#9fc6d8;font-size:12px;margin-top:4px;">(Enter — lanjut)</div></div></div>';
  box.style.display = 'block';
}

export function showBanner(state, text) {
  const hud = ensureHudState(state);
  const el = getOrCreateElement(hud, 'banner');
  el.textContent = text;
  el.style.display = 'block';
  if (hud.bannerTimer) window.clearTimeout(hud.bannerTimer);
  hud.bannerTimer = window.setTimeout(() => {
    el.style.display = 'none';
  }, 4200);
}

const GAMEPLAY_HUD_IDS = [
  'cash-value', 'hp-bar', 'hp-text', 'armor-bar', 'weapon-list', 'mission-box',
  'police-box', 'wanted-stars', 'clock-readout', 'radio-readout', 'minimap',
  'minimap-label',
  'dialog-box', 'objective-line', 'speed-readout', 'nos-bar', 'condition-readout',
  'feature-strip', 'crosshair',
  // Wadah statis di halaman yang memegang label HP/ARMOR, WANTED, dan NOS —
  // ikut disembunyikan supaya tidak bocor di atas layar judul/peta.
  'stats-box', 'right-box', 'drive-box',
];

function setGameplayHudVisible(state, visible) {
  const hud = ensureHudState(state);
  for (const id of GAMEPLAY_HUD_IDS) {
    const el = hud.elements[id] || document.getElementById(id);
    if (!el) continue;
    if (visible) {
      el.style.display = '';
      if (id === 'dialog-box') el.style.display = el.innerHTML ? 'block' : 'none';
      if (id === 'banner') el.style.display = 'none';
    } else {
      el.style.display = 'none';
    }
  }
  const banner = hud.elements.banner || document.getElementById('banner');
  if (banner && !visible) banner.style.display = 'none';
}

export function showMap(state, open) {
  const hud = ensureHudState(state);
  hud.mapOpen = Boolean(open);
  const overlay = getOrCreateElement(hud, 'map-overlay');
  if (hud.mapOpen) {
    setGameplayHudVisible(state, false);
    renderMapOverlay(state);
    overlay.style.display = 'flex';
  } else {
    overlay.style.display = 'none';
    if (state.phase !== 'title') setGameplayHudVisible(state, true);
  }
  return hud.mapOpen;
}

export function updateHud(state, dt) {
  const hud = ensureHudState(state);
  const titleShown = getOrCreateElement(hud, 'title-overlay').style.display !== 'none';
  if (hud.mapOpen || titleShown) {
    if (hud.mapOpen) {
      const missions = state.missions || {};
      const shells = typeof state.shells === 'number' ? state.shells : 0;
      const signature = JSON.stringify({ cash: cashOf(state), done: missions.done, current: missions.current, shells });
      if (hud.mapSignature !== signature) renderMapOverlay(state);
    }
    if (titleShown) {
      const signature = JSON.stringify({ saves: listSaves(), staged: state.titleContinue || null });
      if (hud.titleSignature !== signature) renderTitleOverlay(state);
    }
    return;
  }
  const player = state.player || {};
  const clock = clockOf(state);
  const wanted = typeof state.wanted === 'number' ? state.wanted : 0;
  const hp = Math.max(0, Math.round(player.hp ?? player.health ?? 100));
  const armor = Math.max(0, Math.round(player.armor || 0));
  setText(hud, 'cash-value', '$' + cashOf(state).toLocaleString('en-US'));
  const hpBar = getOrCreateElement(hud, 'hp-bar');
  if (hpBar && !hpBar.firstChild) {
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:#ff4d4d;transition:width 0.15s;';
    hpBar.appendChild(fill);
  }
  const hpFill = hpBar ? hpBar.firstChild : null;
  if (hpFill) hpFill.style.width = hp + '%';
  setText(hud, 'hp-text', 'HP ' + hp);
  const armorBar = getOrCreateElement(hud, 'armor-bar');
  if (armorBar && !armorBar.firstChild) {
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:#3f7dff;transition:width 0.15s;';
    armorBar.appendChild(fill);
  }
  const armorFill = armorBar ? armorBar.firstChild : null;
  if (armorFill) armorFill.style.width = armor + '%';
  const weapons = weaponsOf(state);
  const selected = player.weaponIndex ?? (state.combat ? state.combat.selected : 0) ?? 0;
  const weaponText = weapons.map((w, index) => {
    const label = (index + 1) + ' ' + (w.name || '?') + (w.ammo === null || w.ammo === undefined ? '' : ' ' + w.ammo + '/' + (w.reserve ?? 0));
    return index === selected ? '[' + label + ']' : label;
  }).join(' · ');
  setText(hud, 'weapon-list', weaponText);
  setHtml(hud, 'mission-box', missionBoxHtml(state));
  setHtml(hud, 'police-box', policeBoxHtml(state));
  const stars = '★'.repeat(wanted) + '☆'.repeat(Math.max(0, 5 - wanted));
  const seen = wanted > 0 && policeUnitsOf(state).length > 0;
  setHtml(hud, 'wanted-stars', stars + '<br><span style="font-size:13px;color:#ff8a8a;">WANTED ' + wanted + '/5 · ' + (wanted === 0 ? 'TENANG' : seen ? 'TERLIHAT' : 'SEMBUNYI') + '</span>');
  const missions = state.missions || {};
  const shells = typeof state.shells === 'number' ? state.shells : 0;
  setHtml(hud, 'clock-readout',
    'Jam ' + formatClock(clock) + ' · Hari ' + Math.floor(clock.day) + '<br>' +
    'Misi ' + (missions.current || (missions.done ? missions.done.length : 0)) + '/10 · Kerang ' + shells + '/24');
  setHtml(hud, 'radio-readout', '♪ ' + radioLine(state).replace(' — ', '<br>'));
  const objective = (typeof state.objectiveText === 'function')
    ? state.objectiveText(state)
    : (state.objective || missionObjectiveFallback(state));
  setText(hud, 'objective-line', objective);
  const inCar = Boolean(player.car || player.vehicle || player.inCar);
  const speed = Math.round(player.speedKmh || player.speed || 0);
  const speedEl = getOrCreateElement(hud, 'speed-readout');
  speedEl.style.display = inCar ? 'block' : 'none';
  if (inCar) setHtml(hud, 'speed-readout', speed + '<span style="font-size:16px;"> KM/J</span>');
  const car = player.car || player.vehicle || null;
  const nos = car ? Math.round(car.nos ?? player.nos ?? 100) : Math.round(player.nos ?? 100);
  const condition = car ? Math.round(car.condition ?? player.carCondition ?? 100) : 100;
  const nosBar = getOrCreateElement(hud, 'nos-bar');
  nosBar.style.display = inCar ? 'block' : 'none';
  if (nosBar && !nosBar.firstChild) {
    const fill = document.createElement('div');
    fill.style.cssText = 'height:100%;background:#3fd2ff;transition:width 0.15s;';
    nosBar.appendChild(fill);
  }
  const nosFill = nosBar ? nosBar.firstChild : null;
  if (nosFill) nosFill.style.width = nos + '%';
  const condEl = getOrCreateElement(hud, 'condition-readout');
  condEl.style.display = inCar ? 'block' : 'none';
  if (inCar) setText(hud, 'condition-readout', 'NOS ' + nos + '% · KONDISI ' + condition + '%');
  const crosshair = getOrCreateElement(hud, 'crosshair');
  const armed = selected > 0;
  crosshair.style.display = !inCar && armed ? 'block' : 'none';
  drawMinimap(state);
}

function missionObjectiveFallback(state) {
  const missions = state.missions || {};
  if (!missions.current) return 'Bebas — jelajahi Teluk Cerah, cari kerang, atau mulai misi berikutnya.';
  const list = state.missionsList || [];
  const mission = list.find((m) => m.number === missions.current);
  if (!mission || !mission.stages) return 'Misi ' + missions.current + ' berjalan.';
  const stage = mission.stages[missions.stage || 0];
  return stage ? stage.objective : mission.name;
}

export function showTitle(state) {
  const hud = ensureHudState(state);
  setGameplayHudVisible(state, false);
  renderTitleOverlay(state);
  const overlay = getOrCreateElement(hud, 'title-overlay');
  overlay.style.display = 'flex';
  state.phase = 'title';
  if (!hud.titleClickBound) {
    hud.titleClickBound = true;
    overlay.addEventListener('click', () => {
      if (!state.titleOpen) return;
      state.titleOpen = false;
      hideTitle(state);
      if (state.ui && typeof state.ui.banner === 'function') {
        state.ui.banner('Selamat datang di Teluk Cerah, Raka.');
      }
    });
  }
}

export function hideTitle(state) {
  const hud = ensureHudState(state);
  const overlay = getOrCreateElement(hud, 'title-overlay');
  overlay.style.display = 'none';
  if (state.phase === 'title') {
    state.phase = 'playing';
    setGameplayHudVisible(state, true);
  }
}

export function showPause(state, open) {
  const hud = ensureHudState(state);
  renderPauseOverlay(state);
  const overlay = getOrCreateElement(hud, 'pause-overlay');
  overlay.style.display = open ? 'flex' : 'none';
}
