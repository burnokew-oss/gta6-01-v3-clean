// Renderer 3D Teluk Cerah — ronde 2 (malam hujan neon).
// Tampilan yang dikejar: aspal basah seperti cermin (pantulan neon
// memanjang), mobil sport merah mengkilap berlekuk, deret toko neon
// padat kiri-kanan, palem berdaun lebat, dan skyline kota berlampu di
// kejauhan. Semua art prosedural, tanpa aset eksternal; Three.js r149
// ter-vendor di game/vendor/.
//
// Bila WebGL tidak tersedia, webglOK=false dan main.js menampilkan
// pesan fallback, bukan layar hitam.
import { CITY_HALF, ROAD_LINES, ROAD_WIDTH, KMH_PER_UNIT } from './config.js';
import { SHOP_DEFS } from './shops.js';

const WORLD = CITY_HALF * 2;

export function createRenderer(canvas) {
  let webglOK = true;
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(1);
  } catch {
    webglOK = false;
  }

  // ---------- scene, kamera, cahaya ----------
  const scene = webglOK ? new THREE.Scene() : null;
  const camera = webglOK ? new THREE.PerspectiveCamera(58, 1, 0.1, 1600) : null;
  const ambient = webglOK ? new THREE.AmbientLight(0x7078a8, 0.62) : null;
  const moon = webglOK ? new THREE.DirectionalLight(0x9fb4ff, 0.42) : null;
  const warmFill = webglOK ? new THREE.DirectionalLight(0xff9a6a, 0.32) : null;
  if (webglOK) {
    scene.add(ambient);
    moon.position.set(40, 90, -50);
    scene.add(moon);
    warmFill.position.set(-60, 40, 60);
    scene.add(warmFill);
    scene.fog = new THREE.Fog(0x0b0e1a, 55, 300);
    // Lampu neon titik di koridor chase (z=12): pantulan specular di
    // aspal + cahaya warna-warni di fasad. Sedikit titik, jarak pendek,
    // supaya SwiftShader tetap jalan.
    const neonSpots = [
      { x: -28, c: 0xff2d78 }, { x: -12, c: 0x00e5ff }, { x: 4, c: 0xff6a00 },
      { x: 20, c: 0xff2d78 }, { x: 36, c: 0x39ff6a }, { x: 52, c: 0x00e5ff },
      { x: 68, c: 0xffe14d }, { x: -44, c: 0xc26aff },
    ];
    for (const s of neonSpots) {
      const pl = new THREE.PointLight(s.c, 1.35, 34, 2);
      pl.position.set(s.x, 4.5, 12);
      scene.add(pl);
    }
    // Lampu pengikut pemain: mengangkat cat mobil hero dari gelap.
    const heroLight = new THREE.PointLight(0xfff2dd, 0.3, 20, 2);
    heroLight.position.set(0, 6, 0);
    scene.add(heroLight);
    scene.userData.heroLight = heroLight;
  }

  // ---------- langit malam: kubah gradien + bintang + bulan + skyline ----------
  const skyUniforms = webglOK ? {
    uTop: { value: new THREE.Color(0x05060f) },
    uMid: { value: new THREE.Color(0x131a3a) },
    uBot: { value: new THREE.Color(0x2a1638) },
    uSunDir: { value: new THREE.Vector3(0.3, 0.6, -0.4).normalize() },
    uSunAmt: { value: 0.25 },
  } : null;
  if (webglOK) {
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: skyUniforms,
      vertexShader: 'varying vec3 vDir; void main(){ vDir=normalize(position); vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'precision mediump float; varying vec3 vDir; uniform vec3 uTop,uMid,uBot,uSunDir; uniform float uSunAmt;'
        + ' void main(){ float h=vDir.y*0.5+0.5;'
        + ' vec3 col = h>0.55 ? mix(uMid,uTop,(h-0.55)/0.45) : mix(uBot,uMid,h/0.55);'
        + ' float s=max(dot(normalize(vDir),normalize(uSunDir)),0.0);'
        + ' col+=vec3(0.9,0.95,1.0)*pow(s,400.0)*1.6*uSunAmt;'
        + ' col+=vec3(0.35,0.2,0.45)*pow(s,5.0)*0.35;'
        + ' gl_FragColor=vec4(col,1.0); }',
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(760, 24, 16), skyMat));
    // Bintang: titik-titik putih di kubah.
    let rs = 987654321;
    const srnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
    const starCount = 420;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      const a = srnd() * Math.PI * 2;
      const e = 0.12 + srnd() * 1.2;
      const r = 720;
      starPos[i * 3] = Math.cos(a) * Math.cos(e) * r;
      starPos[i * 3 + 1] = Math.sin(e) * r;
      starPos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, size: 1.7, sizeAttenuation: false, transparent: true, opacity: 0.75, fog: false }));
    scene.add(stars);
    // Skyline jauh: panorama siluet gedung + jendela menyala, digambar
    // sekali ke canvas lalu dililitkan ke silinder raksasa. Memberi
    // kedalaman kota di titik hilang jalan, tanpa ratusan mesh.
    const sc = document.createElement('canvas');
    sc.width = 2048;
    sc.height = 256;
    const sctx = sc.getContext('2d');
    const grad = sctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#070a18');
    grad.addColorStop(1, '#1a1030');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 2048, 256);
    let bx = 0;
    while (bx < 2048) {
      const bw = 26 + srnd() * 70;
      const bh = 60 + srnd() * 150;
      sctx.fillStyle = '#04050c';
      sctx.fillRect(bx, 256 - bh, bw, bh);
      // Antena + lampu merah di beberapa menara.
      if (srnd() < 0.3) {
        sctx.fillStyle = '#04050c';
        sctx.fillRect(bx + bw / 2 - 2, 256 - bh - 26, 4, 26);
        sctx.fillStyle = '#ff2d2d';
        sctx.beginPath();
        sctx.arc(bx + bw / 2, 256 - bh - 28, 3, 0, Math.PI * 2);
        sctx.fill();
      }
      // Jendela menyala acak di siluet.
      for (let wy = 256 - bh + 8; wy < 248; wy += 13) {
        for (let wx = bx + 5; wx < bx + bw - 4; wx += 11) {
          if (srnd() < 0.5) {
            const warm = srnd() < 0.62;
            sctx.fillStyle = warm ? 'rgba(255,196,90,1)' : (srnd() < 0.5 ? 'rgba(110,225,255,1)' : 'rgba(255,120,190,0.95)');
            sctx.fillRect(wx, wy, 5, 8);
          }
        }
      }
      bx += bw + 2 + srnd() * 14;
    }
    const skyTex = new THREE.CanvasTexture(sc);
    skyTex.anisotropy = 4;
    const skyline = new THREE.Mesh(
      new THREE.CylinderGeometry(250, 250, 190, 48, 1, true),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }),
    );
    skyline.position.y = 80;
    scene.add(skyline);
    // Menara jauh di ujung jalan chase (arah -x, titik hilang kamera):
    // siluet tinggi berjendela menyala supaya horizon tidak kosong.
    const towerCols = [0x1a2438, 0x232033, 0x14202e, 0x2a2030];
    const towerWins = [];
    for (let ti = 0; ti < 12; ti += 1) {
      const tx = -95 - ti * 7 - srnd() * 6;
      const tz = -28 + srnd() * 70;
      const tw = 9 + srnd() * 7;
      const td = 9 + srnd() * 7;
      const th = 34 + srnd() * 42;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: towerCols[ti % towerCols.length] }));
      tower.position.set(tx, th / 2, tz);
      tower.scale.set(tw, th, td);
      scene.add(tower);
      const tcols = Math.max(2, Math.floor(tw / 2.4));
      const trows = Math.max(3, Math.floor(th / 3.4));
      for (let s = 0; s < 2; s += 1) {
        for (let cx = 0; cx < tcols; cx += 1) {
          for (let ry = 0; ry < trows; ry += 1) {
            if (srnd() < 0.45) continue;
            const warm = srnd() < 0.65;
            const fx = (cx + 0.5) / tcols - 0.5;
            const fy = 2.5 + ry * 3.4;
            if (fy > th - 1.5) continue;
            if (s === 0) towerWins.push({ x: tx + fx * tw, y: fy, z: tz + td / 2 + 0.08, ry: 0, c: warm ? [0.95, 0.7, 0.3] : [0.5, 0.8, 1] });
            else towerWins.push({ x: tx + fx * tw, y: fy, z: tz - td / 2 - 0.08, ry: Math.PI, c: warm ? [0.95, 0.7, 0.3] : [0.5, 0.8, 1] });
          }
        }
      }
      if (srnd() < 0.5) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 8, 6), new THREE.MeshBasicMaterial({ color: 0x222226 }));
        ant.position.set(tx, th + 4, tz);
        scene.add(ant);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2d2d }));
        beacon.position.set(tx, th + 8, tz);
        scene.add(beacon);
      }
    }
    const twMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), towerWins.length);
    {
      const col = new THREE.Color();
      const dum = new THREE.Object3D();
      towerWins.forEach((w, i) => {
        dum.position.set(w.x, w.y, w.z);
        dum.rotation.set(0, w.ry, 0);
        dum.scale.set(1.3, 1.6, 1);
        dum.updateMatrix();
        twMesh.setMatrixAt(i, dum.matrix);
        twMesh.setColorAt(i, col.setRGB(w.c[0], w.c[1], w.c[2]));
      });
    }
    scene.add(twMesh);
  }

  // ---------- material + geometri bersama ----------
  const boxGeo = webglOK ? new THREE.BoxGeometry(1, 1, 1) : null;
  const planeGeo = webglOK ? new THREE.PlaneGeometry(1, 1) : null;
  const sphereGeo = webglOK ? new THREE.SphereGeometry(0.35, 10, 8) : null;
  const coneGeo = webglOK ? new THREE.ConeGeometry(1, 1, 8) : null;
  const lambertCache = new Map();
  function lambert(hex) {
    if (!lambertCache.has(hex)) lambertCache.set(hex, new THREE.MeshLambertMaterial({ color: hex }));
    return lambertCache.get(hex);
  }
  const basicCache = new Map();
  function basic(hex) {
    if (!basicCache.has(hex)) basicCache.set(hex, new THREE.MeshBasicMaterial({ color: hex }));
    return basicCache.get(hex);
  }
  // Cat glossy: Phong dengan specular putih kuat — kilau lampu neon
  // di bodi mobil tanpa butuh environment map.
  function gloss(hex, shine) {
    return new THREE.MeshPhongMaterial({ color: hex, shininess: shine || 120, specular: 0x777788 });
  }
  const dummy = webglOK ? new THREE.Object3D() : null;

  function putBox(parent, x, y, z, sx, sy, sz, mat) {
    const m = new THREE.Mesh(boxGeo, mat);
    m.position.set(x, y, z);
    m.scale.set(sx, sy, sz);
    parent.add(m);
    return m;
  }
  // Tekstur gradien memanjang (putih -> transparan di kedua ujung):
  // dipakai semua pantulan basah, tintanya dari warna material.
  let streakTex = null;
  function getStreakTex() {
    if (streakTex) return streakTex;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 32;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.18, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.82, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 32);
    const gv = ctx.createLinearGradient(0, 0, 0, 32);
    gv.addColorStop(0, 'rgba(0,0,0,1)');
    gv.addColorStop(0.5, 'rgba(0,0,0,0)');
    gv.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gv;
    ctx.fillRect(0, 0, 256, 32);
    streakTex = new THREE.CanvasTexture(c);
    return streakTex;
  }
  // Tekstur kilau radial (putih -> transparan): glow lampu, sorot, bulan.
  let glowTex = null;
  function getGlowTex() {
    if (glowTex) return glowTex;
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 62);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    glowTex = new THREE.CanvasTexture(c);
    return glowTex;
  }
  function glowSprite(color, scale) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getGlowTex(), color, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    sp.scale.set(scale, scale, 1);
    return sp;
  }
  // Satu coretan pantulan basah di aspal: bidang datar additif,
  // memanjang searah jalan, warna neon.
  function wetStreak(parent, x, z, len, wid, color, opacity, alongX) {
    const m = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({
      map: getStreakTex(), color, transparent: true, opacity,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.rotation.z = alongX ? 0 : Math.PI / 2;
    m.scale.set(len, wid, 1);
    m.position.set(x, 0.07, z);
    parent.add(m);
    return m;
  }

  // ---------- tanah, laut, jalan basah ----------
  if (webglOK) {
    putBox(scene, 9, -0.5, 0, 242, 1, 260, lambert(0x2e4a26)); // daratan gelap
    putBox(scene, -117, -0.45, 0, 10, 0.9, 260, lambert(0x8a7a55)); // pantai malam
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(300, 500),
      new THREE.MeshPhongMaterial({ color: 0x0d2a44, shininess: 160, specular: 0x5577aa }),
    );
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(-270, -0.3, 0);
    scene.add(sea);
    putBox(scene, 128, 0.2, 40, 26, 0.8, 30, lambert(0x4a3d2e)); // dermaga
  }

  // Jalan: aspal hampir hitam, Phong sangat mengkilap — specular dari
  // lampu neon titik + bulan membentuk kilau basah di permukaan.
  if (webglOK) {
    const roadSpots = [];
    for (const g of ROAD_LINES) {
      roadSpots.push([g, 0, 0, ROAD_WIDTH, 0.12, WORLD + 20]);
      roadSpots.push([0, 0, g, WORLD + 20, 0.12, ROAD_WIDTH]);
    }
    const roadMesh = new THREE.InstancedMesh(
      boxGeo,
      new THREE.MeshPhongMaterial({ color: 0x06060b, shininess: 320, specular: 0xb8c0d8 }),
      roadSpots.length,
    );
    roadSpots.forEach((r, i) => {
      dummy.position.set(r[0], r[1], r[2]);
      dummy.scale.set(r[3], r[4], r[5]);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      roadMesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(roadMesh);
    const sideSpots = [];
    for (const g of ROAD_LINES) {
      sideSpots.push([g, 0, 0, ROAD_WIDTH + 8, 0.08, WORLD + 20]);
      sideSpots.push([0, 0, g, WORLD + 20, 0.08, ROAD_WIDTH + 8]);
    }
    const sideMesh = new THREE.InstancedMesh(boxGeo, lambert(0x3d3d42), sideSpots.length);
    sideSpots.forEach((r, i) => {
      dummy.position.set(r[0], r[1], r[2]);
      dummy.scale.set(r[3], r[4], r[5]);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      sideMesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(sideMesh);
    const dashes = [];
    for (const g of ROAD_LINES) {
      for (let t = -CITY_HALF; t <= CITY_HALF; t += 8) {
        dashes.push({ x: g, z: t, w: 0.35, d: 4 });
        dashes.push({ x: t, z: g, w: 4, d: 0.35 });
      }
    }
    const dashMesh = new THREE.InstancedMesh(planeGeo, basic(0xc8c098), dashes.length);
    dashes.forEach((d, i) => {
      dummy.position.set(d.x, 0.08, d.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(d.w, d.d, 1);
      dummy.updateMatrix();
      dashMesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(dashMesh);
    // Cermin neon di koridor chase (z=12) + pelabuhan (z=100):
    // coretan pink/cyan/oranye PANJANG + LEBAR + TERANG, rapat,
    // supaya aspal terbaca basah seperti cermin di referensi.
    const streakCols = [0xff2d78, 0x00e5ff, 0xff6a00, 0xffe14d, 0x39ff6a, 0xc26aff];
    for (let x = -60; x <= 110; x += 6) {
      const c = streakCols[Math.abs(Math.round(x / 6)) % streakCols.length];
      wetStreak(scene, x, 12 + ((x % 8) - 4) * 0.55, 16 + (Math.abs(x) % 7), 1.2 + (Math.abs(x) % 3) * 0.4, c, 0.6, true);
      wetStreak(scene, x + 3, 12 - ((x % 8) - 4) * 0.55, 11 + (Math.abs(x) % 5), 0.9, streakCols[(Math.abs(Math.round(x / 6)) + 2) % streakCols.length], 0.4, true);
    }
    for (let x = 30; x <= 108; x += 9) {
      const c = streakCols[(x / 9) % streakCols.length];
      wetStreak(scene, x, 100 + (x % 2), 12, 1.1, c, 0.3, true);
    }
    // Jejak cahaya tipis di tengah jalan chase: pantulan lampu mobil
    // + lampu jalan di aspal basah (samar, bukan pita putih lebar).
    for (let x = -40; x <= 100; x += 14) {
      wetStreak(scene, x, 12, 22, 0.5, 0xffe9b0, 0.22, true);
    }
    // Genangan berwarna: elips glow pink/cyan di aspal koridor chase.
    const puddleGlowCols = [0xff2d78, 0x00e5ff, 0xff6a00, 0xffe14d];
    for (let i = 0; i < 10; i += 1) {
      const pg = new THREE.Mesh(
        new THREE.CircleGeometry(1.8 + (i % 3) * 0.5, 18),
        new THREE.MeshBasicMaterial({ map: getGlowTex(), color: puddleGlowCols[i % puddleGlowCols.length], transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      pg.rotation.x = -Math.PI / 2;
      pg.position.set(-40 + i * 13, 0.085, 12 + (i % 2 === 0 ? 2.5 : -2.5));
      scene.add(pg);
    }
    // Genangan: elips mengkilap tersebar di jalan (Phong specular tinggi).
    const puddleGeo = new THREE.CircleGeometry(1, 20);
    const puddleMat = new THREE.MeshPhongMaterial({ color: 0x1a2030, shininess: 300, specular: 0xffffff, transparent: true, opacity: 0.85 });
    const puddles = [[48, 12, 3.2], [66, 12, 2.4], [30, 12, 2.8], [84, 100, 3.0], [12, -32, 2.2], [-20, 12, 2.6], [58, 56, 2.4]];
    for (const [px, pz, pr] of puddles) {
      const pd = new THREE.Mesh(puddleGeo, puddleMat);
      pd.rotation.x = -Math.PI / 2;
      pd.scale.set(pr, pr * 0.62, 1);
      pd.position.set(px, 0.09, pz);
      scene.add(pd);
    }
  }

  // ---------- kota statis ----------
  let cityBuilt = false;
  let shellMesh = null;
  let shellList = null;
  function buildCity(G) {
    if (cityBuilt) return;
    cityBuilt = true;
    const city = G.city;
    // Massa gedung: satu InstancedMesh, warna per instance.
    const bldg = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), city.buildings.length);
    const col = new THREE.Color();
    city.buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.h / 2, b.z);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bldg.setMatrixAt(i, dummy.matrix);
      bldg.setColorAt(i, col.setHex(b.color));
    });
    scene.add(bldg);
    // Lis atap (cornice): lempeng tipis sedikit lebih lebar di puncak
    // tiap gedung — memecah siluet balok polos dari jauh.
    const cornice = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), city.buildings.length);
    city.buildings.forEach((b, i) => {
      dummy.position.set(b.x, b.h + 0.25, b.z);
      dummy.scale.set(b.w + 0.7, 0.5, b.d + 0.7);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      cornice.setMatrixAt(i, dummy.matrix);
      cornice.setColorAt(i, col.setHex(b.color).multiplyScalar(0.55));
    });
    scene.add(cornice);
    // Tangki + antena di atap gedung tinggi: silinder, bukan kotak.
    const tallRoofs = city.buildings.filter((b) => b.tall);
    const tanks = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.1, 1.1, 2.2, 10), lambert(0x3a3f4a), tallRoofs.length);
    const aerials = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.16, 6, 6), basic(0x222226), tallRoofs.length);
    tallRoofs.forEach((b, i) => {
      dummy.position.set(b.x - b.w / 4, b.h + 1.4, b.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      tanks.setMatrixAt(i, dummy.matrix);
      dummy.position.set(b.x + b.w / 4, b.h + 3, b.z + b.d / 4);
      dummy.updateMatrix();
      aerials.setMatrixAt(i, dummy.matrix);
    });
    scene.add(tanks);
    scene.add(aerials);
    // Jendela menyala: rapat, hangat + dingin, di keempat fasad.
    const wins = [];
    for (const b of city.buildings) {
      const cols = Math.max(2, Math.floor(b.w / 2.6));
      const rows = Math.max(2, Math.floor(b.h / 2.9));
      for (let s = 0; s < 4; s += 1) {
        for (let cx = 0; cx < cols; cx += 1) {
          for (let ry = 0; ry < rows; ry += 1) {
            if ((cx + ry * 2 + s) % 2 === 0) continue;
            const warm = ((cx * 7 + ry * 3 + s) % 3) !== 0;
            const c = warm ? [0.92, 0.62, 0.26] : [0.55, 0.78, 0.95];
            const fx = (cx + 0.5) / cols - 0.5;
            const fy = 2.0 + ry * 2.9;
            if (fy > b.h - 1) continue;
            const off = 0.07;
            if (s === 0) wins.push({ x: b.x + fx * b.w, y: fy, z: b.z + b.d / 2 + off, ry: 0, c });
            if (s === 1) wins.push({ x: b.x + fx * b.w, y: fy, z: b.z - b.d / 2 - off, ry: Math.PI, c });
            if (s === 2) wins.push({ x: b.x + b.w / 2 + off, y: fy, z: b.z + fx * b.d, ry: Math.PI / 2, c });
            if (s === 3) wins.push({ x: b.x - b.w / 2 - off, y: fy, z: b.z + fx * b.d, ry: -Math.PI / 2, c });
          }
        }
      }
    }
    const winMesh = new THREE.InstancedMesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), wins.length);
    wins.forEach((w, i) => {
      dummy.position.set(w.x, w.y, w.z);
      dummy.rotation.set(0, w.ry, 0);
      dummy.scale.set(0.85, 0.9, 1);
      dummy.updateMatrix();
      winMesh.setMatrixAt(i, dummy.matrix);
      winMesh.setColorAt(i, col.setRGB(w.c[0], w.c[1], w.c[2]));
    });
    scene.add(winMesh);
    // Garis neon vertikal di sudut fasad gedung dekat jalan + etalase
    // toko menyala di lantai dasar: fasad tidak lagi bidang datar.
    const edgeStrips = [];
    const shopGlows = [];
    for (const b of city.buildings) {
      const nearRoad = ROAD_LINES.some((ln) => Math.abs(b.z + b.d / 2 - ln) < 13 || Math.abs(b.z - b.d / 2 - ln) < 13 || Math.abs(b.x + b.w / 2 - ln) < 13 || Math.abs(b.x - b.w / 2 - ln) < 13);
      if (!nearRoad) continue;
      const c = [0xff2d78, 0x00e5ff, 0xffe14d, 0x39ff6a, 0xff6a00, 0xc26aff][(Math.abs(Math.round(b.x + b.z)) % 6)];
      edgeStrips.push({ x: b.x + b.w / 2 + 0.08, y: b.h / 2, z: b.z + b.d / 2 + 0.08, ry: 0, h: b.h * 0.92, c });
      edgeStrips.push({ x: b.x - b.w / 2 - 0.08, y: b.h / 2, z: b.z - b.d / 2 - 0.08, ry: Math.PI, h: b.h * 0.92, c });
      shopGlows.push({ x: b.x, y: 1.7, z: b.z + b.d / 2 + 0.09, ry: 0, w: b.w * 0.8 });
      shopGlows.push({ x: b.x, y: 1.7, z: b.z - b.d / 2 - 0.09, ry: Math.PI, w: b.w * 0.8 });
    }
    const edgeMesh = new THREE.InstancedMesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }), edgeStrips.length);
    edgeStrips.forEach((e, i) => {
      dummy.position.set(e.x, e.y, e.z);
      dummy.rotation.set(0, e.ry, 0);
      dummy.scale.set(0.18, e.h, 1);
      dummy.updateMatrix();
      edgeMesh.setMatrixAt(i, dummy.matrix);
      edgeMesh.setColorAt(i, col.setHex(e.c).multiplyScalar(0.7));
    });
    scene.add(edgeMesh);
    const glowMesh = new THREE.InstancedMesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0xffb45e, transparent: true, opacity: 0.55, side: THREE.DoubleSide }), shopGlows.length);
    shopGlows.forEach((e, i) => {
      dummy.position.set(e.x, e.y, e.z);
      dummy.rotation.set(0, e.ry, 0);
      dummy.scale.set(e.w * 0.75, 2.0, 1);
      dummy.updateMatrix();
      glowMesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(glowMesh);
    // Tenda toko bergaris + kusen etalase + pintu: lantai dasar hidup.
    const awnCanvas = document.createElement('canvas');
    awnCanvas.width = 128;
    awnCanvas.height = 32;
    {
      const actx = awnCanvas.getContext('2d');
      for (let i = 0; i < 8; i += 1) {
        actx.fillStyle = i % 2 === 0 ? '#e8455a' : '#f2ead8';
        actx.fillRect(i * 16, 0, 16, 32);
      }
    }
    const awnTex = new THREE.CanvasTexture(awnCanvas);
    const awnMat = new THREE.MeshLambertMaterial({ map: awnTex });
    const awnGeo = new THREE.PlaneGeometry(1, 1);
    const mullMat = lambert(0x14161c);
    const doorMat = lambert(0x0c0e14);
    const trimMat = lambert(0x1c1e26);
    for (const b of city.buildings) {
      const f = nearestFace(b);
      if (f.gap > 13 || b.h < 6) continue;
      const awnW = Math.min(b.w * 0.85, 10);
      const awn = new THREE.Mesh(awnGeo, awnMat);
      awn.scale.set(awnW, 1.5, 1);
      awn.position.set(f.px, 3.1, f.pz + f.nz * 0.7);
      awn.rotation.y = f.ry;
      awn.rotation.x = -0.5;
      scene.add(awn);
      // Kusen vertikal etalase (3 tiang) + pintu tengah.
      for (let k = -1; k <= 1; k += 1) {
        const mull = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), mullMat);
        const ox2 = f.nz !== 0 ? k * awnW * 0.28 : 0;
        const oz2 = f.nz !== 0 ? 0 : k * awnW * 0.28;
        mull.position.set(f.px + ox2 + f.nx * 0.12, 1.5, f.pz + oz2 + f.nz * 0.12);
        scene.add(mull);
      }
      const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 2.5), doorMat);
      door.position.set(f.px, 1.25, f.pz + f.nz * 0.1);
      door.position.x += f.nx * 0.1;
      door.rotation.y = f.ry;
      scene.add(door);
      // Lis dasar gelap: alas bangunan tegas di trotoar.
      const trim = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), trimMat);
      trim.scale.set(b.w + 0.2, 0.5, b.d + 0.2);
      trim.position.set(b.x, 0.25, b.z);
      scene.add(trim);
      // Balkon di lantai 2-3 gedung tinggi + kotak AC di atap.
      if (b.tall) {
        for (let fl = 0; fl < 2; fl += 1) {
          const by = 6.5 + fl * 3.2;
          if (by > b.h - 2) break;
          const balc = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4, b.w * 0.5), 0.25, 1.2), trimMat);
          balc.position.set(f.px + (fl % 2 === 0 ? -b.w * 0.18 : b.w * 0.18), by, f.pz + f.nz * 0.7);
          balc.position.x += f.nx * 0.7;
          scene.add(balc);
          const rail = new THREE.Mesh(new THREE.BoxGeometry(Math.min(4, b.w * 0.5), 0.8, 0.08), mullMat);
          rail.position.set(balc.position.x, by + 0.5, balc.position.z + f.nz * 0.55);
          rail.position.x += f.nx * 0.55;
          rail.rotation.y = f.ry;
          scene.add(rail);
        }
        const ac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), lambert(0x4a4f58));
        ac.position.set(b.x + b.w / 4, b.h + 0.9, b.z - b.d / 4);
        scene.add(ac);
      }
      // Pantulan sign di aspal: coretan memanjang searah jalan.
      const alongX = f.nz !== 0;
      const reach = f.gap * 0.5 + 1.5;
      const fcol = [0xff2d78, 0x00e5ff, 0xffe14d, 0x39ff6a, 0xff6a00, 0xc26aff][Math.abs(Math.round(b.x + b.z)) % 6];
      wetStreak(scene, f.px + f.nx * reach, f.pz + f.nz * reach, 14, 1.6, fcol, 0.55, alongX);
    }
    const NEON_TEXTS = ['WARUNG KOPI', 'SINEMA', 'KARAOKE', 'BILLIARD', 'PIZZA', 'KAFE', 'HOTEL', 'BAR', 'TOKO 24 JAM', 'PASAR MALAM', 'RUMAH MAKAN', 'BAKSO', 'SATE', 'KOPI TELUK', 'DISKO', 'SALON', 'BENGKEL', 'FOTO STUDIO', 'LAUNDRY', 'WARUNG'];
    const NEON_COLORS = ['#ff2d78', '#00e5ff', '#ffe14d', '#39ff6a', '#ff6a00', '#c26aff', '#ff3b30'];
    const neonTexCache = new Map();
    function neonTexture(text, color, vertical) {
      const key = `${text}|${color}|${vertical ? 'v' : 'h'}`;
      if (neonTexCache.has(key)) return neonTexCache.get(key);
      const c = document.createElement('canvas');
      c.width = vertical ? 128 : 512;
      c.height = vertical ? 512 : 128;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = color;
      ctx.shadowBlur = 26;
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.fillStyle = '#ffffff';
      if (vertical) {
        ctx.font = '900 54px Arial, sans-serif';
        ctx.save();
        ctx.translate(64, 256);
        ctx.rotate(-Math.PI / 2);
        ctx.strokeText(text, 0, 0);
        ctx.shadowBlur = 12;
        ctx.fillText(text, 0, 0);
        ctx.restore();
      } else {
        const size = text.length > 9 ? 46 : 58;
        ctx.font = `900 ${size}px Arial, sans-serif`;
        ctx.strokeText(text, 256, 66);
        ctx.shadowBlur = 12;
        ctx.fillText(text, 256, 66);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 4;
      neonTexCache.set(key, tex);
      return tex;
    }
    function nearestFace(b) {
      const faces = [
        { gap: Math.min(...ROAD_LINES.map((ln) => Math.abs(b.z + b.d / 2 - ln))), ry: 0, nx: 0, nz: 1, px: b.x, pz: b.z + b.d / 2 + 0.15 },
        { gap: Math.min(...ROAD_LINES.map((ln) => Math.abs(b.z - b.d / 2 - ln))), ry: Math.PI, nx: 0, nz: -1, px: b.x, pz: b.z - b.d / 2 - 0.15 },
        { gap: Math.min(...ROAD_LINES.map((ln) => Math.abs(b.x + b.w / 2 - ln))), ry: Math.PI / 2, nx: 1, nz: 0, px: b.x + b.w / 2 + 0.15, pz: b.z },
        { gap: Math.min(...ROAD_LINES.map((ln) => Math.abs(b.x - b.w / 2 - ln))), ry: -Math.PI / 2, nx: -1, nz: 0, px: b.x - b.w / 2 - 0.15, pz: b.z },
      ];
      faces.sort((a, c2) => a.gap - c2.gap);
      return faces[0];
    }
    city.buildings.forEach((b, bi) => {
      if (b.h < 6) return;
      const f = nearestFace(b);
      if (f.gap > 13) return;
      const text = NEON_TEXTS[bi % NEON_TEXTS.length];
      const color = NEON_COLORS[(bi + 3) % NEON_COLORS.length];
      const w = Math.min(11, b.w * 0.95);
      const sign = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: neonTexture(text, color, false), transparent: true, side: THREE.DoubleSide }));
      sign.scale.set(w, w / 3.4, 1);
      sign.position.set(f.px, Math.min(5.2, b.h * 0.5), f.pz);
      sign.rotation.y = f.ry;
      scene.add(sign);
      // Pantulan sign di aspal: coretan memanjang searah jalan.
      const alongX = f.nz !== 0;
      const reach = f.gap * 0.5 + 1.5;
      wetStreak(scene, f.px + f.nx * reach, f.pz + f.nz * reach, 10, 1.0, new THREE.Color(color).getHex(), 0.25, alongX);
      // Sign vertikal di gedung tinggi.
      if (b.tall && bi % 2 === 0) {
        const vtext = NEON_TEXTS[(bi + 7) % NEON_TEXTS.length];
        const vcolor = NEON_COLORS[(bi + 1) % NEON_COLORS.length];
        const vsign = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: neonTexture(vtext, vcolor, true), transparent: true, side: THREE.DoubleSide }));
        vsign.scale.set(2.2, 9, 1);
        vsign.position.set(f.px, Math.min(b.h - 5, 14), f.pz);
        vsign.rotation.y = f.ry;
        scene.add(vsign);
      }
    });
    // Billboard "TELUK FM" di koridor chase, menghadap kamera.
    const bbCanvas = document.createElement('canvas');
    bbCanvas.width = 1024;
    bbCanvas.height = 384;
    const bctx = bbCanvas.getContext('2d');
    bctx.fillStyle = '#ff2d78';
    bctx.fillRect(0, 0, 1024, 384);
    bctx.strokeStyle = '#ffffff';
    bctx.lineWidth = 10;
    bctx.strokeRect(14, 14, 996, 356);
    bctx.font = '900 130px Arial, sans-serif';
    bctx.textAlign = 'center';
    bctx.textBaseline = 'middle';
    bctx.fillStyle = '#ffffff';
    bctx.shadowColor = '#ff8ab0';
    bctx.shadowBlur = 30;
    bctx.fillText('TELUK FM', 600, 160);
    bctx.font = '700 64px Arial, sans-serif';
    bctx.fillText('88.1 · MALAM NEON', 600, 300);
    const bbTex = new THREE.CanvasTexture(bbCanvas);
    bbTex.anisotropy = 4;
    const billboard = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: bbTex, side: THREE.DoubleSide }));
    billboard.scale.set(14, 5.2, 1);
    billboard.position.set(-20, 8, 26);
    billboard.rotation.y = Math.PI / 2;
    scene.add(billboard);
    // Palem: batang melengkung (2 segmen silinder) + tajuk dari 7
    // daun elips pipih yang terkulai — bukan kerucut hijau.
    const trunkGeo = new THREE.CylinderGeometry(0.22, 0.42, 1, 7);
    const frondGeo = new THREE.SphereGeometry(1, 8, 6);
    const frondMat = new THREE.MeshLambertMaterial({ color: 0x1e7a2e });
    const frondDark = new THREE.MeshLambertMaterial({ color: 0x14601f });
    const allPalms = city.palms.slice();
    for (let i = 0; i < 12; i += 1) {
      allPalms.push({ x: -34 + i * 9, z: 12 + (i % 2 === 0 ? 10 : -10), h: 9 + (i % 3) });
    }
    const trunks = new THREE.InstancedMesh(trunkGeo, lambert(0x5a3a22), allPalms.length * 2);
    const fronds = new THREE.InstancedMesh(frondGeo, frondMat, allPalms.length * 9);
    const nuts = new THREE.InstancedMesh(sphereGeo, lambert(0x6a4a1a), allPalms.length * 3);
    let ti = 0;
    let fi = 0;
    let ni = 0;
    allPalms.forEach((p, pi) => {
      const lean = (pi % 5 - 2) * 0.04;
      dummy.position.set(p.x, p.h * 0.3, p.z);
      dummy.scale.set(1, p.h * 0.6, 1);
      dummy.rotation.set(lean, 0, lean);
      dummy.updateMatrix();
      trunks.setMatrixAt(ti, dummy.matrix);
      ti += 1;
      dummy.position.set(p.x + lean * p.h * 0.6, p.h * 0.75, p.z + lean * p.h * 0.6);
      dummy.scale.set(1, p.h * 0.55, 1);
      dummy.rotation.set(lean * 2, 0, lean * 2);
      dummy.updateMatrix();
      trunks.setMatrixAt(ti, dummy.matrix);
      ti += 1;
      for (let f = 0; f < 9; f += 1) {
        const a = (f / 9) * Math.PI * 2 + pi * 0.7;
        dummy.position.set(
          p.x + Math.cos(a) * 1.05,
          p.h + 0.6 - (f % 3) * 0.35,
          p.z + Math.sin(a) * 1.05,
        );
        dummy.rotation.set(Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1);
        dummy.scale.set(1.5, 0.18, 0.42);
        dummy.updateMatrix();
        fronds.setMatrixAt(fi, dummy.matrix);
        fi += 1;
      }
      for (let n = 0; n < 3; n += 1) {
        dummy.position.set(p.x + (n - 1) * 0.3, p.h + 0.3, p.z + (n % 2) * 0.3);
        dummy.scale.set(0.7, 0.7, 0.7);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        nuts.setMatrixAt(ni, dummy.matrix);
        ni += 1;
      }
    });
    scene.add(trunks);
    scene.add(fronds);
    scene.add(nuts);
    void frondDark;
    // Lampu jalan: tiang silinder + lengan + kepala pijar + kolam
    // cahaya hangat di aspal basah.
    const poleGeo = new THREE.CylinderGeometry(0.14, 0.18, 5.4, 6);
    const poles = new THREE.InstancedMesh(poleGeo, lambert(0x232328), city.lamps.length);
    const heads = new THREE.InstancedMesh(sphereGeo, basic(0xffd88a), city.lamps.length);
    city.lamps.forEach((l, i) => {
      dummy.position.set(l.x, 2.7, l.z);
      dummy.scale.set(1, 1, 1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      poles.setMatrixAt(i, dummy.matrix);
      dummy.position.set(l.x, 5.5, l.z);
      dummy.scale.set(1.6, 1.1, 1.6);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
      const pool = new THREE.Mesh(
        new THREE.CircleGeometry(2.6, 18),
        new THREE.MeshBasicMaterial({ map: getGlowTex(), color: 0xffb45e, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(l.x, 0.08, l.z);
      scene.add(pool);
    });
    scene.add(poles);
    scene.add(heads);
    // Kontainer pelabuhan + garis tepi warna.
    const cont = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), city.containers.length);
    city.containers.forEach((c, i) => {
      dummy.position.set(c.x, c.h / 2, c.z);
      dummy.scale.set(c.w, c.h, c.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      cont.setMatrixAt(i, dummy.matrix);
      cont.setColorAt(i, col.setHex(c.color));
    });
    scene.add(cont);
    // Kerang Teluk: bola emas kecil.
    shellList = G.shells;
    shellMesh = new THREE.InstancedMesh(sphereGeo, basic(0xffd23f), shellList.length);
    scene.add(shellMesh);
  }

  // ---------- kendaraan: bodi kapsul membulat, cat glossy ----------
  const carGroups = new Map();
  let polisiTex = null;
  function getPlateTex() {
    if (plateTexCache) return plateTexCache;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#f2f2e8';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#1a2a6a';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, 250, 58);
    ctx.font = '900 38px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#16224a';
    ctx.fillText('TC · RAKA', 128, 34);
    plateTexCache = new THREE.CanvasTexture(c);
    return plateTexCache;
  }
  let plateTexCache = null;
  function getPolisiTex() {
    if (polisiTex) return polisiTex;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);
    ctx.font = '900 44px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#10203a';
    ctx.fillText('POLISI', 128, 34);
    polisiTex = new THREE.CanvasTexture(c);
    return polisiTex;
  }
  function capsuleMesh(r, len, mat) {
    return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat);
  }
  function buildCar(v) {
    const g = new THREE.Group();
    const paint = gloss(v.color, v.type === 'sport' ? 240 : 190);
    if (v.type === 'sport') { paint.color.setHex(0xe03030); paint.shininess = 170; }
    g.userData.bodyMat = paint;
    g.userData.baseColor = v.type === 'sport' ? 0xe03030 : v.color;
    // Bodi bawah: kapsul tidur — sisi membulat, bukan balok.
    const hull = capsuleMesh(0.5, Math.max(1.2, v.len - 1.5), paint);
    hull.rotation.x = Math.PI / 2;
    hull.scale.set(v.wid, 1, 0.72);
    hull.position.y = 0.5;
    g.add(hull);
    // Ujung depan/belakang membulat.
    const nose = new THREE.Mesh(sphereGeo, paint);
    nose.scale.set(v.wid * 0.94, 0.42, 0.8);
    nose.position.set(0, 0.52, v.len / 2 - 0.45);
    g.add(nose);
    const tail = new THREE.Mesh(sphereGeo, paint);
    tail.scale.set(v.wid * 0.94, 0.42, 0.8);
    tail.position.set(0, 0.52, -v.len / 2 + 0.45);
    g.add(tail);
    // Kabin kaca: setengah bola gelap mengkilap.
    const glass = new THREE.MeshPhongMaterial({ color: 0x0a1220, shininess: 120, specular: 0x666677 });
    const cabin = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), glass);
    cabin.scale.set(v.wid * 0.30, 0.22, v.len * 0.15);
    cabin.position.set(0, 0.8, -0.3);
    g.add(cabin);
    // Atap: punggung merah matte di atas kabin — tanpa kilau specular
    // putih yang terbaca sebagai strip di foto.
    const roof = capsuleMesh(0.1, v.len * 0.12, lambert(g.userData.baseColor));
    roof.rotation.x = Math.PI / 2;
    roof.scale.set(1.1, 1, 0.55);
    roof.position.set(0, 1.0, -0.3);
    g.add(roof);
    // Ban: torus + pelek logam 5-spoke + cakram rem.
    const tireGeo = new THREE.TorusGeometry(0.3, 0.11, 10, 18);
    const tireMat = lambert(0x0c0c0e);
    const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.14, 14);
    const rimMat = new THREE.MeshPhongMaterial({ color: 0xc8ccd4, shininess: 220, specular: 0xffffff });
    const discGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.05, 14);
    const discMat = new THREE.MeshPhongMaterial({ color: 0x8a8f98, shininess: 180, specular: 0xdddddd });
    const spokeGeo = new THREE.BoxGeometry(0.34, 0.07, 0.03);
    for (const [wx, wz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.y = Math.PI / 2;
      tire.position.set(wx * (v.wid / 2 - 0.15), 0.32, wz * (v.len / 2 - 0.85));
      g.add(tire);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.rotation.z = Math.PI / 2;
      disc.position.copy(tire.position);
      g.add(disc);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      rim.position.copy(tire.position);
      rim.position.x += wx * 0.06;
      g.add(rim);
      for (let s = 0; s < 5; s += 1) {
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        spoke.position.set(wx * (v.wid / 2 - 0.06), 0.32, wz * (v.len / 2 - 0.85));
        spoke.rotation.x = (s / 5) * Math.PI;
        g.add(spoke);
      }
    }
    // Panel bodi: garis kap + bagasi, grille, lampu depan terpisah,
    // splitter, diffuser + knalpot, gagang pintu, ventilasi samping.
    const seamMat = lambert(0x0a0a0e);
    const hoodSeam = new THREE.Mesh(new THREE.BoxGeometry(v.wid * 0.7, 0.02, 0.05), seamMat);
    hoodSeam.position.set(0, 0.86, v.len * 0.22);
    g.add(hoodSeam);
    const trunkSeam = new THREE.Mesh(new THREE.BoxGeometry(v.wid * 0.7, 0.02, 0.05), seamMat);
    trunkSeam.position.set(0, 0.86, -v.len * 0.28);
    g.add(trunkSeam);
    const grille = new THREE.Mesh(new THREE.BoxGeometry(v.wid * 0.55, 0.16, 0.06), lambert(0x0d0d12));
    grille.position.set(0, 0.55, v.len / 2 + 0.02);
    g.add(grille);
    for (const sx of [-1, 1]) {
      const lamp = capsuleMesh(0.09, 0.42, basic(0xfff6d8));
      lamp.rotation.z = Math.PI / 2;
      lamp.position.set(sx * (v.wid * 0.32), 0.72, v.len / 2 + 0.03);
      g.add(lamp);
      const fog = new THREE.Mesh(sphereGeo, basic(0xffeebb));
      fog.scale.set(0.28, 0.28, 0.28);
      fog.position.set(sx * (v.wid * 0.32), 0.42, v.len / 2 + 0.05);
      g.add(fog);
    }
    const splitter = new THREE.Mesh(new THREE.BoxGeometry(v.wid * 0.98, 0.07, 0.3), lambert(0x0d0d12));
    splitter.position.set(0, 0.18, v.len / 2 - 0.1);
    g.add(splitter);
    const diffuser = new THREE.Mesh(new THREE.BoxGeometry(v.wid * 0.85, 0.08, 0.22), lambert(0x0d0d12));
    diffuser.position.set(0, 0.16, -v.len / 2 + 0.08);
    g.add(diffuser);
    for (const sx of [-0.5, 0.5]) {
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 10), lambert(0x3a3d44));
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(sx * (v.wid * 0.4), 0.18, -v.len / 2 - 0.03);
      g.add(exhaust);
    }
    for (const sx of [-1, 1]) {
      const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.04), seamMat);
      doorSeam.position.set(sx * (v.wid / 2 + 0.01), 0.55, 0.1);
      g.add(doorSeam);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.34), lambert(0x111114));
      handle.position.set(sx * (v.wid / 2 + 0.02), 0.78, 0.35);
      g.add(handle);
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.7), lambert(0x0d0d12));
      vent.position.set(sx * (v.wid / 2 + 0.01), 0.6, -v.len * 0.28);
      g.add(vent);
      const sideGlass = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0x0a1626, shininess: 200, specular: 0x8899bb }));
      sideGlass.scale.set(v.len * 0.2, 0.34, 1);
      sideGlass.position.set(sx * (v.wid * 0.31), 0.88, -0.3);
      sideGlass.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      g.add(sideGlass);
    }
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.34, 6), lambert(0x111114));
    antenna.position.set(0, 1.16, -v.len * 0.18);
    g.add(antenna);
    // Plat nomor "TC·RAKA" depan + belakang.
    const plateTex = getPlateTex();
    for (const sz of [1, -1]) {
      const plate = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: plateTex }));
      plate.scale.set(0.95, 0.24, 1);
      plate.position.set(0, 0.42, sz * (v.len / 2 + 0.06));
      plate.rotation.y = sz > 0 ? 0 : Math.PI;
      g.add(plate);
    }
    // Bar lampu belakang merah memanjang + strip LED depan putih.
    const tailBar = capsuleMesh(0.07, v.wid - 0.7, basic(0xff1a1a));
    tailBar.rotation.z = Math.PI / 2;
    tailBar.position.set(0, 0.78, -v.len / 2 - 0.02);
    g.add(tailBar);
    const tailGlow = glowSprite(0xff2d2d, 0.8);
    tailGlow.position.set(0, 0.8, -v.len / 2 - 0.3);
    g.add(tailGlow);
    const headBar = capsuleMesh(0.05, v.wid - 0.8, basic(0xfff6d8));
    headBar.rotation.z = Math.PI / 2;
    headBar.position.set(0, 0.72, v.len / 2 + 0.02);
    g.add(headBar);
    for (const sx of [-1, 1]) {
      const hg = glowSprite(0xffeebb, 0.9);
      hg.position.set(sx * (v.wid / 2 - 0.3), 0.7, v.len / 2 + 0.4);
      g.add(hg);
    }
    // Spion bulat kecil.
    for (const sx of [-1, 1]) {
      const mir = new THREE.Mesh(sphereGeo, paint);
      mir.scale.set(0.22, 0.22, 0.22);
      mir.position.set(sx * (v.wid / 2 - 0.02), 0.75, v.len * 0.1);
      g.add(mir);
    }
    // Side skirt gelap di bawah pintu: garis bawah mobil tegas.
    for (const sx of [-1, 1]) {
      const skirt = capsuleMesh(0.06, v.len * 0.55, lambert(0x111114));
      skirt.rotation.x = Math.PI / 2;
      skirt.position.set(sx * (v.wid / 2 - 0.05), 0.3, 0);
      g.add(skirt);
    }
    // Bayangan lembut di bawah mobil (bidang glow gelap-biru).
    const pad = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: getGlowTex(), color: 0x06060c, transparent: true, opacity: 0.55, depthWrite: false }));
    pad.rotation.x = -Math.PI / 2;
    pad.scale.set(v.len + 1.6, v.wid + 2.2, 1);
    pad.position.y = 0.05;
    g.add(pad);
    if (v.type === 'sport') {
      // Spoiler GT sewarna bodi (matte, tanpa strip specular putih):
      // sayap kapsul pipih + 2 penyangga + endplate gelap.
      const wing = capsuleMesh(0.04, v.wid - 0.6, lambert(g.userData.baseColor));
      wing.rotation.z = Math.PI / 2;
      wing.position.set(0, 0.98, -v.len / 2 + 0.3);
      g.add(wing);
      for (const sx of [-0.6, 0.6]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 8), lambert(0x14141a));
        strut.position.set(sx, 0.9, -v.len / 2 + 0.3);
        g.add(strut);
        const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.5), lambert(0x14141a));
        endplate.position.set(sx * (v.wid / 2 - 0.28), 0.98, -v.len / 2 + 0.3);
        g.add(endplate);
      }
    }
    if (v.type === 'police') {
      // Pita hitam melingkari pintu + tulisan POLISI di sisi mobil.
      const band = capsuleMesh(0.51, v.len * 0.42, lambert(0x0d0d14));
      band.rotation.x = Math.PI / 2;
      band.scale.set(v.wid * 1.01, 1, 0.94);
      band.position.y = 0.56;
      g.add(band);
      for (const sx of [-1, 1]) {
        const label = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ map: getPolisiTex(), transparent: true, side: THREE.DoubleSide }));
        label.scale.set(2.0, 0.5, 1);
        label.position.set(sx * (v.wid / 2 + 0.06), 0.62, 0);
        label.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(label);
      }
      // Bar lampu merah-biru di atap + kilau menyala.
      const barL = capsuleMesh(0.13, 0.55, new THREE.MeshBasicMaterial({ color: 0xff1a1a }));
      barL.rotation.z = Math.PI / 2;
      barL.position.set(-0.38, 1.34, -0.25);
      g.add(barL);
      const barR = capsuleMesh(0.13, 0.55, new THREE.MeshBasicMaterial({ color: 0x2244ff }));
      barR.rotation.z = Math.PI / 2;
      barR.position.set(0.38, 1.34, -0.25);
      g.add(barR);
      const glowL = glowSprite(0xff1a1a, 1.7);
      glowL.position.set(-0.38, 1.5, -0.25);
      g.add(glowL);
      const glowR = glowSprite(0x2244ff, 1.7);
      glowR.position.set(0.38, 1.5, -0.25);
      g.add(glowR);
      g.userData.barL = barL;
      g.userData.barR = barR;
      g.userData.glowL = glowL;
      g.userData.glowR = glowR;
    }
    if (v.type === 'taxi') {
      const sign = capsuleMesh(0.12, 0.6, basic(0xf2c200));
      sign.rotation.z = Math.PI / 2;
      sign.position.set(0, 1.42, -0.25);
      g.add(sign);
    }
    return g;
  }
  function syncCars(G, t) {
    const seen = new Set();
    for (const v of G.vehicles) {
      seen.add(v);
      let g = carGroups.get(v);
      if (!g) {
        g = buildCar(v);
        carGroups.set(v, g);
        scene.add(g);
      }
      if (g.userData.baseColor !== v.color && v.type !== 'sport') {
        g.userData.baseColor = v.color;
        g.userData.bodyMat.color.setHex(v.color);
      }
      g.position.set(v.x, 0, v.z);
      g.rotation.y = v.angle;
      g.visible = !v.dead;
      if (v.flash > 0) g.userData.bodyMat.color.setHex(0xffffff);
      else g.userData.bodyMat.color.setHex(g.userData.baseColor);
      if (g.userData.barL) {
        const phase = Math.floor(t * 4) % 2 === 0;
        g.userData.barL.material.color.setHex(phase ? 0xff1a1a : 0x550000);
        g.userData.barR.material.color.setHex(phase ? 0x000055 : 0x2244ff);
        g.userData.glowL.material.opacity = phase ? 0.95 : 0.15;
        g.userData.glowR.material.opacity = phase ? 0.15 : 0.95;
        g.userData.glowL.scale.setScalar(phase ? 2.2 : 1.2);
        g.userData.glowR.scale.setScalar(phase ? 1.2 : 2.2);
      }
    }
    for (const [v, g] of carGroups) {
      if (!seen.has(v)) {
        scene.remove(g);
        carGroups.delete(v);
      }
    }
  }

  // ---------- karakter jalan kaki: kapsul + bola, bukan balok ----------
  const personGroups = new Map();
  function buildPerson(color, armed, enemy, hat) {
    const g = new THREE.Group();
    const shirt = lambert(color);
    const torso = capsuleMesh(0.3, 0.5, shirt);
    torso.position.y = 0.95;
    g.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 10), lambert(0xe8b98a));
    head.position.y = 1.68;
    g.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 8), lambert(0x1c1c22));
    hair.scale.set(1, 0.62, 1);
    hair.position.y = 1.8;
    g.add(hair);
    if (hat === 'cap') {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 8), lambert(0x1c2f6e));
      cap.scale.set(1, 0.55, 1);
      cap.position.y = 1.86;
      g.add(cap);
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.05, 0.22), lambert(0x1c2f6e));
      brim.position.set(0, 1.84, 0.26);
      g.add(brim);
      // Rompi reflektif polisi: garis terang di dada.
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.05), basic(0xd8e8ff));
      vest.position.set(0, 1.05, 0.3);
      g.add(vest);
    } else if (hat === 'bandana') {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12), lambert(0xc22a2a));
      band.position.y = 1.8;
      g.add(band);
    } else if (hat) {
      const cap2 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 8), lambert(hat));
      cap2.scale.set(1, 0.55, 1);
      cap2.position.y = 1.86;
      g.add(cap2);
    }
    for (const sx of [-0.16, 0.16]) {
      const leg = capsuleMesh(0.11, 0.45, lambert(0x222831));
      leg.position.set(sx, 0.36, 0);
      g.add(leg);
      const arm = capsuleMesh(0.09, 0.4, shirt);
      arm.position.set(sx * 1.9, 1.0, 0);
      arm.rotation.z = sx > 0 ? -0.25 : 0.25;
      g.add(arm);
    }
    if (armed) {
      const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 8), lambert(0x111111));
      gun.rotation.x = Math.PI / 2;
      gun.position.set(0, 1.05, 0.5);
      g.add(gun);
    }
    if (enemy) {
      const marker = new THREE.Mesh(coneGeo, basic(0xff2222));
      marker.scale.set(0.5, 0.9, 0.5);
      marker.position.y = 2.5;
      marker.rotation.x = Math.PI;
      g.add(marker);
      g.userData.marker = marker;
      const bg = putBox(g, 0, 2.15, 0, 1.1, 0.12, 0.05, basic(0x111111));
      const fg = putBox(g, 0, 2.15, 0, 1.1, 0.12, 0.06, basic(0xe5534b));
      g.userData.hpBg = bg;
      g.userData.hpFg = fg;
    }
    return g;
  }
  function syncPeople(G, t) {
    const seen = new Set();
    const entries = [];
    const hatCols = [0x2e8a5b, 0xc22a2a, 0xe8a020, 0x8a5ec2, 0x2e6fb5];
    for (const ped of G.peds) {
      const h = Math.abs(Math.round(ped.x * 7 + ped.z * 13)) % 3 === 0 ? hatCols[Math.abs(Math.round(ped.x + ped.z)) % hatCols.length] : null;
      entries.push({ e: ped, color: ped.color, armed: false, enemy: false, hat: h });
    }
    for (const c of G.cops) entries.push({ e: c, color: 0x1c2f6e, armed: true, enemy: false, hat: 'cap' });
    for (const en of G.enemies) entries.push({ e: en, color: en.color, armed: true, enemy: true, hat: 'bandana' });
    for (const { e, color, armed, enemy, hat } of entries) {
      seen.add(e);
      let g = personGroups.get(e);
      if (!g) {
        g = buildPerson(color, armed, enemy, hat);
        personGroups.set(e, g);
        scene.add(g);
      }
      g.position.set(e.x, 0, e.z);
      g.rotation.y = e.angle;
      g.visible = !e.dead;
      if (g.userData.marker) {
        g.userData.marker.position.y = 2.5 + Math.sin(t * 4) * 0.15;
        const ratio = Math.max(0, e.health / 60);
        g.userData.hpFg.scale.x = ratio;
        g.userData.hpFg.position.x = -(1 - ratio) * 0.55;
      }
    }
    for (const [e, g] of personGroups) {
      if (!seen.has(e)) {
        scene.remove(g);
        personGroups.delete(e);
      }
    }
  }

  // ---------- pemain jalan kaki ----------
  const playerGroup = webglOK ? buildPerson(0x2e6fb5, true, false) : null;
  if (webglOK) scene.add(playerGroup);

  // ---------- helikopter: bodi kapsul + ekor silinder + rotor ----------
  const heliGroup = webglOK ? new THREE.Group() : null;
  let heliRotor = null;
  let heliBlink = null;
  let spotCone = null;
  let spotCircle = null;
  let spotLight = null;
  let spotTarget = null;
  if (webglOK) {
    const heliPaint = gloss(0x232a38, 160);
    const body = capsuleMesh(0.85, 2.4, heliPaint);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0;
    heliGroup.add(body);
    const glass = new THREE.MeshPhongMaterial({ color: 0x0a1626, shininess: 320, specular: 0xffffff });
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), glass);
    cockpit.scale.set(0.72, 0.62, 0.9);
    cockpit.position.set(0, 0.15, 1.5);
    heliGroup.add(cockpit);
    const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, 3.4, 10), heliPaint);
    tailBoom.rotation.x = Math.PI / 2;
    tailBoom.position.set(0, 0.1, -3.2);
    heliGroup.add(tailBoom);
    const fin = new THREE.Mesh(sphereGeo, heliPaint);
    fin.scale.set(0.35, 2.2, 1.4);
    fin.position.set(0, 0.7, -4.6);
    heliGroup.add(fin);
    for (const sx of [-0.85, 0.85]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.2, 8), lambert(0x0d0d14));
      skid.rotation.x = Math.PI / 2;
      skid.position.set(sx, -0.95, 0.6);
      heliGroup.add(skid);
      for (const sz of [-0.4, 1.4]) {
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), lambert(0x0d0d14));
        strut.position.set(sx, -0.7, sz);
        heliGroup.add(strut);
      }
    }
    heliRotor = new THREE.Group();
    heliRotor.position.y = 0.95;
    const bladeMat = lambert(0x0d0d14);
    for (const rot of [0, Math.PI / 2]) {
      const blade = capsuleMesh(0.06, 10.4, bladeMat);
      blade.rotation.z = Math.PI / 2;
      const holder = new THREE.Group();
      holder.rotation.y = rot;
      holder.add(blade);
      heliRotor.add(holder);
    }
    heliGroup.add(heliRotor);
    heliBlink = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xff1a1a }));
    heliBlink.scale.set(1.1, 0.7, 1.1);
    heliBlink.position.set(0, -0.85, 0);
    heliGroup.add(heliBlink);
    const blinkGlow = glowSprite(0xff1a1a, 2.4);
    blinkGlow.position.set(0, -0.85, 0);
    heliGroup.add(blinkGlow);
    scene.add(heliGroup);
    // Kerucut sorot + lingkaran cahaya di tanah + SpotLight sungguhan.
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xfff0a0, transparent: true, opacity: 0.02,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    });
    spotCone = new THREE.Mesh(new THREE.ConeGeometry(3.0, 14, 20, 1, true), coneMat);
    scene.add(spotCone);
    const circMat = new THREE.MeshBasicMaterial({
      color: 0xfff0a0, transparent: true, opacity: 0.04,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    spotCircle = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), circMat);
    spotCircle.rotation.x = -Math.PI / 2;
    scene.add(spotCircle);
    spotLight = new THREE.SpotLight(0xfff2b0, 0.9, 70, 0.30, 0.5, 1.1);
    spotTarget = new THREE.Object3D();
    scene.add(spotTarget);
    spotLight.target = spotTarget;
    scene.add(spotLight);
  }

  // ---------- tracer, partikel, marker, flash, hujan ----------
  const tracerGeo = webglOK ? new THREE.BufferGeometry() : null;
  const tracerPos = webglOK ? new Float32Array(3 * 2 * 64) : null;
  if (webglOK) {
    tracerGeo.setAttribute('position', new THREE.BufferAttribute(tracerPos, 3));
    const tracers = new THREE.LineSegments(tracerGeo, new THREE.LineBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.9 }));
    tracers.frustumCulled = false;
    scene.add(tracers);
  }
  const MAX_PART = 300;
  const partGeo = webglOK ? new THREE.BufferGeometry() : null;
  const partPos = webglOK ? new Float32Array(MAX_PART * 3) : null;
  const partCol = webglOK ? new Float32Array(MAX_PART * 3) : null;
  if (webglOK) {
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    partGeo.setAttribute('color', new THREE.BufferAttribute(partCol, 3));
    const points = new THREE.Points(partGeo, new THREE.PointsMaterial({ size: 0.6, vertexColors: true, transparent: true, opacity: 0.95 }));
    points.frustumCulled = false;
    scene.add(points);
  }
  const markerMat = webglOK ? new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, side: THREE.DoubleSide }) : null;
  const markerRing = webglOK ? new THREE.Mesh(new THREE.RingGeometry(1.4, 1.9, 32), markerMat) : null;
  if (webglOK) {
    markerRing.rotation.x = -Math.PI / 2;
    markerRing.position.y = 0.1;
    scene.add(markerRing);
  }
  if (webglOK) {
    for (const s of SHOP_DEFS) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(1.6, 2.1, 32),
        new THREE.MeshBasicMaterial({ color: 0x7dff8a, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(s.x, 0.1, s.z);
      scene.add(ring);
      putBox(scene, s.x, 1.2, s.z, 0.5, 2.4, 0.5, basic(0x7dff8a));
    }
  }
  const flashLight = webglOK ? new THREE.PointLight(0xffd23f, 0, 18) : null;
  const flashSprite = webglOK ? new THREE.Sprite(new THREE.SpriteMaterial({ map: getGlowTex(), color: 0xffe9a8, transparent: true, opacity: 0.98, blending: THREE.AdditiveBlending, depthWrite: false })) : null;
  if (webglOK) {
    scene.add(flashLight);
    flashSprite.scale.set(0.6, 0.6, 1);
    flashSprite.visible = false;
    scene.add(flashSprite);
  }
  const flashBeam = webglOK ? new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false })) : null;
  if (webglOK) {
    flashBeam.visible = false;
    scene.add(flashBeam);
  }
  const RAIN_COUNT = 700;
  const rainGeo = webglOK ? new THREE.BufferGeometry() : null;
  let rain = null;
  if (webglOK) {
    const pos = new Float32Array(RAIN_COUNT * 2 * 3);
    let rs = 1234567;
    const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
    for (let i = 0; i < RAIN_COUNT; i += 1) {
      const x = (rnd() - 0.5) * 80;
      const y = rnd() * 28;
      const z = (rnd() - 0.5) * 80;
      pos.set([x, y, z, x, y - 1.7, z], i * 6);
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x8fa8cc, transparent: true, opacity: 0.65 }));
    rain.frustumCulled = false;
    rain.visible = false;
    scene.add(rain);
  }

  // ---------- kamera ----------
  const camPos = webglOK ? new THREE.Vector3(0, 40, 90) : null;
  const camLook = webglOK ? new THREE.Vector3(0, 0, 0) : null;
  let camInit = false;
  const raycaster = webglOK ? new THREE.Raycaster() : null;
  const ndc = webglOK ? new THREE.Vector2() : null;

  function resize() {
    if (!webglOK) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (webglOK) {
    resize();
    window.addEventListener('resize', resize);
  }

  // Warna langit + cahaya menurut jam game. Semua shot memakai malam.
  function applyTimeOfDay(clock) {
    const hour = clock / 60;
    let top; let mid; let bot; let fog; let amb; let sunI; let sunC; let sunDir; let sunAmt;
    if (hour >= 17 && hour < 19) {
      top = 0x1a1440; mid = 0x8a3a5a; bot = 0xc86a4a; fog = 0x2a1a30;
      amb = 0.7; sunI = 0.8; sunC = 0xff9a6a;
      sunDir = new THREE.Vector3(-0.75, 0.22, -0.15).normalize(); sunAmt = 0.8;
    } else if (hour >= 19 || hour < 6) {
      top = 0x05060f; mid = 0x131a3a; bot = 0x3d1f52; fog = 0x0b0e1a;
      amb = 0.62; sunI = 0.42; sunC = 0x9fb4ff;
      sunDir = new THREE.Vector3(0.3, 0.6, -0.4).normalize(); sunAmt = 0.25;
    } else {
      top = 0x3a6fd8; mid = 0x9fc8e8; bot = 0xe8d8b0; fog = 0xa8c8d8;
      amb = 0.95; sunI = 1.25; sunC = 0xfff2d0;
      sunDir = new THREE.Vector3(0.3, 0.85, 0.25).normalize(); sunAmt = 0.7;
    }
    skyUniforms.uTop.value.setHex(top);
    skyUniforms.uMid.value.setHex(mid);
    skyUniforms.uBot.value.setHex(bot);
    skyUniforms.uSunDir.value.copy(sunDir);
    skyUniforms.uSunAmt.value = sunAmt;
    scene.fog.color.setHex(fog);
    ambient.intensity = amb;
    moon.intensity = sunI;
    moon.color.setHex(sunC);
    moon.position.copy(sunDir).multiplyScalar(100);
  }

  function draw(G) {
    if (!webglOK) return;
    buildCity(G);
    const t = G.time;
    applyTimeOfDay(G.clock);
    if (scene.userData.heroLight) {
      scene.userData.heroLight.position.set(G.player.x, 6, G.player.z);
    }
    if (rain) {
      rain.visible = !!G.rain;
      if (G.rain) rain.position.set(G.player.x, -((G.time * 22) % 1.2), G.player.z);
    }
    if (shellMesh && G.shells) {
      G.shells.forEach((s, i) => {
        dummy.position.set(s.x, 0.4, s.z);
        dummy.scale.setScalar(s.taken ? 0.001 : 1);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        shellMesh.setMatrixAt(i, dummy.matrix);
      });
      shellMesh.instanceMatrix.needsUpdate = true;
    }
    syncCars(G, t);
    syncPeople(G, t);
    const p = G.player;
    playerGroup.visible = p.onFoot;
    if (p.onFoot) {
      playerGroup.position.set(p.x, 0, p.z);
      playerGroup.rotation.y = p.angle;
    }
    // Helikopter + sorot.
    if (G.heli) {
      const h = G.heli;
      heliGroup.visible = true;
      heliGroup.position.set(h.x, h.y, h.z);
      heliGroup.rotation.y = h.angle;
      heliRotor.rotation.y = h.rotor;
      heliBlink.material.color.setHex(Math.floor(t * 2) % 2 === 0 ? 0xff1a1a : 0x441111);
      spotCone.visible = true;
      spotCircle.visible = true;
      spotLight.visible = true;
      const dx = h.x - p.x;
      const dz = h.z - p.z;
      const dist = Math.hypot(dx, h.y, dz);
      spotCone.position.set((h.x + p.x) / 2, h.y / 2, (h.z + p.z) / 2);
      spotCone.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx / dist, h.y / dist, dz / dist),
      );
      spotCone.scale.set(0.22, Math.max(0.6, dist / 14), 0.22);
      spotCircle.position.set(p.x, 0.09, p.z);
      spotCircle.scale.set(0.45, 0.45, 1);
      spotLight.position.set(h.x, h.y - 0.5, h.z);
      spotTarget.position.set(p.x, 0, p.z);
    } else {
      heliGroup.visible = false;
      spotCone.visible = false;
      spotCircle.visible = false;
      spotLight.visible = false;
    }
    // Muzzle flash.
    if (G.muzzleFlash > 0 && p.onFoot) {
      const fx = p.x + Math.sin(p.aimAngle) * 1.4;
      const fz = p.z + Math.cos(p.aimAngle) * 1.4;
      flashLight.position.set(fx, 1.6, fz);
      flashLight.intensity = 3;
      flashSprite.position.set(fx, 1.6, fz);
      flashSprite.scale.set(2.6, 2.6, 1);
      flashSprite.visible = true;
      if (G.flashTarget) {
        const tx = G.flashTarget.x;
        const tz = G.flashTarget.z;
        const len = Math.hypot(tx - fx, tz - fz);
        flashBeam.visible = true;
        flashBeam.position.set((fx + tx) / 2, 1.4, (fz + tz) / 2);
        flashBeam.scale.set(0.09, 0.09, Math.max(0.5, len));
        flashBeam.lookAt(tx, 1.4, tz);
      } else {
        flashBeam.visible = false;
      }
    } else {
      flashLight.intensity = 0;
      flashSprite.visible = false;
      flashBeam.visible = false;
    }
    // Tracer peluru.
    let n = 0;
    for (const b of G.bullets) {
      if (n >= 64) break;
      tracerPos[n * 6] = b.px ?? b.x;
      tracerPos[n * 6 + 1] = 1.2;
      tracerPos[n * 6 + 2] = b.pz ?? b.z;
      tracerPos[n * 6 + 3] = b.x;
      tracerPos[n * 6 + 4] = 1.2;
      tracerPos[n * 6 + 5] = b.z;
      n += 1;
    }
    tracerGeo.setDrawRange(0, n * 2);
    tracerGeo.attributes.position.needsUpdate = true;
    // Partikel.
    const pc = new THREE.Color();
    let pn = 0;
    for (const pt of G.particles) {
      if (pn >= MAX_PART) break;
      partPos[pn * 3] = pt.x;
      partPos[pn * 3 + 1] = 0.8 + (1 - pt.life / pt.max) * 1.5;
      partPos[pn * 3 + 2] = pt.z;
      pc.setHex(pt.color);
      partCol[pn * 3] = pc.r;
      partCol[pn * 3 + 1] = pc.g;
      partCol[pn * 3 + 2] = pc.b;
      pn += 1;
    }
    partGeo.setDrawRange(0, pn);
    partGeo.attributes.position.needsUpdate = true;
    partGeo.attributes.color.needsUpdate = true;
    // Marker objektif misi.
    let markerAt = null;
    const m = G.mission;
    if (m.started && m.index >= 0) {
      const step = G.missionDefs[m.index].steps[m.step];
      if (step && step.x !== undefined) markerAt = { x: step.x, z: step.z, color: 0xffd23f };
      if (step && step.type === 'route') {
        const pt = step.points[m.routeIndex];
        if (pt) markerAt = { x: pt.x, z: pt.z, color: 0xffd23f };
      }
      if (step && step.type === 'tail' && m.tail) {
        markerAt = { x: m.tail.vehicle.x, z: m.tail.vehicle.z, color: 0xff4f4f };
      }
      if (step && step.type === 'race' && m.race) {
        const cp = m.race.checkpoints[m.race.next];
        if (cp) markerAt = { x: cp.x, z: cp.z, color: 0x7dff8a };
      }
    }
    if (m.taxi) markerAt = { x: m.taxi.px, z: m.taxi.pz, color: 0xffd23f };
    if (markerAt) {
      markerRing.visible = true;
      markerRing.position.x = markerAt.x;
      markerRing.position.z = markerAt.z;
      markerRing.material.color.setHex(markerAt.color);
      const s = 1 + Math.sin(t * 4) * 0.15;
      markerRing.scale.set(s, s, 1);
    } else {
      markerRing.visible = false;
    }
    // ---------- kamera: chase rendah + dekat ----------
    if (G.shotCam) {
      camPos.set(G.shotCam.px, G.shotCam.py, G.shotCam.pz);
      camLook.set(G.shotCam.lx, G.shotCam.ly, G.shotCam.lz);
      camInit = false;
    } else if (G.screen === 'title') {
      if (G.titleFixed) {
        camPos.set(9.5, 2.3, 29.5);
        camLook.set(7.5, 1.4, 22);
      } else {
        const a = t * 0.05;
        camPos.set(Math.sin(a) * 85, 38 + Math.sin(t * 0.1) * 4, Math.cos(a) * 85);
        camLook.set(0, 8, 0);
      }
      camInit = false;
    } else {
      const inCar = !p.onFoot;
      const back = inCar ? 7.4 : 5.6;
      const up = inCar ? 2.7 : 2.5;
      const tx = p.x - Math.sin(p.angle) * back;
      const tz = p.z - Math.cos(p.angle) * back;
      if (!camInit) {
        camPos.set(tx, up, tz);
        camInit = true;
      }
      const k = 1 - Math.exp(-(1 / 60) * 3.2);
      camPos.x += (tx - camPos.x) * k;
      camPos.y += (up - camPos.y) * k;
      camPos.z += (tz - camPos.z) * k;
      camLook.set(p.x + Math.sin(p.angle) * 8, 1.5, p.z + Math.cos(p.angle) * 8);
    }
    const shx = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.3 : 0;
    const shy = G.shake > 0 ? (Math.random() - 0.5) * G.shake * 0.3 : 0;
    camera.position.set(camPos.x + shx, camPos.y + shy, camPos.z);
    camera.lookAt(camLook);
    renderer.render(scene, camera);
    // Titik bidik mouse di tanah (y=0).
    if (G.input) {
      ndc.set((G.input.mouse.x / G.viewW) * 2 - 1, -(G.input.mouse.y / G.viewH) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      if (Math.abs(d.y) > 0.001) {
        const tt = -o.y / d.y;
        if (tt > 0) G.aimPoint = { x: o.x + d.x * tt, z: o.z + d.z * tt };
      }
    }
  }

  return {
    draw,
    resize,
    snapCamera() { camInit = false; },
    get webglOK() { return webglOK; },
    _scene: scene,
  };
}
