// models-c.js — mô hình 3D riêng cho 3 món: Thịt kho trứng, Chè chuối, Phở bò.
// Đơn vị như models.js: mặt bếp y = 0; vật chứa có userData.profile để đặt mặt nước kho / chè / nước dùng.
// Các mảnh nhỏ lặp lại (vỏ trứng, hạt mè, trân châu, sợi phở…) dùng chung hình học hoặc InstancedMesh cho nhẹ máy.

import { THREE, RoundedBoxGeometry, canvasTexture } from '../../kit/three-kit.js';
import { mat, glossy, own } from './mats.js';
import { mesh, group } from './models.js';

const DS = THREE.DoubleSide;
const rnd = (a, b) => a + Math.random() * (b - a);
const V2 = (x, y) => new THREE.Vector2(x, y);
const lathe = (pts, material, segs = 40) => mesh(new THREE.LatheGeometry(pts.map(([x, y]) => V2(x, y)), segs), material);
// Hình học dùng chung (K.clear có dispose thì lần vẽ sau three.js tự nạp lại lên GPU)
const GEO = {};
const geo = (k, make) => GEO[k] || (GEO[k] = make());
const TEX = {};
const texOnce = (k, make) => TEX[k] || (TEX[k] = make());
const noShadow = o => { o.traverse(c => { c.castShadow = false; }); return o; };
const o3 = new THREE.Object3D(), col = new THREE.Color();

export const hemiGeo = () => geo('hemi', () => new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2));
const sphereGeo = () => geo('sphere', () => new THREE.SphereGeometry(1, 14, 10));
// Vật liệu vô hình nhưng vẫn chạm được (vùng bắt tay to hơn vật nhỏ, mặt để rắc hành…)
let HIT = null;
export const hitMat = () => HIT || (HIT = new THREE.MeshBasicMaterial({ visible: false }));

/* ═════════ THỊT KHO TRỨNG ═════════ */

// Nồi đất kho thịt: thân đất nung, miệng tráng men nâu, hai quai nhỏ
export function clayPot() {
  const g = group('clayPot');
  const clay = mat('#B8663C', 0.72), glaze = glossy('#5E2C17', 0.3), inside = mat('#6A3320', 0.4, 0, { side: DS });
  g.add(lathe([[0.001, 0], [0.52, 0], [0.58, 0.02], [0.8, 0.13], [0.95, 0.3], [1.0, 0.46], [0.985, 0.56]], clay, 44));
  g.add(lathe([[0.985, 0.56], [0.95, 0.64], [0.93, 0.68], [0.97, 0.72], [1.01, 0.76], [0.99, 0.79], [0.95, 0.79]], glaze, 44));
  g.add(lathe([[0.95, 0.79], [0.91, 0.72], [0.9, 0.66], [0.93, 0.5], [0.87, 0.32], [0.72, 0.17], [0.45, 0.085], [0.001, 0.075]], inside, 44));
  const band = mesh(geo('cpBand', () => new THREE.TorusGeometry(1.0, 0.018, 6, 56)), glossy('#7A3A1E', 0.4), 0, 0.46, 0); band.rotation.x = Math.PI / 2; g.add(band);
  [-1, 1].forEach(s => { const q = mesh(geo('cpEar', () => new THREE.TorusGeometry(0.12, 0.035, 8, 14, Math.PI)), glaze, s * 0.96, 0.66, 0); q.rotation.set(Math.PI / 2, 0, -s * Math.PI / 2); g.add(q); });
  g.userData.profile = [[0.45, 0.085], [0.72, 0.17], [0.87, 0.32], [0.93, 0.5], [0.9, 0.66], [0.91, 0.72]];
  return g;
}

