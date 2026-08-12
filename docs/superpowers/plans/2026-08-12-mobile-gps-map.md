# Mobile GPS Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 전체화면 일정 지도에 사용자가 켜고 끌 수 있는 실시간 현재 위치 표시를 추가한다.

**Architecture:** Leaflet 표현 계층은 `js/map.js`의 작은 사용자 위치 어댑터로 유지하고, 브라우저 권한과 `watchPosition` 생명주기는 새 `js/geolocation.js`에서 관리한다. 모바일 오버레이는 공개된 중지 API만 호출하여 지도 UI와 GPS 상태를 느슨하게 결합한다.

**Tech Stack:** 정적 HTML/CSS, 바닐라 JavaScript, Leaflet 1.9.4, Browser Geolocation API, Node.js `node:test`

## Global Constraints

- 위치 권한은 사용자가 `내 위치` 버튼을 탭했을 때만 요청한다.
- 원본 GPS 위도·경도는 앱 네트워크 요청이나 영구 저장소로 전송하지 않는다. CARTO 베이스맵에는 현재 표시 영역의 타일 좌표와 접속 정보가 전달될 수 있음을 문서에 고지한다.
- 모바일 지도 오버레이 종료와 `document.visibilityState === 'hidden'`에서 추적을 중지한다.
- 기존 일정 경로, 장소 레이어, 스팟 팝업 동작을 유지한다.

---

### Task 1: GPS 추적 컨트롤러

**Files:**
- Create: `js/geolocation.js`
- Create: `tests/geolocation.test.js`

**Interfaces:**
- Consumes: `navigator.geolocation.watchPosition(success, error, options)`, `clearWatch(id)`, `SAIPAN.setUserLocation(location, options)`, `SAIPAN.focusUserLocation()`, `SAIPAN.clearUserLocation()`
- Produces: `SAIPAN.stopLocationTracking(): void`; `#locationToggle`의 `data-state`/`aria-pressed`; `#locationStatus`의 라이브 안내

- [x] **Step 1: 명시적 사용자 탭과 첫 위치를 검증하는 실패 테스트 작성**

```js
test('starts watching only after a tap and focuses the first GPS fix', () => {
  const h = loadTracker();
  assert.equal(h.watchCalls.length, 0);
  h.locationButton.click();
  assert.deepEqual(h.watchCalls[0].options, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  });
  h.watchCalls[0].success(position(15.21, 145.75, 12, 90));
  assert.deepEqual(h.mapUpdates[0].options, { focus: true });
});
```

- [x] **Step 2: 테스트를 실행해 `js/geolocation.js` 부재로 실패하는지 확인**

Run: `node --test tests/geolocation.test.js`
Expected: FAIL because `js/geolocation.js` does not exist.

- [x] **Step 3: 최소 추적 컨트롤러 구현**

```js
(function(){
  const S = window.SAIPAN;
  const button = document.getElementById('locationToggle');
  const status = document.getElementById('locationStatus');
  if (!S || !button || !status) return;
  const options = { enableHighAccuracy:true, timeout:15000, maximumAge:5000 };
  let watchId = null;
  let hasFix = false;
  // 버튼 탭에서 watchPosition을 시작하고 첫 success만 focus:true로 전달한다.
})();
```

- [x] **Step 4: 첫 위치 테스트 통과 확인**

Run: `node --test tests/geolocation.test.js`
Expected: PASS for explicit start and first-fix focus.

- [x] **Step 5: 재중앙 정렬·권한 오류·미지원·정리 동작 실패 테스트 추가**

```js
test('a second tap while tracking recenters without starting another watch', () => {});
test('permission denial stops tracking and explains how to recover', () => {});
test('unsupported geolocation reports an unavailable state', () => {});
test('overlay close and page hide clear the active watch and marker', () => {});
```

- [x] **Step 6: 오류와 정리 동작 구현 후 Task 1 테스트 통과 확인**

Run: `node --test tests/geolocation.test.js`
Expected: all GPS controller tests PASS with no warnings.

### Task 2: Leaflet 사용자 위치 어댑터와 모바일 UI

