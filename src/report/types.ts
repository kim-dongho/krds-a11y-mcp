// 리포트 생성기 자료구조

export type Target = {
  id: string; // "kit:button" | "site:main"
  kind: "kit-demo" | "site";
  url: string; // file:// 또는 https://
  componentId?: string; // kit-demo일 때 "krds:button"
  variant?: "as-is" | "sample-removed";
  /** 검사 전에 실행할 상호작용 — 상태 화면(모달 열림·오류 표시) 검사용 */
  actions?: PageAction[];
};

/** 검사 전 상호작용 한 단계 — 실제 클릭·키 입력 */
export type PageAction = {
  type: "click" | "press" | "fill" | "wait";
  /** click·fill은 필수. press는 먼저 초점을 줄 요소, wait는 보일 때까지 기다릴 요소 */
  selector?: string;
  /** press — Enter, Escape, ArrowRight, Tab 등 */
  key?: string;
  /** fill */
  value?: string;
  /** wait — selector가 없을 때 기다릴 시간(최대 10초) */
  ms?: number;
};

export type RuleSet = "baseline" | "baseline+experimental";

export type EngineMeta = {
  axeVersion: string;
  ruleSet: RuleSet;
  assetsLoaded: boolean; // false면 결과 무효 (CSS/JS 미로드 상태의 DOM)
  /** 키보드 검사를 돌렸을 때만 — 실제 Tab 정지 횟수와 종료 사유 */
  keyboard?: { stops: number; end: "body" | "cycle" | "cap" };
};

export type AxeNode = {
  selector: string;
  summary: string;
  /** axe 검사의 세부 사유 키 (예: pseudoContent, elmPartiallyObscured) — incomplete 해석용 */
  messageKey?: string;
  /** axe가 요구한 기준 대비 (예: "4.5:1") */
  expected?: string;
  /** 러너가 직접 잰 대비 — 단색 배경 가정의 참고값이지 판정이 아니다 */
  measured?: { fg: string; bg: string; ratio: number };
  /** 실측의 배경을 확실히 안다 — 글자 뒤가 단색이고 배경 그림·반투명이 없다(요소 자신의 작은 반복 없는 아이콘만 허용) */
  measuredCertain?: boolean;
  /** 비활성 표시 요소(disabled 속성·aria-disabled·킷 .disabled 클래스) — 5.4.3 예외 검토 대상 */
  inactive?: boolean;
};

export type Outcome = "violation" | "incomplete" | "pass" | "inapplicable";

export type AxeFinding = {
  ruleId: string;
  outcome: Outcome;
  impact?: string;
  nodes: AxeNode[];
  /** 어느 대상(target.id)에서 검출됐는가 — translate가 집계할 때 부착 */
  targetId?: string;
};

export type ScanResult =
  | {
      target: Target;
      status: "ok";
      scannedAt: string;
      engine: EngineMeta;
      findings: AxeFinding[];
      /** screenshotDir 옵션을 준 경우 — 눈 확인용 뷰포트 캡처 (position:fixed 정확) */
      screenshotPath?: string;
      /** 폴드 아래까지 담는 전체 페이지 캡처 (fixed 요소는 왜곡될 수 있음) */
      fullScreenshotPath?: string;
      /** 로드 실패 리소스(4xx/5xx·네트워크 실패)와 콘솔·페이지 에러 — axe 밖의 품질 신호 */
      pageIssues?: string[];
      /** 킷 관례 위반 — 비킷 폼 컨트롤, 킷 셀렉터를 조작하는 커스텀 CSS (kitConventions 옵션) */
      kitIssues?: string[];
    }
  | { target: Target; status: "error"; scannedAt: string; reason: string };

export type Coverage = "full" | "partial" | "none";

export type Grade =
  | "violation" // 위반 확정
  | "needs-review" // axe incomplete — 사람 확인 필요
  | "auto-pass" // 규칙 통과 (partial이면 caveat 필수)
  | "not-applicable" // 규칙은 있으나 해당 요소 없음 / 규칙 미실행
  | "not-tested"; // 커버리지 none — 자동 검사 수단 자체가 없음

export type ItemVerdict = {
  kwcagId: string;
  name: string;
  principle: "인식" | "운용" | "이해" | "견고";
  coverage: Coverage;
  grade: Grade;
  caveat?: string; // partial + auto-pass → "형식 요건 통과, 내용 미검증"
  evidence: AxeFinding[];
};

export type ManualCheck = {
  kwcagId: string;
  name: string;
  reason: "none" | "needs-review";
  how: string;
};

export type Report = {
  meta: {
    targets: Target[];
    scannedAt: string;
    engine: EngineMeta;
    errors: ScanResult[];
  };
  items: ItemVerdict[]; // 항상 33개, kwcagId 오름차순
  outOfMap: AxeFinding[]; // 매핑 밖 규칙 = "참고"
  manualChecklist: ManualCheck[];
};
