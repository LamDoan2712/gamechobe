// recipes-a.js — phần tương tác 3D của 3 món: Cơm trắng, Nước cam vắt, Trứng chiên hành.
// Mỗi món: build(K) dựng đồ trên bàn (mọi vật kéo thả được phải là con trực tiếp của K.ws),
// steps[] khớp thứ tự với data.js (voice = lời hướng dẫn nói to), reveal(ws) = món đã xong để máy quay lại gần,
// final() = món hoàn chỉnh đứng riêng (ảnh thu nhỏ, mâm cơm).

import { THREE, Tweens, Ease } from '../../kit/three-kit.js';
import { Sound } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import * as MD from './models.js';
import { liquid, own, glossy, tex } from './mats.js';
import { SPOT } from './kitchen.js';
import { arc, popIn, popOut, moveTo, squash, chop, pourStream, worldOf, wait } from './anim.js';
import { countWord } from './steps.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const add = (K, o, pos) => { if (pos) o.position.copy(pos); K.ws.add(o); return o; };
const fx = (K, obj, color = '#FFD34D', n = 6) => { const s = K.toScreen(obj.isVector3 ? obj : worldOf(obj)); FX.sparkle(s.x, s.y, color, n); };
const tweenNum = (from, to, dur, set) => { const p = { v: from }; return Tweens.to(p, { v: to }, dur, { onUpdate: () => set(p.v) }); };

