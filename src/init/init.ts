// init — 소비 프로젝트에 설정 파일과 검사 강제 장치를 일괄 설치한다.
// 원칙: 멱등(재실행해도 중복 없음) + 기존 설정 보존(JSON은 파싱해 우리 항목만 추가,
// 파싱 실패 파일은 덮어쓰지 않고 건너뛰며 알린다).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import pkg from "../../package.json";

const PKG_NAME = pkg.name;

export type InitAction = "created" | "updated" | "unchanged" | "skipped";
export type InitItem = { path: string; action: InitAction; note?: string };

function readJson(path: string): { ok: true; data: Record<string, unknown> } | { ok: false } {
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    return data && typeof data === "object" && !Array.isArray(data)
      ? { ok: true, data }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

/** .mcp.json — mcpServers에 krds-a11y 추가 (다른 서버 보존) */
function initMcpJson(cwd: string): InitItem {
  const path = join(cwd, ".mcp.json");
  const entry = { command: "npx", args: ["-y", PKG_NAME] };
  if (!existsSync(path)) {
    writeJson(path, { mcpServers: { "krds-a11y": entry } });
    return { path: ".mcp.json", action: "created" };
  }
  const parsed = readJson(path);
  if (!parsed.ok) {
    return { path: ".mcp.json", action: "skipped", note: "JSON 파싱 실패 — 직접 krds-a11y 서버를 추가하라" };
  }
  const servers = (parsed.data.mcpServers ??= {}) as Record<string, unknown>;
  if (servers["krds-a11y"]) {
    return { path: ".mcp.json", action: "unchanged", note: "krds-a11y 서버가 이미 등록돼 있다" };
  }
  servers["krds-a11y"] = entry;
  writeJson(path, parsed.data);
  return { path: ".mcp.json", action: "updated" };
}

const STOP_ENTRY = {
  hooks: [{ type: "command", command: `npx -y ${PKG_NAME} stop-hook` }],
};
const pretoolEntry = (matcher: string) => ({
  matcher,
  hooks: [{ type: "command", command: `npx -y ${PKG_NAME} pretool-hook` }],
});

/**
 * 훅 파일에 Stop·PreToolUse 훅 추가 (기존 훅 보존). Claude Code(.claude/settings.json)와
 * Codex(.codex/hooks.json)는 hooks 구조가 같아 같은 함수로 쓴다 — 다른 것은 PreToolUse 대상뿐
 * (Codex의 파일 쓰기는 apply_patch).
 * 주의: 훅 command에 stderr 리다이렉트(2>)를 쓰면 차단 사유가 모델에 전달되지 않는다 — 실측 확인.
 */
function initHooksFile(cwd: string, rel: string, pretoolMatcher: string): InitItem {
  const path = join(cwd, ...rel.split("/"));
  if (!existsSync(path)) {
    writeJson(path, { hooks: { Stop: [STOP_ENTRY], PreToolUse: [pretoolEntry(pretoolMatcher)] } });
    return { path: rel, action: "created" };
  }
  const parsed = readJson(path);
  if (!parsed.ok) {
    return { path: rel, action: "skipped", note: "JSON 파싱 실패 — 직접 stop-hook·pretool-hook을 등록하라" };
  }
  const hooks = (parsed.data.hooks ??= {}) as Record<string, unknown[]>;
  // 등록 여부는 서브커맨드 이름으로 본다 — 버전 고정(krds-a11y-mcp@x.y.z stop-hook)이나
  // 로컬 경로(node …/dist/index.js stop-hook)로 등록돼 있으면 패키지명 문자열이 달라 중복 등록되던 문제
  // (RC 검증 실측. Stop 훅이 둘이면 재시도 카운터가 두 번 올라 상한이 사실상 절반이 된다)
  const has = (event: string, sub: string): boolean =>
    (hooks[event] ?? []).some((entry) =>
      JSON.stringify(entry).match(new RegExp(`(krds-a11y|index\\.js)[^"]*\\s${sub}(\\s|")`)),
    );

  let changed = false;
  if (!has("Stop", "stop-hook")) {
    (hooks.Stop ??= []).push(STOP_ENTRY);
    changed = true;
  }
  if (!has("PreToolUse", "pretool-hook")) {
    (hooks.PreToolUse ??= []).push(pretoolEntry(pretoolMatcher));
    changed = true;
  }
  if (!changed) return { path: rel, action: "unchanged", note: "훅이 이미 등록돼 있다" };
  writeJson(path, parsed.data);
  return { path: rel, action: "updated" };
}

/**
 * .codex/config.toml — Codex MCP 서버 등록. TOML 파서 없이 표 단위로 덧붙인다: 등록이 이미 있으면
 * (표·따옴표·점 표기) 건드리지 않고, 없으면 끝에 표를 붙인다. TOML은 표 순서와 무관해 기존 내용을
 * 깨지 않는다 — 같은 표의 중복 정의만 피하면 된다
 */
function initCodexConfig(cwd: string): InitItem {
  const rel = ".codex/config.toml";
  const path = join(cwd, ".codex", "config.toml");
  const block = `[mcp_servers.krds-a11y]\ncommand = "npx"\nargs = ["-y", "${PKG_NAME}"]\n`;
  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, block);
    return { path: rel, action: "created" };
  }
  const body = readFileSync(path, "utf8");
  const registered =
    /^\s*\[\s*mcp_servers\.(krds-a11y|"krds-a11y")\s*\]/m.test(body) ||
    /^\s*mcp_servers\.(krds-a11y|"krds-a11y")\./m.test(body);
  if (registered) return { path: rel, action: "unchanged", note: "krds-a11y 서버가 이미 등록돼 있다" };
  writeFileSync(path, body.replace(/\n*$/, "\n\n") + block);
  return { path: rel, action: "updated" };
}

