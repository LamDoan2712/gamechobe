// items.js — dựng từng món đồ 3D vừa khít búp bê chibi của kit (createDoll).
// Mỗi món trả về { parts: [{ at, obj, hang?, spin? }], hold?, sock? }:
//   at: 'body' | 'head' | 'arm0' | 'arm1' | 'leg0' | 'leg1' — gắn vào thân, đầu, trục tay/chân (arm0/leg0 ở phía x < 0)
//   hang: đồ cầm tay luôn thẳng đứng dù tay đung đưa; spin: phần tự quay (ngôi sao đũa phép)
// Toạ độ: thân từ hông y 1.2 tới vai y 2.1 (bán kính 0.4 → 0.46); trục tay ở (±0.5, 2.0); trục chân ở (±0.2, 1.2);
// bàn chân tâm (0, -1.06, 0.08) trong trục chân; đầu cầu bán kính 1 (co 1.06, 0.98, 1) tâm y 3.15.

import { THREE, RoundedBoxGeometry, toon } from '../../kit/three-kit.js';
import { printTexture, drawHeart, drawStar } from './mats.js';
import { TAU, V3, lathe, mesh, ruffle, scallop, loosen, ring, tube, heartShape, starShape, extrude, bow, flowerMesh } from './geo.js';

/* ——— biên dạng thân áo (r, y) từ gấu áo lên cổ ——— */
const TOP = [[0.455, 1.1], [0.445, 1.2], [0.44, 1.35], [0.452, 1.55], [0.472, 1.78], [0.492, 1.98], [0.494, 2.08], [0.47, 2.16], [0.41, 2.225], [0.33, 2.27], [0.25, 2.3], [0.212, 2.31]];
const CAMI = [[0.455, 1.1], [0.445, 1.2], [0.44, 1.35], [0.452, 1.55], [0.472, 1.78], [0.488, 1.92], [0.483, 1.96], [0.465, 1.975]];
const UPPER = TOP.filter(p => p[1] >= 1.35);
const BODICE = CAMI.filter(p => p[1] >= 1.35);

const DOUBLE = { side: THREE.DoubleSide };
const part = (at, obj, extra) => Object.assign({ at, obj }, extra);
const both = (prefix, make) => [0, 1].map(i => part(prefix + i, make(i ? 1 : -1)));

/* ——— tay áo (gắn vào trục tay, trục chạy dọc -y) ——— */
function shortSleeve(mat, trim) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0.2, -0.38], [0.197, -0.25], [0.19, -0.1], [0.175, 0.0], [0.13, 0.08], [0.05, 0.11]], { seg: 28, n: 16, phiStart: 0 }), mat));
  if (trim) g.add(ring(0.2, 0.028, trim, -0.37, 28));
  return g;
}
function puffSleeve(mat, band) {
  const g = new THREE.Group();
  const puff = mesh(new THREE.SphereGeometry(0.26, 28, 18), mat, 0, -0.1, 0); puff.scale.set(1, 0.85, 1); g.add(puff);
  g.add(ring(0.155, 0.035, band || mat, -0.3, 24));
  return g;
}
function longSleeve(mat, cuff) {
  const g = new THREE.Group();
  g.add(mesh(lathe([[0.162, -0.82], [0.166, -0.6], [0.176, -0.3], [0.19, -0.05], [0.17, 0.03], [0.12, 0.09], [0.05, 0.11]], { seg: 28, n: 20, phiStart: 0 }), mat));
  g.add(tube(0.182, 0.182, 0.12, cuff || mat, -0.8, 24));
  return g;
}
// Dây áo hai dây: vòng qua vai (nằm ngoài chỏm vai của búp bê)
function straps(mat, r = 0.03) {
  return [-1, 1].map(s => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    V3(s * 0.24, 1.9, 0.46), V3(s * 0.255, 2.21, 0.33), V3(s * 0.265, 2.3, 0), V3(s * 0.255, 2.21, -0.33), V3(s * 0.24, 1.9, -0.46)]), 24, r, 8), mat));
}
// Bán kính thân áo ở độ cao y (để đặt nút áo, dây chuyền nằm trên bề mặt)
function topR(y, pts = TOP) {
  for (let i = 1; i < pts.length; i++) {
    const [r0, y0] = pts[i - 1], [r1, y1] = pts[i];
    if (y <= y1) return r0 + (r1 - r0) * Math.max(0, (y - y0) / (y1 - y0));
  }
  return pts[pts.length - 1][0];
}

