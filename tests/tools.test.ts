import { describe, expect, it } from "vitest";
import { COMPONENT_MAPPINGS } from "../src/mapping/components.generated.js";
import { kitVersion, listMarkupFiles, readMarkup, variantsOf } from "../src/mapping/kit-markup.js";

describe("킷 마크업 공급", () => {
  it("의존성에서 킷 버전을 읽는다", () => {
    expect(kitVersion()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("기본 마크업을 읽는다", () => {
    const r = readMarkup("krds:button");
    expect(r.file).toBe("html/code/button.html");
    expect(r.html).toContain("<button");
  });

  it("변형 마크업을 읽는다", () => {
    expect(readMarkup("krds:button", "icon").file).toBe("html/code/button_icon.html");
  });

  it("없는 변형은 사용 가능한 파일을 알려주는 오류를 낸다", () => {
    expect(() => readMarkup("krds:button", "nope")).toThrow(/사용 가능한 파일/);
  });

  it("기본 마크업이 없는 컴포넌트는 변형을 고르라고 안내한다", () => {
    expect(() => readMarkup("krds:main_menu")).toThrow(/variant를 지정하라: mobile, pc/);
    expect(variantsOf("krds:main_menu")).toEqual(["mobile", "pc"]);
  });

  it("컴포넌트의 킷 파일 목록을 준다", () => {
    expect(listMarkupFiles("krds:button")).toContain("button_icon.html");
  });

  it("매핑된 43종 전부 기본 마크업 또는 변형이 존재한다", () => {
    const missing = COMPONENT_MAPPINGS.filter(
      (c) => listMarkupFiles(c.componentId).length === 0,
    ).map((c) => c.componentId);
    expect(missing).toEqual([]);
  });
});
