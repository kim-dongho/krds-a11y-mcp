// file:// 검사 대상을 일회용 로컬 http로 서빙한다 — validate_page·inspect_page 공용
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { extname } from "node:path";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

/**
 * 로컬 파일 검사를 위한 일회용 정적 서버 (127.0.0.1, 임의 포트).
 * file://로 열면 브라우저 CORS 정책이 mask-image·XHR을 전부 막아
 * 정상 파일까지 로드 실패로 보고된다 — http로 서빙해야 404가 진짜 404가 된다.
 */
export async function serveLocal(): Promise<{ server: Server; origin: string }> {
  const server = createServer((req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
      if (!existsSync(path) || !statSync(path).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
      createReadStream(path).pipe(res);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((ok) => server.listen(0, "127.0.0.1", ok));
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  return { server, origin: `http://127.0.0.1:${port}` };
}
