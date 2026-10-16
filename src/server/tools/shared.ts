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
