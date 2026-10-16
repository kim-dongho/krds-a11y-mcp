// 지침 그대로 따른 소비자 페이지 — 템플릿 없이 도구 응답만으로 조립해도 깨끗한가.
// 테스트가 템플릿 경로만 지나가서(교정 CSS가 면제 표식과 함께 동봉) 소비자 경로의 결함이 한참 뒤까지 숨어 있던 교훈:
// 처방 CSS를 검사가 경고, 셀렉트 대비 교정 누락, 아이콘 교정의 오류·성공·정보 아이콘 깨짐.
// 도구를 MCP로 실제 호출하고, 응답의 생성 마크업·조립 지침 CSS·교정 CSS를 소비자처럼 자기 <style>에 그대로 붙인다
import { mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/server/index.js";
import { scanTargets, translate } from "../src/report/index.js";

const kitUrl = pathToFileURL(dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"))).href;

async function tools() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(b);
  const client = new Client({ name: "consumer", version: "0" });
  await client.connect(a);
  const call = async (name: string, args: Record<string, unknown>) => {
    const r = await client.callTool({ name, arguments: args });
    return (r.content as { text: string }[]).map((x) => x.text).join("\n");
  };
  return { call, close: async () => { await client.close(); await server.close(); } };
}

const block = (text: string, heading: string) => {
  const at = text.indexOf(heading);
  if (at < 0) throw new Error(`응답에 "${heading}" 절이 없다`);
  return text.slice(at).match(/```html\n([\s\S]*?)\n```/)![1]!;
};
/** 응답이 페이지에 넣으라고 준 CSS 전부 — 코드 블록과 조립 지침 줄의 인라인 CSS. 경로는 지시대로 킷 위치로 맞춘다 */
const cssOf = (text: string) =>
  [...text.matchAll(/```css\n([\s\S]*?)\n```/g), ...text.matchAll(/`(\.krds-[^`]*\{[^`]*\})`/g)]
    .map((m) => m[1]!)
    .join("\n")
    .replaceAll("node_modules/krds-uiux", kitUrl);

describe("지침 그대로 따른 소비자 페이지 — 템플릿 없이 도구 응답만으로", () => {
  it("공통부 + 생성 마크업 6종(기본·오류 상태) + 응답이 준 CSS → 위반 0·킷 관례 경고 0·리소스 404 0", async () => {
    const t = await tools();
    try {
      const scaffold = (await t.call("get_page_scaffold", { pageTitle: "민원 신청", withSiteChrome: true, assetBase: kitUrl })).match(/```html\n([\s\S]*?)\n```/)![1]!;
      const parts: string[] = [];
      const css: string[] = [];
      const take = async (args: Record<string, unknown>) => {
        const out = await t.call("get_component", args);
        parts.push(block(out, "## 생성 마크업"));
        css.push(cssOf(out));
      };
      await take({ componentId: "breadcrumb", inputs: { crumbs: [{ crumbLabel: "홈", href: "/" }, { crumbLabel: "민원", href: "/m" }, { crumbLabel: "민원 신청", href: "/m/a" }] } });
      await take({ componentId: "text_input", inputs: { labelText: "신청자 이름", inputId: "nm", required: true, errorMessage: "이름을 입력해 주세요.", hintText: "주민등록상 성명", autocomplete: "name" } });
      await take({ componentId: "text_input", inputs: { labelText: "주소", inputId: "addr", autocomplete: "street-address" } });
      await take({ componentId: "select", inputs: { labelText: "수령 방법", selectId: "rv", required: true, errorMessage: "수령 방법을 선택해 주세요.", options: [{ label: "방문", value: "visit" }, { label: "우편", value: "mail" }] } });
      await take({ componentId: "radio_button", inputs: { radioGroupName: "kind", groupLabel: "신청 유형", required: true, errorMessage: "신청 유형을 선택해 주세요.", options: [{ labelText: "개인", inputId: "k-p", value: "p" }, { labelText: "법인", inputId: "k-c", value: "c" }] } });
      await take({ componentId: "checkbox", inputs: { groupLabel: "약관 동의", groupName: "agree", options: [{ labelText: "이용약관 동의", inputId: "ag1", value: "terms", required: true }, { labelText: "마케팅 수신 동의", inputId: "ag2", value: "mkt" }] } });
      await take({ componentId: "checkbox", inputs: { labelText: "개인정보 수집 동의", inputId: "pv", required: true, errorMessage: "동의해 주세요." } });
      await take({ componentId: "pagination", inputs: { pages: [1, 2, 3].map((n) => ({ pageHref: `/m?p=${n}` })), currentPage: 2 } });

      const page = scaffold
        .replace("</head>", `<style>\n/* 소비자 자기 CSS — get_component 응답이 넣으라고 준 그대로 */\n${css.join("\n")}\n</style>\n</head>`)
        .replace(/(<main id="main-content"[^>]*>\s*<h1>[^<]*<\/h1>)/, `$1\n<form>\n${parts.join("\n")}\n</form>`);
      expect(page).toContain("<form>"); // 본문 삽입 위치를 찾았다
      const f = join(mkdtempSync(join(tmpdir(), "consumer-")), "apply.html");
      writeFileSync(f, page);

      const [r] = await scanTargets([{ id: "consumer", kind: "site", url: pathToFileURL(f).href }], { ruleSet: "baseline", kitConventions: true, keyboard: true, screenshotDir: mkdtempSync(join(tmpdir(), "consumer-shot-")) });
      expect(r!.status).toBe("ok");
      if (r!.status !== "ok") return;
      const violations = r!.findings.filter((x) => x.outcome === "violation").flatMap((x) => x.nodes.map((n) => `${x.ruleId} ${n.selector}`));
      expect(violations).toEqual([]);
      expect(translate([r!]).items.filter((i) => i.grade === "violation")).toEqual([]);
      expect(r!.kitIssues ?? []).toEqual([]);
      expect((r!.pageIssues ?? []).filter((i) => /404/.test(i))).toEqual([]);
      expect((r!.pageIssues ?? []).filter((i) => i.startsWith("비가시 렌더"))).toEqual([]);
    } finally {
      await t.close();
    }
  }, 120_000);
});
