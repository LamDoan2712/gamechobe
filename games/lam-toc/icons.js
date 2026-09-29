// icons.js — biểu tượng SVG của Tiệm Làm Tóc: dụng cụ, phụ kiện, bước yêu cầu, ảnh đại diện khách, nút xoay

import { COLORS, RAINBOW } from './data.js';

const w = b => `<svg viewBox="0 0 64 64" aria-hidden="true">${b}</svg>`;
const RB_DEF = `<defs><linearGradient id="lt-rb" x1="0" y1="0" x2="1" y2="0">${RAINBOW.map((c, i) => `<stop offset="${i / (RAINBOW.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient></defs>`;
export const colorFill = key => (key === 'cauvong' ? 'url(#lt-rb)' : (COLORS[key] ? COLORS[key].hex : key || '#FF8FB8'));
export const swatchBg = key => (key === 'cauvong' ? `linear-gradient(135deg, ${RAINBOW.join(', ')})` : COLORS[key].hex);
const spark = (x, y, s, c = '#FFD34D') => `<path d="M${x},${y - s} Q${x + s * 0.18},${y - s * 0.18} ${x + s},${y} Q${x + s * 0.18},${y + s * 0.18} ${x},${y + s} Q${x - s * 0.18},${y + s * 0.18} ${x - s},${y} Q${x - s * 0.18},${y - s * 0.18} ${x},${y - s} Z" fill="${c}"/>`;

