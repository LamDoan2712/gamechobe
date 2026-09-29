// recipes-c.js — phần tương tác 3D của 3 món: Thịt kho trứng, Chè chuối, Phở bò.
// Cấu trúc như recipes-a.js: build(K) dựng đồ trên bàn (vật kéo thả là con trực tiếp của K.ws),
// steps[] khớp thứ tự & người làm trong data.js, reveal(ws) = món xong để máy quay lại gần, final() = món hoàn chỉnh đứng riêng.

import { THREE, Tweens, Ease } from '../../kit/three-kit.js';
import { Sound } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import * as MD from './models.js';
import * as MC from './models-c.js';
import { liquid, own, glossy } from './mats.js';
import { arc, popIn, popOut, moveTo, chop, pourStream, worldOf, wait } from './anim.js';
import { countWord } from './steps.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const add = (K, o, pos) => { if (pos) o.position.copy(pos); K.ws.add(o); return o; };
const fx = (K, obj, color = '#FFD34D', n = 6) => { const s = K.toScreen(obj.isVector3 ? obj : worldOf(obj)); FX.sparkle(s.x, s.y, color, n); };
const tweenNum = (from, to, dur, set, o = {}) => { const p = { v: from }; return Tweens.to(p, { v: to }, dur, Object.assign({ onUpdate: () => set(p.v) }, o)); };
const rnd = (a, b) => a + Math.random() * (b - a);
const after = (s, fn) => wait(s).then(fn);
// Toạ độ thế giới vào vector có sẵn (dùng trong hàm chạy mỗi khung hình, không cấp phát mới)
const A = new THREE.Vector3(), B = new THREE.Vector3();
const wp = (obj, x, y, z, out) => obj.localToWorld(out.set(x, y, z));
// Gỡ vật khỏi cảnh; dispose = true khi hình học là của riêng vật đó
function drop(o, dispose = false) { if (o.parent) o.parent.remove(o); if (dispose) o.traverse(c => { if (c.geometry) c.geometry.dispose(); }); }
// Âm thanh lặp lại vài lần (rót, sôi…) chạy song song với hoạt ảnh
async function sounds(name, times, gap) { for (let i = 0; i < times; i++) { Sound.fx[name](); await wait(gap); } }
// Bóp nhẹ theo chiều dọc rồi bật lại đúng kích thước gốc (không trôi khi bấm dồn dập)
function squeezeOnce(obj, base, k = 0.78) { Tweens.kill(obj.scale); obj.scale.set(base * 1.08, base * k, base * 1.08); return Tweens.to(obj.scale, { x: base, y: base, z: base }, 0.28, { ease: Ease.outBack }); }

// Bong bóng sôi lăn tăn trên mặt nước/nước kho (vài bán cầu tái sử dụng, không cấp phát mỗi khung hình)
function simmer(K, vessel, surface, { n = 8, size = 0.07, material, spread = 0.75 } = {}) {
  const m = material || glossy('#FFFFFF', 0.1, 0, { transparent: true, opacity: 0.55 }), list = [];
  for (let i = 0; i < n; i++) { const b = MD.mesh(MC.hemiGeo(), m); b.castShadow = false; b.visible = false; b.renderOrder = 3; vessel.add(b); list.push({ b, t: Math.random(), life: rnd(0.4, 0.9), s: size }); }
  let rate = 1, on = true;
  const off = K.onFrame(dt => {
    for (const q of list) {
      q.t += (dt * rate) / q.life;
      if (q.t >= 1) {
        q.t = 0; q.life = rnd(0.45, 0.95);
        if (!on || !surface.visible) { q.b.visible = false; continue; }
        const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * surface.scale.x * spread;
        q.b.position.set(Math.cos(a) * r, surface.position.y, Math.sin(a) * r); q.s = size * rnd(0.5, 1.3); q.b.visible = true;
      }
      const k = q.s * Math.sqrt(q.t); q.b.scale.set(k, k * 0.75, k);
    }
  });
  return { stop() { off(); list.forEach(q => vessel.remove(q.b)); }, set rate(v) { rate = v; }, set on(v) { on = v; } };
}

/* ═════════ 1. THỊT KHO TRỨNG ═════════ */
const TK = {
  stove1: V(-0.9, 0, 0), rawBowl: V(1.75, 0, -0.5), plate: V(1.45, 0, 0.85), peel: V(0.2, 0, 0.5), away: V(4.8, 0, 1.3),
  board: V(-0.75, 0, 0.45), pot: V(1.55, 0, 0.15), tray: V(-0.32, 0, 0.3), eggPlate: V(-0.5, 0, 0.62), stove2: V(0.15, 0, 0), serve: V(0.15, 0, 0.45),
};
const PLATE_EGGS = [[-0.42, 0.14, 0.35], [0.42, 0.14, -0.35], [0, -0.36, 1.3]];              // x, z, xoay — trứng nằm trên đĩa
const EGG_SPOTS = [[0.02, 0.36, -0.45, 0.1], [-0.4, 0.37, 0.28, 0.8], [0.4, 0.37, 0.3, -0.8]]; // trong nồi (theo nhóm thịt): x, y, z, xoay
const EGG_IN_POT = 0.9; // trứng trong nồi nhỏ lại chút cho vừa nồi
const CHUNK_SPOTS = [ // x, y, z, xoay x, y, z
  [-0.58, 0.12, -0.1, -0.35, 0.5, 0.25], [0.58, 0.12, -0.06, -0.3, -0.5, -0.25], [0.0, 0.1, 0.02, -0.25, 0.25, 0.05], [0.0, 0.12, 0.56, -0.45, 0.05, 0],
  [-0.42, 0.14, -0.46, 0.3, 0.9, 0.2], [0.44, 0.14, -0.44, 0.3, -0.8, -0.2], [-0.2, 0.3, -0.08, -0.4, 1.9, 0.35], [0.22, 0.3, -0.1, -0.35, 0.4, -0.4],
];
const SAUCE_A = new THREE.Color('#E3A85C'), SAUCE_B = new THREE.Color('#8A3A0C'), EGG_A = new THREE.Color('#FFFDF6'), EGG_B = new THREE.Color('#BC7432');

function thitKhoPot() {
  const pot = MC.clayPot();
  MD.fill(pot, glossy('#8A3A0C', 0.08), 0.38);
  const m = MC.porkMats('cooked'), meat = MD.put(pot, MD.group('meat'));
  CHUNK_SPOTS.forEach(L => { const c = MC.porkPiece(m); c.position.set(L[0], L[1], L[2]); c.rotation.set(L[3], L[4], L[5]); meat.add(c); });
  const eggM = glossy('#BC7432', 0.14);
  EGG_SPOTS.forEach((L, i) => {
    const e = i === 0 ? MC.peelEgg(eggM, false) : MC.eggHalf(eggM);
    e.position.set(L[0], L[1] + (i ? 0.03 : 0), L[2]); e.rotation.set(0, L[3], i ? 0 : Math.PI / 2); e.scale.setScalar(EGG_IN_POT); meat.add(e);
  });
  const sc = MC.scallionBits(16, 0.4); sc.position.y = 0.46; pot.add(sc);
  const pep = MD.garnish('tieu'); pep.position.set(0.1, 0.47, 0.05); pot.add(pep);
  return pot;
}
// Mảnh vỏ trứng rơi khỏi quả trứng xuống đĩa rồi biến mất
function shellFall(K, piece, center, floorY) {
  K.ws.attach(piece);
  const dir = piece.position.clone().sub(center).setY(0);
  if (dir.lengthSq() < 1e-4) dir.set(rnd(-1, 1), 0, rnd(-1, 1));
  const to = piece.position.clone().addScaledVector(dir.normalize(), rnd(0.3, 0.55)); to.y = floorY;
  Tweens.add(piece.rotation, { x: piece.rotation.x + rnd(-2.5, 2.5), z: piece.rotation.z + rnd(-2.5, 2.5) }, 0.5);
  arc(piece, to, 0.5, 0.25).then(() => wait(0.5)).then(() => popOut(piece, 0.3)).then(() => drop(piece));
}

