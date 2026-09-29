// models-b.js — mô hình 3D cho 4 món: Bánh mì ốp la, Gỏi cuốn, Canh bí đỏ, Rau muống xào tỏi.
// Nhiều mảnh nhỏ (lá, sợi bún, khúc rau, con tôm…) được gộp thành MỘT khối có màu theo đỉnh (vertex colors)
// để ít lệnh vẽ, nhẹ cho điện thoại. Đơn vị giống models.js: mặt bếp ở y = 0.

import { THREE, RoundedBoxGeometry, canvasTexture } from '../../kit/three-kit.js';
import { mat, glossy, own, tex } from './mats.js';
import * as MD from './models.js';

const { mesh, group } = MD;
const DS = THREE.DoubleSide;
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
const C = new THREE.Color(), C2 = new THREE.Color();
// vật liệu dùng màu theo đỉnh (được cache vì không có texture)
const vc = (rough = 0.5, extra = {}) => mat('#FFFFFF', rough, 0, Object.assign({ vertexColors: true }, extra));
const lathe = (pts, material, segs = 40) => mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs), material);

/* ——— gộp khối: tô màu đỉnh, biến đổi, gộp nhiều hình thành một ——— */
// color: mã màu, hoặc hàm (c, x, y, z, ny) → tô vào c (toạ độ lúc chưa biến đổi)
function paint(g, color, name = 'color') {
  const p = g.attributes.position, n = g.attributes.normal, a = new Float32Array(p.count * 3);
  if (typeof color !== 'function') C.set(color);
  for (let i = 0; i < p.count; i++) {
    if (typeof color === 'function') color(C, p.getX(i), p.getY(i), p.getZ(i), n ? n.getY(i) : 0);
    a[i * 3] = C.r; a[i * 3 + 1] = C.g; a[i * 3 + 2] = C.b;
  }
  g.setAttribute(name, new THREE.BufferAttribute(a, 3));
  return g;
}
const M4 = new THREE.Matrix4(), QQ = new THREE.Quaternion(), EE = new THREE.Euler(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3();
function part(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scale = 1, raw) {
  if (color !== null) paint(geo, color);
  if (raw !== undefined) paint(geo, raw, 'colorRaw');
  EE.set(rot[0], rot[1], rot[2]); QQ.setFromEuler(EE);
  if (typeof scale === 'number') S3.setScalar(scale); else S3.set(scale[0], scale[1], scale[2]);
  geo.applyMatrix4(M4.compose(P3.set(pos[0], pos[1], pos[2]), QQ, S3));
  if (geo.attributes.uv) geo.deleteAttribute('uv');
  if (!geo.index) { const n = geo.attributes.position.count, idx = new Uint32Array(n); for (let i = 0; i < n; i++) idx[i] = i; geo.setIndex(new THREE.BufferAttribute(idx, 1)); }
  return geo;
}
function merge(parts) {
  const names = Object.keys(parts[0].attributes);
  let nv = 0, ni = 0; parts.forEach(g => { nv += g.attributes.position.count; ni += g.index.count; });
  const out = new THREE.BufferGeometry(), arr = {};
  names.forEach(k => { arr[k] = new Float32Array(nv * parts[0].attributes[k].itemSize); });
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  parts.forEach(g => {
    names.forEach(k => arr[k].set(g.attributes[k].array, vo * g.attributes[k].itemSize));
    const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx[io++] = ia[i] + vo;
    vo += g.attributes.position.count; g.dispose();
  });
  names.forEach(k => out.setAttribute(k, new THREE.BufferAttribute(arr[k], parts[0].attributes[k].itemSize)));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}
// Khối có hai bộ màu (sống → chín): userData.cook(t) đổi màu dần, không cấp phát bộ nhớ mới
function cookable(m) {
  const g = m.geometry, col = g.attributes.color, raw = g.attributes.colorRaw.array, done = col.array.slice();
  g.deleteAttribute('colorRaw');
  m.userData.cook = t => { const a = col.array; for (let i = 0; i < a.length; i++) a[i] = raw[i] + (done[i] - raw[i]) * t; col.needsUpdate = true; };
  return m;
}

// Vùng chạm vô hình (dễ nhặt các nhóm có khe hở: tôm, nhánh rau, nhúm bí…) — tia chạm vẫn trúng vật ẩn
const PAD = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
export function hitPad(r = 0.3, y = 0.05) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 16), PAD); m.rotation.x = -Math.PI / 2; m.position.y = y; m.visible = false; m.name = 'pad'; return m; }

/* ——— texture riêng (vẽ một lần, dùng suốt) ——— */
const TX = {};
const weaveTex = () => TX.weave || (TX.weave = (() => {
  const t = canvasTexture(256, 256, (g, w) => {
    g.clearRect(0, 0, w, w); const n = 8, c = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const over = (i + j) % 2, x = j * c, y = i * c;
      g.fillStyle = over ? '#E9C483' : '#CF9F55';
      if (over) g.fillRect(x + 1, y + 5, c - 2, c - 10); else g.fillRect(x + 5, y + 1, c - 10, c - 2);
      g.fillStyle = 'rgba(255,245,215,.45)'; if (over) g.fillRect(x + 2, y + 7, c - 4, 3); else g.fillRect(x + 7, y + 2, 3, c - 4);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 3); return t;
})());

/* ═════════ LÁ RAU (lưới dọc lá, mép gợn sóng, cong lòng máng) ═════════ */
export function leafGeo(o = {}) {
  const { len = 1, wid = 0.5, shape = s => Math.pow(Math.sin(Math.PI * s), 0.7), cup = 0.2, ruffle = 0, freq = 5, arch = 0.06,
    ns = 14, nt = 8, mid = '#CFEAA0', edge = '#5DB83A', tip = null, tipK = 0.6, wave = 0, wfreq = 7 } = o;
  const pos = [], col = [], idx = [], cm = new THREE.Color(mid), ce = new THREE.Color(edge), ct = tip ? new THREE.Color(tip) : null, ph = rnd(0, 6);
  for (let i = 0; i <= ns; i++) {
    const s = i / ns, w = wid * 0.5 * Math.max(0.02, shape(s)) * (1 + wave * Math.sin(wfreq * Math.PI * s + ph * 2));
    for (let j = 0; j <= nt; j++) {
      const t = (j / nt) * 2 - 1, a = Math.abs(t);
      const y = cup * a * a * w + ruffle * a * a * a * Math.sin(freq * TAU * s + ph + t * 1.3) * wid * 0.5 + arch * Math.sin(Math.PI * s) * len;
      pos.push((s - 0.5) * len, y, t * w);
      C.copy(cm).lerp(ce, Math.min(1, Math.pow(a, 0.55)));
      if (ct) C.lerp(ct, Math.pow(s, 2.5) * tipK * (0.4 + 0.6 * a));
      col.push(C.r, C.g, C.b);
    }
  }
  for (let i = 0; i < ns; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + 1, c = a + nt + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const LETTUCE = s => Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * s)), 0.5) * (0.7 + 0.38 * s);
