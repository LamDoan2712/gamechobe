// game.js — bàn trang điểm: chọn dụng cụ, xoa tô, dán hình, kiểm tra yêu cầu, chụp ảnh

import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { Store } from '../../kit/store.js';
import { COLORS, TOOLS, TOOL_ORDER, RUB_TOOLS, ZONES, STICKERS, ACCS, CHARS, LEVELS, MILESTONES, PRAISE, unlocksFor, colorsFor, rankFor, getLevel } from './data.js';
import { renderCharacter, applyLook, applyAcc, applyStickers, newLook, toolIcon, accIcon, ICONS } from './art.js';

export function initGame(G, env) {
  const $ = s => document.querySelector(s);
  G.$ = $;

  /* ——— tiến trình (lưu trong kho chung của Góc Vui Chơi) ——— */
  const defaults = () => ({ stars: {}, album: [], unlockAll: false, lastChar: 'na' });
  G.save = Store.game('trang-diem', defaults());
  G.persist = () => Store.save();
  G.reset = () => { G.save = Store.resetGame('trang-diem', defaults()); };
  G.doneCount = () => { let n = 0; while (G.save.stars[n + 1]) n++; return n; };
  G.effDone = () => Math.max(G.doneCount(), G.save.unlockAll ? LEVELS.length : 0);
  G.unlocks = () => unlocksFor(G.effDone());
  G.totalStars = () => Object.values(G.save.stars).reduce((a, b) => a + b, 0);
  G.clone = o => JSON.parse(JSON.stringify(o));

  /* ——— màn hình, hộp thoại, nút bật/tắt ——— */
  G.show = name => {
    document.querySelectorAll('.g-trang-diem .screen').forEach(s => { s.hidden = s.id !== name; });
    G.screen = name; hideBrush(); hideHand(); clearTimeout(idleT);
  };
  G.modal = (html, onMount) => {
    const m = $('#modal'), c = $('#modalCard');
    c.innerHTML = html; m.hidden = false; c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
    hideHand(); clearTimeout(idleT);
    if (onMount) onMount(c);
  };
  G.closeModal = () => { $('#modal').hidden = true; resetIdle(); };
  G.starsHtml = (n, max = 3) => `<span class="stars" aria-label="${n} sao">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? '' : 'empty'}">${ICONS.star}</span>`).join('')}</span>`;
  G.avatar = cid => renderCharacter(cid, Object.assign(newLook(cid), { blush: { c: 'pink', a: 0.5 } }), { viewBox: '50 60 300 330' });

  const bubbleEl = $('#bubble'); let bubbleT;
  G.bubble = text => {
    clearTimeout(bubbleT);
    if (!text) { bubbleEl.classList.remove('show'); return; }
    bubbleEl.textContent = text; bubbleEl.classList.add('show');
    bubbleT = setTimeout(() => bubbleEl.classList.remove('show'), 2400);
  };
  G.say = (text, force) => { G.bubble(text); Voice.say(text, force); };
  const praise = () => G.say(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ——— trạng thái bàn trang điểm ——— */
  const P = G.P = { mode: 'free', lvl: 0, charId: 'na', look: null, reqs: [], done: [], allDone: false, tool: 'blush', sel: {}, svg: null, drag: null, lastFx: 0, lastRub: 0, washAcc: 0 };
  const stage = $('#stage'), cam = $('#btnCamera'), brush = $('#brush'), hand = $('#hand');
  cam.innerHTML = ICONS.camera;

  function initSel() {
    const u = G.unlocks();
    RUB_TOOLS.forEach(t => { P.sel[t] = colorsFor(t, u)[0]; });
    P.sel.hair = P.look.hair;
    P.sel.sticker = u.stickers[0];
  }
  function toolList() {
    const set = new Set(G.unlocks().tools); P.reqs.forEach(r => set.add(r.tool));
    return TOOL_ORDER.filter(t => set.has(t));
  }
  const iconColor = t => (TOOLS[t].kind === 'rub' ? P.sel[t] : t === 'hair' ? P.look.hair : t === 'sticker' ? P.sel.sticker : '');

  const STK_SPOTS = [[96, 300, -12], [304, 300, 12], [200, 202, 0], [120, 214, -10], [280, 214, 10]];
  G.targetLook = (charId, reqs) => {
    const L = newLook(charId);
    reqs.forEach(r => {
      if (RUB_TOOLS.includes(r.tool)) L[r.tool] = { c: r.v, a: 1 };
      else if (r.tool === 'hair') L.hair = r.v;
      else if (r.tool === 'acc') L.acc[r.v] = true;
      else if (r.tool === 'sticker') for (let i = 0; i < r.cnt; i++) { const s = STK_SPOTS[i % STK_SPOTS.length]; L.stk.push({ t: r.v, x: s[0], y: s[1], s: 48, r: s[2] }); }
    });
    return L;
  };
  G.reqIcon = r => r.tool === 'sticker' ? `<svg viewBox="0 0 64 64"><use href="#stk-${r.v}" x="4" y="4" width="56" height="56"/></svg>`
    : r.tool === 'acc' ? accIcon(r.v) : toolIcon(r.tool, r.v);

  G.startLevel = n => {
    const L = getLevel(n);
    Object.assign(P, { mode: 'level', lvl: n, charId: L.c, look: newLook(L.c), allDone: false });
    P.reqs = L.r.map(([tool, v, cnt]) => ({ tool, v, cnt: cnt || 1 }));
    P.done = P.reqs.map(() => false);
    initSel();
    const first = P.reqs[0].tool;
    P.tool = first;
    G.show('play'); renderPlay();
    G.showIntro();
  };
  G.startFree = cid => {
    const u = G.unlocks();
    cid = u.chars.includes(cid) ? cid : (u.chars.includes(G.save.lastChar) ? G.save.lastChar : 'na');
    Object.assign(P, { mode: 'free', lvl: 0, charId: cid, look: newLook(cid), reqs: [], done: [], allDone: false, tool: 'blush' });
    initSel(); G.save.lastChar = cid; G.persist();
    G.show('play'); renderPlay();
    setTimeout(() => G.say(`Trang điểm cho ${CHARS[cid].name} thật xinh nào!`), 300);
  };

  function renderPlay() {
    const lv = P.mode === 'level';
    $('#playBack').innerHTML = lv ? ICONS.back : ICONS.home;
    $('#playBack').setAttribute('aria-label', lv ? 'Về bản đồ' : 'Về nhà');
    $('#playTitle').textContent = lv ? `Màn ${P.lvl}` : '';
    const pick = $('#charPick');
    pick.hidden = lv;
    pick.innerHTML = lv ? '' : G.unlocks().chars.map(c => `<button class="${c === P.charId ? 'on' : ''}" data-char="${c}" aria-label="${CHARS[c].name}">${G.avatar(c)}</button>`).join('');
    stage.innerHTML = renderCharacter(P.charId, P.look, { live: true });
    P.svg = stage.querySelector('svg');
    const card = $('#orderCard');
    card.hidden = !lv;
    if (lv) card.innerHTML = `<div class="mini">${renderCharacter(P.charId, G.targetLook(P.charId, P.reqs), { viewBox: '40 50 320 350' })}</div>
      <div class="req-row">${P.reqs.map((r, i) => `<span class="req-ico ${P.done[i] ? 'done' : ''}" data-i="${i}">${G.reqIcon(r)}</span>`).join('')}</div>`;
    cam.classList.toggle('ready', false);
    renderTools(); renderPalette(); updateHint(); resetIdle();
  }

  function nextReqTool() { const i = P.done.findIndex(d => !d); return i >= 0 ? P.reqs[i].tool : null; }
  function renderTools() {
    const next = P.mode === 'level' ? nextReqTool() : null;
    $('#tools').innerHTML = toolList().map(t => {
      const mine = P.reqs.map((r, i) => (r.tool === t ? i : -1)).filter(i => i >= 0);
      const cls = ['tool', t === P.tool && 'on', mine.length && 'req', mine.length && mine.every(i => P.done[i]) && 'done', t === next && 'next'].filter(Boolean).join(' ');
      return `<button class="${cls}" data-tool="${t}" aria-label="${TOOLS[t].name}">${toolIcon(t, iconColor(t))}</button>`;
    }).join('');
  }
  function renderPalette() {
    const t = P.tool, kind = TOOLS[t].kind, u = G.unlocks(), want = P.reqs.filter(r => r.tool === t).map(r => r.v);
    const tip = v => (want.includes(v) ? `<span class="tip">${ICONS.star}</span>` : '');
    let h = '';
    if (kind === 'rub' || kind === 'hair') {
      const cols = colorsFor(t, u); want.forEach(v => { if (!cols.includes(v)) cols.push(v); });
      const cur = kind === 'hair' ? P.look.hair : P.sel[t];
      h = cols.map(c => `<button class="swatch ${c === cur ? 'on' : ''}" data-color="${c}" aria-label="${COLORS[c].name}"
        style="background:${c === 'rainbow' ? 'linear-gradient(#FF8FB8,#FFE17A,#8FE3A6,#7FC4FF,#C39BFF)' : COLORS[c].hex}">${tip(c)}</button>`).join('');
    } else if (kind === 'sticker') {
      const list = u.stickers.slice(); want.forEach(v => { if (!list.includes(v)) list.push(v); });
      h = list.map(s => `<button class="item ${s === P.sel.sticker ? 'on' : ''}" data-stk="${s}" aria-label="${STICKERS[s]}"><svg viewBox="0 0 64 64"><use href="#stk-${s}" x="4" y="4" width="56" height="56"/></svg>${tip(s)}</button>`).join('');
    } else if (kind === 'acc') {
      const list = u.accs.slice(); want.forEach(v => { if (!list.includes(v)) list.push(v); });
      h = list.map(a => `<button class="item ${P.look.acc[a] ? 'on' : ''}" data-acc="${a}" aria-label="${ACCS[a]}">${accIcon(a)}${tip(a)}</button>`).join('');
    } else {
      h = `<div class="note">${toolIcon('wash')}<span>Xoa lên mặt bạn để rửa sạch</span></div>`;
    }
    $('#palette').innerHTML = h;
  }
  function updateHint() {
    const g = P.svg && P.svg.querySelector('[data-k="hint"]'); if (!g) return;
    const t = P.tool;
    g.innerHTML = (RUB_TOOLS.includes(t) && P.look[t].a < 1) ? ZONES[t].pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${ZONES[t].r - 8}"/>`).join('') : '';
  }

  /* ——— toạ độ ——— */
  const toSvg = (cx, cy) => new DOMPoint(cx, cy).matrixTransform(P.svg.getScreenCTM().inverse());
  const toClient = (x, y) => { const m = P.svg.getScreenCTM(); return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }; };
  const scale = () => P.svg.getScreenCTM().a;

  /* ——— hiệu ứng nhân vật ——— */
  function happy() {
    P.svg.classList.remove('happy'); void P.svg.getBoundingClientRect(); P.svg.classList.add('happy');
    const top = toClient(200, 150); FX.hearts(top.x, top.y, 4);
  }
  function zoneBurst(t) { ZONES[t].pts.forEach(([x, y]) => { const c = toClient(x, y); FX.burst(c.x, c.y, COLORS[P.look[t].c].hex); }); }

  /* ——— chọn dụng cụ & màu ——— */
  function selectTool(t) {
    P.tool = t; Sound.fx.select(); G.say(TOOLS[t].say);
    renderTools(); renderPalette(); updateHint(); resetIdle();
  }
  function applyHair(c) {
    P.look.hair = c; P.sel.hair = c; applyLook(P.svg, P.look);
    [[200, 112], [110, 170], [290, 170], [76, 260], [324, 260], [200, 190]].forEach(([x, y]) => { const p = toClient(x, y); FX.sparkle(p.x, p.y, c === 'rainbow' ? '#FFE17A' : COLORS[c].hex, 4); });
    Sound.fx.magic(); happy();
    if (checkReqs() !== 'all') G.say(cap(COLORS[c].name) + ' đẹp quá!');
    renderPalette(); renderTools();
  }
  $('#tools').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) selectTool(b.dataset.tool); });
  $('#palette').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return; resetIdle();
    if (b.dataset.color) {
      const c = b.dataset.color, t = P.tool;
      if (t === 'hair') return applyHair(c);
      Sound.fx.select(); P.sel[t] = c;
      const L = P.look[t];
      if (L.a > 0) { L.c = c; applyLook(P.svg, P.look); ZONES[t].pts.forEach(([x, y]) => { const p = toClient(x, y); FX.sparkle(p.x, p.y, COLORS[c].hex, 5); }); checkReqs(); }
      G.say(cap(COLORS[c].name));
      renderPalette(); renderTools(); brush.dataset.key = '';
    } else if (b.dataset.stk) {
      P.sel.sticker = b.dataset.stk; Sound.fx.select(); G.say(STICKERS[b.dataset.stk]);
      renderPalette(); renderTools();
    } else if (b.dataset.acc) {
      const a = b.dataset.acc; P.look.acc[a] = !P.look.acc[a]; applyAcc(P.svg, P.look);
      if (P.look.acc[a]) {
        const pos = { crown: [200, 100], bow: [294, 150], flowers: [200, 130], glasses: [200, 288], necklace: [200, 440] }[a];
        const p = toClient(pos[0], pos[1]); FX.burst(p.x, p.y, '#FFD34D'); Sound.fx.magic(); happy();
        if (checkReqs() !== 'all') G.say(ACCS[a] + ' xinh quá!');
      } else { Sound.fx.boop(); checkReqs(); }
      renderPalette();
    }
  });
  $('#charPick').addEventListener('click', e => { const b = e.target.closest('[data-char]'); if (b && b.dataset.char !== P.charId) { Sound.fx.pop(); G.startFree(b.dataset.char); } });
  $('#orderCard').addEventListener('click', () => { Sound.fx.tap(); G.showIntro(true); });
  $('#playBack').addEventListener('click', () => { Sound.fx.tap(); Voice.stop(); P.mode === 'level' ? G.openMap() : G.openHome(); });

  /* ——— xoa, dán trên nhân vật ——— */
  const rubbable = () => { const k = TOOLS[P.tool].kind; return k === 'rub' || k === 'wash'; };
  function showBrush(x, y) {
    const key = P.tool + (iconColor(P.tool) || '');
    if (brush.dataset.key !== key) { brush.innerHTML = toolIcon(P.tool, iconColor(P.tool)); brush.dataset.key = key; }
    brush.hidden = false; brush.style.left = x + 'px'; brush.style.top = y + 'px';
  }
  function hideBrush() { brush.hidden = true; }

  stage.addEventListener('pointerdown', e => {
    if (!P.svg) return;
    e.preventDefault(); Sound.ensure(); resetIdle();
    const kind = TOOLS[P.tool].kind, p = toSvg(e.clientX, e.clientY);
    if (kind === 'sticker') return placeSticker(p, e);
    if (kind === 'hair') return applyHair(P.sel.hair);
    if (kind === 'acc') { Sound.fx.tap(); G.say('Chọn phụ kiện ở dưới nhé!'); return; }
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    P.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    showBrush(e.clientX, e.clientY);
    rubAt(p, 0, true, e.clientX, e.clientY);
  });
  stage.addEventListener('pointermove', e => {
    if (P.drag && e.pointerId === P.drag.id) {
      const d = Math.hypot(e.clientX - P.drag.x, e.clientY - P.drag.y);
      P.drag.x = e.clientX; P.drag.y = e.clientY;
      showBrush(e.clientX, e.clientY);
      if (d > 0.5) rubAt(toSvg(e.clientX, e.clientY), d / scale(), false, e.clientX, e.clientY);
    } else if (e.pointerType === 'mouse' && rubbable()) showBrush(e.clientX, e.clientY);
  });
  const endDrag = e => { if (P.drag && e.pointerId === P.drag.id) { P.drag = null; if (e.pointerType !== 'mouse') hideBrush(); resetIdle(); } };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !P.drag) hideBrush(); });

  function rubAt(p, units, tap, cx, cy) {
    const t = P.tool;
    if (t === 'wash') return washAt(units, tap, cx, cy);
    const z = ZONES[t], near = z.pts.some(([x, y]) => Math.hypot(x - p.x, y - p.y) < z.r + 10);
    let inc = tap ? 0.16 : units * 0.0028; if (near) inc *= 1.8;
    const L = P.look[t], col = P.sel[t], before = L.a;
    L.c = col; L.a = Math.min(1, L.a + inc); applyLook(P.svg, P.look);
    const now = performance.now();
    if (now - P.lastFx > 45) {
      P.lastFx = now; FX.sparkle(cx, cy, COLORS[col].hex, 2);
      const zp = z.pts[Math.floor(Math.random() * z.pts.length)], c = toClient(zp[0], zp[1]); FX.sparkle(c.x, c.y, COLORS[col].hex, 1);
    }
    if (now - P.lastRub > 140) { P.lastRub = now; Sound.fx.rub(); }
    if (before < 1 && L.a >= 1) {
      Sound.fx.ding(); zoneBurst(t); happy(); updateHint();
      if (checkReqs() !== 'all') praise();
    }
  }
  function washAt(units, tap, cx, cy) {
    const dec = tap ? 0.12 : units * 0.0032;
    const wasClean = isClean();
    RUB_TOOLS.forEach(k => { const L = P.look[k]; L.a = Math.max(0, L.a - dec); });
    P.washAcc += tap ? 40 : units;
    if (P.look.stk.length && P.washAcc > 60) {
      P.washAcc = 0; const s = P.look.stk.pop(); applyStickers(P.svg, P.look);
      const c = toClient(s.x, s.y); FX.bubbles(c.x, c.y, 4); Sound.fx.bubble();
    }
    applyLook(P.svg, P.look);
    const now = performance.now();
    if (now - P.lastFx > 60) { P.lastFx = now; FX.bubbles(cx, cy, 2); }
    if (now - P.lastRub > 160) { P.lastRub = now; Sound.fx.bubble(); }
    if (!wasClean && isClean()) { Sound.fx.ding(); G.say('Sạch bong rồi!'); }
    checkReqs(); updateHint();
  }
  const isClean = () => RUB_TOOLS.every(k => P.look[k].a === 0) && !P.look.stk.length;

  function placeSticker(p, e) {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    P.look.stk.push({ t: P.sel.sticker, x: clamp(p.x, 24, 376), y: clamp(p.y, 24, 496), s: 46 + Math.round(Math.random() * 10), r: Math.round(Math.random() * 40 - 20) });
    if (P.look.stk.length > 24) P.look.stk.shift();
    applyStickers(P.svg, P.look);
    Sound.fx.pop(); FX.sparkle(e.clientX, e.clientY, '#FFD34D', 6);
    if (checkReqs() === 'one') { Sound.fx.ding(); happy(); praise(); }
  }

  /* ——— yêu cầu của màn ——— */
  function reqDone(r) {
    const L = P.look;
    if (r.tool === 'sticker') return L.stk.length >= r.cnt;
    if (r.tool === 'acc') return !!L.acc[r.v];
    if (r.tool === 'hair') return L.hair !== CHARS[P.charId].hair;
    return L[r.tool].a >= 0.98;
  }
  G.reqMatch = r => {
    const L = P.look;
    if (r.tool === 'sticker') return L.stk.filter(s => s.t === r.v).length >= r.cnt;
    if (r.tool === 'acc') return !!L.acc[r.v];
    if (r.tool === 'hair') return L.hair === r.v;
    return L[r.tool].c === r.v;
  };
  function checkReqs() {
    if (P.mode !== 'level') return '';
    let newly = false, changed = false;
    P.reqs.forEach((r, i) => {
      const d = reqDone(r);
      if (d !== P.done[i]) {
        changed = true; P.done[i] = d;
        const ico = document.querySelector(`#orderCard .req-ico[data-i="${i}"]`);
        if (ico) { ico.classList.toggle('done', d); if (d) { newly = true; ico.classList.remove('pop'); void ico.offsetWidth; ico.classList.add('pop'); } }
      }
    });
    if (changed) renderTools();
    const all = P.done.every(Boolean);
    if (all && !P.allDone) {
      P.allDone = true; cam.classList.add('ready');
      setTimeout(() => {
        if (G.screen !== 'play' || !P.allDone) return;
        Sound.fx.fanfare(); G.say('Xong rồi! Bấm máy ảnh để chụp ảnh nào!', true);
        const r = cam.getBoundingClientRect(); FX.burst(r.left + r.width / 2, r.top + r.height / 2, '#FF7FAA');
      }, 450);
      return 'all';
    }
    if (!all && P.allDone) { P.allDone = false; cam.classList.remove('ready'); }
    return newly ? 'one' : '';
  }

  /* ——— bàn tay gợi ý khi bé chưa biết làm gì ——— */
  let idleT;
  function hideHand() { hand.hidden = true; }
  function pointHand(x, y, tap) { hand.innerHTML = ICONS.hand; hand.className = 'hand' + (tap ? ' tap' : ''); hand.style.left = x + 'px'; hand.style.top = y + 'px'; hand.hidden = false; }
  function resetIdle() { clearTimeout(idleT); hideHand(); if (G.screen === 'play') idleT = setTimeout(idleHint, 7000); }
  G.resetIdle = resetIdle;
  function idleHint() {
    if (G.screen !== 'play' || !$('#modal').hidden || P.drag) return;
    const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    if (P.mode === 'level' && P.allDone) { const [x, y] = center(cam); return pointHand(x, y, true); }
    const t = P.tool, kind = TOOLS[t].kind;
    if (kind === 'rub' && P.look[t].a < 1) { const [x, y] = ZONES[t].pts[0], c = toClient(x, y); pointHand(c.x, c.y, false); G.bubble(TOOLS[t].say); return; }
    if (kind === 'sticker' && P.mode === 'free') { const c = toClient(110, 300); return pointHand(c.x, c.y, true); }
    const next = P.mode === 'level' ? nextReqTool() : null;
    if (next && next !== t) { const b = document.querySelector(`#tools [data-tool="${next}"]`); if (b) { const [x, y] = center(b); pointHand(x, y, true); } return; }
    if (next === t) {
      const r = P.reqs.find((q, i) => q.tool === t && !P.done[i]);
      if (kind === 'sticker') { const c = toClient(110, 300); return pointHand(c.x, c.y, true); }
      const b = r && document.querySelector(`#palette [data-color="${r.v}"], #palette [data-acc="${r.v}"]`);
      if (b) { const [x, y] = center(b); pointHand(x, y, true); }
    }
  }
  env.on(document, 'pointerdown', e => { if (G.screen === 'play' && !e.target.closest('#stage')) resetIdle(); });

  /* ——— chụp ảnh ——— */
  cam.addEventListener('click', () => {
    Sound.ensure();
    if (P.mode === 'level' && !P.allDone) {
      cam.classList.remove('nope'); void cam.offsetWidth; cam.classList.add('nope');
      Sound.fx.boop(); G.say('Còn thiếu một chút nữa nè!', true);
      setTimeout(idleHint, 900); return;
    }
    Sound.fx.shutter(); hideHand(); hideBrush();
    const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
    let stars = 0, firstClear = false, rankUp = null;
    if (P.mode === 'level') {
      const m = P.reqs.filter(G.reqMatch).length;
      stars = m === P.reqs.length ? 3 : m >= P.reqs.length / 2 ? 2 : 1;
      const before = G.effDone(), prev = G.save.stars[P.lvl] || 0;
      firstClear = !prev;
      G.save.stars[P.lvl] = Math.max(prev, stars);
      const after = G.effDone();
      if (firstClear && after > before) {
        if (MILESTONES[P.lvl]) rankUp = { rank: rankFor(after), gift: MILESTONES[P.lvl] };
        else if (P.lvl > 15 && (P.lvl - 15) % 3 === 0) rankUp = { rank: rankFor(after), gift: { stars: true } };
      }
    }
    G.save.album.unshift({ c: P.charId, look: G.clone(P.look), stars, lvl: P.lvl, d: Date.now() });
    G.save.album = G.save.album.slice(0, 40);
    G.persist();
    setTimeout(() => G.showResult({ stars, rankUp }), 420);
  });
  G.destroy = () => { clearTimeout(idleT); clearTimeout(bubbleT); hideHand(); hideBrush(); };
}
