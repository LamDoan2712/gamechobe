// hair.js — 6 kiểu tóc cho búp bê: mũ tóc ôm đầu có mái lượn + bím, đuôi ngựa, búi, tóc dài, lọn xoăn.
// Mọi mảnh tóc được "nướng" vào toạ độ của đầu rồi gộp thành ít lưới (ít lệnh vẽ). Mỗi đỉnh có màu cầu vồng
// theo độ cao để dùng khi bé chọn tóc cầu vồng (vật liệu vertexColors), các màu khác dùng vật liệu trơn.

import { THREE } from '../../kit/three-kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { TAU, smooth, clamp01, lathe, mesh, scallop } from './geo.js';

const RAINBOW = ['#FF8FB8', '#FFB27A', '#FFE17A', '#8FE3A6', '#7FC4FF', '#C39BFF'].map(c => new THREE.Color(c));
const tmpC = new THREE.Color();
function rainbowAt(t) {
  const x = clamp01(t) * (RAINBOW.length - 1), i = Math.min(RAINBOW.length - 2, Math.floor(x));
  return tmpC.copy(RAINBOW[i]).lerp(RAINBOW[i + 1], x - i);
}

// Mũ tóc: nửa cầu có mép cắt theo hàm edge(d) (d = góc lệch khỏi chính diện, 0..π)
function edgeFn({ F = 1.2, S = 2.0, B = 2.2, w0 = 0.5, w1 = 1.15, bangs = 0.1, period = 0.2 }) {
  return d => {
    if (d < w0) return F + bangs * (0.5 + 0.5 * Math.cos(d * TAU / period));
    if (d < w1) return F + (S - F) * smooth((d - w0) / (w1 - w0));
    return S + (B - S) * (d - w1) / (Math.PI - w1);
  };
}
function capGeo(edge, R = 1.1, flare) {
  const W = 72, H = 28, g = new THREE.SphereGeometry(1, W, H);
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const ix = i % (W + 1), iy = Math.floor(i / (W + 1));
    const phi = (ix / W) * TAU;
    let d = Math.abs(phi - Math.PI / 2); if (d > Math.PI) d = TAU - d;
    const e = edge(d), th = (iy / H) * e;
    const sx = -Math.cos(phi) * Math.sin(th), sy = Math.cos(th), sz = Math.sin(phi) * Math.sin(th);
    const r = R * (1 + (flare ? flare(d, th, e) : 0));
    p.setXYZ(i, sx * r * 1.06, sy * r * 0.98, sz * r);
    const nx = sx / 1.06, ny = sy / 0.98, l = Math.hypot(nx, ny, sz) || 1;
    n.setXYZ(i, nx / l, ny / l, sz / l);
  }
  return g;
}

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3();
// Đặt một hình vào vị trí (x, y, z), co giãn (sx, sy, sz), xoay (rx, ry, rz) rồi "nướng" vào toạ độ
function bake(geo, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
  M4.compose(P3.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), S3.set(sx, sy, sz));
  return geo.applyMatrix4(M4);
}
function merged(list, offsetY = 0) {
  const g = mergeGeometries(list, false); list.forEach(x => x.dispose());
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = rainbowAt((1.15 - (p.getY(i) + offsetY)) / 2.9); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
const ball = (r, w = 18, h = 14) => new THREE.SphereGeometry(r, w, h);

// Pseudo-random cố định để lọn xoăn luôn giống nhau
function rng(seed) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); }

