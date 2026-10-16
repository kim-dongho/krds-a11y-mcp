/** 컴포넌트 × KWCAG 3분류 매핑. 원본은 docs/mapping/components/*.md */
export type ComponentMapping = {
  componentId: string; // "krds:button"
  name: string; // "버튼"
  /**
   * ① 자동 충족 — 킷 마크업·토큰이 보장. evidence는 판정 근거.
   * caveat: 같은 KWCAG 항목에 미해결 질문(unresolved)이 함께 있는 경우의 단서.
   * 항목의 한 측면만 확정됐다는 뜻이므로, 이 값이 있으면 "보장"으로만 안내하면 안 된다.
   */
  auto: { kwcagId: string; scope?: string; evidence: string; caveat?: string }[];
  /** ② 조건부 — 사용자가 채워야 성립. 미입력 시 생성을 막는 근거가 된다 */
  conditional: { kwcagId: string; scope?: string; field: string; rule: string }[];
  /** ③ 범위 밖 — 페이지·사이트 수준. delegate는 axe 규칙 ID 또는 수동 체크 */
  outOfScope: { kwcagId: string; scope?: string; delegate: string }[];
  /** 미분류 — 아직 판정하지 못한 질문. ①로 승격 금지 */
  unresolved: { kwcagId: string; scope?: string; question: string }[];
};
