// 페이지 뼈대 도구 — get_page_scaffold
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { kitVersion, kitVersionWarning } from "../../mapping/kit-markup.js";
import {
  assembleSiteChrome,
  buildScaffold,
  SCAFFOLD_COVERS,
  SCAFFOLD_MANUAL,
  SCAFFOLD_PART_NOTES,
  splitScaffold,
  type ScaffoldParts,
  type SiteChromeOptions,
} from "../scaffold.js";
import { siteMenuError } from "../../markup/site-header.js";
import { listPatterns, renderPattern, resolvePattern } from "../../templates/index.js";
import { itemLabel, text } from "./shared.js";

/** 페이지 HTML 출력 — page면 한 덩어리, parts면 include 조각별 코드 블록 */
export function pageBlock(html: string, output: "page" | "parts" = "page"): string[] {
  const parts = output === "parts" ? splitScaffold(html.trim()) : null;
  if (!parts) {
    return [
      ...(output === "parts" ? ["(조각 경계(head·main·footer)를 찾지 못해 전체 페이지로 준다)", ""] : []),
      "```html",
      html.trim(),
      "```",
    ];
  }
  const out: string[] = [
    "## include 조각 — 아래 순서대로 이어 붙이면 완성 페이지가 된다",
    "",
  ];
  for (const key of Object.keys(SCAFFOLD_PART_NOTES) as (keyof ScaffoldParts)[]) {
    out.push(`### ${key} — ${SCAFFOLD_PART_NOTES[key]}`, "", "```html", parts[key].trim(), "```", "");
  }
  out.push(
    "조각을 나눠도 렌더된 DOM은 이어 붙인 결과와 같아야 한다 — 조각 사이에 요소를 끼우거나 랜드마크를 중복시키지 마라. " +
      "여러 화면이 같은 조각을 쓰면 head의 <title>과 main의 h1은 화면마다 바꿔야 한다(JSP는 변수로). header 조각의 body에 붙은 data-krds-pattern 속성은 템플릿 표식이라 공통 조각에서는 지워도 된다. " +
      "JSP include(.jspf)로 쓰면 조각 파일 맨 위에 `<%@ page pageEncoding=\"UTF-8\" %>`를 넣어라 — " +
      "없으면 jspf가 ISO-8859-1로 읽혀 한글이 깨진다(검사는 통과해 눈으로만 드러난다).",
  );
  return out;
}

