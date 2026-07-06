---
project: shared
status: draft
---

# 모바일 뷰 단순화 + index.html 모듈화

## 배경 및 목표

사이판·로타 허니문 정적 페이지(GitHub Pages 배포)에 대해 "모바일 뷰가 너무 복잡하다"는 사용자 피드백이 접수됐다. 동시에 index.html 단일 파일(약 2,128줄 / 131KB — CSS 854줄, HTML 507줄, JS 752줄)에 모든 코드가 몰려 있어 유지보수가 어렵다.

**목표**
1. 모바일(≤768px)에서 정보 밀도를 낮춰 "일정 중심"으로 읽히게 한다 — 부가 콘텐츠 접힘, 내비·히어로 정리.
2. 내비게이션에서 각 일자(Day 1~8)로 바로 이동할 수 있게 한다.
3. HTML/CSS/JS를 기능별 파일로 분리하되, 빌드 도구 없이 GitHub Pages에 그대로 배포 가능해야 한다.

**성공 기준**: 데스크톱 뷰는 시각적 회귀 없음. 모바일에서 첫 화면~일정 도달 스크롤 길이가 눈에 띄게 줄고, Day 칩으로 임의 날짜에 2탭 이내 도달. 분리 후에도 `file://` 더블클릭·GitHub Pages 배포 모두 동작.

## 선택한 접근과 이유

**접근 A — 접힘형 + Day 칩 바** (승인됨)

- 상단 내비 아래 **Day 1~8 가로 칩 바**(sticky)를 추가하고 기존 `showDay`/`goToDay` 로직을 재사용한다. 기존 지도·스크롤 연동 구조를 그대로 살려 구현 리스크가 낮다.
- 모바일에서만 쇼츠·참고콘텐츠·앨범을 기본 접힘 처리한다. 데스크톱 무변경.
- 모듈화는 **빌드 없는 기능별 정적 분리** + **`<script defer>` 클래식 로딩**. ES 모듈은 `file://`에서 CORS로 차단되므로 배제 — 더블클릭 미리보기 유지가 우선.

## 아키텍처

```
index.html              마크업만 (~560줄로 축소)
css/
  base.css              CSS 변수·리셋·타이포·wrap·topnav·hero·footer
  components.css        overview·항공편·체크리스트·숙박탭·day카드·스팟·앨범·refs·쇼츠·라이트박스·스팟가이드
  map.css               지도 패널·Leaflet 커스텀 마커(pin/dot/plane)·툴팁·범례
  responsive.css        @media 1023px/768px/560px/380px + @media print
js/
  data.js               SPOTS·REFS·SHORTS·DAYS·좌표 상수 → window.SAIPAN 네임스페이스 (콘텐츠 데이터 전용)
  img-retry.js          이미지 404 캐시 재시도
  bgm.js                배경음악 토글·자동재생 킥
  lightbox.js           사진 확대 뷰어
  checklist.js          체크리스트 localStorage 저장
  stay-calc.js          숙박 전략 탭 + 비용 계산기
  spots.js              스팟 가이드 카드 렌더
  refs.js               참고 콘텐츠·쇼츠 렌더 + IntersectionObserver 자동재생
  reveal.js             스크롤 등장 효과
  map.js                Leaflet 지도·일자별 동선 애니메이션
  day-nav.js            (신규) Day 칩 바 + 모바일 접힘 제어 + ☰ 메뉴 시트
```

- 로딩: `<script defer src=...>`를 문서 순서대로 나열. defer는 문서 순서 실행이 보장되므로 `data.js`를 항상 최상단에 둔다.
- 모듈 간 공유: 기존 `window.__SPOTS`/`window.__flySpot` 임시 패턴을 `window.SAIPAN` 네임스페이스 하나로 정리 (`SAIPAN.SPOTS`, `SAIPAN.flySpot`, `SAIPAN.goToDay` 등).
- 각 JS 파일은 기존과 동일하게 독립 IIFE — 한 파일이 실패해도 나머지는 동작.

## 모바일 단순화 — 동작 설계

