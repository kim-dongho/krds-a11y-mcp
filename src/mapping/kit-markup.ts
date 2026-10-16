import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

// 킷 마크업은 복사하지 않고 npm 의존성(krds-uiux)에서 읽는다.
// package.json이 킷 버전을 고정하므로 버전 추적이 의존성 관리로 해결된다.
const require_ = createRequire(import.meta.url);

let kitRootCache: string | undefined;

export function kitRoot(): string {
  if (!kitRootCache) {
    kitRootCache = dirname(require_.resolve("krds-uiux/package.json"));
  }
  return kitRootCache;
}

export function kitVersion(): string {
  const pkg = JSON.parse(
    readFileSync(join(kitRoot(), "package.json"), "utf8"),
  ) as { version: string };
  return pkg.version;
}

/** 컴포넌트 id + 변형 → 킷 html 파일명 (변형 없으면 기본 파일) */
function fileNameFor(componentId: string, variant?: string): string {
  const base = componentId.replace("krds:", "");
  return variant ? `${base}_${variant}.html` : `${base}.html`;
}

export type MarkupResult = {
  file: string;
  html: string;
};

/**
 * 킷 마크업 조각을 읽는다. 조각이므로 그대로 페이지가 되지 않는다 —
 * 소비 측이 자기 페이지 구조에 삽입해야 한다.
 */
export function readMarkup(componentId: string, variant?: string): MarkupResult {
  const file = fileNameFor(componentId, variant);
  const path = join(kitRoot(), "html", "code", file);
  try {
    return { file: `html/code/${file}`, html: readFileSync(path, "utf8").trim() };
  } catch {
    const available = listMarkupFiles(componentId);
    if (variant) {
      throw new Error(
        `변형 '${variant}'의 마크업이 킷에 없다 (${file}). ` +
          `사용 가능한 파일: ${available.join(", ") || "(없음)"}`,
      );
    }
    // main_menu처럼 기본 파일 없이 변형만 있는 컴포넌트 — 변형을 골라야 한다
    const variants = variantsOf(componentId);
    if (variants.length > 0) {
      throw new Error(
        `krds:${componentId.replace("krds:", "")}는 기본 마크업이 없고 변형만 있다. ` +
          `variant를 지정하라: ${variants.join(", ")}`,
      );
    }
    throw new Error(`킷에 마크업 파일이 없다: html/code/${file}`);
  }
}

/** 기본 파일명을 제외한 변형 이름 목록 — "button_icon.html" → "icon" */
export function variantsOf(componentId: string): string[] {
  const base = componentId.replace("krds:", "");
  return listMarkupFiles(componentId)
    .filter((f) => f !== `${base}.html`)
    .map((f) => f.slice(base.length + 1, -".html".length));
}

/** 해당 컴포넌트의 킷 파일 목록 (기본 + 변형) */
export function listMarkupFiles(componentId: string): string[] {
  const base = componentId.replace("krds:", "");
  const dir = join(kitRoot(), "html", "code");
  // 디렉토리 읽기는 한 번만 — 43종 × 74파일이라 부담 없다
  const { readdirSync } = require_("node:fs") as typeof import("node:fs");
  return readdirSync(dir)
    .filter((f) => f === `${base}.html` || f.startsWith(`${base}_`))
    .sort();
}

/**
 * 킷 v1.1.0 npm판 component.css의 아이콘 경로 버그(url(../../img/img/…) — img 중복,
 * 206곳 404) 우회 CSS를 생성한다. 해당 컴포넌트의 깨진 규칙을 찾아 이미지 선언만
 * 올바른 경로로 재선언한 블록을 돌려준다 — 킷이 수정되면 빈 문자열이 되어 자연 소멸.
 */
export function iconFixCss(componentId: string, assetBase = "node_modules/krds-uiux"): string {
  const key = `krds-${componentId.replace("krds:", "")}`;
  const icons = collectIconFixes((selector) => selector.includes(key), assetBase);
  return componentId === "krds:select" ? [icons, SELECT_COLOR_FIX].filter(Boolean).join("\n") : icons;
}

/**
 * 킷 셀렉트 기본 글자색은 5.4.3 미달(3.08:1)이다 — text-subtle(8.68:1)로 교정한다 (component.css:9616).
 * 일부 패턴 템플릿에만 들어 있어, 생성 마크업·공통부 조립 페이지에서 셀렉트를 쓰면 미달이 그대로 남았다
 * (실사용 재확인 3세션 모두). 아이콘 교정 CSS와 같은 경로로 함께 준다
 */