/* ═════════ 1. CƠM TRẮNG ═════════ */
const CLEAR = new THREE.Color('#DDEFFF'), MILK = new THREE.Color('#F3EFE4');
function riceBowl(scale = 1) {
  const b = MD.bowl(scale); const r = MD.cookedRice(0.66, 0.46); r.position.y = 0.2; b.add(r);
  return b;
}
const com = {
  build(K) {
    const ws = {};
    ws.pot = add(K, MD.pot({ r: 1, h: 1.05, marks: true }), SPOT.center.clone());
    ws.rice = MD.riceGrains(440, 0.8, 0.15); ws.rice.position.y = 0.04; ws.rice.count = 0; ws.pot.add(ws.rice);
    ws.waterMat = liquid('#DDEFFF', 0.5); ws.water = MD.fill(ws.pot, ws.waterMat, 0);
    ws.line = MD.mesh(new THREE.TorusGeometry(MD.radiusAt(ws.pot.userData.profile, 0.45) - 0.01, 0.025, 6, 48), own(new THREE.MeshBasicMaterial({ color: '#FF5C9A' })));
    ws.line.rotation.x = Math.PI / 2; ws.line.position.y = 0.45; ws.line.visible = false; ws.pot.add(ws.line);
    ws.sack = add(K, MD.sack(), V(-2.6, 0, 0.1)); ws.sack.scale.setScalar(0.85);
    ws.scoop = add(K, MD.scoop(), V(-2.6, 0.95, 0.1));
    ws.jug = add(K, MD.jug(), V(2.5, 0, 0.5)); ws.jugWater = MD.liquidBody(ws.jug, '#CDEBFF', 0.55); ws.jugWater.userData.setLevel(0.78);
    ws.stream = pourStream(K);
    return ws;
  },
  steps: [
    { type: 'tap', count: 2, target: ws => ws.sack, voice: 'Chạm vào bao gạo để đong hai cốc gạo nhé!',
      setup(ws, K) { K.view(V(-1.2, 0.5, 0.3), 6.2, 3.8); },
      async onTap(ws, n, count, K) {
        const home = V(-2.6, 0.95, 0.1);
        await arc(ws.scoop, V(-0.55, 1.45, 0.35), 0.45, 0.6);
        await Tweens.to(ws.scoop.rotation, { z: -2.1 }, 0.18);
        Sound.fx.pour(); fx(K, ws.pot, '#FFFFFF', 8);
        await tweenNum(ws.rice.count, n * 220, 0.3, v => { ws.rice.count = Math.round(v); });
        Tweens.add(ws.scoop.rotation, { z: 0 }, 0.18);
        await arc(ws.scoop, home, 0.35, 0.5);
      },
      async done(ws) { await popOut(ws.scoop); } },

    { type: 'rub', target: ws => ws.pot, effect: 'water', amount: 1.1, voice: 'Xoa xoa để vo gạo cho sạch nào!',
      async setup(ws, K) {
        K.view(V(0, 0.5, 0.35), 4, 3);
        Sound.fx.pour(); await tweenNum(0, 0.32, 0.6, v => ws.water.userData.setLevel(v));
      },
      onProgress(ws, p) { ws.waterMat.color.lerpColors(CLEAR, MILK, p); ws.waterMat.opacity = 0.5 + 0.4 * p; },
      async done(ws, K) {
        K.say('Chắt bỏ nước đục đi nào!');
        await Tweens.to(ws.pot.rotation, { z: 0.35 }, 0.4); Sound.fx.splash();
        await tweenNum(0.32, 0, 0.6, v => ws.water.userData.setLevel(v));
        await Tweens.to(ws.pot.rotation, { z: 0 }, 0.3);
        ws.waterMat.color.copy(CLEAR); ws.waterMat.opacity = 0.5;
      } },

    { type: 'pour', line: 0.42, from: 0, rate: 0.2, tilt: -1.25, voice: 'Giữ tay để rót nước tới vạch hồng. Thả tay ra là dừng!',
      pourer: ws => ws.jug, vessel: ws => ws.pot,
      async setup(ws, K) {
        K.view(V(0.5, 0.8, 0.35), 4.6, 3.4);
        ws.jug.rotation.y = Math.PI; await moveTo(ws.jug, V(1.55, 1.15, 0.35), 0.5);
        ws.line.visible = true; await popIn(ws.line, 0.3);
      },
      stream(ws, on) { ws.streaming = on; if (!on) ws.stream.set(false); },
      onLevel(ws, level) {
        ws.water.userData.setLevel(level); ws.jugWater.userData.setLevel(0.78 - level * 1.2);
        if (ws.streaming) ws.stream.set(true, worldOf(ws.jug, 0.5, 1.12, 0), worldOf(ws.pot, 0.55, 0.03 + level, 0));
      },
      async done(ws) { ws.stream.set(false); await moveTo(ws.jug, V(2.5, 0, 0.5), 0.4); ws.jug.rotation.y = 0; popOut(ws.line); } },

    { type: 'drag', liftY: 1.7, voice: 'Kéo nồi gạo vào nồi cơm điện nhé!',
      items: ws => [{ obj: ws.pot, name: 'nồi gạo' }],
      target: ws => ({ pos: ws.cooker.position.clone().setY(0.42), r: 1.6 }),
      async setup(ws, K) {
        await popOut(ws.jug);
        ws.cooker = add(K, MD.riceCooker(), V(2.4, 0, -0.1)); ws.cooker.userData.setLid(1); await popIn(ws.cooker);
        K.view(V(1.2, 0.8, 0.2), 6.2, 3.6);
      },
      async place(ws) {
        await moveTo(ws.pot, V(2.4, 0.42, -0.1), 0.35); Tweens.add(ws.pot.scale, { x: 0.92, y: 0.8, z: 0.92 }, 0.2);
        const lid = { v: 1 }; await Tweens.to(lid, { v: 0 }, 0.5, { ease: Ease.outBounce, onUpdate: () => ws.cooker.userData.setLid(lid.v) });
        Sound.fx.click();
      } },

    { type: 'button', target: ws => ws.cooker.userData.button, voice: 'Ba mẹ cắm điện rồi. Bé bấm nút nấu nhé!',
      setup(ws, K) { K.view(V(2.4, 0.9, 0.6), 3.2, 2.4); },
      async onTap(ws) { Sound.fx.click(); await squash(ws.cooker.userData.button, 0.4, 0.08); ws.cooker.userData.setLight(true); } },

    { type: 'wait', secs: 5, voice: 'Chờ cơm chín nhé. Nghe tiếng tách là xong!',
      async run(ws, K) {
        K.view(V(2.4, 1.0, 0.1), 5.6, 4);
        const st = K.steam(ws.cooker.userData.vent, { rate: 6, size: 0.9, y: 0.15, spread: 0.2 });
        const base = ws.cooker.position.clone(), off = K.onFrame((dt, t) => { ws.cooker.position.x = base.x + Math.sin(t * 40) * 0.008; });
        for (let i = 0; i < 5; i++) { await wait(1); Sound.fx.boil(); }
        off(); ws.cooker.position.copy(base); st.stop();
        Sound.fx.tach(); ws.cooker.userData.setLight(false); await wait(0.4);
        const lid = { v: 0 }; await Tweens.to(lid, { v: 1 }, 0.6, { onUpdate: () => ws.cooker.userData.setLid(lid.v) });
        ws.rice.visible = false; ws.water.visible = false;
        ws.cooked = MD.cookedRice(0.86, 0.32); ws.cooked.position.y = 0.2; ws.pot.add(ws.cooked); popIn(ws.cooked, 0.4);
        ws.potSteam = K.steam(ws.cooked, { rate: 9, size: 1.1, y: 0.5, spread: 0.8 });
        Sound.fx.yum(); fx(K, ws.cooked, '#FFFFFF', 10);
        await wait(0.8); ws.potSteam.rate = 3;
      } },

    { type: 'stir', rounds: 2, radius: 0.45, toolY: 0.05, voice: 'Xới cơm cho tơi nào! Cẩn thận hơi nóng nhé.',
      center: ws => worldOf(ws.pot, 0, 0.75, 0),
      tool: ws => ws.paddle,
      setup(ws, K) {
        K.view(V(2.4, 1.0, 0.1), 3.4, 2.6);
        ws.paddle = add(K, MD.paddle(), worldOf(ws.pot, 0, 0.8, 0)); ws.paddle.rotation.x = -0.5; popIn(ws.paddle);
      },
      onProgress(ws, p) { ws.cooked.rotation.y = p * 2; ws.cooked.scale.y = 1 + Math.sin(p * 20) * 0.04; },
      async done(ws, K) {
        ws.bowl = add(K, MD.bowl(1), V(-0.2, 0, 0.8)); await popIn(ws.bowl);
        K.view(V(0.9, 0.6, 0.5), 5, 3);
        await arc(ws.paddle, V(-0.2, 1.1, 0.8), 0.6, 0.8);
        ws.bowlRice = MD.cookedRice(0.66, 0.46); ws.bowlRice.position.y = 0.2; ws.bowl.add(ws.bowlRice); popIn(ws.bowlRice, 0.4);
        Tweens.add(ws.cooked.scale, { y: 0.6 }, 0.4);
        await popOut(ws.paddle);
        K.steam(ws.bowlRice, { rate: 5, size: 0.8, y: 0.45, spread: 0.5 });
      } },
  ],
  reveal: ws => ws.bowl,
  final: () => riceBowl(1),
};

