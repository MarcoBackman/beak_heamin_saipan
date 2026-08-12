/* ═══════════ 모바일 현재 위치 추적 ═══════════ */
(function(){
  const S = window.SAIPAN;
  const button = document.getElementById('locationToggle');
  const status = document.getElementById('locationStatus');
  if (!S || !button || !status) return;

  const options = { enableHighAccuracy:true, timeout:15000, maximumAge:5000 };
  const deniedMessage = '위치 권한이 꺼져 있어요. 브라우저 설정에서 허용한 뒤 페이지를 새로고침해 주세요.';
  let watchId = null;
  let hasFix = false;
  let denied = false;

  function setState(state, message){
    const actionLabel = state === 'tracking' ? '현재 위치로 이동'
      : state === 'denied' ? '위치 권한 설정 안내'
      : '내 위치 표시';
    button.dataset.state = state;
    button.setAttribute('aria-pressed', state === 'tracking' ? 'true' : 'false');
    button.setAttribute('aria-label', actionLabel);
    button.setAttribute('title', actionLabel);
    status.hidden = !message;
    status.textContent = message || '';
  }

  function stop(state, message){
    if (watchId !== null && navigator.geolocation){
      navigator.geolocation.clearWatch(watchId);
    }
    watchId = null;
    hasFix = false;
    if (S.clearUserLocation) S.clearUserLocation();
    setState(state || 'idle', message || '');
  }

  function handleError(error){
    if (error && error.code === 1){
      denied = true;
      stop('denied', deniedMessage);
      return;
    }
    setState(hasFix ? 'tracking' : 'locating', 'GPS 신호를 찾지 못했어요. 하늘이 보이는 곳에서 다시 확인해 주세요.');
  }

  function start(){
    if (denied){
      setState('denied', deniedMessage);
      return;
    }
    if (watchId !== null){
      if (hasFix && S.focusUserLocation && S.focusUserLocation()){
        setState('tracking', '현재 위치로 이동했어요.');
      }
      return;
    }
    hasFix = false;
    setState('locating', '현재 위치를 찾는 중…');
    watchId = navigator.geolocation.watchPosition(position => {
      const coords = position.coords;
      S.setUserLocation({
        lat:coords.latitude,
        lng:coords.longitude,
        accuracy:coords.accuracy,
        heading:Number.isFinite(coords.heading) ? coords.heading : null,
      }, { focus:!hasFix });
      hasFix = true;
      setState('tracking', '내 위치를 실시간으로 표시하고 있어요.');
    }, handleError, options);
  }

  S.stopLocationTracking = () => stop('idle', '');
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') S.stopLocationTracking();
  });

  if (!navigator.geolocation || window.isSecureContext === false){
    button.disabled = true;
    setState('unavailable', window.isSecureContext === false
      ? '내 위치 기능은 HTTPS 보안 연결에서만 사용할 수 있어요.'
      : '이 브라우저는 현재 위치 기능을 지원하지 않아요.');
    return;
  }

  button.addEventListener('click', start);
  setState('idle', '');
})();
