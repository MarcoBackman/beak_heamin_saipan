/* ═══════════ 지도 & 일자별 동선 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S) return;
  const DAYS = S.DAYS;
  const mapEl = document.getElementById('map');
  if (typeof L === 'undefined') {
    mapEl.outerHTML = '<div class="map-fallback">지도를 불러오지 못했습니다.<br>인터넷 연결 후 새로고침 해주세요.</div>';
    return;
  }

  const map = L.map('map', { zoomControl:false, attributionControl:true });
  L.control.zoom({ position:'bottomright' }).addTo(map);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom:18, subdomains:'abcd',
  }).addTo(map);
  map.setView([15.19, 145.75], 11);

  const routeLayer = L.layerGroup().addTo(map);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOBILE_MQ = window.matchMedia('(max-width:1023px)');

  /* 전체 스팟 레이어 — 스팟 가이드와 연동 */
  const spotsLayer = L.layerGroup();
  const spotIcon = L.divIcon({ className:'', html:'<div class="spot-pin"></div>', iconSize:[12,12], iconAnchor:[6,6] });
  S.SPOTS.forEach(s => {
    L.marker(s.ll, { icon:spotIcon })
      .bindTooltip(s.nm + ' · ' + s.kind, { className:'stop-tip', direction:'top', offset:[0,-8] })
      .addTo(spotsLayer);
  });
  const spotsBtn = document.getElementById('spotsToggle');
  spotsBtn.addEventListener('click', () => {
    if (map.hasLayer(spotsLayer)){ map.removeLayer(spotsLayer); spotsBtn.classList.remove('on'); }
    else { map.addLayer(spotsLayer); spotsBtn.classList.add('on'); }
  });
  S.flySpot = function(ll, name){
    if (!map.hasLayer(spotsLayer)){ map.addLayer(spotsLayer); spotsBtn.classList.add('on'); }
    map.flyTo(ll, 14, { duration:.9 });
    L.popup({ offset:[0,-8] }).setLatLng(ll).setContent(name).openOn(map);
  };

  const LINE_STYLE = {
    drive:{ color:'#1c1c1c', weight:3,   opacity:.85 },
    fly:  { color:'#1c1c1c', weight:2.5, opacity:.6, dashArray:'3 9' },
    boat: { color:'#1c1c1c', weight:2.5, opacity:.6, dashArray:'1 7', lineCap:'round' },
    trek: { color:'#1c1c1c', weight:2.5, opacity:.7, dashArray:'1 5', lineCap:'round' },
  };

  function interp(a, b, n){
    const pts = [];
    for (let i=1; i<=n; i++) pts.push([a[0]+(b[0]-a[0])*i/n, a[1]+(b[1]-a[1])*i/n]);
    return pts;
  }
  /* 비행 구간: 살짝 휘어진 아치 */
  function arc(a, b, n){
    const pts = [];
    const mx=(a[0]+b[0])/2, my=(a[1]+b[1])/2;
    const dx=b[0]-a[0], dy=b[1]-a[1];
    const cx=mx-dy*0.18, cy=my+dx*0.18;
    for (let i=1; i<=n; i++){
      const t=i/n, u=1-t;
      pts.push([u*u*a[0]+2*u*t*cx+t*t*b[0], u*u*a[1]+2*u*t*cy+t*t*b[1]]);
    }
    return pts;
  }
  function legPts(a, b, mode){
    const d = Math.hypot(b[0]-a[0], b[1]-a[1]);
    const n = Math.max(14, Math.min(60, Math.round(d*220)));
    return (mode==='fly') ? arc(a,b,n) : interp(a,b,n);
  }

  function pinIcon(num){
    return L.divIcon({ className:'', html:'<div class="pin">'+num+'</div>', iconSize:[26,26], iconAnchor:[13,13] });
  }
  function bearingDeg(from, to){
    const lat1 = from[0] * Math.PI / 180, lat2 = to[0] * Math.PI / 180;
    const dLon = (to[1] - from[1]) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function planeIcon(angle, mover){
    const cssAngle = angle - 90;
    const svg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.7 11.3 3.2 2.6c-.7-.3-1.4.4-1.1 1.1l3 7.4 7.5.9-7.5.9-3 7.4c-.3.7.4 1.4 1.1 1.1l18.5-8.7c.6-.3.6-1.1 0-1.4Z"/></svg>';
    return L.divIcon({
      className:'',
      html:'<div class="plane-pin' + (mover ? ' mover' : '') + '" style="--bearing:' + cssAngle.toFixed(1) + 'deg">' + svg + '</div>',
      iconSize:mover ? [28,28] : [32,32],
      iconAnchor:mover ? [14,14] : [16,16],
    });
  }
  const dotIcon = L.divIcon({ className:'', html:'<div class="dot"></div>', iconSize:[14,14], iconAnchor:[7,7] });

  function addStopMarker(stop, num, prevLL, nextFlyLL){
    if (stop.virtual) return;
    const isFlight = (stop.mode === 'fly' && prevLL) || !!nextFlyLL;
    const fromLL = nextFlyLL ? stop.ll : prevLL;
    const toLL = nextFlyLL || stop.ll;
    const marker = L.marker(stop.ll, {
      icon:isFlight ? planeIcon(bearingDeg(fromLL, toLL), false) : pinIcon(num),
      zIndexOffset:isFlight ? 800 : 0,
    });
    marker
      .bindTooltip(stop.n, { className:'stop-tip', direction:'top', offset:[0,isFlight ? -18 : -14], permanent:true, opacity:1 })
      .addTo(routeLayer);
  }

  let animToken = 0;
  let current = -1;
  let lastBounds = null;

  /* 외부 연동 API — day-nav.js가 소비 */
  const dayChangeCbs = [];
  S.onDayChange = cb => { dayChangeCbs.push(cb); if (current >= 0) cb(current); };
  S.goToDay = goToDay;
  S.invalidateMap = () => {
    map.invalidateSize();
    if (lastBounds) map.flyToBounds(lastBounds, { padding:[52,52], duration:0, maxZoom:13 });
  };

  function showDay(idx, animate){
    idx = Math.max(0, Math.min(DAYS.length-1, idx));
    if (idx === current) return;
    current = idx;
    const day = DAYS[idx];
    const token = ++animToken;

    document.getElementById('mapDayLabel').textContent = day.label;
    document.getElementById('mapDayTitle').textContent = day.title;
    document.getElementById('daySlider').value = idx;
    document.querySelectorAll('#overview a').forEach(a =>
      a.classList.toggle('active', +a.dataset.day === idx));
    document.querySelectorAll('article.day').forEach(el =>
      el.classList.toggle('active', +el.dataset.day === idx));
    dayChangeCbs.forEach(cb => cb(idx));

    routeLayer.clearLayers();

    const realStops = day.stops.filter(s => !s.virtual);
    const bounds = L.latLngBounds(day.stops.map(s => s.ll));
    lastBounds = bounds;
    map.flyToBounds(bounds, { padding:[52,52], duration: animate ? .8 : 0, maxZoom:13 });

    /* 구간(leg) 목록 구성 */
    const legs = [];
    for (let i=1; i<day.stops.length; i++){
      const prev = day.stops[i-1], cur = day.stops[i];
      legs.push({ mode:cur.mode||'drive', pts:legPts(prev.ll, cur.ll, cur.mode||'drive'), stop:cur });
    }

    let numCounter = 0;
    if (!day.stops[0].virtual) addStopMarker(day.stops[0], ++numCounter);

    if (!animate || reducedMotion){
      let prevLL = day.stops[0].ll;
      legs.forEach((leg, i) => {
        L.polyline([prevLL, ...leg.pts], LINE_STYLE[leg.mode]).addTo(routeLayer);
        const nextLeg = legs[i+1];
        const nextFlyLL = nextLeg && nextLeg.mode === 'fly' && nextLeg.stop.virtual ? nextLeg.stop.ll : null;
        if (!leg.stop.virtual) addStopMarker(leg.stop, ++numCounter, prevLL, nextFlyLL);
        prevLL = leg.stop.ll;
      });
      return;
    }

    /* 네비게이션처럼 순차적으로 선 그리기 */
    const mover = L.marker(day.stops[0].ll, { icon:dotIcon, zIndexOffset:1000 }).addTo(routeLayer);
    let legIdx = 0;

    function animateLeg(){
      if (token !== animToken) return;
      if (legIdx >= legs.length){ routeLayer.removeLayer(mover); return; }
      const leg = legs[legIdx];
      const startLL = legIdx === 0 ? day.stops[0].ll : legs[legIdx-1].stop.ll;
      const line = L.polyline([startLL], LINE_STYLE[leg.mode]).addTo(routeLayer);
      mover.setIcon(leg.mode === 'fly' ? planeIcon(bearingDeg(startLL, leg.stop.ll), true) : dotIcon);
      const total = leg.pts.length;
      const durMs = leg.mode==='fly' ? 900 : 650;
      const perFrame = Math.max(1, Math.round(total / (durMs/16)));
      let k = 0;

      function frame(){
        if (token !== animToken) return;
        k = Math.min(total, k + perFrame);
        const slice = leg.pts.slice(0, k);
        line.setLatLngs([startLL, ...slice]);
        mover.setLatLng(slice[slice.length-1]);
        if (k < total){ requestAnimationFrame(frame); }
        else {
          const nextLeg = legs[legIdx+1];
          const nextFlyLL = nextLeg && nextLeg.mode === 'fly' && nextLeg.stop.virtual ? nextLeg.stop.ll : null;
          if (!leg.stop.virtual) addStopMarker(leg.stop, ++numCounter, startLL, nextFlyLL);
          legIdx++;
          setTimeout(animateLeg, 220);
        }
      }
      requestAnimationFrame(frame);
    }
    /* 지도 이동이 어느 정도 진행된 뒤 그리기 시작 */
    setTimeout(animateLeg, 500);
  }

  /* ── 슬라이더 / 버튼 ── */
  const slider = document.getElementById('daySlider');
  let scrollLock = false;

  function goToDay(idx, scroll){
    showDay(idx, true);
    if (scroll){
      const el = document.getElementById('day'+(idx+1));
      if (el){
        scrollLock = true;
        el.scrollIntoView({ behavior:'smooth', block:'start' });
        setTimeout(() => { scrollLock = false; }, 900);
      }
    }
  }
  slider.addEventListener('input',  e => showDay(+e.target.value, true));
  slider.addEventListener('change', e => goToDay(+e.target.value, !MOBILE_MQ.matches));
  document.getElementById('prevDay').addEventListener('click', () => goToDay(current-1 < 0 ? 0 : current-1, !MOBILE_MQ.matches));
  document.getElementById('nextDay').addEventListener('click', () => goToDay(current+1 > 7 ? 7 : current+1, !MOBILE_MQ.matches));

  /* ── 스크롤 연동: 보고 있는 날짜를 지도에 반영 ── */
  const observer = new IntersectionObserver(entries => {
    if (scrollLock) return;
    entries.forEach(en => {
      if (en.isIntersecting) showDay(+en.target.dataset.day, true);
    });
  }, { rootMargin:'-35% 0px -55% 0px', threshold:0 });
  document.querySelectorAll('article.day').forEach(el => observer.observe(el));

  /* ── 한눈에 보기 클릭 연동 ── */
  document.querySelectorAll('#overview a').forEach(a => {
    a.addEventListener('click', () => showDay(+a.dataset.day, true));
  });

  showDay(0, true);
})();
