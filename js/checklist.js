/* ═══════════ 체크리스트 저장 ═══════════ */
(function(){
  const KEY = 'saipan-checklist';
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  document.querySelectorAll('#checkItems input[type=checkbox]').forEach(cb => {
    cb.checked = !!saved[cb.dataset.k];
    cb.addEventListener('change', () => {
      saved[cb.dataset.k] = cb.checked;
      localStorage.setItem(KEY, JSON.stringify(saved));
    });
  });
})();
