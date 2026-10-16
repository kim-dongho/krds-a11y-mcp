// 요소 셀렉터 침투 — 킷 클래스 없는 셀렉터(*, body, table td, a:link…)로 쓴 비킷 CSS가 킷 요소를 덮었는가.
// 같은 페이지에서 의심 규칙만 잠깐 빼고 다시 재서(빼고 다시 재기) 차이를 그 규칙 탓으로 본다 — 레이아웃·킷 JS 상태·
// 템플릿 CSS가 그대로라 오탐 요인이 없다. JSP 실사용에서 돋움 폰트가 킷 전체를 덮었는데 아무 검사도 못 잡은 공백
import type { Page } from "playwright";
import { ICON_PROPS, KIT_SELECTOR_SOURCE, PRESCRIBED_RULES } from "./kit-rules.js";

export type IntrusionResult = {
  /** kitIssues에 더할 경고 — 규칙당 한 줄, 영향 요소 많은 순 상위 10 */
  issues: string[];
  /** 측정 실패 사유 — 있으면 pageIssues에 한 줄 */
  failed?: string;
};

type Hit = { selector: string; from: string; props: string[]; elements: number };

/** 비교 속성 — 킷 모양을 이루는 값. margin·width·display는 소비자가 자기 구획 배치로 정당하게 바꾸므로 뺀다 */
const PROPS = [
  "font-family", "font-size", "font-weight", "line-height", "color", "background-color", "text-decoration-line",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "border-top-width", "border-top-style", "border-top-color",
];

