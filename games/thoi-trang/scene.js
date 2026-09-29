// scene.js — phông cảnh 3D: tiệm thời trang màu phấn (tường sọc, rèm, giá treo đồ, cờ đuôi nheo, bục tròn xoay)
// và sàn diễn thời trang (đường băng, đèn sân khấu, đèn flash của khán giả).

import { THREE, toon, canvasTexture, skyTexture } from '../../kit/three-kit.js';
import { TAU, mesh, lathe } from './geo.js';
import { drawStar, drawHeart } from './mats.js';

const basic = (o) => new THREE.MeshBasicMaterial(o);

function wallTexture() {
  const t = canvasTexture(512, 512, (g, w, h) => {
    const band = h * 0.2;
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#FFE9F2' : '#FFD9E8'; g.fillRect(i * w / 8, 0, w / 8, h - band); }
    g.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < 4; i++) { drawStar(g, (i + 0.5) * w / 4, h * 0.18 + (i % 2) * h * 0.22, 9, 4, 0.4); drawHeart(g, (i + 0.25) * w / 4 + 30, h * 0.5 + (i % 2) * h * 0.1, 10); }
    g.fillStyle = '#FFF6FA'; g.fillRect(0, h - band, w, band);
    g.fillStyle = '#F7C2D7'; g.fillRect(0, h - band, w, 10);
    g.strokeStyle = '#F7C2D7'; g.lineWidth = 5;
    for (let i = 0; i < 2; i++) g.strokeRect(i * w / 2 + 24, h - band + 26, w / 2 - 48, band - 46);
  });
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(5, 1); return t;
}
function floorTexture() {
  const t = canvasTexture(256, 256, (g, w, h) => {
    g.fillStyle = '#FFE4CC'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#F2CBA8'; g.lineWidth = 3;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, i * h / 4); g.lineTo(w, i * h / 4); g.stroke(); const x = (i % 2 ? 0.3 : 0.75) * w; g.beginPath(); g.moveTo(x, i * h / 4); g.lineTo(x, (i + 1) * h / 4); g.stroke(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 6); return t;
}
function rugTexture() {
  return canvasTexture(512, 512, (g, w) => {
    const c = w / 2, cols = ['#FFC2DA', '#FFFFFF', '#D8C2FF', '#FFFFFF', '#BFF0E0', '#FFFFFF', '#FFD9A8'];
    cols.forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, c * (1 - i * 0.13), 0, TAU); g.fill(); });
    g.fillStyle = '#FF9EC4';
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16; g.beginPath(); g.arc(c + Math.cos(a) * c * 0.93, c + Math.sin(a) * c * 0.93, 9, 0, TAU); g.fill(); }
  });
}
function podTexture() {
  return canvasTexture(512, 512, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#FFF3F8'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    g.strokeStyle = '#FFC2DA'; g.lineWidth = 12; g.beginPath(); g.arc(c, c, c * 0.86, 0, TAU); g.stroke();
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10; g.fillStyle = i % 2 ? '#FFD34D' : '#FF9EC4'; drawStar(g, c + Math.cos(a) * c * 0.7, c + Math.sin(a) * c * 0.7, 26, 5, 0.45); }
  });
}
function backdropTexture() {
  return canvasTexture(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2B1846'); gr.addColorStop(1, '#6B2F78'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,${200 + (i * 7) % 55},${220 + (i * 3) % 35},${0.35 + (i % 5) * 0.12})`; drawStar(g, (i * 137) % w, (i * 89) % (h * 0.8), 3 + (i % 4) * 2.5, 4, 0.4); }
    // khung cổng sân khấu hình vòm với bóng đèn
    g.strokeStyle = '#FF9EC4'; g.lineWidth = 16; g.beginPath(); g.moveTo(w * 0.36, h); g.lineTo(w * 0.36, h * 0.42); g.arc(w / 2, h * 0.42, w * 0.14, Math.PI, 0); g.lineTo(w * 0.64, h); g.stroke();
    g.fillStyle = '#FFF2A8';
    for (let i = 0; i <= 16; i++) { const a = Math.PI + i * Math.PI / 16; g.beginPath(); g.arc(w / 2 + Math.cos(a) * w * 0.14, h * 0.42 + Math.sin(a) * w * 0.14, 7, 0, TAU); g.fill(); }
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(w * 0.36, h * 0.48 + i * h * 0.09, 7, 0, TAU); g.arc(w * 0.64, h * 0.48 + i * h * 0.09, 7, 0, TAU); g.fill(); }
    g.fillStyle = '#FFD34D'; drawStar(g, w / 2, h * 0.3, 40, 5, 0.45);
  });
}

