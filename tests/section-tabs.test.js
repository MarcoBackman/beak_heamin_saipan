const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'js', 'section-tabs.js');

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

function makeScope() {
  const panelA = { id: 'panelA', classList: new ClassList(['stay-panel', 'on']) };
  const panelB = { id: 'panelB', classList: new ClassList(['stay-panel']) };
  const buttonA = {
    dataset: { panel: 'panelA' },
    classList: new ClassList(['stay-tab', 'on']),
    addEventListener(type, callback) { this[type] = callback; },
  };
  const buttonB = {
    dataset: { panel: 'panelB' },
    classList: new ClassList(['stay-tab']),
    addEventListener(type, callback) { this[type] = callback; },
  };
  const scope = {
    querySelectorAll(selector) {
      if (selector === '.stay-tab') return [buttonA, buttonB];
      if (selector === '.stay-panel') return [panelA, panelB];
      return [];
    },
  };
  return { buttonA, buttonB, panelA, panelB, scope };
}

test('clicking a section tab activates only its matching panel', () => {
  const source = fs.readFileSync(scriptPath, 'utf8');
  const first = makeScope();
  const second = makeScope();
  const document = {
    querySelectorAll(selector) {
      assert.equal(selector, '[data-tabs]');
      return [first.scope, second.scope];
    },
  };

  vm.runInNewContext(source, { document }, { filename: 'js/section-tabs.js' });
  first.buttonB.click();

  assert.equal(first.buttonA.classList.contains('on'), false);
  assert.equal(first.buttonB.classList.contains('on'), true);
  assert.equal(first.panelA.classList.contains('on'), false);
  assert.equal(first.panelB.classList.contains('on'), true);
  assert.equal(second.panelA.classList.contains('on'), true);
});
