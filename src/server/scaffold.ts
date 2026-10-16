// 페이지 뼈대 생성 — 컴포넌트 이전에 페이지 수준에서 갖춰야 할 것들.
// 컴포넌트 공급(get_component)이 못 덮는 페이지 수준 KWCAG 항목 중
// 마크업으로 해결되는 부분을 처음부터 올바르게 깔아준다.

export type ScaffoldOptions = {
  pageTitle: string;
  lang?: string; // 기본 ko — kwcag:7.1.1
  /** 킷 자산 경로 — 소비 프로젝트가 킷을 어디서 서빙하는지에 따라 다르다 */
  assetBase?: string;
  /** 캐러셀 사용 예정이면 swiper 번들도 포함 */
  withCarousel?: boolean;
};

/** 뼈대가 커버하는 페이지 수준 KWCAG 항목 — 응답 안내문에 쓴다 */
export const SCAFFOLD_COVERS = [
  { kwcagId: "kwcag:7.1.1", how: '`<html lang>` 지정 — 33개 중 유일하게 자동 완전판정되는 항목' },
  { kwcagId: "kwcag:6.4.2", how: "`<title>` 제공 (내용은 pageTitle 입력값)" },
  {
    kwcagId: "kwcag:6.4.1",
    how:
      "건너뛰기 링크 + 본문 시작점(`#main-content`, `tabindex=\"-1\"`). " +
      "킷 샘플 기본값(#breadcrumb)의 함정을 피해 본문을 가리키게 고정. " +
      "확인법: Tab → Enter → 한 번 더 Tab이 본문 내부로 가면 정상",
  },
] as const;

/** 뼈대로도 해결되지 않는 페이지 수준 항목 — 조립하면서 지켜야 한다 */
export const SCAFFOLD_MANUAL = [
  { kwcagId: "kwcag:6.4.2", note: "본문 제목 위계 — main 안에서 h1부터 시작, 수준 건너뛰기 금지" },
  { kwcagId: "kwcag:5.3.2", note: "콘텐츠를 논리적 순서로 배치 — DOM 순서가 곧 읽기 순서" },
  { kwcagId: "kwcag:7.2.2", note: "도움 정보(연락처·FAQ)를 쓴다면 모든 페이지에서 같은 상대 위치에" },
] as const;

