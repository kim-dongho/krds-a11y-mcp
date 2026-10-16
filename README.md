# krds-a11y-mcp

[![CI](https://github.com/kim-dongho/krds-a11y-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/kim-dongho/krds-a11y-mcp/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/krds-a11y-mcp)](https://www.npmjs.com/package/krds-a11y-mcp)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![KRDS: KOGL Type 1](https://img.shields.io/badge/KRDS-%EA%B3%B5%EA%B3%B5%EB%88%84%EB%A6%AC%201%EC%9C%A0%ED%98%95-green)](NOTICE)

KRDS(범정부 UI/UX 디자인 시스템) 컴포넌트를 KWCAG 2.2 접근성 조건과 함께 공급하고, 위반이 남으면 AI의 작업 종료를 막는 MCP 서버.

> An MCP server that supplies KRDS (Korea Government Design System) components with KWCAG 2.2 accessibility built in, and keeps AI agents from finishing while accessibility violations remain.

- **공급** — 접근성 조건을 갖춘 KRDS 부품·템플릿을 준다. 레이블·대체 텍스트 같은 필수 입력을 안 채우면 마크업을 주지 않는다
- **검사** — 렌더된 페이지를 axe와 자체 실측(명도 대비, 키보드, 화면에 안 그려진 요소)으로 검사해 KWCAG 번호로 보고한다
- **강제** — Claude Code·Codex 훅이 위반이 남은 채 작업을 끝내지 못하게 막는다

> **정직한 범위**: 자동 판정은 접근성 이슈의 3~4할이다. 이 도구는 "심사 통과 보장"이 아니라 **심사 전 자가진단 + 증빙 생성** 도구다. KWCAG 최종 판정 기준은 전문가 심사와 보조기술(스크린리더) 실사용 평가이며, 자동 도구는 이를 대체하지 못한다.

## 왜 만들었나

공공 웹은 KRDS와 KWCAG 2.2(웹 접근성 국가표준, 33개 검사항목)를 함께 지켜야 한다. 그런데

- KRDS 공식 패턴 샘플 33종을 전수 검사하면 **33종 모두에서 접근성 문제**가 나온다. 샘플을 복사하는 것만으로는 준수가 안 된다
- axe 같은 자동 검사기는 WCAG 번호로 보고해 KWCAG 기준 심사·보고서와 번호가 맞지 않는다
- 검사는 보통 개발이 끝난 뒤에 해서 교정 왕복 비용이 크다

그래서 "검사해서 고치는" 대신 **처음부터 KWCAG 조건이 들어간 KRDS 마크업을 공급**하고, 검사는 조립·변환 과정에서 깨진 것을 잡는 안전망으로 둔다. 안전망은 지시가 아니라 훅으로 강제한다.

## 빠른 시작

프로젝트 루트에서:

```sh
npx -y krds-a11y-mcp init
```

init이 설치하는 것 (기존 파일은 보존하고 우리 항목만 추가, 재실행해도 중복 없음):

| 파일 | 내용 |
|---|---|
| `.mcp.json` | MCP 서버 등록 (도구 9종 + 자동 주입 사용 규칙) |
| `.claude/settings.json` | Stop 훅(위반이 남으면 작업 종료 차단) + PreToolUse 훅(금지 행동 차단) |
| `CLAUDE.md` · `AGENTS.md` | 핵심 사용 규칙 (Codex 등 타 AI 도구 호환) |
| `.codex/config.toml` · `.codex/hooks.json` | Codex용 MCP 서버 등록과 같은 두 훅 |

설치 후 처음 한 번:

- **Claude Code** — 프로젝트를 열고 MCP 서버를 승인한다
- **Codex** — 프로젝트를 신뢰(trust)하고 `/hooks`에서 krds-a11y 훅 2개를 승인한다. 훅 내용이 바뀌면 다시 승인해야 한다

재검사(`validate_page`)까지 쓰려면 브라우저 검사 스택을 한 번 설치한다. 없으면 도구가 이 안내를 그대로 돌려준다.

```sh
pnpm add -D playwright @axe-core/playwright
npx playwright install chromium
```

<details>
<summary>수동 설치</summary>

```sh
claude mcp add krds-a11y -- npx -y krds-a11y-mcp
```

또는 `.mcp.json`:

```json
{
  "mcpServers": {
    "krds-a11y": { "command": "npx", "args": ["-y", "krds-a11y-mcp"] }
  }
}
```

훅은 아래 [하네스](#하네스--위반이-남으면-끝내지-못하게) 절의 설정을 붙인다.
</details>

### 사용 흐름

```
사용자: "로그인 페이지 만들어줘"
  → AI가 get_page_scaffold(pattern: "login-id", withSiteChrome: true, ...) 호출
  → 필수 입력(페이지 제목 등)이 비면 도구가 거부하고 되물음
  → 접근성 교정이 내장된 완성 마크업 수신, 콘텐츠 교체

AI가 작업을 끝내려 할 때
  → Stop 훅이 검사 기록을 판정
  → 검사가 없거나 위반이 남았으면 종료 거부 + 교정 지시
  → AI가 validate_page로 검사하고 위반 위치·교정 방법대로 고친 뒤 다시 검사
```

## 도구 9종

| 도구 | 시점 | 하는 일 |
|---|---|---|
| `list_components` | 탐색 | KRDS 컴포넌트 43종 색인. 변형 없이 부를 때 채워야 하는 필수 입력 수, 변형 전용·해당 시 입력은 따로 표기 |
| `get_component` | 부품 공급 | 컴포넌트 마크업 + 보장 항목 + **필수 입력 강제**. 필수 입력(레이블 등)을 안 채우면 마크업을 주지 않는다. 반복 항목은 객체 배열(`crumbs: [{crumbLabel, href}]`)로 받는다. 킷 결함이 알려진 부품(탭 등)은 교정본을, 폼 부품은 필수 표시·오류 연결 지침을, JS 동작 부품은 상태 클래스·초기화·끄는 법·라우트 전환 뒤 재초기화를 함께 준다. breadcrumb·pagination·radio_button·checkbox·text_input·select는 **입력값을 교정본 구조에 넣은 마크업을 생성**한다(`required`·`errorMessage`·`checked`·`currentPage` 상태 입력) |
| `get_requirements` | 설계·리뷰 | 마크업 없이 접근성 요건만 조회 |
| `get_page_scaffold` | 페이지 생성 | KRDS 공식 패턴 기반 템플릿 13종(로그인 3·신청 5·검색 1·메인 1·서브 1·게시판 2) 또는 빈 뼈대. `withSiteChrome: true`면 정부 배너·헤더·푸터를 코드로 조립한다. `siteMenu`(1~3단계)·`orgName`·`logoSrc`로 헤더 메뉴·모바일 전체메뉴·로고 교체 CSS까지 만든다. `output: "parts"`면 head·header·main·footer·scripts 조각으로 나눠 준다 (JSP include, 레이아웃 컴포넌트) |
| `get_tokens` | 스타일 | 킷 디자인 토큰(색·간격·글자 크기 768개) 검색. 임의 hex 대신 토큰을 쓰게 한다 |
| `get_framework_guide` | React·Next.js | 킷 JS가 SPA에서 죽는 문제(DOMContentLoaded 1회 초기화)의 검증된 처방. 라우트 전환 뒤 재초기화 훅 포함 |
| `get_icon_fix_css` | 교정 | 킷 아이콘 경로 버그(206곳 404) 전면 교정 CSS |
| `validate_page` | 완성 후 | 렌더된 페이지를 브라우저로 재검사. axe 전수 → KWCAG 33항목 번역, 명도 대비 실측, **키보드 검사**(실제 Tab 순회, 탭 화살표·펼침·모달 초점/Escape 같은 위젯 조작), 사이트 공통부 누락, KRDS 사용 문제(부품 재발명·킷 스타일 조작·오류 메시지 연결 누락·라디오 그룹 이름 누락·모달 배치), 레거시 CSS의 킷 침투, 페이지 문제(리소스 404·가로 넘침·한글 깨짐·화면에 안 그려진 조작 요소). 위반 규칙별 **교정 방법**을 제시하고 리포트·스크린샷을 `reports/`에 남긴다. `actions`(클릭·키 입력·값 입력)로 모달 열림·오류 표시 같은 상태 화면을, `screen`으로 화면 이름별 기록을, `sourceDir`로 dev 서버 url 검사의 낡음 판정을 지원한다 |
| `inspect_page` | 확인 | 요소의 색·배치·간격(margin·padding·gap)·폰트 적용 여부를 실측 조회 |

AI에게 주는 세부 사용 규칙은 MCP 연결 시 서버 instructions로 자동 전달된다(원본: `src/server/index.ts`의 `SERVER_INSTRUCTIONS`). init이 만드는 `CLAUDE.md`·`AGENTS.md`에는 핵심 요약만 마커 구간으로 들어간다.

## 하네스 — 위반이 남으면 끝내지 못하게

"완성하면 검사하라"는 지시는 따를 때도 건너뛸 때도 있다. 그래서 판정을 훅으로 옮겼다.

### gate — 판정 명령

`reports/`의 검사 기록을 읽어 위반이 남았는지, 검사 뒤에 페이지가 바뀌었는지(낡음)를 판정한다. 판정 로직은 이 명령 한 곳에만 있고 훅과 CI가 같이 쓴다.

```sh
npx krds-a11y-mcp gate              # 사람용 요약
npx krds-a11y-mcp gate --json       # 훅·CI용 구조화 출력
npx krds-a11y-mcp gate --only form  # 지정 화면만 (반복 가능)
```

| 종료 코드 | 뜻 | 다음 행동 |
|---|---|---|
| 0 | 전 화면 위반 0, 검사 최신 | 없음 |
| 1 | 위반 잔존 또는 사이트 공통부(헤더·푸터) 누락 | 교정 후 재검사. 일부러 공통부를 뺀 페이지는 `data-krds-a11y="no-chrome"` |
| 2 | 검사 기록 없음·낡음·검사 무효(킷 CSS 미로드, 상호작용 실패 등) | validate_page 실행 |

url 검사는 validate_page에 `sourceDir`을 넘기면 그 아래 소스 수정 시각으로 낡음을 판정한다. 넘기지 않으면 "판정 불가"로 표기한다(통과로 꾸미지 않는다).

### stop-hook — 작업 종료 차단

AI가 작업을 끝내려는 순간 gate를 판정해, 위반·공통부 누락·낡음이 남으면 종료를 거부하고 교정 지시를 모델에게 전달한다. 통과할 때까지 반복하고, 상한(기본 5회)을 넘으면 "자동 교정 실패, 사람 확인 필요"를 남기고 풀어준다. 검사 기록이 하나도 없는 프로젝트는 막지 않는다(페이지 작업이 없던 세션의 오탐 방지).

```json
{
  "hooks": {
    "Stop": [{ "hooks": [{ "type": "command", "command": "npx -y krds-a11y-mcp stop-hook" }] }]
  }
}
```

### pretool-hook — 금지 행동 사전 차단

파일을 쓰기 직전에 세 가지를 막는다. 실사용 테스트에서 실제로 관찰된 행동들이다.

- 프로젝트 폴더에 임시 검사 스크립트 생성(`.axe-check.mjs`류) → validate_page·inspect_page가 대체
- 킷 원본(`node_modules/krds-uiux`) 수정 → 재설치로 사라지고 보증 근거가 훼손된다
- 문서루트로 복사한 킷(`webapp/krds-uiux` 등) 수정 → npm 킷과 조용히 어긋난다. 교정은 별도 CSS로

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [{ "type": "command", "command": "npx -y krds-a11y-mcp pretool-hook" }]
      }
    ]
  }
}
```

시스템 임시 디렉터리의 일회용 스크립트와 `.eslintrc.js` 같은 정상 설정 파일은 막지 않는다. Bash 경유 수정은 범위 밖이다(파일 쓰기 도구만 본다).

### Codex

init이 `.codex/hooks.json`에 같은 두 훅을 건다. PreToolUse 대상은 `apply_patch|Edit|Write`이고, 패치 본문의 모든 경로를 뽑아 하나라도 금지 대상이면 패치 전체를 막는다.

- 프로젝트 신뢰와 `/hooks` 승인 전에는 설정도 훅도 읽히지 않는다
- **`codex exec`(비대화형)에서는 훅이 실행되지 않는다.** 자동화로 돌린다면 gate를 CI에서 따로 호출해야 한다

## 템플릿이 보장하는 것과 지켜야 하는 것

템플릿은 KRDS 공식 패턴 샘플을 전수 검사해 나온 문제를 교정해 만들었다(감사 기록: [`docs/mapping/pattern-audit.md`](docs/mapping/pattern-audit.md)). 게시판 2종은 공식 샘플이 없어 하위 페이지 틀에 킷 부품을 조립했다. 보장이 유지되는 조건:

1. **구조·클래스·속성(aria 포함)을 유지한 채 렌더된 DOM이 템플릿과 같을 것.** React/Vue/JSP 변환은 자유지만 래퍼 요소를 끼우지 않는다
2. **스타일은 킷 CSS와 동봉 CSS를 그대로 로드.** Tailwind 등으로 재작성하지 않고 공존만 한다
3. **콘텐츠는 자유, 단 조건부 항목(alt·레이블 등)은 반드시 채운다.** 도구가 생성 단계에서 강제한다
4. **시안은 배치·구성만 참고.** 색·타이포는 킷 토큰을 쓴다
5. **데모 플레이스홀더(`href="#"`)는 실제 URL로 바꾼다**

요약하면 ⑴ 접근성 교정분은 불변 ⑵ 화면 구조는 기본값(명시 요구 시에만 이탈) ⑶ 콘텐츠·문구는 자유.

## 데이터의 근거

- **매핑표** — KRDS 컴포넌트 43종 × KWCAG 33항목을 자동 충족·조건부·범위 밖으로 분류([`docs/mapping/`](docs/mapping/)). 근거는 공식 킷([KRDS-uiux](https://github.com/KRDS-uiux))의 실제 파일이며 판정마다 출처(파일·행)를 남긴다. 확신이 없으면 미확정으로 둔다
- **KWCAG↔WCAG↔axe 번역표** — 커버리지 완전 1 / 부분 19 / 불가 13. 불가 13항목은 리포트에 수동 체크리스트와 확인 매뉴얼로 내보낸다
- **킷 결함 기록** — 아이콘 경로, 셀렉트 기본색 대비, 탭 role 등 공식 킷의 알려진 결함과 처리는 [`docs/mapping/kit-bugs.md`](docs/mapping/kit-bugs.md)

## 개발

```sh
pnpm install
pnpm test             # vitest
pnpm typecheck        # tsc --noEmit
pnpm build            # tsup → dist/

pnpm build:previews   # 템플릿 프리뷰 생성
pnpm scan:axe         # 전 템플릿 axe 전수 (위반 시 exit 1)
pnpm verify:a11y      # 키보드 전수·접근성 트리 검증
```

검사 기능 테스트에는 Chromium이 필요하다(`pnpm exec playwright install chromium`).

## 라이선스

- 이 저장소의 코드: [MIT](LICENSE)
- KRDS 유래 자료(템플릿의 공식 패턴 교정본·발췌 레이아웃 CSS·패턴 이미지, 킷 마크업 인용)는 **공공누리 제1유형**을 따른다. 출처 표기는 [NOTICE](NOTICE)에 있다
