# KRDS 컴포넌트 × KWCAG 2.2 매핑표 v1

> - 기준: KWCAG 2.2 기준표(kwcag22-items.md) · 번역표(kwcag-wcag-axe.md, axe-core v4.13.0) · 킷 인벤토리(krds-components.md, 킷 v1.1.0 커밋 d6bb184)
> - 작성 방법: 그룹별 작성자 5명이 킷 마크업(html/code/)과 ui-script.js를 직접 읽고 분류 — 근거 없는 ① 판정 금지, 확신 없는 셀은 ?로 보류
> - 분류: ① 자동 충족(킷이 보장) / ② 조건부(필수 입력 강제) / ③ 범위 밖(검사층 위임) / N/A / ?(PoC 검증 질문)
> - 각 컴포넌트 섹션에 없는 항목은 전부 N/A다 (섹션 말미 선언 기준)
> - 작성일: 2026-09-11 · 상태: **v1** — 리포트 PoC 실측 반영 (킷 데모 74파일 + krds.go.kr, axe-core 4.13.0)
> - 실측 검증 보고: [poc-verification.md](poc-verification.md) — **① 반증 0건**, `?` 10건 해소, 킷 결함의 공식 사이트 전파 확인
> - 구성: 컴포넌트별 43파일(components/) + 이 색인
> - 검증: ① 적대적 반박(표본 21건 → 8건 강등) · 스키마 정합(ID·필드·N/A 전수, PASS) · 그룹 간 판정 비일관 5건 통일
> - 집계: ① 130 / ② 89 / ③ 124 / ? 41 셀

## 사용법 (이 표가 세 곳에서 소비되는 방식)

- **1층 MCP**: ②의 필수 입력 필드가 get_component 입력 스키마가 된다. ①의 근거는 응답의 "보장 항목" 목록
- **2층 CI / 3층 리포트**: ③의 위임처(axe 규칙)가 검사 범위, 번역표 부록 A(none 13개)가 수동 체크리스트
- **? 셀**: 리포트 PoC(착수 순서 3)에서 검증할 질문 목록 — 해소 전까지 ①로 승격 금지


## 컴포넌트 색인

[masthead](components/masthead.md) · [identifier](components/identifier.md) · [skip_link](components/skip_link.md) · [header](components/header.md) · [footer](components/footer.md) · [main_menu](components/main_menu.md) · [side_navigation](components/side_navigation.md) · [breadcrumb](components/breadcrumb.md) · [in_page_navigation](components/in_page_navigation.md) · [pagination](components/pagination.md) · [button](components/button.md) · [link](components/link.md) · [text_input](components/text_input.md) · [textarea](components/textarea.md) · [select](components/select.md) · [checkbox](components/checkbox.md) · [radio_button](components/radio_button.md) · [toggle_switch](components/toggle_switch.md) · [date_input](components/date_input.md) · [tab](components/tab.md) · [accordion](components/accordion.md) · [disclosure](components/disclosure.md) · [modal](components/modal.md) · [calendar](components/calendar.md) · [file_upload](components/file_upload.md) · [carousel](components/carousel.md) · [tooltip](components/tooltip.md) · [coach_mark](components/coach_mark.md) · [contextual_help](components/contextual_help.md) · [help_panel](components/help_panel.md) · [tutorial_panel](components/tutorial_panel.md) · [critical_alerts](components/critical_alerts.md) · [spinner](components/spinner.md) · [step_indicator](components/step_indicator.md) · [badge](components/badge.md) · [tag](components/tag.md) · [structured_list](components/structured_list.md) · [table](components/table.md) · [text_list](components/text_list.md) · [language_switcher](components/language_switcher.md) · [resize](components/resize.md) · [tts](components/tts.md) · [favicon](components/favicon.md)

---

## 공통 판정 규칙 (전 컴포넌트 적용 — 그룹 간 판정 통일 기준)

크로스체크에서 드러난 그룹별 해석 차이를 다음 규칙으로 통일했다. 새 컴포넌트를 추가할 때도 이 규칙을 따른다.

