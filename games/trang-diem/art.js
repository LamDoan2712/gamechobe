// art.js — vẽ nhân vật, phụ kiện, hình dán và biểu tượng bằng SVG
import { COLORS, CHARS } from './data.js';

const EYES = [150, 250], EYE_Y = 288;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v * (1 - amt))));
  return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
}
const hairFill = k => (k === 'rainbow' ? 'url(#g-rb)' : COLORS[k].hex);
const browColor = k => (k === 'rainbow' ? '#9C6BB5' : shade(COLORS[k].hex, k === 'cream' ? 0.42 : 0.32));
const mirror = s => `<g transform="translate(400 0) scale(-1 1)">${s}</g>`;

// Bộ đồ dùng chung: gradient, bộ lọc, hình dán (đặt một lần trong trang)
function installSprite() {
  if (document.getElementById('g-rb')) return;
  const star = 'M0,-44 L12,-14 L44,-13 L19,7 L28,40 L0,21 L-28,40 L-19,7 L-44,-13 L-12,-14 Z';
  const petals = [0, 72, 144, 216, 288].map(a => {
    const r = a * Math.PI / 180;
    return `<circle cx="${(Math.sin(r) * 22).toFixed(1)}" cy="${(-Math.cos(r) * 22).toFixed(1)}" r="17"/>`;
  }).join('');
  const svg = `<svg class="sprite" aria-hidden="true" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden">
  <defs>
    <linearGradient id="g-rb" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="490">
      <stop offset="0" stop-color="#FF8FB8"/><stop offset=".2" stop-color="#FFB27A"/><stop offset=".4" stop-color="#FFE17A"/>
      <stop offset=".6" stop-color="#8FE3A6"/><stop offset=".8" stop-color="#7FC4FF"/><stop offset="1" stop-color="#C39BFF"/>
    </linearGradient>
    <linearGradient id="g-rb-i" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF8FB8"/><stop offset=".25" stop-color="#FFB27A"/><stop offset=".5" stop-color="#FFE17A"/>
      <stop offset=".75" stop-color="#8FE3A6"/><stop offset="1" stop-color="#9BB8FF"/>
    </linearGradient>
    <linearGradient id="g-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset="1" stop-color="#FFBE2E"/></linearGradient>
    <radialGradient id="g-eye" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#8A5A9E"/><stop offset=".55" stop-color="#4A2A55"/><stop offset="1" stop-color="#241326"/></radialGradient>
    <filter id="f-blur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
    <symbol id="stk-star" viewBox="-50 -50 100 100"><path d="${star}" fill="#FFD34D" stroke="#F4A51C" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="-9" cy="0" r="4" fill="#6B3B1E"/><circle cx="9" cy="0" r="4" fill="#6B3B1E"/><path d="M-6,9 Q0,15 6,9" stroke="#6B3B1E" stroke-width="3.5" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="stk-heart" viewBox="-50 -50 100 100"><path d="M0,38 C-52,5 -40,-42 0,-18 C40,-42 52,5 0,38 Z" fill="#FF6B9D" stroke="#E4447F" stroke-width="6" stroke-linejoin="round"/>
      <ellipse cx="-18" cy="-12" rx="9" ry="5" fill="#fff" opacity=".65" transform="rotate(-35 -18 -12)"/></symbol>
    <symbol id="stk-flower" viewBox="-50 -50 100 100"><g fill="#FF9EC4" stroke="#F27AAA" stroke-width="4">${petals}</g><circle r="14" fill="#FFD34D" stroke="#F4A51C" stroke-width="4"/></symbol>
    <symbol id="stk-butterfly" viewBox="-50 -50 100 100">
      <ellipse cx="-20" cy="-14" rx="22" ry="18" fill="#8FB8FF" stroke="#5E8FE8" stroke-width="4" transform="rotate(-20 -20 -14)"/>
      <ellipse cx="20" cy="-14" rx="22" ry="18" fill="#8FB8FF" stroke="#5E8FE8" stroke-width="4" transform="rotate(20 20 -14)"/>
      <ellipse cx="-16" cy="16" rx="15" ry="13" fill="#D2B0FF" stroke="#A57CEB" stroke-width="4"/>
      <ellipse cx="16" cy="16" rx="15" ry="13" fill="#D2B0FF" stroke="#A57CEB" stroke-width="4"/>
      <ellipse rx="6" ry="26" fill="#5B3A6B"/><path d="M-3,-24 Q-10,-40 -16,-42 M3,-24 Q10,-40 16,-42" stroke="#5B3A6B" stroke-width="3.5" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="stk-moon" viewBox="-50 -50 100 100"><path d="M14,-38 A40,40 0 1 0 40,12 A30,30 0 0 1 14,-38 Z" fill="#FFE07A" stroke="#F4B41C" stroke-width="5" stroke-linejoin="round"/>
      <path d="M-20,-2 Q-15,3 -10,-2" stroke="#8A5A1E" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="-24" cy="10" r="5" fill="#FFB0B0" opacity=".8"/></symbol>
    <symbol id="stk-sparkle" viewBox="-50 -50 100 100"><path d="M0,-44 Q6,-6 44,0 Q6,6 0,44 Q-6,6 -44,0 Q-6,-6 0,-44 Z" fill="#FFF7C2" stroke="#FFC53D" stroke-width="5" stroke-linejoin="round"/>
      <path d="M30,-34 Q32,-28 38,-26 Q32,-24 30,-18 Q28,-24 22,-26 Q28,-28 30,-34 Z" fill="#FFC53D"/></symbol>
  </defs></svg>`;
  document.body.insertAdjacentHTML('afterbegin', svg);
}

