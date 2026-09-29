// recipes-b.js — phần tương tác 3D của 4 món: Bánh mì ốp la, Gỏi cuốn, Canh bí đỏ, Rau muống xào tỏi.
// Cấu trúc giống recipes-a.js: build(K) dựng đồ trên bàn (vật kéo thả được phải là con trực tiếp của K.ws),
// steps[] khớp thứ tự với data.js (voice = lời hướng dẫn nói to), reveal(ws) = món đã xong để máy quay lại gần,
// final() = món hoàn chỉnh đứng riêng (ảnh thu nhỏ, mâm cơm). Việc dao, bếp, đồ nóng luôn do ba mẹ làm.

import { THREE, Tweens, Ease } from '../../kit/three-kit.js';
import { Sound } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import * as MD from './models.js';
import * as MB from './models-b.js';
import { liquid, own, glossy, mat } from './mats.js';
import { SPOT } from './kitchen.js';
import { arc, popIn, popOut, moveTo, squash, chop, pourStream, wait } from './anim.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const add = (K, o, pos) => { if (pos) o.position.copy(pos); K.ws.add(o); return o; };
const wpos = (o, x = 0, y = 0, z = 0) => { o.updateWorldMatrix(true, false); return o.localToWorld(new THREE.Vector3(x, y, z)); };
const scr = (K, o) => K.toScreen(o.isVector3 ? o : wpos(o));
const fx = (K, o, color = '#FFD34D', n = 6) => { const s = scr(K, o); FX.sparkle(s.x, s.y, color, n); };
const drops = (K, o, color = '#8FD3FF', n = 6) => { const s = scr(K, o); FX.drops(s.x, s.y, color, n); };
const tweenNum = (from, to, dur, set, ease) => { const p = { v: from }; return Tweens.to(p, { v: to }, dur, { ease, onUpdate: () => set(p.v) }); };
const turn = (o, to, dur = 0.3) => Tweens.to(o.rotation, to, dur);
const scaleTo = (o, s, dur = 0.3) => Tweens.to(o.scale, typeof s === 'number' ? { x: s, y: s, z: s } : s, dur);
const toWs = (K, o) => { K.ws.attach(o); return o; };          // thành con trực tiếp của K.ws (giữ nguyên vị trí)
const into = (parent, o) => { parent.attach(o); return o; };
const trash = o => { if (!o) return; if (o.parent) o.parent.remove(o); o.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.isInstancedMesh) c.dispose(); }); };
// Món còn trên bếp không? (K.clear() gỡ mọi thứ khỏi K.ws khi bé thoát giữa chừng)
const live = ws => !!ws.anchor.parent;
const loop = (K, ws, fn) => { const off = K.onFrame((dt, t) => { if (!live(ws)) { off(); return; } fn(dt, t); }); return off; };
const sinkAt = (y = 0.08) => V(SPOT.sink.x, y, SPOT.sink.z);
// Màn hình dọc (điện thoại, iPad dọc): đồ được bày trước–sau thay vì trái–phải để to, dễ chạm. Chọn một lần khi dựng món.
const isP = K => K.stage.height > K.stage.width * 1.05;
// Khung nhìn theo hướng màn hình: l / p = [x, y, z, rộng, cao, góc nghiêng?]
const vw = (K, ws, l, p) => { const a = ws.P ? p : l; K.view(V(a[0], a[1], a[2]), a[3], a[4], a[5] ?? 0.9); };
const sinkView = K => K.view(V(SPOT.sink.x + 0.2, 0.6, SPOT.sink.z + 0.3), 3.4, 2.8);
async function sounds(ws, secs, name = 'sizzle', gap = 0.4) { for (let t = 0; t < secs && live(ws); t += gap) { Sound.fx[name](); await wait(gap); } }
// Trạng thái món: anchor để biết món còn trên bếp, P = bày theo màn hình dọc
const anchor = K => ({ anchor: add(K, MD.group('anchor')), K, P: isP(K) });
const pop = (o, dur = 0.35) => popIn(o, dur, o.scale.x); // hiện ra, giữ đúng tỉ lệ sẵn có (đĩa, bát thu nhỏ)

