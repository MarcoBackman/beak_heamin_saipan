/* ═══════════ 이미지 로드 재시도 — 과거 실패(404) 캐시 대비 ═══════════ */
window.addEventListener('load', () => {
  document.querySelectorAll('.shot img, .hero-photo img, details.ticket img').forEach(img => {
    if (img.complete && img.naturalWidth === 0 && img.src) {
      img.addEventListener('load', () => img.parentElement.classList.remove('empty'), { once: true });
      img.src = img.src.split('?')[0] + '?retry=' + Date.now();
    }
  });
});
