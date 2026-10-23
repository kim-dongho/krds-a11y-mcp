// 설치 환경 점검 — init이 경고로 쓰고, doctor 명령이 전부 보여 준다.
// 실사용에서 만난 함정: git 루트가 아닌 폴더(상위가 git)에서 init하면 Claude Code가 상위를 프로젝트로 보고,
// 그 경로에 같은 이름(krds-a11y)으로 등록된 사용자·로컬 MCP 설정이 프로젝트 .mcp.json을 덮었다.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import pkg from "../../package.json";
import { VERIFIED_KIT_VERSION } from "../mapping/kit-markup.js";

export type CheckLevel = "ok" | "warn" | "error";
export type Check = { level: CheckLevel; title: string; detail?: string };

const PKG_NAME = pkg.name;

/** cwd에서 위로 올라가며 .git이 있는 첫 폴더. 없으면 undefined */
export function findGitRoot(cwd: string): string | undefined {
  let dir = resolve(cwd);
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir;
    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}

/** 잠금 파일로 패키지 매니저를 고른다 — 안내 명령을 그 매니저 문법으로 낸다 */
export function packageManager(cwd: string): { name: "pnpm" | "yarn" | "bun" | "npm"; addDev: string; add: string } {
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) return { name: "pnpm", addDev: "pnpm add -D", add: "pnpm add" };
  if (existsSync(join(cwd, "yarn.lock"))) return { name: "yarn", addDev: "yarn add -D", add: "yarn add" };
  if (existsSync(join(cwd, "bun.lockb")) || existsSync(join(cwd, "bun.lock"))) return { name: "bun", addDev: "bun add -d", add: "bun add" };
  return { name: "npm", addDev: "npm i -D", add: "npm i" };
}

export function checkNode(version: string = process.versions.node): Check {
  const major = Number(version.split(".")[0]);
  return major >= 20
    ? { level: "ok", title: `Node ${version}` }
    : { level: "error", title: `Node ${version} — 20 이상이 필요하다`, detail: "Node 20 LTS 이상으로 올린 뒤 다시 실행하라" };
}

export function checkGitRoot(cwd: string): Check {
  const root = findGitRoot(cwd);
  if (root === resolve(cwd)) return { level: "ok", title: "git 저장소 루트에서 실행했다" };
  if (!root) return { level: "ok", title: "git 저장소가 아니다 — 이 폴더가 프로젝트 루트로 쓰인다" };
  return {
    level: "warn",
    title: `이 폴더는 git 루트가 아니다 (상위 ${root}가 루트)`,
    detail:
      "Claude Code는 상위 git 루트를 프로젝트로 보고, 그 경로에 등록된 MCP 설정이 이 폴더의 .mcp.json보다 우선할 수 있다. " +
      "이 폴더가 독립 프로젝트면 `git init`을 하고, 아니면 git 루트에서 init을 실행하라",
  };
}

type ServerEntry = { command?: unknown; args?: unknown };
const isOurs = (e: ServerEntry) =>
  Array.isArray(e.args) && e.args.some((a) => typeof a === "string" && (a === PKG_NAME || a.startsWith(`${PKG_NAME}@`)));

/**
 * ~/.claude.json에서 같은 이름(krds-a11y)의 사용자 범위·로컬 범위 등록을 찾는다 — 둘 다 프로젝트 .mcp.json보다 우선한다.
 * 로컬 범위는 프로젝트 경로에 묶인다. Claude Code가 이 폴더를 열 때 쓰는 프로젝트 경로(git 루트, 없으면 이 폴더)의 등록만 본다
 */
export function checkClaudeConflicts(cwd: string, claudeJson: string = join(homedir(), ".claude.json")): Check[] {
  let data: { mcpServers?: Record<string, ServerEntry>; projects?: Record<string, { mcpServers?: Record<string, ServerEntry> }> };
  try {
    data = JSON.parse(readFileSync(claudeJson, "utf8"));
  } catch {
    return [];
  }
  const out: Check[] = [];
  const describe = (e: ServerEntry) => [e.command, ...(Array.isArray(e.args) ? e.args : [])].filter((x) => typeof x === "string").join(" ");
  const user = data.mcpServers?.["krds-a11y"];
  if (user) {
    out.push({
      level: "warn",
      title: `사용자 범위에 krds-a11y가 등록돼 있다 (${describe(user)})`,
      detail: `프로젝트 .mcp.json보다 우선한다${isOurs(user) ? "" : " — 다른 패키지다"}. 프로젝트 설정을 쓰려면 \`claude mcp remove krds-a11y -s user\``,
    });
  }
  const project = findGitRoot(cwd) ?? resolve(cwd);
  for (const [path, p] of Object.entries(data.projects ?? {})) {
    const local = p.mcpServers?.["krds-a11y"];
    if (!local) continue;
    const abs = resolve(path);
    if (relative(abs, project) !== "") continue; // 이 폴더를 열 때 쓰는 프로젝트 경로가 아니다
    out.push({
      level: "warn",
      title: `로컬 범위에 krds-a11y가 등록돼 있다 (${abs}: ${describe(local)})`,
      detail: `그 폴더를 프로젝트로 연 세션에서는 .mcp.json보다 우선한다${isOurs(local) ? "" : " — 다른 패키지다"}. 지우려면 그 폴더에서 \`claude mcp remove krds-a11y -s local\``,
    });
  }
  return out;
}

