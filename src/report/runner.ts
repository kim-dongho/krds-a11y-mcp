import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser } from "playwright";
import { runKeyboard } from "./keyboard.js";
import { collectKitIssues } from "./kit-issues.js";
import { collectIntrusions } from "./intrusion.js";
import { findInvisibleControls, invisibleIssue } from "./invisible.js";
import { runWidgetKeyboard } from "./widget-keyboard.js";
import { measureContrast, promoteCertainContrastFailures, demoteInactiveContrastViolations } from "./contrast.js";
import { loadTarget } from "./load-target.js";
import { runPageActions } from "./page-actions.js";
import { checkAssetsLoaded, collectPageSignals } from "./page-signals.js";

/**
 * 검사 스택(playwright·axe)을 소비 프로젝트(cwd) 기준으로 해석한다.
 * 서버가 npx 캐시에서 실행되면 자기 위치의 node_modules에는 playwright가 없다 —
 * 소비자는 프로젝트에 설치하므로 cwd를 먼저 보고, 안 되면 자기 위치(개발 저장소)로 폴백.
 */
export function loadBrowserStack(): {
  chromium: typeof import("playwright").chromium;
  AxeBuilder: typeof import("@axe-core/playwright").AxeBuilder;
} {
  const bases = [join(process.cwd(), "package.json"), import.meta.url];
  let lastError: unknown;
  for (const base of bases) {
    try {
      const require = createRequire(base);
      return {
        chromium: (require("playwright") as typeof import("playwright")).chromium,
        AxeBuilder: (require("@axe-core/playwright") as typeof import("@axe-core/playwright"))
          .AxeBuilder,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
export { findMojibake } from "./page-signals.js";

import type {
  AxeFinding,
  Outcome,
  RuleSet,
  ScanResult,
  Target,
} from "./types.js";

// 기본 비활성이지만 baseline에서 켜는 규칙 (번역표 부록 C-1: 6.1.3 검사에 필요)
const OPT_IN_RULES = ["target-size"];
// --experimental에서만 켜는 규칙 (부록 C-2: 오탐 가능성 검토 대상)
const EXPERIMENTAL_RULES = [
  "table-fake-caption",
  "td-has-header",
  "focus-order-semantics",
  "label-content-name-mismatch",
  "identical-links-same-purpose",
];

// kit-demo 모드에서 끄는 페이지 수준 규칙 — 하네스(main/h1/랜드마크 없는 래퍼)의 산물이지
// 컴포넌트 판정이 아니다. 페이지 수준 항목(6.4.1, 6.4.2 문서 제목, 7.1.1)은 site 검사가 담당한다.
const PAGE_LEVEL_RULES = [
  "bypass",
  "region",
  "page-has-heading-one",
  "landmark-one-main",
  "landmark-unique",
  "landmark-banner-is-top-level",
  "landmark-contentinfo-is-top-level",
  "landmark-main-is-top-level",
  "landmark-no-duplicate-banner",
  "landmark-no-duplicate-contentinfo",
  "landmark-no-duplicate-main",
  "document-title",
  "html-has-lang",
  "html-lang-valid",
  "html-xml-lang-mismatch",
];

export type RunnerOptions = {
  ruleSet: RuleSet;
  kitPath?: string; // kit-demo 대상일 때 필수 — 하네스가 킷 CSS/JS를 참조
  timeoutMs?: number;
  screenshotDir?: string; // 주면 대상마다 뷰포트 캡처를 남긴다 (눈 확인용)
  /** 킷 관례 검사 — 비킷 폼 컨트롤·킷 셀렉터를 조작하는 커스텀 CSS 검출 (validate용) */
  kitConventions?: boolean;
  /** 키보드 검사 — 실제 Tab 순회로 초점 가시성·도달성·Tab 순서 (validate용) */
  keyboard?: boolean;
};

function toFindings(axeResults: {
  violations: RawRule[];
  incomplete: RawRule[];
  passes: RawRule[];
  inapplicable: RawRule[];
}): AxeFinding[] {
  const convert = (rules: RawRule[], outcome: Outcome): AxeFinding[] =>
    rules.map((r) => ({
      ruleId: r.id,
      outcome,
      ...(r.impact ? { impact: r.impact } : {}),
      nodes: (r.nodes ?? [])
        .map((n) => {
          const data = n.any?.[0]?.data;
          return {
            // shadow DOM 셀렉터는 중첩 배열 — 문자열화해 평탄하게 기록
            selector: n.target.map((t) => String(t)).join(" "),
            summary: n.failureSummary ?? r.description ?? "",
            ...(data?.messageKey ? { messageKey: data.messageKey } : {}),
            ...(data?.expectedContrastRatio ? { expected: data.expectedContrastRatio } : {}),
          };
        })
        .sort((a, b) => a.selector.localeCompare(b.selector)),
    }));
  return [
    ...convert(axeResults.violations, "violation"),
    ...convert(axeResults.incomplete, "incomplete"),
    ...convert(axeResults.passes, "pass"),
    ...convert(axeResults.inapplicable, "inapplicable"),
  ];
}

type RawRule = {
  id: string;
  impact?: string | null;
  description?: string;
  nodes?: {
    target: unknown[];
    failureSummary?: string;
    any?: { data?: { messageKey?: string; expectedContrastRatio?: string } }[];
  }[];
};

export async function scanTargets(
  targets: Target[],
  opts: RunnerOptions,
): Promise<ScanResult[]> {
  const { chromium, AxeBuilder } = loadBrowserStack();
  const browser: Browser = await chromium.launch();
  // @axe-core/playwright는 명시적 context에서 만든 page를 요구한다
  const context = await browser.newContext();
  const harnessDir = mkdtempSync(join(tmpdir(), "krds-a11y-harness-"));
  const results: ScanResult[] = [];
  const enabledRules = [
    ...OPT_IN_RULES,
    ...(opts.ruleSet === "baseline+experimental" ? EXPERIMENTAL_RULES : []),
  ];
  try {
    for (const target of targets) {
      const scannedAt = new Date().toISOString();
      const page = await context.newPage();
      // axe 밖의 품질 신호 수집 — 리소스 404(아이콘 버그처럼 조용히 깨지는 부류)·스크립트 에러.
      // 수집은 페이지 로드까지만: axe가 CSSOM 재수집을 위해 스타일시트를 다시 fetch할 때
      // @import 경로를 문서 기준으로 해석해 가짜 404를 만든다 — 검사기 부수 요청은 페이지 결함이 아니다
      const pageIssues: string[] = [];
      let collecting = true;
      page.on("response", (res) => {
        if (collecting && res.status() >= 400) pageIssues.push(`리소스 ${res.status()}: ${res.url()}`);
      });
      page.on("requestfailed", (req) => {
        if (!collecting) return;
        const reason = req.failure()?.errorText ?? "실패";
        if (!reason.includes("ERR_ABORTED")) pageIssues.push(`리소스 로드 실패(${reason}): ${req.url()}`);
      });
      page.on("pageerror", (err) => {
        if (collecting) pageIssues.push(`스크립트 에러: ${err.message}`);
      });
      page.on("console", (msg) => {
        if (!collecting || msg.type() !== "error") return;
        // 리소스 실패의 콘솔 중복 보고(CORS 안내·Failed to load)는 response/requestfailed가 담당
        if (/^Access to |^Failed to load resource/.test(msg.text())) return;
        pageIssues.push(`콘솔 에러: ${msg.text()}`);
      });
      try {
        page.setDefaultTimeout(opts.timeoutMs ?? 15_000);
        // tsx(esbuild)가 evaluate 함수에 __name 헬퍼를 주입한다 — 브라우저에 폴리필
        await page.addInitScript("window.__name = (fn) => fn;");
        await loadTarget(page, target, opts, harnessDir);
        // 상태 화면 — 상호작용을 먼저 실행한다. 실패하면 던져 검사 무효로 남긴다(원하는 상태가 아닌 화면을 통과로 세지 않게)
        if (target.actions?.length) await runPageActions(page, target.actions);

        const assetsLoaded = await checkAssetsLoaded(page, target);
        if (!assetsLoaded) {
          results.push({
            target,
            status: "error",
            scannedAt,
            reason: "킷 CSS/JS 미로드 — 스타일·스크립트 없는 DOM 검사는 무효. 킷 CSS 경로가 404인지 확인하라 (리소스 문제 참고)",
          });
          continue;
        }

        pageIssues.push(...(await collectPageSignals(page)));

        collecting = false; // 이후 요청은 axe·실측의 부수 요청 — 페이지 품질 신호가 아니다
        const kitIssues = opts.kitConventions ? await collectKitIssues(page) : undefined;
        // 요소 셀렉터 침투 — 규칙을 지웠다 되돌리므로 axe 전에, 다른 검사가 끼지 않게 바로 이어서
        if (kitIssues) {
          const intrusion = await collectIntrusions(page);
          kitIssues.push(...intrusion.issues);
          if (intrusion.failed) pageIssues.push(intrusion.failed);
        }
        const ruleOverrides: Record<string, { enabled: boolean }> = Object.fromEntries(
          enabledRules.map((r) => [r, { enabled: true }]),
        );
        if (target.kind === "kit-demo") {
          for (const r of PAGE_LEVEL_RULES) ruleOverrides[r] = { enabled: false };
        }
        const axe = await new AxeBuilder({ page })
          .options({ rules: ruleOverrides })
          .analyze();

        // 비활성 요소의 대비 미달은 5.4.3 예외 검토 대상 — 보류로 옮겨 아래에서 함께 실측한다
        let findings = await demoteInactiveContrastViolations(page, toFindings(axe));
        // 보류된 명도 대비는 페이지가 아직 열려 있을 때 실측을 붙인다
        const ccIncomplete = findings.find(
          (f) => f.ruleId === "color-contrast" && f.outcome === "incomplete",
        );
        if (ccIncomplete) {
          const measured = await measureContrast(
            page,
            ccIncomplete.nodes.map((n) => n.selector),
          );
          ccIncomplete.nodes.forEach((n, i) => {
            const m = measured[i];
            if (m) {
              const { inactive, certain, ...rest } = m;
              n.measured = rest;
              if (inactive) n.inactive = true;
              if (certain) n.measuredCertain = true;
            }
          });
        }
        findings = promoteCertainContrastFailures(findings);

        // 키보드 검사 — axe·대비 실측 뒤, 스크린샷 전. Tab이 화면을 스크롤하므로 끝나면 맨 위로 되돌린다
        let keyboardRun: { stops: number; end: "body" | "cycle" | "cap" } | undefined;
        if (opts.keyboard) {
          const kr = await runKeyboard(page);
          findings.push(...kr.findings);
          keyboardRun = { stops: kr.stops, end: kr.end };
          await page.evaluate(() => window.scrollTo(0, 0));
        }

        let screenshotPath: string | undefined;
        let fullScreenshotPath: string | undefined;
        if (opts.screenshotDir) {
          // 촬영 동안 전환·애니메이션을 끈다. 전체 샷은 캡처 중 뷰포트가 바뀌어 미디어쿼리가 잠깐 적용되는데,
          // 킷 전환(0.4초)이 원래대로 돌아오기 전에 찍혀 페이지네이션 순서·고정 목차가 실제와 다르게 남았다.
          // 키보드 검사 뒤 초점 링 잔상도 같은 원인이다 (실측)
          const noMotion = await page.addStyleTag({
            content: "*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}",
          });
          const stem = target.id.replace(/[^a-z0-9_-]/gi, "_");
          // 뷰포트 샷: position:fixed 요소가 정확 (전체 샷은 이걸 왜곡한다)
          screenshotPath = join(opts.screenshotDir, `${stem}.png`);
          await page.screenshot({ path: screenshotPath });
          // 전체 샷: 폴드 아래까지 눈으로 확인하는 용도
          fullScreenshotPath = join(opts.screenshotDir, `${stem}.full.png`);
          const fullPng = await page.screenshot({ path: fullScreenshotPath, fullPage: true });
          // 비가시 렌더 — 같은 그림으로, 전환 효과를 끈 상태에서 판정한다 (validate_page 경로에서만)
          if (opts.kitConventions) {
            const missing = pageIssues.filter((i) => i.startsWith("리소스 404: ")).map((i) => i.slice("리소스 404: ".length));
            pageIssues.push(...(await findInvisibleControls(page, fullPng, missing)).slice(0, 20).map(invisibleIssue));
          }
          await noMotion.evaluate((el) => (el as Element).remove());
        }

        // 동적 위젯 키보드 — 페이지 상태를 바꾸므로 스크린샷·비가시 판정까지 모두 끝난 뒤 맨 마지막에
        if (opts.keyboard) findings.push(...(await runWidgetKeyboard(page)));

        results.push({
          target,
          status: "ok",
          scannedAt,
          engine: {
            axeVersion: axe.testEngine.version,
            ruleSet: opts.ruleSet,
            assetsLoaded,
            ...(keyboardRun ? { keyboard: keyboardRun } : {}),
          },
          findings,
          ...(screenshotPath ? { screenshotPath } : {}),
          ...(fullScreenshotPath ? { fullScreenshotPath } : {}),
          ...(pageIssues.length > 0 ? { pageIssues: [...new Set(pageIssues)] } : {}),
          ...(kitIssues && kitIssues.length > 0 ? { kitIssues } : {}),
        });
      } catch (error) {
        results.push({
          target,
          status: "error",
          scannedAt,
          reason: error instanceof Error ? error.message : String(error),
        });
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    rmSync(harnessDir, { recursive: true, force: true });
  }
  return results;
}
