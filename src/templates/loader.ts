// 패턴 템플릿 로더·치환기 (순수 로직 — 브라우저 불필요)
// 템플릿은 큐레이션 산출물이다: templates/<name>.html + <name>.meta.json
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { escapeHtml } from "../markup/escape.js";

export type SlotDef = {
  name: string;
  required: boolean;
  description: string;
  kwcagId?: string;
  default?: string;
};

export type PatternMeta = {
  name: string;
  title: string;
  /** 화면 계열 — 같은 계열에 변형이 여럿이면 도구가 선택 안내를 낸다 */
  family?: string;
  /** 이 변형을 언제 쓰는지 — 선택 안내문의 재료 */
  whenToUse?: string;
  source: {
    docUrl: string;
    sampleUrl: string | null;
    collectedAt: string | null;
    sha256: string | null;
  };
  corrections: { what: string; why: string; kwcagId?: string }[];
  /** 레이아웃 CSS 발췌 출처 — 손 재작성 금지 원칙의 기록 (extract-pattern-css.ts) */
  layoutCss?: { note: string; sourceUrl: string };
  /** 시각 검증(verify-pattern-visual.ts)이 원본과 치수를 대조할 구조 컨테이너.
      문자열은 위치+폭, positionOnly는 위치만 (fit-content 박스는 폭이 콘텐츠를 따라간다) */
  visualCompare?: (string | { sel: string; positionOnly: true })[];
  slots: SlotDef[];
  dietNote?: string;
};

export type RenderedPattern = {
  meta: PatternMeta;
  html: string;
  usedDefaults: string[];
};

/** 소스(src/)에서도 번들(dist/)에서도 패키지 루트의 templates/를 찾는다 */
function templatesDir(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    const candidate = join(dir, "templates");
    if (existsSync(join(dir, "package.json")) && existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error("templates/ 디렉토리를 찾지 못했다 — 패키지 구조 확인 필요");
}

export function listPatterns(): PatternMeta[] {
  const dir = templatesDir();
  return readdirSync(dir)
    .filter((f) => f.endsWith(".meta.json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as PatternMeta);
}

export function loadPattern(name: string): { meta: PatternMeta; template: string } | null {
  const dir = templatesDir();
  const metaPath = join(dir, `${name}.meta.json`);
  const htmlPath = join(dir, `${name}.html`);
  if (!existsSync(metaPath) || !existsSync(htmlPath)) return null;
  return {
    meta: JSON.parse(readFileSync(metaPath, "utf8")) as PatternMeta,
    template: readFileSync(htmlPath, "utf8"),
  };
}


export function renderPattern(
  name: string,
  slots: Record<string, string>,
): { ok: true; result: RenderedPattern } | { ok: false; missing: SlotDef[] } | null {
  const loaded = loadPattern(name);
  if (!loaded) return null;
  const { meta, template } = loaded;

  const missing = meta.slots.filter(
    (s) => s.required && !slots[s.name]?.trim(),
  );
  if (missing.length > 0) return { ok: false, missing };

  const usedDefaults: string[] = [];
  let html = template;
  for (const slot of meta.slots) {
    let value = slots[slot.name];
    if (value === undefined || value.trim() === "") {
      value = slot.default ?? "";
      if (slot.default !== undefined) usedDefaults.push(slot.name);
    }
    html = html.replaceAll(`{{${slot.name}}}`, escapeHtml(value));
  }

  // 메타에 없는 슬롯이 템플릿에 남아 있으면 정합 깨짐 — 이중 방어 (1차는 대조 테스트)
  const leftover = html.match(/\{\{[a-zA-Z0-9_]+\}\}/);
  if (leftover) {
    throw new Error(`템플릿에 메타 미정의 슬롯이 남았다: ${leftover[0]} (${name})`);
  }
  return { ok: true, result: { meta, html, usedDefaults } };
}

/** 계열 해석 — 이름이 정확히 맞으면 그 패턴, 계열명이면 소속 변형들 */
export function resolvePattern(
  nameOrFamily: string,
): { kind: "exact"; meta: PatternMeta } | { kind: "family"; variants: PatternMeta[] } | { kind: "none" } {
  const all = listPatterns();
  const exact = all.find((m) => m.name === nameOrFamily);
  if (exact) return { kind: "exact", meta: exact };
  const variants = all.filter((m) => m.family === nameOrFamily);
  if (variants.length === 1) return { kind: "exact", meta: variants[0]! };
  if (variants.length > 1) return { kind: "family", variants };
  return { kind: "none" };
}
