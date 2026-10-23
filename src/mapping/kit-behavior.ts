// 킷 ui-script.js가 컴포넌트마다 붙이는 동작 — 상태 클래스, 바꾸는 aria, 초기화 선택자.
// 소비자가 이 정보를 얻으려고 킷 JS를 직접 grep하던 마찰(실사용)을 흡수한다.
// SPA에서 상태를 직접 다룰 때도 같은 클래스를 써야 킷 CSS가 먹는다.
//
// 근거: krds-uiux v1.1.0 resources/js/component/ui-script.js. module은 그 파일의 객체 이름이다.
// tests/kit-behavior.test.ts가 module·selector·stateClasses 문자열이 설치된 킷에 실제로 있는지
// 대조한다 — 킷이 개정되면 테스트가 깨져 알려준다.

export type KitBehavior = {
  /** ui-script.js의 객체 이름 */
  module: string;
  /** 이 선택자에 맞는 요소가 있어야 초기화된다 */
  selector: string;
  /** JS가 붙이고 떼는 상태 클래스 — 어디에 붙는지 */
  stateClasses: { name: string; on: string }[];
  /** JS가 직접 설정하는 aria·role */
  aria: string[];
  /** 다시 init해도 리스너가 중복되지 않는가 */
  rebindSafe: boolean;
  /** React·Vue가 상태를 소유할 때 킷 동작을 끄는 법 — 확인한 모듈만 적는다 */
  optOut?: string;
  note?: string;
};

