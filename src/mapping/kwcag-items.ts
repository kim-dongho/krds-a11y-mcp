import type { Coverage } from "../report/types.js";

export type KwcagItem = {
  id: string; // "kwcag:5.1.1"
  name: string;
  principle: "인식" | "운용" | "이해" | "견고";
  coverage: Coverage; // docs/mapping/kwcag-wcag-axe.md 커버리지 열이 원본
  manualHow?: string; // coverage none일 때 수동 확인 요지 (번역표 부록 A)
};

// 원본: docs/mapping/kwcag22-items.md (33항목) + kwcag-wcag-axe.md (커버리지)
// tests/mapping.test.ts가 문서와 이 데이터를 양방향 대조한다
export const KWCAG_ITEMS: KwcagItem[] = [
  { id: "kwcag:5.1.1", name: "적절한 대체 텍스트 제공", principle: "인식", coverage: "partial" },
  { id: "kwcag:5.2.1", name: "자막 제공", principle: "인식", coverage: "partial" },
  { id: "kwcag:5.3.1", name: "표의 구성", principle: "인식", coverage: "partial" },
  { id: "kwcag:5.3.2", name: "콘텐츠의 선형구조", principle: "인식", coverage: "none", manualHow: "스크린리더/CSS 제거 상태에서 읽기 순서 확인" },
  { id: "kwcag:5.3.3", name: "명확한 지시사항 제공", principle: "인식", coverage: "none", manualHow: "지시문이 색·모양·위치 없이 성립하는지 검토" },
  { id: "kwcag:5.4.1", name: "색에 무관한 콘텐츠 인식", principle: "인식", coverage: "partial" },
  { id: "kwcag:5.4.2", name: "자동 재생 금지", principle: "인식", coverage: "partial" },
  { id: "kwcag:5.4.3", name: "텍스트 콘텐츠의 명도 대비", principle: "인식", coverage: "partial" },
  { id: "kwcag:5.4.4", name: "콘텐츠 간의 구분", principle: "인식", coverage: "none", manualHow: "이웃 콘텐츠 경계의 시각적 구분 검토" },
  { id: "kwcag:6.1.1", name: "키보드 사용 보장", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.1.2", name: "초점 이동과 표시", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.1.3", name: "조작 가능", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.1.4", name: "문자 단축키", principle: "운용", coverage: "none", manualHow: "단축키 목록화 후 해제·재설정 수단 확인" },
  { id: "kwcag:6.2.1", name: "응답시간 조절", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.2.2", name: "정지 기능 제공", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.3.1", name: "깜빡임과 번쩍임 사용 제한", principle: "운용", coverage: "none", manualHow: "깜빡이는 콘텐츠 유무 및 빈도 확인" },
  { id: "kwcag:6.4.1", name: "반복 영역 건너뛰기", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.4.2", name: "제목 제공", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.4.3", name: "적절한 링크 텍스트", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.4.4", name: "고정된 참조 위치 정보", principle: "운용", coverage: "none", manualHow: "(전자출판문서 한정) 페이지 이동·참조 위치 확인" },
  { id: "kwcag:6.5.1", name: "단일 포인터 입력 지원", principle: "운용", coverage: "none", manualHow: "제스처 기능의 단일 포인터 대체 수단 확인" },
  { id: "kwcag:6.5.2", name: "포인터 입력 취소", principle: "운용", coverage: "none", manualHow: "클릭 다운 상태에서 이탈 시 실행 취소 확인" },
  { id: "kwcag:6.5.3", name: "레이블과 네임", principle: "운용", coverage: "partial" },
  { id: "kwcag:6.5.4", name: "동작기반 작동", principle: "운용", coverage: "none", manualHow: "동작 기반 기능의 UI 대체·감지 해제 확인" },
  { id: "kwcag:7.1.1", name: "기본 언어 표시", principle: "이해", coverage: "full" },
  { id: "kwcag:7.2.1", name: "사용자 요구에 따른 실행", principle: "이해", coverage: "none", manualHow: "초점 이동·입력만으로 새 창/이동이 없는지 확인" },
  { id: "kwcag:7.2.2", name: "찾기 쉬운 도움 정보", principle: "이해", coverage: "none", manualHow: "도움 정보의 페이지 간 위치 일관성 확인" },
  { id: "kwcag:7.3.1", name: "오류 정정", principle: "이해", coverage: "none", manualHow: "오류 발생 시 안내·정정 수단 확인" },
  { id: "kwcag:7.3.2", name: "레이블 제공", principle: "이해", coverage: "partial" },
  { id: "kwcag:7.3.3", name: "접근 가능한 인증", principle: "이해", coverage: "none", manualHow: "인증 과정의 인지 테스트 의존·대체 수단 확인" },
  { id: "kwcag:7.3.4", name: "반복 입력 정보", principle: "이해", coverage: "partial" },
  { id: "kwcag:8.1.1", name: "마크업 오류 방지", principle: "견고", coverage: "partial" },
  { id: "kwcag:8.2.1", name: "웹 애플리케이션 접근성 준수", principle: "견고", coverage: "partial" },
];

export const KWCAG_BY_ID: ReadonlyMap<string, KwcagItem> = new Map(
  KWCAG_ITEMS.map((i) => [i.id, i]),
);
