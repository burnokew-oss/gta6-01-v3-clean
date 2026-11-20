// pedestrians.js — pejalan kaki beranatomi penuh: kepala berambut, torso,
// lengan, kaki, pakaian berwarna beragam, bayangan kontak; berjalan di
// trotoar dan menyeberang jalan.
import { mulberry32, rngRange, rngPick } from "./random.js";

const T = () => window.THREE;
const SKIN = [0xf2c09a, 0xc98a5a, 0x8a5a34, 0xffd9b3, 0xa06a3c];
const SHIRTS = [0xef4444, 0x3b82f6, 0x22c55e, 0xf59e0b, 0xec4899, 0x8b5cf6, 0x14b8a6, 0xf8fafc, 0xf97316];
const PANTS = [0x1e3a5f, 0x374151, 0x7c2d12, 0x14532d, 0x111827, 0x6b21a8];
const HAIR = [0x1c1917, 0x44403c, 0x78350f, 0x292524, 0x57534e];

export function makePerson(rng, opts = {}) {
  const T3 = T();
  const person = new T3.Group();
  const skin = new T3.MeshStandardMaterial({ color: opts.skin || rngPick(rng, SKIN), roughness: 0.75 });
  const shirt = new T3.MeshStandardMaterial({ color: opts.shirt || rngPick(rng, SHIRTS), roughness: 0.85 });
  const pants = new T3.MeshStandardMaterial({ color: opts.pants || rngPick(rng, PANTS), roughness: 0.9 });
  // Bayangan kontak lembut di tanah.
  const contact = new T3.Mesh(new T3.CircleGeometry(0.55, 12),
    new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = 0.02;
  person.add(contact);
  const legL = new T3.Mesh(new T3.CylinderGeometry(0.085, 0.1, 0.78, 7), pants);
  legL.position.set(0, 0.42, -0.13);
  const legR = legL.clone(); legR.position.z = 0.13;
  person.add(legL, legR);
  const torso = new T3.Mesh(new T3.CylinderGeometry(0.21, 0.26, 0.68, 10), shirt);
  torso.position.y = 1.12; torso.castShadow = true;
  person.add(torso);
  const shoulder = new T3.Mesh(new T3.SphereGeometry(0.24, 10, 8), shirt);
  shoulder.position.y = 1.44; shoulder.scale.set(1, 0.55, 1.25);
  person.add(shoulder);
  const armL = new T3.Mesh(new T3.CylinderGeometry(0.065, 0.075, 0.62, 7), shirt);
  armL.position.set(0, 1.14, -0.34); armL.rotation.x = 0.15;
  const armR = armL.clone(); armR.position.z = 0.34; armR.rotation.x = -0.15;
  person.add(armL, armR);
  const head = new T3.Mesh(new T3.SphereGeometry(0.21, 12, 10), skin);
  head.position.y = 1.72; head.castShadow = true;
  person.add(head);
  const hair = new T3.Mesh(new T3.SphereGeometry(0.215, 12, 8), new T3.MeshStandardMaterial({ color: rngPick(rng, HAIR), roughness: 0.95 }));
  hair.position.set(-0.03, 1.79, 0); hair.scale.set(0.95, 0.72, 0.98);
  person.add(hair);
  person.userData.parts = { legL, legR, armL, armR, torso, head };
  person.userData.walkPhase = rng() * 6.28;
  return person;
}

export function animatePerson(person, t, speed) {
  const p = person.userData.parts;
  const ph = t * (4 + speed * 2) + person.userData.walkPhase;
  const swing = Math.sin(ph) * 0.5 * Math.min(1, speed + 0.25);
  p.legL.rotation.x = swing; p.legR.rotation.x = -swing;
  p.armL.rotation.x = -swing * 0.8; p.armR.rotation.x = swing * 0.8;
  person.position.y = Math.abs(Math.sin(ph)) * 0.045;
}

export function spawnCrowd(scene, count) {
  const rng = mulberry32(5177);
  const crowd = [];
  for (let i = 0; i < count; i++) {
    const person = makePerson(rng);
    const alongX = rng() > 0.4;
    const lane = (Math.floor(rngRange(rng, -3, 4)) * 34);
    person.position.set(rngRange(rng, -115, 115), 0, lane + (rng() > 0.5 ? 7.6 : -7.6));
    if (!alongX) person.position.set(lane + (rng() > 0.5 ? 7.6 : -7.6), 0, rngRange(rng, -115, 115));
    person.userData.route = {
      alongX, dir: rng() > 0.5 ? 1 : -1,
      speed: rngRange(rng, 0.8, 1.7),
      crossAt: rngRange(rng, -100, 100), crossing: 0,
    };
    scene.add(person);
    crowd.push(person);
  }
  return crowd;
}

export function updateCrowd(crowd, dt, t) {
  for (const person of crowd) {
    const r = person.userData.route;
    if (r.alongX) {
      person.position.x += r.dir * r.speed * dt;
      person.rotation.y = r.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      if (Math.abs(person.position.x - r.crossAt) < 0.6 && r.crossing === 0) r.crossing = r.dir;
      if (r.crossing !== 0) {
        person.position.z += r.crossing * 0; // tetap di trotoar dekat penyeberangan
        person.position.z += (person.position.z > 0 ? -1 : 1) * 0;
      }
      if (person.position.x > 122) person.position.x = -122;
      if (person.position.x < -122) person.position.x = 122;
    } else {
      person.position.z += r.dir * r.speed * dt;
      person.rotation.y = r.dir > 0 ? Math.PI : 0;
      if (person.position.z > 122) person.position.z = -122;
      if (person.position.z < -122) person.position.z = 122;
    }
    animatePerson(person, t + person.position.x * 0.05, r.speed);
  }
}
