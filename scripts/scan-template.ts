// 템플릿 프리뷰 axe 스캔 — 로컬 서버를 띄우고 axe-core 전수 규칙으로 검사한다.
//
// 실행: pnpm scan:axe [패턴명]   (생략 시 전 템플릿)
//   사전에 pnpm build:previews 필요. 위반이 있으면 종료 코드 1.
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { listPatterns } from "../src/templates/index.js";
import { KWCAG_BY_ID, lookupRule } from "../src/mapping/index.js";

const require = createRequire(import.meta.url);

// vitest풍 출력 — TTY에서만 색상
const tty = process.stdout.isTTY ?? false;
const c = {
  green: (t: string) => (tty ? `\x1b[32m${t}\x1b[0m` : t),
  red: (t: string) => (tty ? `\x1b[31m${t}\x1b[0m` : t),
  dim: (t: string) => (tty ? `\x1b[2m${t}\x1b[0m` : t),
  bold: (t: string) => (tty ? `\x1b[1m${t}\x1b[0m` : t),
};
const AXE_PATH = require.resolve("axe-core/axe.min.js");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png",
};

const server = createServer((req, res) => {
  const p = join(process.cwd(), decodeURIComponent((req.url ?? "/").split("?")[0]!));
  if (!p.startsWith(process.cwd()) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;

const axeSource = readFileSync(AXE_PATH, "utf8");
const only = process.argv[2];
let totalViolations = 0;
let templatesRun = 0;
let templatesPassed = 0;
let itemsPassed = 0;
let itemsFailed = 0;
let rulesRun = 0;
const startedAt = Date.now();

const browser = await chromium.launch();
for (const meta of listPatterns()) {
  if (only && meta.name !== only) continue;
  const preview = `templates/${meta.name}.preview.html`;
  if (!existsSync(preview)) { console.error(`건너뜀: ${meta.name} — 프리뷰 없음 (pnpm build:previews 먼저)`); continue; }

  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(`http://localhost:${port}/${preview}`, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axeSource });
  type RuleResult = { id: string; impact?: string; nodes: { target: string[]; html: string }[] };
  const result = (await page.evaluate(
    // @ts-expect-error axe는 페이지 안에만 존재
    () => axe.run(document, { resultTypes: ["violations", "passes"] }),
  )) as { violations: RuleResult[]; passes: RuleResult[] };
  // 비활성 요소의 명도 대비는 5.4.3 예외 — validate_page(report/contrast.ts demoteInactiveContrastViolations)와 같은 기준
  for (const v of result.violations.filter((x) => x.id === "color-contrast")) {
    const inactive = await page.evaluate(
      (sels) => sels.map((s) => !!document.querySelector(s)?.closest("[disabled], [aria-disabled='true'], .disabled")),
      v.nodes.map((n) => n.target[0]!),
    );
    v.nodes = v.nodes.filter((_, i) => !inactive[i]);
  }
  result.violations = result.violations.filter((v) => v.nodes.length > 0);
  await page.close();

  // 실행 규칙을 KWCAG 항목별로 묶어 체크리스트로 보여준다
  const byItem = new Map<string, { pass: string[]; fail: string[]; bp: boolean }>();
  const outside: { rule: string; failed: boolean }[] = [];
  const collect = (rules: RuleResult[], failed: boolean) => {
    for (const r of rules) {
      const entry = lookupRule(r.id);
      if (!entry) { outside.push({ rule: r.id, failed }); continue; }
      for (const id of entry.kwcagIds) {
        const slot = byItem.get(id) ?? { pass: [], fail: [], bp: entry.status === "best-practice" };
        (failed ? slot.fail : slot.pass).push(r.id);
        byItem.set(id, slot);
      }
    }
  };
  collect(result.passes, false);
  collect(result.violations, true);

  templatesRun++;
  rulesRun += result.passes.length + result.violations.length;
  const ok = result.violations.length === 0;
  if (ok) templatesPassed++;
  const headMark = ok ? c.green("✓") : c.red("✗");
  const counts = c.dim(`(KWCAG ${byItem.size}항목 · 규칙 ${result.passes.length + result.violations.length}종)`);
  console.log(` ${headMark} ${c.bold(`templates/${meta.name}.html`)} ${counts}`);
  for (const [id, slot] of [...byItem.entries()].sort()) {
    const item = KWCAG_BY_ID.get(id);
    const failed = slot.fail.length > 0;
    if (failed) itemsFailed++; else itemsPassed++;
    const mark = failed ? c.red("✗") : c.green("✓");
    const bp = slot.bp ? c.dim(" (모범관행 근거)") : "";
    const rules = c.dim(`— ${[...slot.pass, ...slot.fail].join(", ")}`);
    console.log(`   ${mark} ${id.replace("kwcag:", "")} ${item?.name ?? ""}${bp} ${rules}`);
    for (const ruleId of slot.fail) {
      const v = result.violations.find((x) => x.id === ruleId)!;
      console.log(c.red(`     위반 ${ruleId} (${v.impact}, ${v.nodes.length}곳)`));
      for (const n of v.nodes.slice(0, 3)) console.log(c.red(`       ${n.target[0]}`));
    }
  }
  const outsideFail = outside.filter((o) => o.failed);
  console.log(c.dim(`   · KWCAG 밖/일반 품질 규칙 ${outside.length}종${outsideFail.length ? ` — 위반: ${outsideFail.map((o) => o.rule).join(", ")}` : " 통과"}`));
  totalViolations += result.violations.length;
}
await browser.close();
server.close();

const dur = ((Date.now() - startedAt) / 1000).toFixed(2);
console.log("");
const tplLabel = totalViolations > 0
  ? c.red(`${templatesRun - templatesPassed} 실패`) + c.dim(" | ") + c.green(`${templatesPassed} 통과`)
  : c.green(`${templatesPassed} 통과`);
console.log(` ${c.dim("템플릿")}  ${tplLabel} ${c.dim(`(${templatesRun})`)}`);
console.log(` ${c.dim("항목")}    ${itemsFailed > 0 ? c.red(`${itemsFailed} 위반`) + c.dim(" | ") : ""}${c.green(`${itemsPassed} 통과`)} ${c.dim("(KWCAG 자동 판정 범위)")}`);
console.log(` ${c.dim("규칙")}    ${rulesRun}종 실행 ${c.dim(`· axe-core`)}`);
console.log(` ${c.dim("시간")}    ${dur}s`);
process.exit(totalViolations > 0 ? 1 : 0);
