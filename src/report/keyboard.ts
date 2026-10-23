// 키보드 검사 — axe가 원리상 판정하지 못하는 키보드 동작을 실제 Tab 키로 실측한다.
// 결과는 axe 결과와 같은 형식(AxeFinding)이라 KWCAG 번역·리포트·gate 집계가 그대로 동작한다.
//
// 스크립트 focus()가 아니라 실제 Tab 키를 쓰는 이유: 마우스 상호작용 뒤 스크립트 초점에서는
// :focus-visible이 꺼져, 우리 지침대로 :focus-visible로 링을 그린 페이지를 "초점 안 보임"으로
// 오탐한다 (2026-10-12 실측). 실제 Tab은 진짜 Tab 순서도 함께 준다.
import type { Page } from "playwright";
import type { AxeFinding, AxeNode } from "./types.js";

export type KeyboardOptions = {
  /** Tab 순회 상한 — 넘으면 kbd-tab-order 판정 보류 (기본 300) */
  maxStops?: number;
};

type StopRecord = { reason: "ok" | "body" | "cycle" | "skip" };

/** 브라우저 안에서 쓰는 보조 함수들을 window에 심는다 (evaluate는 바깥 함수를 못 본다) */
const INSTALL_HELPERS = `(() => {
  window.__name = window.__name || ((fn) => fn);
  // 외곽선·테두리 색의 기본값은 currentColor라, 그려지지 않는 선의 색은 글자색 변화에 끌려 바뀐다.
  // 실제로 그려질 때만 색을 비교해야 "글자색만 바뀜"을 강한 표시로 오판하지 않는다
  const style = (el, pseudo) => {
    const s = getComputedStyle(el, pseudo || null);
    const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 ? [s.outlineStyle, s.outlineWidth, s.outlineColor].join(" ") : "none";
    const borderW = ["Top", "Right", "Bottom", "Left"].map((d) => parseFloat(s["border" + d + "Width"]) || 0);
    const border = borderW.some((w) => w > 0) ? [borderW.join(","), s.borderStyle, s.borderColor].join(" ") : "none";
    return [outline, s.boxShadow, border, s.backgroundColor].join("|");
  };
  const weak = (el) => {
    const s = getComputedStyle(el);
    return [s.color, s.textDecorationLine, s.textDecorationColor].join("|");
  };
  // 입력을 숨기고 라벨·부모에 링을 그리는 패턴(커스텀 체크박스 등)을 위해 대리 요소도 본다
  const proxyOf = (el) => (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) || el.closest("label") || el.parentElement;
  const visuallyHidden = (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return Number(s.opacity) < 0.1 || r.width <= 1 || r.height <= 1 || s.clipPath !== "none" || (s.clip && s.clip !== "auto");
  };
  const snap = (el) => {
    const p = proxyOf(el);
    return {
      strong: [style(el), style(el, "::before"), style(el, "::after")].join("#"),
      proxy: p ? [style(p), style(p, "::before"), style(p, "::after")].join("#") : "",
      weak: weak(el),
    };
  };
  const selectorOf = (el) => {
    if (el.id) return "#" + CSS.escape(el.id);
    const parts = [];
    let cur = el;
    while (cur && cur !== document.body && parts.length < 6) {
      if (cur.id) { parts.unshift("#" + CSS.escape(cur.id)); break; }
      const tag = cur.tagName.toLowerCase();
      const cls = cur.classList[0] ? "." + CSS.escape(cur.classList[0]) : "";
      const same = cur.parentElement ? [...cur.parentElement.children].filter((c) => c.tagName === cur.tagName) : [];
      const nth = same.length > 1 ? ":nth-of-type(" + (same.indexOf(cur) + 1) + ")" : "";
      parts.unshift(tag + cls + nth);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  };
  window.__kbdHelpers = { snap, selectorOf, visuallyHidden };
})()`;

/**
 * 실제 Tab 키 순회로 키보드 검사 3종(초점 가시성·도달성·Tab 순서)을 실행해
 * axe 결과와 같은 형식으로 돌려준다. 끝나면 초점을 풀어 스크린샷이 오염되지 않게 한다.
 */
export async function runKeyboardChecks(page: Page, opts: KeyboardOptions = {}): Promise<AxeFinding[]> {
  return (await runKeyboard(page, opts)).findings;
}

export type KeyboardRun = {
  findings: AxeFinding[];
  /** 실제 Tab 정지 횟수 */
  stops: number;
  /** 종료 사유 — body(화면 끝) · cycle(순환) · cap(상한) */
  end: "body" | "cycle" | "cap";
};

