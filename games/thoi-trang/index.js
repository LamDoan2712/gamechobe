// Thời Trang Xinh — chọn tóc, áo, váy, đầm, giày, phụ kiện và trang điểm cho búp bê 3D, rồi trình diễn trên sàn catwalk.
// Màn hình: menu → chọn màn (12 màn) → phòng thay đồ → sàn diễn → ảnh kết quả / album. Có chế độ Tự do.

import { THREE, createStage, createDoll, Tweens, Ease, wait } from '../../kit/three-kit.js';
import { ICONS, toggles, closeModal, modal, modalOpen, speaker, hand, flash, levelGrid, introModal, resultModal, giftModal, starsHtml, PRAISE, pick, restart, centerOf } from '../../kit/ui.js';
import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { Store } from '../../kit/store.js';
import { CATS, CAT_ICONS, RANDOM_ICON, HAIR_STYLES, HAIR_COLORS, RAINBOW_CSS, ITEMS, ORDER, MAKEUP, LIPS, BASE_LOOK, MENU_LOOK, LEVELS, GIFTS, RANKS, unlockedSet } from './data.js';
import { createMats } from './mats.js';
import { Outfit, equip, isWorn, cloneLook, itemKeys } from './outfit.js';
import { createThumbs } from './thumbs.js';
import { createBoutique, createRunway } from './scene.js';

const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const IMG = src => `<img alt="" src="${src}" style="width:100%;height:100%;object-fit:contain;display:block">`;
const TAU = Math.PI * 2;

let game = null;
export default {
  mount(root, ctx) { game = createGame(root, ctx); },
  unmount() { if (game) game.destroy(); game = null; },
};

