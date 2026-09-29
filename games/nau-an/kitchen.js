// kitchen.js — gian bếp 3D của Bé Nấu Ăn: mặt bếp gỗ, tường gạch bông, cửa sổ, kệ gia vị, bồn rửa + vòi nước,
// bếp ga (lửa xanh), hơi nước bốc lên, và máy quay tự canh khung theo màn hình (điện thoại, iPad, máy tính).

import { THREE, createStage, Tweens, Ease, createDoll, RoundedBoxGeometry } from '../../kit/three-kit.js';
import { setupEnv, mat, glossy, own, tex, flat, disposeMats } from './mats.js';
import * as MD from './models.js';

const { mesh, put, group } = MD;
export const SPOT = {
  center: new THREE.Vector3(0, 0, 0.35),
  left: new THREE.Vector3(-2.3, 0, 0.7),
  right: new THREE.Vector3(2.3, 0, 0.7),
  backL: new THREE.Vector3(-1.5, 0, -1.2),
  backR: new THREE.Vector3(1.6, 0, -1.2),
  sink: new THREE.Vector3(-4.3, 0, -0.5),
};

export function createKitchen(container) {
  const stage = createStage(container, { sky: ['#FFE6D2', '#FFF4E8'], fov: 36 });
  const { scene, camera } = stage;
  setupEnv(stage);
  stage.sun.position.set(5, 11, 8);
  const sc = stage.sun.shadow.camera; sc.left = sc.bottom = -9; sc.right = sc.top = 9; sc.updateProjectionMatrix();

  /* ——— phòng bếp ——— */
  const room = group('room'); scene.add(room);
  const cabinet = flat('#FFF1E4');
  const counter = mesh(new THREE.BoxGeometry(18, 3, 6), [cabinet, cabinet, flat('#FFFFFF', { map: tex.wood() }), cabinet, cabinet, cabinet], 0, -1.5, -0.3);
  counter.castShadow = false; room.add(counter);
  const lip = mesh(new THREE.BoxGeometry(18, 0.12, 0.12), flat('#D69A62'), 0, -0.06, 2.72); lip.castShadow = false; room.add(lip);
  for (let i = -2; i <= 2; i++) { const d = mesh(new THREE.BoxGeometry(3.2, 0.06, 0.04), flat('#EAD4BE'), i * 3.6, -0.9, 2.72); room.add(d); }
  const tiles = mesh(new THREE.PlaneGeometry(18, 3.4), own(new THREE.MeshBasicMaterial({ color: '#F4EDE6', map: tex.tiles() })), 0, 1.7, -3.3); tiles.castShadow = false; room.add(tiles);
  const wall = mesh(new THREE.PlaneGeometry(18, 8), own(new THREE.MeshBasicMaterial({ color: '#FFF3E6' })), 0, 7.4, -3.3); wall.castShadow = false; room.add(wall);
  // cửa sổ có nắng
  const win = group('window'); win.position.set(3.4, 5.1, -3.25); room.add(win);
  win.add(mesh(new THREE.PlaneGeometry(2.6, 2.1), own(new THREE.MeshBasicMaterial({ color: '#CDEBFF' })), 0, 0, 0.01));
  const frameM = flat('#FFFFFF');
  [[0, 1.08, 2.8, 0.14], [0, -1.08, 2.8, 0.14], [-1.33, 0, 0.14, 2.3], [1.33, 0, 0.14, 2.3], [0, 0, 0.1, 2.1], [0, 0, 2.6, 0.1]].forEach(([x, y, w, h]) => win.add(mesh(new THREE.BoxGeometry(w, h, 0.12), frameM, x, y, 0.06)));
  const sunGlow = mesh(new THREE.CircleGeometry(0.4, 24), own(new THREE.MeshBasicMaterial({ color: '#FFF2A8' })), 0.7, 0.5, 0.02); win.add(sunGlow);
  // kệ gia vị
  const shelf = group('shelf'); shelf.position.set(-3.6, 4.2, -3.0); room.add(shelf);
  shelf.add(mesh(new RoundedBoxGeometry(3.4, 0.14, 0.7, 2, 0.05), flat('#C98C58')));
  [['#E0412F', -1.1], ['#F2C14E', -0.35], ['#6BBF59', 0.4], ['#8A5A36', 1.15]].forEach(([c, x]) => {
    shelf.add(mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.55, 20), own(new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.35, roughness: 0.05 })), x, 0.35, 0));
    shelf.add(mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.38, 20), mat(c, 0.7), x, 0.27, 0));
    shelf.add(mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.08, 20), mat('#FF9EC4', 0.4), x, 0.66, 0));
  });
  // chậu húng quế
  const plant = group('plant'); plant.position.set(5.6, 0, -2.2); room.add(plant);
  plant.add(mesh(new THREE.CylinderGeometry(0.5, 0.38, 0.7, 20), flat('#E07B53'), 0, 0.35, 0));
  const leafM = flat('#4CAF50');
  for (let i = 0; i < 14; i++) { const l = mesh(new THREE.SphereGeometry(0.22, 10, 8), leafM, Math.cos(i * 2.4) * 0.3, 0.9 + (i % 4) * 0.18, Math.sin(i * 2.4) * 0.3); l.scale.set(1, 0.5, 0.7); l.rotation.y = i; plant.add(l); }
  // bồn rửa + vòi
  const sink = group('sink'); sink.position.copy(SPOT.sink); room.add(sink);
  sink.add(mesh(new THREE.LatheGeometry([[0.001, 0.01], [1.1, 0.01], [1.3, 0.3], [1.38, 0.62], [1.32, 0.64], [1.22, 0.33], [1.02, 0.07], [0.001, 0.07]].map(([x, y]) => new THREE.Vector2(x, y)), 40), mat('#DDE3EA', 0.18, 0.85, { side: THREE.DoubleSide })));
  const pipeCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -1.5), new THREE.Vector3(0, 2.2, -1.5), new THREE.Vector3(0, 2.7, -0.9), new THREE.Vector3(0, 2.3, -0.1)]);
  sink.add(mesh(new THREE.TubeGeometry(pipeCurve, 24, 0.09, 10), mat('#E4E9EF', 0.12, 0.95)));
  put(sink, mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.25, 12), mat('#FF9EC4', 0.4), 0.28, 1.8, -1.5)).rotation.z = Math.PI / 2;
  const stream = mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2, 12, 1, true), own(new THREE.MeshStandardMaterial({ color: '#BFE6FF', transparent: true, opacity: 0.6, roughness: 0.05, depthWrite: false })), 0, 1.15, -0.05);
  stream.visible = false; stream.castShadow = false; sink.add(stream);

  /* ——— bếp ga ——— */
  const stove = group('stove'); stove.visible = false; scene.add(stove);
  stove.add(mesh(new RoundedBoxGeometry(3.2, 0.3, 2.6, 3, 0.1), mat('#3B3740', 0.35, 0.4), 0, 0.15, 0));
  const grate = mesh(new THREE.TorusGeometry(0.8, 0.05, 8, 32), mat('#1F1C22', 0.5, 0.6), 0, 0.36, 0); grate.rotation.x = Math.PI / 2; stove.add(grate);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; put(stove, mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), mat('#1F1C22', 0.5, 0.6), Math.cos(a) * 0.55, 0.38, Math.sin(a) * 0.55)).rotation.y = -a; }
  const knob = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16), mat('#E53935', 0.4), 1.1, 0.24, 1.3); knob.rotation.x = Math.PI / 2; stove.add(knob);
  const flames = [];
  const flameMat = new THREE.SpriteMaterial({ map: tex.flame(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, s = new THREE.Sprite(flameMat); s.position.set(Math.cos(a) * 0.5, 0.33, Math.sin(a) * 0.5); s.scale.set(0.22, 0.3, 1); s.userData.ph = Math.random() * 6; stove.add(s); flames.push(s); }
  let flameLevel = 0;

  /* ——— hơi nước ——— */
  const steamMats = [], steamPool = [];
  for (let i = 0; i < 44; i++) {
    const m = new THREE.SpriteMaterial({ map: tex.steam(), transparent: true, depthWrite: false, opacity: 0 }); steamMats.push(m);
    const s = new THREE.Sprite(m); s.visible = false; scene.add(s); steamPool.push({ s, life: 0, max: 1, vx: 0, vy: 0, size: 1 });
  }
  const emitters = new Set();
  function steam(source, o = {}) {
    const e = { source, rate: o.rate || 6, size: o.size || 0.9, spread: o.spread || 0.5, acc: 0, alive: true, y: o.y || 0 };
    emitters.add(e);
    return { stop() { emitters.delete(e); }, set rate(v) { e.rate = v; } };
  }
  const tmp = new THREE.Vector3();
  function spawnSteam(e) {
    const p = steamPool.find(q => q.life <= 0); if (!p) return;
    if (e.source.isObject3D) e.source.getWorldPosition(tmp); else tmp.copy(e.source);
    p.s.position.set(tmp.x + (Math.random() - 0.5) * e.spread, tmp.y + e.y, tmp.z + (Math.random() - 0.5) * e.spread * 0.6);
    p.max = p.life = 1.6 + Math.random() * 1.2; p.vx = (Math.random() - 0.5) * 0.25; p.vy = 0.7 + Math.random() * 0.5; p.size = e.size * (0.6 + Math.random() * 0.5);
    p.s.visible = true;
  }

  /* ——— máy quay ——— */
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const ZOOM = 1.35; // chừa khoảng thở quanh vùng cần nhìn
  const view = { target: new THREE.Vector3(0, 0.4, 0.3), w: 6, h: 4, elev: 0.9, azim: 0, d: 8 };
  const cur = { target: view.target.clone(), d: 8, elev: 0.9, azim: 0 };
  const insets = { top: 120, bottom: 150, left: 0, right: 0 };
  let snap = true;
  function goalDist() {
    const W = stage.width, H = stage.height;
    const visW = Math.max(80, W - insets.left - insets.right), visH = Math.max(80, H - insets.top - insets.bottom);
    const zoom = W / H < 0.8 ? 1.12 : ZOOM; // màn hình dọc: nhìn gần hơn một chút
    return zoom * Math.max((view.w * H) / (2 * tanHalf * visW), (view.h * H) / (2 * tanHalf * visH), 3.5);
  }
  function applyCam(dt) {
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.2); snap = false;
    cur.target.lerp(view.target, k); cur.d += (goalDist() - cur.d) * k; const goalElev = stage.width / stage.height < 0.8 ? Math.min(1.3, view.elev + 0.3) : view.elev; // dọc: nhìn từ trên xuống nhiều hơn
    cur.elev += (goalElev - cur.elev) * k; cur.azim += (view.azim - cur.azim) * k;
    camera.position.set(cur.target.x + Math.sin(cur.azim) * Math.cos(cur.elev) * cur.d, cur.target.y + Math.sin(cur.elev) * cur.d, cur.target.z + Math.cos(cur.azim) * Math.cos(cur.elev) * cur.d);
    camera.lookAt(cur.target);
    // dời tâm khung hình vào vùng trống giữa thanh trên và khay dưới
    const W = stage.width, H = stage.height, ox = (insets.left - insets.right) / -2, oy = (insets.top - insets.bottom) / -2;
    camera.setViewOffset(W, H, ox, oy, W, H);
  }

  /* ——— vòng lặp ——— */
  const frameFns = new Set(), keepFns = new Set();
  stage.onFrame((dt, t) => {
    applyCam(dt);
    // lửa
    flames.forEach(f => { const s = flameLevel * (0.85 + Math.sin(t * 22 + f.userData.ph) * 0.15); f.scale.set(0.24 * s, 0.3 * s, 1); f.visible = flameLevel > 0.02; });
    // hơi nước
    emitters.forEach(e => { e.acc += dt * e.rate; while (e.acc > 1) { e.acc -= 1; spawnSteam(e); } });
    steamPool.forEach(p => {
      if (p.life <= 0) return;
      p.life -= dt; const age = 1 - p.life / p.max;
      p.s.position.x += p.vx * dt + Math.sin(t * 2 + p.max * 7) * 0.004; p.s.position.y += p.vy * dt;
      const sz = p.size * (0.5 + age * 1.3); p.s.scale.set(sz, sz, 1);
      p.s.material.opacity = Math.sin(Math.min(1, age) * Math.PI) * 0.55;
      if (p.life <= 0) p.s.visible = false;
    });
    if (stream.visible) stream.scale.x = stream.scale.z = 1 + Math.sin(t * 30) * 0.08;
    frameFns.forEach(f => f(dt, t));
  });

  const ws = group('workspace'); scene.add(ws);
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();

  const K = {
    stage, scene, camera, ws, SPOT, THREE, room,
    // khung nhìn: tâm, bề rộng & chiều cao vùng cần thấy (đơn vị thế giới), góc nghiêng
    view(target, w = 6, h = 4, elev = 0.9, azim = 0) { view.target.copy(target); view.w = w; view.h = h; view.elev = elev; view.azim = azim; },
    snapView() { snap = true; },
    applyNow() { snap = true; applyCam(0); },
    setInsets(top, bottom, left = 0, right = 0) { insets.top = top; insets.bottom = bottom; insets.left = left; insets.right = right; },
    // persistent = true: sống suốt game; mặc định: tự gỡ khi dọn bàn (K.clear) để công thức không rò rỉ
    onFrame(fn, persistent = false) { frameFns.add(fn); if (persistent) keepFns.add(fn); return () => { frameFns.delete(fn); keepFns.delete(fn); }; },
    steam,
    stopSteam() { emitters.clear(); },
    stove: {
      show(pos) { stove.position.copy(pos); stove.visible = true; stove.scale.setScalar(0.01); Tweens.add(stove.scale, { x: 1, y: 1, z: 1 }, 0.4, { ease: Ease.outBack }); },
      hide() { flameLevel = 0; Tweens.add(stove.scale, { x: 0.01, y: 0.01, z: 0.01 }, 0.3, { onDone: () => { stove.visible = false; } }); },
      fire(v) { Tweens.add({ get v() { return flameLevel; }, set v(x) { flameLevel = x; } }, { v }, 0.5); },
      get top() { return 0.4; },
      obj: stove,
    },
    water(on) { stream.visible = on; },
    sinkTop: new THREE.Vector3(SPOT.sink.x, 0.1, SPOT.sink.z),
    toScreen(v) { return stage.toScreen(v); },
    pick(e, objs) { ray.setFromCamera(stage.ndc(e), camera); return ray.intersectObjects(objs, true)[0] || null; },
    planePoint(e, y = 0) { ray.setFromCamera(stage.ndc(e), camera); plane.constant = -y; return ray.ray.intersectPlane(plane, hitP) ? hitP.clone() : null; },
    clear() {
      Tweens.kill(ws); emitters.clear(); flameLevel = 0; stove.visible = false; stream.visible = false; room.visible = true;
      frameFns.forEach(f => { if (!keepFns.has(f)) frameFns.delete(f); });
      for (let i = ws.children.length - 1; i >= 0; i--) { const c = ws.children[i]; ws.remove(c); c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); }); }
    },
    dispose() { K.clear(); frameFns.clear(); steamMats.forEach(m => m.dispose()); flameMat.dispose(); stage.dispose(); disposeMats(); },
  };
  return K;
}

