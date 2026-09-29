// hub/hub.js — Góc Vui Chơi: vòng quay 3D để bé chọn game. Vuốt/mũi tên để xoay, chạm nút lớn để chơi.

import { createStage, toon, THREE, Tweens, Ease, shadowCatcher } from '../kit/three-kit.js';
import { Sound, Voice } from '../kit/audio.js';
import { Store } from '../kit/store.js';
import { FX } from '../kit/fx.js';
import { ICONS, toggles, holdToOpen, modal, closeModal, hand, restart, modalOpen } from '../kit/ui.js';
import { MODELS, starShape } from './models.js';

let stage = null, offs = [], timers = [], sel = 0;
const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); offs.push(() => t.removeEventListener(ev, fn, o)); };
const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

export default {
  mount(root, ctx) {
    const games = ctx.games, N = games.length;
    try { const last = sessionStorage.getItem('gvc-last'); const i = games.findIndex(g => g.id === last); if (i >= 0) sel = i; } catch (e) {}

    root.innerHTML = `<div class="k-screen hub">
      <div class="hub-stage" id="hubStage"></div>
      <header class="k-bar">
        <button class="k-round" id="hubGear" aria-label="Dành cho bố mẹ (giữ để mở)">${ICONS.gear}</button>
        <h1 class="hub-logo"><span class="a">Góc Vui Chơi</span><span class="b">của bé</span></h1>
        <div class="k-chip hub-total" aria-label="Tổng số sao"><span class="badge">${ICONS.star}</span><span class="txt"><span class="lv">Sao của bé</span><span class="name" id="hubTotal">${Store.totalStars()}</span></span></div>
        <div class="k-toggles" id="hubToggles"></div>
      </header>
      <button class="hub-arrow prev" id="hubPrev" aria-label="Trò trước">${ICONS.back}</button>
      <button class="hub-arrow next" id="hubNext" aria-label="Trò tiếp theo">${ICONS.next}</button>
      <div class="hub-bottom">
        <div class="hub-dots" id="hubDots">${games.map((g, i) => `<button data-i="${i}" aria-label="${g.name}" style="--c:${g.color}"></button>`).join('')}</div>
        <div class="hub-card" id="hubCard">
          <div class="hub-info"><div class="hub-name" id="hubName"></div><div class="hub-desc" id="hubDesc"></div><div class="hub-meta" id="hubMeta"></div></div>
          <button class="k-btn hub-play" id="hubPlay">${ICONS.play}<span>Chơi</span></button>
        </div>
      </div>
    </div>`;
    const $ = s => root.querySelector(s);
    toggles($('#hubToggles'));
    holdToOpen($('#hubGear'), 1200, openParent);

    /* ——— thông tin trò đang chọn ——— */
    const card = $('#hubCard'), play = $('#hubPlay');
    function showInfo(speak) {
      const g = games[sel], st = Store.starsOf(g.id);
      $('#hubName').textContent = g.name; $('#hubDesc').textContent = g.desc;
      $('#hubMeta').innerHTML = st ? `<span class="one">${ICONS.star}</span><span>Bé đã có ${st} sao</span>` : '<span class="new">Trò mới!</span>';
      play.style.background = g.color; play.style.boxShadow = `0 7px 0 ${g.dark}`;
      card.style.setProperty('--c', g.color);
      root.querySelectorAll('#hubDots button').forEach((b, i) => b.classList.toggle('on', i === sel));
      restart(card, 'swap');
      if (speak) Voice.say(g.name);
      try { sessionStorage.setItem('gvc-last', g.id); } catch (e) {}
    }

    /* ——— sân khấu 3D ——— */
    const R = 3.3, items = [];
    let phi = sel * (Math.PI * 2 / N), target = phi, leaving = false;
    try {
      stage = createStage($('#hubStage'), { sky: ['#FFD9EA', '#DFF0FF'], fov: 36, onResize: frame });
    } catch (e) {
      console.error(e); stage = null;
      root.querySelector('.hub').classList.add('flat');
    }
    if (stage) frame(stage.width, stage.height);
    function frame(w, h) {
      if (!stage) return;
      const a = w / h, cam = stage.camera;
      const dist = a < 0.6 ? 19 : a < 0.9 ? 15 : a < 1.3 ? 12.5 : 11;
      // điện thoại ngang: thẻ thông tin nằm bên phải nên dời vòng quay sang trái
      const shift = a > 1.3 && h < 520 ? 2.4 : 0;
      cam.position.set(shift, a < 0.6 ? 6.2 : a < 0.9 ? 5.4 : 4.8, R + dist);
      cam.lookAt(shift, a < 0.6 ? -1.1 : a < 0.9 ? -0.2 : 0.5, 0);
    }
    if (stage) {
      const { scene } = stage;
      stage.sun.shadow.camera.left = stage.sun.shadow.camera.bottom = -7;
      stage.sun.shadow.camera.right = stage.sun.shadow.camera.top = 7;
      // bệ tròn như đĩa bánh
      const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 2.1, R + 2.3, 0.5, 64), toon('#FFF3F8'));
      base.position.y = -0.95; base.receiveShadow = true; scene.add(base);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 2.2, 0.16, 12, 80), toon('#FFB3CF'));
      rim.rotation.x = Math.PI / 2; rim.position.y = -0.72; scene.add(rim);
      const sh = shadowCatcher(16, 0.14); sh.position.y = -0.69; scene.add(sh);

      games.forEach((g, i) => {
        const grp = new THREE.Group(); grp.userData.idx = i;
        const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.45, 0.34, 40), toon(g.color));
        plat.castShadow = plat.receiveShadow = true; plat.position.y = -0.17; grp.add(plat);
        const top = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 40), toon('#FFFFFF')); top.position.y = 0.02; top.receiveShadow = true; grp.add(top);
        const model = (MODELS[g.id] || MODELS['trang-diem'])(); model.position.y = 0.05; grp.add(model);
        grp.userData.model = model;
        grp.traverse(o => { o.userData.idx = i; });
        scene.add(grp); items.push(grp);
      });

      // mây & sao bay lơ lửng
      const cloudMat = toon('#FFFFFF'), clouds = [];
      for (let i = 0; i < 6; i++) {
        const c = new THREE.Group();
        [[0, 0, 0.9], [0.9, -0.1, 0.7], [-0.9, -0.15, 0.65], [0.35, 0.4, 0.6]].forEach(([x, y, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), cloudMat); s.position.set(x, y, 0); c.add(s); });
        c.position.set(-16 + i * 6.5, 5 + (i % 3) * 1.6, -10 - (i % 2) * 4); c.scale.setScalar(0.9 + (i % 3) * 0.25);
        scene.add(c); clouds.push(c);
      }
      const sg = starShape(), stars = [];
      ['#FFD34D', '#FF9EC4', '#8FD8F0', '#C9A7F5', '#FFD34D', '#FF9EC4'].forEach((col, i) => {
        const s = new THREE.Mesh(sg, toon(col)); s.position.set(-7 + i * 2.8, 3.6 + (i % 2) * 1.8, -4 - (i % 3)); s.userData.ph = i;
        scene.add(s); stars.push(s);
      });

      stage.onFrame((dt, t) => {
        phi += (target - phi) * Math.min(1, dt * 7);
        items.forEach((grp, i) => {
          const a = i * (Math.PI * 2 / N) - phi;
          const front = (Math.cos(a) + 1) / 2;
          grp.position.set(Math.sin(a) * R, Math.sin(t * 1.6 + i) * 0.08 + front * 0.25, Math.cos(a) * R);
          grp.scale.setScalar(0.72 + front * 0.42);
          grp.userData.model.rotation.y = i === sel ? Math.sin(t * 0.8) * 0.5 : -a * 0.6;
        });
        clouds.forEach(c => { c.position.x += dt * 0.35; if (c.position.x > 20) c.position.x = -20; });
        stars.forEach(s => { s.rotation.y = t * 0.8 + s.userData.ph; s.position.y += Math.sin(t * 1.2 + s.userData.ph) * 0.003; });
      });
      stage.start();
    }

    /* ——— điều khiển ——— */
    const TAU = Math.PI * 2, step = TAU / N;
    function select(i, speak = true) {
      const n = ((i % N) + N) % N;
      let d = (n * step - target) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU;
      target += d; sel = n; showInfo(speak); Sound.fx.whoosh(); resetIdle();
    }
    function launch() {
      if (leaving) return; leaving = true; hand.hide();
      const g = games[sel];
      Sound.fx.magic();
      const p = play.getBoundingClientRect(); FX.burst(p.left + p.width / 2, p.top + p.height / 2, g.color);
      if (stage) {
        const cam = stage.camera.position;
        Tweens.add(cam, { z: cam.z - 6, y: cam.y - 0.8 }, 0.55, { ease: Ease.inQuad });
        later(() => ctx.goGame(g.id), 520);
      } else ctx.goGame(g.id);
    }
    on($('#hubPrev'), 'click', () => select(sel - 1));
    on($('#hubNext'), 'click', () => select(sel + 1));
    on(play, 'click', launch);
    on($('#hubDots'), 'click', e => { const b = e.target.closest('[data-i]'); if (b) select(+b.dataset.i); });
    on(window, 'keydown', e => {
      if (modalOpen()) return;
      if (e.key === 'ArrowLeft') select(sel - 1); else if (e.key === 'ArrowRight') select(sel + 1);
      else if (e.key === 'Enter' && document.activeElement === document.body) launch();
    });

    // vuốt trên sân khấu để xoay, chạm vào mô hình để chọn/chơi
    const surface = $('#hubStage');
    let drag = null;
    on(surface, 'pointerdown', e => { drag = { x: e.clientX, t: performance.now(), start: target, moved: false }; resetIdle(); try { surface.setPointerCapture(e.pointerId); } catch (_) {} });
    on(surface, 'pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 8) drag.moved = true;
      if (drag.moved) target = drag.start - dx * (step / Math.max(160, surface.clientWidth * 0.38));
    });
    on(surface, 'pointerup', e => {
      if (!drag) return;
      const d = drag; drag = null;
      if (d.moved) { const n = Math.round(target / step); target = n * step; sel = ((n % N) + N) % N; showInfo(true); Sound.fx.whoosh(); return; }
      if (!stage) return;
      const hit = stage.raycast(e, items)[0];
      if (!hit) return;
      const i = hit.object.userData.idx;
      if (i === sel) launch(); else select(i);
    });
    on(surface, 'pointercancel', () => { drag = null; target = Math.round(target / step) * step; });

    /* ——— gợi ý khi bé chưa biết làm gì ——— */
    let idleT;
    function resetIdle() { clearTimeout(idleT); hand.hide(); idleT = later(() => { if (!modalOpen() && !leaving) hand.pointAt(play, 'tap'); }, 6500); }
    on(document, 'pointerdown', resetIdle);

    showInfo(false);
    resetIdle();
    later(() => Voice.say('Chào bé! Bé muốn chơi trò gì nào?'), 400);
  },

  unmount() {
    offs.forEach(f => f()); offs = [];
    timers.forEach(clearTimeout); timers = [];
    hand.hide();
    if (stage) { stage.dispose(); stage = null; }
  },
};

/* ——— cài đặt dành cho bố mẹ ——— */
function openParent() {
  let armed = false;
  modal(`<div class="k-eyebrow">Dành cho bố mẹ</div><h2>Cài đặt</h2>
    <div class="hub-parent">
      <button class="k-btn ghost" id="pReset">Xoá tiến trình của mọi trò chơi</button>
      <button class="k-btn" id="pClose">Xong</button>
    </div>
    <p class="hub-note">${Voice.available ? 'Giọng đọc tiếng Việt đang hoạt động.' : 'Trình duyệt này chưa có giọng đọc tiếng Việt; bé vẫn chơi được bằng hình ảnh và âm thanh.'}
      Tiến trình và album được lưu trên trình duyệt của máy này.</p>`, c => {
    c.querySelector('#pReset').onclick = e => {
      if (!armed) { armed = true; e.currentTarget.textContent = 'Bấm lần nữa để xoá hết'; e.currentTarget.style.color = 'var(--accent-dark)'; return; }
      Store.resetAll(); Sound.fx.boop(); closeModal();
      const t = document.getElementById('hubTotal'); if (t) t.textContent = '0';
    };
    c.querySelector('#pClose').onclick = () => { Sound.fx.tap(); closeModal(); };
  });
}