const thitkho = {
  build(K) {
    const ws = { K };
    ws.whiteMat = own(new THREE.MeshStandardMaterial({ color: '#FFFDF6', roughness: 0.14 }));
    ws.pm = MC.porkMats('raw', true);
    ws.sauceMat = own(new THREE.MeshStandardMaterial({ color: '#C98A52', roughness: 0.2 }));
    K.stove.show(TK.stove1);
    ws.eggPot = add(K, MD.pot({ r: 0.8, h: 0.72 }), TK.stove1.clone().setY(0.4));
    ws.eggWater = MD.fill(ws.eggPot, liquid('#DDEFFF', 0.42), 0.6);
    ws.rawBowl = add(K, MD.bowl(0.85), TK.rawBowl);
    ws.eggs = [[-0.22, 0.42, 0.08, 0.3], [0.24, 0.42, 0.04, -0.4], [0.0, 0.66, -0.1, 1.4]].map(([x, y, z, ry]) => {
      const e = add(K, MC.peelEgg(ws.whiteMat), V(TK.rawBowl.x + x, y, TK.rawBowl.z + z)); e.rotation.set(0, ry, Math.PI / 2); return e;
    });
    ws.plate = add(K, MD.plate(0.8), TK.plate); ws.plate.children[0].material = glossy('#BFE6DC', 0.3, 0, { side: THREE.DoubleSide }); // đĩa màu bạc hà cho trứng trắng nổi bật
    return ws;
  },
  steps: [
    { type: 'adult', who: 'me', action: 'stove', voice: 'Bếp nóng lắm! Bé nhờ mẹ luộc trứng nhé!',
      setup(ws, K) { K.view(V(0.35, 0.6, 0.15), 5.2, 2.9); },
      async run(ws, K) {
        K.stove.fire(1); Sound.fx.click(); await wait(0.35);
        const inPot = [V(-0.3, 0.32, 0.18), V(0.3, 0.32, 0.18), V(0, 0.32, -0.3)];
        for (let i = 0; i < 3; i++) {
          const e = ws.eggs[i];
          await arc(e, worldOf(ws.eggPot, inPot[i].x, inPot[i].y, inPot[i].z), 0.45, 0.9); Sound.fx.splash(); fx(K, e, '#BFE6FF', 5);
        }
        popOut(ws.rawBowl);
        const bub = simmer(K, ws.eggPot, ws.eggWater, { n: 10, size: 0.08 });
        const st = K.steam(ws.eggPot, { rate: 7, size: 0.9, y: 0.85, spread: 0.8 });
        const jig = K.onFrame((dt, t) => { for (let i = 0; i < 3; i++) ws.eggs[i].rotation.x = Math.sin(t * 9 + i * 2) * 0.12; });
        for (let i = 0; i < 6; i++) { Sound.fx.boil(); await wait(0.45); }
        K.stove.fire(0); bub.stop(); jig(); st.rate = 3; ws.eggs.forEach(e => { e.rotation.x = 0; });
        await wait(0.3);
        K.say('Vớt trứng ra, chờ trứng nguội rồi mới bóc nhé!', true);
        for (let i = 0; i < 3; i++) {
          const [x, z, ry] = PLATE_EGGS[i];
          Tweens.add(ws.eggs[i].rotation, { y: ry }, 0.45);
          await arc(ws.eggs[i], V(TK.plate.x + x, 0.36, TK.plate.z + z), 0.45, 0.9); Sound.fx.pop();
        }
        st.stop(); await wait(0.9);
      } },

    { type: 'rub', target: ws => ws.plate, effect: 'flakes', flakeColor: '#E2B27E', amount: 2, voice: 'Trứng nguội rồi. Bé xoa xoa để bóc vỏ trứng nhé!',
      async setup(ws, K) {
        K.stove.hide(); popOut(ws.eggPot).then(() => drop(ws.eggPot, true)); drop(ws.rawBowl, true);
        ws.eggs.forEach(e => ws.plate.attach(e));
        ws.peelN = [0, 0, 0];
        K.view(TK.peel.clone().setY(0.35), 2.4, 1.9, 1.0);
        await moveTo(ws.plate, TK.peel, 0.5);
      },
      onProgress(ws, p) {
        const K = ws.K;
        for (let i = 0; i < 3; i++) {
          const egg = ws.eggs[i], sh = egg.userData.shell, want = Math.floor(Math.max(0, Math.min(1, p * 3.05 - i)) * sh.length);
          if (ws.peelN[i] >= want) continue;
          const c = egg.getWorldPosition(new THREE.Vector3());
          while (ws.peelN[i] < want) { shellFall(K, sh[ws.peelN[i]], c, 0.09); ws.peelN[i]++; if (ws.peelN[i] % 3 === 1) Sound.fx.crack(); }
          Tweens.add(egg.rotation, { y: egg.rotation.y + 0.35 }, 0.25);
          if (ws.peelN[i] === sh.length) { Sound.fx.pop(); fx(K, egg, '#FFFFFF', 10); K.say(`${countWord(i + 1)} quả trứng!`, true); }
        }
      },
      async done(ws, K) { ws.whiteMat.roughness = 0.1; fx(K, ws.plate, '#FFFFFF', 12); await wait(0.3); } },

    { type: 'adult', who: 'ba', action: 'cut', voice: 'Dao sắc lắm! Bé nhờ ba cắt thịt thành miếng nhé!',
      async setup(ws, K) {
        arc(ws.plate, TK.away, 0.6, 0.6);
        ws.board = add(K, MD.board(), TK.board); popIn(ws.board, 0.4, 0.8);
        ws.slab = add(K, MD.group('slab'), TK.board.clone().setY(0.112));
        [-0.16, 0.16].forEach(z => { const s = MC.porkPiece(ws.pm, 1.36, 0.3); s.position.z = z; ws.slab.add(s); });
        popIn(ws.slab);
        ws.pot = add(K, MC.clayPot(), TK.pot); ws.meat = MD.put(ws.pot, MD.group('meat'));
        ws.sauce = MD.fill(ws.pot, ws.sauceMat, 0);
        K.view(V(0.4, 0.45, 0.3), 4.6, 2.6, 0.95);
        await popIn(ws.pot);
      },
      async run(ws, K) {
        K.view(V(TK.board.x, 0.35, TK.board.z), 2.5, 1.7, 1.0); await wait(0.4);
        await chop(K, V(TK.board.x, 0.12, TK.board.z + 0.05), 3, 0.68);
        ws.chunks = [];
        for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) ws.chunks.push(add(K, MC.porkPiece(ws.pm), V(TK.board.x - 0.51 + c * 0.34, 0.112, TK.board.z - 0.16 + r * 0.32)));
        drop(ws.slab); Sound.fx.pop();
        await Promise.all(ws.chunks.map((ch, i) => moveTo(ch, ch.position.clone().add(V(((i % 4) - 1.5) * 0.1, 0, (Math.floor(i / 4) - 0.5) * 0.16)), 0.3)));
        fx(K, V(TK.board.x, 0.5, TK.board.z), '#FFFFFF', 10);
        K.say('Miếng thịt có bì, có mỡ, có nạc!', true);
        await wait(1.6);
        K.view(V(0.4, 0.5, 0.3), 4.6, 2.6, 0.95);
        await Promise.all(ws.chunks.map((ch, i) => after(i * 0.14, async () => {
          const L = CHUNK_SPOTS[i];
          Tweens.add(ch.rotation, { x: L[3], y: L[4], z: L[5] }, 0.4);
          await arc(ch, worldOf(ws.meat, L[0], L[1], L[2]), 0.4, 0.8); Sound.fx.pop(); ws.meat.attach(ch);
        })));
        fx(K, worldOf(ws.pot, 0, 0.6, 0), '#FFD34D', 8);
        await wait(0.3);
      } },

    { type: 'tap', count: 3, say: false, target: ws => ws.tray, voice: 'Ướp thịt nào! Chạm vào khay: hai thìa nước mắm, một thìa đường nhé!',
      async setup(ws, K) {
        popOut(ws.board).then(() => drop(ws.board, true));
        ws.tray = add(K, MC.tray(1.7, 1.0), TK.tray);
        ws.bottle = MD.put(ws.tray, MD.bottle()); ws.bottle.position.set(-0.42, 0.07, 0);
        ws.jar = MD.put(ws.tray, MD.sugarJar()); ws.jar.position.set(0.42, 0.07, 0);
        ws.spoonHome = worldOf(ws.pot, -0.3, 1.15, 0.3);
        ws.spoon = add(K, MD.spoon(), ws.spoonHome);
        ws.spoonSauce = MD.mesh(new THREE.CircleGeometry(0.14, 16).scale(1, 1.35, 1), glossy('#9C4A1A', 0.08), 0, -0.012, 0); ws.spoonSauce.rotation.x = -Math.PI / 2; ws.spoonSauce.visible = false; ws.spoon.add(ws.spoonSauce);
        ws.spoonSugar = MD.mesh(MC.hemiGeo(), glossy('#FFFFFF', 0.6), 0, -0.02, 0); ws.spoonSugar.visible = false; ws.spoon.add(ws.spoonSugar);
        ws.stream = pourStream(K, '#9C4A1A');
        ws.marN = 0; ws.anim = false;
        ws.bob = K.onFrame((dt, t) => {
          if (ws.anim) return;
          const o = ws.marN < 2 ? ws.bottle : ws.jar, other = o === ws.bottle ? ws.jar : ws.bottle;
          o.position.y = 0.07 + Math.abs(Math.sin(t * 3.2)) * 0.1; other.position.y = 0.07;
        });
        K.view(V(0.62, 0.65, 0.25), 3.9, 2.7);
        await Promise.all([popIn(ws.tray), popIn(ws.spoon, 0.4, 1.7)]);
      },
      async onTap(ws, n, count, K) {
        ws.anim = true; ws.marN = n; ws.bottle.position.y = ws.jar.position.y = 0.07;
        const S = ws.spoonHome;
        if (n <= 2) {
          const home = V(-0.42, 0.07, 0);
          await arc(ws.bottle, ws.tray.worldToLocal(S.clone().add(V(-1.2, 0.8, 0))), 0.45, 0.4);
          await Tweens.to(ws.bottle.rotation, { z: -2.0 }, 0.25);
          ws.stream.set(true, worldOf(ws.bottle, 0, 1.3, 0), S.clone().add(V(0, -0.01, 0))); Sound.fx.pour();
          await popIn(ws.spoonSauce, 0.35);
          ws.stream.set(false);
          Tweens.to(ws.bottle.rotation, { z: 0 }, 0.2).then(() => arc(ws.bottle, home, 0.4, 0.35));
          await tipSpoon(ws, K, ws.spoonSauce, '#9C4A1A', `${countWord(n)} thìa nước mắm!`);
        } else {
          const lid = ws.jar.children[2];
          await Tweens.to(lid.position, { x: 0.45, y: 1.0 }, 0.25);
          await arc(ws.spoon, worldOf(ws.jar, 0, 1.15, 0), 0.45, 0.4);
          await moveTo(ws.spoon, worldOf(ws.jar, 0, 0.6, 0), 0.2);
          ws.spoonSugar.scale.set(0.01, 0.01, 0.01); ws.spoonSugar.visible = true; Sound.fx.rub();
          Tweens.add(ws.spoonSugar.scale, { x: 0.13, y: 0.08, z: 0.18 }, 0.25);
          await moveTo(ws.spoon, worldOf(ws.jar, 0, 1.15, 0), 0.2);
          Tweens.add(lid.position, { x: 0, y: 0.75 }, 0.25);
          await arc(ws.spoon, S, 0.45, 0.4);
          await tipSpoon(ws, K, ws.spoonSugar, '#FFFFFF', 'Một thìa đường!');
        }
        MC.tintPork(ws.pm, 'raw', 'mari', n * 0.15);
        ws.sauce.userData.setLevel(n * 0.035);
        ws.anim = false;
      },
      async done(ws, K) { ws.bob(); ws.bottle.position.y = ws.jar.position.y = 0.07; drop(ws.stream.mesh, true); await popOut(ws.spoon); drop(ws.spoon); } },

    { type: 'stir', rounds: 3, radius: 0.4, toolY: 0.28, voice: 'Cầm đũa trộn đều cho thịt ngấm gia vị nào!',
      center: ws => worldOf(ws.pot, 0, 0.4, 0), tool: ws => ws.sticks,
      setup(ws, K) {
        K.view(TK.pot.clone().setY(0.45), 2.6, 2.1, 1.05);
        ws.sticks = add(K, MD.chopsticks(), worldOf(ws.pot, 0, 0.68, 0)); ws.sticks.rotation.x = 0.35; popIn(ws.sticks);
      },
      onProgress(ws, p) {
        MC.tintPork(ws.pm, 'raw', 'mari', 0.45 + 0.55 * p);
        ws.meat.rotation.y = Math.sin(p * Math.PI * 3) * 0.35; ws.meat.position.y = Math.abs(Math.sin(p * 40)) * 0.03;
      },
      async done(ws, K) { ws.meat.position.y = 0; ws.meat.rotation.y = 0; await popOut(ws.sticks); drop(ws.sticks, true); fx(K, worldOf(ws.pot, 0, 0.5, 0), '#FFFFFF', 10); } },

    { type: 'drag', liftY: 1.1, voice: 'Kéo từng quả trứng vào nồi thịt nhé!',
      items: ws => ws.eggs.map(o => ({ obj: o, name: 'trứng' })),
      target: ws => ({ pos: ws.pot.position.clone().setY(0.4), r: 1.2 }),
      async setup(ws, K) {
        popOut(ws.tray).then(() => drop(ws.tray));
        K.view(V(0.55, 0.45, 0.4), 4.2, 2.4, 0.95);
        await arc(ws.plate, TK.eggPlate, 0.7, 0.9);
        ws.eggs.forEach(e => K.ws.attach(e));
      },
      async place(ws, it, n, K) {
        const L = EGG_SPOTS[n - 1];
        ws.meat.attach(it.obj);
        Tweens.add(it.obj.rotation, { x: 0, y: L[3], z: Math.PI / 2 }, 0.35);
        Tweens.add(it.obj.scale, { x: EGG_IN_POT, y: EGG_IN_POT, z: EGG_IN_POT }, 0.35);
        await moveTo(it.obj, V(L[0], L[1], L[2]), 0.35);
        Sound.fx.pop(); fx(K, it.obj, '#FFD34D', 6);
      } },

    { type: 'adult', who: 'me', action: 'stove', voice: 'Bé nhờ mẹ kho thịt lửa nhỏ thật lâu nhé!',
      async setup(ws, K) { popOut(ws.plate); K.view(V(0.8, 0.55, 0.2), 4.2, 2.6); },
      async run(ws, K, env) {
        K.stove.show(TK.stove2); await wait(0.4);
        await arc(ws.pot, TK.stove2.clone().setY(0.4), 0.6, 0.8); Sound.fx.pop();
        K.view(V(TK.stove2.x - 0.35, 0.9, 0.15), 3.8, 2.7, 0.95);
        // nước dừa tươi cho nước kho ngọt thanh
        ws.coco = add(K, MC.greenCoconut(), V(-2.0, 0, 0.6)); await popIn(ws.coco);
        await arc(ws.coco, V(TK.stove2.x - 1.15, 1.3, 0.15), 0.5, 0.5);
        await Tweens.to(ws.coco.rotation, { z: -1.8 }, 0.3);
        const stream = pourStream(K, '#EEF2DC');
        K.say('Mẹ đổ nước dừa vào nồi!', true); sounds('pour', 5, 0.25);
        await tweenNum(0.1, 0.4, 1.3, v => { ws.sauce.userData.setLevel(v); stream.set(true, wp(ws.coco, 0, 0.95, 0, A), wp(ws.pot, 0.1, ws.sauce.position.y, 0, B)); });
        stream.set(false); drop(stream.mesh, true);
        await Tweens.to(ws.coco.rotation, { z: 0 }, 0.2);
        arc(ws.coco, V(-2.0, 0, 0.6), 0.4, 0.4).then(() => popOut(ws.coco));
        // lửa nhỏ, kho thật lâu: nước kho sẫm dần thành màu cánh gián
        K.stove.fire(0.4); Sound.fx.click();
        K.say('Lửa nhỏ thôi, kho thật lâu cho thịt mềm nhé!', true);
        const bub = simmer(K, ws.pot, ws.sauce, { n: 7, size: 0.075, material: ws.sauceMat, spread: 0.7 });
        bub.rate = 0.55;
        const st = K.steam(ws.pot, { rate: 4, size: 0.85, y: 0.9, spread: 0.7 });
        const SECS = 6; env.timer(SECS);
        let tick = 0;
        await tweenNum(0, 1, SECS, t => {
          ws.sauceMat.color.lerpColors(SAUCE_A, SAUCE_B, t); ws.sauceMat.roughness = 0.2 - 0.12 * t;
          MC.tintPork(ws.pm, 'mari', 'cooked', t);
          ws.whiteMat.color.lerpColors(EGG_A, EGG_B, Math.min(1, t * 1.15));
          ws.sauce.userData.setLevel(0.4 - 0.05 * t);
          if (t * 6 > tick) { tick++; Sound.fx.boil(); }
        }, { ease: Ease.linear });
        env.timer(null);
        K.stove.fire(0); bub.stop(); st.rate = 5;
        K.say('Nước kho màu cánh gián rồi, thơm quá!', true);
        await arc(ws.pot, TK.serve, 0.6, 0.6); K.stove.hide();
        K.view(V(TK.serve.x, 0.6, TK.serve.z), 2.8, 2.2, 1.0);
        // bổ đôi hai quả trứng cho thấy lòng đỏ, rắc hành lá và tiêu
        for (const i of [1, 2]) {
          const e = ws.eggs[i], h = MC.eggHalf(ws.whiteMat), L = EGG_SPOTS[i];
          h.position.set(e.position.x, L[1] + 0.03, e.position.z); h.rotation.y = e.rotation.y; ws.meat.add(h); e.visible = false;
          Sound.fx.pop(); popIn(h, 0.35, EGG_IN_POT); fx(K, h, '#FFD34D', 6); await wait(0.25);
        }
        const sc = MC.scallionBits(16, 0.4); sc.position.y = 0.46; ws.pot.add(sc); popIn(sc, 0.4);
        const pep = MD.garnish('tieu'); pep.position.set(0.1, 0.47, 0.05); ws.pot.add(pep); popIn(pep, 0.4);
        Sound.fx.yum();
        await wait(1.0);
      } },
  ],
  reveal: ws => ws.pot,
  final: () => thitKhoPot(),
};
// Thìa nghiêng rót gia vị vào nồi, giọt rơi xuống thịt
async function tipSpoon(ws, K, content, color, sayText) {
  await Tweens.to(ws.spoon.rotation, { z: -1.2 }, 0.2);
  content.visible = false;
  K.say(sayText, true);
  const drop1 = MD.mesh(MC.hemiGeo(), glossy(color, 0.2)); drop1.scale.setScalar(0.06); drop1.position.copy(worldOf(ws.spoon, 0.1, 0, 0)); K.ws.add(drop1);
  await Tweens.to(drop1.position, { x: ws.pot.position.x - 0.05, y: 0.45, z: ws.pot.position.z + 0.1 }, 0.3, { ease: Ease.inQuad });
  drop(drop1); color === '#FFFFFF' ? Sound.fx.pour() : Sound.fx.splash();
  fx(K, worldOf(ws.pot, 0, 0.5, 0), color === '#FFFFFF' ? '#FFFFFF' : '#FFB347', 6);
  await Tweens.to(ws.spoon.rotation, { z: 0 }, 0.2);
}

