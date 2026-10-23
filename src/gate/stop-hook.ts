// Claude Code Stop 훅 — AI가 작업을 끝내려 할 때 gate를 판정해 위반이 남으면 종료를 차단한다.
// 계약(claude -p 실검증, 2026-10-06): exit 2 + stderr = 차단(메시지가 모델에게 교정 지시로 전달), exit 0 = 허용.
// stop_hook_active로 풀어주지 않는다 — 모델이 "고치겠다"고 말만 하고 빠져나간 실측이 있다.
// 무한 루프 방지는 재시도 상한으로 한다: 게이트가 초록이 될 때까지 차단하되, 상한 초과 시
// "자동 교정 실패"를 남기고 통과시킨다 (사람 확인으로 전환).
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { hookRoot, projectRoot } from "./project-root.js";
import { judge } from "./judge.js";

export type StopHookArgs = {
  dir: string;
  maxRetries: number;
};

export const STOP_HOOK_USAGE = [
  "사용법: krds-a11y-mcp stop-hook [--dir <경로>] [--max-retries <N>]",
  "",
  "Claude Code Stop 훅용. gate를 판정해 위반·낡음이 남으면 작업 종료를 차단한다 (exit 2).",
  "재시도 상한(기본 5회)을 넘으면 자동 교정 실패로 보고 통과시키고, 그 세션에서는 다시 막지 않는다.",
  "환경 변수 KRDS_A11Y_GATE=off면 판정하지 않고 통과시킨다 (위반을 일부러 남겨 둔 작업 등).",
  "",
  ".claude/settings.json 등록 예:",
  '  { "hooks": { "Stop": [ { "hooks": [ { "type": "command",',
  '    "command": "npx -y krds-a11y-mcp stop-hook" } ] } ] } }',
].join("\n");

export function parseStopHookArgs(argv: string[]): StopHookArgs | { error: string } {
  const args: StopHookArgs = { dir: "reports", maxRetries: 5 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--dir" || a === "--max-retries") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) return { error: `${a} 에는 값이 필요하다` };
      if (a === "--dir") args.dir = v;
      else {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1) return { error: `--max-retries 는 1 이상의 정수: ${v}` };
        args.maxRetries = n;
      }
    } else if (a === "--help" || a === "-h") return { error: "" };
    else return { error: `모르는 옵션: ${a}` };
  }
  return args;
}

/** 재시도 카운터 — reports 옆이 아니라 안에 둔다 (gate 소유 상태, 검사 기록과 수명이 같다) */
function counterPath(dir: string): string {
  return join(resolve(dir), ".stop-hook-retries");
}

/**
 * 카운터 상태 — 세션 id가 있으면 세션 단위로 센다. 세션을 몰라 하나로 세던 때는 상한을 넘겨 풀어 준 뒤에도
 * 다음 턴(단순 질문 포함)마다 다시 5번씩 막았고, 지난 세션의 횟수가 이어졌다
 */
type CounterState = { n: number; session?: string; released?: boolean };

function readCounter(path: string): CounterState {
  let raw: string;
  try {
    raw = readFileSync(path, "utf8").trim();
  } catch {
    return { n: 0 };
  }
  const n = Number(raw);
  if (Number.isInteger(n) && n >= 0) return { n }; // 세션 없는 형식(숫자 하나)
  try {
    const d = JSON.parse(raw) as CounterState;
    return Number.isInteger(d.n) && d.n >= 0 ? d : { n: 0 };
  } catch {
    return { n: 0 };
  }
}

function writeCounter(path: string, state: CounterState): void {
  if (!existsSync(dirname(path))) mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, state.session ? JSON.stringify(state) : String(state.n));
}

/**
 * Stop 훅 본체 — 종료 코드를 반환한다 (0 허용 / 2 차단). process.exit는 진입점 책임.
 * stderr 출력은 주입 가능 (테스트에서 수집).
 */
