import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport, fallbackOverrides } from './security-report.mjs';

const clean = () => ({
  metadata: { vulnerabilities: { critical: 0, high: 0, moderate: 0, low: 0, info: 0 } },
  advisories: {},
});

test('깨끗한 결과도 한국 시간 검사일과 함께 보고한다', () => {
  const report = renderReport(clean(), new Date('2026-11-21T23:30:00Z'));
  assert.match(report, /2026-11-22/);
  assert.match(report, /알려진 취약점이 탐지되지 않았다/);
});

test('취약점 경로와 수정 버전을 기록하고 외부 문자열을 이스케이프한다', () => {
  const audit = clean();
  audit.metadata.vulnerabilities.high = 1;
  audit.advisories.one = {
    severity: 'high', module_name: 'example', title: '<script>bad</script> | title',
    vulnerable_versions: '<2', patched_versions: '>=2',
    url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
    findings: [{ version: '1.0.0', paths: ['.>sdk>example'] }],
  };
  const report = renderReport(audit);
  assert.match(report, /&lt;script&gt;/);
  assert.match(report, /&#124;/);
  assert.match(report, /수정 버전: &gt;=2/);
  assert.match(report, /\.&gt;sdk&gt;example/);
  assert.match(report, /https:\/\/github.com\/advisories\/GHSA-aaaa-bbbb-cccc/);
});

test('통신 실패와 잘못된 결과를 취약점 0건으로 보고하지 않는다', () => {
  for (const audit of [{ error: { message: 'fetch failed' } }, {}, { ...clean(), error: {} }]) {
    assert.throws(() => renderReport(audit), /유효한 pnpm audit 결과가 아닙니다/);
  }
});

test('같은 날 같은 결과로 다시 실행해도 검사 시각을 갱신한다', () => {
  const first = renderReport(clean(), new Date('2026-11-21T00:00:00Z'));
  const second = renderReport(clean(), new Date('2026-11-21T01:00:00Z'));
  assert.match(first, /2026-11-21 09:00:00/);
  assert.match(second, /2026-11-21 10:00:00/);
  assert.notEqual(first, second);
});

test('자동 수정 보고서는 수정 전후 집계와 남은 취약점을 구분한다', () => {
  const before = clean();
  before.metadata.vulnerabilities.critical = 1;
  before.metadata.vulnerabilities.moderate = 2;
  const report = renderReport(clean(), new Date('2026-11-21T00:00:00Z'), before);
  assert.match(report, /\| critical \| 1 \| 0 \|/);
  assert.match(report, /\| moderate \| 2 \| 0 \|/);
  assert.match(report, /PR 변경 적용 후 재검사 결과/);
  assert.match(report, /기본 브랜치 검사 결과 \(PR 변경 적용 전\)/);
  assert.match(report, /PR 변경 적용 후 검사 결과 \(기본 브랜치 미반영\)/);
  assert.match(report, /사용자가 PR을 머지할 때 반영된다/);
});

test('남은 Vite peer 취약점은 가장 높은 수정 버전으로 제한한다', () => {
  const advisory = (severity, patched_versions, module_name = 'vite') => ({ severity, patched_versions, module_name });
  assert.deepEqual(fallbackOverrides({ advisories: {
    one: advisory('high', '>=8.2.4'),
    two: advisory('moderate', '>=8.2.10'),
    low: advisory('low', '>=9.0.0'),
    other: advisory('high', '>=2.0.0', 'other'),
    unknown: advisory('high', '<0.0.0'),
  } }), { vite: '^8.2.10' });
});
