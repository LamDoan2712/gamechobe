// hub/models.js — mô hình 3D nhỏ đại diện cho từng game trên vòng quay của cổng game

import { THREE, toon, canvasTexture, RoundedBoxGeometry } from '../kit/three-kit.js';

const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };
const put = (parent, child) => { parent.add(child); return child; };
const WHITE = toon('#FFFFFF'), GOLD = toon('#FFC53D'), DARK = toon('#3B2340');

function dotsTexture(bg, dot) {
  const t = canvasTexture(128, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = dot;
    [[32, 32], [96, 96], [96, 32], [32, 96]].forEach(([x, y], i) => { if (i < 2) { g.beginPath(); g.arc(x, y, 13, 0, Math.PI * 2); g.fill(); } });
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3); return t;
}

// Gương trang điểm + son + phấn má
function makeup() {
  const g = new THREE.Group();
  const pink = toon('#FF8FB8');
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.14, 28), pink, 0, 0.07, -0.2));
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12), pink, 0, 0.35, -0.2));
  const frame = new THREE.Group(); frame.position.set(0, 1.25, -0.2); g.add(frame);
  frame.add(mesh(new THREE.TorusGeometry(0.72, 0.11, 16, 48), pink));
  frame.add(mesh(new THREE.CircleGeometry(0.66, 40), toon('#DDF1FF', { emissive: '#8FC8F0', emissiveIntensity: 0.25 }), 0, 0, -0.01));
  const bulb = toon('#FFF2A8', { emissive: '#FFE27A', emissiveIntensity: 0.8 });
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; frame.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), bulb, Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.1)); }
  put(frame, mesh(new THREE.SphereGeometry(0.2, 16, 12), toon('#FFFFFF', { transparent: true, opacity: 0.35 }), -0.28, 0.25, 0.02)).scale.set(1, 1.8, 0.1);
  const lip = new THREE.Group(); lip.position.set(0.82, 0, 0.35); lip.rotation.z = -0.15; g.add(lip);
  lip.add(mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.42, 20), GOLD, 0, 0.21, 0));
  lip.add(mesh(new THREE.CapsuleGeometry(0.12, 0.28, 6, 16), toon('#F0404E'), 0, 0.62, 0));
  const compact = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.12, 28), toon('#C9A7F5'), -0.8, 0.06, 0.35); g.add(compact);
  compact.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24), toon('#FF9EC4'), 0, 0.07, 0));
  return g;
}

// Tháp bánh kem 3 tầng + chú hamster
function cake() {
  const g = new THREE.Group();
  const layers = [[0.85, '#FFB3CF', '#FFFFFF'], [0.68, '#8A5536', '#FFE3EE'], [0.52, '#FFE9B8', '#FF9EC4']];
  let y = 0;
  layers.forEach(([r, body, cream]) => {
    g.add(mesh(new THREE.CylinderGeometry(r, r, 0.34, 32), toon(body), 0, y + 0.17, 0));
    g.add(mesh(new THREE.CylinderGeometry(r + 0.04, r + 0.04, 0.08, 32), toon(cream), 0, y + 0.36, 0));
    const dm = toon(cream);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; put(g, mesh(new THREE.SphereGeometry(0.07, 10, 8), dm, Math.cos(a) * (r + 0.03), y + 0.3, Math.sin(a) * (r + 0.03))).scale.set(1, 1.6, 1); }
    y += 0.4;
  });
  g.add(mesh(new THREE.SphereGeometry(0.1, 14, 12), toon('#F0404E'), 0.28, y + 0.08, 0.18));
  // hamster
  const h = new THREE.Group(); h.position.set(-0.05, y, 0.05); g.add(h);
  const fur = toon('#F5A65B'), cream2 = toon('#FFF1D6');
  put(h, mesh(new THREE.SphereGeometry(0.34, 24, 18), fur, 0, 0.32, 0)).scale.set(1, 0.95, 0.95);
  put(h, mesh(new THREE.SphereGeometry(0.24, 20, 14), cream2, 0, 0.26, 0.16)).scale.set(1, 0.9, 0.7);
  [-1, 1].forEach(s => {
    put(h, mesh(new THREE.SphereGeometry(0.1, 12, 10), fur, s * 0.2, 0.6, -0.02)).scale.set(1, 1, 0.5);
    h.add(mesh(new THREE.SphereGeometry(0.055, 10, 8), DARK, s * 0.12, 0.4, 0.3));
    h.add(mesh(new THREE.SphereGeometry(0.02, 8, 6), WHITE, s * 0.12 + 0.015, 0.42, 0.35));
    put(h, mesh(new THREE.SphereGeometry(0.08, 12, 10), toon('#FFB0C4'), s * 0.2, 0.3, 0.26)).scale.set(1, 0.7, 0.5);
  });
  h.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), toon('#FF7FAA'), 0, 0.34, 0.33));
  return g;
}

