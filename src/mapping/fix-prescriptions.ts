// 위반 규칙별 교정 처방 — 리포트와 validate 응답에 "이렇게 고친다"를 붙인다.
// 원칙: 처방은 근거(킷 실제 파일·행, 매핑표, KWCAG 고시)가 있어야 한다. 근거를 못 찾은 처방은
// 넣지 않는다 — 틀린 처방은 도구가 거짓을 말하게 만든다.
// 첫 범위(2026-10-12): 실사용에서 실제로 걸린 axe 규칙 5개 + 키보드 검사 3개.
import { lookupRule } from "./axe-rule-map.js";

export type Prescription = {
  /** 고치는 방법 — 한다체 */
  fix: string;
  /** 쓸 컴포넌트 (get_component id) — 해당 컴포넌트가 킷에 실재할 때만 */
  component?: string;
  /** 처방 근거 — 파일·행 또는 고시 항목 */
  source: string;
};

export const FIX_PRESCRIPTIONS: Record<string, Prescription> = {
  "image-alt": {
    // 킷에는 이미지 컴포넌트가 없다 — get_component로 강제할 수 없으므로 고시 기준으로만 처방
    fix: "img에 alt를 넣는다. 정보를 전하는 이미지는 그 내용을, 꾸밈용 이미지는 alt=\"\"(빈 값)를 쓴다. alt 문구는 임의로 짓지 말고 사용자에게 실제 의미를 확인한다",
    source: "KWCAG 5.1.1 (docs/mapping/kwcag22-items.md:13)",
  },
  "heading-order": {
    fix: "제목은 h1 → h2 → h3 순서로 건너뛰지 않는다. 스캐폴드가 교정해 둔 제목 위계를 되돌리지 말고, 글자 크기가 필요하면 제목 수준이 아니라 CSS로 맞춘다",
    source: "템플릿 교정 기록 (templates/apply-issue.meta.json:26-27), KWCAG 6.4.2 (kwcag22-items.md:35)",
  },
  "label-title-only": {
    fix: "title 속성만으로 이름을 주지 말고 킷 입력 마크업처럼 <label for=\"입력 id\">로 연결한다",
    component: "krds:text_input",
    source: "킷 마크업 (krds-uiux/html/code/text_input.html:6), KWCAG 7.3.2 (kwcag22-items.md:51)",
  },
  list: {
    fix: "ul·ol의 직계 자식은 li만 둔다. 목록이 필요하면 킷 텍스트 목록 마크업을 쓴다",
    component: "krds:text_list",
    source: "킷 마크업 (krds-uiux/html/code/text_list.html:3-4), KWCAG 8.1.1 (kwcag22-items.md:59)",
  },
  "target-size": {
    fix: "버튼은 킷 크기 클래스(xsmall·small·medium·large·xlarge)를 쓰고, 높이·여백을 커스텀 CSS로 줄이지 않는다",
    component: "krds:button",
    source: "킷 CSS (krds-uiux/resources/css/component/component.css:63-131, --krds-button--size-height-*)",
  },
  "kbd-focus-visible": {
    fix:
      "킷은 *:focus로 외곽선과 그림자를 이미 그린다(입력창·셀렉트는 테두리 색 변화). 커스텀 CSS의 outline: none·box-shadow: none 덮어쓰기를 지운다. " +
      "직접 그려야 하면 :focus-visible에 box-shadow: var(--krds-box-shadow-outline)을 준다",
    source: "킷 CSS (krds-uiux/resources/css/common/common.css:1053-1057), 매핑표 공통 판정 규칙 2 (component-kwcag-map.md:31)",
  },
  "kbd-reachable": {
    fix: "클릭 동작은 div·span이 아니라 button·a로 만든다. 보이는 조작 요소에 tabindex=\"-1\"을 두지 않는다 (탭 목록처럼 화살표 키로 옮기는 위젯은 예외 — 그 경우 화살표 이동이 실제로 되는지 확인한다). 상한 도달로 검사하지 못한 경우라면 조작 요소가 300개를 넘는 화면이므로 화면을 나누거나 직접 Tab으로 확인한다",
    source: "KWCAG 6.1.1 (kwcag22-items.md:27)",
  },
  // axe tabindex(양수 tabindex)는 키보드 검사보다 먼저 6.1.2 위반으로 잡힌다 — 같은 처방 (실측)
  tabindex: {
    fix: "양수 tabindex를 지우고 DOM 순서로 Tab 순서를 맞춘다. 순서를 바꾸고 싶으면 마크업 순서를 옮긴다",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28)",
  },
  "kbd-tab-order": {
    fix: "양수 tabindex를 지우고 DOM 순서로 Tab 순서를 맞춘다. 초점이 한 구간을 순환하면 그 구간을 빠져나갈 수단(Escape·닫기 버튼)을 둔다",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28)",
  },
  // 동적 위젯 — 근거: KWCAG 6.1.1·6.1.2, 킷 동작 정보(kit-behavior.ts), 탭 교정본 스크립트(assembly-notes.ts)
  "kbd-widget-unreachable": {
    fix:
      "탭은 화살표로 이웃 탭에 초점을 옮긴다(get_component tab 교정본 스크립트) — 아니면 모든 탭을 Tab 대상(tabindex 0)으로 둔다. " +
      "펼침 트리거는 div가 아니라 네이티브 button으로 만든다 — Enter·Space가 저절로 동작한다",
    component: "krds:tab",
    source: "KWCAG 6.1.1 (kwcag22-items.md:27), 탭 교정본 (src/mapping/assembly-notes.ts krds:tab)",
  },
  "kbd-modal-focus": {
    fix: "대화상자를 열 때 대화상자(또는 첫 조작 요소)로 초점을 옮긴다 — 킷 모달은 .open-modal 트리거로 열면 자동이다",
    component: "krds:modal",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28), 킷 동작 정보 (src/mapping/kit-behavior.ts krds:modal)",
  },
  "kbd-modal-escape": {
    fix: "Escape로 대화상자를 닫는다 — 킷 모달을 직접 관리하면 keydown Escape를 처리한다",
    component: "krds:modal",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28), 킷 동작 정보 (src/mapping/kit-behavior.ts krds:modal)",
  },
  "kbd-modal-return": {
    fix: "대화상자를 닫을 때 연 버튼으로 초점을 되돌린다",
    component: "krds:modal",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28), 킷 동작 정보 (src/mapping/kit-behavior.ts krds:modal)",
  },
  "kbd-modal-trap": {
    fix: "대화상자가 열린 동안 Tab을 대화상자 안에 가둔다 — 배경에 inert를 걸면 가장 간단하다",
    component: "krds:modal",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28), 킷 동작 정보 (src/mapping/kit-behavior.ts krds:modal — 배경 inert)",
  },
  "kbd-popup-escape": {
    fix: "열린 드롭다운·팝업을 Escape로 닫고 초점을 트리거에 둔다",
    source: "KWCAG 6.1.2 (kwcag22-items.md:28)",
  },
};

export function prescriptionFor(ruleId: string): Prescription | undefined {
  return FIX_PRESCRIPTIONS[ruleId];
}

/** 처방 표의 규칙 ID가 전부 실존 규칙인지 — 오타 처방을 막는다 (테스트가 쓴다) */
export function orphanPrescriptions(): string[] {
  return Object.keys(FIX_PRESCRIPTIONS).filter((id) => !lookupRule(id));
}
