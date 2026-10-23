// 검사 엔진 오판 수정 — 기록 이름 충돌, 최신 색 문법의 대비 오판, 반투명 배경, 속성 없는 비활성
import { chromium } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser } from "playwright";
import { measureContrast } from "../src/report/contrast.js";
import { stampToDate } from "../src/runs/run-store.js";
import { validateStamp } from "../src/server/report-summary.js";

describe("검사 기록 이름", () => {
  it("밀리초까지 담는다 — 1초 안의 연속 검사가 앞 기록을 덮어쓰지 않는다", () => {
    const a = validateStamp(new Date("2026-10-22T01:02:03.004Z"));
    const b = validateStamp(new Date("2026-10-22T01:02:03.005Z"));
    expect(a).toBe("validate-2026-10-22T01-02-03-004");
    expect(a).not.toBe(b);
  });

  it("새 이름과 밀리초 없는 구형 이름을 모두 시각으로 읽는다", () => {
    expect(stampToDate("validate-2026-10-22T01-02-03-004")?.toISOString()).toBe("2026-10-22T01:02:03.004Z");
    expect(stampToDate("validate-2026-10-22T01-02-03")?.toISOString()).toBe("2026-10-22T01:02:03.000Z");
  });
});

describe("명도 대비 실측", () => {
  let browser: Browser;
  beforeAll(async () => {
    browser = await chromium.launch();
  });
  afterAll(async () => {
    await browser?.close();
  });
  const measure = async (body: string) => {
    const p = await browser.newPage();
    await p.setContent(`<!doctype html><html lang="ko"><body style="background:#fff">${body}</body></html>`);
    const [m] = await measureContrast(p, ["#t"]);
    await p.close();
    return m!;
  };

  it("oklch 배경을 읽는다 — 못 읽고 흰 바탕으로 재면 어두운 배경 위 흰 글자가 위반으로 확정됐다", async () => {
    const m = await measure(`<div style="background:oklch(0.2 0 0)"><p id="t" style="color:#fff">안내</p></div>`);
    expect(m.ratio).toBeGreaterThan(10);
    expect(m.bg).not.toBe("#ffffff");
  });

  it("반투명 배경은 확실하지 않음 — 위반으로 확정하지 않는다", async () => {
    const m = await measure(`<div style="background:rgba(0,0,0,0.5)"><p id="t" style="color:#767676">안내</p></div>`);
    expect(m.certain).toBe(false);
  });

  it("fieldset[disabled] 안의 컨트롤은 속성이 없어도 비활성", async () => {
    const m = await measure(`<fieldset disabled><legend>묶음</legend><input id="t" value="값" style="color:#8a949e"></fieldset>`);
    expect(m.inactive).toBe(true);
  });
});

describe("로컬 서빙 범위", () => {
  it("허용한 폴더 밖의 파일은 403 — 검사하는 동안 파일 시스템 전체가 열려 있던 문제", async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const { serveLocal } = await import("../src/server/serve-local.js");
    const inside = mkdtempSync(join(tmpdir(), "srv-in-"));
    const outside = mkdtempSync(join(tmpdir(), "srv-out-"));
    writeFileSync(join(inside, "a.html"), "<p>a</p>");
    writeFileSync(join(outside, "b.html"), "<p>b</p>");
    const { server, origin } = await serveLocal([inside]);
    try {
      expect((await fetch(origin + join(inside, "a.html"))).status).toBe(200);
      expect((await fetch(origin + join(outside, "b.html"))).status).toBe(403);
      expect((await fetch(`${origin}${inside}/../${outside.split("/").pop()}/b.html`)).status).toBe(403);
    } finally {
      server.close();
    }
  });
});
