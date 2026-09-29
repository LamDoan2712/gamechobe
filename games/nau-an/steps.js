// steps.js — bộ máy các thao tác nấu ăn. Mỗi loại bước là một hàm nhận (step, env) và trả về Promise<chất lượng 0..1>.
// Công thức (recipes-*.js) chỉ mô tả bước: loại thao tác + đối tượng 3D + hiệu ứng khi tiến triển.
//
// Các loại: rub (xoa: rửa, vo, bóc), tap (chạm đếm: đập trứng, nêm), pour (giữ để rót tới vạch), stir (khuấy vòng tròn),
// drag (kéo thả nguyên liệu vào nồi/bát, có thể theo thứ tự), sort (phân loại: lá xanh/lá úa), roll (vuốt lên để cuộn),
// squeeze (bấm liên tục để vắt), slice (chạm vào từng vạch để cắt/ngắt), adult (nhờ ba mẹ: dao, bếp), wait (chờ chín),
// decorate (bày trang trí), custom (step.run tự viết).

import { THREE, Tweens, Ease } from '../../kit/three-kit.js';
import { Sound } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';

const NUM = ['Một', 'Hai', 'Ba', 'Bốn', 'Năm', 'Sáu', 'Bảy', 'Tám', 'Chín', 'Mười'];
export const countWord = n => NUM[n - 1] || String(n);
const v3 = new THREE.Vector3(), box = new THREE.Box3(), sph = new THREE.Sphere();

// Tâm & bán kính trên màn hình (px) của một vật 3D
export function screenCircle(K, obj) {
  box.setFromObject(obj); box.getBoundingSphere(sph);
  const c = K.toScreen(sph.center), e = K.toScreen(v3.copy(sph.center).add(new THREE.Vector3(sph.radius, 0, 0)));
  return { x: c.x, y: c.y, r: Math.max(36, Math.hypot(e.x - c.x, e.y - c.y)) };
}
const near = (e, c, k = 1.25) => Math.hypot(e.clientX - c.x, e.clientY - c.y) < c.r * k;

// Gắn sự kiện chạm lên canvas; trả về hàm gỡ
function pointer(K, h) {
  const cv = K.stage.canvas; let active = null;
  const down = e => { if (active !== null) return; active = e.pointerId; try { cv.setPointerCapture(e.pointerId); } catch (_) {} h.down && h.down(e); };
  const move = e => { if (h.hover && active === null) h.hover(e); if (e.pointerId !== active) return; h.move && h.move(e); };
  const up = e => { if (e.pointerId !== active) return; active = null; h.up && h.up(e); };
  cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  return () => { cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); };
}
const throttle = (ms, fn) => { let t = 0; return (...a) => { const n = performance.now(); if (n - t > ms) { t = n; fn(...a); } }; };

