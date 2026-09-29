// icons.js — biểu tượng SVG của Bé Nấu Ăn: ba mẹ, dao/lửa (an toàn), bé làm, hình món ăn cho câu đố, đồ trang trí, quà.

const S = (b, vb = '0 0 64 64') => `<svg viewBox="${vb}" aria-hidden="true">${b}</svg>`;

export const AVATAR = {
  me: S(`<circle cx="32" cy="34" r="22" fill="#FFE0CC"/><path d="M10,34 C8,12 56,12 54,34 C54,26 46,18 32,18 C18,18 10,26 10,34 Z" fill="#3B2A2A"/><circle cx="32" cy="12" r="8" fill="#3B2A2A"/>
    <path d="M10,34 C8,46 12,54 16,56 L16,36 Z M54,34 C56,46 52,54 48,56 L48,36 Z" fill="#3B2A2A"/><circle cx="24" cy="36" r="3" fill="#3B2340"/><circle cx="40" cy="36" r="3" fill="#3B2340"/>
    <circle cx="20" cy="42" r="3.5" fill="#FF9EB5" opacity=".7"/><circle cx="44" cy="42" r="3.5" fill="#FF9EB5" opacity=".7"/><path d="M26,45 Q32,50 38,45" stroke="#C4486A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
  ba: S(`<circle cx="32" cy="34" r="22" fill="#F5D2B8"/><path d="M10,32 C10,12 54,12 54,32 C50,22 42,20 32,20 C22,20 14,22 10,32 Z" fill="#2B2220"/>
    <circle cx="24" cy="36" r="6" fill="none" stroke="#3B2340" stroke-width="2"/><circle cx="40" cy="36" r="6" fill="none" stroke="#3B2340" stroke-width="2"/><path d="M30,36 L34,36" stroke="#3B2340" stroke-width="2"/>
    <circle cx="24" cy="36" r="2.4" fill="#3B2340"/><circle cx="40" cy="36" r="2.4" fill="#3B2340"/><path d="M25,46 Q32,51 39,46" stroke="#8A4B3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
  be: S(`<circle cx="32" cy="36" r="20" fill="#FFE2CF"/><path d="M13,34 C12,16 52,16 51,34 C47,26 40,24 32,24 C24,24 17,26 13,34 Z" fill="#5A3A26"/>
    <rect x="16" y="6" width="32" height="14" rx="7" fill="#FFFFFF" stroke="#E7D9E4" stroke-width="2"/><circle cx="22" cy="8" r="7" fill="#FFFFFF"/><circle cx="32" cy="5" r="8" fill="#FFFFFF"/><circle cx="42" cy="8" r="7" fill="#FFFFFF"/>
    <circle cx="25" cy="38" r="3" fill="#3B2340"/><circle cx="39" cy="38" r="3" fill="#3B2340"/><circle cx="21" cy="44" r="3.5" fill="#FF9EB5" opacity=".7"/><circle cx="43" cy="44" r="3.5" fill="#FF9EB5" opacity=".7"/>
    <path d="M27,46 Q32,51 37,46" stroke="#C4486A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`),
};
export const ACTION = {
  cut: S(`<path d="M10,40 L44,12 Q52,10 50,18 L22,48 Z" fill="#DDE5EE" stroke="#8E9BAA" stroke-width="2.5" stroke-linejoin="round"/><path d="M22,48 L14,56 Q10,58 8,54 L16,44 Z" fill="#8A5A36"/>`),
  stove: S(`<path d="M32,6 C40,18 48,22 46,36 C44,48 38,54 32,54 C22,54 16,46 18,36 C19,30 23,28 24,22 C28,26 28,30 30,32 C32,24 30,14 32,6 Z" fill="#FF7A1A"/><path d="M32,28 C36,34 40,38 38,44 C37,50 34,52 32,52 C28,52 25,48 26,44 C27,40 30,38 32,28 Z" fill="#FFD34D"/>`),
  hot: S(`<path d="M16,40 L48,40 Q48,54 32,54 Q16,54 16,40 Z" fill="#FF9EC4"/><rect x="12" y="36" width="40" height="6" rx="3" fill="#FF7FAA"/><path d="M22,30 C18,24 26,20 22,12 M32,30 C28,24 36,20 32,12 M42,30 C38,24 46,20 42,12" stroke="#BFD3E6" stroke-width="3.5" fill="none" stroke-linecap="round"/>`),
  kid: S(`<path d="M20,56 C14,50 10,44 12,38 C14,34 18,35 21,39 L21,16 C21,11 28,11 28,16 L28,30 L28,26 C28,22 35,22 35,26 L35,31 C35,27 42,27 42,31 L42,35 C42,31 49,31 49,35 L49,46 C49,53 45,58 39,58 Z" fill="#FFE2CF" stroke="#8A4B6E" stroke-width="3" stroke-linejoin="round"/>`),
  heart: S(`<path d="M32,54 C8,38 10,16 24,14 C29,13 32,18 32,20 C32,18 35,13 40,14 C54,16 56,38 32,54 Z" fill="#FF5C9A"/><ellipse cx="22" cy="24" rx="5" ry="3" fill="#fff" opacity=".6" transform="rotate(-30 22 24)"/>`),
  book: S(`<path d="M8,14 Q20,10 32,16 L32,54 Q20,48 8,52 Z" fill="#FFB347"/><path d="M56,14 Q44,10 32,16 L32,54 Q44,48 56,52 Z" fill="#FF7FAA"/><path d="M14,22 Q20,20 26,23 M14,30 Q20,28 26,31 M38,23 Q44,20 50,22 M38,31 Q44,28 50,30" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/>`),
  pot: S(`<path d="M10,26 L54,26 L50,50 Q48,56 42,56 L22,56 Q16,56 14,50 Z" fill="#FF7FAA"/><rect x="6" y="22" width="52" height="7" rx="3.5" fill="#E25B8E"/><rect x="26" y="15" width="12" height="7" rx="3" fill="#E25B8E"/>
    <path d="M22,14 C18,9 24,6 21,1 M32,12 C28,7 34,4 31,-1 M42,14 C38,9 44,6 41,1" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>`, '0 -4 64 68'),
};

// Hình món/nguyên liệu cho câu đố
export const FOOD = {
  gao: S(`<path d="M8,30 L56,30 Q56,54 32,54 Q8,54 8,30 Z" fill="#FBFAF6" stroke="#2F5FAE" stroke-width="3"/><path d="M14,30 Q32,6 50,30 Z" fill="#FFFFFF" stroke="#E6E1D6" stroke-width="2"/>
    <g fill="#E9E4D8">${[[22, 24], [28, 20], [34, 19], [40, 23], [30, 26], [37, 27], [25, 28]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.2" ry="1.2"/>`).join('')}</g>`),
  cam: S(`<circle cx="32" cy="36" r="20" fill="#FF9A1F"/><circle cx="26" cy="30" r="5" fill="#FFC06A" opacity=".7"/><rect x="30" y="12" width="4" height="8" rx="2" fill="#6B8E23"/><ellipse cx="40" cy="14" rx="8" ry="4" fill="#4CAF50" transform="rotate(-20 40 14)"/>`),
  trung: S(`<ellipse cx="32" cy="34" rx="16" ry="21" fill="#F6E3C8" stroke="#E0C9A8" stroke-width="2"/><ellipse cx="26" cy="26" rx="4" ry="6" fill="#fff" opacity=".6"/>`),
  chuoi: S(`<path d="M12,20 C14,44 36,56 54,44 C56,42 54,40 52,41 C36,48 22,38 18,20 Z" fill="#FFD34D" stroke="#E0A800" stroke-width="2"/><path d="M12,20 L16,14 L19,20 Z" fill="#6B5A2A"/>`),
  bi: S(`<ellipse cx="32" cy="38" rx="22" ry="17" fill="#FF8A1F"/><path d="M22,22 Q18,38 22,54 M32,21 L32,55 M42,22 Q46,38 42,54" stroke="#E06A0A" stroke-width="2.5" fill="none"/><path d="M32,21 C30,14 34,10 38,10" stroke="#4E8A2A" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  tom: S(`<path d="M50,20 C58,34 48,52 30,52 C18,52 10,44 12,36 C20,42 30,42 36,36 C40,32 40,26 38,20 Z" fill="#FF8A7A"/><path d="M22,40 L20,48 M28,42 L28,50 M34,40 L36,48" stroke="#E86A5A" stroke-width="2"/><path d="M40,20 Q50,6 60,12 M38,20 Q42,4 54,4" stroke="#E86A5A" stroke-width="2" fill="none"/><circle cx="46" cy="24" r="2" fill="#3B2340"/>`),
  rau: S(`<path d="M32,56 L32,20" stroke="#4E8A2A" stroke-width="4" stroke-linecap="round"/><path d="M32,24 L16,12 L20,28 Z M32,24 L48,12 L44,28 Z M32,36 L14,28 L20,42 Z M32,36 L50,28 L44,42 Z" fill="#5DBB46"/><path d="M26,56 L26,34 M38,56 L38,34" stroke="#6BBF59" stroke-width="3" stroke-linecap="round"/>`),
  pho: S(`<path d="M8,30 L56,30 Q56,54 32,54 Q8,54 8,30 Z" fill="#FBFAF6" stroke="#2F5FAE" stroke-width="3"/><ellipse cx="32" cy="30" rx="24" ry="5" fill="#F2D9A0"/>
    <path d="M14,30 Q20,24 26,30 Q32,24 38,30 Q44,24 50,30" stroke="#FFFFFF" stroke-width="3" fill="none"/><path d="M40,6 L44,30 M46,6 L48,30" stroke="#D9B27A" stroke-width="3" stroke-linecap="round"/>`),
};

