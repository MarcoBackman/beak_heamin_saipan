const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadScript(file, context) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  vm.runInNewContext(source, context, { filename: file });
}

function routeKey(from, to) {
  return `${from[0].toFixed(4)},${from[1].toFixed(4)}|${to[0].toFixed(4)},${to[1].toFixed(4)}`;
}

test('every rental-car itinerary leg has a precomputed road route', () => {
  const context = { window: {} };
  loadScript('js/data.js', context);
  loadScript('js/routes.js', context);

  const missing = [];
  for (const day of context.window.SAIPAN.DAYS) {
    for (let index = 1; index < day.stops.length; index += 1) {
      const stop = day.stops[index];
      const previous = day.stops[index - 1];
      if (stop.mode !== 'drive' || stop.virtual || previous.virtual) continue;
      const key = routeKey(previous.ll, stop.ll);
      if (!context.window.SAIPAN_ROUTES[key]) {
        missing.push(`${day.label}: ${previous.n} -> ${stop.n} (${key})`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test('every selectable gear vendor has pickup and return road routes', () => {
  const context = { window: {} };
  loadScript('js/data.js', context);
  loadScript('js/routes.js', context);
  const { DAYS, GEAR_VENDOR_COORDS } = context.window.SAIPAN;
  const routes = context.window.SAIPAN_ROUTES;
  const missing = [];

  for (const [vendor, ll] of Object.entries(GEAR_VENDOR_COORDS)) {
    if (vendor === 'default') continue;
    for (const day of DAYS) {
      day.stops.forEach((stop, index) => {
        if (!stop.gearVendorStop) return;
        const previous = day.stops[index - 1];
        const next = day.stops[index + 1];
        if (stop.mode === 'drive' && previous && !routes[routeKey(previous.ll, ll)]) {
          missing.push(`${vendor}: ${previous.n} -> gear shop`);
        }
        if (next?.mode === 'drive' && !routes[routeKey(ll, next.ll)]) {
          missing.push(`${vendor}: gear shop -> ${next.n}`);
        }
      });
    }
  }

  assert.deepEqual(missing, []);
});
