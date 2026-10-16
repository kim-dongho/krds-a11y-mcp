# KRDS 공식 킷 컴포넌트 인벤토리

> - 원천: github.com/KRDS-uiux/krds-uiux — **v1.1.0** (커밋 `d6bb184c823e4757f05807ea4646a23e3133b6e6`, 2026-01-12) · npm 패키지 `krds-uiux`
> - 조사 방법: 저장소 직접 클론 후 파일 전수 조사 (`html/code/*.html` 74개 → 정규 컴포넌트로 그룹화)
> - 킷 구조: `html/code/`(컴포넌트 마크업) · `resources/scss/component/`(스타일 39파셜) · `resources/js/`(ui-script.js + swiper 플러그인) · `tokens/`(figma_token.json, transformed_tokens.json)
> - ID 규약: `krds:<html 파일 기본명>` — 변형은 `#<변형명>` (design.md §2)
> - 작성일: 2026-09-11 · 상태: **v0 확정** — 독립 검증 2종 통과: ① 가이드(krds.go.kr) 대조 — 55종 전수 추출, 국문명 10건 교정, 미구현 12종 확정 ② 전수성 — 74파일 독립 재그룹화 1:1 일치, ui-script.js 실사로 상호작용 분류 5건 정정

## 정규 컴포넌트 (43종)

| ID | 국문명 | 킷 경로 (html/code/) | 변형 | 상호작용 | 비고 |
|----|-------|---------------------|------|---------|------|
| krds:masthead | 공식 배너 (Masthead) | masthead.html | — | 정적 | 공공 사이트 필수 식별 영역 |
| krds:identifier | 운영기관 식별자 | identifier.html | — | 정적 | 푸터 위 운영 주체 표시 |
| krds:header | 헤더 | header.html | — | 동적 | 검색·유틸 포함 |
| krds:footer | 푸터 | footer.html | — | 정적 | |
| krds:skip_link | 건너뛰기 링크 | skip_link.html | — | 정적 | KWCAG 6.4.1 직결 |
| krds:main_menu | 메인 메뉴 | main_menu_pc.html, main_menu_mobile.html | pc, mobile | 동적 | |
| krds:side_navigation | 사이드 메뉴 | side_navigation.html | — | 동적 | |
| krds:breadcrumb | 브레드크럼 | breadcrumb.html | — | 정적 | |
| krds:in_page_navigation | 콘텐츠 내 탐색 | in_page_navigation.html | — | 동적 | |
| krds:pagination | 페이지네이션 | pagination.html | — | 정적 | 링크형 |
| krds:button | 버튼 | button.html 외 5 | hierarchy, icon, size, text, with_icon | 정적(네이티브) | |
| krds:link | 링크 | link.html | no-underline | 정적 | |
| krds:text_input | 텍스트 입력 필드 | text_input.html 외 3 | icon, size, state | 폼 | |
| krds:textarea | 텍스트 영역 | textarea.html | — | 폼 | |
| krds:select | 셀렉트 | select.html 외 3 | size, sorting, state | 폼 | |
| krds:checkbox | 체크박스 | checkbox.html 외 2 | chip, size | 동적(폼) | ui-script.js(krds_chkBox)가 상태 클래스 토글, chip 변형은 formChipFocus() 대상 |
| krds:radio_button | 라디오 버튼 | radio_button.html, radio_chip.html, radio_size.html | chip, size | 폼 | chip 변형은 formChipFocus() JS 적용 대상 |
| krds:toggle_switch | 토글 스위치 | toggle_switch.html, toggle_switch_size.html | size | 동적(폼) | |
| krds:date_input | 날짜 입력 필드 | date_input.html | — | 동적 | 캘린더 연동 |
| krds:calendar | 달력 | calendar.html, calendar_range.html | range | 동적 | |
| krds:file_upload | 파일 업로드 | file_upload.html | — | 동적 | |
| krds:accordion | 아코디언 | accordion.html, accordion_line.html | line | 동적 | |
| krds:tab | 탭 | tab.html | — | 동적 | |
| krds:carousel | 캐러셀 | carousel.html, carousel_banner.html | banner | 동적 | swiper 플러그인 의존. KWCAG 6.2.2 직결 |
| krds:modal | 모달 | modal.html, modal_sample.html | sample | 동적 | 초점 관리 관건 |
| krds:disclosure | 디스클로저 | disclosure.html | — | 동적 | |
| krds:tooltip | 툴팁 | tooltip.html 외 2 | box, vertical | 동적 | |
| krds:coach_mark | 코치마크 | coach_mark.html | — | 동적(킷 JS 미제공) | 컨트롤 마크업만 있고 동작 JS는 킷에 없음 — 사용처가 직접 구현해야 함 |
| krds:contextual_help | 맥락적 도움말 | contextual_help.html | — | 동적 | |
| krds:help_panel | 도움 패널 | help_panel.html | — | 동적 | |
| krds:tutorial_panel | 따라하기 패널 | tutorial_panel.html | — | 동적 | SCSS 파셜 없음(부록 1) |
| krds:critical_alerts | 긴급 공지 | critical_alerts.html | — | 동적(킷 JS 미제공) | 닫기 등 동작 JS가 킷에 없음 — 사용처가 직접 구현해야 함 |
| krds:badge | 배지 | badge.html 외 2 | number, size | 정적 | |
| krds:tag | 태그 | tag.html, tag_link.html | link | 정적 | |
| krds:spinner | 스피너 | spinner.html | in-input, standalone | 정적 | 로딩 상태 표시 |
| krds:step_indicator | 단계 표시기 | step_indicator.html | — | 정적 | |
| krds:structured_list | 구조화 목록 | structured_list.html, structured_list_table.html | table | 정적 | |
| krds:table | 표 | table.html | — | 정적 | KWCAG 5.3.1 직결 |
| krds:text_list | 텍스트 목록 | text_list.html, text_list_ordered.html | ordered | 동적 | ui-script.js(krds_infoList)가 role="list/listitem"을 동적 부여 — 접근성 매핑 시 유의 |
| krds:language_switcher | 언어 변경 | language_switcher.html, language_switcher_page.html | page | 동적 | |
| krds:resize | 화면 크기 조정 | resize.html | — | 동적 | |
| krds:tts | 음성지원 (TTS) | tts.html, tts_icon.html, tts_size.html | icon, size | 동적 | |
| krds:favicon | 파비콘 | favicon.html | — | — | 가이드는 '레이아웃 및 표현' 정규 컴포넌트로 분류 — 매핑에선 페이지 메타 성격 반영 |

