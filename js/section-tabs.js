/* ═══════════ 섹션별 탭 ═══════════ */
(function(){
  document.querySelectorAll('[data-tabs]').forEach(scope => {
    const tabs = scope.querySelectorAll('.stay-tab');
    const panels = scope.querySelectorAll('.stay-panel');
    tabs.forEach(button => {
      button.addEventListener('click', () => {
        tabs.forEach(tab => tab.classList.toggle('on', tab === button));
        panels.forEach(panel => panel.classList.toggle('on', panel.id === button.dataset.panel));
      });
    });
  });
})();
