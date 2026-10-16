// 패턴 레이아웃 CSS 발췌 — 손 재작성 금지 원칙의 집행부.
//
// 문제: 공식 샘플의 레이아웃 CSS(resources/css/pattern/output.css, 약 800KB)는
// 가이드 사이트 전용이라 킷 npm에 없다. 이걸 손으로 "비슷하게" 다시 쓰면
// 비율·순서 실수가 생긴다(login-id에서 실제 발생).
//
// 해법: 템플릿이 실제로 쓰는 클래스 중 킷 npm CSS(common/component)가 스타일하지
// 않는 것(=패턴 전용 클래스)을 찾고, 원본 output.css에서 그 클래스를 참조하는
// 규칙만 기계적으로 발췌해 템플릿의 마커 구간에 써넣는다. 색·간격은 원본이
// 킷 토큰(var(--krds-*))으로 쓰므로 그대로 성립한다.
//
// 발췌 채택 기준 (셀렉터 단위):
//   1) 같은 셀렉터의 규칙이 킷 npm CSS에 없고 (있으면 킷이 이미 공급 — 중복 배제),
//   2) 셀렉터가 클래스를 1개 이상 참조하며 모든 클래스가 템플릿에 존재하고
//      (다른 변형 전용 규칙 배제), 모든 id가 템플릿에 존재한다 (#container 등 배제)
//
// 실행: pnpm extract:css  (patterns-src/pattern-output.css 필요 — collect:patterns 참고)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const PATTERN_CSS_PATH = "patterns-src/pattern-output.css";
const PATTERN_CSS_URL = "https://www.krds.go.kr/resources/css/pattern/output.css";
const KIT_CSS_PATHS = [
  "node_modules/krds-uiux/resources/css/common/common.css",
  "node_modules/krds-uiux/resources/css/component/component.css",
];
const BEGIN = "/* ==== 원본 패턴 CSS 발췌 시작 — scripts/extract-pattern-css.ts 생성분. 손으로 고치지 말 것 ==== */";
const END = "/* ==== 원본 패턴 CSS 발췌 끝 ==== */";

// ---------- CSS 파서 (규칙 단위, @media 1단 중첩까지 — output.css의 실제 형태) ----------

type FlatRule = { atRule: string | null; selector: string; body: string };

function parseCss(css: string): FlatRule[] {
  const rules: FlatRule[] = [];
  walk(css, null);
  return rules;

  function walk(text: string, atRule: string | null): void {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open === -1) break;
      const header = text.slice(i, open).trim().replace(/\/\*[\s\S]*?\*\//g, "").trim();
      // @import / @charset 는 세미콜론 문 — header에 섞여 들어오면 마지막 줄만 취한다
      const sel = header.split(";").pop()!.trim();
      const close = findMatching(text, open);
      const inner = text.slice(open + 1, close);
      if (sel.startsWith("@media") || sel.startsWith("@supports")) {
        walk(inner, sel);
      } else if (sel.startsWith("@")) {
        // @font-face, @keyframes 등 — 발췌 대상 아님
      } else if (sel) {
        rules.push({ atRule, selector: sel, body: inner.trim() });
      }
      i = close + 1;
    }
  }

  function findMatching(text: string, openIdx: number): number {
    let depth = 0;
    for (let j = openIdx; j < text.length; j++) {
      if (text[j] === "{") depth++;
      else if (text[j] === "}" && --depth === 0) return j;
    }
    return text.length;
  }
}

const classTokens = (selector: string): string[] =>
  [...selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]!);