/* Mỗi hàm dưới đây: (s = bước, env) → { promise, hint(), dispose() } */
const TYPES = {
  // Xoa lên vật: rửa, vo gạo, bóc vỏ
  rub(s, env) {
    const { K, ws } = env, target = s.target(ws), need = s.amount || 1;
    let p = 0, rubbing = false, last = null, done = false, resolve;
    const promise = new Promise(r => (resolve = r));
    const snd = throttle(150, () => (s.effect === 'water' ? Sound.fx.pour() : s.effect === 'foam' ? Sound.fx.bubble() : Sound.fx.rub()));
    const fx = throttle(40, e => {
      const x = e.clientX, y = e.clientY;
      if (s.effect === 'water') FX.drops(x, y, '#8FD3FF', 2);
      else if (s.effect === 'foam') FX.bubbles(x, y, 1);
      else if (s.effect === 'flakes') FX.drops(x, y, s.flakeColor || '#F6E3C8', 2);
      else FX.sparkle(x, y, s.sparkColor || '#FFFFFF', 1);
    });
    const off = pointer(K, {
      down(e) { const c = screenCircle(K, target); rubbing = near(e, c, 1.5); last = { x: e.clientX, y: e.clientY }; if (rubbing) env.touched(); },
      move(e) {
        if (!rubbing || done) return;
        const c = screenCircle(K, target), d = Math.hypot(e.clientX - last.x, e.clientY - last.y); last = { x: e.clientX, y: e.clientY };
        const k = near(e, c, 1.1) ? 1 : 0.5;
        p = Math.min(1, p + (d * k) / (c.r * 9 * need));
        env.progress(p); s.onProgress && s.onProgress(ws, p); fx(e); snd();
        target.rotation.z = Math.sin(performance.now() / 60) * 0.04;
        if (p >= 1) { done = true; target.rotation.z = 0; env.progress(1); Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(1)); }
      },
      up() { rubbing = false; target.rotation.z = 0; },
    });
    return { promise, hint: () => { const c = screenCircle(K, target); env.hand(c.x, c.y, 'rub'); }, dispose: off };
  },

  // Chạm đếm: đập trứng (3 lần), nêm (2 giọt), bấm nút
  tap(s, env) {
    const { K, ws } = env, target = s.target(ws), count = s.count || 1;
    let n = 0, busy = false, resolve;
    const promise = new Promise(r => (resolve = r));
    env.counter && s.showCount !== false && count > 1 && env.counter(0, count);
    const off = pointer(K, {
      down(e) {
        if (busy || n >= count) return;
        const c = screenCircle(K, target); if (!near(e, c, 1.6)) return;
        env.touched(); busy = true; n++;
        if (s.say !== false && count > 1) env.say(countWord(n) + '!', true);
        count > 1 && s.showCount !== false && env.counter(n, count);
        Promise.resolve(s.onTap ? s.onTap(ws, n, count, K) : Sound.fx.pop()).then(() => {
          busy = false;
          if (n >= count) Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(1));
        });
      },
    });
    return { promise, hint: () => { const c = screenCircle(K, target); env.hand(c.x, c.y, 'tap'); }, dispose: () => { off(); env.counter && env.counter(null); } };
  },

  // Giữ để rót tới vạch; thả tay để dừng
  pour(s, env) {
    const { K, ws } = env, line = s.line ?? 0.6, max = s.max ?? 1, rate = s.rate || 0.28, tol = s.tol ?? 0.07;
    let level = s.from ?? 0, pouring = false, done = false, warned = false, resolve;
    const promise = new Promise(r => (resolve = r));
    const pourer = s.pourer ? s.pourer(ws) : null, rest = pourer ? pourer.rotation.z : 0;
    const snd = throttle(210, () => Sound.fx.pour());
    s.onLevel && s.onLevel(ws, level);
    const stop = () => {
      if (!pouring) return; pouring = false;
      if (pourer) Tweens.add(pourer.rotation, { z: rest }, 0.3);
      s.stream && s.stream(ws, false);
      if (!done && level >= line - tol) finish();
      else if (!done && level > 0.02) env.say(s.moreSay || 'Rót thêm chút nữa!');
    };
    const finish = () => {
      done = true; const q = Math.max(0.3, 1 - Math.max(0, Math.abs(level - line) - tol) / 0.25);
      if (level > line + tol + 0.08) env.say('Hơi nhiều rồi, lần sau rót ít hơn nhé!');
      Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(q));
    };
    const offF = K.onFrame(dt => {
      if (!pouring || done) return;
      level = Math.min(max, level + rate * dt); s.onLevel && s.onLevel(ws, level); snd(); env.progress(level / line);
      if (!warned && level >= line - tol) { warned = true; env.say('Dừng lại! Thả tay ra nào!', true); env.flag && env.flag('Dừng!'); }
      if (level >= max) { stop(); if (!done) finish(); FX.drops(innerWidth / 2, innerHeight / 2, '#8FD3FF', 8); }
    });
    const off = pointer(K, {
      down() { if (done) return; env.touched(); pouring = true; if (pourer) Tweens.add(pourer.rotation, { z: rest + (s.tilt ?? -1.1) }, 0.35, { ease: Ease.outCubic }); s.stream && s.stream(ws, true); },
      up: stop,
    });
    return { promise, hint: () => { const o = (pourer || (s.vessel && s.vessel(ws))); const c = o ? screenCircle(K, o) : { x: innerWidth / 2, y: innerHeight / 2 }; env.hand(c.x, c.y, 'hold'); }, dispose: () => { off(); offF(); env.flag && env.flag(null); } };
  },

  // Khuấy/đánh theo vòng tròn quanh tâm vật chứa
  stir(s, env) {
    const { K, ws } = env, rounds = s.rounds || 3, tool = s.tool ? s.tool(ws) : null;
    const center = s.center(ws), rad = s.radius || 0.45, toolY = s.toolY ?? 0.3;
    let acc = 0, lastA = null, stirring = false, done = false, resolve;
    const promise = new Promise(r => (resolve = r));
    const snd = throttle(170, () => Sound.fx.rub());
    const off = pointer(K, {
      down(e) { const c = K.toScreen(center); stirring = Math.hypot(e.clientX - c.x, e.clientY - c.y) < Math.max(160, innerWidth * 0.3); lastA = null; if (stirring) env.touched(); },
      move(e) {
        if (!stirring || done) return;
        const c = K.toScreen(center), a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
        if (lastA !== null) { let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; acc += Math.min(0.8, Math.abs(d)); }
        lastA = a;
        const p = Math.min(1, acc / (Math.PI * 2 * rounds)); env.progress(p); s.onProgress && s.onProgress(ws, p); snd();
        if (tool) { const w = K.planePoint(e, center.y + toolY); if (w) { v3.set(w.x - center.x, 0, w.z - center.z); if (v3.length() > rad) v3.setLength(rad); tool.position.set(center.x + v3.x, center.y + toolY, center.z + v3.z); } }
        if (p >= 1) { done = true; Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(1)); }
      },
      up() { stirring = false; },
    });
    return { promise, hint: () => { const c = K.toScreen(center); env.hand(c.x, c.y, 'circle'); }, dispose: off };
  },

  // Kéo thả nguyên liệu vào vật chứa (order: phải đúng thứ tự)
  drag(s, env) {
    const { K, ws } = env, items = s.items(ws).map((it, i) => Object.assign({ i, placed: false }, it));
    const zone = s.target(ws), liftY = s.liftY ?? 0.9;
    let dragging = null, mistakes = 0, placed = 0, resolve;
    const promise = new Promise(r => (resolve = r));
    items.forEach(it => { it.home = it.obj.position.clone(); it.baseY = it.obj.position.y; });
    const expected = () => items.find(it => !it.placed);
    const offF = K.onFrame((dt, t) => {
      items.forEach(it => { if (it.placed || it === dragging) return; const invite = !s.order || it === expected(); it.obj.position.y = it.baseY + (invite ? Math.abs(Math.sin(t * 3 + it.i)) * 0.12 : 0); });
    });
    const off = pointer(K, {
      down(e) {
        const hit = K.pick(e, items.filter(it => !it.placed).map(it => it.obj)); if (!hit) return;
        dragging = items.find(it => !it.placed && (it.obj === hit.object || it.obj.getObjectById(hit.object.id)));
        if (dragging) { env.touched(); Sound.fx.pop(); Tweens.kill(dragging.obj.position); }
      },
      move(e) { if (!dragging) return; const p = K.planePoint(e, liftY); if (p) dragging.obj.position.set(p.x, liftY, p.z); },
      up() {
        if (!dragging) return; const it = dragging; dragging = null;
        const pos = it.obj.position, d = Math.hypot(pos.x - zone.pos.x, pos.z - zone.pos.z);
        if (d < zone.r) {
          if (s.order && it !== expected()) {
            mistakes++; Sound.fx.boop(); env.say(s.wrongSay ? s.wrongSay(expected()) : `Cho ${expected().name} trước nhé!`, true);
            Tweens.add(pos, { x: it.home.x, y: it.baseY, z: it.home.z }, 0.35, { ease: Ease.outBack }); return;
          }
          it.placed = true; placed++; env.progress(placed / items.length); Sound.fx.pop();
          const sc = K.toScreen(pos); FX.sparkle(sc.x, sc.y, '#FFD34D', 6);
          Promise.resolve(s.place ? s.place(ws, it, placed, K) : Tweens.to(pos, { x: zone.pos.x, y: zone.pos.y ?? 0.3, z: zone.pos.z }, 0.35)).then(() => {
            if (placed >= items.length) Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(Math.max(0.4, 1 - mistakes * 0.2)));
          });
        } else Tweens.add(pos, { x: it.home.x, y: it.baseY, z: it.home.z }, 0.35, { ease: Ease.outBack });
      },
    });
    return {
      promise,
      hint: () => { const it = expected(); if (!it) return; const a = K.toScreen(it.obj.position), b = K.toScreen(zone.pos); env.handPath(a, b); },
      dispose: () => { off(); offF(); },
    };
  },

  // Phân loại: đồ tốt vào chỗ tốt, đồ hỏng vào thùng rác
  sort(s, env) {
    const { K, ws } = env, items = s.items(ws).map((it, i) => Object.assign({ i, placed: false }, it));
    const good = s.good(ws), bad = s.bad(ws), liftY = s.liftY ?? 0.8;
    let dragging = null, mistakes = 0, placed = 0, resolve;
    const promise = new Promise(r => (resolve = r));
    items.forEach(it => { it.home = it.obj.position.clone(); });
    const off = pointer(K, {
      down(e) { const hit = K.pick(e, items.filter(it => !it.placed).map(it => it.obj)); if (!hit) return; dragging = items.find(it => !it.placed && (it.obj === hit.object || it.obj.getObjectById(hit.object.id))); if (dragging) { env.touched(); Sound.fx.pop(); } },
      move(e) { if (!dragging) return; const p = K.planePoint(e, liftY); if (p) dragging.obj.position.set(p.x, liftY, p.z); },
      up() {
        if (!dragging) return; const it = dragging; dragging = null; const pos = it.obj.position;
        const inGood = Math.hypot(pos.x - good.pos.x, pos.z - good.pos.z) < good.r, inBad = Math.hypot(pos.x - bad.pos.x, pos.z - bad.pos.z) < bad.r;
        if ((inGood && it.good) || (inBad && !it.good)) {
          it.placed = true; placed++; env.progress(placed / items.length); Sound.fx.pop();
          const z = it.good ? good : bad; Promise.resolve(s.place ? s.place(ws, it, z, K) : Tweens.to(pos, { x: z.pos.x + (Math.random() - 0.5) * z.r * 0.6, y: z.pos.y ?? 0.3, z: z.pos.z + (Math.random() - 0.5) * z.r * 0.4 }, 0.3)).then(() => {
            if (placed >= items.length) resolve(Math.max(0.4, 1 - mistakes * 0.15));
          });
        } else {
          if (inGood || inBad) { mistakes++; Sound.fx.boop(); env.say(it.good ? (s.goodSay || 'Lá xanh còn ngon, để vào rổ nhé!') : (s.badSay || 'Lá úa bỏ vào thùng rác nhé!'), true); }
          Tweens.add(pos, { x: it.home.x, y: it.home.y, z: it.home.z }, 0.35, { ease: Ease.outBack });
        }
      },
    });
    return { promise, hint: () => { const it = items.find(x => !x.placed); if (!it) return; env.handPath(K.toScreen(it.obj.position), K.toScreen((it.good ? good : bad).pos)); }, dispose: off };
  },

  // Vuốt lên để cuộn (gỏi cuốn…)
  roll(s, env) {
    const { K, ws } = env, target = s.target(ws), stages = s.stages || 3;
    let stage = 0, start = null, resolve;
    const promise = new Promise(r => (resolve = r));
    const off = pointer(K, {
      down(e) { start = { x: e.clientX, y: e.clientY }; env.touched(); },
      move(e) {
        if (!start) return;
        if (start.y - e.clientY > 45) {
          start = null; stage++; Sound.fx.whoosh(); env.progress(stage / stages);
          Promise.resolve(s.onStage && s.onStage(ws, stage, K)).then(() => { if (stage >= stages) Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(1)); });
        }
      },
      up() { start = null; },
    });
    return { promise, hint: () => { const c = screenCircle(K, target); env.hand(c.x, c.y, 'swipeup'); }, dispose: off };
  },

  // Bấm liên tục để vắt
  squeeze(s, env) {
    const { K, ws } = env, target = s.target(ws), presses = s.presses || 5;
    let n = 0, busy = false, resolve;
    const promise = new Promise(r => (resolve = r));
    const off = pointer(K, {
      down(e) {
        const c = screenCircle(K, target); if (busy || !near(e, c, 1.8) || n >= presses) return;
        env.touched(); n++; env.progress(n / presses); busy = true;
        Sound.fx.bubble(); FX.drops(c.x, c.y + c.r * 0.5, s.juiceColor || '#FFB02E', 4);
        Promise.resolve(s.onPress && s.onPress(ws, n, presses, K)).then(() => { busy = false; if (n >= presses) Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(1)); });
      },
    });
    return { promise, hint: () => { const c = screenCircle(K, target); env.hand(c.x, c.y, 'tap'); }, dispose: off };
  },

  // Chạm vào từng điểm để cắt/ngắt (điểm có vòng tròn gợi ý)
  slice(s, env) {
    const { K, ws } = env, pts = s.points(ws), cut = pts.map(() => false);
    let n = 0, busy = false, resolve;
    const promise = new Promise(r => (resolve = r));
    const marks = pts.map(p => { const m = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.17, 24), new THREE.MeshBasicMaterial({ color: '#FF5C9A', transparent: true, opacity: 0.9, depthTest: false })); m.rotation.x = -Math.PI / 2; m.position.copy(p).y += 0.2; m.renderOrder = 20; K.ws.add(m); return m; });
    const offF = K.onFrame((dt, t) => marks.forEach((m, i) => { if (!cut[i]) m.scale.setScalar(1 + Math.sin(t * 5 + i) * 0.15); }));
    const off = pointer(K, {
      down(e) {
        if (busy) return;
        let best = -1, bd = 1e9;
        pts.forEach((p, i) => { if (cut[i]) return; const c = K.toScreen(p), d = Math.hypot(e.clientX - c.x, e.clientY - c.y); if (d < bd) { bd = d; best = i; } });
        if (best < 0 || bd > Math.max(50, innerWidth * 0.07)) return;
        env.touched(); cut[best] = true; n++; marks[best].visible = false; env.progress(n / pts.length);
        Sound.fx[s.sound || 'chop'](); const c = K.toScreen(pts[best]); FX.sparkle(c.x, c.y, '#FFFFFF', 4);
        busy = true;
        Promise.resolve(s.onCut && s.onCut(ws, best, n, K)).then(() => { busy = false; if (n >= pts.length) Promise.resolve(s.done && s.done(ws, K)).then(() => resolve(1)); });
      },
    });
    return { promise, hint: () => { const i = cut.indexOf(false); if (i >= 0) { const c = K.toScreen(pts[i]); env.hand(c.x, c.y, 'tap'); } }, dispose: () => { off(); offF(); marks.forEach(m => { K.ws.remove(m); m.geometry.dispose(); m.material.dispose(); }); } };
  },

  // Nhờ ba mẹ làm (dao sắc, bếp nóng). Bé chạm "Nhờ mẹ giúp" → ba mẹ làm → bé nói "Con cảm ơn ạ!"
  adult(s, env) {
    const { K, ws } = env;
    let resolve;
    const promise = new Promise(r => (resolve = r));
    env.adult(s, async () => { await s.run(ws, K, env); }, () => resolve(1));
    return { promise, hint: () => env.hintAdult(), dispose: () => env.adultClose() };
  },

  // Chờ (nồi cơm đang nấu…)
  wait(s, env) {
    const { K, ws } = env;
    const promise = (async () => { env.timer(s.secs || 4); await s.run(ws, K, env); env.timer(null); return 1; })();
    return { promise, hint: () => {}, dispose: () => env.timer(null) };
  },

  // Bày trang trí: chọn món trang trí rồi chạm lên đĩa
  decorate(s, env) {
    const { K, ws } = env, surface = s.surface(ws), min = s.min || 4, maxN = s.max || 14;
    let n = 0, pick = s.garnishes[0].key, resolve;
    const promise = new Promise(r => (resolve = r));
    env.palette(s.garnishes, k => { pick = k; }, () => resolve(1));
    const off = pointer(K, {
      down(e) {
        const hit = K.pick(e, [surface]); if (!hit || n >= maxN) return;
        env.touched(); n++;
        const g = s.garnishes.find(x => x.key === pick).make();
        const local = surface.parent.worldToLocal(hit.point.clone());
        g.position.copy(local); g.position.y += 0.02; g.rotation.y = Math.random() * 6; g.scale.setScalar(0.01);
        surface.parent.add(g); Tweens.add(g.scale, { x: 1, y: 1, z: 1 }, 0.3, { ease: Ease.outBack });
        Sound.fx.pop(); FX.sparkle(e.clientX, e.clientY, '#FFD34D', 4);
        env.progress(Math.min(1, n / min));
        if (n === min) env.paletteDone(true);
        if (n >= maxN) resolve(1);
      },
    });
    return { promise, hint: () => { const c = screenCircle(K, surface); env.hand(c.x, c.y, 'tap'); }, dispose: () => { off(); env.palette(null); } };
  },

  custom(s, env) {
    let api = { hint: () => {}, dispose: () => {} };
    const promise = s.run(env.ws, env.K, env, a => { api = Object.assign(api, a); });
    return { promise, hint: () => api.hint(), dispose: () => api.dispose() };
  },
};
TYPES.button = (s, env) => TYPES.tap(Object.assign({ count: 1 }, s), env);

export function startStep(s, env) {
  const make = TYPES[s.type];
  if (!make) throw new Error('Loại bước không có: ' + s.type);
  return make(s, env);
}