const MARK_BEGIN = "<!-- krds-a11y:begin -->";
const MARK_END = "<!-- krds-a11y:end -->";

const INSTRUCTIONS_BLOCK = [
  MARK_BEGIN,
  "## KRDS + 접근성 (krds-a11y MCP)",
  "",
  "- KRDS 페이지·컴포넌트는 직접 마크업하지 않는다 — 페이지는 get_page_scaffold, 부품은 get_component",
  "- 필수 입력(레이블·alt·페이지 제목)은 임의로 채우지 말고 사용자에게 실제 값을 묻는다",
  "- 접근성 검사는 validate_page, 색·배치·폰트 확인은 inspect_page — 자체 검사 스크립트를 만들지 않는다 (훅이 차단한다)",
  "- 킷 원본(node_modules/krds-uiux)을 수정하지 않는다 — 교정은 get_icon_fix_css와 자기 CSS 파일로",
  "- 작업을 끝내기 전에 validate_page로 재검사한다 — 위반이 남으면 Stop 훅이 종료를 차단한다",
  "- 검사 상태는 `npx krds-a11y-mcp gate`로 확인한다 (Claude Code·Codex 공통 — 훅이 같은 판정을 쓴다)",
  "- 세부 규칙은 MCP 연결 시 서버가 자동 전달한다 (이 블록은 MCP 미연결 도구용 보강)",
  MARK_END,
].join("\n");

