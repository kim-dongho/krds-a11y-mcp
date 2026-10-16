# KWCAG ↔ WCAG ↔ axe-core 번역표

> - 기준: KWCAG 2.2 (KS X OT0003) · WCAG 2.1 (일부 항목은 WCAG 2.2 유래 — 부록 B) · **axe-core v4.13.0** (rule-descriptions 기준)
> - 용도: axe 검출 결과(WCAG 태그)를 KWCAG 검사항목 번호로 번역. 행은 KWCAG 기준 33행 고정
> - 커버리지: `full`(항목 요건을 기계가 완전 판정) / `partial`(요건 일부·형식만 검사) / `none`(해당 axe 규칙 없음 → 부록 A 수동 체크리스트로)
> - axe 규칙 표기: `(exp)` experimental — 기본 비활성 / `(BP)` best-practice 태그 — WCAG 태그 없음 / `(dep)` deprecated / `(옵트인)` 기본 비활성
> - 작성일: 2026-09-11 · 상태: **v0 확정** — 독립 검증 2종 통과: ① KWCAG↔WCAG 대응 (W3C WCAG 2.1/2.2 원문 대조, PASS) ② axe 규칙 실재·태그·상태 (v4.13.0 태그 고정 원문 대조 — 태그 불일치 3건·누락 2건 발견, 반영 완료)

## 번역표 (33행)

### 인식의 용이성

| KWCAG | WCAG SC | axe 규칙 | 커버리지 | 비고 |
|-------|---------|---------|---------|------|
| kwcag:5.1.1 적절한 대체 텍스트 제공 | wcag:1.1.1 | axe:image-alt, axe:input-image-alt, axe:object-alt, axe:svg-img-alt, axe:role-img-alt, axe:aria-meter-name, axe:aria-progressbar-name | partial | 존재·비어있음만 검출. 내용 적절성(무의미한 alt)은 수동. 이미지맵 area는 axe:area-alt(2.4.4 태그) 참조 |
| kwcag:5.2.1 자막 제공 | wcag:1.2.1, wcag:1.2.2, wcag:1.2.3 | axe:video-caption | partial | track 요소 존재만. 자막 내용·대본·수어는 수동. axe:audio-caption은 (dep) |
| kwcag:5.3.1 표의 구성 | wcag:1.3.1 (표 관련 부분) | axe:td-headers-attr, axe:th-has-data-cells, axe:table-fake-caption (exp), axe:td-has-header (exp), axe:scope-attr-valid (BP) | partial | 헤더 셀 연결 구조만. 표 구성의 이해 용이성은 수동 |
| kwcag:5.3.2 콘텐츠의 선형구조 | wcag:1.3.2 | — | none | DOM 순서와 의미 순서 일치를 판정하는 규칙 없음 |
| kwcag:5.3.3 명확한 지시사항 제공 | wcag:1.3.3 | — | none | 감각 특성 의존 여부는 기계 판정 불가 |
| kwcag:5.4.1 색에 무관한 콘텐츠 인식 | wcag:1.4.1 | axe:link-in-text-block | partial | 본문 내 링크의 색 단독 구분만 검출. 그 외 색 의존(차트·상태 표시 등)은 수동 |
| kwcag:5.4.2 자동 재생 금지 | wcag:1.4.2 | axe:no-autoplay-audio | partial | 3초 초과 자동재생 audio/video 검출 — 요건과 정렬. 스크립트 동적 재생은 미검출 |
| kwcag:5.4.3 텍스트 콘텐츠의 명도 대비 | wcag:1.4.3 | axe:color-contrast | partial | 판정 가능 케이스는 정확하나 이미지 속 텍스트·그라데이션 배경 등은 incomplete 처리 |
| kwcag:5.4.4 콘텐츠 간의 구분 | — (KWCAG 고유) | — | none | WCAG 직접 대응 없음. 시각 검토로만 판정 |

### 운용의 용이성

