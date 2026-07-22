/* ═══════════ 이동수단 가성비 — 렌터카 vs 택시 탭 & 계산기 ═══════════ */
(function(){
  const scope = document.getElementById('transport');
  if (!scope) return;

  const tabs = scope.querySelectorAll('.stay-tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.toggle('on', b === btn));
      scope.querySelectorAll('.stay-panel').forEach(p =>
        p.classList.toggle('on', p.id === btn.dataset.panel));
    });
  });

  /* 사이판 총 주행거리 — 지도 OSRM 실측 경로 합산 (D2~D8, 로타 제외) */
  const DRIVE_KM = 200;
  const KM_PER_L = 13;      // 소형·준중형 실연비
  const L_PER_GAL = 3.785;

  const KEY = 'saipan-transcalc';
  const el = {
    rate:   document.getElementById('trRate'),
    days:   document.getElementById('trDays'),
    zdc:    document.getElementById('trZdc'),
    gas:    document.getElementById('trGas'),
    taxi:   document.getElementById('trTaxiSum'),
    tip:    document.getElementById('trTip'),
    pickup: document.getElementById('trPickup'),
  };
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  for (const k in el) if (saved[k] != null) el[k].value = saved[k];

  const fmt = v => '$' + Math.round(v).toLocaleString('en-US');
  function recalc(){
    const rate = +el.rate.value || 0, days = +el.days.value || 0;
    const zdc = +el.zdc.value || 0, gas = +el.gas.value || 0;
    const legs = +el.taxi.value || 0, tip = +el.tip.value || 0;
    const pickup = Math.min(+el.pickup.value || 0, legs);

    const fuel = DRIVE_KM / KM_PER_L / L_PER_GAL * gas;
    const car = rate * days + zdc * days + fuel;
    const taxiBase = legs - pickup;
    const taxi = taxiBase * (1 + tip / 100);

    document.getElementById('trTotalA').textContent = fmt(car);
    document.getElementById('trTotalB').textContent = fmt(taxi);
    document.getElementById('trSubA').textContent =
      '차량 ' + fmt(rate * days) + ' (' + days + '일) + 면책 ' + fmt(zdc * days) + ' + 유류 ' + fmt(fuel) + ' (' + DRIVE_KM + 'km)';
    document.getElementById('trSubB').textContent =
      '구간 ' + fmt(legs) + ' − 투어 픽업 ' + fmt(pickup) + ' + 팁 ' + fmt(taxiBase * tip / 100);
    document.getElementById('trCardA').classList.toggle('win', car <= taxi);
    document.getElementById('trCardB').classList.toggle('win', taxi < car);

    const d = Math.abs(car - taxi);
    document.getElementById('trVerdict').innerHTML = (d < 30
      ? '⚖️ 현재 입력 기준 두 방식의 비용이 <b>사실상 동급</b>(차이 ' + fmt(d) + ')입니다 — 이 경우 스팟 스위칭·새벽 이동이 자유로운 <b>렌터카</b>가 우세합니다.'
      : car < taxi
        ? '🚗 현재 입력 기준 <b>렌터카</b>가 <b>' + fmt(d) + '</b> 더 저렴합니다. 자유도까지 감안하면 렌터카가 확실히 우세합니다.'
        : '🚕 현재 입력 기준 <b>택시(+투어 픽업) 조합</b>이 <b>' + fmt(d) + '</b> 더 저렴합니다. 다만 원격 스팟 이동·새벽 호출의 불확실성은 감수해야 합니다.')
      + '<small>공통 팁: 가라판 디너·선셋 크루즈 저녁(D7)은 음주 예정이면 렌터카여도 그날만 택시를 쓰세요. 렌터카 유류는 실주행 ' + DRIVE_KM + 'km · 연비 ' + KM_PER_L + 'km/L 기준 추정입니다.</small>';

    localStorage.setItem(KEY, JSON.stringify({
      rate: el.rate.value, days: el.days.value, zdc: el.zdc.value, gas: el.gas.value,
      taxi: el.taxi.value, tip: el.tip.value, pickup: el.pickup.value,
    }));
  }
  for (const k in el) el[k].addEventListener('input', recalc);
  recalc();
})();
