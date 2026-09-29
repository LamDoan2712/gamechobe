// kit/audio.js — âm thanh dùng chung cho mọi game: hiệu ứng, nhạc nền hộp nhạc, giọng đọc tiếng Việt.
// Tất cả tạo bằng Web Audio, không cần file âm thanh.

let ctx = null, master, sfxBus, musicBus, noiseBuf;
let sfxOn = true, musicOn = true, timer = null, nextT = 0, step = 0;
const midi = m => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.12; musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(f, t, dur, type = 'sine', vol = 0.3, slide, bus) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.05);
}
function noise(t, dur, vol, freq, q = 1, type = 'bandpass', sweepTo) {
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = noiseBuf; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(sfxBus); s.start(t); s.stop(t + dur + 0.05);
}
const play = fn => { if (!sfxOn || !ensure()) return; fn(ctx.currentTime); };

const fx = {
  tap: () => play(t => tone(880, t, 0.12, 'sine', 0.25, 1320)),
  select: () => play(t => { tone(784, t, 0.12, 'triangle', 0.22); tone(1175, t + 0.07, 0.16, 'triangle', 0.2); }),
  boop: () => play(t => tone(330, t, 0.18, 'sine', 0.25, 220)),
  pop: () => play(t => { tone(520, t, 0.1, 'sine', 0.35, 1400); noise(t, 0.05, 0.12, 3000, 2); }),
  rub: () => play(t => { noise(t, 0.12, 0.05, 5000, 0.8); tone(1600 + Math.random() * 1400, t, 0.18, 'sine', 0.05); }),
  bubble: () => play(t => tone(rnd(400, 900), t, 0.09, 'sine', 0.2, rnd(900, 1500))),
  ding: () => play(t => [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, t + i * 0.07, 0.35, 'triangle', 0.18))),
  shutter: () => play(t => { noise(t, 0.06, 0.4, 2500, 1); noise(t + 0.09, 0.08, 0.3, 1800, 1); }),
  star: n => play(t => { const f = [784, 988, 1175][n] || 1175; tone(f, t, 0.4, 'triangle', 0.25, f * 1.5); }),
  fanfare: () => play(t => [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38], [784, 0.52], [1047, 0.62]].forEach(([f, d]) => {
    tone(f, t + d, 0.3, 'square', 0.07); tone(f, t + d, 0.35, 'triangle', 0.18);
  })),
  magic: () => play(t => { [0, 4, 7, 11, 12, 16, 19, 23, 24, 28, 31, 36].forEach((m, i) => tone(midi(72 + m), t + i * 0.05, 0.4, 'sine', 0.13)); }),
  whoosh: () => play(t => noise(t, 0.35, 0.18, 900, 0.6)),
  jump: () => play(t => { tone(320, t, 0.22, 'sine', 0.3, 900); tone(640, t + 0.03, 0.15, 'triangle', 0.08, 1500); }),
  land: () => play(t => { tone(180, t, 0.16, 'sine', 0.35, 80); noise(t, 0.08, 0.1, 400, 1, 'lowpass'); }),
  bump: () => play(t => { tone(260, t, 0.35, 'square', 0.09, 120); tone(200, t, 0.4, 'sine', 0.3, 90); }),
  boing: () => play(t => { const o = ctx.createOscillator(), g = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
    o.frequency.value = 300; l.frequency.value = 14; lg.gain.value = 60; l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g); g.connect(sfxBus); o.start(t); l.start(t); o.stop(t + 0.55); l.stop(t + 0.55); }),
  snip: () => play(t => { noise(t, 0.035, 0.35, 6000, 3, 'highpass'); noise(t + 0.06, 0.03, 0.25, 7000, 3, 'highpass'); }),
  spray: () => play(t => noise(t, 0.3, 0.14, 4000, 0.7, 'bandpass', 6000)),
  whirr: () => play(t => { noise(t, 0.16, 0.08, 700, 0.8); tone(140, t, 0.16, 'sawtooth', 0.02); }),
  splash: () => play(t => { noise(t, 0.4, 0.2, 2500, 0.5, 'bandpass', 500); tone(600, t, 0.2, 'sine', 0.1, 300); }),
  poof: () => play(t => { noise(t, 0.3, 0.3, 1200, 0.5, 'lowpass', 200); tone(900, t + 0.05, 0.3, 'sine', 0.1, 1800); }),
  cheer: () => play(t => { for (let i = 0; i < 10; i++) tone(rnd(500, 1300), t + rnd(0, 0.5), rnd(0.15, 0.3), 'triangle', 0.06, rnd(900, 1800)); noise(t, 0.8, 0.08, 1500, 0.4); }),
  step: () => play(t => tone(rnd(500, 620), t, 0.06, 'triangle', 0.12)),
  click: () => play(t => tone(1500, t, 0.04, 'square', 0.05)),
  // âm thanh nhà bếp
  sizzle: () => play(t => { for (let i = 0; i < 5; i++) noise(t + i * 0.07, rnd(0.08, 0.18), rnd(0.05, 0.1), rnd(5000, 8000), 1.5, 'highpass'); }),
  chop: () => play(t => { noise(t, 0.05, 0.4, 1800, 2); tone(160, t, 0.08, 'sine', 0.3, 90); }),
  crack: () => play(t => { noise(t, 0.04, 0.45, 2600, 3); noise(t + 0.05, 0.05, 0.3, 1600, 3); }),
  pour: () => play(t => noise(t, 0.22, 0.1, rnd(700, 1100), 1.2, 'bandpass', 1600)),
  boil: () => play(t => { for (let i = 0; i < 3; i++) tone(rnd(180, 320), t + i * 0.09, 0.07, 'sine', 0.15, rnd(400, 600)); }),
  tach: () => play(t => { noise(t, 0.03, 0.5, 3000, 4); tone(900, t + 0.02, 0.1, 'triangle', 0.15); }),
  yum: () => play(t => { tone(520, t, 0.25, 'sine', 0.2, 700); tone(700, t + 0.22, 0.35, 'sine', 0.2, 520); }),
};

