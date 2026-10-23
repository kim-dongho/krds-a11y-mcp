// 훅 기준 폴더 — Claude Code는 훅에 CLAUDE_PROJECT_DIR을 준다. 세션이 하위 폴더에서 시작되거나
// 도중에 cwd가 바뀌어도 프로젝트 루트를 기준으로 판정해야 한다 (하위 폴더에서 세션을 시작하면 통과하던 문제 실측).
import { isAbsolute, relative, resolve } from "node:path";

/** 훅 기준 폴더 — CLAUDE_PROJECT_DIR(비어 있지 않으면), 없으면 현재 폴더 */
export function projectRoot(env: NodeJS.ProcessEnv = process.env, cwd: string = process.cwd()): string {
  const dir = env.CLAUDE_PROJECT_DIR?.trim();
  return dir ? resolve(dir) : resolve(cwd);
}

/** p가 root 안(같거나 하위)인지. 상대 경로는 root 기준으로 푼다. /proj와 /proj-other를 구분한다 */
export function isInside(root: string, p: string): boolean {
  const abs = resolve(root, p);
  const rel = relative(resolve(root), abs);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * 훅 기준 폴더 — 입력 JSON의 cwd(Codex는 환경 변수 대신 입력으로 준다) → CLAUDE_PROJECT_DIR(Claude Code)
 * → 현재 폴더. 입력 cwd는 절대 경로 문자열일 때만 믿는다
 */
export function hookRoot(
  payload: unknown,
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const c = (payload as { cwd?: unknown } | null | undefined)?.cwd;
  if (typeof c === "string" && isAbsolute(c)) return resolve(c);
  return projectRoot(env, cwd);
}
