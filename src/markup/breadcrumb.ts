// 브레드크럼 — 스캐폴드 템플릿 교정본 구조 (nav 랜드마크, 마지막 항목 aria-current, 첫 항목은 킷 홈 아이콘)
import { escapeHtml as e } from "./escape.js";
import { findItems } from "./items.js";
import type { Renderer } from "./types.js";

export const breadcrumb: Renderer = {
  example: 'crumbs: [{crumbLabel: "홈", href: "/"}, {crumbLabel: "민원", href: "/minwon"}, {crumbLabel: "민원 신청", href: "/minwon/apply"}]',
  render(inputs) {
    const items = findItems(inputs, ["crumbLabel", "href"]);
    if (!items) return { ok: false, reason: "crumbLabel·href 항목 수가 서로 다르다" };
    const last = items.length - 1;
    const lis = items.map((it, i) => {
      const cls = i === 0 ? ' class="home"' : "";
      const cur = i === last ? ' aria-current="page"' : "";
      return `    <li${cls}><a href="${e(String(it.href ?? ""))}" class="txt"${cur}>${e(String(it.crumbLabel ?? ""))}</a></li>`;
    });
    return {
      ok: true,
      html: ['<nav class="krds-breadcrumb-wrap" aria-label="현재 경로">', '  <ol class="breadcrumb">', ...lis, "  </ol>", "</nav>"].join("\n"),
    };
  },
};
