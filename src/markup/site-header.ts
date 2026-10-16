// 사이트 헤더 생성 — 메뉴 트리·기관명으로 킷 header 구조(데스크톱 GNB + 모바일 전체메뉴)를 만든다.
// 킷 데모 헤더는 459줄에 "1Depth"·"메뉴명" 자리 문구가 가득해 소비자가 어디까지 지워도 되는지 몰랐다(실사용 재지적).
// 구조는 header.html 그대로 따르되 데모 전용 부분(유틸 드롭다운·나의 GOV·하위 배너·4Depth)은 뺀다 —
// 킷 JS(krds_mainMenuPC·krds_mainMenuMobile)가 찾는 선택자는 모두 유지한다. 근거: header.html, ui-script.js L88–565
import { escapeHtml as e } from "./escape.js";

export type MenuNode = { label: string; href?: string; children?: MenuNode[] };

export type SiteHeaderOptions = {
  /** 기관명 — 로고의 대체 텍스트(로고는 CSS 배경이라 이것이 유일한 텍스트) */
  orgName: string;
  /** 로고 링크 (기본 "/") */
  homeHref?: string;
  /** 1~3단계 메뉴 트리. 하위가 있는 항목의 href는 쓰지 않는다(여닫는 버튼이 된다) */
  menu: MenuNode[];
  /** 있으면 헤더에 로그인 링크 */
  loginHref?: string;
};

export type SiteHeaderResult = { ok: true; html: string } | { ok: false; reason: string };

const depthOf = (n: MenuNode): number => 1 + Math.max(0, ...(n.children ?? []).map(depthOf));

/** 입력 검증 — 빈 레이블·href 없는 말단·4단계 이상을 거부한다 (자리 문구 잔존이 실사용 지적의 핵심) */
export function siteMenuError(menu: MenuNode[]): string | undefined {
  if (menu.length === 0) return "메뉴가 비어 있다 — 1단계 항목을 하나 이상 넣어라";
  const walk = (nodes: MenuNode[], path: string): string | undefined => {
    for (const [i, n] of nodes.entries()) {
      const at = `${path}${i + 1}번째`;
      if (!n.label?.trim()) return `${at} 항목의 label이 비었다`;
      if (!n.children?.length && !n.href?.trim()) return `${at} "${n.label}"는 하위가 없으니 href가 필요하다`;
      if (n.children?.length) {
        const r = walk(n.children, `${at} "${n.label}"의 `);
        if (r) return r;
      }
    }
    return undefined;
  };
  const tooDeep = menu.find((n) => depthOf(n) > 3);
  if (tooDeep) return `"${tooDeep.label}" 아래가 3단계를 넘는다 — 헤더 메뉴는 3단계까지 만든다(4단계는 하위 페이지의 사이드 메뉴로)`;
  return walk(menu, "");
}

const leaf = (n: MenuNode, cls = "") => `<li><a href="${e(n.href!)}"${cls ? ` class="${cls}"` : ""}>${e(n.label)}</a></li>`;

function desktopItem(n: MenuNode): string[] {
  if (!n.children?.length) return [`<li><a href="${e(n.href!)}" class="gnb-main-trigger is-link" data-trigger="gnb">${e(n.label)}</a></li>`];
  const open = [`<li>`, `  <button type="button" class="gnb-main-trigger" data-trigger="gnb">${e(n.label)}</button>`, `  <div class="gnb-toggle-wrap">`];
  const close = [`  </div>`, `</li>`];
  // 2단계만 — 킷의 single-list 형(한 패널에 링크 목록)
  if (!n.children.some((c) => c.children?.length)) {
    return [
      ...open,
      `    <div class="gnb-main-list">`,
      `      <div class="gnb-sub-list single-list">`,
      `        <div class="gnb-sub-content">`,
      `          <h2 class="sub-title"><span>${e(n.label)}</span></h2>`,
      `          <ul>`,
      ...n.children.map((c) => `            ${leaf(c)}`),
      `          </ul>`,
      `        </div>`,
      `      </div>`,
      `    </div>`,
      ...close,
    ];
  }
  // 3단계 — 2단계가 다시 여닫는 형(data-has-submenu)
  const subs = n.children.flatMap((c) =>
    c.children?.length
      ? [
          `        <li>`,
          `          <button type="button" class="gnb-sub-trigger" data-trigger="gnb">${e(c.label)}</button>`,
          `          <div class="gnb-sub-list">`,
          `            <div class="gnb-sub-content">`,
          `              <h2 class="sub-title">${e(c.label)}</h2>`,
          `              <ul>`,
          ...c.children.map((g) => `                ${leaf(g)}`),
          `              </ul>`,
          `            </div>`,
          `          </div>`,
          `        </li>`,
        ]
      : [`        <li><a href="${e(c.href!)}" class="gnb-sub-trigger is-link" data-trigger="gnb">${e(c.label)}</a></li>`],
  );
  return [...open, `    <div class="gnb-main-list" data-has-submenu="true">`, `      <ul>`, ...subs, `      </ul>`, `    </div>`, ...close];
}

