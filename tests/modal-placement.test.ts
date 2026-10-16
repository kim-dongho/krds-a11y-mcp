// 모달 배치 — 킷 모달은 열 때 #wrap에 inert를 건다. 스캐폴드·템플릿에 #wrap이 없어 "모달은 #wrap 밖" 요건을
// 지킬 자리가 없던 문제(실사용 3세션). 공식 샘플 구조(#wrap > 헤더·#container·푸터, 모달은 그 밖)를 되살렸다
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ASSEMBLY_NOTES } from "../src/mapping/assembly-notes.js";
import { scanTargets } from "../src/report/runner.js";
import { assembleSiteChrome, buildScaffold, splitScaffold } from "../src/server/scaffold.js";
import { serveLocal } from "../src/server/serve-local.js";
import { listPatterns } from "../src/templates/index.js";

const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
const modalDemo = readFileSync(join(kit, "html/code/modal.html"), "utf8");
const trigger = modalDemo.match(/<button[^>]*open-modal[\s\S]*?<\/button>/)![0];
const modal = modalDemo.replace(trigger, "");
let local: { server: Server; origin: string };
beforeAll(async () => { local = await serveLocal(); });
afterAll(() => { local?.server.close(); });

/** 스캐폴드 + 공통부에 지침대로 모달을 넣은 페이지 */
function page(place: "slot" | "inside" | "no-wrap"): string {
  let html = assembleSiteChrome(buildScaffold({ pageTitle: "모달 배치", assetBase: kit }), kit)
    .replace("<!-- 본문 — get_component로 받은 컴포넌트를 여기에 조립 -->", trigger);
  if (place === "slot") html = html.replace("<!-- 모달 자리", `${modal}\n<!-- 모달 자리`);
  if (place === "inside") html = html.replace("</main>", `${modal}\n</main>`);
  if (place === "no-wrap") {
    html = html.replace(/<div id="wrap">[^\n]*\n/, "").replace("</footer>\n</div>", "</footer>").replace("<!-- 모달 자리", `${modal}\n<!-- 모달 자리`);
  }
  const f = join(mkdtempSync(join(tmpdir(), "mp-")), "p.html");
  writeFileSync(f, html);
  return local.origin + f;
}
const scan = async (url: string) => {
  const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true, keyboard: true });
  expect(r!.status).toBe("ok");
  return r!.status === "ok" ? r! : undefined!;
};
const modalIssues = (r: Awaited<ReturnType<typeof scan>>) => (r.kitIssues ?? []).filter((i) => i.startsWith("모달"));
const modalProblems = (r: Awaited<ReturnType<typeof scan>>) =>
  r.findings.filter((f) => f.ruleId.startsWith("kbd-modal") && f.outcome !== "pass").map((f) => `${f.ruleId}:${f.outcome}`);

describe("스캐폴드 구조", () => {
  it("#wrap이 헤더·본문·푸터를 감싸고, #container가 main을 감싸고, 모달 자리는 #wrap 밖", () => {
    const html = buildScaffold({ pageTitle: "x" });
    const at = (s: string) => html.indexOf(s);
    expect(at('<div id="wrap">')).toBeLessThan(at('id="krds-skip-link"'));
    expect(at('<div id="container">')).toBeLessThan(at("<main"));
    expect(at("</main>\n</div>")).toBeGreaterThan(0);
    expect(at("</footer>\n</div>")).toBeLessThan(at("<!-- 모달 자리"));
    expect(at("<!-- 모달 자리")).toBeLessThan(at("<script"));
  });

  it("조각으로 잘라 이어 붙이면 원본과 같다 (#wrap 여닫음이 조각 경계를 넘는다)", () => {
    const html = assembleSiteChrome(buildScaffold({ pageTitle: "x" }), "k");
    const p = splitScaffold(html)!;
    expect(p.head + p.header + p.main + p.footer + p.scripts).toBe(html);
    expect(p.header).toContain('<div id="wrap">');
    // 킷 푸터 마크업 끝의 주석(<!-- //footer -->) 다음 첫 태그가 #wrap을 닫고, 그 뒤가 모달 자리다
    expect(p.scripts.replace(/<!--[\s\S]*?-->/g, "").trimStart().startsWith("</div>")).toBe(true);
    expect(p.scripts.indexOf("</div>")).toBeLessThan(p.scripts.indexOf("<!-- 모달 자리"));
  });

  it("템플릿 13종 — 공식 샘플처럼 #wrap·#container가 있고 모달 자리는 #wrap 밖", () => {
    for (const m of listPatterns()) {
      const t = readFileSync(new URL(`../templates/${m.name}.html`, import.meta.url), "utf8");
      expect(t, m.name).toMatch(/<body[^>]*>\n<div id="wrap">/);
      expect(t, m.name).toContain('<div id="container">\n<main id="main-content"');
      expect(t, m.name).toMatch(/<\/footer>\n<\/div>\n\n<!-- 모달은 #wrap 밖 -->/);
    }
  });

  it("조립 지침이 배치와 프레임워크 포털을 안내한다", () => {
    const n = ASSEMBLY_NOTES["krds:modal"]!.join("\n");
    expect(n).toContain("#wrap 밖");
    expect(n).toContain("createPortal");
    expect(n).toContain("Teleport");
  });
});

describe("지침대로 넣은 모달은 동작하고, 어긋나면 경고한다", () => {
  it("모달 자리에 넣으면 경고 0, 초점 이동·Escape·복귀·가두기 통과, 스크롤 오류 없음", async () => {
    const r = await scan(page("slot"));
    expect(modalIssues(r)).toEqual([]);
    expect(r.findings.some((f) => f.ruleId === "kbd-modal-escape")).toBe(true); // 모달을 실제로 열었다
    expect(modalProblems(r)).toEqual([]);
    // #wrap이 있으면 킷 스크롤 처리가 #container를 찾는다 — 없으면 스크롤마다 스크립트 오류
    expect(r.pageIssues ?? []).not.toEqual(expect.arrayContaining([expect.stringContaining("offsetTop")]));
  }, 120_000);

  it("#wrap 안에 넣으면 경고하고, 실제로도 초점·Escape가 막힌다", async () => {
    const r = await scan(page("inside"));
    expect(modalIssues(r)).toEqual([expect.stringContaining('모달이 #wrap 안에 있음 id="modal_sample_03"')]);
    expect(modalProblems(r)).toEqual(expect.arrayContaining(["kbd-modal-focus:incomplete"]));
  }, 120_000);

  it("#wrap이 없으면 배경이 막히지 않는다고 경고한다", async () => {
    expect(modalIssues(await scan(page("no-wrap")))).toEqual([expect.stringContaining("모달 배경이 막히지 않음")]);
  }, 120_000);
});
