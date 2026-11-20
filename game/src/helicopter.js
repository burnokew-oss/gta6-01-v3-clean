// Teluk Cerah — the police helicopter: a fully panelled airframe with a
// blurred main-rotor disc, a spinning tail rotor, skids, a strobing
// beacon and a real spotlight whose cone lands on the player's car.

function panelTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#eef0f2"; g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#16283f"; g.fillRect(0, 78, 512, 50);
  g.fillStyle = "#e8b13c"; g.fillRect(0, 72, 512, 6);
  g.strokeStyle = "rgba(20,30,44,0.35)"; g.lineWidth = 2;
  for (const x of [70, 150, 330, 430]) { g.beginPath(); g.moveTo(x, 6); g.lineTo(x, 70); g.stroke(); }
  g.fillStyle = "rgba(20,30,44,0.25)"; g.fillRect(196, 12, 120, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

function sideDecalTexture() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 96;
  const g = c.getContext("2d");
  g.fillStyle = "#16283f"; g.fillRect(0, 0, 512, 96);
  g.fillStyle = "#e8b13c"; g.fillRect(0, 0, 512, 7);
  g.fillStyle = "#ffffff"; g.font = "bold 52px Arial"; g.textAlign = "center";
  g.fillText("POLISI UDARA", 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

export function buildHelicopter(envMap) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    map: panelTexture(), metalness: 0.45, roughness: 0.38,
    clearcoat: 0.8, clearcoatRoughness: 0.25, envMap, envMapIntensity: 1.0,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a2027, roughness: 0.5, metalness: 0.5 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x14222f, metalness: 0.2, roughness: 0.06, envMap, envMapIntensity: 1.7,
    transparent: true, opacity: 0.94,
  });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.5, 28, 20), bodyMat);
  body.scale.set(1.55, 0.92, 0.88); body.castShadow = true;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1.05, 24, 16), glassMat);
  nose.scale.set(1.0, 0.82, 0.86); nose.position.set(1.55, 0.06, 0);
  group.add(nose);
  const belly = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 1.5), darkMat);
  belly.position.set(0.1, -1.05, 0); group.add(belly);
  const decalMat = new THREE.MeshBasicMaterial({ map: sideDecalTexture() });
  for (const sz of [-1, 1]) {
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.5), decalMat);
    decal.position.set(-0.15, -0.28, sz * 1.335);
    if (sz < 0) decal.rotation.y = Math.PI;
    group.add(decal);
  }

  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.30, 3.6, 12), bodyMat);
  boom.rotation.z = Math.PI / 2 - 0.06; boom.position.set(-3.4, 0.38, 0); boom.castShadow = true;
  group.add(boom);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.10, 1.05, 0.5), bodyMat);
  fin.position.set(-5.15, 0.85, 0); group.add(fin);
  const stab = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 1.3), bodyMat);
  stab.position.set(-5.0, 0.35, 0); group.add(stab);

  // main rotor: two blade pairs over a translucent blur disc
  const rotor = new THREE.Group(); rotor.position.set(0.1, 1.52, 0);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.3, 10), darkMat);
  mast.position.y = -0.12; rotor.add(mast);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.45, metalness: 0.4 });
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.045, 0.30), bladeMat);
    blade.rotation.y = a; rotor.add(blade);
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(3.85, 40),
    new THREE.MeshBasicMaterial({ color: 0xdfe8ee, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02;
  rotor.add(disc);
  group.add(rotor);

  const tailRotor = new THREE.Group(); tailRotor.position.set(-5.22, 0.85, 0.28);
  for (const a of [0, Math.PI / 2]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.15, 0.14), bladeMat);
    b.rotation.z = a; tailRotor.add(b);
  }
  group.add(tailRotor);

  // skids
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x2a2e34, roughness: 0.4, metalness: 0.7 });
  for (const sz of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8), skidMat);
    rail.rotation.z = Math.PI / 2; rail.position.set(0.1, -1.72, sz * 0.85);
    group.add(rail);
    for (const sx of [-0.9, 1.0]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.75, 8), skidMat);
      leg.position.set(sx, -1.38, sz * 0.8); leg.rotation.x = sz * 0.25;
      group.add(leg);
    }
  }

  // strobe beacon
  const strobeMat = new THREE.MeshStandardMaterial({ color: 0x330000, emissive: 0xff2222, emissiveIntensity: 0.2 });
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), strobeMat);
  strobe.position.set(-1.4, -1.2, 0);
  group.add(strobe);

  // searchlight: real spotlight + visible cone + ground pool
  const spot = new THREE.SpotLight(0xfff3d0, 2.4, 90, 0.30, 0.45, 0.6);
  group.add(spot); group.add(spot.target);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffeec2, transparent: true, opacity: 0.032,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false,
  });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.5, 15, 24, 1, true), coneMat);
  group.add(cone);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.0, 26),
    new THREE.MeshBasicMaterial({ color: 0xffe9b8, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  group.add(pool);

  group.scale.setScalar(1.3);
  const heli = {
    group, rotor, tailRotor, strobeMat, spot, cone, pool,
    follow: { x: 8, y: 9.5, z: -7.5 }, pinned: false,    update(dt, t, targetPos) {
      rotor.rotation.y += dt * 21;
      tailRotor.rotation.x += dt * 34;
      strobeMat.emissiveIntensity = (Math.sin(t * 7) > 0.86) ? 4.5 : 0.15;
      // hover above, ahead and to one side of the target, banking into it
      const want = new THREE.Vector3(targetPos.x + heli.follow.x, heli.follow.y, targetPos.z + heli.follow.z);
      if (heli.pinned) group.position.copy(want);
      else if (group.position.distanceTo(want) > 40) group.position.copy(want); // snap on (re)spawn
      else group.position.lerp(want, Math.min(1, dt * 1.4));
      group.position.y += Math.sin(t * 1.7) * dt * 0.7;
      group.rotation.y = Math.atan2(targetPos.x - group.position.x, targetPos.z - group.position.z) - Math.PI / 2;
      group.rotation.z = 0.10 + Math.sin(t * 0.9) * 0.03;
      // aim the light: cone from the belly to the target, pool on it
      spot.position.set(0, -1, 0);
      const targetLocal = group.worldToLocal(targetPos.clone());
      spot.target.position.copy(targetLocal);
      const belly = new THREE.Vector3(0, -1, 0);
      const mid = belly.clone().add(targetLocal).multiplyScalar(0.5);
      cone.position.copy(mid);
      cone.scale.set(1, (belly.distanceTo(targetLocal) / 15) * 0.92, 1); // stop at the target's roof
      const toBelly = belly.clone().sub(mid).normalize();
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), toBelly);
      pool.position.copy(group.worldToLocal(targetPos.clone().add(new THREE.Vector3(0, 0.15, 0))));
    },
  };
  return heli;
}
