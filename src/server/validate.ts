// validate_page 도구의 입력 해석과 실행 — 소비자가 조립·변환한 페이지의 재검사(2층 안전망).
// playwright는 devDependency라 여기서 정적 import하지 않는다 — 호출 시점에 동적 로드하고,
// 없으면 설치 안내를 반환한다 (src/report/index.ts의 격리 원칙).
import { existsSync, mkdirSync, mkdtempSync, renameSync, statSync, writeFileSync } from "node:fs";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listRuns, pruneRuns, readRunStats } from "../runs/index.js";
import { serveLocal } from "./serve-local.js";
import { describeAction } from "../report/page-actions.js";
import type { PageAction } from "../report/types.js";
import { chromeBanner, screenSlug, targetSlug, validateStamp, writeSummary } from "./report-summary.js";

// 나눠 둔 파일의 공개 이름을 여기서도 내보낸다 — 기존 import 경로 호환
export { runInspect, type ElementProbe, type InspectResult } from "./inspect.js";
export { chromeBanner, screenSlug, targetSlug, validateStamp } from "./report-summary.js";

export type ValidateInput = {
  url?: string;
  filePath?: string;
  html?: string;
};

export type ResolvedTarget =
  | { ok: true; url: string; label: string; kind: "url" | "file" | "inline"; note?: string }
  | { ok: false; error: string };

/**
 * url·filePath·html 중 정확히 하나를 검사 대상으로 해석한다.
 * html 문자열은 임시 파일로 쓰는데, 상대 경로 자산이 깨지므로 filePath·url을 권한다.
 */
export function resolveValidateTarget(input: ValidateInput): ResolvedTarget {
  const given = [input.url, input.filePath, input.html].filter(
    (v) => v !== undefined && v !== "",
  );
  if (given.length !== 1) {
    return {
      ok: false,
      error:
        "url · filePath · html 중 정확히 하나만 지정하라. " +
        "빌드 산출물이나 dev 서버가 있으면 url, 로컬 HTML 파일이면 filePath가 정확하다 " +
        "(상대 경로 자산이 그대로 해석된다).",
    };
  }

  if (input.url) {
    if (!/^https?:\/\//.test(input.url)) {
      return { ok: false, error: `url은 http(s)여야 한다: ${input.url}` };
    }
    return { ok: true, url: input.url, label: input.url, kind: "url" };
  }

  if (input.filePath) {
    const abs = isAbsolute(input.filePath) ? input.filePath : resolve(input.filePath);
    // 없는 파일을 검사하면 로컬 서버의 404 응답을 페이지로 검사해 기록이 남고 gate가 그걸 센다 (RC 검증 실측)
    if (!existsSync(abs) || !statSync(abs).isFile()) {
      return { ok: false, error: `검사할 파일이 없다: ${abs} — 경로를 확인하라 (상대 경로는 현재 폴더 기준)` };
    }
    return { ok: true, url: pathToFileURL(abs).href, label: abs, kind: "file" };
  }

  // html 문자열 — 임시 파일 경유. 상대 경로 자산은 임시 디렉터리 기준이 되어 깨진다.
  const dir = mkdtempSync(join(tmpdir(), "krds-a11y-validate-"));
  const file = join(dir, "page.html");
  writeFileSync(file, input.html ?? "");
  return {
    ok: true,
    url: pathToFileURL(file).href,
    label: "(html 문자열)",
    kind: "inline",
    note:
      "html 문자열은 임시 파일로 검사한다 — 상대 경로의 CSS·이미지는 로드되지 않아 " +
      "명도 대비·스타일 판정이 부정확할 수 있다. 정확한 결과는 filePath나 url로 다시 검사하라.",
  };
}

/**
 * 검사 실행 — report 레이어를 동적 로드해 axe 스캔 → KWCAG 번역 → 리포트 md 생성.
 * outDir(기본 reports/)에 리포트 md·원시 json·스크린샷을 남긴다 — 심사 증빙용.
 */
