// 라우트 전환 뒤 킷 위젯 재초기화 — get_framework_guide react 처방 3의 근거를 실제 킷으로 고정한다.
// 공통 레이아웃(GNB·언어 드롭다운·사이드 내비)은 남기고 화면만 두 번 갈아 끼운 SPA 모의 페이지에서
// 재발행 처방과 화면 모듈 처방을 실제 클릭으로 비교한다 (실측 2026-10-14).
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { KIT_BEHAVIOR, NO_ROUTE_REINIT, ROUTE_REINIT_MODULES, kitBehaviorLines } from "../src/mapping/kit-behavior.js";

const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
const script = readFileSync(join(kit, "resources/js/component/ui-script.js"), "utf8");
const demo = (f: string) =>
  readFileSync(join(kit, "html/code", f), "utf8")
    .replace(/class="sample"/g, "")
    .replace(/ sample(?=["\s])/g, "") // 킷은 sample 클래스가 붙은 위젯을 건너뛴다
    .replace(/class="krds-tts /g, 'data-tts-text="안내" class="krds-tts ');

describe("모듈 구분이 설치된 킷과 맞는다", () => {
  const initHandler = script.slice(script.indexOf('window.addEventListener("DOMContentLoaded"'));
  const initialized = [...initHandler.slice(0, initHandler.indexOf("});")).matchAll(/(krds_\w+)\.init\(\)/g)].map((m) => m[1]);

  it("두 목록이 첫 로드 init 모듈을 빠짐없이, 겹치지 않게 나눈다", () => {
    const route: string[] = [...ROUTE_REINIT_MODULES];
    const no = Object.keys(NO_ROUTE_REINIT);
    expect(route.filter((m) => no.includes(m))).toEqual([]);
    expect([...route, ...no].sort()).toEqual([...new Set(initialized)].sort());
    for (const m of [...route, ...no]) expect(script).toContain(`const ${m} = {`);
  });

  it("킷 공통부(header·footer·masthead)는 화면 모듈을 쓰지 않는다 — 처방의 전제", () => {
    const chrome = ["header.html", "footer.html", "masthead.html"].map(demo).join("\n");
    for (const b of Object.values(KIT_BEHAVIOR)) {
      if (!(ROUTE_REINIT_MODULES as readonly string[]).includes(b.module)) continue;
      const cls = b.selector.split(/\s+/).pop()!.replace(/^\./, "").split(".")[0]!;
      expect(chrome.includes(cls), `${b.module} ${cls}`).toBe(false);
    }
  });

  it("킷 동작 절이 모듈 구분을 따른다", () => {
    expect(kitBehaviorLines("krds:modal").join("\n")).toContain("`krds_modal.init()`만 다시 불러라");
    expect(kitBehaviorLines("krds:main_menu").join("\n")).toContain("첫 로드에 한 번만 초기화한다. 공통 레이아웃(GNB)");
    expect(kitBehaviorLines("krds:main_menu").join("\n")).not.toContain(".init()`만 다시");
    expect(kitBehaviorLines("krds:tab").join("\n")).toContain("중복되지 않는다");
  });
});

type Mode = "redispatch" | "modules" | "modules-no-remount";
let browser: Browser;
beforeAll(async () => { browser = await chromium.launch(); });
afterAll(async () => { await browser?.close(); });

/** 레이아웃 고정 + 화면 changes번 전환 뒤 위젯을 실제로 눌러 열림 여부를 모은다 */
async function spa(mode: Mode, changes: number): Promise<Record<string, string>> {
  const modal = demo("modal.html");
  const trigger = modal.match(/<button[^>]*open-modal[\s\S]*?<\/button>/)![0];
  const layout = demo("main_menu_pc.html") + demo("language_switcher.html") + demo("side_navigation.html");
  const screen = ["tab.html", "accordion.html", "disclosure.html", "tooltip.html", "contextual_help.html", "calendar.html", "tts_size.html"]
    .map(demo).join("") + trigger;
  const css = (f: string) => `<link rel="stylesheet" href="${pathToFileURL(join(kit, "resources/css", f)).href}">`;
  const file = join(mkdtempSync(join(tmpdir(), "route-")), "spa.html");
  writeFileSync(
    file,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>spa</title>${css("common/common.css")}${css("component/component.css")}</head><body>` +
      // 모달은 포털처럼 #wrap 밖 — 킷 모달은 열 때 #wrap에 inert를 건다
      `<div id="wrap"><header id="layout">${layout}</header><main id="route"></main></div><div id="portal"></div>` +
      `<template id="screen">${screen}</template><template id="modal">${modal.replace(trigger, "")}</template>` +
      `<script src="${pathToFileURL(join(kit, "resources/js/component/ui-script.js")).href}"></script>` +
      // 가이드 처방 3과 같은 호출 — 다른 스크립트(모듈)에서 전역 const 모듈을 이름으로 부른다
      `<script type="module">window.routeChange = (mode) => {
        if (mode !== "modules-no-remount" || !document.getElementById("route").children.length) {
          document.getElementById("route").replaceChildren(document.getElementById("screen").content.cloneNode(true));
          document.getElementById("portal").replaceChildren(document.getElementById("modal").content.cloneNode(true));
        }
        if (mode === "redispatch") window.dispatchEvent(new Event("DOMContentLoaded"));
        else for (const m of [${ROUTE_REINIT_MODULES.join(", ")}]) m.init();
      };</script></body></html>`,
  );
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(pathToFileURL(file).href, { waitUntil: "load" });
  await page.waitForTimeout(300);
  for (let i = 0; i < changes; i++) await page.evaluate((m) => (window as unknown as { routeChange(m: string): void }).routeChange(m), mode);
  await page.waitForTimeout(300);

  const out: Record<string, string> = {};
  const clickRead = async (label: string, sel: string, attr: string) => {
    // 로케이터는 매번 다시 찾는다 — 클릭 뒤 :not(.active)가 다른 요소를 가리키지 않게 표식으로 고정
    await page.locator(sel).filter({ visible: true }).first().evaluate((e) => {
      document.querySelectorAll("[data-probe]").forEach((x) => x.removeAttribute("data-probe"));
      e.setAttribute("data-probe", "");
    });
    await page.locator("[data-probe]").click();
    await page.waitForTimeout(500);
    out[label] = String(await page.locator("[data-probe]").getAttribute(attr));
  };
  await clickRead("GNB", "#layout button.gnb-main-trigger:not(.active)", "aria-expanded");
  await page.keyboard.press("Escape");
  await clickRead("언어", "#layout .drop-btn", "aria-expanded");
  await page.locator("#layout .drop-btn").first().click();
  await clickRead("사이드 내비", "#layout .lnb-toggle:not(.active)", "aria-expanded");
  await clickRead("아코디언", "#route .btn-accordion", "aria-expanded");
  await clickRead("디스클로저", "#route .btn-conts-expand", "aria-expanded");
  await clickRead("도움말", "#route .tooltip-btn", "aria-expanded");
  await page.keyboard.press("Escape");
  await clickRead("TTS", "#route .krds-tts", "aria-pressed");
  await page.locator("#route .open-modal").first().click();
  await page.waitForTimeout(600);
  out["모달"] = String(await page.evaluate(() => !!document.querySelector(".krds-modal.in")?.contains(document.activeElement)));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  out["모달 Escape"] = String(await page.evaluate(() => !document.querySelector(".krds-modal.in")));
  await page.locator("#route .krds-tooltip").first().focus();
  await page.waitForTimeout(300);
  out["툴팁 팝오버"] = String(await page.evaluate(() => [...document.querySelectorAll(".krds-tooltip-popover")].filter((e) => (e as HTMLElement).checkVisibility()).length));
  await page.close();
  return out;
}

const ALL_OPEN = {
  GNB: "true", 언어: "true", "사이드 내비": "true", 아코디언: "true", 디스클로저: "true", 도움말: "true", TTS: "true",
  모달: "true", "모달 Escape": "true", "툴팁 팝오버": "1",
};

describe("SPA 모의 — 레이아웃 고정, 화면 전환", () => {
  it("처방 3(화면 모듈만 init) — 세 번 전환해도 레이아웃과 화면 위젯이 모두 열린다", async () => {
    expect(await spa("modules", 3)).toEqual(ALL_OPEN);
  }, 60_000);

  // 리스너가 홀수 개면 우연히 열린다 — 재발행 처방은 전환할 때마다 열림·안 열림이 번갈아 나온다
  it("DOMContentLoaded 재발행 — 한 번 전환하면 남아 있는 레이아웃 토글이 두 번 돌아 열리지 않는다", async () => {
    const r = await spa("redispatch", 1);
    expect([r.GNB, r["언어"], r["사이드 내비"]]).toEqual(["false", "false", "false"]);
  }, 60_000);

  it("화면을 리마운트하지 않고 init만 반복 — 같은 요소에 중복돼 화면 토글도 죽는다 (key 리마운트 조건의 근거)", async () => {
    const r = await spa("modules-no-remount", 2);
    expect(r["디스클로저"]).toBe("false");
    expect(r["GNB"]).toBe("true");
  }, 60_000);
});
