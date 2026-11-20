// Teluk Cerah — the ten-mission story chain for Raka: staged objectives
// with a world marker, short dialogue beats, cash and reputation rewards,
// plus race checkpoints and a courier chase.

import { MISSIONS } from "./config.js";

export function createMissions(scene, S, deps) {
  const { hud, combat, police, player } = deps;
  const marker = new THREE.Group();
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 26, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffc93c, transparent: true, opacity: 0.30, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  pillar.position.y = 13;
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 2.3, 28),
    new THREE.MeshBasicMaterial({ color: 0xffc93c, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12;
  marker.add(pillar, ring);
  marker.visible = false;
  scene.add(marker);

  const MS = {
    index: 0, stage: 0, active: false, done: false,
    racePoint: 0, raceTime: 0, chaseHold: 0, courier: null,
    get current() { return MISSIONS[MS.index]; },
    get stageDef() { return MS.current?.stages[MS.stage]; },
    objectiveText() {
      if (MS.done) return "Semua misi selesai — kota ini milikmu.";
      if (!MS.active) return "";
      const s = MS.stageDef;
      if (!s) return "";
      if (s.type === "race") return `${s.text} — titik ${MS.racePoint + 1}/${s.points.length}`;
      return s.text;
    },
    start(i) {
      MS.index = i; MS.stage = 0; MS.active = true; MS.done = false;
      MS.racePoint = 0; MS.raceTime = 0; MS.chaseHold = 0;
      const m = MS.current;
      hud.showDialogue(m.giver, m.intro, 6);
      hud.notify(`MISI ${i + 1}: ${m.title}`);
      MS.beginStage();
    },
    beginStage() {
      const s = MS.stageDef;
      if (!s) return MS.finish();
      if (s.wanted) police.setWanted(Math.max(police.wanted, s.wanted));
      if (s.type === "combat") combat.spawnEnemies(s.x, s.z, s.count);
      if (s.type === "race") { MS.racePoint = 0; MS.raceTime = 0; }
      if (s.type === "chase") MS.spawnCourier(s);
      MS.moveMarker();
    },
    moveMarker() {
      const s = MS.stageDef;
      if (!s) { marker.visible = false; return; }
      const p = s.type === "race" ? { x: s.points[MS.racePoint][0], z: s.points[MS.racePoint][1] } : s;
      marker.position.set(p.x, 0, p.z);
      marker.visible = true;
    },
    spawnCourier(s) {
      const c = deps.makeCourier(s.x, s.z);
      MS.courier = c;
    },
    finish() {
      const m = MS.current;
      S.money += m.reward; S.rep += m.rep;
      hud.notify(`MISI SELESAI: ${m.title}  +$${m.reward}  +${m.rep} reputasi`);
      hud.showDialogue(m.giver, "Kerja bagus, Raka. Kota ini mulai bicara tentangmu.", 5);
      deps.audio?.coin();
      MS.active = false;
      marker.visible = false;
      if (MS.index + 1 < MISSIONS.length) {
        setTimeout(() => MS.start(MS.index + 1), 4000);
      } else {
        MS.done = true;
        hud.notify("CERITA SELESAI — Teluk Cerah tamat. Tetaplah berkeliaran!");
      }
    },
    advance() {
      MS.stage += 1;
      combat.clearEnemies();
      if (MS.stage >= MS.current.stages.length) MS.finish();
      else MS.beginStage();
    },
    update(dt, t) {
      if (!MS.active) return;
      const s = MS.stageDef;
      if (!s) return;
      ring.scale.setScalar(1 + Math.sin(t * 3.2) * 0.10);
      pillar.material.opacity = 0.24 + Math.sin(t * 2.4) * 0.08;
      const d = Math.hypot(player.x - (s.x ?? 0), player.z - (s.z ?? 0));
      if (s.type === "goto" && d < 4.2) MS.advance();
      else if (s.type === "combat" && combat.aliveCount() === 0) MS.advance();
      else if (s.type === "race") {
        MS.raceTime += dt;
        const [rx, rz] = s.points[MS.racePoint];
        marker.position.set(rx, 0, rz);
        if (Math.hypot(player.x - rx, player.z - rz) < 7) {
          MS.racePoint += 1;
          deps.audio?.coin();
          if (MS.racePoint >= s.points.length) MS.advance();
          else MS.moveMarker();
        }
      } else if (s.type === "chase" && MS.courier) {
        const c = MS.courier;
        c.update(dt, player);
        if (Math.hypot(player.x - c.x, player.z - c.z) < 6.5) {
          MS.chaseHold += dt;
          if (MS.chaseHold > 1.4) { MS.courier = null; MS.advance(); }
        } else MS.chaseHold = Math.max(0, MS.chaseHold - dt);
      }
    },
    // screenshot helper: park the marker on a point without a live mission
    setShotMarker(x, z) { marker.position.set(x, 0, z); marker.visible = true; },
    markerPos() { return marker.visible ? { x: marker.position.x, z: marker.position.z } : null; },
  };
  return MS;
}