/* ═════════ 2. CHÈ CHUỐI ═════════ */
const CH = { board: V(-0.35, 0, 0.5), stove: V(1.8, 0, -0.05), bowl: V(-0.9, 0, 0.85), cocoHome: V(3.6, 0, 0.9), pearlHome: V(0.1, 0, 1.1) };
const BAN_YAW = 0.55, KNIFE_S = 0.8; // quả chuối nằm chéo để dao nhựa (cắt ngang quả) quay mặt về phía bé
const KNIFE_REST = { pos: V(CH.board.x - 0.25, 0.135, CH.board.z + 0.58), rot: [-Math.PI / 2, 0.15, 0] };
const FLESH_A = new THREE.Color('#FBE3A0'), FLESH_B = new THREE.Color('#F4BA5C'), CHE_A = new THREE.Color('#FFFAF0'), CHE_B = new THREE.Color('#F1DAAE');
const CHE_G = ['dauphong', 'me'].map(key => ({ key, name: MC.GARNISH_C_NAMES[key], make: () => MC.garnishC(key) }));
const BOWL_BAN = [[-0.32, 0.12, 0.6], [0.3, 0.2, 2.2], [0.02, -0.3, 1.2], [-0.12, 0.42, 2.9], [0.4, -0.18, 0.2]]; // x, z, xoay trong bát chè