// Thịt ba chỉ: nạc – mỡ – nạc – mỡ – bì. Ba trạng thái: sống, đã ướp, kho xong (màu cánh gián)
export const PORK = {
  raw: { skin: '#F2C9A0', fat: '#FFF6EE', lean: '#E97C7C', rough: 0.55 },
  mari: { skin: '#E4AA74', fat: '#F6DDB8', lean: '#CF6B5C', rough: 0.34 },
  cooked: { skin: '#9C4A16', fat: '#E8AA52', lean: '#8A3A1C', rough: 0.14 },
};
const PORKC = {};
for (const k in PORK) PORKC[k] = { skin: new THREE.Color(PORK[k].skin), fat: new THREE.Color(PORK[k].fat), lean: new THREE.Color(PORK[k].lean) };
export function porkMats(state = 'raw', dynamic = false) {
  const c = PORK[state], mk = (color, r) => (dynamic ? own(new THREE.MeshStandardMaterial({ color, roughness: r })) : glossy(color, r));
  return { skin: mk(c.skin, c.rough * 0.8), fat: mk(c.fat, c.rough), lean: mk(c.lean, c.rough + 0.1) };
}
// Đổi màu thịt dần dần (không tạo vật mới mỗi khung hình)
export function tintPork(m, from, to, t) {
  const a = PORKC[from], b = PORKC[to], r = PORK[from].rough + (PORK[to].rough - PORK[from].rough) * t;
  m.skin.color.lerpColors(a.skin, b.skin, t); m.fat.color.lerpColors(a.fat, b.fat, t); m.lean.color.lerpColors(a.lean, b.lean, t);
  m.skin.roughness = r * 0.8; m.fat.roughness = r; m.lean.roughness = r + 0.1;
}
const LAYERS = [['lean', 0.085], ['fat', 0.035], ['lean', 0.075], ['fat', 0.075], ['skin', 0.035]];
export function porkPiece(m, w = 0.32, d = 0.29) {
  const g = group('pork'); let y = 0;
  for (const [k, h] of LAYERS) {
    const hh = h + 0.012, b = mesh(geo(`pk|${w}|${d}|${h}`, () => new RoundedBoxGeometry(w, hh, d, 2, Math.min(0.04, hh / 2 - 0.002))), m[k], 0, y + h / 2, 0);
    b.scale.set(rnd(0.97, 1.03), 1, rnd(0.97, 1.03)); b.castShadow = false; g.add(b); y += h;   // miếng nhỏ nằm trong nồi: không đổ bóng cho nhẹ máy
  }
  g.userData.h = y;
  return g;
}