/** runKeyboardChecks + 수행 통계 (리포트의 "키보드 검사: 실제 Tab 순회 N회"용) */
export async function runKeyboard(page: Page, opts: KeyboardOptions = {}): Promise<KeyboardRun> {
  const maxStops = opts.maxStops ?? 300;
  await page.evaluate(INSTALL_HELPERS);
  // 전환·애니메이션을 끄고 검사한다. 킷은 *:focus에 전환 0초를 줘 링을 즉시 띄우지만, 초점이 빠질 때는
  // 기본 전환(0.4초)으로 천천히 지운다 — 그 사이 찍힌 스크린샷에 가짜 초점 링이 남았다 (실측).
  // 덤으로 소비자 CSS가 초점 링에 전환을 걸어도 전환 도중 값이 아니라 최종 상태로 판정한다
  const noMotion = await page.addStyleTag({
    content: "*,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}",
  });
  await noMotion.evaluate((el) => (el as Element).setAttribute("data-krds-a11y", "kbd-probe"));

  // 1. 기준 스냅숏 — 초점 없는 상태에서 보이는 조작 요소 전부
  await page.evaluate(() => {
    const w = window as unknown as Record<string, any>;
    const h = w.__kbdHelpers;
    (document.activeElement as HTMLElement | null)?.blur?.();
    const els = [
      ...document.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ].filter((el) => {
      if (el instanceof HTMLInputElement && el.type === "hidden") return false;
      if (el.matches(":disabled, [disabled]") || el.closest("[inert]")) return false;
      // 닫힌 details 안(summary 제외)은 펼치기 전엔 보이지 않는다 — 크기로는 보이는 것처럼 잡힌다 (실측)
      const closed = el.closest("details:not([open])");
      if (closed && !el.closest("summary")) return false;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
    });
    // 클릭 전용 요소 — onclick·버튼/링크 역할이 있는데 초점을 못 받는다 (div onclick 등 레거시 최다 패턴).
    // React·Vue 이벤트 처리기는 속성으로 남지 않아 못 잡는다 (정직한 범위)
    const clickOnly = [
      ...document.querySelectorAll<HTMLElement>("[onclick], [role=button], [role=link], [role=tab], [role=menuitem]"),
    ].filter((el) => {
      if (el.matches('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')) return false;
      if (el.matches(":disabled, [disabled], [aria-disabled=true]") || el.closest("[inert], details:not([open])")) return false;
      // 초점 요소 안의 장식 요소(버튼 안 span 등)는 부모가 키보드로 동작한다
      if (el.parentElement?.closest('a[href], button, [tabindex]:not([tabindex="-1"])')) return false;
      // 초점 가능한 자식이 있으면 키보드로 같은 동작에 닿을 수 있다 — 킷 탭 li[role=tab] > button,
      // 게시판 tr onclick > a[href], 이벤트 위임 래퍼가 그렇다 (오탐 실측)
      if (el.querySelector('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')) return false;
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
    });
    w.__kbd = { els, clickOnly, base: els.map((el) => h.snap(el)), stops: [] as number[], seen: new Set<Element>() };
    // Tab 출발점을 문서 처음으로 — 페이지가 중간 요소에 자동 초점을 주면(로그인 폼 등) blur해도 브라우저가
    // 다음 Tab 출발점을 그 요소로 기억해, 앞쪽 요소(건너뛰기 링크·로고)를 "못 닿음"으로 오판했다
    // (실사용 실측). Tab 정지점이 아닌 표식(tabindex -1)에 초점을 두고 시작한다
    const start = document.createElement("span");
    start.tabIndex = -1;
    start.setAttribute("data-krds-a11y", "kbd-start");
    document.body.prepend(start);
    start.focus();
    w.__kbdStart = start;
  });

  // 2. 실제 Tab 순회
  let end: "body" | "cycle" | "cap" = "cap";
  for (let i = 0; i < maxStops; i++) {
    await page.keyboard.press("Tab");
    const r: StopRecord = await page.evaluate(() => {
      const w = window as unknown as Record<string, any>;
      const k = w.__kbd;
      const a = document.activeElement as HTMLElement | null;
      if (!a || a === document.body || a === document.documentElement) return { reason: "body" as const };
      // iframe·섀도 DOM 안에서는 바깥 activeElement가 그대로라 같은 요소가 반복된다 — 함정이 아니다
      if (a.tagName === "IFRAME" || a.shadowRoot?.activeElement) return { reason: "skip" as const };
      if (k.seen.has(a)) return { reason: "cycle" as const };
      k.seen.add(a);
      const idx = k.els.indexOf(a);
      if (idx >= 0) {
        k.stops.push(idx);
        k.after = k.after ?? {};
        k.after[idx] = w.__kbdHelpers.snap(a);
      }
      return { reason: "ok" as const };
    });
    if (r.reason === "body" || r.reason === "cycle") {
      end = r.reason;
      break;
    }
  }

  // 3. 판정
  const verdict = await page.evaluate((endReason) => {
    const w = window as unknown as Record<string, any>;
    const k = w.__kbd;
    const h = w.__kbdHelpers;
    const els: HTMLElement[] = k.els;
    const stops: number[] = k.stops;
    const reached = new Set(stops);

    const focusViolation: { selector: string; summary: string }[] = [];
    const focusReview: { selector: string; summary: string }[] = [];
    for (const idx of stops) {
      const el = els[idx]!;
      const base = k.base[idx];
      const after = k.after[idx];
      const changed = after.strong !== base.strong || after.proxy !== base.proxy;
      if (changed) continue;
      const sel = h.selectorOf(el);
      if (h.visuallyHidden(el)) {
        focusReview.push({ selector: sel, summary: "화면에 숨긴 요소라 초점 표시를 자동 판정할 수 없다 — 초점 시 보이는 부분(라벨 등)을 눈으로 확인" });
      } else if (after.weak !== base.weak) {
        focusReview.push({ selector: sel, summary: "초점 시 글자색·밑줄만 바뀐다 — 외곽선 없이도 충분히 구분되는지 눈으로 확인" });
      } else {
        focusViolation.push({ selector: sel, summary: "초점을 받아도 외곽선·그림자·테두리·배경 변화가 없다" });
      }
    }

    // 도달성 — 라디오는 그룹당 한 번만 Tab이 멈추므로 그룹 단위로 센다
    const reachedRadioGroups = new Set(
      stops.map((i) => els[i]!).filter((e) => e instanceof HTMLInputElement && e.type === "radio").map((e) => (e as HTMLInputElement).name),
    );
    const unreached: { selector: string; summary: string }[] = [];
    if (endReason === "cap") {
      // 상한에서 멈추면 도달성을 판정할 수 없다 — 통과로 내면 거짓 보증이다 (실측)
      unreached.push({ selector: "body", summary: "조작 요소가 많아 Tab 순회가 상한에서 멈춰 도달성을 검사하지 못했다" });
    } else {
      els.forEach((el, i) => {
        if (reached.has(i)) return;
        if (el instanceof HTMLInputElement && el.type === "radio" && el.name && reachedRadioGroups.has(el.name)) return;
        // 화살표 키로 옮기는 위젯(roving tabindex)은 그룹에서 하나만 Tab 정지점이다 — 같은 그룹의
        // 다른 요소에 Tab이 닿았으면 나머지는 화살표로 닿는다 (탭 목록·메뉴·툴바 등, APG 관례)
        const group = el.closest(
          "[role=tablist],[role=menubar],[role=menu],[role=toolbar],[role=listbox],[role=radiogroup],[role=tree],[role=grid],[role=treegrid]",
        );
        if (group && [...(k.seen as Set<Element>)].some((e) => e !== el && group.contains(e))) return;
        unreached.push({ selector: h.selectorOf(el), summary: "보이는 조작 요소인데 Tab 순회에서 한 번도 초점을 받지 못했다" });
      });
    }

    for (const el of k.clickOnly as HTMLElement[]) {
      unreached.push({ selector: h.selectorOf(el), summary: "클릭 동작이 있지만 키보드 초점을 받지 못한다 — 마우스로만 쓸 수 있다" });
    }

    const order: { selector: string; summary: string }[] = [];
    els.filter((el) => el.tabIndex > 0).forEach((el) =>
      order.push({ selector: h.selectorOf(el), summary: `양수 tabindex(${el.tabIndex}) — Tab 순서가 DOM 순서와 어긋날 수 있다` }),
    );
    if (endReason === "cycle") {
      order.push({ selector: "body", summary: "화면 전체를 돌기 전에 초점이 순환한다 — 빠져나올 수 없는 구간(키보드 함정)인지 확인" });
    }
    if (endReason === "cap") {
      order.push({ selector: "body", summary: "조작 요소가 많아 Tab 순회가 상한에서 멈췄다 — 상한 이후 요소의 도달성·초점 표시는 검사하지 못했다" });
    }

    (document.activeElement as HTMLElement | null)?.blur?.();
    (w.__kbdStart as HTMLElement | undefined)?.remove();
    delete w.__kbdStart;
    delete w.__kbd;
    return { focusViolation, focusReview, unreached, order, total: els.length, stops: stops.length };
  }, end);

  const node = (n: { selector: string; summary: string }): AxeNode => ({ selector: n.selector, summary: n.summary });
  const findings: AxeFinding[] = [];
  const emit = (ruleId: string, violation: AxeNode[], review: AxeNode[], impact: string) => {
    if (violation.length > 0) findings.push({ ruleId, outcome: "violation", impact, nodes: violation });
    if (review.length > 0) findings.push({ ruleId, outcome: "incomplete", impact, nodes: review });
    if (violation.length === 0 && review.length === 0) findings.push({ ruleId, outcome: "pass", nodes: [] });
  };
  emit("kbd-focus-visible", verdict.focusViolation.map(node), verdict.focusReview.map(node), "serious");
  emit("kbd-reachable", [], verdict.unreached.map(node), "serious");
  emit("kbd-tab-order", [], verdict.order.map(node), "moderate");
  // 초점은 판정 단계에서 이미 풀었다 — 전환이 꺼진 상태에서 풀렸으므로 잔상 없이 기준 스타일로 돌아와 있다
  await noMotion.evaluate((el) => (el as Element).remove());
  return { findings, stops: verdict.stops, end };
}
