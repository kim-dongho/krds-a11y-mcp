// 킷 디자인 토큰 조회 — krds_tokens.css의 커스텀 프로퍼티를 파싱해 도구로 공급한다.
// 실사용 세션이 색 토큰을 알려고 node_modules를 grep으로 6회 탐색한 수요를 흡수 (2026-10-06).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { kitRoot } from "./kit-markup.js";

export type KitToken = {
  name: string;
  /** 선언된 값 그대로 — var(...) 참조일 수 있다 */
  value: string;
  /** var() 체인을 끝까지 푼 실제 값 (hex·px 등). 참조가 끊기면 undefined */
  resolved?: string;
};

let cache: Map<string, string> | undefined;

/** 토큰 파일의 모든 커스텀 프로퍼티 선언 — 선언 순서 유지 */
function tokenMap(): Map<string, string> {
  if (cache) return cache;
  const css = readFileSync(
    join(kitRoot(), "resources", "css", "token", "krds_tokens.css"),
    "utf8",
  );
  cache = new Map();
  for (const m of css.matchAll(/(--krds-[\w-]+)\s*:\s*([^;]+);/g)) {
    cache.set(m[1]!, m[2]!.trim());
  }
  return cache;
}

/** var(--x) 참조를 끝까지 푼다 — 순환·끊긴 참조는 undefined */
function resolveValue(value: string, map: Map<string, string>, depth = 0): string | undefined {
  if (depth > 10) return undefined;
  const ref = value.match(/^var\((--krds-[\w-]+)\)$/);
  if (!ref) return value;
  const next = map.get(ref[1]!);
  return next === undefined ? undefined : resolveValue(next, map, depth + 1);
}

/**
 * 토큰 검색 — query의 공백 구분 낱말이 전부 이름에 들어간 토큰을 선언 순서로 반환한다.
 * 예: "light color text" → --krds-light-color-text-basic 등
 */
export function listTokens(query: string): KitToken[] {
  const map = tokenMap();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const out: KitToken[] = [];
  for (const [name, value] of map) {
    if (!words.every((w) => name.toLowerCase().includes(w))) continue;
    const resolved = resolveValue(value, map);
    out.push({ name, value, ...(resolved !== undefined && resolved !== value ? { resolved } : {}) });
  }
  return out;
}

/** 질의 없이 호출할 때의 안내 — 전체 덤프 대신 분류와 검색 예시 */
export function tokenSummary(): string {
  const map = tokenMap();
  const groups = new Map<string, number>();
  for (const name of map.keys()) {
    // --krds-{광역 분류}-{하위} 의 앞 두 조각으로 묶는다
    const g = name.split("-").slice(2, 4).join("-");
    groups.set(g, (groups.get(g) ?? 0) + 1);
  }
  const lines = [...groups.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g, n]) => `- ${g} (${n}개)`);
  return [
    `킷 토큰 ${map.size}개 (krds_tokens.css). query로 좁혀 조회하라 — 공백 구분 낱말 전부 포함 매칭.`,
    "",
    "분류별 개수:",
    ...lines,
    "",
    "검색 예시:",
    '- 글자색: query="light-color text"',
    '- 포인트색: query="light-color primary"',
    '- 간격: query="pc-gap" 또는 "padding"',
    '- 글자 크기: query="pc-font body"',
  ].join("\n");
}
