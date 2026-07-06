/* ═══════════ 스크롤 등장 효과 ═══════════ */
(function(){
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll('article.day, .overview, .flights, .checklist, details.ticket, section h2, section .lede');
  els.forEach(el => el.classList.add('reveal'));
  const ro = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting){ en.target.classList.add('in'); ro.unobserve(en.target); }
    });
  }, { threshold:.06 });
  els.forEach(el => ro.observe(el));
})();