export function toolIcon(tool, color) {
  switch (tool) {
    case 'shampoo': return w(`<rect x="14" y="24" width="32" height="34" rx="11" fill="#FF9EC4" stroke="#E0689A" stroke-width="3"/>
      <rect x="23" y="14" width="14" height="11" rx="3" fill="#FFE17A" stroke="#E7B23A" stroke-width="2.5"/>
      <path d="M30,14 L30,8 L42,8" fill="none" stroke="#E7B23A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="20" y="34" width="20" height="13" rx="5" fill="#fff" opacity=".85"/>
      <path d="M30,44 C24,39 26,35 30,38 C34,35 36,39 30,44 Z" fill="#FF7FAA"/>
      <path d="M19,30 L19,50" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>
      <circle cx="51" cy="17" r="7" fill="#EAF7FF" stroke="#8FC8F0" stroke-width="2.5"/><circle cx="49" cy="15" r="2" fill="#fff"/>
      <circle cx="55" cy="32" r="4.5" fill="#EAF7FF" stroke="#8FC8F0" stroke-width="2"/>`);
    case 'rinse': return w(`<path d="M8,30 L8,14 Q8,6 16,6 L28,6" fill="none" stroke="#A9B6D6" stroke-width="5" stroke-linecap="round"/>
      <path d="M20,10 L42,10 Q52,10 52,20 L52,22 L12,22 L12,20 Q12,10 20,10 Z" fill="#8FC8F0" stroke="#4E9BE0" stroke-width="3" stroke-linejoin="round"/>
      <path d="M18,15 L34,15" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round"/>
      ${[[18, 32], [30, 30], [42, 32], [24, 46], [36, 46], [48, 44], [14, 50]].map(([x, y]) => `<path d="M${x},${y - 6} Q${x + 4},${y} ${x},${y + 3} Q${x - 4},${y} ${x},${y - 6} Z" fill="#7FC4FF"/>`).join('')}`);
    case 'dryer': return w(`<rect x="19" y="30" width="13" height="27" rx="6" fill="#C9A7F5" stroke="#9C73D6" stroke-width="3"/>
      <path d="M6,21 Q6,9 20,9 L38,9 Q46,9 46,21 Q46,33 38,33 L20,33 Q6,33 6,21 Z" fill="#C9A7F5" stroke="#9C73D6" stroke-width="3"/>
      <rect x="44" y="12" width="9" height="18" rx="4" fill="#E9DCFF" stroke="#9C73D6" stroke-width="3"/>
      <circle cx="20" cy="21" r="6.5" fill="#fff" opacity=".75"/><circle cx="20" cy="21" r="2.5" fill="#9C73D6"/>
      <path d="M57,14 L62,12 M58,21 L63,21 M57,28 L62,30" stroke="#8FC8F0" stroke-width="3" stroke-linecap="round"/>`);
    case 'comb': return w(`<path d="M13,32 L13,50 M19,32 L19,52 M25,32 L25,52 M31,32 L31,52 M37,32 L37,52 M43,32 L43,52 M49,32 L49,50" stroke="#4E9BE0" stroke-width="5" stroke-linecap="round"/>
      <path d="M13,32 L13,50 M19,32 L19,52 M25,32 L25,52 M31,32 L31,52 M37,32 L37,52 M43,32 L43,52 M49,32 L49,50" stroke="#7FC4FF" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="7" y="16" width="50" height="17" rx="8" fill="#7FC4FF" stroke="#4E9BE0" stroke-width="3"/>
      <path d="M14,22 L40,22" stroke="#fff" stroke-width="3" opacity=".65" stroke-linecap="round"/>
      ${spark(52, 9, 6)}`);
    case 'scissors': return w(`<path d="M15,44 L36,32" stroke="#E0689A" stroke-width="7" stroke-linecap="round"/><path d="M15,20 L36,32" stroke="#E0689A" stroke-width="7" stroke-linecap="round"/>
      <path d="M36,32 L58,20" stroke="#8FA3BF" stroke-width="8" stroke-linecap="round"/><path d="M36,32 L58,20" stroke="#EEF3FA" stroke-width="4" stroke-linecap="round"/>
      <path d="M36,32 L58,44" stroke="#8FA3BF" stroke-width="8" stroke-linecap="round"/><path d="M36,32 L58,44" stroke="#EEF3FA" stroke-width="4" stroke-linecap="round"/>
      <circle cx="12" cy="46" r="7.5" fill="none" stroke="#FF7FAA" stroke-width="5.5"/><circle cx="12" cy="18" r="7.5" fill="none" stroke="#FF7FAA" stroke-width="5.5"/>
      <circle cx="36" cy="32" r="4" fill="#FFD34D" stroke="#E7A21E" stroke-width="2"/>`);
    case 'grow': return w(`<path d="M25,10 L39,10 L39,23 Q53,29 53,42 Q53,59 32,59 Q11,59 11,42 Q11,29 25,23 Z" fill="#E8FFF6" stroke="#3AAA93" stroke-width="3" stroke-linejoin="round"/>
      <path d="M13.5,40 Q32,33 50.5,40 Q51,56 32,56 Q13,56 13.5,40 Z" fill="#5FD0B8"/>
      <rect x="22" y="4" width="20" height="8" rx="3.5" fill="#C98A5E" stroke="#9E6440" stroke-width="2"/>
      <path d="M18,30 Q16,36 17,42" stroke="#fff" stroke-width="3" opacity=".7" stroke-linecap="round" fill="none"/>
      <circle cx="26" cy="47" r="3" fill="#fff" opacity=".7"/><circle cx="37" cy="44" r="2" fill="#fff" opacity=".7"/>
      ${spark(49, 20, 6.5)}${spark(56, 32, 4, '#FF9EC4')}`);
    case 'curler': return w(`<rect x="8" y="22" width="48" height="22" rx="11" fill="#FFB3CF" stroke="#E0689A" stroke-width="3"/>
      <path d="M17,22 L17,44 M26,22 L26,44 M35,22 L35,44 M44,22 L44,44" stroke="#FF8FB8" stroke-width="2.5"/>
      <path d="M8,14 C16,56 20,4 28,50 C34,6 40,56 46,10 C50,40 56,34 58,26" fill="none" stroke="#A8693F" stroke-width="5" stroke-linecap="round"/>
      <path d="M8,14 C16,56 20,4 28,50 C34,6 40,56 46,10 C50,40 56,34 58,26" fill="none" stroke="#D69A68" stroke-width="2" stroke-linecap="round"/>`);
    case 'dye': {
      const c = colorFill(color);
      return w(`${color === 'cauvong' ? RB_DEF : ''}<path d="M6,32 L58,32 Q56,57 32,57 Q8,57 6,32 Z" fill="#fff" stroke="#D9B8CF" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="32" cy="32" rx="26" ry="6.5" fill="${c}" stroke="#D9B8CF" stroke-width="2"/>
      <path d="M14,40 Q16,50 26,53" fill="none" stroke="#F3E3EC" stroke-width="3" stroke-linecap="round"/>
      <path d="M50,4 L38,24" stroke="#C98A5E" stroke-width="6" stroke-linecap="round"/>
      <path d="M34,20 L42,25 L37,35 Q31,34 32,26 Z" fill="${c}" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>`);
    }
    case 'acc': return accIcon('bow');
  }
  return '';
}

