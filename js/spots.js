/* ═══════════ 프리다이빙 · 수영 스팟 가이드 (리서치 검증 데이터) ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S) return;
  const SPOTS = S.SPOTS;

  function card(s){
    return '<div class="spotcard">' +
      '<div class="head"><span class="nm">' + s.nm + '</span><span class="en">' + s.en + '</span><span class="kind">' + s.kind + '</span></div>' +
      '<div class="meta"><span class="chip">📏 ' + s.depth + '</span><span class="chip">🎯 ' + s.level + '</span><span class="chip">⏰ ' + s.best + '</span></div>' +
      '<p>' + s.desc + '</p>' +
      '<details><summary>안전 · 팁</summary><p>' + s.tip + '</p></details>' +
      '<button class="goto" data-ll="' + s.ll.join(',') + '" data-nm="' + s.nm + '">📍 지도에서 보기</button>' +
      '</div>';
  }
  const sEl = document.getElementById('spotsSaipan');
  const rEl = document.getElementById('spotsRota');
  if (sEl) sEl.innerHTML = SPOTS.filter(s => s.island === 'saipan').map(card).join('');
  if (rEl) rEl.innerHTML = SPOTS.filter(s => s.island === 'rota').map(card).join('');
  document.querySelectorAll('.spotcard .goto').forEach(btn => {
    btn.addEventListener('click', () => {
      const ll = btn.dataset.ll.split(',').map(Number);
      if (S.flySpot) S.flySpot(ll, btn.dataset.nm);
      if (window.matchMedia('(max-width:1023px)').matches){
        if (S.openMapOverlay) S.openMapOverlay();
        else document.getElementById('mapSide').scrollIntoView({ behavior:'smooth', block:'center' });
      }
    });
  });
})();