| KWCAG | WCAG SC | axe 규칙 | 커버리지 | 비고 |
|-------|---------|---------|---------|------|
| kwcag:6.1.1 키보드 사용 보장 | wcag:2.1.1 | axe:scrollable-region-focusable, axe:frame-focusable-content, axe:server-side-image-map | partial | 구조적 키보드 불가 패턴만. 실제 조작 가능성은 수동(키보드 실사용) |
| kwcag:6.1.2 초점 이동과 표시 | wcag:2.1.2, wcag:2.4.3, wcag:2.4.7 | axe:focus-order-semantics (exp), axe:tabindex (BP) | partial | WCAG 태그 규칙 없음 — 참고 규칙만. 초점 트랩·시각적 초점 표시·순서 적절성은 수동 |
| kwcag:6.1.3 조작 가능 | wcag:2.5.5 (AAA) / wcag2.2:2.5.8 | axe:target-size (옵트인, wcag22aa) | partial | target-size는 기본 비활성 — 우리 검사층에서 활성화 필요. 6mm는 KWCAG 권장 기준 |
| kwcag:6.1.4 문자 단축키 | wcag:2.1.4 | — | none | axe:accesskeys(BP)는 accesskey 중복 검사로 요건과 무관 |
| kwcag:6.2.1 응답시간 조절 | wcag:2.2.1 | axe:meta-refresh | partial | meta refresh만. 세션 타임아웃·스크립트 시간 제한은 수동 |
| kwcag:6.2.2 정지 기능 제공 | wcag:2.2.2 | axe:blink, axe:marquee | partial | 구식 요소만 검출. 캐러셀·자동 슬라이드의 제어 수단은 수동 |
| kwcag:6.3.1 깜빡임과 번쩍임 사용 제한 | wcag:2.3.1 | — | none | 깜빡임 빈도(초당 3~50회) 판정 규칙 없음. blink/marquee는 2.2.2 소속 |
| kwcag:6.4.1 반복 영역 건너뛰기 | wcag:2.4.1 | axe:bypass, axe:skip-link (BP), axe:landmark-* (BP), axe:region (BP) | partial | 메커니즘 존재만. 건너뛰기 동작 확인은 수동 |
| kwcag:6.4.2 제목 제공 | wcag:2.4.2 | axe:document-title, axe:frame-title, axe:frame-title-unique, axe:empty-heading (BP), axe:heading-order (BP) | partial | 페이지·프레임 제목 존재만. 콘텐츠 블록 제목과 제목의 적절성은 수동. ※ frame-title(-unique)의 axe 태그는 wcag412 — 내용 기준으로 이 행에 배치 (부록 C-5) |
| kwcag:6.4.3 적절한 링크 텍스트 | wcag:2.4.4 | axe:link-name, axe:area-alt, axe:identical-links-same-purpose (옵트인, AAA, wcag:2.4.9) | partial | 링크 텍스트 존재만. 용도 이해 가능성은 수동 |
| kwcag:6.4.4 고정된 참조 위치 정보 | — (EPUB 유래, KWCAG 채택) | — | none | 전자출판문서 대상. 웹 페이지 일반에는 N/A인 경우가 많음. WCAG 2.2 초안 SC(Fixed Reference Points, 최종판 미채택) 경유 |
| kwcag:6.5.1 단일 포인터 입력 지원 | wcag:2.5.1 (참고: wcag2.2:2.5.7 Dragging Movements) | — | none | 제스처 대체 수단은 기계 판정 불가 |
| kwcag:6.5.2 포인터 입력 취소 | wcag:2.5.2 | — | none | 이벤트 바인딩 방식 판정 규칙 없음 |
| kwcag:6.5.3 레이블과 네임 | wcag:2.5.3 | axe:label-content-name-mismatch (exp) | partial | experimental — 우리 검사층에서 활성화 여부 결정 필요 |
| kwcag:6.5.4 동작기반 작동 | wcag:2.5.4 | — | none | 기기 동작 감지는 기계 판정 불가 |

### 이해의 용이성

