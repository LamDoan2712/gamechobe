// kit/fx.js — hạt lấp lánh, tim, bong bóng, pháo giấy vẽ trên một canvas phủ toàn màn hình (dùng chung mọi game)

let cv, g, W = 0, H = 0, dpr = 1, running = false;
const parts = [];
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CONF = ['#FF7FAA', '#FFC53D', '#7FDCC4', '#A56CF0', '#58A8F5', '#FFA77A'];
const n = k => (reduce ? Math.ceil(k / 3) : k);
const rnd = (a, b) => a + Math.random() * (b - a);

function init() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.className = 'k-fx'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv); g = cv.getContext('2d');
  const size = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
  };
  size(); addEventListener('resize', size);
}
function add(p) {
  init();
  if (parts.length > 450) parts.shift();
  parts.push(Object.assign({ life: 1, decay: 0.02, grav: 0.05, rot: 0, vr: 0, size: 8 }, p));
  if (!running) { running = true; requestAnimationFrame(tick); }
}

function drawStar(s) {
  g.beginPath();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s, a = i * Math.PI / 4; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
  g.closePath(); g.fill();
}
function drawHeart(s) {
  g.beginPath(); g.moveTo(0, s * 0.8);
  g.bezierCurveTo(-s * 1.3, 0, -s * 0.8, -s, 0, -s * 0.35);
  g.bezierCurveTo(s * 0.8, -s, s * 1.3, 0, 0, s * 0.8); g.fill();
}
function tick() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vy += p.grav; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.decay;
    if (p.type === 'conf') p.vx += Math.sin(p.life * 20) * 0.05;
    if (p.life <= 0 || p.y > H + 40) { parts.splice(i, 1); continue; }
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life * 1.5);
    g.fillStyle = p.color; g.strokeStyle = p.color;
    const s = p.size * (p.type === 'spark' ? 0.6 + p.life * 0.5 : 1);
    if (p.type === 'spark') drawStar(s);
    else if (p.type === 'heart') drawHeart(s * 0.6);
    else if (p.type === 'conf') g.fillRect(-s / 2, -s / 4, s, s / 2);
    else if (p.type === 'dot') { g.beginPath(); g.arc(0, 0, s / 2, 0, Math.PI * 2); g.fill(); }
    else if (p.type === 'bubble') {
      g.lineWidth = 2.5; g.fillStyle = 'rgba(220,242,255,.35)';
      g.beginPath(); g.arc(0, 0, s, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(-s * 0.35, -s * 0.35, s * 0.22, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  if (parts.length) requestAnimationFrame(tick); else { running = false; g.clearRect(0, 0, W, H); }
}

export const FX = {
  init,
  sparkle(x, y, color, k = 3) {
    for (let i = 0; i < n(k); i++) add({ type: 'spark', x: x + rnd(-14, 14), y: y + rnd(-14, 14), vx: rnd(-1.5, 1.5), vy: rnd(-2.5, -0.5), color: Math.random() < 0.4 ? '#FFFFFF' : color, size: rnd(6, 13), decay: rnd(0.025, 0.045), grav: 0.02, vr: rnd(-0.1, 0.1) });
  },
  burst(x, y, color = '#FF7FAA') {
    for (let i = 0; i < n(18); i++) {
      const a = (i / 18) * Math.PI * 2, s = rnd(3, 7);
      add({ type: i % 3 ? 'spark' : 'heart', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, color: i % 2 ? color : '#FFD34D', size: rnd(9, 16), decay: 0.022, grav: 0.08, vr: rnd(-0.2, 0.2) });
    }
  },
  hearts(x, y, k = 5) {
    for (let i = 0; i < n(k); i++) add({ type: 'heart', x: x + rnd(-40, 40), y: y + rnd(-10, 10), vx: rnd(-0.6, 0.6), vy: rnd(-3, -1.6), color: ['#FF6B9D', '#FF9EC4', '#FFB27A'][i % 3], size: rnd(12, 20), decay: 0.014, grav: -0.01 });
  },
  bubbles(x, y, k = 3) {
    for (let i = 0; i < n(k); i++) add({ type: 'bubble', x: x + rnd(-20, 20), y: y + rnd(-20, 20), vx: rnd(-1, 1), vy: rnd(-2.2, -0.6), color: '#9FD8FF', size: rnd(8, 22), decay: rnd(0.012, 0.022), grav: -0.015 });
  },
  drops(x, y, color = '#7FC4FF', k = 4) {
    for (let i = 0; i < n(k); i++) add({ type: 'dot', x: x + rnd(-16, 16), y: y + rnd(-6, 6), vx: rnd(-1.5, 1.5), vy: rnd(-2, 0.5), color, size: rnd(5, 10), decay: 0.02, grav: 0.25 });
  },
  confetti() {
    init();
    for (let i = 0; i < n(120); i++) add({ type: 'conf', x: rnd(0, W), y: rnd(-H * 0.4, -10), vx: rnd(-1.5, 1.5), vy: rnd(2, 5), color: CONF[i % CONF.length], size: rnd(8, 14), decay: 0.004, grav: 0.03, vr: rnd(-0.2, 0.2), rot: rnd(0, 6) });
  },
  clear() { parts.length = 0; },
};
