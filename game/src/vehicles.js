import 'three';
const THREE = window.THREE;

const TRAFFIC_COLORS = [0xd8d8d8, 0xc23a3a, 0x3a6ad8, 0x2f9e44, 0xe8a33a, 0x8a5ad8, 0x22242c, 0xd8e8f2];

export function netOf(state) {
  if (!state) return null;
  if (state.network && state.network.segments) return state.network;
  if (state.city && state.city.segments) return state.city;
  if (state.roads && state.roads.segments) return state.roads;
  if (state.roadNetwork && state.roadNetwork.segments) return state.roadNetwork;
  if (state.world) {
    if (state.world.network && state.world.network.segments) return state.world.network;
    if (state.world.scene && state.world.scene.userData && state.world.scene.userData.network) return state.world.scene.userData.network;
  }
  return null;
}

function randomSegment(net) {
  if (!net || !net.segments || net.segments.length === 0) return null;
  return net.segments[Math.floor(Math.random() * net.segments.length)];
}

function paintMaterial(color, kind) {
  if (kind === 'sport') return new THREE.MeshLambertMaterial({ color });
  return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.45 });
}

export function buildCarMesh(kind, color, opts) {
  const group = new THREE.Group();
  const paintMat = paintMaterial(color, kind);
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x16181e });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.1, metalness: 0.7 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.2, metalness: 0.9 });

  const long = kind === 'sport' ? 4.6 : 4.4;
  const wide = kind === 'sport' ? 2.0 : 1.9;
  const body = new THREE.Mesh(new THREE.BoxGeometry(wide, 0.62, long), paintMat);
  body.position.y = 0.55;
  group.add(body);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.92, 0.4, 0.9), paintMat);
  nose.position.set(0, 0.5, long / 2 - 0.3);
  group.add(nose);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.84, 0.55, long * 0.42), glassMat);
  cabin.position.set(0, 1.05, -0.25);
  group.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.8, 0.1, long * 0.4), paintMat);
  roof.position.set(0, 1.35, -0.25);
  group.add(roof);
  const grill = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.7, 0.22, 0.1), chromeMat);
  grill.position.set(0, 0.5, long / 2 + 0.02);
  group.add(grill);

  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff2c8 });
  const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.08), headMat);
  hlL.position.set(-wide * 0.32, 0.62, long / 2 + 0.04);
  group.add(hlL);
  const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.08), headMat);
  hlR.position.set(wide * 0.32, 0.62, long / 2 + 0.04);
  group.add(hlR);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2233 });
  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), tailMat);
  tlL.position.set(-wide * 0.32, 0.62, -long / 2 - 0.04);
  group.add(tlL);
  const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), tailMat);
  tlR.position.set(wide * 0.32, 0.62, -long / 2 - 0.04);
  group.add(tlR);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wheels = [];
  const wheelPos = [
    [-wide / 2 + 0.05, 0.38, long / 2 - 0.9],
    [wide / 2 - 0.05, 0.38, long / 2 - 0.9],
    [-wide / 2 + 0.05, 0.38, -long / 2 + 0.9],
    [wide / 2 - 0.05, 0.38, -long / 2 + 0.9],
  ];
  for (const p of wheelPos) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(p[0], p[1], p[2]);
    group.add(w);
    wheels.push(w);
  }

  let barL = null;
  let barR = null;
  let poolL = null;
  let poolR = null;
  if (kind === 'police') {
    const barGeo = new THREE.BoxGeometry(0.55, 0.18, 0.3);
    barL = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: 0xff2233 }));
    barL.position.set(-0.32, 1.48, -0.25);
    group.add(barL);
    barR = new THREE.Mesh(barGeo, new THREE.MeshBasicMaterial({ color: 0x2266ff }));
    barR.position.set(0.32, 1.48, -0.25);
    group.add(barR);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(wide + 0.02, 0.3, long * 0.9), new THREE.MeshLambertMaterial({ color: 0x1a3a8a }));
    stripe.position.y = 0.62;
    group.add(stripe);
    const poolGeo = new THREE.CircleGeometry(2.2, 18);
    poolL = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ color: 0xff2233, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    poolL.rotation.x = -Math.PI / 2;
    poolL.position.y = 0.07;
    group.add(poolL);
    poolR = new THREE.Mesh(poolGeo, new THREE.MeshBasicMaterial({ color: 0x2266ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    poolR.rotation.x = -Math.PI / 2;
    poolR.position.y = 0.08;
    group.add(poolR);
    const badge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.06), new THREE.MeshBasicMaterial({ color: 0xffe14d }));
    badge.position.set(0, 0.62, long / 2 + 0.06);
    group.add(badge);
  }
  if (kind === 'sport') {
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(wide * 0.9, 0.08, 0.5), paintMat);
    spoiler.position.set(0, 1.05, -long / 2 + 0.2);
    group.add(spoiler);
    const skirt = new THREE.Mesh(new THREE.BoxGeometry(wide + 0.06, 0.18, long * 0.8), chromeMat);
    skirt.position.y = 0.28;
    group.add(skirt);
  }
  return { group, wheels, paintMat, barL, barR, poolL, poolR };
}

