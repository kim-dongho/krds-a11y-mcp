// 3층 리포트 생성기 (PoC). 파이프라인: kit-targets/URL → runner(브라우저) → translate(순수) → render(순수).
// MCP 서버 번들(src/index.ts)은 이 레이어를 import하지 않는다 — playwright는 devDependency로 격리.
export type * from "./types.js";
export { kitTargets, componentIdOf } from "./kit-targets.js";
export { scanTargets, type RunnerOptions } from "./runner.js";
export { runKeyboardChecks, type KeyboardOptions } from "./keyboard.js";
export { actionError, describeAction } from "./page-actions.js";
export { translate } from "./translate.js";
export { render } from "./render.js";
