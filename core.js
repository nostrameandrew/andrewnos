/* Memory Breakout: core engine (canvas, loop, input, audio, save, photos) */
(function () {
  'use strict';
  const MB = (window.MB = {});
  const C = (MB.C = window.CONTENT || {});
  const W = (MB.W = 640), H = (MB.H = 880);
  MB.NUM = 50;
  MB.rand = (a, b) => a + Math.random() * (b - a);
  MB.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  MB.$ = (id) => document.getElementById(id);

  // ---------------- content sanity / defaults ----------------
  if (!Array.isArray(C.photos)) C.photos = [];
  for (let i = 0; i < 50; i++) {
    const n = String(i + 1).padStart(2, '0');
    if (!C.photos[i]) C.photos[i] = { file: 'photos/' + n + '.jpg', caption: 'Memory #' + (i + 1) };
    if (!C.photos[i].file) C.photos[i].file = 'photos/' + n + '.jpg';
    if (C.photos[i].caption == null) C.photos[i].caption = '';
  }
  if (!Array.isArray(C.chapters)) C.chapters = [];
  for (let i = 0; i < 5; i++) if (!C.chapters[i]) C.chapters[i] = { title: 'Chapter ' + (i + 1), subtitle: '' };
  if (!Array.isArray(C.bonusMessages)) C.bonusMessages = [];
  if (!Array.isArray(C.trivia)) C.trivia = [];
  C.forName = C.forName || 'Dad';

  // ---------------- save (localStorage, always try/catch) ----------------
  const SAVE_KEY = 'memoryBreakout50.save.v1';
  const MUTE_KEY = 'memoryBreakout50.muted';
  function defaultSave() {
    return { step: 0, cleared: Array(50).fill(false), mg: Array(5).fill(false), trivia: {}, epilogue: false, started: false };
  }
  MB.loadSave = function () {
    let s = defaultSave();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          s = Object.assign(s, o);
          if (!Array.isArray(s.cleared) || s.cleared.length !== 50) s.cleared = defaultSave().cleared.map((_, i) => !!(o.cleared && o.cleared[i]));
          if (!Array.isArray(s.mg) || s.mg.length !== 5) s.mg = defaultSave().mg.map((_, i) => !!(o.mg && o.mg[i]));
          s.step = MB.clamp(parseInt(s.step, 10) || 0, 0, 56);
          if (!s.trivia || typeof s.trivia !== 'object') s.trivia = {};
        }
      }
    } catch (e) { /* storage blocked or corrupt: start fresh */ }
    MB.save = s;
    return s;
  };
  MB.persist = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(MB.save)); } catch (e) { /* private mode etc. */ }
  };
  MB.resetSave = function () {
    MB.save = defaultSave();
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
    MB.persist();
  };
  // step layout: chapter c -> steps c*11 .. c*11+9 are levels, c*11+10 is the bonus game; 55 = epilogue; 56 = all done
  MB.stepInfo = function (s) {
    if (s >= 56) return { type: 'done' };
    if (s === 55) return { type: 'epilogue' };
    const c = Math.floor(s / 11), k = s % 11;
    return k < 10 ? { type: 'level', level: c * 10 + k, chapter: c } : { type: 'minigame', chapter: c };
  };
  MB.levelStep = (li) => Math.floor(li / 10) * 11 + (li % 10);
  MB.mgStep = (c) => c * 11 + 10;

  // ---------------- audio (Web Audio synth, no files) ----------------
  const A = (MB.audio = { ctx: null, master: null, muted: false });
  try { A.muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume().catch(() => {}); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      A.ctx = new AC();
      A.master = A.ctx.createGain();
      A.master.gain.value = A.muted ? 0 : 0.5;
      const comp = A.ctx.createDynamicsCompressor();
      A.master.connect(comp); comp.connect(A.ctx.destination);
    } catch (e) { A.ctx = null; }
  };
  A.setMuted = function (m) {
    A.muted = m;
    try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) {}
    if (A.master) A.master.gain.setTargetAtTime(m ? 0 : 0.5, A.ctx.currentTime, 0.02);
    MB.$('muteBtn').textContent = m ? '🔇' : '🔊';
  };
  function tone(f, d, o) {
    if (!A.ctx || A.muted) return;
    o = o || {};
    const t = o.at != null ? o.at : A.ctx.currentTime + (o.delay || 0);
    const osc = A.ctx.createOscillator(), g = A.ctx.createGain();
    osc.type = o.type || 'square';
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + d);
    const v = o.vol == null ? 0.15 : o.vol;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    if (o.filter) { const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.filter; osc.connect(lp); lp.connect(g); }
    else osc.connect(g);
    g.connect(o.dest || A.master);
    osc.start(t); osc.stop(t + d + 0.02);
  }
  let noiseBuf = null;
  function noise(d, o) {
    if (!A.ctx || A.muted) return;
    o = o || {};
    if (!noiseBuf) {
      noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate, A.ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t = o.at != null ? o.at : A.ctx.currentTime + (o.delay || 0);
    const src = A.ctx.createBufferSource(); src.buffer = noiseBuf;
    const fl = A.ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = o.freq || 1200; fl.Q.value = 0.8;
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(o.vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fl); fl.connect(g); g.connect(o.dest || A.master);
    src.start(t); src.stop(t + d + 0.02);
  }
  const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349];
  MB.sfx = {
    click: () => tone(880, 0.06, { type: 'triangle', vol: 0.12 }),
    paddle: () => tone(330, 0.08, { type: 'square', vol: 0.1, slide: 440 }),
    wall: () => tone(220, 0.04, { type: 'triangle', vol: 0.07 }),
    brick: (r) => { tone(PENT[(r || 0) % PENT.length], 0.12, { type: 'square', vol: 0.09 }); tone(PENT[(r || 0) % PENT.length] * 2, 0.08, { type: 'sine', vol: 0.05 }); },
    tink: () => tone(1400, 0.05, { type: 'triangle', vol: 0.08 }),
    power: () => { [0, 0.06, 0.12, 0.18].forEach((d, i) => tone(523 * Math.pow(1.26, i), 0.12, { type: 'triangle', vol: 0.12, delay: d })); },
    life: () => { [0, 0.08, 0.16].forEach((d, i) => tone([659, 880, 1319][i], 0.18, { type: 'sine', vol: 0.18, delay: d })); },
    lose: () => { tone(440, 0.5, { type: 'sawtooth', vol: 0.12, slide: 90 }); noise(0.3, { vol: 0.1, freq: 300 }); },
    clear: () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.13, delay: i * 0.08 })); },
    win: () => { [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i === 6 ? 0.6 : 0.16, { type: 'square', vol: 0.09, delay: i * 0.12 })); },
    shoot: () => tone(1200, 0.06, { type: 'square', vol: 0.04, slide: 500 }),
    boom: () => { noise(0.25, { vol: 0.18, freq: 700 }); tone(160, 0.2, { type: 'sine', vol: 0.12, slide: 50 }); },
    lasso: () => tone(300, 0.35, { type: 'sine', vol: 0.12, slide: 900 }),
    bubble: () => { tone(700, 0.1, { type: 'sine', vol: 0.15, slide: 1400 }); tone(1400, 0.12, { type: 'sine', vol: 0.08, delay: 0.06, slide: 2000 }); },
    hurt: () => { noise(0.2, { vol: 0.16, freq: 400 }); tone(200, 0.25, { type: 'sawtooth', vol: 0.1, slide: 80 }); },
    key: () => tone(600, 0.03, { type: 'triangle', vol: 0.06 }),
    good: () => { tone(784, 0.1, { type: 'triangle', vol: 0.13 }); tone(1175, 0.18, { type: 'triangle', vol: 0.13, delay: 0.08 }); },
    bad: () => tone(180, 0.2, { type: 'square', vol: 0.08, slide: 120 }),
    steal: () => tone(900, 0.4, { type: 'sawtooth', vol: 0.08, slide: 200 }),
    bigBoom: () => { noise(0.7, { vol: 0.32, freq: 260 }); noise(0.35, { vol: 0.2, freq: 1400 }); tone(110, 0.6, { type: 'sine', vol: 0.3, slide: 30 }); tone(60, 0.5, { type: 'triangle', vol: 0.2, slide: 25 }); },
    zap: () => { tone(1800, 0.35, { type: 'sawtooth', vol: 0.07, slide: 120 }); noise(0.25, { vol: 0.12, freq: 3000 }); },
    vortex: () => { tone(80, 1.4, { type: 'sawtooth', vol: 0.12, slide: 30, filter: 500 }); tone(900, 1.2, { type: 'sine', vol: 0.06, slide: 120 }); noise(1.2, { vol: 0.08, freq: 500 }); },
    slurp: () => tone(500, 0.12, { type: 'sine', vol: 0.06, slide: 120 }),
    laser: () => tone(1500, 0.07, { type: 'square', vol: 0.035, slide: 700 }),
    combo: (n) => { const f = 523 * Math.pow(1.06, Math.min(n, 30)); tone(f, 0.12, { type: 'triangle', vol: 0.12 }); tone(f * 1.5, 0.16, { type: 'triangle', vol: 0.1, delay: 0.06 }); },
    transform: () => { tone(220, 0.5, { type: 'sawtooth', vol: 0.1, slide: 1760, filter: 2500 }); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: 'square', vol: 0.07, delay: 0.25 + i * 0.05 })); noise(0.4, { vol: 0.08, freq: 4000 }); },
    guyLost: () => { tone(660, 0.12, { type: 'square', vol: 0.1 }); tone(440, 0.12, { type: 'square', vol: 0.1, delay: 0.12 }); tone(220, 0.3, { type: 'square', vol: 0.1, delay: 0.24, slide: 110 }); }
  };

  // ---------------- background music (synth loop, plays during action scenes) ----------------
  const M = (MB.music = { on: false, timer: null, next: 0, step: 0, gain: null });
  const S16 = 60 / 124 / 4;
  const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]; // Am F C G
  const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
  M.set = function (want) { if (want && !M.on) M.start(); else if (!want && M.on) M.stop(); };
  M.start = function () {
    if (!A.ctx || A.ctx.state !== 'running') return;
    if (!M.gain) { M.gain = A.ctx.createGain(); M.gain.gain.value = 0.35; M.gain.connect(A.master); }
    M.on = true; M.next = A.ctx.currentTime + 0.06;
    clearInterval(M.timer); M.timer = setInterval(M.tick, 25);
  };
  M.stop = function () { M.on = false; clearInterval(M.timer); };
  M.tick = function () {
    if (!A.ctx) return;
    if (M.next < A.ctx.currentTime) M.next = A.ctx.currentTime + 0.02;
    while (M.next < A.ctx.currentTime + 0.12) { M.play(M.step, M.next); M.next += S16; M.step = (M.step + 1) % 64; }
  };
  M.play = function (s, t) {
    if (A.muted) return;
    const ch = PROG[Math.floor(s / 16)], b = s % 16, d = M.gain;
    if (b % 4 === 0) tone(150, 0.16, { type: 'sine', vol: 0.32, slide: 40, at: t, dest: d });
    if (b % 4 === 2) noise(0.05, { vol: 0.09, freq: 7000, at: t, dest: d });
    if (b === 4 || b === 12) noise(0.12, { vol: 0.12, freq: 1800, at: t, dest: d });
    if (b % 2 === 0) tone(mf(ch[0] - 24 + (b % 4 === 2 ? 12 : 0)), S16 * 1.7, { type: 'sawtooth', vol: 0.09, at: t, dest: d, filter: 700 });
    const arp = [0, 1, 2, 1, 0, 2, 1, 2];
    tone(mf(ch[arp[b % 8]] + 12 + (b >= 8 ? 12 : 0)), S16 * 0.9, { type: 'square', vol: 0.025, at: t, dest: d, filter: 3000 });
  };

  // ---------------- canvas & stage sizing ----------------
  const cv = MB.$('cv'), stage = MB.$('stage');
  const ctx = (MB.ctx = cv.getContext('2d'));
  MB.view = { scale: 1, f: 1 };
  MB.resize = function () {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / W, vh / H);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const f = Math.min(s * dpr, 2);
    stage.style.width = Math.round(W * s) + 'px';
    stage.style.height = Math.round(H * s) + 'px';
    cv.width = Math.round(W * f); cv.height = Math.round(H * f);
    MB.view.scale = s; MB.view.f = f;
    const r = stage.getBoundingClientRect();
    MB.view.left = r.left; MB.view.top = r.top;
    const mgb = MB.$('mgButtons');
    mgb.style.right = Math.max(10, vw - r.right + 10) + 'px';
    mgb.style.bottom = Math.max(10, vh - r.bottom + 10) + 'px';
  };
  window.addEventListener('resize', MB.resize);
  window.addEventListener('orientationchange', () => setTimeout(MB.resize, 200));

  // ---------------- input ----------------
  const input = (MB.input = { x: W / 2, y: H * 0.8, down: false, keys: {}, usedPointer: false, tapped: false, lassoTap: false });
  function toLogical(e) {
    const r = stage.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  }
  stage.addEventListener('pointerdown', (e) => {
    A.init();
    const p = toLogical(e);
    input.x = p.x; input.y = p.y; input.down = true; input.usedPointer = true; input.tapped = true;
    input.pointerType = e.pointerType;
    if (e.button === 2) input.lassoTap = true;
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    if (MB.scene && MB.scene.onTap) MB.scene.onTap(p.x, p.y, e);
    e.preventDefault();
  });
  stage.addEventListener('pointermove', (e) => {
    const p = toLogical(e);
    input.x = p.x; input.y = p.y; input.usedPointer = true; input.lastMove = performance.now();
  });
  const up = () => { input.down = false; };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('keydown', (e) => {
    A.init();
    input.keys[e.key] = true;
    if (MB.onKey) MB.onKey(e);
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key) && MB.scene && MB.scene.active) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { input.keys[e.key] = false; });
  document.addEventListener('pointerdown', () => A.init(), { capture: true });
  MB.keyAxis = function (neg, pos) {
    const k = input.keys;
    return (pos.some((x) => k[x]) ? 1 : 0) - (neg.some((x) => k[x]) ? 1 : 0);
  };

  // ---------------- photos: thumbnails + full images ----------------
  const photos = (MB.photos = []);
  function placeholder(i, w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const hue = (i * 37) % 360;
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, 'hsl(' + hue + ',70%,35%)'); gr.addColorStop(1, 'hsl(' + ((hue + 60) % 360) + ',70%,18%)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 ' + Math.round(h * 0.38) + 'px Trebuchet MS, sans-serif';
    g.fillText(String(i + 1).padStart(2, '0'), w / 2, h * 0.45);
    g.font = '700 ' + Math.round(h * 0.06) + 'px Trebuchet MS, sans-serif';
    g.fillText('Missing photo: ' + C.photos[i].file, w / 2, h * 0.8);
    return c;
  }
  MB.placeholder = placeholder;
  function makeThumb(src, maxW) {
    const sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    const k = Math.min(1, maxW / sw);
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(sw * k)); c.height = Math.max(1, Math.round(sh * k));
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return c;
  }
  for (let i = 0; i < 50; i++) photos[i] = { i, thumb: null, ok: null, w: 4, h: 3, waiters: [] };
  // Where to look for a photo: the path in content.js (e.g. photos/07.jpg), and, in case the
  // folder got flattened when uploading to a website, just the file name (07.jpg) next to index.html.
  function photoSrcs(i) {
    const f = String(C.photos[i].file), base = f.split('/').pop();
    if (photos[i].src) return [photos[i].src];
    return base && base !== f ? [f, base] : [f];
  }
  // load one photo; cb(imgOrCanvas)
  MB.loadFull = function (i, cb) {
    const p = photos[i], srcs = photoSrcs(i);
    let k = 0;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      p.ok = true; p.src = srcs[k]; p.w = img.naturalWidth; p.h = img.naturalHeight;
      if (!p.thumb) p.thumb = makeThumb(img, 360);
      cb && cb(img);
    };
    img.onerror = () => {
      if (++k < srcs.length) { img.src = srcs[k]; return; }
      p.ok = false; p.w = 4; p.h = 3;
      const ph = placeholder(i, 1200, 900);
      if (!p.thumb) p.thumb = makeThumb(ph, 360);
      cb && cb(ph);
    };
    img.src = srcs[0];
  };
  // Sequential background thumbnail loading (keeps memory low with big phone photos)
  let thumbQueue = [];
  let loadingThumb = false;
  function pumpThumbs() {
    if (loadingThumb || !thumbQueue.length) return;
    const i = thumbQueue.shift();
    if (photos[i].thumb) { pumpThumbs(); return; }
    loadingThumb = true;
    MB.loadFull(i, () => {
      loadingThumb = false;
      const w = photos[i].waiters; photos[i].waiters = [];
      w.forEach((f) => f(photos[i].thumb));
      pumpThumbs();
    });
  }
  MB.queueThumbs = function (list, front) {
    thumbQueue = front ? list.concat(thumbQueue) : thumbQueue.concat(list);
    pumpThumbs();
  };
  MB.whenThumb = function (i, cb) {
    if (photos[i].thumb) cb(photos[i].thumb);
    else { photos[i].waiters.push(cb); MB.queueThumbs([i], true); }
  };
  // A canvas element showing the photo thumbnail (for album/collage)
  MB.thumbEl = function (i) {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 240;
    const draw = (t) => {
      c.width = t.width; c.height = t.height;
      c.getContext('2d').drawImage(t, 0, 0);
    };
    MB.whenThumb(i, draw);
    return c;
  };
  // A full-size element for the viewer / clear screen
  MB.fullEl = function (i) {
    const img = new Image();
    img.alt = 'Memory ' + (i + 1);
    const srcs = photoSrcs(i);
    let k = 0;
    img.onerror = () => {
      if (++k < srcs.length) { img.src = srcs[k]; return; }
      const ph = placeholder(i, 1200, 900);
      if (img.parentNode) img.parentNode.replaceChild(ph, img);
    };
    img.src = srcs[0];
    return img;
  };
  // Draw image "contain" inside a box, with a dimmed "cover" fill behind
  MB.drawPhotoBox = function (g, img, x, y, w, h) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    g.save();
    g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = '#000'; g.fillRect(x, y, w, h);
    const cs = Math.max(w / iw, h / ih);
    g.globalAlpha = 0.4;
    g.drawImage(img, x + (w - iw * cs) / 2, y + (h - ih * cs) / 2, iw * cs, ih * cs);
    g.globalAlpha = 1;
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x, y, w, h);
    const s = Math.min(w / iw, h / ih);
    g.drawImage(img, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
    g.restore();
  };

  // ---------------- particles ----------------
  MB.particles = [];
  MB.burst = function (x, y, color, n, speed, size) {
    const P = MB.particles;
    for (let k = 0; k < n; k++) {
      if (P.length > 500) P.shift();
      const a = Math.random() * Math.PI * 2, v = (speed || 220) * (0.3 + Math.random());
      P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, max: 0.4 + Math.random() * 0.5, color, size: (size || 3) * (0.6 + Math.random() * 0.8) });
    }
  };
  MB.updateParticles = function (dt) {
    const P = MB.particles;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.vx *= 0.985;
      if (p.life >= p.max) P.splice(i, 1);
    }
  };
  MB.drawParticles = function (g) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of MB.particles) {
      g.globalAlpha = 1 - p.life / p.max;
      g.fillStyle = p.color;
      g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    g.restore();
  };

  // ---------------- background ----------------
  const stars = [];
  for (let i = 0; i < 120; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: Math.random() * 0.8 + 0.2, t: Math.random() * 6 });
  MB.drawBackground = function (g, t, speed) {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#0b0526'); gr.addColorStop(0.6, '#07041a'); gr.addColorStop(1, '#14052a');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // perspective grid at the bottom
    g.save();
    g.strokeStyle = 'rgba(168,107,255,.13)'; g.lineWidth = 1;
    const off = ((t * 30) % 40);
    for (let y = H - 260; y < H; y += 40) { g.beginPath(); g.moveTo(0, y + off * ((y - (H - 260)) / 260)); g.lineTo(W, y + off * ((y - (H - 260)) / 260)); g.stroke(); }
    for (let x = -W; x < 2 * W; x += 64) { g.beginPath(); g.moveTo(W / 2 + (x - W / 2) * 0.25, H - 260); g.lineTo(x, H); g.stroke(); }
    g.restore();
    for (const s of stars) {
      s.y += (speed || 6) * s.z * 0.016 * 4;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      const a = 0.35 + 0.35 * Math.sin(t * 2 + s.t);
      g.fillStyle = 'rgba(255,255,255,' + a * s.z + ')';
      g.fillRect(s.x, s.y, 1.6 * s.z + 0.4, 1.6 * s.z + 0.4);
    }
  };

  MB.neonText = function (g, text, x, y, size, color, align) {
    g.save();
    g.font = '900 ' + size + 'px Trebuchet MS, Segoe UI, sans-serif';
    g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = size * 0.5;
    g.fillStyle = color; g.fillText(text, x, y);
    g.shadowBlur = 0; g.fillStyle = '#fff'; g.globalAlpha = 0.85; g.fillText(text, x, y);
    g.restore();
  };
  MB.roundRect = function (g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  };

  // ---------------- scene loop ----------------
  // A scene is { update(dt), draw(g, t), active, onTap? }. Ambient scene runs behind menus.
  MB.time = 0;
  MB.ambient = {
    update(dt) { MB.updateParticles(dt); },
    draw(g, t) { MB.drawBackground(g, t, 10); MB.drawParticles(g); }
  };
  MB.scene = MB.ambient;
  MB.setScene = function (s) { MB.scene = s || MB.ambient; MB.particles.length = 0; MB.$('pauseBtn').style.display = MB.scene.pausable ? 'flex' : 'none'; };
  MB.paused = false;
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    MB.time += dt;
    const sc = MB.scene;
    if (!MB.paused && !MB.manualStep) sc.update(dt);
    M.set(!!sc.music && !MB.paused && !document.hidden);
    const f = MB.view.f;
    ctx.setTransform(f, 0, 0, f, 0, 0);
    sc.draw(ctx, MB.time);
    requestAnimationFrame(frame);
  }
  MB.start = function () { MB.resize(); requestAnimationFrame(frame); };

  // ---------------- screens ----------------
  MB.show = function (id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
  };
  MB.hideScreens = function () { document.querySelectorAll('.screen').forEach((s) => s.classList.remove('show')); };
  MB.toast = function (msg, ms) {
    const t = MB.$('toast'); t.textContent = msg; t.style.display = 'block';
    clearTimeout(MB._toastT); MB._toastT = setTimeout(() => (t.style.display = 'none'), ms || 2200);
  };
})();
