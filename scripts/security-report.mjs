import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const severities = ['critical', 'high', 'moderate', 'low', 'info'];
const cell = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '&#124;').replace(/[\r\n]+/g, ' ');

export function fallbackOverrides(audit) {
  const overrides = {};
  for (const advisory of Object.values(audit.advisories)) {
    if (!['critical', 'high', 'moderate'].includes(advisory.severity)) continue;
    const version = /^>=(\d+\.\d+\.\d+)$/.exec(advisory.patched_versions)?.[1];
    const name = advisory.module_name;
    // Vitest의 자동 설치 peer인 Vite는 명시적 개발 의존성으로 버전을 제한해야 한다.
    if (!version || name !== 'vite') continue;
    const previous = overrides[name]?.slice(1);
    const compare = (a, b) => {
      const parts = a.split('.').map(Number);
      const other = b.split('.').map(Number);
      return parts[0] - other[0] || parts[1] - other[1] || parts[2] - other[2];
    };
    if (!previous || compare(version, previous) > 0) overrides[name] = `^${version}`;
  }
  return overrides;
}

export function renderReport(audit, date = new Date(), before) {
  const counts = audit.metadata?.vulnerabilities;
  if (audit.error || !counts || !audit.advisories ||
      severities.some((severity) => !Number.isInteger(counts[severity]) || counts[severity] < 0)) {
    throw new Error('유효한 pnpm audit 결과가 아닙니다. 보안 검사 서버 및 오류 로그를 확인하세요.');
  }
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(date);
  const rows = Object.values(audit.advisories).sort((a, b) =>
    severities.indexOf(a.severity) - severities.indexOf(b.severity) || String(a.module_name).localeCompare(String(b.module_name)));
  const lines = [
    '# 의존성 보안 보고서', '',
    `검사일: ${day} ${time} (Asia/Seoul)`, '',
    '검사 대상: pnpm-lock.yaml의 전체 의존성(개발 및 선택적 의존성 포함).',
    '알려진 보안 권고와 버전 일치 여부를 검사하며, 실제 악용 가능성이나 소스 코드 전체의 안전성을 보증하지 않는다.', '',
    '| Critical | High | Moderate | Low | Info |',
    '| --- | --- | --- | --- | --- |',
    `| ${severities.map((severity) => counts[severity]).join(' | ')} |`, '',
  ];
  if (before) {
    lines.push(
      '## 자동 수정 결과', '',
      'Critical・High・Moderate(중간) 보안 권고에 대해 pnpm overrides로 수정 버전을 적용했다.',
      '이하 취약점 목록은 수정 후 재검사 결과이며, 남은 항목은 수동 검토가 필요하다.', '',
      '| 심각도 | 수정 전 | 수정 후 |', '| --- | --- | --- |',
      ...severities.map((severity) => `| ${severity} | ${before.metadata.vulnerabilities[severity]} | ${counts[severity]} |`), '',
    );
  }
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
  function audit() {
    const result = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8', timeout: 180_000, maxBuffer: 16 * 1024 * 1024 });
    if (result.error || ![0, 1].includes(result.status)) {
      throw new Error(`pnpm audit 실행 실패: ${result.error?.message ?? result.stderr}`);
    }
    // 취약점 발견 시 exit 1은 정상 결과다. 오류 JSON은 renderReport에서 거부한다.
    const data = JSON.parse(result.stdout);
    renderReport(data); // 오류 응답이면 수정 작업을 시작하지 않는다.
    return data;
  }
  let before;
  if (process.argv.includes('--fix')) {
    before = audit();
    if (['critical', 'high', 'moderate'].some((severity) => before.metadata.vulnerabilities[severity] > 0)) {
      for (const args of [
        ['audit', '--fix=override', '--audit-level=moderate'],
        ['install', '--no-frozen-lockfile'],
        ['audit', '--fix=update', '--audit-level=moderate'],
      ]) {
        const result = spawnSync('pnpm', args, { stdio: 'inherit', timeout: 300_000 });
        // fix=update는 자동 수정 불가 항목이 남아도 1을 반환한다. 재검사로 남은 항목을 보고한다.
        if (result.error || (result.status !== 0 && !(args.includes('--fix=update') && result.status === 1))) {
          throw new Error(`pnpm ${args.join(' ')} 실패`);
        }
      }
      // 자동 설치 peer는 기존 잠금 버전이 유지될 수 있으므로 명시적으로 버전을 제한한다.
      const fallback = fallbackOverrides(audit());
      if (Object.keys(fallback).length) {
        const args = ['add', '--save-dev', ...Object.entries(fallback).map(([name, version]) => `${name}@${version}`)];
        const result = spawnSync('pnpm', args, { stdio: 'inherit', timeout: 300_000 });
        if (result.error || result.status !== 0) throw new Error('남은 취약점 수정 버전 적용 실패');
      }
    }
  }
  const report = renderReport(audit(), new Date(), before);
  mkdirSync('docs/security', { recursive: true });
  writeFileSync('docs/security/dependency-report.md', report);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  console.log('docs/security/dependency-report.md 생성 완료');
}