// Trứng luộc: lòng trắng bên trong + 12 mảnh vỏ (rơi dần khi bé bóc)
export const EGG_R = 0.27, EGG_K = 1.27;
export function peelEgg(whiteMat, withShell = true) {
  const g = group('egg');
  const white = mesh(geo('eggWhite', () => new THREE.SphereGeometry(EGG_R, 28, 18)), whiteMat); white.scale.set(1, EGG_K, 1); g.add(white);
  const shell = [];
  if (withShell) {
    const shellM = mat('#E4B784', 0.6, 0, { side: DS });
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
      const gg = geo(`eggShell${i}${j}`, () => {
        const s = new THREE.SphereGeometry(EGG_R + 0.016, 8, 5, i * Math.PI / 2 + (j % 2) * 0.7 + 0.015, Math.PI / 2 - 0.03, j * Math.PI / 3 + 0.012, Math.PI / 3 - 0.024);
        s.scale(1, EGG_K, 1); s.computeBoundingBox(); const c = s.boundingBox.getCenter(new THREE.Vector3()); s.translate(-c.x, -c.y, -c.z); s.userData.c = c;
        return s;
      });
      const p = mesh(gg, shellM); p.position.copy(gg.userData.c); p.castShadow = false; g.add(p); shell.push(p);
    }
    for (let i = shell.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [shell[i], shell[j]] = [shell[j], shell[i]]; }
  }
  g.userData.white = white; g.userData.shell = shell;
  return g;
}
// Nửa quả trứng kho bổ đôi: mặt cắt ngửa lên, lòng đỏ vàng ươm
export function eggHalf(outerMat) {
  const g = group('eggHalf');
  const dome = mesh(geo('eggHalfDome', () => new THREE.SphereGeometry(EGG_R, 24, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), outerMat); dome.scale.set(EGG_K, 1, 1); g.add(dome);
  const face = mesh(geo('eggFace', () => new THREE.CircleGeometry(EGG_R * 0.985, 28)), glossy('#FFF3DC', 0.3)); face.rotation.x = -Math.PI / 2; face.scale.set(EGG_K, 1, 1); face.position.y = 0.002; g.add(face);
  const yolk = mesh(geo('eggYolk', () => new THREE.SphereGeometry(0.135, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2)), glossy('#FFB823', 0.42)); yolk.scale.set(1.2, 0.32, 1); yolk.position.y = 0.003; g.add(yolk);
  return noShadow(g);
}
// Dừa xiêm gọt sẵn (nước dừa để kho thịt): thân tròn xanh, chóp vót nhọn, miệng cắt trắng
export function greenCoconut() {
  const g = group('coconut'), topY = 0.86;
  g.add(lathe([[0.001, 0], [0.22, 0.02], [0.38, 0.12], [0.45, 0.3], [0.44, 0.48], [0.38, 0.64], [0.28, 0.77], [0.2, topY]], glossy('#7DB443', 0.45), 32));
  const husk = lathe([[0.2, topY - 0.001], [0.15, topY + 0.07], [0.13, topY + 0.075]], mat('#F3EBD2', 0.7), 24); g.add(husk);
  const hole = mesh(geo('cocoHole', () => new THREE.CircleGeometry(0.13, 16)), glossy('#DCEBCB', 0.08), 0, topY + 0.075, 0); hole.rotation.x = -Math.PI / 2; g.add(hole);
  g.userData.mouth = new THREE.Vector3(0, topY + 0.08, 0);
  return g;
}
// Khay gỗ nhỏ đựng chai nước mắm, hũ đường
export function tray(w = 1.7, d = 1.0) {
  const g = group('tray'), wood = mat('#D59A5E', 0.55), edge = mat('#B97A42', 0.55);
  g.add(mesh(new RoundedBoxGeometry(w, 0.07, d, 2, 0.03), wood, 0, 0.035, 0));
  [[0, d / 2, w, 0.06], [0, -d / 2, w, 0.06]].forEach(([x, z, ww, dd]) => g.add(mesh(new RoundedBoxGeometry(ww, 0.12, dd, 2, 0.025), edge, x, 0.08, z)));
  [[w / 2, 0], [-w / 2, 0]].forEach(([x, z]) => g.add(mesh(new RoundedBoxGeometry(0.06, 0.12, d, 2, 0.025), edge, x, 0.08, z)));
  return g;
}
// Hành lá cắt khúc rắc lên nồi kho
export function scallionBits(count = 14, spread = 0.35) {
  const im = new THREE.InstancedMesh(geo('scallion', () => new THREE.CylinderGeometry(0.032, 0.032, 0.15, 8)), glossy('#FFFFFF', 0.4), count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
    o3.position.set(Math.cos(a) * r, rnd(0, 0.04), Math.sin(a) * r); o3.rotation.set(Math.PI / 2 + rnd(-0.3, 0.3), 0, Math.random() * 6); o3.scale.set(1, rnd(0.6, 1.1), 1); o3.updateMatrix();
    im.setMatrixAt(i, o3.matrix); im.setColorAt(i, col.set(Math.random() < 0.2 ? '#DDF2C0' : Math.random() < 0.5 ? '#3FA83A' : '#5CC24A'));
  }
  im.castShadow = false;
  return im;
}

/* ═════════ CHÈ CHUỐI ═════════ */

// Quả chuối: hình tiện dọc trục rồi uốn cong theo cung tròn (hai đầu cong lên)
const BAN_R = 3.2;
const BAN = [[-0.98, 0.012], [-0.95, 0.05], [-0.86, 0.11], [-0.7, 0.165], [-0.45, 0.195], [0, 0.205], [0.45, 0.197], [0.7, 0.168], [0.85, 0.118], [0.93, 0.072], [0.98, 0.05]];
export function bananaR(s) {
  for (let i = 1; i < BAN.length; i++) { const [s0, r0] = BAN[i - 1], [s1, r1] = BAN[i]; if (s <= s1) return r0 + (r1 - r0) * Math.max(0, Math.min(1, (s - s0) / (s1 - s0))); }
  return BAN[BAN.length - 1][1];
}
export const bananaAxis = (s, out = new THREE.Vector3()) => out.set(BAN_R * Math.sin(s / BAN_R), BAN_R * (1 - Math.cos(s / BAN_R)), 0);
const bananaTan = (s, out = new THREE.Vector3()) => out.set(Math.cos(s / BAN_R), Math.sin(s / BAN_R), 0);
function bend(gm) {
  const p = gm.attributes.position, n = gm.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), s = p.getY(i), z = p.getZ(i), a = s / BAN_R, sa = Math.sin(a), ca = Math.cos(a);
    p.setXYZ(i, BAN_R * sa + x * sa, BAN_R * (1 - ca) - x * ca, z);
    if (n) { const nx = n.getX(i), ny = n.getY(i); n.setXYZ(i, nx * sa + ny * ca, -nx * ca + ny * sa, n.getZ(i)); }
  }
  p.needsUpdate = true; if (n) n.needsUpdate = true; gm.computeBoundingSphere(); gm.computeBoundingBox();
  return gm;
}
const bananaCapTex = () => texOnce('banCap', () => canvasTexture(128, 128, (g, w) => {
  const c = w / 2, gr = g.createRadialGradient(c, c, 4, c, c, c); gr.addColorStop(0, '#FFF8DA'); gr.addColorStop(0.75, '#FFEFB8'); gr.addColorStop(1, '#F5DE95');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
  g.fillStyle = 'rgba(214,180,110,.55)';
  for (let i = 0; i < 3; i++) { g.save(); g.translate(c, c); g.rotate(i * 2.094); g.beginPath(); g.ellipse(0, -12, 5, 13, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
  g.fillStyle = 'rgba(140,100,50,.6)'; for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.5; g.beginPath(); g.arc(c + Math.cos(a) * 20, c + Math.sin(a) * 20, 2, 0, Math.PI * 2); g.fill(); }
}));
const Z = new THREE.Vector3(0, 0, 1);
// Vật liệu có texture dùng lại cho mọi khúc chuối / múi chanh (không tạo mới mỗi lần)
const MATS = {};
const texMat = (k, make) => MATS[k] || (MATS[k] = make());
const capMaterial = () => texMat('banCap', () => new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.4, map: bananaCapTex() }));
// fleshMat: vật liệu ruột chuối (riêng để đổi màu khi nấu). Trả về nhóm có userData: segs (5 khúc), peel, setPeel(p), split(i), cutPoint(i)
export function banana(fleshMat) {
  const g = group('banana');
  const capMat = capMaterial();
  const cuts = [-0.6, -0.24, 0.12, 0.47], bounds = [-0.97, ...cuts, 0.97], segs = [], tmp = new THREE.Vector3();
  for (let k = 0; k < 5; k++) {
    const s0 = bounds[k], s1 = bounds[k + 1], c = bananaAxis((s0 + s1) / 2), pts = [];
    for (let i = 0; i <= 6; i++) { const s = s0 + ((s1 - s0) * i) / 6; pts.push(V2(Math.max(0.004, bananaR(s) * 0.9), s)); }
    const lg = bend(new THREE.LatheGeometry(pts, 22)); lg.translate(-c.x, -c.y, -c.z);
    const seg = group('banSeg'); seg.position.copy(c); seg.userData.x0 = c.x; seg.add(mesh(lg, fleshMat));
    [s0, s1].forEach((s, e) => {
      if ((k === 0 && e === 0) || (k === 4 && e === 1)) return;
      const cap = mesh(new THREE.CircleGeometry(bananaR(s) * 0.9, 22), capMat);
      cap.position.copy(bananaAxis(s, tmp)).sub(c); cap.quaternion.setFromUnitVectors(Z, bananaTan(s, tmp).multiplyScalar(e ? 1 : -1));
      seg.add(cap);
    });
    g.add(seg); segs.push(seg);
  }
  // Vỏ: một chén nhỏ ở đầu cuống hoa + 4 dải vỏ bản lề ở gốc, mở ra khi bóc
  const peel = group('peel'); g.add(peel);
  const yellow = glossy('#FFD43B', 0.42), inner = mat('#FFF1C4', 0.6, 0, { side: THREE.BackSide }), dark = mat('#4A3320', 0.7);
  const PR = s => bananaR(s) + 0.018, SH = -0.74;
  const cupPts = []; for (let i = 0; i <= 4; i++) { const s = -0.985 + ((SH + 0.985) * i) / 4; cupPts.push(V2(Math.max(0.006, PR(s)), s)); }
  const cupG = bend(new THREE.LatheGeometry(cupPts, 20));
  peel.add(mesh(cupG, yellow)); peel.add(mesh(cupG, inner));
  const tip = mesh(sphereGeo(), dark); tip.scale.setScalar(0.035); tip.position.copy(bananaAxis(-0.985)); peel.add(tip);
  const aH = SH / BAN_R, DH = new THREE.Vector3(Math.sin(aH), -Math.cos(aH), 0), TH = bananaTan(SH), H = bananaAxis(SH), rH = PR(SH);
  const pivots = [], axes = [];
  for (let k = 0; k < 4; k++) {
    const pts = []; for (let i = 0; i <= 10; i++) { const s = SH + ((0.985 - SH) * i) / 10; pts.push(V2(Math.max(0.006, PR(s)), s)); }
    const sg = bend(new THREE.LatheGeometry(pts, 6, k * Math.PI / 2 + 0.012, Math.PI / 2 - 0.024));
    const phi = k * Math.PI / 2 + Math.PI / 4, D = DH.clone().multiplyScalar(Math.sin(phi)).addScaledVector(Z, Math.cos(phi));
    const hinge = H.clone().addScaledVector(D, rH); sg.translate(-hinge.x, -hinge.y, -hinge.z);
    const pv = group('strip'); pv.position.copy(hinge); pv.add(mesh(sg, yellow)); pv.add(mesh(sg, inner)); peel.add(pv);
    pivots.push(pv); axes.push(new THREE.Vector3().crossVectors(TH, D).normalize());
  }
  // cuống xanh đi theo dải vỏ bóc đầu tiên
  const stem = mesh(geo('banStem', () => new THREE.CylinderGeometry(0.035, 0.045, 0.2, 8)), mat('#8FA53A', 0.6));
  stem.position.copy(bananaAxis(1.07)).sub(pivots[3].position); stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bananaTan(0.99)); pivots[3].add(stem);
  const stemTip = mesh(sphereGeo(), dark); stemTip.scale.setScalar(0.04); stemTip.position.copy(bananaAxis(1.17)).sub(pivots[3].position); pivots[3].add(stemTip);
  const ORDER = [3, 2, 0, 1], detached = new Set();
  const offs = segs.map(() => 0);
  g.userData = {
    segs, peel, cuts, pivots, ORDER, detached,
    // p: 0..1 — mở lần lượt 4 dải vỏ (theo ORDER); trả về số dải đã mở hẳn
    setPeel(p) {
      let n = 0;
      for (let i = 0; i < 4; i++) {
        const k = ORDER[i], q = Math.max(0, Math.min(1, p * 4.1 - i)), e = 1 - (1 - q) * (1 - q);
        if (!detached.has(k)) pivots[k].quaternion.setFromAxisAngle(axes[k], e * 1.1);
        if (q >= 1) n++;
      }
      return n;
    },
    // vết cắt thứ i: các khúc bên trái lùi trái, bên phải lùi phải một chút
    split(i, gap = 0.06) { segs.forEach((s, k) => { offs[k] += k <= i ? -gap : gap; }); return offs; },
    offs,
    cutPoint(i, out = new THREE.Vector3()) { bananaAxis(cuts[i], out); out.y += bananaR(cuts[i]) * 0.9; return g.localToWorld(out); },
  };
  return g;
}
// Khúc chuối chín trong chè (thành phẩm): trụ ngắn vàng ươm, hai mặt cắt
export function bananaChunk(m) {
  const g = group('banChunk');
  const capMat = texMat('banChunkCap', () => new THREE.MeshStandardMaterial({ color: '#FFE7A6', roughness: 0.35, map: bananaCapTex() }));
  g.add(mesh(geo('banChunk', () => new THREE.CylinderGeometry(0.2, 0.21, 0.24, 20, 1, true)), m));
  [-1, 1].forEach(s => { const c = mesh(geo('banChunkCap', () => new THREE.CircleGeometry(0.205, 20)), capMat, 0, s * 0.12, 0); c.rotation.x = -s * Math.PI / 2; g.add(c); });
  return g;
}

