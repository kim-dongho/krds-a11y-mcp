# 의존성 보안 보고서

검사일: 2026-11-21 18:03:07 (Asia/Seoul)

검사 대상: pnpm-lock.yaml의 전체 의존성(개발 및 선택적 의존성 포함).
알려진 보안 권고와 버전 일치 여부를 검사하며, 실제 악용 가능성이나 소스 코드 전체의 안전성을 보증하지 않는다.

## 이 PR에서 변경한 내용

**변경 파일**

- package.json
- pnpm-workspace.yaml
- pnpm-lock.yaml
- docs/security/dependency-report.md

**패키지 버전 변경** (잠금 파일 기준, 하위 의존성 포함)

| 패키지 | 기본 브랜치 버전 | PR 브랜치 버전 |
| --- | --- | --- |
| @emnapi/core | 없음 | 2.0.0-beta.2 |
| @emnapi/runtime | 없음 | 2.0.0-beta.2 |
| @emnapi/wasi-threads | 없음 | 2.2.0 |
| @hono/node-server | 2.1.1 | 2.1.11 |
| @modelcontextprotocol/sdk | 1.30.0 | 1.32.2 |
| @napi-rs/wasm-runtime | 없음 | 1.2.6 |
| @oxc-project/types | 0.148.0 | 0.156.0 |
| @rolldown/binding-android-arm-eabi | 1.2.7 | 1.2.19 |
| @rolldown/binding-android-arm64 | 1.2.7 | 1.2.19 |
| @rolldown/binding-darwin-arm64 | 1.2.7 | 1.2.19 |
| @rolldown/binding-darwin-x64 | 1.2.7 | 1.2.19 |
| @rolldown/binding-freebsd-x64 | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-arm-gnueabihf | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-arm64-gnu | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-arm64-musl | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-ppc64-gnu | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-s390x-gnu | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-x64-gnu | 1.2.7 | 1.2.19 |
| @rolldown/binding-linux-x64-musl | 1.2.7 | 1.2.19 |
| @rolldown/binding-openharmony-arm64 | 1.2.7 | 1.2.19 |
| @rolldown/binding-wasm32-wasi | 없음 | 1.2.19 |
| @rolldown/binding-win32-arm64-msvc | 1.2.7 | 1.2.19 |
| @rolldown/binding-win32-x64-msvc | 1.2.7 | 1.2.19 |
| @rolldown/pluginutils | 1.0.1 | 1.1.1 |
| @tybys/wasm-util | 없음 | 0.10.5 |
| @vitest/mocker | 5.0.0 | 5.1.1 |
| @vitest/spy | 5.0.0 | 5.1.1 |
| body-parser | 2.3.0 | 2.4.0 |
| fast-uri | 3.1.7 | 3.1.9 |
| hono | 4.13.7 | 4.13.19 |
| ip-address | 10.7.0 | 10.7.6 |
| magic-string | 0.30.21, 1.2.3 | 0.30.21, 1.2.3, 1.4.5 |
| nanoid | 3.3.18 | 3.3.20 |
| postcss | 8.5.28 | 8.5.33 |
| proxy-addr | 2.0.7 | 2.0.8 |
| qs | 6.16.0 | 6.17.1 |
| rolldown | 1.2.7 | 1.2.19 |
| source-map-js | 1.2.1 | 1.2.4 |
| tslib | 없음 | 2.9.1 |
| vite | 8.2.2 | 8.3.8 |
| zod | 4.5.4 | 4.6.7 |

## 기본 브랜치 검사 결과 (PR 변경 적용 전)

| Critical | High | Moderate | Low | Info |
| --- | --- | --- | --- | --- |
| 1 | 8 | 23 | 5 | 0 |

## PR 변경 적용 후 검사 결과 (기본 브랜치 미반영)

아래 수치는 PR 브랜치에 수정 내용을 적용한 결과다. 기본 브랜치에는 사용자가 PR을 머지할 때 반영된다.

| Critical | High | Moderate | Low | Info |
| --- | --- | --- | --- | --- |
| 0 | 0 | 0 | 1 | 0 |

## 이 PR에서 해소된 보안 권고

