// gate CLI — 인자 파싱·출력만 담당. 종료 코드는 반환만 하고 process.exit는 진입점 책임 (테스트 가능성).
import { judge, type GateResult, type Staleness } from "./judge.js";

export type GateCliArgs = {
  json: boolean;
  only: string[];
  dir: string;
  help: boolean;
};

export const USAGE = [
  "사용법: krds-a11y-mcp gate [옵션]",
  "",
  "reports/의 검사 기록을 읽어 위반 잔존·검사 낡음을 판정한다.",
  "",
  "옵션:",
  "  --json          구조화 출력 (훅·CI용)",
  "  --only <slug>   지정 화면만 판정 (반복 지정 가능)",
  "  --dir <경로>    검사 기록 위치 (기본 reports)",
  "  --help          이 도움말",
  "",
  "종료 코드: 0 통과 / 1 위반 잔존·사이트 공통부 누락 / 2 검사 없음·낡음 / 64 사용법 오류",
].join("\n");

export function parseGateArgs(argv: string[]): GateCliArgs | { error: string } {
  const args: GateCliArgs = { json: false, only: [], dir: "reports", help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--json") args.json = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--only" || a === "--dir") {
      const v = argv[++i];
      if (!v || v.startsWith("--")) return { error: `${a} 에는 값이 필요하다` };
      if (a === "--only") args.only.push(v);
      else args.dir = v;
    } else return { error: `모르는 옵션: ${a}` };
  }
  return args;
}

const STALE_LABEL: Record<Staleness, string> = {
  fresh: "최신",
  stale: "**낡음**",
  unknown: "판정 불가",
};

/** 사람용 출력 — 화면별 표 + 결론 + 다음 행동 지시 */
export function formatHuman(result: GateResult, dir: string): string {
  const lines = [`접근성 게이트 판정 (${dir}/)`, ""];
  if (result.screens.length > 0) {
    lines.push(
      "| 화면 | 마지막 검사 | 위반 | 사람 확인 | 리소스 문제 | 낡음 |",
      "|---|---|---|---|---|---|",
    );
    for (const s of result.screens) {
      const when = s.stamp.replace("validate-", "").replace("T", " ").replace(/-(\d\d)-(\d\d)$/, ":$1:$2");
      const v = s.violations > 0 ? `**${s.violations}**` : "0";
      const pi = s.pageIssues > 0 ? `**${s.pageIssues}**` : "0";
      const stale = s.broken ? "**기록 불량**" : s.invalid ? "**검사 무효**" : STALE_LABEL[s.staleness];
      lines.push(`| ${s.slug} | ${when} | ${v} | ${s.needsReview} | ${pi} | ${stale} |`);
    }
    lines.push("");
  }
  lines.push(`결론: ${result.reason} (exit ${result.exitCode})`);
  if (result.screens.some((s) => s.staleness === "unknown" && !s.broken)) {
    lines.push("", "낡음 \"판정 불가\"는 url·html 문자열 검사라 비교할 파일이 없는 화면이다 — 통과 보증이 아니다.");
  }
  return lines.join("\n");
}

/** 파싱 → 판정 → 출력. 종료 코드를 반환한다 */
export function runGateCli(argv: string[]): number {
  const parsed = parseGateArgs(argv);
  if ("error" in parsed) {
    console.error(`${parsed.error}\n\n${USAGE}`);
    return 64;
  }
  if (parsed.help) {
    console.log(USAGE);
    return 0;
  }
  const result = judge({ dir: parsed.dir, only: parsed.only });
  console.log(parsed.json ? JSON.stringify(result, null, 2) : formatHuman(result, parsed.dir));
  return result.exitCode;
}
