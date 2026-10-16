// 도구 입력 정규화 — 모델이 자연스럽게 넘기는 표기를 거부하지 않고 받아준다

/** "button" 도 "krds:button" 으로 받아준다 */
export function normalizeId(input: string): string {
  // 하이픈 표기 별칭 — 모델이 text-input처럼 하이픈으로 부르는 일이 잦다 (JSP 실사용에서
  // 거부 왕복 실측). 킷 id는 언더스코어 표기이므로 접두사 뒤 하이픈을 언더스코어로 받아준다
  const raw = input.startsWith("krds:") ? input.slice("krds:".length) : input;
  return `krds:${raw.replace(/-/g, "_")}`;
}

type Scalar = string | number | boolean; // 불리언: 상태 입력(required·checked)
type InputItem = Record<string, Scalar>;
export type ComponentInputs = Record<string, Scalar | Scalar[] | InputItem[]>;

const isItemArray = (v: unknown): v is InputItem[] =>
  Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "object" && x !== null);

const itemKeys = (items: InputItem[]) => [...new Set(items.flatMap((it) => Object.keys(it)))];

// 모델이 자연스럽게 배열·숫자로 넘기는 입력(headerTexts 등)을 거부하지 않고 문자열로 정규화한다
// (React+Vite 실사용에서 배열 거부 왕복 실측). 배열은 쉼표로 잇는다.
// 객체 배열(crumbs: [{crumbLabel, href}])은 항목의 키를 필드로 펼친다 — 실사용 거부 7건 중 6건.
// 한 항목이라도 비면 그 필드를 빈 값으로 둬 누락 판정이 그대로 잡게 한다
export function normalizeInputs(inputs: ComponentInputs | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const fromItems: Record<string, string> = {};
  for (const [k, v] of Object.entries(inputs ?? {})) {
    if (isItemArray(v)) {
      for (const key of itemKeys(v)) {
        const values = v.map((it) => String(it[key] ?? "").trim());
        fromItems[key] = values.some((x) => !x) ? "" : values.join(", ");
      }
    } else {
      out[k] = Array.isArray(v) ? v.map(String).join(", ") : String(v);
    }
  }
  return { ...fromItems, ...out };
}

/** 객체 배열 입력에서 비어 있는 칸 — 누락 안내에 "몇 번째 항목의 무엇"으로 알려준다 */
export function inputGaps(inputs: ComponentInputs | undefined): string[] {
  const gaps: string[] = [];
  for (const [k, v] of Object.entries(inputs ?? {})) {
    if (!isItemArray(v)) continue;
    const keys = itemKeys(v);
    v.forEach((it, i) => {
      for (const key of keys) {
        if (!String(it[key] ?? "").trim()) gaps.push(`${k} ${i + 1}번째 항목의 ${key}`);
      }
    });
  }
  return gaps;
}

// 매핑표의 필수 입력 칸은 자유 서술형이다 — "labelText, inputId",
// "(id 사용 시) id", "crumbLabel (각 항목 텍스트) + href" 처럼.
// 식별자 토큰을 키로 뽑고, 조건부 표현이 있으면 강제하지 않는다.
const OPTIONAL_HINT = /사용 시|해당 시|필요 시|일 때/;
// 설명 문구에서 키로 오인되는 낱말
const NOT_A_FIELD = new Set(["aria"]);

export function parseFields(field: string): { keys: string[]; optional: boolean } {
  const optional = OPTIONAL_HINT.test(field) || field.trimStart().startsWith("(");
  const cleaned = field.replace(/`[^`]*`/g, " ").replace(/\([^)]*\)/g, " ");
  const keys = [...new Set(cleaned.match(/\b[a-z][A-Za-z0-9]*\b/g) ?? [])].filter(
    (k) => !NOT_A_FIELD.has(k),
  );
  return { keys, optional };
}

// 확인용 입력 — 값이 아니라 "이 구현 의무를 지켰다"는 확인이다. true만 충족으로 본다
// (모델이 "outside-wrap" 같은 문자열을 지어내거나 false를 줘도 통과하던 마찰, 실사용 재지적)
export const CONFIRM_FIELDS: Record<string, string> = {
  modalPlacement: "모달 마크업을 #wrap 밖(형제)에 둔다",
  captionSync: "달력 caption의 \"YYYY년 MM월\"을 표시 월이 바뀔 때 갱신한다",
  sessionExtendAction: "로그인 시간 연장 버튼의 실제 동작과 남은 시간 갱신을 구현한다",
  autoplayControls: "자동 재생 배너에 정지·재생 버튼과 동작을 둔다",
  swiperA11yMessages: "Swiper 접근성 메시지를 한국어로 바꾼다",
  currentStepMarker: "현재 단계 li.active 하나와 그 안의 sr-only \"현재단계\"를 유지한다",
};

const isFilled = (key: string, provided: Record<string, string>) => {
  const v = provided[key]?.trim();
  if (!v) return false;
  return key in CONFIRM_FIELDS ? v === "true" : true;
};

/**
 * 요건 행이 이번 호출(variant)에 걸리는가. scope의 #이름은 변형 이름이고, "기본"은 변형 없는 호출이다.
 * #이름이 없으면 모든 변형에 걸린다
 */
export function scopeApplies(scope: string | undefined, variant: string | undefined): boolean {
  const variants = scope?.match(/#[a-z0-9-]+/g);
  if (!variants) return true;
  if (variant) return variants.includes(`#${variant}`);
  return /기본/.test(scope!);
}

export type Requirement = { kwcagId: string; field: string; rule: string; scope?: string };
export type RequirementCounts = { required: number; variantOnly: number; optional: number };

/** 이번 호출에서 막는 필수 입력 — list_components 개수와 get_component 차단이 같은 기준을 쓴다 */
export function classifyRequirements(rows: Requirement[], variant?: string) {
  const required: Requirement[] = [];
  const variantOnly: Requirement[] = [];
  const optional: Requirement[] = [];
  for (const r of rows) {
    const { keys, optional: opt } = parseFields(r.field);
    if (opt || keys.length === 0) optional.push(r); // 조건부 필드는 막지 않는다
    else if (!scopeApplies(r.scope, variant)) variantOnly.push(r);
    else required.push(r);
  }
  return { required, variantOnly, optional };
}

/** 필수 입력 중 채워지지 않은 행 */
export function missingRequirements(rows: Requirement[], variant: string | undefined, provided: Record<string, string>) {
  return classifyRequirements(rows, variant).required.filter((r) => parseFields(r.field).keys.some((k) => !isFilled(k, provided)));
}
