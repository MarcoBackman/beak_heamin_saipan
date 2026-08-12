const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const trackerPath = path.join(__dirname, '..', 'js', 'geolocation.js');

class FakeNode {
  constructor() {
    this.attributes = new Map();
    this.dataset = {};
    this.handlers = {};
    this.hidden = true;
    this.textContent = '';
  }

  addEventListener(type, handler) {
    this.handlers[type] = handler;
  }

  click() {
    this.handlers.click({ currentTarget: this });
  }

  getAttribute(name) {
    return this.attributes.get(name);
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }
}

function position(lat, lng, accuracy, heading) {
  return { coords: { latitude: lat, longitude: lng, accuracy, heading } };
}

function loadTracker({ supported = true, secure = true } = {}) {
  const source = fs.readFileSync(trackerPath, 'utf8');
  const locationButton = new FakeNode();
  const locationStatus = new FakeNode();
  const watchCalls = [];
  const mapUpdates = [];
  const clearedWatches = [];
  let focusCalls = 0;
  let clearLocationCalls = 0;
  const documentHandlers = {};
  const SAIPAN = {
    clearUserLocation() { clearLocationCalls += 1; },
    focusUserLocation() { focusCalls += 1; return true; },
    setUserLocation(location, options) { mapUpdates.push({ location, options }); },
  };
  const document = {
    visibilityState: 'visible',
    addEventListener(type, handler) { documentHandlers[type] = handler; },
    getElementById(id) {
      if (id === 'locationToggle') return locationButton;
      if (id === 'locationStatus') return locationStatus;
      return null;
    },
  };
  const navigator = supported ? {
    geolocation: {
      clearWatch(id) { clearedWatches.push(id); },
      watchPosition(success, error, options) {
        watchCalls.push({ success, error, options });
        return 41;
      },
    },
  } : {};
  const window = { SAIPAN, isSecureContext: secure };

  vm.runInNewContext(source, { console, document, navigator, window }, { filename: 'js/geolocation.js' });
  return {
    clearedWatches,
    document,
    documentHandlers,
    get clearLocationCalls() { return clearLocationCalls; },
    get focusCalls() { return focusCalls; },
    locationButton,
    locationStatus,
    mapUpdates,
    SAIPAN,
    watchCalls,
  };
}

test('starts watching only after a tap and focuses the first GPS fix', () => {
  const h = loadTracker();

  assert.equal(h.watchCalls.length, 0);
  h.locationButton.click();
  assert.deepEqual({ ...h.watchCalls[0].options }, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  });

  h.watchCalls[0].success(position(15.21, 145.75, 12, 90));

  assert.deepEqual({ ...h.mapUpdates[0].location }, {
    lat: 15.21,
    lng: 145.75,
    accuracy: 12,
    heading: 90,
  });
  assert.deepEqual({ ...h.mapUpdates[0].options }, { focus: true });
  assert.equal(h.locationButton.getAttribute('aria-pressed'), 'true');
  assert.equal(h.locationButton.dataset.state, 'tracking');
  assert.equal(h.locationButton.getAttribute('aria-label'), '현재 위치로 이동');

  h.watchCalls[0].success(position(15.22, 145.76, 9, null));
  assert.equal(h.mapUpdates.length, 2);
  assert.deepEqual({ ...h.mapUpdates[1].options }, { focus: false });
});

test('a second tap while tracking recenters without starting another watch', () => {
  const h = loadTracker();
  h.locationButton.click();
  h.watchCalls[0].success(position(15.21, 145.75, 12, null));

  h.locationButton.click();

  assert.equal(h.watchCalls.length, 1);
  assert.equal(h.focusCalls, 1);
  assert.match(h.locationStatus.textContent, /현재 위치로 이동/);
});

test('permission denial clears tracking and explains how to recover', () => {
  const h = loadTracker();
  h.locationButton.click();

  h.watchCalls[0].error({ code: 1 });

  assert.deepEqual(h.clearedWatches, [41]);
  assert.equal(h.clearLocationCalls, 1);
  assert.equal(h.locationButton.dataset.state, 'denied');
  assert.equal(h.locationButton.getAttribute('aria-pressed'), 'false');
  assert.equal(h.locationButton.getAttribute('aria-label'), '위치 권한 설정 안내');
  assert.match(h.locationStatus.textContent, /브라우저 설정/);

  h.locationButton.click();
  assert.equal(h.watchCalls.length, 1);
  assert.match(h.locationStatus.textContent, /브라우저 설정/);
});

test('unsupported or insecure geolocation reports an unavailable state', () => {
  const unsupported = loadTracker({ supported: false });
  assert.equal(unsupported.locationButton.disabled, true);
  assert.equal(unsupported.locationButton.dataset.state, 'unavailable');
  assert.match(unsupported.locationStatus.textContent, /지원하지 않/);

  const insecure = loadTracker({ secure: false });
  assert.equal(insecure.locationButton.disabled, true);
  assert.match(insecure.locationStatus.textContent, /HTTPS/);
});

test('overlay close and page hide clear the active watch and marker', () => {
  const closed = loadTracker();
  closed.locationButton.click();
  closed.SAIPAN.stopLocationTracking();
  assert.deepEqual(closed.clearedWatches, [41]);
  assert.equal(closed.clearLocationCalls, 1);
  assert.equal(closed.locationButton.dataset.state, 'idle');

  const hidden = loadTracker();
  hidden.locationButton.click();
  hidden.document.visibilityState = 'hidden';
  hidden.documentHandlers.visibilitychange();
  assert.deepEqual(hidden.clearedWatches, [41]);
  assert.equal(hidden.clearLocationCalls, 1);
});
