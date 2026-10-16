// 요소 셀렉터 침투 — 클래스 없는 비킷 CSS가 킷 요소를 덮었는가 (JSP 실사용: 돋움 폰트 전면 침투를 아무 검사도 못 잡음)
import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { intrusionAdvice } from "../src/report/intrusion.js";
import { scanTargets } from "../src/report/runner.js";
import { listPatterns } from "../src/templates/index.js";

const kit = pathToFileURL(dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"))).href;
const page = (css: string, body: string) => {
  const f = join(mkdtempSync(join(tmpdir(), "intr-")), "p.html");
  writeFileSync(
    f,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>침투</title>` +
      `<link rel="stylesheet" href="${kit}/resources/css/common/common.css">` +
      `<link rel="stylesheet" href="${kit}/resources/css/component/component.css">` +
      `<style>${css}</style></head><body data-krds-a11y="no-chrome"><main><h1>침투</h1>${body}</main></body></html>`,
  );
  return pathToFileURL(f).href;
};
const scan = async (url: string) => {
  const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
  expect(r!.status).toBe("ok");
  return r!.status === "ok" ? r! : undefined!;
};
const intrusions = (r: Awaited<ReturnType<typeof scan>>) => (r.kitIssues ?? []).filter((i) => i.startsWith("레거시 CSS가 킷 스타일을 덮음"));

const KIT_TABLE = `<div class="krds-table-wrap"><table class="tbl col data"><caption>목록</caption><thead><tr><th scope="col">번호</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table></div>`;
const KIT_BUTTON = `<button type="button" class="krds-btn medium primary">신청</button>`;

describe("처방 문구", () => {
  it("셀렉터 유형별로 다르게 안내한다", () => {
    expect(intrusionAdvice("*")).toContain("래퍼 아래로");
    expect(intrusionAdvice("body, td")).toContain("래퍼 아래로");
    expect(intrusionAdvice("a:link")).toContain("링크로 한정");
    expect(intrusionAdvice("table td")).toContain("클래스를 붙여");
    expect(intrusionAdvice(".intro p")).toContain("좁혀라");
  });
});

describe("침투 검출 — 빼고 다시 재기", () => {
  it("* { font-family } — 킷 폰트를 덮는다", async () => {
    const hits = intrusions(await scan(page(`* { font-family: Dotum, serif; }`, KIT_BUTTON + KIT_TABLE)));
    expect(hits).toHaveLength(1);
    expect(hits[0]).toContain("* { font-family }");
    expect(hits[0]).toContain("래퍼 아래로");
  }, 60_000);

  it("table td { padding; border } — 킷 표를 덮는다", async () => {
    const hits = intrusions(await scan(page(`table td { padding: 2px; border: 1px solid #ccc; }`, KIT_TABLE)));
    expect(hits.join(" ")).toContain("table td");
    expect(hits.join(" ")).toMatch(/padding-top|border-top-width/);
  }, 60_000);

  it("a:link { color } — 킷 링크 색을 덮고, 규칙은 검사 뒤 복원돼 axe가 낮은 대비를 그대로 잡는다", async () => {
    // 킷 링크 버튼(krds-btn link)은 킷 특이성이 높아 안 덮인다. 표·브레드크럼·정보 목록 안 링크는 덮인다(실측)
    const r = await scan(page(`a:link { color: #9aa; }`, `<div class="krds-table-wrap"><table class="tbl col data"><caption>공지</caption><thead><tr><th scope="col">제목</th></tr></thead><tbody><tr><td><a href="/notice/1">공지사항 첫 글</a></td></tr></tbody></table></div>`));
    expect(intrusions(r).join(" ")).toContain("a:link { color }");
    // 복원이 안 됐다면 axe는 킷 색을 보고 대비 위반을 못 냈을 것이다
    expect(r.findings.some((f) => f.ruleId === "color-contrast" && f.outcome === "violation")).toBe(true);
  }, 60_000);

  it("@media (max-width: 767px) 안의 침투는 데스크톱 폭에서 경고하지 않는다", async () => {
    expect(intrusions(await scan(page(`@media (max-width: 767px) { * { font-family: Dotum, serif; } }`, KIT_BUTTON)))).toEqual([]);
  }, 60_000);

  it("@media 안이라도 지금 폭에 적용되면 잡는다", async () => {
    expect(intrusions(await scan(page(`@media (min-width: 768px) { * { font-family: Dotum, serif; } }`, KIT_BUTTON)))).toHaveLength(1);
  }, 60_000);
});

describe("무오탐", () => {
  it("킷 밖 요소만 건드리는 소비자 CSS는 경고하지 않는다", async () => {
    expect(intrusions(await scan(page(`.my-intro p { font-family: serif; padding: 2rem; color: #333; }`, `<div class="my-intro"><p>소개</p></div>` + KIT_BUTTON)))).toEqual([]);
  }, 60_000);

  it("킷 요소가 없는 페이지는 경고하지 않는다", async () => {
    expect(intrusions(await scan(page(`* { font-family: Dotum, serif; }`, `<p>본문</p>`)))).toEqual([]);
  }, 60_000);

  it("템플릿 13종 — 경고 0 (템플릿 동봉 CSS는 면제 표식이 있다)", async () => {
    const dir = new URL("../templates/", import.meta.url);
    const previews = listPatterns().map((m) => `${m.name}.preview.html`);
    expect(previews.length).toBe(13);
    expect(previews.every((f) => readdirSync(dir).includes(f))).toBe(true);
    const found: string[] = [];
    for (const f of previews) {
      const r = await scan(new URL(f, dir).href);
      found.push(...intrusions(r).map((i) => `${f}: ${i}`));
    }
    expect(found).toEqual([]);
  }, 300_000);
});
