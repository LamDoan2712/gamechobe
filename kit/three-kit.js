// kit/three-kit.js — công cụ 3D dùng chung (Three.js): sân khấu, vật liệu hoạt hình (toon), chuyển động mượt,
// texture vẽ bằng canvas, khuôn mặt dễ thương và búp bê chibi dùng chung cho các game.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE, RoundedBoxGeometry };

/* ——— vật liệu hoạt hình ——— */
let gradMap = null;
export function toonGradient() {
  if (!gradMap) {
    gradMap = new THREE.DataTexture(new Uint8Array([110, 185, 235, 255]), 4, 1, THREE.RedFormat);
    gradMap.minFilter = gradMap.magFilter = THREE.NearestFilter; gradMap.needsUpdate = true;
  }
  return gradMap;
}
export const toon = (color, opts = {}) => new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: toonGradient() }, opts));

/* ——— chuyển động mượt (tween) ——— */
export const Ease = {
  linear: p => p,
  inQuad: p => p * p,
  outCubic: p => 1 - Math.pow(1 - p, 3),
  inOutSine: p => -(Math.cos(Math.PI * p) - 1) / 2,
  outBack: p => { const c = 1.70158; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  outElastic: p => (p === 0 || p === 1 ? p : Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  outBounce: p => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + 0.75; if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + 0.9375; return n * (p -= 2.625 / d) * p + 0.984375; },
};
const tweens = [];
export const Tweens = {
  // Tweens.add(mesh.position, { y: 2 }, 0.5, { ease, delay, onUpdate, onDone }) → tween; .then() được qua Tweens.to
  add(target, to, dur, o = {}) {
    const tw = { target, to, from: null, dur: Math.max(0.0001, dur), t: -(o.delay || 0), ease: o.ease || Ease.outCubic, onUpdate: o.onUpdate, onDone: o.onDone };
    tweens.push(tw); return tw;
  },
  to(target, to, dur, o = {}) { return new Promise(res => this.add(target, to, dur, Object.assign({}, o, { onDone: () => { o.onDone && o.onDone(); res(); } }))); },
  kill(target) { for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].target === target) tweens.splice(i, 1); },
  clear() { tweens.length = 0; },
  update(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i]; tw.t += dt;
      if (tw.t < 0) continue;
      if (!tw.from) { tw.from = {}; for (const k in tw.to) tw.from[k] = tw.target[k]; }
      const p = Math.min(1, tw.t / tw.dur), e = tw.ease(p);
      for (const k in tw.to) tw.target[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
      if (tw.onUpdate) tw.onUpdate(p);
      if (p >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
    }
  },
};
export const wait = s => new Promise(r => setTimeout(r, s * 1000));

/* ——— texture vẽ bằng canvas ——— */
export function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export function skyTexture(top, bottom) {
  return canvasTexture(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}
// Mặt phẳng chỉ hiện bóng đổ (đặt dưới nhân vật)
export function shadowCatcher(size = 20, opacity = 0.18) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity, color: 0x7a3060 }));
  m.rotation.x = -Math.PI / 2; m.receiveShadow = true; return m;
}
export function disposeTree(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture && m[k] !== gradMap) m[k].dispose(); m.dispose(); });
  });
}

