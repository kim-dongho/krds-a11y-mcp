import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from './security-report.mjs';

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