const HAIR_BACK = {
  pigtails: `<ellipse cx="200" cy="238" rx="142" ry="128"/>
    <ellipse cx="54" cy="340" rx="36" ry="66" transform="rotate(14 54 340)"/>
    <ellipse cx="346" cy="340" rx="36" ry="66" transform="rotate(-14 346 340)"/>`,
  bob: `<path d="M62,290 C50,160 120,104 200,104 C280,104 350,160 338,290 C342,344 332,384 300,396 L100,396 C68,384 58,344 62,290 Z"/>`,
  long: `<path d="M60,280 C48,150 120,100 200,100 C280,100 352,150 340,280 C350,370 364,440 334,488 Q304,478 274,488 L126,488 Q96,478 66,488 C36,440 50,370 60,280 Z"/>`,
  mane: `<path d="M58,280 C45,150 120,98 200,98 C280,98 355,150 342,280 C372,328 344,362 364,402 C384,442 352,476 342,496 L58,496 C48,476 16,442 36,402 C56,362 28,328 58,280 Z"/>`,
};
const BANGS = 'M70,282 C58,150 130,100 200,100 C270,100 342,150 330,282 C324,240 312,214 294,200 Q276,222 250,196 Q226,220 200,192 Q174,220 150,196 Q124,222 106,200 C88,214 76,240 70,282 Z';

function earsSvg(ch, hf) {
  switch (ch.ears) {
    case 'cat': return [0, 1].map(m => {
      const s = `<path class="hc" fill="${hf}" d="M84,214 Q78,110 96,80 Q106,70 120,80 L186,150 Z"/><path fill="#FFB8CB" d="M102,186 Q98,122 110,102 L160,150 Z"/>`;
      return m ? mirror(s) : s;
    }).join('');
    case 'bunny': return [0, 1].map(m => {
      const s = `<g transform="rotate(-12 150 100)"><ellipse cx="150" cy="96" rx="30" ry="86" fill="${ch.skin}" stroke="${ch.shade}" stroke-width="4"/><ellipse cx="150" cy="104" rx="14" ry="62" fill="#FFC2D1"/></g>`;
      return m ? mirror(s) : s;
    }).join('');
    case 'bear': return [0, 1].map(m => {
      const s = `<circle class="hc" fill="${hf}" cx="96" cy="150" r="40"/><circle cx="96" cy="150" r="21" fill="${ch.shade}"/>`;
      return m ? mirror(s) : s;
    }).join('');
    case 'unicorn': return [0, 1].map(m => {
      const s = `<path d="M108,178 Q98,120 116,98 Q142,124 152,160 Z" fill="${ch.skin}" stroke="${ch.shade}" stroke-width="4" stroke-linejoin="round"/><path d="M116,160 Q112,128 119,116 Q134,134 140,156 Z" fill="#FFC7DA"/>`;
      return m ? mirror(s) : s;
    }).join('');
    default: return '';
  }
}

