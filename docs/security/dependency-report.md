# 의존성 보안 보고서

검사일: 2026-11-21 (Asia/Seoul)

검사 대상: pnpm-lock.yaml의 전체 의존성(개발 및 선택적 의존성 포함).
알려진 보안 권고와 버전 일치 여부를 검사하며, 실제 악용 가능성이나 소스 코드 전체의 안전성을 보증하지 않는다.

| Critical | High | Moderate | Low | Info |
| --- | --- | --- | --- | --- |
| 1 | 8 | 23 | 5 | 0 |

## critical: proxy-addr

proxy-addr vulnerable to IP spoofing via IPv4-mapped IPv6 trust subnet

- 영향 버전: &gt;=1.1.0 &lt;2.0.8
- 수정 버전: &gt;=2.0.8
- 설치 버전: 2.0.7
- 보안 권고: https://github.com/advisories/GHSA-jqcg-44mw-7w3h
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;express&gt;proxy-addr
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;express&gt;proxy-addr

## high: @modelcontextprotocol/sdk

MCP TypeScript SDK: OAuth client could send credentials to an authorization server chosen by the MCP server

- 영향 버전: &gt;=1.12.0 &lt;1.31.0
- 수정 버전: &gt;=1.31.0
- 설치 버전: 1.30.0
- 보안 권고: https://github.com/advisories/GHSA-6qxp-vccf-f47h
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk

## high: @modelcontextprotocol/sdk

MCP TypeScript SDK: Experimental tasks were not tied to the session that created them

- 영향 버전: &gt;=1.24.0 &lt;1.32.0
- 수정 버전: &gt;=1.32.0
- 설치 버전: 1.30.0
- 보안 권고: https://github.com/advisories/GHSA-22jm-h49p-29qw
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk

## high: @modelcontextprotocol/sdk

MCP TypeScript SDK: One HTTP request within the default size limit could exhaust server memory during validation

- 영향 버전: &gt;=1.3.0 &lt;1.32.0
- 수정 버전: &gt;=1.32.0
- 설치 버전: 1.30.0
- 보안 권고: https://github.com/advisories/GHSA-46jr-4wx8-v453
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk

## high: @modelcontextprotocol/sdk

MCP TypeScript SDK: HTTP server transports and handlers did not limit request body size or JSON-RPC batch length

- 영향 버전: &gt;=1.10.0 &lt;1.30.1
- 수정 버전: &gt;=1.30.1
- 설치 버전: 1.30.0
- 보안 권고: https://github.com/advisories/GHSA-f897-62hf-6gxq
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk

## high: body-parser

body-parser vulnerable to Denial of Service via trailing bytes after a compressed request body

- 영향 버전: &gt;=2.0.0 &lt;2.4.0
- 수정 버전: &gt;=2.4.0
- 설치 버전: 2.3.0
- 보안 권고: https://github.com/advisories/GHSA-27r3-jxmh-p828
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;express&gt;body-parser
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;express&gt;body-parser

## high: source-map-js

source-map-js allows event-loop denial of service through indexed source-map section offsets

- 영향 버전: &gt;=1.0.0 &lt;1.2.2
- 수정 버전: &gt;=1.2.2
- 설치 버전: 1.2.1
- 보안 권고: https://github.com/advisories/GHSA-68fv-2mgg-jv7q
- 의존성 경로:
  - .&gt;tsup&gt;postcss-load-config&gt;postcss&gt;source-map-js
  - .&gt;tsup&gt;postcss&gt;source-map-js
  - .&gt;vitest&gt;@vitest/mocker&gt;vite&gt;postcss&gt;source-map-js
  - .&gt;vitest&gt;vite&gt;postcss&gt;source-map-js

## high: vite

launch-editor: `fs.existsSync()` existence check can be bypassed on Windows

- 영향 버전: &gt;=8.2.0 &lt;=8.2.3
- 수정 버전: &gt;=8.2.4
- 설치 버전: 8.2.2
- 보안 권고: https://github.com/advisories/GHSA-587h-7wmj-h5pm
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker&gt;vite
  - .&gt;vitest&gt;vite

## high: zod

Zod can exhaust memory while validating oversized constrained collections

