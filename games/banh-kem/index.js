// index.js — Hamster Nhảy Bánh Kem: chạm để hamster nhảy, bánh trượt vào dưới chân, xếp tháp bánh thật cao.
// Một sân khấu 3D dùng chung cho menu, tủ đồ và màn chơi; giao diện DOM nằm phía trên.

import { THREE, createStage, Tweens, Ease } from '../../kit/three-kit.js';
import * as ui from '../../kit/ui.js';
import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { Store } from '../../kit/store.js';
import {
  LEVELS, LEVEL_COUNT, ENDLESS, FLAVORS, ACCESSORIES, MILESTONES, RANK_TITLES,
  playable, currentLevel, unlockedFlavors, accUnlocked, endlessUnlocked, milestonesReached, starsFor,
} from './data.js';
import { createHamster, HAM_R, HAM_H } from './hamster.js';
import { createCakeKit, LAYER_H } from './cake.js';
import { createKitchen, PLATE_TOP, TABLE_HW } from './world.js';
import * as IC from './icons.js';

const { ICONS } = ui;
const JUMP_H = 1.3;          // độ cao cú nhảy (cố định; thời gian bay đổi theo màn)
const DEMO_R = 1.25;
const HINT_AFTER = 6;

let game = null;
export default {
  async mount(root, ctx) { game = createGame(root, ctx); game.start(); },
  unmount() { if (game) { game.destroy(); game = null; } },
};

const sized = (svg, px) => svg.replace('<svg', `<svg width="${px}" height="${px}"`);

function template() {
  return `
  <div class="bk-stage"></div>
  <section class="k-screen bk-screen bk-menu" data-screen="menu" hidden>
    <div class="k-bar"><button class="k-round" data-act="hub" aria-label="Về trang chọn game">${ICONS.home}</button><div class="k-title"></div><div class="k-toggles"></div></div>
    <div class="bk-menu-body">
      <h1 class="bk-logo"><span class="a">Hamster</span><span class="b">Nhảy Bánh Kem</span></h1>
      <div class="bk-spot" data-spot aria-label="Hamster"></div>
      <div class="bk-menu-btns">
        <button class="k-btn bk-big" data-act="levels">${ICONS.play}<span>Chơi</span></button>
        <button class="k-btn lilac" data-act="wardrobe">${IC.hanger}<span>Tủ đồ</span></button>
        <button class="k-btn sun" data-act="endless" hidden>${IC.infinity}<span>Chơi mãi</span><small class="bk-best"></small></button>
      </div>
    </div>
  </section>
  <section class="k-screen bk-screen bk-levels" data-screen="levels" hidden>
    <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Quay lại">${ICONS.back}</button><div class="k-title">Chọn màn</div><div class="k-toggles"></div></div>
    <div class="bk-grid"></div>
  </section>
  <section class="k-screen bk-screen bk-wardrobe" data-screen="wardrobe" hidden>
    <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Quay lại">${ICONS.back}</button><div class="k-title">Tủ đồ</div><div class="k-toggles"></div></div>
    <div class="bk-spot" data-spot></div>
    <div class="k-tray bk-tray"><div class="k-row-scroll bk-accs"></div></div>
  </section>
  <section class="k-screen bk-screen bk-play" data-screen="play" hidden>
    <div class="k-bar">
      <button class="k-round" data-act="quit" aria-label="Quay lại">${ICONS.back}</button>
      <div class="bk-chip"><span class="ico">${IC.cakeMini}</span><span class="txt"><span class="row"><b class="n">0</b><span class="of">/ 5</span></span><span class="bk-hearts" hidden></span></span></div>
      <div class="k-title"></div>
      <div class="k-toggles"></div>
    </div>
    <div class="bk-spot" data-spot></div>
    <div class="bk-progress" aria-hidden="true"><div class="track"><div class="fill"></div></div><div class="rail"><span class="marker">${IC.hamsterFace()}</span></div><span class="goal">${ICONS.star}</span></div>
    <div class="bk-cue" aria-hidden="true" hidden><span>Chạm!</span></div>
    <div class="k-bubble"></div>
  </section>`;
}

