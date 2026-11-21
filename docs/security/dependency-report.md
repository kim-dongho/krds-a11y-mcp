# 의존성 보안 보고서

검사일: 2026-11-21 17:45:40 (Asia/Seoul)

검사 대상: pnpm-lock.yaml의 전체 의존성(개발 및 선택적 의존성 포함).
알려진 보안 권고와 버전 일치 여부를 검사하며, 실제 악용 가능성이나 소스 코드 전체의 안전성을 보증하지 않는다.

## 기본 브랜치 검사 결과 (PR 변경 적용 전)

| Critical | High | Moderate | Low | Info |
| --- | --- | --- | --- | --- |
| 1 | 8 | 23 | 5 | 0 |

## PR 변경 적용 후 검사 결과 (기본 브랜치 미반영)

아래 수치는 PR 브랜치에 수정 내용을 적용한 결과다. 기본 브랜치에는 사용자가 PR을 머지할 때 반영된다.

| Critical | High | Moderate | Low | Info |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 1 | 0 |

## PR 변경 효과

Critical・High・Moderate(중간) 보안 권고에 대해 의존성 갱신과 pnpm overrides로 자동 수정을 시도했다.
이하 취약점 목록은 PR 변경 적용 후 재검사 결과이며, 남은 항목은 수동 검토가 필요하다.

| 심각도 | 기본 브랜치 (적용 전) | PR 브랜치 (적용 후) |
| --- | --- | --- |
| critical | 1 | 0 |
| high | 8 | 0 |
| moderate | 23 | 0 |
| low | 5 | 1 |
| info | 0 | 0 |

## low: esbuild

esbuild allows arbitrary file read when running the development server on Windows

- 영향 버전: &gt;=0.27.3 &lt;0.28.1
- 수정 버전: &gt;=0.28.1
- 설치 버전: 0.27.7
- 보안 권고: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- 의존성 경로:
  - .&gt;tsup&gt;bundle-require&gt;esbuild
  - .&gt;tsup&gt;esbuild
  - .&gt;vite&gt;esbuild
  - .&gt;vitest&gt;@vitest/mocker&gt;vite&gt;esbuild
  - .&gt;vitest&gt;vite&gt;esbuild
