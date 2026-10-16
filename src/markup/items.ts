// 입력에서 반복 항목을 찾는다 — 바깥 키 이름(crumbs·items·options…)은 자유다 (입력 규칙)
import type { ComponentInputs } from "../server/tools/inputs.js";

export type Item = Record<string, string | number | boolean>;

const isItemArray = (v: unknown): v is Item[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "object" && x !== null);

/**
 * keys 중 하나라도 가진 첫 객체 배열을 항목으로 쓴다.
 * 객체 배열이 없고 keys가 전부 쉼표 문자열로 왔으면 쉼표로 나눠 항목을 만든다 — 개수가 다르면 null (추측 금지).
 */
export function findItems(inputs: ComponentInputs, keys: string[]): Item[] | null {
  for (const v of Object.values(inputs)) {
    if (isItemArray(v) && v.some((it) => keys.some((k) => k in it))) return v;
  }
  const lists: string[][] = [];
  for (const k of keys) {
    const v = inputs[k];
    if (v === undefined) return null;
    lists.push(Array.isArray(v) ? v.map(String) : String(v).split(",").map((x) => x.trim()));
  }
  const n = lists[0]!.length;
  if (lists.some((l) => l.length !== n)) return null;
  return Array.from({ length: n }, (_, i) => Object.fromEntries(keys.map((k, j) => [k, lists[j]![i]!])));
}

/** 필수 표시를 붙인다 — 레이블에 이미 "(필수)"가 있으면 다시 붙이지 않는다 (실사용에서 "(필수) (필수)" 중복) */
export function withRequired(label: string, required: boolean): string {
  return required && !/\(필수\)\s*$/.test(label) ? `${label} (필수)` : label;
}

/** 불리언 입력 — true와 "true" 둘 다 참 (normalizeInputs를 거친 값과 원래 값 모두) */
export function isTrue(v: unknown): boolean {
  return v === true || v === "true";
}
