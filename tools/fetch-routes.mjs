/* data.js의 drive 구간을 OSRM으로 조회해 js/routes.js를 생성한다.
   사용법: node tools/fetch-routes.mjs js/routes.js
   data.js의 좌표나 drive 구간이 바뀌면 아래 P·LEGS를 맞춰 수정한 뒤 다시 실행할 것. */
import { writeFileSync } from 'node:fs';

const P = {
  SPN_AIRPORT: [15.1190, 145.7290],
  KENSINGTON:  [15.2610, 145.7820],
  PAUPAU:      [15.2527, 145.7748],
  GROTTO:      [15.2604, 145.8239],
  LAULAU:      [15.1627, 145.7623],
  CORAL_OCEAN: [15.1150, 145.7017],
  ILOVESAIPAN: [15.2130, 145.7196],
  GARAPAN:     [15.2069, 145.7192],
  ROTA_AIRPORT:[14.1743, 145.2425],
  SONGSONG:    [14.1367, 145.1408],
  PINATANG:    [14.1469, 145.1429],
  ROTA_HOLE:   [14.1194, 145.1211],
  SWIM_HOLE:   [14.1927, 145.2259],
  TETETO:      [14.1728, 145.1897],
};

const LEGS = [
  ['SPN_AIRPORT','KENSINGTON'],
  ['KENSINGTON','PAUPAU'],
  ['PAUPAU','GROTTO'],
  ['GROTTO','LAULAU'],
  ['KENSINGTON','SPN_AIRPORT'],
  ['ROTA_AIRPORT','SONGSONG'],
  ['ROTA_HOLE','PINATANG'],
  ['SONGSONG','TETETO'],
  ['TETETO','SWIM_HOLE'],
  ['SWIM_HOLE','ROTA_AIRPORT'],
  ['KENSINGTON','CORAL_OCEAN'],
  ['CORAL_OCEAN','KENSINGTON'],
  ['KENSINGTON','ILOVESAIPAN'],
  ['ILOVESAIPAN','GARAPAN'],
];

const key = (a, b) => a[0].toFixed(4) + ',' + a[1].toFixed(4) + '|' + b[0].toFixed(4) + ',' + b[1].toFixed(4);

const out = {};
for (const [fromName, toName] of LEGS) {
  const a = P[fromName], b = P[toName];
  const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.code !== 'Ok' || !json.routes?.length) {
    console.error(`FAIL ${fromName}->${toName}: ${json.code}`);
    continue;
  }
  const r = json.routes[0];
  // GeoJSON은 [lon,lat] — 지도에서 쓰는 [lat,lng]로 변환, 5자리 반올림
  const pts = r.geometry.coordinates.map(c => [+c[1].toFixed(5), +c[0].toFixed(5)]);
  out[key(a, b)] = { dur: Math.round(r.duration), dist: Math.round(r.distance), pts };
  console.log(`OK ${fromName}->${toName}: ${(r.distance/1000).toFixed(1)}km, ${Math.round(r.duration/60)}min, ${pts.length}pts`);
  await new Promise(r => setTimeout(r, 400)); // 데모 서버 예의상 간격
}

const body = Object.entries(out)
  .map(([k, v]) => `  ${JSON.stringify(k)}:{dur:${v.dur},dist:${v.dist},pts:${JSON.stringify(v.pts)}}`)
  .join(',\n');

const file = `/* ═══════════ 실제 도로 경로 — OSRM(OpenStreetMap) 사전 조회 데이터 ═══════════
   tools/fetch-routes.mjs 로 생성. data.js의 좌표가 바뀌면 다시 생성할 것.
   키: "출발lat,출발lng|도착lat,도착lng" (소수 4자리) · dur: 초 · dist: m · pts: [lat,lng][] */
window.SAIPAN_ROUTES = {
${body}
};
`;
writeFileSync(process.argv[2], file);
console.log('written:', process.argv[2]);
