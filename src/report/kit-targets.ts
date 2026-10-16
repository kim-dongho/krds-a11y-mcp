import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { Target } from "./types.js";

// 킷 html/code/*.html 파일명 → 정규 컴포넌트 귀속.
// 원본: docs/mapping/krds-components.md (43종). 파일명이 base로 시작하면 그 컴포넌트의 변형.
const COMPONENT_BASES = [
  "masthead", "identifier", "header", "footer", "skip_link", "main_menu",
  "side_navigation", "breadcrumb", "in_page_navigation", "pagination",
  "button", "link", "text_input", "textarea", "select", "checkbox",
  "radio_button", "toggle_switch", "date_input", "calendar", "file_upload",
  "accordion", "tab", "carousel", "modal", "disclosure", "tooltip",
  "coach_mark", "contextual_help", "help_panel", "tutorial_panel",
  "critical_alerts", "badge", "tag", "spinner", "step_indicator",
  "structured_list", "table", "text_list", "language_switcher", "resize",
  "tts", "favicon",
] as const;

// prefix 규칙으로 못 잡는 예외 (radio_chip.html 등은 radio_button 소속)
const SPECIAL: Record<string, string> = {
  radio_chip: "radio_button",
  radio_size: "radio_button",
};

/** "table"보다 "text_list"처럼 긴 base를 먼저 대조 — tab/table 류 오귀속 방지 */
const BASES_BY_LENGTH = [...COMPONENT_BASES].sort((a, b) => b.length - a.length);

export function componentIdOf(fileBase: string): string | undefined {
  if (SPECIAL[fileBase]) return `krds:${SPECIAL[fileBase]}`;
  const base = BASES_BY_LENGTH.find(
    (b) => fileBase === b || fileBase.startsWith(`${b}_`),
  );
  return base ? `krds:${base}` : undefined;
}

/** 킷 클론의 html/code/*.html 전체를 검사 대상으로 변환한다 */
export function kitTargets(kitPath: string): Target[] {
  const dir = join(kitPath, "html", "code");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .sort();
  return files.map((f) => {
    const fileBase = f.replace(/\.html$/, "");
    return {
      id: `kit:${fileBase}`,
      kind: "kit-demo" as const,
      url: join(dir, f), // runner가 조각을 하네스로 감싸므로 파일 경로 그대로
      componentId: componentIdOf(fileBase),
      variant: "as-is" as const,
    };
  });
}
