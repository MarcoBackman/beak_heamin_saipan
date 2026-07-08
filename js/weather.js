/* ═══════════ 날씨 — 예보/평년 배지 + 배경 연출 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S || !S.TRIP || !S.WX_FALLBACK) return;
  const ICON = { sun:'☀️', cloud:'☁️', rain:'🌧️', thunder:'⛈️' };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FACTOR = 0.75;                        /* 시안 확정 전역 강도 */
  const engines = new Map();                  /* article → {start,stop} */

  /* 빗방울 파티클 엔진 — 시안 v3 튜닝값 환산 상수 */
  function rainEngine(art, layer, cfg){
    const cv = document.createElement('canvas');
    layer.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, drops = [], raf = null, last = 0;
    const windTan = Math.tan(cfg.wind * Math.PI / 180);
    let flashP = 0, flashGain = 0, tSince = 0, bolt = null;
    let nextFlash = cfg.flash ? 1 + Math.random()*2 : Infinity;

    function resize(){
      const r = art.getBoundingClientRect();
      W = r.width; H = r.height;
      const d = window.devicePixelRatio || 1;
      cv.width = W*d; cv.height = H*d;
      cv.style.width = W+'px'; cv.style.height = H+'px';
      ctx.setTransform(d,0,0,d,0,0);
      drops = [];
      const n = Math.round(W*H/cfg.area);
      for (let i=0;i<n;i++) drops.push(spawn(true));
    }
    function spawn(anyY){
      const z = .3 + Math.random()*.7;
      return {
        x: Math.random()*(W+80)-40,
        y: anyY ? Math.random()*H : -40-Math.random()*60,
        spd: cfg.spd*(.5+.5*z)*(.85+Math.random()*.3),
        len: cfg.len*(.45+.55*z)*(.75+Math.random()*.5),
        w: .6 + z*1.2,
        a: (.10+.38*z)*(.75+Math.random()*.5),
      };
    }
    function makeBolt(){
      const pts = [[Math.random()*W*.7+W*.15, -4]];
      while (pts[pts.length-1][1] < H*.72){
        const p = pts[pts.length-1];
        pts.push([p[0]+(Math.random()-.5)*34, p[1]+14+Math.random()*26]);
      }
      const bi = 1+Math.floor(Math.random()*(pts.length-2));
      const branch = [pts[bi].slice()];
      for (let k=0;k<3;k++){
        const q = branch[branch.length-1];
        branch.push([q[0]+18+Math.random()*16, q[1]+10+Math.random()*18]);
      }
      return { main:pts, branch:branch };
    }
    function drawBolt(b, alpha){
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,246,'+(alpha*.9)+')';
      ctx.shadowColor = 'rgba(255,250,220,'+alpha+')';
      ctx.shadowBlur = 9; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      [b.main, b.branch].forEach(pts => {
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      });
      ctx.restore();
    }
    function frame(ts){
      const dt = Math.min(.05, (ts-last)/1000 || .016); last = ts;
      ctx.clearRect(0,0,W,H);
      ctx.lineCap = 'round';
      for (let i=0;i<drops.length;i++){
        let dr = drops[i];
        dr.y += dr.spd*dt; dr.x += dr.spd*windTan*dt;
        if (dr.y-dr.len > H) drops[i] = dr = spawn(false);
        ctx.strokeStyle = 'rgba('+cfg.rgb+','+(dr.a*FACTOR).toFixed(3)+')';
        ctx.lineWidth = dr.w;
        ctx.beginPath();
        ctx.moveTo(dr.x, dr.y);
        ctx.lineTo(dr.x - windTan*dr.len, dr.y - dr.len);
        ctx.stroke();
      }
      if (cfg.flash){
        tSince += dt;
        if (tSince >= nextFlash){
          flashP = 1; flashGain = .8+Math.random()*.8;      /* 밝기 ×1.62 환산 */
          tSince = 0; nextFlash = 1.8+Math.random()*3.3;     /* 간격 ÷1.97 환산 */
          bolt = Math.random() < .5 ? makeBolt() : null;
        }
        if (flashP > 0){
          const env = flashP * (.55 + .45*Math.sin(flashP*32)) * flashGain;
          if (env > 0){
            ctx.fillStyle = 'rgba(252,252,240,'+Math.min(.9, env*.5*FACTOR).toFixed(3)+')';
            ctx.fillRect(0,0,W,H);
            if (bolt && flashP > .55) drawBolt(bolt, Math.min(1, env*FACTOR));
          }
          flashP -= dt*2.4;
          if (flashP <= 0){ flashP = 0; bolt = null; }
        }
      }
      raf = requestAnimationFrame(frame);
    }
    resize();
    /* 접힘 펼침 등 카드 자체 높이 변화 추적 (window resize만으론 부족) */
    if (window.ResizeObserver) new ResizeObserver(resize).observe(art);
    else window.addEventListener('resize', resize);
    return {
      start(){ if (!raf){ last = 0; raf = requestAnimationFrame(frame); } },
      stop(){ if (raf){ cancelAnimationFrame(raf); raf = null; ctx.clearRect(0,0,W,H); } },
    };
  }

  /* 시안 v3 튜닝 환산: rain 밀도 5200/1.24≈4200 · 속도 430×1.22≈525 / thunder 3400/1.24≈2750 · 580×1.22≈708 */
  const ENGINE_CFG = {
    rain:    { area:4200, spd:525, len:22, wind:7,  rgb:'90,120,150', flash:false },
    thunder: { area:2750, spd:708, len:26, wind:11, rgb:'70,92,116',  flash:true  },
  };

  /* 가시 카드만 재생 */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    en.target.classList.toggle('wx-run', en.isIntersecting);
    const eng = engines.get(en.target);
    if (eng){ (en.isIntersecting && !reduced) ? eng.start() : eng.stop(); }
  }), { rootMargin:'80px 0px' });

  S.initWxVisual = function(art, theme){
    const layer = art.querySelector('.wx-layer');
    if (!layer) return;
    if (theme === 'sun'){
      const rays = document.createElement('div');
      rays.className = 'wx-rays';
      layer.appendChild(rays);
    } else if (theme === 'cloud'){
      for (let i=1;i<=3;i++){
        const c = document.createElement('div');
        c.className = 'wx-cloud c'+i;
        layer.appendChild(c);
      }
    } else if (ENGINE_CFG[theme] && !reduced){
      engines.set(art, rainEngine(art, layer, ENGINE_CFG[theme]));
    }
    io.observe(art);
  };

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
    if (wx.theme === 'rain' || wx.theme === 'thunder'){
      const rp = art.querySelector('.rain-plan');
      if (rp){
        rp.open = true;
        if (head){
          const c = document.createElement('span');
          c.className = 'wx-rain-chip';
          c.textContent = '☔ 우천 플랜 확인';
          head.appendChild(c);
        }
      }
    }
    if (S.initWxVisual) S.initWxVisual(art, wx.theme);
  }

  getForecast().then(live => {
    S.WX_FALLBACK.forEach((fb, i) => {
      const wx = (live && live[i]) ? live[i] : Object.assign({ live:false }, fb);
      renderDay(i, wx);
    });
  });

  /* 인쇄 시 우천 플랜 강제 펼침 → 인쇄 후 원상 복구 */
  let printOpened = [];
  window.addEventListener('beforeprint', () => {
    printOpened = Array.prototype.slice.call(document.querySelectorAll('.rain-plan:not([open])'));
    printOpened.forEach(d => { d.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printOpened.forEach(d => { d.open = false; });
    printOpened = [];
  });
})();
