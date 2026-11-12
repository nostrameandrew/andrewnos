/* Memory Breakout: the brick-breaker with a photo hidden behind the bricks */
(function () {
  'use strict';
  const MB = window.MB, W = MB.W, H = MB.H;
  const COLS = 12, ROWS = 12;
  const RX = 0, RY = 56, RW = 640, RH = 432; // photo / brick region
  const CW = RW / COLS, CH = RH / ROWS;
  const PY = 820; // paddle y
  const BR = 9;   // ball radius
  const MAX_GUYS = 7;

  // ---------------- brick layouts (12 wide; '#' brick, 'X' tough/gold brick) ----------------
  const S = {
    rows: ['', '', '############', '#X########X#', '############', '############'],
    heart: ['', '..##....##..', '.####..####.', '############', '####XXXX####', '############', '.##########.', '..########..', '...######...', '....####....', '.....XX.....'],
    pyramid: ['', '', '.....XX.....', '....####....', '...######...', '..########..', '.##########.', '############', 'XXXXXXXXXXXX'],
    smiley: ['...######...', '..########..', '.##########.', '.##X####X##.', '.##X####X##.', '.##########.', '.#X######X#.', '.##XXXXXX##.', '..########..', '...######...'],
    star: ['.....XX.....', '.....##.....', '....####....', 'XX########XX', '.##########.', '..########..', '...######...', '..###XX###..', '.###....###.', '.##......##.'],
    checker: ['', '#.#.#.#.#.#.', '.#.#.#.#.#.#', '#.#.X.X.#.#.', '.#.#.#.#.#.#', '#.#.#.#.#.#.', '.#.X.#.#.X.#', '#.#.#.#.#.#.', '.#.#.#.#.#.#'],
    diamond: ['.....##.....', '....####....', '...######...', '..###XX###..', '.###XXXX###.', '..###XX###..', '...######...', '....####....', '.....##.....'],
    dad: ['', '##...#...##.', '##...#...##.', '#.#.#.#..#.#', '#.#.#.#..#.#', '#.#.###..#.#', '#.#.#X#..#.#', '#.#.#.#..#.#', '##..#.#..##.', '##..#.#..##.'],
    rainbow: ['', '...XXXXXX...', '.##########.', '##........##', '#..######..#', '#.##....##.#', '#.#..XX..#.#', '#.#.#..#.#.#'],
    cake: ['..X..XX..X..', '..#..##..#..', '..#..##..#..', '.XXXXXXXXXX.', '.##########.', '.#X##X##X##.', '.##########.', '############', '############', 'XXXXXXXXXXXX'],
    invader: ['', '..#......#..', '...#....#...', '..########..', '.##X####X##.', '############', '#.########.#', '#.#......#.#', '...##..##...'],
    zigzag: ['', '##....##....', '.##..####..#', '..####..####', 'X..##....##.', '##....##....', '.##..####..#', '..####..####', 'X..##....##.'],
    crown: ['', '#....XX....#', '##..####..##', '###.####.###', '############', '#X###XX###X#', '############', '############', 'XXXXXXXXXXXX'],
    balloon: ['...######...', '..########..', '.##########.', '.###X##X###.', '.##########.', '.##########.', '..########..', '...######...', '.....XX.....', '.....#......', '......#.....'],
    frame: ['############', '#X........X#', '#.########.#', '#.#......#.#', '#.#.XXXX.#.#', '#.#.XXXX.#.#', '#.#......#.#', '#.########.#', '#X........X#', '############'],
    house: ['.....XX.....', '....####....', '...######...', '..########..', '.##########.', 'XXXXXXXXXXXX', '.##.####.##.', '.##.#..#.##.', '.####..####.', '.####..####.'],
    waves: ['', '##........##', '.##......##.', '..###XX###..', '....####....', '##........##', '.##......##.', '..###XX###..', '....####....'],
    trophy: ['############', 'X.########.X', '#.########.#', '.#.######.#.', '...##XX##...', '....####....', '.....##.....', '.....##.....', '...######...', '..XXXXXXXX..'],
    hexagon: ['', '....####....', '...######...', '..###XX###..', '.###X##X###.', '.###X##X###.', '..###XX###..', '...######...', '....####....'],
    columns: ['', '##.##..##.##', '##.##..##.##', 'XX.XX..XX.XX', '##.##..##.##', '##.##..##.##', '##.##..##.##', 'XX.XX..XX.XX'],
    cross: ['', '##........##', '.##......##.', '..##....##..', '...##XX##...', '....XXXX....', '...##XX##...', '..##....##..', '.##......##.', '##........##'],
    mushroom: ['...######...', '.##########.', '###X####X###', '##XX####XX##', '############', '.##########.', '...#....#...', '...######...', '...######...', '....####....'],
    football: ['', '', '...######...', '.##########.', '###X#X#X#X##', '##XXXXXXXXX#', '###X#X#X#X##', '.##########.', '...######...'],
    fifty: ['', '#####..####.', '#####.######', '##....##..##', '####..##..##', '#####.##..##', '...##.##XX##', '...##.##XX##', '#####.######', '####...####.', '', 'XXXXXXXXXXXX'],
    rocket: ['.....##.....', '....####....', '....#XX#....', '....####....', '....#XX#....', '....####....', '...######...', '..##.##.##..', '.##..##..##.', '.....XX.....'],
    note: ['', '....########', '....########', '....#......#', '....#......#', '....#......#', '..XX#....XX#', '.XXXX...XXXX', '.XXXX...XXXX', '..XX.....XX.'],
    bike: ['', '.......XX...', '..##...#....', '...#..####..', '...##.#..#..', '.####.#.####', '#..#.#.##..#', '#.X#.#.#.X.#', '#..#...#...#', '.##.....###.']
  };
  const ORDER = [
    'rows', 'heart', 'pyramid', 'smiley', 'star', 'checker', 'diamond', 'dad', 'rainbow', 'cake',
    'invader', 'heart', 'zigzag', 'crown', 'balloon', 'frame', 'star', 'house', 'waves', 'trophy',
    'hexagon', 'heart', 'columns', 'cake', 'cross', 'smiley', 'note', 'diamond', 'star', 'fifty',
    'mushroom', 'rainbow', 'heart', 'crown', 'checker', 'balloon', 'cake', 'zigzag', 'rocket', 'trophy',
    'hexagon', 'heart', 'mushroom', 'star', 'house', 'bike', 'cake', 'crown', 'football', 'fifty'
  ];
  MB.layoutName = (li) => ORDER[li];

  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Special bricks:
  //  mega   - a huge 2x2 block that goes off in a giant explosion
  //  bomb   - explodes and takes out its neighbours (chain reactions!)
  //  row    - row blaster: a laser wipes out its whole row
  //  vortex - opens a black hole that sucks nearby bricks into it
  // Endless Mode layouts: a random symmetric pattern
  function genLayout(rnd) {
    const rows = 6 + Math.floor(rnd() * 5), dens = 0.5 + rnd() * 0.35, out = [];
    for (let r = 0; r < rows; r++) {
      if (rnd() < 0.12) { out.push(''); continue; }
      let half = '';
      for (let c = 0; c < 6; c++) half += rnd() < dens ? (rnd() < 0.1 ? 'X' : '#') : '.';
      out.push(half + half.split('').reverse().join(''));
    }
    return out;
  }
  // ex (Endless Mode only): { seed, diff, round }
  function buildBricks(li, ex) {
    const rnd = rng(ex ? ex.seed : li * 7919 + 17);
    let map = S[ORDER[li]];
    if (ex) {
      const names = Object.keys(S);
      map = rnd() < 0.5 ? S[names[Math.floor(rnd() * names.length)]] : genLayout(rnd);
      if (map.join('').replace(/\./g, '').length < 30) map = genLayout(rnd).concat(genLayout(rnd)).slice(0, 11);
    }
    const d = ex ? ex.diff : li; // difficulty level
    const off = Math.floor((ROWS - map.length) / 4);
    const baseHue = ex ? Math.floor(rnd() * 360) : (li * 47 + 300) % 360;
    let bricks = [];
    const grid = [];
    for (let r = 0; r < ROWS; r++) grid.push(Array(COLS).fill(null));
    map.forEach((line, mr) => {
      const r = mr + off;
      for (let c = 0; c < COLS; c++) {
        const ch = line[c];
        if (ch !== '#' && ch !== 'X') continue;
        const tough = ch === 'X';
        let hp = tough && d >= 10 ? 2 : 1; // gentle: never more than 2 hits
        if (ex && !tough && ex.round >= 8 && mr < 2) hp = 2;
        const b = { r, c, rs: 1, cs: 1, x: RX + c * CW, y: RY + r * CH, w: CW, h: CH, hp, max: hp,
          kind: tough ? 'tough' : 'normal', hue: tough ? 48 : (baseHue + mr * 24) % 360, alive: true, flash: 0, reveal: 0, pop: 0 };
        bricks.push(b); grid[r][c] = b;
      }
    });
    // huge 2x2 mega bricks
    const megaN = d < 10 ? 1 : 2;
    for (let n = 0; n < megaN; n++) {
      const cand = [];
      for (let r = 0; r < ROWS - 1; r++) for (let c = 0; c < COLS - 1; c++) {
        const cells = [grid[r][c], grid[r][c + 1], grid[r + 1][c], grid[r + 1][c + 1]];
        if (cells.every((k) => k && k.rs === 1 && (k.kind === 'normal' || k.kind === 'tough'))) cand.push([r, c, cells]);
      }
      if (!cand.length) break;
      const [r, c, cells] = cand[Math.floor(rnd() * cand.length)];
      bricks = bricks.filter((k) => !cells.includes(k));
      const m = { r, c, rs: 2, cs: 2, x: RX + c * CW, y: RY + r * CH, w: CW * 2, h: CH * 2, hp: 3, max: 3, kind: 'mega', hue: 320, alive: true, flash: 0, reveal: 0, pop: 0 };
      bricks.push(m);
      grid[r][c] = grid[r][c + 1] = grid[r + 1][c] = grid[r + 1][c + 1] = m;
    }
    const assign = (kind, n) => {
      for (let i = 0; i < n; i++) {
        const pool = bricks.filter((b) => b.kind === 'normal');
        if (!pool.length) return;
        const b = pool[Math.floor(rnd() * pool.length)];
        b.kind = kind; b.hp = b.max = 1;
      }
    };
    assign('bomb', 3 + Math.floor(Math.min(d, 60) / 12));
    assign('row', 2);
    assign('vortex', 1);
    return { bricks, grid };
  }
  MB.buildBricks = buildBricks;

  // ---------------- brick sprites (pre-rendered glow) ----------------
  const KIND_HUE = { bomb: 8, row: 185, vortex: 275, mega: 320 };
  const spriteCache = {};
  function brickSprite(k) {
    const key = k.kind + '|' + k.hue + '|' + k.hp + '|' + k.max + '|' + k.w;
    if (spriteCache[key]) return spriteCache[key];
    const q = 2, pad = 8, bw = k.w, bh = k.h;
    const c = document.createElement('canvas');
    c.width = (bw + pad * 2) * q; c.height = (bh + pad * 2) * q;
    const g = c.getContext('2d'); g.scale(q, q);
    const x = pad + 2.5, y = pad + 2.5, w = bw - 5, h = bh - 5;
    const hue = KIND_HUE[k.kind] != null ? KIND_HUE[k.kind] : k.hue;
    g.shadowColor = 'hsl(' + hue + ',100%,60%)'; g.shadowBlur = k.kind === 'mega' ? 16 : 9;
    MB.roundRect(g, x, y, w, h, k.kind === 'mega' ? 12 : 6);
    const gr = g.createLinearGradient(0, y, 0, y + h);
    if (k.kind === 'tough') { gr.addColorStop(0, '#fff6c2'); gr.addColorStop(0.45, 'hsl(45,100%,58%)'); gr.addColorStop(1, 'hsl(30,100%,40%)'); }
    else if (k.kind === 'mega') { gr.addColorStop(0, '#ffd84a'); gr.addColorStop(0.5, '#ff3fa4'); gr.addColorStop(1, '#7a1cff'); }
    else if (k.kind === 'vortex') { gr.addColorStop(0, '#b77bff'); gr.addColorStop(1, '#1a0640'); }
    else if (k.kind === 'bomb') { gr.addColorStop(0, '#ff9a5a'); gr.addColorStop(1, '#c0102a'); }
    else if (k.kind === 'row') { gr.addColorStop(0, '#b8fbff'); gr.addColorStop(1, '#0a8fb0'); }
    else { gr.addColorStop(0, 'hsl(' + hue + ',100%,72%)'); gr.addColorStop(1, 'hsl(' + hue + ',95%,' + (k.hp > 1 ? 30 : 42) + '%)'); }
    g.fillStyle = gr; g.fill();
    g.shadowBlur = 0;
    g.lineWidth = k.kind === 'mega' ? 3 : 2; g.strokeStyle = 'rgba(255,255,255,.7)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)'; MB.roundRect(g, x + 4, y + 3, w - 8, Math.min(12, h * 0.28), 4); g.fill();
    const cx = x + w / 2, cy = y + h / 2;
    g.lineCap = 'round';
    if (k.kind === 'bomb') {
      g.fillStyle = '#1a0610'; g.beginPath(); g.arc(cx, cy + 2, 9, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#ffe9a0'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 5, cy - 5); g.quadraticCurveTo(cx + 9, cy - 12, cx + 13, cy - 10); g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(cx - 3, cy - 1, 2, 0, 7); g.fill();
    } else if (k.kind === 'row') {
      g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx - 15, cy); g.lineTo(cx + 15, cy); g.stroke();
      g.fillStyle = '#fff';
      g.beginPath(); g.moveTo(cx - 20, cy); g.lineTo(cx - 12, cy - 6); g.lineTo(cx - 12, cy + 6); g.fill();
      g.beginPath(); g.moveTo(cx + 20, cy); g.lineTo(cx + 12, cy - 6); g.lineTo(cx + 12, cy + 6); g.fill();
    } else if (k.kind === 'vortex') {
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(cx, cy, 4 + i * 4, i * 2, i * 2 + 3.6); g.stroke(); }
      g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, 3, 0, 7); g.fill();
    } else if (k.kind === 'mega') {
      g.fillStyle = '#fff'; g.font = '900 20px Trebuchet MS, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = '#000'; g.shadowBlur = 6; g.fillText('MEGA', cx, cy - 4); g.shadowBlur = 0;
      g.font = '700 10px Trebuchet MS, sans-serif'; g.fillText('★ BOOM ★', cx, cy + 14);
    }
    if (k.max > 1) {
      if (k.hp < k.max) {
        g.strokeStyle = 'rgba(20,0,30,.75)'; g.lineWidth = 1.6; g.beginPath();
        g.moveTo(x + w * 0.3, y + 2); g.lineTo(x + w * 0.45, y + h * 0.5); g.lineTo(x + w * 0.35, y + h - 2);
        if (k.hp < k.max - 1) { g.moveTo(x + w * 0.7, y + 2); g.lineTo(x + w * 0.6, y + h * 0.55); g.lineTo(x + w * 0.75, y + h - 2); }
        g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,.95)';
      const py = k.kind === 'mega' ? y + h - 9 : y + h * 0.7;
      for (let i = 0; i < k.hp; i++) { g.beginPath(); g.arc(cx + (i - (k.hp - 1) / 2) * 9, py, 2.4, 0, Math.PI * 2); g.fill(); }
    }
    spriteCache[key] = c;
    return c;
  }

  // "Guys": the lives are little ball characters (and so is the ball in play)
  const GUY_HUES = [190, 320, 50, 130, 270, 20, 160];
  const SKINS = {
    fire: ['#ffb347', '#ff5a1f'], hero: ['#e8fdff', '#ff3b3b'], zombie: ['#a6e57f', '#3f8f2a'],
    giant: ['#ffd36b', '#ff8a00'], ninja: ['#4a4a72', '#9a9aff'], thunder: ['#fff79a', '#ffd000'],
    rocket: ['#f0f0ff', '#ff3b3b'], dad: ['#ffd9b8', '#ff9a5a'], football: ['#9a5a2a', '#5a2f12']
  };
  function partyHat(g, x, y, r, t) {
    g.save(); g.translate(x, y - r * 0.85); g.rotate(Math.sin(t * 8) * 0.15);
    g.fillStyle = '#ff3fa4'; g.beginPath(); g.moveTo(-r * 0.55, 0); g.lineTo(r * 0.55, 0); g.lineTo(0, -r * 1.3); g.closePath(); g.fill();
    g.fillStyle = '#ffd84a'; g.fillRect(-r * 0.4, -r * 0.45, r * 0.8, r * 0.18);
    g.beginPath(); g.arc(0, -r * 1.3, r * 0.2, 0, 7); g.fill(); g.restore();
  }
  function drawGuy(g, x, y, r, lx, ly, hue, form, t) {
    t = t || 0;
    const sk = SKINS[form];
    const body = sk ? sk[0] : hue == null ? '#e8fdff' : 'hsl(' + hue + ',100%,78%)';
    const rim = sk ? sk[1] : hue == null ? '#29f0ff' : 'hsl(' + hue + ',100%,55%)';
    const mx = lx || 0, my = ly == null ? -0.4 : ly; // where he is looking / heading
    g.save();
    if (form === 'football') {
      // a football with a face, spinning along its flight path
      g.translate(x, y); g.rotate(Math.atan2(my, mx));
      g.shadowColor = '#ffb070'; g.shadowBlur = r;
      g.fillStyle = '#8a4a1e'; g.beginPath(); g.ellipse(0, 0, r * 1.35, r * 0.85, 0, 0, 7); g.fill(); g.shadowBlur = 0;
      g.strokeStyle = '#fff'; g.lineWidth = r * 0.12;
      g.beginPath(); g.moveTo(-r * 0.5, -r * 0.05); g.lineTo(r * 0.5, -r * 0.05); g.stroke();
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * r * 0.2, -r * 0.25); g.lineTo(i * r * 0.2, r * 0.15); g.stroke(); }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(r * 0.75, -r * 0.3, r * 0.17, 0, 7); g.arc(r * 0.75, r * 0.3, r * 0.17, 0, 7); g.fill();
      g.fillStyle = '#14062e'; g.beginPath(); g.arc(r * 0.8, -r * 0.3, r * 0.08, 0, 7); g.arc(r * 0.8, r * 0.3, r * 0.08, 0, 7); g.fill();
      g.restore();
      return;
    }
    if (form === 'rocket') {
      // nose cone, fins and a flame
      const fl = 0.8 + Math.random() * 0.6;
      g.fillStyle = '#ffb000'; g.shadowColor = '#ff6a00'; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(x - mx * r * 0.6 - my * r * 0.45, y - my * r * 0.6 + mx * r * 0.45); g.lineTo(x - mx * r * (1.6 + fl), y - my * r * (1.6 + fl)); g.lineTo(x - mx * r * 0.6 + my * r * 0.45, y - my * r * 0.6 - mx * r * 0.45); g.fill();
      g.shadowBlur = 0; g.fillStyle = '#ff3b3b';
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x - mx * r * 0.3 + my * r * sd * 0.8, y - my * r * 0.3 - mx * r * sd * 0.8); g.lineTo(x - mx * r * 1.2 + my * r * sd * 1.25, y - my * r * 1.2 - mx * r * sd * 1.25); g.lineTo(x - mx * r * 0.9 + my * r * sd * 0.5, y - my * r * 0.9 - mx * r * sd * 0.5); g.fill(); }
      g.beginPath(); g.moveTo(x + mx * r * 0.7 - my * r * 0.7, y + my * r * 0.7 + mx * r * 0.7); g.lineTo(x + mx * r * 1.7, y + my * r * 1.7); g.lineTo(x + mx * r * 0.7 + my * r * 0.7, y + my * r * 0.7 - mx * r * 0.7); g.fill();
    }
    if (form === 'hero') {
      // red cape flapping behind him
      const bx = -mx, by = -my, px = -by, py = bx, flap = Math.sin(t * 25) * r * 0.5;
      g.fillStyle = '#ff2b4a'; g.shadowColor = '#ff2b4a'; g.shadowBlur = 10;
      g.beginPath(); g.moveTo(x + px * r * 0.8, y + py * r * 0.8);
      g.quadraticCurveTo(x + bx * r * 2.2 + px * (r + flap), y + by * r * 2.2 + py * (r + flap), x + bx * r * 3 + px * flap, y + by * r * 3 + py * flap);
      g.quadraticCurveTo(x + bx * r * 2.2 - px * (r - flap), y + by * r * 2.2 - py * (r - flap), x - px * r * 0.8, y - py * r * 0.8);
      g.fill(); g.shadowBlur = 0;
    }
    if (form === 'zombie') {
      // arms reaching forward
      g.strokeStyle = '#7fc95c'; g.lineWidth = r * 0.28; g.lineCap = 'round';
      for (const s of [-1, 1]) { const px = -my * s, py = mx * s; g.beginPath(); g.moveTo(x + px * r * 0.7, y + py * r * 0.7); g.lineTo(x + px * r * 0.6 + mx * r * 1.9, y + py * r * 0.6 + my * r * 1.9); g.stroke(); }
    }
    g.shadowColor = rim; g.shadowBlur = r * 1.4;
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    gr.addColorStop(0, form === 'ninja' ? '#8a8ab8' : '#fff'); gr.addColorStop(0.55, body); gr.addColorStop(1, rim);
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    g.shadowBlur = 0;
    const ex = mx * r * 0.22, ey = my * r * 0.22;
    const eyeY = y - r * 0.12 + ey;
    if (form === 'hero') { g.fillStyle = '#14062e'; g.fillRect(x - r * 0.75 + ex, eyeY - r * 0.22, r * 1.5, r * 0.44); }
    if (form === 'ninja') { g.fillStyle = '#ff2b4a'; g.fillRect(x - r, eyeY - r * 0.48, r * 2, r * 0.26);
      g.strokeStyle = '#ff2b4a'; g.lineWidth = r * 0.18; g.beginPath(); g.moveTo(x - mx * r, eyeY - r * 0.35); g.lineTo(x - mx * r * 2.2 + Math.sin(t * 20) * r * 0.4, eyeY - r * 0.1 - my * r * 1.6); g.stroke();
      g.fillStyle = '#fff'; g.fillRect(x - r * 0.65 + ex, eyeY - r * 0.12, r * 1.3, r * 0.3); }
    if (form === 'dad') {
      // cool-dad sunglasses and a mustache
      g.fillStyle = '#14062e';
      MB.roundRect(g, x - r * 0.78 + ex, eyeY - r * 0.2, r * 0.68, r * 0.42, r * 0.12); g.fill();
      MB.roundRect(g, x + r * 0.1 + ex, eyeY - r * 0.2, r * 0.68, r * 0.42, r * 0.12); g.fill();
      g.fillRect(x - r * 0.12 + ex, eyeY - r * 0.1, r * 0.24, r * 0.08);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(x - r * 0.65 + ex, eyeY - r * 0.12, r * 0.18, r * 0.08); g.fillRect(x + r * 0.23 + ex, eyeY - r * 0.12, r * 0.18, r * 0.08);
      g.fillStyle = '#6b3a1a'; g.beginPath(); g.ellipse(x - r * 0.22 + ex, y + r * 0.26 + ey, r * 0.3, r * 0.13, 0.25, 0, 7); g.ellipse(x + r * 0.22 + ex, y + r * 0.26 + ey, r * 0.3, r * 0.13, -0.25, 0, 7); g.fill();
    }
    if (form === 'thunder') { g.fillStyle = '#ffd000'; g.beginPath(); g.moveTo(x - r * 0.6, y - r * 0.75); g.lineTo(x - r * 0.25, y - r * 1.5); g.lineTo(x, y - r * 0.8); g.lineTo(x + r * 0.3, y - r * 1.6); g.lineTo(x + r * 0.65, y - r * 0.7); g.fill(); }
    // eyes
    g.fillStyle = form === 'hero' || form === 'ninja' ? '#fff' : '#14062e';
    if (form === 'dad') { /* sunglasses already on */ }
    else if (form === 'zombie') {
      g.strokeStyle = '#14062e'; g.lineWidth = Math.max(1, r * 0.13);
      const lx2 = x - r * 0.33 + ex; g.beginPath(); g.moveTo(lx2 - r * 0.14, eyeY - r * 0.14); g.lineTo(lx2 + r * 0.14, eyeY + r * 0.14); g.moveTo(lx2 + r * 0.14, eyeY - r * 0.14); g.lineTo(lx2 - r * 0.14, eyeY + r * 0.14); g.stroke();
      g.fillStyle = '#14062e'; g.beginPath(); g.arc(x + r * 0.33 + ex, eyeY, r * 0.2, 0, 7); g.fill();
    } else {
      g.beginPath(); g.ellipse(x - r * 0.33 + ex, eyeY, r * 0.15, r * (form === 'ninja' ? 0.1 : 0.22), 0, 0, 7); g.ellipse(x + r * 0.33 + ex, eyeY, r * 0.15, r * (form === 'ninja' ? 0.1 : 0.22), 0, 0, 7); g.fill();
    }
    if (form === 'giant') { g.strokeStyle = '#14062e'; g.lineWidth = Math.max(1, r * 0.1); g.beginPath(); g.moveTo(x - r * 0.55 + ex, eyeY - r * 0.42); g.lineTo(x - r * 0.15 + ex, eyeY - r * 0.28); g.moveTo(x + r * 0.55 + ex, eyeY - r * 0.42); g.lineTo(x + r * 0.15 + ex, eyeY - r * 0.28); g.stroke(); }
    // mouth
    if (form !== 'ninja') {
      g.strokeStyle = '#14062e'; g.lineWidth = Math.max(1, r * 0.12);
      g.beginPath();
      if (form === 'zombie') { g.moveTo(x - r * 0.3 + ex, y + r * 0.35 + ey); for (let i = 1; i <= 4; i++) g.lineTo(x - r * 0.3 + ex + i * r * 0.15, y + r * (i % 2 ? 0.25 : 0.42) + ey); }
      else if (form === 'giant') { g.arc(x + ex, y + r * 0.45 + ey, r * 0.28, Math.PI + 0.3, -0.3); }
      else if (form === 'dad') { g.arc(x + ex, y + r * 0.32 + ey, r * 0.22, 0.3, Math.PI - 0.3); }
      else g.arc(x + ex, y + r * 0.18 + ey, r * 0.3, 0.2, Math.PI - 0.2);
      g.stroke();
    }
    g.restore();
  }
  MB.drawGuy = drawGuy;

  const POWERS = {
    multi: { label: '×3', color: '#29f0ff', name: 'Multi-ball!', w: 3 },
    wide: { label: '↔', color: '#7dff6a', name: 'Wide paddle!', w: 2.5 },
    slow: { label: 'S', color: '#6b9dff', name: 'Slow-mo!', w: 1.2 },
    laser: { label: 'L', color: '#ff5a6e', name: 'Lasers!', w: 2.5 },
    fire: { label: 'F', color: '#ff9a2a', name: 'FIREBALL GUY! Rows explode!', w: 1.4, form: true },
    hole: { label: '◉', color: '#b77bff', name: 'Black hole!', w: 1.3 },
    life: { label: '+1', color: '#ff3fa4', name: '+1 Guy!', w: 1.1 },
    shield: { label: '▁', color: '#4dffd2', name: 'Safety net!', w: 1.3 },
    hero: { label: 'H', color: '#ff3b5c', name: 'SUPER HERO GUY! Flies through everything!', w: 1.4, form: true },
    zombie: { label: 'Z', color: '#8dff4a', name: 'ZOMBIE GUY! Bricks get infected!', w: 1.4, form: true },
    giant: { label: 'G', color: '#ffb000', name: 'GIANT GUY! Crushes everything!', w: 1.4, form: true },
    ninja: { label: 'N', color: '#b9b9ff', name: 'NINJA GUY! Throwing stars!', w: 1.4, form: true },
    thunder: { label: 'T', color: '#fff36b', name: 'THUNDER GUY! Lightning chains!', w: 1.4, form: true },
    mystery: { label: '?', color: '#ffffff', name: 'Mystery box…', w: 1.4 },
    rocket: { label: 'R', color: '#ff6a3a', name: 'ROCKET GUY! Homes in on bricks!', w: 1.3, form: true },
    dad: { label: 'D', color: '#ffb27a', name: 'DAD GUY! Dad strength + dad jokes!', w: 1.3, form: true },
    football: { label: 'TD', color: '#c98a4a', name: 'FOOTBALL GUY! Hit the top for a TOUCHDOWN!', w: 1.3, form: true },
    party: { label: '★', color: '#ff3fa4', name: 'PARTY TIME! +4 guys!', w: 1.2 },
    meteor: { label: 'M', color: '#ff7a3a', name: 'METEOR SHOWER!', w: 1.2 },
    quake: { label: 'Q', color: '#d0a060', name: 'EARTHQUAKE!', w: 0.8 },
    magnet: { label: 'U', color: '#ff4dd2', name: 'Power magnet!', w: 1.1 }
  };
  const FORMS = ['fire', 'hero', 'zombie', 'giant', 'ninja', 'thunder', 'rocket', 'dad', 'football'];
  const FORM_TIME = { fire: 7, hero: 5, zombie: 8, giant: 8, ninja: 8, thunder: 8, rocket: 6, dad: 9, football: 9 };
  const DAD_JOKES = [
    "I'm reading a book about anti-gravity. It's impossible to put down.",
    "I only know 25 letters of the alphabet. I don't know y.",
    "What do you call a fake noodle? An impasta.",
    "I used to hate facial hair, but then it grew on me.",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "Why don't skeletons fight each other? They don't have the guts."
  ];
  function pickPower(rand, guys) {
    let tot = 0;
    for (const k in POWERS) if (k !== 'life' || guys < MAX_GUYS) tot += POWERS[k].w;
    let x = rand * tot;
    for (const k in POWERS) { if (k === 'life' && guys >= MAX_GUYS) continue; x -= POWERS[k].w; if (x <= 0) return k; }
    return 'multi';
  }

  // ---------------- the scene ----------------
  // endless (optional): { round, photo, lives, score, seed } for Endless Mode
  MB.Breakout = function (li, onClear, onLost, endless) {
    const self = this;
    this.li = li; this.onClear = onClear; this.onLost = onLost;
    this.endless = endless || null;
    this.pi = endless ? endless.photo : li; // which photo is hidden behind the bricks
    this.pausable = true; this.active = true; this.music = true;
    this.speed = endless ? Math.min(370 + endless.round * 6, 560) : Math.min(350 + li * 2.4, 470);
    this.basePW = endless ? Math.max(132 - endless.round * 1.2, 104) : Math.max(136 - li * 0.3, 120);
    this.photoCanvas = null;
    this.thumb = MB.photos[this.pi].thumb;
    this.reset(true);
    MB.loadFull(this.pi, (img) => {
      const c = document.createElement('canvas');
      c.width = RW * 2; c.height = RH * 2;
      MB.drawPhotoBox(c.getContext('2d'), img, 0, 0, c.width, c.height);
      self.photoCanvas = c;
    });
  };
  const P = MB.Breakout.prototype;
  P.reset = function (first) {
    const e = this.endless;
    const { bricks, grid } = buildBricks(this.li, e ? { seed: e.seed, round: e.round, diff: 8 + e.round * 2 } : null);
    this.score = e ? e.score : 0;
    this.bricks = bricks; this.grid = grid;
    this.total = bricks.length; this.broken = 0;
    this.finaleAt = Math.max(2, Math.round(this.total * 0.1));
    this.finale = false;
    this.lives = e ? e.lives : 5;
    this.powerups = []; this.pending = []; this.shocks = []; this.beams = []; this.vortices = []; this.debris = [];
    this.texts = []; this.lasers = [];
    this.pw = this.basePW; this.pwTarget = this.basePW;
    this.px = W / 2;
    this.wideT = 0; this.slowT = 0; this.laserT = 0; this.laserCD = 0; this.shieldT = 0;
    this.form = null; this.formT = 0; this.stars = []; this.bolts = []; this.zapCD = 0;
    this.meteors = []; this.meteorQ = 0; this.meteorCD = 0; this.magnetT = 0; this.partyT = 0; this.joke = null; this.jokeCD = 0; this.pv = 0;
    this.sinceHit = 0; this.t = 0; this.combo = 0; this.shake = 0; this.flashA = 0; this.lastSnd = -1;
    this.state = 'play'; this.clearT = 0; this.reported = false;
    this.banner = first ? 2.4 : 1.2;
    this.newBall();
  };
  P.newBall = function () {
    this.balls = [{ x: this.px, y: PY - this.ballR() - 1, vx: 0, vy: 0, r: this.ballR(), held: true, trail: [] }];
  };
  P.curSpeed = function () { return this.speed * (this.slowT > 0 ? 0.65 : 1); };
  P.ballR = function () { return this.form === 'giant' ? 22 : BR; };
  P.setForm = function (f) {
    this.form = f; this.formT = FORM_TIME[f] || 7;
    const r = this.ballR();
    for (const b of this.balls) b.r = r;
    MB.sfx.transform();
    this.flashA = Math.max(this.flashA, 0.3);
    for (const b of this.balls) MB.burst(b.x, b.y, POWERS[f].color, 30, 300, 4);
  };
  P.endForm = function () {
    this.form = null; this.formT = 0;
    for (const b of this.balls) b.r = BR;
  };
  P.launch = function () {
    for (const b of this.balls) if (b.held) {
      b.held = false;
      // the guy launches the way the paddle is moving (standing still = mostly straight up)
      const a = MB.clamp(this.pv / 1400, -0.7, 0.7) + MB.rand(-0.12, 0.12);
      b.vx = Math.sin(a) * this.curSpeed(); b.vy = -Math.cos(a) * this.curSpeed();
      MB.sfx.paddle();
    }
  };
  P.onTap = function () { if (this.state === 'play') this.launch(); };
  P.say = function (text, x, y, color, size) {
    // keep it readable: skip repeats, and nudge new words down if they would land on top of another
    if (this.texts.some((t) => t.text === text && t.t < 0.5)) return;
    x = MB.clamp(x, 150, W - 150);
    for (let i = 0; i < 4; i++) if (this.texts.some((t) => t.t < 0.8 && Math.abs(t.y - y) < 30 && Math.abs(t.x - x) < 220)) y += 34;
    this.texts.push({ text, x, y, t: 0, color: color || '#fff', size: size || 24 });
    if (this.texts.length > 5) this.texts.shift();
  };

  // ---- collision helper shared by the ball and the trajectory preview ----
  P.brickAt = function (x, y, r) {
    if (y - r >= RY + RH || y + r <= RY) return null;
    const c0 = Math.floor((x - r - RX) / CW), c1 = Math.floor((x + r - RX) / CW);
    const r0 = Math.floor((y - r - RY) / CH), r1 = Math.floor((y + r - RY) / CH);
    let best = null, bestD = r * r;
    for (let rr = Math.max(0, r0); rr <= Math.min(ROWS - 1, r1); rr++)
      for (let cc = Math.max(0, c0); cc <= Math.min(COLS - 1, c1); cc++) {
        const k = this.grid[rr][cc];
        if (!k || !k.alive) continue;
        const nx = MB.clamp(x, k.x + 2, k.x + k.w - 2), ny = MB.clamp(y, k.y + 2, k.y + k.h - 2);
        const d = (x - nx) ** 2 + (y - ny) ** 2;
        if (d < bestD) { bestD = d; best = { k, nx, ny }; }
      }
    return best;
  };
  // where will the ball go? returns the path points and the x where it reaches the paddle
  P.predict = function (x, y, vx, vy, maxB, maxLen, r, pierce, stopAtBrick) {
    const sp = Math.hypot(vx, vy) || 1;
    let dx = vx / sp, dy = vy / sp, len = 0, bounces = 0, first = null;
    const pts = [x, y], step = 3;
    r = r || BR;
    while (len < maxLen) {
      x += dx * step; y += dy * step; len += step;
      let hit = false;
      if (x < r) { x = r; dx = Math.abs(dx); hit = true; }
      else if (x > W - r) { x = W - r; dx = -Math.abs(dx); hit = true; }
      if (y < RY + r) { y = RY + r; dy = Math.abs(dy); hit = true; }
      if (hit && !first) first = { x, y, k: null };
      if (!hit && !pierce) {
        const h = this.brickAt(x, y, r);
        if (h) {
          if (!first) first = { x: h.nx, y: h.ny, k: h.k };
          if (stopAtBrick) { pts.push(h.nx, h.ny); return { pts, land: null, first }; }
          const ox = x - h.nx, oy = y - h.ny;
          if (Math.abs(ox) > Math.abs(oy)) { dx = ox > 0 ? Math.abs(dx) : -Math.abs(dx); x = h.nx + Math.sign(ox || 1) * r; }
          else { dy = oy > 0 ? Math.abs(dy) : -Math.abs(dy); y = h.ny + Math.sign(oy || 1) * r; }
          hit = true;
        }
      }
      if (hit) { pts.push(x, y); if (++bounces > maxB) return { pts, land: null, first }; }
      if (dy > 0 && y >= PY - r) { pts.push(x, PY - r); return { pts, land: x, first: first || { x, y: PY - r, k: null, paddle: true } }; }
    }
    pts.push(x, y);
    return { pts, land: null, first };
  };

  P.update = function (dt) {
    const inp = MB.input;
    this.t += dt;
    if (this.banner > 0) this.banner -= dt;
    MB.updateParticles(dt);
    for (const b of this.bricks) {
      if (b.flash > 0) b.flash -= dt * 4;
      if (b.pop > 0) b.pop = Math.max(0, b.pop - dt * 6);
      if (!b.alive && b.reveal < 1) b.reveal = Math.min(1, b.reveal + dt * 2.5);
    }
    this.updateEffects(dt);
    if (this.state === 'clear') {
      this.clearT += dt;
      if (this.clearT > 1.7 && !this.reported) { this.reported = true; this.onClear && this.onClear(); }
      return;
    }
    if (this.state !== 'play') return;

    // scheduled chain-reaction destruction
    for (let i = this.pending.length - 1; i >= 0; i--) {
      const p = this.pending[i];
      if ((p.t -= dt) <= 0) {
        this.pending.splice(i, 1);
        if (p.zgen != null) { if (p.k.alive) { this.kill(p.k, 'zombie'); this.infect(p.k, p.zgen); } }
        else this.kill(p.k, 'blast');
      }
    }

    // paddle movement
    const kx = MB.keyAxis(['ArrowLeft', 'a', 'A'], ['ArrowRight', 'd', 'D']);
    if (MB.auto) {
      // test autopilot: go where the trajectory says the lowest falling ball lands
      let tgt = null, best = -1;
      for (const b of this.balls) if (!b.held && b.vy > 0 && b.y > best) { best = b.y; tgt = b; }
      if (tgt) { const pr = this.predict(tgt.x, tgt.y, tgt.vx, tgt.vy, 6, 2500, tgt.r, this.form === 'hero'); this.px = (pr.land != null ? pr.land : tgt.x) + Math.sin(this.t * 1.7) * this.pw * 0.3; }
      else if (this.powerups.length) this.px = this.powerups[0].x;
      if (this.balls.some((b) => b.held)) this.launch();
    } else if (kx) { this.px += kx * 760 * dt; this.kbMode = true; }
    else if (inp.usedPointer && (!this.kbMode || inp.lastMove > this.kbStamp)) { this.px = inp.x; this.kbMode = false; }
    if (kx) this.kbStamp = performance.now();
    this.pw += (this.pwTarget - this.pw) * Math.min(1, dt * 10);
    this.px = MB.clamp(this.px, this.pw / 2, W - this.pw / 2);
    if (dt > 0) { const v = (this.px - (this.lastPx == null ? this.px : this.lastPx)) / dt; this.pv += (v - this.pv) * Math.min(1, dt * 12); }
    this.lastPx = this.px;
    if (inp.keys[' '] || inp.keys['ArrowUp']) this.launch();

    // timers
    if (this.wideT > 0 && (this.wideT -= dt) <= 0) this.pwTarget = this.basePW;
    if (this.slowT > 0 && (this.slowT -= dt) <= 0) this.respeed();
    if (this.form && (this.formT -= dt) <= 0) this.endForm();
    if (this.shieldT > 0) this.shieldT -= dt;
    if (this.magnetT > 0) this.magnetT -= dt;
    if (this.partyT > 0) this.partyT -= dt;
    if (this.jokeCD > 0) this.jokeCD -= dt;
    if (this.joke && (this.joke.t += dt) > 4) this.joke = null;
    // meteor shower
    if (this.meteorQ > 0 && (this.meteorCD -= dt) <= 0) {
      this.meteorCD = 0.14; this.meteorQ--;
      const alive = this.bricks.filter((k) => k.alive && !k.doomed);
      const tk = alive.length ? alive[Math.floor(Math.random() * alive.length)] : null;
      const x = tk ? tk.x + tk.w / 2 : MB.rand(40, W - 40);
      this.meteors.push({ x: x + MB.rand(-60, 60), y: RY - 30, vx: MB.rand(-30, 30), tx: x, vy: 650 });
    }
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += (m.tx - m.x) * Math.min(1, dt * 3); m.y += m.vy * dt;
      const h = m.y > RY ? this.brickAt(m.x, m.y, 6) : null;
      if (h) { this.meteors.splice(i, 1); this.smallBlast(m.x, m.y, CW * 1.15); }
      else if (m.y > RY + RH + 40) this.meteors.splice(i, 1);
    }
    if (this.shieldFlash > 0) this.shieldFlash -= dt * 3;
    if (this.zapCD > 0) this.zapCD -= dt;
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const st = this.stars[i];
      st.x += st.vx * dt; st.y += st.vy * dt; st.rot += dt * 20; st.t += dt;
      const h = this.brickAt(st.x, st.y, 5);
      if (h) { this.stars.splice(i, 1); this.hitBrick(h.k, 'star'); }
      else if (st.t > 1.2 || st.x < 0 || st.x > W || st.y < RY || st.y > PY) this.stars.splice(i, 1);
    }
    for (let i = this.bolts.length - 1; i >= 0; i--) if ((this.bolts[i].t += dt) > 0.35) this.bolts.splice(i, 1);
    this.sinceHit += dt;

    // lasers
    if (this.laserT > 0) {
      this.laserT -= dt; this.laserCD -= dt;
      if (this.laserCD <= 0) {
        this.laserCD = 0.2;
        this.lasers.push({ x: this.px - this.pw / 2 + 8, y: PY - 4 }, { x: this.px + this.pw / 2 - 8, y: PY - 4 });
        MB.sfx.laser();
      }
    }
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y -= 980 * dt;
      const h = this.brickAt(l.x, l.y, 3);
      if (h) { this.lasers.splice(i, 1); this.hitBrick(h.k, 'laser'); MB.burst(l.x, l.y, '#ff5a6e', 4, 120, 2); }
      else if (l.y < RY) this.lasers.splice(i, 1);
    }

    // balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (!b) continue;
      if (b.held) { b.x = this.px; b.y = PY - b.r - 1; continue; }
      b.trail.push(b.x, b.y); if (b.trail.length > (this.form ? 40 : 18)) b.trail.splice(0, 2);
      if (this.form === 'rocket') this.home(b, dt);
      const sp = Math.hypot(b.vx, b.vy);
      const n = Math.max(1, Math.ceil((sp * dt) / 4));
      const h = dt / n;
      for (let s = 0; s < n; s++) { this.stepBall(b, h); if (this.state !== 'play') break; }
      if (this.state !== 'play') return;
      if (b.y - b.r > H) this.balls.splice(i, 1);
    }
    if (!this.balls.length) this.loseLife();

    // powerups
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += (this.magnetT > 0 ? 330 : 165) * dt; p.t += dt;
      if (this.magnetT > 0) p.x += MB.clamp(this.px - p.x, -520 * dt, 520 * dt);
      if (p.y > PY - 14 && p.y < PY + 24 && Math.abs(p.x - this.px) < this.pw / 2 + 22) { this.applyPower(p); this.powerups.splice(i, 1); }
      else if (p.y > H + 20) this.powerups.splice(i, 1);
    }

    // FINAL BLAST: when only a few bricks are left, they all go off by themselves
    const left = this.bricks.filter((k) => k.alive && !k.doomed);
    if (!this.finale && left.length > 0 && left.length <= this.finaleAt && !this.vortices.length && this.broken > 0) {
      this.finale = true;
      this.say('FINAL BLAST!', W / 2, RY + RH + 60, '#ffd84a', 40);
      MB.sfx.power();
      left.forEach((k, i) => this.schedule(k, 0.35 + i * 0.12));
    }
    if (this.broken >= this.total) this.win();
  };
  P.respeed = function () {
    const s = this.curSpeed();
    for (const b of this.balls) if (!b.held) { const m = Math.hypot(b.vx, b.vy) || 1; b.vx = (b.vx / m) * s; b.vy = (b.vy / m) * s; }
  };
  P.stepBall = function (b, h) {
    b.x += b.vx * h; b.y += b.vy * h;
    const r = b.r;
    if (b.x < r) { b.x = r; b.vx = Math.abs(b.vx); MB.sfx.wall(); }
    else if (b.x > W - r) { b.x = W - r; b.vx = -Math.abs(b.vx); MB.sfx.wall(); }
    if (b.y < RY + r) { b.y = RY + r; b.vy = Math.abs(b.vy); MB.sfx.wall(); if (this.form === 'football') this.touchdown(b.x); }
    // paddle
    if (b.vy > 0 && b.y + r >= PY && b.y - r <= PY + 16 && b.x > this.px - this.pw / 2 - r && b.x < this.px + this.pw / 2 + r) {
      const rel = MB.clamp((b.x - this.px) / (this.pw / 2), -1, 1);
      const ang = rel * 1.05;
      const s = this.curSpeed();
      b.vx = Math.sin(ang) * s; b.vy = -Math.cos(ang) * s;
      b.y = PY - r;
      MB.sfx.paddle();
      MB.burst(b.x, PY, '#29f0ff', 8, 140, 2);
      if (this.partyT > 0 && this.balls.length < 12) { const a2 = ang + MB.rand(-0.5, 0.5); this.balls.push({ x: b.x, y: b.y, vx: Math.sin(a2) * s, vy: -Math.abs(Math.cos(a2) * s), r: b.r, held: false, trail: [] }); }
      if (this.combo >= 8) this.say('NICE! ×' + this.combo, this.px, PY - 60, '#29f0ff', 22);
      this.combo = 0;
      return;
    }
    // safety net
    if (this.shieldT > 0 && b.vy > 0 && b.y + r >= PY + 34) { b.vy = -Math.abs(b.vy); b.y = PY + 34 - r; this.shieldFlash = 1; MB.sfx.paddle(); this.combo = 0; return; }
    const hit = this.brickAt(b.x, b.y, r);
    if (hit && this.form === 'hero') { this.hitBrick(hit.k, 'ball'); return; } // heroes fly straight through
    if (hit) {
      const { k, nx, ny } = hit;
      const dx = b.x - nx, dy = b.y - ny;
      if (Math.abs(dx) > Math.abs(dy)) { b.vx = dx > 0 ? Math.abs(b.vx) : -Math.abs(b.vx); b.x = nx + Math.sign(dx || 1) * r; }
      else { b.vy = dy > 0 ? Math.abs(b.vy) : -Math.abs(b.vy); b.y = ny + Math.sign(dy || 1) * r; }
      this.hitBrick(k, 'ball');
      if (this.form === 'giant') for (let i = 0; i < 6; i++) { const h2 = this.brickAt(b.x, b.y, r + 4); if (!h2) break; this.hitBrick(h2.k, 'ball'); }
      const s = Math.hypot(b.vx, b.vy);
      if (Math.abs(b.vy) < s * 0.28) { b.vy = Math.sign(b.vy || 1) * s * 0.28; const m = Math.hypot(b.vx, b.vy); b.vx *= s / m; b.vy *= s / m; }
    }
  };
  P.hitBrick = function (k, src) {
    if (!k.alive) return;
    this.sinceHit = 0;
    if (src === 'ball' && this.form) {
      const f = this.form;
      if (f === 'fire') { this.rowBlast(k.r, k.x + k.w / 2); this.kill(k, 'hit'); return; }
      if (f === 'hero' || f === 'giant') { k.flash = 1; this.shake = Math.max(this.shake, 5); this.kill(k, 'hit'); return; }
      if (f === 'zombie') { if (!k.doomed) { k.flash = 1; this.schedule(k, 0.3, 0); MB.sfx.slurp(); } return; }
      if (f === 'ninja') this.throwStars(k.x + k.w / 2, k.y + k.h / 2);
      if (f === 'thunder') this.thunder(k);
      if (f === 'rocket') { this.kill(k, 'hit'); this.smallBlast(k.x + k.w / 2, k.y + k.h / 2, CW * 1.3); return; }
      if (f === 'dad') { this.kill(k, 'hit'); this.smallBlast(k.x + k.w / 2, k.y + k.h / 2, CW * 1.25); this.tellJoke(); return; }
    }
    k.hp--; k.flash = 1; k.pop = 1;
    if (k.hp > 0) { MB.sfx.tink(); MB.burst(k.x + k.w / 2, k.y + k.h / 2, '#fff', 6, 150, 2); this.shake = Math.max(this.shake, 2); return; }
    this.kill(k, 'hit');
  };
  P.schedule = function (k, delay, zgen) {
    if (!k.alive || k.doomed) return;
    k.doomed = true;
    if (zgen != null) k.zombie = true;
    this.pending.push({ k, t: delay, zgen });
  };
  // zombie bricks crumble and infect up to two neighbours, for a few generations
  P.infect = function (k, gen) {
    MB.burst(k.x + k.w / 2, k.y + k.h / 2, '#8dff4a', 12, 200, 3);
    if (gen >= 4) return;
    const near = [];
    for (let r = k.r - 1; r <= k.r + k.rs; r++) for (let c = k.c - 1; c <= k.c + k.cs; c++) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      const n = this.grid[r][c];
      if (n && n.alive && !n.doomed && !near.includes(n)) near.push(n);
    }
    near.sort(() => Math.random() - 0.5).slice(0, 2).forEach((n) => this.schedule(n, 0.38, gen + 1));
  };
  // lightning: jumps from brick to brick
  P.thunder = function (k) {
    if (this.zapCD > 0) return;
    this.zapCD = 0.15;
    let from = { x: k.x + k.w / 2, y: k.y + k.h / 2 };
    const used = new Set([k]);
    const pts = [from.x, from.y];
    for (let i = 0; i < 4; i++) {
      let best = null, bd = 1e9;
      for (const b of this.bricks) {
        if (!b.alive || b.doomed || used.has(b)) continue;
        const d = Math.hypot(b.x + b.w / 2 - from.x, b.y + b.h / 2 - from.y);
        if (d < bd && d < 260) { bd = d; best = b; }
      }
      if (!best) break;
      used.add(best);
      from = { x: best.x + best.w / 2, y: best.y + best.h / 2 };
      pts.push(from.x, from.y);
      this.schedule(best, 0.05 + i * 0.06);
    }
    if (pts.length > 2) { this.bolts.push({ pts, t: 0 }); MB.sfx.zap(); this.shake = Math.min(20, this.shake + 4); }
  };
  P.smallBlast = function (x, y, R) {
    this.shocks.push({ x, y, r: 6, max: R * 1.2, t: 0, big: false });
    this.shake = Math.min(20, this.shake + 4);
    if (this.t - (this.lastBoom || -1) > 0.08) { this.lastBoom = this.t; MB.sfx.boom(); }
    MB.burst(x, y, '#ffb07a', 14, 260, 3);
    for (const b of this.bricks) {
      if (!b.alive || b.doomed) continue;
      const d = Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y);
      if (d < R) this.schedule(b, 0.03 + d / 900);
    }
  };
  P.home = function (b, dt) {
    let best = null, bd = 1e9;
    for (const k of this.bricks) {
      if (!k.alive || k.doomed) continue;
      const d = Math.hypot(k.x + k.w / 2 - b.x, k.y + k.h / 2 - b.y);
      if (d < bd) { bd = d; best = k; }
    }
    b.target = best;
    if (!best) return;
    const want = Math.atan2(best.y + best.h / 2 - b.y, best.x + best.w / 2 - b.x);
    const cur = Math.atan2(b.vy, b.vx), sp = Math.hypot(b.vx, b.vy);
    let d = want - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
    const a = cur + MB.clamp(d, -3.2 * dt, 3.2 * dt);
    b.vx = Math.cos(a) * sp; b.vy = Math.sin(a) * sp;
  };
  P.touchdown = function (x) {
    const c = MB.clamp(Math.floor(x / CW), 0, COLS - 1);
    this.beams.push({ x: c * CW + CW / 2, y: RY + RH / 2, t: 0, vertical: true });
    this.say('TOUCHDOWN!', x, RY + 40, '#c98a4a', 36);
    MB.sfx.win(); this.shake = Math.min(20, this.shake + 8);
    for (const b of this.bricks) if (b.alive && !b.doomed && c >= b.c && c < b.c + b.cs) this.schedule(b, 0.03 + (b.y - RY) / 1500);
  };
  P.tellJoke = function () {
    if (this.jokeCD > 0) return;
    this.jokeCD = 4.5;
    const list = (MB.C.dadJokes && MB.C.dadJokes.length) ? MB.C.dadJokes : DAD_JOKES;
    this.joke = { text: String(list[Math.floor(Math.random() * list.length)]), t: 0 };
  };
  P.throwStars = function (x, y) {
    if (this.stars.length > 24) return;
    const a0 = Math.random() * 6.28;
    for (let i = 0; i < 6; i++) { const a = a0 + i * Math.PI / 3; this.stars.push({ x, y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, rot: 0, t: 0 }); }
    MB.sfx.laser();
  };
  P.kill = function (k, cause) {
    if (!k.alive) return;
    k.alive = false; k.doomed = true; this.broken++;
    this.score += 10 + Math.min(this.combo, 50) * 2;
    const cx = k.x + k.w / 2, cy = k.y + k.h / 2;
    const hue = KIND_HUE[k.kind] != null ? KIND_HUE[k.kind] : k.hue;
    const col = 'hsl(' + hue + ',100%,65%)';
    this.combo++;
    if (this.t - this.lastSnd > 0.035) {
      this.lastSnd = this.t;
      if (this.combo >= 3) MB.sfx.combo(this.combo); else MB.sfx.brick(ROWS - 1 - k.r);
    }
    if (cause !== 'vortex') {
      MB.burst(cx, cy, col, cause === 'blast' ? 10 : 18, 260, 3.5);
      MB.burst(cx, cy, '#ffffff', 4, 180, 2);
    }
    // power-up drop
    const chance = cause === 'hit' ? (k.kind === 'tough' || k.kind === 'mega' ? 0.4 : 0.17) : 0.045;
    if (Math.random() < chance && this.powerups.length < 4 && !this.finale) {
      this.powerups.push({ x: cx, y: cy, type: pickPower(Math.random(), this.lives), t: 0 });
    }
    // specials
    if (k.kind === 'bomb') this.explode(cx, cy, CW * 1.8, false);
    else if (k.kind === 'mega') this.explode(cx, cy, CW * 3.4, true);
    else if (k.kind === 'row') this.rowBlast(k.r, cx);
    else if (k.kind === 'vortex') this.spawnVortex(cx, cy);
  };
  P.explode = function (x, y, R, big) {
    this.shocks.push({ x, y, r: 10, max: R * 1.25, t: 0, big });
    this.shake = Math.min(20, this.shake + (big ? 16 : 8));
    this.flashA = Math.max(this.flashA, big ? 0.55 : 0.22);
    (big ? MB.sfx.bigBoom : MB.sfx.boom)();
    this.say(big ? 'MEGA BOOM!' : 'BOOM!', x, y - 10, big ? '#ffd84a' : '#ff7a3a', big ? 44 : 28);
    MB.burst(x, y, '#ffd84a', big ? 60 : 26, big ? 520 : 340, big ? 6 : 4);
    MB.burst(x, y, '#ff3fa4', big ? 40 : 14, big ? 420 : 260, 4);
    for (const b of this.bricks) {
      if (!b.alive || b.doomed) continue;
      const d = Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y);
      if (d < R) this.schedule(b, 0.05 + d / 700);
    }
  };
  P.rowBlast = function (r, x) {
    this.beams.push({ y: RY + r * CH + CH / 2, x, t: 0 });
    this.shake = Math.min(20, this.shake + 6);
    MB.sfx.zap();
    this.say('ROW BLAST!', x, RY + r * CH - 6, '#29f0ff', 26);
    for (const b of this.bricks) {
      if (!b.alive || b.doomed) continue;
      if (r >= b.r && r < b.r + b.rs) this.schedule(b, 0.02 + Math.abs(b.x + b.w / 2 - x) / 1600);
    }
  };
  P.spawnVortex = function (x, y) {
    if (this.vortices.length >= 2) return;
    this.vortices.push({ x, y, t: 0, dur: 3.8, R: 0, pullT: 0.25 });
    this.shake = Math.min(20, this.shake + 6);
    MB.sfx.vortex();
    this.say('BLACK HOLE!', x, y - 50, '#b77bff', 32);
  };
  P.updateEffects = function (dt) {
    this.shake = Math.max(0, this.shake - dt * 40);
    this.flashA = Math.max(0, this.flashA - dt * 2);
    for (let i = this.shocks.length - 1; i >= 0; i--) { const s = this.shocks[i]; s.t += dt; s.r += (s.max - s.r) * Math.min(1, dt * 9); if (s.t > 0.55) this.shocks.splice(i, 1); }
    for (let i = this.beams.length - 1; i >= 0; i--) if ((this.beams[i].t += dt) > 0.45) this.beams.splice(i, 1);
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.t += dt; t.y -= 40 * dt; if (t.t > 1.2) this.texts.splice(i, 1); }
    for (let i = this.vortices.length - 1; i >= 0; i--) {
      const v = this.vortices[i];
      v.t += dt;
      const fade = v.t > v.dur - 0.5 ? Math.max(0, (v.dur - v.t) / 0.5) : 1;
      v.R = Math.min(165, 30 + v.t * 150) * fade;
      v.pullT -= dt;
      while (v.pullT <= 0 && this.state === 'play') {
        v.pullT += 0.05;
        let best = null, bd = 1e9;
        for (const b of this.bricks) {
          if (!b.alive || b.doomed) continue;
          const d = Math.hypot(b.x + b.w / 2 - v.x, b.y + b.h / 2 - v.y);
          if (d < v.R + b.w * 0.3 && d < bd) { bd = d; best = b; }
        }
        if (!best) break;
        best.doomed = true;
        this.debris.push({ k: best, vx: v.x, vy: v.y, ang: Math.atan2(best.y + best.h / 2 - v.y, best.x + best.w / 2 - v.x), dist: bd, t: 0 });
        MB.sfx.slurp();
        this.kill(best, 'vortex');
      }
      // gently swirl particles into the hole
      if (Math.random() < 0.6) { const a = Math.random() * 6.28, d = v.R; MB.particles.push({ x: v.x + Math.cos(a) * d, y: v.y + Math.sin(a) * d, vx: -Math.cos(a) * 160 - Math.sin(a) * 120, vy: -Math.sin(a) * 160 + Math.cos(a) * 120, life: 0, max: 0.6, color: '#b77bff', size: 2.5 }); }
      if (v.t >= v.dur) this.vortices.splice(i, 1);
    }
    for (let i = this.debris.length - 1; i >= 0; i--) if ((this.debris[i].t += dt) > 0.6) this.debris.splice(i, 1);
  };
  P.applyPower = function (p) {
    if (p.type === 'mystery') {
      const all = Object.keys(POWERS).filter((k) => k !== 'mystery' && k !== 'life');
      const pick = all[Math.floor(Math.random() * all.length)];
      this.say('MYSTERY…', W / 2, PY - 150, '#ffffff', 22);
      p = { type: pick, x: p.x, y: p.y };
    }
    const pw = POWERS[p.type];
    if (pw.form) { this.setForm(p.type); this.say(pw.name, W / 2, PY - 110, pw.color, 26); MB.burst(this.px, PY, pw.color, 24, 280, 3); return; }
    this.say(pw.name, W / 2, PY - 110, pw.color, 24);
    if (p.type === 'life') { this.lives = Math.min(MAX_GUYS, this.lives + 1); MB.sfx.life(); }
    else MB.sfx.power();
    if (p.type === 'wide') { this.pwTarget = this.basePW * 1.6; this.wideT = 16; }
    if (p.type === 'slow') { this.slowT = 12; this.respeed(); }
    if (p.type === 'laser') { this.laserT = 9; this.laserCD = 0; }
    if (p.type === 'shield') { this.shieldT = 15; }
    if (p.type === 'magnet') { this.magnetT = 14; }
    if (p.type === 'meteor') { this.meteorQ += 14; this.meteorCD = 0; }
    if (p.type === 'quake') {
      this.shake = 20; this.flashA = 0.4; MB.sfx.bigBoom();
      for (const k of this.bricks) if (k.alive && !k.doomed && Math.random() < 0.45) this.schedule(k, MB.rand(0.05, 0.9));
    }
    if (p.type === 'party') {
      this.partyT = 8;
      if (this.balls.some((b) => b.held)) this.launch();
      const src = this.balls[0];
      if (src) for (let i = 0; i < 4 && this.balls.length < 12; i++) { const a = MB.rand(-1, 1), s = this.curSpeed(); this.balls.push({ x: src.x, y: src.y, vx: Math.sin(a) * s, vy: -Math.abs(Math.cos(a) * s), r: this.ballR(), held: false, trail: [] }); }
      for (let i = 0; i < 6; i++) MB.burst(MB.rand(60, 580), MB.rand(300, 700), 'hsl(' + MB.rand(0, 360) + ',100%,65%)', 18, 300, 4);
    }
    if (p.type === 'hole') {
      const alive = this.bricks.filter((k) => k.alive && !k.doomed);
      if (alive.length) {
        let sx = 0, sy = 0; alive.forEach((k) => { sx += k.x + k.w / 2; sy += k.y + k.h / 2; });
        this.vortices = this.vortices.slice(0, 1);
        this.spawnVortex(sx / alive.length, sy / alive.length);
      }
    }
    if (p.type === 'multi') {
      if (this.balls.some((b) => b.held)) this.launch();
      const add = [];
      for (const b of this.balls) {
        if (this.balls.length + add.length >= 9) break;
        const s = Math.hypot(b.vx, b.vy) || this.curSpeed();
        const a = Math.atan2(b.vx, -b.vy);
        for (const d of [-0.45, 0.45]) add.push({ x: b.x, y: b.y, vx: Math.sin(a + d) * s, vy: -Math.abs(Math.cos(a + d) * s), r: this.ballR(), held: false, trail: [] });
      }
      this.balls.push(...add);
    }
    MB.burst(this.px, PY, pw.color, 24, 280, 3);
  };
  P.loseLife = function () {
    this.lives--;
    MB.sfx.guyLost();
    this.powerups = []; this.wideT = 0; this.slowT = 0; this.laserT = 0; this.shieldT = 0; this.pwTarget = this.basePW; this.combo = 0;
    this.endForm(); this.stars = []; this.magnetT = 0; this.partyT = 0; this.meteorQ = 0; this.meteors = [];
    this.shake = 10;
    MB.burst(this.px, PY, '#ff3fa4', 30, 300, 3);
    if (this.lives <= 0) {
      this.state = 'lost';
      this.balls = [];
      setTimeout(() => this.onLost && this.onLost(), 700);
    } else {
      this.say(this.lives === 1 ? 'Last guy! You got this!' : 'Lost a guy! ' + this.lives + ' left', W / 2, PY - 120, '#ff3fa4', 24);
      this.newBall();
    }
  };
  P.win = function () {
    if (this.state !== 'play') return;
    this.state = 'clear'; this.clearT = 0; this.balls = []; this.powerups = []; this.lasers = []; this.pending = []; this.stars = []; this.bolts = []; this.meteors = []; this.meteorQ = 0; this.joke = null;
    MB.sfx.clear();
    this.flashA = 0.6; this.shake = 12;
    for (let i = 0; i < 8; i++) MB.burst(MB.rand(80, 560), MB.rand(120, 420), 'hsl(' + MB.rand(0, 360) + ',100%,65%)', 30, 360, 4);
  };
  // test helper: break every brick through the normal hit path
  P.debugClear = function () { for (const k of this.bricks) while (k.alive) this.hitBrick(k, 'test'); };

  // ---------------- drawing ----------------
  function dotted(g, pts, color, alpha, dash, offset) {
    g.save();
    g.globalAlpha = alpha; g.strokeStyle = color; g.lineWidth = 2.5; g.setLineDash(dash); g.lineDashOffset = offset;
    g.shadowColor = color; g.shadowBlur = 8;
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.stroke();
    g.setLineDash([]); g.shadowBlur = 0;
    for (let i = 2; i < pts.length - 2; i += 2) { g.fillStyle = color; g.beginPath(); g.arc(pts[i], pts[i + 1], 3.5, 0, 7); g.fill(); }
    g.restore();
  }
  function landMarker(g, x, t, color) {
    g.save();
    g.strokeStyle = color; g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 14; g.lineWidth = 2.5;
    const p = 0.5 + 0.5 * Math.sin(t * 10);
    g.beginPath(); g.ellipse(x, PY + 7, 16 + p * 5, 5 + p * 2, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(x, PY - 6); g.lineTo(x - 7, PY - 18); g.lineTo(x + 7, PY - 18); g.closePath(); g.fill();
    g.restore();
  }
  // the "locked on" reticle on whatever the ball will hit next (brick, wall or paddle)
  function lockOn(g, f, t, color) {
    g.save();
    g.strokeStyle = color; g.shadowColor = color; g.shadowBlur = 12; g.lineWidth = 2.5;
    if (f.k) {
      const p = 3 + Math.sin(t * 12) * 2;
      g.strokeRect(f.k.x + 1 - p, f.k.y + 1 - p, f.k.w - 2 + p * 2, f.k.h - 2 + p * 2);
    }
    g.translate(f.x, f.y); g.rotate(t * 3);
    g.beginPath(); g.arc(0, 0, 11, 0, 7); g.stroke();
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(7, 0); g.lineTo(16, 0); g.stroke(); }
    g.restore();
  }
  P.draw = function (g, t) {
    MB.drawBackground(g, t, 4);
    if (this.partyT > 0) { g.fillStyle = 'hsla(' + ((t * 300) % 360) + ',100%,55%,.14)'; g.fillRect(0, RY + RH, W, H - RY - RH); }
    g.save();
    if (this.shake > 0.3) g.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    const prog = this.total ? this.broken / this.total : 1;
    if (this.photoCanvas) g.drawImage(this.photoCanvas, RX, RY, RW, RH);
    else if (this.thumb) MB.drawPhotoBox(g, this.thumb, RX, RY, RW, RH);
    else { g.fillStyle = '#120a30'; g.fillRect(RX, RY, RW, RH); }
    // fog over cells
    const clearing = this.state === 'clear';
    const fogA = clearing ? Math.max(0, 0.9 * (1 - prog) * (1 - this.clearT * 2)) : 0.9 * (1 - prog) + 0.04;
    g.fillStyle = '#0a0520';
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const k = this.grid[r][c];
      const x = RX + c * CW, y = RY + r * CH;
      if (!k) { if (fogA > 0.01) { g.globalAlpha = fogA; g.fillRect(x, y, CW + 0.5, CH + 0.5); } }
      else if (k.alive) { g.globalAlpha = 0.97; g.fillRect(x, y, CW + 0.5, CH + 0.5); }
      else if (k.reveal < 1) { g.globalAlpha = 1 - k.reveal; g.fillStyle = '#fff'; g.fillRect(x, y, CW + 0.5, CH + 0.5); g.fillStyle = '#0a0520'; }
    }
    g.globalAlpha = 1;
    // bricks
    for (const k of this.bricks) {
      if (!k.alive) continue;
      const sp = brickSprite(k);
      const s = 1 + k.pop * 0.12 + (k.doomed ? 0.05 * Math.sin(t * 60) : 0);
      const cx = k.x + k.w / 2, cy = k.y + k.h / 2, dw = (k.w + 16) * s, dh = (k.h + 16) * s;
      g.drawImage(sp, cx - dw / 2, cy - dh / 2, dw, dh);
      if (k.kind !== 'normal' && k.kind !== 'tough') {
        // specials pulse so they stand out
        g.globalAlpha = 0.18 + 0.18 * Math.sin(t * 6 + k.c);
        g.fillStyle = '#fff'; MB.roundRect(g, k.x + 3, k.y + 3, k.w - 6, k.h - 6, 6); g.fill();
        g.globalAlpha = 1;
      }
      if (k.zombie) { g.globalAlpha = 0.7; g.fillStyle = '#5fd13a'; MB.roundRect(g, k.x + 3 + Math.sin(t * 40) * 1.5, k.y + 3, k.w - 6, k.h - 6, 6); g.fill(); g.globalAlpha = 1; }
      if (k.flash > 0) { g.globalAlpha = k.flash * 0.7; g.fillStyle = '#fff'; g.fillRect(k.x + 3, k.y + 3, k.w - 6, k.h - 6); g.globalAlpha = 1; }
    }
    // black holes
    for (const v of this.vortices) {
      const R = Math.max(8, v.R);
      g.save();
      const gr = g.createRadialGradient(v.x, v.y, 0, v.x, v.y, R);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.35, 'rgba(10,0,25,.95)'); gr.addColorStop(0.7, 'rgba(90,30,180,.35)'); gr.addColorStop(1, 'rgba(90,30,180,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(v.x, v.y, R, 0, 7); g.fill();
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        g.strokeStyle = ['#b77bff', '#ff3fa4', '#29f0ff', '#ffd84a', '#b77bff'][i];
        g.globalAlpha = 0.55; g.lineWidth = 3 - i * 0.4; g.shadowColor = g.strokeStyle; g.shadowBlur = 12;
        const a0 = t * (5 + i) + i * 1.3, rr = R * (0.35 + i * 0.12);
        g.beginPath(); g.ellipse(v.x, v.y, rr, rr * 0.8, t * 0.5, a0, a0 + 2.4); g.stroke();
      }
      g.restore();
      g.fillStyle = '#000'; g.beginPath(); g.arc(v.x, v.y, Math.min(18, R * 0.25), 0, 7); g.fill();
    }
    // bricks being sucked in
    for (const d of this.debris) {
      const p = Math.min(1, d.t / 0.6), a = d.ang + p * 5, dist = d.dist * Math.pow(1 - p, 1.4);
      const x = d.vx + Math.cos(a) * dist, y = d.vy + Math.sin(a) * dist, s = Math.max(0.05, 1 - p);
      const sp = brickSprite(d.k);
      g.save(); g.translate(x, y); g.rotate(p * 9); g.globalAlpha = 1 - p * 0.5;
      g.drawImage(sp, -(d.k.w + 16) * s / 2, -(d.k.h + 16) * s / 2, (d.k.w + 16) * s, (d.k.h + 16) * s);
      g.restore();
    }
    // row blaster beams
    for (const b of this.beams) {
      const a = 1 - b.t / 0.45, half = Math.min(W, b.t * 3200);
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
      g.fillStyle = '#29f0ff'; g.shadowColor = '#29f0ff'; g.shadowBlur = 30;
      if (b.vertical) { g.fillStyle = '#ffd84a'; g.shadowColor = '#ffd84a'; g.fillRect(b.x - 14 * a, RY, 28 * a, RH); g.fillStyle = '#fff'; g.fillRect(b.x - 3, RY, 6, RH); }
      else { g.fillRect(b.x - half, b.y - 12 * a, half * 2, 24 * a);
      g.fillStyle = '#fff'; g.fillRect(b.x - half, b.y - 3, half * 2, 6); }
      g.restore();
    }
    // shockwaves
    for (const s of this.shocks) {
      const a = 1 - s.t / 0.55;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = s.big ? '#ffd84a' : '#ff7a3a'; g.shadowColor = g.strokeStyle; g.shadowBlur = 20;
      g.globalAlpha = a; g.lineWidth = (s.big ? 14 : 8) * a + 1;
      g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.stroke();
      g.globalAlpha = a * 0.35; g.fillStyle = s.big ? '#fff3b0' : '#ffb07a'; g.beginPath(); g.arc(s.x, s.y, s.r * 0.6, 0, 7); g.fill();
      g.restore();
    }
    // region frame
    g.save();
    const beat = 0.6 + 0.4 * Math.abs(Math.sin(t * Math.PI * 124 / 60));
    g.strokeStyle = clearing ? '#ffd84a' : 'rgba(255,63,164,' + beat + ')'; g.lineWidth = 2; g.shadowColor = clearing ? '#ffd84a' : '#ff3fa4'; g.shadowBlur = 10 + beat * 10;
    g.strokeRect(RX + 1, RY, RW - 2, RH); g.restore();

    // powerups
    for (const p of this.powerups) {
      const pw = POWERS[p.type];
      g.save(); g.translate(p.x, p.y); g.rotate(Math.sin(p.t * 5) * 0.12);
      g.shadowColor = pw.color; g.shadowBlur = 16;
      MB.roundRect(g, -24, -13, 48, 26, 13); g.fillStyle = 'rgba(10,5,30,.9)'; g.fill();
      g.lineWidth = 3; g.strokeStyle = pw.color; g.stroke();
      g.shadowBlur = 0; g.fillStyle = pw.color; g.font = '900 16px Trebuchet MS'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(pw.label, 0, 1);
      g.restore();
    }
    // lasers
    g.save(); g.fillStyle = '#ff5a6e'; g.shadowColor = '#ff5a6e'; g.shadowBlur = 12;
    for (const l of this.lasers) g.fillRect(l.x - 2, l.y - 14, 4, 22);
    g.restore();
    // paddle
    if (this.state !== 'lost') {
      g.save();
      const x = this.px - this.pw / 2;
      const mid = this.form ? POWERS[this.form].color : this.laserT > 0 ? '#ff5a6e' : this.wideT > 0 ? '#7dff6a' : '#29f0ff';
      g.shadowColor = mid; g.shadowBlur = 22;
      MB.roundRect(g, x, PY, this.pw, 15, 7.5);
      const gr = g.createLinearGradient(x, 0, x + this.pw, 0);
      gr.addColorStop(0, '#ff3fa4'); gr.addColorStop(0.5, mid); gr.addColorStop(1, '#ff3fa4');
      g.fillStyle = gr; g.fill();
      g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(x + 8, PY + 3, this.pw - 16, 3);
      if (this.laserT > 0) { g.fillStyle = '#ff5a6e'; g.fillRect(x + 4, PY - 6, 8, 8); g.fillRect(x + this.pw - 12, PY - 6, 8, 8); }
      g.restore();
    }
    // trajectory preview: where each ball is headed and where it will land
    if (this.state === 'play') {
      let shown = 0;
      for (const b of this.balls) {
        if (b.held || shown >= 5) continue;
        shown++;
        const col = this.form ? POWERS[this.form].color : '#29f0ff';
        if (this.form === 'rocket' && b.target) {
          // rockets lock straight onto the brick they are homing in on
          const k = b.target;
          dotted(g, [b.x, b.y, k.x + k.w / 2, k.y + k.h / 2], col, 0.8, [7, 8], -t * 120);
          lockOn(g, { x: k.x + k.w / 2, y: k.y + k.h / 2, k }, t, col);
          continue;
        }
        const pr = this.predict(b.x, b.y, b.vx, b.vy, 6, 2600, b.r, this.form === 'hero');
        dotted(g, pr.pts, col, 0.6, [7, 8], -t * 90);
        if (pr.first && !pr.first.paddle) lockOn(g, pr.first, t, col);
        if (pr.land != null) {
          // where will it go off the paddle *where it is right now*? updates live as you move
          const off = pr.land - this.px, reach = this.pw / 2 + b.r;
          if (Math.abs(off) <= reach) {
            const ang = MB.clamp(off / (this.pw / 2), -1, 1) * 1.05;
            const pr2 = this.predict(pr.land, PY - b.r, Math.sin(ang), -Math.cos(ang), 4, 1500, b.r, this.form === 'hero', true);
            dotted(g, pr2.pts, '#ffd84a', 0.9, [11, 7], -t * 140);
            if (pr2.first) lockOn(g, pr2.first, t, '#ffd84a');
            landMarker(g, pr.land, t, '#7dff6a');
          } else landMarker(g, pr.land, t, '#ff3b5c');
        }
      }
    }
    // balls (each ball is one of your "guys")
    g.save(); g.globalCompositeOperation = 'lighter';
    const fire = this.form === 'fire';
    const TRAIL = { hero: '255,59,92', zombie: '141,255,74', giant: '255,176,0', ninja: '185,185,255', thunder: '255,243,107', rocket: '255,140,60', dad: '255,200,160', football: '200,140,80' };
    for (const b of this.balls) {
      for (let i = 0; i < b.trail.length; i += 2) {
        const a = i / b.trail.length;
        g.fillStyle = fire ? 'rgba(255,' + Math.round(90 + a * 120) + ',30,' + a * 0.6 + ')' : 'rgba(' + (TRAIL[this.form] || '41,240,255') + ',' + a * (this.form ? 0.5 : 0.35) + ')';
        g.beginPath(); g.arc(b.trail[i], b.trail[i + 1], b.r * (this.form ? 0.5 + a * 0.8 : 0.4 + a * 0.6), 0, Math.PI * 2); g.fill();
      }
    }
    g.restore();
    for (const b of this.balls) {
      const sp = Math.hypot(b.vx, b.vy) || 1;
      drawGuy(g, b.x, b.y, b.r + 1, b.held ? 0 : b.vx / sp, b.held ? -1 : b.vy / sp, this.slowT > 0 ? 220 : null, this.form, t);
    }
    if (this.partyT > 0) for (const b of this.balls) partyHat(g, b.x, b.y, b.r + 1, t);
    // meteors
    for (const m of this.meteors) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createLinearGradient(m.x, m.y - 70, m.x, m.y);
      gr.addColorStop(0, 'rgba(255,120,40,0)'); gr.addColorStop(1, 'rgba(255,200,80,.9)');
      g.strokeStyle = gr; g.lineWidth = 10; g.lineCap = 'round'; g.beginPath(); g.moveTo(m.x, m.y - 70); g.lineTo(m.x, m.y); g.stroke();
      g.fillStyle = '#fff3c0'; g.shadowColor = '#ff7a3a'; g.shadowBlur = 20; g.beginPath(); g.arc(m.x, m.y, 8, 0, 7); g.fill();
      g.restore();
    }
    // ninja stars
    for (const st of this.stars) {
      g.save(); g.translate(st.x, st.y); g.rotate(st.rot); g.fillStyle = '#e0e0ff'; g.shadowColor = '#b9b9ff'; g.shadowBlur = 10;
      g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? 3 : 9, a = i * Math.PI / 4; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.fill();
      g.restore();
    }
    // lightning
    for (const bo of this.bolts) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - bo.t / 0.35;
      g.strokeStyle = '#fff79a'; g.shadowColor = '#ffd000'; g.shadowBlur = 18; g.lineWidth = 3;
      g.beginPath(); g.moveTo(bo.pts[0], bo.pts[1]);
      for (let i = 2; i < bo.pts.length; i += 2) {
        const x0 = bo.pts[i - 2], y0 = bo.pts[i - 1], x1 = bo.pts[i], y1 = bo.pts[i + 1];
        for (let s = 1; s <= 4; s++) { const f = s / 4; g.lineTo(x0 + (x1 - x0) * f + (s < 4 ? (Math.random() - 0.5) * 18 : 0), y0 + (y1 - y0) * f + (s < 4 ? (Math.random() - 0.5) * 18 : 0)); }
      }
      g.stroke(); g.restore();
    }
    // safety net
    if (this.shieldT > 0) {
      g.save(); const a = this.shieldT < 3 ? 0.4 + 0.4 * Math.sin(t * 20) : 0.85;
      g.globalAlpha = a + (this.shieldFlash > 0 ? this.shieldFlash * 0.4 : 0);
      g.strokeStyle = '#4dffd2'; g.shadowColor = '#4dffd2'; g.shadowBlur = 16; g.lineWidth = 4;
      g.beginPath(); g.moveTo(0, PY + 36); g.lineTo(W, PY + 36); g.stroke(); g.restore();
    }
    MB.drawParticles(g);
    // floating words
    for (const tx of this.texts) {
      g.globalAlpha = Math.min(1, (1.2 - tx.t) * 2.5);
      MB.neonText(g, tx.text, tx.x, tx.y, tx.size * (1 + Math.max(0, 0.25 - tx.t)), tx.color);
    }
    g.globalAlpha = 1;
    // dad joke speech bubble
    if (this.joke) {
      const a = Math.min(1, this.joke.t * 4, (4 - this.joke.t) * 2);
      g.save(); g.globalAlpha = a;
      g.font = '700 17px Trebuchet MS, sans-serif';
      const words = this.joke.text.split(' '), lines = [''];
      for (const w of words) { const tryL = (lines[lines.length - 1] + ' ' + w).trim(); if (g.measureText(tryL).width > 480 && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = tryL; }
      const bh = 26 + lines.length * 22, by = 540;
      g.fillStyle = 'rgba(255,248,235,.96)'; g.shadowColor = '#ffb27a'; g.shadowBlur = 20;
      MB.roundRect(g, 60, by, W - 120, bh, 16); g.fill(); g.shadowBlur = 0;
      g.beginPath(); g.moveTo(W / 2 - 12, by + bh); g.lineTo(W / 2, by + bh + 16); g.lineTo(W / 2 + 12, by + bh); g.fill();
      g.fillStyle = '#c0603a'; g.font = '800 12px Trebuchet MS'; g.textAlign = 'left'; g.fillText('DAD GUY SAYS:', 76, by + 16);
      g.fillStyle = '#2a1a10'; g.font = '700 17px Trebuchet MS, sans-serif'; g.textAlign = 'center';
      lines.forEach((l, i) => g.fillText(l, W / 2, by + 38 + i * 22));
      g.restore();
    }
    g.restore(); // end shake

    // HUD
    g.save();
    g.fillStyle = 'rgba(7,4,26,.55)'; g.fillRect(0, 0, W, 54);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = '800 16px Trebuchet MS, sans-serif'; g.fillStyle = '#f4ecff';
    g.fillText(this.endless ? '∞ ROUND ' + this.endless.round : 'LEVEL ' + (this.li + 1) + '/50', 60, 18);
    g.font = '700 13px Trebuchet MS, sans-serif'; g.fillStyle = '#ffd84a';
    g.fillText(this.endless ? 'SCORE ' + this.score.toLocaleString() + ' · ' + Math.round(prog * 100) + '%' : Math.round(prog * 100) + '% revealed', 60, 38);
    // guys (lives)
    for (let i = 0; i < this.lives; i++) drawGuy(g, W - 70 - i * 22, 22, 8.5, Math.sin(t * 2 + i) * 0.5, 0, GUY_HUES[i % GUY_HUES.length]);
    g.textAlign = 'right'; g.font = '800 11px Trebuchet MS'; g.fillStyle = '#ff9fd2';
    g.fillText(this.lives === 1 ? '1 GUY LEFT' : this.lives + ' GUYS', W - 60, 44);
    if (this.combo >= 3) {
      g.globalAlpha = 0.75 + 0.25 * Math.sin(t * 12);
      MB.neonText(g, 'COMBO ×' + this.combo, W / 2 - 20, 27, 20 + Math.min(this.combo, 30) * 0.4, '#ff3fa4');
      g.globalAlpha = 1;
    }
    // active power timers
    const act = [];
    if (this.wideT > 0) act.push(['WIDE', this.wideT, '#7dff6a']);
    if (this.slowT > 0) act.push(['SLOW', this.slowT, '#6b9dff']);
    if (this.laserT > 0) act.push(['LASER', this.laserT, '#ff5a6e']);
    if (this.form) act.push([this.form.toUpperCase() + ' GUY', this.formT, POWERS[this.form].color]);
    if (this.shieldT > 0) act.push(['NET', this.shieldT, '#4dffd2']);
    if (this.magnetT > 0) act.push(['MAGNET', this.magnetT, '#ff4dd2']);
    if (this.partyT > 0) act.push(['PARTY', this.partyT, '#ff3fa4']);
    g.font = '800 13px Trebuchet MS'; g.textAlign = 'left';
    let ax = 12; act.forEach((a) => { const txt = a[0] + ' ' + Math.ceil(a[1]) + 's'; g.fillStyle = a[2]; g.fillText(txt, ax, PY + 52); ax += g.measureText(txt).width + 16; });
    g.restore();

    if (this.balls.some((b) => b.held) && this.state === 'play' && this.banner <= 0) {
      g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4);
      MB.neonText(g, MB.input.pointerType === 'touch' ? 'Tap to launch your guy' : 'Click or press Space to launch your guy', W / 2, PY - 150, 20, '#29f0ff');
      g.globalAlpha = 1;
    }
    if (this.banner > 0) {
      g.globalAlpha = Math.min(1, this.banner);
      MB.neonText(g, this.endless ? 'ROUND ' + this.endless.round : 'LEVEL ' + (this.li + 1), W / 2, 590, 46, '#ff3fa4');
      MB.neonText(g, this.endless ? '∞ Endless Mode · Memory #' + (this.pi + 1) : MB.C.chapters[Math.floor(this.li / 10)].title, W / 2, 636, 18, '#a86bff');
      if (this.li < 3 && !this.endless) MB.neonText(g, 'Catch the letter capsules to transform your guy!', W / 2, 670, 16, '#ffd84a');
      if (this.li < 3 && !this.endless) MB.neonText(g, 'Move the paddle: the gold line shows where you will send him', W / 2, 698, 14, '#29f0ff');
      g.globalAlpha = 1;
    }
    if (this.state === 'clear') {
      g.globalAlpha = Math.min(1, this.clearT * 2);
      MB.neonText(g, 'MEMORY UNLOCKED', W / 2, 640, 40, '#ffd84a');
      g.globalAlpha = 1;
    }
    if (this.flashA > 0.01) { g.fillStyle = 'rgba(255,240,220,' + this.flashA * 0.5 + ')'; g.fillRect(0, 0, W, H); }
  };
})();
