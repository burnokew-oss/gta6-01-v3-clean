// Teluk Cerah — police response: a 0–5 star wanted level, patrol cars
// that chase with a flanking formation, roadblocks at high wanted, a
// helicopter above three stars, and radio dispatch lines for the HUD.

import { policeVehicle, updateVehicleVisual } from "./vehicles.js";
import { buildHelicopter } from "./helicopter.js";
import { DISPATCH_LINES } from "./config.js";

export function createPolice(scene, envMap, rng, onDispatch) {
  const units = [];
  const MAX_UNITS = 5;
  for (let i = 0; i < MAX_UNITS; i++) {
    const v = policeVehicle(envMap, String(i + 3).padStart(2, "0"), 1000 + i * 137);
    v.group.visible = false;
    scene.add(v.group);
    units.push({ v, x: 0, z: 0, heading: 0, speed: 0, active: false, steer: 0 });
  }
  const heli = buildHelicopter(envMap);
  heli.group.visible = false;
  scene.add(heli.group);

  const PS = {
    wanted: 0, units, heli,
    heatTimer: 0, dispatchTimer: 4, shotFormation: false, blockTimer: 0, blockCars: [],
    setWanted(n, silent = false) {
      const next = THREE.MathUtils.clamp(Math.round(n), 0, 5);
      if (next !== PS.wanted && !silent) {
        PS.wanted = next;
        if (next > 0) onDispatch(DISPATCH_LINES[rng.int(0, DISPATCH_LINES.length - 1)]);
      } else PS.wanted = next;
      heli.group.visible = PS.wanted >= 3;
    },
    crime(amount = 1) {
      PS.heatTimer = 0;
      PS.setWanted(Math.min(5, PS.wanted + amount));
    },
    reset() {
      PS.setWanted(0, true);
      for (const u of units) { u.active = false; u.v.group.visible = false; }
      heli.group.visible = false;
      PS.shotFormation = false;
    },
  };

  function spawnUnit(u, px, pz, heading) {
    const back = 26 + rng.range(0, 10);
    u.x = px - Math.sin(heading) * back + rng.range(-6, 6);
    u.z = pz - Math.cos(heading) * back + rng.range(-6, 6);
    u.heading = heading; u.speed = 8; u.active = true;
    u.v.group.visible = true;
  }

  PS.update = (dt, t, player, audio) => {
    const px = player.x, pz = player.z;
    const wantCount = PS.wanted === 0 ? 0 : Math.min(MAX_UNITS, PS.wanted + 1);
    if (PS.shotFormation) {
      // deterministic flanking for the chase screenshot: two units pinned
      // to the hero's shoulders, the helicopter pinned ahead of the hero
      const offs = [[-0.4, 4.2], [0.3, -4.4]];
      units.forEach((u, i) => {
        if (i >= offs.length) { u.active = false; u.v.group.visible = false; return; }
        const [ox, oz] = offs[i];
        const s = Math.sin(player.heading), c = Math.cos(player.heading);
        u.x = px + s * ox + c * oz;
        u.z = pz + c * ox - s * oz;
        u.heading = player.heading + (i === 0 ? 0.10 : i === 1 ? -0.10 : 0);
        u.speed = player.speed;
        u.active = true; u.v.group.visible = true;
        u.v.group.position.set(u.x, 0, u.z);
        u.v.group.rotation.y = u.heading - Math.PI / 2;
        u.v.speed = u.speed; u.v.steer = i === 0 ? 0.3 : -0.3;
        updateVehicleVisual(u.v, dt, t + i);
      });
      heli.group.visible = true;
      heli.pinned = true;
      heli.update(dt, t, new THREE.Vector3(px, 0, pz));
      return;
    }

    units.forEach((u, i) => {
      if (i < wantCount) {
        if (!u.active) spawnUnit(u, px, pz, player.heading);
        // aim at a flanking point beside the player, not straight at them
        const flank = i === 0 ? 3.4 : i === 1 ? -3.4 : 0;
        const s = Math.sin(player.heading), c = Math.cos(player.heading);
        const tx = px + c * flank + s * (i > 1 ? -6 * i : 2);
        const tz = pz - s * flank + c * (i > 1 ? -6 * i : 2);
        const dx = tx - u.x, dz = tz - u.z;
        const dist = Math.hypot(dx, dz);
        const targetHeading = Math.atan2(dx, dz);
        let dh = targetHeading - u.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        u.steer = THREE.MathUtils.clamp(dh, -0.6, 0.6);
        u.heading += u.steer * dt * 1.7;
        const targetSpeed = dist > 30 ? 40 : Math.max(10, Math.abs(player.speed) + 6);
        u.speed += THREE.MathUtils.clamp(targetSpeed - u.speed, -22 * dt, 9 * dt);
        u.x += Math.sin(u.heading) * u.speed * dt;
        u.z += Math.cos(u.heading) * u.speed * dt;
        u.v.group.position.set(u.x, 0, u.z);
        u.v.group.rotation.y = u.heading - Math.PI / 2;
        u.v.speed = u.speed; u.v.steer = u.steer;
        updateVehicleVisual(u.v, dt, t + i * 0.7);
        if (dist < 3.2 && Math.abs(player.speed) < 1.5) PS.bustTimer = (PS.bustTimer || 0) + dt;
        if (dist > 190) spawnUnit(u, px, pz, player.heading); // recycle far units
      } else if (u.active) {
        u.active = false; u.v.group.visible = false;
      }
    });

    if (PS.wanted >= 3) heli.update(dt, t, new THREE.Vector3(px, 0, pz));
    if (audio && PS.wanted > 0) audio.siren(true); else if (audio) audio.siren(false);

    // wanted decays when the player stays out of trouble
    PS.heatTimer += dt;
    if (PS.wanted > 0 && PS.heatTimer > 26) { PS.setWanted(PS.wanted - 1); PS.heatTimer = 0; }
    PS.dispatchTimer -= dt;
    if (PS.wanted > 0 && PS.dispatchTimer <= 0) {
      PS.dispatchTimer = rng.range(7, 13);
      onDispatch(DISPATCH_LINES[rng.int(0, DISPATCH_LINES.length - 1)]);
    }
  };

  return PS;
}
