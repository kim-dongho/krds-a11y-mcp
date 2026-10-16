// 비가시 렌더 — DOM에 있고 보조기술이 읽는데 화면에는 그려지지 않은 조작 요소를 전체 스크린샷 픽셀로 찾는다.
// axe는 DOM·계산 스타일만 봐서 아이콘 교정 버그로 셀렉트가 통째로 잘렸을 때 위반 0으로 통과시켰다.
// 원인별 규칙 대신 결과(픽셀)를 본다 — 처음 보는 원인도 놓치지 않게. 스크린샷을 같은 페이지 캔버스에 그려 읽으므로 의존성 추가 없음
import type { Page } from "playwright";

export type InvisibleControl = {
  /** 문구용 — <select id="rv"> */
  tag: string;
  /** 접근 가능한 이름 근사, 30자 */
  label: string;
  /** 원인 짐작 */
  cause: string;
};

export function invisibleIssue(c: InvisibleControl): string {
  return `비가시 렌더: ${c.tag}${c.label ? ` "${c.label}"` : ""} — 화면에 그려지지 않는다 (추정: ${c.cause}). 보조기술은 읽지만 시각 사용자는 쓸 수 없다`;
}

export async function findInvisibleControls(page: Page, fullPng: Buffer, missing: string[]): Promise<InvisibleControl[]> {
  return page.evaluate(
    async ({ png, missing }) => {
      const CAP = 400;
      const MAX_H = 16384;
      // 1. 후보 — 화면에 보여야 하는 조작 요소. 킷 체크·라디오·토글은 기본 input을 1×1로 숨기고 레이블이 모양을 그린다(실측)
      type Cand = { el: Element; box: Element; proxy: boolean };
      const cands: Cand[] = [];
      const sel = "button, a[href], select, textarea, input:not([type=hidden])";
      for (const el of document.querySelectorAll(sel)) {
        if (cands.length >= CAP) break;
        if (el.closest("[aria-hidden='true'], [inert]")) continue;
        const input = el as HTMLInputElement;
        const isCheck = el.tagName === "INPUT" && (input.type === "checkbox" || input.type === "radio");
        let box: Element = el;
        let proxy = false;
        const r0 = el.getBoundingClientRect();
        if (isCheck && (r0.width <= 2 || r0.height <= 2)) {
          const label = (input.id && document.querySelector(`label[for="${CSS.escape(input.id)}"]`)) || el.closest("label");
          if (!label) continue;
          box = label;
          proxy = true;
        }
        cands.push({ el, box, proxy });
      }

      // 2. 원래 안 보이는 것 제외 — 표시 안 함·sr-only·문서 밖·스크롤 상자에 절반 넘게 잘림
      const docW = document.documentElement.scrollWidth;
      const docH = document.documentElement.scrollHeight;
      const visibleArea = (box: Element) => {
        const r = box.getBoundingClientRect();
        if (r.width <= 2 || r.height <= 2) return null;
        let { left, top, right, bottom } = { left: r.left + scrollX, top: r.top + scrollY, right: r.right + scrollX, bottom: r.bottom + scrollY };
        if (right <= 0 || bottom <= 0 || left >= docW || top >= docH) return null;
        const full = (right - left) * (bottom - top);
        for (let p = box.parentElement; p && p !== document.documentElement; p = p.parentElement) {
          const cs = getComputedStyle(p);
          if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
          const q = p.getBoundingClientRect();
          left = Math.max(left, q.left + scrollX); top = Math.max(top, q.top + scrollY);
          right = Math.min(right, q.right + scrollX); bottom = Math.min(bottom, q.bottom + scrollY);
          if (right <= left || bottom <= top) return null;
        }
        if ((right - left) * (bottom - top) < full / 2) return null;
        return { left, top, right, bottom };
      };

      // 3. 픽셀 — 스크린샷을 캔버스에 그려 영역 표본의 색 가짓수(채널 5비트 양자화)를 센다
      const img = new Image();
      img.src = `data:image/png;base64,${png}`;
      try { await img.decode(); } catch { return []; }
      const scale = img.width / docW;
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = Math.min(img.height, MAX_H);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return [];
      ctx.drawImage(img, 0, 0);
      const flat = (a: { left: number; top: number; right: number; bottom: number }) => {
        const x = Math.round(a.left * scale), y = Math.round(a.top * scale);
        const w = Math.max(1, Math.round((a.right - a.left) * scale)), h = Math.max(1, Math.round((a.bottom - a.top) * scale));
        if (y + h > canvas.height) return false; // 캔버스 한도 밖은 판정하지 않는다
        const d = ctx.getImageData(x, y, w, h).data;
        const first = `${d[0]! >> 3},${d[1]! >> 3},${d[2]! >> 3}`;
        for (let i = 0; i < d.length; i += 4 * 3) if (`${d[i]! >> 3},${d[i + 1]! >> 3},${d[i + 2]! >> 3}` !== first) return false;
        return true;
      };

      // 4. 원인 짐작 — 첫 번째 일치
      const parse = (c: string) => c.match(/[\d.]+/g)?.map(Number) ?? [];
      const bgOf = (el: Element) => {
        for (let n: Element | null = el; n; n = n.parentElement) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c.length >= 3 && (c[3] ?? 1) > 0.99) return c.slice(0, 3).join(",");
        }
        return "255,255,255";
      };
      const up = (el: Element, n: number) => { const out: Element[] = []; for (let p: Element | null = el; p && out.length <= n; p = p.parentElement) out.push(p); return out; };
      const urls = (el: Element) => [null, "::before", "::after"].flatMap((ps) => {
        const cs = getComputedStyle(el, ps);
        return [cs.backgroundImage, cs.maskImage, (cs as unknown as { webkitMaskImage?: string }).webkitMaskImage ?? ""].join(" ").match(/url\("?([^")]+)"?\)/g) ?? [];
      }).map((u) => u.replace(/^url\("?|"?\)$/g, ""));
      const causeOf = (el: Element) => {
        const cs = getComputedStyle(el);
        const mask = cs.maskImage || (cs as unknown as { webkitMaskImage?: string }).webkitMaskImage || "none";
        if (mask !== "none") return "요소 자체에 mask-image가 걸려 통째로 잘림";
        if (up(el, 3).some((n) => getComputedStyle(n).clipPath !== "none")) return "clip-path로 잘림";
        if (up(el, 3).some((n) => parseFloat(getComputedStyle(n).opacity) < 0.1)) return "투명(opacity)";
        const text = ((el as HTMLElement).innerText ?? "").trim();
        if (text && parse(cs.color).slice(0, 3).join(",") === bgOf(el)) return "글자색과 배경색이 같음";
        if (!text && urls(el).some((u) => missing.some((m) => m === u || m.endsWith(u.replace(/^.*?(\/resources\/)/, "$1"))))) return "아이콘 이미지 404";
        return "원인 미상 — 덮는 요소·색을 확인";
      };
      const nameOf = (el: Element) => {
        const t = ((el as HTMLElement).innerText ?? "").trim() || el.getAttribute("aria-label") || el.getAttribute("title") || "";
        if (t) return t.replace(/\s+/g, " ").slice(0, 30);
        const id = (el as HTMLElement).id;
        const lab = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
        return ((lab as HTMLElement | null)?.innerText ?? "").trim().slice(0, 30);
      };

      const out: { tag: string; label: string; cause: string }[] = [];
      for (const c of cands) {
        if (!c.el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }) && !c.proxy) continue;
        if (c.proxy && !c.box.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })) continue;
        const area = visibleArea(c.box);
        if (!area || !flat(area)) continue;
        const el = c.el as HTMLElement;
        const tag = `<${el.tagName.toLowerCase()}${el.id ? ` id="${el.id}"` : el.className ? ` class="${String(el.className).slice(0, 30)}"` : ""}>`;
        out.push({ tag, label: nameOf(c.el), cause: causeOf(c.proxy ? c.box : c.el) });
      }
      return out;
    },
    { png: fullPng.toString("base64"), missing },
  );
}
