// 키보드 검사 판정을 실제 브라우저로 고정한다 — spec.md §4.1 픽스처 + 실사용 오판 방지 사례.
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runKeyboardChecks } from "../src/report/keyboard.js";
import type { AxeFinding } from "../src/report/types.js";

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch();
});
afterAll(async () => {
  await browser.close();
});

async function check(body: string, head = ""): Promise<AxeFinding[]> {
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>t</title>${head}</head><body>${body}</body></html>`);
  const f = await runKeyboardChecks(page);
  await page.close();
  return f;
}
const outcome = (f: AxeFinding[], rule: string) =>
  f.filter((x) => x.ruleId === rule).map((x) => x.outcome).sort();

describe("kbd-focus-visible — 초점 가시성", () => {
  it("outline:none만 있고 대체 표시가 없으면 확정 위반", async () => {
    const f = await check(`<button>저장</button>`, `<style>button:focus{outline:none}</style>`);
    expect(outcome(f, "kbd-focus-visible")).toEqual(["violation"]);
  });

  it(":focus-visible로 외곽선을 그리면 통과 — 실제 Tab이라 오탐하지 않는다", async () => {
    const f = await check(
      `<button>저장</button>`,
      `<style>button:focus{outline:none} button:focus-visible{outline:3px solid #256ef4}</style>`,
    );
    expect(outcome(f, "kbd-focus-visible")).toEqual(["pass"]);
  });

  it("브라우저 기본 초점 표시(스타일 없음)는 통과", async () => {
    const f = await check(`<a href="#a">링크</a><button>버튼</button>`);
    expect(outcome(f, "kbd-focus-visible")).toEqual(["pass"]);
  });

  it("글자색만 바뀌면 판정 보류 (위반 아님)", async () => {
    const f = await check(
      `<a href="#a">링크</a>`,
      `<style>a:focus{outline:none;color:#d00}</style>`,
    );
    expect(outcome(f, "kbd-focus-visible")).toEqual(["incomplete"]);
  });

  it("::after로 그리는 초점 링은 통과", async () => {
    const f = await check(
      `<button class="b">버튼</button>`,
      `<style>.b{position:relative}.b:focus{outline:none}.b:focus::after{content:"";position:absolute;inset:-3px;border:2px solid #256ef4}</style>`,
    );
    expect(outcome(f, "kbd-focus-visible")).toEqual(["pass"]);
  });

  it("숨긴 입력 + 라벨에 링을 그리는 체크박스는 통과", async () => {
    const f = await check(
      `<input type="checkbox" id="c"><label for="c">동의</label>`,
      `<style>#c{position:absolute;opacity:0}#c:focus{outline:none}#c:focus + label{outline:2px solid #256ef4}</style>`,
    );
    expect(outcome(f, "kbd-focus-visible")).toEqual(["pass"]);
  });
});

describe("kbd-reachable — 도달성", () => {
  it("보이는 링크에 tabindex=-1을 두면 판정 보류 (차단 아님 — 화살표 이동 위젯일 수 있다)", async () => {
    const f = await check(`<button>정상</button><a href="#x" tabindex="-1">못 닿는 링크</a>`);
    expect(outcome(f, "kbd-reachable")).toEqual(["incomplete"]);
  });

  it("모든 조작 요소에 닿으면 통과", async () => {
    const f = await check(`<button>하나</button><a href="#x">둘</a><input aria-label="셋">`);
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });

  it("라디오 그룹은 그룹당 한 번만 멈춰도 도달로 본다", async () => {
    const f = await check(
      `<fieldset><legend>구분</legend><input type="radio" name="g" id="r1"><label for="r1">개인</label><input type="radio" name="g" id="r2"><label for="r2">법인</label></fieldset>`,
    );
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });
});

describe("kbd-tab-order — Tab 순서", () => {
  it("양수 tabindex는 판정 보류", async () => {
    const f = await check(`<button>하나</button><button tabindex="3">셋</button>`);
    expect(outcome(f, "kbd-tab-order")).toEqual(["incomplete"]);
  });

  it("평범한 페이지는 통과", async () => {
    const f = await check(`<a href="#a">링크</a><button>버튼</button><input aria-label="검색">`);
    expect(outcome(f, "kbd-tab-order")).toEqual(["pass"]);
  });

  it("iframe 안을 도는 동안을 초점 함정으로 오판하지 않는다", async () => {
    const f = await check(`<button>앞</button><iframe title="지도" srcdoc="<button>안1</button><button>안2</button>"></iframe><button>뒤</button>`);
    expect(outcome(f, "kbd-tab-order")).toEqual(["pass"]);
  });
});

