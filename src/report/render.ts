import { prescriptionFor } from "../mapping/fix-prescriptions.js";
import { MANUAL_GUIDE } from "./manual-guide.js";
import type { AxeFinding, Grade, ItemVerdict, Report } from "./types.js";

const GRADE_LABEL: Record<Grade, string> = {
  violation: "위반",
  "needs-review": "확인필요",
  "auto-pass": "자동통과",
  "not-applicable": "해당없음",
  "not-tested": "미검사",
};

const MAX_NODES_PER_TARGET = 5; // 초과분은 건수만 명시 (침묵 절단 금지)

/** 자주 나오는 axe 규칙의 한글 표시명 — 표시 전용, 판정과 무관 */
const RULE_LABEL: Record<string, string> = {
  "color-contrast": "텍스트 명도 대비 (4.5:1)",
  "kbd-focus-visible": "키보드 초점 표시",
  "kbd-reachable": "키보드 도달",
  "kbd-tab-order": "Tab 순서",
  "image-alt": "이미지 대체 텍스트",
  "link-name": "링크의 접근 가능한 이름",
  "button-name": "버튼의 접근 가능한 이름",
  "select-name": "셀렉트의 접근 가능한 이름",
  label: "폼 컨트롤의 레이블",
  bypass: "반복 영역 건너뛰기 수단",
  "skip-link": "건너뛰기 링크 연결",
  region: "랜드마크 밖 콘텐츠",
  "landmark-unique": "동일 랜드마크 구분",
  "heading-order": "제목 수준 순서",
  "document-title": "문서 제목",
  "html-has-lang": "문서 기본 언어",
  "target-size": "터치 대상 크기 (24px)",
  "meta-viewport": "화면 확대 허용",
  tabindex: "양수 tabindex 금지",
  list: "목록 구조",
  "aria-allowed-role": "요소에 허용되지 않는 role",
  "nested-interactive": "초점 요소 중첩",
  "page-has-heading-one": "h1 존재",
  "landmark-one-main": "main 랜드마크 존재",
};

/** axe 영문 사유의 한글 요약 — 첫 매칭 패턴으로 번역, 없으면 원문 첫 줄 */
const SUMMARY_KO: [RegExp, string][] = [
  [/partially obscured by another element/i, "다른 요소에 가려 배경색을 판정하지 못함"],
  [/insufficient color contrast/i, "명도 대비 미달"],
  [/does not have an? accessible name|no accessible name/i, "접근 가능한 이름 없음"],
  [/element does not have an alt attribute/i, "alt 속성 없음"],
  [/form element does not have.*label/i, "레이블 연결 없음"],
  [/target size.*insufficient|element has insufficient size/i, "터치 대상 크기 부족"],
  [/background image/i, "배경 이미지 위 텍스트 — 대비를 눈으로 확인"],
  [/skip link|internal link/i, "건너뛰기 링크 없음 또는 대상 미연결"],
  [/main landmark/i, "main 랜드마크 없음"],
  [/landmarks/i, "랜드마크 밖에 콘텐츠가 있음"],
  [/lang attribute/i, "html lang 속성 없음 또는 잘못됨"],
  [/discernible text|link has no/i, "링크에 읽을 수 있는 텍스트 없음"],
];

function summaryKo(finding: AxeFinding): string {
  const raw = finding.nodes[0]?.summary ?? "";
  for (const [re, ko] of SUMMARY_KO) {
    if (re.test(raw)) return ko;
  }
  // "Fix any/all of the following:" 머리말은 정보가 없다 — 다음 줄(실제 사유)을 쓴다
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^Fix (any|all) of the following:$/.test(l));
  return lines[0] ?? "";
}

/** axe 보류 사유 키(messageKey) → 표에 넣을 짧은 이름 */
const REASON_SHORT: Record<string, string> = {
  pseudoContent: "가상요소 장식",
  elmPartiallyObscured: "일부 가려짐",
  bgImage: "배경 이미지",
  bgGradient: "배경 그라데이션",
  fgAlpha: "반투명 글자",
  complexTextShadows: "텍스트 그림자",
  shortTextContent: "짧은 텍스트",
};

