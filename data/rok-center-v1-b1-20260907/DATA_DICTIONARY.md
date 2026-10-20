# 대한민국 공개 입력 계약 — rok-center-v1 (B1 검토 후보)

메인 문구: **자연이 식혀주던 기회는 얼마나 줄었을까요? 한국의 60년 기상자료를 시간으로 바꿔 보았습니다.**

## 공간 범위와 경계

- 경계: geoBoundaries gbOpen KOR ADM0, `KOR-ADM0-49999745`, represented year 2021,
  build Dec 12 2023, 고정 Git commit `9469f09`. 원천 Natural Earth, Public Domain.
- 원문·API·체크섬: `data/reference/boundaries/`의 GeoJSON, provenance.json, LICENSE-SOURCE.md.
- EPSG:4326 격자 중심점에 `geometry.covers(Point)` 적용. 경계 위 포함, 구멍·경계 밖 제외.
  육지에 걸친 셀이라도 중심점이 밖이면 제외한다. 경계 버퍼·보간·nearest-land 보정 없음.
- 같은 `country_mask.csv`를 지도·GeoJSON·GeoParquet·연도 패널·summary에 사용한다.
- Natural Earth 1:10m 계열의 일반화된 지도 경계다. 0.1° 전국 검토 지도에 사용하되 법정 경계,
  지적 경계, 해안 정밀 판정, 행정동 분석을 주장하지 않는다. 도시 내부 해상도는 약 10km다.
- 기존 수집영역 33.0–38.7 N, 125.6–131.0 E만 이용한다. 독도는 **수집 bbox 밖**이다.
  백령도 등 서해 일부 도서도 범위 밖이다. 울릉도·제주는 포함 확인. 작은 도서는 경계에 있어도
  격자 중심점이 없거나 ERA5 마스크가 결측이면 값이 없다. 전 영토 완전 포괄을 주장하지 않는다.
- 선택 중심점 1,002개 중 유효 지표 955셀, 전기간 결측 47셀. 47셀은 그대로 null 유지한다.
  제외된 유효셀 332개 전부를 북한이라고 부르지 않는다(해안 중심점 규칙 등 다른 제외 사유 포함).

## 파일 구성·보존

`data/published/korea/`의 bbox 3종은 **그대로 보존**, 아래 별도 경로에 파생본을 생성한다.

```text
data/published/rok-center-v1/<run-id>/
  korea_grid_standard_comparison.geoparquet
  korea_grid_annual_timeseries.parquet
  korea_grid_map.geojson
  country_mask.csv
  summary.json
  checksums.json
  DATA_DICTIONARY.md
```

기존 지표 열은 산식·값·반올림·null 위치를 바꾸지 않는다. Parquet은 원 테이블의 행만
선택하고 메타데이터를 확장한다. GeoJSON은 기존 반올림 표현을 유지하며 **통계 계산에는
GeoParquet의 비반올림값**을 사용한다. 새 결과 경로가 이미 있으면 실행을 거부한다.

## 데이터 사전

| 파일·필드 | 의미·단위·부호 |
|---|---|
| 공통 `cell_id`, `latitude`, `longitude` | 원 0.1° 중심점 식별자, EPSG:4326 도 |
| GeoParquet `baseline_*`, `current_*` | 1961–1990 / 1991–2020의 유효 연도 평균 |
| `baseline_valid_years`, `current_valid_years` | 기간별 ENCH 유효 연도 수; 0은 지표 0이 아님 |
| `delta_*` | 비교−기준, h/년; ENCH/NCH20 음수=감소 |
| `ench_h_per_year` | 고정 수측 설비의 자연냉각 충족률을 8760시간으로 정규화한 등가시간 |
| `nch20_h_per_year` | KST 21:00–06:59 건구 ≤20°C 비율을 3650시간으로 정규화; 건강·수면 효과 아님 |
| `full_free_h_per_year` | 완전자유냉각 시간 |
| `partial_free_h_per_year` | 부분자유냉각 시간 |
| `full_mechanical_h_per_year` | 완전기계냉각 시간; 위 세 지표 합 8760 |
| `ench_warmed_1k_h_per_year`, `ench_warmed_2k_h_per_year` | 건구·노점을 각각 +1/+2 K, 기압·설비 고정한 조건부 등가시간 |
| `ench_sensitivity_1k_h_per_year` | 현재−현재의 +1 K 실험, 양수=손실, h/년; +1 K에 대한 유한차분 |
| `ench_sensitivity_2k_h_per_year` | +2 K 실험의 총 손실, h/년; 1 K당 값 아님 |
| `ench_sensitivity_2k_to_1k_ratio` | +2 K 총 손실 / +1 K 총 손실, 무차원 |
| 연도 패널 `year`, `valid_hour_fraction`, `source_months` | KST 연도, 유효시간 비율, 원 패널 월 기록(원 형식 유지) |
| 연도 패널 `metric_version`, `scenario_id`, `scenario_config_hash` | 지표·설비 설정 식별자; 혼합 버전은 거부 |
| GeoJSON `ench/nch20_baseline/current/delta_h_per_year` | 위 기간 평균/차이의 3자리 반올림 지도 전용 표현 |
| `country_mask.csv` `included` | 경계 포함 여부; 데이터 유효 여부와 독립 |
| `country_mask.csv` `source_metric_available` | 원 비교기간 ENCH가 null이 아닌지 여부 |
| summary `ench_loss_h_per_year`, `nch20_loss_h_per_year` | 기준−비교로 부호 전환, 양수=손실; 원본 delta 열은 변경하지 않음 |
| summary `full_mechanical_increase_h_per_year` | 비교−기준, 양수=기계냉각 증가 |
| summary `bbox_before`, `rok_after` | 기존 bbox / 국내 선택셀의 min·median·max·count·null_count |
| summary `representative_cells` | 도시 전체 평균이 아닌 서울·대관령·제주 최근접 셀 |
| summary `label_contract` | 지점 정본 서울 연간 114.1, 온난기 113.0의 라벨. 격자값 대체 금지 |
| provenance `dataset_version` | `rok-center-v1`; 공간 선택 계약 버전, 지표는 `metric-v0.1` 유지 |
| provenance `source_provenance`, `source_artifact_sha256` | 입력 bbox의 원 provenance와 3개 파일 SHA-256 |
| provenance `boundary_*`, `selection_rule`, `code_commit_sha` | 경계 ID·버전·체크섬·선택 규칙·실행 코드 |

