// 라디오·체크박스 그룹 — 조립 지침의 그룹 교정본 구조
// fieldset·legend(보조기술용) + 화면용 제목 form-tit(aria-hidden): 킷 common.css가 legend를 sr-only로 숨겨
// legend만 두면 "(필수)"가 화면에서 사라진다 (실사용 실측). 오류는 fieldset aria-describedby + input aria-invalid
import type { ComponentInputs } from "../server/tools/inputs.js";
import { escapeHtml as e } from "./escape.js";
import { findItems, isTrue, withRequired, type Item } from "./items.js";
import type { Renderer, RenderResult } from "./types.js";

// name·value가 없으면 생성 마크업 그대로 폼을 제출해도 값이 전송되지 않는다 (실사용에서 직접 덧붙임).
// name은 그룹 이름(없으면 항목의 name, 그것도 없으면 inputId), value는 항목의 value(없으면 inputId)
function input(type: "radio" | "checkbox", it: Item, name: string | undefined, invalid: boolean, required: boolean, describedby?: string): string[] {
  const id = String(it.inputId ?? "");
  const itemName = name || (it.name !== undefined ? String(it.name) : id);
  const attrs = [
    `type="${type}"`,
    `name="${e(itemName)}"`,
    `id="${e(id)}"`,
    `value="${e(it.value !== undefined ? String(it.value) : id)}"`,
    isTrue(it.checked) ? "checked" : "",
    required ? "required" : "",
    invalid ? 'aria-invalid="true"' : "",
    describedby ? `aria-describedby="${e(describedby)}"` : "",
  ].filter(Boolean).join(" ");
  const label = type === "checkbox" ? withRequired(String(it.labelText ?? ""), isTrue(it.required)) : String(it.labelText ?? "");
  return [
    '<div class="krds-form-check">',
    `  <input ${attrs}>`,
    `  <label for="${e(id)}">${e(label)}</label>`,
    "</div>",
  ];
}

const indent = (lines: string[], n: number) => lines.map((l) => " ".repeat(n) + l);

function renderGroup(type: "radio" | "checkbox", inputs: ComponentInputs): RenderResult {
  const items = findItems(inputs, ["labelText", "inputId"]);
  if (!items) return { ok: false, reason: "labelText·inputId 항목 수가 서로 다르다" };
  const groupLabel = inputs.groupLabel !== undefined ? String(inputs.groupLabel) : "";
  const name = type === "radio" ? String(inputs.radioGroupName ?? "") : inputs.groupName !== undefined ? String(inputs.groupName) : undefined;
  const required = isTrue(inputs.required);
  const errorMessage = inputs.errorMessage !== undefined ? String(inputs.errorMessage).trim() : "";
  const invalid = errorMessage.length > 0;

  // 단독 체크박스 — 그룹 레이블이 없으면 fieldset 없이 항목만. 오류는 input이 메시지를 직접 가리킨다
  // (그룹이 없으니 fieldset 연결 대신. 실사용에서 errorMessage가 무시되던 결함)
  if (!groupLabel && type === "checkbox") {
    if (!invalid) return { ok: true, html: items.flatMap((it) => input(type, it, name, false, isTrue(it.required))).join("\n") };
    const errorId = `${name ?? String(items[0]!.inputId ?? "")}-error`;
    const checks = items.flatMap((it) => input(type, it, name, true, isTrue(it.required), errorId));
    return {
      ok: true,
      html: ['<div class="form-group">', ...indent(checks, 2), `  <p class="form-hint-invalid" id="${e(errorId)}">${e(errorMessage)}</p>`, "</div>"].join("\n"),
    };
  }

  const errorId = `${type === "radio" ? name : (name ?? String(items[0]!.inputId ?? ""))}-error`;
  const title = withRequired(groupLabel, required);
  const checks = items.flatMap((it) => input(type, it, name, invalid, type === "radio" ? required : isTrue(it.required)));
  const lines = [
    '<div class="form-group">',
    "  <!-- 화면용 제목 — 킷이 legend를 숨기므로 따로 둔다. 보조기술에는 legend가 읽히니 aria-hidden -->",
    `  <div class="form-tit" aria-hidden="true">${e(title)}</div>`,
    invalid ? `  <fieldset aria-describedby="${e(errorId)}">` : "  <fieldset>",
    `    <legend>${e(title)}</legend>`,
    '    <div class="krds-check-area">',
    ...indent(checks, 6),
    "    </div>",
    "  </fieldset>",
    ...(invalid ? [`  <p class="form-hint-invalid" id="${e(errorId)}">${e(errorMessage)}</p>`] : []),
    "</div>",
  ];
  return { ok: true, html: lines.join("\n") };
}

export const radioButton: Renderer = {
  example:
    'radioGroupName: "receive", groupLabel: "수령 방법", required: true, options: [{labelText: "방문 수령", inputId: "r-visit", value: "visit"}, {labelText: "우편 수령", inputId: "r-mail", value: "mail"}] (오류 상태면 errorMessage, 선택된 항목은 checked: true)',
  render: (inputs) => renderGroup("radio", inputs),
};

export const checkbox: Renderer = {
  example:
    'groupLabel: "약관 동의", groupName: "agree", options: [{labelText: "이용약관 동의", inputId: "agree-terms", value: "terms", required: true}, {labelText: "마케팅 수신 동의", inputId: "agree-mkt", value: "mkt"}] (그룹 없이 하나면 groupLabel 생략, 오류 상태면 errorMessage)',
  render: (inputs) => renderGroup("checkbox", inputs),
};