export function lettuceGeo(len = 1.2, wid = 0.8, wilted = false) {
  return leafGeo({ len, wid, shape: LETTUCE, ruffle: wilted ? 0.16 : 0.2, freq: wilted ? 3 : 3.5, cup: wilted ? 0.55 : 0.22, arch: wilted ? 0.0 : 0.04, ns: 34, nt: 12,
    wave: wilted ? 0.05 : 0.07, wfreq: 9, mid: wilted ? '#F1DC8A' : '#E4F6A8', edge: wilted ? '#C99A36' : '#63BD3E', tip: wilted ? '#94622A' : '#4FAA35', tipK: wilted ? 0.85 : 0.3 });
}
export const leafMat = () => vc(0.55, { side: DS });
// Một lá xà lách (lá úa: wilted)
export function lettuceLeaf(material, wilted = false, len = 1.15) {
  const m = mesh(lettuceGeo(len, len * 0.68, wilted), material || leafMat()); m.castShadow = false;
  return group(wilted ? 'lá úa' : 'xà lách', m, hitPad(len * 0.36, 0.06));
}
// Hai lá xà lách chồng nhau
export function lettuceBunch(material) {
  const g = group('lettuce'), mt = material || leafMat();
  [[0, 0, 0.05, 0], [0.12, 0.03, -0.08, 0.25]].forEach(([x, y, z, r], i) => { const m = mesh(lettuceGeo(1.25 - i * 0.12, 0.82), mt, x, y, z); m.rotation.y = r; m.castShadow = false; g.add(m); });
  g.add(hitPad(0.5, 0.06));
  return g;
}
// Nhánh rau thơm (húng): cọng nhỏ + lá bầu dục
export function herbSprig(material) {
  const parts = [part(new THREE.CylinderGeometry(0.014, 0.018, 0.72, 5), '#6BA83A', [0, 0.03, 0], [0, 0, Math.PI / 2])];
  [[-0.18, 1.1], [-0.12, -1.0], [0.04, 0.9], [0.1, -0.85], [0.22, 0.6], [0.26, -0.55], [0.36, 0]].forEach(([x, yaw], i) => {
    const L = 0.3 - i * 0.012, lg = leafGeo({ len: L, wid: L * 0.62, cup: 0.35, arch: 0.08, ns: 8, nt: 6, mid: '#6CCB57', edge: '#2A8B3C' });
    parts.push(part(lg, null, [x + Math.cos(yaw) * L * 0.45, 0.04 + i * 0.004, Math.sin(yaw) * L * 0.45], [0, -yaw, 0]));
  });
  const m = mesh(merge(parts), material || leafMat()); m.castShadow = false;
  return group('rau thơm', m, hitPad(0.32, 0.05));
}

/* ═════════ RỔ TRE, THÙNG RÁC ═════════ */
export function basket(scale = 1) {
  const g = group('basket');
  g.add(lathe([[0.001, 0], [0.5, 0], [0.75, 0.1], [0.95, 0.32], [1.05, 0.5]], mat('#FFFFFF', 0.8, 0, { map: weaveTex(), alphaTest: 0.5, side: DS }), 36));
  const rimM = mat('#B8864A', 0.65);
  const rim = mesh(new THREE.TorusGeometry(1.05, 0.055, 8, 40), rimM, 0, 0.5, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  const foot = mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 28), rimM, 0, 0.03, 0); foot.rotation.x = Math.PI / 2; g.add(foot);
  g.userData.profile = [[0.45, 0.04], [0.75, 0.12], [0.95, 0.33], [1.02, 0.48]];
  g.scale.setScalar(scale);
  return g;
}
export function trashBin() {
  const g = group('bin'), body = mat('#6CC3BA', 0.45, 0, { side: DS }), lidM = mat('#4FA69C', 0.4);
  g.add(mesh(new THREE.CylinderGeometry(0.56, 0.47, 0.95, 28, 1, true), body, 0, 0.475, 0));
  const bot = mesh(new THREE.CircleGeometry(0.47, 24), body, 0, 0.01, 0); bot.rotation.x = -Math.PI / 2; g.add(bot);
  const inside = mesh(new THREE.CircleGeometry(0.53, 24), mat('#2F5F5A', 0.9), 0, 0.72, 0); inside.rotation.x = -Math.PI / 2; g.add(inside);
  const rim = mesh(new THREE.TorusGeometry(0.56, 0.04, 8, 32), lidM, 0, 0.95, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  const hinge = group('lid'); hinge.position.set(0, 0.97, -0.56); hinge.rotation.x = -1.95; g.add(hinge);
  hinge.add(mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.07, 28), lidM, 0, 0, 0.56));
  g.add(mesh(new RoundedBoxGeometry(0.34, 0.08, 0.2, 2, 0.03), lidM, 0, 0.05, 0.52));
  // lá nhỏ màu trắng in trên thân (ký hiệu bỏ rác)
  const leaf = mesh(new THREE.CircleGeometry(0.13, 16), mat('#FFFFFF', 0.5), 0, 0.5, 0.53); leaf.scale.set(0.7, 1, 1); leaf.rotation.x = -0.09; g.add(leaf);
  return g;
}

/* ═════════ BÁNH MÌ ═════════ */
export function cucumber(material) {
  const geo = paint(new THREE.CapsuleGeometry(0.17, 1.1, 6, 18), (c, x, y, z) => {
    const a = Math.atan2(z, x), st = 0.5 + 0.5 * Math.sin(a * 7 + y * 3);
    c.set('#2C7A2F').lerp(C2.set('#78B444'), st * 0.38 + (Math.sin(y * 40 + a * 5) > 0.93 ? 0.35 : 0));
  });
  geo.rotateZ(Math.PI / 2);
  const m = mesh(geo, material || glossy('#FFFFFF', 0.35, 0, { vertexColors: true }), 0, 0.17, 0);
  const nub = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.08, 8), mat('#8A7A3A', 0.7), -0.73, 0.17, 0); nub.rotation.z = Math.PI / 2;
  return group('cucumber', m, nub);
}
function cucumberSliceGeo() {
  const parts = [
    part(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 22), '#3B8A34'),
    part(new THREE.CylinderGeometry(0.178, 0.178, 0.054, 22), '#CDEAA2'),
    part(new THREE.CylinderGeometry(0.1, 0.1, 0.058, 16), '#EEF8D6'),
  ];
  for (let i = 0; i < 6; i++) { const a = i * 1.047 + 0.3; parts.push(part(new THREE.SphereGeometry(0.018, 6, 4), '#FFFBE8', [Math.cos(a) * 0.058, 0.03, Math.sin(a) * 0.058], [0, -a, 0], [1.5, 0.35, 1])); }
  return merge(parts);
}
// Lát dưa leo cắt xéo (hình bầu dục) xếp hàng dọc trục x
export function cucumberSlices(n = 5) {
  const g = group('cucumberSlices'), geo = cucumberSliceGeo();
  for (let i = 0; i < n; i++) {
    const m = mesh(geo, glossy('#FFFFFF', 0.3, 0, { vertexColors: true }), (i - (n - 1) / 2) * 0.23, 0.05 + (i % 2) * 0.012, (i % 2 ? 0.03 : -0.03));
    m.scale.set(1.45, 1, 1); m.rotation.set(0, 0, (i - (n - 1) / 2) * -0.12); g.add(m);
  }
  g.add(hitPad(0.16 * n, 0.06));
  return g;
}

