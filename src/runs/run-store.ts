// 런(검사 기록) 읽기 — reports/<화면>/validate-*.json 을 다루는 fs 전용 모듈.
// validate_page(저장·SUMMARY)와 gate(판정)가 공유한다. playwright·브라우저 의존 없음.
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { basename, join } from "node:path";

/** 킷 관례 검사의 공통부 누락 경고 머리 — runner.ts의 문구와 일치해야 한다. gate가 이것만 골라 차단한다 */
export const CHROME_MISSING = "사이트 공통부 누락";

export type RunStats = {
  violations: number;
  needsReview: number;
  kitIssues: number;
  /** 공통부 누락 — KRDS 사용 문제 중 유일하게 gate가 차단하는 항목 */
  chromeMissing: boolean;
  /** 검사 무효 사유 — 검사 자체가 실패(킷 CSS 미로드 등)했으면 위반 0이어도 통과가 아니다 */
  invalid?: string;
  /** 리소스 404·스크립트 에러 — 위반은 아니지만 화면이 조용히 깨진 신호 */
  pageIssues: number;
  /** 파일명 몸통 — "validate-2026-10-06T10-00-00" */
  stamp: string;
};

export type RunTarget = {
  /** url · 절대 경로 · "(html 문자열)" */
  label: string;
  kind: "url" | "file" | "inline";
  /** url 검사의 소스 폴더(절대 경로) — 있으면 gate가 이 아래 수정 시각으로 낡음을 판정한다 */
  sources?: string[];
  /** 화면 이름(validate_page screen) — 기록 폴더 이름이 된다 */
  screen?: string;
  /** 검사 전에 실행한 상호작용 요약 — "click #open → press Escape" */
  actions?: string;
};

/** 화면 폴더의 런 json 경로를 시각순으로 */
export function listRuns(screenDir: string): string[] {
  try {
    return readdirSync(screenDir)
      .filter((f) => f.startsWith("validate-") && f.endsWith(".json"))
      .sort()
      .map((f) => join(screenDir, f));
  } catch {
    return [];
  }
}

const RUN_FILE_EXTS = [".json", ".md", ".png", ".full.png"];

/**
 * 오래된 검사 기록 정리 — 첫 회(기준 증빙)와 최근 keep회만 남기고 나머지 검사의 md·json·스크린샷을 지운다.
 * 이력 축적이 기본 설계(증빙·직전 대비)지만 한 화면을 42회 검사한 세션에서 폴더 비대 실측. 지운 stamp를 돌려준다
 */
export function pruneRuns(screenDir: string, keep: number): string[] {
  const runs = listRuns(screenDir).map((p) => basename(p, ".json"));
  if (keep < 1 || runs.length <= keep + 1) return [];
  const removed = runs.slice(1, runs.length - keep);
  for (const stamp of removed) {
    for (const ext of RUN_FILE_EXTS) rmSync(join(screenDir, `${stamp}${ext}`), { force: true });
  }
  return removed;
}

/** 보존 개수 — 도구 입력값 → 환경 변수 KRDS_A11Y_KEEP_RUNS → 무제한(undefined) */
export function keepRunsFrom(input: number | undefined, env: NodeJS.ProcessEnv = process.env): number | undefined {
  if (input !== undefined && input >= 1) return Math.floor(input);
  const n = Number(env.KRDS_A11Y_KEEP_RUNS);
  return Number.isInteger(n) && n >= 1 ? n : undefined;
}

/** 저장된 원시 json에서 요약 수치를 읽는다. 파싱 실패 시 undefined */
export function readRunStats(jsonPath: string): RunStats | undefined {
  try {
    const d = JSON.parse(readFileSync(jsonPath, "utf8"));
    const items = d?.report?.items ?? [];
    const first = (d?.results ?? [])[0];
    return {
      violations: items.filter((i: { grade: string }) => i.grade === "violation").length,
      needsReview: items.filter((i: { grade: string }) => i.grade === "needs-review").length,
      kitIssues: first?.kitIssues?.length ?? 0,
      chromeMissing: (first?.kitIssues ?? []).some(
        (i: unknown) => typeof i === "string" && i.startsWith(CHROME_MISSING),
      ),
      pageIssues: first?.pageIssues?.length ?? 0,
      ...(first?.status === "error" ? { invalid: String(first.reason ?? "검사 실패") } : {}),
      stamp: basename(jsonPath, ".json"),
    };
  } catch {
    return undefined;
  }
}

/** label → kind 복원 (target 필드가 없는 구형 기록용) */
function kindOf(label: string): RunTarget["kind"] {
  if (/^https?:\/\//.test(label)) return "url";
  if (label === "(html 문자열)") return "inline";
  return "file";
}

/**
 * 런 json에서 검사 대상을 읽는다.
 * 신규 기록의 target 필드를 우선 쓰고, 없으면 results[0].id("validate:<label>")에서 복원한다.
 */
export function readRunTarget(jsonPath: string): RunTarget | undefined {
  try {
    const d = JSON.parse(readFileSync(jsonPath, "utf8"));
    const t = d?.target;
    if (t?.label && (t.kind === "url" || t.kind === "file" || t.kind === "inline")) {
      const sources = Array.isArray(t.sources) ? t.sources.filter((x: unknown): x is string => typeof x === "string") : [];
      return {
        label: t.label,
        kind: t.kind,
        ...(sources.length > 0 ? { sources } : {}),
        ...(typeof t.screen === "string" ? { screen: t.screen } : {}),
        ...(typeof t.actions === "string" ? { actions: t.actions } : {}),
      };
    }
    const id: unknown = (d?.results ?? [])[0]?.id;
    if (typeof id === "string" && id.startsWith("validate:")) {
      const label = id.slice("validate:".length);
      return { label, kind: kindOf(label) };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * "validate-2026-10-06T10-00-00-123" → Date (로컬 시각 아님 — 저장이 toISOString 기반이라 UTC).
 * 밀리초가 없는 구형 기록도 읽는다. 형식이 어긋나면 undefined
 */
export function stampToDate(stamp: string): Date | undefined {
  const m = stamp.match(/^validate-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})(?:-(\d{3}))?$/);
  if (!m) return undefined;
  const d = new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5] ?? "000"}Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
