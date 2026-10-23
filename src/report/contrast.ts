// 명도 대비 실측 — axe가 보류한 color-contrast 노드의 참고값
import type { Page } from "playwright";
import type { AxeFinding } from "./types.js";

/**
 * 비활성 표시 — 킷은 비활성 페이지 이동(.page-navi.disabled)처럼 class로만 표시하는 곳이 있다.
 * :disabled는 fieldset[disabled] 안의 컨트롤처럼 속성 없이 비활성인 경우를 잡는다. 실측·강등 모두 closest로 본다
 */
const INACTIVE_SELECTOR = "[disabled], :disabled, [aria-disabled='true'], .disabled";

/**
 * axe가 보류(incomplete)한 color-contrast 노드의 대비를 직접 잰다.
 * 단색 배경 가정(조상 중 첫 불투명 배경)의 참고값 — 판정이 아니라 사람 확인을 돕는 실측.
 */
export async function measureContrast(
  page: Page,
  selectors: string[],
): Promise<({ fg: string; bg: string; ratio: number; inactive: boolean; certain: boolean } | null)[]> {
  return page.evaluate(({ sels, inactiveSel }: { sels: string[]; inactiveSel: string }) => {
    // 계산 스타일은 rgb() 말고도 oklch()·lab()·color(srgb …)로 온다(Tailwind v4 팔레트, color-mix).
    // rgb()가 아니면 1px 캔버스에 칠해 sRGB로 읽는다. 못 읽으면 null — 호출부가 "확실하지 않음"으로 둔다
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const parse = (c: string): number[] | null => {
      const m = c.match(/^rgba?\((\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)(?:\s*[,/]\s*([\d.]+%?))?\)$/);
      if (m) {
        const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : +m[4];
        return [+m[1]!, +m[2]!, +m[3]!, a];
      }
      if (!ctx || c === "transparent") return c === "transparent" ? [0, 0, 0, 0] : null;
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#010203"; // 표식 — 잘못된 값이면 fillStyle이 바뀌지 않는다
      ctx.fillStyle = c;
      if (ctx.fillStyle === "#010203") return null;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0]!, d[1]!, d[2]!, d[3]! / 255];
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
    };
    const hex = ([r, g, b]: number[]) =>
      "#" + [r!, g!, b!].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
    const INACTIVE = inactiveSel;
    return sels.map((sel) => {
      try {
        const el = document.querySelector(sel);
        if (!el) return null;
        const fg = parse(getComputedStyle(el).color);
        if (!fg || fg[3]! < 1) return null; // 반투명 글자는 단색 가정이 성립하지 않는다
        let node: Element | null = el;
        let bg: number[] | null = null;
        // 배경을 확실히 아는가 — 글자에서 배경색을 준 요소까지 배경 그림·반투명이 없어야 한다.
        // 요소 자신의 작은 반복 없는 아이콘(셀렉트 화살표 등)은 글자 뒤를 덮지 않으니 허용한다
        let certain = true;
        while (node && node !== document.documentElement) {
          const cs = getComputedStyle(node);
          if (parseFloat(cs.opacity) < 1) certain = false;
          if (cs.backgroundImage !== "none") {
            const icon =
              node === el &&
              !cs.backgroundImage.includes("gradient") &&
              cs.backgroundRepeat.split(",").every((r) => r.trim() === "no-repeat") &&
              !/cover|contain|100%/.test(cs.backgroundSize);
            if (!icon) certain = false;
          }
          const c = parse(cs.backgroundColor);
          if (!c) certain = false; // 읽지 못한 배경 — 조상 배경(대개 흰색)으로 잰 값을 위반으로 확정하지 않는다
          else if (c[3]! > 0.99) {
            bg = c;
            break;
          } else if (c[3]! > 0) certain = false; // 반투명 배경은 아래 색과 섞인다
          node = node.parentElement;
        }
        if (!bg) bg = [255, 255, 255, 1];
        const l1 = lum(fg);
        const l2 = lum(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const inactive = !!el.closest(INACTIVE);
        return { fg: hex(fg), bg: hex(bg), ratio: Math.round(ratio * 100) / 100, inactive, certain };
      } catch {
        return null;
      }
    });
  }, { sels: selectors, inactiveSel: INACTIVE_SELECTOR });
}

