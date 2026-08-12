const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const overlaySource = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-overlay.js'), 'utf8');

class FakeClassList {
  constructor() { this.values = new Set(); }
  add(value) { this.values.add(value); }
  contains(value) { return this.values.has(value); }
  remove(value) { this.values.delete(value); }
  toggle(value, force) {
    if (force === true) this.values.add(value);
    else if (force === false) this.values.delete(value);
    else if (this.values.has(value)) this.values.delete(value);
    else this.values.add(value);
  }
}

class FakeNode {
  constructor() {
    this.attributes = new Map();
    this.children = [];
    this.classList = new FakeClassList();
    this.className = '';
    this.focusCalls = 0;
    this.handlers = {};
    this.hidden = false;
    this.ownerDocument = null;
  }
  addEventListener(type, handler) { this.handlers[type] = handler; }
  appendChild(child) { this.children.push(child); }
  click() { return this.handlers.click(); }
  focus() {
    if (this.hidden || this.classList.contains('hidden')) return;
    this.focusCalls += 1;
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }
  getAttribute(name) { return this.attributes.get(name); }
  querySelector() { return this; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
}

function loadOverlay({ fullscreenSupported = true, fullscreenElement = false } = {}) {
  let exitFullscreenCalls = 0;
  let requestFullscreenCalls = 0;
  let stopCalls = 0;
  const body = new FakeNode();
  const mapSide = new FakeNode();
  const created = [];
  const documentHandlers = {};
  const document = {
    activeElement: null,
    body,
    fullscreenElement: fullscreenElement ? mapSide : null,
    addEventListener(type, handler) { documentHandlers[type] = handler; },
    createElement() {
      const node = new FakeNode();
      node.ownerDocument = this;
      created.push(node);
      return node;
    },
    exitFullscreen() { exitFullscreenCalls += 1; this.fullscreenElement = null; return Promise.resolve(); },
    getElementById(id) { return id === 'mapSide' ? mapSide : null; },
  };
  body.ownerDocument = document;
  mapSide.ownerDocument = document;
  if (fullscreenSupported) {
    mapSide.requestFullscreen = () => {
      requestFullscreenCalls += 1;
      return Promise.resolve();
    };
  }
  const SAIPAN = {
    invalidateMap() {},
    onDayChange(callback) { callback(0); },
    stopLocationTracking() { stopCalls += 1; },
  };
  const window = {
    SAIPAN,
    matchMedia() { return { addEventListener() {} }; },
  };

  vm.runInNewContext(overlaySource, {
    IntersectionObserver: class { observe() {} },
    document,
    requestAnimationFrame(callback) { callback(); },
    window,
  }, { filename:'js/map-overlay.js' });

  return {
    body,
    closeButton: created.find(node => node.className === 'map-overlay-close'),
    document,
    fireDocument(type) { documentHandlers[type](); },
    fullscreenButton: created.find(node => node.className === 'map-fullscreen-toggle'),
    fab: created.find(node => node.className.includes('map-fab')),
    get exitFullscreenCalls() { return exitFullscreenCalls; },
    mapSide,
    get requestFullscreenCalls() { return requestFullscreenCalls; },
    get stopCalls() { return stopCalls; },
  };
}

test('fullscreen toggle enters and exits browser fullscreen', async () => {
  const h = loadOverlay({ fullscreenSupported:true });

  await h.fullscreenButton.click();
  assert.equal(h.requestFullscreenCalls, 1);

  h.document.fullscreenElement = h.mapSide;
  h.fireDocument('fullscreenchange');
  assert.equal(h.fullscreenButton.getAttribute('aria-pressed'), 'true');
  assert.equal(h.fullscreenButton.getAttribute('aria-label'), '전체화면 종료');

  await h.fullscreenButton.click();
  assert.equal(h.exitFullscreenCalls, 1);
});

test('unsupported fullscreen hides only the system fullscreen button', () => {
  const h = loadOverlay({ fullscreenSupported:false });

  assert.equal(h.fullscreenButton.hidden, true);
  h.fab.click();
  assert.equal(h.body.classList.contains('map-open'), true);
});

test('closing the map stops GPS, exits fullscreen and restores launcher focus', async () => {
  const h = loadOverlay({ fullscreenSupported:true, fullscreenElement:true });
  h.document.activeElement = h.fab;
  h.fab.click();
  h.fab.classList.add('hidden');

  await h.closeButton.click();

  assert.equal(h.stopCalls, 1);
  assert.equal(h.exitFullscreenCalls, 1);
  assert.equal(h.body.classList.contains('map-open'), false);
  assert.equal(h.fab.focusCalls, 1);
  assert.equal(h.document.activeElement, h.fab);
});
