# button × KWCAG 2.2 매핑

> 기준: 킷 v1.1.0(d6bb184) · KWCAG 2.2(KS X OT0003) · axe-core v4.13.0 · 여기 없는 항목은 전부 N/A. 공통 규칙·부록은 ../component-kwcag-map.md 참조

## krds:button (버튼)

- 검토 파일: `html/code/button.html`, `button_hierarchy.html`, `button_icon.html`, `button_size.html`, `button_text.html`, `button_with_icon.html` (6파일 전수)
- 변형: hierarchy(primary/secondary/tertiary), icon(아이콘 전용), size(xsmall~xlarge), text, with_icon

### ① 자동 충족

| KWCAG                                          | 근거                                                                                                                          |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| kwcag:6.5.2 | 네이티브 `<button>` — 브라우저 기본 활성이 업 이벤트 기반이며 다운 상태 이탈 시 미실행. checkbox·radio·select·toggle_switch와 동일 기준 (사용자가 mousedown 핸들러를 직접 다는 경우는 컴포넌트 밖 문제) |
| kwcag:6.1.1                                    | 전 변형이 네이티브 `<button type="button">` — 키보드 초점·Enter/Space 활성이 브라우저 보장                                    |
| kwcag:5.1.1 (#text, #with_icon)                | 아이콘이 빈 `<i class="svg-icon">` + CSS 배경 — 접근성 트리에 미노출, 버튼의 가시 텍스트가 이름을 제공. #icon 변형은 ②로 분리 |
| kwcag:6.5.3 (#text, #with_icon 등 텍스트 변형) | 접근 가능한 이름 = 요소 콘텐츠(가시 텍스트) — 가시 레이블이 네임에 자동 포함. #icon 변형은 가시 레이블 없음(해당 없음)        |

### ② 조건부 — 필수 입력

| KWCAG               | 필수 입력 필드           | 검증 규칙                                                                                                                                  |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| kwcag:8.2.1         | buttonText (텍스트 변형) | 비어있음 금지 (axe:button-name). 이름 외 role·state는 네이티브 `<button>`이 자동 제공                                                      |
| kwcag:5.1.1 (#icon) | accessibleName           | 킷 패턴 `<span class="sr-only">검색</span>` 슬롯 필수. 비어있음 금지, 아이콘 모양·파일명 서술 금지, 기능 서술 (예: "입력한 비밀번호 보기") |
| kwcag:8.1.1         | (id 사용 시) id          | 페이지 내 유일. 킷 기본 버튼 마크업은 id 없음 — 사용자가 붙일 때만 해당                                                                    |

### ③ 범위 밖 — 위임

| KWCAG       | 위임처                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------- |
| kwcag:5.4.3 | axe:color-contrast — hierarchy·disabled 변형별 색 조합은 렌더링 시 검사 (disabled는 관행상 대비 요건 제외) |
| kwcag:6.1.2 | 수동 체크 — 초점 링 시각 표시는 킷 CSS 렌더링 확인 필요                                                    |
| kwcag:6.1.3 | axe:target-size (옵트인 활성화 필요) — 특히 #xsmall/#small 변형과 #icon 변형의 터치 타깃 크기              |

### 미분류 (?)

| KWCAG | 질문 |
| ----- | ---- |
| —     | 없음 |

- 위에 없는 항목: 전부 N/A

---
