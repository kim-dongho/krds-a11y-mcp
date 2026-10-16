// 킷 CSS 미로드 판정 — KRDS 클래스를 쓰는데 킷 토큰이 비어 있으면 검사 무효.
// 토큰은 <link>든 번들러 inline이든 똑같이 정의되므로 번들러 프로젝트를 오탐하지 않는다.
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { findMojibake, scanTargets } from "../src/report/runner.js";
import { translate } from "../src/report/index.js";

function page(html: string): string {
  const f = join(mkdtempSync(join(tmpdir(), "assets-")), "p.html");
  writeFileSync(f, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>t</title>${html}`);
  return pathToFileURL(f).href;
}

describe("킷 CSS 미로드 판정 (사이트 대상)", () => {
  it("KRDS 클래스를 쓰는데 킷 CSS가 404면 검사 무효 — 킷 없는 화면을 위반 0으로 통과시키지 않는다", async () => {
    const url = page(`<link rel="stylesheet" href="./missing/common.css"></head><body><main><h1>t</h1><button class="krds-btn">버튼</button></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    expect(r!.status).toBe("error");
    if (r!.status === "error") expect(r!.reason).toContain("킷 CSS");
  }, 60_000);

  it("킷 토큰이 inline으로 들어와도(번들러) 정상 검사", async () => {
    const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}</style></head><body><main><h1>t</h1><button class="krds-btn">버튼</button></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    expect(r!.status).toBe("ok");
  }, 60_000);

  it("KRDS를 쓰지 않는 화면은 판정하지 않는다", async () => {
    const url = page(`</head><body><main><h1>t</h1><button>버튼</button></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    expect(r!.status).toBe("ok");
  }, 60_000);
});

describe("레이아웃 깨짐 신호", () => {
  it("문서가 화면 폭보다 넓으면 가로 넘침을 리소스·페이지 문제로 알린다", async () => {
    const url = page(`</head><body><main><h1>t</h1><div style="width:3000px">넓은 내용</div></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    expect(r!.status).toBe("ok");
    if (r!.status === "ok") expect((r!.pageIssues ?? []).join(" ")).toContain("가로 넘침");
  }, 60_000);

  it("넓은 표가 자체 스크롤 상자 안에 있으면 넘침으로 보지 않는다", async () => {
    const url = page(`</head><body><main><h1>t</h1><div style="overflow-x:auto"><div style="width:3000px">넓은 표</div></div></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    if (r!.status === "ok") expect((r!.pageIssues ?? []).join(" ")).not.toContain("가로 넘침");
  }, 60_000);
});

describe("KRDS 클래스 이름 충돌", () => {
  it("다른 CSS(Tailwind 등)가 KRDS 클래스 이름(contents)에 규칙을 만들면 KRDS 사용 문제로 잡는다", async () => {
    const url = page(`<style>.contents{display:contents}.flex{display:flex}.mt-4{margin-top:1rem}.grid{display:grid}.p-2{padding:.5rem}</style></head><body><main class="contents"><h1>t</h1></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    if (r!.status === "ok") {
      const issues = (r!.kitIssues ?? []).join(" ");
      expect(issues).toContain("클래스 이름 충돌");
      expect(issues).toContain("contents");
      expect(issues).toContain("prefix(tw)");
    }
  }, 60_000);

  it("일반 처방을 먼저 주고 Tailwind 처방은 조건부로 단다 — Tailwind 여부는 CSSOM으로 확실히 못 가린다 (정적 HTML 실사용 지적)", async () => {
    const url = page(`<style>.contents{display:contents}.wrap{display:flex}.box{margin-top:1rem}.row{display:grid}.cell{padding:.5rem}</style></head><body><main class="contents"><h1>t</h1></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    expect(r!.status).toBe("ok");
    if (r!.status === "ok") {
      const issues = (r!.kitIssues ?? []).join(" ");
      expect(issues).toContain("클래스 이름을 KRDS와 겹치지 않게 바꿔라");
      expect(issues).toContain("Tailwind라면");
    }
  }, 60_000);

  it("krds- 이름은 셀렉터 조작 검사가 맡는다 — 한 규칙을 두 번 세지 않는다 (정적 HTML 실사용 지적)", async () => {
    const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}</style><style>.krds-pagination{margin-top:2rem}.wrap{display:flex}.box{margin:0}.row{display:grid}.cell{padding:0}</style></head><body><main><h1>t</h1><nav class="krds-pagination" aria-label="페이지"><a href="/p/1">1</a></nav></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    expect(r!.status).toBe("ok");
    if (r!.status === "ok") {
      const hits = (r!.kitIssues ?? []).filter((i) => i.includes(".krds-pagination"));
      expect(hits).toHaveLength(1);
      expect(hits[0]).toContain("킷 셀렉터를 조작");
    }
  }, 60_000);

  it("의미가 같은 유틸리티(sr-only·text-center 등)는 충돌로 잡지 않는다", async () => {
    const url = page(`<style>.sr-only{position:absolute;width:1px;height:1px;overflow:hidden}.text-center{text-align:center}.flex{display:flex}.mt-4{margin-top:1rem}.grid{display:grid}.p-2{padding:.5rem}</style></head><body><main><h1 class="text-center">t</h1></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    if (r!.status === "ok") expect((r!.kitIssues ?? []).join(" ")).not.toContain("클래스 이름 충돌");
  }, 60_000);
});

describe("템플릿 CSS 복사본은 충돌이 아니다", () => {
  it("규칙 대부분이 KRDS 이름인 시트(템플릿 CSS를 복사한 파일)의 .contents는 잡지 않는다", async () => {
    const url = page(`<style>.contents{padding:2rem}.page-title-wrap{margin:0}.conts-area{gap:1rem}.h-tit{font-size:2rem}</style></head><body><main class="contents"><h1>t</h1></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    if (r!.status === "ok") expect((r!.kitIssues ?? []).join(" ")).not.toContain("클래스 이름 충돌");
  }, 60_000);
});

describe("오류 메시지 연결 (kwcag:7.3.1) — 킷 마크업에 aria 연결이 없어 소비자가 빠뜨린다", () => {
  const scan = async (body: string) => {
    // 킷 토큰이 없으면 KRDS 클래스 화면은 검사 무효가 된다 — 토큰만 inline으로 준다
    const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}</style></head><body><main><h1>t</h1>${body}</main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    expect(r!.status).toBe("ok");
    return r!.status === "ok" ? (r!.kitIssues ?? []).join(" ") : "";
  };

  it("보이는 오류 메시지를 컨트롤이 aria-describedby로 가리키지 않으면 알린다", async () => {
    const issues = await scan(
      `<div class="form-group"><div class="form-tit"><label for="nm">이름</label></div>` +
        `<div class="form-conts is-error"><input id="nm" class="krds-input"></div>` +
        `<p class="form-hint-invalid">이름을 입력해 주세요.</p></div>`,
    );
    expect(issues).toContain("오류 메시지 연결 누락");
    expect(issues).toContain("이름을 입력해 주세요");
  }, 60_000);

  it("aria-describedby로 연결돼 있으면 조용하다", async () => {
    const issues = await scan(
      `<div class="form-group"><div class="form-tit"><label for="nm">이름</label></div>` +
        `<div class="form-conts is-error"><input id="nm" class="krds-input" aria-invalid="true" aria-describedby="nm-err"></div>` +
        `<p class="form-hint-invalid" id="nm-err">이름을 입력해 주세요.</p></div>`,
    );
    expect(issues).not.toContain("오류 메시지 연결 누락");
  }, 60_000);

  it("그룹 오류는 fieldset이 가리켜도 연결로 본다", async () => {
    const issues = await scan(
      `<div><fieldset aria-describedby="ag-err"><legend>동의 (필수)</legend>` +
        `<input type="checkbox" id="a1" class="krds-form-check"><label for="a1">약관</label></fieldset>` +
        `<p class="form-hint-invalid" id="ag-err">약관에 동의해 주세요.</p></div>`,
    );
    expect(issues).not.toContain("오류 메시지 연결 누락");
  }, 60_000);

  it("숨겨 둔 오류 메시지 자리는 잡지 않는다", async () => {
    const issues = await scan(
      `<div class="form-group"><input id="nm" class="krds-input"><p class="form-hint-invalid" hidden>이름을 입력해 주세요.</p></div>`,
    );
    expect(issues).not.toContain("오류 메시지 연결 누락");
  }, 60_000);
});

describe("한글 깨짐(모지바케) 검출 — axe가 위반 0으로 통과시키던 JSP 인코딩 함정", () => {
  const latin1 = (s: string) => Buffer.from(s, "utf8").toString("latin1");
  const cp1252 = (s: string) => new TextDecoder("windows-1252").decode(Buffer.from(s, "utf8"));

  it("UTF-8 한글을 ISO-8859-1·windows-1252로 읽은 꼴과 깨진 문자를 잡는다", () => {
    expect(findMojibake(`${latin1("민원 신청")} 안내`)).not.toBeNull();
    expect(findMojibake(cp1252("민원 신청 화면"))).not.toBeNull();
    expect(findMojibake("이름 �� 입력")).not.toBeNull();
  });

  it("정상 한글·영문·프랑스어는 잡지 않는다", () => {
    expect(findMojibake("민원 신청 — 신청자 이름을 입력해 주세요")).toBeNull();
    expect(findMojibake("Être à la fête, crème brûlée")).toBeNull();
    expect(findMojibake(`${latin1("한")}`)).toBeNull(); // 한 곳은 우연일 수 있다
  });

  it("깨진 페이지를 페이지 문제로 알린다", async () => {
    const url = page(`</head><body><main><h1>${latin1("민원 신청")}</h1><p>${latin1("신청자 이름")}</p></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    expect(r!.status).toBe("ok");
    if (r!.status === "ok") expect((r!.pageIssues ?? []).join(" ")).toContain("한글 깨짐");
  }, 60_000);
});

describe("위계·크기 없는 맨 krds-btn — 킷 button.html 샘플을 그대로 써 모든 버튼이 큰 기본형이 된 실사용 (Codex JSP)", () => {
  const scan = async (body: string) => {
    const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}</style></head><body><main><h1>t</h1>${body}</main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    expect(r!.status).toBe("ok");
    return r!.status === "ok" ? (r!.kitIssues ?? []).join(" ") : "";
  };

  it("클래스가 krds-btn 하나뿐인 버튼을 알린다", async () => {
    const issues = await scan(`<button type="button" class="krds-btn">번호 생성(수동)</button>`);
    expect(issues).toContain("위계·크기 미지정");
    expect(issues).toContain("번호 생성(수동)");
  }, 60_000);

  it("킷이 실제로 쓰는 크기 없는 형태(primary·icon·툴팁 등)는 잡지 않는다", async () => {
    const issues = await scan(
      `<button type="button" class="krds-btn primary">시작</button>` +
        `<button type="button" class="krds-btn icon"><span class="sr-only">닫기</span></button>` +
        `<button type="button" class="krds-btn krds-tooltip">도움말</button>` +
        `<button type="button" class="krds-btn medium text">더보기</button>`,
    );
    expect(issues).not.toContain("위계·크기 미지정");
  }, 60_000);
});

describe("조립 지침이 처방한 CSS를 자기 CSS에 넣어도 경고하지 않는다 (렌더 검증에서 실측된 모순)", () => {
  const scan = async (css: string) => {
    const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}</style><style>${css}.wrap{display:flex}</style></head><body data-krds-a11y="no-chrome"><main><h1>t</h1><nav class="krds-breadcrumb-wrap" aria-label="현재 경로"><ol class="breadcrumb"><li class="home"><a href="/" class="txt">홈</a></li><li><a href="/a" class="txt" aria-current="page">a</a></li></ol></nav></main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
    expect(r!.status).toBe("ok");
    return r!.status === "ok" ? (r!.kitIssues ?? []).join(" ") : "";
  };

  it("브레드크럼 폭 제한 — 처방과 같은 셀렉터·속성이면 면제", async () => {
    const issues = await scan(".krds-breadcrumb-wrap { padding-bottom: 0; } .krds-breadcrumb-wrap .breadcrumb { max-width: var(--krds-contents-wrap-size); padding: 0 var(--krds-contents-padding-x); }");
    expect(issues).not.toContain("킷 셀렉터를 조작");
  }, 60_000);

  it("같은 셀렉터라도 다른 속성(색 등)을 건드리면 그대로 경고", async () => {
    const issues = await scan(".krds-breadcrumb-wrap .breadcrumb { max-width: 100rem; color: red; }");
    expect(issues).toContain("킷 셀렉터를 조작");
  }, 60_000);
});

