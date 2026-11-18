// Misi cerita (10 misi), dialog typewriter, side activity Taksi dan
// Rampage. Tiap misi adalah state machine langkah-demi-langkah: goto,
// enterCar, kill, escape, route, tail, race.
//
// Semua jarak dalam unit dunia 3D (kota selebar 240). Checkpoint balapan
// membentuk ring di jalan lingkar kota.
import { MISSION_DEFS } from './config.js';
import { spawnEnemies } from './combat.js';
import { addWanted } from './police.js';

export function createMissionState() {
  return {
    index: 0, // misi aktif (0-based), -1 = semua selesai
    step: 0,
    started: false,
    dialog: null, // {speaker, text, shown}
    banner: null,
    bannerTimer: 0,
    objective: 'Temui Bu Sari — tekan Enter untuk mulai misi pertama',
    killCount: 0,
    killTotal: 0,
    race: null,
    escapeTimer: 0,
    rampage: null,
    taxi: null,
    done: false,
    routeIndex: 0,
    tail: null,
  };
}

export function startMission(G, index) {
  const def = MISSION_DEFS[index];
  if (!def) return;
  G.mission.index = index;
  G.mission.step = 0;
  G.mission.started = true;
  G.mission.killCount = 0;
  G.mission.race = null;
  G.mission.dialog = { speaker: def.giver, text: def.intro, shown: 0 };
  G.mission.objective = def.steps[0].text;
  G.mission.banner = def.title;
  G.mission.bannerTimer = 0;
  G.mission.routeIndex = 0;
  G.mission.tail = null;
  setupStep(G);
}

function ringPoints(cx, cz, radius, count) {
  const pts = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    pts.push({ x: cx + Math.sin(a) * radius, z: cz + Math.cos(a) * radius, done: false });
  }
  return pts;
}

function setupStep(G) {
  const def = MISSION_DEFS[G.mission.index];
  const step = def.steps[G.mission.step];
  if (!step) return;
  G.mission.objective = step.text;
  if (step.type === 'kill') {
    spawnEnemies(G, step.x, step.z, step.count, 60);
    G.mission.killCount = 0;
    G.mission.killTotal = step.count;
    G.mission.objective = `${step.text} — 0/${step.count} dikalahkan`;
  }
  if (step.type === 'escape') {
    addWanted(G, step.wanted);
    G.mission.escapeTimer = step.seconds;
  }
  if (step.type === 'goto' && step.wanted) addWanted(G, step.wanted);
  if (step.type === 'route') {
    G.mission.routeIndex = 0;
    G.mission.objective = step.text.replace('%n', String(step.points.length));
  }
  if (step.type === 'tail') {
    // Target: mobil sport merah yang keliling jalan lingkar kota.
    const v = {
      x: step.x, z: step.z, angle: 0, speed: 11, cp: 0, type: 'sport',
      color: 0xc22e2e, len: 4.6, wid: 2.0, health: 100, dead: false,
      ai: null, parked: false, driver: null, flash: 0,
      accel: 16, top: 14, turn: 3, tailTarget: true,
      waypoints: ringPoints(0, 0, 88, 8),
    };
    G.vehicles.push(v);
    G.mission.tail = { vehicle: v, timer: 0, seconds: step.seconds, radius: step.radius };
    G.mission.objective = `${step.text} — 0/${step.seconds} dtk`;
  }
  if (step.type === 'race') {
    G.mission.race = {
      checkpoints: ringPoints(0, 0, 95, step.checkpoints),
      next: 0, time: 0, rivals: spawnRacers(G),
    };
  }
}

function spawnRacers(G) {
  const rivals = [];
  const colors = [0xc22e2e, 0x2e8a5b, 0x8a5ec2];
  for (let i = 0; i < 3; i += 1) {
    const v = {
      x: 95 + i * 5, z: 6 + i * 2, angle: 0, speed: 0, cp: 0, type: 'sport',
      color: colors[i], len: 4.6, wid: 2.0, health: 100, dead: false,
      ai: null, parked: false, driver: null, flash: 0,
      accel: 18, top: 21, turn: 3,
    };
    rivals.push(v);
    G.vehicles.push(v);
  }
  return rivals;
}

function advanceStep(G) {
  const def = MISSION_DEFS[G.mission.index];
  G.mission.step += 1;
  if (G.mission.step >= def.steps.length) completeMission(G);
  else setupStep(G);
}

