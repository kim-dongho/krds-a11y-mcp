// SPA 프레임워크 × 킷 충돌 대응 가이드 — 실사용 검증에서 수확한 처방을 도구로 공급한다.
// 근거: React+Vite 실사용 세션의 자작 훅(2026-10-06, 동작 실측)과 Next.js 1차 테스트의
// 충돌 기록(2026-10-05), 라우트 전환 재초기화 실측(2026-10-14).
// 검증된 처방과 미검증 영역을 구분 표기한다 — 정직한 범위 원칙.

import { NO_ROUTE_REINIT, ROUTE_REINIT_MODULES } from "../mapping/kit-behavior.js";

export const FRAMEWORKS = ["react", "nextjs"] as const;
export type Framework = (typeof FRAMEWORKS)[number];

const COMMON_HEAD = [
  "## 충돌의 원인 (공통)",
  "",
  "킷 JS(ui-script.js)는 순수 HTML 전체 로드를 전제한다:",
  "- **DOMContentLoaded에서 1회 init** — SPA 마운트는 그 뒤라 위젯(탭·아코디언·GNB·스크롤스파이)이 바인딩되지 않는다",
  "- **클라이언트 라우팅을 모른다** — 라우트 전환으로 새로 그려진 DOM에는 바인딩이 없다",
  "",
].join("\n");

const REACT_GUIDE = [
  "# React(SPA) × KRDS 킷 가이드",
  "",
  COMMON_HEAD,
  "## 처방 1 — 마운트 후 로드 + init 재발행 (실사용 검증됨)",
  "",
  "앱 마운트 후 킷 JS를 로드하고 DOMContentLoaded를 재발행해 init을 트리거한다.",
  "실사용 프로젝트에서 스크롤스파이·초점 이동 동작까지 실측 확인된 방식이다 (2026-10-06).",
  "",
  "```tsx",
  "import { useEffect } from 'react'",
  "// 번들러가 경로를 해석하게 ?url 임포트 (Vite 기준. 타 번들러는 정적 경로로 대체)",
  "import uiScriptUrl from 'krds-uiux/resources/js/component/ui-script.js?url'",
  "",
  "/** 루트 컴포넌트에서 1회 호출 — 킷 위젯(탭·아코디언·GNB 등) init */",
  "export function useKrdsUiScript() {",
  "  useEffect(() => {",
  "    if (document.querySelector('script[data-krds-ui-script]')) return",
  "    const script = document.createElement('script')",
  "    script.src = uiScriptUrl",
  "    script.dataset.krdsUiScript = 'true'",
  "    script.onload = () => {",
  "      window.dispatchEvent(new Event('DOMContentLoaded'))",
  "    }",
  "    document.body.appendChild(script)",
  "  }, [])",
  "}",
  "```",
  "",
  "주의: 재발행된 DOMContentLoaded는 같은 이벤트를 기다리는 다른 라이브러리도 깨울 수 있다.",
  "킷 외 스크립트가 이 이벤트에 의존하면 중복 초기화를 점검하라.",
  "",
  "## 처방 2 — 킷 CSS는 <link>로 (검증됨)",
  "",
  "JS import(번들 inline 주입) 대신 index.html에서 <link>로 로드한다.",
  "킷 JS가 외부 CSS를 전제하고, 캐싱·검사에도 유리하다.",
  "",
  "## 처방 3 — 라우트 전환 뒤 화면 모듈만 다시 init (실측 검증됨)",
  "",
  "라우트 전환 뒤에 DOMContentLoaded를 다시 발행하지 마라. 킷 init은 같은 요소에 리스너를 또 붙여서,",
  "전환 뒤에도 남아 있는 공통 레이아웃의 GNB·드롭다운·사이드 내비가 두 번 토글돼 열리지 않는다.",
  "새로 마운트된 화면의 위젯에는 다시 붙여도 안전하다. 그래서 화면 모듈의 init만 부른다.",
  "실측(2026-10-14): 레이아웃을 고정하고 화면을 전환했을 때 재발행은 전환마다 레이아웃 3종이 열림·안 열림을 번갈아 했고,",
  "아래 훅은 세 번 전환해도 레이아웃과 화면 위젯(모달 초점·Escape 포함)이 모두 동작했다.",
  "",
  "```tsx",
  "import { useEffect, useRef } from 'react'",
  "import { useLocation } from 'react-router-dom'",
  "",
  "// 킷 ui-script.js가 전역 const로 선언한 모듈 — window 속성은 아니지만 이름으로 부를 수 있다",
  "type KitModule = { init(): void }",
  ...ROUTE_REINIT_MODULES.map((m) => `declare const ${m}: KitModule`),
  "",
  "/** 공통 레이아웃 컴포넌트에서 호출 — 전환 뒤 새 화면의 킷 위젯을 붙인다 */",
  "export function useKrdsRouteInit() {",
  "  const { pathname } = useLocation()",
  "  const prev = useRef(pathname)",
  "  useEffect(() => {",
  "    // 첫 화면은 처방 1의 재발행이 맡는다. StrictMode가 effect를 두 번 돌려도 경로가 같으면 건너뛴다",
  "    if (prev.current === pathname) return",
  "    prev.current = pathname",
  "    if (typeof krds_tab === 'undefined') return // 킷 JS가 아직 안 붙었으면 처방 1이 맡는다",
  `    for (const m of [${ROUTE_REINIT_MODULES.join(", ")}]) m.init()`,
  "  }, [pathname])",
  "}",
  "```",
  "",
  "조건:",
  "- **화면 영역은 경로를 key로 리마운트한다** (`<Outlet key={pathname} />`). 같은 화면 컴포넌트가 다른 경로에서 재사용되면 요소가 그대로 남아 리스너가 중복된다",
  "- 아래 모듈은 넣지 않는다:",
  ...Object.entries(NO_ROUTE_REINIT).map(([m, why]) => `  - \`${m}\` — ${why}`),
  "- lazy 라우트(Suspense)는 위 훅이 돌 때 화면이 아직 없을 수 있다. 그 화면 컴포넌트의 useEffect에서 같은 목록을 부른다",
  "- 위젯 상태를 React가 소유하는 컴포넌트(교정 탭 마크업 등)는 킷이 건너뛰게 둔다 — get_component의 킷 동작 절 참고",
].join("\n");