/* ═════════ 4. BÁNH MÌ ỐP LA ═════════ */
const BM_L = { board: V(-2.1, 0, 0.75), stove: V(1.7, 0, 0.15), tray: V(0.0, 0, 1.9), eggPlate0: V(-0.3, 0, 1.95), eggPlate: V(2.35, 0, 0.85), bottle: V(3.75, 0, -1.3), bottleNear: V(2.05, 0, -0.55), basket: V(-0.9, 0, -1.3), plate: V(0.3, 0, 0.35) };
const BM_P = { board: V(-0.9, 0, 1.2), stove: V(0.9, 0, -1.3), tray: V(1.7, 0, 1.4), eggPlate0: V(1.7, 0, 1.45), eggPlate: V(1.55, 0, 1.3), bottle: V(2.9, 0, -1.9), bottleNear: V(1.75, 0, -0.9), basket: V(-2.1, 0, -0.9), plate: V(0.2, 0, -0.85) };
let BM = BM_L;
const BT = 0.112; // mặt thớt (thớt thu nhỏ 0.8)
function banhmiPlate() {
  const p = MD.plate(0.95);
  const b = MB.filledBaguette(); b.position.set(-0.05, 0.075, -0.08); b.rotation.y = 0.3; p.add(b);
  const cs = MB.cucumberSlices(3); cs.position.set(0.3, 0.07, 0.78); cs.rotation.y = 0.35; p.add(cs);
  return p;
}
const banhmi = {
  build(K) {
    const ws = anchor(K); BM = ws.P ? BM_P : BM_L;
    ws.basket = add(K, MB.basket(0.72), sinkAt(0.08));
    ws.wetCuke = own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }));
    ws.wetLeaf = own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide }));
    ws.cuke = MB.cucumber(ws.wetCuke); ws.cuke.position.set(0.05, 0.1, 0.22); ws.cuke.rotation.y = 0.25; ws.basket.add(ws.cuke);
    ws.leaves = MB.lettuceBunch(ws.wetLeaf); ws.leaves.position.set(-0.05, 0.14, -0.22); ws.leaves.rotation.y = -0.3; ws.basket.add(ws.leaves);
    ws.board = add(K, MD.board(), BM.board.clone()); ws.board.scale.setScalar(0.8);
    ws.bread = add(K, MB.baguette(), V(BM.board.x, BT, BM.board.z - 0.33));
    ws.tray = add(K, MD.group('eggTray'), BM.tray.clone()); ws.tray.add(MD.plate(0.42));
    ws.egg = MD.egg(); ws.egg.position.y = 0.03; ws.tray.add(ws.egg);
    ws.bottle = add(K, MD.bottle('#3B1D10', '#E53935', '#FFE7A8'), BM.bottle.clone());
    return ws;
  },
  steps: [
    { type: 'rub', target: ws => ws.basket, effect: 'water', amount: 1.1, voice: 'Xoa xoa để rửa sạch dưa leo và rau xà lách nào!',
      setup(ws, K) { sinkView(K); K.water(true); },
      onProgress(ws, p) { ws.wetCuke.roughness = 0.55 - 0.37 * p; ws.wetLeaf.roughness = 0.62 - 0.4 * p; },
      async done(ws, K) {
        K.water(false); Sound.fx.splash(); fx(K, ws.basket, '#BFE6FF', 10);
        vw(K, ws, [-2.7, 0.5, 0.1, 4.6, 3.2], [-2.3, 0.5, 0.3, 3.6, 3.8]);
        toWs(K, ws.cuke);
        await Promise.all([
          arc(ws.cuke, V(BM.board.x, BT, BM.board.z + 0.38), 0.8, 1.3), turn(ws.cuke, { y: 0 }, 0.8), scaleTo(ws.cuke, 1, 0.8),
          arc(ws.basket, BM.basket.clone(), 0.8, 1.0),
        ]);
        fx(K, ws.cuke, '#FFFFFF', 6);
      } },

    { type: 'adult', who: 'ba', action: 'cut', voice: 'Dao sắc lắm! Bé nhờ ba cắt dưa leo và xẻ bánh mì nhé!', safety: 'Dao sắc lắm, bé đứng xem ba cắt nhé!',
      setup(ws, K) { vw(K, ws, [BM.board.x, 0.35, BM.board.z, 3.4, 2.5], [BM.board.x, 0.35, BM.board.z, 3.0, 2.6]); },
      async run(ws, K) {
        const c = ws.cuke.position.clone();
        await chop(K, V(c.x, 0.3, c.z), 4, 1.0);
        ws.slices = add(K, MB.cucumberSlices(5), V(c.x, BT, c.z)); ws.cuke.visible = false; Sound.fx.pop();
        await popIn(ws.slices, 0.35); fx(K, ws.slices, '#CFEAA6', 8);
        const b = ws.bread.position;
        await chop(K, V(b.x, 0.52, b.z), 3, 1.3);
        Sound.fx.whoosh(); await tweenNum(0, 1.2, 0.5, v => ws.bread.userData.setOpen(v), Ease.outBack);
        fx(K, wpos(ws.bread, 0, 0.4, 0), '#FFE2A8', 10);
      } },

    { type: 'tap', count: 3, target: ws => ws.tray, voice: 'Bếp chưa bật đâu. Bé gõ trứng ba lần để đập vào chảo nhé!',
      async setup(ws, K) {
        K.stove.show(BM.stove); ws.stand = add(K, MB.potStand(0.24), V(BM.stove.x, 0.4, BM.stove.z)); pop(ws.stand, 0.3); await wait(0.3);
        ws.pan = add(K, MD.pan(), V(BM.stove.x, 0.64, BM.stove.z)); ws.pan.rotation.y = 0.5; await popIn(ws.pan);
        vw(K, ws, [0.9, 0.5, 1.0, 4.4, 3.0], [1.1, 0.55, 0.1, 3.6, 3.8]);
      },
      async onTap(ws, n, count, K) {
        const rim = ws.tray.worldToLocal(V(BM.stove.x - 0.8, 0.96, BM.stove.z + 0.85));
        if (n === 1) await arc(ws.egg, rim, 0.45, 0.6);
        await Tweens.to(ws.egg.position, { y: rim.y - 0.2 }, 0.08); Sound.fx.crack(); fx(K, wpos(ws.egg, 0, 0.3, 0), '#FFFFFF', 3);
        await Tweens.to(ws.egg.position, { y: rim.y }, 0.12);
        if (n === 3) {
          const sp = wpos(ws.egg, 0, 0.4, 0); ws.egg.visible = false; Sound.fx.pop();
          ws.fried = MB.friedEgg(); ws.fried.position.set(0, 0.9, 0); ws.pan.add(ws.fried);
          [-1, 1].forEach(s => { const sh = add(K, MD.shellHalf(), sp.clone()); arc(sh, V(BM.tray.x + s * 0.3, 0.05, BM.tray.z + 0.35), 0.5, 0.6).then(() => popOut(sh)); });
          await Tweens.to(ws.fried.position, { y: 0.085 }, 0.35, { ease: Ease.outBounce });
          fx(K, ws.fried, '#FFD34D', 8);
        }
      },
      async done(ws) { await popOut(ws.tray); } },

    { type: 'adult', who: 'ba', action: 'stove', voice: 'Bếp nóng lắm! Bé đứng xa, nhờ ba ốp la trứng nhé!', safety: 'Bếp nóng! Bé đứng xa bếp nhé!',
      setup(ws, K) { vw(K, ws, [0.9, 0.5, 0.75, 4.4, 3.0], [0.95, 0.55, -0.1, 3.4, 3.8]); },
      async run(ws, K) {
        K.stove.fire(1); Sound.fx.click(); await wait(0.5);
        const st = K.steam(ws.fried, { rate: 3, size: 0.6, y: 0.15, spread: 0.7 });
        await Promise.all([tweenNum(0, 1, 3.2, v => { ws.fried.userData.setCook(v); st.rate = 3 + 5 * v; }), sounds(ws, 3.2)]);
        fx(K, ws.fried, '#FFD34D', 10);
        K.stove.fire(0); Sound.fx.click();
        // ba xúc trứng ra đĩa nhỏ cho bé
        ws.eggPlate = add(K, MD.plate(0.45), BM.eggPlate0.clone()); await pop(ws.eggPlate, 0.3);
        const e = wpos(ws.fried);
        const sp = add(K, MB.spatula(), V(e.x + 1.4, e.y + 0.45, e.z)); await popIn(sp, 0.25);
        await moveTo(sp, V(e.x, e.y + 0.01, e.z), 0.35);
        toWs(K, ws.fried); st.stop();
        const to = V(BM.eggPlate0.x, 0.06, BM.eggPlate0.z);
        await Promise.all([arc(ws.fried, to, 0.6, 0.8), arc(sp, V(to.x, to.y - 0.005, to.z), 0.6, 0.8)]);
        Sound.fx.pop(); await moveTo(sp, V(to.x + 1.0, to.y + 0.3, to.z), 0.25); popOut(sp);
        K.steam(ws.fried, { rate: 3, size: 0.5, y: 0.1, spread: 0.5 });
      } },

    { type: 'drag', order: true, liftY: 0.95, voice: 'Kẹp rau xà lách, rồi dưa leo, rồi trứng vào bánh mì nhé!',
      items: ws => [{ obj: ws.leaves, name: 'rau xà lách' }, { obj: ws.slices, name: 'dưa leo' }, { obj: ws.fried, name: 'trứng' }],
      target: ws => ({ pos: wpos(ws.bread, 0, 0.3, 0), r: 1.3 }),
      async setup(ws, K) {
        K.stove.hide(); K.stopSteam(); popOut(ws.stand); await popOut(ws.pan);
        ws.plate = add(K, MD.plate(0.9), BM.plate.clone()); pop(ws.plate);
        toWs(K, ws.leaves);
        await Promise.all([
          arc(ws.bread, V(BM.plate.x, 0.068, BM.plate.z), 0.6, 0.9),
          arc(ws.leaves, V(BM.board.x, BT + 0.02, BM.board.z - 0.3), 0.7, 1.0), turn(ws.leaves, { y: 0 }, 0.7), scaleTo(ws.leaves, 1, 0.7),
          moveTo(ws.eggPlate, BM.eggPlate, 0.6), moveTo(ws.fried, V(BM.eggPlate.x, 0.06, BM.eggPlate.z), 0.6),
        ]);
        into(ws.plate, ws.bread);
        K.steam(ws.fried, { rate: 2, size: 0.5, y: 0.1, spread: 0.5 });
        vw(K, ws, [-0.1, 0.35, 0.7, 6.3, 3.0], [0.15, 0.3, 0.3, 4.0, 4.2]);
      },
      async place(ws, it, n, K) {
        const f = ws.bread.userData.fill; into(f, it.obj);
        const S = MB.FILL[n - 1];
        await Promise.all([moveTo(it.obj, V(S.p[0], S.p[1], S.p[2]), 0.3), turn(it.obj, { x: 0, y: 0, z: 0 }, 0.3), scaleTo(it.obj, { x: S.s[0], y: S.s[1], z: S.s[2] }, 0.3)]);
        Sound.fx.pop(); fx(K, ws.bread, n === 3 ? '#FFD34D' : '#9BE07A', 8);
      },
      async done(ws, K) {
        K.stopSteam(); Sound.fx.whoosh();
        await tweenNum(1.2, MB.BREAD_OPEN, 0.45, v => ws.bread.userData.setOpen(v), Ease.outBack);
        fx(K, ws.bread, '#FFD34D', 12); Sound.fx.yum();
      } },

    { type: 'tap', count: 2, target: ws => ws.bottle, voice: 'Chạm vào chai xì dầu, rưới hai giọt thôi nhé!',
      async setup(ws, K) {
        popOut(ws.eggPlate);
        await arc(ws.bottle, BM.bottleNear.clone(), 0.5, 0.8);
        vw(K, ws, [1.05, 0.7, 0.15, 3.9, 3.0], [0.55, 0.7, -0.75, 3.4, 3.4]);
      },
      async onTap(ws, n, count, K) {
        const tgt = wpos(ws.fried, n === 1 ? -0.14 : 0.2, 0.1, n === 1 ? 0.08 : -0.06);
        if (n === 1) { await arc(ws.bottle, V(tgt.x + 1.15, tgt.y + 1.05, tgt.z - 0.15), 0.45, 0.5); await turn(ws.bottle, { z: 2.1 }, 0.25); }
        const d = add(K, MD.mesh(new THREE.SphereGeometry(0.06, 10, 8), glossy('#4A2412', 0.1)), wpos(ws.bottle, 0, 1.3, 0));
        await Tweens.to(d.position, { x: tgt.x, y: tgt.y, z: tgt.z }, 0.35, { ease: Ease.inQuad });
        trash(d); Sound.fx.bubble();
        const spot = MB.soySpot(); ws.fried.add(spot); spot.position.copy(ws.fried.worldToLocal(tgt.clone())).setY(0.075); popIn(spot, 0.25);
        fx(K, tgt, '#C98A4A', 5);
      },
      async done(ws, K) {
        await turn(ws.bottle, { z: 0 }, 0.2); await arc(ws.bottle, BM.bottleNear.clone(), 0.45, 0.6);
        fx(K, ws.plate, '#FFD34D', 10);
      } },
  ],
  reveal: ws => ws.plate,
  final: () => banhmiPlate(),
};

