export { judge, type GateResult, type ScreenVerdict, type Staleness } from "./judge.js";
export { formatHuman, parseGateArgs, runGateCli, USAGE, type GateCliArgs } from "./cli.js";
export {
  parseStopHookArgs,
  runStopHook,
  runStopHookCli,
  STOP_HOOK_USAGE,
  type StopHookArgs,
} from "./stop-hook.js";
export {
  extractPatchPaths,
  judgeHookInput,
  judgeToolUse,
  PRETOOL_HOOK_USAGE,
  runPretoolHookCli,
  type PretoolVerdict,
} from "./pretool-hook.js";
export { hookRoot, isInside, projectRoot } from "./project-root.js";
