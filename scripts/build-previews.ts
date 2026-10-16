// 템플릿 프리뷰 생성 — 사람이 브라우저로 직접 열어 확인하는 용도.
// 원형(templates/*.html)은 {{슬롯}} 미치환이라 열어도 스타일이 깨진다 —
// 이 스크립트가 기본값·데모 값으로 치환한 *.preview.html을 만든다 (gitignore 대상).
//
// 실행: pnpm build:previews → 프로젝트 루트에서 Live Server 등을 켜고
//       /templates/<이름>.preview.html 열기
import { writeFileSync } from "node:fs";
import { listPatterns, renderPattern } from "../src/templates/index.js";

// 패턴별 데모 값 — 필수 슬롯을 채우기 위한 것
const DEMO_SLOTS: Record<string, Record<string, string>> = {
  "login-id": {
    pageTitle: "로그인",
    serviceName: "서비스명(데모)",
    loginAction: "#demo",
  },
  "apply-detail": {
    pageTitle: "서비스 상세 안내(데모)",
    summary: "서비스에 대한 한 줄 소개가 들어간다.",
  },
  "search-results": {
    pageTitle: "통합검색(데모)",
    searchAction: "#demo",
  },
  "apply-issue": {
    pageTitle: "증명서 발급 신청(데모)",
  },
  "apply-list": {
    pageTitle: "신청 서비스 목록(데모)",
  },
  "board-list": {
    pageTitle: "공지사항(데모)",
  },
  "board-detail": {
    pageTitle: "공지사항(데모)",
    postTitle: "게시글 제목 예시(데모)",
  },
  "sub-page": {
    pageTitle: "서브 페이지(데모)",
    lnbTitle: "분류명(데모)",
  },
  "main-portal": {
    pageTitle: "서비스 포털(데모)",
    heroTitle: "필요한 서비스를 한 곳에서 찾아보세요",
    searchAction: "#demo",
  },
  "login-tabs": {
    pageTitle: "로그인 방식을 선택해주세요",
    serviceName: "서비스명(데모)",
    loginAction: "#demo",
  },
  "apply-form": {
    pageTitle: "신청서 작성(데모)",
  },
  "apply-complete": {
    pageTitle: "신청 완료(데모)",
    serviceName: "주민등록표등본(초본) 교부(데모)",
  },
};

for (const meta of listPatterns()) {
  const slots = {
    // 프리뷰는 templates/ 안에서 열리므로 킷 자산은 한 단계 위의 node_modules
    assetBase: "../node_modules/krds-uiux",
    ...(DEMO_SLOTS[meta.name] ?? { pageTitle: `${meta.title}(데모)` }),
  };
  const r = renderPattern(meta.name, slots);
  if (!r || !r.ok) {
    console.error(`건너뜀: ${meta.name} — 필수 슬롯 데모 값 부족 (DEMO_SLOTS에 추가 필요)`);
    continue;
  }
  const out = `templates/${meta.name}.preview.html`;
  writeFileSync(out, r.result.html);
  console.error(`생성: ${out}`);
}