/* ═════════ 5. GỎI CUỐN ═════════ */
const GC_L = { board: V(0, 0, 0.75), basket: V(-2.6, 0, 1.05), basketBack: V(-2.1, 0, -1.4), bin: V(2.75, 0, 0.75), stove: V(3.3, 0, -0.45), water: V(-2.45, 0, 0.7), bunPlate: V(-2.1, 0, 1.6), leaf: V(-2.3, 0.14, 0.3), meatPlate: V(2.2, 0, 1.75), meatPlate2: V(2.15, 0, 1.3), serve: V(1.95, 0, 0.45), sauce: V(-1.75, 0, 1.3), rollServe: V(-0.2, 0.005, 0.85) };
const GC_P = { board: V(0, 0, 0.2), basket: V(-1.5, 0, 1.85), basketBack: V(-2.1, 0, -1.6), bin: V(1.45, 0, 1.85), stove: V(0.4, 0, -2.05), water: V(0, 0, -1.8), bunPlate: V(-0.85, 0, 1.9), leaf: V(-0.55, 0.14, -1.25), meatPlate: V(2.1, 0, 1.55), meatPlate2: V(0.95, 0, 1.85), serve: V(0, 0, -1.3), sauce: V(1.05, 0, 1.55), rollServe: V(-0.7, 0.005, 1.3) };
let GC = GC_L;
const BD = 0.14; // mặt thớt
function sortSpots() {
  const out = [];
  [-0.93, -0.31, 0.31, 0.93].forEach((x, i) => [0.36, -0.42].forEach((z, j) => out.push({ p: V(GC.board.x + x + (j ? 0.06 : -0.06), BD + 0.01, GC.board.z + z), ry: Math.PI / 2 + (i + j) % 2 * 0.3 - 0.15 })));
  return out;
}
const goicuon = {
  build(K) {
    const ws = anchor(K); GC = ws.P ? GC_P : GC_L;
    ws.board = add(K, MD.board(), GC.board.clone());
    ws.basket = add(K, MB.basket(0.8), sinkAt(0.08));
    ws.leafMat = own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide }));
    ws.leaves = ['g', 'b', 'h', 'g', 'g', 'h', 'b', 'g'].map((k, i) => {
      const l = k === 'h' ? MB.herbSprig(ws.leafMat) : MB.lettuceLeaf(ws.leafMat, k === 'b', 0.82);
      l.userData.good = k !== 'b'; l.userData.kind = k;
      const a = i * 0.8, r = 0.15 + (i % 3) * 0.14; l.position.set(Math.cos(a) * r, 0.1 + i * 0.035, Math.sin(a) * r); l.rotation.y = a + 1.2; ws.basket.add(l);
      return l;
    });
    return ws;
  },
  steps: [
    { type: 'rub', target: ws => ws.basket, effect: 'water', amount: 1.1, voice: 'Xoa xoa để rửa rau sống thật sạch nào!',
      setup(ws, K) { sinkView(K); K.water(true); },
      onProgress(ws, p) { ws.leafMat.roughness = 0.62 - 0.42 * p; },
      async done(ws, K) {
        K.water(false); Sound.fx.splash(); fx(K, ws.basket, '#BFE6FF', 10);
        vw(K, ws, [-0.7, 0.4, 0.5, 6.4, 3.2], [-0.5, 0.4, 0.6, 4.4, 4.2]);
        ws.bin = add(K, MB.trashBin(), GC.bin.clone()); popIn(ws.bin, 0.4);
        const spots = sortSpots();
        ws.leaves.forEach(l => toWs(K, l));
        await Promise.all(ws.leaves.map((l, i) => wait(i * 0.07).then(() => Promise.all([arc(l, spots[i].p, 0.65, 1.2), turn(l, { y: spots[i].ry }, 0.65), scaleTo(l, 1, 0.65)]))));
        await arc(ws.basket, GC.basket.clone(), 0.6, 0.9);
      } },

    { type: 'sort', liftY: 0.75, voice: 'Lá xanh bỏ vào rổ, lá vàng úa bỏ vào thùng rác nhé!',
      goodSay: 'Lá xanh còn tươi ngon, để vào rổ nhé!', badSay: 'Lá vàng úa rồi, bỏ vào thùng rác nhé!',
      items: ws => ws.leaves.map(l => ({ obj: l, good: l.userData.good })),
      good: () => ({ pos: V(GC.basket.x, 0.35, GC.basket.z), r: 1.2 }),
      bad: () => ({ pos: V(GC.bin.x, 0.95, GC.bin.z), r: 0.95 }),
      setup(ws, K) { vw(K, ws, [0, 0.35, 0.8, 6.6, 3.0], [0, 0.3, 0.75, 4.4, 3.9]); },
      async place(ws, it, z, K) {
        const l = it.obj;
        if (it.good) {
          const k = (ws.inBasket = (ws.inBasket || 0) + 1), a = k * 1.15;
          into(ws.basket, l);
          await Promise.all([moveTo(l, V(Math.cos(a) * 0.32, 0.12 + k * 0.035, Math.sin(a) * 0.28), 0.3), scaleTo(l, 1, 0.3), turn(l, { y: a + 1.4 }, 0.3)]);
          fx(K, l, '#9BE07A', 6);
        } else {
          await moveTo(l, V(GC.bin.x, 1.3, GC.bin.z), 0.18);
          await Promise.all([moveTo(l, V(GC.bin.x, 0.6, GC.bin.z), 0.3), scaleTo(l, 0.3, 0.3)]);
          l.visible = false; Sound.fx.poof(); squash(ws.bin, 0.9, 0.08);
        }
      } },

    { type: 'adult', who: 'me', action: 'stove', voice: 'Nước sôi nóng lắm! Bé đứng xa, nhờ mẹ luộc tôm và thịt nhé!', safety: 'Nước sôi nóng lắm! Bé đứng xa bếp nhé!',
      async setup(ws, K) {
        popOut(ws.bin); arc(ws.basket, GC.basketBack.clone(), 0.5, 0.6);
        const b = GC.board;
        ws.shrimpRaw = [0, 1, 2].map(i => add(K, MB.shrimp({ raw: true }), V(b.x + 0.1 + i * 0.36, BD, b.z + 0.35 - (i % 2) * 0.12)));
        ws.porkRaw = add(K, MB.porkBlock(), V(b.x + 0.5, BD, b.z - 0.35));
        await Promise.all([...ws.shrimpRaw, ws.porkRaw].map((o, i) => wait(i * 0.06).then(() => popIn(o, 0.3))));
        vw(K, ws, [1.75, 0.6, 0.45, 5.2, 3.2], [0.35, 0.6, -0.75, 3.6, 4.2]);
      },
      async run(ws, K) {
        K.stove.show(GC.stove); await wait(0.3);
        ws.pot = add(K, MD.pot({ r: 0.95, h: 0.85 }), V(GC.stove.x, 0.4, GC.stove.z));
        ws.potWater = MD.fill(ws.pot, liquid('#CFE8F5', 0.55), 0.62);
        ws.bub = MB.bubbleField(22, 0.7); ws.bub.userData.y = ws.potWater.position.y + 0.01; ws.pot.add(ws.bub);
        await popIn(ws.pot);
        K.stove.fire(1); Sound.fx.click();
        const offB = loop(K, ws, dt => ws.bub.userData.tick(dt));
        await tweenNum(0, 1, 0.9, v => { ws.bub.userData.on = v; });
        const st = K.steam(ws.pot, { rate: 5, size: 0.9, y: 0.9, spread: 0.7 });
        const items = [ws.porkRaw, ...ws.shrimpRaw], homes = items.map(o => o.position.clone());
        await Promise.all(items.map((o, i) => wait(i * 0.15).then(() => arc(o, wpos(ws.pot, [-0.25, 0.25, -0.1, 0.3][i], 0.3, [0.15, -0.2, -0.3, 0.2][i]), 0.4, 0.9))
          .then(() => { Sound.fx.splash(); drops(K, wpos(ws.pot, 0, 0.6, 0), '#BFE6FF', 5); into(ws.pot, o); })));
        K.say('Tôm chín chuyển sang màu hồng!');
        await Promise.all([tweenNum(0, 1, 2.0, v => items.forEach(o => o.userData.cook(v))), sounds(ws, 2.0, 'boil', 0.4)]);
        items.forEach(o => toWs(K, o));
        await Promise.all(items.map((o, i) => wait(i * 0.12).then(() => arc(o, homes[i], 0.35, 0.9)).then(() => Sound.fx.pop())));
        fx(K, V(GC.board.x + 0.6, 0.4, GC.board.z), '#FF9E80', 10);
        K.stove.fire(0); Sound.fx.click(); st.rate = 2;
        tweenNum(1, 0, 0.8, v => { ws.bub.userData.on = v; }).then(offB);
        // mẹ thái thịt, bổ đôi tôm
        await chop(K, V(GC.board.x + 0.5, 0.45, GC.board.z), 4, 0.8);
        items.forEach(o => { o.visible = false; });
        ws.meatPlate = add(K, MD.plate(0.62), GC.meatPlate.clone()); pop(ws.meatPlate, 0.3);
        ws.porkItem = add(K, MB.porkSlices(4, 0.13), V(GC.board.x + 0.5, BD, GC.board.z - 0.3));
        ws.shrimpItem = add(K, MD.group('tôm', MB.hitPad(0.45, 0.05)), V(GC.board.x + 0.5, BD, GC.board.z + 0.35));
        [-0.3, 0, 0.3].forEach((z, i) => { const s = MB.shrimp({ flat: 0.5 }); s.position.set(i * 0.05, 0, z); s.rotation.y = 0.4; ws.shrimpItem.add(s); });
        Sound.fx.pop(); await Promise.all([popIn(ws.porkItem, 0.3), popIn(ws.shrimpItem, 0.3)]);
        const m = GC.meatPlate;
        await Promise.all([arc(ws.porkItem, V(m.x - 0.28, 0.06, m.z), 0.5, 0.6), arc(ws.shrimpItem, V(m.x + 0.3, 0.06, m.z), 0.5, 0.6)]);
        K.stove.hide(); st.stop(); popOut(ws.pot);
      } },

    { type: 'drag', liftY: 0.8, voice: 'Kéo bánh tráng nhúng qua bát nước cho mềm nhé!',
      items: ws => [{ obj: ws.roll, name: 'bánh tráng' }],
      target: () => ({ pos: V(GC.water.x, 0.45, GC.water.z), r: 1.2 }),
      async setup(ws, K) {
        ws.waterBowl = add(K, MB.waterBowl(), GC.water.clone()); pop(ws.waterBowl);
        ws.roll = add(K, MB.riceRoll({ dynamic: true }), V(GC.board.x + 0.2, BD + 0.005, GC.board.z)); ws.paperMat = ws.roll.userData.material;
        await popIn(ws.roll, 0.35);
        vw(K, ws, [-1.15, 0.35, 0.7, 4.8, 3.0], [0, 0.4, -0.75, 3.2, 4.0]);
      },
      async place(ws, it, n, K) {
        const r = ws.roll, w = GC.water;
        await moveTo(r, V(w.x + 0.2, 1.3, w.z), 0.2);
        await Promise.all([turn(r, { x: 1.1 }, 0.3), moveTo(r, V(w.x, 1.05, w.z - 0.25), 0.3)]);
        Sound.fx.splash(); drops(K, V(w.x, 0.6, w.z), '#9FD8FF', 10);
        const soft = tweenNum(0, 1, 1.1, v => MB.setWet(ws.paperMat, v));
        await Tweens.to(r.rotation, { y: Math.PI * 2 }, 0.9, { ease: Ease.inOutSine });
        Sound.fx.splash();
        await Promise.all([turn(r, { x: 0 }, 0.3), moveTo(r, V(w.x + 0.2, 1.2, w.z), 0.3)]);
        r.rotation.y = 0;
        await arc(r, V(GC.board.x, BD + 0.005, GC.board.z), 0.55, 0.6); await soft;
        drops(K, r, '#BFE6FF', 8); fx(K, r, '#FFFFFF', 8);
        K.say('Bánh tráng mềm rồi!');
      } },

    { type: 'drag', order: true, liftY: 0.7, voice: 'Xếp rau, rồi bún, rồi thịt, rồi tôm lên bánh tráng nhé!',
      items: ws => [{ obj: ws.leafItem, name: 'rau' }, { obj: ws.bunItem, name: 'bún' }, { obj: ws.porkItem, name: 'thịt' }, { obj: ws.shrimpItem, name: 'tôm' }],
      target: () => ({ pos: V(GC.board.x, 0.3, GC.board.z), r: 1.05 }),
      async setup(ws, K) {
        popOut(ws.waterBowl);
        ws.bunPlate = add(K, MD.plate(0.55), GC.bunPlate.clone()); pop(ws.bunPlate, 0.3);
        ws.bunItem = add(K, MB.bun(0.75, 26, 0.13), V(GC.bunPlate.x, 0.07, GC.bunPlate.z)); popIn(ws.bunItem, 0.3);
        const leaf = ws.leaves.find(l => l.userData.kind === 'g' && l.parent === ws.basket) || MB.lettuceLeaf(ws.leafMat, false, 0.82);
        ws.leafItem = toWs(K, leaf);
        const m = GC.meatPlate2;
        await Promise.all([
          arc(leaf, GC.leaf.clone(), 0.6, 1.0), scaleTo(leaf, 1, 0.6), turn(leaf, { x: 0, y: 0.25, z: 0 }, 0.6),
          moveTo(ws.meatPlate, m, 0.5), moveTo(ws.porkItem, V(m.x - 0.28, 0.06, m.z), 0.5), moveTo(ws.shrimpItem, V(m.x + 0.3, 0.06, m.z), 0.5),
        ]);
        vw(K, ws, [0, 0.35, 0.85, 5.4, 3.0], [0.1, 0.3, 0.45, 3.8, 4.4]);
      },
      async place(ws, it, n, K) {
        const key = ['lettuce', 'bun', 'pork', 'shrimp'][n - 1], sp = ws.roll.userData.spot[key];
        const to = wpos(ws.roll.userData.inner, sp[0], sp[1] + 0.05, sp[2]);
        await Promise.all([moveTo(it.obj, to, 0.3), scaleTo(it.obj, 0.85, 0.3)]);
        it.obj.visible = false;
        await popIn(ws.roll.userData.parts[key], 0.25);
        fx(K, to, ['#9BE07A', '#FFFFFF', '#FFB199', '#FF8A65'][n - 1], 8);
      } },

    { type: 'roll', stages: 3, target: ws => ws.roll, voice: 'Vuốt lên để cuộn bánh tráng thật chặt tay nào!',
      setup(ws, K) { popOut(ws.bunPlate); popOut(ws.meatPlate); K.view(V(GC.board.x, 0.3, GC.board.z - 0.1), 3.0, 2.5); },
      onStage(ws, stage, K) {
        const L = [0, 0.72, 1.22, 2 * ws.roll.userData.R];
        ws.rollP = (ws.rollP || Promise.resolve())
          .then(() => tweenNum(L[stage - 1], L[stage], 0.55, v => ws.roll.userData.setRoll(v), Ease.inOutSine))
          .then(() => fx(K, wpos(ws.roll.userData.inner, 0, 0.25, ws.roll.userData.R - L[stage]), '#FFFFFF', 6));
        return ws.rollP;
      },
      async done(ws, K) {
        const r = ws.roll; r.position.z += r.userData.recenter();
        await moveTo(r, V(GC.board.x, BD + 0.005, GC.board.z), 0.4);
        await squash(r, 0.85, 0.1); Sound.fx.yum(); fx(K, r, '#FFD34D', 12);
      } },

    { type: 'drag', liftY: 0.75, voice: 'Bày gỏi cuốn lên đĩa, thêm chén nước chấm nữa nhé!',
      items: ws => [{ obj: ws.roll, name: 'gỏi cuốn' }, { obj: ws.sauce, name: 'chén nước chấm' }],
      target: () => ({ pos: V(GC.serve.x, 0.3, GC.serve.z), r: 1.45 }),
      async setup(ws, K) {
        popOut(ws.board); await moveTo(ws.roll, GC.rollServe.clone(), 0.3);
        ws.serve = add(K, MD.plate(1.15), GC.serve.clone());
        const mt = MB.paperMat(), sh = {}; MB.setWet(mt, 1);
        [0, 1].forEach(i => { const [x, z, ry] = MB.ROLL_SLOTS[i], r = MB.riceRoll({ rolled: true, shared: sh, material: mt }); r.position.set(x, 0.075, z); r.rotation.y = ry; ws.serve.add(r); });
        pop(ws.serve, 0.4);
        ws.sauce = add(K, MB.sauceBowl(), GC.sauce.clone()); await pop(ws.sauce);
        K.say('Mẹ cuốn thêm hai cuốn nữa rồi!');
        vw(K, ws, [0.1, 0.3, 0.75, 5.4, 3.0], [0.1, 0.3, 0.05, 3.4, 4.4]);
      },
      async place(ws, it, n, K) {
        const o = into(ws.serve, it.obj);
        if (o === ws.roll) { const [x, z, ry] = MB.ROLL_SLOTS[2]; await Promise.all([moveTo(o, V(x, 0.075, z), 0.35), turn(o, { y: ry }, 0.35), scaleTo(o, 1, 0.35)]); }
        else await Promise.all([moveTo(o, V(MB.SAUCE_SLOT[0], 0.075, MB.SAUCE_SLOT[1]), 0.35), scaleTo(o, 0.46, 0.35)]);
        fx(K, o, '#FFD34D', 8);
      },
      async done(ws, K) { Sound.fx.yum(); fx(K, ws.serve, '#FFFFFF', 12); } },
  ],
  reveal: ws => ws.serve,
  final: () => MB.goiCuonPlate(),
};

