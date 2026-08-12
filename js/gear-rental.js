/* ═══════════ 프리다이빙 장비점 선택 저장 ═══════════ */
(function(){
  const S = window.SAIPAN = window.SAIPAN || {};
  const KEY = 'saipan-gear-vendor-v1';
  const VENDORS = {
    divewish: { id:'divewish', name:'Divewish' },
    aqua: { id:'aqua', name:'Aqua Connections' },
    masa: { id:'masa', name:'Masa Dive' },
  };
  const radios = document.querySelectorAll('input[name="gearVendor"]');
  const cards = document.querySelectorAll('[data-gear-vendor]');
  let selected = null;

  function select(id, notify){
    selected = VENDORS[id] || null;
    radios.forEach(radio => { radio.checked = !!selected && radio.value === selected.id; });
    cards.forEach(card => {
      card.classList.toggle('selected', !!selected && card.dataset.gearVendor === selected.id);
    });
    if (!selected) return;
    localStorage.setItem(KEY, selected.id);
    if (notify) {
      window.dispatchEvent(new CustomEvent('saipan:gear-vendor-change', { detail:selected }));
    }
  }

  S.getGearVendor = () => selected;
  S.formatGearText = text => String(text).replaceAll(
    '{gearShop}', selected ? selected.name : '선택한 장비점'
  );

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) select(radio.value, true);
    });
  });

  select(localStorage.getItem(KEY), false);
})();
