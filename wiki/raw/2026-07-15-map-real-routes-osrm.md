---
title: 지도 동선을 OSRM 사전 조회 정적 데이터로 실제 도로 경로화
type: decision
status: active
project: shared
summary: 지도 직선 동선을 실제 도로 경로 + hover 소요시간 툴팁으로 바꾸되, 런타임 라우팅 API 대신 OSRM 결과를 정적 파일(js/routes.js)로 저장
keywords: [map, leaflet, osrm, routes, tooltip, travel-time]
sources: [js/routes.js, js/map.js, js/data.js, tools/fetch-routes.mjs, index.html, css/map.css]
updated: 2026-07-15
---

## 요약
일자별 지도 동선을 직선에서 실제 도로 경로로 바꾸고, 선 hover 시 예상 이동
소요시간(차량은 거리 포함)을 툴팁으로 표시한다. 경로 데이터는 OSRM에서 미리
받아 `js/routes.js` 정적 파일로 커밋한다.

## 배경
- 사이트는 GitHub Pages 정적 호스팅이고 여행 일정(경유지)이 고정돼 있다.
- 직선 동선은 "개략적 표시"라는 한계 문구가 필요했고, 구간별 소요시간 정보가 없었다.

## 결정
- drive 구간 14개를 OSRM 데모 서버(`router.project-osrm.org`)에서 1회 조회해
  `js/routes.js`(경로 좌표·초·미터)로 저장. 재생성 스크립트는 `tools/fetch-routes.mjs`.
- `map.js`는 drive 구간에 실측 경로를 그리고, 경로가 없으면 기존 직선으로 폴백.
- 얇은 선의 hover 판정을 위해 투명 히트라인(weight 18)을 겹쳐 sticky 툴팁 바인딩.
- fly·boat는 도로가 없으므로 기존 아치/점선을 유지하고, `data.js` stop에 `min`
  (예상 소요 분) 필드를 추가해 실제 스케줄 기반 값(인천→사이판 280분, 경비행기
  30분 등)을 표시.

## 대안
- **런타임 라우팅 API 호출 (OSRM/Mapbox/ORS)**: 배제 — 데모 서버 신뢰성·속도에
  페이지가 의존하게 되고, 유료 API는 키 노출 문제. 일정이 고정이라 매번 조회할
  이유가 없음.
- **Leaflet Routing Machine 플러그인**: 배제 — 위와 같은 런타임 의존 + 불필요한
  UI(경로 안내 패널)까지 딸려 옴.

## 트레이드오프
- 정적 저장이라 `data.js` 좌표가 바뀌면 `node tools/fetch-routes.mjs js/routes.js`로
  재생성해야 한다 (키가 좌표 기반이라 안 맞으면 직선 폴백으로 조용히 강등됨).
- routes.js 82KB 추가 — gzip으로 크게 줄고 정적 사이트라 수용.
