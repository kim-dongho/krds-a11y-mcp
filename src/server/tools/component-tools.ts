// 부품 공급 도구 — list_components · get_component · get_requirements
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { COMPONENT_MAPPINGS } from "../../mapping/components.generated.js";
import { iconFixCss, kitVersion, kitVersionWarning, listMarkupFiles, readMarkup } from "../../mapping/kit-markup.js";
import { kitBehaviorLines } from "../../mapping/kit-behavior.js";
import { ASSEMBLY_NOTES, PRESCRIBED_PATTERNS } from "../../mapping/assembly-notes.js";
import { CONFIRM_FIELDS, classifyRequirements, inputGaps, missingRequirements, normalizeId, normalizeInputs, parseFields } from "./inputs.js";
import { byId, itemLabel, text } from "./shared.js";
import { RENDERERS, renderComponent } from "../../markup/index.js";

export function registerListComponents(server: McpServer): void {
  // ── 1. 색인: id + 이름 + 필수 입력 개수만. 상세는 get_component로 (토큰 절약)
  server.registerTool(
    "list_components",
    {
      title: "KRDS 컴포넌트 목록",
      description:
        "사용 가능한 KRDS 컴포넌트 43종의 색인을 반환한다. 각 항목은 id·이름과 " +
        "해당 컴포넌트에서 사용자가 반드시 채워야 하는 접근성 필수 입력의 개수를 담는다. " +
        "마크업과 상세 요건은 get_component로 조회한다.",
      inputSchema: {},
    },
    async () => {
      // 필수 입력 개수는 get_component가 변형 없이 부를 때 막는 기준과 같다 — 매핑 행 수를 그대로 세면
      // 선택·변형 전용 행까지 들어가 get_component와 어긋났다 (실사용 5회 지적: button 3 vs 1)
      const lines = COMPONENT_MAPPINGS.map((c) => {
        const { required, variantOnly, optional } = classifyRequirements(c.conditional);
        const extra = [
          variantOnly.length > 0 ? `변형 전용 ${variantOnly.length}` : "",
          optional.length > 0 ? `해당 시 ${optional.length}` : "",
        ].filter(Boolean);
        const variants = listMarkupFiles(c.componentId).length > 1 ? " · 변형 있음" : "";
        return `${c.componentId} · ${c.name} — 필수 입력 ${required.length}건${extra.length ? ` (${extra.join(", ")})` : ""}, 보장 ${c.auto.length}건${variants}`;
      });
      return text(
        `KRDS 컴포넌트 ${COMPONENT_MAPPINGS.length}종 (킷 v${kitVersion()})\n` +
          (kitVersionWarning() ? `${kitVersionWarning()}\n` : "") +
          "필수 입력: 변형 없이 get_component를 부를 때 채워야 하는 수. 변형 전용은 그 변형을 고를 때, 해당 시는 그 상황일 때만 필요하다\n\n" +
          lines.join("\n"),
      );
    },
  );
}

