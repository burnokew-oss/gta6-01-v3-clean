// missions.js — 10 misi cerita berurutan: objektif bertahap, dialog HUD,
// penanda cahaya, hadiah uang dan reputasi.
import { MISSIONS } from "./config.js";

const STAGE_SETS = [
  ["Ambil mobil pinjaman di garasi", "Antar mobil ke Warung Senja"],
  ["Curi van roti di Toko Roti Matahari", "Antar van ke Pasar Ikan sebelum dingin"],
  ["Kejar pencuri ke arah pelabuhan", "Hentikan kendaraannya"],
  ["Rampok toko emas di Pusat Cerah", "Kabur sampai bintang wanted padam"],
  ["Ambil paket di kedai kopi", "Antar paket ke dermaga Kapten Bram"],
  ["Capai gerbang balapan 1", "Menangkan balapan lewat 6 gerbang"],
  ["Masuki gudang pelabuhan", "Kalahkan 4 penjaga gudang"],
  ["Ambil koper di menara jam", "Antar koper ke Bukit Melati"],
  ["Naiki atap pasar", "Capai mercusuar sebelum fajar"],
  ["Pergi ke Pelabuhan Timur", "Rebut kapal dan berlayar pulang"],
];
const DIALOGS = [
  ["Bibi Ratna", "Raka! Kau pulang juga. Mobil pinjaman ada di garasi, jangan sampai lecet."],
  ["Pak Darma", "Vanku dicuri orang tak dikenal. Ambil kembali, rotinya untuk pasar pagi."],
  ["Sersan Laksmi", "Pencuri perahu kabur ke pelabuhan. Kejar, tapi jangan rusak kotaku."],
  ["Orang Asing", "Toko emas itu menyimpan uang kotor. Ambil, dan kita bagi dua."],
  ["Kapten Bram", "Paket ini tidak boleh dibuka. Antar ke dermaga, cepat."],
  ["Dito", "Balapan Jalan Palma, enam gerbang. Kalah, kau traktir sate sebulan."],
  ["Bibi Ratna", "Gudang itu bukan tempatmu, tapi keluargamu terikat di sana. Hati-hati."],
  ["Pak Darma", "Koper di menara jam. Isinya masa depan pasar ini, Raka."],
  ["Dito", "Atap ke atap sampai mercusuar. Kota ini milik yang berani."],
  ["Kapten Bram", "Satu pertempuran terakhir di Pelabuhan Timur. Akhiri, lalu berlayar."],
];
export const MISSION_SPOTS = [
  { x: -52, z: 58 }, { x: -120, z: 92 }, { x: 150, z: 118 }, { x: 24, z: -24 },
  { x: -70, z: 120 }, { x: 120, z: -42 }, { x: 150, z: 118 }, { x: 30, z: -30 },
  { x: 168, z: 158 }, { x: 168, z: 118 },
];

export class Missions {
  constructor(scene) {
    this.index = 0;
    this.stage = 0;
    this.done = 0;
    this.active = false;
    this.marker = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 26, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffd94d, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 13;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.22, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0xffd94d }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.4;
    this.marker.add(beam, ring);
    this.marker.visible = false;
    scene.add(this.marker);
    this.raceGates = [];
  }
  get current() { return MISSIONS[this.index] ?? null; }
  start() {
    if (!this.current) return null;
    this.active = true; this.stage = 0;
    this.marker.visible = true;
    this.placeMarker();
    return { dialog: DIALOGS[this.index], objective: STAGE_SETS[this.index][0], mission: this.current };
  }
  placeMarker() {
    const spot = MISSION_SPOTS[this.index];
    const off = this.stage === 0 ? { x: 0, z: 0 } : { x: 26, z: -18 };
    this.marker.position.set(spot.x + off.x, 0, spot.z + off.z);
  }
  targetPos() { return this.marker.position; }
  update(dt, t, playerPos, ctx) {
    if (!this.active) return null;
    this.marker.rotation.y += dt * 0.8;
    const d = Math.hypot(playerPos.x - this.marker.position.x, playerPos.z - this.marker.position.z);
    if (d > 4.2) return null;
    this.stage++;
    if (this.stage < STAGE_SETS[this.index].length) {
      this.placeMarker();
      return { objective: STAGE_SETS[this.index][this.stage] };
    }
    const m = this.current;
    this.active = false; this.done++;
    this.marker.visible = false;
    ctx.money += m.reward; ctx.rep += m.rep;
    const finished = { mission: m, reward: m.reward, rep: m.rep };
    this.index++;
    return { completed: finished };
  }
  objectiveText() {
    if (!this.current) return "Semua misi selesai. Teluk Cerah aman berkat Raka.";
    if (!this.active) return `Temui pemberi misi: ${this.current.giver} — ${this.current.title}`;
    return STAGE_SETS[this.index][this.stage];
  }
}