export function spawnCar(state, kind, color, spot) {
  const scene = state.world.scene;
  const built = buildCarMesh(kind, color, {});
  const car = {
    group: built.group,
    kind,
    speed: 0,
    maxSpeed: kind === 'sport' ? 40 : kind === 'police' ? 24 : 16,
    heading: 0,
    angle: 0,
    health: 100,
    condition: 88,
    driver: null,
    parked: true,
    wheels: built.wheels,
    paintMat: built.paintMat,
    barL: built.barL,
    barR: built.barR,
    poolL: built.poolL,
    poolR: built.poolR,
    position: built.group.position,
  };
  const x = spot && spot.x !== undefined ? spot.x : 40;
  const z = spot && spot.z !== undefined ? spot.z : 100;
  car.group.position.set(x, 0, z);
  scene.add(car.group);
  if (!state.cars) state.cars = [];
  state.cars.push(car);
  return car;
}

export function createTraffic(state) {
  const net = netOf(state);
  if (!net) {
    state._trafficPending = true;
    return [];
  }
  state._trafficPending = false;
  const scene = state.world.scene;
  const traffic = [];
  const count = 16;
  for (let i = 0; i < count; i++) {
    let seg = null;
    let t = Math.random();
    let dir = Math.random() < 0.5 ? 1 : -1;
    if (i < 5) {
      const avenue = net.segments.filter((s) => Math.abs(s.a.z - 100) < 1 && Math.abs(s.b.z - 100) < 1);
      seg = avenue.length ? avenue[Math.floor(Math.random() * avenue.length)] : randomSegment(net);
      if (seg && Math.abs(seg.a.z - 100) < 1) {
        const wantX = 20 - i * 32;
        const dx0 = seg.b.x - seg.a.x;
        t = dx0 !== 0 ? (wantX - seg.a.x) / dx0 : 0.5;
        t = Math.max(0.05, Math.min(0.95, t));
        dir = seg.b.x > seg.a.x ? -1 : 1;
      }
    } else {
      seg = randomSegment(net);
    }
    if (!seg) break;
    const color = TRAFFIC_COLORS[i % TRAFFIC_COLORS.length];
    const built = buildCarMesh('sedan', color, {});
    const car = {
      group: built.group,
      kind: 'traffic',
      speed: 8 + Math.random() * 6,
      maxSpeed: 16,
      heading: 0,
      angle: 0,
      health: 100,
      condition: 80,
      driver: null,
      parked: false,
      wheels: built.wheels,
      paintMat: built.paintMat,
      barL: null,
      barR: null,
      poolL: null,
      poolR: null,
      position: built.group.position,
      seg,
      t,
      dir,
      lane: (Math.random() - 0.5) * 5,
    };
    const dx = seg.b.x - seg.a.x;
    const dz = seg.b.z - seg.a.z;
    const len = Math.hypot(dx, dz) || 1;
    car.heading = Math.atan2(dx * car.dir, dz * car.dir);
    car.group.rotation.y = car.heading;
    car.group.position.set(
      seg.a.x + (dx * car.t) - (dz / len) * car.lane,
      0,
      seg.a.z + (dz * car.t) + (dx / len) * car.lane
    );
    scene.add(car.group);
    traffic.push(car);
  }
  state.traffic = traffic;
  return traffic;
}

export function ensureTraffic(state) {
  if (state._trafficPending && netOf(state)) {
    return createTraffic(state);
  }
  return state.traffic || [];
}

export function updateTraffic(state, dt) {
  const traffic = state.traffic || [];
  const net = netOf(state);
  for (const car of traffic) {
    if (!car.seg || !net) continue;
    const seg = car.seg;
    const dx = seg.b.x - seg.a.x;
    const dz = seg.b.z - seg.a.z;
    const len = Math.hypot(dx, dz) || 1;
    car.t += (car.speed * car.dir * dt) / len;
    if (car.t > 1 || car.t < 0) {
      let next = null;
      if (Math.abs(seg.a.z - 100) < 1 && Math.abs(seg.b.z - 100) < 1) {
        const avenue = net.segments.filter((s) => Math.abs(s.a.z - 100) < 1 && Math.abs(s.b.z - 100) < 1);
        if (avenue.length) next = avenue[Math.floor(Math.random() * avenue.length)];
      }
      if (!next) next = randomSegment(net);
      if (next) {
        car.seg = next;
        car.t = car.dir > 0 ? 0 : 1;
        const ndx = next.b.x - next.a.x;
        const ndz = next.b.z - next.a.z;
        car.heading = Math.atan2(ndx * car.dir, ndz * car.dir);
      } else {
        car.t = Math.max(0, Math.min(1, car.t));
      }
    }
    const s2 = car.seg;
    const sdx = s2.b.x - s2.a.x;
    const sdz = s2.b.z - s2.a.z;
    const slen = Math.hypot(sdx, sdz) || 1;
    car.group.position.set(
      s2.a.x + (sdx * car.t) - (sdz / slen) * car.lane,
      0,
      s2.a.z + (sdz * car.t) + (sdx / slen) * car.lane
    );
    car.group.rotation.y = car.heading;
    for (const w of car.wheels || []) w.rotation.x += (car.speed * dt) / 0.4;
  }
}
