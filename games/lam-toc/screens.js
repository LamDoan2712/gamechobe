// screens.js — màn hình chính (khách vẫy tay trong gương), chọn màn chơi, album ảnh

import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { ICONS, levelGrid, modal, closeModal, starsHtml } from '../../kit/ui.js';
import { Store } from '../../kit/store.js';
import { CUSTOMERS, LEVELS, MILESTONES, rankFor, rankTitle } from './data.js';

const TILT = ['-3deg', '2deg', '-1.5deg', '3deg', '-2deg'];

export function createScreens(G) {
  const S = G.salon, root = G.root;
  const menu = root.querySelector('.lt-menu'), levels = root.querySelector('.lt-levels'), album = root.querySelector('.lt-album');
  const grid = levels.querySelector('.lt-grid'), agrid = album.querySelector('.lt-album-grid');

  const rankChip = () => {
    const r = rankFor(G.done());
    return `<span class="badge">${r}</span><span class="txt"><span class="lv">Cấp ${r}</span><span class="name">${rankTitle(r)}</span></span><span class="lt-total">${ICONS.star}${Store.starsOf('lam-toc')}</span>`;
  };

  /* ——— màn hình chính ——— */
  let waveT = 0, greeted = false;
  function waveLoop(ms) {
    if (waveT) G.clearLater(waveT);
    waveT = G.later(() => { waveT = 0; if (G.screen === 'menu') { S.doll.wave(); waveLoop(5500); } }, ms);
  }
  function enterMenu() {
    const u = G.unlocks(), cid = u.customers[u.customers.length - 1];
    S.setCustomer(cid); S.acc.set('bow', true, false); G.frame();
    menu.querySelector('.lt-rank').innerHTML = rankChip();
    waveLoop(600);
    if (!greeted) { greeted = true; Voice.say('Tiệm Làm Tóc xin chào!'); }
  }
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    Sound.fx.pop();
    const a = b.dataset.act;
    if (a === 'hub') G.ctx.goHub();
    else if (a === 'play') G.show('levels');
    else if (a === 'free') { G.play.startFree(G.save.last || 'na'); G.play.pickCustomer(true); }
    else if (a === 'album') G.show('album');
  });
  const onCanvasDown = e => {
    if (G.screen !== 'menu') return;
    Sound.ensure(); Sound.fx.pop(); S.doll.wave(); FX.hearts(e.clientX, e.clientY, 5);
    Voice.say(`Chào bạn! Mình là ${S.cust.name}!`);
  };
  G.stage.canvas.addEventListener('pointerdown', onCanvasDown);

  /* ——— chọn màn ——— */
  function enterLevels() {
    levels.querySelector('.lt-rank').innerHTML = rankChip();
    const done = G.done();
    levelGrid(grid, {
      count: LEVELS.length,
      stars: n => G.save.stars[n] || 0,
      playable: n => !!G.save.stars[n] || n <= done + 1,
      current: done < LEVELS.length ? done + 1 : 0,
      gift: n => !!MILESTONES[n],
      onPick: n => G.play.startLevel(n),
    });
    // ảnh đại diện khách nhỏ trên mỗi bong bóng màn
    grid.querySelectorAll('[data-lvl]').forEach(b => {
      const L = LEVELS[+b.dataset.lvl - 1];
      if (L && !b.classList.contains('locked')) b.insertAdjacentHTML('beforeend', `<span class="lt-lvl-dot" style="background:${CUSTOMERS[L.c].hair}"></span>`);
    });
  }
  levels.querySelector('[data-act="menu"]').addEventListener('click', () => { Sound.fx.tap(); G.show('menu'); });

  /* ——— album ——— */
  function enterAlbum() {
    const list = G.save.album;
    album.querySelector('.lt-count').textContent = list.length ? `${list.length} ảnh` : '';
    agrid.innerHTML = list.length
      ? list.map((e, i) => `<button class="lt-polaroid" data-i="${i}" style="--tilt:${TILT[i % TILT.length]}" aria-label="Ảnh ${(CUSTOMERS[e.c] || CUSTOMERS.na).name}">
          <span class="pic"><img src="${e.img}" alt=""></span><span class="cap"><span>${(CUSTOMERS[e.c] || CUSTOMERS.na).name}</span>${e.lvl ? starsHtml(e.stars) : ''}</span></button>`).join('')
      : `<div class="lt-empty">${ICONS.album}<span>Chưa có ảnh nào</span><span class="sub">Làm tóc xong, bấm máy ảnh để chụp nhé!</span></div>`;
  }
  agrid.addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const it = G.save.album[+b.dataset.i]; if (!it) return;
    const name = (CUSTOMERS[it.c] || CUSTOMERS.na).name;
    Sound.fx.pop();
    modal(`<div class="k-polaroid"><div class="pic"><img src="${it.img}" alt=""></div><div class="cap"><span>${name}</span>${it.lvl ? starsHtml(it.stars) : ''}</div></div>
      <button class="k-btn" data-x>${ICONS.check}<span>Xong</span></button>`, c => { c.querySelector('[data-x]').onclick = () => { Sound.fx.tap(); closeModal(); }; });
    Voice.say(`${name} xinh quá!`);
  });
  album.querySelector('[data-act="menu"]').addEventListener('click', () => { Sound.fx.tap(); G.show('menu'); });

  return {
    enterMenu, enterLevels, enterAlbum,
    frame(dt, t) { S.turn.rotation.y = Math.sin(t * 0.5) * 0.3; },
    leaveMenu() { if (waveT) G.clearLater(waveT); waveT = 0; S.turn.rotation.y = 0; },
    destroy() { G.stage.canvas.removeEventListener('pointerdown', onCanvasDown); },
  };
}
