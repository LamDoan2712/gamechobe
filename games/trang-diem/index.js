// index.js — Tiệm Trang Điểm Bé Na trong Góc Vui Chơi: gắn giao diện, khởi động và dọn dẹp khi rời game

import { TEMPLATE } from './template.js';
import { initGame } from './game.js';
import { initScreens } from './screens.js';

let G = null, offs = [];

export default {
  mount(root, ctx) {
    root.innerHTML = TEMPLATE;
    offs = [];
    const env = { on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); offs.push(() => target.removeEventListener(ev, fn, opts)); } };
    G = {};
    initGame(G, env);
    initScreens(G, env, ctx);
  },
  unmount() {
    if (G && G.destroy) G.destroy();
    offs.forEach(f => f()); offs = [];
    G = null;
  },
};
