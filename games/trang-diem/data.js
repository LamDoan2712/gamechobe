// data.js — nội dung game: màu, dụng cụ, nhân vật, màn chơi, phần thưởng thăng cấp

const COLORS = {
  pink:    { hex: '#FF7FAA', name: 'màu hồng' },
  peach:   { hex: '#FFA77A', name: 'màu cam' },
  lilac:   { hex: '#D9A6F0', name: 'màu tím nhạt' },
  red:     { hex: '#F0404E', name: 'màu đỏ' },
  purple:  { hex: '#A56CF0', name: 'màu tím' },
  blue:    { hex: '#58A8F5', name: 'màu xanh dương' },
  gold:    { hex: '#FFC53D', name: 'màu vàng' },
  green:   { hex: '#62CC7A', name: 'màu xanh lá' },
  mint:    { hex: '#6FDCC8', name: 'màu xanh ngọc' },
  berry:   { hex: '#C4205F', name: 'màu mận' },
  black:   { hex: '#2E1F2A', name: 'màu đen' },
  brown:   { hex: '#8A5536', name: 'màu nâu' },
  blonde:  { hex: '#F5CC66', name: 'màu vàng' },
  ginger:  { hex: '#F2994A', name: 'màu cam' },
  cream:   { hex: '#FFF1D6', name: 'màu kem' },
  rainbow: { hex: '#FF9EC4', name: 'màu cầu vồng' },
};

const TOOLS = {
  blush:   { name: 'Má hồng',  say: 'Tô má hồng nào!',   kind: 'rub',     colors: ['pink', 'peach', 'lilac', 'red', 'purple'] },
  lips:    { name: 'Son môi',  say: 'Tô son môi nào!',   kind: 'rub',     colors: ['pink', 'red', 'peach', 'purple', 'berry'] },
  eyes:    { name: 'Phấn mắt', say: 'Tô phấn mắt nào!',  kind: 'rub',     colors: ['purple', 'blue', 'pink', 'gold', 'green', 'mint'] },
  lashes:  { name: 'Mi mắt',   say: 'Chuốt mi thật cong!', kind: 'rub',   colors: ['black', 'brown', 'purple', 'blue'] },
  hair:    { name: 'Màu tóc',  say: 'Đổi màu tóc nào!',  kind: 'hair',    colors: ['brown', 'blonde', 'pink', 'blue', 'purple', 'mint', 'rainbow'] },
  sticker: { name: 'Hình dán', say: 'Chạm vào bạn để dán hình!', kind: 'sticker' },
  acc:     { name: 'Phụ kiện', say: 'Chọn phụ kiện xinh nào!', kind: 'acc' },
  wash:    { name: 'Rửa mặt',  say: 'Xoa xoa để rửa mặt nào!', kind: 'wash' },
};
const TOOL_ORDER = ['blush', 'lips', 'eyes', 'lashes', 'hair', 'sticker', 'acc', 'wash'];
const RUB_TOOLS = ['blush', 'eyes', 'lips', 'lashes'];

// Vùng trên khuôn mặt (toạ độ SVG 400×520) — dùng để gợi ý và tô nhanh hơn khi xoa đúng chỗ
const ZONES = {
  blush:  { pts: [[128, 330], [272, 330]], r: 48 },
  eyes:   { pts: [[150, 276], [250, 276]], r: 46 },
  lashes: { pts: [[150, 272], [250, 272]], r: 46 },
  lips:   { pts: [[200, 358]], r: 44 },
  wash:   { pts: [[200, 300]], r: 130 },
};

const STICKERS = { star: 'Ngôi sao', heart: 'Trái tim', flower: 'Bông hoa', butterfly: 'Bươm bướm', moon: 'Mặt trăng', sparkle: 'Lấp lánh' };
const ACCS = { crown: 'Vương miện', bow: 'Nơ xinh', flowers: 'Vòng hoa', glasses: 'Kính trái tim', necklace: 'Vòng ngọc trai' };

