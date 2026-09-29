// app.js — bộ điều hướng của Góc Vui Chơi: cổng chọn game (#) và từng game (#banh-kem, #lam-toc, …).
// Mỗi game là một module có mount(root, ctx) / unmount(); chỉ một game chạy tại một thời điểm.

import { Sound, Voice } from './kit/audio.js';
import { Store } from './kit/store.js';
import { FX } from './kit/fx.js';
import { closeModal, hand, ICONS } from './kit/ui.js';
import { GAMES } from './games.js';

const app = document.getElementById('app');
const HUB = { id: 'hub', css: 'hub/hub.css', track: 'calm', load: () => import('./hub/hub.js') };
let current = null, pending = null;

Sound.setSfx(Store.sfx);
document.addEventListener('pointerdown', () => { Sound.ensure(); Sound.setMusic(Store.music); }, { once: true });

const cssLoaded = {};
function loadCss(href) {
  if (!cssLoaded[href]) {
    cssLoaded[href] = new Promise(res => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href;
      l.onload = l.onerror = () => res(); document.head.appendChild(l);
    });
  }
  return cssLoaded[href];
}

const ctx = {
  games: GAMES,
  goHub() { Voice.stop(); if (location.hash && location.hash !== '#') location.hash = ''; else route(); },
  goGame(id) { location.hash = id; },
};

async function route() {
  const id = location.hash.replace('#', '');
  const entry = GAMES.find(g => g.id === id) || HUB;
  if (current && current.id === entry.id) return;
  const token = {}; pending = token;
  if (current) { try { current.mod.unmount(); } catch (e) { console.error(e); } current.root.remove(); current = null; }
  closeModal(); hand.hide(); FX.clear(); Voice.stop();

  const root = document.createElement('div');
  root.className = 'k-game g-' + entry.id;
  root.innerHTML = '<div class="k-loading">Đang tải…</div>';
  app.appendChild(root);
  try {
    await loadCss(entry.css);
    const mod = (await entry.load()).default;
    if (pending !== token) { root.remove(); return; }
    root.innerHTML = '';
    current = { id: entry.id, mod, root };
    Sound.setTrack(entry.track || 'calm');
    await mod.mount(root, Object.assign({ id: entry.id }, ctx));
  } catch (e) {
    console.error(e);
    if (pending !== token) return;
    root.innerHTML = `<div class="k-screen" style="justify-content:center;align-items:center;gap:18px;text-align:center">
      <p style="font-size:24px;font-weight:800;margin:0">Ôi, trò chơi chưa tải được.</p>
      <p style="font-size:18px;margin:0;color:var(--ink-soft)">Kiểm tra mạng rồi thử lại nhé.</p>
      <button class="k-btn" id="errBack">${ICONS.home}<span>Về trang chọn game</span></button></div>`;
    root.querySelector('#errBack').onclick = () => { current = null; ctx.goHub(); };
  }
}

addEventListener('hashchange', route);
route();