function mobilePanel(n: MenuNode, i: number): string[] {
  // 하위 없는 1단계도 패널을 둔다 — 킷 모바일 메뉴는 1단계를 패널로 가는 탭으로 쓴다(ui-script.js setupAriaAttributes)
  const items = n.children?.length ? n.children : [n];
  return [
    `<div class="gnb-sub-list" id="mGnb-anchor${i + 1}">`,
    `  <h2 class="sub-title">${e(n.label)}</h2>`,
    `  <ul>`,
    ...items.flatMap((c) =>
      c.children?.length
        ? [
            `    <li>`,
            // 킷 데모는 a지만 href 없이 여닫기만 한다(href="#"면 맨 위로 튄다) — 버튼으로. 킷 CSS는 클래스만 본다
            `      <button type="button" class="gnb-sub-trigger has-depth3">${e(c.label)}</button>`,
            `      <div class="depth3-wrap">`,
            `        <ul>`,
            ...c.children.map((g) => `          ${leaf(g, "depth3-trigger")}`),
            `        </ul>`,
            `      </div>`,
            `    </li>`,
          ]
        : [`    ${leaf(c, "gnb-sub-trigger")}`],
    ),
    `  </ul>`,
    `</div>`,
  ];
}

export function renderSiteHeader(opts: SiteHeaderOptions): SiteHeaderResult {
  if (!opts.orgName?.trim()) return { ok: false, reason: "orgName(기관명)이 비었다 — 로고의 유일한 대체 텍스트다" };
  const err = siteMenuError(opts.menu);
  if (err) return { ok: false, reason: err };
  const ind = (lines: string[], n: number) => lines.map((l) => " ".repeat(n) + l);
  const html = [
    `<header id="krds-header">`,
    `  <div class="header-in">`,
    `    <div class="header-container">`,
    `      <div class="inner">`,
    `        <div class="header-branding">`,
    `          <h2 class="logo">`,
    `            <a href="${e(opts.homeHref ?? "/")}"><span class="sr-only">${e(opts.orgName)}</span></a>`,
    `          </h2>`,
    `          <div class="header-actions">`,
    ...(opts.loginHref ? [`            <a href="${e(opts.loginHref)}" class="btn-navi login">로그인</a>`] : []),
    `            <button type="button" class="btn-navi all" aria-controls="mobile-nav">전체메뉴</button>`,
    `          </div>`,
    `        </div>`,
    `      </div>`,
    `    </div>`,
    `    <nav class="krds-main-menu" aria-label="메인 메뉴">`,
    `      <div class="inner">`,
    `        <ul class="gnb-menu">`,
    ...ind(opts.menu.flatMap(desktopItem), 10),
    `        </ul>`,
    `      </div>`,
    `    </nav>`,
    `  </div>`,
    `  <div id="mobile-nav" class="krds-main-menu-mobile">`,
    `    <div class="gnb-wrap">`,
    `      <div class="gnb-body">`,
    `        <div class="gnb-menu">`,
    `          <div class="menu-wrap">`,
    `            <ul>`,
    ...opts.menu.map((n, i) => `              <li><a href="#mGnb-anchor${i + 1}" class="gnb-main-trigger">${e(n.label)}</a></li>`),
    `            </ul>`,
    `          </div>`,
    `          <div class="submenu-wrap">`,
    ...ind(opts.menu.flatMap(mobilePanel), 12),
    `          </div>`,
    `        </div>`,
    `      </div>`,
    `      <button type="button" class="krds-btn medium icon" id="close-nav">`,
    `        <span class="sr-only">전체메뉴 닫기</span>`,
    `        <i class="svg-icon ico-popup-close"></i>`,
    `      </button>`,
    `    </div>`,
    `  </div>`,
    `</header>`,
  ].join("\n");
  return { ok: true, html };
}

/**
 * 기관 로고 교체 CSS — 킷 로고는 CSS 배경 이미지라 sr-only 기관명만 바꾸면 화면엔 KRDS 로고가 남는다
 * (실사용 재지적). 킷이 로고를 거는 선택자를 같은 우선순위로 다시 선언한다 — 킷 CSS 뒤에 둔다.
 * 근거: component.css 헤더 L3641·L3777·L3799, 푸터 L5291·L5642·L5690
 */
export function logoCss(logoSrc: string, highContrastSrc = logoSrc): string {
  const url = (s: string) => `url("${s.replace(/["\\\n]/g, "")}")`;
  return [
    `#krds-header .header-container .logo a, #krds-footer .f-logo { background-image: ${url(logoSrc)}; }`,
    `[data-krds-mode=high-contrast] #krds-header .header-container .logo a, [data-krds-mode=high-contrast] #krds-footer .f-logo { background-image: ${url(highContrastSrc)}; }`,
    `@media (prefers-color-scheme: dark) { [data-krds-mode=theme] #krds-header .header-container .logo a, [data-krds-mode=theme] #krds-footer .f-logo { background-image: ${url(highContrastSrc)}; } }`,
  ].join("\n");
}
