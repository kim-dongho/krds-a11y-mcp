// Claude Code PreToolUse 훅 — 도구 호출 전에 입력을 검사해 금지 행동을 차단한다.
// 계약: stdin으로 {tool_name, tool_input} JSON, exit 2 + stderr = 호출 차단(메시지가 모델에게 전달), exit 0 = 허용.
// 차단 대상은 실사용 테스트에서 실측된 두 행동이다:
//   1. 프로젝트 폴더에 임시 검사 스크립트 생성 (.axe-check.mjs, .fix-icon-path.mjs, .inspect*.mjs ...)
//      → validate_page·inspect_page·get_icon_fix_css가 대체한다. 지시문(확률)으로 막던 것을 코드(결정)로 승격
//   2. 킷 원본(node_modules/krds-uiux) 수정 — 재설치로 증발하고 보증 근거가 깨진다
import { basename } from "node:path";
import { resolve } from "node:path";
import { hookRoot, isInside, projectRoot } from "./project-root.js";

/** 파일 쓰기 계열 도구만 본다 — settings matcher와 이중 안전망 */
const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

// 숨김 점 접두 + 검사·교정 냄새 이름 + 스크립트 확장자.
// .eslintrc.js 같은 정상 설정 파일을 오탐하지 않게 이름 패턴을 좁게 잡는다
const TEMP_SCRIPT = /^\.(axe|a11y|wcag|kwcag|contrast|inspect|probe|scan|screenshot|fix)[\w-]*\.(mjs|cjs|js|ts)$/i;

// 점 접두가 없어도 접근성 검사 어휘가 이름에 토큰으로 들어간 스크립트는 DIY 검사다
// (a11y-scan.mjs, scan-axe.js — JSP 감사에서 통과가 실측됨). 토큰 경계를 강제해
// taxes.js(axe 부분 문자열) 같은 오탐을 막고, fix·scan 같은 범용 단어는 여기 넣지 않는다
const A11Y_WORD = /(^|[^a-z0-9])(axe|a11y|wcag|kwcag|contrast)([^a-z0-9]|$)/i;
const SCRIPT_EXT = /\.(mjs|cjs|js|ts)$/i;

export type PretoolVerdict = { allow: true } | { allow: false; reason: string };

/** 판정만 한다 — stdin·exit 없음 (테스트가 직접 부른다) */
export function judgeToolUse(
  toolName: string,
  filePath: string | undefined,
  root: string = projectRoot(),
): PretoolVerdict {
  if (!WRITE_TOOLS.has(toolName) || !filePath) return { allow: true };

  const normalized = filePath.replace(/\\/g, "/");
  if (/node_modules\/krds-uiux\//.test(normalized)) {
    return {
      allow: false,
      reason:
        "킷 원본(node_modules/krds-uiux) 수정 금지 — 재설치하면 증발하고 접근성 보증 근거가 깨진다. " +
        "아이콘 경로 버그는 get_icon_fix_css로 교정 CSS를 받아 별도 파일" +
        '(data-krds-a11y="corrections")로 저장하고, 그 외 덮어쓰기는 자기 CSS 파일에서 하라.',
    };
  }

  // 문서루트로 복사된 킷(JSP webapp/krds-uiux 등)도 원본이다 — 복사본 수정은 영속하면서
  // npm 킷과 조용히 어긋난다 (JSP 감사에서 무보호 실측). 킷 고유 트리(resources/)로 식별해
  // 사용자가 우연히 krds-uiux라는 이름을 쓴 자기 폴더와 구분한다
  if (/krds-uiux\/resources\//.test(normalized)) {
    return {
      allow: false,
      reason:
        "서빙용으로 복사된 킷(krds-uiux/resources/) 수정 금지 — 수정분이 npm 킷과 조용히 어긋나 " +
        "접근성 보증 근거가 깨진다. 교정은 get_icon_fix_css와 자기 CSS 파일" +
        '(data-krds-a11y="corrections")로 하고, 킷 갱신 시에는 npm 설치본을 다시 복사하라.',
    };
  }

  const name = basename(filePath);
  // 임시 검사 스크립트는 프로젝트 폴더 안만 막는다 — 차단 문구가 "시스템 임시 디렉터리에 만들라"고
  // 권하는데 그 경로까지 막던 모순 수정 (실측). 킷 원본·복사본 보호는 위치와 무관하다 (위)
  const isTempScript = TEMP_SCRIPT.test(name) || (SCRIPT_EXT.test(name) && A11Y_WORD.test(name));
  if (isTempScript && isInside(root, filePath)) {
    return {
      allow: false,
      reason:
        `임시 검사 스크립트(${basename(filePath)})를 프로젝트 폴더에 만들지 마라 — ` +
        "접근성 검사는 validate_page, 색·배치·폰트 확인은 inspect_page, " +
        "아이콘 교정은 get_icon_fix_css 도구가 한다. " +
        "정말 일회용 스크립트가 필요하면 시스템 임시 디렉터리에 만들고 끝나면 지워라.",
    };
  }

  return { allow: true };
}

