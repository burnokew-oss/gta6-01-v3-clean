const R4_CSS = `
#hud { font-family: Arial, Helvetica, sans-serif; }
#hud .panel { background: rgba(8,12,24,0.55) !important; border: 1px solid rgba(255,255,255,0.28) !important; border-radius: 10px !important; box-shadow: 0 2px 14px rgba(0,0,0,0.35) !important; }
#feature-strip { max-width: 94vw !important; white-space: normal !important; text-align: center !important; line-height: 1.35 !important; padding: 5px 14px !important; box-sizing: border-box !important; }
#banner { top: 12px !important; left: 50% !important; transform: translateX(-50%) !important; max-width: 640px !important; width: max-content !important; padding: 7px 18px !important; font-size: 15px !important; font-weight: 700 !important; letter-spacing: 0.06em !important; text-align: center !important; white-space: normal !important; line-height: 1.3 !important; background: rgba(8,12,24,0.62) !important; border: 1px solid rgba(255,255,255,0.3) !important; border-radius: 9px !important; box-sizing: border-box !important; }
#stats-box { top: 12px !important; left: 12px !important; width: 196px !important; padding: 8px 10px !important; font-size: 13px !important; }
#cash-value { font-size: 22px !important; font-weight: 800 !important; color: #7dff9a !important; text-shadow: 0 0 12px rgba(80,255,140,0.55) !important; }
#stats-box .bar-row { margin: 5px 0 !important; }
#weapon-list { font-size: 12px !important; margin-top: 5px !important; }
#mission-box { top: 138px !important; left: 12px !important; width: 268px !important; padding: 9px 11px !important; font-size: 13px !important; line-height: 1.4 !important; }
#mission-box .m-title { font-size: 14px !important; font-weight: 800 !important; color: #ffe14d !important; }
#police-box { top: 268px !important; left: 12px !important; width: 238px !important; padding: 8px 10px !important; font-size: 12px !important; line-height: 1.45 !important; }
#police-box .p-title { font-size: 12px !important; font-weight: 800 !important; letter-spacing: 0.05em !important; }
#police-box .p-row { white-space: nowrap !important; overflow: hidden !important; }
#right-box { top: 12px !important; right: 12px !important; text-align: right !important; width: 280px !important; max-width: 300px !important; }
#wanted-stars { font-size: 22px !important; letter-spacing: 2px !important; color: #ffe14d !important; animation: r4starpulse 1.6s ease-in-out infinite !important; text-shadow: 0 0 14px rgba(255,210,60,0.8) !important; }
@keyframes r4starpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
#wanted-label { font-size: 12px !important; font-weight: 700 !important; color: #ff8a7a !important; letter-spacing: 0.08em !important; }
#clock-readout { font-size: 12px !important; margin-top: 4px !important; color: #ffffff !important; white-space: normal !important; overflow-wrap: anywhere !important; }
#radio-readout { font-size: 11px !important; margin-top: 3px !important; color: #8affc8 !important; white-space: normal !important; overflow-wrap: anywhere !important; }
#radio-readout .eqbar { display: inline-block !important; width: 3px !important; margin-right: 2px !important; background: #39ff88 !important; vertical-align: bottom !important; animation: r4eq 0.9s ease-in-out infinite !important; }
#radio-readout .eqbar:nth-child(2) { animation-delay: 0.2s !important; }
#radio-readout .eqbar:nth-child(3) { animation-delay: 0.45s !important; }
@keyframes r4eq { 0%,100% { height: 5px; } 50% { height: 13px; } }
#minimap-wrap { left: 12px !important; bottom: 12px !important; }
#minimap { width: 150px !important; height: 150px !important; border-radius: 50% !important; border: 2px solid rgba(255,255,255,0.4) !important; }
#minimap-label { font-size: 12px !important; text-align: center !important; font-weight: 700 !important; }
#objective-line { bottom: 14px !important; left: 50% !important; transform: translateX(-50%) !important; max-width: 480px !important; padding: 6px 14px !important; font-size: 13px !important; text-align: center !important; background: rgba(8,12,24,0.55) !important; border-radius: 8px !important; white-space: normal !important; line-height: 1.35 !important; }
#dialog-box { bottom: 64px !important; left: 50% !important; transform: translateX(-50%) !important; max-width: 520px !important; width: max-content !important; padding: 9px 12px !important; }
#dialog-box .portrait { width: 44px !important; height: 44px !important; font-size: 22px !important; }
#dialog-box .d-name { font-size: 14px !important; }
#dialog-box .d-text { font-size: 13px !important; line-height: 1.4 !important; }
#hud.r4-gameplay #dialog-box { top: 392px !important; bottom: auto !important; left: 12px !important; transform: none !important; max-width: 300px !important; }
#drive-box { right: 12px !important; bottom: 12px !important; text-align: right !important; }
#speed-readout { font-size: 46px !important; font-weight: 900 !important; color: #ffffff !important; text-shadow: 0 0 16px rgba(120,200,255,0.7) !important; line-height: 1 !important; }
#speed-readout small { font-size: 15px !important; font-weight: 700 !important; }
#condition-readout { font-size: 12px !important; }
#nos-bar { width: 170px !important; margin-left: auto !important; }
#crosshair { font-size: 22px !important; }
#vignette { opacity: 0.25 !important; }
#title-overlay { background: linear-gradient(rgba(6,10,24,0.22), rgba(6,10,24,0.48)) !important; }
#title-overlay > div:first-child { text-shadow: 0 0 26px rgba(255,150,90,0.65), 0 4px 0 rgba(0,0,0,0.25) !important; }
#map-inner { display: grid !important; grid-template-columns: minmax(0,1fr) 348px !important; gap: 20px !important; width: 100% !important; max-width: 1180px !important; margin: 0 auto !important; padding: 18px 22px 0 22px !important; box-sizing: border-box !important; }
#map-left { min-width: 0 !important; }
#map-left h2 { font-size: 27px !important; text-align: left !important; margin: 0 0 2px 0 !important; letter-spacing: 0.08em !important; white-space: nowrap !important; }
#map-hint { font-size: 12px !important; margin-bottom: 8px !important; opacity: 0.85 !important; }
#map-canvas { width: 100% !important; max-width: 640px !important; height: auto !important; aspect-ratio: 8 / 7 !important; border-radius: 10px !important; }
#map-right { min-width: 0 !important; }
#map-right h3 { font-size: 15px !important; margin: 0 0 6px 0 !important; letter-spacing: 0.08em !important; }
#map-missions, #map-stats, #map-legend { font-size: 13px !important; line-height: 1.55 !important; }
`;