1. **sr-only는 5.4.1(색 무관 인식)의 ① 근거가 될 수 없다** — 보조기술 전달용일 뿐 시각 단서가 아니다. 선택·현재 상태의 비색상 시각 구분은 항상 ③ 수동 체크 (적대적 검증으로 language_switcher·resize·structured_list#table 3건 강등)
2. **6.1.2는 "시각 표시"와 "초점 관리"를 분리해 판정한다** — 시각 표시는 전역 `*:focus` outline(common.css:1053)이 근거이나, **`.krds-input`·`.krds-form-select`는 킷이 그 outline과 box-shadow를 제거하고**(`_input.scss:105`, `_select.scss:105`) 테두리 변경으로 대체하므로 폼 입력 계열은 ③ 실측. 초점 관리(트랩·복귀)는 해당 JS를 코드로 확인한 경우만 ①
3. **레이블·이름의 "연결 구조"는 ①, "내용"은 항상 ②** — `label for`↔`id` 연결이 킷 마크업에 있어도 텍스트 내용은 사용자 입력이므로 ②(비어있음·placeholder 대체 금지)
4. **네이티브 컨트롤(button·checkbox·radio·select·toggle)의 기본 활성 동작은 ①** — 6.5.2(포인터 입력 취소) 등. 사용자가 mousedown 핸들러를 직접 다는 경우는 컴포넌트 밖 문제로 본다
5. **새 창 고지(7.2.1)**: 킷 마크업이 `target="_blank"`+`title="새 창 열림"`을 고정 제공하는 자리는 ①, 사용자가 링크를 추가·교체하는 자리는 ②(고지 유지 필수)
6. **킷의 "테스트/데모 코드"는 ① 근거가 아니다** — 킷 스스로 데모임을 표기한 코드(예: 캘린더 `example()`)에 의존하는 동작은 ②로 내린다
7. **샘플 인라인 스크립트 의존 동작도 ②** — ui-script.js가 아닌 샘플 파일 인라인 `<script>`가 담당하는 기능(캐러셀 정지/재생)은 복사 누락 시 즉시 위반이므로 필수 입력으로 강제

## 킷 전역 사실 (검증 완료)

- **초점 시각 표시**: 킷 전역 CSS가 `*:focus { outline: 0.2rem solid …; box-shadow: var(--krds-box-shadow-outline) }`를 제공 (`resources/css/common/common.css:1053-1057`). 이 그룹 컴포넌트에는 outline 억제 규칙 없음(억제는 `.krds-input`/`.krds-form-select` 한정) — 6.1.2의 "시각적 구별" 근거로 인용한다.
- **명도 대비(5.4.3)**: 킷 색상 토큰의 4.5:1 충족 여부는 이번 검토에서 실측하지 않았다 — 전 컴포넌트 공통으로 ③ `axe:color-contrast`(렌더링 후 실측)에 위임한다.
- **드롭다운 공통 모듈** `krds_dropEvent` (`ui-script.js:2120-2225`, language_switcher·resize가 사용): `aria-expanded` 토글(:2133, :2189, :2207), ESC 닫기+초점 복귀(:2212-2217), 항목 선택 시 `drop-btn`으로 초점 복귀(:2159-2160), active 항목에 sr-only "선택됨" 주입(:2151-2153).
- **킷 JS 공통 결함(후보)**: `krds_dropEvent.activateMenuItem`이 `<a>`/`<button>`인 `.item-link`에 `aria-selected`를 부여한다(:2178, :2183; `krds_adjustContentScale` md 분기 :2028도 동일). `aria-selected`는 option/tab/gridcell/row 전용 속성 — `axe:aria-allowed-attr` 위반 소지. 해당 컴포넌트(language_switcher, resize)의 미분류(?)에 재기한다.

---

---

# 종합 부록 — 검토 중 발견된 킷 자체 이슈

매핑 작성 중 킷 소스에서 발견된 접근성·품질 이슈. KRDS 킷 저장소에 제보(이슈) 후보이며, MCP가 컴포넌트를 공급할 때 보완 처방을 얹을 근거다.

주요 이슈 (그룹 보고 종합):

- **모달 Escape 닫기 사실상 미동작** — ui-script.js가 keydown 리스너를 `{ once: true }`로 등록해, 모달 열림 후 첫 키가 Escape가 아니면 리스너 소진 (그룹 3)
- **캐러셀 Swiper a11y 기본 메시지가 영어** — 한국어 sr-only를 aria-label이 덮어씀 → init 옵션에 한국어 메시지 지정 필수 (그룹 3)
- **role 없는 요소에 aria-selected 부여** — krds_dropEvent·adjustContentScale (ui-script.js:2028, 2178, 2183) → axe:aria-allowed-attr 위반 소지 (그룹 1·5 공통)
- **오류 상태가 시각 전용** — is-error에 aria-invalid/aria-describedby 연결 없음 (그룹 2)
- **date_input의 킷 자체 TODO** — aria-pressed→aria-selected 교체 미완 (킷 주석 명시, 그룹 2·3)
- **tts#icon 버튼 접근 가능한 네임 전무**, structured_list#table의 빈 label (그룹 5)
- **side_navigation: role=menubar인데 방향키 패턴 미구현** (그룹 1)

**리포트 PoC 실측으로 추가·확정된 이슈 (2026-09-11)**

- **badge·badge#size·pagination의 명도 대비 미달** — 킷 기본 토큰 조합에서 `axe:color-contrast` 위반. 킷을 그대로 써도 5.4.3을 충족하지 못하는 조합이 존재한다
- **structured_list#table의 빈 표 헤더** — `axe:empty-table-header` 위반
- **킷 결함의 공식 사이트 전파 확인** — skip-link 도착지 오류, `li[role=tab]` 내부 button 중첩, 유효하지 않은 `aria-controls` 3건이 krds.go.kr에서 동일 시그니처로 재현됐다. 부품 결함이 페이지로 전파되므로 **생성 시점 교정(1층 MCP)이 사후 검사보다 효율적**이라는 실증 근거다
- **탭·도움패널의 li[role=tab] 내부 button 중첩** — axe:nested-interactive 위반 소지 (그룹 3·4)

### 그룹 1 — 아이덴티티·탐색 (10종)에서 발견

| 위치                                                        | 내용                                                                             | 관련 KWCAG               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------ |
| header.html 403–411 / main_menu_mobile.html 105–113         | `ul.depth4-body` 직계 자식으로 `h4`·`ul` 배치 — HTML 문법 위반                   | kwcag:8.1.1              |
| pagination.html 3                                           | `span`에 `href` 속성                                                             | kwcag:8.1.1              |
| ui-script.js 2178–2183 (krds_dropEvent)                     | role 없는 `a.item-link`에 `aria-selected` 부여 — axe:aria-allowed-attr 위반 소지 | kwcag:8.2.1              |
| side_navigation.html + krds_sideNavigation                  | `role="menubar"/"menuitem"` 사용하나 메뉴 위젯 키보드 패턴(방향키) 미구현        | kwcag:8.2.1              |
| skip_link.html 3                                            | 건너뛰기 기본 대상이 본문이 아닌 `#breadcrumb`                                   | kwcag:6.4.1              |
| breadcrumb.html / pagination.html / in_page_navigation.html | 현재 위치·활성 항목에 `aria-current` 미사용                                      | kwcag:8.2.1, kwcag:5.4.1 |

### 그룹 2 — 액션·폼 (9종)에서 발견

1. **오류 상태의 프로그램적 연결 부재** (text_input#state, select#state): `is-error` 클래스와 `form-hint-invalid` 메시지는 시각 전용 — `aria-describedby`·`aria-invalid`가 킷 마크업에 없어 보조기술 사용자는 오류를 인지 못함. ② 검증 규칙으로 흡수함.
2. **마크업만 있고 JS 없는 동작들**: text_input#icon의 삭제(`btn-delete-input`)·비밀번호 보기 버튼, textarea 글자수 카운터(`.textarea-count`) — `resources/js/` 전체 grep 결과 해당 핸들러 없음. 동작·상태 알림 전부 사용자 구현 영역.
3. **킷 데모 파일 간 id 중복**: `select.html`과 `select_state.html`이 모두 `id="select_error"` 사용 — 복붙 조합 시 kwcag:8.1.1 즉시 위반.
4. **select#sorting은 가시 레이블 없음**: `title="선택"`만 존재 — 7.3.2 충족 인정 여부 정책 결정 필요 (미분류로 상신).
5. **date_input의 킷 자체 TODO**: `ui-script.js` L1270 주석 "btn-set-date: aria-pressed > aria-selected 변경 해야함" — 킷도 미완성으로 인지 중. `div.calendar-wrap[aria-label]`(generic role) prohibited 소지, `input[type=number]`+`YYYY.MM.DD` placeholder 모순도 함께 발견.
6. **`.fieldset`은 실제 `<fieldset>`이 아님**: class명만 fieldset인 `<div>` — 체크박스·라디오 그룹 레이블(legend)은 킷이 제공하지 않음. ② groupLabel로 흡수함.


---

---

# 부록 — 미분류(?) 셀 집계: 리포트 PoC 검증 질문지 (43건)

착수 순서 3(리포트 PoC)에서 실측·실기기 확인으로 해소할 질문들. 해소 전까지 해당 셀의 ① 승격 금지.

| 컴포넌트 | kwcag | 질문 (요지) |
|---|---|---|
| masthead | (변형 등재) | 토글 변형(toggle-wrap)을 #toggle로 등재하고 6.1.1/8.2.1 재분류? |
| skip_link | 6.4.1 | 샘플 href #breadcrumb — 텍스트와 도착지 불일치. 킷 결함 보고 vs 사용 지침? |
| header | 8.1.1 | ul.depth4-body 직계 자식 h4/ul — HTML 문법 위반. 상부 보고? |
| header | 8.2.1 | role 없는 a에 aria-selected 부여 — 킷 JS 결함, ① 불가 보류 |
| footer | 8.2.1 | related_site 레이어 버튼 JS 부재 — ② 승격 vs disclosure 조합? |
| main_menu#pc | 6.4.2 | 서브패널 h2/h3 고정 — 제목 수준 조정 ② vs 페이지 수준 ③? |
| main_menu#mobile | 8.1.1 | depth4-body 문법 위반 (header와 동일) |
| side_navigation | 8.2.1 | role=menubar인데 방향키 미구현 — role 제거 지침 vs 킷 결함 보고? |
| breadcrumb | 8.2.1 | 마지막 항목 aria-current="page" 부재 — ② 승격 vs 킷 개선 요청? |
| in_page_navigation | 6.4.2 | nav 접근 가능한 이름 없음 — aria-label ② vs 개선 요청? |
| in_page_navigation | 8.2.1 | 스크롤스파이 active에 aria-current 미사용 |
| pagination | 8.1.1 | span에 href 속성 — 킷 결함 보고? |
| pagination | 6.4.2 | 래퍼가 div — nav 승격 ② vs 개선 요청? |
| pagination | 8.2.1 | aria-current 없이 class+sr-only |
| textarea | 6.2.1 | 글자수 카운터 잘림 통지 필요 여부 — 킷 스펙 부재 |
| select#sorting | 7.3.2 | title만으로 레이블 인정? — 정책 결정 필요 |
| checkbox | 8.2.1 | 부가 설명 p가 aria-describedby 미연결 — ② 승격? |
| date_input | 7.3.2/8.2.1 | type=number + YYYY.MM.DD placeholder 모순 — 킷 버그, type=text ② 강제? |
| date_input | 5.1.1 | 날짜 셀 이름이 일 숫자뿐 — 수동 vs 이름 규칙 ②? |
| tab | 8.2.1 | li[role=tab] 내부 button 중첩 — axe 실측 후 확정, 업스트림 보고? |
| disclosure | 5.3.2 | 부분 노출 시 inert로 시각/AT 불일치 — 변형 분리? |
| modal | 6.1.1 | Escape 리스너 {once:true} — 사실상 미동작. 업스트림 보고 vs 보완 규칙? |
| modal | 8.2.1 | inert가 #wrap에 걸림 — "#wrap 밖 배치" ② 규칙? aria-modal 미설정 실측? |
| calendar#range | 8.2.1 | aria-pressed(킷 TODO) — 현행 위반 vs 킷 수정 대기? |
| calendar#range | 8.1.1 | type=number→text JS 전환 — 유효성·AT 실측 |
| calendar#range | 6.1.1 | Escape 팝업 미닫힘·그리드 화살표 미구현 |
| file_upload | 8.1.1 | label 내부 button 중첩 — Nu Checker 실측 |
| carousel#banner | 6.1.1 | loop:true 초점 순서 Swiper 의존 — 실측 전 보류 |
| carousel#banner | 6.1.2 | 자동 전환 중 초점 슬라이드 이동 시 초점 유지 실측 |
| tooltip | 8.2.1 | 팝오버 aria-hidden 유지 + role=tooltip 부재 — 스크린리더 실측 |
| coach_mark | 6.4.2 | h5/h6 고정 헤딩 — 레벨 조정 ② 승격? |
| contextual_help | 8.2.1 | role=tooltip인데 상호작용 콘텐츠 — ① 인정 vs 역할 재정의? |
| contextual_help | 6.1.2 | 키보드 이탈 시 초점 복귀 — 실기기 확인, 미보장 시 ② 강등 |
| help_panel | 8.2.1 | li[role=tab] 내 button — sr-only 보완 인정 vs 위반? |
| help_panel | 7.2.1 | PC 로드 시 자동 열림 — 초점 강탈 여부 실사 |
| tutorial_panel | 6.4.2 | 제목 h4와 Task h4 병렬 — 킷 준수 vs 교정 권고? |
| critical_alerts | 6.4.3 | m-hide 클래스 미정의 — 킷 재확인 후 ② 강도 결정 |
| badge#number | (귀속 미정) | 숫자 뱃지 맥락 레이블 — ② 강제 vs N/A? 귀속 항목 확정 필요 |
| tag | 6.1.2 | 삭제 시 초점 관리 — ③ 수동 vs ② 승격? |
| structured_list#table | 8.1.1 | span href + colgroup 열 수 불일치 — 업스트림 vs 사용처 정정? |
| text_list#ordered | 5.3.2 | ol 순번 + span.num 이중 낭독 — 저해 vs 무해 N/A? |
| language_switcher | 8.2.1 | a.item-link에 aria-selected — 업스트림 vs 사용처 정정? |
| resize | 8.2.1 | 동일 aria-selected 문제 — 처리 방침 동일 |