// Dao nhựa của bé: lưỡi nhựa màu, đầu tròn, răng cưa nhỏ, cán to dễ cầm
export function kidKnife(blade = '#3DB8F2', handle = '#FF6FA5') {
  const g = group('kidKnife'), sh = new THREE.Shape();
  sh.moveTo(0, 0.03); sh.lineTo(0.06, 0.03);
  for (let i = 0; i < 7; i++) { const x0 = 0.06 + i * 0.11; sh.lineTo(x0 + 0.055, -0.01); sh.lineTo(x0 + 0.11, 0.03); }
  sh.quadraticCurveTo(1.02, 0.03, 1.0, 0.16); sh.quadraticCurveTo(0.97, 0.28, 0.83, 0.29); sh.lineTo(0, 0.29); sh.closePath();
  const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 2, curveSegments: 8 });
  g.add(mesh(bg, glossy(blade, 0.25), 0, 0, -0.0175));
  g.add(mesh(new RoundedBoxGeometry(0.64, 0.24, 0.14, 3, 0.065), glossy(handle, 0.32), -0.33, 0.14, 0));
  [-0.5, -0.33, -0.16].forEach(x => { const d = mesh(geo('knDot', () => new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12)), glossy('#FFD34D', 0.3), x, 0.14, 0.072); d.rotation.x = Math.PI / 2; g.add(d); });
  return g;
}
// Vá múc canh inox (ba mẹ dùng)
export function ladle(color = '#E4E9EF') {
  const g = group('ladle'), m = mat(color, 0.2, 0.85, { side: DS });
  g.add(mesh(geo('ladleCup', () => new THREE.SphereGeometry(0.24, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), m));
  const hd = mesh(geo('ladleHd', () => new THREE.CylinderGeometry(0.028, 0.034, 1.5, 8)), m, 0.22 + 0.75 * Math.sin(0.7), 0.75 * Math.cos(0.7), 0); hd.rotation.z = -0.7; g.add(hd);
  const content = mesh(geo('ladleIn', () => new THREE.CircleGeometry(0.21, 20)), mat('#FFFFFF'), 0, -0.035, 0); content.rotation.x = -Math.PI / 2; content.visible = false; g.add(content);
  g.userData.content = content;
  return g;
}
// Gáo dừa khô đựng nước cốt dừa trắng béo
export function coconutHalf() {
  const g = group('coconutHalf');
  const shell = mesh(geo('cocoHalf', () => new THREE.SphereGeometry(0.44, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), mat('#7A4A2A', 0.85), 0, 0.44, 0); g.add(shell);
  const flesh = mesh(geo('cocoFlesh', () => new THREE.SphereGeometry(0.4, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), mat('#FBF7EE', 0.5, 0, { side: THREE.BackSide }), 0, 0.44, 0); g.add(flesh);
  const rim = mesh(geo('cocoRim', () => new THREE.TorusGeometry(0.42, 0.022, 6, 32)), mat('#F4EEE0', 0.5), 0, 0.44, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  const milk = mesh(geo('cocoMilk', () => new THREE.CircleGeometry(0.37, 28)), glossy('#FFFCF4', 0.22), 0, 0.4, 0); milk.rotation.x = -Math.PI / 2; g.add(milk);
  g.userData.milk = milk;
  return g;
}
// Vệt nước cốt dừa rưới xoáy trên mặt chè
export function creamSwirl(R = 0.5) {
  const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * Math.PI * 3.2, r = 0.08 + t * R; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.022, 6), glossy('#FFFFFF', 0.2)); m.scale.y = 0.45; m.castShadow = false;
  return group('swirl', m);
}
// Trân châu (bột báng) trong veo — InstancedMesh
export function pearls(count, R, y0 = 0) {
  const im = new THREE.InstancedMesh(geo('pearl', () => new THREE.SphereGeometry(0.05, 10, 8)), glossy('#D8D2EE', 0.04, 0, { transparent: true, opacity: 0.86 }), count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R;
    o3.position.set(Math.cos(a) * r, y0 + rnd(-0.01, 0.015), Math.sin(a) * r); o3.rotation.set(0, 0, 0); o3.scale.setScalar(rnd(0.85, 1.15)); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix);
  }
  im.castShadow = false; im.renderOrder = 3;
  return im;
}

/* ═════════ PHỞ BÒ ═════════ */

// Bánh phở: một nắm sợi dẹt trắng (đụn + các sợi uốn lượn, InstancedMesh)
const ribbonGeo = () => geo('ribbon', () => {
  const p = new THREE.PlaneGeometry(0.07, 0.62, 1, 14), a = p.attributes.position;
  for (let i = 0; i < a.count; i++) { const y = a.getY(i), t = y / 0.62 + 0.5; a.setXYZ(i, a.getX(i) + Math.sin(t * 7) * 0.02, y, Math.sin(t * Math.PI) * 0.1 + Math.sin(t * 11) * 0.01); }
  p.rotateX(-Math.PI / 2); p.computeVertexNormals();
  return p;
});
export function noodleBundle(R = 0.5, H = 0.3, count = 80) {
  const g = group('noodles'), m = glossy('#FFFFFF', 0.34, 0, { side: DS });
  const base = mesh(hemiGeo(), glossy('#EADCC2', 0.4)); base.scale.set(R * 0.9, H * 0.85, R * 0.9); g.add(base);
  const im = new THREE.InstancedMesh(ribbonGeo(), m, count);
  for (let i = 0; i < count; i++) im.setColorAt(i, col.set(['#FFFAF0', '#F2E6D0', '#E6D6B8', '#FFF4E2'][i % 4]));
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * R * 0.62, y = H * 0.85 * Math.sqrt(Math.max(0, 1 - (r / (R * 0.9)) ** 2)) - 0.06;
    o3.position.set(Math.cos(a) * r, y, Math.sin(a) * r); o3.rotation.set(rnd(-0.2, 0.2), Math.random() * Math.PI * 2, rnd(-0.2, 0.2)); o3.scale.set(1, rnd(0.7, 1.1), rnd(0.8, 1.0)); o3.updateMatrix();
    im.setMatrixAt(i, o3.matrix);
  }
  im.castShadow = false; g.add(im);
  const hit = mesh(sphereGeo(), hitMat(), 0, H * 0.4, 0); hit.scale.set(R * 1.1, H * 0.9, R * 1.1); g.add(hit);
  return g;
}
// Thịt bò thái mỏng (vân mỡ trắng) — màu đỏ tươi, chan nước dùng nóng thì chín tái
const beefTex = () => texOnce('beef', () => {
  const t = canvasTexture(128, 128, (g, w) => {
    g.fillStyle = '#B4B4B4'; g.fillRect(0, 0, w, w);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < 9; i++) {
      let x = Math.random() * w, y = Math.random() * w; const pts = [[x, y]];
      for (let k = 0; k < 4; k++) { x += rnd(-20, 20); y += rnd(-14, 14); pts.push([x, y]); }
      [[7, 0.14], [3.5, 0.3], [1.5, 0.55]].forEach(([lw, al]) => { g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = lw; g.beginPath(); pts.forEach(([px, py], j) => (j ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); });
    }
    const e = g.createRadialGradient(w / 2, w / 2, w * 0.3, w / 2, w / 2, w * 0.5); e.addColorStop(0, 'rgba(255,255,255,0)'); e.addColorStop(1, 'rgba(255,255,255,.35)'); g.fillStyle = e; g.fillRect(0, 0, w, w);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
});
export const BEEF_RAW = new THREE.Color('#FF5E6C'), BEEF_COOKED = new THREE.Color('#E6A898');
export function beefMat(cooked = false) {
  return own(new THREE.MeshStandardMaterial({ color: cooked ? BEEF_COOKED : BEEF_RAW, map: beefTex(), roughness: cooked ? 0.35 : 0.45, side: DS }));
}
export function beefSlice(m) {
  const gm = new THREE.RingGeometry(0.001, 1, 20, 4), p = gm.attributes.position, uv = gm.attributes.uv;
  const f1 = rnd(0, 6), f2 = rnd(0, 6), f3 = rnd(0, 6), du = rnd(0, 1), dv = rnd(0, 1);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), a = Math.atan2(y, x), r = 1 + 0.08 * Math.sin(3 * a + f1) + 0.05 * Math.sin(5 * a + f2);
    const X = x * 0.28 * r, Y = y * 0.18 * r;
    p.setXYZ(i, X, Y, 0.025 * Math.sin(X * 10 + f3) + 0.02 * (1 - x * x - y * y));
    uv.setXY(i, uv.getX(i) * 0.9 + du, uv.getY(i) * 0.9 + dv);
  }
  gm.rotateX(-Math.PI / 2); gm.computeVertexNormals();
  const g = group('beef');
  g.add(mesh(gm, m));
  const hit = mesh(geo('beefHit', () => new THREE.BoxGeometry(0.66, 0.2, 0.46)), hitMat(), 0, 0.05, 0); g.add(hit);
  return noShadow(g);
}
// Gia vị ninh nước dùng: quế, hoa hồi, gừng nướng
export function cinnamon() {
  const g = group('que'), m = mat('#94522C', 0.8, 0, { side: DS }), m2 = mat('#6E3618', 0.85, 0, { side: DS });
  [[-0.07, 0.3], [0.08, -0.25]].forEach(([z, ry], i) => {
    const holder = group(); holder.position.set(0, 0.08 + i * 0.07, z); holder.rotation.y = ry; g.add(holder);
    const c = mesh(geo('queOut', () => new THREE.CylinderGeometry(0.075, 0.075, 0.8, 14, 1, true, 0.3, Math.PI * 1.75)), m); c.rotation.z = Math.PI / 2; holder.add(c);
    const c2 = mesh(geo('queIn', () => new THREE.CylinderGeometry(0.045, 0.045, 0.8, 12, 1, true, 2.2, Math.PI * 1.5)), m2); c2.rotation.z = Math.PI / 2; holder.add(c2);
  });
  return g;
}
export function starAnise() {
  const g = group('hoi'), pod = mat('#6B3517', 0.7), seed = glossy('#C68A4C', 0.35);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const p = mesh(sphereGeo(), pod, Math.cos(a) * 0.11, 0.04, Math.sin(a) * 0.11); p.scale.set(0.12, 0.045, 0.052); p.rotation.y = -a; g.add(p);
    const s = mesh(sphereGeo(), seed, Math.cos(a) * 0.12, 0.08, Math.sin(a) * 0.12); s.scale.set(0.034, 0.018, 0.022); s.rotation.y = -a; g.add(s);
  }
  const c = mesh(sphereGeo(), pod, 0, 0.055, 0); c.scale.setScalar(0.04); g.add(c);
  g.scale.setScalar(1.3);
  return g;
}
export function ginger() {
  const g = group('gung'), skin = mat('#C9A36B', 0.75), charM = mat('#2E2019', 0.9);
  [[0, 0.1, 0, 0.17, 1.35], [0.22, 0.12, 0.09, 0.11, 1.2], [-0.2, 0.1, -0.06, 0.1, 1.15], [0.08, 0.19, -0.1, 0.08, 1]].forEach(([x, y, z, r, sx]) => { const l = mesh(sphereGeo(), skin, x, y, z); l.scale.set(r * sx, r * 0.78, r); g.add(l); });
  [[0.02, 0.22, 0.06], [-0.12, 0.17, 0.08], [0.2, 0.2, 0.12], [0.1, 0.12, 0.16], [-0.24, 0.15, -0.02], [0.05, 0.27, -0.08]].forEach(([x, y, z]) => { const c = mesh(sphereGeo(), charM, x, y, z); c.scale.set(rnd(0.05, 0.08), 0.02, rnd(0.04, 0.07)); c.rotation.set(rnd(-0.5, 0.5), rnd(0, 3), rnd(-0.5, 0.5)); g.add(c); });
  return g;
}
// Rau thơm (húng quế thân tím)
export function herbSprig(leaf = '#2E9A48') {
  const g = group('rauthom'), lm = glossy(leaf, 0.4, 0, { side: DS }), sm = mat('#7A3E66', 0.6);
  const st = mesh(geo('herbStem', () => new THREE.CylinderGeometry(0.014, 0.02, 0.62, 6)), sm, 0, 0.03, 0); st.rotation.x = Math.PI / 2; g.add(st);
  const lg = geo('herbLeaf', () => { const s = new THREE.SphereGeometry(1, 10, 6); s.scale(0.07, 0.016, 0.13); s.translate(0, 0, 0.1); return s; });
  [[-0.22, 1, 0.9], [-0.1, -1, 0.95], [0.02, 1, 1], [0.14, -1, 0.9], [0.24, 1, 0.8], [0.27, -1, 0.75]].forEach(([z, s, k]) => {
    const l = mesh(lg, lm, 0, 0.04, z); l.rotation.set(-0.15, s * 1.1 + Math.PI, 0); l.scale.setScalar(k); g.add(l);
  });
  const top = mesh(lg, lm, 0, 0.05, 0.3); top.rotation.set(-0.2, Math.PI, 0); top.scale.setScalar(0.8); g.add(top);
  return noShadow(g);
}
// Múi chanh (vỏ xanh, mặt múi vàng chanh có tép)
const limeTex = () => texOnce('lime', () => canvasTexture(128, 128, (g, w) => {
  const c = w / 2; g.fillStyle = '#F4FBD2'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#D9EE7E'; g.beginPath(); g.arc(c, c, c - 6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#F4FBD2'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * c, c + Math.sin(a) * c); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.ellipse(rnd(10, w - 10), rnd(10, w - 10), 3, 1.5, rnd(0, 3), 0, Math.PI * 2); g.fill(); }
}));
export function limeWedge() {
  const g = group('chanh'), R = 0.2, PL = 1.15;
  const w = group(); g.add(w);
  w.add(mesh(geo('limeRind', () => new THREE.SphereGeometry(R, 16, 12, 0, PL)), glossy('#5EAE2F', 0.32, 0, { side: DS })));
  const face = texMat('limeFace', () => new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.28, map: limeTex(), side: DS }));
  const fg = geo('limeFace', () => new THREE.CircleGeometry(R * 0.97, 16, Math.PI / 2, Math.PI));
  w.add(mesh(fg, face)); const f2 = mesh(fg, face); f2.rotation.y = PL; w.add(f2);
  w.scale.set(1, 1.15, 1); w.rotation.set(0, 0, Math.PI / 2);   // nằm ngang, vỏ úp xuống
  return noShadow(g);
}
// Nước dùng có váng mỡ vàng óng: các chấm tròn nhỏ gắn lên mặt nước (con của đĩa fill)
export function brothDots(count = 12) {
  const im = new THREE.InstancedMesh(geo('dot', () => new THREE.CircleGeometry(0.035, 10)), glossy('#F7C957', 0.12, 0, { transparent: true, opacity: 0.85 }), count);
  for (let i = 0; i < count; i++) { const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 0.8; o3.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.003); o3.rotation.set(0, 0, 0); o3.scale.setScalar(rnd(0.5, 1.4)); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); }
  im.castShadow = false; im.renderOrder = 2;
  return im;
}

