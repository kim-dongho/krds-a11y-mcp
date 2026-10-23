// file:// 검사 대상을 일회용 로컬 http로 서빙한다 — validate_page·inspect_page 공용
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { dirname, extname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
 * 서빙은 roots(기본: 프로젝트 루트) 아래로만 — 검사하는 동안 같은 기기의 다른 프로세스나 페이지가
 * 파일 시스템 전체를 읽을 수 있던 문제. 밖의 경로는 403
 */
export async function serveLocal(roots: string[] = [process.cwd()]): Promise<{ server: Server; origin: string }> {
  const allowed = roots.map((r) => resolve(r));
  const inside = (p: string) =>
    allowed.some((root) => {
      const rel = relative(root, p);
      return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
    });
  const server = createServer((req, res) => {
    try {
      const path = resolve(decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname));
      if (!inside(path)) {
        res.writeHead(403).end();
        return;
      }
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

/**
 * 검사 대상 주소를 브라우저가 열 주소로 바꾼다 — file://이면 일회용 로컬 http로 서빙한다(CORS 잡음 제거, 404를 진짜 404로).
 * 서빙 범위는 프로젝트 루트와 검사 파일 폴더(html 문자열 검사는 임시 폴더)뿐이다. 다 쓰면 close()를 부른다
 */
export async function openTarget(url: string): Promise<{ url: string; close: () => void }> {
  if (!url.startsWith("file://")) return { url, close: () => {} };
  const path = fileURLToPath(url);
  const local = await serveLocal([process.cwd(), dirname(path)]);
  return { url: local.origin + path, close: () => local.server.close() };
}
