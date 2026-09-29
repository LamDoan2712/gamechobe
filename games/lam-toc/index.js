// index.js — Tiệm Làm Tóc: dựng giao diện, một sân khấu 3D dùng chung cho màn hình chính và màn chơi,
// điều hướng giữa các màn hình và dọn dẹp sạch sẽ khi rời game.

import { createStage } from '../../kit/three-kit.js';
import { Store } from '../../kit/store.js';
import { Voice } from '../../kit/audio.js';
import { ICONS, toggles, hand, closeModal } from '../../kit/ui.js';
import { buildSalon } from './salon.js';
import { createPlay } from './play.js';
import { createScreens } from './screens.js';
import { unlocksFor } from './data.js';
import { ROT_LEFT, ROT_RIGHT } from './icons.js';

const MENU_FRAME = { top: 4.9, bottom: 1.3, halfW: 2.0 };
const PLAY_FRAME = { top: 4.78, bottom: 1.42, halfW: 1.8 };

const TEMPLATE = `
<section class="k-screen lt-menu">
  <div class="k-bar"><button class="k-round" data-act="hub" aria-label="Về trang chọn game">${ICONS.home}</button><div class="k-title"></div><div class="k-toggles"></div></div>
  <h1 class="lt-logo"><span class="sm">Tiệm</span><span class="lg">Làm Tóc</span></h1>
  <div class="lt-hero"><div class="lt-slot lt-hero-slot"></div><div class="k-chip lt-rank"></div></div>
  <nav class="lt-actions">
    <button class="k-btn" data-act="play">${ICONS.play}<span>Chơi</span></button>
    <button class="k-btn mint" data-act="free">${ICONS.palette}<span>Tự do</span></button>
    <button class="k-btn lilac" data-act="album">${ICONS.album}<span>Album</span></button>
  </nav>
</section>
<section class="k-screen lt-levels" hidden>
  <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Về trang đầu">${ICONS.back}</button><div class="k-title">Chọn màn chơi</div><div class="k-chip lt-rank"></div></div>
  <div class="lt-grid"></div>
</section>
<section class="k-screen lt-play" hidden>
  <div class="k-bar">
    <button class="k-round lt-back" aria-label="Quay lại">${ICONS.back}</button>
    <div class="k-title lt-ptitle"></div>
    <button class="k-round lt-who" aria-label="Chọn khách" hidden></button>
    <div class="k-toggles"></div>
  </div>
  <div class="lt-stage">
    <div class="lt-slot"></div>
    <button class="k-order lt-order" aria-label="Xem yêu cầu của khách" hidden><span class="mini"><img alt=""></span><span class="k-reqs"></span></button>
    <div class="k-bubble" aria-live="polite"></div>
    <div class="lt-rot"><button class="k-round" data-rot="-1" aria-label="Xoay sang trái">${ROT_LEFT}</button><button class="k-round" data-rot="1" aria-label="Xoay sang phải">${ROT_RIGHT}</button></div>
    <button class="k-fab lt-cam" aria-label="Chụp ảnh">${ICONS.camera}</button>
  </div>
  <div class="k-tray lt-tray">
    <div class="k-row-scroll lt-palette"></div>
    <div class="k-row-scroll lt-tools"></div>
  </div>
</section>
<section class="k-screen lt-album" hidden>
  <div class="k-bar"><button class="k-round" data-act="menu" aria-label="Về trang đầu">${ICONS.home}</button><div class="k-title">Album ảnh của bé</div><div class="lt-count"></div></div>
  <div class="lt-album-grid"></div>
</section>
<div class="lt-brush" hidden aria-hidden="true"></div>`;

let G = null;

export default {
  mount(root, ctx) {
    root.innerHTML = TEMPLATE;
    root.querySelectorAll('.k-toggles').forEach(el => toggles(el));
    const timers = new Set();
    const g = G = {
      root, ctx, screen: '', dead: false,
      save: Store.game('lam-toc', { stars: {}, album: [] }),
      later(fn, ms) { const id = setTimeout(() => { timers.delete(id); if (!g.dead) fn(); }, ms); timers.add(id); return id; },
      clearLater(id) { clearTimeout(id); timers.delete(id); },
      timers,
      done() { let n = 0; while (g.save.stars[n + 1]) n++; return n; },
      unlocks() { return unlocksFor(g.done()); },
      frame() { if (g.salon) g.salon.frame(g.screen === 'menu' ? MENU_FRAME : PLAY_FRAME); },
    };
    const secs = { menu: root.querySelector('.lt-menu'), levels: root.querySelector('.lt-levels'), play: root.querySelector('.lt-play'), album: root.querySelector('.lt-album') };
    const host = document.createElement('div'); host.className = 'lt-host';
    secs.menu.querySelector('.lt-slot').appendChild(host);

    g.stage = createStage(host, { sky: ['#FFE6F0', '#EAF4FF'], onResize: () => g.frame() });
    g.salon = buildSalon(g.stage);
    g.play = createPlay(g);
    g.screens = createScreens(g);

    g.show = name => {
      const prev = g.screen;
      if (prev === 'play' && name !== 'play') g.play.leave();
      if (prev === 'menu' && name !== 'menu') g.screens.leaveMenu();
      g.screen = name;
      for (const k in secs) secs[k].hidden = k !== name;
      hand.hide();
      if (name === 'menu' || name === 'play') {
        const slot = secs[name].querySelector('.lt-slot');
        if (host.parentNode !== slot) slot.appendChild(host);
        g.stage.resize(); g.stage.start();
      } else g.stage.stop();
      if (name === 'menu') g.screens.enterMenu();
      else if (name === 'levels') g.screens.enterLevels();
      else if (name === 'album') g.screens.enterAlbum();
    };

    const S = g.salon;
    g.stage.onFrame((dt, t) => {
      S.doll.tick(dt, t);
      // vẫy tay thấp hơn một chút để bàn tay ló ra khỏi áo choàng, bên cạnh mái tóc
      const arm = S.doll.arms[1].pivot; if (arm.rotation.z > 1.2) arm.rotation.z = g.screen === 'menu' ? arm.rotation.z - 0.62 : 0.18;
      S.hair.update(dt); S.foam.update(dt); S.water.update(dt); S.steam.update(dt); S.bits.update(dt); S.pieces.update(dt);
      if (g.screen === 'play') g.play.frame(dt, t);
      else if (g.screen === 'menu') g.screens.frame(dt, t);
    });
    g.show('menu');
  },
  unmount() {
    if (!G) return;
    const g = G; G = null;
    g.dead = true;
    g.timers.forEach(id => clearTimeout(id)); g.timers.clear();
    try { g.play.destroy(); g.screens.destroy(); } catch (e) { console.error(e); }
    hand.hide(); closeModal(); Voice.stop();
    g.stage.dispose();
    g.root.innerHTML = '';
  },
};