| 항목 | 설계 |
|---|---|
| Day 칩 바 | topnav 아래 sticky 한 줄(D1 9/10 … D8 9/17). 클릭 → `goToDay()` 재사용. 스크롤 시 현재 날짜 칩 자동 하이라이트 + `scrollIntoView({inline:'nearest'})`로 가시화. 데스크톱·모바일 공통 표시 |
| 부가 콘텐츠 접힘 | 쇼츠·참고콘텐츠·앨범을 접기 블록(버튼 + 접힘 클래스)으로 감싼다. 초기 상태는 `matchMedia('(max-width:768px)')`로 결정 — 모바일 기본 접힘, 데스크톱 항상 펼침·토글 숨김. `<details>` 대신 자체 접기를 쓰는 이유: 데스크톱 항상-펼침을 CSS만으로 강제할 수 없기 때문 |
| 쇼츠 로드 | 접힌 동안 IntersectionObserver에 잡히지 않아 iframe 로드가 자연 지연됨. 펼침 시 해당 카드를 재관찰(또는 즉시 로드)하여 자동재생 유지 |
| 내비 정리 | 모바일에서 텍스트 링크 5개 + 인쇄 버튼을 ☰ 메뉴 시트로 수납. 상단엔 브랜드 + 🎵 + ☰만. 데스크톱 현행 유지 |
| 히어로 정리 | 모바일에서 메타 필 4개를 full-width 세로 스택 → 콤팩트 2×2 칩 그리드 |
| 스크롤 오프셋 | sticky 2단(topnav + Day 칩) 높이만큼 `.day`의 `scroll-margin-top` 재조정 |

## 데이터 흐름

```
data.js (window.SAIPAN.{SPOTS,REFS,SHORTS,DAYS,좌표})
  → spots.js  : SPOTS → 스팟 카드 DOM
  → refs.js   : REFS/SHORTS → day 카드에 삽입
  → map.js    : DAYS/SPOTS → Leaflet 레이어·동선
day-nav.js : DAYS 라벨 → Day 칩 DOM, 클릭 → SAIPAN.goToDay(idx)
map.js     : showDay(idx) → 칩·overview·day카드 active 동기화 (SAIPAN.onDayChange 콜백)
```

## 인터페이스 (모듈 경계)

- `SAIPAN.SPOTS / REFS / SHORTS / DAYS` — 읽기 전용 데이터 (data.js 소유)
- `SAIPAN.flySpot(ll, name)` — map.js 제공, spots.js 사용
- `SAIPAN.goToDay(idx)` — map.js 제공, day-nav.js·overview 사용
- `SAIPAN.onDayChange(cb)` — map.js가 showDay 시 호출, day-nav.js가 칩 하이라이트에 구독
- data.js 의존 모듈은 `if (!window.SAIPAN) return;` 가드로 시작

## 에러 처리

- JS 파일 하나 로드 실패 → 해당 기능만 비활성 (독립 IIFE, 현행과 동일)
- Leaflet CDN 실패 → 기존 map-fallback 메시지 유지
- `data.js` 로드 실패 → 의존 모듈이 가드로 조용히 종료, 정적 마크업(일정표·항공편 등)은 그대로 표시
- 배포 캐시(구 HTML + 신 CSS 조합) → `<link>`/`<script>`에 `?v=<버전>` 쿼리 부여, 구조 변경 시 버전 갱신

## 배포

`.github/workflows/pages.yml`의 "Prepare static site" 단계에 `cp -r css js _site/` 추가. **모듈 분리와 같은 커밋에 포함** — 빠지면 배포가 통째로 깨진다.

## 테스트 전략

테스트 프레임워크가 없는 정적 페이지이므로 브라우저 실동작 검증으로 갈음한다:

1. **리팩토링 등가성** — 분리 직후(동작 변경 전) 데스크톱 1280px에서 변경 전과 섹션별 스크린샷 비교, 콘솔 에러 0 확인
2. **모바일 시나리오(390px)** — Day 칩 점프·접힘 토글·☰ 메뉴·지도 연동·숙박 계산기·체크리스트 저장(새로고침 후 유지)·라이트박스·쇼츠 펼침 재생을 각각 실조작
3. **환경 스모크** — `file://` 더블클릭으로 열어 전 기능 동작, 인쇄 미리보기에서 print CSS 적용 확인
4. **배포 검증** — Pages 배포 후 실제 URL에서 css/js 404 없음 확인

