// play.js — màn làm tóc: khay dụng cụ + bảng màu, xoa lên tóc (gội, xả, sấy, chải, cắt, mọc, uốn, nhuộm),
// phụ kiện, xoay khách, thẻ yêu cầu, chấm sao, quà thăng cấp, chụp ảnh và bàn tay gợi ý khi bé chưa biết làm gì.

import { THREE, Tweens, Ease } from '../../kit/three-kit.js';
import { Sound, Voice } from '../../kit/audio.js';
import { FX } from '../../kit/fx.js';
import { ICONS, modal, closeModal, modalOpen, speaker, hand, flash, introModal, resultModal, giftModal, pick, restart, centerOf, PRAISE } from '../../kit/ui.js';
import { Store } from '../../kit/store.js';
import { COLORS, TOOLS, ACCS, CUSTOMERS, LEVELS, MILESTONES, STEP_DONE_SAY, RAINBOW, parseStep, toolForStep, rankFor, rankTitle, cap1 } from './data.js';
import { toolIcon, accIcon, stepIcon, swatchBg, avatar } from './icons.js';
import { SHORT_HANG, LONG_HANG, CURLED, LEN_MIN } from './hair.js';

const ROT_MAX = 1.22; // ±70°
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const NOTES = {
  shampoo: 'Xoa lên tóc để tạo bọt', rinse: 'Xoa để xả sạch bọt', dryer: 'Xoa để sấy khô tóc', comb: 'Xoa để chải tóc',
  scissors: 'Vuốt ngang tóc để cắt', grow: 'Xoa để tóc dài ra', curler: 'Xoa để tóc xoăn',
};
const stepUsesTool = (st, t) => (st.type === 'wash' ? t === 'shampoo' || t === 'rinse' : toolForStep(st, 2) === t);