export function accIcon(a) {
  switch (a) {
    case 'bow': return w(`<path d="M32,32 C20,14 4,16 6,30 C8,44 22,44 32,32 Z" fill="#FF7FAA" stroke="#D93F7C" stroke-width="3" stroke-linejoin="round"/>
      <path d="M32,32 C44,14 60,16 58,30 C56,44 42,44 32,32 Z" fill="#FF7FAA" stroke="#D93F7C" stroke-width="3" stroke-linejoin="round"/>
      <path d="M28,36 L20,56 L27,52 L30,58 L32,38 Z M36,36 L44,56 L37,52 L34,58 L32,38 Z" fill="#FF9EC4" stroke="#D93F7C" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="25" y="25" width="14" height="14" rx="6" fill="#FF5C9A" stroke="#D93F7C" stroke-width="2.5"/>
      <path d="M13,25 Q16,21 21,23" stroke="#fff" stroke-width="3" opacity=".6" stroke-linecap="round" fill="none"/>`);
    case 'star': return w(`<rect x="10" y="44" width="44" height="8" rx="4" fill="#B7C4D8" stroke="#8FA3BF" stroke-width="2.5"/>
      <path d="M32,4 L39,19 L56,21 L43,32 L47,49 L32,40 L17,49 L21,32 L8,21 L25,19 Z" fill="#FFD34D" stroke="#E7A21E" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M26,22 L30,15" stroke="#fff" stroke-width="3" opacity=".75" stroke-linecap="round"/>
      <circle cx="26" cy="31" r="2.5" fill="#8A4B6E"/><circle cx="38" cy="31" r="2.5" fill="#8A4B6E"/><path d="M28,36 Q32,39 36,36" stroke="#8A4B6E" stroke-width="2" fill="none" stroke-linecap="round"/>`);
    case 'flower': return w(`${[0, 72, 144, 216, 288].map(r => `<ellipse cx="32" cy="17" rx="10" ry="13" fill="#FFB3CF" stroke="#E0689A" stroke-width="2.5" transform="rotate(${r} 32 32)"/>`).join('')}
      <circle cx="32" cy="32" r="9" fill="#FFD34D" stroke="#E7A21E" stroke-width="2.5"/><circle cx="29" cy="29" r="2.5" fill="#fff" opacity=".8"/>
      <path d="M46,50 Q54,48 58,56 Q50,58 46,50 Z" fill="#7FD8A0" stroke="#4FB27A" stroke-width="2"/>`);
    case 'catband': return w(`<path d="M8,50 Q8,16 32,16 Q56,16 56,50" fill="none" stroke="#B48BF0" stroke-width="7" stroke-linecap="round"/>
      <path d="M12,32 L10,8 L28,20 Z" fill="#B48BF0" stroke="#8E62D6" stroke-width="3" stroke-linejoin="round"/><path d="M14,26 L13,14 L23,21 Z" fill="#FFB3CF"/>
      <path d="M52,32 L54,8 L36,20 Z" fill="#B48BF0" stroke="#8E62D6" stroke-width="3" stroke-linejoin="round"/><path d="M50,26 L51,14 L41,21 Z" fill="#FFB3CF"/>
      <path d="M18,22 Q24,18 30,18" stroke="#fff" stroke-width="2.5" opacity=".55" fill="none" stroke-linecap="round"/>`);
    case 'crown': return w(`<defs><linearGradient id="lt-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset="1" stop-color="#FFBE2E"/></linearGradient></defs>
      <path d="M8,48 L6,18 L20,32 L32,10 L44,32 L58,18 L56,48 Z" fill="url(#lt-gold)" stroke="#E7A92A" stroke-width="3.5" stroke-linejoin="round"/>
      <rect x="8" y="46" width="48" height="9" rx="4" fill="#FFC53D" stroke="#E7A92A" stroke-width="3"/>
      <circle cx="32" cy="36" r="5" fill="#FF5C9A"/><circle cx="18" cy="40" r="3.5" fill="#7FC4FF"/><circle cx="46" cy="40" r="3.5" fill="#7FC4FF"/>
      <circle cx="6" cy="17" r="4" fill="#FFF3B0" stroke="#E7A92A" stroke-width="2"/><circle cx="32" cy="9" r="4" fill="#FFF3B0" stroke="#E7A92A" stroke-width="2"/><circle cx="58" cy="17" r="4" fill="#FFF3B0" stroke="#E7A92A" stroke-width="2"/>`);
  }
  return '';
}

