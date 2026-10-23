// 동적 위젯 키보드 — 탭 화살표·모달·펼침 트리거를 실제 키로 (Tab 순회로는 못 보는 위젯 조작)
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ASSEMBLY_NOTES } from "../src/mapping/assembly-notes.js";
import { lookupRule } from "../src/mapping/axe-rule-map.js";
import { prescriptionFor } from "../src/mapping/fix-prescriptions.js";
import { scanTargets } from "../src/report/runner.js";
import { serveForTests } from "./helpers/serve.js";
import { listPatterns } from "../src/templates/index.js";

const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
const demo = (f: string) => readFileSync(join(kit, "html/code", f), "utf8").replace(/class="sample"/g, "");
let local: { server: Server; origin: string };
beforeAll(async () => { local = await serveForTests(); });
afterAll(() => { local?.server.close(); });

// outside: #wrap 밖에 둘 마크업 — 킷 모달은 열 때 #wrap에 inert를 걸므로 모달은 #wrap 밖이어야 한다
const page = (body: string, script = "", outside = "") => {
  const f = join(mkdtempSync(join(tmpdir(), "wk-")), "p.html");
  writeFileSync(
    f,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>위젯</title>` +
      `<link rel="stylesheet" href="${kit}/resources/css/common/common.css">` +
      `<link rel="stylesheet" href="${kit}/resources/css/component/component.css">` +
      `</head><body data-krds-a11y="no-chrome"><div id="wrap"><main><h1>위젯</h1>${body}</main></div>${outside}` +
      `<script src="${kit}/resources/js/component/ui-script.js"></script>${script ? `<script>${script}</script>` : ""}</body></html>`,
  );
  return local.origin + f;
};
const widgetFindings = async (url: string) => {
  const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", keyboard: true });
  expect(r!.status).toBe("ok");
  return r!.status === "ok" ? r!.findings.filter((f) => /^kbd-(widget|modal|popup)/.test(f.ruleId)) : [];
};
const problems = (fs: Awaited<ReturnType<typeof widgetFindings>>) =>
  fs.filter((f) => f.outcome !== "pass").map((f) => `${f.ruleId}:${f.outcome}`);

describe("매핑·처방", () => {
  it("규칙 6개가 KWCAG에 배치되고 처방이 붙는다", () => {
    for (const id of ["kbd-widget-unreachable", "kbd-modal-focus", "kbd-modal-escape", "kbd-modal-return", "kbd-modal-trap", "kbd-popup-escape"]) {
      expect(lookupRule(id), id).toBeDefined();
      expect(prescriptionFor(id)?.source, id).toBeTruthy();
    }
    expect(lookupRule("kbd-widget-unreachable")!.kwcagIds).toEqual(["kwcag:6.1.1"]);
  });
});

describe("킷 위젯은 통과한다", () => {
  it("킷 탭 원본(수동 활성 — 화살표는 초점만 옮긴다)", async () => {
    const fs = await widgetFindings(page(demo("tab.html")));
    expect(fs.some((f) => f.ruleId === "kbd-widget-unreachable")).toBe(true); // 검사했다
    expect(problems(fs)).toEqual([]);
  }, 60_000);

  it("킷 탭 교정본(roving tabindex + 화살표 스크립트)", async () => {
    const notes = ASSEMBLY_NOTES["krds:tab"]!.join("\n");
    const html = notes.match(/```html\n([\s\S]*?)\n```/)![1]!;
    const js = notes.match(/```js\n([\s\S]*?)\n```/)![1]!;
    expect(problems(await widgetFindings(page(html, js)))).toEqual([]);
  }, 60_000);

  it("킷 모달 — 열면 초점이 안으로, Escape로 닫히고 초점 복귀, 초점 가두기 (모달은 #wrap 밖)", async () => {
    const modal = demo("modal.html");
    const trigger = modal.match(/<button[^>]*open-modal[\s\S]*?<\/button>/)![0];
    const fs = await widgetFindings(page(trigger, "", modal.replace(trigger, "")));
    expect(fs.some((f) => f.ruleId === "kbd-modal-escape")).toBe(true); // 모달을 실제로 열어 검사했다
    expect(problems(fs)).toEqual([]);
  }, 60_000);

  it("킷 아코디언·디스클로저 — 네이티브 button이라 Enter로 펼친다", async () => {
    expect(problems(await widgetFindings(page(demo("accordion.html") + demo("disclosure.html"))))).toEqual([]);
  }, 60_000);
});

describe("자작 위젯 결함을 잡는다", () => {
  it("roving tabindex인데 화살표 처리가 없는 탭 → 위반", async () => {
    const fs = await widgetFindings(page(
      `<div role="tablist" aria-label="안내"><button role="tab" aria-selected="true" id="t1">대상</button><button role="tab" aria-selected="false" tabindex="-1" id="t2">방법</button></div>` +
        `<div role="tabpanel">대상 안내</div>`,
    ));
    expect(problems(fs)).toContain("kbd-widget-unreachable:violation");
  }, 60_000);

  it("클릭만 받는 div 아코디언 → 위반", async () => {
    const fs = await widgetFindings(page(
      `<div role="button" tabindex="0" aria-expanded="false" id="acc">자주 묻는 질문</div><div id="acc-p" hidden>답</div>`,
      `document.getElementById("acc").addEventListener("click", (e) => { const t = e.currentTarget; const open = t.getAttribute("aria-expanded") === "true"; t.setAttribute("aria-expanded", String(!open)); document.getElementById("acc-p").hidden = open; });`,
    ));
    expect(problems(fs)).toContain("kbd-widget-unreachable:violation");
  }, 60_000);

  const modal = (focusInside: boolean, escape: boolean) => page(
    `<button type="button" aria-haspopup="dialog" id="open">신청 전 확인</button>` +
      `<div role="dialog" aria-modal="true" aria-labelledby="mt" id="dlg" hidden><h2 id="mt">확인</h2><p>내용</p><button type="button" id="close">닫기</button></div>`,
    `const o = document.getElementById("open"), d = document.getElementById("dlg");` +
      `o.addEventListener("click", () => { d.hidden = false; ${focusInside ? 'document.getElementById("close").focus();' : ""} });` +
      `document.getElementById("close").addEventListener("click", () => { d.hidden = true; o.focus(); });` +
      (escape ? `d.addEventListener("keydown", (e) => { if (e.key === "Escape") { d.hidden = true; o.focus(); } });` : ""),
  );

  it("Escape 처리가 없는 자작 모달 → 보류 kbd-modal-escape", async () => {
    expect(problems(await widgetFindings(modal(true, false)))).toContain("kbd-modal-escape:incomplete");
  }, 60_000);

  it("열 때 초점을 안 옮기는 자작 모달 → 보류 kbd-modal-focus", async () => {
    expect(problems(await widgetFindings(modal(false, true)))).toContain("kbd-modal-focus:incomplete");
  }, 60_000);
});

describe("배치 결함도 결과로 드러난다", () => {
  it("킷 모달을 #wrap 안에 두면 inert에 같이 막혀 초점·Escape가 동작하지 않는다", async () => {
    const fs = await widgetFindings(page(demo("modal.html")));
    expect(problems(fs)).toEqual(expect.arrayContaining(["kbd-modal-focus:incomplete", "kbd-modal-escape:incomplete"]));
  }, 60_000);
});

describe("모달이 열린 상태 화면 (validate_page actions)", () => {
  // 배경(#wrap)의 클릭만 받는 펼침 트리거 — 모달이 닫힌 화면에서는 위반이 맞다
  const bg = `<div role="button" tabindex="0" aria-expanded="false" id="acc">자주 묻는 질문</div>`;
  const clickOnly = `document.getElementById("acc").addEventListener("click", (e) => e.currentTarget.setAttribute("aria-expanded", "true"));`;
  const withModal = () => {
    const modal = demo("modal.html");
    const trigger = modal.match(/<button[^>]*open-modal[\s\S]*?<\/button>/)![0];
    return { url: page(bg + trigger, clickOnly, modal.replace(trigger, "")), trigger: trigger.match(/data-target="([^"]+)"/)![1]! };
  };

  it("킷이 inert를 건 배경은 검사하지 않는다 — 배경 위젯을 위반으로, 열린 모달의 트리거를 보류로 잡던 오탐 (JSP 실사용)", async () => {
    const { url, trigger } = withModal();
    const [r] = await scanTargets(
      [{ id: "t", kind: "site", url, actions: [{ type: "click", selector: `.open-modal[data-target="${trigger}"]` }] }],
      { ruleSet: "baseline", keyboard: true },
    );
    expect(r!.status).toBe("ok");
    const fs = r!.status === "ok" ? r!.findings.filter((f) => /^kbd-(widget|modal|popup)/.test(f.ruleId)) : [];
    expect(problems(fs)).toEqual([]);
  }, 60_000);

  it("대조: 모달을 열지 않으면 같은 배경 위젯은 위반", async () => {
    expect(problems(await widgetFindings(withModal().url))).toContain("kbd-widget-unreachable:violation");
  }, 60_000);
});

describe("무오탐", () => {
  it("템플릿 13종 — 위젯 키보드 위반 0", async () => {
    const found: string[] = [];
    for (const m of listPatterns()) {
      const url = `${local.origin}${join(new URL("../templates/", import.meta.url).pathname, `${m.name}.preview.html`)}`;
      const fs = await widgetFindings(url);
      found.push(...fs.filter((f) => f.outcome === "violation").flatMap((f) => f.nodes.map((n) => `${m.name}: ${f.ruleId} ${n.selector} ${n.summary}`)));
    }
    expect(found).toEqual([]);
  }, 600_000);
});
