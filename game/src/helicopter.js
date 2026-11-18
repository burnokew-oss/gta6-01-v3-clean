import * as ThreeLib from 'three';
const THREE = (ThreeLib && typeof ThreeLib.Scene === 'function') ? ThreeLib : (typeof globalThis !== 'undefined' && globalThis.THREE ? globalThis.THREE : (() => { throw new Error('Three.js is not available: the vendored module has no Scene export and no global THREE object exists on the page.'); })());
import { CONFIG } from './config.js';

function pickNumber(candidates, fallback) {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return fallback;
}

function buildHeliMesh() {
  const group = new THREE.Group();
  const navy = new THREE.MeshStandardMaterial({ color: 0x1d3a6e, roughness: 0.4, metalness: 0.5 });
  const pale = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.35, metalness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x0e1a26, roughness: 0.12, metalness: 0.5 });
  // Lambung putih polisi dengan sedikit pancaran sendiri supaya bodi tetap
  // terbaca di langit malam; ekor dan sirip tetap biru gelap.
  const shell = new THREE.MeshStandardMaterial({ color: 0xf4f7fa, roughness: 0.35, metalness: 0.35, emissive: 0x8fa9bd, emissiveIntensity: 0.5 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.15, 2.6, 6, 16), shell);
  body.rotation.x = Math.PI / 2;
  body.scale.set(1, 1, 0.85);
  body.position.y = 0;
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.95, 2.2, 6, 14), pale);
  belly.rotation.x = Math.PI / 2;
  belly.scale.set(1, 1, 0.6);
  belly.position.set(0, -0.55, 0.2);
  group.add(belly);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.05, 18, 14), glass);
  cockpit.scale.set(1, 0.85, 1.15);
  cockpit.position.set(0, 0.1, 1.9);
  group.add(cockpit);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.16, 3.4, 12), navy);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0.15, -3.1);
  tail.castShadow = true;
  group.add(tail);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.9), navy);
  fin.position.set(0, 0.7, -4.6);
  group.add(fin);

  const skidMat = new THREE.MeshStandardMaterial({ color: 0x22262c, roughness: 0.5, metalness: 0.6 });
  for (const x of [-1.05, 1.05]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.4, 8), skidMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(x, -1.25, 0.2);
    group.add(skid);
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.7, 10), skidMat);
  mast.position.set(0, 1.35, 0);
  group.add(mast);
  const rotor = new THREE.Group();
  rotor.position.set(0, 1.7, 0);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xa8b0ba, roughness: 0.45, metalness: 0.4, emissive: 0x2c3844, emissiveIntensity: 0.5 });
  for (const angle of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.06, 0.34), bladeMat);
    blade.rotation.y = angle;
    blade.castShadow = true;
    rotor.add(blade);
  }
  group.add(rotor);
  group.userData.rotor = rotor;

  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.35, 0.35, -4.6);
  for (const angle of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.16), bladeMat);
    blade.rotation.x = angle;
    tailRotor.add(blade);
  }
  group.add(tailRotor);
  group.userData.tailRotor = tailRotor;

  const beacon = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xd21f2b, emissive: 0xff2222, emissiveIntensity: 2.5 }),
  );
  beacon.position.set(0, -1.15, -1.4);
  beacon.name = 'beacon';
  group.add(beacon);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xfff6c8, emissive: 0xffedb0, emissiveIntensity: 2 }),
  );
  lamp.position.set(0, -1.05, 1.6);
  lamp.name = 'searchLamp';
  group.add(lamp);

  return group;
}

