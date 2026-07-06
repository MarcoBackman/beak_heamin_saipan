/* ═══════════ 참고 콘텐츠 미리보기 (링크 검증 완료) ═══════════ */
(function(){
  const S = window.SAIPAN;
  if (!S) return;
  const REFS = S.REFS, SHORTS = S.SHORTS;

  function esc(s){
    return String(s).replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[ch]));
  }

  function refCard(r){
    if (r.ty === "youtube"){
      return '<div class="ref-card" data-yt="' + r.id + '">' +
        '<div class="thumb"><img src="https://i.ytimg.com/vi/' + r.id + '/hqdefault.jpg" alt="" loading="lazy"><span class="play">▶</span></div>' +
        '<div class="ref-body"><span class="badge">YouTube</span>' +
        '<a class="ref-title" href="' + r.u + '" target="_blank" rel="noopener">' + r.t + '</a>' +
        '<p class="ref-line">' + r.l + '</p><span class="ref-author">' + r.a + '</span></div></div>';
    }
    return '<a class="ref-card" href="' + r.u + '" target="_blank" rel="noopener">' +
      '<div class="thumb ph"><span>' + (r.ty === "blog" ? "📝" : "📰") + '</span></div>' +
      '<div class="ref-body"><span class="badge">' + r.b + '</span>' +
      '<span class="ref-title">' + r.t + '</span>' +
      '<p class="ref-line">' + r.l + '</p><span class="ref-author">' + r.a + '</span></div></a>';
  }

  function shortCard(s){
    const poster = 'https://i.ytimg.com/vi/' + encodeURIComponent(s.id) + '/hqdefault.jpg';
    return '<div class="short-card" data-short-id="' + esc(s.id) + '">' +
      '<div class="short-frame">' +
        '<div class="short-poster" style="--poster:url(' + poster + ')">' +
          '<span class="play">▶</span><b>' + esc(s.title) + '</b><span>' + esc(s.line) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="short-body"><div class="spot">' + esc(s.spot) + '</div><div class="src">YouTube · ' + esc(s.src) + ' · 음소거 자동재생</div></div>' +
      '</div>';
  }

  document.querySelectorAll('article.day').forEach(art => {
    const dayNum = +art.dataset.day + 1;
    const items = REFS[dayNum];
    const album = art.querySelector('.album');
    const shorts = SHORTS[dayNum];
    if (shorts && shorts.length){
      const shortWrap = document.createElement('div');
      shortWrap.className = 'shorts';
      shortWrap.innerHTML = '<h4>▶ 하이라이트 쇼츠 · 자동재생</h4><div class="shorts-row">' + shorts.map(shortCard).join('') + '</div>';
      art.insertBefore(shortWrap, album);
    }
    if (items && items.length){
      const wrap = document.createElement('div');
      wrap.className = 'refs';
      wrap.innerHTML = '<h4>🎬 미리보기 · 참고 콘텐츠</h4><div class="refs-row">' + items.map(refCard).join('') + '</div>';
      art.insertBefore(wrap, album);
    }
  });

  const loadShort = card => {
    if (card.dataset.loaded) return;
    const id = card.dataset.shortId;
    const frame = card.querySelector('.short-frame');
    card.dataset.loaded = '1';
    frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) +
      '?autoplay=1&mute=1&playsinline=1&loop=1&playlist=' + encodeURIComponent(id) +
      '&controls=0&modestbranding=1&rel=0" title="날짜별 하이라이트 쇼츠" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.short-card').forEach(card => {
      card.addEventListener('click', () => loadShort(card), { once:true });
    });
  } else if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting){
          loadShort(en.target);
          io.unobserve(en.target);
        }
      });
    }, { rootMargin:'220px 0px', threshold:.18 });
    document.querySelectorAll('.short-card').forEach(card => io.observe(card));
  } else {
    document.querySelectorAll('.short-card').forEach(loadShort);
  }

  /* 유튜브 카드: 썸네일 클릭 시 그 자리에서 바로 재생 */
  document.querySelectorAll('.ref-card[data-yt] .thumb').forEach(th => {
    th.addEventListener('click', () => {
      const id = th.closest('.ref-card').dataset.yt;
      th.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1" title="YouTube 미리보기" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
    }, { once:true });
  });
})();
