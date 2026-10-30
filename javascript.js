(() => {
  const $ = (q, r = document) => r.querySelector(q);
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const S = $$('.slide'), N = S.length, deck = $('#deck');
  const RM = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let c = -1, lock = 0;

  // status dots, reveal order, nav dots
  $$('[data-s]').forEach(e => e.insertAdjacentHTML('beforeend', e.dataset.s.split(' ').map(s => `<i class="dot ${s}"></i>`).join('')));
  S.forEach(s => { $$('.a', s).forEach((e, j) => e.style.setProperty('--i', j)); s.inert = true; });
  S.forEach((s, i) => {
    const b = document.createElement('button');
    b.title = ($('h1,h2', s) || {}).textContent || '';
    b.setAttribute('aria-label', 'Слайд ' + (i + 1));
    b.onclick = e => { to(i); e.currentTarget.blur(); };
    $('#dots').append(b);
  });

  const idx = () => (parseInt((location.hash.match(/slide-(\d+)/) || [])[1]) || 1) - 1;
  const clamp = i => Math.min(N - 1, Math.max(0, i));
  const to = i => { i = clamp(i); if (i !== c) location.hash = '#slide-' + (i + 1); };

  function count(e) {
    const t = +e.dataset.n;
    if (RM) return void (e.textContent = t);
    const t0 = performance.now();
    (function f(now) {
      const k = Math.min(1, (now - t0) / 1400);
      e.textContent = Math.round(t * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(f);
    })(t0);
  }

  function show(i) {
    i = clamp(i); if (i === c) return;
    const p = S[c], n = S[i];
    deck.classList.toggle('back', i < c);
    if (p) { p.classList.remove('on'); p.classList.add('out'); p.inert = true; setTimeout(() => p.classList.remove('out'), 750); }
    n.classList.remove('out'); n.inert = false; n.classList.add('on');
    n.scrollTop = 0; $('.in', n).scrollTop = 0;
    c = i;
    $$('[data-n]', n).forEach(count);
    $('#ct').textContent = String(i + 1).padStart(2, '0') + ' / ' + N;
    $('#bar').style.setProperty('--p', (i + 1) / N);
    $$('#dots button').forEach((b, j) => b.classList.toggle('cur', j === i));
    $('#pv').disabled = i === 0; $('#nx').disabled = i === N - 1;
  }

  addEventListener('hashchange', () => show(idx()));
  show(idx());

  // buttons
  $('#pv').onclick = e => { to(c - 1); e.currentTarget.blur(); };
  $('#nx').onclick = e => { to(c + 1); e.currentTarget.blur(); };
  const fs = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  $('#fs').onclick = e => { fs(); e.currentTarget.blur(); };

  // keyboard
  addEventListener('keydown', e => {
    if (e.target.closest('input,textarea,select,[contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return;
    const m = { ArrowRight: 1, ArrowDown: 1, ' ': 1, PageDown: 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (m) { e.preventDefault(); to(c + m); }
    else if (e.key === 'Home') { e.preventDefault(); to(0); }
    else if (e.key === 'End') { e.preventDefault(); to(N - 1); }
    else if (e.key === 'f' || e.key === 'F') fs();
  });

  // wheel (debounced; lets tall slides scroll first)
  addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) < 18 || Date.now() < lock) return;
    const s = $('.in', S[c]);
    if (s.scrollHeight > s.clientHeight + 4) {
      const end = s.scrollTop + s.clientHeight >= s.scrollHeight - 2, top = s.scrollTop <= 0;
      if ((e.deltaY > 0 && !end) || (e.deltaY < 0 && !top)) return;
    }
    lock = Date.now() + 850; to(c + (e.deltaY > 0 ? 1 : -1));
  }, { passive: true });

  // swipe (horizontal only; vertical scroll stays native on phones)
  let tx = 0, ty = 0;
  addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) to(c + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // pointer: soft glow + light parallax
  let raf = 0, mx = .5, my = .5;
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth; my = e.clientY / innerHeight;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = document.documentElement.style;
      r.setProperty('--mx', mx * 100 + '%'); r.setProperty('--my', my * 100 + '%');
      if (!RM) $$('[data-p]', S[c]).forEach(el => el.style.translate = `${(mx - .5) * -el.dataset.p}px ${(my - .5) * -el.dataset.p}px`);
    });
  });

  // card depth on hover
  if (!RM) $$('.card').forEach(d => {
    d.addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return;
      const r = d.getBoundingClientRect();
      d.style.transform = `perspective(800px) rotateX(${(.5 - (e.clientY - r.top) / r.height) * 4}deg) rotateY(${((e.clientX - r.left) / r.width - .5) * 5}deg)`;
    });
    d.addEventListener('pointerleave', () => d.style.transform = '');
  });

  // demo chips + converter swap
  $$('.ph .chs').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('b'); if (!b) return;
    $$('b', g).forEach(x => x.classList.toggle('sel', x === b));
  }));
  const sw = $('.sw'); let ang = 0;
  if (sw) sw.onclick = () => { ang += 180; sw.style.rotate = ang + 'deg'; };
})();