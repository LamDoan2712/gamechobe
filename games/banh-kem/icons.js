// icons.js — hình vẽ SVG cho giao diện: mặt hamster, bánh kem, phụ kiện, trái tim, vô cực

import { FLAVORS } from './data.js';

let uid = 0;

// Mặt hamster (dùng cho thanh tiến độ, ảnh giới thiệu màn, ô "không đội" trong tủ đồ)
export function hamsterFace(extra = '') {
  return `<svg viewBox="0 0 64 64" aria-hidden="true">
    <circle cx="15" cy="17" r="8.5" fill="#F7A64B"/><circle cx="15" cy="17" r="4.8" fill="#FFB3C7"/>
    <circle cx="49" cy="17" r="8.5" fill="#F7A64B"/><circle cx="49" cy="17" r="4.8" fill="#FFB3C7"/>
    <ellipse cx="32" cy="36" rx="26" ry="23" fill="#F7A64B"/>
    <ellipse cx="32" cy="45" rx="19" ry="13.5" fill="#FFF1DA"/>
    <ellipse cx="15" cy="44" rx="6" ry="4" fill="#FF9DB8" opacity=".75"/><ellipse cx="49" cy="44" rx="6" ry="4" fill="#FF9DB8" opacity=".75"/>
    <ellipse cx="22.5" cy="33" rx="4" ry="4.6" fill="#2A1A22"/><circle cx="24" cy="31.4" r="1.5" fill="#fff"/>
    <ellipse cx="41.5" cy="33" rx="4" ry="4.6" fill="#2A1A22"/><circle cx="43" cy="31.4" r="1.5" fill="#fff"/>
    <ellipse cx="32" cy="40" rx="3.2" ry="2.3" fill="#FF7FA3"/>
    <path d="M27.5,44 Q29.8,47 32,44 Q34.2,47 36.5,44" stroke="#7A3E36" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    ${extra}</svg>`;
}

