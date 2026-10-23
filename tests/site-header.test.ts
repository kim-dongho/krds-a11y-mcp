// 공통부 메뉴·로고 — siteMenu·orgName·logoSrc로 킷 헤더 구조를 만든다. 킷 데모 헤더(459줄, "1Depth"·"메뉴명" 자리 문구)를
// 어디까지 지워도 되는지 몰랐고, 로고가 CSS 배경이라 sr-only만 바뀌는 불일치가 있었다(실사용 재지적)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { mkdtempSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { renderSiteHeader, siteMenuError, type MenuNode } from "../src/markup/site-header.js";
import { scanTargets } from "../src/report/runner.js";
import { createServer } from "../src/server/index.js";
import { serveForTests } from "./helpers/serve.js";

const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
const MENU: MenuNode[] = [
  { label: "민원", children: [{ label: "민원 신청", href: "/apply" }, { label: "민원 조회", href: "/status" }] },
  { label: "정보공개", children: [{ label: "사전정보", children: [{ label: "공표 목록", href: "/open/list" }] }, { label: "청구", href: "/open/req" }] },
  { label: "알림", href: "/notice" },
];

let call: (name: string, args: Record<string, unknown>) => Promise<string>;
let local: { server: Server; origin: string };
let browser: Browser;
let closeAll: () => Promise<void>;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(b);
  const client = new Client({ name: "hdr", version: "0" });
  await client.connect(a);
  call = async (name, args) => ((await client.callTool({ name, arguments: args })).content as { text: string }[]).map((x) => x.text).join("\n");
  local = await serveForTests();
  browser = await chromium.launch();
  closeAll = async () => { await client.close(); await server.close(); local.server.close(); await browser.close(); };
});
afterAll(async () => { await closeAll(); });

const htmlBlock = (t: string) => t.match(/```html\n([\s\S]*?)\n```/)![1]!;

/** 도구 응답만으로 만든 페이지 — 로고 파일도 같은 폴더에 */
async function scaffoldPage(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "hdr-"));
  writeFileSync(join(dir, "logo.svg"), `<svg xmlns="http://www.w3.org/2000/svg" width="137" height="40"><rect width="137" height="40" fill="#0b50d0"/></svg>`);
  const t = await call("get_page_scaffold", {
    pageTitle: "헤더 생성", withSiteChrome: true, assetBase: kit,
    orgName: "한국테스트원", siteMenu: MENU, logoSrc: join(dir, "logo.svg"), loginHref: "/login",
  });
  writeFileSync(join(dir, "page.html"), htmlBlock(t));
  return local.origin + join(dir, "page.html");
}

describe("입력 검증", () => {
  it("빈 메뉴·빈 레이블·href 없는 말단·4단계를 거부한다", () => {
    expect(siteMenuError([])).toContain("메뉴가 비어 있다");
    expect(siteMenuError([{ label: " ", href: "/" }])).toContain("1번째 항목의 label이 비었다");
    expect(siteMenuError([{ label: "민원", children: [{ label: "신청" }] }])).toContain('"민원"의 1번째 "신청"는 하위가 없으니 href가 필요하다');
    const deep: MenuNode = { label: "a", children: [{ label: "b", children: [{ label: "c", children: [{ label: "d", href: "/" }] }] }] };
    expect(siteMenuError([deep])).toContain("3단계를 넘는다");
    expect(renderSiteHeader({ orgName: "", menu: MENU })).toMatchObject({ ok: false });
  });

  it("값을 이스케이프하고 킷 JS가 찾는 선택자를 모두 둔다", () => {
    const r = renderSiteHeader({ orgName: "A&B<원>", menu: [{ label: "<알림>", href: "/n?a=1&b=2" }] });
    expect(r.ok).toBe(true);
    const h = r.ok ? r.html : "";
    expect(h).toContain('<span class="sr-only">A&amp;B&lt;원&gt;</span>');
    expect(h).toContain('href="/n?a=1&amp;b=2"');
    for (const sel of ['id="krds-header"', 'class="header-in"', 'class="krds-main-menu"', 'class="gnb-menu"', 'id="mobile-nav"', 'class="gnb-wrap"', 'class="gnb-body"', 'class="menu-wrap"', 'class="submenu-wrap"', 'id="close-nav"', 'aria-controls="mobile-nav"']) {
      expect(h, sel).toContain(sel);
    }
  });

  it("withSiteChrome 없이 메뉴만 주면 안내하고, 메뉴가 잘못되면 거부한다", async () => {
    expect(await call("get_page_scaffold", { pageTitle: "x", siteMenu: MENU, orgName: "기관" })).toContain("withSiteChrome: true와 함께");
    expect(await call("get_page_scaffold", { pageTitle: "x", withSiteChrome: true, siteMenu: MENU })).toContain("orgName(기관명)이 비었다");
    expect(await call("get_page_scaffold", { pageTitle: "x", withSiteChrome: true, orgName: "기관", siteMenu: [{ label: "알림" }] })).toContain("href가 필요하다");
  });

  it("orgName만 주면 킷 헤더·푸터 로고의 대체 텍스트만 바꾸고 운영기관 식별자는 그대로 둔다", async () => {
    const h = htmlBlock(await call("get_page_scaffold", { pageTitle: "x", withSiteChrome: true, orgName: "한국$&테스트원" }));
    expect(h.match(/<h2 class="logo">[\s\S]*?<span class="sr-only">([^<]*)/)![1]).toBe("한국$&amp;테스트원");
    expect(h.match(/<div class="f-logo">\s*<span class="sr-only">([^<]*)/)![1]).toBe("한국$&amp;테스트원");
    expect(h).toMatch(/<span class="logo">\s*<span class="sr-only">KRDS - Korea Design System<\/span>/); // identifier
  });
});