export async function runValidate(
  target: {
    url: string;
    label: string;
    kind?: "url" | "file" | "inline";
    sources?: string[];
    /** 화면 이름 — 기록 폴더를 url 대신 이 이름으로 (상태 변형·호스트 변경에도 이력이 갈라지지 않게) */
    screen?: string;
    /** 검사 전 상호작용 — 상태 화면 검사 */
    actions?: PageAction[];
  },
  outDir = "reports",
  /** 화면별 보존 검사 수 — 첫 회 + 최근 N회만 남긴다 (미지정이면 전부 보존) */
  keepRuns?: number,
): Promise<{
  markdown: string;
  reportPath: string;
  rawPath: string;
  screenshotPath?: string;
  /** 폴드 아래까지 담는 전체 페이지 캡처 */
  fullScreenshotPath?: string;
  violationCount: number;
  /** axe 밖의 품질 신호 — 리소스 404·스크립트 에러 (킷 아이콘 버그처럼 조용히 깨지는 부류) */
  pageIssues: string[];
  /** 킷 관례 위반 — 부품 재발명·킷 스타일 침범 */
  kitIssues: string[];
  /** 같은 화면의 직전 검사 대비 변화 (첫 검사면 undefined) */
  delta?: { prevViolations: number; prevStamp: string };
  /** 화면별 최신 상태 인덱스 파일 */
  summaryPath: string;
  /** 검사 무효 사유 — 있으면 위반 수는 판정이 아니다 */
  invalid?: string;
  /** 사이트 공통부 누락 — 위반 0이어도 gate가 막는다 */
  chromeMissing: boolean;
  /** 보존 개수 초과로 지운 이전 검사 수 */
  prunedRuns: number;
}> {
  // playwright 미설치 환경이면 여기서 import가 던진다 — 호출부가 안내문으로 변환
  const { scanTargets, translate, render } = await import("../report/index.js");

  // 화면별 하위 폴더 — 같은 화면의 검사 이력(md·json·png)이 한 곳에 모인다
  const outRoot = resolve(outDir);
  const dir = join(outRoot, target.screen ? screenSlug(target.screen) : targetSlug(target.label));
  mkdirSync(dir, { recursive: true });

  // 직전 검사 결과 (변화 표시용) — 이번 실행 저장 전에 읽는다
  const prevRuns = listRuns(dir);
  const prev = prevRuns.length > 0 ? readRunStats(prevRuns[prevRuns.length - 1]!) : undefined;

  // file:// 대상은 일회용 로컬 http로 서빙 — CORS 잡음 제거 + 404를 진짜 404로
  let url = target.url;
  let local: { server: Server; origin: string } | undefined;
  if (url.startsWith("file://")) {
    local = await serveLocal();
    url = local.origin + fileURLToPath(url);
  }

  // 기록 이름은 검사 시작 시각 — 검사 도중(키보드·위젯 검사로 수십 초) 고친 파일을 gate가 낡음으로 본다
  const stamp = uniqueStamp(dir, new Date());
  let results;
  try {
    results = await scanTargets(
      [{ id: `validate:${target.label}`, kind: "site", url, ...(target.actions?.length ? { actions: target.actions } : {}) }],
      { ruleSet: "baseline", screenshotDir: dir, kitConventions: true, keyboard: true },
    );
  } finally {
    local?.server.close();
  }

  const report = translate(results);
  const first = results[0];
  const violationCount = report.items.filter((i) => i.grade === "violation").length;

  // 리소스 404·스크립트 에러와 킷 관례 위반을 영속 리포트에도 남긴다 — 도구 응답에만 있으면
  // 세션이 전달을 빼먹을 때 증발하고, 심사 증빙에서 "화면이 깨진 채 위반 0"이 설명되지 않는다
  const extraSections: string[] = [];
  if (first?.status === "ok" && (first.pageIssues?.length ?? 0) > 0) {
    extraSections.push(
      "",
      `## 리소스·스크립트 문제 ${first.pageIssues!.length}건 — KWCAG 위반은 아니나 화면이 조용히 깨진 신호`,
      "",
      ...first.pageIssues!.map((i) => `- ${i}`),
    );
  }
  if (first?.status === "ok" && (first.kitIssues?.length ?? 0) > 0) {
    extraSections.push(
      "",
      `## KRDS 사용 문제 ${first.kitIssues!.length}건 — 부품·스타일을 잘못 쓴 곳 (접근성 보장이 깨질 수 있다)`,
      "",
      ...first.kitIssues!.map((i) => `- ${i}`),
    );
  }
  // 공통부 누락은 접근성 위반이 아니라 리포트 결론은 "위반 0"인데 gate는 막는다 — 맨 앞에 알린다 (RC 검증 실측)
  const banner = first?.status === "ok" ? chromeBanner(first.kitIssues) : undefined;
  const chromeMissing = banner !== undefined;
  // 상태 화면은 무엇을 누른 뒤의 화면인지 증빙에 남긴다
  const stateLine = target.actions?.length ? `> 검사 상태: ${target.actions.map(describeAction).join(" → ")} 뒤의 화면\n\n` : "";
  // 검사 무효(상호작용 실패·킷 미로드 등) — 아래 리포트의 "위반 0"은 판정이 아니다. 결론만 읽고 통과로 오해했다(실사용 2세션)
  const invalid = first?.status === "error" ? first.reason : undefined;
  const invalidLine = invalid
    ? `> **⚠ 검사 무효 — ${invalid}**\n> 아래 리포트의 "위반 0"은 판정 결과가 아니다. gate는 이 화면을 막는다. 원인을 고친 뒤 다시 검사하라.\n\n`
    : "";
  const markdown =
    invalidLine +
    stateLine +
    (banner ? `${banner}\n\n` : "") +
    render(report) +
    (extraSections.length > 0 ? `\n${extraSections.join("\n")}\n` : "");

  const reportPath = join(dir, `${stamp}.md`);
  const rawPath = join(dir, `${stamp}.json`);
  let screenshotPath: string | undefined;
  let fullScreenshotPath: string | undefined;
  if (first?.status === "ok") {
    // 러너가 target.id 기반으로 저장한 파일을 리포트와 같은 이름으로 정리
    if (first.screenshotPath) {
      screenshotPath = join(dir, `${stamp}.png`);
      renameSync(first.screenshotPath, screenshotPath);
    }
    if (first.fullScreenshotPath) {
      fullScreenshotPath = join(dir, `${stamp}.full.png`);
      renameSync(first.fullScreenshotPath, fullScreenshotPath);
    }
  }
  writeFileSync(reportPath, markdown);
  // target을 함께 저장 — gate가 파일 mtime으로 검사 낡음을 판정하는 근거 (구형 기록은 results[0].id에서 복원)
  writeFileSync(
    rawPath,
    JSON.stringify(
      {
        target: {
          label: target.label,
          kind: target.kind ?? "url",
          ...(target.sources?.length ? { sources: target.sources } : {}),
          ...(target.screen ? { screen: target.screen } : {}),
          ...(target.actions?.length ? { actions: target.actions.map(describeAction).join(" → ") } : {}),
        },
        report,
        results,
      },
      null,
      2,
    ),
  );
  const prunedRuns = keepRuns ? pruneRuns(dir, keepRuns).length : 0;
  const summaryPath = writeSummary(outRoot);

  return {
    markdown,
    reportPath,
    rawPath,
    ...(screenshotPath ? { screenshotPath } : {}),
    ...(fullScreenshotPath ? { fullScreenshotPath } : {}),
    violationCount,
    ...(invalid ? { invalid } : {}),
    chromeMissing,
    prunedRuns,
    pageIssues: first?.status === "ok" ? (first.pageIssues ?? []) : [],
    kitIssues: first?.status === "ok" ? (first.kitIssues ?? []) : [],
    ...(prev ? { delta: { prevViolations: prev.violations, prevStamp: prev.stamp } } : {}),
    summaryPath,
  };
}

/** playwright 미설치 시 반환할 안내 */
export const PLAYWRIGHT_GUIDE =
  "validate_page는 실제 브라우저로 렌더된 DOM을 검사한다 — playwright가 필요하다.\n\n" +
  "프로젝트에서 한 번만 설치하면 된다:\n\n" +
  "```sh\npnpm add -D playwright @axe-core/playwright\nnpx playwright install chromium\n```\n\n" +
  "설치 후 같은 호출을 다시 하면 된다.";

/** 같은 밀리초에 시작한 검사가 있으면 1ms씩 밀어 고유한 기록 이름을 만든다 */
function uniqueStamp(dir: string, at: Date): string {
  let t = at.getTime();
  while (existsSync(join(dir, `${validateStamp(new Date(t))}.json`))) t += 1;
  return validateStamp(new Date(t));
}
