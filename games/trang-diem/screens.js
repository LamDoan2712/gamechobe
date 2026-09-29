// screens.js — màn hình chính, bản đồ màn chơi, album, các hộp thoại (mở đầu, kết quả, thăng cấp, bố mẹ) và khởi động

import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { toggles } from '../../kit/ui.js';
import { CHARS, TOOLS, STICKERS, ACCS, LEVELS, MILESTONES, getLevel, rankFor, rankTitle } from './data.js';
import { renderCharacter, newLook, toolIcon, accIcon, ICONS, installSprite } from './art.js';

export function initScreens(G, env, ctx) {
  const $ = G.$;
  const GIFT = '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="19" width="34" height="25" rx="5" fill="#FF7FAA"/><rect x="4" y="12" width="40" height="10" rx="4" fill="#FF5C9A"/><rect x="21" y="12" width="6" height="32" fill="#FFC53D"/><path d="M24,12 C14,1 7,9 16,12 M24,12 C34,1 41,9 32,12" stroke="#FFC53D" stroke-width="4" fill="none" stroke-linecap="round"/></svg>';
  const REPLAY = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38,24 A14,14 0 1 1 30,11.5" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/><path d="M26,4 L33,12 L24,17" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const pic = (cid, look) => renderCharacter(cid, look, { viewBox: '0 20 400 440' });

  function rankChip() {
    const r = rankFor(G.effDone());
    return `<span class="badge">${r}</span><span class="txt"><span class="lv">Cấp ${r}</span><span class="name">${rankTitle(r)}</span></span><span class="total">${ICONS.star}${G.totalStars()}</span>`;
  }

  /* ——— màn hình chính ——— */
  G.openHome = () => { G.show('home'); renderHome(); };
  function renderHome() {
    const u = G.unlocks(), cid = u.chars[u.chars.length - 1];
    const look = Object.assign(newLook(cid), { blush: { c: 'pink', a: 0.7 }, lips: { c: 'pink', a: 1 }, acc: u.trophy ? { crown: true } : { bow: true } });
    $('#heroChar').innerHTML = `<div class="inner">${renderCharacter(cid, look, { live: true })}</div>`;
    $('#heroChar').dataset.char = cid;
    $('#homeRank').innerHTML = rankChip();
  }
  $('#btnPlay .ico').innerHTML = ICONS.play;
  $('#btnFree .ico').innerHTML = ICONS.palette;
  $('#btnAlbum .ico').innerHTML = ICONS.album;
  $('#homeGear').insertAdjacentHTML('afterbegin', ICONS.gear);
  $('#toHub').innerHTML = ICONS.home;
  $('#toHub').addEventListener('click', () => { Sound.fx.tap(); ctx.goHub(); });
  $('#btnPlay').addEventListener('click', () => { Sound.fx.pop(); G.openMap(); });
  $('#btnFree').addEventListener('click', () => { Sound.fx.pop(); G.startFree(G.save.lastChar); });
  $('#btnAlbum').addEventListener('click', () => { Sound.fx.pop(); G.openAlbum(); });
  document.querySelectorAll('[data-go="home"]').forEach(b => { b.innerHTML = ICONS.home; b.addEventListener('click', () => { Sound.fx.tap(); G.openHome(); }); });
  $('#heroChar').addEventListener('click', e => {
    const svg = $('#heroChar svg'); if (!svg) return;
    svg.classList.remove('happy'); void svg.getBoundingClientRect(); svg.classList.add('happy');
    Sound.fx.pop(); FX.hearts(e.clientX, e.clientY, 5);
    Voice.say(`Chào bạn! Mình là ${CHARS[$('#heroChar').dataset.char].name}!`);
  });

  // Nút bố mẹ: giữ 1,2 giây mới mở, để bé không bấm nhầm
  let holdT;
  const gear = $('#homeGear');
  gear.addEventListener('pointerdown', () => { gear.classList.add('holding'); holdT = setTimeout(() => { gear.classList.remove('holding'); G.openParent(); }, 1200); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => gear.addEventListener(ev, () => { clearTimeout(holdT); gear.classList.remove('holding'); }));

  /* ——— bản đồ màn chơi ——— */
  G.openMap = () => { G.show('map'); renderMap(true); };
  const playable = n => !!G.save.stars[n] || n <= G.doneCount() + 1 || (G.save.unlockAll && n <= LEVELS.length);
  function renderMap(scroll) {
    $('#mapRank').innerHTML = rankChip();
    const track = $('#mapTrack'), W = track.clientWidth || 360, gapY = 132, top = 80;
    const total = Math.max(LEVELS.length, G.doneCount() + 3), cur = G.doneCount() + 1;
    const amp = Math.min(W * 0.27, 150);
    const pts = Array.from({ length: total }, (_, i) => ({ x: W / 2 + Math.sin(i * 1.1) * amp, y: top + i * gapY }));
    const H = top + total * gapY;
    track.style.height = H + 'px';
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` C${pts[i - 1].x},${pts[i - 1].y + gapY / 2} ${pts[i].x},${pts[i].y - gapY / 2} ${pts[i].x},${pts[i].y}`;
    let h = `<svg class="path" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path d="${d}" fill="none" stroke="var(--edge)" stroke-width="16" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="var(--panel)" stroke-width="6" stroke-dasharray="2 16" stroke-linecap="round"/></svg>`;
    pts.forEach((p, i) => {
      const n = i + 1, L = getLevel(n), stars = G.save.stars[n] || 0, ok = playable(n);
      if (n <= LEVELS.length && (n === 1 || getLevel(n - 1).c !== L.c)) {
        const ax = Math.max(46, Math.min(W - 46, p.x + (p.x < W / 2 ? 1 : -1) * 110)), locked = !G.unlocks().chars.includes(L.c) && !ok;
        h += `<div class="map-ava ${locked ? 'locked' : ''}" style="left:${ax}px;top:${p.y}px">${G.avatar(L.c)}</div>
          <div class="map-ava-name" style="left:${ax}px;top:${p.y + 40}px">${CHARS[L.c].name}</div>`;
      }
      const cls = ['node', stars ? 'done' : '', !ok ? 'locked' : '', n === cur ? 'current' : ''].join(' ');
      h += `<button class="${cls}" data-lvl="${n}" style="left:${p.x}px;top:${p.y}px" aria-label="Màn ${n}${ok ? '' : ' (chưa mở)'}">
        ${ok ? n : ICONS.lock}${stars ? G.starsHtml(stars) : ''}${MILESTONES[n] && !stars ? `<span class="gift-ico">${GIFT}</span>` : ''}
        ${n === cur ? `<span class="point">${ICONS.hand}</span>` : ''}</button>`;
    });
    track.innerHTML = h;
    if (scroll) { const sc = $('#mapScroll'), y = pts[Math.min(cur, total) - 1].y; sc.scrollTop = Math.max(0, y - sc.clientHeight / 2); }
  }
  $('#mapTrack').addEventListener('click', e => {
    const b = e.target.closest('[data-lvl]'); if (!b) return;
    const n = +b.dataset.lvl;
    if (playable(n)) { Sound.fx.pop(); G.startLevel(n); }
    else { b.classList.remove('nope'); void b.offsetWidth; b.classList.add('nope'); Sound.fx.boop(); Voice.say('Chơi màn trước đã nhé!'); }
  });
  env.on(window, 'resize', () => { if (G.screen === 'map') renderMap(false); });

  /* ——— album ——— */
  G.openAlbum = () => { G.show('album'); renderAlbum(); };
  const TILT = ['-3deg', '2deg', '-1.5deg', '3deg', '-2deg'];
  function renderAlbum() {
    const list = G.save.album;
    $('#albumCount').textContent = list.length ? `${list.length} ảnh` : '';
    $('#albumGrid').innerHTML = list.length ? list.map((e, i) => `<button class="polaroid" data-i="${i}" style="--tilt:${TILT[i % TILT.length]}" aria-label="Ảnh ${CHARS[e.c].name}">
        <div class="pic">${pic(e.c, e.look)}</div><div class="cap"><span>${CHARS[e.c].name}</span>${e.lvl ? G.starsHtml(e.stars) : ''}</div></button>`).join('')
      : `<div class="album-empty">${ICONS.album}<span>Chưa có ảnh nào</span><span style="font-size:18px">Trang điểm xong, bấm máy ảnh để chụp nhé!</span></div>`;
  }
  $('#albumGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const it = G.save.album[+b.dataset.i]; Sound.fx.pop();
    G.modal(`<div class="polaroid"><div class="pic">${pic(it.c, it.look)}</div><div class="cap"><span>${CHARS[it.c].name}</span>${it.lvl ? G.starsHtml(it.stars) : ''}</div></div>
      <button class="big-btn" id="mClose">${ICONS.check}<span>Xong</span></button>`, c => { c.querySelector('#mClose').onclick = () => { Sound.fx.tap(); G.closeModal(); }; });
    Voice.say(`${CHARS[it.c].name} xinh quá!`);
  });

  /* ——— hộp thoại mở đầu màn ——— */
  G.showIntro = again => {
    const P = G.P, ch = CHARS[P.charId];
    G.modal(`<div class="eyebrow">Màn ${P.lvl}</div><h2>${ch.name} muốn thế này nè!</h2>
      <div class="modal-pic">${pic(P.charId, G.targetLook(P.charId, P.reqs))}</div>
      <div class="req-row big">${P.reqs.map(r => `<span class="req-ico">${G.reqIcon(r)}${r.cnt > 1 ? `<span class="cnt">×${r.cnt}</span>` : ''}</span>`).join('')}</div>
      <button class="big-btn" id="goBtn">${ICONS.play}<span>${again ? 'Tiếp tục' : 'Bắt đầu'}</span></button>`, c => {
      c.querySelector('#goBtn').onclick = () => { Sound.fx.pop(); G.closeModal(); G.say(TOOLS[G.P.tool].say); };
    });
    Voice.say(`${ch.name} muốn trang điểm như thế này nè!`, true);
  };

  /* ——— kết quả sau khi chụp ảnh ——— */
  G.showResult = ({ stars, rankUp }) => {
    const P = G.P, lv = P.mode === 'level', ch = CHARS[P.charId];
    const title = !lv ? 'Ảnh đẹp quá!' : ['Giỏi lắm!', 'Đẹp quá!', 'Tuyệt vời!'][stars - 1];
    const starRow = lv ? `<div class="big-stars">${[0, 1, 2].map(i => ICONS.star.replace('<svg', `<svg data-s="${i}"`)).join('')}</div>` : '';
    const btns = lv
      ? `<button class="big-btn" id="rNext">${ICONS.play}<span>Chơi tiếp</span></button><button class="big-btn ghost small" id="rAgain">${REPLAY}<span>Chơi lại</span></button>`
      : `<button class="big-btn" id="rKeep">${ICONS.palette}<span>Trang điểm tiếp</span></button><button class="big-btn album small" id="rAlbum">${ICONS.album}<span>Album</span></button>`;
    G.modal(`<h2>${title}</h2><div class="polaroid"><div class="pic">${pic(P.charId, P.look)}</div><div class="cap"><span>${ch.name}</span>${lv ? `<span>Màn ${P.lvl}</span>` : ''}</div></div>
      ${starRow}<div class="row">${btns}</div>`, c => {
      c.querySelectorAll('[data-s]').forEach((s, i) => {
        if (i < stars) setTimeout(() => { s.classList.add('lit'); Sound.fx.star(i); const r = s.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, '#FFD34D'); }, 500 + i * 420);
      });
      const on = (id, fn) => { const b = c.querySelector(id); if (b) b.onclick = () => { Sound.fx.pop(); fn(); }; };
      on('#rNext', () => { G.closeModal(); rankUp ? G.showLevelUp(rankUp, () => G.startLevel(P.lvl + 1)) : G.startLevel(P.lvl + 1); });
      on('#rAgain', () => { G.closeModal(); if (rankUp) G.showLevelUp(rankUp, () => G.startLevel(P.lvl)); else G.startLevel(P.lvl); });
      on('#rKeep', () => G.closeModal());
      on('#rAlbum', () => { G.closeModal(); G.openAlbum(); });
    });
    Sound.fx.fanfare(); FX.confetti();
    Voice.say(lv ? `${title} Bé được ${stars} ngôi sao!` : 'Ảnh đẹp quá! Đã cất vào album rồi nhé!', true);
  };

  /* ——— thăng cấp & mở quà ——— */
  function giftItems(g) {
    const out = [];
    const dflt = { blush: 'pink', lips: 'red', eyes: 'purple', lashes: 'black', hair: 'pink', sticker: 'star' };
    (g.chars || []).forEach(c => out.push({ pic: G.avatar(c), ava: true, label: 'Bạn mới: ' + CHARS[c].name }));
    (g.tools || []).forEach(t => out.push({ pic: toolIcon(t, dflt[t] || ''), label: TOOLS[t].name }));
    if (g.colors) out.push({ pic: ICONS.palette, label: 'Thêm nhiều màu' });
    if (g.stickers) out.push({ pic: '<svg viewBox="0 0 64 64"><use href="#stk-butterfly" x="4" y="4" width="56" height="56"/></svg>', label: 'Hình dán mới' });
    if (g.accs) { out.push({ pic: accIcon('glasses'), label: ACCS.glasses }); out.push({ pic: accIcon('necklace'), label: ACCS.necklace }); }
    if (g.rainbow) out.push({ pic: ICONS.rainbow, label: 'Tóc cầu vồng' });
    if (g.trophy) out.push({ pic: ICONS.trophy, label: 'Cúp Siêu Sao' });
    if (g.stars) out.push({ pic: ICONS.trophy, label: 'Huy hiệu mới' });
    return out;
  }
  G.showLevelUp = (ru, next) => {
    G.modal(`<div class="eyebrow">Thăng cấp!</div><div class="levelup-badge">${ru.rank}</div><h2>${rankTitle(ru.rank)}</h2>
      <p id="luHint">Chạm vào hộp quà nhé!</p>
      <button class="gift" id="gift" aria-label="Mở quà"><span class="box"></span><span class="ribbon-v"></span><span class="lid"></span>
        <svg class="bow" viewBox="0 0 60 34"><path d="M30,26 C10,0 0,20 10,30 C18,36 26,30 30,26 Z M30,26 C50,0 60,20 50,30 C42,36 34,30 30,26 Z" fill="#FFC53D"/><circle cx="30" cy="26" r="6" fill="#E7A21E"/></svg></button>
      <div class="unlocks" id="unlocks" hidden></div>
      <button class="big-btn" id="luNext" hidden>${ICONS.play}<span>Chơi tiếp</span></button>`, c => {
      const gift = c.querySelector('#gift');
      gift.onclick = () => {
        if (gift.classList.contains('open')) return;
        gift.classList.add('open'); Sound.fx.magic(); FX.confetti();
        const r = gift.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 3, '#FF7FAA');
        setTimeout(() => {
          gift.hidden = true; c.querySelector('#luHint').hidden = true;
          const box = c.querySelector('#unlocks');
          box.innerHTML = giftItems(ru.gift).map((it, i) => `<div class="unlock" style="animation-delay:${i * 0.15}s"><div class="pic ${it.ava ? 'ava' : ''}">${it.pic}</div><span>${it.label}</span></div>`).join('');
          box.hidden = false; c.querySelector('#luNext').hidden = false;
          Voice.say('Bé nhận được quà mới!', true);
        }, 550);
      };
      c.querySelector('#luNext').onclick = () => { Sound.fx.pop(); G.closeModal(); next(); };
    });
    Sound.fx.fanfare(); FX.confetti();
    Voice.say(`Thăng cấp! Bé lên cấp ${ru.rank} rồi!`, true);
  };

  /* ——— cài đặt cho bố mẹ ——— */
  G.openParent = () => {
    let armed = false;
    G.modal(`<div class="eyebrow">Dành cho bố mẹ</div><h2>Cài đặt</h2>
      <div class="parent-list">
        <button class="big-btn ghost" id="pUnlock">${G.save.unlockAll ? 'Khoá lại các màn chưa chơi' : 'Mở khoá tất cả 15 màn'}</button>
        <button class="big-btn ghost" id="pReset">Xoá tiến trình và album</button>
        <button class="big-btn" id="pClose">Xong</button>
      </div>
      <p class="parent-note">${Voice.available ? 'Giọng đọc tiếng Việt đang hoạt động.' : 'Trình duyệt này chưa có giọng đọc tiếng Việt; bé vẫn chơi được bằng hình ảnh và âm thanh.'}
        Tiến trình được lưu trên trình duyệt của máy này.</p>`, c => {
      c.querySelector('#pUnlock').onclick = () => { G.save.unlockAll = !G.save.unlockAll; G.persist(); Sound.fx.tap(); renderHome(); G.openParent(); };
      c.querySelector('#pReset').onclick = e => {
        if (!armed) { armed = true; e.currentTarget.textContent = 'Bấm lần nữa để xoá hết'; e.currentTarget.style.color = 'var(--accent-dark)'; return; }
        G.reset(); Sound.fx.boop(); G.closeModal(); renderHome();
      };
      c.querySelector('#pClose').onclick = () => { Sound.fx.tap(); G.closeModal(); };
    });
  };

  /* ——— khởi động ——— */
  installSprite();
  document.querySelectorAll('.g-trang-diem .toggles').forEach(t => toggles(t));
  G.openHome();
}
