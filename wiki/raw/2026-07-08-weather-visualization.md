---
project: shared
status: draft
---

# 날씨 예보 시각화 + day 섹션 배경 애니메이션

## 배경 및 목표

여행(2026-09-10 ~ 09-17) 일정 페이지에 날씨 정보를 시각화하고, 각 day 섹션 배경에 해당 날씨의 분위기를 표현하는 애니메이션을 입힌다.

**목표**
1. day별 날씨 정보(아이콘·최고/최저기온·강수확률)를 각 day 섹션 헤더에 배지로 표시한다.
2. day 섹션 배경에 날씨 테마별 배경 애니메이션을 입힌다 — 시안 튜닝으로 확정한 강도·파라미터(아래 "시안 확정 이력") 적용.
3. 실제 예보가 존재하면(출발 ~16일 전부터) 예보를, 그 전/오프라인이면 9월 사이판 평년 기후 연출로 폴백한다(하이브리드 — 사용자 확정).

**성공 기준**: 온라인+예보 범위 내 → "예보" 라벨과 실데이터 표시. 오프라인/범위 밖(현재 7월) → "9월 평년" 라벨로 동일한 시각 연출. reduced-motion에서 모든 애니메이션·캔버스 정지(정적 틴트만). 기존 기능·데스크톱 렌더 회귀 0.

## 선택한 접근과 이유

**하이브리드 데이터 + 캔버스 파티클/SVG 연출** (시안 3회 반복 후 승인됨)

- 데이터: Open-Meteo 무료 API(키 불필요, CORS 전면 허용 — `file://`에서도 동작). 예보 범위 밖·실패 시 `data.js`의 평년 프리셋으로 폴백.
- 연출: 비·뇌우는 **손으로 짠 투명 캔버스 파티클 엔진**(라이브러리 없음, ~80줄) — 방울별 깊이·길이·속도·굵기·투명도 랜덤, 바람 각도, 랜덤 타이밍 번개(섬광 플리커 + 번개 줄기). 구름은 **블러 SVG 구름 이미지(data-URI, 배경 투명) 3장 시차 드리프트**, 햇살은 **다단 그라데이션 광원 + 부드러운 회전 광선**(repeating-conic + 방사 마스크). CSS 그라디언트 타일 방식은 v1 시안에서 "반복이 눈에 보여 딱딱하다"는 피드백으로 기각.

## 아키텍처

- **신규 `js/weather.js`** — 독립 IIFE, `if (!window.SAIPAN) return` 가드. 역할: ① API 요청→테마 매핑, ② `article.day`에 `data-wx` 속성 + `.wx-layer` 컨테이너 + day-head 배지 주입, ③ 비/뇌우 카드에 캔버스 파티클 엔진 구동, ④ IntersectionObserver로 가시 카드만 재생.
- **`js/data.js`에 추가** (데이터는 data.js 소유 원칙):
  - `S.TRIP = { start:'2026-09-10', days:8, lat:15.19, lon:145.75, tz:'Pacific/Saipan' }`
  - `S.WX_FALLBACK` — day별 평년 프리셋 `[{ theme, tmax, tmin, pop }, ...]` (9월 사이판: ~30/26°C, 소나기 빈번 — sun/cloud/rain 혼합 구성)
- **API**: `https://api.open-meteo.com/v1/forecast?latitude=&longitude=&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Pacific/Saipan&start_date=2026-09-10&end_date=2026-09-17`. AbortController 5초 타임아웃.
- **WMO 코드 → 4테마 매핑**: `sun`(0–1) / `cloud`(2–3, 45, 48) / `rain`(51–67, 80–82) / `thunder`(95–99). 매핑 밖 코드는 `cloud`로 안전 폴백.
- **DOM 구조**: `.day`에 `position:relative; overflow:hidden` 추가, 콘텐츠는 `z-index:1`. `::before` = 테마 정적/저속 틴트 레이어. `.wx-layer`(absolute, inset:0, pointer-events:none, z-index:0) 안에 테마별 요소(구름 div·광선 div·캔버스) 주입.
- **신규 `css/weather.css`** — 테마 스타일 격리. index.html에 `<link ?v=1>` 추가. 배포 워크플로우는 css 폴더째 복사라 pages.yml 변경 없음.
- **재생 게이트** — weather.js의 IntersectionObserver가 가시 `.day`에만 `.wx-run` 부여: CSS 애니메이션은 `.wx-run`에서만 실행, 캔버스 엔진은 rAF start/stop. reduced-motion이면 엔진 미기동 + CSS 애니 제거(정적 틴트만). `@media print`에서 `.wx-layer`·`::before` 숨김(배지는 유지).
- **캐시** — weather.css/weather.js 신규 `?v=1`, 수정되는 data.js는 `?v=` 증가.

