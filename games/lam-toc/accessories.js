// accessories.js — phụ kiện 3D gắn lên đầu (nơ, kẹp ngôi sao, hoa, bờm tai mèo, vương miện) và tai thú của khách

import { THREE, toon, Tweens, Ease } from '../../kit/three-kit.js';
import { ellPoint, EX, EY, EZ, CAP_H } from './hair.js';

const _p = new THREE.Vector3(), _n = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _m = new THREE.Matrix4();
const UP = new THREE.Vector3(0, 1, 0), FWD = new THREE.Vector3(0, 0, 1);

// Đặt obj lên mặt đầu tại (a, θ) cao h; mode 'face': mặt trước (+z) hướng ra ngoài; 'up': trục +y hướng ra ngoài
export function placeOnHead(obj, a, th, h, mode = 'face') {
  ellPoint(a, th, h, _p);
  const s = Math.sin(th);
  _n.set(s * Math.sin(a) / EX, Math.cos(th) / EY, s * Math.cos(a) / EZ).normalize();
  if (mode === 'face') {
    _z.copy(_n); _x.crossVectors(UP, _z); if (_x.lengthSq() < 1e-4) _x.set(1, 0, 0); _x.normalize(); _y.crossVectors(_z, _x);
  } else {
    _y.copy(_n); _x.crossVectors(_y, FWD); if (_x.lengthSq() < 1e-4) _x.set(1, 0, 0); _x.normalize(); _z.crossVectors(_x, _y);
  }
  _m.makeBasis(_x, _y, _z); obj.quaternion.setFromRotationMatrix(_m); obj.position.copy(_p);
  return obj;
}

const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; return m; };

function makeBow() {
  const g = new THREE.Group(), pink = toon('#FF7FAA'), dark = toon('#FF5C9A');
  const lobe = new THREE.SphereGeometry(1, 20, 14);
  [-1, 1].forEach(s => {
    const l = mesh(lobe, pink, s * 0.24, 0.02, 0); l.scale.set(0.26, 0.19, 0.11); l.rotation.z = s * 0.35; g.add(l);
    const t = mesh(new THREE.CapsuleGeometry(0.06, 0.2, 4, 10), pink, s * 0.1, -0.2, 0.02); t.rotation.z = s * 0.45; t.scale.z = 0.6; g.add(t);
  });
  const knot = mesh(new THREE.SphereGeometry(0.1, 16, 12), dark); knot.scale.set(1, 1, 0.8); g.add(knot);
  return g;
}
function makeStar() {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.11 : 0.25, a = Math.PI / 2 + i * Math.PI / 5; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) sh.lineTo(x, y); else sh.moveTo(x, y); }
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 4, curveSegments: 4 });
  geo.center();
  const g = new THREE.Group();
  g.add(mesh(geo, toon('#FFD34D', { emissive: '#FFB800', emissiveIntensity: 0.18 })));
  const clip = mesh(new THREE.CapsuleGeometry(0.035, 0.34, 4, 8), toon('#B7C4D8'), 0, -0.02, -0.07); clip.rotation.z = Math.PI / 2; g.add(clip);
  return g;
}
function makeFlower() {
  const g = new THREE.Group(), petal = new THREE.SphereGeometry(1, 16, 12), pm = toon('#FFB3CF');
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5 + 0.3, p = mesh(petal, pm, Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0);
    p.scale.set(0.12, 0.17, 0.06); p.rotation.z = a - Math.PI / 2; g.add(p);
  }
  const c = mesh(new THREE.SphereGeometry(0.09, 16, 12), toon('#FFD34D'), 0, 0, 0.04); c.scale.z = 0.7; g.add(c);
  const leaf = mesh(petal, toon('#7FD8A0'), 0.2, -0.18, -0.03); leaf.scale.set(0.07, 0.14, 0.04); leaf.rotation.z = 0.9; g.add(leaf);
  return g;
}
function makeCatBand() {
  const g = new THREE.Group(), lil = toon('#B48BF0'), pinkIn = toon('#FFB3CF');
  const hb = 0.23, tilt = -0.32;
  const arc = new THREE.Group(); arc.rotation.x = tilt; g.add(arc);
  const band = mesh(new THREE.TorusGeometry(1, 0.055, 10, 48, Math.PI * 1.08), lil);
  band.rotation.z = -Math.PI * 0.04; band.scale.set(EX + hb, EY + hb, 1); arc.add(band);
  [-1, 1].forEach(s => {
    const phi = s * 0.72, ex = Math.sin(phi) * (EX + hb + 0.02), ey = Math.cos(phi) * (EY + hb + 0.02);
    const ear = new THREE.Group(); ear.position.set(ex, ey, 0); ear.rotation.z = -phi; arc.add(ear);
    const o = mesh(new THREE.ConeGeometry(0.2, 0.36, 4, 1), lil, 0, 0.14, 0); o.rotation.y = Math.PI / 4; o.scale.z = 0.5; ear.add(o);
    const i = mesh(new THREE.ConeGeometry(0.12, 0.24, 4, 1), pinkIn, 0, 0.12, 0.05); i.rotation.y = Math.PI / 4; i.scale.z = 0.3; ear.add(i);
  });
  return g;
}
function makeCrown() {
  const g = new THREE.Group(), gold = toon('#FFC53D', { emissive: '#FFB000', emissiveIntensity: 0.15 });
  const ring = mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.2, 28, 1, true), gold, 0, 0.1, 0); ring.material.side = THREE.DoubleSide; g.add(ring);
  const spike = new THREE.ConeGeometry(0.09, 0.26, 12), ball = new THREE.SphereGeometry(0.05, 12, 8), bm = toon('#FFF3B0');
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, x = Math.sin(a) * 0.36, z = Math.cos(a) * 0.36;
    g.add(mesh(spike, gold, x, 0.32, z)); g.add(mesh(ball, bm, x * 1.02, 0.47, z * 1.02));
  }
  const gem = new THREE.SphereGeometry(0.06, 12, 10), gm = [toon('#FF5C9A'), toon('#7FC4FF')];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; const s = mesh(gem, gm[i % 2], Math.sin(a) * 0.37, 0.1, Math.cos(a) * 0.37); s.scale.z = 0.6; s.lookAt(Math.sin(a) * 2, 0.1, Math.cos(a) * 2); g.add(s); }
  return g;
}