국내 통계는 **유효 격자 중심점의 비가중 분포**다. 면적가중 평균·전국 총량·인구가중 위험이
아니며 지역별 등가시간을 전국 시간 총량으로 합산하지 않는다. ENCH와 NCH20도 합산하지 않는다.
결측 연도는 0으로 채우지 않고 원 기간 평균 그대로 사용한다. 선택된 955 유효셀은 이번 입력에서
모두 양 기간 30년이 유효하지만 이는 다음 자료 버전에서 재검증할 항목이다.

## 비교 계약·해석 금지선

- 과거 비교: `historical`, 1961–1990과 1991–2020의 연평균 차이. 연간 손실과 60년 누적손실을 혼동하지 않는다.
- 민감도: `uniform_perturbation`, 비교기간 건구·노점 동반 +1/+2 K. 미래 예측 시점·SSP 없음.
- 서울 지점 정본: 연간 **114.1 h/년**, 5~10월 **113.0 h/년**. 국내 격자 연간 손실은
  약 **114.04 h/년**. 소스·정밀도 차이를 명시하며 강제로 같은 반올림값으로 맞추지 않는다.
- “두 배 빨라진다”, “전국이 고민감도”, 민감도를 뜻하는 “추세대로면”은 금지한다.
- R-007의 함의 승온은 동반 섭동의 등가 진폭이지 습구 승온량이 아니다. 같은 ERA5 자료를
  재계산한 진단을 독립 관측 검증으로 부르지 않는다. 괴리 원인은 열린 질문이다.
- 설비 조건을 고정한 기후 입력 비교이며 온실가스 인과 기여, 실제 사용량·소비전력·건강 피해,
  SEEA 표준 적합성 또는 엑서지 파괴량을 직접 검증한 결과가 아니다.

## 재현 및 공개 상태

```sh
uv sync --frozen
uv run python -m climate_ingest.audit_manifests --output /tmp/korea-manifest-audit.json
uv run python -m climate_ingest.domestic --output data/published/rok-center-v1/new-run
uv run coolness-samples signal-check --years 1961:2020 --output data/processed/new-r007/probe.json --report-output data/processed/new-r007/report.md
```

첫 명령 뒤에는 기존 원자료·bbox 공개 패널이 로컬에 있어야 한다. 이 배치는 다운로드하지 않는다.
720개 request manifest와 원자료 SHA/크기는 `data/metadata/korea_manifest_audit_1961_2020.json`으로
검증한다. 최종 파생본은 clean commit에서 생성하고 새 SHA와 입력 SHA를 함께 기록한다.
초안의 `-dirty`는 검토용임을 표시하며 대외 배포하지 않는다.

집계 데이터·소스코드 전체의 공개 라이선스 및 실제 다운로드 호스팅은 후속 B4에서 결정한다.
경계자료 Public Domain 확인이 기후 원자료나 프로젝트 전체의 라이선스 결정은 아니다.
이번 B1/B2 결과는 **로컬 검토 후보**다. 공개 게시 승인·게시 완료를 의미하지 않는다.