function cheBowl() {
  const b = MD.bowl(1);
  const surf = MD.fill(b, glossy('#F1DAAE', 0.26), 0.82), y = surf.position.y;
  const m = glossy('#F4BA5C', 0.3);
  [...BOWL_BAN, [-0.45, -0.3, 1.9], [0.5, 0.25, 0.9]].forEach(([x, z, r], i) => { const c = MC.bananaChunk(m); c.position.set(x * 1.05, y + 0.01, z * 1.05); c.rotation.set(Math.PI / 2 + rnd(-0.4, 0.4), r, rnd(-0.3, 0.3)); if (i === 3 || i === 6) c.rotation.set(0.25, r, 0.1); b.add(c); });
  const sw = MC.creamSwirl(0.5); sw.position.y = y + 0.005; b.add(sw);
  const pe = MC.pearls(56, 0.68, y + 0.01); b.add(pe);
  [[0.1, 0.05, 'dauphong'], [-0.35, -0.2, 'dauphong'], [0.35, -0.3, 'dauphong'], [-0.1, 0.35, 'me'], [0.3, 0.3, 'me'], [-0.3, 0.05, 'me'], [0.05, -0.35, 'me']].forEach(([x, z, k]) => {
    const g = MC.garnishC(k); g.position.set(x, y + 0.05, z); b.add(g);
  });
  return b;
}

