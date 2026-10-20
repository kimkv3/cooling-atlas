# P1-051 재현 계약 — 집계 입력부터, 버전 고정

상태: 검토 패키지. 원자료 다운로드·전국 재계산·외부 게시는 이번 배치에서 하지 않았다.
집계 패널을 얻는 경로와 원자료부터 전 과정을 재처리하는 경로를 구분한다.

## 1. 새 환경에서 입력 패널 얻기

현재 레포는 private이다. 아래 명령은 **이미 접근 권한이 있는 사람**의 새 환경용이다.
토큰을 명령이나 URL에 넣지 않는다. 공개 독자는 https://kimkv3.github.io/cooling-atlas 의 데이터 다운로드 절에서 검토 패키지를 받을 수 있다.
공개 미러 `kimkv3/cooling-atlas`와 GitHub Pages를 사용하며 검토 워터마크를 유지한다.
코드 저장소의 비공개 상태는 유지한다. 이 시간 시각화 개편의 미러 반영은 별도 검토 뒤 진행한다.

```sh
git clone https://github.com/kimkv3/coolness_resource_atlas.git
cd coolness_resource_atlas
git checkout --detach a603b72dcbd9117d85ef35bb142338a4799b6720
uv sync --frozen --group render
uv run --frozen --group render python -m climate_ingest.package_site --verify site/data/rok-center-v1-b1-20260907
```

이 고정 커밋에는 3종 집계 패널과 생성 코드·uv.lock·경계·검토 미디어가 모두 있다.
`git pull`이나 가변 `main`을 데이터 버전 고정의 대용으로 쓰지 않는다.
시간 시각화의 코드 핀은 아래 3.1절의 별도 manifest를 따른다. 입력 취득 핀은 위 커밋이다.
uv 및 Python 3.11+는 별도 설치 전제이며 명령은 새 환경에서 의존성 네트워크 접근을 할 수 있다.
초기 P1-051 실행은 기존 환경과 `--offline`만 사용했다. 이번 표시 용어 재렌더는 기존 입력과 `--frozen --group render`로 실행했다.

검증 명령은 manifest의 파일별 SHA-256·크기, 원 checksums, Parquet/GeoJSON provenance,
마스크 셀 집합, 버전 혼합 여부, 연도키를 확인하고 CSV를 Parquet에서 다시 계산해 대조한다.
manifest 자체의 신뢰 기준은 위 불변 Git 커밋이다. manifest는 자기 자신을 해시하지 않는다.
`assembly.generator_sha256`는 조립 코드 내용 해시이며 원 지표 생성 커밋과 구분된다.
기존 릴리즈 README와 manifest는 조립 당시 이력으로 바이트 그대로 보존한다.
README의 당시 라이선스 상태 대신 현재 루트/site의 LICENSE-DATA(2026-10-20 발효)를 따른다.
현재 생성기로 새 경로에 조립하면 README는 발효 상태이고 생성기 해시도 달라진다.
이는 기존 데이터 릴리즈나 그 manifest를 갱신한다는 뜻이 아니다.

입력 경로는 `site/data/rok-center-v1-b1-20260907/`이다. 기존 ignored
`data/published/`나 원자료가 없어도 아래 집계 단계 재현은 가능하다.

## 2. 표·분포 재생성 — 산식 재계산 아님

```sh
uv run --frozen python -m climate_ingest.package_site --source site/data/rok-center-v1-b1-20260907 --output /tmp/cra-p1051-reproduced
uv run --frozen python -m climate_ingest.package_site --verify /tmp/cra-p1051-reproduced
diff site/data/rok-center-v1-b1-20260907/accounting.csv /tmp/cra-p1051-reproduced/accounting.csv
diff site/data/rok-center-v1-b1-20260907/distribution.csv /tmp/cra-p1051-reproduced/distribution.csv
```

출력 경로가 존재하면 거부한다. 새 경로를 선택한다. 3종은 복사만 하고 지표값·메타데이터·null을
수정하지 않는다. `--index site/index.html`을 추가하면 표시 영역만 CSV와 같은 계산으로 채운다.
회계표는 비반올림 GeoParquet 기반이며 HTML 표시만 소수 1자리다. CSV는 원 정밀도를 유지한다.
`summary.json`의 과거 bbox 진단을 국내 통계로 인용하지 않는다.

## 3. 검토 지도·영상 재현

```sh
uv run --frozen --group render python -m climate_ingest.render_static --source site/data/rok-center-v1-b1-20260907 --output /tmp/cra-p1051-static --font assets/fonts/pretendard/Pretendard-Regular.otf
uv run --frozen --group render python -m climate_ingest.render_timelapse --source site/data/rok-center-v1-b1-20260907 --output /tmp/cra-p1051-timelapse --font assets/fonts/pretendard/Pretendard-Regular.otf --fps 8
```

