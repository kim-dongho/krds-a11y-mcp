// 검사 기록의 이름 규칙과 화면별 최신 상태 요약(SUMMARY.md)
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHROME_MISSING, listRuns, readRunStats } from "../runs/index.js";

/** 검사 산출물 파일명의 몸통 — 시각 기반이라 실행마다 고유하다 */
export function validateStamp(now: Date = new Date()): string {
  return `validate-${now.toISOString().replace(/[:.]/g, "-").slice(0, 19)}`;
}

/** 검사 대상 → 산출물 하위 폴더명 — 같은 화면의 검사 이력이 한 폴더에 모인다 */
/** 화면 이름(validate_page screen) → 기록 폴더 이름. 상태 변형·호스트가 달라도 같은 이름이면 이력이 한 곳에 모인다 */
export function screenSlug(name: string): string {
  return toSlug(name.trim());
}

const toSlug = (base: string) =>
  base
    .replace(/\.html?$/i, "")
    .replace(/[^a-zA-Z0-9가-힣._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "page";

export function targetSlug(label: string): string {
  let base: string;
  if (/^https?:\/\//.test(label)) {
    const u = new URL(label);
    base = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
  } else if (label === "(html 문자열)") {
    base = "inline";
  } else {
    base = label.split("/").pop() ?? label;
  }
  return toSlug(base);
}

/** outDir 전체의 화면별 최신 상태 인덱스를 재생성 — "지금 뭐가 어떤 상태인지" 한 장 */
export function writeSummary(outRoot: string): string {
  const lines = [
    "# 접근성 검사 현황",
    "",
    "화면별 최근 검사 결과 요약. 검사(validate_page)를 실행할 때마다 자동 갱신된다.",
    "",
    "| 화면 | 마지막 검사 | 접근성 위반 | 사람 확인 필요 | KRDS 사용 문제 | 리소스 문제 | 누적 검사 |",
    "|---|---|---|---|---|---|---|",
  ];
  const screens = readdirSync(outRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const s of screens) {
    const runs = listRuns(join(outRoot, s));
    if (runs.length === 0) continue;
    const last = readRunStats(runs[runs.length - 1]!);
    if (!last) continue;
    const when = last.stamp.replace("validate-", "").replace("T", " ").replace(/-(\d\d)-(\d\d)$/, ":$1:$2");
    // 검사 무효 기록은 위반 0으로 보이면 안 된다 — 킷 미로드 등으로 검사 자체가 실패했다
    const v = last.invalid ? "**검사 무효**" : last.violations > 0 ? `**${last.violations}**` : "0";
    const pi = last.pageIssues > 0 ? `**${last.pageIssues}**` : "0";
    lines.push(`| ${s} | ${when} | ${v} | ${last.needsReview} | ${last.kitIssues} | ${pi} | ${runs.length} |`);
  }
  lines.push(
    "",
    "각 열의 뜻:",
    "",
    "- **접근성 위반**: 자동 검사에서 확정된 KWCAG 위반 수. 0이어야 하고, 0이 아니면 해당 화면 폴더의 최신 리포트를 열어 교정한다",
    "- **사람 확인 필요**: 도구가 위반으로 확정하지 못하고 보류한 것(예: 배경 이미지 위 글자의 명도 대비). 리포트에 위치·실측값이 있으니 눈으로 확인만 하면 된다",
    "- **KRDS 사용 문제**: KRDS 부품·스타일을 잘못 쓴 곳 — 킷 컴포넌트 대신 직접 만든 입력·버튼, 킷 스타일을 덮어쓰는 커스텀 CSS 등. 접근성 보장이 깨질 수 있는 지점",
    "- **리소스 문제**: 로드 실패(404)·스크립트 에러. KWCAG 위반은 아니지만 아이콘·이미지가 조용히 사라진 신호 — 위반 0이어도 이 칸이 0이 아니면 화면을 눈으로 확인한다",
    "- **누적 검사**: 이 화면을 지금까지 검사한 횟수 (이력은 화면 폴더에 시각순으로 쌓임)",
    "",
    "상세 근거는 각 화면 폴더의 최신 validate-*.md, 화면 모습은 같은 이름의 .png(첫 화면)·.full.png(전체)를 본다.",
  );
  const path = join(outRoot, "SUMMARY.md");
  writeFileSync(path, lines.join("\n"));
  return path;
}

/**
 * 공통부 누락 차단 안내 — 리포트 맨 앞에 붙인다. 공통부 누락이 없으면 undefined.
 * 순수 함수라 브라우저 없이 테스트한다.
 */
export function chromeBanner(kitIssues: string[] | undefined): string | undefined {
  const hit = (kitIssues ?? []).find((i) => i.startsWith(CHROME_MISSING));
  if (!hit) return undefined;
  return [
    "> **⚠ 사이트 공통부(헤더·푸터) 누락 — 이 화면은 gate(Stop 훅)가 막는다.**",
    "> 아래 결론이 접근성 위반 0이어도 통과하지 않는다. 완성 페이지면 get_page_scaffold의 withSiteChrome: true로 공통부를 넣고,",
    '> 팝업·인쇄용처럼 일부러 뺀 페이지면 body에 data-krds-a11y="no-chrome"을 붙인 뒤 다시 검사하라.',
  ].join("\n");
}
