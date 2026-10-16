// 동적 위젯 키보드 조작 — Tab 순회로는 못 보는 위젯 키 동작을 실제 키 입력으로 확인한다.
// 탭(화살표로 다른 탭에 가는가), 모달(열면 초점이 안으로·Escape로 닫힘·초점 복귀·초점 가두기),
// 펼침 트리거(Enter·Space로 aria-expanded가 바뀌는가, 팝업은 Escape로 닫히는가).
// 킷 클래스가 아니라 ARIA 역할로 찾는다 — 자작 위젯도 같은 기준. 페이지 상태를 바꾸므로 다른 검사가 모두 끝난 뒤에 부른다.
// 키보드로 갈 방법이 없을 때만 위반(6.1.1), 키 패턴(Escape·초점 이동)은 권고라 판정 보류(6.1.2)
import type { Page } from "playwright";
import type { AxeFinding, AxeNode } from "./types.js";

export type WidgetKeyboardOptions = {
  /** 키 사이 전환 대기 — 킷 전환 0.4초 */
  settleMs?: number;
  caps?: { tablists?: number; modals?: number; expanders?: number };
};

type Collected = {
  tablists: { tabs: string[]; selected: number }[];
  modals: string[];
  expanders: { id: string; popup: boolean }[];
};

const ATTR = "data-krds-a11y-w";