/* ═════════ 2. NƯỚC CAM VẮT ═════════ */
function orangeSlice() {
  const peel = glossy('#FF9A1F', 0.4, 0.5), face = glossy('#FFFFFF', 0.3, 0.8, { map: tex.orangeCut() });
  const m = MD.mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 32), [peel, face, face]); m.rotation.x = Math.PI / 2;
  return MD.group('slice', m);
}
function juiceCup() {
  const c = MD.cup(); const j = MD.liquidBody(c, '#FFA928', 0.92); j.userData.setLevel(0.74);
  [[0.1, 0.78, 0.08], [-0.12, 0.8, -0.05], [0.02, 0.84, -0.14]].forEach(([x, y, z], i) => { const ice = MD.iceCube(); ice.position.set(x, y - 0.15, z); ice.rotation.set(i, i * 0.7, 0); ice.scale.setScalar(0.8); c.add(ice); });
  const st = MD.straw(); st.position.set(0.15, 0.25, 0); st.rotation.z = -0.25; c.add(st);
  const sl = orangeSlice(); sl.position.set(-0.4, 1.02, 0.1); sl.rotation.y = 0.4; c.add(sl);
  return c;
}
const cam = {
  build(K) {
    const ws = {};
    ws.orange = add(K, MD.orange(), V(SPOT.sink.x, 0.1, SPOT.sink.z));
    ws.board = add(K, MD.board(), V(0, 0, 0.4)); ws.board.scale.setScalar(0.75);
    ws.juicer = add(K, MD.juicer(), V(-2.3, 0, 0.7)); ws.juice = MD.fill(ws.juicer, liquid('#FFA41B', 0.92), 0);
    ws.cup = add(K, MD.cup(), V(2.3, 0, 0.7)); ws.cupJuice = MD.liquidBody(ws.cup, '#FFA928', 0.92);
    ws.jar = add(K, MD.sugarJar(), V(1.7, 0, -1.3));
    ws.icePlate = add(K, MD.plate(0.6), V(-1.6, 0, -1.2));
    ws.ices = [[-1.8, -1.2], [-1.45, -1.05], [-1.55, -1.4]].map(([x, z], i) => { const c = add(K, MD.iceCube(), V(x, 0.09, z)); c.rotation.y = i; return c; });
    ws.stream = pourStream(K, '#FFA928');
    return ws;
  },
  steps: [
    { type: 'rub', target: ws => ws.orange, effect: 'water', voice: 'Xoa xoa để rửa sạch quả cam nào!',
      setup(ws, K) { K.view(V(SPOT.sink.x, 0.6, SPOT.sink.z + 0.3), 3.4, 2.8); K.water(true); },
      onProgress(ws, p) { ws.orange.children[0].material.roughness = 0.45 - 0.3 * p; },
      async done(ws, K) { K.water(false); fx(K, ws.orange, '#FFFFFF', 8); K.view(V(-1.5, 0.6, 0.4), 6.5, 3.4); await arc(ws.orange, V(0, 0.1, 0.4), 0.7, 1.2); } },

    { type: 'adult', who: 'me', action: 'cut', voice: 'Dao sắc lắm, bé nhờ mẹ cắt đôi quả cam nhé!',
      setup(ws, K) { K.view(V(0, 0.5, 0.4), 3.6, 2.6); },
      async run(ws, K) {
        await chop(K, V(0, 0.55, 0.4), 1, 0);
        ws.halves = [-0.45, 0.45].map(x => { const h = add(K, MD.orangeHalf(), V(0, 0.1, 0.4)); return h; });
        ws.orange.visible = false; Sound.fx.pop();
        await Promise.all(ws.halves.map((h, i) => moveTo(h, V(i ? 0.5 : -0.5, 0.1, 0.4), 0.3)));
        fx(K, V(0, 0.6, 0.4), '#FFB02E', 10);
      } },

    { type: 'squeeze', presses: 8, juiceColor: '#FFB02E', target: ws => ws.juicer, voice: 'Bấm liên tục để vắt cam nào!',
      async setup(ws, K) {
        await popOut(ws.board);
        await moveTo(ws.juicer, V(0, 0, 0.4), 0.4);
        await moveTo(ws.halves[1], V(1.6, 0.1, 0.9), 0.3);
        ws.halves[0].rotation.x = Math.PI; await arc(ws.halves[0], V(0, 1.04, 0.4), 0.45, 0.5);
        K.view(V(0, 0.7, 0.4), 3.6, 2.8);
      },
      async onPress(ws, n) {
        const h = n <= 4 ? ws.halves[0] : ws.halves[1];
        Tweens.add(h.rotation, { y: h.rotation.y + 0.6 }, 0.2); await squash(h, 0.85, 0.08);
        ws.juice.userData.setLevel((n / 8) * 0.8);
        if (n === 4) {
          ws.halves[0].rotation.x = 0; await arc(ws.halves[0], V(-1.6, 0.1, 0.9), 0.4, 0.6);
          ws.halves[1].rotation.x = Math.PI; await arc(ws.halves[1], V(0, 1.04, 0.4), 0.45, 0.6);
        }
      },
      async done(ws) { ws.halves[1].rotation.x = 0; await arc(ws.halves[1], V(-1.9, 0.1, 0.4), 0.4, 0.6); } },

    { type: 'pour', line: 0.72, from: 0, rate: 0.22, tilt: -1.05, voice: 'Giữ tay để rót nước cam vào cốc. Tới vạch thì thả tay!',
      pourer: ws => ws.juicer, vessel: ws => ws.cup,
      async setup(ws, K) {
        await moveTo(ws.cup, V(0.7, 0, 0.5), 0.4);
        await moveTo(ws.juicer, V(-0.3, 1.9, 0.5), 0.4);
        ws.mark = MD.mesh(new THREE.TorusGeometry(0.43, 0.018, 6, 40), own(new THREE.MeshBasicMaterial({ color: '#FF5C9A' }))); ws.mark.rotation.x = Math.PI / 2;
        ws.mark.position.y = 0.07 + 0.99 * 0.72; ws.cup.add(ws.mark);
        K.view(V(0.2, 0.9, 0.5), 3.8, 3);
      },
      stream(ws, on) { ws.streaming = on; if (!on) ws.stream.set(false); },
      onLevel(ws, level) {
        ws.cupJuice.userData.setLevel(level); ws.juice.userData.setLevel(Math.max(0, 0.8 * (1 - level / 0.8)));
        if (ws.streaming) ws.stream.set(true, worldOf(ws.juicer, 0.9, 0.35, 0), worldOf(ws.cup, 0, 0.07 + level * 0.99, 0));
      },
      async done(ws) { ws.stream.set(false); ws.mark.visible = false; await moveTo(ws.juicer, V(-2.3, 0, 0.8), 0.4); ws.juicer.rotation.z = 0; } },

    { type: 'stir', rounds: 2, radius: 0.22, toolY: 0, voice: 'Thêm một thìa đường rồi khuấy đều nào!',
      center: ws => worldOf(ws.cup, 0, 1.05, 0), tool: ws => ws.spoon,
      async setup(ws, K) {
        K.view(V(0.9, 0.8, -0.2), 4, 3);
        ws.spoon = add(K, MD.spoon(), V(1.7, 1.0, -1.3)); await popIn(ws.spoon);
        await arc(ws.spoon, worldOf(ws.cup, 0, 1.2, 0), 0.6, 0.6); Sound.fx.pour();
        fx(K, worldOf(ws.cup, 0, 1, 0), '#FFFFFF', 10);
        K.view(V(0.7, 0.8, 0.5), 3.2, 2.6);
      },
      async done(ws) { await popOut(ws.spoon); } },

    { type: 'drag', liftY: 1.6, voice: 'Thả ba viên đá vào cốc nhé!',
      items: ws => ws.ices.map(o => ({ obj: o, name: 'đá' })),
      target: ws => ({ pos: ws.cup.position.clone().setY(0.9), r: 0.9 }),
      setup(ws, K) { K.view(V(-0.4, 0.6, -0.3), 4.6, 3.2); },
      async place(ws, it, n, K) {
        const spots = [[0.1, 0.62, 0.08], [-0.12, 0.66, -0.05], [0.02, 0.7, -0.14]][n - 1];
        await moveTo(it.obj, worldOf(ws.cup, spots[0], spots[1], spots[2]), 0.3); Sound.fx.splash();
        fx(K, it.obj, '#BFE6FF', 6);
      },
      async done(ws, K) {
        const st = MD.straw(); st.position.set(0.15, 0.25, 0); st.rotation.z = -0.25; ws.cup.add(st); await popIn(st);
        const sl = orangeSlice(); sl.position.set(-0.4, 1.02, 0.1); sl.rotation.y = 0.4; ws.cup.add(sl); await popIn(sl);
        K.view(V(0.7, 0.8, 0.5), 2.6, 2.4);
      } },
  ],
  reveal: ws => ws.cup,
  final: () => juiceCup(),
};