| 심각도 | 패키지 | 보안 권고 |
| --- | --- | --- |
| moderate | fast-uri | GHSA-hrr3-gc8f-f4qj: fast-uri vulnerable to inconsistent host case normalization via percent-encoded octets |
| moderate | ip-address | GHSA-j6r3-76f7-8jcv: ip-address: isInSubnet() and isHostInSubnet() compare addresses of different families as if they shared an address space, allowing an allowlist check to admit an address outside its range |
| moderate | ip-address | GHSA-h3mg-xc3c-68pw: ip-address: Address6 builds a parse diagnostic proportional to the input with no length bound, allowing a single long string to stall or crash the process |
| high | source-map-js | GHSA-68fv-2mgg-jv7q: source-map-js allows event-loop denial of service through indexed source-map section offsets |
| critical | proxy-addr | GHSA-jqcg-44mw-7w3h: proxy-addr vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet |
| high | @modelcontextprotocol/sdk | GHSA-6qxp-vccf-f47h: MCP TypeScript SDK: OAuth client could send credentials to an authorization server chosen by the MCP server |
| moderate | hono | GHSA-5r4p-p66f-jhc7: Hono: `serveStatic` decodes the request path a second time, leading to bypass of middleware on static paths |
| moderate | vite | GHSA-698v-4r3x-3vcv: launch-editor: escapeCmdArgs() omits % escaping on Windows |
| high | @modelcontextprotocol/sdk | GHSA-22jm-h49p-29qw: MCP TypeScript SDK: Experimental tasks were not tied to the session that created them |
| high | @modelcontextprotocol/sdk | GHSA-46jr-4wx8-v453: MCP TypeScript SDK: One HTTP request within the default size limit could exhaust server memory during validation |
| moderate | vite | GHSA-r825-w8mm-5pxw: launch-editor: Editor CLI flag misinterpretation causing arbitrary command execution for some editors |
| high | vite | GHSA-587h-7wmj-h5pm: launch-editor: `fs.existsSync()` existence check can be bypassed on Windows |
| moderate | @modelcontextprotocol/sdk | GHSA-rvq5-wwqv-78pq: MCP TypeScript SDK: Server bearer authentication accepted tokens issued for another service |
| low | vite | GHSA-9jrq-w75r-8gcw: Vite: Cross origin script execution through Vite custom middleware |
| moderate | vite | GHSA-rq7h-c2jc-7f22: Vite: Files outside `server.fs.allow` could be served when project paths match system paths on non-Windows machine |
| moderate | vite | GHSA-vfpm-58rq-9qcg: Vite: First 4 bytes of files outside of `server.fs` setting is exposed by `?vite-wasm-instance` |
| moderate | @vitest/mocker | GHSA-qxg6-89mg-rqv8: Vitest: Code injection via unauthenticated manual mock registration |
| moderate | @vitest/mocker | GHSA-xp26-3454-mjgp: Vitest: Windows backslash traversal bypasses the @vitest/mocker redirect allowlist fix |
| moderate | ip-address | GHSA-rxp7-6hxx-x8q5: ip-address: Address6 matches a zone identifier in quadratic time ahead of its length limit, allowing a single long string to stall the process |
| high | zod | GHSA-mrhx-c7xc-m3w5: Zod can exhaust memory while validating oversized constrained collections |
| high | body-parser | GHSA-27r3-jxmh-p828: body-parser vulnerable to Denial of Service via trailing bytes after a compressed request body |
| moderate | fast-uri | GHSA-w74x-v6f9-j3xg: fast-uri vulnerable to URI scheme spoofing via percent-encoded scheme decoding |
| low | fast-uri | GHSA-xhq7-xmqj-769h: fast-uri vulnerable to improper path equivalence in relative reference normalization |
| moderate | fast-uri | GHSA-wjr9-j795-jxcr: fast-uri vulnerable to host confusion via unchecked WHATWG host canonicalization |
| low | fast-uri | GHSA-333x-w4r6-6crp: fast-uri vulnerable to scheme injection via an unescaped first-segment colon in suffix references |
| high | @modelcontextprotocol/sdk | GHSA-f897-62hf-6gxq: MCP TypeScript SDK: HTTP server transports and handlers did not limit request body size or JSON-RPC batch length |
| moderate | @hono/node-server | GHSA-rmxm-3fg6-px4f: @hono/node-server: `serveStatic` decodes the request path a second time, leading to bypass of middleware on static paths |
| moderate | qs | GHSA-6pq8-jhm2-2vcw: qs : qs.stringify with arrayFormat 'comma' throws an uncaught TypeError on array elements carrying a non-callable own toString (DoS) |
| moderate | @modelcontextprotocol/sdk | GHSA-6prh-2h8m-c8cw: MCP TypeScript client SDK: HTTP client transports and OAuth requests followed cross-origin redirects and re-sent custom headers and request bodies |
| moderate | @hono/node-server | GHSA-qv5m-9pm6-hqp3: @hono/node-server: Unhandled `ECONNRESET` on the socket during an asynchronous WebSocket upgrade crashes the process |
| moderate | @hono/node-server | GHSA-jpvv-r467-5p4w: @hono/node-server: Backslash in the request path is parsed as a path separator, bypassing path-based access control at a reverse proxy |
| moderate | hono | GHSA-4m76-xfj5-7975: Hono: `mount()` and `app.mount()` can forward a path that bypasses middleware scoped inside the mount prefix |
| moderate | hono | GHSA-h7mg-cq63-vhpq: Hono: RegExpRouter skips wildcard middleware for some route sets and for paths with an encoded line terminator |
| low | hono | GHSA-3gg2-335m-rxc6: Hono: `css` helper does not escape a closing tag split between the template and an interpolated value, allowing HTML injection |
| moderate | hono | GHSA-46wx-v44x-9hh2: Hono: `csrf()` does not check requests sent by hyperlink auditing (`text/ping`) |
| moderate | hono | GHSA-4h7h-rv7c-7m2v: Hono: `validator('form')` skips validation for `multipart/form-data` requests with extra parameters |

## PR 변경 효과

Critical・High・Moderate(중간) 보안 권고에 대해 의존성 갱신과 pnpm overrides로 자동 수정을 시도했다.
이하 취약점 목록은 PR 변경 적용 후 재검사 결과이며, 남은 항목은 수동 검토가 필요하다.

| 심각도 | 기본 브랜치 (적용 전) | PR 브랜치 (적용 후) |
| --- | --- | --- |
| critical | 1 | 0 |
| high | 8 | 0 |
| moderate | 23 | 0 |
| low | 5 | 1 |
| info | 0 | 0 |

## low: esbuild

esbuild allows arbitrary file read when running the development server on Windows

- 영향 버전: &gt;=0.27.3 &lt;0.28.1
- 수정 버전: &gt;=0.28.1
- 설치 버전: 0.27.7
- 보안 권고: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- 의존성 경로:
  - .&gt;tsup&gt;bundle-require&gt;esbuild
  - .&gt;tsup&gt;esbuild
  - .&gt;vite&gt;esbuild
  - .&gt;vitest&gt;@vitest/mocker&gt;vite&gt;esbuild
  - .&gt;vitest&gt;vite&gt;esbuild
