import 'three';
const THREE = window.THREE;

export function createHelicopter(state) {
  const group = new THREE.Group();
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x22242c });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.4, metalness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.1, metalness: 0.7 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.7, 4.6), bodyMat);
  group.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), glassMat);
  nose.scale.set(1, 0.85, 1.2);
  nose.position.set(0, -0.15, 2.4);
  group.add(nose);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 5.2), bodyMat);
  tail.position.set(0, 0.3, -4.4);
  group.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.6, 1.2), darkMat);
  fin.position.set(0, 1.1, -6.6);
  group.add(fin);
  const skidL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.6), darkMat);
  skidL.position.set(-1.1, -1.25, 0.2);
  group.add(skidL);
  const skidR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.6), darkMat);
  skidR.position.set(1.1, -1.25, 0.2);
  group.add(skidR);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.9, 8), darkMat);
  mast.position.y = 1.2;
  group.add(mast);
  const rotor = new THREE.Group();
  rotor.position.y = 1.7;
  const bladeGeo = new THREE.BoxGeometry(11, 0.08, 0.5);
  const bladeMat = new THREE.MeshBasicMaterial({ color: 0x30323a, transparent: true, opacity: 0.75 });
  const b1 = new THREE.Mesh(bladeGeo, bladeMat);
  const b2 = new THREE.Mesh(bladeGeo, bladeMat);
  b2.rotation.y = Math.PI / 2;
  rotor.add(b1);
  rotor.add(b2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(5.6, 24), new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false,
  }));
  disc.rotation.x = -Math.PI / 2;
  rotor.add(disc);
  group.add(rotor);

  const spot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2c8 }));
  spot.position.set(0, -0.9, 2.2);
  group.add(spot);

  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xfff2c8, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(6.5, 15, 20, 1, true), coneMat);
  cone.position.set(0, -7.8, 4);
  cone.rotation.x = 0.35;
  group.add(cone);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 24),
    new THREE.MeshBasicMaterial({ color: 0xfff2c8, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.08;

  const heli = {
    group,
    rotor,
    cone,
    pool,
    position: group.position,
    target: new THREE.Vector3(40, 0, 100),
    mode: 'patrol',
    bobPhase: 0,
  };
  group.position.set(30, 30, 110);
  if (state.world && state.world.scene) {
    state.world.scene.add(group);
    state.world.scene.add(pool);
  }
  state.helicopter = heli;
  return heli;
}

export function updateHelicopter(state, dt) {
  const heli = state.helicopter;
  if (!heli || !heli.group) return;
  const player = state.player;
  const pp = player && player.group ? player.group.position : new THREE.Vector3(40, 0, 100);
  const wanted = state.wanted || 0;
  const shot = state.shotName || '';
  const active = wanted >= 3 || shot === 'chase' || shot === 'shootout';
  heli.group.visible = active;
  heli.pool.visible = active;
  heli.cone.visible = active;
  if (!active) return;
  heli.bobPhase += dt;
  const tx = pp.x - 18 + Math.sin(heli.bobPhase * 0.4) * 3;
  const tz = pp.z + 5 + Math.cos(heli.bobPhase * 0.33) * 3;
  const ty = 13 + Math.sin(heli.bobPhase * 0.9) * 1.2;
  heli.group.position.x += (tx - heli.group.position.x) * Math.min(1, dt * 1.2);
  heli.group.position.y += (ty - heli.group.position.y) * Math.min(1, dt * 1.2);
  heli.group.position.z += (tz - heli.group.position.z) * Math.min(1, dt * 1.2);
  if (shot === 'chase' || shot === 'shootout') {
    heli.group.position.set(tx, ty, tz);
  }
  heli.group.rotation.y = Math.atan2(pp.x - heli.group.position.x, pp.z - heli.group.position.z);
  heli.rotor.rotation.y += dt * 24;
  heli.target.set(pp.x - 8, 0, pp.z);
  heli.pool.position.set(heli.target.x, 0.08, heli.target.z);
  const pulse = 0.25 + Math.sin(heli.bobPhase * 2.2) * 0.05;
  heli.pool.material.opacity = pulse;
  heli.cone.material.opacity = 0.12 + Math.sin(heli.bobPhase * 2.2) * 0.02;
}
