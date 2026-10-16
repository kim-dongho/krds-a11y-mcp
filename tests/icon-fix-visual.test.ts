// 아이콘 교정 CSS 시각 검사 — 킷이 의도한 모습과 같은가.
// 정답: 킷 component.css의 경로 버그(img/img/)만 고친 사본. 비교 대상: 원본 CSS + 우리 교정 CSS(iconFixCssAll).
// 킷 데모 마크업 전체를 두 방식으로 렌더해 모든 요소·::before·::after의 mask-image·background-image를 대조한다.
// 초기부터 오류·성공 아이콘이 정보 아이콘 모양으로 잘려 있던 결함이 axe로는 안 보여 한참 뒤에야 드러난 교훈
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { iconFixCssAll } from "../src/mapping/kit-markup.js";

const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
const cssDir = join(kit, "resources/css/component");
const original = readFileSync(join(cssDir, "component.css"), "utf8");

function pageFile(name: string, css: string, body: string): string {
  const dir = mkdtempSync(join(tmpdir(), "icon-"));
  // 상대 경로(../../img/…)가 킷 위치로 풀리게 CSS 파일을 킷 component 폴더 기준 URL로 넣는다
  const f = join(dir, `${name}.html`);
  writeFileSync(
    f,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${name}</title>` +
      `<base href="${pathToFileURL(cssDir).href}/"><style>${css}</style></head><body>${body}</body></html>`,
  );
  return pathToFileURL(f).href;
}

describe("아이콘 교정 CSS — 킷 의도와 같은 아이콘이 그려진다", () => {
  // 데스크톱·모바일 두 폭 — @media 안의 규칙(브레드크럼 말줄임 등)이 엉뚱한 폭에 붙지 않는지까지 본다
  it.each([[1280, 900], [390, 844]])("폭 %ipx — 킷 데모 전체의 요소·의사 요소 mask-image·background-image가 정답과 같다", async (width, height) => {
    const demos = readdirSync(join(kit, "html/code"))
      .filter((f) => f.endsWith(".html"))
      .sort()
      .map((f) => `<section data-demo="${f}">${readFileSync(join(kit, "html/code", f), "utf8").replace(/<script[\s\S]*?<\/script>/g, "")}</section>`)
      .join("\n");
    const intended = original.replaceAll("img/img/", "img/");
    const fixed = `${original}\n${iconFixCssAll(pathToFileURL(kit).href)}`;

    const browser = await chromium.launch();
    try {
      const read = async (url: string) => {
        const page = await browser.newPage({ viewport: { width, height } });
        await page.goto(url);
        const rows = await page.evaluate(() => {
          const name = (v: string) => (v === "none" ? "none" : (v.match(/[^/]+\.(svg|png)/g) ?? [v]).join(","));
          const out: string[] = [];
          document.querySelectorAll("body *").forEach((el, i) => {
            for (const pseudo of [null, "::before", "::after"] as const) {
              const cs = getComputedStyle(el, pseudo);
              const mask = cs.maskImage || (cs as unknown as { webkitMaskImage: string }).webkitMaskImage;
              if (mask === "none" && cs.backgroundImage === "none") continue;
              const demo = el.closest("[data-demo]")?.getAttribute("data-demo");
              out.push(`${demo} #${i} ${el.tagName.toLowerCase()}.${String((el as HTMLElement).className).slice(0, 40)}${pseudo ?? ""} mask=${name(mask)} bg=${name(cs.backgroundImage)}`);
            }
          });
          return out;
        });
        await page.close();
        return rows;
      };
      const a = await read(pageFile("intended", intended, demos));
      const b = await read(pageFile("fixed", fixed, demos));
      const bSet = new Set(b);
      const mismatch = a.filter((row) => !bSet.has(row));
      const extra = b.filter((row) => !new Set(a).has(row));
      expect(a.length).toBeGreaterThan(50); // 비교 대상이 실제로 있다
      expect({ missingOrDifferent: mismatch.slice(0, 15), extra: extra.slice(0, 15) }).toEqual({ missingOrDifferent: [], extra: [] });
    } finally {
      await browser.close();
    }
  }, 120_000);
});