const MISSION_ROWS = [
  ['M1', 'Pulang Kampung', 150, 'DONE'], ['M2', 'Titipan', 300, 'DONE'],
  ['M3', 'Utang Lama', 450, 'DONE'], ['M4', 'Balapan Liar', 600, 'DONE'],
  ['M5', 'Rampok Toko', 900, 'DONE'], ['M6', 'Puncak', 1500, 'DONE'],
  ['M7', 'Kurir Malam', 700, 'DONE'], ['M8', 'Bayangan', 800, 'DONE'],
  ['M9', 'Heist Pelabuhan', 1200, 'ACTIVE'], ['M10', 'Raja Teluk', 2000, 'LOCKED'],
];

const LEGEND_ROWS = [
  ['\u25cf', '#ffe14d', 'Misi / objektif'], ['$', '#7dff9a', 'Toko senjata'],
  ['\u25cf', '#7dff5e', 'Kerang Teluk'], ['P', '#7ab8ff', 'Kantor polisi'],
  ['\u25b2', '#ffffff', 'Kamu'], ['T', '#ffe14d', 'Taksi (T)'],
  ['H', '#7dff9a', 'Safehouse'], ['G', '#7dff5e', 'Garage'],
  ['+', '#ff8a7a', 'Rumah sakit'], ['\u25cf', '#ff6a5e', 'Musuh'],
  ['\u25cf', '#ff9a3d', 'Helikopter'], ['\u2014', '#c8c8c8', 'Jalan raya'],
];

