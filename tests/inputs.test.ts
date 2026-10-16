import { describe, expect, it } from "vitest";
import { type ComponentInputs, inputGaps, normalizeId, normalizeInputs, parseFields } from "../src/server/tools/index.js";
import { COMPONENT_MAPPINGS } from "../src/mapping/components.generated.js";

describe("입력 정규화 — 모델의 자연스러운 표기를 거부하지 않는다", () => {
  it("컴포넌트 id — 하이픈 표기를 킷 언더스코어 표기로 받아준다 (JSP 실사용 왕복 실측)", () => {
    expect(normalizeId("text-input")).toBe("krds:text_input");
    expect(normalizeId("krds:text-input")).toBe("krds:text_input");
    expect(normalizeId("button")).toBe("krds:button");
    expect(normalizeId("krds:button")).toBe("krds:button");
  });

  it("inputs — 배열·숫자를 문자열로 정규화한다 (React+Vite 실사용 거부 실측)", () => {
    expect(normalizeInputs({ headerTexts: ["번호", "제목", "등록일"] })).toEqual({
      headerTexts: "번호, 제목, 등록일",
    });
    expect(normalizeInputs({ pageCount: 5, labelText: "이름" })).toEqual({
      pageCount: "5",
      labelText: "이름",
    });
    expect(normalizeInputs(undefined)).toEqual({});
  });

  it("inputs — 객체 배열은 항목의 키를 필드로 펼친다 (실사용 거부 7건 중 6건)", () => {
    expect(
      normalizeInputs({
        crumbs: [
          { crumbLabel: "홈", href: "/" },
          { crumbLabel: "민원", href: "/minwon" },
        ],
      }),
    ).toEqual({ crumbLabel: "홈, 민원", href: "/, /minwon" });
    expect(
      normalizeInputs({
        radioGroupName: "gender",
        items: [{ labelText: "남", inputId: "g-m" }, { labelText: "여", inputId: 2 }],
      }),
    ).toEqual({ radioGroupName: "gender", labelText: "남, 여", inputId: "g-m, 2" });
  });

  it("inputs — 한 항목이라도 비면 그 필드는 빈 값이 되어 누락으로 잡힌다", () => {
    const inputs = { crumbs: [{ crumbLabel: "홈", href: "/" }, { crumbLabel: "민원", href: " " }] };
    expect(normalizeInputs(inputs).href).toBe("");
    expect(normalizeInputs(inputs).crumbLabel).toBe("홈, 민원");
    expect(inputGaps(inputs)).toEqual(["crumbs 2번째 항목의 href"]);
  });

  it("inputs — 항목마다 키가 다르면 빠진 항목도 빈 칸이다", () => {
    const inputs: ComponentInputs = { crumbs: [{ crumbLabel: "홈", href: "/" }, { crumbLabel: "민원" }] };
    expect(normalizeInputs(inputs).href).toBe("");
    expect(inputGaps(inputs)).toEqual(["crumbs 2번째 항목의 href"]);
  });

  it("inputs — 최상위 값이 있으면 항목 값보다 우선한다", () => {
    expect(normalizeInputs({ href: "/x", crumbs: [{ href: "/y" }] }).href).toBe("/x");
  });
});

describe("필수 입력 필드 파싱", () => {
  it("쉼표로 나열된 필드를 모두 뽑는다", () => {
    expect(parseFields("labelText, inputId").keys).toEqual(["labelText", "inputId"]);
  });

  it("괄호 설명은 키에서 제외한다", () => {
    expect(parseFields("buttonText (텍스트 변형)").keys).toEqual(["buttonText"]);
  });

  it("백틱 코드 조각도 키에서 제외한다", () => {
    expect(parseFields("tooltipTitle (`h4.tooltip-title`)").keys).toEqual(["tooltipTitle"]);
  });

  it("'+ 로 이어진 필드도 뽑는다", () => {
    expect(parseFields("crumbLabel (각 항목 텍스트) + href").keys).toEqual([
      "crumbLabel",
      "href",
    ]);
  });

  it("조건부 표현이 있으면 optional로 표시한다 — 강제하지 않는다", () => {
    expect(parseFields("(id 사용 시) id").optional).toBe(true);
    expect(parseFields("autocomplete (해당 시)").optional).toBe(true);
    expect(parseFields("groupLabel (그룹 사용 시)").optional).toBe(true);
    expect(parseFields("labelText, inputId").optional).toBe(false);
  });

  it("조건부 필드에서도 키는 정상 추출된다", () => {
    expect(parseFields("(id 사용 시) id").keys).toEqual(["id"]);
  });

  it("설명 낱말(aria)을 키로 오인하지 않는다", () => {
    expect(parseFields("errorMessage + aria 연결").keys).toEqual(["errorMessage"]);
  });

  it("모든 ② 행에서 키를 뽑거나 조건부로 분류된다 — 빈 키로 영구 차단되는 행이 없어야 한다", () => {
    const stuck: string[] = [];
    for (const c of COMPONENT_MAPPINGS) {
      for (const r of c.conditional) {
        const { keys, optional } = parseFields(r.field);
        if (keys.length === 0 && !optional) stuck.push(`${c.componentId}: ${r.field}`);
      }
    }
    expect(stuck).toEqual([]);
  });
});
