// 훅 기준 폴더 해석 — CLAUDE_PROJECT_DIR 우선, 경로 포함 판정 경계
import { describe, expect, it } from "vitest";
import { isInside, projectRoot } from "../src/gate/project-root.js";

describe("projectRoot", () => {
  it("CLAUDE_PROJECT_DIR이 있으면 그것, 없으면 현재 폴더", () => {
    expect(projectRoot({ CLAUDE_PROJECT_DIR: "/proj" }, "/proj/sub")).toBe("/proj");
    expect(projectRoot({}, "/work")).toBe("/work");
    expect(projectRoot({ CLAUDE_PROJECT_DIR: "" }, "/work")).toBe("/work");
  });
});

describe("isInside", () => {
  it("같은 경로·하위는 안, 상위·형제는 밖", () => {
    expect(isInside("/proj", "/proj")).toBe(true);
    expect(isInside("/proj", "/proj/a/b.mjs")).toBe(true);
    expect(isInside("/proj", "/tmp/a.mjs")).toBe(false);
    expect(isInside("/proj", "/proj-other/a.mjs")).toBe(false); // 접두 일치 함정
    expect(isInside("/proj", "/")).toBe(false);
  });

  it("상대 경로는 root 기준으로 푼다", () => {
    expect(isInside("/proj", "sub/a.mjs")).toBe(true);
    expect(isInside("/proj", "../x/a.mjs")).toBe(false);
  });
});

describe("hookRoot (codex-support)", () => {
  it("입력 JSON의 cwd(Codex) > CLAUDE_PROJECT_DIR > 현재 폴더", async () => {
    const { hookRoot } = await import("../src/gate/project-root.js");
    expect(hookRoot({ cwd: "/codex/proj" }, { CLAUDE_PROJECT_DIR: "/cc" }, "/here")).toBe("/codex/proj");
    expect(hookRoot({}, { CLAUDE_PROJECT_DIR: "/cc" }, "/here")).toBe("/cc");
    expect(hookRoot(undefined, {}, "/here")).toBe("/here");
  });

  it("상대 경로·문자열 아닌 cwd는 무시한다", async () => {
    const { hookRoot } = await import("../src/gate/project-root.js");
    expect(hookRoot({ cwd: "sub" }, {}, "/here")).toBe("/here");
    expect(hookRoot({ cwd: 3 }, {}, "/here")).toBe("/here");
  });
});