// Nhạc nền: giai điệu hộp nhạc nhẹ nhàng, lặp lại
const TRACKS = {
  calm: { bpm: 104, mel: [76, -1, 79, 76, 74, -1, 72, -1, 74, 76, 79, -1, 81, 79, 76, -1, 77, -1, 76, 74, 72, -1, 74, -1, 76, 74, 72, 67, 72, -1, -1, -1],
    bass: [48, 55, 52, 55, 43, 50, 47, 50, 45, 52, 48, 52, 41, 48, 43, 50] },
  bouncy: { bpm: 128, mel: [72, 76, 79, 76, 81, 79, 76, -1, 74, 77, 81, 77, 79, -1, -1, -1, 72, 76, 79, 84, 83, 79, 76, -1, 77, 76, 74, 71, 72, -1, -1, -1],
    bass: [48, 55, 50, 55, 53, 60, 55, 50, 48, 55, 52, 57, 53, 55, 48, 48] },
};
let track = TRACKS.calm;
function schedule() {
  const beat = 60 / track.bpm / 2;
  while (nextT < ctx.currentTime + 0.25) {
    const m = track.mel[step % track.mel.length];
    if (m > 0) { tone(midi(m), nextT, 0.6, 'triangle', 0.3, null, musicBus); tone(midi(m + 12), nextT, 0.3, 'sine', 0.08, null, musicBus); }
    if (step % 2 === 0) tone(midi(track.bass[(step / 2) % track.bass.length]), nextT, 0.5, 'sine', 0.22, null, musicBus);
    nextT += beat; step++;
  }
}
function startMusic() {
  if (!musicOn || timer || !ensure()) return;
  nextT = ctx.currentTime + 0.1; timer = setInterval(schedule, 60);
}
function stopMusic() { clearInterval(timer); timer = null; }

export const Sound = {
  fx, ensure, startMusic, stopMusic,
  setTrack(name) { if (TRACKS[name] && track !== TRACKS[name]) { track = TRACKS[name]; step = 0; } },
  setSfx(v) { sfxOn = v; if (!v) Voice.stop(); },
  setMusic(v) { musicOn = v; v ? startMusic() : stopMusic(); },
  get sfxOn() { return sfxOn; }, get musicOn() { return musicOn; },
};

export const Voice = (() => {
  let vi = null, last = 0;
  const pick = () => { try { vi = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang)) || null; } catch (e) { vi = null; } };
  if ('speechSynthesis' in window) { pick(); try { speechSynthesis.addEventListener('voiceschanged', pick); } catch (e) {} }
  return {
    get available() { return !!vi; },
    say(text, force) {
      if (!vi || !sfxOn) return;
      const now = Date.now();
      if (!force && now - last < 700) return;
      last = now;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.voice = vi; u.lang = vi.lang; u.rate = 0.95; u.pitch = 1.35;
        speechSynthesis.speak(u);
      } catch (e) {}
    },
    stop() { try { speechSynthesis.cancel(); } catch (e) {} },
  };
})();