const che = {
  build(K) {
    // steps.js (bước 'slice') gọi ws.add / ws.remove để gắn vòng gợi ý → chuyển tiếp sang K.ws
    const ws = { K, add: o => K.ws.add(o), remove: o => K.ws.remove(o) };
    ws.flesh = own(new THREE.MeshStandardMaterial({ color: '#FBE3A0', roughness: 0.42 }));
    ws.board = add(K, MD.board(), CH.board); ws.board.scale.setScalar(0.85);
    ws.banana = add(K, MC.banana(ws.flesh), V(CH.board.x, 0.6, CH.board.z)); ws.banana.rotation.y = BAN_YAW;
    ws.strips = 0; ws.peelBits = [];
    return ws;
  },
  steps: [
    { type: 'rub', target: ws => ws.banana, effect: 'flakes', flakeColor: '#FFE066', amount: 0.9, voice: 'Bé xoa xoa để bóc vỏ chuối nào!',
      setup(ws, K) { K.view(V(CH.board.x, 0.45, CH.board.z), 3.0, 2.0, 0.9); },
      onProgress(ws, p) {
        const u = ws.banana.userData, n = u.setPeel(p), K = ws.K;
        // dải vỏ nào mở hẳn thì rơi xuống thớt
        while (ws.strips < n) {
          const k = u.ORDER[ws.strips++], pv = u.pivots[k]; u.detached.add(k);
          K.ws.attach(pv); ws.peelBits.push(pv);
          const side = k === 0 || k === 3 ? 1 : -1, to = pv.position.clone().add(V(rnd(-0.2, 0.2), 0, side * rnd(0.35, 0.5))); to.y = 0.14;
          Tweens.add(pv.rotation, { x: pv.rotation.x + side * 0.6, z: pv.rotation.z + rnd(-0.4, 0.4) }, 0.45);
          arc(pv, to, 0.45, 0.25); Sound.fx.snip(); fx(K, pv, '#FFE066', 5);
        }
      },
      async done(ws, K) {
        const peel = ws.banana.userData.peel; K.ws.attach(peel);
        Sound.fx.whoosh();
        await arc(peel, peel.position.clone().add(V(0.9, -0.42, -0.45)), 0.45, 0.3);
        await moveTo(ws.banana, V(CH.board.x, 0.305, CH.board.z), 0.35);
        Sound.fx.pop(); fx(K, ws.banana, '#FFF3B0', 10);
        await wait(0.4);
        [peel, ...ws.peelBits].forEach(o => popOut(o, 0.35).then(() => drop(o, true)));
      } },

    { type: 'slice', sound: 'whoosh', voice: 'Đây là dao nhựa của bé. Chạm vào vạch hồng để cắt chuối nhé!',
      points: ws => ws.banana.userData.cuts.map((c, i) => ws.banana.userData.cutPoint(i)),
      async setup(ws, K) {
        ws.knife = add(K, MC.kidKnife(), KNIFE_REST.pos); ws.knife.rotation.set(...KNIFE_REST.rot);
        K.view(V(CH.board.x, 0.3, CH.board.z + 0.1), 2.8, 2.0, 1.0);
        await popIn(ws.knife, 0.45, KNIFE_S);
        fx(K, ws.knife, '#7FD8FF', 8);
      },
      // bé chạm nhanh nhiều vạch thì dao cắt lần lượt từng vạch (xếp hàng, không bỏ sót nhát nào)
      onCut(ws, i, n, K) {
        ws.cutQ = (ws.cutQ || Promise.resolve()).then(async () => {
          const p = ws.banana.userData.cutPoint(i), kn = ws.knife, h = KNIFE_S * 0.5;
          // lưỡi dao vuông góc với quả chuối, cán hướng về phía bé
          const b = V(Math.sin(BAN_YAW), 0, Math.cos(BAN_YAW)), at = p.clone().addScaledVector(b, h);
          Tweens.add(kn.rotation, { x: 0, y: BAN_YAW + Math.PI / 2, z: 0 }, 0.16);
          await moveTo(kn, V(at.x, p.y + 0.4, at.z), 0.16);
          await Tweens.to(kn.position, { y: 0.125 }, 0.1, { ease: Ease.inQuad }); Sound.fx.chop();
          const offs = ws.banana.userData.split(i);
          ws.banana.userData.segs.forEach((s, k) => { Tweens.kill(s.position); Tweens.add(s.position, { x: s.userData.x0 + offs[k] }, 0.2); });
          fx(K, p, '#FFFFFF', 5);
          await Tweens.to(kn.position, { y: p.y + 0.4 }, 0.14);
        });
        return ws.cutQ;
      },
      async done(ws, K) {
        Tweens.add(ws.knife.rotation, { x: KNIFE_REST.rot[0], y: KNIFE_REST.rot[1], z: 0 }, 0.3);
        await moveTo(ws.knife, KNIFE_REST.pos, 0.3);
        ws.banana.userData.segs.forEach((s, k) => { if (k > 0 && k < 4) Tweens.add(s.rotation, { x: rnd(-0.4, 0.4) }, 0.3); });
        fx(K, ws.banana, '#FFF3B0', 10);
        K.say('Chuối mềm nên bé cắt bằng dao nhựa được!', true);
        await wait(0.4);
      } },

    { type: 'adult', who: 'me', action: 'stove', voice: 'Bếp nóng lắm! Bé nhờ mẹ nấu chuối với nước cốt dừa nhé!',
      async setup(ws, K) {
        popOut(ws.knife).then(() => drop(ws.knife, true));
        K.stove.show(CH.stove);
        ws.pot = add(K, MD.pot({ r: 0.9, h: 0.8 }), CH.stove.clone().setY(0.4));
        ws.cheMat = own(new THREE.MeshStandardMaterial({ color: '#FFFAF0', roughness: 0.26 }));
        ws.che = MD.fill(ws.pot, ws.cheMat, 0);
        ws.potPearls = MC.pearls(70, 0.62, 0); ws.potPearls.count = 0; ws.pot.add(ws.potPearls);
        K.view(V(1.0, 0.7, 0.3), 4.6, 2.8);
        await popIn(ws.pot);
      },
      async run(ws, K) {
        K.stove.fire(0.8); Sound.fx.click(); await wait(0.3);
        // nước cốt dừa
        ws.coco = add(K, MC.coconutHalf(), CH.cocoHome); await popIn(ws.coco);
        await arc(ws.coco, V(CH.stove.x + 1.05, 1.35, CH.stove.z + 0.1), 0.5, 0.5);
        await Tweens.to(ws.coco.rotation, { z: 1.7 }, 0.3);
        const stream = pourStream(K, '#FFFBF2');
        K.say('Nước cốt dừa trắng béo!', true); sounds('pour', 5, 0.25);
        await tweenNum(0, 0.6, 1.3, v => {
          ws.che.userData.setLevel(v); ws.coco.userData.milk.scale.setScalar(Math.max(0.01, 1 - v * 1.4));
          stream.set(true, wp(ws.coco, -0.42, 0.44, 0, A), wp(ws.pot, 0.2, ws.che.position.y, 0, B));
        });
        stream.set(false); drop(stream.mesh, true);
        await Tweens.to(ws.coco.rotation, { z: 0 }, 0.2);
        arc(ws.coco, CH.cocoHome, 0.4, 0.4).then(() => popOut(ws.coco));
        // chuối vào nồi
        const y = ws.che.position.y, segs = ws.banana.userData.segs;
        await Promise.all(segs.map((s, i) => after(i * 0.12, async () => {
          K.ws.attach(s); const a = (i / 5) * Math.PI * 2 + 0.3;
          Tweens.add(s.rotation, { y: s.rotation.y + rnd(-1.5, 1.5) }, 0.45);
          await arc(s, worldOf(ws.pot, Math.cos(a) * 0.42, y - 0.02, Math.sin(a) * 0.42), 0.45, 0.8);
          ws.pot.attach(s); Sound.fx.splash();
        })));
        // trân châu
        ws.pearlBowl = add(K, MD.bowl(0.42), CH.pearlHome); ws.pearlBowl.add(MC.pearls(26, 0.3, 0.2));
        await popIn(ws.pearlBowl, 0.35, 0.42);
        await arc(ws.pearlBowl, V(CH.stove.x - 0.9, 1.3, CH.stove.z + 0.2), 0.45, 0.5);
        await Tweens.to(ws.pearlBowl.rotation, { z: -1.6 }, 0.25);
        ws.potPearls.position.y = y + 0.01; Sound.fx.pour();
        await tweenNum(0, 70, 0.6, v => { ws.potPearls.count = Math.round(v); });
        fx(K, worldOf(ws.pot, 0, y + 0.1, 0), '#FFFFFF', 8);
        await Tweens.to(ws.pearlBowl.rotation, { z: 0 }, 0.2);
        popOut(ws.pearlBowl).then(() => drop(ws.pearlBowl));
        // nấu sôi, khuấy nhẹ
        ws.ladle = add(K, MC.ladle(), worldOf(ws.pot, 0.3, y + 0.05, 0)); ws.ladle.scale.setScalar(1.25); popIn(ws.ladle, 0.3, 1.25);
        const bub = simmer(K, ws.pot, ws.che, { n: 9, size: 0.07, material: ws.cheMat });
        ws.potSteam = K.steam(ws.pot, { rate: 6, size: 0.9, y: 0.9, spread: 0.8 });
        const base = segs.map(s => s.position.y);
        await tweenNum(0, 1, 2.6, t => {
          const a = t * Math.PI * 4;
          wp(ws.pot, Math.cos(a) * 0.35, y + 0.05, Math.sin(a) * 0.3, ws.ladle.position);
          ws.flesh.color.lerpColors(FLESH_A, FLESH_B, t); ws.cheMat.color.lerpColors(CHE_A, CHE_B, t);
          for (let i = 0; i < segs.length; i++) segs[i].position.y = base[i] + Math.sin(t * 20 + i) * 0.015;
        }, { ease: Ease.linear });
        sounds('boil', 3, 0.3);
        K.stove.fire(0); bub.rate = 0.4;
        await wait(0.6); bub.stop();
      } },

    { type: 'adult', who: 'ba', action: 'hot', voice: 'Chè nóng lắm! Bé nhờ ba múc chè ra bát nhé!',
      async setup(ws, K) {
        popOut(ws.board).then(() => drop(ws.board, true)); drop(ws.banana);
        ws.bowl = add(K, MD.bowl(1.1), CH.bowl);
        ws.bowlChe = MD.fill(ws.bowl, glossy('#F1DAAE', 0.26), 0);
        ws.bowlPearls = MC.pearls(44, 0.62, 0); ws.bowlPearls.count = 0; ws.bowl.add(ws.bowlPearls);
        K.view(V(0.45, 0.65, 0.4), 4.8, 2.8);
        await popIn(ws.bowl, 0.4, 1.1);
      },
      async run(ws, K) {
        const segs = ws.banana.userData.segs, y = ws.che.position.y, lad = ws.ladle, content = lad.userData.content;
        content.material = ws.cheMat;
        for (let k = 0; k < 2; k++) {
          await moveTo(lad, worldOf(ws.pot, 0.15, y + 0.03, 0.1), 0.3); Sound.fx.splash(); content.visible = true;
          const carry = k ? segs.slice(3) : segs.slice(0, 3);
          carry.forEach(s => { s.visible = false; });
          await arc(lad, worldOf(ws.bowl, 0.3, 0.95, 0.05), 0.65, 0.8);
          await Tweens.to(lad.rotation, { z: 1.25 }, 0.25);
          content.visible = false; Sound.fx.pour();
          const lv = ws.bowlChe.userData.level;
          tweenNum(Math.max(0, lv), k ? 0.82 : 0.55, 0.5, v => ws.bowlChe.userData.setLevel(v));
          await wait(0.3);
          const by = 0.16 + 0.41 * (k ? 0.82 : 0.55);
          carry.forEach((s, j) => {
            const [x, z, r] = BOWL_BAN[k ? 3 + j : j];
            ws.bowl.add(s); s.position.set(x, by, z); s.rotation.set(rnd(-0.3, 0.3), r, rnd(-0.2, 0.2)); popIn(s, 0.3, 1 / 1.1);
          });
          ws.bowlPearls.position.y = by + 0.012; ws.bowlPearls.count = k ? 44 : 24;
          await Tweens.to(lad.rotation, { z: 0 }, 0.2);
          ws.bowlPearls.position.y = 0.16 + 0.41 * ws.bowlChe.userData.level + 0.012;
        }
        ws.bowlPearls.position.y = 0.16 + 0.41 * 0.82 + 0.012;
        const sw = MC.creamSwirl(0.5); sw.position.y = 0.16 + 0.41 * 0.82 + 0.005; ws.bowl.add(sw); popIn(sw, 0.4);
        await arc(lad, worldOf(ws.pot, 0.3, y + 0.05, 0), 0.5, 0.5);
        popOut(lad);
        K.steam(ws.bowl, { rate: 5, size: 0.75, y: 0.65, spread: 0.6 });
        fx(K, worldOf(ws.bowl, 0, 0.6, 0), '#FFFFFF', 10);
        await wait(0.5);
      } },

    { type: 'decorate', min: 4, garnishes: CHE_G, voice: 'Chọn đậu phộng, hạt mè rồi chạm lên bát chè để rắc nhé!',
      surface: ws => ws.bowlChe,
      setup(ws, K) {
        K.stove.hide(); popOut(ws.pot); K.stopSteam();
        K.steam(ws.bowl, { rate: 4, size: 0.7, y: 0.65, spread: 0.6 });
        K.view(CH.bowl.clone().setY(0.45), 2.3, 2.0, 1.12);
      } },
  ],
  reveal: ws => ws.bowl,
  final: () => cheBowl(),
};

