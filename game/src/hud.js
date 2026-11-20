// hud.js — HUD padat ala game sungguhan: uang, HP, armor, senjata dan
// amunisi, bintang wanted, jam dan hari, misi aktif + objektif, dispatch
// polisi, radio, notifikasi, dialog, kecepatan dan NOS, minimap canvas.
import { DISTRICTS, SHOPS } from "./config.js";

export class Hud {
  constructor() {
    this.el = {};
    for (const id of ["money", "rep", "hpbar", "armorbar", "hptext", "stars", "clock", "weapon",
      "mission", "objective", "dispatch", "radio", "notice", "dialog", "speed", "nosbar",
      "district", "prompt", "wanted-label"]) {
      this.el[id] = document.getElementById("hud-" + id);
    }
    this.minimap = document.getElementById("minimap");
    this.mm = this.minimap ? this.minimap.getContext("2d") : null;
    this.noticeT = 0;
  }
  setNotice(text) {
    if (this.el.notice) this.el.notice.textContent = text;
    this.noticeT = 4;
  }
  update(dt, state, hour) {
    const p = state.player, c = state.combat, pol = state.police, m = state.missions;
    this.noticeT = Math.max(0, this.noticeT - dt);
    if (this.el.notice) this.el.notice.style.opacity = this.noticeT > 0 ? "1" : "0";
    if (this.el.money) this.el.money.textContent = "Rp " + p.money.toLocaleString("id-ID");
    if (this.el.rep) this.el.rep.textContent = "REP " + p.rep;
    if (this.el.hpbar) this.el.hpbar.style.width = Math.max(0, p.hp) + "%";
    if (this.el.armorbar) this.el.armorbar.style.width = Math.max(0, p.armor) + "%";
    if (this.el.hptext) this.el.hptext.textContent = "HP " + Math.ceil(p.hp) + " • ARMOR " + Math.ceil(p.armor);
    if (this.el.stars) {
      this.el.stars.textContent = "★★★★★".slice(0, pol.wanted) + "☆☆☆☆☆".slice(0, 5 - pol.wanted);
      this.el.stars.style.color = pol.wanted > 0 ? "#ffd23e" : "#94a3b8";
    }
    if (this.el["wanted-label"]) this.el["wanted-label"].textContent = pol.wanted > 0 ? "WANTED LEVEL " + pol.wanted : "AMAN";
    const hh = Math.floor(hour), mm2 = Math.floor((hour - hh) * 60);
    if (this.el.clock) this.el.clock.textContent = "Hari 3 • " + String(hh).padStart(2, "0") + ":" + String(mm2).padStart(2, "0");
    const ammo = c.weapon.ammo < 0 ? "∞" : String(c.ammo[c.weapon.id]);
    if (this.el.weapon) this.el.weapon.textContent = c.weapon.name.toUpperCase() + "  " + ammo;
    if (this.el.mission) this.el.mission.textContent = m.finished ? "SEMUA MISI SELESAI" : "MISI " + (m.idx + 1) + "/10: " + m.current.title;
    if (this.el.objective) this.el.objective.textContent = m.finished ? "Jelajahi Teluk Cerah dengan bebas." : "▸ " + m.current.goal;
    if (this.el.dispatch) this.el.dispatch.innerHTML = pol.dispatchLog.map((d) => "<div>📻 " + d + "</div>").join("");
    if (this.el.radio) this.el.radio.textContent = "♪ " + state.radio.station.name + " — " + state.radio.track;
    if (this.el.dialog) this.el.dialog.innerHTML = m.dialog ? "<b>" + m.giver + ":</b> " + m.dialog : "";
    if (this.el.speed) this.el.speed.textContent = p.mode === "drive" ? Math.abs(Math.round(p.speed * 3.6)) + " km/h" : (p.speed ? "JALAN " + p.speed.toFixed(0) : "DIAM");
    if (this.el.nosbar) this.el.nosbar.style.width = p.nos + "%";
    let dist = "Taman Cerah";
    let bd = 1e9;
    for (const d of DISTRICTS) { const dd = Math.hypot(p.x - d.x, p.z - d.z); if (dd < bd) { bd = dd; dist = d.name; } }
    if (this.el.district) this.el.district.textContent = dist.toUpperCase();
    const near = state.shops.nearest();
    if (this.el.prompt) this.el.prompt.textContent = near ? "[E] " + near.name : (p.mode === "drive" ? "[E] Keluar mobil • [M] Peta • [R] Radio" : "[E] Masuk mobil • [M] Peta");
    this.drawMinimap(state);
  }
  drawMinimap(state) {
    if (!this.mm) return;
    const g = this.mm, S = 176, C = S / 2, scale = S / 280;
    g.fillStyle = "#7ec850"; g.fillRect(0, 0, S, S);
    g.fillStyle = "#1e9bb8"; g.fillRect(0, C + 118 * scale, S, S);
    g.fillStyle = "#f2ddae"; g.fillRect(0, C + 104 * scale, S, 14 * scale + 4);
    g.strokeStyle = "#2c2f36"; g.lineWidth = 7;
    for (let i = -3; i <= 3; i++) {
      g.beginPath(); g.moveTo(0, C + i * 34 * scale); g.lineTo(S, C + i * 34 * scale); g.stroke();
      g.beginPath(); g.moveTo(C + i * 34 * scale, 0); g.lineTo(C + i * 34 * scale, S); g.stroke();
    }
    g.strokeStyle = "#ffd23e"; g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, C); g.lineTo(S, C); g.stroke();
    const dot = (x, z, color, r) => { g.fillStyle = color; g.beginPath(); g.arc(C + x * scale, C + z * scale, r, 0, 7); g.fill(); };
    for (const s of SHOPS) dot(s.x, s.z, s.color, 3.4);
    const tgt = state.missions.target();
    if (!state.missions.finished) dot(tgt.x, tgt.z, "#ffd23e", 4.6);
    for (const u of state.police.units) dot(u.car.position.x, u.car.position.z, "#3b82f6", 3.6);
    for (const e of state.combat.enemies) if (e.alive) dot(e.mesh.position.x, e.mesh.position.z, "#ef4444", 3);
    const p = state.player;
    g.save();
    g.translate(C + p.x * scale, C + p.z * scale);
    g.rotate(-p.angle + Math.PI / 2);
    g.fillStyle = "#ffffff";
    g.beginPath(); g.moveTo(0, -6); g.lineTo(4.4, 5); g.lineTo(0, 2.4); g.lineTo(-4.4, 5); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = "rgba(255,255,255,0.7)"; g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
  }
}
