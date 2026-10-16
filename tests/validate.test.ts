import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveValidateTarget } from "../src/server/validate.js";

describe("validate_page 입력 해석", () => {
  it("아무것도 안 주면 거부한다", () => {
    const r = resolveValidateTarget({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("정확히 하나만");
  });

  it("둘 이상 주면 거부한다", () => {
    const r = resolveValidateTarget({ url: "https://a.example", html: "<html></html>" });
    expect(r.ok).toBe(false);
  });

  it("http(s)가 아닌 url은 거부한다", () => {
    const r = resolveValidateTarget({ url: "ftp://a.example" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("http");
  });

  it("url은 그대로 대상이 된다", () => {
    const r = resolveValidateTarget({ url: "https://a.example/page" });
    expect(r).toMatchObject({ ok: true, url: "https://a.example/page" });
  });

  it("filePath는 절대 경로의 file:// URL이 된다", () => {
    const r = resolveValidateTarget({ filePath: "templates/login-id.preview.html" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toMatch(/^file:\/\/.*templates\/login-id\.preview\.html$/);
      expect(r.note).toBeUndefined(); // 파일 검사는 자산이 해석되므로 경고 없음
    }
  });

  it("html 문자열은 임시 파일로 쓰고 자산 경고를 붙인다", () => {
    const r = resolveValidateTarget({ html: "<!DOCTYPE html><html lang=\"ko\"></html>" });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.url).toMatch(/^file:\/\//);
      expect(r.note).toContain("상대 경로");
      const written = readFileSync(new URL(r.url), "utf8");
      expect(written).toContain("<!DOCTYPE html>");
    }
  });
});

describe("RC 교정 재현 (rc-fixes) — F3 공통부 누락 안내", () => {
  it("공통부 누락이 있으면 결론 앞에 둘 차단 안내 블록을 만든다", async () => {
    const { chromeBanner } = await import("../src/server/validate.js");
    const b = chromeBanner(["사이트 공통부 누락(머리글·바닥글) — x"]);
    expect(b).toContain("gate");
    expect(b).toContain("위반 0이어도");
    expect(chromeBanner(["킷 외 컨트롤 <button>"])).toBeUndefined();
    expect(chromeBanner(undefined)).toBeUndefined();
  });
});

describe("없는 파일 검사", () => {
  it("존재하지 않는 filePath는 검사하지 않고 거부한다 (404 페이지를 검사해 기록이 남던 문제)", () => {
    const r = resolveValidateTarget({ filePath: "/nonexistent-dir-krds/page.html" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("없다");
  });
});
