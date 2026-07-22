/* ═══════════ 숙박 전략 비교 — 탭 & 계산기 ═══════════ */
(function(){
  /* 탭 토글은 섹션 스코프로 — 같은 클래스를 쓰는 다른 섹션(#transport)과 간섭 방지 */
  const scope = document.getElementById('staycompare');
  const tabs = scope.querySelectorAll('.stay-tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.toggle('on', b === btn));
      scope.querySelectorAll('.stay-panel').forEach(p =>
        p.classList.toggle('on', p.id === btn.dataset.panel));
    });
  });

  const KEY = 'saipan-staycalc';
  const el = {
    rate: document.getElementById('calcRate'),
    fee:  document.getElementById('calcFee'),
    days: document.getElementById('calcDays'),
    golf: document.getElementById('calcGolf'),
    air:  document.getElementById('calcAir'),
    rota: document.getElementById('calcRota'),
  };
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  for (const k in el) if (saved[k] != null) el[k].value = saved[k];

  const fmt = v => '$' + Math.round(v).toLocaleString('en-US');
  function recalc(){
    const rate = +el.rate.value || 0, fee = +el.fee.value || 0;
    const days = +el.days.value || 0, golf = +el.golf.value || 0;
    const rota = (+el.air.value || 0) + (+el.rota.value || 0);
    const extra = fee * days + golf;
    const a = rate * 7 + rota, b = rate * 6 + extra + rota;
    document.getElementById('totalA').textContent = fmt(a);
    document.getElementById('totalB').textContent = fmt(b);
    document.getElementById('subA').textContent =
      '켄싱턴 ' + fmt(rate * 7) + ' (7박) + 로타 공통 ' + fmt(rota);
    document.getElementById('subB').textContent =
      '켄싱턴 ' + fmt(rate * 6) + ' (6박) + 추가요금 ' + fmt(fee * days) + ' + 골프 손실 ' + fmt(golf) + ' + 로타 공통 ' + fmt(rota);
    document.getElementById('cardA').classList.toggle('win', a <= b);
    document.getElementById('cardB').classList.toggle('win', b < a);
    const d = Math.abs(a - b);
    const v = document.getElementById('calcVerdict');
    v.innerHTML = (a === b
      ? '⚖️ 현재 입력 기준 두 옵션의 비용이 같습니다 — 편의성이 앞서는 <b>옵션 A(연박 유지)</b>를 권합니다.'
      : a < b
        ? '🏨 현재 입력 기준 <b>옵션 A(연박 유지)</b>가 <b>' + fmt(d) + '</b> 더 저렴합니다. 짐·체크인 편의까지 감안하면 A가 우세합니다.'
        : '✂️ 현재 입력 기준 <b>옵션 B(분할 예약)</b>가 <b>' + fmt(d) + '</b> 더 저렴합니다. 재체크인·짐 보관의 번거로움을 감수할 만한지 판단해 보세요.')
      + '<small>분할(B)이 이득이 되는 조건: 분할 추가비용 합계(' + fmt(extra) + ')가 켄싱턴 1박 요금(' + fmt(rate) + ')보다 작아야 합니다.</small>';
    localStorage.setItem(KEY, JSON.stringify({
      rate: el.rate.value, fee: el.fee.value, days: el.days.value,
      golf: el.golf.value, air: el.air.value, rota: el.rota.value,
    }));
  }
  for (const k in el) el[k].addEventListener('input', recalc);
  recalc();
})();