export const SELECT_COLOR_FIX =
  "/* 킷 결함 교정: 셀렉트 기본 글자색 대비 3.08:1 → text-subtle 8.68:1 (5.4.3) */\n" +
  ".krds-form-select { color: var(--krds-light-color-text-subtle); }";

/**
 * 킷 아이콘 경로 버그(img/img 중복)의 페이지 전체 교정 CSS.
 * 여러 컴포넌트를 조립한 페이지는 컴포넌트별 조각으로는 빠지는 곳이 생긴다 —
 * 실사용 테스트에서 소비자 AI가 이걸 직접 만들어 쓴 것이 확인돼 도구가 제공한다 (2026-09-22).
 */
export function iconFixCssAll(assetBase = "node_modules/krds-uiux"): string {
  return `${collectIconFixes(() => true, assetBase)}\n${SELECT_COLOR_FIX}`;
}

function collectIconFixes(
  match: (selector: string) => boolean,
  assetBase: string,
): string {
  const css = readFileSync(
    join(kitRoot(), "resources", "css", "component", "component.css"),
    "utf8",
  );
  const out: string[] = [];
  for (const { selector, body, media } of styleRules(css)) {
    if (!body.includes("img/img/") || !match(selector)) continue;
    // 속성별 "블록 내 최종 선언"만 본다. 킷은 mask-image: url(…) 직후 mask-image: none으로
    // 취소하는 패턴을 쓰는데(예: .krds-form-select — 화살표는 background-image가 그린다),
    // 취소된 선언까지 재선언하면 mask가 부활해 요소 전체가 클리핑된다 (JSP 실사용에서
    // 셀렉트가 통째로 사라진 버그, 2026-10-07).
    const last = new Map<string, string>();
    const hadBrokenUrl = new Set<string>();
    for (const [, prop, value] of body.matchAll(
      /(-webkit-mask-image|mask-image|background-image|background)\s*:\s*([^;]+)/g,
    )) {
      last.set(prop!, value!.trim());
      if (value!.includes("img/img/")) hadBrokenUrl.add(prop!);
    }
    const decls = [...last.entries()]
      .map(([prop, value]) => {
        const url = value.match(/url\(([^)]*img\/img\/[^)]+)\)/)?.[1];
        if (url) return `  ${prop}: url(${url.replace("../../img/img/", `${assetBase}/resources/img/`)});`;
        // 킷이 경로를 쓴 뒤 none으로 끈 속성은 none까지 다시 쓴다. 안 그러면 앞쪽 일반 규칙의 교정
        // (예: .form-group [class^=form-hint]::before의 mask)이 같은 우선순위로 뒤에서 다시 씌워져
        // 오류 아이콘이 정보 아이콘 모양으로 잘린다 (실사용 재확인에서 실측, 초기부터 잠재)
        if (value === "none" && hadBrokenUrl.has(prop)) return `  ${prop}: none;`;
        return undefined;
      })
      .filter((d): d is string => d !== undefined);
    if (decls.length === 0) continue;
    const rule = `${selector} {\n${[...new Set(decls)].join("\n")}\n}`;
    // @media 안의 규칙은 같은 조건으로 감싸 낸다 — 밖으로 꺼내면 모바일 전용 아이콘(브레드크럼 말줄임 등)이
    // 데스크톱에도 붙는다 (초기부터 잠재, 아이콘 시각 검사에서 실측)
    out.push(media.length > 0 ? media.reduceRight((inner, m) => `${m} {\n${inner}\n}`, rule) : rule);
  }
  return out.join("\n");
}

/** 킷 CSS의 스타일 규칙을 감싸는 at-rule(@media 등) 문맥과 함께 차례로 꺼낸다 (주석 제거, 중첩 블록 지원) */
function styleRules(css: string): { selector: string; body: string; media: string[] }[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: { selector: string; body: string; media: string[] }[] = [];
  const stack: string[] = [];
  let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    const close = src.indexOf("}", i);
    if (close !== -1 && (open === -1 || close < open)) {
      stack.pop(); // at-rule 블록 닫힘
      i = close + 1;
      continue;
    }
    if (open === -1) break;
    const prelude = src.slice(i, open).trim();
    if (prelude.startsWith("@")) {
      stack.push(prelude);
      i = open + 1;
      continue;
    }
    const end = src.indexOf("}", open);
    rules.push({ selector: prelude, body: src.slice(open + 1, end), media: [...stack] });
    i = end + 1;
  }
  return rules;
}
