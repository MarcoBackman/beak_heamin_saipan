/* ═══════════ 프리다이빙 장비점 선택 저장 ═══════════ */
(function(){
  const S = window.SAIPAN = window.SAIPAN || {};
  const KEY = 'saipan-gear-vendor-v1';
  const DURATION_KEY = 'saipan-gear-duration-v1';
  const VENDORS = {
    divewish: { id:'divewish', name:'Divewish' },
    aqua: { id:'aqua', name:'Aqua Connections' },
    masa: { id:'masa', name:'Masa Dive' },
  };
  const radios = document.querySelectorAll('input[name="gearVendor"]');
  const cards = document.querySelectorAll('[data-gear-vendor]');
  const durationRadios = document.querySelectorAll('input[name="gearDuration"]');
  const durationLabels = document.querySelectorAll('[data-gear-duration-label]');
  let selected = null;
  let selectedDays = 6;

  function syncItineraryStop(){
    const coords = S.GEAR_VENDOR_COORDS || {};
    const ll = (selected && coords[selected.id]) || coords.default;
    if (!ll || !S.DAYS) return;
    S.DAYS.forEach(day => day.stops.forEach(stop => {
      if (!stop.gearVendorStop) return;
      stop.ll = ll;
      stop.n = (selected ? selected.name : '선택한 장비점') +
        (stop.n.includes('반납') ? ' · 대여 장비 반납' : ' · 풀세트 인수');
    }));
  }

  function select(id, notify){
    selected = VENDORS[id] || null;
    radios.forEach(radio => { radio.checked = !!selected && radio.value === selected.id; });
    cards.forEach(card => {
      card.classList.toggle('selected', !!selected && card.dataset.gearVendor === selected.id);
    });
    syncItineraryStop();
    if (!selected) return;
    localStorage.setItem(KEY, selected.id);
    if (notify) {
      window.dispatchEvent(new CustomEvent('saipan:gear-vendor-change', { detail:selected }));
    }
  }

  function selectDuration(value, notify){
    const days = Number(value);
    selectedDays = days === 7 ? 7 : 6;
    durationRadios.forEach(radio => { radio.checked = Number(radio.value) === selectedDays; });
    durationLabels.forEach(label => { label.textContent = selectedDays + '일'; });
    localStorage.setItem(DURATION_KEY, String(selectedDays));
    if (notify) {
      window.dispatchEvent(new CustomEvent('saipan:gear-duration-change', { detail:{ days:selectedDays } }));
    }
  }

  S.getGearVendor = () => selected;
  S.getGearDuration = () => selectedDays;
  S.formatGearText = text => String(text)
    .replaceAll('{gearShop}', selected ? selected.name : '선택한 장비점')
    .replaceAll('{gearDays}', selectedDays + '일');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) select(radio.value, true);
    });
  });
  durationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) selectDuration(radio.value, true);
    });
  });

  select(localStorage.getItem(KEY), false);
  selectDuration(localStorage.getItem(DURATION_KEY), false);
})();