const STYLES = {
  short(add) {
    add.main(capGeo(edgeFn({ F: 1.2, S: 2.22, B: 2.3 }), 1.1,
      (d, th, e) => (d > 0.8 ? 0.08 * smooth((th - e + 0.45) / 0.45) * smooth((d - 0.8) / 0.4) : 0)));
    add.main(bake(new THREE.TorusGeometry(0.13, 0.035, 8, 16, Math.PI * 1.3), 0.02, 1.12, 0.05, 1, 1, 1, 0, 0.4, 0.6));
  },
  twin(add) {
    add.main(capGeo(edgeFn({ F: 1.2, S: 1.85, B: 2.1, w1: 1.1 })));
    for (const s of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const r = 0.21 - i * 0.013;
        add.main(bake(ball(r), s * (1.04 + i * 0.02) + (i % 2 ? 0.03 : -0.03) * s, -0.4 - i * 0.25, -0.3 + i * 0.02, 0.95, 0.82, 0.95));
      }
      add.main(bake(new THREE.ConeGeometry(0.13, 0.26, 14), s * 1.13, -1.62, -0.21, 1, 1, 1, Math.PI, 0, 0));
      add.tie(s * 1.03, -0.27, -0.3, 0.14, 0, 0, s * 0.2);
      add.tie(s * 1.12, -1.46, -0.22, 0.11, 0, 0, 0);
    }
  },
  pony(add) {
    add.main(capGeo(edgeFn({ F: 1.2, S: 1.8, B: 1.95, w1: 1.05 })));
    // đuôi ngựa đung đưa quanh chỗ buộc
    const lumps = [[0, 0.06, -0.14, 0.27], [0, -0.14, -0.36, 0.27], [0, -0.46, -0.48, 0.25], [0, -0.82, -0.48, 0.22], [0, -1.14, -0.4, 0.18], [0, -1.4, -0.3, 0.12]];
    lumps.forEach(([x, y, z, r], i) => (i < 2 ? add.swayTop : add.sway)(bake(ball(r), x, y, z, 1, 1.18, 0.9)));
    add.sway(bake(new THREE.ConeGeometry(0.1, 0.2, 12), 0, -1.56, -0.26, 1, 1, 1, Math.PI, 0, 0));
    add.pivot(0, 0.6, -0.92);
    add.tie(0, 0.6, -0.92, 0.17, -0.95, 0, 0, true);
  },
  long(add) {
    add.main(capGeo(edgeFn({ F: 1.2, S: 2.05, B: 2.25 })));
    const cur = lathe([[1.13, 0.15], [1.14, -0.3], [1.08, -0.75], [0.99, -1.2], [0.92, -1.6], [0.9, -1.8]], { n: 24, seg: 40, phiStart: Math.PI - 1.35, phiLength: 2.7 });
    const p = cur.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 - 0.3 * smooth((-y - 0.5) / 1.0);
      p.setXYZ(i, x * 1.06, y, z * k);
    }
    add.main(scallop(cur, 0.12, 14, -1.8, 0.2));
  },
  bun(add) {
    add.main(capGeo(edgeFn({ F: 1.2, S: 1.8, B: 2.0, w1: 1.05 })));
    add.top(bake(ball(0.42, 24, 18), 0, 1.02, -0.36, 1, 0.9, 1));
    add.top(bake(new THREE.TorusGeometry(0.2, 0.05, 8, 20), 0.02, 1.12, -0.12, 1.4, 1, 1, -0.5, 0, 0));
    add.tie(0, 0.84, -0.3, 0.31, -0.7, 0, 0, true);
  },
  curly(add) {
    const edge = edgeFn({ F: 1.15, S: 2.05, B: 2.3, bangs: 0.05 });
    add.main(capGeo(edge, 1.08));
    const rnd = rng(7);
    for (let th = 0.3; th < 2.5; th += 0.3) {
      const count = Math.max(4, Math.round(TAU * Math.sin(th) / 0.36));
      for (let k = 0; k < count; k++) {
        const phi = (k + (Math.round(th * 10) % 2) * 0.5) / count * TAU;
        let d = Math.abs(phi - Math.PI / 2); if (d > Math.PI) d = TAU - d;
        const e = edge(d);
        if (th > e + 0.12) continue;
        if (d < 1.0 && th > 1.02) continue;
        const r = 0.2 + rnd() * 0.08, R = 1.09;
        const x = -Math.cos(phi) * Math.sin(th) * R * 1.06, y = Math.cos(th) * R * 0.98, z = Math.sin(phi) * Math.sin(th) * R;
        (y > 0.55 ? add.top : add.main)(bake(ball(r, 12, 9), x, y, z));
      }
    }
    // lọn xoăn hai bên và sau gáy
    for (const phi of [0.05, 0.55, 1.05 + Math.PI, 1.6 + Math.PI, 2.1 + Math.PI, Math.PI - 0.05, Math.PI - 0.55]) {
      for (let j = 0; j < 3; j++) {
        const R = 1.05 - j * 0.05, y = -0.62 - j * 0.24;
        add.main(bake(ball(0.2 - j * 0.03, 12, 9), -Math.cos(phi) * R * 1.06, y, Math.sin(phi) * R * 0.85));
      }
    }
    // mái xoăn nhỏ
    for (let k = -3; k <= 3; k++) {
      const phi = Math.PI / 2 + k * 0.2, th = 1.12 + (k % 2 ? 0.03 : 0);
      add.main(bake(ball(0.15, 12, 9), -Math.cos(phi) * Math.sin(th) * 1.12, Math.cos(th) * 1.08, Math.sin(phi) * Math.sin(th) * 1.1));
    }
  },
};

// buildHair(style, hairMat, tieMat) → { parts: [{ at: 'head', obj, hair, hatHide?, sway? }] }
export function buildHair(style, hairMat, tieMat) {
  const L = { main: [], top: [], sway: [], swayTop: [] }, ties = [], pivot = new THREE.Vector3();
  const add = {
    main: g => L.main.push(g), top: g => L.top.push(g), sway: g => L.sway.push(g), swayTop: g => L.swayTop.push(g),
    pivot: (x, y, z) => pivot.set(x, y, z),
    tie: (x, y, z, r, rx, ry, rz, hatHide) => ties.push({ x, y, z, r, rx, ry, rz, hatHide }),
  };
  STYLES[style](add);
  const puffy = style === 'curly';
  const parts = [];
  const hairMesh = (list, flags, offY = 0) => { if (!list.length) return null; const m = mesh(merged(list, offY), hairMat); parts.push(Object.assign({ at: 'head', obj: m, hair: true }, flags)); return m; };
  hairMesh(L.main, {});
  hairMesh(L.top, { hatHide: true });
  if (L.sway.length) {
    const g = new THREE.Group(); g.position.copy(pivot);
    const lo = mesh(merged(L.sway, pivot.y), hairMat); g.add(lo);
    parts.push({ at: 'head', obj: g, sway: true, hairMeshes: [lo] });
    if (L.swayTop.length) {
      const hi = mesh(merged(L.swayTop, pivot.y), hairMat); g.add(hi);
      parts[parts.length - 1].hairMeshes.push(hi); parts.push({ at: null, obj: hi, hatHide: true });
    }
  }
  const tg = new THREE.TorusGeometry(1, 0.32, 10, 20);
  ties.forEach(t => {
    const m = mesh(tg, tieMat, t.x, t.y, t.z); m.scale.setScalar(t.r); m.rotation.set(Math.PI / 2 + (t.rx || 0), t.ry || 0, t.rz || 0);
    parts.push({ at: 'head', obj: m, hatHide: !!t.hatHide });
  });
  return { parts, puffy };
}
