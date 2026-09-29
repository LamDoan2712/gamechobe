// cake.js — tầng bánh kem 3D: ruột bánh, lớp kem phủ bo tròn, kem chảy, cốm rắc (InstancedMesh), quả mọng,
// và đồ trang trí khi xong màn (dâu tây + nến). Hình khối & vật liệu dùng chung, chỉ tạo một lần.

import { THREE, toon, canvasTexture } from '../../kit/three-kit.js';
import { FLAVORS } from './data.js';

export const LAYER_H = 0.55;      // chiều cao một tầng (tới mặt kem)
const BODY_H = 0.47;              // chiều cao ruột bánh
const CAP_H = 0.13;               // độ dày lớp kem phủ
const DRIPS = 14, SPRINKLES = 22;
const SPRINKLE_COLORS = ['#FF5C9A', '#FFC53D', '#58A8F5', '#5FD0B8', '#B48BF0', '#FFFFFF', '#FF9E6B'].map(c => new THREE.Color(c));
const BERRY = { strawberry: { color: new THREE.Color('#FF4D6D'), n: 4, s: [1, 1.2, 1] }, blueberry: { color: new THREE.Color('#5C5CD6'), n: 6, s: [0.72, 0.66, 0.72] }, cherry: { color: new THREE.Color('#FF3B5C'), n: 3, s: [0.85, 0.85, 0.85] } };

