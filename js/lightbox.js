/* ═══════════ 라이트박스 — 사진 클릭 확대 ═══════════ */
(function(){
  const pics = Array.from(document.querySelectorAll('.hero-photo img, .shot img'));
  if (!pics.length) return;
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML =
    '<button class="lb-close" aria-label="닫기">✕</button>' +
    '<button class="lb-prev" aria-label="이전 사진">◀</button>' +
    '<button class="lb-next" aria-label="다음 사진">▶</button>' +
    '<img alt=""><div class="cap"></div><div class="cnt"></div>';
  document.body.appendChild(lb);
  const big = lb.querySelector('img'), cap = lb.querySelector('.cap'), cnt = lb.querySelector('.cnt');
  let list = [], idx = 0;
  const gallery = () => pics.filter(p => !p.closest('.shot.empty'));
  function show(i){
    if (!list.length) return;
    idx = (i + list.length) % list.length;
    const p = list[idx];
    big.src = p.src; big.alt = p.alt;
    cap.textContent = p.alt || '';
    cnt.textContent = (idx + 1) + ' / ' + list.length;
    lb.classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function hide(){
    lb.classList.remove('on');
    document.body.style.overflow = '';
  }
  pics.forEach(p => p.addEventListener('click', () => {
    list = gallery();
    const i = list.indexOf(p);
    if (i >= 0) show(i);
  }));
  lb.querySelector('.lb-close').addEventListener('click', hide);
  lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) hide(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('on')) return;
    if (e.key === 'Escape') hide();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
})();
