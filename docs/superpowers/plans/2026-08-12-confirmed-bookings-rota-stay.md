# Confirmed Bookings and Rota Stay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete lodging comparison with an unambiguous confirmed-bookings dashboard and an actionable Rota one-night booking workflow.

**Architecture:** Keep the site static and render all booking facts directly in `index.html`. Add focused component styles in `css/components.css`, reuse the existing two-column-to-one-column responsive grid, and protect the content contract with a Node static-markup test. Remove the lodging calculator script because confirmed reservations no longer require client-side comparison state.

**Tech Stack:** Static HTML5, CSS Grid/Flexbox, vanilla JavaScript, Node.js built-in test runner.

## Global Constraints

- Kensington Hotel Saipan is confirmed for check-in 2026-09-10 and check-out 2026-09-17, seven nights, with the room retained during the Rota night.
- Enterprise is confirmed from 2026-09-11 02:30 to 2026-09-17 02:30 for six days at USD 268.05 due on arrival.
- The public page must not expose the driver's personal contact details or full Enterprise reservation number.
- Rota lodging is not booked; label 2026-08-16 as the internal recommended booking date and 2026-08-23 as the internal final decision date, not hotel policy.
- Do not display a fixed Rota room price or fixed free-cancellation deadline because both vary by room and query time.
- Do not add dependencies or a new client-side lodging selection state.

---

### Task 1: Lock the booking-status content contract

**Files:**
- Create: `tests/booking-status.test.js`
- Test: `tests/booking-status.test.js`

**Interfaces:**
- Consumes: Static UTF-8 contents of `index.html`, `css/components.css`, and the existence of `js/stay-calc.js`.
- Produces: A Node test contract for required confirmation facts, Rota booking actions, privacy, and removal of obsolete lodging comparison UI.

- [ ] **Step 1: Write the failing static-markup tests**

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css', 'components.css'), 'utf8');

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
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `node --test tests/booking-status.test.js`

Expected: FAIL because the old comparison and `js/stay-calc.js` still exist and the new booking markup/classes do not.

- [ ] **Step 3: Commit the failing test**

```bash
git add tests/booking-status.test.js
git commit -m "test: define confirmed booking status contract"
```

### Task 2: Replace the lodging comparison with reservation status cards

**Files:**
- Modify: `index.html:21-28,103-124,171-320,527-590,798-815`
- Modify: `css/components.css:79-179`
- Modify: `css/responsive.css:115-145`
- Delete: `js/stay-calc.js`
- Test: `tests/booking-status.test.js`

**Interfaces:**
- Consumes: Existing page anchors, `.choice-card`, `.note`, and `[data-tabs]` behavior.
- Produces: `#booking-status`, `.booking-status-grid`, `.booking-card`, `.booking-state`, `.booking-deadlines`, `.rota-options`, and `.booking-steps` static UI; preserves `#transport` as the detailed rental section.

- [ ] **Step 1: Replace the navigation label and stay section markup**

Change the navigation link to:

```html
<a href="#booking-status">예약 현황</a>
```

Replace the whole former `#staycompare` section with:

```html
<section id="booking-status">
  <h2>예약 현황</h2>
  <p class="lede">확정된 예약과 아직 처리해야 할 로타 1박을 한곳에서 확인합니다.</p>
  <div class="booking-status-grid">
    <article class="booking-card confirmed">
      <span class="booking-state">예약 확정</span>
      <h3>켄싱턴 호텔 사이판 · 7박</h3>
      <p class="booking-dates">2026. 9. 10 체크인 → 2026. 9. 17 체크아웃</p>
      <ul>
        <li>로타 1박 중에도 객실 유지</li>
        <li>큰 짐·롱핀·대여 웨이트·부이는 객실 보관</li>
      </ul>
    </article>
    <article class="booking-card confirmed">
      <span class="booking-state">예약 확정</span>
      <h3>Enterprise 렌터카 · 6일</h3>
      <p class="booking-dates">9/11 02:30 → 9/17 02:30</p>
      <ul>
        <li>Intermediate SUV · 무제한 주행</li>
        <li>$268.05 현장 결제 · CDW·PAI 포함</li>
      </ul>
      <a class="booking-action secondary" href="#transport">면허·보험·인수 조건 보기</a>
    </article>
    <article class="booking-card pending">
      <span class="booking-state">예약 필요</span>
      <h3>로타 숙소 · 1박</h3>
      <p class="booking-dates">9/12 체크인 → 9/13 체크아웃 · 성인 2명</p>
      <div class="booking-deadlines">
        <span><b>8/16</b> 권장 예약</span>
        <span><b>8/23</b> 최종 결정</span>
      </div>
      <small>호텔 공식 마감일이 아닌 내부 실행 기준</small>
    </article>
  </div>
</section>
```

- [ ] **Step 2: Add the two Rota candidates and five booking steps**

Inside `#booking-status`, after the status grid, add two `.rota-option` articles with dated Booking.com URLs for 2026-09-12 to 2026-09-13 and phone links `tel:+16705328466` and `tel:+16705323201`. Use visible advantages `송송 중심·식당 접근` for Hotel Valentino and `해변 접근·조용한 환경` for Coral Garden Hotel. Add a warning that live price and cancellation terms must be checked on the final booking screen.

Add this five-step list:

```html
<ol class="booking-steps">
  <li><b>1</b><span>9/12–9/13 · 성인 2명으로 객실 조회</span></li>
  <li><b>2</b><span>무료 취소 가능 여부와 결제 시점을 확인하고 요금 선택</span></li>
  <li><b>3</b><span>로타 도착 예정 시각을 숙소에 전달</span></li>
  <li><b>4</b><span>예약 바우처와 숙소 연락처를 오프라인 저장</span></li>
  <li><b>5</b><span>공항·로타 홀 투어 픽업 동선과 체크아웃 시각 확인</span></li>
</ol>
```

