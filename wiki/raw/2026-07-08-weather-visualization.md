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
