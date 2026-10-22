// gate 판정 로직 — 출력·process.exit 없음 (테스트가 직접 부른다).
// 판정 로직의 단일 소유자: Stop 훅과 향후 CI가 이 판정 위에 올라간다.
import { existsSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { listRuns, readRunStats, readRunTarget, stampToDate } from "../runs/index.js";

export type Staleness = "fresh" | "stale" | "unknown";

export type ScreenVerdict = {
  slug: string;
  /** 최신 런 시각 — "validate-2026-10-06T10-00-00" */
  stamp: string;
  violations: number;
  needsReview: number;
  kitIssues: number;
  /** 리소스 404·스크립트 에러 — 차단하지 않는다 (기존 깨짐이 있는 사이트를 영원히 막는 오탐 방지), 표기만 */
  pageIssues: number;
  /** 사이트 공통부 누락 — 위반은 아니지만 gate가 차단하는 유일한 KRDS 사용 문제 */
  chromeMissing: boolean;
  /** 검사 무효 사유 (킷 CSS 미로드 등) — 위반 0이어도 통과가 아니라 재검사 대상 */
  invalid?: string;
  staleness: Staleness;
  /** 런 json 파싱 실패 등 기록 자체가 불량 */
  broken?: true;
};

export type GateResult = {
  screens: ScreenVerdict[];
  exitCode: 0 | 1 | 2;
  /** 결론 한 줄 — Stop 훅이 차단 메시지로 그대로 쓴다 */
  reason: string;
};

/** 소스 변경이 아닌 폴더 — 빌드 산출물·의존성·검사 기록(검사가 직접 쓴다) */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "target", "reports", ".next", "coverage", "out"]);

/**
 * 경로(폴더 또는 파일) 아래 가장 늦은 수정 시각. 제외 폴더는 건너뛴다.
 * 파일이 cap을 넘거나 경로가 없으면 undefined — Stop 훅이 턴마다 부르므로 큰 저장소에서 느려지지 않게
 */
export function latestMtime(paths: string[], cap = 20_000): number | undefined {
  let latest = 0;
  let count = 0;
  const walk = (p: string): boolean => {
    const st = statSync(p);
    if (st.isFile()) {
      if (++count > cap) return false;
      latest = Math.max(latest, st.mtime.getTime());
      return true;
    }
    if (!st.isDirectory()) return true;
    for (const e of readdirSync(p, { withFileTypes: true })) {
      if (e.isDirectory() && SKIP_DIRS.has(e.name)) continue;
      if (!walk(join(p, e.name))) return false;
    }
    return true;
  };
  try {
    for (const p of paths) if (!walk(p)) return undefined;
  } catch {
    return undefined; // 경로가 사라짐
  }
  return count > 0 ? latest : undefined;
}

/** 최신 런 이후 대상이 바뀌었나. file은 그 파일, url은 sourceDir(sources) 아래 수정 시각. 둘 다 없으면 unknown */
function judgeStaleness(jsonPath: string, stamp: string): Staleness {
  const target = readRunTarget(jsonPath);
  const ranAt = stampToDate(stamp);
  if (!target || !ranAt) return "unknown";
  if (target.kind !== "file") {
    if (!target.sources) return "unknown";
    const latest = latestMtime(target.sources);
    return latest === undefined ? "unknown" : latest > ranAt.getTime() ? "stale" : "fresh";
  }
  try {
    // 파일이 삭제됐거나 stat 실패면 stale — 검사 결과가 현재를 대변하지 못한다
    return statSync(target.label).mtime.getTime() > ranAt.getTime() ? "stale" : "fresh";
  } catch {
    return "stale";
  }
}

