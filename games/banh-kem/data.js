// data.js — nội dung game Hamster Nhảy Bánh Kem: màn chơi, vị bánh, phụ kiện, quà thăng cấp

export const LEVEL_COUNT = 12;
const TARGETS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

// speed: tốc độ bánh (đơn vị/giây) · hang: thời gian bay của một cú nhảy (giây)
// approach: số giây từ lúc bánh xuất hiện tới lúc chạm hamster (giữ nhịp như nhau trên mọi màn hình)
// tol: độ dễ — hamster chỉ cần cao hơn (chiều cao tầng bánh − tol) là qua
export const LEVELS = TARGETS.map((target, i) => ({
  n: i + 1,
  target,
  speed: 2.3 + i * 0.17,
  hang: 0.9 - i * 0.012,
  approach: 1.75 - i * 0.045,
  randomSide: i >= 4,
  fastChance: i >= 6 ? 0.16 + (i - 6) * 0.03 : 0,
  cue: i < 3,
  tol: i < 3 ? 0.2 : 0.14,
}));

// Chơi mãi: tăng tốc dần theo số tầng, 3 trái tim
export const ENDLESS = {
  n: 0, target: Infinity, speed: 3.0, hang: 0.84, approach: 1.4, randomSide: true, fastChance: 0.2, cue: false, tol: 0.14,
  ramp(cfg, count) {
    cfg.speed = Math.min(5.6, 3.0 + count * 0.07);
    cfg.hang = Math.max(0.7, 0.84 - count * 0.004);
    cfg.approach = Math.max(1.0, 1.4 - count * 0.012);
  },
};

// Vị bánh: màu ruột bánh (3 sắc độ khác nhau một chút) và màu kem phủ
export const FLAVORS = {
  dau:      { name: 'Bánh dâu',       body: ['#FF9DBA', '#FFAAC5', '#FF8FB1'], frost: '#FFF0F5', berry: 'strawberry' },
  vani:     { name: 'Bánh vani',      body: ['#FFE19E', '#FFE9B5', '#FFD88C'], frost: '#FFFFFF' },
  choco:    { name: 'Bánh sô-cô-la',  body: ['#B06E48', '#BC7A52', '#A2623E'], frost: '#6F3B26' },
  matcha:   { name: 'Bánh trà xanh',  body: ['#B4DA8A', '#C1E29B', '#A7D07B'], frost: '#F4FFE6' },
  vietquat: { name: 'Bánh việt quất', body: ['#B89CEB', '#C5ACF1', '#AA8DE2'], frost: '#EEE6FF', berry: 'blueberry' },
  rainbow:  { name: 'Bánh cầu vồng',  body: ['#FFFFFF', '#FFFFFF', '#FFFFFF'], frost: '#FFFFFF', rainbow: true },
};
export const BASE_FLAVORS = ['dau', 'vani'];

// Phụ kiện đội đầu (thứ tự trong tủ đồ) và màn mở khoá
export const ACCESSORIES = [
  { id: 'none', name: 'Không đội', level: 0 },
  { id: 'bow', name: 'Nơ hồng', level: 4 },
  { id: 'chef', name: 'Mũ đầu bếp', level: 6 },
  { id: 'crown', name: 'Vương miện', level: 12 },
  { id: 'glasses', name: 'Kính tim', level: 8 },
];

// Quà khi hoàn thành lần đầu các màn mốc
export const MILESTONES = {
  2: { flavors: ['choco'] },
  4: { accs: ['bow'] },
  6: { flavors: ['matcha'], accs: ['chef'] },
  8: { flavors: ['vietquat'], accs: ['glasses'] },
  10: { flavors: ['rainbow'] },
  12: { accs: ['crown'], endless: true },
};
export const RANK_TITLES = ['Bé Tập Làm Bánh', 'Bé Làm Bánh', 'Thợ Bánh Nhí', 'Thợ Bánh Giỏi', 'Đầu Bếp Nhí', 'Siêu Đầu Bếp', 'Vua Bánh Kem'];

export const isDone = (save, n) => !!save.stars[n];
export const playable = (save, n) => n === 1 || isDone(save, n) || isDone(save, n - 1);
export function currentLevel(save) {
  for (let n = 1; n <= LEVEL_COUNT; n++) if (!isDone(save, n)) return n;
  return LEVEL_COUNT;
}
export function unlockedFlavors(save) {
  const out = BASE_FLAVORS.slice();
  for (const lv in MILESTONES) if (isDone(save, +lv) && MILESTONES[lv].flavors) out.push(...MILESTONES[lv].flavors);
  return out;
}
export const accUnlocked = (save, id) => { const a = ACCESSORIES.find(x => x.id === id); return !!a && (a.level === 0 || isDone(save, a.level)); };
export const endlessUnlocked = save => isDone(save, 12);
export const milestonesReached = save => Object.keys(MILESTONES).filter(k => isDone(save, +k)).length;
export const starsFor = misses => (misses === 0 ? 3 : misses <= 2 ? 2 : 1);
