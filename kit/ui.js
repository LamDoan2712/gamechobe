// kit/ui.js — giao diện dùng chung: biểu tượng, nút bật/tắt âm thanh, hộp thoại, bong bóng lời nói,
// bàn tay gợi ý, màn chọn màn chơi, hộp thoại kết quả (sao) và hộp quà thăng cấp.

import { Sound, Voice } from './audio.js';
import { FX } from './fx.js';
import { Store } from './store.js';

export const ICONS = {
  home: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8,24 L24,9 L40,24" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13,21 L13,39 L35,39 L35,21" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="11" rx="2" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M29,10 L15,24 L29,38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19,10 L33,24 L19,38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16,9 L39,24 L16,39 Z" fill="currentColor" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/></svg>',
  camera: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="18" width="52" height="38" rx="10" fill="currentColor"/><path d="M22,18 L26,10 L38,10 L42,18 Z" fill="currentColor"/><circle cx="32" cy="37" r="12" fill="#fff"/><circle cx="32" cy="37" r="7" fill="#FF5C9A"/><circle cx="49" cy="27" r="3" fill="#fff"/></svg>',
  music: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M18,34 L18,10 L38,6 L38,30" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"/><ellipse cx="13" cy="35" rx="7" ry="5.5" fill="currentColor"/><ellipse cx="33" cy="31" rx="7" ry="5.5" fill="currentColor"/></svg>',
  sound: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8,18 L16,18 L26,9 L26,39 L16,30 L8,30 Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M32,17 Q37,24 32,31 M36,12 Q45,24 36,36" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>',
  palette: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32,6 C14,6 4,20 6,34 C8,48 22,58 34,56 C42,55 40,47 36,44 C32,40 36,34 44,36 C54,38 60,32 58,22 C56,12 46,6 32,6 Z" fill="#FFF3E0" stroke="#E7B98A" stroke-width="3"/><circle cx="20" cy="22" r="6" fill="#FF7FAA"/><circle cx="34" cy="16" r="6" fill="#FFC53D"/><circle cx="46" cy="24" r="6" fill="#58A8F5"/><circle cx="18" cy="38" r="6" fill="#62CC7A"/></svg>',
  album: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="8" width="42" height="48" rx="6" fill="#fff" stroke="#D9B8CF" stroke-width="3" transform="rotate(8 33 32)"/><rect x="8" y="10" width="42" height="48" rx="6" fill="#fff" stroke="#D9B8CF" stroke-width="3"/><rect x="14" y="16" width="30" height="26" rx="3" fill="#BFE6FF"/><circle cx="36" cy="23" r="4" fill="#FFD34D"/><path d="M14,42 L24,30 L32,38 L37,33 L44,42 Z" fill="#7FD8A0"/></svg>',
  lock: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="10" y="21" width="28" height="21" rx="6" fill="currentColor"/><path d="M16,21 L16,15 Q16,7 24,7 Q32,7 32,15 L32,21" fill="none" stroke="currentColor" stroke-width="5"/></svg>',
  gear: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="4"/><path d="M24,4 L24,11 M24,37 L24,44 M4,24 L11,24 M37,24 L44,24 M10,10 L15,15 M33,33 L38,38 M10,38 L15,33 M33,15 L38,10" stroke="currentColor" stroke-width="5" stroke-linecap="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5,12.5 L10,17 L19,7" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  star: '<svg viewBox="-50 -50 100 100" aria-hidden="true"><path d="M0,-44 L12,-14 L44,-13 L19,7 L28,40 L0,21 L-28,40 L-19,7 L-44,-13 L-12,-14 Z" fill="currentColor" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/></svg>',
  hand: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24,58 C16,50 10,42 12,36 C14,32 18,33 22,38 L22,12 C22,7 29,7 29,12 L29,28 L29,24 C29,20 36,20 36,24 L36,29 C36,25 43,25 43,29 L43,33 C43,29 50,29 50,33 L50,44 C50,52 46,58 40,58 Z" fill="#FFE2CF" stroke="#8A4B6E" stroke-width="3" stroke-linejoin="round"/></svg>',
  trophy: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="k-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset="1" stop-color="#FFBE2E"/></linearGradient></defs><path d="M18,8 L46,8 L46,26 Q46,40 32,42 Q18,40 18,26 Z" fill="url(#k-gold)" stroke="#E7A92A" stroke-width="3"/><path d="M18,14 L8,14 Q8,28 20,30 M46,14 L56,14 Q56,28 44,30" fill="none" stroke="#E7A92A" stroke-width="3.5"/><rect x="28" y="42" width="8" height="8" fill="#FFC53D"/><rect x="18" y="50" width="28" height="8" rx="3" fill="#FF5C9A"/><path d="M32,16 L35,23 L42,23 L36,27 L38,34 L32,30 L26,34 L28,27 L22,23 L29,23 Z" fill="#fff"/></svg>',
  rainbow: '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-width="6" stroke-linecap="round"><path d="M6,48 A26,26 0 0 1 58,48" stroke="#FF8FB8"/><path d="M13,48 A19,19 0 0 1 51,48" stroke="#FFE17A"/><path d="M20,48 A12,12 0 0 1 44,48" stroke="#7FC4FF"/></g></svg>',
  gift: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="19" width="34" height="25" rx="5" fill="#FF7FAA"/><rect x="4" y="12" width="40" height="10" rx="4" fill="#FF5C9A"/><rect x="21" y="12" width="6" height="32" fill="#FFC53D"/><path d="M24,12 C14,1 7,9 16,12 M24,12 C34,1 41,9 32,12" stroke="#FFC53D" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
  replay: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38,24 A14,14 0 1 1 30,11.5" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/><path d="M26,4 L33,12 L24,17" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  rotate: '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="28" rx="18" ry="7" fill="none" stroke="currentColor" stroke-width="4.5"/><path d="M36,17 L42,23 L34,26" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="24" cy="14" r="6" fill="currentColor"/></svg>',
};

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const centerOf = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
export const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
export const starsHtml = (n, max = 3) => `<span class="k-stars" aria-label="${n} sao">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? 'on' : 'off'}">${ICONS.star}</span>`).join('')}</span>`;
export const PRAISE = ['Giỏi quá!', 'Đẹp quá!', 'Tuyệt vời!', 'Xinh xắn quá!', 'Hay lắm!'];
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/* ——— nút nhạc & âm thanh (trạng thái dùng chung cả cổng game) ——— */
export function toggles(container) {
  const render = () => {
    container.innerHTML = `<button class="k-round ${Store.music ? '' : 'off'}" data-kt="music" aria-label="Nhạc nền">${ICONS.music}</button>
      <button class="k-round ${Store.sfx ? '' : 'off'}" data-kt="sfx" aria-label="Âm thanh">${ICONS.sound}</button>`;
  };
  render();
  container.addEventListener('click', e => {
    const b = e.target.closest('[data-kt]'); if (!b) return;
    const k = b.dataset.kt; Store[k] = !Store[k];
    Sound.setSfx(Store.sfx); Sound.setMusic(Store.music); Sound.fx.tap();
    document.querySelectorAll('[data-kt="' + k + '"]').forEach(x => x.classList.toggle('off', !Store[k]));
  });
  return render;
}

/* ——— hộp thoại ——— */
let modalEl, modalCard, modalOnClose = null;
function ensureModal() {
  if (modalEl) return;
  modalEl = document.createElement('div'); modalEl.className = 'k-modal'; modalEl.hidden = true;
  modalEl.innerHTML = '<div class="k-modal-card" role="dialog" aria-modal="true"></div>';
  document.body.appendChild(modalEl); modalCard = modalEl.firstElementChild;
}
export function modal(html, onMount, onClose) {
  ensureModal(); hand.hide();
  modalCard.innerHTML = html; modalEl.hidden = false; modalOnClose = onClose || null;
  restart(modalCard, 'in');
  if (onMount) onMount(modalCard);
  return modalCard;
}
export function closeModal() {
  if (!modalEl || modalEl.hidden) return;
  modalEl.hidden = true; modalCard.innerHTML = '';
  const f = modalOnClose; modalOnClose = null; if (f) f();
}
export const modalOpen = () => !!modalEl && !modalEl.hidden;

/* ——— bong bóng lời nói ——— */
export function makeBubble(el) {
  let t;
  return (text, ms = 2400) => {
    clearTimeout(t);
    if (!text) { el.classList.remove('show'); return; }
    el.textContent = text; el.classList.add('show');
    t = setTimeout(() => el.classList.remove('show'), ms);
  };
}
export function speaker(bubbleEl) {
  const bubble = makeBubble(bubbleEl);
  const say = (text, force) => { bubble(text); Voice.say(text, force); };
  say.bubble = bubble;
  say.praise = () => say(pick(PRAISE));
  return say;
}

/* ——— bàn tay gợi ý ——— */
let handEl;
export const hand = {
  point(x, y, mode = 'tap') {
    if (!handEl) { handEl = document.createElement('div'); handEl.className = 'k-hand'; handEl.innerHTML = ICONS.hand; document.body.appendChild(handEl); }
    handEl.className = 'k-hand ' + mode; handEl.style.left = x + 'px'; handEl.style.top = y + 'px'; handEl.hidden = false;
  },
  pointAt(el, mode) { if (el) { const c = centerOf(el); this.point(c.x, c.y, mode); } },
  hide() { if (handEl) handEl.hidden = true; },
};

/* ——— đèn flash chụp ảnh ——— */
let flashEl;
export function flash() {
  if (!flashEl) { flashEl = document.createElement('div'); flashEl.className = 'k-flash'; document.body.appendChild(flashEl); }
  restart(flashEl, 'go'); Sound.fx.shutter();
}

/* ——— giữ nút một lúc mới kích hoạt (cổng dành cho bố mẹ) ——— */
export function holdToOpen(el, ms, fn) {
  let t;
  el.addEventListener('pointerdown', () => { el.classList.add('k-holding'); t = setTimeout(() => { el.classList.remove('k-holding'); fn(); }, ms); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => { clearTimeout(t); el.classList.remove('k-holding'); }));
}

/* ——— chọn màn chơi (lưới bong bóng số) ——— */
// opts: { count, stars(n), playable(n), current, gift(n), onPick(n) }
export function levelGrid(container, opts) {
  container.classList.add('k-levels');
  let h = '';
  for (let n = 1; n <= opts.count; n++) {
    const st = opts.stars(n) || 0, ok = opts.playable(n), cur = n === opts.current;
    h += `<button class="k-level ${st ? 'done' : ''} ${ok ? '' : 'locked'} ${cur ? 'current' : ''}" data-lvl="${n}" aria-label="Màn ${n}${ok ? '' : ' (chưa mở)'}">
      <span class="num">${ok ? n : ICONS.lock}</span>${st ? starsHtml(st) : ''}${opts.gift && opts.gift(n) && !st ? `<span class="gift">${ICONS.gift}</span>` : ''}
      ${cur ? `<span class="point">${ICONS.hand}</span>` : ''}</button>`;
  }
  container.innerHTML = h;
  container.onclick = e => {
    const b = e.target.closest('[data-lvl]'); if (!b) return;
    const n = +b.dataset.lvl;
    if (opts.playable(n)) { Sound.fx.pop(); opts.onPick(n); }
    else { restart(b, 'nope'); Sound.fx.boop(); Voice.say('Chơi màn trước đã nhé!'); }
  };
  const cur = container.querySelector('.current');
  if (cur) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' }));
}

/* ——— hộp thoại mở đầu màn ——— */
// { eyebrow, title, pic (html), reqs (html), goLabel, onGo, voice }
export function introModal(o) {
  modal(`${o.eyebrow ? `<div class="k-eyebrow">${o.eyebrow}</div>` : ''}<h2>${o.title}</h2>
    ${o.pic ? `<div class="k-pic">${o.pic}</div>` : ''}${o.reqs ? `<div class="k-reqs">${o.reqs}</div>` : ''}
    <button class="k-btn" data-go>${ICONS.play}<span>${o.goLabel || 'Bắt đầu'}</span></button>`, c => {
    c.querySelector('[data-go]').onclick = () => { Sound.fx.pop(); closeModal(); if (o.onGo) o.onGo(); };
  });
  if (o.voice) Voice.say(o.voice, true);
}

/* ——— hộp thoại kết quả ——— */
// { title, stars (0 = không chấm sao), pic (html), caption, buttons: [{ label, icon, cls, onClick }], voice }
export function resultModal(o) {
  const starRow = o.stars ? `<div class="k-bigstars">${[0, 1, 2].map(i => ICONS.star.replace('<svg', `<svg data-s="${i}"`)).join('')}</div>` : '';
  modal(`<h2>${o.title}</h2>${o.pic ? `<div class="k-polaroid"><div class="pic">${o.pic}</div>${o.caption ? `<div class="cap">${o.caption}</div>` : ''}</div>` : ''}
    ${starRow}<div class="k-row">${(o.buttons || []).map((b, i) => `<button class="k-btn ${b.cls || ''}" data-b="${i}">${b.icon || ''}<span>${b.label}</span></button>`).join('')}</div>`, c => {
    c.querySelectorAll('[data-s]').forEach((s, i) => {
      if (i < o.stars) setTimeout(() => { s.classList.add('lit'); Sound.fx.star(i); const p = centerOf(s); FX.burst(p.x, p.y, '#FFD34D'); }, 500 + i * 420);
    });
    c.querySelectorAll('[data-b]').forEach(b => { b.onclick = () => { Sound.fx.pop(); const btn = o.buttons[+b.dataset.b]; closeModal(); btn.onClick && btn.onClick(); }; });
  });
  Sound.fx.fanfare(); FX.confetti();
  if (o.voice) Voice.say(o.voice, true);
}

/* ——— thăng cấp & mở hộp quà ——— */
// { rank, title, items: [{ pic, label, round }], onNext }
export function giftModal(o) {
  modal(`<div class="k-eyebrow">Thăng cấp!</div><div class="k-rankbadge">${o.rank}</div><h2>${o.title}</h2>
    <p data-hint>Chạm vào hộp quà nhé!</p>
    <button class="k-giftbox" aria-label="Mở quà"><span class="box"></span><span class="ribbon"></span><span class="lid"></span>
      <svg class="bow" viewBox="0 0 60 34"><path d="M30,26 C10,0 0,20 10,30 C18,36 26,30 30,26 Z M30,26 C50,0 60,20 50,30 C42,36 34,30 30,26 Z" fill="#FFC53D"/><circle cx="30" cy="26" r="6" fill="#E7A21E"/></svg></button>
    <div class="k-unlocks" hidden></div>
    <button class="k-btn" data-next hidden>${ICONS.play}<span>Chơi tiếp</span></button>`, c => {
    const gift = c.querySelector('.k-giftbox');
    gift.onclick = () => {
      if (gift.classList.contains('open')) return;
      gift.classList.add('open'); Sound.fx.magic(); FX.confetti();
      const p = centerOf(gift); FX.burst(p.x, p.y, '#FF7FAA');
      setTimeout(() => {
        gift.hidden = true; c.querySelector('[data-hint]').hidden = true;
        const box = c.querySelector('.k-unlocks');
        box.innerHTML = o.items.map((it, i) => `<div class="k-unlock" style="animation-delay:${i * 0.15}s"><div class="pic ${it.round ? 'round' : ''}">${it.pic}</div><span>${it.label}</span></div>`).join('');
        box.hidden = false; c.querySelector('[data-next]').hidden = false;
        Voice.say('Bé nhận được quà mới!', true);
      }, 550);
    };
    c.querySelector('[data-next]').onclick = () => { Sound.fx.pop(); closeModal(); if (o.onNext) o.onNext(); };
  });
  Sound.fx.fanfare(); FX.confetti();
  Voice.say(`Thăng cấp! Bé lên cấp ${o.rank} rồi!`, true);
}

/* ——— nút về cổng game ——— */
export const goHub = () => { Voice.stop(); if (location.hash) location.hash = ''; else window.dispatchEvent(new HashChangeEvent('hashchange')); };
