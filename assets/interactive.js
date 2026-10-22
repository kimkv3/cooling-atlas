(() => {
  'use strict';
  const C = window.CRAInteractive, $ = id => document.getElementById(id);
  const slider = $('year-slider'), frame = $('year-frame'), yearText = $('year-current');
  let mode = 'decade', view = '3d', serial = 0, playing = false, timer, pending;
  const cache = new Map();
  function load(src) {
    if (!cache.has(src)) {
      const image = new Image(); image.src = src;
      const promise = image.decode().then(() => image).catch(error => { cache.delete(src); throw error; });
      cache.set(src, promise);
      if (cache.size > 12) cache.delete(cache.keys().next().value);
    }
    return cache.get(src);
  }
  function stop() { playing = false; clearTimeout(timer); $('year-play').textContent = '재생'; $('year-play').setAttribute('aria-pressed', 'false'); }
  async function render() {
    const token = ++serial, scene = C.scene(mode, Number(slider.value), view);
    $('frame-status').textContent = '장면을 불러오는 중…';
    frame.setAttribute('aria-busy', 'true');
    slider.setAttribute('aria-valuetext', `${scene.year}년 선택 · ${scene.period}`);
    try {
      await load(scene.file);
      if (token !== serial) return;
      frame.src = scene.file;
      frame.alt = `${scene.period} 냉기 자원 변화, 1961–1970 대비. ${view === '3d' ? '아래로 내려갈수록 감소.' : '같은 B 색 범례의 2D 지도.'} 회색은 자료 없음.`;
      yearText.textContent = `${scene.year}`;
      $('year-period').textContent = scene.period + (mode === 'decade' && scene.year < 1970 ? ' · 첫 10년 자료로 표시' : '');
      $('frame-status').textContent = '';
      frame.setAttribute('aria-busy', 'false');
      // Only a neighbour is prefetched, only after user interaction. Never load 60 at startup.
      if (document.activeElement === slider || playing) {
        const next = C.scene(mode, Math.min(2020, scene.year + 1), view);
        if (next.file !== scene.file) load(next.file).catch(() => {});
      }
      if (playing) timer = setTimeout(() => {
        if (Number(slider.value) >= 2020) { stop(); return; }
        slider.value = Number(slider.value) + 1; render();
      }, 350);
    } catch (_) {
      if (token !== serial) return;
      frame.setAttribute('aria-busy', 'false'); stop();
      $('frame-status').textContent = '장면을 불러오지 못했습니다. 연도를 다시 움직여 주세요. 표시된 연도는 현재 그림의 연도입니다.';
    }
  }
  slider.addEventListener('input', () => { stop(); clearTimeout(pending); pending = setTimeout(render, 45); });
  document.querySelectorAll('[name="year-mode"]').forEach(input => input.addEventListener('change', () => {
    stop(); clearTimeout(pending); mode = input.value;
    $('annual-note').hidden = mode !== 'annual';
    $('view-flat').disabled = mode === 'annual';
    if (mode === 'annual') view = '3d';
    updateView(); render();
  }));
  function updateView() {
    $('view-flat').setAttribute('aria-pressed', String(view === '2d'));
    $('view-depth').setAttribute('aria-pressed', String(view === '3d'));
    frame.classList.toggle('flat-frame', view === '2d');
  }
  for (const [id, value] of [['view-flat', '2d'], ['view-depth', '3d']]) $(id).addEventListener('click', () => { stop(); view = value; updateView(); render(); });
  $('year-play').addEventListener('click', () => {
    if (playing) { stop(); return; }
    clearTimeout(pending); playing = true;
    $('year-play').textContent = '일시정지'; $('year-play').setAttribute('aria-pressed', 'true');
    if (Number(slider.value) >= 2020) slider.value = 1961;
    render();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  $('interactive-controls').hidden = false;

  // Build-time CC0 source snapshot; no geocoding or external service at runtime.
  let regions = [];
  fetch('assets/interactive/regions.json').then(r => { if (!r.ok) throw Error('regions'); return r.json(); }).then(result => {
    regions = result.points;
    for (const [i, region] of regions.entries()) $('region-select').add(new Option(region.label, i));
  }).catch(() => { $('location-status').textContent = '대표 지점 목록을 읽지 못했습니다. 페이지를 다시 열어 주세요. 내 위치 버튼은 별도로 사용할 수 있습니다.'; });
  let dataPromise;
  function data() {
    if (!dataPromise) dataPromise = fetch('assets/interactive/cells.json').then(r => { if (!r.ok) throw Error('data'); return r.json(); }).catch(e => { dataPromise = null; throw e; });
    return dataPromise;
  }
  let locationToken = 0;
  function resetLocation(message) {
    $('location-card').hidden = true; $('location-dot').hidden = true; $('location-status').textContent = message;
  }
  async function locate(lat, lon, label, accuracy, token) {
    try {
      const result = C.nearest(await data(), lat, lon);
      if (token !== locationToken) return;
      if (!result) { resetLocation('국내 자료 범위 밖이거나 15km 안에 유효 칸이 없습니다. 아래에서 시·도 대표 지점을 골라 주세요.'); return; }
      const c = result.cell;
      $('location-title').textContent = label;
      $('location-detail').textContent = `가장 가까운 유효 칸 ${c[1]}°N, ${c[2]}°E · 약 ${result.distance.toFixed(1)}km 거리` + (accuracy ? ` · 기기 위치 오차 약 ${Math.round(accuracy)}m` : ' · 행정구역 평균 아님');
      for (const [id, value] of [['loss30',c[3]], ['loss10',c[4]], ['sensitivity1k',c[5]]]) $(id).textContent = value.toFixed(1);
      const dot = $('location-dot'); dot.style.left = `${c[6]*100}%`; dot.style.top = `${c[7]*100}%`; dot.hidden = false;
      $('location-card').hidden = false; $('location-status').textContent = '계산 완료 · 점은 기기 위치가 아닌 선택된 칸의 중심입니다.';
    } catch (_) { if (token === locationToken) resetLocation('자료를 불러오지 못했습니다. 잠시 후 다시 선택해 주세요.'); }
  }
  $('locate-button').addEventListener('click', () => {
    const token = ++locationToken;
    resetLocation('기기의 위치 권한을 확인하는 중…');
    if (!navigator.geolocation) { resetLocation('이 브라우저는 위치 찾기를 지원하지 않습니다. 시·도를 골라 주세요.'); return; }
    navigator.geolocation.getCurrentPosition(pos => locate(pos.coords.latitude, pos.coords.longitude, '내 위치 주변', pos.coords.accuracy, token), err => {
      if (token !== locationToken) return;
      resetLocation(err.code === 1 ? '위치 권한이 거부되었습니다. 아래 시·도 대표 지점으로도 볼 수 있습니다.' : '위치를 찾지 못했습니다. 아래 시·도 대표 지점을 골라 주세요.');
    }, {enableHighAccuracy:false, timeout:10000, maximumAge:0});
  });
  $('region-select').addEventListener('change', () => {
    const token = ++locationToken;
    resetLocation('대표 지점을 계산하는 중…');
    if ($('region-select').value === '') { resetLocation('시·도를 골라 주세요.'); return; }
    const r = regions[Number($('region-select').value)];
    locate(r.lat, r.lon, r.label + ' 대표 지점', null, token);
  });
  $('location-controls').hidden = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let scrollFrame;
  function paint() {
    scrollFrame = null;
    const max = document.documentElement.scrollHeight - innerHeight;
    document.body.style.backgroundColor = C.background(reduced.matches ? 0 : max > 0 ? scrollY / max : 0);
  }
  addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(paint); }, {passive:true});
  addEventListener('resize', paint); reduced.addEventListener('change', () => { stop(); paint(); }); paint();
})();
