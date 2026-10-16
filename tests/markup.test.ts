// 생성 마크업 — 입력값을 교정본 구조에 넣는다. 실사용 6세션 전원이 킷 원본을 받아 손으로 다시 쓴 마찰의 흡수.
// "실측 후 공급": 렌더러마다 킷 CSS·JS와 함께 렌더해 위반 0·킷 관례 경고 0·키보드 위반 0을 확인한다
import { mkdtempSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { findItems, renderComponent } from "../src/markup/index.js";
import { ASSEMBLY_NOTES } from "../src/mapping/assembly-notes.js";
import { iconFixCss } from "../src/mapping/kit-markup.js";
import { scanTargets, translate } from "../src/report/index.js";

const html = (id: string, inputs: Record<string, unknown>) => {
  const r = renderComponent(id, inputs as never);
  if (!r?.ok) throw new Error(`렌더 실패: ${id} ${r && !r.ok ? r.reason : "렌더러 없음"}`);
  return r.html;
};

describe("항목 찾기", () => {
  it("바깥 키 이름과 무관하게 필드를 가진 첫 객체 배열을 쓴다", () => {
    expect(findItems({ whatever: [{ crumbLabel: "홈", href: "/" }] }, ["crumbLabel", "href"])).toHaveLength(1);
  });
  it("쉼표 문자열은 나눠 항목으로 — 개수가 다르면 추측하지 않고 null", () => {
    expect(findItems({ crumbLabel: "홈, 민원", href: "/, /m" }, ["crumbLabel", "href"])).toEqual([
      { crumbLabel: "홈", href: "/" },
      { crumbLabel: "민원", href: "/m" },
    ]);
    expect(findItems({ crumbLabel: "홈, 민원", href: "/" }, ["crumbLabel", "href"])).toBeNull();
  });
});

describe("렌더러 출력", () => {
  it("브레드크럼 — 첫 항목 home, 마지막 항목 aria-current, nav 랜드마크", () => {
    const out = html("krds:breadcrumb", { crumbs: [{ crumbLabel: "홈", href: "/" }, { crumbLabel: "민원", href: "/m" }, { crumbLabel: "민원 신청", href: "/m/a" }] });
    expect(out).toContain('<nav class="krds-breadcrumb-wrap" aria-label="현재 경로">');
    expect(out).toContain('<li class="home"><a href="/" class="txt">홈</a></li>');
    expect(out).toContain('<li><a href="/m/a" class="txt" aria-current="page">민원 신청</a></li>');
    expect(out.match(/aria-current/g)).toHaveLength(1);
  });

  it("페이지네이션 — 현재 쪽 aria-current, 첫 쪽이면 이전 비활성, 마지막 쪽이면 다음 비활성", () => {
    const pages = [1, 2, 3].map((n) => ({ pageHref: `/n?p=${n}` }));
    const first = html("krds:pagination", { pages, currentPage: 1 });
    expect(first).toContain('<span class="page-navi prev disabled">이전</span>');
    expect(first).toContain('<a class="page-navi next" href="/n?p=2">다음</a>');
    expect(first).toContain('<a class="page-link active" href="/n?p=1" aria-current="page">1</a>');
    const last = html("krds:pagination", { pages, currentPage: 3 });
    expect(last).toContain('<span class="page-navi next disabled">다음</span>');
    expect(last).toContain('<a class="page-navi prev" href="/n?p=2">이전</a>');
    expect(last).not.toContain("현재페이지"); // aria-current와 함께 두면 두 번 읽힌다
    expect(renderComponent("krds:pagination", { pages, currentPage: 9 } as never)).toMatchObject({ ok: false });
  });

  it("라디오 그룹 — 화면용 제목·legend 모두 (필수), 오류면 fieldset 연결과 aria-invalid", () => {
    const out = html("krds:radio_button", {
      radioGroupName: "receive", groupLabel: "수령 방법", required: true, errorMessage: "수령 방법을 선택해 주세요.",
      options: [{ labelText: "방문 수령", inputId: "r-visit" }, { labelText: "우편 수령", inputId: "r-mail", checked: true }],
    });
    expect(out).toContain('<div class="form-tit" aria-hidden="true">수령 방법 (필수)</div>');
    expect(out).toContain("<legend>수령 방법 (필수)</legend>");
    expect(out).toContain('<fieldset aria-describedby="receive-error">');
    expect(out).toContain('<p class="form-hint-invalid" id="receive-error">수령 방법을 선택해 주세요.</p>');
    expect(out).toContain('<input type="radio" name="receive" id="r-mail" value="r-mail" checked required aria-invalid="true">');
    const clean = html("krds:radio_button", { radioGroupName: "g", groupLabel: "성별", options: [{ labelText: "남", inputId: "m" }] });
    expect(clean).not.toMatch(/aria-invalid|aria-describedby|form-hint-invalid|\(필수\)/);
  });

  it("체크박스 — 항목 단위 필수 표시, 그룹 레이블이 없으면 fieldset 없이", () => {
    const out = html("krds:checkbox", { groupLabel: "약관 동의", options: [{ labelText: "이용약관 동의", inputId: "a1", required: true }, { labelText: "마케팅 수신", inputId: "a2" }] });
    expect(out).toContain('<label for="a1">이용약관 동의 (필수)</label>');
    expect(out).toContain('<input type="checkbox" name="a1" id="a1" value="a1" required>');
    expect(out).toContain('<label for="a2">마케팅 수신</label>');
    const single = html("krds:checkbox", { labelText: "동의", inputId: "only" });
    expect(single).not.toContain("fieldset");
  });

  it("입력란·셀렉트 — 레이블 연결, 오류 위치(입력란은 form-conts, 셀렉트는 select 자체), 도움말 연결", () => {
    const ti = html("krds:text_input", { labelText: "신청자 이름", inputId: "nm", required: true, errorMessage: "이름을 입력해 주세요.", hintText: "주민등록상 성명", autocomplete: "name" });
    expect(ti).toContain('<div class="form-conts is-error">');
    expect(ti).toContain('aria-describedby="nm-hint nm-error"');
    expect(ti).toContain('<label for="nm">신청자 이름 (필수)</label>');
    expect(ti).not.toContain("placeholder");
    const sel = html("krds:select", { labelText: "수령", selectId: "rv", errorMessage: "선택해 주세요.", options: [{ label: "방문", value: "visit" }] });
    expect(sel).toContain('<select id="rv" name="rv" class="krds-form-select is-error" aria-invalid="true" aria-describedby="rv-error">');
    expect(sel).toContain('<div class="form-conts">');
    expect(sel).toContain('<option value="visit">방문</option>');
  });

  it("폼 제출용 name·value — 없으면 생성 마크업 그대로는 값이 전송되지 않는다 (실사용 3세션 지적)", () => {
    expect(html("krds:text_input", { labelText: "이름", inputId: "nm" })).toContain('name="nm"');
    expect(html("krds:text_input", { labelText: "이름", inputId: "nm", name: "userName" })).toContain('name="userName"');
    expect(html("krds:select", { labelText: "지역", selectId: "area" })).toContain('name="area"');
    const cb = html("krds:checkbox", { groupLabel: "관심", groupName: "interest", options: [{ labelText: "교육", inputId: "i1", value: "edu" }] });
    expect(cb).toContain('name="interest" id="i1" value="edu"');
    const rb = html("krds:radio_button", { radioGroupName: "age", groupLabel: "연령", options: [{ labelText: "20대", inputId: "a20", value: "20" }] });
    expect(rb).toContain('name="age" id="a20" value="20"');
  });

  it("단독 체크박스도 errorMessage를 반영한다 — input이 메시지를 직접 가리킨다 (React 실사용 결함)", () => {
    const out = html("krds:checkbox", { labelText: "개인정보 동의", inputId: "pv", required: true, errorMessage: "동의해 주세요." });
    expect(out).toContain('aria-invalid="true" aria-describedby="pv-error"');
    expect(out).toContain('<p class="form-hint-invalid" id="pv-error">동의해 주세요.</p>');
  });

  it("레이블에 이미 (필수)가 있으면 다시 붙이지 않는다 (JSP 실사용 결함)", () => {
    const cb = html("krds:checkbox", { groupLabel: "약관", options: [{ labelText: "개인정보 동의(필수)", inputId: "c1", required: true }] });
    expect(cb).not.toContain("(필수) (필수)");
    expect(cb).not.toContain("(필수)(필수)");
    expect(html("krds:text_input", { labelText: "이름 (필수)", inputId: "n", required: true })).not.toContain("(필수) (필수)");
    expect(html("krds:radio_button", { radioGroupName: "g", groupLabel: "유형 (필수)", required: true, options: [{ labelText: "a", inputId: "a" }] })).not.toContain("(필수) (필수)");
  });

  it("값은 이스케이프한다 — 태그·속성이 깨지지 않는다", () => {
    const out = html("krds:breadcrumb", { crumbs: [{ crumbLabel: '<script>x</script>"&', href: '/a"onmouseover="x' }] });
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;x&lt;/script&gt;&quot;&amp;");
    expect(out).toContain('href="/a&quot;onmouseover=&quot;x"');
  });

  it("렌더러가 없는 컴포넌트는 undefined — get_component는 지금처럼 킷 원본을 준다", () => {
    expect(renderComponent("krds:tab", {} as never)).toBeUndefined();
  });

  it("같은 입력이면 같은 바이트 (결정적)", () => {
    const inputs = { labelText: "이름", inputId: "nm" };
    expect(html("krds:text_input", inputs)).toBe(html("krds:text_input", inputs));
  });
});

describe("렌더 검증 — 생성 마크업을 킷과 함께 렌더하면 위반 0·경고 0", () => {
  const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
  const breadcrumbCss = ASSEMBLY_NOTES["krds:breadcrumb"]!.join("\n").match(/`(\.krds-breadcrumb-wrap \{[^`]*)`/)![1]!;
  const page = (body: string) => {
    const f = join(mkdtempSync(join(tmpdir(), "markup-")), "p.html");
    writeFileSync(
      f,
      `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>생성 마크업 검증</title>` +
        `<link rel="stylesheet" href="${pathToFileURL(join(kit, "resources/css/common/common.css")).href}">` +
        `<link rel="stylesheet" href="${pathToFileURL(join(kit, "resources/css/component/component.css")).href}">` +
        // 소비자가 따르는 조립 지침의 페이지 CSS(브레드크럼 폭 제한)도 함께 — 마크업 밖이라 렌더러가 만들지 않는다
        `<style>${breadcrumbCss}</style>` +
        // get_component(select)가 함께 주는 교정 CSS — 셀렉트 기본 글자색 대비 미달(3.08:1) 교정 포함
        `<style>${iconFixCss("krds:select", pathToFileURL(kit).href)}</style>` +
        `</head><body data-krds-a11y="no-chrome"><main><h1>생성 마크업 검증</h1><form>${body}</form></main>` +
        `<script src="${pathToFileURL(join(kit, "resources/js/component/ui-script.js")).href}"></script></body></html>`,
    );
    return pathToFileURL(f).href;
  };

  it("6종 × 기본·오류 상태", async () => {
    const body = [
      html("krds:breadcrumb", { crumbs: [{ crumbLabel: "홈", href: "/" }, { crumbLabel: "민원 신청", href: "/m/a" }] }),
      html("krds:text_input", { labelText: "이름", inputId: "nm", required: true, errorMessage: "이름을 입력해 주세요.", hintText: "성명", autocomplete: "name" }),
      html("krds:text_input", { labelText: "주소", inputId: "addr", autocomplete: "street-address" }),
      html("krds:select", { labelText: "수령 방법", selectId: "rv", required: true, errorMessage: "선택해 주세요.", options: [{ label: "방문", value: "visit" }] }),
      html("krds:select", { labelText: "지역", selectId: "area", options: [{ label: "서울", value: "seoul" }] }),
      html("krds:radio_button", { radioGroupName: "g1", groupLabel: "신청 유형", required: true, errorMessage: "신청 유형을 선택해 주세요.", options: [{ labelText: "개인", inputId: "g1a" }, { labelText: "법인", inputId: "g1b" }] }),
      html("krds:radio_button", { radioGroupName: "g2", groupLabel: "연령대", options: [{ labelText: "20대", inputId: "g2a", checked: true }, { labelText: "30대", inputId: "g2b" }] }),
      html("krds:checkbox", { groupLabel: "약관 동의", options: [{ labelText: "이용약관", inputId: "c1", required: true }, { labelText: "마케팅", inputId: "c2" }] }),
      html("krds:checkbox", { labelText: "알림 받기", inputId: "c3" }),
      html("krds:checkbox", { labelText: "개인정보 동의", inputId: "c4", required: true, errorMessage: "동의해 주세요." }),
      html("krds:pagination", { pages: [1, 2, 3].map((n) => ({ pageHref: `/n?p=${n}` })), currentPage: 2 }),
    ].join("\n");
    const [r] = await scanTargets([{ id: "markup", kind: "site", url: page(body) }], { ruleSet: "baseline", kitConventions: true, keyboard: true });
    expect(r!.status).toBe("ok");
    if (r!.status !== "ok") return;
    const report = translate([r!]);
    const violations = report.items.filter((i) => i.grade === "violation").map((i) => i.kwcagId);
    // 실패하면 어느 요소인지 바로 보이게 — 위반 노드의 셀렉터와 사유를 함께 낸다
    const detail = r!.findings.filter((f) => f.outcome === "violation").flatMap((f) => f.nodes.map((n) => `${f.ruleId} ${n.selector}: ${n.summary.slice(0, 120)}`));
    expect(violations, detail.join("\n")).toEqual([]);
    expect(r!.kitIssues ?? []).toEqual([]);
  }, 90_000);
});

describe("get_component 응답 — 렌더러가 있으면 생성 마크업, 없으면 지금처럼 킷 원본", () => {
  const call = async (args: Record<string, unknown>) => {
    const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
    const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js");
    const { createServer } = await import("../src/server/index.js");
    const [a, b] = InMemoryTransport.createLinkedPair();
    const server = createServer();
    await server.connect(b);
    const client = new Client({ name: "t", version: "0" });
    await client.connect(a);
    const r = await client.callTool({ name: "get_component", arguments: args });
    await client.close();
    await server.close();
    return (r.content as { text: string }[]).map((x) => x.text).join("\n");
  };

  it("값을 채우면 생성 마크업을 주고 킷 원본·채워 넣을 값은 뺀다", async () => {
    const out = await call({ componentId: "breadcrumb", inputs: { crumbs: [{ crumbLabel: "홈", href: "/" }, { crumbLabel: "민원", href: "/m" }] } });
    expect(out).toContain("## 생성 마크업");
    expect(out).toContain('aria-current="page">민원</a>');
    expect(out).not.toContain("## 마크업\n");
    expect(out).not.toContain("## 채워 넣을 값");
    expect(out).toContain("킷 원본(참고):");
    expect(out).toContain("## 조립 지침"); // 마크업 밖 지침(폭 제한 CSS)은 그대로
  });

  it("필수 입력이 비면 거부하면서 입력 예시를 보여 준다", async () => {
    const out = await call({ componentId: "radio_button" });
    expect(out).toContain("필수 입력이 채워지지 않아");
    expect(out).toContain("입력 예시");
    expect(out).toContain("options: [{labelText");
  });

  it("폼 지침의 예시 코드 블록은 생성 마크업과 겹치므로 빼고 지침 문장은 남긴다", async () => {
    const out = await call({ componentId: "text_input", inputs: { labelText: "이름", inputId: "nm" } });
    expect(out).toContain("필수 표시:");
    expect(out).not.toContain('id="applicant"'); // 지침 예시 코드
  });

  it("렌더러가 없는 컴포넌트는 지금처럼 킷 원본", async () => {
    const out = await call({ componentId: "tab", inputs: { tabLabel: "개인", panelTitle: "개인 안내" } });
    expect(out).toContain("## 마크업\n");
    expect(out).not.toContain("## 생성 마크업");
  });
});
