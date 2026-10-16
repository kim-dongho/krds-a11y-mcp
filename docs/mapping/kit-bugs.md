# 킷 버그 감사 기록 (krds-uiux v1.1.0)

> 실사용 테스트와 매핑 작업에서 발견한 킷 자체 결함을 한곳에 모은다. 각 항목은 설치된 킷의 코드 줄로 재확인했고(2026-10-13), 매핑표 판정과 대조한 결과를 함께 적는다. 업스트림(KRDS) 보고는 하지 않았다.

## 판정 대조 요약

| # | 컴포넌트 | 결함 | 매핑표 판정 | 우리 층의 대응 |
|---|---|---|---|---|
| K1 | modal | Escape 닫기가 첫 키 입력 한 번만 동작 | ① 6.1.1 유지 (닫기 버튼으로 충족), Escape는 ③ 수동 체크 | Escape를 보장 근거로 쓰지 않음 |
| K2 | calendar | 날짜 그리드에 화살표 키 이동 없음 | ① 6.1.1 유지 (모든 날짜가 button), 화살표 이동은 ③ 수동 체크 | 권고로만 안내 |
| K3 | tag | 삭제 동작 JS가 없어 삭제 후 초점 관리도 없음 | ③ 6.1.2 수동 체크 (사용처 구현) | 사용처 구현 책임으로 위임 |
| K4 | calendar·date_input | 선택 상태를 aria-pressed로 표시 (킷 자체 TODO) | ? 8.2.1 미해결 유지 | 킷 수정 대기 |
| K5 | tab | li에 role=tab을 주고 안의 button이 초점을 받아 nested-interactive 위반 | 8.2.1 위반 | get_component 조립 지침의 교정 마크업 |
| K6 | 공통 (component.css) | 아이콘 경로 `img/img` 중복으로 로고·아이콘 404 | 5.1.1 등 시각 결함 | get_icon_fix_css·withSiteChrome 자동 교정 CSS |
| K7 | language_switcher 등 드롭다운 | 링크(a.item-link)에 aria-selected 설정 | 8.2.1 (language_switcher·header·resize 판정에 기록) | 킷 동작 정보에 결함으로 표기 |

## 상세

### K1. 모달 Escape 닫기 한 번만 동작

- 위치: `resources/js/component/ui-script.js:935-943`
- 코드: `dialogElement.addEventListener("keydown", …, { once: true })`
- 증상: 모달이 열린 뒤 첫 keydown이 Escape가 아니면(보통 Tab으로 먼저 이동) 리스너가 소진되어 그 뒤 Escape가 반응하지 않는다.
- 판정: KWCAG 6.1.1(키보드 사용 보장)은 모든 기능을 키보드로 쓸 수 있으면 충족한다. 모달 안의 닫기 버튼이 네이티브 button이고 초점 가두기 안에 있으므로 6.1.1은 충족한다. Escape는 편의 기능이라 ① 근거에서 빼고 ③ 수동 체크로 옮겼다.

### K2. 달력 날짜 그리드 화살표 키 이동 없음

- 위치: `krds_calendar`(ui-script.js:1271-1676) 안에 Arrow 키 처리가 하나도 없다.
- 증상: 날짜 이동은 Tab 순회뿐이다. APG grid 패턴(화살표로 날짜 이동)에 못 미친다. Escape는 연·월 선택기만 닫고(ui-script.js:1491-1495) 달력은 확인·취소 버튼으로 닫는다.
- 판정: 모든 날짜가 네이티브 button이고 열기·닫기도 버튼으로 되므로 6.1.1은 충족한다. KWCAG는 특정 키 패턴을 요구하지 않는다. 화살표 이동은 권고로 ③ 수동 체크에 남겼다.

### K3. 태그 삭제 후 초점 유실

- 위치: ui-script.js에 태그 삭제(btn-delete) 모듈이 없다.
- 증상: 사용처가 삭제를 구현하면서 DOM에서 태그를 지우면 초점이 body로 떨어진다.
- 판정: 킷이 보장할 수 없는 사용처 동작이라 ? 에서 ③ 6.1.2 수동 체크로 옮겼다. 삭제 시 다음 태그 또는 태그 목록 컨테이너로 초점을 옮겨야 한다.

### K4. 날짜 선택 상태를 aria-pressed로 표시

- 위치: ui-script.js의 btn-set-date 처리. 킷 주석에 "aria-pressed > aria-selected 변경 해야함"이 남아 있다.
- 판정: 킷도 미완성으로 인지한 상태라 calendar.md·date_input.md의 ? 8.2.1을 그대로 둔다.

### K5. 탭 li에 role=tab

- 위치: `krds_tab`(ui-script.js:704-790)이 li에 role=tab·aria-selected를 주고, 초점은 안의 button이 받는다.
- 판정: axe nested-interactive(8.2.1) 위반. get_component의 krds:tab 조립 지침이 button에 role=tab을 주는 교정 마크업과 동작 스크립트를 공급한다.

### K6. 아이콘 경로 img/img 중복

- 위치: npm판 component.css의 `url(../../img/img/…)`
- 판정: 로고·아이콘이 표시되지 않는다. src/mapping/kit-markup.ts의 iconFixCss·iconFixCssAll이 교정 CSS를 만들고, withSiteChrome 조립 페이지에는 자동 주입된다.

### K7. 드롭다운 링크에 aria-selected

- 위치: `krds_dropEvent`(ui-script.js:2178, 2183)가 `a.item-link`에 aria-selected를 준다. aria-selected는 option·tab·gridcell·row 전용이라 링크에는 axe:aria-allowed-attr 위반 소지가 있다.
- 판정: language_switcher.md:36 등 세 컴포넌트 판정에 이미 기록돼 있다. 킷 동작 정보(src/mapping/kit-behavior.ts)에 결함으로 적었다.

### K8. 폼 안내 문구가 hidden 속성을 무시

- 위치: component.css:8809 `.form-group [class^=form-hint] { display: flex; … }`. 작성자 규칙이 브라우저 기본 `[hidden] { display: none }`보다 우선한다.
- 증상: `.form-group` 안의 `form-hint`·`form-hint-invalid` 등에 hidden을 붙여도 화면에 보인다(2026-10-14 계산 스타일 실측: display flex). 오류가 없는데 오류 문구가 늘 보이거나, 숨긴 줄 아는 문구가 보조기술에 읽힌다.
- 판정: 폼 조립 지침에 "hidden으로 숨기지 말고 렌더하지 않는다"를 넣었다. validate_page가 hidden인데 보이는 요소를 KRDS 사용 문제로 경고한다.

### K9. 탭이 있으면 페이지 목차의 현재 위치 표시가 멈춤

- 위치: ui-script.js:1748 `krds_inPageNavigation.updateActiveSection`. 문서에 `.tab-conts:not(.sample).active`가 하나라도 있으면 그 탭 패널 안의 `.section-link`만 대상으로 삼고, 그 패널에 `data-quick-nav="true"`가 없으면 대상이 비어 갱신하지 않는다.
- 증상: 페이지 목차(in_page_navigation)와 탭을 한 화면에 쓰면 스크롤해도 목차의 active가 첫 항목에 머문다. 탭이 목차 구역 밖에 있어도 같다(2026-10-14 React 실사용, 탭 패널 active를 빼자 정상 전환 확인).
- 판정: 목차의 동작 결함이라 KWCAG 위반은 아니다(현재 위치 표시는 보조 수단). 소비자 우회는 목차와 무관한 탭 패널에 sample 클래스를 붙이는 것인데 킷 데모 표식을 오용하는 방식이라 처방으로 공급하지 않는다.
