// 검사 전 상호작용 — 클릭·키 입력·값 입력 뒤의 상태(모달 열림, 탭 전환, 오류 표시)를 검사한다.
// 지금까지는 초기값을 바꾼 임시 빌드로만 확인할 수 있었다 (실사용 지적).
// 실패하면 던진다 — 러너가 검사 무효(status error)로 기록하고 gate가 막는다. 원하는 상태가 아닌 화면을
// 검사해 통과로 세면 안 되기 때문이다
import type { Page } from "playwright";
import type { PageAction } from "./types.js";

/** 킷 전환(0.4초)이 끝난 뒤 검사하도록 마지막에 기다리는 시간 */
const SETTLE_MS = 450;
const MAX_WAIT_MS = 10_000;

export function describeAction(a: PageAction): string {
  switch (a.type) {
    case "click": return `click ${a.selector}`;
    case "press": return `press ${a.key}${a.selector ? ` @ ${a.selector}` : ""}`;
    case "fill": return `fill ${a.selector} = "${(a.value ?? "").slice(0, 20)}"`;
    case "wait": return a.selector ? `wait ${a.selector}` : `wait ${a.ms ?? 0}ms`;
  }
}

/** 입력 검증 — 실행 전에 빠진 값을 알린다 (도구 응답에서 바로 고치게) */
export function actionError(a: PageAction): string | undefined {
  if ((a.type === "click" || a.type === "fill") && !a.selector) return `${a.type}에는 selector가 필요하다`;
  if (a.type === "fill" && a.value === undefined) return "fill에는 value가 필요하다";
  if (a.type === "press" && !a.key) return "press에는 key가 필요하다 (예: Enter, Escape, ArrowRight)";
  if (a.type === "wait" && !a.selector && a.ms === undefined) return "wait에는 selector(보일 때까지) 또는 ms가 필요하다";
  return undefined;
}

export async function runPageActions(page: Page, actions: PageAction[]): Promise<void> {
  for (const [i, a] of actions.entries()) {
    const fail = (msg: string) => new Error(`상호작용 ${i + 1}번째(${describeAction(a)}) 실패: ${msg}`);
    const invalid = actionError(a);
    if (invalid) throw fail(invalid);
    try {
      const target = a.selector ? page.locator(a.selector).first() : undefined;
      if (a.type === "click") await target!.click();
      else if (a.type === "fill") await target!.fill(a.value!);
      else if (a.type === "press") {
        if (target) await target.focus();
        await page.keyboard.press(a.key!);
      } else if (target) await target.waitFor({ state: "visible" });
      else await page.waitForTimeout(Math.min(a.ms ?? 0, MAX_WAIT_MS));
    } catch (error) {
      throw fail((error instanceof Error ? error.message : String(error)).split("\n")[0]!);
    }
  }
  await page.waitForTimeout(SETTLE_MS);
}
