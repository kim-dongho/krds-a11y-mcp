// 도구 계약 — 모델이 도구를 고르고 인자를 만드는 근거(tools/list)를 고정한다.
// 이름·순서·입력 스키마가 의도치 않게 바뀌면 소비자 동작이 바뀐다. 의도한 변경이면 `vitest -u`로 스냅샷을 갱신한다
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/server/index.js";

async function listTools() {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverSide);
  const client = new Client({ name: "contract", version: "0" });
  await client.connect(clientSide);
  const { tools } = await client.listTools();
  await client.close();
  await server.close();
  return tools;
}

describe("도구 계약 (tools/list)", () => {
  it("도구 9종의 이름과 순서", async () => {
    expect((await listTools()).map((t) => t.name)).toEqual([
      "list_components",
      "get_component",
      "get_page_scaffold",
      "get_requirements",
      "validate_page",
      "get_icon_fix_css",
      "get_framework_guide",
      "get_tokens",
      "inspect_page",
    ]);
  });

  it("도구별 입력 스키마", async () => {
    const tools = await listTools();
    expect(tools.map((t) => ({ name: t.name, input: t.inputSchema }))).toMatchSnapshot();
  });
});
