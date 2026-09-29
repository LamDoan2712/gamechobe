// data.js — nội dung Thời Trang Xinh: nhóm đồ, món đồ, màu tóc, trang điểm, màn chơi và quà mở khoá

export const CATS = [
  { id: 'hair', name: 'Tóc', say: 'Chọn kiểu tóc nào!' },
  { id: 'top', name: 'Áo', say: 'Chọn áo xinh nào!' },
  { id: 'bottom', name: 'Váy và quần', say: 'Chọn váy hay quần nhé!' },
  { id: 'dress', name: 'Đầm', say: 'Chọn đầm thật đẹp nào!' },
  { id: 'shoes', name: 'Giày', say: 'Chọn giày nào!' },
  { id: 'acc', name: 'Phụ kiện', say: 'Thêm phụ kiện nào!' },
  { id: 'beauty', name: 'Trang điểm', say: 'Trang điểm thật xinh nào!' },
];

// Biểu tượng nhóm đồ (vẽ SVG, to và rõ cho bé)
export const CAT_ICONS = {
  hair: `<svg viewBox="0 0 64 64"><path d="M10,40 C6,16 20,6 32,6 C46,6 58,16 54,40 C54,50 50,58 46,58 L46,34 L18,34 L18,58 C14,58 10,50 10,40 Z" fill="#B0703F"/><circle cx="32" cy="34" r="15" fill="#FFE2CF"/><path d="M16,30 C18,16 30,12 40,16 C46,18 48,24 48,30 C40,24 30,22 16,30 Z" fill="#8A5536"/><circle cx="26" cy="36" r="2.6" fill="#5A2350"/><circle cx="38" cy="36" r="2.6" fill="#5A2350"/><path d="M28,43 Q32,46 36,43" stroke="#D94F7C" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="46" cy="16" r="6" fill="#FF7FAA"/><circle cx="52" cy="12" r="4" fill="#FF7FAA"/></svg>`,
  top: `<svg viewBox="0 0 64 64"><path d="M22,8 L12,12 L4,26 L14,32 L18,26 L18,56 L46,56 L46,26 L50,32 L60,26 L52,12 L42,8 Q32,16 22,8 Z" fill="#7FDCC4" stroke="#3AAA93" stroke-width="2.5" stroke-linejoin="round"/><path d="M32,44 C22,36 26,28 32,33 C38,28 42,36 32,44 Z" fill="#FF7FAA"/></svg>`,
  bottom: `<svg viewBox="0 0 64 64"><path d="M20,10 L44,10 L46,20 L58,52 Q32,60 6,52 L18,20 Z" fill="#FF9EC4" stroke="#D93F7C" stroke-width="2.5" stroke-linejoin="round"/><rect x="19" y="10" width="26" height="8" rx="3" fill="#FF7FAA"/><circle cx="22" cy="36" r="3" fill="#fff"/><circle cx="36" cy="32" r="3" fill="#fff"/><circle cx="44" cy="44" r="3" fill="#fff"/><circle cx="28" cy="48" r="3" fill="#fff"/></svg>`,
  dress: `<svg viewBox="0 0 64 64"><path d="M24,6 L24,14 L20,24 Q23,28 26,28 L8,56 Q32,64 56,56 L38,28 Q41,28 44,24 L40,14 L40,6 Q32,12 24,6 Z" fill="#C9A7F5" stroke="#8E62D6" stroke-width="2.5" stroke-linejoin="round"/><rect x="24" y="24" width="16" height="5" rx="2" fill="#FF7FAA"/><circle cx="32" cy="26.5" r="3.5" fill="#FFC53D"/><path d="M16,50 Q20,46 24,50 Q28,46 32,50 Q36,46 40,50 Q44,46 48,50" stroke="#fff" stroke-width="2.5" fill="none"/></svg>`,
  shoes: `<svg viewBox="0 0 64 64"><path d="M8,40 C8,30 14,28 20,30 C26,32 30,34 38,34 C50,34 58,38 58,46 L58,48 L8,48 Z" fill="#FF7FAA" stroke="#D93F7C" stroke-width="2.5" stroke-linejoin="round"/><rect x="8" y="46" width="50" height="7" rx="3.5" fill="#FFC53D"/><path d="M22,30 Q28,22 34,34" stroke="#D93F7C" stroke-width="3" fill="none"/><circle cx="31" cy="30" r="3" fill="#fff"/></svg>`,
  acc: `<svg viewBox="0 0 64 64"><path d="M8,44 L12,18 L24,32 L32,12 L40,32 L52,18 L56,44 Z" fill="#FFD34D" stroke="#E7A21E" stroke-width="2.5" stroke-linejoin="round"/><rect x="8" y="42" width="48" height="10" rx="4" fill="#FFC53D" stroke="#E7A21E" stroke-width="2.5"/><circle cx="32" cy="47" r="3.5" fill="#FF5C9A"/><circle cx="20" cy="47" r="3" fill="#58A8F5"/><circle cx="44" cy="47" r="3" fill="#58A8F5"/><circle cx="12" cy="18" r="3.5" fill="#fff"/><circle cx="32" cy="12" r="3.5" fill="#fff"/><circle cx="52" cy="18" r="3.5" fill="#fff"/></svg>`,
  beauty: `<svg viewBox="0 0 64 64"><rect x="22" y="34" width="20" height="24" rx="4" fill="#B48BF0" stroke="#8E62D6" stroke-width="2.5"/><rect x="24" y="26" width="16" height="10" rx="2" fill="#FFD34D"/><path d="M25,26 L25,12 Q32,4 39,10 L39,26 Z" fill="#FF5C9A"/><path d="M50,14 L52,20 L58,22 L52,24 L50,30 L48,24 L42,22 L48,20 Z" fill="#FFC53D"/></svg>`,
};

