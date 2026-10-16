# KRDS 패턴 샘플 실측 (pattern-audit)

> - 수집·실측: 2026-09-14 · 원본 스냅샷: `patterns-src/`(비추적) · 수집 기록: `_collected.json`
> - 용도: 패턴 템플릿 교정의 근거. **원본 샘플은 그대로 공급 금지** — 아래 위반을 교정한 템플릿만 배포한다
> - 엔진: 자체 검사기 (axe-core, site 모드 전수 규칙)


## 요약 — 샘플 33종 전수에서 문제 검출 (깨끗한 샘플 0종)

그중 **KWCAG 검사항목 위반의 직접 근거**(axe 정식 규칙)가 있는 샘플은 22종. 나머지 검출은 모범관행 위반(KWCAG 항목의 정황 근거) 또는 KWCAG 33항목 밖의 접근성 문제다 — 성격 열로 구분한다. 단, 성격과 무관하게 **사용자 영향은 실재**하며(예: 확대 차단은 KWCAG 밖이지만 저시력 사용자를 실제로 배제), 공통 문제 4건은 스냅샷 구조 검증으로 사실 확인됐다(main 부재 33/33, 확대 차단 33/33, 건너뛰기 대상 부재 32/33).

### 전 샘플 공통 문제 — 페이지 골격 교정 한 번으로 일괄 해소

