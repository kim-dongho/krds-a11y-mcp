// get_component가 마크업과 함께 내보내는 처방 데이터 — 조립 지침·폼 지침·응용 패턴

/** 사이트 공통부 컴포넌트의 조립 지침 — 실측 조립 검증(2026-09-15)에서 확인된 함정 */
export const ASSEMBLY_NOTES: Record<string, string[]> = {
  "krds:header": [
    "이 마크업은 자체가 <header> 랜드마크다 — 페이지의 <header> 슬롯 요소를 **통째로 교체**하라.",
    "슬롯 안에 중첩하면 banner 랜드마크가 중복되어 위반이 된다 (landmark-no-duplicate-banner).",
    "킷 데모 헤더의 메뉴(\"1Depth\"·\"메뉴명\")와 로고(KRDS)는 자리 문구다. get_page_scaffold에 withSiteChrome: true와 siteMenu(1~3단계 트리)·orgName·logoSrc를 주면 같은 킷 구조로 메뉴·모바일 전체메뉴·로고 교체 CSS를 만들어 준다. 로고는 CSS 배경이라 sr-only 기관명만 바꾸면 화면엔 KRDS 로고가 남는다.",
  ],
  "krds:footer": [
    "이 마크업은 자체가 <footer> 랜드마크다 — 페이지의 <footer> 슬롯 요소를 **통째로 교체**하라.",
    "슬롯 안에 중첩하면 contentinfo 랜드마크가 중복되어 위반이 된다.",
  ],
  "krds:masthead": [
    "이 마크업은 div라 랜드마크 밖에 뜬다 — `<section aria-label=\"공식 배너\">`로 감싸",
    "헤더(krds:header) 바로 위에 배치하라 (region 위반 방지).",
  ],
  "krds:identifier": [
    "푸터(krds:footer) 요소 내부의 마지막에 배치한다.",
  ],
  "krds:breadcrumb": [
    "폭 제한 CSS를 함께 넣어라 — 없으면 넓은 화면에서 좌측 끝에 붙는다 " +
      "(원본은 #container 키 규칙으로 콘텐츠 폭 정렬). 래퍼 유무와 무관하게 동작하는 셀렉터를 쓴다:",
    "`.krds-breadcrumb-wrap { padding-bottom: 0; } " +
      ".krds-breadcrumb-wrap .breadcrumb { max-width: var(--krds-contents-wrap-size); padding: 0 var(--krds-contents-padding-x); }` " +
      "(단 LNB 2단 배치(.in-between) 안에서는 불필요 — 컬럼이 정렬을 담당). 적용 여부는 validate_page가 검사한다.",
    '현재 페이지(마지막 항목) 링크에 aria-current="page"를 붙이고, 감싸는 요소는 <nav class="krds-breadcrumb-wrap" aria-label="현재 경로">로 한다 — get_page_scaffold 템플릿이 이렇게 교정돼 있고 그쪽이 정본이다(킷 원본에는 없다).',
  ],
  "krds:pagination": [
    '감싸는 요소를 <nav class="krds-pagination" aria-label="페이지 탐색">으로 하고 현재 페이지 링크에 aria-current="page"를 붙인다 — get_page_scaffold 템플릿(apply-list 등)의 교정본이 정본이다. 현재 페이지 알림은 aria-current와 킷 원본의 sr-only "현재페이지" 중 하나는 반드시 있어야 하고, 둘을 함께 두면 두 번 읽힌다.',
  ],
  // 매핑표 components/tab.md:34 — 8.2.1 위반 확정(킷 결함, 운영팀 수정 예고). 교정본은 login-tabs 템플릿
  // (templates/login-tabs.meta.json 교정 기록). 이 경고가 부품 공급까지 안 오던 공백을 실측
  "krds:tab": [
    "**위 킷 데모 마크업을 그대로 쓰면 axe nested-interactive(KWCAG 8.2.1) 위반이다** — 킷 결함(li에 role=\"tab\"·aria-selected, " +
      "그 안에 button 중첩. KRDS 운영팀 수정 예고). **위 마크업 대신 아래 교정본을 써라.**",
    "교정본 (구조 출처: login-tabs 템플릿 교정, 클래스는 킷 원본 tab.html과 동일 — 교정본을 얻으려고 다른 템플릿의 필수 입력을 지어내지 마라). " +
      "role·aria-selected·aria-controls는 button에, li는 role=\"presentation\", 킷 탭 JS는 data-listener-attached로 끈다:",
    "```html\n" +
      '<div class="krds-tab-area layer">\n  <div class="tab line full">\n    <ul role="tablist">\n' +
      '      <li role="presentation" class="active" data-listener-attached="true">\n' +
      '        <button type="button" class="btn-tab" role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1">탭 1</button>\n' +
      "      </li>\n" +
      '      <li role="presentation" data-listener-attached="true">\n' +
      '        <button type="button" class="btn-tab" role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">탭 2</button>\n' +
      "      </li>\n    </ul>\n  </div>\n" +
      '  <div class="tab-conts-wrap">\n' +
      '    <section id="panel-1" role="tabpanel" aria-labelledby="tab-1" class="tab-conts active">…</section>\n' +
      '    <section id="panel-2" role="tabpanel" aria-labelledby="tab-2" class="tab-conts">…</section>\n' +
      "  </div>\n</div>\n```",
    "탭 동작 스크립트 (킷 JS 대신 — 클릭, 좌우 화살표·Home·End 전환, roving tabindex로 선택된 탭만 Tab 정지점):",
    "```js\n" +
      'var tabs = [].slice.call(document.querySelectorAll(".krds-tab-area .btn-tab"));\n' +
      "function select(btn, focus) {\n" +
      "  tabs.forEach(function (b) {\n" +
      "    var on = b === btn;\n" +
      '    b.setAttribute("aria-selected", on ? "true" : "false");\n' +
      '    b.setAttribute("tabindex", on ? "0" : "-1");\n' +
      '    b.closest("li").classList.toggle("active", on);\n' +
      '    document.getElementById(b.getAttribute("aria-controls")).classList.toggle("active", on);\n' +
      "  });\n" +
      "  if (focus) btn.focus();\n" +
      "}\n" +
      "tabs.forEach(function (btn, i) {\n" +
      '  btn.addEventListener("click", function () { select(btn, false); });\n' +
      '  btn.addEventListener("keydown", function (e) {\n' +
      "    var n = tabs.length;\n" +
      '    var to = e.key === "ArrowRight" ? (i + 1) % n : e.key === "ArrowLeft" ? (i - 1 + n) % n\n' +
      '      : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;\n' +
      "    if (to >= 0) { e.preventDefault(); select(tabs[to], true); }\n" +
      "  });\n" +
      "});\n```",
    "React·Vue에서는 이 동작을 컴포넌트 상태로 옮겨도 된다 (구조·속성은 유지). 킷이 수정되면 li의 role·data 속성과 이 스크립트를 걷어낸다.",
  ],
  // 템플릿 33종 실사용 분포가 근거 (2026-10-13 집계). 기본값 제안이고 다르게 골라도 된다
  "krds:button": [
    "위계와 크기 클래스를 골라 붙여라 — 킷 샘플(button.html)은 class=\"krds-btn\" 하나뿐이라 그대로 쓰면 모든 버튼이 큰 기본형이 된다(validate_page가 경고한다). " +
      "위계: primary(화면의 주 행동 1개) · secondary · tertiary(보조·취소) · text·link(문장 속 가벼운 행동). 크기: xsmall·small·medium·large·xlarge",
    "템플릿에서 쓰인 기본값(달리 골라도 된다): 페이지 하단 주요 동작은 xlarge — 다음·제출은 primary, 이전·임시저장은 tertiary. 표 칸 안 동작은 medium. 본문 속 가벼운 동작은 medium text",
    "버튼 묶음 배치는 npm 킷 CSS에 없다(.btn-wrap은 width:100%뿐). get_page_scaffold 패턴 템플릿에는 page-btn-wrap 규칙이 동봉돼 있으니 그것을 쓰거나, 자기 CSS로 flex·gap을 준다:\n" +
      "```html\n<div class=\"page-btn-wrap\">\n  <a class=\"krds-btn xlarge tertiary\" href=\"/numbers\">목록으로</a>\n  <button type=\"button\" class=\"krds-btn xlarge primary\">출력</button>\n</div>\n```\n" +
      "템플릿 규칙: `.page-btn-wrap { display: flex; justify-content: flex-end; gap: var(--krds-gap-5); margin-top: var(--krds-gap-9); }`",
    "같은 동작은 화면마다 같은 모양으로 둔다 — 한 화면에서 버튼이던 \"출력\"이 다른 화면에서 밑줄 링크가 되면 같은 기능으로 알아보기 어렵다. 이동은 a, 그 자리에서 실행은 button",
  ],
  // 킷 모달은 열 때 #wrap에 inert를 건다(ui-script.js L969). #wrap 안에 두면 모달 자신이 막히고,
  // #wrap이 없으면 배경이 막히지 않는다 (widget-keyboard·route-reinit 테스트 실측)
  "krds:modal": [
    "**배치: 모달 마크업은 #wrap 밖(형제)에 둔다.** 킷은 모달을 열 때 #wrap 전체에 inert를 걸어 배경을 막는다. #wrap 안에 두면 모달 자신까지 막혀 초점·Escape가 동작하지 않고, #wrap이 없으면 배경이 막히지 않는다.",
    "get_page_scaffold 페이지는 헤더·본문·푸터가 `<div id=\"wrap\">`로 감싸져 있다. 그 닫는 `</div>` 뒤 \"#wrap 밖\" 주석 자리에 모달을 넣는다. include 조각(output: parts)이면 scripts 조각 맨 앞의 `</div>`(#wrap 끝) 뒤다.",
    "React·Vue: 앱 셸(헤더·본문·푸터)의 최상위 요소에 id=\"wrap\"을 주고, 모달은 포털로 body에 직접 그린다 (React `createPortal(모달, document.body)`, Vue `<Teleport to=\"body\">`).",
  ],
  "krds:text_input": formNotes("input"),
  "krds:select": formNotes("select"),
  "krds:textarea": formNotes("textarea"),
  "krds:date_input": formNotes("input"),
  "krds:checkbox": formNotes("group"),
  "krds:radio_button": formNotes("group"),
};