/* ——— sân khấu 3D ——— */
// createStage(container, { sky: [trên, dưới], fov, shadows, onResize(w,h) })
export function createStage(container, o = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !!o.transparent, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, o.maxDpr || 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = o.shadows !== false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement; canvas.className = 'k-3d';
  container.appendChild(canvas);

  const scene = new THREE.Scene();
  if (o.sky) scene.background = skyTexture(o.sky[0], o.sky[1]);
  const camera = new THREE.PerspectiveCamera(o.fov || 40, 1, 0.1, 300);
  const hemi = new THREE.HemisphereLight(0xfff4fa, 0xf0bfd6, 1.25);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(4, 9, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
  const sc = sun.shadow.camera; sc.left = sc.bottom = -8; sc.right = sc.top = 8; sc.near = 0.5; sc.far = 40;
  scene.add(hemi, sun, sun.target);

  const fns = new Set(), clock = new THREE.Clock(), ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  let raf = 0, running = false, W = 1, H = 1;
  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    Tweens.update(dt);
    fns.forEach(f => f(dt, clock.elapsedTime));
    renderer.render(scene, camera);
  }
  const resize = () => {
    W = Math.max(1, container.clientWidth); H = Math.max(1, container.clientHeight);
    renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix();
    if (o.onResize) o.onResize(W, H);
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  const onVis = () => { if (document.hidden) { cancelAnimationFrame(raf); } else if (running) { clock.getDelta(); cancelAnimationFrame(raf); loop(); } };
  document.addEventListener('visibilitychange', onVis);

  const stage = {
    THREE, renderer, scene, camera, canvas, sun, hemi,
    get width() { return W; }, get height() { return H; },
    onFrame(fn) { fns.add(fn); return () => fns.delete(fn); },
    start() { if (!running) { running = true; clock.getDelta(); loop(); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    resize,
    // Toạ độ chuẩn hoá của sự kiện chạm/chuột
    ndc(e) { const r = canvas.getBoundingClientRect(); return v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); },
    raycast(e, objects, recursive = true) { ray.setFromCamera(this.ndc(e), camera); return ray.intersectObjects(objects, recursive); },
    // Đổi điểm 3D sang toạ độ màn hình (px) — để bắn hạt lấp lánh FX đúng chỗ
    toScreen(v) { const p = v.clone().project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; },
    dispose() {
      stage.stop(); fns.clear(); ro.disconnect(); document.removeEventListener('visibilitychange', onVis);
      Tweens.clear(); disposeTree(scene);
      if (scene.background && scene.background.isTexture) scene.background.dispose();
      renderer.dispose(); canvas.remove();
    },
  };
  return stage;
}

/* ——— khuôn mặt chibi (vẽ bằng canvas, dán lên đầu hình cầu) ——— */
// opts: { eyes: 'open'|'closed'|'happy', mouth: 'smile'|'open'|'o', blush, blushAmt, lips, lipsAmt, shadow, shadowAmt, lashes, lashColor, brow }
const FACE_DEFAULTS = { eyes: 'open', mouth: 'smile', blush: '#FF8FB1', blushAmt: 0.45, lips: '#F2476E', lipsAmt: 0, shadow: '#A56CF0', shadowAmt: 0, lashes: false, lashColor: '#2E1F2A', brow: '#8A5536', eyeColor: '#6A3F7E' };
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function drawFace(g, f) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 512, 512);
  // vẽ trong khung 512 gốc rồi phóng to 1.4 lần quanh tâm, để mắt to tròn kiểu chibi
  g.translate(256, 284); g.scale(1.4, 1.4); g.translate(-256, -262);
  const EX = [178, 334], EY = 262;
  const soft = (x, y, rx, ry, col, a) => {
    if (a <= 0) return;
    g.save(); g.translate(x, y); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore();
  };
  soft(134, 336, 58, 38, f.blush, f.blushAmt); soft(378, 336, 58, 38, f.blush, f.blushAmt);
  EX.forEach(x => soft(x, EY - 22, 58, 46, f.shadow, f.shadowAmt * 0.9));
  g.lineCap = 'round'; g.lineJoin = 'round';
  // lông mày
  g.strokeStyle = f.brow; g.lineWidth = 9;
  EX.forEach(x => { g.beginPath(); g.moveTo(x - 26, EY - 72); g.quadraticCurveTo(x, EY - 88, x + 26, EY - 72); g.stroke(); });
  // mắt
  EX.forEach((x, i) => {
    if (f.eyes === 'open') {
      const gr = g.createRadialGradient(x - 6, EY - 14, 4, x, EY, 44); gr.addColorStop(0, '#9A6BB0'); gr.addColorStop(0.5, f.eyeColor); gr.addColorStop(1, '#241326');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, EY, 32, 41, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 11, EY - 14, 12, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(x - 11, EY + 16, 5.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#3B2340'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 34, EY - 8); g.quadraticCurveTo(x, EY - 64, x + 34, EY - 8); g.stroke();
    } else {
      g.strokeStyle = '#3B2340'; g.lineWidth = 8; g.beginPath();
      if (f.eyes === 'happy') { g.moveTo(x - 28, EY + 6); g.quadraticCurveTo(x, EY - 30, x + 28, EY + 6); }
      else { g.moveTo(x - 28, EY); g.quadraticCurveTo(x, EY + 22, x + 28, EY); }
      g.stroke();
    }
    if (f.lashes) {
      const s = i ? 1 : -1; g.strokeStyle = f.lashColor; g.lineWidth = 8;
      g.beginPath(); g.moveTo(x - 36, EY - 6); g.quadraticCurveTo(x, EY - 70, x + 36, EY - 6); g.stroke(); g.lineWidth = 6;
      [[26, -26, 44, -42], [32, -12, 52, -22], [14, -36, 24, -56]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(x + s * a, EY + b); g.lineTo(x + s * c, EY + d); g.stroke(); });
    }
  });
  // mũi
  g.fillStyle = 'rgba(214,130,110,.45)'; g.beginPath(); g.ellipse(256, 318, 8, 5.5, 0, 0, Math.PI * 2); g.fill();
  // miệng
  const lipCol = f.lipsAmt > 0 ? f.lips : '#E87E93';
  if (f.mouth === 'open') {
    g.fillStyle = '#9C2F52'; g.beginPath(); g.moveTo(226, 348); g.quadraticCurveTo(256, 356, 286, 348); g.quadraticCurveTo(280, 392, 256, 392); g.quadraticCurveTo(232, 392, 226, 348); g.fill();
    g.fillStyle = '#FF8FA8'; g.beginPath(); g.ellipse(256, 382, 16, 8, 0, 0, Math.PI * 2); g.fill();
    if (f.lipsAmt > 0) { g.strokeStyle = rgba(lipCol, f.lipsAmt); g.lineWidth = 7; g.stroke(); }
  } else if (f.mouth === 'o') {
    g.fillStyle = f.lipsAmt > 0 ? rgba(lipCol, 0.4 + f.lipsAmt * 0.6) : '#C4486A'; g.beginPath(); g.ellipse(256, 364, 14, 17, 0, 0, Math.PI * 2); g.fill();
  } else {
    if (f.lipsAmt > 0) {
      g.fillStyle = rgba(lipCol, f.lipsAmt);
      g.beginPath(); g.moveTo(222, 350); g.quadraticCurveTo(239, 340, 256, 348); g.quadraticCurveTo(273, 340, 290, 350); g.quadraticCurveTo(275, 380, 256, 380); g.quadraticCurveTo(237, 380, 222, 350); g.fill();
      g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(246, 368, 8, 3.5, 0, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = '#B24A6A'; g.lineWidth = 6; g.beginPath(); g.moveTo(230, 352); g.quadraticCurveTo(256, 374, 282, 352); g.stroke();
  }
}
export function createFace(radius = 1, opts = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const geo = new THREE.SphereGeometry(radius * 1.004, 48, 40, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.9 + 0.12, 1.8);
  const mesh = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: tex, transparent: true, depthWrite: false, gradientMap: toonGradient() }));
  mesh.renderOrder = 2;
  let state = Object.assign({}, FACE_DEFAULTS, opts), blinkT = 2 + Math.random() * 3, blinking = 0, mood = null, moodT = 0;
  const redraw = () => { const s = Object.assign({}, state); if (blinking > 0 && s.eyes === 'open') s.eyes = 'closed'; if (mood) Object.assign(s, mood); drawFace(g, s); tex.needsUpdate = true; };
  redraw();
  return {
    mesh,
    get state() { return state; },
    set(o) { Object.assign(state, o); redraw(); },
    // Biểu cảm tạm thời, ví dụ face.react({ eyes: 'happy', mouth: 'open' }, 0.8)
    react(o, secs = 0.8) { mood = o; moodT = secs; redraw(); },
    tick(dt) {
      let dirty = false;
      if (moodT > 0) { moodT -= dt; if (moodT <= 0) { mood = null; dirty = true; } }
      if (blinking > 0) { blinking -= dt; if (blinking <= 0) dirty = true; }
      else if ((blinkT -= dt) <= 0) { blinking = 0.13; blinkT = 2.5 + Math.random() * 3.5; dirty = true; }
      if (dirty) redraw();
    },
  };
}