- 영향 버전: &lt;4.6.6
- 수정 버전: &gt;=4.6.6
- 설치 버전: 4.5.4
- 보안 권고: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;zod
  - .&gt;@modelcontextprotocol/sdk&gt;zod-to-json-schema&gt;zod
  - .&gt;zod

## moderate: @hono/node-server

@hono/node-server: `serveStatic` decodes the request path a second time, leading to bypass of middleware on static paths

- 영향 버전: &gt;=1.19.10 &lt;2.1.3
- 수정 버전: &gt;=2.1.3
- 설치 버전: 2.1.1
- 보안 권고: https://github.com/advisories/GHSA-rmxm-3fg6-px4f
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server

## moderate: @hono/node-server

@hono/node-server: Unhandled `ECONNRESET` on the socket during an asynchronous WebSocket upgrade crashes the process

- 영향 버전: &gt;=2.0.0 &lt;2.1.6
- 수정 버전: &gt;=2.1.6
- 설치 버전: 2.1.1
- 보안 권고: https://github.com/advisories/GHSA-qv5m-9pm6-hqp3
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server

## moderate: @hono/node-server

@hono/node-server: Backslash in the request path is parsed as a path separator, bypassing path-based access control at a reverse proxy

- 영향 버전: &gt;=2.0.0 &lt;2.1.6
- 수정 버전: &gt;=2.1.6
- 설치 버전: 2.1.1
- 보안 권고: https://github.com/advisories/GHSA-jpvv-r467-5p4w
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server

## moderate: @modelcontextprotocol/sdk

MCP TypeScript SDK: Server bearer authentication accepted tokens issued for another service

- 영향 버전: &gt;=1.6.0 &lt;1.32.0
- 수정 버전: &gt;=1.32.0
- 설치 버전: 1.30.0
- 보안 권고: https://github.com/advisories/GHSA-rvq5-wwqv-78pq
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk

## moderate: @modelcontextprotocol/sdk

MCP TypeScript client SDK: HTTP client transports and OAuth requests followed cross-origin redirects and re-sent custom headers and request bodies

- 영향 버전: &lt;1.32.0
- 수정 버전: &gt;=1.32.0
- 설치 버전: 1.30.0
- 보안 권고: https://github.com/advisories/GHSA-6prh-2h8m-c8cw
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk

## moderate: @vitest/mocker

Vitest: Code injection via unauthenticated manual mock registration

- 영향 버전: &gt;=5.0.0-beta.1 &lt;5.0.3
- 수정 버전: &gt;=5.0.3
- 설치 버전: 5.0.0
- 보안 권고: https://github.com/advisories/GHSA-qxg6-89mg-rqv8
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker

## moderate: @vitest/mocker

Vitest: Windows backslash traversal bypasses the @vitest/mocker redirect allowlist fix

- 영향 버전: &gt;=5.0.0-rc.2 &lt;5.0.3
- 수정 버전: &gt;=5.0.3
- 설치 버전: 5.0.0
- 보안 권고: https://github.com/advisories/GHSA-xp26-3454-mjgp
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker

## moderate: fast-uri

fast-uri vulnerable to inconsistent host case normalization via percent-encoded octets

- 영향 버전: &gt;=3.0.0 &lt;3.1.8
- 수정 버전: &gt;=3.1.8
- 설치 버전: 3.1.7
- 보안 권고: https://github.com/advisories/GHSA-hrr3-gc8f-f4qj
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;ajv&gt;fast-uri
  - .&gt;@modelcontextprotocol/sdk&gt;ajv-formats&gt;ajv&gt;fast-uri

## moderate: fast-uri

fast-uri vulnerable to URI scheme spoofing via percent-encoded scheme decoding

- 영향 버전: &gt;=3.0.0 &lt;3.1.9
- 수정 버전: &gt;=3.1.9
- 설치 버전: 3.1.7
- 보안 권고: https://github.com/advisories/GHSA-w74x-v6f9-j3xg
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;ajv&gt;fast-uri
  - .&gt;@modelcontextprotocol/sdk&gt;ajv-formats&gt;ajv&gt;fast-uri

## moderate: fast-uri

fast-uri vulnerable to host confusion via unchecked WHATWG host canonicalization

- 영향 버전: &gt;=3.1.3 &lt;3.1.9
- 수정 버전: &gt;=3.1.9
- 설치 버전: 3.1.7
- 보안 권고: https://github.com/advisories/GHSA-wjr9-j795-jxcr
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;ajv&gt;fast-uri
  - .&gt;@modelcontextprotocol/sdk&gt;ajv-formats&gt;ajv&gt;fast-uri