/** 배경이 확실해도 위반으로 옮기지 않는 보류 사유 — 겹침·가림·의사 요소 등은 실측이 틀릴 수 있다 */
const UNCERTAIN_KEYS = new Set(["bgOverlap", "elmPartiallyObscured", "elmPartiallyObscuring", "pseudoContent", "bgGradient", "fgAlpha", "shadowOnText", "nonBmp", "imgNode"]);

/**
 * 실측으로 미달이 확실한 보류 노드를 color-contrast 위반으로 옮긴다.
 * 리포트가 "실측 3.08:1 미달 — 교정 필요"라고 적으면서 결론은 위반 0이던 모순 — Stop 훅이 막지 못했다
 * (실사용에서 지적). 배경이 확실하지 않으면 지금처럼 확인필요로 둔다
 */
export function promoteCertainContrastFailures(findings: AxeFinding[]): AxeFinding[] {
  const inc = findings.find((f) => f.ruleId === "color-contrast" && f.outcome === "incomplete");
  if (!inc) return findings;
  const need = (n: AxeFinding["nodes"][number]) => parseFloat(n.expected ?? "4.5") || 4.5;
  const fail = inc.nodes.filter(
    (n) =>
      n.measured && n.measuredCertain && !n.inactive && n.measured.ratio < need(n) && !UNCERTAIN_KEYS.has(n.messageKey ?? ""),
  );
  if (fail.length === 0) return findings;
  const moved = fail.map((n) => ({
    ...n,
    summary: `실측 ${n.measured!.ratio}:1 (기준 ${n.expected ?? "4.5:1"}) — 배경이 단색으로 확인돼 위반으로 판정 (글자 ${n.measured!.fg} / 배경 ${n.measured!.bg})`,
  }));
  const rest = inc.nodes.filter((n) => !fail.includes(n));
  const out = findings.flatMap((f) => (f === inc ? (rest.length > 0 ? [{ ...f, nodes: rest }] : []) : [f]));
  const vio = out.find((f) => f.ruleId === "color-contrast" && f.outcome === "violation");
  if (vio) vio.nodes = [...vio.nodes, ...moved].sort((a, b) => a.selector.localeCompare(b.selector));
  else out.push({ ruleId: "color-contrast", outcome: "violation", ...(inc.impact ? { impact: inc.impact } : {}), nodes: moved });
  return out;
}


/**
 * axe가 위반으로 낸 명도 대비 중 비활성 요소를 확인필요로 옮긴다 — KWCAG 5.4.3(WCAG 1.4.3)은 비활성 UI 구성요소를
 * 예외로 둔다. 킷 페이지네이션 첫 쪽의 "이전"(span.disabled, 3.08:1)이 배경이 단색인 화면에서 위반으로 잡혔다
 * (board-list 실측 — 같은 마크업이 다른 템플릿에선 가림 때문에 보류로 빠져 드러나지 않았다).
 * 통과가 아니라 "미달이나 비활성 요소 — 예외 검토"로 남겨 사람이 판정한다
 */
export async function demoteInactiveContrastViolations(page: Page, findings: AxeFinding[]): Promise<AxeFinding[]> {
  const vio = findings.find((f) => f.ruleId === "color-contrast" && f.outcome === "violation");
  if (!vio) return findings;
  const flags = await page.evaluate(
    ({ sels, inactive }) => sels.map((s) => { try { return !!document.querySelector(s)?.closest(inactive); } catch { return false; } }),
    { sels: vio.nodes.map((n) => n.selector), inactive: INACTIVE_SELECTOR },
  );
  const moved = vio.nodes.filter((_, i) => flags[i]);
  if (moved.length === 0) return findings;
  const keep = vio.nodes.filter((_, i) => !flags[i]);
  const out = findings.flatMap((f) => (f === vio ? (keep.length > 0 ? [{ ...f, nodes: keep }] : []) : [f]));
  const inc = out.find((f) => f.ruleId === "color-contrast" && f.outcome === "incomplete");
  if (inc) inc.nodes = [...inc.nodes, ...moved];
  else out.push({ ruleId: "color-contrast", outcome: "incomplete", ...(vio.impact ? { impact: vio.impact } : {}), nodes: moved });
  return out;
}
