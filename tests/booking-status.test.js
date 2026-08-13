const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const itineraryData = fs.readFileSync(path.join(root, 'js', 'data.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'components.css'), 'utf8');
const responsiveCss = fs.readFileSync(path.join(root, 'css', 'responsive.css'), 'utf8');

test('shows Kensington and Enterprise as confirmed reservations', () => {
  assert.match(html, /예약 현황/);
  assert.match(html, /2026\. 9\. 10[^<]*체크인/);
  assert.match(html, /2026\. 9\. 17[^<]*체크아웃/);
  assert.match(html, /로타 1박 중에도 객실 유지/);
  assert.match(html, /9\/11 02:30[^<]*9\/17 02:30/);
  assert.match(html, /\$268\.05/);
  assert.match(html, /무제한 주행/);
});

test('shows Rota booking candidates and internal deadlines', () => {
  assert.match(html, /Hotel Valentino/);
  assert.match(html, /Coral Garden Hotel/);
  assert.match(html, /8\/16[^<]*권장 예약/);
  assert.match(html, /8\/23[^<]*최종 결정/);
  assert.match(html, /호텔 공식 마감일이 아닌 내부 실행 기준/);
  assert.match(html, /booking\.com\/hotel\/mp\/valentino/);
  assert.match(html, /booking\.com\/hotel\/mp\/coral-garden/);
  assert.match(html, /tel:\+16705328466/);
  assert.match(html, /tel:\+16705323201/);
});

test('removes the obsolete stay comparison and protects private data', () => {
  assert.doesNotMatch(html, /옵션 B|비용 계산기|calcRate|stay-calc\.js/);
  assert.equal(fs.existsSync(path.join(root, 'js', 'stay-calc.js')), false);
  assert.doesNotMatch(html, /1396542991|uj02013@naver\.com|1087653566/);
  assert.match(css, /\.booking-status-grid/);
  assert.match(css, /\.booking-steps/);
});

test('connects the Rota booking workflow to preparation and itinerary', () => {
  assert.match(html, /data-k="rota-stay-booked"/);
  assert.match(html, /로타 숙소 9\/12–9\/13 1박 예약 완료/);
  assert.match(html, /예약 바우처·숙소 연락처 확인 후 체크인/);
  assert.match(html, /숙소 체크아웃 시각 재확인/);
});

test('ships the mobile booking layout with a fresh cache version', () => {
  assert.match(html, /css\/responsive\.css\?v=6/);
  assert.match(html, /js\/data\.js\?v=14/);
  assert.match(responsiveCss, /\.booking-status-grid,\.rota-options,\.booking-steps\{grid-template-columns:1fr\}/);
});

test('uses KT M Mobile guidance for Hyemin across the checklist and itinerary', () => {
  assert.match(html, /혜민 KT M모바일 · 함께 쓰는 로밍 4GB 신청/);
  assert.match(html, /KT M모바일 · 함께 쓰는 로밍 4GB/);
  assert.match(html, /KT M모바일 홈페이지·앱에서 출국 전 신청/);
  assert.match(html, /href="https:\/\/www\.ktmmobile\.com\/rate\/roamingList\.do"[^>]*>KT M모바일 공식 안내 →<\/a>/);
  assert.match(html, /혜민은 KT M모바일 4GB/);
  assert.match(itineraryData, /아내 KT M모바일 함께 쓰는 로밍 4GB 신청/);
  assert.match(itineraryData, /SKT\/KT M모바일 로밍/);
  assert.doesNotMatch(html, /혜민 KT ·|KT 앱에서 출국 전 신청|혜민은 KT 4GB/);
  assert.doesNotMatch(itineraryData, /아내 KT 함께 쓰는|SKT\/KT 로밍/);
});