## 리스크

- 🟡 접힘 상태 ↔ IntersectionObserver(쇼츠 로드·reveal) 상호작용 — 펼침 시 재관찰 처리 누락하면 쇼츠가 안 뜸. 테스트 2에서 명시 확인
- 🟡 sticky 2단 높이로 인한 앵커 오프셋 — `scroll-margin-top` 재조정 필요
- 🟡 배포 캐시 조합 불일치 — `?v=` 버전 쿼리로 완화
- 🟢 defer 순서 의존 — data.js 최상단 고정으로 해결
- 🟢 CSS 분리 시 셀렉터 우선순위 변화 — 파일 분할만 하고 셀렉터는 그대로 유지, 로드 순서(base → components → map → responsive)로 현행 캐스케이드 보존

## 기각된 접근

- **하단 탭바(앱 스타일)**: 데스크톱과 구조 이중화, 스크롤텔링·인쇄 UX와 충돌 조정 비용 큼 → 기각
- **CSS 밀도 조정만**: 피드백 원인(콘텐츠 과다 노출·내비 혼잡)을 해소 못 하고 일자별 내비 요구 미충족 → 기각
- **Vite 등 빌드 도입**: 정적 1페이지에 node_modules·빌드 단계는 과함(YAGNI) → 기각
- **ES 모듈 로딩**: `file://` 미리보기 차단 → 기각 (defer 클래식 채택)

## 구현 계획

**목표:** index.html(2,128줄)을 css/ 4파일 + js/ 11파일로 빌드 없이 분리하고, Day 칩 바·모바일 접힘·☰ 메뉴·히어로 정리로 모바일 복잡도를 낮춘다.

**아키텍처:** 정적 분리 — CSS는 원본 `<style>` 블록을 **연속 구간 4등분**(base→map→components→responsive)해 소스 순서와 캐스케이드를 100% 보존한다. JS는 기존 IIFE 9개를 파일로 이식하고, 데이터(SPOTS·REFS·SHORTS·DAYS)만 `js/data.js`의 `window.SAIPAN`으로 추출한다. 신규 동작(칩 바·접힘·메뉴)은 `js/day-nav.js` 하나에 모은다.

**기술 스택:** Vanilla JS(IIFE, `<script defer>`), CSS(기존 변수 체계), Leaflet 1.9.4 CDN, GitHub Pages(gh-pages 브랜치 배포).

### 전역 제약 (Global Constraints)

- 빌드 도구·npm 의존성 도입 금지 — CDN(Leaflet·Pretendard)과 정적 파일만 사용
- ES 모듈(`type="module"`) 금지 — `file://` 더블클릭 미리보기가 깨진다. `<script defer>` 클래식만
- 데스크톱(≥1024px) 시각 회귀 금지 — 분리 전후 렌더 동일해야 함
- CSS 규칙의 원문·순서 변경 금지(분리 태스크에서) — 로드 순서 base→map→components→responsive 고정
- `<link>`/`<script>`에 `?v=1` 캐시 버전 쿼리 부여, 이후 구조 변경 시 버전 증가
- 커밋 메시지는 기존 컨벤션(짧은 영어 명령형, 프리픽스 없음), commit 스킬로 커밋

---

## 태스크

### Task 1: css-split — CSS 4파일 분리 + 배포 워크플로우

**파일:**
- 생성: `css/base.css`, `css/map.css`, `css/components.css`, `css/responsive.css`
- 수정: `index.html` (10~863행 `<style>` 블록 제거, `<link>` 4개 추가)
- 수정: `.github/workflows/pages.yml:29`

**인터페이스:**
- 생산: css/ 4파일 — 이후 태스크가 base.css(칩 바)·components.css(접힘)·responsive.css(내비·히어로)에 규칙을 추가한다

- [ ] **Step 1: `<style>` 내용을 연속 구간 4등분으로 이동** — 원문 그대로, 재배열·수정 금지. 경계는 섹션 주석 기준:

