/* The story: college, graduation, and learning to build products.
   One deterministic timeline (seconds), played beat by beat from js/main.js:
   - mount(stage) builds the scene and returns render(t) and fire(prev, t)
   - render(t) places everything for time t, so scroll, playback and tap-through can all drive it
   - fire(prev, t) plays the sound and narration cues passed between prev and t (forward only) */
window.Story = (() => {
  const DURATION = 99.3;
  // time windows used by the tap-through version, one per beat
  const CARDS = [[0, 3.7], [3.75, 16.3], [16.4, 24.2], [24.3, 30.3], [30.4, 40.7], [40.8, 48.8], [48.9, 59.9], [60.0, 68.8], [68.9, 81.7], [81.8, 90.6], [90.7, 99.2]];
  const CAPTIONS = [
    'I entered college in <mark>2020</mark>.',
    'Assignments, typed by hand. <mark>No Wispr Flow. Just tired fingers.</mark>',
    'B.Com. Honours. Delhi University. <mark>What next?</mark>',
    'I wanted to <mark>build something of my own.</mark>',
    '<mark>Stories + code.</mark> Products people love.',
    'No engineering degree. <mark>A chance to learn.</mark>',
    'One year. No job. <mark>Learning by building.</mark>',
    'Learning turned into <mark>real experience.</mark>',
    '<mark>CaseBase.</mark> Second teammate. Product + code.',
    '<mark>In the US.</mark> Meeting the people we build for.',
    '<mark>Anytime Fitness India.</mark> Growth consultant.',
  ];
  const CAP_START = [0, 3.8, 16.4, 24.3, 30.4, 40.8, 48.9, 60.0, 68.9, 81.8, 90.7];
  const CONTINUATION_SCENES = [2, 3, 4, 4, 6, 6, 5, 7, 8, 8, 9, 10];
  const MID_SCENE = {
    4: CARDS[4][0] + (CARDS[4][1] - CARDS[4][0]) * 0.6,
    6: CARDS[6][0] + (CARDS[6][1] - CARDS[6][0]) * 0.5,
    8: 74.3,
  };

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
  function typing(dur = 2.4, level = 1) {
    // keyboard clatter: short clicks at uneven gaps, with the odd heavier space bar
    if (!ok()) return;
    const t0 = ctx.currentTime;
    let x = t0;
    while (x < t0 + dur) {
      const s = noiseSrc(), f = ctx.createBiquadFilter(), g = ctx.createGain(), space = Math.random() < 0.12;
      f.type = 'bandpass'; f.frequency.value = space ? 900 : 2200 + Math.random() * 1800; f.Q.value = 2.5;
      g.gain.setValueAtTime(0, x);
      g.gain.linearRampToValueAtTime((space ? 0.5 : 0.28 + Math.random() * 0.18) * level, x + 0.003);
      g.gain.exponentialRampToValueAtTime(0.001, x + (space ? 0.06 : 0.035));
      s.connect(f); f.connect(g); g.connect(master); s.start(x, Math.random() * 1.5); s.stop(x + 0.08);
      x += 0.055 + Math.random() * 0.09;
    }
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

  // ---------- narration (local ElevenLabs recordings, one per beat) ----------
  const narration = [...document.querySelectorAll('#chapter1 audio')];
  let activeNarration = null;
  function hush() {
    if (!activeNarration) return;
    activeNarration.pause(); activeNarration.currentTime = 0;
    activeNarration = null;
  }
  function say(i) {
    hush();
    const audio = narration[i];
    activeNarration = audio;
    audio.play().catch(() => { if (activeNarration === audio) activeNarration = null; });
  }
  function narrationDone() {
    return !activeNarration || activeNarration.ended || Boolean(activeNarration.error);
  }

  const CUES = [
    { t: 0.02, f: () => whoosh(0.3) },
    ...[0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((t) => ({ t, f: tick })),
    { t: 1.4, f: thud },
    { t: 1.5, f: () => say(0) },
    { t: 3.8, f: () => whoosh(0.35) },
    { t: 4.4, f: () => bell() },
    { t: 4.6, f: () => say(1) },
    ...[0, 1, 2, 3, 4, 5].map((i) => ({ t: 7.2 + i * 0.18, f: flip })),
    { t: 7.8, f: () => typing(2.4) },
    { t: 10.4, f: () => whoosh(0.3) },
    { t: 11.2, f: () => typing(4.2, 0.55) },
    ...[11.4, 12.4, 13.4, 14.4].map((t) => ({ t, f: drip })),
    { t: 15.6, f: pop },
    ...CARDS.slice(2).flatMap(([start], i) => [
      { t: start + 0.02, f: () => whoosh(0.25) },
      { t: start + 0.2, f: () => say(i + 2) },
    ]),
    ...Object.values(MID_SCENE).map((t) => ({ t, f: () => whoosh(0.25) })),
  ];

  // ---------- art ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  function scribbleSVG(n) {
    let paths = '';
    for (let y = 58; y <= 206; y += 17.6) {
      let d = '', x = 30;
      const end = rnd(118, 160);
      while (x < end) { const w = rnd(8, 22); d += 'M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' h' + w.toFixed(1) + ' '; x += w + 5; }
      paths += '<path pathLength="1" d="' + d.trim() + '"/>';
    }
    return '<svg class="scribble" viewBox="0 0 180 230" preserveAspectRatio="none" aria-hidden="true">' +
      '<text class="pg-title" x="30" y="34">Assignment ' + n + '</text>' + paths + '</svg>';
  }
  const SCHOOL = `<svg viewBox="0 -20 220 210" aria-hidden="true">
    <rect class="s-wall" x="94" y="-6" width="32" height="40"/>
    <path class="s-roof" d="M88 -6 L110 -20 L132 -6 Z"/>
    <g class="s-bellg"><path class="s-bell" d="M102 20 Q102 6 110 6 Q118 6 118 20 L121 25 L99 25 Z"/><circle class="s-bell" cx="110" cy="27" r="2.5"/></g>
    <rect class="s-wall" x="30" y="80" width="160" height="100"/>
    <path class="s-roof" d="M18 84 L110 30 L202 84 Z"/>
    <rect class="s-banner" x="60" y="88" width="100" height="15"/>
    <text class="s-label" x="110" y="99" text-anchor="middle">COLLEGE</text>
    <rect class="s-glass" x="44" y="112" width="32" height="26"/><path class="k-line" d="M60 112 V138 M44 125 H76"/>
    <rect class="s-glass" x="144" y="112" width="32" height="26"/><path class="k-line" d="M160 112 V138 M144 125 H176"/>
    <rect class="s-glass" x="96" y="128" width="28" height="52"/>
    <path class="k-line" d="M4 180 H216"/>
  </svg>`;
  const KID = `<svg viewBox="0 0 260 212" aria-hidden="true">
    <rect class="k-shirt" x="78" y="104" width="84" height="66" rx="24"/>
    <path class="k-lanyard" d="M108 106 L118 138 M132 106 L122 138"/>
    <rect class="k-card" x="111" y="136" width="18" height="22" rx="3"/><path class="k-line" stroke-width="2" d="M115 146 H125 M115 151 H122"/>
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
    <g class="k-hand-l">
      <path class="k-arm-out" d="M86 118 Q68 138 88 152"/><path class="k-arm-in" d="M86 118 Q68 138 88 152"/>
      <circle class="k-skin" cx="90" cy="153" r="7"/>
    </g>
    <g class="k-hand-r">
      <path class="k-arm-out" d="M154 118 Q176 136 190 152"/><path class="k-arm-in" d="M154 118 Q176 136 190 152"/>
      <circle class="k-skin" cx="190" cy="153" r="7"/>
    </g>
    <rect class="k-deck" x="84" y="155" width="112" height="6" rx="2"/>
    <path class="k-lid" d="M98 108 L182 108 L188 157 L92 157 Z"/>
    <path class="k-sticker" d="M140 122 l3.5 7.1 7.8 1.1 -5.6 5.5 1.3 7.8 -7 -3.7 -7 3.7 1.3 -7.8 -5.6 -5.5 7.8 -1.1 z"/>
  </svg>`;
  const CONTINUATION_ART = [
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <g transform="rotate(-4 290 170)">
        <rect class="sc-paper" x="90" y="65" width="390" height="220" rx="3"/>
        <rect class="sc-outline" x="104" y="79" width="362" height="192"/>
        <text class="sc-title" x="285" y="150" text-anchor="middle">B.COM. HONOURS</text>
        <text x="285" y="190" text-anchor="middle">DELHI UNIVERSITY</text>
        <path class="sc-outline" d="M220 219h130"/><circle class="sc-yellow" cx="285" cy="242" r="13"/>
      </g>
      <path class="sc-ink-fill" d="M180 50l108-36 108 36-108 36zM220 72v35q68 28 136 0V72l-68 24z"/>
      <path class="sc-red" d="M389 53v56l9 16"/>
      <g class="sc-detail" transform="rotate(9 500 160)">
        <rect class="sc-yellow" x="438" y="115" width="130" height="118"/>
        <text class="sc-question" x="503" y="199" text-anchor="middle">?</text>
      </g>
      <text class="sc-hand sc-detail" x="360" y="310">what next?</text>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <path class="sc-outline" d="M65 272h470M94 275v32M506 275v32"/>
      <g transform="rotate(-5 180 155)">
        <rect class="sc-paper" x="68" y="72" width="212" height="172" rx="3"/>
        <text class="sc-title" x="174" y="124" text-anchor="middle">WHAT IF?</text>
        <path class="sc-outline" d="M101 151h136M101 170h108M101 189h124"/>
        <path class="sc-red" d="M98 216q70-14 140 0"/>
      </g>
      <g class="sc-detail">
        <path class="sc-red" d="M287 157q36-37 73 0m-15-19 17 20-25 4"/>
        <rect class="sc-yellow" x="369" y="142" width="138" height="119"/>
        <rect class="sc-paper" x="387" y="67" width="102" height="75" transform="rotate(5 438 105)"/>
        <text class="sc-title" x="438" y="114" text-anchor="middle">MY</text>
        <text class="sc-title" x="438" y="211" text-anchor="middle">BUILD</text>
      </g>
      <text class="sc-hand" x="180" y="36">something of my own.</text>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <g transform="rotate(-6 170 165)">
        <rect class="sc-paper" x="65" y="64" width="205" height="228" rx="3"/>
        <rect class="sc-yellow" x="79" y="51" width="205" height="228" rx="3"/>
        <rect class="sc-paper" x="94" y="39" width="205" height="228" rx="3"/>
        <text class="sc-title" x="196" y="99" text-anchor="middle">STORIES</text>
        <path class="sc-outline" d="M121 134h148M121 159h119M121 184h134M121 209h85"/>
      </g>
      <text class="sc-hand" x="319" y="166" text-anchor="middle">+</text>
      <g class="sc-detail" transform="rotate(5 435 160)">
        <rect class="sc-ink-fill" x="367" y="24" width="143" height="278" rx="23"/>
        <rect class="sc-paper" x="377" y="37" width="123" height="250" rx="14"/>
        <path class="sc-outline" d="M417 53h43"/>
        <rect class="sc-yellow" x="392" y="87" width="93" height="91" rx="13"/>
        <path class="sc-red" d="M438 152l-25-24c-20-25 14-39 25-17 12-22 45-8 25 17z"/>
        <path class="sc-outline" d="M392 209h93M392 229h65M392 249h79"/>
      </g>
      <text class="sc-hand" x="87" y="314">made for people.</text>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <rect class="sc-ink-fill" x="100" y="36" width="400" height="237" rx="12"/>
      <rect class="sc-paper" x="111" y="48" width="378" height="211" rx="3"/>
      <path class="sc-outline" d="M111 82h378"/>
      <circle class="sc-yellow" cx="132" cy="65" r="5"/><circle class="sc-yellow" cx="151" cy="65" r="5"/>
      <text x="180" y="71">first-build.js</text>
      <text class="sc-code" x="142" y="129">const idea = "what if?";</text>
      <text class="sc-code" x="142" y="167">learn();</text>
      <text class="sc-code sc-detail" x="142" y="205">build(idea);</text>
      <path class="sc-paper" d="M100 273h400l45 24H55z"/>
      <g class="sc-detail" transform="rotate(8 478 231)">
        <rect class="sc-yellow" x="413" y="200" width="145" height="75"/>
        <text class="sc-hand" x="485" y="247" text-anchor="middle">let's try.</text>
      </g>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <g transform="rotate(-3 260 160)">
        <rect class="sc-paper" x="74" y="38" width="374" height="258" rx="5"/>
        <rect class="sc-yellow" x="74" y="38" width="374" height="64" rx="5"/>
        <path class="sc-outline" d="M132 25v29M390 25v29"/>
        <text class="sc-title" x="261" y="83" text-anchor="middle">ONE YEAR</text>
        ${Array.from({ length: 12 }, (_, i) => { const x = 104 + (i % 4) * 83, y = 127 + Math.floor(i / 4) * 53; return `<rect class="sc-outline" x="${x}" y="${y}" width="62" height="35" rx="2"/><path class="sc-red sc-detail" d="M${x + 15} ${y + 19}l9 8 22-23"/>`; }).join('')}
      </g>
      <g class="sc-detail" transform="rotate(7 478 182)">
        <rect class="sc-yellow" x="394" y="126" width="163" height="135"/>
        <text class="sc-title" x="475" y="174" text-anchor="middle">LEARN</text>
        <text class="sc-title" x="475" y="217" text-anchor="middle">+ BUILD</text>
        <path class="sc-red" d="M415 234q57-9 117 0"/>
      </g>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <g transform="rotate(-5 108 150)">
        <rect class="sc-paper" x="24" y="73" width="168" height="168" rx="3"/>
        <path class="sc-yellow" d="M89 143c-34-35 21-69 40-35 10 17 0 28-9 37v17H96v-17z"/>
        <path class="sc-outline" d="M99 174h19M100 182h17"/>
        <text x="108" y="216" text-anchor="middle">PRODUCT</text>
      </g>
      <path class="sc-red" d="M195 155h25m-9-9 10 9-10 9"/>
      <g class="sc-detail">
        <rect class="sc-yellow" x="226" y="73" width="158" height="168" rx="3"/>
        <text class="sc-question" x="305" y="164" text-anchor="middle">&lt;/&gt;</text>
        <text x="305" y="216" text-anchor="middle">CODE</text>
        <path class="sc-red" d="M389 155h25m-9-9 10 9-10 9"/>
        <g transform="rotate(5 497 150)">
          <rect class="sc-paper" x="421" y="73" width="157" height="168" rx="3"/>
          <rect class="sc-outline" x="444" y="107" width="111" height="71" rx="5"/>
          <path class="sc-outline" d="M444 127h111"/>
          <path class="sc-red" d="M479 148l13 12 25-26"/>
          <text x="500" y="216" text-anchor="middle">LIVE</text>
        </g>
      </g>
      <path class="sc-red sc-detail" d="M498 264q-178 68-376 6m14-9-16 8 15 12"/>
      <text class="sc-hand" x="300" y="35" text-anchor="middle">figure it out. keep building.</text>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <g transform="rotate(-4 290 160)">
        <rect class="sc-paper" x="85" y="48" width="430" height="232" rx="3"/>
        <text class="sc-title" x="300" y="105" text-anchor="middle">PERMISSION TO TRY</text>
        <rect class="sc-outline" x="121" y="140" width="31" height="31"/>
        <text x="171" y="164">I can learn this.</text>
        <path class="sc-red sc-detail" d="M124 153l12 14 28-35"/>
        <g class="sc-detail" transform="rotate(7 327 222)">
          <rect class="sc-yellow" x="195" y="194" width="265" height="55" rx="3"/>
          <text class="sc-title" x="327" y="233" text-anchor="middle">SELF-TAUGHT</text>
        </g>
      </g>
      <text class="sc-hand" x="345" y="310">a chance to learn.</text>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <text class="sc-hand" x="300" y="35" text-anchor="middle">everything was new.</text>
      <g transform="rotate(-5 114 160)">
        <rect class="sc-paper" x="25" y="74" width="175" height="182"/>
        <text class="sc-question" x="112" y="167" text-anchor="middle">&lt;/&gt;</text>
        <text x="112" y="224" text-anchor="middle">CODE</text>
      </g>
      <path class="sc-red" d="M204 165h20m-9-9 10 9-10 9"/>
      <g class="sc-detail">
        <rect class="sc-yellow" x="232" y="74" width="150" height="182"/>
        <path class="sc-outline" d="M268 139v-17q0-22 38-22t38 22v17M252 139h110v58H252zM252 161q55 22 110 0"/>
        <text x="307" y="226" text-anchor="middle">INTERNSHIPS</text>
        <path class="sc-red" d="M387 165h20m-9-9 10 9-10 9"/>
        <g transform="rotate(5 499 160)">
          <rect class="sc-paper" x="417" y="74" width="165" height="182"/>
          <path class="sc-outline" d="M447 123h105M447 148h77M447 173h92"/>
          <path class="sc-red" d="M444 199q49-13 106 0"/>
          <text x="499" y="226" text-anchor="middle">NEW LESSONS</text>
        </g>
      </g>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <path class="sc-outline" d="M244 15l36 54h40l36-54"/>
      <g transform="rotate(-4 300 181)">
        <rect class="sc-paper" x="123" y="66" width="354" height="227" rx="14"/>
        <rect class="sc-yellow" x="265" y="80" width="70" height="11" rx="5"/>
        <text class="sc-brand" x="300" y="149" text-anchor="middle">CaseBase</text>
        <path class="sc-outline" d="M150 171h300"/>
        <text x="166" y="210">TEAM MEMBER</text>
        <text class="sc-question sc-detail" x="398" y="252" text-anchor="middle">02</text>
        <text class="sc-small" x="166" y="253">FOUNDING PRODUCT</text>
      </g>
    </svg>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <text class="sc-hand" x="300" y="35" text-anchor="middle">one role. a lot to build.</text>
      <rect class="sc-paper" x="70" y="69" width="460" height="204" rx="8"/>
      <path class="sc-outline" d="M70 111h460"/>
      <text x="108" y="98">PRODUCT</text><text x="285" y="98">CODE</text><text x="414" y="98">BUILD</text>
      <path class="sc-outline" d="M100 145h147M100 166h116M100 187h132"/>
      <path class="sc-red sc-detail" d="M92 210q75-8 155 0"/>
      <g class="sc-detail">
        <rect class="sc-yellow" x="279" y="132" width="220" height="112" rx="5"/>
        <text class="sc-code" x="302" y="170">build();</text>
        <text class="sc-code" x="302" y="207">ship();</text>
        <path class="sc-paper" d="M447 219l-3 66 17-19 20 25 12-10-19-25 26-1z"/>
      </g>
    </svg>`,
    `<div class="sc-us-collage">
      <figure class="sc-polaroid">
        <img src="public/assets/story/parth-us.jpg" width="1064" height="1600" alt="Parth during his trip to the United States." decoding="async">
        <figcaption>US trip</figcaption>
      </figure>
      <div class="sc-us-notes">
        <strong>IN THE<br>REAL WORLD.</strong>
        <p class="sc-detail">Community services.<br>Community corrections.<br>The people we build for.</p>
        <span class="sc-us-note sc-detail">From screens<br>to conversations.</span>
      </div>
    </div>`,
    `<svg viewBox="0 0 600 320" aria-hidden="true">
      <g transform="rotate(-3 300 159)">
        <rect class="sc-paper" x="64" y="40" width="472" height="244" rx="4"/>
        <text class="sc-title" x="300" y="95" text-anchor="middle">ANYTIME FITNESS INDIA</text>
        <path class="sc-outline" d="M96 114h408"/>
        <path class="sc-outline" d="M122 167h137M122 149v37M259 149v37"/>
        <rect class="sc-yellow" x="134" y="136" width="27" height="64" rx="4"/>
        <rect class="sc-yellow" x="219" y="136" width="27" height="64" rx="4"/>
        <path class="sc-red sc-detail" d="M315 193l44-42 32 12 68-40m-26-1 28-2-5 27"/>
        <rect class="sc-yellow sc-detail" x="111" y="224" width="378" height="39"/>
        <text x="300" y="251" text-anchor="middle">GROWTH CONSULTANT</text>
      </g>
      <text class="sc-hand" x="300" y="317" text-anchor="middle">different challenges. same curiosity.</text>
    </svg>`,
  ];
  const PILE = [{ x: -7, y: 5, r: -9 }, { x: 6, y: 3, r: 7 }, { x: -4, y: -1, r: -4 }, { x: 5, y: -3, r: 4 }, { x: -2, y: 1, r: -1.5 }, { x: 0, y: 0, r: 0 }];

  // ---------- timeline helpers ----------
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const ease = (k) => k * k * (3 - 2 * k);
  const back = (k) => { const c1 = 1.70158, c3 = c1 + 1; return k <= 0 ? 0 : 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };

  function mount(stage) {
    const pages = PILE.map((_, i) => '<div class="page">' + scribbleSVG(7 + i) + '</div>').join('');
    stage.innerHTML = `
      <div class="sc-year"><span class="num">2014</span><span class="circle"></span><span class="tag">first year!</span></div>
      <div class="sc-school">${SCHOOL}</div>
      <div class="sc-pages">${pages}</div>
      <div class="sc-kid kid">${KID}</div>
      ${CONTINUATION_ART.map((art) => '<div class="sc-continuation" hidden>' + art + '</div>').join('')}
      <div class="sc-cap" aria-live="polite"><span class="cap"></span></div>`;
    const q = (s) => stage.querySelector(s);
    const el = {
      year: q('.sc-year'), num: q('.sc-year .num'), circle: q('.sc-year .circle'), tag: q('.sc-year .tag'),
      school: q('.sc-school'), bell: q('.s-bellg'), pages: [...stage.querySelectorAll('.page')],
      kid: q('.sc-kid'), cap: q('.cap'),
      continuation: [...stage.querySelectorAll('.sc-continuation')],
    };
    // every page but the top one starts already written on
    el.pages.slice(0, -1).forEach((p) => p.querySelectorAll('path').forEach((path) => { path.style.strokeDashoffset = '0'; }));
    const live = [...el.pages[el.pages.length - 1].querySelectorAll('path')];
    let capIndex = -1;

    function render(t) {
      // the year: count up, stamp, circle
      const yin = seg(t, 0, 0.35), yout = ease(seg(t, 3.75, 3.95)), stamp = seg(t, 1.4, 1.62);
      el.num.textContent = String(2014 + Math.min(6, Math.floor(seg(t, 0.2, 1.4) * 6.999)));
      el.year.style.opacity = String(yin * (1 - yout));
      el.year.style.transform = 'translate(-50%,-50%) translateY(' + (-yout * 40) + '%) scale(' + (t < 1.4 ? 1 : 1 + 0.5 * (1 - ease(stamp))) + ')';
      el.circle.style.opacity = String(seg(t, 1.6, 1.75));
      el.circle.style.transform = 'scale(' + (1.3 - 0.3 * ease(seg(t, 1.6, 2.0))) + ') rotate(-4deg)';
      el.tag.style.opacity = String(seg(t, 1.85, 2.1));
      // school: slides in, bell swings
      const sin = ease(seg(t, 3.8, 4.5)), sout = ease(seg(t, 7.15, 7.35));
      el.school.style.opacity = String(sin * (1 - sout));
      el.school.style.transform = 'translate(-50%,-50%) translateX(' + ((1 - sin) * 120 - sout * 120) + '%) rotate(' + ((1 - sin) * 8 - sout * 6) + 'deg)';
      const ring = t > 4.4 && t < 6.2 ? Math.sin((t - 4.4) * 22) * 18 * (1 - (t - 4.4) / 1.8) : 0;
      el.bell.style.transform = 'rotate(' + ring + 'deg)';
      // pages: fly in, pile up, top one fills with writing
      const pout = ease(seg(t, 10.4, 10.8));
      el.pages.forEach((pg, i) => {
        const k = seg(t, 7.2 + i * 0.18, 7.62 + i * 0.18), b = back(k), P = PILE[i];
        pg.style.opacity = String((k > 0 ? 1 : 0) * (1 - pout));
        pg.style.transform = 'translate(' + (P.x - pout * 80) + '%,' + (P.y + (1 - b) * 150) + '%) rotate(' + (P.r + (1 - b) * 28 - pout * 20) + 'deg) scale(' + (1 - pout * 0.3) + ')';
      });
      const dk = seg(t, 7.8, 10.2) * live.length;
      live.forEach((path, j) => { path.style.strokeDashoffset = String(1 - clamp01(dk - j)); });
      // kid: rises, writes, sweats
      const kin = back(seg(t, 10.4, 11.0));
      el.kid.style.opacity = String(t < CARDS[2][0] ? seg(t, 10.4, 10.6) : 0);
      el.kid.style.transform = 'translate(-50%,-50%) translateY(' + ((1 - kin) * 40) + '%)';
      el.kid.classList.toggle('writing', t > 10.8 && t < 15.6);
      el.kid.classList.toggle('sweating', t > 11.3 && t < 16);
      // caption
      let ci = 0;
      CARDS.forEach(([start], i) => { if (t >= start) ci = i; });
      el.continuation.forEach((panel, i) => {
        const scene = CONTINUATION_SCENES[i], secondPart = i === 3 || i === 5 || i === 9;
        panel.hidden = ci !== scene || ((i === 2 || i === 4 || i === 8) && t >= MID_SCENE[scene]) || (secondPart && t < MID_SCENE[scene]);
        if (panel.hidden) return;
        const start = secondPart ? MID_SCENE[scene] : CARDS[scene][0];
        panel.style.setProperty('--reveal', String(ease(seg(t, start, start + 0.5))));
        panel.style.setProperty('--detail', String(ease(seg(t, start + 0.4, start + 1.5))));
      });
      if (ci !== capIndex) { el.cap.innerHTML = CAPTIONS[ci]; capIndex = ci; }
      el.cap.parentElement.style.opacity = String(seg(t, CAP_START[ci] + 0.05, CAP_START[ci] + 0.3));
    }
    function fire(prev, t) {
      if (t <= prev) return;
      CUES.forEach((c) => { if (c.t > prev && c.t <= t) c.f(); });
    }
    render(0);
    return { render, fire };
  }

  return { DURATION, CARDS, mount, init, hush, narrationDone };
})();