// Giá treo đồ: thanh ngang, hai chân, móc áo và những chiếc váy nhỏ
function rack(M, flip) {
  const g = new THREE.Group(), gold = M.c('#E9C46A'), pole = new THREE.CylinderGeometry(0.06, 0.06, 4.2, 12);
  [-1.5, 1.5].forEach(x => { g.add(mesh(pole, gold, x, 2.1, 0)); const f = mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.1, 20), gold, x, 0.05, 0); g.add(f); });
  const bar = mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.3, 12), gold, 0, 4.1, 0); bar.rotation.z = Math.PI / 2; g.add(bar);
  const cols = flip ? [['#BFF0E0', '#FFFFFF'], ['#FFD34D', '#FFFFFF'], ['#C9A7F5', '#FFFFFF'], ['#FF9EC4', '#FFFFFF']] : [['#FF9EC4', '#FFFFFF'], ['#7FC4FF', '#FFFFFF'], ['#FFB27A', '#FFFFFF'], ['#C9A7F5', '#FFFFFF']];
  const dressGeo = lathe([[0.5, -1.6], [0.46, -1.5], [0.3, -0.9], [0.2, -0.55], [0.22, -0.2], [0.14, -0.05]], { n: 16, seg: 24, phiStart: 0 });
  const hookGeo = new THREE.TorusGeometry(0.08, 0.018, 6, 12, Math.PI * 1.4), hanger = new THREE.TorusGeometry(0.28, 0.02, 6, 16, Math.PI);
  cols.forEach(([a, b], i) => {
    const x = -1.1 + i * 0.73, d = new THREE.Group(); d.position.set(x, 4.1, 0); d.rotation.y = 0.5;
    const hk = mesh(hookGeo, gold, 0, 0.02, 0); hk.rotation.z = -0.5; d.add(hk);
    const hg = mesh(hanger, gold, 0, -0.26, 0); hg.scale.y = 0.5; d.add(hg);
    const dress = mesh(dressGeo, M.p(i % 2 ? 'stripes' : 'dots', a, b, null, 4, 2)); dress.scale.set(1, 1, 0.55); d.add(dress);
    g.add(d);
  });
  return g;
}

// Rèm cửa xếp nếp
function curtain(M, x) {
  const geo = new THREE.PlaneGeometry(3.4, 13, 48, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 6.5) * 0.16);
  geo.computeVertexNormals();
  const g = new THREE.Group(); g.position.set(x, 0, -5.6);
  const c = mesh(geo, M.c('#FF9EC4', 2), 0, 6.3, 0); c.castShadow = false; g.add(c);
  const tie = mesh(new THREE.TorusGeometry(0.9, 0.12, 10, 24), M.c('#FFD34D'), 0, 3.2, 0.3); tie.scale.set(1, 0.35, 1); g.add(tie);
  return g;
}

