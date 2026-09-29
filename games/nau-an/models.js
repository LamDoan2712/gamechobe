// models.js — mô hình 3D dùng chung cho Bé Nấu Ăn: dụng cụ bếp (bát Tràng, nồi, nồi cơm điện, chảo, cốc, ca…)
// và nguyên liệu (gạo, cơm, trứng, cam, hành…). Đơn vị: mặt bếp ở y = 0; một cái bát cao ~0.55.
// Vật chứa có userData.profile = [[bán kính, độ cao]…] (lòng trong, từ đáy lên) để đặt mặt nước/thức ăn bên trong.

import { THREE, RoundedBoxGeometry } from '../../kit/three-kit.js';
import { mat, glossy, liquid, own, tex } from './mats.js';

export const mesh = (geo, material, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; };
export const put = (parent, child) => { parent.add(child); return child; };
export const group = (name, ...kids) => { const g = new THREE.Group(); g.name = name || ''; kids.forEach(k => g.add(k)); return g; };
const lathe = (pts, material, segs = 48) => mesh(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), segs), material);
const DS = THREE.DoubleSide;
const rnd = (a, b) => a + Math.random() * (b - a);

/* ——— mặt chất lỏng / thức ăn bên trong vật chứa ——— */
export function radiusAt(profile, y) {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1], [r1, y1] = profile[i];
    if (y <= y1) return r0 + (r1 - r0) * Math.max(0, Math.min(1, (y - y0) / (y1 - y0 || 1)));
  }
  return profile[profile.length - 1][0];
}
// Một mặt phẳng tròn nằm trong vật chứa; setLevel(0..1) nâng/hạ và co giãn theo lòng vật chứa
export function fill(vessel, material, level = 0.5, inset = 0.985) {
  const prof = vessel.userData.profile, y0 = prof[0][1], y1 = prof[prof.length - 1][1];
  const disc = mesh(new THREE.CircleGeometry(1, 48), material); disc.rotation.x = -Math.PI / 2; disc.castShadow = false; disc.renderOrder = 1;
  vessel.add(disc);
  disc.userData.level = -1;
  disc.userData.setLevel = f => {
    f = Math.max(0, Math.min(1, f)); disc.userData.level = f;
    const y = y0 + (y1 - y0) * f, r = radiusAt(prof, y) * inset;
    disc.position.y = y; disc.scale.set(r, r, 1); disc.visible = f > 0.001;
  };
  disc.userData.setLevel(level);
  return disc;
}