현재 표시를 재현하려면 각 미디어 manifest의 생성 커밋에서 실행한다. 정적/수준 영상은 각각
`render-manifest.json`의 `render_code_commit_sha`, `timelapse-manifest.json`의 `code_commit_sha`를 따른다. 위 입력 취득 핀은 데이터용이며
그 옛 커밋에는 새 폰트가 없다. `assets/fonts/pretendard/SOURCE.md`에 고정 버전·원문
OFL 1.1·취득일·해시를 기록했다. `--font`를 생략해도 벤더링 Pretendard v1.3.9 Regular가
기본값이다(소스 체크아웃 기준). 명시 경로는 계속 허용하며 별도 사용권 확인이 필요하다.
과거 B2R은 AppleGothic, 현재 site는 Pretendard이므로 픽셀/바이트 해시는 다르다.
지표 계산은 동일하다. 색은 30항의 빨강 통일, 표시 용어는 31항의 시간량으로 갱신했다.
플랫폼·Matplotlib·ffmpeg 차이까지 비트 동일성을 보장하지 않는다.

공개 렌더 기능은 두 명령 모두 `--release`다. 워터마크와 면책을 공개 문구로 바꾸고
manifest status를 `release_render`로 표시한다. **P1-051에서는 실행하지 않았다.** 최종 GO 뒤
검토 담당자가 클린 커밋·새 경로에서 실행하고 검수한다. 입력 상태 메타데이터는 역사 기록으로 그대로 둔다.
정적 지도·수준 영상은 P1-053 OFL 폰트 검토본을 바탕으로 이번 표시 용어를 재렌더한 검토본이다. `--release`는 사용하지 않았다.
`render-manifest.json`과 `timelapse-manifest.json`에 폰트·이미지·프레임 해시를 기록한다.
과거 `docs/results/b2-review*`는 이력으로 보존하며 재렌더하지 않았다.

## 3.1 시간 시각화 검토 미디어 (2026-10-20)

생성 커밋과 코드·팔레트 해시는 `assets/time-viz-manifest.json`에 기록한다.
입력 릴리즈는 위와 같고 `input_sha256`에 릴리즈 manifest·연간 패널·마스크 해시가 있다.
기존 시제품의 입력 manifest와 같은 릴리즈인지 확인한 뒤 지도·막대·줄무늬·편차 영상을 빨강/흰색/파랑으로 재생성한다.

```sh
uv run --frozen --group render python -m climate_ingest.time_viz_site --output /tmp/cra-time-site-review
```

새 출력 경로만 허용하며 워터마크 제거 옵션은 없다. 십년 편차 지도·막대를 새 레이아웃으로 렌더하고,
방법론용 줄무늬와 선택 재생 편차 영상을 준비한다. `public_files`에 나열된 8개 파일과
`time-viz-manifest.json`만 site/assets에 설치한다. 폰트는 기존 Pretendard를 사용한다.
사이트용 지도는 1440×690 / 780×960, 막대는 1440×740 / 780×850 PNG다.
같은 출력 디렉터리의 `03-maps-desktop.png`·`03-maps-mobile.png`는 제목 겹침을 수정한 별도 전체 카드 검토본이다.

HTML은 직접 관리한다. `package_site.update_html`은 ACCOUNTING / DISTRIBUTION / DOWNLOADS
세 블록만 갱신하며, 시간 흐름을 생성하거나 데이터 릴리즈를 덮어쓰지 않는다.
헤드라인 91시간량(1.5%)은 30년 평균 비교, 지도·막대는 1961–1970 대비 완결 십년 비교다.
수치 산식·색 범위는 방법론의 시간 시각화 절과 새 manifest에 기록했다. 기존 데이터 해시는 유지한다. 미디어는 색을 바꾸어 재생성하므로 새 해시를 기록한다.

### 3.2 빨강 통일과 3D B판 (2026-10-20 21:25)

공통 색상은 `climate_ingest.cooling_palette`에 있다. 2D는 빨강 #b2182b / 0 흰색 / 파랑 #2879bd,
3D B는 손실 −110의 #08306b / 0의 #2879bd / 125 흰색 / 260의 #b2182b다.
팔레트만 바꾸며 수치·고정 범위·눈금은 유지한다. 원본 3D 코드는 PR #12의
`4e33ce2921b8ebdb6e786752fa16d0d84c169afe:scripts/render_cooling_3d.py`에서 B 부분만 가져왔다.
원본 스크립트 SHA와 출처, 재생성 코드·입력·미디어 SHA는 `assets/cooling-3d-manifest.json`에 있다.
A판 미디어는 편입하지 않는다.

```sh
uv run --frozen --group render python -m climate_ingest.render_static --source site/data/rok-center-v1-b1-20260907 --output /tmp/cra-red-static
uv run --frozen --group render python -m climate_ingest.cooling_3d --output /tmp/cra-red-b
```

모두 새 출력 경로에서 검토용 워터마크를 유지해 렌더한다(`--release` 미사용).
정적 지도 3장과 manifest를 교체하고, `B_animation.mp4`→`cooling-3d-b.mp4`,
`B_final.png`→`cooling-3d-b-final.png` 및 3D manifest를 site/assets에 설치한다.
포스터는 MP4 최종 프레임(239)을 디코딩한 PNG다. 3D GIF·CSV는 검토 산출물에만 남긴다.

