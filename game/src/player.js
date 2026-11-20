// Teluk Cerah — the player: Raka on foot with a full stride animation,
// and behind the wheel with arcade driving physics, a low close chase
// camera, building collision and a live speed readout.

import { buildHeroFigure } from "./pedestrians.js";
import { heroVehicle, updateVehicleVisual } from "./vehicles.js";
import { CITY } from "./config.js";

export function createPlayer(scene, rng, envMap, colliders) {
  const figure = buildHeroFigure(rng);
  scene.add(figure.group);
  const car = heroVehicle(envMap);
  scene.add(car.group);

  const P = {
    figure, car,
    mode: "foot",
    x: 8, z: 44, heading: Math.PI / 2, // facing the avenue
    speed: 0, steerVis: 0,
    camYaw: Math.PI / 2, camPitch: 0.16, camBackBonus: 0,
    walkPhase: 0,
    driveOverride: null, // {speed} for screenshot scenes
    topSpeed: 41, accelPower: 15,
    nos: 0.6, nosUnlocked: false,
    get pos() { return { x: this.x, z: this.z }; },
    get speedKmh() { return Math.abs(this.speed) * 3.6; },
  };

  figure.group.position.set(P.x, 0, P.z);
  car.group.position.set(20, 0, 40);
  car.group.rotation.y = -Math.PI / 2;
  let carX = 20, carZ = 40, carHeading = Math.PI / 2, carSpeed = 0;

  function collide(x, z, r) {
    let nx = x, nz = z;
    for (const c of colliders) {
      if (nx > c.minX - r && nx < c.maxX + r && nz > c.minZ - r && nz < c.maxZ + r) {
        const dxl = nx - (c.minX - r), dxr = (c.maxX + r) - nx;
        const dzl = nz - (c.minZ - r), dzr = (c.maxZ + r) - nz;
        const m = Math.min(dxl, dxr, dzl, dzr);
        if (m === dxl) nx = c.minX - r; else if (m === dxr) nx = c.maxX + r;
        else if (m === dzl) nz = c.minZ - r; else nz = c.maxZ + r;
      }
    }
    nx = THREE.MathUtils.clamp(nx, CITY.minX - 20, CITY.maxX + 20);
    nz = THREE.MathUtils.clamp(nz, CITY.minZ - 20, CITY.beachZ + 22);
    return [nx, nz];
  }

  P.placeCar = (x, z, heading) => {
    carX = x; carZ = z; carHeading = heading; carSpeed = 0;
    car.group.position.set(x, 0, z);
    car.group.rotation.y = heading - Math.PI / 2;
  };
  P.enterCar = () => {
    P.mode = "car";
    figure.group.visible = false;
    P.x = carX; P.z = carZ; P.heading = carHeading;
  };
  P.exitCar = () => {
    P.mode = "foot";
    P.x = carX + Math.cos(carHeading) * 2.2; P.z = carZ - Math.sin(carHeading) * 2.2;
    figure.group.visible = true;
    figure.group.position.set(P.x, 0, P.z);
  };
  P.nearCar = () => Math.hypot(P.x - carX, P.z - carZ) < 3.4;
  P.teleport = (x, z, heading) => {
    P.x = x; P.z = z; P.heading = heading;
    figure.group.position.set(x, 0, z);
    figure.group.rotation.y = heading;
  };

  P.update = (dt, input, camera, audio) => {
    const look = input.consumeLook();
    P.camYaw -= look.x * 0.0042;
    P.camPitch = THREE.MathUtils.clamp(P.camPitch + look.y * 0.003, -0.05, 0.62);

    if (P.mode === "car") {
      let accel = 0, steer = 0, braking = false;
      if (P.driveOverride) {
        carSpeed = P.driveOverride.speed;
        carHeading = P.driveOverride.heading;
        steer = P.driveOverride.steer || 0;
      } else {
        if (input.forward()) accel = 1;
        if (input.back()) { accel = carSpeed > 0.5 ? -1.6 : -0.55; braking = carSpeed > 0.5; }
        if (input.left()) steer = 1;
        if (input.right()) steer = -1;
        const nosOn = P.nosUnlocked && input.down("ShiftLeft") && P.nos > 0 && accel > 0;
        if (nosOn) { P.nos = Math.max(0, P.nos - dt * 0.45); accel = 2.1; }
        else P.nos = Math.min(1, P.nos + dt * 0.05);
        const drag = 0.32 + Math.abs(carSpeed) * 0.012;
        carSpeed += (accel * P.accelPower - Math.sign(carSpeed) * drag * Math.abs(carSpeed) * 0.14 - carSpeed * 0.22) * dt;
        if (!input.forward() && !input.back()) carSpeed -= carSpeed * 0.5 * dt;
        carSpeed = THREE.MathUtils.clamp(carSpeed, -11, P.topSpeed);
        const steerTarget = steer * 0.52 * (1 - Math.min(0.55, Math.abs(carSpeed) / 90));
        carHeading += steerTarget * (carSpeed / 3.4) * dt * Math.sign(carSpeed || 1) * (carSpeed < 0 ? -1 : 1) * 0.62;
        if (audio) audio.engine(Math.abs(carSpeed) / P.topSpeed, accel !== 0);
      }
      const nx = carX + Math.sin(carHeading) * carSpeed * dt;
      const nz = carZ + Math.cos(carHeading) * carSpeed * dt;
      const [cx, cz] = collide(nx, nz, 1.6);
      if (Math.hypot(cx - nx, cz - nz) > 0.05 && Math.abs(carSpeed) > 6) carSpeed *= 0.4;
      carX = cx; carZ = cz;
      P.x = carX; P.z = carZ; P.heading = carHeading; P.speed = carSpeed;
      car.group.position.set(carX, 0, carZ);
      car.group.rotation.y = carHeading - Math.PI / 2;
      car.speed = carSpeed; car.steer = steer * 0.5; car.braking = braking; car.accel = accel;
      updateVehicleVisual(car, dt, performance.now() / 1000);
      // low, close chase camera with a touch of speed-based pull-back
      const back = 9.8 + Math.abs(carSpeed) * 0.055 + (P.camBackBonus || 0);
      const camTX = carX - Math.sin(carHeading) * back;
      const camTZ = carZ - Math.cos(carHeading) * back;
      const camTY = 2.3 + P.camPitch * 2.2;
      camera.position.lerp(new THREE.Vector3(camTX, camTY, camTZ), P.driveOverride ? 1 : Math.min(1, dt * 5));
      camera.lookAt(carX + Math.sin(carHeading) * 7, 1.15, carZ + Math.cos(carHeading) * 7);
    } else {
      let mx = 0, mz = 0;
      if (input.forward()) mz += 1;
      if (input.back()) mz -= 1;
      if (input.left()) mx -= 1;
      if (input.right()) mx += 1;
      const moving = (mx !== 0 || mz !== 0);
      const run = input.down("ShiftLeft") ? 6.4 : 3.6;
      if (moving) {
        const targetHeading = P.camYaw + Math.atan2(mx, mz);
        let dh = targetHeading - P.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        P.heading += dh * Math.min(1, dt * 11);
        const [nx, nz] = collide(P.x + Math.sin(P.heading) * run * dt, P.z + Math.cos(P.heading) * run * dt, 0.45);
        P.x = nx; P.z = nz;
        P.walkPhase += dt * run * 2.5;
        if (audio) audio.step();
      }
      P.speed = moving ? run : 0;
      figure.group.position.set(P.x, 0, P.z);
      figure.group.rotation.y = P.heading;
      figure.setPose(moving ? P.walkPhase : 0, P.aimPose || 0);
      const back = 5.6;
      const camTX = P.x - Math.sin(P.camYaw) * back * Math.cos(P.camPitch);
      const camTZ = P.z - Math.cos(P.camYaw) * back * Math.cos(P.camPitch);
      const camTY = 1.7 + Math.sin(P.camPitch) * back;
      camera.position.lerp(new THREE.Vector3(camTX, camTY, camTZ), Math.min(1, dt * 8));
      camera.lookAt(P.x + Math.sin(P.camYaw) * 4, 1.35, P.z + Math.cos(P.camYaw) * 4);
    }
  };

  return P;
}