export function judge(opts?: { dir?: string; only?: string[] }): GateResult {
  const root = resolve(opts?.dir ?? "reports");
  const only = opts?.only ?? [];

  if (!existsSync(root)) {
    return {
      screens: [],
      exitCode: 2,
      reason: `검사 기록이 없다 (${root} 없음) — validate_page부터 실행하라`,
    };
  }

  let slugs: string[];
  try {
    slugs = readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((s) => listRuns(join(root, s)).length > 0)
      .sort();
  } catch {
    slugs = [];
  }

  if (only.length > 0) {
    const missing = only.filter((s) => !slugs.includes(s));
    if (missing.length > 0) {
      return {
        screens: [],
        exitCode: 2,
        reason:
          `지정한 화면이 검사 기록에 없다: ${missing.join(", ")}` +
          (slugs.length > 0 ? ` (있는 화면: ${slugs.join(", ")})` : " (검사 기록 자체가 없다)"),
      };
    }
    slugs = only;
  }

  if (slugs.length === 0) {
    return {
      screens: [],
      exitCode: 2,
      reason: "검사 기록이 없다 — validate_page부터 실행하라",
    };
  }

  const screens: ScreenVerdict[] = slugs.map((slug) => {
    const runs = listRuns(join(root, slug));
    const latest = runs[runs.length - 1]!;
    const stats = readRunStats(latest);
    if (!stats) {
      return {
        slug,
        stamp: basename(latest, ".json"),
        violations: 0,
        needsReview: 0,
        kitIssues: 0,
        pageIssues: 0,
        chromeMissing: false,
        staleness: "unknown",
        broken: true,
      };
    }
    return {
      slug,
      stamp: stats.stamp,
      violations: stats.violations,
      needsReview: stats.needsReview,
      kitIssues: stats.kitIssues,
      pageIssues: stats.pageIssues,
      chromeMissing: stats.chromeMissing,
      ...(stats.invalid ? { invalid: stats.invalid } : {}),
      staleness: judgeStaleness(latest, stats.stamp),
    };
  });

  // 수렴: 위반·공통부 누락(1) > 낡음·불량(2) > 통과(0) — 위반이 더 급한 행동 지시
  const violating = screens.filter((s) => s.violations > 0);
  const chromeless = screens.filter((s) => s.chromeMissing);
  if (violating.length > 0 || chromeless.length > 0) {
    const total = violating.reduce((n, s) => n + s.violations, 0);
    const parts = [
      ...(violating.length > 0
        ? [`${violating.length}개 화면에 위반 ${total}건 잔존 (${violating.map((s) => s.slug).join(", ")})`]
        : []),
      // 헤더 부재는 KWCAG 위반이 아니라 axe가 못 잡는다 — 지침만으로는 실사용 최종본에서도 빠졌다
      ...(chromeless.length > 0
        ? [`사이트 공통부(헤더·푸터) 누락 (${chromeless.map((s) => s.slug).join(", ")}) — withSiteChrome: true로 조립하거나, 의도적 생략이면 data-krds-a11y="no-chrome" 마커`]
        : []),
    ];
    return {
      screens,
      exitCode: 1,
      reason: `${parts.join(" / ")} — 교정 후 validate_page로 재검사하라`,
    };
  }

  const stale = screens.filter((s) => s.staleness === "stale");
  const broken = screens.filter((s) => s.broken);
  // 검사 무효 — 검사 기록은 위반 0이지만 검사 자체가 실패했다 (킷 CSS 미로드 등). 통과로 세면
  // 킷 없는 화면이 gate를 통과한다 (배포판 실사용에서 실측)
  const invalid = screens.filter((s) => s.invalid);
  if (stale.length > 0 || broken.length > 0 || invalid.length > 0) {
    const parts = [
      ...(invalid.length > 0
        ? [`검사 무효: ${invalid.map((s) => `${s.slug}(${s.invalid!.split(" — ")[0]})`).join(", ")}. 결과를 믿을 수 없으니 킷 설치·자산 경로 등 원인부터 고칠 것`]
        : []),
      ...(stale.length > 0
        ? [`검사 후 페이지가 바뀜: ${stale.map((s) => s.slug).join(", ")}`]
        : []),
      ...(broken.length > 0
        ? [`기록 불량(json 파싱 실패): ${broken.map((s) => s.slug).join(", ")}`]
        : []),
    ];
    return {
      screens,
      exitCode: 2,
      reason: `${parts.join(" / ")} — validate_page로 재검사하라`,
    };
  }

  // 통과 사유는 낡음 판정 상태를 정직하게 — "판정 불가" 화면을 "검사 최신"이라고 말하지 않는다
  // (Stop 훅이 이 한 줄을 그대로 쓰므로, 전부 url 검사인 프로젝트에서 거짓 보증이 된다)
  const unknown = screens.filter((s) => s.staleness === "unknown").length;
  const freshNote =
    unknown === 0
      ? "검사 최신"
      : unknown === screens.length
        ? "낡음은 전부 판정 불가 (url·html 검사 — 검사 후 수정 여부는 보증 못 함. url 검사는 validate_page에 sourceDir을 넘기면 판정된다)"
        : `${screens.length - unknown}개 검사 최신, ${unknown}개는 낡음 판정 불가 (url·html 검사 — validate_page에 sourceDir을 넘기면 판정된다)`;
  const pageIssueTotal = screens.reduce((n, s) => n + s.pageIssues, 0);
  const pageIssueNote =
    pageIssueTotal > 0 ? ` (리소스·스크립트 문제 ${pageIssueTotal}건 있음 — 리포트 확인)` : "";
  return {
    screens,
    exitCode: 0,
    reason: `${screens.length}개 화면 전부 위반 0, ${freshNote} — 통과${pageIssueNote}`,
  };
}
