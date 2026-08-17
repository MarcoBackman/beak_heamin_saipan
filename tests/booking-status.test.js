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

test('shows the confirmed Coral Garden Hotel booking without private credentials', () => {
  assert.match(html, /Coral Garden Hotel/);
  assert.match(html, /9\/12 13:00–16:30[^<]*9\/13 07:30–12:00/);
  assert.match(html, /총 US\$74\.75/);
  assert.match(html, /12:00–13:00[^<]*도착 예정 전달 완료/);
  assert.match(html, /https:\/\/www\.coralgardenhotel\.com\//);
  assert.match(html, /tel:\+16705323201/);
  assert.doesNotMatch(html, /Hotel Valentino|8\/16[^<]*권장 예약|8\/23[^<]*최종 결정/);
  assert.doesNotMatch(html, /예약번호\s*:|PIN\s*:/i);
});

test('pins a realistic Rota flight and airport rental plan', () => {
  assert.match(html, /S2 1302/);
  assert.match(html, /10:30<\/b> 사이판 공항 커뮤터 터미널 출발/);
  assert.match(html, /S2 3104/);
  assert.match(html, /16:30<\/b> 로타 공항 출발/);
  assert.match(html, /11:50–12:20[^<]*호텔 도착/);
  assert.match(html, /Budget \+1 670-532-3535/);
  assert.match(html, /Islander \+1 670-532-0901/);
  assert.match(html, /starmarianasair\.com\/bookscheduledflight/);
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
  assert.match(html, /data-k="rota-flight-booked"/);
  assert.match(html, /data-k="rota-car-booked"/);
  assert.match(html, /Coral Garden Hotel 9\/12–9\/13 1박 예약 확정/);
  assert.match(html, /예약 바우처·숙소 연락처 확인 후 체크인/);
  assert.match(html, /공식 체크아웃 가능 시간 07:30~12:00/);
  assert.match(itineraryData, /S2 1302 출발/);
  assert.match(itineraryData, /S2 3104 출발/);
  assert.match(itineraryData, /Coral Garden Hotel 도착/);
});

test('ships the mobile booking layout with a fresh cache version', () => {
  assert.match(html, /css\/responsive\.css\?v=6/);
  assert.match(html, /js\/data\.js\?v=15/);
  assert.match(responsiveCss, /\.booking-status-grid,\.rota-options,\.booking-steps\{grid-template-columns:1fr\}/);
});

test('adds a source-grounded G-CNMI ETA and customs application guide', () => {
  assert.match(html, /id="entry-guide"/);
  assert.match(html, /승준·혜민이 각각 1건씩 신청/);
  assert.match(html, /현재 신청 수수료 무료/);
  assert.match(html, /출발 최소 5일 전 제출 권장/);
  assert.match(html, /공식 예상 작성 시간 약 23분/);
  assert.match(html, /Kensington Hotel Saipan · P\.O\. Box 5152 CHRB, Saipan, MP 96950 · \+1 670-322-3311/);
  assert.match(html, /https:\/\/g-cnmi-eta\.cbp\.dhs\.gov\//);
  assert.match(html, /https:\/\/g-cnmi-eta\.cbp\.dhs\.gov\/individualStatusLookup/);
  assert.match(html, /https:\/\/landing\.travel\.mp\//);
});

test('tracks both individual ETA approvals and the family customs QR separately', () => {
  assert.match(html, /data-k="g-cnmi-eta-sungjun"/);
  assert.match(html, /data-k="g-cnmi-eta-hyemin"/);
  assert.match(html, /data-k="cnmi-customs"/);
  assert.match(html, /함께 입국하는 남편·아내는 가족 1건 제출 가능/);
  assert.match(html, /사이판 입국 72시간 전부터 작성/);
  assert.doesNotMatch(html, /여권번호\s*[:：]|신청 번호\s*[:：]/);
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