// Ổ bánh mì: nửa dưới + nửa trên có bản lề phía sau (setOpen(góc)), ruột bánh trắng, tai bánh vàng ươm
export function baguette(o = {}) {
  const L = o.len || 2.3, R = o.r || 0.34, N = 22, K = 0.82;
  const prof = s => Math.max(0.035, R * Math.pow(Math.sin(Math.PI * s), 0.5));
  const pts = []; for (let i = 0; i <= N; i++) { const s = i / N; pts.push(new THREE.Vector2(prof(s), (s - 0.5) * L)); }
  const crustCol = (c, x, y, z) => {
    const k = Math.abs(x) / (L / 2), up = y / (R * K);
    c.set('#E7A142');
    c.lerp(C2.set('#B9621D'), Math.max(0, up) * 0.62 + Math.max(0, Math.sin(x * 9 + z * 5)) * 0.1);
    c.lerp(C2.set('#8C4513'), Math.pow(k, 4) * 0.8);
    c.lerp(C2.set('#F0BE72'), Math.max(0, -up) * 0.6);
  };
  const half = top => {
    const g = new THREE.LatheGeometry(pts, 24, top ? Math.PI : 0, Math.PI);
    g.rotateZ(-Math.PI / 2); g.scale(1, K, 1);
    return paint(g, crustCol);
  };
  const sh = new THREE.Shape();
  for (let i = 0; i <= N; i++) { const s = i / N, x = (s - 0.5) * L * 0.985, r = prof(s) * 0.9; i ? sh.lineTo(x, r) : sh.moveTo(x, r); }
  for (let i = N; i >= 0; i--) { const s = i / N; sh.lineTo((s - 0.5) * L * 0.985, -prof(s) * 0.9); }
  const faceGeo = new THREE.ShapeGeometry(sh, 2); faceGeo.rotateX(-Math.PI / 2);
  const crust = glossy('#FFFFFF', 0.38, 0, { vertexColors: true, side: DS }), crumb = mat('#FBE2B2', 0.9, 0, { side: DS });
  const g = group('banhmi');
  const body = group('body'); body.position.y = R * K; g.add(body);
  body.add(mesh(half(false), crust));
  const f1 = mesh(faceGeo, crumb, 0, 0.004, 0); f1.castShadow = false; body.add(f1);
  const fill = group('fill'); fill.position.y = 0.01; body.add(fill);
  const hinge = group('hinge'); hinge.position.set(0, 0, -R * 0.93); body.add(hinge);
  const top = group('top'); top.position.set(0, 0, R * 0.93); hinge.add(top);
  top.add(mesh(half(true), crust));
  const f2 = mesh(faceGeo, crumb, 0, -0.004, 0); f2.castShadow = false; top.add(f2);
  const rg = new THREE.CapsuleGeometry(0.05, 0.36, 4, 8); rg.rotateZ(Math.PI / 2); rg.rotateY(0.5); rg.scale(1, 0.55, 1);
  [-0.66, 0, 0.66].forEach(x => top.add(mesh(rg, glossy('#F4C977', 0.4), x, R * K - 0.012, 0)));
  g.userData = { fill, hinge, top, R, L, setOpen(a) { hinge.rotation.x = -a; } };
  return g;
}

// Trứng ốp la: lòng trắng lượn sóng + viền giòn vàng + lòng đỏ bóng. setCook(0..1): sống (trong) → chín (trắng đục, viền vàng giòn)
function disc(R, segs, rings, radial, height, color) {
  const pos = [0, height(0), 0], col = [], idx = [];
  if (color) { color(C, 0, 0); col.push(C.r, C.g, C.b); }
  for (let k = 1; k <= rings; k++) {
    const f = k / rings;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * TAU, r = R * f * (1 + (radial(a) - 1) * f);
      pos.push(Math.cos(a) * r, height(f, a), Math.sin(a) * r);
      if (color) { color(C, f, a); col.push(C.r, C.g, C.b); }
    }
  }
  const ring = k => 1 + (k - 1) * segs;
  for (let i = 0; i < segs; i++) idx.push(0, ring(1) + ((i + 1) % segs), ring(1) + i);
  for (let k = 1; k < rings; k++) for (let i = 0; i < segs; i++) {
    const a = ring(k) + i, b = ring(k) + ((i + 1) % segs), c = ring(k + 1) + i, d = ring(k + 1) + ((i + 1) % segs);
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (color) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const RAW_WHITE = new THREE.Color('#E9E6DC'), COOK_WHITE = new THREE.Color('#FFFFFF'), RAW_YOLK = new THREE.Color('#FF9800'), COOK_YOLK = new THREE.Color('#FFAC12');
export function friedEgg(cooked = false) {
  const g = group('friedEgg'), R = 0.5;
  const ph = rnd(0, 6), wob = a => 1 + 0.08 * Math.sin(3 * a + ph) + 0.05 * Math.sin(5 * a + ph * 2);
  const white = mesh(disc(R, 44, 6, wob, f => 0.05 * (1 - f * f) + 0.012), cooked ? mat('#FFFFFF', 0.45) : own(new THREE.MeshStandardMaterial({ color: RAW_WHITE, roughness: 0.1, transparent: true, opacity: 0.55 })));
  white.castShadow = false; g.add(white);
  const lace = mesh(disc(R * 1.1, 72, 3, a => wob(a) * (1 + 0.035 * Math.sin(9 * a) + 0.025 * Math.sin(14 * a + 1) + 0.015 * Math.sin(23 * a)), () => 0.004,
    (c, f) => c.set('#F5D38A').lerp(C2.set('#C4843A'), smooth((f - 0.6) / 0.4))), glossy('#FFFFFF', 0.5, 0, { vertexColors: true }));
  lace.castShadow = false; g.add(lace);
  const yolk = mesh(new THREE.SphereGeometry(0.16, 24, 12, 0, TAU, 0, Math.PI / 2), cooked ? glossy('#FFA90F', 0.2) : own(new THREE.MeshStandardMaterial({ color: RAW_YOLK, roughness: 0.08 })), 0.04, 0.045, -0.02);
  yolk.scale.y = 0.72; g.add(yolk);
  g.userData.yolk = yolk;
  g.userData.setCook = t => {
    lace.visible = t > 0.2; lace.scale.setScalar(0.82 + 0.18 * smooth((t - 0.2) / 0.8));
    if (cooked) return;
    white.material.color.lerpColors(RAW_WHITE, COOK_WHITE, t); white.material.opacity = 0.55 + 0.45 * smooth(t * 1.3); white.material.roughness = 0.1 + 0.35 * t;
    yolk.material.color.lerpColors(RAW_YOLK, COOK_YOLK, t); yolk.material.roughness = 0.08 + 0.12 * t;
  };
  g.userData.setCook(cooked ? 1 : 0);
  return g;
}
export function soySpot() {
  const m = mesh(new THREE.CircleGeometry(0.055, 14), glossy('#4A2412', 0.08)); m.rotation.x = -Math.PI / 2; m.scale.set(1, 0.8, 1); m.castShadow = false;
  return m;
}
export function spatula() {
  const g = group('spatula'), metal = mat('#DDE3EA', 0.25, 0.8);
  g.add(mesh(new RoundedBoxGeometry(0.5, 0.025, 0.42, 2, 0.01), metal, 0, 0, 0));
  const neck = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), metal, 0.42, 0.08, 0); neck.rotation.z = Math.PI / 2 + 0.4; g.add(neck);
  const h = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.75, 10), mat('#8A5A36', 0.6), 0.95, 0.3, 0); h.rotation.z = Math.PI / 2 + 0.4; g.add(h);
  return g;
}
// Vị trí nhân trong bánh mì (toạ độ mặt cắt): rau xà lách, dưa leo, trứng ốp la
export const FILL = [{ p: [0.02, 0.0, 0.2], s: [1, 0.55, 0.85] }, { p: [-0.05, 0.05, 0.1], s: [1, 1, 0.9] }, { p: [0.12, 0.11, 0.2], s: [1, 1, 0.62] }];
export const BREAD_OPEN = 0.5;
// Bánh mì kẹp đầy đủ: rau, dưa leo, trứng, xì dầu — dùng cho món hoàn chỉnh
export function filledBaguette() {
  const b = baguette(), f = b.userData.fill;
  FILL.forEach((sp, i) => { const o = [lettuceBunch, () => cucumberSlices(5), () => friedEgg(true)][i](); o.position.set(...sp.p); o.scale.set(...sp.s); f.add(o); if (i === 2) [[0.1, -0.05], [-0.2, 0.1], [0.32, 0.08]].forEach(([x, z]) => { const s = soySpot(); s.position.set(x, 0.07, z); o.add(s); }); });
  b.userData.setOpen(BREAD_OPEN);
  return b;
}