export function registerGetPageScaffold(server: McpServer): void {
  // ── 페이지 뼈대: 컴포넌트 이전에 페이지 수준 요건을 깔아준다
  server.registerTool(
    "get_page_scaffold",
    {
      title: "KRDS 페이지 뼈대",
      description:
        "KRDS 페이지의 시작 골격을 반환한다. pattern을 지정하면 공식 KRDS 패턴 기반 " +
        "완성 템플릿(접근성 교정 적용)을 주고, 미지정 시 빈 뼈대를 준다. " +
        "새 페이지를 만들 때 컴포넌트 조회보다 먼저 호출하라. 로그인·신청 등 정형 화면은 " +
        "반드시 pattern을 사용하라 — 레이아웃을 직접 창작하지 않는 것이 KRDS 준수의 기본이다.",
      inputSchema: {
        pageTitle: z
          .string()
          .min(1)
          .describe("페이지 제목 — <title>과 h1에 들어간다 (kwcag:6.4.2). 비어있으면 안 된다"),
        lang: z.string().optional().describe('주 언어 코드. 기본 "ko" (kwcag:7.1.1)'),
        assetBase: z
          .string()
          .optional()
          .describe(
            '킷 자산 경로 — 기본 "node_modules/krds-uiux". 킷을 복사·CDN으로 서빙하면 그 경로',
          ),
        withCarousel: z
          .boolean()
          .optional()
          .describe("캐러셀 사용 예정이면 true — swiper 번들 스크립트 포함"),
        withSiteChrome: z
          .boolean()
          .optional()
          .describe(
            "true면 사이트 공통부(공식 배너·헤더·푸터·운영기관 식별자)를 도구가 올바른 " +
              "랜드마크 구조로 조립해 포함한다 — 직접 조립보다 이 옵션을 권장. siteMenu·orgName·logoSrc로 메뉴와 로고까지 만든다",
          ),
        orgName: z
          .string()
          .optional()
          .describe("기관명 — withSiteChrome의 헤더·푸터 로고 대체 텍스트가 된다(로고는 CSS 배경이라 유일한 텍스트). 실제 기관명을 넣어라"),
        siteMenu: z
          .array(
            z.object({
              label: z.string(),
              href: z.string().optional(),
              children: z
                .array(
                  z.object({
                    label: z.string(),
                    href: z.string().optional(),
                    children: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
                  }),
                )
                .optional(),
            }),
          )
          .optional()
          .describe(
            "withSiteChrome의 헤더 메뉴(1~3단계) — 주면 킷 데모 메뉴(자리 문구 수십 개) 대신 이 트리로 데스크톱 메뉴와 모바일 전체메뉴를 만든다. " +
              "하위가 없는 항목은 href 필수, 하위가 있는 항목은 여닫는 버튼이 된다. 예: [{label:\"민원\",children:[{label:\"민원 신청\",href:\"/apply\"}]},{label:\"알림\",href:\"/notice\"}]",
          ),
        homeHref: z.string().optional().describe('로고 링크 — 기본 "/"'),
        loginHref: z.string().optional().describe("있으면 헤더에 로그인 링크를 둔다 (siteMenu와 함께)"),
        logoSrc: z
          .string()
          .optional()
          .describe("기관 로고 이미지 경로 — 킷 로고(CSS 배경)를 바꾸는 CSS를 헤더·푸터에 넣는다. 고대비 모드에도 같은 이미지를 쓴다"),
        pattern: z
          .string()
          .optional()
          .describe('KRDS 패턴 이름 (예: "login"). 정형 화면이면 지정하라 — 완성 구조를 반환한다'),
        slots: z
          .record(z.string(), z.string())
          .optional()
          .describe("패턴 슬롯 값 — 필수 슬롯 미입력 시 무엇을 채울지 안내만 반환한다"),
        output: z
          .enum(["page", "parts"])
          .optional()
          .describe(
            '"parts"면 조각(head·header·main·footer·scripts)으로 나눠 준다 — 여러 화면이 공통부를 공유할 때(JSP include, 정적 사이트 공통 조각, 레이아웃 컴포넌트) 손으로 떼어 내지 말고 이것을 써라. 기본 "page"',
          ),
      },
    },
    async ({ pageTitle, lang, assetBase, withCarousel, withSiteChrome, pattern, slots, output, orgName, siteMenu, homeHref, loginHref, logoSrc }) => {
      const chrome: SiteChromeOptions = {
        ...(orgName?.trim() ? { orgName: orgName.trim() } : {}),
        ...(siteMenu?.length ? { menu: siteMenu } : {}),
        ...(homeHref ? { homeHref } : {}),
        ...(loginHref ? { loginHref } : {}),
        ...(logoSrc ? { logoSrc } : {}),
      };
      if (!withSiteChrome && Object.keys(chrome).length > 0) {
        return text("orgName·siteMenu·homeHref·loginHref·logoSrc는 공통부를 만들 때 쓴다 — withSiteChrome: true와 함께 다시 호출하라.");
      }
      if (chrome.menu) {
        const err = !chrome.orgName ? "orgName(기관명)이 비었다 — 로고의 유일한 대체 텍스트다" : siteMenuError(chrome.menu);
        if (err) return text(`siteMenu로 헤더를 만들 수 없다: ${err}`);
      }
      const chromeNote = chrome.menu
        ? "헤더 메뉴는 siteMenu로 만들었다 — 메뉴를 바꾸려면 siteMenu를 고쳐 다시 받는다. 푸터 안내 문구(주소·연락처·관련 사이트)는 콘텐츠로 교체하라."
        : "메뉴·로고 텍스트는 콘텐츠로 교체하라 — siteMenu·orgName을 주면 도구가 헤더 메뉴와 로고 대체 텍스트를 만들어 준다(킷 데모 메뉴는 자리 문구다).";
      if (pattern) {
        const resolved = resolvePattern(pattern);
        if (resolved.kind === "none") {
          const names = listPatterns().map((m) => `${m.name} — ${m.title}`);
          return text(`알 수 없는 패턴: ${pattern}\n\n사용 가능한 패턴:\n${names.map((n) => `- ${n}`).join("\n")}`);
        }
        if (resolved.kind === "family") {
          // 같은 화면 계열에 변형이 여럿 — 도구가 임의로 고르지 않는다
          return text([
            `# ${pattern} 패턴에는 화면이 ${resolved.variants.length}가지 있다 — 서비스 요건에 맞는 것을 지정하라`,
            "",
            ...resolved.variants.map((v) => `- **${v.name}** — ${v.title}\n  - ${v.whenToUse ?? ""}`),
            "",
            "판단 근거가 사용자 요구에 없으면 추측하지 말고 사용자에게 물어라",
            "(예: \"어떤 인증 방식을 지원하나요? 자체 계정만 / 간편인증 포함 / 회원 유형 구분\").",
          ].join("\n"));
        }
        const merged = { pageTitle, ...(lang ? { lang } : {}), ...(assetBase ? { assetBase } : {}), ...(slots ?? {}) };
        const rendered = renderPattern(resolved.meta.name, merged);
        if (rendered === null) {
          return text(`패턴 로드 실패: ${resolved.meta.name}`);
        }
        if (!rendered.ok) {
          return text([
            `# ${resolved.meta.name} 패턴 — 필수 슬롯이 채워지지 않아 템플릿을 제공하지 않는다 (${rendered.missing.length}건)`,
            "",
            "아래 값을 slots에 담아 다시 호출하라.",
            "",
            ...rendered.missing.map(
              (m) => `- **${m.name}** — ${m.description}${m.kwcagId ? ` (${itemLabel(m.kwcagId)})` : ""}`,
            ),
          ].join("\n"));
        }
        const { meta, html: renderedHtml, usedDefaults } = rendered.result;
        const chromeBase = assetBase ?? "node_modules/krds-uiux";
        const html = withSiteChrome ? assembleSiteChrome(renderedHtml, chromeBase, chrome) : renderedHtml;
        return text([
          `# ${meta.title} 템플릿 (패턴: ${meta.name})`,
          "",
          "**이 구조는 KRDS 공식 패턴 기준이다. 구조·요소 순서를 유지하고, 변경은 사용자의 명시적 요구가 있을 때만 하라.** " +
            `근거 문서: ${meta.source.docUrl}`,
          "",
          "**프레임워크 변환·컴포넌트 분리는 자유다(React/Vue/JSP 등). 단 렌더된 DOM이 이 템플릿과 동일해야 보장이 유지된다:** " +
            "구조·클래스·속성(aria 포함) 그대로, 래퍼 요소 추가 금지(직계 자식 셀렉터가 깨진다 — fragment 사용), " +
            "label↔id 연결 유지, h1·main#main-content·건너뛰기 링크는 페이지당 하나. " +
            "스타일은 킷 CSS와 동봉 CSS를 그대로 로드하라 — Tailwind 등으로 재작성하면 접근성 보장 근거가 사라진다(자체 스타일은 공존만 허용). " +
            "**시안·스크린샷을 받았다면 가져올 것은 배치·구성뿐이다** — 색·타이포·부품 생김새는 시안이 아니라 킷 토큰을 따른다. 시안 색을 인라인 스타일로 덧칠하지 마라. 밀도 조정이 필요하면 킷 토큰 단계 선택으로만 한다(임의 px 금지). " +
            "동봉 CSS를 다른 페이지에 재사용할 때는 블록을 통째로 가져가라 — @media 규칙을 평탄화하면 모바일 규칙이 데스크톱에 적용된다. " +
            "데모의 href=\"#\" 플레이스홀더 링크는 전부 실제 URL로 교체하라 — 제자리 앵커는 심사 도구(OpenWAX 등)에서 연결 미확인으로 걸린다. " +
            "폼 컨트롤의 레이블은 label 연결(시각 라벨이 없으면 sr-only label)로 제공하라 — aria-label만으로는 국내 심사 도구가 레이블로 인정하지 않는다.",
          "",
          ...pageBlock(html, output),
          "",
          "## 공식 샘플 대비 교정된 것 (되돌리지 말 것)",
          "",
          ...meta.corrections.map((c) => `- ${c.what}${c.kwcagId ? ` (${itemLabel(c.kwcagId)})` : ""}`),
          "",
          ...(usedDefaults.length > 0
            ? [`기본값으로 채워진 슬롯: ${usedDefaults.join(", ")} — 실제 값으로 교체를 검토하라`, ""]
            : []),
          "## 조립하면서 지켜야 하는 것",
          "",
          ...SCAFFOLD_MANUAL.map((m) => `- ${itemLabel(m.kwcagId)} — ${m.note}`),
          "",
          withSiteChrome
            ? `사이트 공통부는 올바른 랜드마크 구조로 조립돼 있다 — 배치를 바꾸지 마라. ${chromeNote}`
            : "header/footer 주석 자리는 get_component(masthead·header·main_menu·footer·identifier)로 채운다 — 또는 withSiteChrome: true로 다시 호출하면 도구가 올바르게 조립해 준다.",
        ].join("\n"));
      }
      const scaffoldHtml = buildScaffold({
        pageTitle,
        ...(lang ? { lang } : {}),
        ...(assetBase ? { assetBase } : {}),
        ...(withCarousel !== undefined ? { withCarousel } : {}),
      });
      const chromeBase2 = assetBase ?? "node_modules/krds-uiux";
      const html = withSiteChrome ? assembleSiteChrome(scaffoldHtml, chromeBase2, chrome) : scaffoldHtml;
      const out: string[] = [
        `# 페이지 뼈대 (킷 v${kitVersion()})`,
        "",
        ...(kitVersionWarning() ? [kitVersionWarning()!, ""] : []),
        ...pageBlock(html, output),
        "",
        "## 이 뼈대가 충족시키는 항목",
        "",
        ...SCAFFOLD_COVERS.map((c) => `- ${itemLabel(c.kwcagId)} — ${c.how}`),
        "",
        "## 조립하면서 지켜야 하는 것 (뼈대로 해결 안 됨)",
        "",
        ...SCAFFOLD_MANUAL.map((m) => `- ${itemLabel(m.kwcagId)} — ${m.note}`),
        "",
        withSiteChrome
          ? `사이트 공통부는 조립돼 있다 — 본문은 get_component로 조립한다. ${chromeNote}`
          : "다음 단계: get_component로 컴포넌트를 받아 main 안에 조립한다. 공통부는 withSiteChrome: true로 도구가 조립해 줄 수 있다.",
      ];
      return text(out.join("\n"));
    },
  );
}
