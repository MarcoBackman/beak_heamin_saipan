---
project: shared
status: draft
---

# 모바일 플로팅 지도 오버레이

## 배경 및 목표

모바일(≤1023px)에서 지도 패널은 페이지 최상단에 static 배치되는데, 지도 컨트롤(슬라이더 `change`, ◀▶ 버튼)을 조작하면 `goToDay(idx, true)` → `scrollIntoView`로 해당 day 섹션까지 강제 스크롤된다. 조작할 때마다 지도가 화면 밖으로 밀려나 지도 UI를 연속으로 쓸 수 없다는 사용자 피드백이 접수됐다.

**목표**
1. 모바일에서 지도 조작이 페이지 스크롤을 유발하지 않는다.
2. 일정을 읽는 도중 언제든 지도에 접근하고, 읽던 위치를 잃지 않고 돌아올 수 있다.
3. 데스크톱(≥1024px) 동작·렌더는 변경하지 않는다.

**성공 기준**: 390px에서 슬라이더·◀▶ 조작 시 배경 페이지 스크롤 0px. 일정 중간에서 FAB 탭 → 지도 조작 → ✕ 닫기 후 스크롤 위치 그대로. "이 날 일정 보기"로 선택한 날짜 섹션 정확 도달. 데스크톱 시각·동작 회귀 0.

## 선택한 접근과 이유

**플로팅 지도 오버레이** (승인됨) — 지도는 현행대로 페이지 상단에 두고, 모바일에서 화면 하단에 '🗺️ 지도' FAB를 추가한다. 탭하면 기존 지도 패널이 풀스크린 오버레이(시트)로 떠서 읽던 위치를 잃지 않고 지도를 조작할 수 있다. 자동 스크롤 문제를 원천 제거하면서 지도·일정 양쪽 접근성을 모두 확보한다.

기존 wiki 결정과의 정합성: Day 칩 바(일자 내비게이션)는 그대로 유지·재사용하며, 기각됐던 "하단 탭바(앱 스타일)"와 달리 구조 이중화가 없다(같은 지도 DOM을 CSS로 승격).

## 아키텍처

- **신규 `js/map-overlay.js`** — day-nav.js와 같은 독립 IIFE + JS 주입 패턴. FAB(🗺️ 지도), 오버레이 헤더 ✕ 닫기, 하단 "이 날 일정 보기" 버튼을 JS로 주입한다. JS 로드 실패 시 버튼 자체가 렌더되지 않아 현행 동작으로 자연 강등된다.
- **오버레이 = 같은 지도 패널의 CSS 승격** — `body.map-open` 토글 시 `aside.map-side`를 `position:fixed; inset:0; z-index:1500` 풀스크린 시트로 승격. DOM 이동·Leaflet 재초기화 없음(같은 인스턴스 재사용). z-index는 topnav(1100) < 오버레이(1500) < lightbox(2000) 사이에 배치.
- **map.js 최소 수정 3곳**:
  1. `S.invalidateMap()` 노출 — 오버레이 열릴 때 `map.invalidateSize()` + 현재 day bounds 재fit
  2. 모바일에서 슬라이더 `change`/◀▶의 자동 스크롤 억제 — `goToDay(idx, !matchMedia('(max-width:1023px)').matches)`
  3. `showDay`가 마지막 bounds를 보관해 재fit에 사용
- **spots.js 수정 1곳** — "지도에서 보기"가 모바일이면 `mapSide.scrollIntoView` 대신 `S.openMapOverlay()` 호출(데스크톱 현행 유지).
- **CSS** — 오버레이·FAB 스타일은 `responsive.css`의 ≤1023px 블록에만 추가. 데스크톱 무변경. `@media print` 숨김 목록에 FAB 추가. 변경 파일 `?v=` 버전 증가(기존 캐시 규칙).
- **FAB 표시 조건** — 인라인 지도(`#mapSide`)가 뷰포트에 보일 땐 FAB 숨김(IntersectionObserver). 지도가 보이는데 지도 버튼이 또 뜨는 중복 노출 방지.
- **배경 스크롤 잠금** — 오버레이 열림 동안 `body{overflow:hidden}`.

## 데이터 흐름

