// KRDS 컴포넌트 × KWCAG 매핑 데이터 레이어.
// PoC 범위: KWCAG 33항목 메타 + axe 규칙 ID 직접 매핑.
// 컴포넌트 3분류(①②③) 데이터는 매핑표 v1 확정 후 코드화한다 (docs/mapping/이 원본).
export { KWCAG_ITEMS, KWCAG_BY_ID, type KwcagItem } from "./kwcag-items.js";
export { AXE_RULE_MAP, lookupRule, type RuleStatus } from "./axe-rule-map.js";
export { listTokens, tokenSummary, type KitToken } from "./kit-tokens.js";
export { KBD_RULE_MAP } from "./kbd-rule-map.js";
export { FIX_PRESCRIPTIONS, prescriptionFor, type Prescription } from "./fix-prescriptions.js";
export { ASSEMBLY_NOTES, PRESCRIBED_PATTERNS } from "./assembly-notes.js";