// Bánh kem hai tầng theo vị
export function cakeSvg(flavorId = 'dau') {
  const f = FLAVORS[flavorId] || FLAVORS.dau, id = 'bkg' + (++uid);
  const body = f.rainbow ? `url(#${id})` : f.body[0];
  const defs = f.rainbow ? `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FF9EBB"/><stop offset=".2" stop-color="#FFC98A"/><stop offset=".4" stop-color="#FFEE8F"/>
      <stop offset=".6" stop-color="#A8E6A3"/><stop offset=".8" stop-color="#9ED2FF"/><stop offset="1" stop-color="#C9A8F5"/></linearGradient></defs>` : '';
  const frost = f.frost;
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${defs}
    <ellipse cx="32" cy="57" rx="27" ry="5" fill="#fff" stroke="#EBC6D8" stroke-width="2"/>
    <rect x="9" y="35" width="46" height="20" rx="6" fill="${body}"/>
    <path d="M7,37 Q7,31 13,31 L51,31 Q57,31 57,37 L57,39 Q54,44 51,39 Q48,46 44,39 Q40,44 36,39 Q32,47 28,39 Q24,44 20,39 Q16,45 13,39 Q9,43 7,39 Z" fill="${frost}" stroke="rgba(0,0,0,.06)" stroke-width="1"/>
    <rect x="17" y="16" width="30" height="18" rx="5" fill="${body}"/>
    <path d="M15,19 Q15,13 21,13 L43,13 Q49,13 49,19 L49,21 Q46,26 43,21 Q40,27 36,21 Q33,25 30,21 Q27,27 24,21 Q21,25 18,21 Q16,23 15,21 Z" fill="${frost}" stroke="rgba(0,0,0,.06)" stroke-width="1"/>
    <g stroke-width="2.4" stroke-linecap="round"><path d="M14,47 l3,-2" stroke="#FF5C9A"/><path d="M24,50 l3,1" stroke="#FFC53D"/><path d="M38,48 l2,-3" stroke="#58A8F5"/><path d="M48,50 l3,-1" stroke="#5FD0B8"/><path d="M24,29 l2,-2" stroke="#B48BF0"/><path d="M40,29 l3,1" stroke="#FF5C9A"/></g>
    <circle cx="32" cy="9" r="5.5" fill="#FF4D6D"/><circle cx="30.2" cy="7.2" r="1.6" fill="#fff" opacity=".7"/><path d="M32,4 Q34,0 38,1" stroke="#5DAF55" stroke-width="2" fill="none" stroke-linecap="round"/>
  </svg>`;
}

// Biểu tượng nhỏ trên thanh HUD
export const cakeMini = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="22" width="34" height="18" rx="5" fill="#FF9DBA"/>
  <path d="M5,24 Q5,18 11,18 L37,18 Q43,18 43,24 L43,26 Q40,31 37,26 Q34,32 30,26 Q26,31 22,26 Q18,32 14,26 Q10,30 5,26 Z" fill="#FFF0F5"/>
  <ellipse cx="24" cy="42" rx="21" ry="4" fill="#fff" stroke="#EBC6D8" stroke-width="2"/>
  <circle cx="24" cy="12" r="5" fill="#FF4D6D"/><circle cx="22.4" cy="10.4" r="1.5" fill="#fff" opacity=".7"/></svg>`;

export const heart = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24,42 C10,32 4,24 4,16 C4,9 9,5 15,5 C19,5 22,7 24,11 C26,7 29,5 33,5 C39,5 44,9 44,16 C44,24 38,32 24,42 Z" fill="currentColor"/><ellipse cx="14" cy="15" rx="4" ry="3" fill="#fff" opacity=".55" transform="rotate(-30 14 15)"/></svg>`;

export const infinity = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24,24 C20,17 16,14 11.5,14 C6,14 3,18.5 3,24 C3,29.5 6,34 11.5,34 C16,34 20,31 24,24 C28,17 32,14 36.5,14 C42,14 45,18.5 45,24 C45,29.5 42,34 36.5,34 C32,34 28,31 24,24 Z" fill="none" stroke="currentColor" stroke-width="5.5" stroke-linejoin="round"/></svg>`;

export const hanger = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M20,13 A4.5,4.5 0 1 1 26.5,17 Q24,18.5 24,21 L42,33 Q45,35 42,37 L6,37 Q3,35 6,33 L24,21" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const BOW = '<g transform="translate(46 12) rotate(20)"><path d="M0,0 L-14,-8 Q-17,0 -14,8 Z M0,0 L14,-8 Q17,0 14,8 Z" fill="#FF6FA5" stroke="#E0457F" stroke-width="1.5" stroke-linejoin="round"/><circle r="4" fill="#FF4D8F"/></g>';
const CHEF = '<g><rect x="20" y="8" width="24" height="8" rx="2" fill="#fff" stroke="#E4D6DE" stroke-width="1.5"/><circle cx="24" cy="4" r="6" fill="#fff" stroke="#E4D6DE" stroke-width="1.5"/><circle cx="40" cy="4" r="6" fill="#fff" stroke="#E4D6DE" stroke-width="1.5"/><circle cx="32" cy="1" r="7.5" fill="#fff" stroke="#E4D6DE" stroke-width="1.5"/><rect x="21" y="6" width="22" height="6" fill="#fff"/></g>';
const CROWN = '<g><path d="M18,15 L18,3 L24,9 L32,0 L40,9 L46,3 L46,15 Z" fill="#FFCF3F" stroke="#E7A21E" stroke-width="1.8" stroke-linejoin="round"/><circle cx="32" cy="10" r="2.6" fill="#FF5C9A"/><circle cx="23" cy="12" r="1.8" fill="#7FC4FF"/><circle cx="41" cy="12" r="1.8" fill="#7FC4FF"/></g>';
const GLASSES = '<g fill="rgba(255,120,170,.35)" stroke="#FF3D8B" stroke-width="2.6" stroke-linejoin="round"><path d="M22.5,39 C14,34 13,29 15,26.5 C17,24 20.5,25 22.5,28 C24.5,25 28,24 30,26.5 C32,29 31,34 22.5,39 Z"/><path d="M41.5,39 C33,34 32,29 34,26.5 C36,24 39.5,25 41.5,28 C43.5,25 47,24 49,26.5 C51,29 50,34 41.5,39 Z"/><path d="M30,29 Q32,27 34,29" fill="none"/></g>';

// Ô trong tủ đồ: mặt hamster đội phụ kiện
export const ACC_ICONS = {
  none: hamsterFace(),
  bow: hamsterFace(BOW),
  chef: hamsterFace(CHEF),
  crown: hamsterFace(CROWN),
  glasses: hamsterFace(GLASSES),
};

// Ảnh trong hộp thoại mở đầu màn: tháp bánh có hamster và số tầng cần xếp
export function introPic(target, endless) {
  const badge = endless
    ? `<g transform="translate(150 22)"><circle r="20" fill="#FFC53D" stroke="#fff" stroke-width="4"/><g transform="translate(-13 -13) scale(.55)" color="#5A2350">${infinity.replace('<svg', '<svg width="48" height="48"')}</g></g>`
    : `<g transform="translate(150 24)"><circle r="21" fill="#FF5C9A" stroke="#fff" stroke-width="4"/><text y="8.5" text-anchor="middle" font-family="Baloo 2, system-ui, sans-serif" font-weight="800" font-size="24" fill="#fff">${target}</text></g>`;
  const layer = (y, w, body, frost) => `<rect x="${100 - w / 2}" y="${y}" width="${w}" height="24" rx="7" fill="${body}"/>
    <path d="M${100 - w / 2 - 3},${y + 3} Q${100 - w / 2 - 3},${y - 4} ${100 - w / 2 + 5},${y - 4} L${100 + w / 2 - 5},${y - 4} Q${100 + w / 2 + 3},${y - 4} ${100 + w / 2 + 3},${y + 3} L${100 + w / 2 + 3},${y + 6} Q${100 + w / 4},${y + 14} ${100 + w / 8},${y + 6} Q${100},${y + 12} ${100 - w / 8},${y + 6} Q${100 - w / 4},${y + 15} ${100 - w / 2 - 3},${y + 6} Z" fill="${frost}"/>`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <ellipse cx="100" cy="182" rx="80" ry="11" fill="#fff" stroke="#EBC6D8" stroke-width="3"/>
    ${layer(152, 124, '#FFE19E', '#FFFFFF')}${layer(124, 108, '#FF9DBA', '#FFF0F5')}${layer(96, 118, '#B89CEB', '#EEE6FF')}
    <g transform="translate(62 30) scale(1.2)">${hamsterFace().replace('<svg', '<svg width="64" height="64"')}</g>
    ${badge}</svg>`;
}