| 파일 | 시작 (포함) | 끝 (포함) |
|---|---|---|
| `css/base.css` | `:root{` (11행) | `p,li,h1,h2,h3,h4,a,span,div{overflow-wrap:anywhere}` (130행) |
| `css/map.css` | `/* ── Map side panel ── */` (132행) | `.leaflet-tooltip-right.stop-tip::before{...}` (228행) |
| `css/components.css` | `/* ── Sections ── */` (230행) | footer `.credits a` 규칙 (685행) |
| `css/responsive.css` | `/* ── Responsive ── */` (687행) | `@media print{...}` 블록 닫는 `}` (862행) |

주: `.nav-btn.on`·`.spot-pin`(지도 관련)은 원본 순서 보존을 위해 components.css에 남는다.

- [ ] **Step 2: index.html에서 `<style>...</style>` 전체를 `<link>` 4개로 교체** (기존 CDN link 바로 아래):

```html
<link rel="stylesheet" href="./css/base.css?v=1">
<link rel="stylesheet" href="./css/map.css?v=1">
<link rel="stylesheet" href="./css/components.css?v=1">
<link rel="stylesheet" href="./css/responsive.css?v=1">
```

- [ ] **Step 3: pages.yml 복사 목록에 css 추가**

```yaml
          cp -r img audio css _site/
```

- [ ] **Step 4: 등가성 검증**
실행: 로컬 서버(`py -m http.server 8080`) → `http://localhost:8080`을 1280px로 열기
기대: 분리 전과 렌더 동일(히어로·지도·day카드·푸터), DevTools 콘솔 에러 0, Network 탭에서 css 4개 200

- [ ] **Step 5: 커밋** — commit 스킬, 예: `Split inline styles into css modules`

### Task 2: js-split — 데이터 추출 + JS 10파일 분리

**파일:**
- 생성: `js/data.js`, `js/img-retry.js`, `js/bgm.js`, `js/lightbox.js`, `js/checklist.js`, `js/stay-calc.js`, `js/spots.js`, `js/refs.js`, `js/reveal.js`, `js/map.js`
- 수정: `index.html` (1374~2125행 `<script>` 블록 제거, defer 태그 추가)
- 수정: `.github/workflows/pages.yml:29`

**인터페이스:**
- 생산: `window.SAIPAN = { SPOTS, REFS, SHORTS, DAYS }` (data.js) / `SAIPAN.flySpot(ll, name)` (map.js) — Task 3~4가 이 네임스페이스에 API를 추가한다

- [ ] **Step 1: js/data.js 생성** — SPOTS 배열(1535~1600행), REFS(1630~1680행), SHORTS(1682~1712행), 좌표 상수(1825~1845행), DAYS(1848~1908행)를 원문 그대로 이동:

```js
/* 콘텐츠 데이터 — 일정·스팟·참고 콘텐츠를 여기서만 수정한다 */
window.SAIPAN = (function(){
  const SPOTS = [ /* index.html의 SPOTS 원문 */ ];
  const REFS = { /* REFS 원문 */ };
  const SHORTS = { /* SHORTS 원문 */ };
  const SPN_AIRPORT = [15.1190, 145.7290];
  /* ... 좌표 상수 원문 전부 ... */
  const DAYS = [ /* DAYS 원문 (좌표 상수 참조 유지) */ ];
  return { SPOTS, REFS, SHORTS, DAYS };
})();
```

- [ ] **Step 2: IIFE 9개를 파일로 이동** — 각 `/* ═══ ═══ */` 주석 블록 단위 원문 이동:

