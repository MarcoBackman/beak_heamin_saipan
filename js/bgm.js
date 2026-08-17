/* ═══════════ 배경음악 (BGM) ═══════════ */
(function(){
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('bgmBtn');
  if (!audio || !btn) return;
  const KEY = 'saipan-bgm';
  audio.volume = 0.35;
  function ui(){
    const on = !audio.paused;
    btn.classList.toggle('playing', on);
    btn.textContent = on ? '🔊' : '🎵';
    btn.title = on ? '배경음악 끄기' : '배경음악 켜기';
  }
  function tryPlay(){ audio.play().then(ui).catch(() => {}); }
  btn.addEventListener('click', () => {
    if (audio.paused){ localStorage.setItem(KEY, 'on'); tryPlay(); }
    else { localStorage.setItem(KEY, 'off'); audio.pause(); }
  });
  audio.addEventListener('play', ui);
  audio.addEventListener('pause', ui);
  /* 로드 시 자동재생 시도 — 브라우저 정책으로 막히면 첫 클릭/키 입력 때 자동 시작 */
  if (localStorage.getItem(KEY) !== 'off'){
    tryPlay();
    const kick = () => {
      document.removeEventListener('pointerdown', kick);
      document.removeEventListener('keydown', kick);
      if (audio.paused && localStorage.getItem(KEY) !== 'off') tryPlay();
    };
    document.addEventListener('pointerdown', kick);
    document.addEventListener('keydown', kick);
  }
  ui();
})();