### 테마별 프로덕션 파라미터 (시안 튜닝 확정값 환산)

전역 강도 계수 **0.75** (시안 "보통")를 캔버스 알파와 CSS `filter:opacity`에 적용.

| 테마 | 구현 | 확정 파라미터 |
|---|---|---|
| sun | 광원 radial 3겹(16s breath) + 회전 광선(110s) | 광선 빔 알파 **.165**(=.11×1.5), 빔 폭 10°/주기 34°, 마스크 radial 42%/68%, 광원 알파 시안 기본(×1.04≈1) |
| cloud | 블러 SVG 구름 3장 드리프트 | 불투명 .62/.42/.30, 주기 58s/84s/116s (배율 1.0 확정) |
| rain | 캔버스 파티클 | 밀도 **1방울/4,200px²**(=5200/1.24), 기본 속도 **525px/s**(=430×1.22, 깊이 0.5~1.0×랜덤 0.85~1.15 가변), 길이 22, 바람 7°, rgb(90,120,150) |
| thunder | 캔버스 파티클 + 섬광/번개 | 밀도 **1/2,750px²**, 속도 **708px/s**, 길이 26, 바람 11°, rgb(70,92,116) · 섬광 간격 **1.8~5.1s**(=(3.5~10)/1.97), 게인 **0.8~1.6**(=(.5~1)×1.62, 화면 알파 상한 .9), 번개 줄기 50% 확률(가지 1개, shadowBlur 글로우) |

캔버스 공통: devicePixelRatio 대응, dt 상한 50ms, 리사이즈 시 방울 재생성. 카드당 방울 수 = 면적/밀도(모바일 ~390×400px 카드 기준 rain ~37개, thunder ~57개).

## 데이터 흐름

```
weather.js: S.TRIP → Open-Meteo daily 요청 (5s 타임아웃)
  성공          → 일자별 { code→theme, tmax, tmin, pop } → data-wx + 배지("예보")
  실패/범위밖/오프라인/부분 null → 해당 day는 S.WX_FALLBACK → 동일 렌더("9월 평년")
렌더: data-wx별 .wx-layer 구성 (sun→rays, cloud→cloud×3, rain/thunder→canvas)
IntersectionObserver: 뷰포트 진입/이탈 → .wx-run 토글 + 캔버스 rAF start/stop
```

## 인터페이스 (모듈 경계)

- `S.TRIP`, `S.WX_FALLBACK` — data.js 소유·생산, weather.js 소비
- `data-wx="sun|cloud|rain|thunder"` + `.wx-run` DOM 상태 — weather.js 생산, weather.css 소비
- 배지 DOM(`.wx-badge`) — weather.js가 `.day-head`에 append (기존 마크업 수정 없음)
- 캔버스 엔진은 weather.js 내부 구현 — 외부 노출 API 없음(말단 소비자)

## 에러 처리

- fetch 실패·타임아웃·HTTP 오류·범위 밖 응답 → 전체 폴백(평년)
- 응답 중 일부 날짜만 null → 해당 day만 폴백, 라벨도 day별로 구분
- weather.js 로드 실패 → 배지·애니 없음, 페이지 나머지 무영향(독립 IIFE)
- data.js 로드 실패 → 가드로 조용히 종료(기존 패턴)

## 테스트 전략

브라우저 실동작 검증(기존 컨벤션):

