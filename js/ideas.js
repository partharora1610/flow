window.Ideas = (() => {
  const section = document.getElementById('ideas');
  const panels = [...section.querySelectorAll('[data-idea-panel]')];
  const audio = [...section.querySelectorAll('audio')];
  const next = document.getElementById('ideasNext'), prev = document.getElementById('ideasPrev');
  const status = document.getElementById('ideasStatus'), count = document.getElementById('ideasCount');
  const restart = document.getElementById('restart');
  let active = 0, visible = false;
  const done = panels.map(() => false);
  function update() {
    panels.forEach((panel, i) => { panel.hidden = i !== active; });
    count.textContent = '0' + (active + 1) + ' / 0' + panels.length;
    const last = active === panels.length - 1;
    prev.hidden = active === 0;
    prev.textContent = active === 2 ? '← Cab campaign' : '← Product idea';
    next.hidden = last;
    next.textContent = active === 1 ? 'Campaign line →' : 'Next idea →';
    next.disabled = !done[active];
    restart.hidden = !last || !done[active];
    section.classList.toggle('finished', !restart.hidden);
    status.textContent = !done[active] ? 'Listen and explore the idea.' : last ? 'That’s where I’d start.' : 'Press Space or Enter, or tap the next button.';
  }
  function resume() {
    audio[active].play().catch(() => { done[active] = true; update(); });
  }
  function show(i) {
    audio.forEach((clip) => { clip.pause(); clip.currentTime = 0; });
    active = i; done[i] = false;
    update(); resume();
    panels[i].querySelector('h2').focus({ preventScroll: true });
  }
  function open() {
    section.hidden = false;
    section.scrollIntoView({ behavior: 'auto' });
    show(0);
  }
  audio.forEach((clip, i) => {
    clip.addEventListener('ended', () => { done[i] = true; update(); });
    clip.addEventListener('error', () => { done[i] = true; update(); });
  });
  next.addEventListener('click', () => { if (done[active] && active < panels.length - 1) show(active + 1); });
  prev.addEventListener('click', () => show(active - 1));
  document.getElementById('ideasReplay').addEventListener('click', () => show(active));
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    if (!visible) audio.forEach((clip) => clip.pause());
    else if (!document.hidden && !done[active] && audio[active].paused) resume();
  }, { threshold: 0.6 }).observe(section);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.forEach((clip) => clip.pause());
    else if (visible && !done[active]) resume();
  });
  document.addEventListener('keydown', (e) => {
    if (!visible || e.repeat || (e.key !== ' ' && e.key !== 'Enter') || e.target.closest('button, a, input, textarea, select')) return;
    e.preventDefault();
    if (active < panels.length - 1 && done[active]) next.click();
  });

  const concept = document.getElementById('decodeConcept'), decode = document.getElementById('decodeButton');
  const transcript = document.getElementById('noteTranscript'), draft = document.getElementById('replyDraftBlock');
  const reply = document.getElementById('replyDraft');
  function resetDemo() {
    concept.classList.remove('decoded'); transcript.hidden = draft.hidden = true;
    reply.value = reply.defaultValue; decode.querySelector('span').textContent = 'Decode by Wispr Flow';
  }
  decode.addEventListener('click', () => {
    if (concept.classList.contains('decoded')) {
      resetDemo();
      return;
    }
    decode.disabled = true; decode.querySelector('span').textContent = 'Reading the voice note…';
    setTimeout(() => {
      transcript.hidden = draft.hidden = false; concept.classList.add('decoded');
      decode.disabled = false; decode.querySelector('span').textContent = 'Reset example';
    }, 650);
  });

  function reset() {
    audio.forEach((clip) => { clip.pause(); clip.currentTime = 0; });
    section.hidden = true; visible = false; active = 0; done.fill(false);
    resetDemo(); update();
  }
  return { open, reset };
})();