export const KIT_BEHAVIOR: Record<string, KitBehavior> = {
  "krds:accordion": {
    module: "krds_accordion",
    selector: ".btn-accordion",
    stateClasses: [
      { name: "active", on: "열린 .btn-accordion과 .accordion-item" },
      { name: "is-open", on: ".krds-accordion — 처음부터 모두 펼침 (마크업에 직접)" },
    ],
    aria: ["버튼 aria-expanded·aria-controls·id", ".accordion-collapse에 role=region·aria-labelledby"],
    rebindSafe: true,
    // 2026-10-13 실측: init 뒤에 마운트한 .btn-accordion에는 킷이 붙지 않고, 그 뒤 DOMContentLoaded를 재발행하면 붙는다
    optOut:
      "킷은 초기화 시점에 이미 있는 .btn-accordion에만 리스너를 건다(이벤트 위임 없음). 킷 초기화(get_framework_guide 처방의 DOMContentLoaded 재발행 포함)가 " +
      "끝난 뒤에 아코디언을 마운트하면 킷이 붙지 않는다 — 그다음 aria-expanded·aria-controls와 active 클래스를 직접 관리한다. " +
      "마운트 뒤에 재발행이 또 일어나면(라우트 전환마다 재발행 등) 킷이 다시 붙어 id를 무작위 값으로 덮어쓰고 함께 토글하니, 재발행은 아코디언 마운트 전에 끝낸다",
    note: '.krds-accordion에 data-type="multiOpen"이면 여러 개 동시에 펼침 (기본 singleOpen)',
  },
  "krds:tab": {
    module: "krds_tab",
    selector: ".krds-tab-area.layer",
    stateClasses: [{ name: "active", on: "선택된 li와 그 .tab-conts" }],
    aria: ["li에 role=tab·aria-selected (킷 결함 — 조립 지침의 교정 마크업 참고)", ".tab-conts에 role=tabpanel"],
    rebindSafe: true,
    optOut: 'li에 data-listener-attached="true"를 미리 두면 킷이 그 탭을 건너뛴다 (조립 지침의 교정 마크업이 이 방식)',
    note: "li에 data-listener-attached가 있으면 킷 JS가 건너뛴다 — 교정 마크업은 이것으로 킷 동작을 끈다",
  },
  "krds:modal": {
    module: "krds_modal",
    selector: ".open-modal",
    stateClasses: [
      { name: "shown", on: ".modal (열림 시작)" },
      { name: "in", on: ".modal과 .modal-back (보임)" },
      { name: "modal-opened", on: "연 트리거 버튼 (닫으면 초점 복귀 대상)" },
      { name: "scroll-no", on: "body" },
    ],
    aria: ["role=dialog", "배경 콘텐츠에 inert", "초점 가두기"],
    rebindSafe: false,
    optOut:
      "여는 버튼에 open-modal 클래스를 쓰지 않으면 된다 — 킷은 .open-modal과 .close-modal이 둘 다 있을 때만 초기화한다. " +
      "그 경우 shown·in 클래스, 초점 가두기·복귀, 배경 inert, Escape 닫기를 직접 구현한다",
    note: '여는 버튼 class="open-modal" data-target="모달 id", 닫는 버튼 class="close-modal"이 둘 다 있어야 동작',
  },
  "krds:disclosure": {
    module: "krds_disclosure",
    selector: ".krds-disclosure",
    stateClasses: [{ name: "active", on: ".krds-disclosure" }],
    aria: ["버튼 aria-expanded·aria-controls", "접힌 영역에 inert"],
    rebindSafe: false,
  },
  "krds:side_navigation": {
    module: "krds_sideNavigation",
    selector: ".krds-side-navigation .lnb-list",
    stateClasses: [{ name: "active", on: "펼친 .lnb-toggle과 그 li, 현재 페이지 항목" }],
    aria: ["토글 aria-expanded·aria-controls·aria-haspopup", "현재 페이지 링크 aria-current=page"],
    rebindSafe: false,
  },
  "krds:main_menu": {
    module: "krds_mainMenuPC",
    selector: ".gnb-main-trigger",
    stateClasses: [
      { name: "active", on: "열린 트리거와 하위 메뉴" },
      { name: "is-open", on: ".is-dropdown 하위 메뉴" },
      { name: "is-gnb-web", on: "body (PC 메뉴 열림)" },
    ],
    aria: ["트리거 aria-expanded·aria-controls·aria-haspopup", '메뉴 aria-label="메인 메뉴"'],
    rebindSafe: false,
    note: "모바일 메뉴는 krds_mainMenuMobile(.krds-main-menu-mobile)이 따로 맡는다 — is-open·is-backdrop, body에 is-gnb-mobile, 나머지 페이지에 inert",
  },
  "krds:contextual_help": {
    module: "krds_contextualHelp",
    selector: ".krds-contextual-help .tooltip-btn",
    stateClasses: [{ name: "top", on: "팝오버 위치 (left와 함께)" }],
    aria: ["버튼 aria-expanded", "팝오버 role=tooltip"],
    rebindSafe: false,
    note: "보이고 숨기는 것은 클래스가 아니라 style.display다",
  },
  "krds:tooltip": {
    module: "krds_tooltip",
    selector: ".krds-tooltip",
    stateClasses: [{ name: "active", on: "JS가 만든 .krds-tooltip-popover" }],
    aria: ["트리거 aria-labelledby", "팝오버 id"],
    rebindSafe: false,
    note: "팝오버 요소는 data-tooltip 값으로 JS가 만든다 — 마크업에 직접 쓰지 않는다",
  },
  "krds:help_panel": {
    module: "krds_helpPanel",
    selector: ".btn-help-exec",
    stateClasses: [
      { name: "expand", on: ".krds-help-panel" },
      { name: "scroll-no", on: "body" },
    ],
    aria: ["버튼 aria-expanded"],
    rebindSafe: false,
    note: "킷 자체가 스크롤·리사이즈 때마다 다시 init한다. PC 폭에서는 페이지 로드 때 자동으로 열린다",
  },
  "krds:calendar": {
    module: "krds_calendar",
    selector: ".krds-calendar-area",
    stateClasses: [
      { name: "active", on: "열린 달력·선택 목록" },
      { name: "period", on: "기간 선택 중간 날짜 칸 (start·end와 함께)" },
    ],
    aria: ["날짜 버튼 aria-pressed", "연·월 선택 combobox·listbox·option과 aria-selected", "열기 버튼 aria-expanded"],
    rebindSafe: false,
  },
  "krds:in_page_navigation": {
    module: "krds_inPageNavigation",
    selector: ".in-page-navigation-list",
    stateClasses: [{ name: "active", on: "현재 보이는 구역의 링크 (스크롤 감지)" }],
    aria: [],
    rebindSafe: false,
    note: ".krds-in-page-navigation-area에 sample 클래스가 있으면 동작하지 않는다",
  },
  "krds:language_switcher": {
    module: "krds_dropEvent",
    selector: ".krds-drop-wrap",
    stateClasses: [
      { name: "active", on: "열린 .drop-btn·메뉴, 선택된 .item-link" },
      { name: "drop-left", on: ".krds-drop-wrap (화면 밖으로 나갈 때 정렬)" },
    ],
    aria: ["버튼 aria-expanded", ".item-link에 aria-selected (링크에 aria-selected는 킷 결함)"],
    rebindSafe: false,
    note: "header·resize의 드롭다운도 같은 모듈이 맡는다. .krds-drop-wrap에 sample 클래스가 있으면 동작하지 않는다",
  },
  "krds:file_upload": {
    module: "krds_fileUpload",
    selector: ".file-upload",
    stateClasses: [{ name: "active", on: ".file-upload (끌어다 놓는 중)" }],
    aria: [],
    rebindSafe: false,
    note: "용량·형식 검증과 is-error 표시는 킷 JS에 없다 — 직접 구현한다",
  },
  "krds:tts": {
    module: "krds_tts",
    selector: ".krds-tts",
    stateClasses: [{ name: "is-playing", on: ".krds-tts" }],
    aria: ["aria-pressed"],
    rebindSafe: false,
  },
};