/**
 * 필수 표시·오류 정정 (kwcag:7.3.1·7.3.2) — 킷 HTML에는 필수 표시·aria-invalid·aria-describedby가 하나도 없다.
 * 근거: KRDS 입력폼 지침 (krds.go.kr global_08 — 필수·선택을 텍스트 또는 별표로 구분, 사이트 전체 일관,
 * 오류 항목을 정확히 알리고 제출 시 첫 오류 항목으로 초점), WCAG 기법 H90·G83·ARIA21·ARIA1
 */
function formNotes(kind: "input" | "select" | "textarea" | "group"): string[] {
  const control = kind === "group" ? "fieldset" : kind;
  const markup =
    kind === "group"
      ? '<div class="form-group">\n' +
        '  <!-- 화면용 제목 — 킷이 legend를 숨기므로 따로 둔다. 보조기술에는 legend가 읽히니 aria-hidden -->\n' +
        '  <div class="form-tit" aria-hidden="true">약관 동의 (필수)</div>\n' +
        '  <fieldset aria-describedby="agree-error">\n' +
        '    <legend>약관 동의 (필수)</legend>\n' +
        '    <!-- 체크박스·라디오 항목들 — 각 input에 required는 하나라도 체크해야 할 때만 -->\n' +
        "  </fieldset>\n" +
        '  <p class="form-hint-invalid" id="agree-error">약관에 동의해 주세요.</p>\n' +
        "</div>"
      : kind === "select"
        ? // 킷 데모(select_state.html)는 is-error를 select 자체에 붙인다
          '<div class="form-group">\n' +
          '  <div class="form-tit"><label for="receive-type">수령 방법 (필수)</label></div>\n' +
          '  <div class="form-conts">\n' +
          '    <select id="receive-type" class="krds-form-select is-error" required aria-invalid="true" aria-describedby="receive-type-error">\n' +
          '      <option value="">선택</option>\n' +
          '      <option value="visit">방문 수령</option>\n' +
          "    </select>\n" +
          "  </div>\n" +
          '  <p class="form-hint-invalid" id="receive-type-error">수령 방법을 선택해 주세요.</p>\n' +
          "</div>"
        : kind === "textarea"
          ? '<div class="form-group">\n' +
            '  <div class="form-tit"><label for="opinion">의견 (필수)</label></div>\n' +
            '  <div class="form-conts is-error">\n' +
            '    <textarea id="opinion" class="krds-input" required aria-invalid="true" aria-describedby="opinion-error"></textarea>\n' +
            "  </div>\n" +
            '  <p class="form-hint-invalid" id="opinion-error">의견을 입력해 주세요.</p>\n' +
            "</div>"
          : '<div class="form-group">\n' +
            '  <div class="form-tit"><label for="applicant">신청자 이름 (필수)</label></div>\n' +
            '  <div class="form-conts is-error">\n' +
            '    <input id="applicant" class="krds-input" required aria-invalid="true" aria-describedby="applicant-error">\n' +
            "  </div>\n" +
            '  <p class="form-hint-invalid" id="applicant-error">신청자 이름을 입력해 주세요.</p>\n' +
            "</div>";
  return [
    "필수 표시: 레이블 안에 텍스트로 \"(필수)\"를 넣는다(KRDS 입력폼 지침 — 텍스트 또는 별표). 별표(*)만 쓰면 스크린리더가 \"별\"로 읽으니 sr-only로 \"필수\"를 함께 둔다. 한 사이트에서 한 방식만 쓴다. " +
      (kind === "group"
        ? "그룹은 legend에 표시하되, 킷 common.css가 legend를 sr-only로 숨기므로(`.blind, hr, .sr-only, legend, caption` 규칙) 화면에 보이는 제목(form-tit, aria-hidden)을 따로 둔다 — legend만 두면 \"(필수)\"가 화면에서 사라진다(실사용 실측)."
        : "컨트롤에 required 속성도 준다."),
    "오류 정정: 오류 상태에서 메시지 `p.form-hint-invalid`에 id를 주고 " +
      (kind === "group"
        ? "fieldset에 aria-describedby로 연결한다."
        : `${control}에 aria-invalid="true"와 aria-describedby로 연결한다.`) +
      " 메시지는 어느 항목이 왜 틀렸고 어떻게 고치는지 말한다. 색 테두리만으로는 불합격(kwcag:5.4.1).",
    "제출 시 검증에 실패하면 첫 오류 항목으로 초점을 옮긴다(KRDS 입력폼 지침). 오류가 풀리면 aria-invalid와 메시지를 함께 걷어낸다. " +
      "**메시지를 hidden 속성으로 숨기지 마라** — 킷 CSS(`.form-group [class^=form-hint] { display: flex }`)가 hidden을 덮어 항상 보인다(실측, kit-bugs.md K8). 오류가 없을 때는 요소를 렌더하지 않는다(React `{error && <p …>}`).",
    "```html\n" + markup + "\n```",
  ];
}

