// geo.js — hàm dựng hình dùng chung cho quần áo, tóc: tiện (lathe) theo biên dạng mượt, xếp nếp váy, dây áo…

import { THREE } from '../../kit/three-kit.js';

export const TAU = Math.PI * 2;
export const V2 = (x, y) => new THREE.Vector2(x, y);
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };

// Biên dạng mượt, điểm cách đều (để hoạ tiết vải không bị kéo giãn)
export function spaced(pts, n) { return new THREE.SplineCurve(pts.map(p => V2(p[0], p[1]))).getSpacedPoints(n); }

// Tiện quanh trục Y. Mặc định đường nối nằm phía sau (phiStart = π) để u = 0.5 là chính giữa phía trước.
export function lathe(pts, o = {}) {
  return new THREE.LatheGeometry(spaced(pts, o.n || 30), o.seg || 48, o.phiStart ?? Math.PI, o.phiLength ?? TAU);
}

export function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m;
}

// Xếp nếp: sóng theo góc quanh trục, mạnh dần từ yTop xuống yHem
export function ruffle(geo, amp, freq, yTop, yHem, phase = 0) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const w = clamp01((yTop - y) / (yTop - yHem));
    const k = 1 + amp * w * Math.sin(Math.atan2(x, z) * freq + phase);
    p.setXYZ(i, x * k, y, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

// Viền lượn sóng: nâng mép váy lên giữa các "vỏ sò"
export function scallop(geo, amp, freq, yEdge, range) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const w = clamp01(1 - (y - yEdge) / range);
    p.setY(i, y + amp * w * (0.5 - 0.5 * Math.cos(Math.atan2(x, z) * freq)));
  }
  geo.computeVertexNormals();
  return geo;
}

// Nới rộng biên dạng thêm d (áo khoác, áo len mặc rộng hơn)
export const loosen = (pts, d) => pts.map(([r, y]) => [r + d, y]);

// Vòng xuyến nằm ngang (thắt lưng, viền áo, viền giày)
export function ring(r, tube, mat, y, seg = 40) {
  const m = mesh(new THREE.TorusGeometry(r, tube, 10, seg), mat, 0, y, 0); m.rotation.x = Math.PI / 2; return m;
}

// Ống hở hai đầu (ống quần, ống tay, cổ giày)
export function tube(rTop, rBot, h, mat, y, seg = 28) {
  return mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, true), mat, 0, y, 0);
}

// Hình trái tim & ngôi sao để đùn (extrude) thành khối
export function heartShape(s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.8 * s);
  sh.bezierCurveTo(-1.3 * s, 0, -0.8 * s, 1 * s, 0, 0.35 * s);
  sh.bezierCurveTo(0.8 * s, 1 * s, 1.3 * s, 0, 0, -0.8 * s);
  return sh;
}
export function starShape(r, n = 5, inner = 0.48) {
  const sh = new THREE.Shape();
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * inner : r;
    i ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  sh.closePath(); return sh;
}
export function extrude(shape, depth, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 14 });
  g.center(); return g;
}

// Nơ: hai cánh + nút thắt + hai dải, đặt trong một nhóm (mặt nơ nhìn về +z)
export function bow(mat, knotMat, s = 1) {
  const g = new THREE.Group();
  const lobe = new THREE.SphereGeometry(0.5, 20, 14);
  for (const k of [-1, 1]) {
    const m = mesh(lobe, mat, k * 0.42 * s, 0, 0); m.scale.set(0.5 * s, 0.34 * s, 0.2 * s); m.rotation.z = k * 0.28; g.add(m);
    const t = mesh(lobe, mat, k * 0.16 * s, -0.3 * s, -0.02 * s); t.scale.set(0.12 * s, 0.3 * s, 0.08 * s); t.rotation.z = k * 0.45; g.add(t);
  }
  const knot = mesh(new THREE.SphereGeometry(0.13 * s, 16, 12), knotMat || mat); knot.scale.set(1, 1, 0.8); g.add(knot);
  return g;
}

// Bông hoa nhỏ: 5 cánh tròn + nhuỵ
export function flowerMesh(petalMat, centerMat, r = 0.1) {
  const g = new THREE.Group(), pg = new THREE.SphereGeometry(r * 0.55, 12, 10);
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5, m = mesh(pg, petalMat, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 0); m.scale.z = 0.45; g.add(m);
  }
  const c = mesh(new THREE.SphereGeometry(r * 0.4, 12, 10), centerMat, 0, 0, r * 0.12); c.scale.z = 0.6; g.add(c);
  return g;
}

// Giải phóng hình học của một nhánh (vật liệu thuộc kho dùng chung nên không huỷ ở đây)
export function disposeGeos(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
