// mats.js — vật liệu & texture của Bé Nấu Ăn. Đồ ăn dùng vật liệu PBR có phản chiếu môi trường
// để bóng bẩy, trông ngon miệng; texture vẽ bằng canvas (gỗ, gạch bông, bát Tràng, trứng chiên…).

import { THREE, canvasTexture } from '../../kit/three-kit.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function setupEnv(stage) {
  const pmrem = new THREE.PMREMGenerator(stage.renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  stage.scene.environment = env;
  stage.scene.environmentIntensity = 0.6;
  // ánh sáng ấm như bếp buổi sáng
  stage.hemi.color.set('#FFF3E6'); stage.hemi.groundColor.set('#E8B894'); stage.hemi.intensity = 0.9;
  stage.sun.color.set('#FFF1DC'); stage.sun.intensity = 2.1;
  return env;
}

// Vật liệu không kèm texture được dùng chung (cache); có texture hay cần đổi riêng thì tạo mới và ghi lại để dọn.
const cache = new Map(), owned = [];
const plain = extra => !Object.values(extra).some(v => v && typeof v === 'object');
function cached(k, make, extra) {
  if (!plain(extra)) { const m = make(); owned.push(m); return m; }
  const kk = k + '|' + JSON.stringify(extra);
  if (!cache.has(kk)) cache.set(kk, make());
  return cache.get(kk);
}
// Vật liệu thường (gốm, gỗ, rau củ)
export function mat(color, rough = 0.55, metal = 0, extra = {}) {
  return cached(`m|${color}|${rough}|${metal}`, () => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough, metalness: metal }, extra)), extra);
}
// Đồ ăn bóng bẩy (nước sốt, trứng, thịt kho) — có lớp phủ bóng
export function glossy(color, rough = 0.35, coat = 0.8, extra = {}) {
  return cached(`g|${color}|${rough}|${coat}`, () => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: rough }, extra)), extra);
}
// Chất lỏng trong (nước, nước cam, nước dùng) — mỗi lần một vật liệu riêng vì hay đổi màu/độ trong
export function liquid(color, opacity = 0.75, rough = 0.08) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: rough, transparent: true, opacity, depthWrite: false });
  owned.push(m); return m;
}
// Bề mặt lớn của phòng (tường, gạch, mặt bếp): vật liệu Lambert rẻ, không phản chiếu — nhẹ cho điện thoại
export function flat(color, extra = {}) {
  return cached(`f|${color}`, () => new THREE.MeshLambertMaterial(Object.assign({ color }, extra)), extra);
}
// Vật liệu riêng (không dùng chung) — khi cần đổi màu/độ trong theo từng bước
export function own(m) { owned.push(m); return m; }
export function disposeMats() {
  cache.forEach(m => m.dispose()); cache.clear(); owned.forEach(m => m.dispose()); owned.length = 0;
  Object.values(TEX).forEach(t => t && t.dispose && t.dispose()); for (const k in TEX) delete TEX[k];
}

/* ——— texture ——— */
const TEX = {};
const once = (name, make) => TEX[name] || (TEX[name] = make());