```
FAB 탭 → body.map-open + 배경 스크롤 잠금 → S.invalidateMap()
오버레이 안 슬라이더/◀▶ → 기존 showDay (페이지 스크롤 없음)
✕              → 닫기 — 읽던 위치 그대로
이 날 일정 보기 → 닫기 + 해당 day 섹션 scrollIntoView (기존 scrollLock 재사용)
스팟 "지도에서 보기"(모바일) → S.openMapOverlay() + flySpot
```

## 인터페이스 (모듈 경계)

- `S.invalidateMap()` — map.js 제공 → map-overlay.js 소비
- `S.openMapOverlay()` — map-overlay.js 제공 → spots.js 소비(모바일 분기)
- 현재 day 추적 — 기존 `S.onDayChange(cb)` 구독 재사용 ("이 날 일정 보기" 대상 결정)
- 기존 `S.goToDay(idx, scroll)` 시그니처 불변 — 호출부에서 scroll 인자만 조건화

## 에러 처리

- map-overlay.js는 `if (!window.SAIPAN) return` 가드(기존 패턴) — data.js 실패 시 FAB 미주입, 현행과 동일
- Leaflet CDN 실패 → 오버레이에도 기존 map-fallback 메시지가 그대로 표시됨
- map-overlay.js만 로드 실패 → FAB 없음, spots.js는 `S.openMapOverlay` 부재 시 기존 scrollIntoView로 폴백

## 테스트 전략

테스트 프레임워크가 없는 정적 페이지 — 브라우저 실동작 검증(기존 컨벤션):

1. **390px 시나리오** — FAB 표시/숨김(인라인 지도 가시성 연동), 오버레이 열기 시 타일 정상 렌더(invalidateSize), 슬라이더·◀▶ 조작 시 배경 페이지 스크롤 0px, ✕ 후 읽던 위치 유지, "이 날 일정 보기" 정확 이동, 스팟 "지도에서 보기" → 오버레이+스팟 팝업, 라이트박스와 z-index 충돌 없음, 오버레이 열림 중 배경 스크롤 잠금
2. **1280px 회귀** — FAB 미표시, 슬라이더·◀▶ 자동 스크롤 현행 유지, 렌더 동일
3. **환경 스모크** — `file://` 더블클릭 전 기능, 인쇄 미리보기에 FAB·오버레이 없음
4. **배포 검증** — Pages 배포 후 실URL에서 js/css 404 없음, 모바일 실기기(iOS Safari) 확인

## 리스크

- 🟡 `invalidateSize` 타이밍 — 표시 직후 호출 시 회색 타일 가능 → rAF 이후 호출 + bounds 재fit으로 완화
- 🟡 iOS Safari 주소창 수축/확장 — `100vh` 대신 `position:fixed; inset:0`으로 회피, 실기기 확인 항목 포함
- 🟢 z-index 충돌 — 1500으로 기존 스택(1090/1100/2000) 사이 배치
- 🟢 데스크톱 회귀 — 모든 변경이 matchMedia/미디어쿼리로 게이트

## 기각된 접근

- **자동 스크롤만 제거(최소 수정)**: 문제는 없애지만 지도·일정 동시 접근 목표 미충족 → 기각
- **상단 고정(sticky) 미니 지도**: 지도+일정 동시 열람은 되지만 뷰포트 세로 ~35%를 상시 점유, 일정 외 섹션(항공편·체크리스트 등)에서도 고정되는 부작용 → 기각
- **별도 지도 인스턴스(오버레이 전용)**: Leaflet 이중 초기화·상태 동기화 비용 → 기각 (같은 DOM CSS 승격 채택)

## 구현 계획

**목표:** 모바일에서 지도 컨트롤 조작이 페이지를 스크롤하지 않게 하고, 화면 하단 FAB로 여닫는 풀스크린 지도 오버레이를 추가한다.

**아키텍처:** 기존 `aside.map-side`를 `body.map-open` 클래스로 fixed 풀스크린 승격(같은 Leaflet 인스턴스 재사용). 신규 `js/map-overlay.js`가 FAB·✕·"이 날 일정 보기" 버튼을 주입하고, map.js는 `S.invalidateMap()` 노출 + 모바일 스크롤 억제만 수정한다.

**기술 스택:** Vanilla JS(IIFE, `<script defer>`), CSS 미디어쿼리, Leaflet 1.9.4 CDN.

### 전역 제약 (Global Constraints)

