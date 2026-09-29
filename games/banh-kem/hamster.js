// hamster.js — chú hamster 3D dựng từ khối cầu: thân cam vàng, bụng kem, má phính, tai hồng, mắt hạt đen long lanh.
// Có vật lý nhảy đơn giản, co giãn khi nhảy/đáp, nhún nhảy vui, lộn nhào khi bị bánh va, và phụ kiện đội đầu.

import { THREE, toon } from '../../kit/three-kit.js';

export const HAM_R = 0.42;       // nửa bề ngang (dùng để tính lúc bánh chạm hamster)
export const HAM_H = 1.34;       // chiều cao tới đỉnh tai
const TUMBLE = 0.85;

export function createHamster() {
  const own = [];
  const keep = x => (own.push(x), x);
  const sph = keep(new THREE.SphereGeometry(1, 28, 20));
  const M = {
    fur: keep(toon('#F7A64B')), cream: keep(toon('#FFF1DA')), pink: keep(toon('#FFB3C7')), nose: keep(toon('#FF7FA3')),
    paw: keep(toon('#FFD3C4')), blush: keep(toon('#FF9DB8', { transparent: true, opacity: 0.8 })),
    eye: keep(new THREE.MeshBasicMaterial({ color: '#2A1A22' })), shine: keep(new THREE.MeshBasicMaterial({ color: '#FFFFFF' })),
    mouth: keep(new THREE.MeshBasicMaterial({ color: '#7A3E36' })), tongue: keep(new THREE.MeshBasicMaterial({ color: '#D9486E' })),
    star: keep(new THREE.MeshBasicMaterial({ color: '#FFD34D' })),
  };
  const part = (parent, mat, x, y, z, sx, sy = sx, sz = sx, shadow = false) => {
    const m = new THREE.Mesh(sph, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = shadow; parent.add(m); return m;
  };

  const root = new THREE.Group(); root.name = 'hamster';
  const squash = new THREE.Group(); root.add(squash);             // co giãn, tâm ở chân
  const tumble = new THREE.Group(); tumble.position.y = 0.5; squash.add(tumble);   // lộn nhào quanh tâm thân
  const model = new THREE.Group(); model.position.y = -0.5; tumble.add(model);

  part(model, M.fur, 0, 0.47, 0, 0.5, 0.47, 0.46, true);           // thân
  part(model, M.cream, 0, 0.42, 0.16, 0.38, 0.36, 0.32);           // bụng
  part(model, M.cream, 0, 0.24, -0.43, 0.085);                     // đuôi
  const paws = [-1, 1].map(s => part(model, M.paw, s * 0.15, 0.52, 0.4, 0.085, 0.075, 0.08));
  [-1, 1].forEach(s => part(model, M.paw, s * 0.2, 0.05, 0.24, 0.1, 0.055, 0.13));   // bàn chân

  const head = new THREE.Group(); head.position.set(0, 0.9, 0.03); model.add(head);
  part(head, M.fur, 0, 0, 0, 0.43, 0.39, 0.4, true);                // đầu (hoà vào thân)
  part(head, M.cream, 0, -0.1, 0.2, 0.3, 0.2, 0.22);               // mõm trắng
  [-1, 1].forEach(s => {
    part(head, M.cream, s * 0.24, -0.1, 0.17, 0.18, 0.16, 0.16);   // má phính
    part(head, M.blush, s * 0.26, -0.08, 0.31, 0.075, 0.05, 0.03); // má hồng
    const ear = new THREE.Group(); ear.position.set(s * 0.27, 0.3, -0.03); ear.rotation.z = -s * 0.35; head.add(ear);
    part(ear, M.fur, 0, 0, 0, 0.13, 0.13, 0.065, true);
    part(ear, M.pink, 0, 0, 0.035, 0.085, 0.085, 0.04);
  });
  // mắt: hạt đen long lanh + mắt cười (∩) + mắt nhắm đau (> <)
  const arcGeo = keep(new THREE.TorusGeometry(0.045, 0.014, 6, 14, Math.PI));
  const eyes = [-1, 1].map(s => {
    const g = new THREE.Group(); g.position.set(s * 0.155, 0.05, 0.335); head.add(g);
    const bead = new THREE.Group(); g.add(bead);
    part(bead, M.eye, 0, 0, 0, 0.06, 0.07, 0.05);
    part(bead, M.shine, 0.022, 0.026, 0.04, 0.02);
    part(bead, M.shine, -0.018, -0.022, 0.042, 0.009);
    const arc = new THREE.Mesh(arcGeo, M.eye); arc.position.z = 0.03; arc.visible = false; g.add(arc);
    return { g, bead, arc, s };
  });
  part(head, M.nose, 0, -0.03, 0.408, 0.045, 0.032, 0.03);         // mũi hồng
  const wGeo = keep(new THREE.TorusGeometry(0.028, 0.008, 5, 10, Math.PI));
  const mouthW = new THREE.Group(); head.add(mouthW);
  [-1, 1].forEach(s => { const w = new THREE.Mesh(wGeo, M.mouth); w.rotation.z = Math.PI; w.position.set(s * 0.028, -0.095, 0.418); mouthW.add(w); });
  const mouthOpen = part(head, M.tongue, 0, -0.13, 0.4, 0.05, 0.045, 0.03); mouthOpen.visible = false;

  // sao xoay quanh đầu khi choáng
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.035 : 0.085, a = (i / 10) * Math.PI * 2 + Math.PI / 2; i ? starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const starGeo = keep(new THREE.ExtrudeGeometry(starShape, { depth: 0.03, bevelEnabled: false }));
  const dizzy = new THREE.Group(); dizzy.position.y = 0.5; dizzy.visible = false; head.add(dizzy);
  for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(starGeo, M.star), a = (i / 3) * Math.PI * 2; st.position.set(Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32); dizzy.add(st); }

  /* ——— phụ kiện ——— */
  const accRoot = new THREE.Group(); head.add(accRoot);
  const accs = {};
  function buildAcc(id) {
    const g = new THREE.Group();
    if (id === 'bow') {
      const mat = keep(toon('#FF6FA5')), cone = keep(new THREE.ConeGeometry(0.1, 0.2, 14));
      [-1, 1].forEach(s => { const c = new THREE.Mesh(cone, mat); c.rotation.z = s * Math.PI / 2; c.position.x = s * 0.1; c.scale.z = 0.6; c.castShadow = true; g.add(c); });
      part(g, keep(toon('#FF4D8F')), 0, 0, 0, 0.05);
      g.position.set(0.2, 0.33, 0.08); g.rotation.set(0.1, 0.25, -0.4);
    } else if (id === 'chef') {
      const mat = keep(toon('#FFFFFF'));
      const band = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.23, 0.22, 0.14, 24)), mat); band.position.y = 0.4; band.castShadow = true; g.add(band);
      part(g, mat, 0, 0.6, 0, 0.21, 0.19, 0.21, true);
      [[0.15, 0.53, 0.02], [-0.15, 0.53, 0.02], [0, 0.53, 0.14], [0, 0.55, -0.12]].forEach(([x, y, z]) => part(g, mat, x, y, z, 0.15, 0.14, 0.15));
      g.rotation.z = 0.12; g.position.x = -0.03;
    } else if (id === 'crown') {
      const gold = keep(toon('#FFCF3F', { side: THREE.DoubleSide }));
      const ring = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.2, 0.18, 0.12, 24, 1, true)), gold); ring.position.y = 0.42; ring.castShadow = true; g.add(ring);
      const spike = keep(new THREE.ConeGeometry(0.045, 0.13, 10));
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 2, sp = new THREE.Mesh(spike, gold); sp.position.set(Math.cos(a) * 0.19, 0.54, Math.sin(a) * 0.19); g.add(sp); part(sp, gold, 0, 0.075, 0, 0.022); }
      part(g, keep(toon('#FF5C9A')), 0, 0.42, 0.195, 0.035, 0.035, 0.02);
      const blue = keep(toon('#7FC4FF'));
      [-1, 1].forEach(s => part(g, blue, s * 0.12, 0.42, 0.155, 0.025, 0.025, 0.015));
      g.rotation.z = -0.1;
    } else if (id === 'glasses') {
      const heart = (sc) => { const h = new THREE.Shape(); h.moveTo(0, -0.08 * sc); h.bezierCurveTo(-0.15 * sc, -0.0 * sc, -0.12 * sc, 0.12 * sc, 0, 0.05 * sc); h.bezierCurveTo(0.12 * sc, 0.12 * sc, 0.15 * sc, 0, 0, -0.08 * sc); return h; };
      const outer = heart(1); outer.holes.push(heart(0.62));
      const frameGeo = keep(new THREE.ExtrudeGeometry(outer, { depth: 0.025, bevelEnabled: false, curveSegments: 10 }));
      const lensGeo = keep(new THREE.ShapeGeometry(heart(0.66), 10));
      const frameMat = keep(toon('#FF3D8B')), lensMat = keep(new THREE.MeshBasicMaterial({ color: '#FF9CC4', transparent: true, opacity: 0.4, depthWrite: false }));
      [-1, 1].forEach(s => {
        const f = new THREE.Mesh(frameGeo, frameMat); f.position.set(s * 0.16, 0.05, 0.39); g.add(f);
        const l = new THREE.Mesh(lensGeo, lensMat); l.position.set(s * 0.16, 0.05, 0.4); l.renderOrder = 3; g.add(l);
      });
      const bridge = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6)), frameMat); bridge.rotation.z = Math.PI / 2; bridge.position.set(0, 0.09, 0.4); g.add(bridge);
    }
    return g;
  }

  /* ——— trạng thái ——— */
  let y = 0, vy = 0, g = 20, air = false, groundY = 0;
  let s = 1, sv = 0;                      // lò xo co giãn
  let tumbleT = 0, tumbleSide = 1, danceT = 0, hopClock = 0, moodT = 0, mood = null, dizzyT = 0;
  let blinkT = 2, blinkDur = 0, lookGoal = 0, accPop = 1;

  function setMood(m, secs) {
    mood = m; moodT = secs;
    const closed = m === 'happy' || m === 'ouch';
    for (const e of eyes) {
      e.bead.visible = !closed; e.arc.visible = closed;
      e.arc.rotation.z = m === 'ouch' ? (e.s < 0 ? -Math.PI / 2 : Math.PI / 2) : 0;
    }
    mouthOpen.visible = closed; mouthW.visible = !closed;
  }

  const ham = {
    root, head, onLand: null,
    get y() { return y; }, set y(v) { y = v; }, get air() { return air; }, get groundY() { return groundY; }, get dancing() { return danceT > 0; },
    // đặt mặt đất; snap = đặt ngay (khi bắt đầu màn)
    setGround(v, snap) { groundY = v; if (snap) { y = v; vy = 0; air = false; } },
    jump(v0, grav) {
      if (air) return false;
      vy = v0; g = grav; air = true; s = 1.3; sv = 0;
      return true;
    },
    // đáp ngay xuống mặt đất mới (khi bánh trượt vào dưới chân lúc hamster còn thấp)
    landNow() { y = groundY; vy = 0; if (air) { air = false; s = 0.72; sv = 0; if (ham.onLand) ham.onLand(); } },
    hop(h = 0.42) { if (air) return; ham.jump(Math.sqrt(2 * 18 * h), 18); setMood('happy', 0.7); },
    tumble(side) {
      tumbleT = TUMBLE; tumbleSide = side; dizzyT = 1.4; dizzy.visible = true; setMood('ouch', 1.1);
      if (!air) ham.jump(3.4, 16);
    },
    dance(secs) { danceT = secs; hopClock = 0; setMood('happy', secs); },
    happy(secs = 0.8) { setMood('happy', secs); },
    look(dir) { lookGoal = dir * 0.45; },
    setAccessory(id) {
      for (const k in accs) accs[k].visible = false;
      if (id && id !== 'none') {
        if (!accs[id]) { accs[id] = buildAcc(id); accRoot.add(accs[id]); }
        accs[id].visible = true; accPop = 0;
      }
    },
    update(dt, t) {
      // vật lý nhảy
      if (air) {
        vy -= g * dt; y += vy * dt;
        if (y <= groundY && vy <= 0) { y = groundY; vy = 0; air = false; s = 0.72; sv = 0; if (ham.onLand) ham.onLand(); }
      } else if (y !== groundY) {
        y += (groundY - y) * Math.min(1, dt * 14); if (Math.abs(groundY - y) < 0.002) y = groundY;
      }
      root.position.y = y;

      // lò xo co giãn (giữ thể tích)
      sv += (-260 * (s - 1) - 13 * sv) * dt; s += sv * dt;
      const br = air ? 0 : Math.sin(t * 3.2) * 0.018;
      const sy = s + br, sx = 1 / Math.sqrt(Math.max(0.4, s)) - br * 0.5;
      squash.scale.set(sx, sy, sx);

      // lộn nhào
      if (tumbleT > 0) {
        tumbleT = Math.max(0, tumbleT - dt);
        const p = 1 - tumbleT / TUMBLE, e = 1 - Math.pow(1 - p, 3);
        tumble.rotation.z = -tumbleSide * e * Math.PI * 2;
        root.position.x = tumbleSide * 0.35 * Math.sin(p * Math.PI);
        if (tumbleT === 0) { tumble.rotation.z = 0; root.position.x = 0; }
      }
      // nhảy múa
      if (danceT > 0) {
        danceT -= dt; hopClock -= dt;
        model.rotation.y = Math.sin(t * 7) * 0.55;
        if (tumbleT <= 0) tumble.rotation.z = Math.sin(t * 10) * 0.16;
        paws[0].position.y = 0.52 + Math.max(0, Math.sin(t * 14)) * 0.14; paws[1].position.y = 0.52 + Math.max(0, -Math.sin(t * 14)) * 0.14;
        if (!air && hopClock <= 0) { hopClock = 0.55; ham.jump(4.2, 20); }
        if (danceT <= 0) { tumble.rotation.z = 0; paws[0].position.y = paws[1].position.y = 0.52; }
      } else {
        model.rotation.y += (lookGoal - model.rotation.y) * Math.min(1, dt * 6);
      }
      head.rotation.z = Math.sin(t * 1.7) * 0.05;
      head.rotation.x = air ? -0.12 : Math.sin(t * 1.1) * 0.03;

      // chớp mắt
      if (blinkDur > 0) { blinkDur -= dt; const k = blinkDur > 0 ? 0.12 : 1; eyes[0].bead.scale.y = eyes[1].bead.scale.y = k; }
      else if ((blinkT -= dt) <= 0) { blinkDur = 0.12; blinkT = 2.2 + Math.random() * 3; eyes[0].bead.scale.y = eyes[1].bead.scale.y = 0.12; }
      // biểu cảm tạm thời
      if (moodT > 0) { moodT -= dt; if (moodT <= 0) setMood(null, 0); }
      if (dizzyT > 0) { dizzyT -= dt; dizzy.rotation.y += dt * 7; if (dizzyT <= 0) dizzy.visible = false; }
      // phụ kiện bật ra khi vừa đội
      if (accPop < 1) { accPop = Math.min(1, accPop + dt * 3.2); const p = accPop, c = 1.70158; accRoot.scale.setScalar(1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2)); }
    },
    reset() { tumbleT = 0; danceT = 0; dizzyT = 0; dizzy.visible = false; tumble.rotation.z = 0; root.position.x = 0; model.rotation.y = 0; lookGoal = 0; setMood(null, 0); s = 1; sv = 0; },
    dispose() { for (const x of own) x.dispose(); own.length = 0; },
  };
  return ham;
}
