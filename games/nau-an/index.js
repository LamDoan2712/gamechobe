// index.js — Bé Nấu Ăn: màn hình chính, sổ món, nấu từng bước, món ăn hiện ra, học được gì, câu đố, quà, sổ tay & nhiệm vụ ở nhà.

import { THREE, Tweens, Ease, wait } from '../../kit/three-kit.js';
import * as ui from '../../kit/ui.js';
import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { Store } from '../../kit/store.js';
import { RECIPES, WHO, FOODS, MILESTONES, RANKS, PRAISE_COOK, YUM, doneCount, playable, rankOf, giftsOf, starsFromQuality } from './data.js';
import { createKitchen, makeChef, SPOT } from './kitchen.js';
import { startStep } from './steps.js';
import { dishThumbs } from './thumbs.js';
import { AVATAR, ACTION, FOOD, GARNISH_ICON, GIFT } from './icons.js';
import { RECIPES_A } from './recipes-a.js';

const { ICONS } = ui;
const IMPL = Object.assign({}, RECIPES_A);
// Các món còn lại nạp thêm nếu có (recipes-b.js, recipes-c.js, family.js)
async function loadMore() {
  for (const f of ['./recipes-b.js', './recipes-c.js', './family.js']) {
    try { const m = await import(f); Object.assign(IMPL, m.RECIPES || {}); } catch (e) { /* chưa có file này */ }
  }
}

let game = null;
export default {
  async mount(root, ctx) { await loadMore(); game = createGame(root, ctx); },
  unmount() { if (game) { game.destroy(); game = null; } },
};

const pick = a => a[Math.floor(Math.random() * a.length)];
const sized = (svg, px) => svg.replace('<svg', `<svg width="${px}" height="${px}"`);

function template() {
  return `
  <div class="na-stage"></div>
  <section class="k-screen na-menu" data-screen="menu" hidden>
    <div class="k-bar"><button class="k-round" data-act="hub" aria-label="Về trang chọn game">${ICONS.home}</button><div class="k-title"></div><div class="k-toggles"></div></div>
    <div class="na-menu-body">
      <h1 class="na-logo"><span class="a">Bé</span><span class="b">Nấu Ăn</span></h1>
      <div class="na-spot" data-spot></div>
      <div class="na-chips"><div class="k-chip na-rank"></div><div class="k-chip na-helped"></div></div>
      <div class="na-menu-btns">
        <button class="k-btn na-big" data-act="book">${ACTION.pot}<span>Nấu ăn</span></button>
        <button class="k-btn mint" data-act="notebook">${ACTION.book}<span>Sổ tay</span></button>
      </div>
    </div>
  </section>
  <section class="k-screen na-book" data-screen="book" hidden>
    <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Quay lại">${ICONS.back}</button><div class="k-title">Hôm nay nấu món gì?</div><div class="k-toggles"></div></div>
    <div class="na-cards" data-list="book"></div>
  </section>
  <section class="k-screen na-notebook" data-screen="notebook" hidden>
    <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Quay lại">${ICONS.back}</button><div class="k-title">Sổ tay đầu bếp</div><div class="k-toggles"></div></div>
    <p class="na-note-intro">Bé đã nấu những món này. Chạm vào một món để xem cách làm và nhiệm vụ giúp ba mẹ ở nhà.</p>
    <div class="na-cards" data-list="notes"></div>
  </section>
  <section class="k-screen na-cook" data-screen="cook" hidden>
    <div class="na-top">
      <div class="k-bar"><button class="k-round" data-act="quit" aria-label="Quay lại">${ICONS.back}</button><div class="na-dots"></div><div class="k-toggles"></div></div>
      <div class="na-banner"><span class="na-who"></span><span class="na-text"></span></div>
    </div>
    <div class="na-flag" hidden>Dừng!</div>
    <div class="na-counter" hidden></div>
    <div class="na-timer" hidden><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" class="bg"/><circle cx="32" cy="32" r="26" class="fg"/></svg><span></span></div>
    <div class="k-bubble na-bubble"></div>
    <div class="na-bottom">
      <div class="na-progress" hidden><span class="ico"></span><div class="bar"><div class="fill"></div></div></div>
      <div class="na-adult" hidden>
        <div class="av"></div>
        <div class="txt"><span class="badge"></span><b class="line"></b></div>
        <button class="k-btn sun na-help"><span class="ico"></span><span class="lbl"></span></button>
      </div>
      <div class="na-palette" hidden><div class="k-row-scroll items"></div><button class="k-btn na-done" hidden>${ICONS.check}<span>Xong rồi</span></button></div>
    </div>
  </section>`;
}

