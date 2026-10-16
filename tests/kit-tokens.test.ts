// 킷 토큰 조회 — 파싱·검색·var() 체인 해석을 실제 킷 파일로 고정한다.
import { describe, expect, it } from "vitest";
import { listTokens, tokenSummary } from "../src/mapping/kit-tokens.js";

describe("listTokens", () => {
  it("공백 구분 낱말 전부 포함으로 검색한다", () => {
    const hits = listTokens("light-color text");
    expect(hits.length).toBeGreaterThan(0);
    for (const t of hits) {
      expect(t.name).toContain("light-color");
      expect(t.name).toContain("text");
    }
  });

  it("var() 참조 토큰은 실제 값까지 푼다", () => {
    const semantic = listTokens("light-color").filter((t) => t.value.startsWith("var("));
    expect(semantic.length).toBeGreaterThan(0);
    for (const t of semantic) {
      expect(t.resolved).toBeDefined();
      expect(t.resolved).not.toContain("var(");
    }
  });

  it("원시 팔레트 토큰은 선언값이 곧 최종값 — resolved를 중복으로 달지 않는다", () => {
    const prim = listTokens("color-light-primary-50");
    expect(prim).toHaveLength(1);
    expect(prim[0]!.value).toMatch(/^#/);
    expect(prim[0]!.resolved).toBeUndefined();
  });

  it("셀렉트 기본색 교정에 쓴 충족 토큰이 조회된다 (실사용 처방의 근거)", () => {
    // 매핑표의 셀렉트 색 교정(8.68:1)이 참조하는 의미 토큰 계열이 존재해야 한다
    expect(listTokens("light-color text basic").length).toBeGreaterThan(0);
  });

  it("없는 검색어는 빈 배열", () => {
    expect(listTokens("존재하지않는토큰이름")).toEqual([]);
  });
});

describe("tokenSummary", () => {
  it("전체 개수·분류·검색 예시를 안내한다 (전체 덤프 금지)", () => {
    const s = tokenSummary();
    expect(s).toMatch(/킷 토큰 \d{3,}개/);
    expect(s).toContain("검색 예시");
    expect(s.length).toBeLessThan(2000); // 덤프가 아니라 안내여야 한다
  });
});
