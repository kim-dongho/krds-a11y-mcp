// 검사 대상 로드 — 사이트 URL은 그대로, 킷 데모 조각은 하네스로 감싸 연다
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Page } from "playwright";
import type { RunnerOptions } from "./runner.js";
import type { Target } from "./types.js";

/**
 * 킷 데모는 마크업 "조각"이라 그대로 열 수 없다 — 킷 CSS/JS를 입힌 하네스로 감싼다.
 * 주의: 하네스가 lang="ko"와 <title>을 제공하므로 페이지 수준 항목(7.1.1 기본 언어,
 * 6.4.2의 document-title)의 통과는 하네스 산물이지 컴포넌트 보장이 아니다 — verify에서 제외한다.
 */
export function harness(fragmentHtml: string, kitPath: string, title: string): string {
  const css = (p: string) => pathToFileURL(`${kitPath}/resources/css/${p}`).href;
  const js = (p: string) => pathToFileURL(`${kitPath}/resources/js/${p}`).href;
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} 검사 하네스</title>
<link rel="stylesheet" href="${css("common/common.css")}">
<link rel="stylesheet" href="${css("component/component.css")}">
</head>
<body>
<div id="wrap">
${fragmentHtml}
</div>
<script src="${js("plugin/swiper-bundle.min.js")}"></script>
<script src="${js("component/ui-script.js")}"></script>
</body>
</html>`;
}

export async function loadTarget(
  page: Page,
  target: Target,
  opts: RunnerOptions,
  harnessDir: string,
): Promise<void> {
  if (target.kind === "kit-demo") {
    if (!opts.kitPath) throw new Error("kit-demo 대상에는 kitPath가 필요하다");
    let fragment = readFileSync(target.url, "utf8");
    if (target.variant === "sample-removed") {
      // ui-script.js는 :not(.sample)만 초기화 — JS 동작 검증용 변형
      fragment = fragment.replaceAll(/class="([^"]*)\bsample\b([^"]*)"/g, 'class="$1$2"');
    }
    // setContent(about:blank 오리진)에서는 file:// 리소스가 차단되므로
    // 하네스를 실제 파일로 쓰고 file://로 연다 (file→file 로드는 허용)
    const harnessPath = join(harnessDir, `${target.id.replace(/[^a-z0-9_-]/gi, "_")}.html`);
    writeFileSync(harnessPath, harness(fragment, opts.kitPath, target.id));
    await page.goto(pathToFileURL(harnessPath).href, { waitUntil: "networkidle" });
  } else {
    await page.goto(target.url, { waitUntil: "networkidle" });
  }
}
