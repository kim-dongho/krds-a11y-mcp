import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { keepRunsFrom, pruneRuns } from "../src/runs/run-store.js";

function screenDir(stamps: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "prune-"));
  for (const s of stamps) {
    for (const ext of [".json", ".md", ".png", ".full.png"]) writeFileSync(join(dir, `${s}${ext}`), "x");
  }
  writeFileSync(join(dir, "memo.txt"), "검사 기록이 아닌 파일");
  return dir;
}
const stamps = (n: number) =>
  Array.from({ length: n }, (_, i) => `validate-2026-10-${String(i + 1).padStart(2, "0")}T10-00-00`);

describe("검사 기록 보존 개수 — 첫 회와 최근 N회만 남긴다 (42회 검사로 폴더 비대 실측)", () => {
  it("첫 회 + 최근 2회를 남기고 나머지 검사의 md·json·스크린샷을 함께 지운다", () => {
    const all = stamps(6);
    const dir = screenDir(all);
    const removed = pruneRuns(dir, 2);
    expect(removed).toEqual([all[1], all[2], all[3]]);
    const left = readdirSync(dir).sort();
    for (const s of [all[0], all[4], all[5]]) {
      for (const ext of [".json", ".md", ".png", ".full.png"]) expect(left).toContain(`${s}${ext}`);
    }
    expect(left.some((f) => f.startsWith(all[2]!))).toBe(false);
    expect(left).toContain("memo.txt"); // 검사 기록이 아닌 파일은 건드리지 않는다
  });

  it("기록이 보존 개수 이하면 아무것도 지우지 않는다", () => {
    const dir = screenDir(stamps(3));
    expect(pruneRuns(dir, 2)).toEqual([]);
    expect(readdirSync(dir)).toHaveLength(13);
  });

  it("보존 개수는 입력값 → 환경 변수 → 무제한 순으로 정한다", () => {
    expect(keepRunsFrom(5, { KRDS_A11Y_KEEP_RUNS: "3" })).toBe(5);
    expect(keepRunsFrom(undefined, { KRDS_A11Y_KEEP_RUNS: "3" })).toBe(3);
    expect(keepRunsFrom(undefined, {})).toBeUndefined();
    expect(keepRunsFrom(undefined, { KRDS_A11Y_KEEP_RUNS: "0" })).toBeUndefined(); // 0·음수·문자는 무시
    expect(keepRunsFrom(undefined, { KRDS_A11Y_KEEP_RUNS: "abc" })).toBeUndefined();
  });
});
