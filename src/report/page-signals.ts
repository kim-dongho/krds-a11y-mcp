// 페이지 신호 — axe 밖에서 화면이 조용히 깨진 흔적 (위반이 아니라 페이지 문제로 알린다)
import type { Page } from "playwright";
import type { Target } from "./types.js";

/**
 * 한글 깨짐(모지바케) 흔적 — 깨진 문자(U+FFFD) 또는 UTF-8 한글 바이트를 ISO-8859-1·windows-1252로 읽은 꼴.
 * 한글 UTF-8 첫 바이트(0xEA~0xED)가 ê·ë·ì·í로, 뒤 바이트(0x80~0xBF)가 C1 제어문자·라틴 기호로 보인다.
 * 우연한 일치(프랑스어 ê 등)를 피하려고 2곳 이상일 때만 잡는다. 찾으면 앞뒤 문맥을 돌려준다
 */
export function findMojibake(text: string): string | null {
  const tail = "\u0080-\u00BF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u0192\u02C6\u02DC\u2013\u2014\u2018-\u201E\u2020-\u2022\u2026\u2030\u2039\u203A\u20AC\u2122";
  const pattern = new RegExp(`\uFFFD|[\u00EA-\u00ED][${tail}]{2}`, "g");
  const hits = [...text.matchAll(pattern)];
  if (hits.length < 2) return null;
  const at = hits[0]!.index ?? 0;
  return text.slice(Math.max(0, at - 5), at + 15).replace(/\s+/g, " ").trim();
}

/** 가로 넘침 → 한글 깨짐 순서로 페이지 문제 문구를 돌려준다 */
export async function collectPageSignals(page: Page): Promise<string[]> {
  const issues: string[] = [];
  // 가로 넘침 — 문서가 화면 폭보다 넓으면 레이아웃이 깨졌다는 신호다. 접근성 위반이 아니라 axe가
  // 못 잡는다 (Tailwind contents 클래스 충돌로 본문 상자가 사라져 1280px 밖으로 넘친 화면이
  // 위반 0으로 통과, 실사용 실측). 넓은 표처럼 자체 스크롤 상자 안의 내용은 문서를 넘치지 않는다
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scroll: doc.scrollWidth, view: doc.clientWidth };
  });
  if (overflow.scroll > overflow.view + 1) {
    issues.push(
      `가로 넘침: 문서 폭 ${overflow.scroll}px가 화면 ${overflow.view}px보다 넓다 — 레이아웃 깨짐 신호, 전체 스크린샷을 확인하라`,
    );
  }

  // 한글 깨짐 — jspf가 ISO-8859-1로 읽히면 한글이 "ë¯¼ì›" 꼴로 깨진 채 렌더되는데 axe는 위반 0으로
  // 통과시킨다 (JSP 실사용 실측, 스크린샷 육안이 유일한 안전망이었다)
  const mojibake = findMojibake(await page.evaluate(() => `${document.title}\n${document.body?.innerText ?? ""}`));
  if (mojibake) {
    issues.push(
      `한글 깨짐: "${mojibake}" — 파일 인코딩이 UTF-8로 읽히지 않았다. JSP 조각(jspf)이면 맨 위에 <%@ page pageEncoding="UTF-8" %>를 넣어라`,
    );
  }
  return issues;
}

/** CSS 변수로 킷 스타일 로드를 확인 — 미로드 DOM 검사는 무의미하므로 error 처리 근거 */
export async function checkAssetsLoaded(page: Page, target: Target): Promise<boolean> {
  if (target.kind !== "kit-demo") {
    // 사이트: KRDS 클래스를 쓰는데 킷 토큰이 비어 있으면 킷 CSS가 안 불러진 것 — 스타일 없는 DOM 검사는 무효다
    // (킷 CSS 404인데 위반 0으로 통과하던 문제, 실측). 토큰은 <link>든 번들러 inline이든 똑같이
    // 정의되므로 번들러 프로젝트를 오탐하지 않는다. KRDS를 안 쓰는 화면은 판정하지 않는다
    return page.evaluate(() => {
      if (!document.querySelector('[class*="krds-"]')) return true;
      return getComputedStyle(document.documentElement).getPropertyValue("--krds-box-shadow-outline").trim().length > 0;
    });
  }
  return page.evaluate(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(
      "--krds-box-shadow-outline",
    );
    return v.trim().length > 0 && typeof (window as { Swiper?: unknown }).Swiper !== "undefined";
  });
}
