/* Chapter 1, scene 1: "Born in 2001".
   One deterministic timeline (seconds) that all three prototype versions share:
   - mount(stage) builds the scene and returns render(t) and fire(prev, t)
   - render(t) places everything for time t, so scroll, playback and tap-through can all drive it
   - fire(prev, t) plays the sound and narration cues passed between prev and t (forward only) */
window.Story = (() => {
  const DURATION = 16.4;
  // time windows used by the tap-through version, one per beat
  const CARDS = [[0, 3.7], [3.75, 7.1], [7.15, 10.35], [10.4, 16.3]];
  const CAPTIONS = [
    'I was born in <mark>2001</mark>.',
    'A few years later, <mark>school</mark>.',
    'I wrote. <mark>A lot.</mark>',
    'No <mark>Wispr Flow</mark> back then. Just a pencil and a very tired hand.',
  ];
  // what the narrator says; placeholder browser voice until Parth records his own
  const LINES = [
    'I was born in 2001.',
    'A few years later, school.',
    'I wrote. A lot.',
    'No Wispr Flow back then. Just a pencil, and a very tired hand.',
  ];
  const CAP_START = [0, 3.8, 7.2, 10.5];

  // ---------- sound (Web Audio, synthesized) ----------
  let ctx = null, master = null, noise = null;
  function init() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    const len = ctx.sampleRate * 2;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  const ok = () => ctx && ctx.state === 'running';
  function noiseSrc() { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; return s; }
  function whoosh(level = 0.35) {
    if (!ok()) return;
    const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + 0.2); f.frequency.exponentialRampToValueAtTime(500, t + 0.55);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(level, t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.65);
  }
  function thud() {
    if (!ok()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.2);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
    const s = noiseSrc(), h = ctx.createBiquadFilter(), ng = ctx.createGain();
    h.type = 'highpass'; h.frequency.value = 2000;
    ng.gain.setValueAtTime(0.35, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    s.connect(h); h.connect(ng); ng.connect(master); s.start(t); s.stop(t + 0.06);
  }
  function tick() {
    if (!ok()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square'; o.frequency.value = 1800;
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.04);
  }
  function bell(dur = 1.5) {
    // a school bell: bright partials with a fast tremolo
    if (!ok()) return;
    const t = ctx.currentTime, out = ctx.createGain(), trem = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.16, t + 0.02); out.gain.setValueAtTime(0.16, t + dur - 0.3); out.gain.exponentialRampToValueAtTime(0.001, t + dur);
    lfo.frequency.value = 17; depth.gain.value = 0.5; trem.gain.value = 0.5;
    lfo.connect(depth); depth.connect(trem.gain);
    [1046, 1568, 2093, 2794].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f; g.gain.value = [1, 0.5, 0.35, 0.2][i];
      o.connect(g); g.connect(trem); o.start(t); o.stop(t + dur);
    });
    trem.connect(out); out.connect(master); lfo.start(t); lfo.stop(t + dur);
  }
  function scribble(dur = 2.2) {
    // pencil on paper: band-passed noise in short random strokes
    if (!ok()) return;
    const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = 1.1;
    g.gain.setValueAtTime(0, t);
    let x = t;
    while (x < t + dur) {
      const len = 0.06 + Math.random() * 0.12;
      g.gain.linearRampToValueAtTime(0.16 + Math.random() * 0.12, x + 0.015);
      g.gain.linearRampToValueAtTime(0.02, x + len);
      x += len + Math.random() * 0.05;
    }
    g.gain.linearRampToValueAtTime(0, t + dur + 0.05);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.1);
  }
  function flip() {
    if (!ok()) return;
    const t = ctx.currentTime, s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'lowpass'; f.frequency.setValueAtTime(4000, t); f.frequency.exponentialRampToValueAtTime(600, t + 0.12);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + 0.15);
  }
  function drip() {
    if (!ok()) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(1300, t); o.frequency.exponentialRampToValueAtTime(320, t + 0.11);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.15);
  }
  function pop() {
    if (!ok()) return;
    const t = ctx.currentTime;
    [[660, 0], [990, 0.09]].forEach(([f, d]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t + d); g.gain.linearRampToValueAtTime(0.12, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.25);
      o.connect(g); g.connect(master); o.start(t + d); o.stop(t + d + 0.27);
    });
  }

  // ---------- narration (browser voice as a stand-in) ----------
  const canSpeak = 'speechSynthesis' in window;
  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => /en-IN/i.test(v.lang)) || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  }
  if (canSpeak) { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); }
  function say(text) {
    if (!canSpeak) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 1.04;
    speechSynthesis.speak(u);
  }
  function hush() { if (canSpeak) speechSynthesis.cancel(); }

  const CUES = [
    { t: 0.02, f: () => whoosh(0.3) },
    ...[0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((t) => ({ t, f: tick })),
    { t: 1.4, f: thud },
    { t: 1.5, f: () => say(LINES[0]) },
    { t: 3.8, f: () => whoosh(0.35) },
    { t: 4.4, f: () => bell() },
    { t: 4.6, f: () => say(LINES[1]) },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ t: 7.2 + i * 0.18, f: flip })),
    { t: 7.8, f: () => scribble(2.4) },
    { t: 8.0, f: () => say(LINES[2]) },
    { t: 10.4, f: () => whoosh(0.3) },
    { t: 11.0, f: () => say(LINES[3]) },
    ...[11.4, 12.4, 13.4, 14.4].map((t) => ({ t, f: drip })),
    { t: 15.6, f: pop },
  ];

  // ---------- art ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  function scribbleSVG() {
    let paths = '';
    for (let y = 40; y <= 206; y += 17.6) {
      let d = 'M30 ' + y.toFixed(1);
      const end = rnd(120, 166);
      for (let x = 30; x < end; x += 10) d += ' q5 ' + (-rnd(2, 6)).toFixed(1) + ' 10 0';
      paths += '<path pathLength="1" d="' + d + '"/>';
    }
    return '<svg class="scribble" viewBox="0 0 180 230" preserveAspectRatio="none" aria-hidden="true">' + paths + '</svg>';
  }
  const SCHOOL = `<svg viewBox="0 -20 220 210" aria-hidden="true">
    <rect class="s-wall" x="94" y="-6" width="32" height="40"/>
    <path class="s-roof" d="M88 -6 L110 -20 L132 -6 Z"/>
    <g class="s-bellg"><path class="s-bell" d="M102 20 Q102 6 110 6 Q118 6 118 20 L121 25 L99 25 Z"/><circle class="s-bell" cx="110" cy="27" r="2.5"/></g>
    <rect class="s-wall" x="30" y="80" width="160" height="100"/>
    <path class="s-roof" d="M18 84 L110 30 L202 84 Z"/>
    <rect class="s-banner" x="70" y="88" width="80" height="15"/>
    <text class="s-label" x="110" y="99" text-anchor="middle">SCHOOL</text>
    <rect class="s-glass" x="44" y="112" width="32" height="26"/><path class="k-line" d="M60 112 V138 M44 125 H76"/>
    <rect class="s-glass" x="144" y="112" width="32" height="26"/><path class="k-line" d="M160 112 V138 M144 125 H176"/>
    <rect class="s-glass" x="96" y="128" width="28" height="52"/>
    <path class="k-line" d="M4 180 H216"/>
  </svg>`;
  const KID = `<svg viewBox="0 0 260 212" aria-hidden="true">
    <path class="k-arm-out" d="M86 120 Q72 140 94 156"/><path class="k-arm-in" d="M86 120 Q72 140 94 156"/>
    <rect class="k-shirt" x="78" y="104" width="84" height="66" rx="24"/>
    <path class="k-tie" d="M114 108 L126 108 L123 120 L128 140 L120 148 L112 140 L117 120 Z"/>
    <g class="k-head">
      <circle class="k-skin" cx="120" cy="72" r="36"/>
      <path class="k-ink" d="M85 68 Q86 34 120 34 Q154 34 155 66 Q142 50 120 52 Q100 50 85 68 Z"/>
      <path class="k-line" d="M100 64 L112 58 M140 64 L128 58"/>
      <circle class="k-ink" cx="106" cy="73" r="3.4"/><circle class="k-ink" cx="134" cy="73" r="3.4"/>
      <path class="k-line" stroke-width="2.5" d="M104 93 q4 -4 8 0 t8 0 t8 0 t8 0"/>
      <path class="k-line stress" d="M162 46 l10 -7 M165 60 l13 -1 M78 46 l-10 -7"/>
    </g>
    <g transform="translate(164 40)"><path class="k-drop d1" d="M0 0 C4 6 6 10 0 14 C-6 10 -4 6 0 0Z"/></g>
    <g transform="translate(78 48)"><path class="k-drop d2" d="M0 0 C4 6 6 10 0 14 C-6 10 -4 6 0 0Z"/></g>
    <g transform="translate(154 24)"><path class="k-drop d3" d="M0 0 C4 6 6 10 0 14 C-6 10 -4 6 0 0Z"/></g>
    <rect class="k-desk" x="14" y="160" width="232" height="14" rx="3"/>
    <rect class="k-desk" x="28" y="174" width="10" height="36"/><rect class="k-desk" x="222" y="174" width="10" height="36"/>
    <path class="k-paper" d="M140 148 L206 148 L222 160 L124 160 Z"/>
    <path class="k-line" stroke-width="1.5" d="M142 152 H204 M136 156 H210"/>
    <g class="k-arm">
      <path class="k-arm-out" d="M152 118 Q178 128 172 148"/><path class="k-arm-in" d="M152 118 Q178 128 172 148"/>
      <line class="k-pencil" x1="171" y1="152" x2="188" y2="130"/><line class="k-tip" x1="171" y1="152" x2="168" y2="157"/>
      <circle class="k-skin" cx="172" cy="149" r="7"/>
    </g>
  </svg>`;
  const PILE = [{ x: -7, y: 5, r: -9 }, { x: 6, y: 3, r: 7 }, { x: -4, y: -1, r: -4 }, { x: 5, y: -3, r: 4 }, { x: -2, y: 1, r: -1.5 }, { x: 0, y: 0, r: 0 }];

  // ---------- timeline helpers ----------
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const ease = (k) => k * k * (3 - 2 * k);
  const back = (k) => { const c1 = 1.70158, c3 = c1 + 1; return k <= 0 ? 0 : 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  function mount(stage) {
    const pages = PILE.map((_, i) => '<div class="page">' + scribbleSVG() + '</div>').join('');
    stage.innerHTML = `
      <div class="sc-year"><span class="num">1995</span><span class="circle"></span><span class="tag">born!</span></div>
      <div class="sc-school">${SCHOOL}</div>
      <div class="sc-pages">${pages}</div>
      <div class="sc-kid kid">${KID}</div>
      <div class="sc-end"><div class="small">end of scene 1</div><div class="big">Next: things get <mark>faster</mark>.</div></div>
      <div class="sc-cap" aria-live="polite"><span class="cap"></span></div>`;
    const q = (s) => stage.querySelector(s);
    const el = {
      year: q('.sc-year'), num: q('.sc-year .num'), circle: q('.sc-year .circle'), tag: q('.sc-year .tag'),
      school: q('.sc-school'), bell: q('.s-bellg'), pages: [...stage.querySelectorAll('.page')],
      kid: q('.sc-kid'), end: q('.sc-end'), cap: q('.cap'),
    };
    // every page but the top one starts already written on
    el.pages.slice(0, -1).forEach((p) => p.querySelectorAll('path').forEach((path) => { path.style.strokeDashoffset = '0'; }));
    const live = [...el.pages[el.pages.length - 1].querySelectorAll('path')];
    let capIndex = -1;

    function render(t) {
      // 2001: count up, stamp, circle
      const yin = seg(t, 0, 0.35), yout = ease(seg(t, 3.4, 3.9)), stamp = seg(t, 1.4, 1.62);
      el.num.textContent = String(1995 + Math.min(6, Math.floor(seg(t, 0.2, 1.4) * 6.999)));
      el.year.style.opacity = String(yin * (1 - yout));
      el.year.style.transform = 'translate(-50%,-50%) translateY(' + (-yout * 40) + '%) scale(' + (t < 1.4 ? 1 : 1 + 0.5 * (1 - ease(stamp))) + ')';
      el.circle.style.opacity = String(seg(t, 1.6, 1.75));
      el.circle.style.transform = 'scale(' + (1.3 - 0.3 * ease(seg(t, 1.6, 2.0))) + ') rotate(-4deg)';
      el.tag.style.opacity = String(seg(t, 1.85, 2.1));
      // school: slides in, bell swings
      const sin = ease(seg(t, 3.8, 4.5)), sout = ease(seg(t, 6.8, 7.3));
      el.school.style.opacity = String(sin * (1 - sout));
      el.school.style.transform = 'translate(-50%,-50%) translateX(' + ((1 - sin) * 120 - sout * 120) + '%) rotate(' + ((1 - sin) * 8 - sout * 6) + 'deg)';
      const ring = t > 4.4 && t < 6.2 ? Math.sin((t - 4.4) * 22) * 18 * (1 - (t - 4.4) / 1.8) : 0;
      el.bell.style.transform = 'rotate(' + ring + 'deg)';
      // pages: fly in, pile up, top one fills with writing
      const pout = ease(seg(t, 10.3, 10.8));
      el.pages.forEach((pg, i) => {
        const k = seg(t, 7.2 + i * 0.18, 7.62 + i * 0.18), b = back(k), P = PILE[i];
        pg.style.opacity = String((k > 0 ? 1 : 0) * (1 - pout));
        pg.style.transform = 'translate(' + (P.x - pout * 80) + '%,' + (P.y + (1 - b) * 150) + '%) rotate(' + (P.r + (1 - b) * 28 - pout * 20) + 'deg) scale(' + (1 - pout * 0.3) + ')';
      });
      const dk = seg(t, 7.8, 10.2) * live.length;
      live.forEach((path, j) => { path.style.strokeDashoffset = String(1 - clamp01(dk - j)); });
      // kid: rises, writes, sweats
      const kin = back(seg(t, 10.4, 11.0)), kend = ease(seg(t, 15.6, 16.2));
      el.kid.style.opacity = String(seg(t, 10.4, 10.6) * (1 - kend * 0.75));
      el.kid.style.transform = 'translate(-50%,-50%) translateY(' + ((1 - kin) * 40 - kend * 8) + '%) scale(' + (1 - kend * 0.12) + ')';
      el.kid.classList.toggle('writing', t > 10.8 && t < 15.6);
      el.kid.classList.toggle('sweating', t > 11.3 && t < 16);
      // end card
      const e = seg(t, 15.6, 16.1);
      el.end.style.opacity = String(e);
      el.end.style.transform = 'translate(-50%,-50%) translateY(' + ((1 - ease(e)) * 20) + '%)';
      // caption
      const ci = t < 3.7 ? 0 : t < 7.1 ? 1 : t < 10.35 ? 2 : 3;
      if (ci !== capIndex) { el.cap.innerHTML = CAPTIONS[ci]; capIndex = ci; }
      el.cap.parentElement.style.opacity = String(seg(t, CAP_START[ci] + 0.05, CAP_START[ci] + 0.3) * (1 - seg(t, 15.5, 15.8)));
    }
    function fire(prev, t) {
      if (t <= prev) return;
      CUES.forEach((c) => { if (c.t > prev && c.t <= t) c.f(); });
    }
    render(0);
    return { render, fire };
  }

  return { DURATION, CARDS, mount, init, hush };
})();
