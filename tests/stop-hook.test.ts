// Stop 훅 판정의 핵심 계약을 고정한다: 위반이면 차단(2), 통과면 허용(0),
// 기록 없으면 오탐 방지로 허용, 상한 초과 시 사람 확인으로 전환.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseStopHookArgs, runStopHook } from "../src/gate/stop-hook.js";

let tmp: string;
function freshDir(): string {
  tmp = mkdtempSync(join(tmpdir(), "stop-hook-test-"));
  return tmp;
}
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

function seedRun(root: string, slug: string, violations: number): void {
  const dir = join(root, slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "validate-2026-10-06T10-00-00.json"),
    JSON.stringify({
      target: { label: "https://a.test/", kind: "url" },
      report: { items: Array.from({ length: violations }, () => ({ grade: "violation" })) },
      results: [{ id: "validate:https://a.test/", kitIssues: [] }],
    }),
  );
}

function hook(dir: string, maxRetries = 5): { code: 0 | 2; err: string[] } {
  const err: string[] = [];
  const code = runStopHook({ dir, maxRetries }, (s) => err.push(s));
  return { code, err };
}

describe("runStopHook", () => {
  it("위반 잔존 → 차단(2), 교정·재검사 지시와 시도 횟수를 알린다", () => {
    const root = freshDir();
    seedRun(root, "form", 2);
    const { code, err } = hook(root);
    expect(code).toBe(2);
    expect(err.join(" ")).toContain("위반");
    expect(err.join(" ")).toContain("1/5");
  });

  it("위반 0·검사 최신 → 허용(0), 카운터 리셋", () => {
    const root = freshDir();
    seedRun(root, "form", 0);
    writeFileSync(join(root, ".stop-hook-retries"), "3");
    const { code, err } = hook(root);
    expect(code).toBe(0);
    expect(err).toHaveLength(0);
    expect(existsSync(join(root, ".stop-hook-retries"))).toBe(false);
  });

  it("검사 기록 없음 → 오탐 방지로 허용(0)", () => {
    expect(hook(freshDir()).code).toBe(0);
    expect(hook(join(freshDir(), "없는폴더")).code).toBe(0);
  });

  it("차단마다 카운터 증가, 상한 초과 시 사람 확인으로 전환해 허용", () => {
    const root = freshDir();
    seedRun(root, "form", 1);
    for (let i = 1; i <= 2; i++) {
      const { code, err } = hook(root, 2);
      expect(code).toBe(2);
      expect(err.join(" ")).toContain(`${i}/2`);
    }
    expect(readFileSync(join(root, ".stop-hook-retries"), "utf8")).toBe("2");
    const third = hook(root, 2);
    expect(third.code).toBe(0);
    expect(third.err.join(" ")).toContain("사람이 확인");
    expect(existsSync(join(root, ".stop-hook-retries"))).toBe(false);
    // 상한 초과로 리셋된 뒤 다시 차단이 시작된다 (다음 세션 대비)
    expect(hook(root, 2).code).toBe(2);
  });

  it("깨진 카운터 파일은 0으로 취급", () => {
    const root = freshDir();
    seedRun(root, "form", 1);
    writeFileSync(join(root, ".stop-hook-retries"), "엉망");
    const { err } = hook(root);
    expect(err.join(" ")).toContain("1/5");
  });
});

describe("parseStopHookArgs", () => {
  it("기본값과 옵션", () => {
    expect(parseStopHookArgs([])).toEqual({ dir: "reports", maxRetries: 5 });
    expect(parseStopHookArgs(["--dir", "out", "--max-retries", "3"])).toEqual({
      dir: "out",
      maxRetries: 3,
    });
  });

  it("잘못된 입력은 error", () => {
    expect(parseStopHookArgs(["--max-retries", "0"])).toHaveProperty("error");
    expect(parseStopHookArgs(["--뭐지"])).toHaveProperty("error");
  });
});

describe("회귀", () => {
  it("공통부 누락 차단은 질문 없이 따를 기본 규칙을 준다", () => {
    const root = freshDir();
    const dir = join(root, "chromeless");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "validate-2026-10-06T10-00-00.json"),
      JSON.stringify({
        target: { label: "https://a.test/", kind: "url" },
        report: { items: [] },
        results: [{ id: "validate:https://a.test/", kitIssues: ["사이트 공통부 누락(머리글·바닥글) — x"] }],
      }),
    );
    const err: string[] = [];
    const code = runStopHook({ dir: root, maxRetries: 5 }, (s) => err.push(s));
    expect(code).toBe(2);
    expect(err.join(" ")).toContain("질문하지 말고");
    expect(err.join(" ")).toContain("withSiteChrome: true");
    // 위반이 없으면 "위반을 교정하라" 문장을 붙이지 않는다 (검증에서 지적)
    expect(err.join(" ")).not.toContain("위반을 교정하고");
  });

  it("상대 경로 reports는 프로젝트 루트 기준으로 찾는다 (하위 폴더에서 실행돼도)", () => {
    const root = freshDir();
    seedRun(join(root, "reports"), "form", 1);
    const err: string[] = [];
    // 현재 폴더(테스트 실행 위치)에는 reports가 없다 — 루트를 넘겨야 찾는다
    const code = runStopHook({ dir: "reports", maxRetries: 5 }, (s) => err.push(s), root);
    expect(code).toBe(2);
  });
});

describe("세션 단위 카운터와 끄기", () => {
  const seed = (root: string) => {
    const dir = join(root, "page");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "validate-2026-10-06T10-00-00.json"),
      JSON.stringify({ target: { label: "http://x/", kind: "url" }, report: { items: [{ grade: "violation" }] }, results: [{ status: "ok" }] }),
    );
  };
  const run = (root: string, session?: string, env: NodeJS.ProcessEnv = {}) =>
    runStopHook({ dir: root, maxRetries: 2 }, () => {}, root, session, env);

  it("상한을 넘겨 풀어 준 세션은 다시 막지 않고, 새 세션은 처음부터 센다", () => {
    const root = mkdtempSync(join(tmpdir(), "sh-session-"));
    seed(root);
    expect([run(root, "a"), run(root, "a"), run(root, "a"), run(root, "a")]).toEqual([2, 2, 0, 0]);
    expect(run(root, "b")).toBe(2);
  });

  it("KRDS_A11Y_GATE=off면 판정하지 않는다", () => {
    const root = mkdtempSync(join(tmpdir(), "sh-off-"));
    seed(root);
    expect(run(root, undefined, { KRDS_A11Y_GATE: "off" })).toBe(0);
  });
});
