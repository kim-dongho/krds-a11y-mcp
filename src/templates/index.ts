// KRDS 패턴 템플릿 레이어 — 공식 샘플의 구조를 따르되 접근성 교정을 적용한 큐레이션 산출물.
// 원본 샘플(patterns-src/, 비추적)은 참고용이며 배포되는 것은 교정본(templates/)뿐이다.
export {
  listPatterns,
  resolvePattern,
  loadPattern,
  renderPattern,
  type PatternMeta,
  type RenderedPattern,
  type SlotDef,
} from "./loader.js";
