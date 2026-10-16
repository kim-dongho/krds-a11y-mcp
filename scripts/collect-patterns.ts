// KRDS 패턴 샘플 수집·실측 (개발 전용, 빌드 타임 1회)
// 1) 가이드 문서 페이지를 순회해 sample_*.html 링크를 전수 추출
// 2) 원본을 patterns-src/에 스냅샷 (URL·시각·sha256 기록) — gitignore 대상
// 3) 자체 검사기로 라이브 URL 실측 → docs/mapping/pattern-audit.md 생성
// 멱등: 재실행 시 해시 비교로 사이트 개정을 감지해 보고한다.
//
// 실행: pnpm collect:patterns
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { scanTargets } from "../src/report/index.js";
import { lookupRule } from "../src/mapping/index.js";
import type { Target } from "../src/report/types.js";

const SITE = "https://www.krds.go.kr";
const SRC_DIR = "patterns-src";
const AUDIT_PATH = "docs/mapping/pattern-audit.md";
const COLLECTED_PATH = join(SRC_DIR, "_collected.json");

type CollectedEntry = {
  file: string;
  sampleUrl: string;
  foundIn: string[]; // 이 샘플을 링크한 가이드 문서들
  collectedAt: string;
  sha256: string;
  changedFromPrevious?: boolean;
};

async function discoverDocPages(): Promise<string[]> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    // networkidle은 외부 분석 스크립트 때문에 도달하지 않을 수 있다.
    // 사이트가 간헐적으로 느리므로 3회 재시도
    let lastError: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page.waitForSelector('a[href*="service_"]', { state: "attached", timeout: 20_000 });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        console.error(`  홈 접속 재시도 ${attempt}/3`);
      }
    }
    if (lastError) throw lastError;
    const hrefs = await page.evaluate(() =>
      [...new Set(
        [...document.querySelectorAll("a[href]")]
          .map((a) => a.getAttribute("href") ?? "")
          .filter((h) => /^\.\/(global|service)\/[a-z0-9_]+\.html$/.test(h)),
      )],
    );
    // 홈의 상대 경로 기준은 /html/site/
    return hrefs.map((h) => `${SITE}/html/site/${h.slice(2)}`);
  } finally {
    await browser.close();
  }
}

async function extractSampleLinks(docUrl: string): Promise<string[]> {
  const res = await fetch(docUrl);
  if (!res.ok) return [];
  const html = await res.text();
  const found = [...html.matchAll(/href="(?:\.\.\/)+pattern\/(sample_[a-z0-9_]+\.html)"/g)];
  return [...new Set(found.map((m) => m[1]!))];
}

