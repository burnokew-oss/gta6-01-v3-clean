// Sepuluh misi cerita Teluk Cerah dari Bu Sari, fixer kota.
import "three";
const THREE = window.THREE;
import { showDialog, showBanner } from "./hud.js";
import { setWanted } from "./police.js";
import { playSound } from "./audio.js";

export const MISSIONS = [
  { name: "Pulang Kampung", reward: 150, rep: 40, giver: "Bu Sari", stages: [
    { text: "Ambil mobil pinjaman di dekat dermaga Marina", at: [-150, -40] },
    { text: "Temui Bu Sari di warung Kota Tua", at: [-84, 60] } ] },
  { name: "Titipan", reward: 300, rep: 60, giver: "Bu Sari", stages: [
    { text: "Ambil paket titipan di gudang Pelabuhan", at: [52, 108] },
    { text: "Antar paket ke safehouse Perumahan (wanted 2)", at: [-84, -150], wanted: 2 } ] },
  { name: "Utang Lama", reward: 450, rep: 80, giver: "Bu Sari", stages: [
    { text: "Datangi penagih pertama di Kota Tua", at: [-110, 96] },
    { text: "Datangi penagih kedua di CBD", at: [70, -30] },
    { text: "Hadapi penagih terakhir di Marina", at: [-140, 30] } ] },
  { name: "Balapan Liar", reward: 600, rep: 100, giver: "Nadia", stages: [
    { text: "Capai gerbang balap di avenue CBD", at: [84, -84] },
    { text: "Menangkan putaran: lewati 4 penanda sampai Pelabuhan", at: [84, 120] } ] },
  { name: "Rampok Toko", reward: 900, rep: 150, giver: "Bu Sari", stages: [
    { text: "Masuk toko target di CBD dan ambil uang kas", at: [92, -20] },
    { text: "Kabur ke safehouse Perumahan (wanted 4)", at: [-84, -150], wanted: 4 } ] },
  { name: "Puncak", reward: 1500, rep: 220, giver: "Bu Sari", stages: [
    { text: "Serbu gudang pelabuhan dan habisi geng rival", at: [52, 108], combat: true },
    { text: "Kabur dari kejaran ke Marina", at: [-150, -60], wanted: 3 } ] },
  { name: "Kurir Malam", reward: 700, rep: 120, giver: "Bu Sari", stages: [
    { text: "Ambil paket kurir di garasi Kota Tua", at: [-84, -60] },
    { text: "Antar paket ke dermaga sebelum fajar", at: [-168, 84] } ] },
  { name: "Bayangan", reward: 800, rep: 130, giver: "Sinta", stages: [
    { text: "Ikuti mobil bayangan tanpa ketahuan", at: [120, -84] },
    { text: "Laporkan hasilnya ke Sinta di CBD", at: [100, 10] } ] },
  { name: "Heist Pelabuhan", reward: 1200, rep: 180, giver: "Bu Sari", stages: [
    { text: "Sita truk kontainer di Pelabuhan", at: [20, 168] },
    { text: "Bawa truk ke garasi Bimo (wanted 3)", at: [-84, -60], wanted: 3 } ] },
  { name: "Raja Teluk", reward: 2000, rep: 300, giver: "Bu Sari", stages: [
    { text: "Habisi bos geng dan 5 pengawalnya", at: [52, 96], combat: true },
    { text: "Kembali ke Bu Sari — takhta Teluk menanti", at: [-84, 60] } ] },
];

export const REP_TIERS = ["Warga Baru", "Anak Jalanan", "Kurir Teluk", "Pembalap Teluk", "Penguasa Blok", "Raja Jalanan"];

export function createMissions(state) {
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 14, 18, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd23c, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
  marker.visible = false;
  state.world.scene.add(marker);
  return { current: -1, stage: 0, active: false, marker, doneCount: 0, side: null };
}

export function startMission(state, num) {
  const m = state.missionState;
  if (num < 1 || num > MISSIONS.length) return;
  m.current = num - 1; m.stage = 0; m.active = true;
  const def = MISSIONS[m.current];
  showDialog(state, def.giver, `Misi ${num}: "${def.name}". ${def.stages[0].text}. Hadiah $${def.reward}.`);
  showBanner(state, `MISI ${num} — ${def.name.toUpperCase()}`);
  playSound(state, "mission");
  const st = def.stages[0];
  if (st.wanted) setWanted(state, st.wanted);
}

export function currentObjective(state) {
  const m = state.missionState;
  if (!m.active) return "Jelajahi Teluk Cerah — temui Bu Sari untuk misi";
  return MISSIONS[m.current].stages[m.stage].text;
}

export function updateMissions(state, dt) {
  const m = state.missionState;
  if (!m.active || state.staged) { m.marker.visible = false; return; }
  const def = MISSIONS[m.current];
  const st = def.stages[m.stage];
  m.marker.visible = true;
  m.marker.position.set(st.at[0], 7, st.at[1]);
  m.marker.material.opacity = 0.3 + Math.sin(performance.now() / 300) * 0.12;
  const d = Math.hypot(state.player.pos.x - st.at[0], state.player.pos.z - st.at[1]);
  if (d < 5) {
    m.stage += 1;
    playSound(state, "pickup");
    if (m.stage >= def.stages.length) {
      m.active = false; m.doneCount += 1;
      state.missionsDone = Math.max(state.missionsDone, m.current + 1);
      state.cash += def.reward;
      state.rep += def.rep;
      showBanner(state, `MISI SELESAI — +$${def.reward}`);
      showDialog(state, def.giver, "Kerja bagus, Raka. Kota ini makin hormat padamu.");
      playSound(state, "mission");
      if (m.current + 2 <= MISSIONS.length) startMission(state, m.current + 2);
    } else {
      const nx = def.stages[m.stage];
      showDialog(state, def.giver, nx.text);
      if (nx.wanted) setWanted(state, nx.wanted);
    }
  }
  // Kerang koleksi.
  const shells = state.city.shellPts;
  for (let i = 0; i < shells.length; i++) {
    if (!state.shellGot[i] && state.player.pos.distanceTo(shells[i]) < 2.4) {
      state.shellGot[i] = true; state.shells += 1;
      state.cash += 25; playSound(state, "pickup");
      showBanner(state, `KERANG TELUK ${state.shells}/24 — +$25`);
    }
  }
}