export async function runWidgetKeyboard(page: Page, opts: WidgetKeyboardOptions = {}): Promise<AxeFinding[]> {
  const settle = opts.settleMs ?? 450;
  const caps = { tablists: 5, modals: 5, expanders: 10, ...opts.caps };
  const at = (id: string) => page.locator(`[${ATTR}="${id}"]`).first();
  const wait = () => page.waitForTimeout(settle);

  // 1. 위젯 수집 — 표식을 붙여 키 입력 뒤 DOM이 바뀌어도 같은 요소를 다시 찾는다
  const found: Collected = await page.evaluate(({ attr, caps }) => {
    let n = 0;
    const mark = (el: Element) => {
      const existing = el.getAttribute(attr);
      if (existing) return existing;
      const id = String(n++);
      el.setAttribute(attr, id);
      return id;
    };
    // inert 안은 뺀다 — 모달이 열린 상태 화면(validate_page actions)에서 킷이 배경 #wrap에 건 inert는 의도된 차단이다.
    // 배경 GNB를 "열 수 없음"으로, 이미 열린 모달의 트리거를 "다시 열리지 않음"으로 잡던 오탐 (JSP 실사용)
    const shown = (el: Element) => {
      if (el.closest("[inert]")) return false;
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2 && el.checkVisibility({ visibilityProperty: true });
    };
    const FOCUSABLE = "button, a[href], input, select, textarea, [tabindex]";
    const focusTarget = (tab: Element) => (tab.matches(FOCUSABLE) ? tab : tab.querySelector(FOCUSABLE));

    // 탭 목록 — role=tab을 감싸는 tablist(없으면 부모) 단위
    const groups = new Map<Element, Element[]>();
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      const key = tab.closest('[role="tablist"]') ?? tab.parentElement;
      if (key) groups.set(key, [...(groups.get(key) ?? []), tab]);
    }
    const tablists: Collected["tablists"] = [];
    for (const tabs of groups.values()) {
      if (tablists.length >= caps.tablists) break;
      const visible = tabs.filter(shown);
      const targets = visible.map(focusTarget).filter((t): t is Element => t !== null);
      if (targets.length < 2) continue;
      let selected = visible.findIndex((t) => t.getAttribute("aria-selected") === "true" || t.classList.contains("active"));
      if (selected < 0) selected = 0;
      tablists.push({ tabs: targets.map(mark), selected });
    }

    // 모달 트리거 — Enter로 아무 대화상자도 안 열리면 나중에 건너뛴다
    const dialogIds = new Set([...document.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog')].map((d) => d.id).filter(Boolean));
    const modalTriggers = [...document.querySelectorAll('[aria-haspopup="dialog"], [aria-controls], .open-modal[data-target]')].filter((el) => {
      if (!shown(el)) return false;
      if (el.matches('[aria-haspopup="dialog"], .open-modal[data-target]')) return true;
      return (el.getAttribute("aria-controls") ?? "").split(/\s+/).some((id) => dialogIds.has(id));
    });
    const modals = modalTriggers.slice(0, caps.modals).map(mark);
    const modalSet = new Set(modalTriggers);

    // 펼침 트리거 — 모달 트리거·탭 제외. 실제 주소로 가는 링크는 Enter가 페이지를 옮기므로 뺀다
    const expanders: Collected["expanders"] = [];
    for (const el of document.querySelectorAll('[aria-expanded]')) {
      if (expanders.length >= caps.expanders) break;
      if (modalSet.has(el) || el.matches('[role="tab"]') || !shown(el)) continue;
      if (!el.matches('button, [role="button"], a')) continue;
      const href = el.getAttribute("href");
      if (el.tagName === "A" && href && href !== "#" && !href.startsWith("javascript:")) continue;
      const popup = el.getAttribute("aria-haspopup");
      expanders.push({ id: mark(el), popup: !!popup && popup !== "false" && popup !== "dialog" });
    }
    return { tablists, modals, expanders };
  }, { attr: ATTR, caps });

  const describe = (id: string) =>
    at(id).evaluate((el) => {
      const tag = el.tagName.toLowerCase();
      const cls = String((el as HTMLElement).className ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2).map((c) => `.${c}`).join("");
      const name = ((el as HTMLElement).innerText ?? el.getAttribute("aria-label") ?? "").trim().replace(/\s+/g, " ").slice(0, 20);
      return { selector: el.id ? `#${el.id}` : `${tag}${cls}`, name };
    });
  const activeMark = () => page.evaluate((attr) => document.activeElement?.getAttribute(attr) ?? null, ATTR);

  const unreachable: AxeNode[] = [];
  const review: Record<string, AxeNode[]> = { "kbd-modal-focus": [], "kbd-modal-escape": [], "kbd-modal-return": [], "kbd-modal-trap": [], "kbd-popup-escape": [] };
  let checkedReach = false;
  let checkedModal = false;
  let checkedPopup = false;

  // 2. 탭 — 화살표로 다른 탭에 가는가. 못 가도 다른 탭이 Tab 대상이면 쓸 수 있으니 통과
  for (const list of found.tablists) {
    try {
      checkedReach = true;
      const start = list.tabs[list.selected]!;
      await at(start).focus();
      await page.keyboard.press("ArrowRight");
      await wait();
      const now = await activeMark();
      if (now && now !== start && list.tabs.includes(now)) continue;
      const othersTabbable = await page.evaluate(
        ({ attr, ids, start }) => ids.filter((id) => id !== start).every((id) => {
          const el = document.querySelector(`[${attr}="${id}"]`) as HTMLElement | null;
          return !!el && el.tabIndex >= 0;
        }),
        { attr: ATTR, ids: list.tabs, start },
      );
      if (othersTabbable) continue;
      const d = await describe(start);
      unreachable.push({ selector: d.selector, summary: `탭 "${d.name}"에서 → 를 눌러도 다른 탭으로 가지 않고, 다른 탭은 Tab 순회에서 빠져 있다 — 키보드로 다른 탭을 열 수 없다` });
    } catch { /* 이 위젯만 건너뛴다 */ }
  }

  // 3. 펼침 트리거 — Enter(안 되면 Space)로 aria-expanded가 바뀌는가, 팝업은 Escape로 닫히는가
  const expanded = (id: string) => at(id).getAttribute("aria-expanded");
  for (const ex of found.expanders) {
    try {
      checkedReach = true;
      const before = await expanded(ex.id);
      await at(ex.id).focus();
      await page.keyboard.press("Enter");
      await wait();
      let after = await expanded(ex.id);
      let key = "Enter";
      if (after === before) {
        await at(ex.id).focus();
        await page.keyboard.press(" ");
        await wait();
        after = await expanded(ex.id);
        key = " ";
      }
      const d = await describe(ex.id);
      if (after === before) {
        unreachable.push({ selector: d.selector, summary: `"${d.name}"에서 Enter·Space를 눌러도 aria-expanded가 바뀌지 않는다 — 키보드로 펼칠 수 없다` });
        continue;
      }
      if (ex.popup && after === "true") {
        checkedPopup = true;
        await page.keyboard.press("Escape");
        await wait();
        if ((await expanded(ex.id)) === "true") {
          review["kbd-popup-escape"]!.push({ selector: d.selector, summary: `"${d.name}" 팝업이 Escape로 닫히지 않는다` });
        }
      }
      if ((await expanded(ex.id)) !== before) {
        await at(ex.id).focus();
        await page.keyboard.press(key);
        await wait();
      }
    } catch { /* 이 위젯만 건너뛴다 */ }
  }

  // 4. 모달 — 맨 마지막(닫지 못하면 배경이 inert로 남아 다른 위젯 검사가 오염된다)
  const openDialog = () =>
    page.evaluate((attr) => {
      const d = [...document.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog')].find(
        (el) => el.checkVisibility({ visibilityProperty: true }) && el.getBoundingClientRect().width > 2,
      );
      if (!d) return null;
      if (!d.getAttribute(attr)) d.setAttribute(attr, `d${Math.random().toString(36).slice(2, 8)}`);
      return d.getAttribute(attr);
    }, ATTR);
  const focusInside = (dialog: string) =>
    page.evaluate(({ attr, dialog }) => !!document.querySelector(`[${attr}="${dialog}"]`)?.contains(document.activeElement), { attr: ATTR, dialog });
  const forceClose = async (dialog: string) => {
    await page.evaluate(({ attr, dialog }) => {
      const d = document.querySelector(`[${attr}="${dialog}"]`);
      const close = d?.querySelector<HTMLElement>('.close-modal, [aria-label*="닫기"], button[title*="닫기"]') ??
        [...(d?.querySelectorAll<HTMLElement>("button") ?? [])].find((b) => b.innerText.includes("닫기"));
      close?.click();
    }, { attr: ATTR, dialog });
    await wait();
    return (await openDialog()) === null;
  };
  for (const trigger of found.modals) {
    try {
      await at(trigger).focus();
      await page.keyboard.press("Enter");
      await wait();
      const dialog = await openDialog();
      if (!dialog) continue; // 모달을 여는 트리거가 아니다
      checkedModal = true;
      const d = await describe(trigger);
      if (!(await focusInside(dialog))) {
        review["kbd-modal-focus"]!.push({ selector: d.selector, summary: `"${d.name}"로 연 대화상자에 초점이 들어가지 않는다` });
      }
      // Escape는 열자마자 — 킷 모달의 첫 키 한 번만 동작하는 결함(K1)에 걸리지 않게
      await page.keyboard.press("Escape");
      await wait();
      if ((await openDialog()) !== null) {
        review["kbd-modal-escape"]!.push({ selector: d.selector, summary: `"${d.name}"로 연 대화상자가 Escape로 닫히지 않는다` });
        if (!(await forceClose(dialog))) break; // 닫지 못하면 이후 검사를 멈춘다
      } else if ((await activeMark()) !== trigger) {
        review["kbd-modal-return"]!.push({ selector: d.selector, summary: `"${d.name}"로 연 대화상자를 닫아도 초점이 연 버튼으로 돌아오지 않는다` });
      }
      // 초점 가두기 — 다시 열고 Tab 5번
      await at(trigger).focus();
      await page.keyboard.press("Enter");
      await wait();
      const again = await openDialog();
      if (!again) continue;
      let leaked = false;
      for (let i = 0; i < 5 && !leaked; i++) {
        await page.keyboard.press("Tab");
        leaked = !(await focusInside(again));
      }
      if (leaked) review["kbd-modal-trap"]!.push({ selector: d.selector, summary: `"${d.name}"로 연 대화상자가 열린 동안 Tab이 대화상자 밖으로 나간다` });
      if (!(await forceClose(again))) {
        await page.keyboard.press("Escape");
        await wait();
        if ((await openDialog()) !== null) break;
      }
    } catch { /* 이 위젯만 건너뛴다 */ }
  }

  await page.evaluate((attr) => document.querySelectorAll(`[${attr}]`).forEach((el) => el.removeAttribute(attr)), ATTR);

  // 5. 결과 — 키보드 검사와 같은 형식. 검사한 위젯이 있는데 문제가 없으면 pass, 위젯이 없으면 아무것도 내지 않는다
  const out: AxeFinding[] = [];
  const emit = (ruleId: string, checked: boolean, outcome: "violation" | "incomplete", nodes: AxeNode[]) => {
    if (!checked) return;
    out.push(nodes.length > 0 ? { ruleId, outcome, impact: "serious", nodes } : { ruleId, outcome: "pass", nodes: [] });
  };
  emit("kbd-widget-unreachable", checkedReach, "violation", unreachable);
  for (const r of ["kbd-modal-focus", "kbd-modal-escape", "kbd-modal-return", "kbd-modal-trap"]) emit(r, checkedModal, "incomplete", review[r]!);
  emit("kbd-popup-escape", checkedPopup, "incomplete", review["kbd-popup-escape"]!);
  return out;
}