| 파일 | 원본 구간 | 변경점 |
|---|---|---|
| `js/img-retry.js` | 1375~1383행 | 없음 |
| `js/bgm.js` | 1385~1417행 | 없음 |
| `js/lightbox.js` | 1419~1463행 | 없음 |
| `js/checklist.js` | 1465~1476행 | 없음 |
| `js/stay-calc.js` | 1478~1531행 | 없음 |
| `js/spots.js` | 1533~1625행 | SPOTS 정의 제거 → 서두에 가드+참조, `window.__flySpot` → `SAIPAN.flySpot`, `window.__SPOTS = SPOTS` 줄 삭제 |
| `js/refs.js` | 1627~1801행 | REFS·SHORTS 정의 제거 → 가드+참조 |
| `js/reveal.js` | 1803~1814행 | 없음 |
| `js/map.js` | 1816~2124행 | 좌표·DAYS 정의 제거 → 가드+참조, `(window.__SPOTS \|\| [])` → `S.SPOTS`, `window.__flySpot =` → `S.flySpot =` |

가드+참조 패턴 (spots.js 예):

```js
(function(){
  const S = window.SAIPAN;
  if (!S) return;                 // data.js 로드 실패 시 조용히 종료
  const SPOTS = S.SPOTS;
  /* ...기존 card()/렌더/goto 코드 원문... */
  // 변경: if (window.__flySpot) window.__flySpot(ll, nm)
  //   →   if (S.flySpot) S.flySpot(ll, btn.dataset.nm)
})();
```

- [ ] **Step 3: index.html 스크립트 태그 교체** — Leaflet은 현행 유지, 인라인 블록 제거:

```html
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script defer src="./js/data.js?v=1"></script>
<script defer src="./js/img-retry.js?v=1"></script>
<script defer src="./js/bgm.js?v=1"></script>
<script defer src="./js/lightbox.js?v=1"></script>
<script defer src="./js/checklist.js?v=1"></script>
<script defer src="./js/stay-calc.js?v=1"></script>
<script defer src="./js/spots.js?v=1"></script>
<script defer src="./js/refs.js?v=1"></script>
<script defer src="./js/reveal.js?v=1"></script>
<script defer src="./js/map.js?v=1"></script>
```

defer는 문서 순서 실행이 보장된다 — data.js가 항상 먼저다. Leaflet(클래식)은 파싱 중 실행되므로 defer 스크립트보다 먼저 `L`을 정의한다.

- [ ] **Step 4: pages.yml 복사 목록에 js 추가**

```yaml
          cp -r img audio css js _site/
```

- [ ] **Step 5: 기능 스모크 검증**
실행: 로컬 서버 1280px + `file://` 더블클릭 양쪽에서 — 지도 동선 애니메이션, 스팟 카드 '지도에서 보기', 쇼츠 자동재생, 참고 카드 재생, 체크리스트 저장(새로고침 유지), 숙박 계산기, 라이트박스, BGM
기대: 전부 현행과 동일 동작, 콘솔 에러 0

- [ ] **Step 6: 커밋** — 예: `Split inline script into js modules`

### Task 3: day-chip-bar — Day 칩 바 + 지도 연동

**파일:**
- 생성: `js/day-nav.js`
- 수정: `js/map.js` (`goToDay`/`onDayChange` 노출, showDay에서 콜백 호출)
- 수정: `css/base.css` (칩 바 스타일 append), `css/components.css` (scroll-margin), `css/responsive.css` (print 숨김)
- 수정: `index.html` (day-nav.js 태그 추가)

**인터페이스:**
- 소비: `SAIPAN.DAYS`(라벨), `SAIPAN.goToDay(idx, scroll)`, `SAIPAN.onDayChange(cb)`
- 생산: `SAIPAN.goToDay`·`SAIPAN.onDayChange` (map.js가 정의) — cb는 `(idx: number) => void`, 구독 시 현재 day로 즉시 1회 호출됨

- [ ] **Step 1: map.js에 API 노출** — IIFE 안 `let current = -1;` 아래에 추가:

```js
const dayChangeCbs = [];
S.onDayChange = cb => { dayChangeCbs.push(cb); if (current >= 0) cb(current); };
S.goToDay = goToDay;   // goToDay 정의 이후 아무 위치에서 대입 (호이스팅으로 안전)
```

`showDay()` 안 `routeLayer.clearLayers();` 직전에 추가:

```js
dayChangeCbs.forEach(cb => cb(idx));
```

- [ ] **Step 2: js/day-nav.js 생성**

