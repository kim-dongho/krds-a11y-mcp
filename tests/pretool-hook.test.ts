// PreToolUse 판정을 고정한다: 임시 검사 스크립트·킷 원본 수정은 차단,
// 정상 설정 파일(.eslintrc.js 등)과 일반 작업은 오탐 없이 허용.
import { describe, expect, it } from "vitest";
import { judgeToolUse } from "../src/gate/pretool-hook.js";

// 픽스처 경로는 /proj 아래 — 프로젝트 루트를 /proj로 고정한다 (rc-fixes F6 이후 루트 인자 필요)
function blocked(tool: string, path: string): boolean {
  return !judgeToolUse(tool, path, "/proj").allow;
}

describe("judgeToolUse — 차단", () => {
  it("실측된 임시 검사 스크립트 이름들", () => {
    expect(blocked("Write", "/proj/.axe-check.mjs")).toBe(true);
    expect(blocked("Write", "/proj/.fix-icon-path.mjs")).toBe(true);
    expect(blocked("Write", "/proj/.inspect-breadcrumb.mjs")).toBe(true);
    expect(blocked("Write", "/proj/.contrast-probe.js")).toBe(true);
    expect(blocked("Edit", "/proj/.a11y-scan.ts")).toBe(true);
  });

  it("킷 원본 수정 — Write·Edit 모두, 윈도우 경로 구분자 포함", () => {
    expect(blocked("Write", "/proj/node_modules/krds-uiux/html/css/style.css")).toBe(true);
    expect(blocked("Edit", "/proj/node_modules/krds-uiux/html/js/component.js")).toBe(true);
    expect(blocked("Edit", "C:\\proj\\node_modules\\krds-uiux\\html\\css\\style.css")).toBe(true);
  });

  it("문서루트로 복사된 킷(krds-uiux/resources/)도 보호한다 — JSP 서빙 복사본", () => {
    expect(blocked("Edit", "/proj/webapp/krds-uiux/resources/css/component/component.css")).toBe(true);
    expect(blocked("Write", "/proj/public/krds-uiux/resources/img/icon/ico_angle.svg")).toBe(true);
    expect(blocked("Edit", "C:\\proj\\webapp\\krds-uiux\\resources\\js\\ui-script.js")).toBe(true);
  });

  it("점 접두 없는 DIY 검사 스크립트 — 접근성 어휘가 토큰으로 들어가면 차단", () => {
    expect(blocked("Write", "/proj/a11y-scan.mjs")).toBe(true);
    expect(blocked("Write", "/proj/scan-axe.js")).toBe(true);
    expect(blocked("Write", "/proj/check_wcag.ts")).toBe(true);
    expect(blocked("Write", "/proj/contrast-probe.cjs")).toBe(true);
  });

  it("차단 사유에 대체 도구 처방이 들어 있다", () => {
    const v = judgeToolUse("Write", "/proj/.axe-check.mjs", "/proj");
    expect(v.allow).toBe(false);
    if (!v.allow) expect(v.reason).toContain("validate_page");
    const k = judgeToolUse("Edit", "/proj/node_modules/krds-uiux/a.css", "/proj");
    if (!k.allow) expect(k.reason).toContain("get_icon_fix_css");
  });
});

describe("judgeToolUse — 오탐 방지", () => {
  it("정상 숨김 설정 파일은 허용", () => {
    expect(blocked("Write", "/proj/.eslintrc.js")).toBe(false);
    expect(blocked("Write", "/proj/.prettierrc.mjs")).toBe(false);
    expect(blocked("Write", "/proj/.lintstagedrc.cjs")).toBe(false);
  });

  it("일반 소스·페이지 파일은 허용", () => {
    expect(blocked("Write", "/proj/src/pages/login.tsx")).toBe(false);
    expect(blocked("Write", "/proj/public/krds-fix.css")).toBe(false);
    expect(blocked("Edit", "/proj/app/inspect-report-view.tsx")).toBe(false);
  });

  it("다른 krds 경로(킷 resources/ 트리가 아닌 자기 폴더)는 허용", () => {
    expect(blocked("Write", "/proj/src/krds-uiux/custom.css")).toBe(false);
  });

  it("접근성 어휘 부분 문자열·범용 단어는 오탐하지 않는다", () => {
    expect(blocked("Write", "/proj/taxes.js")).toBe(false); // axe 부분 문자열
    expect(blocked("Write", "/proj/fix-typo.ts")).toBe(false); // 범용 단어는 점 접두에서만
    expect(blocked("Write", "/proj/scan-documents.ts")).toBe(false);
    expect(blocked("Write", "/proj/axe-logo.png")).toBe(false); // 스크립트 확장자 아님
  });

  it("읽기 도구·경로 없음은 항상 허용", () => {
    expect(judgeToolUse("Read", "/proj/node_modules/krds-uiux/style.css").allow).toBe(true);
    expect(judgeToolUse("Bash", undefined).allow).toBe(true);
    expect(judgeToolUse("Write", undefined).allow).toBe(true);
  });
});

