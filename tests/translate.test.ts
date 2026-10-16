import { describe, expect, it } from "vitest";
import { translate } from "../src/report/translate.js";
import type { AxeFinding, ScanResult, Target } from "../src/report/types.js";

const target: Target = { id: "kit:button", kind: "kit-demo", url: "file:///x" };

function scan(findings: AxeFinding[]): ScanResult {
  return {
    target,
    status: "ok",
    scannedAt: "2026-09-11T00:00:00.000Z",
    engine: { axeVersion: "4.13.0", ruleSet: "baseline", assetsLoaded: true },
    findings,
  };
}

function finding(ruleId: string, outcome: AxeFinding["outcome"]): AxeFinding {
  return { ruleId, outcome, nodes: [{ selector: "#a", summary: "s" }] };
}

function item(report: ReturnType<typeof translate>, id: string) {
  const found = report.items.find((i) => i.kwcagId === id);
  if (!found) throw new Error(`${id} 없음`);
  return found;
}

describe("불변 조건 (design.md §3)", () => {
  it("입력이 비어도 항목은 항상 33개다", () => {
    const r = translate([]);
    expect(r.items.length).toBe(33);
  });

  it("coverage none 13항목은 언제나 not-tested다", () => {
    const r = translate([scan([finding("image-alt", "pass")])]);
    const none = r.items.filter((i) => i.coverage === "none");
    expect(none.length).toBe(13);
    for (const i of none) expect(i.grade).toBe("not-tested");
  });

  it("partial 항목의 auto-pass에는 caveat가 반드시 붙는다", () => {
    const r = translate([scan([finding("image-alt", "pass")])]);
    const v = item(r, "kwcag:5.1.1");
    expect(v.grade).toBe("auto-pass");
    expect(v.caveat).toContain("내용 미검증");
  });

  it("full 항목(7.1.1)의 auto-pass에는 caveat가 없다", () => {
    const r = translate([scan([finding("html-has-lang", "pass")])]);
    const v = item(r, "kwcag:7.1.1");
    expect(v.grade).toBe("auto-pass");
    expect(v.caveat).toBeUndefined();
  });

  it("items는 kwcagId 오름차순으로 정렬된다", () => {
    const r = translate([]);
    expect(r.items[0]!.kwcagId).toBe("kwcag:5.1.1");
    expect(r.items.at(-1)!.kwcagId).toBe("kwcag:8.2.1");
  });
});

describe("등급 우선순위", () => {
  it("violation이 pass보다 우선한다", () => {
    const r = translate([
      scan([finding("image-alt", "violation"), finding("svg-img-alt", "pass")]),
    ]);
    expect(item(r, "kwcag:5.1.1").grade).toBe("violation");
  });

  it("incomplete는 needs-review가 된다 (auto-pass 승격 금지)", () => {
    const r = translate([
      scan([finding("color-contrast", "incomplete"), finding("color-contrast", "pass")]),
    ]);
    expect(item(r, "kwcag:5.4.3").grade).toBe("needs-review");
  });

  it("inapplicable만 있으면 not-applicable", () => {
    const r = translate([scan([finding("video-caption", "inapplicable")])]);
    expect(item(r, "kwcag:5.2.1").grade).toBe("not-applicable");
  });

  it("규칙이 아예 실행되지 않은 항목도 not-applicable", () => {
    const r = translate([scan([])]);
    expect(item(r, "kwcag:5.4.3").grade).toBe("not-applicable");
  });
});

describe("매핑 규칙", () => {
  it("select-name은 7.3.2와 8.2.1 양쪽에 계상된다", () => {
    const r = translate([scan([finding("select-name", "violation")])]);
    expect(item(r, "kwcag:7.3.2").grade).toBe("violation");
    expect(item(r, "kwcag:8.2.1").grade).toBe("violation");
  });

  it("매핑 밖 규칙의 violation·incomplete는 outOfMap으로 간다", () => {
    const r = translate([
      scan([
        finding("meta-viewport", "violation"),
        finding("css-orientation-lock", "incomplete"),
        finding("p-as-heading", "pass"), // 매핑 밖 pass는 잡음이므로 버린다
      ]),
    ]);
    expect(r.outOfMap.map((f) => f.ruleId)).toEqual([
      "css-orientation-lock",
      "meta-viewport",
    ]);
  });
});

describe("수동 체크리스트", () => {
  it("none 13개 + needs-review 항목이 들어간다", () => {
    const r = translate([scan([finding("color-contrast", "incomplete")])]);
    const none = r.manualChecklist.filter((c) => c.reason === "none");
    const review = r.manualChecklist.filter((c) => c.reason === "needs-review");
    expect(none.length).toBe(13);
    expect(review.map((c) => c.kwcagId)).toEqual(["kwcag:5.4.3"]);
  });
});

describe("에러 전파", () => {
  it("error 스캔은 meta.errors에 남고 집계는 계속된다", () => {
    const err: ScanResult = {
      target: { id: "kit:modal", kind: "kit-demo", url: "file:///y" },
      status: "error",
      scannedAt: "2026-09-11T00:00:00.000Z",
      reason: "assets not loaded",
    };
    const r = translate([err, scan([finding("image-alt", "pass")])]);
    expect(r.meta.errors.length).toBe(1);
    expect(item(r, "kwcag:5.1.1").grade).toBe("auto-pass");
  });
});
