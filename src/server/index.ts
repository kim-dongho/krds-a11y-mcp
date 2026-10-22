import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pkg from "../../package.json";
import { kitVersionWarning } from "../mapping/kit-markup.js";
import { registerTools } from "./tools/index.js";

export const SERVER_NAME = "krds-a11y";
// 패키지 버전과 자동 동기화 — 번들 시점에 인라인된다 (하드코딩 드리프트 방지)
export const SERVER_VERSION = pkg.version;

/**
 * MCP 서버 인스턴스를 만든다.
 * 도구는 매핑표 v1(리포트 PoC 검증 완료) 데이터를 근거로 동작한다.
 */
// MCP initialize 응답에 실리는 사용 지침 — 클라이언트(Claude Code 등)가 컨텍스트에 반영한다.
// 소비 프로젝트 CLAUDE.md 복붙 없이도 규칙이 전달되게 서버에 내장 (README 스니펫은 보강용).
export const SERVER_INSTRUCTIONS = [
  "KRDS 기반 공공 웹 페이지·컴포넌트를 만들 때는 직접 마크업을 짓지 말고 이 서버의 도구를 먼저 쓴다:",
  "페이지는 get_page_scaffold(사이트 공통부가 필요하면 withSiteChrome: true), 부품은 get_component.",
  "- 완성 페이지(사이트 화면)를 만들 때, 프로젝트에 공통 레이아웃(헤더·푸터)이 아직 없으면 withSiteChrome: true를 기본으로 켜라 — 사용자가 빼라고 할 때만 뺀다. 공통 레이아웃이 이미 있으면(SPA의 layout 등) 콘텐츠 영역만 만들고 공통부를 중복 조립하지 마라 (랜드마크 중복 위반). 부품·화면 조각 요청에는 켜지 않는다. 공통부 누락은 validate_page가 검출하고 gate가 차단한다 — 팝업·인쇄용처럼 일부러 뺀 페이지는 body에 data-krds-a11y=\"no-chrome\"을 붙여라.",
  "- 이미지를 받으면 화면 시안인지 설명 자료(흐름도·도표·구조도)인지 먼저 판단하라. 설명 자료로 보이면 그 자료 모양을 재현할지, 자료가 설명하는 실제 화면들을 만들지 사용자에게 확인하라. 물을 수 없는 환경이면 실제 화면 구현으로 해석하고 그 가정을 결과에 명시하라. 화면 시안이 분명하면 묻지 말고 진행한다.",
  "",
  "- 도구가 필수 입력(레이블·alt·페이지 제목 등)을 요구하면 임의로 채우지 말고 사용자에게 실제 값을 물어본다.",
  "- 템플릿의 접근성 교정분(aria·랜드마크·제목 위계·건너뛰기 링크)은 되돌리지 않는다. 구조·클래스·속성을 유지하면 프레임워크 변환은 자유다. 래퍼 요소 추가 금지.",
  "- 스타일은 킷 CSS + 동봉 CSS를 그대로 로드한다. 시안이 있어도 색·타이포는 KRDS 토큰을 따르고, 배치·구성만 시안에서 가져온다.",
  "- 접근성 검사는 validate_page, 색·배치·폰트 확인은 inspect_page로 한다 — 자체 검사 스크립트를 만들지 않는다 (훅이 차단한다). 정말 임시 스크립트가 필요하면 시스템 임시 디렉터리에 만들고 끝나면 지운다.",
  "- 커스텀 CSS에 색·간격·글자 크기가 필요하면 get_tokens로 킷 토큰을 조회해 var()로 쓴다 — 임의 hex 값을 만들거나 node_modules의 킷 CSS를 직접 뒤지지 않는다.",
  "- 킷 아이콘 경로(img/img) 404는 알려진 킷 버그다. 자체 교정 스크립트를 만들거나 한 개씩 손으로 고치지 말고 get_icon_fix_css로 전면 교정 CSS를 받아 저장한다 (withSiteChrome 조립 페이지는 자동 주입되므로 불필요).",
  "- UI 부품(입력·버튼·셀렉트·탭)을 직접 발명하지 않는다. 입력+버튼 결합은 킷 input-group 패턴을 쓴다.",
  "- 킷 마크업을 쓸 때는 기본형으로 시작한다. 데모에 붙은 수식 클래스(bottom, top, small, line 등)는 동작·모양을 바꾸는 변형 스위치라, 의미를 확인하지 않았으면 빼라 (예: calendar-wrap의 bottom은 달력이 위로 열리는 변형이다). 부품의 일부(헤더·라벨 영역 등)를 임의 마크업으로 대체하지 말고 킷 구조를 그대로 쓴다.",
  "- 커스텀 CSS는 자기 구획의 배치·여백까지만 — 킷 셀렉터(.krds-*, form-group, input-group 등)를 타겟해 덮어쓰지 않는다.",
  "- 이 서버가 처방한 교정 CSS(breadcrumb 폭 정렬, 셀렉트 색, 아이콘 경로 등)를 별도 파일·스타일로 둘 때는 data-krds-a11y=\"corrections\" 속성을 붙여라 (<link data-krds-a11y=\"corrections\"> 또는 <style data-krds-a11y=\"corrections\">). validate_page가 도구 처방분으로 인정해 킷 관례 검사에서 제외한다.",
  "- dev 서버·배포본 url을 validate_page로 검사할 때는 sourceDir에 그 화면의 소스 폴더(예: src, src/main/webapp)를 넘겨라 — 넘기지 않으면 검사 뒤 소스를 고쳐도 gate가 낡음을 알아채지 못한다.",
  "- 킷 CSS는 JS import(번들러가 inline <style>로 주입) 대신 <link>로 로드하라 — 킷 JS가 외부 CSS 로드를 전제하고, inline 주입은 캐싱·검사에도 불리하다.",
  "- React·Next.js에서 킷 위젯(탭·아코디언·GNB)이 동작하지 않으면 자체 해법을 발명하기 전에 get_framework_guide를 보라 — 킷 JS는 DOMContentLoaded 1회 init이라 SPA 마운트를 모른다. 검증된 로드 훅이 들어 있다.",
  "- npm을 서빙하지 않는 스택(JSP·서블릿·정적 서버)에서는 킷을 문서루트로 복사해 서빙한다 (예: node_modules/krds-uiux → webapp/krds-uiux 전체 복사). get_icon_fix_css에는 assetBase로 서빙 경로(/krds-uiux)를 넘겨라. 복사본 수정 금지 — 교정은 별도 CSS로 하고, 킷을 업데이트하면 복사본도 다시 복사한다.",
  "- 컨텍스트 경로(/myapp 등)로 배포되는 서블릿 앱에서는 루트절대 경로(/krds-uiux/…)가 404가 되거나 다른 컨텍스트의 자산을 로드한다 — JSP에서는 ${pageContext.request.contextPath}를 경로 앞에 붙이고, get_icon_fix_css의 assetBase에도 같은 접두를 반영하라.",
  "- JSP include 조각(.jspf)은 pageEncoding 미선언 시 ISO-8859-1로 읽혀 한글이 깨진다 — 각 파일 머리에 <%@ page pageEncoding=\"UTF-8\" %>를 선언하라. web.xml의 jsp-property-group으로 전역 강제하는 방식은 EUC-KR 레거시 JSP를 500으로 깨뜨릴 수 있으니 혼합 인코딩 사이트에서는 파일별 선언이 안전하다.",
  "- 레거시 공통 header include와 새 화면을 합칠 때 h1이 두 개가 되기 쉽다 — 로고를 h1로 감싼 레거시 헤더면 그 h1을 일반 요소로 바꾸고(킷 공통부 헤더의 로고 h2.logo는 그대로 둔다), 페이지 제목 h1은 main 안에 하나만 둔다 (kwcag:6.4.2 제목 위계). 조합한 페이지를 validate_page로 검사해 확인한다.",
  "- 서블릿 컨테이너(Tomcat 등)의 기본 에러 페이지는 lang이 en이고 스택트레이스를 노출한다 — web.xml에 error-page(404·500·java.lang.Throwable)를 등록해 get_page_scaffold로 만든 한국어 에러 화면(lang=\"ko\", 제목·안내·홈 링크)으로 보낸다. 스택트레이스는 화면에 출력하지 말고 로그로만 남긴다.",
  "- Tailwind와 함께 쓸 때는 반드시 접두어를 건다: `@import \"tailwindcss/theme.css\" layer(theme) prefix(tw);` 다음 줄에 `@import \"tailwindcss/utilities.css\";`(layer 래핑 없이 — 킷 CSS는 무계층이라 @layer utilities를 항상 이긴다). Tailwind 클래스는 tw:flex·tw:mt-4처럼 쓴다. 접두어가 없으면 KRDS 클래스 이름과 겹친다 — contents(display:contents로 본문 상자가 사라져 레이아웃 붕괴)·border·outline이 실측된 충돌이다. 유틸리티는 자기 구획 여백·배치에만 쓰고 킷 컴포넌트 내부를 겨냥하지 않는다. 적용 여부는 inspect_page로 확인한다. 킷은 루트 글자 크기를 62.5%(1rem=10px)로 두므로 Tailwind 간격 유틸리티가 기본 계산(0.25rem 단위)으로는 2.5px 단위로 줄어든다 — `@theme { --spacing: 0.4rem; }`로 4px 단위를 되찾는다. 글자 크기는 Tailwind text-* 대신 킷 타이포그래피 토큰(get_tokens로 조회)을 쓴다 — text-base가 10px이 된다.",
  "- 킷 데모/패턴 마크업의 레이아웃 클래스(page-title-wrap, h-tit, conts-area 등)는 데모 사이트 전용 CSS에만 있고 npm 킷 CSS에는 없다 — 그대로 베끼면 스타일이 안 먹어 여백·배치가 0이 된다. 페이지는 get_page_scaffold 템플릿으로 시작하라(필요한 레이아웃 CSS가 동봉돼 있다). 템플릿 밖 화면을 직접 짤 때는 레이아웃 클래스를 베끼지 말고 킷 컴포넌트 클래스(.krds-*)만 쓰거나 자기 CSS로 여백을 준 뒤 inspect_page로 적용을 확인한다.",
  "- 공통 CSS·레이아웃·공통 컴포넌트를 고쳤으면 이미 검사한 화면을 전부 validate_page로 다시 검사하고 새 스크린샷을 확인하라 — 한 화면만 보고 끝내면 다른 화면의 깨짐이 리포트에 남는다. 검사한 화면 목록은 reports/SUMMARY.md에 있다.",
  "- 완료 기준은 세 가지다: ① validate_page 재검사 위반 0 (남으면 Stop 훅이 종료를 막는다) ② 저장된 전체 스크린샷으로 폴드 아래까지 시각 확인 — 위반 0은 시각 품질 보증이 아니다 ③ 사용자에게는 file://이 아니라 http URL로 전달한다. 리포트의 수동 확인 체크리스트는 사람 몫으로 사용자에게 전달한다.",
  "- 초점 링을 :focus로 그리지 말고 :focus-visible로 좁힌다. 그래야 마우스 클릭에는 링이 안 남고 키보드 사용자만 링을 본다. 초점 표시 자체를 없애면 안 된다(KWCAG 6.1.2).",
].join("\n");

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    { instructions: SERVER_INSTRUCTIONS },
  );
  registerTools(server);
  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  // stdout은 MCP 통신 전용 — 경고는 stderr로 (클라이언트 로그에 남는다)
  const kitWarning = kitVersionWarning();
  if (kitWarning) console.error(`[krds-a11y] ${kitWarning}`);
  await server.connect(new StdioServerTransport());
}
