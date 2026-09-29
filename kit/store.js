// kit/store.js — lưu tiến trình trên trình duyệt của máy (mỗi game một ngăn riêng)

const KEY = 'goc-vui-choi-v1';
const OLD_MAKEUP_KEY = 'tiem-trang-diem-bena-v1';

function load() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
  if (!s || typeof s !== 'object') s = {};
  s.sfx = s.sfx !== false; s.music = s.music !== false;
  s.games = s.games && typeof s.games === 'object' ? s.games : {};
  // chuyển tiến trình của bản Tiệm Trang Điểm cũ (trước khi có cổng game)
  if (!s.games['trang-diem']) {
    try { const old = JSON.parse(localStorage.getItem(OLD_MAKEUP_KEY) || 'null'); if (old && typeof old === 'object') s.games['trang-diem'] = old; } catch (e) {}
  }
  return s;
}
const state = load();

export const Store = {
  get sfx() { return state.sfx; }, set sfx(v) { state.sfx = !!v; this.save(); },
  get music() { return state.music; }, set music(v) { state.music = !!v; this.save(); },
  // Trả về ngăn lưu của một game; defaults chỉ điền những khoá còn thiếu
  game(id, defaults = {}) {
    const cur = state.games[id] && typeof state.games[id] === 'object' ? state.games[id] : {};
    state.games[id] = Object.assign({}, defaults, cur);
    return state.games[id];
  },
  resetGame(id, keep = {}) { state.games[id] = Object.assign({}, keep); this.save(); return state.games[id]; },
  resetAll() { state.games = {}; try { localStorage.removeItem(OLD_MAKEUP_KEY); } catch (e) {} this.save(); },
  // Tổng số sao của mọi game (mỗi game lưu sao trong games[id].stars = {màn: số sao})
  totalStars() {
    return Object.values(state.games).reduce((sum, g) => sum + Object.values((g && g.stars) || {}).reduce((a, b) => a + (+b || 0), 0), 0);
  },
  starsOf(id) { const g = state.games[id]; return Object.values((g && g.stars) || {}).reduce((a, b) => a + (+b || 0), 0); },
  save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} },
};