/* ═════════ GỎI CUỐN ═════════ */
// Con tôm (đã bóc vỏ): các đốt cong hình chữ C + đuôi. flat < 1: tôm bổ đôi dẹt. raw: có màu sống để luộc (cook(t))
const SHRIMP = { band: ['#FF6A3D', '#FF9468'], belly: '#FFE8DC', tail: '#F2502A', rband: ['#9DAEB5', '#B5C3C8'], rbelly: '#D9E1E3', rtail: '#8395A0' };
export function shrimpGeo(flat = 1, raw = false) {
  const parts = [], n = 7, Rc = 0.17;
  const colorFn = (band, belly) => (c, x, y, z) => { c.set(band).lerp(C2.set(belly), smooth(z * 1.2 + 0.25)); if (y > 0.4) c.lerp(C2.set(band), 0.3); };
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1), a = -0.25 + f * 3.3, r = 0.085 * (1 - f * 0.5), b = i % 2;
    const geo = new THREE.SphereGeometry(1, 12, 8);
    parts.push(part(geo, colorFn(SHRIMP.band[b], SHRIMP.belly), [Math.cos(a) * Rc, r * 0.85 * flat, Math.sin(a) * Rc], [0, -(a + Math.PI / 2), 0], [r * 1.3, r * 0.85 * flat, r], raw ? colorFn(SHRIMP.rband[b], SHRIMP.rbelly) : undefined));
  }
  const at = -0.25 + 3.3 + 0.28;
  [-0.5, 0.5].forEach(s => {
    const a = at + s * 0.12, geo = new THREE.SphereGeometry(1, 10, 6);
    parts.push(part(geo, SHRIMP.tail, [Math.cos(a) * (Rc + s * 0.03), 0.03 * flat, Math.sin(a) * (Rc + s * 0.03)], [0, -(at + Math.PI / 2) + s * 0.7, 0], [0.1, 0.022 * flat + 0.01, 0.05], raw ? SHRIMP.rtail : undefined));
  });
  return merge(parts);
}
export function shrimp(o = {}) {
  const m = mesh(o.geo || shrimpGeo(o.flat ?? 1, !!o.raw), glossy('#FFFFFF', 0.3, 0, { vertexColors: true }));
  m.position.set(-0.02, 0, -0.1); // đặt tâm con tôm gần gốc toạ độ
  if (o.raw) { cookable(m); m.userData.cook(0); }
  const g = group('shrimp', m); g.userData.cook = m.userData.cook;
  return g;
}
// Thịt ba chỉ luộc: lớp da, mỡ, nạc. block: miếng to (sống → chín), slice: lát mỏng
const PORK = { skin: '#EDCBA8', fat: '#FFF4EA', lean: '#D9876E', rskin: '#F4D6C4', rfat: '#FFE8E4', rlean: '#DB4F4F' };
const porkLayer = (f, cooked) => f > 0.88 ? (cooked ? PORK.skin : PORK.rskin) : f > 0.68 ? (cooked ? PORK.fat : PORK.rfat) : f > 0.42 ? (cooked ? PORK.lean : PORK.rlean) : f > 0.3 ? (cooked ? PORK.fat : PORK.rfat) : (cooked ? PORK.lean : PORK.rlean);
export function porkBlock() {
  const h = 0.3, geo = new RoundedBoxGeometry(0.72, h, 0.44, 3, 0.05);
  const fn = cooked => (c, x, y) => c.set(porkLayer((y + h / 2) / h, cooked));
  const m = cookable(mesh(merge([part(geo, fn(true), [0, h / 2, 0], [0, 0, 0], 1, fn(false))]), glossy('#FFFFFF', 0.4, 0, { vertexColors: true })));
  m.userData.cook(0);
  const g = group('pork', m); g.userData.cook = m.userData.cook;
  return g;
}
export function porkSlices(n = 4, spread = 0.2) {
  const d = 0.26, geo = merge([part(new RoundedBoxGeometry(0.62, 0.035, d, 3, 0.014), (c, x, y, z) => c.set(porkLayer((z + d / 2) / d, true)), [0, 0.02, 0])]);
  const g = group('porkSlices');
  for (let i = 0; i < n; i++) { const m = mesh(geo, glossy('#FFFFFF', 0.38, 0, { vertexColors: true }), 0, i * 0.028, (i - (n - 1) / 2) * spread); m.rotation.y = (i - 1) * 0.08; m.rotation.x = 0.06; g.add(m); }
  if (n > 1) g.add(hitPad(0.36, 0.06));
  return g;
}
// Bó bún (sợi trắng mảnh)
export function bunGeo(len = 0.8, n = 26, wide = 0.12) {
  const parts = [];
  for (let i = 0; i < n; i++) {
    const pts = [], z0 = rnd(-wide, wide), y0 = rnd(0.02, 0.1);
    for (let k = 0; k < 6; k++) { const f = k / 5; pts.push(new THREE.Vector3((f - 0.5) * len * rnd(0.85, 1.05), 0.014 + y0 * Math.sin(Math.PI * f) + rnd(-0.015, 0.015), z0 * (0.55 + 0.45 * Math.sin(Math.PI * f)) + rnd(-0.03, 0.03))); }
    parts.push(part(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4, false), i % 4 ? '#FBFAF4' : '#EDE8DA'));
  }
  return merge(parts);
}
export function bun(len, n, wide) { return group('bun', mesh(bunGeo(len, n, wide), glossy('#FFFFFF', 0.32, 0, { vertexColors: true })), hitPad(0.4, 0.06)); }