/* ——— bát, đĩa (gốm trắng hoa lam) ——— */
export function bowl(scale = 1, { pattern = true, tint = '#FBFAF6' } = {}) {
  const g = group('bowl');
  const outer = [[0.36, 0], [0.44, 0], [0.44, 0.08], [0.52, 0.1], [0.8, 0.3], [0.95, 0.55], [0.935, 0.575]];
  const inner = [[0.915, 0.57], [0.8, 0.37], [0.48, 0.18], [0.001, 0.16]];
  g.add(lathe(outer, pattern ? mat('#FFFFFF', 0.22, 0, { map: tex.batTrang() }) : mat(tint, 0.22)));
  g.add(lathe(inner, mat(tint, 0.2, 0, { side: DS })));
  g.userData.profile = [[0.001, 0.16], [0.48, 0.18], [0.8, 0.37], [0.915, 0.57]];
  g.scale.setScalar(scale);
  return g;
}
export function plate(scale = 1) {
  const g = group('plate');
  g.add(lathe([[0.001, 0.02], [0.6, 0.02], [0.62, 0], [0.7, 0.03], [1.2, 0.1], [1.33, 0.17], [1.31, 0.19], [1.19, 0.13], [0.7, 0.075], [0.001, 0.075]], mat('#FBFAF6', 0.2, 0, { side: DS })));
  const rim = mesh(new THREE.TorusGeometry(1.29, 0.022, 8, 64), mat('#2F5FAE', 0.3), 0, 0.175, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  const ring = mesh(new THREE.TorusGeometry(0.72, 0.012, 6, 64), mat('#3A6CC0', 0.3), 0, 0.078, 0); ring.rotation.x = Math.PI / 2; g.add(ring);
  g.userData.top = 0.08;
  g.scale.setScalar(scale);
  return g;
}

/* ——— nồi inox, chảo, nồi cơm điện ——— */
export function pot({ r = 1.05, h = 1, color = '#DDE3EA', marks = false } = {}) {
  const g = group('pot'), metal = mat(color, 0.2, 0.85, { side: DS });
  g.add(mesh(new THREE.CylinderGeometry(r, r * 0.95, h, 48, 1, true), metal, 0, h / 2, 0));
  const bottom = mesh(new THREE.CircleGeometry(r * 0.95, 48), metal, 0, 0.02, 0); bottom.rotation.x = -Math.PI / 2; g.add(bottom);
  const rim = mesh(new THREE.TorusGeometry(r, 0.04, 8, 48), metal, 0, h, 0); rim.rotation.x = Math.PI / 2; g.add(rim);
  [-1, 1].forEach(s => { const hd = mesh(new THREE.TorusGeometry(0.15, 0.04, 8, 16, Math.PI), mat('#3B3B44', 0.5), s * (r + 0.08), h - 0.15, 0); hd.rotation.set(0, s > 0 ? -Math.PI / 2 : Math.PI / 2, Math.PI / 2); g.add(hd); });
  if (marks) [0.3, 0.45, 0.6].forEach(y => { const m = mesh(new THREE.TorusGeometry(radiusAt([[r * 0.95, 0], [r, h]], y * h) - 0.012, 0.01, 4, 48), mat('#7D8794', 0.4, 0.5), 0, y * h, 0); m.rotation.x = Math.PI / 2; g.add(m); });
  g.userData.profile = [[r * 0.95 - 0.02, 0.03], [r - 0.03, h - 0.04]];
  return g;
}
export function pan() {
  const g = group('pan');
  g.add(lathe([[0.001, 0.03], [0.9, 0.03], [1.2, 0.12], [1.32, 0.3], [1.28, 0.32], [1.16, 0.17], [0.88, 0.08], [0.001, 0.08]], mat('#3A3438', 0.38, 0.35, { side: DS })));
  const hd = mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.5, 12), mat('#8A5A36', 0.6), 2.0, 0.34, 0); hd.rotation.z = Math.PI / 2 - 0.12; g.add(hd);
  put(g, mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), mat('#3A3438', 0.4, 0.4), 1.3, 0.28, 0)).rotation.z = Math.PI / 2 - 0.12;
  g.userData.profile = [[0.001, 0.08], [0.88, 0.085], [1.16, 0.18]];
  return g;
}
export function riceCooker() {
  const g = group('riceCooker'), white = mat('#FFFFFF', 0.3), pink = mat('#FF9EC4', 0.35);
  g.add(lathe([[0.001, 0], [1.25, 0], [1.36, 0.1], [1.42, 0.5], [1.42, 1.1], [1.36, 1.3], [1.22, 1.36], [1.12, 1.36], [1.12, 0.4], [0.001, 0.4]], mat('#FFFFFF', 0.3, 0, { side: DS })));
  const band = mesh(new THREE.CylinderGeometry(1.43, 1.43, 0.18, 48, 1, true), pink, 0, 0.62, 0); g.add(band);
  const panel = mesh(new RoundedBoxGeometry(0.9, 0.5, 0.2, 3, 0.08), pink, 0, 0.9, 1.34); g.add(panel);
  const btn = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.08, 20), white, 0.18, 0.9, 1.46); btn.rotation.x = Math.PI / 2; g.add(btn);
  const light = mesh(new THREE.SphereGeometry(0.06, 12, 10), own(new THREE.MeshStandardMaterial({ color: '#B8B8B8', roughness: 0.3, emissive: '#000000' })), -0.2, 0.95, 1.45); g.add(light);
  const lid = group('lid'); lid.position.set(0, 1.36, -1.15); g.add(lid);
  const dome = mesh(new THREE.SphereGeometry(1.36, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), white, 0, 0, 1.15); dome.scale.y = 0.4; lid.add(dome);
  const knob = mesh(new RoundedBoxGeometry(0.5, 0.14, 0.2, 2, 0.06), pink, 0, 0.55, 1.15); lid.add(knob);
  const vent = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 12), mat('#E6E6E6', 0.4), 0.55, 0.5, 1.2); lid.add(vent);
  g.userData = Object.assign(g.userData, {
    lid, button: btn, light, vent,
    setLid(open) { lid.rotation.x = -open * 1.9; },
    setLight(on) { light.material.color.set(on ? '#FF4D6D' : '#B8B8B8'); light.material.emissive.set(on ? '#FF2D55' : '#000000'); light.material.emissiveIntensity = on ? 1.4 : 0; },
    innerY: 0.4,
  });
  return g;
}