export function createHelicopter(state) {
  const group = buildHeliMesh();
  // Bodi langsung terlihat sejak frame pertama: staging menyalakan kerucut
  // dan genangan cahaya secara langsung, sementara updateHelicopter baru
  // berjalan setelah frame pertama (dan ia yang mengatur visibilitas ini
  // mengikuti mode — tersembunyi saat wanted rendah, tampil saat wanted
  // tinggi). Tanpa ini bodi heli tidak pernah muncul di shot staging.
  group.visible = true;
  group.position.set(0, 60, -80);
  state.scene.add(group);

  const coneHeight = 60;
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(7.5, coneHeight, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff2b0, transparent: true, opacity: 0.16,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
  cone.visible = false;
  state.scene.add(cone);

  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffe9a0, transparent: true, opacity: 0.28,
      depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.06;
  pool.visible = false;
  state.scene.add(pool);

  const spot = new THREE.SpotLight(0xfff2b0, 0, 120, 0.22, 0.45, 1.1);
  spot.position.set(0, 60, -80);
  spot.target.position.set(0, 0, 0);
  state.scene.add(spot);
  state.scene.add(spot.target);

  const heli = {
    group,
    position: group.position,
    target: new THREE.Vector3(0, 0, 0),
    mode: 'hidden',
    cone,
    pool,
    spot,
    altitude: pickNumber([CONFIG?.helicopter?.altitude, 42], 42),
    orbitAngle: 0,
    rotorSpeed: 0,
    flashTimer: 0,
  };
  state.helicopter = heli;
  return heli;
}

export function updateHelicopter(state, dt) {
  const heli = state.helicopter;
  const player = state.player;
  if (!heli || !player) return;
  const wanted = state.wanted || 0;
  const time = state.time || 0;

  let wantMode = 'hidden';
  if (wanted >= 4) wantMode = 'spotlight';
  else if (wanted >= 3) wantMode = 'pursue';

  if (wantMode === 'hidden') {
    if (heli.mode !== 'hidden') {
      heli.mode = 'leaving';
    }
  } else {
    heli.mode = wantMode;
  }

  // Ketinggian jelajah mengikuti ketinggian saat heli ditempatkan (staging),
  // dibatasi supaya tetap masuk dalam pandangan kamera kejar; tanpa ini heli
  // selalu naik ke 42 m dan keluar dari bingkai atas. Ambang 4 m menjaga
  // goyangan naik-turun (±1,6 m) tidak ikut menggeser ketinggian jelajah.
  if (heli.mode === 'spotlight' || heli.mode === 'pursue') {
    if (Math.abs(heli.position.y - heli.altitude) > 4) {
      heli.altitude = Math.min(Math.max(heli.position.y, 12), 20);
    }
  }

  if (heli.mode === 'hidden') {
    heli.group.visible = false;
    heli.cone.visible = false;
    heli.pool.visible = false;
    heli.spot.intensity = 0;
    return;
  }

  heli.group.visible = true;
  heli.orbitAngle += dt * 0.22;
  const orbitR = 26;
  const tx = player.position.x + Math.cos(heli.orbitAngle) * orbitR;
  const tz = player.position.z + Math.sin(heli.orbitAngle) * orbitR;
  const bob = Math.sin(time * 0.9) * 1.6;
  const targetAlt = heli.altitude + bob;

  const arrive = heli.mode === 'leaving' ? 0.5 : 1.6;
  heli.position.x += (tx - heli.position.x) * Math.min(1, dt * arrive);
  heli.position.z += (tz - heli.position.z) * Math.min(1, dt * arrive);
  const wantAlt = heli.mode === 'leaving' ? 90 : targetAlt;
  heli.position.y += (wantAlt - heli.position.y) * Math.min(1, dt * 0.8);

  const lookX = player.position.x;
  const lookZ = player.position.z;
  heli.target.x += (lookX - heli.target.x) * Math.min(1, dt * 3);
  heli.target.z += (lookZ - heli.target.z) * Math.min(1, dt * 3);
  heli.group.rotation.y = Math.atan2(lookX - heli.position.x, lookZ - heli.position.z);
  heli.group.rotation.z = Math.sin(time * 0.7) * 0.03;
  heli.group.rotation.x = Math.cos(time * 0.5) * 0.02;

  heli.rotorSpeed += ((heli.mode === 'leaving' ? 12 : 26) - heli.rotorSpeed) * Math.min(1, dt * 2);
  const rotor = heli.group.userData.rotor;
  if (rotor) rotor.rotation.y += heli.rotorSpeed * dt;
  const tailRotor = heli.group.userData.tailRotor;
  if (tailRotor) tailRotor.rotation.x += heli.rotorSpeed * 1.6 * dt;

  heli.flashTimer += dt;
  const beacon = heli.group.getObjectByName('beacon');
  if (beacon) {
    beacon.material.emissiveIntensity = Math.floor(heli.flashTimer * 2.4) % 2 === 0 ? 3 : 0.3;
  }

  const spotlightOn = heli.mode === 'spotlight';
  heli.cone.visible = spotlightOn;
  heli.pool.visible = spotlightOn;
  if (spotlightOn) {
    const sx = heli.target.x;
    const sz = heli.target.z;
    const top = heli.position.clone();
    const bottom = new THREE.Vector3(sx, 0.05, sz);
    const mid = top.clone().add(bottom).multiplyScalar(0.5);
    heli.cone.position.copy(mid);
    const height = Math.max(4, top.y - 0.05);
    heli.cone.scale.set(1, height / 60, 1);
    const dir = bottom.clone().sub(top).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    heli.cone.quaternion.setFromUnitVectors(up.clone().negate(), dir);
    heli.pool.position.set(sx, 0.06, sz);
    const pulse = 0.24 + 0.07 * Math.sin(time * 3.2);
    heli.pool.material.opacity = pulse;
    heli.cone.material.opacity = 0.13 + 0.04 * Math.sin(time * 3.2);
    heli.spot.intensity = 900;
    heli.spot.position.copy(heli.position);
    heli.spot.target.position.set(sx, 0, sz);
    heli.spot.target.updateMatrixWorld();
  } else {
    heli.spot.intensity = 0;
  }

  if (heli.mode === 'leaving' && heli.position.y > 84) {
    heli.mode = 'hidden';
    heli.group.visible = false;
    heli.cone.visible = false;
    heli.pool.visible = false;
    heli.spot.intensity = 0;
  }
}