// Bánh tráng + nhân, cuộn được: setRoll(Lr) cuộn từ mép gần (z+) về phía xa; 0 = trải phẳng, 2R = cuộn xong.
const DRY = new THREE.Color('#F2E3C6'), WET = new THREE.Color('#FFFFFF');
export function paperMat() { return own(new THREE.MeshStandardMaterial({ color: DRY.clone(), map: tex.ricePaper(), roughness: 0.62, transparent: true, opacity: 0.94, side: DS, depthWrite: false })); }
export function setWet(m, t) { m.color.lerpColors(DRY, WET, t); m.opacity = 0.94 - 0.44 * t; m.roughness = 0.62 - 0.46 * t; }
export function riceRoll(o = {}) {
  const R = o.R || 0.82, W = o.W || 0.56, rho = o.rho || 0.21, th = 0.03, N = 30, sh = o.shared || {};
  const g = group('goicuon'), inner = group('inner'); g.add(inner);
  // lưới vuông ánh xạ vào hình tròn; các cuốn đã cuộn xong (món hoàn chỉnh) dùng chung một lưới
  const owns = !sh.paper || o.dynamic;
  let geo = owns ? null : sh.paper;
  if (owns) {
    const cnt = (N + 1) * (N + 1), pos = new Float32Array(cnt * 3), nor = new Float32Array(cnt * 3), uv = new Float32Array(cnt * 2), idx = [];
    const X = new Float32Array(cnt), Uu = new Float32Array(cnt);
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) {
      const k = i * (N + 1) + j, a = (j / N) * 2 - 1, b = (i / N) * 2 - 1;
      X[k] = a * Math.sqrt(1 - (b * b) / 2) * R; Uu[k] = R - b * Math.sqrt(1 - (a * a) / 2) * R; uv[k * 2] = j / N; uv[k * 2 + 1] = i / N;
    }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const a = i * (N + 1) + j, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, c, d, b); }
    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.userData = { X0: X, U: Uu };
    if (!o.dynamic) sh.paper = geo;
  }
  let X0, U;
  X0 = geo.userData.X0; U = geo.userData.U;
  const material = o.material || paperMat();
  const paper = mesh(geo, material, 0, 0.004, 0); paper.castShadow = false; paper.renderOrder = 3; inner.add(paper);
  // nhân: rau + bún + thịt thành một bó (lõi), tôm xếp một hàng phía trên
  const core = group('core'); inner.add(core);
  const lt = mesh(sh.leaf || (sh.leaf = lettuceGeo(1.02, 0.34)), leafMat(), 0, -0.035, 0.02); lt.castShadow = false; core.add(lt);
  // cọng hẹ thò ra một đầu cuốn (đặc trưng của gỏi cuốn)
  const he = mesh(sh.he || (sh.he = new THREE.CylinderGeometry(0.014, 0.014, 1.3, 5)), mat('#3E9E3A', 0.45), 0.42, 0.05, -0.04); he.rotation.set(0, 0.06, Math.PI / 2); he.castShadow = false; lt.add(he);
  const bn = mesh(sh.bun || (sh.bun = bunGeo(0.95, 22, 0.07)), glossy('#FFFFFF', 0.32, 0, { vertexColors: true }), 0, -0.03, -0.01); core.add(bn);
  const pk = group('pork'); core.add(pk);
  [-0.24, 0.24].forEach((x, i) => { const s = porkSlices(1); s.position.set(x, 0.015, -0.02 + i * 0.03); s.rotation.y = i ? 0.15 : -0.1; pk.add(s); });
  const shrimps = group('shrimps'); inner.add(shrimps);
  const sg = sh.shrimp || (sh.shrimp = shrimpGeo(0.45));
  [-0.36, 0, 0.36].forEach((x, i) => { const s = shrimp({ geo: sg }); s.position.x = x; s.scale.set(0.9, 1, 0.62); s.userData.x = x; s.rotation.y = i * 0.3 - 0.3; s.userData.ry = s.rotation.y; shrimps.add(s); });
  const uC = 0.4, uS = 0.92, coreY = 0.06;
  const parts = { lettuce: lt, bun: bn, pork: pk, shrimp: shrimps };
  let Lr = 0, Rout = rho, zc = R;
  const rAt = u => rho + (th * u) / (TAU * rho);
  function setRoll(v) {
    Lr = Math.max(0, Math.min(2 * R, v)); Rout = rAt(Lr); zc = R - Lr;
    if (owns) {
      const p = geo.attributes.position.array, n = geo.attributes.normal.array;
      for (let k = 0; k < U.length; k++) {
        const u = U[k], x0 = X0[k];
        if (u >= Lr) { p[k * 3] = x0; p[k * 3 + 1] = 0; p[k * 3 + 2] = R - u; n[k * 3] = 0; n[k * 3 + 1] = 1; n[k * 3 + 2] = 0; }
        else {
          const a = Lr - u, t = a / rho, r = rAt(u), f = smooth(a / 0.32), xc = Math.max(-W, Math.min(W, x0));
          p[k * 3] = x0 + (xc - x0) * f; p[k * 3 + 1] = Rout - r * Math.cos(t); p[k * 3 + 2] = zc + r * Math.sin(t);
          n[k * 3] = 0; n[k * 3 + 1] = Math.cos(t); n[k * 3 + 2] = -Math.sin(t);
        }
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.normal.needsUpdate = true; geo.computeBoundingSphere();
    }
    // lõi nhân: nằm phẳng → vào giữa cuộn
    const dc = Lr - uC, kc = smooth((dc + rho * 1.3) / (rho * 1.3 + 0.05)), tc = Math.max(0, dc) / rho;
    core.position.set(0, coreY + (Rout - coreY) * kc, (R - uC) + (zc - (R - uC)) * kc); core.rotation.x = -tc;
    core.scale.set(1, 1 - 0.25 * kc, 1 - 0.25 * kc);
    // tôm: nằm phẳng → dán theo lớp bánh tráng
    const ds = Lr - uS, ts = Math.max(0, ds) / rho, rs = rAt(uS) - 0.03;
    shrimps.children.forEach(s => {
      if (ds <= 0) { s.position.set(s.userData.x, 0.012, R - uS); s.rotation.set(0, s.userData.ry, 0); }
      else { s.position.set(s.userData.x * (1 - 0.12 * smooth(ds / 0.3)), Rout - rs * Math.cos(ts), zc + rs * Math.sin(ts)); s.rotation.set(-ts, s.userData.ry * (1 - smooth(ds / 0.3)) * 0.6, 0); }
    });
  }
  setRoll(o.rolled ? 2 * R : 0);
  // đưa tâm cuộn về gốc toạ độ của nhóm (dùng khi đã cuộn xong)
  const recenter = () => { inner.position.set(0, 0, -zc); return zc; };
  if (o.rolled) recenter();
  g.userData = { R, W, rho, parts, material, paper, inner, setRoll, recenter, get Lr() { return Lr; }, spot: { lettuce: [0, 0.03, R - uC], bun: [0, 0.06, R - uC], pork: [0, 0.09, R - uC], shrimp: [0, 0.03, R - uS] } };
  if (!o.rolled) Object.values(parts).forEach(p => { p.visible = !!o.filled; });
  return g;
}
// Chén nước chấm tương đen: đậu phộng rang giã nhỏ + tương ớt
export function sauceBowl(scale = 0.46) {
  const b = MD.bowl(scale), s = MD.fill(b, glossy('#4B2111', 0.1), 0.72), y = s.position.y + 0.006;
  const chili = mesh(new THREE.CircleGeometry(0.2, 20), glossy('#D8401F', 0.12), 0.18, y, 0.12); chili.rotation.x = -Math.PI / 2; chili.scale.set(1, 0.75, 1); chili.castShadow = false; b.add(chili);
  const nuts = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.06, 0), mat('#FFFFFF', 0.6), 16), o = new THREE.Object3D();
  for (let i = 0; i < 16; i++) {
    const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * 0.32;
    o.position.set(Math.cos(a) * r - 0.08, y + 0.02, Math.sin(a) * r - 0.06); o.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); o.scale.set(rnd(0.7, 1.2), 0.6, rnd(0.7, 1)); o.updateMatrix();
    nuts.setMatrixAt(i, o.matrix); nuts.setColorAt(i, C.set(Math.random() < 0.5 ? '#E3B36A' : '#C98C43'));
  }
  nuts.castShadow = false; b.add(nuts);
  [[0.25, 0.02], [0.05, 0.22], [0.3, 0.22]].forEach(([x, z]) => { const r = mesh(new THREE.TorusGeometry(0.045, 0.02, 6, 12), glossy('#E0201A', 0.25), x, y + 0.01, z); r.rotation.x = Math.PI / 2; r.castShadow = false; b.add(r); });
  return b;
}
// Đĩa gỏi cuốn: vị trí 3 cuốn và chén nước chấm (toạ độ trong đĩa)
export const ROLL_SLOTS = [[-0.62, -0.3, 0.55], [-0.2, 0.02, 0.55], [0.22, 0.34, 0.55]];
export const SAUCE_SLOT = [0.66, -0.42];
export function goiCuonPlate() {
  const p = MD.plate(1.15), sh = {}, mt = paperMat(); setWet(mt, 1);
  ROLL_SLOTS.forEach(([x, z, ry]) => { const r = riceRoll({ rolled: true, shared: sh, material: mt }); r.position.set(x, 0.075, z); r.rotation.y = ry; p.add(r); });
  const s = sauceBowl(); s.position.set(SAUCE_SLOT[0], 0.075, SAUCE_SLOT[1]); p.add(s);
  return p;
}
// Bát nước để nhúng bánh tráng
export function waterBowl() { const b = MD.bowl(1.2); b.userData.water = MD.fill(b, own(new THREE.MeshStandardMaterial({ color: '#7FC4F0', roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false })), 0.72); return b; }

