// 설치 환경 점검 — git 루트가 아닌 폴더, 같은 이름의 사용자·로컬 MCP 등록(프로젝트 .mcp.json을 덮는다), 킷 미설치
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkClaudeConflicts, checkGitRoot, checkNode, checkProjectKit, packageManager } from "../src/init/env-check.js";

const dir = () => mkdtempSync(join(tmpdir(), "env-"));

describe("git 루트", () => {
  it("상위 폴더가 git이면 경고한다", () => {
    const root = dir();
    mkdirSync(join(root, ".git"));
    const sub = join(root, "app");
    mkdirSync(sub);
    const c = checkGitRoot(sub);
    expect(c.level).toBe("warn");
    expect(c.detail).toContain("git init");
  });

  it("git 루트에서 실행하면 문제없다", () => {
    const root = dir();
    mkdirSync(join(root, ".git"));
    expect(checkGitRoot(root).level).toBe("ok");
  });
});

describe("MCP 등록 충돌 (~/.claude.json)", () => {
  const claudeJson = (data: unknown) => {
    const f = join(dir(), ".claude.json");
    writeFileSync(f, JSON.stringify(data));
    return f;
  };

  it("git 루트가 상위면 그 경로의 로컬 등록과 사용자 등록을 찾는다", () => {
    const home = dir();
    mkdirSync(join(home, ".git"));
    const project = join(home, "work", "site");
    mkdirSync(project, { recursive: true });
    const f = claudeJson({
      mcpServers: { "krds-a11y": { command: "npx", args: ["-y", "krds-a11y-mcp"] } },
      projects: {
        [home]: { mcpServers: { "krds-a11y": { command: "npx", args: ["-y", "@corp/krds-a11y-mcp"] } } },
        [join(home, "other")]: { mcpServers: { "krds-a11y": { command: "npx", args: [] } } },
      },
    });
    const found = checkClaudeConflicts(project, f);
    expect(found).toHaveLength(2);
    expect(found.map((c) => c.title).join(" ")).toContain("사용자 범위");
    expect(found.find((c) => c.title.includes("로컬 범위"))!.detail).toContain("다른 패키지");
  });

  it("이 폴더가 자체 git 루트면 상위 경로의 로컬 등록은 적용되지 않는다", () => {
    const home = dir();
    const project = join(home, "site");
    mkdirSync(join(project, ".git"), { recursive: true });
    const f = claudeJson({ projects: { [home]: { mcpServers: { "krds-a11y": { command: "npx", args: ["-y", "@corp/krds-a11y-mcp"] } } } } });
    expect(checkClaudeConflicts(project, f)).toEqual([]);
  });

  it("파일이 없으면 조용하다", () => {
    expect(checkClaudeConflicts(dir(), join(dir(), "없음.json"))).toEqual([]);
  });
});

describe("프로젝트 킷·패키지 매니저", () => {
  it("package.json은 있는데 krds-uiux가 없으면 설치 명령을 그 매니저로 안내한다", () => {
    const p = dir();
    writeFileSync(join(p, "package.json"), "{}");
    writeFileSync(join(p, "yarn.lock"), "");
    expect(packageManager(p).name).toBe("yarn");
    const c = checkProjectKit(p);
    expect(c.level).toBe("warn");
    expect(c.detail).toContain("yarn add krds-uiux@1.1.0");
  });

  it("Node 20 미만은 오류", () => {
    expect(checkNode("18.19.0").level).toBe("error");
    expect(checkNode("22.1.0").level).toBe("ok");
  });
});
