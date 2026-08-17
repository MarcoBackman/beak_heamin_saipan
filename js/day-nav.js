/* ═══════════ Day 칩 바 — 일자별 바로가기 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S || !S.DAYS) return;
  const topnav = document.querySelector('nav.topnav');
  const bar = document.createElement('nav');
  bar.className = 'day-chips';
  bar.setAttribute('aria-label', '일자별 바로가기');
  bar.innerHTML = S.DAYS.map((d, i) => {
    const m = d.label.match(/\d+\/\d+ ./);      // "Day 1 · 9/10 목" → "9/10 목"
    return '<button class="day-chip" data-day="' + i + '">D' + (i + 1) +
           '<span>' + (m ? m[0] : '') + '</span></button>';
  }).join('');
  topnav.insertAdjacentElement('afterend', bar);

  /* topnav 실제 높이에 맞춰 sticky 오프셋 동기화 (모바일 내비 높이 가변 대응) */
  const setTop = () => { bar.style.top = topnav.offsetHeight + 'px'; };
  setTop();
  window.addEventListener('resize', setTop);

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.day-chip');
    if (btn && S.goToDay) S.goToDay(+btn.dataset.day, true);
  });
  if (S.onDayChange) S.onDayChange(idx => {
    bar.querySelectorAll('.day-chip').forEach(c => {
      const on = +c.dataset.day === idx;
      c.classList.toggle('on', on);
      if (on) c.scrollIntoView({ block:'nearest', inline:'nearest', behavior:'smooth' });
    });
  });
})();

/* ═══════════ 모바일 접힘 — 쇼츠·참고 콘텐츠·앨범 ═══════════ */
(function(){
  const mobile = window.matchMedia('(max-width:768px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.shorts, .refs, .album').forEach(b => {
    const h = b.querySelector('h4');
    if (!h) return;
    b.classList.add('fold');
    if (mobile) b.classList.add('closed');
    const btn = document.createElement('button');
    btn.className = 'fold-toggle';
    btn.setAttribute('aria-expanded', String(!mobile));
    btn.innerHTML = h.innerHTML + '<span class="chev">▾</span>';
    h.replaceWith(btn);
    btn.addEventListener('click', () => {
      const closed = b.classList.toggle('closed');
      btn.setAttribute('aria-expanded', String(!closed));
      /* 펼침 시 미로드 쇼츠 즉시 로드 (IO 미발화 대비) — reduced-motion은 기존 클릭 재생 유지 */
      const S = window.SAIPAN;
      if (!closed && !reduced && S && S.loadShort){
        b.querySelectorAll('.short-card:not([data-loaded])').forEach(c => S.loadShort(c));
      }
    });
  });
})();

/* ═══════════ 모바일 ☰ 메뉴 시트 ═══════════ */
(function(){
  const btn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;
  const set = open => {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '✕' : '☰';
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  };
  btn.addEventListener('click', () => set(!links.classList.contains('open')));
  links.addEventListener('click', e => {
    if (e.target.closest('a, button')) set(false);
  });
})();