/* ═════════ CANH BÍ ĐỎ ═════════ */
export function pumpkin(material) {
  const R = 0.62, geo = new THREE.SphereGeometry(R, 40, 26), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x), lat = y / R, rib = 0.5 + 0.5 * Math.cos(a * 8), k = 0.92 + 0.08 * Math.sqrt(rib) * Math.sqrt(Math.max(0, 1 - lat * lat));
    x *= k; z *= k; y *= 0.74; if (Math.abs(lat) > 0.78) y *= 1 - 0.3 * (Math.abs(lat) - 0.78) / 0.22;
    p.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  paint(geo, (c, x, y, z) => {
    const a = Math.atan2(z, x), rib = 0.5 + 0.5 * Math.cos(a * 8), lat = y / (R * 0.74);
    c.set('#F7A233').lerp(C2.set('#D7650E'), Math.pow(1 - rib, 3) * 0.9).lerp(C2.set('#B87A22'), smooth((lat - 0.55) / 0.4) * 0.6);
    if (Math.sin(a * 23 + y * 17) > 0.9) c.lerp(C2.set('#FFD27A'), 0.35);
  });
  const g = group('pumpkin');
  const body = mesh(geo, material || glossy('#FFFFFF', 0.4, 0, { vertexColors: true }), 0, R * 0.74, 0); g.add(body);
  const stem = mesh(new THREE.CylinderGeometry(0.055, 0.09, 0.3, 8), mat('#8A9A45', 0.6), 0.05, R * 1.48, 0); stem.rotation.z = -0.45; g.add(stem);
  const cap = mesh(new THREE.SphereGeometry(0.058, 10, 6), mat('#B5A35A', 0.7), 0.12, R * 1.48 + 0.13, 0); g.add(cap);
  g.userData.body = body;
  return g;
}
export function peelStrip() {
  const geo = paint(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10, 1, true, 0, 1.6), (c, x, y, z, ny) => c.set('#C9650F').lerp(C2.set('#6F8A2A'), 0.25));
  const m = mesh(geo, mat('#FFFFFF', 0.6, 0, { vertexColors: true, side: DS })); m.rotation.set(rnd(-0.5, 0.5), rnd(0, 6), Math.PI / 2 + rnd(-0.3, 0.3));
  return group('peel', m);
}
// Nhúm bí đỏ cắt khối (InstancedMesh)
export function cubePile(material, n = 6, spread = 0.2) {
  const im = new THREE.InstancedMesh(new RoundedBoxGeometry(0.2, 0.2, 0.2, 2, 0.045), material, n), o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const layer = i < 4 ? 0 : 1, a = (i % 4) * 1.57 + (layer ? 0.8 : 0) + rnd(-0.2, 0.2), r = layer ? spread * 0.35 : spread * rnd(0.6, 0.8);
    o.position.set(Math.cos(a) * r, 0.1 + layer * 0.17, Math.sin(a) * r); o.rotation.set(rnd(-0.2, 0.2), rnd(0, 3), rnd(-0.2, 0.2)); o.scale.setScalar(rnd(0.9, 1.1)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  }
  return group('bí', im, hitPad(0.3, 0.2));
}
// Khối bí trong canh (nổi lấp ló trên mặt nước canh)
export function soupChunks(material, n, radius, y) {
  const im = new THREE.InstancedMesh(new RoundedBoxGeometry(0.2, 0.2, 0.2, 2, 0.05), material, n), o = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(-0.3, 0.3), r = i === 0 ? 0 : radius * rnd(0.35, 0.95);
    o.position.set(Math.cos(a) * r, y + rnd(-0.02, 0.05), Math.sin(a) * r); o.rotation.set(rnd(-0.6, 0.6), rnd(0, 3), rnd(-0.6, 0.6)); o.scale.setScalar(rnd(0.85, 1.1)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  }
  im.castShadow = false;
  return im;
}
// Bọt sôi lăn tăn trên mặt nồi: userData.tick(dt), .on (độ sôi 0..1), .y (độ cao mặt nước)
export function bubbleField(n = 24, radius = 0.8) {
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 6), own(new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.08, transparent: true, opacity: 0.75 })), n);
  im.castShadow = false; im.frustumCulled = false; im.renderOrder = 2;
  const b = []; for (let i = 0; i < n; i++) b.push({ x: 0, z: 0, t: Math.random(), s: rnd(0.025, 0.07), sp: rnd(0.8, 1.8) });
  const o = new THREE.Object3D();
  im.userData.on = 0; im.userData.y = 0;
  im.userData.tick = dt => {
    const on = im.userData.on;
    for (let i = 0; i < n; i++) {
      const q = b[i]; q.t += dt * q.sp * (0.4 + on);
      if (q.t >= 1) { q.t -= 1; const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * radius; q.x = Math.cos(a) * r; q.z = Math.sin(a) * r; }
      const k = Math.sin(q.t * Math.PI) * q.s * Math.min(1, on);
      o.position.set(q.x, im.userData.y + k * 0.2, q.z); o.scale.set(k, k * 0.55, k); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  };
  im.userData.tick(0);
  return im;
}
export function ladle() {
  const g = group('ladle'), m = mat('#DDE3EA', 0.2, 0.85, { side: DS });
  const cup = mesh(new THREE.SphereGeometry(0.24, 20, 10, 0, TAU, Math.PI / 2, Math.PI / 2), m); cup.scale.y = 0.75; g.add(cup);
  const rim = mesh(new THREE.TorusGeometry(0.24, 0.018, 6, 24), m); rim.rotation.x = Math.PI / 2; g.add(rim);
  const h = mesh(new THREE.CylinderGeometry(0.028, 0.034, 1.4, 8), m, 0.5, 0.5, 0); h.rotation.z = -0.78; g.add(h);
  const soup = mesh(new THREE.CircleGeometry(0.2, 20), glossy(SOUP_COLOR, 0.14), 0, -0.05, 0); soup.rotation.x = -Math.PI / 2; soup.visible = false; g.add(soup);
  g.userData.soup = soup;
  return g;
}
// Đồ trang trí: hành lá thái (vòng xanh nhỏ)
export function onionRings() {
  const parts = [];
  for (let i = 0; i < 6; i++) { const a = rnd(0, TAU), r = rnd(0, 0.12); parts.push(part(new THREE.TorusGeometry(0.045, 0.014, 5, 12), i % 3 ? '#3FA535' : '#D5F0B4', [Math.cos(a) * r, 0.016, Math.sin(a) * r], [Math.PI / 2 + rnd(-0.3, 0.3), rnd(-0.3, 0.3), 0])); }
  const m = mesh(merge(parts), vc(0.45)); m.castShadow = false;
  return group('garnish-hanh', m);
}
// Váng mỡ nhỏ lấp lánh trên mặt canh
export function oilDots(n = 7, radius = 0.6, y = 0) {
  const parts = [];
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * radius; parts.push(part(new THREE.CircleGeometry(rnd(0.03, 0.06), 12), '#FFD76E', [Math.cos(a) * r, y, Math.sin(a) * r], [-Math.PI / 2, 0, 0])); }
  const m = mesh(merge(parts), glossy('#FFFFFF', 0.05, 0, { vertexColors: true })); m.castShadow = false;
  return group('oil', m);
}
export const SOUP_COLOR = '#F2922A';
export function pumpkinSoupBowl() {
  const b = MD.bowl(1.12);
  const soup = MD.fill(b, glossy(SOUP_COLOR, 0.14), 0.8), y = soup.position.y;
  b.add(soupChunks(glossy('#F4700C', 0.3), 10, 0.62, y - 0.02));
  b.add(oilDots(8, 0.62, y + 0.004));
  [[-0.2, 0.25], [0.3, -0.1], [-0.35, -0.3], [0.1, 0.45]].forEach(([x, z]) => { const h = onionRings(); h.position.set(x, y, z); h.rotation.y = rnd(0, 6); b.add(h); });
  [[0.35, 0.3], [-0.45, 0.05], [0.05, -0.4]].forEach(([x, z]) => { const n = MD.garnish('ngo'); n.position.set(x, y + 0.01, z); n.rotation.y = rnd(0, 6); b.add(n); });
  const t = MD.garnish('tieu'); t.position.set(0, y + 0.01, 0.05); b.add(t);
  return b;
}