| 문제 | 성격 | 사용자 영향 | 해당 샘플 | 교정 방침 |
|---|---|---|---|---|
| 본문(main) 랜드마크 없음 | KWCAG 6.4.1 관련 정황(모범관행) | 스크린리더가 '본문으로 이동' 기능을 쓸 수 없음 | 33/33종 | 뼈대 교정 — main 요소 포함 |
| 화면 확대 차단 (user-scalable=no) | KWCAG 밖(참고) | 저시력 사용자가 확대를 못 함 | 33/33종 | 뼈대 교정 — 확대 허용 viewport로 치환 |
| 랜드마크 밖에 떠 있는 콘텐츠 | KWCAG 6.4.1 관련 정황(모범관행) | 스크린리더 탐색에서 누락되는 영역 발생 | 33/33종 | 뼈대 교정 — header/main/footer 구조로 감쌈 |
| 건너뛰기 링크가 없는 대상을 가리킴 (#breadcrumb 계열) | KWCAG 6.4.1 관련 정황(모범관행) | 키보드·스크린리더 사용자가 반복 메뉴를 건너뛸 수 없음 | 32/33종 | 뼈대 교정 — #main-content + tabindex=-1로 치환 |
| 입력 필드 레이블을 title 속성으로만 제공 | KWCAG 7.3.2 관련 정황(모범관행) | 보조기술·음성 입력에서 필드 이름 인식 불안정 | 18/33종 | 가시 label 또는 aria-label로 교정 (매핑표 ② 규칙) |

### 샘플별 고유 문제 (공통 문제 제외)

| 샘플 | 고유 문제 | 확인 필요(보류) |
|---|---|---|
| sample_appl_01.html | 텍스트 명도 대비 미달 (4곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (21곳) |
| sample_appl_0101.html | 텍스트 명도 대비 미달 (4곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (21곳) |
| sample_appl_0102.html | 텍스트 명도 대비 미달 (4곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (21곳) |
| sample_appl_0103.html | 텍스트 명도 대비 미달 (4곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (21곳) |
| sample_appl_02.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>구분 안 되는 동일 랜드마크 중복 (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (66곳) |
| sample_appl_0201.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>구분 안 되는 동일 랜드마크 중복 (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (3곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (45곳) |
| sample_appl_03.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (15곳) |
| sample_appl_0301.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (2곳)<br>셀렉트에 접근 가능한 이름 없음 (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (2곳) |
| sample_appl_0302.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (2곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (2곳) |
| sample_appl_0303.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (2곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (2곳) |
| sample_appl_0304.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (12곳) |
| sample_appl_0305.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (11곳) |
| sample_appl_04.html | h1 없음 (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (1곳) |
| sample_login_01.html | 텍스트 명도 대비 미달 (2곳)<br>제목 수준 건너뜀 (h2 다음 h4 등) (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (7곳) |
| sample_login_0101.html | 텍스트 명도 대비 미달 (2곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (9곳) |
| sample_login_02.html | 텍스트 명도 대비 미달 (2곳)<br>제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (2곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (10곳) |
| sample_main_01.html | 요소에 허용되지 않는 role 부여 (16곳)<br>목록(ul/ol) 안에 li 외 요소 (3곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (4곳)<br>h1 없음 (1곳)<br>터치 대상 크기 부족 (18곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (48곳) |
| sample_main_0101.html | 요소에 허용되지 않는 role 부여 (2곳)<br>목록(ul/ol) 안에 li 외 요소 (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (4곳)<br>h1 없음 (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (45곳) |
| sample_main_0102.html | 요소에 허용되지 않는 role 부여 (16곳)<br>목록(ul/ol) 안에 li 외 요소 (3곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (4곳)<br>h1 없음 (1곳)<br>터치 대상 크기 부족 (18곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (40곳) |
| sample_main_02.html | 요소에 허용되지 않는 role 부여 (28곳)<br>목록(ul/ol) 안에 li 외 요소 (5곳)<br>h1 없음 (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (23곳) |
| sample_main_0201.html | 요소에 허용되지 않는 role 부여 (38곳)<br>목록(ul/ol) 안에 li 외 요소 (8곳)<br>h1 없음 (1곳)<br>터치 대상 크기 부족 (5곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (27곳) |
| sample_main_03.html | 요소에 허용되지 않는 role 부여 (16곳)<br>목록(ul/ol) 안에 li 외 요소 (4곳)<br>h1 없음 (1곳)<br>터치 대상 크기 부족 (5곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (24곳) |
| sample_main_0301.html | 요소에 허용되지 않는 role 부여 (16곳)<br>목록(ul/ol) 안에 li 외 요소 (4곳)<br>h1 없음 (1곳)<br>터치 대상 크기 부족 (5곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (24곳) |
| sample_move_process_03.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (7곳) |
| sample_move_process_04.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (2곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (12곳) |
| sample_move_process_05.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>셀렉트에 접근 가능한 이름 없음 (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (12곳) |
| sample_quest_01.html | 텍스트 명도 대비 미달 (4곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (21곳) |
| sample_quest_0101.html | 공통 문제 외 없음 | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (19곳) |
| sample_quest_0102.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (93곳) |
| sample_quest_02.html | 텍스트 명도 대비 미달 (5곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (21곳) |
| sample_search_02.html | 제목 수준 건너뜀 (h2 다음 h4 등) (1곳)<br>탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) (6곳) | aria 속성값 유효성 판정 보류 (5곳)<br>텍스트 명도 대비 미달 (86곳) |
| sample_sub_01.html | h1 없음 (1곳) | aria 속성값 유효성 판정 보류 (5곳) |
| sample_sub_02.html | 구분 안 되는 동일 랜드마크 중복 (1곳) | aria 속성값 유효성 판정 보류 (5곳) |

## sample_appl_01.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_01.html
- 링크한 문서: service_02_02.html, service_02_03.html, service_04_02.html
- **텍스트 명도 대비 미달** `color-contrast` (4곳)
  - `.disabled.secondary[title="부모급여 지원"]`
  - `.disabled.secondary[title="차상위계층확인사업"]`
  - `.structured-item:nth-child(5) > .card-top > .bg-light-disabled.krds-badge`
  - … 외 1곳

## sample_appl_0101.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0101.html
- 링크한 문서: service_02_02.html, service_04_02.html
- **텍스트 명도 대비 미달** `color-contrast` (4곳)
  - `.disabled.secondary[title="부모급여 지원"]`
  - `.disabled.secondary[title="차상위계층확인사업"]`
  - `.structured-item:nth-child(5) > .card-top > .bg-light-disabled.krds-badge`
  - … 외 1곳

## sample_appl_0102.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0102.html
- 링크한 문서: service_02_02.html, service_04_02.html
- **텍스트 명도 대비 미달** `color-contrast` (4곳)
  - `.disabled.secondary[title="부모급여 지원"]`
  - `.disabled.secondary[title="차상위계층확인사업"]`
  - `.structured-item:nth-child(5) > .in > .card-top > .bg-light-disabled.krds-badge`
  - … 외 1곳

## sample_appl_0103.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0103.html
- 링크한 문서: service_02_02.html, service_04_02.html
- **텍스트 명도 대비 미달** `color-contrast` (4곳)
  - `.disabled.secondary[title="부모급여 지원"]`
  - `.disabled.secondary[title="차상위계층확인사업"]`
  - `.structured-item:nth-child(5) > .in > .card-top > .bg-light-disabled.krds-badge`
  - … 외 1곳

## sample_appl_02.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_02.html
- 링크한 문서: global_06.html, service_04_03.html, service_05_03.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `#section_01 > h3`
- **구분 안 되는 동일 랜드마크 중복** `landmark-unique` (1곳)
  - `.krds-main-menu`

## sample_appl_0201.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0201.html
- 링크한 문서: global_06.html, service_04_03.html, service_05_03.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `#section_01 > .sec-tit`
- **구분 안 되는 동일 랜드마크 중복** `landmark-unique` (1곳)
  - `.krds-main-menu`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (3곳)
  - `#tab01`
  - `#tab02`
  - `#tab03`

## sample_appl_03.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_03.html
- 링크한 문서: service_04_04.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.step-type > .conts-wrap > .conts-wrap > .sec-tit`

## sample_appl_0301.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0301.html
- 링크한 문서: global_08.html, service_04_05.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.outline-tit`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (2곳)
  - `#helperTab01`
  - `#helperTab02`
- **셀렉트에 접근 가능한 이름 없음** `select-name` (1곳)
  - `#addr-select`

## sample_appl_0302.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0302.html
- 링크한 문서: global_08.html, service_04_05.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.outline-tit`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (2곳)
  - `#helperTab01`
  - `#helperTab02`

## sample_appl_0303.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0303.html
- 링크한 문서: global_08.html, service_04_05.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.outline-tit`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (2곳)
  - `#helperTab01`
  - `#helperTab02`

## sample_appl_0304.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0304.html
- 링크한 문서: global_08.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.sec-tit`

## sample_appl_0305.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_0305.html
- 링크한 문서: global_08.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.sec-tit`

## sample_appl_04.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_appl_04.html
- 링크한 문서: service_04_06.html, service_04_07.html, service_04_08.html
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`

## sample_login_01.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_login_01.html
- 링크한 문서: service_03_04.html
- **텍스트 명도 대비 미달** `color-contrast` (2곳)
  - `.link.medium.krds-btn:nth-child(1) > .underline`
  - `li[role="listitem"]:nth-child(2) > .link.medium.krds-btn:nth-child(2) > .underline`
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `li:nth-child(1) > .certify-opt-tit`

## sample_login_0101.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_login_0101.html
- 링크한 문서: service_03_05.html, service_03_06.html, service_03_07.html
- **텍스트 명도 대비 미달** `color-contrast` (2곳)
  - `.link.medium.krds-btn:nth-child(1) > .underline`
  - `li[role="listitem"]:nth-child(1) > .link.medium.krds-btn:nth-child(2) > .underline`

## sample_login_02.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_login_02.html
- 링크한 문서: service_03_04.html
- **텍스트 명도 대비 미달** `color-contrast` (2곳)
  - `.link.medium.krds-btn:nth-child(1) > .underline`
  - `li[role="listitem"]:nth-child(1) > .link.medium.krds-btn:nth-child(2) > .underline`
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `#panel_login_01 > h3`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (2곳)
  - `#tab_login_01`
  - `#tab_login_02`

## sample_main_01.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_01.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (16곳)
  - `.swiper-slide-active[aria-label="1 / 6"][data-swiper-slide-index="0"]`
  - `.swiper-slide-next[aria-label="2 / 6"][data-swiper-slide-index="1"]`
  - `.swiper-slide[aria-label="3 / 6"][data-swiper-slide-index="2"]`
  - … 외 13곳
- **목록(ul/ol) 안에 li 외 요소** `list` (3곳)
  - `#swiper-wrapper-12b1092c4666d7b9c`
  - `#swiper-wrapper-ac48a26ac59641e9`
  - `#swiper-wrapper-d775e93b9f26f9010`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (4곳)
  - `#newsTab01`
  - `#newsTab02`
  - `#newsTab03`
  - … 외 1곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`
- **터치 대상 크기 부족** `target-size` (18곳)
  - `.contents-list > .swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination `
  - `.contents-list > .swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination `
  - `.contents-list > .swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination `
  - … 외 15곳

## sample_main_0101.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_0101.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (2곳)
  - `li[aria-label="1 / 2"]`
  - `li[aria-label="2 / 2"]`
- **목록(ul/ol) 안에 li 외 요소** `list` (1곳)
  - `#swiper-wrapper-a88f65be092f995f`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (4곳)
  - `#newsTab01`
  - `#tab0302`
  - `#tab0303`
  - … 외 1곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`

## sample_main_0102.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_0102.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (16곳)
  - `.swiper-slide-active[aria-label="1 / 6"][data-swiper-slide-index="0"]`
  - `.swiper-slide-next[aria-label="2 / 6"][data-swiper-slide-index="1"]`
  - `.swiper-slide[aria-label="3 / 6"][data-swiper-slide-index="2"]`
  - … 외 13곳
- **목록(ul/ol) 안에 li 외 요소** `list` (3곳)
  - `#swiper-wrapper-3d6ed43a079d1c6a`
  - `#swiper-wrapper-3f94b743881010334c`
  - `#swiper-wrapper-f2dee7b05efede10a`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (4곳)
  - `#newsTab01`
  - `#tab0302`
  - `#tab0303`
  - … 외 1곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`
- **터치 대상 크기 부족** `target-size` (18곳)
  - `.contents-list > .swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination `
  - `.contents-list > .swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination `
  - `.contents-list > .swiper-pagination-clickable.swiper-pagination-bullets.swiper-pagination `
  - … 외 15곳

## sample_main_02.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_02.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (28곳)
  - `#swiper-wrapper-479641fbf377e173 > .swiper-slide-active[aria-label="1 / 2"][data-swiper-sl`
  - `#swiper-wrapper-479641fbf377e173 > .swiper-slide-next[aria-label="2 / 2"][data-swiper-slid`
  - `#swiper-wrapper-812f2e2ef119ecf6 > .swiper-slide-active[aria-label="1 / 2"][data-swiper-sl`
  - … 외 25곳
- **목록(ul/ol) 안에 li 외 요소** `list` (5곳)
  - `#swiper-wrapper-3b1018e27b510d7eb9`
  - `#swiper-wrapper-479641fbf377e173`
  - `#swiper-wrapper-77cc2dbda3db0640`
  - … 외 2곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`

## sample_main_0201.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_0201.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (38곳)
  - `.swiper-slide-active[aria-label="1 / 6"][data-swiper-slide-index="0"]`
  - `.swiper-slide-next[aria-label="2 / 6"][data-swiper-slide-index="1"]`
  - `#swiper-wrapper-1cb371a4d6f7136c > .swiper-slide-active[aria-label="1 / 2"][data-swiper-sl`
  - … 외 35곳
- **목록(ul/ol) 안에 li 외 요소** `list` (8곳)
  - `#swiper-wrapper-1cb371a4d6f7136c`
  - `#swiper-wrapper-32f103f221ea8cc12`
  - `#swiper-wrapper-49174494bdb210214`
  - … 외 5곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`
- **터치 대상 크기 부족** `target-size` (5곳)
  - `.swiper-pagination-bullet-active`
  - `span[aria-label="Go to slide 2"]`
  - `span[aria-label="Go to slide 3"]`
  - … 외 2곳

## sample_main_03.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_03.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (16곳)
  - `.swiper-slide-active[aria-label="1 / 6"][data-swiper-slide-index="0"]`
  - `.swiper-slide-next[aria-label="2 / 6"][data-swiper-slide-index="1"]`
  - `#swiper-wrapper-61c5f752d9f610ef3 > .swiper-slide-active.swiper-slide[aria-label="1 / 6"]`
  - … 외 13곳
- **목록(ul/ol) 안에 li 외 요소** `list` (4곳)
  - `#swiper-wrapper-61c5f752d9f610ef3`
  - `#swiper-wrapper-68ea179449f8a91f`
  - `#swiper-wrapper-8f98ea3fdb39d69b`
  - … 외 1곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`
- **터치 대상 크기 부족** `target-size` (5곳)
  - `.swiper-pagination-bullet-active`
  - `span[aria-label="Go to slide 2"]`
  - `span[aria-label="Go to slide 3"]`
  - … 외 2곳

## sample_main_0301.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_main_0301.html
- 링크한 문서: service_01_02.html
- **요소에 허용되지 않는 role 부여** `aria-allowed-role` (16곳)
  - `.swiper-slide-active[aria-label="1 / 6"][data-swiper-slide-index="0"]`
  - `.swiper-slide-next[aria-label="2 / 6"][data-swiper-slide-index="1"]`
  - `#swiper-wrapper-7ed0774236981d1c > .swiper-slide-active[aria-label="1 / 2"][data-swiper-sl`
  - … 외 13곳
- **목록(ul/ol) 안에 li 외 요소** `list` (4곳)
  - `#swiper-wrapper-7ed0774236981d1c`
  - `#swiper-wrapper-88210649cc862b430`
  - `#swiper-wrapper-a2e55ed2e9af289d`
  - … 외 1곳
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`
- **터치 대상 크기 부족** `target-size` (5곳)
  - `.swiper-pagination-bullet-active`
  - `span[aria-label="Go to slide 2"]`
  - `span[aria-label="Go to slide 3"]`
  - … 외 2곳

## sample_move_process_03.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_move_process_03.html
- 링크한 문서: service_04_05.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.sec-tit`

## sample_move_process_04.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_move_process_04.html
- 링크한 문서: service_04_05.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.sec-tit`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (2곳)
  - `#helperTab01`
  - `#helperTab02`

## sample_move_process_05.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_move_process_05.html
- 링크한 문서: service_04_05.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `.sec-tit`
- **셀렉트에 접근 가능한 이름 없음** `select-name` (1곳)
  - `#addr-select`

## sample_quest_01.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_quest_01.html
- 링크한 문서: global_10.html, service_02_05.html, service_02_07.html
- **텍스트 명도 대비 미달** `color-contrast` (4곳)
  - `.disabled.secondary[title="부모급여 지원"]`
  - `.disabled.secondary[title="차상위계층확인사업"]`
  - `.structured-item:nth-child(5) > .card-top > .bg-light-disabled.krds-badge`
  - … 외 1곳

## sample_quest_0102.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_quest_0102.html
- 링크한 문서: service_02_04.html, service_02_05.html, service_02_06.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `dd > .filter-list.krds-accordion.type-line > .li.accordion-item.active > .accordion-header`

## sample_quest_02.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_quest_02.html
- 링크한 문서: global_10.html, service_02_05.html, service_02_07.html
- **텍스트 명도 대비 미달** `color-contrast` (5곳)
  - `.structured-item:nth-child(5) > .card-body > .c-btn > .disabled.secondary[title="다문화가족 자녀 `
  - `.structured-item:nth-child(5) > .card-top > .bg-light-disabled.krds-badge`
  - `.structured-item:nth-child(6) > .card-body > .c-btn > .disabled.secondary[title="다문화가족 자녀 `
  - … 외 2곳

## sample_search_02.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_search_02.html
- 링크한 문서: service_02_03.html, service_02_04.html, service_02_05.html, service_02_06.html, service_02_08.html
- **제목 수준 건너뜀 (h2 다음 h4 등)** `heading-order` (1곳)
  - `#totalTabpanel01 > h3`
- **탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)** `nested-interactive` (6곳)
  - `#totalTab01`
  - `#totalTab02`
  - `#totalTab03`
  - … 외 3곳

## sample_sub_01.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_sub_01.html
- 링크한 문서: service_03_02.html
- **h1 없음** `page-has-heading-one` (1곳)
  - `html`

## sample_sub_02.html — 고유 문제 상세

- URL: https://www.krds.go.kr/html/pattern/sample_sub_02.html
- 링크한 문서: service_03_02.html
- **구분 안 되는 동일 랜드마크 중복** `landmark-unique` (1곳)
  - `.krds-main-menu`

## 별건 — 킷 npm 패키지 결함 (템플릿 작업 중 발견, 2026-09-14)

- **아이콘 경로 버그**: krds-uiux v1.1.0 npm판 `component.css`의 아이콘 참조 206곳이 `url(../../img/img/…)`로 `img` 세그먼트가 중복돼 404로 깨진다(오류 표시 없이 아이콘만 사라짐) (breadcrumb 홈·구분자, 체크박스 체크 표시, 셀렉트 화살표 등 33종). krds.go.kr 배포판 CSS에는 없는 npm 패키징 결함 — 킷을 npm으로 쓰는 모든 소비처에 영향. 템플릿에서는 화면에 보이는 곳만 올바른 경로로 재선언해 우회한다
- **패턴 레이아웃 CSS 미동봉**: 패턴 샘플이 쓰는 `resources/css/pattern/output.css`(803KB)는 가이드 사이트 전용으로 npm에 없다 — 샘플 마크업을 복사한 소비자는 레이아웃이 깨진다. 템플릿에는 scripts/extract-pattern-css.ts가 필요한 규칙만 발췌해 동봉한다
- **셀렉트 기본 글자색 대비 미달** (2026-09-16 리포트 실측 발견): `.krds-form-select`의 기본 색이 비활성 토큰(`--color-text-disabled` #8A949E)이라 흰 배경 대비 3.08:1로 KWCAG 5.4.3 미달 — 활성 컨트롤의 미선택 상태에 적용되므로 예외(비활성 컴포넌트)에 해당하지 않는다. `:focus`·`.completed`에서만 진해진다 (`component.css:9616`). axe는 화살표 배경 이미지 때문에 incomplete로 보류해 위반 확정을 못 하고, 리포트의 실측(단색 배경 대비 계산)이 검출했다. 템플릿 3종(apply-form·apply-list·search-results)에서 text-subtle(gray-70, 8.68:1)로 교정

## OpenWAX 교차검증 — 템플릿 11종 1회전 (2026-09-16)

- 방법: goonoo/OpenWAX(N-WAX 계보, 커밋 085c44f) 엔진 `lib/Section.js`+`lib/Sections.js`를 Playwright로 프리뷰에 주입, 자동 판정 13섹션의 pass/fail 수집 (도구성 3섹션 grayscale·contrast·validation 제외, UI·외부 로깅 미호출). 원본 출력: `openwax-run-20260916.md`
- 결과: 실 결함 1건 발견·교정, 나머지는 데모 플레이스홀더 기인
  - **[교정] apply-form 셀렉트 2개 label 0/2** — aria-label 교정안을 OpenWAX가 레이블로 인정하지 않음 (label 판정은 `<label>` 연결·title만 인정, `lib/Sections.js` label 섹션). axe·접근성 트리는 통과했으나 국내 심사 도구 관행을 따라 **sr-only `<label for>` 연결로 재교정** → 2/2. 변환 규칙 지시문에도 "aria-label만으로는 부족" 반영
  - **[비결함] skipNav fail 66건** — 전부 데모 콘텐츠의 `href="#"` 플레이스홀더. OpenWAX는 `a[href^="#"]` 전부를 제자리 앵커로 보고 대상 존재를 확인한다. 실제 건너뛰기 링크(#main-content)는 전 템플릿 연결 확인(pass). 소비 시 실 URL로 교체되는 슬롯 몫 — 변환 규칙 지시문에 교체 지시 추가
- 그 외 섹션(altText·pageTitle·blockTitle·linkText·pageLang·table·frame·kbdFocus·unintendedFunction) 전 템플릿 fail 0
- 스크린리더 확인은 verify:a11y 접근성 트리 검증으로 갈음한다 — 트리는 스크린리더의 입력이라 이름·상태·랜드마크·위계 검증은 결정적이나, 발화의 자연스러움·청감 판정은 불가. 실청취(VoiceOver 1회)는 9/28 실사용 테스트에서 수행

## 부록 — 규칙 ID 대조

| axe 규칙 | 문제 | 성격 | 교정 방침 |
|---|---|---|---|
| `aria-allowed-role` | 요소에 허용되지 않는 role 부여 | KWCAG 밖(참고) | role 제거 또는 올바른 요소로 교체 |
| `color-contrast` | 텍스트 명도 대비 미달 | KWCAG 5.4.3 위반 근거 | 킷 토큰 내 충족 조합으로 교체, 대안 없으면 보류 기록 |
| `heading-order` | 제목 수준 건너뜀 (h2 다음 h4 등) | KWCAG 6.4.2 관련 정황(모범관행) | 제목 위계 재조정 |
| `label-title-only` | 입력 필드 레이블을 title 속성으로만 제공 | KWCAG 7.3.2 관련 정황(모범관행) | 가시 label 또는 aria-label로 교정 (매핑표 ② 규칙) |
| `landmark-one-main` | 본문(main) 랜드마크 없음 | KWCAG 6.4.1 관련 정황(모범관행) | 뼈대 교정 — main 요소 포함 |
| `landmark-unique` | 구분 안 되는 동일 랜드마크 중복 | KWCAG 6.4.1 관련 정황(모범관행) | aria-label로 구분 |
| `list` | 목록(ul/ol) 안에 li 외 요소 | KWCAG 밖(참고) | 목록 구조 정리 |
| `meta-viewport` | 화면 확대 차단 (user-scalable=no) | KWCAG 밖(참고) | 뼈대 교정 — 확대 허용 viewport로 치환 |
| `nested-interactive` | 탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함) | KWCAG 8.2.1 위반 근거 | role을 초점 요소로 이동 (KRDS 운영팀 수정 예고분) |
| `page-has-heading-one` | h1 없음 | KWCAG 밖(참고) | 뼈대 교정 — h1 포함 |
| `region` | 랜드마크 밖에 떠 있는 콘텐츠 | KWCAG 6.4.1 관련 정황(모범관행) | 뼈대 교정 — header/main/footer 구조로 감쌈 |
| `select-name` | 셀렉트에 접근 가능한 이름 없음 | KWCAG 7.3.2,8.2.1 위반 근거 | label 연결 (매핑표 ② 규칙) |
| `skip-link` | 건너뛰기 링크가 없는 대상을 가리킴 (#breadcrumb 계열) | KWCAG 6.4.1 관련 정황(모범관행) | 뼈대 교정 — #main-content + tabindex=-1로 치환 |
| `target-size` | 터치 대상 크기 부족 | KWCAG 6.1.3 위반 근거 | 크기·간격 확보 (24px 기준) |