- [ ] **Step 3: Add focused desktop and mobile styles**

Add styles for a three-column `.booking-status-grid`, state-colored `.booking-card.confirmed` and `.booking-card.pending`, pill `.booking-state`, two-column `.rota-options`, underlined `.booking-action`, compact `.booking-deadlines`, and five-column `.booking-steps`. At `max-width: 768px`, reduce status and option grids to one column and make `.booking-steps` one column. Do not alter the existing rental `.stay-tabs` styles.

- [ ] **Step 4: Remove obsolete calculator assets**

Remove the `<script defer src="./js/stay-calc.js?v=2"></script>` tag, delete `js/stay-calc.js`, and remove `.calc-fields`, `.totals`, and `.total-card` CSS rules that no remaining markup uses. Keep `.stay-tabs`, `.stay-tab`, `.stay-panel`, `.pros-cons`, and `.reservation-grid` because the Enterprise section uses them.

- [ ] **Step 5: Run the booking-status test**

Run: `node --test tests/booking-status.test.js`

Expected: PASS for all three tests.

- [ ] **Step 6: Commit the booking dashboard**

```bash
git add index.html css/components.css css/responsive.css js/stay-calc.js tests/booking-status.test.js
git commit -m "feat: show confirmed bookings and Rota reservation actions"
```

### Task 3: Connect the Rota reservation to checklist and itinerary

**Files:**
- Modify: `index.html:103-124,527-590`
- Modify: `tests/booking-status.test.js`
- Test: `tests/booking-status.test.js`

**Interfaces:**
- Consumes: Existing checklist persistence by `data-k` and static Day 3/Day 4 schedules.
- Produces: New stable checklist key `rota-stay-booked`; Day 3 arrival instruction and Day 4 checkout instruction consistent with the booking workflow.

- [ ] **Step 1: Extend the failing test with checklist and itinerary assertions**

```js
test('connects the Rota booking workflow to preparation and itinerary', () => {
  assert.match(html, /data-k="rota-stay-booked"/);
  assert.match(html, /로타 숙소 9\/12–9\/13 1박 예약 완료/);
  assert.match(html, /예약 바우처·숙소 연락처 확인 후 체크인/);
  assert.match(html, /숙소 체크아웃 시각 재확인/);
});
```

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `node --test --test-name-pattern="connects the Rota" tests/booking-status.test.js`

Expected: FAIL because the new checklist key and schedule copy do not exist.

- [ ] **Step 3: Add the persisted checklist item**

Add this item immediately before the existing stay voucher item:

```html
<li><label><input type="checkbox" data-k="rota-stay-booked"><span>로타 숙소 9/12–9/13 1박 예약 완료</span></label></li>
```

The existing `js/checklist.js` automatically persists it because it binds all `#checkItems` checkboxes by `data-k`; no JavaScript change is needed.

- [ ] **Step 4: Update Day 3 and Day 4 schedule copy**

Use these exact schedule descriptions:

```html
<li><span class="time">도착 후</span><span>예약 바우처·숙소 연락처 확인 후 체크인, 로타 홀 투어 픽업 장소 재확인</span></li>
```

```html
<li><span class="time">오전</span><span>숙소 체크아웃 시각 재확인 → 테테토 비치에서 여유로운 아침 바다 수영</span></li>
```

- [ ] **Step 5: Run targeted and complete tests**

Run: `node --test tests/booking-status.test.js`

Expected: PASS for all four tests.

Run: `node --test tests/*.test.js`

Expected: PASS for booking status, gear selection, map popup, rental route coverage, and section tabs.

- [ ] **Step 6: Commit the itinerary integration**

```bash
git add index.html tests/booking-status.test.js
git commit -m "feat: connect Rota lodging deadline to itinerary"
```

### Task 4: Verify visual behavior and merge locally

**Files:**
- Verify: `index.html`
- Verify: `css/components.css`
- Verify: `css/responsive.css`
- Verify: `tests/booking-status.test.js`

**Interfaces:**
- Consumes: Completed static page and tests from Tasks 1–3.
- Produces: Verified implementation branch merged into local `main` with a clean worktree.

- [ ] **Step 1: Run static and repository-wide verification**

Run: `node --test tests/*.test.js`

Expected: All tests pass with zero failures.

Run: `rg -n "옵션 B|비용 계산기|calcRate|stay-calc" index.html css js tests`

Expected: No matches except intentional negative assertions in `tests/booking-status.test.js`; verify those matches manually.

Run: `git diff --check main...HEAD`

Expected: No whitespace errors.

- [ ] **Step 2: Inspect desktop layout**

Serve the repository locally and open `index.html` at 1280×900. Verify the three status cards align, the two Rota options have working online/phone actions, the deadlines are explicitly internal, the Enterprise detail tabs still switch panels, and no horizontal overflow appears.

- [ ] **Step 3: Inspect mobile layout**

At 390×844, verify status cards, Rota options, deadlines, and five steps stack into one column; links remain tappable; nav `예약 현황` reaches the correct section; and the page has no horizontal overflow.

- [ ] **Step 4: Review branch diff**

Run: `git diff --stat main...HEAD` and `git diff main...HEAD -- index.html css/components.css css/responsive.css tests/booking-status.test.js`.

Expected: Only the approved booking-status, Rota workflow, tests, and removal of the lodging calculator are present.

- [ ] **Step 5: Merge the verified branch into local main**

Switch to `main`, confirm the worktree is clean, merge the implementation branch with `--no-ff`, and rerun `node --test tests/*.test.js` on the merged result. Do not push to a remote.
