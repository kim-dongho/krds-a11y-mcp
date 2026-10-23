// 검사 도구 — validate_page · inspect_page
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PLAYWRIGHT_GUIDE, resolveValidateTarget, runInspect, runValidate, screenSlug } from "../validate.js";
import { actionError, describeAction } from "../../report/page-actions.js";
import { keepRunsFrom } from "../../runs/index.js";
import { existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { errorText, text } from "./shared.js";

const ONE_OF = "url·filePath·html 중 정확히 하나만 준다";
const URL_RE = /^https?:\/\//i;

export function registerValidatePage(server: McpServer): void {
  // ── 5. 검증: 조립·변환이 끝난 페이지의 재검사 (안전망 — 생성 시점 강제가 못 막은 것을 잡는다)
  server.registerTool(
    "validate_page",
    {
      title: "완성 페이지 KWCAG 재검사",
      description:
        "조립·변환이 끝난 페이지를 실제 브라우저로 열어 KWCAG 2.2 기준으로 재검사한다. " +
        "axe-core 전수 실행을 KWCAG 33항목으로 번역하고, 보류된 명도 대비는 직접 실측하며, " +
        "수동 확인이 필요한 항목은 확인 절차와 함께 명시한다 — 자동 판정은 접근성 이슈의 일부이므로 " +
        "이 도구의 통과가 심사 통과를 뜻하지 않는다. " +
        "템플릿을 프레임워크로 변환한 뒤, 페이지를 조립한 뒤, 콘텐츠를 채운 뒤에 호출하라. " +
        "url(dev 서버·배포본) 또는 filePath(로컬 HTML)를 권장한다 — 상대 경로 자산이 그대로 해석된다. " +
        "파일을 쓴다: outDir(기본 reports/) 아래 화면별 폴더에 리포트(md)·원시 데이터(json)·스크린샷 2장을 남기고 SUMMARY.md를 갱신한다. " +
        "keepRuns를 주면 보존 개수를 넘은 이전 검사 기록을 지운다. 이 기록을 Stop 훅과 gate 명령이 읽어 작업 종료를 판정한다. " +
        "요소 하나의 색·배치·폰트만 확인할 때는 inspect_page를 쓴다. " +
        "반환: 마크다운 — 결론 한 줄(위반 수·검사 무효·공통부 누락), 직전 대비, KRDS 사용 문제, 리소스 오류, 산출물 경로, 리포트 전문.",
      inputSchema: {
        url: z.string().regex(URL_RE, "http:// 또는 https://로 시작해야 한다").optional().describe(`검사할 페이지 URL(http/https) — dev 서버·배포본. ${ONE_OF}`),
        filePath: z.string().optional().describe(`검사할 로컬 HTML 파일 경로 — 상대 경로는 프로젝트 루트(MCP 서버 실행 위치) 기준. ${ONE_OF}`),
        html: z
          .string()
          .optional()
          .describe(`HTML 문자열 — 상대 경로 자산이 깨지므로 최후 수단(임시 파일로 써서 검사한다). ${ONE_OF}`),
        outDir: z
          .string()
          .optional()
          .describe("리포트·스크린샷 저장 디렉터리(기본 reports/, 프로젝트 루트 기준) — 화면별 하위 폴더에 검사 이력이 쌓인다. gate·Stop 훅은 reports/를 읽으니 바꾸지 않는 것을 권장"),
        keepRuns: z
          .number()
          .int()
          .min(1)
          .optional()
          .describe(
            "화면별로 남길 최근 검사 수 — 첫 회(기준 증빙)는 항상 따로 남기므로 결과는 첫 회 + 최근 N회(최대 N+1개)다. 미지정이면 환경 변수 KRDS_A11Y_KEEP_RUNS, 그것도 없으면 전부 보존",
          ),
        sourceDir: z
          .union([z.string(), z.array(z.string())])
          .optional()
          .describe(
            "url(dev 서버·배포본)을 검사할 때 그 화면을 만드는 소스 폴더(프로젝트 루트 기준) — 예: \"src\", [\"src\", \"public\"], JSP는 \"src/main/webapp\". " +
              "넘기면 gate가 검사 뒤 소스가 바뀌었는지(낡음)를 판정해 재검사를 요구한다. 없으면 url 검사의 낡음은 판정 불가",
          ),
        screen: z
          .string()
          .optional()
          .describe(
            "화면 이름 — 검사 기록 폴더 이름이 된다. 같은 화면을 호스트·포트를 바꿔 검사해도 이력이 이어지고, " +
              "상태 화면(actions)은 다른 이름으로 따로 기록하라 — 예: \"apply-form\", \"apply-form-오류\". 없으면 url·파일 이름에서 만든다",
          ),
        actions: z
          .array(
            z.object({
              type: z.enum(["click", "press", "fill", "wait"]).describe("동작 — click·fill은 selector 필요, press는 key, wait는 selector 또는 ms"),
              selector: z.string().optional().describe("대상 CSS 셀렉터 — 예: \"#apply\", \".open-modal\""),
              key: z.string().optional().describe("press의 키 이름(Playwright 표기) — 예: \"Enter\", \"Escape\", \"ArrowRight\""),
              value: z.string().optional().describe("fill로 넣을 값"),
              ms: z.number().int().min(0).max(30000).optional().describe("wait의 대기 시간(밀리초, 최대 30000)"),
            }),
          )
          .max(20)
          .optional()
          .describe(
            "검사 전에 실행할 상호작용(순서대로, 실제 클릭·키 입력) — 모달 열림·탭 전환·오류 표시 같은 상태 화면을 검사할 때. " +
              "click·fill은 selector, fill은 value, press는 key(Enter·Escape·ArrowRight 등, selector를 주면 그 요소에 초점 뒤), " +
              "wait는 selector(보일 때까지) 또는 ms. 예: [{type:\"click\",selector:\"#apply\"},{type:\"wait\",selector:\".form-hint-invalid\"}]. " +
              "한 단계라도 실패하면 검사 무효로 기록돼 gate가 막는다. 임시 빌드로 초기값을 바꾸지 말고 이것을 쓴다",
          ),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async ({ outDir, keepRuns, sourceDir, screen, actions, ...input }) => {
      const resolved = resolveValidateTarget(input);
      if (!resolved.ok) return errorText(resolved.error);
      const badAction = (actions ?? []).map((a, i) => [i, actionError(a)] as const).find(([, e]) => e);
      if (badAction) return errorText(`actions ${badAction[0] + 1}번째: ${badAction[1]} — 고쳐서 다시 호출하라.`);
      // 소스 폴더 — 프로젝트(cwd) 기준, 실제로 있는 경로만 기록한다
      const sources = (sourceDir === undefined ? [] : Array.isArray(sourceDir) ? sourceDir : [sourceDir])
        .map((p) => resolve(process.cwd(), p))
        .filter((p) => existsSync(p));
      const missingSources = (sourceDir === undefined ? [] : Array.isArray(sourceDir) ? sourceDir : [sourceDir]).filter(
        (p) => !existsSync(resolve(process.cwd(), p)),
      );

      let result: Awaited<ReturnType<typeof runValidate>>;
      try {
        result = await runValidate(
          {
            ...resolved,
            ...(sources.length > 0 ? { sources } : {}),
            ...(screen?.trim() ? { screen: screen.trim() } : {}),
            ...(actions?.length ? { actions } : {}),
          },
          outDir ?? "reports",
          keepRunsFrom(keepRuns),
        );
      } catch (error) {
        dropInline(resolved);
        const msg = error instanceof Error ? error.message : String(error);
        if (/Cannot find (module|package)|ERR_MODULE_NOT_FOUND/i.test(msg)) {
          return errorText(PLAYWRIGHT_GUIDE);
        }
        return errorText(
          `검사 실행 실패: ${msg}\n` +
            "url이면 서버가 떠 있는지, filePath면 경로가 맞는지 확인하라. 브라우저가 없다는 오류면 `npx playwright install chromium`을 실행한 뒤 다시 부른다.",
        );
      }

      dropInline(resolved);
      const head = result.invalid
        ? `**검사 무효 — ${result.invalid}** 이 결과는 판정이 아니다(아래 "위반 0"은 검사하지 못했다는 뜻). gate가 이 화면을 막는다 — 원인을 고친 뒤 다시 검사하라.`
        : result.chromeMissing && result.violationCount === 0
          ? "**접근성 위반 0이지만 사이트 공통부(헤더·푸터) 누락으로 gate가 이 화면을 막는다** — 완성 페이지면 withSiteChrome: true로 공통부를 넣고, 일부러 뺀 페이지면 body에 data-krds-a11y=\"no-chrome\"을 붙인 뒤 다시 검사하라."
          : result.violationCount > 0
          ? `**위반 ${result.violationCount}개 항목 — 아래 리포트의 "사람이 볼 것"부터 교정하고 다시 검사하라.**`
          : "자동 판정 범위에서 위반 0. **단 위반 0은 시각 품질 보증이 아니다** — 저장된 전체 스크린샷으로 폴드 아래까지 눈으로 확인해야 완료다. 수동 확인 체크리스트도 사람 몫으로 남는다.";

      const kitLines =
        result.kitIssues.length > 0
          ? [
              "",
              `## KRDS 사용 문제 ${result.kitIssues.length}건 — 부품·스타일을 잘못 쓴 곳 (접근성 보장이 깨질 수 있다)`,
              "",
              ...result.kitIssues.map((i) => `- ${i}`),
              "",
              "부품(입력·버튼·셀렉트)은 get_component로 받고, 입력+버튼 결합은 킷 input-group 패턴을 쓴다. " +
                "커스텀 CSS는 자기 구획의 배치까지만 — 킷 셀렉터를 타겟하지 않는다.",
            ]
          : [];

      const issueLines =
        result.pageIssues.length > 0
          ? [
              "",
              `## 리소스·스크립트 오류 ${result.pageIssues.length}건 (axe 밖 품질 신호)`,
              "",
              ...result.pageIssues.slice(0, 20).map((i) => `- ${i}`),
              ...(result.pageIssues.length > 20
                ? [`- … 외 ${result.pageIssues.length - 20}건`]
                : []),
              ...(result.pageIssues.some((i) => i.includes("img/img"))
                ? [
                    "",
                    "`img/img` 경로 404는 킷 v1.1.0의 알려진 아이콘 경로 버그다 — " +
                      "get_page_scaffold(withSiteChrome: true)가 주입하는 전면 교정 CSS를 쓰거나, " +
                      "get_component 응답의 교정 CSS를 페이지에 포함하라.",
                  ]
                : []),
            ]
          : [];

      return text(
        [
          `# validate_page 결과 — ${resolved.label}`,
          "",
          ...(screen?.trim() ? [`화면: ${screen.trim()} (기록 폴더 ${screenSlug(screen.trim())})`, ""] : []),
          ...(actions?.length ? [`검사 상태: ${actions.map(describeAction).join(" → ")} 뒤의 화면`, ""] : []),
          head,
          ...(result.delta && !result.invalid
            ? [
                "",
                `직전 검사(${result.delta.prevStamp.replace("validate-", "")}) 대비: 위반 ${result.delta.prevViolations} → ${result.violationCount}${
                  result.violationCount < result.delta.prevViolations
                    ? " (개선)"
                    : result.violationCount > result.delta.prevViolations
                      ? " **(악화)**"
                      : ""
                }`,
              ]
            : []),
          ...(resolved.note ? ["", `⚠️ ${resolved.note}`] : []),
          ...kitLines,
          ...issueLines,
          "",
          "저장된 산출물 (심사 증빙용):",
          `- 리포트: ${result.reportPath}`,
          `- 원시 데이터: ${result.rawPath}`,
          ...(result.screenshotPath ? [`- 스크린샷(뷰포트, 고정 요소 정확): ${result.screenshotPath}`] : []),
          ...(result.fullScreenshotPath
            ? [`- 전체 스크린샷(폴드 아래까지 — 반드시 눈으로 확인): ${result.fullScreenshotPath}`]
            : []),
          `- 전체 화면 검사 현황: ${result.summaryPath} (화면별 최신 상태 한눈에)`,
          ...(sources.length > 0 ? [`- 낡음 판정 기준: ${sources.length}개 소스 경로 — 이 아래 파일이 바뀌면 gate가 재검사를 요구한다`] : []),
          ...(missingSources.length > 0 ? [`- 없는 sourceDir(무시함): ${missingSources.join(", ")}`] : []),
          ...(result.prunedRuns > 0 ? [`- 보존 개수를 넘은 이전 검사 ${result.prunedRuns}회분을 정리했다 (첫 회는 남김)`] : []),
          "",
          "---",
          "",
          result.markdown,
        ].join("\n"),
      );
    },
  );
}

export function registerInspectPage(server: McpServer): void {
  // ── 6. 점검: 렌더된 페이지의 시각 상태 조회 (임시 스크립트 대체)
  server.registerTool(
    "inspect_page",
    {
      title: "페이지 시각 상태 점검",
      description:
        "렌더된 페이지에서 요소의 계산 스타일(색·배경·폰트·크기·배치·margin·padding·gap)과 폰트 적용 여부를 읽는다. " +
        "'이 요소가 무슨 색인가', '폰트가 진짜 적용됐나(시스템 폰트 폴백인가)', '어디에 배치됐나'를 " +
        "확인할 때 임시 playwright 스크립트를 만들지 말고 이 도구를 쓴다. 파일을 쓰지 않는다. " +
        "접근성 판정(위반·KWCAG 항목)은 validate_page를 쓴다. " +
        "반환: 마크다운 — 문서 제목, 본문 폰트 적용 여부, 셀렉터마다 배치·색·폰트·간격.",
      inputSchema: {
        url: z.string().regex(URL_RE, "http:// 또는 https://로 시작해야 한다").optional().describe(`점검할 페이지 URL(http/https). ${ONE_OF}`),
        filePath: z.string().optional().describe(`점검할 로컬 HTML 파일 경로(프로젝트 루트 기준). ${ONE_OF}`),
        html: z.string().optional().describe(`HTML 문자열 — 최후 수단. ${ONE_OF}`),
        selectors: z
          .array(z.string())
          .max(20)
          .default([])
          .describe(
            "점검할 CSS 셀렉터(최대 20개) — 각 셀렉터의 첫 매칭 요소를 읽고 매칭 개수를 함께 준다. " +
              "예: [\"h1\", \".krds-btn.primary\", \"#main-content\"]. 비우면 문서 제목과 본문 폰트만 준다",
          ),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ selectors, ...input }) => {
      const resolved = resolveValidateTarget(input);
      if (!resolved.ok) return errorText(resolved.error);

      let r: Awaited<ReturnType<typeof runInspect>>;
      try {
        r = await runInspect(resolved, selectors);
      } catch (error) {
        dropInline(resolved);
        const msg = error instanceof Error ? error.message : String(error);
        if (/Cannot find (module|package)|ERR_MODULE_NOT_FOUND/i.test(msg)) {
          return errorText(PLAYWRIGHT_GUIDE);
        }
        return errorText(
          `점검 실행 실패: ${msg}\n` +
            "url이면 서버가 떠 있는지, filePath면 경로가 맞는지 확인하라. 셀렉터 문법 오류면 고쳐서 다시 부른다.",
        );
      }

      dropInline(resolved);
      const out: string[] = [
        `# inspect_page — ${resolved.label}`,
        "",
        `- 문서 제목: ${r.title}`,
        `- 본문 폰트: ${r.bodyFontFamily} — ${r.bodyFontLoaded ? "적용됨 ✓" : "**로드 안 됨 (시스템 폰트 폴백) ✗** — 템플릿의 @font-face 블록이 있는지, 폰트 파일 경로(assetBase)가 맞는지 확인"}`,
        "",
      ];
      for (const p of r.probes) {
        if (!p.found) {
          out.push(`## \`${p.selector}\` — 매칭 없음`);
          continue;
        }
        out.push(
          `## \`${p.selector}\` (${p.count}개 매칭, 첫 요소 기준)`,
          `- 배치: x ${p.rect!.x} · y ${p.rect!.y} · ${p.rect!.width}×${p.rect!.height} · display ${p.display} · visibility ${p.visibility}`,
          `- 색: ${p.color} / 배경 ${p.backgroundColor}`,
          `- 폰트: ${p.fontSize} ${p.fontFamily} ${p.fontLoaded ? "(적용됨)" : "**(폴백 — 로드 안 됨)**"}`,
          `- 간격: margin ${p.margin!.join(" ")} · padding ${p.padding!.join(" ")} (위 오른쪽 아래 왼쪽 px)${p.gap ? ` · gap 행 ${p.gap.row} 열 ${p.gap.column} (${p.display})` : ""}`,
          ...(p.text ? [`- 텍스트: ${p.text}`] : []),
          "",
        );
      }
      return text(out.join("\n"));
    },
  );
}

/** html 문자열 검사가 만든 임시 폴더를 지운다 — 검사마다 tmp에 쌓이던 것 */
function dropInline(target: { kind?: string; url: string }): void {
  if (target.kind !== "inline") return;
  try {
    rmSync(dirname(fileURLToPath(target.url)), { recursive: true, force: true });
  } catch {
    /* 정리 실패는 검사 결과와 무관하다 */
  }
}