/** CLAUDE.md·AGENTS.md — 마커 구간만 소유 (있으면 교체, 없으면 append — 사용자 내용 보존) */
function initInstructionFile(cwd: string, name: string): InitItem {
  const path = join(cwd, name);
  if (!existsSync(path)) {
    writeFileSync(path, INSTRUCTIONS_BLOCK + "\n");
    return { path: name, action: "created" };
  }
  const body = readFileSync(path, "utf8");
  const begin = body.indexOf(MARK_BEGIN);
  const end = body.indexOf(MARK_END);
  if (begin !== -1 && end !== -1 && end > begin) {
    const next = body.slice(0, begin) + INSTRUCTIONS_BLOCK + body.slice(end + MARK_END.length);
    if (next === body) return { path: name, action: "unchanged", note: "지시문이 최신이다" };
    writeFileSync(path, next);
    return { path: name, action: "updated", note: "마커 구간 갱신" };
  }
  writeFileSync(path, body.replace(/\n?$/, "\n\n") + INSTRUCTIONS_BLOCK + "\n");
  return { path: name, action: "updated", note: "지시문 블록 추가 (기존 내용 보존)" };
}

/** 전체 설치 — 항목별 결과를 반환한다. 실패해도 던지지 않고 skipped로 표기 */
export function runInit(cwd: string): InitItem[] {
  return [
    initMcpJson(cwd),
    initHooksFile(cwd, ".claude/settings.json", "Write|Edit|MultiEdit"),
    initInstructionFile(cwd, "CLAUDE.md"),
    initInstructionFile(cwd, "AGENTS.md"),
    // Codex — Claude Code 항목 뒤에 붙인다 (결과 순서를 쓰는 기존 사용처 보호)
    initCodexConfig(cwd),
    initHooksFile(cwd, ".codex/hooks.json", "apply_patch|Edit|Write"),
  ];
}

export const INIT_USAGE = [
  "사용법: krds-a11y-mcp init",
  "",
  "현재 폴더(프로젝트 루트에서 실행)에 설정 파일과 검사 강제 장치를 일괄 설치한다:",
  "  .mcp.json               MCP 서버 등록 (도구 9종 + 자동 주입 사용 규칙)",
  "  .claude/settings.json   Stop 훅(위반 시 종료 차단) + PreToolUse 훅(금지 행동 차단)",
  "  CLAUDE.md · AGENTS.md   사용 규칙 지시문 (Codex 등 타 AI 도구 호환)",
  "  .codex/config.toml      Codex MCP 서버 등록",
  "  .codex/hooks.json       Codex Stop 훅 + PreToolUse 훅 (Claude Code와 같은 차단)",
  "",
  "기존 파일은 보존하고 우리 항목만 추가한다. 재실행해도 중복되지 않는다.",
].join("\n");

const ACTION_KO: Record<InitAction, string> = {
  created: "생성",
  updated: "추가",
  unchanged: "이미 있음",
  skipped: "건너뜀",
};

export function runInitCli(argv: string[]): number {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(INIT_USAGE);
    return 0;
  }
  if (argv.length > 0) {
    console.error(`모르는 옵션: ${argv[0]}\n\n${INIT_USAGE}`);
    return 64;
  }
  const items = runInit(process.cwd());
  console.log("krds-a11y 설치 결과\n");
  for (const i of items) {
    console.log(`- ${i.path}: ${ACTION_KO[i.action]}${i.note ? ` (${i.note})` : ""}`);
  }
  const skipped = items.filter((i) => i.action === "skipped");
  console.log(
    [
      "",
      "다음 단계:",
      "1. 검사 도구(validate_page·inspect_page)까지 쓰려면 한 번만:",
      "   pnpm add -D playwright @axe-core/playwright && npx playwright install chromium",
      "2. Claude Code를 재시작하면 MCP 서버와 훅이 적용된다",
      "3. Codex를 쓴다면 처음 한 번: 이 프로젝트를 신뢰(trust)하고, Codex에서 /hooks로 krds-a11y 훅 2개를 승인하라.",
      "   승인 전에는 훅이 돌지 않는다. 훅 내용이 바뀌면(init 재실행으로 갱신 등) 다시 승인해야 한다.",
      ...(skipped.length > 0
        ? ["", `⚠️ 건너뛴 파일 ${skipped.length}개는 손으로 반영해야 한다 (위 표기 참조)`]
        : []),
    ].join("\n"),
  );
  return skipped.length > 0 ? 1 : 0;
}