/* ═════════ RAU MUỐNG XÀO TỎI ═════════ */
const stalkCol = (base, top, cut) => (c, x, y, z, ny) => { c.set(base).lerp(C2.set(top), clamp01(y * 1.2 + 0.5)); if (Math.abs(ny) > 0.9) c.set(cut); };
const SPEAR = s => Math.pow(Math.sin(Math.PI * Math.pow(s, 0.75)), 0.85);
function spinachLeaf(L, cooked) {
  return leafGeo({ len: L, wid: L * 0.4, shape: SPEAR, cup: cooked ? 0.4 : 0.15, arch: cooked ? rnd(-0.1, 0.12) : 0.04, ns: 10, nt: 6,
    mid: cooked ? '#4FA23A' : '#76C95A', edge: cooked ? '#1F6E2A' : '#2F8F30', ruffle: cooked ? 0.25 : 0 });
}
// Bó rau muống dài nằm dọc trục x, chia sẵn thành các khúc tại vị trí ngắt (cuts)
export function spinachBunch(material, cuts = [-0.75, -0.2, 0.35, 0.9], len = 2.7, n = 6) {
  const x0 = -len / 2, x1 = len / 2, edges = [x0, ...cuts, x1], cols = edges.slice(0, -1).map(() => []);
  const colOf = x => { let c = 0; while (c < cuts.length && x > cuts[c]) c++; return c; };
  for (let s = 0; s < n; s++) {
    const z = (s - (n - 1) / 2) * 0.1 + rnd(-0.015, 0.015), y = 0.05 + (s % 3) * 0.035, start = x0 + rnd(0, 0.12), end = x1 - rnd(0, 0.2);
    for (let c = 0; c < cols.length; c++) {
      const a = Math.max(start, edges[c] + 0.008), b = Math.min(end, edges[c + 1] - 0.008); if (b - a < 0.05) continue;
      cols[c].push(part(new THREE.CylinderGeometry(0.04, 0.045, b - a, 8, 1), stalkCol('#A6D873', '#8CC95E', '#E4F5C8'), [(a + b) / 2, y, z], [0, 0, Math.PI / 2]));
    }
    let side = s % 2 ? 1 : -1;
    for (let x = -0.55 + rnd(0, 0.2); x < end - 0.12; x += rnd(0.3, 0.42)) {
      const L = rnd(0.42, 0.56) * (x > 0.8 ? 0.8 : 1), yaw = side * rnd(0.55, 0.95); side = -side;
      cols[colOf(x)].push(part(spinachLeaf(L, false), null, [x + Math.cos(yaw) * L * 0.5, y + 0.03, z + Math.sin(yaw) * L * 0.5], [0, -yaw, 0]));
    }
    const tipYaw = rnd(-0.3, 0.3);
    cols[cols.length - 1].push(part(spinachLeaf(0.34, false), null, [end + 0.14, y + 0.03, z + Math.sin(tipYaw) * 0.15], [0, -tipYaw, 0]));
  }
  const g = group('rauMuong');
  g.userData.cols = cols.map((parts, i) => {
    const xc = (edges[i] + edges[i + 1]) / 2, geo = merge(parts); geo.translate(-xc, 0, 0);
    const m = mesh(geo, material || vc(0.45, { side: DS }), xc, 0, 0); g.add(m); return m;
  });
  g.userData.cuts = cuts;
  return g;
}
// Đĩa/chảo rau muống xào: đụn khúc rau bóng dầu + tỏi phi vàng
export function stirFry(o = {}) {
  const rad = o.radius || 0.66, h = o.height || 0.4, parts = [];
  const at = (k = 1) => { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * rad; return [Math.cos(a) * r, 0.04 + h * (1 - (r / rad) ** 2) * rnd(0.55, 1) * k, Math.sin(a) * r * 0.9]; };
  for (let i = 0; i < 52; i++) {
    const L = rnd(0.22, 0.38);
    parts.push(part(new THREE.CylinderGeometry(0.036, 0.04, L, 7, 1), stalkCol(i % 3 ? '#7CC24A' : '#95D25B', '#5FAE3A', '#CFEAA8'), at(), [rnd(-0.3, 0.3) + Math.PI / 2, rnd(0, TAU), rnd(-0.4, 0.4)]));
  }
  for (let i = 0; i < 46; i++) parts.push(part(spinachLeaf(rnd(0.32, 0.5), true), null, at(1.08), [rnd(-0.5, 0.5), rnd(0, TAU), rnd(-0.5, 0.5)]));
  const pile = mesh(merge(parts), glossy('#FFFFFF', 0.24, 0, { vertexColors: true, side: DS }));
  const g = group('rauXao', pile);
  const bits = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.03, 0), mat('#FFFFFF', 0.4), 46), q = new THREE.Object3D();
  for (let i = 0; i < 46; i++) { const p = at(1.12); q.position.set(p[0], p[1] + 0.03, p[2]); q.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); q.scale.set(rnd(0.8, 1.3), rnd(0.6, 1), rnd(0.8, 1.2)); q.updateMatrix(); bits.setMatrixAt(i, q.matrix); bits.setColorAt(i, C.set(Math.random() < 0.5 ? '#EDB24A' : '#D98E2B')); }
  bits.castShadow = false; g.add(bits);
  g.userData = { pile, garlic: bits };
  return g;
}
export function rauMuongPlate() {
  const p = MD.plate(0.95);
  const sheen = mesh(new THREE.CircleGeometry(0.62, 28), glossy('#D9B44A', 0.05, 0, { transparent: true, opacity: 0.22 }), 0, 0.078, 0); sheen.rotation.x = -Math.PI / 2; sheen.castShadow = false; p.add(sheen);
  const s = stirFry(); s.position.y = 0.075; p.add(s);
  return p;
}
// Tép tỏi còn vỏ: cloves[i] = { flesh, skin }
export function garlicCloves(n = 3) {
  const g = group('garlic'), cl = [];
  const pts = [[0.001, 0], [0.09, 0.01], [0.14, 0.07], [0.155, 0.14], [0.13, 0.22], [0.08, 0.3], [0.025, 0.37], [0.001, 0.385]].map(([x, y]) => new THREE.Vector2(x, y));
  const fleshGeo = new THREE.LatheGeometry(pts, 18); fleshGeo.scale(1, 1, 0.72);
  const skinGeo = paint(new THREE.LatheGeometry(pts.map(v => new THREE.Vector2(v.x * 1.12 + 0.004, v.y * 1.06)), 18), (c, x, y, z) => { const a = Math.atan2(z, x); c.set('#EDD9C4').lerp(C2.set('#B27A98'), Math.pow(Math.abs(Math.sin(a * 5 + y * 4)), 8) * 0.6 + (y < 0.08 ? 0.35 : 0)); });
  skinGeo.scale(1, 1, 0.72);
  const spots = [[-0.28, 0.06, 0.4], [0.22, -0.12, -0.35], [0.05, 0.2, 2.6]];
  for (let i = 0; i < n; i++) {
    const c = group('clove'); const [x, z, ry] = spots[i % 3]; c.position.set(x, 0.15, z); c.rotation.set(0, ry, Math.PI / 2 - 0.15);
    const flesh = mesh(fleshGeo, glossy('#FFF4D8', 0.35)); c.add(flesh);
    const skin = mesh(skinGeo, own(new THREE.MeshStandardMaterial({ color: '#FFFFFF', vertexColors: true, roughness: 0.85, transparent: true, opacity: 0.96, side: DS })), 0, -0.01, 0); c.add(skin);
    g.add(c); cl.push({ clove: c, flesh, skin });
  }
  g.userData.cloves = cl;
  return g;
}
export function skinFlake() {
  const m = mesh(new THREE.CircleGeometry(0.07, 7), mat('#F2E4D2', 0.85, 0, { side: DS })); m.scale.set(1, 0.6, 1); m.rotation.set(rnd(0, 3), rnd(0, 3), 0); m.castShadow = false;
  return m;
}
// Tỏi băm (InstancedMesh), đổi màu vàng khi phi: dùng vật liệu riêng
export function mincedGarlic(material, n = 44, spread = 0.26) {
  const im = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.03, 0), material, n), o = new THREE.Object3D();
  for (let i = 0; i < n; i++) { const a = rnd(0, TAU), r = Math.sqrt(Math.random()) * spread; o.position.set(Math.cos(a) * r, 0.02 + (1 - r / spread) * 0.06 * Math.random(), Math.sin(a) * r); o.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
  im.castShadow = false;
  return group('tỏi băm', im);
}
export function wok() {
  const g = group('wok'), m = mat('#35302F', 0.36, 0.55, { side: DS });
  g.add(lathe([[0.001, 0.02], [0.45, 0.04], [0.85, 0.18], [1.15, 0.42], [1.28, 0.62], [1.24, 0.64], [1.1, 0.45], [0.82, 0.22], [0.43, 0.09], [0.001, 0.08]], m, 44));
  const h = mesh(new THREE.CylinderGeometry(0.075, 0.085, 1.3, 12), mat('#8A5A36', 0.6), 2.0, 0.72, 0); h.rotation.z = Math.PI / 2 - 0.15; g.add(h);
  const neck = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), m, 1.36, 0.63, 0); neck.rotation.z = Math.PI / 2 - 0.15; g.add(neck);
  const loop = mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 14, Math.PI), m, -1.3, 0.6, 0); loop.rotation.set(Math.PI / 2, 0, Math.PI / 2); g.add(loop);
  g.userData.profile = [[0.001, 0.08], [0.43, 0.09], [0.82, 0.22], [1.1, 0.45]];
  return g;
}
// Kiềng 3 chân đặt trên bếp ga: nâng chảo lên cao để thấy lửa xanh cháy bên dưới (mặt kiềng ở y = h)
export function potStand(h = 0.26) {
  const g = group('kiềng'), m = mat('#2A2628', 0.5, 0.6);
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 30), m, 0, h - 0.02, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; g.add(mesh(new THREE.BoxGeometry(0.07, h, 0.12), m, Math.cos(a) * 0.62, h / 2, Math.sin(a) * 0.62)); }
  return g;
}
// Vòng tròn đánh dấu chỗ đặt (nhấp nháy)
export function spotRing(r = 1) {
  const m = mesh(new THREE.RingGeometry(r * 0.86, r, 40), own(new THREE.MeshBasicMaterial({ color: '#FF5C9A', transparent: true, opacity: 0.85, depthWrite: false })), 0, 0.02, 0);
  m.rotation.x = -Math.PI / 2; m.castShadow = false; m.receiveShadow = false;
  return m;
}
