/* ═══════════ 일자별 자세히 보기 — 시간대별 할 일 · 챙길 것 모달 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S || !S.DETAILS || !S.DAYS) return;
  const KEY = 'saipan-day-details';
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');

  function esc(s){
    return String(s).replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  /* 하루치 체크 항목 키 목록 (todo + bring) */
  function keysOf(dayNum){
    const d = S.DETAILS[dayNum];
    return d.todo.map((_, i) => 'd' + dayNum + '-t' + i)
      .concat(d.bring.map((_, i) => 'd' + dayNum + '-b' + i));
  }

  /* ── 모달 골격 (하나를 재사용) ────────── */
  const modal = document.createElement('div');
  modal.className = 'detail-modal';
  modal.innerHTML =
    '<div class="dm-panel" role="dialog" aria-modal="true" aria-labelledby="dmTitle">' +
      '<button class="dm-close" aria-label="닫기">✕</button>' +
      '<div class="dm-head"><span class="dm-label" id="dmLabel"></span><h3 id="dmTitle"></h3></div>' +
      '<div class="dm-body" id="dmBody"></div>' +
      '<p class="dm-hint">✓ 체크 상태는 이 브라우저에 자동 저장됩니다.</p>' +
    '</div>';
  document.body.appendChild(modal);
  const dmLabel = modal.querySelector('#dmLabel');
  const dmTitle = modal.querySelector('#dmTitle');
  const dmBody  = modal.querySelector('#dmBody');
  let opener = null;

  function row(k, time, text){
    return '<li><label>' +
      '<input type="checkbox" data-k="' + k + '"' + (saved[k] ? ' checked' : '') + '>' +
      (time ? '<span class="t">' + esc(time) + '</span>' : '') +
      '<span class="x">' + esc(text) + '</span></label></li>';
  }

  function open(idx){                          /* idx: 0-based day index */
    const dayNum = idx + 1;
    const d = S.DETAILS[dayNum];
    if (!d) return;
    dmLabel.textContent = S.DAYS[idx].label;
    dmTitle.textContent = S.DAYS[idx].title;
    dmBody.innerHTML =
      '<section><h4>🕑 시간대별 할 일</h4><ul class="dm-todo">' +
        d.todo.map((it, i) => row('d' + dayNum + '-t' + i, it.t, it.x)).join('') +
      '</ul></section>' +
      '<section><h4>🎒 챙길 것</h4><ul class="dm-bring">' +
        d.bring.map((b, i) => row('d' + dayNum + '-b' + i, '', b)).join('') +
      '</ul></section>';
    modal.classList.add('on');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.dm-close').focus();
  }

  function close(){
    modal.classList.remove('on');
    document.body.style.overflow = '';
    if (opener){ opener.focus(); opener = null; }
  }

  dmBody.addEventListener('change', e => {
    const cb = e.target;
    if (!cb.matches('input[type=checkbox]')) return;
    saved[cb.dataset.k] = cb.checked;
    localStorage.setItem(KEY, JSON.stringify(saved));
    refreshCounts();
  });
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  modal.querySelector('.dm-close').addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('on')) close();
  });

  /* ── 각 Day 카드에 버튼 주입 ─────────── */
  const btns = {};                             /* dayNum → button */
  document.querySelectorAll('article.day').forEach(art => {
    const idx = +art.dataset.day;
    const dayNum = idx + 1;
    if (!S.DETAILS[dayNum]) return;
    const btn = document.createElement('button');
    btn.className = 'detail-btn';
    btn.innerHTML = '📋 자세히 보기 <span class="sub">시간대별 할 일 · 챙길 것</span><span class="cnt"></span>';
    const anchor = art.querySelector('.sched') || art.querySelector('.day-head');
    anchor.insertAdjacentElement('afterend', btn);
    btn.addEventListener('click', () => { opener = btn; open(idx); });
    btns[dayNum] = btn;
  });

  function refreshCounts(){
    Object.keys(btns).forEach(dayNum => {
      const keys = keysOf(+dayNum);
      const done = keys.filter(k => saved[k]).length;
      const el = btns[dayNum].querySelector('.cnt');
      el.textContent = done ? done + '/' + keys.length : '';
      btns[dayNum].classList.toggle('all-done', done === keys.length);
    });
  }
  refreshCounts();
})();