export const tex = {
  wood: () => once('wood', () => {
    const t = canvasTexture(512, 512, (g, w, h) => {
      g.fillStyle = '#E9BC8C'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 70; i++) {
        const y = Math.random() * h, a = 2 + Math.random() * 6, f = 0.004 + Math.random() * 0.01;
        g.strokeStyle = `rgba(${150 + Math.random() * 40},${95 + Math.random() * 30},${55},${0.12 + Math.random() * 0.18})`;
        g.lineWidth = 1 + Math.random() * 3; g.beginPath();
        for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * f + i) * a);
        g.stroke();
      }
      g.fillStyle = 'rgba(120,70,30,.10)'; for (let i = 0; i < 4; i++) g.fillRect(0, (i * h) / 4, w, 2);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1); return t;
  }),
  // Gạch bông kiểu Việt Nam
  tiles: () => once('tiles', () => {
    const t = canvasTexture(256, 256, (g, w) => {
      g.fillStyle = '#FFF4E4'; g.fillRect(0, 0, w, w);
      g.strokeStyle = '#E6CDB0'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, w - 4);
      const c = w / 2;
      g.fillStyle = '#6CC3BA';
      for (let i = 0; i < 4; i++) { g.save(); g.translate(c, c); g.rotate((i * Math.PI) / 2); g.beginPath(); g.ellipse(0, -52, 26, 46, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.fillStyle = '#F28C82'; g.beginPath(); g.arc(c, c, 24, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#FFD36E'; g.beginPath(); g.arc(c, c, 10, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#F28C82'; [[0, 0], [w, 0], [0, w], [w, w]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 30, 0, Math.PI * 2); g.fill(); });
      g.fillStyle = '#6CC3BA'; [[c, 0], [0, c], [w, c], [c, w]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill(); });
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(9, 2.4); return t;
  }),
  // Bát gốm trắng hoa lam (kiểu Bát Tràng) — dải quấn quanh thân bát
  batTrang: () => once('batTrang', () => canvasTexture(1024, 256, (g, w, h) => {
    g.fillStyle = '#FBFAF6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2F5FAE';
    g.fillRect(0, h * 0.1, w, 6); g.fillRect(0, h * 0.2, w, 3); g.fillRect(0, h * 0.86, w, 5);
    for (let i = 0; i < 8; i++) {
      const x = (i + 0.5) * (w / 8), y = h * 0.52;
      g.save(); g.translate(x, y); g.fillStyle = '#3A6CC0';
      for (let k = 0; k < 5; k++) { g.rotate((Math.PI * 2) / 5); g.beginPath(); g.ellipse(0, -18, 9, 16, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#FBFAF6'; g.beginPath(); g.arc(0, 0, 6, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3A6CC0'; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 8); g.quadraticCurveTo(52, -20, 74, 6); g.stroke();
      g.restore();
    }
  })),
  omelette: () => once('omelette', () => canvasTexture(256, 256, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w / 2); gr.addColorStop(0, '#FFD34D'); gr.addColorStop(0.8, '#F4B028'); gr.addColorStop(1, '#D98A1C');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(190,110,20,${0.15 + Math.random() * 0.3})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * w, 3 + Math.random() * 10, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = Math.random() < 0.6 ? '#4FAF3A' : '#8DD66B'; g.save(); g.translate(Math.random() * w, Math.random() * w); g.rotate(Math.random() * 3); g.fillRect(-5, -2, 10, 4); g.restore(); }
  })),
  ricePaper: () => once('ricePaper', () => canvasTexture(256, 256, (g, w) => {
    g.fillStyle = 'rgba(255,250,240,0.85)'; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(220,200,170,0.5)'; g.lineWidth = 1.5;
    for (let i = -w; i < w * 2; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + w, w); g.stroke(); g.beginPath(); g.moveTo(i, w); g.lineTo(i + w, 0); g.stroke(); }
  })),
  orangePeel: () => once('orangePeel', () => canvasTexture(256, 256, (g, w) => {
    g.fillStyle = '#FF9A1F'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < 900; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(230,120,10,.35)' : 'rgba(255,190,90,.35)'; g.beginPath(); g.arc(Math.random() * w, Math.random() * w, 1.2 + Math.random() * 1.6, 0, Math.PI * 2); g.fill(); }
  })),
  orangeCut: () => once('orangeCut', () => canvasTexture(256, 256, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#FFF1C9'; g.beginPath(); g.arc(c, c, c, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFB02E'; g.beginPath(); g.arc(c, c, c - 14, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 10; i++) {
      g.save(); g.translate(c, c); g.rotate((i * Math.PI * 2) / 10);
      g.fillStyle = i % 2 ? '#FF9F12' : '#FFA928';
      g.beginPath(); g.moveTo(0, 6); g.lineTo(-18, -c + 20); g.quadraticCurveTo(0, -c + 10, 18, -c + 20); g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = '#FFF1C9'; g.beginPath(); g.arc(c, c, 8, 0, Math.PI * 2); g.fill();
  })),
  steam: () => once('steam', () => canvasTexture(64, 64, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  })),
  flame: () => once('flame', () => canvasTexture(64, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h * 0.75, 2, w / 2, h * 0.6, h * 0.6); gr.addColorStop(0, 'rgba(200,240,255,1)'); gr.addColorStop(0.35, 'rgba(90,150,255,.9)'); gr.addColorStop(1, 'rgba(60,90,255,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h * 0.62, w * 0.42, h * 0.5, 0, 0, Math.PI * 2); g.fill();
  })),
};