describe("명도 대비 실측 미달 — 배경이 확실하면 위반으로 센다 (실사용 3세션: '미달 교정 필요'인데 위반 0)", () => {
  const scan = async (body: string, css = "") => {
    const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}${css}</style></head><body data-krds-a11y="no-chrome"><main><h1>t</h1>${body}</main></body></html>`);
    const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline" });
    expect(r!.status).toBe("ok");
    return r!.status === "ok" ? translate([r!]).items.find((i) => i.kwcagId === "kwcag:5.4.3")!.grade : "";
  };
  // 셀렉트처럼 요소 자신에 작은 반복 없는 아이콘 배경이 있으면 axe는 보류(bgImage)한다
  const icon = "background-image:url(data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E);background-repeat:no-repeat;background-size:1.6rem;background-position:right center;";

  it("단색 배경 위 작은 아이콘 요소의 미달은 위반", async () => {
    expect(await scan(`<label for="s">지역</label><select id="s" style="color:#8a949e;background-color:#fff;${icon}"><option>선택</option></select>`)).toBe("violation");
  }, 60_000);

  it("충족이면 위반이 아니다", async () => {
    expect(await scan(`<label for="s">지역</label><select id="s" style="color:#464c53;background-color:#fff;${icon}"><option>선택</option></select>`)).not.toBe("violation");
  }, 60_000);

  it("글자 뒤에 큰 배경 그림이 있으면 확실하지 않으니 확인필요로 둔다", async () => {
    // 실제로 그려지는 그림이어야 axe가 보류(bgImage)한다 — 빈 SVG는 그림 없음으로 보고 바로 위반을 낸다
    const big = "background-image:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==);background-size:cover;";
    expect(await scan(`<div style="background-color:#fff;${big}"><p style="color:#8a949e">흐린 글자</p></div>`)).not.toBe("violation");
  }, 60_000);
});

describe("셀렉트 글자색 교정 CSS도 처방이라 경고하지 않는다", () => {
  it("color만 바꾸면 면제, 다른 속성을 함께 바꾸면 경고", async () => {
    const run = async (css: string) => {
      const url = page(`<style>:root{--krds-box-shadow-outline:0 0 0 .4rem #256ef4}</style><style>${css}.wrap{display:flex}.box{margin:0}</style></head><body data-krds-a11y="no-chrome"><main><h1>t</h1><label for="s">지역</label><select id="s" class="krds-form-select"><option>선택</option></select></main></body></html>`);
      const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
      return r!.status === "ok" ? (r!.kitIssues ?? []).join(" ") : "";
    };
    expect(await run(".krds-form-select { color: var(--krds-light-color-text-subtle); }")).not.toContain("킷 셀렉터를 조작");
    expect(await run(".krds-form-select { color: red; border: 0; }")).toContain("킷 셀렉터를 조작");
  }, 60_000);
});
