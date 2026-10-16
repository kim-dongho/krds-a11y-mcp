// 페이지네이션 — 스캐폴드 템플릿 교정본 구조 (nav 랜드마크, 현재 쪽 aria-current 하나만 — sr-only와 함께 두면 두 번 읽힌다)
import { escapeHtml as e } from "./escape.js";
import { findItems } from "./items.js";
import type { Renderer } from "./types.js";

export const pagination: Renderer = {
  example: 'pages: [{pageHref: "/notice?page=1"}, {pageHref: "/notice?page=2"}], currentPage: 1',
  render(inputs) {
    const items = findItems(inputs, ["pageHref"]);
    if (!items) return { ok: false, reason: "pageHref 항목을 찾지 못했다" };
    const hrefs = items.map((it) => String(it.pageHref ?? ""));
    const current = Number(inputs.currentPage ?? 1);
    if (!Number.isInteger(current) || current < 1 || current > hrefs.length) {
      return { ok: false, reason: `currentPage(${String(inputs.currentPage)})가 1~${hrefs.length} 밖이다` };
    }
    const prevHref = inputs.prevHref !== undefined ? String(inputs.prevHref) : hrefs[current - 2];
    const nextHref = inputs.nextHref !== undefined ? String(inputs.nextHref) : hrefs[current];
    const prev = current > 1 && prevHref
      ? `  <a class="page-navi prev" href="${e(prevHref)}">이전</a>`
      : '  <span class="page-navi prev disabled">이전</span>';
    const next = current < hrefs.length && nextHref
      ? `  <a class="page-navi next" href="${e(nextHref)}">다음</a>`
      : '  <span class="page-navi next disabled">다음</span>';
    const links = hrefs.map((h, i) =>
      i + 1 === current
        ? `    <a class="page-link active" href="${e(h)}" aria-current="page">${i + 1}</a>`
        : `    <a class="page-link" href="${e(h)}">${i + 1}</a>`,
    );
    return {
      ok: true,
      html: ['<nav class="krds-pagination" aria-label="페이지 탐색">', prev, '  <div class="page-links">', ...links, "  </div>", next, "</nav>"].join("\n"),
    };
  },
};
