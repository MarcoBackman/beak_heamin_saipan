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
