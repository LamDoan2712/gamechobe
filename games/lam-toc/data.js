// data.js — nội dung game Tiệm Làm Tóc: màu nhuộm, dụng cụ, phụ kiện, khách hàng, màn chơi, quà thăng cấp

export const COLORS = {
  hong:      { hex: '#FF8FB8', name: 'màu hồng' },
  tim:       { hex: '#B98AF0', name: 'màu tím' },
  xanhduong: { hex: '#6AAEF7', name: 'màu xanh dương' },
  xanhngoc:  { hex: '#52D2B8', name: 'màu xanh ngọc' },
  vang:      { hex: '#FFD24D', name: 'màu vàng' },
  do:        { hex: '#F2545B', name: 'màu đỏ' },
  cam:       { hex: '#FF9D4D', name: 'màu cam' },
  nau:       { hex: '#8A5536', name: 'màu nâu' },
  den:       { hex: '#4A3547', name: 'màu đen' },
  cauvong:   { hex: '#FF9EC4', name: 'màu cầu vồng', rainbow: true },
};
export const DYE_ORDER = ['hong', 'tim', 'xanhduong', 'xanhngoc', 'vang', 'do', 'cam', 'nau', 'den', 'cauvong'];
// màu pastel cho kiểu nhuộm cầu vồng (các lọn cạnh nhau khác màu)
export const RAINBOW = ['#FF8FB8', '#FFB070', '#FFE070', '#8EE39F', '#7FC4FF', '#B99BFF'];

export const TOOLS = {
  shampoo:  { name: 'Gội đầu',       say: 'Gội đầu nào!' },
  rinse:    { name: 'Vòi sen',       say: 'Xả nước nào!' },
  dryer:    { name: 'Máy sấy',       say: 'Sấy khô tóc nào!' },
  comb:     { name: 'Lược',          say: 'Chải tóc nào!' },
  scissors: { name: 'Kéo',           say: 'Cắt tóc nào!' },
  grow:     { name: 'Thuốc mọc tóc', say: 'Thuốc mọc tóc!' },
  curler:   { name: 'Máy uốn',       say: 'Uốn tóc xoăn nào!' },
  dye:      { name: 'Nhuộm',         say: 'Nhuộm tóc nào!' },
  acc:      { name: 'Phụ kiện',      say: 'Chọn phụ kiện xinh nào!' },
};
export const TOOL_ORDER = ['shampoo', 'rinse', 'dryer', 'comb', 'scissors', 'grow', 'curler', 'dye', 'acc'];
export const RUB_TOOLS = ['shampoo', 'rinse', 'dryer', 'comb', 'scissors', 'grow', 'curler', 'dye'];

export const ACCS = { bow: 'Nơ xinh', star: 'Kẹp ngôi sao', flower: 'Bông hoa', catband: 'Bờm tai mèo', crown: 'Vương miện' };
export const ACC_ORDER = ['bow', 'star', 'flower', 'catband', 'crown'];

// Khách hàng: màu da, tóc mặc định (dài, xoăn, màu), áo choàng, tai thú (nếu có)
export const CUSTOMERS = {
  na:   { name: 'Bé Na',    skin: '#FFE2CF', hair: '#8A5536', len: 2.3, curl: 0,    cape: '#9FDCEB', face: { eyeColor: '#6A3F7E', brow: '#7A4A30', lashes: true } },
  mai:  { name: 'Bé Mai',   skin: '#F6CFB0', hair: '#4A3547', len: 2.6, curl: 0.1,  cape: '#C9B3F5', face: { eyeColor: '#4A2A55', brow: '#3B2B38', lashes: true } },
  bo:   { name: 'Bé Bơ',    skin: '#FFE8D6', hair: '#F2C45A', len: 1.5, curl: 0.55, cape: '#FFB8D1', face: { eyeColor: '#3F6E9E', brow: '#C8913A', lashes: false } },
  mimi: { name: 'Mèo Mimi', skin: '#FFF3E6', hair: '#F2994A', len: 0.6, curl: 0.2,  cape: '#8FE0C4', ears: 'cat',   earColor: '#F2994A', face: { eyeColor: '#3F8E5E', brow: '#C9702E', lashes: true } },
  tho:  { name: 'Thỏ Bông', skin: '#FFF3F6', hair: '#EFCF9F', len: 0.6, curl: 0.35, cape: '#FFD37A', ears: 'bunny', earColor: '#FFF6F2', face: { eyeColor: '#A5487E', brow: '#C9A27A', lashes: true } },
};
export const CUSTOMER_ORDER = ['na', 'mai', 'bo', 'mimi', 'tho'];