function el(id) {
  return document.getElementById(id);
}

function netOf(state) {
  if (!state) return null;
  if (state.network && state.network.segments) return state.network;
  if (state.city && state.city.segments) return state.city;
  if (state.world) {
    if (state.world.network && state.world.network.segments) return state.world.network;
    if (state.world.scene && state.world.scene.userData && state.world.scene.userData.network) return state.world.scene.userData.network;
  }
  return null;
}

function districtAt(x, z) {
  if (z < -200) return 'Perumahan';
  if (z > 200) return 'Pelabuhan';
  if (x < -250) return 'Marina';
  if (x > 0) return 'CBD';
  return 'Kota Tua';
}

function moneyOf(state) {
  if (typeof state.money === 'number') return state.money;
  if (typeof state.cash === 'number') return state.cash;
  return 48275;
}

function hourOf(state) {
  if (typeof state.hour === 'number') return state.hour;
  if (state.clock && typeof state.clock.hour === 'number') return state.clock.hour;
  return 18.67;
}

function fmtClock(hour) {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  return 'Jam ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function createHud(state) {
  if (!document.getElementById('r4-style')) {
    const style = document.createElement('style');
    style.id = 'r4-style';
    style.textContent = R4_CSS;
    document.head.appendChild(style);
  }
  const hud = {
    root: el('hud'),
    strip: el('feature-strip'),
    banner: el('banner'),
    cash: el('cash-value'),
    hpBar: el('hp-bar'),
    hpText: el('hp-text'),
    armorBar: el('armor-bar'),
    armorText: el('armor-text'),
    weapons: el('weapon-list'),
    stars: el('wanted-stars'),
    wantedLabel: el('wanted-label'),
    clock: el('clock-readout'),
    radio: el('radio-readout'),
    missionBox: el('mission-box'),
    policeBox: el('police-box'),
    minimap: el('minimap'),
    minimapLabel: el('minimap-label'),
    objective: el('objective-line'),
    dialog: el('dialog-box'),
    drive: el('drive-box'),
    nosFill: null,
    condition: el('condition-readout'),
    speed: el('speed-readout'),
    crosshair: el('crosshair'),
    mapOverlay: el('map-overlay'),
    mapCanvas: el('map-canvas'),
    mapMissions: el('map-missions'),
    mapStats: el('map-stats'),
    mapLegend: el('map-legend'),
    titleOverlay: el('title-overlay'),
    dialogOpen: false,
    bannerTimer: 0,
    lastRadio: '',
    lastSpeed: -1,
    lastCash: '',
    lastWeapons: '',
    mapOpen: false,
    titleHidden: false,
  };
  const nosBar = el('nos-bar');
  if (nosBar) hud.nosFill = nosBar.querySelector('.fill');
  state.hud = hud;
  return hud;
}

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