/* ═════════ 3. PHỞ BÒ ═════════ */
const PH = { stove: V(-2.1, 0, -0.45), spices: V(-0.1, 0, 0.6), bowl: V(0.75, 0, 0.6), side: V(2.85, 0, 0.75) };
const BROTH_A = new THREE.Color('#E8CC8E'), BROTH_B = new THREE.Color('#CC8A26');
const PHO_G = ['hanh', 'ngo'].map(key => ({ key, name: MC.GARNISH_C_NAMES[key], make: () => MC.garnishC(key) }));
const BEEF_SPOTS = [[-0.22, 0.47, 0.16, 0.45, 0.12], [0.24, 0.47, 0.14, -0.5, 0.1], [-0.06, 0.49, -0.2, 1.5, -0.12], [0.32, 0.45, -0.24, 2.4, -0.1]]; // x, y, z, xoay, nghiêng (trong tô)
const PHO_TINT = '#DDE9F3'; // lòng tô men xanh nhạt cho sợi phở trắng nổi bật
const TOP_Y = 0.52, BROTH_LV = 0.68; // mặt rắc hành & mức nước dùng trong tô (toạ độ tô)
const HERBS = [[-0.5, 0.52, 0.25, 2.2, '#2E9A48'], [-0.55, 0.5, -0.12, 1.4, '#35A852']], CHILI = [[0.15, 0.2], [-0.2, 0.05], [0.35, 0.25]];