export const RANDOM_ICON = `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="12" fill="#fff" stroke="#8E62D6" stroke-width="4"/><circle cx="21" cy="21" r="5" fill="#FF5C9A"/><circle cx="43" cy="21" r="5" fill="#58A8F5"/><circle cx="32" cy="32" r="5" fill="#FFC53D"/><circle cx="21" cy="43" r="5" fill="#5FD0B8"/><circle cx="43" cy="43" r="5" fill="#B48BF0"/></svg>`;
export const RUNWAY_ICON = `<svg viewBox="0 0 64 64"><path d="M32,4 L38,20 L56,21 L42,32 L47,50 L32,40 L17,50 L22,32 L8,21 L26,20 Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><rect x="22" y="50" width="20" height="10" rx="4" fill="currentColor" opacity=".6"/></svg>`;

export const HAIR_STYLES = [
  { id: 'short', name: 'Tóc ngắn' },
  { id: 'twin', name: 'Tóc hai bím' },
  { id: 'pony', name: 'Tóc đuôi ngựa' },
  { id: 'long', name: 'Tóc dài' },
  { id: 'bun', name: 'Búi tóc' },
  { id: 'curly', name: 'Tóc xoăn' },
];
export const HAIR_COLORS = [
  { id: 'brown', name: 'Tóc màu nâu', hex: '#8A5536' },
  { id: 'blonde', name: 'Tóc màu vàng', hex: '#F2C45A' },
  { id: 'black', name: 'Tóc màu đen', hex: '#3A2A33' },
  { id: 'pink', name: 'Tóc màu hồng', hex: '#FF8FB8' },
  { id: 'purple', name: 'Tóc màu tím', hex: '#B48BF0' },
  { id: 'blue', name: 'Tóc màu xanh', hex: '#6EC6FF' },
  { id: 'rainbow', name: 'Tóc cầu vồng', hex: '#FF9EC4' },
];
export const RAINBOW_CSS = 'linear-gradient(#FF8FB8,#FFB27A,#FFE17A,#8FE3A6,#7FC4FF,#C39BFF)';

