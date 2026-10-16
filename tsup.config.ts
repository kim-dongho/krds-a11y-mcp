import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  // validate_page가 호출 시점에 동적 로드하는 검사 스택 — 번들하지 않는다.
  // 소비자 환경에 없으면 도구가 설치 안내를 반환한다 (src/server/validate.ts).
  external: ["playwright", "playwright-core", "@axe-core/playwright"],
});
