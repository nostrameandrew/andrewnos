/* Memory Breakout: game flow, screens, album, epilogue */
(function () {
  'use strict';
  const MB = window.MB, C = MB.C, $ = MB.$;
  const save = MB.loadSave();
  const MG = [
    { name: 'Dad-le', how: 'A Wordle-style word puzzle with a family twist. Guess the secret word in six tries: <b style="color:#7dff6a">green</b> letters are in the right spot, <b style="color:#ffd84a">gold</b> letters are in the word but somewhere else. Type or tap the keys.', kind: 'dom' },
    { name: 'Galaxy Guard: Memory Defense', how: 'Your ship guards the middle of the galaxy, with your memories orbiting around it. Aliens fly in from every side to steal them!<br><br><b style="color:#ffd84a">LASSO:</b> draw a loop around aliens (drag the mouse or your finger) to wipe out everything inside it.<br><b style="color:#ff5a6e">FIRE:</b> hold the FIRE button (or Space / F). Your lasers fire faster and faster and spread wider, but watch the heat meter: if it <b>overheats</b>, you have to wait for it to cool down.<br><br>New enemies keep arriving: <b>speeders</b>, <b>splitters</b>, <b>shielded</b> aliens (lasers bounce off, so lasso them!), <b>shooters</b> that jam your gun, <b>cloakers</b>, <b>tanks</b>, <b>swarms</b>, and a <b>Mothership</b>. Shoot or lasso the glowing power-up bubbles they drop.<br><br>Shoot or lasso a thief to get the photo back. Keep at least one memory safe for 90 seconds to win!', kind: 'canvas' },
    { name: 'Family Spelling Bee', how: 'Make words from the 7 letters. Every word must use the gold center letter. Each 3 words you find reveals another letter of the special <b style="color:#ffd84a">pangram</b> (a word that uses all 7). Find it to win! Hints are free.', kind: 'dom' },
    { name: 'Centipede: Mushroom Run', how: 'A neon centipede is winding through the mushroom field. Move inside the bottom zone (mouse, arrows/WASD or touch). You fire automatically. Shoot segments to split it up. Survive for 60 seconds!', kind: 'canvas' },
    { name: 'Memory Lane Ride', how: 'Hop on the e-bike and ride to the big <b style="color:#ffd84a">50</b>! Steer up and down (mouse, arrows or touch). Grab the floating photo bubbles to recharge your battery and dodge the trash. Make it to kilometer 50 before the battery dies.', kind: 'canvas' }
  ];
  MB.MG = MG;
  let mode = 'story'; // 'story' or 'replay'
  let current = null; // current level / minigame descriptor
  let domGame = null;

  // ---------- helpers ----------
  function totalCleared() { return save.cleared.filter(Boolean).length; }
  function updateTitle() {
    const info = MB.stepInfo(save.step);
    const cb = $('continueBtn');
    if (!save.started) { cb.textContent = '▶ Start'; }
    else if (info.type === 'level') cb.textContent = '▶ Continue: Level ' + (info.level + 1);
    else if (info.type === 'minigame') cb.textContent = '▶ Continue: ' + MG[info.chapter].name;
    else if (info.type === 'epilogue') cb.textContent = '▶ Continue: The Finale';
    else cb.textContent = '▶ Watch the finale again';
    $('newBtn').style.display = save.started ? '' : 'none';
    const eb = $('endlessBtn');
    eb.style.display = endlessUnlocked() ? '' : 'none';
    eb.textContent = '∞ Endless Modes';
    $('titleFrom').textContent = 'For ' + C.forName + (C.fromName ? ', with love from ' + C.fromName : '') + ' · ' + totalCleared() + '/50 memories unlocked';
  }
  function title() {
    MB.setScene(null); mode = 'story'; domGame = null;
    MB.$('mgButtons').style.display = 'none';
    stopConfetti(); $('collage').classList.remove('show');
    updateTitle(); MB.show('title');
  }
  MB.title = title;

  // ---------- story progression ----------
  function goStep(s) {
    mode = 'story';
    const info = MB.stepInfo(s);
    if (info.type === 'level') {
      if (info.level % 10 === 0) chapterCard(info.chapter, () => startLevel(info.level));
      else startLevel(info.level);
    } else if (info.type === 'minigame') mgIntro(info.chapter);
    else epilogue();
  }
  MB.goStep = goStep;
  function advanceTo(s) { if (s > save.step) save.step = s; save.started = true; MB.persist(); }

  function chapterCard(c, next) {
    MB.setScene(null);
    $('chapTag').textContent = 'CHAPTER ' + (c + 1) + ' OF 5';
    $('chapTitle').textContent = C.chapters[c].title;
    $('chapSub').textContent = C.chapters[c].subtitle || '';
    $('chapInfo').textContent = 'Levels ' + (c * 10 + 1) + '–' + (c * 10 + 10) + ' · then a bonus game: ' + MG[c].name;
    MB.show('chapter');
    $('chapGo').onclick = () => { MB.sfx.click(); next(); };
    // preload this chapter's thumbnails
    MB.queueThumbs([...Array(10)].map((_, i) => c * 10 + i), true);
  }

  // ---------- levels ----------
  function startLevel(li) {
    current = { type: 'level', li };
    MB.hideScreens();
    save.started = true; MB.persist();
    MB.setScene(new MB.Breakout(li, () => levelCleared(li), () => MB.show('lost')));
    MB.queueThumbs([li + 1, li + 2].filter((i) => i < 50));
  }
  MB.startLevel = startLevel;
  function levelCleared(li) {
    save.cleared[li] = true;
    if (mode === 'story') advanceTo(MB.levelStep(li) + 1); else MB.persist();
    MB.setScene(null);
    $('clearTag').textContent = 'MEMORY ' + (li + 1) + ' OF 50 UNLOCKED';
    const fr = $('clearPhoto'); fr.innerHTML = ''; fr.appendChild(MB.fullEl(li));
    $('clearCaption').textContent = C.photos[li].caption;
    $('clearScore').style.display = 'none';
    $('clearAlbumBtn').textContent = 'Album';
    $('clearAlbumBtn').onclick = () => { MB.sfx.click(); album(); };
    $('nextBtn').textContent = mode === 'replay' ? 'Back to album' : li === 49 ? 'The final ride ▶' : (li % 10 === 9 ? 'Bonus game ▶' : 'Next memory ▶');
    MB.show('clear');
    $('nextBtn').onclick = () => {
      MB.sfx.click();
      if (mode === 'replay') return album();
      const q = C.trivia.find((t) => t && Number(t.afterLevel) === li + 1);
      const next = () => goStep(MB.levelStep(li) + 1);
      if (q && !save.trivia[li + 1]) MB.showTrivia(q, (ans) => { save.trivia[li + 1] = true; MB.persist(); next(); });
      else next();
    };
  }
  $('retryBtn').onclick = () => { MB.sfx.click(); MB.hideScreens(); if (current && current.type === 'level') startLevel(current.li); };
  $('lostQuit').onclick = () => { MB.sfx.click(); title(); };
  $('skipLevelBtn').onclick = () => { MB.sfx.click(); if (current && current.type === 'level') levelCleared(current.li); };

  // ---------- ENDLESS MODE (unlocked after the finale) ----------
  // Endless rounds: each one hides a memory (all 50 in a shuffled cycle), with new layouts,
  // guys and score carried over, a bonus guy every 5 rounds, and a saved best run.
  let endless = null;
  function endlessUnlocked() { return !!save.epilogue || save.step >= 56; }
  MB.endlessUnlocked = endlessUnlocked;
  function shuffled() { const a = [...Array(50)].map((_, i) => i); for (let i = 49; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function startEndless() {
    endless = { round: 1, order: shuffled(), idx: 0, lives: 5, score: 0 };
    MB.endless = endless;
    endlessRound();
  }
  MB.startEndless = startEndless;
  function endlessRound() {
    if (endless.idx > 0 && endless.idx % 50 === 0) endless.order = shuffled(); // new cycle through all 50 memories
    const pi = endless.order[endless.idx % 50];
    endless.startLives = endless.lives; endless.startScore = endless.score;
    endless.seed = Math.floor(Math.random() * 1e9);
    current = { type: 'endless' }; mode = 'endless';
    MB.hideScreens(); stopConfetti(); $('collage').classList.remove('show');
    MB.setScene(new MB.Breakout(pi, () => endlessCleared(pi), () => endlessOver(),
      { round: endless.round, photo: pi, lives: endless.lives, score: endless.score, seed: endless.seed }));
    MB.queueThumbs([endless.order[(endless.idx + 1) % 50]]);
  }
  function saveBest() {
    const b = save.endlessBest;
    if (!b || endless.score > b.score) { save.endlessBest = { round: endless.round, score: endless.score }; MB.persist(); return true; }
    return false;
  }
  function endlessCleared(pi) {
    const sc = MB.scene;
    const bonus = 250 * endless.round;
    endless.lives = sc.lives; endless.score = sc.score + bonus;
    const cleared = endless.round;
    endless.round++; endless.idx++;
    let extra = '';
    if (cleared % 5 === 0 && endless.lives < 7) { endless.lives++; extra = ' · +1 bonus guy!'; }
    const newBest = saveBest();
    MB.setScene(null);
    $('clearTag').textContent = '∞ ROUND ' + cleared + ' CLEARED · MEMORY #' + (pi + 1);
    const fr = $('clearPhoto'); fr.innerHTML = ''; fr.appendChild(MB.fullEl(pi));
    $('clearCaption').textContent = C.photos[pi].caption;
    const cs = $('clearScore'); cs.style.display = '';
    cs.textContent = 'Round bonus +' + bonus.toLocaleString() + ' · Score ' + endless.score.toLocaleString() + extra + (newBest ? ' · NEW BEST!' : '');
    $('nextBtn').textContent = 'Round ' + endless.round + ' ▶';
    $('nextBtn').onclick = () => { MB.sfx.click(); endlessRound(); };
    $('clearAlbumBtn').textContent = 'Quit';
    $('clearAlbumBtn').onclick = () => { MB.sfx.click(); title(); };
    MB.show('clear');
  }
  function endlessOver() {
    lastEndless = 'breakout';
    $('eoTitleH').textContent = 'Out of guys!';
    const sc = MB.scene;
    if (sc && sc.score != null) endless.score = sc.score;
    const newBest = saveBest();
    const b = save.endlessBest;
    $('eoStats').textContent = 'You reached round ' + endless.round + ' with ' + endless.score.toLocaleString() + ' points.';
    $('eoBest').textContent = newBest ? '★ NEW BEST! ★' : 'Best: round ' + b.round + ' · ' + b.score.toLocaleString() + ' points';
    MB.show('endlessOver');
  }
  let lastEndless = 'breakout';
  $('eoAgain').onclick = () => { MB.sfx.click(); lastEndless === 'galaxy' ? startGalaxyEndless() : startEndless(); };
  $('eoAlbum').onclick = () => { MB.sfx.click(); album(); };
  $('eoTitle').onclick = () => { MB.sfx.click(); title(); };
  $('endlessBtn').onclick = () => { MB.sfx.click(); endlessPick(); };
  $('colEndless').onclick = () => { MB.sfx.click(); endlessPick(); };

  // the Endless Mode picker
  function endlessPick() {
    MB.setScene(null); stopConfetti(); $('collage').classList.remove('show');
    const b = save.endlessBest, gb = save.galaxyBest;
    $('epBestB').textContent = b ? 'Best: round ' + b.round + ' · ' + b.score.toLocaleString() + ' pts' : 'No best yet';
    $('epBestG').textContent = gb ? 'Best: wave ' + gb.wave + ' · ' + gb.score.toLocaleString() + ' pts' : 'No best yet';
    MB.show('endlessPick');
  }
  MB.endlessPick = endlessPick;
  $('epBreakout').onclick = () => { MB.sfx.click(); lastEndless = 'breakout'; startEndless(); };
  $('epGalaxy').onclick = () => { MB.sfx.click(); startGalaxyEndless(); };
  $('epBack').onclick = () => { MB.sfx.click(); title(); };

  // ---------- ENDLESS GALAXY GUARD ----------
  function startGalaxyEndless() {
    lastEndless = 'galaxy';
    current = { type: 'gendless' }; mode = 'endless';
    MB.hideScreens();
    MB.queueThumbs([10, 11, 12, 13, 14, 15], true);
    const sc = new MB.Galaxy(() => galaxyOver(sc), { endless: true });
    MB.setScene(sc);
    MB.$('mgButtons').style.display = 'flex';
    MB.resize();
  }
  MB.startGalaxyEndless = startGalaxyEndless;
  function galaxyOver(sc) {
    MB.$('mgButtons').style.display = 'none';
    MB.setScene(null);
    const b = save.galaxyBest;
    const newBest = !b || sc.score > b.score;
    if (newBest) { save.galaxyBest = { wave: sc.wave, score: sc.score }; MB.persist(); }
    const nb = save.galaxyBest;
    $('eoStats').textContent = 'Galaxy Guard: you reached wave ' + sc.wave + ' with ' + sc.score.toLocaleString() + ' points.';
    $('eoBest').textContent = newBest ? '★ NEW BEST! ★' : 'Best: wave ' + nb.wave + ' · ' + nb.score.toLocaleString() + ' points';
    $('eoTitleH').textContent = 'The memories were stolen!';
    MB.show('endlessOver');
  }

  // ---------- pause ----------
  function pause() {
    if (!MB.scene.pausable || MB.paused) return;
    MB.paused = true; MB.show('pause');
  }
  function resume() { MB.paused = false; MB.hideScreens(); }
  $('pauseBtn').onclick = (e) => { e.stopPropagation(); MB.sfx.click(); pause(); };
  $('resumeBtn').onclick = () => { MB.sfx.click(); resume(); };
  $('restartBtn').onclick = () => {
    MB.sfx.click(); MB.paused = false; MB.hideScreens();
    if (current.type === 'level') startLevel(current.li);
    else if (current.type === 'endless') { endless.lives = endless.startLives; endless.score = endless.startScore; endlessRound(); }
    else if (current.type === 'gendless') startGalaxyEndless();
    else startCanvasMg(current.c);
  };
  $('quitBtn').onclick = () => { MB.sfx.click(); MB.paused = false; title(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  // ---------- minigames ----------
  function mgIntro(c) {
    MB.setScene(null);
    current = { type: 'mg', c };
    $('mgTag').textContent = 'BONUS GAME ' + (c + 1) + ' OF 5 · A TRIBUTE TO YOUR ' + ['WORDLE', 'GALAXY GUARD', 'SPELLING BEE', 'CENTIPEDE', 'PLAYA SUCIA'][c];
    $('mgTitle').textContent = MG[c].name;
    $('mgHow').innerHTML = MG[c].how;
    $('mgSkip').style.display = mode === 'story' ? '' : 'none';
    MB.show('mgIntro');
    $('mgStart').onclick = () => { MB.sfx.click(); startMg(c); };
    $('mgSkip').onclick = () => { MB.sfx.click(); mgDone(c, false, true); };
    if (c === 1) MB.queueThumbs([10, 11, 12, 13, 14], true);
  }
  MB.mgIntro = mgIntro;
  function startMg(c) {
    current = { type: 'mg', c };
    if (MG[c].kind === 'canvas') return startCanvasMg(c);
    MB.setScene(null);
    const end = (win) => { domGame = null; mgDone(c, win); };
    if (c === 0) { domGame = new MB.Dadle(end); MB.show('dadle'); }
    if (c === 2) { domGame = new MB.Bee(end); MB.show('bee'); }
    MB.domGame = domGame;
  }
  MB.startMg = startMg;
  function startCanvasMg(c) {
    current = { type: 'mg', c };
    MB.hideScreens();
    const end = (win) => { MB.$('mgButtons').style.display = 'none'; mgDone(c, win); };
    const Ctor = c === 1 ? MB.Galaxy : c === 3 ? MB.Centipede : MB.Ride;
    MB.setScene(new Ctor(end));
    MB.$('mgButtons').style.display = c === 1 ? 'flex' : 'none';
    MB.resize();
  }
  // FIRE button for Galaxy Guard: hold to fire (works alongside drawing a lasso with another finger)
  const fb = $('fireBtn');
  const fire = (on) => (e) => { e.stopPropagation(); e.preventDefault(); fb.classList.toggle('held', on); if (MB.scene.setFire) MB.scene.setFire(on); };
  fb.addEventListener('pointerdown', (e) => { try { fb.setPointerCapture(e.pointerId); } catch (err) {} fire(true)(e); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => fb.addEventListener(ev, fire(false)));
  fb.addEventListener('contextmenu', (e) => e.preventDefault());
  $('dadleQuit').onclick = $('beeQuit').onclick = () => { MB.sfx.click(); domGame = null; MB.domGame = null; if (mode === 'replay') album(); else mgIntro(current.c); };

  function mgDone(c, win, skipped) {
    MB.setScene(null);
    if (win) save.mg[c] = true;
    if ((mode === 'story' && (win || skipped)) || (win && save.step === MB.mgStep(c))) advanceTo(MB.mgStep(c) + 1);
    MB.persist();
    if (skipped) { MB.toast('Skipped. Replay it any time from the Album to unlock the message.'); return afterMg(c); }
    $('mgrTag').textContent = win ? 'BONUS MESSAGE UNLOCKED' : 'SO CLOSE!';
    $('mgrTitle').textContent = win ? MG[c].name + ': cleared!' : 'Try again?';
    $('mgrSub').textContent = win ? 'A message for you:' : 'These games are meant to be beatable. Give it another go!';
    const bee = C.spellingBee || {};
    if (win && c === 2 && bee.meaning) $('mgrSub').textContent = '★ ' + String(bee.pangram || '').toUpperCase() + ' ★  ' + bee.meaning;
    $('mgrMsg').textContent = win ? (C.bonusMessages[c] || '') : '';
    $('mgrMsg').style.display = win ? '' : 'none';
    $('mgrNext').style.display = win ? '' : 'none';
    $('mgrRetry').style.display = win ? 'none' : '';
    $('mgrSkip').style.display = !win && mode === 'story' ? '' : 'none';
    $('mgrSkip').textContent = 'Skip for now';
    if (!win && mode === 'replay') { $('mgrSkip').style.display = ''; $('mgrSkip').textContent = 'Back to album'; }
    $('mgrNext').textContent = mode === 'replay' ? 'Back to album' : c === 4 ? 'The finale ❤️' : 'Next chapter ▶';
    MB.show('mgResult');
    $('mgrNext').onclick = () => { MB.sfx.click(); afterMg(c); };
    $('mgrRetry').onclick = () => { MB.sfx.click(); startMg(c); };
    $('mgrSkip').onclick = () => { MB.sfx.click(); if (mode === 'replay') return album(); mgDone(c, false, true); };
  }
  function afterMg(c) {
    if (mode === 'replay') return album();
    goStep(MB.mgStep(c) + 1);
  }

  // ---------- album ----------
  let viewIdx = 0;
  function album() {
    MB.setScene(null); mode = 'story';
    stopConfetti(); $('collage').classList.remove('show');
    const grid = $('albumGrid'); grid.innerHTML = '';
    const unlockedList = [];
    for (let i = 0; i < 50; i++) {
      const t = document.createElement('button');
      const open = save.cleared[i];
      t.className = 'tile' + (open ? '' : ' locked');
      if (open) {
        unlockedList.push(i);
        t.appendChild(MB.thumbEl(i));
        t.onclick = () => { MB.sfx.click(); viewer(i); };
        t.title = C.photos[i].caption;
      } else { const s = document.createElement('div'); s.className = 'sil'; s.textContent = i === 49 ? '🏈' : '♥'; t.appendChild(s); t.disabled = true; }
      const n = document.createElement('div'); n.className = 'num'; n.textContent = i + 1; t.appendChild(n);
      grid.appendChild(t);
    }
    $('albumCount').textContent = unlockedList.length + '/50 unlocked';
    const mg = $('albumMg'); mg.innerHTML = '';
    MG.forEach((m, c) => {
      const reached = save.step >= MB.mgStep(c);
      const d = document.createElement('div'); d.className = 'mgTile';
      d.innerHTML = '<b>' + (reached ? m.name : '🔒 Bonus game ' + (c + 1)) + '</b><span class="small">' + (save.mg[c] ? '★ Won · message unlocked' : reached ? 'Not won yet' : 'Clear level ' + (c * 10 + 10) + ' to unlock') + '</span><br>';
      if (reached) {
        const p = document.createElement('button'); p.className = 'btn alt'; p.textContent = '▶ Play';
        p.onclick = () => { MB.sfx.click(); mode = 'replay'; mgIntro(c); }; d.appendChild(p);
      }
      if (save.mg[c]) {
        const r = document.createElement('button'); r.className = 'btn'; r.textContent = '✉ Message';
        r.onclick = () => { MB.sfx.click(); $('msgTitle').textContent = m.name; $('msgText').textContent = C.bonusMessages[c] || ''; MB.show('msgView'); };
        d.appendChild(r);
      }
      mg.appendChild(d);
    });
    const epi = $('albumEpi'); epi.innerHTML = '';
    const d = document.createElement('div'); d.className = 'mgTile';
    d.innerHTML = '<b>' + (save.epilogue ? 'The Finale' : '🔒 The Finale') + '</b><span class="small">' + (save.epilogue ? 'The note and the 50-photo collage' : 'Finish the Memory Lane Ride to unlock') + '</span><br>';
    if (save.epilogue) { const b = document.createElement('button'); b.className = 'btn'; b.textContent = '❤️ Watch again'; b.onclick = () => { MB.sfx.click(); epilogue(true); }; d.appendChild(b); }
    epi.appendChild(d);
    const en = document.createElement('div'); en.className = 'mgTile';
    en.innerHTML = '<b>' + (endlessUnlocked() ? '∞ Endless Modes' : '🔒 ∞ Endless Modes') + '</b><span class="small">' + (endlessUnlocked() ? 'Endless Memory Breakout and Endless Galaxy Guard' : 'Unlocks after the finale') + '</span><br>';
    if (endlessUnlocked()) { const b = document.createElement('button'); b.className = 'btn alt'; b.textContent = '▶ Play'; b.onclick = () => { MB.sfx.click(); endlessPick(); }; en.appendChild(b); }
    epi.appendChild(en);
    MB.queueThumbs(unlockedList, true);
    MB.show('album');
    $('album').scrollTop = 0;
  }
  MB.album = album;
  $('msgClose').onclick = () => { MB.sfx.click(); MB.show('album'); };
  function viewer(i) {
    viewIdx = i;
    $('viewTag').textContent = 'MEMORY ' + (i + 1) + ' OF 50';
    const fr = $('viewPhoto'); fr.innerHTML = ''; fr.appendChild(MB.fullEl(i));
    $('viewCaption').textContent = C.photos[i].caption;
    MB.show('viewer');
  }
  function viewStep(d) {
    let i = viewIdx;
    for (let k = 0; k < 50; k++) { i = (i + d + 50) % 50; if (save.cleared[i]) return viewer(i); }
  }
  $('viewPrev').onclick = () => { MB.sfx.click(); viewStep(-1); };
  $('viewNext').onclick = () => { MB.sfx.click(); viewStep(1); };
  $('viewClose').onclick = () => { MB.sfx.click(); MB.show('album'); };
  $('viewReplay').onclick = () => { MB.sfx.click(); mode = 'replay'; startLevel(viewIdx); };
  $('albumBack').onclick = () => { MB.sfx.click(); title(); };

  // ---------- epilogue ----------
  let typeTimer = null;
  function epilogue(replay) {
    mode = replay ? 'replay' : 'story';
    MB.setScene(null);
    if (!replay) { save.epilogue = true; advanceTo(56); }
    MB.queueThumbs([...Array(50)].map((_, i) => i), true);
    MB.show('epilogue');
    const el = $('noteText'); el.textContent = '';
    $('noteNext').style.visibility = 'hidden';
    const text = String(C.finalNote || '');
    let i = 0;
    clearInterval(typeTimer);
    const sig = document.createElement('span'); sig.className = 'sig'; sig.textContent = C.finalSignature || '';
    const finishType = () => {
      clearInterval(typeTimer); el.textContent = text; el.appendChild(sig);
      $('noteNext').style.visibility = 'visible';
    };
    typeTimer = setInterval(() => {
      i += 1;
      el.textContent = text.slice(0, i);
      if (i % 3 === 0) MB.sfx.key();
      if (i >= text.length) finishType();
    }, 38);
    el.onclick = finishType; // tap to show all
    $('noteNext').onclick = () => { MB.sfx.click(); collage(); };
  }
  MB.epilogue = epilogue;
  function collage() {
    clearInterval(typeTimer);
    MB.hideScreens();
    const cg = $('collageGrid'); cg.innerHTML = '';
    const els = [];
    for (let i = 0; i < 50; i++) { const e = MB.thumbEl(i); cg.appendChild(e); els.push(e); }
    $('collageTitle').textContent = C.finalHeadline || 'Happy 50th Birthday, Dad ❤️';
    $('collageTitle').classList.remove('in'); $('collageBtns').style.opacity = 0;
    $('collage').classList.add('show');
    // fade in together, in a gentle wave
    els.forEach((e, i) => setTimeout(() => e.classList.add('in'), 300 + (i % 10) * 90 + Math.floor(i / 10) * 140));
    setTimeout(() => { $('collageTitle').classList.add('in'); startConfetti(); MB.sfx.win(); }, 1600);
    setTimeout(() => { $('collageBtns').style.opacity = 1; MB.toast('∞ Endless Modes unlocked!', 3500); }, 3200);
  }
  $('colAlbum').onclick = () => { MB.sfx.click(); album(); };
  $('colTitle').onclick = () => { MB.sfx.click(); title(); };

  // confetti
  const cc = $('confetti'), cg = cc.getContext('2d');
  let conf = [], confOn = false, confRaf = 0;
  function startConfetti() {
    cc.width = innerWidth; cc.height = innerHeight; cc.style.display = 'block';
    conf = [];
    for (let i = 0; i < 220; i++) conf.push(piece(true));
    confOn = true; cancelAnimationFrame(confRaf); confLoop();
  }
  function piece(init) {
    return { x: Math.random() * cc.width, y: init ? -Math.random() * cc.height : -20, vx: MB.rand(-40, 40), vy: MB.rand(60, 160),
      r: Math.random() * 6, vr: MB.rand(-6, 6), s: MB.rand(6, 12), c: ['#ff3fa4', '#29f0ff', '#ffd84a', '#7dff6a', '#a86bff', '#ffffff'][Math.floor(Math.random() * 6)], heart: Math.random() < 0.15 };
  }
  let confLast = 0;
  function confLoop(now) {
    if (!confOn) return;
    const dt = Math.min(0.05, ((now || 0) - confLast) / 1000 || 0.016); confLast = now || 0;
    cg.clearRect(0, 0, cc.width, cc.height);
    for (const p of conf) {
      p.x += p.vx * dt + Math.sin(p.y * 0.02) * 0.6; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.y > cc.height + 20) Object.assign(p, piece(false));
      cg.save(); cg.translate(p.x, p.y); cg.rotate(p.r); cg.fillStyle = p.c;
      if (p.heart) { cg.font = p.s * 1.6 + 'px sans-serif'; cg.fillText('❤', -p.s / 2, p.s / 2); }
      else cg.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      cg.restore();
    }
    confRaf = requestAnimationFrame(confLoop);
  }
  function stopConfetti() { confOn = false; cancelAnimationFrame(confRaf); cc.style.display = 'none'; }

  // ---------- title buttons ----------
  $('continueBtn').onclick = () => {
    MB.sfx.click();
    if (save.step >= 56) return epilogue(true);
    goStep(save.step);
  };
  $('newBtn').onclick = () => { MB.sfx.click(); MB.show('confirm'); };
  $('confirmYes').onclick = () => {
    MB.sfx.click();
    MB.resetSave(); Object.assign(save, MB.save); MB.save = save;
    save.started = true; MB.persist();
    goStep(0);
  };
  $('confirmNo').onclick = () => { MB.sfx.click(); title(); };
  $('albumBtn').onclick = () => { MB.sfx.click(); album(); };
  $('muteBtn').onclick = (e) => { e.stopPropagation(); MB.audio.init(); MB.audio.setMuted(!MB.audio.muted); };
  MB.audio.setMuted(MB.audio.muted);

  // ---------- keyboard ----------
  MB.onKey = function (e) {
    if (e.key === 'm' || e.key === 'M') { if (!domGame) { MB.audio.setMuted(!MB.audio.muted); return; } }
    if (domGame && domGame.onKey) { domGame.onKey(e); return; }
    if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && MB.scene.pausable) { MB.paused ? resume() : pause(); }
  };

  // ---------- go ----------
  MB.start();
  title();
  // background-load thumbnails of unlocked photos first, then the rest
  const unlocked = [], rest = [];
  for (let i = 0; i < 50; i++) (save.cleared[i] ? unlocked : rest).push(i);
  setTimeout(() => MB.queueThumbs(unlocked.concat(rest)), 400);

  // photo checker on the title screen: tells you which photo files it could not find
  const pc = $('photoCheck');
  const checkPhotos = () => {
    const done = MB.photos.filter((p) => p.ok !== null).length;
    const missing = MB.photos.filter((p) => p.ok === false).map((p) => String(p.i + 1).padStart(2, '0'));
    if (done < 50) { pc.textContent = '📷 Checking photos… ' + done + '/50'; setTimeout(checkPhotos, 500); return; }
    if (!missing.length) { pc.textContent = '📷 All 50 photos found ✓'; pc.style.color = 'var(--lime)'; }
    else { pc.textContent = '📷 ' + (50 - missing.length) + '/50 photos found. Missing: ' + missing.join(', ') + ' (check the photos folder and the file names in content.js)'; pc.style.color = 'var(--gold)'; }
  };
  checkPhotos();
})();
