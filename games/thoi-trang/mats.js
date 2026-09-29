// mats.js — kho vật liệu dùng chung (toon) và hoa văn vải vẽ bằng canvas: chấm bi, sọc, sao, hoa, tim, jean, len…
// Mỗi vật liệu chỉ tạo một lần rồi dùng lại cho mọi món đồ; dispose() dọn sạch khi rời game.

import { THREE, toon, canvasTexture } from '../../kit/three-kit.js';

const TAU = Math.PI * 2;
function star(g, x, y, r, n = 5, inner = 0.45) {
  g.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * inner : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath(); g.fill();
}
function heart(g, x, y, s) {
  g.beginPath(); g.moveTo(x, y + s * 0.8);
  g.bezierCurveTo(x - s * 1.3, y, x - s * 0.8, y - s, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.8, y - s, x + s * 1.3, y, x, y + s * 0.8); g.fill();
}
function flower(g, x, y, r, petal, center) {
  g.fillStyle = petal;
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, 0, TAU); g.fill(); }
  g.fillStyle = center; g.beginPath(); g.arc(x, y, r * 0.38, 0, TAU); g.fill();
}
// Rải hoạ tiết theo lưới lệch hàng để khi lặp lại (repeat) không thấy đường nối
function scatter(w, h, cols, rows, fn) {
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const x = (i + (j % 2 ? 0.5 : 0) + 0.5) * w / cols, y = (j + 0.5) * h / rows;
    fn(x % w, y, i, j);
  }
}

// Các hoạ tiết: (g, w, h, a, b, c) với a = màu nền, b/c = màu hoạ tiết
const PATTERNS = {
  dots: (g, w, h, a, b) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; scatter(w, h, 4, 4, (x, y) => { g.beginPath(); g.arc(x, y, w * 0.055, 0, TAU); g.fill(); }); },
  stripes: (g, w, h, a, b) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let i = 0; i < 4; i++) g.fillRect(0, i * h / 4, w, h / 8); },
  vstripes: (g, w, h, a, b) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; for (let i = 0; i < 4; i++) g.fillRect(i * w / 4, 0, w / 8, h); },
  stars: (g, w, h, a, b) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; scatter(w, h, 3, 3, (x, y, i) => star(g, x, y, w * (i % 2 ? 0.07 : 0.1))); },
  sparkle: (g, w, h, a, b, c) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    scatter(w, h, 5, 5, (x, y, i, j) => { g.fillStyle = (i + j) % 2 ? b : (c || b); star(g, x, y, w * ((i * 7 + j * 3) % 3 === 0 ? 0.06 : 0.035), 4, 0.35); });
  },
  hearts: (g, w, h, a, b) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b; scatter(w, h, 3, 3, (x, y) => heart(g, x, y, w * 0.09)); },
  flowers: (g, w, h, a, b, c) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    scatter(w, h, 3, 3, (x, y, i, j) => flower(g, x, y, w * 0.12, (i + j) % 2 ? b : '#FFFFFF', c || '#FFC53D'));
    g.fillStyle = '#7FD8A0'; scatter(w, h, 3, 3, (x, y) => { g.beginPath(); g.ellipse((x + w / 6) % w, (y + h / 6) % h, w * 0.05, w * 0.025, 0.6, 0, TAU); g.fill(); });
  },
  gingham: (g, w, h, a, b) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h); g.globalAlpha = 0.45; g.fillStyle = b;
    for (let i = 0; i < 4; i++) { g.fillRect(i * w / 4, 0, w / 8, h); g.fillRect(0, i * h / 4, w, h / 8); } g.globalAlpha = 1;
  },
  denim: (g, w, h, a, b) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h); g.strokeStyle = b; g.globalAlpha = 0.35; g.lineWidth = 2;
    for (let i = -h; i < w; i += 6) { g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke(); } g.globalAlpha = 1;
  },
  knit: (g, w, h, a, b) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h); g.strokeStyle = b; g.lineWidth = w * 0.02; g.lineCap = 'round';
    const cw = w / 8, ch = h / 8;
    for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
      const x = i * cw, y = j * ch;
      g.beginPath(); g.moveTo(x + cw * 0.15, y + ch * 0.2); g.lineTo(x + cw * 0.5, y + ch * 0.85); g.lineTo(x + cw * 0.85, y + ch * 0.2); g.stroke();
    }
  },
  snow: (g, w, h, a, b) => {
    g.fillStyle = a; g.fillRect(0, 0, w, h); g.strokeStyle = b; g.lineWidth = w * 0.018; g.lineCap = 'round';
    scatter(w, h, 3, 3, (x, y) => { const r = w * 0.08; for (let k = 0; k < 3; k++) { const q = k * Math.PI / 3; g.beginPath(); g.moveTo(x - Math.cos(q) * r, y - Math.sin(q) * r); g.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r); g.stroke(); } });
  },
};

export function createMats() {
  const mats = new Map(), texs = new Map();
  function tex(kind, a, b, c, rx, ry) {
    const key = [kind, a, b, c, rx, ry].join('|');
    if (!texs.has(key)) {
      const t = canvasTexture(128, 128, (g, w, h) => PATTERNS[kind](g, w, h, a, b, c));
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
      texs.set(key, t);
    }
    return texs.get(key);
  }
  const M = {
    // màu trơn: M.c('#FF7FAA'), hai mặt: M.c(color, 2)
    c(color, side) {
      const key = 'c|' + color + '|' + (side || 1);
      if (!mats.has(key)) mats.set(key, toon(color, side === 2 ? { side: THREE.DoubleSide } : {}));
      return mats.get(key);
    },
    // hoa văn: M.p('dots', '#FF9EC4', '#fff', null, 8, 3)
    p(kind, a, b, c, rx = 4, ry = 2, side = 2) {
      const key = ['p', kind, a, b, c, rx, ry, side].join('|');
      if (!mats.has(key)) mats.set(key, toon('#FFFFFF', { map: tex(kind, a, b, c, rx, ry), side: side === 2 ? THREE.DoubleSide : THREE.FrontSide }));
      return mats.get(key);
    },
    // vật liệu tự phát sáng (đèn, đá quý lấp lánh)
    glow(color, opacity = 1) {
      const key = 'g|' + color + '|' + opacity;
      if (!mats.has(key)) mats.set(key, new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }));
      return mats.get(key);
    },
    // vật liệu có vẽ riêng (ví dụ hình in trên áo) — tạo một lần theo khoá
    custom(key, make) { if (!mats.has(key)) mats.set(key, make()); return mats.get(key); },
    own(t) { texs.set('own|' + texs.size, t); return t; },
    dispose() {
      mats.forEach(m => m.dispose()); texs.forEach(t => t.dispose());
      mats.clear(); texs.clear();
    },
  };
  return M;
}

// Hình in trên ngực áo: vẽ một canvas có hoạ tiết ở giữa (u = 0.5 là chính giữa phía trước)
export function printTexture(bg, draw, w = 256, h = 128) {
  return canvasTexture(w, h, (g) => { g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g, w, h); });
}
export { star as drawStar, heart as drawHeart, flower as drawFlower };