const idTokens = (selector: string): string[] =>
  [...selector.matchAll(/#(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]!);

// ---------- 템플릿 → 발췌 ----------

const normalizeSel = (s: string) => s.replace(/\s+/g, " ").trim();

function extractFor(templateHtml: string, patternRules: FlatRule[], kitSelectors: Set<string>) {
  const usedClasses = new Set<string>();
  for (const m of templateHtml.matchAll(/class="([^"]+)"/g))
    for (const c of m[1]!.split(/\s+/)) if (c) usedClasses.add(c);
  const usedIds = new Set([...templateHtml.matchAll(/id="([^"]+)"/g)].map((m) => m[1]!));

  const picked: FlatRule[] = [];
  const touched = new Set<string>();
  for (const rule of patternRules) {
    const kept = rule.selector
      .split(",")
      .map((s) => s.trim())
      .filter((sel) => {
        const cls = classTokens(sel);
        const ids = idTokens(sel);
        return (
          !kitSelectors.has(normalizeSel(sel)) &&
          cls.length > 0 &&
          cls.every((c) => usedClasses.has(c)) &&
          ids.every((i) => usedIds.has(i))
        );
      });
    if (kept.length > 0) {
      picked.push({ ...rule, selector: kept.join(",\n") });
      for (const sel of kept) for (const c of classTokens(sel)) touched.add(c);
    }
  }
  return { picked, touched };
}

function renderCss(rules: FlatRule[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < rules.length) {
    const at = rules[i]!.atRule;
    const group: FlatRule[] = [];
    while (i < rules.length && rules[i]!.atRule === at) group.push(rules[i++]!);
    const body = group
      .map((r) => `${r.selector} {\n  ${r.body.replace(/\n\s*/g, "\n  ")}\n}`)
      .join("\n");
    out.push(at ? `${at} {\n${body.replace(/^/gm, "  ")}\n}` : body);
  }
  return out.join("\n");
}

// ---------- 실행 ----------

if (!existsSync(PATTERN_CSS_PATH)) {
  console.error(`${PATTERN_CSS_PATH} 없음 — 먼저 받아라: curl -o ${PATTERN_CSS_PATH} ${PATTERN_CSS_URL}`);
  process.exit(1);
}
const patternCssText = readFileSync(PATTERN_CSS_PATH, "utf8");
const sha256 = createHash("sha256").update(patternCssText).digest("hex");
const patternRules = parseCss(patternCssText);
const kitSelectors = new Set(
  KIT_CSS_PATHS.flatMap((p) => parseCss(readFileSync(p, "utf8")))
    .flatMap((r) => r.selector.split(",").map(normalizeSel)),
);

const only = process.argv[2]; // 패턴명 지정 시 그 템플릿만
const { listPatterns } = await import("../src/templates/index.js");

for (const meta of listPatterns()) {
  if (only && meta.name !== only) continue;
  const path = `templates/${meta.name}.html`;
  const html = readFileSync(path, "utf8");
  const b = html.indexOf(BEGIN);
  const e = html.indexOf(END);
  if (b === -1 || e === -1) {
    console.error(`건너뜀: ${meta.name} — 템플릿에 발췌 마커가 없다 (${BEGIN.slice(0, 30)}…)`);
    continue;
  }

  const { picked, touched } = extractFor(html, patternRules, kitSelectors);
  // 이미지 경로 재작성: 킷 npm에 있는 파일은 {{assetBase}} 경로로, 킷에 없는
  // 패턴 전용 이미지(img/pattern/*)는 원본에서 스냅샷 받아 data URI로 인라인
  // — 템플릿을 자기완결로 유지 (소비 프로젝트에 없는 파일 참조 금지)
  let css = renderCss(picked);
  for (const m of [...css.matchAll(/url\(\s*["']?\.\.\/\.\.\/img\/([^)"']+)["']?\s*\)/g)]) {
    const rel = m[1]!;
    if (existsSync(`node_modules/krds-uiux/resources/img/${rel}`)) {
      css = css.replaceAll(m[0], `url({{assetBase}}/resources/img/${rel})`);
      continue;
    }
    const snap = `patterns-src/img/${rel}`;
    if (!existsSync(snap)) {
      const res = await fetch(`https://www.krds.go.kr/resources/img/${rel}`);
      if (!res.ok) {
        console.error(`오류: 이미지 수집 실패 ${rel} (${res.status}) — 발췌 중단`);
        process.exit(1);
      }
      mkdirSync(dirname(snap), { recursive: true });
      writeFileSync(snap, Buffer.from(await res.arrayBuffer()));
    }
    const b64 = readFileSync(snap).toString("base64");
    const mime = rel.endsWith(".svg") ? "image/svg+xml" : rel.endsWith(".png") ? "image/png" : "application/octet-stream";
    css = css.replaceAll(m[0], `url(data:${mime};base64,${b64})`);
  }

  const block = [
    BEGIN,
    `/* 출처: ${PATTERN_CSS_URL}`,
    `   sha256: ${sha256}`,
    `   규칙 ${picked.length}건 · 클래스: ${[...touched].sort().join(", ")} */`,
    css,
    END,
  ].join("\n");

  writeFileSync(path, html.slice(0, b) + block + html.slice(e + END.length));
  console.error(`갱신: ${path} — 규칙 ${picked.length}건 (${[...touched].sort().join(", ")})`);
}