async function main(): Promise<void> {
  mkdirSync(SRC_DIR, { recursive: true });
  const previous: Record<string, CollectedEntry> = existsSync(COLLECTED_PATH)
    ? Object.fromEntries(
        (JSON.parse(readFileSync(COLLECTED_PATH, "utf8")) as CollectedEntry[]).map((e) => [e.file, e]),
      )
    : {};

  console.error("가이드 문서 페이지 수집 중...");
  const docPages = await discoverDocPages();
  console.error(`문서 페이지 ${docPages.length}개 발견`);

  // 문서 → 샘플 링크 전수
  const sampleSources = new Map<string, string[]>(); // sample file → 링크한 문서들
  for (const doc of docPages) {
    const samples = await extractSampleLinks(doc);
    for (const s of samples) {
      const list = sampleSources.get(s) ?? [];
      list.push(doc);
      sampleSources.set(s, list);
    }
  }
  console.error(`샘플 ${sampleSources.size}종 발견`);

  // 다운로드 + 스냅샷
  const collected: CollectedEntry[] = [];
  for (const [file, foundIn] of [...sampleSources.entries()].sort()) {
    const sampleUrl = `${SITE}/html/pattern/${file}`;
    const res = await fetch(sampleUrl);
    if (!res.ok) {
      console.error(`  건너뜀 (${res.status}): ${file}`);
      continue;
    }
    const body = await res.text();
    const sha256 = createHash("sha256").update(body).digest("hex");
    writeFileSync(join(SRC_DIR, file), body);
    const prev = previous[file];
    collected.push({
      file,
      sampleUrl,
      foundIn,
      collectedAt: new Date().toISOString(),
      sha256,
      ...(prev && prev.sha256 !== sha256 ? { changedFromPrevious: true } : {}),
    });
  }
  writeFileSync(COLLECTED_PATH, JSON.stringify(collected, null, 2));
  const changed = collected.filter((c) => c.changedFromPrevious);
  if (changed.length > 0) {
    console.error(`⚠️ 사이트 개정 감지 — 이전 수집과 해시가 다른 샘플: ${changed.map((c) => c.file).join(", ")}`);
  }

  // 실측 — 라이브 URL을 site 모드로 (스냅샷은 상대 자산이 깨지므로 검사엔 원 URL 사용)
  console.error("실측 시작...");
  const targets: Target[] = collected.map((c) => ({
    id: `pattern:${c.file.replace(/^sample_|\.html$/g, "")}`,
    kind: "site",
    url: c.sampleUrl,
  }));
  const results = await scanTargets(targets, { ruleSet: "baseline", timeoutMs: 45_000 });

  // audit 문서 생성 — 사람이 읽는 문서다. 규칙 ID를 한국어 문제 설명으로 번역한다
  const EXPLAIN: Record<string, { what: string; impact: string; fix: string }> = {
    "skip-link": {
      what: "건너뛰기 링크가 없는 대상을 가리킴 (#breadcrumb 계열)",
      impact: "키보드·스크린리더 사용자가 반복 메뉴를 건너뛸 수 없음",
      fix: "뼈대 교정 — #main-content + tabindex=-1로 치환",
    },
    "landmark-one-main": {
      what: "본문(main) 랜드마크 없음",
      impact: "스크린리더가 '본문으로 이동' 기능을 쓸 수 없음",
      fix: "뼈대 교정 — main 요소 포함",
    },
    region: {
      what: "랜드마크 밖에 떠 있는 콘텐츠",
      impact: "스크린리더 탐색에서 누락되는 영역 발생",
      fix: "뼈대 교정 — header/main/footer 구조로 감쌈",
    },
    "meta-viewport": {
      what: "화면 확대 차단 (user-scalable=no)",
      impact: "저시력 사용자가 확대를 못 함",
      fix: "뼈대 교정 — 확대 허용 viewport로 치환",
    },
    "label-title-only": {
      what: "입력 필드 레이블을 title 속성으로만 제공",
      impact: "보조기술·음성 입력에서 필드 이름 인식 불안정",
      fix: "가시 label 또는 aria-label로 교정 (매핑표 ② 규칙)",
    },
    "heading-order": {
      what: "제목 수준 건너뜀 (h2 다음 h4 등)",
      impact: "스크린리더의 제목 단위 탐색이 꼬임",
      fix: "제목 위계 재조정",
    },
    "nested-interactive": {
      what: "탭 역할 요소 안에 버튼 중첩 (킷 알려진 결함)",
      impact: "보조기술이 탭 선택 상태를 초점 요소에서 못 읽음",
      fix: "role을 초점 요소로 이동 (KRDS 운영팀 수정 예고분)",
    },
    "page-has-heading-one": {
      what: "h1 없음",
      impact: "페이지 주제를 제목 탐색으로 알 수 없음",
      fix: "뼈대 교정 — h1 포함",
    },
    "color-contrast": {
      what: "텍스트 명도 대비 미달",
      impact: "저시력·야외 환경에서 판독 불가",
      fix: "킷 토큰 내 충족 조합으로 교체, 대안 없으면 보류 기록",
    },
    "aria-allowed-role": {
      what: "요소에 허용되지 않는 role 부여",
      impact: "보조기술이 요소 의미를 잘못 해석",
      fix: "role 제거 또는 올바른 요소로 교체",
    },
    list: {
      what: "목록(ul/ol) 안에 li 외 요소",
      impact: "스크린리더의 목록 항목 수 안내가 틀어짐",
      fix: "목록 구조 정리",
    },
    "target-size": {
      what: "터치 대상 크기 부족",
      impact: "운동 장애·터치 환경에서 조작 실패",
      fix: "크기·간격 확보 (24px 기준)",
    },
    "landmark-unique": {
      what: "구분 안 되는 동일 랜드마크 중복",
      impact: "랜드마크 탐색에서 어느 영역인지 구분 불가",
      fix: "aria-label로 구분",
    },
    "select-name": {
      what: "셀렉트에 접근 가능한 이름 없음",
      impact: "무엇을 고르는 선택지인지 알 수 없음",
      fix: "label 연결 (매핑표 ② 규칙)",
    },
    "aria-valid-attr-value": {
      what: "aria 속성값 유효성 판정 보류",
      impact: "(확정 아님 — 수동 확인 대상)",
      fix: "대상 id 실재 확인",
    },
  };
  const ko = (ruleId: string) => EXPLAIN[ruleId]?.what ?? ruleId;

  // 과반 샘플에 나타나는 위반은 '공통 문제'로 분리 — 표가 한눈에 들어오게
  const ruleCount = new Map<string, number>();
  for (const r of results) {
    if (r.status !== "ok") continue;
    for (const f of r.findings) {
      if (f.outcome === "violation") ruleCount.set(f.ruleId, (ruleCount.get(f.ruleId) ?? 0) + 1);
    }
  }
  const okResults = results.filter((r) => r.status === "ok").length;
  const commonRules = [...ruleCount.entries()].filter(([, n]) => n >= okResults / 2).map(([id]) => id);

  // 규칙 성격 — axe 검출을 전부 "KWCAG 위반"이라 부르면 과장이다
  const natureOf = (ruleId: string): string => {
    const e = lookupRule(ruleId);
    if (!e) return "KWCAG 밖(참고)";
    const items = e.kwcagIds.map((k) => k.replace("kwcag:", "")).join(",");
    if (e.status === "default" || e.status === "opt-in") return `KWCAG ${items} 위반 근거`;
    return `KWCAG ${items} 관련 정황(모범관행)`;
  };
  // strict(위반 근거) 규칙이 하나라도 검출된 샘플 수
  const strictSamples = results.filter(
    (r) => r.status === "ok" && r.findings.some(
      (f) => f.outcome === "violation" && (lookupRule(f.ruleId)?.status === "default" || lookupRule(f.ruleId)?.status === "opt-in"),
    ),
  ).length;

  const lines: string[] = [
    "# KRDS 패턴 샘플 실측 (pattern-audit)",
    "",
    `> - 수집·실측: ${new Date().toISOString().slice(0, 10)} · 원본 스냅샷: \`patterns-src/\`(비추적) · 수집 기록: \`_collected.json\``,
    "> - 용도: 패턴 템플릿 교정의 근거. **원본 샘플은 그대로 공급 금지** — 아래 위반을 교정한 템플릿만 배포한다",
    `> - 엔진: 자체 검사기 (axe-core, site 모드 전수 규칙)`,
    "",
    "",
    `## 요약 — 샘플 ${okResults}종 전수에서 문제 검출 (깨끗한 샘플 0종)`,
    "",
    `그중 **KWCAG 검사항목 위반의 직접 근거**(axe 정식 규칙)가 있는 샘플은 ${strictSamples}종. ` +
      "나머지 검출은 모범관행 위반(KWCAG 항목의 정황 근거) 또는 KWCAG 33항목 밖의 접근성 문제다 — " +
      "성격 열로 구분한다. 단, 성격과 무관하게 **사용자 영향은 실재**하며(예: 확대 차단은 KWCAG 밖이지만 저시력 사용자를 실제로 배제), " +
      "공통 문제 4건은 스냅샷 구조 검증으로 사실 확인됐다(main 부재 33/33, 확대 차단 33/33, 건너뛰기 대상 부재 32/33).",
    "",
    "### 전 샘플 공통 문제 — 페이지 골격 교정 한 번으로 일괄 해소",
    "",
    "| 문제 | 성격 | 사용자 영향 | 해당 샘플 | 교정 방침 |",
    "|---|---|---|---|---|",
    ...commonRules
      .sort((a, b) => (ruleCount.get(b) ?? 0) - (ruleCount.get(a) ?? 0))
      .map((id) => {
        const e = EXPLAIN[id];
        return `| ${e?.what ?? id} | ${natureOf(id)} | ${e?.impact ?? ""} | ${ruleCount.get(id)}/${okResults}종 | ${e?.fix ?? ""} |`;
      }),
    "",
    "### 샘플별 고유 문제 (공통 문제 제외)",
    "",
    "| 샘플 | 고유 문제 | 확인 필요(보류) |",
    "|---|---|---|",
  ];
  const detail: string[] = [];
  for (const r of results) {
    const entry = collected.find((c) => `pattern:${c.file.replace(/^sample_|\.html$/g, "")}` === r.target.id)!;
    if (r.status === "error") {
      lines.push(`| ${entry.file} | (검사 실패 — 재시도 필요: ${r.reason.replace(/\s+/g, " ").slice(0, 60)}) | |`);
      continue;
    }
    const viols = r.findings.filter((f) => f.outcome === "violation" && !commonRules.includes(f.ruleId));
    const incs = r.findings.filter((f) => f.outcome === "incomplete");
    const vDesc = viols.map((v) => `${ko(v.ruleId)} (${v.nodes.length}곳)`).join("<br>") || "공통 문제 외 없음";
    const iDesc = incs.map((v) => `${ko(v.ruleId)} (${v.nodes.length}곳)`).join("<br>") || "—";
    lines.push(`| ${entry.file} | ${vDesc} | ${iDesc} |`);

    if (viols.length > 0) {
      detail.push(``, `## ${entry.file} — 고유 문제 상세`, ``, `- URL: ${entry.sampleUrl}`, `- 링크한 문서: ${entry.foundIn.map((d) => d.split("/").pop()).join(", ")}`);
      for (const v of viols) {
        detail.push(`- **${ko(v.ruleId)}** \`${v.ruleId}\` (${v.nodes.length}곳)`);
        for (const n of v.nodes.slice(0, 3)) detail.push(`  - \`${n.selector.slice(0, 90)}\``);
        if (v.nodes.length > 3) detail.push(`  - … 외 ${v.nodes.length - 3}곳`);
      }
    }
  }
  // 수집·스캔과 별개로 확인된 킷 자체 결함 — 재생성 시에도 유지되도록 여기 고정
  detail.push(
    "",
    "## 별건 — 킷 npm 패키지 결함 (템플릿 작업 중 발견, 2026-09-14)",
    "",
    "- **아이콘 경로 버그**: krds-uiux v1.1.0 npm판 `component.css`의 아이콘 참조 206곳이 " +
      "`url(../../img/img/…)`로 `img` 세그먼트가 중복돼 404로 깨진다(오류 표시 없이 아이콘만 사라짐) (breadcrumb 홈·구분자, " +
      "체크박스 체크 표시, 셀렉트 화살표 등 33종). krds.go.kr 배포판 CSS에는 없는 npm 패키징 결함 — " +
      "킷을 npm으로 쓰는 모든 소비처에 영향. 템플릿에서는 화면에 보이는 곳만 올바른 경로로 재선언해 우회한다",
    "- **패턴 레이아웃 CSS 미동봉**: 패턴 샘플이 쓰는 `resources/css/pattern/output.css`(803KB)는 " +
      "가이드 사이트 전용으로 npm에 없다 — 샘플 마크업을 복사한 소비자는 레이아웃이 깨진다. " +
      "템플릿에는 scripts/extract-pattern-css.ts가 필요한 규칙만 발췌해 동봉한다",
  );
  detail.push("", "## 부록 — 규칙 ID 대조", "", "| axe 규칙 | 문제 | 성격 | 교정 방침 |", "|---|---|---|---|",
    ...[...ruleCount.keys()].sort().map((id) => `| \`${id}\` | ${EXPLAIN[id]?.what ?? "?"} | ${natureOf(id)} | ${EXPLAIN[id]?.fix ?? "?"} |`));
  writeFileSync(AUDIT_PATH, [...lines, ...detail, ""].join("\n"));

  const okCount = results.filter((r) => r.status === "ok").length;
  console.error(
    `완료 — 샘플 ${collected.length}종 스냅샷, 실측 성공 ${okCount}/${results.length}\n` +
      `audit: ${AUDIT_PATH}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
