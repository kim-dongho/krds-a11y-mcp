import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { AXE_RULE_MAP, KWCAG_ITEMS } from "../src/mapping/index.js";

// 문서(docs/mapping)가 원본, 코드는 사본 — 양방향 대조로 정합을 강제한다 (design.md §4)
const translationDoc = readFileSync(
  new URL("../docs/mapping/kwcag-wcag-axe.md", import.meta.url),
  "utf8",
);
const itemsDoc = readFileSync(
  new URL("../docs/mapping/kwcag22-items.md", import.meta.url),
  "utf8",
);

// 번역표 본문만 (부록 C-4는 의도적으로 매핑하지 않는 "참고" 규칙 목록)
const tableSection = translationDoc.slice(0, translationDoc.indexOf("## 부록 A"));

describe("문서-코드 대조: axe 규칙 매핑", () => {
  const docRuleTokens = [...tableSection.matchAll(/axe:([a-z0-9*-]+)/g)].map(
    (m) => m[1]!,
  );
  // 번역표 비고가 "요건과 무관"이라고 명시적으로 제외한 규칙 — 매핑하지 않는 것이 맞다
  const INTENTIONALLY_UNMAPPED = ["accesskeys"];
  const concrete = [
    ...new Set(docRuleTokens.filter((t) => !t.includes("*"))),
  ].filter((t) => !INTENTIONALLY_UNMAPPED.includes(t));
  const wildcards = [...new Set(docRuleTokens.filter((t) => t.includes("*")))].map(
    (t) => t.replace("*", ""),
  );

  it("번역표에 등장하는 모든 규칙 ID가 코드에 있다", () => {
    const missing = concrete.filter((id) => !(id in AXE_RULE_MAP));
    expect(missing).toEqual([]);
  });

  it("와일드카드 표기(landmark-* 등)는 해당 프리픽스 규칙이 코드에 1개 이상 있다", () => {
    for (const prefix of wildcards) {
      const hits = Object.keys(AXE_RULE_MAP).filter((id) => id.startsWith(prefix));
      expect(hits.length, `프리픽스 ${prefix}`).toBeGreaterThan(0);
    }
  });

  it("코드의 모든 규칙 ID가 번역표에 등장한다 (직접 또는 와일드카드로)", () => {
    const orphans = Object.keys(AXE_RULE_MAP).filter(
      (id) => !concrete.includes(id) && !wildcards.some((p) => id.startsWith(p)),
    );
    expect(orphans).toEqual([]);
  });

  it("규칙이 가리키는 kwcag ID는 전부 33항목 중 하나다", () => {
    const valid = new Set(KWCAG_ITEMS.map((i) => i.id));
    for (const [ruleId, entry] of Object.entries(AXE_RULE_MAP)) {
      for (const k of entry.kwcagIds) {
        expect(valid.has(k), `${ruleId} → ${k}`).toBe(true);
      }
    }
  });
});

describe("문서-코드 대조: KWCAG 33항목", () => {
  const docIds = [
    ...new Set([...itemsDoc.matchAll(/\| (kwcag:\d+\.\d+\.\d+) \|/g)].map((m) => m[1]!)),
  ];

  it("기준표의 33개 ID와 코드가 일치한다", () => {
    const codeIds = KWCAG_ITEMS.map((i) => i.id);
    expect(docIds.length).toBe(33);
    expect([...codeIds].sort()).toEqual([...docIds].sort());
  });

  it("커버리지가 번역표의 커버리지 열과 일치한다", () => {
    const docCoverage = new Map<string, string>();
    for (const line of tableSection.split("\n")) {
      const idMatch = line.match(/^\| (kwcag:\d+\.\d+\.\d+)/);
      if (!idMatch) continue;
      const cells = line.split("|").map((c) => c.trim());
      const cov = cells.find((c) => /^(full|partial|none)$/.test(c));
      if (cov) docCoverage.set(idMatch[1]!, cov);
    }
    expect(docCoverage.size).toBe(33);
    for (const item of KWCAG_ITEMS) {
      expect(item.coverage, item.id).toBe(docCoverage.get(item.id));
    }
  });

  it("커버리지 none 13개에는 수동 확인 방법이 있다", () => {
    const none = KWCAG_ITEMS.filter((i) => i.coverage === "none");
    expect(none.length).toBe(13);
    for (const i of none) expect(i.manualHow, i.id).toBeTruthy();
  });
});
