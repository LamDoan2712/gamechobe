// outfit.js — mặc đồ cho búp bê: gắn/tháo các món đã dựng sẵn (mỗi món chỉ dựng một lần rồi giữ trong bộ nhớ đệm),
// đổi màu tóc, trang điểm, dang tay khi mặc váy xoè, cầm túi/đũa phép, vẫy tay, đuôi tóc đung đưa.

import { THREE, toon } from '../../kit/three-kit.js';
import { ITEMS, MAKEUP, LIPS, FACE_BASE, HAIR_COLORS, BASE_LOOK } from './data.js';
import { buildItem } from './items.js';
import { buildHair } from './hair.js';
import { disposeGeos } from './geo.js';

export const cloneLook = l => JSON.parse(JSON.stringify(l));

export function faceFor(look) {
  const f = Object.assign({}, FACE_BASE);
  const mk = MAKEUP.find(m => m.id === look.makeup); if (mk) Object.assign(f, mk.face);
  const lp = LIPS.find(l => l.id === look.lips); if (lp) { f.lips = lp.hex; f.lipsAmt = 0.95; }
  return f;
}

// Mặc / cởi một món. Trả về true nếu món đó đang được mặc sau khi chạm.
export function equip(look, kind, id) {
  switch (kind) {
    case 'hair': look.hair = id; return true;
    case 'hairColor': look.hairColor = id; return true;
    case 'makeup': look.makeup = look.makeup === id ? null : id; return !!look.makeup;
    case 'lips': look.lips = look.lips === id ? null : id; return !!look.lips;
  }
  const it = ITEMS[id];
  if (it.cat === 'acc') { look.acc[it.slot] = look.acc[it.slot] === id ? null : id; return !!look.acc[it.slot]; }
  const slot = it.cat, on = look[slot] !== id;
  look[slot] = on ? id : null;
  if (on && slot === 'dress') look.top = look.bottom = null;
  if (on && (slot === 'top' || slot === 'bottom')) look.dress = null;
  return on;
}
export function isWorn(look, kind, id) {
  switch (kind) {
    case 'hair': return look.hair === id;
    case 'hairColor': return look.hairColor === id;
    case 'makeup': return look.makeup === id;
    case 'lips': return look.lips === id;
  }
  const it = ITEMS[id];
  return it.cat === 'acc' ? look.acc[it.slot] === id : look[it.cat] === id;
}
export const itemKeys = look => [look.top, look.bottom, look.dress, look.shoes, look.acc.head, look.acc.face, look.acc.hand, look.acc.neck].filter(Boolean);

const SKIN = '#FFE2CF';