export function runStopHook(
  args: StopHookArgs,
  errLine: (s: string) => void = (s) => console.error(s),
  root: string = projectRoot(),
  session?: string,
  env: NodeJS.ProcessEnv = process.env,
): 0 | 2 {
  // 사용자가 일부러 끈 경우 — 위반을 남겨 둔 채 다른 작업을 하는 세션
  if (env.KRDS_A11Y_GATE?.trim().toLowerCase() === "off") return 0;
  // 상대 경로는 프로젝트 루트 기준 — 세션이 하위 폴더에서 돌아도 같은 reports를 본다 (실측)
  const dir = resolve(root, args.dir);
  const result = judge({ dir });
  const counter = counterPath(dir);

  // 검사 기록이 하나도 없으면 차단하지 않는다 — 페이지 작업이 없던 세션(문서 수정 등)까지
  // 영원히 막는 오탐이 된다. "만들고 검사 안 함"의 강제는 지시문 + (향후) PreToolUse 추적의 몫
  if (result.screens.length === 0) {
    rmSync(counter, { force: true });
    return 0;
  }

  if (result.exitCode === 0) {
    rmSync(counter, { force: true });
    return 0;
  }

  let state = readCounter(counter);
  if (session && state.session !== session) state = { n: 0, session }; // 새 세션은 처음부터 센다
  if (session && state.released) return 0; // 이 세션은 이미 사람 확인으로 넘겼다
  const n = state.n + 1;
  if (n > args.maxRetries) {
    if (session) writeCounter(counter, { n, session, released: true });
    else rmSync(counter, { force: true });
    errLine(
      `접근성 게이트 차단 ${args.maxRetries}회 초과 — 자동 교정 실패로 보고 종료를 허용한다` +
        (session ? "(이 세션에서는 다시 막지 않는다)" : "") +
        `. 남은 문제는 사람이 확인하라: ${result.reason}`,
    );
    return 0;
  }
  writeCounter(counter, { n, ...(session ? { session } : {}) });

  errLine(
    [
      `접근성 게이트: ${result.reason}`,
      // 공통부 누락만 있으면 "위반을 교정하라"는 상황과 맞지 않는다 — 아래 기본 규칙 문장이 지시를 맡는다
      ...(result.exitCode === 1 && result.screens.some((sc) => sc.violations > 0)
        ? ["작업을 끝내기 전에 위반을 교정하고 validate_page로 재검사하라. 위반 0이 되면 종료가 허용된다."]
        : result.exitCode === 2
          ? ["작업을 끝내기 전에 validate_page로 재검사하라. 검사가 최신이고 위반 0이면 종료가 허용된다."]
          : []),
      // 질문하려고 턴을 끝내는 것도 이 훅에 막힌다 — 사람 판단이 필요한 차단에는 기본 규칙을 준다
      ...(result.screens.some((sc) => sc.chromeMissing)
        ? [
            "공통부 누락은 질문하지 말고 기본 규칙으로 처리하라: 완성 페이지로 보고 get_page_scaffold의 " +
              "withSiteChrome: true로 공통부를 넣는다. 팝업·인쇄용처럼 일부러 뺀 페이지가 분명할 때만 " +
              'body에 data-krds-a11y="no-chrome"을 붙인다.',
          ]
        : []),
      `(차단 ${n}/${args.maxRetries} — 상한을 넘으면 사람 확인으로 전환된다)`,
    ].join(" "),
  );
  return 2;
}

/** stdin(Stop 이벤트 JSON)을 소비하고 훅을 실행한다. 입력 내용에 의존하지 않는다 — 판정은 gate가 전부 */
export async function runStopHookCli(argv: string[]): Promise<number> {
  const parsed = parseStopHookArgs(argv);
  if ("error" in parsed) {
    if (parsed.error) console.error(`${parsed.error}\n`);
    console.error(STOP_HOOK_USAGE);
    return parsed.error ? 64 : 0;
  }
  // 훅 입력(stdin JSON)을 읽는다 — Codex는 프로젝트 루트를 환경 변수가 아니라 입력의 cwd로 준다.
  // 터미널 직접 실행이면 건너뛴다. 입력이 깨져도 판정은 gate가 하므로 기준 폴더만 기본값으로 간다
  let payload: unknown;
  if (!process.stdin.isTTY) {
    let raw = "";
    try {
      for await (const chunk of process.stdin) raw += chunk;
      payload = JSON.parse(raw);
    } catch {
      payload = undefined;
    }
  }
  const session = (payload as { session_id?: unknown } | undefined)?.session_id;
  return runStopHook(parsed, undefined, hookRoot(payload), typeof session === "string" && session ? session : undefined);
}