/* ═════════ 3. TRỨNG CHIÊN HÀNH ═════════ */
const GARNISH = ['cachua', 'dualeo', 'ngo', 'ot', 'tieu'].map(key => ({ key, name: MD.GARNISH_NAMES[key], make: () => MD.garnish(key) }));
function omelettePlate() {
  const p = MD.plate(1); const o = MD.omelette(0.95); o.position.y = 0.08; p.add(o);
  [['cachua', 0.55, 0.2], ['cachua', 0.4, 0.55], ['dualeo', -0.5, 0.45], ['ngo', -0.2, -0.3], ['ot', 0.2, -0.45]].forEach(([k, x, z]) => { const g = MD.garnish(k); g.position.set(x, 0.14, z); o.add(g); });
  return p;
}
const trung = {
  build(K) {
    const ws = {};
    ws.bowl = add(K, MD.bowl(1.1), V(0, 0, 0.4));
    ws.eggTray = add(K, MD.group('eggTray'), V(2.1, 0, 0.7));
    ws.eggs = [V(-0.25, 0, 0.15), V(0.35, 0, -0.2)].map(p => { const e = MD.egg(); e.position.copy(p); ws.eggTray.add(e); return e; });
    ws.board = add(K, MD.board(), V(-2.4, 0, -0.3)); ws.board.scale.setScalar(0.7);
    ws.onion = add(K, MD.greenOnion(4), V(-2.4, 0.1, -0.3));
    ws.bottle = add(K, MD.bottle(), V(1.8, 0, -1.3));
    ws.mixMat = own(new THREE.MeshStandardMaterial({ color: '#FFC23A', roughness: 0.3, transparent: true, opacity: 0 }));
    ws.mix = MD.fill(ws.bowl, ws.mixMat, 0.3);
    ws.inBowl = [];
    return ws;
  },
  steps: [
    { type: 'tap', count: 6, say: false, target: ws => ws.eggTray, voice: 'Chạm vào quả trứng, gõ ba lần để đập trứng nhé!',
      setup(ws, K) { K.view(V(1, 0.6, 0.5), 5, 3); },
      async onTap(ws, n, count, K) {
        const i = n <= 3 ? 0 : 1, k = ((n - 1) % 3) + 1, egg = ws.eggs[i];
        K.say(countWord(k) + '!', true);
        const rim = ws.eggTray.worldToLocal(worldOf(ws.bowl, 0.6, 1.1, 0));
        if (k === 1) await arc(egg, rim, 0.4, 0.5);
        await Tweens.to(egg.position, { y: rim.y - 0.25 }, 0.08); Sound.fx.crack(); fx(K, egg, '#FFFFFF', 3);
        await Tweens.to(egg.position, { y: rim.y }, 0.12);
        if (k === 3) {
          egg.visible = false; Sound.fx.pop();
          const ce = MD.crackedEgg(); ce.position.set(i ? -0.2 : 0.2, 0.9, i ? -0.1 : 0.12); ce.rotation.y = i * 2; ws.bowl.add(ce); ws.inBowl.push(ce);
          await Tweens.to(ce.position, { y: 0.19 + i * 0.01 }, 0.3, { ease: Ease.outBounce });
          [-1, 1].forEach(s => { const sh = MD.shellHalf(); sh.position.copy(worldOf(ws.bowl, 0.6, 1.1, 0)); K.ws.add(sh); arc(sh, V(1.3 + s * 0.2, 0.05, 1.2), 0.5, 0.6).then(() => popOut(sh)); });
        }
      } },

    { type: 'adult', who: 'me', action: 'cut', voice: 'Dao sắc lắm, bé nhờ mẹ cắt hành lá nhé!',
      setup(ws, K) { K.view(V(-2.4, 0.4, -0.2), 3.6, 2.6); },
      async run(ws, K) {
        await chop(K, V(-2.4, 0.2, -0.3), 4, 1.0);
        ws.onion.visible = false;
        ws.pile = add(K, MD.group('pile'), V(-2.4, 0.12, -0.3)); ws.pile.add(MD.onionBits(70, 0.38)); await popIn(ws.pile);
      } },

    { type: 'drag', liftY: 1.2, voice: 'Kéo hành lá vào bát trứng nhé!',
      items: ws => [{ obj: ws.pile, name: 'hành' }],
      target: ws => ({ pos: ws.bowl.position.clone().setY(0.4), r: 1.3 }),
      setup(ws, K) { K.view(V(-1.2, 0.5, 0.1), 5.2, 3); },
      async place(ws) { await moveTo(ws.pile, V(0, 0.34, 0.4), 0.3); Tweens.add(ws.pile.scale, { x: 1.4, y: 1, z: 1.4 }, 0.3); } },

    { type: 'tap', count: 2, target: ws => ws.bottle, voice: 'Chạm vào chai nước mắm, nêm hai giọt thôi nhé!',
      setup(ws, K) { K.view(V(0.8, 0.8, -0.3), 4.2, 3.2); },
      async onTap(ws, n, count, K) {
        if (n === 1) { await arc(ws.bottle, V(0.9, 1.1, 0.3), 0.45, 0.6); await Tweens.to(ws.bottle.rotation, { z: 2.1 }, 0.25); }
        const drop = MD.mesh(new THREE.SphereGeometry(0.07, 10, 8), glossy('#B8621B', 0.2, 1)); drop.position.copy(worldOf(ws.bottle, 0, 1.3, 0)); K.ws.add(drop);
        await Tweens.to(drop.position, { x: 0.1, y: 0.35, z: 0.4 }, 0.35, { ease: Ease.inQuad }); Sound.fx.bubble();
        K.ws.remove(drop); drop.geometry.dispose();
      },
      async done(ws) { await Tweens.to(ws.bottle.rotation, { z: 0 }, 0.2); await arc(ws.bottle, V(1.8, 0, -1.3), 0.45, 0.6); } },

    { type: 'stir', rounds: 3, radius: 0.5, toolY: 0.25, voice: 'Cầm đũa đánh trứng thật đều nào!',
      center: ws => worldOf(ws.bowl, 0, 0.35, 0), tool: ws => ws.sticks,
      setup(ws, K) { K.view(V(0, 0.6, 0.4), 3.2, 2.6); ws.sticks = add(K, MD.chopsticks(), worldOf(ws.bowl, 0, 0.6, 0)); ws.sticks.rotation.x = 0.35; popIn(ws.sticks); },
      onProgress(ws, p) {
        ws.inBowl.forEach(e => { e.scale.setScalar(Math.max(0.01, 1 - p)); });
        ws.mixMat.opacity = Math.min(1, p * 1.4); ws.pile.position.y = 0.34 + p * 0.02;
      },
      async done(ws) { await popOut(ws.sticks); } },

    { type: 'adult', who: 'me', action: 'stove', voice: 'Bếp nóng lắm! Bé đứng xa, nhờ mẹ chiên trứng nhé!',
      setup(ws, K) { K.view(V(-0.6, 0.6, 0.4), 6, 3.4); },
      async run(ws, K) {
        await Promise.all([moveTo(ws.bowl, V(-2.3, 0, 0.6), 0.4), moveTo(ws.pile, V(-2.3, 0.34, 0.6), 0.4)]);
        K.stove.show(V(0.4, 0, 0.3)); await wait(0.3);
        ws.pan = add(K, MD.pan(), V(0.4, 0.4, 0.3)); await popIn(ws.pan);
        K.view(V(0, 0.8, 0.4), 5.4, 3.2);
        K.stove.fire(1); Sound.fx.click(); await wait(0.6);
        await arc(ws.bowl, V(-0.6, 1.3, 0.3), 0.5, 0.4); ws.pile.visible = false;
        await Tweens.to(ws.bowl.rotation, { z: -1.2 }, 0.3);
        ws.om = MD.omelette(0.95); ws.om.position.y = 0.09; ws.om.scale.set(0.3, 1, 0.3); ws.pan.add(ws.om);
        tweenNum(0.3, 0, 0.5, v => ws.mix.userData.setLevel(v));
        Sound.fx.sizzle(); await Tweens.to(ws.om.scale, { x: 1, z: 1 }, 0.9, { ease: Ease.outCubic });
        await Tweens.to(ws.bowl.rotation, { z: 0 }, 0.2); moveTo(ws.bowl, V(-2.3, 0, 0.6), 0.4);
        const sz = K.steam(ws.om, { rate: 6, size: 0.7, y: 0.2, spread: 0.9 });
        for (let i = 0; i < 4; i++) { Sound.fx.sizzle(); await wait(0.45); }
        await Tweens.to(ws.om.position, { y: 1.2 }, 0.25, { ease: Ease.outCubic }); Tweens.add(ws.om.rotation, { x: Math.PI * 2 }, 0.45);
        await wait(0.2); await Tweens.to(ws.om.position, { y: 0.09 }, 0.25, { ease: Ease.inQuad }); Sound.fx.sizzle();
        await wait(0.8); K.stove.fire(0); sz.rate = 3;
      } },

    { type: 'decorate', min: 4, garnishes: GARNISH, voice: 'Chọn rau củ rồi chạm lên trứng để bày thật đẹp nhé!',
      surface: ws => ws.plateOm.children[0],
      async setup(ws, K) {
        ws.plate = add(K, MD.plate(1.05), V(-0.2, 0, 1.0)); await popIn(ws.plate);
        ws.plateOm = MD.omelette(0.95); ws.plateOm.position.y = 0.08; ws.plateOm.visible = false; ws.plate.add(ws.plateOm);
        await arc(ws.om, ws.pan.worldToLocal(worldOf(ws.plate, 0, 0.4, 0)), 0.5, 0.8);
        ws.om.visible = false; ws.plateOm.visible = true; Sound.fx.pop();
        K.stove.hide(); popOut(ws.pan); K.stopSteam(); K.steam(ws.plateOm, { rate: 4, size: 0.7, y: 0.2, spread: 0.9 });
        K.view(V(-0.2, 0.3, 1.0), 3.2, 2.6, 1.1);
      } },
  ],
  reveal: ws => ws.plate,
  final: () => omelettePlate(),
};

export const RECIPES_A = { com, cam, trung };
