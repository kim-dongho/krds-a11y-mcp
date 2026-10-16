// SPA 가이드 — 처방의 핵심 내용과 정직한 범위 표기를 고정한다.
import { describe, expect, it } from "vitest";
import { NO_ROUTE_REINIT, ROUTE_REINIT_MODULES } from "../src/mapping/kit-behavior.js";
import { FRAMEWORKS, frameworkGuide } from "../src/server/framework-guide.js";

describe("frameworkGuide", () => {
  it("등록된 프레임워크 전부 가이드가 있다", () => {
    for (const f of FRAMEWORKS) {
      expect(frameworkGuide(f), f).toBeDefined();
    }
    expect(frameworkGuide("vue")).toBeUndefined();
  });

  it("react — 검증된 로드 훅(마운트 후 로드 + init 재발행)과 부작용 주의를 담는다", () => {
    const g = frameworkGuide("react")!;
    expect(g).toContain("useKrdsUiScript");
    expect(g).toContain("DOMContentLoaded");
    expect(g).toContain("data-krds-ui-script"); // 중복 로드 가드
    expect(g).toContain("중복 초기화"); // 합성 이벤트 부작용 주의
    expect(g).toContain("<link>"); // CSS 로드 처방
  });

  it("react — 라우트 전환 처방 3: 재발행 금지, 화면 모듈만 init, key 리마운트, 레이아웃 모듈 제외", () => {
    const g = frameworkGuide("react")!;
    expect(g).not.toContain("미검증 영역");
    expect(g).toContain("useKrdsRouteInit");
    expect(g).toContain(`for (const m of [${ROUTE_REINIT_MODULES.join(", ")}]) m.init()`);
    for (const m of ROUTE_REINIT_MODULES) expect(g).toContain(`declare const ${m}: KitModule`);
    expect(g).toContain("<Outlet key={pathname} />");
    for (const m of Object.keys(NO_ROUTE_REINIT)) expect(g).toContain(`\`${m}\``);
    expect(g).toContain("lazy 라우트");
    expect(g).toContain("if (prev.current === pathname) return"); // StrictMode 이중 effect에 첫 화면을 두 번 붙이지 않는다
  });

  it("nextjs — 처방 3은 usePathname으로, url 재검사는 sourceDir로 낡음 판정", () => {
    const g = frameworkGuide("nextjs")!;
    expect(g).toContain("처방 1·2·3");
    expect(g).toContain("sourceDir");
    expect(g).not.toContain("판정할 수 없으므로");
  });

  it("nextjs — 하이드레이션·next/link·라우트 전환 초점 관리를 담는다", () => {
    const g = frameworkGuide("nextjs")!;
    expect(g).toContain("use client");
    expect(g).toContain("next/link");
    expect(g).toContain("usePathname");
    expect(g).toContain("초점");
    expect(g).toContain("document.title");
  });
});

describe("인자 없는 호출", () => {
  it("프레임워크를 안 주면 거부 대신 고를 수 있는 목록을 안내한다", async () => {
    const { frameworkGuideIndex } = await import("../src/server/framework-guide.js");
    const s = frameworkGuideIndex();
    expect(s).toContain("react");
    expect(s).toContain("nextjs");
  });
});