// Dây cờ đuôi nheo
function bunting(M) {
  const g = new THREE.Group(), cols = ['#FF7FAA', '#FFD34D', '#7FDCC4', '#B48BF0', '#7FC4FF'];
  const tri = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.32, 0, 0), new THREE.Vector3(0.32, 0, 0), new THREE.Vector3(0, -0.62, 0)]);
  tri.computeVertexNormals();
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 17; i++) {
      const x = -12 + i * 1.5, y = 7.6 + row * 1.6 - 0.9 * Math.cos((x / 12) * Math.PI / 2 * 1.4) * 0.8;
      const f = new THREE.Mesh(tri, basic({ color: cols[(i + row) % cols.length], side: THREE.DoubleSide })); f.position.set(x, y, -6.6 + row * 0.1); g.add(f);
    }
  }
  return g;
}

export function createBoutique(stage, M) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(56, 20), basic({ map: wallTexture() })); wall.position.set(0, 9.5, -7); g.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(56, 30), toon('#FFFFFF', { map: floorTexture() })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.36, 7); floor.receiveShadow = true; g.add(floor);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(3.3, 64), toon('#FFFFFF', { map: rugTexture() })); rug.rotation.x = -Math.PI / 2; rug.position.y = -0.35; rug.receiveShadow = true; g.add(rug);
  // bục tròn
  const ped = new THREE.Group(); g.add(ped);
  const base = mesh(new THREE.CylinderGeometry(1.55, 1.68, 0.34, 64), toon('#FFE3EE'), 0, -0.18, 0); base.receiveShadow = true; ped.add(base);
  const top = new THREE.Mesh(new THREE.CircleGeometry(1.5, 64), toon('#FFFFFF', { map: podTexture() })); top.rotation.x = -Math.PI / 2; top.position.y = 0.003; top.receiveShadow = true; ped.add(top);
  const rim = mesh(new THREE.TorusGeometry(1.53, 0.055, 10, 72), M.c('#FFD34D'), 0, 0, 0); rim.rotation.x = Math.PI / 2; ped.add(rim);
  const rim2 = mesh(new THREE.TorusGeometry(1.67, 0.05, 10, 72), M.c('#FF9EC4'), 0, -0.33, 0); rim2.rotation.x = Math.PI / 2; ped.add(rim2);
  const r1 = rack(M, false); r1.position.set(-4.3, -0.35, -3.6); r1.rotation.y = 0.35; g.add(r1);
  const r2 = rack(M, true); r2.position.set(4.3, -0.35, -3.6); r2.rotation.y = -0.35; g.add(r2);
  g.add(curtain(M, -9.5), curtain(M, 9.5), bunting(M));
  // chậu cây tròn xinh
  [-6.6, 6.6].forEach(x => {
    const pot = mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.8, 20), M.c('#FFFFFF'), x, 0.05, -1.5); g.add(pot);
    const bush = mesh(new THREE.SphereGeometry(0.85, 20, 16), M.c('#8FE3A6'), x, 1.1, -1.5); g.add(bush);
    [0, 1, 2].forEach(i => g.add(mesh(new THREE.SphereGeometry(0.12, 10, 8), M.c(['#FF7FAA', '#FFD34D', '#FFFFFF'][i]), x + Math.cos(i * 2.1) * 0.6, 1.3 + (i % 2) * 0.3, -1.5 + Math.sin(i * 2.1) * 0.6 + 0.3)));
  });
  const sky = skyTexture('#FFE3EE', '#FFF3E6');
  return {
    group: g, pedestal: ped, sky,
    setGold(on) { base.material.color.set(on ? '#FFE9A8' : '#FFE3EE'); rim2.material = M.c(on ? '#FFC53D' : '#FF9EC4'); },
    update(dt) { top.rotation.z += dt * 0.25; rug.rotation.z -= dt * 0.05; },
    dispose() { sky.dispose(); },
  };
}