| KWCAG | WCAG SC | axe 규칙 | 커버리지 | 비고 |
|-------|---------|---------|---------|------|
| kwcag:7.1.1 기본 언어 표시 | wcag:3.1.1 | axe:html-has-lang, axe:html-lang-valid, axe:html-xml-lang-mismatch | full | 33개 중 유일한 full. 단 "잘못된 언어 지정"(한국어 페이지에 lang="en")은 미검출 |
| kwcag:7.2.1 사용자 요구에 따른 실행 | wcag:3.2.1, wcag:3.2.2 | — | none | 초점·입력 시 맥락 변화는 동적 행위 — 기계 판정 불가 |
| kwcag:7.2.2 찾기 쉬운 도움 정보 | wcag2.2:3.2.6 | — | none | WCAG 2.2 유래(부록 B). 페이지 간 일관성은 사이트 수준 수동 |
| kwcag:7.3.1 오류 정정 | wcag:3.3.1, wcag:3.3.3 | — | none | 오류 안내 품질은 수동 |
| kwcag:7.3.2 레이블 제공 | wcag:3.3.2 | axe:label, axe:select-name, axe:form-field-multiple-labels, axe:label-title-only (BP) | partial | 레이블 존재·연결만. 레이블 내용 적절성은 수동. ※ label·select-name의 axe 태그는 wcag412 — 내용 기준으로 이 행에 배치 (부록 C-5) |
| kwcag:7.3.3 접근 가능한 인증 | wcag2.2:3.3.8 | — | none | WCAG 2.2 유래(부록 B). 인증 흐름 평가는 수동 |
| kwcag:7.3.4 반복 입력 정보 | wcag2.2:3.3.7 | axe:autocomplete-valid (간접, wcag:1.3.5) | partial | autocomplete 속성 유효성만 — 요건(재입력 방지)과는 간접 관계. 실질 판정은 수동 |

### 견고성

| KWCAG | WCAG SC | axe 규칙 | 커버리지 | 비고 |
|-------|---------|---------|---------|------|
| kwcag:8.1.1 마크업 오류 방지 | wcag:4.1.1 (WCAG 2.2에서 삭제된 SC) | axe:duplicate-id (dep), axe:duplicate-id-active (dep), axe:list, axe:listitem, axe:definition-list, axe:dlitem | partial | 범용 id 중복 규칙은 deprecated — 주 검사 수단은 W3C validator (RFP "W3C 문법 오류 0건" 요건과 연결). 현역 규칙 axe:duplicate-id-aria는 ARIA 참조 한정이라 8.2.1에 배치. KWCAG에는 여전히 존재하므로 행 유지. 목록 구조 규칙 4종(태그 wcag131)은 HTML 내용 모델 위반(ul·ol 직계에 li 외 요소, dl 직계에 dt·dd 외 요소)이라 KWCAG 8.1.1 정의의 "중첩 관계" 오류에 해당 — W3C validator도 같은 마크업을 오류로 잡는다 (2026-10-13 배치, 실사용 axe:list 위반이 "참고"로 빠져 gate가 세지 않던 문제) |
| kwcag:8.2.1 웹 애플리케이션 접근성 준수 | wcag:4.1.2 | axe:aria-allowed-attr, axe:aria-required-attr, axe:aria-required-children, axe:aria-required-parent, axe:aria-roles, axe:aria-deprecated-role, axe:aria-valid-attr, axe:aria-valid-attr-value, axe:aria-hidden-body, axe:aria-hidden-focus, axe:aria-conditional-attr, axe:aria-prohibited-attr, axe:aria-command-name, axe:aria-input-field-name, axe:aria-toggle-field-name, axe:aria-tab-name, axe:aria-tooltip-name, axe:aria-braille-equivalent, axe:button-name, axe:input-button-name, axe:select-name, axe:summary-name, axe:nested-interactive, axe:duplicate-id-aria | partial | axe 규칙이 가장 많은 항목 — ARIA 사용의 형식 오류는 폭넓게 검출. 위젯 동작(키보드 인터랙션 패턴)은 수동. ※ aria-required-children/parent의 axe 태그는 wcag131 — 내용 기준으로 이 행에 배치 (부록 C-5) |

## 부록 A — 커버리지 none 집계 (13개 → 수동 체크리스트 원천)