/* ——— quần: phần hông + hai ống ——— */
function hipPiece(mat) {
  const g = new THREE.Group();
  g.add(tube(0.432, 0.437, 0.22, mat, 1.24, 40));
  const seat = mesh(new THREE.SphereGeometry(0.437, 40, 12, 0, TAU, Math.PI / 2, Math.PI / 2), mat, 0, 1.13, 0); seat.scale.y = 0.6; g.add(seat);
  return g;
}

/* ——— giày: trong trục chân, bàn chân tâm (0, -1.06, 0.08) ——— */
function cup(mat, from = 1.08) {
  const m = mesh(new THREE.SphereGeometry(0.2, 32, 16, 0, TAU, from, Math.PI - from), mat, 0, -1.066, 0.09);
  m.scale.set(1.1, 0.78, 1.42); m.rotation.x = -0.32; return m;
}
function shell(mat, sx = 1.13, sy = 0.84) { const m = mesh(new THREE.SphereGeometry(0.2, 32, 18), mat, 0, -1.06, 0.09); m.scale.set(sx, sy, 1.45); return m; }
function sole(mat, h = 0.05, y = -1.17) { const m = mesh(new THREE.CylinderGeometry(1, 1, 1, 32), mat, 0, y, 0.09); m.scale.set(0.215, h, 0.3); return m; }
function shoePair(make) { return both('leg', s => { const g = new THREE.Group(); make(g, s); return g; }); }

/* ——— hình in trên áo ——— */
function printMat(M, key, bg, draw) {
  return M.custom(key, () => toon('#FFFFFF', Object.assign({ map: M.own(printTexture(bg, draw, 512, 256)) }, DOUBLE)));
}

