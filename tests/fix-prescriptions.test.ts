// 교정 처방 표의 정합 — 처방이 실존 규칙·실존 컴포넌트를 가리키고, 근거 출처를 갖는다.
import { describe, expect, it } from "vitest";
import { COMPONENT_MAPPINGS } from "../src/mapping/components.generated.js";
import { FIX_PRESCRIPTIONS, orphanPrescriptions } from "../src/mapping/fix-prescriptions.js";

describe("FIX_PRESCRIPTIONS", () => {
  it("모든 처방의 규칙 ID가 axe 또는 kbd 배치표에 실존한다", () => {
    expect(orphanPrescriptions()).toEqual([]);
  });

  it("모든 처방에 근거 출처가 있다 — 근거 없는 처방 금지", () => {
    for (const [id, p] of Object.entries(FIX_PRESCRIPTIONS)) {
      expect(p.source.trim(), id).not.toBe("");
      expect(p.fix.trim(), id).not.toBe("");
    }
  });

  it("처방이 가리키는 컴포넌트는 킷에 실재한다 (이미지 컴포넌트처럼 없는 것을 처방하지 않는다)", () => {
    const ids = new Set(COMPONENT_MAPPINGS.map((c) => c.componentId));
    for (const [id, p] of Object.entries(FIX_PRESCRIPTIONS)) {
      if (p.component) expect(ids.has(p.component), `${id} → ${p.component}`).toBe(true);
    }
  });

  it("범위 15개 — 실사용에서 걸린 axe 규칙 5개 + 키보드 3개 + axe tabindex(RC 검증 추가) + 동적 위젯 6개", () => {
    expect(Object.keys(FIX_PRESCRIPTIONS).sort()).toEqual(
      [
        "heading-order", "image-alt", "kbd-focus-visible", "kbd-modal-escape", "kbd-modal-focus", "kbd-modal-return", "kbd-modal-trap",
        "kbd-popup-escape", "kbd-reachable", "kbd-tab-order", "kbd-widget-unreachable", "label-title-only", "list", "tabindex", "target-size",
      ],
    );
  });
});
