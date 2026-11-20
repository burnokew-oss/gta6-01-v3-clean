// hud.js — HUD padat ala game sungguhan: uang, HP, armor, senjata & amunisi,
// bintang wanted, jam & hari, misi & objektif, dispatch polisi, radio,
// notifikasi, kecepatan & NOS, dialog, minimap canvas, peta kota penuh.
import { DISTRICTS } from "./config.js";
import { SHOP_POINTS } from "./shops.js";

const $ = (id) => document.getElementById(id);

export class Hud {
  constructor() {
    this.el = {
      money: $("hud-money"), rep: $("hud-rep"), hp: $("bar-hp"), armor: $("bar-armor"),
      weapon: $("hud-weapon"), ammo: $("hud-ammo"), stars: $("hud-stars"),
      clock: $("hud-clock"), missionTitle: $("hud-mission"), objective: $("hud-objective"),
      dispatch: $("hud-dispatch"), radio: $("hud-radio"), speed: $("hud-speed"),
      nos: $("bar-nos"), dialog: $("dialog-box"), dialogWho: $("dialog-who"), dialogText: $("dialog-text"),
      notify: $("notify-box"), minimap: $("minimap"), prompt: $("hud-prompt"),
      wantedWrap: $("hud-wanted"),
    };
    this.mapCanvas = $("map-canvas");
    this.notifyTimer = 0;
    this.dialogTimer = 0;
  }
  notify(text, ms = 3400) {
    this.el.notify.textContent = text;
    this.el.notify.style.opacity = "1";
    this.notifyTimer = ms / 1000;
  }
  dialog(who, text, ms = 5200) {
    this.el.dialogWho.textContent = who;
    this.el.dialogText.textContent = text;
    this.el.dialog.style.opacity = "1";
    this.dialogTimer = ms / 1000;
  }
  update(dt, game) {
    const p = game.player;
    this.el.money.textContent = "$" + p.money.toLocaleString("en-US");
    this.el.rep.textContent = "REP " + p.rep;
    this.el.hp.style.width = Math.max(0, p.hp) + "%";
    this.el.hp.style.background = p.hp > 35 ? "linear-gradient(90deg,#37d353,#7ee08a)" : "linear-gradient(90deg,#d21f2e,#ff5964)";
    this.el.armor.style.width = Math.max(0, p.armor) + "%";
    const w = game.combat.weapon;
    this.el.weapon.textContent = w.name;
    this.el.ammo.textContent = w.id === "fist" ? "—" : String(game.combat.ammo[w.id]);
    this.el.stars.textContent = "★★★★★".slice(0, game.police.wanted) + "☆☆☆☆☆".slice(0, 5 - game.police.wanted);
    this.el.stars.style.color = game.police.wanted > 0 ? "#ffd94d" : "#5a6672";
    const mins = Math.floor(game.clockMin) % (24 * 60);
    const hh = String(Math.floor(mins / 60)).padStart(2, "0"), mm = String(mins % 60).padStart(2, "0");
    this.el.clock.textContent = `Hari ${game.day} · ${hh}:${mm}`;
    const m = game.missions.current;
    this.el.missionTitle.textContent = m ? `Misi ${game.missions.done + 1}/10: ${m.title}` : "Cerita selesai";
    this.el.objective.textContent = "▸ " + game.missions.objectiveText();
    this.el.dispatch.innerHTML = game.police.dispatchLog.map((d) => `<div>📻 ${d}</div>`).join("");
    const ri = game.radio.info;
    this.el.radio.textContent = `♪ ${ri.station} — "${ri.track}"`;
    if (p.driving) {
      this.el.speed.style.opacity = "1";
      this.el.speed.querySelector("b").textContent = String(Math.round(p.speed * 3.6));
      this.el.nos.style.width = (game.shops.owned.has("nos") ? 78 : 0) + "%";
    } else this.el.speed.style.opacity = "0";
    const near = game.shops.near;
    this.el.prompt.textContent = near ? `Tekan E — ${near.name}` : (p.driving ? "F: keluar mobil · H: klakson" : "E: masuk mobil dekat · M: peta");
    this.el.prompt.style.opacity = this.el.prompt.textContent ? "1" : "0";
    if (this.notifyTimer > 0) { this.notifyTimer -= dt; if (this.notifyTimer <= 0) this.el.notify.style.opacity = "0"; }
    if (this.dialogTimer > 0) { this.dialogTimer -= dt; if (this.dialogTimer <= 0) this.el.dialog.style.opacity = "0"; }
    this.drawMinimap(game);
  }
  drawMinimap(game) {
    const c = this.el.minimap, g = c.getContext("2d");
    const S = c.width, half = 230;
    g.fillStyle = "#20303c"; g.fillRect(0, 0, S, S);
    g.save();
    g.translate(S / 2, S / 2);
    g.scale(S / 190, S / 190);
    g.rotate(0);
    const px = game.player.pos.x, pz = game.player.pos.z;
    g.translate(-px, -pz);
    g.fillStyle = "#2c3540";
    for (let i = -half; i <= half; i += 46) { g.fillRect(i - 6, -half, 13, half * 2); g.fillRect(-half, i - 6, half * 2, 13); }
    g.fillStyle = "#1177aa"; g.fillRect(-half, 150, half * 2, 90);
    g.fillStyle = "#e8c98a"; g.fillRect(-half, 148, half * 2, 10);
    for (const s of SHOP_POINTS) { g.fillStyle = s.color; g.fillRect(s.x - 3, s.z - 3, 6, 6); }
    if (game.missions.active) {
      const t = game.missions.targetPos();
      g.fillStyle = "#ffd94d"; g.beginPath(); g.arc(t.x, t.z, 5, 0, 7); g.fill();
    }
    for (const u of game.police.units) {
      if (!u.mesh.visible) continue;
      g.fillStyle = Math.sin(performance.now() / 180) > 0 ? "#ff2233" : "#2255ff";
      g.beginPath(); g.arc(u.mesh.position.x, u.mesh.position.z, 3.4, 0, 7); g.fill();
    }
    g.restore();
    // panah pemain di tengah
    g.save();
    g.translate(S / 2, S / 2);
    g.rotate(game.player.yaw + Math.PI);
    g.fillStyle = "#ffffff";
    g.beginPath(); g.moveTo(0, -8); g.lineTo(5.5, 6); g.lineTo(0, 3); g.lineTo(-5.5, 6); g.closePath(); g.fill();
    g.restore();
    g.strokeStyle = "rgba(255,255,255,0.5)"; g.lineWidth = 2; g.strokeRect(1, 1, S - 2, S - 2);
  }
  drawFullMap(game) {
    const c = this.mapCanvas, g = c.getContext("2d");
    const W = c.width, H = c.height;
    const grad = g.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#17384a"); grad.addColorStop(1, "#0e2432");
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    const toX = (x) => (x + 240) / 480 * W, toY = (z) => (z + 240) / 480 * H;
    g.fillStyle = "#1177aa"; g.fillRect(0, toY(150), W, H - toY(150));
    g.fillStyle = "#e8c98a"; g.fillRect(0, toY(148), W, toY(160) - toY(148));
    g.strokeStyle = "#48586a"; g.lineWidth = 7;
    for (let i = -230; i <= 230; i += 46) {
      g.beginPath(); g.moveTo(toX(i), 0); g.lineTo(toX(i), toY(150)); g.stroke();
      g.beginPath(); g.moveTo(0, toY(i)); g.lineTo(W, toY(i)); g.stroke();
    }
    g.strokeStyle = "#ffd94d"; g.lineWidth = 2; g.setLineDash([8, 7]);
    g.beginPath(); g.moveTo(toX(0), 0); g.lineTo(toX(0), toY(150)); g.stroke();
    g.beginPath(); g.moveTo(0, toY(0)); g.lineTo(W, toY(0)); g.stroke();
    g.setLineDash([]);
    for (const d of DISTRICTS) {
      g.fillStyle = d.color;
      g.beginPath(); g.arc(toX(d.x), toY(d.z), 7, 0, 7); g.fill();
      g.font = "bold 17px sans-serif"; g.textAlign = "center";
      g.fillStyle = "#ffffff"; g.shadowColor = "#000"; g.shadowBlur = 5;
      g.fillText(d.name, toX(d.x), toY(d.z) - 13);
      g.shadowBlur = 0;
    }
    for (const s of SHOP_POINTS) {
      g.fillStyle = s.color; g.fillRect(toX(s.x) - 5, toY(s.z) - 5, 10, 10);
      g.fillStyle = "#fff"; g.font = "12px sans-serif"; g.textAlign = "center";
      g.fillText(s.name, toX(s.x), toY(s.z) + 22);
    }
    if (game.missions.active) {
      const t = game.missions.targetPos();
      g.fillStyle = "#ffd94d"; g.font = "26px sans-serif";
      g.fillText("★", toX(t.x), toY(t.z) + 8);
    }
    const p = game.player.pos;
    g.save();
    g.translate(toX(p.x), toY(p.z)); g.rotate(game.player.yaw + Math.PI);
    g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(0, -11); g.lineTo(7, 8); g.lineTo(0, 4); g.lineTo(-7, 8); g.closePath(); g.fill();
    g.restore();
    // legenda
    g.fillStyle = "rgba(8,14,20,0.82)"; g.fillRect(16, H - 128, 252, 112);
    g.strokeStyle = "rgba(255,255,255,0.4)"; g.strokeRect(16, H - 128, 252, 112);
    g.fillStyle = "#fff"; g.font = "bold 14px sans-serif"; g.textAlign = "left";
    g.fillText("LEGENDA", 28, H - 104);
    g.font = "13px sans-serif";
    g.fillText("▲  Raka (kamu)", 28, H - 82);
    g.fillText("★  Objektif misi", 28, H - 62);
    g.fillText("■  Toko / garasi / warung", 28, H - 42);
    g.fillText("●  Distrik kota", 28, H - 22);
    g.font = "bold 22px sans-serif"; g.textAlign = "center";
    g.fillText("PETA KOTA TELUK CERAH", W / 2, 34);
  }
}