/* ═════════ 6. CANH BÍ ĐỎ ═════════ */
const CB_L = { board: V(-1.8, 0, 0.8), pot: V(1.35, 0, 0.3), jug: V(3.5, 0, 0.9), bowl: V(-1.1, 0, 1.05) };
const CB_P = { board: V(-0.5, 0, 1.4), pot: V(0.4, 0, -1.0), jug: V(2.0, 0, 0.5), bowl: V(-0.9, 0, 1.25) };
let CB = CB_L;
const CBT = 0.119; // mặt thớt (thớt 0.85)
const WATER = new THREE.Color('#D6EEFA'), SOUP = new THREE.Color(MB.SOUP_COLOR), CUBE = new THREE.Color('#FF8E1C'), CUBE_COOKED = new THREE.Color('#F4700C');
const SOUP_GARNISH = [
  { key: 'hanh', name: 'Hành lá', make: () => MB.onionRings() },
  { key: 'ngo', name: 'Rau ngò', make: () => MD.garnish('ngo') },
  { key: 'tieu', name: 'Hạt tiêu', make: () => MD.garnish('tieu') },
];
const LINE = 0.55; // vạch hồng trong nồi
const canhbi = {
  build(K) {
    const ws = anchor(K); CB = ws.P ? CB_P : CB_L;
    ws.skinMat = own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }));
    ws.pumpkin = add(K, MB.pumpkin(ws.skinMat), sinkAt(0.07));
    ws.board = add(K, MD.board(), CB.board.clone()); ws.board.scale.setScalar(0.85);
    ws.pot = add(K, MD.pot({ r: 1, h: 1.05 }), CB.pot.clone());
    ws.waterMat = liquid('#D6EEFA', 0.5); ws.water = MD.fill(ws.pot, ws.waterMat, 0);
    const ly = 0.03 + 0.98 * LINE;
    ws.line = MD.mesh(new THREE.TorusGeometry(MD.radiusAt(ws.pot.userData.profile, ly) - 0.01, 0.025, 6, 48), own(new THREE.MeshBasicMaterial({ color: '#FF5C9A' })));
    ws.line.rotation.x = Math.PI / 2; ws.line.position.y = ly; ws.line.visible = false; ws.pot.add(ws.line);
    ws.jug = add(K, MD.jug(), CB.jug.clone()); ws.jugWater = MD.liquidBody(ws.jug, '#CDEBFF', 0.55); ws.jugWater.userData.setLevel(0.8);
    ws.stream = pourStream(K);
    ws.cubeMat = own(new THREE.MeshStandardMaterial({ color: CUBE.clone(), roughness: 0.45 }));
    return ws;
  },
  steps: [
    { type: 'rub', target: ws => ws.pumpkin, effect: 'water', voice: 'Xoa xoa để rửa sạch quả bí đỏ nào!',
      setup(ws, K) { sinkView(K); K.water(true); },
      onProgress(ws, p) { ws.skinMat.roughness = 0.6 - 0.42 * p; },
      async done(ws, K) {
        K.water(false); Sound.fx.splash(); fx(K, ws.pumpkin, '#BFE6FF', 10);
        vw(K, ws, [-2.8, 0.5, 0.2, 4.6, 3.2], [-2.2, 0.5, 0.5, 4.2, 3.8]);
        await arc(ws.pumpkin, V(CB.board.x, CBT, CB.board.z), 0.8, 1.4);
      } },

    { type: 'adult', who: 'ba', action: 'cut', voice: 'Dao sắc lắm! Bé nhờ ba gọt vỏ, cắt bí thành miếng nhé!', safety: 'Dao sắc lắm, bé đứng xem ba cắt nhé!',
      setup(ws, K) { vw(K, ws, [CB.board.x, 0.45, CB.board.z, 3.2, 2.6], [CB.board.x, 0.45, CB.board.z, 3.0, 2.8]); },
      async run(ws, K) {
        const p = ws.pumpkin, c = p.position.clone();
        // gọt vỏ: vỏ bay ra, bí lộ màu cam tươi
        const knife = add(K, MD.knife(), V(c.x + 0.55, 0.85, c.z + 0.55)); knife.rotation.set(0, 0.7, -0.5); await popIn(knife, 0.2);
        ws.peels = [];
        for (let i = 0; i < 4; i++) {
          Tweens.add(p.rotation, { y: p.rotation.y + 1.2 }, 0.3);
          await Tweens.to(knife.position, { y: 0.55 }, 0.14); Sound.fx.snip();
          const pl = add(K, MB.peelStrip(), V(c.x + 0.5, 0.6, c.z + 0.3)); ws.peels.push(pl);
          arc(pl, V(c.x + 0.8 + (i % 2) * 0.16, CBT + 0.02, c.z - 0.5 + i * 0.1), 0.45, 0.5);
          await Tweens.to(knife.position, { y: 0.85 }, 0.14);
        }
        p.userData.body.material = mat('#FF8E1C', 0.4); fx(K, wpos(p, 0, 0.5, 0), '#FFB347', 10); Sound.fx.pop();
        await popOut(knife, 0.2); trash(knife);
        // thái khối vuông
        await chop(K, V(c.x, 0.62, c.z), 4, 0.8);
        p.visible = false; Sound.fx.pop();
        ws.piles = [[-0.5, 0.18], [0.02, -0.25], [0.45, 0.25]].map(([x, z]) => add(K, MB.cubePile(ws.cubeMat, 6, 0.2), V(c.x + x, CBT, c.z + z)));
        await Promise.all(ws.piles.map((q, i) => wait(i * 0.08).then(() => popIn(q, 0.35))));
        fx(K, c, '#FFB347', 10);
      } },

    { type: 'pour', line: LINE, from: 0, rate: 0.22, tilt: -1.25, voice: 'Giữ tay để rót nước vào nồi tới vạch hồng. Thả tay ra là dừng!',
      pourer: ws => ws.jug, vessel: ws => ws.pot,
      async setup(ws, K) {
        vw(K, ws, [CB.pot.x + 0.5, 0.8, CB.pot.z, 4.6, 3.4], [CB.pot.x + 0.6, 0.8, CB.pot.z, 3.8, 3.4]);
        ws.jug.rotation.y = Math.PI; await moveTo(ws.jug, V(CB.pot.x + 1.55, 1.15, CB.pot.z), 0.5);
        ws.line.visible = true; await popIn(ws.line, 0.3);
      },
      stream(ws, on) { ws.streaming = on; if (!on) ws.stream.set(false); },
      onLevel(ws, level) {
        ws.water.userData.setLevel(level); ws.jugWater.userData.setLevel(0.8 - level * 1.1);
        if (ws.streaming) ws.stream.set(true, wpos(ws.jug, 0.5, 1.12, 0), wpos(ws.pot, 0.55, 0.03 + level * 0.98, 0));
      },
      async done(ws) { ws.stream.set(false); await moveTo(ws.jug, CB.jug.clone(), 0.4); ws.jug.rotation.y = 0; popOut(ws.line); } },

    { type: 'drag', liftY: 1.3, voice: 'Bếp chưa bật đâu. Bé kéo bí đỏ thả vào nồi nước lạnh nhé!',
      items: ws => ws.piles.map(o => ({ obj: o, name: 'bí đỏ' })),
      target: () => ({ pos: V(CB.pot.x, 0.8, CB.pot.z), r: 1.2 }),
      setup(ws, K) { vw(K, ws, [-0.2, 0.55, 0.6, 5.6, 3.2], [0, 0.55, 0.2, 3.4, 4.3]); },
      async place(ws, it, n, K) {
        const o = it.obj, off = [[-0.35, 0.15], [0.3, 0.25], [0.0, -0.32]][n - 1];
        await moveTo(o, V(CB.pot.x + off[0], 1.35, CB.pot.z + off[1]), 0.15);
        await moveTo(o, V(CB.pot.x + off[0], 0.3, CB.pot.z + off[1]), 0.3);
        Sound.fx.splash(); drops(K, wpos(ws.pot, 0, 0.7, 0), '#BFE6FF', 8);
        into(ws.pot, o);
      },
      async done(ws) { popOut(ws.board); ws.peels.forEach(p => popOut(p)); } },

    { type: 'adult', who: 'ba', action: 'stove', voice: 'Bếp nóng lắm! Bé đứng xa, nhờ ba nấu canh nhé!', safety: 'Bếp nóng! Bé đứng xa bếp nhé!',
      setup(ws, K) { vw(K, ws, [CB.pot.x - 0.3, 0.8, CB.pot.z + 0.3, 4.2, 3.4], [CB.pot.x - 0.1, 0.8, CB.pot.z + 0.4, 3.6, 3.6]); },
      async run(ws, K) {
        const pot = ws.pot, S = V(CB.pot.x, 0, CB.pot.z - 0.2);
        await moveTo(pot, V(pot.position.x, 0.95, pot.position.z), 0.3);
        K.stove.show(S); await wait(0.35);
        await moveTo(pot, V(S.x, 0.4, S.z), 0.35); Sound.fx.click();
        K.stove.fire(1);
        ws.bub = MB.bubbleField(26, 0.75); ws.bub.userData.y = ws.water.position.y + 0.012; pot.add(ws.bub);
        ws.offB = loop(K, ws, dt => ws.bub.userData.tick(dt));
        ws.potSteam = K.steam(pot, { rate: 3, size: 1, y: 1.1, spread: 0.8 });
        const cook = tweenNum(0, 1, 3.0, v => {
          ws.bub.userData.on = Math.min(1, v * 2);
          ws.waterMat.color.lerpColors(WATER, SOUP, v); ws.waterMat.opacity = 0.5 + 0.4 * v;
          ws.cubeMat.color.lerpColors(CUBE, CUBE_COOKED, v); ws.cubeMat.roughness = 0.45 - 0.17 * v;
          ws.piles.forEach((q, i) => { q.position.y = 0.3 + 0.16 * v + Math.sin(v * 14 + i * 2) * 0.02; });
          ws.potSteam.rate = 3 + 6 * v;
        });
        await Promise.all([cook, sounds(ws, 3.0, 'boil', 0.5)]);
        // nêm muối, nếm thử
        const sp = add(K, MD.spoon(), V(S.x + 1.7, 1.7, S.z + 0.3)); await popIn(sp, 0.2);
        await arc(sp, wpos(pot, 0.1, 1.35, 0.1), 0.4, 0.3);
        await turn(sp, { z: 1.1 }, 0.2); Sound.fx.pour(); fx(K, wpos(pot, 0, 0.9, 0), '#FFFFFF', 12);
        await turn(sp, { z: 0 }, 0.2);
        await moveTo(sp, wpos(pot, 0.1, 0.62, 0.1), 0.25); Sound.fx.bubble();
        await moveTo(sp, wpos(pot, 0.4, 1.7, 0.6), 0.35); Sound.fx.yum(); K.say('Canh vừa ăn rồi!');
        await wait(0.4); await popOut(sp); trash(sp);
        K.stove.fire(0); Sound.fx.click();
        tweenNum(1, 0.25, 1.0, v => { ws.bub.userData.on = v; });
      } },

    { type: 'adult', who: 'ba', action: 'hot', voice: 'Canh nóng lắm! Bé nhờ ba múc canh ra bát nhé!', safety: 'Canh nóng lắm, để ba múc nhé!',
      async setup(ws, K) {
        ws.bowl = add(K, MD.bowl(1.12), CB.bowl.clone()); await pop(ws.bowl);
        ws.soupMat = own(new THREE.MeshStandardMaterial({ color: MB.SOUP_COLOR, roughness: 0.14 }));
        ws.soup = MD.fill(ws.bowl, ws.soupMat, 0);
        vw(K, ws, [0.05, 0.75, 0.65, 4.6, 3.2], [-0.3, 0.75, 0.1, 3.4, 4.2]);
      },
      async run(ws, K) {
        const pot = ws.pot, ld = add(K, MB.ladle(), wpos(pot, 0.5, 1.8, 0.3)); await popIn(ld, 0.25);
        const FULL = 0.8, prof = ws.bowl.userData.profile, yTop = prof[0][1] + (prof[prof.length - 1][1] - prof[0][1]) * FULL;
        ws.chunks = [];
        for (let k = 0; k < 3; k++) {
          await moveTo(ld, wpos(pot, 0.1, 0.62, 0.1), 0.3); Sound.fx.splash(); await wait(0.12);
          ld.userData.soup.visible = true; ws.piles[k].visible = false;
          ws.water.userData.setLevel(LINE - (k + 1) * 0.04); ws.bub.userData.y = ws.water.position.y + 0.012;
          await arc(ld, wpos(ws.bowl, 0.1, 0.95, 0), 0.6, 0.6);
          await turn(ld, { z: 0.95 }, 0.22); Sound.fx.pour(); ld.userData.soup.visible = false;
          const ch = MB.soupChunks(ws.cubeMat, [3, 3, 4][k], 0.25 + k * 0.17, yTop - 0.02); ch.rotation.y = k * 1.3; ws.bowl.add(ch); ws.chunks.push(ch);
          await tweenNum((k / 3) * FULL, ((k + 1) / 3) * FULL, 0.4, v => { ws.soup.userData.setLevel(v); ws.chunks.forEach(c => { c.position.y = ws.soup.position.y - yTop; }); });
          drops(K, wpos(ws.bowl, 0, 0.5, 0), '#FFC56A', 5);
          await turn(ld, { z: 0 }, 0.18);
        }
        await popOut(ld); trash(ld);
        K.steam(ws.soup, { rate: 5, size: 0.8, y: 0.25, spread: 0.6 });
        ws.bowl.add(MB.oilDots(7, 0.55, yTop + 0.004));
        fx(K, ws.bowl, '#FFD34D', 10); Sound.fx.yum();
      } },

    { type: 'decorate', min: 4, garnishes: SOUP_GARNISH, voice: 'Chọn hành, ngò rồi chạm lên bát canh để rắc nhé!',
      surface: ws => ws.soup,
      async setup(ws, K) {
        if (ws.potSteam) ws.potSteam.stop(); if (ws.offB) ws.offB();
        K.stove.hide(); popOut(ws.pot); popOut(ws.jug);
        K.view(V(CB.bowl.x, 0.45, CB.bowl.z), 2.6, 2.3, 1.05);
      } },
  ],
  reveal: ws => ws.bowl,
  final: () => MB.pumpkinSoupBowl(),
};