// Món đồ: nhóm (cat), chỗ mặc (slot), độ dang tay khi mặc váy xoè rộng (spread)
export const ITEMS = {
  // áo
  tshirt: { cat: 'top', name: 'Áo thun' },
  blouse: { cat: 'top', name: 'Áo sơ mi nơ' },
  sweater: { cat: 'top', name: 'Áo len' },
  cami: { cat: 'top', name: 'Áo hai dây' },
  jacket: { cat: 'top', name: 'Áo khoác' },
  sporty: { cat: 'top', name: 'Áo thể thao' },
  // váy / quần
  flare: { cat: 'bottom', name: 'Váy xòe', spread: 0.34 },
  tutu: { cat: 'bottom', name: 'Váy tutu', spread: 0.5 },
  longskirt: { cat: 'bottom', name: 'Chân váy dài', spread: 0.26 },
  shorts: { cat: 'bottom', name: 'Quần short' },
  jeans: { cat: 'bottom', name: 'Quần jean' },
  joggers: { cat: 'bottom', name: 'Quần thể thao' },
  // đầm
  princess: { cat: 'dress', name: 'Váy công chúa', spread: 0.62 },
  gown: { cat: 'dress', name: 'Váy dạ hội', spread: 0.26 },
  floral: { cat: 'dress', name: 'Váy hoa', spread: 0.36 },
  beach: { cat: 'dress', name: 'Váy đi biển', spread: 0.3 },
  winter: { cat: 'dress', name: 'Váy len mùa đông', spread: 0.34 },
  swim: { cat: 'dress', name: 'Đồ bơi', spread: 0.22 },
  // giày
  flats: { cat: 'shoes', name: 'Giày búp bê' },
  sneakers: { cat: 'shoes', name: 'Giày thể thao' },
  sandals: { cat: 'shoes', name: 'Dép xăng đan' },
  boots: { cat: 'shoes', name: 'Ủng mưa' },
  heels: { cat: 'shoes', name: 'Giày cao gót nhỏ' },
  bowshoes: { cat: 'shoes', name: 'Giày có nơ' },
  // phụ kiện (mỗi chỗ một món: đầu, mặt, tay, cổ)
  hat: { cat: 'acc', slot: 'head', name: 'Mũ rộng vành' },
  crown: { cat: 'acc', slot: 'head', name: 'Vương miện' },
  catears: { cat: 'acc', slot: 'head', name: 'Bờm tai mèo' },
  hairbow: { cat: 'acc', slot: 'head', name: 'Nơ tóc' },
  glasses: { cat: 'acc', slot: 'face', name: 'Kính râm' },
  bag: { cat: 'acc', slot: 'hand', name: 'Túi xách' },
  wand: { cat: 'acc', slot: 'hand', name: 'Đũa phép' },
  necklace: { cat: 'acc', slot: 'neck', name: 'Vòng cổ' },
  scarf: { cat: 'acc', slot: 'neck', name: 'Khăn quàng' },
};
export const ORDER = {
  top: ['tshirt', 'blouse', 'sweater', 'cami', 'jacket', 'sporty'],
  bottom: ['flare', 'tutu', 'longskirt', 'shorts', 'jeans', 'joggers'],
  dress: ['princess', 'gown', 'floral', 'beach', 'winter', 'swim'],
  shoes: ['flats', 'sneakers', 'sandals', 'boots', 'heels', 'bowshoes'],
  acc: ['hat', 'crown', 'catears', 'hairbow', 'glasses', 'bag', 'wand', 'necklace', 'scarf'],
};

// Khuôn mặt mặc định (chưa trang điểm) và các kiểu trang điểm
export const FACE_BASE = { blushAmt: 0.45, blush: '#FF8FB1', lipsAmt: 0, lips: '#F2476E', lashes: false, shadow: '#A56CF0', shadowAmt: 0 };
export const MAKEUP = [
  { id: 'natural', name: 'Tự nhiên', face: { blushAmt: 0.6, blush: '#FF9EB5', lipsAmt: 0.5, lips: '#F07A8E', lashes: false, shadowAmt: 0.25, shadow: '#FFB27A' } },
  { id: 'cute', name: 'Hồng dễ thương', face: { blushAmt: 0.9, blush: '#FF7FAA', lipsAmt: 0.85, lips: '#FF5C9A', lashes: true, shadow: '#FF9EC4', shadowAmt: 0.6 } },
  { id: 'princess', name: 'Công chúa', face: { blushAmt: 0.75, blush: '#FF8FB1', lipsAmt: 0.95, lips: '#E8436E', lashes: true, shadow: '#B48BF0', shadowAmt: 0.8 } },
  { id: 'star', name: 'Ngôi sao', face: { blushAmt: 0.6, blush: '#FFA77A', lipsAmt: 0.95, lips: '#E8364E', lashes: true, shadow: '#FFC53D', shadowAmt: 0.9 } },
  { id: 'rainbow', name: 'Cầu vồng', face: { blushAmt: 0.8, blush: '#FF9A6B', lipsAmt: 0.9, lips: '#A45CE0', lashes: true, shadow: '#58A8F5', shadowAmt: 0.9 } },
];
export const LIPS = [
  { id: 'pink', name: 'Son hồng', hex: '#FF6FA0' },
  { id: 'red', name: 'Son đỏ', hex: '#E8364E' },
  { id: 'coral', name: 'Son cam', hex: '#FF8A5C' },
  { id: 'berry', name: 'Son mận', hex: '#C4205F' },
  { id: 'purple', name: 'Son tím', hex: '#A45CE0' },
];

// Trang phục ban đầu của búp bê
export const BASE_LOOK = () => ({ hair: 'short', hairColor: 'brown', top: null, bottom: null, dress: null, shoes: null, acc: { head: null, face: null, hand: null, neck: null }, makeup: null, lips: null });
export const MENU_LOOK = () => ({ hair: 'twin', hairColor: 'brown', top: null, bottom: null, dress: 'floral', shoes: 'bowshoes', acc: { head: 'hairbow', face: null, hand: null, neck: null }, makeup: 'cute', lips: null });

