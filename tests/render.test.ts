// 리포트 집계의 정직성 — 판정 보류 노드가 위반으로 둔갑해 세어지지 않아야 한다.
import { describe, expect, it } from "vitest";
import { render } from "../src/report/render.js";
import { translate } from "../src/report/translate.js";
import type { AxeFinding, ScanResult, Target } from "../src/report/types.js";

const target: Target = { id: "kit:button", kind: "kit-demo", url: "file:///x" };

function scan(findings: AxeFinding[]): ScanResult {
  return {
    target,
    status: "ok",
    scannedAt: "2026-10-07T00:00:00.000Z",
    engine: { axeVersion: "4.13.0", ruleSet: "baseline", assetsLoaded: true },
    findings,
  };
}

const nodes = (n: number): AxeFinding["nodes"] =>
  Array.from({ length: n }, (_, i) => ({ selector: `#n${i}`, summary: "s" }));

describe("render — 위반·보류 노드 집계 분리", () => {
  it("같은 규칙의 위반 1곳 + 보류 52곳을 '위반 53곳'으로 합산하지 않는다 (실사용 실측 버그)", () => {
    const md = render(
      translate([
        scan([
          { ruleId: "color-contrast", outcome: "violation", nodes: nodes(1) },
          { ruleId: "color-contrast", outcome: "incomplete", nodes: nodes(52) },
        ]),
      ]),
    );
    expect(md).toContain("위반 1곳 + 판정 보류 52곳");
    expect(md).toContain("위반 아님");
    expect(md).not.toContain("합계 53곳");
  });

  it("위반만 있으면 기존 '합계 N곳' 표기를 유지한다", () => {
    const md = render(
      translate([scan([{ ruleId: "color-contrast", outcome: "violation", nodes: nodes(3) }])]),
    );
    expect(md).toContain("합계 3곳");
  });

  it("보류만 있으면 '판정 보류 N곳'으로 표기한다", () => {
    const md = render(
      translate([scan([{ ruleId: "color-contrast", outcome: "incomplete", nodes: nodes(2) }])]),
    );
    expect(md).toContain("판정 보류 2곳");
  });
});

describe("render — 교정 처방", () => {
  it("처방이 있는 위반 규칙에 '교정 방법' 줄과 컴포넌트를 붙인다", () => {
    const md = render(translate([scan([{ ruleId: "label-title-only", outcome: "violation", nodes: nodes(1) }])]));
    expect(md).toContain("**교정 방법**");
    expect(md).toContain("get_component('krds:text_input')");
  });

  it("키보드 검사 결과는 KWCAG 6.1.2에 배치되고 노드별 사유와 처방이 붙는다", () => {
    const report = translate([
      scan([
        {
          ruleId: "kbd-focus-visible",
          outcome: "violation",
          nodes: [{ selector: "#save", summary: "초점을 받아도 외곽선·그림자·테두리·배경 변화가 없다" }],
        },
      ]),
    ]);
    expect(report.items.find((i) => i.kwcagId === "kwcag:6.1.2")!.grade).toBe("violation");
    const md = render(report);
    expect(md).toContain("키보드 초점 표시");
    expect(md).toContain("`#save` — 초점을 받아도");
    expect(md).toContain("outline: none");
  });

  it("키보드 판정 보류는 위반으로 세지 않는다 (gate가 막지 않는다)", () => {
    const report = translate([
      scan([{ ruleId: "kbd-reachable", outcome: "incomplete", nodes: [{ selector: "a", summary: "못 닿음" }] }]),
    ]);
    expect(report.items.find((i) => i.kwcagId === "kwcag:6.1.1")!.grade).toBe("needs-review");
    expect(report.items.filter((i) => i.grade === "violation")).toHaveLength(0);
  });

  it("목록 구조 위반(list)은 8.1.1 위반으로 세고 처방이 붙는다 — 참고 칸으로 빠져 gate가 못 세던 문제", () => {
    const report = translate([scan([{ ruleId: "list", outcome: "violation", nodes: nodes(1) }])]);
    expect(report.items.find((i) => i.kwcagId === "kwcag:8.1.1")!.grade).toBe("violation");
    expect(report.outOfMap).toHaveLength(0);
    const md = render(report);
    expect(md).not.toContain("참고 — KWCAG 33항목 밖");
    expect(md).toContain("직계 자식은 li만");
  });
});

describe("RC 교정 재현 (rc-fixes) — 리포트 문구", () => {
  it("F5 — 규칙 대표 문장은 위반 쪽을 쓴다 (보류 문장이 대표가 되지 않는다)", () => {
    const md = render(
      translate([
        scan([
          { ruleId: "kbd-focus-visible", outcome: "violation", nodes: [{ selector: "#a", summary: "초점을 받아도 외곽선·그림자·테두리·배경 변화가 없다" }] },
          { ruleId: "kbd-focus-visible", outcome: "incomplete", nodes: [{ selector: ".skip", summary: "화면에 숨긴 요소라 초점 표시를 자동 판정할 수 없다" }] },
        ]),
      ]),
    );
    expect(md).toMatch(/키보드 초점 표시\) — 초점을 받아도/);
  });

  it("F5 — 판정 보류 사유를 'axe'로 고정해 쓰지 않는다 (키보드 검사는 axe가 아니다)", () => {
    const md = render(translate([scan([{ ruleId: "kbd-reachable", outcome: "incomplete", nodes: nodes(1) }])]));
    expect(md).not.toContain("axe가 위반으로 확정하지 못하고");
    expect(md).not.toContain("axe 판정 보류");
  });

  it("F5 — 키보드 검사를 돌렸으면 검사 정보에 수행 사실이 남는다", () => {
    const s = scan([]);
    if (s.status === "ok") s.engine.keyboard = { stops: 37, end: "body" };
    expect(render(translate([s]))).toContain("Tab 키를 37번 눌러 화면 끝까지 순회");
  });

  it("F5 — axe tabindex 위반에도 교정 방법이 붙는다", () => {
    const md = render(translate([scan([{ ruleId: "tabindex", outcome: "violation", nodes: nodes(1) }])]));
    expect(md).toContain("양수 tabindex를 지우고");
  });
});