function completeMission(G) {
  const def = MISSION_DEFS[G.mission.index];
  G.player.cash += def.reward;
  G.rep = (G.rep || 0) + 150;
  G.stats.missionsDone = (G.stats.missionsDone || 0) + 1;
  G.mission.banner = `MISI SELESAI — ${def.title}  +$${def.reward}`;
  G.mission.bannerTimer = 0;
  G.cashFloaters.push({ x: G.player.x, z: G.player.z, text: `+$${def.reward}`, life: 1.5 });
  if (G.audio) G.audio.missionDone();
  G.mission.index += 1;
  G.mission.step = 0;
  G.mission.started = false;
  G.mission.race = null;
  G.mission.tail = null;
  G.mission.routeIndex = 0;
  if (G.mission.index >= MISSION_DEFS.length) {
    G.mission.index = -1;
    G.mission.objective = 'Semua misi selesai! Teluk Cerah milikmu, Raka.';
    G.mission.done = true;
  } else {
    G.mission.objective = `Misi berikutnya: ${MISSION_DEFS[G.mission.index].title} — tekan Enter untuk mulai`;
  }
}

export function updateMissions(G, dt) {
  const m = G.mission;
  // Dialog typewriter.
  if (m.dialog) {
    m.dialog.shown = Math.min(m.dialog.text.length, m.dialog.shown + dt * 45);
  }
  if (m.banner) {
    m.bannerTimer += dt;
    if (m.bannerTimer > 3.2) { m.banner = null; m.bannerTimer = 0; }
  }
  // Side: Rampage timer.
  if (m.rampage) {
    m.rampage.time -= dt;
    if (m.rampage.time <= 0) {
      G.player.cash += m.rampage.score * 5;
      m.banner = `RAMPAGE SELESAI — skor ${m.rampage.score}  +$${m.rampage.score * 5}`;
      m.bannerTimer = 0;
      m.rampage = null;
    }
  }
  if (!m.started || m.index < 0) return;
  const def = MISSION_DEFS[m.index];
  const step = def.steps[m.step];
  if (!step) return;
  const p = G.player;

  if (step.type === 'enterCar') {
    if (!p.onFoot) advanceStep(G);
  } else if (step.type === 'goto') {
    if (Math.hypot(p.x - step.x, p.z - step.z) < step.r) advanceStep(G);
  } else if (step.type === 'route') {
    const pt = step.points[m.routeIndex];
    if (pt && Math.hypot(p.x - pt.x, p.z - pt.z) < step.r) {
      m.routeIndex += 1;
      if (G.audio) G.audio.pickup();
      if (m.routeIndex >= step.points.length) advanceStep(G);
      else m.objective = step.text.replace('%n', String(step.points.length - m.routeIndex));
    }
  } else if (step.type === 'tail' && m.tail) {
    const t = m.tail;
    const v = t.vehicle;
    // Target melaju mengikuti waypoint lingkar kota.
    const wp = v.waypoints[v.cp % v.waypoints.length];
    const dx = wp.x - v.x;
    const dz = wp.z - v.z;
    const d = Math.hypot(dx, dz);
    if (d < 10) {
      v.cp += 1;
    } else {
      const want = Math.atan2(dx, dz);
      let da = want - v.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      v.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, da));
      v.speed = Math.min(v.top, v.speed + v.accel * dt);
      v.x += Math.sin(v.angle) * v.speed * dt;
      v.z += Math.cos(v.angle) * v.speed * dt;
    }
    const pd = Math.hypot(p.x - v.x, p.z - v.z);
    if (pd < t.radius) {
      t.timer += dt;
      m.objective = `${step.text} — ${Math.floor(t.timer)}/${t.seconds} dtk`;
      if (t.timer >= t.seconds) {
        v.tailTarget = false;
        m.tail = null;
        advanceStep(G);
      }
    } else {
      m.objective = `${step.text} — ${Math.floor(t.timer)}/${t.seconds} dtk (terlalu jauh!)`;
    }
  } else if (step.type === 'escape') {
    if (G.wanted <= 0) {
      m.escapeTimer -= dt;
      if (m.escapeTimer <= 0) advanceStep(G);
    } else {
      m.escapeTimer = step.seconds;
    }
    m.objective = `${step.text} — ${Math.ceil(m.escapeTimer)} dtk`;
  } else if (step.type === 'kill') {
    if (m.killCount >= step.count) advanceStep(G);
  } else if (step.type === 'race' && m.race) {
    const race = m.race;
    race.time += dt;
    const cp = race.checkpoints[race.next];
    if (cp && Math.hypot(p.x - cp.x, p.z - cp.z) < 10) {
      cp.done = true;
      race.next += 1;
      if (G.audio) G.audio.pickup();
      if (race.next >= race.checkpoints.length) {
        const rivalBest = Math.max(...race.rivals.map((r) => r.cp));
        if (race.next > rivalBest) advanceStep(G);
        else m.objective = 'Kalah balapan! Coba lagi — tekan Enter untuk ulang misi';
      }
    }
    // Rival AI: kejar checkpoint berikutnya.
    for (const r of race.rivals) {
      const target = race.checkpoints[Math.min(r.cp, race.checkpoints.length - 1)];
      if (!target) continue;
      const dx = target.x - r.x;
      const dz = target.z - r.z;
      const d = Math.hypot(dx, dz);
      if (d < 10) { r.cp += 1; continue; }
      const want = Math.atan2(dx, dz);
      let da = want - r.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      r.angle += Math.max(-2.4 * dt, Math.min(2.4 * dt, da));
      r.speed = Math.min(r.top, r.speed + r.accel * dt);
      r.x += Math.sin(r.angle) * r.speed * dt;
      r.z += Math.cos(r.angle) * r.speed * dt;
    }
    m.objective = `${step.text} — checkpoint ${race.next}/${race.checkpoints.length} (${Math.floor(race.time)} dtk)`;
  }
}