export function registerGetComponent(server: McpServer): void {
  // ── 2. 공급: 마크업 + 보장 항목 + 필수 입력. 필수 입력 미제공 시 마크업을 주지 않는다
  server.registerTool(
    "get_component",
    {
      title: "KRDS 컴포넌트 공급",
      description:
        "KRDS 컴포넌트의 킷 마크업과 접근성 요건을 반환한다. " +
        "이 컴포넌트가 보장하는 KWCAG 항목, 사용자가 반드시 채워야 하는 값(필수 입력), " +
        "그리고 페이지 조립 후 따로 확인해야 하는 항목을 함께 알려준다. " +
        "필수 입력을 채우지 않으면 마크업 대신 무엇을 채워야 하는지 안내한다.",
      inputSchema: {
        componentId: z
          .string()
          .describe("컴포넌트 id — 'krds:button' 또는 'button'"),
        variant: z
          .string()
          .optional()
          .describe("변형 이름 — 예: 'icon', 'size'. 킷 파일명 접미사와 같다"),
        inputs: z
          .record(
            z.string(),
            z.union([
              z.string(),
              z.number(),
              z.boolean(),
              z.array(z.union([z.string(), z.number()])),
              z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))),
            ]),
          )
          .optional()
          .describe(
            "필수 입력 값 — 필드명: 값. 배열(헤더 목록 등)은 쉼표로 이어 받는다. " +
              "반복 항목은 객체 배열로 줘도 된다 — 예: crumbs: [{crumbLabel, href}, …]. 바깥 키 이름(crumbs·items 등)은 자유이고 항목 안의 키가 필드명이다. " +
              "상태 입력: required(필수 표시)·checked(선택된 항목)는 불리언, errorMessage(오류 상태), currentPage(현재 쪽). " +
              "확인용 입력(modalPlacement·captionSync 등 구현 의무 확인)은 true를 준다. " +
              "breadcrumb·pagination·radio_button·checkbox·text_input·select는 값을 넣은 마크업을 만들어 준다. " +
              "미제공 시 요건 안내만 반환하고 마크업은 주지 않는다",
          ),
      },
    },
    async ({ componentId, variant, inputs }) => {
      const id = normalizeId(componentId);
      const c = byId.get(id);
      if (!c) {
        return text(
          `알 수 없는 컴포넌트: ${id}\nlist_components로 사용 가능한 id를 확인하라.`,
        );
      }

      const provided = normalizeInputs(inputs);
      // scope가 특정 변형(#state 등)에 한정된 요건은 그 변형을 요청할 때만 강제한다
      const missing = missingRequirements(c.conditional, variant, provided);

      const out: string[] = [`# ${c.name} (${id})`, ""];

      if (missing.length > 0) {
        out.push(
          `## 필수 입력이 채워지지 않아 마크업을 제공하지 않는다 (${missing.length}건)`,
          "",
          "아래 값을 inputs에 담아 다시 호출하라. 이 값들은 KWCAG 충족에 필수이며,",
          "비워두면 해당 검사항목을 위반한다.",
          "",
        );
        for (const r of missing) {
          const { keys } = parseFields(r.field);
          out.push(
            `- **${keys.join(", ")}**${r.scope ? ` (${r.scope})` : ""} — ${itemLabel(r.kwcagId)}`,
            `  - 자리: ${r.field}`,
            `  - 규칙: ${r.rule}`,
          );
          for (const k of keys.filter((k) => k in CONFIRM_FIELDS)) {
            out.push(`  - 확인용 입력: 값이 아니라 확인이다 — \`${k}: true\` = "${CONFIRM_FIELDS[k]}"`);
          }
        }
        const gaps = inputGaps(inputs);
        if (gaps.length > 0) out.push("", `비어 있는 항목: ${gaps.join(", ")}`);
        // 렌더러가 있으면 입력 모양을 보여 준다 — 실사용에서 바깥 키·항목 구조를 추측하던 마찰
        const renderer = RENDERERS[id];
        if (renderer) out.push("", `입력 예시 (값을 채우면 마크업을 만들어 준다): ${renderer.example}`);
        return text(out.join("\n"));
      }

      // 렌더러가 있으면 입력값을 교정본 구조에 넣은 마크업을 준다 — 킷 원본을 받아 손으로 다시 쓰던
      // 실사용 6세션 전원의 마찰. 없거나 만들지 못하면 지금처럼 킷 원본 + 채워 넣을 값
      const generated = renderComponent(id, inputs ?? {});
      let kitFile: string | undefined;
      if (generated?.ok) {
        try { kitFile = readMarkup(id, variant).file; } catch { kitFile = listMarkupFiles(id)[0]; }
        out.push(
          "## 생성 마크업 — 입력값을 교정본 구조에 넣었다. 그대로 써도 된다",
          "",
          "```html",
          generated.html,
          "```",
          "",
        );
      } else {
        let markup;
        try {
          markup = readMarkup(id, variant);
        } catch (error) {
          return text(
            `# ${c.name} (${id})\n\n마크업을 가져오지 못했다.\n\n` +
              `${error instanceof Error ? error.message : String(error)}\n\n` +
              `이 컴포넌트의 킷 파일: ${listMarkupFiles(id).join(", ") || "(없음)"}`,
          );
        }
        out.push(
          `킷 v${kitVersion()} · ${markup.file}`,
          "",
          "## 마크업",
          "",
          "```html",
          markup.html,
          "```",
          "",
        );

        if (Object.keys(provided).length > 0) {
          // 실사용 3세션 모두 "충족" 표기를 보고 값이 마크업에 들어간 줄 알았다가 손으로 다시 썼다
          out.push(
            "## 채워 넣을 값 — 위 마크업은 킷 원본이다. 도구는 값을 치환하지 않으니 데모 텍스트·id·href를 이 값으로 직접 바꿔라",
            "",
          );
          for (const r of c.conditional) {
            for (const key of parseFields(r.field).keys) {
              const v = provided[key];
              if (v) out.push(`- ${key}: "${v}" → 바꿔 넣으면 ${itemLabel(r.kwcagId)} 충족`);
            }
          }
          out.push("");
        }

        if (generated && !generated.ok) {
          out.push(`생성 마크업을 만들지 못했다(${generated.reason}) — 위 킷 원본에 값을 직접 넣어라.`, "");
        }
      }

      if (c.auto.length > 0) {
        out.push("## 이 컴포넌트가 보장하는 항목", "");
        for (const a of c.auto) {
          out.push(
            `- ${itemLabel(a.kwcagId)}${a.scope ? ` (${a.scope})` : ""}` +
              (a.caveat ? ` — ⚠️ 부분 보장: ${a.caveat}` : ""),
          );
        }
        out.push("");
      }

      if (c.outOfScope.length > 0) {
        out.push(
          "## 이 컴포넌트만으로는 충족되지 않는 항목 — 페이지 조립 후 확인",
          "",
        );
        for (const o of c.outOfScope) {
          out.push(`- ${itemLabel(o.kwcagId)} → ${o.delegate}`);
        }
        out.push("");
      }

      const notes = ASSEMBLY_NOTES[id];
      if (notes) {
        out.push("## 조립 지침 (지키지 않으면 위반이 된다)", "");
        // 생성 마크업이 있으면 지침의 예시 코드 블록은 겹치므로 뺀다 (지침 문장은 유지)
        for (const n of notes) if (!(generated?.ok && n.startsWith("```html"))) out.push(`- ${n}`);
        out.push("");
      }

      out.push(...kitBehaviorLines(id));

      const pattern = PRESCRIBED_PATTERNS[id];
      if (pattern) {
        out.push(
          `## 응용 패턴 — ${pattern.title}`,
          "",
          pattern.note,
          "",
          "```html",
          pattern.html,
          "```",
          "",
          "```css",
          pattern.css,
          "```",
          "",
        );
      }


      const fixCss = iconFixCss(id);
      if (fixCss) {
        out.push(
          "## 아이콘 경로 교정 CSS — 페이지 <style>에 반드시 포함하라",
          "",
          "킷 v1.1.0 npm판 CSS는 이 컴포넌트의 아이콘 경로가 잘못되어(img 중복) 로고·아이콘이",
          "표시되지 않는다. 아래 교정 CSS를 동봉하고, 킷 자산 경로가 다르면 node_modules/krds-uiux 부분을 맞춰라.",
          "",
          "```css",
          fixCss,
          "```",
          "",
        );
      }

      if (kitFile) out.push(`킷 원본(참고): v${kitVersion()} · ${kitFile}`, "");

      out.push(
        "---",
        "이 안내는 컴포넌트(부품) 수준이다. KWCAG 준수 판정은 조립된 페이지 단위이며,",
        "최종 확인은 전문가 심사와 보조기술 실사용 평가가 필요하다.",
      );
      return text(out.join("\n"));
    },
  );
}

