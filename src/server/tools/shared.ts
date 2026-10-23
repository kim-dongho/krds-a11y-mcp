// 도구 등록 파일들이 함께 쓰는 응답 헬퍼와 컴포넌트 색인
import { COMPONENT_MAPPINGS } from "../../mapping/components.generated.js";
import { KWCAG_BY_ID } from "../../mapping/index.js";

export const byId = new Map(COMPONENT_MAPPINGS.map((c) => [c.componentId, c]));

export function itemLabel(kwcagId: string): string {
  return `${kwcagId} ${KWCAG_BY_ID.get(kwcagId)?.name ?? ""}`.trim();
}

export function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] };
}

/**
 * 호출이 실패했거나 거부됐다 — isError로 표시해 에이전트·클라이언트가 성공 응답과 구분하게 한다.
 * 본문은 "무엇이 틀렸나 → 어떻게 다시 부르나" 순서로 쓴다
 */
export function errorText(body: string) {
  return { content: [{ type: "text" as const, text: body }], isError: true };
}

/** 도구 annotations — 조회 도구는 읽기 전용, 프로젝트 파일을 쓰거나 지우는 도구는 따로 표시 */
export const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } as const;

/** 오타로 보이는 이름에 가장 가까운 후보 — 없으면 undefined */
export function suggest(input: string, candidates: string[]): string | undefined {
  const a = input.toLowerCase();
  const dist = (b: string) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[]);
    for (let j = 1; j <= b.length; j++) d[0]![j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i]![j] = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length]![b.length]!;
  };
  const scored = candidates
    .map((c) => ({ c, s: c.toLowerCase().includes(a) || a.includes(c.toLowerCase()) ? 0 : dist(c.toLowerCase()) }))
    .sort((x, y) => x.s - y.s);
  const best = scored[0];
  return best && best.s <= Math.max(2, Math.floor(a.length / 3)) ? best.c : undefined;
}
