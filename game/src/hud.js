// HUD DOM (ronde 2 — dirampingkan): panel kecil-kecil di sudut, tengah
// layar dibiarkan lega untuk kota. Isi tetap sama: cash/HP/armor/Rep,
// bintang wanted, polisi bernama, panel misi, jam + hari, radio + lagu,
// objektif, speedometer, minimap bundar + nama distrik, dialog
// berpotret, panel toko, title gradasi, dan peta kota penuh (M).
import { WEAPONS, SHELL_COUNT, WEEKDAYS, repTier } from './config.js';
import { districtAt } from './city.js';
import { SHOP_DEFS } from './shops.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_MAP = 'map';

const SPEAKER_COLORS = { 'Bu Sari': '#e8a020', Dimas: '#2e8a5b', Raka: '#2e6fb5', Nadia: '#8a5ec2' };
const DISTRICT_NEON = { Marina: '#ffd23f', 'Kota Tua': '#ff8c5a', CBD: '#37c8e8', Perumahan: '#7dff8a', Pelabuhan: '#ff5e8a' };

function $(id) { return document.getElementById(id); }

export function createHud() {
  const minimap = $('minimap');
  const mapCanvas = $('mapcanvas');
  const mmCtx = minimap.getContext('2d');
  const mapCtx = mapCanvas.getContext('2d');

  function show(el, on) { el.classList.toggle('hidden', !on); }

  function drawMinimap(G) {
    const S = 120;
    const sc = S / 260;
    const ox = 130;
    const c = mmCtx;
    c.clearRect(0, 0, S, S);
    c.save();
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = 'rgba(10,14,20,0.78)';
    c.fillRect(0, 0, S, S);
    c.fillStyle = '#3f8fbf';
    c.fillRect(0, 0, 8 * sc, S);
    c.fillStyle = '#e8d39a';
    c.fillRect(8 * sc, 0, 6 * sc, S);
    c.strokeStyle = '#666';
    c.lineWidth = 1;
    for (const l of G.city.lines) {
      const p = (l + ox) * sc;
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, S); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(S, p); c.stroke();
    }
    c.fillStyle = '#5a5f7a';
    for (const b of G.city.buildings) {
      c.fillRect((b.x - b.w / 2 + ox) * sc, (b.z - b.d / 2 + ox) * sc, Math.max(1, b.w * sc), Math.max(1, b.d * sc));
    }
    // Lingkaran zona pencarian merah di sekitar pemain (radius 40).
    const zx = (G.player.x + ox) * sc;
    const zy = (G.player.z + ox) * sc;
    const zr = 40 * sc;
    c.fillStyle = 'rgba(255,45,45,0.16)';
    c.beginPath();
    c.arc(zx, zy, zr, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ff2d2d';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(zx, zy, zr, 0, Math.PI * 2);
    c.stroke();
    function dot(x, z, color, r) {
      c.fillStyle = color;
      c.beginPath();
      c.arc((x + ox) * sc, (z + ox) * sc, r, 0, Math.PI * 2);
      c.fill();
    }
    const m = G.mission;
    if (m.started && m.index >= 0) {
      const step = (G.missionDefs[m.index] || {}).steps?.[m.step];
      if (step && step.x !== undefined) dot(step.x, step.z, '#ffd23f', 4);
    }
    if (m.taxi) dot(m.taxi.px, m.taxi.pz, '#ffd23f', 4);
    for (const v of G.vehicles) {
      if (v.type === 'police') dot(v.x, v.z, '#3f7fff', 2);
      else if (v === G.player.vehicle) dot(v.x, v.z, '#fff', 2.5);
    }
    for (const cp of G.cops) dot(cp.x, cp.z, '#3f7fff', 1.8);
    for (const e of G.enemies) dot(e.x, e.z, '#ff4f4f', 2);
    if (G.heli) dot(G.heli.x, G.heli.z, '#ff8c1a', 3.5);
    const px = (G.player.x + ox) * sc;
    const py = (G.player.z + ox) * sc;
    c.save();
    c.translate(px, py);
    c.rotate(Math.PI / 2 - G.player.angle);
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(6, 0); c.lineTo(-4, -4); c.lineTo(-4, 4); c.closePath();
    c.fill();
    c.restore();
    c.restore();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    c.stroke();
    c.font = 'bold 7px system-ui, sans-serif';
    c.textAlign = 'center';
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(0,0,0,0.85)';
    c.strokeText('ZONA PENCARIAN', S / 2, 18);
    c.fillStyle = '#ff2d2d';
    c.fillText('ZONA PENCARIAN', S / 2, 18);
  }

  function drawMapCanvas(G) {
    const ms = 620;
    const sc = ms / 260;
    const ox = 130;
    const c = mapCtx;
    c.fillStyle = '#0d1526';
    c.fillRect(0, 0, ms, ms);
    c.fillStyle = '#0a2038';
    c.fillRect(0, 0, 8 * sc, ms);
    c.fillStyle = '#16233d';
    c.fillRect(8 * sc, 0, 6 * sc, ms);
    const DISTRICT_DARK = { Marina: '#1a2a44', 'Kota Tua': '#2a2138', CBD: '#14263d', Perumahan: '#1c2f22', Pelabuhan: '#33222a' };
    for (const b of G.city.buildings) {
      c.fillStyle = DISTRICT_DARK[b.district] || `#${b.color.toString(16).padStart(6, '0')}`;
      c.fillRect((b.x - b.w / 2 + ox) * sc, (b.z - b.d / 2 + ox) * sc, Math.max(2, b.w * sc), Math.max(2, b.d * sc));
    }
    c.strokeStyle = '#22d3ee';
    c.lineWidth = 3;
    c.shadowColor = '#22d3ee';
    c.shadowBlur = 6;
    for (const l of G.city.lines) {
      const p = (l + ox) * sc;
      c.beginPath(); c.moveTo(p, 0); c.lineTo(p, ms); c.stroke();
      c.beginPath(); c.moveTo(0, p); c.lineTo(ms, p); c.stroke();
    }
    c.shadowBlur = 0;
    c.font = 'bold 17px system-ui, sans-serif';
    c.textAlign = 'center';
    const districts = [
      { n: 'Marina', x: -98, z: 0 },
      { n: 'Kota Tua', x: -32, z: 12 },
      { n: 'CBD', x: 78, z: -10 },
      { n: 'Perumahan', x: 12, z: -98 },
      { n: 'Pelabuhan', x: 34, z: 88 },
    ];
    for (const d of districts) {
      c.shadowColor = DISTRICT_NEON[d.n];
      c.shadowBlur = 12;
      c.fillStyle = DISTRICT_NEON[d.n];
      c.fillText(d.n, (d.x + ox) * sc, (d.z + ox) * sc);
    }
    c.shadowBlur = 0;
    c.font = '12px system-ui, sans-serif';
    c.fillStyle = '#7fb5d8';
    'ABCDEF'.split('').forEach((ch, i) => c.fillText(ch, (i + 0.5) * (ms / 6), 14));
    '12345'.split('').forEach((ch, i) => c.fillText(ch, 10, (i + 0.5) * (ms / 5)));
    function mdot(x, z, color, r) {
      c.fillStyle = color;
      c.beginPath();
      c.arc((x + ox) * sc, (z + ox) * sc, r, 0, Math.PI * 2);
      c.fill();
    }
    for (const s of SHOP_DEFS) mdot(s.x, s.z, '#7dff8a', 7);
    for (const s of G.shells || []) if (!s.taken) mdot(s.x, s.z, '#ffd23f', 2.5);
    mdot(-10, 100, '#ff6b5e', 6);
    mdot(-10, -100, '#3f7fff', 6);
    if (G.heli) mdot(G.heli.x, G.heli.z, '#ff8c1a', 7);
    for (const v of G.vehicles) if (v.type === 'police') mdot(v.x, v.z, '#3f7fff', 3.5);
    for (const e of G.enemies) mdot(e.x, e.z, '#ff4f4f', 3.5);
    const m = G.mission;
    if (m.started && m.index >= 0) {
      const step = (G.missionDefs[m.index] || {}).steps?.[m.step];
      if (step && step.x !== undefined) mdot(step.x, step.z, '#ffd23f', 9);
    }
    const target = (() => {
      if (m.taxi) return { x: m.taxi.px, z: m.taxi.pz };
      if (m.started && m.index >= 0) {
        const step = (G.missionDefs[m.index] || {}).steps?.[m.step];
        if (step && step.x !== undefined) return { x: step.x, z: step.z };
      }
      return null;
    })();
    if (target) {
      const lines = G.city.lines;
      const near = (v) => lines.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
      const nx = near(G.player.x);
      const nz = near(G.player.z);
      const tx = near(target.x);
      const tz = near(target.z);
      const pts = [
        [G.player.x, G.player.z], [nx, G.player.z], [nx, nz],
        [tx, nz], [tx, tz], [target.x, target.z],
      ];
      c.save();
      c.strokeStyle = '#ffd23f';
      c.lineWidth = 3;
      c.shadowColor = '#ffd23f';
      c.shadowBlur = 8;
      c.beginPath();
      pts.forEach(([x, z], i) => {
        const px2 = (x + ox) * sc;
        const py2 = (z + ox) * sc;
        if (i === 0) c.moveTo(px2, py2); else c.lineTo(px2, py2);
      });
      c.stroke();
      c.restore();
    }
    c.save();
    c.translate((G.player.x + ox) * sc, (G.player.z + ox) * sc);
    c.rotate(Math.PI / 2 - G.player.angle);
    c.fillStyle = '#fff';
    c.beginPath();
    c.moveTo(10, 0); c.lineTo(-7, -7); c.lineTo(-7, 7); c.closePath();
    c.fill();
    c.restore();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.strokeRect(0, 0, ms, ms);
  }

  function missionListHtml(G) {
    return G.missionDefs.map((def, i) => {
      const status = G.mission.index === -1 || i < G.mission.index ? 'DONE' : (i === G.mission.index ? 'ACTIVE' : 'LOCKED');
      const color = status === 'DONE' ? '#7dff8a' : (status === 'ACTIVE' ? '#ffd23f' : '#777');
      const mark = status === 'DONE' ? '✓' : (status === 'ACTIVE' ? '▶' : '○');
      const giverColor = SPEAKER_COLORS[def.giver] || '#888';
      const initial = (def.giver || '?')[0];
      const face = `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${giverColor};color:#fff;text-align:center;line-height:18px;font-size:11px;font-weight:700;margin-right:6px;vertical-align:middle">${initial}</span>`;
      return `<div style="color:${color}">${face}${mark} ${def.title} — $${def.reward} <span style="float:right">${status}</span></div>`;
    }).join('');
  }

  function statsHtml(G) {
    const rep = repTier(G.rep || 0);
    const completion = Math.round(((G.stats.missionsDone || 0) / 10) * 70 + ((G.stats.shells || 0) / SHELL_COUNT) * 30);
    const hrs = Math.floor((G.playSeconds || 0) / 3600);
    const mins = Math.floor(((G.playSeconds || 0) % 3600) / 60);
    return [
      `Uang: $${G.player.cash.toLocaleString('en-US')} · REP ${rep.index + 1} ${rep.name} (${G.rep || 0}${rep.next ? `/${rep.next.need}` : ''})`,
      `Selesai: ${completion}% · Misi ${G.stats.missionsDone || 0}/10 · Waktu main ${hrs}j ${mins}m`,
      `Kerang Teluk: ${G.stats.shells || 0}/${SHELL_COUNT} · Mobil dicuri: ${G.stats.carsStolen || 0}`,
      `Takedown: ${G.stats.takedowns || 0} · Lolos kejaran: ${G.stats.escapes || 0} · Hari ${G.day}`,
    ].map((s) => `<div>${s}</div>`).join('');
  }

  const LEGEND = [
    ['● Misi / objektif', '#ffd23f'], ['H Safehouse', '#7dff8a'], ['$ Toko senjata', '#7dff8a'],
    ['G Garage', '#7dff8a'], ['● Kerang Teluk', '#ffd23f'], ['+ Rumah sakit', '#ff6b5e'],
    ['P Kantor polisi', '#3f7fff'], ['● Musuh', '#ff4f4f'], ['▲ Kamu', '#fff'],
    ['● Helikopter', '#ff8c1a'], ['T Taksi (T)', '#ffd23f'], ['— Jalan raya', '#aaa'],
  ];

  function update(G) {
    const p = G.player;
    const rep = repTier(G.rep || 0);
    const screen = G.screen;

    show($('title-screen'), screen === SCREEN_TITLE);
    show($('map-screen'), screen === SCREEN_MAP);
    show($('pause-screen'), screen === SCREEN_PAUSED);
    show($('over-screen'), screen === SCREEN_OVER);
    show($('hud'), screen === SCREEN_PLAY);

    if (screen === SCREEN_TITLE) {
      const save = G.titleSave;
      show($('continue-box'), !!save);
      show($('title-continue-line'), !!save);
      if (save) {
        const srep = repTier(save.rep || 0);
        $('continue-box').textContent = `LANJUTKAN — Misi ${(save.missionIndex ?? 0) + 1}/10 · $${(save.cash || 0).toLocaleString('en-US')} · Hari ${save.day || 1} · REP ${srep.index + 1} ${srep.name} · Kerang ${save.shells || 0}/${SHELL_COUNT}`;
      }
      return;
    }
    if (screen === SCREEN_OVER) {
      $('over-title').textContent = G.overTitle || 'WASTED';
      $('over-text').textContent = G.overText || '';
      return;
    }
    if (screen === SCREEN_MAP) {
      drawMapCanvas(G);
      $('mission-list').innerHTML = missionListHtml(G);
      $('map-stats').innerHTML = statsHtml(G);
      $('map-legend').innerHTML = LEGEND.map(([label, color]) => `<div style="color:${color}">${label}</div>`).join('');
      return;
    }
    if (screen !== SCREEN_PLAY) return;

    $('cash').textContent = `$${p.cash.toLocaleString('en-US')}`;
    $('hpbar').style.width = `${Math.max(0, p.health)}%`;
    $('hpnum').textContent = Math.round(p.health);
    $('armorbar').style.width = `${Math.max(0, p.armor)}%`;
    $('armornum').textContent = Math.round(p.armor);
    const w = WEAPONS[p.weapon];
    $('weapons-line').textContent = `1 Tinju · 2 Pistol ${p.ammoInMag.pistol}/${p.ammo.pistol} · 3 Shotgun ${p.ammoInMag.shotgun}/${p.ammo.shotgun}`;
    $('rep-line').textContent = `${w.name}${p.reloadTimer > 0 ? '  (reload...)' : ''} · REP ${rep.index + 1} ${rep.name} (${G.rep || 0}${rep.next ? `/${rep.next.need}` : ''})`;
    const slots = [
      { key: '1', name: 'TINJU', ammo: '', on: p.weapon === 'fist' },
      { key: '2', name: 'PISTOL', ammo: `${p.ammoInMag.pistol}/${p.ammo.pistol}`, on: p.weapon === 'pistol' },
      { key: '3', name: 'SG', ammo: `${p.ammoInMag.shotgun}/${p.ammo.shotgun}`, on: p.weapon === 'shotgun' },
    ];
    $('weapon-slots').innerHTML = slots.map((s) => `<span class="${s.on ? 'on' : ''}">${s.key} ${s.name}${s.ammo ? ` ${s.ammo}` : ''}</span>`).join('');

    const m = G.mission;
    if (m.started && m.index >= 0) {
      const def = G.missionDefs[m.index];
      const step = def.steps[m.step];
      show($('mission-panel'), true);
      const stageBar = def.steps.map((_, i) => `<span style="color:${i < m.step ? '#ffd23f' : (i === m.step ? '#fff' : '#555')}">■</span>`).join('');
      $('mission-panel').querySelector('.t').innerHTML = `${def.title} · TAHAP ${m.step + 1}/${def.steps.length} ${stageBar}`;
      $('mission-panel').querySelector('.n').textContent = `NEXT: ${step.text}`;
      $('mission-panel').querySelector('.r').textContent = `Hadiah $${def.reward} · +150 REP`;
    } else {
      show($('mission-panel'), false);
    }

    // Panel polisi: heli + 4 unit terdekat saja, supaya tetap ramping.
    if (G.wanted > 0) {
      const units = [];
      if (G.heli) units.push({ name: G.heli.name || 'GARUDA-1', status: 'SPOTLIGHT', dist: Math.round(Math.hypot(p.x - G.heli.x, p.z - G.heli.z)), heli: true });
      for (const v of G.vehicles) {
        if (v.type === 'police' && !v.dead && v.name) units.push({ name: v.name, status: v.status || 'PURSUIT', dist: v.dist ?? 600 });
      }
      for (const c of G.cops) {
        if (!c.dead && c.name) units.push({ name: c.name, status: c.status || 'PENGEJARAN', dist: c.dist ?? 500 });
      }
      const shown = units.slice(0, 4);
      show($('police-panel'), true);
      $('police-panel').querySelector('.t').textContent = `POLISI TELUK CERAH — KODE ${G.wanted}`;
      $('police-units').innerHTML = shown.map((u) => (
        `<div class="u"><span class="nm" style="color:${u.heli ? '#ff8c1a' : '#fff'}">${u.name}</span><span class="st">${u.status}</span><span class="ds">${u.dist} m</span></div>`
      )).join('') + (units.length > 4 ? `<div class="u"><span style="color:#aaa">+${units.length - 4} unit lain</span></div>` : '');
    } else {
      show($('police-panel'), false);
    }

    $('stars').textContent = '★'.repeat(G.wanted) + '☆'.repeat(5 - G.wanted);
    let seen = false;
    for (const c of G.cops) if (Math.hypot(c.x - p.x, c.z - p.z) < 35) seen = true;
    for (const v of G.vehicles) if (v.type === 'police' && Math.hypot(v.x - p.x, v.z - p.z) < 40) seen = true;
    if (G.heli) seen = true;
    $('wanted-line').textContent = G.wanted > 0 ? `WANTED ${G.wanted}/5 · ${seen ? 'TERLIHAT' : 'HILANG'}` : '';
    const hh = Math.floor(G.clock / 60) % 24;
    const mm = Math.floor(G.clock) % 60;
    $('clock-line').textContent = `${WEEKDAYS[(G.day - 1) % 7]} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} · Hari ${G.day}`;
    $('progress-line').textContent = `Misi ${G.mission.index < 0 ? '—' : `${G.mission.index + 1}/10`} · Kerang ${G.stats.shells || 0}/${SHELL_COUNT}`;
    if (G.audio) {
      $('radio-line').textContent = `♪ ${G.audio.stationName()} — "${G.audio.trackTitle()}"`;
      $('radio-artist').textContent = G.audio.trackArtist();
    }

    show($('heli-warning'), !!G.heli);
    show($('cover-strip'), !!G.coverStrip);
    show($('banner'), !!m.banner);
    if (m.banner) $('banner').textContent = m.banner;

    const d = m.dialog;
    show($('hint'), !(d && d.shown < d.text.length + 60));
    if (d && d.shown < d.text.length + 60) {
      show($('dialog'), true);
      const portrait = $('portrait');
      portrait.textContent = d.speaker.charAt(0);
      portrait.style.background = SPEAKER_COLORS[d.speaker] || '#555';
      $('dialog').querySelector('.who').textContent = `${d.speaker}:`;
      $('dialog').querySelector('.txt').textContent = d.text.slice(0, Math.floor(d.shown)) + (d.shown >= d.text.length ? '  (Enter — lanjut)' : '');
    } else {
      show($('dialog'), false);
    }

    $('objective').textContent = m.objective || '';

    if (G.shop) {
      const s = G.shop;
      show($('shop-panel'), true);
      $('shop-panel').querySelector('.t').textContent = `${s.name} — tekan 1-${s.items.length} untuk beli`;
      $('shop-items').innerHTML = s.items.map((it, i) => {
        const locked = it.repTier !== undefined && rep.index < it.repTier;
        const poor = G.player.cash < it.price;
        return `<div class="it">${i + 1}. ${it.label} — $${it.price.toLocaleString('en-US')}${locked ? ` (butuh REP ${it.repTier + 1})` : ''}${poor ? ' (uang kurang)' : ''}</div>`;
      }).join('');
    } else {
      show($('shop-panel'), false);
    }

    show($('radio-toast'), !!(G.radioToast && G.radioToast.timer > 0));
    if (G.radioToast && G.radioToast.timer > 0) $('radio-toast').textContent = `♪ Radio: ${G.radioToast.text}`;

    if (!p.onFoot && p.vehicle) {
      show($('speed-box'), true);
      const v = p.vehicle;
      $('speed-num').textContent = Math.round(Math.abs(v.speed) * 8);
      $('car-cond').textContent = `KONDISI ${Math.max(0, Math.round(v.health))}%`;
      $('car-cond').style.color = v.health < 40 ? '#ff6b5e' : '#7dff8a';
      $('nosfill').style.width = `${(p.nos || 0) / (p.nosMax || 100) * 100}%`;
      $('nosfill').style.background = G.nosBoost ? '#ff8c1a' : '#7fb5ff';
      $('nos-line').textContent = G.nosBoost ? 'NOS!!' : 'NOS';
    } else {
      show($('speed-box'), false);
    }

    show($('crosshair'), p.onFoot && p.weapon !== 'fist');
    $('vignette').style.opacity = G.flashRed > 0 ? String(Math.min(1, G.flashRed)) : '0';
    $('district-label').textContent = districtAt(p.x, p.z);
    drawMinimap(G);
  }

  return { update };
}
