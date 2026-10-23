// 도구 인터페이스 — 실패·거부는 isError로, 잘못된 입력은 조용히 무시하지 않고, 이름·필드는 실패 전에 알 수 있다
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "../src/server/index.js";

let client: Client;
let close: () => Promise<void>;
beforeAll(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(b);
  client = new Client({ name: "iface", version: "0" });
  await client.connect(a);
  close = async () => {
    await client.close();
    await server.close();
  };
});
afterAll(async () => close?.());

const call = async (name: string, args: Record<string, unknown>) => {
  const r = (await client.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
  return { text: r.content[0]!.text, isError: r.isError === true };
};

describe("isError", () => {
  it("모르는 컴포넌트는 isError, 가까운 id를 제안한다", async () => {
    const r = await call("get_component", { componentId: "buton" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("krds:button");
  });

  it("필수 입력을 비우면 isError — 채울 필드를 안내한다", async () => {
    const r = await call("get_component", { componentId: "text_input" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("labelText");
  });

  it("값을 채우면 정상 응답", async () => {
    const r = await call("get_component", { componentId: "badge", inputs: { labelText: "신규" } });
    expect(r.isError).toBe(false);
  });

  it("모르는 패턴은 isError, 가까운 이름을 제안한다", async () => {
    const r = await call("get_page_scaffold", { pageTitle: "로그인", pattern: "login-ids" });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("login-id");
  });

  it("validate_page에 대상이 없으면 isError", async () => {
    expect((await call("validate_page", {})).isError).toBe(true);
  });
});

describe("잘못된 입력을 조용히 무시하지 않는다", () => {
  it("없는 variant는 거부하고 쓸 수 있는 변형을 알려 준다", async () => {
    const r = await call("get_component", { componentId: "button", variant: "icn", inputs: { buttonText: "확인" } });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("icon");
  });

  it("pattern과 함께 준 withCarousel은 반영되지 않는다고 알린다", async () => {
    const r = await call("get_page_scaffold", { pageTitle: "안내", pattern: "sub-page", withCarousel: true });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("withCarousel은 빈 뼈대에만");
  });
});

describe("실패 전에 알 수 있다", () => {
  it("list_components가 필드명과 변형 이름을 보여 준다", async () => {
    const r = await call("list_components", {});
    expect(r.text).toMatch(/krds:text_input .*필드: labelText, inputId/);
    expect(r.text).toMatch(/krds:button .*변형: .*icon/);
  });

  it("get_page_scaffold 설명에 패턴 이름이 있다", async () => {
    const { tools } = await client.listTools();
    const t = tools.find((x) => x.name === "get_page_scaffold")!;
    expect(t.description).toContain("login-id");
    expect(t.description).toContain("board-list");
  });

  it("annotations — 조회 도구는 읽기 전용, validate_page는 파일을 쓰고 지운다", async () => {
    const { tools } = await client.listTools();
    const ann = (n: string) => tools.find((x) => x.name === n)!.annotations;
    expect(ann("get_component")?.readOnlyHint).toBe(true);
    expect(ann("validate_page")?.readOnlyHint).toBe(false);
    expect(ann("validate_page")?.destructiveHint).toBe(true);
  });
});