export const BUILD = {
  /* ================= ÁO ================= */
  tshirt(M) {
    const body = printMat(M, 'print-tshirt', '#8FE3CF', (g) => {
      g.fillStyle = '#FFFFFF'; drawHeart(g, 256, 118, 44); g.fillStyle = '#FF7FAA'; drawHeart(g, 256, 118, 34);
    });
    const mint = M.c('#8FE3CF', 2), white = M.c('#FFFFFF');
    const g = new THREE.Group();
    g.add(mesh(lathe(TOP), body), ring(0.455, 0.026, M.c('#6FD0B8'), 1.1, 48), ring(0.214, 0.03, white, 2.31, 32));
    return { parts: [part('body', g), ...both('arm', () => shortSleeve(mint, white))] };
  },
  blouse(M) {
    const blue = M.p('dots', '#CFE8FF', '#FFFFFF', null, 10, 5), white = M.c('#FFFFFF'), pink = M.c('#FF5C9A');
    const g = new THREE.Group();
    g.add(mesh(lathe(TOP), blue));
    for (const s of [-1, 1]) { // cổ lá sen
      const c = mesh(new THREE.SphereGeometry(0.2, 24, 12), white, s * 0.17, 2.12, 0.44); c.scale.set(1.0, 0.2, 0.75); c.rotation.set(1.25, 0, -s * 0.35); g.add(c);
    }
    const b = bow(pink, M.c('#E23F80'), 0.36); b.position.set(0, 2.07, 0.5); b.rotation.x = -0.25; g.add(b);
    [1.45, 1.65, 1.85].forEach(y => g.add(mesh(new THREE.SphereGeometry(0.028, 10, 8), white, 0, y, topR(y) + 0.008)));
    return { parts: [part('body', g), ...both('arm', () => puffSleeve(blue, white))] };
  },
  sweater(M) {
    const knit = M.p('knit', '#C9A7F5', '#A987E6', null, 8, 6), rib = M.p('vstripes', '#B48BF0', '#C9A7F5', null, 24, 1);
    const g = new THREE.Group();
    g.add(mesh(lathe(loosen(TOP, 0.03)), knit), tube(0.49, 0.495, 0.12, rib, 1.14, 48));
    g.add(ring(0.235, 0.065, rib, 2.33, 32));
    const h = mesh(extrude(heartShape(0.1), 0.03, 0.012), M.c('#FF7FAA'), 0, 1.7, topR(1.7) + 0.04); g.add(h);
    return { parts: [part('body', g), ...both('arm', () => longSleeve(knit, rib))] };
  },
  cami(M) {
    const dots = M.p('dots', '#FFE17A', '#FFFFFF', null, 10, 4), white = M.c('#FFFFFF', 2);
    const g = new THREE.Group();
    g.add(mesh(lathe(CAMI, { n: 24 }), dots));
    g.add(mesh(ruffle(lathe([[0.482, 1.93], [0.51, 1.99], [0.54, 2.02]], { n: 6, seg: 64 }), 0.05, 16, 1.93, 2.02), white));
    g.add(...straps(white));
    const b = bow(M.c('#FF7FAA'), null, 0.2); b.position.set(0, 1.93, 0.5); g.add(b);
    return { parts: [part('body', g)] };
  },
  jacket(M) {
    const coat = M.c('#FF8FA3', 2), dark = M.c('#E8667F', 2), gold = M.c('#FFD34D');
    const g = new THREE.Group();
    g.add(mesh(lathe(loosen(TOP, 0.055), { phiStart: 0.26, phiLength: TAU - 0.52 }), coat));
    g.add(tube(0.515, 0.52, 0.1, dark, 1.13, 48));
    for (const s of [-1, 1]) {
      // ve áo
      const lap = mesh(new THREE.BoxGeometry(0.09, 0.42, 0.03), dark, s * 0.15, 2.02, 0.47); lap.rotation.set(-0.35, s * 0.3, s * 0.35); g.add(lap);
      // túi áo
      const pk = mesh(new RoundedBoxGeometry(0.2, 0.16, 0.04, 2, 0.03), dark, s * 0.3, 1.38, 0.43); pk.rotation.y = s * 0.6; g.add(pk);
    }
    [1.5, 1.72].forEach(y => g.add(mesh(new THREE.SphereGeometry(0.04, 12, 10), gold, 0.19, y, topR(y) + 0.045)));
    return { parts: [part('body', g), ...both('arm', () => longSleeve(coat, dark))] };
  },
  sporty(M) {
    const body = printMat(M, 'print-sporty', '#7FC4FF', (g, w, h) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(0, 70, w, 22); g.fillRect(0, 100, w, 10);
      g.fillStyle = '#FFFFFF'; drawStar(g, 256, 150, 40); g.fillStyle = '#FFC53D'; drawStar(g, 256, 150, 30);
    });
    const white = M.c('#FFFFFF', 2), blue = M.c('#4E9BE0');
    const g = new THREE.Group();
    g.add(mesh(lathe(TOP), body), ring(0.455, 0.028, blue, 1.1, 48), ring(0.216, 0.034, blue, 2.31, 32));
    return { parts: [part('body', g), ...both('arm', () => shortSleeve(white, blue))] };
  },

  /* ================= VÁY / QUẦN ================= */
  flare(M) {
    const dots = M.p('dots', '#FF9EC4', '#FFFFFF', null, 12, 3), band = M.c('#FF7FAA', 2);
    const g = new THREE.Group();
    g.add(mesh(ruffle(lathe([[0.98, 0.6], [0.95, 0.66], [0.72, 0.92], [0.53, 1.08], [0.45, 1.18], [0.432, 1.32]], { n: 24, seg: 72 }), 0.045, 10, 1.1, 0.6), dots));
    g.add(tube(0.436, 0.44, 0.1, band, 1.29, 48));
    return { parts: [part('body', g)] };
  },
  tutu(M) {
    const g = new THREE.Group();
    const layers = [
      [[[0.96, 0.9], [0.9, 0.94], [0.7, 1.02], [0.52, 1.1], [0.445, 1.16]], M.c('#FFB8D6', 2), 14, 0],
      [[[0.86, 0.97], [0.8, 1.0], [0.62, 1.07], [0.5, 1.12], [0.445, 1.17]], M.c('#FFD1E3', 2), 16, 1],
      [[[0.74, 1.04], [0.68, 1.07], [0.55, 1.12], [0.46, 1.16], [0.445, 1.2]], M.p('sparkle', '#FFE3EF', '#FFFFFF', '#FFD34D', 10, 2), 18, 2],
    ];
    layers.forEach(([pts, mat, f, ph]) => g.add(mesh(ruffle(lathe(pts, { n: 12, seg: 80 }), 0.07, f, 1.16, 0.9, ph), mat)));
    g.add(ring(0.445, 0.045, M.c('#FF7FAA'), 1.19, 48));
    g.add(tube(0.434, 0.438, 0.14, M.c('#FFB8D6', 2), 1.26, 48));
    return { parts: [part('body', g)] };
  },
  longskirt(M) {
    const check = M.p('gingham', '#C9A7F5', '#FFFFFF', null, 12, 5);
    const g = new THREE.Group();
    g.add(mesh(ruffle(lathe([[0.8, 0.3], [0.76, 0.36], [0.62, 0.72], [0.51, 1.0], [0.448, 1.18], [0.432, 1.32]], { n: 26, seg: 72 }), 0.03, 9, 0.9, 0.3), check));
    g.add(ring(0.765, 0.03, M.c('#FFFFFF'), 0.37, 64), tube(0.436, 0.44, 0.1, M.c('#B48BF0', 2), 1.29, 48));
    return { parts: [part('body', g)] };
  },
  shorts(M) {
    const peach = M.c('#FFB27A', 2), white = M.c('#FFFFFF');
    return { parts: [part('body', hipPiece(peach)), ...both('leg', () => {
      const g = new THREE.Group(); g.add(tube(0.205, 0.215, 0.4, peach, -0.23), ring(0.215, 0.028, white, -0.43, 28)); return g;
    })] };
  },
  jeans(M) {
    const denim = M.p('denim', '#6FA8DC', '#A8CDEF', null, 3, 3), cuff = M.c('#A9CFF2', 2);
    return { parts: [part('body', hipPiece(denim)), ...both('leg', s => {
      const g = new THREE.Group(); g.add(tube(0.2, 0.192, 0.86, denim, -0.46), tube(0.206, 0.206, 0.07, cuff, -0.87));
      if (s < 0) { const h = mesh(extrude(heartShape(0.08), 0.02, 0.01), M.c('#FF7FAA'), 0, -0.52, 0.2); g.add(h); }
      return g;
    })] };
  },
  joggers(M) {
    const stripe = M.custom('print-joggers', () => toon('#FFFFFF', Object.assign({ map: M.own(printTexture('#FF9EC4', (g, w, h) => {
      g.fillStyle = '#FFFFFF'; g.fillRect(w * 0.22, 0, w * 0.06, h); g.fillRect(w * 0.72, 0, w * 0.06, h);
    }, 128, 8)) }, DOUBLE)));
    const pink = M.c('#FF9EC4', 2), cuff = M.c('#FFFFFF', 2);
    return { parts: [part('body', hipPiece(pink)), ...both('leg', () => {
      const g = new THREE.Group(); g.add(tube(0.21, 0.2, 0.84, stripe, -0.45), tube(0.175, 0.2, 0.1, cuff, -0.9)); return g;
    })] };
  },

  /* ================= ĐẦM ================= */
  princess(M) {
    const bod = M.p('sparkle', '#FF9EC4', '#FFFFFF', '#FFE17A', 10, 3), under = M.p('sparkle', '#FFD1E3', '#FFFFFF', '#FFD34D', 14, 5);
    const over = M.c('#FF7FAA', 2), gold = M.c('#FFD34D'), puff = M.c('#FFB8D6');
    const g = new THREE.Group();
    g.add(mesh(lathe(TOP), bod), ring(0.214, 0.028, gold, 2.31, 32));
    g.add(mesh(ruffle(lathe([[1.28, 0.06], [1.3, 0.14], [1.2, 0.42], [0.98, 0.78], [0.72, 1.02], [0.52, 1.14], [0.44, 1.26]], { n: 30, seg: 80 }), 0.04, 9, 1.0, 0.06), under));
    const ov = lathe([[1.33, 0.3], [1.26, 0.46], [1.04, 0.8], [0.77, 1.04], [0.555, 1.15], [0.456, 1.25]], { n: 26, seg: 72, phiStart: 0.6, phiLength: TAU - 1.2 });
    g.add(mesh(scallop(ov, 0.12, 12, 0.3, 0.25), over));
    g.add(ring(0.455, 0.05, gold, 1.23, 48));
    const gem = mesh(extrude(heartShape(0.08), 0.04, 0.015), M.glow('#FF5C9A'), 0, 1.23, 0.5); g.add(gem);
    return { parts: [part('body', g), ...both('arm', () => puffSleeve(puff, gold))] };
  },
  gown(M) {
    const sp = M.p('sparkle', '#9C74E0', '#FFFFFF', '#FFD34D', 12, 8);
    const g = new THREE.Group();
    g.add(mesh(lathe([[0.92, 0.04], [0.9, 0.1], [0.72, 0.4], [0.55, 0.78], [0.462, 1.1], ...BODICE], { n: 44, seg: 64 }), sp));
    g.add(ring(0.467, 0.022, M.c('#FFFFFF'), 1.968, 48), ring(0.455, 0.045, M.c('#FF9EC4'), 1.2, 48));
    const rose = flowerMesh(M.c('#FF7FAA'), M.c('#FFD34D'), 0.14); rose.position.set(-0.3, 1.22, 0.4); rose.rotation.y = -0.6; g.add(rose);
    return { parts: [part('body', g)] };
  },
  floral(M) {
    const fl = M.p('flowers', '#FFD1E3', '#FF7FAA', '#FFC53D', 8, 6), pink = M.c('#FF7FAA'), white = M.c('#FFFFFF', 2);
    const g = new THREE.Group();
    g.add(mesh(ruffle(lathe([[0.98, 0.6], [0.95, 0.66], [0.72, 0.92], [0.53, 1.08], [0.455, 1.2], ...BODICE], { n: 36, seg: 72 }), 0.045, 10, 1.08, 0.6), fl));
    g.add(...straps(white), ring(0.46, 0.04, pink, 1.22, 48));
    const b = bow(pink, null, 0.26); b.position.set(0, 1.22, 0.49); g.add(b);
    return { parts: [part('body', g)] };
  },
  beach(M) {
    const st = M.p('stripes', '#7FC4FF', '#FFFFFF', null, 1, 7), white = M.c('#FFFFFF', 2);
    const g = new THREE.Group();
    g.add(mesh(ruffle(lathe([[0.82, 0.62], [0.8, 0.68], [0.63, 0.95], [0.5, 1.12], [0.455, 1.25], ...BODICE.filter(p => p[1] > 1.4)], { n: 36, seg: 64 }), 0.03, 8, 1.0, 0.62), st));
    g.add(...straps(white));
    const f = flowerMesh(M.c('#FF7FAA'), M.c('#FFD34D'), 0.16); f.position.set(-0.24, 1.82, 0.46); f.rotation.y = -0.4; g.add(f);
    return { parts: [part('body', g)] };
  },
  winter(M) {
    const knit = M.p('snow', '#F2667A', '#FFFFFF', null, 8, 6), fluff = M.c('#FFFFFF');
    const g = new THREE.Group();
    g.add(mesh(lathe([[0.9, 0.62], [0.87, 0.68], [0.68, 0.94], [0.52, 1.1], [0.46, 1.25], ...loosen(UPPER, 0.02)], { n: 40, seg: 64 }), knit));
    g.add(ring(0.88, 0.075, fluff, 0.64, 64), ring(0.24, 0.07, M.c('#F2667A'), 2.33, 32));
    [1.5, 1.72, 1.94].forEach(y => g.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), fluff, 0, y, topR(y) + 0.06)));
    return { parts: [part('body', g), ...both('arm', () => {
      const s = longSleeve(knit, fluff); s.add(ring(0.19, 0.05, fluff, -0.82, 24)); return s;
    })] };
  },
  swim(M) {
    const dots = M.p('dots', '#5FD0B8', '#FFFFFF', null, 10, 4), frill = M.c('#FF9EC4', 2);
    const g = new THREE.Group();
    g.add(mesh(lathe(CAMI, { n: 24 }), dots));
    const seat = mesh(new THREE.SphereGeometry(0.447, 40, 12, 0, TAU, Math.PI / 2, Math.PI / 2), dots, 0, 1.12, 0); seat.scale.y = 0.56; g.add(seat);
    g.add(mesh(ruffle(lathe([[0.64, 0.99], [0.57, 1.03], [0.47, 1.1], [0.452, 1.13]], { n: 8, seg: 72 }), 0.07, 14, 1.12, 0.99), frill));
    g.add(...straps(dots));
    const b = bow(frill, null, 0.2); b.position.set(0, 1.93, 0.5); g.add(b);
    return { parts: [part('body', g)] };
  },

  /* ================= GIÀY ================= */
  flats(M) {
    const pink = M.c('#FF7FAA', 2), dark = M.c('#D94F8A'), white = M.c('#FFFFFF');
    return { sock: '#FFFFFF', parts: shoePair((g, s) => {
      g.add(cup(pink, 1.36), sole(dark));
      const st = mesh(new THREE.TorusGeometry(0.17, 0.032, 8, 20, Math.PI), dark, 0, -1.03, 0.03); st.scale.y = 0.78; st.rotation.x = -0.25; g.add(st);
      g.add(mesh(new THREE.SphereGeometry(0.036, 10, 8), white, -s * 0.17, -1.03, 0.03));
    }) };
  },
  sneakers(M) {
    const white = M.c('#FFFFFF'), pink = M.c('#FF7FAA'), mint = M.c('#5FD0B8');
    return { parts: shoePair((g) => {
      g.add(shell(white), sole(pink, 0.075, -1.165));
      const toe = mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, TAU, 0, Math.PI / 2), mint, 0, -1.07, 0.21); toe.scale.set(1.18, 0.82, 0.9); toe.rotation.x = Math.PI / 2; g.add(toe);
      g.add(ring(0.18, 0.04, pink, -0.9));
      [[0.12, -0.878], [0.18, -0.886], [0.24, -0.9]].forEach(([z, y]) => { const l = mesh(new THREE.CapsuleGeometry(0.02, 0.14, 4, 8), pink, 0, y, z); l.rotation.z = Math.PI / 2; g.add(l); });
    }) };
  },
  sandals(M) {
    const yel = M.c('#FFD34D'), pink = M.c('#FF7FAA');
    return { sock: 'skin', parts: shoePair((g) => {
      g.add(sole(yel, 0.06, -1.165));
      const toe = mesh(new THREE.TorusGeometry(0.18, 0.034, 8, 20, Math.PI), pink, 0, -1.12, 0.2); toe.scale.y = 0.62; g.add(toe);
      g.add(ring(0.158, 0.028, pink, -0.92, 24));
      g.add(mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.22, 8), pink, 0, -1.04, -0.14));
      const f = flowerMesh(M.c('#FFFFFF'), yel, 0.1); f.position.set(0, -1.0, 0.24); f.rotation.x = -0.35; g.add(f);
    }) };
  },
  boots(M) {
    const dots = M.p('dots', '#FFD34D', '#FFFFFF', null, 4, 2), yel = M.c('#FFD34D'), dark = M.c('#E7A21E');
    return { parts: shoePair((g) => {
      g.add(tube(0.235, 0.215, 0.5, dots, -0.68), shell(yel, 1.16, 0.88), sole(dark, 0.06, -1.17));
      g.add(ring(0.236, 0.034, M.c('#FFFFFF'), -0.43, 28));
    }) };
  },
  heels(M) {
    const sp = M.p('sparkle', '#FFB8D6', '#FFFFFF', '#FFD34D', 2, 2), gold = M.c('#FFD34D');
    return { sock: 'skin', parts: shoePair((g) => {
      g.add(cup(sp, 1.36), sole(M.c('#FF7FAA'), 0.04, -1.165));
      g.add(mesh(new THREE.CylinderGeometry(0.055, 0.035, 0.16, 12), gold, 0, -1.2, -0.14));
      g.add(ring(0.152, 0.026, gold, -0.93, 24));
      g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), M.glow('#FF5C9A'), 0, -1.0, 0.33));
    }) };
  },
  bowshoes(M) {
    const lil = M.c('#C9A7F5', 2), dark = M.c('#8E62D6'), pink = M.c('#FF7FAA');
    return { sock: '#FFFFFF', parts: shoePair((g) => {
      g.add(cup(lil, 1.22), sole(dark));
      const b = bow(pink, M.c('#E23F80'), 0.34); b.position.set(0, -0.95, 0.26); b.rotation.x = -0.55; g.add(b);
    }) };
  },

  /* ================= PHỤ KIỆN ================= */
  hat(M) {
    const straw = M.c('#FFE3A3', 2), pink = M.c('#FF7FAA', 2);
    const g = new THREE.Group(); g.position.set(0, 0.42, 0.02); g.rotation.x = -0.22;
    g.add(mesh(lathe([[1.1, 0.02], [1.38, -0.02], [1.6, -0.1], [1.66, -0.14]], { n: 10, seg: 64 }), straw));
    g.add(mesh(lathe([[1.14, 0.0], [1.12, 0.25], [1.02, 0.5], [0.72, 0.66], [0.3, 0.72], [0.01, 0.73]], { n: 18, seg: 64 }), straw));
    g.add(tube(1.145, 1.13, 0.17, pink, 0.1, 64));
    const f = flowerMesh(M.c('#FFFFFF'), M.c('#FFD34D'), 0.2); f.position.set(0.72, 0.12, 0.88); f.rotation.y = 0.68; g.add(f);
    return { parts: [part('head', g)], hat: true };
  },
  crown(M) {
    const gold = M.c('#FFD34D', 2), g = new THREE.Group(); g.position.set(0, 0.96, 0.12); g.rotation.x = 0.12;
    g.add(mesh(lathe([[0.4, 0], [0.42, 0.08], [0.45, 0.17]], { n: 6, seg: 40 }), gold));
    const cone = new THREE.ConeGeometry(0.085, 0.26, 12), pearl = new THREE.SphereGeometry(0.045, 12, 10), gem = new THREE.SphereGeometry(0.05, 12, 10);
    for (let i = 0; i < 5; i++) {
      const a = Math.PI / 2 + (i - 2) * 0.62, x = Math.sin(a - Math.PI / 2) * 0.44, z = Math.cos(a - Math.PI / 2) * 0.44;
      const c = mesh(cone, gold, x, 0.28, z); c.rotation.set(z * 0.3, 0, -x * 0.3); g.add(c);
      g.add(mesh(pearl, M.c('#FFFFFF'), x * 1.07, 0.43, z * 1.07));
      g.add(mesh(gem, M.glow(i % 2 ? '#58A8F5' : '#FF5C9A'), x * 1.06, 0.09, z * 1.06));
    }
    // mặt sau vương miện
    for (let i = 0; i < 4; i++) {
      const a = Math.PI + (i - 1.5) * 0.7, x = Math.sin(a) * 0.44, z = Math.cos(a) * 0.44;
      const c = mesh(cone, gold, x, 0.25, z); c.scale.setScalar(0.8); g.add(c);
    }
    return { parts: [part('head', g)] };
  },
  catears(M) {
    const lil = M.c('#C9A7F5'), pink = M.c('#FF9EC4');
    const g = new THREE.Group(); g.position.set(0, 0.0, 0.08); g.rotation.x = -0.12;
    const band = mesh(new THREE.TorusGeometry(1.14, 0.05, 10, 48, Math.PI), lil); band.scale.set(1.04, 1, 1); g.add(band);
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(s * 0.72, 0.9, 0); e.rotation.z = -s * 0.68;
      const outer = mesh(new THREE.ConeGeometry(0.3, 0.46, 16), lil, 0, 0.16, 0); outer.scale.z = 0.4; e.add(outer);
      const inner = mesh(new THREE.ConeGeometry(0.18, 0.3, 16), pink, 0, 0.12, 0.07); inner.scale.z = 0.3; e.add(inner);
      g.add(e);
    }
    return { parts: [part('head', g)] };
  },
  hairbow(M) {
    const dots = M.p('dots', '#FF5C9A', '#FFFFFF', null, 2, 1, 1);
    const b = bow(dots, M.c('#E23F80'), 0.62); b.position.set(0.62, 0.92, 0.36); b.rotation.set(-0.2, 0.45, -0.55);
    return { parts: [part('head', b)] };
  },
  glasses(M) {
    const lens = M.c('#E0457F'), frame = M.c('#FFFFFF'), shine = M.glow('#FFFFFF', 0.8);
    const g = new THREE.Group(); g.position.set(0, -0.2, 0.975);
    const lg = extrude(heartShape(0.2), 0.03, 0.012), fg = extrude(heartShape(0.235), 0.02, 0.01), sg = new THREE.CircleGeometry(0.045, 12);
    for (const s of [-1, 1]) {
      const h = new THREE.Group(); h.position.set(s * 0.39, 0, -0.02); h.rotation.y = s * 0.4; g.add(h);
      h.add(mesh(fg, frame, 0, 0.01, -0.012), mesh(lg, lens, 0, 0.01, 0.01));
      const sh = mesh(sg, shine, -0.07, 0.06, 0.04); sh.scale.set(1, 0.6, 1); h.add(sh);
      const arm = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.8), frame, s * 0.93, 0.06, -0.42); arm.rotation.y = -s * 0.25; g.add(arm);
    }
    const br = mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 12, Math.PI), frame, 0, 0.05, 0.03); g.add(br);
    return { parts: [part('head', g)] };
  },
  bag(M) {
    const pink = M.c('#FF9EC4'), dark = M.c('#FF7FAA'), gold = M.c('#FFD34D');
    const g = new THREE.Group(); g.position.set(0, -0.95, 0);
    const h = mesh(new THREE.TorusGeometry(0.15, 0.024, 8, 24), dark, 0, -0.06, 0); g.add(h);
    g.add(mesh(new RoundedBoxGeometry(0.4, 0.32, 0.16, 3, 0.07), pink, 0, -0.34, 0));
    g.add(mesh(new RoundedBoxGeometry(0.41, 0.13, 0.17, 2, 0.05), dark, 0, -0.23, 0.004));
    const c = mesh(extrude(heartShape(0.05), 0.02, 0.01), gold, 0, -0.29, 0.09); g.add(c);
    return { hold: true, parts: [part('arm0', g, { hang: true })] };
  },
  wand(M) {
    const g = new THREE.Group(); g.position.set(0, -0.95, 0);
    const tilt = new THREE.Group(); tilt.rotation.set(0.5, 0, 0.18); g.add(tilt);
    tilt.add(mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.78, 10), M.c('#FFFFFF'), 0, 0.3, 0));
    const spin = new THREE.Group(); spin.position.set(0, 0.76, 0); tilt.add(spin);
    spin.add(mesh(extrude(starShape(0.2), 0.05, 0.025), M.c('#FFD34D')));
    spin.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), M.glow('#FFFFFF'), 0, 0, 0.06));
    [['#FF7FAA', -1], ['#7FDCC4', 1]].forEach(([c, s]) => {
      const rb = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(0, 0.58, 0), V3(s * 0.08, 0.5, 0.04), V3(s * 0.02, 0.4, 0.08), V3(s * 0.1, 0.3, 0.06)]), 16, 0.014, 6), M.c(c));
      tilt.add(rb);
    });
    return { hold: true, parts: [part('arm0', g, { hang: true, spin })] };
  },
  necklace(M) {
    const pearl = new THREE.SphereGeometry(0.038, 12, 10), white = M.c('#FFFFFF'), g = new THREE.Group();
    const N = 26;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU, c = Math.cos(a), front = Math.max(0, c);
      const y = 2.2 - 0.13 * Math.pow(front, 1.5) + 0.04 * Math.max(0, -c);
      const minR = topR(y) + 0.1;
      const r = Math.max(minR, 0.34);
      g.add(mesh(pearl, white, Math.sin(a) * r, y, c * r));
    }
    const hp = mesh(extrude(heartShape(0.075), 0.03, 0.012), M.glow('#FF5C9A'), 0, 1.99, topR(2.0) + 0.12); hp.rotation.x = -0.2; g.add(hp);
    return { parts: [part('body', g)] };
  },
  scarf(M) {
    const st = M.p('stripes', '#FF7FAA', '#FFFFFF', null, 1, 2, 2), stw = M.p('stripes', '#FF7FAA', '#FFFFFF', null, 8, 1, 2);
    const g = new THREE.Group();
    const t = mesh(new THREE.TorusGeometry(0.42, 0.15, 14, 40), stw, 0, 2.12, 0.02); t.rotation.x = Math.PI / 2 - 0.12; t.scale.set(1, 0.95, 0.78); g.add(t);
    const tail = new THREE.Group(); tail.position.set(0.22, 1.98, 0.58); tail.rotation.set(0.18, 0, -0.14); g.add(tail);
    tail.add(mesh(new RoundedBoxGeometry(0.26, 0.6, 0.08, 2, 0.035), st, 0, -0.28, 0));
    for (let i = 0; i < 5; i++) tail.add(mesh(new THREE.BoxGeometry(0.03, 0.1, 0.03), M.c('#FFFFFF'), -0.1 + i * 0.05, -0.62, 0));
    return { parts: [part('body', g)] };
  },
};

export function buildItem(id, M) { return BUILD[id](M); }
