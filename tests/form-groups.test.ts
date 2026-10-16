// 폼 그룹 경고 — 라디오 그룹 이름 누락(kwcag:7.3.2), 숨은 legend에만 있는 필수 표시.
// apply-issue 템플릿 라디오 그룹에 이름이 없었는데 validate가 못 잡았고(실사용 3세션), 킷 CSS가 legend를 숨겨
// "(필수)"가 화면에서 사라져도 위반 0이었다
import { mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { renderComponent } from "../src/markup/index.js";
import { scanTargets } from "../src/report/runner.js";
import { listPatterns } from "../src/templates/index.js";

const kit = pathToFileURL(dirname(createRequire(import.meta.url).resolve("krds-uiux/package.json"))).href;
const page = (body: string) => {
  const f = join(mkdtempSync(join(tmpdir(), "fg-")), "p.html");
  writeFileSync(
    f,
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>폼</title>` +
      `<link rel="stylesheet" href="${kit}/resources/css/common/common.css">` +
      `<link rel="stylesheet" href="${kit}/resources/css/component/component.css">` +
      `</head><body data-krds-a11y="no-chrome"><main><h1>폼</h1><form>${body}</form></main></body></html>`,
  );
  return pathToFileURL(f).href;
};
const issues = async (url: string) => {
  const [r] = await scanTargets([{ id: "t", kind: "site", url }], { ruleSet: "baseline", kitConventions: true });
  expect(r!.status).toBe("ok");
  return (r!.status === "ok" ? r!.kitIssues ?? [] : []).filter((i) => /라디오 그룹 이름 누락|필수 표시가 화면에 안 보임|hidden인데 화면에 보임/.test(i));
};
const radio = (id: string, label: string) =>
  `<div class="krds-form-check"><input type="radio" name="kind" id="${id}"><label for="${id}">${label}</label></div>`;
const RADIOS = radio("k1", "온라인") + radio("k2", "우편");

describe("라디오 그룹 이름", () => {
  it("킷 .krds-check-area div로만 묶은 라디오 → 경고 (apply-issue 템플릿의 결함 구조)", async () => {
    const found = await issues(page(`<h3>발급 유형</h3><div class="krds-check-area">${RADIOS}</div>`));
    expect(found).toEqual([expect.stringContaining('라디오 그룹 이름 누락 name="kind" (선택지 2개)')]);
  }, 60_000);

  it("role=radiogroup + aria-labelledby(보이는 제목) → 경고 없음", async () => {
    expect(await issues(page(`<h3 id="t">발급 유형</h3><div class="krds-check-area" role="radiogroup" aria-labelledby="t">${RADIOS}</div>`))).toEqual([]);
  }, 60_000);

  it("aria-labelledby가 없는 id를 가리키면 이름이 없는 것과 같다", async () => {
    expect(await issues(page(`<div role="radiogroup" aria-labelledby="nope">${RADIOS}</div>`))).toHaveLength(1);
  }, 60_000);

  it("라디오 하나뿐이면 그룹이 아니다", async () => {
    expect(await issues(page(radio("k1", "동의")))).toEqual([]);
  }, 60_000);
});

describe("숨은 legend의 필수 표시", () => {
  it("legend에만 (필수) → 경고 (킷 CSS가 legend를 숨긴다)", async () => {
    const found = await issues(page(`<fieldset><legend>수령 방법 (필수)</legend>${RADIOS}</fieldset>`));
    expect(found).toEqual([expect.stringContaining('필수 표시가 화면에 안 보임 "수령 방법 (필수)"')]);
  }, 60_000);

  it("렌더러 교정본(보이는 form-tit + legend) → 경고 없음", async () => {
    const r = renderComponent("krds:radio_button", {
      radioGroupName: "recv", groupLabel: "수령 방법", required: true,
      options: [{ labelText: "방문", inputId: "r1", value: "v" }, { labelText: "우편", inputId: "r2", value: "m" }],
    });
    expect(r?.ok).toBe(true);
    expect(await issues(page(r!.ok ? r!.html : ""))).toEqual([]);
  }, 60_000);
});

describe("hidden 속성을 덮는 킷 CSS (kit-bugs.md K8)", () => {
  it(".form-group 안 form-hint-invalid에 hidden → 화면에 보이므로 경고", async () => {
    const found = await issues(page(`<div class="form-group"><input class="krds-input" id="n" aria-label="이름"><p class="form-hint-invalid" hidden>이름을 입력하라</p></div>`));
    expect(found).toEqual([expect.stringContaining('hidden인데 화면에 보임 <p class="form-hint-invalid"> "이름을 입력하라"')]);
  }, 60_000);

  it("hidden이 실제로 숨기면(킷 규칙 밖) 경고 없음", async () => {
    expect(await issues(page(`<p class="form-hint-invalid" hidden>밖</p><div hidden>숨김</div>`))).toEqual([]);
  }, 60_000);
});

describe("무오탐", () => {
  it("템플릿 13종 — 세 경고 0", async () => {
    const dir = new URL("../templates/", import.meta.url);
    const previews = listPatterns().map((m) => `${m.name}.preview.html`);
    expect(previews.every((f) => readdirSync(dir).includes(f))).toBe(true);
    const found: string[] = [];
    for (const f of previews) found.push(...(await issues(new URL(f, dir).href)).map((i) => `${f}: ${i}`));
    expect(found).toEqual([]);
  }, 300_000);
});