### 3.3 표시 용어: 냉기 자원 / 시간량 (2026-10-20 21:33–21:41)

사이트는 자연이 식혀 주던 능력을 “냉기 자원”, 부분 자연냉각 기여의 환산량을 “시간량”으로
표시한다. 절반만 식혀 준 2시간은 1시간량이다. 연간 값·편차·민감도 축은 시간량/년이며,
서늘한 밤의 실제 시계 시간을 세는 NCH20만 시간/년이다. 두 양은 합산하지 않는다.
영문 지표명과 기술 약어는 방법론의 지표 정의에 제시한다. 기계 판독 필드명·수치 단위(h/year)·
데이터 파일은 바꾸지 않는다. 시간량은 단위 표시 이름이며 새 계산이나 배율이 아니다.
헤드라인의 “한 해 평균”은 두 표준 30년 기간의 연평균 차이이지 매년 줄어드는 속도가 아니다.
지도·막대·줄무늬·3D B 및 방법론의 수준 영상까지 한국어 표시를 재렌더한다.
기존 빨강·파랑/흰색, 모든 수치·범위·눈금·축·프레임·워터마크는 유지한다.

## 4. 로컬 미리보기

검토하려는 코드 커밋의 작업 트리에서:

```sh
python -m http.server 8051 --bind 127.0.0.1 --directory site
```

브라우저에서 `http://127.0.0.1:8051/`와 `/methodology.html`을 연다. JavaScript·외부 폰트·CDN이
필요 없다. 28항의 공개 전용 미러 + GitHub Pages로 게시할 파일은
`tools/publish_site.py`의 허용 목록으로 새 로컬 경로에 준비한다. 내부 검토 문서는 제외한다.
시간 시각화 개편에서는 새 로컬 경로의 미러 파일 준비만 확인하며 실제 공개 미러 push는 하지 않는다.
검토본을 이용한 이해 시험 뒤 최종판 전환을 별도로 판단한다. 이번 개편에서도 검토 워터마크를 제거하지 않는다.

## 5. 원자료부터의 완전 재현과 720 manifest 문제

9/6 논의의 “월 manifest 1개만 추적”은 당시 상태다. **9/17 실측은 720개 모두 Git 추적**이다.
B1에서 이미 보강되었다. 이번 배치에서는 월 manifest를 한 개도 추가·수정하지 않았다.

```sh
git ls-files 'data/metadata/manifests/era5_land/region/korea/*/*.json' | wc -l
```

원 NetCDF/Zarr는 Git에 없다. 위 집계 패널 취득은 시간별 원자료부터의 end-to-end 재현이 아니다.
기존 월 요청/원자료 SHA/크기는 `data/metadata/korea_manifest_audit_1961_2020.json`과
`data/metadata/manifests/`에 있다. 원자료가 없는 환경에서 요청만 재전송하면 공급자 갱신으로
바이트가 달라질 수 있다. 이 배치에서는 재다운로드하거나 동일 바이트 취득 가능성을 시험하지 않았다.

**용우 결정용 해결안만 제안:** 현재 작은 720 manifest는 그대로 유지하고, 향후 원자료 보관이
필요하면 이용조건을 확인한 저장소에 content-addressed 아카이브와 월별 SHA 인덱스를 두는 안을
검토한다. 커질 경우 연도별 manifest 묶음과 묶음 checksum을 Git에 두는 대안이 있다. 비용·보존기간·
재배포 권한·공개 범위는 미정. 원자료·추가 manifest·저장소 설정은 이 배치에 포함하지 않는다.

## 6. 발효 라이선스와 별도 상류 조건

루트 LICENSE / LICENSE-DATA / NOTICE와 site/ 복사본은 내용이 같다.
코드 MIT / 프로젝트 산출 집계 데이터·지도·영상 CC BY 4.0(2026-10-20 발효) — 용우 승인, DECISIONS 29항.
저작자 표기는 Yongwoo Kim, Cooling Resource Atlas (냉기 자원 지도)이며 릴리즈 식별자는
rok-center-v1 / b1-20260907, metric-v0.1, waterside_reference_v1이다.
공개 검토본 주소는 https://kimkv3.github.io/cooling-atlas 이다.
ERA5-Land·Copernicus 조건과 귀속·면책, 경계·폰트의 별도 조건은 유지한다.
과학적 타당성 보증이나 외부 게시 승인을 뜻하지 않는다. Copernicus 수집 당시 적용 조건의
정확한 버전·재배포 적합성 확인은 별도로 남아 있다. P1-053에서는 2026-09-21 당시
CDS 라이선스·약관을 직접 확인했다. 당시 ERA5-Land 표시 라이선스는 CC BY 4.0이나
실제 취득 계정의 동의 일시·revision은 미확인이다. 원문 인용·대조는 코드 저장소의
`docs/licensing/copernicus-evidence.md`를 참조한다.
경계 출처/라이선스 확인은 기존 B1 기록을 이용했다. 폰트는 저장소에 OFL 원문과 함께
벤더링하되 site에는 래스터 결과만 포함한다.
