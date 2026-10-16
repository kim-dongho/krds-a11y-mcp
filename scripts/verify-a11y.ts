// 수동 접근성 확인의 자동화 가능분 — 키보드 전수 + 접근성 트리 실측.
// axe(scan:axe)가 못 보는 "동작·경로"를 검증한다: Tab 도달성, 초점 가시성,
// 키보드 함정, 스크린리더가 읽을 이름·랜드마크·위계·상태.
// 실제 발화(스크린리더 실사용) 검증은 사람 몫으로 남는다 — 통독 대본 참조.
//
// 실행: pnpm verify:a11y [패턴명]   (사전에 pnpm build:previews)
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { chromium, type Page } from "playwright";
import { runKeyboardChecks } from "../src/report/keyboard.js";
import { listPatterns } from "../src/templates/index.js";

const tty = process.stdout.isTTY ?? false;
const c = {
  green: (t: string) => (tty ? `\x1b[32m${t}\x1b[0m` : t),
  red: (t: string) => (tty ? `\x1b[31m${t}\x1b[0m` : t),
  dim: (t: string) => (tty ? `\x1b[2m${t}\x1b[0m` : t),
  bold: (t: string) => (tty ? `\x1b[1m${t}\x1b[0m` : t),
};

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff", ".png": "image/png",
};

type Check = { name: string; kwcag: string; ok: boolean; detail?: string };

/**
 * 키보드 검사 — 도달성·초점 가시성은 validate_page와 같은 공용 모듈(실제 Tab 순회)로 판정한다.
 * 템플릿 품질 기준이라 판정 보류도 실패로 본다 (소비자 검사보다 엄격).
 */
async function keyboard(page: Page) {
  const findings = await runKeyboardChecks(page);
  const nodesOf = (rule: string) =>
    findings.filter((f) => f.ruleId === rule && f.outcome !== "pass").flatMap((f) => f.nodes);
  const positiveTabindex = await page.evaluate(
    () => [...document.querySelectorAll<HTMLElement>("[tabindex]")].filter((el) => el.tabIndex > 0).length,
  );
  const total = await page.evaluate(
    () => document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])').length,
  );
  return { total, unreached: nodesOf("kbd-reachable"), noFocus: nodesOf("kbd-focus-visible"), positiveTabindex };
}

