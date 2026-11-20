// shots.js — mode adegan screenshot: parameter URL ?shot= memilih adegan
// (chase, shootout, map, title) dan menyiapkan dunia deterministik persis
// untuk jepretan: posisi hero, polisi mengapit, helikopter, musuh, HUD.
export function readShotMode() {
  const q = new URLSearchParams(window.location.search);
  return q.get("shot") || "";
}

export function setupShot(name, state) {
  const { player, police, combat, heli } = state;
  document.body.dataset.shot = name;
  if (name === "chase") {
    player.mode = "drive";
    player.placeHero(-4, 0, 0);
    player.carSpeed = 26;
    player.speed = 26;
    police.setWanted(4, "kejaran di avenue utama, tersangka memakai mobil merah");
    police.placeFlanking({ x: -4, z: 0 }, 0);
    if (police.units[0]) police.units[0].car.position.set(-6.6, 0, -3.45);
    if (police.units[1]) police.units[1].car.position.set(-6.9, 0, 3.75);
    if (police.units[0]) police.units[0].car.rotation.y = 0.04;
    if (police.units[1]) police.units[1].car.rotation.y = -0.04;
    heli.position.set(12, 13.5, 6.5);
    heli.rotation.y = 0.5;
    state.traffic.forEach((car, i) => {
      car.position.set(16 + i * 13, 0, i % 2 ? 3.4 : -3.6);
      car.rotation.y = i % 2 ? Math.PI : 0;
    });
    state.camera.position.set(-15.2, 2.7, 0);
    state.camera.lookAt(7, 1.05, 0);
    return 2.35; // waktu beku deterministik untuk lightbar & neon
  }
  if (name === "shootout") {
    player.mode = "foot";
    player.placeHero(14, 26, Math.PI);
    player.x = 0; player.z = 14; player.angle = Math.PI / 2;
    player.carX = 8; player.carZ = 26;
    player.syncMeshes(0);
    combat.switchWeapon(2);
    combat.spawnEnemies(0, 0, 6, 1);
    const exs = [-6.2, -3.8, -1.3, 1.3, 3.8, 6.2];
    const ezs = [4.4, 5.6, 4.8, 5.8, 4.6, 5.4];
    combat.enemies.forEach((e, i) => {
      e.mesh.position.set(exs[i], 0, ezs[i]);
      e.mesh.rotation.y = Math.PI / 2 + (i % 2 ? 0.2 : -0.2);
      e.bar.position.set(exs[i], 2.3, ezs[i]);
      e.barBg.position.set(exs[i], 2.3, ezs[i]);
      if (i === 2) { e.hp = 45; e.bar.scale.x = 0.63; }
    });
    combat.flash.position.set(0.5, 1.4, 12.7);
    combat.flash.visible = true;
    police.setWanted(2, "baku tembak dilaporkan warga");
    police.units.forEach((u, i) => {
      u.car.position.set(i === 0 ? -11 : 11.5, 0, 21.5 + i * 1.5);
      u.car.rotation.y = i === 0 ? 0.85 : -0.85;
    });
    heli.position.set(-20, 23, -18);
    state.camera.position.set(3.1, 2.3, 20.8);
    state.camera.lookAt(-0.6, 1.15, 5.2);
    return 1.4;
  }
  if (name === "map") {
    player.mode = "drive";
    player.placeHero(0, 0, 0);
    police.setWanted(3, "patroli di seluruh distrik");
    police.units.forEach((u, i) => { u.car.position.set(-40 + i * 26, 0, -30 + i * 18); });
    document.getElementById("map-overlay").style.display = "flex";
    return 0.8;
  }
  if (name === "title") {
    player.mode = "foot";
    player.placeHero(-2, 10, 0.5);
    player.x = 2.6; player.z = 6.4; player.angle = 2.6;
    player.syncMeshes(0);
    document.getElementById("title-screen").style.display = "flex";
    document.getElementById("hud").style.display = "none";
    state.camera.position.set(7.5, 2.1, 13.5);
    state.camera.lookAt(-1, 1.4, 4);
    return 1.1;
  }
  return 0;
}