export function registerGetRequirements(server: McpServer): void {
  // ── 3. 요건 조회: 마크업 없이 요건만 (설계 검토·리뷰용)
  server.registerTool(
    "get_requirements",
    {
      title: "컴포넌트 접근성 요건 조회",
      description:
        "마크업 없이 특정 컴포넌트의 접근성 요건만 조회한다. " +
        "필수 입력 목록, 보장 항목, 위임 항목, 그리고 아직 확정되지 않은 " +
        "미해결 질문까지 포함한다. 코드 리뷰나 설계 검토에 쓴다.",
      inputSchema: {
        componentId: z.string().describe("컴포넌트 id — 'krds:button' 또는 'button'"),
      },
    },
    async ({ componentId }) => {
      const id = normalizeId(componentId);
      const c = byId.get(id);
      if (!c) return text(`알 수 없는 컴포넌트: ${id}`);

      const out: string[] = [`# ${c.name} (${id}) 접근성 요건`, ""];
      out.push(`킷 파일: ${listMarkupFiles(id).join(", ") || "(없음)"}`, "");

      const section = (title: string, rows: string[]) => {
        if (rows.length === 0) return;
        out.push(`## ${title}`, "", ...rows, "");
      };

      // list_components·get_component와 같은 구분 — 변형 없이 부를 때 막는 것, 변형 전용, 해당 시
      const req = classifyRequirements(c.conditional);
      const reqRow = (r: (typeof req.required)[number]) =>
        `- **${r.field}**${r.scope ? ` (${r.scope})` : ""} — ${itemLabel(r.kwcagId)}\n  - ${r.rule}`;
      section(`필수 입력 (${req.required.length})`, req.required.map(reqRow));
      section(`변형 전용 필수 입력 (${req.variantOnly.length}) — 그 변형을 고를 때만`, req.variantOnly.map(reqRow));
      section(`해당 시 입력 (${req.optional.length}) — 그 상황일 때만`, req.optional.map(reqRow));
      section(
        `보장 항목 (${c.auto.length})`,
        c.auto.map(
          (a) =>
            `- ${itemLabel(a.kwcagId)}${a.scope ? ` (${a.scope})` : ""}\n  - 근거: ${a.evidence}` +
            (a.caveat ? `\n  - ⚠️ ${a.caveat}` : ""),
        ),
      );
      section(
        `위임 항목 (${c.outOfScope.length})`,
        c.outOfScope.map((o) => `- ${itemLabel(o.kwcagId)} → ${o.delegate}`),
      );
      section(
        `미해결 질문 (${c.unresolved.length}) — 아직 판정되지 않았다`,
        c.unresolved.map((u) => `- ${itemLabel(u.kwcagId)}: ${u.question}`),
      );
      return text(out.join("\n"));
    },
  );
}
