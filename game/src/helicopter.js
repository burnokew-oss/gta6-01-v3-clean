// Helikopter polisi GARUDA-1: badan membulat, rotor blur, kerucut sorot lembut.
import "three";
const THREE = window.THREE;

export function createHelicopter(state) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2c3e5e, roughness: 0.32, metalness: 0.55 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.45, 22, 16), bodyMat);
  body.scale.set(1, 0.82, 1.55); body.castShadow = true; g.add(body);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x9fd4ff, roughness: 0.05, metalness: 0.3, clearcoat: 1, transparent: true, opacity: 0.75 }));
  cockpit.scale.set(0.9, 0.72, 0.9); cockpit.position.set(0, 0.12, 1.05); g.add(cockpit);
  const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.09, 8, 24), new THREE.MeshStandardMaterial({ color: 0xf2b821, roughness: 0.4 }));
  stripe.rotation.x = Math.PI / 2; stripe.scale.set(1, 1.4, 1); g.add(stripe);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 4.6, 10), bodyMat);
  tail.rotation.x = Math.PI / 2 - 0.06; tail.position.set(0, 0.22, -3.4); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.05, 0.6), bodyMat);
  fin.position.set(0, 0.55, -5.6); g.add(fin);
  const tailRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 18),
    new THREE.MeshBasicMaterial({ color: 0x222630, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  tailRotor.rotation.z = Math.PI / 2; tailRotor.position.set(0.18, 0.55, -5.6); g.add(tailRotor);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.5, 8), bodyMat);
  mast.position.y = 1.25; g.add(mast);
  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.03, 28),
    new THREE.MeshBasicMaterial({ color: 0x1c202a, transparent: true, opacity: 0.34, side: THREE.DoubleSide }));
  rotor.position.y = 1.52; g.add(rotor);
  const rotorHub = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), bodyMat);
  rotorHub.position.y = 1.5; g.add(rotorHub);
  for (const sx of [-1, 1]) {
    const skidPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6), bodyMat);
    skidPost.position.set(sx * 0.8, -1.05, 0.5); g.add(skidPost);
    const skidPost2 = skidPost.clone(); skidPost2.position.z = -0.7; g.add(skidPost2);
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6, 6), bodyMat);
    skid.rotation.x = Math.PI / 2; skid.position.set(sx * 0.8, -1.4, -0.1); g.add(skid);
  }
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2438 }));
  navR.position.set(-1.3, 0, 0.2); g.add(navR);
  const navG = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0x2aff7a }));
  navG.position.set(1.3, 0, 0.2); g.add(navG);

  // Kerucut sorot lembut + kolam cahaya kecil dan hangat di tanah.
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffeec2, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending,
    depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.6, 26, 24, 1, true), coneMat);
  cone.position.y = -13.4; g.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.6, 22),
    new THREE.MeshBasicMaterial({ color: 0xffe9bb, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.06; state.world.scene.add(pool);

  g.position.set(30, 26, -40);
  g.visible = false;
  state.world.scene.add(g);
  return {
    mesh: g, pos: g.position, rotor, tailRotor, pool, cone,
    target: new THREE.Vector3(), mode: "off", angle: 0, name: "GARUDA-1",
  };
}

export function updateHelicopter(state, dt) {
  const h = state.heli;
  const active = state.wanted >= 3;
  h.mesh.visible = active || state.staged === "chase";
  if (!h.mesh.visible) { h.pool.visible = false; return; }
  h.pool.visible = true;
  h.mode = "pursuit";
  h.angle += dt * 0.55;
  if (state.staged === "chase") {
    h.pos.x += (6.5 - h.pos.x) * Math.min(1, dt * 2);
    h.pos.z += (-15 - h.pos.z) * Math.min(1, dt * 2);
    h.pos.y = 16.5 + Math.sin(performance.now() / 700) * 0.5;
    h.mesh.lookAt(0, 0, 10);
    h.rotor.rotation.y += dt * 26;
    h.tailRotor.rotation.x += dt * 32;
    h.pool.position.set(3, 0.06, 5);
    h.pool.material.opacity = 0.2;
    return;
  }
  if (state.staged === "shootout") {
    h.pos.x += (-11 - h.pos.x) * Math.min(1, dt * 2);
    h.pos.z += (86 - h.pos.z) * Math.min(1, dt * 2);
    h.pos.y = 19 + Math.sin(performance.now() / 800) * 0.5;
    h.mesh.lookAt(0, 0, 100);
    h.rotor.rotation.y += dt * 26;
    h.tailRotor.rotation.x += dt * 32;
    h.pool.position.set(-2, 0.06, 97);
    h.pool.material.opacity = 0.15;
    return;
  }
  const anchor = state.player.pos;
  const tx = anchor.x + Math.cos(h.angle) * 13;
  const tz = anchor.z + Math.sin(h.angle) * 13 - 6;
  h.pos.x += (tx - h.pos.x) * Math.min(1, dt * 1.6);
  h.pos.z += (tz - h.pos.z) * Math.min(1, dt * 1.6);
  h.pos.y = 24 + Math.sin(h.angle * 2.3) * 1.1;
  h.mesh.lookAt(anchor.x, 0, anchor.z);
  h.rotor.rotation.y += dt * 26;
  h.tailRotor.rotation.x += dt * 32;
  h.pool.position.set(anchor.x + 2.5, 0.06, anchor.z - 3.5);
  const flicker = 0.26 + Math.sin(performance.now() / 90) * 0.03;
  h.pool.material.opacity = flicker;
}
