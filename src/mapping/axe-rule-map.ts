// axe 규칙 ID → KWCAG 항목 ID 직접 매핑.
// 원본: docs/mapping/kwcag-wcag-axe.md 번역표의 행 배치 (부록 C-5: WCAG 태그 라우팅 금지).
// tests/mapping.test.ts가 문서와 이 데이터를 양방향 대조한다.

import { KBD_RULE_MAP } from "./kbd-rule-map.js";

/** 규칙의 실행 특성 — 리포트 메타 표기와 규칙 세트 구성에 쓴다 */
export type RuleStatus =
  | "default" // axe 기본 활성
  | "best-practice" // WCAG 태그 없는 BP 규칙
  | "experimental" // 기본 비활성 — --experimental 옵션에서만
  | "opt-in" // 기본 비활성 (target-size 등) — baseline에서 명시 활성화
  | "deprecated"; // axe가 폐기 표기 — 실행되면 결과는 받되 메타에 표기

type RuleEntry = { kwcagIds: string[]; status: RuleStatus };

export const AXE_RULE_MAP: Record<string, RuleEntry> = {
  // ── kwcag:5.1.1 적절한 대체 텍스트 제공
  "image-alt": { kwcagIds: ["kwcag:5.1.1"], status: "default" },
  "input-image-alt": { kwcagIds: ["kwcag:5.1.1"], status: "default" },
  "object-alt": { kwcagIds: ["kwcag:5.1.1"], status: "default" },
  "svg-img-alt": { kwcagIds: ["kwcag:5.1.1"], status: "default" },
  "role-img-alt": { kwcagIds: ["kwcag:5.1.1"], status: "default" },
  "aria-meter-name": { kwcagIds: ["kwcag:5.1.1"], status: "default" },
  "aria-progressbar-name": { kwcagIds: ["kwcag:5.1.1"], status: "default" },

  // ── kwcag:5.2.1 자막 제공
  "video-caption": { kwcagIds: ["kwcag:5.2.1"], status: "default" },
  "audio-caption": { kwcagIds: ["kwcag:5.2.1"], status: "deprecated" },

  // ── kwcag:5.3.1 표의 구성
  "td-headers-attr": { kwcagIds: ["kwcag:5.3.1"], status: "default" },
  "th-has-data-cells": { kwcagIds: ["kwcag:5.3.1"], status: "default" },
  "table-fake-caption": { kwcagIds: ["kwcag:5.3.1"], status: "experimental" },
  "td-has-header": { kwcagIds: ["kwcag:5.3.1"], status: "experimental" },
  "scope-attr-valid": { kwcagIds: ["kwcag:5.3.1"], status: "best-practice" },

  // ── kwcag:5.4.1 색에 무관한 콘텐츠 인식
  "link-in-text-block": { kwcagIds: ["kwcag:5.4.1"], status: "default" },

  // ── kwcag:5.4.2 자동 재생 금지
  "no-autoplay-audio": { kwcagIds: ["kwcag:5.4.2"], status: "default" },

  // ── kwcag:5.4.3 텍스트 콘텐츠의 명도 대비
  "color-contrast": { kwcagIds: ["kwcag:5.4.3"], status: "default" },

  // ── kwcag:6.1.1 키보드 사용 보장
  "scrollable-region-focusable": { kwcagIds: ["kwcag:6.1.1"], status: "default" },
  "frame-focusable-content": { kwcagIds: ["kwcag:6.1.1"], status: "default" },
  "server-side-image-map": { kwcagIds: ["kwcag:6.1.1"], status: "default" },

  // ── kwcag:6.1.2 초점 이동과 표시 (WCAG 태그 규칙 없음 — 참고 규칙만)
  "focus-order-semantics": { kwcagIds: ["kwcag:6.1.2"], status: "experimental" },
  tabindex: { kwcagIds: ["kwcag:6.1.2"], status: "best-practice" },

  // ── kwcag:6.1.3 조작 가능
  "target-size": { kwcagIds: ["kwcag:6.1.3"], status: "opt-in" },

  // ── kwcag:6.2.1 응답시간 조절
  "meta-refresh": { kwcagIds: ["kwcag:6.2.1"], status: "default" },

  // ── kwcag:6.2.2 정지 기능 제공
  blink: { kwcagIds: ["kwcag:6.2.2"], status: "default" },
  marquee: { kwcagIds: ["kwcag:6.2.2"], status: "default" },

  // ── kwcag:6.4.1 반복 영역 건너뛰기
  bypass: { kwcagIds: ["kwcag:6.4.1"], status: "default" },
  "skip-link": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  region: { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-one-main": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-unique": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-banner-is-top-level": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-contentinfo-is-top-level": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-main-is-top-level": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-no-duplicate-banner": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-no-duplicate-contentinfo": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },
  "landmark-no-duplicate-main": { kwcagIds: ["kwcag:6.4.1"], status: "best-practice" },

  // ── kwcag:6.4.2 제목 제공
  "document-title": { kwcagIds: ["kwcag:6.4.2"], status: "default" },
  "frame-title": { kwcagIds: ["kwcag:6.4.2"], status: "default" }, // axe 태그는 wcag412 — 내용 기준 배치
  "frame-title-unique": { kwcagIds: ["kwcag:6.4.2"], status: "default" },
  "empty-heading": { kwcagIds: ["kwcag:6.4.2"], status: "best-practice" },
  "heading-order": { kwcagIds: ["kwcag:6.4.2"], status: "best-practice" },

  // ── kwcag:6.4.3 적절한 링크 텍스트
  "link-name": { kwcagIds: ["kwcag:6.4.3"], status: "default" },
  "area-alt": { kwcagIds: ["kwcag:6.4.3"], status: "default" },
  "identical-links-same-purpose": { kwcagIds: ["kwcag:6.4.3"], status: "opt-in" }, // AAA — 기본 비활성

  // ── kwcag:6.5.3 레이블과 네임
  "label-content-name-mismatch": { kwcagIds: ["kwcag:6.5.3"], status: "experimental" },

  // ── kwcag:7.1.1 기본 언어 표시 (33개 중 유일한 full)
  "html-has-lang": { kwcagIds: ["kwcag:7.1.1"], status: "default" },
  "html-lang-valid": { kwcagIds: ["kwcag:7.1.1"], status: "default" },
  "html-xml-lang-mismatch": { kwcagIds: ["kwcag:7.1.1"], status: "default" },

  // ── kwcag:7.3.2 레이블 제공
  label: { kwcagIds: ["kwcag:7.3.2"], status: "default" }, // axe 태그는 wcag412 — 내용 기준 배치
  "select-name": { kwcagIds: ["kwcag:7.3.2", "kwcag:8.2.1"], status: "default" }, // 중복 계상
  "form-field-multiple-labels": { kwcagIds: ["kwcag:7.3.2"], status: "default" },
  "label-title-only": { kwcagIds: ["kwcag:7.3.2"], status: "best-practice" },

  // ── kwcag:7.3.4 반복 입력 정보 (간접)
  "autocomplete-valid": { kwcagIds: ["kwcag:7.3.4"], status: "default" },

  // ── kwcag:8.1.1 마크업 오류 방지 (주 수단은 W3C validator — axe 규칙은 deprecated)
  "duplicate-id": { kwcagIds: ["kwcag:8.1.1"], status: "deprecated" },
  "duplicate-id-active": { kwcagIds: ["kwcag:8.1.1"], status: "deprecated" },
  // 목록 구조 — HTML 내용 모델 위반이라 8.1.1 "중첩 관계" 오류 (태그는 wcag131이나 KWCAG에 정보와 관계 항목이 없다)
  list: { kwcagIds: ["kwcag:8.1.1"], status: "default" },
  listitem: { kwcagIds: ["kwcag:8.1.1"], status: "default" },
  "definition-list": { kwcagIds: ["kwcag:8.1.1"], status: "default" },
  dlitem: { kwcagIds: ["kwcag:8.1.1"], status: "default" },

  // ── kwcag:8.2.1 웹 애플리케이션 접근성 준수
  "aria-allowed-attr": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-required-attr": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-required-children": { kwcagIds: ["kwcag:8.2.1"], status: "default" }, // axe 태그는 wcag131 — 내용 기준 배치
  "aria-required-parent": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-roles": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-deprecated-role": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-valid-attr": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-valid-attr-value": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-hidden-body": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-hidden-focus": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-conditional-attr": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-prohibited-attr": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-command-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-input-field-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-toggle-field-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-tab-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-tooltip-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "aria-braille-equivalent": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "button-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "input-button-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "summary-name": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "nested-interactive": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
  "duplicate-id-aria": { kwcagIds: ["kwcag:8.2.1"], status: "default" },
};

/**
 * 규칙 ID → KWCAG 배치. axe 규칙과 키보드 검사 규칙(kbd-*)을 함께 본다.
 * 결과에 등장했지만 둘 다에 없는 규칙 → 리포트 "참고" 등급으로 분류
 */
export function lookupRule(ruleId: string): RuleEntry | undefined {
  return AXE_RULE_MAP[ruleId] ?? KBD_RULE_MAP[ruleId];
}
