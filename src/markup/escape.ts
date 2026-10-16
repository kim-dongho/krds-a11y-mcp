// 마크업에 들어가는 값은 텍스트 채널이다 — 마크업 주입 방지를 위해 항상 이스케이프
// (템플릿 슬롯 치환과 get_component 생성 마크업이 함께 쓴다)
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