// 라우트 전환 뒤 재초기화 — 2026-10-14 실측. 같은 요소에 다시 init하면
// 탭·아코디언 말고는 리스너가 두 배가 돼 토글이 상쇄되지만(열리지 않음), 새로 마운트한 요소에는 안전하다.
// 공통부(header·footer·masthead) 데모는 아래 화면 모듈을 쓰지 않는다 — tests/route-reinit.test.ts가 대조한다.

/** 라우트 전환 뒤 새 화면에 다시 붙이는 킷 모듈 (ui-script.js 객체 이름) */
export const ROUTE_REINIT_MODULES = [
  "krds_tab", "krds_accordion", "krds_modal", "krds_disclosure", "krds_contextualHelp", "krds_tooltip", "krds_calendar",
  "krds_tts", "krds_fileUpload", "krds_toggleSwitch", "krds_infoList", "krds_chkBox", "krds_inPageNavigation",
] as const;

/** 라우트 전환 때 다시 부르지 않는 킷 모듈 — 이유 */
export const NO_ROUTE_REINIT: Record<string, string> = {
  krds_mainMenuPC: "공통 레이아웃(GNB)이라 전환 뒤에도 같은 요소가 남는다",
  krds_mainMenuMobile: "공통 레이아웃(모바일 메뉴)이라 전환 뒤에도 같은 요소가 남는다",
  krds_sideNavigation: "보통 공통 레이아웃에 두어 같은 요소가 남는다. 화면마다 사이드 내비를 새로 그리는 구조라면 전환 뒤에 불러도 된다",
  krds_dropEvent: "공통 레이아웃(헤더 언어·유틸 드롭다운)이라 같은 요소가 남는다. 화면 안의 드롭다운은 상태 클래스로 직접 다룬다",
  krds_adjustContentScale: "공통 레이아웃(헤더 화면 크기 조절)이라 같은 요소가 남는다",
  krds_helpPanel: "킷이 스크롤·리사이즈 때마다 스스로 다시 init한다",
};

/** get_component 출력용 — 킷 동작 절 */
export function kitBehaviorLines(componentId: string): string[] {
  const b = KIT_BEHAVIOR[componentId];
  if (!b) return [];
  const out = [
    `## 킷 동작 (ui-script.js ${b.module}) — 킷 JS를 열어볼 필요 없다`,
    "",
    `- 초기화: 페이지 로드(DOMContentLoaded) 때 \`${b.selector}\`가 있으면 붙는다`,
    `- 상태 클래스: ${b.stateClasses.map((c) => `\`${c.name}\` → ${c.on}`).join(", ")}`,
  ];
  if (b.aria.length > 0) out.push(`- JS가 설정하는 접근성 속성: ${b.aria.join(", ")}`);
  const routeReinit = (ROUTE_REINIT_MODULES as readonly string[]).includes(b.module);
  if (b.rebindSafe) out.push("- 다시 초기화해도 리스너가 중복되지 않는다");
  else if (routeReinit) {
    out.push("- 같은 요소에 다시 초기화하면 리스너가 중복된다. 여닫는 토글은 두 번 돌아 열리지 않는다");
  } else {
    out.push(`- 첫 로드에 한 번만 초기화한다. ${NO_ROUTE_REINIT[b.module]}. 다시 초기화하면 리스너가 중복된다`);
  }
  if (routeReinit) {
    out.push(
      `- SPA 라우트 전환 뒤: DOMContentLoaded를 재발행하지 말고 새로 마운트한 화면에 \`${b.module}.init()\`만 다시 불러라 (get_framework_guide react 처방 3)`,
    );
  }
  if (b.optOut) out.push(`- React·Vue가 상태를 소유할 때: ${b.optOut}`);
  if (b.note) out.push(`- ${b.note}`);
  out.push(
    "- 프레임워크 상태로 직접 열고 닫는다면 위 클래스를 그대로 써라 — 킷 CSS가 이 클래스에 걸려 있다",
    "",
  );
  return out;
}