/** 생성된 페이지가 불러오는 킷(node_modules/krds-uiux)이 프로젝트에 있는가 */
export function checkProjectKit(cwd: string): Check {
  const pm = packageManager(cwd);
  const install = `${pm.add} krds-uiux@${VERIFIED_KIT_VERSION}`;
  if (!existsSync(join(cwd, "package.json"))) {
    return {
      level: "warn",
      title: "package.json이 없다 — 킷 자산을 어떻게 서빙할지 정해야 한다",
      detail: `npm 프로젝트면 \`${install}\`. JSP처럼 킷을 문서루트에 복사해 서빙하면 get_page_scaffold의 assetBase에 그 경로를 준다`,
    };
  }
  let version: string | undefined;
  try {
    const req = createRequire(join(cwd, "package.json"));
    version = (JSON.parse(readFileSync(req.resolve("krds-uiux/package.json"), "utf8")) as { version: string }).version;
  } catch {
    version = undefined;
  }
  if (!version) {
    return {
      level: "warn",
      title: "프로젝트에 krds-uiux가 설치돼 있지 않다",
      detail: `도구가 주는 페이지는 node_modules/krds-uiux의 CSS·JS를 불러온다 — 없으면 화면이 깨지고 validate_page가 검사 무효가 된다. \`${install}\``,
    };
  }
  if (version !== VERIFIED_KIT_VERSION) {
    return {
      level: "warn",
      title: `프로젝트의 krds-uiux v${version}는 검증된 v${VERIFIED_KIT_VERSION}과 다르다`,
      detail: `매핑표·아이콘 교정 CSS가 v${VERIFIED_KIT_VERSION} 기준이다. \`${install}\``,
    };
  }
  return { level: "ok", title: `krds-uiux v${version}` };
}

/** validate_page·inspect_page가 쓰는 검사 스택 */
export function checkBrowserStack(cwd: string): Check[] {
  const pm = packageManager(cwd);
  const req = createRequire(join(cwd, "package.json"));
  const out: Check[] = [];
  let playwright: { chromium: { executablePath(): string } } | undefined;
  try {
    playwright = req("playwright");
  } catch {
    out.push({
      level: "warn",
      title: "playwright가 없다 — validate_page·inspect_page를 쓸 수 없다",
      detail: `\`${pm.addDev} playwright @axe-core/playwright && npx playwright install chromium\``,
    });
  }
  try {
    req.resolve("@axe-core/playwright");
    if (playwright) out.push({ level: "ok", title: "playwright · @axe-core/playwright" });
  } catch {
    if (playwright) out.push({ level: "warn", title: "@axe-core/playwright가 없다", detail: `\`${pm.addDev} @axe-core/playwright\`` });
  }
  if (playwright) {
    let exe = "";
    try {
      exe = playwright.chromium.executablePath();
    } catch {
      exe = "";
    }
    out.push(
      exe && existsSync(exe)
        ? { level: "ok", title: "Chromium 설치됨" }
        : { level: "warn", title: "Chromium이 설치돼 있지 않다", detail: "`npx playwright install chromium`" },
    );
  }
  return out;
}

/** init이 설치한 항목이 있는가, 고정 버전이 이 실행 파일과 같은가 */
export function checkInstalled(cwd: string): Check[] {
  const out: Check[] = [];
  const read = (rel: string) => {
    try {
      return readFileSync(join(cwd, rel), "utf8");
    } catch {
      return undefined;
    }
  };
  const mcp = read(".mcp.json");
  const settings = read(".claude/settings.json");
  if (!mcp?.includes(PKG_NAME)) out.push({ level: "warn", title: ".mcp.json에 krds-a11y가 없다", detail: "`npx -y krds-a11y-mcp init`" });
  if (!settings?.includes("stop-hook")) out.push({ level: "warn", title: "Claude Code Stop 훅이 없다", detail: "`npx -y krds-a11y-mcp init`" });
  const pinned = [...new Set([...(mcp ?? "").matchAll(new RegExp(`${PKG_NAME}@([0-9][^"\\s]*)`, "g"))].map((m) => m[1]!))];
  if (pinned.length > 0 && !pinned.includes(pkg.version)) {
    out.push({
      level: "warn",
      title: `.mcp.json은 ${pinned.join(", ")}로 고정돼 있다 (지금 실행한 것은 ${pkg.version})`,
      detail: `올리려면 \`npx -y ${PKG_NAME}@${pkg.version} init\``,
    });
  }
  if (out.length === 0 && mcp) out.push({ level: "ok", title: "init 설치 항목(.mcp.json·훅) 있음" });
  return out;
}

/** doctor — 전부 */
export function runChecks(cwd: string): Check[] {
  return [
    checkNode(),
    checkGitRoot(cwd),
    ...checkClaudeConflicts(cwd),
    ...checkInstalled(cwd),
    checkProjectKit(cwd),
    ...checkBrowserStack(cwd),
  ];
}

const MARK: Record<CheckLevel, string> = { ok: "✓", warn: "⚠", error: "✗" };

export function formatChecks(checks: Check[]): string {
  return checks.map((c) => `${MARK[c.level]} ${c.title}${c.detail ? `\n    ${c.detail}` : ""}`).join("\n");
}

export function runDoctorCli(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log("사용법: krds-a11y-mcp doctor\n\n현재 폴더의 설치 상태와 검사 환경을 점검한다 (Node, git 루트, MCP 설정 충돌, 킷, 검사 스택).");
    return 0;
  }
  if (argv.length > 0) {
    console.error(`모르는 옵션: ${argv[0]}`);
    return 64;
  }
  const checks = runChecks(process.cwd());
  console.log(`krds-a11y-mcp ${pkg.version} 점검 (${process.cwd()})\n`);
  console.log(formatChecks(checks));
  const bad = checks.filter((c) => c.level !== "ok").length;
  console.log(bad === 0 ? "\n문제 없음" : `\n확인할 항목 ${bad}개`);
  return checks.some((c) => c.level === "error") ? 1 : 0;
}
