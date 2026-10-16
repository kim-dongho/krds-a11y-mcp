// KRDS가 쓰는 클래스 이름 목록 — 킷 CSS(component·common)와 우리 템플릿 동봉 CSS에서 읽는다.
// 다른 CSS(Tailwind 등)가 같은 이름에 규칙을 만들면 KRDS 마크업을 조용히 덮어쓴다.
// 실측(Tailwind 4.3.3): contents(display:contents로 본문 상자 소멸)·border·outline이 파괴적으로 겹친다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { kitRoot } from "../mapping/kit-markup.js";
import { listPatterns, loadPattern } from "../templates/index.js";

/**
 * KRDS와 이름은 같지만 Tailwind 유틸리티의 의미가 같아 덮어써도 무해한 것 (Tailwind 4.3.3 실측).
 * 이것까지 잡으면 Tailwind를 쓰는 모든 화면에 잡음이 된다.
 */
export const HARMLESS_SAME_NAME = new Set(["sr-only", "text-center", "underline", "break-all", "h-auto"]);

let cache: string[] | undefined;

export function krdsClassNames(): string[] {
  if (cache) return cache;
  const names = new Set<string>();
  const collect = (css: string) => {
    for (const m of css.matchAll(/\.([a-zA-Z][\w-]*)/g)) names.add(m[1]!);
  };
  for (const f of ["component/component.css", "common/common.css"]) {
    try {
      collect(readFileSync(join(kitRoot(), "resources", "css", f), "utf8"));
    } catch {
      // 킷 파일을 못 읽으면 템플릿 이름만으로 판정한다
    }
  }
  for (const meta of listPatterns()) {
    const tpl = loadPattern(meta.name)?.template ?? "";
    for (const block of tpl.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) collect(block[1]!);
  }
  cache = [...names].sort();
  return cache;
}
