import { describe, expect, it } from "vitest";
import { ASSEMBLY_NOTES } from "../src/server/tools/index.js";

describe("회귀 — tab 조립 안내", () => {
  it("tab 조립 안내가 킷 결함(nested-interactive)과 교정본 위치를 알린다", async () => {
    const { ASSEMBLY_NOTES } = await import("../src/server/tools/index.js");
    const notes = (ASSEMBLY_NOTES["krds:tab"] ?? []).join(" ");
    expect(notes).toContain("nested-interactive");
    expect(notes).toContain("login-tabs");
  });
});

describe("탭 교정본 키보드 관례", () => {
  it("탭 교정본 스크립트가 roving tabindex와 Home·End를 처리한다", async () => {
    const { ASSEMBLY_NOTES } = await import("../src/server/tools/index.js");
    const notes = (ASSEMBLY_NOTES["krds:tab"] ?? []).join(" ");
    expect(notes).toContain("Home");
    expect(notes).toContain("End");
    expect(notes).toMatch(/tabindex/);
  });
});

describe("필수 표시·오류 정정 조립 지침 (kwcag:7.3.1) — 킷 HTML에 없는 것을 근거와 함께 공급", () => {
  const forms = ["text_input", "select", "textarea", "date_input", "checkbox", "radio_button"];

  it("폼 컴포넌트마다 필수 표시·오류 연결·초점 이동 지침이 붙는다", () => {
    for (const f of forms) {
      const notes = (ASSEMBLY_NOTES[`krds:${f}`] ?? []).join("\n");
      expect(notes, f).toContain("(필수)");
      expect(notes, f).toContain("aria-describedby");
      expect(notes, f).toContain("첫 오류 항목으로 초점");
      expect(notes, f).toContain("KRDS 입력폼 지침");
    }
  });

  it("단일 컨트롤은 aria-invalid, 그룹은 fieldset에 연결한다", () => {
    expect(ASSEMBLY_NOTES["krds:text_input"]!.join("\n")).toContain('aria-invalid="true" aria-describedby="applicant-error"');
    expect(ASSEMBLY_NOTES["krds:select"]!.join("\n")).toContain('<select id="receive-type" class="krds-form-select is-error"'); // 킷 데모처럼 select 자체에
    expect(ASSEMBLY_NOTES["krds:select"]!.join("\n")).not.toContain("신청자 이름"); // 입력란 예시 복사 흔적 제거
    expect(ASSEMBLY_NOTES["krds:checkbox"]!.join("\n")).toContain('<fieldset aria-describedby="agree-error">');
    // 킷이 legend를 숨기므로 화면용 제목을 따로 둔다 (실사용 실측)
    expect(ASSEMBLY_NOTES["krds:checkbox"]!.join("\n")).toContain('<div class="form-tit" aria-hidden="true">약관 동의 (필수)</div>');
    expect(ASSEMBLY_NOTES["krds:radio_button"]!.join("\n")).toContain("legend를 sr-only로 숨기므로");
  });

  it("브레드크럼·페이지네이션은 스캐폴드 교정본이 정본이라고 알린다", () => {
    expect(ASSEMBLY_NOTES["krds:breadcrumb"]!.join("\n")).toContain('aria-current="page"');
    expect(ASSEMBLY_NOTES["krds:pagination"]!.join("\n")).toContain('aria-label="페이지 탐색"');
  });
});

describe("버튼 조립 지침 — 맨 krds-btn 샘플을 그대로 쓴 실사용 (Codex JSP)", () => {
  it("위계·크기 선택, 템플릿 기본값, 묶음 배치, 일관성을 안내한다", () => {
    const notes = ASSEMBLY_NOTES["krds:button"]!.join("\n");
    expect(notes).toContain("위계와 크기 클래스를 골라 붙여라");
    expect(notes).toContain("달리 골라도 된다"); // 강제가 아니라 기본값
    expect(notes).toContain("표 칸 안 동작은 medium"); // 템플릿 실측 (small 아님)
    expect(notes).toContain("page-btn-wrap");
  });
});