/* ═════════ Đồ rắc trang trí: hành lá, rau ngò, đậu phộng, hạt mè ═════════ */
export const GARNISH_C_NAMES = { hanh: 'Hành lá', ngo: 'Rau ngò', dauphong: 'Đậu phộng', me: 'Hạt mè' };
function cluster(geometry, material, count, spread, place, colors) {
  const im = new THREE.InstancedMesh(geometry, material, count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
    o3.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); o3.rotation.set(0, Math.random() * 6.283, 0); o3.scale.set(1, 1, 1);
    place(o3, i); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix);
    if (colors) im.setColorAt(i, col.set(colors[Math.floor(Math.random() * colors.length)]));
  }
  im.castShadow = false;
  return im;
}
export function garnishC(kind) {
  const g = group('garnish-' + kind), white = glossy('#FFFFFF', 0.4);
  if (kind === 'hanh') {
    g.add(cluster(geo('hanhRing', () => new THREE.TorusGeometry(0.04, 0.011, 5, 14).scale(1, 1, 0.7)), white, 9, 0.14,
      o => { o.position.y = rnd(0.008, 0.02); o.rotation.x = Math.PI / 2 + rnd(-0.3, 0.3); }, ['#3DAA3A', '#56BE45', '#2F9A36', '#E2F4C8']));
  } else if (kind === 'ngo') {
    g.add(cluster(geo('ngoLeaf', () => { const s = new THREE.CircleGeometry(0.06, 7); s.rotateX(-Math.PI / 2); s.translate(0.045, 0, 0); return s; }), glossy('#FFFFFF', 0.45, 0, { side: DS }), 10, 0.09,
      (o, i) => { o.position.y = 0.012 + i * 0.002; o.rotation.set(rnd(-0.3, 0.3), (i / 10) * 6.283, rnd(-0.3, 0.3)); o.scale.setScalar(rnd(0.8, 1.25)); }, ['#3FA34D', '#4DB85A', '#2F8F3F']));
  } else if (kind === 'dauphong') {
    g.add(cluster(geo('peanut', () => new THREE.IcosahedronGeometry(0.05, 0)), glossy('#FFFFFF', 0.45), 8, 0.13,
      o => { o.position.y = 0.02; o.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); o.scale.set(rnd(0.7, 1.2), rnd(0.55, 0.9), rnd(0.7, 1.1)); }, ['#B8762F', '#D39A55', '#A8652A', '#E0B06A']));
    g.add(cluster(sphereGeo(), glossy('#FFFFFF', 0.4), 2, 0.08,
      o => { o.position.y = 0.025; o.scale.set(0.075, 0.035, 0.05); }, ['#E3B06C', '#D39A55']));
  } else if (kind === 'me') {
    g.add(cluster(sphereGeo(), glossy('#FFFFFF', 0.35), 20, 0.16,
      o => { o.position.y = 0.012; o.scale.set(0.022, 0.01, 0.038); }, ['#F2CF8A', '#E6B964', '#F8DDA4', '#DDA955', '#FFF0CC', '#EBC47A', '#3A2E26']));
  }
  return noShadow(g);
}