- 빌드 도구·npm 의존성 도입 금지 — CDN과 정적 파일만
- ES 모듈(`type="module"`) 금지 — `file://` 더블클릭 미리보기 유지, `<script defer>` 클래식만
- 데스크톱(≥1024px) 시각·동작 회귀 금지
- 수정 파일은 index.html의 `?v=` 버전 증가(v=1 → v=2), 신규 파일은 `?v=1`
- 커밋 메시지는 기존 컨벤션(짧은 영어 명령형, 프리픽스 없음), commit 스킬로 커밋

---

## 태스크

### Task 1: map-scroll-guard — 모바일 자동 스크롤 억제 + invalidateMap API

**파일:**
- 수정: `js/map.js`
- 수정: `index.html:534` (map.js `?v=2`)

**인터페이스:**
- 생산: `S.invalidateMap()` — 오버레이(Task 2)가 열릴 때 호출. 인자 없음, 반환 없음. `map.invalidateSize()` + 현재 day bounds 재fit

- [ ] **Step 1: map.js에 모바일 매처·bounds 보관·API 추가**

`const routeLayer = L.layerGroup().addTo(map);` 아래에:

```js
const MOBILE_MQ = window.matchMedia('(max-width:1023px)');
```

`let current = -1;` 아래에:

```js
let lastBounds = null;
```

`showDay()` 안 `const bounds = L.latLngBounds(day.stops.map(s => s.ll));` 다음 줄에:

```js
lastBounds = bounds;
```

`S.goToDay = goToDay;` 아래에:

```js
S.invalidateMap = () => {
  map.invalidateSize();
  if (lastBounds) map.flyToBounds(lastBounds, { padding:[52,52], duration:0, maxZoom:13 });
};
```

- [ ] **Step 2: 지도 컨트롤의 scroll 인자 조건화** — 슬라이더 `change`·◀▶ 3곳의 `true`를 `!MOBILE_MQ.matches`로 교체:

```js
slider.addEventListener('change', e => goToDay(+e.target.value, !MOBILE_MQ.matches));
document.getElementById('prevDay').addEventListener('click', () => goToDay(current-1 < 0 ? 0 : current-1, !MOBILE_MQ.matches));
document.getElementById('nextDay').addEventListener('click', () => goToDay(current+1 > 7 ? 7 : current+1, !MOBILE_MQ.matches));
```

주: `slider.addEventListener('input', ...)`(showDay만 호출)과 Day 칩·한눈에 보기 클릭 경로는 변경하지 않는다 — 내비게이션 의도이므로 스크롤 유지.

- [ ] **Step 3: index.html 캐시 버전** — `./js/map.js?v=1` → `?v=2`

- [ ] **Step 4: 검증**
실행: 로컬 서버 390px — 슬라이더 드래그 후 놓기·◀▶ 탭
기대: 지도 day 전환만 되고 페이지 스크롤 0px. Day 칩·한눈에 보기 클릭은 여전히 해당 섹션으로 스크롤. 1280px — 슬라이더·◀▶에서 현행대로 스크롤 동작, 콘솔 에러 0

- [ ] **Step 5: 커밋** — 예: `Keep map controls from scrolling page on mobile`

### Task 2: map-overlay-ui — FAB + 풀스크린 오버레이

**파일:**
- 생성: `js/map-overlay.js`
- 수정: `css/responsive.css` (기본 숨김 규칙 + ≤1023px 블록 + print)
- 수정: `index.html` (day-nav.js 다음 줄 script 태그, responsive.css `?v=2`)

**인터페이스:**
- 소비: `S.onDayChange(cb)`, `S.goToDay(idx, scroll)`, `S.invalidateMap()` (Task 1)
- 생산: `S.openMapOverlay()` — Task 3(spots.js)이 모바일 분기에서 호출. 인자 없음

- [ ] **Step 1: js/map-overlay.js 생성**

```js
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
```

- [ ] **Step 2: css/responsive.css 수정**

파일 최상단(첫 미디어쿼리 앞)에 기본 숨김:

```css
  /* ── 지도 오버레이 요소 — 모바일에서만 표시 ── */
  .map-fab,.map-overlay-close,.map-overlay-goto{display:none}
```

`@media (max-width:1023px)` 블록 끝에 추가:

