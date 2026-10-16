// 필수 입력 판정 — list_components 개수·get_requirements 구분·get_component 차단이 같은 기준을 쓴다.
// 실사용 5회 지적(button 3 vs 1 등)과 2026-10-14 조사에서 나온 결함(모달·TTS 요건 미강제, 확인용 입력 false 통과)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { COMPONENT_MAPPINGS } from "../src/mapping/components.generated.js";
import { createServer } from "../src/server/index.js";
import { CONFIRM_FIELDS, classifyRequirements, scopeApplies } from "../src/server/tools/inputs.js";

let call: (name: string, args: Record<string, unknown>) => Promise<string>;
let close: () => Promise<void>;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(b);
  const client = new Client({ name: "req", version: "0" });
  await client.connect(a);
  call = async (name, args) => ((await client.callTool({ name, arguments: args })).content as { text: string }[]).map((x) => x.text).join("\n");
  close = async () => { await client.close(); await server.close(); };
});
afterAll(async () => { await close(); });

const blocked = (t: string) => t.includes("필수 입력이 채워지지 않아 마크업을 제공하지 않는다");

describe("scope 해석", () => {
  it("#이름은 그 변형에서만, \"기본\"은 변형 없는 호출에도, #이 없으면 모두에 걸린다", () => {
    expect(scopeApplies("#state", undefined)).toBe(false);
    expect(scopeApplies("#state", "state")).toBe(true);
    expect(scopeApplies("기본·#size", undefined)).toBe(true);
    expect(scopeApplies("기본·#size", "size")).toBe(true);
    expect(scopeApplies("기본·#size", "icon")).toBe(false);
    expect(scopeApplies("Escape", undefined)).toBe(true);
    expect(scopeApplies(undefined, "icon")).toBe(true);
  });
});

describe("list_components 개수 = get_component 차단 기준", () => {
  it("button은 필수 1건(변형 전용 1, 해당 시 1)", async () => {
    const t = await call("list_components", {});
    expect(t).toContain("krds:button · 버튼 — 필수 입력 1건 (변형 전용 1, 해당 시 1)");
  });

  it("43종 모두 — 표기한 필수 입력 수만큼 빈 호출에서 막힌다 (main_menu처럼 기본 파일 없는 것 제외)", async () => {
    const t = await call("list_components", {});
    for (const c of COMPONENT_MAPPINGS) {
      const n = classifyRequirements(c.conditional).required.length;
      expect(t, c.componentId).toContain(`${c.componentId} · ${c.name} — 필수 입력 ${n}건`);
      const r = await call("get_component", { componentId: c.componentId });
      if (r.includes("variant를 지정하라")) continue;
      expect(blocked(r), c.componentId).toBe(n > 0);
      if (n > 0) expect(r, c.componentId).toContain(`(${n}건)`);
    }
  }, 60_000);

  it("get_requirements도 필수·변형 전용·해당 시를 나눠 보인다", async () => {
    const t = await call("get_requirements", { componentId: "button" });
    expect(t).toContain("## 필수 입력 (1)");
    expect(t).toContain("## 변형 전용 필수 입력 (1)");
    expect(t).toContain("## 해당 시 입력 (1)");
  });
});

describe("기본 호출에서 빠지던 요건", () => {
  it("모달 — modalPlacement·modalTitle 없이 마크업을 주지 않는다 (매핑 scope #sample이 변형으로 읽히던 결함)", async () => {
    const t = await call("get_component", { componentId: "modal" });
    expect(blocked(t)).toBe(true);
    expect(t).toContain("modalPlacement");
    expect(t).toContain("modalTitle");
  });

  it("TTS — scope \"기본·#size\"의 buttonLabel·ttsText를 기본 호출에서 강제한다", async () => {
    const t = await call("get_component", { componentId: "tts" });
    expect(blocked(t)).toBe(true);
    expect(t).toContain("buttonLabel");
    expect(await call("get_component", { componentId: "tts", variant: "size" })).toContain("buttonLabel");
  });
});

describe("확인용 입력", () => {
  it("false나 지어낸 문자열은 충족이 아니고, 안내에 true로 무엇을 확인하는지 적는다", async () => {
    for (const v of [false, "outside-wrap"]) {
      const t = await call("get_component", { componentId: "modal", inputs: { modalPlacement: v, modalTitle: "신청 전 확인" } });
      expect(blocked(t), String(v)).toBe(true);
      expect(t).toContain(`\`modalPlacement: true\` = "${CONFIRM_FIELDS.modalPlacement}"`);
    }
  });

  it("true면 마크업을 준다", async () => {
    const t = await call("get_component", { componentId: "modal", inputs: { modalPlacement: true, modalTitle: "신청 전 확인" } });
    expect(blocked(t)).toBe(false);
    expect(t).toContain("krds-modal");
  });

  it("확인용 필드는 매핑표에 실제로 있는 필드다", () => {
    const fields = COMPONENT_MAPPINGS.flatMap((c) => c.conditional.map((r) => r.field)).join(" ");
    for (const k of Object.keys(CONFIRM_FIELDS)) expect(fields, k).toContain(k);
  });
});