describe("정리", () => {
  it("검사 후 초점을 풀어 스크린샷을 오염시키지 않는다", async () => {
    const page = await browser.newPage();
    await page.setContent(`<button>버튼</button>`);
    await runKeyboardChecks(page);
    const active = await page.evaluate(() => document.activeElement?.tagName);
    await page.close();
    expect(active).toBe("BODY");
  });
});

describe("RC 교정 재현 (rc-fixes)", () => {
  it("F1 — 검사 후 초점 링 잔상이 남지 않는다 (킷식 전환: 기본 0.4초, :focus 0초)", async () => {
    const page = await browser.newPage();
    await page.setContent(
      `<style>button{transition:box-shadow .4s ease-in-out} button:focus{outline:none;box-shadow:0 0 0 4px #256ef4;transition:box-shadow 0s}</style><button>A</button><button>B</button>`,
    );
    await runKeyboardChecks(page);
    const shadows = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => getComputedStyle(b).boxShadow));
    await page.close();
    expect(shadows).toEqual(["none", "none"]);
  });

  it("F2 — 순회 상한에 걸리면 도달성을 통과로 내지 않고 판정 보류", async () => {
    const page = await browser.newPage();
    await page.setContent(Array.from({ length: 30 }, (_, i) => `<a href="#l${i}">링크${i}</a>`).join(" "));
    const f = await runKeyboardChecks(page, { maxStops: 10 });
    await page.close();
    expect(outcome(f, "kbd-reachable")).toEqual(["incomplete"]);
  });

  it("F2 — runKeyboard는 정지 횟수와 종료 사유를 돌려준다", async () => {
    const { runKeyboard } = await import("../src/report/keyboard.js");
    const page = await browser.newPage();
    await page.setContent(`<button>A</button><a href="#b">B</a>`);
    const r = await runKeyboard(page);
    await page.close();
    expect(r.stops).toBe(2);
    expect(r.end).toBe("body");
  });

  it("F9 — onclick을 단 div는 도달성 판정 보류", async () => {
    const f = await check(`<button>정상</button><div onclick="void 0">메뉴 열기</div>`);
    expect(outcome(f, "kbd-reachable")).toEqual(["incomplete"]);
  });

  it("F10 — 닫힌 details 안 링크는 도달 불가로 잡지 않는다", async () => {
    const f = await check(`<details><summary>더보기</summary><a href="#a">숨은 링크</a></details>`);
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });
});

describe("RC 재검증 회귀 (rc-fixes F9 오탐)", () => {
  it("킷 정식 탭 — li[role=tab] 안의 button이 초점을 받으면 클릭 전용으로 잡지 않는다", async () => {
    const f = await check(
      `<ul role="tablist"><li role="tab" id="t1"><button>탭 1</button></li><li role="tab" id="t2"><button>탭 2</button></li></ul>`,
    );
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });

  it("게시판 행 — tr onclick 안에 제목 링크가 있으면 잡지 않는다", async () => {
    const f = await check(
      `<table><tr onclick="location.href='#1'"><td><a href="#1">공지 제목</a></td><td>2026-10-12</td></tr></table>`,
    );
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });

  it("초점 가능한 자식이 없는 div onclick은 여전히 잡는다", async () => {
    const f = await check(`<button>정상</button><div onclick="void 0"><span>메뉴 열기</span></div>`);
    expect(outcome(f, "kbd-reachable")).toEqual(["incomplete"]);
  });
});

describe("화살표 이동 위젯(roving tabindex)", () => {
  it("탭 목록의 비활성 탭(tabindex=-1)은 같은 목록의 활성 탭에 닿으면 도달로 본다", async () => {
    const f = await check(
      `<div role="tablist"><button role="tab" aria-selected="true">탭 1</button><button role="tab" tabindex="-1" aria-selected="false">탭 2</button><button role="tab" tabindex="-1" aria-selected="false">탭 3</button></div>`,
    );
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });

  it("위젯 밖의 tabindex=-1 링크는 여전히 판정 보류", async () => {
    const f = await check(`<button>정상</button><a href="#x" tabindex="-1">못 닿는 링크</a>`);
    expect(outcome(f, "kbd-reachable")).toEqual(["incomplete"]);
  });
});

describe("배포판 실사용 회귀 — 자동 초점 화면", () => {
  it("페이지가 중간 요소에 자동 초점을 줘도 순회는 문서 처음부터 시작한다 (로그인 폼 오판)", async () => {
    const page = await browser.newPage();
    await page.setContent(
      `<a href="#main">본문 바로가기</a><header><a href="/">로고</a></header><main id="main"><input id="uid" aria-label="아이디"><button>로그인</button></main>`,
    );
    await page.evaluate(() => (document.getElementById("uid") as HTMLInputElement).focus());
    const f = await runKeyboardChecks(page);
    await page.close();
    expect(outcome(f, "kbd-reachable")).toEqual(["pass"]);
  });
});
