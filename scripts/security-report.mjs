import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const severities = ['critical', 'high', 'moderate', 'low', 'info'];
const cell = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '&#124;').replace(/[\r\n]+/g, ' ');

export function renderReport(audit, date = new Date()) {
  const counts = audit.metadata?.vulnerabilities;
  if (audit.error || !counts || !audit.advisories ||
      severities.some((severity) => !Number.isInteger(counts[severity]) || counts[severity] < 0)) {
    throw new Error('유효한 pnpm audit 결과가 아닙니다. 보안 검사 서버 및 오류 로그를 확인하세요.');
  }
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);
  const rows = Object.values(audit.advisories).sort((a, b) =>
    severities.indexOf(a.severity) - severities.indexOf(b.severity) || String(a.module_name).localeCompare(String(b.module_name)));
  const lines = [
    '# 의존성 보안 보고서', '',
    `검사일: ${day} (Asia/Seoul)`, '',
    '검사 대상: pnpm-lock.yaml의 전체 의존성(개발 및 선택적 의존성 포함).',
    '알려진 보안 권고와 버전 일치 여부를 검사하며, 실제 악용 가능성이나 소스 코드 전체의 안전성을 보증하지 않는다.', '',
    '| Critical | High | Moderate | Low | Info |',
    '| --- | --- | --- | --- | --- |',
    `| ${severities.map((severity) => counts[severity]).join(' | ')} |`, '',
  ];
  if (!rows.length) lines.push('알려진 취약점이 탐지되지 않았다.', '');
  for (const advisory of rows) {
    const findings = advisory.findings ?? [];
    const url = /^https:\/\/(github\.com\/advisories|www\.npmjs\.com\/advisories)\/[\w-]+$/.test(advisory.url ?? '') ? advisory.url : null;
    lines.push(
      `## ${cell(advisory.severity)}: ${cell(advisory.module_name)}`, '',
      cell(advisory.title), '',
      `- 영향 버전: ${cell(advisory.vulnerable_versions)}`,
      `- 수정 버전: ${cell(advisory.patched_versions)}`,
      `- 설치 버전: ${cell([...new Set(findings.map((finding) => finding.version))].join(', '))}`,
      ...(url ? [`- 보안 권고: ${url}`] : []),
      '- 의존성 경로:',
      ...[...new Set(findings.flatMap((finding) => finding.paths ?? []))].map((path) => `  - ${cell(path)}`), '',
    );
  }
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8', timeout: 180_000, maxBuffer: 16 * 1024 * 1024 });
  if (result.error || ![0, 1].includes(result.status)) {
    throw new Error(`pnpm audit 실행 실패: ${result.error?.message ?? result.stderr}`);
  }
  // 취약점 발견 시 exit 1은 정상 결과다. 오류 JSON은 renderReport에서 거부한다.
  const report = renderReport(JSON.parse(result.stdout));
  mkdirSync('docs/security', { recursive: true });
  writeFileSync('docs/security/dependency-report.md', report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  console.log('docs/security/dependency-report.md 생성 완료');
}