/* ——— cốc, ca nước, thớt, dao, thìa, đũa, vá xới cơm ——— */
const GLASS = () => own(new THREE.MeshStandardMaterial({ color: '#EAF6FF', roughness: 0.05, transparent: true, opacity: 0.28, side: DS, depthWrite: false }));
export function cup() {
  const g = group('cup');
  g.add(mesh(new THREE.CylinderGeometry(0.44, 0.37, 1.1, 36, 1, true), GLASS(), 0, 0.55, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.06, 36), GLASS(), 0, 0.03, 0));
  g.userData.profile = [[0.35, 0.07], [0.42, 1.06]];
  return g;
}
// Chất lỏng dạng khối trong cốc/ca trong suốt (thấy được cả thân nước)
export function liquidBody(vessel, color, opacity = 0.85) {
  const prof = vessel.userData.profile, y0 = prof[0][1], y1 = prof[prof.length - 1][1];
  const body = mesh(new THREE.CylinderGeometry(1, 1, 1, 36), liquid(color, opacity)); body.castShadow = false; body.renderOrder = 2;
  vessel.add(body);
  body.userData.setLevel = f => {
    f = Math.max(0, Math.min(1, f)); body.userData.level = f;
    const top = y0 + (y1 - y0) * f, rTop = radiusAt(prof, top) * 0.97, rBot = prof[0][0] * 0.97;
    body.geometry.dispose(); body.geometry = new THREE.CylinderGeometry(rTop, rBot, Math.max(0.001, top - y0), 36);
    body.position.y = (top + y0) / 2; body.visible = f > 0.005;
  };
  body.userData.setLevel(0);
  return body;
}
export function jug(color = '#9AD4FF') {
  const g = group('jug');
  const shell = own(new THREE.MeshStandardMaterial({ color, roughness: 0.15, transparent: true, opacity: 0.45, side: DS, depthWrite: false }));
  g.add(mesh(new THREE.CylinderGeometry(0.45, 0.4, 1.2, 32, 1, true), shell, 0, 0.6, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05, 32), shell, 0, 0.03, 0));
  const hd = mesh(new THREE.TorusGeometry(0.3, 0.06, 8, 16, Math.PI), mat('#5AA9F2', 0.4), -0.48, 0.65, 0); hd.rotation.z = Math.PI / 2; g.add(hd);
  const spout = mesh(new THREE.ConeGeometry(0.14, 0.3, 12, 1, true), shell, 0.47, 1.12, 0); spout.rotation.z = -Math.PI / 2 - 0.5; g.add(spout);
  g.userData.profile = [[0.38, 0.06], [0.43, 1.15]];
  return g;
}
export function board() {
  const b = mesh(new RoundedBoxGeometry(2.6, 0.14, 1.7, 3, 0.06), mat('#E0A86E', 0.6, 0, { map: tex.wood() }), 0, 0.07, 0);
  return group('board', b);
}
export function knife() {
  const g = group('knife');
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1.1, 0); shape.quadraticCurveTo(1.25, 0.05, 1.2, 0.26); shape.lineTo(0, 0.28); shape.closePath();
  const blade = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false }), mat('#E4E9EF', 0.15, 0.9)); blade.position.set(0, -0.14, -0.01); g.add(blade);
  g.add(mesh(new RoundedBoxGeometry(0.6, 0.18, 0.1, 2, 0.04), mat('#7A4A2A', 0.6), -0.3, 0, 0));
  return g;
}
export function spoon(color = '#E4E9EF', metal = 0.9) {
  const g = group('spoon'), m = mat(color, 0.2, metal, { side: DS });
  const bowlPart = mesh(new THREE.SphereGeometry(0.16, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m); bowlPart.scale.set(1, 0.4, 1.4); g.add(bowlPart);
  const handle = mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 8), m, 0, 0.12, -0.55); handle.rotation.x = Math.PI / 2 - 0.25; g.add(handle);
  return g;
}
export function chopsticks() {
  const g = group('chopsticks'), m = mat('#D9B27A', 0.55);
  [-0.05, 0.05].forEach(x => { const c = mesh(new THREE.CylinderGeometry(0.025, 0.04, 1.8, 8), m, x, 0.9, 0); c.rotation.z = x * 0.6; g.add(c); });
  return g;
}
export function paddle() {
  const g = group('paddle'), m = mat('#F6F6F2', 0.35);
  g.add(mesh(new RoundedBoxGeometry(0.55, 0.06, 0.7, 3, 0.03), m, 0, 0, 0));
  g.add(mesh(new RoundedBoxGeometry(0.16, 0.06, 0.9, 2, 0.03), m, 0, 0, -0.75));
  return g;
}

