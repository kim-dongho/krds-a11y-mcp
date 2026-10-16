// 생성 파일 — 직접 수정하지 말 것.
// 원본: docs/mapping/components/*.md · 재생성: pnpm build:mapping
import type { ComponentMapping } from "./component-mapping-types.js";

export const COMPONENT_MAPPINGS: ComponentMapping[] = [
  {
    "componentId": "krds:accordion",
    "name": "아코디언 — line",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "트리거가 네이티브 `<button>` — 클릭 핸들러만으로 토글 (L846–847), 키보드 기본 동작으로 조작 가능",
        "scope": "#line"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "토글 시 초점 이동 없음(초점 유지), 초점 순서 = DOM 순서. 숨은 패널로의 초점 유입 없음(collapse는 CSS 접힘 + 내부에 초점 요소 없는 샘플)",
        "scope": "#line"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "JS가 aria-expanded 토글 (L804, L815) 및 `aria-controls`/`id`/`role=\"region\"`/`aria-labelledby` 자동 부여 (setupAriaAttributes L850–858). singleOpen 시 다른 항목의 aria-expanded도 동기화 (L806–813)",
        "scope": "#line"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "accordionTitle, headingLevel",
        "rule": "버튼 텍스트(=블록 제목) 비어있음 금지 — 8.2.1의 button-name도 동일 텍스트로 커버. 샘플은 `<h5>` 고정 — 문서 제목 위계에 맞는 headingLevel 조정 필요",
        "scope": "#line"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast",
        "scope": "#line"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:badge",
    "name": "뱃지",
    "auto": [
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "정적 `<span class=\"krds-badge …\">` 텍스트 마크업 — id·속성 중복, 중첩 오류 없음 (badge.html 전체)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:5.4.1",
        "field": "labelText",
        "rule": "비어있음 금지. danger/warning/success 등 색상 변형의 의미가 텍스트 자체로 전달돼야 함(같은 텍스트를 색만 바꿔 상태 구분 금지 — 적절성은 수동 확인)"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast — 27개 색상 변형 × 3크기의 킷 토큰 대비 미실측, 렌더링 후 실측"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:breadcrumb",
    "name": "브레드크럼",
    "auto": [
      {
        "kwcagId": "kwcag:6.4.2",
        "evidence": "`<nav aria-label=\"현재 경로\">` 고정 제공 — 영역 이름이 마크업에 내장"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "evidence": "`<ol>` 순서 목록 — 경로 위계가 DOM 순서로 표현됨(컴포넌트 범위 내)"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<a href>`"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "crumbLabel (각 항목 텍스트) + href",
        "rule": "비어있음 금지, 실제 경로명·목적지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "킷 샘플이 마지막 항목(현재 페이지)을 일반 링크로 두고 `aria-current=\"page\"`를 제공하지 않음 — ②(필수 입력: currentPage에 aria-current)로 승격할지, 킷 개선 요청으로 보고할지?"
      }
    ]
  },
  {
    "componentId": "krds:button",
    "name": "버튼",
    "auto": [
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "네이티브 `<button>` — 브라우저 기본 활성이 업 이벤트 기반이며 다운 상태 이탈 시 미실행. checkbox·radio·select·toggle_switch와 동일 기준 (사용자가 mousedown 핸들러를 직접 다는 경우는 컴포넌트 밖 문제)"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "전 변형이 네이티브 `<button type=\"button\">` — 키보드 초점·Enter/Space 활성이 브라우저 보장"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "scope": "#text, #with_icon",
        "evidence": "아이콘이 빈 `<i class=\"svg-icon\">` + CSS 배경 — 접근성 트리에 미노출, 버튼의 가시 텍스트가 이름을 제공. #icon 변형은 ②로 분리"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "scope": "#text, #with_icon 등 텍스트 변형",
        "evidence": "접근 가능한 이름 = 요소 콘텐츠(가시 텍스트) — 가시 레이블이 네임에 자동 포함. #icon 변형은 가시 레이블 없음(해당 없음)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "buttonText (텍스트 변형)",
        "rule": "비어있음 금지 (axe:button-name). 이름 외 role·state는 네이티브 `<button>`이 자동 제공"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "scope": "#icon",
        "field": "accessibleName",
        "rule": "킷 패턴 `<span class=\"sr-only\">검색</span>` 슬롯 필수. 비어있음 금지, 아이콘 모양·파일명 서술 금지, 기능 서술 (예: \"입력한 비밀번호 보기\")"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "(id 사용 시) id",
        "rule": "페이지 내 유일. 킷 기본 버튼 마크업은 id 없음 — 사용자가 붙일 때만 해당"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast — hierarchy·disabled 변형별 색 조합은 렌더링 시 검사 (disabled는 관행상 대비 요건 제외)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크 — 초점 링 시각 표시는 킷 CSS 렌더링 확인 필요"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인 활성화 필요) — 특히 #xsmall/#small 변형과 #icon 변형의 터치 타깃 크기"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:calendar",
    "name": "달력 — 기간 선택",
    "auto": [
      {
        "kwcagId": "kwcag:5.3.1",
        "evidence": "날짜 그리드가 `<table>` + `<caption>` + 요일 `<th>` (calendar_range.html L154–168), JS가 caption을 현재 연·월로 동기화 (L1520–1521)",
        "scope": "#range"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "전 기능이 네이티브 `<button>` — 열기/이전·다음 달/연·월 선택/날짜 선택/오늘·취소·확인. 확인·취소 클릭이 closeAllDatePickers 호출 (actionDatePicker L1498–1507) → 키보드만으로 열고 닫기 가능",
        "scope": "#range"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "열림 시 focusTrap 설정 + `.calendar-wrap`으로 초점 이동 (L1352–1357), 닫힘 시 트리거(.form-btn-datepicker)로 초점 복귀 (L1367–1372)",
        "scope": "#range"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "연·월 선택기에 role=\"combobox\"/\"listbox\"/\"option\" + aria-expanded/aria-selected 토글 (setupDateComboBox L1383–1439), 트리거 aria-expanded 토글 (L1349, L1378–1381), 오늘·일정 셀에 aria-label 부여 (L1294–1306)",
        "scope": "#range",
        "caveat": "같은 항목에 미해결 질문 있음: 날짜 선택 상태를 `aria-pressed`로 표시 (L1297–1299, L1614, L1644) — 킷 자체 TODO 주석 \"aria-pressed > aria-selected 변경 해야함\" (L1270). 현행 그대로 8.2.1 위반으로 볼지, 킷 수정 대기로 볼지?"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "startDateLabel, endDateLabel",
        "rule": "입력 필드의 레이블이 `title` 속성뿐 (calendar_range.html L10, L14 — \"시작날짜 입력\"/\"종료날짜 입력\") — 유지 필수, 비어있음 금지. placeholder만으로 대체 금지",
        "scope": "#range"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast",
        "scope": "#range"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인) — 날짜 셀 밀집 그리드",
        "scope": "#range"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "scope": "#range · 날짜 그리드",
        "delegate": "수동 체크 — 날짜 그리드 화살표 키 이동 없음(Tab 순회만). 모든 날짜가 네이티브 button이라 6.1.1은 충족하고, APG grid 패턴은 권고 수준 (kit-bugs.md K2). Escape는 연·월 선택기만 닫고(L1491–1495) 달력은 버튼으로 닫는다"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "날짜 선택 상태를 `aria-pressed`로 표시 (L1297–1299, L1614, L1644) — 킷 자체 TODO 주석 \"aria-pressed > aria-selected 변경 해야함\" (L1270). 현행 그대로 8.2.1 위반으로 볼지, 킷 수정 대기로 볼지?",
        "scope": "#range"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "question": "날짜 입력이 `type=\"number\"`로 시작 (calendar_range.html L10, L14) — \"2024.12.07 ~ …\" 형식과 불일치, JS가 확인 시점에 `type=\"text\"`로 전환 (L1555, L1571–1572). 유효성·AT 동작 실측 필요",
        "scope": "#range"
      }
    ]
  },
  {
    "componentId": "krds:carousel",
    "name": "캐러셀 — 배너",
    "auto": [],
    "conditional": [
      {
        "kwcagId": "kwcag:6.2.2",
        "field": "autoplayControls",
        "rule": "정지/재생 버튼 마크업(L47–52) + **샘플 인라인 init 스크립트**(autoplay.stop()/start() 연결·상태 전환, L94–109) + swiper-bundle css/js 포함 — 3요소 전부 복사 필수. ui-script.js는 캐러셀에 미관여하므로 인라인 스크립트 누락 시 정지 수단 없는 자동재생 = 즉시 위반",
        "scope": "#banner"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "field": "slideImageAlt",
        "rule": "샘플 svg의 `aria-label=\"예시\"`(L26, L37)는 자리표시 — 실제 배너 이미지·svg의 대체 텍스트 필수. 비어있음·파일명 패턴 금지",
        "scope": "#banner"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "moreLinkText, moreLinkHref",
        "rule": "\"더 보기\" sr-only(L61–63)만으로 대상 불명 + `href=\"#\"` 자리표시 — 무엇의 더 보기인지 식별되는 텍스트와 실제 목적지 필수",
        "scope": "#banner"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "swiperA11yMessages",
        "rule": "Swiper a11y 모듈이 기본 활성(`a11y:{enabled:!0}` 번들 확인)이며 기본 메시지가 영어(\"Previous slide\"/\"Next slide\" — 번들 내 문자열 확인) → 지정한 내비 버튼에 aria-label로 부여되어 한국어 sr-only 텍스트를 **덮어씀**. init 옵션에 `a11y.prevSlideMessage/nextSlideMessage` 등 한국어 지정 필수",
        "scope": "#banner"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast",
        "scope": "#banner"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.1.1",
        "question": "컨트롤(이전/다음/정지/재생)은 네이티브 button이나, 슬라이드 내 초점 요소 도달과 `loop: true` 시 초점 순서는 Swiper 내부 동작(비가시 슬라이드 aria-hidden/tabindex 처리)에 의존 — 번들 실측 전 ① 판단 보류",
        "scope": "#banner"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "question": "자동 전환 중 초점이 있는 슬라이드가 이동할 때의 초점 유지 여부 — 실측 필요",
        "scope": "#banner"
      }
    ]
  },
  {
    "componentId": "krds:checkbox",
    "name": "체크박스",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<input type=\"checkbox\">` — Space 토글 보장"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`<label for>`↔`<input id>` 연결 — 가시 레이블 = 접근 가능한 이름, 레이블 클릭 영역 확장"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "네이티브 시맨틱 — role·checked 상태 자동 (`checked`/`disabled` 속성 사용), ARIA 미사용",
        "caveat": "같은 항목에 미해결 질문 있음: `.krds-form-check-cnt`의 부가 설명 `<p>`가 input과 프로그램적으로 연결되지 않음(aria-describedby 없음) — 보조기술 전달을 필수(②)로 승격할지?"
      },
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "네이티브 컨트롤 — 업 이벤트 활성, 다운 상태 이탈 시 미실행"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText, inputId",
        "rule": "비어있음 금지, for/id 일치"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "groupLabel (그룹 사용 시)",
        "rule": "**킷의 `.fieldset`·`.krds-check-area`는 class뿐인 `<div>`** — 실제 `<fieldset>/<legend>` 아님. 그룹 질문(예: \"수신 동의 항목\")은 `<fieldset><legend>` 또는 `role=\"group\"+aria-label`로 사용자가 제공"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "inputId",
        "rule": "페이지 내 유일"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.1",
        "scope": "#chip",
        "delegate": "수동 체크 — chip 선택 상태가 색 채움만으로 구분되는지 렌더링 확인 (기본 변형은 체크마크 모양이 비색상 단서)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크 — 초점 표시"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "delegate": "수동 체크 — 킷에 오류 상태 예시가 없음. 필수 동의 등 오류가 나면 그룹(fieldset)에 `p.form-hint-invalid` 메시지를 두고 aria-describedby로 연결 (get_component 조립 지침, KRDS 입력폼 지침 global_08)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "부가 설명",
        "question": "`.krds-form-check-cnt`의 부가 설명 `<p>`가 input과 프로그램적으로 연결되지 않음(aria-describedby 없음) — 보조기술 전달을 필수(②)로 승격할지?"
      }
    ]
  },
  {
    "componentId": "krds:coach_mark",
    "name": "코치마크",
    "auto": [
      {
        "kwcagId": "kwcag:5.4.1",
        "evidence": "단계 위치를 색·시각 배치에만 의존하지 않음 — `sr-only \"현재 단계\"` + `<strong>1</strong>` / `sr-only \"총 단계\"` + `<span>4</span>` 텍스트 제공 (coach_mark.html:9-13)"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "\"그만보기\"/\"다음으로\" 버튼이 네이티브 `<button>` + 가시 텍스트 — 가시 레이블 = 접근 가능한 네임 (coach_mark.html:16-17)"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "킷 조각 자체는 id 없음·요소 열고닫음 정상 — 조각 단위 문법 무결 (페이지 수준 최종 검증은 별도)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "stepTitle (`h6.coach-tit`), stepDesc (`p.desc`)",
        "rule": "비어있음 금지, \"N단계 : \" 접두 형식 유지 시 단계 번호와 실제 위치 일치"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "field": "totalSteps, currentStep (`.num`)",
        "rule": "현재/총 단계 숫자가 실제 진행 상태와 일치, sr-only 레이블(\"현재 단계\"/\"총 단계\") 삭제 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:6.1.1",
        "delegate": "사용처 구현 (킷 JS 없음 — 다음/그만보기·ESC 닫기·오버레이 뒤 콘텐츠 초점 차단) + 수동 키보드 실사"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "사용처 구현 (단계 전환 시 초점 이동, 종료 시 원위치 복귀) + 수동"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "사용처 (말풍선의 DOM 삽입 위치 — 강조 대상과의 읽기 순서) + 수동"
      },
      {
        "kwcagId": "kwcag:6.2.1",
        "delegate": "사용처 (자동 진행 타이머를 구현하는 경우 시간 조절 수단)"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "delegate": "사용처 (페이지 진입 시 자동 표시·초점 강탈 여부) + 수동"
      },
      {
        "kwcagId": "kwcag:7.2.2",
        "delegate": "사이트 수준 수동 — 따라하기 진입점의 페이지 간 일관된 위치·순서"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast (렌더링된 페이지에서 검사 — 킷 토큰 색상 미검증)"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "delegate": "사용처 구현 (단계 전환 알림 aria-live, 오버레이 dialog 역할 등 동작 ARIA 전부 킷 미제공) + axe ARIA 규칙군"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.4.2",
        "question": "제목이 `h5.sr-only`(\"따라하기 가이드\")+`h6`로 고정 — 사용 페이지의 헤딩 위계(h2~h4가 일반적)와 어긋날 수 있는데, 헤딩 레벨 조정을 필수 입력으로 승격할 것인가?"
      }
    ]
  },
  {
    "componentId": "krds:contextual_help",
    "name": "맥락적 도움말",
    "auto": [
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "아이콘 전용 버튼에 `sr-only \"도움말\"`/`\"닫기\"` 텍스트, 아이콘 `<i class=\"svg-icon\">`은 CSS 장식 (contextual_help.html:7-8, 19-20)"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<button>` 트리거 + ESC로 닫기 (ui-script.js:1052-1056 `Escape` keydown) — 열기·닫기 전 과정 키보드 조작 가능"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "evidence": "팝오버는 클릭(사용자 요구) 시에만 표시 — hover/focus만으로 열리지 않음 (ui-script.js:1040 click 리스너만 존재)"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "aria-expanded 한정",
        "evidence": "JS init이 트리거에 `aria-expanded` 자동 부여·토글 (ui-script.js:1032, 1068, 1079) — 마크업에 누락돼도 보정됨",
        "caveat": "같은 항목에 미해결 질문 있음: 팝오버가 `role=\"tooltip\"`인데 내부에 제목·문단·링크·닫기 버튼 등 상호작용 콘텐츠 포함 (contextual_help.html:10-22) — tooltip 역할은 비상호작용 텍스트용이라 ARIA 관점에서 부적절할 수 있다 (실질은 toggletip/비모달 dialog 패턴). 킷 패턴을 그대로 ①로 인정할지, 역할 재정의를 권고 규칙으로 얹을지? axe 형식 검사는 통과할 가능성이 높아 수동 판단 필요"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "tooltipTitle (`h4.tooltip-title`)",
        "rule": "비어있음 금지, 도움 내용을 대표하는 제목"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "helpLinkText, helpLinkHref (`.btn-wrap a`)",
        "rule": "href=`#;` 플레이스홀더 교체 필수, \"바로가기\" 단독 금지 — 링크 텍스트만으로 목적지 식별 가능하게 (또는 sr-only 보강). 링크 불필요 시 `.btn-wrap` 제거 허용"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size(옵트인 활성화, 부록 C-1) + 수동 — 트리거·닫기 버튼 크기는 킷 CSS지만 실측 미검증"
      },
      {
        "kwcagId": "kwcag:7.2.2",
        "delegate": "사이트 수준 수동 — 같은 성격의 도움말 아이콘 위치·순서의 페이지 간 일관성"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "팝오버가 `role=\"tooltip\"`인데 내부에 제목·문단·링크·닫기 버튼 등 상호작용 콘텐츠 포함 (contextual_help.html:10-22) — tooltip 역할은 비상호작용 텍스트용이라 ARIA 관점에서 부적절할 수 있다 (실질은 toggletip/비모달 dialog 패턴). 킷 패턴을 그대로 ①로 인정할지, 역할 재정의를 권고 규칙으로 얹을지? axe 형식 검사는 통과할 가능성이 높아 수동 판단 필요"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "question": "**①에서 강등(적대적 검증)**: 열림 시 초점 이동(L1066-67)은 킷 보장이나, **ESC 닫기 경로(L1052-56)에 초점 복귀 코드가 전혀 없어** 초점 유실 발생 — 복귀는 document click 리스너 안에서 focusout을 덧붙이는 경로(L1102-12)뿐. 킷 결함 보고 + 사용처 보완 필요. 실측 후 ②(복귀 구현 필수) 또는 ③으로 확정"
      }
    ]
  },
  {
    "componentId": "krds:critical_alerts",
    "name": "긴급 공지",
    "auto": [
      {
        "kwcagId": "kwcag:5.4.1",
        "evidence": "긴급도 구분이 색 단독이 아님 — 배지에 텍스트(\"긴급\"/\"안전\"/\"안내\") + 유형별 아이콘(`ico_urgent_badge_{danger,ok,info}`, \\_critical_alerts.scss:44) 동반"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "evidence": "`ul > li` 목록 구조, 각 항목이 배지 → 내용 → 링크의 논리 순서 (critical_alerts.html:3-34)"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "킷 조각 자체는 id 없음·문법 무결"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "alertText (`p.critical-txt`), alertLinkHref, alertLinkLabel",
        "rule": "href=`#` 교체 필수. 링크 가시 텍스트 \"자세히 보기\"가 `span.m-hide`로 모바일에서 숨겨지는 구조 — 숨김이 `display:none`류라면 모바일에서 접근 가능한 네임이 사라지므로 sr-only 텍스트(공지 제목 포함, 예: \"○○ 긴급공지 자세히 보기\") 보강 필수"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:8.2.1",
        "delegate": "사용처 구현 — 긴급 공지의 동적 게시를 보조기술에 알리는 수단(`role=\"alert\"`/`aria-live=\"assertive\"`) 킷 미제공. 성격상 가장 중요한 위임 항목 + 수동 확인"
      },
      {
        "kwcagId": "kwcag:6.2.2",
        "delegate": "사용처 구현 — 공지 다건 롤링·자동 전환 시 정지/일시정지 수단 (킷 JS 없음) + 수동"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "delegate": "사용처 구현 — 닫기 버튼 등 컨트롤 추가 시 키보드 조작·초점 관리 (킷 마크업의 링크 자체는 네이티브 `<a>`로 문제 없음)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast (배지 배경 danger/success/information 위 흰 텍스트 미검증)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.4.3",
        "question": "`m-hide` 클래스가 킷 SCSS 어디에도 정의돼 있지 않음 (`grep -rn m-hide resources/` 무결과 — critical_alerts.html에만 등장). 킷 공통 CSS 배포본에 있는 유틸인지, 사용처가 정의해야 하는 클래스인지 킷 원 저장소 재확인 필요 — 정의 방식(display:none vs 시각만 숨김)에 따라 ② 규칙 강도가 달라짐"
      }
    ]
  },
  {
    "componentId": "krds:date_input",
    "name": "날짜 입력 필드",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "달력 내 모든 조작 요소가 네이티브 `<button>`(이전/다음 달, 연·월 선택, 날짜 셀, 오늘/취소/확인) + JS `common.focusTrap`으로 Tab 순환, 취소·확인 버튼으로 키보드 닫기 가능, 연·월 선택기는 Esc로 닫힘 (`ui-script.js` L1491)"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "아이콘 전용 버튼에 킷이 텍스트 직접 제공 — `sr-only` \"달력 열기\"·\"이전 달\"·\"다음 달\", `aria-label` \"연도 선택\"·\"월 선택\"",
        "caveat": "같은 항목에 미해결 질문 있음: 날짜 셀 버튼의 접근 가능한 이름이 일(day) 숫자뿐(\"26\") — 월 맥락 없이 낭독됨 (aria-label 보강은 today/day-event만). 수동 체크로 둘지, 이름 규칙(②)으로 승격할지?"
      },
      {
        "kwcagId": "kwcag:6.5.1",
        "evidence": "날짜·기간 선택이 전부 단일 클릭 — 드래그·다중 포인터 제스처 없음"
      },
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "킷 JS가 `click`·`blur` 바인딩만 사용 — down 이벤트 실행 없음"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "scope": "초점 관리 부분",
        "evidence": "열기 시 `.calendar-wrap`으로 초점 이동(L1356), 닫기 시 트리거 버튼으로 복귀(L1371) — 단 시각적 초점 표시는 ③"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:5.3.1",
        "field": "captionSync",
        "rule": "caption·thead 구조는 마크업 보장. 단 caption의 \"YYYY년 MM월\" 동기화는 킷의 **테스트 코드**(`example()`, ui-script.js L1508-09·L1521·L1523이 \"실제 구현에서는 날짜 배열을 받아 처리함\"이라 명시)에만 존재 — 달력 데이터를 직접 렌더링하는 구현자가 달 이동 시 caption 갱신을 유지해야 함"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText, inputId",
        "rule": "`<label for=\"cal\">`↔`<input id>` — 비어있음 금지, for/id 일치, \"레이블\" 자리 텍스트 교체"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "formatHint",
        "rule": "입력 형식(YYYY.MM.DD)이 placeholder에만 있음 — placeholder는 입력 시 사라지므로 레이블 또는 `form-hint`+`aria-describedby`로 형식 안내 제공"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "inputId",
        "rule": "페이지 내 유일 (달력 인스턴스 복수 배치 시 `id=\"get-today\"` 등 킷 내장 id도 중복됨 — 주의)"
      },
      {
        "kwcagId": "kwcag:7.3.4",
        "field": "autocomplete (생년월일 등일 때)",
        "rule": "`bday` 등 유효 토큰"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:8.2.1",
        "delegate": "axe:aria-\\* 전체 (aria-allowed-attr, aria-prohibited-attr, aria-valid-attr-value 등) — JS가 combobox/listbox/option·aria-expanded·aria-pressed를 설정하지만: `div.calendar-wrap`(generic role)에 `aria-label=\"달력\"`은 prohibited 소지, 날짜 선택 상태 `aria-pressed`는 킷 소스 주석 스스로 aria-selected로 바꿔야 한다고 표기(L1270). 렌더링 후 axe + 수동 확인"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — 선택 기간(`period`)·오늘(`today`)·휴일(`day-off`)·이벤트(`day-event`) 표시가 색에만 의존하는지 (오늘·이벤트는 aria-label 텍스트 보강 있음, 기간은 aria-pressed 있음 — 휴일은 색뿐)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast — 이전달/다음달 흐림 처리(`old`/`new`), 휴일 색 등"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "scope": "시각 표시",
        "delegate": "수동 체크 — **킷이 전역 `*:focus` outline·box-shadow를 이 컴포넌트에서 제거하고**(`_input.scss:105`, `_select.scss:105`: `outline:none; box-shadow:none`) 테두리 색·굵기(2px) 변경으로 대체. 대체 표시의 대비·식별성 렌더링 후 실측 필요"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인) — 날짜 셀 버튼 크기"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "delegate": "수동 체크 — 잘못된 날짜 입력 시 오류 안내는 킷에 없음(사용자 구현)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:7.3.2",
        "question": "텍스트 입력이 `<input type=\"number\">`인데 placeholder는 `YYYY.MM.DD` — number 타입은 마침표 구분 입력 불가·스피너 노출로 형식과 모순. 킷 버그로 보고 `type=\"text\"`(+inputmode) 교체를 ②로 강제할지?"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "question": "날짜 셀 버튼의 접근 가능한 이름이 일(day) 숫자뿐(\"26\") — 월 맥락 없이 낭독됨 (aria-label 보강은 today/day-event만). 수동 체크로 둘지, 이름 규칙(②)으로 승격할지?"
      }
    ]
  },
  {
    "componentId": "krds:disclosure",
    "name": "디스클로저",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "트리거가 네이티브 `<button>` — 키보드 기본 동작으로 토글 (L1976–1978)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "접힌 콘텐츠에 `inert` 부여 → 숨은 콘텐츠로의 초점 유입 차단, 펼침 시 해제 (L1969, L1988–1992)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "disclosureLabel",
        "rule": "버튼 텍스트 비어있음 금지(axe:button-name), 확장될 내용을 예측할 수 있는 레이블. aria-expanded/aria-controls/id는 킷 JS가 자동 부여 (L1964–1967)"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:5.3.2",
        "question": "킷 주석 \"disclosure 내용이 일부만 노출되는 경우\" (L1961, L1968) — 접힘 상태에서 콘텐츠 일부가 **시각적으로 보이는** 사용례에서는 inert 처리로 보이는 텍스트가 보조기술에서 제거됨(시각/AT 정보 불일치). 킷도 aria-hidden 처리를 주석 보류 중. 부분 노출 변형을 별도 행으로 쪼갤지?"
      }
    ]
  },
  {
    "componentId": "krds:favicon",
    "name": "파비콘",
    "auto": [],
    "conditional": [],
    "outOfScope": [
      {
        "kwcagId": "kwcag:8.1.1",
        "delegate": "W3C validator (페이지 수준) — `<link rel=\"icon\">` 선언의 문법 검사는 head 전체 검증에 포함, 별도 검사 불요"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:file_upload",
    "name": "파일 업로드",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "파일 선택이 네이티브 `<button>` 클릭 → `input[type=file].click()` 위임 (L2347–2349) — 드래그앤드롭 없이 키보드로 전 기능 사용 가능"
      },
      {
        "kwcagId": "kwcag:6.5.1",
        "evidence": "드래그앤드롭(경로 기반 동작)의 대체 수단으로 파일선택 버튼 제공 (동일 근거) — 단일 포인터·키보드로 동등 기능"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText",
        "rule": "`label for`↔`input id` 연결은 킷 마크업 보장. 단 **레이블 텍스트 내용은 사용자 입력** — 비어있음 금지, 파일 선택 용도를 서술 (axe:label). 전 폼 컴포넌트와 동일 기준"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "field": "uploadErrorMessage",
        "rule": "오류 항목(`.is-error .file-hint-invalid`)에 원인+정정 방법 포함(샘플: 용량 초과+20MB 안내, L55–66). **킷 JS는 업로드·검증 로직 미구현**(drop 핸들러가 파일을 처리하지 않음 L2361–2365) — 동적 오류 발생 시 `role=\"alert\"`/aria-live로 알리는 구현은 사용자 몫"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "uploadStatusText",
        "rule": "진행 상태 스피너의 `role=\"status\"` + sr-only 텍스트(L31–33) 유지 — 상태 변경(업로드 중→완료) 시 텍스트 갱신은 사용자 구현"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.1.1",
        "question": "`<label for>` 내부에 `<button>` 중첩 (file_upload.html L16–19) — label 콘텐츠 모델은 레이블 대상 외 labelable 요소 금지 → 마크업 유효성 위반 소지. Nu HTML Checker 실측 후 확정?"
      }
    ]
  },
  {
    "componentId": "krds:footer",
    "name": "푸터",
    "auto": [
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "SNS 아이콘 전용 링크에 `span.sr-only`(\"인스타그램\", \"유튜브\" 등) 제공, 아이콘은 CSS 배경 장식"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "모든 컨트롤이 네이티브 `<a href>`/`<button type=\"button\">`"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`aria-label` 미사용 — 가시 텍스트가 그대로 accessible name"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "evidence": "새 창 링크(`target=\"_blank\"`)에 `title=\"새 창 열기\"` 사전 고지, 동작은 클릭 시에만"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:5.1.1",
        "field": "logoText (`div.f-logo > .sr-only`, `krds-identifier` 내 sr-only)",
        "rule": "비어있음 금지, 실제 기관명"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "linkText (f-menu·link-go·foot-quick·SNS sr-only 등 모든 링크/버튼 텍스트)",
        "rule": "비어있음 금지 — 샘플 \"related_site\" 등 플레이스홀더 잔존 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:5.4.4",
        "delegate": "수동 체크 — 인접 블록(quick/정보/링크/식별자) 경계의 시각 구분"
      },
      {
        "kwcagId": "kwcag:7.2.2",
        "delegate": "수동 체크 — 대표전화 등 도움 정보의 페이지 간 위치 일관성(사이트 수준)"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "`foot-quick`의 \"related_site\" 버튼은 레이어를 여는 용도(title=\"related_site 레이어\")이나 킷 JS에 해당 동작·`aria-expanded` 관리가 없음 — 동작을 사용 측 구현으로 보고 ②(필수 입력: 레이어 구현 시 상태 표기)로 승격할지, 별도 컴포넌트(disclosure) 조합으로 볼지?"
      }
    ]
  },
  {
    "componentId": "krds:header",
    "name": "헤더 — 유틸리티·브랜딩·GNB 통합",
    "auto": [
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "아이콘 전용 컨트롤에 `span.sr-only` 제공(\"검색\", \"전체메뉴 닫기\", \"이전화면\"); 장식 아이콘은 `i.svg-icon`(CSS 배경)으로 텍스트와 병기"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "모든 컨트롤이 네이티브 `<button type=\"button\">`/`<a href>` — 구조적으로 키보드 접근 가능. JS가 GNB에 Escape 닫기(214–218)·방향키/Home/End 이동(242–270), 모바일 전체메뉴에 focusTrap(387)·닫기 시 트리거로 초점 복귀(408) 제공"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`aria-label` 미사용 — 가시 텍스트 노드가 그대로 accessible name이 되므로 레이블≠네임 불일치가 구조적으로 불가능"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "evidence": "드롭다운·GNB 개폐가 click 이벤트에만 바인딩(206–228, 2135) — 초점 이동만으로 맥락 변화 없음. 새 창 링크에 `title=\"새 창 열기/열림\"` 사전 고지"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:5.1.1",
        "field": "logoText (`h2.logo a > .sr-only`)",
        "rule": "비어있음 금지 — 로고는 CSS 배경, sr-only가 유일한 대체 텍스트. 실제 기관명으로 교체"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "menuLabel (모든 `a`/`button` 텍스트)",
        "rule": "비어있음 금지 — 샘플 플레이스홀더(\"메뉴명\", \"1Depth\", \"2Depth\") 잔존 금지, 링크 텍스트만으로 목적 식별 가능해야 함"
      },
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "menuGroupTitle (`h2.sub-title`, `h3.tit`)",
        "rule": "비어있음 금지 — GNB 서브패널의 블록 제목"
      },
      {
        "kwcagId": "kwcag:6.2.1",
        "field": "sessionExtendAction (\"시간 연장\" 버튼)",
        "rule": "나의 GOV 드롭다운에 로그아웃 타이머 UI(`dl.my-time` + 연장 버튼)는 마크업만 제공 — 실제 연장 동작·남은 시간 갱신은 사용 측이 구현해야 성립. 미구현 시 6.2.1 위반"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크(페이지 조립 후 초점 순서·시각 표시) + axe:tabindex (BP)"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인 활성화 필요)"
      },
      {
        "kwcagId": "kwcag:6.4.1",
        "delegate": "axe:bypass + skip_link 컴포넌트 — 헤더는 건너뛰기 '대상' 반복 영역, 수단 제공은 페이지 수준"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크 — 유틸리티→브랜딩→GNB DOM 순서의 페이지 내 적절성"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.1.1",
        "question": "모바일 4Depth 마크업이 `<ul class=\"depth4-body\">`의 직계 자식으로 `<h4>`와 `<ul>`을 배치(header.html 403–411) — HTML 문법 위반(ul 직계 자식은 li만 허용). **킷 자체 결함** — 결함 목록으로 상부 보고?"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "krds_dropEvent가 role 없는 `a.item-link`에 `aria-selected`를 부여(ui-script.js 2178–2183) — aria-selected는 option/tab 등 특정 role에만 허용. **킷 JS 결함**. **[PoC 실측 2026-09-11]** 킷·krds.go.kr 양쪽 모두 `axe:aria-valid-attr-value` **판정 보류(incomplete)** — axe 메시지는 \"aria-haspopup 사용 시 aria-controls 대상 id 존재 여부를 판단할 수 없음\"이다. 사이트에서 대상 id 실재를 수동 확인한 결과 **존재했다**(`gnb-main-menu-rxryjda`). 즉 위반 미확정이며, 남은 쟁점은 role 없는 `a.item-link`에 `aria-selected`를 부여하는 부분(axe 미검출) — 수동·스크린리더 확인 필요"
      }
    ]
  },
  {
    "componentId": "krds:help_panel",
    "name": "도움 패널",
    "auto": [
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "아이콘은 전부 CSS 장식(`svg-icon`) + 가시 텍스트 또는 `sr-only` 동반 (help_panel.html:8, 43, 174)"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "모든 컨트롤이 네이티브 `<button>`/`<a>`, 탭은 좌우 화살표 키 이동 지원 (ui-script.js:779-788)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "패널 열림 시 `tabindex=\"0\"` 부여 후 패널로 초점 이동(ui-script.js:1891-1896), 닫힘 시 마지막 트리거 버튼으로 복귀(1916-1921)"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "부분",
        "evidence": "열기/닫기 버튼 `aria-expanded` 자동 관리(ui-script.js:1871, 1901, 1925) · disclosure에 `aria-expanded`/`aria-controls`/`inert` 자동 부여(1965-1992) · 탭 `aria-selected` + sr-only \"선택됨\" 병행(731-747) — 단, 탭 역할 구조는 아래 ? 참조",
        "caveat": "같은 항목에 미해결 질문 있음: 탭이 `<li role=\"tab\">` 안에 `<button>`을 두는 구조 (help_panel.html:21-26) — 초점은 button이 받고 `aria-selected`는 li에 있어 보조기술이 탭 상태를 초점 요소에서 못 읽는다(킷이 sr-only \"선택됨\"으로 보완). role=tab(상호작용 역할) 내부의 button은 axe:nested-interactive 위반 가능성도 있다. **[PoC 실측 2026-09-11]** `axe:nested-interactive` **위반 확정** — sr-only 보완으로는 인정되지 않는다. ① 불가, 킷 업스트림 보고 대상 (tab과 동일 구조·동일 결과) **[KRDS 운영팀 확인 · 수정 예정]** 동일 지적에 대해 운영팀이 부적절함을 인정하고, `role=\"tab\"`을 `<button>`/`<a>` 등 초점 요소에 직접 부여하도록 구조를 수정하겠다고 회신했다. **현 판정은 v1.1.0(d6bb184) 기준이며, 킷 개정 시 재검증해 ①로 승격 가능하다.**"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "sectionTitles (`h3.sr-only`, `h4.help-title`)",
        "rule": "비어있음 금지, 실제 도움 주제 반영. 페이지 헤딩 위계(h3/h4 고정)와 충돌 시 레벨 조정"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "helpLinks (`.link-list a`)",
        "rule": "href=`#` 플레이스홀더 교체 필수, 링크 텍스트만으로 용도 식별 가능"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "field": "externalLinks (`target=\"_blank\"` 링크)",
        "rule": "새 창 링크에는 킷 예제처럼 `title=\"새 창 열림\"` 고지 유지 (help_panel.html:55, 61)"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "tabIds (`helperTab01/02`, `helperTabpanel01/02`)",
        "rule": "고정 id — 페이지당 도움 패널 1개 전제(JS도 `querySelector` 단수 조회, ui-script.js:1808). 2개 이상 배치 금지 또는 id 전면 재부여 + `aria-controls`/`aria-labelledby` 동기 수정"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:7.2.2",
        "delegate": "**사이트 수준 수동 — 이 컴포넌트가 곧 '도움 정보'의 본체.** 도움 패널·열기 버튼의 상대적 위치와 순서가 모든 페이지에서 일관돼야 함 (부록 A 수동 체크리스트 연계)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size(옵트인) + 수동"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 — 패널이 본문 옆 고정 배치될 때 DOM 삽입 위치와 읽기 순서(본문 → 패널) 적절성"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "탭이 `<li role=\"tab\">` 안에 `<button>`을 두는 구조 (help_panel.html:21-26) — 초점은 button이 받고 `aria-selected`는 li에 있어 보조기술이 탭 상태를 초점 요소에서 못 읽는다(킷이 sr-only \"선택됨\"으로 보완). role=tab(상호작용 역할) 내부의 button은 axe:nested-interactive 위반 가능성도 있다. **[PoC 실측 2026-09-11]** `axe:nested-interactive` **위반 확정** — sr-only 보완으로는 인정되지 않는다. ① 불가, 킷 업스트림 보고 대상 (tab과 동일 구조·동일 결과) **[KRDS 운영팀 확인 · 수정 예정]** 동일 지적에 대해 운영팀이 부적절함을 인정하고, `role=\"tab\"`을 `<button>`/`<a>` 등 초점 요소에 직접 부여하도록 구조를 수정하겠다고 회신했다. **현 판정은 v1.1.0(d6bb184) 기준이며, 킷 개정 시 재검증해 ①로 승격 가능하다.**"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "question": "PC 화면에서는 페이지 로드 시 패널이 자동 열림 (ui-script.js:2644-2647) — 초점·입력에 의한 맥락 변화는 아니어서 위반은 아니라고 판단되나, 자동 열림 시 초점을 빼앗지 않는지 실사 확인 필요"
      }
    ]
  },
  {
    "componentId": "krds:identifier",
    "name": "운영기관 식별자",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "상호작용 요소 없음(로고 `span` + 문구 `span`) — 키보드로 조작할 기능 없음"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:5.1.1",
        "field": "logoText (`span.logo > .sr-only`)",
        "rule": "비어있음 금지 — 로고는 CSS 배경 이미지이므로 sr-only 텍스트가 유일한 대체 텍스트. 실제 기관명으로 교체(샘플 \"KRDS - Korea Design System\" 그대로 두기 금지)"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:in_page_navigation",
    "name": "페이지 내 목차",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `a`/`button` + JS가 Enter/Space 키 처리와 함께 대상 섹션의 `.sec-tit`에 `tabindex=\"-1\"` 부여 후 초점 이동(1709–1736) — 키보드 사용자도 스크롤 위치와 초점이 함께 이동"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "evidence": "스크롤·초점 이동은 클릭/Enter/Space 활성화 시에만 — 초점 이동만으로 맥락 변화 없음"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "sectionAnchors (각 `a`의 텍스트 + `href=\"#id\"`)",
        "rule": "텍스트 비어있음 금지, href 대상 id가 페이지에 실존해야 함 — 대상이 없으면 JS가 바인딩을 생략해 죽은 앵커로 남음(1704–1714)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "field": "sectionTitle (대상 섹션 내 `.sec-tit` 요소)",
        "rule": "각 대상 섹션에 `.sec-tit` 존재 필수 — 없으면 초점 이동이 생략되어(1730–1735) 키보드 사용자의 초점이 이동하지 않음"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — 스크롤스파이 active 표시가 색에만 의존하는지 시각 검토"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.4.2",
        "question": "`<nav class=\"in-page-navigation-list\">`에 접근 가능한 이름 없음 — 제목(`p.quick-caption`/`p.quick-title`)이 nav 밖의 `<p>`라 nav와 프로그래밍적으로 연결되지 않음. aria-label(예: \"이 페이지의 구성\")을 ② 필수 입력으로 요구할지, 킷 개선 요청으로 보고할지?"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "스크롤스파이 활성 항목이 `active` 클래스로만 표기되고 `aria-current` 미사용 — 개선 요청 대상인지, 목차 특성상 허용 범위인지?"
      }
    ]
  },
  {
    "componentId": "krds:language_switcher",
    "name": "언어 변경",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 button/a + ESC 닫기(ui-script.js:2212-2217) — 열기·선택·닫기 전부 키보드 가능"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "`aria-expanded` 토글(:2133, :2189), 항목 선택·ESC 시 `drop-btn`으로 초점 복귀(:2159-2160, :2215), 전역 `*:focus` outline (common.css:1053)"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "버튼 가시 레이블 \"언어 변경\"이 콘텐츠 텍스트 = accessible name"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "scope": "#page",
        "evidence": "링크가 사용자 클릭으로만 동작하며, `target=\"_blank\"` 새 창 열림을 `title=\"새 창 열림\"`으로 사전 고지 (language_switcher_page.html)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "languageHrefs",
        "rule": "각 언어 링크 href=\"#\" placeholder를 실제 언어별 페이지 URL로 교체 — placeholder 금지. (링크 텍스트·`lang` 속성은 킷이 제공: `lang=\"en/zh/ja/fr\"` + 병기 국문)"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — sr-only \"선택됨\"(:2151-2153)은 보조기술 전달용일 뿐 **시각 단서가 아님**. 선택 상태가 색 외 시각 단서(굵기·모양·밑줄)로도 구분되는지 렌더링 후 확인 (pagination과 동일 기준)"
      },
      {
        "kwcagId": "kwcag:7.1.1",
        "delegate": "axe:html-has-lang / axe:html-lang-valid — 페이지(및 전환된 각 언어 페이지)의 `html lang`은 사이트 수준. 컴포넌트의 항목별 `lang` 속성은 킷이 제공(참고)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "킷 JS가 `<a class=\"item-link\">`에 `aria-selected`를 부여(ui-script.js:2178, 2183) — aria-selected는 option/tab/gridcell/row 전용이라 role 없는 링크에서는 `axe:aria-allowed-attr` 위반 소지. 킷 업스트림 결함으로 보고할지, 사용처에서 role 부여/속성 제거로 정정하게 할지?"
      }
    ]
  },
  {
    "componentId": "krds:link",
    "name": "링크",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<a href>` — 키보드 초점·Enter 활성 보장"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "`<i class=\"svg-icon ico-go\">`는 빈 요소 + CSS 배경(장식) — 이름은 `<span class=\"underline\">` 가시 텍스트가 제공"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "접근 가능한 이름 = 요소 콘텐츠 — 가시 텍스트가 네임에 자동 포함"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "evidence": "맥락 변화(새 창)는 클릭 활성화 시에만 발생하고, 킷 패턴이 `target=\"_blank\"`에 `title=\"새 창 열림\"` 고지를 포함"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "linkText",
        "rule": "비어있음 금지 (axe:link-name), \"여기\", \"클릭\", \"더보기\" 단독 등 목적 불명 텍스트 금지"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "href",
        "rule": "킷 데모 값 `#!`·`https://www.site_name.com/` 그대로 사용 금지 — 실제 목적지 URL 필수"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "field": "newWindowNotice (target=\"\\_blank\" 사용 시)",
        "rule": "`title=\"새 창 열림\"` 또는 동등 고지 유지 — target만 넣고 고지 생략 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.1",
        "scope": "#no-underline: `밑줄 없음`·`hidden-underline` 변형",
        "delegate": "axe:link-in-text-block + 수동 체크 — 본문 속에서 밑줄 없이 색만으로 구분되면 위반. 본문 외 독립 배치에서만 사용"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크 — 초점 표시 CSS 확인"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:main_menu",
    "name": "메인 메뉴 — 데스크탑",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "트리거가 네이티브 `button`/`a` + JS 방향키·Home/End 이동(242–270), Escape 닫기(214–218)",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "JS가 초기화 시 `aria-expanded=\"false\"`·고유 id 기반 `aria-controls`·`.gnb-menu`에 `aria-label=\"메인 메뉴\"` 자동 부여(95–140) — menu role 미사용(disclosure 패턴)이라 위젯 role 오용이 구조적으로 없음",
        "scope": "#pc",
        "caveat": "같은 항목에 미해결 질문 있음: tablist/tab·aria-selected·aria-controls 부여(299–330)와 depth3/4 aria-expanded(489–528)는 실재하나 **부분 보장** — 전체메뉴 트리거의 aria-expanded 갱신이 킷 JS에서 주석 처리됨(L357·L398), `<a>`에 role=\"tab\"을 부여하면서 방향키 패턴 없음. 실측·킷 결함 보고 전까지 ① 금지"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`aria-label`을 개별 항목에 쓰지 않음 — 가시 텍스트가 accessible name",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "evidence": "메뉴 개폐가 click 바인딩에만 의존(206–228) — 초점 이동만으로 서브메뉴가 열리지 않음. 새 창 링크 `title=\"새 창 열림\"` 고지",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "아이콘 전용 버튼에 `span.sr-only`(\"검색\", \"전체메뉴 닫기\", \"이전화면\") 제공",
        "scope": "#mobile"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `a`/`button`/`input` + focusTrap(387, common.focusTrap 61–86)으로 열림 상태에서 Tab 순환, 닫기 버튼 상시 제공(`#close-nav`)",
        "scope": "#mobile"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "menuLabel (트리거·링크 텍스트)",
        "rule": "비어있음 금지 — \"1Depth\"/\"Last depth\" 플레이스홀더 잔존 금지",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "subTitle (`h2.sub-title`)",
        "rule": "비어있음 금지",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "menuLabel (모든 트리거·링크 텍스트)",
        "rule": "비어있음 금지 — 플레이스홀더 잔존 금지",
        "scope": "#mobile"
      },
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "subTitle (`h2.sub-title`, `h4.sub-title`)",
        "rule": "비어있음 금지",
        "scope": "#mobile"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크(초점 표시·순서)",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast",
        "scope": "#mobile"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크 — 4단계 depth 전환 시 초점 흐름 실사용 확인",
        "scope": "#mobile"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)",
        "scope": "#mobile"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크",
        "scope": "#mobile"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.4.2",
        "question": "서브패널 내부 제목이 `h2`/`h3` 고정 — 페이지 본문의 제목 위계와 충돌 가능(axe:heading-order BP). 컴포넌트 조건(②)으로 제목 수준을 조정 가능하게 할지, 페이지 수준(③)으로 둘지?",
        "scope": "#pc"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "question": "`<ul class=\"depth4-body\">` 직계 자식으로 `<h4>`·`<ul>` 배치(main_menu_mobile.html 105–113, header.html 동일) — HTML 문법 위반. **킷 자체 결함** — 매핑에서 \"①로 쓸 수 없음\"으로 표기하고 결함 보고?",
        "scope": "#mobile"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "tablist/tab·aria-selected·aria-controls 부여(299–330)와 depth3/4 aria-expanded(489–528)는 실재하나 **부분 보장** — 전체메뉴 트리거의 aria-expanded 갱신이 킷 JS에서 주석 처리됨(L357·L398), `<a>`에 role=\"tab\"을 부여하면서 방향키 패턴 없음. 실측·킷 결함 보고 전까지 ① 금지",
        "scope": "#mobile"
      }
    ]
  },
  {
    "componentId": "krds:masthead",
    "name": "공식 배너",
    "auto": [
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "배너 문구가 실 텍스트(`span.nuri-txt`)로 제공 — 비텍스트 콘텐츠 없음(태극기 아이콘은 CSS 배경 장식)"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "상호작용 요소가 전혀 없는 정적 마크업 — 키보드로 조작할 기능 자체가 없음"
      }
    ],
    "conditional": [],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크 — masthead가 문서 최상단(첫 콘텐츠)에 배치되는지는 페이지 조립 수준"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "delegate": "W3C validator — 고정 `id=\"krds-masthead\"`의 페이지 내 중복 여부는 페이지 수준"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:modal",
    "name": "모달",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "열기(.open-modal)/닫기(.close-modal, 예/아니요/×) 전부 네이티브 `<button>` (마크업 L1, L22–30; JS L874–901) — 키보드만으로 전 기능 조작 가능 (단, Escape는 ? 참조)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "열림 시 첫 focusable로 초점 이동 (L929–933) + `common.focusTrap`으로 Tab/Shift+Tab 순환 (L963, L61–84) + 배경 `#wrap`에 inert (L969) + 닫힘 시 트리거로 초점 복귀 (returnFocusToTrigger L1004–1012)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "modalPlacement",
        "rule": "`role=\"dialog\"`(L911)·`aria-labelledby`는 킷 보장이나, 배경 비활성화 inert가 `#wrap`에만 적용됨(L969) — **모달 마크업을 `#wrap` 밖(형제)에 배치 필수**. 내부 배치 시 모달 자신이 inert가 되어 조작 불가. `aria-modal` 미설정은 별도 킷 개선 요청 대상"
      },
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "modalTitle",
        "rule": "`aria-labelledby` 대상 `.modal-title`(h2) 텍스트 — 비어있음 금지, 대화상자 목적 식별 가능"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "scope": "Escape",
        "delegate": "수동 체크 — 킷의 Escape 닫기가 `{ once: true }`로 등록돼(L935–943) 첫 키가 Escape가 아니면 이후 무반응 (킷 버그, kit-bugs.md K1). 닫기 버튼으로 6.1.1은 충족하므로 Escape를 보장 근거로 쓰지 않는다"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "inert가 `#wrap`에 걸리므로 (L969) 모달 마크업을 `#wrap` **내부**에 두면 모달 자체가 비활성화됨 — \"모달은 #wrap 밖 배치\"를 필수 사용 규칙(②)으로 승격할지? `aria-modal=\"true\"` 미설정(대체: inert)도 실측 확인 필요"
      }
    ]
  },
  {
    "componentId": "krds:pagination",
    "name": "페이지네이션",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "페이지 링크가 네이티브 `<a href>`; 비활성 \"이전\"은 `<span>`(비상호작용 요소)이라 키보드 초점이 가지 않음 — 죽은 컨트롤에 초점이 가는 문제가 구조적으로 없음"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "evidence": "\"이전\"/\"다음\" 텍스트 링크 + 현재 페이지에 `span.sr-only`(\"현재페이지 \") 부가 — 링크 텍스트만으로 용도 식별 가능"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "pageHref (각 `a.page-link`·`a.page-navi`의 href)",
        "rule": "실제 목적지 필수(샘플 `#` 잔존 금지); 현재 페이지 항목에는 `active` 클래스 + 현재 위치 알림 하나 — `aria-current=\"page\"`(템플릿 교정본·생성 마크업 방식) 또는 킷 원본의 sr-only \"현재페이지\". 둘을 함께 두면 두 번 읽힌다"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인) — 페이지 번호의 터치 타깃 크기"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — 현재 페이지의 시각적 구분이 색에만 의존하는지(sr-only는 보조기술용일 뿐 시각 구분 아님)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.1.1",
        "question": "`<span class=\"page-navi prev disabled\" href=\"#\">` — span에 허용되지 않는 `href` 속성(W3C validator 검출 대상). **킷 자체 결함** — 결함 보고?"
      },
      {
        "kwcagId": "kwcag:6.4.2",
        "question": "래퍼가 `<div class=\"krds-pagination\">` — `<nav aria-label>`이 아니어서 영역 이름 없음. nav 승격을 사용 지침(②)으로 요구할지, 킷 개선 요청으로 보고할지?"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "현재 페이지 표기가 `aria-current=\"page\"` 없이 class+sr-only 텍스트 방식 — 유효하긴 하나 표준 패턴 대비 열위. 개선 요청 대상인지?"
      }
    ]
  },
  {
    "componentId": "krds:radio_button",
    "name": "라디오 버튼",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<input type=\"radio\">` — 화살표 키 그룹 내 이동 브라우저 보장 (동일 `name` 전제 — ② 참조)"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`<label for>`↔`<input id>` 연결"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "네이티브 시맨틱 — role·checked 상태 자동, ARIA 미사용"
      },
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "네이티브 컨트롤"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText, inputId",
        "rule": "비어있음 금지, for/id 일치"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "field": "radioGroupName",
        "rule": "같은 선택지 그룹은 동일 `name` 필수 — 다르면 화살표 키 그룹 이동·단일 선택이 깨짐 (킷 데모의 `name=\"rdo_1a\"`는 시연용 분리)"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "groupLabel",
        "rule": "라디오 그룹은 질문 자체의 레이블 필요 — `<fieldset><legend>` 또는 `role=\"radiogroup\"+aria-label` (킷의 `.fieldset`은 class뿐인 div)"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "inputId",
        "rule": "페이지 내 유일"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.1",
        "scope": "#chip",
        "delegate": "수동 체크 — chip 선택 상태의 비색상 단서 확인"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크 — 초점 표시"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "delegate": "수동 체크 — 킷에 오류 상태 예시가 없음. 선택 누락 오류는 그룹(fieldset)에 `p.form-hint-invalid` 메시지를 두고 aria-describedby로 연결 (get_component 조립 지침, KRDS 입력폼 지침 global_08)"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:resize",
    "name": "화면 크기 조정",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "전 컨트롤이 네이티브 `<button type=\"button\">` + krds_dropEvent의 ESC 닫기 — 키보드만으로 크기 변경·초기화 가능"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "`aria-expanded` 토글, 선택·ESC 시 초점 복귀(ui-script.js:2159-2160, :2215), 전역 `*:focus` outline"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "가시 레이블(\"작게\"·\"보통\"·\"크게\"…)이 그대로 버튼 콘텐츠 = accessible name"
      }
    ],
    "conditional": [],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — sr-only \"선택됨\"은 시각 단서가 아님. 선택 상태의 비색상 시각 구분 렌더링 후 확인 (language_switcher와 동일 근거·동일 기준)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "language_switcher와 동일 — `<button class=\"item-link\">`에 `aria-selected` 부여(ui-script.js:2028, :2178) — 허용되지 않는 role-속성 조합. 처리 방침 동일 질문"
      }
    ]
  },
  {
    "componentId": "krds:select",
    "name": "셀렉트",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<select>`/`<option>` — 키보드 조작 브라우저 보장, 커스텀 드롭다운 JS 없음"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "scope": "기본·size·state",
        "evidence": "`<label for>`↔`<select id>` 연결 — 가시 레이블이 접근 가능한 이름(레이블이 title보다 우선)"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "네이티브 시맨틱 — role·선택 상태 자동, ARIA 미사용"
      },
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "네이티브 컨트롤 — 브라우저 기본 활성 동작"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "scope": "기본·size·state",
        "field": "labelText, selectId",
        "rule": "비어있음 금지, for/id 일치"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "scope": "#sorting",
        "field": "accessibleName",
        "rule": "**가시 `<label>` 없음 — `title` 속성만 존재.** 킷 데모 값 \"선택\"은 목적 불명 — 용도를 서술하는 값 필수 (예: \"게시글 정렬 기준\"). axe:select-name"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "selectId",
        "rule": "페이지 내 유일 — **킷 데모 자체가 `select.html`과 `select_state.html`에서 `id=\"select_error\"`를 중복 사용** (부록 발견 3). 복붙 시 즉시 위반"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "scope": "#state",
        "field": "errorMessage + aria 연결",
        "rule": "text_input#state와 동일 — `form-hint-invalid` 메시지 필수, `aria-describedby`/`aria-invalid`는 킷에 없어 사용자가 추가"
      },
      {
        "kwcagId": "kwcag:7.3.4",
        "field": "autocomplete (해당 시)",
        "rule": "유효 토큰"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast — **[실측 2026-09-16] 킷 기본(미선택) 상태 글자색이 비활성 토큰이라 미달**: `component.css:9616` `color: var(--krds-form-select--color-text)` = text-disabled(#8A949E), 흰 배경 대비 3.08:1. axe는 셀렉트 화살표 배경 이미지 때문에 incomplete로 보류하고 위반 확정을 못 한다 — 리포트 실측이 검출. 템플릿에서는 text-subtle(gray-70, 8.68:1)로 교정해 동봉"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "scope": "시각 표시",
        "delegate": "수동 체크 — **킷이 전역 `*:focus` outline·box-shadow를 이 컴포넌트에서 제거하고**(`_input.scss:105`, `_select.scss:105`: `outline:none; box-shadow:none`) 테두리 색·굵기(2px) 변경으로 대체. 대체 표시의 대비·식별성 렌더링 후 실측 필요"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인) — #small 변형"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "delegate": "수동 체크 — `change` 이벤트만으로 페이지 이동·폼 제출 등 맥락 변화를 일으키지 않는지 (구현자 책임, 킷 JS에는 해당 동작 없음)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:7.3.2",
        "scope": "#sorting",
        "question": "가시 레이블 없이 `title`만으로 \"대응하는 레이블 제공\"을 충족한 것으로 인정할지? (axe:select-name은 title로 pass하지만 KWCAG 심사 관행은 가시 레이블 또는 aria-label 요구 경향) — **[PoC 실측 2026-09-11]** `axe:label-title-only` **위반 검출**. axe도 title 단독은 불충분으로 판정하므로 ②(accessibleName 필수) 유지가 맞다"
      }
    ]
  },
  {
    "componentId": "krds:side_navigation",
    "name": "사이드 내비게이션 · LNB",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "모든 항목이 네이티브 `button`/`a` — Tab으로 접근 가능. 팝업 서브메뉴 열림 시 제목 버튼으로 초점 이동, focusout 시 자동 닫힘 + 여는 버튼으로 초점 복귀(JS 619–668)"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`aria-label` 미사용 — 가시 텍스트가 accessible name"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "lnbTitle (`h2.lnb-tit`)",
        "rule": "비어있음 금지 — 블록 제목"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "menuLabel (버튼·링크 텍스트)",
        "rule": "비어있음 금지 — \"2Depth-menu\" 등 플레이스홀더 잔존 금지"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "field": "currentPage (`aria-current=\"page\"`)",
        "rule": "현재 페이지 링크에 반드시 지정 — 킷 JS의 `setActiveCurrentPage`는 주석에 \"개발 환경에 맞게 수정\"이라 명시된 예시 구현이며 기본 호출을 신뢰할 수 없음. active 클래스(색·굵기)만으로 현재 위치 표시 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크(초점 표시·순서)"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "delegate": "수동 체크"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "마크업이 `role=\"menubar\"/\"menu\"/\"menuitem\"`을 채택했으나 JS(krds_sideNavigation)에 메뉴 위젯 필수 키보드 패턴(방향키 탐색 등)이 없음 — ARIA 메뉴 패턴 요건 불충족 소지. 또한 APG는 사이트 내비게이션에 menu role 사용을 비권장. role 제거(일반 nav+list 패턴)를 사용 지침으로 요구할지, 킷 결함으로 보고할지?"
      }
    ]
  },
  {
    "componentId": "krds:skip_link",
    "name": "건너뛰기 링크",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<a href>` — 키보드 초점·활성화 보장"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "`_skip_link.scss`: 링크가 `:not(:focus)`일 때만 sr-only, `:focus` 시 전폭 표시 + `@include focus()` 스타일 — 초점의 시각적 표시를 킷 CSS가 보장"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "evidence": "링크 텍스트 \"본문 바로가기\" 고정 제공 — 용도가 텍스트만으로 명확"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.1",
        "field": "skipTargetId (`a[href]`)",
        "rule": "페이지에 실존하는 id여야 하며 **본문(주 콘텐츠) 시작 요소**를 가리켜야 함. 킷 샘플 기본값 `#breadcrumb`를 그대로 쓰기 금지(아래 ? 참조). 대상 요소가 초점을 받을 수 있어야 함(`tabindex=\"-1\"` 등)"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.4.1",
        "question": "킷 샘플의 href가 `#breadcrumb` — 텍스트(\"본문 바로가기\")와 실제 도착지(브레드크럼)가 불일치. **[PoC 실측 2026-09-11]** krds.go.kr에서 `axe:skip-link` **위반 확정** — `<a href=\"#breadcrumb-home\">본문 바로가기</a>`인데 해당 id가 페이지에 **존재하지 않는다**(수동 확인). 킷 데모에서도 같은 규칙이 검출됐으나 그쪽은 조각만 렌더한 탓이 커서 킷 결함의 근거로는 약하다. 확정된 것은 **킷 샘플의 기본 href가 본문이 아닌 브레드크럼을 가리켜, 그대로 복사하면 위험하다**는 점 — ② skipTargetId 강제로 대응한다. 실사용 재현 증거: `../evidence/skip-link-*.jpg` (Tab으로 링크가 나타나지만 Enter를 눌러도 초점이 이동하지 않음)"
      }
    ]
  },
  {
    "componentId": "krds:spinner",
    "name": "스피너",
    "auto": [
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "**로딩 상태를 보조기술에 알리는 마크업 있음** — `.krds-spinner`에 `role=\"status\"`(암묵적 `aria-live=\"polite\"`) 명시, 두 변형 모두 (spinner.html:10, 22). 과제에서 주의 지시된 aria-live/role=status 유무: **확인됨**"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "evidence": "시각적 스피너(CSS 애니메이션)의 대체 텍스트 `sr-only \"로딩 중\"` 제공 (spinner.html:11, 23)"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "evidence": "로딩 상태가 색·움직임 단독이 아님 — 텍스트(\"로딩 중\", 단독 변형은 가시 텍스트 \"Loading data..\") 동반"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "scope": "#in-input 변형",
        "field": "inputLabel, inputId (`label[for]` ↔ `input#id`)",
        "rule": "label-for 연결 유지, 예제 id `consult_name` 페이지 내 중복 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "알림 타이밍",
        "delegate": "사용처 구현 + 수동 — `role=\"status\"` 영역은 **DOM에 미리 존재해야** 내용 변화가 공지됨. 스피너 노드를 로딩 시작 시점에 통째로 동적 삽입하면 보조기술이 공지하지 못할 수 있음(표시/숨김 전환 방식 권장). 로딩 종료 알림도 사용처 몫"
      },
      {
        "kwcagId": "kwcag:6.2.1",
        "delegate": "사용처 — 로딩이 세션 타임아웃 등 시간 제한과 결합되는 경우의 조절 수단"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast (단독 변형의 가시 텍스트)"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:step_indicator",
    "name": "단계 표시기",
    "auto": [
      {
        "kwcagId": "kwcag:5.3.2",
        "evidence": "`<ol>` 순서 목록으로 단계의 순차 의미를 구조로 보존 (step_indicator.html:3)"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "evidence": "상태 구분이 색 단독이 아님 — 완료(done): 체크 아이콘 `ico_step_done`(\\_step_indicator.scss:91), 현재(active): 원 크기 확대(1.2rem vs 기본, scss:9·108-110) + `em.sr-only \"현재단계\"` 텍스트(step_indicator.html:24, 60) + 각 단계에 \"N단계\" 가시 텍스트"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "킷 조각 자체는 id 없음·문법 무결"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "stepTitles (`span.step-tit`)",
        "rule": "\"단계 레이블\" 플레이스홀더 교체 필수, 각 단계의 실제 작업명"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "field": "currentStepMarker",
        "rule": "단계 갱신(페이지 전환) 시 `li.active` 정확히 1개 + 그 안에 `em.sr-only \"현재단계\"` 동반 유지 — 킷 예제 패턴에서 sr-only 누락·복수 active 금지. `done` 클래스는 지나온 단계 전부에 부여"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast (`i.step` \"N단계\" 텍스트·완료/현재/대기 상태별 색 조합 미검증)"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:structured_list",
    "name": "구조화 목록",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "상호작용 요소가 전부 네이티브 `<a href>`·`<button type=\"button\">`"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "네이티브 초점 + 전역 `*:focus` outline (common.css:1053). 카드 내 초점 순서 = DOM 순서(타이틀 링크 → 신청 → 공유 → 찜)"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "공유하기·찜하기 버튼의 가시 레이블이 콘텐츠 텍스트로 존재 — accessible name에 포함됨. 아이콘 `<i class=\"svg-icon\">`은 빈 요소(CSS 배경)라 네임 오염 없음"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "`<a>`가 `<p>`를 감싸는 구조는 유효(a는 transparent 콘텐츠 모델). id 미사용 — 중복 위험 없음",
        "caveat": "같은 항목에 미해결 질문 있음: 킷 마크업 자체 결함 2건: (a) 페이지네이션 `<span class=\"page-navi prev disabled\" href=\"#\">` — span에 href 속성(유효하지 않음, 키보드로는 도달 불가한 '이전' 컨트롤이기도 함), (b) `colgroup`의 `<col>` 7개 vs 실제 열 6개 불일치. 킷 업스트림 결함으로 보고·정정 전제(①)로 둘지, 사용처 정정 필수 입력(②)으로 강제할지? **[PoC 실측 2026-09-11]** 별개로 `axe:label`(빈 행 체크박스 레이블)·`axe:empty-table-header` **위반 검출** — ② rowCheckboxLabel 강제의 근거가 실측으로 확인됐다"
      },
      {
        "kwcagId": "kwcag:5.3.1",
        "evidence": "`<caption>` 요소 + `thead th[scope=\"col\"]` + 행별 `th[scope=\"row\"]` + 다운로드 열에 sr-only 헤더(`<th scope=\"col\"><span class=\"sr-only\">다운로드</span></th>`) — 셀-제목 셀 연결 구조 제공"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "scope": "상단 컨트롤",
        "evidence": "전체선택 체크박스 `label[for=\"list_chk_all\"]`(텍스트 \"전체선택\"), 목록 개수·정렬 select에 `label[for]` 연결"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "컨트롤 전부 네이티브 input/button/select/a"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:6.4.3",
        "field": "cardTitle, actionLinkTitle, href",
        "rule": "\"신청하기\" 링크가 카드마다 동일 텍스트 — 킷은 `title=\"타이틀 영역\"`으로 구분하는 패턴. title을 각 카드의 실제 타이틀로 교체(placeholder \"타이틀 영역\" 금지), href=\"#\" 금지, cardTitle 비어있음 금지"
      },
      {
        "kwcagId": "kwcag:5.3.1",
        "field": "captionText, columnHeaders",
        "rule": "킷 샘플 caption(\"000에 대한 표로…\") 교체 — 표의 성격·구성 요약, 비어있음·placeholder 금지. th 텍스트 비어있음 금지(시각적 숨김 필요 시 sr-only 허용)"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "rowCheckboxLabel",
        "rule": "**킷 샘플의 행 체크박스 레이블이 빈 요소** (`<label for=\"list_chk_1\"></label>`) — 그대로 쓰면 접근 가능한 네임 없음(axe:label 실패). 행 식별 텍스트(예: sr-only \"〈제목〉 선택\") 필수, 비어있음 금지"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "checkboxIds",
        "rule": "`list_chk_N` id를 페이지 내 유일하게 재부여 — 컴포넌트 2회 이상 배치·행 복제 시 중복 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:5.4.4",
        "delegate": "수동 체크 — 카드 간 경계 구분은 킷 CSS + 페이지 배치에 좌우 (번역표: 커버리지 none)"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — sr-only \"현재페이지\"는 시각 단서가 아님. 현재 페이지가 색 외 시각 단서로도 구분되는지 확인 (pagination 섹션과 동일 기준)"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "delegate": "수동 체크 — 정렬 select 변경 시의 동작(자동 재조회 등)은 킷 JS에 없고 사용처 구현. 입력만으로 맥락 변화 금지 확인"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인) + 수동 — 아이콘 텍스트 버튼·페이지 링크 크기"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.1.1",
        "question": "킷 마크업 자체 결함 2건: (a) 페이지네이션 `<span class=\"page-navi prev disabled\" href=\"#\">` — span에 href 속성(유효하지 않음, 키보드로는 도달 불가한 '이전' 컨트롤이기도 함), (b) `colgroup`의 `<col>` 7개 vs 실제 열 6개 불일치. 킷 업스트림 결함으로 보고·정정 전제(①)로 둘지, 사용처 정정 필수 입력(②)으로 강제할지? **[PoC 실측 2026-09-11]** 별개로 `axe:label`(빈 행 체크박스 레이블)·`axe:empty-table-header` **위반 검출** — ② rowCheckboxLabel 강제의 근거가 실측으로 확인됐다"
      }
    ]
  },
  {
    "componentId": "krds:tab",
    "name": "탭",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "탭이 네이티브 `<button>`(Enter/Space 활성화) + `setupKeyboardNavigation`이 ArrowLeft/Right 초점 이동 구현 (ui-script.js L778–789)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "초점은 항상 네이티브 버튼에 위치, 화살표 이동 순서 = DOM 형제 순서(`nextElementSibling` 기반). 선택 상태는 JS가 sr-only \"선택됨\" 텍스트로 보완 (L760–765, L746)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "tabLabel",
        "rule": "탭 버튼 텍스트 비어있음 금지 (axe:aria-tab-name 대응). aria-selected/role 토글은 킷 JS가 자동 처리 (L725–748)"
      },
      {
        "kwcagId": "kwcag:6.4.2",
        "field": "panelTitle",
        "rule": "각 `.tab-conts`의 sr-only `<h3>` 텍스트 — 비어있음 금지, 패널 내용을 식별하는 제목"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "`li[role=\"tab\"]` **내부에** 초점 요소 `<button>`이 중첩 (tab.html L6–11, JS L727) — aria-selected 보유 요소와 초점 요소가 분리되고 axe:nested-interactive 위반 소지. 킷 구조 자체 문제. **[PoC 실측 2026-09-11]** `axe:nested-interactive` **위반 확정** — krds.go.kr `#tabInfo01~03`에서도 동일 재현. 킷 업스트림 보고 대상이며, 사용처는 `li`에서 role 제거 또는 button을 탭 요소로 승격해야 한다 **[KRDS 운영팀 확인 · 수정 예정]** 동일 지적에 대해 운영팀이 부적절함을 인정하고, `role=\"tab\"`을 `<button>`/`<a>` 등 초점 요소에 직접 부여하도록 구조를 수정하겠다고 회신했다. **현 판정은 v1.1.0(d6bb184) 기준이며, 킷 개정 시 재검증해 ①로 승격 가능하다.**"
      }
    ]
  },
  {
    "componentId": "krds:table",
    "name": "테이블",
    "auto": [
      {
        "kwcagId": "kwcag:5.3.1",
        "scope": "구조",
        "evidence": "`<caption>` + `thead th[scope=\"col\"]` + `tbody th[scope=\"row\"]` — 보조기술이 셀-제목 셀 관계 인식 가능. axe:td-headers-attr·th-has-data-cells 통과 구조"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "colgroup `<col>` 2개 = 열 2개 정합, 중첩·중복 없음"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "evidence": "단순 2열 표 — DOM 순서(행 우선) = 읽기 순서. 셀 병합 없음"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:5.3.1",
        "scope": "내용",
        "field": "captionText, headerTexts",
        "rule": "captionText: 킷 샘플 문구 교체, 표의 성격·구성 요약, 비어있음·placeholder 금지. headerTexts: 각 th 비어있음 금지. 표 구성의 이해 용이성(복잡한 병합 표로 확장 시)은 수동 확인"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:tag",
    "name": "태그",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "기본: 네이티브 `<button type=\"button\" class=\"btn-delete\">` / #link: 네이티브 `<a href>` — 키보드 조작 가능"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "네이티브 초점 요소 + 킷 전역 `*:focus` outline (common.css:1053) — DOM 순서 = 시각 순서"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "기본",
        "evidence": "삭제 버튼에 `<span class=\"sr-only\">삭제</span>` 제공 — 접근 가능한 네임 존재 (axe:button-name 통과 구조). ARIA 속성 미사용이라 형식 오류 여지 없음"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "기본",
        "field": "deleteButtonLabel",
        "rule": "sr-only 텍스트에 삭제 대상 태그명 포함(예: \"〈태그명〉 삭제\"). 킷 샘플은 전 버튼이 동일한 \"삭제\" — 태그 여러 개일 때 대상 구분 불가하므로 교체 필수"
      },
      {
        "kwcagId": "kwcag:6.4.3",
        "scope": "#link",
        "field": "linkText, href",
        "rule": "linkText 비어있음 금지·목적 이해 가능(\"태그\" placeholder 교체), href=\"#\" placeholder 금지"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인 활성화 필요) + 수동 — small 변형의 삭제 버튼 크기"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "scope": "삭제 후 초점",
        "delegate": "수동 체크 — 킷에 삭제 동작 JS가 없다(btn-delete 바인딩 부재). 태그를 지울 때 다음 태그 또는 컨테이너로 초점을 옮기는 것은 사용처 구현 책임 (kit-bugs.md K3)"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:text_input",
    "name": "텍스트 입력 필드",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<input type=\"text"
      },
      {
        "kwcagId": "kwcag:5.1.1",
        "scope": "#icon",
        "evidence": "부속 아이콘 버튼에 킷이 sr-only 텍스트를 직접 제공 — `<span class=\"sr-only\">입력한 비밀번호 보기</span>`, `내용 삭제` 등 (킷 텍스트를 수정 없이 쓸 때)"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`<label for>`↔`<input id>` 연결 구조 — 가시 레이블 텍스트가 곧 접근 가능한 이름"
      },
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "입력 자체는 네이티브 컨트롤 — 브라우저 기본 활성 동작(업 이벤트 기반)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText",
        "rule": "비어있음 금지 (axe:label). placeholder만으로 레이블 대체 금지 — 킷 데모의 \"레이블\" 자리 텍스트 교체 필수"
      },
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "inputId",
        "rule": "`label[for]`와 `input[id]` 일치 필수, 비어있음 금지"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "inputId",
        "rule": "페이지 내 유일 (킷 데모 id `consult_name` 등 복붙 시 중복 위험)"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "scope": "#state",
        "field": "errorMessage + aria 연결",
        "rule": "`is-error` + `p.form-hint-invalid` 사용 시 메시지 비어있음 금지·정정 방법 포함. **킷 마크업에는 `aria-describedby`/`aria-invalid` 연결이 없음** — 사용자가 `input[aria-describedby]`→힌트 id, `aria-invalid=\"true\"`를 추가해야 보조기술에 전달됨"
      },
      {
        "kwcagId": "kwcag:7.3.4",
        "field": "autocomplete (개인정보·반복 입력 필드일 때)",
        "rule": "유효한 autocomplete 토큰 (axe:autocomplete-valid) — 킷 마크업에 autocomplete 속성 없음"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast — placeholder·`form-hint` 계열 텍스트 대비 포함"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "scope": "#state",
        "delegate": "수동 체크 — 오류/성공 상태가 테두리 색 외에 메시지 텍스트로도 전달되는지 (메시지 생략 시 색 단독 전달이 됨)"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "scope": "시각 표시",
        "delegate": "수동 체크 — **킷이 전역 `*:focus` outline·box-shadow를 이 컴포넌트에서 제거하고**(`_input.scss:105`, `_select.scss:105`: `outline:none; box-shadow:none`) 테두리 색·굵기(2px) 변경으로 대체. 대체 표시의 대비·식별성 렌더링 후 실측 필요"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "scope": "#icon",
        "delegate": "axe:target-size (옵트인) — 입력 내 아이콘 버튼 크기"
      },
      {
        "kwcagId": "kwcag:5.3.3",
        "delegate": "수동 체크 — `form-hint` 도움말 문구가 감각 특성(색·위치)에만 의존하지 않는지"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "scope": "#state",
        "delegate": "수동 체크 — 오류 발생 시점 알림(포커스 이동·aria-live 등) 동작은 사용자 구현 영역"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:text_list",
    "name": "텍스트 목록",
    "auto": [
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "`krds_infoList`가 `.krds-info-list`에 `role=\"list\"`, 하위 `li`에 `role=\"listitem\"` 동적 부여(ui-script.js:2110-2114) — CSS `list-style` 제거 시 Safari/VoiceOver의 목록 의미 소실을 보완하는 유효한 ARIA 사용(ul/li 암시적 role의 명시 재선언 — aria-required-children/parent 정합)"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "evidence": "중첩 목록이 전부 `li` 내부에 배치 — 유효한 중첩. id 미사용"
      },
      {
        "kwcagId": "kwcag:5.3.2",
        "evidence": "목록 위계(레벨1→2→3)가 DOM 중첩 구조와 일치",
        "caveat": "같은 항목에 미해결 질문 있음: `<ol>` 네이티브 순번 위에 `<span class=\"num\">1. / a. / ①</span>` 수동 마커를 병기 — 스크린리더가 위치(\"1/3\")와 마커 텍스트(\"1.\")를 이중 낭독할 수 있다(span에 aria-hidden 없음). 5.3.2 저해로 볼지, 무해한 중복으로 N/A 처리할지? (킷에 span.num 숨김 처리 없음 확인)"
      }
    ],
    "conditional": [],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:5.3.2",
        "scope": "#ordered",
        "question": "`<ol>` 네이티브 순번 위에 `<span class=\"num\">1. / a. / ①</span>` 수동 마커를 병기 — 스크린리더가 위치(\"1/3\")와 마커 텍스트(\"1.\")를 이중 낭독할 수 있다(span에 aria-hidden 없음). 5.3.2 저해로 볼지, 무해한 중복으로 N/A 처리할지? (킷에 span.num 숨김 처리 없음 확인)"
      }
    ]
  },
  {
    "componentId": "krds:textarea",
    "name": "텍스트 영역",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<textarea>`"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`<label for=\"textarea\">`↔`<textarea id>` 연결 — 가시 레이블 = 접근 가능한 이름"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText, textareaId",
        "rule": "비어있음 금지, for/id 일치, id 페이지 내 유일 (8.1.1 겸함)"
      },
      {
        "kwcagId": "kwcag:7.3.4",
        "field": "autocomplete (해당 시)",
        "rule": "유효 토큰"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "scope": "시각 표시",
        "delegate": "수동 체크 — **킷이 전역 `*:focus` outline·box-shadow를 이 컴포넌트에서 제거하고**(`_input.scss:105`, `_select.scss:105`: `outline:none; box-shadow:none`) 테두리 색·굵기(2px) 변경으로 대체. 대체 표시의 대비·식별성 렌더링 후 실측 필요"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "글자수 카운터",
        "delegate": "수동 체크 — `.textarea-count`(`0/100`)는 **마크업만 있고 계수 JS·maxlength·textarea와의 연결(aria-describedby)·상태 알림(aria-live)이 전부 없음**. 카운터를 쓰려면 사용자가 전부 구현하고 보조기술 전달을 수동 확인"
      },
      {
        "kwcagId": "kwcag:7.3.1",
        "delegate": "수동 체크 — 킷 HTML에 오류 예시가 없고 CSS만 있음(`_input.scss:205` `.textarea-bottom .form-hint-invalid`). 오류 시 `.is-error` + `p.form-hint-invalid`, textarea에 aria-invalid·aria-describedby 연결 (get_component 조립 지침, KRDS 입력폼 지침 global_08)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.2.1",
        "question": "카운터가 최대 글자수 도달 시 입력 차단으로 동작한다면 \"시간 제한\"은 아니나, 잘림 통지가 필요한가? 카운터의 요구 스펙 자체가 킷에 없어 판단 보류"
      }
    ]
  },
  {
    "componentId": "krds:toggle_switch",
    "name": "토글 스위치",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<input type=\"checkbox\">` 기반 — Space 토글 보장"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "`<label for>` 연결 — 가시 레이블 텍스트(`switch : default` 자리)가 접근 가능한 이름. 스위치 비주얼(`span.switch-toggle > i`)은 label 내부 장식"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "evidence": "네이티브 checkbox 시맨틱 — checked 상태 자동 노출 (`role=\"switch\"` 미사용이나 checkbox 노출은 유효한 패턴)"
      },
      {
        "kwcagId": "kwcag:6.5.2",
        "evidence": "네이티브 컨트롤"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:7.3.2",
        "field": "labelText, inputId",
        "rule": "비어있음 금지, for/id 일치 — 레이블은 스위치가 **제어하는 대상**을 서술 (on/off 상태를 텍스트로 쓰면 checked와 중복·모순)"
      },
      {
        "kwcagId": "kwcag:8.1.1",
        "field": "inputId",
        "rule": "페이지 내 유일"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.1",
        "delegate": "수동 체크 — on/off가 색 외에 knob 위치로도 구분되는지 렌더링 확인"
      },
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "수동 체크 — 초점 표시 (커스텀 비주얼이 네이티브 초점 링을 가리지 않는지)"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "delegate": "axe:target-size (옵트인)"
      },
      {
        "kwcagId": "kwcag:7.2.1",
        "delegate": "수동 체크 — 토글 즉시 설정 반영은 허용되나, 토글만으로 페이지 이동 등 맥락 변화 금지 (구현자 책임)"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:tooltip",
    "name": "툴팁",
    "auto": [
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "focus 시 표시·focusout 시 닫힘 (registerEvents L1174–1179) + Escape로 전체 닫기 (document keydown L1152–1158) — 키보드만으로 표시/해제 가능. 트리거는 네이티브 `<button>`",
        "scope": "#box"
      },
      {
        "kwcagId": "kwcag:6.5.3",
        "evidence": "트리거의 `aria-labelledby`가 가리키는 팝오버 첫머리에 원 버튼 텍스트를 sr-only로 삽입 (createTooltipPopover L1161–1173) — 가시 레이블이 접근 가능한 네임에 포함",
        "scope": "#box"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "field": "tooltipText, iconButtonLabel",
        "rule": "`data-tooltip` 비어있음 금지(비면 JS가 초기화 스킵 L1136), 150자 내외(킷 자체 가이드 문구), 대화형 요소 포함 금지. 아이콘 전용 트리거는 sr-only 레이블(tooltip_box.html L8) 필수",
        "scope": "#box"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast",
        "scope": "#box"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "팝오버가 `aria-hidden=\"true\"`로 생성되고 (L1165) 표시 시에도 해제되지 않음 (showTooltip L1180–1196) — 툴팁 내용이 트리거의 accessible name(aria-labelledby) 경유로만 전달됨. 장문 텍스트를 네임에 싣는 방식과 `role=\"tooltip\"` 부재가 8.2.1 적합인지 스크린리더 실측 필요",
        "scope": "#box"
      }
    ]
  },
  {
    "componentId": "krds:tts",
    "name": "음성 안내",
    "auto": [
      {
        "kwcagId": "kwcag:5.4.2",
        "evidence": "소리는 자동 재생되지 않음 — 사용자 클릭(user gesture)에서만 speak 호출(ui-script.js:2488 주석·:2421), 재생 중 같은 버튼 재클릭으로 정지(toggle :2432-2440) — 제어 수단 내장"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "기본·#size",
        "evidence": "토글 버튼 패턴: `aria-pressed` 초기값 부여(:2418) 및 재생/정지 시 갱신(:2458, :2472) — button에 유효한 속성. 장식 아이콘 `aria-hidden=\"true\"` 처리"
      },
      {
        "kwcagId": "kwcag:6.1.1",
        "evidence": "네이티브 `<button type=\"button\">`, 비활성은 `disabled` 속성 — 보조기술·키보드에 상태 전달"
      },
      {
        "kwcagId": "kwcag:5.4.1",
        "evidence": "재생 상태를 색·아이콘만이 아니라 `aria-pressed` + 레이블 텍스트 전환(\"재생\"↔\"멈춤\", updateText :2565-2579)으로 표시"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "evidence": "네이티브 초점 + 전역 `*:focus` outline (common.css:1053)"
      }
    ],
    "conditional": [
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "#icon",
        "field": "accessibleName",
        "rule": "**아이콘 전용 변형은 접근 가능한 네임이 없다** — 유일한 콘텐츠가 `aria-hidden=\"true\"` 아이콘(tts_icon.html) → axe:button-name·aria-toggle-field-name 실패. `aria-label`(또는 sr-only 텍스트) 필수, 비어있음 금지"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "scope": "기본·#size",
        "field": "buttonLabel, ttsText",
        "rule": "buttonLabel: `.krds-tts-text`의 \"레이블\" placeholder를 읽을 대상을 알 수 있는 텍스트로 교체. ttsText: 읽을 텍스트(onclick `krds_playTts('…', this)` 인자 또는 `data-tts-text`) — 비어있음 금지(빈 문자열이면 무동작, ui-script.js:2443·:2585)"
      }
    ],
    "outOfScope": [
      {
        "kwcagId": "kwcag:5.4.3",
        "delegate": "axe:color-contrast"
      },
      {
        "kwcagId": "kwcag:6.1.3",
        "scope": "#size xsmall",
        "delegate": "axe:target-size (옵트인) + 수동 — 최소 크기 변형"
      }
    ],
    "unresolved": []
  },
  {
    "componentId": "krds:tutorial_panel",
    "name": "따라하기 패널",
    "auto": [],
    "conditional": [],
    "outOfScope": [
      {
        "kwcagId": "kwcag:6.1.1",
        "delegate": "\"그만 따라하기\"(`.coach-btn-stop`)·따라하기 진행 제어의 동작 JS 킷 미제공 (ui-script.js에 해당 핸들러 없음) — coach_mark 연동 로직은 사용처 구현 + 수동 키보드 실사"
      },
      {
        "kwcagId": "kwcag:6.1.2",
        "delegate": "따라하기 시작 시 코치마크로의 초점 이동·종료 시 복귀 — 사용처 구현 (coach_mark ③과 연동)"
      }
    ],
    "unresolved": [
      {
        "kwcagId": "kwcag:6.4.2",
        "question": "따라하기 목록에서 `h4.help-title`(제목)과 `li > h4.tit`(Task 항목)이 같은 h4 레벨로 병렬 (tutorial_panel.html:121, 128) — 계층상 Task는 h5여야 하지 않나? 킷 패턴 준수 vs 교정 권고 결정 필요 (자동 검사 범위 밖 — 수동 확인)"
      },
      {
        "kwcagId": "kwcag:8.2.1",
        "question": "**[PoC 실측 2026-09-11]** help_panel과 동일한 `li[role=tab]` 내부 button 구조로 `axe:nested-interactive` **위반 확정** **[KRDS 운영팀 확인 · 수정 예정]** 동일 지적에 대해 운영팀이 부적절함을 인정하고, `role=\"tab\"`을 `<button>`/`<a>` 등 초점 요소에 직접 부여하도록 구조를 수정하겠다고 회신했다. **현 판정은 v1.1.0(d6bb184) 기준이며, 킷 개정 시 재검증해 ①로 승격 가능하다.**"
      }
    ]
  }
];