/* ═════════ 7. RAU MUỐNG XÀO TỎI ═════════ */
const RM_L = { board: V(-1.4, 0, 0.85), stove: V(1.75, 0, 0.0), basket: V(-1.9, 0, -1.2), plate0: V(-2.9, 0, 1.55), spot: V(-1.05, 0, 0.9) };
const RM_P = { board: V(-0.3, 0, 1.3), stove: V(0.7, 0, -1.55), basket: V(-2.2, 0, -1.2), plate0: V(1.75, 0, 1.5), spot: V(-0.55, 0, 0.85) };
let RM = RM_L;
const GARLIC = new THREE.Color('#FFF3D0'), GOLD = new THREE.Color('#E9A23B');
function peelClove(ws, i) {
  const K = ws.K, c = ws.garlic.userData.cloves[i]; if (!c || c.done) return; c.done = true;
  const s = c.skin; Sound.fx.snip(); fx(K, c.clove, '#FFFFFF', 5);
  Tweens.add(s.scale, { x: 1.35, y: 1.2, z: 1.35 }, 0.3); tweenNum(0.96, 0, 0.3, v => { s.material.opacity = v; }).then(() => { s.visible = false; });
  for (let k = 0; k < 3; k++) {
    const f = add(K, MB.skinFlake(), wpos(c.clove, 0, 0.2, 0)); ws.flakes.push(f);
    arc(f, V(RM.board.x + (Math.random() - 0.5) * 1.6, 0.15, RM.board.z + 0.35 + Math.random() * 0.3), 0.5, 0.4);
  }
}
const raumuong = {
  build(K) {
    const ws = anchor(K); RM = ws.P ? RM_P : RM_L;
    ws.board = add(K, MD.board(), RM.board.clone());
    ws.leafMat = own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: THREE.DoubleSide }));
    ws.bunch = add(K, MB.spinachBunch(ws.leafMat), V(RM.board.x, BD, RM.board.z));
    ws.basket = add(K, MB.basket(0.75), sinkAt(0.08));
    ws.flakes = [];
    return ws;
  },
  steps: [
    { type: 'slice', sound: 'snip', voice: 'Chạm vào vòng hồng để ngắt rau muống thành khúc nhé!',
      points: ws => ws.bunch.userData.cuts.map(x => wpos(ws.bunch, x, 0.13, 0)),
      setup(ws, K) { vw(K, ws, [RM.board.x, 0.3, RM.board.z, 3.3, 2.4], [RM.board.x, 0.3, RM.board.z, 3.1, 2.4]); },
      onCut(ws, i, n, K) {
        const cols = ws.bunch.userData.cols, a = cols[i], b = cols[i + 1];
        Tweens.add(a.rotation, { y: a.rotation.y - 0.07 }, 0.2, { ease: Ease.outBack }); Tweens.add(a.position, { x: a.position.x - 0.025 }, 0.2);
        Tweens.add(b.rotation, { y: b.rotation.y + 0.07 }, 0.2, { ease: Ease.outBack }); Tweens.add(b.position, { x: b.position.x + 0.025 }, 0.2);
        squash(a, 0.8, 0.06); squash(b, 0.8, 0.06);
        drops(K, wpos(ws.bunch, ws.bunch.userData.cuts[i], 0.1, 0), '#9BE07A', 5);
      },
      async done(ws, K) { fx(K, ws.bunch, '#9BE07A', 12); } },

    { type: 'rub', target: ws => ws.basket, effect: 'water', amount: 1.1, voice: 'Xoa xoa để rửa rau thật sạch nào!',
      async setup(ws, K) {
        vw(K, ws, [-2.9, 0.5, 0.2, 5.0, 3.2], [-2.2, 0.5, 0.5, 4.4, 3.8]);
        const cols = ws.bunch.userData.cols;
        await Promise.all(cols.map((c, i) => wait(i * 0.08).then(() => {
          into(ws.basket, c); const a = i * 1.3 + 0.4, r = i ? 0.3 : 0.05;
          return Promise.all([arc(c, V(Math.cos(a) * r, 0.1 + i * 0.07, Math.sin(a) * r), 0.6, 1.6), turn(c, { x: 0, y: a + 0.6, z: 0 }, 0.6), scaleTo(c, 0.95, 0.6)]);
        })));
        Sound.fx.pop(); sinkView(K); K.water(true);
      },
      onProgress(ws, p) { ws.leafMat.roughness = 0.5 - 0.32 * p; },
      async done(ws, K) {
        K.water(false); Sound.fx.splash(); fx(K, ws.basket, '#BFE6FF', 10);
        vw(K, ws, [-2.4, 0.5, -0.1, 4.4, 3.0], [-1.7, 0.5, 0.0, 3.6, 3.6]);
        await arc(ws.basket, RM.basket.clone(), 0.8, 1.0);
      } },

    { type: 'rub', target: ws => ws.garlic, effect: 'flakes', flakeColor: '#F3E3CF', amount: 1.2, voice: 'Xoa xoa để bóc vỏ tỏi nào!',
      async setup(ws, K) {
        ws.garlic = add(K, MB.garlicCloves(3), V(RM.board.x, BD, RM.board.z)); ws.garlic.scale.setScalar(1.5); await pop(ws.garlic, 0.4);
        K.view(V(RM.board.x, 0.3, RM.board.z + 0.1), 2.3, 1.9);
      },
      onProgress(ws, p) { const want = Math.min(3, Math.floor(p * 3.3)); for (let i = 0; i < want; i++) peelClove(ws, i); },
      async done(ws, K) {
        for (let i = 0; i < 3; i++) peelClove(ws, i);
        await wait(0.35); fx(K, ws.garlic, '#FFFFFF', 12);
        ws.flakes.forEach(f => popOut(f));
      } },

    { type: 'adult', who: 'me', action: 'stove', voice: 'Lửa lớn nóng lắm! Bé đứng xa, nhờ mẹ xào rau nhé!', safety: 'Lửa lớn nóng lắm! Bé đứng xa bếp nhé!',
      setup(ws, K) { vw(K, ws, [0.25, 0.6, 0.45, 5.4, 3.2], [0.2, 0.6, -0.1, 3.6, 4.6]); },
      async run(ws, K) {
        // băm tỏi
        await chop(K, V(RM.board.x, 0.4, RM.board.z), 4, 0.6);
        ws.garlic.visible = false;
        ws.garlicMat = own(new THREE.MeshStandardMaterial({ color: GARLIC.clone(), roughness: 0.4 }));
        ws.minced = add(K, MB.mincedGarlic(ws.garlicMat), V(RM.board.x, BD, RM.board.z)); Sound.fx.pop(); await popIn(ws.minced, 0.3);
        // bếp lửa lớn, chảo, dầu
        K.stove.show(RM.stove); ws.stand = add(K, MB.potStand(0.28), V(RM.stove.x, 0.4, RM.stove.z)); pop(ws.stand, 0.3); await wait(0.3);
        ws.wok = add(K, MB.wok(), V(RM.stove.x, 0.68, RM.stove.z)); ws.wok.rotation.y = 0.55; await popIn(ws.wok, 0.35);
        K.stove.fire(1.35); Sound.fx.click(); await wait(0.2);
        // phi tỏi thơm vàng
        await arc(ws.minced, wpos(ws.wok, 0, 0.1, 0), 0.5, 0.9); into(ws.wok, ws.minced);
        const st = K.steam(ws.wok, { rate: 4, size: 0.8, y: 0.7, spread: 0.8 });
        await Promise.all([tweenNum(0, 1, 1.0, v => ws.garlicMat.color.lerpColors(GARLIC, GOLD, v)), sounds(ws, 1.0)]);
        K.say('Tỏi phi thơm quá!');
        // cho rau vào chảo
        const cols = ws.bunch.userData.cols;
        for (let i = 0; i < cols.length; i++) {
          const c = cols[i]; toWs(K, c);
          arc(c, wpos(ws.wok, (i - 2) * 0.18, 0.3, (i % 2 - 0.5) * 0.3), 0.45, 1.1).then(() => { c.visible = false; });
          await wait(0.09);
        }
        await wait(0.4);
        ws.fry = MB.stirFry({ radius: 0.72, height: 0.32 }); ws.fry.position.y = 0.1; ws.wok.add(ws.fry); ws.fry.userData.garlic.visible = false;
        ws.minced.visible = false; Sound.fx.sizzle(); st.rate = 9;
        // xóc chảo, đảo rau
        for (let i = 0; i < 3 && live(ws); i++) {
          Tweens.add(ws.wok.rotation, { z: 0.14 }, 0.12); K.stove.fire(1.5);
          await Tweens.to(ws.fry.position, { y: 0.8 }, 0.2, { ease: Ease.outCubic });
          Tweens.add(ws.fry.rotation, { y: ws.fry.rotation.y + 1.4, x: 0.25 * (i % 2 ? 1 : -1) }, 0.36); Sound.fx.whoosh();
          await Tweens.to(ws.fry.position, { y: 0.1 }, 0.22, { ease: Ease.inQuad });
          ws.fry.rotation.x = 0; Tweens.add(ws.wok.rotation, { z: 0 }, 0.12); K.stove.fire(1.35);
          Sound.fx.sizzle(); fx(K, ws.fry, '#FFD34D', 5);
          if (i === 1) { ws.fry.userData.garlic.visible = true; }
          await wait(0.25);
        }
        await sounds(ws, 0.8);
        K.stove.fire(0); Sound.fx.click(); st.rate = 5;
        fx(K, ws.fry, '#9BE07A', 10);
        popOut(ws.board); ws.minced.visible = false;
      } },

    { type: 'drag', liftY: 0.6, voice: 'Bé kéo đĩa đến cạnh bếp, đưa mẹ bày rau nhé!',
      items: ws => [{ obj: ws.plate, name: 'đĩa' }],
      target: () => ({ pos: V(RM.spot.x, 0.1, RM.spot.z), r: 0.95 }),
      async setup(ws, K) {
        ws.plate = add(K, MD.plate(0.85), RM.plate0.clone()); pop(ws.plate);
        ws.ring = add(K, MB.spotRing(1.1), RM.spot.clone()); popIn(ws.ring, 0.35);
        ws.offRing = loop(K, ws, (dt, t) => { ws.ring.material.opacity = 0.7 + 0.3 * Math.sin(t * 5); ws.ring.scale.setScalar(1 + 0.04 * Math.sin(t * 5)); });
        vw(K, ws, [-1.0, 0.45, 0.85, 5.2, 3.0], [0.6, 0.45, 0.25, 4.4, 4.4]);
      },
      async place(ws, it, n, K) {
        await moveTo(ws.plate, RM.spot.clone(), 0.3); ws.offRing(); popOut(ws.ring);
        K.say('Mẹ ơi, đĩa đây ạ!');
        await wait(0.3);
        toWs(K, ws.fry);
        await arc(ws.fry, V(RM.spot.x, 0.065, RM.spot.z), 0.7, 1.3);
        into(ws.plate, ws.fry); Sound.fx.pop(); scaleTo(ws.fry, 1 / 0.85 * 0.9, 0.2);
        K.stopSteam(); K.steam(ws.fry, { rate: 5, size: 0.8, y: 0.35, spread: 0.6 });
        fx(K, ws.fry, '#9BE07A', 10); fx(K, ws.fry, '#FFD34D', 6);
        K.stove.hide(); popOut(ws.wok); popOut(ws.stand);
      },
      async done() { Sound.fx.yum(); } },
  ],
  reveal: ws => ws.plate,
  final: () => MB.rauMuongPlate(),
};

export const RECIPES = { banhmi, goicuon, canhbi, raumuong };
