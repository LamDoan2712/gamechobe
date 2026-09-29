// family.js — màn cuối "Mâm cơm gia đình": bé bày món lên mâm, xếp bát đũa cho 4 người (đếm 1–4),
// rồi mời ông, bà, ba, mẹ ăn cơm theo thứ tự lễ phép (người lớn tuổi trước).

import { THREE, Tweens, Ease, createDoll, canvasTexture } from '../../kit/three-kit.js';
import { Sound } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import * as MD from './models.js';
import { mat, glossy, flat, own } from './mats.js';
import { arc, popIn, moveTo, wait, worldOf } from './anim.js';
import { countWord, screenCircle } from './steps.js';
import { FAMILY } from './data.js';
import { RECIPES_A } from './recipes-a.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const add = (K, o, pos) => { if (pos) o.position.copy(pos); K.ws.add(o); return o; };
const TABLE_Y = 0.95, TRAY_R = 2.3;

// Món trên mâm: lấy từ các món bé đã nấu (nếu có), không thì dùng món thay thế
let extra = {};
Promise.all(['./recipes-b.js', './recipes-c.js'].map(f => import(f).then(m => Object.assign(extra, m.RECIPES)).catch(() => {})));
function dishModel(id, fallback) {
  const r = RECIPES_A[id] || extra[id];
  try { if (r) return r.final(); } catch (e) { /* bỏ qua */ }
  return fallback();
}
function soupBowl(color) { const b = MD.bowl(1); const f = MD.fill(b, glossy(color, 0.2), 0.75); f.castShadow = false; return b; }
function sauceDish() {
  const b = MD.bowl(0.55); MD.fill(b, glossy('#C8741E', 0.15), 0.7);
  const ot = MD.garnish('ot'); ot.position.set(0.1, 0.5, 0); ot.scale.setScalar(1.3); b.add(ot);
  return b;
}
function tray() {
  const g = MD.group('tray');
  g.add(MD.mesh(new THREE.CylinderGeometry(TRAY_R, TRAY_R * 0.97, 0.12, 64), glossy('#B3261E', 0.3), 0, 0.06, 0));
  const rim = MD.put(g, MD.mesh(new THREE.TorusGeometry(TRAY_R, 0.07, 10, 64), glossy('#FFC53D', 0.25, 1, { metalness: 0.5 }), 0, 0.13, 0)); rim.rotation.x = Math.PI / 2;
  return g;
}
function chiepTexture() {
  const t = canvasTexture(256, 256, (g, w) => {
    g.fillStyle = '#E9C98A'; g.fillRect(0, 0, w, w);
    for (let i = 0; i < w; i += 8) { g.fillStyle = i % 16 ? 'rgba(200,150,80,.35)' : 'rgba(255,240,200,.35)'; g.fillRect(i, 0, 4, w); g.fillRect(0, i, w, 3); }
    g.fillStyle = '#C0392B'; g.fillRect(0, 20, w, 14); g.fillRect(0, w - 34, w, 14);
    g.fillStyle = '#2E86AB'; g.fillRect(0, 38, w, 6); g.fillRect(0, w - 44, w, 6);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t;
}
function person(kind) {
  const look = {
    ong: { hair: '#D9D9D9', shirt: '#8A5A36', glasses: true },
    ba_noi: { hair: '#CFCFD6', shirt: '#9B6BC4', bun: true },
    ba: { hair: '#2B2220', shirt: '#4E9BE0', glasses: false },
    me: { hair: '#3B2A2A', shirt: '#FF7FAA', long: true },
  }[kind];
  const d = createDoll({ skin: '#F8D9C2', base: look.shirt, face: { blushAmt: 0.45, brow: look.hair === '#D9D9D9' || look.hair === '#CFCFD6' ? '#9A9A9A' : '#3B2A2A' } });
  const hair = MD.mesh(new THREE.SphereGeometry(1.08, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(look.hair, 0.7)); hair.rotation.x = -0.75; d.head.add(hair);
  if (look.bun) d.head.add(MD.mesh(new THREE.SphereGeometry(0.42, 20, 14), mat(look.hair, 0.7), 0, 0.55, -0.8));
  if (look.long) { const back = MD.mesh(new THREE.CylinderGeometry(0.95, 1.05, 1.5, 28, 1, true, Math.PI * 0.62, Math.PI * 0.76), mat(look.hair, 0.7, 0, { side: THREE.DoubleSide }), 0, -0.55, -0.1); d.head.add(back); }
  if (look.glasses) [-0.38, 0.38].forEach(x => { const r = MD.mesh(new THREE.TorusGeometry(0.2, 0.03, 8, 20), mat('#3B2A2A', 0.4), x, 0.02, 0.98); d.head.add(r); });
  d.torsoMat.color.set(look.shirt);
  return d;
}

const SEATS = [V(-1.9, 0, -1.9), V(1.9, 0, -1.9), V(-3.1, 0, 0.1), V(3.1, 0, 0.1)];   // ông, bà, ba, mẹ
const BOWL_SEATS = [V(-1.25, 0, -1.2), V(1.25, 0, -1.2), V(-1.75, 0, 0.35), V(1.75, 0, 0.35)];

function mealTray() {
  const t = tray();
  const place = (o, x, z, s) => { o.position.set(x, 0.12, z); o.scale.multiplyScalar(s); t.add(o); };
  place(dishModel('com', () => MD.bowl(1)), -0.2, -0.75, 0.62);
  place(dishModel('canhbi', () => soupBowl('#F2A13B')), 0.85, -0.2, 0.55);
  place(dishModel('thitkho', () => dishModel('trung', () => MD.plate(1))), -0.95, 0.15, 0.5);
  place(dishModel('raumuong', () => MD.plate(1)), 0.25, 0.8, 0.5);
  place(sauceDish(), 0.05, 0.05, 1);
  return t;
}

const mamcom = {
  build(K) {
    const ws = { people: [] };
    K.room.visible = false;
    const floor = MD.mesh(new THREE.PlaneGeometry(26, 20), flat('#FFFFFF', { map: chiepTexture() }), 0, 0, -1); floor.rotation.x = -Math.PI / 2; floor.castShadow = false; K.ws.add(floor);
    const wall = MD.mesh(new THREE.PlaneGeometry(26, 12), own(new THREE.MeshBasicMaterial({ color: '#FFF1DE' })), 0, 5, -6); wall.castShadow = false; K.ws.add(wall);
    const frame = MD.mesh(new THREE.BoxGeometry(2.4, 1.6, 0.1), flat('#C98C58'), 0, 5.2, -5.9); K.ws.add(frame);
    K.ws.add(MD.mesh(new THREE.PlaneGeometry(2.1, 1.3), own(new THREE.MeshBasicMaterial({ color: '#BFE3FF' })), 0, 5.2, -5.84));
    // bàn thấp + mâm
    ws.table = add(K, MD.group('table'), V(0, 0, 0));
    ws.table.add(MD.mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.16, 64), mat('#9C5B2E', 0.5, 0, { map: null }), 0, TABLE_Y - 0.08, 0));
    [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach(([x, z]) => ws.table.add(MD.mesh(new THREE.CylinderGeometry(0.12, 0.14, TABLE_Y - 0.1, 12), mat('#7A4420', 0.6), x * 0.8, (TABLE_Y - 0.1) / 2, z * 0.8)));
    ws.tray = add(K, tray(), V(0, TABLE_Y, 0));
    // các món chờ bày (đặt trên chiếu phía trước)
    const models = [
      ['com', 'cơm', () => dishModel('com', () => MD.bowl(1))],
      ['canhbi', 'canh', () => dishModel('canhbi', () => soupBowl('#F2A13B'))],
      ['thitkho', 'món mặn', () => dishModel('thitkho', () => dishModel('trung', () => MD.plate(1)))],
      ['raumuong', 'rau', () => dishModel('raumuong', () => MD.plate(1))],
      ['sauce', 'nước chấm', () => sauceDish()],
    ];
    const xs = [-3.2, -1.6, 0, 1.6, 3.2];
    ws.dishes = models.map(([id, name, make], i) => { const o = make(); o.scale.multiplyScalar(i === 4 ? 1 : 0.55); o.position.set(xs[i], 0, 3.1); K.ws.add(o); return { obj: o, name, id }; });
    ws.bowls = [0, 1, 2, 3].map(i => { const b = MD.bowl(0.42); b.position.set(-3.8 + (i % 2) * 0.9, 0, 1.6 + Math.floor(i / 2) * 0.9); K.ws.add(b); return b; });
    return ws;
  },
  steps: [
    { type: 'drag', liftY: 2.2, voice: 'Kéo các món ăn lên mâm nào!',
      items: ws => ws.dishes.map(d => ({ obj: d.obj, name: d.name })),
      target: ws => ({ pos: V(0, TABLE_Y + 0.2, 0), r: TRAY_R + 0.4 }),
      setup(ws, K) { K.view(V(0, 1.2, 1.2), 9, 5.5, 0.85); },
      async place(ws, it, n) {
        const slots = [[-0.2, -0.75], [0.85, -0.2], [-0.95, 0.15], [0.25, 0.8], [0.05, 0.05]];
        const [x, z] = slots[ws.dishes.findIndex(d => d.obj === it.obj)];
        await moveTo(it.obj, V(x, TABLE_Y + 0.12, z), 0.35);
        Sound.fx.pop();
      } },
    { type: 'drag', liftY: 2.0, voice: 'Xếp bát cho mỗi người. Mình cùng đếm nhé!',
      items: ws => ws.bowls.map(b => ({ obj: b, name: 'bát' })),
      target: ws => ({ pos: V(0, TABLE_Y + 0.2, 0), r: TRAY_R + 0.6 }),
      setup(ws, K) { K.view(V(-0.6, 1.2, 0.8), 8.5, 5.2, 0.9); },
      async place(ws, it, n, K) {
        K.say(countWord(n) + '!', true);
        const s = BOWL_SEATS[n - 1];
        await moveTo(it.obj, V(s.x, TABLE_Y + 0.12, s.z), 0.35);
        const rice = MD.cookedRice(0.62, 0.42); rice.position.y = 0.2; it.obj.add(rice); popIn(rice, 0.3);
        const ch = MD.chopsticks(); ch.rotation.set(Math.PI / 2, 0, Math.atan2(s.x, s.z) + Math.PI / 2); ch.scale.setScalar(0.55);
        ch.position.set(s.x * 1.12, TABLE_Y + 0.16, s.z * 1.12 + 0.1); K.ws.add(ch); popIn(ch, 0.3, 0.55);
      },
      done(ws, K) { K.say('Bốn người, bốn bát, bốn đôi đũa. Giỏi quá!', true); } },
    { type: 'custom', voice: 'Cả nhà đến rồi! Bé mời ông trước, rồi bà, rồi ba mẹ nhé!',
      async setup(ws, K) {
        ['ong', 'ba_noi', 'ba', 'me'].forEach((kind, i) => {
          const d = person(kind); const s = SEATS[i];
          d.root.position.set(s.x, -0.55, s.z); d.root.scale.setScalar(0.72); d.root.lookAt(0, -0.55, 0.6);
          d.root.userData.kind = kind; K.ws.add(d.root); ws.people.push(d);
          popIn(d.root, 0.45, 0.72);
        });
        ws.tick = K.onFrame((dt, t) => ws.people.forEach(p => p.tick(dt, t)));
        K.view(V(0, 1.7, 0.2), 8.6, 5.6, 0.62);
        await wait(0.6);
      },
      run(ws, K, env, setApi) {
        return new Promise(resolve => {
          let next = 0, mistakes = 0, busy = false;
          const cv = K.stage.canvas;
          const heads = () => ws.people.map(p => p.head);
          const onDown = async e => {
            if (busy) return;
            const hit = K.pick(e, heads()); if (!hit) return;
            const idx = ws.people.findIndex(p => p.head === hit.object || p.head.getObjectById(hit.object.id));
            if (idx < 0) return;
            env.touched();
            if (idx !== next) { mistakes++; Sound.fx.boop(); K.say(next < 2 ? 'Mời ông bà trước nhé!' : `Bây giờ bé mời ${FAMILY[next].name} nhé!`, true); ws.people[idx].face.react({ mouth: 'o' }, 0.6); return; }
            busy = true;
            const f = FAMILY[idx], p = ws.people[idx];
            K.say(f.call, true); Sound.fx.select();
            const c = screenCircle(K, p.head); FX.hearts(c.x, c.y, 5);
            await wait(1.6);
            p.hop(); Sound.fx.yum(); K.say(f.reply, true); env.progress((idx + 1) / 4);
            await wait(1.4);
            next++; busy = false;
            if (next >= 4) {
              cv.removeEventListener('pointerdown', onDown);
              ws.people.forEach((q, i) => setTimeout(() => q.hop(), i * 150));
              Sound.fx.cheer(); FX.confetti(); K.say('Cả nhà ăn cơm thôi! Ngon quá!', true);
              ws.eat = K.onFrame((dt, t) => ws.people.forEach((q, i) => { q.head.rotation.x = Math.sin(t * 6 + i) * 0.12; }));
              await wait(1.2);
              resolve(Math.max(0.4, 1 - mistakes * 0.2));
            }
          };
          cv.addEventListener('pointerdown', onDown);
          setApi({
            hint: () => { const p = ws.people[next]; if (p) { const c = screenCircle(K, p.head); env.hand(c.x, c.y, 'tap'); } },
            dispose: () => cv.removeEventListener('pointerdown', onDown),
          });
        });
      } },
  ],
  reveal: ws => ws.tray,
  final: () => mealTray(),
};

export const RECIPES = { mamcom };
