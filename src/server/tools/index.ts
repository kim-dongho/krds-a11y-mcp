// MCP 도구 등록. 도구 하나에 등록 함수 하나 — 순서는 여기서 정한다 (tools/list 순서가 도구 계약의 일부)
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGetComponent, registerGetRequirements, registerListComponents } from "./component-tools.js";
import { registerGetPageScaffold } from "./scaffold-tool.js";
import { registerInspectPage, registerValidatePage } from "./check-tools.js";
import { registerGetFrameworkGuide, registerGetIconFixCss, registerGetTokens } from "./lookup-tools.js";

export function registerTools(server: McpServer): void {
  registerListComponents(server);
  registerGetComponent(server);
  registerGetPageScaffold(server);
  registerGetRequirements(server);
  registerValidatePage(server);
  registerGetIconFixCss(server);
  registerGetFrameworkGuide(server);
  registerGetTokens(server);
  registerInspectPage(server);
}

export { normalizeId, normalizeInputs, inputGaps, parseFields, type ComponentInputs } from "./inputs.js";
export { pageBlock } from "./scaffold-tool.js";
export { ASSEMBLY_NOTES } from "../../mapping/assembly-notes.js";