/* ——— bé đầu bếp (búp bê của bộ kit + mũ, tạp dề, quà thăng cấp) ——— */
export function makeChef(gifts = []) {
  const doll = createDoll({ face: { blushAmt: 0.55 }, base: '#FFFFFF' });
  // tóc ngắn
  const hair = mesh(new THREE.SphereGeometry(1.08, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.52), mat('#5A3A26', 0.6)); hair.rotation.x = -0.35; doll.head.add(hair);
  // mũ đầu bếp
  const hat = group('hat'); hat.position.set(0, 0.72, -0.05); hat.rotation.x = -0.12; doll.head.add(hat);
  const tall = gifts.includes('hat') || gifts.includes('crown');
  hat.add(mesh(new THREE.CylinderGeometry(0.72, 0.7, tall ? 0.55 : 0.3, 32), mat('#FFFFFF', 0.6), 0, tall ? 0.28 : 0.15, 0));
  const puff = mat('#FFFFFF', 0.7);
  [[0, 0.75, 0, 0.55], [-0.42, 0.62, 0, 0.42], [0.42, 0.62, 0, 0.42], [0, 0.62, -0.38, 0.42], [0, 0.62, 0.38, 0.42]].forEach(([x, y, z, r]) => hat.add(mesh(new THREE.SphereGeometry(r, 20, 14), puff, x, y + (tall ? 0.25 : 0) - 0.2, z)));
  if (gifts.includes('crown')) { const band = mesh(new THREE.TorusGeometry(0.72, 0.06, 8, 32), glossy('#FFC53D', 0.25, 1, { metalness: 0.6 }), 0, 0.05, 0); band.rotation.x = Math.PI / 2; hat.add(band); }
  // tạp dề
  const apronColor = gifts.includes('apron') ? '#FF7FAA' : '#8FD8F0';
  const apron = mesh(new THREE.CylinderGeometry(0.5, 0.56, 1.3, 32, 1, true, -1.05, 2.1), mat(apronColor, 0.7, 0, { side: THREE.DoubleSide }), 0, 1.45, 0.02); doll.body.add(apron);
  const pocket = mesh(new RoundedBoxGeometry(0.4, 0.26, 0.05, 2, 0.04), mat('#FFFFFF', 0.7), 0, 1.22, 0.54); doll.body.add(pocket);
  if (gifts.includes('badge')) { const b = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 5), glossy('#FFC53D', 0.25, 1, { metalness: 0.5 }), 0.2, 1.85, 0.5); b.rotation.x = Math.PI / 2; doll.body.add(b); }
  if (gifts.includes('ladle')) {
    const ladle = group('ladle'); doll.anchors.handR.add(ladle); ladle.rotation.set(-0.3, 0, 0.2);
    ladle.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), glossy('#FFC53D', 0.25, 1, { metalness: 0.7 }), 0, 0.45, 0));
    ladle.add(mesh(new THREE.SphereGeometry(0.18, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glossy('#FFC53D', 0.25, 1, { metalness: 0.7, side: THREE.DoubleSide }), 0, 1.0, 0.1));
  }
  return doll;
}