const NEXTJS_GUIDE = [
  "# Next.js × KRDS 킷 가이드",
  "",
  COMMON_HEAD,
  "React 가이드(framework: react)의 처방 1·2·3이 그대로 적용된다 (클라이언트 컴포넌트에서). 처방 3의 useLocation은 next/navigation의 usePathname으로 바꾸고, 훅은 app/layout의 클라이언트 컴포넌트에서 부른다.",
  "아래는 Next.js 1차 실사용에서 확인된 추가 충돌과 대응이다 (체계 검증은 진행 중).",
  "",
  "## SSR·하이드레이션",
  "",
  "- 킷 JS는 브라우저 전용이다 — 로드 훅은 'use client' 컴포넌트에 두고, 서버 렌더 단계에서 import하지 않는다",
  "- 킷 JS가 DOM을 변형(클래스 토글 등)하면 하이드레이션 불일치가 난다 — init은 반드시 하이드레이션 완료 후(useEffect)",
  "",
  "## 내비게이션",
  "",
  "- 킷 데모 마크업의 <a href>는 전체 로드를 일으킨다 — 내부 이동은 next/link로 교체하라 (구조·클래스는 유지)",
  "- GNB 활성 상태는 킷 JS가 아니라 라우터 기준으로 관리하라 (usePathname) — 킷 JS의 상태 토글은 전체 로드 전제다",
  "",
  "## 라우트 전환 시 접근성 (킷 공백)",
  "",
  "킷 스캐폴드는 전체 로드 전제라 SPA 전환의 초점 관리가 공백이다:",
  "- 전환 후 본문 시작(main 또는 h1)으로 초점을 이동하라",
  "- 새 페이지 제목을 document.title에 반영하고 스크린리더에 알리라 (aria-live 또는 초점 이동으로 갈음)",
  "",
  "## 완성 후",
  "",
  "validate_page로 재검사하라 — dev 서버 url을 검사할 때는 sourceDir에 소스 폴더(예: \"app\", \"src\")를 넘겨라.",
  "그래야 검사 뒤 코드를 고쳤을 때 gate가 '검사 낡음'으로 재검사를 요구한다.",
].join("\n");

const GUIDES: Record<Framework, string> = {
  react: REACT_GUIDE,
  nextjs: NEXTJS_GUIDE,
};

export function frameworkGuide(framework: string): string | undefined {
  return GUIDES[framework as Framework];
}

/** 프레임워크를 안 줬을 때 — 거부 대신 고를 목록을 준다 (인자 없이 불러 거부당하던 왕복, RC 검증 실측) */
export function frameworkGuideIndex(): string {
  return [
    "# SPA 프레임워크 × KRDS 킷 가이드 — 프레임워크를 골라 다시 부르라",
    "",
    '- `react` — React SPA 공통 (Vite 등). 킷 JS 로드 훅, 킷 CSS <link> 로드, 라우트 전환 뒤 위젯 재초기화 훅',
    '- `nextjs` — Next.js. react 처방 + use client·하이드레이션, next/link, 라우트 전환 초점 관리',
    "",
    "예: get_framework_guide({ framework: \"react\" })",
  ].join("\n");
}
