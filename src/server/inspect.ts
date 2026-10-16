// inspect_page 실측 — 렌더된 페이지의 폰트·색·배치를 읽는다 (확인용 임시 스크립트 대체)
import type { Server } from "node:http";
import { fileURLToPath } from "node:url";
import { serveLocal } from "./serve-local.js";

export type ElementProbe = {
  selector: string;
  found: boolean;
  count?: number;
  rect?: { x: number; y: number; width: number; height: number };
  display?: string;
  visibility?: string;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontLoaded?: boolean;
  /** 계산된 바깥·안쪽 여백 — 위 오른쪽 아래 왼쪽 px (실사용에서 간격을 재려고 임시 스크립트를 쓰던 마찰) */
  margin?: number[];
  padding?: number[];
  /** flex·grid일 때만 — 행 간격·열 간격 px */
  gap?: { row: number; column: number };
  text?: string;
};

export type InspectResult = {
  title: string;
  bodyFontFamily: string;
  /** 본문 폰트가 실제 로드·적용됐는가 — 폴백(시스템 폰트) 감지 */
  bodyFontLoaded: boolean;
  probes: ElementProbe[];
};

/**
 * 페이지의 시각 상태 점검 — 폰트 적용·색·배치를 실제 렌더링에서 읽는다.
 * 소비자 AI가 이걸 확인하려고 임시 playwright 스크립트를 반복 생성하는 것이
 * 실사용 테스트에서 확인돼 도구로 제공한다 (2026-09-22).
 */
export async function runInspect(
  target: { url: string; label: string },
  selectors: string[],
): Promise<InspectResult> {
  const { loadBrowserStack } = await import("../report/runner.js");
  const { chromium } = loadBrowserStack();

  let url = target.url;
  let local: { server: Server; origin: string } | undefined;
  if (url.startsWith("file://")) {
    local = await serveLocal();
    url = local.origin + fileURLToPath(url);
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.addInitScript("window.__name = (fn) => fn;");
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    return await page.evaluate((sels: string[]) => {
      const probe = (selector: string) => {
        const all = document.querySelectorAll(selector);
        const el = all[0];
        if (!el) return { selector, found: false };
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const family = cs.fontFamily.split(",")[0]!.trim().replace(/^["']|["']$/g, "");
        // normal(gap 미지정)·auto는 0으로 — 계산값은 px 문자열이다
        const px = (v: string) => Math.round((parseFloat(v) || 0) * 10) / 10;
        const sides = (k: "margin" | "padding") =>
          (["top", "right", "bottom", "left"] as const).map((d) => px(cs.getPropertyValue(`${k}-${d}`)));
        return {
          selector,
          found: true,
          count: all.length,
          rect: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
          display: cs.display,
          visibility: cs.visibility,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontLoaded: document.fonts.check(`${cs.fontSize} "${family}"`),
          margin: sides("margin"),
          padding: sides("padding"),
          ...(/flex|grid/.test(cs.display) ? { gap: { row: px(cs.rowGap), column: px(cs.columnGap) } } : {}),
          text: (el.textContent ?? "").trim().slice(0, 60),
        };
      };
      const bodyCs = getComputedStyle(document.body);
      const bodyFamily = bodyCs.fontFamily.split(",")[0]!.trim().replace(/^["']|["']$/g, "");
      return {
        title: document.title,
        bodyFontFamily: bodyCs.fontFamily,
        bodyFontLoaded: document.fonts.check(`16px "${bodyFamily}"`),
        probes: sels.map(probe),
      };
    }, selectors);
  } finally {
    await browser.close();
    local?.server.close();
  }
}
