#!/usr/bin/env node
export {};
const [, , command, ...rest] = process.argv;

if (command === "gate") {
  const { runGateCli } = await import("./gate/index.js");
  process.exit(runGateCli(rest));
} else if (command === "stop-hook") {
  const { runStopHookCli } = await import("./gate/index.js");
  process.exit(await runStopHookCli(rest));
} else if (command === "pretool-hook") {
  const { runPretoolHookCli } = await import("./gate/index.js");
  process.exit(await runPretoolHookCli(rest));
} else if (command === "init") {
  const { runInitCli } = await import("./init/index.js");
  process.exit(runInitCli(rest));
} else if (command !== undefined) {
  // 모르는 서브커맨드가 조용히 서버 모드(stdin 대기)로 빠지지 않게 명시 거부
  console.error(`모르는 명령: ${command}\n\n사용법: krds-a11y-mcp [init | gate | stop-hook | pretool-hook] [옵션]\n인자 없이 실행하면 MCP 서버(stdio)로 기동한다.`);
  process.exit(64);
} else {
  // stdio 전송 모드: stdout은 MCP 프로토콜 전용이므로 로그는 stderr로만 쓴다
  const { startServer } = await import("./server/index.js");
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