## 부록 1 — 킷 내부 불일치 메모

- SCSS 파셜은 39개로 HTML 그룹(43)보다 적다 — 폼 계열이 통합 파셜로 묶임: `_form_check`(checkbox+radio_button), `_input`(text_input·textarea — date_input은 트리거만 `_input`, 팝업 본체는 `_calendar`), `_switch`(toggle_switch), `_form_chip`(chip 변형). 전용 파셜이 없는 것은 `link`·`tutorial_panel`(help_panel 클래스 재사용)·`favicon` 3종
- JS는 컴포넌트별 분리가 아니라 단일 `ui-script.js`(2,664줄) + swiper 플러그인 — 동적 컴포넌트의 접근성 동작(초점 관리 등) 분석 시 이 파일이 유일한 원천. init 모듈 19개: mainMenuPC/Mobile, sideNavigation, tab, accordion, modal, contextualHelp, tooltip, disclosure, dropEvent, calendar, inPageNavigation, adjustContentScale(resize), toggleSwitch, infoList(text_list), chkBox, fileUpload, tts, helpPanel
- **동적 표기지만 킷에 JS가 없는 컴포넌트**: coach_mark, critical_alerts — 마크업만 제공되므로 이 컴포넌트들의 동작 접근성은 사용처 구현에 달려 있다 (매핑표에서 ③범위 밖 성격이 강해짐)

## 부록 2 — 가이드(krds.go.kr) 대조 (검증 완료)

- **가이드 공식 컴포넌트 총수: 55종** (component_summary 페이지의 상세 링크 전수 추출 기준). 설계 문서의 "약 37종"은 오류로 확인 — 정정함
- **킷 43종은 전부 가이드 55종에 1:1 대응** — 킷 전용(가이드에 없는) 컴포넌트는 없음. 43 + 미구현 12 = 55
- 국문명은 가이드 공식 표기로 전면 교정 완료 (10건)

### [킷 미구현] 12종 — 매핑표 v0 범위 제외, 가이드 문서만 존재

| 공식 국문명 | 영문 | 카테고리 |
|---|---|---|
| 이미지 | Image | 레이아웃 및 표현 |
| 플로팅 버튼 | FAB | 액션 |
| 접근 가능한 미디어 | Accessible multimedia | 콘텐츠 |
| 숨긴 콘텐츠 | Visually hidden | 콘텐츠 |
| 범위슬라이드 | Range slider | 모바일 |
| 뒤로가기 버튼 | Back button | 모바일 |
| 바텀시트 | Bottom sheet | 모바일 |
| 수량 토글 | Quantity toggle | 모바일 |
| 토스트 | Toast | 모바일 |
| 스낵바 | Snackbar | 모바일 |
| 탭바 | Tab bars | 모바일 |
| 스플래시 스크린 | Splash screen | 모바일 |

미구현 12종 중 8종이 모바일 전용, 2종(접근 가능한 미디어·숨긴 콘텐츠)은 접근성 기법 성격 — 웹 페이지 매핑표 관점에서 실질 공백은 이미지·플로팅 버튼 정도다. 특히 **이미지와 접근 가능한 미디어는 KWCAG 5.1.1(대체 텍스트)·5.2.1(자막)의 핵심 대상**이므로, 킷 코드가 없어도 매핑표 v1에서 가이드 문서 기반 항목으로 추가할지 검토한다.