const CHARS = {
  na:   { name: 'Bé Na',    skin: '#FFE2CF', shade: '#F2C0A2', hair: 'brown',  style: 'pigtails', ears: 'human',   nose: 'human', outfit: '#FF9CC2', outfit2: '#FFFFFF', lip: '#EF9A9A' },
  mimi: { name: 'Mèo Mimi', skin: '#FFF5EA', shade: '#F1D8C0', hair: 'ginger', style: 'bob',      ears: 'cat',     nose: 'cat',   outfit: '#7FD8C4', outfit2: '#FFFFFF', lip: '#F2A0A8', whiskers: true },
  tho:  { name: 'Thỏ Bông', skin: '#FFF3F6', shade: '#F3D3DC', hair: 'cream',  style: 'long',     ears: 'bunny',   nose: 'bunny', outfit: '#C9A7F5', outfit2: '#FFF6FB', lip: '#F4A3B4' },
  gau:  { name: 'Gấu Mật',  skin: '#F8DDBF', shade: '#E7BF96', hair: 'brown',  style: 'bob',      ears: 'bear',    nose: 'bear',  outfit: '#FFC94D', outfit2: '#FFF6DE', lip: '#E89A8C' },
  lan:  { name: 'Kỳ Lân',   skin: '#FFF6FC', shade: '#F1D9EC', hair: 'lilac',  style: 'mane',     ears: 'unicorn', nose: 'human', outfit: '#FF9CC2', outfit2: '#FFF6FB', lip: '#F3A6C0' },
};
const CHAR_ORDER = ['na', 'mimi', 'tho', 'gau', 'lan'];

// Mỗi màn: nhân vật + danh sách yêu cầu [dụng cụ, màu/loại, số lượng]
const LEVELS = [
  { c: 'na',   r: [['blush', 'pink'], ['lips', 'pink']] },
  { c: 'na',   r: [['blush', 'peach'], ['lips', 'red']] },
  { c: 'na',   r: [['eyes', 'purple'], ['lips', 'pink']] },
  { c: 'mimi', r: [['blush', 'pink'], ['lips', 'red'], ['sticker', 'star', 3]] },
  { c: 'mimi', r: [['eyes', 'blue'], ['blush', 'peach'], ['lips', 'pink']] },
  { c: 'mimi', r: [['eyes', 'pink'], ['lips', 'red'], ['acc', 'crown']] },
  { c: 'tho',  r: [['lashes', 'black'], ['blush', 'pink'], ['lips', 'pink']] },
  { c: 'tho',  r: [['eyes', 'purple'], ['lashes', 'black'], ['lips', 'red'], ['acc', 'bow']] },
  { c: 'tho',  r: [['hair', 'pink'], ['blush', 'pink'], ['lips', 'pink'], ['sticker', 'heart', 3]] },
  { c: 'gau',  r: [['hair', 'blonde'], ['eyes', 'gold'], ['lips', 'red'], ['acc', 'flowers']] },
  { c: 'gau',  r: [['eyes', 'green'], ['lashes', 'brown'], ['blush', 'peach'], ['lips', 'berry'], ['sticker', 'flower', 3]] },
  { c: 'gau',  r: [['hair', 'blue'], ['eyes', 'blue'], ['lashes', 'black'], ['lips', 'pink'], ['acc', 'crown']] },
  { c: 'lan',  r: [['hair', 'rainbow'], ['eyes', 'purple'], ['blush', 'pink'], ['lips', 'purple'], ['sticker', 'star', 3]] },
  { c: 'lan',  r: [['eyes', 'mint'], ['lashes', 'purple'], ['lips', 'pink'], ['acc', 'necklace'], ['sticker', 'butterfly', 3]] },
  { c: 'lan',  r: [['hair', 'purple'], ['eyes', 'gold'], ['lashes', 'black'], ['blush', 'lilac'], ['lips', 'red'], ['acc', 'crown']] },
];

