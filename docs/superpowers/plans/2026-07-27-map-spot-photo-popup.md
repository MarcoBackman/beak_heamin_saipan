# Map Spot Photo Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지도 위 프리다이빙·수영 스팟 마커를 직접 클릭해도 해당 스팟의 사진 팝업을 표시한다.

**Architecture:** `js/map.js`의 기존 사진 팝업 생성 코드를 `openSpotPopup(spot, ll, name)` 공통 함수로 추출한다. 스팟 마커 클릭과 기존 `S.flySpot`이 이 함수를 공유하되, 마커 클릭은 지도 이동 없이 팝업만 열고 가이드 버튼 경로는 기존 `flyTo` 동작을 유지한다.

**Tech Stack:** Vanilla JavaScript, Leaflet 1.9.4, Node.js 내장 `node:test`

## Global Constraints

- 새 런타임 의존성을 추가하지 않는다.
- 기존 스팟 레이어 토글, 툴팁, 모바일 지도 오버레이 동작을 유지한다.
- 사진이 없는 이스트베이 클리프와 피나탕 파크는 이름만 표시한다.
- 사용자가 수정하지 않은 파일은 변경하지 않는다.

---

### Task 1: 지도 스팟 마커 사진 팝업

**Files:**
- Create: `tests/map-spot-popup.test.js`
- Modify: `js/map.js:24-52`
- Modify: `index.html` 지도 스크립트 캐시 버전

**Interfaces:**
- Consumes: `S.SPOTS`의 `{ nm, kind, ll, imgs? }` 객체와 Leaflet `map`, `L.marker`, `L.popup`
- Produces: `openSpotPopup(spot, ll, name)` 함수 및 스팟 마커의 `click` 이벤트 연결

- [ ] **Step 1: 지도 마커 클릭 회귀 테스트 작성**

`tests/map-spot-popup.test.js`에서 Node의 `vm`으로 실제 `js/map.js`를 실행한다. 최소 DOM·Leaflet 테스트 하네스를 제공하고 스팟 마커의 클릭 핸들러를 실행해 열린 팝업 콘텐츠를 검사한다.

핵심 검증은 다음과 같다.

```js
test('clicking a spot marker opens its photo popup', () => {
  const h = loadMap([
    { nm:'그로토', kind:'프리다이빙', ll:[15.2604,145.8239], imgs:['./img/hero-grotto.jpg'] },
  ]);
  const marker = h.spotMarkers[0];

  marker.fire('click');

  assert.match(h.lastPopup.content, /spot-pop-slide/);
  assert.match(h.lastPopup.content, /hero-grotto\.jpg/);
  assert.match(h.lastPopup.content, /그로토/);
});

test('clicking a spot without photos opens a name-only popup', () => {
  const h = loadMap([
    { nm:'피나탕 파크', kind:'복합', ll:[14.1469,145.1429] },
  ]);

  h.spotMarkers[0].fire('click');

  assert.doesNotMatch(h.lastPopup.content, /spot-pop-slide/);
  assert.match(h.lastPopup.content, /피나탕 파크/);
});
```

테스트 하네스의 `FakeMarker.fire(type)`은 실제로 `marker.on(type, handler)`에 등록된 핸들러만 호출한다. 따라서 현재 코드에서는 `click` 핸들러가 없어 명확하게 실패해야 한다.

- [ ] **Step 2: 회귀 테스트가 현재 코드에서 실패하는지 확인**

Run:

```powershell
node --test tests/map-spot-popup.test.js
```

Expected: `No handler registered for click` 메시지와 함께 2개 테스트 실패.

- [ ] **Step 3: 공통 팝업 함수와 마커 클릭 연결 구현**

`js/map.js`에서 기존 `S.flySpot` 내부 팝업 코드를 다음 형태의 공통 함수로 추출한다.

```js
function openSpotPopup(spot, ll, name){
  const imgs = (spot && spot.imgs) || [];
  let content = '';
  if (imgs.length){
    content += '<div class="spot-pop-slide" data-i="0">' +
      imgs.map((src,i) => '<img src="'+src+'" alt="'+name+'"'+(i ? ' hidden' : '')+'>').join('') +
      (imgs.length > 1 ? '<button type="button" class="sp-prev" aria-label="이전 사진">‹</button><button type="button" class="sp-next" aria-label="다음 사진">›</button><span class="sp-count">1/'+imgs.length+'</span>' : '') +
      '</div>';
  }
  content += '<div class="spot-pop-nm">'+name+'</div>';
  L.popup({ offset:[0,-8], className:'spot-pop', maxWidth:imgs.length ? 240 : 180 })
    .setLatLng(ll).setContent(content).openOn(map);
}
```

스팟 마커 생성 경로는 팝업 함수를 직접 연결한다.

```js
S.SPOTS.forEach(s => {
  L.marker(s.ll, { icon:spotIcon })
    .bindTooltip(s.nm + ' · ' + s.kind, { className:'stop-tip', direction:'top', offset:[0,-8] })
    .on('click', () => openSpotPopup(s, s.ll, s.nm))
    .addTo(spotsLayer);
});
```

`S.flySpot`은 기존 `flyTo` 다음에 같은 공통 함수를 호출한다.

```js
S.flySpot = function(ll, name){
  if (!map.hasLayer(spotsLayer)){ map.addLayer(spotsLayer); spotsBtn.classList.add('on'); }
  map.flyTo(ll, 14, { duration:.9 });
  const spot = (S.SPOTS || []).find(s => s.nm === name);
  openSpotPopup(spot, ll, name);
};
```

브라우저 캐시가 이전 `map.js`를 재사용하지 않도록 `index.html`의 `map.js` 버전을 `v=9`로 올린다.

- [ ] **Step 4: 회귀 테스트와 정적 검증 실행**

Run:

```powershell
node --test tests/map-spot-popup.test.js
node --check js/map.js
git diff --check
```

Expected: 테스트 2개 통과, 문법 오류 없음, 공백 오류 없음.

- [ ] **Step 5: 실제 브라우저에서 사진 유무 경로 확인**

로컬 정적 서버로 페이지를 열고 다음을 확인한다.

1. 🤿 스팟 레이어를 켠다.
2. 그로토 마커를 클릭한다.
3. 사진, 이름, 다중 사진 이전·다음 버튼이 나타나는지 확인한다.
4. 피나탕 파크 마커를 클릭한다.
5. 이름은 나타나고 사진 영역은 없는지 확인한다.
6. 스팟 가이드의 `지도에서 보기` 버튼도 기존처럼 이동 후 팝업을 여는지 확인한다.

- [ ] **Step 6: 구현 커밋**

```powershell
git add -- tests/map-spot-popup.test.js js/map.js index.html
git commit -m "Show photos when clicking map spot markers"
```