// Máy sấy, kéo, lược
function hair() {
  const g = new THREE.Group();
  const body = toon('#7FC4FF'), pink = toon('#FF9EC4');
  const dryer = new THREE.Group(); dryer.position.set(-0.15, 1.1, 0); dryer.rotation.z = 0.12; g.add(dryer);
  put(dryer, mesh(new THREE.CapsuleGeometry(0.3, 0.55, 8, 20), body)).rotation.z = Math.PI / 2;
  put(dryer, mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.3, 20), body, 0.55, 0, 0)).rotation.z = Math.PI / 2;
  put(dryer, mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 20), toon('#DFF3FF'), -0.58, 0, 0)).rotation.z = Math.PI / 2;
  put(dryer, mesh(new THREE.CapsuleGeometry(0.12, 0.55, 6, 12), pink, -0.1, -0.5, 0)).rotation.z = 0.15;
  const puff = toon('#FFFFFF', { transparent: true, opacity: 0.8 });
  [[0.95, 0.05, 0.14], [1.2, 0.15, 0.1], [1.4, 0.0, 0.08]].forEach(([x, y, r]) => dryer.add(mesh(new THREE.SphereGeometry(r, 12, 10), puff, x, y, 0)));
  const sc = new THREE.Group(); sc.position.set(0.7, 0.12, 0.45); sc.rotation.x = -Math.PI / 2; g.add(sc);
  const metal = toon('#D9E4F0');
  [-0.35, 0.35].forEach((a, i) => {
    const blade = mesh(new THREE.BoxGeometry(0.08, 0.7, 0.04), metal, 0, 0.25, 0); blade.rotation.z = a; sc.add(blade);
    sc.add(mesh(new THREE.TorusGeometry(0.13, 0.045, 10, 24), i ? pink : body, (i ? 1 : -1) * 0.2, -0.2, 0));
  });
  const comb = mesh(new RoundedBoxGeometry(0.9, 0.14, 0.08, 3, 0.04), toon('#FFC53D'), -0.7, 0.07, 0.5); comb.rotation.x = -Math.PI / 2; comb.rotation.z = 0.4; g.add(comb);
  for (let i = 0; i < 9; i++) comb.add(mesh(new THREE.BoxGeometry(0.04, 0.2, 0.06), toon('#FFC53D'), -0.38 + i * 0.095, -0.15, 0));
  return g;
}