/** 셀렉터 유형별 처방 */
export function intrusionAdvice(selector: string): string {
  const s = selector.trim();
  if (/(^|[\s,>+~(])(\*|html|body)(?![\w-])/.test(s)) return "레거시 화면 래퍼 아래로 한정하라 (예: .legacy-wrap *)";
  if (/:(link|visited)\b/.test(s)) return "레거시 영역 링크로 한정하라 (예: .legacy-wrap a:link)";
  if (!/[.#\[]/.test(s)) return "레거시 요소에 클래스를 붙여 한정하라 (예: table.legacy td)";
  return "킷 요소 안까지 내려가지 않게 셀렉터를 좁혀라";
}

export async function collectIntrusions(page: Page): Promise<IntrusionResult> {
  const args = { kitSel: KIT_SELECTOR_SOURCE, prescribed: PRESCRIBED_RULES, iconProps: ICON_PROPS, props: PROPS };
  const raw = await page.evaluate((a) => {
    const KIT_SEL = new RegExp(a.kitSel);
    const ICON = new Set(a.iconProps);
    const INHERITED = new Set(["font-family", "font-size", "font-weight", "line-height", "color"]);
    type Parent = CSSStyleSheet | CSSGroupingRule;
    type Suspect = { parent: Parent; index: number; text: string; selector: string; from: string; declared: Set<string>; spec: number[]; order: number };

    const onlyIn = (r: CSSStyleRule, allowed: string[] | Set<string>) => {
      if (r.style.length === 0) return false;
      const has = (p: string) => (Array.isArray(allowed) ? allowed.includes(p) : allowed.has(p));
      for (let i = 0; i < r.style.length; i++) if (!has(r.style.item(i))) return false;
      return true;
    };
    // 특이성 근사 — [아이디, 클래스·속성·의사 클래스, 태그·의사 요소]
    const specificity = (sel: string): number[] => {
      const s = sel.replace(/::?[\w-]+\([^)]*\)/g, " ").replace(/"[^"]*"|'[^']*'/g, "");
      return [
        (s.match(/#[\w-]+/g) ?? []).length,
        (s.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
        (s.replace(/[.#][\w-]+|\[[^\]]*\]|:+[\w-]+/g, " ").match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length,
      ];
    };

    // 1. 의심 규칙 — 비킷 시트의 스타일 규칙 중 킷 셀렉터·처방·아이콘 교정이 아닌 것 (@media·@supports 안 포함)
    const suspects: Suspect[] = [];
    let order = 0;
    const walk = (list: CSSRuleList, parent: Parent, from: string) => {
      for (let i = 0; i < list.length; i++) {
        const r = list[i]!;
        if (r instanceof CSSStyleRule) {
          order++;
          const sel = r.selectorText ?? "";
          if (!sel || KIT_SEL.test(sel)) continue;
          if (a.prescribed[sel.trim()] && onlyIn(r, a.prescribed[sel.trim()]!)) continue;
          if (onlyIn(r, ICON)) continue;
          const declared = new Set<string>();
          for (let j = 0; j < r.style.length; j++) declared.add(r.style.item(j));
          if (!a.props.some((p) => declared.has(p))) continue;
          suspects.push({ parent, index: i, text: r.cssText, selector: sel, from, declared, spec: specificity(sel), order });
        } else if (r instanceof CSSMediaRule || r instanceof CSSSupportsRule) {
          walk(r.cssRules, r, from);
        }
      }
    };
    for (const sheet of document.styleSheets) {
      const owner = sheet.ownerNode as Element | null;
      if (owner?.getAttribute?.("data-krds-a11y")) continue;
      if (sheet.href && /krds-uiux/.test(sheet.href)) continue;
      let list: CSSRuleList;
      try { list = sheet.cssRules; } catch { continue; }
      walk(list, sheet, sheet.href ? sheet.href.split("/").pop()! : "inline <style>");
    }
    if (suspects.length === 0) return { hits: [] as { selector: string; from: string; props: string[]; elements: number }[], failed: undefined as string | undefined };

    // 2. 킷 요소 (상한 3000)
    const seen = new Set<Element>();
    for (const el of document.querySelectorAll('[class*="krds-"], [class*="krds-"] *, #krds-header *, #krds-footer *, #krds-masthead *')) {
      if (seen.size >= 3000) break;
      seen.add(el);
    }
    const els = [...seen];
    if (els.length === 0) return { hits: [], failed: undefined };
    const measure = () => els.map((el) => { const cs = getComputedStyle(el); return a.props.map((p) => cs.getPropertyValue(p)); });
    // 크롬은 :link·:visited 스타일을 링크 상태와 함께 캐시해, 규칙을 지우거나 시트를 꺼도 링크 색을 다시 계산하지
    // 않는다(실측). 요소를 떼었다 같은 자리에 다시 붙이면 다시 계산된다 — 그런 규칙이 있을 때만, 킷 요소 중 링크에만
    const linkSensitive = suspects.some((s) => /:(link|visited)\b/.test(s.selector));
    const links = linkSensitive ? els.filter((el) => el.matches("a[href], area[href]")) : [];
    const relink = () => {
      for (const el of links) {
        const parent = el.parentNode;
        if (!parent) continue;
        const next = el.nextSibling;
        parent.removeChild(el);
        parent.insertBefore(el, next);
      }
    };

    // 3. 빼고 다시 재기 — 같은 부모 안에서 인덱스 큰 것부터 지우고, 작은 것부터 되돌린다
    const before = measure();
    const byParent = new Map<Parent, Suspect[]>();
    for (const s of suspects) byParent.set(s.parent, [...(byParent.get(s.parent) ?? []), s]);
    for (const [p, list] of byParent) for (const s of [...list].sort((x, y) => y.index - x.index)) p.deleteRule(s.index);
    relink();
    const after = measure();
    for (const [p, list] of byParent) for (const s of [...list].sort((x, y) => x.index - y.index)) p.insertRule(s.text, s.index);
    relink();
    const restored = measure();
    if (JSON.stringify(restored) !== JSON.stringify(before)) {
      return { hits: [], failed: "침투 측정 실패 — 규칙을 되돌린 뒤 계산 스타일이 처음과 달라 결과를 버렸다" };
    }

    // 4. 원인 귀속 — 그 속성을 선언하고 요소(상속 속성이면 조상까지)에 맞는 의심 규칙 중 특이성·순서가 가장 센 것
    const matches = (el: Element, sel: string, inherit: boolean) => {
      try { return inherit ? el.closest(sel) !== null : el.matches(sel); } catch { return false; }
    };
    const stronger = (x: Suspect, y: Suspect) => {
      for (let k = 0; k < 3; k++) if (x.spec[k] !== y.spec[k]) return x.spec[k]! > y.spec[k]! ? x : y;
      return x.order > y.order ? x : y;
    };
    const agg = new Map<Suspect, { props: Set<string>; elements: Set<Element> }>();
    els.forEach((el, i) => {
      a.props.forEach((prop, j) => {
        if (before[i]![j] === after[i]![j]) return;
        let cause: Suspect | undefined;
        for (const s of suspects) {
          if (!s.declared.has(prop) || !matches(el, s.selector, INHERITED.has(prop))) continue;
          cause = cause ? stronger(cause, s) : s;
        }
        if (!cause) return;
        const g = agg.get(cause) ?? { props: new Set<string>(), elements: new Set<Element>() };
        g.props.add(prop);
        g.elements.add(el);
        agg.set(cause, g);
      });
    });
    const hits = [...agg.entries()]
      .map(([s, g]) => ({ selector: s.selector, from: s.from, props: [...g.props], elements: g.elements.size }))
      .sort((x, y) => y.elements - x.elements)
      .slice(0, 10);
    return { hits, failed: undefined };
  }, args);

  return {
    issues: raw.hits.map(
      (h: Hit) =>
        `레거시 CSS가 킷 스타일을 덮음 (${h.from}): ${h.selector} { ${h.props.join(", ")} } — 킷 요소 ${h.elements}개. ${intrusionAdvice(h.selector)}`,
    ),
    ...(raw.failed ? { failed: raw.failed } : {}),
  };
}
