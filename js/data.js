/* ═══════════ 콘텐츠 데이터 — 일정·스팟·참고 콘텐츠는 여기서만 수정한다 ═══════════ */
window.SAIPAN = (function(){
  const SPOTS = [
    { island:"saipan", nm:"그로토", en:"The Grotto", kind:"프리다이빙", ll:[15.2604,145.8239],
      depth:"풀 5m · 캐번 18~21m", level:"중~상급", best:"늦은 오전~정오 (빛기둥)",
      desc:"'세계 2위 캐번 다이빙 사이트'로 선정된 사이판의 상징. 코발트빛 풀이 3개의 수중 출구로 외해와 연결되고, 시야는 30m+로 섬 최고 수준입니다.",
      tip:"계단 112개 — 아쿠아슈즈 필수, 장비 최소화. 수중 출구 밖(외해)으로 나가면 수면 재진입이 거의 불가능 — 절대 금지. 가이드 투어 필수, 수영 목적 입장료 $5, 적기(빨간 깃발) 게양 시 입수 금지." },
    { island:"saipan", nm:"라우라우 베이", en:"Lau Lau Bay", kind:"복합", ll:[15.1627,145.7623],
      depth:"5~20m 완경사 (외곽 33m)", level:"초급", best:"만조 전후 · 이른 아침",
      desc:"섬 최대 산호초 + 사이판에서 가장 쉬운 비치 엔트리. 거북이·가오리·나폴레옹피시를 만나는 프리다이빙 연습 명소입니다.",
      tip:"'맨 왼쪽 로프' 라인이 거북이 코스. 채널 초입은 시야가 탁하니 당황하지 말 것. 리프부츠 필수, 차량 털이 이력 — 귀중품은 두고 가기." },
    { island:"saipan", nm:"파우파우 비치", en:"Pau Pau Beach", kind:"복합", ll:[15.2527,145.7748],
      depth:"산호대 2m · 드롭 6m", level:"초급", best:"아침 · 중~만조",
      desc:"켄싱턴 호텔 앞 도보 하우스리프. 아침 몸풀기 수영과 이퀄라이징 연습, 가벼운 스노클링에 최적입니다.",
      tip:"산호대 위에서 핀 킥 주의. 간조엔 산호대가 얕아지므로 중~만조에." },
    { island:"saipan", nm:"윙 비치", en:"Wing Beach", kind:"프리다이빙", ll:[15.2705,145.7902],
      depth:"30m 타워 · 캐니언", level:"중~상급", best:"여름(5~9월) 잔잔한 날 오전",
      desc:"켄싱턴에서 차 5분, 라군이 끝나는 외해 지형. 30m급 수중 타워와 캐니언이 있는 본격 프리다이빙 포인트입니다.",
      tip:"리프 컷에 이안류 — 보이면 포기. 편의시설 전무, 반드시 버디+강사 동반 권장. 파도 있는 날 입수 금지." },
    { island:"saipan", nm:"오비얀 비치", en:"Obyan Beach", kind:"복합", ll:[15.1047,145.7371],
      depth:"리프 밖 5~18m", level:"중급", best:"만조 전후 2시간 필수",
      desc:"어종 다양성 사이판 최고 — 거북이·화이트팁·이글레이·가든일. 만조 땐 프리다이버에게도 훌륭한 리프 사면입니다.",
      tip:"간조엔 산호에 몸이 닿을 만큼 얕아져 입수 불가 — 조수표 확인 필수. 리프 컷의 고정 로프 활용, 외해 개구부 조류 회피." },
    { island:"saipan", nm:"마이크로 비치", en:"Micro Beach", kind:"수영", ll:[15.2190,145.7170],
      depth:"0.5~1.5m 모래", level:"초급", best:"이른 아침",
      desc:"가라판 옆 수영장처럼 잔잔한 라군. 수백 m가 수심 1m 안팎 모래 바닥이라 롱스윔·핀수영 연습에 이상적입니다.",
      tip:"제트스키·마나가하 보트 항로 주의 — 해안과 평행하게 수영." },
    { island:"saipan", nm:"이스트베이 클리프", en:"East Bay Cliff", kind:"복합", ll:[15.1580,145.7810],
      depth:"절벽 5m 점핑", level:"중급", best:"스웰 약한 날",
      desc:"라오라오 골프장 옆 절벽 점핑+스노클링 스팟. 사유지라 호텔 픽업 포함 투어로만 접근 가능합니다.",
      tip:"입수 전 출수 사다리 위치부터 확인. 파도가 절벽을 치는 날은 포기." },
    { island:"saipan", nm:"버드 아일랜드 비치", en:"Bird Island Beach", kind:"스노클", ll:[15.2572,145.8130],
      depth:"리프 0.5~3m", level:"중급(트레일)", best:"중~만조 · 맑은 날",
      desc:"그로토에서 차 5분, 전망대 아래 정글 트레일 끝의 비밀 해변. 간조엔 버드 아일랜드까지 리프 위를 걸을 수 있습니다.",
      tip:"로프 하강 구간 — 배낭 착용으로 양손 확보. 우기엔 트레일이 진창. 리프 바깥(태평양 쪽) 절대 금지, no-take 보호구역." },
    { island:"saipan", nm:"마나가하 섬", en:"Managaha Island", kind:"복합", ll:[15.2414,145.7127],
      depth:"라군 1~3m · 렉 5~6m", level:"초급~중급", best:"08:20 첫 배 · 오전",
      desc:"라군 유영구역은 초급 수영, 북쪽 리프 에지(5~10m)는 프리다이빙 연습, 남쪽 수상기 렉은 보트 스노클 투어로.",
      tip:"페리 왕복 $20+환경세 $10 현금, 막배 15:30. 섬 전체 no-take 보존구역(먹이주기도 불법). 유영구역 밖은 부이 지참." },
    { island:"saipan", nm:"포비든 내추럴 풀", en:"Forbidden Island", kind:"수영", ll:[15.1506,145.7896],
      depth:"풀 1.5~3m", level:"중급(트레킹)", best:"반드시 썰물 + 저파도",
      desc:"트레킹(편도 1km·고도 160m) 끝의 천연 수영장. 인근 히든 그로토(동굴 풀)는 서지가 강해 '보는 것까지'를 권합니다.",
      tip:"외해와 연결되는 선반 구간은 익사 사고 다발 — 접근 금지. 가이드 투어(약 $85, 9:30~12:30) 권장. 등산화+아쿠아슈즈 별도 지참." },
    { island:"rota", nm:"로타 홀", en:"Rota Hole (Senhanom Cave)", kind:"프리다이빙", ll:[14.1194,145.1211],
      depth:"입구 12m · 내부 18m", level:"상급", best:"4~9월 빛내림 최강 · 한낮",
      desc:"천장 개구부로 빛기둥이 쏟아지는 로타 시그니처 수중 동굴. 보트 전용 포인트로, 9월 허니문 시기는 빛내림 시즌 안에 있습니다.",
      tip:"오버헤드(천장) 구간 — 동굴 경험+가이드 필수. 프리다이빙 전문 Sea People's Rota 운영. 파도 크면 출항 취소 — 예비 시간 확보." },
    { island:"rota", nm:"센하놈 드롭오프", en:"Senhanom Drop-off", kind:"프리다이빙", ll:[14.1185,145.1205],
      depth:"12m → 50m+", level:"중상급", best:"3~9월",
      desc:"로타 홀과 같은 서측 절벽 라인의 월(wall) 포인트. '로타 블루' 그라데이션 속 딥 다이빙을 즐길 수 있습니다.",
      tip:"조류 대응 경험 필요 — 보트·버디 커버 하에서만. 로타 홀 투어와 자주 묶임." },
    { island:"rota", nm:"코랄 가든 · 쇼운마루", en:"Coral Garden · Shoun Maru", kind:"복합", ll:[14.1290,145.1500],
      depth:"리프탑 3~5m · 렉 30~33m", level:"초급~중급", best:"3~9월 오전",
      desc:"CNMI 최초 해양보호구역(사산하야) 안의 산호 군락과 100m급 일본 수송선 렉. 시야가 좋아 렉은 수면에서도 내려다보입니다.",
      tip:"no-take 보호구역 — 유물·산호 접촉 금지. 렉 터치는 30m급 실력 필요, 수면 관망 추천." },
    { island:"rota", nm:"피나탕 파크", en:"Pinatang Park", kind:"복합", ll:[14.1469,145.1429],
      depth:"풀 1~3m · 수로 9~18m", level:"초급~중급", best:"잔잔한 날",
      desc:"송송 빌리지 도보권의 씨워터 파크. 천연 수로·풀에서 수영·스노클·점프를 한 번에 즐기는 로타의 동네 명소입니다.",
      tip:"스톤피시 서식 — 바닥에 손 짚지 말 것. 스웰이 들면 바깥 수로 진입 금지. 아쿠아슈즈 필수." },
    { island:"rota", nm:"스위밍 홀", en:"Swimming Hole", kind:"수영", ll:[14.1927,145.2259],
      depth:"약 1~4m", level:"초급", best:"중~만조 · 스웰 낮은 날",
      desc:"북쪽 해안 암초 링 안에 바닷물이 차오른 천연 수영장. 공항 가는 길에 들르기 좋습니다.",
      tip:"파도가 리프를 넘어오면 즉시 퇴수. 비포장 진입로 — 우기엔 4륜 권장. 아쿠아슈즈 필수." },
    { island:"rota", nm:"테테토 비치", en:"Teteto Beach", kind:"복합", ll:[14.1728,145.1897],
      depth:"0.5~2m 완경사", level:"초급", best:"중~만조 스노클",
      desc:"로타에서 가장 아름다운 백사장. 물고기가 사람 곁까지 다가올 만큼 순한, 둘만의 프라이빗 스노클 스팟입니다.",
      tip:"산호·바위 많아 아쿠아슈즈 필수. 리프 바깥으로 나가지 말 것. 그늘이 적으니 오전 방문+래시가드." },
  ];

  /* ty: youtube | blog | article — b: 출처 배지, id: 유튜브 video ID */
  const REFS = {
    1: [
      { ty:"youtube", id:"y5mT6BDXG3w", u:"https://www.youtube.com/watch?v=y5mT6BDXG3w", t:"사이판 3박5일 여행 VLOG — 입국팁·그로토·마나가하", l:"입국 팁부터 그로토·마나가하·맛집까지 한 번에 보는 커플 브이로그", a:"오하제 Ohaje" },
      { ty:"blog", b:"블로그", u:"https://zzintravel.com/603", t:"사이판 켄싱턴호텔 리뷰", l:"오션뷰 객실·7개 레스토랑·투명 카약 등 실투숙 사진 후기", a:"찐 여행자" },
      { ty:"article", b:"트립닷컴", u:"https://kr.trip.com/moments/detail/saipan-569-16508487/", t:"사이판 찐 힐링 호캉스, 켄싱턴 호텔", l:"전 객실 오션뷰·인피니티 풀·선셋 디너 호캉스 후기", a:"담담트립" },
    ],
    2: [
      { ty:"youtube", id:"ogOJ032E5Bw", u:"https://www.youtube.com/watch?v=ogOJ032E5Bw", t:"2025 사이판 프리다이빙 현지 브이로그", l:"그로토·아이스크림 포인트 수중 시점 최신 영상", a:"모험왕 강민호" },
      { ty:"youtube", id:"AJdUYAeS6zM", u:"https://www.youtube.com/watch?v=AJdUYAeS6zM", t:"사이판의 푸른 눈 '그로토 투어'", l:"천연 수중동굴·해저터널 구조와 프리다이빙 코스 상세 설명", a:"맨블 MANVEL" },
      { ty:"youtube", id:"uDj-kzsA5Go", u:"https://www.youtube.com/watch?v=uDj-kzsA5Go", t:"사이판 다이빙 포인트 정리 1편 (그로토/라우라우)", l:"그로토·라우라우 비교 정리 가이드 — 2일차 동선 계획용", a:"알레한드로와 마리나" },
      { ty:"youtube", id:"TdHLk2Dqlxw", u:"https://www.youtube.com/watch?v=TdHLk2Dqlxw", t:"그로토 프리다이빙 투어 후기", l:"계단 진입부터 입수까지 1인칭 시점 — 실제 동선 파악에 유용", a:"아무튼 도전중" },
      { ty:"youtube", id:"tYdPc3Ldw30", u:"https://www.youtube.com/watch?v=tYdPc3Ldw30", t:"그로토 [걸어서 세계속으로]", l:"KBS 2025년 방송분 — 고화질 수중 촬영 클립", a:"KBS 트래블" },
      { ty:"article", b:"아티클", u:"https://www.tripstore.kr/blog/%EC%82%AC%EC%9D%B4%ED%8C%90-%EC%97%AC%ED%96%89-%ED%9B%84%EA%B8%B0-%EC%BB%A4%ED%94%8C-5%EB%B0%956%EC%9D%BC-%EB%8B%A4%EC%9D%B4%EB%B9%99", t:"사이판 커플 5박 6일 여행 후기", l:"라우라우 비치에서 야생 바다거북과 수영한 커플 후기", a:"트립스토어" },
    ],
    3: [
      { ty:"blog", b:"네이버 블로그", u:"https://m.blog.naver.com/muchdazzling/223576562666", t:"로타섬 프리다이빙 투어, 로타홀 빛내림", l:"로타홀 빛내림을 직접 프리다이빙으로 체험한 실후기 (8월 방문)", a:"muchdazzling" },
      { ty:"youtube", id:"xWbm9lq4YEY", u:"https://www.youtube.com/watch?v=xWbm9lq4YEY", t:"로타 프리다이빙 여행기 [전편 몰아보기]", l:"입도부터 스위밍홀 프리다이빙까지 한 편으로 정리", a:"촉촉한 초록칩" },
      { ty:"youtube", id:"QDdFG3GPiLo", u:"https://www.youtube.com/watch?v=QDdFG3GPiLo", t:"다이버 성지 로타에서 바다거북과 프리다이빙", l:"로타 투어에서 거북이와 함께한 수중 시점 영상", a:"수중성지니" },
      { ty:"blog", b:"네이버 블로그", u:"https://m.blog.naver.com/dailymarina/221632665434", t:"로타홀, 영롱한 빛내림 속으로", l:"마리아나 관광청 공식 블로그의 로타홀 방문기", a:"데일리마리아나" },
      { ty:"blog", b:"티스토리", u:"https://kmespin.tistory.com/1883", t:"로타섬 프리다이빙 (12월 방문기)", l:"로타홀은 겨울철 입장 불가 — 시즌 정보 확인용 후기", a:"kmespin" },
      { ty:"blog", b:"네이버 블로그", u:"https://m.blog.naver.com/melodytravel/223680967864", t:"로타섬 스위밍홀, 신비로운 여행지", l:"천연 바다 수영장 물빛과 가는 방법 정리", a:"melodytravel" },
    ],
    4: [
      { ty:"youtube", id:"cn3aRvVlgx0", u:"https://www.youtube.com/watch?v=cn3aRvVlgx0", t:"로타 여행 코스 베스트 7", l:"스위밍홀·테테토비치 실촬영 — 동선 짜기에 최적", a:"떠나자!영맨" },
      { ty:"youtube", id:"fe2hzQkw9PU", u:"https://www.youtube.com/watch?v=fe2hzQkw9PU", t:"로타섬 꼭 가봐야 할 6곳", l:"마리아나 관광청 공식 고화질 소개 영상", a:"마리아나 관광청" },
      { ty:"blog", b:"티스토리", u:"https://kmespin.tistory.com/1884", t:"로타섬 관광지 총정리 (테테토·스위밍홀)", l:"렌터카 관광 후기 — 조용하게 놀기 좋은 곳 비교", a:"kmespin" },
      { ty:"youtube", id:"PjV3qzch0oU", u:"https://www.youtube.com/watch?v=PjV3qzch0oU", t:"신이 숨겨놓은 보석, 로타섬", l:"걸어서 세계속으로 로타 편 — 방송 퀄리티 미리보기", a:"KBS 트래블" },
      { ty:"blog", b:"브런치", u:"https://brunch.co.kr/@travie/1205", t:"사이판 로타섬의 초대장", l:"트래비 매거진의 로타 기행 에세이", a:"트래비 매거진" },
    ],
    5: [
      { ty:"youtube", id:"g8Pd8roMvK8", u:"https://www.youtube.com/watch?v=g8Pd8roMvK8", t:"마나가하 섬 프리다이빙 투어 리뷰", l:"프리다이빙 시점으로 본 마나가하 다이빙 포인트", a:"아무튼 도전중" },
      { ty:"youtube", id:"3O6uxziQqfU", u:"https://www.youtube.com/watch?v=3O6uxziQqfU", t:"마나가하 섬투어 + 보트 스노클링 호핑투어", l:"거북이·물고기와 함께한 프리다이빙 실사 영상", a:"맨블 MANVEL" },
      { ty:"blog", b:"네이버 블로그", u:"https://m.blog.naver.com/d-jini/223936899858", t:"마나가하섬 스노클링 투어 내돈내산 후기", l:"최근 다녀온 솔직 후기", a:"d-jini" },
      { ty:"blog", b:"티스토리", u:"https://jeju-salja.tistory.com/entry/%EC%82%AC%EC%9D%B4%ED%8C%90-%EB%A7%88%EB%82%98%EA%B0%80%ED%95%98%EC%84%AC-%EC%8A%A4%EB%85%B8%ED%81%B4%EB%A7%81-%ED%9B%84%EA%B8%B0-%EC%9D%B4%EC%9A%A9-%EC%A0%95%EB%B3%B4", t:"마나가하섬 스노클링 후기·이용 정보", l:"첫 페리 시간·환경세 $10·명당 자리·샤워시설 실전 정보", a:"제주꿈마니" },
      { ty:"youtube", id:"m23azI3zIRs", u:"https://www.youtube.com/watch?v=m23azI3zIRs", t:"마나가하 도착하면 이 자리부터 잡으세요", l:"입도 직후 명당 선점 요령 팁 영상", a:"구트의 여행정보" },
    ],
    6: [
      { ty:"article", b:"마이리얼트립", u:"https://experiences.myrealtrip.com/products/4218182", t:"사이판 오션뷰 코랄오션 골프+리조트 패키지", l:"코럴 오션 18홀 라운딩 상품 정보 — 카트·픽업 포함 구성과 요금 감 잡기", a:"마이리얼트립" },
      { ty:"blog", b:"블로그", u:"https://zzintravel.com/603", t:"사이판 켄싱턴호텔 리뷰", l:"7개 레스토랑·인피니티 풀·투명 카약 등 리조트 어메니티 실투숙 후기", a:"찐 여행자" },
      { ty:"article", b:"트립닷컴", u:"https://kr.trip.com/moments/detail/saipan-569-16508487/", t:"사이판 찐 힐링 호캉스, 켄싱턴 호텔", l:"전 객실 오션뷰·인피니티 풀·선셋 디너 — 리조트 데이 오후 미리보기", a:"담담트립" },
      { ty:"blog", b:"네이버 블로그", u:"https://m.blog.naver.com/sallyjmj/223420441495", t:"포비든아일랜드 투어 후기 (하이킹·스노클링·동굴)", l:"골프 대신 택할 수 있는 옵션 코스 — 긴팔·긴바지 추천 등 실전 팁", a:"sallyjmj" },
    ],
    7: [
      { ty:"blog", b:"블로그", u:"https://traveldive.co.kr/18", t:"사이판 가라판 맛집 총정리", l:"다이버 시점 별점 평가 — 포땀·컨트리하우스 등 6곳", a:"TravelDive" },
      { ty:"article", b:"브런치", u:"https://brunch.co.kr/@travie/1851", t:"한국인 입맛에 딱 좋은 사이판 맛집 5", l:"트래비 기자가 꼽은 가라판 일대 맛집 기사", a:"트래비 매거진" },
      { ty:"blog", b:"티스토리", u:"https://happy-freelife.com/entry/%EC%82%AC%EC%9D%B4%ED%8C%90-%EA%B8%B0%EB%85%90%ED%92%88-I-LOVE-SAIPAN-%EA%B8%B0%EB%85%90%ED%92%88-%EC%86%8C%EA%B0%9C-%EC%82%AC%EC%9D%B4%ED%8C%90%EC%97%90%EC%84%9C-%EA%BC%AD-%EC%82%AC%EC%95%BC%ED%95%A0-%EA%B2%83-%EC%B6%94%EC%B2%9C-%F0%9F%8E%81", t:"I LOVE SAIPAN 기념품 총정리", l:"머그컵·마그넷 등 카테고리별 소개 + 사은품 정보", a:"Happy Free Life" },
      { ty:"article", b:"마이리얼트립", u:"https://www.myrealtrip.com/offers/42736", t:"제리 선셋크루즈 (BBQ+라이브 공연)", l:"BBQ·무제한 음료 포함 선셋 디너크루즈 — 마지막 밤 옵션", a:"마이리얼트립" },
      { ty:"blog", b:"티스토리", u:"https://happy-freelife.com/entry/%EC%82%AC%EC%9D%B4%ED%8C%90-%EC%97%AC%ED%96%89-%EA%B0%80%EB%9D%BC%ED%8C%90-%EB%B8%8C%EB%9F%B0%EC%B9%98-%EC%B9%B4%ED%8E%98-%EC%86%8C%EA%B0%9C-%ED%81%AC%EB%9D%BC%EC%9A%B4-%ED%94%8C%EB%9D%BC%EC%9E%90-%EB%A6%AC%EC%A1%B0%ED%8A%B8-%EA%B7%BC%EC%B2%98-Cha-Cafe-%F0%9F%A5%AF%F0%9F%A5%AF", t:"가라판 브런치 카페 Cha Cafe", l:"마지막 날 아침 브런치 코스로 좋은 카페 후기", a:"Happy Free Life" },
    ],
  };

  const SHORTS = {
    1: [
      { id:"y5mT6BDXG3w", spot:"인천 출발 · 사이판 입도", title:"사이판 허니문 출발 전 분위기", line:"입국 팁과 첫날 동선 감 잡기", src:"오하제 Ohaje" },
    ],
    2: [
      { id:"AJdUYAeS6zM", spot:"그로토", title:"사이판의 푸른 눈, 그로토", line:"수중동굴과 계단 진입 동선 미리보기", src:"맨블 MANVEL" },
      { id:"uDj-kzsA5Go", spot:"라우라우 비치", title:"라우라우 프리다이빙 포인트", line:"거북이 스팟과 대체 코스 체크", src:"알레한드로와 마리나" },
    ],
    3: [
      { id:"xWbm9lq4YEY", spot:"로타 홀", title:"로타 프리다이빙 하이라이트", line:"빛내림과 로타 입도 분위기", src:"촉촉한 초록칩" },
      { id:"QDdFG3GPiLo", spot:"로타 바다거북 스팟", title:"다이버 성지 로타", line:"거북이와 함께하는 수중 시점", src:"수중성지니" },
    ],
    4: [
      { id:"cn3aRvVlgx0", spot:"테테토 · 스위밍 홀", title:"로타 여행 코스 베스트", line:"테테토 비치와 스위밍 홀 동선", src:"떠나자!영맨" },
      { id:"fe2hzQkw9PU", spot:"로타섬 핵심 스팟", title:"로타 꼭 가봐야 할 곳", line:"마리아나 관광청 공식 소개", src:"마리아나 관광청" },
    ],
    5: [
      { id:"g8Pd8roMvK8", spot:"마나가하 섬", title:"마나가하 프리다이빙", line:"리프 에지와 라군 분위기", src:"아무튼 도전중" },
      { id:"3O6uxziQqfU", spot:"보트 스노클링", title:"마나가하 호핑투어", line:"거북이와 열대어 포인트 미리보기", src:"맨블 MANVEL" },
    ],
    6: [
      { id:"8SXZt6TCc1k", spot:"포비든 아일랜드 (옵션)", title:"트레킹 + 스노클링 코스", line:"골프 대신 택한다면 — 옵션 코스 미리보기", src:"작은숲" },
    ],
    7: [
      { id:"y5mT6BDXG3w", spot:"가라판 · 마지막 밤", title:"사이판 시내와 선셋 분위기", line:"쇼핑과 저녁 코스 감 잡기", src:"오하제 Ohaje" },
    ],
    8: [
      { id:"y5mT6BDXG3w", spot:"귀국 전 회상", title:"사이판 여행 하이라이트", line:"마지막 날 돌아보는 전체 코스", src:"오하제 Ohaje" },
    ],
  };

  /* 주요 지점 좌표 — 리서치 워크플로우에서 OSM/GNIS로 검증·보정한 값 */
  const SPN_AIRPORT = [15.1190, 145.7290];   // 사이판 국제공항
  const KENSINGTON  = [15.2610, 145.7820];   // 켄싱턴 호텔 (산로케)
  const PAUPAU      = [15.2527, 145.7748];   // 파우파우 비치 (GNIS)
  const WING        = [15.2705, 145.7902];   // 윙 비치
  const GROTTO      = [15.2604, 145.8239];   // 그로토 (OSM 검증)
  const LAULAU      = [15.1627, 145.7623];   // 라우라우 비치 파크 (OSM 검증)
  const CHARLIE     = [15.2248, 145.7347];   // 찰리독 (마나가하 페리 선착장)
  const MANAGAHA    = [15.2414, 145.7127];   // 마나가하 섬
  const MANAGAHA_N  = [15.2445, 145.7105];   // 마나가하 북쪽 리프 에지
  const WRECK       = [15.2382, 145.7133];   // 수상기 렉 (±150m 추정)
  const FORBIDDEN_T = [15.1570, 145.7830];   // 포비든 트레킹 입구 (추정) — 현재 옵션 코스
  const FORBIDDEN   = [15.1506, 145.7896];   // 포비든 내추럴 풀 (보정) — 현재 옵션 코스
  const CORAL_OCEAN = [15.1150, 145.7017];   // 코럴 오션 리조트 골프장 (OSM 검증 — 프로샵, 켄싱턴 계열)
  const ILOVESAIPAN = [15.2130, 145.7196];   // 아이러브사이판 (가라판)
  const GARAPAN     = [15.2069, 145.7192];   // 가라판 레스토랑
  const ROTA_AIRPORT= [14.1743, 145.2425];   // 로타 공항
  const SONGSONG    = [14.1367, 145.1408];   // 로타 숙소 (송송 빌리지)
  const PINATANG    = [14.1469, 145.1429];   // 피나탕 파크 (OSM 검증)
  const ROTA_HOLE   = [14.1194, 145.1211];   // 로타 홀 · 푼탄 센하놈 (보정)
  const SWIM_HOLE   = [14.1927, 145.2259];   // 스위밍 홀 (북쪽 해안 — 보정)
  const TETETO      = [14.1728, 145.1897];   // 테테토 비치 (보정)
  const FROM_ICN    = [15.6200, 145.3300];   // 인천 방향 (화면 밖 연출용)

  /* mode: 이전 지점에서 이 지점까지 오는 이동수단 (drive | fly | boat | trek) */
  const DAYS = [
    { label:'Day 1 · 9/10 목', title:'인천 출발 → 사이판으로',
      stops:[
        {n:'인천에서 오는 하늘길', ll:FROM_ICN, virtual:true},
        {n:'사이판 국제공항 (9/11 02:00 도착)', ll:SPN_AIRPORT, mode:'fly'},
      ]},
    { label:'Day 2 · 9/11 금', title:'파우파우 → 그로토 → 라우라우',
      stops:[
        {n:'사이판 국제공항', ll:SPN_AIRPORT},
        {n:'켄싱턴 호텔 체크인', ll:KENSINGTON, mode:'drive'},
        {n:'파우파우 비치 몸풀기 수영', ll:PAUPAU, mode:'drive'},
        {n:'그로토 (빛기둥 프리다이빙)', ll:GROTTO, mode:'drive'},
        {n:'라우라우 베이 🐢', ll:LAULAU, mode:'drive'},
      ]},
    { label:'Day 3 · 9/12 토', title:'로타 이동 · 로타 홀 빛내림',
      stops:[
        {n:'켄싱턴 호텔 (연박 — 짐은 방에)', ll:KENSINGTON},
        {n:'사이판 공항', ll:SPN_AIRPORT, mode:'drive'},
        {n:'로타 공항 (경비행기 30분)', ll:ROTA_AIRPORT, mode:'fly'},
        {n:'로타 숙소 체크인 (송송)', ll:SONGSONG, mode:'drive'},
        {n:'로타 홀 빛내림 ✨ (보트)', ll:ROTA_HOLE, mode:'boat'},
        {n:'피나탕 파크', ll:PINATANG, mode:'drive'},
      ]},
    { label:'Day 4 · 9/13 일', title:'테테토 · 스위밍 홀 → 복귀',
      stops:[
        {n:'로타 숙소', ll:SONGSONG},
        {n:'테테토 비치 아침 수영', ll:TETETO, mode:'drive'},
        {n:'스위밍 홀 (천연 풀)', ll:SWIM_HOLE, mode:'drive'},
        {n:'로타 공항', ll:ROTA_AIRPORT, mode:'drive'},
        {n:'사이판 공항', ll:SPN_AIRPORT, mode:'fly'},
        {n:'켄싱턴 호텔 (인피니티 풀 선셋)', ll:KENSINGTON, mode:'drive'},
      ]},
    { label:'Day 5 · 9/14 월', title:'마나가하 프리다이빙',
      stops:[
        {n:'켄싱턴 호텔 (07:40 출발)', ll:KENSINGTON},
        {n:'찰리독 (08:20 첫 배)', ll:CHARLIE, mode:'drive'},
        {n:'마나가하 섬 🐠', ll:MANAGAHA, mode:'boat'},
        {n:'북쪽 리프 에지 (프리다이빙)', ll:MANAGAHA_N, mode:'trek'},
        {n:'수상기 렉 (옵션 보트)', ll:WRECK, mode:'boat'},
      ]},
    { label:'Day 6 · 9/15 화', title:'코럴 오션 골프 데이 ⛳',
      stops:[
        {n:'켄싱턴 호텔 (이른 출발)', ll:KENSINGTON},
        {n:'코럴 오션 골프장 ⛳ 18홀 라운딩', ll:CORAL_OCEAN, mode:'drive'},
        {n:'켄싱턴 복귀 — 풀 · 스파 마무리', ll:KENSINGTON, mode:'drive'},
      ]},
    { label:'Day 7 · 9/16 수', title:'리조트 모닝 · 가라판 마지막 밤',
      stops:[
        {n:'켄싱턴 리조트 모닝 (인피니티 풀 · 카약)', ll:KENSINGTON},
        {n:'아이러브사이판 쇼핑 🛍️', ll:ILOVESAIPAN, mode:'drive'},
        {n:'가라판 디너 🥂', ll:GARAPAN, mode:'drive'},
        {n:'선셋 크루즈 (옵션) 🌅', ll:CHARLIE, mode:'boat'},
      ]},
    { label:'Day 8 · 9/17 목', title:'새벽 비행기로 귀국',
      stops:[
        {n:'켄싱턴 호텔 체크아웃', ll:KENSINGTON},
        {n:'사이판 공항 (03:05 출발)', ll:SPN_AIRPORT, mode:'drive'},
        {n:'인천으로 🇰🇷', ll:FROM_ICN, virtual:true, mode:'fly'},
      ]},
  ];

  /* 날씨 — 여행 좌표·기간 + 9월 사이판 평년 프리셋 (예보 폴백용) */
  const TRIP = { start:'2026-09-10', end:'2026-09-17', lat:15.19, lon:145.75, tz:'Pacific/Saipan' };
  const WX_FALLBACK = [
    { theme:'sun',     tmax:31, tmin:26, pop:20 },  /* D1 9/10 */
    { theme:'cloud',   tmax:30, tmin:26, pop:40 },  /* D2 9/11 */
    { theme:'rain',    tmax:30, tmin:25, pop:60 },  /* D3 9/12 */
    { theme:'sun',     tmax:31, tmin:26, pop:30 },  /* D4 9/13 */
    { theme:'thunder', tmax:29, tmin:25, pop:70 },  /* D5 9/14 */
    { theme:'cloud',   tmax:30, tmin:26, pop:40 },  /* D6 9/15 */
    { theme:'rain',    tmax:30, tmin:25, pop:60 },  /* D7 9/16 */
    { theme:'sun',     tmax:31, tmin:26, pop:30 },  /* D8 9/17 */
  ];

  return { SPOTS, REFS, SHORTS, DAYS, TRIP, WX_FALLBACK };
})();
