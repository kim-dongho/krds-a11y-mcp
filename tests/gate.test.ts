// gate 판정의 4분기(기록 없음·위반·낡음·통과)와 종료 코드 계약을 고정한다.
// 브라우저 불필요 — 임시 디렉터리에 가짜 런 json을 심고 judge를 직접 부른다.
import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatHuman, parseGateArgs, runGateCli } from "../src/gate/cli.js";
import { judge, latestMtime } from "../src/gate/judge.js";
import { readRunTarget, stampToDate } from "../src/runs/run-store.js";

const STAMP = "validate-2026-10-06T10-00-00";
const RAN_AT = new Date("2026-10-06T10:00:00Z");

let tmp: string;
function freshDir(): string {
  tmp = mkdtempSync(join(tmpdir(), "gate-test-"));
  return tmp;
}
afterEach(() => {
  if (tmp) rmSync(tmp, { recursive: true, force: true });
});

/** 최소 런 json을 심는다. targetFile을 주면 kind: "file"로 저장 */
function seedRun(
  root: string,
  slug: string,
  opts: {
    stamp?: string;
    violations?: number;
    needsReview?: number;
    target?: { label: string; kind: "url" | "file" | "inline"; sources?: string[] };
    pageIssues?: string[];
    kitIssues?: string[];
    /** target 필드 없이 results[0].id만 있는 구형 기록 */
    legacyLabel?: string;
    /** json 자체를 깨뜨린다 */
    broken?: boolean;
  } = {},
): string {
  const dir = join(root, slug);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${opts.stamp ?? STAMP}.json`);
  if (opts.broken) {
    writeFileSync(path, "{ 깨진 json");
    return path;
  }
  const items = [
    ...Array.from({ length: opts.violations ?? 0 }, () => ({ grade: "violation" })),
    ...Array.from({ length: opts.needsReview ?? 0 }, () => ({ grade: "needs-review" })),
  ];
  const body: Record<string, unknown> = {
    report: { items },
    results: [
      {
        id: `validate:${opts.legacyLabel ?? opts.target?.label ?? "https://example.test/page"}`,
        kitIssues: opts.kitIssues ?? [],
        pageIssues: opts.pageIssues ?? [],
      },
    ],
  };
  if (opts.target) body.target = opts.target;
  writeFileSync(path, JSON.stringify(body));
  return path;
}

/** mtime을 명시 설정한 대상 파일을 만든다 (sleep 금지) */
function seedTargetFile(root: string, name: string, mtime: Date): string {
  const path = join(root, name);
  writeFileSync(path, "<html></html>");
  utimesSync(path, mtime, mtime);
  return path;
}

describe("judge — 4분기 판정", () => {
  it("기록 없음: reports 디렉터리 미존재 → exit 2", () => {
    const result = judge({ dir: join(freshDir(), "없는폴더") });
    expect(result.exitCode).toBe(2);
    expect(result.reason).toContain("검사 기록이 없다");
  });

  it("기록 없음: 디렉터리는 있으나 런 없음 → exit 2", () => {
    const result = judge({ dir: freshDir() });
    expect(result.exitCode).toBe(2);
  });

  it("위반 잔존 → exit 1, 화면별 수치 보존", () => {
    const root = freshDir();
    seedRun(root, "form", { violations: 2, needsReview: 1 });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(1);
    expect(result.screens).toHaveLength(1);
    expect(result.screens[0]).toMatchObject({ slug: "form", violations: 2, needsReview: 1 });
    expect(result.reason).toContain("form");
  });

  it("낡음: 대상 파일 mtime이 런 시각보다 뒤 → exit 2, stale", () => {
    const root = freshDir();
    const page = seedTargetFile(root, "page.html", new Date(RAN_AT.getTime() + 60_000));
    seedRun(root, "page", { violations: 0, target: { label: page, kind: "file" } });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(2);
    expect(result.screens[0]!.staleness).toBe("stale");
  });

  it("통과: 위반 0, 파일 mtime이 런 시각보다 앞 → exit 0, fresh", () => {
    const root = freshDir();
    const page = seedTargetFile(root, "page.html", new Date(RAN_AT.getTime() - 60_000));
    seedRun(root, "page", { violations: 0, target: { label: page, kind: "file" } });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(0);
    expect(result.screens[0]!.staleness).toBe("fresh");
  });

  it("대상 파일 삭제 → missing, exit 2 — 재검사가 아니라 기록 정리를 안내한다 (재검사할 수 없는 지시가 Stop을 반복 차단했다)", () => {
    const root = freshDir();
    seedRun(root, "page", {
      violations: 0,
      target: { label: join(root, "지워진.html"), kind: "file" },
    });
    const r = judge({ dir: root });
    expect(r.exitCode).toBe(2);
    expect(r.screens[0]!.staleness).toBe("missing");
    expect(r.reason).toContain("reports/<화면> 폴더를 지우고");
    expect(r.reason).not.toContain("validate_page로 재검사하라");
  });

  it("url 대상 → staleness unknown, 종료 코드 영향 없음 — 단 통과 사유가 '검사 최신'을 사칭하지 않는다", () => {
    const root = freshDir();
    seedRun(root, "site", { violations: 0, target: { label: "https://a.test/", kind: "url" } });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(0);
    expect(result.screens[0]!.staleness).toBe("unknown");
    expect(result.reason).not.toContain("검사 최신");
    expect(result.reason).toContain("판정 불가");
  });

  it("리소스 문제 — 차단하지 않되 통과 사유와 화면 수치에 드러낸다", () => {
    const root = freshDir();
    seedRun(root, "site", {
      violations: 0,
      target: { label: "https://a.test/", kind: "url" },
      pageIssues: ["리소스 404: /img/logo.gif", "스크립트 에러: x"],
    });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(0); // 기존 깨짐이 있는 사이트를 영원히 막지 않는다
    expect(result.screens[0]!.pageIssues).toBe(2);
    expect(result.reason).toContain("리소스·스크립트 문제 2건");
  });

  it("사이트 공통부 누락 — 위반 0이어도 차단(1), 다른 KRDS 사용 문제는 차단하지 않는다", () => {
    const root = freshDir();
    seedRun(root, "no-chrome", {
      violations: 0,
      target: { label: "https://a.test/", kind: "url" },
      kitIssues: ["사이트 공통부 누락(머리글·바닥글) — get_page_scaffold의 withSiteChrome: true로 조립하라"],
    });
    seedRun(root, "kit-misuse", {
      violations: 0,
      target: { label: "https://a.test/b", kind: "url" },
      kitIssues: ["킷 외 컨트롤 <button class=\"x\"> — 부품은 get_component로"],
    });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(1);
    expect(result.reason).toContain("공통부");
    expect(result.reason).toContain("no-chrome");
    expect(result.screens.find((s) => s.slug === "no-chrome")!.chromeMissing).toBe(true);
    expect(result.screens.find((s) => s.slug === "kit-misuse")!.chromeMissing).toBe(false);
  });

  it("다른 KRDS 사용 문제만 있으면 통과(0) — 차단 범위를 공통부 누락으로 한정", () => {
    const root = freshDir();
    seedRun(root, "kit-misuse", {
      violations: 0,
      target: { label: "https://a.test/", kind: "url" },
      kitIssues: ["킷 외 컨트롤 <button class=\"x\"> — 부품은 get_component로"],
    });
    expect(judge({ dir: root }).exitCode).toBe(0);
  });

  it("통과 사유 — fresh·unknown 혼재면 수를 구분해 말한다", () => {
    const root = freshDir();
    const page = seedTargetFile(root, "p.html", new Date(RAN_AT.getTime() - 60_000));
    seedRun(root, "file-page", { violations: 0, target: { label: page, kind: "file" } });
    seedRun(root, "url-page", { violations: 0, target: { label: "https://a.test/", kind: "url" } });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(0);
    expect(result.reason).toContain("1개 검사 최신");
    expect(result.reason).toContain("1개는 낡음 판정 불가");
  });

  it("위반 화면과 낡음 화면 혼재 → exit 1 (위반 우선)", () => {
    const root = freshDir();
    const page = seedTargetFile(root, "p.html", new Date(RAN_AT.getTime() + 60_000));
    seedRun(root, "stale-page", { violations: 0, target: { label: page, kind: "file" } });
    seedRun(root, "bad-page", { violations: 3 });
    expect(judge({ dir: root }).exitCode).toBe(1);
  });

  it("구형 기록(target 필드 없음): results[0].id에서 복원해 동일 판정", () => {
    const root = freshDir();
    const page = seedTargetFile(root, "old.html", new Date(RAN_AT.getTime() + 60_000));
    const json = seedRun(root, "old", { violations: 0, legacyLabel: page });
    expect(readRunTarget(json)).toEqual({ label: page, kind: "file" });
    expect(judge({ dir: root }).screens[0]!.staleness).toBe("stale");
  });

  it("깨진 json → 기록 불량 표기, exit 2", () => {
    const root = freshDir();
    seedRun(root, "corrupt", { broken: true });
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(2);
    expect(result.screens[0]!.broken).toBe(true);
    expect(result.reason).toContain("기록 불량");
  });

  it("최신 런만 본다 — 과거 위반, 최신 통과면 exit 0", () => {
    const root = freshDir();
    seedRun(root, "page", { stamp: "validate-2026-10-06T09-00-00", violations: 5 });
    seedRun(root, "page", {
      stamp: STAMP,
      violations: 0,
      target: { label: "https://a.test/", kind: "url" },
    });
    expect(judge({ dir: root }).exitCode).toBe(0);
  });

  it("--only: 미존재 슬러그 → exit 2, 실존 목록 안내", () => {
    const root = freshDir();
    seedRun(root, "real", { violations: 0, target: { label: "https://a.test/", kind: "url" } });
    const result = judge({ dir: root, only: ["없는화면"] });
    expect(result.exitCode).toBe(2);
    expect(result.reason).toContain("real");
  });

  it("--only: 지정 화면만 판정 — 다른 화면 위반을 무시한다", () => {
    const root = freshDir();
    seedRun(root, "bad", { violations: 9 });
    seedRun(root, "good", { violations: 0, target: { label: "https://a.test/", kind: "url" } });
    const result = judge({ dir: root, only: ["good"] });
    expect(result.exitCode).toBe(0);
    expect(result.screens).toHaveLength(1);
  });
});

describe("stampToDate", () => {
  it("파일명 몸통을 UTC Date로 해석한다", () => {
    expect(stampToDate(STAMP)?.toISOString()).toBe("2026-10-06T10:00:00.000Z");
  });
  it("형식이 어긋나면 undefined", () => {
    expect(stampToDate("validate-엉망")).toBeUndefined();
  });
});

describe("CLI", () => {
  it("parseGateArgs: 옵션 조합과 --only 반복", () => {
    expect(parseGateArgs(["--json", "--only", "a", "--only", "b", "--dir", "out"])).toEqual({
      json: true,
      only: ["a", "b"],
      dir: "out",
      help: false,
    });
  });

  it("parseGateArgs: 모르는 옵션·값 누락은 error", () => {
    expect(parseGateArgs(["--뭐지"])).toHaveProperty("error");
    expect(parseGateArgs(["--only"])).toHaveProperty("error");
  });

  it("runGateCli: 종료 코드를 반환하고 --json 출력이 exitCode와 일치한다", () => {
    const root = freshDir();
    seedRun(root, "form", { violations: 1 });
    const logs: string[] = [];
    const orig = console.log;
    console.log = (s: string) => void logs.push(s);
    try {
      const code = runGateCli(["--json", "--dir", root]);
      expect(code).toBe(1);
      expect(JSON.parse(logs.join("")).exitCode).toBe(1);
    } finally {
      console.log = orig;
    }
  });

  it("runGateCli: 사용법 오류는 64, --help는 0", () => {
    const origErr = console.error;
    const origLog = console.log;
    console.error = () => {};
    console.log = () => {};
    try {
      expect(runGateCli(["--뭐지"])).toBe(64);
      expect(runGateCli(["--help"])).toBe(0);
    } finally {
      console.error = origErr;
      console.log = origLog;
    }
  });

  it("formatHuman: 판정 불가 범례는 해당 화면이 있을 때만", () => {
    const root = freshDir();
    seedRun(root, "site", { violations: 0, target: { label: "https://a.test/", kind: "url" } });
    const out = formatHuman(judge({ dir: root }), "reports");
    expect(out).toContain("판정 불가");
    expect(out).toContain("통과 보증이 아니다");
  });
});

describe("무효 검사 기록", () => {
  it("검사가 무효(킷 미로드 등 status error)면 통과로 세지 않고 재검사를 요구한다 (exit 2)", () => {
    const root = freshDir();
    const dir = join(root, "notice");
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, `${STAMP}.json`),
      JSON.stringify({
        target: { label: "https://a.test/", kind: "url" },
        report: { items: [] },
        results: [
          {
            target: { id: "validate:https://a.test/", kind: "site", url: "https://a.test/" },
            status: "error",
            scannedAt: "2026-10-12T05:14:57.000Z",
            reason: "킷 CSS/JS 미로드 — 스타일·스크립트 없는 DOM 검사는 무효",
          },
        ],
      }),
    );
    const result = judge({ dir: root });
    expect(result.exitCode).toBe(2);
    expect(result.screens[0]!.invalid).toContain("킷 CSS/JS 미로드");
    expect(result.reason).toContain("검사 무효");
    expect(result.reason).not.toContain("통과");
  });
});

describe("url 검사의 낡음 — sourceDir 수정 시각으로 판정 (dev 서버 검사가 전부 판정 불가이던 공백)", () => {
  const OLD = new Date(RAN_AT.getTime() - 60_000);
  const NEW = new Date(RAN_AT.getTime() + 60_000);
  const src = (root: string, files: Record<string, Date>) => {
    for (const [rel, mtime] of Object.entries(files)) {
      const path = join(root, "src", rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, "x");
      utimesSync(path, mtime, mtime);
    }
    return join(root, "src");
  };

  it("검사 뒤 소스 수정 없음 → fresh, 수정 → stale(exit 2)", () => {
    const root = freshDir();
    const dir = src(root, { "App.tsx": OLD, "pages/Form.tsx": OLD });
    seedRun(join(root, "reports"), "localhost", { target: { label: "http://localhost:5173/", kind: "url", sources: [dir] } });
    expect(judge({ dir: join(root, "reports") }).screens[0]!.staleness).toBe("fresh");
    utimesSync(join(dir, "pages/Form.tsx"), NEW, NEW);
    const r = judge({ dir: join(root, "reports") });
    expect(r.screens[0]!.staleness).toBe("stale");
    expect(r.exitCode).toBe(2);
  });

  it("node_modules·reports·dist만 바뀌면 소스 변경이 아니다", () => {
    const root = freshDir();
    const dir = src(root, { "App.tsx": OLD, "node_modules/x/index.js": NEW, "reports/a/validate-x.json": NEW, "dist/app.js": NEW });
    seedRun(join(root, "reports"), "localhost", { target: { label: "http://localhost:5173/", kind: "url", sources: [dir] } });
    expect(judge({ dir: join(root, "reports") }).screens[0]!.staleness).toBe("fresh");
  });

  it("sourceDir가 없거나 사라졌으면 지금처럼 판정 불가", () => {
    const root = freshDir();
    seedRun(join(root, "reports"), "a", { target: { label: "http://localhost/", kind: "url" } });
    seedRun(join(root, "reports"), "b", { target: { label: "http://localhost/b", kind: "url", sources: [join(root, "없는-폴더")] } });
    expect(judge({ dir: join(root, "reports") }).screens.map((s) => s.staleness)).toEqual(["unknown", "unknown"]);
  });

  it("latestMtime — 상한을 넘으면 판정 불가(undefined)", () => {
    const root = freshDir();
    const dir = src(root, { "a.ts": OLD, "b.ts": OLD, "c.ts": NEW });
    expect(latestMtime([dir])).toBe(NEW.getTime());
    expect(latestMtime([dir], 2)).toBeUndefined();
  });

  it("판정 불가 통과 문구가 sourceDir을 안내한다", () => {
    const root = freshDir();
    seedRun(join(root, "reports"), "a", { target: { label: "http://localhost/", kind: "url" } });
    expect(judge({ dir: join(root, "reports") }).reason).toContain("sourceDir");
  });
});