1. **폴백 경로(현재 기본)** — 지금은 예보 범위 밖이므로 로드 시 "9월 평년" 배지 + 테마 연출이 떠야 함. DevTools Network offline로도 동일 확인
2. **예보 경로** — DevTools에서 요청 start/end를 오늘~+7일로 바꾼 임시 수정(또는 fetch 목킹)으로 "예보" 라벨·실데이터 렌더 확인
3. **연출** — 390px/1280px에서 4테마 재생(비 랜덤성·번개 랜덤 타이밍·구름 시차·광선 부드러움), 스크롤로 화면 밖 이탈 시 캔버스 rAF 정지·`.wx-run` 제거 확인, reduced-motion 에뮬레이션에서 전부 정지, 텍스트 가독성 육안 확인
4. **환경** — `file://` 스모크(온라인이면 예보 fetch도 동작), 인쇄 미리보기에 연출 레이어 없음, 콘솔 에러 0
5. **배포** — Pages 실URL에서 weather.css/js 404 없음

## 리스크

- 🟡 캔버스 rAF 상시 구동 부하 — IO 게이트로 가시 카드만 구동(동시 최대 1~2개), 방울 수십 개 수준의 그리기라 경미. 실기기 확인 항목 포함
- 🟡 예보 범위 밖 요청에 대한 Open-Meteo 응답 형태(HTTP 에러 vs null 배열) — 어느 쪽이든 폴백으로 수렴하도록 구현, 구현 시 실응답 확인
- 🟢 오프라인/CORS — 폴백이 기본 경로라 영향 없음
- 🟢 기존 회귀 — 순수 추가 변경(기존 CSS 규칙·마크업 수정 없음, .day에 position/overflow 추가만 — 내부 absolute 요소 없음 확인됨)

## 기각된 접근

- **CSS 그라디언트/SVG 타일 애니메이션**(v1 시안) — 타일 반복·고정 주기가 눈에 보여 "딱딱하다"는 사용자 피드백 → 기각, 캔버스 파티클로 대체
- **canvas/파티클 외부 라이브러리**(particles.js 등) — 빌드 없음 원칙 위배, 손코딩 ~80줄로 충분 → 기각
- **실시간 API 전용** — 현재(7월)는 아무것도 표시 못 함 → 기각
- **정적 연출 전용** — "예보" 요구 미충족 → 기각
- **Rota 별도 좌표 요청** — 사이판과 기후 사실상 동일, 시각 연출 목적엔 과함(YAGNI) → 후속 여지만 남기고 기각
- **시간별(hourly) 예보** — 일 단위 섹션 구조에 과함 → 기각

## 시안 확정 이력

인터랙티브 HTML 데모(스크래치패드, throwaway — 소스 미커밋) 3회 반복:

1. **v1** CSS 그라디언트/SVG 타일 — "애니메이션이 딱딱하다, 빗방울을 실제처럼" 피드백으로 기각
2. **v2** 캔버스 파티클 + SVG 구름 + 회전 광선 + 랜덤 번개 — 방향 승인, "광선이 너무 선명" 피드백
3. **v3** 광선 그라데이션화 + 미세조정 슬라이더 — 사용자 튜닝값으로 확정 (2026-07-08):
   `{"intensity":"mid","tune":{"sunRay":1.5,"sunGlow":1.04,"cloudOp":1,"cloudSpd":1,"rainDen":1.24,"rainSpd":1.22,"boltFreq":1.97,"boltBright":1.62}}`
   → 위 "테마별 프로덕션 파라미터" 표에 환산 반영 (배율은 굽고 런타임 조절 기능은 두지 않음)

## 구현 계획

**목표:** day별 날씨 배지(예보/평년 하이브리드)와 테마별 배경 연출(캔버스 파티클·SVG 구름·회전 광선)을 추가한다.

**아키텍처:** `data.js`에 여행 상수·평년 프리셋을 추가하고, 신규 `weather.js`가 Open-Meteo 예보를 취득(실패 시 폴백)해 배지와 `data-wx` 속성을 주입한 뒤 테마별 연출 레이어를 구성한다. 스타일·애니메이션은 신규 `weather.css`로 격리하고, IntersectionObserver로 가시 카드만 재생한다.

**기술 스택:** Vanilla JS(IIFE, `<script defer>`), Canvas 2D(라이브러리 없음), CSS 애니메이션, Open-Meteo API(무키).

### 전역 제약 (Global Constraints)