```css
    .map-fab{
      position:fixed;right:16px;bottom:18px;z-index:1150;
      display:flex;align-items:center;gap:6px;
      padding:11px 16px;border-radius:9999px;
      background:var(--charcoal);color:var(--off-white);
      border:0;font-family:inherit;font-size:14px;font-weight:600;
      box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer;
    }
    .map-fab.hidden{display:none}
    body.map-open{overflow:hidden}
    body.map-open aside.map-side{
      position:fixed;inset:0;z-index:1500;
      margin:0;padding:12px;background:var(--cream);
      order:0;height:auto;
    }
    body.map-open .map-panel{height:100%}
    body.map-open #map{height:auto;flex:1}
    body.map-open .map-head{position:relative;padding-right:56px}
    body.map-open .map-overlay-close{
      display:flex;align-items:center;justify-content:center;
      position:absolute;right:12px;top:12px;
      width:34px;height:34px;border-radius:9999px;
      background:transparent;color:var(--charcoal);
      border:1px solid var(--border-strong);
      font-size:15px;cursor:pointer;font-family:inherit;
    }
    body.map-open .map-overlay-goto{
      display:block;margin:0 14px 14px;padding:12px;
      background:var(--charcoal);color:var(--off-white);
      border:0;border-radius:10px;
      font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;
    }
    body.map-open .map-fab{display:none}
```

`@media print` 첫 규칙의 숨김 목록에 `.map-fab` 추가:

```css
    nav.topnav,.day-chips,.hint,#printBtn,aside.map-side,.bgm-btn,.lightbox,.map-fab{display:none}
```

- [ ] **Step 3: index.html 수정** — `day-nav.js` 태그 다음 줄에 추가, responsive.css `?v=2`:

```html
<script defer src="./js/map-overlay.js?v=1"></script>
```

- [ ] **Step 4: 검증**
실행: 로컬 서버 390px — 최상단(지도 보임)에서 FAB 없음 → 일정까지 스크롤 → FAB 표시 → 탭
기대: 오버레이 풀스크린, 타일 회색 없이 정상(invalidateMap), 배경 스크롤 잠김, 슬라이더·◀▶ 조작해도 배경 위치 불변, ✕ 닫기 후 읽던 위치 그대로, "이 날 일정 보기"로 해당 day 도달. 라이트박스(z 2000)가 오버레이 위에 뜸. 1280px — FAB·✕·하단 버튼 모두 안 보임, 렌더 현행 동일. 콘솔 에러 0

- [ ] **Step 5: 커밋** — 예: `Add floating map overlay for mobile`

### Task 3: spots-overlay-link — 스팟 가이드 모바일 연동 + 통합 검증

**파일:**
- 수정: `js/spots.js:24-26`
- 수정: `index.html:531` (spots.js `?v=2`)

**인터페이스:**
- 소비: `S.openMapOverlay()` (Task 2). 부재 시 기존 scrollIntoView 폴백

- [ ] **Step 1: spots.js 모바일 분기 교체** — 기존:

```js
      if (window.matchMedia('(max-width:1023px)').matches){
        document.getElementById('mapSide').scrollIntoView({ behavior:'smooth', block:'center' });
      }
```

교체:

```js
      if (window.matchMedia('(max-width:1023px)').matches){
        if (S.openMapOverlay) S.openMapOverlay();
        else document.getElementById('mapSide').scrollIntoView({ behavior:'smooth', block:'center' });
      }
```

- [ ] **Step 2: index.html spots.js `?v=2`**

- [ ] **Step 3: 통합 검증**
실행: 390px — 스팟 가이드에서 "지도에서 보기" 탭
기대: 오버레이가 열리며 해당 스팟으로 flyTo + 팝업. ✕ 후 스팟 가이드 위치 유지. 1280px — 현행(지도로 스크롤 + flyTo) 유지. `file://` 더블클릭 스모크 — 전 기능. 인쇄 미리보기 — FAB·오버레이 없음

- [ ] **Step 4: 커밋** — 예: `Open map overlay from spot guide on mobile`

- [ ] **Step 5: 배포 검증**
실행: `git push` → GitHub Actions 2종("Deploy GitHub Pages", "pages build and deployment") 성공 확인 → 배포 URL을 모바일 실기기(iOS Safari 포함)로 열기
기대: js/css 404 없음, FAB·오버레이 실기기 정상(주소창 수축/확장 시 오버레이 안정), 데스크톱 회귀 없음