// KRDS가 예시로 주지 않는 응용 패턴의 처방 — 킷 부품을 올바르게 조합하는 스니펫.
// 근거: KRDS 체크박스 문서(component_06_02.html)는 라벨 붙은 형태만 제공하고,
// 표의 전체선택/행선택은 예시가 없다 (2026-09-28 실사용 테스트에서 공백 확인).
export const PRESCRIBED_PATTERNS: Record<string, { title: string; note: string; css: string; html: string }> = {
  "krds:table": {
    title: "행선택 체크박스가 있는 데이터 테이블 (관리자 목록 패턴)",
    note:
      "KRDS는 표 예시에 행선택 체크박스를 주지 않는다. 행선택이 필요하면 킷 체크박스(.krds-form-check)를 " +
      "th/td 안에 두되, 라벨은 화면에 안 보여도 반드시 sr-only로 넣어라 — 스크린리더 사용자가 무엇을 선택하는지 " +
      "알아야 한다. 라벨 텍스트가 없으면 초점 링이 체크박스 위로 삐져나오므로 아래 정렬 CSS를 함께 넣는다.",
    css:
      "/* 라벨 없는(sr-only) 체크박스의 초점 링을 박스에 맞춘다 — 표 행선택 전용 */\n" +
      ".tbl .krds-form-check label { display: inline-flex; align-items: center; line-height: 1; }",
    html:
      '<th scope="col">\n' +
      '  <div class="krds-form-check">\n' +
      '    <input type="checkbox" id="row-all">\n' +
      '    <label for="row-all"><span class="sr-only">전체 선택</span></label>\n' +
      "  </div>\n" +
      "</th>\n" +
      "<!-- 각 행 -->\n" +
      '<td>\n' +
      '  <div class="krds-form-check">\n' +
      '    <input type="checkbox" id="row-1">\n' +
      '    <label for="row-1"><span class="sr-only">1행 선택</span></label>\n' +
      "  </div>\n" +
      "</td>",
  },
};
