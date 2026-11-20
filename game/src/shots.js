// shots.js — mode adegan screenshot: parameter URL ?shot= memilih adegan
// (chase, shootout, map, title) dan menyiapkan dunia persis untuk jepretan
// deterministik dari seed yang sama.
import { poseWalk, poseCrouchAim } from "./pedestrians.js";
import { makeCanvas } from "./render.js";

// pantulan geometris di aspal basah: gradien warna lampu yang ditarik
// memanjang dari sumbernya, tepi dipecah garis riak
function lightReflection(scene, x, z, w, len, color, opacity = 0.4) {
  const tex = makeCanvas(64, 128, (g, gw, gh) => {
    const gr = g.createLinearGradient(0, 0, 0, gh);
    gr.addColorStop(0, color); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, gw, gh);
    g.globalCompositeOperation = "destination-out";
    let s = 1234567;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 20; i++) g.fillRect(0, rnd() * gh, gw, 1.6);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.055, z);
  scene.add(m);
}

export function shotName() {
  return new URLSearchParams(location.search).get("shot");
}

export function setupShot(game, name) {
  const { player, police, helicopter, traffic, pedestrians, combat, camera } = game;
  if (name === "chase") {
    const hero = game.heroCar;
    hero.mesh.position.set(0, 0, 44);
    hero.state.yaw = Math.PI; // melaju ke -z menyusuri jalan utama
    hero.state.speed = 26;
    hero.mesh.rotation.y = hero.state.yaw - Math.PI / 2;
    player.enterCar(hero);
    player.pos.copy(hero.mesh.position);
    police.setChasePose(hero.mesh.position, hero.state.yaw);
    helicopter.setPose(hero.mesh.position);
    // pantulan lampu belakang hero (merah) + lightbar polisi (merah-biru)
    lightReflection(game.render.scene, 0, 50.5, 1.9, 11, "rgba(255,40,50,0.9)", 0.45);
    lightReflection(game.render.scene, -5.2, 51, 1.7, 10, "rgba(60,90,255,0.9)", 0.36);
    lightReflection(game.render.scene, 5.2, 51, 1.7, 10, "rgba(255,40,60,0.9)", 0.36);
    traffic.setFrozen(2.35);
    pedestrians.setFrozen(2.35);
    game.clockMin = 17 * 60 + 24;
    player.setChaseCamera(camera);
    game.hud.update(0, game);
    return "play";
  }
  if (name === "shootout") {
    // di tengah jalan utama dekat persimpangan z=46: pemain berlindung di
    // balik peti, 6 musuh jongkok berhadapan di seberang jalan
    player.pos.set(1.5, 0, 58);
    player.yaw = Math.PI; // menghadap -z ke arah musuh
    player.mesh.position.copy(player.pos);
    player.mesh.rotation.y = Math.PI;
    poseCrouchAim(player.mesh);
    const crateMat = new THREE.MeshPhongMaterial({ color: 0xa8793f });
    const covers = [[1.5, 55.6], [-3.4, 47], [2.8, 45.6], [5.2, 48], [-5, 44], [0.4, 42.4], [-1.8, 40.6]];
    for (const [cx, cz] of covers) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.5, 1.2), crateMat);
      crate.position.set(cx, 0.75, cz); crate.castShadow = true;
      game.render.scene.add(crate);
    }
    const enemySpots = [[-1.7, 45.8], [4.5, 44.4], [6.9, 46.8], [-3.3, 42.8], [2.1, 41.2], [-0.1, 39.4]];
    for (const [ex, ez] of enemySpots) {
      const e = combat.spawnEnemy(ex, ez, 60);
      e.mesh.lookAt(player.pos.x, 0, player.pos.z);
      e.hp = 34; // sebagian bar terisi merah-kuning
    }
    combat.setShootoutPose();
    // kilat moncong senjata pemain menyala di frame
    combat.flash.position.set(2.35, 1.25, 56.6);
    combat.flash.material.opacity = 0.9;
    combat.flash.scale.setScalar(0.55);
    game.clockMin = 17 * 60 + 40;
    camera.position.set(7.5, 2.6, 64);
    camera.lookAt(0, 1.1, 46);
    game.hud.update(0, game);
    return "play";
  }
  if (name === "map") {
    game.clockMin = 17 * 60 + 10;
    camera.position.set(0, 60, 120);
    camera.lookAt(0, 0, 0);
    game.hud.drawFullMap(game);
    return "map";
  }
  if (name === "title") {
    const hero = game.heroCar;
    hero.mesh.position.set(7.5, 0, 30);
    hero.mesh.rotation.y = -0.7;
    player.pos.set(3.4, 0, 31.5);
    player.mesh.position.copy(player.pos);
    player.mesh.rotation.y = 2.2;
    player.yaw = 2.2;
    poseWalk(player.mesh, 0.0, 0); // berdiri tegak beranatomi
    traffic.setFrozen(2.35);
    pedestrians.setFrozen(2.35);
    game.clockMin = 17 * 60 + 32;
    camera.position.set(-5.5, 3.6, 50);
    camera.lookAt(5, 1.5, 29);
    return "title";
  }
  return "title";
}