```js
/* ═══════════ Day 칩 바 — 일자별 바로가기 ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S || !S.DAYS) return;
  const topnav = document.querySelector('nav.topnav');
  const bar = document.createElement('nav');
  bar.className = 'day-chips';
  bar.setAttribute('aria-label', '일자별 바로가기');
  bar.innerHTML = S.DAYS.map((d, i) => {
    const m = d.label.match(/\d+\/\d+ ./);      // "Day 1 · 9/10 목" → "9/10 목"
    return '<button class="day-chip" data-day="' + i + '">D' + (i + 1) +
           '<span>' + (m ? m[0] : '') + '</span></button>';
  }).join('');
  topnav.insertAdjacentElement('afterend', bar);

  /* topnav 실제 높이에 맞춰 sticky 오프셋 동기화 (모바일 내비 높이 가변 대응) */
  const setTop = () => { bar.style.top = topnav.offsetHeight + 'px'; };
  setTop();
  window.addEventListener('resize', setTop);

  bar.addEventListener('click', e => {
    const btn = e.target.closest('.day-chip');
    if (btn && S.goToDay) S.goToDay(+btn.dataset.day, true);
  });
  if (S.onDayChange) S.onDayChange(idx => {
    bar.querySelectorAll('.day-chip').forEach(c => {
      const on = +c.dataset.day === idx;
      c.classList.toggle('on', on);
      if (on) c.scrollIntoView({ block:'nearest', inline:'nearest', behavior:'smooth' });
    });
  });
})();
```

- [ ] **Step 3: base.css 끝에 칩 바 스타일 append**

```css
/* ── Day 칩 바 ─────────────────────── */
.day-chips{
  position:sticky;top:56px;z-index:1090;
  display:flex;gap:8px;overflow-x:auto;
  padding:8px 24px;background:var(--cream);
  border-bottom:1px solid var(--border);
  scrollbar-width:none;
}
.day-chips::-webkit-scrollbar{display:none}
.day-chip{
  flex:none;display:inline-flex;align-items:center;gap:6px;
  font-size:13px;padding:5px 12px;
  border:1px solid var(--border);border-radius:9999px;
  background:transparent;color:var(--charcoal);
  cursor:pointer;font-family:inherit;white-space:nowrap;
}
.day-chip span{color:var(--muted);font-size:12px}
.day-chip:hover{border-color:var(--border-strong)}
.day-chip.on{background:var(--charcoal);color:var(--off-white);border-color:var(--charcoal)}
.day-chip.on span{color:rgba(252,251,248,.75)}
```

- [ ] **Step 4: sticky 2단 오프셋 보정** — components.css의 `.day{...scroll-margin-top:80px}` → `124px`로 수정하고, components.css `section{padding:48px 0}` 규칙에 `scroll-margin-top:64px` 추가. responsive.css `@media print` 블록 첫 규칙의 숨김 목록에 `.day-chips` 추가.

- [ ] **Step 5: index.html에 태그 추가** (map.js 다음 줄):

```html
<script defer src="./js/day-nav.js?v=1"></script>
```

- [ ] **Step 6: 검증**
실행: 1280px·390px에서 칩 클릭 → 해당 day로 스크롤+지도 전환, 본문 스크롤 시 활성 칩 이동·가시화, 앵커 점프 시 제목이 sticky에 가리지 않는지, 인쇄 미리보기에 칩 바 없음
기대: 전부 통과, 콘솔 에러 0

- [ ] **Step 7: 커밋** — 예: `Add sticky day chip navigation`

### Task 4: mobile-fold — 부가 콘텐츠 모바일 기본 접힘

**파일:**
- 수정: `js/refs.js` (`loadShort` 노출), `js/day-nav.js` (접힘 IIFE 추가), `css/components.css` (접기 스타일)

**인터페이스:**
- 소비: `SAIPAN.loadShort(cardEl)` — refs.js가 생산, 이미 로드된 카드(`data-loaded`)는 무시
- 생산: `.fold`/`.fold.closed` DOM 상태 — CSS가 소비

- [ ] **Step 1: refs.js에서 loadShort 노출** — `const loadShort = card => {...}` 정의 직후:

```js
S.loadShort = loadShort;
```