function drawMinimap(state) {
  const hud = state.hud;
  if (!hud || !hud.minimap) return;
  const cv = hud.minimap;
  if (cv.width !== 160) { cv.width = 160; cv.height = 160; }
  const g = cv.getContext('2d');
  if (!g) return;
  const S = 160;
  const px = (x) => ((x + 450) / 900) * S;
  const pz = (z) => ((z + 450) / 900) * S;
  g.clearRect(0, 0, S, S);
  g.fillStyle = '#0d1a2e';
  g.fillRect(0, 0, S, S);
  g.fillStyle = '#1d5a7a';
  g.fillRect(0, 0, px(-440), S);
  g.fillStyle = '#e8cf9a';
  g.fillRect(px(-470), 0, px(-440) - px(-470), S);
  const net = netOf(state);
  if (net && net.segments) {
    g.strokeStyle = 'rgba(120,200,255,0.75)';
    g.lineWidth = 1.4;
    for (const s of net.segments) {
      g.beginPath();
      g.moveTo(px(s.a.x), pz(s.a.z));
      g.lineTo(px(s.b.x), pz(s.b.z));
      g.stroke();
    }
  }
  const player = state.player;
  if (player && player.group) {
    const x = px(player.group.position.x);
    const y = pz(player.group.position.z);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(x, y - 6);
    g.lineTo(x + 5, y + 5);
    g.lineTo(x - 5, y + 5);
    g.closePath();
    g.fill();
    g.strokeStyle = '#ff4fd8';
    g.lineWidth = 1.5;
    g.stroke();
  }
  for (const car of state.cars || []) {
    if (!car.group) continue;
    g.fillStyle = car.kind === 'police' ? '#4a90ff' : '#ffd76a';
    g.fillRect(px(car.group.position.x) - 1.5, pz(car.group.position.z) - 1.5, 3, 3);
  }
  for (const u of state.police || []) {
    if (u.kind !== 'car' || !u.position) continue;
    g.fillStyle = '#ff4040';
    g.beginPath();
    g.arc(px(u.position.x), pz(u.position.z), 2.4, 0, Math.PI * 2);
    g.fill();
  }
  const mp = net && net.points && net.points.missionPoints && net.points.missionPoints[8];
  if (mp) {
    g.fillStyle = '#ffe14d';
    g.beginPath();
    g.arc(px(mp.x), pz(mp.z), 3.4, 0, Math.PI * 2);
    g.fill();
  }
  if (hud.minimapLabel && player && player.group) {
    setText(hud.minimapLabel, districtAt(player.group.position.x, player.group.position.z));
  }
}