function createGame(root, ctx) {
  const save = Store.game('nau-an', { stars: {}, helped: {}, photos: {}, quiz: {} });
  ['stars', 'helped', 'photos', 'quiz'].forEach(k => { if (!save[k] || typeof save[k] !== 'object') save[k] = {}; });
  root.innerHTML = template();
  const $ = s => root.querySelector(s);
  const screens = {}; root.querySelectorAll('[data-screen]').forEach(el => (screens[el.dataset.screen] = el));
  root.querySelectorAll('.k-toggles').forEach(el => ui.toggles(el));
  const say = ui.speaker($('.na-bubble'));
  const cleanups = [], listen = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); cleanups.push(() => t.removeEventListener(ev, fn, o)); };

  const K = createKitchen($('.na-stage'));
  K.say = (text, force) => say(text, force);
  let screen = null, session = null, current = null, idle = 0, hintN = 0, chef = null, menuDish = null;

  /* ——— màn hình ——— */
  function show(name) {
    screen = name; for (const k in screens) screens[k].hidden = k !== name;
    ui.hand.hide(); idle = 0;
    if (name === 'book' || name === 'notebook') K.stage.stop(); else K.stage.start();
    requestAnimationFrame(measure);
  }
  function measure() {
    const W = root.clientWidth, H = root.clientHeight, rr = root.getBoundingClientRect();
    if (screen === 'menu') {
      const sp = $('.na-spot').getBoundingClientRect();
      K.setInsets(sp.top - rr.top, H - (sp.bottom - rr.top)); return;
    }
    if (screen !== 'cook') return;
    const top = $('.na-top').getBoundingClientRect().bottom - rr.top + 8;
    let bottom = 16, right = 0;
    const vis = [...$('.na-bottom').children].filter(c => !c.hidden);
    if (vis.length) {
      const b = $('.na-bottom').getBoundingClientRect();
      if (b.height > H * 0.55 && b.left - rr.left > W * 0.4) right = W - (b.left - rr.left) + 8; else bottom = H - (b.top - rr.top) + 8;
    }
    K.setInsets(top, bottom, 0, right);
  }
  listen(window, 'resize', () => requestAnimationFrame(measure));

  /* ——— menu ——— */
  function showMenu() {
    endSession(); show('menu');
    K.clear(); chef = null;
    const gifts = giftsOf(save);
    chef = makeChef(gifts); chef.root.position.set(-0.9, 0, 0.3); chef.root.scale.setScalar(0.62); K.ws.add(chef.root);
    const last = [...RECIPES].reverse().find(r => save.stars[r.id] && IMPL[r.id]) || RECIPES[0];
    menuDish = IMPL[last.id] ? IMPL[last.id].final() : null;
    if (menuDish) { menuDish.position.set(1.1, 0, 0.6); K.ws.add(menuDish); K.steam(menuDish, { rate: 4, size: 0.8, y: 0.6, spread: 0.6 }); }
    K.view(new THREE.Vector3(0, 1.3, 0.3), 4.6, 3.3, 0.35); K.snapView();
    const r = rankOf(save), helped = Object.values(save.helped).reduce((a, b) => a + b, 0);
    $('.na-rank').innerHTML = `<span class="badge">${r}</span><span class="txt"><span class="lv">Cấp ${r}</span><span class="name">${RANKS[Math.min(r, RANKS.length) - 1]}</span></span>`;
    $('.na-helped').innerHTML = `<span class="badge heart">${ACTION.heart}</span><span class="txt"><span class="lv">Giúp ba mẹ</span><span class="name">${helped} lần</span></span>`;
    setTimeout(() => { if (screen === 'menu') chef && chef.wave(); }, 600);
    requestAnimationFrame(measure);
  }

  /* ——— sổ món ——— */
  const thumbs = () => dishThumbs(RECIPES.filter(r => IMPL[r.id]).map(r => ({ id: r.id, make: () => IMPL[r.id].final() })));
  function showBook() {
    endSession(); show('book');
    const th = thumbs();
    $('[data-list="book"]').innerHTML = RECIPES.map((r, i) => {
      const ok = playable(save, i) && IMPL[r.id], st = save.stars[r.id] || 0, soon = !IMPL[r.id];
      return `<button class="na-card ${ok ? '' : 'locked'} ${!st && ok ? 'next' : ''}" data-i="${i}" style="--c:${r.color}" aria-label="${r.name}${ok ? '' : ' (chưa mở)'}">
        <span class="pic">${th[r.id] ? `<img src="${th[r.id]}" alt="">` : sized(ACTION.pot, 80)}</span>
        <span class="name">${r.name}</span>
        ${st ? ui.starsHtml(st) : ok ? '<span class="tag">Món mới!</span>' : `<span class="lock">${ICONS.lock}</span>${soon ? '<span class="tag soon">Sắp có</span>' : ''}`}
      </button>`;
    }).join('');
    const nx = $('[data-list="book"] .next'); if (nx) requestAnimationFrame(() => nx.scrollIntoView({ block: 'center' }));
    Voice.say('Hôm nay bé muốn nấu món gì nào?');
  }
  function intro(i) {
    const r = RECIPES[i], th = thumbs();
    const steps = r.steps.map((s, k) => `<span class="k-req na-step ${WHO[s.who].cls}"><b>${k + 1}</b>${s.who === 'kid' ? ACTION.kid : s.who === 'adult' ? AVATAR.me : ACTION.kid}</span>`).join('');
    ui.introModal({
      eyebrow: `Món số ${i + 1}`, title: r.name, pic: th[r.id] ? `<img src="${th[r.id]}" alt="${r.name}">` : '',
      reqs: steps + `<p class="na-legend"><span class="kid">Bé làm</span><span class="adult">Ba mẹ làm</span></p>`,
      goLabel: 'Nấu thôi!', onGo: () => cook(i), voice: `Hôm nay mình nấu ${r.name} nhé! ${r.desc}.`,
    });
  }

  /* ——— nấu ăn ——— */
  const env = {
    K, get ws() { return session && session.ws; },
    say: (t, f) => say(t, f),
    touched() { idle = 0; hintN = 0; ui.hand.hide(); },
    progress(p) { const el = $('.na-progress'); if (p === null) { el.hidden = true; el.querySelector('.fill').style.width = '0%'; measure(); return; } if (el.hidden) { el.hidden = false; measure(); } el.querySelector('.fill').style.width = Math.round(Math.min(1, p) * 100) + '%'; },
    counter(n, total) {
      const el = $('.na-counter'); if (n === null) { el.hidden = true; return; }
      el.hidden = false; el.innerHTML = Array.from({ length: total }, (_, k) => `<span class="${k < n ? 'on' : ''}">${k + 1}</span>`).join('');
      if (n) ui.restart(el.children[n - 1], 'pop');
    },
    flag(text) { const el = $('.na-flag'); el.hidden = !text; if (text) { el.textContent = text; ui.restart(el, 'pop'); } },
    timer(secs) {
      const el = $('.na-timer'); if (!secs) { el.hidden = true; clearInterval(env._tm); return; }
      el.hidden = false; let left = secs; const fg = el.querySelector('.fg'), sp = el.querySelector('span');
      fg.style.transition = 'none'; fg.style.strokeDashoffset = '0'; void fg.getBoundingClientRect();
      fg.style.transition = `stroke-dashoffset ${secs}s linear`; fg.style.strokeDashoffset = '163';
      sp.textContent = left; clearInterval(env._tm); env._tm = setInterval(() => { left--; if (left >= 0) sp.textContent = left; }, 1000);
    },
    hand(x, y, mode) { ui.hand.point(x, y, { rub: 'rub', tap: 'tap' }[mode] || 'na-' + mode); },
    handPath(a, b) { ui.hand.point(a.x, a.y, 'na-path'); const h = document.querySelector('.k-hand'); if (h) { h.style.setProperty('--dx', (b.x - a.x) + 'px'); h.style.setProperty('--dy', (b.y - a.y) + 'px'); } },
    adult(s, run, done) {
      const el = $('.na-adult'), who = s.who === 'ba' ? 'ba' : 'mẹ', act = s.action || 'cut';
      el.hidden = false; el.className = 'na-adult ' + act;
      el.querySelector('.av').innerHTML = AVATAR[s.who === 'ba' ? 'ba' : 'me'];
      el.querySelector('.badge').innerHTML = `${ACTION[act] || ACTION.hot}<span>Ba mẹ làm</span>`;
      el.querySelector('.line').textContent = s.safety || { cut: 'Dao sắc lắm, bé đứng xem thôi nhé!', stove: 'Bếp nóng! Bé đứng xa bếp nhé!', hot: 'Đồ nóng, để ba mẹ làm nhé!' }[act] || 'Việc này để ba mẹ làm nhé!';
      const btn = el.querySelector('.na-help');
      btn.hidden = false; btn.disabled = false; btn.className = 'k-btn sun na-help';
      btn.querySelector('.ico').innerHTML = ACTION.heart; btn.querySelector('.lbl').textContent = `Nhờ ${who} giúp`;
      let phase = 0;
      btn.onclick = async () => {
        if (phase === 0) {
          phase = 1; env.touched(); Sound.fx.select(); say(`${who === 'mẹ' ? 'Mẹ' : 'Ba'} ơi, giúp con với!`, true);
          btn.disabled = true; btn.querySelector('.lbl').textContent = `${who === 'mẹ' ? 'Mẹ' : 'Ba'} đang làm…`; btn.classList.add('busy');
          await run();
          if (!session) return;
          phase = 2; btn.disabled = false; btn.classList.remove('busy'); btn.className = 'k-btn na-help thanks';
          btn.querySelector('.lbl').textContent = `Con cảm ơn ${who} ạ!`; say(`Bé nói cảm ơn ${who} nhé!`, true);
          ui.restart(btn, 'pop');
        } else if (phase === 2) {
          phase = 3; Sound.fx.magic(); const c = ui.centerOf(btn); FX.hearts(c.x, c.y, 8);
          say(`Con cảm ơn ${who} ạ!`, true); await wait(0.9); done();
        }
      };
      measure();
    },
    adultClose() { $('.na-adult').hidden = true; measure(); },
    hintAdult() { const b = $('.na-adult .na-help'); if (b && !b.disabled) ui.hand.pointAt(b, 'tap'); },
    palette(items, onPick, onDone) {
      const el = $('.na-palette');
      if (!items) { el.hidden = true; measure(); return; }
      el.hidden = false; const row = el.querySelector('.items'), done = el.querySelector('.na-done'); done.hidden = true;
      row.innerHTML = items.map((g, k) => `<button class="k-item ${k ? '' : 'on'}" data-g="${g.key}" aria-label="${g.name}">${GARNISH_ICON[g.key] || ''}</button>`).join('');
      row.onclick = e => { const b = e.target.closest('[data-g]'); if (!b) return; row.querySelectorAll('.k-item').forEach(x => x.classList.toggle('on', x === b)); Sound.fx.select(); say(items.find(g => g.key === b.dataset.g).name); onPick(b.dataset.g); };
      done.onclick = () => { Sound.fx.pop(); onDone(); };
      measure();
    },
    paletteDone(v) { const d = $('.na-palette .na-done'); d.hidden = !v; if (v) { ui.restart(d, 'pop'); say('Đẹp quá! Bấm Xong rồi khi bé bày xong nhé!'); } },
  };

  function endSession() {
    if (current) { try { current.dispose(); } catch (e) {} current = null; }
    session = null; ui.hand.hide(); ui.closeModal();
    env.progress(null); env.counter(null); env.flag(null); env.timer(null); env.adultClose(); env.palette(null);
  }

  async function cook(i) {
    endSession();
    const meta = RECIPES[i], impl = IMPL[meta.id]; if (!impl) return;
    const S = session = { i, ws: null, qs: [] };
    show('cook'); K.clear();
    S.ws = impl.build(K);
    $('.na-dots').innerHTML = meta.steps.map((s, k) => `<span class="${WHO[s.who].cls}" data-k="${k}">${k + 1}</span>`).join('');
    for (let k = 0; k < impl.steps.length; k++) {
      const st = impl.steps[k], m = meta.steps[k] || { who: 'kid', text: '' };
      root.querySelectorAll('.na-dots span').forEach((d, j) => { d.classList.toggle('now', j === k); d.classList.toggle('done', j < k); });
      $('.na-who').className = 'na-who ' + WHO[m.who].cls;
      $('.na-who').innerHTML = `${m.who === 'adult' ? AVATAR.me : ACTION.kid}<span>${WHO[m.who].label}</span>`;
      $('.na-text').textContent = m.text; ui.restart($('.na-banner'), 'pop');
      measure();
      if (st.setup) await st.setup(S.ws, K, env);
      if (session !== S) return;
      say(st.voice || m.text, true);
      idle = 0; hintN = 0;
      S.step = st; S.k = k;
      current = startStep(st, env);
      const q = await current.promise;
      if (session !== S) return;
      current.dispose(); current = null; S.qs.push(q);
      env.progress(null); env.counter(null); env.flag(null);
      Sound.fx.ding();
      if (k < impl.steps.length - 1 && (k % 2 === 1 || m.who !== 'adult')) say(pick(PRAISE_COOK));
      await wait(0.7); if (session !== S) return;
    }
    root.querySelectorAll('.na-dots span').forEach(d => { d.classList.remove('now'); d.classList.add('done'); });
    await reveal(S, meta, impl);
  }

  async function reveal(S, meta, impl) {
    const dish = impl.reveal(S.ws);
    $('.na-banner').hidden = true;
    const p = dish.getWorldPosition(new THREE.Vector3()), bs = new THREE.Box3().setFromObject(dish).getBoundingSphere(new THREE.Sphere());
    K.view(bs.center.clone(), Math.max(2.4, bs.radius * 2.4), Math.max(2.2, bs.radius * 2.2), 0.7); await wait(0.9); if (session !== S) return;
    const c = K.toScreen(p.clone().setY(p.y + 0.6)); FX.burst(c.x, c.y, '#FFD34D'); FX.sparkle(c.x - 60, c.y, '#FFFFFF', 8); FX.sparkle(c.x + 60, c.y, '#FFFFFF', 8);
    Sound.fx.yum(); say(pick(YUM), true);
    const spin = K.onFrame(dt => { dish.rotation.y += dt * 0.5; });
    await wait(1.6); if (session !== S) { spin(); return; }
    const photo = takePhoto(dish);
    spin(); $('.na-banner').hidden = false;
    const q = S.qs.reduce((a, b) => a + b, 0) / Math.max(1, S.qs.length), stars = starsFromQuality(q);
    const before = doneCount(save), first = !save.stars[meta.id];
    save.stars[meta.id] = Math.max(save.stars[meta.id] || 0, stars);
    if (photo) save.photos[meta.id] = photo;
    Store.save();
    const after = doneCount(save), gift = first && MILESTONES[after] && after > before ? MILESTONES[after] : null;
    ui.resultModal({
      title: 'Ngon quá!', stars,
      pic: photo ? `<img src="${photo}" alt="${meta.name}">` : '',
      caption: `<span>${meta.name}</span><span class="na-cap-heart">${sized(ACTION.heart, 22)}</span>`,
      buttons: [
        { label: 'Tiếp tục', icon: ICONS.play, onClick: () => learnCard(meta, gift) },
        { label: 'Nấu lại', icon: ICONS.replay, cls: 'ghost', onClick: () => cook(S.i) },
      ],
      voice: `${meta.name} ngon quá! Bé được ${stars} ngôi sao!`,
    });
  }

  function takePhoto(dish) {
    const W = K.stage.width, H = K.stage.height, s = Math.floor(Math.min(W, H) * 0.8);
    if (s < 20) return '';
    // khung ảnh theo đúng cỡ món (đĩa gỏi cuốn to hơn chén nước cam)
    const bs = new THREE.Box3().setFromObject(dish).getBoundingSphere(new THREE.Sphere()), cam = K.camera;
    const size = Math.max(1.1, bs.radius * 1.2);
    K.setInsets(0, 0); K.view(bs.center.clone(), size, size, 0.78); K.applyNow();
    K.stage.renderer.render(K.scene, cam);
    let url = '';
    try {
      const src = K.stage.renderer.domElement, k = src.width / W, out = document.createElement('canvas'); out.width = out.height = 320;
      out.getContext('2d').drawImage(src, ((W - s) / 2) * k, ((H - s) / 2) * k, s * k, s * k, 0, 0, 320, 320);
      url = out.toDataURL('image/jpeg', 0.85);
    } catch (e) { url = ''; }
    ui.flash(); measure();
    return url;
  }

  function learnCard(meta, gift) {
    const rows = meta.steps.map((s, k) => `<li class="${WHO[s.who].cls}"><span class="n">${k + 1}</span><span class="w">${s.who === 'adult' ? AVATAR.me : ACTION.kid}</span><span class="t">${s.text}</span></li>`).join('');
    ui.modal(`<div class="k-eyebrow">Bé học được gì?</div><h2>${meta.name}</h2>
      <ol class="na-learn">${rows}</ol>
      <div class="na-tip"><b>Mẹo nhỏ</b><span>${meta.tip}</span></div>
      <div class="na-fact">${ACTION.heart}<span>${meta.fact}</span></div>
      <button class="k-btn" data-next>${ICONS.play}<span>Tiếp tục</span></button>`, c => {
      c.querySelector('[data-next]').onclick = () => { Sound.fx.pop(); ui.closeModal(); meta.quiz ? quiz(meta, gift) : afterAll(meta, gift); };
    });
    Voice.say(meta.fact, true);
  }
  function quiz(meta, gift) {
    const q = meta.quiz; let done = false;
    ui.modal(`<div class="k-eyebrow">Câu đố nhỏ</div><h2>${q.q}</h2>
      <div class="na-quiz">${q.options.map(o => `<button class="na-opt" data-o="${o}" aria-label="${FOODS[o]}">${FOOD[o]}<span>${FOODS[o]}</span></button>`).join('')}</div>
      <button class="k-btn" data-next hidden>${ICONS.play}<span>Tiếp tục</span></button>`, c => {
      c.querySelectorAll('[data-o]').forEach(b => {
        b.onclick = () => {
          if (done) return;
          if (b.dataset.o === q.a) {
            done = true; b.classList.add('right'); Sound.fx.ding(); const p = ui.centerOf(b); FX.burst(p.x, p.y, '#FFD34D');
            Voice.say('Đúng rồi! Giỏi quá!', true); save.quiz[meta.id] = true; Store.save();
            const n = c.querySelector('[data-next]'); n.hidden = false; ui.restart(n, 'pop');
          } else { ui.restart(b, 'nope'); Sound.fx.boop(); Voice.say('Chưa đúng rồi, bé thử lại nhé!', true); }
        };
      });
      c.querySelector('[data-next]').onclick = () => { Sound.fx.pop(); ui.closeModal(); afterAll(meta, gift); };
    });
    Voice.say(q.q, true);
  }
  function afterAll(meta, gift) {
    const next = () => { showMission(meta, () => showBook()); };
    if (gift) ui.giftModal({ rank: rankOf(save), title: RANKS[Math.min(rankOf(save), RANKS.length) - 1], items: [{ pic: GIFT[gift.gift], label: gift.name }], onNext: next });
    else next();
  }

  /* ——— nhiệm vụ ở nhà (ba mẹ xác nhận) ——— */
  function showMission(meta, onClose) {
    const n = save.helped[meta.id] || 0;
    ui.modal(`<div class="k-eyebrow">Nhiệm vụ ở nhà</div><h2>Nấu cùng ba mẹ nhé!</h2>
      <div class="na-mission">${AVATAR.be}<p>${meta.mission}</p></div>
      <p class="na-parent">Ba mẹ ơi: khi bé giúp thật trong bếp, hãy <b>giữ nút tim</b> để tặng bé một trái tim vàng.</p>
      <button class="na-hold" aria-label="Ba mẹ giữ để xác nhận">${ACTION.heart}<span>Giữ để xác nhận</span><i></i></button>
      <p class="na-helped-count">${n ? `Bé đã giúp món này ${n} lần` : ''}</p>
      <button class="k-btn ghost small" data-close>${ICONS.check}<span>Để lúc khác</span></button>`, c => {
      const hold = c.querySelector('.na-hold');
      ui.holdToOpen(hold, 1500, () => {
        save.helped[meta.id] = (save.helped[meta.id] || 0) + 1; Store.save();
        Sound.fx.fanfare(); FX.confetti(); const p = ui.centerOf(hold); FX.hearts(p.x, p.y, 12);
        Voice.say('Bé giỏi quá! Cảm ơn bé đã giúp ba mẹ!', true);
        hold.classList.add('got'); hold.querySelector('span').textContent = 'Bé nhận trái tim vàng!';
        c.querySelector('.na-helped-count').textContent = `Bé đã giúp món này ${save.helped[meta.id]} lần`;
        c.querySelector('[data-close] span').textContent = 'Tuyệt vời!';
      });
      c.querySelector('[data-close]').onclick = () => { Sound.fx.tap(); ui.closeModal(); onClose && onClose(); };
    });
    Voice.say(meta.mission, true);
  }

  /* ——— sổ tay ——— */
  function showNotebook() {
    endSession(); show('notebook');
    const list = RECIPES.filter(r => save.stars[r.id]);
    $('[data-list="notes"]').innerHTML = list.length ? list.map(r => {
      const i = RECIPES.indexOf(r), h = save.helped[r.id] || 0, ph = save.photos[r.id] || thumbs()[r.id];
      return `<button class="na-card note" data-note="${i}" style="--c:${r.color}"><span class="pic">${ph ? `<img src="${ph}" alt="">` : ''}</span>
        <span class="name">${r.name}</span>${ui.starsHtml(save.stars[r.id])}${h ? `<span class="hearts">${sized(ACTION.heart, 18)} ${h}</span>` : ''}</button>`;
    }).join('') : `<div class="na-empty">${sized(ACTION.book, 110)}<span>Sổ tay còn trống</span><span class="sub">Nấu món đầu tiên để ghi vào sổ nhé!</span></div>`;
  }
  function noteCard(i) {
    const r = RECIPES[i], ph = save.photos[r.id] || thumbs()[r.id];
    const rows = r.steps.map((s, k) => `<li class="${WHO[s.who].cls}"><span class="n">${k + 1}</span><span class="w">${s.who === 'adult' ? AVATAR.me : ACTION.kid}</span><span class="t">${s.text}</span></li>`).join('');
    ui.modal(`${ph ? `<div class="k-pic"><img src="${ph}" alt=""></div>` : ''}<h2>${r.name}</h2>
      <ol class="na-learn">${rows}</ol><div class="na-tip"><b>Mẹo nhỏ</b><span>${r.tip}</span></div>
      <div class="k-row"><button class="k-btn" data-m>${ACTION.heart}<span>Nhiệm vụ ở nhà</span></button><button class="k-btn ghost small" data-x>${ICONS.check}<span>Đóng</span></button></div>`, c => {
      c.querySelector('[data-m]').onclick = () => { Sound.fx.pop(); ui.closeModal(); showMission(r, () => showNotebook()); };
      c.querySelector('[data-x]').onclick = () => { Sound.fx.tap(); ui.closeModal(); };
    });
  }

  /* ——— bấm nút ——— */
  listen(root, 'click', e => {
    const a = e.target.closest('[data-act]');
    if (a) {
      const act = a.dataset.act; Sound.fx.tap();
      if (act === 'hub') ctx.goHub();
      else if (act === 'book') showBook();
      else if (act === 'notebook') showNotebook();
      else if (act === 'menu') showMenu();
      else if (act === 'quit') { Voice.stop(); showBook(); }
      return;
    }
    const card = e.target.closest('[data-i]');
    if (card && screen === 'book') {
      const i = +card.dataset.i;
      if (card.classList.contains('locked')) { ui.restart(card, 'nope'); Sound.fx.boop(); Voice.say(IMPL[RECIPES[i].id] ? 'Nấu món trước đã nhé!' : 'Món này sắp có nhé!'); return; }
      Sound.fx.pop(); intro(i); return;
    }
    const note = e.target.closest('[data-note]');
    if (note) { Sound.fx.pop(); noteCard(+note.dataset.note); }
  });
  listen($('.na-spot'), 'pointerdown', e => { if (chef) { chef.hop(); Sound.fx.boing(); FX.hearts(e.clientX, e.clientY, 4); Voice.say('Mình là đầu bếp nhí!'); } });
  listen(root, 'pointerdown', () => { idle = 0; hintN = 0; if (screen !== 'cook') ui.hand.hide(); }, true);

  // gợi ý khi bé chưa biết làm gì
  K.onFrame((dt, t) => {
    if (chef && screen === 'menu') chef.tick(dt, t);
    if (screen !== 'cook' || !current || ui.modalOpen()) return;
    idle += dt;
    if (idle > 6) { idle = -2; hintN++; current.hint(); if (hintN % 2 === 1) { const m = RECIPES[session.i].steps[session.qs.length]; const st = IMPL[RECIPES[session.i].id].steps[session.qs.length]; say((st && st.voice) || (m && m.text) || ''); } }
  }, true);

  // chỉ để chạy thử tự động (thêm ?natest vào địa chỉ trang)
  if (/natest/.test(location.search)) window.__na = { K, env, cook, showBook, showMenu, save, get session() { return session; }, get current() { return current; }, get screen() { return screen; } };

  showMenu();
  return {
    destroy() {
      endSession(); cleanups.forEach(f => f()); ui.hand.hide(); Voice.stop(); clearInterval(env._tm);
      K.dispose(); root.innerHTML = '';
    },
  };
}