export const GARNISH_ICON = {
  cachua: S(`<circle cx="32" cy="32" r="22" fill="#E8392B"/><circle cx="32" cy="32" r="16" fill="#FF6F5E"/>${[0, 1, 2, 3].map(i => `<ellipse cx="${32 + Math.cos(i * 1.57 + 0.4) * 8}" cy="${32 + Math.sin(i * 1.57 + 0.4) * 8}" rx="3" ry="2" fill="#FFE9A0"/>`).join('')}`),
  dualeo: S(`<circle cx="32" cy="32" r="22" fill="#3E8E3A"/><circle cx="32" cy="32" r="18" fill="#DFF5C8"/>${[0, 1, 2].map(i => `<ellipse cx="${32 + Math.cos(i * 2.1) * 6}" cy="${32 + Math.sin(i * 2.1) * 6}" rx="2.5" ry="1.8" fill="#F8FBE8"/>`).join('')}`),
  ngo: S(`<path d="M32,56 L32,30" stroke="#6BBF59" stroke-width="3"/>${[[20, 22], [32, 14], [44, 22], [24, 34], [40, 34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#3FA34D"/>`).join('')}`),
  ot: S(`<circle cx="32" cy="32" r="18" fill="none" stroke="#E0201A" stroke-width="9"/><circle cx="32" cy="32" r="6" fill="#FFE9A0"/>`),
  tieu: S(`${[[20, 22], [34, 18], [44, 30], [26, 36], [38, 42], [22, 48], [46, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#2B2420"/>`).join('')}`),
  dauphong: S(`${[[22, 24], [38, 20], [30, 36], [44, 38], [20, 44]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#D9A45B"/>`).join('')}`),
  me: S(`${[[18, 20], [30, 16], [42, 22], [24, 32], [38, 34], [28, 46], [44, 44], [16, 42]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#FFF3D6" stroke="#D9C39A"/>`).join('')}`),
  hanh: S(`${[[20, 22], [34, 18], [44, 30], [26, 36], [38, 44], [20, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="none" stroke="#4CAF3F" stroke-width="3"/>`).join('')}`),
  chanh: S(`<circle cx="32" cy="32" r="20" fill="#9ACD32"/><circle cx="32" cy="32" r="15" fill="#E6F5B0"/><path d="M32,17 L32,47 M17,32 L47,32 M21,21 L43,43 M43,21 L21,43" stroke="#C8E27A" stroke-width="2"/>`),
  rauthom: S(`<path d="M32,56 L32,26" stroke="#4E8A2A" stroke-width="3"/><ellipse cx="22" cy="24" rx="9" ry="5" fill="#2E9E4F" transform="rotate(-30 22 24)"/><ellipse cx="42" cy="24" rx="9" ry="5" fill="#2E9E4F" transform="rotate(30 42 24)"/><ellipse cx="32" cy="14" rx="5" ry="9" fill="#3FB35E"/>`),
};

export const GIFT = {
  apron: S(`<path d="M20,8 L44,8 L44,20 L52,24 L50,56 L14,56 L12,24 L20,20 Z" fill="#FF7FAA"/><rect x="24" y="34" width="16" height="10" rx="3" fill="#fff"/><path d="M20,8 Q32,0 44,8" stroke="#E25B8E" stroke-width="3" fill="none"/>`),
  hat: S(`<rect x="18" y="34" width="28" height="16" rx="3" fill="#FFFFFF" stroke="#E0D6E0" stroke-width="2"/><circle cx="22" cy="28" r="10" fill="#fff" stroke="#E0D6E0" stroke-width="2"/><circle cx="32" cy="22" r="12" fill="#fff" stroke="#E0D6E0" stroke-width="2"/><circle cx="42" cy="28" r="10" fill="#fff" stroke="#E0D6E0" stroke-width="2"/>`),
  ladle: S(`<path d="M44,6 L30,40" stroke="#FFC53D" stroke-width="5" stroke-linecap="round"/><path d="M14,40 Q30,34 40,42 Q38,58 24,56 Q12,54 14,40 Z" fill="#FFC53D" stroke="#E7A21E" stroke-width="2"/>`),
  badge: S(`<circle cx="32" cy="32" r="22" fill="#FFC53D" stroke="#E7A21E" stroke-width="3"/><path d="M32,16 L36,27 L48,27 L38,34 L42,46 L32,39 L22,46 L26,34 L16,27 L28,27 Z" fill="#fff"/>`),
  crown: S(`<rect x="16" y="34" width="32" height="16" rx="3" fill="#FFFFFF" stroke="#E0D6E0" stroke-width="2"/><rect x="16" y="34" width="32" height="5" fill="#FFC53D"/><circle cx="22" cy="28" r="10" fill="#fff" stroke="#E0D6E0" stroke-width="2"/><circle cx="32" cy="20" r="13" fill="#fff" stroke="#E0D6E0" stroke-width="2"/><circle cx="42" cy="28" r="10" fill="#fff" stroke="#E0D6E0" stroke-width="2"/><circle cx="32" cy="36.5" r="2.5" fill="#FF5C9A"/>`),
  trophy: S(`<path d="M18,8 L46,8 L46,26 Q46,40 32,42 Q18,40 18,26 Z" fill="#FFC53D" stroke="#E7A92A" stroke-width="3"/><path d="M18,14 L8,14 Q8,28 20,30 M46,14 L56,14 Q56,28 44,30" fill="none" stroke="#E7A92A" stroke-width="3.5"/><rect x="28" y="42" width="8" height="8" fill="#FFC53D"/><rect x="18" y="50" width="28" height="8" rx="3" fill="#FF5C9A"/>`),
};