// Biểu tượng cho từng bước yêu cầu của khách
export function stepIcon(st) {
  switch (st.type) {
    case 'wash': return toolIcon('shampoo');
    case 'dry': return toolIcon('dryer');
    case 'cut': return w(`<path d="M10,8 Q32,2 54,8 Q60,24 52,36 L12,36 Q4,24 10,8 Z" fill="#A8693F" stroke="#7E4A2A" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14,34 L14,40 M22,35 L22,41 M30,35 L30,41 M38,35 L38,41 M46,34 L46,40" stroke="#A8693F" stroke-width="4" stroke-linecap="round"/>
      <path d="M20,12 Q30,9 38,11" stroke="#fff" stroke-width="3" opacity=".5" fill="none" stroke-linecap="round"/>
      <g transform="translate(20 38) scale(.62)"><path d="M15,44 L36,32 M15,20 L36,32" stroke="#E0689A" stroke-width="7" stroke-linecap="round"/><path d="M36,32 L58,20 M36,32 L58,44" stroke="#8FA3BF" stroke-width="8" stroke-linecap="round"/><path d="M36,32 L58,20 M36,32 L58,44" stroke="#EEF3FA" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="46" r="7.5" fill="none" stroke="#FF7FAA" stroke-width="5.5"/><circle cx="12" cy="18" r="7.5" fill="none" stroke="#FF7FAA" stroke-width="5.5"/></g>`);
    case 'grow': return w(`<path d="M14,6 Q32,0 50,6 Q56,20 54,40 L54,60 L44,60 L44,26 L20,26 L20,60 L10,60 L10,40 Q8,20 14,6 Z" fill="#A8693F" stroke="#7E4A2A" stroke-width="3" stroke-linejoin="round"/>
      <path d="M32,32 L32,56 M24,48 L32,58 L40,48" fill="none" stroke="#3AAA93" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      ${spark(32, 20, 6)}`);
    case 'curl': return w(`<path d="M20,6 Q32,2 44,6" stroke="#A8693F" stroke-width="6" stroke-linecap="round" fill="none"/>
      <path d="M22,8 C8,14 8,24 20,24 C32,24 30,36 18,36 C6,36 8,48 20,48 C30,48 30,58 22,60" fill="none" stroke="#A8693F" stroke-width="7" stroke-linecap="round"/>
      <path d="M42,8 C56,14 56,24 44,24 C32,24 34,36 46,36 C58,36 56,48 44,48 C34,48 34,58 42,60" fill="none" stroke="#A8693F" stroke-width="7" stroke-linecap="round"/>
      <path d="M22,8 C8,14 8,24 20,24 C32,24 30,36 18,36" fill="none" stroke="#D69A68" stroke-width="2.5" stroke-linecap="round"/>`);
    case 'dye': return toolIcon('dye', st.v);
    case 'acc': return accIcon(st.v);
  }
  return '';
}

