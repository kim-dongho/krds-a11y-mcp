// init의 두 원칙을 고정한다: 멱등(재실행 무중복) + 기존 설정 보존(깨진 JSON은 건너뜀).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runInit } from "../src/init/init.js";

let tmp: string;
function freshDir(): string {
  tmp = mkdtempSync(join(tmpdir(), "init-test-"));
  return tmp;
}
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

function json(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("runInit — 빈 프로젝트", () => {
  it("6개 파일을 생성하고 전부 created", () => {
    const cwd = freshDir();
    const items = runInit(cwd);
    expect(items.map((i) => i.action)).toEqual(["created", "created", "created", "created", "created", "created"]);

    expect(json(join(cwd, ".mcp.json"))).toHaveProperty("mcpServers.krds-a11y");
    const settings = json(join(cwd, ".claude", "settings.json")) as {
      hooks: { Stop: unknown[]; PreToolUse: unknown[] };
    };
    expect(JSON.stringify(settings.hooks.Stop)).toContain("stop-hook");
    expect(JSON.stringify(settings.hooks.PreToolUse)).toContain("pretool-hook");
    // stderr 리다이렉트 금지 — 차단 사유 전달 통로 (실측)
    expect(JSON.stringify(settings)).not.toContain("2>");
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8")).toContain("krds-a11y:begin");
    expect(readFileSync(join(cwd, "AGENTS.md"), "utf8")).toContain("validate_page");
  });

  it("재실행하면 전부 unchanged (멱등)", () => {
    const cwd = freshDir();
    runInit(cwd);
    const second = runInit(cwd);
    expect(second.every((i) => i.action === "unchanged")).toBe(true);
  });
});

describe("runInit — 기존 설정 보존", () => {
  it(".mcp.json의 다른 서버를 보존", () => {
    const cwd = freshDir();
    writeFileSync(
      join(cwd, ".mcp.json"),
      JSON.stringify({ mcpServers: { other: { command: "foo" } } }),
    );
    runInit(cwd);
    const d = json(join(cwd, ".mcp.json")) as { mcpServers: Record<string, unknown> };
    expect(d.mcpServers.other).toEqual({ command: "foo" });
    expect(d.mcpServers["krds-a11y"]).toBeDefined();
  });

  it("settings.json의 기존 훅·설정을 보존하고 우리 훅만 추가", () => {
    const cwd = freshDir();
    mkdirSync(join(cwd, ".claude"), { recursive: true });
    writeFileSync(
      join(cwd, ".claude", "settings.json"),
      JSON.stringify({
        permissions: { allow: ["Bash(ls:*)"] },
        hooks: { Stop: [{ hooks: [{ type: "command", command: "echo bye" }] }] },
      }),
    );
    runInit(cwd);
    const d = json(join(cwd, ".claude", "settings.json")) as {
      permissions: unknown;
      hooks: { Stop: unknown[]; PreToolUse: unknown[] };
    };
    expect(d.permissions).toEqual({ allow: ["Bash(ls:*)"] });
    expect(d.hooks.Stop).toHaveLength(2);
    expect(JSON.stringify(d.hooks.Stop[0])).toContain("echo bye");
  });

  it("CLAUDE.md의 사용자 내용을 보존하고 블록을 append, 재실행 시 블록만 교체", () => {
    const cwd = freshDir();
    writeFileSync(join(cwd, "CLAUDE.md"), "# 내 프로젝트\n\n내 규칙\n");
    const first = runInit(cwd);
    expect(first[2]!.action).toBe("updated");
    const body = readFileSync(join(cwd, "CLAUDE.md"), "utf8");
    expect(body).toContain("# 내 프로젝트");
    expect(body).toContain("krds-a11y:begin");
    // 마커 구간이 이미 있으면 중복 추가가 아니라 unchanged
    expect(runInit(cwd)[2]!.action).toBe("unchanged");
    expect(readFileSync(join(cwd, "CLAUDE.md"), "utf8").match(/krds-a11y:begin/g)).toHaveLength(1);
  });

  it("깨진 JSON은 덮어쓰지 않고 skipped", () => {
    const cwd = freshDir();
    writeFileSync(join(cwd, ".mcp.json"), "{ 깨짐");
    const items = runInit(cwd);
    expect(items[0]).toMatchObject({ path: ".mcp.json", action: "skipped" });
    expect(readFileSync(join(cwd, ".mcp.json"), "utf8")).toBe("{ 깨짐");
  });
});

describe("훅 중복 등록", () => {
  it("버전 고정·로컬 경로로 등록된 훅이 있으면 init 재실행이 훅을 또 붙이지 않는다", () => {
    const cwd = freshDir();
    mkdirSync(join(cwd, ".claude"), { recursive: true });
    writeFileSync(
      join(cwd, ".claude", "settings.json"),
      JSON.stringify({
        hooks: {
          Stop: [{ hooks: [{ type: "command", command: "npx -y krds-a11y-mcp@x.y.z stop-hook" }] }],
          PreToolUse: [{ matcher: "Write|Edit", hooks: [{ type: "command", command: "node /x/dist/index.js pretool-hook" }] }],
        },
      }),
    );
    const item = runInit(cwd)[1]!;
    expect(item.action).toBe("unchanged");
    const d = json(join(cwd, ".claude", "settings.json")) as { hooks: { Stop: unknown[]; PreToolUse: unknown[] } };
    expect(d.hooks.Stop).toHaveLength(1);
    expect(d.hooks.PreToolUse).toHaveLength(1);
  });
});

describe("Codex 설정 (codex-support)", () => {
  it("빈 프로젝트에 .codex/config.toml과 .codex/hooks.json을 만든다", () => {
    const cwd = freshDir();
    const items = runInit(cwd);
    expect(items.map((i) => i.path)).toContain(".codex/config.toml");
    expect(items.map((i) => i.path)).toContain(".codex/hooks.json");
    const toml = readFileSync(join(cwd, ".codex", "config.toml"), "utf8");
    expect(toml).toContain("[mcp_servers.krds-a11y]");
    expect(toml).toContain('args = ["-y", "krds-a11y-mcp"]');
    const hooks = json(join(cwd, ".codex", "hooks.json")) as { hooks: { Stop: unknown[]; PreToolUse: { matcher: string }[] } };
    expect(JSON.stringify(hooks.hooks.Stop)).toContain("stop-hook");
    expect(hooks.hooks.PreToolUse[0]!.matcher).toContain("apply_patch");
  });

  it("config.toml의 기존 내용을 보존하고 표를 덧붙이며, 재실행은 멱등", () => {
    const cwd = freshDir();
    mkdirSync(join(cwd, ".codex"), { recursive: true });
    writeFileSync(join(cwd, ".codex", "config.toml"), 'model = "o3"\n\n[mcp_servers.other]\ncommand = "foo"\n');
    runInit(cwd);
    const toml = readFileSync(join(cwd, ".codex", "config.toml"), "utf8");
    expect(toml).toContain('model = "o3"');
    expect(toml).toContain("[mcp_servers.other]");
    expect(toml.match(/\[mcp_servers\.krds-a11y\]/g)).toHaveLength(1);
    runInit(cwd);
    expect(readFileSync(join(cwd, ".codex", "config.toml"), "utf8")).toBe(toml);
  });

  it("따옴표·점 표기로 이미 등록돼 있으면 건드리지 않는다", () => {
    for (const existing of ['[mcp_servers."krds-a11y"]\ncommand = "node"\n', 'mcp_servers.krds-a11y.command = "node"\n']) {
      const cwd = freshDir();
      mkdirSync(join(cwd, ".codex"), { recursive: true });
      writeFileSync(join(cwd, ".codex", "config.toml"), existing);
      const item = runInit(cwd).find((i) => i.path === ".codex/config.toml")!;
      expect(item.action).toBe("unchanged");
      expect(readFileSync(join(cwd, ".codex", "config.toml"), "utf8")).toBe(existing);
    }
  });

  it("hooks.json의 기존 훅을 보존하고, 깨진 JSON은 건너뛴다", () => {
    const cwd = freshDir();
    mkdirSync(join(cwd, ".codex"), { recursive: true });
    writeFileSync(join(cwd, ".codex", "hooks.json"), JSON.stringify({ description: "mine", hooks: { SessionStart: [{ hooks: [{ type: "command", command: "echo hi" }] }] } }));
    runInit(cwd);
    const d = json(join(cwd, ".codex", "hooks.json")) as { description: string; hooks: Record<string, unknown[]> };
    expect(d.description).toBe("mine");
    expect(d.hooks.SessionStart).toHaveLength(1);
    expect(d.hooks.Stop).toHaveLength(1);
    const cwd2 = freshDir();
    mkdirSync(join(cwd2, ".codex"), { recursive: true });
    writeFileSync(join(cwd2, ".codex", "hooks.json"), "{ 깨짐");
    expect(runInit(cwd2).find((i) => i.path === ".codex/hooks.json")!.action).toBe("skipped");
  });
});
