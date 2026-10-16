import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listPatterns, loadPattern, renderPattern } from "../src/templates/index.js";

const REQUIRED_LOGIN = { pageTitle: "로그인", loginAction: "/login" };

describe("템플릿-메타 정합 (전 패턴)", () => {
  const patterns = listPatterns();

  it("패턴이 1개 이상 있다", () => {
    expect(patterns.length).toBeGreaterThan(0);
  });

  for (const meta of listPatterns()) {
    describe(meta.name, () => {
      const { template } = loadPattern(meta.name)!;

      it("슬롯 양방향 대조 — 템플릿 {{...}} ↔ meta.slots 1:1", () => {
        const inTemplate = [...new Set([...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1]!))];
        const inMeta = meta.slots.map((s) => s.name);
        expect([...inTemplate].sort()).toEqual([...inMeta].sort());
      });

      it("크기 예산 — 손 작성분 250줄 · 10KB 이하 (다이어트 강제, 발췌 CSS·교정 스크립트 제외)", () => {
        const handWritten = template
          .replace(/\/\* ==== 원본 패턴 CSS 발췌 시작[\s\S]*?발췌 끝 ==== \*\//, "")
          // 교정 스크립트(킷 결함 우회 부속)도 마크업 예산에서 제외 — 시작 주석이 '// 교정:'인 블록만
          .replace(/<script>\s*\/\/ 교정:[\s\S]*?<\/script>/, "");
        expect(handWritten.split("\n").length).toBeLessThanOrEqual(250);
        expect(Buffer.byteLength(handWritten, "utf8")).toBeLessThanOrEqual(10 * 1024);
      });

      it("레이아웃 CSS는 손 재작성 금지 — 발췌 블록이 존재하고 출처가 기록돼 있다", () => {
        expect(template).toContain("원본 패턴 CSS 발췌 시작");
        expect(template).toMatch(/출처: https:\/\/www\.krds\.go\.kr\/resources\/css\/pattern\/output\.css/);
        expect(template).toMatch(/sha256: [0-9a-f]{64}/);
      });

      it("패턴 마커 존재", () => {
        expect(template).toContain(`data-krds-pattern="${meta.name}"`);
      });

      it("교정의 뼈대 요소 — 건너뛰기·main·확대 허용", () => {
        expect(template).toContain('href="#main-content"');
        expect(template).toContain('id="main-content" tabindex="-1"');
        expect(template).not.toMatch(/user-scalable\s*=\s*no/);
      });

      it("출처와 교정 내역이 기록돼 있다", () => {
        expect(meta.source.docUrl).toMatch(/^https:\/\/www\.krds\.go\.kr\//);
        expect(meta.corrections.length).toBeGreaterThan(0);
      });

      it("시각 검증 대상(visualCompare)이 등록돼 있다", () => {
        expect(meta.visualCompare?.length ?? 0).toBeGreaterThan(0);
      });
    });
  }
});

describe("치환기", () => {
  it("필수 슬롯 미충족 → missing 반환 (마크업 미제공 근거)", () => {
    const r = renderPattern("login-id", { pageTitle: "로그인" });
    expect(r).not.toBeNull();
    if (r!.ok) throw new Error("미충족인데 ok");
    expect(r!.missing.map((m) => m.name)).toEqual(["loginAction"]);
  });

  it("충족 시 슬롯이 치환되고 잔여 {{ 가 없다", () => {
    const r = renderPattern("login-id", REQUIRED_LOGIN);
    if (!r?.ok) throw new Error("충족인데 실패");
    expect(r.result.html).toContain("<title>로그인</title>");
    expect(r.result.html).toContain('action="/login"');
    expect(r.result.html).not.toMatch(/\{\{/);
  });

  it("선택 슬롯은 기본값으로 채워지고 usedDefaults에 기록된다", () => {
    const r = renderPattern("login-id", REQUIRED_LOGIN);
    if (!r?.ok) throw new Error();
    expect(r.result.usedDefaults).toContain("idFindHref");
    expect(r.result.html).toContain('lang="ko"');
  });

  it("슬롯 값은 HTML 이스케이프된다 — 마크업 주입 금지", () => {
    const r = renderPattern("login-id", { ...REQUIRED_LOGIN, pageTitle: '<script>x</script>' });
    if (!r?.ok) throw new Error();
    expect(r.result.html).not.toContain("<script>x");
    expect(r.result.html).toContain("&lt;script&gt;");
  });

  it("없는 패턴은 null", () => {
    expect(renderPattern("nope", {})).toBeNull();
  });
});

describe("배포 포함", () => {
  it("package.json files에 templates가 있다", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      files: string[];
    };
    expect(pkg.files).toContain("templates");
  });
});
