const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const mapSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'map.js'), 'utf8');

function loadMap(spots) {
  const markers = [];
  const state = { lastPopup: null };

  class FakeNode {
    constructor() {
      this.classList = {
        add() {},
        remove() {},
        toggle() {},
      };
      this.dataset = {};
      this.hidden = false;
      this.value = '';
    }

    addEventListener() {}
    appendChild() {}
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    scrollIntoView() {}
  }

  class FakeLayerGroup {
    constructor() {
      this.layers = [];
    }

    addLayer(layer) {
      this.layers.push(layer);
      return this;
    }

    addTo(map) {
      map.addLayer(this);
      return this;
    }

    clearLayers() {
      this.layers.length = 0;
      return this;
    }

    removeLayer(layer) {
      this.layers = this.layers.filter(item => item !== layer);
      return this;
    }
  }

  class FakeMarker {
    constructor(ll, options) {
      this.ll = ll;
      this.options = options || {};
      this.handlers = {};
      markers.push(this);
    }

    addTo(layer) {
      layer.addLayer(this);
      return this;
    }

    bindTooltip() {
      return this;
    }

    on(type, handler) {
      this.handlers[type] = handler;
      return this;
    }

    fire(type) {
      assert.ok(this.handlers[type], `No handler registered for ${type}`);
      this.handlers[type]();
    }

    setIcon() {
      return this;
    }

    setLatLng() {
      return this;
    }
  }

  class FakePopup {
    constructor(options) {
      this.options = options;
      this.content = '';
      this.ll = null;
    }

    getElement() {
      return null;
    }

    setLatLng(ll) {
      this.ll = ll;
      return this;
    }

    setContent(content) {
      this.content = content;
      return this;
    }

    openOn() {
      state.lastPopup = this;
      return this;
    }
  }

  const mapLayers = new Set();
  const map = {
    addLayer(layer) {
      mapLayers.add(layer);
      return this;
    },
    flyTo() {
      return this;
    },
    flyToBounds() {
      return this;
    },
    hasLayer(layer) {
      return mapLayers.has(layer);
    },
    invalidateSize() {
      return this;
    },
    on() {
      return this;
    },
    removeLayer(layer) {
      mapLayers.delete(layer);
      return this;
    },
    setView() {
      return this;
    },
  };

  const nodes = new Map();
  const document = {
    body: new FakeNode(),
    createElement() {
      return new FakeNode();
    },
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, new FakeNode());
      return nodes.get(id);
    },
    querySelectorAll() {
      return [];
    },
  };

  const L = {
    control: {
      zoom() {
        return { addTo() {} };
      },
    },
    divIcon(options) {
      return options;
    },
    layerGroup() {
      return new FakeLayerGroup();
    },
    latLngBounds() {
      return { extend() {} };
    },
    map() {
      return map;
    },
    marker(ll, options) {
      return new FakeMarker(ll, options);
    },
    polyline() {
      return {
        addTo() {
          return this;
        },
        bindTooltip() {
          return this;
        },
        on() {
          return this;
        },
        setLatLngs() {
          return this;
        },
      };
    },
    popup(options) {
      return new FakePopup(options);
    },
    tileLayer() {
      return { addTo() {} };
    },
  };

  const SAIPAN = {
    DAYS: [{
      label: 'Day 1',
      title: '테스트 일정',
      stops: [{ n: '테스트 위치', ll: [15.2, 145.75], mode: 'drive' }],
    }],
    POIS: [],
    SPOTS: spots,
  };

  const window = {
    SAIPAN,
    innerWidth: 1280,
    matchMedia() {
      return { matches: true };
    },
  };

  const context = {
    IntersectionObserver: class {
      observe() {}
    },
    L,
    console,
    document,
    requestAnimationFrame(callback) {
      callback();
    },
    setTimeout(callback) {
      callback();
    },
    window,
  };

  vm.runInNewContext(mapSource, context, { filename: 'js/map.js' });

  return {
    get lastPopup() {
      return state.lastPopup;
    },
    spotMarkers: markers.filter(marker => marker.options.icon?.html?.includes('spot-pin')),
  };
}

test('clicking a spot marker opens its photo popup', () => {
  const h = loadMap([
    {
      nm: '그로토',
      kind: '프리다이빙',
      ll: [15.2604, 145.8239],
      imgs: ['./img/hero-grotto.jpg'],
    },
  ]);

  h.spotMarkers[0].fire('click');

  assert.match(h.lastPopup.content, /spot-pop-slide/);
  assert.match(h.lastPopup.content, /hero-grotto\.jpg/);
  assert.match(h.lastPopup.content, /그로토/);
});

test('clicking a spot without photos opens a name-only popup', () => {
  const h = loadMap([
    {
      nm: '피나탕 파크',
      kind: '복합',
      ll: [14.1469, 145.1429],
    },
  ]);

  h.spotMarkers[0].fire('click');

  assert.doesNotMatch(h.lastPopup.content, /spot-pop-slide/);
  assert.match(h.lastPopup.content, /피나탕 파크/);
});