- 빌드 도구·npm 의존성 도입 금지 — CDN과 정적 파일만
- ES 모듈(`type="module"`) 금지 — `<script defer>` 클래식만
- 데스크톱·기존 기능 회귀 금지 (순수 추가 변경)
- 수정 파일은 index.html `?v=` 증가, 신규 파일은 `?v=1`
- 전역 강도 계수 0.75 — 캔버스 알파·CSS filter:opacity에 공통 적용 (시안 확정값)
- 커밋 메시지는 기존 컨벤션(짧은 영어 명령형, 프리픽스 없음), commit 스킬로 커밋

---

## 태스크

### Task 1: wx-data — 여행 상수·평년 프리셋

**파일:**
- 수정: `js/data.js:240` (return 문에 TRIP·WX_FALLBACK 추가)
- 수정: `index.html:525` (data.js `?v=2`)

**인터페이스:**
- 생산: `S.TRIP = { start, end, lat, lon, tz }` (string×2, number×2, string), `S.WX_FALLBACK: Array<{theme:'sun'|'cloud'|'rain'|'thunder', tmax:number, tmin:number, pop:number}>` 길이 8 — Task 2가 소비

- [ ] **Step 1: data.js에 상수 추가** — `return { SPOTS, REFS, SHORTS, DAYS };` 직전에:

```js
  /* 날씨 — 여행 좌표·기간 + 9월 사이판 평년 프리셋 (예보 폴백용) */
  const TRIP = { start:'2026-09-10', end:'2026-09-17', lat:15.19, lon:145.75, tz:'Pacific/Saipan' };
  const WX_FALLBACK = [
    { theme:'sun',     tmax:31, tmin:26, pop:20 },  /* D1 9/10 */
    { theme:'cloud',   tmax:30, tmin:26, pop:40 },  /* D2 9/11 */
    { theme:'rain',    tmax:30, tmin:25, pop:60 },  /* D3 9/12 */
    { theme:'sun',     tmax:31, tmin:26, pop:30 },  /* D4 9/13 */
    { theme:'thunder', tmax:29, tmin:25, pop:70 },  /* D5 9/14 */
    { theme:'cloud',   tmax:30, tmin:26, pop:40 },  /* D6 9/15 */
    { theme:'rain',    tmax:30, tmin:25, pop:60 },  /* D7 9/16 */
    { theme:'sun',     tmax:31, tmin:26, pop:30 },  /* D8 9/17 */
  ];
```

return 문 교체:

```js
  return { SPOTS, REFS, SHORTS, DAYS, TRIP, WX_FALLBACK };
```

- [ ] **Step 2: index.html data.js `?v=2`**

- [ ] **Step 3: 검증**
실행: 로컬 서버 → DevTools 콘솔에서 `SAIPAN.TRIP`, `SAIPAN.WX_FALLBACK.length`
기대: 객체 반환, 8. 기존 기능(지도·스팟·쇼츠) 정상, 콘솔 에러 0

- [ ] **Step 4: 커밋** — 예: `Add trip constants and climate fallback data`

### Task 2: wx-badge — 예보 취득 + 날씨 배지 + data-wx

**파일:**
- 생성: `js/weather.js` (연출 제외 — 데이터·배지·속성만)
- 생성: `css/weather.css` (배지 스타일만 우선)
- 수정: `index.html` (`<link ./css/weather.css?v=1>` responsive.css 다음 줄, `<script defer ./js/weather.js?v=1>` map-overlay.js 다음 줄)

**인터페이스:**
- 소비: `S.TRIP`, `S.WX_FALLBACK` (Task 1)
- 생산: `article.day`의 `data-wx` 속성 + `.wx-layer` 빈 컨테이너 + `.wx-badge` — Task 3(연출)이 소비. `renderDay(i, wx)`는 내부 함수(외부 노출 없음)

- [ ] **Step 1: js/weather.js 생성**

```js
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
    if (S.initWxVisual) S.initWxVisual(art, wx.theme);   /* Task 3에서 정의 — 없으면 배지만 */
  }

  getForecast().then(live => {
    S.WX_FALLBACK.forEach((fb, i) => {
      const wx = (live && live[i]) ? live[i] : Object.assign({ live:false }, fb);
      renderDay(i, wx);
    });
  });
})();
```

- [ ] **Step 2: css/weather.css 생성 (배지)**

