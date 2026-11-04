(() => {
  const section = document.querySelector('.tear');
  const stage = section.querySelector('.stage');
  const paper = document.getElementById('paper');
  const L = document.getElementById('halfL');
  const R = document.getElementById('halfR');
  const sheetL = L.querySelector('.sheet'), sheetR = R.querySelector('.sheet');
  const fibL = L.querySelector('.fiber'), fibR = R.querySelector('.fiber');
  const guide = document.getElementById('guide'), guideLine = document.getElementById('guideLine');
  const cut = document.getElementById('cut');
  const cutter = document.getElementById('cutter'), avatar = document.getElementById('avatar'), bubble = document.getElementById('bubble');
  const cssv = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  // one shared 2D avatar for now; per-person avatars can replace this later
  (() => {
    const ink = cssv('--ink'), bone = cssv('--paper'), volt = cssv('--volt'), lilac = cssv('--lilac');
    avatar.innerHTML =
      '<rect x="26" y="38" width="28" height="30" rx="10" fill="' + lilac + '" stroke="' + ink + '" stroke-width="2"/>' +
      '<path d="M29 45 Q26 58 35 65" fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M51 45 Q54 58 45 65" fill="none" stroke="' + ink + '" stroke-width="3" stroke-linecap="round"/>' +
      '<g class="face-cartoon">' +
      '<circle cx="40" cy="24" r="14" fill="' + bone + '" stroke="' + ink + '" stroke-width="2"/>' +
      '<path d="M26.5 21 Q30 9 40 10 Q50 9 53.5 21 Q46 15 40 16.5 Q34 15 26.5 21 Z" fill="' + ink + '"/>' +
      '<circle cx="35" cy="25" r="1.9" fill="' + ink + '"/><circle cx="45" cy="25" r="1.9" fill="' + ink + '"/>' +
      '<path d="M35 30 Q40 34 45 30" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>' +
      '</g>' +
      // the picked person's photo as a bobblehead face
      '<g class="face-photo" display="none">' +
      '<defs><clipPath id="faceClip"><circle cx="40" cy="19" r="17.5"/></clipPath></defs>' +
      '<circle cx="40" cy="19" r="18" fill="' + bone + '"/>' +
      // zoomed 1.6x on the upper middle of the headshot, where the face sits
      '<image class="face-img" x="11.2" y="-5.2" width="57.6" height="57.6" preserveAspectRatio="xMidYMid slice" clip-path="url(#faceClip)"/>' +
      '<circle cx="40" cy="19" r="18" fill="none" stroke="' + ink + '" stroke-width="2.5"/>' +
      '</g>' +
      '<g class="blade-a"><circle cx="34.5" cy="68" r="4.6" fill="none" stroke="' + volt + '" stroke-width="3"/><path d="M36.5 71.5 L41.5 76.5 L40.6 98 L38.8 77.5 Z" fill="' + bone + '" stroke="' + ink + '" stroke-width="1.2" stroke-linejoin="round"/></g>' +
      '<g class="blade-b"><circle cx="45.5" cy="68" r="4.6" fill="none" stroke="' + volt + '" stroke-width="3"/><path d="M43.5 71.5 L38.5 76.5 L39.4 98 L41.2 77.5 Z" fill="' + bone + '" stroke="' + ink + '" stroke-width="1.2" stroke-linejoin="round"/></g>' +
      '<circle cx="40" cy="76" r="1.7" fill="' + ink + '"/>';
  })();
  const bladeA = avatar.querySelector('.blade-a'), bladeB = avatar.querySelector('.blade-b');
  const faceCartoon = avatar.querySelector('.face-cartoon'), facePhoto = avatar.querySelector('.face-photo'), faceImg = avatar.querySelector('.face-img');
  // show the picked person's photo on the cutter, or the cartoon face when there is none
  function setAvatarFace(url, photo) {
    if (!url) { facePhoto.setAttribute('display', 'none'); faceCartoon.removeAttribute('display'); faceImg.removeAttribute('href'); return; }
    const face = photo && photo.face;
    if (face && photo.width && photo.height) {
      // scale the photo so the detected face spans about 62% of the 36-unit head, centred on it
      const W = 22.5 / face.w, H = W * photo.height / photo.width;
      faceImg.setAttribute('preserveAspectRatio', 'none');
      faceImg.setAttribute('width', W.toFixed(2)); faceImg.setAttribute('height', H.toFixed(2));
      faceImg.setAttribute('x', (40 - face.cx * W).toFixed(2)); faceImg.setAttribute('y', (19 - face.cy * H).toFixed(2));
    } else {
      faceImg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
      faceImg.setAttribute('width', '57.6'); faceImg.setAttribute('height', '57.6'); faceImg.setAttribute('x', '11.2'); faceImg.setAttribute('y', '-5.2');
    }
    faceImg.setAttribute('href', url); facePhoto.removeAttribute('display'); faceCartoon.setAttribute('display', 'none');
  }
  const LINES = { founders: 'Show me what shipped.', india_team: 'Campaigns over CVs.', india_launch: 'Show me the idea in action.', early_team: 'Show me the build.', leadership: 'Less PDF, more signal.', curious: 'Ooh, scissors.' };
  const hint = document.getElementById('hint');
  const cleanEl = document.getElementById('clean'), cleanTop = document.getElementById('cleanTop'), cleanDone = document.getElementById('cleanDone');
  const cleanTitle = document.getElementById('cleanTitle'), cleanEyebrow = document.getElementById('cleanEyebrow'), floorCount = document.getElementById('floorCount');
  const scrapsEl = document.getElementById('scraps'), ballsEl = document.getElementById('balls');
  const binBack = document.getElementById('binBack'), binFront = document.getElementById('binFront');
  const hudBar = document.getElementById('hudBar');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  sheetR.innerHTML = sheetL.innerHTML;
  R.hidden = false;

  const fmt = (pts) => pts.map(([x, y]) => x.toFixed(2) + '% ' + y.toFixed(2) + '%').join(', ');
  const clip = (el, poly) => { el.style.clipPath = poly; el.style.webkitClipPath = poly; };

  const TR = { pts: [], fjL: [], fjR: [] };
  function tearXAt(y) {
    const pts = TR.pts;
    for (let i = 1; i < pts.length; i++) {
      if (pts[i][1] >= y) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; const k = Math.max(0, Math.min(1, (y - y0) / ((y1 - y0) || 1))); return x0 + (x1 - x0) * k; }
    }
    return pts[pts.length - 1][0];
  }
  function applyCut(t) {
    // the slit is open above the cut point and closed below it
    const cutY = -2 + t * 104, maxGap = 0.4 + t * 3.4;
    const off = (y) => { const d = cutY - y; return d <= 0 ? 0 : maxGap * Math.min(1, d / 35); };
    const lp = [], rp = [], lf = [], rf = [];
    TR.pts.forEach(([x, y], i) => {
      const o = off(y), k = Math.min(1, o / 0.6);
      lp.push([x - o, y]); rp.push([x + o - Math.max(0, 0.3 - o), y]);
      lf.push([x - o + Math.min(TR.fjL[i] * k, o * 1.9), y]); rf.push([x + o - Math.min(TR.fjR[i] * k, o * 1.9), y]);
    });
    clip(sheetL, 'polygon(-25% -10%, ' + fmt(lp) + ', -25% 110%)');
    clip(sheetR, 'polygon(125% -10%, ' + fmt(rp) + ', 125% 110%)');
    clip(fibL, 'polygon(0% 0%, ' + fmt(lf) + ', 0% 100%)');
    clip(fibR, 'polygon(100% 0%, ' + fmt(rf) + ', 100% 100%)');
    const cy = Math.max(0, Math.min(100, cutY)), cx = tearXAt(cy);
    const ahead = [[cx, cy]].concat(TR.pts.filter(([, y]) => y > cy));
    guideLine.setAttribute('points', ahead.map(([x, y]) => x.toFixed(2) + ',' + Math.max(0, Math.min(100, y)).toFixed(2)).join(' '));
    return { x: cx, y: cy };
  }

  function buildTear() {
    const N = 30, pts = [];
    let x = 50;
    for (let i = 0; i <= N; i++) {
      const y = -1 + i * (102 / N);
      x += (Math.random() - 0.5) * 3.4;
      x = Math.max(43, Math.min(57, x));
      pts.push([x + (Math.random() - 0.5) * 1.6, y]);
    }
    TR.pts = pts;
    TR.fjL = pts.map(() => 0.5 + Math.random() * 1.2);
    TR.fjR = pts.map(() => 0.5 + Math.random() * 1.2);
    applyCut(0);
    cut.style.left = pts[0][0] + '%';
  }

  const TEAR_END = 0.5, C_START = 0.5, C_LEN = 0.47;
  const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const scrollable = () => Math.max(1, section.offsetHeight - stage.offsetHeight);
  const sectionTop = () => section.getBoundingClientRect().top + window.scrollY;

  let curP = 0;
  function frame() {
    const pa = Math.min(1, Math.max(0, -section.getBoundingClientRect().top / scrollable()));
    curP = pa;
    const p = Math.min(1, pa / TEAR_END);
    const strike = smooth(0.005, 0.09, p);
    const tension = smooth(0.07, 0.13, p);
    const t = smooth(0.11, 0.55, p);
    paper.style.setProperty('--s', strike.toFixed(3));
    const cp = applyCut(t);
    const fo = String(smooth(0.1, 0.12, p));
    fibL.style.opacity = fo; fibR.style.opacity = fo;

    const shake = Math.sin(p * 260) * tension * (1 - t) * 3;

    // the avatar rides the cut point
    const ap = smooth(0.04, 0.1, p), ex = smooth(0.55, 0.62, p);
    cutter.style.left = cp.x + '%'; cutter.style.top = cp.y + '%';
    cutter.style.opacity = String(ap * (1 - ex));
    cutter.style.transform = 'translate(-50%,' + (-96 - (1 - ap) * 40 - ex * 70) + '%)';
    const snip = t > 0 && t < 1 ? Math.abs(Math.sin(p * 190)) : 0.35;
    bladeA.setAttribute('transform', 'rotate(' + (3 + snip * 16) + ' 40 76)');
    bladeB.setAttribute('transform', 'rotate(' + (-3 - snip * 16) + ' 40 76)');
    bubble.style.opacity = String(smooth(0.12, 0.16, p) * (1 - smooth(0.47, 0.53, p)));

    cut.style.opacity = String(1 - smooth(0.03, 0.07, p));
    guide.style.opacity = String(1 - smooth(0.5, 0.55, p));
    hint.style.opacity = String(1 - smooth(0.55, 0.62, p));
    hint.style.visibility = p > 0.62 ? 'hidden' : 'visible';

    cleanEl.style.opacity = String(0.18 + 0.82 * smooth(0.25, 0.75, p));
    const st = layoutClean(p, pa, shake);
    cleanTop.style.opacity = String(smooth(0.92, 1, p));
    const done = st.c > 0.97;
    cleanTitle.textContent = done ? 'Spotless. Thanks for the help.' : 'Before we start, let me be a good boy and throw this in the dustbin.';
    cleanEyebrow.textContent = done ? 'floor clean' : 'scroll to clean up';
    floorCount.textContent = String(st.left);
    cleanDone.style.opacity = String(smooth(0.97, 1, st.c));
    cleanDone.classList.toggle('live', done);
    cleanDone.inert = !done;

    hudBar.style.width = (pa * 100) + '%';
  }

  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  // ---------- Chapter 1, scene 1: tap-through explainer (art, timeline and cues live in js/chapter1.js) ----------
  // Each beat plays its slice of the timeline, then waits. A tap on the scene, Space or Enter plays the next one.
  const ch1Sec = document.getElementById('chapter1'), ch1Stage = document.getElementById('ch1Stage');
  const ch1Next = document.getElementById('ch1Next'), ch1NextLabel = document.getElementById('ch1NextLabel');
  const ch1Prompt = document.getElementById('ch1Prompt');
  const ch1Dots = [...document.querySelectorAll('#ch1Dots button')];
  const ch1 = window.Story ? Story.mount(ch1Stage) : null;
  const BEATS = window.Story ? Story.CARDS : [];
  let beat = -1, ch1T = 0, ch1Prev = 0, ch1Playing = false, ch1Last = 0, ch1Visible = false, ch1BeatDone = false, ch1Frame = 0;
  function ch1Ui() {
    ch1Dots.forEach((d, i) => { d.classList.toggle('on', i <= beat); d.setAttribute('aria-current', i === beat ? 'step' : 'false'); });
    const complete = ch1BeatDone && beat === BEATS.length - 1, ready = ch1BeatDone && !complete;
    ch1Next.disabled = !ch1BeatDone;
    ch1Next.classList.toggle('ready', ch1BeatDone);
    ch1Stage.classList.toggle('ready', ch1BeatDone);
    ch1NextLabel.textContent = complete ? 'My first 30 days' : ready ? 'Next' : ch1Playing ? 'Playing…' : 'Paused';
    ch1Prompt.textContent = complete ? 'Two ideas I’d explore with the Wispr team.' : ready ? 'Press Space or Enter, or tap Next.' : ch1Playing ? 'Scene ' + (beat + 1) + ' of ' + BEATS.length + '. Choose a slide above to jump.' : 'Return to the story to keep watching.';
  }
  function playBeat(i) {
    cancelAnimationFrame(ch1Frame);
    if (window.Story) Story.hush();
    beat = i; ch1T = BEATS[i][0]; ch1Prev = ch1T - 0.001;
    ch1BeatDone = false; ch1Playing = true; ch1Last = performance.now();
    ch1Ui();
    ch1Frame = requestAnimationFrame(ch1Loop);
  }
  function ch1Loop(now) {
    if (!ch1Playing) return;
    const end = BEATS[beat][1];
    ch1T = Math.min(end, ch1T + (now - ch1Last) / 1000); ch1Last = now;
    ch1.render(ch1T); ch1.fire(ch1Prev, ch1T); ch1Prev = ch1T;
    if (ch1T >= end && Story.narrationDone()) { ch1Playing = false; ch1BeatDone = true; ch1Ui(); return; }
    ch1Frame = requestAnimationFrame(ch1Loop);
  }
  function ch1Advance() {
    if (!ch1 || !ch1BeatDone || ch1Playing) return;
    sfxUi(true);
    if (beat === BEATS.length - 1) { window.Ideas.open(); return; }
    playBeat(beat + 1);
  }
  document.getElementById('ideas').addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (button) sfxUi(button.id === 'ideasNext');
  });
  function pauseChapter() {
    if (!ch1Playing) return;
    ch1Playing = false;
    cancelAnimationFrame(ch1Frame);
    if (window.Story) Story.hush();
    ch1Ui();
  }
  ch1Dots.forEach((dot, i) => dot.addEventListener('click', () => { sfxUi(true); ch1Sec.scrollIntoView({ behavior: 'auto' }); playBeat(i); }));
  ch1Stage.addEventListener('click', ch1Advance);
  ch1Next.addEventListener('click', ch1Advance);
  document.addEventListener('keydown', (e) => {
    if (!ch1Visible || (e.key !== ' ' && e.key !== 'Enter')) return;
    if (e.repeat) { e.preventDefault(); return; }
    const control = e.target.closest && e.target.closest('button, a, input, textarea, select');
    if (control && control !== ch1Next) return;
    e.preventDefault();
    ch1Advance();
  });
  if (ch1 && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      ch1Visible = entries[0].isIntersecting;
      if (!ch1Visible) { pauseChapter(); return; }
      if (!document.hidden && !ch1BeatDone) playBeat(Math.max(0, beat));
    }, { threshold: 0.6 }).observe(ch1Sec);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseChapter();
    else if (ch1 && ch1Visible && !ch1BeatDone) playBeat(Math.max(0, beat));
  });

  // tiles
  const pick = document.getElementById('pick'), teamTiles = document.getElementById('teamTiles');
  const teamStatus = document.getElementById('teamStatus'), playerTile = document.getElementById('playerTile');
  const startLabel = document.getElementById('startLabel');
  const teamUrl = new URL('public/assets/wispr/team.json?v=20261104-roster7', document.baseURI);
  let team = null, picked = 'curious';
  fetch(teamUrl).then((response) => {
    if (!response.ok) throw new Error('Team data unavailable');
    return response.json();
  }).then((data) => {
    team = data;
    const cards = document.createDocumentFragment();
    team.people.forEach((person) => {
      const tile = playerTile.content.firstElementChild.cloneNode(true);
      tile.dataset.id = person.id;
      tile.dataset.name = person.display_name || person.name;
      tile.dataset.group = person.group;
      tile.querySelector('.fallback').textContent = person.initials;
      tile.querySelector('.name').textContent = person.display_name || person.name;
      tile.querySelector('.blurb').textContent = person.role.split(';')[0].replace(' (self-described scope)', '');
      const portrait = tile.querySelector('.portrait');
      portrait.addEventListener('error', () => { portrait.hidden = true; }, { once: true });
      portrait.src = new URL(person.photo.path, teamUrl).href;
      cards.appendChild(tile);
    });
    teamTiles.appendChild(cards);
    teamStatus.hidden = true;
  }).catch(() => {
    teamStatus.textContent = 'The team cards couldn’t load. You can still continue as Just curious.';
  });
  pick.addEventListener('click', (event) => {
    const tile = event.target.closest('.tile, #visitor');
    if (!tile) return;
    sfxUi();
    pick.querySelectorAll('.tile, #visitor').forEach((o) => {
      const on = o === tile;
      o.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    picked = tile.dataset.id;
    const who = team && team.people.find((p) => p.id === picked);
    setAvatarFace(who && who.photo && who.photo.path ? new URL(who.photo.path, teamUrl).href : null, who && who.photo);
    startLabel.textContent = 'Press start as ' + tile.dataset.name;
    bubble.textContent = LINES[tile.dataset.group || tile.dataset.id];
    if (tile.classList.contains('tile')) tile.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
  });

  // ---------- Personalised loader: a short "preparing your game" beat with one sourced fact ----------
  const loader = document.getElementById('loader'), loaderCard = document.getElementById('loaderCard');
  const loaderTitle = document.getElementById('loaderTitle'), loadRing = document.getElementById('loadRing');
  const dossierImg = document.getElementById('dossierImg'), dossierInitials = document.getElementById('dossierInitials');
  const factText = document.getElementById('factText'), loadGo = document.getElementById('loadGo');
  const startBtn = document.getElementById('start');
  const CHALLENGE_URL = 'https://wispr-seven-day-challenge.wispr-flow-5934.chatgpt.site/';
  let loadTimer = null;
  dossierImg.addEventListener('error', () => { dossierImg.hidden = true; });
  function openLoader() {
    sfxUi(true);
    const person = team && team.people.find((p) => p.id === picked);
    const full = person ? (person.display_name || person.name) : '';
    const first = full ? full.split(' ')[0] : '';
    loaderTitle.textContent = 'Preparing the game for ' + (first || 'you');
    dossierInitials.textContent = person ? person.initials : '?';
    dossierImg.hidden = true;
    if (person && person.photo && person.photo.path) { dossierImg.src = new URL(person.photo.path, teamUrl).href; dossierImg.hidden = false; }
    const facts = person && person.facts && person.facts.length ? person.facts
      : [{ text: 'Over 2,000 people applied to Wispr Flow India in a single week. You picked this one to open.', source_url: (team && team.challenge_url) || CHALLENGE_URL }];
    const fact = facts[Math.floor(Math.random() * facts.length)];
    factText.textContent = fact.text;
    loadGo.hidden = true;
    loadRing.classList.remove('done'); loadRing.setAttribute('aria-label', 'Loading');
    loader.hidden = false; loaderCard.focus({ preventScroll: true });
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      loadRing.classList.add('done'); loadRing.setAttribute('aria-label', 'Ready');
      loaderTitle.textContent = 'Ready' + (first ? ', ' + first : '') + '.';
      loadGo.hidden = false; loadGo.focus({ preventScroll: true });
    }, 2600);
  }
  function closeLoader() { clearTimeout(loadTimer); loader.hidden = true; }
  function enterGame() {
    sfxUi(true);
    closeLoader();
    document.documentElement.classList.remove('locked');
    frame();
    window.scrollTo({ top: sectionTop(), behavior: 'auto' });
  }
  startBtn.addEventListener('click', openLoader);
  loadGo.addEventListener('click', enterGame);
  loader.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLoader(); startBtn.focus(); } });

  // ---------- Sound (synthesized with Web Audio) ----------
  // Always on. Browsers only allow audio after a click, tap or key press,
  // so it starts on the viewer's first interaction (picking a tile on the opening screen).
  let ctx = null, master, tearGain, tearSrc, penGain, penSrc, tearBuf, noiseBuf, lastPA = 0;
  let lastTs = 0, lastP = 0, vel = 0, ticking = false;

  function makeTearBuffer(c) {
    // paper fibre texture: hiss plus dense, randomly spaced crackles
    const len = Math.floor(c.sampleRate * 2.5), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    const burstRate = 70 / c.sampleRate, decay = Math.pow(0.5, 1 / (c.sampleRate * 0.0045));
    let env = 0;
    for (let i = 0; i < len; i++) {
      if (Math.random() < burstRate) env = Math.max(env, 0.35 + Math.random() * 0.65);
      env *= decay;
      d[i] = (Math.random() * 2 - 1) * (0.16 + env);
    }
    return b;
  }
  function makeNoiseBuffer(c) {
    const len = Math.floor(c.sampleRate * 1), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function initAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    tearBuf = makeTearBuffer(ctx);
    noiseBuf = makeNoiseBuffer(ctx);
    master = ctx.createGain(); master.gain.value = 0.7; master.connect(ctx.destination);

    // continuous tear layer, loudness follows scroll speed
    tearSrc = ctx.createBufferSource(); tearSrc.buffer = tearBuf; tearSrc.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 0.6;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    tearGain = ctx.createGain(); tearGain.gain.value = 0;
    tearSrc.connect(bp); bp.connect(hp); hp.connect(tearGain); tearGain.connect(master);
    tearSrc.start();

    // red-pen scratch layer
    penSrc = ctx.createBufferSource(); penSrc.buffer = tearBuf; penSrc.loop = true; penSrc.playbackRate.value = 1.7;
    const pbp = ctx.createBiquadFilter(); pbp.type = 'bandpass'; pbp.frequency.value = 4800; pbp.Q.value = 1.4;
    penGain = ctx.createGain(); penGain.gain.value = 0;
    penSrc.connect(pbp); pbp.connect(penGain); penGain.connect(master);
    penSrc.start();

    return true;
  }
  function rip() {
    // the first sharp crack when the paper gives
    const t = ctx.currentTime, src = ctx.createBufferSource(), g = ctx.createGain(), hp = ctx.createBiquadFilter();
    src.buffer = tearBuf; hp.type = 'highpass'; hp.frequency.value = 1200;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.1, t + 0.006); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    src.connect(hp); hp.connect(g); g.connect(master);
    src.start(t, Math.random() * 2); src.stop(t + 0.3);
  }
  function whoosh(level) {
    // the two halves flying off
    const t = ctx.currentTime, src = ctx.createBufferSource(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    src.buffer = noiseBuf; src.loop = true; lp.type = 'lowpass'; lp.Q.value = 2;
    lp.frequency.setValueAtTime(300, t); lp.frequency.exponentialRampToValueAtTime(2400, t + 0.22); lp.frequency.exponentialRampToValueAtTime(500, t + 0.6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level || 0.45, t + 0.12); g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    src.connect(lp); lp.connect(g); g.connect(master);
    src.start(t); src.stop(t + 0.7);
  }
  function audioTick(ts) {
    if (!ctx) { ticking = false; return; }
    const dt = lastTs ? Math.max(0.001, (ts - lastTs) / 1000) : 0.016;
    lastTs = ts;
    const pa = curP, p = Math.min(1, pa / TEAR_END), dp = p - lastP;
    vel = vel * 0.75 + (Math.abs(dp) / dt) * 0.25;
    const now = ctx.currentTime;
    const tearZone = smooth(0.1, 0.125, p) * (1 - smooth(0.53, 0.58, p));
    tearGain.gain.setTargetAtTime(Math.min(1, vel * 1.8) * tearZone, now, 0.025);
    tearSrc.playbackRate.setTargetAtTime(0.85 + Math.min(0.6, vel * 0.5), now, 0.05);
    const penZone = smooth(0.005, 0.02, p) * (1 - smooth(0.08, 0.1, p));
    penGain.gain.setTargetAtTime(Math.min(1, vel * 2.5) * penZone * 0.3, now, 0.02);
    if (dp > 0 && lastP < 0.115 && p >= 0.115) rip();
    if (dp > 0 && lastP < 0.57 && p >= 0.57) whoosh(0.3);
    LANDS.forEach((lp) => { if (pa > lastPA && lastPA < lp && pa >= lp) sfxBin(); });
    lastPA = pa;
    lastP = p;
    requestAnimationFrame(audioTick);
  }
  function startSound() {
    if (window.Story) Story.init();
    if (!ctx && !initAudio()) return;
    if (ctx.state !== 'running') ctx.resume();
    if (!ticking) { ticking = true; lastTs = 0; lastP = Math.min(1, curP / TEAR_END); lastPA = curP; vel = 0; requestAnimationFrame(audioTick); }
  }
  function sfxUi(forward = false) {
    startSound();
    if (!ctx) return;
    const t = ctx.currentTime, notes = forward ? [440, 660] : [620];
    notes.forEach((frequency, i) => {
      const at = t + i * 0.07, duration = forward ? 0.14 : 0.09;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = forward ? 'triangle' : 'sine';
      o.frequency.setValueAtTime(frequency, at);
      o.frequency.exponentialRampToValueAtTime(forward ? frequency : 380, at + duration);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.14, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, at + duration);
      o.connect(g); g.connect(master); o.start(at); o.stop(at + duration + 0.01);
      o.onended = () => { o.disconnect(); g.disconnect(); };
    });
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((type) => window.addEventListener(type, startSound, { passive: true }));


  // ---------- Clean-up: the pieces fall, then scrolling throws each one in the bin ----------
  const NS = 10, ITEMS = NS + 2, W_LEN = 0.14;
  const WIN = (i) => 0.04 + i * 0.066;
  const LANDS = Array.from({ length: ITEMS }, (_, i) => C_START + C_LEN * (WIN(i) + W_LEN));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const items = [];
  for (let j = 0; j < NS; j++) {
    const el = document.createElement('div'); el.className = 'scrap';
    const n = 5 + Math.floor(Math.random() * 3), pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + rnd(-0.3, 0.3), r = rnd(30, 50); pts.push((50 + Math.cos(a) * r).toFixed(1) + '% ' + (50 + Math.sin(a) * r).toFixed(1) + '%'); }
    el.style.clipPath = el.style.webkitClipPath = 'polygon(' + pts.join(',') + ')';
    scrapsEl.appendChild(el);
    items.push({ el, scrap: true, size: rnd(0.08, 0.13), sx: rnd(-0.06, 0.06), sy: rnd(-0.42, 0.42), tx: rnd(0.07, 0.6), ty: rnd(0.81, 0.95), r0: rnd(-30, 30), rt: rnd(-260, 260), d: j * 0.035 });
  }
  items.push({ el: R, side: 1, tx: 0.47, ty: 0.88, rot: 96 });
  items.push({ el: L, side: -1, tx: 0.2, ty: 0.85, rot: -84 });
  function ballSVG() {
    let d = '', c = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = rnd(38, 48); d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); }
    for (let i = 0; i < 4; i++) { const a = rnd(0, 6.28), b = a + rnd(1, 2.5); c += 'M' + (Math.cos(a) * 34).toFixed(1) + ' ' + (Math.sin(a) * 34).toFixed(1) + 'L' + (Math.cos(b) * 12).toFixed(1) + ' ' + (Math.sin(b) * 12).toFixed(1); }
    return '<svg viewBox="-50 -50 100 100"><path class="ball-body" d="' + d + 'Z"/><path class="ball-crease" d="' + c + '"/></svg>';
  }
  items.forEach((it) => { const b = document.createElement('div'); b.className = 'ball'; b.innerHTML = ballSVG(); ballsEl.appendChild(b); it.ball = b; });
  L.style.transformOrigin = '25% 50%';
  R.style.transformOrigin = '75% 50%';
  const easeIO = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

  function layoutClean(q, pa, shake) {
    const W = stage.clientWidth, H = stage.clientHeight;
    const pw = paper.offsetWidth, ph = paper.offsetHeight;
    const pcx = W / 2, pcy = H * 0.53;
    const c = Math.max(0, Math.min(1, (pa - C_START) / C_LEN));
    const fall = Math.max(0, Math.min(1, (q - 0.57) / 0.38));
    // the bin
    const bw = Math.max(104, Math.min(180, W * 0.13)), bh = bw * 1.15;
    const bx = W * (W < 700 ? 0.76 : 0.79), floorY = H * 0.93;
    const bl = bx - bw / 2, bt = floorY - bh, mouthY = bt + bh * (10 / 115);
    const binIn = smooth(0.85, 1, q);
    [binBack, binFront].forEach((e) => {
      e.style.width = bw + 'px'; e.style.height = bh + 'px'; e.style.opacity = String(binIn);
      e.style.transform = 'translate(' + bl + 'px,' + (bt + (1 - binIn) * 24) + 'px)';
    });
    const rb = Math.max(14, Math.min(26, W * 0.016 + 6)), arcH = H * 0.3;
    let left = 0;
    items.forEach((it, i) => {
      const fx = it.tx * W, fy = it.ty * H;
      const u = Math.max(0, Math.min(1, (c - WIN(i)) / W_LEN));
      const cr = smooth(0, 0.3, u), fly = Math.max(0, Math.min(1, (u - 0.3) / 0.7));
      if (u < 1) left++;
      // fall to the floor
      if (it.scrap) {
        const k = Math.max(0, Math.min(1, (fall - it.d) / 0.6));
        const sx = pcx + it.sx * pw, sy = pcy + it.sy * ph, s = it.size * pw;
        const x = sx + (fx - sx) * k + Math.sin(k * Math.PI * 2) * W * 0.02 * (1 - k);
        const y = sy + (fy - sy) * k * k;
        const shrink = 1 - 0.6 * cr;
        it.el.style.width = s + 'px'; it.el.style.height = s + 'px';
        it.el.style.opacity = String((fall > it.d ? 1 : 0) * (1 - cr));
        it.el.style.transform = 'translate(' + (x - s / 2) + 'px,' + (y - s / 2) + 'px) scale(' + shrink + ',' + (shrink * (1 - 0.45 * k)) + ') rotate(' + (it.r0 + it.rt * k) + 'deg)';
      } else {
        const k = Math.min(1, fall / 0.85);
        const hcx = pcx + it.side * 0.25 * pw, hcy = pcy;
        const x = (fx - hcx) * k + Math.sin(k * Math.PI) * it.side * W * 0.04 + (k === 0 ? shake : 0);
        const y = (fy - hcy) * k * k;
        const sc = (1 - 0.66 * k) * (1 - 0.6 * cr);
        it.el.style.opacity = String(1 - cr);
        it.el.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ',' + (sc * (1 - 0.45 * k)) + ') rotate(' + (it.rot * k) + 'deg)';
      }
      // crumple, then arc into the bin
      const b = it.ball;
      b.style.width = b.style.height = (rb * 2) + 'px';
      if (cr <= 0 || u >= 1) { b.style.opacity = '0'; return; }
      const k = easeIO(fly);
      const y0 = fy - rb * 0.6, y1 = mouthY + rb * 0.9;
      const x = fx + (bx - fx) * k, y = y0 + (y1 - y0) * k - arcH * 4 * k * (1 - k);
      b.style.opacity = String(Math.min(1, cr * 1.6));
      b.style.transform = 'translate(' + (x - rb) + 'px,' + (y - rb) + 'px) scale(' + (0.3 + 0.7 * cr) + ') rotate(' + (k * 540) + 'deg)';
    });
    return { c, left };
  }
  document.getElementById('toChapter').addEventListener('click', () => {
    sfxUi(true);
    ch1Sec.hidden = false;
    ch1Sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    ch1Stage.focus({ preventScroll: true });
  });
  function sfxBin() {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.22);
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
    const n = ctx.createBufferSource(), ng = ctx.createGain(), bp = ctx.createBiquadFilter();
    n.buffer = tearBuf; bp.type = 'bandpass'; bp.frequency.value = 1600;
    ng.gain.setValueAtTime(0.3, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    n.connect(bp); bp.connect(ng); ng.connect(master); n.start(t, Math.random()); n.stop(t + 0.2);
  }

  document.getElementById('restart').addEventListener('click', () => {
    closeLoader();
    cancelAnimationFrame(ch1Frame);
    Story.hush(); Ideas.reset();
    ch1Playing = ch1Visible = ch1BeatDone = false;
    beat = -1; ch1T = ch1Prev = ch1Last = 0;
    ch1.render(0); ch1Ui();
    ch1Sec.hidden = true;
    picked = 'curious';
    pick.querySelectorAll('.tile, #visitor').forEach((tile) => tile.setAttribute('aria-pressed', String(tile.id === 'visitor')));
    startLabel.textContent = 'Press start as Just curious';
    bubble.textContent = LINES.curious; setAvatarFace(null);
    teamTiles.scrollTo({ left: 0, behavior: 'auto' });
    document.documentElement.classList.add('locked');
    window.scrollTo({ top: 0, behavior: 'auto' });
    lastP = lastPA = vel = 0; frame();
    startBtn.focus({ preventScroll: true });
  });

  buildTear();
  frame();
})();