// vị trí từng phụ kiện: (a, θ, cao, kiểu đặt, cỡ)
const SPOTS = {
  bow:    [0.8, 0.52, CAP_H + 0.16, 'face', 1.15],
  star:   [-1.12, 0.9, CAP_H + 0.24, 'face', 0.9],
  flower: [-0.72, 0.46, CAP_H + 0.22, 'face', 1],
  crown:  [0, 0.06, CAP_H - 0.02, 'up', 1],
};

export class Accessories {
  constructor(head) {
    this.head = head; this.on = {};
    this.items = { bow: makeBow(), star: makeStar(), flower: makeFlower(), catband: makeCatBand(), crown: makeCrown() };
    for (const [k, obj] of Object.entries(this.items)) {
      const sp = SPOTS[k];
      if (sp) { placeOnHead(obj, sp[0], sp[1], sp[2], sp[3]); obj.userData.s = sp[4]; } else obj.userData.s = 1;
      obj.scale.setScalar(obj.userData.s); obj.visible = false; head.add(obj);
      this.on[k] = false;
    }
  }
  set(k, on, animate = true) {
    const obj = this.items[k]; if (!obj) return;
    this.on[k] = on; Tweens.kill(obj.scale);
    const s = obj.userData.s;
    if (on) {
      obj.visible = true;
      if (animate) { obj.scale.setScalar(0.01); Tweens.add(obj.scale, { x: s, y: s, z: s }, 0.5, { ease: Ease.outBack }); } else obj.scale.setScalar(s);
    } else if (animate) {
      Tweens.add(obj.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.22, { ease: Ease.inQuad, onDone: () => { if (!this.on[k]) obj.visible = false; } });
    } else obj.visible = false;
  }
  toggle(k) { this.set(k, !this.on[k]); return this.on[k]; }
  any() { for (const k in this.on) if (this.on[k]) return true; return false; }
  save() { return Object.assign({}, this.on); }
  restore(s) { for (const k in this.items) this.set(k, !!s[k], false); }
  reset() { for (const k in this.items) this.set(k, false, false); }
  worldPos(k, out) { return this.items[k].getWorldPosition(out); }
}

/* ——— tai thú của khách (mèo, thỏ) ——— */
export class AnimalEars {
  constructor(head) {
    this.furMat = toon('#F2994A'); this.inMat = toon('#FFB3CF');
    this.cat = new THREE.Group(); this.bunny = new THREE.Group();
    const cone = new THREE.ConeGeometry(0.28, 0.52, 24), coneIn = new THREE.ConeGeometry(0.16, 0.32, 20);
    [-1, 1].forEach(s => {
      const e = new THREE.Group(); placeOnHead(e, s * 0.6, 0.55, CAP_H - 0.02, 'up'); e.rotateZ(-s * 0.12);
      const o = mesh(cone, this.furMat, 0, 0.22, 0); o.scale.z = 0.55; e.add(o);
      const i = mesh(coneIn, this.inMat, 0, 0.17, 0.09); i.scale.z = 0.35; e.add(i);
      this.cat.add(e);
    });
    const cap = new THREE.CapsuleGeometry(0.16, 0.95, 8, 16), capIn = new THREE.CapsuleGeometry(0.085, 0.7, 6, 12);
    [-1, 1].forEach(s => {
      const e = new THREE.Group(); placeOnHead(e, s * 0.34, 0.36, CAP_H - 0.04, 'up'); e.rotateZ(-s * 0.2); e.rotateX(-0.12);
      const o = mesh(cap, this.furMat, 0, 0.6, 0); o.scale.z = 0.6; e.add(o);
      const i = mesh(capIn, this.inMat, 0, 0.62, 0.075); i.scale.z = 0.35; e.add(i);
      this.bunny.add(e);
    });
    this.cat.visible = this.bunny.visible = false;
    head.add(this.cat, this.bunny);
  }
  set(kind, color) {
    this.cat.visible = kind === 'cat'; this.bunny.visible = kind === 'bunny';
    if (color) this.furMat.color.set(color);
  }
}