- [ ] **Step 2: day-nav.js 끝에 접힘 IIFE 추가**

```js
/* ═══════════ 모바일 접힘 — 쇼츠·참고 콘텐츠·앨범 ═══════════ */
(function(){
  const mobile = window.matchMedia('(max-width:768px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.shorts, .refs, .album').forEach(b => {
    const h = b.querySelector('h4');
    if (!h) return;
    b.classList.add('fold');
    if (mobile) b.classList.add('closed');
    const btn = document.createElement('button');
    btn.className = 'fold-toggle';
    btn.setAttribute('aria-expanded', String(!mobile));
    btn.innerHTML = h.innerHTML + '<span class="chev">▾</span>';
    h.replaceWith(btn);
    btn.addEventListener('click', () => {
      const closed = b.classList.toggle('closed');
      btn.setAttribute('aria-expanded', String(!closed));
      /* 펼침 시 미로드 쇼츠 즉시 로드 (IO 미발화 대비) — reduced-motion은 기존 클릭 재생 유지 */
      const S = window.SAIPAN;
      if (!closed && !reduced && S && S.loadShort){
        b.querySelectorAll('.short-card:not([data-loaded])').forEach(c => S.loadShort(c));
      }
    });
  });
})();
```

- [ ] **Step 3: components.css 끝에 접기 스타일 append**

```css
/* ── 접기 블록 (모바일 기본 접힘) ──── */
.fold-toggle{
  display:flex;align-items:center;gap:6px;width:100%;
  font-size:14px;font-weight:600;color:var(--muted);
  letter-spacing:-.1px;margin-bottom:12px;
  background:none;border:0;padding:0;
  font-family:inherit;text-align:left;cursor:default;
}
.fold-toggle .chev{display:none;margin-left:auto;transition:transform .2s}
@media (max-width:768px){
  .fold-toggle{cursor:pointer}
  .fold-toggle .chev{display:inline}
  .fold.closed > .fold-toggle .chev{transform:rotate(-90deg)}
  .fold.closed > *:not(.fold-toggle){display:none}
  .fold.closed .fold-toggle{margin-bottom:0}
}
```

- [ ] **Step 4: 검증**
실행: 390px — day 카드에서 쇼츠·참고·앨범이 접힌 채 렌더, 토글 펼침 시 쇼츠 자동재생 시작·앨범 그리드 표시, 라이트박스 정상. 1280px — 접힘 UI 없이 현행과 동일(chevron 미표시). 접힌 상태에서 Network에 youtube iframe 요청 없음
기대: 전부 통과

- [ ] **Step 5: 커밋** — 예: `Collapse secondary day content on mobile`

### Task 5: mobile-nav-hero — ☰ 메뉴 시트 + 히어로 정리

**파일:**
- 수정: `index.html` (nav 구조 변경), `js/day-nav.js` (메뉴 IIFE 추가), `css/base.css` (menu-btn 기본), `css/responsive.css` (768/560 nav·hero 규칙 교체)

**인터페이스:** 없음 (독립 UI)

- [ ] **Step 1: index.html nav 구조 변경** — `.links`에 id 부여, BGM 버튼을 links 밖으로, ☰ 버튼 추가:

```html
<nav class="topnav">
  <div class="wrap">
    <span class="brand">사이판 · 로타 🌴</span>
    <div class="links" id="navLinks">
      <a href="#flights">항공편</a>
      <a href="#checklist">체크리스트</a>
      <a href="#staycompare">숙박 비교</a>
      <a href="#spotguide">스팟 가이드</a>
      <a href="#days">일정</a>
      <button class="btn-dark" id="printBtn" onclick="window.print()">인쇄 / PDF 저장</button>
    </div>
    <button class="bgm-btn" id="bgmBtn" title="배경음악 켜기" aria-label="배경음악 켜기/끄기">🎵</button>
    <button class="menu-btn" id="menuBtn" aria-label="메뉴 열기" aria-expanded="false">☰</button>
  </div>
</nav>
```

- [ ] **Step 2: base.css nav 섹션에 추가** — 데스크톱에서 메뉴 버튼 숨김 + links 우측 정렬 유지:

