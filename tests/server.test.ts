import { describe, expect, it } from "vitest";
import { createServer, SERVER_INSTRUCTIONS, SERVER_NAME } from "../src/server/index.js";

describe("createServer", () => {
  it("MCP 서버 인스턴스를 생성한다", () => {
    const server = createServer();
    expect(server).toBeDefined();
    expect(SERVER_NAME).toBe("krds-a11y");
  });
});

describe("SERVER_INSTRUCTIONS — 스택별 실사용에서 수확한 지침이 실려 있다", () => {
  it("비-npm 스택 킷 서빙·컨텍스트 경로·JSP 인코딩·<link> 로드 (JSP 검증 1회전, 2026-10-07)", () => {
    expect(SERVER_INSTRUCTIONS).toContain("문서루트로 복사"); // JSP 킷 서빙
    expect(SERVER_INSTRUCTIONS).toContain("pageContext.request.contextPath"); // 컨텍스트 경로
    expect(SERVER_INSTRUCTIONS).toContain("pageEncoding"); // jspf 인코딩 함정
    expect(SERVER_INSTRUCTIONS).toContain("<link>로 로드"); // 번들러 inline 주입 대신
  });

  it("공통부 기본 동봉(조건부)·시안 유형 확인 (실사용 수확, 격리 SE 검증 5시나리오 통과, 2026-10-12)", () => {
    expect(SERVER_INSTRUCTIONS).toContain("withSiteChrome: true를 기본으로");
    expect(SERVER_INSTRUCTIONS).toContain("공통부를 중복 조립하지 마라"); // SPA 레이아웃 중복 방지 조건
    expect(SERVER_INSTRUCTIONS).toContain("설명 자료(흐름도·도표·구조도)");
    expect(SERVER_INSTRUCTIONS).toContain("물을 수 없는 환경이면"); // 비대화형 폴백
  });

  it("include h1 중복·서블릿 기본 에러 페이지·Tailwind 간격 보정", () => {
    expect(SERVER_INSTRUCTIONS).toContain("h1이 두 개가 되기 쉽다");
    expect(SERVER_INSTRUCTIONS).toContain("error-page");
    expect(SERVER_INSTRUCTIONS).toContain("스택트레이스는 화면에 출력하지 말고");
    expect(SERVER_INSTRUCTIONS).toContain("--spacing: 0.4rem");
    expect(SERVER_INSTRUCTIONS).toContain("62.5%");
  });

  it("Tailwind 무계층 로드·데모 레이아웃 클래스 금지 (React+Vite 검증, 2026-10-06)", () => {
    expect(SERVER_INSTRUCTIONS).toContain("layer 래핑 없이"); // 무계층 로드 (prefix(tw)와 함께)
    expect(SERVER_INSTRUCTIONS).toContain("page-title-wrap");
  });
});

describe("Tailwind 클래스 이름 충돌·공통 수정 후 재검사 지침", () => {
  it("Tailwind와 함께 쓸 때 테마 import에 prefix(tw)를 걸도록 안내한다 (contents·border·outline 충돌 실측)", () => {
    expect(SERVER_INSTRUCTIONS).toContain('@import "tailwindcss/theme.css" layer(theme) prefix(tw);');
    expect(SERVER_INSTRUCTIONS).toContain("contents");
  });

  it("공통 CSS·레이아웃을 고치면 이미 검사한 화면을 전부 재검사하라고 안내한다", () => {
    expect(SERVER_INSTRUCTIONS).toContain("이미 검사한 화면을 전부");
  });
});
