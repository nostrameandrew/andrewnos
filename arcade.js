/* Memory Breakout: canvas bonus games (Galaxy Guard, Centipede, Memory Lane Ride) */
(function () {
  'use strict';
  const MB = window.MB, W = MB.W, H = MB.H;

  function hudBar(g, left, mid, right) {
    g.save();
    g.fillStyle = 'rgba(7,4,26,.7)'; g.fillRect(0, 0, W, 56);
    g.font = '800 17px Trebuchet MS, sans-serif'; g.textBaseline = 'middle';
    g.fillStyle = '#f4ecff'; g.textAlign = 'left'; g.fillText(left, 62, 28);
    g.textAlign = 'center'; g.fillStyle = '#ffd84a'; g.fillText(mid, W / 2, 28);
    g.textAlign = 'right'; g.fillStyle = '#29f0ff'; g.fillText(right, W - 62, 28);
    g.restore();
  }
  function endBanner(scene, g, text, color) {
    g.globalAlpha = Math.min(1, scene.endT * 2);
    MB.neonText(g, text, W / 2, H / 2, 44, color);
    g.globalAlpha = 1;
  }
  function finish(scene, win) {
    if (scene.state !== 'play') return;
    scene.state = win ? 'won' : 'lost'; scene.endT = 0;
    if (win) { MB.sfx.win(); for (let i = 0; i < 8; i++) MB.burst(MB.rand(60, 580), MB.rand(150, 700), 'hsl(' + MB.rand(0, 360) + ',100%,65%)', 25, 320, 4); }
    else MB.sfx.lose();
  }
  function tickEnd(scene, dt) {
    if (scene.state === 'play') return false;
    scene.endT += dt;
    if (scene.endT > 1.8 && !scene.reported) { scene.reported = true; scene.onEnd(scene.state === 'won'); }
    return true;
  }
  // photo indices for thumbnails used in the bonus games
  function photoSet(from, n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push((from + i) % 50);
    return out;
  }

  // =====================================================================
  // GALAXY GUARD: MEMORY DEFENSE
  // The ship sits in the middle with the memories orbiting around it.
  // Aliens fly in from every side to grab the photos.
  //  - LASSO: draw a loop (mouse drag / finger) around aliens to destroy them all.
  //  - FIRE: hold the FIRE button (or Space / F). Lasers fire faster and faster
  //    and fan out wider... until the gun overheats.
  // Story mode: survive 90 seconds as new enemies arrive (and a Mothership near the end).
  // Endless mode (opts.endless): waves forever, each one harder.
  // =====================================================================
  const GX = W / 2, GY = 470, ORBIT = 118, NSLOTS = 6;
  // enemy types
  const AT = {
    grab:    { name: 'Grabber', hp: 1, r: 19, sp: [60, 85], hue: 120, pts: 10 },
    speed:   { name: 'Speeder', hp: 1, r: 14, sp: [150, 185], hue: 30, pts: 15, zig: true, intro: 'SPEEDERS! Fast and zig-zaggy!' },
    split:   { name: 'Splitter', hp: 2, r: 22, sp: [55, 70], hue: 190, pts: 20, split: true, intro: 'SPLITTERS! They break in two!' },
    mini:    { name: 'Mini', hp: 1, r: 12, sp: [95, 120], hue: 190, pts: 5 },
    shield:  { name: 'Shielded', hp: 2, r: 20, sp: [50, 65], hue: 205, pts: 25, shield: true, intro: 'SHIELDED! Lasers bounce off. LASSO them!' },
    shooter: { name: 'Shooter', hp: 2, r: 20, sp: [65, 75], hue: 0, pts: 25, shoots: true, intro: 'SHOOTERS! Their shots jam your gun!' },
    cloak:   { name: 'Cloaker', hp: 1, r: 18, sp: [70, 90], hue: 265, pts: 25, cloak: true, intro: 'CLOAKERS! Shoot when they flicker in!' },
    tank:    { name: 'Tank', hp: 6, r: 28, sp: [34, 44], hue: 285, pts: 40, intro: 'TANKS! Heavy armor!' },
    swarm:   { name: 'Swarm', hp: 1, r: 11, sp: [80, 95], hue: 55, pts: 5, intro: 'SWARM! Lasso the whole bunch!' },
    boss:    { name: 'Mothership', hp: 30, r: 56, sp: [30, 30], hue: 320, pts: 300, boss: true, shoots: true, intro: 'MOTHERSHIP INCOMING!' }
  };
  // power-ups: shoot them or lasso them to grab them
  const GP = {
    cool:   { label: 'C', color: '#29f0ff', name: 'COOLANT! No overheating!' },
    spread: { label: 'W', color: '#ffd84a', name: 'WIDE SPREAD!' },
    bubble: { label: 'B', color: '#4dffd2', name: 'MEMORY SHIELD!' },
    nova:   { label: 'N', color: '#ff3fa4', name: 'NOVA BLAST!' },
    slow:   { label: 'T', color: '#6b9dff', name: 'TIME WARP!' },
    drones: { label: 'D', color: '#b9b9ff', name: 'DRONE BUDDIES!' },
    repair: { label: 'R', color: '#7dff6a', name: 'MEMORY RESTORED!' }
  };
  MB.Galaxy = function (onEnd, opts) {
    this.onEnd = onEnd; this.pausable = true; this.active = true; this.music = true;
    this.endless = !!(opts && opts.endless);
    this.state = 'play'; this.t = 0; this.duration = 90; this.goal = 60;
    this.kills = 0; this.score = 0;
    this.aim = -Math.PI / 2;
    this.bullets = []; this.aliens = []; this.texts = []; this.snaps = []; this.orbs = []; this.pows = [];
    this.lasso = []; this.wasDown = false;
    this.fireHeld = false; this.holdT = 0; this.fireCD = 0; this.heat = 0; this.overheat = false;
    this.coolT = 0; this.spreadT = 0; this.bubbleT = 0; this.slowT = 0; this.dronesT = 0; this.droneCD = 0; this.shake = 0; this.flashA = 0;
    this.spawnT = 1.2; this.orbitA = 0; this.seen = {}; this.bossDone = false;
    this.wave = 1; this.waveQ = 0; this.inter = 2.5; this.banner = null;
    this.slots = photoSet(10, NSLOTS).map((pid, i) => ({ pid, i, taken: false, lost: false, glow: 0, x: GX, y: GY }));
    this.slots.forEach((s) => MB.whenThumb(s.pid, () => {}));
    this.placeSlots();
    if (this.endless) this.banner = { text: 'WAVE 1', sub: 'Endless Galaxy Guard', t: 0 };
  };
  const G = MB.Galaxy.prototype;
  G.placeSlots = function () {
    for (const s of this.slots) {
      const a = this.orbitA + s.i * Math.PI * 2 / NSLOTS;
      s.x = GX + Math.cos(a) * ORBIT; s.y = GY + Math.sin(a) * ORBIT;
    }
  };
  G.say = function (text, x, y, color, size) {
    if (this.texts.some((t) => t.text === text && t.t < 0.4)) return;
    size = size || 24;
    const hw = Math.min(W / 2 - 12, text.length * size * 0.3); // keep the whole word on screen
    x = MB.clamp(x, hw + 12, W - hw - 12);
    for (let i = 0; i < 3; i++) if (this.texts.some((t) => t.t < 0.8 && Math.abs(t.y - y) < 28)) y += 30;
    this.texts.push({ text, x, y, t: 0, color, size: size || 24 });
    if (this.texts.length > 5) this.texts.shift();
  };
  G.setFire = function (on) { this.fireHeld = on; };
  // difficulty: how fast and tough enemies are right now
  G.speedMul = function () { return this.endless ? Math.min(1 + (this.wave - 1) * 0.05, 2.1) : 1 + this.t * 0.006; };
  G.hpBonus = function () { return this.endless ? Math.floor((this.wave - 1) / 6) : 0; };
  G.spawn = function (type, x, y) {
    const d = AT[type];
    if (x == null) {
      const side = Math.floor(Math.random() * 4);
      x = side === 0 ? MB.rand(20, W - 20) : side === 1 ? W + 20 : side === 2 ? MB.rand(20, W - 20) : -20;
      y = side === 0 ? 60 : side === 2 ? H + 20 : MB.rand(80, H - 20);
    }
    let hp = d.hp + (type === 'mini' || type === 'swarm' ? 0 : this.hpBonus());
    if (d.boss) hp = this.endless ? 30 + this.wave * 4 : 30;
    const a = { type, d, x, y, hp, maxHp: hp, r: d.r, speed: MB.rand(d.sp[0], d.sp[1]) * this.speedMul(), hue: d.hue, wob: Math.random() * 6, phase: Math.random() * 6, carry: null, flash: 0, fireT: MB.rand(1, 2.5), spawnT: 3 };
    this.aliens.push(a);
    if (d.intro && !this.seen[type]) { this.seen[type] = true; this.say(d.intro, W / 2, 110, d.boss ? '#ff3fa4' : '#ffd84a', d.boss ? 30 : 22); if (d.boss) MB.sfx.vortex(); }
    return a;
  };
  G.spawnGroup = function (type) {
    if (type === 'swarm') {
      const side = Math.floor(Math.random() * 4);
      const x = side === 1 ? W + 30 : side === 3 ? -30 : MB.rand(80, W - 80), y = side === 0 ? 60 : side === 2 ? H + 30 : MB.rand(120, H - 120);
      for (let i = 0; i < 6; i++) this.spawn('swarm', x + MB.rand(-35, 35), y + MB.rand(-35, 35));
    } else this.spawn(type);
  };
  function pick(list) { let tot = 0; for (const [, w] of list) tot += w; let x = Math.random() * tot; for (const [k, w] of list) { x -= w; if (x <= 0) return k; } return list[0][0]; }
  G.storyTypes = function () {
    const T = this.t, L = [['grab', 3]];
    if (T > 8) L.push(['speed', 2]);
    if (T > 18) L.push(['split', 1.5]);
    if (T > 28) L.push(['shield', 1.2]);
    if (T > 38) L.push(['shooter', 1]);
    if (T > 48) L.push(['cloak', 1]);
    if (T > 56) L.push(['tank', 0.8]);
    if (T > 62) L.push(['swarm', 0.7]);
    return L;
  };
  G.waveTypes = function () {
    const n = this.wave, L = [['grab', Math.max(1, 4 - n * 0.2)]];
    if (n >= 2) L.push(['speed', 2]);
    if (n >= 3) L.push(['split', 1.6]);
    if (n >= 4) L.push(['shield', 1 + n * 0.05]);
    if (n >= 6) L.push(['shooter', 1 + n * 0.05]);
    if (n >= 7) L.push(['cloak', 1 + n * 0.04]);
    if (n >= 8) L.push(['tank', 0.8 + n * 0.04]);
    if (n >= 9) L.push(['swarm', 0.8]);
    return L;
  };
  G.update = function (dt) {
    MB.updateParticles(dt);
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.t += dt; t.y -= 35 * dt; if (t.t > 1.4) this.texts.splice(i, 1); }
    for (let i = this.snaps.length - 1; i >= 0; i--) if ((this.snaps[i].t += dt) > 0.5) this.snaps.splice(i, 1);
    this.shake = Math.max(0, this.shake - dt * 30); this.flashA = Math.max(0, this.flashA - dt * 2);
    if (this.banner && (this.banner.t += dt) > 2.4) this.banner = null;
    if (tickEnd(this, dt)) return;
    const inp = MB.input;
    this.t += dt;
    this.orbitA += dt * 0.35;
    this.placeSlots();
    for (const s of this.slots) if (s.glow > 0) s.glow -= dt;
    for (const k of ['coolT', 'spreadT', 'bubbleT', 'slowT', 'dronesT']) if (this[k] > 0) this[k] -= dt;
    const sm = this.slowT > 0 ? 0.45 : 1;

    // ---- LASSO: draw a loop around aliens ----
    const down = MB.auto ? false : inp.down;
    if (down) {
      const last = this.lasso[this.lasso.length - 1];
      if (!last || Math.hypot(inp.x - last.x, inp.y - last.y) > 7) {
        this.lasso.push({ x: inp.x, y: inp.y, t: this.t });
        this.checkLoop();
      }
    } else if (this.wasDown && this.lasso.length > 12) {
      const a = this.lasso[0], b = this.lasso[this.lasso.length - 1];
      if (Math.hypot(a.x - b.x, a.y - b.y) < 70) this.capture(this.lasso.slice());
      this.lasso = [];
    }
    if (!down && !this.wasDown) this.lasso = [];
    this.wasDown = down;
    while (this.lasso.length && this.t - this.lasso[0].t > 1.6) this.lasso.shift();
    if (this.lasso.length > 260) this.lasso.shift();

    // ---- aim: the ship turns toward the biggest threat ----
    let target = null, td = 1e9;
    for (const a of this.aliens) {
      if (!this.visible(a)) continue;
      const d = Math.hypot(a.x - GX, a.y - GY) - (a.carry ? 400 : 0) - (a.d.shoots ? 120 : 0) + (a.d.shield ? 200 : 0);
      if (d < td) { td = d; target = a; }
    }
    if (target) {
      const want = Math.atan2(target.y - GY, target.x - GX);
      let d = want - this.aim; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      this.aim += MB.clamp(d, -9 * dt, 9 * dt);
    }

    // ---- FIRE: faster and faster, wider and wider, until it overheats ----
    if (MB.auto) this.fireHeld = !this.overheat && this.heat < 0.85 && this.aliens.length > 0;
    const keyFire = inp.keys[' '] || inp.keys['f'] || inp.keys['F'];
    const firing = (this.fireHeld || keyFire) && !this.overheat;
    if (firing) {
      this.holdT += dt;
      if (this.coolT <= 0) this.heat += dt * 0.36;
      this.fireCD -= dt;
      if (this.fireCD <= 0) {
        const wide = this.spreadT > 0;
        const rate = wide ? 14 : Math.min(4 + this.holdT * 7, 16);
        this.fireCD = 1 / rate;
        const n = wide ? 5 : this.holdT < 0.9 ? 1 : this.holdT < 1.8 ? 3 : 5;
        const spread = wide ? 0.17 : this.holdT < 0.9 ? 0 : 0.11 + Math.min(this.holdT, 3) * 0.02;
        const speed = 760 + Math.min(this.holdT, 3) * 220;
        for (let k = 0; k < n; k++) {
          const a = this.aim + (k - (n - 1) / 2) * spread + MB.rand(-0.02, 0.02);
          this.bullets.push({ x: GX + Math.cos(this.aim) * 26, y: GY + Math.sin(this.aim) * 26, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, hot: this.heat });
        }
        MB.sfx.laser();
      }
      if (this.heat >= 1) this.doOverheat();
    } else {
      this.holdT = Math.max(0, this.holdT - dt * 3);
      this.heat = Math.max(0, this.heat - dt * (this.overheat ? 0.45 : 0.6));
      if (this.overheat && this.heat <= 0.2) { this.overheat = false; this.say('Cooled down!', GX, GY - 70, '#29f0ff', 20); }
    }
    // drone buddies
    if (this.dronesT > 0 && (this.droneCD -= dt) <= 0) {
      this.droneCD = 0.22;
      for (let k = 0; k < 2; k++) {
        const da = this.t * 2.5 + k * Math.PI, dx = GX + Math.cos(da) * 62, dy = GY + Math.sin(da) * 62;
        let tg = null, bd = 1e9;
        for (const a of this.aliens) { if (!this.visible(a)) continue; const d = Math.hypot(a.x - dx, a.y - dy); if (d < bd) { bd = d; tg = a; } }
        if (tg) { const an = Math.atan2(tg.y - dy, tg.x - dx); this.bullets.push({ x: dx, y: dy, vx: Math.cos(an) * 820, vy: Math.sin(an) * 820, hot: 0, drone: true }); }
      }
    }
    // bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -20 || b.x > W + 20 || b.y < 40 || b.y > H + 20) { this.bullets.splice(i, 1); continue; }
      let gone = false;
      for (let j = this.pows.length - 1; j >= 0 && !gone; j--) { const p = this.pows[j]; if (Math.hypot(b.x - p.x, b.y - p.y) < 22) { this.collect(j); gone = true; } }
      for (let j = this.orbs.length - 1; j >= 0 && !gone; j--) { const o = this.orbs[j]; if (Math.hypot(b.x - o.x, b.y - o.y) < 12) { this.orbs.splice(j, 1); MB.burst(o.x, o.y, '#ff5a6e', 6, 120, 2); this.score += 2; gone = true; } }
      for (let j = this.aliens.length - 1; j >= 0 && !gone; j--) {
        const a = this.aliens[j];
        if (!this.visible(a)) continue;
        if ((b.x - a.x) ** 2 + (b.y - a.y) ** 2 > a.r * a.r) continue;
        gone = true;
        if (a.d.shield && !b.drone) {
          // the shield always faces the ship, so your lasers bounce off
          MB.burst(b.x, b.y, '#9fe6ff', 6, 140, 2); MB.sfx.tink();
          if (!a.blockMsg) { a.blockMsg = true; this.say('Shielded! LASSO it!', a.x, a.y - 40, '#4dd2ff', 20); }
          break;
        }
        if (--a.hp <= 0) this.killAlien(j, false);
        else { a.flash = 1; MB.burst(a.x, a.y, '#fff', 4, 100, 2); }
      }
      if (gone) this.bullets.splice(i, 1);
    }

    // ---- spawning ----
    if (this.endless) {
      if (this.inter > 0) {
        this.inter -= dt;
        if (this.inter <= 0) {
          const n = this.wave;
          this.waveQ = 8 + n * 3;
          if (n % 5 === 0) { this.spawn('boss'); this.waveQ = 4 + n; }
          this.spawnT = 0.5;
        }
      } else if (this.waveQ > 0) {
        this.spawnT -= dt;
        if (this.spawnT <= 0) {
          this.spawnT = Math.max(0.32, 1.05 - this.wave * 0.045);
          const type = pick(this.waveTypes());
          this.spawnGroup(type); this.waveQ--;
        }
      } else if (!this.aliens.length) {
        // wave cleared!
        this.score += 100 * this.wave;
        this.wave++;
        this.inter = 3;
        let sub = 'Wave bonus +' + (100 * (this.wave - 1));
        if ((this.wave - 1) % 3 === 0) { const l = this.slots.find((s) => s.lost); if (l) { l.lost = false; l.glow = 2; sub += ' · a memory came back!'; MB.sfx.life(); } }
        this.banner = { text: 'WAVE ' + this.wave, sub, t: 0 };
        MB.sfx.power();
      }
    } else {
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.t < this.duration - 2) {
        this.spawnT = MB.clamp(1.1 - this.t * 0.008, 0.42, 1.1);
        this.spawnGroup(pick(this.storyTypes()));
      }
      if (!this.bossDone && this.t > 66) { this.bossDone = true; this.spawn('boss'); }
    }

    // ---- aliens ----
    for (let i = this.aliens.length - 1; i >= 0; i--) {
      const a = this.aliens[i];
      a.wob += dt * 3; if (a.flash > 0) a.flash -= dt * 4;
      if (a.carry) {
        const dx = a.x - GX, dy = a.y - GY, d = Math.hypot(dx, dy) || 1;
        const sp = 85 * sm * (this.endless ? Math.min(1 + this.wave * 0.03, 1.8) : 1 + this.t * 0.004);
        a.x += (dx / d) * sp * dt; a.y += (dy / d) * sp * dt;
        if (a.x < -30 || a.x > W + 30 || a.y < 30 || a.y > H + 30) {
          a.carry.lost = true; a.carry.taken = false;
          this.say('A memory was stolen!', GX, GY + 170, '#ff3b5c', 22);
          MB.sfx.bad(); this.aliens.splice(i, 1);
        }
        continue;
      }
      if (a.d.shoots) {
        // hang back at a distance, circle the ship and shoot at it
        const R = a.d.boss ? 290 : 235;
        const dx = a.x - GX, dy = a.y - GY, d = Math.hypot(dx, dy) || 1;
        let ang = Math.atan2(dy, dx) + dt * (a.d.boss ? 0.22 : 0.4) * sm;
        const nd = d + MB.clamp(R - d, -a.speed * sm * dt * 1.5, a.speed * sm * dt * 1.5);
        a.x = GX + Math.cos(ang) * nd; a.y = GY + Math.sin(ang) * nd;
        if (Math.abs(nd - R) < 30) {
          a.fireT -= dt * sm;
          if (a.fireT <= 0) {
            a.fireT = a.d.boss ? 1.3 : MB.rand(2.2, 3);
            const an = Math.atan2(GY - a.y, GX - a.x), os = 170;
            const shots = a.d.boss ? [-0.25, 0, 0.25] : [0];
            for (const o of shots) this.orbs.push({ x: a.x, y: a.y, vx: Math.cos(an + o) * os, vy: Math.sin(an + o) * os });
          }
        }
        if (a.d.boss && (a.spawnT -= dt * sm) <= 0) { a.spawnT = 3.2; this.spawn('grab', a.x + 30, a.y); this.spawn(this.endless && this.wave >= 10 ? 'speed' : 'grab', a.x - 30, a.y); }
        continue;
      }
      // head for the nearest photo still in orbit
      let tgt = null, best = 1e9;
      for (const s of this.slots) { if (s.taken || s.lost) continue; const d = Math.hypot(s.x - a.x, s.y - a.y); if (d < best) { best = d; tgt = s; } }
      const tx = tgt ? tgt.x : GX, ty = tgt ? tgt.y : GY;
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy) || 1;
      const ux = dx / d, uy = dy / d;
      const zig = a.d.zig ? Math.sin(a.wob * 2.5) * 150 : Math.cos(a.wob) * 20;
      a.x += (ux * a.speed * sm - uy * zig) * dt; a.y += (uy * a.speed * sm + ux * zig) * dt;
      if (tgt && d < 18) {
        if (this.bubbleT > 0) { a.x -= ux * 70; a.y -= uy * 70; MB.burst(tgt.x, tgt.y, '#4dffd2', 10, 160, 2); MB.sfx.tink(); }
        else { a.carry = tgt; tgt.taken = true; MB.sfx.steal(); this.say('Thief! Shoot it!', a.x, a.y - 40, '#ffd84a', 20); }
      }
    }
    // enemy shots: they jam your gun
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      const o = this.orbs[i];
      o.x += o.vx * sm * dt; o.y += o.vy * sm * dt;
      const d = Math.hypot(o.x - GX, o.y - GY);
      if (this.bubbleT > 0 && d < ORBIT + 30) { this.orbs.splice(i, 1); MB.burst(o.x, o.y, '#4dffd2', 6, 120, 2); continue; }
      if (d < 30) {
        this.orbs.splice(i, 1);
        this.shake = 10; this.flashA = 0.25; MB.sfx.hurt();
        if (this.coolT <= 0) { this.heat = Math.min(1, this.heat + 0.32); this.say('JAMMED!', GX, GY + 60, '#ff5a6e', 22); if (this.heat >= 1 && !this.overheat) this.doOverheat(); }
      } else if (o.x < -20 || o.x > W + 20 || o.y < 40 || o.y > H + 20) this.orbs.splice(i, 1);
    }
    // power-ups drift and fade
    for (let i = this.pows.length - 1; i >= 0; i--) {
      const p = this.pows[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > 9 || p.x < 10 || p.x > W - 10 || p.y < 70 || p.y > H - 10) this.pows.splice(i, 1);
    }

    const safe = this.slots.filter((s) => !s.lost).length;
    if (safe === 0) finish(this, false);
    else if (!this.endless && this.t >= this.duration) finish(this, true);
  };
  G.visible = function (a) { return !a.d.cloak || a.flash > 0 || Math.sin(this.t * 2.2 + a.phase) > 0.15; };
  G.doOverheat = function () {
    this.heat = 1; this.overheat = true; this.holdT = 0;
    MB.sfx.bad(); this.say('OVERHEAT!', GX, GY - 70, '#ff3b5c', 30);
    MB.burst(GX, GY, '#ff5a3a', 30, 260, 3);
  };
  // did the rope cross itself? then everything inside the loop gets lassoed
  G.checkLoop = function () {
    const L = this.lasso, n = L.length;
    if (n < 14) return;
    const p = L[n - 1];
    for (let i = 0; i < n - 12; i++) {
      if (Math.hypot(L[i].x - p.x, L[i].y - p.y) < 24) {
        this.capture(L.slice(i));
        this.lasso = [];
        return;
      }
    }
  };
  function inPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  G.capture = function (poly) {
    this.snaps.push({ pts: poly, t: 0 });
    let caught = 0;
    for (let j = this.aliens.length - 1; j >= 0; j--) {
      const a = this.aliens[j];
      if (!inPoly(a.x, a.y, poly)) continue;
      if (a.d.boss) { a.hp -= 8; a.flash = 1; this.say('-8!', a.x, a.y - 60, '#ffd84a', 24); if (a.hp <= 0) this.killAlien(j, true); }
      else { this.killAlien(j, true); caught++; }
    }
    for (let j = this.pows.length - 1; j >= 0; j--) if (inPoly(this.pows[j].x, this.pows[j].y, poly)) this.collect(j);
    for (let j = this.orbs.length - 1; j >= 0; j--) if (inPoly(this.orbs[j].x, this.orbs[j].y, poly)) this.orbs.splice(j, 1);
    MB.sfx.lasso();
    if (caught >= 2) {
      const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length, cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
      this.score += caught * 5 * caught;
      this.say(caught >= 4 ? 'MEGA LASSO ×' + caught + '!' : 'LASSO ×' + caught + '!', cx, cy, '#ffd84a', caught >= 4 ? 34 : 28);
      MB.sfx.combo(caught * 3);
    }
  };
  G.killAlien = function (j, lasso) {
    const a = this.aliens[j];
    this.aliens.splice(j, 1);
    this.kills++;
    this.score += Math.round(a.d.pts * (this.endless ? 1 + this.wave * 0.1 : 1));
    MB.sfx.boom();
    MB.burst(a.x, a.y, 'hsl(' + a.hue + ',100%,65%)', a.d.boss ? 80 : 22, a.d.boss ? 480 : 260, a.d.boss ? 6 : 3.5);
    if (lasso) MB.burst(a.x, a.y, '#ffd84a', 10, 180, 3);
    if (a.carry) { a.carry.taken = false; a.carry.glow = 1.2; MB.sfx.good(); this.say('Memory saved!', a.x, a.y - 30, '#7dff6a', 22); }
    if (a.d.split) for (const o of [-1, 1]) this.spawn('mini', a.x + o * 16, a.y + o * 10);
    if (a.d.boss) { this.say('MOTHERSHIP DOWN!', W / 2, 140, '#ffd84a', 34); MB.sfx.bigBoom(); this.shake = 16; this.flashA = 0.5; this.dropPow(a.x - 30, a.y); this.dropPow(a.x + 30, a.y); }
    else if (Math.random() < (a.type === 'mini' || a.type === 'swarm' ? 0.04 : 0.11)) this.dropPow(a.x, a.y);
  };
  G.dropPow = function (x, y) {
    const lost = this.slots.some((s) => s.lost);
    const keys = Object.keys(GP).filter((k) => k !== 'repair' || lost);
    const type = lost && Math.random() < 0.25 ? 'repair' : keys[Math.floor(Math.random() * keys.length)];
    const a = Math.random() * 6.28;
    this.pows.push({ type, x: MB.clamp(x, 40, W - 40), y: MB.clamp(y, 90, H - 40), vx: Math.cos(a) * 18, vy: Math.sin(a) * 18, t: 0 });
  };
  G.collect = function (j) {
    const p = this.pows.splice(j, 1)[0], d = GP[p.type];
    this.say(d.name, p.x, p.y - 30, d.color, 24);
    MB.sfx.power(); MB.burst(p.x, p.y, d.color, 20, 220, 3);
    if (p.type === 'cool') { this.heat = 0; this.overheat = false; this.coolT = 8; }
    if (p.type === 'spread') this.spreadT = 10;
    if (p.type === 'bubble') this.bubbleT = 10;
    if (p.type === 'slow') this.slowT = 7;
    if (p.type === 'drones') this.dronesT = 12;
    if (p.type === 'repair') { const l = this.slots.find((s) => s.lost); if (l) { l.lost = false; l.glow = 2; MB.sfx.life(); } }
    if (p.type === 'nova') {
      this.shake = 18; this.flashA = 0.6; MB.sfx.bigBoom();
      for (let k = this.aliens.length - 1; k >= 0; k--) {
        const a = this.aliens[k];
        if (a.d.boss) { a.hp -= 8; a.flash = 1; if (a.hp <= 0) this.killAlien(k, false); }
        else this.killAlien(k, false);
      }
      this.orbs = [];
    }
  };
  // test helper: lasso a circle around a point
  G.debugLasso = function (x, y, r) {
    const pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; pts.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r }); }
    this.capture(pts);
  };
  G.draw = function (g, t) {
    MB.drawBackground(g, t, 18);
    g.save();
    if (this.shake > 0.3) g.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
    // galaxy swirl behind the ship
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      g.strokeStyle = ['rgba(168,107,255,.18)', 'rgba(41,240,255,.12)', 'rgba(255,63,164,.12)'][i]; g.lineWidth = 26 - i * 6;
      g.beginPath(); g.ellipse(GX, GY, 260 - i * 50, 120 - i * 20, -0.4 + t * 0.05, t * 0.2 + i, t * 0.2 + i + 4.2); g.stroke();
    }
    g.restore();
    // orbit ring (glows when the memory shield is up)
    g.save();
    if (this.bubbleT > 0) { g.strokeStyle = 'rgba(77,255,210,' + (this.bubbleT < 2 ? 0.3 + 0.3 * Math.sin(t * 20) : 0.7) + ')'; g.lineWidth = 5; g.shadowColor = '#4dffd2'; g.shadowBlur = 20; g.beginPath(); g.arc(GX, GY, ORBIT + 30, 0, 7); g.stroke(); }
    g.strokeStyle = 'rgba(168,107,255,.35)'; g.setLineDash([4, 8]); g.lineWidth = 1.5; g.shadowBlur = 0;
    g.beginPath(); g.arc(GX, GY, ORBIT, 0, 7); g.stroke(); g.restore();
    // memories in orbit
    for (const s of this.slots) {
      if (s.lost) { g.save(); g.globalAlpha = 0.5; g.strokeStyle = '#ff3b5c'; g.setLineDash([4, 4]); g.strokeRect(s.x - 30, s.y - 22, 60, 44); g.restore(); continue; }
      if (!s.taken) this.drawPhoto(g, s, s.x - 32, s.y - 24, 64, 48);
    }
    // power-ups
    for (const p of this.pows) {
      const d = GP[p.type];
      g.save(); g.translate(p.x, p.y); g.rotate(Math.sin(p.t * 4) * 0.2);
      if (p.t > 7 && Math.floor(p.t * 8) % 2) g.globalAlpha = 0.4;
      g.shadowColor = d.color; g.shadowBlur = 18; g.fillStyle = 'rgba(10,5,30,.9)';
      g.beginPath(); g.arc(0, 0, 17, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = d.color; g.stroke();
      g.shadowBlur = 0; g.fillStyle = d.color; g.font = '900 16px Trebuchet MS'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d.label, 0, 1);
      g.restore();
    }
    // aliens (and any photo they are carrying)
    for (const a of this.aliens) {
      if (a.carry) this.drawPhoto(g, a.carry, a.x - 26, a.y + 12, 52, 38);
      this.drawAlien(g, a, t);
    }
    // enemy shots
    for (const o of this.orbs) {
      g.save(); g.fillStyle = '#ff5a6e'; g.shadowColor = '#ff5a6e'; g.shadowBlur = 16;
      g.beginPath(); g.arc(o.x, o.y, 7 + Math.sin(t * 20) * 1.5, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(o.x, o.y, 3, 0, 7); g.fill(); g.restore();
    }
    // lasers
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const b of this.bullets) {
      const sp = Math.hypot(b.vx, b.vy), ux = b.vx / sp, uy = b.vy / sp;
      g.strokeStyle = b.drone ? '#b9b9ff' : b.hot > 0.7 ? '#ff7a3a' : b.hot > 0.4 ? '#ffd84a' : '#29f0ff';
      g.shadowColor = g.strokeStyle; g.shadowBlur = 10; g.lineWidth = 3.5;
      g.beginPath(); g.moveTo(b.x - ux * 16, b.y - uy * 16); g.lineTo(b.x + ux * 4, b.y + uy * 4); g.stroke();
    }
    g.restore();
    // drone buddies
    if (this.dronesT > 0) for (let k = 0; k < 2; k++) {
      const da = this.t * 2.5 + k * Math.PI, dx = GX + Math.cos(da) * 62, dy = GY + Math.sin(da) * 62;
      g.save(); g.fillStyle = '#b9b9ff'; g.shadowColor = '#b9b9ff'; g.shadowBlur = 12; g.beginPath(); g.arc(dx, dy, 7, 0, 7); g.fill(); g.restore();
    }
    // the ship in the middle
    g.save(); g.translate(GX, GY);
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(0, 0, 40, 0, 7); g.stroke();
    if (this.coolT > 0) { g.strokeStyle = '#29f0ff'; g.shadowColor = '#29f0ff'; g.shadowBlur = 16; g.beginPath(); g.arc(0, 0, 40, 0, 7); g.stroke(); g.shadowBlur = 0; }
    else if (this.heat > 0.01) {
      const hc = this.overheat ? (Math.floor(t * 8) % 2 ? '#ff3b5c' : '#ff9a5a') : this.heat > 0.7 ? '#ff5a3a' : this.heat > 0.4 ? '#ffd84a' : '#29f0ff';
      g.strokeStyle = hc; g.shadowColor = hc; g.shadowBlur = 12;
      g.beginPath(); g.arc(0, 0, 40, -Math.PI / 2, -Math.PI / 2 + this.heat * Math.PI * 2); g.stroke(); g.shadowBlur = 0;
    }
    g.rotate(this.aim + Math.PI / 2);
    g.shadowColor = '#ff3fa4'; g.shadowBlur = 20; g.fillStyle = '#ff3fa4';
    g.beginPath(); g.moveTo(0, -26); g.lineTo(18, 14); g.lineTo(6, 8); g.lineTo(0, 16); g.lineTo(-6, 8); g.lineTo(-18, 14); g.closePath(); g.fill();
    g.shadowBlur = 0; g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -4, 5, 0, Math.PI * 2); g.fill();
    if (this.overheat) { g.fillStyle = 'rgba(255,120,60,' + (0.4 + Math.random() * 0.4) + ')'; g.beginPath(); g.arc(0, 0, 14, 0, 7); g.fill(); }
    g.restore();
    // lasso rope
    if (this.lasso.length > 1) {
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = '#ffd84a'; g.shadowColor = '#ffd84a'; g.shadowBlur = 14; g.lineWidth = 4;
      g.beginPath(); g.moveTo(this.lasso[0].x, this.lasso[0].y);
      for (const p of this.lasso) g.lineTo(p.x, p.y);
      g.stroke();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(this.lasso[0].x, this.lasso[0].y, 5, 0, 7); g.fill();
      g.restore();
    }
    for (const sn of this.snaps) {
      const a = 1 - sn.t / 0.5;
      g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(255,216,74,.25)'; g.strokeStyle = '#fff3b0'; g.lineWidth = 3 + a * 4; g.shadowColor = '#ffd84a'; g.shadowBlur = 20;
      g.beginPath(); g.moveTo(sn.pts[0].x, sn.pts[0].y); for (const p of sn.pts) g.lineTo(p.x, p.y); g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    MB.drawParticles(g);
    for (const tx of this.texts) { g.globalAlpha = Math.min(1, (1.4 - tx.t) * 2.5); MB.neonText(g, tx.text, tx.x, tx.y, tx.size, tx.color); }
    g.globalAlpha = 1;
    g.restore(); // end shake
    if (this.flashA > 0.01) { g.fillStyle = 'rgba(255,240,230,' + this.flashA * 0.5 + ')'; g.fillRect(0, 0, W, H); }

    // HUD
    const safe = this.slots.filter((s) => !s.lost).length;
    if (this.endless) hudBar(g, 'MEMORIES ' + safe + '/' + NSLOTS, '∞ WAVE ' + this.wave, 'SCORE ' + this.score.toLocaleString());
    else hudBar(g, 'MEMORIES ' + safe + '/' + NSLOTS, 'SURVIVE ⏱ ' + Math.max(0, Math.ceil(this.duration - this.t)) + 's', 'ALIENS ' + this.kills);
    // mothership health bar
    const boss = this.aliens.find((a) => a.d.boss);
    if (boss) {
      g.save(); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(120, 62, W - 240, 10);
      g.fillStyle = '#ff3fa4'; g.shadowColor = '#ff3fa4'; g.shadowBlur = 10; g.fillRect(120, 62, (W - 240) * Math.max(0, boss.hp / boss.maxHp), 10);
      g.shadowBlur = 0; g.font = '800 11px Trebuchet MS'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText('MOTHERSHIP', W / 2, 84); g.restore();
    }
    // heat meter + active power-ups
    g.save();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(12, 858, 150, 10);
    g.fillStyle = this.coolT > 0 ? '#29f0ff' : this.overheat ? '#ff3b5c' : this.heat > 0.7 ? '#ff5a3a' : this.heat > 0.4 ? '#ffd84a' : '#29f0ff';
    g.fillRect(12, 858, 150 * (this.coolT > 0 ? 1 : this.heat), 10);
    g.font = '800 12px Trebuchet MS'; g.fillText(this.coolT > 0 ? 'COOLANT ' + Math.ceil(this.coolT) + 's' : this.overheat ? 'OVERHEATED! cooling…' : 'LASER HEAT', 12, 850);
    const act = [];
    if (this.spreadT > 0) act.push(['SPREAD', this.spreadT, '#ffd84a']);
    if (this.bubbleT > 0) act.push(['SHIELD', this.bubbleT, '#4dffd2']);
    if (this.slowT > 0) act.push(['WARP', this.slowT, '#6b9dff']);
    if (this.dronesT > 0) act.push(['DRONES', this.dronesT, '#b9b9ff']);
    let ax = 12; act.forEach((a) => { const tx = a[0] + ' ' + Math.ceil(a[1]) + 's'; g.fillStyle = a[2]; g.fillText(tx, ax, 832); ax += g.measureText(tx).width + 14; });
    g.restore();
    if (this.t < 4 && !this.endless) {
      g.globalAlpha = Math.min(1, 4 - this.t);
      MB.neonText(g, 'Draw a loop around aliens to lasso them!', W / 2, 150, 22, '#ffd84a');
      MB.neonText(g, 'Hold FIRE to blast. Don\'t overheat!', W / 2, 184, 18, '#29f0ff');
      g.globalAlpha = 1;
    }
    if (this.banner) {
      g.globalAlpha = Math.min(1, this.banner.t * 3, (2.4 - this.banner.t) * 2);
      MB.neonText(g, this.banner.text, W / 2, 200, 48, '#ff3fa4');
      MB.neonText(g, this.banner.sub, W / 2, 246, 18, '#ffd84a');
      g.globalAlpha = 1;
    }
    if (this.state === 'won') endBanner(this, g, 'MEMORIES DEFENDED!', '#ffd84a');
    if (this.state === 'lost') endBanner(this, g, this.endless ? 'GAME OVER · WAVE ' + this.wave : 'They got away…', '#ff3fa4');
  };
  G.drawPhoto = function (g, s, x, y, w, h) {
    const th = MB.photos[s.pid].thumb;
    g.save();
    g.shadowColor = s.glow > 0 ? '#7dff6a' : '#a86bff'; g.shadowBlur = s.glow > 0 ? 24 : 12;
    g.fillStyle = '#fff'; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.shadowBlur = 0;
    if (th) MB.drawPhotoBox(g, th, x, y, w, h); else { g.fillStyle = '#333'; g.fillRect(x, y, w, h); }
    g.restore();
  };
  G.drawAlien = function (g, a, t) {
    const vis = this.visible(a);
    const col = 'hsl(' + a.hue + ',100%,62%)';
    g.save(); g.translate(a.x, a.y);
    if (a.d.cloak) g.globalAlpha = vis ? 0.9 : 0.12;
    if (a.d.boss) {
      // the mothership
      g.shadowColor = col; g.shadowBlur = 30;
      g.fillStyle = a.flash > 0 ? '#fff' : '#5a1a6a'; g.beginPath(); g.ellipse(0, 6, 62, 22, 0, 0, 7); g.fill();
      g.fillStyle = col; g.beginPath(); g.ellipse(0, 0, 56, 16, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,240,255,.85)'; g.beginPath(); g.ellipse(0, -10, 24, 20, 0, Math.PI, 0); g.fill();
      g.shadowBlur = 0;
      for (let i = 0; i < 8; i++) { g.fillStyle = Math.sin(t * 8 + i) > 0 ? '#ffd84a' : '#fff'; g.beginPath(); g.arc(-48 + i * 13.7, 8, 3, 0, 7); g.fill(); }
      g.fillStyle = '#120030'; g.beginPath(); g.arc(-7, -12, 3, 0, 7); g.arc(7, -12, 3, 0, 7); g.fill();
      g.restore();
      return;
    }
    const s = a.r / 19;
    g.scale(s, s);
    g.shadowColor = col; g.shadowBlur = 14; g.fillStyle = a.flash > 0 ? '#fff' : col;
    if (a.type === 'speed') { g.beginPath(); g.moveTo(22, 0); g.lineTo(-14, -11); g.lineTo(-6, 0); g.lineTo(-14, 11); g.closePath(); g.rotate(0); g.fill(); }
    else if (a.type === 'tank') { MB.roundRect(g, -20, -13, 40, 26, 8); g.fill(); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(-16, -3, 32, 6); }
    else { g.beginPath(); g.ellipse(0, 0, 18, 10, 0, 0, Math.PI * 2); g.fill(); }
    if (a.type !== 'speed') { g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(0, -6, 9, 8, 0, Math.PI, 0); g.fill(); }
    g.shadowBlur = 0; g.fillStyle = '#120030';
    g.beginPath(); g.arc(-4, -6, 2, 0, Math.PI * 2); g.arc(4, -6, 2, 0, Math.PI * 2); g.fill();
    if (a.type === 'shooter') { g.fillStyle = '#ff5a6e'; g.beginPath(); g.arc(0, 8, 4 + Math.sin(t * 10), 0, 7); g.fill(); }
    if (a.type === 'split') { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -10); g.lineTo(0, 10); g.stroke(); }
    if (a.type !== 'speed' && a.type !== 'tank') { g.fillStyle = '#fff'; for (let i = -2; i <= 2; i++) if (Math.sin(t * 10 + i) > 0) g.fillRect(i * 7 - 1.5, 2, 3, 3); }
    g.restore();
    // shield: always on the side facing the ship
    if (a.d.shield) {
      const an = Math.atan2(GY - a.y, GX - a.x);
      g.save(); g.strokeStyle = '#9fe6ff'; g.shadowColor = '#4dd2ff'; g.shadowBlur = 14; g.lineWidth = 4;
      g.beginPath(); g.arc(a.x, a.y, a.r + 9, an - 1.1, an + 1.1); g.stroke(); g.restore();
    }
    // health pips for tough ones
    if (a.maxHp > 2) { g.save(); g.fillStyle = '#fff'; for (let i = 0; i < a.hp; i++) g.fillRect(a.x - a.maxHp * 3 + i * 6, a.y - a.r - 10, 4, 4); g.restore(); }
  };

  // =====================================================================
  // CENTIPEDE: MUSHROOM FIELD SURVIVAL
  // =====================================================================
  const CS = 32, CC = 20, CR = 24, CTOP = 56; // 20 cols x 24 rows of 32px
  const ZONE = 19; // player zone rows 19..23
  MB.Centipede = function (onEnd) {
    this.onEnd = onEnd; this.pausable = true; this.active = true; this.music = true;
    this.state = 'play'; this.t = 0; this.duration = 60;
    this.lives = 3; this.inv = 0; this.score = 0; this.wave = 0; this.cleared = 0;
    this.px = W / 2; this.py = CTOP + 22.5 * CS;
    this.bullets = []; this.fireT = 0;
    this.mush = [];
    for (let r = 0; r < CR; r++) this.mush.push(Array(CC).fill(0));
    let seed = 1234;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 46; k++) { const r = 2 + Math.floor(rnd() * 16), c = Math.floor(rnd() * CC); this.mush[r][c] = 4; }
    for (let k = 0; k < 5; k++) { const r = ZONE + Math.floor(rnd() * 3), c = Math.floor(rnd() * CC); this.mush[r][c] = 4; }
    this.segs = []; this.chainId = 0;
    this.spawnWave();
  };
  const K = MB.Centipede.prototype;
  K.spawnWave = function () {
    const n = 10 + Math.min(this.wave, 3) * 1;
    const id = ++this.chainId;
    this.speed = 8 + this.wave * 1.6;
    const dir = this.wave % 2 ? -1 : 1;
    for (let k = 0; k < n; k++) {
      const col = dir > 0 ? -k : CC - 1 + k;
      this.segs.push({ c: col, r: 0, fc: col - dir, fr: 0, dir, vdir: 1, p: 0, chain: id, head: k === 0 });
    }
    this.wave++;
  };
  K.mushAt = function (c, r) { return c >= 0 && c < CC && r >= 0 && r < CR && this.mush[r][c] > 0; };
  K.advance = function (s) {
    s.fc = s.c; s.fr = s.r;
    const nc = s.c + s.dir;
    const blocked = (s.dir > 0 && nc >= CC) || (s.dir < 0 && nc < 0) || this.mushAt(nc, s.r);
    if (!blocked) { s.c = nc; return; }
    let nr = s.r + s.vdir;
    if (nr > CR - 1) { s.vdir = -1; nr = s.r - 1; }
    else if (s.vdir < 0 && nr < ZONE) { s.vdir = 1; nr = s.r + 1; }
    s.r = nr; s.dir = -s.dir;
  };
  K.segPos = function (s) {
    return { x: ((s.fc + (s.c - s.fc) * s.p) + 0.5) * CS, y: CTOP + ((s.fr + (s.r - s.fr) * s.p) + 0.5) * CS };
  };
  K.update = function (dt) {
    MB.updateParticles(dt);
    if (tickEnd(this, dt)) return;
    const inp = MB.input;
    this.t += dt;
    this.inv = Math.max(0, this.inv - dt);
    // player move within zone
    const zy0 = CTOP + ZONE * CS + 14, zy1 = CTOP + CR * CS - 14;
    const kx = MB.keyAxis(['ArrowLeft', 'a', 'A'], ['ArrowRight', 'd', 'D']), ky = MB.keyAxis(['ArrowUp', 'w', 'W'], ['ArrowDown', 's', 'S']);
    if (MB.auto) {
      // autopilot: stay under the nearest segment but dodge if close
      let near = null, nd = 1e9;
      for (const s of this.segs) { const p = this.segPos(s); const d = Math.abs(p.x - this.px) + (zy1 - p.y) * 0.3; if (d < nd) { nd = d; near = p; } }
      let tx = near ? near.x : W / 2, ty = zy1;
      for (const s of this.segs) { const p = this.segPos(s); if (p.y > zy0 - 60 && Math.hypot(p.x - this.px, p.y - this.py) < 90) { tx = this.px + (this.px < p.x ? -120 : 120); ty = p.y > (zy0 + zy1) / 2 ? zy0 : zy1; } }
      this.px += MB.clamp(tx - this.px, -420 * dt, 420 * dt); this.py += MB.clamp(ty - this.py, -300 * dt, 300 * dt);
    } else if (kx || ky) { this.px += kx * 380 * dt; this.py += ky * 320 * dt; this.kb = performance.now(); }
    else if (inp.usedPointer && (!this.kb || (inp.lastMove || 0) > this.kb)) {
      // finger sits a bit below the ship on touch so it stays visible
      const ty = inp.y - (inp.pointerType === 'touch' ? 50 : 0);
      this.px += MB.clamp(inp.x - this.px, -700 * dt, 700 * dt); this.py += MB.clamp(ty - this.py, -600 * dt, 600 * dt);
    }
    this.px = MB.clamp(this.px, 14, W - 14); this.py = MB.clamp(this.py, zy0, zy1);
    // fire
    this.fireT -= dt;
    if (this.fireT <= 0 && this.bullets.length < 2) { this.fireT = 0.11; this.bullets.push({ x: this.px, y: this.py - 14 }); MB.sfx.shoot(); }
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i]; b.y -= 950 * dt;
      let hit = false;
      // mushrooms
      const c = Math.floor(b.x / CS), r = Math.floor((b.y - CTOP) / CS);
      if (this.mushAt(c, r)) { this.mush[r][c]--; hit = true; this.score += this.mush[r][c] ? 0 : 1; MB.burst(b.x, b.y, '#ff7ad9', 4, 100, 2); }
      // segments
      if (!hit) for (let j = 0; j < this.segs.length; j++) {
        const s = this.segs[j], p = this.segPos(s);
        if (Math.abs(p.x - b.x) < 15 && Math.abs(p.y - b.y) < 15) { this.killSeg(j); hit = true; break; }
      }
      if (hit || b.y < CTOP) this.bullets.splice(i, 1);
    }
    // segments move
    const step = this.speed * dt;
    for (const s of this.segs) {
      s.p += step;
      while (s.p >= 1) { s.p -= 1; this.advance(s); }
    }
    // collisions with player
    if (this.inv <= 0) for (const s of this.segs) {
      const p = this.segPos(s);
      if (Math.hypot(p.x - this.px, p.y - this.py) < 24) { this.hurt(); break; }
    }
    if (!this.segs.length) { this.cleared++; this.spawnWave(); MB.sfx.good(); }
    if (this.lives <= 0) finish(this, false);
    else if (this.t >= this.duration) finish(this, true);
  };
  K.killSeg = function (j) {
    const s = this.segs[j], p = this.segPos(s);
    MB.sfx.boom(); MB.burst(p.x, p.y, s.head ? '#ffd84a' : '#7dff6a', 16, 220, 3);
    this.score += s.head ? 100 : 10;
    const r = Math.round(s.fr + (s.r - s.fr) * s.p), c = Math.round(s.fc + (s.c - s.fc) * s.p);
    if (c >= 0 && c < CC && r >= 0 && r < CR - 1 && r < ZONE + 2) this.mush[r][c] = 4;
    this.segs.splice(j, 1);
    // the rest of this chain becomes a new centipede with its own head
    const id = ++this.chainId; let first = true;
    for (let k = j; k < this.segs.length; k++) {
      if (this.segs[k].chain !== s.chain) break;
      this.segs[k].chain = id; if (first) { this.segs[k].head = true; first = false; }
    }
  };
  K.hurt = function () {
    this.lives--; this.inv = 2.2; MB.sfx.hurt();
    MB.burst(this.px, this.py, '#ff3fa4', 30, 300, 3);
    // clear segments in player zone so it is not a cheap double-hit
    this.segs = this.segs.filter((s) => s.r < ZONE - 1);
    if (!this.segs.length) this.spawnWave();
  };
  K.draw = function (g, t) {
    MB.drawBackground(g, t, 3);
    g.fillStyle = 'rgba(41,240,255,.05)'; g.fillRect(0, CTOP + ZONE * CS, W, (CR - ZONE) * CS);
    g.strokeStyle = 'rgba(41,240,255,.25)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(0, CTOP + ZONE * CS); g.lineTo(W, CTOP + ZONE * CS); g.stroke(); g.setLineDash([]);
    // mushrooms
    for (let r = 0; r < CR; r++) for (let c = 0; c < CC; c++) {
      const hp = this.mush[r][c]; if (!hp) continue;
      const x = c * CS + CS / 2, y = CTOP + r * CS + CS / 2, k = 0.45 + hp * 0.14;
      g.save(); g.translate(x, y); g.scale(k, k);
      g.shadowColor = '#ff3fa4'; g.shadowBlur = 10;
      g.fillStyle = '#ff3fa4'; g.beginPath(); g.arc(0, 0, 14, Math.PI, 0); g.closePath(); g.fill();
      g.shadowBlur = 0; g.fillStyle = '#ffe0f4'; g.fillRect(-5, 0, 10, 11);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(-6, -6, 2.5, 0, 7); g.arc(5, -8, 2, 0, 7); g.fill();
      g.restore();
    }
    // centipede
    for (const s of this.segs) {
      const p = this.segPos(s);
      g.save(); g.translate(p.x, p.y);
      const col = s.head ? '#ffd84a' : '#7dff6a';
      g.shadowColor = col; g.shadowBlur = 14; g.fillStyle = col;
      g.beginPath(); g.arc(0, 0, 13, 0, Math.PI * 2); g.fill();
      g.shadowBlur = 0; g.strokeStyle = '#0b3d10'; g.lineWidth = 2;
      const leg = Math.sin(t * 18 + p.x * 0.1) * 4;
      g.beginPath(); g.moveTo(-8, 10); g.lineTo(-11, 15 + leg); g.moveTo(8, 10); g.lineTo(11, 15 - leg); g.stroke();
      if (s.head) {
        g.fillStyle = '#1a0030'; g.beginPath(); g.arc(-5, -3, 3, 0, 7); g.arc(5, -3, 3, 0, 7); g.fill();
        g.strokeStyle = '#ffd84a'; g.beginPath(); g.moveTo(-5, -11); g.lineTo(-9, -19); g.moveTo(5, -11); g.lineTo(9, -19); g.stroke();
      }
      g.restore();
    }
    // bullets
    g.save(); g.fillStyle = '#29f0ff'; g.shadowColor = '#29f0ff'; g.shadowBlur = 10;
    for (const b of this.bullets) g.fillRect(b.x - 2, b.y - 8, 4, 14);
    g.restore();
    // player
    if (this.state !== 'lost' && (this.inv <= 0 || Math.floor(t * 12) % 2)) {
      g.save(); g.translate(this.px, this.py);
      g.shadowColor = '#29f0ff'; g.shadowBlur = 16; g.fillStyle = '#29f0ff';
      g.beginPath(); g.moveTo(0, -14); g.lineTo(12, 12); g.lineTo(-12, 12); g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 2, 4, 0, 7); g.fill();
      g.restore();
    }
    MB.drawParticles(g);
    hudBar(g, 'LIVES ' + '♥'.repeat(Math.max(0, this.lives)), 'SURVIVE ⏱ ' + Math.max(0, Math.ceil(this.duration - this.t)) + 's', 'SCORE ' + this.score);
    if (this.t < 3) { g.globalAlpha = 1 - this.t / 3; MB.neonText(g, 'Survive 60 seconds!', W / 2, 520, 30, '#7dff6a'); g.globalAlpha = 1; }
    if (this.state === 'won') endBanner(this, g, 'YOU SURVIVED!', '#ffd84a');
    if (this.state === 'lost') endBanner(this, g, 'Bugged out…', '#ff3fa4');
  };

  // =====================================================================
  // MEMORY LANE RIDE (e-bike ride: collect photo bubbles, reach the 50)
  // =====================================================================
  const ROAD0 = 520, ROAD1 = 810;
  MB.Ride = function (onEnd) {
    this.onEnd = onEnd; this.pausable = true; this.active = true; this.music = true;
    this.state = 'play'; this.t = 0;
    this.dist = 0; this.goal = 50; this.rate = 50 / 70; // ~70 seconds
    this.battery = 100; this.drain = 1.05;
    this.by = (ROAD0 + ROAD1) / 2; this.bx = 150; this.wob = 0;
    this.objs = []; this.bubT = 0.6; this.trashT = 2.2; this.collected = 0;
    this.scroll = 0; this.flashes = [];
    this.pool = [];
    for (let i = 0; i < 50; i++) this.pool.push(i);
    this.pool.sort(() => Math.random() - 0.5);
    this.pi = 0;
    this.pool.slice(0, 12).forEach((i) => MB.whenThumb(i, () => {}));
  };
  const R = MB.Ride.prototype;
  R.update = function (dt) {
    MB.updateParticles(dt);
    if (tickEnd(this, dt)) return;
    const inp = MB.input;
    this.t += dt;
    const speed = 300;
    this.scroll += speed * dt;
    this.dist = Math.min(this.goal, this.dist + this.rate * dt);
    this.battery -= this.drain * dt;
    // control
    const ky = MB.keyAxis(['ArrowUp', 'w', 'W'], ['ArrowDown', 's', 'S']);
    if (MB.auto) {
      let tgt = null;
      for (const o of this.objs) if (o.type === 'bubble' && o.x > this.bx - 10 && (!tgt || o.x < tgt.x)) tgt = o;
      let ty = tgt ? tgt.y : this.by;
      for (const o of this.objs) if (o.type === 'trash' && o.x > this.bx - 20 && o.x < this.bx + 160 && Math.abs(o.y - ty) < 50) ty = o.y > (ROAD0 + ROAD1) / 2 ? o.y - 110 : o.y + 110;
      this.by += MB.clamp(ty - this.by, -380 * dt, 380 * dt);
    } else if (ky) { this.by += ky * 380 * dt; this.kb = performance.now(); }
    else if (inp.usedPointer && (!this.kb || (inp.lastMove || 0) > this.kb)) this.by += MB.clamp(inp.y - this.by, -520 * dt, 520 * dt);
    this.by = MB.clamp(this.by, ROAD0 + 20, ROAD1 - 10);
    this.wob = Math.max(0, this.wob - dt);
    // spawn
    if (this.dist < this.goal - 3) {
      if ((this.bubT -= dt) <= 0) {
        this.bubT = MB.rand(0.8, 1.3);
        const pid = this.pool[this.pi++ % 50];
        MB.whenThumb(pid, () => {});
        this.objs.push({ type: 'bubble', x: W + 50, y: MB.rand(ROAD0 + 30, ROAD1 - 30), pid, bob: Math.random() * 6, r: 34 });
      }
      if ((this.trashT -= dt) <= 0) {
        this.trashT = MB.clamp(2.2 - this.t * 0.02, 1.0, 2.2) * MB.rand(0.8, 1.2);
        this.objs.push({ type: 'trash', x: W + 40, y: MB.rand(ROAD0 + 30, ROAD1 - 20), kind: Math.floor(Math.random() * 3), rot: Math.random() * 6 });
      }
    }
    for (let i = this.objs.length - 1; i >= 0; i--) {
      const o = this.objs[i];
      o.x -= speed * dt * (o.type === 'bubble' ? 0.85 : 1);
      if (o.type === 'bubble') o.bob += dt * 3;
      if (o.x < -60) { this.objs.splice(i, 1); continue; }
      const oy = o.type === 'bubble' ? o.y + Math.sin(o.bob) * 8 : o.y;
      const d = Math.hypot(o.x - (this.bx + 10), oy - this.by);
      if (o.type === 'bubble' && d < 58) {
        this.objs.splice(i, 1); this.collected++;
        this.battery = Math.min(100, this.battery + 7);
        MB.sfx.bubble(); MB.burst(o.x, oy, '#29f0ff', 18, 200, 3);
        this.flashes.push({ pid: o.pid, t: 0 });
      } else if (o.type === 'trash' && Math.abs(o.x - (this.bx + 10)) < 34 && Math.abs(o.y - this.by) < 26) {
        this.objs.splice(i, 1);
        this.battery -= 9; this.wob = 0.6;
        MB.sfx.hurt(); MB.burst(o.x, o.y, '#ff3fa4', 16, 200, 3);
      }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) if ((this.flashes[i].t += dt) > 1.6) this.flashes.splice(i, 1);
    if (this.battery <= 0) { this.battery = 0; finish(this, false); }
    else if (this.dist >= this.goal) finish(this, true);
  };
  R.draw = function (g, t) {
    // sky
    const sky = g.createLinearGradient(0, 0, 0, ROAD0);
    sky.addColorStop(0, '#1a0638'); sky.addColorStop(0.55, '#5a1260'); sky.addColorStop(1, '#ff6a5a');
    g.fillStyle = sky; g.fillRect(0, 0, W, ROAD0);
    // sun
    g.save(); g.shadowColor = '#ffd84a'; g.shadowBlur = 40;
    const sg = g.createLinearGradient(0, 220, 0, 420); sg.addColorStop(0, '#ffe56a'); sg.addColorStop(1, '#ff3fa4');
    g.fillStyle = sg; g.beginPath(); g.arc(W * 0.68, 400, 110, Math.PI, 0); g.fill(); g.restore();
    g.fillStyle = '#5a1260'; for (let i = 0; i < 6; i++) g.fillRect(W * 0.68 - 120, 330 + i * 13, 240, 3 + i * 0.6);
    // mountains parallax
    const mt = (off, k, col, base, hgt) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(0, ROAD0);
      for (let x = 0; x <= W + 40; x += 40) {
        const wx = x + (this.scroll * k) % 400;
        g.lineTo(x, base - Math.abs(Math.sin(wx * 0.011 + off)) * hgt - Math.abs(Math.sin(wx * 0.027 + off * 2)) * hgt * 0.4);
      }
      g.lineTo(W, ROAD0); g.closePath(); g.fill();
    };
    mt(1, 0.05, '#3a0d4f', ROAD0 - 20, 110);
    mt(3, 0.15, '#22072f', ROAD0, 70);
    // playa
    const pg = g.createLinearGradient(0, ROAD0, 0, H); pg.addColorStop(0, '#3b2440'); pg.addColorStop(1, '#1a0f22');
    g.fillStyle = pg; g.fillRect(0, ROAD0, W, H - ROAD0);
    g.strokeStyle = '#ff3fa4'; g.shadowColor = '#ff3fa4'; g.shadowBlur = 10; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, ROAD0); g.lineTo(W, ROAD0); g.stroke(); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(41,240,255,.35)'; g.lineWidth = 3; g.setLineDash([30, 30]); g.lineDashOffset = this.scroll % 60;
    for (const y of [ROAD0 + 97, ROAD0 + 194]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.setLineDash([]);
    // finish arch
    const remain = this.goal - this.dist;
    if (remain < 6) {
      const fx = this.bx + 40 + remain * 90;
      g.save(); g.shadowColor = '#ffd84a'; g.shadowBlur = 24; g.strokeStyle = '#ffd84a'; g.lineWidth = 8;
      g.beginPath(); g.moveTo(fx, ROAD1); g.lineTo(fx, ROAD0 - 120); g.moveTo(fx + 40, ROAD1); g.lineTo(fx + 40, ROAD0 - 120); g.stroke();
      g.restore();
      MB.neonText(g, '50', fx + 20, ROAD0 - 170, 96, '#ffd84a');
      for (let y = ROAD0; y < ROAD1; y += 20) { g.fillStyle = ((y / 20) % 2) ? '#fff' : '#111'; g.fillRect(fx + 8, y, 24, 20); }
    }
    // objects (sorted by y for depth)
    const objs = this.objs.slice().sort((a, b) => a.y - b.y);
    for (const o of objs) {
      if (o.type === 'bubble') {
        const y = o.y + Math.sin(o.bob) * 8 - 30;
        const th = MB.photos[o.pid].thumb;
        g.save(); g.beginPath(); g.arc(o.x, y, o.r, 0, Math.PI * 2); g.clip();
        if (th) MB.drawPhotoBox(g, th, o.x - o.r, y - o.r, o.r * 2, o.r * 2); else { g.fillStyle = '#29f0ff'; g.fill(); }
        g.restore();
        g.save(); g.strokeStyle = '#29f0ff'; g.shadowColor = '#29f0ff'; g.shadowBlur = 16; g.lineWidth = 3;
        g.beginPath(); g.arc(o.x, y, o.r, 0, Math.PI * 2); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(o.x - 12, y - 14, 9, 5, -0.6, 0, 7); g.fill();
        g.restore();
      } else {
        g.save(); g.translate(o.x, o.y); g.rotate(o.rot);
        g.shadowColor = '#ff3fa4'; g.shadowBlur = 8;
        if (o.kind === 0) { g.fillStyle = '#5a6b7a'; g.fillRect(-9, -16, 18, 28); g.fillStyle = '#ff3fa4'; g.fillRect(-9, -6, 18, 8); }
        else if (o.kind === 1) { g.fillStyle = '#2a8a5a'; g.beginPath(); g.moveTo(-7, 14); g.lineTo(-7, -6); g.lineTo(-3, -18); g.lineTo(3, -18); g.lineTo(7, -6); g.lineTo(7, 14); g.fill(); }
        else { g.fillStyle = '#222'; g.beginPath(); g.ellipse(0, 0, 18, 14, 0, 0, 7); g.fill(); g.fillStyle = '#555'; g.fillRect(-4, -18, 8, 6); }
        g.restore();
      }
    }
    this.drawBike(g, t);
    MB.drawParticles(g);
    // flash of collected photo
    for (const f of this.flashes) {
      const th = MB.photos[f.pid].thumb; if (!th) continue;
      const a = f.t < 0.2 ? f.t / 0.2 : Math.max(0, 1 - (f.t - 0.9) / 0.7);
      g.save(); g.globalAlpha = a;
      const w = 180, h = 130, x = W - w - 20, y = 80 + f.t * 20;
      g.fillStyle = '#fff'; g.fillRect(x - 5, y - 5, w + 10, h + 26);
      MB.drawPhotoBox(g, th, x, y, w, h);
      g.fillStyle = '#333'; g.font = '700 13px Trebuchet MS'; g.textAlign = 'center'; g.fillText('Memory #' + (f.pid + 1), x + w / 2, y + h + 13);
      g.restore();
    }
    // HUD
    hudBar(g, 'PHOTOS ' + this.collected, 'KM ' + Math.floor(this.dist) + ' / 50', '');
    const bw = 110, bx = W - 62 - bw;
    g.save(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(bx, 18, bw, 20); g.fillStyle = '#fff'; g.fillRect(bx + bw, 23, 5, 10);
    const bc = this.battery > 50 ? '#7dff6a' : this.battery > 25 ? '#ffd84a' : '#ff3fa4';
    g.fillStyle = bc; g.shadowColor = bc; g.shadowBlur = 10; g.fillRect(bx + 3, 21, (bw - 6) * Math.max(0, this.battery) / 100, 14);
    g.restore();
    // progress bar
    g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(20, 864, W - 40, 6);
    g.fillStyle = '#ffd84a'; g.fillRect(20, 864, (W - 40) * this.dist / this.goal, 6);
    if (this.t < 3) { g.globalAlpha = 1 - this.t / 3; MB.neonText(g, 'Ride to the 50! Grab the memories!', W / 2, 160, 26, '#29f0ff'); g.globalAlpha = 1; }
    if (this.battery < 20 && this.state === 'play' && Math.floor(t * 3) % 2) MB.neonText(g, 'LOW BATTERY: grab bubbles!', W / 2, 470, 22, '#ff3fa4');
    if (this.state === 'won') endBanner(this, g, 'YOU MADE IT TO 50!', '#ffd84a');
    if (this.state === 'lost') endBanner(this, g, 'Battery died…', '#ff3fa4');
  };
  R.drawBike = function (g, t) {
    const x = this.bx, y = this.by;
    g.save(); g.translate(x, y);
    if (this.wob > 0) g.rotate(Math.sin(t * 40) * 0.12);
    g.shadowColor = '#29f0ff'; g.shadowBlur = 14; g.strokeStyle = '#29f0ff'; g.lineWidth = 3.5;
    const spin = t * 14;
    for (const wx of [-28, 32]) {
      g.beginPath(); g.arc(wx, 0, 17, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(wx + Math.cos(spin) * 17, Math.sin(spin) * 17); g.lineTo(wx - Math.cos(spin) * 17, -Math.sin(spin) * 17); g.stroke();
    }
    g.strokeStyle = '#ff3fa4'; g.shadowColor = '#ff3fa4';
    g.beginPath(); g.moveTo(-28, 0); g.lineTo(-4, -2); g.lineTo(18, -30); g.lineTo(32, 0); g.moveTo(-4, -2); g.lineTo(-10, -30); g.lineTo(18, -30); g.moveTo(18, -30); g.lineTo(22, -42); g.stroke();
    g.fillStyle = '#ffd84a'; g.fillRect(-14, -14, 16, 9); // battery
    // rider
    g.strokeStyle = '#fff'; g.shadowColor = '#fff'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(-10, -32); g.lineTo(2, -62); g.lineTo(20, -44); g.moveTo(-10, -32); g.lineTo(2, -12 + Math.sin(spin) * 6); g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(6, -74, 9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff3fa4'; g.beginPath(); g.arc(6, -77, 10, Math.PI, 0); g.fill(); // helmet
    g.restore();
    // dust
    if (Math.random() < 0.5) MB.burst(x - 40, y + 14, 'rgba(255,200,150,.6)', 1, 60, 3);
  };
})();
