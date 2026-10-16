// 입력란·셀렉트 — 조립 지침의 단일 컨트롤 교정본 구조 (레이블 연결, 필수 표시, 오류 aria 연결)
// 입력란은 is-error를 form-conts에, 셀렉트는 킷 데모(select_state.html)처럼 select 자체에 붙인다
import { escapeHtml as e } from "./escape.js";
import { findItems, isTrue, withRequired } from "./items.js";
import type { Renderer } from "./types.js";

const str = (v: unknown) => (v === undefined ? "" : String(v).trim());

export const textInput: Renderer = {
  example: 'labelText: "신청자 이름", inputId: "applicant", required: true, autocomplete: "name" (오류 상태면 errorMessage, 도움말은 hintText)',
  render(inputs) {
    const id = str(inputs.inputId);
    const required = isTrue(inputs.required);
    const error = str(inputs.errorMessage);
    const hint = str(inputs.hintText);
    const describedby = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
    const attrs = [
      'type="text"',
      `id="${e(id)}"`,
      `name="${e(str(inputs.name) || id)}"`,
      'class="krds-input"',
      str(inputs.autocomplete) ? `autocomplete="${e(str(inputs.autocomplete))}"` : "",
      required ? "required" : "",
      error ? 'aria-invalid="true"' : "",
      describedby ? `aria-describedby="${e(describedby)}"` : "",
    ].filter(Boolean).join(" ");
    return {
      ok: true,
      html: [
        '<div class="form-group">',
        `  <div class="form-tit"><label for="${e(id)}">${e(withRequired(str(inputs.labelText), required))}</label></div>`,
        `  <div class="form-conts${error ? " is-error" : ""}">`,
        `    <input ${attrs}>`,
        "  </div>",
        ...(hint ? [`  <p class="form-hint" id="${e(id)}-hint">${e(hint)}</p>`] : []),
        ...(error ? [`  <p class="form-hint-invalid" id="${e(id)}-error">${e(error)}</p>`] : []),
        "</div>",
      ].join("\n"),
    };
  },
};

export const select: Renderer = {
  example: 'labelText: "수령 방법", selectId: "receive-type", required: true, options: [{label: "방문 수령", value: "visit"}, {label: "우편 수령", value: "mail"}] (오류 상태면 errorMessage)',
  render(inputs) {
    const id = str(inputs.selectId);
    const required = isTrue(inputs.required);
    const error = str(inputs.errorMessage);
    const options = findItems(inputs, ["label", "value"]);
    const attrs = [
      `id="${e(id)}"`,
      `name="${e(str(inputs.name) || id)}"`,
      `class="krds-form-select${error ? " is-error" : ""}"`,
      required ? "required" : "",
      error ? `aria-invalid="true" aria-describedby="${e(id)}-error"` : "",
    ].filter(Boolean).join(" ");
    const opts = options
      ? options.map((o) => `      <option value="${e(str(o.value))}"${isTrue(o.selected) ? " selected" : ""}>${e(str(o.label))}</option>`)
      : ["      <!-- 선택지를 채워라: options: [{label, value}] -->"];
    return {
      ok: true,
      html: [
        '<div class="form-group">',
        `  <div class="form-tit"><label for="${e(id)}">${e(withRequired(str(inputs.labelText), required))}</label></div>`,
        '  <div class="form-conts">',
        `    <select ${attrs}>`,
        '      <option value="">선택</option>',
        ...opts,
        "    </select>",
        "  </div>",
        ...(error ? [`  <p class="form-hint-invalid" id="${e(id)}-error">${e(error)}</p>`] : []),
        "</div>",
      ].join("\n"),
    };
  },
};