function faceExtras(ch) {
  let s = '';
  if (ch.ears === 'human') {
    s += [0, 1].map(m => {
      const e = `<ellipse cx="72" cy="292" rx="18" ry="24" fill="${ch.skin}"/><ellipse cx="75" cy="294" rx="9" ry="13" fill="${ch.shade}"/>`;
      return m ? mirror(e) : e;
    }).join('');
  }
  return s;
}

function noseSvg(ch) {
  switch (ch.nose) {
    case 'cat': return `<path d="M191,313 L209,313 L200,324 Z" fill="#F58FA8" stroke="#E57493" stroke-width="3" stroke-linejoin="round"/>`;
    case 'bunny': return `<ellipse cx="200" cy="318" rx="8" ry="5.5" fill="#F7A1B8"/>`;
    case 'bear': return `<ellipse cx="200" cy="318" rx="12" ry="8.5" fill="#6B4430"/><ellipse cx="196" cy="315" rx="4" ry="2.5" fill="#fff" opacity=".6"/>`;
    default: return `<ellipse cx="200" cy="318" rx="6" ry="4" fill="${ch.shade}"/>`;
  }
}

function accSvg(acc) {
  let s = '';
  if (acc.necklace) {
    const P0 = [156, 414], C = [200, 468], P2 = [244, 414];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, x = (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * C[0] + t * t * P2[0], y = (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * C[1] + t * t * P2[1];
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#FFFDF8" stroke="#DCCBEA" stroke-width="2"/>`;
    }
    s += `<path d="M200,462 C184,448 190,436 200,444 C210,436 216,448 200,462 Z" fill="#FF6B9D" stroke="#E4447F" stroke-width="2.5"/>`;
  }
  if (acc.flowers) {
    const spots = [[92, 206], [112, 164], [150, 132], [200, 118], [250, 132], [288, 164], [308, 206]];
    const cols = ['#FF9EC4', '#D2B0FF', '#FFB27A', '#FF9EC4', '#8FD8F0', '#D2B0FF', '#FFB27A'];
    spots.forEach(([x, y], i) => {
      if (i < spots.length - 1) {
        const [nx, ny] = spots[i + 1];
        s += `<ellipse cx="${(x + nx) / 2}" cy="${(y + ny) / 2 - 2}" rx="10" ry="5" fill="#6CCB7E" transform="rotate(${Math.atan2(ny - y, nx - x) * 57.3} ${(x + nx) / 2} ${(y + ny) / 2 - 2})"/>`;
      }
    });
    spots.forEach(([x, y], i) => {
      s += `<g transform="translate(${x} ${y})" fill="${cols[i]}">` + [0, 72, 144, 216, 288].map(a => {
        const r = a * Math.PI / 180; return `<circle cx="${(Math.sin(r) * 10).toFixed(1)}" cy="${(-Math.cos(r) * 10).toFixed(1)}" r="8.5"/>`;
      }).join('') + `<circle r="6.5" fill="#FFD34D"/></g>`;
    });
  }
  if (acc.crown) {
    s += `<g transform="translate(200 108)">
      <path d="M-46,22 L-52,-22 L-25,2 L0,-36 L25,2 L52,-22 L46,22 Z" fill="url(#g-gold)" stroke="#E7A92A" stroke-width="4" stroke-linejoin="round"/>
      <rect x="-47" y="14" width="94" height="16" rx="7" fill="#FFC53D" stroke="#E7A92A" stroke-width="3"/>
      <circle cx="0" cy="-2" r="8" fill="#FF5C9A"/><circle cx="-29" cy="10" r="5.5" fill="#58A8F5"/><circle cx="29" cy="10" r="5.5" fill="#62CC7A"/>
      <circle cx="-52" cy="-22" r="6" fill="#FFF3B0"/><circle cx="0" cy="-36" r="6" fill="#FFF3B0"/><circle cx="52" cy="-22" r="6" fill="#FFF3B0"/>
      <circle cx="-3" cy="-5" r="2.5" fill="#fff"/></g>`;
  }
  if (acc.bow) {
    s += `<g transform="translate(294 150) rotate(22)">
      <path d="M-4,6 L-20,44 L-8,38 L0,48 Z M4,6 L20,44 L8,38 L0,48 Z" fill="#FF5C9A" stroke="#D93F7C" stroke-width="3" stroke-linejoin="round"/>
      <path d="M0,0 C-30,-34 -58,-6 -48,14 C-40,32 -14,16 0,0 Z" fill="#FF7FAA" stroke="#D93F7C" stroke-width="4" stroke-linejoin="round"/>
      <path d="M0,0 C30,-34 58,-6 48,14 C40,32 14,16 0,0 Z" fill="#FF7FAA" stroke="#D93F7C" stroke-width="4" stroke-linejoin="round"/>
      <circle r="11" fill="#FF5C9A" stroke="#D93F7C" stroke-width="3.5"/><circle cx="-22" cy="-2" r="5" fill="#fff" opacity=".7"/><circle cx="22" cy="-2" r="5" fill="#fff" opacity=".7"/></g>`;
  }
  if (acc.glasses) {
    const heart = (cx, cy, k) => `M${cx},${cy + k * 0.95} C${cx - k * 1.35},${cy + k * 0.1} ${cx - k * 0.95},${cy - k * 0.95} ${cx},${cy - k * 0.35} C${cx + k * 0.95},${cy - k * 0.95} ${cx + k * 1.35},${cy + k * 0.1} ${cx},${cy + k * 0.95} Z`;
    s += `<g stroke="#E4447F" stroke-width="5" stroke-linejoin="round">
      <path d="${heart(150, 290, 34)}" fill="#FF7FAA" fill-opacity=".42"/><path d="${heart(250, 290, 34)}" fill="#FF7FAA" fill-opacity=".42"/>
      <path d="M182,276 Q200,266 218,276" fill="none" stroke-linecap="round"/><path d="M106,278 L78,270 M294,278 L322,270" stroke-linecap="round"/></g>
      <ellipse cx="134" cy="274" rx="8" ry="4" fill="#fff" opacity=".6" transform="rotate(-30 134 274)"/><ellipse cx="234" cy="274" rx="8" ry="4" fill="#fff" opacity=".6" transform="rotate(-30 234 274)"/>`;
  }
  return s;
}

function stickersSvg(list) {
  return list.map(t => `<g transform="rotate(${t.r} ${t.x.toFixed(1)} ${t.y.toFixed(1)})"><use href="#stk-${t.t}" x="${(t.x - t.s / 2).toFixed(1)}" y="${(t.y - t.s / 2).toFixed(1)}" width="${t.s}" height="${t.s}"/></g>`).join('');
}

function newLook(charId) {
  return { blush: { c: 'pink', a: 0 }, eyes: { c: 'purple', a: 0 }, lips: { c: 'pink', a: 0 }, lashes: { c: 'black', a: 0 },
    hair: CHARS[charId].hair, acc: {}, stk: [] };
}

// Vẽ toàn bộ nhân vật. opts.live = nhân vật chính trên bàn trang điểm (có chớp mắt, vùng gợi ý)
function renderCharacter(charId, look, opts = {}) {
  const ch = CHARS[charId], hf = hairFill(look.hair), brow = browColor(look.hair);
  const eyes = EYES.map(ex => `<g class="eye"><ellipse cx="${ex}" cy="${EYE_Y}" rx="22" ry="27" fill="url(#g-eye)"/>
    <circle cx="${ex + 8}" cy="${EYE_Y - 10}" r="8.5" fill="#fff"/><circle cx="${ex - 8}" cy="${EYE_Y + 11}" r="4" fill="#fff" opacity=".9"/></g>
    <path d="M${ex - 23},${EYE_Y - 6} Q${ex},${EYE_Y - 44} ${ex + 23},${EYE_Y - 6}" stroke="#3B2340" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('');
  const lashes = EYES.map((ex, i) => {
    const s = i ? 1 : -1;
    const f = [[18, -17, 31, -28], [22, -9, 36, -15], [10, -23, 18, -37]].map(([a, b, c, d]) =>
      `M${ex + s * a},${EYE_Y + b} L${ex + s * c},${EYE_Y + d}`).join(' ');
    return `<path d="M${ex - 24},${EYE_Y - 5} Q${ex},${EYE_Y - 47} ${ex + 24},${EYE_Y - 5}" stroke-width="6.5"/><path d="${f}" stroke-width="5"/>`;
  }).join('');
  const brows = EYES.map(ex => `<path class="brow" d="M${ex - 17},${EYE_Y - 52} Q${ex},${EYE_Y - 62} ${ex + 17},${EYE_Y - 52}" stroke="${brow}" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('');
  const whiskers = ch.whiskers ? [0, 1].map(m => {
    const w = `<path d="M116,324 L78,316 M116,334 L76,338" stroke="${ch.shade}" stroke-width="3.5" stroke-linecap="round"/>`;
    return m ? mirror(w) : w;
  }).join('') : '';
  const LIPS = 'M178,350 Q189,343 200,348 Q211,343 222,350 Q213,371 200,371 Q187,371 178,350 Z';
  const ties = ch.style === 'pigtails' ? `<circle cx="76" cy="278" r="13" fill="#FF5C9A"/><circle cx="324" cy="278" r="13" fill="#FF5C9A"/><circle cx="72" cy="274" r="4" fill="#fff" opacity=".7"/><circle cx="320" cy="274" r="4" fill="#fff" opacity=".7"/>` : '';
  const horn = ch.ears === 'unicorn' ? `<path d="M185,128 L200,26 L215,128 Q200,136 185,128 Z" fill="url(#g-gold)" stroke="#E7A92A" stroke-width="3" stroke-linejoin="round"/>
    <path d="M188,108 L212,98 M192,82 L208,76 M195,58 L205,54" stroke="#E7A92A" stroke-width="3" stroke-linecap="round"/>` : '';
  const vb = opts.viewBox || '0 0 400 520';

  return `<svg viewBox="${vb}" class="char${opts.live ? ' live' : ''}" role="img" aria-label="${ch.name}" xmlns="http://www.w3.org/2000/svg">
  <g class="char-body">
    <g class="hc" fill="${hf}">${HAIR_BACK[ch.style]}</g>${ties}
    ${earsSvg(ch, hf)}
    <rect x="174" y="352" width="52" height="76" rx="22" fill="${ch.shade}"/>
    <path d="M66,520 C74,446 128,414 200,414 C272,414 326,446 334,520 Z" fill="${ch.outfit}"/>
    <path d="M200,418 Q176,454 138,428 Q168,410 200,418 Z" fill="${ch.outfit2}"/><path d="M200,418 Q224,454 262,428 Q232,410 200,418 Z" fill="${ch.outfit2}"/>
    <circle cx="200" cy="476" r="7" fill="${ch.outfit2}"/>
    ${faceExtras(ch)}
    <ellipse cx="200" cy="268" rx="130" ry="120" fill="${ch.skin}"/>
    <g filter="url(#f-blur)" fill="#FFAFC0" opacity=".35"><ellipse cx="128" cy="334" rx="28" ry="15"/><ellipse cx="272" cy="334" rx="28" ry="15"/></g>
    <g data-k="blush" filter="url(#f-blur)" fill="${COLORS[look.blush.c].hex}" opacity="${(look.blush.a * 0.8).toFixed(3)}"><ellipse cx="128" cy="330" rx="34" ry="21"/><ellipse cx="272" cy="330" rx="34" ry="21"/></g>
    <g data-k="eyes" filter="url(#f-blur)" fill="${COLORS[look.eyes.c].hex}" opacity="${(look.eyes.a * 0.85).toFixed(3)}"><ellipse cx="150" cy="272" rx="38" ry="28"/><ellipse cx="250" cy="272" rx="38" ry="28"/></g>
    ${eyes}
    <g data-k="lashes" stroke="${COLORS[look.lashes.c].hex}" opacity="${look.lashes.a.toFixed(3)}" fill="none" stroke-linecap="round">${lashes}</g>
    ${brows}${noseSvg(ch)}${whiskers}
    <path d="${LIPS}" fill="${ch.lip}"/>
    <path data-k="lips" d="${LIPS}" fill="${COLORS[look.lips.c].hex}" opacity="${look.lips.a.toFixed(3)}"/>
    <path d="M182,352 Q200,359 218,352" stroke="${shade(ch.lip, 0.28)}" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>
    <ellipse data-k="gloss" cx="193" cy="363" rx="6" ry="2.6" fill="#fff" opacity="${(look.lips.a * 0.75).toFixed(3)}"/>
    <path class="hc" d="${BANGS}" fill="${hf}"/>
    <path d="M122,150 Q160,118 206,114" stroke="#fff" stroke-opacity=".35" stroke-width="9" fill="none" stroke-linecap="round"/>
    ${horn}
    <g data-k="acc">${accSvg(look.acc)}</g>
    <g data-k="stk">${stickersSvg(look.stk)}</g>
    ${opts.live ? '<g data-k="hint" class="hint"></g>' : ''}
  </g></svg>`;
}

// Cập nhật nhanh các lớp trang điểm (không vẽ lại cả nhân vật)
function applyLook(svg, look) {
  const q = k => svg.querySelector(`[data-k="${k}"]`);
  q('blush').setAttribute('fill', COLORS[look.blush.c].hex); q('blush').setAttribute('opacity', (look.blush.a * 0.8).toFixed(3));
  q('eyes').setAttribute('fill', COLORS[look.eyes.c].hex); q('eyes').setAttribute('opacity', (look.eyes.a * 0.85).toFixed(3));
  q('lips').setAttribute('fill', COLORS[look.lips.c].hex); q('lips').setAttribute('opacity', look.lips.a.toFixed(3));
  q('gloss').setAttribute('opacity', (look.lips.a * 0.75).toFixed(3));
  q('lashes').setAttribute('stroke', COLORS[look.lashes.c].hex); q('lashes').setAttribute('opacity', look.lashes.a.toFixed(3));
  const hf = hairFill(look.hair), brow = browColor(look.hair);
  svg.querySelectorAll('.hc').forEach(e => e.setAttribute('fill', hf));
  svg.querySelectorAll('.brow').forEach(e => e.setAttribute('stroke', brow));
}
function applyAcc(svg, look) { svg.querySelector('[data-k="acc"]').innerHTML = accSvg(look.acc); }
function applyStickers(svg, look) { svg.querySelector('[data-k="stk"]').innerHTML = stickersSvg(look.stk); }

// Biểu tượng dụng cụ (64×64). c = màu đang chọn
function toolIcon(tool, c) {
  const col = c === 'rainbow' ? 'url(#g-rb-i)' : (COLORS[c] ? COLORS[c].hex : c);
  const w = b => `<svg viewBox="0 0 64 64" aria-hidden="true">${b}</svg>`;
  switch (tool) {
    case 'blush': return w(`<circle cx="32" cy="34" r="24" fill="#FBE6EF" stroke="#E7AFC7" stroke-width="3"/><circle cx="32" cy="34" r="16" fill="${col}"/><ellipse cx="26" cy="28" rx="6" ry="3.5" fill="#fff" opacity=".55"/><path d="M44,8 L56,20" stroke="#B98A6A" stroke-width="5" stroke-linecap="round"/><ellipse cx="41" cy="23" rx="8" ry="6" fill="#F6D9B8" transform="rotate(45 41 23)"/>`);
    case 'lips': return w(`<rect x="21" y="36" width="22" height="24" rx="4" fill="url(#g-gold)" stroke="#E7A92A" stroke-width="2.5"/><rect x="24" y="28" width="16" height="10" rx="2" fill="#F5E1A0" stroke="#E7A92A" stroke-width="2"/><path d="M26,29 L26,14 Q26,6 38,4 L38,29 Z" fill="${col}"/><path d="M29,26 L29,15" stroke="#fff" stroke-width="2.5" opacity=".5" stroke-linecap="round"/>`);
    case 'eyes': return w(`<path d="M8,38 Q32,4 56,38 Z" fill="${col}" opacity=".9"/><path d="M10,40 Q32,20 54,40 Q32,58 10,40 Z" fill="#fff" stroke="#4A2A55" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="40" r="10" fill="url(#g-eye)"/><circle cx="35" cy="36" r="3.2" fill="#fff"/>`);
    case 'lashes': return w(`<path d="M10,40 Q32,20 54,40 Q32,58 10,40 Z" fill="#fff" stroke="#4A2A55" stroke-width="3" stroke-linejoin="round"/><circle cx="32" cy="40" r="10" fill="url(#g-eye)"/><circle cx="35" cy="36" r="3.2" fill="#fff"/><path d="M12,36 L5,27 M20,30 L15,18 M32,28 L32,14 M44,30 L49,18 M52,36 L59,27" stroke="${col}" stroke-width="4.5" stroke-linecap="round"/>`);
    case 'hair': return w(`<path d="M14,8 Q44,4 50,30 Q54,50 42,60 Q46,40 34,30 Q22,22 14,8 Z" fill="${col}" stroke="rgba(0,0,0,.18)" stroke-width="2"/><rect x="6" y="42" width="34" height="9" rx="4" fill="#8FB8FF"/><path d="M10,51 L10,59 M16,51 L16,59 M22,51 L22,59 M28,51 L28,59 M34,51 L34,59" stroke="#8FB8FF" stroke-width="3.5" stroke-linecap="round"/>`);
    case 'sticker': return w(`<use href="#stk-${c || 'star'}" x="4" y="4" width="56" height="56"/>`);
    case 'acc': return w(`<g transform="translate(32 36) scale(.52)"><path d="M-46,22 L-52,-22 L-25,2 L0,-36 L25,2 L52,-22 L46,22 Z" fill="url(#g-gold)" stroke="#E7A92A" stroke-width="5" stroke-linejoin="round"/><circle cx="0" cy="-2" r="9" fill="#FF5C9A"/><circle cx="-52" cy="-22" r="7" fill="#FFF3B0"/><circle cx="0" cy="-36" r="7" fill="#FFF3B0"/><circle cx="52" cy="-22" r="7" fill="#FFF3B0"/></g>`);
    case 'wash': return w(`<rect x="10" y="26" width="40" height="28" rx="10" fill="#FFE27A" stroke="#F2B92E" stroke-width="3"/><circle cx="22" cy="36" r="3" fill="#F2B92E"/><circle cx="36" cy="44" r="3.5" fill="#F2B92E"/><circle cx="41" cy="33" r="2.5" fill="#F2B92E"/><circle cx="46" cy="16" r="8" fill="#DFF3FF" stroke="#8FC8F0" stroke-width="2.5"/><circle cx="30" cy="12" r="5" fill="#DFF3FF" stroke="#8FC8F0" stroke-width="2.5"/><circle cx="56" cy="30" r="4" fill="#DFF3FF" stroke="#8FC8F0" stroke-width="2"/>`);
  }
  return '';
}

// Biểu tượng phụ kiện riêng lẻ (dùng trên bảng chọn)
function accIcon(item) {
  const look = { acc: { [item]: true } };
  const vb = { crown: '140 64 120 80', bow: '238 104 112 100', flowers: '76 100 248 124', glasses: '70 244 260 90', necklace: '144 400 112 76' }[item];
  return `<svg viewBox="${vb}" aria-hidden="true">${accSvg(look.acc)}</svg>`;
}

const ICONS = {
  home: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8,24 L24,9 L40,24" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13,21 L13,39 L35,39 L35,21" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/><rect x="20" y="28" width="8" height="11" rx="2" fill="currentColor"/></svg>',
  back: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M29,10 L15,24 L29,38" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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
  trophy: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18,8 L46,8 L46,26 Q46,40 32,42 Q18,40 18,26 Z" fill="url(#g-gold)" stroke="#E7A92A" stroke-width="3"/><path d="M18,14 L8,14 Q8,28 20,30 M46,14 L56,14 Q56,28 44,30" fill="none" stroke="#E7A92A" stroke-width="3.5"/><rect x="28" y="42" width="8" height="8" fill="#FFC53D"/><rect x="18" y="50" width="28" height="8" rx="3" fill="#FF5C9A"/><path d="M32,16 L35,23 L42,23 L36,27 L38,34 L32,30 L26,34 L28,27 L22,23 L29,23 Z" fill="#fff"/></svg>',
  rainbow: '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke-width="6" stroke-linecap="round"><path d="M6,48 A26,26 0 0 1 58,48" stroke="#FF8FB8"/><path d="M13,48 A19,19 0 0 1 51,48" stroke="#FFE17A"/><path d="M20,48 A12,12 0 0 1 44,48" stroke="#7FC4FF"/></g></svg>',
};

export { EYES, shade, hairFill, installSprite, newLook, renderCharacter, applyLook, applyAcc, applyStickers, accSvg, stickersSvg, toolIcon, accIcon, ICONS };
