// 게시판 템플릿 레이아웃 — 원본 패턴 CSS는 제목 크기·간격을 h3·h4 태그에 건다. 위계를 h2·h3으로 바로잡은 board-detail에서
// 간격이 하나도 걸리지 않아 본문·첨부·이전/다음 글이 붙어 있었다(정적 실사용, 검사는 위반 0으로 통과)
import type { Server } from "node:http";
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { serveForTests } from "./helpers/serve.js";

let local: { server: Server; origin: string };
let browser: Browser;
beforeAll(async () => { local = await serveForTests(); browser = await chromium.launch(); });
afterAll(async () => { local?.server.close(); await browser?.close(); });

describe("board-detail 간격·제목 크기", () => {
  it.each([[1280], [390]])("폭 %ipx — 글 제목(h2)이 소제목(h3)보다 크고, 글 아래 구역마다 위 여백이 있다", async (width) => {
    const p = await browser.newPage({ viewport: { width, height: 900 } });
    await p.goto(`${local.origin}${new URL("../templates/board-detail.preview.html", import.meta.url).pathname}`, { waitUntil: "networkidle" });
    const m = await p.evaluate(() => ({
      h2: parseFloat(getComputedStyle(document.querySelector(".contents h2.sec-tit")!).fontSize),
      h3: [...document.querySelectorAll(".contents h3.sec-tit")].map((e) => parseFloat(getComputedStyle(e).fontSize)),
      gaps: [...document.querySelectorAll(".contents h2.sec-tit ~ .conts-wrap")].map((e) => parseFloat(getComputedStyle(e).marginTop)),
      h2Below: parseFloat(getComputedStyle(document.querySelector(".contents h2.sec-tit")!).marginBottom),
    }));
    await p.close();
    expect(m.h3.length).toBe(2);
    for (const h of m.h3) expect(m.h2).toBeGreaterThan(h);
    expect(m.gaps.length).toBe(3);
    for (const g of m.gaps) expect(g).toBeGreaterThan(0);
    expect(m.h2Below).toBeGreaterThan(0);
  }, 60_000);
});
