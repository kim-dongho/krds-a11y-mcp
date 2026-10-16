// 비가시 렌더 — 화면에 그려지지 않은 조작 요소를 전체 스크린샷 픽셀로 찾는다 (셀렉트가 통째로 잘렸는데 axe 위반 0)
import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { fileURLToPath } from "node:url";
import { serveLocal } from "../src/server/serve-local.js";
import { invisibleIssue } from "../src/report/invisible.js";
import { scanTargets } from "../src/report/runner.js";
import { listPatterns } from "../src/templates/index.js";

// validate_page처럼 로컬 http로 서빙한다 — file://로 열면 크롬이 mask-image 아이콘을 CORS로 막아
// 아이콘이 실제로 안 그려지고(검출기는 그걸 정확히 잡는다), 404도 "로드 실패"로만 남는다 (실측)
const kit = dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"));
let local: { server: Server; origin: string };
beforeAll(async () => { local = await serveLocal(); });
afterAll(() => { local?.server.close(); });
const served = (fileUrl: string) => local.origin + fileURLToPath(fileUrl);
const page = (body: string, css = "") => {
  const f = join(mkdtempSync(join(tmpdir(), "inv-")), "p.html");
  writeFileSync(
    f,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>비가시</title>` +
      `<link rel="stylesheet" href="${kit}/resources/css/common/common.css">` +
      `<link rel="stylesheet" href="${kit}/resources/css/component/component.css">` +
      `<style>${css}</style></head><body data-krds-a11y="no-chrome"><main><h1>비가시 검사</h1>${body}</main></body></html>`,
  );
  return pathToFileURL(f).href;
};
const invisible = async (fileUrl: string) => {
  const [r] = await scanTargets([{ id: "t", kind: "site", url: served(fileUrl) }], { ruleSet: "baseline", kitConventions: true, screenshotDir: mkdtempSync(join(tmpdir(), "inv-shot-")) });
  expect(r!.status).toBe("ok");
  return r!.status === "ok" ? (r!.pageIssues ?? []).filter((i) => i.startsWith("비가시 렌더")) : [];
};

describe("문구", () => {
  it("요소·이름·추정 원인을 담는다", () => {
    expect(invisibleIssue({ tag: '<select id="rv">', label: "수령 방법", cause: "투명(opacity)" })).toBe(
      '비가시 렌더: <select id="rv"> "수령 방법" — 화면에 그려지지 않는다 (추정: 투명(opacity)). 보조기술은 읽지만 시각 사용자는 쓸 수 없다',
    );
  });
});

describe("검출", () => {
  it("요소 자체 마스크로 통째로 잘린 셀렉트 — 실제 결함 재현", async () => {
    const mask = `${kit}/resources/img/component/icon/ico_angle.svg`;
    const hits = await invisible(page(`<label for="rv">수령 방법</label><select id="rv" class="krds-form-select" style="-webkit-mask-image:url(${mask});mask-image:url(${mask});mask-size:4px;mask-repeat:no-repeat;mask-position:right"><option>선택</option></select>`));
    expect(hits).toHaveLength(1);
    expect(hits[0]).toContain('<select id="rv">');
    expect(hits[0]).toContain("mask-image");
  }, 60_000);

  it("투명 버튼", async () => {
    const hits = await invisible(page(`<button type="button" class="krds-btn medium primary" style="opacity:0.01">신청</button>`));
    expect(hits.join(" ")).toContain("투명(opacity)");
  }, 60_000);

  it("흰 배경 흰 글자 링크", async () => {
    const hits = await invisible(page(`<p style="background:#fff"><a href="/x" style="color:#fff">숨은 링크</a></p>`));
    expect(hits.join(" ")).toContain("글자색과 배경색이 같음");
  }, 60_000);

  it("아이콘 이미지가 404인 아이콘 전용 버튼", async () => {
    const hits = await invisible(page(`<button type="button" class="icon-only" aria-label="닫기" style="width:32px;height:32px;border:0;background:#fff url(${kit}/resources/img/없는-아이콘.svg) center/16px no-repeat"></button>`));
    expect(hits.join(" ")).toContain("아이콘 이미지 404");
  }, 60_000);
});

describe("원래 안 보이는 것은 제외", () => {
  it("킷 체크박스·라디오·토글 — 기본 input을 숨기고 레이블이 그린다", async () => {
    expect(await invisible(page(
      `<div class="krds-form-check"><input type="checkbox" id="c1"><label for="c1">동의</label></div>` +
        `<div class="krds-form-check"><input type="radio" name="r" id="r1"><label for="r1">개인</label></div>` +
        `<div class="krds-form-toggle-switch"><input type="checkbox" id="t1"><label for="t1">알림</label></div>`,
    ))).toEqual([]);
  }, 60_000);

  it("접힌 영역·sr-only·가로 스크롤 상자 밖", async () => {
    expect(await invisible(page(
      `<div style="display:none"><a href="/hidden">접힌 링크</a></div>` +
        `<a href="#main" class="sr-only">본문 바로가기</a>` +
        `<div style="width:200px;overflow:hidden;white-space:nowrap"><span style="display:inline-block;width:600px"></span><button type="button" class="krds-btn small secondary">밖 버튼</button></div>`,
    ))).toEqual([]);
  }, 60_000);

  it("템플릿 13종 — 오탐 0", async () => {
    const dir = new URL("../templates/", import.meta.url);
    const found: string[] = [];
    for (const m of listPatterns()) {
      const f = `${m.name}.preview.html`;
      expect(readdirSync(dir)).toContain(f);
      found.push(...(await invisible(new URL(f, dir).href)).map((i) => `${f}: ${i}`));
    }
    expect(found).toEqual([]);
  }, 300_000);
});
