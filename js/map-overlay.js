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

  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.className = 'map-fullscreen-toggle';
  fullscreenBtn.setAttribute('aria-label', '전체화면으로 보기');
  fullscreenBtn.setAttribute('aria-pressed', 'false');
  fullscreenBtn.setAttribute('title', '전체화면으로 보기');
  fullscreenBtn.textContent = '⛶';
  fullscreenBtn.hidden = typeof mapSide.requestFullscreen !== 'function';
  mapSide.querySelector('.map-head').appendChild(fullscreenBtn);

  const gotoBtn = document.createElement('button');
  gotoBtn.className = 'map-overlay-goto';
  gotoBtn.textContent = '이 날 일정 보기';
  const dock = mapSide.querySelector('.map-overlay-dock') || mapSide.querySelector('.map-panel');
  dock.appendChild(gotoBtn);

  let currentIdx = 0;
  let overlayOpen = false;
  let returnFocus = fab;
  if (S.onDayChange) S.onDayChange(idx => { currentIdx = idx; });

  function open(){
    returnFocus = document.activeElement || fab;
    overlayOpen = true;
    document.body.classList.add('map-open');
    requestAnimationFrame(() => { if (S.invalidateMap) S.invalidateMap(); });
    if (closeBtn.focus) closeBtn.focus();
  }
  async function close(){
    const wasOpen = overlayOpen;
    overlayOpen = false;
    document.body.classList.remove('map-open');
    if (S.stopLocationTracking) S.stopLocationTracking();
    if (document.fullscreenElement && document.exitFullscreen){
      try { await document.exitFullscreen(); } catch (_) {}
    }
    if (wasOpen && returnFocus && returnFocus.focus){
      // 오버레이가 교차 영역에 들어오며 FAB가 숨겨졌을 수 있으므로
      // FAB로 돌아가는 경로에서는 먼저 표시 상태를 복원한다.
      if (returnFocus === fab) fab.classList.remove('hidden');
      requestAnimationFrame(() => returnFocus.focus());
    }
  }
  async function toggleFullscreen(){
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await mapSide.requestFullscreen();
    } catch (_) {
      fullscreenBtn.hidden = true;
    }
  }
  function syncFullscreen(){
    const active = document.fullscreenElement === mapSide;
    const label = active ? '전체화면 종료' : '전체화면으로 보기';
    fullscreenBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    fullscreenBtn.setAttribute('aria-label', label);
    fullscreenBtn.setAttribute('title', label);
    requestAnimationFrame(() => { if (S.invalidateMap) S.invalidateMap(); });
  }
  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  if (document.addEventListener) document.addEventListener('fullscreenchange', syncFullscreen);
  gotoBtn.addEventListener('click', async () => {
    await close();
    if (S.goToDay) S.goToDay(currentIdx, true);
  });
  S.openMapOverlay = open;
  S.closeMapOverlay = close;

  /* 인라인 지도 가시성 ↔ FAB 표시 토글 */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => fab.classList.toggle('hidden', en.isIntersecting));
  });
  io.observe(mapSide);

  /* 데스크톱 폭 전환 시 오버레이 해제 */
  MOBILE_MQ.addEventListener('change', e => { if (!e.matches) close(); });
})();
