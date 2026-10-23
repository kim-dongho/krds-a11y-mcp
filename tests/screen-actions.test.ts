// validate_page 화면 이름(screen)·상호작용(actions) — 상태 화면을 임시 빌드 없이 검사하고, 이력을 이름으로 묶는다.
// 실사용: 모달·오류 상태를 보려고 초기값을 바꾼 임시 빌드를 만들었고, ?open=modal 같은 변형과
// 호스트·포트 변경으로 이력이 섞이거나 갈라졌다
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { judge } from "../src/gate/judge.js";
import { createServer } from "../src/server/index.js";

const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
let call: (args: Record<string, unknown>) => Promise<string>;
let close: () => Promise<void>;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(b);
  const client = new Client({ name: "sa", version: "0" });
  await client.connect(a);
  call = async (args) => ((await client.callTool({ name: "validate_page", arguments: args })).content as { text: string }[]).map((x) => x.text).join("\n");
  close = async () => { await client.close(); await server.close(); };
});
afterAll(async () => { await close(); });

// 신청 버튼을 누르면 오류 메시지가 나타난다 (hidden 속성은 킷 CSS display가 덮어 써서 인라인 display로 숨긴다) — 메시지는 컨트롤과 연결돼 있지 않다(결함). 초기 화면에선 안 보인다
const page = () => {
  const f = join(mkdtempSync(join(tmpdir(), "sa-")), "form.html");
  writeFileSync(
    f,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>신청</title>` +
      `<link rel="stylesheet" href="${kit}/resources/css/common/common.css">` +
      `<link rel="stylesheet" href="${kit}/resources/css/component/component.css">` +
      `</head><body data-krds-a11y="no-chrome"><main><h1>신청</h1><div class="form-group">` +
      `<div class="form-tit"><label for="nm">이름</label></div><div class="form-conts"><input type="text" id="nm" class="krds-input"></div>` +
      `<p class="form-hint-invalid" id="nm-err" style="display:none">이름을 입력하라</p></div>` +
      `<button type="button" class="krds-btn medium primary" id="apply">신청</button></main>` +
      `<script>document.getElementById("apply").addEventListener("click", () => { document.getElementById("nm-err").style.display = ""; });</script>` +
      `</body></html>`,
  );
  return f;
};
const UNLINKED = "오류 메시지 연결 누락";

describe("actions — 상태 화면 검사", () => {
  it("초기 화면에는 없던 오류 상태를 클릭 뒤에 검사하고, 무엇을 누른 화면인지 기록한다", async () => {
    const out = mkdtempSync(join(tmpdir(), "sa-out-"));
    const f = page();
    expect(await call({ filePath: f, outDir: out, screen: "신청-초기" })).not.toContain(UNLINKED);
    const t = await call({
      filePath: f, outDir: out, screen: "신청-오류",
      actions: [{ type: "click", selector: "#apply" }, { type: "wait", selector: ".form-hint-invalid" }],
    });
    expect(t).toContain(UNLINKED);
    expect(t).toContain("검사 상태: click #apply → wait .form-hint-invalid 뒤의 화면");
    // 상태 화면은 이름별 폴더에 따로 — 리포트·원시 기록에도 상태가 남는다(증빙)
    expect(readdirSync(out).sort()).toEqual(["SUMMARY.md", "신청-오류", "신청-초기"]);
    const json = readdirSync(join(out, "신청-오류")).find((x) => x.endsWith(".json"))!;
    const target = JSON.parse(readFileSync(join(out, "신청-오류", json), "utf8")).target;
    expect(target).toMatchObject({ screen: "신청-오류", actions: "click #apply → wait .form-hint-invalid" });
    const md = readFileSync(join(out, "신청-오류", json.replace(".json", ".md")), "utf8");
    expect(md.startsWith("> 검사 상태: click #apply")).toBe(true);
  }, 120_000);

  it("상호작용이 실패하면 검사 무효 — gate가 통과로 세지 않는다", async () => {
    const out = mkdtempSync(join(tmpdir(), "sa-out-"));
    const t = await call({ filePath: page(), outDir: out, screen: "실패", actions: [{ type: "click", selector: "#nope" }] });
    expect(t).toContain("상호작용 1번째(click #nope) 실패");
    // 결론 줄이 "위반 0"으로 통과처럼 읽히지 않는다 (실사용 지적)
    expect(t).toContain("**검사 무효 — ");
    expect(t).not.toContain("자동 판정 범위에서 위반 0");
    expect(t).not.toContain("직전 검사(");
    const g = judge({ dir: out, only: [] });
    expect(g.exitCode).not.toBe(0);
  }, 120_000);

  it("빠진 값은 실행 전에 거부한다", async () => {
    expect(await call({ filePath: page(), actions: [{ type: "click" }] })).toBe("actions 1번째: click에는 selector가 필요하다 — 고쳐서 다시 호출하라.");
    expect(await call({ filePath: page(), actions: [{ type: "press" }] })).toContain("press에는 key가 필요하다");
  });
});

describe("screen — 이력을 이름으로 묶는다", () => {
  it("다른 파일 경로(호스트·포트가 바뀐 것과 같다)도 같은 이름이면 한 폴더에 쌓이고 직전 대비가 나온다", async () => {
    const out = mkdtempSync(join(tmpdir(), "sa-out-"));
    await call({ filePath: page(), outDir: out, screen: "apply form" });
    const t = await call({ filePath: page(), outDir: out, screen: "apply form" });
    expect(t).toContain("화면: apply form (기록 폴더 apply-form)");
    expect(t).toContain("직전 검사(");
    expect(readdirSync(join(out, "apply-form")).filter((x) => x.endsWith(".json"))).toHaveLength(2);
    expect(existsSync(join(out, "form"))).toBe(false);
  }, 120_000);
});
