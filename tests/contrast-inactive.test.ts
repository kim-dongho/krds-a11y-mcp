// 비활성 요소의 명도 대비 — KWCAG 5.4.3(WCAG 1.4.3)은 비활성 UI 구성요소를 예외로 둔다. 킷 페이지네이션 첫 쪽의
// "이전"(span.disabled, 3.08:1)이 배경이 단색인 화면(board-list)에서 위반으로 잡혔다. 통과가 아니라 예외 검토로 남긴다
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { scanTargets } from "../src/report/runner.js";

const page = (body: string) => {
  const f = join(mkdtempSync(join(tmpdir(), "ci-")), "p.html");
  writeFileSync(f, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>대비</title></head><body style="background:#fff"><main><h1>대비</h1>${body}</main></body></html>`);
  return pathToFileURL(f).href;
};
const contrast = async (body: string) => {
  const [r] = await scanTargets([{ id: "t", kind: "site", url: page(body) }], { ruleSet: "baseline" });
  expect(r!.status).toBe("ok");
  return r!.status === "ok" ? r!.findings.filter((f) => f.ruleId === "color-contrast") : [];
};
const LOW = "color:#8a949e"; // 흰 배경 3.08:1

describe("비활성 요소의 대비 미달", () => {
  it("class=disabled·aria-disabled·disabled → 위반이 아니라 확인필요(비활성 표시)", async () => {
    const fs = await contrast(
      `<nav aria-label="페이지"><span class="disabled" style="${LOW}">이전</span></nav>` +
        `<div aria-disabled="true"><span style="${LOW}">비활성 묶음</span></div>` +
        `<button disabled style="${LOW};background:#fff;border:1px solid #000">신청</button>`,
    );
    expect(fs.filter((f) => f.outcome === "violation")).toEqual([]);
    const inc = fs.find((f) => f.outcome === "incomplete")!;
    // axe는 disabled 버튼은 스스로 빼고, 킷처럼 class로만 비활성을 표시한 것은 위반으로 낸다 — 그것을 옮긴다
    expect(inc.nodes.map((n) => n.selector).join(" ")).toContain(".disabled");
    expect(inc.nodes.every((n) => n.inactive)).toBe(true);
  }, 60_000);

  it("활성 요소는 그대로 위반", async () => {
    const fs = await contrast(`<p style="${LOW}">안내 문구</p>`);
    expect(fs.find((f) => f.outcome === "violation")?.nodes).toHaveLength(1);
  }, 60_000);
});