// Event dari sistem lain (bunuh musuh, curi mobil, dll).
export function onMissionEvent(G, ev) {
  const m = G.mission;
  if (ev === 'enemyKilled' && m.rampage) m.rampage.score += 10;
  if (ev === 'enemyKilled') {
    G.rep = (G.rep || 0) + 10;
    G.stats.takedowns = (G.stats.takedowns || 0) + 1;
  }
  if (ev === 'pedKilled' && m.rampage) m.rampage.score += 5;
  if (ev === 'enemyKilled' && m.started && m.index >= 0) {
    const step = MISSION_DEFS[m.index].steps[m.step];
    if (step && step.type === 'kill') {
      m.killCount += 1;
      m.objective = `${step.text} — ${m.killCount}/${step.count} dikalahkan`;
    }
  }
  if (ev === 'copKilled') addWanted(G, 1);
  if (ev === 'pedKilled') addWanted(G, 1);
  if (ev === 'stoleCar') {
    addWanted(G, 1);
    G.stats.carsStolen = (G.stats.carsStolen || 0) + 1;
  }
  if (ev === 'wasted') {
    G.player.cash = Math.max(0, Math.floor(G.player.cash * 0.9));
    respawn(G, 'hospital');
  }
  if (ev === 'busted') {
    const fine = Math.min(G.player.cash, 100 + G.wanted * 50);
    G.player.cash -= fine;
    G.wanted = 0;
    G.cops.length = 0;
    respawn(G, 'police');
  }
}

function respawn(G, where) {
  const p = G.player;
  p.health = 100;
  p.armor = 0;
  if (p.vehicle) { p.vehicle.driver = null; p.vehicle = null; }
  p.onFoot = true;
  if (where === 'hospital') {
    p.x = -10; p.z = 100;
    G.mission.banner = 'WASTED — dirawat di RS, uang dipotong 10%';
  } else {
    p.x = -10; p.z = -100;
    G.mission.banner = 'BUSTED — ditahan, denda dibayar';
  }
  G.mission.bannerTimer = 0;
  p.invuln = 2;
}

export function startTaxi(G) {
  if (G.mission.taxi) return;
  G.mission.taxi = { px: 0, pz: 0, fare: 0, state: 'pickup' };
  const a = G.rng.range(0, Math.PI * 2);
  G.mission.taxi.px = Math.max(-110, Math.min(110, G.player.x + Math.sin(a) * 50));
  G.mission.taxi.pz = Math.max(-110, Math.min(110, G.player.z + Math.cos(a) * 50));
  G.mission.objective = 'Taksi: jemput penumpang (blip kuning)';
}

export function startRampage(G) {
  if (G.mission.rampage) return;
  G.mission.rampage = { time: 60, score: 0 };
  addWanted(G, 2);
  G.mission.banner = 'RAMPAGE! 60 detik chaos — hancurkan sebanyak mungkin!';
  G.mission.bannerTimer = 0;
}
