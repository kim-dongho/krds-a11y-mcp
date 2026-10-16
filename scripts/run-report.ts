// CLI: pnpm report -- --targets kit --kit <킷경로> [--experimental] [--out <경로>]
//      pnpm report -- --targets site --url <URL> [--experimental] [--out <경로>]
//      pnpm report -- --targets templates [--name <템플릿>] [--experimental] [--out <경로>]
// 종료 코드는 항상 0 — PoC는 게이트가 아니다 (게이트는 2층 CI의 역할).
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { kitTargets, render, scanTargets, translate } from "../src/report/index.js";
import type { RuleSet, Target } from "../src/report/types.js";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const has = (name: string) => process.argv.includes(`--${name}`);

async function main(): Promise<void> {
  const mode = arg("targets") ?? "kit";
  const ruleSet: RuleSet = has("experimental") ? "baseline+experimental" : "baseline";

  let targets: Target[];
  let kitPath: string | undefined;
  let label: string;

  if (mode === "kit") {
    kitPath = arg("kit") ?? process.env.KRDS_KIT_PATH;
    if (!kitPath) {
      console.error(
        "킷 경로가 필요하다: --kit <경로> 또는 KRDS_KIT_PATH 환경변수.\n" +
          "클론: git clone --depth 1 https://github.com/KRDS-uiux/krds-uiux.git",
      );
      process.exit(1);
    }
    kitPath = resolve(kitPath);
    targets = kitTargets(kitPath);
    label = "kit";
  } else if (mode === "templates") {
    // 템플릿 프리뷰는 완전한 페이지 — site와 같은 조건(페이지 수준 규칙 포함)으로 검사한다.
    // meta.json이 있는 것만 템플릿이다 (rfp-demo 등 비추적 데모 프리뷰 제외)
    const dir = resolve("templates");
    const only = arg("name");
    const names = readdirSync(dir)
      .filter((f) => f.endsWith(".preview.html"))
      .map((f) => basename(f, ".preview.html"))
      .filter((n) => existsSync(resolve(dir, `${n}.meta.json`)))
      .filter((n) => !only || n === only)
      .sort();
    if (names.length === 0) {
      console.error(only ? `템플릿을 찾을 수 없다: ${only}` : "templates/에 프리뷰가 없다 — pnpm build:previews 먼저");
      process.exit(1);
    }
    targets = names.map((n) => ({
      id: `tpl:${n}`,
      kind: "site" as const,
      url: pathToFileURL(resolve(dir, `${n}.preview.html`)).href,
    }));
    label = only ? `templates-${only}` : "templates";
  } else if (mode === "site") {
    const url = arg("url");
    if (!url) {
      console.error("사이트 검사에는 --url <URL>이 필요하다");
      process.exit(1);
    }
    targets = [{ id: `site:${new URL(url).hostname}`, kind: "site", url }];
    label = new URL(url).hostname;
  } else {
    console.error(`알 수 없는 --targets 값: ${mode} (kit | site | templates)`);
    process.exit(1);
  }

  console.error(`검사 시작: ${targets.length}개 대상 · 규칙 세트 ${ruleSet}`);
  const results = await scanTargets(targets, {
    ruleSet,
    ...(kitPath ? { kitPath } : {}),
  });
  const ok = results.filter((r) => r.status === "ok").length;
  console.error(`검사 완료: 성공 ${ok} / 오류 ${results.length - ok}`);

  const report = translate(results);
  const markdown = render(report);

  const date = new Date().toISOString().slice(0, 10);
  const outPath = resolve(arg("out") ?? `reports/${date}-${label}.md`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown);
  // 검증(verify) 단계가 원시 집계를 쓰므로 JSON도 함께 남긴다
  const jsonPath = outPath.replace(/\.md$/, ".json");
  writeFileSync(jsonPath, JSON.stringify({ report, results }, null, 2));
  console.error(`리포트: ${outPath}\n원시 데이터: ${jsonPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
