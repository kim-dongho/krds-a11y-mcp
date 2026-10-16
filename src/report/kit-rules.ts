// 킷 셀렉터 패턴과 도구 처방 규칙 — 킷 관례 검사와 침투 검사가 함께 쓴다.
// 두 검사의 제외·면제 조건이 어긋나면 같은 규칙을 두 번 세거나 한쪽만 면제한다(처방 CSS 경고 모순과 같은 부류).
// page.evaluate 안으로 넘기므로 정규식은 source 문자열, 처방은 평범한 객체다

/** 킷 셀렉터 — 이 패턴이 셀렉터에 있으면 '킷 셀렉터 조작' 검사 몫 */
export const KIT_SELECTOR_SOURCE = String.raw`\.krds-|\.form-group|\.form-conts|\.form-tit|\.form-hint|\.input-group|\.fieldset`;

/** 도구가 처방하는 킷 규칙 — 처방과 같은 셀렉터·같은 속성만이면 면제 (자기 CSS에 넣은 소비자가 경고받던 모순) */
export const PRESCRIBED_RULES: Record<string, string[]> = {
  // 브레드크럼 폭 제한 (조립 지침)
  ".krds-breadcrumb-wrap": ["padding-bottom"],
  ".krds-breadcrumb-wrap .breadcrumb": ["max-width", "padding-top", "padding-right", "padding-bottom", "padding-left"],
  // 셀렉트 기본 글자색 대비 교정 (kit-markup SELECT_COLOR_FIX)
  ".krds-form-select": ["color"],
};

/** 아이콘 경로 버그 교정 성격의 속성 — 이미지 선언만 재정의한 규칙은 인정된 우회 */
export const ICON_PROPS = ["-webkit-mask-image", "mask-image", "background-image", "background"];
