// thumbs.js — chụp ảnh nhỏ cho từng món đồ bằng một trình vẽ WebGL nhỏ riêng (vẽ một lần, giữ ảnh dataURL),
// và ảnh búp bê mẫu của mỗi màn (một búp bê thứ hai mặc bộ đồ mẫu).

import { THREE, toon, createDoll, createFace, disposeTree } from '../../kit/three-kit.js';
import { buildItem } from './items.js';
import { buildHair } from './hair.js';
import { Outfit, faceFor } from './outfit.js';
import { disposeGeos, mesh } from './geo.js';
import { ITEMS, HAIR_COLORS, MAKEUP, FACE_BASE } from './data.js';

export function createThumbs(M) {
  const S = 160;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(S, S, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(4, 9, 7);
  scene.add(new THREE.HemisphereLight(0xfff4fa, 0xf0bfd6, 1.25), sun, sun.target);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.05, 100);

  // khung xương giả giống búp bê để đồ ngồi đúng chỗ
  const body = new THREE.Group(), head = new THREE.Group(); head.position.set(0, 3.15, 0); body.add(head);
  const pivot = (x, y, rz) => { const g = new THREE.Group(); g.position.set(x, y, 0); g.rotation.z = rz; body.add(g); return g; };
  const rig = { body, head, arm0: pivot(-0.5, 2.0, -0.18), arm1: pivot(0.5, 2.0, 0.18), leg0: pivot(-0.2, 1.2, 0), leg1: pivot(0.2, 1.2, 0) };
  scene.add(body);

  // đầu ma-nơ-canh cho ảnh kiểu tóc & trang điểm
  const skin = toon('#FFE2CF');
  const headModel = new THREE.Group();
  const skull = mesh(new THREE.SphereGeometry(1, 40, 32), skin); skull.scale.set(1.06, 0.98, 1); headModel.add(skull);
  const face = createFace(1, FACE_BASE); skull.add(face.mesh);
  [-1, 1].forEach(s => { const e = mesh(new THREE.SphereGeometry(0.2, 16, 12), skin, s * 1.04, -0.08, 0); e.scale.set(0.6, 1, 0.8); headModel.add(e); });
  let mkHair = null;

  const rainbow = () => M.custom('thumb-rainbow', () => toon('#FFFFFF', { side: THREE.DoubleSide, vertexColors: true }));
  const cache = new Map(), queue = [];
  const box = new THREE.Box3(), c3 = new THREE.Vector3(), s3 = new THREE.Vector3();

  function shoot(root, o = {}) {
    const size = o.size || S;
    renderer.setSize(size, size, false);
    root.updateMatrixWorld(true);
    box.setFromObject(o.fit || root); box.getCenter(c3); box.getSize(s3);
    const yaw = o.yaw ?? 0.35, pitch = o.pitch ?? 0.12, half = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const extent = Math.max(s3.y, Math.max(s3.x, s3.z) * 0.95) * (o.pad || 1.15);
    const dist = extent / (2 * half) + Math.max(s3.x, s3.z) / 2;
    cam.position.set(c3.x + Math.sin(yaw) * Math.cos(pitch) * dist, c3.y + Math.sin(pitch) * dist, c3.z + Math.cos(yaw) * Math.cos(pitch) * dist);
    cam.lookAt(c3);
    renderer.render(scene, cam);
    return renderer.domElement.toDataURL('image/png');
  }
  function withParts(parts, fn) {
    parts.forEach(p => { if (p.at) rig[p.at].add(p.obj); });
    const r = fn();
    parts.forEach(p => { if (p.at && p.obj.parent) p.obj.parent.remove(p.obj); disposeGeos(p.obj); });
    return r;
  }
  const VIEW = {
    shoes: { yaw: 0.55, pitch: 0.42, pad: 1.05 }, bottom: { yaw: 0.3, pitch: 0.2 }, dress: { yaw: 0.3, pitch: 0.1 }, top: { yaw: 0.3, pitch: 0.1 },
    necklace: { yaw: 0, pitch: 0.55, pad: 1.05 }, glasses: { yaw: 0, pitch: 0.05, pad: 0.66 }, hat: { yaw: 0.2, pitch: 0.35 }, crown: { yaw: 0, pitch: 0.3 },
    hairbow: { yaw: 0.5, pitch: 0.1, pad: 1.0 }, scarf: { yaw: 0.35, pitch: 0.55, pad: 1.0 }, cami: { yaw: 0.3, pitch: 0.02 },
  };

  function render(key) {
    const [kind, id, extra] = key.split(':');
    if (kind === 'item') {
      const b = buildItem(id, M), it = ITEMS[id];
      return withParts(b.parts, () => shoot(body, VIEW[id] || VIEW[it.cat] || {}));
    }
    if (kind === 'hair') {
      const col = HAIR_COLORS.find(c => c.id === extra) || HAIR_COLORS[0];
      const mat = extra === 'rainbow' ? rainbow() : M.c(col.hex, 2);
      const b = buildHair(id, mat, M.c('#FF7FAA'));
      face.set(FACE_BASE); head.add(headModel);
      const url = withParts(b.parts, () => shoot(body, { yaw: 0.55, pitch: 0.1, pad: 1.05 }));
      head.remove(headModel); return url;
    }
    if (kind === 'mk') {
      if (!mkHair) mkHair = buildHair('short', M.c('#8A5536', 2), M.c('#FF7FAA'));
      const mk = MAKEUP.find(m => m.id === id);
      face.set(faceFor({ makeup: mk.id, lips: null }));
      head.add(headModel); mkHair.parts.forEach(p => { if (p.at) rig[p.at].add(p.obj); });
      const url = shoot(body, { yaw: 0, pitch: 0.05, pad: 0.82, fit: skull });
      mkHair.parts.forEach(p => { if (p.obj.parent) p.obj.parent.remove(p.obj); });
      head.remove(headModel); return url;
    }
    return '';
  }

  // Búp bê mẫu (dựng một lần, dùng lại cho mọi màn)
  let photo = null;
  const disc = mesh(new THREE.CylinderGeometry(1.3, 1.35, 0.14, 48), toon('#FFD6E6'), 0, -0.07, 0);

  const T = {
    renderer,
    get(key) { if (!cache.has(key)) cache.set(key, render(key)); return cache.get(key); },
    has: key => cache.has(key),
    // xin ảnh không đồng bộ: vẽ dần vài ảnh mỗi khung hình để không giật
    request(key, cb) {
      if (cache.has(key)) { cb(cache.get(key)); return; }
      queue.push([key, cb]);
      if (queue.length === 1) requestAnimationFrame(pump);
    },
    look(look, size = 360) {
      if (!photo) { const d = createDoll(); photo = { doll: d, outfit: new Outfit(d, M) }; }
      photo.outfit.apply(look, true);
      scene.remove(body); scene.add(photo.doll.root, disc);
      const url = shoot(photo.doll.root, { size, yaw: 0.28, pitch: 0.1, pad: 1.06 });
      scene.remove(photo.doll.root, disc); scene.add(body);
      return url;
    },
    clearQueue() { queue.length = 0; },
    dispose() {
      queue.length = 0; alive = false;
      if (photo) { photo.outfit.dispose(); disposeTree(photo.doll.root); }
      if (mkHair) mkHair.parts.forEach(p => disposeGeos(p.obj));
      disposeTree(headModel); disposeTree(disc);
      renderer.dispose(); renderer.forceContextLoss();
    },
  };
  let alive = true;
  function pump() {
    if (!alive) return;
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 12) {
      const [key, cb] = queue.shift();
      if (!cache.has(key)) cache.set(key, render(key));
      cb(cache.get(key));
    }
    if (queue.length) requestAnimationFrame(pump);
  }
  return T;
}
