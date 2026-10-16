import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { KIT_BEHAVIOR, kitBehaviorLines } from "../src/mapping/kit-behavior.js";
import { COMPONENT_MAPPINGS } from "../src/mapping/components.generated.js";

const require = createRequire(import.meta.url);
const kitRoot = dirname(require.resolve("krds-uiux/package.json"));
const script = readFileSync(join(kitRoot, "resources/js/component/ui-script.js"), "utf8");

// 킷이 개정되면 여기서 깨진다 — 표를 킷에 맞춰 다시 확인하라
describe("킷 동작 표가 설치된 킷 ui-script.js와 맞는다", () => {
  const ids = new Set(COMPONENT_MAPPINGS.map((c) => c.componentId));

  for (const [id, b] of Object.entries(KIT_BEHAVIOR)) {
    it(`${id} (${b.module})`, () => {
      expect(ids.has(id), "매핑표에 있는 컴포넌트 id").toBe(true);
      expect(script).toContain(`const ${b.module} = {`);
      expect(script).toContain(`${b.module}.init()`);
      expect(script).toContain(b.selector);
      for (const c of b.stateClasses) {
        expect(script, `${b.module}의 ${c.name}`).toMatch(new RegExp(`["'\\s.]${c.name}["'\\s:.]`));
      }
    });
  }

  it("다시 초기화해도 안전하다고 적은 모듈에는 실제로 중복 방지가 있다", () => {
    expect(script).toContain("tab.dataset.listenerAttached"); // krds_tab
    expect(script).toContain("this.accordionHandlers.get(button)"); // krds_accordion
    for (const [id, b] of Object.entries(KIT_BEHAVIOR)) {
      if (b.rebindSafe) expect(["krds:tab", "krds:accordion"], id).toContain(id);
    }
  });
});

describe("get_component 출력용 동작 절", () => {
  it("상태 클래스·초기화 선택자·재초기화 경고를 담는다", () => {
    const text = kitBehaviorLines("krds:modal").join("\n");
    expect(text).toContain("krds_modal");
    expect(text).toContain("`.open-modal`");
    expect(text).toContain("`shown`");
    expect(text).toContain("리스너가 중복된다");
  });

  it("React가 상태를 소유할 때 끄는 법 — 근거가 킷 코드에 있다 (React 실사용에서 킷 JS를 열어 본 지점)", () => {
    expect(script).toContain("if (!tab.dataset.listenerAttached)"); // 탭
    expect(script).toContain("if (!this.modalOpenTriggers.length || !this.modalCloseTriggers.length) return;"); // 모달
    expect(script).toContain("accordionHeader-id-"); // 아코디언 — 무작위 id 덮어쓰기
    expect(kitBehaviorLines("krds:modal").join("\n")).toContain("open-modal 클래스를 쓰지 않으면");
    // 실측: init 뒤 마운트하면 킷이 붙지 않는다 (React 실사용 재테스트에서 "끄는 방법 없음" 안내가 틀린 것으로 확인)
    expect(script).toContain('this.accordionButtons = document.querySelectorAll(".btn-accordion");'); // init 시점 조회, 위임 없음
    expect(kitBehaviorLines("krds:accordion").join("\n")).toContain("끝난 뒤에 아코디언을 마운트하면 킷이 붙지 않는다");
    expect(kitBehaviorLines("krds:accordion").join("\n")).not.toContain("끄는 방법이 없다");
  });

  it("동작 정보가 없는 컴포넌트는 절을 만들지 않는다", () => {
    expect(kitBehaviorLines("krds:button")).toEqual([]);
  });
});