/** 접근성 트리 검사 — 이름·랜드마크·위계·상태 */
async function axTree(page: Page) {
  return page.evaluate(() => {
    const nameOf = (el: Element): string => {
      const aria = el.getAttribute("aria-label");
      if (aria?.trim()) return aria.trim();
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) {
        const t = labelledby.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
        if (t) return t;
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        const byFor = el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim() : "";
        if (byFor) return byFor;
        const wrap = el.closest("label")?.textContent?.trim();
        if (wrap) return wrap;
        if (el instanceof HTMLInputElement && (el.type === "button" || el.type === "submit") && el.value) return el.value;
      }
      const text = (el.textContent ?? "").trim();
      if (text) return text;
      const title = el.getAttribute("title");
      if (title?.trim()) return title.trim();
      return "";
    };

    const unnamed: string[] = [];
    for (const el of document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea")) {
      if (el.matches(":disabled, [disabled]")) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (!nameOf(el)) unnamed.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${[...el.classList].slice(0, 2).join(".")}`);
    }

    const mains = document.querySelectorAll("main, [role=main]").length;
    const banners = document.querySelectorAll("body > header, [role=banner]").length;
    const contentinfos = document.querySelectorAll("body > footer, [role=contentinfo]").length;
    const navs = [...document.querySelectorAll("nav, [role=navigation]")];
    const unnamedNavs = navs.length > 1 ? navs.filter((n) => !n.getAttribute("aria-label") && !n.getAttribute("aria-labelledby")).length : 0;

    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
    const h1Count = headings.filter((l) => l === 1).length;
    let skip = "";
    let prev = 0;
    for (const l of headings) {
      if (prev > 0 && l > prev + 1) { skip = `h${prev} 다음 h${l}`; break; }
      prev = l;
    }

    const states = {
      ariaCurrent: document.querySelectorAll("[aria-current]").length,
      ariaPressed: document.querySelectorAll("[aria-pressed]").length,
      ariaSelected: document.querySelectorAll("[aria-selected]").length,
      srOnlyState: [...document.querySelectorAll(".sr-only")].filter((s) => /현재|선택/.test(s.textContent ?? "")).length,
    };
    return { unnamed, mains, banners, contentinfos, navCount: navs.length, unnamedNavs, h1Count, skip, states };
  });
}

// ── 실행 ──
const server = createServer((req, res) => {
  const p = join(process.cwd(), decodeURIComponent((req.url ?? "/").split("?")[0]!));
  if (!p.startsWith(process.cwd()) || !existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise<void>((r) => server.listen(0, r));
const port = (server.address() as { port: number }).port;

const only = process.argv[2];
let failedTemplates = 0;
let passedTemplates = 0;
let totalChecks = 0;
let failedChecks = 0;
const startedAt = Date.now();

const browser = await chromium.launch();
for (const meta of listPatterns()) {
  if (only && meta.name !== only) continue;
  const preview = `templates/${meta.name}.preview.html`;
  if (!existsSync(preview)) { console.error(`건너뜀: ${meta.name} — 프리뷰 없음`); continue; }

  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  // tsx(esbuild keepNames)가 evaluate 함수에 __name 헬퍼를 주입한다 — 브라우저에 폴리필
  await page.addInitScript("window.__name = (fn) => fn;");
  await page.goto(`http://localhost:${port}/${preview}`, { waitUntil: "networkidle" });

  const kb = await keyboard(page);
  const ax = await axTree(page);
  await page.close();

  const checks: Check[] = [
    {
      name: `키보드 도달성 — 조작 요소 ${kb.total}개 전부 Tab으로 도달`,
      kwcag: "6.1.1",
      ok: kb.unreached.length === 0,
      detail: kb.unreached.length ? `못 닿음 ${kb.unreached.length}개: ${kb.unreached.slice(0, 3).map((n) => n.selector).join(", ")}` : undefined,
    },
    {
      name: "초점 가시성 — 초점 시 외곽선/그림자/테두리/배경 변화",
      kwcag: "6.1.2",
      ok: kb.noFocus.length === 0,
      detail: kb.noFocus.length ? `안 보임·판정 보류 ${kb.noFocus.length}개: ${kb.noFocus.slice(0, 3).map((n) => `${n.selector}(${n.summary.slice(0, 20)})`).join(", ")}` : undefined,
    },
    {
      name: "양수 tabindex 없음 — Tab 순서 = DOM 순서",
      kwcag: "6.1.2",
      ok: kb.positiveTabindex === 0,
      detail: kb.positiveTabindex ? `양수 tabindex ${kb.positiveTabindex}개` : undefined,
    },
    {
      name: "모든 컨트롤에 접근 가능한 이름",
      kwcag: "7.3.2",
      ok: ax.unnamed.length === 0,
      detail: ax.unnamed.length ? `이름 없음: ${ax.unnamed.slice(0, 3).join(", ")}` : undefined,
    },
    { name: "main 랜드마크 정확히 1개", kwcag: "6.4.1", ok: ax.mains === 1, detail: `${ax.mains}개` },
    {
      name: "banner/contentinfo 중복 없음",
      kwcag: "6.4.1",
      ok: ax.banners <= 1 && ax.contentinfos <= 1,
      detail: `banner ${ax.banners} · contentinfo ${ax.contentinfos}`,
    },
    {
      name: "nav 랜드마크 이름 구분",
      kwcag: "6.4.1",
      ok: ax.unnamedNavs === 0,
      detail: ax.navCount > 1 ? `nav ${ax.navCount}개 중 이름 없음 ${ax.unnamedNavs}` : "nav 1개 이하",
    },
    { name: "h1 정확히 1개", kwcag: "6.4.2", ok: ax.h1Count === 1, detail: `${ax.h1Count}개` },
    { name: "제목 수준 건너뛰기 없음", kwcag: "6.4.2", ok: !ax.skip, detail: ax.skip || undefined },
  ];

  const fails = checks.filter((ch) => !ch.ok);
  totalChecks += checks.length;
  failedChecks += fails.length;
  if (fails.length === 0) passedTemplates++; else failedTemplates++;

  const head = fails.length === 0 ? c.green("✓") : c.red("✗");
  console.log(` ${head} ${c.bold(`templates/${meta.name}.html`)} ${c.dim(`(검사 ${checks.length} · 조작 요소 ${kb.total} · 상태 노출 current ${ax.states.ariaCurrent}/pressed ${ax.states.ariaPressed}/selected ${ax.states.ariaSelected}/sr ${ax.states.srOnlyState})`)}`);
  for (const ch of checks) {
    const mark = ch.ok ? c.green("✓") : c.red("✗");
    const detail = ch.detail ? c.dim(` — ${ch.detail}`) : "";
    if (!ch.ok) console.log(`   ${mark} ${ch.kwcag} ${ch.name}${c.red(detail)}`);
    else console.log(`   ${mark} ${c.dim(`${ch.kwcag} ${ch.name}`)}${detail}`);
  }
}
await browser.close();
server.close();

const dur = ((Date.now() - startedAt) / 1000).toFixed(2);
console.log("");
console.log(` ${c.dim("템플릿")}  ${failedTemplates ? c.red(`${failedTemplates} 실패`) + c.dim(" | ") : ""}${c.green(`${passedTemplates} 통과`)}`);
console.log(` ${c.dim("검사")}    ${failedChecks ? c.red(`${failedChecks} 실패`) + c.dim(" | ") : ""}${c.green(`${totalChecks - failedChecks} 통과`)} ${c.dim("(키보드·접근성 트리)")}`);
console.log(` ${c.dim("시간")}    ${dur}s`);
process.exit(failedChecks > 0 ? 1 : 0);
