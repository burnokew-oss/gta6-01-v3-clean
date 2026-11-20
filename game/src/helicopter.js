// helicopter.js — helikopter polisi bermodel: badan membulat, kaca kabin,
// boom ekor, rotor utama dan ekor berputar, skid, lampu strobo, dan kerucut
// sorot cahaya yang mengikuti pemain.
import { canvasTexture } from "./city.js";

export function makeHelicopter() {
  const T3 = window.THREE;
  const heli = new T3.Group();
  const bodyMat = new T3.MeshPhongMaterial({ color: 0x1e3a5f, shininess: 70, specular: 0x88aacc });
  const body = new T3.Mesh(new T3.SphereGeometry(1.5, 16, 12), bodyMat);
  body.scale.set(1.5, 0.95, 0.9); body.castShadow = true;
  heli.add(body);
  const nose = new T3.Mesh(new T3.SphereGeometry(1.05, 14, 10),
    new T3.MeshPhongMaterial({ color: 0x9fd4f2, shininess: 130, specular: 0xffffff }));
  nose.position.set(1.45, 0.08, 0); nose.scale.set(0.9, 0.8, 0.85);
  heli.add(nose);
  const stripe = new T3.Mesh(new T3.BoxGeometry(3.4, 0.3, 2.0), new T3.MeshBasicMaterial({ color: 0xf8fafc }));
  stripe.position.set(-0.2, -0.25, 0); heli.add(stripe);
  const boom = new T3.Mesh(new T3.CylinderGeometry(0.22, 0.4, 4.6, 8), bodyMat);
  boom.rotation.z = Math.PI / 2 - 0.06; boom.position.set(-3.6, 0.35, 0);
  heli.add(boom);
  const fin = new T3.Mesh(new T3.BoxGeometry(0.16, 1.5, 0.7), new T3.MeshBasicMaterial({ color: 0xdc2626 }));
  fin.position.set(-5.85, 0.85, 0); heli.add(fin);
  const tailRotor = new T3.Mesh(new T3.BoxGeometry(0.08, 1.7, 0.18), new T3.MeshBasicMaterial({ color: 0x22262c }));
  tailRotor.position.set(-5.85, 0.85, 0.45); heli.add(tailRotor);
  const mast = new T3.Mesh(new T3.CylinderGeometry(0.14, 0.14, 0.6, 8), bodyMat);
  mast.position.y = 1.55; heli.add(mast);
  const rotor = new T3.Group();
  for (const rz of [0, Math.PI / 2]) {
    const blade = new T3.Mesh(new T3.BoxGeometry(11.5, 0.06, 0.5), new T3.MeshBasicMaterial({ color: 0x1f2937 }));
    blade.rotation.y = rz; rotor.add(blade);
  }
  rotor.position.y = 1.9; heli.add(rotor);
  for (const s of [-1, 1]) {
    const skid = new T3.Mesh(new T3.CylinderGeometry(0.07, 0.07, 3.6, 6), new T3.MeshStandardMaterial({ color: 0xd7dde3, metalness: 0.7, roughness: 0.35 }));
    skid.rotation.z = Math.PI / 2; skid.position.set(0, -1.55, s * 1.05); heli.add(skid);
    const strut = new T3.Mesh(new T3.CylinderGeometry(0.06, 0.06, 0.8, 6), skid.material);
    strut.position.set(0.7, -1.2, s * 0.9); strut.rotation.x = s * 0.4; heli.add(strut);
  }
  const strobe = new T3.Mesh(new T3.SphereGeometry(0.14, 8, 8), new T3.MeshBasicMaterial({ color: 0xff3333 }));
  strobe.position.set(-5.85, 1.7, 0); heli.add(strobe);
  // Kerucut sorot: transparan aditif, melebar ke tanah.
  const coneTex = canvasTexture(64, 128, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(255,246,200,0.85)");
    grad.addColorStop(1, "rgba(255,246,200,0.05)");
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  });
  const cone = new T3.Mesh(new T3.ConeGeometry(3.8, 16, 20, 1, true),
    new T3.MeshBasicMaterial({ map: coneTex, transparent: true, opacity: 0.1, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide }));
  cone.position.set(0.6, -9.2, 0);
  heli.add(cone);
  const pool = new T3.Mesh(new T3.CircleGeometry(4.6, 20),
    new T3.MeshBasicMaterial({ color: 0xfff2b8, transparent: true, opacity: 0.18, blending: T3.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  heli.add(pool);
  heli.userData = { rotor, tailRotor, cone, pool, strobe };
  return heli;
}

export function updateHelicopter(heli, target, t, dt) {
  const u = heli.userData;
  const orbitR = 15;
  const hx = target.x + Math.cos(t * 0.35) * orbitR;
  const hz = target.z + Math.sin(t * 0.35) * orbitR;
  heli.position.x += (hx - heli.position.x) * Math.min(1, dt * 1.6);
  heli.position.z += (hz - heli.position.z) * Math.min(1, dt * 1.6);
  heli.position.y = 17.5 + Math.sin(t * 0.9) * 0.7;
  heli.rotation.y = -Math.atan2(hx - target.x, hz - target.z) + Math.PI / 2 + Math.PI;
  heli.rotation.z = 0.1;
  u.rotor.rotation.y = t * 14;
  u.tailRotor.rotation.x = t * 22;
  u.strobe.material.color.setHex(Math.sin(t * 7) > 0 ? 0xff3333 : 0x550000);
  // Kolam sorot menempel di tanah tepat di bawah kerucut, mengikuti pemain.
  u.pool.position.set(target.x - heli.position.x, -heli.position.y + 0.12, target.z - heli.position.z);
}
