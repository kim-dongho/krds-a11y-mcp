// 조회 도구 — get_icon_fix_css · get_framework_guide · get_tokens
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { iconFixCssAll } from "../../mapping/kit-markup.js";
import { text } from "./shared.js";

export function registerGetIconFixCss(server: McpServer): void {
  // ── 5.5 아이콘 버그 전면 교정 CSS — 직접 레이아웃을 짜는 소비자용 (조립 도구를 안 쓰면 받을 길이 없었다)
  server.registerTool(
    "get_icon_fix_css",
    {
      title: "킷 아이콘 버그 전면 교정 CSS",
      description:
        "킷 v1.1.0 npm판의 아이콘 경로 버그(img/img 중복, 206곳 404)를 페이지 전체 범위로 교정하는 CSS를 반환한다. " +
        "get_page_scaffold(withSiteChrome)를 쓰면 자동 주입되므로 필요 없다. " +
        "레이아웃을 직접 구성하는 프로젝트(React 레이아웃 등)에서 아이콘이 안 보일 때, " +
        "빠진 곳을 한 개씩 손으로 고치지 말고 이 전체본을 받아 교정 파일로 저장하라.",
      inputSchema: {
        assetBase: z
          .string()
          .optional()
          .describe("킷 자산 경로 (기본 node_modules/krds-uiux, 예: /krds-uiux)"),
      },
    },
    async ({ assetBase }) => {
      const base = (assetBase ?? "node_modules/krds-uiux").replace(/\/$/, "");
      const css = iconFixCssAll(base);
      return text(
        [
          "# 킷 아이콘 경로 버그 전면 교정 CSS",
          "",
          "아래 전체를 교정 파일(예: public/krds-fix.css)로 저장하고, 킷 CSS **다음에** 로드하라.",
          '링크에는 `data-krds-a11y="corrections"` 속성을 붙여라 — validate_page가 도구 처방분으로 인정한다:',
          "",
          '`<link rel="stylesheet" href="/krds-fix.css" data-krds-a11y="corrections">`',
          "",
          "킷이 경로 버그를 수정하면 이 파일은 삭제해도 된다 (같은 값을 재선언할 뿐이라 충돌 없음).",
          "",
          "```css",
          css,
          "```",
        ].join("\n"),
      );
    },
  );
}

export function registerGetFrameworkGuide(server: McpServer): void {
  // ── 5.5b SPA 프레임워크 가이드 — 킷 JS가 SPA를 모르는 데서 오는 충돌의 처방
  server.registerTool(
    "get_framework_guide",
    {
      title: "SPA 프레임워크 × 킷 충돌 가이드",
      description:
        "React·Next.js에서 킷을 쓸 때의 충돌(킷 JS는 DOMContentLoaded 1회 init·클라이언트 " +
        "라우팅 모름)과 실사용 검증된 처방을 반환한다. 킷 위젯(탭·아코디언·GNB)이 SPA에서 " +
        "동작하지 않으면 자체 해법을 발명하기 전에 이 가이드를 먼저 보라.",
      inputSchema: {
        framework: z
          .enum(["react", "nextjs"])
          .optional()
          .describe("프레임워크 — react(Vite 등 SPA 공통) 또는 nextjs. 비우면 목록을 안내한다"),
      },
    },
    async ({ framework }) => {
      const { frameworkGuide, frameworkGuideIndex } = await import("../framework-guide.js");
      return text(framework ? frameworkGuide(framework)! : frameworkGuideIndex());
    },
  );
}

export function registerGetTokens(server: McpServer): void {
  // ── 5.6 킷 디자인 토큰 조회 — 모델이 node_modules를 grep으로 뒤지던 수요 흡수
  server.registerTool(
    "get_tokens",
    {
      title: "KRDS 디자인 토큰 조회",
      description:
        "킷 디자인 토큰(색·간격·글자 크기 등 CSS 커스텀 프로퍼티)을 조회한다. " +
        "var() 참조는 실제 값(hex 등)까지 풀어서 준다. " +
        "커스텀 CSS에서 색·크기가 필요하면 임의 값 대신 여기서 토큰을 찾아 var()로 쓰라 — " +
        "명도 대비 등 접근성 보장이 토큰에 내장돼 있다. query 없이 부르면 분류 안내를 준다.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe('검색어 — 공백 구분 낱말 전부 포함 매칭. 예: "light-color text", "pc-gap"'),
      },
    },
    async ({ query }) => {
      const { listTokens, tokenSummary } = await import("../../mapping/kit-tokens.js");
      if (!query?.trim()) return text(tokenSummary());
      const all = listTokens(query);
      if (all.length === 0) {
        return text(`"${query}" 에 맞는 토큰이 없다.\n\n${tokenSummary()}`);
      }
      const CAP = 80;
      const shown = all.slice(0, CAP);
      const lines = shown.map(
        (t) => `- \`${t.name}\`: ${t.value}${t.resolved ? ` → ${t.resolved}` : ""}`,
      );
      return text(
        [
          `# 킷 토큰 — "${query}" ${all.length}개${all.length > CAP ? ` (상위 ${CAP}개만 표시 — query를 더 좁혀라)` : ""}`,
          "",
          ...lines,
          "",
          "사용: CSS에서 `var(--krds-…)` 로 참조한다. 값이 var() 참조인 토큰은 → 뒤가 최종 실측값이다.",
          "색은 의미 토큰(light-color-…)을 우선 쓰고 원시 팔레트(color-light-…) 직접 사용은 지양하라 — 의미 토큰이 다크·고대비 모드까지 따라간다.",
        ].join("\n"),
      );
    },
  );
}