describe("RC 교정 재현 (rc-fixes) — F6 프로젝트 밖 임시 스크립트", () => {
  it("프로젝트 밖(시스템 임시 디렉터리)의 검사 스크립트는 허용 — 차단 문구가 권하는 길", () => {
    expect(judgeToolUse("Write", "/tmp/x/.axe-check.mjs", "/proj").allow).toBe(true);
    expect(judgeToolUse("Write", "/private/var/folders/ab/T/a11y-scan.mjs", "/proj").allow).toBe(true);
  });

  it("프로젝트 안은 계속 차단", () => {
    expect(judgeToolUse("Write", "/proj/.axe-check.mjs", "/proj").allow).toBe(false);
    expect(judgeToolUse("Write", "/proj/sub/a11y-scan.mjs", "/proj").allow).toBe(false);
  });

  it("킷 원본·복사본 보호는 위치 무관", () => {
    expect(judgeToolUse("Edit", "/elsewhere/node_modules/krds-uiux/a.css", "/proj").allow).toBe(false);
    expect(judgeToolUse("Edit", "/elsewhere/webapp/krds-uiux/resources/css/x.css", "/proj").allow).toBe(false);
  });
});

describe("Codex apply_patch (codex-support)", () => {
  const patch = (body: string) => `*** Begin Patch\n${body}\n*** End Patch`;

  it("패치 본문에서 Add·Update·Delete·Move to 경로를 모두 뽑는다", async () => {
    const { extractPatchPaths } = await import("../src/gate/pretool-hook.js");
    expect(
      extractPatchPaths(patch("*** Add File: src/a.ts\n+x\n*** Update File: src/b.css\n*** Move to: src/c.css\n@@\n*** Delete File: old.js")),
    ).toEqual(["src/a.ts", "src/b.css", "src/c.css", "old.js"]);
  });

  it("apply_patch로 프로젝트 안 검사 스크립트를 추가하면 차단", async () => {
    const { judgeHookInput } = await import("../src/gate/pretool-hook.js");
    const v = judgeHookInput({ tool_name: "apply_patch", tool_input: { command: patch("*** Add File: .axe-check.mjs\n+x") }, cwd: "/proj" });
    expect(v.allow).toBe(false);
  });

  it("apply_patch로 킷 원본을 고치면 차단", async () => {
    const { judgeHookInput } = await import("../src/gate/pretool-hook.js");
    const v = judgeHookInput({ tool_name: "apply_patch", tool_input: { command: patch("*** Update File: node_modules/krds-uiux/resources/css/x.css\n@@") }, cwd: "/proj" });
    expect(v.allow).toBe(false);
  });

  it("정상 파일 여러 개 패치는 허용, 정상·금지가 섞이면 차단", async () => {
    const { judgeHookInput } = await import("../src/gate/pretool-hook.js");
    const ok = judgeHookInput({ tool_name: "apply_patch", tool_input: { command: patch("*** Add File: src/page.tsx\n+x\n*** Update File: src/app.css\n@@") }, cwd: "/proj" });
    expect(ok.allow).toBe(true);
    const mixed = judgeHookInput({ tool_name: "apply_patch", tool_input: { command: patch("*** Add File: src/page.tsx\n+x\n*** Add File: a11y-scan.mjs\n+y") }, cwd: "/proj" });
    expect(mixed.allow).toBe(false);
  });

  it("Claude Code 입력(Write·file_path)은 기존대로 판정한다", async () => {
    const { judgeHookInput } = await import("../src/gate/pretool-hook.js");
    expect(judgeHookInput({ tool_name: "Write", tool_input: { file_path: "/proj/.axe-check.mjs" } }, { CLAUDE_PROJECT_DIR: "/proj" }).allow).toBe(false);
    expect(judgeHookInput({ tool_name: "Write", tool_input: { file_path: "/proj/src/a.tsx" } }, { CLAUDE_PROJECT_DIR: "/proj" }).allow).toBe(true);
  });
});
