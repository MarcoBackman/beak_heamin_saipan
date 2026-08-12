# Galaxy S25 Fullscreen Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 갤럭시 S25급 모바일 화면에서 잘리지 않는 지도 조작 UI와 앱/브라우저 전체화면 모드를 제공한다.

**Architecture:** 지도 열기·닫기·Fullscreen API·초점 복귀는 `js/map-overlay.js`가 소유한다. `index.html`은 GPS 버튼을 날짜 컨트롤에서 분리하고 하단 도크 구조를 제공하며, `css/responsive.css`가 모바일 엣지 투 엣지 화면과 안전 영역을 담당한다. 기존 `js/geolocation.js`와 `js/map.js`의 GPS 추적 계약은 변경하지 않는다.

**Tech Stack:** 정적 HTML/CSS, 바닐라 JavaScript, Leaflet 1.9.4, Browser Fullscreen API, Node.js `node:test`

## Global Constraints

- 갤럭시 S25급 CSS 뷰포트 `360×780`에서 검증한다.
- 최소 지원 폭 `320px`에서 수평 오버플로가 없어야 한다.
- 현재 위치 버튼은 `48×48px`, 다른 모바일 조작 버튼은 최소 `44×44px`이다.
- 앱 내부 전체보기는 `100dvh`와 safe-area inset을 사용하고 `100vh` 폴백을 둔다.
- Fullscreen API 미지원·거부 시에도 앱 내부 전체보기는 계속 동작한다.
- 지도 닫기와 문서 숨김에서 GPS 추적을 중지하는 기존 동작을 유지한다.

---

### Task 1: 전체보기·Fullscreen API 생명주기

**Files:**
- Modify: `tests/map-overlay-location.test.js`
- Modify: `js/map-overlay.js`

**Interfaces:**
- Consumes: `mapSide.requestFullscreen(): Promise<void>`, `document.exitFullscreen(): Promise<void>`, `document.fullscreenElement`, `SAIPAN.invalidateMap()`, `SAIPAN.stopLocationTracking()`
- Produces: 동적 `.map-fullscreen-toggle` 버튼, `SAIPAN.openMapOverlay(): void`, `SAIPAN.closeMapOverlay(): void`

- [x] **Step 1: 전체화면 진입·종료·미지원·초점 복귀 실패 테스트 작성**

```js
test('fullscreen toggle enters and exits browser fullscreen', async () => {
  const h = loadOverlay({ fullscreenSupported:true });
  await h.fullscreenButton.click();
  assert.equal(h.requestFullscreenCalls, 1);
  h.document.fullscreenElement = h.mapSide;
  h.document.fire('fullscreenchange');
  assert.equal(h.fullscreenButton.getAttribute('aria-pressed'), 'true');
  await h.fullscreenButton.click();
  assert.equal(h.exitFullscreenCalls, 1);
});

test('unsupported fullscreen hides only the system fullscreen button', () => {
  const h = loadOverlay({ fullscreenSupported:false });
  assert.equal(h.fullscreenButton.hidden, true);
  h.fab.click();
  assert.equal(h.body.classList.contains('map-open'), true);
});

test('closing restores focus and exits fullscreen while stopping GPS', async () => {
  const h = loadOverlay({ fullscreenSupported:true, fullscreenElement:true });
  h.closeButton.click();
  assert.equal(h.stopCalls, 1);
  assert.equal(h.exitFullscreenCalls, 1);
  assert.equal(h.fab.focusCalls, 1);
});
```

- [x] **Step 2: RED 확인**

Run: `node --test tests/map-overlay-location.test.js`
Expected: FAIL because `.map-fullscreen-toggle`, fullscreen state updates, and focus restoration do not exist.

- [x] **Step 3: 최소 전체화면 생명주기 구현**

```js
const fullscreenBtn = document.createElement('button');
fullscreenBtn.className = 'map-fullscreen-toggle';
fullscreenBtn.setAttribute('aria-label', '전체화면으로 보기');
fullscreenBtn.setAttribute('aria-pressed', 'false');
fullscreenBtn.hidden = typeof mapSide.requestFullscreen !== 'function';

async function toggleFullscreen(){
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await mapSide.requestFullscreen();
  } catch (_) {
    fullscreenBtn.hidden = true;
  }
}
```

`fullscreenchange`에서 버튼 상태와 Leaflet 크기를 갱신하고, `close()`는 시스템 전체화면 종료·GPS 중지·FAB 초점 복귀를 수행한다.

- [x] **Step 4: Task 1 GREEN 확인**