function createGame(root, ctx) {
  const save = Store.game('thoi-trang', { stars: {}, album: [] });
  if (!Array.isArray(save.album)) save.album = [];
  let alive = true, framed = false;
  const timers = new Set();
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (alive) fn(); }, ms); timers.add(t); return t; };
  const cancel = t => { if (t) { clearTimeout(t); timers.delete(t); } };

  root.innerHTML = `
    <div class="tt-stage"></div>
    <section class="k-screen tt-scr tt-menu" data-s="menu" hidden>
      <div class="k-bar"><button class="k-round" data-act="hub" aria-label="Về trang chọn game">${ICONS.home}</button><div class="k-title"></div><div class="k-toggles"></div></div>
      <h1 class="tt-logo"><span class="sm">Thời Trang</span><span class="lg">Xinh</span></h1>
      <div class="tt-hole"></div>
      <nav class="tt-actions">
        <button class="k-btn" data-act="levels">${ICONS.play}<span>Chơi</span></button>
        <button class="k-btn mint" data-act="free">${CAT_ICONS.dress}<span>Tự do</span></button>
        <button class="k-btn lilac" data-act="album">${ICONS.album}<span>Album</span></button>
      </nav>
    </section>
    <section class="k-screen tt-scr tt-levels" data-s="levels" hidden>
      <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Quay lại">${ICONS.back}</button><div class="k-title">Chọn màn chơi</div><div class="tt-total"></div></div>
      <div class="tt-grid"></div>
    </section>
    <section class="tt-scr tt-play" data-s="play" hidden>
      <div class="k-bar tt-pbar"><button class="k-round tt-back" aria-label="Quay lại"></button><div class="k-title tt-ptitle"></div>
        <button class="k-round tt-rand" aria-label="Ngẫu nhiên">${RANDOM_ICON}</button><div class="k-toggles"></div></div>
      <div class="tt-hole">
        <button class="k-order tt-order" aria-label="Xem hình mẫu"></button>
        <div class="k-bubble" aria-live="polite"></div>
        <button class="k-fab tt-fab" aria-label="Trình diễn và chụp ảnh">${ICONS.camera}</button>
      </div>
      <div class="k-tray tt-tray"><div class="k-row-scroll tt-sub"></div><div class="k-row-scroll tt-items"></div><div class="k-row-scroll tt-cats"></div></div>
    </section>
    <section class="k-screen tt-scr tt-album" data-s="album" hidden>
      <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Quay lại">${ICONS.back}</button><div class="k-title">Album ảnh</div><div class="tt-count"></div></div>
      <div class="tt-album-grid"></div>
    </section>`;
  const $ = s => root.querySelector(s);
  root.querySelectorAll('.k-toggles').forEach(el => toggles(el));
  const el = {
    stage: $('.tt-stage'), menuHole: $('.tt-menu .tt-hole'), playHole: $('.tt-play .tt-hole'),
    back: $('.tt-back'), title: $('.tt-ptitle'), rand: $('.tt-rand'), order: $('.tt-order'), fab: $('.tt-fab'),
    tray: $('.tt-tray'), sub: $('.tt-sub'), items: $('.tt-items'), cats: $('.tt-cats'), grid: $('.tt-grid'), album: $('.tt-album-grid'),
  };
  const say = speaker($('.tt-play .k-bubble'));
  // Màn hình thấp (điện thoại xoay ngang): thu nhỏ ảnh trong hộp thoại để nút bấm luôn nhìn thấy
  const fitModal = () => {
    if (innerHeight > 560) return;
    const w = `min(${Math.round(innerHeight * 0.42)}px, 62vw)`;
    document.querySelectorAll('.k-modal-card .k-polaroid, .k-modal-card .k-pic').forEach(e => { e.style.width = w; });
    document.querySelectorAll('.k-modal-card .k-bigstars svg').forEach(e => { e.style.width = e.style.height = '40px'; });
  };

  /* ——— tiến trình ——— */
  const doneCount = () => { let n = 0; while (save.stars[n + 1]) n++; return n; };
  let U = unlockedSet(doneCount());

  /* ——— sân khấu 3D ——— */
  const stage = createStage(el.stage, { onResize: () => { reframe(true); if (framed) resetIdle(); } });
  const M = createMats();
  const boutique = createBoutique(stage, M), runway = createRunway(M);
  stage.scene.add(boutique.group, runway.group);
  stage.scene.background = boutique.sky;
  boutique.setGold(doneCount() >= 12);
  const doll = createDoll(); stage.scene.add(doll.root);
  const outfit = new Outfit(doll, M);
  const thumbs = createThumbs(M);
  const look3 = new THREE.Vector3(0, 2.1, 0), v3 = new THREE.Vector3();
  const cam = stage.camera;
  cam.position.set(0, 2.8, 10);

  stage.onFrame((dt, t) => {
    doll.tick(dt, t); outfit.tick(dt, t);
    boutique.update(dt);
    if (runway.group.visible) runway.update(dt, t);
    cam.lookAt(look3);
  });

  // Đặt máy quay sao cho búp bê nằm gọn trong khoảng trống giữa thanh trên và khay đồ
  function reframe(instant) {
    if (!framed || showing) return;
    const hole = screen === 'menu' ? el.menuHole : screen === 'play' ? el.playHole : null;
    if (!hole) return;
    const r = hole.getBoundingClientRect(), s = el.stage.getBoundingClientRect();
    if (r.width < 20 || r.height < 20 || s.width < 20) return;
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), aspect = s.width / s.height;
    const needH = screen === 'menu' ? 5.2 : 5.4, needW = 3.5;
    const visH = Math.max(needH / (r.height / s.height), needW / ((r.width / s.width) * aspect));
    const dist = visH / (2 * half), visW = visH * aspect;
    const cx = r.left - s.left + r.width / 2, cy = r.top - s.top + r.height / 2;
    const tx = (s.width / 2 - cx) / s.width * visW, ty = 2.15 - (s.height / 2 - cy) / s.height * visH;
    const to = { x: tx, y: ty + dist * 0.09, z: dist }, at = { x: tx, y: ty, z: 0 };
    Tweens.kill(cam.position); Tweens.kill(look3);
    if (instant) { cam.position.set(to.x, to.y, to.z); look3.set(at.x, at.y, at.z); }
    else { Tweens.add(cam.position, to, 0.55, { ease: Ease.inOutSine }); Tweens.add(look3, at, 0.55, { ease: Ease.inOutSine }); }
  }
  const ro = new ResizeObserver(() => reframe(false));
  ro.observe(el.menuHole); ro.observe(el.playHole);

  /* ——— màn hình ——— */
  let screen = '', mode = 'free', lvl = 0, reqs = [], matched = [], filled = [], allFilled = false, cat = 'hair';
  let look = BASE_LOOK(), targetPic = '', showing = false, menuT = 0;
  function show(name) {
    screen = name;
    root.querySelectorAll('[data-s]').forEach(s => { s.hidden = s.dataset.s !== name; });
    hand.hide(); cancel(idleT); cancel(menuT);
    const has3d = name === 'menu' || name === 'play';
    el.stage.classList.toggle('off', !has3d);
    if (has3d) { stage.start(); framed = true; reframe(true); } else stage.stop();
    resetIdle();
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act; Sound.fx.pop();
    if (act === 'hub') { Voice.stop(); ctx.goHub(); }
    else if (act === 'levels') openLevels();
    else if (act === 'free') startFree();
    else if (act === 'album') openAlbum();
    else if (act === 'menu') openMenu();
  });

  /* ——— menu ——— */
  function openMenu() {
    show('menu'); mode = 'menu';
    const l = save.free && save.free.acc ? save.free : MENU_LOOK();
    look = cloneLook(l); outfit.apply(look, true);
    resetDoll();
    const loop = () => { if (screen !== 'menu') return; if (!modalOpen()) { outfit.wave(); } menuT = later(loop, 5200); };
    menuT = later(loop, 900);
  }
  function resetDoll() { Tweens.kill(doll.root.rotation); doll.root.rotation.y = 0; doll.root.position.set(0, 0, 0); }

  /* ——— chọn màn ——— */
  function openLevels() {
    show('levels'); mode = 'levels';
    const done = doneCount();
    $('.tt-total').innerHTML = `<span class="tt-chip">${ICONS.star}<b>${Object.values(save.stars).reduce((a, b) => a + (+b || 0), 0)}</b></span>`;
    levelGrid(el.grid, {
      count: LEVELS.length, stars: n => save.stars[n] || 0, playable: n => n <= done + 1 || !!save.stars[n],
      current: done < LEVELS.length ? done + 1 : 0, gift: n => !!GIFTS[n], onPick: n => startLevel(n),
    });
    Voice.say('Chọn màn chơi nào!');
  }

  /* ——— album ——— */
  const TILT = ['-3deg', '2deg', '-1.5deg', '3deg', '-2deg'];
  function openAlbum() {
    show('album'); mode = 'album';
    const list = save.album;
    $('.tt-count').textContent = list.length ? `${list.length} ảnh` : '';
    el.album.innerHTML = list.length ? list.map((a, i) => `<button class="k-polaroid tt-photo" data-i="${i}" style="--tilt:${TILT[i % TILT.length]}" aria-label="Ảnh ${i + 1}">
        <div class="pic"><img alt="" src="${a.img}"></div><div class="cap"><span>${a.lvl ? 'Màn ' + a.lvl : 'Tự do'}</span>${a.lvl ? starsHtml(a.stars) : ''}</div></button>`).join('')
      : `<div class="tt-empty">${ICONS.album}<span>Chưa có ảnh nào</span></div>`;
    Voice.say(list.length ? 'Album ảnh của bé nè!' : 'Chưa có ảnh nào. Mặc đồ xong rồi trình diễn nhé!');
  }
  el.album.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const a = save.album[+b.dataset.i]; if (!a) return; Sound.fx.pop();
    modal(`<div class="k-polaroid"><div class="pic"><img alt="" src="${a.img}"></div><div class="cap"><span>${a.lvl ? 'Màn ' + a.lvl : 'Tự do'}</span>${a.lvl ? starsHtml(a.stars) : ''}</div></div>
      <button class="k-btn" data-x>${ICONS.check}<span>Xong</span></button>`, c => { c.querySelector('[data-x]').onclick = () => { Sound.fx.tap(); closeModal(); }; });
    fitModal();
    Voice.say(pick(PRAISE));
  });

  /* ——— yêu cầu của màn ——— */
  const kindOf = r => (r.k === 'hair' || r.k === 'hairColor' || r.k === 'makeup' ? r.k : 'item');
  const catOf = r => (r.k === 'hair' || r.k === 'hairColor' ? 'hair' : r.k === 'makeup' ? 'beauty' : ITEMS[r.v].cat);
  const wants = (kind, id) => mode === 'level' && reqs.some(r => kindOf(r) === kind && r.v === id);
  const START = BASE_LOOK();
  function reqState(r) {
    const L = look;
    switch (r.k) {
      case 'hair': return { match: L.hair === r.v, filled: L.hair !== START.hair || L.hair === r.v };
      case 'hairColor': return { match: L.hairColor === r.v, filled: L.hairColor !== START.hairColor || L.hairColor === r.v };
      case 'makeup': return { match: L.makeup === r.v, filled: !!L.makeup };
      case 'top': return { match: L.top === r.v, filled: !!(L.top || L.dress) };
      case 'bottom': return { match: L.bottom === r.v, filled: !!(L.bottom || L.dress) };
      case 'dress': return { match: L.dress === r.v, filled: !!(L.dress || (L.top && L.bottom)) };
      case 'shoes': return { match: L.shoes === r.v, filled: !!L.shoes };
      case 'acc': { const s = ITEMS[r.v].slot; return { match: L.acc[s] === r.v, filled: !!L.acc[s] }; }
    }
    return { match: false, filled: false };
  }
  function reqIcon(r) {
    if (r.k === 'hairColor') {
      const c = HAIR_COLORS.find(x => x.id === r.v);
      return r.v === 'rainbow' ? ICONS.rainbow : `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" fill="${c.hex}" stroke="#fff" stroke-width="4"/></svg>`;
    }
    if (r.k === 'hair') { const hc = reqs.find(q => q.k === 'hairColor'); return IMG(thumbs.get(`hair:${r.v}:${hc ? hc.v : 'brown'}`)); }
    if (r.k === 'makeup') return IMG(thumbs.get('mk:' + r.v));
    return IMG(thumbs.get('item:' + r.v));
  }
  const reqsHtml = () => reqs.map((r, i) => `<span class="k-req ${matched[i] ? 'done' : ''}" data-r="${i}">${reqIcon(r)}</span>`).join('');
  function checkReqs() {
    if (mode !== 'level') return;
    let newly = false;
    reqs.forEach((r, i) => {
      const st = reqState(r); filled[i] = st.filled;
      if (st.match !== matched[i]) {
        matched[i] = st.match;
        const ic = el.order.querySelector(`[data-r="${i}"]`);
        if (ic) { ic.classList.toggle('done', st.match); if (st.match) { newly = true; restart(ic, 'pop'); } }
      }
    });
    if (newly) later(() => Sound.fx.ding(), 260);
    const all = filled.every(Boolean);
    if (all && !allFilled) {
      allFilled = true; el.fab.classList.add('ready');
      later(() => {
        if (screen !== 'play' || !allFilled || showing) return;
        say('Xong rồi! Bấm máy ảnh để trình diễn nào!', true);
        const p = centerOf(el.fab); FX.burst(p.x, p.y, '#FF7FAA');
      }, 900);
    } else if (!all && allFilled) { allFilled = false; el.fab.classList.remove('ready'); }
  }

  /* ——— bắt đầu chơi ——— */
  function startLevel(n) {
    closeModal();
    mode = 'level'; lvl = n;
    const L = LEVELS[n - 1];
    reqs = L.reqs.map(([k, v]) => ({ k, v }));
    look = BASE_LOOK(); outfit.apply(look, true); resetDoll();
    const target = BASE_LOOK();
    reqs.forEach(r => equip(target, kindOf(r), r.v));
    targetPic = thumbs.look(target);
    matched = reqs.map(() => false); filled = reqs.map(() => false); allFilled = false;
    cat = catOf(reqs[0]);
    show('play'); renderPlay(); checkReqs();
    showIntro(false);
  }
  function startFree() {
    closeModal();
    mode = 'free'; lvl = 0; reqs = []; matched = []; filled = []; allFilled = false;
    look = save.free && save.free.acc ? cloneLook(save.free) : BASE_LOOK();
    outfit.apply(look, true); resetDoll();
    cat = 'hair';
    show('play'); renderPlay();
    later(() => say('Chọn đồ thật xinh nào!', true), 300);
  }
  function showIntro(again) {
    const L = LEVELS[lvl - 1];
    introModal({
      eyebrow: `Màn ${lvl}`, title: L.name, pic: `<img alt="" src="${targetPic}">`, reqs: reqs.map(r => `<span class="k-req">${reqIcon(r)}</span>`).join(''),
      goLabel: again ? 'Tiếp tục' : 'Bắt đầu', voice: `${L.say} Chọn đồ giống hình nhé!`,
      onGo: () => { say(CATS.find(c => c.id === cat).say); resetIdle(); },
    });
    fitModal();
  }

  /* ——— phòng thay đồ ——— */
  function renderPlay() {
    const lv = mode === 'level';
    el.back.innerHTML = lv ? ICONS.back : ICONS.home;
    el.back.setAttribute('aria-label', lv ? 'Về chọn màn' : 'Về menu');
    el.title.textContent = lv ? LEVELS[lvl - 1].name : 'Tự do';
    el.rand.hidden = lv;
    el.order.hidden = !lv;
    if (lv) el.order.innerHTML = `<div class="mini"><img alt="" src="${targetPic}"></div><div class="k-reqs">${reqsHtml()}</div>`;
    el.fab.classList.toggle('ready', !lv || allFilled);
    renderTray();
  }
  function catList() { return CATS.filter(c => U.has('cat:' + c.id) || (mode === 'level' && reqs.some(r => catOf(r) === c.id))); }
  function entries(c) {
    const ok = (code, kind, id) => U.has(code) || wants(kind, id);
    if (c === 'hair') return {
      items: HAIR_STYLES.filter(s => ok('hs:' + s.id, 'hair', s.id)).map(s => ({ kind: 'hair', id: s.id, name: s.name, thumb: `hair:${s.id}:${look.hairColor}` })),
      sub: HAIR_COLORS.filter(s => ok('hc:' + s.id, 'hairColor', s.id)).map(s => ({ kind: 'hairColor', id: s.id, name: s.name, color: s.id === 'rainbow' ? RAINBOW_CSS : s.hex })),
    };
    if (c === 'beauty') return {
      items: MAKEUP.filter(m => ok('mk:' + m.id, 'makeup', m.id)).map(m => ({ kind: 'makeup', id: m.id, name: m.name, thumb: 'mk:' + m.id })),
      sub: LIPS.filter(l => ok('lip:' + l.id, 'lips', l.id)).map(l => ({ kind: 'lips', id: l.id, name: l.name, color: l.hex })),
    };
    return { items: ORDER[c].filter(id => ok(id, 'item', id)).map(id => ({ kind: 'item', id, name: ITEMS[id].name, thumb: 'item:' + id })), sub: [] };
  }
  const nextReq = () => { let i = reqs.findIndex((r, k) => !filled[k]); if (i < 0) i = matched.findIndex(m => !m); return i >= 0 ? reqs[i] : null; };
  function renderTray() {
    const cl = catList();
    if (!cl.some(c => c.id === cat)) cat = cl[0].id;
    const nx = mode === 'level' ? nextReq() : null;
    el.cats.innerHTML = cl.map(c => {
      const mine = reqs.map((r, i) => (catOf(r) === c.id ? i : -1)).filter(i => i >= 0);
      const cls = ['k-tool', c.id === cat && 'on', mine.length && 'req', mine.length && mine.every(i => matched[i]) && 'done', nx && catOf(nx) === c.id && c.id !== cat && 'next'].filter(Boolean).join(' ');
      return `<button class="${cls}" data-cat="${c.id}" aria-label="${c.name}">${CAT_ICONS[c.id]}</button>`;
    }).join('');
    const E = entries(cat), tip = (kind, id) => (wants(kind, id) && !isWorn(look, kind, id) ? `<span class="k-tip">${ICONS.star}</span>` : '');
    el.items.innerHTML = E.items.map(it => `<button class="k-item ${isWorn(look, it.kind, it.id) ? 'on' : ''}" data-kind="${it.kind}" data-id="${it.id}" aria-label="${it.name}">
      <img alt="" src="${thumbs.has(it.thumb) ? thumbs.get(it.thumb) : BLANK}" data-thumb="${it.thumb}">${tip(it.kind, it.id)}</button>`).join('');
    el.sub.innerHTML = E.sub.map(it => `<button class="k-swatch ${isWorn(look, it.kind, it.id) ? 'on' : ''}" data-kind="${it.kind}" data-id="${it.id}" aria-label="${it.name}" style="background:${it.color}">${tip(it.kind, it.id)}</button>`).join('');
    el.items.querySelectorAll('img[data-thumb]').forEach(img => {
      if (img.getAttribute('src') !== BLANK) return;
      thumbs.request(img.dataset.thumb, url => { if (img.isConnected) img.src = url; });
    });
  }

  el.tray.addEventListener('click', e => {
    if (showing) return;
    const c = e.target.closest('[data-cat]');
    if (c) { if (c.dataset.cat !== cat) { cat = c.dataset.cat; Sound.fx.select(); say(CATS.find(x => x.id === cat).say); renderTray(); el.items.scrollLeft = el.items.scrollTop = 0; } resetIdle(); return; }
    const b = e.target.closest('[data-kind]');
    if (b) tapItem(b.dataset.kind, b.dataset.id);
  });

  let bounce = 0;
  function nameOf(kind, id) {
    if (kind === 'hair') return HAIR_STYLES.find(s => s.id === id).name;
    if (kind === 'hairColor') return HAIR_COLORS.find(s => s.id === id).name;
    if (kind === 'makeup') return MAKEUP.find(s => s.id === id).name;
    if (kind === 'lips') return LIPS.find(s => s.id === id).name;
    return ITEMS[id].name;
  }
  function sparkleAt(kind, id, color) {
    const pts = kind === 'item' && ITEMS[id].cat === 'shoes' ? [doll.anchors.footL, doll.anchors.footR] : [outfit.anchor(kind, id)];
    pts.forEach(a => { a.getWorldPosition(v3); const p = stage.toScreen(v3); FX.burst(p.x, p.y, color); FX.sparkle(p.x, p.y, '#FFFFFF', 6); });
  }
  function tapItem(kind, id) {
    Sound.ensure();
    const on = equip(look, kind, id);
    outfit.apply(look);
    if (on) {
      Sound.fx.poof();
      if (kind !== 'item') later(() => Sound.fx.magic(), 120);
      sparkleAt(kind, id, kind === 'hairColor' ? (HAIR_COLORS.find(c => c.id === id).hex) : '#FF7FAA');
      (++bounce % 3 === 0) ? doll.spin() : doll.hop();
      say(nameOf(kind, id), true);
    } else {
      Sound.fx.pop(); doll.face.react({ mouth: 'o' }, 0.6);
    }
    if (mode === 'free') { save.free = cloneLook(look); Store.save(); }
    checkReqs(); renderTray(); resetIdle();
  }

  // Bộ đồ ngẫu nhiên (chế độ Tự do)
  el.rand.addEventListener('click', () => {
    if (showing) return;
    Sound.ensure();
    const has = c => U.has(c), pk = a => (a.length ? pick(a) : null);
    look.hair = pk(HAIR_STYLES.filter(s => has('hs:' + s.id)).map(s => s.id)) || look.hair;
    look.hairColor = pk(HAIR_COLORS.filter(s => has('hc:' + s.id)).map(s => s.id)) || look.hairColor;
    const dresses = has('cat:dress') ? ORDER.dress.filter(has) : [];
    if (dresses.length && Math.random() < 0.45) { look.dress = pick(dresses); look.top = look.bottom = null; }
    else { look.dress = null; look.top = pk(ORDER.top.filter(has)); look.bottom = pk(ORDER.bottom.filter(has)); }
    look.shoes = pk(ORDER.shoes.filter(has));
    look.acc = { head: null, face: null, hand: null, neck: null };
    if (has('cat:acc')) { const accs = ORDER.acc.filter(has); for (let i = 0; i < 2; i++) { const a = pk(accs); if (a && Math.random() < 0.75) look.acc[ITEMS[a].slot] = a; } }
    look.makeup = has('cat:beauty') ? pk(MAKEUP.filter(m => has('mk:' + m.id)).map(m => m.id)) : null; look.lips = null;
    outfit.apply(look); doll.spin(); Sound.fx.magic();
    doll.anchors.chest.getWorldPosition(v3); const p = stage.toScreen(v3); FX.burst(p.x, p.y, '#B48BF0'); FX.hearts(p.x, p.y, 5);
    save.free = cloneLook(look); Store.save();
    say('Ngẫu nhiên nè! Xinh quá!', true);
    renderTray(); resetIdle();
  });
  el.order.addEventListener('click', () => { if (!showing) { Sound.fx.tap(); showIntro(true); } });
  el.back.addEventListener('click', () => { if (showing) return; Sound.fx.tap(); Voice.stop(); mode === 'level' ? openLevels() : openMenu(); });
  el.fab.addEventListener('click', () => {
    if (showing) return;
    Sound.ensure();
    if (mode === 'level' && !allFilled) {
      restart(el.fab, 'nope'); Sound.fx.boop(); say('Còn thiếu một chút nữa nè!', true);
      later(idleHint, 900); return;
    }
    runShow();
  });

  /* ——— kéo để xoay búp bê, chạm để búp bê nhảy ——— */
  let drag = null, backT = 0;
  const cv = stage.canvas;
  cv.addEventListener('pointerdown', e => {
    if (showing || (screen !== 'play' && screen !== 'menu')) return;
    Sound.ensure(); cancel(backT); Tweens.kill(doll.root.rotation);
    drag = { id: e.pointerId, x: e.clientX, rot: doll.root.rotation.y, moved: false };
    try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  });
  cv.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 6) drag.moved = true;
    if (drag.moved) doll.root.rotation.y = drag.rot + dx * 0.013;
  });
  const endDrag = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved; drag = null;
    if (moved) {
      backT = later(() => {
        let r = doll.root.rotation.y % TAU; if (r > Math.PI) r -= TAU; if (r < -Math.PI) r += TAU;
        doll.root.rotation.y = r; Tweens.add(doll.root.rotation, { y: 0 }, 0.9, { ease: Ease.outCubic });
      }, 1000);
    } else if (e.type === 'pointerup' && stage.raycast(e, [doll.root]).length) {
      doll.hop(); Sound.fx.boing(); FX.hearts(e.clientX, e.clientY, 5);
      if (screen === 'menu') Voice.say('Chào bạn! Cùng chọn đồ thật xinh nhé!'); else say(pick(PRAISE));
    }
    resetIdle();
  };
  cv.addEventListener('pointerup', endDrag);
  cv.addEventListener('pointercancel', endDrag);

  /* ——— bàn tay gợi ý khi bé chưa biết làm gì ——— */
  let idleT = 0;
  function resetIdle() { cancel(idleT); hand.hide(); if ((screen === 'play' || screen === 'menu') && !showing) idleT = later(idleHint, 7000); }
  function hintTarget() {
    if (screen === 'menu') return root.querySelector('[data-act="levels"]');
    if (mode === 'level') {
      if (allFilled) return el.fab;
      const r = nextReq(); if (!r) return el.fab;
      if (catOf(r) !== cat) return el.cats.querySelector(`[data-cat="${catOf(r)}"]`);
      return el.tray.querySelector(`[data-kind="${kindOf(r)}"][data-id="${r.v}"]`);
    }
    if (itemKeys(look).length >= 3) return el.fab;
    const free = [...el.items.querySelectorAll('[data-kind]:not(.on)')];
    if (free.length && cat !== 'hair') return pick(free);
    const cl = catList().map(c => c.id).filter(c => c !== cat && c !== 'hair' && c !== 'beauty');
    const empty = cl.find(c => (c === 'acc' ? !Object.values(look.acc).some(Boolean) : c === 'dress' ? false : !look[c] && !(look.dress && (c === 'top' || c === 'bottom'))));
    return el.cats.querySelector(`[data-cat="${empty || cl[0] || 'hair'}"]`);
  }
  function idleHint() {
    if (!alive || showing || modalOpen() || drag || (screen !== 'play' && screen !== 'menu')) return;
    const t = hintTarget(); if (!t) return;
    t.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    hand.pointAt(t, 'tap');
  }
  const onDocDown = e => { if (!e.target.closest || !e.target.closest('.k-modal')) resetIdle(); };
  document.addEventListener('pointerdown', onDocDown, true);

  /* ——— sàn diễn ——— */
  async function runShow() {
    showing = true; hand.hide(); cancel(idleT); cancel(backT); Voice.stop(); say.bubble('');
    root.classList.add('tt-show');
    Sound.fx.whoosh();
    boutique.group.visible = false; runway.group.visible = true; stage.scene.background = runway.sky;
    stage.hemi.intensity = 1.05;
    Tweens.kill(doll.root.rotation); Tweens.kill(doll.root.position); Tweens.kill(cam.position); Tweens.kill(look3);
    doll.root.rotation.y = 0; doll.root.position.set(0, 0, -7.5);
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), aspect = stage.width / Math.max(1, stage.height);
    const endZ = 1.0, dist = Math.max(6.0 / (2 * half), 3.8 / (2 * half * aspect));
    cam.position.set(0, 2.15 + dist * 0.12, endZ + dist); look3.set(0, 2.3, -7.5);
    runway.flashing = true;
    await wait(0.5); if (!alive) return;
    Sound.fx.cheer(); say('Trình diễn nào!', true);
    doll.walking = true;
    const step = () => { if (doll.walking) { Sound.fx.step(); later(step, 300); } };
    step();
    Tweens.add(look3, { y: 2.15, z: endZ }, 4.2, { ease: Ease.inOutSine });
    await Tweens.to(doll.root.position, { z: endZ }, 4.2, { ease: Ease.linear }); if (!alive) return;
    doll.walking = false;
    doll.spin(); Sound.fx.magic(); runway.burst();
    await wait(1.0); if (!alive) return;
    outfit.wave(); Sound.fx.cheer();
    doll.anchors.headTop.getWorldPosition(v3); const hp = stage.toScreen(v3); FX.hearts(hp.x, hp.y, 8);
    await wait(0.8); if (!alive) return;
    const photo = capture(endZ);
    flash(); runway.burst(); runway.flashing = false;
    await wait(0.7); if (!alive) return;
    finishShow(photo);
  }
  // Chụp ảnh vuông: đặt tạm máy quay sao cho cả búp bê vừa khung vuông giữa màn hình, vẽ một khung rồi cắt ảnh
  function capture(z) {
    const src = stage.canvas, W = stage.width, H = stage.height, side = Math.min(W, H);
    const half = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), dist = (5.5 * H / side) / (2 * half);
    const keep = cam.position.clone(), keepLook = look3.clone();
    cam.position.set(0, 2.45, z + dist); look3.set(0, 2.3, z); cam.lookAt(look3);
    stage.renderer.render(stage.scene, cam);
    const k = src.width / Math.max(1, W), s = side * k;
    const out = document.createElement('canvas'); out.width = out.height = 320;
    const g = out.getContext('2d'); g.fillStyle = '#4A2A66'; g.fillRect(0, 0, 320, 320);
    try { g.drawImage(src, (src.width - s) / 2, (src.height - s) / 2, s, s, 0, 0, 320, 320); } catch (_) {}
    cam.position.copy(keep); look3.copy(keepLook); cam.lookAt(look3);
    return out.toDataURL('image/jpeg', 0.82);
  }
  function endShow() {
    showing = false; root.classList.remove('tt-show');
    boutique.group.visible = true; runway.group.visible = false; stage.scene.background = boutique.sky;
    stage.hemi.intensity = 1.25; doll.walking = false; resetDoll();
    reframe(true); resetIdle();
  }
  function finishShow(photo) {
    const lv = mode === 'level';
    let stars = 0, gifts = [], rank = 1;
    if (lv) {
      const m = reqs.filter(r => reqState(r).match).length;
      stars = m === reqs.length ? 3 : m >= reqs.length / 2 ? 2 : 1;
      const before = doneCount();
      save.stars[lvl] = Math.max(save.stars[lvl] || 0, stars);
      const after = doneCount();
      for (let n = before + 1; n <= after; n++) if (GIFTS[n]) gifts.push(...GIFTS[n]);
      if (after > before) { U = unlockedSet(after); boutique.setGold(after >= 12); }
      rank = after + 1;
    }
    save.album.unshift({ img: photo, stars, lvl: lv ? lvl : 0, d: Date.now() });
    save.album = save.album.slice(0, 20);
    Store.save();
    const title = lv ? ['Giỏi lắm!', 'Đẹp quá!', 'Tuyệt vời!'][stars - 1] : 'Ảnh đẹp quá!';
    const withGift = next => () => { endShow(); if (gifts.length) showGift(gifts, rank, next); else next(); };
    resultModal({
      title, stars, pic: `<img alt="" src="${photo}">`,
      caption: `<span>${lv ? LEVELS[lvl - 1].name : 'Thời Trang Xinh'}</span>${lv ? `<span>Màn ${lvl}</span>` : ''}`,
      buttons: lv ? [
        { label: 'Chơi tiếp', icon: ICONS.play, onClick: withGift(() => (lvl < LEVELS.length ? startLevel(lvl + 1) : openLevels())) },
        { label: 'Chơi lại', icon: ICONS.replay, cls: 'ghost small', onClick: withGift(() => startLevel(lvl)) },
      ] : [
        { label: 'Chơi tiếp', icon: ICONS.play, onClick: () => { endShow(); renderPlay(); } },
        { label: 'Album', icon: ICONS.album, cls: 'lilac small', onClick: () => { endShow(); openAlbum(); } },
      ],
      voice: lv ? `${title} Bé được ${stars} ngôi sao!` : 'Ảnh đẹp quá! Đã cất vào album rồi nhé!',
    });
    fitModal();
  }
  function giftPic(code) {
    const sw = (c) => `<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="${c}" stroke="#fff" stroke-width="4"/></svg>`;
    const [p, id] = code.includes(':') ? code.split(':') : ['item', code];
    if (code === 'trophy') return { pic: ICONS.trophy, label: 'Cúp Siêu Sao' };
    if (p === 'cat') { const c = CATS.find(x => x.id === id); return { pic: CAT_ICONS[id], label: c.name }; }
    if (p === 'hs') return { pic: IMG(thumbs.get(`hair:${id}:brown`)), label: HAIR_STYLES.find(s => s.id === id).name };
    if (p === 'hc') { const c = HAIR_COLORS.find(s => s.id === id); return { pic: id === 'rainbow' ? ICONS.rainbow : sw(c.hex), label: c.name, round: true }; }
    if (p === 'mk') return { pic: IMG(thumbs.get('mk:' + id)), label: MAKEUP.find(m => m.id === id).name };
    if (p === 'lip') { const l = LIPS.find(s => s.id === id); return { pic: sw(l.hex), label: l.name, round: true }; }
    return { pic: IMG(thumbs.get('item:' + id)), label: ITEMS[id].name };
  }
  function showGift(codes, rank, next) {
    const items = codes.slice(0, 8).map(giftPic);
    giftModal({ rank, title: RANKS[Math.min(rank - 1, RANKS.length - 1)], items, onNext: next });
  }

  /* ——— khởi động ——— */
  openMenu();
  later(() => Voice.say('Thời Trang Xinh! Cùng chọn đồ thật xinh nào!'), 400);
  // vẽ sẵn ảnh nhỏ cho các nhóm đồ đầu tiên khi rảnh
  later(() => ['top', 'bottom', 'shoes'].forEach(c => entries(c).items.forEach(it => thumbs.request(it.thumb, () => {}))), 1500);

  return {
    destroy() {
      alive = false;
      timers.forEach(t => clearTimeout(t)); timers.clear();
      document.removeEventListener('pointerdown', onDocDown, true);
      ro.disconnect(); hand.hide(); closeModal(); FX.clear();
      thumbs.dispose();
      stage.dispose();
      outfit.dispose(); boutique.dispose(); runway.dispose(); M.dispose();
      Voice.stop();
    },
  };
}
