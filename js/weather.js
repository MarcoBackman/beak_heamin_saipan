/* ═══════════ 날씨 — 예보/평년 배지 + 배경 연출 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S || !S.TRIP || !S.WX_FALLBACK) return;
  const ICON = { sun:'☀️', cloud:'☁️', rain:'🌧️', thunder:'⛈️' };

  function themeOf(code){
    if (code <= 1) return 'sun';
    if (code <= 3 || code === 45 || code === 48) return 'cloud';
    if (code >= 95) return 'thunder';
    if (code >= 51) return 'rain';
    return 'cloud';
  }

  function getForecast(){
    const T = S.TRIP;
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + T.lat +
      '&longitude=' + T.lon +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
      '&timezone=' + encodeURIComponent(T.tz) +
      '&start_date=' + T.start + '&end_date=' + T.end;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    return fetch(url, { signal: ctrl.signal })
      .then(res => res.ok ? res.json() : null)
      .then(j => {
        if (!j || !j.daily || !j.daily.time) return null;
        const d = j.daily;
        return d.time.map((t, i) =>
          d.weather_code[i] == null || d.temperature_2m_max[i] == null ? null : {
            theme: themeOf(d.weather_code[i]),
            tmax: Math.round(d.temperature_2m_max[i]),
            tmin: Math.round(d.temperature_2m_min[i]),
            pop: d.precipitation_probability_max[i],
            live: true,
          });
      })
      .catch(() => null)
      .finally(() => clearTimeout(timer));
  }

  function renderDay(i, wx){
    const art = document.querySelector('article.day[data-day="' + i + '"]');
    if (!art) return;
    art.dataset.wx = wx.theme;
    const layer = document.createElement('div');
    layer.className = 'wx-layer';
    art.prepend(layer);
    const head = art.querySelector('.day-head');
    if (head){
      const b = document.createElement('span');
      b.className = 'wx-badge';
      b.innerHTML = ICON[wx.theme] + ' ' + wx.tmax + '° / ' + wx.tmin + '°' +
        (wx.pop != null ? ' · 강수 ' + wx.pop + '%' : '') +
        '<em>' + (wx.live ? '예보' : '9월 평년') + '</em>';
      head.appendChild(b);
    }
    if (S.initWxVisual) S.initWxVisual(art, wx.theme);
  }

  getForecast().then(live => {
    S.WX_FALLBACK.forEach((fb, i) => {
      const wx = (live && live[i]) ? live[i] : Object.assign({ live:false }, fb);
      renderDay(i, wx);
    });
  });
})();