Run: `node --test tests/map-overlay-location.test.js`
Expected: all overlay lifecycle tests PASS.

### Task 2: S25 엣지 투 엣지 지도와 분리형 컨트롤

**Files:**
- Modify: `index.html:8-13,735-758,796-802`
- Modify: `css/map.css:28-48,103-129`
- Modify: `css/responsive.css:2-58,118-123`
- Modify: `README.md`

**Interfaces:**
- Consumes: 기존 `#prevDay`, `#daySlider`, `#nextDay`, `#spotsToggle`, `#poisToggle`, `#locationToggle`, `#locationStatus`
- Produces: `.map-overlay-dock`, `.map-day-ctrl`, `.map-layer-ctrl`, 독립된 `.location-btn`; 기존 ID와 JavaScript 이벤트 계약은 유지한다.

- [x] **Step 1: 실제 브라우저에서 현재 레이아웃 RED 기준 기록**

Run: 로컬 서버를 열고 `360×780`에서 `.map-ctrl`과 `#locationToggle`의 `getBoundingClientRect()` 측정.
Expected: 위치 버튼 오른쪽 `366px > innerWidth 360px`, `.map-ctrl.scrollWidth 353px > width 335px`.

- [x] **Step 2: GPS 버튼과 두 줄 도크 구조로 HTML 변경**

```html
<div id="map"></div>
<div class="map-overlay-dock">
  <button class="nav-btn location-btn" id="locationToggle" ...>⌖</button>
  <div class="location-status" id="locationStatus" ...></div>
  <div class="map-ctrl">
    <div class="map-day-ctrl">...</div>
    <div class="map-layer-ctrl">
      <button id="spotsToggle">🤿 <span>스팟</span></button>
      <button id="poisToggle">📍 <span>편의시설</span></button>
    </div>
  </div>
  <div class="map-legend">...</div>
</div>
```

- [x] **Step 3: 엣지 투 엣지·safe-area·터치 크기 CSS 구현**

```css
body.map-open aside.map-side{position:fixed;inset:0;height:100vh;height:100dvh;padding:0;background:var(--cream)}
body.map-open .map-panel{position:relative;height:100%;border:0;border-radius:0}
body.map-open .map-head{position:absolute;z-index:700;top:0;left:0;right:0;padding-top:calc(12px + env(safe-area-inset-top))}
body.map-open .map-overlay-dock{position:relative;z-index:700;flex:none;padding-bottom:calc(10px + env(safe-area-inset-bottom))}
body.map-open .location-btn{position:absolute;right:14px;top:-60px;width:48px;height:48px}
```

날짜 컨트롤과 레이어 토글은 별도 행으로 만들고, 전체보기 범례는 한 줄 요약만 표시한다. 도크는 지도와 겹치지 않는 flex 자식으로 두고 Leaflet 줌은 반대쪽에 배치한다. 스타일 캐시 버전을 증가시킨다.

- [x] **Step 4: S25·최소 폭 GREEN 브라우저 검증**

Run: `360×780`과 `320×700`에서 전체보기 지도 열기 후 DOM 좌표 측정.
Expected: `#locationToggle` 48×48px, 모든 버튼의 `left >= 0`, `right <= innerWidth`, `document.documentElement.scrollWidth === innerWidth`, `.map-side` 여백 0, 높이 `innerHeight`.

- [x] **Step 5: Fullscreen API와 GPS 상태 브라우저 검증**

Run: 모바일 전체보기에서 권한 오류 상태, 전체화면 버튼 표시, 닫기 동작과 콘솔 로그 확인.
Expected: 상태 문구와 버튼이 겹치지 않고 콘솔 error/warning 0건; 닫은 뒤 `map-open`과 GPS 상태가 해제됨.

- [x] **Step 6: 문서·전체 회귀 검증**

README에 앱 전체보기, 시스템 전체화면, S25 하단 도크를 기록한다.

Run: `node --check js/map-overlay.js; node --check js/geolocation.js; node --check js/map.js; node --test "tests/*.test.js"; git diff --check`
Expected: syntax checks exit 0, all tests PASS, whitespace error 0.

- [x] **Step 7: 완료 상태 갱신과 커밋**

계획의 모든 체크박스를 `[x]`로 바꾸고 다음 파일을 커밋한다.

```bash
git add index.html css/map.css css/responsive.css js/map-overlay.js tests/map-overlay-location.test.js README.md docs/superpowers/plans/2026-08-12-s25-fullscreen-map.md
git commit -m "fix: rebuild mobile map for Galaxy S25"
```
