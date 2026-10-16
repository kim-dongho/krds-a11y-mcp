// 생성 마크업 층 — get_component 입력값을 교정본 구조에 넣은 마크업을 만든다 (순수 함수, 브라우저 의존 없음)
import type { ComponentInputs } from "../server/tools/inputs.js";
import type { Renderer, RenderResult } from "./types.js";
import { breadcrumb } from "./breadcrumb.js";
import { pagination } from "./pagination.js";
import { checkbox, radioButton } from "./choice-group.js";
import { select, textInput } from "./form-control.js";

/** 렌더러가 있는 컴포넌트만 생성 마크업을 준다 — 나머지는 지금처럼 킷 원본 */
export const RENDERERS: Record<string, Renderer> = {
  "krds:breadcrumb": breadcrumb,
  "krds:pagination": pagination,
  "krds:radio_button": radioButton,
  "krds:checkbox": checkbox,
  "krds:text_input": textInput,
  "krds:select": select,
};

/** 렌더러가 없으면 undefined. 렌더러가 던지면 ok:false로 감싼다 */
export function renderComponent(id: string, inputs: ComponentInputs): RenderResult | undefined {
  const r = RENDERERS[id];
  if (!r) return undefined;
  try {
    return r.render(inputs);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export { escapeHtml } from "./escape.js";
export { findItems, isTrue, withRequired, type Item } from "./items.js";
export type { Renderer, RenderResult } from "./types.js";