/**
 * Codex apply_patch 본문에서 대상 파일 경로를 모두 뽑는다. Codex의 파일 쓰기는 apply_patch 하나이고,
 * 경로가 별도 필드가 아니라 패치 머리줄에 들어 있다 (한 번에 여러 파일 가능)
 */
export function extractPatchPaths(patch: string): string[] {
  const out: string[] = [];
  for (const m of patch.matchAll(/^\*\*\* (?:(?:Add|Update|Delete) File|Move to): (.+?)\s*$/gm)) out.push(m[1]!);
  return out;
}

/** 훅 입력 하나를 판정한다 — Claude Code(Write·Edit, file_path)와 Codex(apply_patch, 패치 본문) 입력을 모두 받는다 */
export function judgeHookInput(
  payload: unknown,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): PretoolVerdict {
  const d = payload as { tool_name?: unknown; tool_input?: Record<string, unknown> } | null | undefined;
  const toolName = typeof d?.tool_name === "string" ? d.tool_name : "";
  const root = hookRoot(payload, env, cwd);
  const patch = d?.tool_input?.command;
  if (toolName === "apply_patch" && typeof patch === "string") {
    for (const p of extractPatchPaths(patch)) {
      const v = judgeToolUse("Write", resolve(root, p), root);
      if (!v.allow) return v; // 하나라도 금지면 패치 전체를 막는다
    }
    return { allow: true };
  }
  const p = d?.tool_input?.file_path ?? d?.tool_input?.notebook_path;
  return judgeToolUse(toolName, typeof p === "string" ? p : undefined, root);
}

export const PRETOOL_HOOK_USAGE = [
  "사용법: krds-a11y-mcp pretool-hook",
  "",
  "Claude Code PreToolUse 훅용. stdin의 도구 호출(JSON)을 검사해 금지 행동을 차단한다 (exit 2).",
  "차단: 프로젝트 폴더의 임시 검사 스크립트 생성, 킷 원본(node_modules/krds-uiux) 수정.",
  "",
  ".claude/settings.json 등록 예:",
  '  { "hooks": { "PreToolUse": [ { "matcher": "Write|Edit|MultiEdit",',
  '    "hooks": [ { "type": "command", "command": "npx -y krds-a11y-mcp pretool-hook" } ] } ] } }',
].join("\n");

/** stdin을 읽어 판정한다. 입력이 없거나 JSON이 아니면 허용 (훅 오류로 정상 작업을 막지 않는다) */
export async function runPretoolHookCli(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.error(PRETOOL_HOOK_USAGE);
    return 0;
  }
  if (argv.length > 0) {
    console.error(`모르는 옵션: ${argv[0]}\n\n${PRETOOL_HOOK_USAGE}`);
    return 64;
  }

  let raw = "";
  if (!process.stdin.isTTY) {
    try {
      for await (const chunk of process.stdin) raw += chunk;
    } catch {
      return 0;
    }
  }

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return 0;
  }

  const verdict = judgeHookInput(payload);
  if (verdict.allow) return 0;
  console.error(verdict.reason);
  return 2;
}
