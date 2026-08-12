const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const overlaySource = fs.readFileSync(path.join(__dirname, '..', 'js', 'map-overlay.js'), 'utf8');

class FakeNode {
  constructor() {
    this.children = [];
    this.className = '';
    this.handlers = {};
  }
  addEventListener(type, handler) { this.handlers[type] = handler; }
  appendChild(child) { this.children.push(child); }
  click() { this.handlers.click(); }
  querySelector() { return this; }
  setAttribute() {}
}

test('closing the mobile map overlay stops location tracking', () => {
  let stopCalls = 0;
  const body = new FakeNode();
  body.classList = {
    add() {},
    remove() {},
  };
  const mapSide = new FakeNode();
  const created = [];
  const document = {
    body,
    createElement() { const node = new FakeNode(); created.push(node); return node; },
    getElementById(id) { return id === 'mapSide' ? mapSide : null; },
  };
  const SAIPAN = {
    onDayChange(callback) { callback(0); },
    stopLocationTracking() { stopCalls += 1; },
  };
  const mediaHandlers = {};
  const window = {
    SAIPAN,
    matchMedia() {
      return { addEventListener(type, handler) { mediaHandlers[type] = handler; } };
    },
  };

  vm.runInNewContext(overlaySource, {
    IntersectionObserver: class { observe() {} },
    document,
    requestAnimationFrame(callback) { callback(); },
    window,
  }, { filename:'js/map-overlay.js' });

  const closeButton = created.find(node => node.className === 'map-overlay-close');
  closeButton.click();

  assert.equal(stopCalls, 1);
});