**Files:**
- Modify: `js/map.js:254-266`
- Modify: `js/map-overlay.js:31-54`
- Modify: `index.html:742-755,797-800`
- Modify: `css/map.css`
- Modify: `css/responsive.css`
- Create: `tests/map-user-location.test.js`

**Interfaces:**
- Consumes: `{ lat:number, lng:number, accuracy:number, heading:number|null }`, `{ focus:boolean }`
- Produces: `SAIPAN.setUserLocation(location, options): void`, `SAIPAN.focusUserLocation(): boolean`, `SAIPAN.clearUserLocation(): void`

- [x] **Step 1: 마커·정확도 반경·첫 포커스·드래그 해제를 검증하는 실패 테스트 작성**

```js
test('renders and updates a blue user marker with an accuracy circle', () => {});
test('focuses the first fix and stops following after a manual drag', () => {});
test('focusUserLocation reenables follow and clearUserLocation removes layers', () => {});
```

- [x] **Step 2: 테스트를 실행해 공개 지도 API가 없어 실패하는지 확인**

Run: `node --test tests/map-user-location.test.js`
Expected: FAIL because the user-location map API is undefined.

- [x] **Step 3: Leaflet 위치 어댑터 최소 구현**

```js
S.setUserLocation = (location, options) => {
  const ll = [location.lat, location.lng];
  // L.marker와 L.circle을 생성 또는 갱신한다.
  // options.focus 또는 follow 상태일 때 현재 위치로 이동한다.
};
S.focusUserLocation = () => false;
S.clearUserLocation = () => {};
```

- [x] **Step 4: 지도 어댑터 테스트 통과 확인**

Run: `node --test tests/map-user-location.test.js`
Expected: all Leaflet adapter tests PASS.

- [x] **Step 5: 접근 가능한 버튼·상태 영역·모바일 스타일·스크립트 순서 연결**

```html
<button class="nav-btn location-btn" id="locationToggle" type="button"
  aria-label="내 위치 표시" aria-pressed="false" title="내 위치 표시">⌖</button>
<div class="location-status" id="locationStatus" role="status" aria-live="polite" hidden></div>
<script defer src="./js/geolocation.js?v=1"></script>
```

`map-overlay.js`의 `close()`는 `SAIPAN.stopLocationTracking()`을 호출하고, CSS는 44px 이상의 모바일 터치 영역과 파란 위치점/방향/정확도 반경을 표시한다.

- [x] **Step 6: GPS·지도·전체 회귀 테스트 실행**

Run: `node --test "tests/*.test.js"`
Expected: all tests PASS, including the original 15 tests.

### Task 3: 브라우저 모바일 검증과 문서 마감

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-12-mobile-gps-map.md`

**Interfaces:**
- Consumes: 완성된 정적 사이트와 로컬 HTTP 서버
- Produces: 사용자용 GPS 동작/HTTPS 제한 설명과 완료된 체크박스

- [x] **Step 1: README에 모바일 GPS 사용법과 개인정보 동작 기록**

```md
- 모바일 전체화면 지도에서 `⌖ 내 위치`를 누르면 실시간 위치가 표시됩니다.
- 원본 GPS 좌표는 앱 서버에 저장되지 않으며 지도 종료 또는 화면 전환 시 추적을 중지합니다. CARTO 타일 서버에는 현재 표시 영역이 전달될 수 있습니다.
```

- [x] **Step 2: 로컬 서버에서 모바일 폭 UI 확인**

Run: `python -m http.server 4173`
Expected: 390px 폭에서 지도 오버레이, 위치 버튼, 상태 문구가 겹치지 않고 보인다.

- [x] **Step 3: 최종 정적 검사와 전체 테스트 실행**

Run: `node --check js/geolocation.js; node --check js/map.js; node --check js/map-overlay.js; node --test "tests/*.test.js"`
Expected: syntax checks exit 0 and all tests PASS.

- [x] **Step 4: 계획의 모든 체크박스를 완료로 갱신하고 변경사항 검토**

Run: `git diff --check; git status --short`
Expected: no whitespace errors; only GPS feature, tests, and documentation files are modified.
