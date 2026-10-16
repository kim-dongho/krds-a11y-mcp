// docs/mapping/components/*.md (원본) → src/mapping/components.generated.ts (사본)
// 문서가 원본이고 코드는 생성물이다. tests/mapping-generated.test.ts가 드리프트를 막는다.
//
// 실행: pnpm build:mapping
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DOCS = "docs/mapping/components";
const OUT = "src/mapping/components.generated.ts";

type Row = { kwcagId: string; scope?: string; cells: string[] };

/** "| a | b |" 형태의 표에서 kwcag 행만 추출. 구분선·헤더·빈 행은 버린다 */
function parseTable(block: string): Row[] {
  const rows: Row[] = [];
  for (const line of block.split("\n")) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 2) continue;
    const head = cells[0] ?? "";
    const m = head.match(/^(kwcag:\d+\.\d+\.\d+)\s*(?:\((.+)\))?/);
    if (!m) continue; // 헤더("KWCAG")·구분선·"— | 없음" 행
    rows.push({
      kwcagId: m[1]!,
      ...(m[2] ? { scope: m[2] } : {}),
      cells: cells.slice(1),
    });
  }
  return rows;
}

/** 컴포넌트 섹션에서 분류별 블록을 잘라낸다 (###/#### 모두 허용, 접미사 붙은 헤딩 포함) */
function sliceSections(body: string): Record<string, string> {
  const out: Record<string, string> = {
    auto: "",
    conditional: "",
    outOfScope: "",
    unresolved: "",
  };
  const re = /^#{3,4} (①[^\n]*|②[^\n]*|③[^\n]*|미분류[^\n]*)$/gm;
  const marks: { key: string; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const t = m[1]!;
    const key = t.startsWith("①")
      ? "auto"
      : t.startsWith("②")
        ? "conditional"
        : t.startsWith("③")
          ? "outOfScope"
          : "unresolved";
    marks.push({ key, start: m.index + m[0].length });
  }
  marks.forEach((mark, i) => {
    const end =
      i + 1 < marks.length
        ? body.lastIndexOf("\n#", marks[i + 1]!.start)
        : body.length;
    out[mark.key] += body.slice(mark.start, end);
  });
  return out;
}

export type ComponentMapping = {
  componentId: string;
  name: string;
  /** 킷이 보장 — 근거. 같은 항목에 미해결 질문이 있으면 caveat가 붙는다 */
  auto: {
    kwcagId: string;
    scope?: string;
    evidence: string;
    caveat?: string;
  }[];
  /** 사용자가 채워야 성립 — 필수 입력 + 검증 규칙 */
  conditional: {
    kwcagId: string;
    scope?: string;
    field: string;
    rule: string;
  }[];
  /** 검사층 위임 — 위임처 */
  outOfScope: { kwcagId: string; scope?: string; delegate: string }[];
  /** 미분류 — 해소되지 않은 질문 */
  unresolved: { kwcagId: string; scope?: string; question: string }[];
};

export function buildMappings(): ComponentMapping[] {
  const files = readdirSync(DOCS)
    .filter((f) => f.endsWith(".md"))
    .sort();
  const result: ComponentMapping[] = [];

  for (const file of files) {
    const src = readFileSync(join(DOCS, file), "utf8");
    // 한 파일에 변형별 섹션(## krds:x, ## krds:x#y)이 여러 개 올 수 있다
    const heads = [
      ...src.matchAll(
        /^## (krds:[a-z_]+(?:#[a-z0-9-]+)?)[^\n]*?(?:\((.+?)\))?$/gm,
      ),
    ];
    heads.forEach((h, i) => {
      const start = h.index! + h[0].length;
      const end = i + 1 < heads.length ? heads[i + 1]!.index! : src.length;
      const sec = sliceSections(src.slice(start, end));
      const entry: ComponentMapping = {
        componentId: h[1]!,
        name: h[2]?.trim() ?? h[1]!.replace("krds:", ""),
        auto: parseTable(sec.auto!).map((r) => ({
          kwcagId: r.kwcagId,
          ...(r.scope ? { scope: r.scope } : {}),
          evidence: r.cells[0] ?? "",
        })),
        conditional: parseTable(sec.conditional!).map((r) => ({
          kwcagId: r.kwcagId,
          ...(r.scope ? { scope: r.scope } : {}),
          field: r.cells[0] ?? "",
          rule: r.cells[1] ?? "",
        })),
        outOfScope: parseTable(sec.outOfScope!).map((r) => ({
          kwcagId: r.kwcagId,
          ...(r.scope ? { scope: r.scope } : {}),
          delegate: r.cells[0] ?? "",
        })),
        unresolved: parseTable(sec.unresolved!).map((r) => ({
          kwcagId: r.kwcagId,
          ...(r.scope ? { scope: r.scope } : {}),
          question: r.cells[0] ?? "",
        })),
      };
      // 같은 컴포넌트의 변형 섹션은 기본 섹션에 합친다 (krds:main_menu#pc → krds:main_menu).
      // 섹션 자체가 변형이면 그 행들에 변형 표시를 남긴다 — 첫 섹션이 변형인 경우도 포함
      const [base, variant] = entry.componentId.split("#") as [string, string?];
      if (variant) {
        const tag = (s?: string) => (s ? `#${variant} · ${s}` : `#${variant}`);
        for (const key of [
          "auto",
          "conditional",
          "outOfScope",
          "unresolved",
        ] as const) {
          entry[key] = (entry[key] as { scope?: string }[]).map((x) => ({
            ...x,
            scope: tag(x.scope),
          })) as never;
        }
      }
      const existing = result.find((r) => r.componentId === base);
      if (existing) {
        existing.auto.push(...entry.auto);
        existing.conditional.push(...entry.conditional);
        existing.outOfScope.push(...entry.outOfScope);
        existing.unresolved.push(...entry.unresolved);
      } else {
        result.push({
          ...entry,
          componentId: base,
          name: entry.name.replace(/#.*$/, "").trim(),
        });
      }
    });
  }
  // 같은 KWCAG 항목에 ①(확정 근거)과 ?(미해결 질문)가 공존할 수 있다 —
  // 항목의 한 측면은 확인됐고 다른 측면은 미확인인 경우다.
  // 이때 ①만 내보내면 반쪽짜리 보증이 되므로 caveat로 표시한다.
  for (const c of result) {
    for (const a of c.auto) {
      const open = c.unresolved.find((u) => u.kwcagId === a.kwcagId);
      if (open) a.caveat = `같은 항목에 미해결 질문 있음: ${open.question}`;
    }
  }
  return result;
}

export function renderModule(mappings: ComponentMapping[]): string {
  return `// 생성 파일 — 직접 수정하지 말 것.
// 원본: docs/mapping/components/*.md · 재생성: pnpm build:mapping
import type { ComponentMapping } from "./component-mapping-types.js";

export const COMPONENT_MAPPINGS: ComponentMapping[] = ${JSON.stringify(mappings, null, 2)};
`;
}

if (process.argv[1]?.endsWith("build-mapping.ts")) {
  const mappings = buildMappings();
  writeFileSync(OUT, renderModule(mappings));
  const n = (k: keyof ComponentMapping) =>
    mappings.reduce(
      (s, m) => s + (Array.isArray(m[k]) ? (m[k] as unknown[]).length : 0),
      0,
    );
  console.error(
    `${mappings.length}개 컴포넌트 → ${OUT}\n` +
      `  ① ${n("auto")} · ② ${n("conditional")} · ③ ${n("outOfScope")} · ? ${n("unresolved")}`,
  );
}