// Quà thăng cấp: hoàn thành màn N lần đầu thì mở khoá
const MILESTONES = {
  2:  { tools: ['eyes'] },
  3:  { chars: ['mimi'], tools: ['sticker'] },
  5:  { tools: ['acc'] },
  6:  { chars: ['tho'], tools: ['lashes'] },
  8:  { tools: ['hair'] },
  9:  { chars: ['gau'], colors: true, stickers: true },
  12: { chars: ['lan'], accs: true, rainbow: true },
  15: { trophy: true },
};

const RANK_TITLES = ['Bé Tập Làm Đẹp', 'Bé Khéo Tay', 'Bạn Của Mèo', 'Thợ Làm Đẹp Nhí', 'Bạn Của Thỏ',
  'Phù Thuỷ Màu Tóc', 'Chuyên Gia Nhí', 'Bạn Của Kỳ Lân', 'Siêu Sao Trang Điểm'];

const PRAISE = ['Giỏi quá!', 'Đẹp quá!', 'Tuyệt vời!', 'Xinh xắn quá!', 'Hay lắm!'];

function unlocksFor(done) {
  const u = { tools: ['blush', 'lips', 'wash'], chars: ['na'], allColors: done >= 9, rainbow: done >= 12,
    stickers: done >= 9 ? Object.keys(STICKERS) : ['star', 'heart', 'flower'],
    accs: done >= 12 ? Object.keys(ACCS) : ['crown', 'bow', 'flowers'], trophy: done >= 15 };
  for (const [lv, m] of Object.entries(MILESTONES)) {
    if (done < +lv) continue;
    (m.tools || []).forEach(t => u.tools.push(t));
    (m.chars || []).forEach(c => u.chars.push(c));
  }
  u.tools = TOOL_ORDER.filter(t => u.tools.includes(t));
  u.chars = CHAR_ORDER.filter(c => u.chars.includes(c));
  return u;
}

function colorsFor(tool, u) {
  const all = TOOLS[tool].colors || [];
  let list = u.allColors ? all : all.slice(0, 3);
  if (!u.rainbow) list = list.filter(c => c !== 'rainbow');
  return list;
}

function rankFor(done) {
  let r = 1;
  for (const lv of Object.keys(MILESTONES)) if (done >= +lv) r++;
  if (done > 15) r += Math.floor((done - 15) / 3);
  return r;
}
function rankTitle(r) { return RANK_TITLES[Math.min(r, RANK_TITLES.length) - 1]; }

// Màn sau 15: tạo ngẫu nhiên nhưng cố định theo số màn
function getLevel(n) {
  if (n <= LEVELS.length) return LEVELS[n - 1];
  let seed = n * 9301 + 49297;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const pick = a => a[Math.floor(rnd() * a.length)];
  const c = pick(CHAR_ORDER);
  const pool = ['blush', 'lips', 'eyes', 'lashes', 'hair', 'sticker', 'acc'];
  const count = 4 + (rnd() > 0.5 ? 1 : 0);
  const chosen = [];
  while (chosen.length < count) { const t = pick(pool); if (!chosen.includes(t)) chosen.push(t); }
  const r = chosen.map(t => {
    if (t === 'sticker') return ['sticker', pick(Object.keys(STICKERS)), 3];
    if (t === 'acc') return ['acc', pick(Object.keys(ACCS))];
    let colors = TOOLS[t].colors;
    if (t === 'hair') colors = colors.filter(k => k !== CHARS[c].hair);
    return [t, pick(colors)];
  });
  return { c, r };
}

export { COLORS, TOOLS, TOOL_ORDER, RUB_TOOLS, ZONES, STICKERS, ACCS, CHARS, CHAR_ORDER, LEVELS, MILESTONES, RANK_TITLES, PRAISE, unlocksFor, colorsFor, rankFor, rankTitle, getLevel };