```css
  /* ── 날씨 배지 ─────────────────────── */
  .wx-badge{
    margin-left:auto;display:inline-flex;align-items:center;gap:6px;
    font-size:13px;padding:4px 11px;border:1px solid var(--border);
    border-radius:9999px;background:rgba(252,251,248,.72);
  }
  .wx-badge em{
    font-style:normal;font-size:11px;color:var(--muted);
    border-left:1px solid var(--border);padding-left:6px;
  }
```

- [ ] **Step 3: index.html에 link·script 태그 추가**

```html
<link rel="stylesheet" href="./css/weather.css?v=1">
```

```html
<script defer src="./js/weather.js?v=1"></script>
```

- [ ] **Step 4: 검증**
실행: 로컬 서버 1280px·390px
기대: 8개 day-head에 "9월 평년" 배지(현재는 예보 범위 밖 → 폴백 경로), `article.day`에 `data-wx` 속성, DevTools offline에서도 동일, 콘솔 에러 0. Network 탭에 open-meteo 요청 1건(실패해도 무해)

- [ ] **Step 5: 커밋** — 예: `Add weather badges with forecast fallback`

### Task 3: wx-visuals — 테마 배경 연출 (캔버스·구름·광선) + 가시성 게이트

**파일:**
- 수정: `js/weather.js` (S.initWxVisual + 캔버스 엔진 + IO 추가)
- 수정: `css/weather.css` (테마 스타일 append)
- 수정: `index.html` (weather.js/weather.css `?v=2`)

**인터페이스:**
- 소비: Task 2의 `.wx-layer`·`data-wx`
- 생산: `S.initWxVisual(art, theme)` — weather.js 내부에서만 사용(renderDay가 호출)

- [ ] **Step 1: weather.js에 연출 코드 추가** — IIFE 상단에 상수, renderDay 위에 엔진·초기화 함수 삽입:

```js
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
    window.addEventListener('resize', resize);
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

  /* 가시 카드만 재생 */
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    en.target.classList.toggle('wx-run', en.isIntersecting);
    const eng = engines.get(en.target);
    if (eng){ (en.isIntersecting && !reduced) ? eng.start() : eng.stop(); }
  }), { rootMargin:'80px 0px' });
```

주: `S.initWxVisual`은 `io` 선언보다 위에 있어도 호출 시점(fetch 이후)엔 초기화 완료 — `const io`는 TDZ 문제가 없도록 `S.initWxVisual =` 정의보다 **위**에 배치해도 되고, 파일 내 실행 순서(선언 → getForecast().then)만 지키면 된다.

- [ ] **Step 2: css/weather.css에 테마 스타일 append**