/** 사유별 확인 방법 — 표 아래 범례에 한 번만 적는다 */
const REASON_HOW: Record<string, string> = {
  pseudoContent: "::before/::after 장식이 글자 뒤 배경을 칠하는지 확인 (칠하지 않으면 실측값이 곧 답)",
  elmPartiallyObscured: "다른 요소가 글자 위에 겹쳐 있어 axe가 배경을 못 읽음 — 겹친 상태를 눈으로 확인",
  bgImage: "배경 이미지 위 텍스트 — 이미지에서 가장 밝거나 어두운 지점과의 대비를 눈으로 확인",
  bgGradient: "그라데이션 배경 — 가장 불리한 지점의 대비를 눈으로 확인",
  fgAlpha: "글자색이 반투명 — 겹쳐 보이는 실제 색 기준으로 확인",
  complexTextShadows: "그림자 포함 대비를 눈으로 확인",
  shortTextContent: "한두 글자짜리 텍스트 — 장식이면 대상 아님, 읽는 글자면 대비 확인",
};

type ContrastNode = {
  messageKey?: string;
  expected?: string;
  measured?: { fg: string; bg: string; ratio: number };
  inactive?: boolean;
};

/** 판단 칸: 실측·비활성 정보로 사람이 할 일을 압축한다 */
function contrastVerdict(n: ContrastNode): string {
  if (!n.measured) return "직접 확인";
  const need = Number.parseFloat(n.expected ?? "4.5");
  if (n.measured.ratio >= need) return "충족 ✓";
  return n.inactive ? "미달이나 비활성 요소 — 예외 검토" : "**미달 ✗ — 교정 필요**";
}

/** "tpl:apply-form" → "apply-form" — 표시용 짧은 이름 */
const shortId = (id: string | undefined): string => (id ?? "?").replace(/^(tpl|kit|site):/, "");
const shortKwcag = (id: string): string => id.replace("kwcag:", "");

function ruleLine(ruleId: string): string {
  const label = RULE_LABEL[ruleId];
  return label ? `\`${ruleId}\` (${label})` : `\`${ruleId}\``;
}

/** 규칙별 교정 처방 한 줄 — 근거 있는 처방만 (src/mapping/fix-prescriptions.ts) */
function prescriptionLine(ruleId: string): string | undefined {
  const p = prescriptionFor(ruleId);
  if (!p) return undefined;
  const comp = p.component ? ` (get_component('${p.component}')로 받는다)` : "";
  return `  - **교정 방법**: ${p.fix}${comp}`;
}