function createGame(root, ctx) {
  const save = Store.game('banh-kem', { stars: {}, outfit: null, best: 0 });
  if (!save.stars || typeof save.stars !== 'object') save.stars = {};

  root.innerHTML = template();
  const $ = s => root.querySelector(s);
  const screens = {};
  root.querySelectorAll('[data-screen]').forEach(el => (screens[el.dataset.screen] = el));
  root.querySelectorAll('.k-toggles').forEach(el => ui.toggles(el));
  const say = ui.speaker($('.bk-play .k-bubble'));
  const hud = {
    chip: $('.bk-chip'), n: $('.bk-chip .n'), of: $('.bk-chip .of'), hearts: $('.bk-hearts'),
    progress: $('.bk-progress'), fill: $('.bk-progress .fill'), marker: $('.bk-progress .marker'), cue: $('.bk-cue'),
  };

  let alive = true, screen = null, ready = false, P = null;
  const cleanups = [];
  const listen = (tgt, type, fn, opt) => { tgt.addEventListener(type, fn, opt); cleanups.push(() => tgt.removeEventListener(type, fn, opt)); };

  /* ——— hẹn giờ theo khung hình (tự dừng khi sân khấu dừng, xoá sạch khi rời màn) ——— */
  const timers = [];
  const later = (sec, fn) => timers.push({ t: sec, fn });
  function tickTimers(dt) {
    for (let i = 0; i < timers.length;) {
      const tm = timers[i]; tm.t -= dt;
      if (tm.t <= 0) { timers.splice(i, 1); tm.fn(); } else i++;
    }
  }

  /* ——— sân khấu 3D ——— */
  const stage = createStage($('.bk-stage'), { sky: ['#BFE4FF', '#FFE6F0'], fov: 40, onResize: () => { if (ready) measure(); } });
  const { scene, camera, renderer } = stage;
  const kitchen = createKitchen(); scene.add(kitchen.group);
  const kit = createCakeKit();
  const hamster = createHamster(); scene.add(hamster.root);
  hamster.setAccessory(save.outfit && accUnlocked(save, save.outfit) ? save.outfit : 'none');
  const demo = kit.createLayer('dau', DEMO_R); demo.group.position.y = PLATE_TOP; scene.add(demo.group);

  // vòng gợi ý "Chạm!" (màn 1–3)
  const cueRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.94, 48), new THREE.MeshBasicMaterial({ color: '#FF5C9A', transparent: true, depthTest: false, depthWrite: false }));
  cueRing.renderOrder = 10; cueRing.visible = false; scene.add(cueRing);
  const CUE_FAR = new THREE.Color('#FFFFFF'), CUE_NOW = new THREE.Color('#FF5C9A');

  /* ——— máy quay: khung nhìn vừa với vùng trống giữa giao diện (data-spot) ——— */
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const spot = { x: 0, y: 0, w: 1, h: 1 }, rootOff = { x: 0, y: 0 };
  const view = { tx: 0, ty: 1, d: 12, elev: 0.2, cx: 0, cy: 0 };
  const goal = { tx: 0, ty: 1, w: 4, h: 3, elev: 0.2, topMargin: 0 };
  let viewKind = 'menu', snap = true, voX = NaN, voY = NaN;
  const sweep = { y: 0 };

  function measure() {
    const W = stage.width, H = stage.height, rr = root.getBoundingClientRect();
    if (W < 10 || H < 10) return;
    rootOff.x = rr.left; rootOff.y = rr.top;
    spot.x = 0; spot.y = 0; spot.w = W; spot.h = H;
    const el = screen && screens[screen] && screens[screen].querySelector('[data-spot]');
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 40 && r.height > 40) { spot.x = r.left - rr.left; spot.y = r.top - rr.top; spot.w = r.width; spot.h = r.height; }
    }
    voX = NaN;
  }
  const fitDist = (w, h, sw, sh) => Math.max((w * stage.height) / (2 * tanHalf * sw), (h * stage.height) / (2 * tanHalf * sh), 3);
  const topY = () => PLATE_TOP + (P ? P.stackN : 0) * LAYER_H;
  function computeGoal() {
    goal.tx = 0; goal.topMargin = 0;
    if (viewKind === 'menu') { goal.ty = PLATE_TOP + LAYER_H + 0.3; goal.w = 4.3; goal.h = 2.9; goal.elev = 0.26; }
    else if (viewKind === 'wardrobe') { goal.ty = PLATE_TOP + LAYER_H + 0.74; goal.w = 2.4; goal.h = 1.9; goal.elev = 0.14; }
    else if (viewKind === 'play') {
      const n = Math.min(P ? P.stackN : 0, 12);
      goal.w = 5.4 + n * 0.08; goal.h = 5.0 + n * 0.2; goal.elev = 0.2;
      goal.topMargin = 2.75; goal.ty = topY();            // ty = đỉnh tháp; tính lại theo lề trên
    } else if (viewKind === 'sweep') { goal.ty = sweep.y; goal.w = 4.6; goal.h = 4.2; goal.elev = 0.16; }
    else if (viewKind === 'tower') {
      const top = topY() + HAM_H + 0.6, bot = PLATE_TOP - 0.35;
      goal.h = top - bot + 0.3; goal.w = 4.4; goal.ty = (top + bot) / 2; goal.elev = 0.14;
    }
  }
  function updateCamera(dt) {
    if (spot.w < 10 || spot.h < 10) return;
    const d = fitDist(goal.w, goal.h, spot.w, spot.h);
    let ty = goal.ty;
    if (goal.topMargin) {
      // đặt đỉnh tháp cách mép trên vùng nhìn một khoảng cố định → màn hình dọc thấy được nhiều tầng bên dưới
      const visH = (spot.h * 2 * d * tanHalf) / stage.height;
      ty = goal.ty + Math.max(goal.topMargin, visH * 0.36) - visH / 2;
      // tháp còn thấp: giữ đĩa bánh ở phần dưới màn hình (điện thoại dọc không bị trống phía dưới)
      ty = Math.max(ty, PLATE_TOP + visH * 0.18);
    }
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.4);
    snap = false;
    view.tx += (goal.tx - view.tx) * k; view.ty += (ty - view.ty) * k; view.d += (d - view.d) * k;
    view.elev += (goal.elev - view.elev) * k;
    view.cx += (spot.x + spot.w / 2 - view.cx) * k; view.cy += (spot.y + spot.h / 2 - view.cy) * k;
    applyCamera();
  }
  function applyCamera() {
    camera.position.set(view.tx, view.ty + Math.sin(view.elev) * view.d, Math.cos(view.elev) * view.d);
    camera.lookAt(view.tx, view.ty, 0);
    const W = stage.width, H = stage.height, ox = W / 2 - view.cx, oy = H / 2 - view.cy;
    if (!(Math.abs(ox - voX) < 0.25 && Math.abs(oy - voY) < 0.25)) { camera.setViewOffset(W, H, ox, oy, W, H); voX = ox; voY = oy; }
    stage.sun.position.set(view.tx + 4, view.ty + 9, 7); stage.sun.target.position.set(view.tx, view.ty, 0);
  }
  const v3 = new THREE.Vector3(), scr = { x: 0, y: 0 };
  // toạ độ 3D → px trong khung game (không tạo vật mới)
  function project(x, y, z) {
    v3.set(x, y, z).project(camera);
    scr.x = ((v3.x + 1) / 2) * stage.width; scr.y = ((1 - v3.y) / 2) * stage.height;
    return scr;
  }
  const client = (x, y, z) => { const p = project(x, y, z); return { x: p.x + rootOff.x, y: p.y + rootOff.y }; };

  /* ——— màn hình ——— */
  const idle = { t: 0, next: HINT_AFTER };
  let menuHop = 2.5;
  function showScreen(name) {
    screen = name;
    for (const k in screens) screens[k].hidden = k !== name;
    ui.hand.hide(); idle.t = 0; idle.next = HINT_AFTER;
    hideCue();
    measure();
    if (name === 'levels') stage.stop(); else stage.start();
  }
  function placeOnDemo() {
    demo.group.visible = true; hamster.reset(); hamster.setGround(PLATE_TOP + LAYER_H, true);
  }
  function showMenu() {
    resetPlay(); showScreen('menu'); placeOnDemo(); viewKind = 'menu';
    const eb = $('[data-act="endless"]');
    eb.hidden = !endlessUnlocked(save);
    $('.bk-best').innerHTML = save.best ? `${sized(ICONS.trophy, 22)}${save.best}` : '';
    $('.bk-best').hidden = !save.best;
    measure();
  }
  function showLevels() {
    resetPlay(); showScreen('levels');
    ui.levelGrid($('.bk-grid'), {
      count: LEVEL_COUNT, current: currentLevel(save),
      stars: n => save.stars[n] || 0, playable: n => playable(save, n), gift: n => !!MILESTONES[n],
      onPick: n => startLevel(n),
    });
  }
  function showWardrobe() {
    resetPlay(); showScreen('wardrobe'); placeOnDemo(); viewKind = 'wardrobe';
    renderAccs();
    Voice.say('Chọn đồ cho Hamster nhé!');
  }
  function renderAccs() {
    const cur = save.outfit || 'none';
    $('.bk-accs').innerHTML = ACCESSORIES.map(a => {
      const ok = accUnlocked(save, a.id);
      return `<button class="k-item bk-acc ${cur === a.id ? 'on' : ''} ${ok ? '' : 'locked'}" data-acc="${a.id}" aria-label="${a.name}${ok ? '' : ' (chưa mở)'}">${IC.ACC_ICONS[a.id]}${ok ? '' : `<span class="bk-lock">${ICONS.lock}</span>`}</button>`;
    }).join('');
  }
  function wear(btn) {
    const id = btn.dataset.acc;
    if (!accUnlocked(save, id)) { ui.restart(btn, 'nope'); Sound.fx.boop(); Voice.say('Chơi thêm để mở nhé!'); return; }
    save.outfit = id === 'none' ? null : id; Store.save();
    hamster.setAccessory(id); hamster.hop(0.45);
    root.querySelectorAll('.bk-acc').forEach(b => b.classList.toggle('on', b === btn));
    Sound.fx.select();
    const p = client(0, PLATE_TOP + LAYER_H + 1.3, 0.3); FX.sparkle(p.x, p.y, '#FF7FAA', 10);
    Voice.say(id === 'none' ? 'Hamster đây!' : pick(['Xinh quá!', 'Đẹp quá!', 'Dễ thương quá!']));
  }

  /* ——— lượt chơi ——— */
  function newSession(mode, cfg) {
    return {
      mode, cfg: Object.assign({}, cfg), phase: 'intro', layers: [], stackN: 0, count: 0, misses: 0, hearts: 3, streak: 0,
      cake: null, falling: [], spawnT: 0, lastDir: Math.random() < 0.5 ? 1 : -1, lastFlavor: null,
      pendingCount: false, jumpBuf: 0, idleT: 0, hintAt: HINT_AFTER,
    };
  }
  function resetPlay() {
    timers.length = 0;
    kit.toppings.detach();
    if (P) {
      for (const L of P.layers) kit.disposeLayer(L);
      if (P.cake) kit.disposeLayer(P.cake.layer);
      for (const f of P.falling) kit.disposeLayer(f.layer);
      P = null;
    }
    hideCue(); ui.hand.hide();
  }
  function enterPlay() {
    showScreen('play');
    demo.group.visible = false;
    hamster.reset(); hamster.setGround(PLATE_TOP, true);
    viewKind = 'play';
    updateHud();
  }
  function startLevel(n) {
    resetPlay();
    P = newSession('level', LEVELS[n - 1]);
    enterPlay();
    const t = P.cfg.target;
    ui.introModal({
      eyebrow: `Màn ${n}`, title: `Xếp ${t} tầng bánh!`, pic: IC.introPic(t), goLabel: 'Bắt đầu', onGo: go,
      voice: `Xếp ${t} tầng bánh nhé!`,
    });
  }
  function startEndless() {
    resetPlay();
    P = newSession('endless', ENDLESS);
    enterPlay();
    ui.introModal({
      eyebrow: 'Chơi mãi', title: 'Xây tháp thật cao!', pic: IC.introPic(0, true),
      reqs: [0, 1, 2].map(() => `<span class="k-req" style="color:#FF5C9A">${IC.heart}</span>`).join(''),
      goLabel: 'Bắt đầu', onGo: go, voice: 'Xây tháp thật cao nào!',
    });
  }
  function go() {
    if (!P) return;
    P.phase = 'wait'; P.spawnT = 0.8; P.idleT = 0; P.hintAt = HINT_AFTER;
    if (P.cfg.cue) later(0.35, () => say('Chạm để nhảy nào!', true));
  }
  function pickFlavor() {
    const list = unlockedFlavors(save);
    let f = list[0];
    for (let i = 0; i < 5; i++) { f = list[(Math.random() * list.length) | 0]; if (f !== P.lastFlavor) break; }
    P.lastFlavor = f; return f;
  }
  function spawnCake() {
    const cfg = P.cfg;
    const dir = cfg.randomSide ? (Math.random() < 0.5 ? -1 : 1) : -P.lastDir;
    P.lastDir = dir;
    const fast = Math.random() < cfg.fastChance;
    const R = 1.1 + Math.random() * 0.4, contactX = R + HAM_R;
    const x = contactX + cfg.speed * cfg.approach;          // bánh nhanh xuất phát cùng chỗ nên tới sớm hơn
    const layer = kit.createLayer(pickFlavor(), R);
    layer.group.position.set(dir * x, topY(), 0);
    layer.group.scale.setScalar(0.01);
    Tweens.add(layer.group.scale, { x: 1, y: 1, z: 1 }, 0.3, { ease: Ease.outBack });
    scene.add(layer.group);
    P.cake = { layer, dir, x, speed: cfg.speed * (fast ? 1.38 : 1), contactX, contacted: false, ok: false };
    P.phase = 'approach';
    hamster.look(dir);
    if (fast) Sound.fx.whoosh(); else Sound.fx.bubble();
  }
  function contact(c) {
    const rel = hamster.y - topY();
    if (rel >= LAYER_H - P.cfg.tol) {
      // đủ cao: bánh trượt vào dưới chân
      c.ok = true; P.stackN++; P.pendingCount = true; P.phase = 'settle';
      hamster.setGround(topY());
      if (hamster.y < topY()) hamster.landNow();
    } else bump(c);
  }
  function settle(c) {
    P.cake = null; P.layers.push(c.layer);
    const g = c.layer.group; g.position.x = 0;
    Tweens.add(g.scale, { y: 0.9 }, 0.07, { onDone: () => Tweens.add(g.scale, { y: 1 }, 0.4, { ease: Ease.outElastic }) });
    hamster.look(0);
    maybeNext();
  }
  function bump(c) {
    P.cake = null; P.misses++; P.streak = 0;
    P.falling.push({ layer: c.layer, vx: c.dir * 3.2, vy: 3.0, vz: 0.9, w: -c.dir * 5.5, life: 2.4, bounces: 0 });
    hamster.tumble(-c.dir); hamster.look(0);
    Sound.fx.bump(); later(0.16, () => Sound.fx.boing());
    say('Ui da!', true);
    const p = client(c.dir * HAM_R, topY() + 0.55, 0.3); FX.sparkle(p.x, p.y, '#FFD34D', 8);
    hideCue();
    if (P.mode === 'endless') {
      P.hearts--; updateHud(true);
      if (P.hearts <= 0) { endEndless(); return; }
    }
    P.phase = 'wait'; P.spawnT = 1.25;
  }
  function addLayer() {
    P.count++; P.streak++;
    Sound.fx.ding();
    const L = P.cake && P.cake.ok ? P.cake.layer : P.layers[P.layers.length - 1];
    if (L) {
      const col = L.frostColor === '#FFFFFF' ? '#FF7FAA' : L.frostColor, y = topY();
      let p = client(-L.R * 0.85, y, 0.4); FX.sparkle(p.x, p.y, col, 6);
      p = client(L.R * 0.85, y, 0.4); FX.sparkle(p.x, p.y, '#FFD34D', 6);
    }
    hamster.happy(0.6);
    if (P.mode === 'endless') ENDLESS.ramp(P.cfg, P.count);
    updateHud(); ui.restart(hud.chip, 'bk-pop');
    if (P.count >= P.cfg.target) { complete(); return; }
    const left = P.cfg.target - P.count;
    if (left === 1) say('Còn một tầng nữa!');
    else if (P.streak % 3 === 0) say(pick(['Giỏi quá!', 'Hay lắm!', 'Tuyệt vời!', 'Cao quá!']));
    maybeNext();
  }
  function maybeNext() {
    if (!P || P.cake || P.pendingCount || P.phase === 'celebrate' || P.phase === 'end') return;
    P.phase = 'wait'; P.spawnT = 0.5;
  }
  const canJump = () => P && (P.phase === 'wait' || P.phase === 'approach' || P.phase === 'settle');
  function doJump() {
    const T = P.cfg.hang;
    if (!hamster.jump((4 * JUMP_H) / T, (8 * JUMP_H) / (T * T))) return false;
    Sound.fx.jump(); hideCue();
    return true;
  }
  function tap() {
    if (!P || ui.modalOpen()) return;
    P.idleT = 0; P.hintAt = HINT_AFTER; ui.hand.hide();
    if (!canJump()) return;
    if (!doJump()) P.jumpBuf = 0.15;     // chạm sớm một chút trước khi đáp → nhảy ngay khi chạm chân
  }
  hamster.onLand = () => {
    Sound.fx.land();
    if (screen !== 'play' || !P) return;
    if (P.pendingCount) { P.pendingCount = false; addLayer(); }
    if (P && P.jumpBuf > 0 && canJump()) { P.jumpBuf = 0; doJump(); }
  };

  function updatePlay(dt, t) {
    if (P.jumpBuf > 0) P.jumpBuf -= dt;
    if (P.phase === 'wait') { P.spawnT -= dt; if (P.spawnT <= 0) spawnCake(); }
    const c = P.cake;
    if (c) {
      c.x -= c.speed * dt;
      if (!c.contacted && c.x <= c.contactX) { c.contacted = true; contact(c); }
      if (P && P.cake === c) {
        if (c.ok && c.x <= 0) { c.x = 0; settle(c); }
        c.layer.group.position.x = c.dir * c.x;
      }
    }
    if (!P) return;
    // bánh rơi: lộn nhào, nảy trên bàn rồi biến mất
    for (let i = P.falling.length - 1; i >= 0; i--) {
      const f = P.falling[i], g = f.layer.group;
      f.vy -= 14 * dt;
      g.position.x += f.vx * dt; g.position.y += f.vy * dt; g.position.z += f.vz * dt; g.rotation.z += f.w * dt;
      if (g.position.y < 0 && f.vy < 0 && f.bounces < 2 && Math.abs(g.position.x) < TABLE_HW && g.position.z < 3.4) { g.position.y = 0; f.vy *= -0.42; f.w *= 0.5; f.bounces++; }
      f.life -= dt;
      if (f.life < 0.45) g.scale.setScalar(Math.max(0.001, f.life / 0.45));
      if (f.life <= 0 || g.position.y < -9) { kit.disposeLayer(f.layer); P.falling.splice(i, 1); }
    }
    // gợi ý khi bé chưa chạm
    if (canJump()) {
      P.idleT += dt;
      if (P.idleT > P.hintAt) {
        P.hintAt = P.idleT + 8;
        const side = -P.lastDir, p = client(side * 1.0, hamster.y + 0.3, 0);
        ui.hand.point(p.x, p.y, 'tap');
        say('Chạm để nhảy nào!', true);
      }
    }
    updateCue(t);
  }

  /* ——— vòng gợi ý thời điểm nhảy (màn 1–3) ——— */
  let cueLabel = false;
  function hideCue() { cueRing.visible = false; if (cueLabel) { cueLabel = false; hud.cue.hidden = true; } }
  function updateCue(t) {
    const c = P && P.cake;
    if (!(P && P.cfg.cue && c && !c.contacted && !hamster.air && P.phase === 'approach')) { hideCue(); return; }
    const tc = (c.x - c.contactX) / c.speed;        // số giây tới lúc bánh chạm hamster
    if (tc > 1.75 || tc < 0.1) { hideCue(); return; }
    let sc, op, now = false;
    if (tc > 0.8) { const p = (tc - 0.8) / 0.95; sc = 1 + p * 1.7; op = 0.3 + (1 - p) * 0.45; }
    else { sc = 1.02 + Math.sin(t * 16) * 0.1; op = 0.95; now = true; }
    cueRing.visible = true;
    cueRing.scale.setScalar(sc); cueRing.material.opacity = op; cueRing.material.color.copy(now ? CUE_NOW : CUE_FAR);
    cueRing.position.set(0, hamster.y + 0.56, 0.1); cueRing.quaternion.copy(camera.quaternion);
    if (now) {
      const p = project(0, hamster.y + HAM_H + 0.2, 0);
      hud.cue.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
      if (!cueLabel) { cueLabel = true; hud.cue.hidden = false; }
    } else if (cueLabel) { cueLabel = false; hud.cue.hidden = true; }
  }

  function updateHud(lostHeart) {
    if (!P) return;
    const endless = P.mode === 'endless';
    hud.n.textContent = P.count;
    hud.of.textContent = endless ? '' : `/ ${P.cfg.target}`;
    hud.of.hidden = endless; hud.hearts.hidden = !endless; hud.progress.hidden = endless;
    if (endless) hud.hearts.innerHTML = [0, 1, 2].map(i => `<span class="${i < P.hearts ? 'on' : 'off'} ${lostHeart && i === P.hearts ? 'lost' : ''}">${IC.heart}</span>`).join('');
    else { const pct = Math.min(1, P.count / P.cfg.target) * 100; hud.fill.style.height = pct + '%'; hud.marker.style.bottom = pct + '%'; }
  }

  /* ——— xong màn: dâu tây + nến, hamster nhảy múa, máy quay lướt dọc tháp, chụp ảnh ——— */
  const topLayer = () => (P.cake && P.cake.ok ? P.cake.layer : P.layers[P.layers.length - 1]);
  function decorate() {
    const L = topLayer(); if (!L) return;
    const items = kit.toppings.attach(L);
    items.forEach((it, i) => later(i * 0.24, () => {
      Tweens.add(it.scale, { x: 1, y: 1, z: 1 }, 0.42, { ease: Ease.outBack });
      Sound.fx.pop(); if (i > 0) later(0.25, () => { kit.toppings.light(i - 1); Sound.fx.tap(); });
    }));
  }
  function celebrateAndSweep(startAt, onDone) {
    later(startAt, () => { hamster.dance(3.4); Sound.fx.cheer(); FX.confetti(); const p = client(0, topY() + 0.8, 0); FX.burst(p.x, p.y, '#FF7FAA'); });
    const sweepDur = Math.min(2.6, 0.9 + P.stackN * 0.12);
    later(startAt + 1.4, () => {
      sweep.y = topY() + 0.4; viewKind = 'sweep';
      Tweens.add(sweep, { y: PLATE_TOP + 0.9 }, sweepDur, { ease: Ease.inOutSine, onDone: () => { viewKind = 'tower'; } });
    });
    later(startAt + 1.4 + sweepDur + 1.3, onDone);
  }
  function complete() {
    P.phase = 'celebrate'; hideCue(); ui.hand.hide(); hamster.look(0);
    later(0.45, decorate);
    later(1.4, () => say(pick(['Giỏi quá!', 'Tuyệt vời!', 'Hay lắm!']), true));
    celebrateAndSweep(1.4, finishLevel);
  }
  function finishLevel() {
    if (!P) return;
    const n = P.cfg.n, stars = starsFor(P.misses), had = save.stars[n] || 0, gift = !!MILESTONES[n] && !had;
    save.stars[n] = Math.max(had, stars); Store.save();
    const photo = takePhoto();
    P.phase = 'end'; hamster.happy(4);
    const title = ['Giỏi lắm!', 'Giỏi quá!', 'Tuyệt vời!'][stars - 1];
    ui.resultModal({
      title, stars,
      pic: photo ? `<img src="${photo}" alt="Tháp bánh của bé">` : IC.introPic(P.count),
      caption: `<span>Màn ${n}</span><span style="display:inline-flex;align-items:center;gap:4px">${sized(IC.cakeMini, 24)}${P.count} tầng</span>`,
      buttons: [
        { label: 'Chơi tiếp', icon: ICONS.play, onClick: () => afterGift(gift, n, () => (n < LEVEL_COUNT ? startLevel(n + 1) : startEndless())) },
        { label: 'Chơi lại', icon: ICONS.replay, cls: 'ghost', onClick: () => afterGift(gift, n, () => startLevel(n)) },
      ],
      voice: `${title} Bé được ${stars} ngôi sao!`,
    });
  }
  function afterGift(gift, n, next) {
    if (!gift) { next(); return; }
    const m = MILESTONES[n], items = [];
    (m.flavors || []).forEach(f => items.push({ pic: IC.cakeSvg(f), label: FLAVORS[f].name }));
    (m.accs || []).forEach(a => items.push({ pic: IC.ACC_ICONS[a], label: ACCESSORIES.find(x => x.id === a).name, round: true }));
    if (m.endless) items.push({ pic: IC.infinity.replace('<svg', '<svg style="color:#E7A21E"'), label: 'Chơi mãi' });
    const rank = 1 + milestonesReached(save);
    ui.giftModal({ rank, title: RANK_TITLES[Math.min(rank, RANK_TITLES.length) - 1], items, onNext: next });
  }
  function endEndless() {
    P.phase = 'celebrate'; hideCue(); ui.hand.hide();
    const count = P.count, prev = save.best || 0, record = count > prev;
    if (record) { save.best = count; Store.save(); }
    later(1.0, () => { if (count) decorate(); say(record ? 'Kỷ lục mới!' : 'Tháp cao quá!', true); });
    celebrateAndSweep(1.3, () => {
      if (!P) return;
      const photo = takePhoto();
      P.phase = 'end'; hamster.happy(4);
      ui.resultModal({
        title: record ? 'Kỷ lục mới!' : `Tháp ${count} tầng!`, stars: 0,
        pic: photo ? `<img src="${photo}" alt="Tháp bánh của bé">` : IC.introPic(count, true),
        caption: `<span style="display:inline-flex;align-items:center;gap:4px">${sized(IC.cakeMini, 24)}${count} tầng</span><span style="display:inline-flex;align-items:center;gap:4px">${sized(ICONS.trophy, 24)}${Math.max(prev, count)}</span>`,
        buttons: [
          { label: 'Chơi lại', icon: ICONS.replay, onClick: startEndless },
          { label: 'Xong', icon: ICONS.home, cls: 'ghost', onClick: showMenu },
        ],
        voice: record ? `Kỷ lục mới! Tháp cao ${count} tầng!` : `Tháp cao ${count} tầng!`,
      });
    });
  }
  // Chụp ảnh: khung vuông giữa canvas, vẽ một khung hình rồi đọc ảnh ngay trong cùng nhịp
  function takePhoto() {
    const W = stage.width, H = stage.height, s = Math.floor(Math.min(W, H));
    if (s < 20) return '';
    hideCue();
    viewKind = 'tower'; computeGoal();
    view.tx = goal.tx; view.ty = goal.ty; view.elev = goal.elev; view.d = fitDist(goal.w, goal.h, s * 0.94, s * 0.94);
    view.cx = W / 2; view.cy = H / 2; voX = NaN;
    applyCamera();
    renderer.render(scene, camera);
    let url = '';
    try {
      const src = renderer.domElement, k = src.width / W, out = document.createElement('canvas');
      out.width = out.height = 480;
      out.getContext('2d').drawImage(src, ((W - s) / 2) * k, ((H - s) / 2) * k, s * k, s * k, 0, 0, 480, 480);
      url = out.toDataURL('image/jpeg', 0.86);
    } catch (e) { url = ''; }
    ui.flash();
    return url;
  }

  /* ——— nhập liệu ——— */
  listen(root, 'click', e => {
    const b = e.target.closest('[data-act]');
    if (b) {
      const act = b.dataset.act;
      if (act === 'hub') { Sound.fx.tap(); ctx.goHub(); }
      else if (act === 'levels') { Sound.fx.pop(); showLevels(); }
      else if (act === 'wardrobe') { Sound.fx.pop(); showWardrobe(); }
      else if (act === 'endless') { Sound.fx.pop(); startEndless(); }
      else if (act === 'menu') { Sound.fx.tap(); showMenu(); }
      else if (act === 'quit') { Sound.fx.tap(); Voice.stop(); const endless = P && P.mode === 'endless'; resetPlay(); endless ? showMenu() : showLevels(); }
      return;
    }
    const acc = e.target.closest('[data-acc]');
    if (acc) wear(acc);
  });
  listen(root, 'pointerdown', () => { idle.t = 0; idle.next = HINT_AFTER; if (screen !== 'play') ui.hand.hide(); }, true);
  listen(screens.play, 'pointerdown', e => {
    if (e.button > 0 || e.target.closest('button, .k-toggles')) return;
    tap();
  });
  listen(screens.menu.querySelector('[data-spot]'), 'pointerdown', e => {
    hamster.hop(0.5); Sound.fx.boing(); FX.hearts(e.clientX, e.clientY, 4); Voice.say('Chít chít!');
  });
  listen(window, 'keydown', e => {
    if (screen !== 'play' || ui.modalOpen()) return;
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) tap(); }
  });

  function idleTick(dt) {
    if (ui.modalOpen()) return;
    if (screen === 'menu') {
      if ((menuHop -= dt) <= 0) { menuHop = 3.5 + Math.random() * 2.5; hamster.hop(0.32); }
    }
    idle.t += dt;
    if (idle.t < idle.next) return;
    idle.next = idle.t + 9;
    if (screen === 'menu') { ui.hand.pointAt($('[data-act="levels"]'), 'tap'); Voice.say('Chạm vào đây để chơi nhé!'); }
    else if (screen === 'wardrobe') {
      const b = [...root.querySelectorAll('.bk-acc:not(.locked):not(.on)')][0];
      if (b) { ui.hand.pointAt(b, 'tap'); Voice.say('Chạm để chọn đồ nhé!'); }
    }
  }

  /* ——— vòng lặp ——— */
  function frame(dt, t) {
    tickTimers(dt);
    if (screen === 'play' && P) updatePlay(dt, t); else idleTick(dt);
    hamster.update(dt, t);
    kit.toppings.tick(t);
    computeGoal(); updateCamera(dt);
    kitchen.update(dt, view.ty);
  }
  stage.onFrame(frame);

  return {
    start() {
      ready = true;
      showMenu(); snap = true;
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (alive) measure(); });
    },
    destroy() {
      alive = false;
      timers.length = 0;
      cleanups.forEach(f => f()); cleanups.length = 0;
      ui.hand.hide(); Voice.stop();
      hamster.onLand = null;
      resetPlay();
      kit.disposeLayer(demo);
      scene.traverse(o => { if (o.isInstancedMesh) o.dispose(); });
      stage.dispose();
      try { renderer.forceContextLoss(); } catch (e) { /* bỏ qua */ }
      kit.dispose(); kitchen.dispose(); hamster.dispose();
      root.innerHTML = '';
    },
  };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