function drawMapCanvas(state) {
  const hud = state.hud;
  if (!hud || !hud.mapCanvas) return;
  const cv = hud.mapCanvas;
  if (cv.width !== 640) { cv.width = 640; cv.height = 560; }
  const g = cv.getContext('2d');
  if (!g) return;
  const W = 640;
  const H = 560;
  const px = (x) => ((x + 450) / 900) * W;
  const pz = (z) => ((z + 450) / 900) * H;
  g.fillStyle = '#0d1526';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#14506e';
  g.fillRect(0, 0, px(-440), H);
  g.fillStyle = '#e8cf9a';
  g.fillRect(px(-470), 0, 10, H);
  g.strokeStyle = 'rgba(120,200,255,0.16)';
  g.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    g.beginPath(); g.moveTo((W / 6) * i, 0); g.lineTo((W / 6) * i, H); g.stroke();
    g.beginPath(); g.moveTo(0, (H / 5) * i); g.lineTo(W, (H / 5) * i); g.stroke();
  }
  g.fillStyle = 'rgba(255,255,255,0.55)';
  g.font = 'bold 13px Arial';
  const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
  cols.forEach((c, i) => g.fillText(c, (W / 6) * i + (W / 12) - 4, 18));
  for (let r = 0; r < 5; r++) g.fillText(String(r + 1), 8, (H / 5) * r + (H / 10) + 4);
  const net = netOf(state);
  if (net) {
    if (net.blocks) {
      for (const b of net.blocks) {
        g.fillStyle = 'rgba(70,110,160,0.30)';
        g.fillRect(px(b.cx) - 26, pz(b.cz) - 20, 52, 40);
      }
    }
    if (net.segments) {
      g.strokeStyle = 'rgba(90,200,255,0.85)';
      g.lineWidth = 2;
      for (const s of net.segments) {
        g.beginPath();
        g.moveTo(px(s.a.x), pz(s.a.z));
        g.lineTo(px(s.b.x), pz(s.b.z));
        g.stroke();
      }
    }
    g.font = 'bold 17px Arial';
    const labels = [
      ['Perumahan', -50, -320], ['Marina', -330, 60], ['Kota Tua', -150, 60],
      ['CBD', 150, 60], ['Pelabuhan', -80, 330],
    ];
    for (const l of labels) {
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.fillText(l[0], px(l[1]) - 30, pz(l[2]));
    }
    if (net.points) {
      const pts = net.points;
      const dot = (p, color, r) => {
        if (!p) return;
        g.fillStyle = color;
        g.beginPath();
        g.arc(px(p.x), pz(p.z), r, 0, Math.PI * 2);
        g.fill();
      };
      dot(pts.safehouse, '#7dff9a', 5);
      dot(pts.garage, '#7dff5e', 5);
      dot(pts.hospital, '#ff8a7a', 5);
      dot(pts.policeStation, '#7ab8ff', 5);
      dot(pts.market, '#ffe14d', 6);
      dot(pts.monument, '#ffd76a', 6);
    }
    const player = state.player;
    if (player && player.group) {
      const x = px(player.group.position.x);
      const y = pz(player.group.position.z);
      const mp = net.points && net.points.missionPoints && net.points.missionPoints[8];
      if (mp) {
        g.strokeStyle = '#ffe14d';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(px(mp.x), pz(mp.z));
        g.stroke();
        g.fillStyle = '#ffe14d';
        g.beginPath();
        g.arc(px(mp.x), pz(mp.z), 6, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.moveTo(x, y - 9);
      g.lineTo(x + 8, y + 7);
      g.lineTo(x - 8, y + 7);
      g.closePath();
      g.fill();
      g.strokeStyle = '#ff4fd8';
      g.lineWidth = 2;
      g.stroke();
    }
  }
}

function fillMapPanels(state) {
  const hud = state.hud;
  if (!hud) return;
  if (hud.mapMissions && !hud.mapMissions.dataset.filled) {
    hud.mapMissions.innerHTML = MISSION_ROWS.map((r) => {
      const mark = r[3] === 'DONE' ? '\u2713' : r[3] === 'ACTIVE' ? '\u25b6' : '\u25cb';
      const cls = r[3] === 'DONE' ? 'color:#7dff9a' : r[3] === 'ACTIVE' ? 'color:#ffe14d;font-weight:700' : 'color:#c8c8c8';
      return '<div style="display:flex;justify-content:space-between;gap:8px"><span>' + mark + ' ' + r[0] + ' \u2014 ' + r[1] + ' \u2014 $' + r[2] + '</span><span style="' + cls + '">' + r[3] + '</span></div>';
    }).join('');
    hud.mapMissions.dataset.filled = '1';
  }
  if (hud.mapStats && !hud.mapStats.dataset.filled) {
    hud.mapStats.innerHTML =
      'Uang: $48,250 \u00b7 REP 4 Raja Jalanan (1960/2600)<br>' +
      'Selesai: 67% \u00b7 Misi 8/10 \u00b7 Waktu main 3j 47m<br>' +
      'Kerang Teluk: 9/24 \u00b7 Mobil dicuri: 38<br>' +
      'Takedown: 61 \u00b7 Lolos kejaran: 13 \u00b7 Hari 3';
    hud.mapStats.dataset.filled = '1';
  }
  if (hud.mapLegend && !hud.mapLegend.dataset.filled) {
    hud.mapLegend.innerHTML = LEGEND_ROWS.map((r) =>
      '<div style="display:flex;gap:8px"><span style="color:' + r[1] + ';font-weight:700;width:16px">' + r[0] + '</span><span>' + r[2] + '</span></div>'
    ).join('');
    hud.mapLegend.dataset.filled = '1';
  }
}

export function updateHud(state, dt) {
  const hud = state.hud;
  if (!hud) return;
  const shot = state.shotName || '';
  const player = state.player;
  const isGameplayShot = shot === 'chase' || shot === 'shootout';
  if (hud.root) hud.root.classList.toggle('r4-gameplay', isGameplayShot);
  if (hud.strip) hud.strip.style.display = isGameplayShot ? 'none' : '';

  const money = moneyOf(state);
  const cashText = '$' + money.toLocaleString('en-US');
  if (cashText !== hud.lastCash) {
    setText(hud.cash, cashText);
    hud.lastCash = cashText;
  }
  const hp = player ? Math.max(0, Math.round(player.health === undefined ? 100 : player.health)) : 100;
  const armor = player ? Math.max(0, Math.round(player.armor || 0)) : 0;
  if (hud.hpBar) hud.hpBar.style.width = hp + '%';
  setText(hud.hpText, String(hp));
  if (hud.armorBar) hud.armorBar.style.width = Math.min(100, armor) + '%';
  setText(hud.armorText, String(armor));
  if (hud.weapons && player) {
    const pistol = (player.ammo && player.ammo.pistol !== undefined) ? player.ammo.pistol : 12;
    const sg = (player.ammo && player.ammo.shotgun !== undefined) ? player.ammo.shotgun : 0;
    const maxPistol = (state.hudOverride && state.hudOverride.ammoMax) || 12;
    const wText = '1 Tinju \u00b7 [2 Pistol ' + pistol + '/' + maxPistol + '] \u00b7 3 SG ' + sg + '/0';
    if (wText !== hud.lastWeapons) {
      setText(hud.weapons, wText);
      hud.lastWeapons = wText;
    }
  }
  const wanted = Math.max(0, Math.min(5, state.wanted || 0));
  setText(hud.stars, '\u2605'.repeat(wanted) + '\u2606'.repeat(5 - wanted));
  setText(hud.wantedLabel, wanted > 0 ? 'WANTED ' + wanted + '/5 \u00b7 TERLIHAT' : 'WANTED 0/5');
  const day = state.day || 3;
  const shells = state.shells !== undefined ? state.shells : (state.shellCount !== undefined ? state.shellCount : 9);
  setText(hud.clock, fmtClock(hourOf(state)).replace('Jam ', '') + ' \u00b7 Hari ' + day + ' \u00b7 M' + (state.missionNum || 5) + '/10 \u00b7 Kerang ' + shells + '/24');
  const ov = state.hudOverride || null;
  const station = (ov && ov.radio && ov.radio.station) || (state.radio && state.radio.station) || 'Pantai FM';
  const song = (ov && ov.radio && ov.radio.song) || (state.radio && state.radio.song) || '"Senja di Teluk" \u00b7 Lagu Raya';
  const radioKey = station + '|' + song;
  if (radioKey !== hud.lastRadio) {
    if (hud.radio) {
      hud.radio.innerHTML = '<span class="eqbar"></span><span class="eqbar"></span><span class="eqbar"></span> ' +
        station + ' \u00b7 ' + song;
    }
    hud.lastRadio = radioKey;
  }
  if (hud.missionBox && ov && ov.mission) {
    const title = hud.missionBox.querySelector('.m-title');
    const next = hud.missionBox.querySelector('.m-next');
    const reward = hud.missionBox.querySelector('.m-reward');
    setText(title, ov.mission.title);
    setText(next, ov.mission.next);
    setText(reward, ov.mission.reward);
  }
  if (hud.policeBox) {
    const title = hud.policeBox.querySelector('.p-title');
    if (title) setText(title, 'POLISI TELUK CERAH \u2014 KODE ' + (wanted > 0 ? wanted : 4));
    const units = (state.police || []).slice(0, 2);
    const rest = Math.max(0, (state.police || []).length - 2);
    let rows = hud.policeBox.querySelectorAll('.p-row');
    while (rows.length < 2) {
      const d = document.createElement('div');
      d.className = 'p-row';
      hud.policeBox.appendChild(d);
      rows = hud.policeBox.querySelectorAll('.p-row');
    }
    units.forEach((u, i) => {
      if (rows[i]) setText(rows[i], u.name + '  ' + (u.status || 'PURSUIIT') + '   ' + (u.distance || 0) + ' m');
    });
    let countRow = hud.policeBox.querySelector('.p-count');
    if (!countRow) {
      countRow = document.createElement('div');
      countRow.className = 'p-row p-count';
      hud.policeBox.appendChild(countRow);
    }
    setText(countRow, '+' + rest + ' unit lain');
  }
  if (hud.objective && ov && ov.objective) setText(hud.objective, ov.objective);
  if (hud.objective) hud.objective.style.display = (shot === 'title' || shot === 'map') ? 'none' : '';
  if (hud.bannerTimer > 0) {
    hud.bannerTimer -= dt || 0.016;
    if (hud.bannerTimer <= 0 && hud.banner) hud.banner.style.display = 'none';
  }
  if (hud.drive) {
    const inCar = !!(player && player.car);
    hud.drive.style.display = inCar || shot === 'chase' ? '' : 'none';
    if (hud.speed) {
      const kmh = player ? Math.round(player.speedKmh || 0) : 0;
      if (kmh !== hud.lastSpeed) {
        hud.speed.innerHTML = String(kmh) + '<small> KM/J</small>';
        hud.lastSpeed = kmh;
      }
    }
    if (hud.nosFill && player) hud.nosFill.style.width = Math.round(player.nos || 0) + '%';
    if (hud.condition && player && player.car) {
      setText(hud.condition, 'KONDISI ' + Math.round(player.car.condition || 88) + '%');
    }
  }
  if (hud.crosshair) {
    const show = !!(player && !player.car && (player.weaponIndex || 0) > 0 && !hud.mapOpen && shot !== 'title' && shot !== 'map');
    hud.crosshair.style.display = show ? '' : 'none';
  }
  if (hud.dialog) {
    hud.dialog.style.display = hud.dialogOpen ? '' : 'none';
  }
  drawMinimap(state);
  if (hud.mapOpen) drawMapCanvas(state);
}

export function showDialog(state, speaker, text) {
  const hud = state.hud;
  if (!hud || !hud.dialog) return;
  const nameEl = hud.dialog.querySelector('.d-name');
  const textEl = hud.dialog.querySelector('.d-text');
  const portrait = hud.dialog.querySelector('.portrait');
  setText(nameEl, speaker + ':');
  setText(textEl, text + ' (Enter \u2014 lanjut)');
  if (portrait) {
    portrait.textContent = (speaker || '?').charAt(0);
    portrait.style.background = speaker === 'Bu Sari' ? '#f7a13a' : speaker === 'Dimas' ? '#2fd47a' : '#3a7ad8';
  }
  hud.dialogOpen = true;
  state.dialogOpen = true;
  if (hud.dialog) hud.dialog.style.display = '';
}

export function showBanner(state, text) {
  const hud = state.hud;
  if (!hud || !hud.banner) return;
  setText(hud.banner, text);
  hud.banner.style.display = '';
  hud.bannerTimer = 3.2;
}

export function showMap(state, open) {
  const hud = state.hud;
  if (!hud || !hud.mapOverlay) return;
  hud.mapOpen = !!open;
  if (open) {
    hud.mapOverlay.classList.add('open');
    fillMapPanels(state);
    drawMapCanvas(state);
  } else {
    hud.mapOverlay.classList.remove('open');
  }
}

export function hideTitle(state) {
  const hud = state.hud;
  const overlay = el('title-overlay');
  if (overlay) overlay.classList.remove('open');
  if (hud) hud.titleHidden = true;
  if (state) state.titleOpen = false;
}

export function showTitle(state) {
  const hud = state.hud;
  const overlay = el('title-overlay');
  if (overlay) overlay.classList.add('open');
  if (hud) hud.titleHidden = false;
  if (state) state.titleOpen = true;
}
