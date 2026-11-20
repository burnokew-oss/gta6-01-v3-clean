// missions.js — 10 misi cerita berurutan Teluk Cerah: objektif bertahap,
// dialog singkat di HUD, hadiah uang dan reputasi, penanda tujuan di dunia.
import { MISSIONS } from "./config.js";

export class Missions {
  constructor(scene, player, police) {
    this.list = MISSIONS;
    this.idx = 0;
    this.done = 0;
    this.player = player;
    this.police = police;
    this.dialog = MISSIONS[0].dialog;
    this.giver = MISSIONS[0].giver;
    this.notice = "";
    const T3 = window.THREE;
    this.marker = new T3.Mesh(
      new T3.CylinderGeometry(1.6, 1.6, 14, 18, 1, true),
      new T3.MeshBasicMaterial({ color: 0xffd23e, transparent: true, opacity: 0.3, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide })
    );
    scene.add(this.marker);
    this.targets = [
      { x: 52, z: 96 }, { x: 30, z: 62 }, { x: -58, z: 8 }, { x: -20, z: 74 },
      { x: 112, z: 66 }, { x: 62, z: -78 }, { x: -52, z: 96 }, { x: -70, z: -72 },
      { x: -70, z: -40 }, { x: 112, z: 118 },
    ];
    this.placeMarker();
  }
  get current() { return this.list[Math.min(this.idx, this.list.length - 1)]; }
  get finished() { return this.idx >= this.list.length; }
  placeMarker() {
    const t = this.targets[Math.min(this.idx, this.targets.length - 1)];
    this.marker.position.set(t.x, 7, t.z);
    this.marker.visible = !this.finished;
  }
  target() { return this.targets[Math.min(this.idx, this.targets.length - 1)]; }
  update(dt, combat) {
    if (this.finished) return;
    const t = this.target();
    this.marker.rotation.y += dt * 0.8;
    const d = Math.hypot(this.player.x - t.x, this.player.z - t.z);
    let complete = d < 6;
    if (this.idx === 5) complete = combat && combat.enemies.length > 0 && combat.aliveCount() === 0;
    if (complete) this.completeMission();
  }
  completeMission() {
    const m = this.current;
    this.player.money += m.reward;
    this.player.rep += m.rep;
    this.notice = "Misi selesai: " + m.title + "  +Rp" + m.reward + "  +REP " + m.rep;
    this.done += 1;
    this.idx += 1;
    if (!this.finished) {
      this.dialog = this.current.dialog;
      this.giver = this.current.giver;
      if (this.idx === 3 || this.idx === 8) this.police.setWanted(3, "laporan warga masuk");
      if (this.idx === 5) this.police.setWanted(2, "tembakan terdengar di pelabuhan");
    } else {
      this.dialog = "Teluk Cerah kembali tenang malam ini. Kerja bagus, Raka.";
      this.giver = "Bu Tini";
    }
    this.placeMarker();
  }
}