describe("도구 응답으로 만든 페이지", () => {
  it("검사 — 위반 0·킷 관례 경고 0·리소스 문제 0", async () => {
    const [r] = await scanTargets([{ id: "t", kind: "site", url: await scaffoldPage() }], { ruleSet: "baseline", kitConventions: true, keyboard: true });
    expect(r!.status).toBe("ok");
    if (r!.status !== "ok") return;
    expect(r!.findings.filter((f) => f.outcome === "violation").map((f) => f.ruleId)).toEqual([]);
    expect(r!.kitIssues ?? []).toEqual([]);
    expect(r!.pageIssues ?? []).toEqual([]);
  }, 120_000);

  it("데스크톱 — 1·2·3단계가 킷 JS로 열리고 로고가 기관 이미지다", async () => {
    const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await p.goto(await scaffoldPage(), { waitUntil: "networkidle" });
    expect(await p.evaluate(() => getComputedStyle(document.querySelector("#krds-header .logo a")!).backgroundImage)).toContain("logo.svg");
    expect(await p.evaluate(() => getComputedStyle(document.querySelector("#krds-footer .f-logo")!).backgroundImage)).toContain("logo.svg");
    await p.locator("button.gnb-main-trigger").first().click();
    await p.waitForTimeout(500);
    expect(await p.locator("button.gnb-main-trigger").first().getAttribute("aria-expanded")).toBe("true");
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    await p.locator("button.gnb-main-trigger").nth(1).click();
    await p.waitForTimeout(500);
    await p.locator("button.gnb-sub-trigger").first().click();
    await p.waitForTimeout(500);
    expect(await p.locator(".krds-main-menu .gnb-sub-list").filter({ hasText: "공표 목록" }).isVisible()).toBe(true);
    await p.close();
  }, 60_000);

  it("모바일 — 전체메뉴가 열리고 1단계 탭·3단계 펼침·닫기가 동작한다", async () => {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(await scaffoldPage(), { waitUntil: "networkidle" });
    await p.locator(".btn-navi.all").click();
    await p.waitForTimeout(700);
    expect(await p.locator("#mobile-nav").isVisible()).toBe(true);
    expect(await p.locator(".menu-wrap [role=tab]").count()).toBe(3);
    await p.locator(".menu-wrap .gnb-main-trigger").nth(1).click();
    await p.waitForTimeout(500);
    await p.locator("button.has-depth3").click();
    await p.waitForTimeout(400);
    expect(await p.locator("button.has-depth3").getAttribute("aria-expanded")).toBe("true");
    await p.locator("#close-nav").click();
    await p.waitForTimeout(700);
    expect(await p.locator("#mobile-nav").isVisible()).toBe(false);
    expect(errors).toEqual([]);
    await p.close();
  }, 60_000);
});