// Chiếc váy chấm bi trên ma-nơ-canh + mũ + giày
function dress() {
  const g = new THREE.Group();
  const pts = [[0, 0], [0.78, 0], [0.8, 0.06], [0.62, 0.4], [0.34, 0.78], [0.26, 0.95], [0.3, 1.15], [0.28, 1.3], [0.14, 1.4], [0, 1.4]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 10), toon('#C9A7F5'), 0, 0.22, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.08, 24), toon('#C9A7F5'), 0, 0.04, 0));
  const d = mesh(new THREE.LatheGeometry(pts, 40), toon('#B48BF0', { map: dotsTexture('#B48BF0', '#FFFFFF') }), 0, 0.4, 0); g.add(d);
  put(g, mesh(new THREE.TorusGeometry(0.27, 0.05, 10, 30), toon('#FF7FAA'), 0, 1.33, 0)).rotation.x = Math.PI / 2;
  const bow = new THREE.Group(); bow.position.set(0, 1.36, 0.28); g.add(bow);
  [-1, 1].forEach(s => put(bow, mesh(new THREE.ConeGeometry(0.1, 0.2, 12), toon('#FF7FAA'), s * 0.1, 0, 0)).rotation.z = s * Math.PI / 2);
  g.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), toon('#FFE2CF'), 0, 1.9, 0));
  const hat = new THREE.Group(); hat.position.set(0.8, 1.35, 0.2); hat.rotation.z = -0.3; g.add(hat);
  hat.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.04, 32), toon('#FFE9B8')));
  hat.add(mesh(new THREE.SphereGeometry(0.28, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon('#FFE9B8')));
  hat.add(mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.08, 24), toon('#FF7FAA'), 0, 0.05, 0));
  const shoe = mesh(new THREE.SphereGeometry(0.2, 16, 12), toon('#FF5C9A'), -0.75, 0.1, 0.4); shoe.scale.set(1.6, 0.6, 0.9); g.add(shoe);
  g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.22, 8), toon('#FF5C9A'), -0.98, 0.1, 0.4));
  return g;
}

// Nồi canh bốc khói trên bếp nhỏ + mũ đầu bếp
function cooking() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.3, 32), toon('#5A5360'), 0, 0.15, 0));
  const ring = put(g, mesh(new THREE.TorusGeometry(0.5, 0.05, 8, 24), toon('#3B3740'), 0, 0.32, 0)); ring.rotation.x = Math.PI / 2;
  const flame = toon('#5AA9F2', { emissive: '#3E7BFF', emissiveIntensity: 0.6 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; put(g, mesh(new THREE.ConeGeometry(0.06, 0.18, 8), flame, Math.cos(a) * 0.45, 0.4, Math.sin(a) * 0.45)); }
  const potM = toon('#FF9A5C');
  g.add(mesh(new THREE.CylinderGeometry(0.62, 0.55, 0.62, 32), potM, 0, 0.72, 0));
  const rim = put(g, mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 32), potM, 0, 1.03, 0)); rim.rotation.x = Math.PI / 2;
  g.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.04, 32), toon('#FFD27A'), 0, 0.98, 0));
  [-1, 1].forEach(s => { const h = put(g, mesh(new THREE.TorusGeometry(0.14, 0.04, 8, 16, Math.PI), toon('#E07434'), s * 0.68, 0.9, 0)); h.rotation.set(0, 0, s * Math.PI / 2); });
  const steam = toon('#FFFFFF', { transparent: true, opacity: 0.85 });
  [[0, 1.35, 0, 0.18], [0.15, 1.65, 0.05, 0.14], [-0.1, 1.9, 0, 0.11], [0.25, 1.35, 0.1, 0.12]].forEach(([x, y, z, r]) => put(g, mesh(new THREE.SphereGeometry(r, 14, 10), steam, x, y, z)));
  const hat = new THREE.Group(); hat.position.set(-0.85, 0.05, 0.45); hat.rotation.z = 0.25; g.add(hat);
  hat.add(mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 24), WHITE, 0, 0.15, 0));
  [[0, 0.42, 0, 0.25], [-0.18, 0.36, 0, 0.18], [0.18, 0.36, 0, 0.18]].forEach(([x, y, z, r]) => hat.add(mesh(new THREE.SphereGeometry(r, 16, 12), WHITE, x, y, z)));
  return g;
}

export const MODELS = { 'trang-diem': makeup, 'banh-kem': cake, 'lam-toc': hair, 'thoi-trang': dress, 'nau-an': cooking };

// Ngôi sao 5 cánh nổi để trang trí bầu trời
export function starShape() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.2 : 0.46, a = i * Math.PI / 5 - Math.PI / 2; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
}