```css
.menu-btn{
  display:none;width:34px;height:34px;flex:none;
  align-items:center;justify-content:center;
  background:transparent;color:var(--charcoal);
  border:1px solid var(--border-strong);border-radius:9999px;
  font-size:15px;cursor:pointer;font-family:inherit;
}
nav.topnav .wrap{gap:12px}
nav.topnav .links{margin-left:auto}
```

(기존 `.links{display:flex;gap:16px;...}`는 그대로 — 인쇄 버튼이 links 안으로 들어가고, BGM 버튼이 links 밖으로 나오므로 `.wrap{gap:12px}`로 링크 그룹↔BGM 간격을 확보한다. 데스크톱 배치는 그 외 불변)

- [ ] **Step 3: day-nav.js 끝에 메뉴 IIFE 추가**

```js
/* ═══════════ 모바일 ☰ 메뉴 시트 ═══════════ */
(function(){
  const btn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '✕' : '☰';
    btn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  links.addEventListener('click', e => {
    if (!e.target.closest('a, button')) return;
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '☰';
    btn.setAttribute('aria-label', '메뉴 열기');
  });
})();
```

- [ ] **Step 4: responsive.css 768px 블록의 nav 규칙 교체** — 기존 `nav.topnav .wrap{...}`, `nav.topnav .brand{...}`, `nav.topnav .links{...}`, `nav.topnav .links::-webkit-scrollbar{...}`, `nav.topnav a,.btn-dark{...}`, `.btn-dark{padding:7px 12px}` 6개 규칙을 삭제하고 아래로 대체:

```css
  nav.topnav .wrap{height:56px;gap:10px;padding-top:0;padding-bottom:0;align-items:center}
  nav.topnav .brand{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .menu-btn{display:flex}
  nav.topnav .links{
    display:none;
    position:absolute;left:0;right:0;top:100%;
    flex-direction:column;align-items:stretch;gap:2px;
    margin-left:0;padding:8px 18px 14px;
    background:var(--cream);border-bottom:1px solid var(--border);
    box-shadow:rgba(0,0,0,.06) 0 8px 16px;
  }
  nav.topnav .links.open{display:flex}
  nav.topnav .links a{padding:11px 4px;font-size:15px}
  nav.topnav .links .btn-dark{margin-top:8px;text-align:center}
```

- [ ] **Step 5: responsive.css 560px 블록 정리** — `nav.topnav .wrap{display:grid;...}`, `nav.topnav .brand{line-height:1.3}`, `nav.topnav .links{width:100%;margin-left:-2px}` 3개 규칙 삭제(768px 규칙이 그대로 적용됨). 같은 블록의 `.hero .meta{gap:8px;margin-top:24px}`·`.hero .meta span{width:100%;border-radius:8px}`를 아래로 교체:

```css
  .hero .meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:24px}
  .hero .meta span{border-radius:8px;font-size:12px;padding:8px 10px;text-align:left}
```

- [ ] **Step 6: 검증**
실행: 390px — 상단이 브랜드+🎵+☰ 한 줄(56px), ☰ 탭 → 시트 열림, 링크 탭 → 이동+자동 닫힘, 히어로 메타가 2×2 그리드. 768px 경계(767/769px)에서 데스크톱↔모바일 전환 자연스러움. 1280px — 현행과 동일. Day 칩 바 sticky 오프셋(topnav 56px)이 setTop()으로 맞는지
기대: 전부 통과, 콘솔 에러 0

- [ ] **Step 7: 커밋** — 예: `Simplify mobile nav and hero`

### Task 6: deploy-verify — 배포 검증

**파일:** 없음 (검증 전용)

- [ ] **Step 1: push 후 Actions 성공 확인**
실행: `git push` → `gh run watch` 또는 `gh run list --limit 1`
기대: Deploy GitHub Pages 성공

- [ ] **Step 2: 실서비스 URL 확인**
실행: 배포된 Pages URL을 데스크톱·모바일(또는 DevTools 에뮬레이션)로 열기
기대: css/js 404 없음, 전 기능 동작, 모바일에서 접힘·칩 바·☰ 메뉴 정상
