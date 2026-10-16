// 패턴 시각 검증 — 원본 데모와 템플릿 프리뷰를 같은 뷰포트로 렌더해
// 주요 컨테이너 치수를 비교하고 스크린샷을 남긴다.
// "구조를 따랐다"를 주장이 아니라 측정값으로 만든다 (느슨한 강제 ⑵층위의 검증).
//
// 실행: pnpm verify:visual [패턴명]
//   사전에 pnpm build:previews 필요. 결과물은 .visual/ (gitignore)
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium } from "playwright";
import { listPatterns } from "../src/templates/index.js";

const OUT_DIR = ".visual";
const VIEWPORTS = [1400, 768];
/** 폭 허용 오차(px) — 스크롤바·서브픽셀 차이 흡수 */
const TOLERANCE = 24;

// 비교 대상은 각 템플릿의 meta.json `visualCompare`에 있다 — 패턴 정의는 한 곳에 모은다.

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png",
};

type Box = { x: number; w: number; h: number } | null;

async function measure(url: string, width: number, selectors: string[], shotPath: string) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await page.waitForTimeout(800); // 폰트·마스크 아이콘 적용 대기
  const boxes: Record<string, Box> = {};
  for (const sel of selectors) {
    boxes[sel] = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
    }, sel);
  }
  await page.screenshot({ path: shotPath, fullPage: true });
  await browser.close();
  return boxes;
}

mkdirSync(OUT_DIR, { recursive: true });
const server = createServer((req, res) => {
  const p = join(process.cwd(), decodeURIComponent((req.url ?? "/").split("?")[0]!));
  if (!p.startsWith(process.cwd()) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;

const only = process.argv[2];
let failed = 0;

for (const meta of listPatterns()) {
  if (only && meta.name !== only) continue;
  const targets = meta.visualCompare;
  if (!targets || targets.length === 0) { console.error(`경고: ${meta.name} — meta.json에 visualCompare 미등록`); failed++; continue; }
  const selectors = targets.map((t) => (typeof t === "string" ? t : t.sel));
  const positionOnly = new Set(targets.filter((t) => typeof t !== "string").map((t) => t.sel));
  if (!meta.source.sampleUrl) { console.error(`건너뜀: ${meta.name} — 원본 샘플 URL 없음`); continue; }
  const preview = `templates/${meta.name}.preview.html`;
  if (!existsSync(preview)) { console.error(`오류: ${preview} 없음 — pnpm build:previews 먼저`); failed++; continue; }

  for (const width of VIEWPORTS) {
    const orig = await measure(meta.source.sampleUrl, width, selectors, `${OUT_DIR}/${meta.name}-orig-${width}.png`);
    const ours = await measure(`http://localhost:${port}/${preview}`, width, selectors, `${OUT_DIR}/${meta.name}-ours-${width}.png`);
    console.log(`\n=== ${meta.name} @ ${width}px ===`);
    for (const sel of selectors) {
      const o = orig[sel] ?? null;
      const u = ours[sel] ?? null;
      const fmt = (b: Box) => (b ? `x=${b.x} w=${b.w} h=${b.h}` : "요소 없음");
      let mark = "OK";
      if (!o || !u) { mark = "확인 필요(요소 부재)"; failed++; }
      else if (Math.abs(o.x - u.x) > TOLERANCE) { mark = `위치 차이 ${Math.abs(o.x - u.x)}px > 허용 ${TOLERANCE}px`; failed++; }
      else if (!positionOnly.has(sel) && Math.abs(o.w - u.w) > TOLERANCE) { mark = `폭 차이 ${Math.abs(o.w - u.w)}px > 허용 ${TOLERANCE}px`; failed++; }
      console.log(`  ${mark.padEnd(4)} ${sel}\n       원본 ${fmt(o)} | 우리 ${fmt(u)}`);
    }
  }
  console.log(`스크린샷: ${OUT_DIR}/${meta.name}-{orig,ours}-{${VIEWPORTS.join(",")}}.png`);
}

server.close();
if (failed > 0) { console.error(`\n실패 ${failed}건 — 스크린샷을 눈으로 대조할 것`); process.exit(1); }
console.log("\n치수 대조 통과 — 스크린샷 눈 확인 후 제출");