/** 검출 1건(규칙×대상)을 대상별로 묶어 사람이 찾아갈 수 있게 쓴다 */
function evidenceLines(evidence: AxeFinding[]): string[] {
  const lines: string[] = [];
  // 규칙별로 묶고, 규칙 안에서 대상별로 나열
  const byRule = new Map<string, AxeFinding[]>();
  for (const f of evidence) {
    const list = byRule.get(f.ruleId) ?? [];
    list.push(f);
    byRule.set(f.ruleId, list);
  }
  for (const [ruleId, findings] of byRule) {
    // 위반 확정 노드와 판정 보류 노드를 합산하지 않는다 — "위반 53곳"처럼 보류 52곳이
    // 위반으로 둔갑해 읽히는 집계 버그가 실사용에서 실측됐다 (2026-10-07, JSP 감사 2차 확인)
    const violTotal = findings
      .filter((f) => f.outcome === "violation")
      .reduce((n, f) => n + f.nodes.length, 0);
    const incTotal = findings
      .filter((f) => f.outcome !== "violation")
      .reduce((n, f) => n + f.nodes.length, 0);
    const totalLabel =
      violTotal > 0 && incTotal > 0
        ? `위반 ${violTotal}곳 + 판정 보류 ${incTotal}곳 (보류는 사람 확인 몫 — 위반 아님)`
        : violTotal > 0
          ? `합계 ${violTotal}곳`
          : `판정 보류 ${incTotal}곳`;
    const measurable = findings.some((f) => f.nodes.some((n) => n.measured || n.messageKey));

    if (!measurable) {
      // 일반 규칙 — 목록 표기
      // 대표 문장은 위반 쪽 — 보류 문장이 대표로 찍혀 "판정할 수 없다"처럼 읽히던 문제 (실측)
      const lead = findings.find((f) => f.outcome === "violation") ?? findings[0]!;
      lines.push(`- ${ruleLine(ruleId)} — ${summaryKo(lead)} (${totalLabel})`);
      const rx = prescriptionLine(ruleId);
      if (rx) lines.push(rx);
      // 키보드 검사는 노드마다 사유가 다르다 (위반 / 글자색만 / 숨긴 요소) — 사유를 함께 쓴다
      const perNode = ruleId.startsWith("kbd-");
      for (const f of findings) {
        const shown = f.nodes.slice(0, MAX_NODES_PER_TARGET);
        for (const n of shown) {
          const tag = f.outcome === "violation" ? "" : "[보류] ";
          lines.push(`  - ${shortId(f.targetId)}: \`${n.selector}\`${perNode ? ` — ${tag}${n.summary}` : ""}`);
        }
        if (f.nodes.length > shown.length) {
          lines.push(`  - ${shortId(f.targetId)}: … 외 ${f.nodes.length - shown.length}곳 (원시 데이터 JSON에 전체 기록)`);
        }
      }
      continue;
    }

    // 명도 대비 계열 — 표 + 범례
    lines.push(`${ruleLine(ruleId)} — ${totalLabel}`);
    {
      const rx = prescriptionLine(ruleId);
      if (rx) lines.push(rx.replace(/^  - /, ""));
    }
    lines.push("");
    lines.push(
      "**실측**은 이 도구가 요소의 글자색과 배경색을 계산해 직접 잰 대비값이다. " +
        "배경이 단색이면 그대로 믿어도 되고, 이미지·그라데이션·장식 위에서는 참고값이다 — " +
        "그래서 '사유' 칸의 상황만 눈으로 확인하면 된다. 기준은 본문 4.5:1, 큰 글자 3:1.",
    );
    lines.push("");
    lines.push("| 템플릿 | 위치 | 사유 | 실측 | 기준 | 판단 |");
    lines.push("|---|---|---|---|---|---|");
    const usedReasons = new Set<string>();
    for (const f of findings) {
      const shown = f.nodes.slice(0, MAX_NODES_PER_TARGET);
      for (const n of shown) {
        const reason = n.messageKey ? (REASON_SHORT[n.messageKey] ?? n.messageKey) : "-";
        if (n.messageKey) usedReasons.add(n.messageKey);
        const measured = n.measured ? `${n.measured.ratio}:1` : "-";
        lines.push(
          `| ${shortId(f.targetId)} | \`${n.selector}\` | ${reason} | ${measured} | ${n.expected ?? "4.5:1"} | ${contrastVerdict(n)} |`,
        );
      }
      if (f.nodes.length > shown.length) {
        lines.push(
          `| ${shortId(f.targetId)} | … 외 ${f.nodes.length - shown.length}곳 (원시 데이터 JSON) | | | | |`,
        );
      }
    }
    lines.push("");
    if (usedReasons.size > 0) {
      lines.push("사유별 확인 방법:");
      lines.push("");
      for (const key of [...usedReasons].sort()) {
        lines.push(`- **${REASON_SHORT[key] ?? key}**: ${REASON_HOW[key] ?? key}`);
      }
    }
  }
  return lines;
}