// Các bước yêu cầu: wash (gội + xả sạch bọt), dry, cut, grow, curl, dye:<màu>, acc:<phụ kiện>
export const LEVELS = [
  { c: 'na',   steps: ['wash', 'dry'] },
  { c: 'mai',  steps: ['wash', 'dry', 'cut'] },
  { c: 'bo',   steps: ['wash', 'dry', 'dye:hong'] },
  { c: 'na',   steps: ['wash', 'dry', 'cut', 'dye:xanhduong'] },
  { c: 'mai',  steps: ['wash', 'dry', 'dye:tim', 'acc:bow'] },
  { c: 'mimi', steps: ['wash', 'dry', 'grow', 'acc:star'] },
  { c: 'mimi', steps: ['wash', 'dry', 'grow', 'dye:hong', 'acc:flower'] },
  { c: 'bo',   curl: 0, len: 1.6, steps: ['wash', 'dry', 'curl', 'dye:vang', 'acc:bow'] },
  { c: 'na',   steps: ['wash', 'dry', 'cut', 'curl', 'acc:star'] },
  { c: 'mimi', steps: ['wash', 'dry', 'grow', 'dye:cauvong', 'acc:crown'] },
  { c: 'mai',  steps: ['wash', 'dry', 'cut', 'curl', 'dye:tim', 'acc:flower'] },
  { c: 'tho',  steps: ['wash', 'dry', 'grow', 'curl', 'dye:cauvong', 'acc:crown'] },
];

export const STEP_NAMES = {
  wash: 'Gội đầu', dry: 'Sấy khô', cut: 'Cắt ngắn', grow: 'Tóc dài', curl: 'Uốn xoăn', dye: 'Nhuộm', acc: 'Phụ kiện',
};
export const STEP_DONE_SAY = {
  wash: 'Sạch thơm rồi!', dry: 'Khô rồi, mềm quá!', cut: 'Tóc ngắn xinh quá!', grow: 'Tóc dài quá!',
  curl: 'Tóc xoăn xinh quá!', dye: 'Màu tóc đẹp quá!', acc: 'Xinh quá!',
};

// Hoàn thành màn N lần đầu thì được mở quà
export const MILESTONES = {
  1: { tools: ['scissors'] },
  2: { tools: ['dye'] },
  4: { tools: ['acc'] },
  5: { tools: ['grow'], customers: ['mimi'] },
  7: { tools: ['curler'] },
  9: { rainbow: true, accs: ['crown'] },
  11: { customers: ['tho'] },
};
const RANK_TITLES = ['Thợ Gội Đầu Nhí', 'Thợ Cắt Tóc Nhí', 'Thợ Nhuộm Tóc', 'Nhà Tạo Mẫu Nhí', 'Bạn Của Mèo',
  'Thợ Uốn Tóc', 'Phù Thuỷ Cầu Vồng', 'Siêu Sao Làm Tóc'];

export function parseStep(s) { const [type, v] = s.split(':'); return { type, v: v || null }; }

export function unlocksFor(done) {
  const u = { tools: ['shampoo', 'rinse', 'dryer', 'comb'], customers: ['na', 'mai', 'bo'], accs: ['bow', 'star', 'flower', 'catband'], rainbow: false };
  for (const [lv, m] of Object.entries(MILESTONES)) {
    if (done < +lv) continue;
    (m.tools || []).forEach(t => u.tools.push(t));
    (m.customers || []).forEach(c => u.customers.push(c));
    (m.accs || []).forEach(a => u.accs.push(a));
    if (m.rainbow) u.rainbow = true;
  }
  u.tools = TOOL_ORDER.filter(t => u.tools.includes(t));
  u.customers = CUSTOMER_ORDER.filter(c => u.customers.includes(c));
  u.accs = ACC_ORDER.filter(a => u.accs.includes(a));
  u.colors = DYE_ORDER.filter(c => c !== 'cauvong' || u.rainbow);
  return u;
}
export function rankFor(done) {
  let r = 1;
  for (const lv of Object.keys(MILESTONES)) if (done >= +lv) r++;
  return r;
}
export const rankTitle = r => RANK_TITLES[Math.min(r, RANK_TITLES.length) - 1];
// Công cụ cần dùng cho một bước (bước gội có hai giai đoạn: tạo bọt rồi xả nước)
export function toolForStep(st, washPhase) {
  switch (st.type) {
    case 'wash': return washPhase >= 1 ? 'rinse' : 'shampoo';
    case 'dry': return washPhase >= 2 ? 'dryer' : (washPhase >= 1 ? 'rinse' : 'shampoo');
    case 'cut': return 'scissors';
    case 'grow': return 'grow';
    case 'curl': return 'curler';
    case 'dye': return 'dye';
    case 'acc': return 'acc';
  }
  return null;
}
export const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
