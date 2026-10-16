import { describe, expect, it } from "vitest";
import { buildMappings, renderModule } from "../scripts/build-mapping.js";
import { readFileSync } from "node:fs";
import { COMPONENT_MAPPINGS } from "../src/mapping/components.generated.js";
import { KWCAG_ITEMS } from "../src/mapping/index.js";

describe("생성 파일 드리프트", () => {
  it("docs/mapping과 생성 파일이 일치한다 (불일치 시 pnpm build:mapping)", () => {
    const fresh = renderModule(buildMappings());
    const committed = readFileSync(
      new URL("../src/mapping/components.generated.ts", import.meta.url),
      "utf8",
    );
    expect(fresh).toBe(committed);
  });
});

describe("생성된 매핑 데이터", () => {
  it("인벤토리 43종이 전부 있다", () => {
    expect(COMPONENT_MAPPINGS.length).toBe(43);
  });

  it("componentId가 유일하고 krds: 접두사를 쓴다", () => {
    const ids = COMPONENT_MAPPINGS.map((c) => c.componentId);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^krds:[a-z_]+$/);
  });

  it("모든 kwcagId가 33항목 중 하나다", () => {
    const valid = new Set(KWCAG_ITEMS.map((i) => i.id));
    for (const c of COMPONENT_MAPPINGS) {
      for (const key of ["auto", "conditional", "outOfScope", "unresolved"] as const) {
        for (const row of c[key]) {
          expect(valid.has(row.kwcagId), `${c.componentId} ${key} ${row.kwcagId}`).toBe(true);
        }
      }
    }
  });

  it("② 행에는 필수 입력 필드명과 검증 규칙이 모두 있다", () => {
    for (const c of COMPONENT_MAPPINGS) {
      for (const row of c.conditional) {
        expect(row.field.length, `${c.componentId} ${row.kwcagId} field`).toBeGreaterThan(0);
        expect(row.rule.length, `${c.componentId} ${row.kwcagId} rule`).toBeGreaterThan(0);
      }
    }
  });

  it("① 행에는 판정 근거가 있다 — 근거 없는 보장은 거짓 보증이 된다", () => {
    for (const c of COMPONENT_MAPPINGS) {
      for (const row of c.auto) {
        expect(row.evidence.length, `${c.componentId} ${row.kwcagId}`).toBeGreaterThan(3);
      }
    }
  });

  it("① 항목에 미해결 질문이 겹치면 caveat가 붙는다 — 반쪽 보증 방지", () => {
    for (const c of COMPONENT_MAPPINGS) {
      const openIds = new Set(c.unresolved.map((u) => u.kwcagId));
      for (const a of c.auto) {
        if (openIds.has(a.kwcagId)) {
          expect(a.caveat, `${c.componentId} ${a.kwcagId}`).toBeTruthy();
        } else {
          expect(a.caveat, `${c.componentId} ${a.kwcagId}`).toBeUndefined();
        }
      }
    }
  });

  it("caveat가 붙은 ① 항목이 실제로 존재한다 — 규칙이 죽어있지 않은지 확인", () => {
    const withCaveat = COMPONENT_MAPPINGS.flatMap((c) =>
      c.auto.filter((a) => a.caveat).map((a) => `${c.componentId} ${a.kwcagId}`),
    );
    expect(withCaveat.length).toBeGreaterThan(0);
  });
});