/** 순수 함수: Report → Markdown. 같은 입력이면 같은 출력 (결정적) */
export function render(report: Report): string {
  const { meta, items, outOfMap, manualChecklist } = report;
  const counts = new Map<Grade, number>();
  for (const i of items) counts.set(i.grade, (counts.get(i.grade) ?? 0) + 1);
  const count = (g: Grade) => counts.get(g) ?? 0;

  const needsHuman = items.filter(
    (i) => i.grade === "violation" || i.grade === "needs-review",
  );
  const autoPass = items.filter((i) => i.grade === "auto-pass");
  const notApplicable = items.filter((i) => i.grade === "not-applicable");
  const notTested = items.filter((i) => i.grade === "not-tested");

  const out: string[] = [];
  out.push("# KWCAG 2.2 자가진단 리포트");
  out.push("");
  out.push(
    "> **이 리포트는 자동 검사 결과이며 KWCAG 준수(심사 통과)를 보장하지 않는다.** " +
      "자동 판정이 가능한 범위는 전체 검사항목의 일부이고, '자동통과'는 형식 요건에 " +
      "위반이 검출되지 않았다는 뜻일 뿐 내용의 적절성(대체 텍스트 문구, 레이블 의미 등)은 " +
      "사람이 확인해야 한다. 최종 판정 기준은 전문가 심사 + 보조기술 실사용 평가다.",
  );
  out.push("");

  // ── 결론 먼저: 이 리포트를 연 사람이 알아야 할 한 문장
  out.push("## 결론");
  out.push("");
  const violation = count("violation");
  const review = count("needs-review");
  out.push(
    violation > 0
      ? `**자동 검사에서 위반 ${violation}개 항목이 확정됐다 — 아래 "사람이 볼 것"부터 교정한다.**`
      : `자동 판정 범위(${count("auto-pass") + violation + review + count("not-applicable")}개 항목)에서 **위반 0** — ` +
          `사람 몫으로 남은 것은 확인필요 ${review}건과 수동 확인 ${notTested.length}항목이다.`,
  );
  out.push("");

  out.push("## 검사 정보");
  out.push("");
  out.push(`- 대상 ${meta.targets.length}건: ${meta.targets.map((t) => shortId(t.id)).join(", ")}`);
  out.push(`- 검사 시각: ${meta.scannedAt}`);
  out.push(`- 엔진: axe-core ${meta.engine.axeVersion} · 규칙 세트 ${meta.engine.ruleSet}`);
  if (meta.engine.keyboard) {
    const k = meta.engine.keyboard;
    const how =
      k.end === "body"
        ? `Tab 키를 ${k.stops}번 눌러 화면 끝까지 순회`
        : k.end === "cap"
          ? `Tab 키를 ${k.stops}번 누르고 상한에서 멈춤 — 이후 요소는 미검사`
          : `Tab 키를 ${k.stops}번 누른 뒤 초점이 순환 — 판정 보류 참고`;
    out.push(`- 키보드 검사: ${how}`);
  }
  if (meta.errors.length > 0) {
    out.push(`- **검사 실패 ${meta.errors.length}건** (아래 결과에 포함되지 않음):`);
    for (const e of meta.errors) {
      if (e.status === "error") out.push(`  - ${shortId(e.target.id)}: ${e.reason}`);
    }
  }
  out.push("");

  out.push("## 요약 — 33개 검사항목 등급 분포");
  out.push("");
  out.push("| 등급 | 개수 | 의미 |");
  out.push("|---|---|---|");
  out.push(`| 위반 | ${count("violation")} | 자동 검사에서 위반 확정 |`);
  out.push(`| 확인필요 | ${count("needs-review")} | 판정 보류 — 사람 확인 필요 |`);
  out.push(`| 자동통과 | ${count("auto-pass")} | 형식 요건 위반 미검출 (내용 미검증) |`);
  out.push(`| 해당없음 | ${count("not-applicable")} | 검사 대상 요소 없음 |`);
  out.push(`| 미검사 | ${count("not-tested")} | 자동 검사 수단 없음 → 수동 체크리스트 |`);
  out.push("");

  // ── 사람이 볼 것: 위반·확인필요만 상세를 편다
  out.push("## 사람이 볼 것 — 위반·확인필요 상세");
  out.push("");
  if (needsHuman.length === 0) {
    out.push("없음 — 자동 검사에서 위반·보류가 검출되지 않았다.");
    out.push("");
  }
  for (const item of needsHuman) {
    out.push(`### ${shortKwcag(item.kwcagId)} ${item.name} — ${GRADE_LABEL[item.grade]}`);
    out.push("");
    if (item.grade === "needs-review") {
      out.push("자동 검사가 위반으로 확정하지 못하고 판정을 보류했다. 아래 위치를 직접 확인한다.");
      out.push("");
    }
    out.push(...evidenceLines(item.evidence));
    out.push("");
  }

  // ── 나머지 등급은 목록으로 접는다 — 빈 제목 33개를 늘어놓지 않는다
  out.push("## 자동통과 항목");
  out.push("");
  out.push(
    "형식 요건에서 위반이 검출되지 않았다. **내용의 적절성은 검증되지 않았다** — " +
      "예: 대체 텍스트의 존재는 확인했지만 문구가 이미지를 설명하는지는 사람 몫이다.",
  );
  out.push("");
  for (const i of autoPass) {
    out.push(`- ${shortKwcag(i.kwcagId)} ${i.name}`);
  }
  out.push("");

  out.push("## 해당없음 항목");
  out.push("");
  out.push("검사할 요소가 대상에 없었다 (예: 동영상이 없으면 자막 항목은 판정 불가).");
  out.push("");
  out.push(notApplicable.map((i) => `${shortKwcag(i.kwcagId)} ${i.name}`).join(" · "));
  out.push("");

  out.push("## 수동 확인 체크리스트");
  out.push("");
  out.push(
    `자동 검사 수단이 없는 ${notTested.length}개 항목${review > 0 ? `과 판정 보류 ${review}건` : ""} — 반드시 사람이 확인하고 결과를 기록한다.`,
  );
  out.push("");
  out.push("| 항목 | 사유 | 확인 방법 | 결과 기입 |");
  out.push("|---|---|---|---|");
  for (const c of manualChecklist) {
    const reason = c.reason === "none" ? "자동 검사 수단 없음" : "자동 판정 보류";
    const how =
      c.reason === "needs-review"
        ? '위 "사람이 볼 것"의 표를 따라 확인'
        : `${c.how} — 절차는 아래 매뉴얼`;
    out.push(`| ${shortKwcag(c.kwcagId)} ${c.name} | ${reason} | ${how} | ☐ |`);
  }
  out.push("");

  // ── 부록: 항목별 수동 확인 매뉴얼 — 브라우저만으로 따라 할 수 있는 절차
  out.push("## 부록 — 수동 확인 매뉴얼");
  out.push("");
  out.push(
    "체크리스트 각 항목을 확인하는 절차. 특별한 도구 없이 브라우저로 확인할 수 있게 썼다. " +
      "확인 후 위 표의 결과 기입란에 통과 여부와 확인자·날짜를 남긴다.",
  );
  out.push("");
  for (const c of manualChecklist) {
    if (c.reason !== "none") continue; // 판정 보류는 "사람이 볼 것" 표가 담당
    const g = MANUAL_GUIDE[c.kwcagId];
    out.push(`### ${shortKwcag(c.kwcagId)} ${c.name}`);
    out.push("");
    if (!g) {
      out.push(`- 확인 방법: ${c.how}`);
      out.push("");
      continue;
    }
    out.push(`**왜 보는가**: ${g.why}`);
    out.push("");
    out.push("**절차**:");
    out.push("");
    g.steps.forEach((s, i) => out.push(`${i + 1}. ${s}`));
    out.push("");
    out.push(`- 합격: ${g.pass}`);
    out.push(`- 불합격 예: ${g.fail}`);
    if (g.note) out.push(`- 참고: ${g.note}`);
    out.push("");
  }

  if (outOfMap.length > 0) {
    out.push("## 참고 — KWCAG 33항목 밖 검출");
    out.push("");
    out.push("KWCAG 검사항목에 직접 대응하지 않지만 접근성 관점에서 참고할 검출.");
    out.push("");
    out.push(...evidenceLines(outOfMap));
    out.push("");
  }
  return out.join("\n");
}