export function createCakeKit() {
  const own = [];               // mọi thứ dùng chung, huỷ khi thoát game
  const keep = x => (own.push(x), x);

  const geo = {
    body: keep(new THREE.CylinderGeometry(1, 1, 1, 40, 1).translate(0, 0.5, 0)),
    // lớp kem: mặt trên phẳng, mép bo tròn
    cap: keep(new THREE.LatheGeometry([
      new THREE.Vector2(0.95, 0), new THREE.Vector2(1.0, 0.025), new THREE.Vector2(1.012, 0.06), new THREE.Vector2(1.0, 0.095),
      new THREE.Vector2(0.975, 0.118), new THREE.Vector2(0.93, CAP_H), new THREE.Vector2(0, CAP_H),
    ], 40)),
    drip: keep(new THREE.CapsuleGeometry(0.07, 0.16, 3, 8)),
    sprinkle: keep(new THREE.CapsuleGeometry(0.022, 0.075, 2, 6)),
    berry: keep(new THREE.SphereGeometry(0.11, 14, 10)),
  };
  const white = keep(toon('#FFFFFF'));
  const mats = {};
  let rainbowTex = null;
  function matsFor(flavor, shade) {
    const k = flavor + shade;
    if (mats[k]) return mats[k];
    const f = FLAVORS[flavor];
    let body;
    if (f.rainbow) {
      rainbowTex = rainbowTex || keep(canvasTexture(8, 256, (g, w, h) => {
        const cols = ['#C9A8F5', '#9ED2FF', '#A8E6A3', '#FFEE8F', '#FFC98A', '#FF9EBB'];
        cols.forEach((c, i) => { g.fillStyle = c; g.fillRect(0, (i * h) / cols.length, w, h / cols.length + 1); });
      }));
      body = keep(toon('#FFFFFF', { map: rainbowTex }));
    } else body = keep(toon(f.body[shade % f.body.length]));
    const frostKey = flavor + 'frost';
    const frost = mats[frostKey] || (mats[frostKey] = keep(toon(f.frost)));
    return (mats[k] = { body, frost });
  }

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const rnd = (a, b) => a + Math.random() * (b - a);

  // Tạo một tầng bánh (gốc toạ độ ở đáy, giữa bánh)
  function createLayer(flavor, R) {
    const f = FLAVORS[flavor] || FLAVORS.dau;
    const { body, frost } = matsFor(flavor, Math.floor(Math.random() * 3));
    const group = new THREE.Group();
    const bodyMesh = new THREE.Mesh(geo.body, body);
    bodyMesh.scale.set(R, BODY_H, R); bodyMesh.castShadow = true; bodyMesh.receiveShadow = true;
    const cap = new THREE.Mesh(geo.cap, frost);
    cap.scale.set(R + 0.05, 1, R + 0.05); cap.position.y = LAYER_H - CAP_H; cap.castShadow = true; cap.receiveShadow = true;
    group.add(bodyMesh, cap);

    // kem chảy quanh mép
    const drips = new THREE.InstancedMesh(geo.drip, frost, DRIPS);
    const a0 = Math.random() * Math.PI * 2;
    for (let i = 0; i < DRIPS; i++) {
      const a = a0 + (i / DRIPS) * Math.PI * 2 + rnd(-0.12, 0.12), len = rnd(0.55, 1.25);
      p.set(Math.cos(a) * (R + 0.02), LAYER_H - 0.07 - 0.15 * len, Math.sin(a) * (R + 0.02));
      s.set(1, len, 1); q.identity();
      drips.setMatrixAt(i, m4.compose(p, q, s));
    }
    drips.instanceMatrix.needsUpdate = true;
    group.add(drips);

    // cốm rắc: rải ở vành ngoài mặt bánh để vẫn thấy khi tầng trên nhỏ hơn
    const spr = new THREE.InstancedMesh(geo.sprinkle, white, SPRINKLES);
    for (let i = 0; i < SPRINKLES; i++) {
      const a = Math.random() * Math.PI * 2, r = R * rnd(0.56, 0.95);
      p.set(Math.cos(a) * r, LAYER_H + 0.018, Math.sin(a) * r);
      e.set(Math.PI / 2, 0, Math.random() * Math.PI); q.setFromEuler(e); s.set(1, 1, 1);
      spr.setMatrixAt(i, m4.compose(p, q, s));
      spr.setColorAt(i, SPRINKLE_COLORS[(Math.random() * SPRINKLE_COLORS.length) | 0]);
    }
    spr.instanceMatrix.needsUpdate = true; spr.instanceColor.needsUpdate = true;
    group.add(spr);

    const parts = [drips, spr];
    // quả mọng trên vành bánh
    const kind = f.berry || (Math.random() < 0.3 ? 'cherry' : null);
    if (kind) {
      const b = BERRY[kind], berries = new THREE.InstancedMesh(geo.berry, white, b.n), b0 = Math.random() * Math.PI;
      for (let i = 0; i < b.n; i++) {
        const a = b0 + (i / b.n) * Math.PI * 2;
        p.set(Math.cos(a) * R * 0.8, LAYER_H + 0.07, Math.sin(a) * R * 0.8); q.identity(); s.set(b.s[0], b.s[1], b.s[2]);
        berries.setMatrixAt(i, m4.compose(p, q, s)); berries.setColorAt(i, b.color);
      }
      berries.instanceMatrix.needsUpdate = true; berries.instanceColor.needsUpdate = true;
      berries.castShadow = true;
      group.add(berries); parts.push(berries);
    }
    return { group, R, flavor, parts, frostColor: f.frost };
  }

  // Gỡ tầng bánh khỏi cảnh và giải phóng bộ đệm riêng của nó (hình khối/vật liệu dùng chung được giữ lại)
  function disposeLayer(layer) {
    if (!layer) return;
    layer.group.removeFromParent();
    for (const im of layer.parts) im.dispose();
    layer.parts.length = 0;
  }

  /* ——— trang trí khi xong màn: dâu tây + 3 cây nến ——— */
  const top = new THREE.Group(); top.name = 'toppings';
  const berryBody = new THREE.Mesh(keep(new THREE.SphereGeometry(0.22, 20, 16)), keep(toon('#FF4D6D')));
  berryBody.scale.set(1, 1.12, 1); berryBody.castShadow = true;
  const leaf = new THREE.Mesh(keep(new THREE.ConeGeometry(0.17, 0.09, 7)), keep(toon('#6CCB6A')));
  leaf.rotation.x = Math.PI; leaf.position.y = 0.24;
  const seedMat = keep(toon('#FFE9A8')), seedGeo = keep(new THREE.SphereGeometry(0.018, 6, 4));
  const strawberry = new THREE.Group(); strawberry.add(berryBody, leaf);
  for (let i = 0; i < 7; i++) { const a = i * 0.9, y = -0.08 + (i % 3) * 0.08; const sd = new THREE.Mesh(seedGeo, seedMat); sd.position.set(Math.cos(a) * 0.2, y, Math.sin(a) * 0.2); strawberry.add(sd); }
  top.add(strawberry);

  const candleGeo = keep(new THREE.CylinderGeometry(0.055, 0.055, 0.42, 14).translate(0, 0.21, 0));
  const wickGeo = keep(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4).translate(0, 0.45, 0));
  const flameGeo = keep(new THREE.SphereGeometry(0.06, 12, 10));
  const flameMat = keep(new THREE.MeshBasicMaterial({ color: '#FFB43B' })), coreMat = keep(new THREE.MeshBasicMaterial({ color: '#FFF6C2' }));
  const wickMat = keep(toon('#5A3A30'));
  const candles = ['#7FC4FF', '#FFC53D', '#B48BF0'].map(col => {
    const tex = keep(canvasTexture(64, 64, (g, w, h) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); g.fillStyle = col;
      for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 22, h); g.lineTo(i * 22 + 11, h); g.lineTo(i * 22 + 11 + 32, 0); g.lineTo(i * 22 + 32, 0); g.closePath(); g.fill(); }
    }));
    const c = new THREE.Group();
    const stick = new THREE.Mesh(candleGeo, keep(toon('#FFFFFF', { map: tex }))); stick.castShadow = true;
    const flame = new THREE.Mesh(flameGeo, flameMat); flame.position.y = 0.55; flame.scale.set(1, 1.7, 1);
    const core = new THREE.Mesh(flameGeo, coreMat); core.scale.set(0.5, 0.6, 0.5); flame.add(core);
    c.add(stick, new THREE.Mesh(wickGeo, wickMat), flame);
    top.add(c);
    return { c, flame };
  });
  top.visible = false;

  const toppings = {
    group: top,
    items: [strawberry, ...candles.map(x => x.c)],
    // Đặt lên mặt tầng bánh trên cùng; trả về danh sách vật để làm hiệu ứng "bật" lần lượt
    attach(layer) {
      const R = layer.R;
      top.position.set(0, LAYER_H, 0); layer.group.add(top); top.visible = true;
      const spot = (o, deg, r, y) => { const a = (deg * Math.PI) / 180; o.position.set(Math.cos(a) * r, y, Math.sin(a) * r); o.scale.setScalar(0.001); };
      spot(strawberry, 125, R * 0.66, 0.2);
      spot(candles[0].c, -35, R * 0.68, 0); spot(candles[1].c, 205, R * 0.7, 0); spot(candles[2].c, 55, R * 0.7, 0);
      candles.forEach(x => (x.flame.visible = false));
      return toppings.items;
    },
    light(i) { if (candles[i]) candles[i].flame.visible = true; },
    detach() { top.removeFromParent(); top.visible = false; },
    tick(t) {
      if (!top.visible) return;
      for (let i = 0; i < candles.length; i++) { const fl = candles[i].flame; fl.scale.y = 1.7 + Math.sin(t * 23 + i * 2.1) * 0.22; fl.scale.x = fl.scale.z = 1 + Math.sin(t * 17 + i) * 0.08; }
    },
  };

  return {
    geo, createLayer, disposeLayer, toppings,
    dispose() { toppings.detach(); for (const x of own) x.dispose(); own.length = 0; },
  };
}
