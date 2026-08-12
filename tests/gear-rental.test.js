const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'gear-rental.js'), 'utf8');

class ClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  contains(value) {
    return this.values.has(value);
  }

  toggle(value, force) {
    const enabled = force === undefined ? !this.values.has(value) : force;
    if (enabled) this.values.add(value);
    else this.values.delete(value);
    return enabled;
  }
}

function loadGearSelector(savedValue) {
  const stored = new Map();
  if (savedValue !== null) stored.set('saipan-gear-vendor-v1', savedValue);

  const cards = {};
  const radios = {};
  for (const id of ['divewish', 'aqua', 'masa']) {
    cards[id] = { dataset: { gearVendor: id }, classList: new ClassList(['gear-card']) };
    radios[id] = {
      value: id,
      checked: false,
      addEventListener(type, callback) { this.listener = callback; },
      triggerChange() { this.checked = true; this.listener(); },
    };
  }

  const events = [];
  const SAIPAN = {};
  const window = {
    SAIPAN,
    dispatchEvent(event) { events.push(event); },
  };
  const document = {
    querySelectorAll(selector) {
      if (selector === 'input[name="gearVendor"]') return Object.values(radios);
      if (selector === '[data-gear-vendor]') return Object.values(cards);
      return [];
    },
  };
  const localStorage = {
    getItem(key) { return stored.get(key) ?? null; },
    setItem(key, value) { stored.set(key, value); },
  };
  class CustomEvent {
    constructor(type, options) {
      this.type = type;
      this.detail = options.detail;
    }
  }

  vm.runInNewContext(source, { CustomEvent, document, localStorage, window }, { filename: 'js/gear-rental.js' });
  return { SAIPAN, cards, events, radios, storage: localStorage };
}

test('restores a valid saved vendor and exposes its display name', () => {
  const h = loadGearSelector('divewish');

  assert.equal(h.SAIPAN.getGearVendor().name, 'Divewish');
  assert.equal(h.radios.divewish.checked, true);
  assert.equal(h.cards.divewish.classList.contains('selected'), true);
});

test('ignores an unknown saved vendor', () => {
  const h = loadGearSelector('unknown');

  assert.equal(h.SAIPAN.getGearVendor(), null);
  assert.equal(Object.values(h.cards).some(card => card.classList.contains('selected')), false);
});

test('saves a new radio selection and dispatches an update', () => {
  const h = loadGearSelector(null);
  h.radios.aqua.triggerChange();

  assert.equal(h.storage.getItem('saipan-gear-vendor-v1'), 'aqua');
  assert.equal(h.SAIPAN.getGearVendor().name, 'Aqua Connections');
  assert.equal(h.events.at(-1).type, 'saipan:gear-vendor-change');
  assert.equal(h.events.at(-1).detail.name, 'Aqua Connections');
});

test('formats itinerary tokens with the selected vendor or a safe default', () => {
  const selected = loadGearSelector('masa');
  const empty = loadGearSelector(null);

  assert.equal(selected.SAIPAN.formatGearText('{gearShop}에 장비 반납'), 'Masa Dive에 장비 반납');
  assert.equal(empty.SAIPAN.formatGearText('{gearShop}에서 피팅'), '선택한 장비점에서 피팅');
});
