// 킷 관례 검사 — 부품 재발명·킷 스타일 침범·공통부 누락 등 KRDS 사용 문제
import type { Page } from "playwright";
import { HARMLESS_SAME_NAME, krdsClassNames } from "./krds-classes.js";
import { ICON_PROPS, KIT_SELECTOR_SOURCE, PRESCRIBED_RULES } from "./kit-rules.js";

/** 킷 관례 위반 검출 — 부품 재발명과 킷 스타일 침범은 접근성 보장을 무효화한다 */
export async function collectKitIssues(page: Page): Promise<string[]> {
  const krds = {
    names: krdsClassNames(),
    harmless: [...HARMLESS_SAME_NAME],
    kitSel: KIT_SELECTOR_SOURCE,
    prescribed: PRESCRIBED_RULES,
    iconProps: ICON_PROPS,
  };
  return page.evaluate((krds) => {
    const issues: string[] = [];
    // 1. 킷 외 폼 컨트롤 — krds- 클래스도, krds-* 컨테이너 소속도 아닌 컨트롤
    for (const el of document.querySelectorAll("input:not([type=hidden]),select,textarea,button")) {
      const cls = String((el as HTMLElement).className ?? "");
      if (/krds-/.test(cls)) continue;
      // 킷 공통부는 class가 아니라 id(krds-header·krds-footer)로 식별된다 — 스캐폴드가 준
      // 원형 헤더의 버튼을 "킷 외 컨트롤"로 자기 경고하던 오탐 수정 (실사용 실측).
      // 트레이드오프: 공통부 내부에 소비자가 비킷 컨트롤을 넣어도 면제된다 (공통부는 킷 구조 전제)
      if (el.closest('[class*="krds-"], [id*="krds-"]')) continue;
      // 식별자가 없으면 경고 문구가 전부 같아져 중복 제거에 합쳐진다 — 비킷 컨트롤 3개가
      // "1건"으로 과소 집계되던 버그. id가 없으면 class라도 넣어 구분한다
      const id = el.id ? ` id="${el.id}"` : cls ? ` class="${cls.slice(0, 40)}"` : "";
      issues.push(`킷 외 컨트롤 <${el.tagName.toLowerCase()}${id}> — 부품은 get_component로 받아야 접근성 보장이 따라온다`);
    }
    // 1-0. 위계·크기 없는 맨 krds-btn — 킷 button.html 샘플이 클래스 하나뿐이라 그대로 쓰면 모든 버튼이
    // 큰 기본형이 된다 (Codex JSP 실사용: 표 칸 버튼까지 페이지 주 버튼 크기). 킷도 primary·icon·툴팁처럼
    // 크기 없이 쓰는 형태가 있어 "아무 수식 클래스도 없는 경우"만 잡는다. 크기·위계 선택은 자유다
    const BTN_MODIFIERS = /\b(xsmall|small|medium|large|xlarge|primary|secondary|tertiary|text|link|icon|krds-tooltip)\b/;
    for (const el of document.querySelectorAll(".krds-btn")) {
      const cls = String((el as HTMLElement).className ?? "");
      if (BTN_MODIFIERS.test(cls)) continue;
      const label = ((el as HTMLElement).innerText ?? el.textContent ?? "").trim().slice(0, 20);
      issues.push(
        `버튼 위계·크기 미지정 "${label}" — class가 krds-btn뿐이면 킷 기본(큰) 모양이 된다. 위계(primary·secondary·tertiary·text 등)와 크기(small·medium·large 등)를 골라 붙여라 (get_component button 조립 지침)`,
      );
    }
    // 1-1. 오류 메시지 연결 (kwcag:7.3.1) — 킷 마크업에 aria-describedby가 없어 소비자가 빠뜨린다.
    // 보이는 메시지를 같은 묶음의 컨트롤(또는 fieldset)이 가리키지 않으면 스크린리더는 오류를 모른다.
    // 위반이 아니라 경고 — WCAG가 연결 방식까지 강제하지는 않는다
    for (const hint of document.querySelectorAll(".form-hint-invalid, .file-hint-invalid")) {
      const msg = (hint.textContent ?? "").trim();
      if (!msg || hint.getClientRects().length === 0) continue;
      const scope = hint.closest(".form-group, fieldset, li") ?? hint.parentElement;
      const linked =
        !!hint.id &&
        [...(scope?.querySelectorAll("input,select,textarea,fieldset,[role=group],[role=radiogroup]") ?? []), scope]
          .some((c) => (c?.getAttribute("aria-describedby") ?? "").split(/\s+/).includes(hint.id));
      if (!linked) {
        issues.push(
          `오류 메시지 연결 누락 "${msg.slice(0, 30)}" — 메시지에 id를 주고 컨트롤에 aria-invalid="true"와 aria-describedby로 연결하라 (kwcag:7.3.1, get_component 조립 지침)`,
        );
      }
    }
    // 1-2. 라디오 그룹 이름 (kwcag:7.3.2) — 선택지 레이블만 있고 "무엇을 고르는지"가 없으면 보조기술은 질문을 모른다.
    // 킷의 .fieldset·.krds-check-area는 class뿐인 div라 그대로 쓰면 그룹이 없다 (apply-issue 템플릿 실측).
    // 앞의 제목으로 눈에는 보일 수 있어 위반이 아니라 경고
    const groupName = (el: Element) => {
      const fs = el.closest("fieldset");
      const legend = fs?.querySelector(":scope > legend")?.textContent?.trim();
      if (legend) return true;
      const g = el.closest('[role="radiogroup"], [role="group"]');
      if (!g) return false;
      if (g.getAttribute("aria-label")?.trim()) return true;
      const ids = (g.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
      return ids.some((id) => document.getElementById(id)?.textContent?.trim());
    };
    const radios = new Map<string, Element[]>();
    for (const r of document.querySelectorAll('input[type="radio"][name]')) {
      if (r.getClientRects().length === 0 && !(r as HTMLElement).closest(".krds-form-check")) continue;
      const key = `${r.closest("form") ? "f" : ""}:${(r as HTMLInputElement).name}`;
      radios.set(key, [...(radios.get(key) ?? []), r]);
    }
    for (const [key, group] of radios) {
      if (group.length < 2 || group.every(groupName)) continue;
      issues.push(
        `라디오 그룹 이름 누락 name="${key.split(":")[1]}" (선택지 ${group.length}개) — fieldset·legend 또는 role="radiogroup"과 aria-labelledby(보이는 제목)로 묶어 무엇을 고르는지 알려라 (kwcag:7.3.2, get_component radio_button)`,
      );
    }
    // 1-3. 숨은 legend 안의 필수 표시 — 킷 common.css가 legend를 화면에서 숨겨 "(필수)"를 legend에만 두면
    // 시각 사용자는 필수인지 모른다 (실사용 2세션 실측). 같은 묶음에 보이는 필수 표시가 있으면 괜찮다
    const REQ = /필수|\*/;
    const hidden = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.width <= 1 || r.height <= 1 || !(el as HTMLElement).checkVisibility?.();
    };
    for (const legend of document.querySelectorAll("fieldset > legend")) {
      const t = (legend.textContent ?? "").trim();
      if (!REQ.test(t) || !hidden(legend)) continue;
      const scope = legend.parentElement!.parentElement ?? legend.parentElement!;
      const visibleMark = [...scope.querySelectorAll("*")].some(
        (el) => !legend.contains(el) && el.children.length === 0 && REQ.test(el.textContent ?? "") && !hidden(el),
      );
      if (!visibleMark) {
        issues.push(
          `필수 표시가 화면에 안 보임 "${t.slice(0, 30)}" — 킷 CSS가 legend를 화면에서 숨긴다. 보이는 그룹 제목(class="form-tit" aria-hidden="true")에 같은 글과 필수 표시를 두라 (get_component radio_button·checkbox)`,
        );
      }
    }
    // 1-4. 모달 배치 — 킷은 모달을 열 때 #wrap에 inert를 건다 (ui-script.js L969). 안에 두면 모달 자신이 막히고
    // #wrap이 없으면 배경이 막히지 않는다. 템플릿에 #wrap이 없어 요건과 어긋나던 문제(실사용 3세션)
    const modals = [...document.querySelectorAll(".krds-modal")];
    if (modals.length > 0) {
      const wrap = document.getElementById("wrap");
      if (!wrap) {
        issues.push(
          `모달 배경이 막히지 않음 — 킷 모달은 열 때 #wrap에 inert를 거는데 페이지에 #wrap이 없다. 헤더·본문·푸터를 <div id="wrap">으로 감싸고 모달은 그 밖에 두라 (get_component modal 조립 지침)`,
        );
      }
      for (const m of modals.filter((m) => wrap?.contains(m))) {
        issues.push(
          `모달이 #wrap 안에 있음 id="${m.id}" — 열면 킷이 #wrap에 inert를 걸어 모달 자신이 막힌다(초점·Escape 불가). #wrap 밖(형제)으로 옮겨라 (get_component modal 조립 지침)`,
        );
      }
    }
    // 1-5. hidden인데 보이는 요소 — 킷 CSS의 display가 hidden 속성을 덮는다(form-hint 계열, kit-bugs.md K8).
    // 숨긴 줄 아는 오류 문구가 늘 보이고 보조기술에도 읽힌다
    for (const el of document.querySelectorAll("[hidden]:not([hidden=until-found])")) {
      if (getComputedStyle(el).display === "none" || el.closest("template")) continue;
      const cls = String((el as HTMLElement).className ?? "").trim().split(/\s+/).slice(0, 2).join(" ");
      issues.push(
        `hidden인데 화면에 보임 <${el.tagName.toLowerCase()}${cls ? ` class="${cls}"` : ""}> "${(el.textContent ?? "").trim().slice(0, 30)}" — 킷 CSS의 display가 hidden 속성을 덮는다. 숨길 때는 요소를 렌더하지 않는다 (get_component 폼 조립 지침)`,
      );
    }
    // 2. 커스텀 CSS의 킷 셀렉터 조작 — 템플릿 동봉분(data-krds-a11y)과 킷 파일은 제외
    const KIT_SEL = new RegExp(krds.kitSel);
    // 도구가 처방하는 킷 규칙 — 정의는 kit-rules.ts (침투 검사와 공유)
    const PRESCRIBED_RULES = krds.prescribed;
    const isPrescribedRule = (r: CSSStyleRule) => {
      const allowed = PRESCRIBED_RULES[(r.selectorText ?? "").trim()];
      if (!allowed || r.style.length === 0) return false;
      for (let i = 0; i < r.style.length; i++) if (!allowed.includes(r.style[i]!)) return false;
      return true;
    };
    // 아이콘 경로 버그 교정 성격의 규칙(이미지 선언만 재정의)은 인정된 우회 — 면제
    const ICON_PROPS = new Set(krds.iconProps);
    const isIconFix = (r: CSSStyleRule) => {
      if (r.style.length === 0) return false;
      for (let i = 0; i < r.style.length; i++) {
        if (!ICON_PROPS.has(r.style.item(i))) return false;
      }
      return true;
    };
    const drawsRing = (r: CSSStyleRule) => {
      const o = r.style.outline || r.style.outlineWidth || r.style.outlineStyle;
      if (o && !/none|0/.test(o)) return true;
      if (r.style.boxShadow && r.style.boxShadow !== "none") return true;
      return false;
    };
    const scan = (rules: CSSRuleList, from: string) => {
      for (const r of rules) {
        const anyR = r as CSSStyleRule & { cssRules?: CSSRuleList };
        const sel = anyR.selectorText;
        // 도구가 처방하는 정렬 교정(라벨 없는 체크박스 초점 링 정렬)은 인정 — 면제
        // 처방 규칙(브레드크럼 폭·셀렉트 글자색)도 처방과 같은 셀렉터·같은 속성만이면 면제 — 지침대로 자기 CSS에 넣은
        // 소비자가 경고받던 모순 (템플릿 동봉 스타일은 data-krds-a11y로 이미 면제돼 드러나지 않았다. 렌더 검증에서 실측)
        const isPrescribed =
          /\.krds-form-check\s+label\b/.test(sel ?? "") || isPrescribedRule(anyR);
        if (sel && KIT_SEL.test(sel) && !isIconFix(anyR) && !isPrescribed) {
          issues.push(`커스텀 CSS가 킷 셀렉터를 조작 (${from}): ${sel.slice(0, 80)} — 킷 스타일 덮어쓰기는 교정·대비를 되돌릴 수 있다`);
        }
        // :focus에 초점 링을 그리면서 :focus-visible로 좁히지 않으면 마우스 클릭에도 링이 남는다
        if (sel && /:focus(?![-\w])/.test(sel) && drawsRing(anyR)) {
          issues.push(`초점 링을 :focus로 그린다 (${from}): ${sel.slice(0, 80)} — 마우스 클릭에도 링이 남는다. :focus-visible로 좁히면 키보드 사용자만 링을 본다 (초점 표시는 유지)`);
        }
        if (anyR.cssRules) scan(anyR.cssRules, from);
      }
    };
    for (const sheet of document.styleSheets) {
      const owner = sheet.ownerNode as Element | null;
      if (owner?.getAttribute?.("data-krds-a11y")) continue;
      if (sheet.href && /krds-uiux/.test(sheet.href)) continue;
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      // 킷 CSS 자신이 inline으로 들어온 경우(Vite 등 번들러가 JS import를 <style>로 주입)는
      // 조작이 아니다 — 킷 셀렉터 규칙이 수십 개면 소비자 덮어쓰기(몇 개 수준)가 아니라 킷 본체다
      // (React+Vite 실사용에서 오탐 30건, 2026-10-06). 단 <link> 로드가 여전히 권장 경로다
      let kitRuleCount = 0;
      for (const r of rules) {
        const sel = (r as CSSStyleRule).selectorText;
        if (sel && KIT_SEL.test(sel) && ++kitRuleCount >= 30) break;
      }
      if (kitRuleCount >= 30) continue;
      scan(rules, sheet.href ? sheet.href.split("/").pop()! : "inline <style>");
    }
    // 3. breadcrumb 폭 제한 미적용 — 계산 스타일로 확인 (처방 CSS가 구조와 안 맞으면 조용히 좌측 끝에 붙는다)
    const bcOl = document.querySelector(".krds-breadcrumb-wrap .breadcrumb");
    if (bcOl && !bcOl.closest(".in-between") && getComputedStyle(bcOl).maxWidth === "none") {
      issues.push(
        "breadcrumb 폭 제한이 적용되지 않았다 — 넓은 화면에서 좌측 끝에 붙는다. " +
          "구조 무관 셀렉터로 넣어라: `.krds-breadcrumb-wrap { padding-bottom: 0; } " +
          ".krds-breadcrumb-wrap .breadcrumb { max-width: var(--krds-contents-wrap-size); padding: 0 var(--krds-contents-padding-x); }`",
      );
    }

    // 4. 사이트 공통부 누락 — 완성 페이지(main 있음)인데 머리글·바닥글이 없거나 빈 슬롯.
    // 헤더 부재는 KWCAG 위반이 아니라 axe가 못 잡는다 — 지침만으로는 실사용 최종본에서도
    // 누락됐다 (2026-10-07 세션 감사). 조각(main 없음)과 의도적 생략(no-chrome 마커)은 제외
    const hasContent = (el: Element | null) =>
      !!el && ((el.textContent ?? "").trim() !== "" || el.querySelector("*") !== null);
    if (
      document.querySelector("main, [role=main]") &&
      !document.querySelector('[data-krds-a11y="no-chrome"]')
    ) {
      const banner = document.querySelector("body > header, header#krds-header, [role=banner]");
      const footer = document.querySelector("body > footer, footer#krds-footer, [role=contentinfo]");
      const missing = [!hasContent(banner) && "머리글", !hasContent(footer) && "바닥글"].filter(Boolean);
      if (missing.length > 0) {
        issues.push(
          // 문구 머리는 run-store의 CHROME_MISSING과 같아야 한다 (evaluate 안이라 상수 참조 불가)
          `사이트 공통부 누락(${missing.join("·")}) — get_page_scaffold의 withSiteChrome: true로 조립하라. ` +
            '팝업·인쇄용처럼 일부러 뺀 페이지면 body에 data-krds-a11y="no-chrome"을 붙여라',
        );
      }
    }

    // 5. KRDS 클래스 이름 충돌 — 다른 CSS(Tailwind 등)가 KRDS가 쓰는 클래스 이름에 규칙을 만들었다.
    // Tailwind contents 유틸리티(display:contents)가 템플릿 본문 상자를 없애 레이아웃이 붕괴했는데
    // 위반 0으로 통과했다 (실사용 실측). 시트 단위로 판정한다 — 템플릿 CSS를 복사한 파일처럼
    // 규칙 대부분이 KRDS 이름인 시트는 KRDS 계열이라 건너뛰고, 대부분이 다른 이름인 시트만 본다
    const krdsSet = new Set(krds.names);
    const harmless = new Set(krds.harmless);
    const flatten = (list: CSSRuleList, out: CSSStyleRule[]) => {
      for (const r of list) {
        const anyR = r as CSSStyleRule & { cssRules?: CSSRuleList };
        if (anyR.selectorText) out.push(anyR);
        else if (anyR.cssRules) flatten(anyR.cssRules, out);
      }
      return out;
    };
    for (const sheet of document.styleSheets) {
      const owner = sheet.ownerNode as Element | null;
      if (owner?.getAttribute?.("data-krds-a11y")) continue;
      if (sheet.href && /krds-uiux/.test(sheet.href)) continue;
      let list: CSSRuleList;
      try { list = sheet.cssRules; } catch { continue; }
      const rules = flatten(list, []);
      if (rules.length === 0) continue;
      const usesKrds = (sel: string) =>
        [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].some((m) => krdsSet.has(m[1]!));
      const krdsShare = rules.filter((r) => usesKrds(r.selectorText)).length / rules.length;
      if (krdsShare >= 0.5) continue; // KRDS 계열 시트 (킷·템플릿 CSS 복사본 등)
      const from = sheet.href ? sheet.href.split("/").pop()! : "inline <style>";
      for (const r of rules) {
        const m = r.selectorText.match(/^\.([a-zA-Z][\w-]*)$/);
        if (!m || !krdsSet.has(m[1]!) || harmless.has(m[1]!)) continue;
        // krds-·form-group 등 킷 셀렉터는 2번(셀렉터 조작) 검사가 이미 잡는다 — 같은 규칙을 두 번 세지 않는다
        if (KIT_SEL.test(`.${m[1]}`)) continue;
        issues.push(
          `KRDS 클래스 이름 충돌 (${from}): .${m[1]} — 다른 CSS가 KRDS가 쓰는 클래스 이름에 규칙을 만들어 KRDS 마크업을 덮어쓴다. ` +
            // Tailwind 여부는 CSSOM으로 확실히 알 수 없다 — 접두어 없는 유틸리티 산출물은 규칙만 남고 표식(주석)이
            // 사라진다 (v4.3 실측). 그래서 일반 처방을 먼저, Tailwind 처방은 조건부로 함께 준다
            "자기 CSS의 클래스 이름을 KRDS와 겹치지 않게 바꿔라(예: 사이트 접두어). " +
            'Tailwind라면 테마 import에 접두어를 건다: @import "tailwindcss/theme.css" layer(theme) prefix(tw);',
        );
      }
    }

    return [...new Set(issues)].slice(0, 30);
  }, krds);
}