export function createPlay(G) {
  const S = G.salon, hair = S.hair, doll = S.doll, stage = G.stage, canvas = stage.canvas;
  const el = G.root.querySelector('.lt-play');
  const $ = s => el.querySelector(s);
  const toolsEl = $('.lt-tools'), palEl = $('.lt-palette'), cam = $('.lt-cam'), card = $('.lt-order'), titleEl = $('.lt-ptitle'), whoBtn = $('.lt-who'), backBtn = $('.lt-back');
  const brush = G.root.querySelector('.lt-brush');
  const say = speaker($('.k-bubble'));

  const P = { mode: 'free', lvl: 0, cust: 'na', steps: [], allDone: false, tool: 'shampoo', dye: 'hong', washPhase: 0, rotTarget: 0, dirty: false, targetImg: '',
    foamAcc: 0, rinseAcc: 0, dyeAcc: 0, snd: 0, fx: 0, magicT: 0, moodKey: '', moodT: 0 };
  const R = { down: false, id: -1, mode: '', x: 0, y: 0, sx: 0, rot0: 0, moved: 0, first: false };

  /* ——— chọn điểm trên tóc từ vị trí ngón tay ——— */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hits = [];
  const inv = new THREE.Matrix4(), O = new THREE.Vector3(), D = new THREE.Vector3(), HP = new THREE.Vector3();
  const v1 = new THREE.Vector3(), v2 = new THREE.Vector3(), v3 = new THREE.Vector3();
  const W = new Float32Array(hair.locks.length);
  const H = { kind: 'none', lock: -1, ring: 0 };
  function pickAt(x, y) {
    const r = canvas.getBoundingClientRect();
    ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, stage.camera);
    doll.head.updateWorldMatrix(true, false);
    inv.copy(doll.head.matrixWorld).invert();
    O.copy(ray.ray.origin).applyMatrix4(inv); D.copy(ray.ray.direction).transformDirection(inv);
    H.kind = 'none'; H.lock = -1; H.ring = 0;
    hits.length = 0; ray.intersectObjects(S.targets, false, hits);
    if (hits.length) {
      const h = hits[0]; HP.copy(h.point).applyMatrix4(inv); H.kind = 'hair';
      const li = h.object.userData.lock;
      if (li != null && li >= 0) { H.lock = li; H.ring = hair.nearestRing(hair.locks[li], HP); }
      return H;
    }
    // trượt ra ngoài một chút: lấy lọn tóc gần tia nhất
    let bd = 0.42;
    for (const lk of hair.locks) { const ring = hair.rayRing(lk, O, D); if (hair.qd < bd) { bd = hair.qd; H.lock = lk.i; H.ring = ring; } }
    if (H.lock >= 0) { H.kind = 'near'; hair.centerAt(hair.locks[H.lock], H.ring, HP); return H; }
    // gần đầu: dùng điểm trên "vỏ" quanh đầu
    v1.copy(D).multiplyScalar(-O.dot(D)).add(O);
    if (v1.length() < 1.55) { HP.copy(v1).normalize().multiplyScalar(1.15); H.kind = 'near'; }
    return H;
  }
  const toWorld = (p, out) => out.copy(p).applyMatrix4(doll.head.matrixWorld);
  function toScreen(world) {
    v3.copy(world).project(stage.camera);
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (v3.x + 1) / 2 * r.width, y: r.top + (1 - v3.y) / 2 * r.height };
  }
  function lockScreen(lk, ringFrac) {
    const ring = Math.round(ringFrac * (lk.ringS.length - 1));
    hair.centerAt(lk, ring, v2); toWorld(v2, v2); return toScreen(v2);
  }

  /* ——— biểu cảm khuôn mặt (giới hạn số lần vẽ lại) ——— */
  function mood(key, o, t) {
    if (key === P.moodKey && t < P.moodT - 0.25) return;
    doll.face.react(o, 0.6); P.moodKey = key; P.moodT = t + 0.6;
  }
  function happy() {
    doll.face.react({ eyes: 'happy', mouth: 'open' }, 1.3); P.moodKey = '';
    Tweens.kill(doll.root.position);
    Tweens.add(doll.root.position, { y: 0.14 }, 0.14, { ease: Ease.outCubic, onDone: () => Tweens.add(doll.root.position, { y: 0 }, 0.45, { ease: Ease.outBounce }) });
    hair.locks.forEach(lk => hair.poke(lk, 1.2));
    const p = toScreen(v1.set(0, 4.35 + doll.root.position.y, 0)); FX.hearts(p.x, p.y, 4);
  }

  /* ——— giao diện ——— */
  function toolList() {
    const set = new Set(G.unlocks().tools);
    P.steps.forEach(st => { set.add(toolForStep(st, 0)); if (st.type === 'wash' || st.type === 'dry') { set.add('rinse'); set.add('shampoo'); } if (st.type === 'dry') set.add('dryer'); });
    return ['shampoo', 'rinse', 'dryer', 'comb', 'scissors', 'grow', 'curler', 'dye', 'acc'].filter(t => set.has(t));
  }
  const firstOpen = () => P.steps.find(st => !st.ok) || null;
  const nextTool = () => { const st = P.mode === 'level' ? firstOpen() : null; return st ? toolForStep(st, P.washPhase) : null; };
  function renderTools() {
    const next = P.allDone ? null : nextTool();
    toolsEl.innerHTML = toolList().map(t => {
      const mine = P.steps.filter(st => stepUsesTool(st, t));
      const cls = ['k-tool', t === P.tool && 'on', mine.length && 'req', mine.length && mine.every(st => st.ok) && 'done', t === next && 'next'].filter(Boolean).join(' ');
      return `<button class="${cls}" data-tool="${t}" aria-label="${TOOLS[t].name}">${toolIcon(t, t === 'dye' ? P.dye : null)}</button>`;
    }).join('');
  }
  function renderPalette() {
    const t = P.tool, u = G.unlocks(), tip = '<span class="k-tip">' + ICONS.star + '</span>';
    palEl.classList.toggle('lt-pal-grid', t === 'dye' || t === 'acc');
    if (t === 'dye') {
      const want = P.steps.filter(st => st.type === 'dye').map(st => st.v);
      const cols = u.colors.slice(); want.forEach(c => { if (!cols.includes(c)) cols.push(c); });
      palEl.innerHTML = cols.map(c => `<button class="k-swatch ${c === P.dye ? 'on' : ''}" data-color="${c}" aria-label="${COLORS[c].name}" style="background:${swatchBg(c)}">${want.includes(c) ? tip : ''}</button>`).join('');
      const w = palEl.querySelector('.k-tip');
      if (w) w.parentElement.scrollIntoView({ block: 'nearest', inline: 'center' });
    } else if (t === 'acc') {
      const want = P.steps.filter(st => st.type === 'acc').map(st => st.v);
      const list = u.accs.slice(); want.forEach(a => { if (!list.includes(a)) list.push(a); });
      palEl.innerHTML = list.map(a => `<button class="k-item ${S.acc.on[a] ? 'on' : ''}" data-acc="${a}" aria-label="${ACCS[a]}">${accIcon(a)}${want.includes(a) ? tip : ''}</button>`).join('');
    } else {
      palEl.innerHTML = `<div class="lt-note"><span class="ico">${toolIcon(t)}</span><span class="hint">${ICONS.hand}</span><span class="txt">${NOTES[t] || ''}</span></div>`;
    }
  }
  const stepsHtml = () => P.steps.map((st, i) => `<span class="k-req ${st.ok ? 'done' : ''}" data-i="${i}">${stepIcon(st)}${st.type === 'dye' ? `<span class="dot" style="background:${swatchBg(st.v)}"></span>` : ''}</span>`).join('');
  function renderAll() {
    const lv = P.mode === 'level';
    backBtn.innerHTML = lv ? ICONS.back : ICONS.home;
    backBtn.setAttribute('aria-label', lv ? 'Về chọn màn' : 'Về trang đầu');
    titleEl.textContent = lv ? `Màn ${P.lvl}` : 'Tự do';
    whoBtn.hidden = lv; whoBtn.innerHTML = avatar(CUSTOMERS[P.cust]);
    card.hidden = !lv;
    if (lv) { card.querySelector('.k-reqs').innerHTML = stepsHtml(); card.querySelector('img').src = P.targetImg || ''; }
    cam.classList.toggle('ready', lv && P.allDone);
    renderTools(); renderPalette(); updateBrush();
  }

  /* ——— bắt đầu màn / chơi tự do ——— */
  function resetRun() {
    Object.assign(P, { allDone: false, washPhase: 0, rotTarget: 0, dirty: false, foamAcc: 0, rinseAcc: 0, dyeAcc: 0, moodKey: '' });
    R.down = false; hideBrush();
  }
  function startLevel(n) {
    closeModal(); G.show('play');
    const L = LEVELS[n - 1];
    resetRun();
    Object.assign(P, { mode: 'level', lvl: n, cust: L.c });
    P.steps = L.steps.map(s => Object.assign(parseStep(s), { ok: false, match: false }));
    S.setCustomer(L.c, { len: L.len, curl: L.curl }); G.frame();
    const u = G.unlocks();
    P.tool = toolForStep(P.steps[0], 0);
    if (!u.colors.includes(P.dye)) P.dye = 'hong';
    P.targetImg = '';
    renderAll();
    G.later(() => {
      if (G.screen !== 'play' || P.lvl !== n) return;
      P.targetImg = targetShot(); card.querySelector('img').src = P.targetImg;
      showIntro(false);
    }, 80);
  }
  function startFree(cid) {
    closeModal(); G.show('play');
    const u = G.unlocks();
    cid = u.customers.includes(cid) ? cid : u.customers[0];
    resetRun();
    Object.assign(P, { mode: 'free', lvl: 0, cust: cid, steps: [] });
    G.save.last = cid; Store.save();
    S.setCustomer(cid); G.frame();
    if (!u.tools.includes(P.tool)) P.tool = 'shampoo';
    if (!u.colors.includes(P.dye)) P.dye = 'hong';
    renderAll(); resetIdle();
  }
  function pickCustomer(first) {
    const u = G.unlocks();
    modal(`<h2>Chọn bạn nào?</h2><div class="k-unlocks">${u.customers.map((id, i) => `<button class="k-unlock" style="animation-delay:${i * 0.08}s" data-c="${id}" aria-label="${CUSTOMERS[id].name}"><span class="pic round" style="${id === P.cust ? 'outline:5px solid var(--accent);outline-offset:2px' : ''}">${avatar(CUSTOMERS[id])}</span><span>${CUSTOMERS[id].name}</span></button>`).join('')}</div>`, c => {
      c.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { Sound.fx.pop(); closeModal(); startFree(b.dataset.c); G.later(() => say(`Làm tóc cho ${CUSTOMERS[b.dataset.c].name} thật xinh nào!`), 250); }; });
    }, () => resetIdle());
    Voice.say(first ? 'Hôm nay làm tóc cho bạn nào?' : 'Chọn bạn nào?', true);
  }
  function showIntro(again) {
    const c = CUSTOMERS[P.cust];
    introModal({
      eyebrow: `Màn ${P.lvl}`, title: `${c.name} muốn thế này nè!`,
      pic: P.targetImg ? `<img src="${P.targetImg}" alt="">` : avatar(c),
      reqs: stepsHtml(), goLabel: again ? 'Tiếp tục' : 'Bắt đầu',
      onGo: () => { say(TOOLS[P.tool].say); resetIdle(); },
      voice: `${c.name} muốn làm tóc như thế này nè!`,
    });
  }
  // Ảnh mẫu: tạm đặt tóc theo yêu cầu, chụp, rồi trả lại như cũ (trong cùng một lượt nên bé không thấy)
  function targetShot() {
    const snapH = hair.save(), snapA = S.acc.save(), rot = S.turn.rotation.y;
    S.turn.rotation.y = 0; S.foam.mesh.visible = false; doll.arms[1].pivot.rotation.z = 0.18;
    for (const st of P.steps) {
      if (st.type === 'cut') hair.main.forEach(lk => hair.setLen(lk, lk.scalp + 0.55));
      else if (st.type === 'grow') hair.main.forEach(lk => hair.setLen(lk, lk.scalp + 2.0));
      else if (st.type === 'curl') hair.locks.forEach(lk => hair.setCurl(lk, 0.9));
      else if (st.type === 'dye') {
        const rb = st.v === 'cauvong';
        hair.locks.forEach(lk => hair.dyeNow(lk, st.v, rb ? hair.rainbowHex(lk) : COLORS[st.v].hex));
        hair.paintCapAll(rb ? RAINBOW[0] : COLORS[st.v].hex, rb);
      } else if (st.type === 'acc') S.acc.set(st.v, true, false);
    }
    hair.rebuildAll();
    const url = S.capture(256);
    hair.restore(snapH); S.acc.restore(snapA);
    S.turn.rotation.y = rot; S.foam.mesh.visible = true;
    return url;
  }

  /* ——— chọn dụng cụ, màu, phụ kiện ——— */
  function selectTool(t) {
    if (P.tool === t) { say(TOOLS[t].say); return; }
    P.tool = t; Sound.fx.select(); say(TOOLS[t].say);
    renderTools(); renderPalette(); updateBrush(); resetIdle();
  }
  toolsEl.addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) selectTool(b.dataset.tool); });
  palEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    resetIdle();
    if (b.dataset.color) {
      P.dye = b.dataset.color; Sound.fx.select(); say(cap1(COLORS[P.dye].name));
      renderPalette(); renderTools(); updateBrush();
    } else if (b.dataset.acc) {
      const a = b.dataset.acc, on = S.acc.toggle(a);
      if (on) {
        Sound.fx.magic(); happy(); say(ACCS[a] + '!');
        G.later(() => { const p = toScreen(S.acc.worldPos(a, v1)); FX.burst(p.x, p.y, '#FFD34D'); }, 120);
      } else Sound.fx.boop();
      b.classList.toggle('on', on);
      P.dirty = true;
    }
  });
  $('.lt-rot').addEventListener('click', e => {
    const b = e.target.closest('[data-rot]'); if (!b) return;
    const d = +b.dataset.rot, nt = clamp(P.rotTarget + d * 0.61, -ROT_MAX, ROT_MAX);
    if (Math.abs(nt - P.rotTarget) < 0.01) { restart(b, 'nope'); Sound.fx.boop(); P.rotTarget = 0; }
    else { P.rotTarget = nt; Sound.fx.whoosh(); }
    resetIdle();
  });
  card.addEventListener('click', () => { Sound.fx.tap(); showIntro(true); });
  whoBtn.addEventListener('click', () => { Sound.fx.tap(); pickCustomer(false); });
  backBtn.addEventListener('click', () => { Sound.fx.tap(); Voice.stop(); G.show(P.mode === 'level' ? 'levels' : 'menu'); });
  cam.addEventListener('click', () => {
    Sound.ensure();
    if (P.mode === 'level' && !P.allDone) {
      restart(cam, 'nope'); Sound.fx.boop(); say('Còn thiếu một chút nữa nè!', true);
      G.later(idleHint, 900); return;
    }
    takePhoto();
  });

  /* ——— con trỏ dụng cụ đi theo ngón tay ——— */
  let brushKey = '';
  function updateBrush() { const k = P.tool + P.dye; if (k !== brushKey) { brushKey = k; brush.innerHTML = toolIcon(P.tool, P.dye); } brush.className = 'lt-brush lt-b-' + P.tool; }
  function showBrush(x, y) { if (P.tool === 'acc') return; brush.hidden = false; brush.style.left = x + 'px'; brush.style.top = y + 'px'; }
  function hideBrush() { brush.hidden = true; }

  /* ——— chạm & kéo trên cảnh 3D ——— */
  function onDown(e) {
    if (G.screen !== 'play' || modalOpen() || R.down) return;
    e.preventDefault(); Sound.ensure(); resetIdle();
    Object.assign(R, { down: true, id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, moved: 3, first: true });
    pickAt(R.x, R.y);
    if (H.kind === 'none') { R.mode = 'turn'; R.rot0 = P.rotTarget; }
    else if (P.tool === 'acc') {
      R.mode = 'tap'; say('Chọn phụ kiện ở dưới nhé!');
      const b = palEl.querySelector('[data-acc]'); if (b) G.later(() => hand.pointAt(b, 'tap'), 500);
    } else {
      R.mode = 'rub'; showBrush(R.x, R.y);
      if (P.tool === 'grow') { Sound.fx.magic(); P.magicT = 0; }
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* không sao */ }
  }
  function onMove(e) {
    if (G.screen !== 'play') return;
    if (R.down && e.pointerId === R.id) {
      R.moved += Math.hypot(e.clientX - R.x, e.clientY - R.y); R.x = e.clientX; R.y = e.clientY;
      if (R.mode === 'rub') showBrush(R.x, R.y);
    } else if (!R.down && e.pointerType === 'mouse' && !modalOpen() && P.tool !== 'acc') showBrush(e.clientX, e.clientY);
  }
  function onUp(e) {
    if (!R.down || e.pointerId !== R.id) return;
    R.down = false; R.mode = '';
    if (e.pointerType !== 'mouse') hideBrush();
    resetIdle();
  }
  const onLeave = e => { if (e.pointerType === 'mouse' && !R.down) hideBrush(); };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  /* ——— hiệu ứng của từng dụng cụ (mỗi khung hình khi đang xoa) ——— */
  function spawnFoam() {
    // chọn một điểm quanh chỗ chạm rồi bám lên lọn tóc gần nhất (hoặc lên mũ tóc)
    v1.set(HP.x + (Math.random() - 0.5) * 0.6, HP.y + (Math.random() - 0.5) * 0.6, HP.z + (Math.random() - 0.5) * 0.6);
    let best = null, bd = 0.5 * 0.5, ring = 0;
    for (const lk of hair.locks) { const r = hair.nearestRing(lk, v1); if (hair.qd < bd) { bd = hair.qd; best = lk; ring = r; } }
    const size = 0.09 + Math.random() * 0.08;
    if (hair.capPoint(v1, 0.04 + size * 0.5, v2) && (!best || v2.distanceToSquared(v1) < bd)) return S.foam.add(v2.x, v2.y, v2.z, size, -1, 0);
    if (!best) return false;
    hair.centerAt(best, ring, v2); hair.normalAt(best, ring, v3);
    v2.addScaledVector(v3, best.rt + size * 0.45);
    v2.x += (Math.random() - 0.5) * 0.1; v2.y += (Math.random() - 0.5) * 0.1; v2.z += (Math.random() - 0.5) * 0.1;
    return S.foam.add(v2.x, v2.y, v2.z, size, best.i, best.ringS[ring]);
  }
  const dropAt = (x, y, z) => { toWorld(v1.set(x, y, z), v1); for (let i = 0; i < 2; i++) S.water.spawn(v1.x, v1.y, v1.z, (Math.random() - 0.5) * 1.5, Math.random() * 1.2, 0.6 + Math.random(), 0.7, 0.035 + Math.random() * 0.03); };
  const randomMain = () => hair.main[Math.floor(Math.random() * hair.main.length)];
  function cutLock(lk, ring, now) {
    if (lk.cool > 0) return false;
    const sAxis = lk.ringS[ring], newLen = Math.max(LEN_MIN, hair.lenAtAxis(lk, sAxis));
    if (newLen >= lk.len - 0.12) return false;
    const oldLen = lk.len;
    hair.centerAt(lk, ring, v2); toWorld(v2, v2);
    hair.setLen(lk, newLen);
    S.pieces.spawn(lk, oldLen, sAxis, doll.head);
    for (let i = 0; i < 3; i++) S.bits.spawn(v2.x, v2.y, v2.z, (Math.random() - 0.5) * 1.6, Math.random() * 1.2, 0.5 + Math.random() * 0.8, 1.1, 0.8 + Math.random() * 0.4, lk.mat.color.getHex());
    S.foam.removeLockBeyond(lk.i, sAxis);
    lk.cool = 0.2; P.dirty = true;
    if (now - P.snd > 90) { P.snd = now; Sound.fx.snip(); }
    return true;
  }
  const sfxOk = (now, ms) => (now - P.snd > ms ? ((P.snd = now), true) : false);
  const fxOk = (now, ms) => (now - P.fx > ms ? ((P.fx = now), true) : false);
  function rubFrame(dt, t) {
    const moving = R.moved > 2; R.moved = 0;
    const k = dt * (moving ? 1 : 0.5), now = performance.now();
    pickAt(R.x, R.y);
    if (H.kind === 'none') return;
    const tool = P.tool;
    switch (tool) {
      case 'shampoo': {
        P.foamAcc += k * 24;
        while (P.foamAcc >= 1) { P.foamAcc -= 1; spawnFoam(); }
        hair.weigh(HP, null, null, 0.6, 0, H.lock, W);
        for (const lk of hair.locks) if (W[lk.i] > 0) hair.setWet(lk, Math.max(lk.wet, 0.35 * W[lk.i]));
        hair.setCapWet(Math.max(hair.capWet, 0.25));
        P.dirty = true;
        mood('wash', { eyes: 'closed', mouth: 'smile' }, t);
        if (sfxOk(now, 120)) Sound.fx.bubble(); if (fxOk(now, 240)) FX.bubbles(R.x, R.y, 1);
        if (P.washPhase === 0 && S.foam.count >= 40) {
          P.washPhase = 1; Sound.fx.ding(); say('Nhiều bọt quá! Giờ xả nước nào!', true);
          doll.face.react({ eyes: 'happy', mouth: 'open' }, 0.9); renderTools();
        }
        break;
      }
      case 'rinse': {
        // khoảng 16 bong bóng mỗi giây: bọt gần ngón tay trước, hết thì đến bọt ở chỗ khác (kể cả sau đầu)
        P.rinseAcc += k * 16;
        while (P.rinseAcc >= 1) { P.rinseAcc -= 1; if (!S.foam.removeNear(HP, 0.6, O, D, 0.42, 1, dropAt)) S.foam.removeRandom(dropAt); }
        hair.weigh(HP, O, D, 0.65, 0.45, H.lock, W);
        for (const lk of hair.locks) hair.setWet(lk, lk.wet + (W[lk.i] * 2.6 + 0.35) * k);
        hair.setCapWet(hair.capWet + 0.8 * k);
        P.dirty = true;
        toWorld(HP, v1);
        for (let i = 0; i < 2; i++) S.water.spawn(v1.x + (Math.random() - 0.5) * 0.4, v1.y + 0.2 + Math.random() * 0.3, v1.z + 0.25, (Math.random() - 0.5) * 0.8, -1.5 - Math.random(), 0.3 + Math.random() * 0.4, 0.8, 0.04 + Math.random() * 0.03);
        mood('wash', { eyes: 'closed', mouth: 'smile' }, t);
        if (sfxOk(now, 320)) Sound.fx.splash(); if (fxOk(now, 120)) FX.drops(R.x, R.y, '#7FC4FF', 2);
        if (P.washPhase === 1 && S.foam.count === 0) {
          P.washPhase = 2; P.dirty = true;
          if (P.mode !== 'level') { Sound.fx.ding(); say(STEP_DONE_SAY.wash); happy(); }
        }
        break;
      }
      case 'dryer': {
        hair.weigh(HP, O, D, 0.75, 0.45, H.lock, W);
        let wetNear = 0;
        for (const lk of hair.locks) {
          const w = W[lk.i];
          if (w > 0) { wetNear = Math.max(wetNear, lk.wet); hair.setWet(lk, lk.wet - 1.9 * k * w); if (w > 0.3 && Math.random() < 0.5) hair.poke(lk, 2.2 * w); }
        }
        for (let i = 0; i < 3; i++) { const lk = randomMain(); hair.setWet(lk, lk.wet - 0.35 * k * hair.main.length / 3); }
        hair.locks.forEach(lk => { if (lk.kind === 'bang') hair.setWet(lk, lk.wet - 0.4 * k); });
        hair.setCapWet(hair.capWet - 0.9 * k);
        if (wetNear > 0.05 || hair.capWet > 0.05) { toWorld(HP, v1); if (Math.random() < 0.5) S.steam.spawn(v1.x, v1.y, v1.z + 0.2, (Math.random() - 0.5) * 0.5, 0.6 + Math.random() * 0.5, 0.3, 0.9, 0.09 + Math.random() * 0.06); }
        mood('dry', { eyes: 'happy', mouth: 'open' }, t);
        if (sfxOk(now, 150)) Sound.fx.whirr();
        P.dirty = true;
        break;
      }
      case 'comb': {
        hair.weigh(HP, O, D, 0.6, 0.4, H.lock, W);
        for (const lk of hair.locks) { const w = W[lk.i]; if (w > 0) { hair.setCurl(lk, lk.curl - 1.1 * k * w); if (w > 0.4 && Math.random() < 0.2) hair.poke(lk, 0.8); } }
        mood('comb', { eyes: 'happy', mouth: 'smile' }, t);
        if (sfxOk(now, 160)) Sound.fx.rub(); if (fxOk(now, 80)) FX.sparkle(R.x, R.y, '#BFE6FF', 2);
        P.dirty = true;
        break;
      }
      case 'scissors': {
        if (!moving && !R.first) break;
        let cut = 0;
        if (H.lock >= 0) cut += cutLock(hair.locks[H.lock], H.ring, now) ? 1 : 0;
        // cắt xuyên: các lọn nằm dọc tia nhìn (chỉ phần tóc rủ xuống)
        for (const lk of hair.locks) {
          if (lk.i === H.lock || lk.kind === 'bang') continue;
          const ring = hair.rayRing(lk, O, D);
          if (hair.qd < 0.26 && lk.ringS[ring] > lk.surf + 0.05) cut += cutLock(lk, ring, now) ? 1 : 0;
        }
        mood('cut', { mouth: 'o' }, t);
        if (cut) { restart(brush, 'snip'); if (fxOk(now, 60)) FX.sparkle(R.x, R.y, '#FFFFFF', 3); }
        break;
      }
      case 'grow': {
        hair.weigh(HP, O, D, 0.75, 0.45, H.lock, W);
        for (const lk of hair.locks) { const w = W[lk.i]; if (w > 0) hair.setLen(lk, lk.len + 2.0 * k * w); }
        for (let i = 0; i < 2; i++) { const lk = randomMain(); hair.setLen(lk, lk.len + 0.2 * k * hair.main.length / 2); }
        mood('grow', { eyes: 'open', mouth: 'open' }, t);
        if (fxOk(now, 60)) FX.sparkle(R.x, R.y, Math.random() < 0.5 ? '#7FD8A0' : '#FFD34D', 3);
        P.magicT += dt; if (P.magicT > 1.6) { P.magicT = 0; Sound.fx.magic(); } else if (sfxOk(now, 260)) Sound.fx.rub();
        P.dirty = true;
        break;
      }
      case 'curler': {
        hair.weigh(HP, O, D, 0.7, 0.45, H.lock, W);
        for (const lk of hair.locks) { const w = W[lk.i]; if (w > 0) hair.setCurl(lk, lk.curl + 1.4 * k * w); }
        for (let i = 0; i < 2; i++) { const lk = randomMain(); hair.setCurl(lk, lk.curl + 0.1 * k * hair.main.length / 2); }
        mood('curl', { eyes: 'happy', mouth: 'smile' }, t);
        if (fxOk(now, 70)) FX.sparkle(R.x, R.y, '#FF9EC4', 2); if (sfxOk(now, 650)) Sound.fx.boing();
        P.dirty = true;
        break;
      }
      case 'dye': {
        const key = P.dye, rb = key === 'cauvong', hex = rb ? RAINBOW[0] : COLORS[key].hex;
        hair.weigh(HP, O, D, 0.42, 0.3, H.lock, W);
        let any = false;
        for (const lk of hair.locks) if (W[lk.i] > 0.3) any = hair.dyeLock(lk, key, rb ? hair.rainbowHex(lk) : hex) || any;
        hair.paintCap(HP, 0.55, hex, rb, O, D, k * 7);
        // màu nhuộm loang dần sang các lọn khác (để phía sau đầu cũng được nhuộm)
        P.dyeAcc += k;
        if (P.dyeAcc > 0.28) {
          P.dyeAcc = 0;
          const others = hair.locks.filter(lk => lk.dye !== key);
          if (others.length) { const lk = others[Math.floor(Math.random() * others.length)]; hair.dyeLock(lk, key, rb ? hair.rainbowHex(lk) : hex); any = true; }
        }
        mood('dye', { eyes: 'open', mouth: 'open' }, t);
        if (fxOk(now, 70)) FX.sparkle(R.x, R.y, rb ? RAINBOW[Math.floor(Math.random() * RAINBOW.length)] : hex, 3);
        if (sfxOk(now, 140)) Sound.fx.rub();
        if (any) P.dirty = true;
        break;
      }
    }
    R.first = false;
  }

  /* ——— kiểm tra yêu cầu ——— */
  function fracMain(f) { let n = 0; for (const lk of hair.main) if (f(lk)) n++; return n / hair.main.length; }
  function fracAll(f) { let n = 0; for (const lk of hair.locks) if (f(lk)) n++; return n / hair.locks.length; }
  function check(st) {
    switch (st.type) {
      case 'wash': st.ok = P.washPhase >= 2; st.match = true; break;
      case 'dry': st.ok = P.washPhase >= 2 && hair.maxWet() < 0.1; st.match = true; break;
      case 'cut': st.ok = fracMain(lk => hair.hang(lk) <= SHORT_HANG) >= 0.6; st.match = true; break;
      case 'grow': st.ok = fracMain(lk => hair.hang(lk) >= LONG_HANG) >= 0.6; st.match = true; break;
      case 'curl': st.ok = fracMain(lk => lk.curl >= CURLED) >= 0.6; st.match = true; break;
      case 'dye': st.ok = fracAll(lk => !!lk.dye) >= 0.7; st.match = fracAll(lk => lk.dye === st.v) >= 0.5; break;
      case 'acc': st.ok = S.acc.any(); st.match = !!S.acc.on[st.v]; break;
    }
  }
  function evalSteps() {
    if (P.mode !== 'level') return;
    let newly = null, changed = false;
    P.steps.forEach((st, i) => {
      const was = st.ok; check(st);
      if (st.ok !== was) {
        changed = true;
        const ic = card.querySelector(`.k-req[data-i="${i}"]`);
        if (ic) { ic.classList.toggle('done', st.ok); if (st.ok) { restart(ic, 'pop'); const c = centerOf(ic); FX.burst(c.x, c.y, '#7FD8A0'); } }
        if (st.ok && !newly) newly = st;
      }
    });
    if (!changed) return;
    renderTools();
    const all = P.steps.every(st => st.ok);
    if (newly) {
      Sound.fx.ding(); happy();
      if (!all) say(STEP_DONE_SAY[newly.type] || pick(PRAISE));
    }
    if (all && !P.allDone) {
      P.allDone = true; cam.classList.add('ready'); renderTools();
      G.later(() => {
        if (G.screen !== 'play' || !P.allDone) return;
        Sound.fx.fanfare(); say('Xong rồi! Bấm máy ảnh để chụp ảnh nào!', true);
        const c = centerOf(cam); FX.burst(c.x, c.y, '#FF7FAA');
      }, 500);
    } else if (!all && P.allDone) { P.allDone = false; cam.classList.remove('ready'); }
  }

  /* ——— chụp ảnh, chấm sao, quà ——— */
  function giftItems(g) {
    const out = [];
    (g.tools || []).forEach(t => out.push({ pic: toolIcon(t, 'hong'), label: TOOLS[t].name }));
    (g.customers || []).forEach(c => out.push({ pic: avatar(CUSTOMERS[c]), label: 'Bạn mới: ' + CUSTOMERS[c].name, round: true }));
    if (g.rainbow) out.push({ pic: toolIcon('dye', 'cauvong'), label: 'Nhuộm cầu vồng' });
    (g.accs || []).forEach(a => out.push({ pic: accIcon(a), label: ACCS[a] }));
    return out;
  }
  function takePhoto() {
    hand.hide(); hideBrush(); R.down = false;
    P.rotTarget = 0; S.turn.rotation.y = 0;
    doll.face.react({ eyes: 'happy', mouth: 'open' }, 1.6); P.moodKey = '';
    flash();
    const img = S.capture(320);
    let stars = 0, rankUp = null;
    if (P.mode === 'level') {
      const mt = P.steps.filter(st => st.type === 'dye' || st.type === 'acc'), m = mt.filter(st => st.match).length;
      stars = !mt.length || m === mt.length ? 3 : m >= mt.length / 2 ? 2 : 1;
      const before = G.done(), prev = G.save.stars[P.lvl] || 0;
      G.save.stars[P.lvl] = Math.max(prev, stars);
      const after = G.done();
      if (!prev && after > before && MILESTONES[P.lvl]) rankUp = { rank: rankFor(after), gift: MILESTONES[P.lvl] };
    }
    G.save.album.unshift({ img, c: P.cust, stars, lvl: P.lvl, d: Date.now() });
    if (G.save.album.length > 20) G.save.album.length = 20;
    Store.save();
    G.later(() => showResult(img, stars, rankUp), 480);
  }
  function showResult(img, stars, rankUp) {
    if (G.screen !== 'play') return;
    const lv = P.mode === 'level', c = CUSTOMERS[P.cust], n = P.lvl;
    const title = lv ? ['Giỏi lắm!', 'Đẹp quá!', 'Tuyệt vời!'][stars - 1] : 'Ảnh đẹp quá!';
    const withGift = fn => () => (rankUp ? giftModal({ rank: rankUp.rank, title: rankTitle(rankUp.rank), items: giftItems(rankUp.gift), onNext: fn }) : fn());
    const last = n >= LEVELS.length;
    resultModal({
      title, stars: lv ? stars : 0, pic: `<img src="${img}" alt="">`,
      caption: `<span>${c.name}</span>${lv ? `<span>Màn ${n}</span>` : ''}`,
      buttons: lv
        ? [{ label: last ? 'Xong' : 'Chơi tiếp', icon: ICONS.play, onClick: withGift(() => (last ? G.show('levels') : startLevel(n + 1))) },
           { label: 'Chơi lại', icon: ICONS.replay, cls: 'ghost small', onClick: withGift(() => startLevel(n)) }]
        : [{ label: 'Làm tiếp', icon: ICONS.play, onClick: () => resetIdle() },
           { label: 'Album', icon: ICONS.album, cls: 'lilac small', onClick: () => G.show('album') }],
      voice: lv ? `${title} Bé được ${stars} ngôi sao!` : 'Ảnh đẹp quá! Đã cất vào album rồi nhé!',
    });
  }

  /* ——— bàn tay gợi ý sau ~7 giây không chạm ——— */
  let idleT = 0;
  function resetIdle() {
    if (idleT) G.clearLater(idleT);
    idleT = 0; hand.hide();
    if (G.screen === 'play') idleT = G.later(idleHint, 7000);
  }
  function idleHint() {
    idleT = 0;
    if (G.screen !== 'play' || modalOpen() || R.down) { if (G.screen === 'play') idleT = G.later(idleHint, 3000); return; }
    idleT = G.later(idleHint, 9000);
    if (P.mode === 'level' && P.allDone) return hand.pointAt(cam, 'tap');
    const st = P.mode === 'level' ? firstOpen() : null;
    const need = st ? toolForStep(st, P.washPhase) : null;
    if (need && need !== P.tool) {
      const b = toolsEl.querySelector(`[data-tool="${need}"]`);
      if (b) { b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); hand.pointAt(b, 'tap'); say.bubble(TOOLS[need].name); }
      return;
    }
    if (P.tool === 'dye' && st && st.type === 'dye' && P.dye !== st.v) {
      const b = palEl.querySelector(`[data-color="${st.v}"]`);
      if (b) { b.scrollIntoView({ block: 'nearest', inline: 'center' }); hand.pointAt(b, 'tap'); say.bubble(cap1(COLORS[st.v].name)); }
      return;
    }
    if (P.tool === 'acc') {
      const b = palEl.querySelector(st && st.type === 'acc' ? `[data-acc="${st.v}"]` : '[data-acc]');
      if (b) hand.pointAt(b, 'tap');
      return;
    }
    // xoa lên tóc: chỉ vào lọn tóc bên má (đang nhìn thấy)
    const side = hair.locks.find(lk => lk.kind === 'A' && lk.a > 0.7 && lk.a < 1.2) || hair.locks[0];
    let fr = 0.35;
    if (P.tool === 'scissors') { // kéo: chỉ vào tóc ngang cằm
      const C = side.centers, n = side.ringS.length; let bd = 9;
      for (let i = 0; i < n; i++) { const d = Math.abs(C[i * 3 + 1] + 0.8); if (d < bd) { bd = d; fr = i / (n - 1); } }
    }
    const p = lockScreen(side, fr);
    hand.point(p.x, p.y, P.tool === 'scissors' ? 'swipe' : 'rub');
    say.bubble(TOOLS[P.tool].say);
  }
  const onRootDown = e => { if (G.screen === 'play' && !e.target.closest('canvas')) resetIdle(); };
  G.root.addEventListener('pointerdown', onRootDown);

  /* ——— mỗi khung hình ——— */
  function frame(dt, t) {
    if (R.down && R.mode === 'rub') rubFrame(dt, t);
    if (R.down && R.mode === 'turn') P.rotTarget = clamp(R.rot0 + (R.x - R.sx) * 0.009, -ROT_MAX, ROT_MAX);
    const prev = S.turn.rotation.y, rot = prev + (P.rotTarget - prev) * Math.min(1, dt * 9);
    if (Math.abs(rot - prev) > 1e-5) { S.turn.rotation.y = rot; hair.swish((prev - rot) * 6); }
    for (const lk of hair.locks) if (lk.cool > 0) lk.cool -= dt;
    if (P.dirty) { P.dirty = false; evalSteps(); }
  }

  return {
    P, startLevel, startFree, pickCustomer, frame, resetIdle,
    leave() { R.down = false; hideBrush(); if (idleT) G.clearLater(idleT); idleT = 0; },
    destroy() {
      canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('pointerleave', onLeave);
      G.root.removeEventListener('pointerdown', onRootDown);
    },
  };
}
