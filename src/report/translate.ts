import { KWCAG_ITEMS, lookupRule } from "../mapping/index.js";
import type {
  AxeFinding,
  ItemVerdict,
  ManualCheck,
  Report,
  ScanResult,
} from "./types.js";

const PARTIAL_CAVEAT = "형식 요건 통과, 내용 미검증";

/** "kwcag:5.1.1" → [5,1,1] 숫자 비교로 결정적 정렬 */
function compareKwcagId(a: string, b: string): number {
  const seg = (s: string) => s.replace("kwcag:", "").split(".").map(Number);
  const [x, y] = [seg(a), seg(b)];
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  }
  return 0;
}

function sortFinding(a: AxeFinding, b: AxeFinding): number {
  return (
    a.ruleId.localeCompare(b.ruleId) ||
    a.outcome.localeCompare(b.outcome) ||
    (a.targetId ?? "").localeCompare(b.targetId ?? "")
  );
}

/** 순수 함수: 스캔 결과들을 KWCAG 33항목 축으로 재집계한다 (design.md §3) */
export function translate(results: ScanResult[]): Report {
  const ok = results.filter((r) => r.status === "ok");
  const errors = results.filter((r) => r.status === "error");

  // 항목별 finding 귀속 + 매핑 밖 규칙 분리
  const byItem = new Map<string, AxeFinding[]>();
  const outOfMap: AxeFinding[] = [];
  for (const scan of ok) {
    for (const finding of scan.findings) {
      const attributed = { ...finding, targetId: scan.target.id };
      const entry = lookupRule(finding.ruleId);
      if (!entry) {
        if (finding.outcome === "violation" || finding.outcome === "incomplete") {
          outOfMap.push(attributed);
        }
        continue;
      }
      for (const kwcagId of entry.kwcagIds) {
        const list = byItem.get(kwcagId) ?? [];
        list.push(attributed);
        byItem.set(kwcagId, list);
      }
    }
  }

  const items: ItemVerdict[] = KWCAG_ITEMS.map((item) => {
    const findings = (byItem.get(item.id) ?? []).slice().sort(sortFinding);
    const has = (o: AxeFinding["outcome"]) => findings.some((f) => f.outcome === o);

    // 등급 우선순위 — design.md §3. coverage none은 결과와 무관하게 not-tested
    let grade: ItemVerdict["grade"];
    if (item.coverage === "none") grade = "not-tested";
    else if (has("violation")) grade = "violation";
    else if (has("incomplete")) grade = "needs-review";
    else if (has("pass")) grade = "auto-pass";
    else grade = "not-applicable"; // inapplicable만 있거나 규칙 미실행

    const verdict: ItemVerdict = {
      kwcagId: item.id,
      name: item.name,
      principle: item.principle,
      coverage: item.coverage,
      grade,
      evidence: findings.filter(
        (f) => f.outcome === "violation" || f.outcome === "incomplete",
      ),
    };
    if (grade === "auto-pass" && item.coverage === "partial") {
      verdict.caveat = PARTIAL_CAVEAT;
    }
    return verdict;
  }).sort((a, b) => compareKwcagId(a.kwcagId, b.kwcagId));

  const manualChecklist: ManualCheck[] = [
    ...KWCAG_ITEMS.filter((i) => i.coverage === "none").map((i) => ({
      kwcagId: i.id,
      name: i.name,
      reason: "none" as const,
      how: i.manualHow ?? "수동 확인",
    })),
    ...items
      .filter((v) => v.grade === "needs-review")
      .map((v) => ({
        kwcagId: v.kwcagId,
        name: v.name,
        reason: "needs-review" as const,
        how: "axe가 판정을 보류한 노드를 직접 확인 (evidence 참조)",
      })),
  ].sort((a, b) => compareKwcagId(a.kwcagId, b.kwcagId));

  const firstOk = ok[0];
  return {
    meta: {
      targets: results.map((r) => r.target),
      scannedAt: firstOk?.scannedAt ?? new Date(0).toISOString(),
      engine: firstOk?.engine ?? {
        axeVersion: "unknown",
        ruleSet: "baseline",
        assetsLoaded: false,
      },
      errors,
    },
    items,
    outOfMap: outOfMap.slice().sort(sortFinding),
    manualChecklist,
  };
}
