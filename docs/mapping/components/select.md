# select × KWCAG 2.2 매핑

> 기준: 킷 v1.1.0(d6bb184) · KWCAG 2.2(KS X OT0003) · axe-core v4.13.0 · 여기 없는 항목은 전부 N/A. 공통 규칙·부록은 ../component-kwcag-map.md 참조

## krds:select (셀렉트)

- 검토 파일: `html/code/select.html`, `select_size.html`, `select_sorting.html`, `select_state.html` (4파일 전수)
- 변형: 기본(completed/error/disabled), size, **sorting(가시 label 없음)**, state(error)

### ① 자동 충족

| KWCAG                         | 근거                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| kwcag:6.1.1                   | 네이티브 `<select>`/`<option>` — 키보드 조작 브라우저 보장, 커스텀 드롭다운 JS 없음        |
| kwcag:6.5.3 (기본·size·state) | `<label for>`↔`<select id>` 연결 — 가시 레이블이 접근 가능한 이름(레이블이 title보다 우선) |
| kwcag:8.2.1                   | 네이티브 시맨틱 — role·선택 상태 자동, ARIA 미사용                                         |
| kwcag:6.5.2                   | 네이티브 컨트롤 — 브라우저 기본 활성 동작                                                  |

### ② 조건부 — 필수 입력

| KWCAG                         | 필수 입력 필드           | 검증 규칙                                                                                                                                        |
| ----------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| kwcag:7.3.2 (기본·size·state) | labelText, selectId      | 비어있음 금지, for/id 일치                                                                                                                       |
| kwcag:7.3.2 (#sorting)        | accessibleName           | **가시 `<label>` 없음 — `title` 속성만 존재.** 킷 데모 값 "선택"은 목적 불명 — 용도를 서술하는 값 필수 (예: "게시글 정렬 기준"). axe:select-name |
| kwcag:8.1.1                   | selectId                 | 페이지 내 유일 — **킷 데모 자체가 `select.html`과 `select_state.html`에서 `id="select_error"`를 중복 사용** (부록 발견 3). 복붙 시 즉시 위반     |
| kwcag:7.3.1 (#state)          | errorMessage + aria 연결 | text_input#state와 동일 — `form-hint-invalid` 메시지 필수, `aria-describedby`/`aria-invalid`는 킷에 없어 사용자가 추가                           |
| kwcag:7.3.4                   | autocomplete (해당 시)   | 유효 토큰                                                                                                                                        |

### ③ 범위 밖 — 위임

| KWCAG       | 위임처                                                                                                                       |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| kwcag:5.4.3 | axe:color-contrast — **[실측 2026-09-16] 킷 기본(미선택) 상태 글자색이 비활성 토큰이라 미달**: `component.css:9616` `color: var(--krds-form-select--color-text)` = text-disabled(#8A949E), 흰 배경 대비 3.08:1. axe는 셀렉트 화살표 배경 이미지 때문에 incomplete로 보류하고 위반 확정을 못 한다 — 리포트 실측이 검출. 템플릿에서는 text-subtle(gray-70, 8.68:1)로 교정해 동봉 |
| kwcag:6.1.2 (시각 표시) | 수동 체크 — **킷이 전역 `*:focus` outline·box-shadow를 이 컴포넌트에서 제거하고**(`_input.scss:105`, `_select.scss:105`: `outline:none; box-shadow:none`) 테두리 색·굵기(2px) 변경으로 대체. 대체 표시의 대비·식별성 렌더링 후 실측 필요 |
| kwcag:6.1.3 | axe:target-size (옵트인) — #small 변형                                                                                       |
| kwcag:7.2.1 | 수동 체크 — `change` 이벤트만으로 페이지 이동·폼 제출 등 맥락 변화를 일으키지 않는지 (구현자 책임, 킷 JS에는 해당 동작 없음) |

### 미분류 (?)

| KWCAG                  | 질문                                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| kwcag:7.3.2 (#sorting) | 가시 레이블 없이 `title`만으로 "대응하는 레이블 제공"을 충족한 것으로 인정할지? (axe:select-name은 title로 pass하지만 KWCAG 심사 관행은 가시 레이블 또는 aria-label 요구 경향) — **[PoC 실측 2026-09-11]** `axe:label-title-only` **위반 검출**. axe도 title 단독은 불충분으로 판정하므로 ②(accessibleName 필수) 유지가 맞다 |

- 위에 없는 항목: 전부 N/A

---