```css
  /* ── 연출 공통 ─────────────────────── */
  article.day[data-wx]{position:relative;overflow:hidden}
  article.day[data-wx] > *{position:relative;z-index:1}
  article.day[data-wx]::before{
    content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
    filter:opacity(.75);   /* 전역 강도 */
  }
  .wx-layer{
    position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;
    filter:opacity(.75);
  }
  .wx-layer canvas{position:absolute;inset:0}

  /* ── sun ── */
  article.day[data-wx=sun]::before{
    inset:-18%;
    background:
      radial-gradient(circle at 24% -8%, rgba(255,178,64,.34), rgba(255,196,96,.15) 32%, rgba(255,210,120,.05) 50%, transparent 66%),
      radial-gradient(circle at 82% 8%,  rgba(255,222,130,.26), rgba(255,228,150,.10) 30%, transparent 60%),
      radial-gradient(circle at 50% 45%, rgba(255,238,180,.14), transparent 68%),
      linear-gradient(180deg, rgba(255,210,110,.12), rgba(255,220,140,.04) 45%, transparent 72%);
  }
  article.day[data-wx=sun].wx-run::before{animation:wxSunBreath 16s ease-in-out infinite alternate}
  @keyframes wxSunBreath{
    from{transform:translate3d(-1.5%,0,0) scale(1);opacity:.75}
    to  {transform:translate3d(1.5%,2%,0) scale(1.09);opacity:1}
  }
  .wx-rays{
    position:absolute;width:170%;aspect-ratio:1/1;left:-45%;top:-120%;
    background:repeating-conic-gradient(from 0deg,
      transparent 0deg, rgba(255,206,110,.165) 10deg, transparent 20deg 34deg);
    -webkit-mask:radial-gradient(closest-side, #000 0%, rgba(0,0,0,.38) 42%, transparent 68%);
            mask:radial-gradient(closest-side, #000 0%, rgba(0,0,0,.38) 42%, transparent 68%);
  }
  article.day[data-wx=sun].wx-run .wx-rays{animation:wxRaysTurn 110s linear infinite}
  @keyframes wxRaysTurn{to{transform:rotate(360deg)}}

  /* ── cloud ── */
  article.day[data-wx=cloud]::before{
    background:linear-gradient(180deg, rgba(148,163,184,.14), rgba(148,163,184,.04) 60%, transparent);
  }
  .wx-cloud{
    position:absolute;background-repeat:no-repeat;background-size:contain;
    background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="280" viewBox="0 0 600 280"><defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="24"/></filter></defs><g filter="url(%23b)" fill="%23a4b1bf"><ellipse cx="215" cy="172" rx="150" ry="52"/><ellipse cx="325" cy="128" rx="115" ry="62"/><ellipse cx="435" cy="176" rx="125" ry="46"/><ellipse cx="130" cy="195" rx="80" ry="34"/></g></svg>');
  }
  .wx-cloud.c1{width:72%;height:62%;top:-14%;opacity:.62}
  .wx-cloud.c2{width:54%;height:48%;top:16%;opacity:.42}
  .wx-cloud.c3{width:40%;height:36%;top:44%;opacity:.30}
  article.day[data-wx=cloud].wx-run .wx-cloud.c1{animation:wxDrift 58s linear infinite;animation-delay:-12s}
  article.day[data-wx=cloud].wx-run .wx-cloud.c2{animation:wxDrift 84s linear infinite;animation-delay:-47s}
  article.day[data-wx=cloud].wx-run .wx-cloud.c3{animation:wxDrift 116s linear infinite;animation-delay:-80s}
  @keyframes wxDrift{
    from{transform:translateX(-160%)}
    to  {transform:translateX(320%)}
  }

  /* ── rain / thunder 틴트 (파티클은 캔버스) ── */
  article.day[data-wx=rain]::before{
    background:linear-gradient(180deg, rgba(100,125,150,.12), rgba(100,125,150,.18));
  }
  article.day[data-wx=thunder]::before{
    background:linear-gradient(180deg, rgba(66,80,100,.20), rgba(66,80,100,.26));
  }

  /* ── 접근성·인쇄 ── */
  @media (prefers-reduced-motion: reduce){
    article.day[data-wx].wx-run::before,
    article.day[data-wx].wx-run .wx-rays,
    article.day[data-wx].wx-run .wx-cloud{animation:none}
  }
  @media print{
    .wx-layer,article.day[data-wx]::before{display:none}
  }
```

- [ ] **Step 3: index.html weather.js/weather.css `?v=2`**

- [ ] **Step 4: 검증**
실행: 로컬 서버 390px·1280px
기대: sun 광원 숨쉬기+광선 회전, cloud 구름 3장 시차 드리프트, rain 랜덤 빗줄기, thunder 굵은 비+랜덤 섬광·번개 줄기. 스크롤로 화면 밖 카드의 `.wx-run` 제거·캔버스 rAF 정지(Performance 탭 or rAF 로그). reduced-motion 에뮬레이션 → 전부 정지·캔버스 미생성(새로고침 후). 일정 텍스트 가독성 유지. 인쇄 미리보기에 연출 없음. 콘솔 에러 0

- [ ] **Step 5: 커밋** — 예: `Add weather-themed background effects`

### Task 4: wx-deploy — 배포 검증

**파일:** 없음 (검증 전용)

- [ ] **Step 1: push 후 Pages 배포 성공 확인**
실행: `git push` → GitHub Actions "Deploy GitHub Pages" + "pages build and deployment" 성공 확인
기대: 둘 다 green (7/6 배포 실패 건은 재시도 시 해소 전제)

- [ ] **Step 2: 실서비스 확인**
실행: 배포 URL을 데스크톱·모바일(실기기 iOS Safari 포함)로 열기
기대: weather.css/js 404 없음, 배지·연출 정상, 지도 오버레이(별건 계획)와 z-index 충돌 없음, 성능 체감 문제 없음
