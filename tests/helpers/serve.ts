// 테스트용 로컬 서빙 — 저장소 파일(템플릿·킷)과 테스트가 임시 폴더에 만든 페이지를 함께 연다
import { tmpdir } from "node:os";
import { serveLocal } from "../../src/server/serve-local.js";

export const serveForTests = () => serveLocal([process.cwd(), tmpdir()]);