/* ——— búp bê chibi dùng chung (Tiệm Làm Tóc, Thời Trang Xinh) ———
   Kích thước (đơn vị thế giới), đứng trên mặt đất y = 0, nhìn về +z:
   đầu: cầu bán kính 1 tâm y = 3.15 (scale 1.06, 0.98, 1); cổ y 2.05–2.3;
   thân: từ hông y = 1.2 đến vai y = 2.1, bán kính ~0.42 (eo) → 0.48 (vai);
   tay: gốc vai (±0.5, 2.0), dài 0.95, bán kính 0.13, bàn tay cầu 0.16;
   chân: gốc hông (±0.2, 1.2), dài 0.95, bán kính 0.16; bàn chân tâm (±0.2, 0.12, 0.08).
   Mỏ neo (anchors) để gắn đồ: headTop (đỉnh đầu), face, neck, chest, waist, hips, handL/R, footL/R. */
export function createDoll(o = {}) {
  const skin = o.skin || '#FFE2CF';
  const skinMat = toon(skin);
  const root = new THREE.Group(); root.name = 'doll';
  const body = new THREE.Group(); root.add(body);
  const add = (geo, mat, x, y, z, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };

  const head = new THREE.Group(); head.position.set(0, 3.15, 0); body.add(head);
  const skull = add(new THREE.SphereGeometry(1, 48, 40), skinMat, 0, 0, 0, head); skull.scale.set(1.06, 0.98, 1);
  const face = createFace(1, o.face); skull.add(face.mesh);
  const earGeo = new THREE.SphereGeometry(0.2, 20, 16);
  add(earGeo, skinMat, -1.04, -0.08, 0, head).scale.set(0.6, 1, 0.8);
  add(earGeo, skinMat, 1.04, -0.08, 0, head).scale.set(0.6, 1, 0.8);

  add(new THREE.CylinderGeometry(0.17, 0.2, 0.4, 20), skinMat, 0, 2.2, 0);
  const torsoMat = toon(o.base || '#FFF4F8');
  const torso = add(new THREE.CylinderGeometry(0.46, 0.4, 0.9, 32), torsoMat, 0, 1.65, 0);
  add(new THREE.SphereGeometry(0.46, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), torsoMat, 0, 2.1, 0).scale.set(1, 0.35, 1);
  const hips = add(new THREE.SphereGeometry(0.4, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), torsoMat, 0, 1.2, 0); hips.scale.set(1, 0.5, 1);

  const limb = (len, r) => new THREE.CapsuleGeometry(r, len, 8, 16);
  const arms = [-1, 1].map(s => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.5, 2.0, 0); pivot.rotation.z = s * 0.18; body.add(pivot);
    add(limb(0.72, 0.13), skinMat, 0, -0.46, 0, pivot);
    const hand = add(new THREE.SphereGeometry(0.16, 20, 16), skinMat, 0, -0.95, 0, pivot);
    return { pivot, hand };
  });
  const legs = [-1, 1].map(s => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.2, 1.2, 0); body.add(pivot);
    add(limb(0.72, 0.16), skinMat, 0, -0.5, 0, pivot);
    const foot = add(new THREE.SphereGeometry(0.2, 20, 16), toon(o.shoe || '#FFFFFF'), 0, -1.06, 0.08, pivot); foot.scale.set(0.95, 0.6, 1.35);
    return { pivot, foot };
  });

  const anchor = (name, parent, x, y, z) => { const a = new THREE.Object3D(); a.name = name; a.position.set(x, y, z); parent.add(a); return a; };
  const anchors = {
    headTop: anchor('headTop', head, 0, 0.98, 0), face: anchor('face', head, 0, -0.1, 1), neck: anchor('neck', body, 0, 2.15, 0),
    chest: anchor('chest', body, 0, 1.85, 0), waist: anchor('waist', body, 0, 1.3, 0), hips: anchor('hips', body, 0, 1.2, 0),
    handL: anchor('handL', arms[0].hand, 0, 0, 0), handR: anchor('handR', arms[1].hand, 0, 0, 0),
    footL: anchor('footL', legs[0].foot, 0, 0, 0), footR: anchor('footR', legs[1].foot, 0, 0, 0),
  };

  let hopT = 0, spinT = 0, waveT = 0, walk = 0;
  const doll = {
    root, body, head, skull, face, torso, arms, legs, anchors, skinMat, torsoMat,
    setSkin(c) { skinMat.color.set(c); },
    hop() { hopT = 0.55; face.react({ eyes: 'happy', mouth: 'open' }, 0.7); },
    spin() { spinT = 0.9; face.react({ eyes: 'happy', mouth: 'open' }, 1); },
    wave() { waveT = 1.4; face.react({ mouth: 'open' }, 1); },
    set walking(v) { walk = v ? 1 : 0; }, get walking() { return !!walk; },
    tick(dt, t) {
      face.tick(dt);
      const breathe = Math.sin(t * 2.2) * 0.012;
      body.scale.set(1 - breathe * 0.5, 1 + breathe, 1 - breathe * 0.5);
      head.rotation.z = Math.sin(t * 1.3) * 0.04; head.rotation.x = Math.sin(t * 0.9) * 0.03;
      let y = 0;
      if (hopT > 0) { hopT -= dt; const p = 1 - hopT / 0.55; y = Math.sin(p * Math.PI) * 0.45; }
      if (spinT > 0) { spinT -= dt; body.rotation.y = (1 - Math.max(0, spinT) / 0.9) * Math.PI * 2; y = Math.max(y, Math.sin((1 - spinT / 0.9) * Math.PI) * 0.25); if (spinT <= 0) body.rotation.y = 0; }
      body.position.y = y;
      const sw = walk ? Math.sin(t * 9) * 0.5 : 0;
      arms[0].pivot.rotation.x = sw; arms[1].pivot.rotation.x = -sw;
      legs[0].pivot.rotation.x = -sw * 0.8; legs[1].pivot.rotation.x = sw * 0.8;
      if (walk) body.position.y += Math.abs(Math.sin(t * 9)) * 0.08;
      if (waveT > 0) { waveT -= dt; arms[1].pivot.rotation.z = 2.5 + Math.sin(t * 14) * 0.35; if (waveT <= 0) arms[1].pivot.rotation.z = 0.18; }
    },
  };
  return doll;
}
