import type { ComponentInputs } from "../server/tools/inputs.js";

export type RenderResult =
  | { ok: true; html: string }
  /** 만들 수 없으면 추측하지 않고 이유와 함께 거절한다 — 호출부는 킷 원본으로 돌아간다 */
  | { ok: false; reason: string };

export type Renderer = {
  /** 입력 → 교정본 구조에 값을 넣은 마크업. 같은 입력이면 같은 바이트 */
  render(inputs: ComponentInputs): RenderResult;
  /** 필수 입력이 비었을 때 거부 응답 끝에 붙이는 입력 예시 한 줄 */
  example: string;
};
