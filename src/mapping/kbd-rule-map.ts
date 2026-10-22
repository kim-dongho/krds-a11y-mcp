// 키보드 검사 규칙 → KWCAG 항목 배치.
// axe가 원리상 판정하지 못하는 키보드 동작(도달성·초점 가시성·Tab 순서)을 우리가 실측해
// axe 결과와 같은 형식으로 낸다. 규칙 ID는 kbd- 접두로 axe 규칙과 구분한다.
// AXE_RULE_MAP은 문서(kwcag-wcag-axe.md)와 양방향 대조 테스트가 걸려 있어 여기 분리한다.
import type { RuleStatus } from "./axe-rule-map.js";

export const KBD_RULE_MAP: Record<string, { kwcagIds: string[]; status: RuleStatus }> = {
  // 초점을 받아도 눈에 보이는 표시가 없다 — 키보드 사용자가 현재 위치를 모른다
  "kbd-focus-visible": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  // 보이는 조작 요소가 Tab 순회에서 한 번도 초점을 받지 못한다
  "kbd-reachable": { kwcagIds: ["kwcag:6.1.1"], status: "default" },
  // 양수 tabindex, 전체를 돌기 전 순환(키보드 함정 의심), 상한 도달
  "kbd-tab-order": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  // 동적 위젯 — 키보드로 갈 방법이 없음: 화살표도 안 되는 roving 탭, Enter·Space에 반응 없는 펼침 트리거
  "kbd-widget-unreachable": { kwcagIds: ["kwcag:6.1.1"], status: "default" },
  // 모달·팝업 키 패턴(권고) — 초점 이동·Escape·초점 복귀·초점 가두기
  "kbd-modal-focus": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  "kbd-modal-escape": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  "kbd-modal-return": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  "kbd-modal-trap": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  "kbd-popup-escape": { kwcagIds: ["kwcag:6.1.2"], status: "default" },
  // 위젯 검사 자체가 실패했다(예외·키 입력으로 페이지 이동) — 통과가 아니라 사람이 확인할 대상
  "kbd-widget-check-failed": { kwcagIds: ["kwcag:6.1.1"], status: "default" },
};
