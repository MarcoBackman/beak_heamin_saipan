/* ═══════════ 모바일 지도 오버레이 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S) return;
  const mapSide = document.getElementById('mapSide');
  if (!mapSide) return;
  const MOBILE_MQ = window.matchMedia('(max-width:1023px)');

  /* FAB — 인라인 지도가 화면 밖일 때만 표시 */
  const fab = document.createElement('button');
  fab.className = 'map-fab hidden';
  fab.setAttribute('aria-label', '지도 열기');
  fab.textContent = '🗺️ 지도';
  document.body.appendChild(fab);

  /* 오버레이 컨트롤 — 헤더 ✕, 하단 '이 날 일정 보기' */
  const closeBtn = document.createElement('button');
  closeBtn.className = 'map-overlay-close';
  closeBtn.setAttribute('aria-label', '지도 닫기');
  closeBtn.textContent = '✕';
  mapSide.querySelector('.map-head').appendChild(closeBtn);

  const gotoBtn = document.createElement('button');
  gotoBtn.className = 'map-overlay-goto';
  gotoBtn.textContent = '이 날 일정 보기';
  mapSide.querySelector('.map-panel').appendChild(gotoBtn);

  let currentIdx = 0;
  if (S.onDayChange) S.onDayChange(idx => { currentIdx = idx; });

  function open(){
    document.body.classList.add('map-open');
    requestAnimationFrame(() => { if (S.invalidateMap) S.invalidateMap(); });
  }
  function close(){
    document.body.classList.remove('map-open');
  }
  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  gotoBtn.addEventListener('click', () => {
    close();
    if (S.goToDay) S.goToDay(currentIdx, true);
  });
  S.openMapOverlay = open;

  /* 인라인 지도 가시성 ↔ FAB 표시 토글 */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => fab.classList.toggle('hidden', en.isIntersecting));
  });
  io.observe(mapSide);

  /* 데스크톱 폭 전환 시 오버레이 해제 */
  MOBILE_MQ.addEventListener('change', e => { if (!e.matches) close(); });
})();