export class Outfit {
  constructor(doll, M, opts = {}) {
    this.doll = doll; this.M = M; this.skin = opts.skin || SKIN;
    this.rig = { body: doll.body, head: doll.head, arm0: doll.arms[0].pivot, arm1: doll.arms[1].pivot, leg0: doll.legs[0].pivot, leg1: doll.legs[1].pivot };
    this.cache = new Map(); this.on = new Map();
    this.hairMat = toon('#8A5536', { side: THREE.DoubleSide });
    this.rainbowMat = toon('#FFFFFF', { side: THREE.DoubleSide, vertexColors: true });
    this.tieMat = M.c('#FF7FAA');
    this.look = BASE_LOOK();
    this.spread = this.spreadTo = 0.18; this.hold = this.holdTo = 0; this.waveT = 0;
    this.hangs = []; this.spins = []; this.sways = [];
    this.q = new THREE.Quaternion();
  }
  build(key) {
    let b = this.cache.get(key);
    if (!b) {
      if (key.startsWith('hair:')) {
        b = buildHair(key.slice(5), this.hairMat, this.tieMat);
        b.hairMeshes = []; b.parts.forEach(p => p.obj.traverse(o => { if (o.material === this.hairMat) b.hairMeshes.push(o); }));
      } else b = buildItem(key, this.M);
      this.cache.set(key, b);
    }
    return b;
  }
  attach(key) { const b = this.build(key); b.parts.forEach(p => { if (p.at) this.rig[p.at].add(p.obj); }); this.on.set(key, b); }
  detach(key) { const b = this.on.get(key); if (b) b.parts.forEach(p => { if (p.at && p.obj.parent) p.obj.parent.remove(p.obj); }); this.on.delete(key); }
  // Mặc cả bộ (chỉ gắn/tháo phần thay đổi)
  apply(look, instant) {
    this.look = cloneLook(look);
    const want = new Set(['hair:' + look.hair, ...itemKeys(look)]);
    for (const k of [...this.on.keys()]) if (!want.has(k)) this.detach(k);
    for (const k of want) if (!this.on.has(k)) this.attach(k);
    // màu tóc
    const hair = this.on.get('hair:' + look.hair), rainbow = look.hairColor === 'rainbow';
    const hc = HAIR_COLORS.find(c => c.id === look.hairColor) || HAIR_COLORS[0];
    if (!rainbow) this.hairMat.color.set(hc.hex);
    hair.hairMeshes.forEach(m => { m.material = rainbow ? this.rainbowMat : this.hairMat; });
    // đội mũ rộng vành thì giấu búi/đuôi tóc phía trên
    const hat = look.acc.head && this.build(look.acc.head).hat;
    hair.parts.forEach(p => { if (p.hatHide) p.obj.visible = !hat; });
    // tóc xoăn bồng bềnh: đẩy đồ đội đầu ra ngoài một chút cho khỏi lấp vào tóc
    if (look.acc.head) {
      const k = hair.puffy ? 1.14 : 1;
      this.build(look.acc.head).parts.forEach(p => {
        const o = p.obj; if (!o.userData.p0) o.userData.p0 = { p: o.position.clone(), s: o.scale.clone() };
        o.position.copy(o.userData.p0.p).multiplyScalar(k); o.scale.copy(o.userData.p0.s).multiplyScalar(k);
      });
    }
    // khuôn mặt
    this.doll.face.set(faceFor(look));
    // tư thế và danh sách phần chuyển động
    let spread = 0.18, hold = false, sock = null;
    this.hangs.length = this.spins.length = this.sways.length = 0;
    for (const [k, b] of this.on) {
      const it = ITEMS[k]; if (it && it.spread) spread = Math.max(spread, it.spread);
      if (b.hold) hold = true;
      if (b.sock !== undefined && it && it.cat === 'shoes') sock = b.sock;
      b.parts.forEach(p => { if (p.hang) this.hangs.push(p.obj); if (p.spin) this.spins.push(p.spin); if (p.sway) this.sways.push(p.obj); });
    }
    this.spreadTo = spread; this.holdTo = hold ? -0.78 : 0;
    const bare = !look.shoes || sock === 'skin';
    this.doll.legs.forEach(l => l.foot.material.color.set(bare ? this.skin : (sock || '#FFFFFF')));
    if (instant) { this.spread = this.spreadTo; this.hold = this.holdTo; this.tick(0, 0); }
  }
  wave() { this.waveT = 1.5; this.doll.face.react({ mouth: 'open', eyes: 'happy' }, 1.3); }
  tick(dt, t) {
    const k = Math.min(1, dt * 7);
    this.spread += (this.spreadTo - this.spread) * k; this.hold += (this.holdTo - this.hold) * k;
    const d = this.doll, a0 = d.arms[0].pivot, a1 = d.arms[1].pivot;
    a0.rotation.z = -this.spread;
    if (this.waveT > 0) { this.waveT -= dt; a1.rotation.z = 2.5 + Math.sin(t * 14) * 0.35; } else a1.rotation.z = this.spread;
    if (!d.walking) a0.rotation.x = this.hold;
    for (let i = 0; i < this.hangs.length; i++) this.hangs[i].quaternion.copy(this.q.copy(a0.quaternion).invert());
    for (let i = 0; i < this.spins.length; i++) this.spins[i].rotation.y = t * 2.2;
    for (let i = 0; i < this.sways.length; i++) { this.sways[i].rotation.z = Math.sin(t * 2.6) * 0.07; this.sways[i].rotation.x = Math.sin(t * 1.9) * 0.05; }
  }
  // Điểm trên búp bê để bắn hạt lấp lánh khi mặc đồ
  anchor(kind, id) {
    const a = this.doll.anchors;
    if (kind === 'hair' || kind === 'hairColor') return a.headTop;
    if (kind === 'makeup' || kind === 'lips') return a.face;
    const it = ITEMS[id];
    if (it.cat === 'acc') return { head: a.headTop, face: a.face, hand: a.handL, neck: a.neck }[it.slot];
    return { top: a.chest, bottom: a.hips, dress: a.waist, shoes: a.footR }[it.cat];
  }
  dispose() {
    for (const k of [...this.on.keys()]) this.detach(k);
    this.cache.forEach(b => b.parts.forEach(p => disposeGeos(p.obj)));
    this.cache.clear();
    this.hairMat.dispose(); this.rainbowMat.dispose();
  }
}