export function buildScaffold(opts: ScaffoldOptions): string {
  const lang = opts.lang ?? "ko";
  const base = (opts.assetBase ?? "node_modules/krds-uiux").replace(/\/$/, "");
  const font = (w: string, file: string) => `  @font-face {
    font-family: "Pretendard GOV";
    font-weight: ${w};
    font-display: swap;
    src: url("${base}/resources/fonts/PretendardGOV-${file}.subset.woff2") format("woff2"),
         url("${base}/resources/fonts/PretendardGOV-${file}.subset.woff") format("woff");
  }`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${opts.pageTitle}</title>
<link rel="stylesheet" href="${base}/resources/css/common/common.css">
<link rel="stylesheet" href="${base}/resources/css/component/component.css">
<style data-krds-a11y="template">
  /* 킷은 폰트 파일만 동봉하고 @font-face 선언은 소비자 몫이다 —
     선언하지 않으면 미설치 기기에서 시스템 폰트로 조용히 대체된다 */
${font("400", "Regular")}
${font("500", "Medium")}
${font("700", "Bold")}
  /* 건너뛰기 도착점(main)은 컨트롤이 아니다 — 페이지 전체를 감싸는 초점 링 억제 */
  #main-content:focus { outline: none; box-shadow: none; }
  /* 본문 컨테이너(#container→main) 교체로 빠지는 원본 간격 승계 */
  #main-content { min-height: 60rem; padding-bottom: var(--krds-pc-gap-layout-contents-footer); }
</style>
</head>
<body>
<div id="wrap"><!-- 킷 구조: 모달이 배경을 막는 범위 -->

<!-- 건너뛰기 링크: 본문 시작점을 가리킨다. 대상의 tabindex="-1"이 초점 이동을 보장 -->
<div id="krds-skip-link">
  <a href="#main-content">본문 바로가기</a>
</div>

<header>
  <!-- get_component: masthead → header → main_menu 순서 권장 -->
</header>

<div id="container"><!-- 킷 스크롤 처리·도움 패널이 찾는 본문 컨테이너 -->
<main id="main-content" tabindex="-1">
  <h1>${opts.pageTitle}</h1>
  <!-- 본문 — get_component로 받은 컴포넌트를 여기에 조립 -->
</main>
</div>

<footer>
  <!-- get_component: footer, identifier -->
</footer>
</div>

<!-- 모달 자리 — #wrap 밖에 둔다. 킷 모달은 열 때 #wrap에 inert를 걸어 배경을 막는다 -->

${opts.withCarousel ? `<script src="${base}/resources/js/plugin/swiper-bundle.min.js"></script>\n` : ""}<script src="${base}/resources/js/component/ui-script.js"></script>
</body>
</html>
`;
}

export type ScaffoldParts = {
  head: string;
  header: string;
  main: string;
  footer: string;
  scripts: string;
};

export const SCAFFOLD_PART_NOTES: Record<keyof ScaffoldParts, string> = {
  head: "문서 시작부터 </head>까지 — 언어·제목·킷 CSS·동봉 CSS",
  header: "<body>부터 #wrap 시작·건너뛰기 링크·공식 배너·헤더·#container 시작까지",
  main: "본문 (main#main-content) — 화면마다 다른 부분",
  footer: "</main> 뒤부터 #container 끝·푸터까지",
  scripts: "#wrap 끝·모달 자리(#wrap 밖)·킷 스크립트와 </body></html>",
};

/**
 * 완성된 페이지를 include 조각으로 자른다 — 연속 구간이라 이어 붙이면 원본과 같다.
 * 소비자가 조각 분해 스크립트를 자작하던 마찰(JSP 실사용 실측, split-scaffold.js)을 흡수한다.
 * 경계 요소가 하나라도 없으면 null.
 */
export function splitScaffold(html: string): ScaffoldParts | null {
  const headEnd = html.indexOf("</head>");
  const mainStart = html.indexOf("<main");
  const mainEnd = html.indexOf("</main>");
  const footerEnd = html.lastIndexOf("</footer>");
  if (headEnd < 0 || mainStart < 0 || mainEnd < 0 || footerEnd < 0) return null;
  const a = headEnd + "</head>".length;
  const b = mainStart;
  const c = mainEnd + "</main>".length;
  const d = footerEnd + "</footer>".length;
  if (!(a <= b && b < c && c <= d)) return null;
  return {
    head: html.slice(0, a),
    header: html.slice(a, b),
    main: html.slice(b, c),
    footer: html.slice(c, d),
    scripts: html.slice(d),
  };
}

// ── 사이트 공통부 코드 조립 — 조립 함정(랜드마크 중복·masthead 이탈)을
// 지시문이 아닌 코드로 차단한다. 실측 검증(2026-09-15): 조립 결과 axe 0건.
import { iconFixCssAll, readMarkup } from "../mapping/kit-markup.js";
import { escapeHtml } from "../markup/escape.js";
import { logoCss, renderSiteHeader, type MenuNode } from "../markup/site-header.js";

/**
 * 페이지의 header/footer 슬롯을 킷 공통부로 올바르게 교체한다.
 * - masthead: 랜드마크 밖에 뜨는 div → 이름 있는 section으로 감쌈
 * - header/footer: 자체 랜드마크이므로 슬롯 요소를 통째로 교체 (중첩 금지)
 * - identifier: 킷 푸터 마크업에 이미 포함
 * - 킷 아이콘 경로 버그 교정 CSS를 <style data-krds-a11y="template">에 주입
 */
export type SiteChromeOptions = {
  /** 기관명 — 헤더 로고·푸터 로고의 대체 텍스트 */
  orgName?: string;
  homeHref?: string;
  /** 있으면 킷 데모 헤더 대신 이 메뉴로 헤더를 만든다 */
  menu?: MenuNode[];
  loginHref?: string;
  /** 기관 로고 이미지 — 킷 로고(CSS 배경)를 교체하는 CSS를 넣는다 */
  logoSrc?: string;
  logoHighContrastSrc?: string;
};

export function assembleSiteChrome(html: string, assetBase: string, chrome: SiteChromeOptions = {}): string {
  const base = assetBase.replace(/\/$/, "");
  const masthead = `<section aria-label="공식 배너">\n${readMarkup("krds:masthead").html}\n</section>`;
  let header = readMarkup("krds:header").html;
  if (chrome.menu?.length) {
    const r = renderSiteHeader({ orgName: chrome.orgName ?? "", menu: chrome.menu, ...(chrome.homeHref ? { homeHref: chrome.homeHref } : {}), ...(chrome.loginHref ? { loginHref: chrome.loginHref } : {}) });
    if (!r.ok) throw new Error(r.reason);
    header = r.html;
  } else if (chrome.orgName) {
    const name = escapeHtml(chrome.orgName);
    header = header.replace(/(<h2 class="logo">[\s\S]*?<span class="sr-only">)[^<]*/, (_, open: string) => open + name);
  }
  let footer = readMarkup("krds:footer").html;
  // 푸터 로고(f-logo)만 기관명으로 — 운영기관 식별자(krds-identifier)는 정부 상징이라 그대로 둔다
  if (chrome.orgName) {
    const name = escapeHtml(chrome.orgName);
    footer = footer.replace(/(<div class="f-logo">\s*<span class="sr-only">)[^<]*/, (_, open: string) => open + name);
  }
  const logo = chrome.logoSrc ? `\n/* 기관 로고 교체 — 킷 로고는 CSS 배경이다 (site-header.logoCss) */\n${logoCss(chrome.logoSrc, chrome.logoHighContrastSrc)}` : "";

  // 공통부만이 아니라 페이지 전체 교정 — 조립 페이지는 어떤 컴포넌트가 오든
  // 아이콘 버그를 밟는다 (컴포넌트별 조각으로는 빠지는 곳이 생김, 실사용 테스트 실증)
  const fix = iconFixCssAll(base);

  return html
    .replace(/<header>[\s\S]*?<\/header>/, () => `${masthead}\n${header}`)
    .replace(/<footer>[\s\S]*?<\/footer>/, () => footer)
    .replace("</style>", () => `\n/* 킷 아이콘 경로 버그 전면 교정 (kit-markup.iconFixCssAll) */\n${fix}${logo}\n</style>`);
}