export const ROT_LEFT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M36,33 A14,14 0 1 0 13,20" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/><path d="M5,14 L13,22 L21,14" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const ROT_RIGHT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12,33 A14,14 0 1 1 35,20" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round"/><path d="M43,14 L35,22 L27,14" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
export const SCISSOR_ICON = toolIcon('scissors');

// Ảnh đại diện nhỏ của khách (dùng ở nút chọn khách và hộp quà)
export function avatar(c) {
  const h = c.hair, s = c.skin, ec = c.earColor || h;
  let ears = '';
  if (c.ears === 'cat') ears = `<path d="M11,28 L10,4 L28,16 Z" fill="${ec}" stroke="rgba(0,0,0,.15)" stroke-width="2" stroke-linejoin="round"/><path d="M13,22 L13,11 L22,17 Z" fill="#FFB3CF"/>
    <path d="M53,28 L54,4 L36,16 Z" fill="${ec}" stroke="rgba(0,0,0,.15)" stroke-width="2" stroke-linejoin="round"/><path d="M51,22 L51,11 L42,17 Z" fill="#FFB3CF"/>`;
  if (c.ears === 'bunny') ears = `<ellipse cx="22" cy="10" rx="6" ry="15" fill="${ec}" stroke="rgba(0,0,0,.12)" stroke-width="2" transform="rotate(-14 22 18)"/><ellipse cx="22" cy="11" rx="3" ry="10" fill="#FFB3CF" transform="rotate(-14 22 18)"/>
    <ellipse cx="42" cy="10" rx="6" ry="15" fill="${ec}" stroke="rgba(0,0,0,.12)" stroke-width="2" transform="rotate(14 42 18)"/><ellipse cx="42" cy="11" rx="3" ry="10" fill="#FFB3CF" transform="rotate(14 42 18)"/>`;
  const long = c.len > 1.2;
  const back = long ? `<path d="M9,34 Q8,14 32,14 Q56,14 55,34 L57,58 Q50,62 45,56 L45,36 L19,36 L19,56 Q14,62 7,58 Z" fill="${h}"/>`
    : `<path d="M10,38 Q8,14 32,14 Q56,14 54,38 Q52,46 47,44 L17,44 Q12,46 10,38 Z" fill="${h}"/>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${ears}${back}
    <circle cx="32" cy="38" r="17" fill="${s}"/>
    <path d="M13,34 Q14,15 32,15 Q50,15 51,34 Q46,25 40,27 Q36,22 32,26 Q27,22 22,27 Q17,25 13,34 Z" fill="${h}"/>
    <ellipse cx="25" cy="39" rx="2.8" ry="3.5" fill="#3B2340"/><ellipse cx="39" cy="39" rx="2.8" ry="3.5" fill="#3B2340"/>
    <circle cx="26" cy="37.8" r="1" fill="#fff"/><circle cx="40" cy="37.8" r="1" fill="#fff"/>
    <ellipse cx="20" cy="45" rx="4" ry="2.5" fill="#FF8FB1" opacity=".5"/><ellipse cx="44" cy="45" rx="4" ry="2.5" fill="#FF8FB1" opacity=".5"/>
    <path d="M28,46 Q32,49 36,46" stroke="#B24A6A" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
}

export const TIP_HAND = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24,58 C16,50 10,42 12,36 C14,32 18,33 22,38 L22,12 C22,7 29,7 29,12 L29,28 L29,24 C29,20 36,20 36,24 L36,29 C36,25 43,25 43,29 L43,33 C43,29 50,29 50,33 L50,44 C50,52 46,58 40,58 Z" fill="#FFE2CF" stroke="#8A4B6E" stroke-width="3" stroke-linejoin="round"/></svg>';
