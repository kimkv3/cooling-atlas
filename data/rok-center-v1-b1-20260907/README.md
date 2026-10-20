# rok-center-v1 / b1-20260907 — 공개 package review

검토 패키지. 최종 GO·라이선스 결정 전. 원 3종은 바이트 그대로 복사했습니다.

- 입력/버전/설정/경계 SHA: manifest.json의 input_provenance.
- accounting.csv: 서울·대관령·제주 최근접 셀(약 10km 격자).
  baseline=1961-1990, current=1991-2020, loss=baseline-current, h/년.
  ENCH와 NCH20 별도 행, 합산 금지. 도시 전체 평균·건물 판정 불가.
- distribution.csv: 국내 유효 중심점의 비가중 min/median/max, count/null_count.
  loss 양수=감소; full_mechanical_increase 양수=증가.
  sensitivity는 고정 설비·기압, 건구/노점 동반 +1 K 조건부 실험, h/년.
- Parquet delta는 current-baseline. GeoJSON은 지도용 반올림 표현.
- 빈 CSV 숫자는 결측(null), 0 아님. 국토 총합·면적가중 평균 아님.
- 원 summary.json의 bbox_before는 옛 수집 bbox 진단이며 국내 통계가 아님.
  국내값은 rok_after만 사용. 원 status는 생성 당시 검토 상태 그대로 보존.
- country_mask.csv는 원 bbox 전체에 대한 포함 여부; included=true만 국내.
- PROPOSED: 집계 CC BY 4.0. 미발효. Copernicus 원자료 조건 별도.
- 재현: climate_ingest.package_site --source 이_디렉토리 --output 새_디렉토리
  검증: climate_ingest.package_site --verify 이_디렉토리
- manifest는 자신을 제외한 모든 파일의 sha256:hex와 바이트 크기를 기록.
  manifest 자체의 신뢰 기준은 재현 안내에 고정된 Git 커밋.