| KWCAG | 수동 확인 방법 (요지) |
|-------|---------------------|
| kwcag:5.3.2 | 스크린리더/CSS 제거 상태에서 읽기 순서 확인 |
| kwcag:5.3.3 | 지시문이 색·모양·위치 없이 성립하는지 검토 |
| kwcag:5.4.4 | 이웃 콘텐츠 경계의 시각적 구분 검토 |
| kwcag:6.1.4 | 단축키 목록화 후 해제·재설정 수단 확인 |
| kwcag:6.3.1 | 깜빡이는 콘텐츠 유무 및 빈도 확인 |
| kwcag:6.4.4 | (전자출판문서 한정) 페이지 이동·참조 위치 확인 |
| kwcag:6.5.1 | 제스처 기능의 단일 포인터 대체 수단 확인 |
| kwcag:6.5.2 | 클릭 다운 상태에서 이탈 시 실행 취소 확인 |
| kwcag:6.5.4 | 동작 기반 기능의 UI 대체·감지 해제 확인 |
| kwcag:7.2.1 | 초점 이동·입력만으로 새 창/이동이 없는지 확인 |
| kwcag:7.2.2 | 도움 정보의 페이지 간 위치 일관성 확인 |
| kwcag:7.3.1 | 오류 발생 시 안내·정정 수단 확인 |
| kwcag:7.3.3 | 인증 과정의 인지 테스트 의존·대체 수단 확인 |

집계: **full 1 / partial 19 / none 13** — 기준표(auto 1 / partial 18 / manual 14)와의 차이는 6.1.2(참고 규칙 존재→partial), 7.3.4(간접 규칙→partial) 등 경계 항목의 분류 관점 차이이며, "기계 단독 완전 판정 1개"라는 결론은 동일하다.

## 부록 B — WCAG 2.2 유래 항목 (3개)

KWCAG 2.2는 WCAG 2.1 기반이지만, 신설 9개 중 3개는 **WCAG 2.2**에서 왔다. WCAG 2.1 태그만 보는 도구·자료와 대조할 때 이 3개는 대응이 없는 게 정상이다:

| KWCAG | WCAG 2.2 SC |
|-------|-------------|
| kwcag:7.2.2 찾기 쉬운 도움 정보 | 3.2.6 Consistent Help (A) |
| kwcag:7.3.3 접근 가능한 인증 | 3.3.8 Accessible Authentication (Minimum) (AA) |
| kwcag:7.3.4 반복 입력 정보 | 3.3.7 Redundant Entry (A) |

**번호 재배정 주의**: WCAG 2.2 **초안** 시절에는 3.3.7이 Accessible Authentication, 3.3.8이 Redundant Entry였고 최종 권고안에서 맞바뀌었다. KWCAG 2.2 제정 시기(초안 시절)에 작성된 국내 자료 다수가 초안 번호를 쓰므로, 국내 자료와 이 표의 번호가 어긋나 보이면 이 표(최종판 기준)가 맞다.

## 부록 C — 검사층 설정 결정 사항

1. **활성화 필요**: axe:target-size (기본 비활성, wcag22aa 태그) — 6.1.3 검사에 필요
2. **활성화 검토**: experimental 규칙 (label-content-name-mismatch, focus-order-semantics 등) — 오탐률 확인 후 결정
3. **W3C validator 병행**: 8.1.1은 axe deprecated — Nu HTML Checker 등 별도 도구로 검사 (RFP 요건이기도 함)
4. **KWCAG에 직접 대응 없는 axe 규칙** — 위반 시 리포트에 "참고" 등급으로 표기 검토: axe:css-orientation-lock (exp, wcag134), axe:autocomplete-valid (wcag135 — 7.3.4에 간접 연결됨), axe:meta-viewport (wcag144), axe:avoid-inline-spacing (wcag1412), 그리고 axe:p-as-heading (exp, wcag131). KWCAG에는 일반적 "정보와 관계" 항목이 없다. 목록 구조 규칙 4종(list·listitem·definition-list·dlitem)은 2026-10-13에 8.1.1(중첩 관계 오류)로 배치했다
5. **번역기 구현 원칙 (확정)**: axe 결과의 **WCAG 태그 기반 라우팅 금지 — 규칙 ID → KWCAG 직접 매핑**으로 구현한다. 근거: 태그와 내용이 어긋나는 규칙이 실재 (frame-title/label/select-name은 태그 wcag412지만 내용상 6.4.2/7.3.2, aria-required-children/parent는 태그 wcag131이지만 내용상 8.2.1). 이 표의 행 배치가 곧 규칙 ID 매핑의 원본이다
