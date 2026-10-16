import { describe, expect, it } from "vitest";
import { pageBlock } from "../src/server/tools/index.js";
import { assembleSiteChrome, buildScaffold, SCAFFOLD_COVERS, splitScaffold } from "../src/server/scaffold.js";
import { listPatterns, renderPattern } from "../src/templates/index.js";

describe("페이지 뼈대", () => {
  const html = buildScaffold({ pageTitle: "로그인" });

  it("lang·title·건너뛰기 링크·본문 시작점을 갖춘다", () => {
    expect(html).toContain('<html lang="ko">');
    expect(html).toContain("<title>로그인</title>");
    expect(html).toContain('href="#main-content"');
    expect(html).toContain('<main id="main-content" tabindex="-1">');
  });

  it("Pretendard GOV @font-face를 킷 동봉 파일로 선언한다 — 킷 CSS에는 선언이 없다", () => {
    expect(html.match(/@font-face \{/g)?.length).toBe(3);
    expect(html).toContain("PretendardGOV-Regular.subset.woff2");
  });

  it("assetBase를 바꾸면 모든 자산 경로가 따라간다", () => {
    const cdn = buildScaffold({ pageTitle: "t", assetBase: "https://cdn.example/krds" });
    expect(cdn).not.toContain("node_modules");
    expect(cdn).toContain("https://cdn.example/krds/resources/css/common/common.css");
  });

  it("swiper는 캐러셀을 쓸 때만 포함된다", () => {
    expect(html).not.toContain("swiper");
    expect(buildScaffold({ pageTitle: "t", withCarousel: true })).toContain("swiper-bundle.min.js");
  });

  it("커버 항목 선언이 유효한 kwcag ID를 가리킨다", () => {
    for (const c of SCAFFOLD_COVERS) expect(c.kwcagId).toMatch(/^kwcag:\d+\.\d+\.\d+$/);
  });
});

describe("사이트 공통부 조립 지원", () => {
  it("iconFixCss — 공통부는 교정 CSS가 생성되고, 일반 부품은 비어 있다", async () => {
    const { iconFixCss } = await import("../src/mapping/kit-markup.js");
    expect(iconFixCss("krds:header")).toContain("#krds-header");
    expect(iconFixCss("krds:header")).not.toContain("img/img/");
    expect(iconFixCss("krds:footer")).toContain(".f-logo");
    expect(iconFixCss("krds:masthead")).toContain("ico_flag.svg");
    expect(iconFixCss("krds:button")).toBe("");
  });

  it("iconFixCss — assetBase를 경로에 반영한다", async () => {
    const { iconFixCss } = await import("../src/mapping/kit-markup.js");
    expect(iconFixCss("krds:masthead", "/static/krds")).toContain(
      "url(/static/krds/resources/img/component/icon/ico_flag.svg)",
    );
  });

  it("iconFixCssAll — 킷이 취소한 선언(mask-image → none)은 재선언하지 않는다", async () => {
    // 킷 .krds-form-select는 mask-image를 걸고 같은 블록에서 none으로 취소한 뒤
    // background-image로 화살표를 그린다. 취소된 mask를 되살리면 셀렉트 요소 전체가
    // 화살표 모양으로 클리핑돼 사라진다 (JSP 실사용 버그, 2026-10-07)
    const { iconFixCssAll } = await import("../src/mapping/kit-markup.js");
    const css = iconFixCssAll();
    const selectBlocks = [...css.matchAll(/^([^{\n][^{]*)\{([^}]*)\}/gm)].filter(([, sel]) =>
      sel!.includes("krds-form-select"),
    );
    expect(selectBlocks.length).toBeGreaterThan(0);
    for (const [, sel, body] of selectBlocks) {
      // 막아야 하는 것은 취소된 mask 경로의 부활이다. 취소(none)를 그대로 다시 쓰는 것은 허용
      expect(body, `${sel!.trim()} 블록에 mask 경로가 부활하면 안 된다`).not.toMatch(/mask-image:\s*url/);
      if (!body!.includes("color:")) expect(body).toContain("background-image"); // 글자색 교정 블록 제외
    }
    // 진짜 mask를 쓰는 곳(취소 없음)은 여전히 교정돼야 한다 — 전체에서 mask 교정이 사라지면 과수정
    expect(css).toContain("mask-image");
  });

  it("iconFixCssAll — 킷이 경로를 쓴 뒤 none으로 끈 mask는 none까지 다시 쓴다 (오류·성공 아이콘이 정보 아이콘 모양으로 잘리던 결함)", async () => {
    const { iconFixCssAll } = await import("../src/mapping/kit-markup.js");
    const css = iconFixCssAll();
    const block = css.match(/\.form-group \.form-hint-invalid::before \{([^}]*)\}/)?.[1] ?? "";
    expect(block).toContain("mask-image: none");
    expect(block).toContain("background-image: url(");
  });

  it("셀렉트 글자색 대비 교정이 교정 CSS에 들어 있다 — 템플릿 일부에만 있어 생성 셀렉트가 3.08:1로 남던 공백", async () => {
    const { iconFixCssAll, iconFixCss } = await import("../src/mapping/kit-markup.js");
    expect(iconFixCssAll()).toContain(".krds-form-select { color: var(--krds-light-color-text-subtle); }");
    expect(iconFixCss("krds:select")).toContain("--krds-light-color-text-subtle");
  });
});

describe("사이트 공통부 코드 조립 (assembleSiteChrome)", () => {
  it("헤더/푸터 슬롯을 통째로 교체 — 랜드마크 중복이 생기지 않는다", async () => {
    const { assembleSiteChrome } = await import("../src/server/scaffold.js");
    const page = "<style>a{}</style><header><!-- 슬롯 --></header><main></main><footer><!-- 슬롯 --></footer>";
    const out = assembleSiteChrome(page, "node_modules/krds-uiux");
    expect((out.match(/<header/g) ?? []).length).toBe(1); // 킷 헤더만
    expect((out.match(/<footer/g) ?? []).length).toBe(1);
    expect(out).toContain('id="krds-header"');
    expect(out).toContain('id="krds-footer"');
  });

  it("masthead는 이름 있는 section으로 감싼다 (region 위반 방지)", async () => {
    const { assembleSiteChrome } = await import("../src/server/scaffold.js");
    const out = assembleSiteChrome("<style></style><header></header><footer></footer>", "x");
    expect(out).toContain('<section aria-label="공식 배너">');
    expect(out).toContain('id="krds-masthead"');
  });

  it("아이콘 경로 교정 CSS가 style에 주입된다", async () => {
    const { assembleSiteChrome } = await import("../src/server/scaffold.js");
    const out = assembleSiteChrome("<style></style><header></header><footer></footer>", "/cdn/krds");
    expect(out).toContain("url(/cdn/krds/resources/img/component/icon/ico_flag.svg)");
    expect(out).not.toContain("img/img/");
  });
});

describe("스캐폴드 조각 출력 (splitScaffold) — JSP 소비자의 분해 스크립트 자작 흡수", () => {
  const rejoin = (p: NonNullable<ReturnType<typeof splitScaffold>>) =>
    p.head + p.header + p.main + p.footer + p.scripts;

  it("빈 뼈대 — 이어 붙이면 원본과 같고, 조각마다 경계가 맞다", () => {
    const html = buildScaffold({ pageTitle: "민원 신청" });
    const p = splitScaffold(html)!;
    expect(rejoin(p)).toBe(html);
    expect(p.head).toMatch(/^<!DOCTYPE html>[\s\S]*<\/head>$/);
    expect(p.header).toContain("krds-skip-link");
    expect(p.main).toMatch(/^<main[\s\S]*<\/main>$/);
    expect(p.footer).toMatch(/<\/footer>$/);
    expect(p.scripts).toContain("ui-script.js");
    expect(p.scripts).toContain("</html>");
  });

  it("공통부 조립 페이지 — 랜드마크가 조각 하나에만 있다", () => {
    const html = assembleSiteChrome(buildScaffold({ pageTitle: "x" }), "node_modules/krds-uiux");
    const p = splitScaffold(html)!;
    expect(rejoin(p)).toBe(html);
    expect(p.header).toContain('aria-label="공식 배너"');
    expect(p.header).toMatch(/<header/);
    expect(p.main).not.toMatch(/<header|<footer/);
    expect(p.footer).toMatch(/<footer/);
  });

  it("모든 패턴 템플릿이 조각으로 나뉜다", () => {
    for (const m of listPatterns()) {
      const slots = Object.fromEntries(m.slots.map((sl) => [sl.name, "값"]));
      const r = renderPattern(m.name, slots);
      expect(r?.ok, m.name).toBe(true);
      if (!r || !r.ok) continue;
      const p = splitScaffold(r.result.html);
      expect(p, m.name).not.toBeNull();
      expect(rejoin(p!), m.name).toBe(r.result.html);
    }
  });

  it("경계가 없으면 null, 도구는 전체 페이지로 대신 준다", () => {
    expect(splitScaffold("<div>조각</div>")).toBeNull();
    expect(pageBlock("<div>조각</div>", "parts").join("\n")).toContain("```html");
  });

  it("parts 출력에 JSP 인코딩 지시를 붙인다", () => {
    const out = pageBlock(buildScaffold({ pageTitle: "x" }), "parts").join("\n");
    expect(out).toContain("### head");
    expect(out).toContain("### scripts");
    expect(out).toContain('<%@ page pageEncoding="UTF-8" %>');
  });
});
