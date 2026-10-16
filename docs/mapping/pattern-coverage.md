# 패턴 템플릿 커버리지 (샘플 33종 → 템플릿 11종)

> 2026-09-15 확정. KRDS 공식 패턴 샘플 33종 전수를 조사해 템플릿 11종으로 접었다.
> "접음"의 기준: 같은 화면의 상태·조합 변형은 대표 1종 + 콘텐츠 자유 영역으로 재현 가능해야 한다.
> 템플릿별 교정·출처는 `templates/<이름>.meta.json`, 감사 결과는 `pattern-audit.md`.

## 템플릿 11종 (+ 뼈대 위임 1)

| 템플릿 | 계열(family) | 대표 샘플 | 함께 커버하는 샘플 (접은 근거) |
|---|---|---|---|
| login-select | login | login_01 | — |
| login-id | login | login_0101 | — |
| login-tabs | login | login_02 | — |
| apply-list | apply | appl_01 | appl_0101·0102·0103 (탭 상태 변형) · **quest_01·0101·02** (동일 뼈대: 검색+목록+페이지네이션) |
| apply-detail | apply | appl_02 | appl_0201 (탭 구성 변형) |
| apply-form | apply | appl_0304 | appl_03·0305 (같은 4단계 흐름의 단계 상태) · **move_process_03·04·05** (전입신고 단계 화면 — 동일 구조) |
| apply-issue | apply | appl_0301 | appl_0302·0303 (발급 대상만 다른 동일 폼) |
| apply-complete | apply | appl_04 | — |
| search-results | search | search_02 | **quest_0102** (좌측 필터 패널 확장형 — 필터는 콘텐츠 확장으로 재현) |
| main-portal | main | main_03 | main_01·0101·0102 (배너+탭 소식형) · main_02·0201 (복합형) · main_0301 — 전부 같은 구획(배너·자주찾는 메뉴·소식·서비스)의 조합 차이, main-sect 복제로 재현 |
| sub-page | sub | sub_02 | — |
| (템플릿 없음) | — | sub_01 | 빈 레이아웃 스켈레톤 — get_page_scaffold의 빈 뼈대가 동일 역할 |

## 검산

- 샘플 총 33종 = 로그인 3 + 신청 13 + 검색 1 + 메인 7 + 서브 2 + 탐색(quest) 4 + 이사 단계(move_process) 3
- 대표 11 + 접힘 21 + 뼈대 위임 1 = 33 ✓

## 유보 사항

- **search-results의 분류 탭**: 킷 탭 결함(수정 예고)으로 미동봉 — login-tabs에서 확립한 우회 기법(킷 JS 비활성화 + 보정 스크립트)으로 복원 가능, 수요 시 적용
- **캐러셀(스와이퍼) 배너**: main-portal에서 정적 배너 자리로 대체 — 일시정지 등 접근성 요건이 큰 부품이라 컴포넌트 공급(get_component) 경로로 다룬다
- 킷 v1.1.0 개정 또는 krds.go.kr 샘플 개정 시(`collect:patterns` 해시 감지) 이 표를 재검토한다