## moderate: hono

Hono: `serveStatic` decodes the request path a second time, leading to bypass of middleware on static paths

- 영향 버전: &gt;=4.12.4 &lt;4.13.11
- 수정 버전: &gt;=4.13.11
- 설치 버전: 4.13.7
- 보안 권고: https://github.com/advisories/GHSA-5r4p-p66f-jhc7
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server&gt;hono
  - .&gt;@modelcontextprotocol/sdk&gt;hono

## moderate: hono

Hono: `mount()` and `app.mount()` can forward a path that bypasses middleware scoped inside the mount prefix

- 영향 버전: &lt;4.13.16
- 수정 버전: &gt;=4.13.16
- 설치 버전: 4.13.7
- 보안 권고: https://github.com/advisories/GHSA-4m76-xfj5-7975
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server&gt;hono
  - .&gt;@modelcontextprotocol/sdk&gt;hono

## moderate: hono

Hono: RegExpRouter skips wildcard middleware for some route sets and for paths with an encoded line terminator

- 영향 버전: &gt;=4.1.4 &lt;=4.13.15
- 수정 버전: &gt;=4.13.16
- 설치 버전: 4.13.7
- 보안 권고: https://github.com/advisories/GHSA-h7mg-cq63-vhpq
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server&gt;hono
  - .&gt;@modelcontextprotocol/sdk&gt;hono

## moderate: hono

Hono: `csrf()` does not check requests sent by hyperlink auditing (`text/ping`)

- 영향 버전: &lt;4.13.16
- 수정 버전: &gt;=4.13.16
- 설치 버전: 4.13.7
- 보안 권고: https://github.com/advisories/GHSA-46wx-v44x-9hh2
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server&gt;hono
  - .&gt;@modelcontextprotocol/sdk&gt;hono

## moderate: hono

Hono: `validator('form')` skips validation for `multipart/form-data` requests with extra parameters

- 영향 버전: &gt;=4.5.1 &lt;=4.13.15
- 수정 버전: &gt;=4.13.16
- 설치 버전: 4.13.7
- 보안 권고: https://github.com/advisories/GHSA-4h7h-rv7c-7m2v
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server&gt;hono
  - .&gt;@modelcontextprotocol/sdk&gt;hono

## moderate: ip-address

ip-address: isInSubnet() and isHostInSubnet() compare addresses of different families as if they shared an address space, allowing an allowlist check to admit an address outside its range

- 영향 버전: &lt;=10.7.0
- 수정 버전: &gt;=10.7.1
- 설치 버전: 10.7.0
- 보안 권고: https://github.com/advisories/GHSA-j6r3-76f7-8jcv
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;ip-address

## moderate: ip-address

ip-address: Address6 builds a parse diagnostic proportional to the input with no length bound, allowing a single long string to stall or crash the process

- 영향 버전: &lt;=10.7.0
- 수정 버전: &gt;=10.7.1
- 설치 버전: 10.7.0
- 보안 권고: https://github.com/advisories/GHSA-h3mg-xc3c-68pw
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;ip-address

## moderate: ip-address

ip-address: Address6 matches a zone identifier in quadratic time ahead of its length limit, allowing a single long string to stall the process

- 영향 버전: &lt;=10.7.3
- 수정 버전: &gt;=10.7.4
- 설치 버전: 10.7.0
- 보안 권고: https://github.com/advisories/GHSA-rxp7-6hxx-x8q5
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;ip-address

## moderate: qs

qs : qs.stringify with arrayFormat 'comma' throws an uncaught TypeError on array elements carrying a non-callable own toString (DoS)

- 영향 버전: &gt;=6.7.0 &lt;=6.16.0
- 수정 버전: &gt;=6.16.1
- 설치 버전: 6.16.0
- 보안 권고: https://github.com/advisories/GHSA-6pq8-jhm2-2vcw
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;express&gt;body-parser&gt;qs
  - .&gt;@modelcontextprotocol/sdk&gt;express&gt;qs
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;express&gt;body-parser&gt;qs
  - .&gt;@modelcontextprotocol/sdk&gt;express-rate-limit&gt;express&gt;qs

