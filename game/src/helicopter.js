// helicopter.js — helikopter polisi bermodel penuh: badan berpanel, kaca
// kokpit, rotor utama dengan cakram blur, rotor ekor, skid, strobo, dan
// kerucut sorot terang yang mencapai mobil pemain dengan kolam cahaya elips.
import { makeCanvas } from "./render.js";

export class Helicopter {
  constructor(scene) {
    this.group = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({ color: 0x22303e, shininess: 80, specular: 0x99bbdd });
    const accent = new THREE.MeshPhongMaterial({ color: 0xf2f2f2, shininess: 60 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.9, 18, 14), bodyMat);
    body.scale.set(1.5, 1, 1); body.castShadow = true; this.group.add(body);
    const belly = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.5, 1.7), accent);
    belly.position.y = -0.9; this.group.add(belly);
    const glass = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 10),
      new THREE.MeshPhongMaterial({ color: 0x9fd8ef, shininess: 180, specular: 0xffffff }));
    glass.position.set(1.9, 0.25, 0); glass.scale.set(1, 0.85, 0.9); this.group.add(glass);
    // garis panel badan
    for (let i = 0; i < 3; i++) {
      const seam = new THREE.Mesh(new THREE.TorusGeometry(1.83 - i * 0.12, 0.03, 6, 24), new THREE.MeshPhongMaterial({ color: 0x10161d }));
      seam.rotation.y = Math.PI / 2; seam.position.x = 0.7 - i * 0.85; seam.scale.y = 1; this.group.add(seam);
    }
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, 5.6, 10), bodyMat);
    tail.rotation.z = Math.PI / 2 - 0.06; tail.position.set(-4.4, 0.45, 0); tail.castShadow = true; this.group.add(tail);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.14), accent);
    fin.position.set(-7.1, 1.1, 0); this.group.add(fin);
    this.tailRotor = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.7, 0.16), new THREE.MeshPhongMaterial({ color: 0x14161a }));
      blade.rotation.z = i * Math.PI / 2; this.tailRotor.add(blade);
    }
    this.tailRotor.position.set(-7.1, 1.1, 0.16); this.group.add(this.tailRotor);
    // rotor utama + cakram blur semi-transparan
    this.rotor = new THREE.Group();
    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.05, 0.5), new THREE.MeshPhongMaterial({ color: 0x14161a }));
      blade.rotation.y = i * Math.PI / 2; this.rotor.add(blade);
    }
    const discTex = makeCanvas(128, 128, (g) => {
      const rg = g.createRadialGradient(64, 64, 8, 64, 64, 62);
      rg.addColorStop(0, "rgba(200,220,235,0)");
      rg.addColorStop(0.75, "rgba(200,220,235,0.20)");
      rg.addColorStop(1, "rgba(200,220,235,0.42)");
      g.fillStyle = rg; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
    });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(5.9, 28),
      new THREE.MeshBasicMaterial({ map: discTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    disc.rotation.x = -Math.PI / 2; this.rotor.add(disc);
    this.rotor.position.y = 2.05; this.group.add(this.rotor);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8), bodyMat);
    mast.position.y = 1.75; this.group.add(mast);
    // skid
    const skidMat = new THREE.MeshPhongMaterial({ color: 0x14161a });
    for (const s of [-1, 1]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 4.6, 8), skidMat);
      skid.rotation.z = Math.PI / 2; skid.position.set(0, -1.85, s * 1.25); this.group.add(skid);
      for (const px of [-1.2, 1.2]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 6), skidMat);
        strut.position.set(px, -1.4, s * 1.25); strut.rotation.x = s * 0.4; this.group.add(strut);
      }
    }
    this.strobe = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    this.strobe.position.set(-7.1, 2.05, 0); this.group.add(this.strobe);
    const tailLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0x33ff77 }));
    tailLight.position.set(-7.1, 0.4, 0.3); this.group.add(tailLight);
    // KERUCUT SOROT: tebal, terang, mencapai target
    const coneTex = makeCanvas(64, 128, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, "rgba(255,246,200,0.85)");
      gr.addColorStop(1, "rgba(255,246,200,0.06)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    this.cone = new THREE.Mesh(new THREE.ConeGeometry(4.6, 26, 20, 1, true),
      new THREE.MeshBasicMaterial({ map: coneTex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.cone.position.y = -13;
    this.spotGroup = new THREE.Group();
    this.spotGroup.add(this.cone);
    this.group.add(this.spotGroup);
    // kolam cahaya elips di tanah
    this.pool = new THREE.Mesh(new THREE.CircleGeometry(3.4, 22),
      new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.pool.rotation.x = -Math.PI / 2; this.pool.scale.y = 0.7;
    scene.add(this.pool);
    this.group.position.set(30, 26, -40);
    this.active = false;
    this.angle = 0;
    scene.add(this.group);
  }
  update(dt, t, target, close = false) {
    const dist = close ? 13 : 26;
    const height = close ? 11 : 17;
    this.angle += dt * (close ? 0.25 : 0.4);
    const want = new THREE.Vector3(
      target.x + Math.cos(this.angle) * dist,
      height,
      target.z + Math.sin(this.angle) * dist);
    this.group.position.lerp(want, Math.min(1, dt * 1.6));
    const look = target.clone(); look.y = this.group.position.y - 2;
    this.group.lookAt(look);
    this.group.rotateZ(Math.sin(t * 0.8) * 0.06 - 0.14); // miring mengikuti kejar
    this.rotor.rotation.y += dt * 28;
    this.tailRotor.rotation.x += dt * 40;
    this.strobe.material.color.setHex(Math.sin(t * 9) > 0 ? 0xff2233 : 0x550000);
    // arahkan kerucut sorot ke target, kolam cahaya menempel di tanah di target
    this.pool.position.set(target.x, 0.09, target.z);
    this.pool.material.opacity = 0.26 + 0.08 * Math.sin(t * 7);
    this.aimCone(target);
    this.group.visible = this.active;
    this.pool.visible = this.active;
  }
  aimCone(target) {
    // kerucut direntangkan dari badan helikopter tepat ke titik target:
    // posisi tengah + sumbu -Y disejajarkan ke arah target (ruang lokal).
    this.group.updateMatrixWorld();
    const local = this.group.worldToLocal(target.clone());
    const len = Math.max(6, local.length());
    const dir = local.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
    this.spotGroup.quaternion.copy(q);
    this.cone.scale.set(1, len / 26, 1);
    this.cone.position.y = -len / 2;
  }
  setPose(target) { // pose deterministik screenshot chase: besar & dekat
    this.active = true;
    this.group.position.set(target.x + 5.0, 9.0, target.z - 11.5);
    const look = target.clone(); look.y = 8;
    this.group.lookAt(look);
    this.group.rotateZ(-0.18);
    this.rotor.rotation.y = 0.7;
    this.pool.position.set(target.x, 0.09, target.z);
    this.aimCone(target);
    this.group.visible = true; this.pool.visible = true;
  }
}