function phoBowl() {
  const b = MD.bowl(1.25, { tint: PHO_TINT });
  const nd = MC.noodleBundle(); nd.position.y = 0.19; nd.scale.set(1.2, 1.0, 1.2); b.add(nd);
  const bm = MC.beefMat(true);
  BEEF_SPOTS.forEach(L => { const s = MC.beefSlice(bm); s.position.set(L[0], L[1], L[2]); s.rotation.set(L[4], L[3], 0); s.scale.setScalar(0.8); b.add(s); });
  const br = MD.fill(b, liquid('#C98A2E', 0.84), BROTH_LV); br.add(MC.brothDots(14));
  [[-0.35, 0.3, 'hanh'], [0.1, 0.38, 'hanh'], [0.4, -0.05, 'hanh'], [-0.15, -0.4, 'hanh'], [0.0, 0.0, 'ngo'], [-0.42, -0.1, 'ngo'], [0.25, -0.38, 'ngo']].forEach(([x, z, k]) => {
    const g = MC.garnishC(k); g.position.set(x, TOP_Y, z); b.add(g);
  });
  HERBS.forEach(([x, y, z, r, c]) => { const h = MC.herbSprig(c); h.position.set(x, y, z); h.rotation.y = r; h.scale.setScalar(0.85); b.add(h); });
  CHILI.forEach(([x, z]) => { const o = MD.garnish('ot'); o.position.set(x, TOP_Y - 0.01, z); o.scale.setScalar(0.62); b.add(o); });
  const li = MC.limeWedge(); li.position.set(0.66, 0.6, 0.38); li.rotation.set(0.2, -0.6, 0.35); b.add(li);
  return b;
}