## moderate: vite

launch-editor: escapeCmdArgs() omits % escaping on Windows

- 영향 버전: &gt;=8.2.0 &lt;=8.2.3
- 수정 버전: &gt;=8.2.4
- 설치 버전: 8.2.2
- 보안 권고: https://github.com/advisories/GHSA-698v-4r3x-3vcv
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker&gt;vite
  - .&gt;vitest&gt;vite

## moderate: vite

launch-editor: Editor CLI flag misinterpretation causing arbitrary command execution for some editors

- 영향 버전: &gt;=8.2.0 &lt;=8.2.3
- 수정 버전: &gt;=8.2.4
- 설치 버전: 8.2.2
- 보안 권고: https://github.com/advisories/GHSA-r825-w8mm-5pxw
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker&gt;vite
  - .&gt;vitest&gt;vite

## moderate: vite

Vite: Files outside `server.fs.allow` could be served when project paths match system paths on non-Windows machine

- 영향 버전: &gt;=8.2.0 &lt;=8.2.3
- 수정 버전: &gt;=8.2.4
- 설치 버전: 8.2.2
- 보안 권고: https://github.com/advisories/GHSA-rq7h-c2jc-7f22
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker&gt;vite
  - .&gt;vitest&gt;vite

## moderate: vite

Vite: First 4 bytes of files outside of `server.fs` setting is exposed by `?vite-wasm-instance`

- 영향 버전: &gt;=8.2.0 &lt;=8.2.3
- 수정 버전: &gt;=8.2.4
- 설치 버전: 8.2.2
- 보안 권고: https://github.com/advisories/GHSA-vfpm-58rq-9qcg
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker&gt;vite
  - .&gt;vitest&gt;vite

## low: esbuild

esbuild allows arbitrary file read when running the development server on Windows

- 영향 버전: &gt;=0.27.3 &lt;0.28.1
- 수정 버전: &gt;=0.28.1
- 설치 버전: 0.27.7
- 보안 권고: https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- 의존성 경로:
  - .&gt;tsup&gt;bundle-require&gt;esbuild
  - .&gt;tsup&gt;esbuild
  - .&gt;vitest&gt;@vitest/mocker&gt;vite&gt;esbuild
  - .&gt;vitest&gt;vite&gt;esbuild

## low: fast-uri

fast-uri vulnerable to improper path equivalence in relative reference normalization

- 영향 버전: &gt;=3.0.0 &lt;3.1.9
- 수정 버전: &gt;=3.1.9
- 설치 버전: 3.1.7
- 보안 권고: https://github.com/advisories/GHSA-xhq7-xmqj-769h
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;ajv&gt;fast-uri
  - .&gt;@modelcontextprotocol/sdk&gt;ajv-formats&gt;ajv&gt;fast-uri

## low: fast-uri

fast-uri vulnerable to scheme injection via an unescaped first-segment colon in suffix references

- 영향 버전: &gt;=3.0.0 &lt;3.1.9
- 수정 버전: &gt;=3.1.9
- 설치 버전: 3.1.7
- 보안 권고: https://github.com/advisories/GHSA-333x-w4r6-6crp
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;ajv&gt;fast-uri
  - .&gt;@modelcontextprotocol/sdk&gt;ajv-formats&gt;ajv&gt;fast-uri

## low: hono

Hono: `css` helper does not escape a closing tag split between the template and an interpolated value, allowing HTML injection

- 영향 버전: &gt;=3.12.0 &lt;=4.13.15
- 수정 버전: &gt;=4.13.16
- 설치 버전: 4.13.7
- 보안 권고: https://github.com/advisories/GHSA-3gg2-335m-rxc6
- 의존성 경로:
  - .&gt;@modelcontextprotocol/sdk&gt;@hono/node-server&gt;hono
  - .&gt;@modelcontextprotocol/sdk&gt;hono

## low: vite

Vite: Cross origin script execution through Vite custom middleware

- 영향 버전: &gt;=8.2.0 &lt;=8.2.3
- 수정 버전: &gt;=8.2.4
- 설치 버전: 8.2.2
- 보안 권고: https://github.com/advisories/GHSA-9jrq-w75r-8gcw
- 의존성 경로:
  - .&gt;vitest&gt;@vitest/mocker&gt;vite
  - .&gt;vitest&gt;vite
