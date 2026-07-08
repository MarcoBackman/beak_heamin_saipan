---
title: 날씨 연출 미표시 버그 — 레이어 클리핑·캔버스 리사이즈 수정
type: decision
status: active
project: shared
summary: .wx-layer가 콘텐츠 승격 규칙에 덮여 높이 0으로 클리핑되던 근본 원인을 :not() 제외로 수정하고, 접힘 펼침 시 캔버스가 카드 높이를 못 따라가는 문제를 ResizeObserver로 수정
keywords: [weather, css-specificity, wx-layer, canvas, resize-observer, mobile]
sources: [css/weather.css, js/weather.js, index.html]
updated: 2026-07-08
---

## 요약

배포 후 모바일에서 날씨 배경 애니메이션이 전혀 보이지 않는다는 리포트. 원인은 두 가지 —
① `article.day[data-wx] > *`(특이성 0,2,1)가 `.wx-layer`(0,1,0)의 `position:absolute`를
덮어써 레이어가 `position:relative`·높이 0·`overflow:hidden`이 되면서 캔버스·구름·광선이
전부 클리핑됨(모바일뿐 아니라 데스크톱도 동일하게 깨져 있었음 — 배지·틴트만 보여 미발견).
② weather.js의 캔버스 리사이즈가 `window resize`에만 반응해, 모바일 접힘(쇼츠·참고·앨범)
펼침으로 카드 높이가 커져도(실측 1208→2187px) 캔버스가 고정돼 하단에 비가 안 내림.

## 배경

- headless Chrome(puppeteer-core) 실측으로 8개 카드 전부 `.wx-layer` computed
  `position:relative / z-index:1 / height:0` 확인 — 재현 확증 후 수정.
- 콘솔의 Open-Meteo 400 응답은 예보 범위 밖(7월에 9월 요청) 정상 폴백 경로로, 결함 아님.

## 결정

1. `article.day[data-wx] > *:not(.wx-layer)`로 콘텐츠 승격 규칙에서 레이어를 제외 —
   레이어는 원래 의도(`absolute / inset:0 / z-index:0`)를 회복.
2. `rainEngine`의 리사이즈를 `ResizeObserver(art)`로 교체(미지원 브라우저만 window
   resize 폴백) — 접힘 펼침·이미지 로드 등 카드 자체 높이 변화를 모두 추적.
3. 캐시 버전 weather.css·weather.js `?v=3`.

## 대안

- `.wx-layer` 쪽 특이성을 올리는 방식(`article.day[data-wx] > .wx-layer`) — 동작은 같지만
  "콘텐츠만 승격"이라는 규칙의 의도를 규칙 자체에 남기는 `:not()` 제외가 더 자명해 채택.
- fold-toggle 클릭 시 수동으로 resize 호출 — 접힘 외 높이 변화(이미지 지연 로드 등)를
  놓치므로 기각. ResizeObserver가 일반해.

## 트레이드오프

- ResizeObserver 콜백은 크기 변화 시 방울을 재생성해 순간적으로 패턴이 바뀌지만,
  변화가 이산적(접힘 토글)이라 체감 없음. 디바운스는 YAGNI로 미도입.

## 검증

- 390px: 4테마 전부 렌더(비 줄기·뇌우 틴트+굵은 비·구름 드리프트·광원), 접힘 펼침 후
  캔버스 2187/2187 추적, 배지 8개.
- 1280px 회귀: 2컬럼 레이아웃·FAB 숨김·캔버스 정상.
- reduced-motion: 캔버스 미생성, 배지 유지. 콘솔 JS 에러 0.
