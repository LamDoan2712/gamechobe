// games.js — danh sách game trong Góc Vui Chơi. Thêm game mới: thêm một dòng ở đây và một thư mục trong games/.

export const GAMES = [
  { id: 'trang-diem', name: 'Tiệm Trang Điểm', desc: 'Tô son, má hồng, dán hình xinh', color: '#FF7FAA', dark: '#D93F7C', track: 'calm',
    css: 'games/trang-diem/style.css', load: () => import('./games/trang-diem/index.js') },
  { id: 'banh-kem', name: 'Hamster Nhảy Bánh Kem', desc: 'Chạm để nhảy, xếp tháp bánh thật cao', color: '#FFC53D', dark: '#E7A21E', track: 'bouncy',
    css: 'games/banh-kem/style.css', load: () => import('./games/banh-kem/index.js') },
  { id: 'lam-toc', name: 'Tiệm Làm Tóc', desc: 'Gội, cắt, uốn, nhuộm tóc', color: '#7FC4FF', dark: '#4E9BE0', track: 'calm',
    css: 'games/lam-toc/style.css', load: () => import('./games/lam-toc/index.js') },
  { id: 'thoi-trang', name: 'Thời Trang Xinh', desc: 'Chọn váy áo, giày, phụ kiện', color: '#B48BF0', dark: '#8E62D6', track: 'calm',
    css: 'games/thoi-trang/style.css', load: () => import('./games/thoi-trang/index.js') },
  { id: 'nau-an', name: 'Bé Nấu Ăn', desc: 'Nấu món ngon cùng ba mẹ', color: '#FF9A5C', dark: '#E07434', track: 'calm',
    css: 'games/nau-an/style.css', load: () => import('./games/nau-an/index.js') },
];
