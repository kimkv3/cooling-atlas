/* Pure local calculations, shared by the browser and Node unit checks. */
(function (root) {
  'use strict';
  const radians = v => v * Math.PI / 180;
  function distanceKm(lat, lon, a, b) {
    const dlat = radians(a - lat), dlon = radians(b - lon);
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(radians(lat)) * Math.cos(radians(a)) * Math.sin(dlon / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
  }
  function inRing(lon, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x, y] = ring[i], [a, b] = ring[j];
      if ((y > lat) !== (b > lat) && lon < (a - x) * (lat - y) / (b - y) + x) inside = !inside;
    }
    return inside;
  }
  function nearest(data, lat, lon) {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    const polys = data.boundary.type === 'Polygon' ? [data.boundary.coordinates] : data.boundary.coordinates;
    if (!polys.some(p => inRing(lon, lat, p[0]) && !p.slice(1).some(r => inRing(lon, lat, r)))) return null;
    let best = null, distance = Infinity;
    for (const cell of data.cells) {
      const km = distanceKm(lat, lon, cell[1], cell[2]);
      if (km < distance) { best = cell; distance = km; }
    }
    return distance <= data.max_distance_km ? {cell: best, distance} : null;
  }
  function scene(mode, year, view = '3d') {
    year = Math.max(1961, Math.min(2020, Math.round(year)));
    const end = mode === 'annual' ? year : Math.max(1970, year);
    return {year, end, period: mode === 'annual' ? `${year}년` : `${end - 9}–${end} 평균`,
      file: `assets/interactive/${mode === 'annual' ? 'annual' : view === '2d' ? 'flat' : 'decade'}-${end}.webp`};
  }
  function background(progress) {
    const t = Math.max(0, Math.min(1, progress));
    return `rgb(${[ [239,255], [247,240], [255,237] ].map(([a,b]) => Math.round(a + (b-a)*t)).join(', ')})`;
  }
  const api = {distanceKm, inRing, nearest, scene, background};
  if (typeof module !== 'undefined') module.exports = api;
  else root.CRAInteractive = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