const pho = {
  build(K) {
    const ws = { K };
    K.stove.show(PH.stove);
    ws.pot = add(K, MD.pot({ r: 1.0, h: 1.0 }), PH.stove.clone().setY(0.4));
    ws.brothMat = own(new THREE.MeshStandardMaterial({ color: '#E6C487', roughness: 0.08, transparent: true, opacity: 0.86, depthWrite: false }));
    ws.potBroth = MD.fill(ws.pot, ws.brothMat, 0.72);
    ws.spicePlate = add(K, MD.plate(0.62), PH.spices);
    ws.que = add(K, MC.cinnamon(), V(PH.spices.x - 0.35, 0.06, PH.spices.z - 0.15));
    ws.hoi = add(K, MC.starAnise(), V(PH.spices.x + 0.38, 0.05, PH.spices.z - 0.12));
    ws.gung = add(K, MC.ginger(), V(PH.spices.x, 0.05, PH.spices.z + 0.32));
    return ws;
  },
  steps: [
    { type: 'adult', who: 'ba', action: 'stove', voice: 'Bếp nóng lắm! Bé nhờ ba ninh nước dùng với quế, hồi, gừng nhé!',
      setup(ws, K) { K.view(V(-1.25, 0.75, 0.1), 3.9, 2.6); },
      async run(ws, K) {
        K.stove.fire(1); Sound.fx.click();
        ws.potSteam = K.steam(ws.pot, { rate: 4, size: 1.0, y: 1.1, spread: 0.9 });
        ws.potBub = simmer(K, ws.pot, ws.potBroth, { n: 10, size: 0.08, material: ws.brothMat });
        await wait(0.5);
        const sy = ws.potBroth.position.y, items = [[ws.que, 'Quế thơm!', V(-0.35, 0, 0.25)], [ws.hoi, 'Hoa hồi!', V(0.35, 0, -0.05)], [ws.gung, 'Gừng nướng!', V(-0.05, 0, -0.4)]];
        ws.floaters = [];
        for (const [o, name, off] of items) {
          K.say(name, true); fx(K, o, '#FFD34D', 8);
          await Tweens.to(o.scale, { x: 1.3, y: 1.3, z: 1.3 }, 0.18); await Tweens.to(o.scale, { x: 1, y: 1, z: 1 }, 0.25, { ease: Ease.outBack });
          Tweens.add(o.rotation, { y: o.rotation.y + 1.5 }, 0.6);
          await arc(o, worldOf(ws.pot, off.x, sy + 0.01, off.z), 0.6, 1.1);
          Sound.fx.splash(); fx(K, o, '#BFE6FF', 5); ws.pot.attach(o); ws.floaters.push(o);
          await wait(0.55);
        }
        const fy = ws.floaters.map(o => o.position.y);
        ws.bob = K.onFrame((dt, t) => { for (let i = 0; i < fy.length; i++) ws.floaters[i].position.y = fy[i] + Math.sin(t * 2.4 + i * 2) * 0.02; });
        K.say('Nước dùng thơm lừng cả bếp!', true);
        popOut(ws.spicePlate);
        ws.potSteam.rate = 9;
        sounds('boil', 5, 0.45);
        await tweenNum(0, 1, 2.4, t => { ws.brothMat.color.lerpColors(BROTH_A, BROTH_B, t); ws.brothMat.opacity = 0.86 - 0.08 * t; }, { ease: Ease.linear });
        K.stove.fire(0.35); ws.potBub.rate = 0.5; ws.potSteam.rate = 4;
        await wait(0.8);
      } },

    { type: 'drag', liftY: 1.2, voice: 'Kéo bánh phở vào tô nhé!',
      items: ws => [{ obj: ws.noodles, name: 'bánh phở' }],
      target: ws => ({ pos: PH.bowl.clone().setY(0.6), r: 1.35 }),
      async setup(ws, K) {
        drop(ws.spicePlate, true);
        ws.bowl = add(K, MD.bowl(1.25, { tint: PHO_TINT }), PH.bowl);
        ws.sideBoard = add(K, MD.board(), PH.side); // thớt gỗ làm nền cho bánh phở trắng, thịt bò đỏ nổi bật
        ws.noodles = add(K, MC.noodleBundle(), PH.side.clone().setY(0.1));
        K.view(V(1.8, 0.4, 0.65), 4.1, 2.4, 0.95);
        await Promise.all([popIn(ws.bowl, 0.4, 1.25), popIn(ws.sideBoard, 0.4, 0.62), popIn(ws.noodles)]);
      },
      async place(ws, it) {
        ws.bowl.attach(it.obj);
        Tweens.add(it.obj.scale, { x: 1.2, y: 1.0, z: 1.2 }, 0.35);
        Tweens.add(it.obj.rotation, { y: 0.4 }, 0.35);
        await moveTo(it.obj, V(0, 0.19, 0), 0.35);
        Sound.fx.pop(); fx(ws.K, worldOf(ws.bowl, 0, 0.5, 0), '#FFFFFF', 8);
      } },

    { type: 'drag', liftY: 1.2, voice: 'Xếp thịt bò lên trên bánh phở nào!',
      items: ws => ws.beef.map(o => ({ obj: o, name: 'thịt bò' })),
      target: ws => ({ pos: PH.bowl.clone().setY(0.6), r: 1.35 }),
      async setup(ws, K) {
        ws.beefMat = MC.beefMat(false);
        ws.beef = [[-0.34, -0.2, 0.3], [0.34, -0.2, -0.3], [-0.34, 0.24, 2.8], [0.34, 0.24, 1.9]].map(([dx, dz, ry], i) => {
          const b = add(K, MC.beefSlice(ws.beefMat), V(PH.side.x + dx, 0.11 + i * 0.006, PH.side.z + dz)); b.rotation.y = ry; return b;
        });
        K.view(V(1.8, 0.4, 0.65), 4.1, 2.4, 0.95);
        await Promise.all(ws.beef.map((b, i) => after(i * 0.08, () => popIn(b, 0.35))));
      },
      async place(ws, it, n) {
        const L = BEEF_SPOTS[n - 1];
        ws.bowl.attach(it.obj);
        Tweens.add(it.obj.rotation, { x: L[4], y: L[3], z: 0 }, 0.3);
        await moveTo(it.obj, V(L[0], L[1], L[2]), 0.3);
        Sound.fx.pop();
      } },

    { type: 'decorate', min: 4, garnishes: PHO_G, voice: 'Chọn hành lá, rau ngò rồi chạm lên tô phở để rắc nhé!',
      surface: ws => ws.topSurf,
      setup(ws, K) {
        ws.topSurf = MD.mesh(new THREE.CircleGeometry(0.74, 32), MC.hitMat(), 0, TOP_Y, 0); ws.topSurf.rotation.x = -Math.PI / 2; ws.bowl.add(ws.topSurf);
        K.view(V(PH.bowl.x, 0.55, PH.bowl.z), 2.6, 2.2, 1.12);
      } },

    { type: 'adult', who: 'me', action: 'hot', voice: 'Nước dùng nóng lắm! Bé nhờ mẹ chan nước dùng nhé!',
      setup(ws, K) { K.view(V(-0.55, 0.9, 0.1), 4.9, 3.0); },
      async run(ws, K) {
        ws.bowlBroth = MD.fill(ws.bowl, liquid('#C98A2E', 0.84), 0);
        const lad = add(K, MC.ladle(), worldOf(ws.pot, 0.4, 1.5, 0.2)), content = lad.userData.content, sy = ws.potBroth.position.y;
        lad.scale.setScalar(1.3); content.material = ws.brothMat;
        await popIn(lad, 0.3, 1.3);
        const stream = pourStream(K, '#CC8A26');
        for (let k = 0; k < 3; k++) {
          await moveTo(lad, worldOf(ws.pot, 0.25, sy + 0.04, 0.1), 0.3); Sound.fx.splash(); content.visible = true;
          await arc(lad, worldOf(ws.bowl, 0.3, 0.95, 0.05), 0.65, 0.8);
          await Tweens.to(lad.rotation, { z: 1.2 }, 0.22);
          content.visible = false; Sound.fx.pour();
          const from = ws.bowlBroth.userData.level < 0 ? 0 : ws.bowlBroth.userData.level, to = BROTH_LV * (k + 1) / 3;
          await tweenNum(from, to, 0.5, v => {
            ws.bowlBroth.userData.setLevel(v);
            stream.set(true, wp(lad, -0.22, 0.02, 0, A), wp(ws.bowl, 0.05, 0.16 + 0.41 * v, 0, B));
            ws.beefMat.color.lerpColors(MC.BEEF_RAW, MC.BEEF_COOKED, (k + (v - from) / (to - from)) / 3);
          });
          stream.set(false);
          await Tweens.to(lad.rotation, { z: 0 }, 0.2);
        }
        drop(stream.mesh, true);
        ws.bowlBroth.add(MC.brothDots(14));
        K.steam(ws.bowl, { rate: 10, size: 1.1, y: 0.75, spread: 0.9 });
        K.say('Thịt bò chín tái rồi, thơm quá!', true);
        await arc(lad, worldOf(ws.pot, 0.4, 1.5, 0.2), 0.5, 0.4);
        await popOut(lad); drop(lad);
        await wait(0.6);
      } },

    { type: 'squeeze', presses: 4, juiceColor: '#D8EE6A', target: ws => ws.lime, voice: 'Thêm rau thơm nè! Bé bấm liên tục để vắt chanh vào tô phở nhé!',
      async setup(ws, K) {
        K.stove.fire(0); if (ws.potBub) ws.potBub.stop(); if (ws.potSteam) ws.potSteam.stop();
        ws.herbs = HERBS.map(([x, y, z, r, c]) => { const h = MC.herbSprig(c); h.position.set(x, y, z); h.rotation.y = r; ws.bowl.add(h); return h; });
        ws.lime = add(K, MC.limeWedge(), worldOf(ws.bowl, 0.2, 1.1, 0.1)); ws.lime.rotation.set(0.3, 0, 0);
        K.view(V(PH.bowl.x, 0.75, PH.bowl.z), 2.6, 2.3, 1.0);
        for (const h of ws.herbs) { Sound.fx.pop(); fx(K, h, '#7BD67B', 5); await popIn(h, 0.3, 0.85); }
        await popIn(ws.lime, 0.35, 1.5);
      },
      async onPress(ws, n, presses, K) {
        squeezeOnce(ws.lime, 1.5);
        const d = MD.mesh(MC.hemiGeo(), glossy('#E6F59A', 0.1)); d.scale.setScalar(0.05); d.position.copy(worldOf(ws.lime, 0, -0.1, 0)); K.ws.add(d);
        await Tweens.to(d.position, { y: worldOf(ws.bowl, 0, 0.16 + 0.41 * BROTH_LV, 0).y }, 0.3, { ease: Ease.inQuad });
        drop(d); Sound.fx.splash();
      },
      async done(ws, K) {
        ws.bowl.attach(ws.lime);
        Tweens.add(ws.lime.rotation, { x: 0.2, y: -0.6, z: 0.35 }, 0.4);
        Tweens.add(ws.lime.scale, { x: 1, y: 1, z: 1 }, 0.4);
        await arc(ws.lime, V(0.66, 0.6, 0.38), 0.45, 0.4);
        for (const [x, z] of CHILI) { const o = MD.garnish('ot'); o.position.set(x, TOP_Y - 0.01, z); ws.bowl.add(o); popIn(o, 0.3, 0.62); Sound.fx.pop(); await wait(0.12); }
        fx(K, worldOf(ws.bowl, 0, 0.7, 0), '#FFD34D', 12);
        await wait(0.3);
      } },
  ],
  reveal: ws => ws.bowl,
  final: () => phoBowl(),
};

export const RECIPES = { thitkho, che, pho };