export function createRunway(M) {
  const g = new THREE.Group(); g.visible = false;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(48, 24), basic({ map: backdropTexture() })); back.position.set(0, 7, -11); g.add(back);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), toon('#4A2A66')); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.4; floor.receiveShadow = true; g.add(floor);
  const walkTex = canvasTexture(64, 512, (c, w, h) => { c.fillStyle = '#FF9EC4'; c.fillRect(0, 0, w, h); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 16; i++) c.fillRect(w * 0.44, i * h / 16, w * 0.12, h / 32); });
  const walk = mesh(new THREE.BoxGeometry(3.2, 0.4, 16), toon('#FFFFFF', { map: walkTex }), 0, -0.2, -2.5); walk.receiveShadow = true; g.add(walk);
  // bóng đèn hai bên đường băng — hai nhóm bật tắt so le
  const bulbGeo = new THREE.SphereGeometry(0.09, 10, 8), dummy = new THREE.Object3D();
  const bulbs = [0, 1].map(k => {
    const im = new THREE.InstancedMesh(bulbGeo, basic({ color: k ? '#FFF2A8' : '#FF9EC4' }), 40);
    let n = 0;
    for (let i = 0; i < 20; i++) for (const s of [-1, 1]) { if ((i + (s > 0 ? 1 : 0)) % 2 !== k) continue; dummy.position.set(s * 1.62, 0.02, -10 + i * 0.8); dummy.updateMatrix(); im.setMatrixAt(n++, dummy.matrix); }
    im.count = n; g.add(im); return im;
  });
  // cột đèn sân khấu (hình nón phát sáng)
  const coneGeo = new THREE.ConeGeometry(2.1, 10, 32, 1, true); coneGeo.translate(0, -5, 0);
  const beams = ['#FFB8D6', '#FFF2A8', '#A8D8FF'].map((c, i) => {
    const m = new THREE.Mesh(coneGeo, basic({ color: c, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set((i - 1) * 3.2, 9.5, -1 - i); g.add(m); return m;
  });
  // đèn flash của khán giả
  const flashTex = canvasTexture(64, 64, (c, w) => { const gr = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,250,220,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); });
  const flashes = [];
  for (let i = 0; i < 14; i++) {
    const s = i % 2 ? 1 : -1, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(s * (3 + (i * 0.37) % 2.5), 0.6 + (i * 0.53) % 2.2, -8 + (i * 1.13) % 11); m.scale.setScalar(1.2); g.add(m); flashes.push(m);
  }
  // khán giả: những cái đầu tròn nhỏ hai bên
  const fan = new THREE.SphereGeometry(0.45, 16, 12), fanCols = ['#FFB8D6', '#C9A7F5', '#A8D8FF', '#FFD9A8', '#BFF0E0'];
  for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, z = -8 + Math.floor(i / 2) * 1.5; g.add(mesh(fan, M.c(fanCols[i % 5]), s * (3.2 + (i % 3) * 0.5), 0.1, z)); }
  const sky = skyTexture('#2B1846', '#5B2A6E');
  let flashT = 0, lit = false, blink = 0;
  return {
    group: g, sky,
    flashing: false,
    update(dt, t) {
      for (let i = 0; i < beams.length; i++) { beams[i].rotation.z = Math.sin(t * 0.9 + i * 2) * 0.28; beams[i].rotation.x = Math.cos(t * 0.7 + i) * 0.15; }
      blink += dt; if (blink > 0.35) { blink = 0; lit = !lit; bulbs[0].visible = lit; bulbs[1].visible = !lit; }
      for (let i = 0; i < flashes.length; i++) { const m = flashes[i].material; if (m.opacity > 0) m.opacity = Math.max(0, m.opacity - dt * 3.5); }
      if (this.flashing && (flashT -= dt) <= 0) { flashT = 0.12 + Math.random() * 0.25; flashes[(Math.random() * flashes.length) | 0].material.opacity = 1; }
    },
    burst() { flashes.forEach(f => { f.material.opacity = 0.6 + Math.random() * 0.4; }); },
    dispose() { sky.dispose(); flashes.forEach(f => f.material.dispose()); flashTex.dispose(); },
  };
}
