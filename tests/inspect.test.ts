// inspect_page 실측 — 간격(margin·padding·gap)까지 읽는다. 실사용에서 여백을 재려고 임시 스크립트를 쓰던 마찰
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { runInspect } from "../src/server/inspect.js";

const file = (body: string) => {
  const f = join(mkdtempSync(join(tmpdir(), "insp-")), "p.html");
  writeFileSync(f, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>점검</title></head><body style="margin:0">${body}</body></html>`);
  return { url: pathToFileURL(f).href, label: f };
};

describe("inspect_page 간격", () => {
  it("margin·padding을 위 오른쪽 아래 왼쪽 px로, flex·grid면 gap을 읽는다", async () => {
    const r = await runInspect(
      file(
        `<div id="a" style="display:flex;gap:8px 24px;margin:4px 0 12px 0;padding:1.5px 16px">` +
          `<span>하나</span><span>둘</span></div><p id="b" style="margin:0;padding:0">본문</p>`,
      ),
      ["#a", "#b", "#none"],
    );
    const [a, b, none] = r.probes;
    expect(a).toMatchObject({ margin: [4, 0, 12, 0], padding: [1.5, 16, 1.5, 16], gap: { row: 8, column: 24 } });
    expect(b!.gap).toBeUndefined(); // block에는 gap이 의미 없다
    expect(b).toMatchObject({ margin: [0, 0, 0, 0], padding: [0, 0, 0, 0] });
    expect(none!.found).toBe(false);
  }, 60_000);

  it("gap을 지정하지 않은 flex는 0", async () => {
    const r = await runInspect(file(`<div id="f" style="display:inline-flex"><i>x</i></div>`), ["#f"]);
    expect(r.probes[0]!.gap).toEqual({ row: 0, column: 0 });
  }, 60_000);
});