/* ——— nguyên liệu ——— */
// Gạo sống: các hạt nhỏ nằm trong lòng vật chứa (InstancedMesh)
export function riceGrains(count, radius, height, color = '#FFFCF2') {
  const im = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.028, 0.07, 3, 6), mat(color, 0.35), count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius;
    o.position.set(Math.cos(a) * r, Math.random() * height, Math.sin(a) * r);
    o.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
  }
  im.castShadow = false; im.receiveShadow = true; im.name = 'riceGrains';
  return im;
}
// Cơm chín: một đụn cơm trắng bóng, lổn nhổn hạt
export function cookedRice(r = 0.9, h = 0.55) {
  const g = group('rice');
  const geo = new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + (Math.sin(x * 23) * Math.cos(z * 19) + Math.sin((x + z) * 31)) * 0.02;
    p.setXYZ(i, x * n, y * n, z * n);
  }
  geo.computeVertexNormals();
  const dome = mesh(geo, glossy('#EFE8D8', 0.5)); dome.scale.set(r * 0.97, h * 0.97, r * 0.97); g.add(dome);
  const grains = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.042, 0.1, 3, 6), glossy('#FFFFFB', 0.22), 420);
  const o = new THREE.Object3D(), v = new THREE.Vector3();
  for (let i = 0; i < 420; i++) {
    v.set(rnd(-1, 1), rnd(0.05, 1), rnd(-1, 1)).normalize();
    o.position.set(v.x * r * 1.0, v.y * h * 1.0, v.z * r * 1.0);
    o.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); o.updateMatrix(); grains.setMatrixAt(i, o.matrix);
  }
  grains.castShadow = false; g.add(grains);
  return g;
}
export function sack() {
  const g = group('sack'), burlap = mat('#D8B98A', 0.9, 0, { side: DS });
  g.add(lathe([[0.001, 0], [0.75, 0], [0.9, 0.3], [0.92, 0.9], [0.85, 1.1], [1.0, 1.25], [0.95, 1.3], [0.8, 1.15]], burlap));
  const top = mesh(new THREE.CircleGeometry(0.82, 32), mat('#FFFCF2', 0.6), 0, 1.08, 0); top.rotation.x = -Math.PI / 2; g.add(top);
  const grains = riceGrains(140, 0.75, 0.05); grains.position.y = 1.08; g.add(grains);
  const label = mesh(new THREE.CylinderGeometry(0.925, 0.925, 0.3, 32, 1, true, -0.6, 1.2), mat('#E86A6A', 0.7, 0, { side: DS }), 0, 0.6, 0); g.add(label);
  return g;
}
export function scoop() {
  const g = group('scoop'), m = mat('#FFC53D', 0.4, 0, { side: DS });
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.24, 0.4, 24, 1, true), m, 0, 0.2, 0));
  put(g, mesh(new THREE.CircleGeometry(0.24, 24), m, 0, 0.01, 0)).rotation.x = -Math.PI / 2;
  const h = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), m, 0.4, 0.3, 0); h.rotation.z = Math.PI / 2 - 0.4; g.add(h);
  return g;
}
export function egg() {
  const e = mesh(new THREE.SphereGeometry(0.3, 32, 24), mat('#F6E3C8', 0.55)); e.scale.set(1, 1.28, 1); e.position.y = 0.38;
  return group('egg', e);
}
// Trứng đã đập: lòng trắng + lòng đỏ (đặt trong bát)
export function crackedEgg() {
  const g = group('crackedEgg');
  const white = mesh(new THREE.CircleGeometry(0.42, 24), glossy('#FFFFFF', 0.15, 1, { transparent: true, opacity: 0.8 })); white.rotation.x = -Math.PI / 2; white.scale.set(1, 0.85, 1); white.castShadow = false; g.add(white);
  const yolk = mesh(new THREE.SphereGeometry(0.17, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glossy('#FFA800', 0.2, 1), 0.05, 0.005, 0); yolk.scale.y = 0.75; g.add(yolk);
  return g;
}
export function shellHalf() {
  const s = mesh(new THREE.SphereGeometry(0.3, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#F6E3C8', 0.55, 0, { side: DS })); s.scale.set(1, 1.2, 1);
  return group('shell', s);
}
export function greenOnion(n = 4) {
  const g = group('greenOnion');
  for (let i = 0; i < n; i++) {
    const s = group(); s.position.set(rnd(-0.2, 0.2), 0.06, i * 0.1 - 0.15); s.rotation.set(Math.PI / 2, 0, rnd(-0.1, 0.1) + Math.PI / 2);
    s.add(mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.3, 10), mat('#4CAF3F', 0.5), 0, 0.3, 0));
    s.add(mesh(new THREE.CylinderGeometry(0.065, 0.07, 0.5, 10), mat('#F4F8EC', 0.5), 0, -0.6, 0));
    g.add(s);
  }
  return g;
}
// Nhúm hành lá thái nhỏ (vòng xanh li ti)
export function onionBits(count = 40, spread = 0.5, color = '#4CAF3F') {
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 8, 1, true), mat(color, 0.5, 0, { side: DS }), count);
  const o = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * spread;
    o.position.set(Math.cos(a) * r, Math.random() * 0.06, Math.sin(a) * r); o.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3)); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    im.setColorAt(i, new THREE.Color(Math.random() < 0.25 ? '#DFF3C8' : color));
  }
  im.castShadow = false; im.name = 'bits';
  return im;
}
export function bottle(liquidColor = '#B8621B', cap = '#E53935', label = '#FFE7A8') {
  const g = group('bottle');
  g.add(lathe([[0.001, 0], [0.28, 0], [0.3, 0.05], [0.3, 0.8], [0.12, 1.05], [0.1, 1.25], [0.001, 1.25]], own(new THREE.MeshStandardMaterial({ color: liquidColor, roughness: 0.1, transparent: true, opacity: 0.9 }))));
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.18, 16), mat(cap, 0.4), 0, 1.3, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.305, 0.305, 0.4, 24, 1, true), mat(label, 0.7, 0, { side: DS }), 0, 0.45, 0));
  return g;
}
export function orange() {
  const g = group('orange');
  const o = mesh(new THREE.SphereGeometry(0.42, 32, 24), glossy('#FFFFFF', 0.45, 0.4, { map: tex.orangePeel() }), 0, 0.42, 0); o.scale.y = 0.95; g.add(o);
  g.add(mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.08, 8), mat('#6B8E23', 0.6), 0, 0.84, 0));
  const leaf = mesh(new THREE.SphereGeometry(0.12, 12, 8), mat('#4CAF50', 0.5), 0.1, 0.86, 0); leaf.scale.set(1.6, 0.2, 0.7); g.add(leaf);
  return g;
}
export function orangeHalf() {
  const g = group('orangeHalf');
  const peel = mesh(new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glossy('#FFFFFF', 0.45, 0.4, { map: tex.orangePeel(), side: DS }), 0, 0.42, 0); g.add(peel);
  const face = mesh(new THREE.CircleGeometry(0.415, 32), glossy('#FFFFFF', 0.3, 0.8, { map: tex.orangeCut() }), 0, 0.42, 0); face.rotation.x = -Math.PI / 2; g.add(face);
  return g;
}
export function juicer() {
  const g = group('juicer'), m = GLASS();
  g.add(lathe([[0.001, 0], [0.8, 0], [0.9, 0.08], [0.95, 0.4], [0.9, 0.42], [0.85, 0.12], [0.001, 0.12]], m));
  const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([0.36 * (1 - t) + (i % 2 ? 0.015 : 0), 0.12 + t * 0.5]); }
  g.add(lathe(pts, own(new THREE.MeshStandardMaterial({ color: '#FFF6E8', roughness: 0.2, transparent: true, opacity: 0.8 })), 32));
  g.userData.profile = [[0.4, 0.13], [0.86, 0.38]];
  return g;
}
export function iceCube() {
  const m = mesh(new RoundedBoxGeometry(0.3, 0.3, 0.3, 2, 0.05), own(new THREE.MeshStandardMaterial({ color: '#E3F6FF', roughness: 0.05, transparent: true, opacity: 0.55, depthWrite: false })));
  m.position.y = 0.15; return group('ice', m);
}
export function straw() {
  const s = mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.6, 10), mat('#FF6FA0', 0.4), 0, 0.8, 0);
  return group('straw', s);
}
export function sugarJar() {
  const g = group('sugar');
  g.add(mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.7, 28, 1, true), GLASS(), 0, 0.35, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.45, 28), mat('#FFFFFF', 0.8), 0, 0.23, 0));
  const lid = mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.1, 28), mat('#FF9EC4', 0.4), 0, 0.75, 0); g.add(lid);
  return g;
}
export function omelette(r = 1.05) {
  const side = glossy('#E9A02A', 0.45, 0.6), top = glossy('#FFFFFF', 0.4, 0.7, { map: tex.omelette() });
  const o = mesh(new THREE.CylinderGeometry(r, r * 1.04, 0.12, 48), [side, top, side], 0, 0.06, 0);
  return group('omelette', o);
}
// Đồ trang trí đĩa
export function garnish(kind) {
  const g = group('garnish-' + kind);
  if (kind === 'cachua') {
    const d = mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.05, 24), glossy('#E8392B', 0.3, 0.6)); g.add(d);
    const in1 = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.052, 24), glossy('#FF6F5E', 0.25, 0.7)); g.add(in1);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.add(mesh(new THREE.SphereGeometry(0.035, 8, 6), mat('#FFE9A0', 0.4), Math.cos(a) * 0.1, 0.03, Math.sin(a) * 0.1)); }
  } else if (kind === 'dualeo') {
    g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24), mat('#3E8E3A', 0.5)));
    g.add(mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.052, 24), glossy('#DFF5C8', 0.3, 0.5)));
    for (let i = 0; i < 3; i++) { const a = i * 2.1; g.add(mesh(new THREE.SphereGeometry(0.025, 6, 6), mat('#FFFBE0', 0.4), Math.cos(a) * 0.06, 0.03, Math.sin(a) * 0.06)); }
  } else if (kind === 'ngo') {
    const leafMat = mat('#3FA34D', 0.5, 0, { side: DS });
    for (let i = 0; i < 5; i++) { const l = mesh(new THREE.CircleGeometry(0.1, 6), leafMat, Math.cos(i * 1.25) * 0.12, 0.03 + i * 0.004, Math.sin(i * 1.25) * 0.12); l.rotation.set(-Math.PI / 2 + rnd(-0.3, 0.3), 0, rnd(0, 3)); g.add(l); }
    const stem = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 5), mat('#6BBF59', 0.5), 0, 0.03, 0); stem.rotation.set(Math.PI / 2, 0, 0.6); g.add(stem);
  } else if (kind === 'ot') {
    const ring = mesh(new THREE.TorusGeometry(0.08, 0.035, 8, 20), glossy('#E0201A', 0.3, 0.8)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.03; g.add(ring);
  } else if (kind === 'tieu') {
    for (let i = 0; i < 7; i++) g.add(mesh(new THREE.SphereGeometry(0.025, 6, 5), mat('#2B2420', 0.8), rnd(-0.15, 0.15), 0.02, rnd(-0.15, 0.15)));
  }
  g.traverse(o => { o.castShadow = false; });
  return g;
}
export const GARNISH_NAMES = { cachua: 'Cà chua', dualeo: 'Dưa leo', ngo: 'Rau ngò', ot: 'Ớt', tieu: 'Hạt tiêu' };