// Màn chơi: tên, lời mời, danh sách yêu cầu [loại, món]
export const LEVELS = [
  { name: 'Đi chơi công viên', say: 'Mình đi chơi công viên nào!', reqs: [['top', 'tshirt'], ['bottom', 'shorts'], ['shoes', 'sneakers']] },
  { name: 'Đi học', say: 'Mặc đồ đi học nào!', reqs: [['hair', 'pony'], ['top', 'blouse'], ['bottom', 'flare'], ['shoes', 'flats']] },
  { name: 'Đi biển', say: 'Mình đi biển thôi!', reqs: [['dress', 'beach'], ['shoes', 'sandals'], ['hair', 'long']] },
  { name: 'Dự tiệc sinh nhật', say: 'Đi dự tiệc sinh nhật nào!', reqs: [['dress', 'floral'], ['shoes', 'bowshoes'], ['acc', 'hairbow'], ['hairColor', 'pink']] },
  { name: 'Ngày mưa', say: 'Trời mưa rồi, mặc gì đây?', reqs: [['top', 'jacket'], ['bottom', 'jeans'], ['shoes', 'boots'], ['acc', 'bag']] },
  { name: 'Thể thao', say: 'Cùng chơi thể thao nào!', reqs: [['hair', 'pony'], ['top', 'sporty'], ['bottom', 'joggers'], ['shoes', 'sneakers'], ['makeup', 'natural']] },
  { name: 'Mùa đông', say: 'Mùa đông lạnh lắm nè!', reqs: [['dress', 'winter'], ['acc', 'scarf'], ['shoes', 'boots'], ['hair', 'bun'], ['makeup', 'cute']] },
  { name: 'Picnic', say: 'Mình đi picnic nhé!', reqs: [['hair', 'curly'], ['top', 'cami'], ['bottom', 'longskirt'], ['shoes', 'sandals'], ['acc', 'hat']] },
  { name: 'Dạ hội', say: 'Tối nay đi dạ hội!', reqs: [['dress', 'gown'], ['shoes', 'heels'], ['acc', 'necklace'], ['hair', 'bun'], ['makeup', 'cute']] },
  { name: 'Nàng tiên', say: 'Hoá thành nàng tiên nào!', reqs: [['top', 'cami'], ['bottom', 'tutu'], ['acc', 'wand'], ['hairColor', 'rainbow'], ['makeup', 'star']] },
  { name: 'Công chúa', say: 'Hôm nay làm công chúa!', reqs: [['dress', 'princess'], ['acc', 'crown'], ['hair', 'long'], ['shoes', 'heels'], ['makeup', 'princess']] },
  { name: 'Siêu sao', say: 'Bé là siêu sao!', reqs: [['top', 'jacket'], ['bottom', 'tutu'], ['acc', 'glasses'], ['shoes', 'bowshoes'], ['makeup', 'rainbow']] },
];

// Mở khoá: có sẵn lúc đầu và quà sau khi qua màn N lần đầu.
// Mã: 'cat:x' nhóm đồ, 'hs:x' kiểu tóc, 'hc:x' màu tóc, 'mk:x' trang điểm, 'lip:x' son, còn lại là món đồ.
export const START = ['cat:hair', 'cat:top', 'cat:bottom', 'cat:shoes', 'hs:short', 'hs:twin', 'hs:pony', 'hc:brown', 'hc:blonde', 'hc:black',
  'tshirt', 'blouse', 'sweater', 'flare', 'shorts', 'jeans', 'flats', 'sneakers', 'sandals'];
export const GIFTS = {
  1: ['hs:long', 'hc:pink', 'cami', 'tutu', 'bowshoes'],
  2: ['cat:dress', 'floral', 'beach', 'swim'],
  3: ['cat:acc', 'hat', 'glasses', 'hairbow', 'bag'],
  4: ['jacket', 'boots', 'hs:bun', 'hc:purple'],
  5: ['cat:beauty', 'mk:natural', 'mk:cute', 'lip:pink', 'lip:red', 'lip:coral', 'sporty', 'joggers'],
  6: ['winter', 'longskirt', 'scarf', 'hc:blue'],
  7: ['hs:curly', 'catears', 'necklace', 'heels'],
  8: ['hc:rainbow', 'crown', 'gown'],
  9: ['wand', 'mk:star', 'lip:berry'],
  10: ['princess', 'mk:princess'],
  11: ['mk:rainbow', 'lip:purple'],
  12: ['trophy'],
};
export const RANKS = ['Bé Tập Làm Đẹp', 'Bé Mê Thời Trang', 'Bé Chọn Đồ Giỏi', 'Bạn Của Váy Hoa', 'Nhà Thiết Kế Nhí', 'Bé Sành Điệu',
  'Người Mẫu Nhí', 'Ngôi Sao Nhỏ', 'Nữ Hoàng Dạ Hội', 'Nàng Tiên Thời Trang', 'Công Chúa Thời Trang', 'Siêu Sao Thời Trang', 'Siêu Sao Thời Trang'];

export function unlockedSet(done) {
  const s = new Set(START);
  for (let n = 1; n <= done; n++) (GIFTS[n] || []).forEach(k => s.add(k));
  return s;
}
