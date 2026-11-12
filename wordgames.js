/* Memory Breakout: word bonus games (Dad-le, Family Spelling Bee, Word Smart trivia) */
(function () {
  'use strict';
  const MB = window.MB, C = MB.C, $ = MB.$;

  // =====================================================================
  // DAD-LE
  // =====================================================================
  MB.Dadle = function (onEnd) {
    const ans = String((C.dadle && C.dadle.answer) || 'FAMILY').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) || 'FAMILY';
    const L = ans.length, ROWS = 6;
    let row = 0, cur = '', done = false, misses = 0;
    const board = $('dadleBoard'), kb = $('dadleKb'), msg = $('dadleMsg');
    $('dadleSub').textContent = 'Guess the ' + L + '-letter family word in 6 tries. Green = right spot, gold = in the word.';
    function build() {
      board.innerHTML = '';
      for (let r = 0; r < ROWS; r++) {
        const d = document.createElement('div'); d.className = 'drow';
        d.style.gridTemplateColumns = 'repeat(' + L + ',auto)';
        for (let c = 0; c < L; c++) { const cell = document.createElement('div'); cell.className = 'dcell'; d.appendChild(cell); }
        board.appendChild(d);
      }
      kb.innerHTML = '';
      ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-'].forEach((line) => {
        const r = document.createElement('div'); r.className = 'r';
        for (const ch of line) {
          const b = document.createElement('button'); b.className = 'key';
          if (ch === '+') { b.textContent = 'ENTER'; b.classList.add('wide'); b.onclick = () => press('Enter'); }
          else if (ch === '-') { b.textContent = '⌫'; b.classList.add('wide'); b.onclick = () => press('Backspace'); }
          else { b.textContent = ch; b.dataset.k = ch; b.onclick = () => press(ch); }
          r.appendChild(b);
        }
        kb.appendChild(r);
      });
      row = 0; cur = ''; done = false; msg.textContent = misses ? 'Hint: ' + ((C.dadle && C.dadle.hint) || '') : '';
    }
    function paint() {
      const cells = board.children[row].children;
      for (let c = 0; c < L; c++) { cells[c].textContent = cur[c] || ''; cells[c].classList.toggle('filled', !!cur[c]); }
    }
    function score(guess) {
      const res = Array(L).fill('x'), pool = {};
      for (let i = 0; i < L; i++) { if (guess[i] === ans[i]) res[i] = 'g'; else pool[ans[i]] = (pool[ans[i]] || 0) + 1; }
      for (let i = 0; i < L; i++) if (res[i] !== 'g' && pool[guess[i]]) { res[i] = 'y'; pool[guess[i]]--; }
      return res;
    }
    function press(k) {
      if (done) return;
      if (k === 'Enter') {
        if (cur.length < L) { board.children[row].classList.remove('shake'); void board.offsetWidth; board.children[row].classList.add('shake'); msg.textContent = 'Need ' + L + ' letters'; MB.sfx.bad(); return; }
        const res = score(cur), cells = board.children[row].children;
        res.forEach((r, i) => {
          setTimeout(() => {
            cells[i].classList.add(r); MB.sfx.key();
            const key = kb.querySelector('[data-k="' + cur[i] + '"]');
            if (key) { const rank = { x: 0, y: 1, g: 2 }; const was = key.classList.contains('g') ? 'g' : key.classList.contains('y') ? 'y' : key.classList.contains('x') ? 'x' : null;
              if (!was || rank[r] > rank[was]) { key.classList.remove('g', 'y', 'x'); key.classList.add(r); } }
          }, i * 140);
        });
        const guess = cur;
        done = true;
        setTimeout(() => {
          if (guess === ans) { msg.textContent = 'You got it! ' + ans; MB.sfx.win(); setTimeout(() => onEnd(true), 1200); return; }
          row++; cur = ''; done = false;
          if (row >= ROWS) {
            misses++; done = true; MB.sfx.bad();
            msg.textContent = 'So close! Here comes a fresh board, with a hint.';
            setTimeout(build, 1800);
          } else msg.textContent = '';
        }, L * 140 + 150);
        return;
      }
      if (k === 'Backspace') { cur = cur.slice(0, -1); paint(); return; }
      if (/^[A-Z]$/.test(k) && cur.length < L) { cur += k; MB.sfx.key(); paint(); }
    }
    this.onKey = (e) => {
      if (e.key === 'Enter' || e.key === 'Backspace') { press(e.key); e.preventDefault(); }
      else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toUpperCase());
    };
    this.press = press; this.answer = ans;
    build();
  };

  // =====================================================================
  // FAMILY SPELLING BEE
  // =====================================================================
  let DICT = null;
  function dict() {
    if (!DICT) { DICT = new Set(String(window.BEE_WORDS || '').split(' ')); }
    return DICT;
  }
  MB.Bee = function (onEnd) {
    const cfg = C.spellingBee || {};
    let pangram = String(cfg.pangram || 'FATHERS').toUpperCase().replace(/[^A-Z]/g, '');
    let letters = [...new Set(pangram)];
    if (letters.length !== 7) { console.warn('Spelling Bee pangram must use exactly 7 different letters; using FATHERS'); pangram = 'FATHERS'; letters = [...new Set(pangram)]; }
    let center = String(cfg.center || letters[0]).toUpperCase();
    if (!letters.includes(center)) center = letters[0];
    const outer = letters.filter((l) => l !== center);
    const set = new Set(letters);
    const ok = (w) => w.length >= 4 && w.includes(center) && [...w].every((ch) => set.has(ch));
    // valid word list
    const valid = new Set();
    for (const w of dict()) { const u = w.toUpperCase(); if (ok(u)) valid.add(u); }
    (cfg.extraWords || []).forEach((w) => { const u = String(w).toUpperCase().replace(/[^A-Z]/g, ''); if (ok(u)) valid.add(u); });
    valid.add(pangram);
    const found = [];
    let cur = '', hints = 0, pts = 0, done = false;
    const hive = $('hive'), word = $('beeWord'), msg = $('beeMsg'), list = $('beeFound');
    function layout() {
      hive.innerHTML = '';
      const pos = [[88, 97], [88, 15], [159, 56], [159, 138], [88, 179], [17, 138], [17, 56]];
      [center, ...outer].forEach((l, i) => {
        const b = document.createElement('button'); b.className = 'hex' + (i === 0 ? ' center' : '');
        b.textContent = l; b.style.left = pos[i][0] + 'px'; b.style.top = pos[i][1] + 'px';
        b.onclick = () => add(l);
        hive.appendChild(b);
      });
    }
    function showWord() {
      word.innerHTML = '';
      for (const ch of cur) { const s = document.createElement('span'); s.textContent = ch; if (ch === center) s.className = 'c'; word.appendChild(s); }
    }
    function hintText() {
      const n = Math.min(pangram.length, Math.floor(found.length / 3) + hints);
      $('beeHint').textContent = 'PANGRAM: ' + pangram.split('').map((ch, i) => (i < n ? ch : '_')).join(' ');
      $('beeScore').textContent = '  ' + found.length + ' words · ' + pts + ' pts · ' + valid.size + ' possible';
    }
    function add(l) { if (done || cur.length >= 15) return; cur += l; MB.sfx.key(); showWord(); }
    function del() { cur = cur.slice(0, -1); showWord(); }
    function say(t, good) { msg.textContent = t; msg.style.color = good ? 'var(--lime)' : 'var(--pink)'; }
    function enter() {
      if (done) return;
      const w = cur; cur = ''; showWord();
      if (w.length < 4) return say('Too short', false), MB.sfx.bad();
      if (!w.includes(center)) return say('Missing the gold letter ' + center, false), MB.sfx.bad();
      if (found.includes(w)) return say('Already found', false), MB.sfx.bad();
      if (!valid.has(w)) return say('Not in the word list', false), MB.sfx.bad();
      found.push(w);
      const isP = w === pangram || new Set(w).size === 7;
      pts += (w.length === 4 ? 1 : w.length) + (isP ? 7 : 0);
      const s = document.createElement('span'); s.textContent = w; if (isP) s.className = 'p'; list.prepend(s);
      if (w === pangram) {
        done = true; say('PANGRAM! ' + pangram + ' 🐝', true); MB.sfx.win(); hintText();
        $('beeHint').textContent = '★ ' + pangram + ' ★';
        setTimeout(() => onEnd(true), 1600);
        return;
      }
      say(isP ? 'A pangram! But not THE special one…' : ['Nice!', 'Great!', 'Awesome!', 'Buzzing!'][found.length % 4] + ' +' + (w.length === 4 ? 1 : w.length), true);
      MB.sfx.good(); hintText();
    }
    function shuffle() { outer.sort(() => Math.random() - 0.5); layout(); }
    $('beeDel').onclick = del; $('beeEnter').onclick = enter; $('beeShuf').onclick = shuffle;
    $('beeHintBtn').onclick = () => { hints++; hintText(); MB.sfx.click(); };
    list.innerHTML = ''; msg.textContent = '';
    layout(); showWord(); hintText();
    this.onKey = (e) => {
      if (e.key === 'Enter') { enter(); e.preventDefault(); }
      else if (e.key === 'Backspace') { del(); e.preventDefault(); }
      else if (e.key === ' ') { shuffle(); e.preventDefault(); }
      else if (/^[a-zA-Z]$/.test(e.key) && set.has(e.key.toUpperCase())) add(e.key.toUpperCase());
    };
    this.type = (w) => { for (const ch of w) add(ch); enter(); };
    this.pangram = pangram; this.valid = valid;
  };

  // =====================================================================
  // WORD SMART TRIVIA
  // =====================================================================
  MB.showTrivia = function (q, done) {
    MB.show('trivia');
    $('trQ').textContent = q.question;
    const box = $('trChoices'); box.innerHTML = '';
    $('trFact').textContent = ''; $('trNext').style.display = 'none'; $('trSkip').style.display = '';
    let answered = false;
    (q.choices || []).forEach((ch, i) => {
      const b = document.createElement('button'); b.className = 'choice'; b.textContent = ch;
      b.onclick = () => {
        if (answered) return; answered = true;
        const right = i === q.answer;
        b.classList.add(right ? 'right' : 'wrong');
        if (!right && box.children[q.answer]) box.children[q.answer].classList.add('right');
        (right ? MB.sfx.good : MB.sfx.bad)();
        $('trFact').textContent = (right ? 'Correct! ' : 'Not quite! ') + (q.fact || '');
        $('trNext').style.display = ''; $('trSkip').style.display = 'none';
        done.answered = right;
      };
      box.appendChild(b);
    });
    $('trNext').onclick = () => { MB.sfx.click(); done(true); };
    $('trSkip').onclick = () => { MB.sfx.click(); done(false); };
  };
})();
