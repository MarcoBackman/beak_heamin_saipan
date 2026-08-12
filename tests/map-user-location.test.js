const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const mapSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'map.js'), 'utf8');

function loadMap() {
  class FakeNode {
    constructor() {
      this.classList = { add() {}, remove() {}, toggle() {} };
      this.dataset = {};
      this.hidden = false;
      this.value = '';
    }
    addEventListener() {}
    appendChild() {}
    getBoundingClientRect() { return { left:0, top:0, right:0, bottom:0, width:0, height:0 }; }
    scrollIntoView() {}
  }

  class FakeLayerGroup {
    constructor() { this.layers = []; }
    addLayer(layer) { this.layers.push(layer); return this; }
    addTo(target) { target.addLayer(this); return this; }
    clearLayers() { this.layers.length = 0; return this; }
    removeLayer(layer) { this.layers = this.layers.filter(item => item !== layer); return this; }
  }

  class FakeMarker {
    constructor(ll, options) {
      this.ll = ll;
      this.options = options || {};
      this.handlers = {};
    }
    addTo(target) { target.addLayer(this); return this; }
    bindPopup() { return this; }
    bindTooltip() { return this; }
    on(type, handler) { this.handlers[type] = handler; return this; }
    setIcon(icon) { this.options.icon = icon; return this; }
    setLatLng(ll) { this.ll = ll; return this; }
  }

  class FakeCircle {
    constructor(ll, options) { this.ll = ll; this.options = options; }
    addTo(target) { target.addLayer(this); return this; }
    setLatLng(ll) { this.ll = ll; return this; }
    setRadius(radius) { this.options.radius = radius; return this; }
  }

  const layers = new Set();
  const handlers = {};
  const flyToCalls = [];
  const map = {
    addLayer(layer) { layers.add(layer); return this; },
    fire(type) { (handlers[type] || []).forEach(handler => handler()); },
    flyTo(...args) { flyToCalls.push(args); return this; },
    flyToBounds() { return this; },
    hasLayer(layer) { return layers.has(layer); },
    invalidateSize() { return this; },
    on(types, handler) {
      types.split(' ').forEach(type => {
        handlers[type] = handlers[type] || [];
        handlers[type].push(handler);
      });
      return this;
    },
    removeLayer(layer) { layers.delete(layer); return this; },
    setView() { return this; },
  };

  const nodes = new Map();
  const document = {
    body: new FakeNode(),
    createElement() { return new FakeNode(); },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, new FakeNode());
      return nodes.get(id);
    },
    querySelectorAll() { return []; },
  };

  const L = {
    circle(ll, options) { return new FakeCircle(ll, options); },
    control: { zoom() { return { addTo() {} }; } },
    divIcon(options) { return options; },
    layerGroup() { return new FakeLayerGroup(); },
    latLngBounds() { return { extend() {} }; },
    map() { return map; },
    marker(ll, options) { return new FakeMarker(ll, options); },
    polyline() {
      return {
        addTo() { return this; }, bindTooltip() { return this; }, on() { return this; }, setLatLngs() { return this; },
      };
    },
    popup() {
      return { setLatLng() { return this; }, setContent() { return this; }, openOn() { return this; } };
    },
    tileLayer() { return { addTo() {} }; },
  };

  const SAIPAN = {
    DAYS: [{ label:'Day 1', title:'테스트 일정', stops:[{ n:'호텔', ll:[15.2,145.75], mode:'drive' }] }],
    POIS: [],
    SPOTS: [],
  };
  const window = {
    SAIPAN,
    innerWidth: 390,
    matchMedia(query) { return { matches: query.includes('prefers-reduced-motion') || query.includes('max-width') }; },
  };

  vm.runInNewContext(mapSource, {
    IntersectionObserver: class { observe() {} },
    L,
    console,
    document,
    requestAnimationFrame(callback) { callback(); },
    setTimeout(callback) { callback(); },
    window,
  }, { filename:'js/map.js' });

  return { flyToCalls, layers, map, SAIPAN };
}

function userLayers(h) {
  const all = [...h.layers];
  return {
    circle: all.find(layer => layer instanceof Object && layer.options?.className === 'user-location-accuracy'),
    marker: all.find(layer => layer.options?.icon?.html?.includes('user-location-pin')),
  };
}

test('renders and updates a directional user marker with an accuracy circle', () => {
  const h = loadMap();
  h.SAIPAN.setUserLocation({ lat:15.21, lng:145.75, accuracy:25, heading:90 }, { focus:true });
  const first = userLayers(h);

  assert.deepEqual(Array.from(first.marker.ll), [15.21, 145.75]);
  assert.match(first.marker.options.icon.html, /--heading:90deg/);
  assert.equal(first.circle.options.radius, 25);

  h.SAIPAN.setUserLocation({ lat:15.22, lng:145.76, accuracy:8, heading:180 }, { focus:false });
  assert.deepEqual(Array.from(first.marker.ll), [15.22, 145.76]);
  assert.match(first.marker.options.icon.html, /--heading:180deg/);
  assert.equal(first.circle.options.radius, 8);
});

test('manual map drag stops following until the location button recenters', () => {
  const h = loadMap();
  h.SAIPAN.setUserLocation({ lat:15.21, lng:145.75, accuracy:12, heading:null }, { focus:true });
  assert.deepEqual(JSON.parse(JSON.stringify(h.flyToCalls.at(-1).slice(0, 2))), [[15.21, 145.75], 16]);

  h.map.fire('dragstart');
  h.SAIPAN.setUserLocation({ lat:15.22, lng:145.76, accuracy:12, heading:null }, { focus:false });
  assert.equal(h.flyToCalls.length, 1);

  assert.equal(h.SAIPAN.focusUserLocation(), true);
  assert.deepEqual(JSON.parse(JSON.stringify(h.flyToCalls.at(-1).slice(0, 2))), [[15.22, 145.76], 16]);
  h.SAIPAN.setUserLocation({ lat:15.23, lng:145.77, accuracy:12, heading:null }, { focus:false });
  assert.equal(h.flyToCalls.length, 3);
});

test('clearUserLocation removes GPS layers and disables recentering', () => {
  const h = loadMap();
  h.SAIPAN.setUserLocation({ lat:15.21, lng:145.75, accuracy:12, heading:null }, { focus:true });
  const gps = userLayers(h);

  h.SAIPAN.clearUserLocation();

  assert.equal(h.layers.has(gps.marker), false);
  assert.equal(h.layers.has(gps.circle), false);
  assert.equal(h.SAIPAN.focusUserLocation(), false);
});
