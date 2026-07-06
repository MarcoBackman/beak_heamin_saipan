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
